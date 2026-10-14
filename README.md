# Cadence

A life planner and live tracker. Cadence holds your plan (a weekly timetable, training sessions,
learning phases, languages, rotating blocks, rules) and lets you tick off each block as the day goes,
log sessions, games, flashcards and sleep, and review the week. Everything syncs in real time across
laptop, phone and PC, and works offline.

It ships with the **Life & Learning plan, Oct 2026 – Apr 2027** pre-loaded. Every part of the plan is
editable in the **Plan** tab, and you can start new plans for later seasons while keeping your history.

## Features

- **Today**: the day's timetable with a live "right now" card, tick boxes, XP per block, and widgets for
  training logs, games with a stop rule, flashcard counts, weekly builds, meal prep and sleep.
- **Week**: completion per day, hours per pursuit against the plan, a busy-week switch, weekly quests.
- **Progress**: levels and ranks, per-pursuit skill levels, streaks, quests and badges. All XP is derived
  from what you logged, so it is the same on every device.
- **Programs**: ML phases and milestones, the training decision and session log, music stages and
  production, language schedule, games, reading list, food, rotation.
- **Review**: the Sunday questions, rules for a bad week, and a warning when a pursuit slips three weeks running.
- **Plan**: edit pursuits, the timetable for each weekday, training sessions, phases, languages,
  rotating blocks, breaks, programs and rules. Multiple plans, each covering its own dates.

## Stack

- Plain HTML, CSS and JavaScript. No build step.
- [Supabase](https://supabase.com) Postgres for storage, auth (email and password) and realtime sync.
  Every table uses row-level security so each account only ever sees its own rows.
- A service worker caches the app so it opens offline; changes made offline sync when you reconnect.
- Installable as an app (PWA) on iOS, Android and desktop.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | Styles and light/dark themes |
| `app.js` | Plan logic, sync engine, gamification and all screens |
| `config.js` | Supabase project URL and public anon key |
| `sw.js`, `manifest.webmanifest`, `icon*` | Offline support and install metadata |
| `vendor/supabase-2.45.4.js` | Supabase JS client (MIT), vendored so the app works offline |
| `supabase/schema.sql` | Database schema, policies and realtime setup |

## Running locally

Serve the folder with any static server, for example:

```sh
npx serve .
```

## Deploying

The repo deploys as a static site (Vercel, Netlify, GitHub Pages or anything similar). On Vercel,
import the repo with no framework preset and no build command.

## Supabase setup

1. Create a project and run `supabase/schema.sql` in the SQL editor.
2. Put the project URL and anon key in `config.js`.
3. In **Authentication → URL Configuration**, set the **Site URL** to the deployed address and add it to
   the redirect allow list, so confirmation and password-reset emails link back to the app.

## Data model

| Table | Holds |
| --- | --- |
| `plans` | Name, dates and settings (training sessions, decision, programs, stages, rules, deload) |
| `pursuits` | The lanes of a plan, with colour and tracking flags |
| `blocks` | The weekly timetable, one row per block per weekday |
| `periods` | Phases, languages, breaks and rotating blocks |
| `resources` | Links for a plan |
| `block_ticks` | One row per finished block per day |
| `day_logs` | Flashcards, warm-up, game results and sleep times per day |
| `training_sessions` | Logged sessions with type, minutes, distance and effort |
| `weeks` | Busy flag, weekly build, loop, meal prep, recipe, VOD focus and review per week |
| `milestone_checks` | Ticked milestone items |
| `books` | Reading list |
| `prefs` | Current song, theory and ear-training stages, theme |
