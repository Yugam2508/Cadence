// Cadence assistant: an authenticated proxy to the OpenAI API.
// The app runs the tools itself (they change the user's data through the same code as the buttons),
// so this function only holds the API key, fixes the model, system prompt and tool list,
// checks the caller is allowed, and keeps a daily request count.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@7.25.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-mini";
const EFFORT = Deno.env.get("OPENAI_REASONING_EFFORT") ?? "low";
const DAILY_LIMIT = Number(Deno.env.get("ASSISTANT_DAILY_LIMIT") ?? "400");

const SYSTEM = `You are the assistant inside Cadence, the user's personal life planner. The user talks to you to log what they did, check how they're doing, and change their plan. You act through tools that change the app's real data. Changes sync to all of the user's devices and earn XP in the app's progress system.

How the app is organised:
- A plan covers a date range. It holds pursuits (the lanes, such as ML, training or guitar), a weekly timetable, training sessions, milestone phases, languages, breaks, rotating blocks, programs and rules. The timetable is "template": keys "0" (Sunday) to "6" (Saturday), each an array of blocks. A block has id, s (start, HH:MM), e (end, HH:MM; "00:00" means midnight), cat (a pursuit id), title, detail, h (hours, null means the block's length), session (true takes title, detail and hours from the training sessions), extra (widget: "", "log", "games", "cards", "build", "meals", "sleep"), busy ("keep", "min" or "drop" in a busy week), busyDetail and busyH.
- Titles and details can contain placeholders the app fills in: {phase}, {language}, {rotation}, {rotation-note}, {song}, {theory}, {ear}, and {session} / {session-detail} for training blocks.
- Training has base sessions per weekday and an alternative column used between the decision date and the "until" date if the decision is yes.
- Each date uses the plan whose dates cover it. Tracked blocks are ticked done per date by block id. Untracked blocks (routine, work, sleep, free time) cannot be ticked.
- Progress (XP, streaks, quests and stats) counts from a "count from" date. Days before it are a preview: they can't be ticked and don't count. The state message gives the date and explains week numbering.
- Per-date logs: new flashcards, game results (a string of W, L, D), warm-up, and sleep (bed and wake times for the night that ends on that date). Per-week logs, keyed by the Monday: busy week, weekly build, production loop finished, meals prepped, new recipe, VOD focus, and the three review answers. Also training sessions, milestone ticks and a reading list.
- After each user message there is a system message with the live app state. It is the current truth; prefer it over anything earlier in the conversation.
- You have no memory outside this conversation and the app's data. The app only changes when you change its data with a tool. Never say you will remember something, count from a date, or treat something differently later; make the change now with a tool, or say plainly that the app can't do it.

How to act:
- Logging is low-stakes and the user can undo any of your changes with one tap, so act directly instead of asking for confirmation. Resolve relative dates ("yesterday", "on Sunday", "last night") from the date in the state message. Ask one short question only when something is genuinely ambiguous, such as which of two blocks they mean.
- When the user says they did something, tick the matching block and log the details the app can hold. log_training also ticks that day's training block.
- Log only what the user told you happened. Don't fill in numbers they didn't give.
- For plan changes, call get_plan for the sections you need, then edit_plan with precise operations, changing only what was asked. A timetable change applies to every week the plan covers. If the user seems to want a change for just one day or week, say so and ask before changing the plan; a busy week is the built-in way to lighten a single week.
- To restart counting from a date, call set_tracking_start. If the user also wants the plan itself to begin then, move the plan's start and, if they should begin then too, its first phase, language and rotating block with one edit_plan call. Earlier days stay saved but stop counting; delete their logs with clear_logs only if the user asks for that.
- Delete logged data with clear_logs only when the user asks for that.
- Respect the plan's rules, for example that a missed session is skipped rather than stacked. If the user asks for something that breaks a rule, mention the rule once, then do what they decide.
- For questions such as "how's my week going?", use get_progress or get_history and answer with the few numbers that matter.
- After acting, reply in one or two short sentences saying what changed, in plain words: block names and dates, never ids, paths or JSON. Mention XP only when it is notable, such as a streak or a perfect day. Write times in 24-hour format. No emoji.
- If a tool returns an error, correct the call, or tell the user plainly what is wrong.`;

