(()=>{
'use strict';
/* =====================================================================
   Helpers
   ===================================================================== */
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_ORDER=[1,2,3,4,5,6,0];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TTYPES=['Run','Bike','Swim','Brick','Strength','Other'];
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>iso(new Date());
const mondayOf=s=>{const d=parse(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const fmtDate=s=>{const d=parse(s);return DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()]};
const fmtShort=s=>{if(!s)return '—';const d=parse(s);return d.getDate()+' '+MON[d.getMonth()]};
const fmtLong=s=>{if(!s)return '—';const d=parse(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()};
const toMin=t=>{const [h,m]=String(t||'0:0').split(':').map(Number);return (h||0)*60+(m||0)};
const endMin=b=>{const e=toMin(b.e);return (e===0||e<=toMin(b.s))?1440:e};
const fmtEnd=e=>(e==='24:00')?'00:00':e;
const fmtH=h=>{const m=Math.round(h*60);if(m<60)return m+'m';const hh=Math.floor(m/60),mm=m%60;return hh+'h'+(mm?pad(mm):'')};
const fmtClock=min=>{min=((Math.round(min)%1440)+1440)%1440;return pad(Math.floor(min/60))+':'+pad(min%60)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6);
const clone=o=>JSON.parse(JSON.stringify(o));
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function setPath(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++){if(x[k[i]]==null)x[k[i]]=/^\d+$/.test(k[i+1])?[]:{};x=x[k[i]]}x[k[k.length-1]]=v}
function stable(v){
 if(v===undefined)return 'u';
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
 return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
}
const LS={get(k){try{const v=localStorage.getItem(k);return v==null?null:JSON.parse(v)}catch(e){return null}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* =====================================================================
   The starting plan: Life & Learning, Oct 2026 – Apr 2027
   ===================================================================== */
function defaultPlan(){
 const B=(id,s,e,cat,title,detail,o)=>Object.assign({id,s,e,cat,title,detail:detail||'',h:null,session:false,extra:'',busy:'keep',busyDetail:'',busyH:null},o||{});
 const sleep=()=>B('sleep','00:00','08:00','sleep','Sleep','Target 8 hours. Log when you actually slept.',{extra:'sleep'});
 const lang=()=>B('lang','22:00','22:25','lang','{language}','10 min flashcards (about 10 new cards) + 15 min grammar or one short reading',{extra:'cards',busy:'min',busyDetail:'Flashcards only this week',busyH:10/60});
 const read=()=>B('read','22:30','00:00','read','Reading','30–45 min of fiction or general non-fiction. Paper or e-ink, phone away.',{h:.6});
 const weekday=wd=>{
  const t=[sleep(),
   B('train','08:00','09:00','iron','{session}','{session-detail}',{session:true,extra:'log',busy:'drop',busyDetail:'Busy week: only the two long sessions'}),
   B('commute','09:00','10:00','life','Shower, breakfast, head to ARL'),
   B('ml','10:00','12:30','ml','ML deep work','{phase}. Kick off ARL AI tasks at 10:00, then reading and small exercises while they run.'),
   B('lunch','12:30','13:30','life','Lunch'),
   B('arl','13:30','17:30','arl','ARL','Review agent output, meetings, PRs'),
   wd===3?B('cook','17:30','19:00','food','Cook from scratch','Proper dinner night. Try one new recipe this week.'):B('dinner','17:30','19:00','life','Home, dinner'),
   (wd===2||wd===4)?B('guitar','19:00','19:45','guitar','Guitar + theory + ear','15 min guitar · 15 min theory: {theory} · 15 min ear training: {ear}',{busy:'min',busyDetail:'20 min guitar. Skip theory and ear training this week.',busyH:1/3})
     :B('guitar','19:00','19:45','guitar','Guitar + ear training','30 min technique and {song} · 15 min ear training: {ear}',{busy:'min',busyDetail:'20 min guitar. Skip ear training this week.',busyH:1/3})];
  if(wd===1||wd===3)t.push(B('valo','20:00','22:00','valo','Valorant','15 min aim routine, then ranked. Stop after two losses in a row.',{extra:'games',busy:wd===1?'keep':'drop',busyDetail:'Busy week: one Valorant session (Monday)'}));
  else if(wd===2||wd===4)t.push(B('rot','20:00','22:00','rot','{rotation}','{rotation-note}',{busy:'drop',busyDetail:'Busy week minimums'}));
  else t.push(B('free','20:00','22:00','free','Free / social','No plan. Guitar optional.'));
  t.push(lang(),read());return t;
 };
 const template={};[1,2,3,4,5].forEach(wd=>template[wd]=weekday(wd));
 template[6]=[sleep(),
  B('train','06:30','09:30','iron','{session}','{session-detail}. Start early; Singapore is coolest before 09:00.',{session:true,extra:'log'}),
  B('rest','10:00','11:00','life','Breakfast, rest'),
  B('mlsat','11:00','13:00','ml','ML project','{phase}. Build one thing that runs end to end from this week’s material.',{extra:'build'}),
  B('lunch','13:00','15:00','free','Lunch, free'),
  B('social','15:00','22:00','free','Free / social','Saturday afternoon and evening stay open for friends.'),
  lang(),read()];
 template[0]=[sleep(),
  B('train','07:00','08:30','iron','{session}','{session-detail}',{session:true,extra:'log'}),
  B('rest','08:30','11:00','life','Breakfast, rest'),
  B('prod','11:00','13:00','prod','Music production','Finish one 60–90 second loop or sketch. Done beats perfect.',{busy:'drop',busyDetail:'Busy week minimums'}),
  B('prep','13:00','15:00','food','Groceries + meal prep','4–5 weekday lunches or dinners. Vegetarian, no eggs, light on rice, built around a protein.',{extra:'meals'}),
  B('admin','15:00','16:00','rot','Admin hour','Trips, photos, playlists',{busy:'drop',busyDetail:'Busy week minimums'}),
  B('valo','16:00','18:00','valo','Valorant + VOD review','Aim routine, ranked, then one VOD review: pick one death pattern and fix only that.',{extra:'games',busy:'drop',busyDetail:'Busy week: one Valorant session (Monday)'}),
  B('eve','18:00','21:30','free','Free'),
  B('review','21:30','21:45','review','Weekly review','What got done, what slipped and why, what changes next week.'),
  lang(),read()];
 const S_=(title,detail,h)=>({title,detail,h});
 return {
  id:'p2026',name:'Life & Learning, Oct 2026 – Apr 2027',start:'2026-10-19',end:'2027-04-04',
  deloadEvery:4,deloadCut:33,
  pursuits:[
   {id:'ml',name:'ML / deep learning',color:1,tracked:true,streak:false,deload:false},
   {id:'iron',name:'Ironman base',color:2,tracked:true,streak:false,deload:true},
   {id:'guitar',name:'Guitar + ear',color:3,tracked:true,streak:true,deload:false},
   {id:'prod',name:'Music production',color:4,tracked:true,streak:false,deload:false},
   {id:'valo',name:'Valorant',color:5,tracked:true,streak:false,deload:true},
   {id:'lang',name:'Language',color:6,tracked:true,streak:true,deload:false},
   {id:'rot',name:'Rotating block',color:7,tracked:true,streak:false,deload:false},
   {id:'food',name:'Cooking + prep',color:8,tracked:true,streak:false,deload:false},
   {id:'read',name:'Reading',color:9,tracked:true,streak:true,deload:false},
   {id:'review',name:'Weekly review',color:10,tracked:true,streak:false,deload:false},
   {id:'arl',name:'ARL',color:0,tracked:false,streak:false,deload:false},
   {id:'life',name:'Routine',color:0,tracked:false,streak:false,deload:false},
   {id:'free',name:'Free / social',color:0,tracked:false,streak:false,deload:false},
   {id:'sleep',name:'Sleep',color:0,tracked:false,streak:false,deload:false},
  ],
  template,
  training:{
   decision:{date:'2026-11-08',altUntil:'2027-02-28',question:'Racing the 70.3?',answer:null,note:'Train as if you’re racing for three weeks, then decide. If yes, register that week and switch to a structured 70.3 plan (race build runs 9 Nov – 28 Feb). If no, keep 3–4 sessions as ordinary fitness and drop the long brick. Open question: whether your dad is racing either way.'},
   baseLabel:'Weeks 1–3',altLabel:'Later, if racing',
   base:{1:S_('Rest day','No training today. Easy mobility if you want it.',0),2:S_('Easy run','30–40 min, conversational pace',.6),3:S_('Swim','45 min technique + one open-water session a month',.75),4:S_('Run with short intervals','35 min',.6),5:S_('Bike','45–60 min, indoor or a short loop',.85),6:S_('Long ride + run off the bike','1.5 → 2.5 h ride, then 10–15 min run',2.2),0:S_('Long run','45 → 75 min',1)},
   alt:{1:S_('Rest day','Rest',0),2:S_('Run','45 min',.75),3:S_('Swim','60 min',1),4:S_('Tempo run','50 min',.85),5:S_('Bike intervals','60 min',1),6:S_('Long ride + run off the bike','Build toward a 3.5 h ride + 30 min run',3.5),0:S_('Long run','Build toward 1 h 45',1.5)},
  },
  phases:[
   {id:'p1',name:'Foundations + PyTorch',start:'2026-10-19',end:'2026-11-15',brk:false,items:['Linear and logistic regression with gradient descent, in NumPy','A micrograd-style autograd engine','An MLP trained with a plain PyTorch loop']},
   {id:'p2',name:'Deep nets + training craft',start:'2026-11-16',end:'2026-12-20',brk:false,items:['A CNN trained on CIFAR-10','A ResNet trained on CIFAR-10','Diagnose a broken run from loss curves, gradient norms and activations','Explain why init, BatchNorm/LayerNorm, AdamW and LR warmup each matter','Port one ARL model to PyTorch']},
   {id:'brk',name:'Winter trip',start:'2026-12-21',end:'2027-01-03',items:[],brk:true},
   {id:'p3',name:'Transformers + LLMs',start:'2027-01-04',end:'2027-02-07',brk:false,items:['A BPE tokenizer from scratch','A GPT from scratch, trained on a small corpus','KV caching','Mixed precision','Your steering methods run on your own model (feeds SteerPOT)']},
   {id:'p4',name:'Fine-tuning',start:'2027-02-08',end:'2027-02-28',brk:false,items:['LoRA written by hand','A small open model fine-tuned with Hugging Face + PEFT','That model quantized','A small DPO experiment']},
   {id:'p5',name:'Generative models',start:'2027-03-01',end:'2027-04-04',brk:false,items:['VAE','GAN','A normalizing flow','DDPM diffusion','Flow matching on MNIST/CIFAR','Flow matching loss derived from the ODE view']},
  ],
  resources:[
   {id:'r1',name:'Karpathy, Neural Networks: Zero to Hero',url:'https://karpathy.ai/zero-to-hero.html',note:'Phases 1–3'},
   {id:'r2',name:'Simon Prince, Understanding Deep Learning',url:'https://udlbook.github.io/udlbook/',note:'Phases 2 and 5'},
   {id:'r3',name:'LoRA paper (Hu et al., 2021)',url:'https://arxiv.org/abs/2106.09685',note:'Phase 4'},
   {id:'r4',name:'Hugging Face PEFT docs',url:'https://huggingface.co/docs/peft',note:'Phase 4'},
   {id:'r5',name:'Lipman et al., Flow Matching Guide and Code',url:'https://arxiv.org/abs/2412.06264',note:'Phase 5'},
  ],
  languages:[{id:'l1',name:'Latin',start:'2026-10-19',end:'2026-12-20'},{id:'l2',name:'Sanskrit',start:'2027-01-04',end:'2027-04-04'}],
  breaks:[{id:'b1',name:'Winter trip',start:'2026-12-24',end:'2027-01-03',note:'Full break. Nothing is tracked; enjoy it.'}],
  rotation:[
   {id:'r-trips',name:'Trips + poker',start:'2026-10-19',end:'2026-11-22',note:''},
   {id:'r-comedy',name:'Comedy + writing',start:'2026-11-23',end:'2026-12-20',note:''},
   {id:'r-photos',name:'Photos + playlists',start:'2027-01-04',end:'2027-02-07',note:''},
   {id:'feb',name:'Race month or free slot',start:'2027-02-08',end:'2027-02-28',note:'No rotating block in February: race prep if you said yes, whatever is pulling at you if not. Phu Quoc this month runs on busy-week minimums.'},
   {id:'r-writing',name:'Writing + poker',start:'2027-03-01',end:'2027-04-04',note:''},
  ],
  stages:{theory:['Scales','Intervals','Chords','Harmony'],ear:['Intervals','Chord quality','Progressions']},
  rules:['Sleep and the ML morning block are protected. Everything else bends first.','Missed a session? Skip it. Never stack two into one day.','Busy week (deadline, travel, exams): drop to minimums. That’s 20 min guitar, flashcards only, one Valorant session, and the two long training sessions.','If a pursuit slips three weeks running, move it into the rotation instead of forcing it.','Every fourth week, cut training and Valorant volume by a third and rest.'],
  modules:{
   milestones:{on:true,cat:'ml',title:'ML / deep learning',blurb:'About 14 h a week. Write it yourself first, then use the library version. Weekdays for reading and small exercises; Saturday’s two hours build one thing end to end. Tie-ins: port one ARL model to PyTorch in Phase 2; Phase 3 feeds straight into SteerPOT.'},
   training:{on:true,cat:'iron',title:'Ironman base',blurb:'Bike and run get most of the time because they’re your weak legs. The swim stays at one session; add open-water practice before February. The hybrid bike is fine for base; revisit a road bike only after a yes.',target:300},
   music:{on:true,cat:'guitar',prodCat:'prod',title:'Music',blurb:'45 min every weekday evening, plus Sunday production. Short daily sessions beat long weekly ones for skills that live in your hands and ears.'},
   language:{on:true,cat:'lang',title:'Language',blurb:'One language at a time, 25 min nightly: 10 min flashcards (spaced repetition), then 15 min grammar or one short reading.',cards:10},
   games:{on:true,cat:'valo',title:'Valorant',blurb:'Start every session with a 15 min aim routine. One VOD review a week on Sunday: pick one death pattern and fix only that.',stopAfter:2},
   reading:{on:true,cat:'read',title:'Reading',blurb:'Fiction or general non-fiction only; papers belong in the ML block. One book at a time; note one line per book when you finish. Read in bed instead of scrolling.'},
   food:{on:true,cat:'food',title:'Food',blurb:'Vegetarian, no eggs, light on rice. Build each meal around a protein (dal, paneer, tofu, chana, Greek yoghurt). Wednesday is the cook-from-scratch night.',meals:5},
   rotation:{on:true,cat:'rot',title:'Rotation',blurb:'Everything else gets its turn in 4–6 week blocks, on Tuesday and Thursday evenings plus the Sunday admin hour.'},
  },
 };
}
function blankBlock(o){return Object.assign({id:uid(),s:'09:00',e:'10:00',cat:'life',title:'New block',detail:'',h:null,session:false,extra:'',busy:'keep',busyDetail:'',busyH:null},o||{})}
function blankPlan(from){
 const focus=uid();
 const p={id:uid(),name:'New plan',start:from,end:addDays(from,167),deloadEvery:0,deloadCut:33,
  pursuits:[{id:'sleep',name:'Sleep',color:0,tracked:false,streak:false,deload:false},{id:'life',name:'Routine',color:0,tracked:false,streak:false,deload:false},{id:focus,name:'Focus',color:1,tracked:true,streak:true,deload:false}],
  template:{},training:{decision:{date:'',altUntil:'',question:'',answer:null,note:''},baseLabel:'Sessions',altLabel:'Alternative',base:{},alt:{}},
  phases:[],resources:[],languages:[],breaks:[],rotation:[],stages:{theory:[],ear:[]},rules:[],modules:{}};
 [0,1,2,3,4,5,6].forEach(d=>p.template[d]=[blankBlock({id:'sleep',s:'00:00',e:'08:00',cat:'sleep',title:'Sleep',extra:'sleep'})]);
 const dm=defaultPlan().modules;for(const k in dm)p.modules[k]={...dm[k],on:false,blurb:'',cat:focus,prodCat:focus};
 return p;
}

/* =====================================================================
   State. S is the in-memory model; the database tables mirror it.
   ===================================================================== */
const DEFAULT_META={busy:{},ml:{},builds:{},theory:0,ear:0,song:'',loops:{},books:[],vod:{},food:{},reviews:{},theme:'system',trackFrom:''};
let S=null;              // {meta, train:{items}, months:{'m-YYYY-MM':{date:{c,cards,valo,sleep}}}, plans:{plans:[]}}
let ver=0;               // bumps on every change, used to memoise derived numbers
const ui={tab:LS.get('cadence.tab')||'today',sel:today(),prog:LS.get('cadence.prog')||'',logOpen:null,confirm:null,importText:'',note:'',editPlan:null,psec:'basics',pday:1,
 auth:{mode:'signin',email:'',msg:'',bad:false,busy:false}};
let mode='boot';         // boot | auth | local | cloud

function emptyState(){return {meta:clone(DEFAULT_META),train:{items:[]},months:{},plans:{plans:[]}}}
function normalize(){
 S.meta={...clone(DEFAULT_META),...(S.meta||{})};
 if(!S.train||!Array.isArray(S.train.items))S.train={items:[]};
 if(!S.months)S.months={};
 if(!S.plans||!Array.isArray(S.plans.plans))S.plans={plans:[]};
 if(!S.plans.plans.length){
  const p=defaultPlan();
  if(Array.isArray(S.meta.rotation)&&S.meta.rotation.length)p.rotation=S.meta.rotation;
  if(S.meta.decision)p.training.decision.answer=S.meta.decision;
  S.plans.plans.push(p);
 }
 delete S.meta.rotation;delete S.meta.decision;delete S.meta.dad;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(S.meta.trackFrom||''))S.meta.trackFrom='';
 for(const p of S.plans.plans){for(let d=0;d<7;d++)if(!Array.isArray((p.template||(p.template={}))[d]))p.template[d]=[];
  ['phases','languages','breaks','rotation','resources','pursuits','rules'].forEach(k=>{if(!Array.isArray(p[k]))p[k]=[]});
  p.training=p.training||{};p.training.decision=p.training.decision||{};p.training.base=p.training.base||{};p.training.alt=p.training.alt||{};
  p.stages=p.stages||{theory:[],ear:[]};p.modules=p.modules||{};}
}
const getDay=ds=>(S.months['m-'+ds.slice(0,7)]||{})[ds]||{};
function mutDay(ds,fn){const k='m-'+ds.slice(0,7);const m=clone(S.months[k]||{});m[ds]=m[ds]||{};fn(m[ds]);S.months[k]=m;changed()}
function mutMeta(fn){const m=clone(S.meta);fn(m);S.meta=m;changed()}
function mutTrain(fn){const t=clone(S.train);fn(t);S.train=t;changed()}
function mutPlans(fn){const p=clone(S.plans);fn(p);S.plans=p;changed()}
function mutPlan(id,fn){mutPlans(ps=>{const p=ps.plans.find(x=>x.id===id);if(p)fn(p)})}

/* =====================================================================
   Rows: the database shape of S, one object per table keyed by row id
   ===================================================================== */
const TABLES=['plans','pursuits','blocks','periods','resources','block_ticks','day_logs','training_sessions','weeks','milestone_checks','books','prefs'];
const numOrNull=v=>(v===''||v==null||isNaN(+v))?null:+v;
const dateOrNull=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v:null;
function toRows(st){
 const R={};TABLES.forEach(t=>R[t]={});
 for(const p of st.plans.plans){
  const {id,name,start,end,pursuits,template,phases,languages,breaks,rotation,resources,...settings}=p;
  R.plans[id]={id,name:name||'Untitled plan',start_date:start,end_date:end,settings};
  (pursuits||[]).forEach((x,i)=>{const rid=id+':'+x.id;R.pursuits[rid]={id:rid,plan_id:id,pursuit_key:x.id,name:x.name||'',color:+x.color||0,tracked:!!x.tracked,streak:!!x.streak,deload:!!x.deload,sort:i}});
  for(let wd=0;wd<7;wd++)((template||{})[wd]||[]).forEach((b,i)=>{const rid=id+':'+wd+':'+b.id;
   R.blocks[rid]={id:rid,plan_id:id,weekday:wd,block_key:b.id,start_time:b.s||'00:00',end_time:b.e||'00:00',pursuit_key:b.cat||'',title:b.title||'',detail:b.detail||'',hours:numOrNull(b.h),
    uses_session:!!b.session,widget:b.extra||'',busy_mode:['keep','min','drop'].includes(b.busy)?b.busy:'keep',busy_detail:b.busyDetail||'',busy_hours:numOrNull(b.busyH),sort:i}});
  const per=(kind,arr)=>(arr||[]).forEach((x,i)=>{const rid=id+':'+kind+':'+x.id;
   R.periods[rid]={id:rid,plan_id:id,kind,period_key:x.id,name:x.name||'',start_date:dateOrNull(x.start),end_date:dateOrNull(x.end),note:x.note||'',items:kind==='phase'?(x.items||[]):[],is_break:kind==='phase'&&!!x.brk,sort:i}});
  per('phase',phases);per('language',languages);per('break',breaks);per('rotation',rotation);
  (resources||[]).forEach((r,i)=>{const rid=id+':'+r.id;R.resources[rid]={id:rid,plan_id:id,name:r.name||'',url:r.url||'',note:r.note||'',sort:i}});
 }
 for(const k in st.months)for(const ds in st.months[k]){
  const d=st.months[k][ds];
  for(const key in (d.c||{}))if(d.c[key])R.block_ticks[ds+'|'+key]={id:ds+'|'+key,day:ds,block_key:key};
  const g=((d.valo||{}).g||[]).join(''),warm=!!(d.valo||{}).aim,cards=+d.cards||0,bed=(d.sleep||{}).bed||'',wake=(d.sleep||{}).wake||'';
  if(g||warm||cards||bed||wake)R.day_logs[ds]={id:ds,day:ds,cards,warmup:warm,games:g,slept_at:bed,woke_at:wake};
 }
 for(const x of st.train.items)R.training_sessions[x.id]={id:x.id,day:x.ds,kind:x.type||'Other',minutes:Math.max(1,Math.round(+x.min||1)),km:numOrNull(x.km)||null,rpe:(+x.rpe>=1&&+x.rpe<=10)?Math.round(+x.rpe):null,note:x.note||''};
 const m=st.meta,wks=new Set([...Object.keys(m.busy),...Object.keys(m.builds),...Object.keys(m.loops),...Object.keys(m.food),...Object.keys(m.vod),...Object.keys(m.reviews)]);
 for(const w of wks){
  const f=m.food[w]||{},r=m.reviews[w]||{};
  const row={id:w,week_start:w,busy:!!m.busy[w],build:m.builds[w]||'',loop_done:!!m.loops[w],meals_prepped:+f.prep||0,recipe:f.recipe||'',vod_focus:m.vod[w]||'',review_done:r.done||'',review_slipped:r.slipped||'',review_change:r.change||''};
  if(row.busy||row.build||row.loop_done||row.meals_prepped||row.recipe||row.vod_focus||row.review_done||row.review_slipped||row.review_change)R.weeks[w]=row;
 }
 for(const k in m.ml)if(m.ml[k]){const i=k.lastIndexOf(':');R.milestone_checks[k]={id:k,phase_key:k.slice(0,i),item_index:+k.slice(i+1)}}
 (m.books||[]).forEach((b,i)=>{R.books[b.id]={id:b.id,title:b.title||'Untitled',status:['queued','reading','done'].includes(b.status)?b.status:'queued',finished_on:dateOrNull(b.finished),line:b.line||'',sort:i}});
 R.prefs.me={id:'me',song:m.song||'',theory_stage:+m.theory||0,ear_stage:+m.ear||0,theme:m.theme||'system',...(dateOrNull(m.trackFrom)?{track_from:m.trackFrom}:{})};
 return R;
}
function fromRows(R){
 const st=emptyState();
 const bySort=(a,b)=>(a.sort||0)-(b.sort||0);
 const plans={};
 for(const r of Object.values(R.plans)){plans[r.id]={...(r.settings||{}),id:r.id,name:r.name,start:r.start_date,end:r.end_date,pursuits:[],template:{0:[],1:[],2:[],3:[],4:[],5:[],6:[]},phases:[],languages:[],breaks:[],rotation:[],resources:[]}}
 for(const r of Object.values(R.pursuits).sort(bySort)){const p=plans[r.plan_id];if(p)p.pursuits.push({id:r.pursuit_key,name:r.name,color:r.color,tracked:r.tracked,streak:r.streak,deload:r.deload})}
 for(const r of Object.values(R.blocks).sort(bySort)){const p=plans[r.plan_id];if(p)p.template[r.weekday].push({id:r.block_key,s:r.start_time,e:r.end_time,cat:r.pursuit_key,title:r.title,detail:r.detail,h:r.hours==null?null:+r.hours,session:r.uses_session,extra:r.widget,busy:r.busy_mode,busyDetail:r.busy_detail,busyH:r.busy_hours==null?null:+r.busy_hours})}
 for(const r of Object.values(R.periods).sort(bySort)){const p=plans[r.plan_id];if(!p)continue;
  const base={id:r.period_key,name:r.name,start:r.start_date||'',end:r.end_date||''};
  if(r.kind==='phase')p.phases.push({...base,items:Array.isArray(r.items)?r.items:[],brk:!!r.is_break});
  else if(r.kind==='language')p.languages.push(base);
  else if(r.kind==='break')p.breaks.push({...base,note:r.note});
  else p.rotation.push({...base,note:r.note});}
 for(const r of Object.values(R.resources).sort(bySort)){const p=plans[r.plan_id];if(p)p.resources.push({id:r.id.slice(r.plan_id.length+1),name:r.name,url:r.url,note:r.note})}
 st.plans.plans=Object.values(plans);
 const day=ds=>{const k='m-'+ds.slice(0,7);st.months[k]=st.months[k]||{};return st.months[k][ds]=st.months[k][ds]||{}};
 for(const r of Object.values(R.block_ticks)){const d=day(r.day);d.c=d.c||{};d.c[r.block_key]=1}
 for(const r of Object.values(R.day_logs)){const d=day(r.day);if(r.cards)d.cards=r.cards;if(r.games||r.warmup)d.valo={aim:!!r.warmup,g:r.games?r.games.split(''):[]};if(r.slept_at||r.woke_at)d.sleep={bed:r.slept_at,wake:r.woke_at}}
 st.train.items=Object.values(R.training_sessions).map(r=>({id:r.id,ds:r.day,type:r.kind,min:r.minutes,km:r.km==null?0:+r.km,rpe:r.rpe||0,note:r.note})).sort((a,b)=>a.ds.localeCompare(b.ds)||a.id.localeCompare(b.id));
 const m=st.meta;
 for(const r of Object.values(R.weeks)){const w=r.id;
  if(r.busy)m.busy[w]=1;if(r.build)m.builds[w]=r.build;if(r.loop_done)m.loops[w]=1;if(r.vod_focus)m.vod[w]=r.vod_focus;
  if(r.meals_prepped||r.recipe)m.food[w]={prep:r.meals_prepped,recipe:r.recipe};
  if(r.review_done||r.review_slipped||r.review_change)m.reviews[w]={done:r.review_done,slipped:r.review_slipped,change:r.review_change};}
 for(const r of Object.values(R.milestone_checks))m.ml[r.id]=1;
 m.books=Object.values(R.books).sort(bySort).map(r=>{const b={id:r.id,title:r.title,status:r.status};if(r.finished_on)b.finished=r.finished_on;if(r.line)b.line=r.line;return b});
 const pr=R.prefs.me;if(pr){m.song=pr.song;m.theory=pr.theory_stage;m.ear=pr.ear_stage;m.theme=pr.theme;m.trackFrom=pr.track_from||''}
 return st;
}
const emptyRows=()=>{const R={};TABLES.forEach(t=>R[t]={});return R};
const strip=r=>{const o={...r};delete o.user_id;delete o.updated_at;if(o.track_from==null)delete o.track_from;return o};

/* =====================================================================
   Persistence: Supabase when signed in, this device otherwise.
   Offline-first: every change lands in S and localStorage at once, then a
   diff against the last known server state is pushed. Unpushed changes
   survive reloads because the server snapshot is cached alongside S.
   ===================================================================== */
const CFG=window.CADENCE_CONFIG||{};
let sb=null;
try{if(window.supabase&&CFG.supabaseUrl)sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(e){sb=null}
const cloud={uid:null,email:'',base:null,status:'local',err:'',channel:null,flushing:false,again:false,timer:null,events:[],evTimer:null,down:false};
const cacheKey=()=>'cadence.u.'+cloud.uid;
function persist(){
 if(mode==='cloud'&&cloud.uid)LS.set(cacheKey(),{S,base:cloud.base});
 else if(mode==='local')LS.set('cadence.local',S);
}
function changed(){ver++;userAction=true;persist();if(mode==='cloud')queueFlush(500);scheduleRender()}
function queueFlush(ms){clearTimeout(cloud.timer);cloud.timer=setTimeout(flush,ms)}
function setStatus(s,err){cloud.status=s;cloud.err=err||'';renderChip()}
const errText=e=>(e&&(e.message||e.error_description||e.msg))||'Something went wrong.';
async function flush(){
 if(mode!=='cloud'||!cloud.base||!sb)return;
 if(cloud.flushing){cloud.again=true;return}
 cloud.flushing=true;
 try{
  const cur=toRows(S);let any=false;
  for(const t of TABLES){
   const up=[];for(const id in cur[t])if(stable(cur[t][id])!==stable(cloud.base[t][id]))up.push(cur[t][id]);
   if(up.length&&!any){any=true;setStatus('saving')}
   for(let i=0;i<up.length;i+=400){
    const chunk=up.slice(i,i+400);
    const {error}=await sb.from(t).upsert(chunk.map(r=>({...r,user_id:cloud.uid})),{onConflict:'user_id,id'});
    if(error)throw error;
    chunk.forEach(r=>{cloud.base[t][r.id]=r});
   }
  }
  for(const t of [...TABLES].reverse()){
   const del=Object.keys(cloud.base[t]).filter(id=>!(id in cur[t]));
   if(del.length&&!any){any=true;setStatus('saving')}
   for(let i=0;i<del.length;i+=100){
    const chunk=del.slice(i,i+100);
    const {error}=await sb.from(t).delete().eq('user_id',cloud.uid).in('id',chunk);
    if(error)throw error;
    chunk.forEach(id=>{delete cloud.base[t][id]});
   }
  }
  persist();setStatus(cloud.down?'offline':'live');
 }catch(e){
  const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
  setStatus(offline?'offline':'error',offline?'You are offline. Changes are saved on this device and will sync when you reconnect.':'Could not save to the database: '+errText(e)+'. Changes are kept on this device and will retry.');
  queueFlush(15000);
 }finally{
  cloud.flushing=false;
  if(cloud.again){cloud.again=false;queueFlush(50)}
 }
}
async function fetchAll(){
 const R=emptyRows();
 for(const t of TABLES){
  for(let from=0;;from+=1000){
   const {data,error}=await sb.from(t).select('*').eq('user_id',cloud.uid).order('id').range(from,from+999);
   if(error)throw error;
   (data||[]).forEach(r=>{R[t][r.id]=strip(r)});
   if(!data||data.length<1000)break;
  }
 }
 return R;
}
/* Three-way merge of one row: take the server's value for every field this device hasn't changed,
   keep this device's value where only it changed, and recurse into objects (plan settings). */
function merge3(base,local,remote){
 if(!base||!local||!remote||typeof base!=='object'||typeof local!=='object'||typeof remote!=='object'||Array.isArray(local)||Array.isArray(remote))return local;
 const out={};
 for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
  const b=base[k],l=local[k],r=remote[k];
  // A field missing locally (an older copy that doesn't know it) is not an edit: take the server's.
  const v=(l===undefined||stable(l)===stable(b))?r:stable(r)===stable(b)?l:merge3(b,l,r);
  if(v!==undefined)out[k]=v;
 }
 return out;
}
/* Merge: the server wins except where this device has changes it has not pushed yet. */
function mergeRemote(remote){
 const cur=S?toRows(S):emptyRows(),base=cloud.base||emptyRows(),merged=emptyRows();
 for(const t of TABLES){
  Object.assign(merged[t],remote[t]);
  const ids=new Set([...Object.keys(cur[t]),...Object.keys(base[t])]);
  for(const id of ids)if(stable(cur[t][id])!==stable(base[t][id])){
   if(!(id in cur[t]))delete merged[t][id];
   else merged[t][id]=(id in remote[t]&&id in base[t])?merge3(base[t][id],cur[t][id],remote[t][id]):cur[t][id];
  }
 }
 return merged;
}
async function refresh(){
 if(mode!=='cloud'||!sb)return;
 lastRefresh=Date.now();
 try{
  let remote;
  cloud.refreshing=true;
  for(let i=0;i<3;i++){cloud.missed=false;remote=await fetchAll();if(!cloud.missed)break}
  cloud.refreshing=false;
  const serverEmpty=!Object.keys(remote.plans).length;
  let next;
  if(serverEmpty&&!cloud.base){
   // First sign-in on an empty account: bring this device's data along, or start the default plan.
   const local=LS.get('cadence.local');
   S=local&&local.meta?local:emptyState();normalize();next=null;
  }else{next=mergeRemote(remote)}
  cloud.base=remote;
  if(next){S=fromRows(next);normalize()}
  ver++;persist();setStatus(cloud.down?'offline':'live');scheduleRender(true);queueFlush(50);
 }catch(e){
  cloud.refreshing=false;
  setStatus(navigator.onLine===false?'offline':'error',navigator.onLine===false?'You are offline. Showing what this device has saved.':'Could not load from the database: '+errText(e));
  scheduleRender(true);
 }
}
function applyEvents(){
 if(cloud.refreshing){if(cloud.events.length)cloud.missed=true;cloud.events.length=0;return}
 const evs=cloud.events.splice(0);if(!evs.length||!cloud.base)return;
 const cur=toRows(S);let touched=false;
 for(const e of evs){
  const t=e.table;if(!TABLES.includes(t))continue;
  const row=e.eventType==='DELETE'?e.old:e.new;if(!row||row.user_id!==cloud.uid||!row.id)continue;
  const id=row.id,pending=stable(cur[t][id])!==stable(cloud.base[t][id]);
  if(e.eventType==='DELETE'){delete cloud.base[t][id];if(!pending&&id in cur[t]){delete cur[t][id];touched=true}}
  else{const r=strip(row),was=cloud.base[t][id];cloud.base[t][id]=r;
   const next=!pending?r:(id in cur[t]&&was?merge3(was,cur[t][id],r):cur[t][id]);
   if(next!==undefined&&stable(cur[t][id])!==stable(next)){cur[t][id]=next;touched=true}}
 }
 if(touched){S=fromRows(cur);normalize();ver++}
 persist();if(touched)scheduleRender(true);
}
function subscribe(){
 if(cloud.channel){try{sb.removeChannel(cloud.channel)}catch(e){}}
 cloud.channel=sb.channel('cadence-'+cloud.uid)
  .on('postgres_changes',{event:'*',schema:'public'},p=>{cloud.events.push(p);clearTimeout(cloud.evTimer);cloud.evTimer=setTimeout(applyEvents,250)})
  .subscribe(status=>{
   if(status==='SUBSCRIBED'){const was=cloud.down;cloud.down=false;if(cloud.status!=='saving'&&cloud.status!=='error')setStatus('live');if(was)refresh()}
   else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){cloud.down=true;if(cloud.status==='live')setStatus('offline','Live updates paused. Reconnecting…')}
  });
}
function startCloud(user){
 if(cloud.uid===user.id&&mode==='cloud')return;
 mode='cloud';cloud.uid=user.id;cloud.email=user.email||'';
 const cache=LS.get(cacheKey());
 if(cache&&cache.S&&cache.base){S=cache.S;cloud.base=cache.base;normalize();for(const t of TABLES)cloud.base[t]=cloud.base[t]||{}}
 else{S=null;cloud.base=null}
 ver++;setStatus('saving');
 if(S)scheduleRender(true);else renderLoading();
 subscribe();refresh();
}
function startLocal(){
 mode='local';LS.set('cadence.mode','local');
 S=LS.get('cadence.local')||emptyState();normalize();persist();ver++;cloud.status='local';scheduleRender(true);
}
async function boot(){
 if(!sb){startLocal();return}
 sb.auth.onAuthStateChange((event,session)=>{
  if(session&&session.user&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))startCloud(session.user);
  if(event==='SIGNED_OUT'&&mode==='cloud'){mode='auth';cloud.uid=null;S=null;render()}
  if(event==='PASSWORD_RECOVERY'){ui.auth.mode='newpass';render()}
 });
 let session=null;
 try{session=(await sb.auth.getSession()).data.session}catch(e){}
 if(session&&session.user)startCloud(session.user);
 else if(LS.get('cadence.mode')==='local')startLocal();
 else{mode='auth';render()}
}
let lastRefresh=0;
const maybeRefresh=()=>{if(mode==='cloud'&&Date.now()-lastRefresh>60000)refresh()};
addEventListener('online',()=>{if(mode==='cloud'){refresh();queueFlush(50)}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeRefresh()});

/* =====================================================================
   Plan logic
   ===================================================================== */
const plans=()=>S.plans.plans;
const inRange=(ds,x)=>x&&x.start&&x.end&&ds>=x.start&&ds<=x.end;
function planFor(ds){const ps=plans();return ps.find(p=>inRange(ds,p))||[...ps].filter(p=>p.start&&p.start<=ds).sort((a,b)=>b.start.localeCompare(a.start))[0]||[...ps].sort((a,b)=>(a.start||'').localeCompare(b.start||''))[0]}
const pursuitOf=(p,cat)=>(p.pursuits||[]).find(x=>x.id===cat)||{id:cat,name:cat||'—',color:0,tracked:false};
const laneOf=(p,cat)=>`style="--lane:var(--c${pursuitOf(p,cat).color||0})"`;
const laneVar=(p,cat)=>`--lane:var(--c${pursuitOf(p,cat).color||0})`;
const realPhases=p=>(p.phases||[]).filter(x=>!x.brk).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
const phaseAt=(p,ds)=>(p.phases||[]).find(x=>inRange(ds,x))||null;
function phaseLabel(p,ds){
 const ph=phaseAt(p,ds);
 if(ph)return ph.brk?ph.name:'Phase '+(realPhases(p).indexOf(ph)+1)+' · '+ph.name;
 const all=[...(p.phases||[])].filter(x=>x.start&&x.end).sort((a,b)=>a.start.localeCompare(b.start));
 if(!all.length)return '';
 if(ds<all[0].start)return 'First phase starts '+fmtShort(all[0].start);
 if(ds>all[all.length-1].end)return 'All phases complete';
 return 'Between phases';
}
function langFor(p,ds){
 const L=[...(p.languages||[])].filter(x=>x.start).sort((a,b)=>a.start.localeCompare(b.start));
 const hit=L.find(x=>inRange(ds,x));if(hit)return hit.name;
 const prev=L.filter(x=>x.start<=ds).pop();return prev?prev.name:(L[0]?L[0].name:'Language');
}
/* Progress counts from S.meta.trackFrom. Earlier days are a preview: shown, never tracked or counted. */
const firstStart=()=>plans().reduce((a,p)=>p.start&&(!a||p.start<a)?p.start:a,'');
/* Without a date the user chose, count from the earliest plan start or logged day, whichever is first. */
let tfMemo={v:-1,d:''};
function trackFrom(){
 if(S.meta.trackFrom)return S.meta.trackFrom;
 if(tfMemo.v===ver)return tfMemo.d;
 let d=firstStart();
 for(const k in S.months)for(const ds in S.months[k]){const e=S.months[k][ds];if(e&&((e.c&&Object.keys(e.c).length)||e.cards||e.valo||e.sleep)&&(!d||ds<d))d=ds}
 for(const x of S.train.items)if(!d||x.ds<d)d=x.ds;
 tfMemo={v:ver,d};return d;
}
const preStart=ds=>{const f=trackFrom();return !!f&&ds<f};
/* Week 1 is the first full Monday-to-Sunday week; a plan that starts mid-week opens with a warm-up week. */
const weekOne=p=>addDays(p.start,(8-parse(p.start).getDay())%7);
function ctx(ds,p){
 p=p||planFor(ds);
 const wk=mondayOf(ds),wi=Math.floor(daysBetween(weekOne(p),wk)/7);
 const brk=(p.breaks||[]).find(x=>inRange(ds,x))||null,every=+p.deloadEvery||0;
 return {ds,p,wk,wi,brk,busy:!!S.meta.busy[wk],deload:every>0&&wi>=0&&(wi+1)%every===0&&!brk,pre:ds<p.start,after:ds>p.end,
  phase:phaseAt(p,ds),lang:langFor(p,ds),rot:(p.rotation||[]).find(r=>inRange(ds,r))||null};
}
function session(p,ds,wd){
 const t=p.training||{},d=t.decision||{};
 const alt=d.answer==='yes'&&d.date&&ds>d.date&&(!d.altUntil||ds<=d.altUntil);
 const s=((alt?t.alt:t.base)||{})[wd];
 return s&&s.title?s:{title:'Training',detail:'Set this day’s session in Plan → Training.',h:1};
}
function fill(text,c){
 const p=c.p,st=p.stages||{};
 const stage=(arr,i,fb)=>String((arr||[])[Math.min(i||0,Math.max(0,(arr||[]).length-1))]||fb).toLowerCase();
 return String(text||'').replace(/\{(phase|language|rotation-note|rotation|song|theory|ear)\}/g,(_,k)=>{
  switch(k){
   case 'phase':return phaseLabel(p,c.ds);
   case 'language':return c.lang;
   case 'rotation':return c.rot?c.rot.name:'Rotating block';
   case 'rotation-note':return c.rot?(c.rot.note||''):'No block set for these dates. Add one in Plan → Dates.';
   case 'song':return S.meta.song?'“'+S.meta.song+'”':'the song you are learning';
   case 'theory':return stage(st.theory,S.meta.theory,'theory');
   case 'ear':return stage(st.ear,S.meta.ear,'ear training');
  }
  return '';
 });
}
const blockMemo=new Map();
function blocksFor(ds){
 const key=ver+'|'+ds;if(blockMemo.has(key))return blockMemo.get(key);
 if(blockMemo.size>4000)blockMemo.clear();
 const p=planFor(ds);if(!p){blockMemo.set(key,[]);return []}
 const c=ctx(ds,p),wd=parse(ds).getDay(),cut=1-(Math.min(90,Math.max(0,+p.deloadCut||0))/100),pre=preStart(ds);
 const out=[...((p.template||{})[wd]||[])].sort((a,b)=>toMin(a.s)-toMin(b.s)).map(raw=>{
  const b={...raw};const pu=pursuitOf(p,b.cat);
  const usesPhase=/\{phase\}/.test((raw.title||'')+(raw.detail||''));
  if(b.session){const s=session(p,ds,wd);b.title=String(b.title||'').replace('{session}',s.title)||s.title;b.detail=String(b.detail||'').replace('{session-detail}',s.detail||'');b.h=+s.h||0}
  else b.h=(b.h==null||b.h==='')?(endMin(b)-toMin(b.s))/60:+b.h;
  b.title=fill(b.title,c);b.detail=fill(b.detail,c);
  b.track=!!pu.tracked&&b.h>0;
  b.xp=b.track?Math.max(5,Math.round(b.h*10)):0;
  if(pre&&b.track){b.track=false;b.preview=true;b.xp=0}
  if(c.brk&&b.track){b.track=false;b.dropped=c.brk.name+(c.brk.note?': '+c.brk.note:'')}
  else if(usesPhase&&c.phase&&c.phase.brk&&b.track){b.track=false;b.dropped=c.phase.name+': no study.'}
  else if(c.busy&&b.track){
   if(b.busy==='drop'){b.track=false;b.dropped=b.busyDetail||'Dropped this busy week'}
   else if(b.busy==='min'){if(b.busyDetail)b.detail=b.busyDetail;if(b.busyH!=null&&b.busyH!=='')b.h=+b.busyH;b.title=b.title+' (minimum)'}
  }
  if(c.deload&&b.track&&pu.deload){b.h=b.h*cut;b.detail+=(b.detail?' ':'')+'Deload week: cut it by '+(+p.deloadCut||0)+'%.'}
  if(b.track)b.xp=Math.max(5,Math.round(b.h*10));
  return b;
 });
 blockMemo.set(key,out);return out;
}
function dayStats(ds){
 const B=blocksFor(ds).filter(b=>b.track),done=getDay(ds).c||{};
 const per={};let ph=0,dh=0,n=0;
 for(const b of B){per[b.cat]=per[b.cat]||{p:0,d:0};per[b.cat].p+=b.h;ph+=b.h;if(done[b.id]){per[b.cat].d+=b.h;dh+=b.h;n++}}
 return {blocks:B,done,per,ph,dh,n,total:B.length};
}
function weekStats(wk){
 const per={};let ph=0,dh=0;
 for(let i=0;i<7;i++){const s=dayStats(addDays(wk,i));ph+=s.ph;dh+=s.dh;for(const k in s.per){per[k]=per[k]||{p:0,d:0};per[k].p+=s.per[k].p;per[k].d+=s.per[k].d}}
 return {per,ph,dh};
}
function slipping(){
 const wk=mondayOf(today()),p=planFor(today()),out=[];
 const fs=trackFrom(),weeks=[1,2,3].map(i=>addDays(wk,-7*i)).filter(w=>w>=weekOne(p)&&(!fs||w>=fs));
 if(weeks.length<3)return out;
 const ws=weeks.map(weekStats);
 for(const pu of p.pursuits)if(pu.tracked&&ws.every(w=>w.per[pu.id]&&w.per[pu.id].p>0&&w.per[pu.id].d/w.per[pu.id].p<.5))out.push(pu);
 return out;
}
function nowInfo(){
 const d=new Date(),ds=iso(d),m=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
 const B=blocksFor(ds);let cur=null,next=null;
 for(const b of B){const s=toMin(b.s),e=endMin(b);if(m>=s&&m<e)cur=b;if(s>m&&!next)next=b}
 if(!next){const t=blocksFor(addDays(ds,1)).filter(b=>toMin(b.s)>0);next=t[0]?{...t[0],tomorrow:true}:null}
 return {ds,m,cur,next};
}
const modOn=(p,k)=>p.modules&&p.modules[k]&&p.modules[k].on;
function sleepHours(d){const s=d&&d.sleep;if(!s||!s.bed||!s.wake)return null;let x=toMin(s.wake)-toMin(s.bed);if(x<=0)x+=1440;return x/60}

/* =====================================================================
   Gamification: everything is derived from what you logged, so it is
   identical on every device and can never drift from the data.
   ===================================================================== */
const XP={perfectDay:50,streakStep:5,streakCap:50,training:15,weekTarget:50,discipline:20,win:2,warmup:5,sleepLog:5,rested:10,review:40,loop:40,meals:30,build:30,book:100,milestone:50,phase:200,solidWeek:100,perfectWeek:200};
const levelStart=L=>50*(L-1)*L;              // total XP needed to reach level L
const levelOf=xp=>{let L=1;while(xp>=levelStart(L+1))L++;return L};
const skillStart=L=>20*(L-1)*L;
const skillOf=xp=>{let L=1;while(xp>=skillStart(L+1))L++;return L};
const RANKS=[[1,'Novice'],[3,'Apprentice'],[6,'Regular'],[10,'Adept'],[15,'Expert'],[21,'Master'],[30,'Grandmaster'],[40,'Legend']];
const rankOf=L=>RANKS.filter(r=>L>=r[0]).pop()[1];
function brokeStopRule(g,n){for(let i=n-1;i<g.length-1;i++){let all=true;for(let j=i-n+1;j<=i;j++)if(g[j]!=='L'){all=false;break}if(all)return true}return false}
let gameMemo={v:-1,d:'',g:null};
function game(){
 const t=today();if(gameMemo.v===ver&&gameMemo.d===t)return gameMemo.g;
 const ps=plans(),fs=trackFrom()||t,fw=mondayOf(fs);let start=fs;
 if(daysBetween(start,t)>3650)start=addDays(t,-3650);
 const g={xp:0,todayXP:0,weekXP:0,blocks:0,perfectDays:0,perfectWeeks:0,solidWeeks:0,streak:0,best:0,pxp:{},phours:{},pcur:{},pbest:{},
  train:0,trainMin:0,cards:0,discipline:0,wins:0,games:0,rested:0,sleepLogs:0,books:0,loops:0,reviews:0,reviewRun:0,reviewBest:0,meals:0,builds:0,ms:0,phases:0,weekTargets:0};
 const wkNow=mondayOf(t);
 const add=(n,ds)=>{g.xp+=n;if(ds===t)g.todayXP+=n;if(ds>=wkNow&&ds<=t)g.weekXP+=n};
 let wk=null,wkP=0,wkD=0;
 const closeWeek=(w,P,D)=>{if(!w||P<=0||w<fs)return;const r=D/P,cd=addDays(w,6)<t?addDays(w,6):t;
  if(r>=.999){g.perfectWeeks++;g.solidWeeks++;add(XP.perfectWeek,cd)}else if(r>=.8){g.solidWeeks++;add(XP.solidWeek,cd)}};
 for(let ds=start;ds<=t;ds=addDays(ds,1)){
  const w=mondayOf(ds);if(w!==wk){closeWeek(wk,wkP,wkD);wk=w;wkP=0;wkD=0}
  const p=planFor(ds),st=dayStats(ds);wkP+=st.ph;wkD+=st.dh;
  const catDone={};
  for(const b of st.blocks){const done=!!st.done[b.id];
   catDone[b.cat]=(catDone[b.cat]===undefined?true:catDone[b.cat])&&done;
   if(done){add(b.xp,ds);g.blocks++;g.pxp[b.cat]=(g.pxp[b.cat]||0)+b.xp;g.phours[b.cat]=(g.phours[b.cat]||0)+b.h}}
  for(const cat in catDone){if(catDone[cat]){g.pcur[cat]=(g.pcur[cat]||0)+1;g.pbest[cat]=Math.max(g.pbest[cat]||0,g.pcur[cat])}else if(ds!==t)g.pcur[cat]=0}
  if(st.total){
   if(st.n===st.total){g.perfectDays++;add(XP.perfectDay,ds)}
   if(st.dh/st.ph>=.7){g.streak++;g.best=Math.max(g.best,g.streak);add(Math.min(XP.streakCap,XP.streakStep*g.streak),ds)}
   else if(ds!==t)g.streak=0;
  }
  const d=getDay(ds);
  if(d.cards){const tgt=+((p.modules||{}).language||{}).cards||10;g.cards+=d.cards;add(Math.min(d.cards,Math.round(tgt*1.5)),ds)}
  const v=d.valo;
  if(v){if(v.aim)add(XP.warmup,ds);
   const gg=v.g||[];if(gg.length){g.games+=gg.length;const wins=gg.filter(x=>x==='W').length;g.wins+=wins;add(XP.win*wins,ds);
    const n=Math.max(1,+((p.modules||{}).games||{}).stopAfter||2);
    if(gg.length>=n&&gg.slice(-n).every(x=>x==='L')&&!brokeStopRule(gg,n)){g.discipline++;add(XP.discipline,ds)}}}
  const sl=sleepHours(d);if(sl!=null){g.sleepLogs++;add(XP.sleepLog,ds);if(sl>=7&&sl<=9.5){g.rested++;add(XP.rested,ds)}}
 }
 if(wk===wkNow){const ws=weekStats(wkNow);closeWeek(wkNow,ws.ph,ws.dh)}else closeWeek(wk,wkP,wkD);
 const minsByWeek={};
 for(const x of S.train.items){if(x.ds>t||x.ds<fs)continue;g.train++;g.trainMin+=+x.min||0;add(XP.training,x.ds);const w=mondayOf(x.ds);minsByWeek[w]=(minsByWeek[w]||0)+(+x.min||0)}
 for(const w in minsByWeek){const target=+((planFor(w).modules||{}).training||{}).target||0;if(target&&minsByWeek[w]>=target){g.weekTargets++;add(XP.weekTarget,w)}}
 const m=S.meta;
 const revWeeks=Object.keys(m.reviews).filter(w=>{const r=m.reviews[w];return w>=fw&&r&&(r.done||r.slipped||r.change)}).sort();
 let prev=null;for(const w of revWeeks){g.reviews++;add(XP.review,w);g.reviewRun=(prev&&addDays(prev,7)===w)?g.reviewRun+1:1;g.reviewBest=Math.max(g.reviewBest,g.reviewRun);prev=w}
 if(prev&&prev<addDays(wkNow,-7))g.reviewRun=0;
 for(const w in m.loops)if(w>=fw&&m.loops[w]){g.loops++;add(XP.loop,w)}
 for(const w in m.food){if(w<fw)continue;const tgt=+((planFor(w).modules||{}).food||{}).meals||5;if((+m.food[w].prep||0)>=tgt){g.meals++;add(XP.meals,w)}}
 for(const w in m.builds)if(w>=fw&&m.builds[w]){g.builds++;add(XP.build,w)}
 for(const b of m.books||[])if(b.status==='done'&&!(b.finished&&b.finished<fs)){g.books++;add(XP.book,b.finished||t)}
 for(const p of ps)for(const ph of p.phases||[]){const items=ph.items||[];if(!items.length)continue;let n=0;
  items.forEach((_,i)=>{if(m.ml[ph.id+':'+i]){n++;g.ms++;add(XP.milestone,ph.start||t)}});
  if(n===items.length){g.phases++;add(XP.phase,ph.end&&ph.end<t?ph.end:t)}}
 g.level=levelOf(g.xp);g.rank=rankOf(g.level);g.into=g.xp-levelStart(g.level);g.need=levelStart(g.level+1)-levelStart(g.level);
 g.badges=BADGES.filter(b=>b.test(g)).map(b=>b.id);
 gameMemo={v:ver,d:t,g};return g;
}
const catOf=k=>{const p=planFor(today());return ((p.modules||{})[k]||{}).cat};
const BADGES=[
 {id:'first',name:'First step',desc:'Complete your first block.',prog:g=>[g.blocks,1]},
 {id:'sweep',name:'Clean sweep',desc:'Finish every block in a day.',prog:g=>[g.perfectDays,1]},
 {id:'sweep10',name:'Ten clean days',desc:'Ten perfect days.',prog:g=>[g.perfectDays,10]},
 {id:'solid',name:'Solid week',desc:'Hit 80% of a week’s planned hours.',prog:g=>[g.solidWeeks,1]},
 {id:'perfectweek',name:'Perfect week',desc:'Every block in a whole week.',prog:g=>[g.perfectWeeks,1]},
 {id:'roll7',name:'On a roll',desc:'A 7-day streak (70%+ each day).',prog:g=>[g.best,7]},
 {id:'roll30',name:'Unbreakable',desc:'A 30-day streak.',prog:g=>[g.best,30]},
 {id:'polyglot',name:'Polyglot',desc:'30 nights of language in a row.',prog:g=>[g.pbest[catOf('language')]||0,30]},
 {id:'cards',name:'Word hoard',desc:'Add 500 new cards.',prog:g=>[g.cards,500]},
 {id:'base',name:'Base builder',desc:'Log 20 training sessions.',prog:g=>[g.train,20]},
 {id:'engine',name:'Engine',desc:'Log 100 training sessions.',prog:g=>[g.train,100]},
 {id:'target',name:'On target',desc:'Hit your weekly training minutes 4 times.',prog:g=>[g.weekTargets,4]},
 {id:'coolhead',name:'Cool head',desc:'Respect the stop rule 5 times.',prog:g=>[g.discipline,5]},
 {id:'deep',name:'Deep work',desc:'100 hours of milestone work.',prog:g=>[Math.floor(g.phours[catOf('milestones')]||0),100]},
 {id:'phase',name:'Phase clear',desc:'Tick every milestone in a phase.',prog:g=>[g.phases,1]},
 {id:'bookworm',name:'Bookworm',desc:'Finish 3 books.',prog:g=>[g.books,3]},
 {id:'producer',name:'Producer',desc:'Finish 4 production loops.',prog:g=>[g.loops,4]},
 {id:'reflect',name:'Reflective',desc:'4 weekly reviews in a row.',prog:g=>[g.reviewBest,4]},
 {id:'chef',name:'Meal prepper',desc:'Hit your meal prep target 4 weeks.',prog:g=>[g.meals,4]},
 {id:'rested',name:'Well rested',desc:'7 logged nights of 7–9.5 hours.',prog:g=>[g.rested,7]},
 {id:'lvl10',name:'Double digits',desc:'Reach level 10.',prog:g=>[g.level,10]},
].map(b=>({...b,test:g=>{const [a,n]=b.prog(g);return a>=n}}));
function dailyQuests(ds){
 if(preStart(ds))return [];
 const p=planFor(ds),st=dayStats(ds),d=getDay(ds),q=[];
 if(st.total){
  q.push({t:'Keep the streak: 70% of today’s hours',cur:st.dh,max:.7*st.ph,fmt:'h',xp:'streak'});
  q.push({t:'Clean sweep: every block today',cur:st.n,max:st.total,xp:XP.perfectDay});
 }
 const B=blocksFor(ds).filter(b=>b.track);
 if(B.some(b=>b.extra==='cards')){const tgt=+((p.modules||{}).language||{}).cards||10;q.push({t:`Add ${tgt} new cards`,cur:d.cards||0,max:tgt,xp:tgt})}
 if(B.some(b=>b.extra==='log')){const n=S.train.items.filter(x=>x.ds===ds).length;q.push({t:'Log today’s training session',cur:n,max:1,xp:XP.training})}
 if(B.some(b=>b.extra==='games'))q.push({t:'Warm up before ranked',cur:(d.valo||{}).aim?1:0,max:1,xp:XP.warmup});
 q.push({t:'Log last night’s sleep',cur:sleepHours(d)!=null?1:0,max:1,xp:XP.sleepLog});
 return q;
}
function weeklyQuests(wk){
 const fs=trackFrom();if(fs&&addDays(wk,6)<fs)return [];
 const p=planFor(wk),m=S.meta,ws=weekStats(wk),q=[];
 if(!fs||wk>=fs)q.push({t:'Solid week: 80% of planned hours',cur:ws.dh,max:.8*ws.ph,fmt:'h',xp:XP.solidWeek});
 if(modOn(p,'training')&&+p.modules.training.target)q.push({t:`Train ${p.modules.training.target} minutes`,cur:weekTrainMin(wk),max:+p.modules.training.target,xp:XP.weekTarget});
 if(modOn(p,'milestones'))q.push({t:'Log a weekly build',cur:m.builds[wk]?1:0,max:1,xp:XP.build});
 if(modOn(p,'music'))q.push({t:'Finish a production loop',cur:m.loops[wk]?1:0,max:1,xp:XP.loop});
 if(modOn(p,'food')){const tgt=+p.modules.food.meals||5;q.push({t:`Prep ${tgt} meals`,cur:(m.food[wk]||{}).prep||0,max:tgt,xp:XP.meals})}
 const r=m.reviews[wk]||{};q.push({t:'Write the weekly review',cur:(r.done||r.slipped||r.change)?1:0,max:1,xp:XP.review});
 return q;
}

/* =====================================================================
   Rendering
   ===================================================================== */
const app=document.getElementById('app');
let pendingRender=false,pointerDown=false,renderQueued=false,userAction=false,lastGame=null;
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function chipHTML(){
 const map={live:['ok','Synced'],saving:['busy','Syncing…'],error:['err','Not synced'],offline:['busy','Offline'],local:['','This device only']};
 const [cls,txt]=mode==='local'?map.local:(map[cloud.status]||map.local);
 return `<span class="chip ${cls}" id="syncchip" title="${esc(cloud.err||(mode==='cloud'?'Saved to your database and synced across devices':'Saved in this browser only'))}"><span class="dot"></span>${txt}</span>`;
}
function renderChip(){const el=document.getElementById('syncchip');if(el)el.outerHTML=chipHTML()}
function header(){
 const d=new Date(),t=today(),c=ctx(t),g=game();
 const sub=c.pre?`${c.p.name} starts ${fmtShort(c.p.start)} · ${daysBetween(t,c.p.start)} days to go`
  :c.after?`${c.p.name} ended ${fmtShort(c.p.end)}. Start your next plan in the Plan tab.`
  :[c.wi<0?'Warm-up week':`Week ${c.wi+1}`,c.brk?c.brk.name:phaseLabel(c.p,t).split(' · ')[0],c.deload?'Deload week':'',c.busy?'Busy week':''].filter(Boolean).join(' · ');
 const tabs=[['today','Today'],['week','Week'],['progress','Progress'],['programs','Programs'],['review','Review'],['plan','Plan'],['data','Settings']];
 return `<header class="top"><div class="wrap"><div class="toprow">
  <div class="brand"><h1>Cadence</h1><span class="sub">${esc(fmtDate(t))} · ${esc(sub)}</span></div>
  <div class="row"><button class="lvl" data-a="tab" data-v="progress" aria-label="Level ${g.level}, ${g.into} of ${g.need} XP"><b>Lv ${g.level} · ${esc(g.rank)}</b><span class="xpbar"><i style="width:${(g.into/g.need*100).toFixed(1)}%"></i></span></button>
  ${chipHTML()}<span class="clock" id="clock">${pad(d.getHours())}:${pad(d.getMinutes())}</span></div></div>
  <nav class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-a="tab" data-v="${k}" aria-selected="${ui.tab===k}">${l}</button>`).join('')}</nav></div></header>`;
}
function nowCard(){
 const {m,cur,next}=nowInfo(),p=planFor(today());
 const nx=next?`<span>Next: ${esc(next.title)} at <span class="num">${next.s}</span>${next.tomorrow?' tomorrow':''}</span>`:'';
 if(!cur)return `<section class="now" aria-live="polite"><span class="label">Right now</span><h2>Between blocks</h2><div class="meta">${nx}</div></section>`;
 const s=toMin(cur.s),e=endMin(cur),left=Math.max(0,Math.round(e-m)),pct=Math.min(100,(m-s)/(e-s)*100);
 const done=!!(getDay(today()).c||{})[cur.id];
 return `<section class="now" aria-live="polite">
  <div class="row"><span class="label">Right now · ${esc(pursuitOf(p,cur.cat).name)}</span><span class="spacer"></span>${cur.track?`<button class="btn" style="background:transparent;color:inherit;border-color:currentColor" data-a="toggle" data-d="${today()}" data-id="${esc(cur.id)}">${done?'Done':'Mark done · +'+cur.xp+' XP'}</button>`:''}</div>
  <h2>${esc(cur.title)}</h2>${cur.detail?`<p style="opacity:.85">${esc(cur.detail)}</p>`:''}
  <div class="prog"><i style="width:${pct.toFixed(1)}%"></i></div>
  <div class="meta"><span class="num">${cur.s}–${fmtEnd(cur.e)}</span><span><span class="num">${fmtH(left/60)}</span> left</span>${nx}</div></section>`;
}
function banners(c){
 const out=[],p=c.p,dec=(p.training||{}).decision||{};
 const span=c.span||1,tf=trackFrom(),startBtn=preStart(today())?` <button class="btn ghost small" data-a="trackfrom" data-v="${today()}">Start counting today</button>`:'';
 if(preStart(addDays(c.ds,span-1)))out.push(['',`<b>Preview.</b> Progress counts from ${fmtDate(tf)}. Days before that aren’t tracked or counted.${startBtn}`]);
 else if(preStart(c.ds))out.push(['',`<b>Progress counts from ${fmtDate(tf)}.</b> Earlier days this week aren’t tracked or counted.`]);
 if(c.brk)out.push(['good',`<b>${esc(c.brk.name)}.</b> ${esc(c.brk.note||'Full break.')} Runs ${fmtShort(c.brk.start)} – ${fmtShort(c.brk.end)}.`]);
 if(c.deload)out.push(['warn',`<b>Deload week.</b> Cut the marked pursuits by ${+p.deloadCut||0}% and rest. The planned hours already reflect it, so you lose no XP.`]);
 if(c.busy)out.push(['warn','<b>Busy week: minimums only.</b> Dropped blocks are off and minimum blocks shrink. Doing the minimums still counts as a full day.']);
 if(modOn(p,'training')&&dec.date&&dec.question&&!dec.answer){
  const n=daysBetween(today(),dec.date);
  if(n>=0&&c.ds===ui.sel)out.push(['',`<b>${esc(dec.question)}</b> Decide by ${fmtDate(dec.date)}${n>0?` (${n} day${n===1?'':'s'})`:' (today)'}. <button class="btn ghost small" data-a="go" data-tab="programs" data-prog="training">Decide</button>`]);
  else if(n<0&&n>-30)out.push(['bad',`<b>${esc(dec.question)}</b> was due ${fmtDate(dec.date)}. <button class="btn ghost small" data-a="go" data-tab="programs" data-prog="training">Decide now</button>`]);
 }
 return out.map(([k,h])=>`<div class="banner ${k}"><span class="bar"></span><div>${h}</div></div>`).join('');
}
function blockExtra(b,ds,p){
 const dd=getDay(ds);
 if(b.extra==='sleep'){
  const s=dd.sleep||{},h=sleepHours(dd);
  return `<div class="extra"><div class="row" style="align-items:flex-end">
   <label class="field" style="flex:0 1 130px"><span>Went to bed</span><input type="time" id="bed-${ds}" data-c="sleep" data-k="bed" data-d="${ds}" value="${esc(s.bed||'')}"></label>
   <label class="field" style="flex:0 1 130px"><span>Woke up</span><input type="time" id="wake-${ds}" data-c="sleep" data-k="wake" data-d="${ds}" value="${esc(s.wake||'')}"></label>
   ${h!=null?`<span class="pill ${h>=7&&h<=9.5?'good':'warn'}" style="margin-bottom:8px">${fmtH(h)} slept</span>`:`<span class="small muted" style="margin-bottom:8px">${preStart(ds)?'Before progress starts counting':`+${XP.sleepLog} XP to log, +${XP.rested} more for 7–9.5 h`}</span>`}</div></div>`;
 }
 if(!b.track)return '';
 if(b.extra==='games'){
  const v=dd.valo||{},g=v.g||[],n=Math.max(1,+((p.modules.games||{}).stopAfter)||2);
  const stop=g.length>=n&&g.slice(-n).every(x=>x==='L');
  return `<div class="extra">
   <label class="ck" style="padding:0"><input type="checkbox" id="aim-${ds}" data-c="aim" data-d="${ds}" ${v.aim?'checked':''}> Warm-up / aim routine done <span class="xptag">+${XP.warmup} XP</span></label>
   <div class="row"><span class="small muted">Games</span><div class="games">${g.map(x=>`<span class="g ${x}">${x}</span>`).join('')||'<span class="small muted">none yet</span>'}</div><span class="spacer"></span>
    <button class="btn" data-a="game" data-d="${ds}" data-v="W">Win</button><button class="btn" data-a="game" data-d="${ds}" data-v="L">Loss</button><button class="btn" data-a="game" data-d="${ds}" data-v="D">Draw</button>${g.length?`<button class="btn ghost" data-a="ungame" data-d="${ds}">Undo</button>`:''}</div>
   ${stop?`<div class="banner bad"><span class="bar"></span><div><b>Stop rule.</b> ${n} losses in a row. End the session here and bank <b>+${XP.discipline} XP</b> for keeping a cool head.</div></div>`:''}</div>`;
 }
 if(b.extra==='cards'){
  const target=+((p.modules.language||{}).cards)||10;
  return `<div class="extra"><div class="row"><span class="small muted">New cards today</span><button class="iconbtn" data-a="cards" data-d="${ds}" data-v="-1" aria-label="Fewer cards">−</button><span class="num">${dd.cards??0}</span><button class="iconbtn" data-a="cards" data-d="${ds}" data-v="1" aria-label="More cards">+</button><button class="btn ghost" data-a="cardsset" data-d="${ds}" data-v="${target}">Set ${target}</button><span class="xptag">1 XP per card</span></div></div>`;
 }
 if(b.extra==='log'){
  const logs=S.train.items.filter(x=>x.ds===ds);
  return `<div class="extra">${logs.map(x=>`<div class="row small"><span class="pill">${esc(x.type)}</span><span class="num">${x.min} min${x.km?' · '+x.km+' km':''}${x.rpe?' · RPE '+x.rpe:''}</span><span class="muted">${esc(x.note||'')}</span></div>`).join('')}
   ${ui.logOpen===ds+'|'+b.id?logForm(ds,b):`<div class="row"><button class="btn" data-a="logopen" data-d="${ds}" data-id="${esc(b.id)}">Log session</button><span class="xptag">+${XP.training} XP</span></div>`}</div>`;
 }
 if(b.extra==='build'){
  const wk=mondayOf(ds);
  return `<div class="extra"><label class="field"><span>What did you build this week?${preStart(addDays(wk,6))?'':` (+${XP.build} XP)`}</span><input type="text" id="build-${wk}" data-c="build" data-wk="${wk}" value="${esc(S.meta.builds[wk]||'')}" placeholder="e.g. micrograd engine training a 2-layer MLP"></label></div>`;
 }
 if(b.extra==='meals'){
  const wk=parse(ds).getDay()===0?addDays(ds,1):mondayOf(ds),f=S.meta.food[wk]||{},target=+((p.modules.food||{}).meals)||5;
  return `<div class="extra"><div class="row"><span class="small muted">Meals prepped for the week of ${fmtShort(wk)}</span><button class="iconbtn" data-a="prep" data-wk="${wk}" data-v="-1" aria-label="Fewer meals">−</button><span class="num">${f.prep||0}/${target}</span><button class="iconbtn" data-a="prep" data-wk="${wk}" data-v="1" aria-label="More meals">+</button>${preStart(addDays(wk,6))?'':`<span class="xptag">+${XP.meals} XP at ${target}</span>`}</div></div>`;
 }
 return '';
}
function logForm(ds,b){
 const guess=/swim/i.test(b.title)?'Swim':/ride|bike/i.test(b.title)?(/run/i.test(b.title)?'Brick':'Bike'):/strength|gym/i.test(b.title)?'Strength':'Run';
 return `<form class="row" data-form="log" data-d="${ds}" data-id="${esc(b.id)}" style="align-items:flex-end">
  <label class="field" style="flex:0 1 120px"><span>Type</span><select id="lg-type" name="type">${TTYPES.map(t=>`<option ${t===guess?'selected':''}>${t}</option>`).join('')}</select></label>
  <label class="field" style="flex:0 1 90px"><span>Minutes</span><input id="lg-min" name="min" type="number" min="1" max="900" required value="${Math.round(b.h*60)||''}"></label>
  <label class="field" style="flex:0 1 90px"><span>km</span><input id="lg-km" name="km" type="number" min="0" step="0.1"></label>
  <label class="field" style="flex:0 1 90px"><span>RPE 1–10</span><input id="lg-rpe" name="rpe" type="number" min="1" max="10"></label>
  <label class="field" style="flex:1 1 140px"><span>Note</span><input id="lg-note" name="note" type="text" placeholder="How it felt"></label>
  <button class="btn primary" type="submit">Save</button><button class="btn ghost" type="button" data-a="logclose">Cancel</button></form>`;
}
function barRow(p,cat,v){const pct=v.p?Math.min(100,v.d/v.p*100):0;return `<div class="barrow" ${laneOf(p,cat)}><span><span class="sw"></span>${esc(pursuitOf(p,cat).name)}</span><span class="track"><i style="width:${pct.toFixed(0)}%"></i></span><span class="v">${fmtH(v.d)} / ${fmtH(v.p)}</span></div>`}
function questList(q){
 return q.map(x=>{const done=x.cur>=x.max-1e-9&&x.max>0,pct=x.max?Math.min(100,x.cur/x.max*100):0;
  const val=x.fmt==='h'?`${fmtH(x.cur)} / ${fmtH(x.max)}`:`${Math.round(x.cur*10)/10} / ${Math.round(x.max*10)/10}`;
  return `<div class="quest ${done?'done':''}"><span class="qk"></span><div><div class="qt">${esc(x.t)}</div>${x.max>1&&!done?`<div class="qp"><i style="width:${pct.toFixed(0)}%"></i></div>`:''}</div><span class="small ${done?'':'muted'} num">${done?'✓':val}${x.xp==='streak'?'':` · <span class="xptag">+${x.xp}</span>`}</span></div>`}).join('');
}
function viewToday(){
 const ds=ui.sel,p=planFor(ds),c=ctx(ds,p),st=dayStats(ds),isToday=ds===today(),{cur}=nowInfo(),g=game();
 const tl=blocksFor(ds).map(b=>{
  const done=!!st.done[b.id];
  const cls=['blk',b.track?'':(b.dropped?'dropped':'untracked'),done&&b.track?'done':'',isToday&&cur&&cur.id===b.id?'current':''].join(' ');
  return `<div class="${cls}" ${laneOf(p,b.cat)}>
   <span class="t">${b.s}</span><span class="lane"></span>
   <div class="body"><span class="tag">${esc(pursuitOf(p,b.cat).name)}${b.track&&b.h?` · ${fmtH(b.h)} · <span class="xptag">+${b.xp} XP</span>`:''}</span><span class="ttl">${esc(b.title)}</span>${b.dropped?`<span class="det">${esc(b.dropped)}</span>`:b.detail?`<span class="det">${esc(b.detail)}</span>`:''}${blockExtra(b,ds,p)}</div>
   ${b.track?`<button class="check" aria-pressed="${done}" aria-label="${done?'Mark not done':'Mark done'}: ${esc(b.title)}" data-a="toggle" data-d="${ds}" data-id="${esc(b.id)}">${CHECK}</button>`:'<span></span>'}</div>`}).join('')||'<p class="empty">No blocks on this day. Add some in Plan → Timetable.</p>';
 const pct=st.ph?Math.round(st.dh/st.ph*100):0;
 const streaks=p.pursuits.filter(x=>x.streak);
 const side=`<div class="stack">
  ${isToday?`<div class="now-side">${nowCard()}</div>`:''}
  ${isToday?`<section class="panel"><div class="row"><h3>Today’s quests</h3><span class="spacer"></span><span class="pill xp">+${g.todayXP} XP today</span></div><div>${questList(dailyQuests(ds))}</div>
   <div class="row small"><span class="pill ${g.streak?'good':''}">${g.streak}-day streak</span><span class="muted">Best ${g.best}. Hit 70% of planned hours to keep it.</span></div></section>`:''}
  <section class="panel"><div class="row"><h3>${isToday?'Today’s':'Day’s'} progress</h3><span class="spacer"></span><span class="num muted">${st.n}/${st.total} blocks</span></div>
   <div class="track" style="--lane:var(--accent)"><i style="width:${pct}%"></i></div>
   <div class="bars">${Object.entries(st.per).map(([k,v])=>barRow(p,k,v)).join('')||'<p class="empty">Nothing tracked on this day.</p>'}</div></section>
  ${streaks.length?`<section class="panel"><h3>Habit streaks</h3><div class="stats">${streaks.map(x=>`<div class="stat"><span class="big">${g.pcur[x.id]||0}</span><span class="small muted">${esc(x.id===catOf('language')?langFor(p,today()):x.name)} days · best ${g.pbest[x.id]||0}</span></div>`).join('')}</div></section>`:''}
 </div>`;
 return `${banners(c)}${isToday?`<div class="now-top">${nowCard()}</div>`:''}<div class="grid2">
  <section class="panel">
   <div class="daynav"><button class="iconbtn" data-a="day" data-v="-1" aria-label="Previous day">‹</button><h2>${isToday?'Today · ':''}${esc(fmtDate(ds))}</h2>${isToday?'':'<button class="btn" data-a="day" data-v="0">Today</button>'}<button class="iconbtn" data-a="day" data-v="1" aria-label="Next day">›</button></div>
   ${plans().length>1?`<p class="small muted">${esc(p.name)}</p>`:''}
   <div class="tl">${tl}</div></section>${side}</div>`;
}
const weekDays=wk=>[...Array(7)].map((_,i)=>addDays(wk,i));
const weekTrainMin=wk=>S.train.items.filter(x=>mondayOf(x.ds)===wk&&!preStart(x.ds)).reduce((a,x)=>a+(+x.min||0),0);
const weekCards=wk=>weekDays(wk).reduce((a,d)=>a+(getDay(d).cards||0),0);
function weekGames(wk){let w=0,l=0;weekDays(wk).forEach(d=>((getDay(d).valo||{}).g||[]).forEach(x=>{if(x==='W')w++;if(x==='L')l++}));return w+'–'+l}
function sleepSummary(days){
 const hs=[],beds=[];days.forEach(d=>{const x=getDay(d),h=sleepHours(x);if(h!=null){hs.push(h);let b=toMin(x.sleep.bed);if(b<720)b+=1440;beds.push(b)}});
 if(!hs.length)return null;
 return {n:hs.length,avg:hs.reduce((a,b)=>a+b,0)/hs.length,bed:beds.reduce((a,b)=>a+b,0)/beds.length};
}
function viewWeek(){
 const wk=mondayOf(ui.sel),p=planFor(wk),ws=weekStats(wk),c=ctx(wk,p),t=today();
 const days=weekDays(wk).map(ds=>{const s=dayStats(ds),d=parse(ds),dp=planFor(ds);
  return `<button class="wd ${ds===t?'today':''}" data-a="openday" data-d="${ds}"><span class="dn">${DOW[d.getDay()]}</span><span class="dd">${d.getDate()}</span>
   <span class="pips">${s.blocks.map(b=>`<span class="pip ${s.done[b.id]?'on':''}" ${laneOf(dp,b.cat)}></span>`).join('')}</span>
   <span class="pct">${s.total?Math.round(s.n/s.total*100)+'%':'—'}</span></button>`}).join('');
 const order=p.pursuits.filter(x=>ws.per[x.id]).map(x=>x.id);
 const stats=[];
 if(modOn(p,'training'))stats.push([weekTrainMin(wk),'training minutes']);
 if(modOn(p,'games'))stats.push([weekGames(wk),'games (W–L)']);
 if(modOn(p,'language'))stats.push([weekCards(wk),'new cards']);
 const sl=sleepSummary(weekDays(wk));
 if(sl)stats.push([fmtH(sl.avg),`avg sleep · bed ~${fmtClock(sl.bed)}`]);
 return `${banners({...c,span:7})}<section class="panel">
  <div class="daynav"><button class="iconbtn" data-a="day" data-v="-7" aria-label="Previous week">‹</button><h2>Week of ${fmtShort(wk)}${c.after?'':c.wi>=0?` · week ${c.wi+1}`:addDays(wk,6)>=c.p.start?' · warm-up week':''}</h2><button class="iconbtn" data-a="day" data-v="7" aria-label="Next week">›</button></div>
  <div class="week">${days}</div>
  <label class="ck" style="padding:0"><input type="checkbox" id="busy-${wk}" data-c="busy" data-wk="${wk}" ${c.busy?'checked':''}> Busy week (deadline, travel, exams): drop to minimums</label>
 </section>
 <div class="grid2">
  <section class="panel"><div class="row"><h3>Hours by pursuit</h3><span class="spacer"></span><span class="num muted">${fmtH(ws.dh)} of ${fmtH(ws.ph)} planned</span></div>
   <div class="bars">${order.map(k=>barRow(p,k,ws.per[k])).join('')||'<p class="empty">Nothing planned this week.</p>'}</div>
   <p class="small muted">Planned hours come from your timetable, adjusted for busy, deload and break weeks. A block counts once you tick it.</p></section>
  <div class="stack">
   ${stats.length?`<section class="panel"><h3>The week in numbers</h3><div class="stats">${stats.map(([v,l])=>`<div class="stat"><span class="big">${v}</span><span class="small muted">${l}</span></div>`).join('')}</div></section>`:''}
   <section class="panel"><h3>Weekly quests</h3><div>${questList(weeklyQuests(wk))}</div></section>
  </div>
 </div>`;
}
function ring(pct,label,sub){
 const r=40,cfull=2*Math.PI*r,off=cfull*(1-Math.max(0,Math.min(1,pct)));
 return `<svg class="ring" viewBox="0 0 96 96" role="img" aria-label="${esc(label)} ${esc(sub)}"><circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--sunk)" stroke-width="8"/>
  <circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--xp)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${cfull.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 48 48)"/>
  <text x="48" y="50" text-anchor="middle" font-size="26" fill="var(--ink)">${esc(label)}</text><text x="48" y="68" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${esc(sub)}</text></svg>`;
}
function viewProgress(){
 const g=game(),p=planFor(today()),wk=mondayOf(today());
 const skills=p.pursuits.filter(x=>x.tracked).map(x=>{const xp=g.pxp[x.id]||0,L=skillOf(xp),into=xp-skillStart(L),need=skillStart(L+1)-skillStart(L);
  return `<div class="barrow" style="${laneVar(p,x.id)};grid-template-columns:150px minmax(0,1fr) 110px"><span><span class="sw"></span>${esc(x.name)}</span><span class="track"><i style="width:${(into/need*100).toFixed(0)}%"></i></span><span class="v">Lv ${L} · ${fmtH(g.phours[x.id]||0)}</span></div>`}).join('');
 const got=new Set(g.badges);
 const badges=BADGES.map(b=>{const [a,n]=b.prog(g),has=got.has(b.id);
  return `<div class="badge ${has?'got':''}"><span class="medal" aria-hidden="true">${has?'★':'·'}</span><b>${esc(b.name)}</b><span class="small muted">${esc(b.desc)}</span>${has?'<span class="pill good" style="align-self:flex-start">Unlocked</span>':`<span class="bp"><i style="width:${Math.min(100,a/n*100).toFixed(0)}%"></i></span><span class="small muted num">${Math.min(a,n)} / ${n}</span>`}</div>`}).join('');
 return `<div class="grid2">
  <div class="stack">
   <section class="panel"><div class="levelcard">${ring(g.into/g.need,'Lv '+g.level,g.into+'/'+g.need)}
    <div class="stack" style="gap:6px;flex:1"><h2>${esc(g.rank)}</h2><p class="muted">${g.xp.toLocaleString()} XP total · ${(g.need-g.into).toLocaleString()} XP to level ${g.level+1}</p>
     <div class="row"><span class="pill xp">+${g.todayXP} today</span><span class="pill xp">+${g.weekXP} this week</span><span class="pill ${g.streak?'good':''}">${g.streak}-day streak · best ${g.best}</span></div></div></div></section>
   <section class="panel"><h3>Skills</h3><p class="small muted">Each pursuit levels up from the blocks you finish in it.</p><div class="bars">${skills||'<p class="empty">No tracked pursuits.</p>'}</div></section>
   <section class="panel"><h3>This week’s quests</h3><div>${questList(weeklyQuests(wk))}</div></section>
  </div>
  <div class="stack">
   <section class="panel"><div class="row"><h3>Badges</h3><span class="spacer"></span><span class="num muted">${got.size} / ${BADGES.length}</span></div><div class="badges">${badges}</div></section>
   <section class="panel"><h3>How you earn XP</h3><div class="list small">
    <div class="li"><span class="grow">Each block you finish</span><span class="num">10 per planned hour (min 5)</span></div>
    <div class="li"><span class="grow">Clean sweep (every block in a day)</span><span class="num">+${XP.perfectDay}</span></div>
    <div class="li"><span class="grow">Streak day (70%+ of planned hours)</span><span class="num">+5 × streak, up to +${XP.streakCap}</span></div>
    <div class="li"><span class="grow">Solid week (80%) / perfect week</span><span class="num">+${XP.solidWeek} / +${XP.perfectWeek}</span></div>
    <div class="li"><span class="grow">Training session logged · weekly target hit</span><span class="num">+${XP.training} · +${XP.weekTarget}</span></div>
    <div class="li"><span class="grow">New flashcards</span><span class="num">1 per card</span></div>
    <div class="li"><span class="grow">Stopping at the stop rule · win · warm-up</span><span class="num">+${XP.discipline} · +${XP.win} · +${XP.warmup}</span></div>
    <div class="li"><span class="grow">Sleep logged · 7–9.5 h</span><span class="num">+${XP.sleepLog} · +${XP.rested}</span></div>
    <div class="li"><span class="grow">Weekly review · loop · build · meal prep</span><span class="num">+${XP.review} · +${XP.loop} · +${XP.build} · +${XP.meals}</span></div>
    <div class="li"><span class="grow">Milestone · whole phase · finished book</span><span class="num">+${XP.milestone} · +${XP.phase} · +${XP.book}</span></div></div>
    <p class="small muted">Busy and deload weeks lower the planned hours, so doing the minimums still keeps your streak. Skipping a missed session never costs XP, and stacking two into one day earns nothing extra.</p></section>
  </div></div>`;
}

/* Programs */
const PROGS=['milestones','training','music','language','games','reading','food','rotation'];
function viewPrograms(){
 const p=planFor(today());
 const on=PROGS.filter(k=>modOn(p,k));
 if(!on.length)return `<section class="panel"><h2>No programs switched on</h2><p class="muted">Turn programs on in Plan → Programs.</p></section>`;
 if(!on.includes(ui.prog))ui.prog=on[0];
 const fn={milestones:progMilestones,training:progTraining,music:progMusic,language:progLang,games:progGames,reading:progRead,food:progFood,rotation:progRot}[ui.prog];
 return `<div class="subnav">${on.map(k=>`<button style="${laneVar(p,p.modules[k].cat)}" aria-pressed="${ui.prog===k}" data-a="prog" data-v="${k}"><span class="sw"></span>${esc(p.modules[k].title||k)}</button>`).join('')}</div>${fn(p,p.modules[ui.prog])}`;
}
function progMilestones(p,m){
 const t=today();let n=0;
 const phases=[...(p.phases||[])].sort((a,b)=>(a.start||'').localeCompare(b.start||'')).map(ph=>{
  if(!ph.brk)n++;
  const state=t>ph.end?'past':t<ph.start?'future':'now';
  const items=ph.items||[],done=items.filter((_,i)=>S.meta.ml[ph.id+':'+i]).length;
  return `<div class="phase ${state}" ${laneOf(p,m.cat)}>
   <div class="row"><h3>${ph.brk?'Break':'Phase '+n} · ${esc(ph.name)}</h3>${state==='now'?'<span class="pill now">Now</span>':''}${!ph.brk&&items.length&&done===items.length?`<span class="pill good">Cleared</span>`:''}<span class="spacer"></span><span class="num small muted">${fmtShort(ph.start)} – ${fmtShort(ph.end)}</span></div>
   ${ph.brk?'<p class="small muted">No study.</p>':`<p class="small muted">You’re done when you can show: <span class="num">${done}/${items.length}</span> · <span class="xptag">+${XP.milestone} each, +${XP.phase} to clear</span></p>
   ${items.map((it,i)=>`<label class="ck"><input type="checkbox" id="ms-${ph.id}-${i}" data-c="ml" data-k="${ph.id}:${i}" ${S.meta.ml[ph.id+':'+i]?'checked':''}><span>${esc(it)}</span></label>`).join('')}`}</div>`}).join('');
 const builds=Object.entries(S.meta.builds).filter(([w,v])=>v&&w>=mondayOf(p.start)&&w<=p.end).sort((a,b)=>b[0].localeCompare(a[0]));
 const all=(p.phases||[]).flatMap(ph=>(ph.items||[]).map((_,i)=>ph.id+':'+i)),pct=all.length?Math.round(all.filter(k=>S.meta.ml[k]).length/all.length*100):0;
 return `<div class="grid2"><section class="panel"><div class="row"><h2>${esc(m.title)}</h2><span class="spacer"></span><span class="num muted">${pct}% of milestones</span></div>
  ${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}${phases||'<p class="empty">No phases yet. Add them in Plan → Milestones.</p>'}</section>
  <div class="stack"><section class="panel"><h3>Weekly builds</h3><div class="list">${builds.map(([wk,v])=>`<div class="li"><span class="num small muted" style="width:56px">${fmtShort(wk)}</span><span class="grow">${esc(v)}</span></div>`).join('')||'<p class="empty">Log a build from a block with a build note on the Today tab.</p>'}</div></section>
  ${(p.resources||[]).length?`<section class="panel"><h3>Resources</h3><div class="list">${p.resources.map(r=>`<div class="li">${/^https?:\/\//.test(r.url||'')?`<a class="grow" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>`:`<span class="grow">${esc(r.name)}</span>`}<span class="small muted">${esc(r.note||'')}</span></div>`).join('')}</div></section>`:''}</div></div>`;
}
function progTraining(p,m){
 const t=today(),tr=p.training||{},dec=tr.decision||{},wk=mondayOf(t),racing=dec.answer==='yes';
 const todayWd=parse(t).getDay();
 const byType={};S.train.items.filter(x=>mondayOf(x.ds)===wk).forEach(x=>{byType[x.type]=(byType[x.type]||0)+(+x.min||0)});
 const weeks=[...Array(6)].map((_,i)=>addDays(wk,-7*(5-i))).map(w=>({w,m:weekTrainMin(w)}));
 const target=+m.target||0,max=Math.max(target*1.15,60,...weeks.map(x=>x.m));
 const recent=[...S.train.items].sort((a,b)=>b.ds.localeCompare(a.ds)).slice(0,20);
 const n=dec.date?daysBetween(t,dec.date):null;
 const sess=(o,wd)=>{const s=(o||{})[wd];return s&&s.title?esc(s.title)+(s.detail?', '+esc(s.detail):''):'<span class="muted">—</span>'};
 const yT=100-(target/max)*86;
 return `<div class="grid2"><div class="stack">
  ${dec.date&&dec.question?`<section class="panel" ${laneOf(p,m.cat)}><div class="row"><h2>${esc(dec.question)}</h2><span class="spacer"></span>${dec.answer?`<span class="pill ${racing?'good':''}">${racing?'Yes':'No'}</span>`:`<span class="pill ${n<0?'bad':'warn'}">${n>0?n+' days left':n===0?'Due today':'Overdue'}</span>`}</div>
   <p class="small muted">Decide by ${fmtDate(dec.date)}. A yes switches sessions after that date${dec.altUntil?` (until ${fmtShort(dec.altUntil)})`:''} to the “${esc(tr.altLabel||'alternative')}” column.</p>
   ${dec.note?`<p class="small">${esc(dec.note)}</p>`:''}
   <div class="seg" role="group" aria-label="Decision"><button data-a="decide" data-v="yes" aria-pressed="${dec.answer==='yes'}">Yes</button><button data-a="decide" data-v="no" aria-pressed="${dec.answer==='no'}">No</button><button data-a="decide" data-v="" aria-pressed="${!dec.answer}">Undecided</button></div></section>`:''}
  <section class="panel" ${laneOf(p,m.cat)}><h2>${esc(m.title)}</h2>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
   <div class="tablewrap"><table><thead><tr><th>Day</th><th>${esc(tr.baseLabel||'Sessions')}</th><th>${esc(tr.altLabel||'Alternative')}</th></tr></thead><tbody>
   ${DOW_ORDER.map(wd=>`<tr><td>${DOW[wd]}</td><td class="${wd===todayWd&&!racing?'cur':''}">${sess(tr.base,wd)}</td><td class="${wd===todayWd&&racing?'cur':''}">${sess(tr.alt,wd)}</td></tr>`).join('')}</tbody></table></div></section></div>
 <div class="stack"><section class="panel" ${laneOf(p,m.cat)}><div class="row"><h3>This week</h3><span class="spacer"></span><span class="num muted">${weekTrainMin(wk)}${target?` / ${target}`:''} min</span></div>
   <div class="row small">${TTYPES.filter(k=>byType[k]).map(k=>`<span class="pill">${k} ${byType[k]} min</span>`).join('')||'<span class="muted">No sessions logged yet. Use “Log session” on a training block.</span>'}</div>
   <svg viewBox="0 0 300 120" width="100%" role="img" aria-label="Training minutes, last six weeks">
    ${[0,.5,1].map(f=>`<line x1="0" x2="300" y1="${100-f*86}" y2="${100-f*86}" stroke="var(--line)" stroke-width="1"/>`).join('')}
    ${target?`<line x1="0" x2="300" y1="${yT}" y2="${yT}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 4"/>`:''}
    ${weeks.map((x,i)=>{const h=x.m/max*86;return `<rect x="${i*50+12}" y="${100-h}" width="26" height="${h}" rx="3" fill="var(--lane)" opacity="${x.w===wk?1:.55}"/><text x="${i*50+25}" y="114" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${fmtShort(x.w)}</text>${x.m?`<text x="${i*50+25}" y="${96-h}" text-anchor="middle" font-size="9" fill="var(--ink)" font-family="IBM Plex Mono, monospace">${x.m}</text>`:''}`}).join('')}
   </svg><p class="small muted">Minutes per week, last six weeks.${target?` Dashed line: ${target} min target (+${XP.weekTarget} XP when you hit it).`:''}</p></section>
  <section class="panel"><h3>Session log</h3><div class="list">${recent.map(x=>`<div class="li"><span class="num small muted" style="width:52px">${fmtShort(x.ds)}</span><span class="pill">${esc(x.type)}</span><span class="grow small"><span class="num">${x.min} min${x.km?' · '+x.km+' km':''}${x.rpe?' · RPE '+x.rpe:''}</span> <span class="muted">${esc(x.note||'')}</span></span><button class="btn ghost danger small" data-a="dellog" data-id="${esc(x.id)}">Delete</button></div>`).join('')||'<p class="empty">Logged sessions appear here.</p>'}</div></section></div></div>`;
}
function progMusic(p,m){
 const wk=mondayOf(today()),st=p.stages||{},g=game();
 const loops=Object.entries(S.meta.loops).filter(([w,v])=>v&&w>=mondayOf(p.start)&&w<=p.end).length;
 const seg=(arr,key,label)=>arr&&arr.length?`<div class="field"><span>${label}</span><div class="seg" role="group" aria-label="${label}">${arr.map((t,i)=>`<button data-a="stage" data-k="${key}" data-v="${i}" aria-pressed="${Math.min(S.meta[key]||0,arr.length-1)===i}">${esc(t)}</button>`).join('')}</div></div>`:'';
 return `<div class="grid2"><section class="panel" ${laneOf(p,m.cat)}><h2>${esc(m.title)}</h2>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <label class="field"><span>Song you’re learning</span><input type="text" id="song" data-c="song" value="${esc(S.meta.song)}" placeholder="Song name"></label>
  ${seg(st.theory,'theory','Theory stage')}${seg(st.ear,'ear','Ear training stage')}
  <div class="stats"><div class="stat"><span class="big">${g.pcur[m.cat]||0}</span><span class="small muted">day streak · best ${g.pbest[m.cat]||0}</span></div></div></section>
 <section class="panel" ${laneOf(p,m.prodCat||m.cat)}><h2>Production</h2><p class="small muted">Finish one 60–90 second loop or sketch a week, done rather than perfect.</p>
  <label class="ck"><input type="checkbox" id="loop-${wk}" data-c="loop" data-wk="${wk}" ${S.meta.loops[wk]?'checked':''}><span>This week’s loop is finished ${preStart(addDays(wk,6))?'':`<span class="xptag">+${XP.loop} XP</span>`}</span></label>
  <div class="stats"><div class="stat"><span class="big">${loops}</span><span class="small muted">loops finished in this plan</span></div></div></section></div>`;
}
function progLang(p,m){
 const t=today(),g=game();let total=0;for(const k in S.months)for(const d in S.months[k])if(d>=p.start&&d<=p.end)total+=S.months[k][d].cards||0;
 const L=[...(p.languages||[])].sort((a,b)=>(a.start||'').localeCompare(b.start||''));
 return `<section class="panel" ${laneOf(p,m.cat)}><div class="row"><h2>${esc(langFor(p,t))}</h2><span class="spacer"></span><span class="pill now">Current</span></div>
  ${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <div class="stats"><div class="stat"><span class="big">${g.pcur[m.cat]||0}</span><span class="small muted">night streak · best ${g.pbest[m.cat]||0}</span></div><div class="stat"><span class="big">${total}</span><span class="small muted">new cards in this plan</span></div></div>
  <div class="list">${L.map(l=>`<div class="li"><span class="grow">${esc(l.name)}</span><span class="num small muted">${fmtShort(l.start)} – ${fmtShort(l.end)}</span>${inRange(t,l)?'<span class="pill now">Now</span>':''}</div>`).join('')||'<p class="empty">No languages scheduled. Add them in Plan → Dates.</p>'}</div></section>`;
}
function progGames(p,m){
 const wk=mondayOf(today()),g=game();
 const sessions=[];for(const k in S.months)for(const d in S.months[k]){const v=S.months[k][d].valo;if(v&&(v.g||[]).length)sessions.push([d,v])}
 sessions.sort((a,b)=>b[0].localeCompare(a[0]));
 return `<div class="grid2"><section class="panel" ${laneOf(p,m.cat)}><h2>${esc(m.title)}</h2>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <p class="small">Stop rule: end the session after ${+m.stopAfter||2} losses in a row. Stopping right there earns <span class="xptag">+${XP.discipline} XP</span>; playing on earns nothing extra.</p>
  <label class="field"><span>This week’s VOD focus: one pattern to fix</span><input type="text" id="vod-${wk}" data-c="vod" data-wk="${wk}" value="${esc(S.meta.vod[wk]||'')}" placeholder="e.g. dying to the same off-angle on B main"></label>
  <div class="stats"><div class="stat"><span class="big">${weekGames(wk)}</span><span class="small muted">this week (W–L)</span></div><div class="stat"><span class="big">${g.discipline}</span><span class="small muted">times you stopped on the rule</span></div></div></section>
  <section class="panel"><h3>Sessions</h3><div class="list">${sessions.slice(0,15).map(([d,v])=>`<div class="li"><span class="num small muted" style="width:52px">${fmtShort(d)}</span><div class="games grow">${v.g.map(x=>`<span class="g ${x}">${x}</span>`).join('')}</div>${v.aim?'<span class="pill">Warm-up</span>':''}</div>`).join('')||'<p class="empty">Log games from a block on the Today tab.</p>'}</div></section></div>`;
}
function progRead(p,m){
 const books=S.meta.books||[];const reading=books.filter(b=>b.status==='reading'),queued=books.filter(b=>b.status==='queued'),done=books.filter(b=>b.status==='done');
 const item=b=>`<div class="li"><div class="grow"><div>${esc(b.title)}${b.finished?` <span class="small muted">· ${fmtLong(b.finished)}</span>`:''}</div>${b.status==='done'?`<input type="text" id="line-${b.id}" data-c="bookline" data-id="${b.id}" value="${esc(b.line||'')}" placeholder="One line on this book" style="margin-top:4px">`:''}</div>
  ${b.status==='queued'?`<button class="btn small" data-a="book" data-id="${b.id}" data-v="reading">Start</button>`:''}${b.status==='reading'?`<button class="btn small" data-a="book" data-id="${b.id}" data-v="done">Finished${preStart(today())?'':` · +${XP.book} XP`}</button>`:''}<button class="btn ghost danger small" data-a="delbook" data-id="${b.id}">Remove</button></div>`;
 return `<div class="grid2"><section class="panel" ${laneOf(p,m.cat)}><h2>${esc(m.title)}</h2>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <form class="row" data-form="book" style="flex-wrap:nowrap"><input type="text" id="newbook" name="title" placeholder="Add a book to the list" required><button class="btn primary" type="submit">Add</button></form>
  <h3>Reading now</h3><div class="list">${reading.map(item).join('')||'<p class="empty">Nothing on the go. Start one from the list.</p>'}</div>
  ${reading.length>1?'<p class="small" style="color:var(--warn)">More than one book on the go.</p>':''}
  <h3>Up next</h3><div class="list">${queued.map(item).join('')||'<p class="empty">Your running list is empty.</p>'}</div></section>
  <section class="panel"><div class="row"><h3>Finished</h3><span class="spacer"></span><span class="num muted">${done.length}</span></div><div class="list">${done.map(item).join('')||'<p class="empty">Finished books and your one-line notes collect here.</p>'}</div></section></div>`;
}
function progFood(p,m){
 const wk=mondayOf(today()),f=S.meta.food[wk]||{};
 return `<section class="panel" ${laneOf(p,m.cat)}><h2>${esc(m.title)}</h2>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <div class="row"><span>Meals prepped this week</span><button class="iconbtn" data-a="prep" data-wk="${wk}" data-v="-1" aria-label="Fewer meals">−</button><span class="num">${f.prep||0}/${+m.meals||5}</span><button class="iconbtn" data-a="prep" data-wk="${wk}" data-v="1" aria-label="More meals">+</button>${preStart(addDays(wk,6))?'':`<span class="xptag">+${XP.meals} XP at target</span>`}</div>
  <label class="field"><span>This week’s new recipe</span><input type="text" id="recipe-${wk}" data-c="recipe" data-wk="${wk}" value="${esc(f.recipe||'')}" placeholder="e.g. chana masala with paneer tikka"></label>
  <details><summary>Past recipes</summary><div class="list">${Object.entries(S.meta.food).filter(([,v])=>v.recipe).sort((a,b)=>b[0].localeCompare(a[0])).map(([w,v])=>`<div class="li"><span class="num small muted" style="width:52px">${fmtShort(w)}</span><span class="grow">${esc(v.recipe)}</span></div>`).join('')||'<p class="empty">None yet.</p>'}</div></details></section>`;
}
function progRot(p,m){
 const t=today(),rot=[...(p.rotation||[])].sort((a,b)=>(a.start||'').localeCompare(b.start||''));
 return `<section class="panel" ${laneOf(p,m.cat)}><div class="row"><h2>${esc(m.title)}</h2><span class="spacer"></span><button class="btn" data-a="go" data-tab="plan" data-psec="dates">Edit blocks</button></div>${m.blurb?`<p class="small muted">${esc(m.blurb)}</p>`:''}
  <div class="list">${rot.map(r=>`<div class="li"><div class="grow"><div>${esc(r.name)}</div>${r.note?`<div class="small muted">${esc(r.note)}</div>`:''}</div><span class="num small muted">${fmtShort(r.start)} – ${fmtShort(r.end)}</span>${inRange(t,r)?'<span class="pill now">Now</span>':t>r.end?'<span class="pill">Done</span>':''}</div>`).join('')||'<p class="empty">No blocks yet.</p>'}</div>
  ${(p.breaks||[]).length?`<h3>Breaks</h3><div class="list">${p.breaks.map(b=>`<div class="li"><span class="grow">${esc(b.name)}</span><span class="num small muted">${fmtShort(b.start)} – ${fmtShort(b.end)}</span></div>`).join('')}</div>`:''}</section>`;
}
function viewReview(){
 const t=today(),wk=mondayOf(t),p=planFor(t),r=S.meta.reviews[wk]||{},slip=slipping(),ws=weekStats(wk);
 const past=Object.entries(S.meta.reviews).filter(([w])=>w!==wk).sort((a,b)=>b[0].localeCompare(a[0]));
 const q=(k,l)=>`<label class="field"><span>${l}</span><textarea id="rv-${k}-${wk}" data-c="review" data-wk="${wk}" data-k="${k}">${esc(r[k]||'')}</textarea></label>`;
 return `<div class="grid2"><section class="panel"><div class="row"><h2>Weekly review · ${fmtShort(wk)}</h2><span class="spacer"></span>${preStart(addDays(wk,6))?'':`<span class="xptag">+${XP.review} XP</span>`}</div>
  <p class="small muted">This week so far: ${fmtH(ws.dh)} of ${fmtH(ws.ph)} planned.</p>
  ${q('done','What got done?')}${q('slipped','What slipped, and why?')}${q('change','What changes next week?')}</section>
  <div class="stack"><section class="panel"><div class="row"><h3>Rules for a bad week</h3><span class="spacer"></span><button class="btn ghost small" data-a="busynow">${S.meta.busy[wk]?'Turn off busy week':'Mark this week busy'}</button></div>
   ${(p.rules||[]).length?`<ol class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${p.rules.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:'<p class="empty">No rules yet. Add them in Plan → Rules.</p>'}</section>
  <section class="panel"><h3>Slipping three weeks running</h3>${slip.length?slip.map(x=>`<div class="banner warn"><span class="bar"></span><div><b>${esc(x.name)}</b> has been under half its planned hours for three weeks. Consider moving it into the rotation.</div></div>`).join(''):'<p class="empty">Nothing flagged. This checks the last three full weeks of the current plan.</p>'}</section>
  <section class="panel"><h3>Past reviews</h3>${past.map(([w,v])=>`<details><summary>Week of ${fmtLong(w)}</summary><div class="small" style="display:flex;flex-direction:column;gap:6px;padding-top:6px"><p><b>Done:</b> ${esc(v.done||'—')}</p><p><b>Slipped:</b> ${esc(v.slipped||'—')}</p><p><b>Change:</b> ${esc(v.change||'—')}</p></div></details>`).join('')||'<p class="empty">Reviews you write collect here.</p>'}</section></div></div>`;
}

/* Plan editor */
const COLORS=[0,1,2,3,4,5,6,7,8,9,10,11,12];
const COLOR_NAMES=['Grey','Indigo','Teal','Amber','Orange','Red','Violet','Cyan','Olive','Steel','Slate','Pink','Green'];
const EXTRAS=[['','None'],['log','Training log'],['games','Games W/L + stop rule'],['cards','Flashcard counter'],['build','Weekly build note'],['meals','Meals prepped'],['sleep','Sleep log']];
const BUSY=[['keep','Keep (protected)'],['min','Shrink to minimum'],['drop','Drop']];
function F(p,path,o){
 o=o||{};const v=getPath(p,path);const id=('pe-'+p.id+'-'+path).replace(/[^\w-]/g,'_');
 const dt=o.type==='check'?'bool':(o.dt||'');
 const attrs=`id="${id}" data-c="pe" data-plan="${esc(p.id)}" data-path="${esc(path)}" data-dt="${dt}"`;
 if(o.type==='check')return `<label class="ck"><input type="checkbox" ${attrs} ${v?'checked':''}><span>${o.label}</span></label>`;
 let input;
 if(o.type==='select')input=`<select ${attrs}>${o.opts.map(([k,l])=>`<option value="${esc(k)}" ${String(v??'')===String(k)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 else if(o.type==='textarea')input=`<textarea ${attrs} placeholder="${esc(o.ph||'')}">${esc(dt==='lines'?(v||[]).join('\n'):v||'')}</textarea>`;
 else input=`<input type="${o.type||'text'}" ${attrs} value="${esc(dt==='csv'?(v||[]).join(', '):v??'')}" placeholder="${esc(o.ph||'')}" ${o.step?`step="${o.step}"`:''}>`;
 return `<label class="field ${o.cls||''}"><span>${o.label}</span>${input}</label>`;
}
const delBtn=(path,i,label)=>`<button class="btn ghost danger small" type="button" data-a="pdel" data-path="${path}" data-i="${i}">${label||'Remove'}</button>`;
function viewPlan(){
 const ps=plans(),cur=planFor(today());
 let p=ps.find(x=>x.id===ui.editPlan);if(!p){p=cur;ui.editPlan=p.id}
 const secs=[['basics','Basics'],['pursuits','Pursuits'],['timetable','Timetable'],['training','Training'],['milestones','Milestones'],['dates','Dates'],['programs','Programs'],['rules','Rules']];
 const list=[...ps].sort((a,b)=>(b.start||'').localeCompare(a.start||'')).map(x=>`<button class="planbtn" data-a="editplan" data-v="${esc(x.id)}" aria-pressed="${x.id===p.id}"><span class="grow"><b>${esc(x.name)}</b><br><span class="small muted num">${fmtLong(x.start)} – ${fmtLong(x.end)}</span></span>${x.id===cur.id?'<span class="pill now">Current</span>':today()>x.end?'<span class="pill">Past</span>':'<span class="pill">Upcoming</span>'}</button>`).join('');
 const confirmDel=ui.confirm==='delplan:'+p.id;
 const body={basics:edBasics,pursuits:edPursuits,timetable:edTimetable,training:edTraining,milestones:edMilestones,dates:edDates,programs:edPrograms,rules:edRules}[ui.psec]||edBasics;
 return `<div class="stack">
  <section class="panel"><div class="row"><h2>Your plans</h2><span class="spacer"></span>
   <button class="btn" data-a="newplan" data-v="copy">New plan from this one</button><button class="btn ghost" data-a="newplan" data-v="blank">New blank plan</button></div>
   <p class="small muted">Each plan covers a date range. Days use whichever plan covers them, so old days keep their old timetable and your history and XP stay intact.</p>
   <div class="planlist">${list}</div></section>
  <section class="panel"><div class="row"><h2>Editing: ${esc(p.name)}</h2><span class="spacer"></span>
   ${ps.length>1?(confirmDel?`<span class="small">Delete this plan? Your ticks and logs stay.</span><button class="btn danger" data-a="delplan" data-v="${esc(p.id)}">Delete plan</button><button class="btn ghost" data-a="unconfirm">Cancel</button>`:`<button class="btn ghost danger" data-a="confirm" data-v="delplan:${esc(p.id)}">Delete plan</button>`):''}</div>
   <div class="subnav">${secs.map(([k,l])=>`<button aria-pressed="${ui.psec===k}" data-a="psec" data-v="${k}">${l}</button>`).join('')}</div>
   <p class="help">Changes save as you leave each field and sync to your other devices.</p>
   ${ui.note?`<div class="banner warn"><span class="bar"></span><div>${esc(ui.note)}</div></div>`:''}
   ${body(p)}</section></div>`;
}
function edBasics(p){
 return `<div class="ed"><div class="edrow">
  ${F(p,'name',{label:'Plan name',cls:'wide'})}${F(p,'start',{label:'Starts',type:'date',cls:'narrow'})}${F(p,'end',{label:'Ends',type:'date',cls:'narrow'})}</div>
  <div class="edrow">${F(p,'deloadEvery',{label:'Deload every N weeks (0 = off)',type:'number',dt:'num',cls:'narrow'})}${F(p,'deloadCut',{label:'Deload cut, %',type:'number',dt:'num',cls:'narrow'})}
  <p class="help" style="flex:1 1 200px">Deload weeks cut the hours of pursuits marked “Deload” in Pursuits. Week 1 is the first full Monday–Sunday week of the plan; a plan that starts mid-week opens with a warm-up week.</p></div></div>`;
}
function edPursuits(p){
 const used=id=>Object.values(p.template||{}).reduce((a,d)=>a+(d||[]).filter(b=>b.cat===id).length,0);
 return `<div class="ed"><p class="help">Pursuits are the lanes in your timetable. Tracked pursuits get tick boxes, count toward your hours and level up as skills.</p>
  ${p.pursuits.map((x,i)=>{const u=used(x.id);return `<div class="edrow" style="${laneVar(p,x.id)}">
   ${F(p,`pursuits.${i}.name`,{label:'Name',cls:'wide'})}${F(p,`pursuits.${i}.color`,{label:'Colour',type:'select',dt:'num',opts:COLORS.map(c=>[c,COLOR_NAMES[c]])})}
   ${F(p,`pursuits.${i}.tracked`,{type:'check',label:'Tracked'})}${F(p,`pursuits.${i}.streak`,{type:'check',label:'Show streak'})}${F(p,`pursuits.${i}.deload`,{type:'check',label:'Deload'})}
   ${u?`<span class="small muted" style="padding-bottom:8px">${u} block${u===1?'':'s'}</span>`:delBtn('pursuits',i)}</div>`}).join('')}
  <div class="row"><button class="btn primary" data-a="padd" data-kind="pursuit">Add pursuit</button></div></div>`;
}
function edTimetable(p){
 const wd=ui.pday,day=(p.template||{})[wd]||[];
 const order=day.map((b,i)=>[b,i]).sort((a,b)=>toMin(a[0].s)-toMin(b[0].s));
 const opts=p.pursuits.map(x=>[x.id,x.name]);
 const arm=ui.confirm&&ui.confirm.startsWith('copy:')?ui.confirm.split(':'):null;
 return `<div class="ed">
  <div class="seg" role="group" aria-label="Day">${DOW_ORDER.map(d=>`<button data-a="pday" data-v="${d}" aria-pressed="${d===wd}">${DOW[d]}</button>`).join('')}</div>
  <p class="help">Placeholders fill themselves in: <code>{phase}</code> <code>{language}</code> <code>{rotation}</code> <code>{rotation-note}</code> <code>{song}</code> <code>{theory}</code> <code>{ear}</code>. A block set to “Use training session” takes its title, detail and hours from Plan → Training. Leave hours blank to use the block’s length. An end time of 00:00 means midnight.</p>
  ${order.map(([b,i])=>{const base=`template.${wd}.${i}`;return `<div class="edrow" style="${laneVar(p,b.cat)}">
   ${F(p,base+'.s',{label:'Start',type:'time',cls:'narrow'})}${F(p,base+'.e',{label:'End',type:'time',cls:'narrow'})}
   ${F(p,base+'.cat',{label:'Pursuit',type:'select',opts})}${F(p,base+'.title',{label:'Title',cls:'wide'})}
   ${F(p,base+'.detail',{label:'Detail',cls:'full'})}
   ${F(p,base+'.h',{label:'Hours',type:'number',dt:'num',step:'0.05',ph:'auto',cls:'narrow'})}
   ${F(p,base+'.extra',{label:'Widget',type:'select',opts:EXTRAS})}
   ${F(p,base+'.busy',{label:'In a busy week',type:'select',opts:BUSY})}
   ${b.busy&&b.busy!=='keep'?F(p,base+'.busyDetail',{label:b.busy==='min'?'Minimum version':'Note when dropped',cls:'wide'}):''}
   ${b.busy==='min'?F(p,base+'.busyH',{label:'Min hours',type:'number',dt:'num',step:'0.05',cls:'narrow'}):''}
   ${F(p,base+'.session',{type:'check',label:'Use training session'})}
   ${delBtn('template.'+wd,i)}</div>`}).join('')||'<p class="empty">No blocks on this day.</p>'}
  <div class="row"><button class="btn primary" data-a="padd" data-kind="block">Add block</button><span class="spacer"></span>
   ${arm?`<span class="small">Replace ${DOW[+arm[1]]} with ${DOW[wd]}’s blocks?</span><button class="btn danger" data-a="copyday" data-v="${arm[1]}">Replace ${DOW[+arm[1]]}</button><button class="btn ghost" data-a="unconfirm">Cancel</button>`
   :`<span class="small muted">Copy this day to</span>${DOW_ORDER.filter(d=>d!==wd).map(d=>`<button class="btn ghost small" data-a="confirm" data-v="copy:${d}">${DOW[d]}</button>`).join('')}`}</div></div>`;
}
function edTraining(p){
 return `<div class="ed"><p class="help">Training sessions feed every block set to “Use training session”. A yes on the decision switches to the second column between the decision date and the “until” date.</p>
  <div class="edrow">${F(p,'training.decision.question',{label:'Decision question (blank for none)',cls:'wide',ph:'e.g. Racing the 70.3?'})}${F(p,'training.decision.date',{label:'Decide by',type:'date',cls:'narrow'})}${F(p,'training.decision.altUntil',{label:'Second column until',type:'date',cls:'narrow'})}
   ${F(p,'training.decision.note',{label:'Note',type:'textarea',cls:'full'})}</div>
  <div class="edrow">${F(p,'training.baseLabel',{label:'First column name'})}${F(p,'training.altLabel',{label:'Second column name'})}</div>
  ${DOW_ORDER.map(wd=>`<div class="edrow"><b style="flex:1 1 100%">${DOW[wd]}</b>
   ${F(p,`training.base.${wd}.title`,{label:'Session'})}${F(p,`training.base.${wd}.detail`,{label:'Detail',cls:'wide'})}${F(p,`training.base.${wd}.h`,{label:'Hours (0 = rest)',type:'number',dt:'num',step:'0.05',cls:'narrow'})}
   ${F(p,`training.alt.${wd}.title`,{label:'Second column session'})}${F(p,`training.alt.${wd}.detail`,{label:'Detail',cls:'wide'})}${F(p,`training.alt.${wd}.h`,{label:'Hours',type:'number',dt:'num',step:'0.05',cls:'narrow'})}</div>`).join('')}</div>`;
}
function edMilestones(p){
 const ph=(p.phases||[]).map((x,i)=>[x,i]).sort((a,b)=>(a[0].start||'').localeCompare(b[0].start||''));
 return `<div class="ed"><p class="help">Phases with dates and a “done when” checklist, one item per line. <code>{phase}</code> in a block shows the phase running that day; during a break phase those blocks switch off.</p>
  ${ph.map(([x,i])=>`<div class="edrow" style="${laneVar(p,(p.modules.milestones||{}).cat)}">
   ${F(p,`phases.${i}.name`,{label:'Phase',cls:'wide'})}${F(p,`phases.${i}.start`,{label:'Starts',type:'date',cls:'narrow'})}${F(p,`phases.${i}.end`,{label:'Ends',type:'date',cls:'narrow'})}
   ${F(p,`phases.${i}.brk`,{type:'check',label:'Break (no study)'})}
   ${x.brk?'':F(p,`phases.${i}.items`,{label:'Done when you can show (one per line)',type:'textarea',dt:'lines',cls:'full'})}${delBtn('phases',i)}</div>`).join('')||'<p class="empty">No phases.</p>'}
  <div class="row"><button class="btn primary" data-a="padd" data-kind="phase">Add phase</button></div>
  <h3>Resources</h3>
  ${(p.resources||[]).map((r,i)=>`<div class="edrow">${F(p,`resources.${i}.name`,{label:'Name',cls:'wide'})}${F(p,`resources.${i}.url`,{label:'Link',type:'url',cls:'wide'})}${F(p,`resources.${i}.note`,{label:'Note'})}${delBtn('resources',i)}</div>`).join('')}
  <div class="row"><button class="btn" data-a="padd" data-kind="resource">Add resource</button></div></div>`;
}
function edDates(p){
 const rows=(key,label,withNote)=>`<h3>${label}</h3>${(p[key]||[]).map((r,i)=>`<div class="edrow">${F(p,`${key}.${i}.name`,{label:'Name',cls:'wide'})}${F(p,`${key}.${i}.start`,{label:'Starts',type:'date',cls:'narrow'})}${F(p,`${key}.${i}.end`,{label:'Ends',type:'date',cls:'narrow'})}${withNote?F(p,`${key}.${i}.note`,{label:'Note',cls:'full'}):''}${delBtn(key,i)}</div>`).join('')||'<p class="empty">None.</p>'}<div class="row"><button class="btn" data-a="padd" data-kind="${key}">Add</button></div>`;
 return `<div class="ed">
  <p class="help">Languages fill <code>{language}</code>, rotating blocks fill <code>{rotation}</code> and <code>{rotation-note}</code>, and breaks pause all tracking for their dates.</p>
  ${rows('rotation','Rotating blocks',true)}${rows('languages','Languages, one at a time',false)}${rows('breaks','Breaks',true)}</div>`;
}
function edPrograms(p){
 const opts=p.pursuits.map(x=>[x.id,x.name]);
 const NAMES={milestones:'Milestones (phases + checklist)',training:'Training (sessions, decision, log)',music:'Music (song, theory and ear stages, production)',language:'Language',games:'Games (W/L, stop rule, VOD focus)',reading:'Reading list',food:'Food',rotation:'Rotation overview'};
 return `<div class="ed"><p class="help">Programs are the pages under the Programs tab. Switch on the ones this plan uses and pick the pursuit whose colour they take.</p>
  ${Object.keys(NAMES).map(k=>{const m=(p.modules||{})[k]||{};return `<div class="edrow" style="${laneVar(p,m.cat)}"><b style="flex:1 1 100%">${NAMES[k]}</b>
   ${F(p,`modules.${k}.on`,{type:'check',label:'On'})}${F(p,`modules.${k}.title`,{label:'Title'})}${F(p,`modules.${k}.cat`,{label:'Pursuit',type:'select',opts})}
   ${k==='music'?F(p,'modules.music.prodCat',{label:'Production pursuit',type:'select',opts}):''}
   ${k==='training'?F(p,'modules.training.target',{label:'Weekly target, min',type:'number',dt:'num',cls:'narrow'}):''}
   ${k==='games'?F(p,'modules.games.stopAfter',{label:'Stop after N losses',type:'number',dt:'num',cls:'narrow'}):''}
   ${k==='language'?F(p,'modules.language.cards',{label:'New cards a day',type:'number',dt:'num',cls:'narrow'}):''}
   ${k==='food'?F(p,'modules.food.meals',{label:'Meals to prep',type:'number',dt:'num',cls:'narrow'}):''}
   ${F(p,`modules.${k}.blurb`,{label:'Description',type:'textarea',cls:'full'})}
   ${k==='music'?F(p,'stages.theory',{label:'Theory stages, in order (comma-separated)',dt:'csv',cls:'full'})+F(p,'stages.ear',{label:'Ear training stages (comma-separated)',dt:'csv',cls:'full'}):''}</div>`}).join('')}</div>`;
}
function edRules(p){return `<div class="ed"><div class="edrow">${F(p,'rules',{label:'Rules for a bad week, one per line',type:'textarea',dt:'lines',cls:'full'})}</div></div>`}

function viewData(){
 const cloudOn=mode==='cloud';
 return `<div class="grid2"><section class="panel"><h2>Account and sync</h2>
  ${cloudOn?`<p>Signed in as <b>${esc(cloud.email)}</b>. Everything is saved to your database and updates live on every device where you sign in.</p>
   <div class="row">${chipHTML()}<span class="spacer"></span><button class="btn" data-a="signout">Sign out</button></div>`
  :`<p>You’re using Cadence without an account, so data stays in this browser only.</p><div class="row">${chipHTML()}<span class="spacer"></span>${sb?'<button class="btn primary" data-a="gosignin">Sign in to sync</button>':''}</div><p class="small muted">When you sign in to an empty account, everything on this device comes with you.</p>`}
  ${cloud.err&&cloudOn?`<div class="banner bad"><span class="bar"></span><div>${esc(cloud.err)}</div></div>`:''}
  <h3>Install</h3><p class="small muted">On iPhone: Share → Add to Home Screen. On Android or desktop Chrome/Edge: the install icon in the address bar, or menu → Install app.</p>
  <h3>Progress</h3><p class="small muted">XP, streaks, quests and stats count from this date. Earlier days stay saved but show as a preview.</p>
  <div class="row"><label class="field" style="flex:0 1 180px"><span>Count progress from</span><input type="date" id="trackfrom" data-c="trackfrom" value="${esc(trackFrom())}"></label><button class="btn" data-a="trackfrom" data-v="${today()}" style="align-self:flex-end">Start from today</button></div>
  <h3>Theme</h3><div class="seg" role="group" aria-label="Theme">${['system','light','dark'].map(t=>`<button data-a="theme" data-v="${t}" aria-pressed="${(S.meta.theme||'system')===t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div></section>
  <section class="panel"><h2>Backup</h2>
   <p class="small muted">Download everything (plans, ticks, logs, notes) as a JSON file, or paste a backup to restore it. Backups from the earlier version of Cadence work too.</p>
   <div class="row"><button class="btn" data-a="download">Download backup</button><button class="btn ghost" data-a="copyjson">Copy as text</button></div>
   <label class="field"><span>Paste a backup</span><textarea id="importbox" data-c="importtext">${esc(ui.importText)}</textarea></label>
   ${ui.confirm==='import'?`<div class="banner bad"><span class="bar"></span><div>This replaces all your current data${cloudOn?' on every device':''}. <div class="row" style="margin-top:6px"><button class="btn danger" data-a="doimport">Replace my data</button><button class="btn ghost" data-a="unconfirm">Cancel</button></div></div></div>`:`<div class="row"><button class="btn" data-a="confirm" data-v="import" ${ui.importText.trim()?'':'disabled'}>Restore backup</button></div>`}
  </section></div>`;
}
function viewAuth(){
 const a=ui.auth;
 const msg=a.msg?`<p class="msg ${a.bad?'bad':''}" role="status">${esc(a.msg)}</p>`:'';
 if(a.mode==='newpass')return `<main class="wrap"><div class="auth"><h1>Cadence</h1><h2>Choose a new password</h2>${msg}
  <form data-form="newpass"><label class="field"><span>New password</span><input type="password" id="np" name="password" minlength="8" autocomplete="new-password" required></label><button class="btn primary big" type="submit" ${a.busy?'disabled':''}>Save password</button></form></div></main>`;
 const signup=a.mode==='signup',reset=a.mode==='reset';
 return `<main class="wrap"><div class="auth">
  <div><h1>Cadence</h1><p class="muted">Your plan, your week, and every session you log. Sign in to sync across your laptop, phone and PC.</p></div>
  ${msg}
  <form data-form="${reset?'reset':signup?'signup':'signin'}">
   <label class="field"><span>Email</span><input type="email" id="au-email" name="email" autocomplete="email" required value="${esc(a.email)}"></label>
   ${reset?'':`<label class="field"><span>Password${signup?' (8+ characters)':''}</span><input type="password" id="au-pass" name="password" minlength="${signup?8:1}" autocomplete="${signup?'new-password':'current-password'}" required></label>`}
   <button class="btn primary big" type="submit" ${a.busy?'disabled':''}>${reset?'Email me a reset link':signup?'Create account':'Sign in'}</button>
  </form>
  <div class="row small">${signup||reset?'<button class="btn ghost" data-a="authmode" data-v="signin">I have an account</button>':'<button class="btn ghost" data-a="authmode" data-v="signup">Create an account</button><button class="btn ghost" data-a="authmode" data-v="reset">Forgot password</button>'}</div>
  <hr style="border:0;border-top:1px solid var(--line);width:100%">
  <button class="btn" data-a="uselocal">Use on this device without an account</button>
 </div></main>`;
}
function renderLoading(){app.innerHTML=`<header class="top"><div class="wrap"><div class="toprow"><div class="brand"><h1>Cadence</h1><span class="sub">Loading your plan…</span></div>${chipHTML()}</div></div></header>`}

function render(){
 renderQueued=false;pendingRender=false;
 if(mode==='auth'){app.innerHTML=viewAuth();renderChat();return}
 if(!S){renderLoading();renderChat();return}
 const a=document.activeElement,fid=a&&app.contains(a)?a.id:null;
 let sel=null;try{if(fid&&a.selectionStart!=null)sel=[a.selectionStart,a.selectionEnd]}catch(e){}
 applyTheme();
 const g=game();
 if(lastGame&&userAction)celebrate(lastGame,g);
 lastGame=g;userAction=false;
 const v={today:viewToday,week:viewWeek,progress:viewProgress,programs:viewPrograms,review:viewReview,plan:viewPlan,data:viewData}[ui.tab]||viewToday;
 const y=window.scrollY;
 app.innerHTML=header()+`<main class="wrap">${v()}</main>`;
 window.scrollTo(0,y);
 if(fid){const el=document.getElementById(fid);if(el){el.focus({preventScroll:true});if(sel)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}}}
 renderChat();
}
/* User-driven renders wait for the pointer to lift; background renders also wait while a field is being edited. */
function scheduleRender(background){
 if(background){const a=document.activeElement;if(pointerDown||(a&&app.contains(a)&&a.matches('input:not([type=checkbox]),textarea,select'))){pendingRender=true;return}}
 if(pointerDown){pendingRender=true;return}
 if(renderQueued)return;renderQueued=true;setTimeout(render,0);
}
function applyTheme(){const t=S.meta.theme||'system';if(t==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);LS.set('cadence.theme',t)}

/* Rewards: toasts for XP, level-ups and badges */
const toastsEl=document.getElementById('toasts');
function toast(html,cls){if(!toastsEl)return;const el=document.createElement('div');el.className='toast '+(cls||'');el.innerHTML=html;toastsEl.appendChild(el);
 while(toastsEl.children.length>3)toastsEl.firstChild.remove();setTimeout(()=>el.remove(),cls==='lvlup'?4800:2900)}
function celebrate(a,b){
 const d=b.xp-a.xp;
 if(d>0)toast(`<span class="x">+${d} XP</span><span>${b.todayXP} today</span>`);
 if(b.level>a.level){toast(`<span>Level ${b.level} · ${esc(b.rank)}</span>`,'lvlup');confetti()}
 const had=new Set(a.badges);b.badges.filter(x=>!had.has(x)).forEach(id=>{const bd=BADGES.find(x=>x.id===id);if(bd)toast(`<span class="x">★</span><span>Badge unlocked: ${esc(bd.name)}</span>`,'lvlup')});
 if(b.streak>a.streak&&b.streak>1&&[3,7,14,21,30,50,100].includes(b.streak))toast(`<span>${b.streak}-day streak</span>`);
}
function confetti(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);
 const ctx2=c.getContext('2d'),W=c.width=innerWidth*devicePixelRatio,H=c.height=innerHeight*devicePixelRatio;
 const cs=getComputedStyle(document.documentElement),cols=[1,2,3,5,6,7].map(i=>cs.getPropertyValue('--c'+i).trim()).concat([cs.getPropertyValue('--xp').trim()]);
 const P=[...Array(120)].map(()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.85,vx:(Math.random()-.5)*14*devicePixelRatio,vy:-(8+Math.random()*12)*devicePixelRatio,r:Math.random()*6+3,c:cols[Math.floor(Math.random()*cols.length)],a:Math.random()*6}));
 let f=0;const step=()=>{ctx2.clearRect(0,0,W,H);for(const p of P){p.vy+=.35*devicePixelRatio;p.x+=p.vx;p.y+=p.vy;p.a+=.2;ctx2.fillStyle=p.c;ctx2.save();ctx2.translate(p.x,p.y);ctx2.rotate(p.a);ctx2.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx2.restore()}
  if(++f<110)requestAnimationFrame(step);else c.remove()};requestAnimationFrame(step);
}

/* =====================================================================
   Events
   ===================================================================== */
function newItem(kind,p){
 const s=p.start||today();
 switch(kind){
  case 'pursuit':return {id:uid(),name:'New pursuit',color:1+Math.floor(Math.random()*12),tracked:true,streak:false,deload:false};
  case 'block':{const day=p.template[ui.pday]||[];const last=[...day].sort((a,b)=>endMin(b)-endMin(a))[0];const st=last&&endMin(last)<1440?last.e:'09:00';const en=Math.min(1439,toMin(st)+60);
   return blankBlock({s:st,e:fmtClock(en),cat:(p.pursuits.find(x=>x.tracked)||p.pursuits[0]||{id:'life'}).id})}
  case 'phase':{const last=[...(p.phases||[])].sort((a,b)=>(b.end||'').localeCompare(a.end||''))[0];const st=last&&last.end?addDays(last.end,1):s;return {id:uid(),name:'New phase',start:st,end:addDays(st,27),items:[],brk:false}}
  case 'resource':return {id:uid(),name:'New resource',url:'',note:''};
  default:{const arr=p[kind]||[];const last=[...arr].sort((a,b)=>(b.end||'').localeCompare(a.end||''))[0];const st=last&&last.end?addDays(last.end,1):s;
   const o={id:uid(),name:kind==='languages'?'Language':kind==='breaks'?'Break':'New block',start:st,end:addDays(st,kind==='breaks'?6:34)};if(kind!=='languages')o.note='';return o}
 }
}
const pathFor=kind=>kind==='pursuit'?'pursuits':kind==='block'?'template.'+ui.pday:kind==='phase'?'phases':kind==='resource'?'resources':kind;
app.addEventListener('pointerdown',()=>{pointerDown=true},true);
addEventListener('pointerup',()=>{pointerDown=false;if(pendingRender)setTimeout(()=>{if(pendingRender)scheduleRender(true)},0)},true);
addEventListener('pointercancel',()=>{pointerDown=false});
function saveFile(name,text){const blob=new Blob([text],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
app.addEventListener('click',async e=>{
 const el=e.target.closest('[data-a]');if(!el||el.disabled)return;
 const a=el.dataset.a,d=el.dataset.d,v=el.dataset.v;
 const go=()=>{render();window.scrollTo(0,0)};
 switch(a){
  case 'tab':ui.tab=v;ui.confirm=null;ui.note='';LS.set('cadence.tab',v);if(v==='today')ui.sel=today();go();break;
  case 'go':ui.tab=el.dataset.tab;if(el.dataset.prog)ui.prog=el.dataset.prog;if(el.dataset.psec){ui.psec=el.dataset.psec;ui.editPlan=planFor(today()).id}go();break;
  case 'prog':ui.prog=v;LS.set('cadence.prog',v);render();break;
  case 'day':ui.sel=v==='0'?today():addDays(ui.sel,+v);ui.logOpen=null;render();break;
  case 'openday':ui.sel=d;ui.tab='today';go();break;
  case 'toggle':mutDay(d,x=>{x.c=x.c||{};if(x.c[el.dataset.id])delete x.c[el.dataset.id];else x.c[el.dataset.id]=1});break;
  case 'game':mutDay(d,x=>{x.valo=x.valo||{};x.valo.g=[...(x.valo.g||[]),v]});break;
  case 'ungame':mutDay(d,x=>{x.valo=x.valo||{};x.valo.g=(x.valo.g||[]).slice(0,-1)});break;
  case 'cards':mutDay(d,x=>{x.cards=Math.max(0,(x.cards||0)+(+v))});break;
  case 'cardsset':mutDay(d,x=>{x.cards=+v});break;
  case 'prep':mutMeta(m=>{const w=el.dataset.wk;m.food[w]=m.food[w]||{};m.food[w].prep=Math.max(0,Math.min(14,(m.food[w].prep||0)+(+v)))});break;
  case 'logopen':ui.logOpen=d+'|'+el.dataset.id;render();break;
  case 'logclose':ui.logOpen=null;render();break;
  case 'dellog':mutTrain(t=>{t.items=t.items.filter(x=>x.id!==el.dataset.id)});break;
  case 'decide':mutPlan(planFor(today()).id,p=>{p.training.decision.answer=v||null});break;
  case 'stage':mutMeta(m=>{m[el.dataset.k]=+v});break;
  case 'book':mutMeta(m=>{const b=m.books.find(x=>x.id===el.dataset.id);if(b){b.status=v;if(v==='done')b.finished=today()}});break;
  case 'delbook':mutMeta(m=>{m.books=m.books.filter(x=>x.id!==el.dataset.id)});break;
  case 'busynow':mutMeta(m=>{const w=mondayOf(today());if(m.busy[w])delete m.busy[w];else m.busy[w]=1});break;
  case 'theme':mutMeta(m=>{m.theme=v});break;
  case 'trackfrom':mutMeta(m=>{m.trackFrom=v});toast(`<span>Progress now counts from ${esc(fmtDate(v))}</span>`);break;
  case 'confirm':ui.confirm=v;render();break;
  case 'unconfirm':ui.confirm=null;render();break;
  case 'editplan':ui.editPlan=v;ui.confirm=null;ui.note='';render();break;
  case 'psec':ui.psec=v;ui.confirm=null;ui.note='';render();break;
  case 'pday':ui.pday=+v;ui.confirm=null;render();break;
  case 'newplan':{const src=plans().find(x=>x.id===ui.editPlan)||planFor(today());const lastEnd=plans().reduce((acc,x)=>x.end>acc?x.end:acc,'');
   const st=[addDays(lastEnd||today(),1),today()].sort().pop();
   const np=v==='copy'?{...clone(src),id:uid(),name:src.name+' (next)',start:st,end:addDays(st,167),phases:[],languages:[],breaks:[],rotation:[]}:blankPlan(st);
   if(v==='copy'&&np.training&&np.training.decision)np.training.decision={...np.training.decision,date:'',altUntil:'',answer:null};
   ui.editPlan=np.id;ui.psec='basics';mutPlans(ps=>{ps.plans.push(np)});break}
  case 'delplan':ui.confirm=null;ui.editPlan=null;mutPlans(ps=>{if(ps.plans.length>1)ps.plans=ps.plans.filter(x=>x.id!==v)});break;
  case 'padd':{const p=plans().find(x=>x.id===ui.editPlan);if(!p)break;const kind=el.dataset.kind,path=pathFor(kind);
   mutPlan(p.id,pp=>{const arr=getPath(pp,path);const item=newItem(kind,pp);if(Array.isArray(arr))arr.push(item);else setPath(pp,path,[item])});break}
  case 'pdel':{const path=el.dataset.path,i=+el.dataset.i;mutPlan(ui.editPlan,pp=>{const arr=getPath(pp,path);if(Array.isArray(arr))arr.splice(i,1)});break}
  case 'copyday':ui.confirm=null;mutPlan(ui.editPlan,pp=>{pp.template[+v]=clone(pp.template[ui.pday]||[])});break;
  case 'download':saveFile('cadence-backup-'+today()+'.json',JSON.stringify(S,null,1));break;
  case 'copyjson':{const txt=JSON.stringify(S,null,1);
   const fallback=()=>{ui.importText=txt;render();toast('<span>Copy blocked. The backup is in the box below.</span>')};
   try{navigator.clipboard.writeText(txt).then(()=>toast('<span>Backup copied</span>'),fallback)}catch(_){fallback()}break}
  case 'doimport':{try{const v2=JSON.parse(ui.importText);if(!v2||typeof v2!=='object'||!v2.meta)throw 0;
   const keepTf=S&&S.meta&&S.meta.trackFrom;S={meta:v2.meta,train:v2.train||{items:[]},months:v2.months||{},plans:v2.plans||null};if(!S.meta.trackFrom&&keepTf)S.meta.trackFrom=keepTf;normalize();ui.confirm=null;ui.importText='';
   lastGame=null;changed();toast('<span>Backup restored</span>')}catch(_){ui.confirm=null;render();toast('<span>That backup could not be read.</span>')}break}
  case 'signout':if(sb){LS.del(cacheKey());if(cloud.channel)try{sb.removeChannel(cloud.channel)}catch(_){}
   await sb.auth.signOut();mode='auth';cloud.uid=null;cloud.base=null;S=null;lastGame=null;ui.auth={mode:'signin',email:cloud.email,msg:'Signed out.',bad:false,busy:false};render()}break;
  case 'gosignin':LS.del('cadence.mode');mode='auth';ui.auth.mode='signin';render();break;
  case 'authmode':ui.auth.mode=v;ui.auth.msg='';ui.auth.bad=false;render();break;
  case 'uselocal':startLocal();break;
 }
});
app.addEventListener('change',e=>{
 const el=e.target,c=el.dataset.c;if(!c)return;
 const val=el.type==='checkbox'?el.checked:el.value;
 switch(c){
  case 'pe':{const dt=el.dataset.dt;let v=val;
   if(dt==='num')v=val===''?null:Number(val);else if(dt==='bool')v=!!val;else if(dt==='lines')v=String(val).split('\n').map(s=>s.trim()).filter(Boolean);else if(dt==='csv')v=String(val).split(',').map(s=>s.trim()).filter(Boolean);
   const path=el.dataset.path,p=plans().find(x=>x.id===el.dataset.plan);
   if(p&&(path==='start'||path==='end')){const s=path==='start'?v:p.start,en=path==='end'?v:p.end;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||en<s){ui.note='A plan needs a start date and an end date on or after it.';render();break}}
   if(p&&/\.(s|e)$/.test(path)&&!/^\d{2}:\d{2}$/.test(v||'')){ui.note='Times need hours and minutes, like 07:30.';render();break}
   ui.note='';mutPlan(el.dataset.plan,pp=>setPath(pp,path,v));break}
  case 'aim':mutDay(el.dataset.d,x=>{x.valo=x.valo||{};x.valo.aim=val});break;
  case 'sleep':mutDay(el.dataset.d,x=>{x.sleep=x.sleep||{};x.sleep[el.dataset.k]=val;if(!x.sleep.bed&&!x.sleep.wake)delete x.sleep});break;
  case 'busy':mutMeta(m=>{if(val)m.busy[el.dataset.wk]=1;else delete m.busy[el.dataset.wk]});break;
  case 'trackfrom':if(/^\d{4}-\d{2}-\d{2}$/.test(val))mutMeta(m=>{m.trackFrom=val});else render();break;
  case 'ml':mutMeta(m=>{if(val)m.ml[el.dataset.k]=1;else delete m.ml[el.dataset.k]});break;
  case 'loop':mutMeta(m=>{if(val)m.loops[el.dataset.wk]=1;else delete m.loops[el.dataset.wk]});break;
  case 'build':mutMeta(m=>{const t=val.trim();if(t)m.builds[el.dataset.wk]=t;else delete m.builds[el.dataset.wk]});break;
  case 'song':mutMeta(m=>{m.song=val.trim()});break;
  case 'vod':mutMeta(m=>{const t=val.trim();if(t)m.vod[el.dataset.wk]=t;else delete m.vod[el.dataset.wk]});break;
  case 'recipe':mutMeta(m=>{const w=el.dataset.wk;m.food[w]=m.food[w]||{};m.food[w].recipe=val.trim()});break;
  case 'bookline':mutMeta(m=>{const b=m.books.find(x=>x.id===el.dataset.id);if(b)b.line=val.trim()});break;
  case 'review':mutMeta(m=>{const w=el.dataset.wk;m.reviews[w]={...(m.reviews[w]||{}),[el.dataset.k]:val}});break;
 }
});
app.addEventListener('input',e=>{const el=e.target;if(el.dataset.c==='importtext'){ui.importText=el.value;const b=app.querySelector('[data-a="confirm"][data-v="import"]');if(b)b.disabled=!el.value.trim()}});
app.addEventListener('focusout',()=>{setTimeout(()=>{if(pendingRender)scheduleRender(true)},0)});
app.addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target,kind=f.dataset.form,fd=new FormData(f);
 if(kind==='log'){const ds=f.dataset.d,bid=f.dataset.id;const item={id:uid(),ds,type:fd.get('type'),min:+fd.get('min')||0,km:+fd.get('km')||0,rpe:+fd.get('rpe')||0,note:String(fd.get('note')||'').trim()};
  if(!item.min)return;ui.logOpen=null;if(document.activeElement)document.activeElement.blur();
  const t=clone(S.train);t.items.push(item);S.train=t;
  const k='m-'+ds.slice(0,7);const m=clone(S.months[k]||{});m[ds]=m[ds]||{};m[ds].c=m[ds].c||{};m[ds].c[bid]=1;S.months[k]=m;changed();return}
 if(kind==='book'){const title=String(fd.get('title')||'').trim();if(!title)return;if(document.activeElement)document.activeElement.blur();
  mutMeta(m=>{m.books.push({id:uid(),title,status:m.books.some(b=>b.status==='reading')?'queued':'reading'})});return}
 if(!sb)return;
 const A=ui.auth,email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
 A.email=email||A.email;A.busy=true;A.msg='';A.bad=false;render();
 try{
  if(kind==='signin'){const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;A.msg=''}
  else if(kind==='signup'){const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});if(error)throw error;
   if(!data.session){A.mode='signin';A.msg='Check your email and tap the confirmation link, then sign in here.'}}
  else if(kind==='reset'){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;A.msg='If that address has an account, a reset link is on its way.'}
  else if(kind==='newpass'){const {error}=await sb.auth.updateUser({password});if(error)throw error;A.mode='signin';A.msg='Password updated.'}
 }catch(err){A.msg=errText(err);A.bad=true}
 A.busy=false;if(mode==='auth')render();
});

