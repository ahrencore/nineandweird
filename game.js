const evRoot=document.getElementById('game');
function evDisplay(html){window.nwCloud?.clearCaptcha?.();evRoot.hidden=false;evRoot.innerHTML=html;
 // Keep the existing lobby controls; add a compact utility bar only to modes lacking a header.
 if(!evRoot.querySelector('.ev-head,.nw-lobby-top')&&!evRoot.querySelector('.nw-shared-floating')){
  const bar=document.createElement('div');bar.className='nw-shared-floating';bar.innerHTML=nwSharedUtilityMarkup();evRoot.prepend(bar);
 }
 queueMicrotask(()=>{nwRefreshNotificationOrbits();nwBindSharedUtilities();});}
function nwSharedUtilityMarkup(settingsOnly=false){return `<div class="nw-shared-utilities">${settingsOnly?'':`<span class="nw-shared-wallet" title="Diamond balance">${nwDiamondAmount(nwDiamondBalance().toLocaleString())}</span>`}<button type="button" class="nw-shared-settings" data-nw-settings aria-label="Settings">${nwLobbyIcon('settings')}</button></div>`;}
function nwOpenSharedSettings(){
 const o=document.createElement('div');o.className='nw-shared-settings-shade';
 o.innerHTML='<section role="dialog" aria-modal="true" aria-label="Settings" class="nw-shared-settings-dialog"><h2>SETTINGS</h2><button type="button" data-profile>PROFILE / ACCOUNT</button><a href="privacy.html">PRIVACY POLICY</a><button type="button" data-close>CLOSE</button></section>';
 evRoot.appendChild(o);
 o.querySelector('[data-close]').onclick=()=>o.remove();
 o.querySelector('[data-profile]').onclick=()=>{if(sudoku?.challenge&&!sudoku.done&&!confirm('Leave Challenge? Leaving now counts as a loss.'))return;o.remove();nwShowProfile();};
 o.addEventListener('click',e=>{if(e.target===o)o.remove()});
 o.querySelector('[data-close]').focus();
}
function nwBindSharedUtilities(){evRoot.querySelectorAll('[data-nw-settings]').forEach(b=>b.onclick=nwOpenSharedSettings);}

function evHeader(title,back,keepWorldTitle=false,settingsOnly=false){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=()=>back();nwBindSharedUtilities();});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong class="${keepWorldTitle?'nw-world-title':'nw-brand-title'}">${keepWorldTitle?title:'NINE & WEIRD'}</strong>${nwSharedUtilityMarkup(settingsOnly)}</header>`;}
const worlds={classic:{name:'CLASSIC',label:'Classic',theme:'classic'},dark:{name:'CLASSIC DARK',label:'Classic Dark',theme:'dark'},halloween:{name:'HALLOWEEN',label:'Halloween',theme:'halloween'},patissserie:{name:'PÂTISSERIE',label:'Pâtisserie',theme:'patissserie'},christmas:{name:'CHRISTMAS',label:'Christmas',theme:'christmas'},fairy:{name:'FAIRY WORLD',label:'Fairy World',theme:'fairy'},olympus:{name:'OLYMPUS',label:'Olympus',theme:'olympus'},nineties:{name:'90s THROWBACK',label:'90s Throwback',theme:'nineties'},weird:{name:'WHAT AM I LOOKING AT?',label:'What Am I Looking At?',theme:'weird'},ugly:{name:'UGLY LITTLE THINGS',label:'Ugly Little Things',theme:'ugly'},alien:{name:'ALIEN SUPERMARKET',label:'Alien Supermarket',theme:'alien'},diner:{name:'DO NOT EAT THAT',label:'Do Not Eat That',theme:'diner'},bodyparts:{name:'BODY PARTS DEPARTMENT',label:'Body Parts Department',theme:'bodyparts'},deepsea:{name:'DEEP SEA MISFITS',label:'Deep Sea Misfits',theme:'deepsea'},solarsick:{name:'THE SOLAR SYSTEM IS SICK',label:'The Solar System Is Sick',theme:'solarsick'},dontunwrap:{name:"PLEASE DON'T UNWRAP THAT",label:"Please Don't Unwrap That",theme:'dontunwrap'},unpreparedchristmas:{name:'UNPREPARED CHRISTMAS',label:'Unprepared Christmas',theme:'unpreparedchristmas'},underthebed:{name:'SOMETHING UNDER THE BED',label:'Something Under the Bed',theme:'underthebed'},balloonwrong:{name:'BALLOON ANIMALS GONE WRONG',label:'Balloon Animals Gone Wrong',theme:'balloonwrong'},donttakewater:{name:'DO NOT TAKE WITH WATER',label:'Do Not Take With Water',theme:'donttakewater'},baggagehell:{name:'BAGGAGE CLAIM FROM HELL',label:'Baggage Claim from Hell',theme:'baggagehell'},cakefail:{name:'CAKE DECORATING WAS A MISTAKE',label:'Cake Decorating Was a Mistake',theme:'cakefail'}};
let currentWorld='halloween',roomPage=0,roomCollection='all';
const difficulties={easy:{fill:.60,points:350,hints:1},medium:{fill:.50,points:650,hints:1},hard:{fill:.40,points:1000,hints:1},expert:{fill:.35,points:1350,hints:2},extreme:{fill:.30,points:1750,hints:3}};
function applyTheme(world){evRoot.className='ev-root theme-'+(world||'hub');}

const nwGroups={usual:['classic','dark','halloween','patissserie','christmas','olympus','nineties'],weird:['weird','ugly','alien','diner','bodyparts','deepsea','solarsick','dontunwrap','unpreparedchristmas','underthebed','balloonwrong','donttakewater','baggagehell','cakefail']};
const nwFavKey='nineweird-favourites-v1',nwPointsKey='nineweird-points-v1';
const nwScroll={usual:0,weird:0,fav:0,all:0};
const nwRoomPages={usual:0,weird:0,fav:0,all:0};
// All player data is tied to the active Supabase user ID, never shared across accounts.
// No account = no saved player data. Legacy unscoped keys are deliberately ignored
// rather than assigned to another player. A browser's local data is not cloud sync.
/* V51: Supabase is the durable progress store; in-memory values provide instant play.
   Local storage is READ ONCE only to migrate a legacy save if Supabase has no version. */
const nwCloudSaveKeys=[
 'nineweird-favourites-v1','nineweird-points-v1','nineweird-results-v1',
 'nineweird-profile-v1','nineweird-selected-frame-v1','nineweird-battle-practice-v1',
 'nineweird-battle-diamond-claims-v1','nineweird-double-practice-v2',
 'nineweird-triple-economy-beta-v1','nineweird-triple-daily-missions-v1',
 'nineweird-triple-practice-v2','nineweird-prize-diamond-receipts-v1',
 'nw-growing-live-v1','nineweird-growing-activity-v1',
 'nineweird-tt-verification-pending-v1'
];
const nwCloudState=()=>({id:null,ready:false,values:Object.create(null),base:Object.create(null),
 confirmed:Object.create(null),timers:new Map(),active:new Set(),retry:new Map(),
 conflicts:new Set(),generation:0});
let nwCloudSaveState=nwCloudState();
let nwSyncStatusTimeout=null;
function nwCloudSaveLocalKey(key,id){
 return key==='nw-growing-live-v1'?'nw-growing-live-v1:'+id:'nineweird-player:'+id+':'+key;
}
function nwCloudSaveStatus(message,kind='pending'){
 let el=document.getElementById('nw-save-status');
 if(!el){
  el=document.createElement('div');el.id='nw-save-status';
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.style.cssText='position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);right:12px;z-index:99999;max-width:min(320px,85vw);border-radius:13px;background:rgba(24,16,34,.94);color:#f5eaff;font:600 12px system-ui,sans-serif;padding:8px 12px;box-shadow:0 3px 16px #0005;pointer-events:none;';
  document.body.appendChild(el);
 }
 el.textContent=message;
 el.style.display=message?'block':'none';
 el.style.color=kind==='error'?'#ffbec5':'#e4d6ff';
 el.style.pointerEvents=kind==='conflict'?'auto':'none';
 if(nwSyncStatusTimeout){clearTimeout(nwSyncStatusTimeout);nwSyncStatusTimeout=null}
 if(kind==='saved')nwSyncStatusTimeout=setTimeout(()=>{el.style.display='none'},1400);
 if(kind==='conflict'){
  const btn=document.createElement('button');
  btn.type='button';btn.textContent='Reload';
  btn.style.cssText='margin-left:8px;padding:3px 7px;background:#f36b78;color:#160b0e;border:0;border-radius:7px;font:inherit;cursor:pointer';
  btn.onclick=()=>window.location.reload();el.append(btn);
 }
}
function nwCloudSaveStatusUpdate(){
 const s=nwCloudSaveState;
 if(!s.ready||!s.id)return;
 if(s.conflicts.size){nwCloudSaveStatus('Progress changed on another device. Reload to use the cloud version.','conflict');return}
 if(s.retry.size){nwCloudSaveStatus('Connection lost · retrying save…','error');return}
 if(s.active.size||s.timers.size){nwCloudSaveStatus('Syncing…');return}
 nwCloudSaveStatus('Saved','saved');
}
function nwLegacySaveValue(key,id){
 try{
  let old;
  if(key==='nineweird-growing-activity-v1'){
   const k='nineweird-player:'+id+':nw-growing-activity-v1:'+id+':'+new Date().toISOString().slice(0,10);
   old=localStorage.getItem(k);
   if(old!==null){const val=JSON.parse(old);return JSON.stringify({...val,day:new Date().toISOString().slice(0,10)})}
  }
  old=localStorage.getItem(nwCloudSaveLocalKey(key,id));
  return old===null?null:JSON.stringify(JSON.parse(old));
 }catch{return null}
}
async function nwCloudSaveInit(){
 const id=nwCloud?.user()?.id;
 if(!id)return;
 if(nwCloudSaveState.id===id&&nwCloudSaveState.ready)return;
 for(const timer of nwCloudSaveState.timers.values())clearTimeout(timer);
 for(const retry of nwCloudSaveState.retry.values())clearTimeout(retry);
 nwCloudSaveState=nwCloudState();const state=nwCloudSaveState;state.id=id;
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_cloud_save_read');
 if(error)throw Error('Cannot load progress from Supabase: '+error.message);
 if(nwCloud?.user()?.id!==id||nwCloudSaveState!==state)return;
 const toUpload=[];
 for(const key of nwCloudSaveKeys){
  const saved=data?.[key];
  if(saved&&Number.isSafeInteger(Number(saved.revision))&&Number(saved.revision)>=1){
   state.values[key]=JSON.stringify(saved.value);
   state.base[key]=Number(saved.revision);
   state.confirmed[key]=state.values[key];
  }else{
   state.base[key]=0;
   const legacy=nwLegacySaveValue(key,id);
   if(legacy!==null){state.values[key]=legacy;toUpload.push(key)}
  }
 }
 state.ready=true;
 nwCloudSaveStatusUpdate();
 // Keep the legacy save intact until its first successful Supabase write.
 for(const key of toUpload)nwCloudSaveQueue(key,0);
}
function nwCloudSaveQueue(key,delay=350){
 const s=nwCloudSaveState,id=nwCloud?.user()?.id;
 if(!s.ready||id!==s.id||!nwCloudSaveKeys.includes(key)||s.conflicts.has(key))return;
 clearTimeout(s.timers.get(key));clearTimeout(s.retry.get(key));s.retry.delete(key);
 s.timers.set(key,setTimeout(()=>{s.timers.delete(key);void nwCloudSaveFlush(key)},delay));
 nwCloudSaveStatusUpdate();
}
async function nwCloudSaveFlush(key){
 const s=nwCloudSaveState,id=s.id;
 if(!id||!s.ready||!nwCloud?.user()||nwCloud.user().id!==id||s.conflicts.has(key))return;
 if(s.active.has(key))return;
 const raw=s.values[key];
 if(raw===undefined||raw===s.confirmed[key]){nwCloudSaveStatusUpdate();return}
 s.active.add(key);nwCloudSaveStatusUpdate();
 try{
  const c=await nwCloud.get();
  if(nwCloud?.user()?.id!==id||nwCloudSaveState!==s)return;
  const {data,error}=await c.rpc('nw_cloud_save_write',{
   p_key:key,p_value:JSON.parse(raw),p_revision:Number(s.base[key]||0)
  });
  if(error)throw Error(error.message);
  if(nwCloud?.user()?.id!==id||nwCloudSaveState!==s)return;
  s.base[key]=Number(data);s.confirmed[key]=raw;if(s.retryCount)delete s.retryCount[key];
  // Removing an old browser copy is safe only once its cloud replacement is confirmed.
  try{localStorage.removeItem(nwCloudSaveLocalKey(key,id))}catch{}
  if(key==='nineweird-growing-activity-v1'){
   try{localStorage.removeItem('nineweird-player:'+id+':nw-growing-activity-v1:'+id+':'+new Date().toISOString().slice(0,10))}catch{}
  }
  nwPrizeFlushDurableReceipts();
 }catch(e){
  if(nwCloudSaveState===s&&/save conflict|progress changed/i.test(e.message||''))s.conflicts.add(key);
  else if(nwCloudSaveState===s&&!s.conflicts.has(key)){
   const next=Math.min(20000,Math.max(1500,((s.retryCount?.[key])||750)*2));
   s.retryCount??=Object.create(null);s.retryCount[key]=next;
   s.retry.set(key,setTimeout(()=>{s.retry.delete(key);nwCloudSaveQueue(key,0)},next));
  }
  console.warn('Supabase progress save:',key,e.message);
 }finally{
  s.active.delete(key);
  if(nwCloudSaveState===s){
   if(!s.conflicts.has(key)&&!s.retry.has(key)&&s.values[key]!==s.confirmed[key])nwCloudSaveQueue(key,0);
   nwCloudSaveStatusUpdate();
  }
 }
}
function nwGrowingLoadSave(accountId){
 const s=nwCloudSaveState;
 if(!accountId||accountId!==s.id||!s.ready||s.id!==nwCloud?.user()?.id)return null;
 try{return s.values['nw-growing-live-v1']===undefined?null:JSON.parse(s.values['nw-growing-live-v1'])}catch{return null}
}
function nwGrowingQueueSave(value,accountId){
 const s=nwCloudSaveState;
 if(!accountId||accountId!==s.id||!s.ready||s.id!==nwCloud?.user()?.id||s.conflicts.has('nw-growing-live-v1'))return;
 const raw=JSON.stringify(value);
 if(raw===s.values['nw-growing-live-v1'])return;
 s.values['nw-growing-live-v1']=raw;
 nwCloudSaveQueue('nw-growing-live-v1');
}
function nwPlayerStorageKey(key){
 const id=window.nwCloud?.user()?.id;
 return id?'nineweird-player:'+id+':'+key:null;
}
function nwRead(key,fallback){
 const s=nwCloudSaveState;
 if(!s.ready||s.id!==nwCloud?.user()?.id)return fallback;
 try{return s.values[key]===undefined?fallback:JSON.parse(s.values[key])}catch{return fallback}
}
function nwWrite(key,value){
 const s=nwCloudSaveState;
 if(!s.ready||s.id!==nwCloud?.user()?.id)return;
 if(!nwCloudSaveKeys.includes(key)){console.warn('Unregistered Supabase progress key:',key);return}
 if(s.conflicts.has(key)){nwCloudSaveStatusUpdate();return}
 const raw=JSON.stringify(value);
 if(raw===s.values[key])return;
 s.values[key]=raw;
 nwCloudSaveQueue(key);
}
function nwFavs(){const a=nwRead(nwFavKey,[]);return Array.isArray(a)?a.filter((id,i)=>id!=='fairy'&&worlds[id]&&a.indexOf(id)===i):[]}
function nwIsFav(id){return nwFavs().includes(id)}
function nwToggleFav(id){const a=nwFavs(),b=a.includes(id)?a.filter(x=>x!==id):[...a,id];nwWrite(nwFavKey,b);return b.includes(id)}
function nwPoints(){const n=Number(nwRead(nwPointsKey,0));return Number.isFinite(n)&&n>0?Math.floor(n):0}
function nwAwardPoints(n){nwWrite(nwPointsKey,nwPoints()+n)}

// Local opt-in test recorder: no user IDs, names, avatars, or authentication data.
// The recordings only exist in this tab's sessionStorage until exported or cleared.
const nwRecordMode = new URLSearchParams(location.search).get('nw_record')==='1';
const nwRecordingKey = 'nineweird-recording-drafts-v1';
function nwRecordedRuns(){
  try {const rows=JSON.parse(sessionStorage.getItem(nwRecordingKey)||'[]');return Array.isArray(rows)?rows:[];}
  catch{return [];}
}
function nwCaptureRun(s, points){
  if(!nwRecordMode || !s || !s.done || s.recordCaptured)return;
  s.recordCaptured=true;
  const rows=nwRecordedRuns();
  rows.push({
    recording_id:(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`,
    room:currentWorld, difficulty:s.difficulty,
    started_at:new Date(s.start).toISOString(),completed_at:new Date().toISOString(),
    elapsed_seconds:Math.max(1,Math.round((Date.now()-s.start)/1000)),
    points, mistakes:s.mistakes, hints_used:s.reportHints||0,
    placement_attempts:s.reportAttempts||0, correct_placements:s.reportCorrect||0,
    puzzle_clues:s.initialPuzzle? s.initialPuzzle.join('') : null,
    solved_grid:s.answer.join('')
  });
  try{sessionStorage.setItem(nwRecordingKey,JSON.stringify(rows.slice(-500)));}catch{}
}
function nwExportRuns(){
  const rows=nwRecordedRuns();
  if(!rows.length){window.alert('No completed Sudoku recordings yet.');return;}
  const payload={format:'nine-weird-puzzle-recordings',version:1,exported_at:new Date().toISOString(),runs:rows};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`nine-weird-recordings-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function nwRecordingControls(){
  if(!nwRecordMode)return '';
  return `<div class="nw-record-tools"><strong>RECORDING MODE</strong><small>Completed puzzles: ${nwRecordedRuns().length} · No profiles attached</small><button id="nwExportRecordings" type="button">EXPORT RECORDINGS</button><button id="nwClearRecordings" type="button">CLEAR RECORDINGS</button></div>`;
}
function nwBindRecordingControls(){
  if(!nwRecordMode)return;
  const exp=evRoot.querySelector('#nwExportRecordings'),clear=evRoot.querySelector('#nwClearRecordings');
  if(exp)exp.onclick=nwExportRuns;
  if(clear)clear.onclick=()=>{if(window.confirm('Clear all unexported recordings from this tab?')){sessionStorage.removeItem(nwRecordingKey);const el=evRoot.querySelector('.nw-record-tools small');if(el)el.textContent='Completed puzzles: 0 · No profiles attached';}};
}

// Local-first player profile & weekly puzzle performance. Cloud sync is NOT enabled yet.
const nwProfileKey='nineweird-profile-v1', nwResultsKey='nineweird-results-v1';
const nwAvatarChoices=["growing/assets/01_gloop.png","growing/assets/02_chomps.png","growing/assets/03_noodle.png","growing/assets/04_blink.png","growing/assets/05_grumble.png","growing/assets/06_pinky.png","growing/assets/07_wobbles.png","growing/assets/08_stinky.png","growing/assets/09_crumbs.png","growing/assets/10_crab.png","growing/assets/11_tripod.png","growing/assets/12_caterpillar.png","growing/assets/13_bat.png","growing/assets/14_olive.png","growing/assets/15_shaggy.png","growing/assets/16_snail.png","growing/assets/17_mushroom.png","growing/assets/18_dinosaur.png","growing/assets/19_coil.png","growing/assets/20_tentacles.png"];
const nwDefaultAvatar=nwAvatarChoices[0];
function nwAvatarValue(v){if(nwAvatarChoices.includes(v))return v;const old=/^avatars\/avatar-(0[1-9]|1[0-2])\.png$/.exec(String(v||''));return old?nwAvatarChoices[Number(old[1])-1]:nwDefaultAvatar}
function nwAvatarImg(v,cls=''){const src=nwEscape(nwAvatarValue(v));return `<img src="${src}" alt="" class="${cls}">`}
function nwEscape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function nwGuestName(id){return 'Guest_'+String(id).replace(/-/g,'').slice(0,14).toLowerCase();}
function nwProfile(){const p=nwRead(nwProfileKey,{}),u=window.nwCloud?.user();return {name:u?.is_anonymous?nwGuestName(u.id):typeof p.name==='string'?p.name:'Guest Player',avatar:nwAvatarValue(p.avatar)}}
function nwResults(){const v=nwRead(nwResultsKey,[]);return Array.isArray(v)?v.filter(x=>x&&Number.isFinite(x.started)&&typeof x.difficulty==='string').slice(-2500):[]}
function nwSaveResult(s,won){
  if(!s||s.reportSaved)return;s.reportSaved=true;
  const a=nwResults();a.push({started:s.start,ended:Date.now(),world:currentWorld,difficulty:s.difficulty,won:!!won,seconds:Math.max(1,Math.round((Date.now()-s.start)/1000)),attempts:s.reportAttempts||0,correct:s.reportCorrect||0,hints:s.reportHints||0,mistakes:s.mistakes});
  nwWrite(nwResultsKey,a.slice(-2500));
  if(won&&!s.practiceOpponent&&!s.doublePractice)nwGrowingActivity('worlds');
}
function nwWeekStart(t){const d=new Date(t);d.setHours(0,0,0,0);const dow=(d.getDay()+6)%7;d.setDate(d.getDate()-dow);return d.getTime()}
const nwWeights={easy:1,medium:1.4,hard:1.8,expert:2.2,extreme:2.6};
const nwSpeedBench={easy:360,medium:540,hard:780,expert:1020,extreme:1320};
function nwWeeklyReport(offset){
  const start=nwWeekStart(Date.now())+offset*604800000, end=start+604800000;
  const rows=nwResults().filter(r=>r.started>=start&&r.started<end), wins=rows.filter(r=>r.won);
  const attempts=rows.reduce((n,r)=>n+(r.attempts||0),0),correct=rows.reduce((n,r)=>n+(r.correct||0),0);
  const accuracy=attempts?Math.round(correct/attempts*1000)/10:null;
  const consistency=rows.length?Math.round(wins.length/rows.length*1000)/10:null;
  const adjusted=wins.length?wins.reduce((n,r)=>n+r.seconds/(nwWeights[r.difficulty]||1),0)/wins.length:null;
  const speedScore=wins.length?Math.round(wins.reduce((n,r)=>n+Math.min(100,100*(nwSpeedBench[r.difficulty]||600)/Math.max(1,r.seconds)),0)/wins.length):null;
  const difficulty={};for(const d of Object.keys(difficulties)){const subset=rows.filter(r=>r.difficulty===d);difficulty[d]={played:subset.length,won:subset.filter(r=>r.won).length};}
  // Demonstration composite rating, not a measurement of intelligence.
  const brain=rows.length?Math.min(1000,Math.round((accuracy??0)*3+(consistency??0)*3+(speedScore??0)*4)):null;
  return {start,rows,wins,accuracy,consistency,adjusted,speedScore,difficulty,brain,attempts};
}
function nwReportDelta(a,b,suffix=''){if(a==null||b==null)return '—';const n=Math.round((a-b)*10)/10;return (n>0?'+':'')+n+suffix}
function nwFormatTime(sec){if(sec==null)return '—';const n=Math.round(sec);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}

// Two permanent free profile frames and six season-limited Battle prestige frames.
const nwFrameKey='nineweird-selected-frame-v1';
const nwSeasonFrameTiers=[
  {wins:10,title:'Little Freak'},{wins:25,title:'Odd Egg'},
  {wins:50,title:'Weirdo'},{wins:100,title:'Nightmare Pet'},
  {wins:150,title:'Strange Beast'},{wins:200,title:'Certified Freak'}
];
function nwSeasonId(){return new Date().toISOString().slice(0,7)}
function nwAvailableFrames(){
  const st=nwBattleMonthStats();
  return [{id:'usual',title:'The Usual',src:'frames/nw-free-usual.png?v=42'},
    {id:'weird',title:'The Weird',src:'frames/nw-free-weird.png?v=42'},
    ...nwSeasonFrameTiers.filter(t=>st.wins>=t.wins).map(t=>({id:'monthly-'+t.wins,title:t.title,monthly:true,wins:t.wins,src:`frames/nw-monthly-${t.wins}.png`}))];
}
function nwSelectedFrame(){
  const saved=nwRead(nwFrameKey,{id:'usual'});
  const id=saved?.month&&saved.month!==nwSeasonId()?'usual':saved?.id||'usual';
  return nwAvailableFrames().find(f=>f.id===id)||nwAvailableFrames()[0];
}
async function nwHydrateFrame(data){
 if(!data)return;
 const cloudId=data.equipped_frame,cloudMonth=data.equipped_frame_month;
 if(cloudId){
  const currentMonth=nwSeasonId();
  const expired=cloudId.startsWith('monthly-')&&cloudMonth!==currentMonth;
  const id=expired?'usual':cloudId;
  nwWrite(nwFrameKey,{id,month:!expired&&id.startsWith('monthly-')?cloudMonth:null});
  if(expired)await nwCloud.saveFrame('usual');
 }else{
  const frame=nwSelectedFrame();
  await nwCloud.saveFrame(frame.id,frame.monthly?nwSeasonId():null);
 }
}
function nwFrameArt(avatar,extraClass=''){
  const f=nwSelectedFrame();
  return `<span class="nw-equipped-frame ${f.monthly?'nw-monthly-art-frame':''} ${extraClass}">${nwAvatarImg(avatar,'nw-equipped-avatar')}${f.src?`<img src="${f.src}" class="nw-equipped-art" alt="">`:`<span class="nw-season-frame-ring">✧</span><strong class="nw-season-frame-title">${nwEscape(f.title)}</strong>`}</span>`;
}
function nwFrameRemark(frame){return frame.monthly?'Resets every 1st of the month (UTC).':'Permanent frame.';}
function nwFramePicker(){
 const equipped=nwSelectedFrame();
 return `<div class="nw-frame-selector"><h3>PROFILE FRAMES</h3><div class="nw-frame-options">${nwAvailableFrames().map(f=>`<button type="button" class="nw-frame-choice ${f.id===equipped.id?'active':''}" aria-pressed="${f.id===equipped.id}" data-frame="${f.id}">${f.src?`<img src="${f.src}" alt="">`:'<span class="nw-frame-tier-icon">♛</span>'}<small>${nwEscape(f.title)}</small><small class="nw-frame-kind">${f.monthly?'Monthly':'Permanent'}</small></button>`).join('')}</div><p class="nw-frame-remark" role="status">${nwFrameRemark(equipped)}</p></div>`;
}
function nwBindFramePicker(){evRoot.querySelectorAll('[data-frame]').forEach(b=>b.onclick=async()=>{
 const frame=nwAvailableFrames().find(f=>f.id===b.dataset.frame);if(!frame)return;
 const buttons=[...evRoot.querySelectorAll('[data-frame]')];
 buttons.forEach(button=>button.disabled=true);
 try{
  await nwCloud.saveFrame(frame.id,frame.monthly?nwSeasonId():null);
  nwWrite(nwFrameKey,{id:frame.id,month:frame.monthly?nwSeasonId():null});
  const selected=nwSelectedFrame();
  const preview=evRoot.querySelector('.nw-profile-with-frame');if(preview)preview.innerHTML=nwFrameArt(nwProfile().avatar);
  buttons.forEach(choice=>{const active=choice.dataset.frame===selected.id;choice.classList.toggle('active',active);choice.setAttribute('aria-pressed',String(active));});
  const remark=evRoot.querySelector('.nw-frame-remark');if(remark)remark.textContent=nwFrameRemark(selected);
 }catch(e){const remark=evRoot.querySelector('.nw-frame-remark');if(remark)remark.textContent='Could not save frame: '+e.message;}
 finally{buttons.forEach(button=>button.disabled=false);}
});}
// V35 account UI: real requests require a future cloud service, never simulate them.
function nwUsernameValid(name){return /^[A-Za-z0-9._]{3,20}$/.test(name)&&!/^guest_/i.test(name)&&!nwBattleProfiles.some(p=>p.name.toLowerCase()===name.toLowerCase());}
function nwAccountTheme(){applyTheme('hub');evRoot.classList.add('nw-account-theme');}
function nwAccountHeading(title,sub=''){return `<div class="nw-account-heading"><div class="nw-account-deco" aria-hidden="true">⋆ . ࿔ ˚</div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>`;}
function nwHasBattleClaim(){return !!nwPlayerStorageKey(nwBattleDiamondKey)&&nwSeasonFrameTiers.some(t=>nwBattleMonthStats().wins>=t.wins&&!nwBattleDiamondClaimed(nwSeasonId(),t.wins));}
function nwRefreshNotificationOrbits(){
 const buttons=evRoot.querySelectorAll('#nwRadioRewards,[data-diamond-claim]:not([disabled])');
 if(evRoot.querySelector('#nwOpenFriends'))void nwFriendRefreshNotice();
 if(!buttons.length)return;const claim=nwHasBattleClaim();
 for(const el of buttons)el.classList.toggle('nw-notification-orbit',claim);
 // Event planet keeps its existing live animation; the reward button signals the claim.
}

let nwFriendsLoadSerial=0;
let nwFriendsSnapshot=null;
let nwFriendsLastTab='list';
let nwFriendsBusy=false;
function nwFriendPhoto(player){
 const avatar=nwAvatarValue(player.avatar);
 const f=player.frame;
 const known=[...nwSeasonFrameTiers.map(t=>'monthly-'+t.wins),'usual','weird'];
 const frame=known.includes(f)?(f==='usual'?'frames/nw-free-usual.png?v=42':f==='weird'?'frames/nw-free-weird.png?v=42':'frames/nw-monthly-'+f.slice(8)+'.png'):null;
 return '<span class="nw-friend-avatar '+(frame?'framed':'')+'">'+nwAvatarImg(avatar,'nw-friend-avatar-img')+(frame?'<img class="nw-friend-frame" alt="" src="'+nwEscape(frame)+'">':'')+'</span>';
}
async function nwFriendsRpc(method,args={}){
 const c=await nwCloud.get();
 if(!nwCloud.user()||nwCloud.user().is_anonymous)throw Error('Registered account required');
 const {data,error}=await c.rpc(method,args);
 if(error)throw Error(error.message);
 return data;
}
async function nwFriendsLoad(tab='list',back=nwShowProfile){
 const serial=++nwFriendsLoadSerial;
 nwFriendsLastTab=tab;
 nwAccountTheme();
 evDisplay(`${evHeader('FRIENDS',back)}<section class="nw-new-panel">${nwAccountHeading('FRIENDS','Find your fellow weirdos')}<p class="nw-muted">Loading your Friends...</p></section>`);
 try{
  const data=await nwFriendsRpc('nw_friend_snapshot');
  if(serial!==nwFriendsLoadSerial||nwCloud.user()?.is_anonymous)return;
  nwFriendsSnapshot=data;
  nwFriendsDraw(tab,back);
 }catch(e){
  if(serial!==nwFriendsLoadSerial)return;
  evDisplay(`${evHeader('FRIENDS',back)}<section class="nw-new-panel">${nwAccountHeading('FRIENDS')}<p class="nw-muted" role="alert">${nwEscape(e.message)}</p><button class="nw-action" id="nwFriendRetry">RETRY</button></section>`);
  evRoot.querySelector('#nwFriendRetry').onclick=()=>nwFriendsLoad(tab,back);
 }
}
function nwShowFriends(tab='list',back=nwShowProfile){
 clearInterval(nwDoubleTimer);evSudokuLeave();nwAccountTheme();
 const guest=!nwCloud?.user()||nwCloud.user().is_anonymous;
 if(guest){
  evDisplay(`${evHeader('FRIENDS',back)}<section class="nw-new-panel">${nwAccountHeading('FRIENDS','Find your fellow weirdos')}<p class="nw-muted">Register an account to add friends and play Friendly Challenges.</p></section>`);
  return;
 }
 void nwFriendPresenceTick();
 void nwFriendsLoad(tab,back);
}
function nwFriendsDraw(tab='list',back=nwShowProfile){
 const d=nwFriendsSnapshot||{friends:[],incoming:[],outgoing:[],blocked:[],appear_offline:false};
 const incoming=d.incoming||[],friends=d.friends||[],outgoing=d.outgoing||[];
 const pill=(label,action,id,cls='')=>`<button class="nw-friend-mini ${cls}" data-social-action="${action}" data-social-id="${nwEscape(id)}">${label}</button>`;
 const item=(p,actions='',sub='')=>`<div class="nw-friend-row">${nwFriendPhoto(p)}<div class="nw-friend-name"><strong>${nwEscape(p.name)}</strong>${sub?'<small>'+sub+'</small>':''}</div><div class="nw-friend-actions">${actions}</div></div>`;
 let content='';
 if(tab==='list'){
  content=`<h3>MY FRIENDS (${friends.length})</h3><p class="nw-muted">${friends.filter(f=>f.online).length} online</p>`+
   (friends.length?friends.map(f=>item(f,pill('PROFILE','profile',f.id)+pill('CHALLENGE','challenge',f.id)+pill('REMOVE','remove',f.id,'nw-friend-outline')+pill('BLOCK','block',f.id,'nw-friend-outline'),'<span class="nw-friend-dot '+(f.online?'on':'')+'"></span> '+(f.online?'Online':'Offline'))).join(''):'<p class="nw-muted">Your friends list is empty. Find your first fellow weirdo!</p>')+
   `<label class="nw-friend-private"><input type="checkbox" id="nwFriendInvisible" ${d.appear_offline?'checked':''}> Appear offline to friends</label>`+
   ((d.blocked||[]).length?`<details class="nw-friend-blocked"><summary>Blocked players (${d.blocked.length})</summary>${d.blocked.map(p=>item(p,pill('UNBLOCK','unblock',p.id))).join('')}</details>`:'');
 }else if(tab==='requests'){
  content=`<h3>INCOMING REQUESTS (${incoming.length})</h3>`+(incoming.map(p=>item(p,pill('ACCEPT','accept',p.id)+pill('DECLINE','decline',p.id,'nw-friend-outline'))).join('')||'<p class="nw-muted">No pending requests.</p>')+
   `<h3>SENT REQUESTS (${outgoing.length})</h3>`+(outgoing.map(p=>item(p,pill('CANCEL','cancel',p.id,'nw-friend-outline'))).join('')||'<p class="nw-muted">No sent requests.</p>');
 }else if(tab==='add'){
  content=`<label class="nw-new-label" for="nwFriendSearch">EXACT USERNAME</label><input id="nwFriendSearch" maxlength="20" autocomplete="off" placeholder="Enter username"><button class="nw-action" id="nwFriendSearchBtn">SEARCH</button><div id="nwFriendResult" aria-live="polite"></div>`;
 }else{
  content=`<h3>FRIENDLY CHALLENGES</h3><div id="nwFriendChallenges"><p class="nw-muted">Loading challenges...</p></div>`;
 }
 evDisplay(`${evHeader('FRIENDS',back)}<section class="nw-new-panel nw-social-panel">${nwAccountHeading('FRIENDS','Find your fellow weirdos')}<div class="nw-friend-tabs">${[['list','MY FRIENDS'],['requests','REQUESTS'],['add','ADD FRIEND'],['challenges','CHALLENGES']].map(([id,label])=>`<button type="button" data-friend-tab="${id}" class="${tab===id?'active':''}">${label}${id==='requests'&&incoming.length?' ('+incoming.length+')':''}</button>`).join('')}</div><div class="nw-friend-content">${content}<p id="nwSocialStatus" role="status" class="nw-muted"></p></div></section>`);
 evRoot.querySelectorAll('[data-friend-tab]').forEach(b=>b.onclick=()=>nwFriendsDraw(b.dataset.friendTab,back));
 evRoot.querySelectorAll('[data-social-action]').forEach(b=>b.onclick=()=>nwSocialAction(b.dataset.socialAction,b.dataset.socialId,tab,back));
 const hidden=evRoot.querySelector('#nwFriendInvisible');
 if(hidden)hidden.onchange=async()=>{hidden.disabled=true;try{await nwFriendsRpc('nw_friend_heartbeat',{p_appear_offline:hidden.checked});await nwFriendsLoad(tab,back)}catch(e){hidden.disabled=false;hidden.checked=!hidden.checked;const out=evRoot.querySelector('#nwSocialStatus');if(out)out.textContent=e.message}};
 const search=evRoot.querySelector('#nwFriendSearch'),searchBtn=evRoot.querySelector('#nwFriendSearchBtn');
 if(searchBtn){
  search.onkeydown=e=>{if(e.key==='Enter')searchBtn.click()};
  searchBtn.onclick=async()=>{
   const name=search.value.trim(),out=evRoot.querySelector('#nwFriendResult');
   if(!/^[A-Za-z0-9._]{3,20}$/.test(name)){out.textContent='Enter a valid username (3–20 characters).';return}
   searchBtn.disabled=true;out.textContent='Searching...';
   try{
    const match=await nwFriendsRpc('nw_friend_search',{p_name:name});
    if(!match){out.textContent='No available player with that username.';return}
    const related=friends.some(f=>f.id===match.id),sent=outgoing.some(f=>f.id===match.id),received=incoming.some(f=>f.id===match.id);
    out.innerHTML=item(match,related?'FRIENDS':sent?'REQUEST SENT':received?'CHECK REQUESTS':pill('ADD FRIEND','send',match.id));
    out.querySelectorAll('[data-social-action]').forEach(b=>b.onclick=()=>nwSocialAction('send',match.id,tab,back));
   }catch(e){out.textContent=e.message}
   finally{searchBtn.disabled=false}
  };
 }
 if(tab==='challenges')void nwChallengesDraw(back);
 if(tab==='requests')void nwFriendNoticeMark('requests');
 nwResetViewToTop();
}
async function nwSocialAction(action,id,tab,back){
 if(nwFriendsBusy)return;
 if(action==='challenge'){nwChallengeChoose(id,back);return}
 if(action==='profile'){void nwFriendOpenProfile(id,back);return}
 if(['remove','block'].includes(action)&&!confirm(action==='block'?'Block this player? Existing friendship and pending invitations will be removed.':'Remove this friend?'))return;
 nwFriendsBusy=true;
 const out=evRoot.querySelector('#nwSocialStatus');if(out)out.textContent='Syncing...';
 try{await nwFriendsRpc('nw_friend_action',{p_action:action,p_target:id});await nwFriendsLoad(tab,back)}
 catch(e){if(out)out.textContent=e.message}
 finally{nwFriendsBusy=false}
}
function nwShowProfile(){
  if(nwCloud?.user()&&!nwCloud.user().is_anonymous&&!nwCloud.isRecovering()&&!nwSetupVerified()){void nwRouteAccount();return;}
  evSudokuLeave();nwAccountTheme();
  const u=window.nwCloud?.user();const anon=!!u?.is_anonymous;const p=nwProfile();const recovery=!!window.nwCloud?.isRecovering?.();const profileLocked=!u;
  if(recovery&&u&&!anon){nwShowRecovery();return;}

  const lockedEditor=`<div class="nw-profile-editor ${profileLocked?'nw-profile-locked':''}"><label class="nw-new-label" for="nwName">USERNAME</label><input id="nwName" maxlength="20" value="${nwEscape(p.name)}" autocomplete="username" ${profileLocked||anon?'disabled':''}><p class="nw-muted">${anon?'Register to choose your own username.':'3–20 letters, numbers, dots or underscores. No spaces. Guest_ is reserved.'}</p><label class="nw-new-label">CHOOSE AN AVATAR</label><div class="nw-avatar-grid">${nwAvatarChoices.map((a,i)=>`<button class="nw-avatar-choice ${a===p.avatar?'chosen':''}" data-avatar="${a}" aria-label="Choose avatar ${i+1}" ${profileLocked?'disabled':''}>${nwAvatarImg(a,'nw-avatar-choice-img')}</button>`).join('')}</div><button class="nw-action" id="nwSaveProfile" ${profileLocked?'disabled':''}>SAVE PROFILE</button><p id="nwProfileNotice" role="status" hidden></p></div>`;

  let authBlock='';
  if(!u){
    authBlock=`<div class="nw-auth-card">${nwAccountHeading('HELLO, WEIRDO!','Your little universe awaits.')}<button class="nw-action nw-auth-secondary" id="nwEmailEntry" type="button">CONTINUE WITH EMAIL</button><div id="nwEmailFields" hidden><label class="nw-new-label" for="nwEmail">EMAIL</label><input id="nwEmail" type="email" autocomplete="email" placeholder="you@example.com"><label class="nw-new-label" for="nwPassword">PASSWORD</label><input id="nwPassword" type="password" autocomplete="current-password" minlength="6" placeholder="Password"><button class="nw-text-link" id="nwReset" type="button">Forgot password?</button><button class="nw-action nw-auth-primary" id="nwSignIn" data-auth-busy>SIGN IN</button></div><div class="nw-auth-divider"><span>OR</span></div><div class="nw-auth-stack"><button class="nw-action nw-auth-secondary" id="nwGoogle" data-auth-busy>CONTINUE WITH GOOGLE</button><button class="nw-action nw-auth-secondary" id="nwDiscord" data-auth-busy>CONTINUE WITH DISCORD</button><button class="nw-action nw-auth-secondary" id="nwMakeCloudGuest" data-auth-busy>CONTINUE AS GUEST</button></div><p class="nw-auth-switch">New here? <button class="nw-inline-link" id="nwGoRegister" type="button">Create an account</button></p><p id="nwAuthNotice" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div></div>`;
  }else if(anon){
    authBlock=`<div class="nw-auth-card"><h3>ACCOUNT</h3><p class="nw-muted">Register to choose your own username.</p><div class="nw-auth-stack"><button class="nw-action nw-auth-secondary" id="nwGoogle">REGISTER WITH GOOGLE</button><button class="nw-action nw-auth-secondary" id="nwDiscord">REGISTER WITH DISCORD</button></div><button class="nw-action nw-auth-secondary" id="nwSignOut">SIGN OUT</button><p id="nwAuthNotice" hidden></p></div>`;
  }else{
    authBlock=`<div class="nw-auth-card"><h3>ACCOUNT</h3><button class="nw-action nw-auth-secondary" id="nwSignOut">SIGN OUT</button><p id="nwAuthNotice" hidden></p></div>`;
  }

  evDisplay(`${u?evHeader('PLAYER PROFILE',showCategories):'<header class="ev-head"><span></span><strong class="nw-brand-title">NINE & WEIRD</strong><span></span></header>'}<section class="nw-new-panel ${u?'':'nw-account-welcome'}">${u?nwAccountHeading('MY PROFILE'): ''}<div class="nw-profile-avatar nw-profile-with-frame">${nwFrameArt(p.avatar)}</div><h2>${nwEscape(p.name)}</h2><p class="nw-muted" id="nwAccountStatus">${anon?'Guest':u?'Signed in: '+nwEscape(u.email||'Account'):'Guest'}</p>${u?`<div class="nw-account-nav"><button id="nwViewOwnProfile" class="nw-action nw-auth-secondary" ${anon?'disabled':''}>VIEW MY PROFILE</button><button id="nwOpenAvatars" class="nw-action nw-auth-secondary">EDIT PROFILE</button></div><button id="nwOpenFriends" class="nw-action nw-auth-secondary nw-friends-entry">FRIENDS <span>›</span></button>`:''}<div id="nwProfileEdit" ${u?'hidden':''}>${lockedEditor}<div id="nwProfileFrames">${nwFramePicker()}</div></div>${authBlock}${!u?'<p class="nw-auth-switch"><a href="privacy.html">Privacy Policy</a></p>':''}</section>`);nwBindFramePicker();
  const on=(id,fn)=>{const b=evRoot.querySelector('#'+id);if(b)b.onclick=fn;};
  if(u&&!anon&&p.name==='Guest Player'){evRoot.querySelector('#nwProfileEdit').hidden=false;}
  on('nwOpenAvatars',()=>{evRoot.querySelector('#nwProfileEdit').hidden=false;});
  on('nwOpenFriends',()=>nwShowFriends());
  on('nwViewOwnProfile',()=>void nwFriendOpenProfile(u.id,nwShowProfile));
  on('nwEmailEntry',()=>{evRoot.querySelector('#nwEmailFields').hidden=false;evRoot.querySelector('#nwEmail').focus();});

  if(!u && window.nwCloud){const captcha=evRoot.querySelector('.nw-captcha');if(captcha)nwCloud.mountCaptcha(captcha)}
  let avatar=p.avatar;
  evRoot.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{avatar=b.dataset.avatar;evRoot.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('chosen',x===b))});
  const notice=(s)=>{const el=evRoot.querySelector('#nwAuthNotice');if(el){el.textContent=s;el.hidden=!s}};
  const profileNotice=(s)=>{const el=evRoot.querySelector('#nwProfileNotice');if(el){el.textContent=s;el.hidden=!s}};
  for(const [id,provider] of [['nwGoogle','google'],['nwDiscord','discord']]){
    const button=evRoot.querySelector('#'+id);
    if(button)button.onclick=async()=>{
      button.disabled=true;
      try{
        if(anon)await nwCloud.linkProvider(provider);
        else await nwCloud.signInProvider(provider);
      }catch(e){notice(e.message);button.disabled=false;}
    };
  }
  const save=evRoot.querySelector('#nwSaveProfile');
  save.onclick=async()=>{
    if(!window.nwCloud?.user())return;
    const accountId=window.nwCloud.user().id;const name=anon?nwGuestName(accountId):evRoot.querySelector('#nwName').value;
    if(!anon&&!nwUsernameValid(name)){profileNotice('Choose 3–20 letters, numbers, dots or underscores. Guest_ and recorded opponent names are reserved.');return;}
    if(!anon&&name==='Guest Player'){profileNotice('Choose a valid username before saving.');return;}
    save.disabled=true;
    try{
      if(window.nwCloud?.user()){if(!anon&&!(await nwCloud.usernameAvailable(name)))throw new Error('That username is already taken.');await nwCloud.saveProfile(name,avatar);}
      if(nwCloud.user()?.id!==accountId)return;nwWrite(nwProfileKey,{name,avatar});nwShowProfile();
    }catch(e){profileNotice('Could not save profile: '+e.message);save.disabled=false;}
  };
  if(u){
    evRoot.querySelector('#nwSignOut').onclick=async()=>{
      try{if(anon&&!window.confirm('Signing out may permanently lose this guest account. Sign out anyway?'))return;await nwCloud.signOut();nwShowProfile()}catch(e){notice(e.message)}
    };
  }else{
    const credentials=()=>{
      const email=evRoot.querySelector('#nwEmail').value.trim(),password=evRoot.querySelector('#nwPassword').value;
      if(!email||!email.includes('@'))throw new Error('Enter a valid email address.');
      return {email,password};
    };
    const action=async(fn)=>{
      const buttons=Array.from(evRoot.querySelectorAll('[data-auth-busy]'));
      buttons.forEach(b=>b.disabled=true);
      try{await fn();}catch(e){notice(e.message)}finally{window.nwCloud?.resetCaptcha?.();buttons.forEach(b=>b.disabled=false)}
    };
    evRoot.querySelector('#nwGoRegister').onclick=()=>nwShowRegister(evRoot.querySelector('#nwEmail')?.value?.trim()||'');
    evRoot.querySelector('#nwMakeCloudGuest').onclick=()=>action(async()=>{
      const guestButton=evRoot.querySelector('#nwMakeCloudGuest');if(guestButton)guestButton.disabled=true;
      try{
        await nwCloud.signInAnonymously();
        await nwRouteAccount();
      }catch(e){if(guestButton)guestButton.disabled=false;throw e;}
    });
    evRoot.querySelector('#nwSignIn').onclick=()=>action(async()=>{
      const {email,password}=credentials();if(!password)throw new Error('Enter your password.');
      await nwCloud.signIn(email,password);await nwRouteAccount();
    });
    evRoot.querySelector('#nwReset').onclick=()=>nwShowForgotPassword(evRoot.querySelector('#nwEmail')?.value?.trim()||'');
  }
}

function nwShowRegister(initialEmail=''){
  evSudokuLeave();nwAccountTheme();
  evDisplay(`${evHeader('CREATE ACCOUNT',nwShowProfile)}<section class="nw-new-panel"><div class="nw-auth-card nw-auth-card-standalone">${nwAccountHeading('NEW AROUND HERE?','Create your account')}<label class="nw-new-label" for="nwRegEmail">EMAIL</label><input id="nwRegEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${nwEscape(initialEmail)}"><label class="nw-new-label" for="nwRegPassword">PASSWORD</label><input id="nwRegPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"><label class="nw-new-label" for="nwRegPassword2">CONFIRM PASSWORD</label><input id="nwRegPassword2" type="password" autocomplete="new-password" minlength="6" placeholder="Enter it again"><button class="nw-action nw-auth-primary" id="nwCreateAccount" data-auth-busy>CREATE ACCOUNT</button><p id="nwRegisterNotice" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div><p class="nw-auth-switch">Already have an account? <button class="nw-inline-link" id="nwBackToSignIn" type="button">Sign in</button></p></div></section>`);
  const captcha=evRoot.querySelector('.nw-captcha');if(captcha&&window.nwCloud)nwCloud.mountCaptcha(captcha);
  const notice=evRoot.querySelector('#nwRegisterNotice');
  const say=(m)=>{notice.textContent=m;notice.hidden=!m};
  const action=async(fn)=>{
    const buttons=Array.from(evRoot.querySelectorAll('[data-auth-busy]'));
    buttons.forEach(b=>b.disabled=true);
    try{await fn();}catch(e){say(e.message)}finally{window.nwCloud?.resetCaptcha?.();buttons.forEach(b=>b.disabled=false)}
  };
  evRoot.querySelector('#nwBackToSignIn').onclick=()=>nwShowProfile();
  evRoot.querySelector('#nwCreateAccount').onclick=()=>action(async()=>{
    const email=evRoot.querySelector('#nwRegEmail').value.trim();
    const password=evRoot.querySelector('#nwRegPassword').value;
    const confirm=evRoot.querySelector('#nwRegPassword2').value;
    if(!email||!email.includes('@'))throw new Error('Enter a valid email address.');
    if(password.length<6)throw new Error('Use at least 6 characters for your password.');
    if(password!==confirm)throw new Error('The passwords do not match.');
    const result=await nwCloud.signUp(email,password);
    if(result?.session){await nwRouteAccount()}
    else say('Check your email. If this address can be registered, you’ll receive a confirmation link. Already have an account? Sign in instead.');
  });
}

// Password recovery is a separate screen; it is never mixed with profile editing.
function nwShowForgotPassword(initialEmail=''){
  evSudokuLeave();nwAccountTheme();
  evDisplay(`${evHeader('FORGOT PASSWORD',nwShowProfile)}<section class="nw-new-panel">${nwAccountHeading('FORGOT PASSWORD')}<p class="nw-muted">Enter your email and we'll send you a link to set a new one.</p><label class="nw-new-label" for="nwForgotEmail">EMAIL</label><input id="nwForgotEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${nwEscape(initialEmail)}"><button class="nw-action" id="nwSendRecovery">SEND RESET LINK</button><p id="nwRecoveryRequestNotice" class="nw-muted" role="status" aria-live="polite" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div></section>`);
  const captcha=evRoot.querySelector('.nw-captcha');if(captcha&&window.nwCloud)nwCloud.mountCaptcha(captcha);
  const button=evRoot.querySelector('#nwSendRecovery'),msg=evRoot.querySelector('#nwRecoveryRequestNotice');
  button.onclick=async()=>{
    const email=evRoot.querySelector('#nwForgotEmail').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.hidden=false;msg.textContent='Enter a valid email address.';return;}
    button.disabled=true;msg.hidden=true;
    try{
      await nwCloud.resetPassword(email);
      msg.textContent='If that email has an account, a reset link is on its way. Check your inbox and spam folder.';
      msg.hidden=false;
    }catch(e){msg.textContent=e.message||'Could not send the link. Please try again.';msg.hidden=false;}
    finally{button.disabled=false;window.nwCloud?.resetCaptcha?.();}
  };
}
function nwShowRecovery(){
  if(!window.nwCloud?.user()||!window.nwCloud?.isRecovering?.())return;
  evSudokuLeave();nwAccountTheme();
  evDisplay(`<header class="ev-head"><span></span><strong class="nw-brand-title">NINE & WEIRD</strong><span></span></header><section class="nw-new-panel">${nwAccountHeading('RESET PASSWORD')}<p class="nw-muted">Enter a new password for your Nine & Weird account.</p><form id="nwRecoveryForm"><label class="nw-new-label" for="nwNewPassword">NEW PASSWORD</label><input id="nwNewPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"><label class="nw-new-label" for="nwConfirmPassword">CONFIRM NEW PASSWORD</label><input id="nwConfirmPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Enter it again"><button class="nw-action" id="nwSetPassword" type="submit">SAVE NEW PASSWORD</button></form><p id="nwRecoveryNotice" class="nw-muted" role="status" aria-live="polite" hidden></p><button class="nw-action" id="nwCancelRecovery">CANCEL</button></section>`);
  const msg=evRoot.querySelector('#nwRecoveryNotice'),submit=evRoot.querySelector('#nwSetPassword');
  evRoot.querySelector('#nwRecoveryForm').onsubmit=async(e)=>{
    e.preventDefault();const p=evRoot.querySelector('#nwNewPassword').value,confirm=evRoot.querySelector('#nwConfirmPassword').value;
    if(p.length<8){msg.textContent='Use at least 8 characters.';msg.hidden=false;return;}
    if(p!==confirm){msg.textContent='The passwords do not match.';msg.hidden=false;return;}
    submit.disabled=true;msg.hidden=true;
    try{await nwCloud.finishRecovery(p);await nwRouteAccount();const n=evRoot.querySelector('#nwAuthNotice');if(n){n.textContent='Password updated. You can use your new password next time you sign in.';n.hidden=false;}}
    catch(err){msg.textContent=err.message||'Could not update your password.';msg.hidden=false;submit.disabled=false;}
  };
  evRoot.querySelector('#nwCancelRecovery').onclick=async()=>{
    try{await nwCloud.signOut();nwShowProfile();}catch(err){msg.textContent=err.message;msg.hidden=false;}
  };
}
// V36: server-backed first-time profile gate. Never trust another account's local name.
let nwVerifiedAccount=null, nwRouteJob=null, nwRouteKey=null, nwStartupDone=false, nwLastAuthKey=null, nwRouteSerial=0;
function nwSetupVerified(){return !!nwCloud.user()&&nwVerifiedAccount===nwCloud.user().id;}
function nwAuthKey(){const u=nwCloud.user();return u?`${u.id}:${!!u.is_anonymous}:${nwCloud.isRecovering()}`:'signed-out';}
function nwShowSetup(data){
  nwAccountTheme();let avatar=nwAvatarValue(data?.avatar);const accountId=nwCloud.user()?.id;
  evDisplay(`<header class="ev-head"><span></span><strong class="nw-brand-title">NINE & WEIRD</strong><span></span></header><section class="nw-new-panel nw-first-setup">${nwAccountHeading('SET UP YOUR PROFILE','Make this little universe yours.')}<form id="nwSetupForm"><label class="nw-new-label" for="nwSetupName">USERNAME</label><input id="nwSetupName" maxlength="20" autocomplete="username" required placeholder="Your username"><p class="nw-muted">3–20 letters, numbers, dots or underscores. No spaces.</p><button type="button" id="nwCheckName" class="nw-action nw-auth-secondary">CHECK AVAILABILITY</button><p id="nwSetupNotice" role="status" aria-live="polite" hidden></p><label class="nw-new-label">CHOOSE AN AVATAR</label><div class="nw-avatar-grid">${nwAvatarChoices.map((a,i)=>`<button type="button" class="nw-avatar-choice ${a===avatar?'chosen':''}" data-setup-avatar="${a}" aria-label="Choose avatar ${i+1}" aria-pressed="${a===avatar}">${nwAvatarImg(a,'nw-avatar-choice-img')}</button>`).join('')}</div><button class="nw-action" id="nwFinishSetup" type="submit">SAVE &amp; CONTINUE</button></form><button type="button" class="nw-action nw-auth-secondary" id="nwSetupSignOut">SIGN OUT</button></section>`);
  const form=evRoot.querySelector('#nwSetupForm'),input=evRoot.querySelector('#nwSetupName'),msg=evRoot.querySelector('#nwSetupNotice'),check=evRoot.querySelector('#nwCheckName'),save=evRoot.querySelector('#nwFinishSetup'),out=evRoot.querySelector('#nwSetupSignOut');
  if(nwUsernameValid(data?.display_name||''))input.value=data.display_name;
  const say=(m)=>{msg.textContent=m;msg.hidden=!m};
  input.oninput=()=>say('');
  evRoot.querySelectorAll('[data-setup-avatar]').forEach(b=>b.onclick=()=>{avatar=b.dataset.setupAvatar;evRoot.querySelectorAll('[data-setup-avatar]').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',String(x===b));});});
  async function verify(name){if(!nwUsernameValid(name))throw Error('Choose 3–20 letters, numbers, dots or underscores. Guest_ and recorded opponent names are reserved.');if(!await nwCloud.usernameAvailable(name))throw Error('That username is already taken.');}
  async function action(doSave){const name=input.value;check.disabled=save.disabled=out.disabled=input.disabled=true;try{await verify(name);if(nwCloud.user()?.id!==accountId||!form.isConnected)return;if(!doSave){say('Username available!');return;}await nwCloud.saveProfile(name,avatar);if(nwCloud.user()?.id!==accountId||!form.isConnected)return;nwWrite(nwProfileKey,{name,avatar});nwVerifiedAccount=accountId;showCategories();}catch(e){say(e.message||'Please try again.');}finally{check.disabled=save.disabled=out.disabled=input.disabled=false;}}
  check.onclick=()=>void action(false);form.onsubmit=e=>{e.preventDefault();void action(true);};out.onclick=async()=>{try{await nwCloud.signOut();await nwRouteAccount();}catch(e){say(e.message);}};
}
function nwShowAccountRetry(error){nwAccountTheme();evDisplay(`<section class="nw-new-panel">${nwAccountHeading('PROFILE UNAVAILABLE')}<p class="nw-muted" role="alert">${nwEscape(error.message||'Could not load your profile.')}</p><button class="nw-action" id="nwRetryAccount">TRY AGAIN</button><button class="nw-action nw-auth-secondary" id="nwRetrySignOut">SIGN OUT</button></section>`);evRoot.querySelector('#nwRetryAccount').onclick=()=>void nwRouteAccount();evRoot.querySelector('#nwRetrySignOut').onclick=async()=>{try{await nwCloud.signOut();await nwRouteAccount();}catch(e){nwShowAccountRetry(e);}};}
function nwRouteAccount(){
  const key=nwAuthKey();if(nwRouteJob&&nwRouteKey===key)return nwRouteJob;
  nwRouteKey=key;nwRouteSerial++;
  const job=(async()=>{
    const u=nwCloud.user();if(nwCloud.isRecovering()&&u){nwShowRecovery();return;}
    if(!u){nwVerifiedAccount=null;nwShowProfile();return;}
    if(!u.is_anonymous&&nwSetupVerified()){showCategories();return;}
    nwAccountTheme();evDisplay(`<section class="nw-new-panel">${nwAccountHeading('LOADING PROFILE')}</section>`);
    try{const data=await nwCloud.readProfile();if(nwAuthKey()!==key)return;try{await nwHydrateFrame(data)}catch(e){console.warn('Frame sync:',e.message)}if(nwAuthKey()!==key)return;
      if(u.is_anonymous){const name=nwGuestName(u.id),avatar=nwAvatarValue(data?.avatar||nwRead(nwProfileKey,{}).avatar);nwWrite(nwProfileKey,{name,avatar});if(!data||data.display_name!==name){try{await nwCloud.saveProfile(name,avatar)}catch(e){console.warn('Guest profile sync:',e.message)}}if(nwAuthKey()===key)showCategories();return;}
      if(data)nwWrite(nwProfileKey,{name:data.display_name||'Guest Player',avatar:nwAvatarValue(data.avatar)});
      if(data?.profile_setup_complete===true&&nwUsernameValid(data.display_name)){nwVerifiedAccount=u.id;showCategories();}else nwShowSetup(data);
    }catch(e){if(nwAuthKey()!==key)return;if(u.is_anonymous){showCategories();return;}nwShowAccountRetry(e);}
  })();nwRouteJob=job;job.finally(()=>{if(nwRouteJob===job)nwRouteJob=null;});return job;
}
async function nwStartV37(){
  try{await nwCloud.ready;await nwCloudSaveInit();await nwWalletSync();void nwPrizeSync().catch(e=>console.warn('Inventory startup sync:',e.message));nwStartupDone=true;nwLastAuthKey=nwAuthKey();await nwRouteAccount();}
  catch(e){nwStartupDone=true;nwShowAccountRetry(e);}
}
if(window.nwCloud){
  nwCloud.onChange(()=>{const uid=nwCloud.user()?.id||null;if(uid!==nwPrizeCacheOwner){nwPrizeCacheOwner=uid;nwPrizeCache={stock:{},claims:[],transfers:[]};nwWalletState={user:null,active:false,balance:0};nwBattleRewardState={account:null,month:null,wins:0,claimed:[],loaded:false};nwBattleRewardError='';}if(!nwStartupDone)return;const key=nwAuthKey();if(key===nwLastAuthKey)return;nwLastAuthKey=key;nwVerifiedAccount=null;const serial=nwRouteSerial;
    // Run outside Supabase's auth callback lock; token refresh for same identity is ignored.
    setTimeout(()=>{if(nwAuthKey()!==key||nwRouteSerial!==serial)return;void(async()=>{try{await nwCloudSaveInit()}catch(e){if(nwAuthKey()===key)nwShowAccountRetry(e);return}if(nwAuthKey()!==key||nwRouteSerial!==serial)return;try{await nwWalletSync()}catch(e){if(nwAuthKey()===key)nwShowAccountRetry(e);return}if(nwAuthKey()!==key||nwRouteSerial!==serial)return;try{await nwPrizeSync()}catch(e){console.warn('Inventory login sync:',e.message)}if(nwAuthKey()!==key||nwRouteSerial!==serial)return;evSudokuLeave();nwScroll.usual=nwScroll.weird=nwScroll.fav=0;nwRoomPages.usual=nwRoomPages.weird=nwRoomPages.fav=0;await nwRouteAccount();})();},0);
  });
}


/* Tournament prizes: account-scoped cloud inventory; existing local event gameplay remains unchanged. */
let nwPrizeCache={stock:{},claims:[],transfers:[]};
let nwPrizeCacheOwner=null;
const nwPrizeAppliedKey='nineweird-prize-diamond-receipts-v1';
const nwPrizeAckInflight=new Set();
const nwPrizeAckedInSession=new Set();
async function nwPrizeAck(kind,value){
 const uid=nwCloud?.user()?.id,id=uid+':'+kind+':'+value;
 if(!uid||nwPrizeAckInflight.has(id)||nwPrizeAckedInSession.has(id))return;
 nwPrizeAckInflight.add(id);
 try{
  const c=await nwCloud.get();
  const payload=kind==='transfer'?{p_id:Number(value)}:{p_event:value.split(':')[0],p_period:value.split(':')[1]};
  const {error}=await c.rpc(kind==='transfer'?'nw_prize_ack_transfer':'nw_prize_ack_claim',payload);
  if(error)throw Error(error.message);
  nwPrizeAckedInSession.add(id);
 }catch(e){console.warn('Inventory receipt acknowledgement:',e.message)}
 finally{nwPrizeAckInflight.delete(id)}
}
function nwPrizeAckTransfer(id){void nwPrizeAck('transfer',id)}
function nwPrizeFlushDurableReceipts(){
 const id=nwCloud?.user()?.id;
 if(!id||nwCloudSaveState.id!==id||!nwCloudSaveState.ready)return;
 const progress=nwCloudSaveState;
 const durable=key=>progress.values[key]!==undefined&&progress.confirmed[key]===progress.values[key];
 if(durable('nineweird-triple-economy-beta-v1')){
  const tt=nwRead(nwTripleKey,{});
  const ids=new Set(tt.inventoryApplied||[]);
  for(const t of nwPrizeCache.transfers||[])if(t.event==='tt'&&ids.has(t.id))nwPrizeAckTransfer(t.id);
 }
 if(durable('nw-growing-live-v1')){
  let tg={};try{tg=JSON.parse(progress.values['nw-growing-live-v1']||'{}')}catch{}
  const ids=new Set(Array.isArray(tg.inventoryApplied)?tg.inventoryApplied:[]);
  for(const t of nwPrizeCache.transfers||[])if(t.event==='tg'&&ids.has(t.id))nwPrizeAckTransfer(t.id);
 }
 if(durable('nineweird-triple-economy-beta-v1')&&durable('nineweird-prize-diamond-receipts-v1')){
  const applied=nwRead(nwPrizeAppliedKey,{});
  for(const c of nwPrizeCache.claims||[])if(applied[c.event+':'+c.period])void nwPrizeAck('claim',c.event+':'+c.period);
 }
}


const nwPrizeDefinitions=[
 {key:'tt_ticket',name:'Event Tickets',event:'tt',icon:'🎟'},
 {key:'tt_undo',name:'Undo',event:'tt',icon:'↶'},
 {key:'tt_shuffle',name:'Shuffle',event:'tt',icon:'⤨'},
 {key:'tt_magic',name:'Magic Clear',event:'tt',icon:'✦'},
 {key:'tg_energy',name:'Energy',event:'tg',icon:'ϟ'},
 {key:'tg_ray',name:'Shrink Ray',event:'tg',icon:'✧'},
 {key:'tg_juice',name:'Mutation Juice',event:'tg',icon:'✿'}
];
function nwPrizeTransferPeriod(event){return event==='tt'?nwTripleWeek():new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate())-((new Date().getUTCDay()+5)%7)*86400000).toISOString().slice(0,10);}
function nwPrizeApplyTTTransfers(){
 const d=nwTripleData();const applied=new Set(d.inventoryApplied||[]);
 let changed=false;
 for(const t of nwPrizeCache.transfers||[]){
  if(t.event!=='tt'||t.period!==d.week||applied.has(t.id))continue;
  const kind=t.item.slice(3),qty=Number(t.quantity);
  if(!Number.isSafeInteger(qty)||qty<=0)continue;
  if(kind==='ticket')d.extra+=qty;
  else if(['undo','shuffle','magic'].includes(kind))d.boosters[kind]=(d.boosters[kind]||0)+qty;
  else continue;
  applied.add(t.id);changed=true;
 }
 if(changed){d.inventoryApplied=[...applied];nwTripleSave(d);}
 nwPrizeFlushDurableReceipts();
}
function nwPrizeMirrorDiamonds(){
 const applied=nwRead(nwPrizeAppliedKey,{});
 let changed=false;
 for(const c of nwPrizeCache.claims||[]){
  const key=c.event+':'+c.period;
  if(!applied[key]&&Number.isSafeInteger(Number(c.diamonds))&&Number(c.diamonds)>0){
   applied[key]=Number(c.diamonds);changed=true;
  }
 }
 if(changed){
  nwWrite(nwPrizeAppliedKey,applied);
  // The prize claim transaction has already credited the server wallet.
  void nwWalletSync().catch(e=>console.warn('Prize wallet refresh:',e.message));
 }
 nwPrizeFlushDurableReceipts();
}
async function nwPrizeSync(){
 const account=nwCloud?.user()?.id;
 if(account!==nwPrizeCacheOwner){nwPrizeCacheOwner=account||null;nwPrizeCache={stock:{},claims:[],transfers:[]};}
 if(!account)return nwPrizeCache;
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_prize_snapshot');
 if(error)throw Error(error.message);
 if(nwCloud.user()?.id!==account)return nwPrizeCache;
 nwPrizeCache=data||{stock:{},claims:[],transfers:[]};
 nwPrizeMirrorDiamonds();
 nwPrizeApplyTTTransfers();
 try{document.getElementById('nwGrowingFrame')?.contentWindow?.nwGrowingApplyInventory?.();}catch(e){console.warn('Growing Inventory refresh:',e.message)}
 return nwPrizeCache;
}
async function nwGrowingUseReserve(qty){const n=Math.floor(Number(qty));if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid amount');await nwPrizeTransfer('tg_energy',n);return n;}
function nwGrowingInventoryAmount(){return nwPrizeAvailable('tg_energy');}
const nwAutoBoosterInflight=new Set();
async function nwLoadEventBoosters(event){
 const uid=nwCloud?.user()?.id,key=uid+':'+event;
 if(!uid||nwAutoBoosterInflight.has(key)||(event==='tt'&&!nwTripleInEvent())||(event==='tg'&&![2,3,4].includes(new Date().getUTCDay())))return;
 nwAutoBoosterInflight.add(key);
 try{
  await nwPrizeSync();
  const items=event==='tt'?['tt_undo','tt_shuffle','tt_magic']:['tg_ray','tg_juice'];
  let changed=false;
  for(const item of items){
   if(uid!==nwCloud?.user()?.id)break;
   const amount=Math.min(10000,nwPrizeAvailable(item));
   if(amount>0){await nwPrizeTransfer(item,amount);changed=true;}
  }
  if(changed&&uid===nwCloud?.user()?.id&&event==='tt'&&evRoot.classList.contains('nw-triple-theme')){
   if(nwTriple)nwTripleDraw();else nwTripleHome();
  }
 }catch(e){console.warn('Event booster inventory:',e.message)}
 finally{nwAutoBoosterInflight.delete(key)}
}
function nwPrizeAvailable(key){return Math.max(0,Number(nwPrizeCache.stock?.[key])||0);}
function nwPrizeTransferReceipts(event){return (nwPrizeCache.transfers||[]).filter(t=>t.event===event&&t.period===nwPrizeTransferPeriod(event));}
async function nwPrizeTransfer(key,amount){
 if(!nwPrizeDefinitions.some(d=>d.key===key)||!Number.isSafeInteger(amount)||amount<1)throw Error('Invalid transfer');
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_prize_transfer',{p_item:key,p_quantity:amount});
 if(error)throw Error(error.message);
 try{await nwPrizeSync()}catch(e){console.warn('Transfer saved; inventory refresh pending:',e.message);nwPrizeCache.stock={...nwPrizeCache.stock,[key]:Math.max(0,nwPrizeAvailable(key)-amount)};nwPrizeCache.transfers=[...(nwPrizeCache.transfers||[]),data];nwPrizeApplyTTTransfers();}
 return data;
}
function nwPrizeIcon(key){
 if(key==='tt_ticket')return '<img src="assets/triple/triple_ticket.png" alt="">';
 if(key==='tg_juice')return '<img src="growing/assets/mutation_juice.png" alt="">';
 if(key==='tg_ray')return '<img src="growing/assets/shrink_ray.png" alt="">';
 const paths={
  tt_undo:'<path d="M20 10L8 22l12 12M9 22h23c10 0 14 16 2 19"/>',
  tt_shuffle:'<path d="M5 13h7c11 0 13 22 27 22h4m-8-8 8 8-8 8M5 38h7c11 0 13-22 27-22h4m-8-8 8 8-8 8"/>',
  tt_magic:'<path d="M24 6c-21 1-24 36-4 39 22 3 25-24 10-27-13-3-19 12-10 17 8 5 14-3 9-8"/>',
  tg_energy:'<path d="M28 4 9 28h15l-5 16 20-25H24Z"/>',
  sudoku_hint:'<path d="M17 33h14M18 39h12M24 4a14 14 0 0 0-8 25v4h16v-4A14 14 0 0 0 24 4Z"/>'
 };
 return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[key]||'')+'</svg>';
}
const nwInventoryExplanations={
tt_ticket:'Use these tickets to play Triple Trouble. Tickets in Inventory stay until used.',
tt_undo:'Undo a move in Triple Trouble during gameplay.',
tt_shuffle:'Shuffle your Triple Trouble tiles during gameplay.',
tt_magic:'Clear a matching group in Triple Trouble during gameplay.',
tg_energy:"Use Energy to make moves in They're Growing! Stored Energy does not expire.",
tg_ray:"Remove three low-level creatures in They're Growing! during gameplay.",
tg_juice:"Merge creatures in They're Growing! during gameplay.",
sudoku_hint:'Reveal a correct placement in a Sudoku puzzle.'
};
function nwInventoryInfoDialog(key){
 const label=key==='sudoku_hint'?'Sudoku Hints':nwPrizeDefinitions.find(d=>d.key===key)?.name;
 if(!label)return;
 const o=document.createElement('div');o.className='nw-prize-overlay';
 o.innerHTML='<section class="nw-prize-dialog" role="dialog" aria-modal="true"><h2>'+nwEscape(label)+'</h2><p>'+nwEscape(nwInventoryExplanations[key]||'')+'</p><div class="nw-prize-actions"><button id="nwInfoClose" type="button">GOT IT</button></div></section>';
 evRoot.appendChild(o);o.querySelector('#nwInfoClose').onclick=()=>o.remove();
}
async function nwShowInventory(){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-inventory-theme');
 evDisplay(evHeader('INVENTORY',showCategories)+'<section class="nw-inventory-panel"><h2>INVENTORY</h2><p>LOADING INVENTORY…</p></section>');
 const uid=nwCloud?.user()?.id;
 try{await Promise.all([nwPrizeSync(),nwWalletSync()]);if(nwCloud?.user()?.id===uid&&evRoot.classList.contains('nw-inventory-theme'))nwRenderInventory();}
 catch(e){const area=evRoot.querySelector('.nw-inventory-panel');if(area)area.innerHTML='<h2>INVENTORY</h2><p>'+nwEscape(e.message)+'</p><button id="nwInventoryRetry">RETRY</button>';evRoot.querySelector('#nwInventoryRetry')?.addEventListener('click',nwShowInventory);}
}
function nwRenderInventory(){
 evDisplay(evHeader('INVENTORY',showCategories)+'<section class="nw-inventory-panel"><h2>INVENTORY</h2>'+nwPrizeInventoryArt()+'</section>');
 evRoot.querySelectorAll('[data-prize-use]').forEach(b=>b.onclick=()=>nwPrizeQuantityDialog(b.dataset.prizeUse));
 evRoot.querySelectorAll('[data-prize-info]').forEach(b=>b.onclick=()=>nwInventoryInfoDialog(b.dataset.prizeInfo));
}
function nwInventoryLoaded(key){
 const tt=key.startsWith('tt_')?nwTripleData():null;
 if(tt){if(key==='tt_ticket')return Math.max(0,Number(tt.extra)||0);return Math.max(0,Number(tt.boosters?.[key.slice(3)])||0);}
 const tg=key.startsWith('tg_')?nwGrowingLoadSave(nwCloud?.user()?.id):null;
 if(tg)return Math.max(0,Number(tg[key==='tg_energy'?'bonus':key==='tg_ray'?'ray':'juice'])||0);
 return 0;
}
function nwPrizeInventoryArt(){
 const cards=event=>nwPrizeDefinitions.filter(d=>d.event===event).map(d=>{
  const n=nwPrizeAvailable(d.key),loaded=nwInventoryLoaded(d.key),use=d.key==='tt_ticket'||d.key==='tg_energy',live=d.event==='tt'?nwTripleInEvent():[2,3,4].includes(new Date().getUTCDay()),displayCount=use?n:n+loaded;
  return '<article class="nw-compact-item"><button type="button" class="nw-compact-info" data-prize-info="'+d.key+'" aria-label="About '+nwEscape(d.name)+'">!</button><span class="nw-compact-icon" aria-hidden="true">'+nwPrizeIcon(d.key)+'</span><strong>'+nwEscape(d.name)+'</strong><b>× '+displayCount.toLocaleString()+'</b>'+(use?'<button type="button" data-prize-use="'+d.key+'" '+(n&&live?'':'disabled')+'>USE</button>':'')+'</article>';
 }).join('');
 return '<h3>TRIPLE TROUBLE</h3><div class="nw-compact-grid">'+cards('tt')+'</div><h3>THEY\'RE GROWING!</h3><div class="nw-compact-grid">'+cards('tg')+'</div><h3>SUDOKU</h3><div class="nw-compact-grid"><article class="nw-compact-item"><button class="nw-compact-info" type="button" data-prize-info="sudoku_hint" aria-label="About Sudoku Hints">!</button><span class="nw-compact-icon">'+nwPrizeIcon('sudoku_hint')+'</span><strong>Sudoku Hints</strong><b>× '+nwPrizeAvailable('sudoku_hint').toLocaleString()+'</b></article></div>';
}
function nwPrizeQuantityDialog(key){
 const item=nwPrizeDefinitions.find(d=>d.key===key),max=nwPrizeAvailable(key);if(!item||!max)return;
 const overlay=document.createElement('div');overlay.className='nw-prize-overlay';
 overlay.innerHTML=`<section class="nw-prize-dialog" role="dialog" aria-modal="true" aria-label="Use ${nwEscape(item.name)}">
 <h2>USE ${nwEscape(item.name).toUpperCase()}</h2><p>Available in Inventory: <strong>${max}</strong></p>
 <div class="nw-prize-quantity"><button type="button" data-step="-1" aria-label="Decrease">−</button><input id="nwPrizeQty" type="number" min="1" max="${max}" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-step="1" aria-label="Increase">+</button></div>
 <p class="nw-prize-summary">After use: <strong id="nwPrizeLeft">${max-1}</strong> remaining in Inventory</p>
 <p class="nw-prize-msg" id="nwPrizeMessage" role="status"></p>
 <div class="nw-prize-actions"><button type="button" id="nwPrizeCancel">CANCEL</button><button type="button" id="nwPrizeConfirm" >USE</button></div></section>`;
 evRoot.appendChild(overlay);
 const input=overlay.querySelector('#nwPrizeQty'),left=overlay.querySelector('#nwPrizeLeft');
 const quantity=()=>Math.min(max,Math.max(1,Math.trunc(Number(input.value)||1)));
 const update=()=>{input.value=quantity();left.textContent=String(max-quantity());};
 overlay.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{input.value=quantity()+Number(b.dataset.step);update();});
 input.oninput=update;overlay.querySelector('#nwPrizeCancel').onclick=()=>overlay.remove();
 overlay.querySelector('#nwPrizeConfirm').onclick=async()=>{
  const qty=quantity(),confirm=overlay.querySelector('#nwPrizeConfirm');confirm.disabled=true;
  try{await nwPrizeTransfer(key,qty);overlay.remove();nwShowInventory();}
  catch(e){overlay.querySelector('#nwPrizeMessage').textContent=e.message;confirm.disabled=false;}
 };
 input.focus();
}

const nwRankDiamonds=[3000,2000,1000,700,500,200,200,200,200,200];
const nwRankSupplies={
 tt:{tt_ticket:[20,15,10,8,5,3,3,3,3,3],tt_undo:[5,4,3,2,2,1,1,1,1,1],tt_shuffle:[3,3,2,2,2,1,1,1,1,1],tt_magic:[3,3,2,2,2,1,1,1,1,1]},
 tg:{tg_energy:[100,75,50,40,30,20,20,20,20,20],tg_ray:[5,4,3,2,1,1,1,1,1,1],tg_juice:[2,2,1,1,1,0,0,0,0,0]}
};
function nwRankRewardItems(event,rank){
 const i=Number(rank)-1;
 if(!Number.isInteger(i)||i<0||i>=10||!nwRankSupplies[event])return [];
 return [['diamonds',nwRankDiamonds[i]],...Object.entries(nwRankSupplies[event]).map(([k,v])=>[k,v[i]]).filter(([,qty])=>qty>0)];
}
function nwRankRewardArt(event,rank){
 const items=nwRankRewardItems(event,rank);
 if(!items.length)return '<span class="nw-lb-no-prize">NO RANK REWARD</span>';
 return '<div class="nw-lb-reward-grid">'+items.map(([key,qty])=>{
  const def=nwPrizeDefinitions.find(d=>d.key===key);
  const rawIcon=key==='diamonds'?'<img src="assets/currency/diamond.png" alt="">':nwPrizeIcon(key);
  const icon=rawIcon.replace(/src="([^"]+)"/g,(_,path)=>'src="'+new URL(path,document.baseURI).href+'"');
  const name=key==='diamonds'?'Diamonds':def?.name||key;
  return '<span class="nw-lb-reward-entry"><span class="nw-lb-reward-icon" aria-hidden="true">'+icon+'</span><b>×'+qty.toLocaleString()+'</b><small>'+nwEscape(name)+'</small></span>';
 }).join('')+'</div>';
}
function nwLbRewardsMarkup(event){
 return '<div class="nw-lb-prizes"><h3>'+(event==='tg'?"THEY'RE GROWING!":'TRIPLE TROUBLE')+' PRIZES</h3>'+
 [1,2,3,4,5,6].map(n=>'<section class="nw-lb-prize-tier"><strong>'+(n===6?'6TH–10TH':'#'+n)+'</strong>'+nwRankRewardArt(event,n)+'</section>').join('')+'</div>';
}
function nwPrizeSetMailNotice(unclaimed){
 const b=evRoot.querySelector('#nwMail');if(!b)return;
 b.classList.toggle('nw-mail-unclaimed',!!unclaimed);
 b.classList.toggle('nw-notification-orbit',!!unclaimed);
 b.setAttribute('aria-label',unclaimed?'Mail — rewards ready to claim':'Mail');
}
async function nwPrizeRefreshMailNotice(){
 const b=evRoot.querySelector('#nwMail');if(!b||!nwCloud?.user())return;
 const uid=nwCloud.user().id;
 try{
  const c=await nwCloud.get();
  const [prize,mail]=await Promise.all([c.rpc('nw_prize_inbox'),c.rpc('nw_mail_inbox')]);
  if(prize.error)throw Error(prize.error.message);if(mail.error)throw Error(mail.error.message);
  if(nwCloud.user()?.id!==uid)return;
  nwPrizeSetMailNotice([...(Array.isArray(prize.data)?prize.data:[]),...(Array.isArray(mail.data)?mail.data:[])].some(item=>!item.claimed));
 }catch(e){console.warn('Mail rewards status:',e.message)}
}


function nwPrizeClaimArt(data){
 const supplies=data?.supplies||data?.reward?.supplies||{};
 const diamonds=Number(data?.diamonds??data?.reward?.diamonds)||0;
 const items=[['diamonds',diamonds],...nwPrizeDefinitions.map(d=>[d.key,Number(supplies[d.key])||0]),['sudoku_hint',Number(supplies.sudoku_hint)||0]].filter(([,qty])=>Number.isFinite(qty)&&qty>0);
 return '<div class="nw-lb-reward-grid nw-mail-claimed-items">'+items.map(([key,qty])=>{
  const def=nwPrizeDefinitions.find(d=>d.key===key);
  const raw=key==='diamonds'?'<img src="assets/currency/diamond.png" alt="">':nwPrizeIcon(key);
  const art=raw.replace(/src="([^"]+)"/g,(_,path)=>'src="'+new URL(path,document.baseURI).href+'"');
  return '<span class="nw-lb-reward-entry"><span class="nw-lb-reward-icon" aria-hidden="true">'+art+'</span><b>×'+qty.toLocaleString()+'</b><small>'+nwEscape(key==='diamonds'?'Diamonds':key==='sudoku_hint'?'Sudoku Hints':def?.name||key)+'</small></span>';
 }).join('')+'</div>';
}
function nwPrizeClaimConfirmation(data){
 const overlay=document.createElement('div');
 overlay.className='nw-mail-claim-overlay';
 overlay.innerHTML='<section class="nw-mail-claim-dialog" role="dialog" aria-modal="true" aria-label="Rewards claimed"><span class="nw-mail-claim-stars" aria-hidden="true">✦ ✧ ✦</span><h2>REWARDS CLAIMED!</h2>'+nwPrizeClaimArt(data)+'<p>Your rewards are now in Inventory!</p><p class="nw-mail-claim-directions">To check, go to <strong>TROPHY → INVENTORY</strong>.</p><button type="button" class="nw-mail-claim-ok">AWESOME!</button></section>';
 evRoot.appendChild(overlay);
 const close=()=>overlay.remove();
 overlay.querySelector('.nw-mail-claim-ok').onclick=close;
 overlay.querySelector('.nw-mail-claim-ok').focus();
}

async function nwPrizeMail(){
 const account=nwCloud?.user()?.id;
 evSudokuLeave();applyTheme('hub');
 evRoot.classList.add('nw-trophy-theme','nw-cosmic-mail-theme');
 evDisplay(`${evHeader('MAIL',showCategories)}<section class="nw-cosmic-mail" aria-label="Mailbox">
  <div class="nw-cosmic-postmark">NINE &amp; WEIRD <span aria-hidden="true">✧</span></div>
  <div class="nw-mail-sky" aria-hidden="true"><span class="nw-mail-star star-one">✦</span><span class="nw-mail-star star-two">✧</span><span class="nw-mail-star star-three">✦</span><span class="nw-mail-star star-four">✧</span><span class="nw-mail-orbit orbit-one"></span><span class="nw-mail-orbit orbit-two"></span><span class="nw-mail-envelope"><span class="nw-mail-seal">×</span></span></div>
  <div class="nw-mail-heading"><h2>MAILBOX</h2><p>✧ MESSAGES FROM THE COSMOS ✧</p></div>
  <div class="nw-mail-inbox-heading"><div><span class="nw-mail-indicator" aria-hidden="true"></span><strong>INBOX</strong><span id="nwMailCount">(…)</span></div><small>MOST RECENT FIRST ↓</small></div>
  <div id="nwPrizeMailBody" class="nw-prize-mail nw-cosmic-mail-list" aria-live="polite">Checking your mail…</div>
  <div class="nw-mail-end" aria-hidden="true">✦ ⋆ ✧ END OF MAIL ✧ ⋆ ✦</div>
 </section>`);
 const container=evRoot.querySelector('#nwPrizeMailBody');
 try{
  const c=await nwCloud.get();
  const [prize,mail]=await Promise.all([c.rpc('nw_prize_inbox'),c.rpc('nw_mail_inbox')]);
  if(prize.error)throw Error(prize.error.message);
  if(mail.error)throw Error(mail.error.message);
  if(!container.isConnected||nwCloud?.user()?.id!==account)return;
  const rows=[
   ...(Array.isArray(prize.data)?prize.data:[]).map(r=>({...r,kind:'event',sortTime:String(r.period||'')+'T00:00:00Z'})),
   ...(Array.isArray(mail.data)?mail.data:[]).map(r=>({...r,kind:'letter',sortTime:String(r.delivered_at||'')}))
  ].sort((a,b)=>Number(!!a.claimed)-Number(!!b.claimed)||b.sortTime.localeCompare(a.sortTime));
  const count=evRoot.querySelector('#nwMailCount');
  if(count)count.textContent='('+rows.length+')';
  const indicator=evRoot.querySelector('.nw-mail-indicator');
  if(indicator)indicator.classList.toggle('has-unclaimed',rows.some(r=>!r.claimed));

  const summary=r=>r.kind==='letter'
   ?String(r.body||'').trim().split(/\n/).find(line=>line.trim()&&line.trim()!=='Hey, welcome to Nine & Weird!')||'You have a new message.'
   :r.claimed?'Your rewards have been collected.':'Tournament rewards are ready to claim.';
  function renderInbox(){
   if(!container.isConnected)return;
   container.innerHTML=rows.length?rows.map((r,i)=>{
    const sender=r.kind==='letter'?'NINE & WEIRD TEAM':r.event==='tt'?'TRIPLE TROUBLE':"THEY'RE GROWING!";
    const subject=r.kind==='letter'?String(r.subject||'MESSAGE'):'Tournament rewards · #'+Number(r.rank);
    return `<button type="button" class="nw-mail-inbox-item ${r.claimed?'is-claimed':'is-new'}" data-open-mail="${i}" style="--mail-index:${Math.min(i,8)}">
      <span class="nw-mail-inbox-icon" aria-hidden="true">${r.claimed?'✉':'✦'}</span>
      <span class="nw-mail-inbox-copy"><span class="nw-mail-inbox-sender">${nwEscape(sender)}</span>
       <strong>${nwEscape(subject)}</strong><span class="nw-mail-inbox-snippet">${nwEscape(summary(r))}</span></span>
      <span class="nw-mail-inbox-side"><span class="nw-mail-postal-stamp ${r.claimed?'stamp-claimed':''}">${r.claimed?'CLAIMED':'NEW'}</span><span class="nw-mail-open-arrow">›</span></span>
     </button>`;
   }).join(''):'<div class="nw-mail-empty"><span class="nw-mail-empty-envelope" aria-hidden="true">✉</span><p>Nothing in your mailbox yet.</p></div>';
   container.querySelectorAll('[data-open-mail]').forEach(button=>button.onclick=()=>{
    renderLetter(rows[Number(button.dataset.openMail)]);
   });
  }
  function renderLetter(r){
   if(!r||!container.isConnected)return;
   const claimed=!!r.claimed;
   let details='';
   if(r.kind==='letter'){
    details=`<div class="nw-mail-letter-top"><div><span class="nw-mail-letter-event">✦ NINE &amp; WEIRD TEAM</span><small>WELCOME MAIL</small></div><span class="nw-mail-postal-stamp ${claimed?'stamp-claimed':''}">${claimed?'CLAIMED ✓':'NEW'}</span></div>
     <strong class="nw-mail-finish">${nwEscape(r.subject)}</strong><p class="nw-mail-letter-body">${nwEscape(r.body)}</p>
     <div class="nw-cosmic-prizes nw-mail-gift-prizes">${nwPrizeClaimArt({diamonds:r.diamonds,supplies:r.supplies||{}})}</div>
     ${claimed?'<span class="nw-mail-collected">REWARDS CLAIMED ✓</span>':`<button class="nw-mail-claim-button" type="button" data-mail-claim="${Number(r.id)}">CLAIM REWARDS ✦</button>`}`;
   }else{
    const eventName=r.event==='tt'?'TRIPLE TROUBLE':"THEY'RE GROWING!",rank=Number(r.rank),code=r.event==='tt'?'tt':'tg';
    details=`<div class="nw-mail-letter-top"><div><span class="nw-mail-letter-event">✦ ${eventName}</span><small>TOURNAMENT REWARDS · ${nwEscape(String(r.period||''))}</small></div><span class="nw-mail-postal-stamp ${claimed?'stamp-claimed':''}">${claimed?'CLAIMED ✓':'NEW'}</span></div>
     <strong class="nw-mail-finish">You finished #${rank}!</strong><p class="nw-mail-letter-subtitle">${claimed?'Your rewards have been collected.':'A little something for your clever brain.'}</p>
     <div class="nw-cosmic-prizes">${nwRankRewardArt(code,rank)}</div>
     ${claimed?'<span class="nw-mail-collected">REWARDS CLAIMED ✓</span>':`<button class="nw-mail-claim-button" type="button" data-prize-claim="${code}:${nwEscape(String(r.period||''))}">CLAIM REWARDS ✦</button>`}`;
   }
   container.innerHTML='<button type="button" class="nw-mail-back-inbox">‹ INBOX</button><article class="nw-cosmic-letter '+(claimed?'is-claimed':'is-new')+' nw-mail-open-letter">'+details+'</article>';
   container.querySelector('.nw-mail-back-inbox').onclick=()=>renderInbox();
   const claim=container.querySelector('[data-prize-claim],[data-mail-claim]');
   if(claim)claim.onclick=async()=>{
    claim.disabled=true;claim.textContent='CLAIMING…';
    let confirmed=false;
    try{
     const eventData=claim.dataset.prizeClaim;
     const response=eventData?
      await c.rpc('nw_prize_claim',{p_event:eventData.split(':')[0],p_period:eventData.split(':')[1]}):
      await c.rpc('nw_mail_claim',{p_message_id:Number(claim.dataset.mailClaim)});
     if(response.error)throw Error(response.error.message);
     confirmed=true;claim.textContent='CLAIMED';
     try{await Promise.all([nwWalletSync(),nwPrizeSync()])}catch(e){console.warn('Claim confirmed; balance refresh pending:',e.message)}
     await nwPrizeMail();
     if(evRoot.querySelector('#nwPrizeMailBody'))nwPrizeClaimConfirmation(response.data);
    }catch(e){
     if(confirmed){claim.textContent='CLAIMED';return}
     claim.disabled=false;claim.textContent='CLAIM REWARDS ✦';
     const error=document.createElement('p');error.className='nw-prize-msg';error.textContent=e.message;claim.after(error);
    }
   };
  }
  nwPrizeSetMailNotice(rows.some(r=>!r.claimed));
  renderInbox();
 }catch(e){if(container.isConnected)container.textContent='Could not load mail: '+e.message;}
}

function nwShowTrophy(tab='home',offset=0){
  evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-trophy-theme');const r=nwWeeklyReport(offset),prior=nwWeeklyReport(offset-1),p=nwProfile();
  const weekTitle=new Date(r.start).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const brain=()=>`<div class="nw-report-head"><strong>${r.brain===null?'—':r.brain} / 1000</strong><span>Brain Power · playful game score, not IQ</span></div><div class="nw-report-grid"><article><small>ACCURACY</small><strong>${r.accuracy==null?'—':r.accuracy+'%'}</strong><em>Correct placements / attempts</em><span>${nwReportDelta(r.accuracy,prior.accuracy,' pts')} vs prior week</span></article><article><small>SPEED</small><strong>${nwFormatTime(r.adjusted)}</strong><em>Average difficulty-adjusted time</em><span>${r.adjusted!=null&&prior.adjusted!=null?nwFormatTime(Math.abs(r.adjusted-prior.adjusted))+(r.adjusted<=prior.adjusted?' faster':' slower'):'—'} vs prior week</span></article><article><small>WIN RATE</small><strong>${r.consistency==null?'—':r.consistency+'%'}</strong><em>${r.wins.length}/${r.rows.length} puzzles won</em><span>${nwReportDelta(r.consistency,prior.consistency,' pts')} vs prior week</span></article><article><small>IMPROVEMENT</small><strong>${nwReportDelta(r.brain,prior.brain)}</strong><em>Change in overall Brain Power</em><span>Compare weeks using arrows below</span></article></div><div class="nw-report-difficulty"><h3>DIFFICULTY PERFORMANCE</h3>${Object.entries(r.difficulty).map(([d,v])=>`<div class="nw-difficulty-line"><span>${d.toUpperCase()}</span><strong>${v.won} / ${v.played} completed</strong><div class="nw-difficulty-track"><i style="width:${v.played?(v.won/v.played*100):0}%"></i></div></div>`).join('')}</div><p class="nw-muted">${r.rows.length?'Based on recorded puzzles this week. Hints are included in activity but not counted as manual correct placements.':'No recorded puzzles in this week yet. Play a puzzle to start your report.'}</p>`;
  const battle=()=>{
    const history=nwBattlePracticeHistory(),byMonth={};
    for(const g of history){const key=new Date(g.at).toISOString().slice(0,7);const st=byMonth[key]||(byMonth[key]={wins:0,losses:0,draws:0});if(g.outcome==='WIN')st.wins++;else if(g.outcome==='LOSS')st.losses++;else st.draws++;}
    const months=Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0]));
    return `<div class="nw-report-head"><strong>${nwBattleMonthStats().rate}%</strong><span>Monthly Battle Win Rate · ${nwBattleMonthStats().wins} Wins / ${nwBattleMonthStats().losses} Losses / ${nwBattleMonthStats().draws} Draws</span></div><h3>MONTHLY TITLE FRAMES</h3><div class="nw-battle-title-list">${nwSeasonFrameTiers.map(t=>`<div class="${nwBattleMonthStats().wins>=t.wins?'earned':''}"><span>${t.wins} WINS</span><strong>${nwEscape(t.title)}</strong></div>`).join('')}</div><h3>PAST SEASONS</h3>${months.length?months.map(([key,st])=>`<p class="nw-battle-history-row"><strong>${key}</strong> · ${st.wins} wins · ${st.losses} losses · ${st.draws} draws</p>`).join(''):'<p class="nw-muted">Your Battle history will appear here.</p>'}`;
  };
  const icons={inventory:'<rect x="7" y="15" width="34" height="27" rx="3"/><path d="M14 15V9h20v6M19 26h10M24 21v10"/>',brain:'<path d="M24 39C10 43 5 30 12 23C5 12 19 7 24 14C29 7 43 12 36 23C43 30 38 43 24 39ZM24 14V39M12 23Q19 19 19 29M36 23Q29 19 29 29"/>',achievements:'<circle cx="24" cy="18" r="12"/><path d="M16 28L12 43L24 38L36 43L32 28M24 11L26 16L32 18L26 20L24 25L22 20L16 18L22 16Z"/>',battle:'<path d="M10 8L36 34M38 8L12 34M10 8L12 18M10 8L20 10M38 8L36 18M38 8L28 10M29 28L41 40M19 28L7 40M30 40L41 29M7 29L18 40"/>'};
  const items=[['brain','Weekly Reports','Your little brain diary'],['achievements','Achievements','Celebrate your milestones'],['battle','Battle Records','Your victories and defeats']];
  const label=items.find(x=>x[0]===tab)?.[1]||'Trophy Case';
  const title=`<div class="nw-trophy-heading"><i class="nw-wish-star a" aria-hidden="true">✦</i><i class="nw-wish-star b" aria-hidden="true">✧</i><h2>${label}</h2><div class="nw-trophy-doodle" aria-hidden="true">✧ ── ☆ ── ✧</div></div>`;
  const landing=`<div class="nw-trophy-intro"><strong>${nwEscape(p.name)}’s Trophy Case</strong></div><div class="nw-trophy-menu">${items.map(([id,name,desc])=>`<button type="button" data-trophy="${id}"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icons[id]}</svg><span><strong>${name}</strong><small>${desc}</small></span><b aria-hidden="true">›</b></button>`).join('')}</div>`;
  const report=`<div class="nw-week-nav"><button id="nwOlderWeek" aria-label="Previous week">‹</button><strong>WEEK OF ${weekTitle.toUpperCase()}</strong><button id="nwNewerWeek" aria-label="Next week" ${offset>=0?'disabled':''}>›</button></div>${brain()}`;
  const achievements=`<div class="nw-report-head"><strong>✦ Coming soon ✦</strong><span>Your permanent milestones will appear here.</span></div>`;
  evDisplay(`${evHeader('TROPHY CASE',tab==='home'?showCategories:()=>nwShowTrophy())}<section class="nw-new-panel nw-trophy-panel">${title}${tab==='brain'?report:tab==='battle'?battle():tab==='achievements'?achievements:landing}</section>`);
  evRoot.querySelectorAll('[data-trophy]').forEach(b=>b.onclick=async()=>{nwShowTrophy(b.dataset.trophy)});
  evRoot.querySelectorAll('[data-prize-use]').forEach(b=>b.onclick=()=>nwPrizeQuantityDialog(b.dataset.prizeUse));
  if(tab==='brain'){evRoot.querySelector('#nwOlderWeek').onclick=()=>nwShowTrophy('brain',offset-1);evRoot.querySelector('#nwNewerWeek').onclick=()=>nwShowTrophy('brain',offset+1)}
}

function nwScrollTarget(){
  // The game container is static in the mobile layout, so normal scrolling
  // happens on the document. Some embedded views instead scroll #game.
  const page=document.scrollingElement||document.documentElement;
  if(evRoot.scrollHeight>evRoot.clientHeight+2 &&
     getComputedStyle(evRoot).overflowY!=='visible')return evRoot;
  return page;
}
function nwSaveScroll(){
  if(!evRoot.querySelector('.world-grid.world-list'))return;
  const target=nwScrollTarget();
  nwScroll[roomCollection]={top:target.scrollTop||0};
  nwRoomPages[roomCollection]=roomPage;
}
function nwResetViewToTop(){
  evRoot.scrollTop=0;
  (document.scrollingElement||document.documentElement).scrollTop=0;
  window.scrollTo(0,0);
}
function nwRestoreScroll(){
  const saved=nwScroll[roomCollection];
  const y=(saved&&typeof saved==='object'?saved.top:saved)||0;
  const target=nwScrollTarget();
  // The DOM has been rebuilt; wait for layout before setting scrollTop.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    target.scrollTop=Math.max(0,Math.min(y,target.scrollHeight-target.clientHeight));
  }));
}

// Battle practice is an offline head-to-head test against human-completed recorded runs.
// It is NOT online matchmaking, not a live opponent, and awards no event rewards.
const nwBattlePracticeRuns = [{"recording_id":"01f9a98a-e134-4140-aff4-0a84c5efd85a","difficulty":"easy","elapsed_seconds":104,"points":420,"mistakes":1,"puzzle_clues":"740018020900640813803509006370100002580290004090473001050964137107052460469030058","solved_grid":"746318925925647813813529746374185692581296374692473581258964137137852469469731258","profile_id":0},{"recording_id":"b92f82e6-4e30-47a6-b7a1-64299ea9243b","difficulty":"easy","elapsed_seconds":88,"points":380,"mistakes":2,"puzzle_clues":"090001020750498600630752409265070000043065097870140056927004000084016972010927308","solved_grid":"498631725752498613631752489265879134143265897879143256927384561384516972516927348","profile_id":0},{"recording_id":"d7ca0750-ec0a-47a6-9f8d-116b6972f7f7","difficulty":"easy","elapsed_seconds":88,"points":450,"mistakes":0,"puzzle_clues":"210976345543180706697005812000000060861597423024608950106300084002701000000020071","solved_grid":"218976345543182796697435812759243168861597423324618957176359284482761539935824671","profile_id":0},{"recording_id":"44edd032-a709-4878-91a3-185562885627","difficulty":"medium","elapsed_seconds":100,"points":750,"mistakes":0,"puzzle_clues":"009072300108090000257300069402800930581900742300000050715038200063009000924050600","solved_grid":"649572318138496527257381469472815936581963742396724851715638294863249175924157683","profile_id":0},{"recording_id":"bbf41a63-8f6a-4063-81de-41378dc8fb2d","difficulty":"medium","elapsed_seconds":150,"points":720,"mistakes":1,"puzzle_clues":"007042001092318765030007090010500600803476002040100008024000573981735006070060000","solved_grid":"567942831492318765138657294219583647853476912746129358624891573981735426375264189","profile_id":0},{"recording_id":"3696582c-6f22-4a61-a701-4137eeb1585b","difficulty":"hard","elapsed_seconds":108,"points":1030,"mistakes":2,"puzzle_clues":"000041070500900481080700002710605000905000000000074060640500100050318640008007259","solved_grid":"392841576576932481481756392714695823965283714823174965647529138259318647138467259","profile_id":0},{"recording_id":"7d556444-8f6f-49dd-b0de-128020be3102","difficulty":"expert","elapsed_seconds":144,"points":1380,"mistakes":2,"puzzle_clues":"016700900730090062000016057902000000084062000100380020043800000070500008000071005","solved_grid":"216735984735498162498216357962157843384962571157384629543829716671543298829671435","profile_id":0},{"recording_id":"8e999cc9-919a-498f-9b03-adfafd61120a","difficulty":"extreme","elapsed_seconds":155,"points":1820,"mistakes":1,"puzzle_clues":"004700098500000000700009014000070085000108043100204900000400600602007000050020079","solved_grid":"314762598598341726726589314243976185967158243185234967879415632632897451451623879","profile_id":0},{"recording_id":"02e16032-757b-4f10-ac81-ab1c660d34f4","difficulty":"easy","elapsed_seconds":72,"points":450,"mistakes":0,"puzzle_clues":"754060018692030754300074692401000839005380071009041065986410507000007900527090103","solved_grid":"754962318692138754318574692471625839265389471839741265986413527143257986527896143","profile_id":1},{"recording_id":"4b5994b7-12f3-45c8-b46e-76333dcaa850","difficulty":"medium","elapsed_seconds":111,"points":750,"mistakes":0,"puzzle_clues":"480065070372001506090730004950200318010004000000100459030000002540629730069307040","solved_grid":"481965273372841596695732184954276318813594627726183459137458962548629731269317845","profile_id":1},{"recording_id":"8580cf0b-651e-44fe-ad1f-9fca466336ee","difficulty":"medium","elapsed_seconds":86,"points":750,"mistakes":0,"puzzle_clues":"000950008203100009094003000001230700300670410068001092140090020905782060870016953","solved_grid":"617954238283167549594823671451239786329678415768541392146395827935782164872416953","profile_id":1},{"recording_id":"c43954c7-1a00-4622-8f67-7ed12fd673fa","difficulty":"medium","elapsed_seconds":118,"points":750,"mistakes":0,"puzzle_clues":"041000020206004758500209430400706002760900043912430075007000004030805267850000009","solved_grid":"341587926296314758578269431483756192765921843912438675627193584139845267854672319","profile_id":1},{"recording_id":"38401553-bad7-4418-b4c5-079465aa2bc7","difficulty":"hard","elapsed_seconds":126,"points":1030,"mistakes":2,"puzzle_clues":"000900700160307000000824096500002000294000008001000049010070054045019067306040901","solved_grid":"428961735169357482753824196587492613294136578631785249912673854845219367376548921","profile_id":1},{"recording_id":"e81454ce-a792-4b55-a342-6ceb23770390","difficulty":"hard","elapsed_seconds":161,"points":1070,"mistakes":1,"puzzle_clues":"080000000076008900005407328820100096069800030000000840038019070600074580000003609","solved_grid":"382951467476328951915467328824135796769842135153796842538619274691274583247583619","profile_id":1},{"recording_id":"0f788f60-5fcd-468c-a2a4-779926c9ba97","difficulty":"expert","elapsed_seconds":180,"points":1380,"mistakes":2,"puzzle_clues":"004030600050009200700214030080000000601023907500001020800000002016302000430700096","solved_grid":"124538679358679214769214538283957461641823957597461823875196342916342785432785196","profile_id":1},{"recording_id":"eadb3148-ef6e-4548-9696-ba89734183d2","difficulty":"expert","elapsed_seconds":172,"points":1380,"mistakes":2,"puzzle_clues":"070090001050201080000006500000370000830150000900604078000410800000937415000800907","solved_grid":"678593241359241786124786593462378159837159624915624378793415862286937415541862937","profile_id":1},{"recording_id":"90d57b76-6560-40bb-8a01-a2182437b5f4","difficulty":"extreme","elapsed_seconds":182,"points":1780,"mistakes":2,"puzzle_clues":"031000000069023050000980100700064000045800000398000000020005018000300002000042690","solved_grid":"231457986869123457574986123712564839645839271398271564427695318956318742183742695","profile_id":1},{"recording_id":"07425f87-aa5a-4348-b429-0e0db2f24ce5","difficulty":"easy","elapsed_seconds":83,"points":450,"mistakes":0,"puzzle_clues":"109070354053901802208054901084030090000085000031207485040719508910528043005603710","solved_grid":"169872354453961872278354961584136297792485136631297485346719528917528643825643719","profile_id":2},{"recording_id":"837610c9-35ca-4a1d-ade8-328c1e2fe99d","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"000207910961458732720019850000740109090800340374921508000102090050384001207596003","solved_grid":"845237916961458732723619854586743129192865347374921568438172695659384271217596483","profile_id":2},{"recording_id":"8dd92ec7-eca7-4dd6-b155-55ded09fe450","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"080209500200357041050481609700130498940006005105008270013694052072010060094572083","solved_grid":"481269537269357841357481629726135498948726315135948276813694752572813964694572183","profile_id":2},{"recording_id":"c01a4d29-2d2f-4cc2-8a52-fceff3336af2","difficulty":"easy","elapsed_seconds":76,"points":450,"mistakes":0,"puzzle_clues":"759026041081005620003148579000000296000690430900804715592003087030701002810209364","solved_grid":"759326841481975623263148579348517296175692438926834715592463187634781952817259364","profile_id":2},{"recording_id":"4d0527a2-7a1c-478f-af55-8bbb1fdbedd6","difficulty":"medium","elapsed_seconds":162,"points":750,"mistakes":0,"puzzle_clues":"007530800004907000301204690006793000970008246000026900735812060100000730460305002","solved_grid":"697531824824967351351284697246793518973158246518426973735812469182649735469375182","profile_id":2},{"recording_id":"385d79e3-62ab-426b-9d57-40709c5d5943","difficulty":"hard","elapsed_seconds":149,"points":1030,"mistakes":2,"puzzle_clues":"000089003096000050304002000048025679000700081907004532080153706670000300000000090","solved_grid":"725689143896431257314572968148325679253796481967814532489153726672948315531267894","profile_id":2},{"recording_id":"141f3ebd-b389-4e6a-88e6-7b9304cfa58e","difficulty":"expert","elapsed_seconds":227,"points":1380,"mistakes":2,"puzzle_clues":"010002530038640000709003600003017000900836000000900060006179080100258006200000000","solved_grid":"614792538538641729729583614863417952952836471471925863346179285197258346285364197","profile_id":2},{"recording_id":"9ce18d20-cd90-4293-90fa-17279dbd4832","difficulty":"extreme","elapsed_seconds":216,"points":1780,"mistakes":2,"puzzle_clues":"009007020100090507000006300000801263800003000006940870021600008000000010400000039","solved_grid":"349587126162394587578126394954871263817263945236945871721639458693458712485712639","profile_id":2},{"recording_id":"0789bbc1-a25c-447a-b8c5-6f65552fcb5a","difficulty":"easy","elapsed_seconds":75,"points":450,"mistakes":0,"puzzle_clues":"230900467407235010918007235546800090820090540091006003054180679080009300079054180","solved_grid":"235918467467235918918467235546823791823791546791546823354182679182679354679354182","profile_id":3},{"recording_id":"57c18d2e-1af6-4963-9cb0-387a69a5f49c","difficulty":"medium","elapsed_seconds":74,"points":750,"mistakes":0,"puzzle_clues":"002041009390085160040090008420069000000570012875024900004900083730400001009837240","solved_grid":"582641379397285164146793528421369857963578412875124936254916783738452691619837245","profile_id":3},{"recording_id":"9d03c443-03dd-4736-a92e-33146eaf858f","difficulty":"medium","elapsed_seconds":128,"points":750,"mistakes":0,"puzzle_clues":"032076009000030001070900402967002043140760050058301007006000014000608320320407896","solved_grid":"432176589589234671671985432967852143143769258258341967896523714714698325325417896","profile_id":3},{"recording_id":"3e3de936-2211-492e-8e29-d0bac327c5a4","difficulty":"hard","elapsed_seconds":159,"points":1030,"mistakes":2,"puzzle_clues":"370009001405080900902104000003006140104500000000201035547060010200000860806900500","solved_grid":"378629451415783926962154387753896142124537698689241735547368219291475863836912574","profile_id":3},{"recording_id":"85824ae6-17f6-4f17-b32d-b856318e5505","difficulty":"hard","elapsed_seconds":122,"points":1070,"mistakes":1,"puzzle_clues":"000400835000853060038200097000601000806007304009000018300002500905138020020504000","solved_grid":"162479835794853261538216497453681972816927354279345618381762549945138726627594183","profile_id":3},{"recording_id":"b4ea476b-9e4d-4ef7-88bc-63cc16c06efc","difficulty":"hard","elapsed_seconds":160,"points":1030,"mistakes":2,"puzzle_clues":"007040008050000462060008091000800014410000907789060003042080000000025809038006240","solved_grid":"197642358853971462264538791325897614416253987789164523542389176671425839938716245","profile_id":3},{"recording_id":"1464aedb-4c6b-45d0-8af6-8a7936e68cd6","difficulty":"expert","elapsed_seconds":205,"points":1380,"mistakes":2,"puzzle_clues":"040010387150080000000204506600000824084569000700020060008950630001000050020000000","solved_grid":"942615387156783492837294516695371824284569173713428965478952631361847259529136748","profile_id":3},{"recording_id":"ce2fd642-3b1c-4e14-ab6b-3c6fbda5d78d","difficulty":"expert","elapsed_seconds":134,"points":1380,"mistakes":2,"puzzle_clues":"001004900000000062040509800962000174010006000030401020029100046000640200000300501","solved_grid":"781264935593718462246539817962853174417926358835471629329185746158647293674392581","profile_id":3},{"recording_id":"a1578189-767d-4f88-94fd-2fbaee196a26","difficulty":"extreme","elapsed_seconds":173,"points":1780,"mistakes":2,"puzzle_clues":"600400900010907030009503002080090025007002080000140700000000243000000001340800050","solved_grid":"635421978214987536879563412481796325967352184523148769198675243756234891342819657","profile_id":3},{"recording_id":"d45aa53f-4b65-4329-a74c-91d414c7a8c6","difficulty":"extreme","elapsed_seconds":137,"points":1780,"mistakes":2,"puzzle_clues":"000000004405872001000506200000051008000080720006000005007060040084790500051000009","solved_grid":"728319654465872931193546287372951468519684723846237195937165842284793516651428379","profile_id":3},{"recording_id":"fac147d8-6c6c-4c4a-97f4-e885d67b0c55","difficulty":"extreme","elapsed_seconds":155,"points":1780,"mistakes":2,"puzzle_clues":"000000000230018070001500203000400090308006500610000300406000000023060159190007000","solved_grid":"957342816234618975861579243572483691348196527619725384486951732723864159195237468","profile_id":3},{"recording_id":"098cc81c-b19f-4477-bd20-93e3cbbbeb68","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"816540920290861054500200100601400509709010043480790260000950712940107608172380000","solved_grid":"816543927297861354534279186621438579759612843483795261368954712945127638172386495","profile_id":4},{"recording_id":"e778c222-d1c9-4a65-bd86-55374d6f792d","difficulty":"easy","elapsed_seconds":63,"points":420,"mistakes":1,"puzzle_clues":"701008203329147658805023407000071800084030700102405309457806030203054080690002570","solved_grid":"741568293329147658865923417936271845584639721172485369457896132213754986698312574","profile_id":4},{"recording_id":"58499d2a-ef3d-41f0-a6f6-8cff76c23b72","difficulty":"medium","elapsed_seconds":78,"points":750,"mistakes":0,"puzzle_clues":"028960007950107400100002065589006240700203508004000706007301854000804070800009320","solved_grid":"428965137956137482173482965589716243761243598234598716697321854312854679845679321","profile_id":4},{"recording_id":"8e467978-1e6e-4650-901e-286a2dfe5ac3","difficulty":"medium","elapsed_seconds":113,"points":750,"mistakes":0,"puzzle_clues":"327980050009045000056030800730000600601073082002004735070020100290800574008457090","solved_grid":"327981456819645327456732819735298641641573982982164735574329168293816574168457293","profile_id":4},{"recording_id":"44d7dc1e-6b01-499a-bb65-2a0df366f20f","difficulty":"hard","elapsed_seconds":123,"points":1100,"mistakes":0,"puzzle_clues":"064320718090000000000500932003900400740600800000750200009805046006091500000463100","solved_grid":"564329718392187654178546932623918475745632891981754263219875346436291587857463129","profile_id":4},{"recording_id":"ecd7a87a-f378-48f7-9320-b0e869ea8eb5","difficulty":"hard","elapsed_seconds":109,"points":1070,"mistakes":1,"puzzle_clues":"000390240280010900003428156400609070027000009500030000000005090001963000600074805","solved_grid":"165397248284516937973428156418659372327841569596732481742185693851963724639274815","profile_id":4},{"recording_id":"15b797f6-022f-470b-ac20-977d16e95414","difficulty":"expert","elapsed_seconds":149,"points":1450,"mistakes":0,"puzzle_clues":"019000080020090504500680301060803005801905700900020800000050007000238000100400030","solved_grid":"319574682628391574547682391762813945831945726954726813283159467476238159195467238","profile_id":4},{"recording_id":"a187993a-a311-4c73-9f86-53a1172da5c6","difficulty":"extreme","elapsed_seconds":174,"points":1780,"mistakes":2,"puzzle_clues":"060009008097500006500026470706000000000285003000003000810050030070001050600900040","solved_grid":"362479518497518326581326479736194285149285763258763194814652937973841652625937841","profile_id":4},{"recording_id":"09b11ec2-5e19-4977-87fb-c105a086a71d","difficulty":"easy","elapsed_seconds":81,"points":450,"mistakes":0,"puzzle_clues":"601340075807200943930078610400037106083651020000020030006093081018002397309185260","solved_grid":"621349875857216943934578612492837156783651429165924738246793581518462397379185264","profile_id":5},{"recording_id":"5b3658e0-7f97-4f47-bfb4-72d5aba156a7","difficulty":"medium","elapsed_seconds":115,"points":750,"mistakes":0,"puzzle_clues":"580000070003000085106985040004710803050020010017003426890004007035267100760108030","solved_grid":"589342671243671985176985342624719853358426719917853426891534267435267198762198534","profile_id":5},{"recording_id":"c87d0bde-2f08-486f-984c-bf0a386f6b93","difficulty":"medium","elapsed_seconds":91,"points":750,"mistakes":0,"puzzle_clues":"104000579000790001050413608706501832405000000203670100600950003009032006301860400","solved_grid":"134286579862795341957413628796541832415328967283679154678954213549132786321867495","profile_id":5},{"recording_id":"4d627a60-74e8-4349-bb31-94b65d03346c","difficulty":"hard","elapsed_seconds":138,"points":1070,"mistakes":1,"puzzle_clues":"900007030065100000013409007080005700006000042300840000620071384430206501000300090","solved_grid":"942657138765138429813429657284965713596713842371842965629571384438296571157384296","profile_id":5},{"recording_id":"9d1c9980-199d-47b0-8316-797c1fe9b49c","difficulty":"hard","elapsed_seconds":111,"points":1070,"mistakes":1,"puzzle_clues":"000006300604702010207090040910000080000073169308000400000324807023900600080500204","solved_grid":"891456372654732918237198546916245783542873169378619425165324897423987651789561234","profile_id":5},{"recording_id":"f9e4facf-3d0b-47e0-8e9c-9f5a17645e46","difficulty":"hard","elapsed_seconds":111,"points":1030,"mistakes":2,"puzzle_clues":"010000593408005010003002000301006000049510000000408051980000764064800100102600905","solved_grid":"216784593478935216593162478351276849849513627627498351985321764764859132132647985","profile_id":5},{"recording_id":"190e51da-fc9b-48e7-9f53-f6926f4989f5","difficulty":"expert","elapsed_seconds":146,"points":1380,"mistakes":2,"puzzle_clues":"000003000040958020050207003060090085403000670028700000001409702004000300275100000","solved_grid":"712643598346958127859217463167394285493825671528761934631489752984572316275136849","profile_id":5},{"recording_id":"b4f0f26d-9cd7-450d-bd6c-1edb75d9127a","difficulty":"expert","elapsed_seconds":152,"points":1380,"mistakes":2,"puzzle_clues":"000902000004063120910504008000000200000005087730000451080006500201007900300250004","solved_grid":"863912745574863129912574638145738296629145387738629451487396512251487963396251874","profile_id":5},{"recording_id":"a60b1987-ee5d-4559-8082-f0218196b31e","difficulty":"extreme","elapsed_seconds":225,"points":1780,"mistakes":2,"puzzle_clues":"001006004000805003040002060005090000780014000002087540024000080007400006960700000","solved_grid":"231976854679845123548132967415293678786514239392687541124369785857421396963758412","profile_id":5},{"recording_id":"ba1e87fd-6fa6-4570-8707-d609308e9315","difficulty":"extreme","elapsed_seconds":180,"points":1780,"mistakes":2,"puzzle_clues":"000001900807020000000890056100700000000000620089000047008410709073050100410000080","solved_grid":"625341978897625413341897256162734895734589621589162347258416739973258164416973582","profile_id":5},{"recording_id":"e89b241f-fd23-4c19-a016-3757f62ec861","difficulty":"extreme","elapsed_seconds":152,"points":1780,"mistakes":2,"puzzle_clues":"020100050000000402900060030100570000050602103009000000071086004000403000302700680","solved_grid":"426137958713859462985264731134578296857692143269341875571986324698423517342715689","profile_id":5},{"recording_id":"101d28ef-f5b7-4732-88f6-51ccb1970e09","difficulty":"easy","elapsed_seconds":98,"points":420,"mistakes":1,"puzzle_clues":"014382507097416200203790604076001000035670102002508076359107028061004009420903001","solved_grid":"614382597597416283283795614976241835835679142142538976359167428761824359428953761","profile_id":6},{"recording_id":"9ea46758-8890-4d51-9012-79e31a1821b6","difficulty":"easy","elapsed_seconds":73,"points":450,"mistakes":0,"puzzle_clues":"004837026000104387007256914620410875000620103410705000572961438000340052040072000","solved_grid":"194837526256194387837256914629413875785629143413785269572961438961348752348572691","profile_id":6},{"recording_id":"ba5d03b2-7889-420c-b468-539c59e20040","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"390640507084527000500300608130400285409085173200073490820051004040862001705030862","solved_grid":"391648527684527319572319648137496285469285173258173496826751934943862751715934862","profile_id":6},{"recording_id":"dd3aa7f9-9670-46e9-a412-cf5fffa50738","difficulty":"easy","elapsed_seconds":65,"points":380,"mistakes":2,"puzzle_clues":"580009000094231085312658497471800900238905000000147802825700000040500769060314520","solved_grid":"586479213794231685312658497471823956238965174659147832825796341143582769967314528","profile_id":6},{"recording_id":"6294ea84-293a-4319-99d0-aee08cf4564f","difficulty":"medium","elapsed_seconds":182,"points":750,"mistakes":0,"puzzle_clues":"601087920703000400295000873407200506002050107900704302070000604320465000004800039","solved_grid":"641387925783592461295146873417238596832659147956714382178923654329465718564871239","profile_id":6},{"recording_id":"4e417a63-f74c-4509-827c-9dd03009e1f4","difficulty":"hard","elapsed_seconds":177,"points":1030,"mistakes":2,"puzzle_clues":"000100070500003018814700300301500009000000000050092083700308041230015007045006830","solved_grid":"623184975579263418814759326381547269962831754457692183796328541238415697145976832","profile_id":6},{"recording_id":"1d080036-ac60-463b-8663-c280208beaef","difficulty":"expert","elapsed_seconds":223,"points":1380,"mistakes":2,"puzzle_clues":"500904010000600038760053200005160870800490001002080000000009307020000085000048100","solved_grid":"583924716294671538761853249945162873837495621612387954458219367129736485376548192","profile_id":6},{"recording_id":"ad94d600-8f65-4c02-a336-cdc0b179bbbc","difficulty":"extreme","elapsed_seconds":152,"points":1850,"mistakes":0,"puzzle_clues":"700301000810064000609070000570000001300106054001400000030010506000020000108600300","solved_grid":"725381469813964275649572183574238691382196754961457832237819546456723918198645327","profile_id":6},{"recording_id":"1410c422-eb9a-46fd-9044-99d0ba433241","difficulty":"easy","elapsed_seconds":69,"points":420,"mistakes":1,"puzzle_clues":"908601004030980017610040058140398076506124389300567142093056720065012000000430000","solved_grid":"958671234234985617617243958142398576576124389389567142493856721865712493721439865","profile_id":7},{"recording_id":"0138d529-c972-4858-bfd7-df1307096160","difficulty":"medium","elapsed_seconds":146,"points":750,"mistakes":0,"puzzle_clues":"850003420673900008042851036267090003300060940004000072700400090010708000420019307","solved_grid":"851673429673942518942851736267194853385267941194385672738426195519738264426519387","profile_id":7},{"recording_id":"6841a26e-e036-4b52-a0b8-2e60cf9ef2d1","difficulty":"medium","elapsed_seconds":102,"points":750,"mistakes":0,"puzzle_clues":"000300486900600051008052903600000040059043608000006095740018530021905064500007812","solved_grid":"215379486937684251468152973682591347159743628374826195746218539821935764593467812","profile_id":7},{"recording_id":"a19b2274-8094-4b85-8e59-caeac3dbd1b7","difficulty":"medium","elapsed_seconds":106,"points":750,"mistakes":0,"puzzle_clues":"984050360750030049030009017510063400069000000800215000003890700470320900608074201","solved_grid":"984157362751632849236489517512963478369748125847215693123896754475321986698574231","profile_id":7},{"recording_id":"4ff2ef59-93fc-40c8-9ab6-f67b7cc96c4c","difficulty":"hard","elapsed_seconds":100,"points":1100,"mistakes":0,"puzzle_clues":"000380150400000690000620008700902000019000070064030020007051809608700005002896704","solved_grid":"926384157483175692571629348735912486219468573864537921347251869698743215152896734","profile_id":7},{"recording_id":"eed28f7b-a56c-4f96-a37f-abc5dc10aa17","difficulty":"hard","elapsed_seconds":144,"points":1100,"mistakes":0,"puzzle_clues":"904008207020600000030217004050000000093002146006083000070400020000825700200761409","solved_grid":"964358217127694358538217694752146983893572146416983572671439825349825761285761439","profile_id":7},{"recording_id":"21dfb2ba-a665-4b33-b78e-3a4eb19a582a","difficulty":"expert","elapsed_seconds":97,"points":1450,"mistakes":0,"puzzle_clues":"026093007000014500040650930060000300005900400070046005600089003892070000010000002","solved_grid":"526893147938714526147652938461528379285937461379146285654289713892371654713465892","profile_id":7},{"recording_id":"af8b8531-d0ef-4941-be69-854696ac1def","difficulty":"extreme","elapsed_seconds":203,"points":1780,"mistakes":2,"puzzle_clues":"800010009712950000000040700060700090007001500000805027201080070000002005000076030","solved_grid":"846217359712953846359648712568724193427391568193865427231589674674132985985476231","profile_id":7},{"recording_id":"eb045746-803a-44ae-b773-b9103fd8a3e6","difficulty":"extreme","elapsed_seconds":172,"points":1780,"mistakes":2,"puzzle_clues":"800000004007920000001003900030580400000209008100460090500010327003090040006002000","solved_grid":"829156734347928165651743982932581476764239518185467293598614327273895641416372859","profile_id":7},{"recording_id":"1d84aaae-7871-4b21-add1-9d84e96834dd","difficulty":"easy","elapsed_seconds":61,"points":420,"mistakes":1,"puzzle_clues":"350000060798260010046315700500008476903470021467521038835697042104000007670002800","solved_grid":"351789264798264315246315789512938476983476521467521938835697142124853697679142853","profile_id":8},{"recording_id":"0bbc445d-d113-47ba-bb6e-87590bb5fa49","difficulty":"medium","elapsed_seconds":102,"points":720,"mistakes":1,"puzzle_clues":"060280053100000679005760001008000100000612085210835040850370096029158030000020018","solved_grid":"967281453182543679345769821538497162794612385216835947851374296629158734473926518","profile_id":8},{"recording_id":"a4793f9d-7628-4493-9869-dbe5ae988ab3","difficulty":"medium","elapsed_seconds":109,"points":750,"mistakes":0,"puzzle_clues":"004200509500004702006950008618702490409108027070500001000397850005021900000405016","solved_grid":"184276539593814762726953148618732495459168327372549681261397854845621973937485216","profile_id":8},{"recording_id":"50aa8f80-96af-4c11-8172-a217c433132c","difficulty":"hard","elapsed_seconds":133,"points":1030,"mistakes":2,"puzzle_clues":"008400900690825004130700058009008003460050180000000509001070800005140030370009400","solved_grid":"528431967697825314134796258759218643463957182812364579241673895985142736376589421","profile_id":8},{"recording_id":"957c57a9-d427-488c-b02e-dcb13fa8e4d7","difficulty":"hard","elapsed_seconds":105,"points":1030,"mistakes":2,"puzzle_clues":"600705302907200860032008500203809100400000020705020900006900050079150000500004080","solved_grid":"684795312957213864132468597263849175498571623715326948346987251879152436521634789","profile_id":8},{"recording_id":"fca4194b-0f73-47cd-bf81-2e129327939a","difficulty":"hard","elapsed_seconds":144,"points":1070,"mistakes":1,"puzzle_clues":"037802490090007080582006000000004000804790305071235004010070040050000009208000703","solved_grid":"137852496496317582582946137325684971864791325971235864619573248753428619248169753","profile_id":8},{"recording_id":"27cabdf5-a5f3-4c71-9be0-49c845ac9b6d","difficulty":"expert","elapsed_seconds":154,"points":1380,"mistakes":2,"puzzle_clues":"360005700000020104010009002097004000800900300000018007009401070780200013140050200","solved_grid":"362145798978623154514789632297364581851972346436518927629431875785296413143857269","profile_id":8},{"recording_id":"c98009c6-e7a8-417c-b650-4b8bccce375a","difficulty":"expert","elapsed_seconds":263,"points":1380,"mistakes":2,"puzzle_clues":"000001500100000820350200091915004060076019000400000100000305070840020900590008010","solved_grid":"782961543169453827354287691915834762276519384438672159621395478847126935593748216","profile_id":8},{"recording_id":"023b43c2-bac2-4189-91ed-c12f96642b7d","difficulty":"extreme","elapsed_seconds":145,"points":1780,"mistakes":2,"puzzle_clues":"100725300006000200200039040000000620005983010000560009070290000000000570003000960","solved_grid":"148725396396814257257639148839471625625983714714562839571296483962348571483157962","profile_id":8},{"recording_id":"c2e42e78-4433-4b19-b586-62b931b938c0","difficulty":"extreme","elapsed_seconds":189,"points":1820,"mistakes":1,"puzzle_clues":"003709000206030000071500000125800003000200406000900500560000000700080930400000865","solved_grid":"843719652256438179971562348125846793397251486684973521568394217712685934439127865","profile_id":8},{"recording_id":"f42daf75-0209-436d-bf11-a2708e86f412","difficulty":"extreme","elapsed_seconds":210,"points":1820,"mistakes":1,"puzzle_clues":"009000046460000203030006080701000020040008090003604000000007019600000432100400800","solved_grid":"819253746467981253532746981781395624246178395953624178324867519678519432195432867","profile_id":8},{"recording_id":"413d4f4b-8ec2-4bf8-8796-4443f901903c","difficulty":"easy","elapsed_seconds":60,"points":420,"mistakes":1,"puzzle_clues":"720065083890072001051009274009030640460900700000540810518790426246851090030024058","solved_grid":"724165983893472561651389274189237645465918732372546819518793426246851397937624158","profile_id":9},{"recording_id":"d43ae3d1-fdb2-4257-9b4f-084df38d03d7","difficulty":"easy","elapsed_seconds":62,"points":420,"mistakes":1,"puzzle_clues":"532060948070080000000203106095030807326071590708549603260410359084390002003720401","solved_grid":"532167948671984235849253176495632817326871594718549623267418359184395762953726481","profile_id":9},{"recording_id":"f433b170-370e-4fe5-8831-4425e24ac5d5","difficulty":"easy","elapsed_seconds":55,"points":450,"mistakes":0,"puzzle_clues":"407015300605000240908027000703502680542800903861093452209154000150300720086209014","solved_grid":"427615398615938247938427165793542681542861973861793452279154836154386729386279514","profile_id":9},{"recording_id":"0bd730b2-88f5-46f0-ab58-88374593eb78","difficulty":"medium","elapsed_seconds":99,"points":720,"mistakes":1,"puzzle_clues":"010820060002600179000790402080006053004000091500918620097180540100060907050370208","solved_grid":"719824365842653179635791482981246753264537891573918624397182546128465937456379218","profile_id":9},{"recording_id":"6e582764-7b03-46d7-b64d-9b63a1297d1a","difficulty":"hard","elapsed_seconds":97,"points":1070,"mistakes":1,"puzzle_clues":"000000000000004039005712406416059000207006000009327001050200090008573060600490370","solved_grid":"864935217172684539395712486416859723237146958589327641753261894948573162621498375","profile_id":9},{"recording_id":"cd40fd63-f6f6-486b-814c-8b75468faa04","difficulty":"hard","elapsed_seconds":137,"points":1070,"mistakes":1,"puzzle_clues":"052003760000245900000760205003100000700028100061004020006000002004852039008630400","solved_grid":"452983761617245983839761245283196574745328196961574328396417852174852639528639417","profile_id":9},{"recording_id":"2fe2ca63-f37b-42f7-bccd-503ac215fa01","difficulty":"expert","elapsed_seconds":188,"points":1380,"mistakes":2,"puzzle_clues":"807163040009270000006095007030000000780040052950007004060000103098001065000000200","solved_grid":"827163549549278316316495827634529781781346952952817634465982173298731465173654298","profile_id":9},{"recording_id":"05ed0952-b5c7-4861-a313-7705269769a3","difficulty":"extreme","elapsed_seconds":156,"points":1820,"mistakes":1,"puzzle_clues":"000305409070004020000028503007406090430800000002000034001050040000000007240001300","solved_grid":"128375469375964821964128573517436298436892715892517634781653942653249187249781356","profile_id":9},{"recording_id":"489708f4-e3c6-471b-bf01-7dcbde99102e","difficulty":"easy","elapsed_seconds":63,"points":450,"mistakes":0,"puzzle_clues":"940052367370408021000030084063079000405003098780245036201907840000504210050321679","solved_grid":"948152367376498521512736984163879452425613798789245136231967845697584213854321679","profile_id":10},{"recording_id":"14dfda65-71ac-4f5e-8647-1a5ccc9eb95e","difficulty":"medium","elapsed_seconds":101,"points":680,"mistakes":2,"puzzle_clues":"008903061000402309000167280074290003020310800601748500980031070060829030100000900","solved_grid":"248953761716482359395167284874295613529316847631748592982531476467829135153674928","profile_id":10},{"recording_id":"9956ad75-4034-47fd-af8e-5036634130c0","difficulty":"medium","elapsed_seconds":90,"points":680,"mistakes":2,"puzzle_clues":"057210468800079000321600050603405000000002310279130040436807001780021000000064080","solved_grid":"957213468864579123321648759613485972548792316279136845436857291785921634192364587","profile_id":10},{"recording_id":"fea99685-ad93-48b4-adc1-ae4c44795ccd","difficulty":"medium","elapsed_seconds":135,"points":750,"mistakes":0,"puzzle_clues":"000930580000000903029070001240080106600000098897065342930607200012803005500241800","solved_grid":"164932587785416923329578461243789156651324798897165342938657214412893675576241839","profile_id":10},{"recording_id":"79781cbc-19d2-454c-83e1-5151438b91ae","difficulty":"hard","elapsed_seconds":116,"points":1030,"mistakes":2,"puzzle_clues":"000000090001000408250048017080000049920380001070029830002090603067210004008003100","solved_grid":"846137592731952468259648317683571249924386751175429836512894673367215984498763125","profile_id":10},{"recording_id":"f0ba92c8-c9e8-41bf-bfbb-6dd7420679e2","difficulty":"hard","elapsed_seconds":197,"points":1030,"mistakes":2,"puzzle_clues":"500060200032000687006020090009004070008706902673192804007000000000200708925000060","solved_grid":"594867231132945687786321495219584376458736912673192854847613529361259748925478163","profile_id":10},{"recording_id":"3f77efc5-ba2e-4144-9131-2367a51d1ec0","difficulty":"expert","elapsed_seconds":105,"points":1420,"mistakes":1,"puzzle_clues":"005896300090700020000005906060940002000000018352100007000081069580670000000003050","solved_grid":"215896374896734125734215986168947532947352618352168497423581769581679243679423851","profile_id":10},{"recording_id":"d540350f-2bbb-4b3b-802a-7f3f9c584c40","difficulty":"expert","elapsed_seconds":147,"points":1450,"mistakes":0,"puzzle_clues":"740000065000002000502003010080056002004001650006200103038190000100007030607430000","solved_grid":"743819265819562347562743918381956472274381659956274183438195726195627834627438591","profile_id":10},{"recording_id":"176e547f-f80a-40a6-afa0-3fe26e41785b","difficulty":"extreme","elapsed_seconds":193,"points":1780,"mistakes":2,"puzzle_clues":"046789100010040090007000050020960000860000040003020080008000024000050971000002500","solved_grid":"546789132312645897987213456425968713869371245173524689658197324234856971791432568","profile_id":10},{"recording_id":"ec7c1e3e-c22e-4b20-a703-c6cfdab84c8a","difficulty":"extreme","elapsed_seconds":245,"points":1780,"mistakes":2,"puzzle_clues":"000698700507400000009070042800003029006050000030060080000714036000000000362000100","solved_grid":"423698751517432968689571342875143629296857413134269587958714236741326895362985174","profile_id":10},{"recording_id":"49922c92-6ec8-479e-8866-904f35b471e0","difficulty":"easy","elapsed_seconds":78,"points":380,"mistakes":2,"puzzle_clues":"619248357005910408000537100501069830200175600900382710000000501007051084056894270","solved_grid":"619248357735916428842537196571469832283175649964382715498723561327651984156894273","profile_id":11},{"recording_id":"c3878934-39df-43bd-8e91-7f156bf350ae","difficulty":"easy","elapsed_seconds":75,"points":420,"mistakes":1,"puzzle_clues":"419200005750149000020073001040802650082700010075030900198627540534918206060354089","solved_grid":"419286735753149862826573491341892657982765314675431928198627543534918276267354189","profile_id":11},{"recording_id":"db2216f3-e648-47b6-976c-943e18594f6f","difficulty":"easy","elapsed_seconds":78,"points":450,"mistakes":0,"puzzle_clues":"000140009059300814804097000925836471470259080083714925008970062100025040560003100","solved_grid":"236148759759362814814597236925836471471259683683714925348971562197625348562483197","profile_id":11},{"recording_id":"1c1da38d-90f1-4e11-8a25-9676ba935e7e","difficulty":"medium","elapsed_seconds":202,"points":720,"mistakes":1,"puzzle_clues":"689300000710906300203407968020070036300500197071063002030000080807035200042008003","solved_grid":"689352471714986325253417968425179836368524197971863542536241789897635214142798653","profile_id":11},{"recording_id":"ca614677-e737-4dc0-b826-c5c322ca83b8","difficulty":"medium","elapsed_seconds":112,"points":750,"mistakes":0,"puzzle_clues":"028300005379500801564108970000006239930057010000030054000000002605290340201740080","solved_grid":"128379465379564821564128973457816239932457618816932754743685192685291347291743586","profile_id":11},{"recording_id":"7d61bef7-65b4-4be0-bcf6-7a3dbc248623","difficulty":"hard","elapsed_seconds":228,"points":1100,"mistakes":0,"puzzle_clues":"160300508020406097000000001400600000580200603300008214008000759900800036001095002","solved_grid":"164379528825416397793582461412637985589241673376958214248163759957824136631795842","profile_id":11},{"recording_id":"453fa452-fae6-40d2-9aac-4b76654da4bd","difficulty":"expert","elapsed_seconds":143,"points":1380,"mistakes":2,"puzzle_clues":"004701030069004270000060800000010027290000185805207000932000018070000006400000300","solved_grid":"584721639369584271721369854643815927297643185815297463932456718178932546456178392","profile_id":11},{"recording_id":"28943521-c429-43a8-87c1-430a533863a9","difficulty":"extreme","elapsed_seconds":159,"points":1820,"mistakes":1,"puzzle_clues":"030516027002030100600000000020700500300051200104000800000000000001078435000345000","solved_grid":"438516927792834156615297384926783541387451269154629873543162798261978435879345612","profile_id":11},{"recording_id":"51a6119d-5ad5-484e-a52a-df4c4e4ef337","difficulty":"easy","elapsed_seconds":101,"points":450,"mistakes":0,"puzzle_clues":"947265008620800700083490002009326087006701905070549020790654230000102800312008456","solved_grid":"947265318625813794183497562459326187236781945871549623798654231564132879312978456","profile_id":12},{"recording_id":"1d53f41b-3020-415d-96e6-33df057737ec","difficulty":"medium","elapsed_seconds":93,"points":680,"mistakes":2,"puzzle_clues":"269310007180540926075900000540002000300000700900631004000409063630185470790000085","solved_grid":"269318547183547926475926318548792631316854792927631854851479263632185479794263185","profile_id":12},{"recording_id":"df3a4491-4258-4ac8-8bae-5720c9e080df","difficulty":"medium","elapsed_seconds":91,"points":750,"mistakes":0,"puzzle_clues":"200056070719040080805790400642100009397620010100000000403062090026008340981007600","solved_grid":"234856971719243586865791423642185739397624815158379264473562198526918347981437652","profile_id":12},{"recording_id":"7e540692-d039-43bd-aac9-7cded0f2c812","difficulty":"hard","elapsed_seconds":203,"points":1070,"mistakes":1,"puzzle_clues":"057000938006390250008007040000041300069000400071039580095070003000000724000100890","solved_grid":"257416938146398257938527146582741369369852471471639582895274613613985724724163895","profile_id":12},{"recording_id":"a217cbbd-ae22-43dd-ad0e-f648ba19449c","difficulty":"hard","elapsed_seconds":118,"points":1030,"mistakes":2,"puzzle_clues":"006870000000006378080500040817002403560390080034080050100405900079018000005030000","solved_grid":"496873125251946378783521649817652493562394781934187256128465937379218564645739812","profile_id":12},{"recording_id":"daf8ab16-ab46-4386-9f3a-00a055fc060b","difficulty":"hard","elapsed_seconds":174,"points":1100,"mistakes":0,"puzzle_clues":"590000080043001002870092060004300019009060800080050620906000000038705000710926040","solved_grid":"592643781643871952871592463264387519159264837387159624926438175438715296715926348","profile_id":12},{"recording_id":"486d6590-3cf0-4bb0-8295-d6200581b082","difficulty":"expert","elapsed_seconds":164,"points":1420,"mistakes":1,"puzzle_clues":"000068000000900006700502013000090830149070205030050000401309000008020401070015008","solved_grid":"913768524524931786786542913265194837149873265837256149451389672398627451672415398","profile_id":12},{"recording_id":"97e04e5a-2397-4a3d-b9d2-f0599ffc1d8b","difficulty":"expert","elapsed_seconds":106,"points":1420,"mistakes":1,"puzzle_clues":"007230000236109807040087000092000035000090000070300042058020000000658093000000560","solved_grid":"587236419236149857149587326492871635365492781871365942658923174714658293923714568","profile_id":12},{"recording_id":"e290cdff-7b0c-41c2-aa24-5005dead6e5a","difficulty":"expert","elapsed_seconds":143,"points":1420,"mistakes":1,"puzzle_clues":"806050001500301007013000509100072900005003106900806000000005004009030070600900308","solved_grid":"876259431592341867413687529168572943725493186934816752381765294249138675657924318","profile_id":12},{"recording_id":"2cdf1966-dc75-499e-b03e-27eed34f81b5","difficulty":"extreme","elapsed_seconds":177,"points":1780,"mistakes":2,"puzzle_clues":"008001750000400600005000002000009200020800063000010008109005846000100020700648001","solved_grid":"968231754213457689475986132847369215521874963396512478139725846684193527752648391","profile_id":12},{"recording_id":"d0b379a6-d85d-4481-8a49-b4f55280e4ed","difficulty":"extreme","elapsed_seconds":159,"points":1780,"mistakes":2,"puzzle_clues":"700003608004060050000507013000000006009000170471300000003005020508000049100400800","solved_grid":"752143698314968257896527413285714936639852174471396582943685721568271349127439865","profile_id":12},{"recording_id":"fa412099-79ce-41f9-9d52-273d94b2bf0f","difficulty":"extreme","elapsed_seconds":122,"points":1780,"mistakes":2,"puzzle_clues":"090200080000700500200080010010024000042500100083071409000002050129400000430000000","solved_grid":"791245683368719542254386917617924835942538176583671429876192354129453768435867291","profile_id":12},{"recording_id":"52d138c9-746d-4926-8359-aa30b0b249ea","difficulty":"easy","elapsed_seconds":64,"points":420,"mistakes":1,"puzzle_clues":"762050091900006503000940200470208309200039107590417008127685934008300012349172000","solved_grid":"762853491914726583835941276471268359286539147593417628127685934658394712349172865","profile_id":13},{"recording_id":"7db830e9-1a57-4ace-888d-435ed7db3c22","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"970140562010500030056739100062301000040627001139485607680073904327014856001800000","solved_grid":"973148562814562739256739148762391485548627391139485627685273914327914856491856273","profile_id":13},{"recording_id":"8510a31b-b828-4f91-bea4-3acb43aa9151","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"060007100409001080203006704102659347034028950695003021320805400850904270906302018","solved_grid":"568497132479231685213586794182659347734128956695743821327815469851964273946372518","profile_id":13},{"recording_id":"bcb2eec8-ec91-4d23-b52b-cf7cd353cba9","difficulty":"easy","elapsed_seconds":96,"points":380,"mistakes":2,"puzzle_clues":"701060008839000054456090120170000589602850301905730240318600400200900810594183062","solved_grid":"721564938839217654456398127173426589642859371985731246318672495267945813594183762","profile_id":13},{"recording_id":"1fe0799b-7b8a-4553-983f-34d4eafe64b5","difficulty":"medium","elapsed_seconds":139,"points":720,"mistakes":1,"puzzle_clues":"400010690017090834206000010709000150643851927001020000064380071385000400170000080","solved_grid":"438517692517296834296438715729643158643851927851729346964385271385172469172964583","profile_id":13},{"recording_id":"83f16157-53ca-45fc-97dd-544b71d0fbdf","difficulty":"hard","elapsed_seconds":109,"points":1070,"mistakes":1,"puzzle_clues":"800006043625043900000900500184060205030000009000000480000000012050312090203804650","solved_grid":"879526143625143978341978526184769235532481769967235481498657312756312894213894657","profile_id":13},{"recording_id":"4d67c91f-5f0a-4d65-a100-126abd8242f0","difficulty":"expert","elapsed_seconds":167,"points":1380,"mistakes":2,"puzzle_clues":"007340008000000067128900054003020009409500102000000580070060020205019406000800000","solved_grid":"697345218534281967128976354853127649469538172712694583971463825285719436346852791","profile_id":13},{"recording_id":"55dffdff-eed8-4ab1-b9ce-87ca788e64d1","difficulty":"extreme","elapsed_seconds":220,"points":1780,"mistakes":2,"puzzle_clues":"740000310003540006809020000058090020000004000690732000000070000086010030004605000","solved_grid":"745968312123547986869321574458196723237854169691732845912473658586219437374685291","profile_id":13},{"recording_id":"5831d01f-893f-4410-a7de-140c10b8eb1a","difficulty":"easy","elapsed_seconds":98,"points":420,"mistakes":1,"puzzle_clues":"910604007370200000400503201208736159630105020501802760709420006100360970863950402","solved_grid":"912684537375219648486573291248736159637195824591842763759421386124368975863957412","profile_id":14},{"recording_id":"2185f07e-3fe3-4494-a21b-7bca15b24c18","difficulty":"medium","elapsed_seconds":145,"points":720,"mistakes":1,"puzzle_clues":"506403980734008520901052734000004800815006309000500007408005603003009002052067000","solved_grid":"526473981734198526981652734267934815815726349349581267498215673673849152152367498","profile_id":14},{"recording_id":"86680209-48b5-4d69-a1ac-6c818cebed0a","difficulty":"medium","elapsed_seconds":162,"points":750,"mistakes":0,"puzzle_clues":"647210583005640000200000700900560400700000350503000198050006040070492815400150637","solved_grid":"647219583835647921219835764981563472724981356563724198158376249376492815492158637","profile_id":14},{"recording_id":"dddd11dc-4373-479b-8d6c-3ccce397aa2f","difficulty":"medium","elapsed_seconds":111,"points":680,"mistakes":2,"puzzle_clues":"170830200209400080360900007406502070007640000825791000082009000003268019501300028","solved_grid":"174836295259417386368925147436582971917643852825791463682159734743268519591374628","profile_id":14},{"recording_id":"019c3137-d8fa-42b5-91d0-68fe421741a8","difficulty":"hard","elapsed_seconds":111,"points":1070,"mistakes":1,"puzzle_clues":"000019080060205931903000000020036000000000090705020640000152369300048005250600804","solved_grid":"572319486468275931913864527129436758634587192785921643847152369396748215251693874","profile_id":14},{"recording_id":"4fb3fee9-3988-4a21-a696-057f0607aaed","difficulty":"expert","elapsed_seconds":122,"points":1420,"mistakes":1,"puzzle_clues":"300490000094700801000100020800009405910006003640300090008900200030604500006000310","solved_grid":"381492657294765831567183924873219465912546783645378192758931246139624578426857319","profile_id":14},{"recording_id":"8b95c3a9-6956-41ff-b7c6-7d31fd3836b7","difficulty":"expert","elapsed_seconds":220,"points":1380,"mistakes":2,"puzzle_clues":"306900418008503007000000000610050209005008104009000005002000790560730000903024000","solved_grid":"356972418148563927297481536614357289735298164829146375482615793561739842973824651","profile_id":14},{"recording_id":"58388d21-5576-43ee-98f2-65808eed69f1","difficulty":"extreme","elapsed_seconds":197,"points":1780,"mistakes":2,"puzzle_clues":"000007083300640070020500004000400958000000000042080061010050806570003100003004000","solved_grid":"461297583358641279927538614136472958895316427742985361214759836579863142683124795","profile_id":14},{"recording_id":"cc7a205d-384c-4b77-9fde-6ff07ac4dddf","difficulty":"extreme","elapsed_seconds":269,"points":1780,"mistakes":2,"puzzle_clues":"080912000403000200090043000000000816600409003000060000800394000000000400930657008","solved_grid":"786912354453876291192543687249735816618429573375168942821394765567281439934657128","profile_id":14},{"recording_id":"5e1bd827-0e5e-4f69-a030-94acdd7fc21a","difficulty":"easy","elapsed_seconds":60,"points":420,"mistakes":1,"puzzle_clues":"416083000907610058005729061000971046179068005004350107732096580540207009690040003","solved_grid":"416583972927614358385729461253971846179468235864352197732196584548237619691845723","profile_id":15},{"recording_id":"de1d6e48-0a4a-4f20-812f-d7671739c068","difficulty":"easy","elapsed_seconds":75,"points":450,"mistakes":0,"puzzle_clues":"174302090206008000050700060000850071685100430017004658590027380068010724742683519","solved_grid":"174362895236598147859741263423856971685179432917234658591427386368915724742683519","profile_id":15},{"recording_id":"23e07a0e-1523-42bb-870d-ef918ba06aeb","difficulty":"medium","elapsed_seconds":85,"points":720,"mistakes":1,"puzzle_clues":"930000062206398570407100009072039045360050701000712003040063008623900010000000230","solved_grid":"938547162216398574457126389172639845369854721584712693741263958623985417895471236","profile_id":15},{"recording_id":"8737e50d-a16f-4664-93ae-e7e812f018c8","difficulty":"medium","elapsed_seconds":70,"points":720,"mistakes":1,"puzzle_clues":"005873000003002506412965080240600073309420160001709802150390000900007450800004000","solved_grid":"695873214783142596412965387248651973379428165561739842154396728936287451827514639","profile_id":15},{"recording_id":"02a74cce-97ed-48a4-8bea-e5b2e100ea49","difficulty":"hard","elapsed_seconds":110,"points":1070,"mistakes":1,"puzzle_clues":"703009008000000347050000600070003086682000490390200070030960810400010035208030900","solved_grid":"743629158926158347851347629175493286682571493394286571537964812469812735218735964","profile_id":15},{"recording_id":"e465db1e-80a6-4616-88f8-fa89ece2a81d","difficulty":"hard","elapsed_seconds":108,"points":1030,"mistakes":2,"puzzle_clues":"080002970061009000947830016300000702000080060056040380870006401000020097000090650","solved_grid":"583612974261479538947835216398561742724983165156247389879356421635124897412798653","profile_id":15},{"recording_id":"5c4239ba-77e4-496c-a9ab-a55683ca982d","difficulty":"expert","elapsed_seconds":170,"points":1380,"mistakes":2,"puzzle_clues":"030005190806009000490000008000000060320076809007080003180094070603108000200000501","solved_grid":"732865194856419237491723658918342765324576819567981423185294376673158942249637581","profile_id":15},{"recording_id":"60682df7-4db1-455c-a7fa-64684d3b3f05","difficulty":"extreme","elapsed_seconds":159,"points":1780,"mistakes":2,"puzzle_clues":"035200070490000000001009000618000000050001000000345006040030260726004801000060005","solved_grid":"835216974497853612261479358618927543354681729972345186549138267726594831183762495","profile_id":15},{"recording_id":"62a3ef05-87f5-488e-a5e3-69d7ec904d3d","difficulty":"easy","elapsed_seconds":79,"points":380,"mistakes":2,"puzzle_clues":"000803921000457638638092504306920705289001040015030280862019050403206190197000000","solved_grid":"574863921921457638638192574346928715289571346715634289862719453453286197197345862","profile_id":16},{"recording_id":"2b1624bd-b05f-4971-86b4-46909981d15d","difficulty":"medium","elapsed_seconds":95,"points":750,"mistakes":0,"puzzle_clues":"600027900400035010003081472867200000390800000000019060000748029029063084700590136","solved_grid":"618427953472935618953681472867254391391876245245319867136748529529163784784592136","profile_id":16},{"recording_id":"9fa3a9f5-4eb0-4708-b4a9-66f333e37fde","difficulty":"medium","elapsed_seconds":135,"points":750,"mistakes":0,"puzzle_clues":"258074061600800700070030028100328005800500000900061283590007006004680952006290070","solved_grid":"258974361631852749479136528167328495823549617945761283592417836714683952386295174","profile_id":16},{"recording_id":"0950a39d-75ed-468b-9ed1-0f435642ccff","difficulty":"hard","elapsed_seconds":130,"points":1070,"mistakes":1,"puzzle_clues":"001020097800497016409000020090000000020780000004300789980100065147060030000038070","solved_grid":"561823497832497516479516823798641352325789641614352789983174265147265938256938174","profile_id":16},{"recording_id":"85e5c207-6780-4166-9eb6-e671c89e5d1a","difficulty":"hard","elapsed_seconds":142,"points":1030,"mistakes":2,"puzzle_clues":"530000000007800530908053060000605004000001893014389206000030021000162070601900000","solved_grid":"532716948167894532948253167893625714256471893714389256479538621385162479621947385","profile_id":16},{"recording_id":"f736034c-6338-41f4-9a10-88fd2c1b5350","difficulty":"hard","elapsed_seconds":185,"points":1100,"mistakes":0,"puzzle_clues":"000070092020406000807009160006002040238090650010700023000047000085900070700803209","solved_grid":"641578392923416785857239164576382941238194657419765823192647538385921476764853219","profile_id":16},{"recording_id":"6322e285-339d-4ad0-ac3e-e4526a519987","difficulty":"expert","elapsed_seconds":120,"points":1420,"mistakes":1,"puzzle_clues":"009014050800900300100005000917000006020090000300502700000806090408059007090103064","solved_grid":"279314658856927341143685972917438526625791483384562719731846295468259137592173864","profile_id":16},{"recording_id":"d34982e9-3416-46d0-b116-c716f6df874c","difficulty":"expert","elapsed_seconds":152,"points":1420,"mistakes":1,"puzzle_clues":"204793008000650010800000000001800000007064009426300700102030006750000201000901007","solved_grid":"214793568379658412865142973931875624587264139426319785192537846753486291648921357","profile_id":16},{"recording_id":"6e65247a-e30a-4f9c-b0c8-0594bcaabcb2","difficulty":"extreme","elapsed_seconds":198,"points":1820,"mistakes":1,"puzzle_clues":"830649010000000049004000800000400100420138500003090002000000081000700300000365004","solved_grid":"835649217271853649694217853569472138427138596183596472356924781942781365718365924","profile_id":16},{"recording_id":"d8f9b49c-7f59-4c82-8faf-40eeea78c3ec","difficulty":"extreme","elapsed_seconds":211,"points":1780,"mistakes":2,"puzzle_clues":"005039004000008000087102000000000200740500000368004905050003000834010050001900030","solved_grid":"125639784693478521487152396519386247742591863368724915956843172834217659271965438","profile_id":16},{"recording_id":"6eea0a96-d312-4a67-b74b-e30d4706c9eb","difficulty":"easy","elapsed_seconds":97,"points":450,"mistakes":0,"puzzle_clues":"103480600784029050906001400000130002207965008031742965090800270410270590672593004","solved_grid":"153487629784629351926351487569138742247965138831742965395814276418276593672593814","profile_id":17},{"recording_id":"a1df9798-a8d7-4340-ab02-6917fac8fc6f","difficulty":"easy","elapsed_seconds":84,"points":420,"mistakes":1,"puzzle_clues":"409010025820947106136002079002008940940060580580304002008475300090026050750139268","solved_grid":"479613825825947136136582479612758943943261587587394612268475391391826754754139268","profile_id":17},{"recording_id":"d06619c7-8597-4eba-9c75-19179560d348","difficulty":"easy","elapsed_seconds":68,"points":380,"mistakes":2,"puzzle_clues":"080942705249500006700603049860090000490251007150060493908425671000076900671809504","solved_grid":"386942715249517386715683249867394152493251867152768493938425671524176938671839524","profile_id":17},{"recording_id":"ea859c13-314c-43a2-b125-535a346549b1","difficulty":"easy","elapsed_seconds":98,"points":450,"mistakes":0,"puzzle_clues":"632914805008620140901500030426090580000308024085462010890235460060879052250006000","solved_grid":"632914875578623149941587236426791583719358624385462917897235461164879352253146798","profile_id":17},{"recording_id":"2c6f2987-ab3c-45ae-a58b-1351568d9921","difficulty":"medium","elapsed_seconds":90,"points":720,"mistakes":1,"puzzle_clues":"009320000000967010123500070300070106078019432016203000254790060000036504600000987","solved_grid":"769321845485967213123584679342875196578619432916243758254798361897136524631452987","profile_id":17},{"recording_id":"0dd1ecc2-2a28-42fe-97fc-f8f0d1b8a4f5","difficulty":"hard","elapsed_seconds":122,"points":1100,"mistakes":0,"puzzle_clues":"809003000075900040130027006001269380000100029090000705020600500513092008000001002","solved_grid":"869413257275986143134527896751269384348175629692834715927648531513792468486351972","profile_id":17},{"recording_id":"6785f86d-61c6-4291-ae25-3c65653c15fb","difficulty":"expert","elapsed_seconds":145,"points":1380,"mistakes":2,"puzzle_clues":"041072000900001620002500400000160200500040076000259000094816050086000040000030001","solved_grid":"841672539953481627762593418438167295529348176617259384394816752186725943275934861","profile_id":17},{"recording_id":"728a1a50-e3f5-402e-9469-b25fb486162e","difficulty":"extreme","elapsed_seconds":148,"points":1780,"mistakes":2,"puzzle_clues":"000092000600700829290000701000028040001000573009000002500080000900605008103000007","solved_grid":"317892465654713829298456731735128946821964573469537182576381294942675318183249657","profile_id":17},{"recording_id":"6f132b6d-ee9d-4af2-a6f7-3f4c0c9fb2d2","difficulty":"easy","elapsed_seconds":73,"points":450,"mistakes":0,"puzzle_clues":"208930465654821030379005820090374650580200004040658209025003006060582003901706000","solved_grid":"218937465654821937379465821192374658586219374743658219825193746467582193931746582","profile_id":18},{"recording_id":"2e5fb3bf-b1f6-4597-8e20-a1d01660e8fd","difficulty":"medium","elapsed_seconds":175,"points":750,"mistakes":0,"puzzle_clues":"080315460000897510530204000000050046205048379804970050908730005100500004002009030","solved_grid":"789315462426897513531264798397152846215648379864973251948731625173526984652489137","profile_id":18},{"recording_id":"c08a1c32-d1e7-4d94-9151-e1e55287755f","difficulty":"medium","elapsed_seconds":81,"points":750,"mistakes":0,"puzzle_clues":"065000012407001305012300007620805070000107603109002800538710006206503041700260000","solved_grid":"365478912487921365912356487623845179854197623179632854538714296296583741741269538","profile_id":18},{"recording_id":"11d77956-ba2c-492f-8418-6f07fe1e5083","difficulty":"hard","elapsed_seconds":140,"points":1030,"mistakes":2,"puzzle_clues":"902600057600710300005930800000000900008291000200403700806120403000340008040850070","solved_grid":"932684157684715329715932846463578912578291634291463785856127493127349568349856271","profile_id":18},{"recording_id":"96153131-24d5-4d46-8274-7f327040ae32","difficulty":"hard","elapsed_seconds":306,"points":1030,"mistakes":2,"puzzle_clues":"139072006000580009050019072070000000083124060204000003000000038300901007527008900","solved_grid":"139472586742586319856319472675893124983124765214765893491257638368941257527638941","profile_id":18},{"recording_id":"e78d17f1-5060-4978-9651-5ee1905b884f","difficulty":"hard","elapsed_seconds":152,"points":1070,"mistakes":1,"puzzle_clues":"802039007157000900060570840000090000539014000401280530200863700090000000300007004","solved_grid":"842639157157428963963571842628395471539714628471286539214863795795142386386957214","profile_id":18},{"recording_id":"6aa1debe-f0b2-49e1-bfe0-96089dec5024","difficulty":"expert","elapsed_seconds":148,"points":1420,"mistakes":1,"puzzle_clues":"600039007000040930080005600800160200700000053200308760007600000098000126002084000","solved_grid":"624839517571246938983715642835167294716492853249358761357621489498573126162984375","profile_id":18},{"recording_id":"9bffa2d3-03b0-4fca-9ff2-99be9ab05bb3","difficulty":"expert","elapsed_seconds":195,"points":1420,"mistakes":1,"puzzle_clues":"000218000790300010020000063009030000503806197002701030008100045050000200000509080","solved_grid":"436218759795364812821957463179435628543826197682791534368172945954683271217549386","profile_id":18},{"recording_id":"e54ac450-a639-4f28-8b26-6ac322cb6c95","difficulty":"expert","elapsed_seconds":150,"points":1420,"mistakes":1,"puzzle_clues":"000070058467805390001030046000000403210040500634008000300000205000960074000020000","solved_grid":"923674158467815392581239746875192463219346587634758921396487215152963874748521639","profile_id":18},{"recording_id":"765c7d35-383b-4202-a9e6-7e57f8f24c13","difficulty":"extreme","elapsed_seconds":141,"points":1780,"mistakes":2,"puzzle_clues":"036700001002080304100030520200008100000000000978000452000000903001564000020000040","solved_grid":"436752891752189364189436527245978136613245789978613452564827913391564278827391645","profile_id":18},{"recording_id":"e4eed04f-7939-47d9-8650-3b2e38d6b11e","difficulty":"extreme","elapsed_seconds":137,"points":1820,"mistakes":1,"puzzle_clues":"000705001001060030530082000706300000040007000100800050670003092802006000300090004","solved_grid":"469735281281964537537182469756321948948657123123849756674513892892476315315298674","profile_id":18},{"recording_id":"7c51f58a-15b1-4068-b4b0-e05bc374aba8","difficulty":"easy","elapsed_seconds":60,"points":450,"mistakes":0,"puzzle_clues":"034217698700690045809040007953704861106500700402000509040102056208050470695400082","solved_grid":"534217698721698345869345217953724861186539724472861539347182956218956473695473182","profile_id":19},{"recording_id":"d5c1a766-b57c-4b06-9cd0-522eec0c81ae","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"276910480843270095000840706052039648060702309109468000620000001590081264300624000","solved_grid":"276915483843276195915843726752139648468752319139468572624597831597381264381624957","profile_id":19},{"recording_id":"37974858-e602-4974-9ce7-c925f42cc316","difficulty":"medium","elapsed_seconds":88,"points":750,"mistakes":0,"puzzle_clues":"708060523000005704502840000900370840814650200270410060087094602625700400090000000","solved_grid":"748961523169235784532847196956372841814659237273418965387194652625783419491526378","profile_id":19},{"recording_id":"6a50d19c-7454-441a-8031-83fd4cd9ae24","difficulty":"medium","elapsed_seconds":89,"points":720,"mistakes":1,"puzzle_clues":"002097040304008719000403005200900060486572190130000250500349600943820000008010030","solved_grid":"852197346364258719791463825275931468486572193139684257517349682943826571628715934","profile_id":19},{"recording_id":"1d046e54-460b-422c-bdd3-a6ee3695c074","difficulty":"hard","elapsed_seconds":158,"points":1030,"mistakes":2,"puzzle_clues":"860007010003190658001580030006008003002000070000234901209061540000405092700000000","solved_grid":"865347219473192658921586734196758423342619875587234961239861547618475392754923186","profile_id":19},{"recording_id":"f7b11ee4-a822-46ae-aeca-ffea13e69d6a","difficulty":"hard","elapsed_seconds":273,"points":1030,"mistakes":2,"puzzle_clues":"400003009020906104980001025108000206090008750000090001005009007000205910800034062","solved_grid":"471523689523986174986471325148357296692148753357692841265819437734265918819734562","profile_id":19},{"recording_id":"7c31ff39-9211-461f-ac87-e3a0dcf3ddff","difficulty":"expert","elapsed_seconds":149,"points":1380,"mistakes":2,"puzzle_clues":"700005003400081600602000080070216900261000800040030010080000500500000072007009348","solved_grid":"718625493439781625652493781873216954261954837945837216384172569596348172127569348","profile_id":19},{"recording_id":"87a9d456-86b2-4a94-9f97-5cd681f854df","difficulty":"extreme","elapsed_seconds":221,"points":1850,"mistakes":0,"puzzle_clues":"000082010002000794100000860856000070001700000700800401000518003008003000490060000","solved_grid":"974682315682135794135974862856341279341729586729856431267518943518493627493267158","profile_id":19},{"recording_id":"a0b79fa2-87df-4501-8a24-a14bcc93026b","difficulty":"easy","elapsed_seconds":112,"points":450,"mistakes":0,"puzzle_clues":"408502630259306400007080209590020106106905072372860590803009725705630001900007063","solved_grid":"418592637259376418637184259594723186186945372372861594863419725725638941941257863","profile_id":19},{"recording_id":"ac17c721-363e-42d3-bd03-293cddca7cd6","difficulty":"easy","elapsed_seconds":86,"points":450,"mistakes":0,"puzzle_clues":"068405030094321087103800045931702456207540300040109000302600194850000023410270508","solved_grid":"768495231594321687123867945931782456287546319645139872372658194856914723419273568","profile_id":13},{"recording_id":"34e98a1a-4eb5-4ed1-b1a1-80085cbcd2e7","difficulty":"easy","elapsed_seconds":89,"points":450,"mistakes":0,"puzzle_clues":"136470958200089063005631200849053700301267004002040015420390070593700480007004530","solved_grid":"136472958274589163985631247849153726351267894762948315428395671593716482617824539","profile_id":17},{"recording_id":"93e8d576-db45-4e08-84f5-2b7726a3a5e9","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"100845300548030017032091008380009741920104830000583206069000523250067000814052609","solved_grid":"197845362548236917632791458385629741926174835471583296769418523253967184814352679","profile_id":19},{"recording_id":"cda3189a-427b-4700-a2a9-21583eeca3bc","difficulty":"easy","elapsed_seconds":81,"points":450,"mistakes":0,"puzzle_clues":"003745981908623050705910632450080270007450000186200095304501820060300510001062307","solved_grid":"623745981918623754745918632459186273237459168186237495374591826862374519591862347","profile_id":9},{"recording_id":"449bd7e0-3c40-4c0f-a87c-f0ab4d85d95b","difficulty":"easy","elapsed_seconds":65,"points":450,"mistakes":0,"puzzle_clues":"003085019586900273019072000060091700002537864035400102350046927020853600640700350","solved_grid":"273685419586914273419372586864291735192537864735468192358146927927853641641729358","profile_id":14},{"recording_id":"02cccc6a-9216-4117-b54b-0bf9983d9612","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"538007060279641300010003729060035287007016540400872690140020076096154002300060015","solved_grid":"538297164279641358614583729961435287827916543453872691145328976796154832382769415","profile_id":9},{"recording_id":"0d3b2329-4b84-4930-9708-874e57e560a6","difficulty":"easy","elapsed_seconds":83,"points":450,"mistakes":0,"puzzle_clues":"000175308638090057517300429090750816000023005470801900900610280001008504823549601","solved_grid":"249175368638492157517386429392754816186923745475861932954617283761238594823549671","profile_id":15},{"recording_id":"9ea8aee8-103f-4614-af4d-379d647e7596","difficulty":"easy","elapsed_seconds":85,"points":380,"mistakes":2,"puzzle_clues":"005146829040890753892005064010609000070514608689003000300408970468920010927001086","solved_grid":"735146829146892753892735164514689237273514698689273541351468972468927315927351486","profile_id":17},{"recording_id":"30f562fb-b554-4889-8678-f1ee61972e47","difficulty":"easy","elapsed_seconds":89,"points":450,"mistakes":0,"puzzle_clues":"020651004106478093874309510041832650038065070560100308007006140000500807400083962","solved_grid":"923651784156478293874329516741832659238965471569147328387296145692514837415783962","profile_id":19},{"recording_id":"45fd1cd9-4007-46cb-8de4-a22f2557ce7c","difficulty":"easy","elapsed_seconds":90,"points":450,"mistakes":0,"puzzle_clues":"203185004400007058850000370127508943309712580600904001510006400730001860968070215","solved_grid":"273185694496327158851649372127568943349712586685934721512896437734251869968473215","profile_id":3},{"recording_id":"160fabfa-d6c0-4895-b93d-eb7e1ec5ce85","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"741380290200470800000629714658042301492137005307068400104750060070800142080000037","solved_grid":"741385296269471853835629714658942371492137685317568429124753968573896142986214537","profile_id":5},{"recording_id":"ce262df8-2856-4cd2-90e9-543a796cd800","difficulty":"easy","elapsed_seconds":82,"points":450,"mistakes":0,"puzzle_clues":"407936085360150020501002060906803257002690030108275049803521076000300002000467398","solved_grid":"427936185369158724581742963946813257752694831138275649893521476674389512215467398","profile_id":8},{"recording_id":"2bb2a92d-9171-4769-b980-a09a22081626","difficulty":"easy","elapsed_seconds":85,"points":420,"mistakes":1,"puzzle_clues":"306820974080400600049060258807000012120978340400001789270349160600782000904516020","solved_grid":"316825974582497631749163258897634512125978346463251789278349165651782493934516827","profile_id":12},{"recording_id":"23b132d6-8010-4bc3-8740-bd958b7b8b7b","difficulty":"easy","elapsed_seconds":56,"points":450,"mistakes":0,"puzzle_clues":"921800630045376291307902400136509804592000016084063000409680103600231040000005760","solved_grid":"921854637845376291367912485136529874592748316784163952459687123678231549213495768","profile_id":1},{"recording_id":"63dfa997-215b-4544-b144-fba699c67420","difficulty":"easy","elapsed_seconds":73,"points":380,"mistakes":2,"puzzle_clues":"201300479035000800907810306520047081198235047760081030000120504450098000310504798","solved_grid":"281356479635479812947812356523647981198235647764981235879123564456798123312564798","profile_id":7},{"recording_id":"f3bc3039-abc7-4adf-820b-24180a3268a3","difficulty":"easy","elapsed_seconds":67,"points":420,"mistakes":1,"puzzle_clues":"600090043009000605843600710006009230208100097497203156070508061502916370961300582","solved_grid":"625791843719834625843652719156479238238165497497283156374528961582916374961347582","profile_id":16},{"recording_id":"221dd10d-1233-4296-9ccb-e3717629bb3c","difficulty":"easy","elapsed_seconds":68,"points":420,"mistakes":1,"puzzle_clues":"203000701864901230719000840081507462420090307305602910630800509048700023090063104","solved_grid":"253486791864971235719325846981537462426198357375642918632814579148759623597263184","profile_id":10},{"recording_id":"1896ba23-f4b8-4419-b1dd-f70ed8784863","difficulty":"easy","elapsed_seconds":63,"points":420,"mistakes":1,"puzzle_clues":"154902007009738514800401609698100052301240900542090000705620803406309170000017206","solved_grid":"154962387269738514837451629698173452371245968542896731715624893426389175983517246","profile_id":18},{"recording_id":"335b5f9e-ada9-438c-a91c-7253b3bcee96","difficulty":"easy","elapsed_seconds":61,"points":450,"mistakes":0,"puzzle_clues":"089703240500264891620810705012000070900030124067000589035000012291305467006900358","solved_grid":"189753246573264891624819735412598673958637124367142589835476912291385467746921358","profile_id":4},{"recording_id":"f5aeedf0-2982-4c96-afaf-3771106deaf3","difficulty":"easy","elapsed_seconds":60,"points":450,"mistakes":0,"puzzle_clues":"000407001400015006015803402782541069396702004040306700238000605009238147070650283","solved_grid":"863427951427915836915863472782541369396782514541396728238174695659238147174659283","profile_id":7},{"recording_id":"2edd4aeb-026f-4898-95e1-75a321428b73","difficulty":"easy","elapsed_seconds":64,"points":450,"mistakes":0,"puzzle_clues":"415097060260041073073806415597032801801059020320000507684915030730000059100200004","solved_grid":"415397268268541973973826415597632841841759326326184597684915732732468159159273684","profile_id":14},{"recording_id":"2eebd18d-8fa3-458e-af59-41e3d84d2f33","difficulty":"easy","elapsed_seconds":59,"points":450,"mistakes":0,"puzzle_clues":"209060384840702015056038027600100090010879560907250431700900106400080259502014803","solved_grid":"279561384843792615156438927625143798314879562987256431738925146461387259592614873","profile_id":1},{"recording_id":"c97585e1-1c59-4c62-b121-1fd0265bead8","difficulty":"easy","elapsed_seconds":67,"points":420,"mistakes":1,"puzzle_clues":"000458692009000485450020000701590063090236718206781040040060300312040050965312874","solved_grid":"173458692629173485458629137781594263594236718236781549847965321312847956965312874","profile_id":10},{"recording_id":"7efd24a3-fb0c-4c54-94b5-e1918c63af90","difficulty":"easy","elapsed_seconds":63,"points":420,"mistakes":1,"puzzle_clues":"030081627762040008050672394105406800083710462040093050527060100310250906000138200","solved_grid":"439581627762349518851672394175426839983715462246893751527964183318257946694138275","profile_id":16},{"recording_id":"72b24387-33d2-4e97-aae9-2096cc4f1fee","difficulty":"easy","elapsed_seconds":61,"points":450,"mistakes":0,"puzzle_clues":"070238140601790020820410075405080602730160094010950037104070200907620051360501780","solved_grid":"579238146641795328823416975495387612738162594216954837154879263987623451362541789","profile_id":8},{"recording_id":"4ce2abc8-c204-444e-9370-a6b10fdf6ce7","difficulty":"easy","elapsed_seconds":66,"points":380,"mistakes":2,"puzzle_clues":"104300590900174006006900710830407162490600385012030907700241600240560870563089400","solved_grid":"174326598958174236326958714835497162497612385612835947789241653241563879563789421","profile_id":5},{"recording_id":"b965ae6d-7096-4339-a827-30bc37e8bd5b","difficulty":"easy","elapsed_seconds":56,"points":450,"mistakes":0,"puzzle_clues":"750000392002405816100293070605009043073501908200300165507182430049750081820900007","solved_grid":"754618392932475816186293574615829743473561928298347165567182439349756281821934657","profile_id":18},{"recording_id":"e5376004-0029-4a19-854c-006a69bf3955","difficulty":"easy","elapsed_seconds":53,"points":450,"mistakes":0,"puzzle_clues":"108709030970006150634581970003900207895672003007104095001295700509400381706000509","solved_grid":"158729634972346158634581972413958267895672413267134895381295746529467381746813529","profile_id":3},{"recording_id":"e9aa1dbe-5033-4d12-8b6c-8dacdbeef18f","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"014257090030000725070903000001408253407532960523600800108720009042395610350086072","solved_grid":"814257396936841725275963184691478253487532961523619847168724539742395618359186472","profile_id":12},{"recording_id":"03a7f6e3-ec50-4cba-8c6b-a62759a1da1d","difficulty":"easy","elapsed_seconds":63,"points":450,"mistakes":0,"puzzle_clues":"300750162100400597500006084030025408006041730410970256005182900040060820801394675","solved_grid":"384759162162438597597216384739625418256841739418973256675182943943567821821394675","profile_id":0},{"recording_id":"6402c56f-5cc1-40aa-9881-cec9e70b3f1c","difficulty":"easy","elapsed_seconds":67,"points":420,"mistakes":1,"puzzle_clues":"605200000002090657903567801000010463036870100109043785060150249290036510081020376","solved_grid":"675281934812394657943567821758912463436875192129643785367158249294736518581429376","profile_id":11},{"recording_id":"9793ddc6-83ff-46bb-ba44-ebff32debfae","difficulty":"easy","elapsed_seconds":65,"points":420,"mistakes":1,"puzzle_clues":"001203480840617300205094761350469100712300900406701030584006003007102850100540690","solved_grid":"671253489849617325235894761358469172712385946496721538584976213967132854123548697","profile_id":15},{"recording_id":"dec1f938-cfde-4398-8a9f-0d6d738d6894","difficulty":"easy","elapsed_seconds":81,"points":380,"mistakes":2,"puzzle_clues":"200361004054208000360750920000039010076020380839176045913607052580013467640082000","solved_grid":"298361574754298631361754928425839716176425389839176245913647852582913467647582193","profile_id":4},{"recording_id":"c60467ce-2bd0-4115-9965-64a66965b205","difficulty":"easy","elapsed_seconds":67,"points":420,"mistakes":1,"puzzle_clues":"700602000000704096602010030071003982463280100080571364908047623007326809026950740","solved_grid":"734692518815734296692815437571463982463289175289571364958147623147326859326958741","profile_id":1},{"recording_id":"da6cfa95-d332-4970-8bca-d6a5753709f2","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"020960308834150009970043200750086412241790003368214500603400005507039804400000930","solved_grid":"125967348834152769976843251759386412241795683368214597693428175517639824482571936","profile_id":14},{"recording_id":"f2830e5b-9194-45df-a070-23b00c942676","difficulty":"easy","elapsed_seconds":62,"points":420,"mistakes":1,"puzzle_clues":"640731092298400001103902540364070025810295463000003000080500630402307189700810250","solved_grid":"645731892298456371173982546364178925817295463529643718981524637452367189736819254","profile_id":7},{"recording_id":"712ce5fa-561a-47c9-a922-f38d09a9cdf4","difficulty":"easy","elapsed_seconds":72,"points":450,"mistakes":0,"puzzle_clues":"040150020301090468792648500005930002100070856204086301563709284020305079907804000","solved_grid":"846153927351297468792648513685931742139472856274586391563719284428365179917824635","profile_id":16},{"recording_id":"e725b678-3630-449c-9837-07a83deaa8fc","difficulty":"easy","elapsed_seconds":71,"points":420,"mistakes":1,"puzzle_clues":"130428090060001048820967051008750003341092576000103902510084009970600834083270005","solved_grid":"135428697769531248824967351298756413341892576657143982516384729972615834483279165","profile_id":10},{"recording_id":"2ada36d6-6d0c-4b8c-9986-0cc3296d49fd","difficulty":"easy","elapsed_seconds":71,"points":420,"mistakes":1,"puzzle_clues":"003250086986371002050609070500020000761005829000167534697503248040090015315802600","solved_grid":"173254986986371452452689173534928761761435829829167534697513248248796315315842697","profile_id":18},{"recording_id":"22fd0890-6844-4fd5-aee5-e8a336a5c3d5","difficulty":"easy","elapsed_seconds":51,"points":450,"mistakes":0,"puzzle_clues":"050123684002804705846075013603749021000630470700251308061000950408002100520016040","solved_grid":"957123684132864795846975213683749521215638479794251368361487952478592136529316847","profile_id":8},{"recording_id":"d10c0756-54a8-4c8b-92ef-d8d31dcd8b69","difficulty":"easy","elapsed_seconds":72,"points":420,"mistakes":1,"puzzle_clues":"305020700090401056014006209080760935047390128000208674576000402401607003800142567","solved_grid":"365829741298471356714536289182764935647395128953218674576983412421657893839142567","profile_id":3},{"recording_id":"efb0438b-f040-4f9e-b6d5-3f014cfb0949","difficulty":"easy","elapsed_seconds":59,"points":450,"mistakes":0,"puzzle_clues":"690172040450068001012003809027390010034016750100200400060000984849621537300489120","solved_grid":"698172345453968271712543869527394618934816752186257493261735984849621537375489126","profile_id":5},{"recording_id":"b57c023e-b1a1-426f-9076-f7c2d89e084e","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"679001048450796012100500060813450027940070183267138000094003850006010074580007206","solved_grid":"679321548458796312132584769813459627945672183267138495794263851326815974581947236","profile_id":12},{"recording_id":"c4e034dc-1dc5-4857-b652-deba9799d2ee","difficulty":"medium","elapsed_seconds":89,"points":750,"mistakes":0,"puzzle_clues":"900541607700920415040708009405607090200005100600280300006872000870090500390050028","solved_grid":"923541687768923415541768239435617892289435176617289354156872943872394561394156728","profile_id":6},{"recording_id":"a8a0ecb2-31e5-4732-a269-cac042654ef9","difficulty":"medium","elapsed_seconds":75,"points":720,"mistakes":1,"puzzle_clues":"009406032000080164000053800075804001031009648468000705100095407000008200007621950","solved_grid":"789416532352987164614253879975864321231579648468132795126395487593748216847621953","profile_id":2},{"recording_id":"e2beb7db-0067-4f08-8e16-2a57c82eadc0","difficulty":"medium","elapsed_seconds":76,"points":720,"mistakes":1,"puzzle_clues":"540007083176003504038094000000009000002056308005318409003645071000870900800032605","solved_grid":"549167283176283594238594167381429756492756318765318429923645871654871932817932645","profile_id":13},{"recording_id":"066acdd7-4422-4d95-8e90-9e6adf55eb94","difficulty":"medium","elapsed_seconds":86,"points":750,"mistakes":0,"puzzle_clues":"403020500692017030750800920026100000034005170800340200249650083005700002000092051","solved_grid":"483926517692517834751834926526178349934265178817349265249651783165783492378492651","profile_id":17},{"recording_id":"ecc945b0-2a51-462e-9919-83cfcd93c67d","difficulty":"medium","elapsed_seconds":78,"points":720,"mistakes":1,"puzzle_clues":"804000000630702008205040036900180057308567009750420800027001360109030720503004000","solved_grid":"894316572631752498275948136942183657318567249756429813427891365189635724563274981","profile_id":9},{"recording_id":"77ff24a8-5d8f-4165-b321-6603ce8356b2","difficulty":"medium","elapsed_seconds":116,"points":720,"mistakes":1,"puzzle_clues":"970460300006805197050907642000091006064200050500000023680300714147000500005004260","solved_grid":"971462385426835197853917642238591476764283951519746823682359714147628539395174268","profile_id":0},{"recording_id":"0f0a1656-62f4-40f5-bafb-2dcf0345628e","difficulty":"medium","elapsed_seconds":76,"points":750,"mistakes":0,"puzzle_clues":"246050098098060315000900006950800100080620050002539480501090070030040001670210809","solved_grid":"246153798798462315315987246953874162487621953162539487521398674839746521674215839","profile_id":6},{"recording_id":"39791839-92cf-4a53-9d21-82fb48d9b2f7","difficulty":"medium","elapsed_seconds":69,"points":750,"mistakes":0,"puzzle_clues":"180009300290460007000070000603780400728594063540631208004300500800946000300020094","solved_grid":"187259346295463817436178925613782459728594163549631278964317582852946731371825694","profile_id":11},{"recording_id":"1ac9abf0-3f74-4db4-8f73-20ccb1f705d1","difficulty":"medium","elapsed_seconds":88,"points":720,"mistakes":1,"puzzle_clues":"004007035080500694035496700047028050820000000306740800500004203400010569200960408","solved_grid":"694287135782531694135496782947128356821653947356749821569874213478312569213965478","profile_id":2},{"recording_id":"7dd03480-2bfc-42b8-8228-3146a33f5839","difficulty":"medium","elapsed_seconds":103,"points":750,"mistakes":0,"puzzle_clues":"008000007700003941140507863002619000074030010916070038000004780087390000450780306","solved_grid":"368941527725863941149527863832619475574238619916475238693154782287396154451782396","profile_id":4},{"recording_id":"4d1f7952-15a9-41ab-b9d8-0bfd668acd3a","difficulty":"medium","elapsed_seconds":71,"points":750,"mistakes":0,"puzzle_clues":"327500004600000027084003005009810002010234060002067500043600950901348270200059800","solved_grid":"327596184695481327184723695769815432518234769432967518843672951951348276276159843","profile_id":15},{"recording_id":"dc5d1def-3484-41a4-8f79-25f296880a24","difficulty":"medium","elapsed_seconds":85,"points":680,"mistakes":2,"puzzle_clues":"000670300003925761107800005300090057056100942000060010030006100870040520625708039","solved_grid":"592671384483925761167834295318492657756183942249567813934256178871349526625718439","profile_id":13},{"recording_id":"94b5c942-d598-4fb0-b3f0-80d1ffbad038","difficulty":"medium","elapsed_seconds":74,"points":720,"mistakes":1,"puzzle_clues":"009103000004052900280690003103908000047531090890070050070364025000009634030205870","solved_grid":"769143582314852967285697413153928746647531298892476351978364125521789634436215879","profile_id":19},{"recording_id":"2b987f93-3b3e-43e4-a0b8-fd1e54010ec4","difficulty":"medium","elapsed_seconds":85,"points":750,"mistakes":0,"puzzle_clues":"041008960200069047500740000082000716305610004010082090006020008803970020100853079","solved_grid":"741238965238569147569741832482395716395617284617482593976124358853976421124853679","profile_id":9},{"recording_id":"95d9ac17-b1b5-4fbe-a133-bf3f5ed42215","difficulty":"medium","elapsed_seconds":87,"points":750,"mistakes":0,"puzzle_clues":"520400000480070006970506081648090350190050008052040000000260000019035264264809030","solved_grid":"526481973481973526973526481648197352197352648352648197735264819819735264264819735","profile_id":17},{"recording_id":"fb57f6ea-1769-40db-9e76-66a9293d176a","difficulty":"medium","elapsed_seconds":67,"points":720,"mistakes":1,"puzzle_clues":"000380057200040086360200941080620790650094108740100025026579013500010000030800000","solved_grid":"914386257275941386368257941183625794652794138749138625826579413597413862431862579","profile_id":16},{"recording_id":"4d1ee932-1bd5-4c8a-840e-66e793626cec","difficulty":"medium","elapsed_seconds":76,"points":750,"mistakes":0,"puzzle_clues":"080194300000602050000085901327051469001040003900027508208509630509403700060008000","solved_grid":"785194326194632857632785941327851469851946273946327518278519634519463782463278195","profile_id":5},{"recording_id":"851a1105-6ee3-4a5f-b0ae-bc6fcd557d28","difficulty":"medium","elapsed_seconds":76,"points":720,"mistakes":1,"puzzle_clues":"070609540080020307000301698002000009500240700007005234704100920860950403059407006","solved_grid":"173689542986524317425371698342716859598243761617895234734168925861952473259437186","profile_id":8},{"recording_id":"dee19e34-40cb-46fe-b2df-2844a856b4dc","difficulty":"medium","elapsed_seconds":80,"points":720,"mistakes":1,"puzzle_clues":"360005142140003509509000067000000000025714000401900825050082034200340956730000210","solved_grid":"367895142142673589589421367693258471825714693471936825956182734218347956734569218","profile_id":18},{"recording_id":"c3f97474-f47a-4c7c-af5b-5a3091f40e53","difficulty":"medium","elapsed_seconds":103,"points":680,"mistakes":2,"puzzle_clues":"002930074000070060784560930547200083010450096006080400038005010169348000000009048","solved_grid":"652931874391874562784562931547296183813457296926183457438725619169348725275619348","profile_id":3},{"recording_id":"94acce15-3685-4895-9d53-fd677e0d15e0","difficulty":"medium","elapsed_seconds":85,"points":680,"mistakes":2,"puzzle_clues":"010007008040380005238150040000000060004635071563700804350060087087000090090874352","solved_grid":"615497238749382615238156749971248563824635971563719824352961487487523196196874352","profile_id":12},{"recording_id":"1638bd8d-4907-4bee-b82b-8ef905ed1260","difficulty":"medium","elapsed_seconds":140,"points":680,"mistakes":2,"puzzle_clues":"504030000601005830030026504163254789009061402000900000008640900206079310005810000","solved_grid":"594738621621495837837126594163254789789361452452987163318642975246579318975813246","profile_id":0},{"recording_id":"5ab4a775-7787-4442-8903-18cd9027bd4e","difficulty":"medium","elapsed_seconds":89,"points":680,"mistakes":2,"puzzle_clues":"860130009004687150000200678530046800000801300701050904170009086640700502009008700","solved_grid":"867135249924687153315294678532946817496871325781352964173529486648713592259468731","profile_id":11},{"recording_id":"6ea82051-aa35-4393-a24f-08c36d10fa1c","difficulty":"medium","elapsed_seconds":89,"points":720,"mistakes":1,"puzzle_clues":"150008709860020000907400368040900002030170005001805030000507084480203017700084293","solved_grid":"154368729863729451927451368548936172639172845271845936392517684486293517715684293","profile_id":2},{"recording_id":"b53527d7-5198-41b3-bfc9-9ece9e52404f","difficulty":"medium","elapsed_seconds":73,"points":720,"mistakes":1,"puzzle_clues":"030002000051300000200507643105200007978601430020089006392078560010400009506003801","solved_grid":"634892715751346298289517643165234987978651432423789156392178564817465329546923871","profile_id":6},{"recording_id":"95573cf6-74b8-4ff2-a024-808600f9e525","difficulty":"medium","elapsed_seconds":72,"points":720,"mistakes":1,"puzzle_clues":"014700200070309010930008500500902080400605100001870365040090820000081047108467903","solved_grid":"814756239675329418932148576563912784487635192291874365746593821359281647128467953","profile_id":4},{"recording_id":"0b66eae9-a005-4047-ac9d-cf9dd38f6dbb","difficulty":"medium","elapsed_seconds":78,"points":720,"mistakes":1,"puzzle_clues":"100028405050093702720456030230500940960200070080004203675009801040800000000075094","solved_grid":"193728465456193782728456139231587946964231578587964213675349821349812657812675394","profile_id":15},{"recording_id":"2d6d0208-6e6c-4ae5-bfe9-3bbbbf349b40","difficulty":"medium","elapsed_seconds":94,"points":750,"mistakes":0,"puzzle_clues":"000000950007259000250048006900803507060924310003065409070490083091380205000072090","solved_grid":"148637952637259841259148736924813567765924318813765429572491683491386275386572194","profile_id":13},{"recording_id":"beef0201-b920-4e74-ae82-5e72f5c56c89","difficulty":"medium","elapsed_seconds":101,"points":750,"mistakes":0,"puzzle_clues":"006180070700003002820000603000800700008791435907035800040900350500204918180050264","solved_grid":"436182579795643182821579643354826791268791435917435826642918357573264918189357264","profile_id":7},{"recording_id":"c550cc53-5592-43cd-aea2-f8f4f0ed966d","difficulty":"medium","elapsed_seconds":81,"points":720,"mistakes":1,"puzzle_clues":"024305960000690024900204105648500309201709008000008051003070410786000500002950006","solved_grid":"824315967135697824967284135648521379251739648379468251593876412786142593412953786","profile_id":9},{"recording_id":"e4c2be7d-6291-45e6-93ff-4d2d7c5534b2","difficulty":"hard","elapsed_seconds":120,"points":1100,"mistakes":0,"puzzle_clues":"040006080000010002010502000861405000070029608900060040100004023302690074400050960","solved_grid":"245936187639817452718542396861475239574329618923168745196784523352691874487253961","profile_id":2},{"recording_id":"ed184290-82ee-45fa-99b1-0773911c9d09","difficulty":"hard","elapsed_seconds":119,"points":1100,"mistakes":0,"puzzle_clues":"000806052900307400400290000070600045854029300301000000008172600712000500600900700","solved_grid":"137846952925317468486295173279631845854729316361584297598172634712463589643958721","profile_id":0},{"recording_id":"2fff0058-144b-4ae0-bdcc-b27ef7f6a253","difficulty":"hard","elapsed_seconds":224,"points":1030,"mistakes":2,"puzzle_clues":"020093067090047200607100900702080030009060070060002059058930001000208390000400500","solved_grid":"125893467893647215647125983712589634589364172364712859258936741471258396936471528","profile_id":6},{"recording_id":"276ce281-4d50-40ff-a8d3-906aafb14416","difficulty":"hard","elapsed_seconds":121,"points":1070,"mistakes":1,"puzzle_clues":"902060800076340090000000750060004210000150600005036480091070008057000040638000507","solved_grid":"912567834576348192384921756763894215849152673125736489491275368257683941638419527","profile_id":11},{"recording_id":"b149989e-dd50-4a62-ba26-5b390308c14f","difficulty":"hard","elapsed_seconds":84,"points":1100,"mistakes":0,"puzzle_clues":"000563108710900000506080000003015082800400001000827940000170829067000035000004600","solved_grid":"924563178718942356536781294493615782872439561651827943345176829167298435289354617","profile_id":17},{"recording_id":"ea45a5b1-311b-43b6-885b-23ac9d31b45e","difficulty":"hard","elapsed_seconds":122,"points":1100,"mistakes":0,"puzzle_clues":"540169000720005001000807000010080635000036010005012007000470056074000800000098374","solved_grid":"543169728728345961961827543219784635487536219635912487892473156374651892156298374","profile_id":13},{"recording_id":"3ff4c132-a0fe-4286-8563-bf864e349235","difficulty":"hard","elapsed_seconds":122,"points":1100,"mistakes":0,"puzzle_clues":"830000904007680001005004000680402009504070608793000500002040307308006090409000006","solved_grid":"836521974947683251215794863681452739524379618793168542162945387378216495459837126","profile_id":14},{"recording_id":"a749933e-9861-4ce4-9a81-fa93782ecef5","difficulty":"hard","elapsed_seconds":151,"points":1070,"mistakes":1,"puzzle_clues":"000000000200473009704000650820007000503049260090082735180765000009008070050030800","solved_grid":"918526347265473189734891652826357914573149268491682735182765493349218576657934821","profile_id":6},{"recording_id":"5c1f244b-d05c-4f03-bcd2-f22d51a3fcbd","difficulty":"hard","elapsed_seconds":130,"points":1100,"mistakes":0,"puzzle_clues":"360819020524000090000000360018054073600007018070201600000000030006003482000420700","solved_grid":"367819524524376891891542367218654973645937218973281645482765139756193482139428756","profile_id":11},{"recording_id":"85ab4ce5-91ed-452a-81df-45127e83e375","difficulty":"hard","elapsed_seconds":192,"points":1100,"mistakes":0,"puzzle_clues":"000406000694235070500070604250980000089000000460700180900540008020009305300007006","solved_grid":"871496532694235871532178694257981463189364257463752189916543728728619345345827916","profile_id":1},{"recording_id":"a6921b66-6ac9-496b-9b29-4225fb53af59","difficulty":"hard","elapsed_seconds":118,"points":1030,"mistakes":2,"puzzle_clues":"408203907500700040090000000020507890005098204006012730040120000700000021200306080","solved_grid":"418253967532769148697841352124537896375698214986412735849125673763984521251376489","profile_id":4},{"recording_id":"f53ac71e-6b78-4500-ba50-9fea1202aec0","difficulty":"hard","elapsed_seconds":102,"points":1070,"mistakes":1,"puzzle_clues":"000030410053400000000782050504008030239506080007000004071820045090050671000000890","solved_grid":"728935416953461728416782953564178239239546187187293564671829345892354671345617892","profile_id":15},{"recording_id":"eaf55f36-0e5a-402d-9f73-b1ba5deeeecb","difficulty":"hard","elapsed_seconds":121,"points":1070,"mistakes":1,"puzzle_clues":"906007000000013900501060074715300048000051000360000005002000093400109080093600457","solved_grid":"926847531874513926531962874715396248248751369369284715682475193457139682193628457","profile_id":2},{"recording_id":"55e26bc7-ead4-42de-920e-c59c09ba5b0f","difficulty":"hard","elapsed_seconds":137,"points":1070,"mistakes":1,"puzzle_clues":"960008100030170629000020000378250490640780051000000000091064030400007000053902000","solved_grid":"962348175834175629517629348378251496649783251125496783291864537486537912753912864","profile_id":0},{"recording_id":"c309be5b-5ed3-433f-9653-7fb58089870b","difficulty":"hard","elapsed_seconds":129,"points":1030,"mistakes":2,"puzzle_clues":"000930600806070930530640002068004590412007800090000000003000001624700300100089400","solved_grid":"271935648846172935539648172368214597412597863795863214983426751624751389157389426","profile_id":19},{"recording_id":"63d4797b-4a00-42f3-844e-1469e28063b0","difficulty":"hard","elapsed_seconds":188,"points":1100,"mistakes":0,"puzzle_clues":"371004000005000170006007542090000020528060400130000706000905000059300004060241908","solved_grid":"371524689245698173986137542697413825528769431134852796412985367859376214763241958","profile_id":9},{"recording_id":"b891a64f-075b-45ba-8912-c790cdbd9042","difficulty":"hard","elapsed_seconds":93,"points":1070,"mistakes":1,"puzzle_clues":"009000725700040006000570098008396107170420000000000284890000000617050830000903070","solved_grid":"489631725752849316361572498248396157175428963936715284893167542617254839524983671","profile_id":17},{"recording_id":"11fa290f-f3e7-45de-ab0c-708d135776ab","difficulty":"hard","elapsed_seconds":135,"points":1100,"mistakes":0,"puzzle_clues":"405000100060450009003000002300004097000060000840507301684205003930600005207000648","solved_grid":"425739186168452739793186452316824597579361824842597361684275913931648275257913648","profile_id":13},{"recording_id":"4e95d9cd-255a-4d39-9533-d48862defe83","difficulty":"hard","elapsed_seconds":151,"points":1100,"mistakes":0,"puzzle_clues":"090400006500897043023000080000040560600080009309602800004100098075930000900060710","solved_grid":"897423156516897243423516987781349562652781439349652871264175398175938624938264715","profile_id":14},{"recording_id":"cedbf01c-cd52-4234-8416-3fc4a2a625a6","difficulty":"hard","elapsed_seconds":157,"points":1030,"mistakes":2,"puzzle_clues":"709020065050017300320600090067300540000761209093000070900500004005006020040070800","solved_grid":"719823465456917382328654791167392548584761239293485176972538614835146927641279853","profile_id":10},{"recording_id":"50881871-a171-4a66-b46a-014ec1b598cf","difficulty":"hard","elapsed_seconds":202,"points":1030,"mistakes":2,"puzzle_clues":"379410500805000014100005030000190008000824650000050700093271040700000069008900070","solved_grid":"379412586865739214142685937536197428917824653284356791693271845721548369458963172","profile_id":7},{"recording_id":"d457fdb0-2a96-4535-8834-7f87c6d172d3","difficulty":"hard","elapsed_seconds":98,"points":1100,"mistakes":0,"puzzle_clues":"020050408489012030003048000040000960006004301300600080000103859000580200090420600","solved_grid":"127356498489712536563948172748231965956874321312695784274163859631589247895427613","profile_id":2},{"recording_id":"57094d95-dae0-44ca-8520-045b284a5808","difficulty":"hard","elapsed_seconds":143,"points":1100,"mistakes":0,"puzzle_clues":"006003000153080000400290500072500348061830700004072000318049200000000407049020000","solved_grid":"296153874153487962487296531972561348561834729834972615318749256625318497749625183","profile_id":15},{"recording_id":"a6499844-bf55-4b0e-bdb6-c8815659eedd","difficulty":"hard","elapsed_seconds":109,"points":1030,"mistakes":2,"puzzle_clues":"800003261000708309050610800000037000000000040512080700000074905900060430030259180","solved_grid":"874593261261748359359612874648937512793125648512486793186374925925861437437259186","profile_id":1},{"recording_id":"0f3720f4-23d8-4826-befd-e8587dac6c49","difficulty":"hard","elapsed_seconds":128,"points":1100,"mistakes":0,"puzzle_clues":"082600953305801004000053020800040000020700040650000018006100407708065000209400060","solved_grid":"182674953395821674467953821871546239923718546654239718536192487748365192219487365","profile_id":4},{"recording_id":"aea365c5-baca-4aeb-969a-2f92f26d4261","difficulty":"hard","elapsed_seconds":124,"points":1100,"mistakes":0,"puzzle_clues":"700004050850076030134000006000000602015000403602703005001908300060001008208630001","solved_grid":"726314859859276134134589726473195682915862473682743915541928367367451298298637541","profile_id":11},{"recording_id":"0acc23a0-c0b3-4046-a1ba-264a85734675","difficulty":"hard","elapsed_seconds":170,"points":1070,"mistakes":1,"puzzle_clues":"802000001914000000750400086400600508080070009096583047030046000649005010500700000","solved_grid":"862357491914268375753419286471692538385174629296583147137946852649825713528731964","profile_id":19},{"recording_id":"4c59e21f-4548-41d8-a995-b5015fdc267f","difficulty":"hard","elapsed_seconds":117,"points":1070,"mistakes":1,"puzzle_clues":"000900060270865410068000270000007092092001730700090105020153000040008300050700006","solved_grid":"413972568279865413568314279185437692692581734734296185826153947947628351351749826","profile_id":0},{"recording_id":"35291f66-5b4c-4d93-81f2-ec6eaad456d9","difficulty":"hard","elapsed_seconds":101,"points":1030,"mistakes":2,"puzzle_clues":"460380015000604200000019006570020390319705000002000500100067830020900050000401060","solved_grid":"467382915951674283238519476574826391319745628682193547145267839726938154893451762","profile_id":6},{"recording_id":"968f6aae-4793-4447-aa43-bac718e47228","difficulty":"hard","elapsed_seconds":178,"points":1030,"mistakes":2,"puzzle_clues":"100003007006142835800970024001060000568020003000401080095000340080090000207000059","solved_grid":"142853967976142835853976124431568792568729413729431586695217348384695271217384659","profile_id":16},{"recording_id":"53ec8bad-1400-4681-8bd7-790dccc07c22","difficulty":"hard","elapsed_seconds":86,"points":1100,"mistakes":0,"puzzle_clues":"102700800046000020080009067578003100009041700010007302007935000421000030003400070","solved_grid":"192764853746358921385129467578293146239641785614587392867935214421876539953412678","profile_id":17},{"recording_id":"d16d6205-d41e-492e-a295-2d8264b6d03e","difficulty":"expert","elapsed_seconds":153,"points":1420,"mistakes":1,"puzzle_clues":"400600823000710906000008000090087600000500082702000000178000009060032008200871500","solved_grid":"417659823823714956956328417395287641641593782782146395178465239564932178239871564","profile_id":19},{"recording_id":"855e2a46-ac97-4e6d-b15b-a56d0812b84c","difficulty":"expert","elapsed_seconds":168,"points":1420,"mistakes":1,"puzzle_clues":"000009507002040901006070034400901050000060090020507006094002070007406205000003040","solved_grid":"843619527572348961916275834468921753735864192129537486694152378387496215251783649","profile_id":11},{"recording_id":"3a4345cc-cd92-42d8-a600-f52e6d444ae5","difficulty":"expert","elapsed_seconds":235,"points":1420,"mistakes":1,"puzzle_clues":"300409070064000025800520004000840700013902000040007050480201096000080002000600400","solved_grid":"325469871964178325871523964259846713713952648648317259487231596596784132132695487","profile_id":15},{"recording_id":"d936b338-279d-4bc4-a0aa-8507d6ea225e","difficulty":"expert","elapsed_seconds":152,"points":1420,"mistakes":1,"puzzle_clues":"965203000040060032302000000000010070796005100004600000000074500079050280003028009","solved_grid":"965283417147569832382741695538412976796835124214697358821974563479356281653128749","profile_id":9},{"recording_id":"057061d1-fed4-49fe-984b-5c7116711b05","difficulty":"expert","elapsed_seconds":124,"points":1420,"mistakes":1,"puzzle_clues":"650000780030060010001073000200300007000580200805906134900000508010600040500000370","solved_grid":"652149783738265419491873625269314857143587296875926134924731568317658942586492371","profile_id":0},{"recording_id":"479cea4f-d14b-4f0c-8a74-385afa17149e","difficulty":"expert","elapsed_seconds":132,"points":1450,"mistakes":0,"puzzle_clues":"008100400005080029200450070150800002400000000002531840000268300030005006000019050","solved_grid":"768192435345687129219453678153874962487926513692531847574268391931745286826319754","profile_id":2},{"recording_id":"2d857407-75b0-4365-9cde-7398263c4827","difficulty":"expert","elapsed_seconds":171,"points":1450,"mistakes":0,"puzzle_clues":"200090641900000080614020007060040870400007306000630052500000100042050000006002008","solved_grid":"258793641973164285614528937361245879425987316897631452589376124142859763736412598","profile_id":4},{"recording_id":"db3063f2-b972-4b77-8458-e0d0273d2053","difficulty":"expert","elapsed_seconds":137,"points":1380,"mistakes":2,"puzzle_clues":"700046000000100307900037426070605100001004200500900070800070051000300040207560000","solved_grid":"783246519624159387915837426478625193391784265562913874839472651156398742247561938","profile_id":7},{"recording_id":"acd52f1d-b484-4b6b-b5fe-6fe009e32513","difficulty":"expert","elapsed_seconds":175,"points":1380,"mistakes":2,"puzzle_clues":"130207698000003705270080300002000460089010000000300000400579000000400050097000243","solved_grid":"134257698968143725275986314352798461789614532641325879423579186816432957597861243","profile_id":13},{"recording_id":"312ea415-8efd-45cb-9f3f-dfd7d97600ef","difficulty":"expert","elapsed_seconds":103,"points":1420,"mistakes":1,"puzzle_clues":"070340806060275000049000007002090480090008000000650000984020500120000008500080160","solved_grid":"275349816861275394349861257652793481793418625418652739984126573126537948537984162","profile_id":6},{"recording_id":"de02ea22-f9bf-4a84-8b53-0e997e6bd7cc","difficulty":"expert","elapsed_seconds":226,"points":1420,"mistakes":1,"puzzle_clues":"007000685300000702800200030070108450500700090018050320180000073002009008000005060","solved_grid":"427931685391586742856247139273198456564723891918654327185462973642379518739815264","profile_id":17},{"recording_id":"bf1f15d0-93a3-48a9-991f-406bdbf3bc18","difficulty":"expert","elapsed_seconds":114,"points":1380,"mistakes":2,"puzzle_clues":"400005030000163780000008250206000800709006000030000502800651003000400020307002605","solved_grid":"478295136925163784613748259256314897789526341134879562892651473561437928347982615","profile_id":14}];
// Individual character identities for the locally recorded matchmaking rehearsal.
const nwRecordedFrameWins = [150, 10, 200, 50, 25, 10, 50, 10, 100, 25, 50, 10, 150, 25, 10, 50, 100, 10, 100, 25];
const nwBattleAvatarAssignments=[14,2,19,5,11,0,17,8,3,15,9,12,6,18,1,10,4,16,7,13];
const nwBattleProfiles = ["Vivian", "Marc", "Apple", "peach.exe", "Kath", "Nisa", "Azeera", "milkteeth", "NOODLE404", "Clementine", "3AMToast", "mort.mp3", "Bambi", "sockcriminal", "Jennifer", "Fatin", "Abang", "orbitless", "BUBBLEWRAP", "SundayStatic"] .map((name,i)=>({id:i,name,avatar:nwAvatarChoices[nwBattleAvatarAssignments[i]],frameWins:nwRecordedFrameWins[i]}));
let nwBattleSearchSerial=0, nwLastBattleProfile=-1, nwLastBattleRun=null;
function nwBattleProfileArt(profile,cls=''){
  const id=profile.profile_id??profile.id;
  const wins=nwRecordedFrameWins[id];
  const avatar=nwBattleProfiles[id]?.avatar||profile.avatar;
  if(!nwSeasonFrameTiers.some(t=>t.wins===wins))return nwAvatarImg(avatar,cls);
  return `<span class="nw-equipped-frame nw-monthly-art-frame nw-recorded-frame ${cls}">${nwAvatarImg(avatar,'nw-equipped-avatar')}<img src="frames/nw-monthly-${wins}.png" class="nw-equipped-art" alt=""></span>`;
}
function nwBattleSelectProfile(){
  const pool=nwBattleProfiles.map((_,i)=>i).filter(i=>i!==nwLastBattleProfile);
  const chosen=pool[Math.floor(Math.random()*pool.length)];
  nwLastBattleProfile=chosen;return nwBattleProfiles[chosen];
}
function nwBattleReveal(opponent,profile,previousWorld){
  const serial=++nwBattleSearchSerial;
  evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-battle-theme');
  evDisplay(`${evHeader('BATTLE',()=>{++nwBattleSearchSerial;showBattle()})}<section class="nw-matchmaking"><div class="nw-match-kicker">MONTHLY BATTLE</div><h2 id="nwMatchTitle">SEARCHING FOR AN OPPONENT</h2><div class="nw-radio-matchup"><div class="nw-radio-self"><div class="nw-radio-self-frame">${nwFrameArt(nwProfile().avatar)}</div><small>YOU</small></div><b class="nw-radio-vs">VS</b><div class="nw-match-avatar-ring"><div id="nwMatchAvatar" class="nw-match-avatar">${nwBattleProfileArt(profile,'nw-match-avatar-image')}</div></div></div><strong id="nwMatchName">•••</strong><div id="nwMatchDots" class="nw-match-dots"><i></i><i></i><i></i></div><p id="nwMatchSub">Finding your match...</p><button type="button" id="nwMatchGo" class="nw-match-main" hidden>START MATCH</button><button type="button" id="nwMatchCancel" class="nw-match-cancel">CANCEL</button></section>`);
  let n=0;
  const shuffleTimer=setInterval(()=>{
    if(serial!==nwBattleSearchSerial){clearInterval(shuffleTimer);return}
    const art=evRoot.querySelector('#nwMatchAvatar');if(!art){clearInterval(shuffleTimer);return}
    const sample=nwBattleProfiles[Math.floor(Math.random()*nwBattleProfiles.length)];
    art.innerHTML=nwBattleProfileArt(sample,'nw-match-avatar-image');
    n++;
    if(n>=17){
      clearInterval(shuffleTimer);
      art.innerHTML=nwBattleProfileArt(profile,'nw-match-avatar-image');
      evRoot.querySelector('#nwMatchTitle').textContent='OPPONENT FOUND!';
      evRoot.querySelector('#nwMatchName').textContent=profile.name;
      evRoot.querySelector('#nwMatchDots').hidden=true;
      evRoot.querySelector('#nwMatchSub').textContent=opponent.difficulty.toUpperCase()+' · '+worlds[currentWorld].name;
      const go=evRoot.querySelector('#nwMatchGo');go.hidden=false;
      go.onclick=async()=>{if(serial!==nwBattleSearchSerial||go.disabled)return;
       go.disabled=true;go.textContent='CONNECTING…';
       try{
         const uid=nwCloud?.user()?.id;
         if(!uid)throw Error('Sign in to play Battle.');
         const c=await nwCloud.get();
         const {data,error}=await c.rpc('nw_battle_begin',{p_recording:opponent.recording_id});
         if(error)throw Error(error.message);
         if(serial!==nwBattleSearchSerial||nwCloud?.user()?.id!==uid)return;
         if(!data?.attempt_id||!Number.isInteger(Number(data.playback_seconds)))throw Error('Battle session unavailable');
         opponent.battleAttemptId=data.attempt_id;
         opponent.playback_seconds=Number(data.playback_seconds);
         if(nwBattleActive)nwBattleActive.opponent=opponent;
         evSudokuStart(opponent.difficulty,opponent);
       }catch(e){
         if(serial!==nwBattleSearchSerial)return;
         go.disabled=false;go.textContent='START MATCH';
         const sub=evRoot.querySelector('#nwMatchSub');
         if(sub)sub.textContent='Unable to connect: '+e.message;
       }
      };
    }
  },105);
  evRoot.querySelector('#nwMatchCancel').onclick=()=>{++nwBattleSearchSerial;clearInterval(shuffleTimer);nwBattleReturn()};
}
const nwBattlePracticeKey='nineweird-battle-practice-v1';
let nwBattleActive=null;
function nwBattlePracticeHistory(){const h=nwRead(nwBattlePracticeKey,[]);return Array.isArray(h)?h:[];}
function nwBattleMonthStats(){
  const now=new Date(),year=now.getUTCFullYear(),month=now.getUTCMonth();
  const games=nwBattlePracticeHistory().filter(x=>{const d=new Date(x.at);return d.getUTCFullYear()===year&&d.getUTCMonth()===month;});
  const wins=games.filter(x=>x.outcome==='WIN').length;
  const losses=games.filter(x=>x.outcome==='LOSS').length;
  const draws=games.filter(x=>x.outcome==='DRAW').length;
  return {wins,losses,draws,total:games.length,rate:games.length?Math.round(wins/games.length*100):0};
}
function nwBattleRateCard(st){
  return `<div class="nw-battle-rate-card"><span class="nw-rate-eyebrow">MONTHLY BATTLE WIN RATE</span><div class="nw-rate-row"><span class="nw-rate-wreath">❧</span><strong>${st.rate}%</strong><span class="nw-rate-wreath nw-rate-wreath-right">❧</span></div><div class="nw-rate-record"><span>${st.wins} WINS</span><i>✦</i><span>${st.losses} LOSSES</span>${st.draws?`<i>✦</i><span>${st.draws} DRAWS</span>`:''}</div></div>`;
}

// Use a fresh illustrated room for each practice puzzle; the Sudoku grid and score
// still come from the authentic recorded run. Exclude the number-only Classic rooms.
function nwRandomBattleRoom(){
  const choices=[...nwGroups.usual,...nwGroups.weird].filter(id=>id!=='classic'&&id!=='dark'&&worlds[id]);
  return choices[Math.floor(Math.random()*choices.length)]||'halloween';
}
function nwBattleStart(){
  const levels=['easy','medium','hard','expert','extreme'];
  const difficulty=levels[Math.floor(Math.random()*levels.length)];
  const matching=nwBattlePracticeRuns.filter(r=>r.difficulty===difficulty);
  let profileCandidates=nwBattleProfiles.filter(p=>p.id!==nwLastBattleProfile&&matching.some(r=>r.profile_id===p.id));
  if(!profileCandidates.length)profileCandidates=nwBattleProfiles.filter(p=>matching.some(r=>r.profile_id===p.id));
  const profile=profileCandidates[Math.floor(Math.random()*profileCandidates.length)];
  if(!profile)return;
  let available=matching.filter(r=>r.profile_id===profile.id&&r.recording_id!==nwLastBattleRun);
  if(!available.length)available=matching.filter(r=>r.profile_id===profile.id);
  const opponent=available[Math.floor(Math.random()*available.length)];
  if(!opponent)return;
  nwLastBattleProfile=profile.id;nwLastBattleRun=opponent.recording_id;
  nwGrowingActivity('battles');
   nwTTMissionEvent('battles');
  const previousWorld=currentWorld;
  // Fixed skill tier per profile; playback timing is chosen before play.
  const tier=[3,2,3,1,0,0,1,0,1,2,1,0,2,1,0,1,2,0,2,3][profile.id];
  const bounds={easy:[[240,360],[120,240],[60,120]],medium:[[360,540],[240,360],[120,240]],hard:[[540,780],[360,540],[180,360]],expert:[[720,1080],[480,720],[240,480]],extreme:[[900,1500],[600,900],[300,600]]};
  const range=bounds[difficulty][tier];
  const playback=range?Math.max(opponent.elapsed_seconds,Math.round(range[0]+Math.random()*(range[1]-range[0]))):opponent.elapsed_seconds;
  nwBattleActive={opponent:{...opponent,playback_seconds:playback,display_name:profile.name,avatar:profile.avatar},worldBefore:previousWorld,profile};
  currentWorld=nwRandomBattleRoom();
  nwBattleReveal(nwBattleActive.opponent,profile,previousWorld);
}
function nwBattleReturn(){
  ++nwBattleSearchSerial;
  const previous=nwBattleActive?.worldBefore;
  nwBattleActive=null;
  if(previous&&worlds[previous])currentWorld=previous;
  showBattle();
}
async function nwBattleFinish(s,won,points,elapsed){
  if(s.battleResultSaved)return;
  s.battleResultSaved=true;
  clearInterval(sudokuTimer);
  const opponent=s.practiceOpponent,account=nwCloud?.user()?.id;
  evSudokuLeave();
  applyTheme('hub');evRoot.classList.add('nw-battle-theme');
  evDisplay(`${evHeader('BATTLE',nwBattleReturn)}<section class="nw-battle nw-battle-ready nw-battle-finish"><h2 class="nw-victory-title">VERIFYING RESULT…</h2><p>Your Battle result is syncing.</p></section>`);
  let verified;
  try{
    if(!account||!opponent?.battleAttemptId)throw Error('Missing registered Battle match');
    const c=await nwCloud.get();
    const {data,error}=await c.rpc('nw_battle_finish',{p_attempt:opponent.battleAttemptId,p_solved:won?s.values.join(''):'',p_won:!!won});
    if(error)throw Error(error.message);
    if(nwCloud?.user()?.id!==account)return;
    if(!data||!['WIN','LOSS','DRAW'].includes(data.outcome))throw Error('Invalid verified result');
    verified=data;
  }catch(e){
    s.battleResultSaved=false;
    if(nwCloud?.user()?.id!==account)return;
    evDisplay(`${evHeader('BATTLE',nwBattleReturn)}<section class="nw-battle nw-battle-ready nw-battle-finish"><h2 class="nw-victory-title">SYNCING FAILED</h2><p class="nw-battle-claim-error">${nwEscape(e.message)}</p><div class="nw-battle-result-actions"><button class="nw-battle-start-button" id="nwBattleRetry">RETRY SYNC</button><button class="nw-battle-fine-button" id="nwBattleReturn">BATTLE MENU</button></div></section>`);
    evRoot.querySelector('#nwBattleRetry').onclick=()=>nwBattleFinish(s,won,points,elapsed);
    evRoot.querySelector('#nwBattleReturn').onclick=nwBattleReturn;
    return;
  }
  elapsed=Number(verified.elapsed_seconds);
  const playerScore=won?points:0;
  const outcome=verified.outcome;
  const history=nwBattlePracticeHistory();
  history.push({at:Date.now(),difficulty:s.difficulty,outcome,verified:true,attemptId:opponent.battleAttemptId,playerScore,opponentScore:opponent.points,seconds:elapsed,opponent:opponent.display_name,opponentId:opponent.profile_id});
  nwWrite(nwBattlePracticeKey,history.slice(-1000));
  nwBattleRewardState={account,month:verified.month,wins:Number(verified.wins)||0,claimed:nwBattleRewardState?.account===account&&nwBattleRewardState.month===verified.month?nwBattleRewardState.claimed:[],loaded:!!(nwBattleRewardState?.account===account&&nwBattleRewardState.month===verified.month&&nwBattleRewardState.loaded)};
  void nwBattleLoadRewards(true).catch(e=>console.warn('Battle reward status:',e.message));
  const isWin=outcome==='WIN',isDraw=outcome==='DRAW';
  const resultTitle=isWin?'YOU WON!':isDraw?'IT’S A DRAW!':'OPPONENT WON!';
  const stats=nwBattleMonthStats();
  const opponentWon=!isWin&&!isDraw;
  applyTheme('hub');evRoot.classList.add('nw-battle-theme');
  evDisplay(`${evHeader('BATTLE',nwBattleReturn)}<section class="nw-battle nw-battle-ready nw-battle-finish ${isWin?'nw-victory':isDraw?'nw-draw':'nw-defeat'}">
    <div class="nw-victory-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span><span>✦</span></div>
    <div class="nw-victory-crown" aria-hidden="true">${isWin?'♛':isDraw?'✦':'⚔'}</div>
    <div class="nw-result-kicker">MONTHLY BATTLE · ${nwEscape(s.difficulty.toUpperCase())}</div>
    <h2 class="nw-victory-title">${resultTitle}</h2><div class="nw-result-player-frame">${opponentWon?nwBattleProfileArt(opponent):nwFrameArt(nwProfile().avatar)}</div>
    ${opponentWon?`<strong class="nw-result-winner-name">${nwEscape(opponent.display_name)}</strong>`:''}
    <div class="nw-battle-result-opponent">${opponentWon?nwFrameArt(nwProfile().avatar,'nw-battle-result-avatar'):nwBattleProfileArt(opponent,'nw-battle-result-avatar')}<span>VS <strong>${nwEscape(opponentWon?nwProfile().name:opponent.display_name)}</strong></span></div>
    ${nwBattleRateCard(stats)}
    <div class="nw-battle-result-actions"><button class="nw-battle-start-button" id="nwPracticeAgain">⚔ NEXT BATTLE</button><button class="nw-battle-fine-button" id="nwPracticeBack">BATTLE MENU</button></div>
  </section>`);
  evRoot.querySelector('#nwPracticeAgain').onclick=()=>nwBattleStart();
  evRoot.querySelector('#nwPracticeBack').onclick=nwBattleReturn;
}
function nwBattleProgressTick(s){
  if(!s||!s.practiceOpponent||s.battleResultSaved)return;
  const opp=s.practiceOpponent;
  const seconds=(Date.now()-s.start)/1000;
  // Estimated visual timeline. Old recordings include finish time and mistake
  // totals, but NOT actual per-move timing; this is not a literal input replay.
  const fraction=Math.max(0,Math.min(1,(seconds-2)/Math.max(1,opp.playback_seconds??opp.elapsed_seconds)));
  const eased=fraction<=0?0:fraction<1?Math.max(0,Math.min(.99,fraction*0.91+.04*Math.sin(fraction*10)*Math.sin(Math.PI*fraction))):1;
  const bar=evRoot.querySelector('#nwOpponentProgress');
  if(bar){bar.style.width=(eased*100).toFixed(1)+'%';bar.parentElement.setAttribute('aria-valuenow',String(Math.round(eased*100)))}
  const pct=evRoot.querySelector('#nwOpponentPct');if(pct)pct.textContent=Math.round(eased*100)+'%';
  const err=evRoot.querySelector('#nwOpponentMistakes');
  if(err)err.textContent=Math.min(opp.mistakes,Math.floor(fraction*(opp.mistakes+1)))+' / 3';
  if(fraction>=1&&!s.battleOpponentFinished){
    s.battleOpponentFinished=true;
    nwBattleOpponentWonPopup(s);
  }
}
function nwBattleOpponentWonPopup(s){
  if(s.done||s.battleResultSaved||s.battlePopupShown)return;
  s.battlePopupShown=true;
  const wrapper=document.createElement('div');wrapper.className='nw-battle-overlay';wrapper.id='nwBattleOverlay';
  wrapper.innerHTML=`<div class="nw-battle-modal" role="dialog" aria-modal="true" aria-labelledby="nwLostHeading"><div class="nw-modal-glow">⚔</div><div class="nw-battle-result-opponent">${nwBattleProfileArt(s.practiceOpponent,'nw-battle-result-avatar')}<strong>${nwEscape(s.practiceOpponent.display_name)}</strong></div><h2 id="nwLostHeading">OPPONENT WON!</h2><p>They finished first. Want to finish your puzzle?</p><div class="nw-battle-modal-actions"><button class="nw-modal-secondary" id="nwEndMatch">END MATCH</button><button class="nw-modal-primary" id="nwContinuePuzzle">CONTINUE</button></div></div>`;
  evRoot.appendChild(wrapper);
  const cont=wrapper.querySelector('#nwContinuePuzzle');
  cont.onclick=()=>{wrapper.remove();const board=evRoot.querySelector('#evSudoBoard button');if(board)board.focus({preventScroll:true})};
  wrapper.querySelector('#nwEndMatch').onclick=()=>{wrapper.remove();s.done=true;nwBattleFinish(s,false,0,Math.floor((Date.now()-s.start)/1000))};
  cont.focus({preventScroll:true});
}
function nwBattleSeasonClock(){
 const d=new Date(),end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1),hours=Math.max(0,Math.floor((end-d.getTime())/3600000));
 return Math.floor(hours/24)+'D '+hours%24+'H';
}
// Server-verified Battle tier rewards. Old progress remains available as history,
// but only authenticated, validated match results qualify for Diamond payouts.
let nwBattleRewardState={account:null,month:null,wins:0,claimed:[],loaded:false};
let nwBattleRewardLoading=null,nwBattleRewardError='';
async function nwBattleLoadRewards(force=false){
 const account=nwCloud?.user()?.id,month=nwSeasonId();
 if(!account)throw Error('Sign in to load Battle rewards');
 if(!force&&nwBattleRewardState.loaded&&nwBattleRewardState.account===account&&nwBattleRewardState.month===month)return nwBattleRewardState;
 if(nwBattleRewardLoading)return nwBattleRewardLoading;
 const task=(async()=>{
  const c=await nwCloud.get(),{data,error}=await c.rpc('nw_battle_reward_status');
  if(error)throw Error(error.message);
  if(account!==nwCloud?.user()?.id)return null;
  if(data?.month!==month||!Number.isSafeInteger(Number(data.wins)))throw Error('Unable to confirm current Battle month');
  nwBattleRewardState={account,month,wins:Number(data.wins),claimed:Array.isArray(data.claimed)?data.claimed.map(Number):[],loaded:true};
  nwBattleRewardError='';
  return nwBattleRewardState;
 })();
 nwBattleRewardLoading=task;
 try{return await task}
 catch(e){nwBattleRewardError=e.message;throw e}
 finally{if(nwBattleRewardLoading===task)nwBattleRewardLoading=null}
}
const nwBattleDiamondKey='nineweird-battle-diamond-claims-v1';
function nwBattleDiamondClaims(){const v=nwRead(nwBattleDiamondKey,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function nwBattleDiamondClaimed(month,wins){return nwBattleRewardState.loaded&&nwBattleRewardState.account===nwCloud?.user()?.id&&nwBattleRewardState.month===month&&nwBattleRewardState.claimed.includes(wins);}
function nwBattleDiamondTotal(){return Object.values(nwBattleDiamondClaims()).reduce((sum,n)=>sum+(Number.isSafeInteger(n?.amount)?n.amount:(nwSeasonFrameTiers.some(t=>t.wins===n)?n:0)),0);}
let nwWalletState={user:null,active:false,balance:0};
function nwWalletCurrent(){return nwWalletState.user===nwCloud?.user()?.id&&nwWalletState.active}
async function nwWalletSync(){
 const uid=nwCloud?.user()?.id;
 if(!uid){nwWalletState={user:null,active:false,balance:0};return;}
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_wallet_snapshot');
 if(error)throw Error(error.message);
 if(uid!==nwCloud?.user()?.id)return;
 nwWalletState={user:uid,active:data?.balance!=null,balance:Number(data?.balance)||0};
 const d=nwRead(nwTripleKey,null);
 if(d&&nwWalletCurrent()){
  d.diamonds=nwWalletState.balance;
  nwWrite(nwTripleKey,d);
 }
 nwRefreshVisibleDiamondBalances();
}
const nwWalletMilestoneInflight=new Set();
async function nwWalletClaimMilestones(event,period){
 const uid=nwCloud?.user()?.id,key=uid+':'+event+':'+period;
 if(!nwWalletCurrent()||nwWalletMilestoneInflight.has(key))return;
 nwWalletMilestoneInflight.add(key);
 try{
  const c=await nwCloud.get();
  if(nwCloud?.user()?.id!==uid)return;
  const {data,error}=await c.rpc('nw_wallet_claim_milestones',{p_event:event,p_period:period});
  if(error)throw Error(error.message);
  if(nwCloud?.user()?.id!==uid)return;
  if(Number.isSafeInteger(Number(data?.balance))){
   nwWalletState.balance=Number(data.balance);
   const d=nwRead(nwTripleKey,null);
   if(d){d.diamonds=nwWalletState.balance;nwWrite(nwTripleKey,d)}
   nwRefreshVisibleDiamondBalances();
  }
 }catch(e){console.warn('Verified milestone Diamonds:',e.message)}
 finally{nwWalletMilestoneInflight.delete(key)}
}
async function nwWalletPurchase(item){
 if(!nwWalletCurrent())throw Error('Wallet not available');
 const uid=nwWalletState.user,c=await nwCloud.get();
 const pendingKey='nineweird-wallet-pending-v1:'+uid;
 let pending=null;
 try{pending=JSON.parse(localStorage.getItem(pendingKey)||'null')}catch{}
 if(pending&&pending.item!==item)throw Error('Previous purchase still needs confirmation. Please try it again first.');
 const request=pending?.request||crypto.randomUUID();
 try{localStorage.setItem(pendingKey,JSON.stringify({item,request}))}catch{}
 const {data,error}=await c.rpc('nw_wallet_purchase',{p_item:item,p_request:request});
 if(error)throw Error(error.message);
 if(uid!==nwCloud?.user()?.id)throw Error('Account changed during purchase');
 nwWalletState.balance=Number(data.balance);
 const d=nwRead(nwTripleKey,null);
 if(d){d.diamonds=nwWalletState.balance;nwWrite(nwTripleKey,d)}
 nwRefreshVisibleDiamondBalances();
 try{await nwPrizeSync()}catch(e){
  console.warn('Purchased supplies pending refresh:',e.message);
  const event=item.startsWith('tt_')?'tt':'tg';
  const receipt={id:data.transfer_id,event,period:nwPrizeTransferPeriod(event),item,quantity:data.quantity};
  nwPrizeCache.transfers=[...(nwPrizeCache.transfers||[]),receipt];
  if(event==='tt')nwPrizeApplyTTTransfers();
  else try{document.getElementById('nwGrowingFrame')?.contentWindow?.nwGrowingApplyInventory?.()}catch{}
 }
 try{localStorage.removeItem(pendingKey)}catch{}
 return data;
}
function nwDiamondBalance(){return nwWalletCurrent()?nwWalletState.balance:0;}
function nwClaimBattleDiamond(wins,month){
 // Legacy local-only claim path is disabled; wallet credits require server verification.
 return false;
}
const nwBattleDiamondPrizes={10:100,25:250,50:500,100:1000,150:1500,200:2000};
function nwBattleDiamondPrize(wins){return nwBattleDiamondPrizes[wins]||0;}
function nwDiamondAmount(n){return `<span class="nw-diamond-amount"><img class="nw-diamond-icon" src="assets/currency/diamond.png" alt="Diamonds"><span>${n}</span></span>`;}
function nwBattleRewards(){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-battle-theme');
 const month=nwSeasonId(),account=nwCloud?.user()?.id,
  current=nwBattleRewardState.loaded&&nwBattleRewardState.account===account&&nwBattleRewardState.month===month,
  wins=current?nwBattleRewardState.wins:0;
 if(!current&&!nwBattleRewardLoading&&!nwBattleRewardError){
  void nwBattleLoadRewards().then(()=>{
   if(document.getElementById('nwBattleRewardsRoot'))nwBattleRewards();
  }).catch(e=>{
   if(document.getElementById('nwBattleRewardsRoot'))nwBattleRewards();
  });
 }
 evDisplay(`${evHeader('',showBattle)}<section id="nwBattleRewardsRoot" class="nw-battle nw-battle-ready nw-battle-rewards">
 <div class="nw-radio-ornament" aria-hidden="true">⋆ ☢ ⋆</div>
 <h2>BATTLE REWARDS</h2>
 <p class="nw-radio-season">${current?wins+' VERIFIED MONTHLY WINS':nwBattleRewardError?'VERIFICATION UNAVAILABLE':'LOADING VERIFIED WINS…'} · RESETS IN ${nwBattleSeasonClock()}</p>
 <div class="nw-battle-diamond-balance">YOUR DIAMONDS ${nwDiamondAmount(nwDiamondBalance())}</div>
 <div class="nw-radio-tiers">${nwSeasonFrameTiers.map(t=>{
   const unlocked=current&&wins>=t.wins,claimed=nwBattleDiamondClaimed(month,t.wins);
   return `<div class="nw-radio-tier ${unlocked?'earned':''}"><div class="nw-radio-frame-preview"><img class="nw-radio-reward-art" src="frames/nw-monthly-${t.wins}.png" alt="${nwEscape(t.title)} frame"></div><div><strong>${nwEscape(t.title)}</strong><small>${t.wins} VERIFIED WINS · ${!current?'CHECKING…':unlocked?'UNLOCKED':'LOCKED'}</small><div class="nw-radio-progress"><i style="width:${Math.min(100,wins/t.wins*100)}%"></i></div><div class="nw-battle-diamond-row">${nwDiamondAmount(nwBattleDiamondPrize(t.wins))}${claimed?'<span class="nw-battle-claim-status">CLAIMED</span>':unlocked?`<button type="button" class="nw-battle-claim" data-diamond-claim="${t.wins}">CLAIM</button>`:'<span class="nw-battle-claim-status">LOCKED</span>'}</div></div></div>`;
 }).join('')}</div>
 <p class="nw-battle-claim-error" role="status" ${nwBattleRewardError?'':'hidden'}>${nwEscape(nwBattleRewardError)}</p>
 ${nwBattleRewardError?'<button type="button" class="nw-battle-fine-button" id="nwBattleRetryRewards">RETRY SYNC</button>':''}
 <button class="nw-battle-fine-button" id="nwRadioBack">BACK TO BATTLE</button></section>`);
 evRoot.querySelector('#nwRadioBack').onclick=showBattle;
 const retry=evRoot.querySelector('#nwBattleRetryRewards');
 if(retry)retry.onclick=()=>{nwBattleRewardError='';nwBattleRewards()};
 evRoot.querySelectorAll('[data-diamond-claim]').forEach(b=>b.onclick=async()=>{
  if(b.disabled)return;
  const uid=nwCloud?.user()?.id,tier=Number(b.dataset.diamondClaim);
  b.disabled=true;b.textContent='CLAIMING…';
  try{
   const c=await nwCloud.get();
   if(nwCloud?.user()?.id!==uid||month!==nwSeasonId())throw Error('Account or reward month changed');
   const {data,error}=await c.rpc('nw_battle_claim_reward',{p_tier:tier});
   if(error)throw Error(error.message);
   if(nwCloud?.user()?.id!==uid)return;
   nwBattleRewardState.claimed=[...new Set([...nwBattleRewardState.claimed,tier])];
   if(Number.isSafeInteger(Number(data?.balance))&&nwWalletCurrent()){
    nwWalletState.balance=Number(data.balance);
    const d=nwRead(nwTripleKey,null);if(d){d.diamonds=nwWalletState.balance;nwWrite(nwTripleKey,d)}
    nwRefreshVisibleDiamondBalances();
   }
   if(b.isConnected)nwBattleRewards();
  }catch(e){
   if(!b.isConnected)return;
   b.disabled=false;b.textContent='CLAIM';
   const msg=evRoot.querySelector('.nw-battle-claim-error');
   if(msg){msg.hidden=false;msg.textContent='Unable to claim reward: '+e.message}
  }
 });
}
function showBattle(){
  evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-battle-theme');
  const d=new Date(),month=d.toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const stats=nwBattleMonthStats(),next=nwSeasonFrameTiers.find(t=>stats.wins<t.wins);
  evDisplay(`${evHeader('',showCategories)}<section class="nw-battle nw-battle-ready nw-battle-hub">
    <div class="nw-radio-ornament" aria-hidden="true">⋆ ☢ ⋆</div><div class="nw-radio-mascots" aria-hidden="true"><img src="assets/alien/02_radioactive_milk.png" alt=""><img src="assets/solarsick/04_nauseous_planet.png" alt=""></div>
    <h2><span>BATTLE</span></h2><div class="nw-radio-tagline">ONE PUZZLE. TWO PLAYERS.</div>
    <div class="nw-season-pill">${month.toUpperCase()} · RESETS IN ${nwBattleSeasonClock()}</div>
    ${nwBattleRateCard(stats)}
    <div class="nw-radio-next">${next?`<div><span>NEXT: ${nwEscape(next.title.toUpperCase())}</span><b>${stats.wins} / ${next.wins}</b></div><div class="nw-radio-progress"><i style="width:${Math.min(100,stats.wins/next.wins*100)}%"></i></div>`:'ALL MONTHLY TITLES UNLOCKED'}</div>
    <button type="button" class="nw-battle-start-button" id="nwStartRandomBattle">ϟ FIND OPPONENT</button><button type="button" class="nw-battle-fine-button" id="nwRadioRewards">.✦ ݁˖ BATTLE REWARDS</button>
  </section>`);
  evRoot.querySelector('#nwStartRandomBattle').onclick=()=>nwBattleStart();evRoot.querySelector('#nwRadioRewards').onclick=nwBattleRewards;
}
// Universal event boundaries use UTC, not the player's local calendar.
function nwEventPhase(){return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getUTCDay()]}
function nwEventStatus(key){
  const day=nwEventPhase();
  if(key==='shelf')return ['monday','tuesday','wednesday'].includes(day)?'SCHEDULED DAY':'MON–WED';
  if(key==='double')return ['friday','saturday','sunday'].includes(day)?'SCHEDULED DAY':day==='thursday'?'PARTNER DAY':'FRI–SUN';
  return 'ALL WEEK';
}
function nwShowEvents(){
  evSudokuLeave();applyTheme('hub');
  evDisplay(`${evHeader('EVENTS',showCategories)}<section class="nw-events-panel">
    <p class="nw-events-intro">A little Sudoku. A little chaos. Something for every day.</p>
    <div class="nw-event-schedule"><span>MON–WED <b>TRIPLE TROUBLE</b></span><span>TUE–THU <b>THEY'RE GROWING!</b></span><span>THU <b>TEAM UP</b></span><span>FRI–SUN <b>DOUBLE TROUBLE</b></span></div>
    <button class="nw-event-tile" id="nwEventShelf"><span class="nw-event-symbol nw-triple-event-icon" aria-hidden="true"><img src="assets/ugly/02_chomps.png" alt=""></span><span><strong>TRIPLE TROUBLE</strong><small>Three-day tile matching · Clear triples, climb stages.</small><em>${nwEventStatus('shelf')}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>
    <button class="nw-event-tile nw-growing-event" id="nwEventGrowing"><span class="nw-growing-planet" aria-hidden="true"><span class="nw-growing-ring"></span><span class="nw-growing-planet-title">THEY’RE<br>GROWING!</span></span><span><strong>THEY'RE GROWING!</strong><small>Tuesday–Thursday · 37-hex creature evolution.</small><em>${nwLobbyEventStatus('growing').label}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>
    <button class="nw-event-tile" id="nwEventDouble"><span class="nw-event-symbol nw-double-event-icon" aria-hidden="true"><img src="assets/double-trouble/shaggy-twins.png" alt=""></span><span><strong>DOUBLE TROUBLE</strong><small>Friday–Sunday · 2v2 team Sudoku. Thursday is partner day.</small><em>${nwEventStatus('double')}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>

  </section>`);
  evRoot.querySelector('#nwEventShelf').onclick=nwTripleHome;
  evRoot.querySelector('#nwEventDouble').onclick=()=>nwShowEventDetail('double');
  evRoot.querySelector('#nwEventGrowing').onclick=nwGrowingOpen;
}



// LET ME OUT! — permanent Blacklight Candy sliding-block mini-game.
// Isolated iframe retains its complete approved gameplay, typography and electric Gloop art.
function nwLetMeOutOpen(){
 evSudokuLeave();applyTheme('hub');
 evRoot.classList.add('nw-let-shell');
 evDisplay(`${evHeader('LET ME OUT!',showCategories)}<section class="nw-let-frame-container"><iframe id="nwLetMeOutFrame" title="LET ME OUT! — sliding block mini game" src="let-me-out/index.html?v=8-varied-move-limits" loading="eager"></iframe></section>`);
 nwResetViewToTop();
}

function nwGrowingBack(){
 const frame=document.getElementById('nwGrowingFrame');
 try {if(frame?.contentWindow?.nwGrowingNavigateBack?.())return;} catch(e){console.warn('Growing event navigation',e);}
 showCategories();
}
function nwGrowingOpen(){void nwLoadEventBoosters('tg');
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-growing-live-shell');
 evDisplay(`${evHeader("THEY'RE GROWING!",nwGrowingBack)}<section class="nw-growing-frame-container"><iframe id="nwGrowingFrame" title="They're Growing! — playable hex evolution event" src="growing/index.html?v=67-tg-smoke-soft-edges" loading="eager" allow="fullscreen"></iframe></section>`);
 nwResetViewToTop();
}
// This version is local-first for the game owner's beta: NO Supabase claim/payment sync.
/* Tournament verifier bridge. Player-facing gameplay remains unchanged. */
let nwGrowingVerifyBusy=false;
let nwGrowingLastVerified={account:null,period:null,score:0,actions:0};
async function nwGrowingSeed(){
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_anticheat_tg_seed');
 if(error)throw Error(error.message);
 return data;
}
async function nwGrowingVerifyScore(period,score,actions){
 const account=nwCloud?.user()?.id;
 if(!account||nwGrowingVerifyBusy||!Array.isArray(actions)||!actions.length)return;
 if(nwGrowingLastVerified.account===account&&nwGrowingLastVerified.period===period&&nwGrowingLastVerified.actions>=actions.length&&nwGrowingLastVerified.score>=score)return;
 nwGrowingVerifyBusy=true;
 try{
  const c=await nwCloud.get();
  if(nwCloud?.user()?.id!==account)return;
  const {data,error}=await c.functions.invoke('nw-verify-tournament',{body:{event:'tg',period,score,actions}});
  if(error||!data?.verified)throw Error(data?.error||error?.message||'Event verification unavailable');
  if(nwCloud?.user()?.id!==account)return;
  nwGrowingLastVerified={account,period,score:data.score,actions:actions.length};void nwWalletClaimMilestones('tg',period);
 }finally{nwGrowingVerifyBusy=false}
}
function nwGrowingUserId(){return window.nwCloud?.user()?.id || 'guest';}
function nwGrowingActivityKey(){return 'nineweird-growing-activity-v1';}
function nwGrowingActivity(type){
 if(!['battles','worlds','played'].includes(type))return;
 const k=nwGrowingActivityKey(),today=new Date().toISOString().slice(0,10),saved=nwRead(k,null),o=saved?.day===today?saved:{day:today,battles:0,worlds:0,played:0};
 if(type==='battles'||type==='worlds')o[type]=Math.min(1000,Math.max(0,Number(o[type])||0)+1);
 o.played=1;nwWrite(k,o);
}
// Keep visible Diamond counters in sync when the embedded Growing game awards or spends Diamonds.
// Update only live counter text; do not rebuild screens, interrupt gameplay or restart animations.
function nwRefreshVisibleDiamondBalances(){
 const amount=nwDiamondBalance().toLocaleString();
 evRoot.querySelectorAll('.nw-shared-wallet .nw-diamond-amount > span, .nw-lobby-money .nw-diamond-amount > span, .nw-lobby-top-right .nw-diamond-amount > span').forEach(label=>{label.textContent=amount;});
}
function nwGrowingAdjustDiamonds(delta){
 // Old browser-authorized Diamond modification is intentionally retired.
 // Tournament prizes and verified score milestones credit Supabase instead.
 return false;
}


// Double Trouble — After Hours. Local recorded-match edition; no cloud invitations or prizes.
const nwDoublePracticeKey='nineweird-double-practice-v2';
let nwDoublePracticeActive=false,nwDoubleWorldBefore=null,nwDoubleTimer=null,nwDoubleMemory={},nwDoubleLastRoom=null;
const nwDoubleDay=86400000;
function nwDoublePeriod(now=Date.now()){
 const t=new Date(now),mid=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()),day=t.getUTCDay();
 const fri=mid-((day+2)%7)*nwDoubleDay+(day===4?7*nwDoubleDay:0);
 return {id:new Date(fri).toISOString().slice(0,10),start:fri,end:fri+3*nwDoubleDay,phase:day===4?'pair':['5','6','0'].includes(String(day))?'active':'waiting',nextPair:fri+6*nwDoubleDay};
}
function nwDoubleStore(){const key=nwPlayerStorageKey(nwDoublePracticeKey)||'guest';return nwRead(nwDoublePracticeKey,nwDoubleMemory[key]||{matches:{}})}
function nwDoubleSave(d){const key=nwPlayerStorageKey(nwDoublePracticeKey)||'guest';nwDoubleMemory[key]=d;nwWrite(nwDoublePracticeKey,d)}
function nwDoublePracticeData(){return nwDoubleStore().matches[nwDoublePeriod().id]||null}
function nwDoublePick(partner=null){
 const pool=nwBattleProfiles.filter(p=>nwBattlePracticeRuns.some(r=>r.profile_id===p.id));
 const shuffle=arr=>{arr=[...arr];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
 const first=pool.find(p=>p.id===partner)||shuffle(pool)[0];if(!first)return null;
 const chosen=[first,...shuffle(pool.filter(p=>p.id!==first.id)).slice(0,2)];if(chosen.length!==3)return null;
 const period=nwDoublePeriod(),d=nwDoubleStore();
 if(d.matches[period.id])return d.matches[period.id];
 const record={id:period.id,start:period.start,end:period.end,teamPoints:0,userPuzzles:0,participants:chosen.map((p,i)=>{const runs=nwBattlePracticeRuns.filter(r=>r.profile_id===p.id),r=runs[Math.floor(Math.random()*runs.length)];return {id:p.id,name:p.name,avatar:p.avatar,points:r.points,at:period.start+Math.max(1,r.elapsed_seconds||60)*1000+i*15000}}),claimed:false};
 d.matches[period.id]=record;nwDoubleSave(d);return record;
}
function nwDoubleScores(m,now=Date.now()){const p=m.participants.map(x=>now>=x.at?x.points:0);return {p,ours:m.teamPoints+p[0],theirs:p[1]+p[2]}}
function nwDoubleFmt(n){return Number(n||0).toLocaleString()}
function nwDoubleCountdown(ms){const n=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(n/86400)}D : ${String(Math.floor(n/3600)%24).padStart(2,'0')}H : ${String(Math.floor(n/60)%60).padStart(2,'0')}M : ${String(n%60).padStart(2,'0')}S`}
function nwDoubleButton(id,text,secondary=false){return `<button type="button" id="${id}" class="nw-double-btn${secondary?' secondary':''}">${text}</button>`}
function nwDoubleTheme(){applyTheme('hub');evRoot.classList.add('nw-double-theme')}
function nwDoubleExit(){clearInterval(nwDoubleTimer);nwDoublePracticeActive=false;if(nwDoubleWorldBefore&&worlds[nwDoubleWorldBefore])currentWorld=nwDoubleWorldBefore;nwDoubleWorldBefore=null;showCategories()}
function nwDoublePlayer(p,points,self=false){return `<div class="nw-double-person">${self?nwFrameArt(p.avatar,'nw-double-avatar'):nwBattleProfileArt(p,'nw-double-avatar')}<strong>${nwEscape(p.name)}</strong><span>${nwDoubleFmt(points)}</span></div>`}
function nwDoubleTeams(m){const {p,ours,theirs}=nwDoubleScores(m),pct=ours+theirs?100*ours/(ours+theirs):50,delta=ours-theirs;return `<div class="nw-double-teams"><article class="nw-double-team"><div class="nw-double-team-head"><small>YOUR TEAM</small><strong>${nwDoubleFmt(ours)}</strong></div><div class="nw-double-people">${nwDoublePlayer(nwProfile(),m.teamPoints,true)}${nwDoublePlayer(m.participants[0],p[0])}</div></article><div class="nw-double-vs">VS</div><article class="nw-double-team rival"><div class="nw-double-team-head"><small>RIVAL TEAM</small><strong>${nwDoubleFmt(theirs)}</strong></div><div class="nw-double-people">${nwDoublePlayer(m.participants[1],p[1])}${nwDoublePlayer(m.participants[2],p[2])}</div></article><div class="nw-double-track"><i style="width:${pct}%"></i></div><div class="nw-double-margin">${delta>0?'YOUR TEAM LEADS BY '+nwDoubleFmt(delta):delta<0?'RIVALS LEAD BY '+nwDoubleFmt(-delta):'TIED'}</div></div>`}
function nwDoubleLaunch(difficulty){const m=nwDoublePracticeData();if(nwDoublePeriod().phase!=='active'||!m||Date.now()>=m.end){nwDoublePracticeScreen();return}if(nwDoubleWorldBefore===null)nwDoubleWorldBefore=currentWorld;nwDoublePracticeActive=true;const pool=[...nwGroups.usual,...nwGroups.weird].filter(id=>id!=='classic'&&id!=='dark'&&worlds[id]);const fresh=pool.filter(id=>id!==nwDoubleLastRoom);const choices=fresh.length?fresh:pool;currentWorld=choices[Math.floor(Math.random()*choices.length)]||'halloween';nwDoubleLastRoom=currentWorld;evSudokuStart(difficulty);if(sudoku)sudoku.doubleMatchId=m.id;}
function nwDoublePracticeScreen(){
 clearInterval(nwDoubleTimer);evSudokuLeave();nwDoublePracticeActive=false;nwDoubleTheme();const period=nwDoublePeriod(),data=nwDoubleStore(),m=data.matches[period.id],past=Object.values(data.matches).filter(x=>x.end<=Date.now()).sort((a,b)=>b.end-a.end),last=past[0];
 const active=period.phase==='active',pair=period.phase==='pair';
 const title=`<div class="nw-double-decoration" aria-hidden="true">⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆</div><div class="nw-double-mascots"><img class="dt-shaggy-twins" src="assets/double-trouble/shaggy-twins.png" alt="Shaggy twins in matching baby-blue gingham dresses"></div><h2 class="nw-double-logo nw-double-glitch"><span>DOUBLE<br>TROUBLE</span><span class="nw-double-glitch-copy" aria-hidden="true">DOUBLE<br>TROUBLE</span><span class="nw-double-glitch-copy second" aria-hidden="true">DOUBLE<br>TROUBLE</span></h2><div class="nw-double-kicker">FRIDAY — SUNDAY</div>`;
 const countdown=`<div class="nw-double-count"><small>${active?'EVENT ENDS IN':pair?'COMPETITION STARTS IN':'PARTNER DAY STARTS IN'}</small><strong id="nwDoubleClock"></strong></div>`;
 const selection=`<h3>PARTNERS IN CRIME</h3><div class="nw-double-people">${nwDoublePlayer(nwProfile(),0,true)}<div class="nw-double-person"><div class="nw-double-avatar unknown">?</div><strong>PARTNER</strong></div></div>${nwDoubleButton('nwDoubleRandom','▹ RANDOM PARTNER')}${nwDoubleButton('nwDoubleInvite','CHOOSE A PARTNER',true)}${pair?nwDoubleButton('nwDoubleFriends','PAIR WITH A FRIEND',true):''}<div id="nwDoublePicker" hidden><label for="nwDoubleSelect">CHOOSE YOUR PARTNER</label><select id="nwDoubleSelect">${nwBattleProfiles.map(p=>`<option value="${p.id}">${nwEscape(p.name)}</option>`).join('')}</select>${nwDoubleButton('nwDoubleConfirm','▹ TEAM UP')}</div>`;
 evDisplay(`${evHeader('',nwDoubleExit)}<section class="nw-double nw-double-home">${title}${countdown}${active||pair?(m?`<div id="nwDoubleScoreboard">${nwDoubleTeams(m)}</div><p id="nwDoubleAlert" class="nw-double-alert" role="status" hidden></p>${active?nwDoubleButton('nwDoublePlay','▹ PLAY NOW'):'<p class="nw-double-note">Your team is ready for Friday.</p>'}`:selection):'<p class="nw-double-note">Team up on Thursday. Earn points together all weekend.</p>'}${nwDoubleButton('nwDoubleRewards','.✦ ݁˖ REWARDS',true)}</section>`);
 const by=id=>evRoot.querySelector('#'+id);if(by('nwDoubleRandom'))by('nwDoubleRandom').onclick=()=>{nwDoublePick();nwDoublePracticeScreen()};if(by('nwDoubleInvite'))by('nwDoubleInvite').onclick=()=>{by('nwDoublePicker').hidden=false};if(by('nwDoubleConfirm'))by('nwDoubleConfirm').onclick=()=>{nwDoublePick(+by('nwDoubleSelect').value);nwDoublePracticeScreen()};
 if(by('nwDoubleFriends'))by('nwDoubleFriends').onclick=()=>nwShowFriends('list',nwDoublePracticeScreen);
 if(by('nwDoublePlay'))by('nwDoublePlay').onclick=nwDoubleDifficulty;by('nwDoubleRewards').onclick=nwDoubleRewards;
 let lead=m?Math.sign(nwDoubleScores(m).ours-nwDoubleScores(m).theirs):0;
 const tick=()=>{if(!by('nwDoubleClock')){clearInterval(nwDoubleTimer);return}const now=Date.now(),p=nwDoublePeriod(now);if(p.id!==period.id||p.phase!==period.phase){nwDoublePracticeScreen();return}by('nwDoubleClock').textContent=nwDoubleCountdown((active?period.end:pair?period.start:period.nextPair)-now);if(m&&active&&by('nwDoubleScoreboard')){const s=nwDoubleScores(m,now),next=Math.sign(s.ours-s.theirs);if(next<0&&lead>=0){by('nwDoubleAlert').hidden=false;by('nwDoubleAlert').textContent='Your rivals have taken the lead!'}lead=next;by('nwDoubleScoreboard').innerHTML=nwDoubleTeams(m)}};tick();nwDoubleTimer=setInterval(tick,1000);
}
function nwDoubleDifficulty(){
 clearInterval(nwDoubleTimer);if(nwDoublePeriod().phase!=='active'||!nwDoublePracticeData()){nwDoublePracticeScreen();return}nwDoubleTheme();
 evDisplay(`${evHeader('',nwDoublePracticeScreen)}<section class="nw-double"><h2 class="nw-double-subtitle">CHOOSE YOUR DIFFICULTY</h2><div class="nw-double-levels">${Object.entries(difficulties).map(([d,v])=>`<button class="nw-double-btn nw-double-level" data-double-difficulty="${d}"><span>▹ ${d.toUpperCase()}</span><small>${nwDoubleFmt(v.points)} PTS</small></button>`).join('')}</div></section>`);
 evRoot.querySelectorAll('[data-double-difficulty]').forEach(b=>b.onclick=()=>nwDoubleLaunch(b.dataset.doubleDifficulty));
}
function nwDoubleReward(m,now=Date.now()){
 const tally=nwDoubleScores(m,Math.min(now,m.end));
 const winning=tally.ours>=tally.theirs,first=m.teamPoints>=tally.p[0];
 return {eligible:m.teamPoints>=3500,winning,first,amount:m.teamPoints>=3500?(winning?(first?1000:700):(first?500:200)):0,finished:now>=m.end};
}
function nwDoubleRewards(){
 clearInterval(nwDoubleTimer);nwDoubleTheme();
 const d=nwDoubleStore(),m=d.matches[nwDoublePeriod().id],hasHistory=Object.values(d.matches).some(x=>x.end<=Date.now());
 const tier=(name,amounts,rival=false)=>`<article class="nw-double-prize-card${rival?' rival':''}"><div class="nw-double-prize-emblem" aria-hidden="true">${rival?'☾':'✦'}</div><h3>${name}</h3><div class="nw-double-prize-amount">${nwDiamondAmount(amounts[0])}</div><small>TOP CONTRIBUTOR</small><div class="nw-double-prize-divider"></div><div class="nw-double-prize-secondary">${nwDiamondAmount(amounts[1])}</div><small>OTHER TEAMMATE</small></article>`;
 const progress=m?`<div class="nw-double-prize-progress"><div class="nw-double-prize-progress-top"><span>YOUR PROGRESS</span><strong>${nwDoubleFmt(m.teamPoints)} / 3,500</strong></div><div class="nw-double-eligibility-track" role="progressbar" aria-label="Personal qualifying points" aria-valuemin="0" aria-valuemax="3500" aria-valuenow="${Math.min(3500,Math.max(0,m.teamPoints))}"><i style="width:${Math.max(0,Math.min(100,m.teamPoints/35))}%"></i></div><small>${m.teamPoints>=3500?'QUALIFIED ✓':nwDoubleFmt(3500-m.teamPoints)+' more points to qualify'}</small></div>`:'';
 evDisplay(`${evHeader('',nwDoublePracticeScreen)}<section class="nw-double nw-double-reward-page nw-double-spoils"><div class="nw-double-spoils-light left" aria-hidden="true"></div><div class="nw-double-spoils-light right" aria-hidden="true"></div><div class="nw-double-spoils-content"><div class="nw-double-spoils-decor" aria-hidden="true">⋆｡☁︎｡ ﾟ☾ ﾟ⋆</div><h2 class="nw-double-spoils-title">THE SPOILS</h2><p class="nw-double-spoils-sub">DOUBLE TROUBLE · WEEKEND REWARDS</p><div class="nw-double-prize-grid">${tier('WINNERS',[1000,700])}${tier('LOSERS',[500,200],true)}</div><p class="nw-double-spoils-rule">✧ Earn 3,500 personal points to qualify.</p>${progress}<small class="nw-double-spoils-footnote">Prizes are determined when the event ends.</small>${hasHistory?nwDoubleButton('nwDoubleHistory','EVENT HISTORY',true):''}</div></section>`);
 const history=evRoot.querySelector('#nwDoubleHistory');if(history)history.onclick=nwDoubleHistory;
}
function nwDoubleHistory(){clearInterval(nwDoubleTimer);nwDoubleTheme();const matches=Object.values(nwDoubleStore().matches).filter(m=>m.end<=Date.now()).sort((a,b)=>b.end-a.end);evDisplay(`${evHeader('EVENT HISTORY',nwDoubleRewards)}<section class="nw-double"><h2>EVENT HISTORY</h2>${matches.length?matches.map(m=>{const s=nwDoubleScores(m,m.end);return `<button class="nw-double-btn secondary" data-double-result="${m.id}">${m.id} · ${s.ours>s.theirs?'VICTORY':s.ours<s.theirs?'DEFEAT':'DRAW'} · ${nwDoubleFmt(s.ours)} / ${nwDoubleFmt(s.theirs)}</button>`}).join(''):'<p>No completed events yet.</p>'}</section>`);evRoot.querySelectorAll('[data-double-result]').forEach(b=>b.onclick=()=>nwDoubleResult(b.dataset.doubleResult))}
function nwDoubleResult(id){clearInterval(nwDoubleTimer);nwDoubleTheme();const d=nwDoubleStore(),m=d.matches[id];if(!m||m.end>Date.now()){nwDoublePracticeScreen();return}const s=nwDoubleScores(m,m.end),win=s.ours>s.theirs;evDisplay(`${evHeader('EVENT RESULT',nwDoublePracticeScreen)}<section class="nw-double"><h2>${win?'VICTORY':s.ours===s.theirs?'DRAW':'DEFEAT'}</h2><div class="nw-double-kicker">${nwEscape(m.id)}</div>${nwDoubleTeams(m)}${nwDoubleButton('nwDoubleResultRewards','.✦ ݁˖ REWARDS',true)}${nwDoubleButton('nwDoubleBack','BACK TO EVENT',true)}</section>`);evRoot.querySelector('#nwDoubleResultRewards').onclick=nwDoubleRewards;evRoot.querySelector('#nwDoubleBack').onclick=nwDoublePracticeScreen}
function nwDoublePracticeAfterSudoku(s,won,pts){
 const d=nwDoubleStore(),m=d.matches[s.doubleMatchId];const credited=!!(won&&m&&Date.now()<m.end&&!s.doubleCredited);if(credited){m.teamPoints+=pts;m.userPuzzles++;s.doubleCredited=true;nwDoubleSave(d)}nwDoublePracticeActive=false;nwDoubleTheme();const score=m?nwDoubleScores(m):{ours:0};
 evDisplay(`${evHeader('',nwDoublePracticeScreen)}<section class="nw-double nw-double-completion"><h2 class="nw-double-result-title">${won?'NICELY DONE!':'PUZZLE NOT COMPLETED'}</h2><div class="nw-double-kicker">POINTS CONTRIBUTED</div><div class="nw-double-earned">+${nwDoubleFmt(credited?pts:0)}</div>${won&&!credited?'<p>The event has ended. Your regular Sudoku points are safe.</p>':''}<div class="nw-double-summary"><div>YOUR CONTRIBUTION <strong>${nwDoubleFmt(m?.teamPoints)}</strong></div><div>TEAM TOTAL <strong>${nwDoubleFmt(score.ours)}</strong></div></div>${nwDoublePeriod().phase==='active'?nwDoubleButton('nwDoubleAgain','▹ '+(won?'PLAY AGAIN':'RETRY')):''}${nwDoublePeriod().phase==='active'?nwDoubleButton('nwDoubleChangeDifficulty','CHANGE DIFFICULTY',true):''}${nwDoubleButton('nwDoubleContinue','BACK TO EVENT',true)}</section>`);
 const again=evRoot.querySelector('#nwDoubleAgain');if(again)again.onclick=()=>nwDoubleLaunch(s.difficulty);const change=evRoot.querySelector('#nwDoubleChangeDifficulty');if(change)change.onclick=nwDoubleDifficulty;evRoot.querySelector('#nwDoubleContinue').onclick=nwDoublePracticeScreen;
}
function nwShowEventDetail(type){
  if(type==='weekly'){nwShowTrophy();return}
  if(type==='double'){nwDoublePracticeScreen();return}
  evSudokuLeave();applyTheme('hub');
  const content={
    shelf:{title:'SHELF CONTROL',icon:'🧸',when:'MONDAY–WEDNESDAY',description:'Move illustrated pieces between shelves. Put three identical pieces together on one shelf and they clear automatically. Hidden pieces appear as the front pieces move. Clear the shelves before the timer expires.',foot:'A separate sorting mini-game using Nine & Weird artwork. This preview does not launch a playable event.'},
    weekly:{title:'WEEKLY LEADERBOARD',icon:'🏆',when:'MONDAY–SUNDAY',description:'Complete regular Sudoku puzzles in any room and at any difficulty to earn weekly ranking points. The top 10 and your own position will appear here when rankings are live.',foot:'Ranking points are separate from spendable coins. Rewards and leaderboard data are not live yet.'}
  };
  const e=content[type]||content.weekly;
  evDisplay(`${evHeader(e.title,()=>nwShowTrophy())}<section class="nw-events-panel nw-events-detail"><div class="nw-detail-icon" aria-hidden="true">${e.icon}</div><h2>${e.title}</h2><div class="nw-season-pill">${e.when}</div><p>${e.description}</p><p class="nw-muted">${e.foot}</p><p class="nw-event-coming">COMING SOON</p><p class="nw-feature-disclaimer">Event timing follows 00:00 UTC (08:00 Malaysia time).</p></section>`);
}

// Triple Trouble: independent layered 3-match puzzle event. No Sudoku state mutated.
const nwTripleKey='nineweird-triple-economy-beta-v1';
const nwTTOldKey='nineweird-triple-stage-v1';
const nwTripleArtRooms=['halloween','patissserie','christmas','fairy','olympus','nineties','weird','ugly','alien','diner','bodyparts','deepsea','solarsick','dontunwrap','unpreparedchristmas','underthebed','balloonwrong','donttakewater','baggagehell','cakefail'];
// Preserve the original room indices so existing saved tiles keep their artwork.
const nwTripleAllowedRooms=['weird','ugly','alien','diner','solarsick','underthebed','patissserie','halloween','nineties','dontunwrap'];
let nwTriple=null;
const nwTTMilestones=[[2,[['diamonds',20]]],[4,[['shuffle',1]]],[6,[['ticket',2]]],[8,[['magic',1]]],[10,[['diamonds',40]]],[12,[['shuffle',1]]],[14,[['ticket',3]]],[16,[['magic',1]]],[18,[['diamonds',60]]],[20,[['shuffle',2]]],[22,[['ticket',5]]],[24,[['magic',2]]],[26,[['diamonds',100]]],[28,[['shuffle',2],['magic',2]]],[30,[['diamonds',200],['ticket',10]]]];
const nwTTPrices={undo:60,shuffle:80,magic:100,ticket:100};
const nwTTNames={undo:'Undo',shuffle:'Shuffle',magic:'Magic Clear',ticket:'Event Ticket',diamonds:'Diamonds'};
const nwTTPacks=[{price:'4.90',tickets:10,diamonds:200,shuffle:1,magic:0},{price:'9.90',tickets:30,diamonds:500,shuffle:2,magic:1},{price:'23.90',tickets:100,diamonds:1500,shuffle:3,magic:3}];
function nw433ComingSoon(back){nwTTModal('Coming Soon!','<p>This feature is not available just yet. Stay tuned for a future update!</p>',[{label:'OKAY',run:back}]);}
function nwTTNow(){return Date.now()}
function nwTripleWeek(now=nwTTNow()){const t=new Date(now);const mon=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate())-((t.getUTCDay()+6)%7)*86400000;return new Date(mon).toISOString().slice(0,10)}
function nwTripleInEvent(){return [1,2,3].includes(new Date(nwTTNow()).getUTCDay())}
function nwTTDay(now){return new Date(now).toISOString().slice(0,10)}
function nwTTNew(week,day,now,delta=0){return {week,day,stage:1,best:0,diamondDelta:delta,diamonds:nwBattleDiamondTotal()+delta,natural:10,extra:0,next:0,ads:0,spent:0,boosters:{undo:0,shuffle:0,magic:0},welcomed:false,claimed:[],packs:[],notices:[]}}
function nwTTSync(old,now){const week=nwTripleWeek(now),day=nwTTDay(now);const delta=Number.isSafeInteger(old?.diamondDelta)?old.diamondDelta:0;if(!old||old.week!==week){const fresh=nwTTNew(week,day,now,delta);
 if(old){fresh.extra=Math.max(0,Number(old.extra)||0);for(const k of ['undo','shuffle','magic'])fresh.boosters[k]=Math.max(0,Number(old.boosters?.[k])||0);}
 if(nwWalletCurrent())fresh.diamonds=nwWalletState.balance;return fresh;}const d=old;d.diamonds=nwWalletCurrent()?nwWalletState.balance:Math.max(0,nwBattleDiamondTotal()+delta);if(d.day!==day){d.day=day;d.natural=10;d.next=0;d.ads=0;}if(d.natural<10&&d.next>0&&now>=d.next){const n=Math.min(10-d.natural,1+Math.floor((now-d.next)/3600000));d.natural+=n;d.next=d.natural===10?0:d.next+n*3600000;}return d}
function nwTripleData(){const old=nwRead(nwTripleKey,null),d=nwTTSync(old,nwTTNow());if(!old){const legacy=nwRead(nwTTOldKey,null);if(legacy?.week===d.week&&Number.isSafeInteger(legacy.best)&&legacy.best>=0){d.best=legacy.best;d.stage=d.best+1;}}nwTripleSave(d);return d}
function nwTripleSave(obj){nwWrite(nwTripleKey,obj)}
function nwTTCount(d){return d.natural+d.extra}
function nwTTSpendTicket(d,now=nwTTNow()){if(d.natural>0){if(d.natural===10||!d.next)d.next=now+3600000;d.natural--;return true;}if(d.extra>0){d.extra--;return true;}return false}
function nwTTGrant(d,kind,n){if(kind==='diamonds'){/* Credited after server-verifiable stage completion. */}else if(kind==='ticket')d.extra+=n;else d.boosters[kind]+=n;}
function nwTTNotice(d,title,items){d.notices.push({title,items});}
function nwTTClear(d,stage){d.best=Math.max(d.best,stage);d.stage=Math.max(d.stage,stage+1);for(const [m,items] of nwTTMilestones){if(d.best>=m&&!d.claimed.includes(m)){d.claimed.push(m);for(const [k,n] of items)nwTTGrant(d,k,n);nwTTNotice(d,'Stage '+m+' cleared!',items);}}delete d.active;}
function nwTTWelcome(d){if(d.welcomed||!nwTripleInEvent())return false;d.welcomed=true;for(const k of ['undo','shuffle','magic'])nwTTGrant(d,k,1);nwTTNotice(d,'Welcome gifts claimed!',[['undo',1],['shuffle',1],['magic',1]]);if(d.best>0)nwTTClear(d,d.best);return true;}
function nwTTPurchase(d,kind,source){if(!nwTripleInEvent()||source!=='diamonds')return 'Coming soon.';const cost=nwTTPrices[kind];if(!cost||d.diamonds<cost)return 'Not enough Diamonds.';if(kind==='ticket'&&d.spent+cost>10000)return 'Event ticket exchange limit reached.';d.diamonds-=cost;d.diamondDelta-=cost;if(kind==='ticket')d.spent+=cost;nwTTGrant(d,kind,1);nwTTNotice(d,'Purchase successful!',[[kind,1]]);return null;}

function nwTTItem(k,n){return k==='diamonds'?nwDiamondAmount(n):`<span>${nwTTRewardIcon(k)} ${n} × ${nwTTNames[k]}</span>`}
function nwTTModal(title,html,actions){const o=document.createElement('div');o.className='nw43-overlay';o.innerHTML=`<section role="dialog" aria-modal="true" aria-label="${nwEscape(title)}" class="nw43-dialog"><h2>${nwEscape(title)}</h2>${html}<div class="nw43-actions">${actions.map((a,i)=>`<button type="button" data-tt-modal="${i}" ${a.disabled?'disabled':''}>${a.html??nwEscape(a.label)}</button>`).join('')}</div></section>`;evRoot.appendChild(o);o.querySelectorAll('[data-tt-modal]').forEach(b=>b.onclick=()=>{const a=actions[+b.dataset.ttModal];o.remove();a.run?.()});o.querySelector('button:not([disabled])')?.focus();}
// V43.2: reward presentation only.
function nw432Rewards(items){return `<div class="nw432-rewards ${items.length===1?'single':''}">${items.map(([k,n],i)=>{const booster=['undo','shuffle','magic'].includes(k);const icon=k==='shuffle'?'<svg viewBox="0 0 64 64"><path d="M7 17h8c15 0 18 30 34 30h7m-9-9 9 9-9 9M7 47h8c15 0 18-30 34-30h7m-9-9 9 9-9 9" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>':k==='undo'?'<svg viewBox="0 0 64 64"><path d="M25 12 9 28l16 16M10 28h25a15 15 0 0 1 0 30H23" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>':nwTTRewardIcon(k);return `<div class="nw432-prize ${booster?'is-booster':'is-currency'} prize-${k}" style="--delay:${i*70}ms" role="group" aria-label="${n} ${nwTTNames[k]}"><span class="nw432-category">${booster?'BOOSTER':k==='ticket'?'EVENT TICKET':'DIAMONDS'}</span><span class="nw432-icon" aria-hidden="true">${icon}</span><strong>${nwTTNames[k]}</strong><b>${booster?'×':'+'}${n.toLocaleString()}</b></div>`}).join('')}</div>`;}
function nw432Destination(items){const k=new Set(items.map(([x])=>x));return k.size===1&&k.has('diamonds')?'Added to your Diamond balance on this device.':k.size===1&&k.has('ticket')?'Added to your available tickets.':!k.has('diamonds')&&!k.has('ticket')?'Added to your booster inventory.':'Rewards added to your inventory and balances on this device.';}
function nwTTShowNotices(){if(evRoot.querySelector('.nw43-overlay')||!nwTripleInEvent())return;const d=nwTripleData(),n=d.notices[0];if(!n)return;nwTTModal('Congratulations!',`<p>${nwEscape(n.title)}</p>${nw432Rewards(n.items)}<p>${nw432Destination(n.items)}</p>`,[{label:'AWESOME!',run:()=>{const latest=nwTripleData();latest.notices.shift();nwTripleSave(latest);nwTTShowNotices()}}]);}
function nwTTWelcomePopup(){const d=nwTripleData();if(d.welcomed){nwTTShowNotices();return;}if(nwTTMissionRead().pending.length){nwTTShowPendingMissionPopup();return;}nwTTModal('Welcome to Triple Trouble!',`<p>Here are your gifts for this event. Use them wisely!</p>${nw432Rewards([['undo',1],['shuffle',1],['magic',1]])}`,[{label:'CLAIM MY GIFTS',run:()=>{const latest=nwTripleData();nwTTWelcome(latest);nwTripleSave(latest);nwTripleHome()}}]);}
function nwTTBuy(kind){if(!nwTripleInEvent())return;const d=nwTripleData();const redraw=()=>{if(nwTriple)nwTripleDraw();else nwTripleHome()};const account=nwPlayerStorageKey(nwTripleKey);const buy=async()=>{if(!account||account!==nwPlayerStorageKey(nwTripleKey))return;
 if(nwWalletCurrent()){
  try{
   const state=nwTripleData(),cost=nwTTPrices[kind];
   if(kind==='ticket'&&state.spent+cost>10000)throw Error('Event ticket exchange limit reached.');
   await nwWalletPurchase('tt_'+kind);
   if(account!==nwPlayerStorageKey(nwTripleKey))return;
   const updated=nwTripleData();
   if(kind==='ticket')updated.spent+=cost;
   nwTTNotice(updated,'Purchase successful!',[[kind,1]]);nwTripleSave(updated);redraw();
  }catch(e){nwTTModal('Purchase unavailable',`<p>${nwEscape(e.message)}</p>`,[{label:'OK'}]);}
  return;
 }
 nwTTModal('Purchase unavailable','<p>Connect to Supabase to buy with Diamonds.</p>',[{label:'OK'}]);return;};nwTTModal('Get '+nwTTNames[kind],`<p>Diamond balance: ${nwDiamondAmount(d.diamonds)}</p>${kind==='ticket'?`<p>${d.spent}/10,000 Diamonds spent on tickets</p>`:''}<p>Rewarded ads are coming soon.</p>`,[{label:'Buy for '+nwTTPrices[kind]+' Diamonds',disabled:d.diamonds<nwTTPrices[kind]||(kind==='ticket'&&d.spent+100>10000),run:buy},{label:'Watch Ad',run:()=>nw433ComingSoon(()=>nwTTBuy(kind))},{label:'Cancel'}]);}
function nwTTRewardIcon(k){return k==='diamonds'?'<img class="nw-diamond-icon" src="assets/currency/diamond.png" alt="">':k==='ticket'?'<img class="nw-tt-ticket-icon" src="assets/triple/triple_ticket.png" alt="">':k==='magic'?'<span class="nw-triple-spiral" aria-hidden="true"></span>':`<span aria-hidden="true">${{shuffle:'⤨',undo:'↶'}[k]}</span>`;}
function nwTTPackArt(p,i){return `<div class="nw431-pack tier-${i}"><div class="nw431-pack-top"><span class="nw431-pack-art" aria-hidden="true">${Array.from({length:i+2},(_,j)=>`<i style="--n:${j}">✦</i>`).join('')}</span><div><strong>${p.tickets} Tickets</strong><small>${nwDiamondAmount(p.diamonds)} Diamonds</small></div><b class="nw431-price">RM${p.price}</b></div><div class="nw431-bonuses"><span>${nwTTRewardIcon('shuffle')} ${p.shuffle} Shuffle</span>${p.magic?`<span>${nwTTRewardIcon('magic')} ${p.magic} Magic Clear</span>`:''}</div></div>`;}
function nwTTUseInventoryTickets(){
 const available=nwPrizeAvailable('tt_ticket');
 if(!available){nwTTShop();return;}
 let selected=Math.min(5,available);nwTTModal('USE TICKETS','<p>Tickets in Inventory: '+available+'</p><p>How many would you like to use?</p><input id="nwTTReserveQty" type="number" inputmode="numeric" min="1" max="'+available+'" value="'+Math.min(5,available)+'" aria-label="Tickets to use"><p id="nwTTReserveError" role="status"></p>',[
  {label:'USE TICKETS',run:async()=>{
   const n=Math.max(1,Math.min(available,selected));
   try{await nwPrizeTransfer('tt_ticket',n);nwTripleHome();nwTTModal('TICKETS ADDED!','<p>+'+n+' Tickets. Ready to play!</p>',[{label:'CONTINUE'}]);}
   catch(e){nwTTModal('COULD NOT USE TICKETS','<p>'+nwEscape(e.message)+'</p>',[{label:'OK'}]);}
  }},{label:'CANCEL'}
 ]);
 const input=evRoot.querySelector('#nwTTReserveQty');
 if(input)input.oninput=()=>{selected=Math.max(1,Math.min(available,Math.trunc(Number(input.value)||1)));};
}
function nwTTOutOfTickets(){
 void nwPrizeSync().then(()=>{
  const n=nwPrizeAvailable('tt_ticket');
  if(n)nwTTModal('OUT OF TICKETS!','<p>You have '+n+' Tickets in Inventory. Want to use some?</p>',[{label:'YES, USE TICKETS',run:nwTTUseInventoryTickets},{label:'GET TICKETS',run:nwTTShop},{label:'NOT NOW'}]);
  else nwTTShop();
 }).catch(()=>nwTTShop());
}
function nwTTShop(){const d=nwTripleData();nwTTModal('More tickets',`<p>${nwTTCount(d)} available</p><p>Premium packs · coming soon</p>`,[{label:'Get a ticket · Diamonds or Watch Ad',run:()=>nwTTBuy('ticket')},...nwTTPacks.map((p,i)=>({label:`RM${p.price} pack`,html:nwTTPackArt(p,i),run:()=>nw433ComingSoon(nwTTShop)})),{label:'Close'}]);}

async function nwLbSubmit(eventCode,score){
 if(!nwCloud?.user()?.id)throw Error('Sign in to participate.');
 if((eventCode==='tg'&&score<2000)||(eventCode==='tt'&&score<1))return;
 const c=await nwCloud.get(),{error}=await c.rpc('nw_lb_submit',{p_event:eventCode,p_score:Math.max(0,Math.floor(score))});
 if(error)throw Error(error.message);
}
async function nwLbRank(eventCode){
 const c=await nwCloud.get(),{data,error}=await c.rpc('nw_lb_rank',{p_event:eventCode});
 if(error)throw Error(error.message);return data||[];
}
function nwLbMarkup(rows,eventCode){
 const rewardButton='<div class="nw-lb-reward-action"><button type="button" data-nw-lb-rewards aria-label="View leaderboard prizes">✦ REWARDS</button></div>';
 if(!rows.length)return rewardButton+'<p class="nw-lb-empty">No rankings yet.</p>';
 const x=nwEscape;
 const items=rows.map(r=>{
  const avatar=nwAvatarValue(r.avatar);
  const f=/^(usual|weird|monthly-(10|25|50|100|150|200))$/.test(r.frame)?r.frame:'usual';
  const file=f==='usual'?'frames/nw-free-usual.png?v=42':f==='weird'?'frames/nw-free-weird.png?v=42':'frames/nw-'+f+'.png';
  const avatarUrl=new URL(avatar,document.baseURI).href,frameUrl=new URL(file,document.baseURI).href;
  const monthly=f.startsWith('monthly-')?' nw-monthly-art-frame':'';
  return '<div class="nw-lb-item'+(r.is_me?' nw-lb-me':'')+'"><b>#'+Number(r.place)+'</b><span class="nw-lb-pfp"><span class="nw-equipped-frame'+monthly+'" data-frame="'+x(f)+'"><img class="nw-equipped-avatar" src="'+x(avatarUrl)+'" alt=""><img class="nw-equipped-art" src="'+x(frameUrl)+'" alt=""></span></span><span class="nw-lb-user">'+x(r.username)+(r.is_me?' (YOU)':'')+'</span><strong>'+Number(r.score).toLocaleString()+'</strong></div>';
 }).join('');
 return rewardButton+'<div class="nw-lb-scroll">'+items+'</div>';
}

function nwTTRank(){
 const d=nwTripleData();
 if(d.best<1){nwTTModal('RANKINGS LOCKED','<p>Complete Stage 1 to unlock the leaderboard!</p>',[{label:'CLOSE'}]);return;}
 nwTTModal('LEADERBOARD','<div id="nwLbTT">Connecting to rankings…</div>',[{label:'CLOSE'}]);
 (async()=>{if(nwTripleInEvent())void nwLbSubmit('tt',d.best).catch(e=>console.warn('Leaderboard submission:',e.message));const rows=await nwLbRank('tt'),el=document.getElementById('nwLbTT');if(el){el.innerHTML=nwLbMarkup(rows,'tt');el.querySelector('[data-nw-lb-rewards]')?.addEventListener('click',()=>nwTTModal('REWARDS',nwLbRewardsMarkup('tt'),[{label:'CLOSE'}]));}})().catch(e=>{const el=document.getElementById('nwLbTT');if(el)el.textContent='Leaderboard unavailable: '+e.message;});
}
function nwTTDaysMarkup(){
 const current=new Date(nwTTNow()).getUTCDay();
 return ['MON','TUE','WED'].map((name,i)=>{
  const day=i+1;
  const state=current===day?'is-current':current>day?'is-past':'is-upcoming';
  return `${i?'<i aria-hidden="true"></i>':''}<span data-tt-weekday="${day}" class="${state}" ${state==='is-current'?'aria-current="date"':''}>${name}</span>`;
 }).join('');
}
function nwTTRefreshDays(){
 const current=new Date(nwTTNow()).getUTCDay();
 evRoot.querySelectorAll('.nw-tt-days [data-tt-weekday]').forEach(el=>{
  const day=Number(el.dataset.ttWeekday),state=current===day?'is-current':current>day?'is-past':'is-upcoming';
  el.classList.remove('is-current','is-past','is-upcoming');el.classList.add(state);
  if(state==='is-current')el.setAttribute('aria-current','date');else el.removeAttribute('aria-current');
 });
}
function nwTTTime(ms){const n=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function nwTTTicketMarkup(d){return `<div class="nw43-tickets"><span>${nwTTRewardIcon('ticket')} <strong data-tt-total>${nwTTCount(d)}</strong> tickets</span><small data-tt-timer>${d.natural===10?'Free tickets full':'Next free ticket '+nwTTTime(d.next-nwTTNow())} · ${d.natural}/10 free · ${d.extra} extra</small><button type="button" data-tt-buy-ticket>+ TICKETS</button></div>`}

/* Triple Trouble daily missions: earned rewards survive UTC reset. */
const nwTTMissionKey='nineweird-triple-daily-missions-v1';
const nwTTMissionDefs=[
 ['plays',1,1,'Play 1 Triple Trouble stage'],
 ['matches',10,2,'Match 10 sets of 3 tiles'],
 ['matches',25,2,'Match 25 sets of 3 tiles'],
 ['matches',50,3,'Match 50 sets of 3 tiles'],
 ['undo',1,1,'Use Undo once'],
 ['shuffle',1,1,'Use Shuffle once'],
 ['magic',1,1,'Use Magic Clear once'],
 ['worlds',1,1,'Complete 1 Worlds Sudoku puzzle'],
 ['worlds',2,2,'Complete 2 Worlds Sudoku puzzles'],
 ['battles',1,1,'Play 1 Battle match']
];
function nwTTMissionRead(){
 const today=nwTTDay(nwTTNow()),raw=nwRead(nwTTMissionKey,null);
 const d=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{day:today,counts:{},claimed:[],pending:[]};
 if(!Array.isArray(d.claimed))d.claimed=[];
 if(!Array.isArray(d.pending))d.pending=[];
 if(!d.counts||typeof d.counts!=='object')d.counts={};
 if(d.day!==today){
  // Preserve only completed, unclaimed missions. Incomplete ones expire at reset.
  if(d.day)nwTTMissionDefs.forEach(([kind,target,reward],i)=>{
   const id=d.day+':'+i;
   if((d.counts[kind]||0)>=target&&!d.claimed.includes(i)&&!d.pending.some(p=>p.id===id))d.pending.push({id,amount:reward});
  });
  d.day=today;d.counts={};d.claimed=[];
 }
 nwWrite(nwTTMissionKey,d);return d;
}
function nwTTMissionEvent(kind,amount=1){
 if(!nwTripleInEvent()||!nwPlayerStorageKey(nwTTMissionKey))return;
 const d=nwTTMissionRead();d.counts[kind]=Math.min(999999,(Number(d.counts[kind])||0)+amount);nwWrite(nwTTMissionKey,d);
}
function nwTTMissionReady(){
 const d=nwTTMissionRead();
 return d.pending.length+nwTTMissionDefs.filter(([kind,target],i)=>(d.counts[kind]||0)>=target&&!d.claimed.includes(i)).length;
}
function nwTTMissionClaim(id){
 const account=nwPlayerStorageKey(nwTTMissionKey);if(!account)return false;
 const m=nwTTMissionRead();let reward=0;
 if(id.startsWith('old:')){
  const i=m.pending.findIndex(p=>p.id===id.slice(4));if(i<0)return false;
  reward=m.pending[i].amount;m.pending.splice(i,1);
 }else{
  if(!nwTripleInEvent())return false;
  const i=Number(id),def=nwTTMissionDefs[i];
  if(!Number.isInteger(i)||!def||m.claimed.includes(i)||(m.counts[def[0]]||0)<def[1])return false;
  reward=def[2];m.claimed.push(i);
 }
 if(!Number.isSafeInteger(reward)||reward<1)return false;
 const economy=nwTripleData();
 economy.extra+=reward;
 nwTripleSave(economy);nwWrite(nwTTMissionKey,m);
 return true;
}
function nwTTMissionsScreen(){
 if(!nwTripleInEvent())return;
 const d=nwTTMissionRead();
 const items=nwTTMissionDefs.map(([kind,target,prize,label],i)=>{
  const progress=Math.min(target,d.counts[kind]||0),claimed=d.claimed.includes(i);
  return {i,label,target,prize,progress,claimed,ready:progress>=target&&!claimed};
 }).sort((a,b)=>Number(b.ready)-Number(a.ready)||Number(a.claimed)-Number(b.claimed)||a.i-b.i);
 nwTTModal('DAILY MISSIONS',`<div class="nw-tt-missions-intro">Daily reset · 00:00 UTC · 15 Tickets available</div><div class="nw-tt-mission-list">${d.pending.map(p=>`<div class="nw-tt-mission is-ready"><div><strong>Previous day's reward</strong><small>${p.amount} Tickets earned</small></div><button type="button" data-tt-claim="old:${nwEscape(p.id)}">CLAIM</button></div>`).join('')}${items.map(m=>`<div class="nw-tt-mission ${m.ready?'is-ready':''} ${m.claimed?'is-claimed':''}"><div><strong>${nwEscape(m.label)}</strong><small>${m.progress} / ${m.target} · ${nwTTRewardIcon('ticket')} ×${m.prize}</small></div>${m.claimed?'<span>CLAIMED</span>':m.ready?`<button type="button" data-tt-claim="${m.i}">CLAIM</button>`:'<span>IN PROGRESS</span>'}</div>`).join('')}</div>`,[{label:'BACK TO EVENT'}]);
 const dlg=evRoot.querySelector('.nw43-overlay:last-child');
 dlg?.querySelectorAll('[data-tt-claim]').forEach(button=>button.onclick=()=>{
  button.disabled=true;
  if(nwTTMissionClaim(button.dataset.ttClaim)){
   dlg.remove();const count=evRoot.querySelector('[data-tt-total]');if(count)count.textContent=nwTTCount(nwTripleData());const btn=evRoot.querySelector('#nwTTMissionsBtn');if(btn)btn.classList.toggle('nw-tt-claim-ready',!!nwTTMissionReady());nwTTMissionsScreen();
  }else button.disabled=false;
 });
}
function nwTTShowPendingMissionPopup(){
 if(evRoot.querySelector('.nw43-overlay'))return;
 const d=nwTTMissionRead();if(!d.pending.length)return;
 const total=d.pending.reduce((sum,p)=>sum+p.amount,0);
 nwTTModal('You have unclaimed rewards!',`<p>Previously earned Triple Trouble mission rewards</p>${nw432Rewards([['ticket',total]])}`,[{label:'CLAIM ALL',run:()=>{
  const ids=nwTTMissionRead().pending.map(p=>'old:'+p.id);
  for(const id of ids)nwTTMissionClaim(id);
  nwTripleHome();
 }}]);
}

function nwTTProgress(d){const reached=Math.min(d.best,30),next=nwTTMilestones.find(x=>x[0]>reached),fill=Math.max(0,Math.min(100,(reached-2)/28*100));return `<section class="nw431-track" aria-label="Milestone rewards"><div class="nw43-progress-label"><strong>MILESTONE REWARDS</strong><b>${reached} / 30</b></div><div class="nw433-scroll" tabindex="0" aria-label="Swipe to explore the reward milestones"><div class="nw431-journey" style="--fill:${fill}%"><div class="nw431-rail"><i></i></div>${nwTTMilestones.map(([m,items])=>`<div data-tt-milestone="${m}" class="nw431-stop ${d.claimed.includes(m)?'earned':''} ${next?.[0]===m?'next':''}" aria-label="Stage ${m}: ${items.map(([k,n])=>n+' '+nwTTNames[k]).join(', ')}, ${d.claimed.includes(m)?'claimed':'locked'}"><div class="nw431-reward">${items.map(([k,n])=>`<span class="nw433-item">${nwTTRewardIcon(k)}<small>${n}</small></span>`).join('')}</div><i class="nw431-node">${d.claimed.includes(m)?'✓':''}</i><small>${m}</small></div>`).join('')}</div></div><p>${next?`Next: Stage ${next[0]} · ${next[1].map(([k,n])=>nwTTItem(k,n)).join(' + ')}`:'All milestones completed!'}</p></section>`;}
function nw433FocusTrack(){const sc=evRoot.querySelector('.nw433-scroll');if(!sc)return;const node=sc.querySelector('.nw431-stop.next')||sc.querySelector('.nw431-stop:last-child');if(node)sc.scrollLeft=Math.max(0,node.offsetLeft-(sc.clientWidth-node.offsetWidth)/2);}

function nwTTBind(){evRoot.querySelectorAll('[data-tt-buy-ticket]').forEach(b=>b.onclick=nwTTShop);if(!nwTriple)nwTTShowPendingMissionPopup();nwTTShowNotices()}
function nwTTAbandon(retry){const s=nwTriple;if(!s||s.won){nwTripleHome();return;}if(s.practice){if(s.lost){const d=nwTriplePracticeData();delete d.active;nwWrite('nineweird-triple-practice-v2',d);}nwTriple=null;nwTripleHome();return;}const finish=()=>{const d=nwTripleData();if(d.active){nwTTSpendTicket(d);delete d.active;nwTripleSave(d);}nwTriple=null;if(retry&&nwTTCount(d)>0)nwTripleBegin(d.stage);else nwTripleHome();};if(s.lost)finish();else nwTTModal('Leave this attempt?',`<p>Abandoning the stage uses one ticket. Your boosters already used will not return.</p>`,[{label:'Leave · lose 1 ticket',run:finish},{label:'Keep playing'}]);}
// A reopened browser forfeits an unfinished event attempt once, not on routine redraw.
function nwTTRecoverInterrupted(){if(!nwTripleInEvent())return;const d=nwTripleData();if(d.active){nwTTSpendTicket(d);delete d.active;nwTripleSave(d);}}
setInterval(()=>{nwTTRefreshDays();if(!evRoot.querySelector('[data-tt-total]'))return;if(!nwTripleInEvent()){nwTripleHome();return;}const d=nwTripleData();evRoot.querySelectorAll('[data-tt-total]').forEach(e=>e.textContent=nwTTCount(d));evRoot.querySelectorAll('[data-tt-timer]').forEach(e=>e.textContent=(d.natural===10?'Free tickets full':'Next free ticket '+nwTTTime(d.next-nwTTNow()))+` · ${d.natural}/10 free · ${d.extra} extra`);},1000);
function nwTripleIsHard(n){return n>=7&&[0,4,7].includes(n%10)}
function nwTripleTileSrc(type){const room=nwTripleArtRooms[Math.floor(type/9)%nwTripleArtRooms.length];const dir=nwTripleArtFiles[room];return dir[0]+dir[1][type%9]}
function nwTripleRng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function nwTripleShuffle(arr,rng){for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
// All layers use the same footprint grid and tile geometry as the CSS.
// A seeded removal order assigns complete triples in groups, so every board
// has a valid path with at most seven tray slots needed along that path.
function nwTripleCandidate(stage,variant){
 const hard=nwTripleIsHard(stage),random=nwTripleRng((stage*405487+Number(nwTripleWeek().replaceAll('-',''))*17+Math.imul(variant,2654435761))>>>0);
 const rooms=nwTripleShuffle(nwTripleAllowedRooms.map(room=>nwTripleArtRooms.indexOf(room)),random).slice(0,hard?Math.min(4,3+Math.floor(stage/30)):stage<4?1:2);
 const pool=rooms.flatMap(r=>Array.from({length:9},(_,i)=>r*9+i));
 // A complete, deliberate foreground silhouette. Lower layers stay within
 // that same shape; only symbols, depth and the hidden piles vary.
 const shapes=[
  ['Diamond',['00100','01110','11111','11111','01110','00100']],
  ['T',['11111','11111','00100','00100','00100','00100']],
  ['Hourglass',['11111','01110','00100','00100','01110','11111']],
  ['Hollow Square',['11111','11011','10001','10001','11011','11111']],
  ['Cross',['00100','01110','11111','11111','01110','00100']],
  ['Heart',['11011','11111','11111','01110','01110','00100']],
  ['Butterfly',['11011','11011','01110','01110','11011','11011']],
  ['Spiral',['11111','10001','10101','10101','10001','11111']],
  ['Pyramid',['00100','00100','01110','01110','11111','11111']],
  ['Flower',['00100','01110','11111','11111','01110','00100']],
  ['Arrow',['00100','01110','11111','00100','00100','00100']],
  ['Staircase',['11000','11100','01110','00111','00011','00001']],
  ['Crown',['10101','11111','11111','01110','01110','01110']],
  ['H',['11011','11011','11111','11111','11011','11011']],
  ['S',['01111','11000','11110','01111','00011','11110']],
  ['X',['10001','11011','01110','01110','11011','10001']],
  ['Lantern',['01110','11111','11011','11011','11111','01110']],
  ['Crescent',['01111','11000','11000','11000','11000','01111']],
  ['Ring',['01110','11011','10001','10001','11011','01110']],
  ['Bow',['11011','11111','01110','01110','11111','11011']]
 ];
 const [shape,mask]=shapes[(stage-1)%shapes.length];
 const flip=Math.floor((stage-1)/shapes.length)%2;
 const cells=[];for(let row=0;row<6;row++)for(let col=0;col<5;col++)if(mask[row][col]==='1')cells.push({x:1+(flip?4-col:col)*19.7,y:2+row*16});
 const tiles=[];let id=0;
 const width=19.2,height=15.2;
 // Side piles and in-board piles are fully blind: a constant visual marker,
 // never a count or a shadow whose thickness depends on the remaining depth.
 const stackCount=hard?Math.min(4,2+Math.floor(stage/14)):stage<18?2:4;
 const embeddedCount=hard?Math.min(7,4+Math.floor(stage/16)):Math.min(5,2+Math.floor(stage/12));
 const embedded=nwTripleShuffle(cells.slice(),random).slice(0,embeddedCount);
 const target=hard?Math.min(210,108+Math.min(60,(stage-7)*13)+Math.max(0,Math.floor((stage-14)/5))*3):Math.min(192,66+Math.floor((stage-1)/3)*6);
 for(let pile=0;pile<stackCount;pile++){
   const count=hard?7+Math.floor(random()*7):4+Math.floor(random()*4);
   for(let layer=0;layer<count;layer++)tiles.push({id:id++,symbol:0,layer,stack:pile,x:0,y:0});
 }
 for(let k=0;k<embedded.length;k++){
   const cell=embedded[k],count=hard?3+Math.floor(random()*5):2+Math.floor(random()*3);
   for(let j=0;j<count;j++)tiles.push({id:id++,symbol:0,layer:21+j,mystery:k,...cell,w:width,h:height});
 }
 // The top face is always complete, even when the bottom layer is partial.
 for(const cell of cells){const k=embedded.indexOf(cell);tiles.push({id:id++,symbol:0,layer:20,...cell,w:width,h:height,...(k>=0?{mystery:k}:{})});}
 const total=Math.ceil(Math.max(target,tiles.length+cells.length*.55)/3)*3;
 for(let layer=19;tiles.length<total&&layer>=0;layer--){
   const dx=layer%2?.8:0,dy=layer%2?.9:0;
   const positions=nwTripleShuffle(cells.slice(),random);
   for(const cell of positions){if(tiles.length===total)break;tiles.push({id:id++,symbol:0,layer,x:cell.x+dx,y:cell.y+dy,w:width,h:height});}
 }
 // Capacity is sufficient for the bounded targets above. If a future shape is
 // smaller, discard only a partial bottom layer, never the visible silhouette.
 while(tiles.length%3)tiles.pop();
 // Choose a legal reveal order, interleaving the central board and the blind piles.
 const order=[],remaining=tiles.slice();
 while(remaining.length){
   const free=remaining.filter(t=>nwTripleFree(t,remaining));
   const weight=t=>t.stack!=null?6:t.mystery!=null?5:1;
   let choice=random()*free.reduce((sum,t)=>sum+weight(t),0);let t=free[free.length-1];
   for(const candidate of free){choice-=weight(candidate);if(choice<0){t=candidate;break;}}
   order.push(t);remaining.splice(remaining.indexOf(t),1);
 }
 const types=Math.min(pool.length,hard?Math.min(27,20+Math.floor(stage/15)):stage<4?9:Math.min(18,14+Math.floor(stage/10)));
 const selected=nwTripleShuffle(pool.slice(),random).slice(0,types);
 rooms.forEach((r,i)=>{if(!selected.some(v=>Math.floor(v/9)===r))selected[i]=r*9+Math.floor(random()*9)});
 // Construct a solution while keeping several incomplete triples in the tray.
 // Never exceed six unmatched tiles, and never require a booster to clear.
 let toOpen=order.length/3;const pending=[];let occupied=0;
 const pressure=6;
 for(const t of order){
   const unused=selected.filter(v=>!pending.some(p=>p.symbol===v));
   const canOpen=toOpen>0&&occupied<pressure&&unused.length>0&&!(occupied===5&&!pending.some(p=>p.count===2));
   const closeable=pending.filter(p=>p.count===2);
   let p;
   if(canOpen&&(occupied<pressure-1||!pending.length||random()<.94)){
     p={symbol:unused[Math.floor(random()*unused.length)],count:1};pending.push(p);toOpen--;occupied++;t.symbol=p.symbol;
   }else{
     const choices=occupied>=6&&closeable.length?closeable:pending;
     p=choices[Math.floor(random()*choices.length)];
     // At six singles, a second tile would overflow. Prevent this by always
     // keeping a pair ready before reaching six occupied slots.
     t.symbol=p.symbol;p.count++;if(p.count===3){pending.splice(pending.indexOf(p),1);occupied-=2}else occupied++;
   }
 }

 return {stage,hard,shape,stackCount,tiles,tray:[],used:{undo:false,shuffle:false,magic:false},history:[],won:false,lost:false,room:nwTripleArtRooms[rooms[0]],started:Date.now(),week:nwTripleWeek(),practice:!nwTripleInEvent(),version:4};
}
// Choose a deterministic, less obvious board from several solvable candidates.
// The probe only sees exposed symbols, never hidden artwork. This is a heuristic,
// not a measurement of human skill. Keep the seven-slot tray and all boosters.
function nwTripleChallengeScore(tiles){
 const exposed=tiles.filter(t=>nwTripleFree(t,tiles));
 const initial=new Map();for(const t of exposed)initial.set(t.symbol,(initial.get(t.symbol)||0)+1);
 let score=[...initial.values()].reduce((sum,n)=>sum+Math.floor(n/3)*.18,0);
 for(let policy=0;policy<3;policy++){
  const left=tiles.slice(),tray=[];let steps=0;
  while(left.length){
   const free=left.filter(t=>nwTripleFree(t,left)),visible=new Map(),held=new Map();
   for(const t of free)visible.set(t.symbol,(visible.get(t.symbol)||0)+1);
   for(const t of tray)held.set(t,(held.get(t)||0)+1);
   const priority=t=>{const h=held.get(t.symbol)||0,v=visible.get(t.symbol)||0;
    return policy===2?h*100+v:(h===2?100:h+v>=3?50:h===1?20:0)+v*3+(policy===1&&t.stack!=null?2:0)+h;
   };
   const pick=free.reduce((best,t)=>priority(t)>priority(best)?t:best,free[0]);
   left.splice(left.indexOf(pick),1);tray.push(pick.symbol);steps++;
   if(tray.filter(v=>v===pick.symbol).length===3){for(let i=tray.length-1;i>=0;i--)if(tray[i]===pick.symbol)tray.splice(i,1)}
   if(tray.length>=7)break;
  }
  score+=steps/tiles.length+(left.length===0&&tray.length===0?1:0);
 }
 return score;
}
const nwTTVerificationPendingKey='nineweird-tt-verification-pending-v1';
const nwTTVerificationStarting=new Set();
async function nwTTStartAttempt(stage){
 const uid=nwCloud?.user()?.id,week=nwTripleWeek(),id=uid+':'+week+':'+stage;
 if(!uid||!nwTripleInEvent()||nwTTVerificationStarting.has(id))return;
 nwTTVerificationStarting.add(id);
 try{
  const c=await nwCloud.get();
  if(nwCloud?.user()?.id!==uid)return;
  const {data,error}=await c.rpc('nw_anticheat_tt_begin',{p_stage:stage});
  if(error)throw Error(error.message);
  if(data?.period!==week||data.stage!==stage)throw Error('Verification period mismatch');
  void nwTTFlushProofs();
 }catch(e){console.warn('Triple Trouble verification start:',e.message)}
 finally{nwTTVerificationStarting.delete(id)}
}

const nwTTVerificationActive=new Set();
function nwTTQueueProof(stage,period,audit){
 if(!nwCloud?.user()?.id||!Array.isArray(audit)||!audit.length)return;
 const id=period+':'+stage,records=nwRead(nwTTVerificationPendingKey,{});
 if(!records[id]){records[id]={stage,period,actions:audit.slice(0,1500)};nwWrite(nwTTVerificationPendingKey,records);}
 void nwTTFlushProofs();
}
async function nwTTFlushProofs(){
 const account=nwCloud?.user()?.id;
 if(!account||!nwTripleInEvent())return;
 const pending=nwRead(nwTTVerificationPendingKey,{});
 for(const [id,item] of Object.entries(pending).sort((a,b)=>a[1].stage-b[1].stage)){
  const key=account+':'+id;
  if(nwTTVerificationActive.has(key)||item.period!==nwTripleWeek())continue;
  nwTTVerificationActive.add(key);
  try{
   const c=await nwCloud.get();
   if(nwCloud.user()?.id!==account)return;
   const {data,error}=await c.functions.invoke('nw-verify-tournament',{body:{event:'tt',stage:item.stage,period:item.period,actions:item.actions}});
   if(error||!data?.verified)throw Error(data?.error||error?.message||'Verification unavailable');
   if(nwCloud.user()?.id!==account)return;
   const latest=nwRead(nwTTVerificationPendingKey,{});
   if(latest[id]){delete latest[id];nwWrite(nwTTVerificationPendingKey,latest);}
   console.info('Triple Trouble stage verified:',item.stage);void nwWalletClaimMilestones('tt',item.period);
  }catch(e){console.warn('Triple Trouble stage verification:',e.message)}
  finally{nwTTVerificationActive.delete(key);}
 }
}
function nwTripleCreate(stage){
 let best=null,bestRank=Infinity;
 for(let i=0;i<12;i++){
   const candidate=nwTripleCandidate(stage,i),rank=nwTripleChallengeScore(candidate.tiles);
   if(rank<bestRank){best=candidate;bestRank=rank;}
 }
 best.audit=[];return best;
}
function nwTripleFree(tile,tiles){
 return !tiles.some(other=>other.id!==tile.id&&other.layer>tile.layer&&(tile.stack!=null?other.stack===tile.stack:other.stack==null&&other.x<tile.x+(tile.w??17.5)&&other.x+(other.w??17.5)>tile.x&&other.y<tile.y+(tile.h??17)&&other.y+(other.h??17)>tile.y));
}
function nwTripleAvailable(tile){return !!nwTriple&&nwTripleFree(tile,nwTriple.tiles)}
function nwTriplePracticeData(){const data=nwRead('nineweird-triple-practice-v2',null);return data?.week===nwTripleWeek()?data:{week:nwTripleWeek(),stage:1,best:0};}
function nwTripleSessionData(){return nwTripleInEvent()?nwTripleData():nwTriplePracticeData()}
function nwTriplePersist(spentKind){
 const s=nwTriple;if(!s||s.week!==nwTripleWeek()||s.practice===nwTripleInEvent())return;
 const d=nwTripleSessionData();
 if(spentKind&&!s.practice){if(d.boosters[spentKind]<=0)throw Error('No booster available');d.boosters[spentKind]--;}
 if(s.won){if(s.practice){d.best=Math.max(d.best,s.stage);d.stage=Math.max(d.stage,s.stage+1);delete d.active;}else {const audit=Array.isArray(s.audit)?s.audit.slice():[];nwTTClear(d,s.stage);if(audit.length&&!s.proofQueued){s.proofQueued=true;nwTTQueueProof(s.stage,s.week,audit);}void nwLbSubmit('tt',d.best).catch(e=>console.warn('Leaderboard sync:',e.message));}}
 else {d.active=s;d.stage=s.stage;}
 if(s.practice)nwWrite('nineweird-triple-practice-v2',d);else nwTripleSave(d);
}
function nwTripleMascots(){return [1,4,6].map(i=>`<img src="assets/ugly/${uglyImgs[i]}" alt="" draggable="false">`).join('')}
function nwTripleArt(symbol){return `<img src="${nwTripleTileSrc(symbol)}" alt="" draggable="false">`}
function nwTripleRemember(){
 const s=nwTriple;s.history.push({tiles:s.tiles.map(t=>({...t})),tray:s.tray.slice()});
 if(s.history.length>15)s.history.shift();
}
function nwTripleChoose(id){
 const s=nwTriple;if(!s||s.won||s.lost)return;
 const i=s.tiles.findIndex(t=>t.id===id);if(i<0||!nwTripleAvailable(s.tiles[i]))return;
 nwTripleRemember();if(!s.practice){if(!Array.isArray(s.audit))s.audit=[];s.audit.push({type:'pick',id});}const [tile]=s.tiles.splice(i,1);s.tray.push(tile);
 const count=s.tray.filter(t=>t.symbol===tile.symbol);
 if(count.length===3){let removed=0;s.tray=s.tray.filter(t=>{if(t.symbol===tile.symbol&&removed<3){removed++;return false}return true});if(!s.practice)nwTTMissionEvent('matches');}
 if(!s.tiles.length&&!s.tray.length){s.won=true}
 else if(s.tray.length>=7)s.lost=true;
 if(s.tray.length<7)s.lost=false;
 nwTripleDraw();
}

// Build and validate an entire booster result before changing the board or inventory.
function nw431MagicPlan(s){
 const symbols=[...new Set([...s.tray,...s.tiles.filter(t=>nwTripleFree(t,s.tiles)),...s.tiles].map(t=>t.symbol))];
 // A failed stage MUST remove a held tile, not just a triple somewhere on the board.
 for(const symbol of symbols){const held=s.tray.filter(t=>t.symbol===symbol);if(s.lost&&!held.length)continue;
 const need=3-held.length;if(need<0)continue;const matches=s.tiles.filter(t=>t.symbol===symbol).sort((a,b)=>Number(nwTripleFree(b,s.tiles))-Number(nwTripleFree(a,s.tiles))||b.layer-a.layer).slice(0,need);
 if(matches.length===need&&held.length+matches.length===3)return {symbol,held,matches};}return null;
}
function nw431BoosterPlan(original,kind,seed=Date.now()){
 const s=JSON.parse(JSON.stringify(original));let cleared=null;
 if(kind==='undo'){
   if(!s.history.length)return null;
   const previous=s.history.pop();s.tiles=previous.tiles;s.tray=previous.tray;s.used.undo=true;
 }else if(kind==='shuffle'){
   const random=nwTripleRng((seed^s.tiles.length)>>>0);
   const order=s.tiles.slice().sort((a,b)=>b.layer-a.layer||a.id-b.id);
   const available={};for(const t of s.tiles)available[t.symbol]=(available[t.symbol]||0)+1;
   const pending={};for(const t of s.tray)pending[t.symbol]=(pending[t.symbol]||0)+1;
   const sequence=[];
   // Resolve tray partial triples before filling additional slots.
   for(const [symbol,count] of Object.entries(pending).sort((a,b)=>b[1]-a[1])){
     const need=3-count;if(available[symbol]<need)return;
     for(let i=0;i<need;i++)sequence.push(+symbol);available[symbol]-=need;
   }
   const triples=[];for(const [symbol,count] of Object.entries(available)){if(count%3)return;for(let i=0;i<count;i+=3)triples.push(+symbol)}
   for(const symbol of nwTripleShuffle(triples,random))sequence.push(symbol,symbol,symbol);
   if(sequence.length!==order.length)return;
   order.forEach((t,i)=>t.symbol=sequence[i]);
   s.used.shuffle=true;s.history=[];
 }else if(kind==='magic'){
   const plan=nw431MagicPlan(s);if(!plan)return null;
   const ids=new Set(plan.matches.map(t=>t.id)),heldIds=new Set(plan.held.map(t=>t.id));
   s.tiles=s.tiles.filter(t=>!ids.has(t.id));s.tray=s.tray.filter(t=>!heldIds.has(t.id));
   if(original.tiles.length+original.tray.length-s.tiles.length-s.tray.length!==3)return null;
   s.used.magic=true;s.history=[];cleared=plan.symbol;
 }else return null;
 const signature=x=>JSON.stringify([x.tiles.map(t=>[t.id,t.symbol]),x.tray.map(t=>[t.id,t.symbol])]);
 if(signature(original)===signature(s))return null;
 if(original.lost&&s.tray.length>=7)return null;
 s.won=!s.tiles.length&&!s.tray.length;s.lost=!s.won&&s.tray.length>=7;
 return {state:s,cleared};
}
function nw431ClearEffect(symbol){const tray=evRoot.querySelector('.nw-triple-tray');if(!tray)return;const fx=document.createElement('div');fx.className='nw431-clear-fx';fx.setAttribute('role','status');fx.innerHTML=`<span>MAGIC CLEAR · −3 TILES</span><div>${Array.from({length:3},()=>nwTripleArt(symbol)).join('')}</div>`;tray.appendChild(fx);setTimeout(()=>fx.remove(),1300);}
function nwTripleBooster(kind){
 const s=nwTriple;if(!s||s.won||!['undo','shuffle','magic'].includes(kind)||(kind==='shuffle'&&s.tray.length>=7))return;
 if(s.week!==nwTripleWeek()||s.practice===nwTripleInEvent())return;
 if(s.practice?s.used[kind]:!nwTripleData().boosters[kind]){if(!s.practice)nwTTBuy(kind);return;}
 const seed=Date.now(),result=nw431BoosterPlan(s,kind,seed);
 if(!result){if(!s.practice)nwTTModal('Booster not used','<p>No valid change was possible. Your booster has not been consumed.</p>',[{label:'OK'}]);return;}
 if(!s.practice)result.state.audit=[...(Array.isArray(s.audit)?s.audit:[]),{type:'booster',kind,seed}];
 nwTriple=result.state;nwTriplePersist(kind);if(!s.practice)nwTTMissionEvent(kind);nwTripleDraw();if(result.cleared!==null)nw431ClearEffect(result.cleared);
}
const nwTTRecovered=new Set();
function nwTripleHome(){
 void nwLoadEventBoosters('tt');
 const account=nwPlayerStorageKey(nwTripleKey);if(!account){void nwRouteAccount();return;}if(!nwTTRecovered.has(account)){nwTTRecovered.add(account);nwTTRecoverInterrupted();}
 evSudokuLeave();nwTriple=null;applyTheme('hub');evRoot.classList.add('nw-triple-theme');const d=nwTripleSessionData(),event=nwTripleInEvent();
 evDisplay(`${evHeader('EVENTS',showCategories)}<section class="nw-triple nw-triple-home">
 <div class="nw-triple-sparks" aria-hidden="true">⋆˚<span class="nw-triple-spiral"></span>｡</div><div class="nw-triple-mascots">${nwTripleMascots()}</div>
 <h2 class="nw-triple-logo">TRIPLE<br><span>TROUBLE</span></h2><div class="nw-triple-ribbon nw-tt-days">${nwTTDaysMarkup()}</div>
 ${event?`${nwTTTicketMarkup(d)}${nwTTProgress(d)}<div class="nw431-ranking"><span>Highest stage: ${d.best}</span><div class="nw-tt-rank-actions"><button id="nw431Rank" type="button">♜ RANK</button><button id="nwTTMissionsBtn" type="button" class="${nwTTMissionReady()?'nw-tt-claim-ready':''}">✦ MISSIONS</button></div></div>`:`<p>Practice mode · no event rewards or ticket cost</p>`}
 <button id="nwTripleStart" class="nw-triple-main-btn"><span class="nw-triple-play-symbol" aria-hidden="true">▹</span><span>${d.active?'CONTINUE STAGE '+d.stage:'PLAY STAGE '+d.stage}</span></button>
 </section>`);
 evRoot.querySelector('#nwTripleStart').onclick=()=>nwTripleBegin(d.stage,true);
 nw433FocusTrack();
 if(event){void nwTTFlushProofs();evRoot.querySelector('#nw431Rank').onclick=nwTTRank;evRoot.querySelector('#nwTTMissionsBtn').onclick=nwTTMissionsScreen;if(!d.welcomed)nwTTWelcomePopup();else nwTTBind()}else nwTTShowPendingMissionPopup()
}
function nwTripleBegin(stage,resume=false){const d=nwTripleSessionData();if(nwTripleInEvent()){if(!d.welcomed){nwTTWelcomePopup();return;}if(nwTTCount(d)<=0){nwTTOutOfTickets();return;}stage=d.stage;}const a=d.active;const resumed=resume&&a?.version>=2&&a.stage===stage&&!a.won&&a.week===nwTripleWeek()&&a.practice===!nwTripleInEvent();if(nwTripleInEvent()&&!resumed)nwTTMissionEvent('plays');nwTriple=resumed?a:nwTripleCreate(stage);if(nwTripleInEvent())void nwTTStartAttempt(stage);nwTripleDraw()}
function nwTripleStackArt(symbol,depth){
 return Array.from({length:Math.max(0,depth-1)},(_,i)=>`<span class="nw-triple-hidden-back" style="--tt-back:${depth-1-i}" aria-hidden="true"></span>`).join('')+`<span class="nw-triple-stack-face">${nwTripleArt(symbol)}</span>`;
}
function nwTripleDraw(){
 const s=nwTriple;if(!s)return;if(s.week!==nwTripleWeek()||s.practice===nwTripleInEvent()){nwTripleHome();return}nwTriplePersist();applyTheme('hub');evRoot.classList.add('nw-triple-theme');
 const mysteryDepth=new Map();for(const t of s.tiles)if(t.mystery!=null)mysteryDepth.set(t.mystery,(mysteryDepth.get(t.mystery)||0)+1);
 const mysteryTops=new Map();for(const t of s.tiles){if(t.mystery!=null&&(!mysteryTops.has(t.mystery)||mysteryTops.get(t.mystery).layer<t.layer))mysteryTops.set(t.mystery,t)}
 const tiles=s.tiles.filter(t=>t.stack==null&&(t.mystery==null||mysteryTops.get(t.mystery)===t)).sort((a,b)=>a.layer-b.layer).map(t=>{
   const enabled=nwTripleAvailable(t);
   return `<button type="button" class="nw-triple-tile ${enabled?'':'covered'} ${t.mystery!=null?'nw-triple-mystery':''}" data-tile="${t.id}" aria-label="${enabled?'Select':'Covered'} ${t.mystery!=null?'mystery stack':'tile'}" ${enabled?'':'disabled'} style="left:${t.x}%;top:${t.y}%;z-index:${10+t.layer}${t.w?`;width:${t.w}%;height:${t.h}%`: ''}">${t.mystery!=null?nwTripleStackArt(t.symbol,mysteryDepth.get(t.mystery)):nwTripleArt(t.symbol)}</button>`;
 }).join('');
 const piles=Array.from({length:s.stackCount||0},(_,i)=>i);
 const pileRail=side=>`<div class="nw-triple-pile-rail">${piles.filter(i=>i%2===side).map(i=>{
   const pile=s.tiles.filter(t=>t.stack===i).sort((a,b)=>b.layer-a.layer),top=pile[0];
   if(!top)return `<div class="nw-triple-pile nw-triple-pile-empty" aria-hidden="true"></div>`;
   return `<div class="nw-triple-pile"><button type="button" class="nw-triple-pile-top stacked" data-tile="${top.id}" aria-label="Mystery stack">${nwTripleStackArt(top.symbol,pile.length)}</button></div>`;
 }).join('')}</div>`;
 const tray=Array.from({length:7},(_,i)=>`<span class="nw-triple-tray-slot">${s.tray[i]?nwTripleArt(s.tray[i].symbol):''}</span>`).join('');
 const economy=s.practice?null:nwTripleData();const count=k=>s.practice?(s.used[k]?0:1):economy.boosters[k];
 const lostBoosters=[['undo','↶','UNDO'],['magic','<span class="nw-triple-spiral"></span>','MAGIC CLEAR']].filter(([key])=>(!s.practice||!s.used[key])&&(key!=='undo'||s.history.length)&&(key!=='magic'||!!nw431MagicPlan(s))).map(([key,icon,label])=>`<button class="nw-triple-fail-booster" data-fail-booster="${key}"><span>${icon}</span><b>${label}</b><i>${count(key)||'GET'}</i></button>`).join('');
 const action=s.won?`<div class="nw-triple-end"><div class="nw-triple-party">${nwTripleMascots()}</div><div class="nw-triple-sparks" aria-hidden="true">⋆˚<span class="nw-triple-spiral"></span>｡</div><h2>STAGE ${s.stage} CLEARED!</h2><p>${nwTripleIsHard(s.stage+1)?'HARD STAGE UP NEXT!':'BRILLIANTLY WEIRD!'}</p><button id="nwTripleNext" class="nw-triple-main-btn">NEXT STAGE ▹</button><button id="nwTripleBack" class="nw-triple-back-btn">BACK TO EVENT</button></div>`:s.lost?`<div class="nw-triple-end"><h2>TRAY FULL!</h2>${lostBoosters?`<p>RESCUE THIS STAGE?</p><div class="nw-triple-fail-boosters">${lostBoosters}</div>`:`<p>NO RESCUE POSSIBLE.</p>`}<button id="nwTripleRetry" class="nw-triple-main-btn">RETRY STAGE ↻</button><button id="nwTripleBack" class="nw-triple-back-btn">END GAME</button></div>`:'';
 evDisplay(`${evHeader('TRIPLE TROUBLE',()=>nwTTAbandon(false))}<section class="nw-triple nw-triple-play">
 ${economy?nwTTTicketMarkup(economy):''}<div class="nw-triple-stagehead"><div><small>${s.hard?'🔥 HARD STAGE':'TRIPLE TROUBLE'}</small><strong>STAGE ${s.stage}</strong></div></div>
 <div class="nw-triple-board-wrap ${s.stackCount?'has-piles':''} ${s.version>=4?'nw-triple-large-grid':'nw-triple-legacy-grid'}">${s.stackCount?pileRail(0):''}<div class="nw-triple-board ${s.shape?'nw-triple-shaped':''}" aria-label="Layered tile matching board">${tiles}</div>${s.stackCount?pileRail(1):''}</div>
 <div class="nw-triple-tray">${tray}</div>
 <div class="nw-triple-booster-row">${[['undo','↶','UNDO'],['shuffle','⤨','SHUFFLE'],['magic','<span class="nw-triple-spiral"></span>','MAGIC CLEAR']].map(([key,icon,label])=>`<button class="nw-triple-booster" data-booster="${key}" ${(s.practice&&s.used[key])||(key==='undo'&&!s.history.length)||(key==='shuffle'&&s.tray.length>=7)||s.won?'disabled':''}><span>${icon}</span><b>${label}</b><i>${count(key)||'GET'}</i></button>`).join('')}</div>
 ${action}</section>`);
 evRoot.querySelectorAll('[data-tile]').forEach(el=>el.onclick=()=>nwTripleChoose(+el.dataset.tile));
 evRoot.querySelectorAll('[data-booster]').forEach(el=>el.onclick=()=>nwTripleBooster(el.dataset.booster));
 if(s.won){evRoot.querySelector('#nwTripleNext').onclick=()=>nwTripleBegin(s.stage+1);evRoot.querySelector('#nwTripleBack').onclick=nwTripleHome;}
 if(s.lost){evRoot.querySelectorAll('[data-fail-booster]').forEach(el=>el.onclick=()=>nwTripleBooster(el.dataset.failBooster));evRoot.querySelector('#nwTripleRetry').onclick=()=>s.practice?nwTripleBegin(s.stage):nwTTAbandon(true);evRoot.querySelector('#nwTripleBack').onclick=()=>nwTTAbandon(false);}
 if(economy)nwTTBind();
}

const nwGalaxyOrder=["classic", "dark", "weird", "ugly", "alien", "solarsick", "diner", "underthebed", "bodyparts", "halloween", "dontunwrap", "deepsea", "balloonwrong", "nineties", "cakefail", "baggagehell", "donttakewater", "patissserie", "unpreparedchristmas", "christmas", "olympus"];
const nwGalaxyColors={"classic": ["#fff", "#e3d3c7", "#111"], "dark": ["#050505", "#bbbbd0", "#fff"], "weird": ["#30284F", "#EFFF4F", "#F7F3FF"], "ugly": ["#343139", "#A8E64D", "#FAF3E8"], "alien": ["#182332", "#5BFFD8", "#EAFBFF"], "solarsick": ["#170B24", "#FF4FD2", "#FFE9FF"], "diner": ["#163F47", "#D9363D", "#FFF0D5"], "underthebed": ["#292237", "#F7D892", "#FFF1D9"], "bodyparts": ["#E1F0EC", "#9471B4", "#443B56"], "halloween": ["#270f36", "#f28cd5", "#ffe9f8"], "dontunwrap": ["#372B23", "#C47A3B", "#FFF4DB"], "deepsea": ["#071018", "#5AF2E3", "#EAFBFF"], "balloonwrong": ["#FFF2F8", "#E84AA8", "#5B2A63"], "nineties": ["#24294d", "#36e0dc", "#f6f4ff"], "cakefail": ["#F4D5DC", "#A95570", "#633B46"], "baggagehell": ["#F8DFC1", "#C46434", "#4C281A"], "donttakewater": ["#241431", "#F2AE9A", "#FFEDE6"], "patissserie": ["#F5E8D3", "#A87542", "#493021"], "unpreparedchristmas": ["#EAF7FF", "#579CC5", "#245D83"], "christmas": ["#EAF7FF", "#579CC5", "#245D83"], "fairy": ["#e9d9fa", "#9959d9", "#3c255f"], "olympus": ["#e8d8bc", "#347daa", "#203b60"]};
function nwLobbyIcon(kind){const p={shop:'<path d="M4 9h16l-1 12H5L4 9Z M8 9V6a4 4 0 0 1 8 0v3"/>',settings:'<path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[kind]}</svg>`;}
function nwLobbyUtility(kind){if(kind==='mail'){void nwPrizeMail();return;}evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-lobby-theme');evDisplay(`${evHeader(kind==='shop'?'SHOP':kind==='mail'?'MAIL':'SETTINGS',showCategories)}<section class="nw-lobby-utility">${kind==='mail'?'<h2>MAIL COMING SOON</h2>':kind==='shop'?`<div class="nw-lobby-money">${nwDiamondAmount(nwDiamondBalance().toLocaleString())}</div><h2>COMING SOON</h2>`:`<button id="nwSettingsProfile" class="nw-lobby-nav">PROFILE / ACCOUNT</button><a href="privacy.html">Privacy Policy</a>`}</section>`);const b=evRoot.querySelector('#nwSettingsProfile');if(b)b.onclick=nwShowProfile;nwResetViewToTop();}
function nwLobbyEventStatus(kind,now=new Date()){
  if(kind==='letout')return {live:true,label:'MINI GAME'};
  const day=now.getUTCDay();
  if(kind==='growing'){const live=[2,3,4].includes(day);return {live,label:(live?'NOW LIVE: ':'COMING SOON: ')+'TUE – THU'};}
  if(kind==='battle')return {live:true,label:'NOW LIVE: '+now.toLocaleString('en-US',{month:'long',timeZone:'UTC'}).toUpperCase()};
  if(kind==='triple'){const live=[1,2,3].includes(day);return {live,label:(live?'NOW LIVE: ':'COMING SOON: ')+'MON – WED'};}
  if(day===4)return {live:true,label:'NOW LIVE: MATCHING DAY'};
  const live=[5,6,0].includes(day);return {live,label:(live?'NOW LIVE: ':'COMING SOON: ')+'FRI – SUN'};
}
function nwLobbyUpdateEventStatus(){
  if(evRoot.hidden||!evRoot.classList.contains('nw-lobby-theme'))return;
  evRoot.querySelectorAll('[data-lobby-event]').forEach(el=>{const state=nwLobbyEventStatus(el.dataset.lobbyEvent);el.classList.toggle('is-live',state.live);const label=el.querySelector('textPath');if(label&&label.textContent!==state.label){label.textContent=state.label;el.setAttribute('aria-label',el.dataset.eventName+' — '+state.label);}});
}
/* 7-Day Daily Sign-In — the server owns UTC eligibility, rotation, and rewards. */
const nwDailyRewards=[
 {label:'50 Diamonds',icon:'diamonds'},
 {label:'2 Sudoku Hints',icon:'sudoku_hint'},
 {label:'5 Triple Trouble Tickets',icon:'tt_ticket'},
 {label:"30 They're Growing! Energy",icon:'tg_energy'},
 {label:'100 Diamonds',icon:'diamonds'},
 {label:'1 Undo + 1 Shuffle',icon:'tt_undo'},
 {label:'200 Diamonds + 5 TT Tickets',icon:'diamonds'}
];
let nwDailyClaimInFlight=false;
function nwDailyGiftArt(){
 return '<svg viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="20" width="32" height="22" rx="3" stroke="#BCADD9" stroke-width="2.8"/><path d="M6 20v-7h36v7H6Z" fill="#2A1F44" stroke="#BCADD9" stroke-width="2.8"/><path d="M24 13v29M20 13C9 12 10 3 17 5c4 1 7 8 7 8Zm4 0c2-9 9-11 12-7 3 6-5 7-12 7Z" stroke="#F08BC2" stroke-width="2.8"/></svg>';
}
function nwInventoryPortal(){
 return '<button id="nwInventoryPortal" type="button" class="nw-daily-mini nw-inventory-mini" aria-label="Open Inventory"><span class="nw-daily-mini-disc"><svg viewBox="0 0 48 48" fill="none" stroke="#81C8FF" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M9 18h30v25H9zM15 18V9h18v9M18 28h12M24 23v11"/></svg></span><svg class="nw-daily-mini-label" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="nwInventoryArc" d="M10 50 A40 40 0 0 1 90 50"/></defs><text><textPath href="#nwInventoryArc" startOffset="50%" text-anchor="middle">INVENTORY</textPath></text></svg><span class="nw-daily-mini-orbit" aria-hidden="true">✧</span></button>';
}
function nwDailyPortal(){
 return '<button id="nwDailyPortal" type="button" class="nw-daily-mini" aria-label="Open Daily Sign-In rewards"><span class="nw-daily-mini-disc">'+nwDailyGiftArt()+'</span><svg class="nw-daily-mini-label" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="nwDailyPortalArc" d="M10 50 A40 40 0 0 1 90 50"/></defs><text><textPath href="#nwDailyPortalArc" startOffset="50%" text-anchor="middle">DAILY SIGN-IN</textPath></text></svg><span class="nw-daily-mini-orbit" aria-hidden="true">✦</span></button>';
}
function nwDailyTile(i,day,canClaim){
 const r=nwDailyRewards[i],n=i+1,done=(!canClaim&&n===day-1)||(n<day),active=canClaim&&n===day;
 const art=r.icon==='diamonds'?'<img src="assets/currency/diamond.png" alt="">':nwPrizeIcon(r.icon);
 return '<div class="nw-daily-tile '+(done?'is-done':active?'is-ready':'')+'"><small>DAY '+n+'</small><div class="nw-daily-tile-gift">'+nwDailyGiftArt()+'</div><span class="nw-daily-tile-art">'+art+'</span><strong>'+nwEscape(r.label)+'</strong>'+(done?'<span class="nw-daily-check">✓</span>':'')+'</div>';
}
async function nwDailyScreen(){
 applyTheme('hub');evRoot.classList.add('nw-daily-theme');
 evDisplay(evHeader('',showCategories)+'<section class="nw-daily-screen"><h2>DAILY SIGN-IN</h2><p class="nw-daily-intro">A little something for showing up ♡</p><p class="nw-daily-status">CHECKING YOUR REWARDS…</p></section>');
 const account=nwCloud?.user()?.id;
 try{
  const c=await nwCloud.get(),{data,error}=await c.rpc('nw_daily_signin_status');
  if(error)throw Error(error.message);
  if(nwCloud?.user()?.id!==account)return;
  nwDailyRender({...data,account});
 }catch(e){if(nwCloud?.user()?.id===account){const area=evRoot.querySelector('.nw-daily-screen');if(area)area.innerHTML='<h2>DAILY SIGN-IN</h2><p class="nw-daily-status">'+nwEscape(e.message)+'</p><button class="nw-daily-action" id="nwDailyRetry">RETRY</button>';evRoot.querySelector('#nwDailyRetry').onclick=nwDailyScreen;}}
}
function nwDailyRewardMarkup(status,notice=''){
 const day=Number(status.day)||1,canClaim=!!status.can_claim;
 const grid=nwDailyRewards.slice(0,6).map((r,i)=>nwDailyTile(i,day,canClaim)).join('');
 const last=nwDailyTile(6,day,canClaim);
 return '<section class="nw-daily-screen"><div class="nw-daily-stars" aria-hidden="true">✦ ⋆ ✧</div><h2>DAILY SIGN-IN</h2><p class="nw-daily-intro">A little something for showing up ♡</p><div class="nw-daily-grid">'+grid+'</div><div class="nw-daily-final">'+last+'</div><p class="nw-daily-rule">Missed a day? Your progress stays right here.</p><p class="nw-daily-status" role="status">'+(notice?nwEscape(notice):canClaim?'Your Day '+day+' reward is ready!':'Already claimed today. Come back after 00:00 UTC.')+'</p><button class="nw-daily-action" id="nwDailyClaim" '+(canClaim?'':'disabled')+'>'+(canClaim?'CLAIM DAY '+day+' ✦':'CLAIMED ✓')+'</button></section>';
}
function nwDailyBindClaim(status,root,popup=false){
 const b=root.querySelector('#nwDailyClaim');if(!b||!status.can_claim)return;
 b.onclick=async()=>{
  if(nwDailyClaimInFlight)return;
  nwDailyClaimInFlight=true;b.disabled=true;b.textContent='CLAIMING…';
  try{
   const c=await nwCloud.get(),{data,error}=await c.rpc('nw_daily_signin_claim');
   if(error)throw Error(error.message);
   if(nwCloud?.user()?.id!==status.account||!root.isConnected)return;
   if(popup){
    if(!root.classList.contains('nw-daily-popover'))return;
    if(data.claimed)await Promise.allSettled([nwWalletSync(),nwPrizeSync()]);
    nwDailyClosePopup();
   }else{
    if(!evRoot.classList.contains('nw-daily-theme'))return;
    if(data.claimed){
     await Promise.allSettled([nwWalletSync(),nwPrizeSync()]);
     nwDailyRender({...status,day:data.next_day,can_claim:false},'DAY '+data.day+' CLAIMED! ✦');
    }else nwDailyRender({...status,day:data.next_day||status.day,can_claim:false},'Already claimed today.');
   }
  }catch(e){
   if(root.isConnected){b.disabled=false;b.textContent='TRY AGAIN';const info=root.querySelector('.nw-daily-status');if(info)info.textContent=e.message||'Claim failed. Please try again.';}
  }finally{nwDailyClaimInFlight=false;}
 };
}
function nwDailyRender(status,notice=''){
 evDisplay(evHeader('',showCategories)+nwDailyRewardMarkup(status,notice));
 nwDailyBindClaim(status,evRoot);
}
// One automatic offer per user per page session, only after the lobby has rendered.
// A failed status check leaves the normal Daily Sign-In button available.
const nwDailyAutoChecked=new Set();
let nwDailyPopupOpener=null;
function nwDailyClosePopup(){
 const pop=evRoot.querySelector('#nwDailyPopup');if(!pop)return;
 pop.remove();
 const opener=nwDailyPopupOpener;nwDailyPopupOpener=null;
 if(opener?.isConnected)opener.focus({preventScroll:true});
}
function nwDailyShowPopup(status){
 if(evRoot.querySelector('#nwDailyPopup'))return;
 const popup=document.createElement('div');
 popup.id='nwDailyPopup';popup.className='nw-daily-popover';
 popup.setAttribute('role','presentation');
 popup.innerHTML='<div class="nw-daily-dialog" role="dialog" aria-modal="true" aria-labelledby="nwDailyPopupTitle"><button class="nw-daily-popup-close" type="button" aria-label="Close Daily Sign-In">×</button><div id="nwDailyPopupTitle" class="nw-daily-popup-label">DAILY REWARDS</div>'+nwDailyRewardMarkup(status)+'</div>';
 evRoot.appendChild(popup);
 nwDailyPopupOpener=evRoot.querySelector('#nwDailyPortal');
 const close=popup.querySelector('.nw-daily-popup-close');
 close.onclick=nwDailyClosePopup;
 popup.addEventListener('click',e=>{if(e.target===popup)nwDailyClosePopup();});
 popup.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();nwDailyClosePopup();}
  if(e.key==='Tab'){
   const controls=[...popup.querySelectorAll('button:not([disabled])')];
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 nwDailyBindClaim(status,popup,true);
 close.focus({preventScroll:true});
}
async function nwDailyAutoCheck(){
 const account=nwCloud?.user()?.id;
 if(!account||nwDailyAutoChecked.has(account)||!evRoot.querySelector('.nw-lobby-top'))return;
 nwDailyAutoChecked.add(account);
 try{
  const c=await nwCloud.get(),{data,error}=await c.rpc('nw_daily_signin_status');
  if(error)throw Error(error.message);
  if(nwCloud?.user()?.id!==account||!evRoot.classList.contains('nw-lobby-v37')||!evRoot.querySelector('.nw-lobby-top'))return;
  if(data?.can_claim===true)nwDailyShowPopup({...data,account});
 }catch(e){console.warn('Daily Sign-In automatic status check:',e.message);}
}

let nwLobbyClock=null;
function nwLobbyTitle(){return `<h1 class="nw-lobby-title" aria-label="Nine & Weird"><span class="nw-lobby-title-spark a" aria-hidden="true">✦</span><span class="nw-lobby-title-spark b" aria-hidden="true">✧</span><span class="nw-lobby-title-spark c" aria-hidden="true">⋆</span><span class="nw-lobby-title-letters" aria-hidden="true">${Array.from('NINE & WEIRD',(c,i)=>`<span style="--letter-delay:${i*.11}s">${nwEscape(c)}</span>`).join('')}</span></h1>`;}
function nwLobbyPortal(id,cls,title,decor){
 const state=nwLobbyEventStatus(cls),name=title.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 return `<button type="button" id="${id}" data-lobby-event="${cls}" data-event-name="${name}" aria-label="${name} — ${state.label}" class="nw-lobby-portal ${cls}${state.live?' is-live':''}"><span class="nw-lobby-portal-disc"><span class="nw-lobby-portal-decor" aria-hidden="true">${decor}</span><strong class="${cls==='double'?'nw-double-glitch':''}">${cls==='letout'?'<span class="nw-let-promo-title" aria-hidden="true"><span class="nw-let-promo-row"><span class="nw-let-promo-let">LET</span><span class="nw-let-promo-me"> ME</span></span><span class="nw-let-promo-out">OUT!</span></span>':title}${cls==='double'?'<span class="nw-double-glitch-copy" aria-hidden="true">'+title+'</span><span class="nw-double-glitch-copy second" aria-hidden="true">'+title+'</span>':''}</strong></span><svg class="nw-lobby-event-orbit" viewBox="0 0 180 180" aria-hidden="true"><defs><path id="${id}Arc" d="M8 90 A82 82 0 0 0 172 90"/></defs><circle cx="90" cy="90" r="75" fill="none" stroke="currentColor" stroke-width=".8" opacity=".35"/><circle class="nw-event-pulse" cx="90" cy="90" r="62" fill="none" stroke="currentColor" stroke-width="2.2"/><g class="nw-event-star"><path d="M152 82l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="currentColor"/></g><text fill="currentColor" font-size="10.4" letter-spacing=".05"><textPath href="#${id}Arc" startOffset="50%" text-anchor="middle">${state.label}</textPath></text></svg></button>`;
}
// V37: rotate the original portal nodes; no replacement artwork or duplicate SVG IDs.
function nwBindEventCarousel(){
 const root=evRoot.querySelector('.nw-event-carousel'),track=root.querySelector('.nw-event-track'),viewport=root.querySelector('.nw-event-viewport'),dots=root.querySelector('.nw-event-dots');
 const source=[...track.children];let ordered=[],index=0,signature='',pauseUntil=0,gesture=null,blockClick=0;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const priority=()=>[...source].sort((a,b)=>Number(nwLobbyEventStatus(b.dataset.lobbyEvent).live)-Number(nwLobbyEventStatus(a.dataset.lobbyEvent).live));
 function draw(animate=false){
   const old=new Map([...track.children].map(el=>[el,el.getBoundingClientRect()]));
   source.forEach(el=>el.getAnimations?.().forEach(a=>{if(a.effect?.target===el)a.cancel();}));
   const ring=ordered.slice(index).concat(ordered.slice(0,index));
   ring.forEach((el,i)=>{track.appendChild(el);el.hidden=i>=3;});
   if(animate&&!reduced.matches)ring.slice(0,3).forEach(el=>{const a=old.get(el),b=el.getBoundingClientRect(),dx=a&&a.width?a.left-b.left:0;if(!el.animate)return;if(Math.abs(dx)>viewport.clientWidth/2||!a?.width){el.animate([{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:420,easing:'ease-out'});}else if(dx)el.animate([{transform:`translateX(${dx}px)`},{transform:'none'}],{duration:420,easing:'ease-out'});});
   dots.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
 }
 function refresh(){const next=priority(),sig=next.map(el=>el.id+':'+nwLobbyEventStatus(el.dataset.lobbyEvent).live).join('|');if(sig===signature)return;signature=sig;ordered=next;index=0;dots.replaceChildren();ordered.forEach((el,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show '+el.dataset.eventName+' first');b.onclick=()=>{pauseUntil=Date.now()+9000;index=i;draw(true);};dots.appendChild(b);});draw();}
 function step(n,manual=false){if(manual)pauseUntil=Date.now()+9000;if(ordered.length<2)return;index=(index+n+ordered.length)%ordered.length;draw(true);}
 refresh();root.querySelector('.nw-event-prev').onclick=()=>step(-1,true);root.querySelector('.nw-event-next').onclick=()=>step(1,true);
 viewport.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY};pauseUntil=Date.now()+9000;});
 viewport.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;if(Math.abs(e.clientX-gesture.x)>12&&Math.abs(e.clientX-gesture.x)>Math.abs(e.clientY-gesture.y)){try{viewport.setPointerCapture(e.pointerId)}catch{}}});
 viewport.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)){blockClick=Date.now()+500;step(dx<0?1:-1,true);}});
 viewport.addEventListener('pointercancel',()=>{gesture=null});viewport.addEventListener('lostpointercapture',()=>{gesture=null});
 viewport.addEventListener('click',e=>{if(Date.now()<blockClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('focusin',()=>{pauseUntil=Date.now()+9000;});
 const clock=setInterval(()=>{if(!root.isConnected){clearInterval(clock);return;}refresh();},1000);
 const auto=setInterval(()=>{if(!root.isConnected){clearInterval(auto);return;}if(document.hidden||gesture||reduced.matches||Date.now()<pauseUntil||(root.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')))return;step(1);},5000);
}
let nwLastMailNoticeCheck=0;
function showCategories(){
  if(!nwCloud.user()||(!nwCloud.user().is_anonymous&&!nwSetupVerified())||nwCloud.isRecovering()){void nwRouteAccount();return;}
  evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-lobby-theme');const p=nwProfile();
  const nav=(id,title,art)=>`<button type="button" class="nw-lobby-nav" id="${id}">${art}<strong>${title}</strong></button>`;
  const portal=nwLobbyPortal;
  evRoot.classList.add('nw-lobby-v37');
  evDisplay(`<header class="nw-lobby-top"><button id="nwProfileButton" class="nw-lobby-profile" aria-label="Open player profile">${nwFrameArt(p.avatar)}<strong>${nwEscape(p.name)}</strong></button>${nwDailyPortal()}${nwInventoryPortal()}<div class="nw-lobby-top-right"><span class="nw-lobby-money">${nwDiamondAmount(nwDiamondBalance().toLocaleString())}</span><button id="nwLobbySettings" class="nw-lobby-icon" aria-label="Settings">${nwLobbyIcon('settings')}</button></div></header><section class="nw-lobby">${nwLobbyTitle()}
    ${nav('nwWorlds','WORLDS',`<span class="nw-lobby-nav-art nw-lobby-planet"><svg viewBox="0 0 80 70" aria-hidden="true"><g fill="none" stroke="#81C8FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 30C20 11 41 6 54 17C68 30 61 50 47 56C33 62 19 52 18 40"/><path d="M19 26C4 37 4 49 17 48C34 48 62 30 70 20C77 9 62 10 55 15"/></g><path d="M37 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#81C8FF"/></svg></span>`)}
    <section class="nw-event-carousel" aria-label="Events"><div class="nw-event-heading">EVENTS</div><div class="nw-event-viewport"><div class="nw-event-track">
    ${portal('nwTriplePortal','triple','TRIPLE<br>TROUBLE','⋆˚꩜｡')}
    ${portal('nwDoublePortal','double','DOUBLE<br>TROUBLE','⋆｡☁︎｡ ﾟ☾ ﾟ⋆')}
    ${portal('nwGrowingPortal','growing','THEY\'RE<br>GROWING!','･ ༝ ･')}
    ${portal('nwBattle','battle','BATTLE','ϟ ☢ ϟ')}
    ${portal('nwLetMeOutPortal','letout','LET ME<br>OUT!','')}
    </div></div><div class="nw-event-controls"><button type="button" class="nw-event-prev" aria-label="Previous event">‹</button><div class="nw-event-dots"></div><button type="button" class="nw-event-next" aria-label="Next event">›</button></div></section>
    <div class="nw-lobby-bottom">${nav('nwMail','MAIL',`<span class="nw-lobby-nav-art nw-lobby-mail" aria-hidden="true"><svg viewBox="0 0 80 70" aria-hidden="true"><g fill="none" stroke="#F08BC2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 19Q12 16 17 16H63Q68 16 68 21V51Q68 55 63 55H17Q12 55 12 50V21Q12 20 13 19Z"/><path d="M15 20Q27 31 39 40Q41 42 43 40L65 20"/></g></svg></span>`)}${nav('nwTrophy','TROPHY CASE',`<span class="nw-lobby-nav-art nw-lobby-trophy"><svg viewBox="0 0 80 70" aria-hidden="true"><path d="M24 11H56V29Q56 44 40 47Q24 44 24 29Z M24 16H11V25Q11 39 29 39 M56 16H69V25Q69 39 51 39 M40 47V58 M27 62H53" fill="none" stroke="#ffcf9a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 16l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#ffe6bb"/></svg></span>`)}${nav('nwLobbyShop','SHOP',`<span class="nw-lobby-nav-art nw-lobby-shop"><svg viewBox="0 0 80 70" aria-hidden="true"><g fill="none" stroke="#F8EBDD" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 27Q15 27 15 31L17 56Q17 59 21 59H59Q63 59 63 55L65 31Q65 27 61 27H17Z"/><path d="M30 29V18Q30 9 40 9Q50 9 50 18V29"/></g></svg></span>`)}</div></section>`);
  const by=id=>evRoot.querySelector('#'+id);const openRooms=collection=>{roomCollection=collection;nwScroll[collection]=0;nwRoomPages[collection]=0;showRooms(0)};
  nwLastMailNoticeCheck=Date.now();void nwPrizeRefreshMailNotice();
  by('nwDailyPortal').onclick=nwDailyScreen;by('nwInventoryPortal').onclick=nwShowInventory;by('nwWorlds').onclick=()=>openRooms('all');by('nwMail').onclick=()=>nwLobbyUtility('mail');by('nwTriplePortal').onclick=nwTripleHome;by('nwDoublePortal').onclick=nwDoublePracticeScreen;by('nwGrowingPortal').onclick=nwGrowingOpen;by('nwLetMeOutPortal').onclick=nwLetMeOutOpen;by('nwBattle').onclick=showBattle;by('nwTrophy').onclick=()=>nwShowTrophy();by('nwProfileButton').onclick=nwShowProfile;by('nwLobbyShop').onclick=()=>nwLobbyUtility('shop');by('nwLobbySettings').onclick=()=>nwLobbyUtility('settings');if(nwLobbyClock===null)nwLobbyClock=setInterval(()=>{if(evRoot.hidden||!evRoot.querySelector('[data-lobby-event]')){clearInterval(nwLobbyClock);nwLobbyClock=null;return;}nwLobbyUpdateEventStatus();if(Date.now()-nwLastMailNoticeCheck>=30000){nwLastMailNoticeCheck=Date.now();void nwPrizeRefreshMailNotice();}},1000);nwBindEventCarousel();nwResetViewToTop();requestAnimationFrame(()=>requestAnimationFrame(()=>{void nwDailyAutoCheck();}));
}
function showRooms(page=0){
  const ids=roomCollection==='fav'?nwFavs():['favorites',...nwGalaxyOrder];
  // One scrollable catalogue, with the previous future-world slots preserved.
  const total=roomCollection==='fav'?ids.length:Math.max(ids.length,41);
  evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme');roomPage=0;nwRoomPages[roomCollection]=0;
  let tiles='';
  for(let i=0;i<total;i++){
    const id=ids[i],isFavorites=id==='favorites',w=worlds[id],label=isFavorites?'FAVORITES':id==='classic'?'CLASSIC LIGHT':w?w.name:'COMING SOON';
    const [bg,accent,ink]=isFavorites?['#2A1F44','#F08BC2','#F8EBDD']:nwGalaxyColors[id]||['#141A33','#8E83BE','#F8EBDD'];
    const icons=isFavorites?'<span class="nw-planet-favorite-heart" aria-hidden="true">♡</span>':!w?'<span class="nw-planet-lock">✧</span>':id==='classic'||id==='dark'?Array.from({length:9},(_,n)=>`<span>${n+1}</span>`).join(''):nwTripleArtFiles[id][1].map(img=>`<img src="${nwTripleArtFiles[id][0]}${img}" alt="" loading="lazy" width="32" height="32">`).join('');
    const arc=`<svg class="nw-planet-orbit" viewBox="0 0 180 180" aria-hidden="true"><defs><path id="nwPlanetArc${i}" d="M 8,90 A 82,82 0 0,0 172,90"/></defs><circle cx="90" cy="90" r="75" fill="none" stroke="${accent}" opacity=".35" stroke-width=".8"/><circle cx="147" cy="41" r="3.4" fill="${accent}"/><path d="M27 20v9m-4.5-4.5h9" stroke="${accent}" stroke-width="1.2" stroke-linecap="round"/><text fill="${accent}" font-size="${label.length>26?10.2:label.length>20?11.2:12.5}" font-weight="700" letter-spacing=".35"><textPath href="#nwPlanetArc${i}" startOffset="50%" text-anchor="middle">${nwEscape(label)}</textPath></text></svg>`;
    tiles+=`<${w||isFavorites?'button':'div'} ${w||isFavorites?`type="button" ${isFavorites?'data-favorites="true"':`data-world="${id}"`} aria-label="Open ${nwEscape(label)}"`:'aria-label="Locked future world"'} class="nw-planet ${w||isFavorites?'':'locked'} ${isFavorites?'nw-planet-favorites':''}" style="--planet-bg:${bg};--planet-accent:${accent};--planet-ink:${ink}"><span class="nw-planet-disc"><span class="nw-planet-pieces">${icons}</span></span>${arc}</${w||isFavorites?'button':'div'}>`;
  }
  evDisplay(`${evHeader(roomCollection==='fav'?'FAVORITES':'SELECT A WORLD',roomCollection==='fav'?()=>{roomCollection='all';showRooms(0)}:showCategories)}<div class="world-grid world-list nw-planet-grid">${tiles||'<p class="nw-empty-favs">No favourites yet. Find a world you love and tap ♡ on the difficulty screen.</p>'}</div>`);
  evRoot.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{nwSaveScroll();currentWorld=b.dataset.world;evSudokuMenu();nwResetViewToTop()});const favoritesPlanet=evRoot.querySelector('[data-favorites]');if(favoritesPlanet)favoritesPlanet.onclick=()=>{roomCollection='fav';nwScroll.fav=0;showRooms(0)};nwRestoreScroll();
}

const sudokuImgs=['01_Pink_Neon_Bat.png','02_Blue_Neon_Moon.png','03_Orange_Neon_Pumpkin.png','04_Green_Neon_Cat.png','05_White_Pink_Ghost.png','06_Red_Neon_Heart.png','07_Purple_Neon_Candy.png','08_Yellow_Neon_Star.png','09_Cyan_Neon_Cross.png'];
const patissserieImgs=['01_croissant.png','02_macaron.png','03_eclair.png','04_fruit_tart.png','05_cinnamon_roll.png','06_donut.png','07_madeleine.png','08_pretzel.png','09_cupcake.png'];
const christmasImgs=['01_santa_hat.png','02_christmas_tree.png','03_gold_star.png','04_snowflake.png','05_gingerbread.png','06_snowman.png','07_purple_gift.png','08_pink_candy_cane.png','09_orange_candle.png'];
const fairyImgs=['01_fairy.png','02_lantern.png','03_potion.png','04_crystal.png','05_mushroom.png','06_moon.png','07_blossom.png','08_butterfly.png','09_key.png'];
const olympusImgs=['01_zeus_lightning.png','02_poseidon_trident.png','03_hades_helmet.png','04_athena_owl.png','05_apollo_lyre.png','06_artemis_bow.png','07_aphrodite_shell.png','08_hermes_sandals.png','09_dionysus_grapes.png'];
const ninetiesImgs=['01_tamagotchi.png','02_handheld.png','03_smiley.png','04_lava_lamp.png','05_roller_skate.png','06_slime.png','07_boombox.png','08_cd.png','09_floppy_disk.png'];
const dinerImgs=['01_eyeball_pudding.png','02_screaming_sandwich.png','03_tooth_candy.png','04_finger_spaghetti.png','05_brain_jelly.png','06_worm_apple.png','07_moldy_cupcake.png','08_bloody_popsicle.png','09_cursed_fried_egg.png'];
const bodypartsImgs=['01_eyeball_tray.png','02_zipper_heart.png','03_ear_display.png','04_brain_jar.png','05_chattering_teeth.png','06_bony_hand.png','07_ribbon_lungs.png','08_nose_perfume.png','09_spine_hanger.png'];
const deepseaImgs=['01_anglerfish.png','02_blobfish.png','03_vampire_squid.png','04_sea_bunny.png','05_dumbo_octopus.png','06_leafy_sea_dragon.png','07_nudibranch.png','08_giant_isopod.png','09_jellyfish.png'];
const solarsickImgs=['01_feverish_sun.png','02_crying_moon.png','03_sneezing_comet.png','04_nauseous_planet.png','05_anxious_star.png','06_dizzy_black_hole.png','07_grumpy_asteroid.png','08_lovesick_saturn.png','09_sleepy_ufo.png'];
const underthebedImgs=['01_monster_slipper.png','02_dust_bunny.png','03_glowing_eyes.png','04_blanket_ghost.png','05_horned_monster.png','06_shadow_hand.png','07_evil_pillow.png','08_lost_tooth.png','09_nightmare_jar.png'];
const balloonwrongImgs=['01_long_necked_balloon_dog.png','02_sideways_balloon_rabbit.png','03_three_headed_balloon_giraffe.png','04_balloon_fish.png','05_balloon_spider.png','06_crooked_balloon_swan.png','07_grumpy_balloon_elephant.png','08_inflated_balloon_dinosaur.png','09_weird_balloon_creature.png'];
const cakefailImgs=['01_collapsed_wedding_cake.png','02_potato_dinosaur_cake.png','03_hairy_birthday_cake.png','04_clown_incident_cake.png','05_melting_unicorn_cake.png','06_carrot_impostor_cake.png','07_fish_cake.png','08_heartbreak_cake.png','09_candle_catastrophe.png'];
const baggagehellImgs=['01_slime_leaking_trunk.png','02_running_suitcase.png','03_tentacle_duffel.png','04_trapped_passenger_case.png','05_biting_suitcase.png','06_eyeball_hatbox.png','07_overpacked_disaster.png','08_wheel_monster.png','09_weather_suitcase.png'];
const donttakewaterImgs=['01_screaming_tablet.png','02_frightened_capsule.png','03_dizzy_pill_bottle.png','04_spooky_cough_syrup.png','05_eyeball_blister_pack.png','06_shocked_vitamin_fizz.png','07_icy_medicine_blister.png','08_worried_thermometer.png','09_dizzy_bandage.png'];
const unpreparedchristmasImgs=['01_half_done_snowman.png','02_badly_wrapped_gift.png','03_plain_sock.png','04_broken_candy_cane.png','05_lopsided_tree.png','06_melting_gingerbread.png','07_tangled_lights.png','08_sad_santa_hat.png','09_dented_ornament.png']; const dontunwrapImgs=['01_wrapped_bomb.png','02_wrapped_knife.png','03_wrapped_hand.png','04_wrapped_poison.png','05_wrapped_chainsaw.png','06_wrapped_grenade.png','07_wrapped_heart.png','08_wrapped_skull.png','09_wrapped_tentacle.png'];
const alienImgs=['01_canned_moonlight.png','02_radioactive_milk.png','03_eyeball_cereal.png','04_bottled_screams.png','05_plasma_chips.png','06_alien_noodles.png','07_ufo_juice.png','08_meteor_popcorn.png','09_saturn_snack_cup.png'];
const uglyImgs=['01_gloop.png','02_chomps.png','03_noodle.png','04_blink.png','05_grumble.png','06_pinky.png','07_wobbles.png','08_stinky.png','09_crumbs.png'];
const weirdImgs=['01_eyeball.png','02_telephone.png','03_melting_clock.png','04_cloud_legs.png','05_door.png','06_eye_hand.png','07_fish_bulb.png','08_winged_key.png','09_moon_face.png'];
const nwTripleArtFiles={halloween:['assets/events/',sudokuImgs],patissserie:['assets/patissserie/',patissserieImgs],christmas:['assets/christmas/',christmasImgs],fairy:['assets/fairy/',fairyImgs],olympus:['assets/olympus/',olympusImgs],nineties:['assets/90s/',ninetiesImgs],weird:['assets/weird/',weirdImgs],ugly:['assets/ugly/',uglyImgs],alien:['assets/alien/',alienImgs],diner:['assets/diner/',dinerImgs],bodyparts:['assets/bodyparts/',bodypartsImgs],deepsea:['assets/deepsea/',deepseaImgs],solarsick:['assets/solarsick/',solarsickImgs],dontunwrap:['assets/dontunwrap/',dontunwrapImgs],unpreparedchristmas:['assets/unpreparedchristmas/',unpreparedchristmasImgs],underthebed:['assets/underthebed/',underthebedImgs],balloonwrong:['assets/balloonwrong/',balloonwrongImgs],donttakewater:['assets/donttakewater/',donttakewaterImgs],baggagehell:['assets/baggagehell/',baggagehellImgs],cakefail:['assets/cakefail/',cakefailImgs]};
const sudokuSrc=n=>currentWorld==='cakefail'?'assets/cakefail/'+cakefailImgs[n-1]:currentWorld==='baggagehell'?'assets/baggagehell/'+baggagehellImgs[n-1]:currentWorld==='donttakewater'?'assets/donttakewater/'+donttakewaterImgs[n-1]:currentWorld==='balloonwrong'?'assets/balloonwrong/'+balloonwrongImgs[n-1]:currentWorld==='underthebed'?'assets/underthebed/'+underthebedImgs[n-1]:currentWorld==='unpreparedchristmas'?'assets/unpreparedchristmas/'+unpreparedchristmasImgs[n-1]:currentWorld==='dontunwrap'?'assets/dontunwrap/'+dontunwrapImgs[n-1]:currentWorld==='solarsick'?'assets/solarsick/'+solarsickImgs[n-1]:currentWorld==='deepsea'?'assets/deepsea/'+deepseaImgs[n-1]:currentWorld==='bodyparts'?'assets/bodyparts/'+bodypartsImgs[n-1]:currentWorld==='diner'?'assets/diner/'+dinerImgs[n-1]:currentWorld==='alien'?'assets/alien/'+alienImgs[n-1]:currentWorld==='ugly'?'assets/ugly/'+uglyImgs[n-1]:currentWorld==='weird'?'assets/weird/'+weirdImgs[n-1]:currentWorld==='nineties'?'assets/90s/'+ninetiesImgs[n-1]:currentWorld==='olympus'?'assets/olympus/'+olympusImgs[n-1]:currentWorld==='fairy'?'assets/fairy/'+fairyImgs[n-1]:currentWorld==='christmas'?'assets/christmas/'+christmasImgs[n-1]:currentWorld==='patissserie'?'assets/patissserie/'+patissserieImgs[n-1]:'assets/events/'+sudokuImgs[n-1];
let sudoku=null, sudokuTimer=null, sudokuLossTimer=null;
function evSudokuCancelLoss(){if(sudokuLossTimer!==null){clearTimeout(sudokuLossTimer);sudokuLossTimer=null;}}
function evSudokuLeave(){if(sudoku?.challenge&&!sudoku.done)void nwChallengeForfeit(sudoku.challenge.id);if(sudoku&&!sudoku.done&&sudoku.start&&!sudoku.practiceOpponent&&!sudoku.challenge)nwSaveResult(sudoku,false);evSudokuCancelLoss();clearInterval(sudokuTimer);sudoku=null;}
function nwDinerDifficultySvg(){
 // DNET Option B: bold cartoon badge with no inner stripes or icons.
 return '<svg class="nw-diner-difficulty-art" viewBox="0 0 340 82" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M21 15 Q76 5 163 10 Q257 1 316 16 Q335 26 325 60 Q269 73 170 68 Q68 75 15 60 Q2 35 21 15Z" fill="#3C2022" transform="translate(2 6)"/>'+
 '<path d="M21 15 Q76 5 163 10 Q257 1 316 16 Q335 26 325 60 Q269 73 170 68 Q68 75 15 60 Q2 35 21 15Z" fill="#FF173A" stroke="#FFF0D5" stroke-width="5" stroke-linejoin="round"/>'+
 '</svg>';
}
function nwWeirdDifficultySvg(d){
 // The approved Surreal Sticker Collage: five individual vector silhouettes.
 const shapes={
 easy:{d:'M18 17 Q50 2 100 12 Q174 0 244 11 Q311 -2 326 23 Q339 47 307 59 Q251 70 170 63 Q80 73 32 61 Q-2 43 18 17Z',fill:'#EFFF4F'},
 medium:{d:'M11 20 L71 8 Q106 15 136 4 L197 12 Q266 -3 313 10 L332 31 L310 61 Q255 69 207 61 L145 68 Q71 58 24 64 L3 38Z',fill:'#FF5DAF'},
 hard:{d:'M17 10 Q102 16 170 3 Q247 14 317 7 L336 29 L318 63 Q250 53 170 68 Q87 55 20 64 L4 31Z',fill:'#49D7FF'},
 expert:{d:'M23 14 Q64 1 108 16 Q171 2 236 13 Q307 2 326 24 Q339 43 316 59 Q270 69 221 59 Q172 71 116 59 Q55 71 24 56 Q5 37 23 14Z',fill:'#D9D4F2'},
 extreme:{d:'M17 18 Q43 -1 88 8 Q126 18 172 6 Q232 -2 279 13 Q318 7 330 26 Q341 47 316 58 Q278 70 224 60 Q170 73 114 62 Q54 72 22 56 Q1 38 17 18Z',fill:'#30284F'}
 };
 const x=shapes[d]||shapes.easy;
 return '<svg class="nw-weird-sticker-art" viewBox="0 0 340 74" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="'+x.d+'" transform="translate(0 5)" fill="#120F25"/>'+
 '<path d="'+x.d+'" fill="'+x.fill+'" stroke="#F7F3FF" stroke-width="4" stroke-linejoin="round"/>'+
 '</svg>';
}
function nwUglyRubberButtonSvg(d){
 // Ugly Little Things: molded toy silhouettes, intentionally unlike WAIA stickers.
 const shapes={
  easy:{d:'M35 9 C70 -1 100 15 139 9 C184 1 214 18 256 8 C290 0 321 15 327 34 C332 60 300 68 259 63 C214 58 183 76 145 66 C107 56 79 74 37 62 C9 54 9 21 35 9Z',fill:'#A8E64D'},
  medium:{d:'M33 12 C66 -1 109 14 143 7 C187 -2 208 12 250 9 C291 2 322 15 326 37 C329 61 293 70 253 62 C207 73 186 59 142 67 C104 74 78 59 37 62 C10 56 10 24 33 12Z',fill:'#FF8D96'},
  hard:{d:'M31 11 C71 4 105 16 143 8 C183 -1 221 16 259 8 C303 2 328 22 324 42 C318 63 288 70 256 63 C213 59 175 73 139 67 C100 58 67 70 33 61 C10 54 10 22 31 11Z',fill:'#EEE5D9'},
  expert:{d:'M33 10 C68 -1 111 13 146 9 C180 0 217 15 255 8 C301 2 327 17 325 39 C324 61 285 68 251 63 C211 74 180 59 145 68 C99 76 78 58 36 62 C9 56 9 21 33 10Z',fill:'#8D7994'},
  extreme:{d:'M31 12 C68 0 104 17 142 9 C191 -1 211 17 259 8 C300 1 329 19 325 41 C322 61 292 69 254 63 C211 72 188 60 139 68 C94 75 69 60 34 62 C8 54 8 22 31 12Z',fill:'#48404D'}
 };
 const x=shapes[d]||shapes.easy;
 return '<svg class="nw-ugly-rubber-art" viewBox="0 0 340 82" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="'+x.d+'" transform="translate(1 5)" fill="#15151B"/>'+
 '<path d="'+x.d+'" fill="'+x.fill+'" stroke="#FAF3E8" stroke-width="4.4" stroke-linejoin="round"/>'+
 '</svg>';
}
function nwAlienCheckoutSvg(d){
 // Alien Supermarket: geometric checkout-terminal silhouettes from approved CSS/SVG preview.
 const shapes={
  easy:{d:'M14 4H305L336 25V44L322 54H35L4 35V15Z',fill:'#5BFFD8',edge:'#EAFBFF'},
  medium:{d:'M4 13L24 4H320L336 19V47L317 55H25L4 42Z',fill:'#7CFF4F',edge:'#5BFFD8'},
  hard:{d:'M22 4H315L337 18V43L319 55H17L3 41V21Z',fill:'#254556',edge:'#2EE6FF'},
  expert:{d:'M4 22L24 4H313L337 17V39L317 54H14L4 42Z',fill:'#203D50',edge:'#5BFFD8'},
  extreme:{d:'M15 4H310L337 24V43L323 54H20L3 39V15Z',fill:'#1B2D40',edge:'#7CFF4F'}
 };
 const x=shapes[d]||shapes.easy;
 return '<svg class="nw-alien-checkout-art" viewBox="0 0 340 58" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 // No black extrusion below any Alien Supermarket difficulty button.

 '<path d="'+x.d+'" fill="'+x.fill+'" stroke="'+x.edge+'" stroke-width="2.5" stroke-linejoin="round"/>'+
 '<path d="M28 12H298 M33 47H307" fill="none" stroke="'+(d==='easy'||d==='medium'?'#111827':'#2EE6FF')+'" stroke-width="1" opacity=".35"/>'+
 '</svg>';
}
/* Solar System Is Sick: approved vector button skins; no Sudoku geometry changes. */
function nwSolarButtonSvg(kind='easy'){
 const edge={easy:'#C8FF2C',medium:'#FF4FD2',hard:'#FFD26A',expert:'#FF77DF',extreme:'#E7FF3A',primary:'#C8FF2C',secondary:'#FF77DF'}[kind]||'#C8FF2C';
 const fill=kind==='primary'?'#C8FF2C':kind==='secondary'?'#FF77DF':'#08050F';
 return '<svg class="nw-solar-button-art" viewBox="0 0 300 58" preserveAspectRatio="none" focusable="false" aria-hidden="true">'+
 '<path d="M12 8L287 5L295 18L290 49L14 52L5 40Z" fill="'+fill+'" stroke="'+edge+'" stroke-width="3" stroke-linejoin="round"/>'+
 '<path d="M20 14H276" fill="none" stroke="'+(kind==='primary'||kind==='secondary'?'#170B24':edge)+'" stroke-opacity=".45" stroke-width="1.5"/>'+
 '<path d="M18 19V41M282 15V40" fill="none" stroke="'+(kind==='primary'||kind==='secondary'?'#170B24':edge)+'" stroke-width="2.5"/>'+
 '<circle cx="28" cy="29" r="4" fill="'+(kind==='primary'||kind==='secondary'?'#170B24':edge)+'"/>'+
 '<circle cx="272" cy="29" r="4" fill="'+(kind==='primary'||kind==='secondary'?'#170B24':edge)+'"/></svg>';
}
function nwSolarToolSvg(id){
 const path={
 evSudoHint:'<path d="M12 2L14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z"/>',
 evSudoNotes:'<path d="M4 20L9 19.2 21 7 17 3 5 15Z"/><path d="M14 6L18 10"/>',
 evSudoUndo:'<path d="M9 5L4 10 9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M9 4H21V20H9L2 12Z"/><path d="M12 9L18 15M18 9L12 15"/>'
 }[id]||'';
 return '<svg class="nw-solar-tool-art" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
}
function nwSolarResultMark(won){
 return '<svg class="nw-solar-result-icon" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'"><path d="'+(won?'M9 24L20 35 40 12':'M13 13L35 35M35 13L13 35')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
/* Something Under the Bed — approved bedtime pillow SVG skins.
   Decorative SVG only; never alters puzzle or PNG dimensions. */
function nwUnderBedPillowSvg(kind='easy',small=false){
 const colors={
  easy:['#F4D18F','#FFEAC0'],
  medium:['#C8AEC4','#F2D3E4'],
  hard:['#E69A87','#FFD0BC'],
  expert:['#7195AE','#BDD9E7'],
  extreme:['#B68A9D','#F4CDD7'],
  primary:['#F4D18F','#FFEAC0'],
  secondary:['#C8AEC4','#F2D3E4']
 };
 const [fill,edge]=colors[kind]||colors.easy;
 if(small)return '<svg class="nw-underbed-tray-art" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
  '<path d="M9 8Q19 4 28 8Q42 4 48 10Q53 19 49 46Q40 52 28 48Q16 52 8 46Q4 20 9 8Z" fill="'+fill+'" stroke="'+edge+'" stroke-width="2.2" stroke-linejoin="round"/>'+
  '<path d="M13 15Q28 12 43 15" stroke="#4B354C" stroke-width="1.3" opacity=".35" stroke-linecap="round" fill="none"/></svg>';
 return '<svg class="nw-underbed-button-art" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
  '<path d="M19 8Q78 2 144 8Q225 2 282 9L294 20Q299 31 289 46Q238 53 153 49Q67 55 14 47Q3 31 19 8Z" fill="'+fill+'" stroke="'+edge+'" stroke-width="2.5" stroke-linejoin="round"/>'+
  '<path d="M20 19Q150 12 279 19" stroke="#211C32" stroke-width="1.5" opacity=".46" stroke-linecap="round" fill="none"/>'+
  '<circle cx="22" cy="30" r="3" fill="#211C32" opacity=".8"/><circle cx="279" cy="30" r="3" fill="#211C32" opacity=".8"/></svg>';
}
function nwUnderBedToolSvg(id){
 const paths={
  evSudoHint:'<path d="M8 3H16L19 8V12Q19 16 16 18V21H8V18Q5 16 5 12V8Z"/><path d="M9 8L12 11L15 8M9 15H15"/>',
  evSudoNotes:'<path d="M5 19L9 18L20 7L17 4L6 15Z"/><path d="M14 7L17 10"/>',
  evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
  evSudoErase:'<path d="M9 4H21V20H9L2 12Z"/><path d="M12 9L18 15M18 9L12 15"/>'
 };
 return '<svg class="nw-underbed-tool-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[id]||'')+'</svg>';
}
function nwUnderBedResultMark(won){
 return '<svg class="nw-underbed-result-art" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="'+(won?'Completed':'Failed')+'"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Body Parts Department: scoped office stationery SVG controls; existing Sudoku geometry preserved. */
function nwBodypartsStampSvg(kind='easy'){
 const c={easy:'#B3F0D9',medium:'#D6B5E5',hard:'#F2D6BC',expert:'#CADDEB',extreme:'#ECD1E0',primary:'#B3F0D9',secondary:'#D6B5E5'}[kind]||'#B3F0D9';
 return '<svg class="nw-bodyparts-stamp-svg" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect x="9" y="7" width="282" height="44" rx="3" fill="'+c+'" stroke="#665477" stroke-width="2.5"/><rect x="16" y="14" width="268" height="30" rx="1" fill="none" stroke="#665477" stroke-width="1.2" stroke-dasharray="5 3"/></svg>';
}
function nwBodypartsPaperSvg(){
 return '<svg class="nw-bodyparts-paper-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="nw-bodyparts-paper" d="M8 4H37L48 15V52H8Z" fill="#FCFAF7" stroke="#9471B4" stroke-width="2"/><path d="M37 4V15H48" fill="#D6B5E5" stroke="#9471B4" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}
function nwBodypartsToolSvg(id){
 const p={evSudoHint:'<path d="M5 4H19V20H5Z"/><path d="M9 9H15M12 6V12"/>',evSudoNotes:'<path d="M4 4H17L20 7V20H4Z"/><path d="M8 11H16M8 15H16"/>',evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',evSudoErase:'<path d="M6 5H19V19H6Z"/><path d="M9 10L15 16M15 10L9 16"/>'};
 return '<svg class="nw-bodyparts-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwBodypartsResultSvg(won){
 return '<svg class="nw-bodyparts-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Halloween — approved neon haunted arcade SVG controls, decoration only. */
function nwHalloweenCoffinSvg(kind='easy'){
 const c={easy:'#FF6BD4',medium:'#77BDFF',hard:'#FFA856',expert:'#91E899',extreme:'#CE9EFF',primary:'#FF6BD4',secondary:'#BE83FF'}[kind]||'#FF6BD4';
 return '<svg class="nw-halloween-coffin-svg" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M29 5H271L294 19V39L271 53H29L6 39V19Z" fill="#190C25" stroke="'+c+'" stroke-width="3" stroke-linejoin="round"/><path d="M34 13H266L284 23V35L266 45H34L16 35V23Z" fill="none" stroke="'+c+'" stroke-width="1.1" opacity=".48"/></svg>';
}
function nwHalloweenTraySvg(i){
 const c=['#FF6BD4','#77BDFF','#FFA856','#91E899','#FFF0FF','#FF6B7E','#BE83FF','#FFE57B','#76E8F0'][i]||'#FF6BD4';
 return '<svg class="nw-halloween-tray-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="nw-halloween-tray-rim" d="M12 3H44L53 12V44L44 53H12L3 44V12Z" fill="#210F2C" stroke="'+c+'" stroke-width="2" stroke-linejoin="round"/><path d="M15 9H41L47 15V41L41 47H15L9 41V15Z" fill="none" stroke="'+c+'" stroke-width=".8" opacity=".5"/></svg>';
}
function nwHalloweenToolSvg(id){
 const p={evSudoHint:'<path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4Z"/>',evSudoNotes:'<path d="M5 19L9 18L20 7L17 4L6 15Z M14 7L17 10"/>',evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',evSudoErase:'<path d="M9 4H21V20H9L2 12Z M12 9L18 15M18 9L12 15"/>'};
 return '<svg class="nw-halloween-tool-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(p[id]||'')+'</svg>';
}
function nwHalloweenResultSvg(won){
 return '<svg class="nw-halloween-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Do Not Unwrap That — vintage mystery gift SVG controls, scoped to this world. */
function nwDontUnwrapGiftTagSvg(kind='easy'){
 const colors={easy:'#DDE4C4',medium:'#F4D9AD',hard:'#D4C1A1',expert:'#B9D5B2',extreme:'#E7C7AD',primary:'#DDE4C4',secondary:'#F4D9AD'};
 const paper=colors[kind]||colors.easy;
 return '<svg class="nw-dontunwrap-tag-svg" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M11 11Q3 3 2 1" fill="none" stroke="#DAB67A" stroke-width="2" stroke-linecap="round"/>'+
 '<path d="M31 6H284Q293 6 293 16V43Q293 52 284 52H31L6 29Z" fill="'+paper+'" stroke="#9B5A35" stroke-width="2.5" stroke-linejoin="round"/>'+
 '<path d="M38 13H279V45H38L18 29Z" fill="none" stroke="#8D6046" stroke-width="1" opacity=".5" stroke-dasharray="3 3"/>'+
 '<circle cx="29" cy="29" r="5" fill="#513322" stroke="#A76742" stroke-width="2"/></svg>';
}
function nwDontUnwrapParcelSvg(){
 return '<svg class="nw-dontunwrap-parcel-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<rect class="nw-dontunwrap-parcel-paper" x="4" y="4" width="48" height="48" rx="4" fill="#DDE4C4" stroke="#A77950" stroke-width="2"/>'+
 '<path d="M24 5H31V51H24Z M5 24H51V31H5Z" fill="#B86F4F" opacity=".72"/></svg>';
}
function nwDontUnwrapToolSvg(id){
 const paths={
 evSudoHint:'<path d="M7 8L12 3L17 8V16L12 21L7 16Z"/><path d="M12 7V15M9 12H15"/>',
 evSudoNotes:'<path d="M5 19L9 18L20 7L17 4L6 15Z"/><path d="M14 7L17 10"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M9 4H21V20H9L2 12Z"/><path d="M12 9L18 15M18 9L12 15"/>'
 };
 return '<svg class="nw-dontunwrap-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[id]||'')+'</svg>';
}
function nwDontUnwrapResultSvg(won){
 return '<svg class="nw-dontunwrap-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Deep Sea Misfits — bioluminescent observation-window SVG controls, scoped. */
function nwDeepSeaWindowSvg(kind='easy'){
 const c={easy:'#5AF2E3',medium:'#77D4FF',hard:'#BBA6FF',expert:'#A7F5D2',extreme:'#F2BBEF',primary:'#5AF2E3',secondary:'#77D4FF'}[kind]||'#5AF2E3';
 return '<svg class="nw-deepsea-window-svg" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M25 6Q74 2 150 7Q226 2 275 6Q297 15 291 29Q297 44 275 52Q221 56 150 51Q75 56 25 52Q3 43 9 29Q3 15 25 6Z" fill="#0B2432" stroke="'+c+'" stroke-width="2.8" stroke-linejoin="round"/>'+
 '<path d="M29 13Q105 9 150 14Q218 9 271 13Q286 20 283 29Q286 39 271 45Q210 49 150 44Q80 49 29 45Q16 37 17 29Q16 21 29 13Z" fill="none" stroke="'+c+'" stroke-width="1" opacity=".43"/>'+
 '<circle cx="29" cy="29" r="3" fill="'+c+'"/><circle cx="271" cy="29" r="3" fill="'+c+'"/></svg>';
}
function nwDeepSeaTraySvg(){
 return '<svg class="nw-deepsea-tray-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path class="nw-deepsea-tray-rim" d="M14 4Q28 0 42 4Q54 14 52 28Q54 43 42 52Q28 56 14 52Q2 43 4 28Q2 14 14 4Z" fill="#091D29" stroke="#3FE0D0" stroke-width="2"/>'+
 '<circle cx="8" cy="28" r="2" fill="#5AF2E3"/><circle cx="48" cy="28" r="2" fill="#5AF2E3"/></svg>';
}
function nwDeepSeaToolSvg(id){
 const p={
 evSudoHint:'<path d="M12 2C7 8 6 11 6 15A6 6 0 0 0 18 15C18 11 17 8 12 2Z"/><path d="M12 9V17M9 14H15"/>',
 evSudoNotes:'<path d="M5 19L9 18L20 7L17 4L6 15Z"/><path d="M14 7L17 10"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M9 4H21V20H9L2 12Z"/><path d="M12 9L18 15M18 9L12 15"/>'
 };
 return '<svg class="nw-deepsea-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwDeepSeaResultSvg(won){
 return '<svg class="nw-deepsea-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Balloon Animals Gone Wrong — inflated rubber SVG controls, scoped to world. */
function nwBalloonInflatedSvg(kind='easy'){
 const c={easy:'#FFD96A',medium:'#FFB1D7',hard:'#BCEFBF',expert:'#CDB9FF',extreme:'#AEE8FA',primary:'#FFD96A',secondary:'#FFB1D7'}[kind]||'#FFD96A';
 return '<svg class="nw-balloon-inflated-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M27 8Q61 3 143 6Q226 4 260 8Q279 10 281 24L294 30L281 36Q278 51 260 53Q163 57 52 53Q13 53 10 33Q5 13 27 8Z" fill="'+c+'" stroke="#963D95" stroke-width="2.6" stroke-linejoin="round"/>'+
 '<path d="M281 24L297 19L294 30L297 41L281 36Z" fill="#9A50B8" stroke="#963D95" stroke-width="1.2"/>'+
 '<path d="M27 18Q66 12 126 14" fill="none" stroke="#FFFFFF" stroke-width="3.3" stroke-linecap="round" opacity=".73"/>'+
 '<path d="M35 46Q130 50 248 46" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".35"/></svg>';
}
function nwBalloonOrbSvg(i){
 const c=['#FFD5EA','#FFDA8E','#C9F4C4','#D8CDFF','#BCEBF9','#FFC6B1','#E7BFFA','#FBEDAC','#B7F0DC'][i]||'#FFD5EA';
 return '<svg class="nw-balloon-orb-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path class="nw-balloon-orb-rubber" d="M28 4C43 2 51 13 51 26C51 38 44 46 30 49L28 54L25 49C12 46 5 38 5 26C5 13 14 3 28 4Z" fill="'+c+'" stroke="#9A50B8" stroke-width="2"/>'+
 '<path d="M13 18Q17 10 26 10" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>';
}
function nwBalloonToolSvg(id){
 const p={
 evSudoHint:'<path d="M12 3C5 3 4 9 5 13C6 18 9 19 12 19S18 18 19 13C20 9 19 3 12 3Z"/><path d="M12 19V22M10 9H14M12 7V11"/>',
 evSudoNotes:'<path d="M5 19L9 18L20 7L17 4L6 15Z M14 7L17 10"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M9 4H21V20H9L2 12Z M12 9L18 15M18 9L12 15"/>'
 };
 return '<svg class="nw-balloon-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwBalloonResultSvg(won){
 return '<svg class="nw-balloon-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* 90s Throwback — chunky Memphis arcade SVG controls scoped to this world. */
function nwNinetiesArcadeSvg(kind='easy'){
 const c={easy:'#FF5BA6',medium:'#36E0DC',hard:'#FFE36D',expert:'#AF8BFF',extreme:'#68DF8F',primary:'#FF5BA6',secondary:'#36E0DC'}[kind]||'#FF5BA6';
 return '<svg class="nw-nineties-arcade-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M12 11H282V54H12Z" fill="#0F1230"/>'+
 '<path d="M9 5H279L291 17V47L279 53H9Z" fill="#303759" stroke="'+c+'" stroke-width="3" stroke-linejoin="miter"/>'+
 '<path d="M9 5H23V53H9Z" fill="'+c+'"/>'+
 '<path d="M31 13H270L282 21V41L270 45H31Z" fill="none" stroke="#F6F4FF" stroke-width="1.1" opacity=".42"/></svg>';
}
function nwNinetiesTokenSvg(i){
 const c=['#FF5BA6','#36E0DC','#FFE36D','#AF8BFF','#68DF8F','#FF9A61','#CE8AFF','#70D9EF','#F67CA8'][i]||'#FF5BA6';
 return '<svg class="nw-nineties-token-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path class="nw-nineties-token-plastic" d="M5 4H44L52 12V52H5Z" fill="#343B6A" stroke="'+c+'" stroke-width="2.2"/>'+
 '<path d="M44 4V12H52Z" fill="'+c+'"/></svg>';
}
function nwNinetiesToolSvg(id){
 const p={
 evSudoHint:'<path d="M9 3H15V9H21V15H15V21H9V15H3V9H9Z"/>',
 evSudoNotes:'<path d="M4 4H20V20H4Z M8 9H16M8 13H16M8 17H13"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M9 4H21V20H9L2 12Z M12 9L18 15M18 9L12 15"/>'
 };
 return '<svg class="nw-nineties-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwNinetiesResultSvg(won){
 return '<svg class="nw-nineties-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Cake Decorating Was a Mistake — messy piped-frosting SVG controls, world scoped. */
function nwCakeFrostingSvg(kind='easy'){
 const c={easy:'#F7CF91',medium:'#F4BFC9',hard:'#D9DFB6',expert:'#E9C8E2',extreme:'#F6DDD1',primary:'#F7CF91',secondary:'#F4BFC9'}[kind]||'#F7CF91';
 return '<svg class="nw-cake-frosting-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M20 13H280V53H20Z" fill="#A95570"/>'+
 '<path d="M16 8Q47 5 72 8Q98 3 127 8Q153 4 181 8Q216 4 248 8Q276 4 284 13V31Q284 41 274 41Q266 41 266 31V28Q262 25 258 28V39Q258 47 250 47Q242 47 242 37V29Q227 32 218 29V35Q218 43 210 43Q202 43 202 35V29H96V35Q96 44 87 44Q78 44 78 35V29H56V40Q56 47 48 47Q40 47 40 39V27Q27 31 16 29Q8 27 10 18Q10 11 16 8Z" fill="'+c+'" stroke="#8B4963" stroke-width="2.3" stroke-linejoin="round"/>'+
 '<path d="M30 16Q91 10 142 14" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".58"/></svg>';
}
function nwCakeFrostedTileSvg(i){
 const c=['#F6D2DC','#F6E0B4','#DDE5CB','#E6CFE5','#F3D8CE','#E7D3B9','#F8D4BD','#E8C4D4','#F7E4B5'][i]||'#F6D2DC';
 return '<svg class="nw-cake-tile-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path class="nw-cake-tile-base" d="M8 5H48Q52 5 52 10V46Q52 51 46 51H10Q4 51 4 46V10Q4 5 8 5Z" fill="'+c+'" stroke="#A95570" stroke-width="2" stroke-linejoin="round"/>'+
 '<path d="M7 8H49V15Q47 18 44 15V21Q44 26 39 25Q35 24 36 20V16H25V20Q25 25 20 24Q16 23 17 19V15Q10 19 7 15Z" fill="#F9F0E5" stroke="#A95570" stroke-width=".75"/></svg>';
}
function nwCakeToolSvg(id){
 const p={
 evSudoHint:'<path d="M5 8H19L17 18H7Z M7 8Q12 2 17 8 M9 12H15"/>',
 evSudoNotes:'<path d="M4 20L8 19L20 7L17 4L5 16Z M14 7L17 10"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M5 18L17 6L21 10L9 22H5Z M15 8L19 12"/>'
 };
 return '<svg class="nw-cake-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwCakeResultSvg(won){
 return '<svg class="nw-cake-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Baggage Claim From Hell — vintage luggage case SVG controls, world scoped. */
function nwBaggageCaseSvg(kind='easy'){
 const c={easy:'#F8C86B',medium:'#F3B49B',hard:'#C4DFB6',expert:'#EDD0A8',extreme:'#E6B5AA',primary:'#F8C86B',secondary:'#F3B49B'}[kind]||'#F8C86B';
 return '<svg class="nw-baggage-case-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M121 6V3Q121 1 125 1H175Q179 1 179 3V6" fill="none" stroke="#8B4529" stroke-width="4"/>'+
 '<path d="M17 12H283Q290 12 290 20V49Q290 55 283 55H17Q10 55 10 49V20Q10 12 17 12Z" fill="'+c+'" stroke="#8B4529" stroke-width="2.5"/>'+
 '<path d="M24 18H276V49H24Z" fill="none" stroke="#79422D" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>'+
 '<path d="M35 13V54M265 13V54" stroke="#8B4529" stroke-width="4" opacity=".36"/>'+
 '<g fill="#DCA968" stroke="#A75B31" stroke-width="1"><circle cx="18" cy="20" r="3"/><circle cx="282" cy="20" r="3"/><circle cx="18" cy="47" r="3"/><circle cx="282" cy="47" r="3"/></g></svg>';
}
function nwBaggageLabelSvg(i){
 const c=['#F8D6A9','#F3D0B9','#E1E0BB','#E8CFA8','#F5DCC6','#D8D8BC','#F3D6A4','#E6BE9B','#EAD8B8'][i]||'#F8D6A9';
 return '<svg class="nw-baggage-label-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path class="nw-baggage-label-paper" d="M8 5H43L52 14V51H8Q4 51 4 47V9Q4 5 8 5Z" fill="'+c+'" stroke="#A54C25" stroke-width="2"/>'+
 '<path d="M10 12H39L46 19V45H10Z" fill="none" stroke="#A54C25" stroke-width=".8" stroke-dasharray="2 2"/>'+
 '<circle cx="45" cy="11" r="2" fill="#A54C25"/></svg>';
}
function nwBaggageToolSvg(id){
 const p={
 evSudoHint:'<path d="M5 6H19V18H5Z M9 6V3H15V6 M9 12H15M12 9V15"/>',
 evSudoNotes:'<path d="M4 6H20V20H4Z M8 3V9 M16 3V9 M8 13H16 M8 17H13"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M5 5H19V19H5Z M9 9L15 15M15 9L9 15"/>'
 };
 return '<svg class="nw-baggage-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwBaggageResultSvg(won){
 return '<svg class="nw-baggage-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Do Not Take With Water — radioactive midnight prescription SVG controls. */
function nwWaterRxSvg(kind='easy'){
 const color={easy:'#C5F257',medium:'#7DDCC7',hard:'#F5E2A4',expert:'#A6D7EC',extreme:'#FFBB8C',primary:'#C5F257',secondary:'#7DDCC7'}[kind]||'#C5F257';
 return '<svg class="nw-water-rx-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<path d="M10 7H290V52H10Q5 52 5 47V12Q5 7 10 7Z" fill="'+color+'" stroke="#568C6C" stroke-width="2.2"/>'+
 '<path d="M10 7H35V52H10Q5 52 5 47V12Q5 7 10 7Z" fill="#243C39"/>'+
 '<path d="M43 14H278M43 46H278" fill="none" stroke="#335B4E" opacity=".6"/>'+
 '<rect x="17" y="22" width="12" height="12" rx="2" fill="#FF965C"/>'+
 '<path d="M20 28H26M23 25V31" stroke="#243C39" stroke-width="1.5"/></svg>';
}
function nwWaterBlisterSvg(i){
 const active=i===3;
 const color=active?'#4B673D':'#263E38';
 return '<svg class="nw-water-blister-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<rect class="nw-water-blister-base" x="4" y="4" width="48" height="48" rx="7" fill="'+color+'" stroke="#7DDCC7" stroke-width="2"/>'+
 '<rect x="10" y="10" width="36" height="36" rx="5" fill="none" stroke="#7DDCC7" stroke-dasharray="2 2" opacity=".6"/>'+
 '<circle cx="44" cy="12" r="2" fill="#FF965C"/></svg>';
}
function nwWaterToolSvg(id){
 const p={
 evSudoHint:'<path d="M4 6H20V18H4Z M8 11H16M12 7V15"/>',
 evSudoNotes:'<path d="M5 4H19V20H5Z M9 9H15M9 13H15M9 17H13"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M3 12L10 5H21V19H10Z M12 9L17 14M17 9L12 14"/>'
 };
 return '<svg class="nw-water-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwWaterResultSvg(won){
 return '<svg class="nw-water-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
/* Pâtisserie — approved wooden bakery signs and pastry-box SVG controls. */
function nwPatWoodSvg(kind='primary'){
 const dark=kind==='secondary',color=dark?'#9B6A3D':'#A87542';
 return '<svg class="nw-pat-wood-svg" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<rect x="18" y="10" width="264" height="40" rx="6" fill="'+color+'" stroke="#7B4F2A" stroke-width="2.5"/>'+
 '<rect x="27" y="15" width="246" height="30" rx="4" fill="none" stroke="#D5AD72" stroke-width="1.2" opacity=".75"/>'+
 '<circle cx="34" cy="30" r="3" fill="#6E4524"/><circle cx="266" cy="30" r="3" fill="#6E4524"/>'+
 '<path d="M55 18H110M190 42H245" stroke="#E7C48D" stroke-width="1.2" opacity=".4"/></svg>';
}
function nwPatTraySvg(i){
 return '<svg class="nw-pat-tray-svg" viewBox="0 0 56 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 '<rect class="nw-pat-tray-base" x="6" y="8" width="44" height="40" rx="4" fill="#FFF8EC" stroke="#A87542" stroke-width="1.7"/>'+
 '<rect x="10" y="12" width="36" height="32" rx="3" fill="none" stroke="#D5AD72" stroke-width="1"/>'+
 '<path d="M8 8H48M8 48H48" stroke="#7B4F2A" stroke-width=".8" opacity=".25"/></svg>';
}
function nwPatToolSvg(id){
 const p={
 evSudoHint:'<path d="M5 15Q5 9 12 9Q19 9 19 15V18H5Z M12 9V6M9 6H15"/>',
 evSudoNotes:'<path d="M6 3H18V21H6Z M9 8H15 M9 12H15 M9 16H13"/>',
 evSudoUndo:'<path d="M9 5L4 10L9 15M4 10H15A6 6 0 0 1 15 22"/>',
 evSudoErase:'<path d="M5 17L17 5L21 9L9 21H5Z M15 7L19 11"/>'
 };
 return '<svg class="nw-pat-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(p[id]||'')+'</svg>';
}
function nwPatResultSvg(won){
 return '<svg class="nw-pat-result-svg" viewBox="0 0 48 48" role="img" aria-label="'+(won?'Completed':'Failed')+'" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(won?'M9 24L20 35L40 12':'M13 13L35 35M35 13L13 35')+'"/></svg>';
}
function evSudokuMenu(){evSudokuLeave();applyTheme(worlds[currentWorld].theme);evDisplay(`${evHeader(worlds[currentWorld].name,showRooms,false,true)}<section class="difficulty-panel"><button type="button" class="nw-fav-toggle" id="nwFavToggle" aria-pressed="${nwIsFav(currentWorld)}">${nwIsFav(currentWorld)?'♥ FAVOURITED':'♡ ADD TO FAV'}</button><h2>CHOOSE DIFFICULTY</h2><div class="difficulty-list">${Object.keys(difficulties).map(d=>`<button class="theme-button${currentWorld==='diner'?' nw-diner-difficulty':currentWorld==='weird'?' nw-weird-difficulty nw-weird-'+d:currentWorld==='ugly'?' nw-ugly-difficulty nw-ugly-'+d:currentWorld==='alien'?' nw-alien-difficulty nw-alien-'+d:currentWorld==='solarsick'?' nw-solar-difficulty':currentWorld==='underthebed'?' nw-underbed-difficulty':currentWorld==='bodyparts'?' nw-bodyparts-difficulty':currentWorld==='halloween'?' nw-halloween-difficulty':currentWorld==='dontunwrap'?' nw-dontunwrap-difficulty':currentWorld==='deepsea'?' nw-deepsea-difficulty':currentWorld==='balloonwrong'?' nw-balloon-difficulty':currentWorld==='nineties'?' nw-nineties-difficulty':currentWorld==='cakefail'?' nw-cake-difficulty':currentWorld==='baggagehell'?' nw-baggage-difficulty':currentWorld==='donttakewater'?' nw-water-difficulty':currentWorld==='patissserie'?' nw-pat-difficulty':''}" data-difficulty="${d}">${currentWorld==='diner'?nwDinerDifficultySvg():currentWorld==='weird'?nwWeirdDifficultySvg(d):currentWorld==='ugly'?nwUglyRubberButtonSvg(d):currentWorld==='alien'?nwAlienCheckoutSvg(d):currentWorld==='solarsick'?nwSolarButtonSvg(d):currentWorld==='underthebed'?nwUnderBedPillowSvg(d):currentWorld==='bodyparts'?nwBodypartsStampSvg(d):currentWorld==='halloween'?nwHalloweenCoffinSvg(d):currentWorld==='dontunwrap'?nwDontUnwrapGiftTagSvg(d):currentWorld==='deepsea'?nwDeepSeaWindowSvg(d):currentWorld==='balloonwrong'?nwBalloonInflatedSvg(d):currentWorld==='nineties'?nwNinetiesArcadeSvg(d):currentWorld==='cakefail'?nwCakeFrostingSvg(d):currentWorld==='baggagehell'?nwBaggageCaseSvg(d):currentWorld==='donttakewater'?nwWaterRxSvg(d):currentWorld==='patissserie'?nwPatWoodSvg(d):''}<span>${d.toUpperCase()}</span></button>`).join('')}</div></section>`);evRoot.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>evSudokuStart(b.dataset.difficulty));evRoot.querySelector('#nwFavToggle').onclick=()=>{const v=nwToggleFav(currentWorld),b=evRoot.querySelector('#nwFavToggle');b.textContent=v?'♥ FAVOURITED':'♡ ADD TO FAV';b.setAttribute('aria-pressed',String(v));};}
function shuffled(v){const x=[...v];for(let i=x.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[x[k],x[i]]=[x[i],x[k]]}return x}
function makeSudokuSolution(){const nums=shuffled([1,2,3,4,5,6,7,8,9]);const rOrder=shuffled([0,1,2]).flatMap(b=>shuffled([0,1,2]).map(n=>b*3+n));const cOrder=shuffled([0,1,2]).flatMap(b=>shuffled([0,1,2]).map(n=>b*3+n));return Array.from({length:81},(_,i)=>nums[(rOrder[Math.floor(i/9)]*3+Math.floor(rOrder[Math.floor(i/9)]/3)+cOrder[i%9])%9])}
// Count solutions with row/column/box bitmasks and most-constrained-cell search.
// Stop at two; we only need to distinguish UNIQUE from AMBIGUOUS.
function nwSudokuCountSolutions(input,limit=2){
  const cells=Array.from(input,Number),row=new Int32Array(9),col=new Int32Array(9),box=new Int32Array(9);
  if(cells.length!==81)return 0;
  const unit=i=>((Math.floor(i/27)*3)+Math.floor((i%9)/3));
  for(let i=0;i<81;i++){
    const v=cells[i];if(!v)continue;
    if(!Number.isInteger(v)||v<1||v>9)return 0;
    const r=Math.floor(i/9),c=i%9,b=unit(i),bit=1<<v;
    if((row[r]|col[c]|box[b])&bit)return 0;
    row[r]|=bit;col[c]|=bit;box[b]|=bit;
  }
  const popcount=m=>{let n=0;while(m){m&=m-1;n++;}return n;};
  let found=0;
  function visit(){
    let best=-1,mask=0,least=10;
    for(let i=0;i<81;i++)if(!cells[i]){
      const r=Math.floor(i/9),c=i%9,b=unit(i);
      const opts=0x3FE&~(row[r]|col[c]|box[b]);
      if(!opts)return;
      const n=popcount(opts);if(n<least){best=i;mask=opts;least=n;if(n===1)break;}
    }
    if(best===-1){found++;return;}
    const r=Math.floor(best/9),c=best%9,b=unit(best);
    while(mask&&found<limit){
      const bit=mask&-mask;mask-=bit;
      const n=31-Math.clz32(bit);
      cells[best]=n;row[r]|=bit;col[c]|=bit;box[b]|=bit;
      visit();
      cells[best]=0;row[r]^=bit;col[c]^=bit;box[b]^=bit;
    }
  }
  visit();return found;
}
// Kept for compatibility: this helper now confirms uniqueness before returning a solution.
function gbSolveSudokuPuzzle(puzzle){
  if(nwSudokuCountSolutions(puzzle,2)!==1)return null;
  const a=Array.from(puzzle,Number);
  function solve(){
    let best=-1,opts=[];
    for(let i=0;i<81;i++)if(!a[i]){
      const r=Math.floor(i/9),c=i%9,b0=Math.floor(r/3)*3,c0=Math.floor(c/3)*3;
      const used=new Set();for(let k=0;k<9;k++){used.add(a[r*9+k]);used.add(a[k*9+c]);}
      for(let dr=0;dr<3;dr++)for(let dc=0;dc<3;dc++)used.add(a[(b0+dr)*9+c0+dc]);
      const avail=[1,2,3,4,5,6,7,8,9].filter(x=>!used.has(x));
      if(!avail.length)return false;
      if(best<0||avail.length<opts.length){best=i;opts=avail;if(opts.length===1)break;}
    }
    if(best<0)return true;
    for(const n of opts){a[best]=n;if(solve())return true;}a[best]=0;return false;
  }
  return solve()?a:null;
}
// Carve clues only while the puzzle retains exactly one possible completion.
// More clues on the hard modes are intentional: random 30%-filled grids are usually ambiguous.
const nwSudokuTargetGivens={easy:49,medium:41,hard:35,expert:32,extreme:29};
function nwMakeUniquePuzzle(difficulty){
  const desired=nwSudokuTargetGivens[difficulty]||41;
  let best=null;
  for(let attempt=0;attempt<5;attempt++){
    const answer=makeSudokuSolution(),puzzle=[...answer];
    for(const i of shuffled(Array.from({length:81},(_,i)=>i))){
      if(puzzle.filter(Boolean).length<=desired)break;
      const held=puzzle[i];puzzle[i]=0;
      if(nwSudokuCountSolutions(puzzle,2)!==1)puzzle[i]=held;
    }
    const count=puzzle.filter(Boolean).length;
    if(!best||count<best.count)best={answer,puzzle,count};
    if(count<=desired)break;
  }
  // Never sacrifice uniqueness just to hit a nominal difficulty clue count.
  return best;
}
async function evSudokuStart(difficulty,practiceOpponent=null,challengeMode=null){
  evSudokuLeave();
  applyTheme(worlds[currentWorld].theme);
  const {answer,puzzle}=challengeMode?{answer:[...challengeMode.solution].map(Number),puzzle:[...challengeMode.puzzle].map(Number)}:practiceOpponent?{answer:[...practiceOpponent.solved_grid].map(Number),puzzle:[...practiceOpponent.puzzle_clues].map(Number)}:nwMakeUniquePuzzle(difficulty);
  const givens=new Set(puzzle.map((n,i)=>n?i:-1).filter(i=>i>=0));
  sudoku={answer,values:[...puzzle],givens,selected:-1,choice:0,highlight:0,mistakes:0,wrong:new Set(),notes:false,noteMarks:{},history:[],hintsLeft:difficulties[difficulty].hints,start:Date.now(),difficulty,done:false,initialPuzzle:[...puzzle],reportAttempts:0,reportCorrect:0,reportHints:0,reportSaved:false,practiceOpponent,challenge:challengeMode,challengePending:false,doublePractice:!practiceOpponent&&!challengeMode&&nwDoublePracticeActive};
  evSudokuRender();if(practiceOpponent)sudoku.start=Date.now();clearInterval(sudokuTimer);
  sudokuTimer=setInterval(()=>{if(!sudoku||sudoku.done)return;const el=evRoot.querySelector('#evSudoTime');if(el){const time=Math.floor((Date.now()-sudoku.start)/1000);el.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}if(sudoku.practiceOpponent)nwBattleProgressTick(sudoku)},250);
}
// Preserve previous cell value AND pencil notes for undo, including hinted cells.
function nwRecordSudokuHistory(s,i){
  s.history.push({i,value:s.values[i],wrong:s.wrong.has(i),notes:[...(s.noteMarks[i]||[])],hintsLeft:s.hintsLeft});
}
function evSudokuRender(){
  const s=sudoku;if(!s)return;
  const pts=difficulties[s.difficulty].points;
  evDisplay(`${evHeader(worlds[currentWorld].name,s.challenge?nwChallengeBack:s.practiceOpponent?nwBattleReturn:s.doublePractice?nwDoublePracticeScreen:evSudokuMenu,true,true)}${s.practiceOpponent?`<div class="nw-opponent-panel"><div class="nw-opponent-small-avatar">${nwBattleProfileArt(s.practiceOpponent,'nw-opponent-small-img')}</div><div class="nw-opponent-details"><div class="nw-opponent-top"><strong>${nwEscape(s.practiceOpponent.display_name)}</strong><span id="nwOpponentPct">0%</span></div><div class="nw-opponent-track" role="progressbar" aria-label="Opponent puzzle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="nwOpponentProgress"></div></div><div class="nw-opponent-errors">MISTAKES <span id="nwOpponentMistakes">0 / 3</span></div></div></div>`:''}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div>${s.practiceOpponent?'':'<div><small>POINTS</small><strong>—</strong></div>'}</div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${(currentWorld==='cakefail'?cakefailImgs:currentWorld==='baggagehell'?baggagehellImgs:currentWorld==='donttakewater'?donttakewaterImgs:currentWorld==='balloonwrong'?balloonwrongImgs:currentWorld==='underthebed'?underthebedImgs:currentWorld==='unpreparedchristmas'?unpreparedchristmasImgs:currentWorld==='dontunwrap'?dontunwrapImgs:currentWorld==='solarsick'?solarsickImgs:currentWorld==='deepsea'?deepseaImgs:currentWorld==='bodyparts'?bodypartsImgs:currentWorld==='diner'?dinerImgs:currentWorld==='alien'?alienImgs:currentWorld==='ugly'?uglyImgs:currentWorld==='weird'?weirdImgs:currentWorld==='nineties'?ninetiesImgs:currentWorld==='olympus'?olympusImgs:currentWorld==='fairy'?fairyImgs:currentWorld==='christmas'?christmasImgs:currentWorld==='patissserie'?patissserieImgs:sudokuImgs).map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}" class="${currentWorld==='underthebed'?'nw-underbed-tray-piece':currentWorld==='bodyparts'?'nw-bodyparts-tray-piece':currentWorld==='halloween'?'nw-halloween-tray-piece':currentWorld==='dontunwrap'?'nw-dontunwrap-tray-piece':currentWorld==='deepsea'?'nw-deepsea-tray-piece':currentWorld==='balloonwrong'?'nw-balloon-tray-piece':currentWorld==='nineties'?'nw-nineties-tray-piece':currentWorld==='cakefail'?'nw-cake-tray-piece':currentWorld==='baggagehell'?'nw-baggage-tray-piece':currentWorld==='donttakewater'?'nw-water-tray-piece':currentWorld==='patissserie'?'nw-pat-tray-piece':''}">${currentWorld==='underthebed'?nwUnderBedPillowSvg(['easy','medium','hard','expert','extreme'][i%5],true):currentWorld==='bodyparts'?nwBodypartsPaperSvg():currentWorld==='halloween'?nwHalloweenTraySvg(i):currentWorld==='dontunwrap'?nwDontUnwrapParcelSvg():currentWorld==='deepsea'?nwDeepSeaTraySvg():currentWorld==='balloonwrong'?nwBalloonOrbSvg(i):currentWorld==='nineties'?nwNinetiesTokenSvg(i):currentWorld==='cakefail'?nwCakeFrostedTileSvg(i):currentWorld==='baggagehell'?nwBaggageLabelSvg(i):currentWorld==='donttakewater'?nwWaterBlisterSvg(i):currentWorld==='patissserie'?nwPatTraySvg(i):''}${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${currentWorld==='solarsick'?nwSolarToolSvg(id):currentWorld==='underthebed'?nwUnderBedToolSvg(id):currentWorld==='bodyparts'?nwBodypartsToolSvg(id):currentWorld==='halloween'?nwHalloweenToolSvg(id):currentWorld==='dontunwrap'?nwDontUnwrapToolSvg(id):currentWorld==='deepsea'?nwDeepSeaToolSvg(id):currentWorld==='balloonwrong'?nwBalloonToolSvg(id):currentWorld==='nineties'?nwNinetiesToolSvg(id):currentWorld==='cakefail'?nwCakeToolSvg(id):currentWorld==='baggagehell'?nwBaggageToolSvg(id):currentWorld==='donttakewater'?nwWaterToolSvg(id):currentWorld==='patissserie'?nwPatToolSvg(id):symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
  // Safari-safe Sudoku sizing: content must never determine an empty row's height.
  // Match the rendered grid's border-box height to its actual width.
  evSudokuKeepBoardSquare();
  evRoot.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;s.selected=i;if(s.values[i])s.highlight=s.values[i];evSudokuPaint()});
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>{const n=+b.dataset.symbol;if(evSudokuRemaining(n)===0)return;s.choice=n;s.highlight=n;if(s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]&&!s.done){if(s.notes){const i=s.selected;if(!s.values[i]){const marks=s.noteMarks[i]||[];s.noteMarks[i]=marks.includes(n)?marks.filter(x=>x!==n):[...marks,n];}evSudokuPaint()}else evSudokuPlace(n)}else evSudokuPaint()});
  evRoot.querySelector('#evSudoNotes').onclick=()=>{s.notes=!s.notes;evRoot.querySelector('#evSudoNotes').classList.toggle('active',s.notes);evRoot.querySelector('#evSudoNotes').setAttribute('aria-pressed',String(s.notes));};
  evRoot.querySelector('#evSudoErase').onclick=()=>{
    if(s.selected<0||s.givens.has(s.selected)||s.values[s.selected]===s.answer[s.selected]||s.done)return;
    const i=s.selected;
    if(s.values[i]===0&&!(s.noteMarks[i]||[]).length)return;
    nwRecordSudokuHistory(s,i);s.values[i]=0;delete s.noteMarks[i];s.wrong.delete(i);evSudokuPaint();
  };
  evRoot.querySelector('#evSudoUndo').onclick=()=>{
    if(s.done||s.challenge)return;
    const prev=s.history.pop();if(!prev)return;
    s.values[prev.i]=prev.value;s.noteMarks[prev.i]=[...prev.notes];
    if(prev.wrong)s.wrong.add(prev.i);else s.wrong.delete(prev.i);
    s.hintsLeft=prev.hintsLeft;s.selected=prev.i;evSudokuPaint();
  };
  evRoot.querySelector('#evSudoHint').onclick=()=>{
    if(s.done||s.hintsLeft<=0)return;
    if(s.challenge){void nwChallengeMove(null,true);return;}
    const i=s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]?s.selected:s.values.findIndex((n,i)=>n!==s.answer[i]&&!s.givens.has(i));
    if(i<0)return;
    nwRecordSudokuHistory(s,i);s.hintsLeft--;s.reportHints++;s.values[i]=s.answer[i];
    delete s.noteMarks[i];s.wrong.delete(i);s.selected=i;evSudokuPaint();evSudokuCheck();
  };
  evSudokuPaint();
  if(s.challenge){const u=evRoot.querySelector('#evSudoUndo');if(u){u.disabled=true;u.title='Undo is disabled in verified Friendly Challenges';} }
  if(s.practiceOpponent)nwBattleProgressTick(s);
}
// Desktop Sudoku input: delegate to the existing button handlers so notes,
// mistake limits, undo history, validation and verified scoring stay unchanged.
document.addEventListener('keydown',function gbSudokuKeyboard(e){
  if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.repeat)return;
  if(!sudoku||sudoku.done||sudoku.selected<0||evRoot.hidden||!evRoot.querySelector('#evSudoBoard'))return;
  const target=e.target;
  if(target && (target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName||'')))return;
  let button=null;
  if(/^[1-9]$/.test(e.key))button=evRoot.querySelector('[data-symbol="'+e.key+'"]');
  else if(e.key==='Backspace'||e.key==='Delete')button=evRoot.querySelector('#evSudoErase');
  if(!button||button.disabled)return;
  e.preventDefault();
  button.click();
});
function evSudokuKeepBoardSquare(){
  const board=evRoot && evRoot.querySelector('#evSudoBoard');
  if(!board)return;
  const width=board.getBoundingClientRect().width;
  if(width>0)board.style.height=width+'px';
}
// Attach once. The board may be recreated on a new Sudoku game; always find it afresh.
window.addEventListener('resize', evSudokuKeepBoardSquare);
window.addEventListener('orientationchange', evSudokuKeepBoardSquare);
function evSudokuRemaining(n){const s=sudoku;return 9-s.values.filter((v,i)=>v===n&&s.answer[i]===n).length}
function evSudokuPaint(){
  const s=sudoku;if(!s)return;
  evRoot.querySelectorAll('[data-cell]').forEach(el=>{
    const i=+el.dataset.cell,n=s.values[i],r=Math.floor(i/9),c=i%9,rr=Math.floor(s.selected/9),cc=s.selected%9;
    const peer=false; // Matching-symbol-only highlighting; no peer rows, columns or boxes
    const matching=s.highlight>0&&n===s.highlight&&!s.wrong.has(i);
    const matchLine=false;
    el.className='ev-sudoku-cell'+(s.givens.has(i)?' given':'')+(peer?' peer':'')+(matchLine?' match-line':'')+(matching?' same':'')+(i===s.selected?' selected':'')+(s.wrong.has(i)?' bad':'');
    // Section separators are now a continuous overlay above thin cell lines.
    // Remove legacy per-cell inline border overrides when repainting.
    for(const side of ['right','bottom','top','left'])el.style.removeProperty('border-'+side);
    el.innerHTML=n?sudokuSymbol(n):(s.noteMarks[i]?.length?`<span class="ev-sudo-note-marks">${s.noteMarks[i].sort((a,b)=>a-b).join(' ')}</span>`:'');
    if(!n&&s.noteMarks[i]?.length){
      const bg=getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if(bg&&bg.length>=3){const r=+bg[0],g=+bg[1],b=+bg[2];
        const linear=[r,g,b].map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});
        const lum=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
        el.style.setProperty('--nw-note-ink',lum>.32?'#35203d':'#fff4fc');
      }
    }
  });
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>{const n=+b.dataset.symbol,remaining=evSudokuRemaining(n);b.classList.toggle('selected',s.highlight===n);b.classList.toggle('completed',remaining===0);b.disabled=remaining===0;b.querySelector('small').textContent=remaining===0?'':remaining;});
  const hint=evRoot.querySelector('#evSudoHint');if(hint){hint.disabled=s.hintsLeft<=0;hint.classList.toggle('used',s.hintsLeft<=0);hint.setAttribute('aria-label',`Hint: ${s.hintsLeft} remaining`);hint.title=s.hintsLeft?`${s.hintsLeft} hint(s) remaining`:'No hints remaining';}
  const err=evRoot.querySelector('#evSudoErrors');if(err){err.textContent=`${s.mistakes} / 3`;err.classList.toggle('ev-sudo-danger',s.mistakes>=2)}
}
function evSudokuPlace(n){
  const s=sudoku,i=s.selected;
  if(s?.challenge){void nwChallengeMove(n);return;}if(i<0||s.givens.has(i)||s.values[i]===s.answer[i]||s.done)return;
  if(s.values[i]===n){evSudokuPaint();return}
  nwRecordSudokuHistory(s,i);s.values[i]=n;delete s.noteMarks[i];s.reportAttempts++;if(n===s.answer[i])s.reportCorrect++;
  if(n!==s.answer[i]){
    s.mistakes++;s.wrong.add(i);evSudokuPaint();
    if(s.mistakes>=3){s.done=true;clearInterval(sudokuTimer);evSudokuCancelLoss();sudokuLossTimer=setTimeout(()=>{sudokuLossTimer=null;if(sudoku===s&&evRoot.querySelector('#evSudoBoard'))evSudokuEnd(false)},420)}
    return;
  }
  s.wrong.delete(i);evSudokuPaint();evSudokuCheck();
}
function sudokuSymbol(n){return (currentWorld==='halloween'||currentWorld==='patissserie'||currentWorld==='christmas'||currentWorld==='fairy'||currentWorld==='olympus'||currentWorld==='nineties'||currentWorld==='weird'||currentWorld==='ugly'||currentWorld==='alien'||currentWorld==='diner'||currentWorld==='bodyparts'||currentWorld==='deepsea'||currentWorld==='solarsick'||currentWorld==='dontunwrap'||currentWorld==='unpreparedchristmas'||currentWorld==='underthebed'||currentWorld==='balloonwrong'||currentWorld==='donttakewater'||currentWorld==='baggagehell'||currentWorld==='cakefail')?`<img src="${sudokuSrc(n)}" alt="${n}">`:`<span class="number-symbol">${n}</span>`;}
function evSudokuEnd(won){const s=sudoku;if(!s)return;if(s.challenge){nwChallengeFinishScreen(s,{status:won?'completed':'failed'});return;}if(!s.practiceOpponent)nwSaveResult(s,won);applyTheme(worlds[currentWorld].theme);const elapsed=Math.floor((Date.now()-s.start)/1000);const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;const pts=won?difficulties[s.difficulty].points+([100,70,30][s.mistakes]||0):0;if(s.practiceOpponent){nwBattleFinish(s,won,pts,elapsed);return;}if(won&&!s.pointsCredited){nwAwardPoints(pts);s.pointsCredited=true;}if(won)nwCaptureRun(s,pts);if(won&&!s.doublePractice)nwTTMissionEvent('worlds');if(s.doublePractice){nwDoublePracticeAfterSudoku(s,won,pts);return;}evDisplay(`${evHeader(worlds[currentWorld].name,showRooms,false,true)}<section class="result-panel"><div class="result-mark">${currentWorld==='patissserie'?nwPatResultSvg(won):currentWorld==='donttakewater'?nwWaterResultSvg(won):currentWorld==='baggagehell'?nwBaggageResultSvg(won):currentWorld==='cakefail'?nwCakeResultSvg(won):currentWorld==='nineties'?nwNinetiesResultSvg(won):currentWorld==='balloonwrong'?nwBalloonResultSvg(won):currentWorld==='deepsea'?nwDeepSeaResultSvg(won):currentWorld==='dontunwrap'?nwDontUnwrapResultSvg(won):currentWorld==='halloween'?nwHalloweenResultSvg(won):currentWorld==='bodyparts'?nwBodypartsResultSvg(won):currentWorld==='underthebed'?nwUnderBedResultMark(won):currentWorld==='solarsick'?nwSolarResultMark(won):currentWorld==='alien'?`<svg class="nw-alien-result-icon" viewBox="0 0 48 48" role="img" aria-label="${won?'Completed':'Failed'}"><path d="${won?'M10 25L20 35L38 13':'M14 14L34 34 M34 14L14 34'}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`:currentWorld==='ugly'?`<svg class="nw-ugly-result-icon" viewBox="0 0 64 64" role="img" aria-label="${won?'Completed':'Failed'}"><path d="${won?'M13 34 L26 46 L51 17':'M18 18 L46 46 M46 18 L18 46'}" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`:currentWorld==='weird'?`<svg class="nw-weird-result-icon" viewBox="0 0 64 64" role="img" aria-label="${won?'Completed':'Failed'}"><path d="${won?'M12 33 L26 46 L52 17':'M18 18 L46 46 M46 18 L18 46'}" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`:won?(currentWorld==='diner'?'<svg class="nw-diner-check" viewBox="0 0 64 64" role="img" aria-label="Completed"><path d="M13 33 L26 45 L51 18" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>':'✦'):'×'}</div><h2>${won?'Puzzle Completed!':'Puzzle Not Completed'}</h2>${won?`<div class="result-score"><small>TOTAL POINTS</small><strong>${pts.toLocaleString()}</strong></div>`:'<p>Three mistakes. Try again!</p>'}<div class="result-stats"><div>DIFFICULTY<strong>${s.difficulty.toUpperCase()}</strong></div><div>TIME<strong>${duration}</strong></div><div>MISTAKES<strong>${s.mistakes} / 3</strong></div></div><div class="result-actions"><button class="theme-button${currentWorld==='solarsick'?' nw-solar-action':currentWorld==='underthebed'?' nw-underbed-action':currentWorld==='bodyparts'?' nw-bodyparts-action':currentWorld==='halloween'?' nw-halloween-action':currentWorld==='dontunwrap'?' nw-dontunwrap-action':currentWorld==='deepsea'?' nw-deepsea-action':currentWorld==='balloonwrong'?' nw-balloon-action':currentWorld==='nineties'?' nw-nineties-action':currentWorld==='cakefail'?' nw-cake-action':currentWorld==='baggagehell'?' nw-baggage-action':currentWorld==='donttakewater'?' nw-water-action':currentWorld==='patissserie'?' nw-pat-action':''}" id="evSudoAgain">${currentWorld==='solarsick'?nwSolarButtonSvg('primary'):currentWorld==='underthebed'?nwUnderBedPillowSvg('primary'):currentWorld==='bodyparts'?nwBodypartsStampSvg('primary'):currentWorld==='halloween'?nwHalloweenCoffinSvg('primary'):currentWorld==='dontunwrap'?nwDontUnwrapGiftTagSvg('primary'):currentWorld==='deepsea'?nwDeepSeaWindowSvg('primary'):currentWorld==='balloonwrong'?nwBalloonInflatedSvg('primary'):currentWorld==='nineties'?nwNinetiesArcadeSvg('primary'):currentWorld==='cakefail'?nwCakeFrostingSvg('primary'):currentWorld==='baggagehell'?nwBaggageCaseSvg('primary'):currentWorld==='donttakewater'?nwWaterRxSvg('primary'):currentWorld==='patissserie'?nwPatWoodSvg('primary'):''}<span>${won?'PLAY AGAIN':'RETRY'}</span></button><button class="theme-button${currentWorld==='solarsick'?' nw-solar-action':currentWorld==='underthebed'?' nw-underbed-action':currentWorld==='bodyparts'?' nw-bodyparts-action':currentWorld==='halloween'?' nw-halloween-action':currentWorld==='dontunwrap'?' nw-dontunwrap-action':currentWorld==='deepsea'?' nw-deepsea-action':currentWorld==='balloonwrong'?' nw-balloon-action':currentWorld==='nineties'?' nw-nineties-action':currentWorld==='cakefail'?' nw-cake-action':currentWorld==='baggagehell'?' nw-baggage-action':currentWorld==='donttakewater'?' nw-water-action':currentWorld==='patissserie'?' nw-pat-action':''}" id="evSudoBack">${currentWorld==='solarsick'?nwSolarButtonSvg('secondary'):currentWorld==='underthebed'?nwUnderBedPillowSvg('secondary'):currentWorld==='bodyparts'?nwBodypartsStampSvg('secondary'):currentWorld==='halloween'?nwHalloweenCoffinSvg('secondary'):currentWorld==='dontunwrap'?nwDontUnwrapGiftTagSvg('secondary'):currentWorld==='deepsea'?nwDeepSeaWindowSvg('secondary'):currentWorld==='balloonwrong'?nwBalloonInflatedSvg('secondary'):currentWorld==='nineties'?nwNinetiesArcadeSvg('secondary'):currentWorld==='cakefail'?nwCakeFrostingSvg('secondary'):currentWorld==='baggagehell'?nwBaggageCaseSvg('secondary'):currentWorld==='donttakewater'?nwWaterRxSvg('secondary'):currentWorld==='patissserie'?nwPatWoodSvg('secondary'):''}<span>BACK TO ROOMS</span></button></div>${nwRecordingControls()}</section>`);nwBindRecordingControls();evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);evRoot.querySelector('#evSudoBack').onclick=()=>showRooms();}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true);
}



/* Scoped Friendly Challenges integration. Does not write normal Sudoku results or wallets. */
let nwChallengeHeartbeat=null;
let nwChallengeClosing=false;
async function nwChallengeRpc(action,opts={}){
 return nwFriendsRpc('nw_friend_challenge',{p_action:action,...opts});
}
async function nwChallengeChoose(target,back=nwShowProfile){
 const friend=(nwFriendsSnapshot?.friends||[]).find(f=>f.id===target);
 if(!friend)return;
 nwAccountTheme();
 evDisplay(`${evHeader('FRIENDLY CHALLENGE',()=>nwShowFriends('list',back))}<section class="nw-new-panel nw-social-panel">${nwAccountHeading('CHALLENGE','Choose your Sudoku difficulty')}<div class="nw-friend-row">${nwFriendPhoto(friend)}<strong>${nwEscape(friend.name)}</strong></div><div class="nw-challenge-difficulties">${Object.keys(difficulties).map(d=>`<button class="nw-action" data-challenge-difficulty="${d}">${d.toUpperCase()}</button>`).join('')}</div><p id="nwChallengeNotice" class="nw-muted" role="status">Invitation expires in 24 hours. No rewards or Battle progress.</p></section>`);
 evRoot.querySelectorAll('[data-challenge-difficulty]').forEach(b=>b.onclick=async()=>{
   const buttons=evRoot.querySelectorAll('[data-challenge-difficulty]');
   buttons.forEach(x=>x.disabled=true);
   try{await nwChallengeRpc('send',{p_target:target,p_difficulty:b.dataset.challengeDifficulty});nwShowFriends('challenges',back)}
   catch(e){const o=evRoot.querySelector('#nwChallengeNotice');if(o)o.textContent=e.message;buttons.forEach(x=>x.disabled=false)}
 });
}
async function nwChallengesDraw(back=nwShowProfile){
 void nwFriendNoticeMark('invitations');
 const out=evRoot.querySelector('#nwFriendChallenges');if(!out)return;
 try{
  const challenges=await nwFriendsRpc('nw_friend_challenge_list'),myId=nwCloud.user()?.id;
  if(!out.isConnected)return;
  out.innerHTML=challenges.length?challenges.map(c=>{
    const incoming=c.status==='pending'&&c.recipient===myId;
    const outgoing=c.status==='pending'&&c.sender===myId;
    const active=c.status==='active';
    const finished=(c.status==='resolved'||c.status==='expired')&&c.resolution!=='invitation_expired';
    const label=c.status==='pending'?'INVITATION':active?'ACTIVE':c.status.toUpperCase();
    const actions=finished?`<button class="nw-friend-mini" data-challenge-action="result" data-id="${c.id}">VIEW RESULT</button>`:incoming?`<button class="nw-friend-mini" data-challenge-action="accept" data-id="${c.id}">ACCEPT</button><button class="nw-friend-mini nw-friend-outline" data-challenge-action="decline" data-id="${c.id}">DECLINE</button>`:
      outgoing?`<button class="nw-friend-mini nw-friend-outline" data-challenge-action="cancel" data-id="${c.id}">CANCEL</button>`:
      active&&c.mine==='not_started'?`<button class="nw-friend-mini" data-challenge-action="begin" data-id="${c.id}">PLAY</button>`:active&&c.mine==='playing'?`<button class="nw-friend-mini nw-friend-outline" data-challenge-action="forfeit" data-id="${c.id}">FORFEIT</button>`:'';
    const subtitle=c.resolution==='invitation_expired'?'Invitation expired':active?`You: ${nwEscape(c.mine.replace('_',' '))} · Friend: ${nwEscape(c.theirs.replace('_',' '))}`:finished?`Result: ${c.winner===myId?'YOU WON':c.winner?'FRIEND WON':'NO WINNER'}`:(incoming?'Incoming request':'Waiting for friend');
    return `<article class="nw-challenge-card"><div class="nw-challenge-card-head"><strong>${nwEscape(c.difficulty.toUpperCase())}</strong><small>${nwEscape(label)}</small></div><div class="nw-friend-row">${nwFriendPhoto(c.opponent)}<div class="nw-friend-name"><strong>${nwEscape(c.opponent.name)}</strong><small>${subtitle}</small></div></div>${active&&c.deadline_at?'<p class="nw-muted">Deadline: '+new Date(c.deadline_at).toLocaleString()+'</p>':''}${finished&&c.winner!==undefined?'<p class="nw-muted">Your points: '+(c.my_points??'—')+' · Friend points: '+(c.their_points??'—')+'</p>':''}<div class="nw-friend-actions">${actions}</div></article>`;
  }).join(''):'<p class="nw-muted">No Friendly Challenges yet. Choose a friend to send one!</p>';
  out.querySelectorAll('[data-challenge-action]').forEach(b=>b.onclick=async()=>{
    b.disabled=true;
    try{
      const id=b.dataset.id,action=b.dataset.challengeAction;
      if(action==='begin'){nwChallengeWorldPicker(id,back);return;}
      if(action==='result'){await nwChallengeResult(id,back);return;}
      if(action==='forfeit'&&!confirm('Forfeit this one-attempt challenge? This counts as a loss.')){b.disabled=false;return;}
      await nwChallengeRpc(action,{p_id:id});void nwChallengesDraw(back);
    }catch(e){const status=evRoot.querySelector('#nwSocialStatus');if(status)status.textContent=e.message;b.disabled=false}
  });
 }catch(e){if(out.isConnected)out.textContent='Could not load challenges: '+e.message}
}

function nwChallengeWorldPicker(id,back=nwShowProfile){
 nwAccountTheme();
 const ids=nwGalaxyOrder.filter(w=>!!worlds[w]);
 if(!ids.includes(currentWorld)&&worlds[currentWorld])ids.unshift(currentWorld);
 evDisplay(`${evHeader('CHOOSE YOUR WORLD',()=>nwShowFriends('challenges',back))}<section class="nw-new-panel nw-social-panel">${nwAccountHeading('YOUR WORLD','Pick your own Sudoku appearance')}<p class="nw-muted">Both players solve the same numbers and clues, even if they choose different Worlds.</p><div class="nw-challenge-world-picker">${ids.map(w=>`<button data-challenge-world="${w}" class="nw-friend-mini ${w===currentWorld?'chosen':''}">${nwEscape(worlds[w].name)}</button>`).join('')}</div><button id="nwChallengeWorldStart" class="nw-action">START CHALLENGE</button><p id="nwChallengeWorldError" class="nw-muted" role="status">One attempt only. Leaving after starting counts as a loss.</p></section>`);
 let selected=currentWorld;
 evRoot.querySelectorAll('[data-challenge-world]').forEach(b=>b.onclick=()=>{selected=b.dataset.challengeWorld;evRoot.querySelectorAll('[data-challenge-world]').forEach(x=>x.classList.toggle('chosen',x===b))});
 evRoot.querySelector('#nwChallengeWorldStart').onclick=async()=>{
  const button=evRoot.querySelector('#nwChallengeWorldStart');button.disabled=true;button.textContent='STARTING...';
  try{currentWorld=selected;await nwChallengeBegin(id,back)}
  catch(e){const out=evRoot.querySelector('#nwChallengeWorldError');if(out)out.textContent=e.message;button.disabled=false;button.textContent='START CHALLENGE'}
 };
}
async function nwChallengeBegin(id,back=nwShowProfile){
 const started=await nwChallengeRpc('begin',{p_id:id});
 if(!started||!/^[0-9]{81}$/.test(started.puzzle)||!/^[1-9]{81}$/.test(started.solution))throw Error('Could not verify challenge puzzle');
 nwChallengeClosing=false;
 await evSudokuStart(started.difficulty,null,{id,puzzle:started.puzzle,solution:started.solution,back});
 if(sudoku?.challenge?.id!==id)throw Error('Could not load attempt');
 sudoku.start=Date.parse(started.started_at)||Date.now();
 clearInterval(nwChallengeHeartbeat);
 nwChallengeHeartbeat=setInterval(()=>{
   if(sudoku?.challenge?.id!==id||sudoku.done){clearInterval(nwChallengeHeartbeat);nwChallengeHeartbeat=null;return}
   void nwChallengeRpc('touch',{p_id:id}).catch(e=>console.warn('Friendly Challenge sync:',e.message));
 },18000);
}
async function nwChallengeMove(n,hint=false){
 const s=sudoku;
 if(!s?.challenge||s.done||s.challengePending)return;
 const i=s.selected;
 if(!hint&&(i<0||s.givens.has(i)||s.values[i]===s.answer[i]||!Number.isInteger(n)))return;
 s.challengePending=true;
 const buttons=evRoot.querySelectorAll('[data-symbol],#evSudoHint');
 buttons.forEach(b=>b.disabled=true);
 try{
   const res=await nwChallengeRpc(hint?'hint':'move',{p_id:s.challenge.id,...(hint?{}:{p_cell:i,p_digit:n})});
   if(sudoku!==s)return;
   const index=Number(res.index),digit=Number(res.digit);
   if(!Number.isInteger(index)||index<0||index>80||!Number.isInteger(digit))throw Error('Invalid verified move');
   s.values[index]=digit;
   if(res.correct){s.wrong.delete(index);delete s.noteMarks[index];}
   else{s.wrong.add(index);}
   s.selected=index;s.highlight=digit;
   s.mistakes=Number(res.mistakes)||0;
   s.reportHints=Number(res.hints)||0;
   s.hintsLeft=Math.max(0,difficulties[s.difficulty].hints-s.reportHints);
   if(res.status==='completed'||res.status==='failed'){
     s.done=true;clearInterval(sudokuTimer);clearInterval(nwChallengeHeartbeat);nwChallengeHeartbeat=null;
     nwChallengeFinishScreen(s,res);return;
   }
   evSudokuPaint();
 }catch(e){
   if(sudoku===s){const m=evRoot.querySelector('.ev-note');if(m)m.textContent='Could not verify placement: '+e.message}
 }finally{
   s.challengePending=false;
   if(sudoku===s&&!s.done)evSudokuPaint();
 }
}
function nwChallengeFinishScreen(s,res){
 if(!s?.challenge)return;
 clearInterval(sudokuTimer);clearInterval(nwChallengeHeartbeat);nwChallengeHeartbeat=null;
 s.done=true;
 nwAccountTheme();
 evDisplay(`${evHeader('FRIENDLY CHALLENGE',()=>nwShowFriends('challenges',s.challenge.back))}<section class="nw-new-panel nw-social-panel">${nwAccountHeading(res.status==='completed'?'PUZZLE COMPLETED!':'PUZZLE NOT COMPLETED',res.status==='completed'?'Your verified result is saved.':'This attempt counts as a loss.')}<p class="nw-muted">Your friend’s results stay hidden until the challenge is settled.</p><button class="nw-action" id="nwChallengeBackToList">BACK TO CHALLENGES</button></section>`);
 evRoot.querySelector('#nwChallengeBackToList').onclick=()=>nwShowFriends('challenges',s.challenge.back);
}
function nwChallengeBack(){
 const s=sudoku;
 if(!s?.challenge){evSudokuMenu();return}
 if(!confirm('Leave Challenge? Leaving now counts as a loss.'))return;
 void nwChallengeForfeit(s.challenge.id);
 s.done=true;
 clearInterval(nwChallengeHeartbeat);nwChallengeHeartbeat=null;
 nwShowFriends('challenges',s.challenge.back);
}
async function nwChallengeForfeit(id){
 if(nwChallengeClosing)return;
 nwChallengeClosing=true;
 try{await nwChallengeRpc('forfeit',{p_id:id})}catch(e){console.warn('Friendly Challenge forfeit:',e.message)}
 finally{nwChallengeClosing=false}
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&sudoku?.challenge&&!sudoku.done){
  const s=sudoku;s.done=true;s.challengeLocalForfeited=true;clearInterval(nwChallengeHeartbeat);nwChallengeHeartbeat=null;
  void nwChallengeForfeit(s.challenge.id);
 }else if(!document.hidden&&sudoku?.challengeLocalForfeited){
  nwChallengeFinishScreen(sudoku,{status:'failed'});
 }
});

/* Friends-only notifications, presence and private profile views. */
let nwFriendNoticePending=false;
async function nwFriendRefreshNotice(){
 const b=evRoot.querySelector('#nwOpenFriends');
 if(!b||nwFriendNoticePending||!nwCloud?.user()||nwCloud.user().is_anonymous)return;
 nwFriendNoticePending=true;
 try{
  const n=await nwFriendsRpc('nw_friend_notice',{p_action:'count'});
  if(!b.isConnected)return;
  b.classList.toggle('nw-notification-orbit',Number(n.requests)+Number(n.invitations)+Number(n.results)>0);
 }catch(e){console.warn('Friend notice:',e.message)}
 finally{nwFriendNoticePending=false}
}
async function nwFriendNoticeMark(kind,id=null){
 try{await nwFriendsRpc('nw_friend_notice',{p_action:kind,p_item:id});void nwFriendRefreshNotice();}
 catch(e){console.warn('Friend notice:',e.message)}
}
async function nwFriendOpenProfile(id,back=nwShowProfile){
 const own=id===nwCloud?.user()?.id;
 const returnTo=own?nwShowProfile:()=>nwShowFriends('list',back);
 const heading=own?'MY PROFILE':'FRIEND PROFILE';
 nwAccountTheme();
 evDisplay(`${evHeader(heading,returnTo)}<section class="nw-new-panel nw-social-panel"><p class="nw-muted">Loading player profile...</p></section>`);
 try{
  const p=await nwFriendsRpc('nw_friend_profile',{p_target:id});
  if(!evRoot.querySelector('.nw-social-panel')||nwCloud?.user()?.id==null)return;
  const fields=[['PUZZLES COMPLETED',p.puzzles],['TOTAL POINTS',Number(p.points).toLocaleString()],['BATTLE WINS',p.battle_wins],['BATTLE LOSSES',p.battle_losses],['BATTLE DRAWS',p.battle_draws],['FRIENDLY WINS',p.challenge_wins],['FRIENDLY LOSSES',p.challenge_losses],['FRIENDLY DRAWS',p.challenge_draws]];
  nwAccountTheme();
  evDisplay(`${evHeader(heading,returnTo)}<section class="nw-new-panel nw-social-panel">${nwAccountHeading(heading)}<div class="nw-friend-public-card">${nwFriendPhoto(p)}<h3>${nwEscape(p.name)}</h3></div><div class="nw-friend-profile-stats">${fields.map(([label,value])=>`<div><small>${label}</small><strong>${nwEscape(value)}</strong></div>`).join('')}</div>${own?'':'<button class="nw-action" id="nwProfileSocialAction">CHALLENGE TO SUDOKU</button>'}</section>`);
  if(!own)evRoot.querySelector('#nwProfileSocialAction').onclick=()=>nwChallengeChoose(id,back);
 }catch(e){
  nwAccountTheme();evDisplay(`${evHeader(heading,returnTo)}<section class="nw-new-panel nw-social-panel"><p role="alert">${nwEscape(e.message)}</p></section>`);
 }
}
async function nwChallengeResult(id,back=nwShowProfile){
 const rows=await nwFriendsRpc('nw_friend_challenge_list');
 const row=rows.find(c=>c.id===id&&['resolved','expired'].includes(c.status));
 if(!row)throw Error('Challenge result unavailable');
 await nwFriendNoticeMark('result',id);
 const me=nwCloud.user()?.id,won=row.winner===me,draw=!row.winner;
 nwAccountTheme();
 evDisplay(`${evHeader('CHALLENGE RESULT',()=>nwShowFriends('challenges',back))}<section class="nw-new-panel nw-social-panel">${nwAccountHeading(draw?(row.status==='resolved'?'DRAW':'NO WINNER'):won?'YOU WON!':'CHALLENGE FINISHED',row.difficulty.toUpperCase())}<div class="nw-friend-profile-stats"><div><small>YOU</small><strong>${row.my_points??'—'}</strong><small>${row.my_seconds==null?'No finish time':nwFormatTime(row.my_seconds)}</small></div><div><small>${nwEscape(row.opponent.name)}</small><strong>${row.their_points??'—'}</strong><small>${row.their_seconds==null?'No finish time':nwFormatTime(row.their_seconds)}</small></div></div><p class="nw-muted">${draw?'The challenge ended without a winner.':won?'You won this Friendly Challenge!':'Your friend won this Friendly Challenge.'}</p><button class="nw-action" id="nwChallengeResultsBack">BACK TO CHALLENGES</button></section>`);
 evRoot.querySelector('#nwChallengeResultsBack').onclick=()=>nwShowFriends('challenges',back);
}
let nwFriendPresenceInFlight=false;
async function nwFriendPresenceTick(){
 if(document.hidden||nwFriendPresenceInFlight||!nwCloud?.user()||nwCloud.user().is_anonymous)return;
 nwFriendPresenceInFlight=true;
 try{await nwFriendsRpc('nw_friend_heartbeat')}catch(e){console.warn('Friend presence:',e.message)}
 finally{nwFriendPresenceInFlight=false}
}
setInterval(()=>{void nwFriendPresenceTick()},45000);
window.addEventListener('focus',()=>{void nwFriendPresenceTick()});
window.addEventListener('pagehide',()=>{
 const s=sudoku;if(!s?.challenge||s.done)return;
 // Best-effort immediate forfeit; server also expires absent heartbeats.
 const id=s.challenge.id;
 void nwCloud.get().then(async c=>{
  const {data}=await c.auth.getSession(),token=data.session?.access_token;
  if(!token)return;
  return fetch(c.supabaseUrl+'/rest/v1/rpc/nw_friend_challenge',{
   method:'POST',keepalive:true,headers:{apikey:c.supabaseKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:'forfeit',p_id:id})
  });
 }).catch(()=>{});
});

setTimeout(()=>{void nwFriendPresenceTick()},8000);