const date = { type: "string", description: "Date as YYYY-MM-DD in the user's local calendar." };
const TOOL_DEFS = [
  {
    name: "get_day",
    description: "Read one date: its blocks (id, times, title, pursuit, tracked, dropped, done), flashcards, games, warm-up, sleep and training sessions. Use it before ticking blocks on a date other than today, whose blocks are already in the state message.",
    input_schema: { type: "object", properties: { date }, required: ["date"] },
  },
  {
    name: "update_day",
    description: "Change one date's logs: tick or untick blocks, set or add flashcards, record game results and warm-up, and record sleep. Only include the fields that change.",
    input_schema: {
      type: "object",
      properties: {
        date,
        done: { type: "array", items: { type: "string" }, description: "Block ids to mark done." },
        undone: { type: "array", items: { type: "string" }, description: "Block ids to mark not done." },
        cards: { type: "integer", description: "Set the number of new flashcards for the date." },
        add_cards: { type: "integer", description: "Add to the number of new flashcards." },
        warmup: { type: "boolean", description: "Whether the warm-up or aim routine was done." },
        games: { type: "string", description: "Results to append in order, using W, L and D, e.g. \"WLL\"." },
        games_replace: { type: "string", description: "Replace all of the date's results with this string of W, L and D." },
        sleep_bed: { type: "string", description: "Bedtime for the night ending on this date, HH:MM 24-hour. Empty string clears it." },
        sleep_wake: { type: "string", description: "Wake time on this date, HH:MM 24-hour. Empty string clears it." },
      },
      required: ["date"],
    },
  },
  {
    name: "log_training",
    description: "Log a training session. Also ticks that date's training block if it has one.",
    input_schema: {
      type: "object",
      properties: {
        date,
        type: { type: "string", enum: ["Run", "Bike", "Swim", "Brick", "Strength", "Other"] },
        minutes: { type: "integer", minimum: 1, maximum: 900 },
        km: { type: "number", minimum: 0 },
        rpe: { type: "integer", minimum: 1, maximum: 10, description: "Perceived effort, 1 to 10." },
        note: { type: "string" },
      },
      required: ["date", "type", "minutes"],
    },
  },
  {
    name: "delete_training",
    description: "Delete a logged training session by its id.",
    input_schema: { type: "object", properties: { session_id: { type: "string" } }, required: ["session_id"] },
  },
  {
    name: "update_week",
    description: "Change the logs for the week containing a date (weeks start on Monday). Only include the fields that change.",
    input_schema: {
      type: "object",
      properties: {
        date: { ...date, description: "Any date in the week, YYYY-MM-DD." },
        busy: { type: "boolean", description: "Busy week: drop to minimums." },
        build: { type: "string", description: "What the user built this week." },
        loop_done: { type: "boolean", description: "Production loop finished." },
        meals_prepped: { type: "integer", minimum: 0, maximum: 14 },
        recipe: { type: "string", description: "This week's new recipe." },
        vod_focus: { type: "string", description: "The one pattern to fix from VOD review." },
        review_done: { type: "string", description: "Weekly review: what got done." },
        review_slipped: { type: "string", description: "Weekly review: what slipped and why." },
        review_change: { type: "string", description: "Weekly review: what changes next week." },
      },
      required: ["date"],
    },
  },
  {
    name: "manage_books",
    description: "Change the reading list: add a book, start one, mark one finished, add the one-line note, or remove one.",
    input_schema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "start", "finish", "note", "remove"] },
        title: { type: "string", description: "Book title. Required for add; for other actions, use book_id or a title that matches one book." },
        book_id: { type: "string" },
        line: { type: "string", description: "The one-line note for a finished book." },
      },
      required: ["action"],
    },
  },
  {
    name: "update_progress",
    description: "Tick or untick milestone items, set the song being learned, set the theory or ear-training stage, or answer the plan's decision question.",
    input_schema: {
      type: "object",
      properties: {
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: { phase_id: { type: "string" }, item_index: { type: "integer", minimum: 0 }, done: { type: "boolean" } },
            required: ["phase_id", "item_index", "done"],
          },
        },
        song: { type: "string" },
        theory_stage: { type: "string", description: "Name of the theory stage, e.g. \"Intervals\"." },
        ear_stage: { type: "string", description: "Name of the ear-training stage." },
        decision: { type: "string", enum: ["yes", "no", "undecided"] },
      },
    },
  },
  {
    name: "get_plan",
    description: "Read a plan as JSON so you can edit it. Ask only for the sections you need.",
    input_schema: {
      type: "object",
      properties: {
        plan_id: { type: "string", description: "Defaults to the plan covering today." },
        sections: {
          type: "array",
          items: { type: "string", enum: ["basics", "pursuits", "template", "training", "phases", "languages", "breaks", "rotation", "resources", "modules", "stages", "rules"] },
        },
      },
    },
  },
  {
    name: "edit_plan",
    description: "Edit a plan with operations on its JSON. Paths are dot-separated, matching get_plan output, e.g. \"template.2.5.title\", \"rotation.1.end\", \"training.base.6.detail\". set replaces the value at a path; insert adds value to the array at path (at index, or at the end); remove deletes the array element at path, e.g. \"template.4.7\". Operations apply in order, so later indices see earlier changes. The whole edit is validated before anything is saved.",
    input_schema: {
      type: "object",
      properties: {
        plan_id: { type: "string", description: "Defaults to the plan covering today." },
        operations: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              op: { type: "string", enum: ["set", "insert", "remove"] },
              path: { type: "string" },
              value: {
                description: "New value for set or insert.",
                anyOf: [
                  { type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" },
                  { type: "object", additionalProperties: true },
                  { type: "array", items: { anyOf: [{ type: "string" }, { type: "number" }, { type: "object", additionalProperties: true }] } },
                ],
              },
              index: { type: "integer", minimum: 0, description: "Insert position. Defaults to the end." },
            },
            required: ["op", "path"],
          },
        },
        summary: { type: "string", description: "A short description of the change for the user, e.g. \"Moved Valorant to 21:00 on Mondays\"." },
      },
      required: ["operations", "summary"],
    },
  },
  {
    name: "create_plan",
    description: "Create a new plan, either copying an existing plan's pursuits, timetable, training and programs, or blank.",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["copy", "blank"] },
        name: { type: "string" },
        start: date,
        end: date,
        from_plan_id: { type: "string", description: "Plan to copy. Defaults to the plan covering today." },
      },
      required: ["mode", "name", "start", "end"],
    },
  },
  {
    name: "set_tracking_start",
    description: "Set the date progress counts from (XP, streaks, quests and stats). Days before it become a preview and stop counting; nothing is deleted. Use it when the user wants to restart or start counting from a date.",
    input_schema: { type: "object", properties: { date }, required: ["date"] },
  },
  {
    name: "clear_logs",
    description: "Delete everything logged on a range of dates: ticked blocks, flashcards, games, warm-ups, sleep and training sessions. Plans, weekly notes, books and milestones are kept. Use only when the user asks to delete or reset logged data.",
    input_schema: { type: "object", properties: { from: date, to: date }, required: ["from", "to"] },
  },
  {
    name: "get_history",
    description: "Summarise a date range (at most 62 days): blocks done per day, hours done against planned, and the day's logs.",
    input_schema: { type: "object", properties: { from: date, to: date }, required: ["from", "to"] },
  },
  {
    name: "get_progress",
    description: "Read the progress system: level, XP, streaks, per-pursuit skills, this week's quests, badges, and pursuits that have slipped three weeks running.",
    input_schema: { type: "object", properties: {} },
  },
];
const TOOLS = TOOL_DEFS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed", message: "Use POST." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply(401, { error: "not_signed_in", message: "Sign in to use the assistant." });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: access } = await admin.from("assistant_access").select("email").eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
  if (!access) return reply(403, { error: "not_enabled", message: "The assistant isn't enabled for this account." });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return reply(503, { error: "no_key", message: "The assistant has no API key yet. Add OPENAI_API_KEY to the Edge Function secrets in Supabase." });

  let messages: unknown;
  try {
    messages = (await req.json())?.messages;
  } catch {
    return reply(400, { error: "bad_request", message: "The request body must be JSON." });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 600 || JSON.stringify(messages).length > 2_000_000) {
    return reply(400, { error: "bad_request", message: "The conversation is missing or too long. Start a new chat." });
  }

  const day = new Date().toISOString().slice(0, 10);
  const { data: usage } = await admin.from("assistant_usage").select("*").eq("user_id", user.id).eq("day", day).maybeSingle();
  if (usage && usage.requests >= DAILY_LIMIT) {
    return reply(429, { error: "daily_limit", message: `You've reached today's limit of ${DAILY_LIMIT} assistant requests. It resets at 08:00 Singapore time.` });
  }

  const roles = new Set(["user", "assistant", "system", "tool"]);
  // deno-lint-ignore no-explicit-any
  if (!(messages as any[]).every((m) => m && roles.has(m.role))) return reply(400, { error: "bad_request", message: "The conversation has an invalid message." });

  const client = new OpenAI({ apiKey });
  // deno-lint-ignore no-explicit-any
  const params: any = {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM }, ...(messages as unknown[])],
    tools: TOOLS,
    tool_choice: "auto",
    reasoning_effort: EFFORT,
    max_completion_tokens: 8000,
    prompt_cache_key: "cadence-" + user.id,
  };
  try {
    // deno-lint-ignore no-explicit-any
    let res: any;
    try {
      res = await client.chat.completions.create(params);
    } catch (e) {
      // Some models don't take reasoning_effort; retry once without it.
      if (e instanceof OpenAI.BadRequestError && /reasoning/i.test(e.message)) {
        delete params.reasoning_effort;
        res = await client.chat.completions.create(params);
      } else throw e;
    }
    const choice = res.choices?.[0];
    const m = choice?.message ?? {};
    const message: Record<string, unknown> = { role: "assistant", content: m.content ?? null };
    // deno-lint-ignore no-explicit-any
    if (m.tool_calls?.length) message.tool_calls = m.tool_calls.map((tc: any) => ({ id: tc.id, type: "function", function: { name: tc.function?.name, arguments: tc.function?.arguments ?? "{}" } }));
    if (m.refusal) message.content = m.refusal;
    const u = res.usage ?? {};
    await admin.from("assistant_usage").upsert({
      user_id: user.id,
      day,
      requests: (usage?.requests ?? 0) + 1,
      input_tokens: (usage?.input_tokens ?? 0) + (u.prompt_tokens ?? 0),
      output_tokens: (usage?.output_tokens ?? 0) + (u.completion_tokens ?? 0),
    }, { onConflict: "user_id,day" });
    return reply(200, { message, finish_reason: choice?.finish_reason ?? null, model: res.model });
  } catch (e) {
    if (e instanceof OpenAI.AuthenticationError) return reply(502, { error: "bad_key", message: "The OpenAI API key was rejected. Check the OPENAI_API_KEY secret in Supabase." });
    if (e instanceof OpenAI.RateLimitError) {
      const quota = /quota|billing|credit/i.test(e.message);
      return reply(429, { error: quota ? "no_credit" : "rate_limited", message: quota ? "Your OpenAI credit has run out or hit its limit. Top up at platform.openai.com." : "OpenAI is rate limiting requests. Try again in a minute." });
    }
    if (e instanceof OpenAI.NotFoundError) return reply(502, { error: "bad_model", message: `The model ${MODEL} isn't available to this API key. Set OPENAI_MODEL to one it can use.` });
    if (e instanceof OpenAI.BadRequestError) return reply(400, { error: "bad_request", message: e.message });
    if (e instanceof OpenAI.APIError) return reply(502, { error: "upstream", message: `OpenAI returned an error (${e.status ?? "unknown"}). Try again shortly.` });
    return reply(500, { error: "server_error", message: "The assistant hit an unexpected error." });
  }
});