/* Live clock: update the clock text, and re-render the Today view when the minute changes. */
let lastMin=-1,lastDay=today();
setInterval(()=>{
 const d=new Date(),m=d.getHours()*60+d.getMinutes();
 const c=document.getElementById('clock');if(c)c.textContent=pad(d.getHours())+':'+pad(d.getMinutes());
 if(!S)return;
 if(today()!==lastDay){if(ui.sel===lastDay)ui.sel=today();lastDay=today();ver++;scheduleRender(true);return}
 if(m!==lastMin){lastMin=m;if(ui.tab==='today')scheduleRender(true)}
},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S)scheduleRender(true)});

/* =====================================================================
   Assistant: talk to Cadence. The model proposes tool calls; the app runs
   them here through the same mutations as the buttons, so every change
   syncs, earns XP and can be undone.
   ===================================================================== */
const chat={open:false,busy:false,api:[],items:[],undos:{},undone:false,rec:null,voice:false,loadedFor:null};
const chatKey=()=>'cadence.chat.'+(cloud.uid||'local');
function loadChat(){const c=LS.get(chatKey());chat.api=c&&Array.isArray(c.api)?c.api:[];chat.items=c&&Array.isArray(c.items)?c.items:[];chat.undos=c&&c.undos&&typeof c.undos==='object'?c.undos:{};chat.loadedFor=chatKey()}
function saveChat(){const items=chat.items.slice(-80),keep=new Set(items.map(i=>i.id).slice(-30)),undos={};for(const k in chat.undos)if(keep.has(k))undos[k]=chat.undos[k];chat.undos=undos;LS.set(chatKey(),{api:chat.api.slice(-200),items,undos})}
/* Undo records the rows a reply changed (before and after), so it can reverse exactly those rows later. */
function rowDiff(before,after){const a=toRows(before),b=toRows(after),out=[];
 for(const t of TABLES)for(const id of new Set([...Object.keys(a[t]),...Object.keys(b[t])]))if(stable(a[t][id])!==stable(b[t][id]))out.push({t,id,before:a[t][id]??null,after:b[t][id]??null});
 return out}
const isDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&iso(parse(s))===s;
const isTime=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');
const needDate=d=>{if(!isDate(d))throw 'date must be a real date written YYYY-MM-DD';return d};
const titleOf=(ds,id)=>{const b=blocksFor(ds).find(x=>x.id===id);return b?b.title:id};
function dayView(ds){
 const p=planFor(ds),d=getDay(ds),st=dayStats(ds);
 return {date:ds,weekday:DOW[parse(ds).getDay()],plan_id:p.id,
  blocks:blocksFor(ds).map(b=>({id:b.id,start:b.s,end:fmtEnd(b.e),title:b.title,pursuit:pursuitOf(p,b.cat).name,tracked:b.track,...(b.preview?{preview:true}:{}),...(b.dropped?{dropped:b.dropped}:{}),done:!!st.done[b.id],hours:Math.round(b.h*100)/100,...(b.extra?{widget:b.extra}:{})})),
  cards:d.cards||0,warmup:!!(d.valo||{}).aim,games:((d.valo||{}).g||[]).join(''),sleep:d.sleep||null,
  training:S.train.items.filter(x=>x.ds===ds).map(x=>({id:x.id,type:x.type,minutes:x.min,km:x.km||null,rpe:x.rpe||null,note:x.note||''}))};
}
function trainingBlock(ds){return blocksFor(ds).find(b=>b.track&&b.extra==='log')}
function blockDefaults(v,day){const b=Object.assign(blankBlock(),v&&typeof v==='object'?v:{});if(!b.id||day.some(x=>x.id===b.id))b.id=uid();return b}
function validatePlan(p){
 const bad=m=>m;
 if(!p.name||typeof p.name!=='string')return bad('The plan needs a name.');
 if(!isDate(p.start)||!isDate(p.end)||p.end<p.start)return bad('The plan needs real start and end dates, with the end on or after the start.');
 const ids=new Set();
 for(const x of p.pursuits||[]){if(!x||!x.id||ids.has(x.id))return bad('Every pursuit needs a unique id.');ids.add(x.id);
  if(!Number.isInteger(+x.color)||+x.color<0||+x.color>12)return bad(`Pursuit "${x.name}" needs a colour from 0 to 12.`)}
 for(let d=0;d<7;d++){const day=(p.template||{})[d];if(!Array.isArray(day))return bad(`template.${d} must be a list of blocks.`);const seen=new Set();
  for(const [i,b] of day.entries()){const at=`template.${d}.${i}`;
   if(!b||!b.id||seen.has(b.id))return bad(`${at} needs a unique id within the day.`);seen.add(b.id);
   if(!isTime(b.s)||!(isTime(b.e)||b.e==='24:00'))return bad(`${at} needs start and end times as HH:MM.`);
   if(!ids.has(b.cat))return bad(`${at} uses pursuit "${b.cat}", which isn't one of the plan's pursuits.`);
   if(!['keep','min','drop'].includes(b.busy||'keep'))return bad(`${at}.busy must be keep, min or drop.`);
   if(!['','log','games','cards','build','meals','sleep'].includes(b.extra||''))return bad(`${at}.extra is not a known widget.`);
   if(b.h!=null&&b.h!==''&&!(+b.h>=0))return bad(`${at}.h must be a number of hours or null.`)}}
 for(const k of ['phases','languages','breaks','rotation']){for(const [i,x] of (p[k]||[]).entries()){
  if(!x||!x.id)return bad(`${k}.${i} needs an id.`);
  if(!isDate(x.start)||!isDate(x.end)||x.end<x.start)return bad(`${k}.${i} needs real start and end dates.`);
  if(k==='phases'&&!Array.isArray(x.items||[]))return bad(`phases.${i}.items must be a list.`)}}
 if(!(+p.deloadEvery>=0))return bad('deloadEvery must be 0 or more.');
 try{toRows({...emptyState(),plans:{plans:[p]}})}catch(e){return bad('The plan could not be saved: '+(e.message||e))}
 return null;
}
const findBook=i=>{const bs=S.meta.books||[];if(i.book_id){const b=bs.find(x=>x.id===i.book_id);if(!b)throw 'No book with that id.';return b}
 const q=String(i.title||'').toLowerCase().trim();if(!q)throw 'Give a book_id or title.';
 const hits=bs.filter(x=>x.title.toLowerCase().includes(q));if(hits.length!==1)throw hits.length?'More than one book matches; use book_id.':'No book on the list matches that title.';return hits[0]};
