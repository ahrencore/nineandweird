const evRoot=document.getElementById('game');
function evDisplay(html){window.nwCloud?.clearCaptcha?.();document.getElementById("home").hidden=true;evRoot.hidden=false;evRoot.innerHTML=html;}
function evHeader(title,back){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=()=>back();});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong>${title}</strong><span></span></header>`;}
const worlds={classic:{name:'CLASSIC',label:'Classic',theme:'classic'},dark:{name:'CLASSIC DARK',label:'Classic Dark',theme:'dark'},halloween:{name:'HALLOWEEN',label:'Halloween',theme:'halloween'},patissserie:{name:'PÂTISSERIE',label:'Pâtisserie',theme:'patissserie'},christmas:{name:'CHRISTMAS',label:'Christmas',theme:'christmas'},fairy:{name:'FAIRY WORLD',label:'Fairy World',theme:'fairy'},olympus:{name:'OLYMPUS',label:'Olympus',theme:'olympus'},nineties:{name:'90s THROWBACK',label:'90s Throwback',theme:'nineties'},weird:{name:'WHAT AM I LOOKING AT?',label:'What Am I Looking At?',theme:'weird'},ugly:{name:'UGLY LITTLE THINGS',label:'Ugly Little Things',theme:'ugly'},alien:{name:'ALIEN SUPERMARKET',label:'Alien Supermarket',theme:'alien'},diner:{name:'DO NOT EAT THAT',label:'Do Not Eat That',theme:'diner'},bodyparts:{name:'BODY PARTS DEPARTMENT',label:'Body Parts Department',theme:'bodyparts'},deepsea:{name:'DEEP SEA MISFITS',label:'Deep Sea Misfits',theme:'deepsea'},solarsick:{name:'THE SOLAR SYSTEM IS SICK',label:'The Solar System Is Sick',theme:'solarsick'},dontunwrap:{name:"PLEASE DON'T UNWRAP THAT",label:"Please Don't Unwrap That",theme:'dontunwrap'},unpreparedchristmas:{name:'UNPREPARED CHRISTMAS',label:'Unprepared Christmas',theme:'unpreparedchristmas'},underthebed:{name:'SOMETHING UNDER THE BED',label:'Something Under the Bed',theme:'underthebed'},balloonwrong:{name:'BALLOON ANIMALS GONE WRONG',label:'Balloon Animals Gone Wrong',theme:'balloonwrong'},donttakewater:{name:'DO NOT TAKE WITH WATER',label:'Do Not Take With Water',theme:'donttakewater'},baggagehell:{name:'BAGGAGE CLAIM FROM HELL',label:'Baggage Claim from Hell',theme:'baggagehell'},cakefail:{name:'CAKE DECORATING WAS A MISTAKE',label:'Cake Decorating Was a Mistake',theme:'cakefail'}};
let currentWorld='halloween',roomPage=0,roomCollection='usual';
const difficulties={easy:{fill:.60,points:350,hints:1},medium:{fill:.50,points:650,hints:1},hard:{fill:.40,points:1000,hints:1},expert:{fill:.35,points:1350,hints:2},extreme:{fill:.30,points:1750,hints:3}};
function applyTheme(world){evRoot.className='ev-root theme-'+(world||'hub');}

const nwGroups={usual:['classic','dark','halloween','patissserie','christmas','fairy','olympus','nineties'],weird:['weird','ugly','alien','diner','bodyparts','deepsea','solarsick','dontunwrap','unpreparedchristmas','underthebed','balloonwrong','donttakewater','baggagehell','cakefail']};
const nwFavKey='nineweird-favourites-v1',nwPointsKey='nineweird-points-v1';
const nwScroll={usual:0,weird:0,fav:0};
const nwRoomPages={usual:0,weird:0,fav:0};
// All player data is tied to the active Supabase user ID, never shared across accounts.
// No account = no saved player data. Legacy unscoped keys are deliberately ignored
// rather than assigned to another player. A browser's local data is not cloud sync.
function nwPlayerStorageKey(key){
  const id=window.nwCloud?.user()?.id;
  return id ? `nineweird-player:${id}:${key}` : null;
}
function nwRead(key,fallback){
  const scoped=nwPlayerStorageKey(key);
  if(!scoped)return fallback;
  try{const raw=localStorage.getItem(scoped);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}
}
function nwWrite(key,value){
  const scoped=nwPlayerStorageKey(key);
  if(!scoped)return;
  try{localStorage.setItem(scoped,JSON.stringify(value))}catch{}
}
function nwFavs(){const a=nwRead(nwFavKey,[]);return Array.isArray(a)?a.filter((id,i)=>worlds[id]&&a.indexOf(id)===i):[]}
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
const nwAvatarChoices=["avatars/avatar-01.png", "avatars/avatar-02.png", "avatars/avatar-03.png", "avatars/avatar-04.png", "avatars/avatar-05.png", "avatars/avatar-06.png", "avatars/avatar-07.png", "avatars/avatar-08.png", "avatars/avatar-09.png", "avatars/avatar-10.png", "avatars/avatar-11.png", "avatars/avatar-12.png"];
const nwDefaultAvatar=nwAvatarChoices[0];
function nwAvatarValue(v){return nwAvatarChoices.includes(v)?v:nwDefaultAvatar}
function nwAvatarImg(v,cls=''){const src=nwEscape(nwAvatarValue(v));return `<img src="${src}" alt="" class="${cls}">`}
function nwEscape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function nwProfile(){const p=nwRead(nwProfileKey,{});return {name:typeof p.name==='string'?p.name:'Guest Player',avatar:nwAvatarValue(p.avatar)}}
function nwResults(){const v=nwRead(nwResultsKey,[]);return Array.isArray(v)?v.filter(x=>x&&Number.isFinite(x.started)&&typeof x.difficulty==='string').slice(-2500):[]}
function nwSaveResult(s,won){
  if(!s||s.reportSaved)return;s.reportSaved=true;
  const a=nwResults();a.push({started:s.start,ended:Date.now(),world:currentWorld,difficulty:s.difficulty,won:!!won,seconds:Math.max(1,Math.round((Date.now()-s.start)/1000)),attempts:s.reportAttempts||0,correct:s.reportCorrect||0,hints:s.reportHints||0,mistakes:s.mistakes});
  nwWrite(nwResultsKey,a.slice(-2500));
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
function nwShowProfile(){
  evSudokuLeave();applyTheme('hub');
  const u=window.nwCloud?.user();const anon=!!u?.is_anonymous;const p=nwProfile();const recovery=!!window.nwCloud?.isRecovering?.();const profileLocked=!u;
  if(recovery&&u&&!anon){nwShowRecovery();return;}

  const lockedEditor=`<div class="nw-profile-editor ${profileLocked?'nw-profile-locked':''}"><label class="nw-new-label" for="nwName">DISPLAY NAME</label><input id="nwName" maxlength="24" value="${nwEscape(p.name)}" autocomplete="nickname" ${profileLocked?'disabled':''}><label class="nw-new-label">CHOOSE AN AVATAR</label><div class="nw-avatar-grid">${nwAvatarChoices.map((a,i)=>`<button class="nw-avatar-choice ${a===p.avatar?'chosen':''}" data-avatar="${a}" aria-label="Choose avatar ${i+1}" ${profileLocked?'disabled':''}>${nwAvatarImg(a,'nw-avatar-choice-img')}</button>`).join('')}</div><button class="nw-action" id="nwSaveProfile" ${profileLocked?'disabled':''}>SAVE PROFILE</button></div>`;

  let authBlock='';
  if(!u){
    authBlock=`<div class="nw-auth-card"><h3>WELCOME BACK.</h3><label class="nw-new-label" for="nwEmail">EMAIL</label><input id="nwEmail" type="email" autocomplete="email" placeholder="you@example.com"><label class="nw-new-label" for="nwPassword">PASSWORD</label><input id="nwPassword" type="password" autocomplete="current-password" minlength="6" placeholder="Password"><button class="nw-text-link" id="nwReset" type="button">Forgot password?</button><button class="nw-action nw-auth-primary" id="nwSignIn" data-auth-busy>SIGN IN</button><div class="nw-auth-divider"><span>OR</span></div><div class="nw-auth-stack"><button class="nw-action nw-auth-secondary" id="nwGoogle" data-auth-busy>CONTINUE WITH GOOGLE</button><button class="nw-action nw-auth-secondary" id="nwDiscord" data-auth-busy>CONTINUE WITH DISCORD</button><button class="nw-action nw-auth-secondary" id="nwMakeCloudGuest" data-auth-busy>CONTINUE AS GUEST</button></div><p class="nw-auth-switch">New here? <button class="nw-inline-link" id="nwGoRegister" type="button">Create an account</button></p><p id="nwAuthNotice" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div></div>`;
  }else if(anon){
    authBlock=`<div class="nw-auth-card"><h3>ACCOUNT</h3><div class="nw-auth-stack"><button class="nw-action nw-auth-secondary" id="nwGoogle">CONTINUE WITH GOOGLE</button><button class="nw-action nw-auth-secondary" id="nwDiscord">CONTINUE WITH DISCORD</button></div><button class="nw-action nw-auth-secondary" id="nwSignOut">SIGN OUT</button><p id="nwAuthNotice" hidden></p></div>`;
  }else{
    authBlock=`<div class="nw-auth-card"><h3>ACCOUNT</h3><button class="nw-action nw-auth-secondary" id="nwSignOut">SIGN OUT</button><p id="nwAuthNotice" hidden></p></div>`;
  }

  evDisplay(`${evHeader('PLAYER PROFILE',showCategories)}<section class="nw-new-panel"><div class="nw-profile-avatar">${nwAvatarImg(p.avatar,'nw-profile-avatar-img')}</div><h2>${nwEscape(p.name)}</h2><p class="nw-muted" id="nwAccountStatus">${anon?'Guest':u?'Signed in: '+nwEscape(u.email||'Account'):'Guest'}</p>${lockedEditor}${authBlock}</section>`);

  if(!u && window.nwCloud){const captcha=evRoot.querySelector('.nw-captcha');if(captcha)nwCloud.mountCaptcha(captcha)}
  let avatar=p.avatar;
  evRoot.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{avatar=b.dataset.avatar;evRoot.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('chosen',x===b))});
  const notice=(s)=>{const el=evRoot.querySelector('#nwAuthNotice');if(el){el.textContent=s;el.hidden=!s}};
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
    const name=evRoot.querySelector('#nwName').value.trim().slice(0,24)||'Guest Player';
    save.disabled=true;
    try{
      if(window.nwCloud?.user())await nwCloud.saveProfile(name,avatar);
      nwWrite(nwProfileKey,{name,avatar});nwShowProfile();
    }catch(e){notice('Could not save profile: '+e.message);save.disabled=false;}
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
        await nwLoadCloudProfile();
        nwShowProfile();
      }catch(e){if(guestButton)guestButton.disabled=false;throw e;}
    });
    evRoot.querySelector('#nwSignIn').onclick=()=>action(async()=>{
      const {email,password}=credentials();if(!password)throw new Error('Enter your password.');
      await nwCloud.signIn(email,password);await nwLoadCloudProfile();nwShowProfile();
    });
    evRoot.querySelector('#nwReset').onclick=()=>nwShowForgotPassword(evRoot.querySelector('#nwEmail')?.value?.trim()||'');
  }
}

function nwShowRegister(initialEmail=''){
  evSudokuLeave();applyTheme('hub');
  evDisplay(`${evHeader('CREATE ACCOUNT',nwShowProfile)}<section class="nw-new-panel"><div class="nw-auth-card nw-auth-card-standalone"><h3>NEW AROUND HERE?</h3><label class="nw-new-label" for="nwRegEmail">EMAIL</label><input id="nwRegEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${nwEscape(initialEmail)}"><label class="nw-new-label" for="nwRegPassword">PASSWORD</label><input id="nwRegPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"><label class="nw-new-label" for="nwRegPassword2">CONFIRM PASSWORD</label><input id="nwRegPassword2" type="password" autocomplete="new-password" minlength="6" placeholder="Enter it again"><button class="nw-action nw-auth-primary" id="nwCreateAccount" data-auth-busy>CREATE ACCOUNT</button><p id="nwRegisterNotice" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div><p class="nw-auth-switch">Already have an account? <button class="nw-inline-link" id="nwBackToSignIn" type="button">Sign in</button></p></div></section>`);
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
    if(result?.session){await nwLoadCloudProfile();nwShowProfile()}
    else say('Check your email. If this address can be registered, you’ll receive a confirmation link. Already have an account? Sign in instead.');
  });
}

// Password recovery is a separate screen; it is never mixed with profile editing.
function nwShowForgotPassword(initialEmail=''){
  evSudokuLeave();applyTheme('hub');
  evDisplay(`${evHeader('FORGOT PASSWORD',nwShowProfile)}<section class="nw-new-panel"><h2>Forgot your password?</h2><p class="nw-muted">Enter your email and we'll send you a link to set a new one.</p><label class="nw-new-label" for="nwForgotEmail">EMAIL</label><input id="nwForgotEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${nwEscape(initialEmail)}"><button class="nw-action" id="nwSendRecovery">SEND RESET LINK</button><p id="nwRecoveryRequestNotice" class="nw-muted" role="status" aria-live="polite" hidden></p><div class="nw-captcha"><div class="nw-captcha-widget"></div><p class="nw-muted nw-captcha-status" hidden></p></div></section>`);
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
  evSudokuLeave();applyTheme('hub');
  evDisplay(`<header class="ev-head"><span></span><strong>RESET PASSWORD</strong><span></span></header><section class="nw-new-panel"><h2>Set a new password</h2><p class="nw-muted">Enter a new password for your Nine & Weird account.</p><form id="nwRecoveryForm"><label class="nw-new-label" for="nwNewPassword">NEW PASSWORD</label><input id="nwNewPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"><label class="nw-new-label" for="nwConfirmPassword">CONFIRM NEW PASSWORD</label><input id="nwConfirmPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Enter it again"><button class="nw-action" id="nwSetPassword" type="submit">SAVE NEW PASSWORD</button></form><p id="nwRecoveryNotice" class="nw-muted" role="status" aria-live="polite" hidden></p><button class="nw-action" id="nwCancelRecovery">CANCEL</button></section>`);
  const msg=evRoot.querySelector('#nwRecoveryNotice'),submit=evRoot.querySelector('#nwSetPassword');
  evRoot.querySelector('#nwRecoveryForm').onsubmit=async(e)=>{
    e.preventDefault();const p=evRoot.querySelector('#nwNewPassword').value,confirm=evRoot.querySelector('#nwConfirmPassword').value;
    if(p.length<8){msg.textContent='Use at least 8 characters.';msg.hidden=false;return;}
    if(p!==confirm){msg.textContent='The passwords do not match.';msg.hidden=false;return;}
    submit.disabled=true;msg.hidden=true;
    try{await nwCloud.finishRecovery(p);nwShowProfile();const n=evRoot.querySelector('#nwAuthNotice');if(n){n.textContent='Password updated. You can use your new password next time you sign in.';n.hidden=false;}}
    catch(err){msg.textContent=err.message||'Could not update your password.';msg.hidden=false;submit.disabled=false;}
  };
  evRoot.querySelector('#nwCancelRecovery').onclick=async()=>{
    try{await nwCloud.signOut();nwShowProfile();}catch(err){msg.textContent=err.message;msg.hidden=false;}
  };
}
async function nwLoadCloudProfile(){
  const accountId=window.nwCloud?.user()?.id;
  if(!accountId)return;
  try{const data=await nwCloud.readProfile();if(data && nwCloud.user()?.id===accountId){
    const avatar=nwAvatarValue(data.avatar);
    nwWrite(nwProfileKey,{name:data.display_name||'Guest Player',avatar});
  }}catch(e){console.warn('Could not load Nine & Weird profile',e.message)}
}
if(window.nwCloud){
  // A different account must never inherit the old account's in-memory game screen.
  let nwVisibleAccountId=undefined;
  nwCloud.onChange(()=>{
    const activeId=nwCloud.user()?.id||null;
    const changed=nwVisibleAccountId!==undefined && nwVisibleAccountId!==activeId;
    nwVisibleAccountId=activeId;
    if(changed){
      evSudokuLeave();
      nwScroll.usual=nwScroll.weird=nwScroll.fav=0;
      nwRoomPages.usual=nwRoomPages.weird=nwRoomPages.fav=0;
      if(!nwCloud.isRecovering())nwShowProfile();
    }
    if(nwCloud.isRecovering()&&nwCloud.user()){nwShowRecovery();return;}
    if(nwCloud.user())nwLoadCloudProfile().then(()=>{
      if(document.getElementById('nwAccountStatus') && nwCloud.user()?.id===activeId)nwShowProfile();
    });
    else if(document.getElementById('nwAccountStatus')||document.getElementById('nwRecoveryForm'))nwShowProfile();
  });
  nwCloud.ready.then(()=>{if(nwCloud.isRecovering()&&nwCloud.user())nwShowRecovery()}).catch(e=>console.warn('NW cloud start',e.message));
}