const TOOL_IMPL={
 get_day:i=>({result:dayView(needDate(i.date))}),
 update_day(i){
  const ds=needDate(i.date),blocks=blocksFor(ds),byId=new Map(blocks.map(b=>[b.id,b]));
  const unknown=[...(i.done||[]),...(i.undone||[])].filter(x=>!byId.has(x));
  if(unknown.length)throw `Unknown block ids on ${ds}: ${unknown.join(', ')}. Call get_day to see that day's blocks.`;
  if((i.done||[]).length&&preStart(ds))throw `${ds} is before progress starts counting (${trackFrom()}), so nothing can be ticked that day. To count it, move the start with set_tracking_start.`;
  const untracked=(i.done||[]).filter(x=>!byId.get(x).track);
  if(untracked.length)throw `These blocks can't be ticked on ${ds} (untracked or dropped): ${untracked.map(x=>byId.get(x).title).join(', ')}.`;
  for(const k of ['sleep_bed','sleep_wake'])if(i[k]!=null&&i[k]!==''&&!isTime(i[k]))throw `${k} must be HH:MM in 24-hour time.`;
  for(const k of ['games','games_replace'])if(i[k]!=null&&!/^[WLD]*$/.test(i[k]))throw `${k} may only contain W, L and D.`;
  const notes=[];
  mutDay(ds,x=>{
   x.c=x.c||{};(i.done||[]).forEach(id=>{x.c[id]=1});(i.undone||[]).forEach(id=>{delete x.c[id]});
   if(i.cards!=null)x.cards=Math.max(0,Math.round(+i.cards)||0);
   if(i.add_cards)x.cards=Math.max(0,(x.cards||0)+Math.round(+i.add_cards||0));
   if(i.warmup!=null||i.games||i.games_replace!=null){x.valo=x.valo||{};if(i.warmup!=null)x.valo.aim=!!i.warmup;
    if(i.games_replace!=null)x.valo.g=i.games_replace.split('');if(i.games)x.valo.g=[...(x.valo.g||[]),...i.games.split('')]}
   if(i.sleep_bed!=null||i.sleep_wake!=null){x.sleep=x.sleep||{};if(i.sleep_bed!=null)x.sleep.bed=i.sleep_bed;if(i.sleep_wake!=null)x.sleep.wake=i.sleep_wake;if(!x.sleep.bed&&!x.sleep.wake)delete x.sleep}
  });
  if((i.done||[]).length)notes.push('Ticked '+i.done.map(id=>byId.get(id).title).join(', '));
  if((i.undone||[]).length)notes.push('Unticked '+i.undone.map(id=>byId.get(id).title).join(', '));
  if(i.cards!=null||i.add_cards)notes.push(`${getDay(ds).cards||0} new cards`);
  if(i.games||i.games_replace!=null)notes.push('Games '+((getDay(ds).valo||{}).g||[]).join(''));
  if(i.warmup!=null)notes.push(i.warmup?'Warm-up done':'Warm-up cleared');
  if(i.sleep_bed!=null||i.sleep_wake!=null){const s=getDay(ds).sleep;notes.push(s?`Sleep ${s.bed||'?'}–${s.wake||'?'}`:'Sleep cleared')}
  return {result:dayView(ds),summary:notes.length?`${notes.join(' · ')} (${fmtDate(ds)})`:null};
 },
 log_training(i){
  const ds=needDate(i.date),type=TTYPES.find(t=>t.toLowerCase()===String(i.type||'').toLowerCase());
  if(!type)throw 'type must be one of '+TTYPES.join(', ');
  const min=Math.round(+i.minutes);if(!(min>=1&&min<=900))throw 'minutes must be between 1 and 900.';
  const item={id:uid(),ds,type,min,km:+i.km>0?Math.round(+i.km*100)/100:0,rpe:(+i.rpe>=1&&+i.rpe<=10)?Math.round(+i.rpe):0,note:String(i.note||'').trim()};
  const tb=trainingBlock(ds);
  const t=clone(S.train);t.items.push(item);S.train=t;
  if(tb){const k='m-'+ds.slice(0,7);const m=clone(S.months[k]||{});m[ds]=m[ds]||{};m[ds].c=m[ds].c||{};m[ds].c[tb.id]=1;S.months[k]=m}
  changed();
  return {result:{session_id:item.id,ticked_block:tb?tb.title:null},summary:`Logged ${type} ${min} min${item.km?' · '+item.km+' km':''}${item.rpe?' · RPE '+item.rpe:''} (${fmtDate(ds)})`};
 },
 delete_training(i){const x=S.train.items.find(t=>t.id===i.session_id);if(!x)throw 'No training session with that id.';
  mutTrain(t=>{t.items=t.items.filter(y=>y.id!==x.id)});return {result:{ok:true},summary:`Deleted ${x.type} ${x.min} min (${fmtDate(x.ds)})`}},
 update_week(i){
  const wk=mondayOf(needDate(i.date)),notes=[];
  mutMeta(m=>{
   const setTxt=(obj,v)=>{const t=String(v).trim();if(t)obj[wk]=t;else delete obj[wk]};
   if(i.busy!=null){if(i.busy)m.busy[wk]=1;else delete m.busy[wk];notes.push(i.busy?'Busy week on':'Busy week off')}
   if(i.build!=null){setTxt(m.builds,i.build);notes.push('Build logged')}
   if(i.loop_done!=null){if(i.loop_done)m.loops[wk]=1;else delete m.loops[wk];notes.push(i.loop_done?'Loop finished':'Loop unticked')}
   if(i.meals_prepped!=null||i.recipe!=null){m.food[wk]=m.food[wk]||{};if(i.meals_prepped!=null){m.food[wk].prep=Math.max(0,Math.min(14,Math.round(+i.meals_prepped)||0));notes.push(`${m.food[wk].prep} meals prepped`)}if(i.recipe!=null){m.food[wk].recipe=String(i.recipe).trim();notes.push('Recipe saved')}}
   if(i.vod_focus!=null){setTxt(m.vod,i.vod_focus);notes.push('VOD focus set')}
   const rv={};if(i.review_done!=null)rv.done=i.review_done;if(i.review_slipped!=null)rv.slipped=i.review_slipped;if(i.review_change!=null)rv.change=i.review_change;
   if(Object.keys(rv).length){m.reviews[wk]={...(m.reviews[wk]||{}),...rv};notes.push('Review saved')}
  });
  return {result:{week_start:wk,ok:true},summary:notes.length?`${notes.join(' · ')} (week of ${fmtShort(wk)})`:null};
 },
 manage_books(i){
  const a=i.action;
  if(a==='add'){const title=String(i.title||'').trim();if(!title)throw 'title is required to add a book.';let id=uid();
   mutMeta(m=>{m.books.push({id,title,status:m.books.some(b=>b.status==='reading')?'queued':'reading'})});return {result:{book_id:id},summary:`Added “${title}”`}}
  const b=findBook(i);
  mutMeta(m=>{const x=m.books.find(y=>y.id===b.id);if(a==='start')x.status='reading';else if(a==='finish'){x.status='done';x.finished=today();if(i.line)x.line=String(i.line).trim()}
   else if(a==='note')x.line=String(i.line||'').trim();else if(a==='remove')m.books=m.books.filter(y=>y.id!==b.id);else throw 'Unknown action.'});
  return {result:{ok:true},summary:{start:'Started',finish:'Finished',note:'Noted',remove:'Removed'}[a]+` “${b.title}”`};
 },
 update_progress(i){
  const p=planFor(today()),notes=[];
  for(const ms of i.milestones||[]){const ph=plans().flatMap(x=>x.phases||[]).find(x=>x.id===ms.phase_id);
   if(!ph)throw `No phase with id ${ms.phase_id}.`;if(!(ms.item_index>=0&&ms.item_index<(ph.items||[]).length))throw `Phase ${ph.name} has no item ${ms.item_index}.`}
  const stage=(arr,name,label)=>{const k=(arr||[]).findIndex(x=>x.toLowerCase()===String(name).toLowerCase());if(k<0)throw `${label} must be one of: ${(arr||[]).join(', ')}`;return k};
  const th=i.theory_stage!=null?stage(p.stages.theory,i.theory_stage,'theory_stage'):null,ea=i.ear_stage!=null?stage(p.stages.ear,i.ear_stage,'ear_stage'):null;
  if((i.milestones||[]).length||i.song!=null||th!=null||ea!=null)mutMeta(m=>{
   for(const ms of i.milestones||[]){const k=ms.phase_id+':'+ms.item_index;if(ms.done)m.ml[k]=1;else delete m.ml[k]}
   if(i.song!=null)m.song=String(i.song).trim();if(th!=null)m.theory=th;if(ea!=null)m.ear=ea});
  for(const ms of i.milestones||[]){const ph=plans().flatMap(x=>x.phases||[]).find(x=>x.id===ms.phase_id);notes.push(`${ms.done?'Ticked':'Unticked'} “${ph.items[ms.item_index]}”`)}
  if(i.song!=null)notes.push(`Song: ${i.song}`);if(th!=null)notes.push(`Theory: ${p.stages.theory[th]}`);if(ea!=null)notes.push(`Ear training: ${p.stages.ear[ea]}`);
  if(i.decision){const v=i.decision==='undecided'?null:i.decision;mutPlan(p.id,pp=>{pp.training.decision.answer=v});notes.push(`Decision: ${i.decision}`)}
  return {result:{ok:true},summary:notes.join(' · ')||null};
 },
 get_plan(i){
  const p=i.plan_id?plans().find(x=>x.id===i.plan_id):planFor(today());if(!p)throw 'No plan with that id.';
  const map={basics:['id','name','start','end','deloadEvery','deloadCut'],pursuits:['pursuits'],template:['template'],training:['training'],phases:['phases'],languages:['languages'],breaks:['breaks'],rotation:['rotation'],resources:['resources'],modules:['modules'],stages:['stages'],rules:['rules']};
  const secs=(i.sections&&i.sections.length?i.sections:Object.keys(map));const out={id:p.id,name:p.name};
  for(const s of secs)for(const k of map[s]||[])out[k]=clone(p[k]);
  if(out.template)out.template_note='Keys 0-6 are Sunday-Saturday. Use each block\'s position in its array as the index in paths.';
  return {result:out};
 },
 edit_plan(i){
  const p0=i.plan_id?plans().find(x=>x.id===i.plan_id):planFor(today());if(!p0)throw 'No plan with that id.';
  const ops=i.operations;if(!Array.isArray(ops)||!ops.length)throw 'operations must be a non-empty list.';
  const p=clone(p0);
  ops.forEach((op,k)=>{
   const path=String((op&&op.path)||'').trim(),segs=path.split('.');
   if(!path||segs[0]==='id')throw `Operation ${k}: give a path other than id.`;
   const parentPath=segs.slice(0,-1).join('.'),last=segs[segs.length-1];
   if(op.op==='set'){if(!('value' in op))throw `Operation ${k}: set needs a value.`;const parent=parentPath?getPath(p,parentPath):p;
    if(parent==null||typeof parent!=='object')throw `Operation ${k}: ${parentPath} doesn't exist.`;
    if(Array.isArray(parent)&&!(/^\d+$/.test(last)&&+last<parent.length))throw `Operation ${k}: ${path} is past the end of the list; use insert.`;
    parent[last]=op.value}
   else if(op.op==='insert'){let arr=getPath(p,path);if(arr==null&&/^template\.[0-6]$/.test(path)){p.template[segs[1]]=arr=[]}
    if(!Array.isArray(arr))throw `Operation ${k}: ${path} is not a list.`;let v=op.value;
    if(/^template\.[0-6]$/.test(path))v=blockDefaults(v,arr);
    else if(path==='pursuits'){v={id:uid(),name:'New pursuit',color:1,tracked:true,streak:false,deload:false,...(v||{})};if(p.pursuits.some(x=>x.id===v.id))v.id=uid()}
    else if(['phases','languages','breaks','rotation','resources'].includes(path)){v={...(v||{})};if(!v.id||arr.some(x=>x.id===v.id))v.id=uid();if(path==='phases'){v.items=Array.isArray(v.items)?v.items:[];v.brk=!!v.brk}}
    const at=op.index==null?arr.length:Math.max(0,Math.min(arr.length,Math.round(+op.index)));arr.splice(at,0,v)}
   else if(op.op==='remove'){const arr=getPath(p,parentPath),idx=+last;
    if(!Array.isArray(arr)||!Number.isInteger(idx)||idx<0||idx>=arr.length)throw `Operation ${k}: ${path} is not an item in a list.`;arr.splice(idx,1)}
   else throw `Operation ${k}: op must be set, insert or remove.`;
  });
  const err=validatePlan(p);if(err)throw err+' Nothing was changed.';
  mutPlans(ps=>{const ix=ps.plans.findIndex(x=>x.id===p.id);ps.plans[ix]=p});
  return {result:{ok:true,plan_id:p.id},summary:String(i.summary||'Edited the plan')};
 },
 create_plan(i){
  const start=needDate(i.start),end=needDate(i.end);if(end<start)throw 'end must be on or after start.';
  const src=i.from_plan_id?plans().find(x=>x.id===i.from_plan_id):planFor(today());if(i.mode==='copy'&&!src)throw 'No plan to copy.';
  const np=i.mode==='copy'?{...clone(src),id:uid(),name:String(i.name||src.name+' (next)'),start,end,phases:[],languages:[],breaks:[],rotation:[]}:Object.assign(blankPlan(start),{name:String(i.name||'New plan'),end});
  if(np.training&&np.training.decision)np.training.decision={...np.training.decision,date:'',altUntil:'',answer:null};
  const err=validatePlan(np);if(err)throw err;
  const overlap=plans().filter(x=>x.start<=end&&x.end>=start).map(x=>x.name);
  mutPlans(ps=>{ps.plans.push(np)});
  return {result:{plan_id:np.id,overlaps:overlap},summary:`Created plan “${np.name}”, ${fmtShort(start)} – ${fmtShort(end)}`};
 },
 set_tracking_start(i){
  const ds=needDate(i.date),was=trackFrom();
  mutMeta(m=>{m.trackFrom=ds});
  return {result:{counting_from:ds,previously:was},summary:`Progress now counts from ${fmtDate(ds)}`};
 },
 clear_logs(i){
  const from=needDate(i.from),to=needDate(i.to);if(to<from)throw 'to must be on or after from.';if(daysBetween(from,to)>400)throw 'Clear at most 400 days at once.';
  let days=0,sessions=0;
  for(const k of Object.keys(S.months)){const m=S.months[k];if(!Object.keys(m).some(ds=>ds>=from&&ds<=to))continue;
   const next=clone(m);for(const ds of Object.keys(next))if(ds>=from&&ds<=to){delete next[ds];days++}S.months[k]=next}
  const keep=S.train.items.filter(x=>x.ds<from||x.ds>to);sessions=S.train.items.length-keep.length;S.train={items:keep};
  changed();
  return {result:{days_cleared:days,training_sessions_deleted:sessions},summary:(days||sessions)?`Cleared logs from ${fmtShort(from)} to ${fmtShort(to)}`:null};
 },
 get_history(i){
  const from=needDate(i.from),to=needDate(i.to);if(to<from)throw 'to must be on or after from.';if(daysBetween(from,to)>62)throw 'Ask for at most 62 days.';
  const days=[];for(let ds=from;ds<=to;ds=addDays(ds,1)){const st=dayStats(ds),d=getDay(ds),sl=sleepHours(d);
   days.push({date:ds,weekday:DOW[parse(ds).getDay()],done:st.n,tracked:st.total,hours_done:Math.round(st.dh*10)/10,hours_planned:Math.round(st.ph*10)/10,
    missed:st.blocks.filter(b=>!st.done[b.id]).map(b=>b.title),cards:d.cards||0,games:((d.valo||{}).g||[]).join(''),sleep_hours:sl==null?null:Math.round(sl*10)/10,
    training:S.train.items.filter(x=>x.ds===ds).map(x=>`${x.type} ${x.min} min`)})}
  return {result:{days}};
 },
 get_progress(){
  const g=game(),p=planFor(today()),wk=mondayOf(today()),ws=weekStats(wk);
  return {result:{level:g.level,rank:g.rank,xp:g.xp,xp_to_next_level:g.need-g.into,xp_today:g.todayXP,xp_this_week:g.weekXP,streak:g.streak,best_streak:g.best,
   week:{hours_done:Math.round(ws.dh*10)/10,hours_planned:Math.round(ws.ph*10)/10,by_pursuit:Object.fromEntries(Object.entries(ws.per).map(([k,v])=>[pursuitOf(p,k).name,{done:Math.round(v.d*10)/10,planned:Math.round(v.p*10)/10}]))},
   skills:p.pursuits.filter(x=>x.tracked).map(x=>({pursuit:x.name,level:skillOf(g.pxp[x.id]||0),hours:Math.round((g.phours[x.id]||0)*10)/10,streak:g.pcur[x.id]||0})),
   quests:weeklyQuests(wk).map(q=>({quest:q.t,progress:Math.round(q.cur*10)/10,target:Math.round(q.max*10)/10})),
   badges_unlocked:BADGES.filter(b=>g.badges.includes(b.id)).map(b=>b.name),
   next_badges:BADGES.filter(b=>!g.badges.includes(b.id)).map(b=>{const [a,n]=b.prog(g);return {name:b.name,desc:b.desc,progress:a,target:n}}).sort((x,y)=>y.progress/y.target-x.progress/x.target).slice(0,4),
   slipping_three_weeks:slipping().map(x=>x.name)}};
 },
};
function runTool(name,input){
 const f=TOOL_IMPL[name];if(!f)return {ok:false,result:{error:`Unknown tool ${name}.`}};
 try{const r=f(input||{});return {ok:true,result:r.result,summary:r.summary||null}}
 catch(e){return {ok:false,result:{error:typeof e==='string'?e:(e&&e.message)||String(e)}}}
}
function contextText(){
 const t=today(),now=new Date(),p=planFor(t),c=ctx(t,p),g=game(),st=dayStats(t),ws=weekStats(mondayOf(t)),d=getDay(t),ys=dayStats(addDays(t,-1));
 const dec=(p.training||{}).decision||{};
 const blocks=blocksFor(t).map(b=>`${b.id} · ${b.s}–${fmtEnd(b.e)} · ${b.title} · ${b.track?`${st.done[b.id]?'done':'not done'} (${fmtH(b.h)})`:b.preview?'preview (not counted)':(b.dropped?'dropped':'untracked')}`).join('\n');
 let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
 return ['Live app state.',
  `Now: ${DOW[now.getDay()]} ${t} ${pad(now.getHours())}:${pad(now.getMinutes())}${tz?' ('+tz+')':''}.`,
  `Plan covering today: "${p.name}" (id ${p.id}), ${p.start} to ${p.end}${c.pre?', not started yet':c.after?', ended':c.wi<0?`, warm-up week (week 1 starts ${weekOne(p)})`:`, week ${c.wi+1}`}. Progress (XP, streaks, quests, stats) counts from ${trackFrom()}; earlier days are a preview and can't be ticked. Week 1 is the first full Monday-Sunday week of the plan; a mid-week start opens with a warm-up week, and deload weeks count from week 1. Phase: ${phaseLabel(p,t)||'none'}. Language: ${c.lang}. Rotating block: ${c.rot?c.rot.name:'none'}. Busy week: ${c.busy?'yes':'no'}. Deload week: ${c.deload?'yes':'no'}.${c.brk?` On break: ${c.brk.name}.`:''}`,
  dec.question?`Decision "${dec.question}", due ${dec.date}: ${dec.answer||'undecided'}.`:'',
  `Today's blocks (id · time · title · status):\n${blocks||'none'}`,
  `Today's logs: cards ${d.cards||0}; warm-up ${(d.valo||{}).aim?'done':'no'}; games ${((d.valo||{}).g||[]).join('')||'none'}; sleep ${d.sleep&&(d.sleep.bed||d.sleep.wake)?`bed ${d.sleep.bed||'?'}, woke ${d.sleep.wake||'?'}`:'not logged'}; training ${S.train.items.filter(x=>x.ds===t).map(x=>`${x.type} ${x.min} min (id ${x.id})`).join(', ')||'none'}.`,
  `Yesterday: ${ys.n} of ${ys.total} blocks done.`,
  `Progress: level ${g.level} ${g.rank}, ${g.xp} XP (${g.todayXP} today), streak ${g.streak} days. This week: ${fmtH(ws.dh)} of ${fmtH(ws.ph)} planned.`,
  `Reading now: ${(S.meta.books||[]).filter(b=>b.status==='reading').map(b=>`"${b.title}" (id ${b.id})`).join(', ')||'nothing'}.`,
  plans().length>1?`Other plans: ${plans().filter(x=>x.id!==p.id).map(x=>`"${x.name}" (id ${x.id}, ${x.start} to ${x.end})`).join('; ')}.`:'',
  chat.undone?'The user pressed Undo on your previous changes, so those changes are no longer in the app.':'',
 ].filter(Boolean).join('\n');
}
async function callAssistant(messages){
 const {data,error}=await sb.functions.invoke('assistant',{body:{messages}});
 if(error){let msg='';try{const j=await error.context.json();msg=j.message||''}catch(_){}
  if(!msg)msg=navigator.onLine===false?'You’re offline. The assistant needs a connection.':'The assistant could not be reached. Try again in a moment.';throw new Error(msg)}
 return data;
}
function windowed(){let i=Math.max(0,chat.api.length-60);while(i<chat.api.length&&chat.api[i].role!=='user')i++;return chat.api.slice(i)}
async function ask(text){
 text=String(text||'').trim();if(!text||chat.busy)return;
 if(mode!=='cloud'||!sb){chat.items.push({id:uid(),role:'error',text:'Sign in to use the assistant. It runs on your account so it can change your data.'});renderChat();return}
 chat.busy=true;
 const before=clone(S),itemId=uid(),start=chat.api.length;
 chat.items.push({id:uid(),role:'user',text});
 const reply={id:itemId,role:'assistant',text:'',actions:[]};chat.items.push(reply);
 chat.api.push({role:'user',content:text},{role:'system',content:contextText()});chat.undone=false;
 renderChat();
 try{
  for(let step=0;step<10;step++){
   const res=await callAssistant(windowed());
   const m=res.message||{role:'assistant',content:''};chat.api.push(m);
   if(m.content)reply.text+=(reply.text?'\n\n':'')+m.content;
   const calls=m.tool_calls||[];
   if(!calls.length)break;
   for(const tc of calls){
    let input={};try{input=JSON.parse(tc.function.arguments||'{}')}catch(_){chat.api.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify({error:'Arguments were not valid JSON.'})});continue}
    const r=runTool(tc.function.name,input);
    if(r.summary)reply.actions.push(r.summary);
    chat.api.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(r.ok?r.result:{error:r.result.error})});
   }
   renderChat();
   if(step===9)reply.text+=(reply.text?'\n\n':'')+'That took more steps than expected, so I stopped here.';
  }
  if(!reply.text&&!reply.actions.length)reply.text='Done.';
 }catch(e){
  if(chat.api.length&&chat.api[chat.api.length-1].role==='system'){chat.api.length=start}
  reply.role='error';reply.text=e.message||String(e);
 }
 const diff=rowDiff(before,S);if(diff.length){chat.undos[itemId]=diff;reply.canUndo=true}
 chat.busy=false;saveChat();renderChat();
}
function undoReply(id){
 const diff=chat.undos[id];if(!diff)return;
 const cur=toRows(S);let kept=0;
 for(const d of diff){if(stable(cur[d.t][d.id]??null)!==stable(d.after)){kept++;continue}
  if(d.before==null)delete cur[d.t][d.id];else cur[d.t][d.id]=d.before}
 S=fromRows(cur);normalize();delete chat.undos[id];chat.undone=true;
 const it=chat.items.find(x=>x.id===id);if(it){it.canUndo=false;it.undone=true}
 lastGame=null;changed();saveChat();renderChat();
 toast(kept?`<span>Undone, except ${kept} change${kept===1?'':'s'} edited since</span>`:'<span>Changes undone</span>');
}
function newChat(){chat.api=[];chat.items=[];chat.undos={};chat.undone=false;saveChat();renderChat()}

/* Chat UI: lives outside #app so app re-renders never touch it. */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const chatRoot=document.getElementById('chat');
const ICON_CHAT='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
const ICON_MIC='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const ICON_SEND='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const SUGGEST=['I did my swim, 45 min, felt easy','Bed at 00:40, up at 08:10','Finished ML and guitar today','Add 15 min stretching after the morning session on weekdays','How’s my week going?'];
function fmtMsg(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').split('\n').map(l=>/^\s*[-•]\s+/.test(l)?'<span class="bl">'+l.replace(/^\s*[-•]\s+/,'')+'</span>':l).join('<br>')}
function chatLogHTML(){
 if(!chat.items.length)return `<div class="chatempty"><p><b>Tell Cadence what you did, or what to change.</b></p><p class="small muted">It ticks blocks, logs sessions, sleep, games and cards, edits your plan, and answers questions about your progress. Every change can be undone.</p>
  <div class="sugs">${SUGGEST.map(s=>`<button class="sug" data-ca="suggest" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
 return chat.items.map(it=>{
  if(it.role==='user')return `<div class="msg me">${esc(it.text)}</div>`;
  if(it.role==='error')return `<div class="msg err">${esc(it.text)}</div>`;
  const acts=(it.actions||[]).map(a=>`<span class="act">${esc(a)}</span>`).join('');
  const pending=chat.busy&&it===chat.items[chat.items.length-1];
  return `<div class="msg ai">${acts?`<div class="acts">${acts}</div>`:''}${it.text?`<div>${fmtMsg(it.text)}</div>`:''}${pending?'<div class="typing" aria-label="Working"><i></i><i></i><i></i></div>':''}
   ${it.canUndo&&chat.undos[it.id]?`<button class="btn ghost small" data-ca="undo" data-v="${it.id}">Undo</button>`:''}${it.undone?'<span class="small muted">Undone</span>':''}</div>`;
 }).join('');
}
function renderChat(){
 if(!chatRoot)return;
 const show=!!S&&mode!=='auth'&&mode!=='boot';
 if(show&&chat.loadedFor!==chatKey())loadChat();
 if(!chatRoot.dataset.built){
  chatRoot.dataset.built='1';
  chatRoot.innerHTML=`<button class="fab" data-ca="open" aria-label="Open assistant">${ICON_CHAT}<span>Ask</span></button>
   <section class="chatpanel" role="dialog" aria-label="Assistant" hidden>
    <header class="chathead"><b>Assistant</b><span class="spacer"></span><button class="btn ghost small" data-ca="new">New chat</button><button class="iconbtn" data-ca="close" aria-label="Close assistant">✕</button></header>
    <div class="chatlog" id="chatlog" aria-live="polite"></div>
    <form class="chatin" id="chatform"><textarea id="chatbox" rows="1" placeholder="What did you do? What should change?" aria-label="Message"></textarea>
     ${SR?`<button type="button" class="iconbtn mic" data-ca="mic" aria-label="Speak">${ICON_MIC}</button>`:''}<button type="submit" class="iconbtn send" aria-label="Send">${ICON_SEND}</button></form>
   </section>`;
 }
 const fab=chatRoot.querySelector('.fab'),panel=chatRoot.querySelector('.chatpanel');
 fab.hidden=!show||chat.open;panel.hidden=!show||!chat.open;
 if(!show||!chat.open)return;
 const log=document.getElementById('chatlog');log.innerHTML=chatLogHTML();log.scrollTop=log.scrollHeight;
 const send=chatRoot.querySelector('.send');if(send)send.disabled=chat.busy;
 const mic=chatRoot.querySelector('.mic');if(mic){mic.classList.toggle('on',!!chat.rec);mic.setAttribute('aria-label',chat.rec?'Stop listening':'Speak')}
}
function openChat(){chat.open=true;renderChat();setTimeout(()=>{const b=document.getElementById('chatbox');if(b)b.focus()},30)}
function sendBox(){const b=document.getElementById('chatbox');if(!b)return;const v=b.value;b.value='';sizeBox();ask(v)}
function sizeBox(){const b=document.getElementById('chatbox');if(!b)return;b.style.height='auto';b.style.height=Math.min(140,b.scrollHeight)+'px'}
function toggleMic(){
 if(!SR)return;if(chat.rec){chat.rec.stop();return}
 const box=document.getElementById('chatbox'),base=box.value?box.value.trim()+' ':'';let finalText='';
 const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=true;r.continuous=false;
 r.onresult=e=>{let txt='';finalText='';for(const res of e.results){txt+=res[0].transcript;if(res.isFinal)finalText+=res[0].transcript}box.value=base+txt;sizeBox()};
 r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')toast('<span>Microphone access is blocked for this site.</span>')};
 r.onend=()=>{chat.rec=null;renderChat();if(finalText.trim())sendBox()};
 try{r.start();chat.rec=r;renderChat()}catch(e){chat.rec=null}
}
if(chatRoot){
 chatRoot.addEventListener('click',e=>{const el=e.target.closest('[data-ca]');if(!el)return;const a=el.dataset.ca;
  if(a==='open')openChat();else if(a==='close'){chat.open=false;if(chat.rec)chat.rec.stop();renderChat()}
  else if(a==='new')newChat();else if(a==='undo')undoReply(el.dataset.v);else if(a==='mic')toggleMic();
  else if(a==='suggest'){const b=document.getElementById('chatbox');b.value=el.dataset.v;sizeBox();b.focus()}});
 chatRoot.addEventListener('submit',e=>{e.preventDefault();sendBox()});
 chatRoot.addEventListener('input',e=>{if(e.target.id==='chatbox')sizeBox()});
 chatRoot.addEventListener('keydown',e=>{if(e.target.id==='chatbox'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendBox()}
  if(e.key==='Escape'){chat.open=false;renderChat()}});
}
addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&S&&mode!=='auth'){e.preventDefault();chat.open?(chat.open=false,renderChat()):openChat()}});

window.__cadence={toRows:st=>toRows(st),fromRows:R=>fromRows(R),defaultPlan,get S(){return S},stable};
boot();
})();