function nwShowTrophy(tab='brain',offset=0){
  evSudokuLeave();applyTheme('hub');const r=nwWeeklyReport(offset),prior=nwWeeklyReport(offset-1),p=nwProfile();
  const weekTitle=new Date(r.start).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const brain=()=>`<div class="nw-report-head"><strong>${r.brain===null?'—':r.brain} / 1000</strong><span>Brain Power · playful game score, not IQ</span></div><div class="nw-report-grid"><article><small>ACCURACY</small><strong>${r.accuracy==null?'—':r.accuracy+'%'}</strong><em>Correct placements / attempts</em><span>${nwReportDelta(r.accuracy,prior.accuracy,' pts')} vs prior week</span></article><article><small>SPEED</small><strong>${nwFormatTime(r.adjusted)}</strong><em>Average difficulty-adjusted time</em><span>${r.adjusted!=null&&prior.adjusted!=null?nwFormatTime(Math.abs(r.adjusted-prior.adjusted))+(r.adjusted<=prior.adjusted?' faster':' slower'):'—'} vs prior week</span></article><article><small>WIN RATE</small><strong>${r.consistency==null?'—':r.consistency+'%'}</strong><em>${r.wins.length}/${r.rows.length} puzzles won</em><span>${nwReportDelta(r.consistency,prior.consistency,' pts')} vs prior week</span></article><article><small>IMPROVEMENT</small><strong>${nwReportDelta(r.brain,prior.brain)}</strong><em>Change in overall Brain Power</em><span>Compare weeks using arrows below</span></article></div><div class="nw-report-difficulty"><h3>DIFFICULTY PERFORMANCE</h3>${Object.entries(r.difficulty).map(([d,v])=>`<div class="nw-difficulty-line"><span>${d.toUpperCase()}</span><strong>${v.won} / ${v.played} completed</strong><div class="nw-difficulty-track"><i style="width:${v.played?(v.won/v.played*100):0}%"></i></div></div>`).join('')}</div><p class="nw-muted">${r.rows.length?'Based on recorded puzzles this week. Hints are included in activity but not counted as manual correct placements.':'No recorded puzzles in this week yet. Play a puzzle to start your report.'}</p>`;
  const battle=()=>`<div class="nw-report-head"><strong>COMING SOON</strong><span>Monthly wins, losses, win rate and earned Battle titles will appear here once real Battle Mode launches.</span></div><p class="nw-muted">No fake battle records or trophies will be created.</p>`;
  evDisplay(`${evHeader('TROPHY CASE',showCategories)}<section class="nw-new-panel"><div class="nw-trophy-intro">🏆 <strong>${nwEscape(p.name)}'s Trophy Case</strong></div><div class="nw-tabs"><button id="nwBrainTab" class="${tab==='brain'?'active':''}">BRAIN REPORT</button><button id="nwBattleTab" class="${tab==='battle'?'active':''}">BATTLE RECORDS</button></div>${tab==='brain'?`<div class="nw-week-nav"><button id="nwOlderWeek">‹</button><strong>WEEK OF ${weekTitle.toUpperCase()}</strong><button id="nwNewerWeek" ${offset>=0?'disabled':''}>›</button></div>${brain()}`:battle()}</section>`);
  evRoot.querySelector('#nwBrainTab').onclick=()=>nwShowTrophy('brain',0);evRoot.querySelector('#nwBattleTab').onclick=()=>nwShowTrophy('battle',0);
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
const nwBattlePracticeRuns = [{"recording_id":"f433b170-370e-4fe5-8831-4425e24ac5d5","difficulty":"easy","elapsed_seconds":55,"points":450,"mistakes":0,"puzzle_clues":"407015300605000240908027000703502680542800903861093452209154000150300720086209014","solved_grid":"427615398615938247938427165793542681542861973861793452279154836154386729386279514","display_name":"RECORDED CHALLENGER"},{"recording_id":"ca614677-e737-4dc0-b826-c5c322ca83b8","difficulty":"medium","elapsed_seconds":112,"points":750,"mistakes":0,"puzzle_clues":"028300005379500801564108970000006239930057010000030054000000002605290340201740080","solved_grid":"128379465379564821564128973457816239932457618816932754743685192685291347291743586","display_name":"RECORDED CHALLENGER"},{"recording_id":"44d7dc1e-6b01-499a-bb65-2a0df366f20f","difficulty":"hard","elapsed_seconds":123,"points":1100,"mistakes":0,"puzzle_clues":"064320718090000000000500932003900400740600800000750200009805046006091500000463100","solved_grid":"564329718392187654178546932623918475745632891981754263219875346436291587857463129","display_name":"RECORDED CHALLENGER"},{"recording_id":"4fb3fee9-3988-4a21-a696-057f0607aaed","difficulty":"expert","elapsed_seconds":122,"points":1420,"mistakes":1,"puzzle_clues":"300490000094700801000100020800009405910006003640300090008900200030604500006000310","solved_grid":"381492657294765831567183924873219465912546783645378192758931246139624578426857319","display_name":"RECORDED CHALLENGER"},{"recording_id":"a1578189-767d-4f88-94fd-2fbaee196a26","difficulty":"extreme","elapsed_seconds":173,"points":1780,"mistakes":2,"puzzle_clues":"600400900010907030009503002080090025007002080000140700000000243000000001340800050","solved_grid":"635421978214987536879563412481796325967352184523148769198675243756234891342819657","display_name":"RECORDED CHALLENGER"}];
const nwBattlePracticeKey='nineweird-battle-practice-v1';
let nwBattleActive=null;
function nwBattlePracticeHistory(){const h=nwRead(nwBattlePracticeKey,[]);return Array.isArray(h)?h:[];}
// Use a fresh illustrated room for each practice puzzle; the Sudoku grid and score
// still come from the authentic recorded run. Exclude the number-only Classic rooms.
function nwRandomBattleRoom(){
  const choices=[...nwGroups.usual,...nwGroups.weird].filter(id=>id!=='classic'&&id!=='dark'&&worlds[id]);
  return choices[Math.floor(Math.random()*choices.length)]||'halloween';
}
function nwBattleStart(){
  // Every practice match draws a fresh difficulty from Easy through Extreme.
  const opponent=nwBattlePracticeRuns[Math.floor(Math.random()*nwBattlePracticeRuns.length)];
  const difficulty=opponent?.difficulty;
  if(!opponent)return;
  nwBattleActive={opponent,worldBefore:currentWorld};
  currentWorld=nwRandomBattleRoom();
  evSudokuStart(difficulty,opponent);
}
function nwBattleReturn(){
  const previous=nwBattleActive?.worldBefore;
  nwBattleActive=null;
  if(previous&&worlds[previous])currentWorld=previous;
  showBattle();
}
function nwBattleFinish(s,won,points,elapsed){
  const opponent=s.practiceOpponent;
  const playerScore=won?points:0;
  const outcome=won?(playerScore>opponent.points?'WIN':playerScore<opponent.points?'LOSS':'DRAW'):'LOSS';
  const history=nwBattlePracticeHistory();
  history.push({at:Date.now(),difficulty:s.difficulty,outcome,playerScore,opponentScore:opponent.points,seconds:elapsed});
  nwWrite(nwBattlePracticeKey,history.slice(-100));
  clearInterval(sudokuTimer);
  evDisplay(`${evHeader('BATTLE PRACTICE',nwBattleReturn)}<section class="nw-battle nw-battle-ready"><div class="nw-battle-star">⚔</div><h2>${outcome==='WIN'?'PRACTICE WIN!':outcome==='DRAW'?'DRAW!':'PRACTICE LOSS'}</h2><p class="nw-feature-subtitle">${s.difficulty.toUpperCase()} · Same puzzle, recorded challenger</p><div class="nw-practice-scores"><div><small>YOU</small><strong>${playerScore.toLocaleString()}</strong><em>${won?elapsed+' seconds':'Puzzle not completed'}</em></div><div><small>RECORDED CHALLENGER</small><strong>${opponent.points.toLocaleString()}</strong><em>${opponent.elapsed_seconds} seconds · Human-played recording</em></div></div><p class="nw-feature-disclaimer">Practice-only result saved locally. No rewards, Battle season results, or Brain Reports changes.</p><div class="result-actions"><button class="theme-button" id="nwPracticeAgain">PLAY ANOTHER</button><button class="theme-button" id="nwPracticeBack">BATTLE MENU</button></div></section>`);
  evRoot.querySelector('#nwPracticeAgain').onclick=()=>nwBattleStart();
  evRoot.querySelector('#nwPracticeBack').onclick=nwBattleReturn;
}
function showBattle(){
  evSudokuLeave();applyTheme('hub');
  const d=new Date(),month=d.toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const all=nwBattlePracticeHistory(),wins=all.filter(x=>x.outcome==='WIN').length,draws=all.filter(x=>x.outcome==='DRAW').length;
  evDisplay(`${evHeader('BATTLE',showCategories)}<section class="nw-battle nw-battle-ready">
    <div class="nw-battle-star">⚔</div><h2>MONTHLY BATTLE</h2>
    <p class="nw-feature-subtitle">One-on-one Sudoku competition</p>
    <div class="nw-season-pill">${month.toUpperCase()} · ONLINE SEASON NOT LIVE</div>
    <div class="nw-feature-block"><strong>PLAY BATTLE PRACTICE</strong><p>Test yourself against a real, prerecorded human Sudoku performance. Both competitors use the identical puzzle. Higher score wins.</p><button type="button" class="theme-button" id="nwStartRandomBattle">START RANDOM BATTLE</button><small>Difficulty is randomly selected from Easy, Medium, Hard, Expert and Extreme. The illustrated room is random too. Original recorded opponent scores · No matchmaking required.</small></div>
    <div class="nw-feature-block"><strong>YOUR LOCAL PRACTICE RECORD</strong><p>${wins} wins · ${all.length-wins-draws} losses · ${draws} draws · ${all.length?Math.round(wins/all.length*100):0}% win rate</p><small>Only for testing on this device and account. Does not affect Brain Reports or the monthly Battle season.</small></div>
    <div class="nw-feature-banner">ONLINE MONTHLY BATTLE · COMING LATER</div>
    <p class="nw-feature-disclaimer">Practice opponents are prerecorded, human-completed Sudoku runs. Live ranking, tickets, and prizes are not active.</p>
  </section>`);
  evRoot.querySelector('#nwStartRandomBattle').onclick=()=>nwBattleStart();
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
    <div class="nw-event-schedule"><span>MON–WED <b>SHELF CONTROL</b></span><span>THU <b>TEAM UP</b></span><span>FRI–SUN <b>DOUBLE TROUBLE</b></span></div>
    <button class="nw-event-tile" id="nwEventShelf"><span class="nw-event-symbol" aria-hidden="true">🧸</span><span><strong>SHELF CONTROL</strong><small>Three-day sorting event · Move pieces between shelves to match three.</small><em>${nwEventStatus('shelf')}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>
    <button class="nw-event-tile" id="nwEventDouble"><span class="nw-event-symbol" aria-hidden="true">⚔️</span><span><strong>DOUBLE TROUBLE</strong><small>Friday–Sunday · 2v2 team Sudoku. Thursday is partner day.</small><em>${nwEventStatus('double')}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>
    <button class="nw-event-tile" id="nwEventWeekly"><span class="nw-event-symbol" aria-hidden="true">🏆</span><span><strong>WEEKLY LEADERBOARD</strong><small>Regular Sudoku scores from all rooms and difficulties.</small><em>${nwEventStatus('weekly')}</em></span><span class="nw-event-arrow" aria-hidden="true">›</span></button>
    <p class="nw-feature-disclaimer">Schedule preview · All daily boundaries are 00:00 UTC (08:00 Malaysia time). Event entry and rewards are not active yet.</p>
  </section>`);
  evRoot.querySelector('#nwEventShelf').onclick=()=>nwShowEventDetail('shelf');
  evRoot.querySelector('#nwEventWeekly').onclick=()=>nwShowEventDetail('weekly');
  evRoot.querySelector('#nwEventDouble').onclick=()=>nwShowEventDetail('double');
}

// Double Trouble offline sandbox. This is NOT a public event or online match.
// The three recorded participants each contribute ONE authentic uploaded run.
// The user's own normal Sudoku wins contribute to their side and Brain Reports.
const nwDoublePracticeKey='nineweird-double-practice-v1';
let nwDoublePracticeActive=false,nwDoubleWorldBefore=null;
function nwDoublePracticeData(){const obj=nwRead(nwDoublePracticeKey,null);return obj&&typeof obj==='object'?obj:null;}
function nwDoublePracticeStart(reset=false){
  if(nwDoubleWorldBefore===null)nwDoubleWorldBefore=currentWorld;
  if(reset||!nwDoublePracticeData())nwWrite(nwDoublePracticeKey,{teamPoints:0,userPuzzles:0,started:Date.now()});
  nwDoublePracticeActive=true;
  nwDoublePracticeScreen();
}
function nwDoublePracticeExit(){nwDoublePracticeActive=false;if(nwDoubleWorldBefore&&worlds[nwDoubleWorldBefore])currentWorld=nwDoubleWorldBefore;nwDoubleWorldBefore=null;nwShowEventDetail('double');}
function nwDoublePracticeScreen(){
  evSudokuLeave();nwDoublePracticeActive=false;applyTheme('hub');
  const record=nwDoublePracticeData()||{teamPoints:0,userPuzzles:0};
  const teammate=nwBattlePracticeRuns[0],op1=nwBattlePracticeRuns[1],op2=nwBattlePracticeRuns[2];
  const ourScore=record.teamPoints+teammate.points,otherScore=op1.points+op2.points;
  evDisplay(`${evHeader('DOUBLE TROUBLE TEST',nwDoublePracticeExit)}<section class="nw-events-panel nw-events-detail">
    <div class="nw-detail-icon">⚔️</div><h2>DOUBLE TROUBLE · TEST</h2>
    <p class="nw-muted">Offline scoring rehearsal. You are partnered with a human-played recording and matched against two other recorded performances. Each prerecorded participant is an individual, not a fixed pair.</p>
    <div class="nw-practice-scores"><div><small>YOUR TEAM</small><strong>${ourScore.toLocaleString()}</strong><em>You: ${record.teamPoints.toLocaleString()} · Recorded partner: ${teammate.points}</em></div><div><small>OTHER TEAM</small><strong>${otherScore.toLocaleString()}</strong><em>Recorded opponent 1: ${op1.points} · Opponent 2: ${op2.points}</em></div></div>
    <p>${record.userPuzzles} Sudoku puzzles completed by you during this test. Wins add points to your team.</p>
    <div class="nw-feature-block"><strong>PLAY ANOTHER NORMAL SUDOKU PUZZLE</strong><div class="nw-difficulty-choices">${['easy','medium','hard','expert','extreme'].map(d=>`<button type="button" data-double-difficulty="${d}">${d.toUpperCase()}</button>`).join('')}</div><small>Choose any of the five difficulties. A random illustrated room is selected for each puzzle. This test is available any day.</small></div>
    <button class="theme-button" id="nwDoubleReset">RESET LOCAL TEST SCORES</button>
    <p class="nw-feature-disclaimer">No online pairing, leaderboard submission or official event prizes. The recorded team scores are fixed test fixtures. Your Sudoku attempts count normally in Brain Reports.</p>
  </section>`);
  evRoot.querySelectorAll('[data-double-difficulty]').forEach(b=>b.onclick=()=>{nwDoublePracticeActive=true;currentWorld=nwRandomBattleRoom();evSudokuStart(b.dataset.doubleDifficulty);});
  evRoot.querySelector('#nwDoubleReset').onclick=()=>{if(confirm('Reset Double Trouble test scores for this account?'))nwDoublePracticeStart(true)};
}
function nwDoublePracticeAfterSudoku(s,won,pts){
  const obj=nwDoublePracticeData()||{teamPoints:0,userPuzzles:0};
  if(won){obj.teamPoints+=pts;obj.userPuzzles++;nwWrite(nwDoublePracticeKey,obj);}
  nwDoublePracticeActive=false;
  evDisplay(`${evHeader('DOUBLE TROUBLE TEST',nwDoublePracticeScreen)}<section class="nw-events-panel nw-events-detail"><div class="nw-detail-icon">${won?'✦':'×'}</div><h2>${won?'POINTS ADDED!':'PUZZLE LOST'}</h2><p>${won?`${pts.toLocaleString()} points added to your test team.`:'No team points awarded, but the attempt counts in Brain Reports.'}</p><div class="result-actions"><button class="theme-button" id="nwDoubleContinue">VIEW TEAM SCORES</button></div><p class="nw-feature-disclaimer">This is a local event rehearsal, not a live match.</p></section>`);
  evRoot.querySelector('#nwDoubleContinue').onclick=nwDoublePracticeScreen;
}
function nwShowEventDetail(type){
  evSudokuLeave();applyTheme('hub');
  const content={
    shelf:{title:'SHELF CONTROL',icon:'🧸',when:'MONDAY–WEDNESDAY',description:'Move illustrated pieces between shelves. Put three identical pieces together on one shelf and they clear automatically. Hidden pieces appear as the front pieces move. Clear the shelves before the timer expires.',foot:'A separate sorting mini-game using Nine & Weird artwork. This preview does not launch a playable event.'},
    double:{title:'DOUBLE TROUBLE',icon:'⚔️',when:'FRIDAY–SUNDAY · THURSDAY PARTNER DAY',description:'Two teammates play their own regular Sudoku puzzles. Every finished puzzle adds to the team score. Two teams compete over three days. Thursday is for invitations, partner selection, and matchmaking.',foot:'Double Trouble Sudoku attempts count toward Brain Reports Win Rate once this event is implemented. Team scores and matchmaking are not live yet.'},
    weekly:{title:'WEEKLY LEADERBOARD',icon:'🏆',when:'MONDAY–SUNDAY',description:'Complete regular Sudoku puzzles in any room and at any difficulty to earn weekly ranking points. The top 10 and your own position will appear here when rankings are live.',foot:'Ranking points are separate from spendable coins. Rewards and leaderboard data are not live yet.'}
  };
  const e=content[type]||content.weekly;
  evDisplay(`${evHeader(e.title,nwShowEvents)}<section class="nw-events-panel nw-events-detail"><div class="nw-detail-icon" aria-hidden="true">${e.icon}</div><h2>${e.title}</h2><div class="nw-season-pill">${e.when}</div><p>${e.description}</p><p class="nw-muted">${e.foot}</p>${type==='double'?`<div class="nw-feature-block"><strong>PARTNER SYSTEM · PREPARATION</strong><p>Thursday: invite a friend or request a random partner. Every participant, including each of the 20 planned prerecorded profiles, enters as an individual.</p><p>Friday–Sunday: teammates complete their own Sudoku boards and contribute to one shared team score.</p><small>This screen is a preparation preview. Partner requests and shared scores will require a real backend; nothing is submitted yet.</small></div>`:''}${type==='double'?'<button class="theme-button" id="nwDoublePracticeLaunch">TRY DOUBLE TROUBLE SOLO TEST</button>':''}<p class="nw-event-coming">COMING SOON</p><p class="nw-feature-disclaimer">Event timing follows 00:00 UTC (08:00 Malaysia time).</p></section>`);
  if(type==='double')evRoot.querySelector('#nwDoublePracticeLaunch').onclick=()=>nwDoublePracticeStart();
}

function showCategories(){
  evSudokuLeave();applyTheme('hub');
  evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>CHOOSE YOUR SIDE</strong><span></span></header><section class="world-categories" aria-label="Room collections"><div class="nw-profile-entry"><button id="nwProfileButton" class="nw-profile-button" aria-label="Open player profile"><span class="nw-profile-button-art">${nwAvatarImg(nwProfile().avatar,'nw-profile-button-img')}</span></button><div>${nwEscape(nwProfile().name)}</div><small>PROFILE / SIGN IN</small></div><button class="world-category world-category-usual" data-collection="usual"><span class="world-category-art" aria-hidden="true">✦</span><strong>THE USUAL</strong><small>The worlds you know and love.</small><span class="world-category-action">EXPLORE</span></button><button class="world-category world-category-weird" data-collection="weird"><span class="world-category-art" aria-hidden="true">◉</span><strong>THE WEIRD</strong><small>Don't ask. Just play.</small><span class="world-category-action">ENTER</span></button><button class="world-category world-category-fav nw-category-wide" data-collection="fav"><span class="nw-category-icon" aria-hidden="true">♥</span><strong>FAV</strong><small>Your saved rooms</small></button><button class="world-category world-category-battle nw-category-wide" id="nwBattle"><span class="nw-category-icon" aria-hidden="true">★</span><strong>BATTLE</strong><small>Play challenges</small></button><button class="world-category nw-category-wide nw-events-tile" id="nwEvents"><span class="nw-category-icon" aria-hidden="true">⚡</span><strong>EVENTS</strong><small>Weekly events & rankings</small></button><button class="world-category nw-category-wide nw-trophy-tile" id="nwTrophy"><span class="nw-category-icon" aria-hidden="true">🏆</span><strong>TROPHY CASE</strong><small>Titles and weekly brain reports</small></button></section>`);
  evRoot.querySelector('#toHome').onclick=showHome;
  evRoot.querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>{roomCollection=b.dataset.collection;nwScroll[roomCollection]=0;nwRoomPages[roomCollection]=0;showRooms(0)});
  evRoot.querySelector('#nwBattle').onclick=showBattle;evRoot.querySelector('#nwEvents').onclick=nwShowEvents;evRoot.querySelector('#nwTrophy').onclick=()=>nwShowTrophy();evRoot.querySelector('#nwProfileButton').onclick=nwShowProfile;
}
function showRooms(page=nwRoomPages[roomCollection]||0){
  const ids=roomCollection==='fav'?nwFavs():nwGroups[roomCollection]||nwGroups.usual;
  const perPage=20,total=roomCollection==='fav'?ids.length:Math.max(20,ids.length),pages=Math.max(1,Math.ceil(total/perPage));
  page=Number.isFinite(page)?page:0;
  evSudokuLeave();applyTheme('hub');
  roomPage=Math.max(0,Math.min(page,pages-1));
  nwRoomPages[roomCollection]=roomPage;
  const files={halloween:['assets/events/',sudokuImgs],patissserie:['assets/patissserie/',patissserieImgs],christmas:['assets/christmas/',christmasImgs],fairy:['assets/fairy/',fairyImgs],olympus:['assets/olympus/',olympusImgs],nineties:['assets/90s/',ninetiesImgs],weird:['assets/weird/',weirdImgs],ugly:['assets/ugly/',uglyImgs],alien:['assets/alien/',alienImgs],diner:['assets/diner/',dinerImgs],bodyparts:['assets/bodyparts/',bodypartsImgs],deepsea:['assets/deepsea/',deepseaImgs],solarsick:['assets/solarsick/',solarsickImgs],dontunwrap:['assets/dontunwrap/',dontunwrapImgs],unpreparedchristmas:['assets/unpreparedchristmas/',unpreparedchristmasImgs],underthebed:['assets/underthebed/',underthebedImgs],balloonwrong:['assets/balloonwrong/',balloonwrongImgs],donttakewater:['assets/donttakewater/',donttakewaterImgs],baggagehell:['assets/baggagehell/',baggagehellImgs],cakefail:['assets/cakefail/',cakefailImgs]};
  let tiles='';
  for(let i=roomPage*perPage;i<Math.min((roomPage+1)*perPage,total);i++){
    const id=ids[i];
    if(!id){tiles+='<div class="world-tile world-locked" aria-label="Locked future world"><strong>COMING SOON</strong><span class="world-locked-mark" aria-hidden="true">✧</span></div>';continue;}
    const w=worlds[id];
    const icons=id==='classic'||id==='dark'?Array.from({length:9},(_,n)=>`<span class="world-number">${n+1}</span>`).join(''):
      files[id][1].map(img=>`<img src="${files[id][0]}${img}" alt="" loading="lazy" width="32" height="32">`).join('');
    tiles+=`<button class="world-tile world-${id}" data-world="${id}" aria-label="Open ${w.label} world"><strong>${w.name}</strong><div class="world-samples" aria-hidden="true">${icons}</div></button>`;
  }
  evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>${roomCollection==='weird'?'THE WEIRD':roomCollection==='fav'?'FAV':'THE USUAL'}</strong><span></span></header><div class="world-grid world-list">${tiles}</div><nav class="world-pagination"><button id="prevWorldPage" ${roomPage===0?'disabled':''} aria-label="Previous page">‹</button><span>PAGE ${roomPage+1} / ${pages}</span><button id="nextWorldPage" ${roomPage===pages-1?'disabled':''} aria-label="Next page">›</button></nav>`);
  evRoot.querySelector('#toHome').onclick=showCategories;
  evRoot.querySelector('#prevWorldPage').onclick=()=>{nwScroll[roomCollection]=0;showRooms(roomPage-1)};
  evRoot.querySelector('#nextWorldPage').onclick=()=>{nwScroll[roomCollection]=0;showRooms(roomPage+1)};
  if(roomCollection==='fav'&&!ids.length)evRoot.querySelector('.world-grid.world-list').innerHTML='<p class="nw-empty-favs">No favourites yet. Find a room you love and tap ♡ on the difficulty screen.</p>';
  evRoot.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{nwSaveScroll();currentWorld=b.dataset.world;evSudokuMenu();nwResetViewToTop()});
  nwRestoreScroll();
}
function showHome(){evSudokuLeave();evRoot.hidden=true;document.getElementById('home').hidden=false;}
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
const sudokuSrc=n=>currentWorld==='cakefail'?'assets/cakefail/'+cakefailImgs[n-1]:currentWorld==='baggagehell'?'assets/baggagehell/'+baggagehellImgs[n-1]:currentWorld==='donttakewater'?'assets/donttakewater/'+donttakewaterImgs[n-1]:currentWorld==='balloonwrong'?'assets/balloonwrong/'+balloonwrongImgs[n-1]:currentWorld==='underthebed'?'assets/underthebed/'+underthebedImgs[n-1]:currentWorld==='unpreparedchristmas'?'assets/unpreparedchristmas/'+unpreparedchristmasImgs[n-1]:currentWorld==='dontunwrap'?'assets/dontunwrap/'+dontunwrapImgs[n-1]:currentWorld==='solarsick'?'assets/solarsick/'+solarsickImgs[n-1]:currentWorld==='deepsea'?'assets/deepsea/'+deepseaImgs[n-1]:currentWorld==='bodyparts'?'assets/bodyparts/'+bodypartsImgs[n-1]:currentWorld==='diner'?'assets/diner/'+dinerImgs[n-1]:currentWorld==='alien'?'assets/alien/'+alienImgs[n-1]:currentWorld==='ugly'?'assets/ugly/'+uglyImgs[n-1]:currentWorld==='weird'?'assets/weird/'+weirdImgs[n-1]:currentWorld==='nineties'?'assets/90s/'+ninetiesImgs[n-1]:currentWorld==='olympus'?'assets/olympus/'+olympusImgs[n-1]:currentWorld==='fairy'?'assets/fairy/'+fairyImgs[n-1]:currentWorld==='christmas'?'assets/christmas/'+christmasImgs[n-1]:currentWorld==='patissserie'?'assets/patissserie/'+patissserieImgs[n-1]:'assets/events/'+sudokuImgs[n-1];
let sudoku=null, sudokuTimer=null, sudokuLossTimer=null;
function evSudokuCancelLoss(){if(sudokuLossTimer!==null){clearTimeout(sudokuLossTimer);sudokuLossTimer=null;}}
function evSudokuLeave(){if(sudoku&&!sudoku.done&&sudoku.start&&!sudoku.practiceOpponent)nwSaveResult(sudoku,false);evSudokuCancelLoss();clearInterval(sudokuTimer);sudoku=null;}
function evSudokuMenu(){evSudokuLeave();applyTheme(worlds[currentWorld].theme);evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="difficulty-panel"><button type="button" class="nw-fav-toggle" id="nwFavToggle" aria-pressed="${nwIsFav(currentWorld)}">${nwIsFav(currentWorld)?'♥ FAVOURITED':'♡ ADD TO FAV'}</button><h2>CHOOSE DIFFICULTY</h2><div class="difficulty-list">${Object.keys(difficulties).map(d=>`<button class="theme-button" data-difficulty="${d}">${d.toUpperCase()}</button>`).join('')}</div></section>`);evRoot.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>evSudokuStart(b.dataset.difficulty));evRoot.querySelector('#nwFavToggle').onclick=()=>{const v=nwToggleFav(currentWorld),b=evRoot.querySelector('#nwFavToggle');b.textContent=v?'♥ FAVOURITED':'♡ ADD TO FAV';b.setAttribute('aria-pressed',String(v));};}
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
async function evSudokuStart(difficulty,practiceOpponent=null){
  evSudokuLeave();
  applyTheme(worlds[currentWorld].theme);
  const {answer,puzzle}=practiceOpponent?{answer:[...practiceOpponent.solved_grid].map(Number),puzzle:[...practiceOpponent.puzzle_clues].map(Number)}:nwMakeUniquePuzzle(difficulty);
  const givens=new Set(puzzle.map((n,i)=>n?i:-1).filter(i=>i>=0));
  sudoku={answer,values:[...puzzle],givens,selected:-1,choice:0,highlight:0,mistakes:0,wrong:new Set(),notes:false,noteMarks:{},history:[],hintsLeft:difficulties[difficulty].hints,start:Date.now(),difficulty,done:false,initialPuzzle:[...puzzle],reportAttempts:0,reportCorrect:0,reportHints:0,reportSaved:false,practiceOpponent,doublePractice:!practiceOpponent&&nwDoublePracticeActive};
  evSudokuRender();clearInterval(sudokuTimer);
  sudokuTimer=setInterval(()=>{if(!sudoku||sudoku.done)return;const el=evRoot.querySelector('#evSudoTime');if(el){const time=Math.floor((Date.now()-sudoku.start)/1000);el.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}},1000);
}
// Preserve previous cell value AND pencil notes for undo, including hinted cells.
function nwRecordSudokuHistory(s,i){
  s.history.push({i,value:s.values[i],wrong:s.wrong.has(i),notes:[...(s.noteMarks[i]||[])],hintsLeft:s.hintsLeft});
}
function evSudokuRender(){
  const s=sudoku;if(!s)return;
  const pts=difficulties[s.difficulty].points;
  evDisplay(`${evHeader(s.practiceOpponent?'BATTLE PRACTICE':s.doublePractice?'DOUBLE TROUBLE TEST':worlds[currentWorld].name,s.practiceOpponent?nwBattleReturn:s.doublePractice?nwDoublePracticeScreen:evSudokuMenu)}${s.practiceOpponent?`<p class="nw-practice-label">PRACTICE · ${s.difficulty.toUpperCase()} · HUMAN-PLAYED RECORDED CHALLENGER</p>`:''}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${(currentWorld==='cakefail'?cakefailImgs:currentWorld==='baggagehell'?baggagehellImgs:currentWorld==='donttakewater'?donttakewaterImgs:currentWorld==='balloonwrong'?balloonwrongImgs:currentWorld==='underthebed'?underthebedImgs:currentWorld==='unpreparedchristmas'?unpreparedchristmasImgs:currentWorld==='dontunwrap'?dontunwrapImgs:currentWorld==='solarsick'?solarsickImgs:currentWorld==='deepsea'?deepseaImgs:currentWorld==='bodyparts'?bodypartsImgs:currentWorld==='diner'?dinerImgs:currentWorld==='alien'?alienImgs:currentWorld==='ugly'?uglyImgs:currentWorld==='weird'?weirdImgs:currentWorld==='nineties'?ninetiesImgs:currentWorld==='olympus'?olympusImgs:currentWorld==='fairy'?fairyImgs:currentWorld==='christmas'?christmasImgs:currentWorld==='patissserie'?patissserieImgs:sudokuImgs).map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}">${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
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
    if(s.done)return;
    const prev=s.history.pop();if(!prev)return;
    s.values[prev.i]=prev.value;s.noteMarks[prev.i]=[...prev.notes];
    if(prev.wrong)s.wrong.add(prev.i);else s.wrong.delete(prev.i);
    s.hintsLeft=prev.hintsLeft;s.selected=prev.i;evSudokuPaint();
  };
  evRoot.querySelector('#evSudoHint').onclick=()=>{
    if(s.done||s.hintsLeft<=0)return;
    const i=s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]?s.selected:s.values.findIndex((n,i)=>n!==s.answer[i]&&!s.givens.has(i));
    if(i<0)return;
    nwRecordSudokuHistory(s,i);s.hintsLeft--;s.reportHints++;s.values[i]=s.answer[i];
    delete s.noteMarks[i];s.wrong.delete(i);s.selected=i;evSudokuPaint();evSudokuCheck();
  };
  evSudokuPaint();
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
    el.innerHTML=n?sudokuSymbol(n):(s.noteMarks[i]?.length?`<span class="ev-sudo-note-marks">${s.noteMarks[i].sort((a,b)=>a-b).join(' ')}</span>`:'');
  });
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>{const n=+b.dataset.symbol,remaining=evSudokuRemaining(n);b.classList.toggle('selected',s.highlight===n);b.classList.toggle('completed',remaining===0);b.disabled=remaining===0;b.querySelector('small').textContent=remaining===0?'':remaining;});
  const hint=evRoot.querySelector('#evSudoHint');if(hint){hint.disabled=s.hintsLeft<=0;hint.classList.toggle('used',s.hintsLeft<=0);hint.setAttribute('aria-label',`Hint: ${s.hintsLeft} remaining`);hint.title=s.hintsLeft?`${s.hintsLeft} hint(s) remaining`:'No hints remaining';}
  const err=evRoot.querySelector('#evSudoErrors');if(err){err.textContent=`${s.mistakes} / 3`;err.classList.toggle('ev-sudo-danger',s.mistakes>=2)}
}
function evSudokuPlace(n){
  const s=sudoku,i=s.selected;if(i<0||s.givens.has(i)||s.values[i]===s.answer[i]||s.done)return;
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
function evSudokuEnd(won){const s=sudoku;if(!s)return;if(!s.practiceOpponent)nwSaveResult(s,won);applyTheme(worlds[currentWorld].theme);const elapsed=Math.floor((Date.now()-s.start)/1000);const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;const pts=won?difficulties[s.difficulty].points+([100,70,30][s.mistakes]||0):0;if(s.practiceOpponent){nwBattleFinish(s,won,pts,elapsed);return;}if(won&&!s.pointsCredited){nwAwardPoints(pts);s.pointsCredited=true;}if(won)nwCaptureRun(s,pts);if(s.doublePractice){nwDoublePracticeAfterSudoku(s,won,pts);return;}evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="result-panel"><div class="result-mark">${won?'✦':'×'}</div><h2>${won?'Puzzle Completed!':'Puzzle Not Completed'}</h2>${won?`<div class="result-score"><small>TOTAL POINTS</small><strong>${pts.toLocaleString()}</strong></div>`:'<p>Three mistakes. Try again!</p>'}<div class="result-stats"><div>DIFFICULTY<strong>${s.difficulty.toUpperCase()}</strong></div><div>TIME<strong>${duration}</strong></div><div>MISTAKES<strong>${s.mistakes} / 3</strong></div></div><div class="result-actions"><button class="theme-button" id="evSudoAgain">${won?'PLAY AGAIN':'RETRY'}</button><button class="theme-button" id="evSudoBack">BACK TO ROOMS</button></div>${nwRecordingControls()}</section>`);nwBindRecordingControls();evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);evRoot.querySelector('#evSudoBack').onclick=()=>showRooms();}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true);
}

document.getElementById("start").onclick=showCategories;
