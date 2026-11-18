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
const nwBattlePracticeRuns = [{"recording_id":"07425f87-aa5a-4348-b429-0e0db2f24ce5","difficulty":"easy","elapsed_seconds":83,"points":450,"mistakes":0,"puzzle_clues":"109070354053901802208054901084030090000085000031207485040719508910528043005603710","solved_grid":"169872354453961872278354961584136297792485136631297485346719528917528643825643719"},{"recording_id":"bcb2eec8-ec91-4d23-b52b-cf7cd353cba9","difficulty":"easy","elapsed_seconds":96,"points":380,"mistakes":2,"puzzle_clues":"701060008839000054456090120170000589602850301905730240318600400200900810594183062","solved_grid":"721564938839217654456398127173426589642859371985731246318672495267945813594183762"},{"recording_id":"8510a31b-b828-4f91-bea4-3acb43aa9151","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"060007100409001080203006704102659347034028950695003021320805400850904270906302018","solved_grid":"568497132479231685213586794182659347734128956695743821327815469851964273946372518"},{"recording_id":"dddd11dc-4373-479b-8d6c-3ccce397aa2f","difficulty":"medium","elapsed_seconds":111,"points":680,"mistakes":2,"puzzle_clues":"170830200209400080360900007406502070007640000825791000082009000003268019501300028","solved_grid":"174836295259417386368925147436582971917643852825791463682159734743268519591374628"},{"recording_id":"1fe0799b-7b8a-4553-983f-34d4eafe64b5","difficulty":"medium","elapsed_seconds":139,"points":720,"mistakes":1,"puzzle_clues":"400010690017090834206000010709000150643851927001020000064380071385000400170000080","solved_grid":"438517692517296834296438715729643158643851927851729346964385271385172469172964583"},{"recording_id":"2c6f2987-ab3c-45ae-a58b-1351568d9921","difficulty":"medium","elapsed_seconds":90,"points":720,"mistakes":1,"puzzle_clues":"009320000000967010123500070300070106078019432016203000254790060000036504600000987","solved_grid":"769321845485967213123584679342875196578619432916243758254798361897136524631452987"},{"recording_id":"50aa8f80-96af-4c11-8172-a217c433132c","difficulty":"hard","elapsed_seconds":133,"points":1030,"mistakes":2,"puzzle_clues":"008400900690825004130700058009008003460050180000000509001070800005140030370009400","solved_grid":"528431967697825314134796258759218643463957182812364579241673895985142736376589421"},{"recording_id":"f0ba92c8-c9e8-41bf-bfbb-6dd7420679e2","difficulty":"hard","elapsed_seconds":197,"points":1030,"mistakes":2,"puzzle_clues":"500060200032000687006020090009004070008706902673192804007000000000200708925000060","solved_grid":"594867231132945687786321495219584376458736912673192854847613529361259748925478163"},{"recording_id":"019c3137-d8fa-42b5-91d0-68fe421741a8","difficulty":"hard","elapsed_seconds":111,"points":1070,"mistakes":1,"puzzle_clues":"000019080060205931903000000020036000000000090705020640000152369300048005250600804","solved_grid":"572319486468275931913864527129436758634587192785921643847152369396748215251693874"},{"recording_id":"9d1c9980-199d-47b0-8316-797c1fe9b49c","difficulty":"hard","elapsed_seconds":111,"points":1070,"mistakes":1,"puzzle_clues":"000006300604702010207090040910000080000073169308000400000324807023900600080500204","solved_grid":"891456372654732918237198546916245783542873169378619425165324897423987651789561234"},{"recording_id":"b4ea476b-9e4d-4ef7-88bc-63cc16c06efc","difficulty":"hard","elapsed_seconds":160,"points":1030,"mistakes":2,"puzzle_clues":"007040008050000462060008091000800014410000907789060003042080000000025809038006240","solved_grid":"197642358853971462264538791325897614416253987789164523542389176671425839938716245"},{"recording_id":"486d6590-3cf0-4bb0-8295-d6200581b082","difficulty":"expert","elapsed_seconds":164,"points":1420,"mistakes":1,"puzzle_clues":"000068000000900006700502013000090830149070205030050000401309000008020401070015008","solved_grid":"913768524524931786786542913265194837149873265837256149451389672398627451672415398"},{"recording_id":"eadb3148-ef6e-4548-9696-ba89734183d2","difficulty":"expert","elapsed_seconds":172,"points":1380,"mistakes":2,"puzzle_clues":"070090001050201080000006500000370000830150000900604078000410800000937415000800907","solved_grid":"678593241359241786124786593462378159837159624915624378793415862286937415541862937"},{"recording_id":"1464aedb-4c6b-45d0-8af6-8a7936e68cd6","difficulty":"expert","elapsed_seconds":205,"points":1380,"mistakes":2,"puzzle_clues":"040010387150080000000204506600000824084569000700020060008950630001000050020000000","solved_grid":"942615387156783492837294516695371824284569173713428965478952631361847259529136748"},{"recording_id":"9ce18d20-cd90-4293-90fa-17279dbd4832","difficulty":"extreme","elapsed_seconds":216,"points":1780,"mistakes":2,"puzzle_clues":"009007020100090507000006300000801263800003000006940870021600008000000010400000039","solved_grid":"349587126162394587578126394954871263817263945236945871721639458693458712485712639"},{"recording_id":"eb045746-803a-44ae-b773-b9103fd8a3e6","difficulty":"extreme","elapsed_seconds":172,"points":1780,"mistakes":2,"puzzle_clues":"800000004007920000001003900030580400000209008100460090500010327003090040006002000","solved_grid":"829156734347928165651743982932581476764239518185467293598614327273895641416372859"},{"recording_id":"58388d21-5576-43ee-98f2-65808eed69f1","difficulty":"extreme","elapsed_seconds":197,"points":1780,"mistakes":2,"puzzle_clues":"000007083300640070020500004000400958000000000042080061010050806570003100003004000","solved_grid":"461297583358641279927538614136472958895316427742985361214759836579863142683124795"},{"recording_id":"8e999cc9-919a-498f-9b03-adfafd61120a","difficulty":"extreme","elapsed_seconds":155,"points":1820,"mistakes":1,"puzzle_clues":"004700098500000000700009014000070085000108043100204900000400600602007000050020079","solved_grid":"314762598598341726726589314243976185967158243185234967879415632632897451451623879"},{"recording_id":"a187993a-a311-4c73-9f86-53a1172da5c6","difficulty":"extreme","elapsed_seconds":174,"points":1780,"mistakes":2,"puzzle_clues":"060009008097500006500026470706000000000285003000003000810050030070001050600900040","solved_grid":"362479518497518326581326479736194285149285763258763194814652937973841652625937841"},{"recording_id":"21dfb2ba-a665-4b33-b78e-3a4eb19a582a","difficulty":"expert","elapsed_seconds":97,"points":1450,"mistakes":0,"puzzle_clues":"026093007000014500040650930060000300005900400070046005600089003892070000010000002","solved_grid":"526893147938714526147652938461528379285937461379146285654289713892371654713465892"},{"recording_id":"2fe2ca63-f37b-42f7-bccd-503ac215fa01","difficulty":"expert","elapsed_seconds":188,"points":1380,"mistakes":2,"puzzle_clues":"807163040009270000006095007030000000780040052950007004060000103098001065000000200","solved_grid":"827163549549278316316495827634529781781346952952817634465982173298731465173654298"},{"recording_id":"d5c1a766-b57c-4b06-9cd0-522eec0c81ae","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"276910480843270095000840706052039648060702309109468000620000001590081264300624000","solved_grid":"276915483843276195915843726752139648468752319139468572624597831597381264381624957"},{"recording_id":"a1df9798-a8d7-4340-ab02-6917fac8fc6f","difficulty":"easy","elapsed_seconds":84,"points":420,"mistakes":1,"puzzle_clues":"409010025820947106136002079002008940940060580580304002008475300090026050750139268","solved_grid":"479613825825947136136582479612758943943261587587394612268475391391826754754139268"},{"recording_id":"49922c92-6ec8-479e-8866-904f35b471e0","difficulty":"easy","elapsed_seconds":78,"points":380,"mistakes":2,"puzzle_clues":"619248357005910408000537100501069830200175600900382710000000501007051084056894270","solved_grid":"619248357735916428842537196571469832283175649964382715498723561327651984156894273"},{"recording_id":"e778c222-d1c9-4a65-bd86-55374d6f792d","difficulty":"easy","elapsed_seconds":63,"points":420,"mistakes":1,"puzzle_clues":"701008203329147658805023407000071800084030700102405309457806030203054080690002570","solved_grid":"741568293329147658865923417936271845584639721172485369457896132213754986698312574"},{"recording_id":"d06619c7-8597-4eba-9c75-19179560d348","difficulty":"easy","elapsed_seconds":68,"points":380,"mistakes":2,"puzzle_clues":"080942705249500006700603049860090000490251007150060493908425671000076900671809504","solved_grid":"386942715249517386715683249867394152493251867152768493938425671524176938671839524"},{"recording_id":"14dfda65-71ac-4f5e-8647-1a5ccc9eb95e","difficulty":"medium","elapsed_seconds":101,"points":680,"mistakes":2,"puzzle_clues":"008903061000402309000167280074290003020310800601748500980031070060829030100000900","solved_grid":"248953761716482359395167284874295613529316847631748592982531476467829135153674928"},{"recording_id":"1d53f41b-3020-415d-96e6-33df057737ec","difficulty":"medium","elapsed_seconds":93,"points":680,"mistakes":2,"puzzle_clues":"269310007180540926075900000540002000300000700900631004000409063630185470790000085","solved_grid":"269318547183547926475926318548792631316854792927631854851479263632185479794263185"},{"recording_id":"8580cf0b-651e-44fe-ad1f-9fca466336ee","difficulty":"medium","elapsed_seconds":86,"points":750,"mistakes":0,"puzzle_clues":"000950008203100009094003000001230700300670410068001092140090020905782060870016953","solved_grid":"617954238283167549594823671451239786329678415768541392146395827935782164872416953"},{"recording_id":"cd40fd63-f6f6-486b-814c-8b75468faa04","difficulty":"hard","elapsed_seconds":137,"points":1070,"mistakes":1,"puzzle_clues":"052003760000245900000760205003100000700028100061004020006000002004852039008630400","solved_grid":"452983761617245983839761245283196574745328196961574328396417852174852639528639417"},{"recording_id":"62a3ef05-87f5-488e-a5e3-69d7ec904d3d","difficulty":"easy","elapsed_seconds":79,"points":380,"mistakes":2,"puzzle_clues":"000803921000457638638092504306920705289001040015030280862019050403206190197000000","solved_grid":"574863921921457638638192574346928715289571346715634289862719453453286197197345862"},{"recording_id":"7db830e9-1a57-4ace-888d-435ed7db3c22","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"970140562010500030056739100062301000040627001139485607680073904327014856001800000","solved_grid":"973148562814562739256739148762391485548627391139485627685273914327914856491856273"},{"recording_id":"5e1bd827-0e5e-4f69-a030-94acdd7fc21a","difficulty":"easy","elapsed_seconds":60,"points":420,"mistakes":1,"puzzle_clues":"416083000907610058005729061000971046179068005004350107732096580540207009690040003","solved_grid":"416583972927614358385729461253971846179468235864352197732196584548237619691845723"},{"recording_id":"52d138c9-746d-4926-8359-aa30b0b249ea","difficulty":"easy","elapsed_seconds":64,"points":420,"mistakes":1,"puzzle_clues":"762050091900006503000940200470208309200039107590417008127685934008300012349172000","solved_grid":"762853491914726583835941276471268359286539147593417628127685934658394712349172865"},{"recording_id":"489708f4-e3c6-471b-bf01-7dcbde99102e","difficulty":"easy","elapsed_seconds":63,"points":450,"mistakes":0,"puzzle_clues":"940052367370408021000030084063079000405003098780245036201907840000504210050321679","solved_grid":"948152367376498521512736984163879452425613798789245136231967845697584213854321679"},{"recording_id":"0bbc445d-d113-47ba-bb6e-87590bb5fa49","difficulty":"medium","elapsed_seconds":102,"points":720,"mistakes":1,"puzzle_clues":"060280053100000679005760001008000100000612085210835040850370096029158030000020018","solved_grid":"967281453182543679345769821538497162794612385216835947851374296629158734473926518"},{"recording_id":"a4793f9d-7628-4493-9869-dbe5ae988ab3","difficulty":"medium","elapsed_seconds":109,"points":750,"mistakes":0,"puzzle_clues":"004200509500004702006950008618702490409108027070500001000397850005021900000405016","solved_grid":"184276539593814762726953148618732495459168327372549681261397854845621973937485216"},{"recording_id":"4b5994b7-12f3-45c8-b46e-76333dcaa850","difficulty":"medium","elapsed_seconds":111,"points":750,"mistakes":0,"puzzle_clues":"480065070372001506090730004950200318010004000000100459030000002540629730069307040","solved_grid":"481965273372841596695732184954276318813594627726183459137458962548629731269317845"},{"recording_id":"37974858-e602-4974-9ce7-c925f42cc316","difficulty":"medium","elapsed_seconds":88,"points":750,"mistakes":0,"puzzle_clues":"708060523000005704502840000900370840814650200270410060087094602625700400090000000","solved_grid":"748961523169235784532847196956372841814659237273418965387194652625783419491526378"},{"recording_id":"c08a1c32-d1e7-4d94-9151-e1e55287755f","difficulty":"medium","elapsed_seconds":81,"points":750,"mistakes":0,"puzzle_clues":"065000012407001305012300007620805070000107603109002800538710006206503041700260000","solved_grid":"365478912487921365912356487623845179854197623179632854538714296296583741741269538"},{"recording_id":"8737e50d-a16f-4664-93ae-e7e812f018c8","difficulty":"medium","elapsed_seconds":70,"points":720,"mistakes":1,"puzzle_clues":"005873000003002506412965080240600073309420160001709802150390000900007450800004000","solved_grid":"695873214783142596412965387248651973379428165561739842154396728936287451827514639"},{"recording_id":"9956ad75-4034-47fd-af8e-5036634130c0","difficulty":"medium","elapsed_seconds":90,"points":680,"mistakes":2,"puzzle_clues":"057210468800079000321600050603405000000002310279130040436807001780021000000064080","solved_grid":"957213468864579123321648759613485972548792316279136845436857291785921634192364587"},{"recording_id":"11d77956-ba2c-492f-8418-6f07fe1e5083","difficulty":"hard","elapsed_seconds":140,"points":1030,"mistakes":2,"puzzle_clues":"902600057600710300005930800000000900008291000200403700806120403000340008040850070","solved_grid":"932684157684715329715932846463578912578291634291463785856127493127349568349856271"},{"recording_id":"79781cbc-19d2-454c-83e1-5151438b91ae","difficulty":"hard","elapsed_seconds":116,"points":1030,"mistakes":2,"puzzle_clues":"000000090001000408250048017080000049920380001070029830002090603067210004008003100","solved_grid":"846137592731952468259648317683571249924386751175429836512894673367215984498763125"},{"recording_id":"957c57a9-d427-488c-b02e-dcb13fa8e4d7","difficulty":"hard","elapsed_seconds":105,"points":1030,"mistakes":2,"puzzle_clues":"600705302907200860032008500203809100400000020705020900006900050079150000500004080","solved_grid":"684795312957213864132468597263849175498571623715326948346987251879152436521634789"},{"recording_id":"ecd7a87a-f378-48f7-9320-b0e869ea8eb5","difficulty":"hard","elapsed_seconds":109,"points":1070,"mistakes":1,"puzzle_clues":"000390240280010900003428156400609070027000009500030000000005090001963000600074805","solved_grid":"165397248284516937973428156418659372327841569596732481742185693851963724639274815"},{"recording_id":"e465db1e-80a6-4616-88f8-fa89ece2a81d","difficulty":"hard","elapsed_seconds":108,"points":1030,"mistakes":2,"puzzle_clues":"080002970061009000947830016300000702000080060056040380870006401000020097000090650","solved_grid":"583612974261479538947835216398561742724983165156247389879356421635124897412798653"},{"recording_id":"6e582764-7b03-46d7-b64d-9b63a1297d1a","difficulty":"hard","elapsed_seconds":97,"points":1070,"mistakes":1,"puzzle_clues":"000000000000004039005712406416059000207006000009327001050200090008573060600490370","solved_grid":"864935217172684539395712486416859723237146958589327641753261894948573162621498375"},{"recording_id":"453fa452-fae6-40d2-9aac-4b76654da4bd","difficulty":"expert","elapsed_seconds":143,"points":1380,"mistakes":2,"puzzle_clues":"004701030069004270000060800000010027290000185805207000932000018070000006400000300","solved_grid":"584721639369584271721369854643815927297643185815297463932456718178932546456178392"},{"recording_id":"b4f0f26d-9cd7-450d-bd6c-1edb75d9127a","difficulty":"expert","elapsed_seconds":152,"points":1380,"mistakes":2,"puzzle_clues":"000902000004063120910504008000000200000005087730000451080006500201007900300250004","solved_grid":"863912745574863129912574638145738296629145387738629451487396512251487963396251874"},{"recording_id":"5c4239ba-77e4-496c-a9ab-a55683ca982d","difficulty":"expert","elapsed_seconds":170,"points":1380,"mistakes":2,"puzzle_clues":"030005190806009000490000008000000060320076809007080003180094070603108000200000501","solved_grid":"732865194856419237491723658918342765324576819567981423185294376673158942249637581"},{"recording_id":"6322e285-339d-4ad0-ac3e-e4526a519987","difficulty":"expert","elapsed_seconds":120,"points":1420,"mistakes":1,"puzzle_clues":"009014050800900300100005000917000006020090000300502700000806090408059007090103064","solved_grid":"279314658856927341143685972917438526625791483384562719731846295468259137592173864"},{"recording_id":"6785f86d-61c6-4291-ae25-3c65653c15fb","difficulty":"expert","elapsed_seconds":145,"points":1380,"mistakes":2,"puzzle_clues":"041072000900001620002500400000160200500040076000259000094816050086000040000030001","solved_grid":"841672539953481627762593418438167295529348176617259384394816752186725943275934861"},{"recording_id":"7d556444-8f6f-49dd-b0de-128020be3102","difficulty":"expert","elapsed_seconds":144,"points":1380,"mistakes":2,"puzzle_clues":"016700900730090062000016057902000000084062000100380020043800000070500008000071005","solved_grid":"216735984735498162498216357962157843384962571157384629543829716671543298829671435"},{"recording_id":"fa412099-79ce-41f9-9d52-273d94b2bf0f","difficulty":"extreme","elapsed_seconds":122,"points":1780,"mistakes":2,"puzzle_clues":"090200080000700500200080010010024000042500100083071409000002050129400000430000000","solved_grid":"791245683368719542254386917617924835942538176583671429876192354129453768435867291"},{"recording_id":"af8b8531-d0ef-4941-be69-854696ac1def","difficulty":"extreme","elapsed_seconds":203,"points":1780,"mistakes":2,"puzzle_clues":"800010009712950000000040700060700090007001500000805027201080070000002005000076030","solved_grid":"846217359712953846359648712568724193427391568193865427231589674674132985985476231"},{"recording_id":"60682df7-4db1-455c-a7fa-64684d3b3f05","difficulty":"extreme","elapsed_seconds":159,"points":1780,"mistakes":2,"puzzle_clues":"035200070490000000001009000618000000050001000000345006040030260726004801000060005","solved_grid":"835216974497853612261479358618927543354681729972345186549138267726594831183762495"},{"recording_id":"e4eed04f-7939-47d9-8650-3b2e38d6b11e","difficulty":"extreme","elapsed_seconds":137,"points":1820,"mistakes":1,"puzzle_clues":"000705001001060030530082000706300000040007000100800050670003092802006000300090004","solved_grid":"469735281281964537537182469756321948948657123123849756674513892892476315315298674"},{"recording_id":"90d57b76-6560-40bb-8a01-a2182437b5f4","difficulty":"extreme","elapsed_seconds":182,"points":1780,"mistakes":2,"puzzle_clues":"031000000069023050000980100700064000045800000398000000020005018000300002000042690","solved_grid":"231457986869123457574986123712564839645839271398271564427695318956318742183742695"},{"recording_id":"765c7d35-383b-4202-a9e6-7e57f8f24c13","difficulty":"extreme","elapsed_seconds":141,"points":1780,"mistakes":2,"puzzle_clues":"036700001002080304100030520200008100000000000978000452000000903001564000020000040","solved_grid":"436752891752189364189436527245978136613245789978613452564827913391564278827391645"},{"recording_id":"28943521-c429-43a8-87c1-430a533863a9","difficulty":"extreme","elapsed_seconds":159,"points":1820,"mistakes":1,"puzzle_clues":"030516027002030100600000000020700500300051200104000800000000000001078435000345000","solved_grid":"438516927792834156615297384926783541387451269154629873543162798261978435879345612"},{"recording_id":"d8f9b49c-7f59-4c82-8faf-40eeea78c3ec","difficulty":"extreme","elapsed_seconds":211,"points":1780,"mistakes":2,"puzzle_clues":"005039004000008000087102000000000200740500000368004905050003000834010050001900030","solved_grid":"125639784693478521487152396519386247742591863368724915956843172834217659271965438"},{"recording_id":"f433b170-370e-4fe5-8831-4425e24ac5d5","difficulty":"easy","elapsed_seconds":55,"points":450,"mistakes":0,"puzzle_clues":"407015300605000240908027000703502680542800903861093452209154000150300720086209014","solved_grid":"427615398615938247938427165793542681542861973861793452279154836154386729386279514"},{"recording_id":"9ea46758-8890-4d51-9012-79e31a1821b6","difficulty":"easy","elapsed_seconds":73,"points":450,"mistakes":0,"puzzle_clues":"004837026000104387007256914620410875000620103410705000572961438000340052040072000","solved_grid":"194837526256194387837256914629413875785629143413785269572961438961348752348572691"},{"recording_id":"b92f82e6-4e30-47a6-b7a1-64299ea9243b","difficulty":"easy","elapsed_seconds":88,"points":380,"mistakes":2,"puzzle_clues":"090001020750498600630752409265070000043065097870140056927004000084016972010927308","solved_grid":"498631725752498613631752489265879134143265897879143256927384561384516972516927348"},{"recording_id":"c3878934-39df-43bd-8e91-7f156bf350ae","difficulty":"easy","elapsed_seconds":75,"points":420,"mistakes":1,"puzzle_clues":"419200005750149000020073001040802650082700010075030900198627540534918206060354089","solved_grid":"419286735753149862826573491341892657982765314675431928198627543534918276267354189"},{"recording_id":"837610c9-35ca-4a1d-ade8-328c1e2fe99d","difficulty":"easy","elapsed_seconds":79,"points":450,"mistakes":0,"puzzle_clues":"000207910961458732720019850000740109090800340374921508000102090050384001207596003","solved_grid":"845237916961458732723619854586743129192865347374921568438172695659384271217596483"},{"recording_id":"de1d6e48-0a4a-4f20-812f-d7671739c068","difficulty":"easy","elapsed_seconds":75,"points":450,"mistakes":0,"puzzle_clues":"174302090206008000050700060000850071685100430017004658590027380068010724742683519","solved_grid":"174362895236598147859741263423856971685179432917234658591427386368915724742683519"},{"recording_id":"dd3aa7f9-9670-46e9-a412-cf5fffa50738","difficulty":"easy","elapsed_seconds":65,"points":380,"mistakes":2,"puzzle_clues":"580009000094231085312658497471800900238905000000147802825700000040500769060314520","solved_grid":"586479213794231685312658497471823956238965174659147832825796341143582769967314528"},{"recording_id":"0789bbc1-a25c-447a-b8c5-6f65552fcb5a","difficulty":"easy","elapsed_seconds":75,"points":450,"mistakes":0,"puzzle_clues":"230900467407235010918007235546800090820090540091006003054180679080009300079054180","solved_grid":"235918467467235918918467235546823791823791546791546823354182679182679354679354182"},{"recording_id":"6f132b6d-ee9d-4af2-a6f7-3f4c0c9fb2d2","difficulty":"easy","elapsed_seconds":73,"points":450,"mistakes":0,"puzzle_clues":"208930465654821030379005820090374650580200004040658209025003006060582003901706000","solved_grid":"218937465654821937379465821192374658586219374743658219825193746467582193931746582"},{"recording_id":"098cc81c-b19f-4477-bd20-93e3cbbbeb68","difficulty":"easy","elapsed_seconds":68,"points":450,"mistakes":0,"puzzle_clues":"816540920290861054500200100601400509709010043480790260000950712940107608172380000","solved_grid":"816543927297861354534279186621438579759612843483795261368954712945127638172386495"},{"recording_id":"ca614677-e737-4dc0-b826-c5c322ca83b8","difficulty":"medium","elapsed_seconds":112,"points":750,"mistakes":0,"puzzle_clues":"028300005379500801564108970000006239930057010000030054000000002605290340201740080","solved_grid":"128379465379564821564128973457816239932457618816932754743685192685291347291743586"},{"recording_id":"2b1624bd-b05f-4971-86b4-46909981d15d","difficulty":"medium","elapsed_seconds":95,"points":750,"mistakes":0,"puzzle_clues":"600027900400035010003081472867200000390800000000019060000748029029063084700590136","solved_grid":"618427953472935618953681472867254391391876245245319867136748529529163784784592136"},{"recording_id":"a19b2274-8094-4b85-8e59-caeac3dbd1b7","difficulty":"medium","elapsed_seconds":106,"points":750,"mistakes":0,"puzzle_clues":"984050360750030049030009017510063400069000000800215000003890700470320900608074201","solved_grid":"984157362751632849236489517512963478369748125847215693123896754475321986698574231"},{"recording_id":"df3a4491-4258-4ac8-8bae-5720c9e080df","difficulty":"medium","elapsed_seconds":91,"points":750,"mistakes":0,"puzzle_clues":"200056070719040080805790400642100009397620010100000000403062090026008340981007600","solved_grid":"234856971719243586865791423642185739397624815158379264473562198526918347981437652"},{"recording_id":"44edd032-a709-4878-91a3-185562885627","difficulty":"medium","elapsed_seconds":100,"points":750,"mistakes":0,"puzzle_clues":"009072300108090000257300069402800930581900742300000050715038200063009000924050600","solved_grid":"649572318138496527257381469472815936581963742396724851715638294863249175924157683"},{"recording_id":"57c18d2e-1af6-4963-9cb0-387a69a5f49c","difficulty":"medium","elapsed_seconds":74,"points":750,"mistakes":0,"puzzle_clues":"002041009390085160040090008420069000000570012875024900004900083730400001009837240","solved_grid":"582641379397285164146793528421369857963578412875124936254916783738452691619837245"},{"recording_id":"6841a26e-e036-4b52-a0b8-2e60cf9ef2d1","difficulty":"medium","elapsed_seconds":102,"points":750,"mistakes":0,"puzzle_clues":"000300486900600051008052903600000040059043608000006095740018530021905064500007812","solved_grid":"215379486937684251468152973682591347159743628374826195746218539821935764593467812"},{"recording_id":"6a50d19c-7454-441a-8031-83fd4cd9ae24","difficulty":"medium","elapsed_seconds":89,"points":720,"mistakes":1,"puzzle_clues":"002097040304008719000403005200900060486572190130000250500349600943820000008010030","solved_grid":"852197346364258719791463825275931468486572193139684257517349682943826571628715934"},{"recording_id":"23e07a0e-1523-42bb-870d-ef918ba06aeb","difficulty":"medium","elapsed_seconds":85,"points":720,"mistakes":1,"puzzle_clues":"930000062206398570407100009072039045360050701000712003040063008623900010000000230","solved_grid":"938547162216398574457126389172639845369854721584712693741263958623985417895471236"},{"recording_id":"2185f07e-3fe3-4494-a21b-7bca15b24c18","difficulty":"medium","elapsed_seconds":145,"points":720,"mistakes":1,"puzzle_clues":"506403980734008520901052734000004800815006309000500007408005603003009002052067000","solved_grid":"526473981734198526981652734267934815815726349349581267498215673673849152152367498"},{"recording_id":"44d7dc1e-6b01-499a-bb65-2a0df366f20f","difficulty":"hard","elapsed_seconds":123,"points":1100,"mistakes":0,"puzzle_clues":"064320718090000000000500932003900400740600800000750200009805046006091500000463100","solved_grid":"564329718392187654178546932623918475745632891981754263219875346436291587857463129"},{"recording_id":"0dd1ecc2-2a28-42fe-97fc-f8f0d1b8a4f5","difficulty":"hard","elapsed_seconds":122,"points":1100,"mistakes":0,"puzzle_clues":"809003000075900040130027006001269380000100029090000705020600500513092008000001002","solved_grid":"869413257275986143134527896751269384348175629692834715927648531513792468486351972"},{"recording_id":"385d79e3-62ab-426b-9d57-40709c5d5943","difficulty":"hard","elapsed_seconds":149,"points":1030,"mistakes":2,"puzzle_clues":"000089003096000050304002000048025679000700081907004532080153706670000300000000090","solved_grid":"725689143896431257314572968148325679253796481967814532489153726672948315531267894"},{"recording_id":"4ff2ef59-93fc-40c8-9ab6-f67b7cc96c4c","difficulty":"hard","elapsed_seconds":100,"points":1100,"mistakes":0,"puzzle_clues":"000380150400000690000620008700902000019000070064030020007051809608700005002896704","solved_grid":"926384157483175692571629348735912486219468573864537921347251869698743215152896734"},{"recording_id":"fca4194b-0f73-47cd-bf81-2e129327939a","difficulty":"hard","elapsed_seconds":144,"points":1070,"mistakes":1,"puzzle_clues":"037802490090007080582006000000004000804790305071235004010070040050000009208000703","solved_grid":"137852496496317582582946137325684971864791325971235864619573248753428619248169753"},{"recording_id":"0950a39d-75ed-468b-9ed1-0f435642ccff","difficulty":"hard","elapsed_seconds":130,"points":1070,"mistakes":1,"puzzle_clues":"001020097800497016409000020090000000020780000004300789980100065147060030000038070","solved_grid":"561823497832497516479516823798641352325789641614352789983174265147265938256938174"},{"recording_id":"f736034c-6338-41f4-9a10-88fd2c1b5350","difficulty":"hard","elapsed_seconds":185,"points":1100,"mistakes":0,"puzzle_clues":"000070092020406000807009160006002040238090650010700023000047000085900070700803209","solved_grid":"641578392923416785857239164576382941238194657419765823192647538385921476764853219"},{"recording_id":"83f16157-53ca-45fc-97dd-544b71d0fbdf","difficulty":"hard","elapsed_seconds":109,"points":1070,"mistakes":1,"puzzle_clues":"800006043625043900000900500184060205030000009000000480000000012050312090203804650","solved_grid":"879526143625143978341978526184769235532481769967235481498657312756312894213894657"},{"recording_id":"85824ae6-17f6-4f17-b32d-b856318e5505","difficulty":"hard","elapsed_seconds":122,"points":1070,"mistakes":1,"puzzle_clues":"000400835000853060038200097000601000806007304009000018300002500905138020020504000","solved_grid":"162479835794853261538216497453681972816927354279345618381762549945138726627594183"},{"recording_id":"3e3de936-2211-492e-8e29-d0bac327c5a4","difficulty":"hard","elapsed_seconds":159,"points":1030,"mistakes":2,"puzzle_clues":"370009001405080900902104000003006140104500000000201035547060010200000860806900500","solved_grid":"378629451415783926962154387753896142124537698689241735547368219291475863836912574"},{"recording_id":"4fb3fee9-3988-4a21-a696-057f0607aaed","difficulty":"expert","elapsed_seconds":122,"points":1420,"mistakes":1,"puzzle_clues":"300490000094700801000100020800009405910006003640300090008900200030604500006000310","solved_grid":"381492657294765831567183924873219465912546783645378192758931246139624578426857319"},{"recording_id":"ce2fd642-3b1c-4e14-ab6b-3c6fbda5d78d","difficulty":"expert","elapsed_seconds":134,"points":1380,"mistakes":2,"puzzle_clues":"001004900000000062040509800962000174010006000030401020029100046000640200000300501","solved_grid":"781264935593718462246539817962853174417926358835471629329185746158647293674392581"},{"recording_id":"1d080036-ac60-463b-8663-c280208beaef","difficulty":"expert","elapsed_seconds":223,"points":1380,"mistakes":2,"puzzle_clues":"500904010000600038760053200005160870800490001002080000000009307020000085000048100","solved_grid":"583924716294671538761853249945162873837495621612387954458219367129736485376548192"},{"recording_id":"27cabdf5-a5f3-4c71-9be0-49c845ac9b6d","difficulty":"expert","elapsed_seconds":154,"points":1380,"mistakes":2,"puzzle_clues":"360005700000020104010009002097004000800900300000018007009401070780200013140050200","solved_grid":"362145798978623154514789632297364581851972346436518927629431875785296413143857269"},{"recording_id":"e54ac450-a639-4f28-8b26-6ac322cb6c95","difficulty":"expert","elapsed_seconds":150,"points":1420,"mistakes":1,"puzzle_clues":"000070058467805390001030046000000403210040500634008000300000205000960074000020000","solved_grid":"923674158467815392581239746875192463219346587634758921396487215152963874748521639"},{"recording_id":"6aa1debe-f0b2-49e1-bfe0-96089dec5024","difficulty":"expert","elapsed_seconds":148,"points":1420,"mistakes":1,"puzzle_clues":"600039007000040930080005600800160200700000053200308760007600000098000126002084000","solved_grid":"624839517571246938983715642835167294716492853249358761357621489498573126162984375"},{"recording_id":"e290cdff-7b0c-41c2-aa24-5005dead6e5a","difficulty":"expert","elapsed_seconds":143,"points":1420,"mistakes":1,"puzzle_clues":"806050001500301007013000509100072900005003106900806000000005004009030070600900308","solved_grid":"876259431592341867413687529168572943725493186934816752381765294249138675657924318"},{"recording_id":"d540350f-2bbb-4b3b-802a-7f3f9c584c40","difficulty":"expert","elapsed_seconds":147,"points":1450,"mistakes":0,"puzzle_clues":"740000065000002000502003010080056002004001650006200103038190000100007030607430000","solved_grid":"743819265819562347562743918381956472274381659956274183438195726195627834627438591"},{"recording_id":"97e04e5a-2397-4a3d-b9d2-f0599ffc1d8b","difficulty":"expert","elapsed_seconds":106,"points":1420,"mistakes":1,"puzzle_clues":"007230000236109807040087000092000035000090000070300042058020000000658093000000560","solved_grid":"587236419236149857149587326492871635365492781871365942658923174714658293923714568"},{"recording_id":"190e51da-fc9b-48e7-9f53-f6926f4989f5","difficulty":"expert","elapsed_seconds":146,"points":1380,"mistakes":2,"puzzle_clues":"000003000040958020050207003060090085403000670028700000001409702004000300275100000","solved_grid":"712643598346958127859217463167394285493825671528761934631489752984572316275136849"},{"recording_id":"a1578189-767d-4f88-94fd-2fbaee196a26","difficulty":"extreme","elapsed_seconds":173,"points":1780,"mistakes":2,"puzzle_clues":"600400900010907030009503002080090025007002080000140700000000243000000001340800050","solved_grid":"635421978214987536879563412481796325967352184523148769198675243756234891342819657"},{"recording_id":"d45aa53f-4b65-4329-a74c-91d414c7a8c6","difficulty":"extreme","elapsed_seconds":137,"points":1780,"mistakes":2,"puzzle_clues":"000000004405872001000506200000051008000080720006000005007060040084790500051000009","solved_grid":"728319654465872931193546287372951468519684723846237195937165842284793516651428379"},{"recording_id":"023b43c2-bac2-4189-91ed-c12f96642b7d","difficulty":"extreme","elapsed_seconds":145,"points":1780,"mistakes":2,"puzzle_clues":"100725300006000200200039040000000620005983010000560009070290000000000570003000960","solved_grid":"148725396396814257257639148839471625625983714714562839571296483962348571483157962"},{"recording_id":"2cdf1966-dc75-499e-b03e-27eed34f81b5","difficulty":"extreme","elapsed_seconds":177,"points":1780,"mistakes":2,"puzzle_clues":"008001750000400600005000002000009200020800063000010008109005846000100020700648001","solved_grid":"968231754213457689475986132847369215521874963396512478139725846684193527752648391"},{"recording_id":"ba1e87fd-6fa6-4570-8707-d609308e9315","difficulty":"extreme","elapsed_seconds":180,"points":1780,"mistakes":2,"puzzle_clues":"000001900807020000000890056100700000000000620089000047008410709073050100410000080","solved_grid":"625341978897625413341897256162734895734589621589162347258416739973258164416973582"},{"recording_id":"6e65247a-e30a-4f9c-b0c8-0594bcaabcb2","difficulty":"extreme","elapsed_seconds":198,"points":1820,"mistakes":1,"puzzle_clues":"830649010000000049004000800000400100420138500003090002000000081000700300000365004","solved_grid":"835649217271853649694217853569472138427138596183596472356924781942781365718365924"},{"recording_id":"e89b241f-fd23-4c19-a016-3757f62ec861","difficulty":"extreme","elapsed_seconds":152,"points":1780,"mistakes":2,"puzzle_clues":"020100050000000402900060030100570000050602103009000000071086004000403000302700680","solved_grid":"426137958713859462985264731134578296857692143269341875571986324698423517342715689"},{"recording_id":"fac147d8-6c6c-4c4a-97f4-e885d67b0c55","difficulty":"extreme","elapsed_seconds":155,"points":1780,"mistakes":2,"puzzle_clues":"000000000230018070001500203000400090308006500610000300406000000023060159190007000","solved_grid":"957342816234618975861579243572483691348196527619725384486951732723864159195237468"},{"recording_id":"728a1a50-e3f5-402e-9469-b25fb486162e","difficulty":"extreme","elapsed_seconds":148,"points":1780,"mistakes":2,"puzzle_clues":"000092000600700829290000701000028040001000573009000002500080000900605008103000007","solved_grid":"317892465654713829298456731735128946821964573469537182576381294942675318183249657"},{"recording_id":"05ed0952-b5c7-4861-a313-7705269769a3","difficulty":"extreme","elapsed_seconds":156,"points":1820,"mistakes":1,"puzzle_clues":"000305409070004020000028503007406090430800000002000034001050040000000007240001300","solved_grid":"128375469375964821964128573517436298436892715892517634781653942653249187249781356"},{"recording_id":"1d84aaae-7871-4b21-add1-9d84e96834dd","difficulty":"easy","elapsed_seconds":61,"points":420,"mistakes":1,"puzzle_clues":"350000060798260010046315700500008476903470021467521038835697042104000007670002800","solved_grid":"351789264798264315246315789512938476983476521467521938835697142124853697679142853"},{"recording_id":"d43ae3d1-fdb2-4257-9b4f-084df38d03d7","difficulty":"easy","elapsed_seconds":62,"points":420,"mistakes":1,"puzzle_clues":"532060948070080000000203106095030807326071590708549603260410359084390002003720401","solved_grid":"532167948671984235849253176495632817326871594718549623267418359184395762953726481"},{"recording_id":"413d4f4b-8ec2-4bf8-8796-4443f901903c","difficulty":"easy","elapsed_seconds":60,"points":420,"mistakes":1,"puzzle_clues":"720065083890072001051009274009030640460900700000540810518790426246851090030024058","solved_grid":"724165983893472561651389274189237645465918732372546819518793426246851397937624158"},{"recording_id":"c01a4d29-2d2f-4cc2-8a52-fceff3336af2","difficulty":"easy","elapsed_seconds":76,"points":450,"mistakes":0,"puzzle_clues":"759026041081005620003148579000000296000690430900804715592003087030701002810209364","solved_grid":"759326841481975623263148579348517296175692438926834715592463187634781952817259364"},{"recording_id":"5831d01f-893f-4410-a7de-140c10b8eb1a","difficulty":"easy","elapsed_seconds":98,"points":420,"mistakes":1,"puzzle_clues":"910604007370200000400503201208736159630105020501802760709420006100360970863950402","solved_grid":"912684537375219648486573291248736159637195824591842763759421386124368975863957412"},{"recording_id":"7c51f58a-15b1-4068-b4b0-e05bc374aba8","difficulty":"easy","elapsed_seconds":60,"points":450,"mistakes":0,"puzzle_clues":"034217698700690045809040007953704861106500700402000509040102056208050470695400082","solved_grid":"534217698721698345869345217953724861186539724472861539347182956218956473695473182"},{"recording_id":"ba5d03b2-7889-420c-b468-539c59e20040","difficulty":"easy","elapsed_seconds":66,"points":450,"mistakes":0,"puzzle_clues":"390640507084527000500300608130400285409085173200073490820051004040862001705030862","solved_grid":"391648527684527319572319648137496285469285173258173496826751934943862751715934862"},{"recording_id":"c87d0bde-2f08-486f-984c-bf0a386f6b93","difficulty":"medium","elapsed_seconds":91,"points":750,"mistakes":0,"puzzle_clues":"104000579000790001050413608706501832405000000203670100600950003009032006301860400","solved_grid":"134286579862795341957413628796541832415328967283679154678954213549132786321867495"},{"recording_id":"86680209-48b5-4d69-a1ac-6c818cebed0a","difficulty":"medium","elapsed_seconds":162,"points":750,"mistakes":0,"puzzle_clues":"647210583005640000200000700900560400700000350503000198050006040070492815400150637","solved_grid":"647219583835647921219835764981563472724981356563724198158376249376492815492158637"},{"recording_id":"0bd730b2-88f5-46f0-ab58-88374593eb78","difficulty":"medium","elapsed_seconds":99,"points":720,"mistakes":1,"puzzle_clues":"010820060002600179000790402080006053004000091500918620097180540100060907050370208","solved_grid":"719824365842653179635791482981246753264537891573918624397182546128465937456379218"},{"recording_id":"58499d2a-ef3d-41f0-a6f6-8cff76c23b72","difficulty":"medium","elapsed_seconds":78,"points":750,"mistakes":0,"puzzle_clues":"028960007950107400100002065589006240700203508004000706007301854000804070800009320","solved_grid":"428965137956137482173482965589716243761243598234598716697321854312854679845679321"},{"recording_id":"8e467978-1e6e-4650-901e-286a2dfe5ac3","difficulty":"medium","elapsed_seconds":113,"points":750,"mistakes":0,"puzzle_clues":"327980050009045000056030800730000600601073082002004735070020100290800574008457090","solved_grid":"327981456819645327456732819735298641641573982982164735574329168293816574168457293"},{"recording_id":"5b3658e0-7f97-4f47-bfb4-72d5aba156a7","difficulty":"medium","elapsed_seconds":115,"points":750,"mistakes":0,"puzzle_clues":"580000070003000085106985040004710803050020010017003426890004007035267100760108030","solved_grid":"589342671243671985176985342624719853358426719917853426891534267435267198762198534"},{"recording_id":"02a74cce-97ed-48a4-8bea-e5b2e100ea49","difficulty":"hard","elapsed_seconds":110,"points":1070,"mistakes":1,"puzzle_clues":"703009008000000347050000600070003086682000490390200070030960810400010035208030900","solved_grid":"743629158926158347851347629175493286682571493394286571537964812469812735218735964"},{"recording_id":"38401553-bad7-4418-b4c5-079465aa2bc7","difficulty":"hard","elapsed_seconds":126,"points":1030,"mistakes":2,"puzzle_clues":"000900700160307000000824096500002000294000008001000049010070054045019067306040901","solved_grid":"428961735169357482753824196587492613294136578631785249912673854845219367376548921"},{"recording_id":"85e5c207-6780-4166-9eb6-e671c89e5d1a","difficulty":"hard","elapsed_seconds":142,"points":1030,"mistakes":2,"puzzle_clues":"530000000007800530908053060000605004000001893014389206000030021000162070601900000","solved_grid":"532716948167894532948253167893625714256471893714389256479538621385162479621947385"},{"recording_id":"e78d17f1-5060-4978-9651-5ee1905b884f","difficulty":"hard","elapsed_seconds":152,"points":1070,"mistakes":1,"puzzle_clues":"802039007157000900060570840000090000539014000401280530200863700090000000300007004","solved_grid":"842639157157428963963571842628395471539714628471286539214863795795142386386957214"},{"recording_id":"eed28f7b-a56c-4f96-a37f-abc5dc10aa17","difficulty":"hard","elapsed_seconds":144,"points":1100,"mistakes":0,"puzzle_clues":"904008207020600000030217004050000000093002146006083000070400020000825700200761409","solved_grid":"964358217127694358538217694752146983893572146416983572671439825349825761285761439"},{"recording_id":"4d627a60-74e8-4349-bb31-94b65d03346c","difficulty":"hard","elapsed_seconds":138,"points":1070,"mistakes":1,"puzzle_clues":"900007030065100000013409007080005700006000042300840000620071384430206501000300090","solved_grid":"942657138765138429813429657284965713596713842371842965629571384438296571157384296"}];
// Individual character identities for the locally recorded matchmaking rehearsal.
const nwBattleProfiles = ["Vivian", "M A R C U S", "Apple", "peach.exe", "MisterMoth", "jellypanic", "TuesdayGhost", "milkteeth", "NOODLE404", "Clementine", "3AMToast", "moss.mp3", "LadyCrumbs", "sockcriminal", "Juniper", "tinychaos", "VelvetFrog", "orbitless", "BUBBLEWRAP", "SundayStatic"].map((name,i)=>({name,avatar:nwAvatarChoices[i%nwAvatarChoices.length]}));
let nwBattleSearchSerial=0, nwLastBattleProfile=-1, nwLastBattleRun=null;
function nwBattleProfileArt(profile,cls=''){return nwAvatarImg(profile.avatar,cls)}
function nwBattleSelectProfile(){
  const pool=nwBattleProfiles.map((_,i)=>i).filter(i=>i!==nwLastBattleProfile);
  const chosen=pool[Math.floor(Math.random()*pool.length)];
  nwLastBattleProfile=chosen;return nwBattleProfiles[chosen];
}
function nwBattleReveal(opponent,profile,previousWorld){
  const serial=++nwBattleSearchSerial;
  evSudokuLeave();applyTheme('hub');
  evDisplay(`${evHeader('BATTLE',()=>{++nwBattleSearchSerial;showBattle()})}<section class="nw-matchmaking"><div class="nw-match-kicker">MONTHLY BATTLE</div><h2 id="nwMatchTitle">SEARCHING FOR AN OPPONENT</h2><div class="nw-match-avatar-ring"><div id="nwMatchAvatar" class="nw-match-avatar">${nwBattleProfileArt(profile,'nw-match-avatar-image')}</div></div><strong id="nwMatchName">•••</strong><div id="nwMatchDots" class="nw-match-dots"><i></i><i></i><i></i></div><p id="nwMatchSub">Finding your match...</p><button type="button" id="nwMatchGo" class="nw-match-main" hidden>START MATCH</button><button type="button" id="nwMatchCancel" class="nw-match-cancel">CANCEL</button></section>`);
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
      go.onclick=()=>{if(serial!==nwBattleSearchSerial)return;evSudokuStart(opponent.difficulty,opponent)};
    }
  },105);
  evRoot.querySelector('#nwMatchCancel').onclick=()=>{++nwBattleSearchSerial;clearInterval(shuffleTimer);nwBattleReturn()};
}
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
  const difficulty=Object.keys(difficulties)[Math.floor(Math.random()*Object.keys(difficulties).length)];
  const available=nwBattlePracticeRuns.filter(r=>r.difficulty===difficulty && r.recording_id!==nwLastBattleRun);
  const opponent=available[Math.floor(Math.random()*available.length)];
  if(!opponent)return;
  nwLastBattleRun=opponent.recording_id;
  const profile=nwBattleSelectProfile();
  const previousWorld=currentWorld;
  nwBattleActive={opponent:{...opponent,display_name:profile.name,avatar:profile.avatar},worldBefore:previousWorld,profile};
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
function nwBattleFinish(s,won,points,elapsed){
  if(s.battleResultSaved)return;
  s.battleResultSaved=true;
  const opponent=s.practiceOpponent;
  const playerScore=won?points:0;
  // Battle is a finish-first race. Completing after the opponent is a loss;
  // continuing the puzzle after their finish never converts that result into a win.
  const outcome=won?(elapsed<opponent.elapsed_seconds?'WIN':elapsed===opponent.elapsed_seconds?'DRAW':'LOSS'):'LOSS';
  const history=nwBattlePracticeHistory();
  history.push({at:Date.now(),difficulty:s.difficulty,outcome,playerScore,opponentScore:opponent.points,seconds:elapsed,opponent:opponent.display_name});
  nwWrite(nwBattlePracticeKey,history.slice(-100));
  clearInterval(sudokuTimer);
  const verb=outcome==='WIN'?'YOU WON!':outcome==='DRAW'?'IT\'S A DRAW!':'OPPONENT WON!';
  evDisplay(`${evHeader('BATTLE',nwBattleReturn)}<section class="nw-battle nw-battle-ready nw-battle-finish"><div class="nw-battle-star">${outcome==='WIN'?'✦':'⚔'}</div><h2>${verb}</h2><div class="nw-battle-result-opponent">${nwAvatarImg(opponent.avatar,'nw-battle-result-avatar')}<strong>${nwEscape(opponent.display_name)}</strong></div><div class="nw-practice-scores"><div><small>YOU</small><strong>${playerScore.toLocaleString()}</strong><em>${won?elapsed+' sec':'Unfinished'}</em></div><div><small>OPPONENT</small><strong>${opponent.points.toLocaleString()}</strong><em>${opponent.elapsed_seconds} sec</em></div></div><div class="result-actions"><button class="theme-button" id="nwPracticeAgain">NEXT OPPONENT</button><button class="theme-button" id="nwPracticeBack">BATTLE MENU</button></div></section>`);
  evRoot.querySelector('#nwPracticeAgain').onclick=()=>nwBattleStart();
  evRoot.querySelector('#nwPracticeBack').onclick=nwBattleReturn;
}
function nwBattleProgressTick(s){
  if(!s||!s.practiceOpponent||s.battleResultSaved)return;
  const opp=s.practiceOpponent;
  const seconds=(Date.now()-s.start)/1000;
  // Estimated visual timeline. Old recordings include finish time and mistake
  // totals, but NOT actual per-move timing; this is not a literal input replay.
  const fraction=Math.max(0,Math.min(1,seconds/Math.max(1,opp.elapsed_seconds)));
  const eased=fraction<1?Math.max(0,Math.min(.99,fraction*0.91+.04*Math.sin(fraction*10)*Math.sin(Math.PI*fraction))):1;
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
  wrapper.innerHTML=`<div class="nw-battle-modal" role="dialog" aria-modal="true" aria-labelledby="nwLostHeading"><div class="nw-modal-glow">⚔</div><div class="nw-battle-result-opponent">${nwAvatarImg(s.practiceOpponent.avatar,'nw-battle-result-avatar')}<strong>${nwEscape(s.practiceOpponent.display_name)}</strong></div><h2 id="nwLostHeading">OPPONENT WON!</h2><p>They finished first. Want to finish your puzzle?</p><div class="nw-battle-modal-actions"><button class="nw-modal-secondary" id="nwEndMatch">END MATCH</button><button class="nw-modal-primary" id="nwContinuePuzzle">CONTINUE</button></div></div>`;
  evRoot.appendChild(wrapper);
  const cont=wrapper.querySelector('#nwContinuePuzzle');
  cont.onclick=()=>{wrapper.remove();const board=evRoot.querySelector('#evSudoBoard button');if(board)board.focus({preventScroll:true})};
  wrapper.querySelector('#nwEndMatch').onclick=()=>{wrapper.remove();s.done=true;nwBattleFinish(s,false,0,Math.floor((Date.now()-s.start)/1000))};
  cont.focus({preventScroll:true});
}
function showBattle(){
  evSudokuLeave();applyTheme('hub');
  const d=new Date(),month=d.toLocaleString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const all=nwBattlePracticeHistory(),wins=all.filter(x=>x.outcome==='WIN').length,draws=all.filter(x=>x.outcome==='DRAW').length;
  evDisplay(`${evHeader('BATTLE',showCategories)}<section class="nw-battle nw-battle-ready">
    <div class="nw-battle-star">⚔</div><h2>MONTHLY BATTLE</h2>
    <p class="nw-feature-subtitle">One-on-one Sudoku competition</p>
    <div class="nw-season-pill">${month.toUpperCase()}</div>
    <div class="nw-feature-block"><strong>READY TO FACE A CHALLENGER?</strong><p>One puzzle. Two players. First to finish wins.</p><button type="button" class="nw-battle-start-button" id="nwStartRandomBattle">START RANDOM BATTLE</button></div>
    <div class="nw-feature-block"><strong>YOUR BATTLE RECORD</strong><p>${wins} wins · ${all.length-wins-draws} losses · ${draws} draws · ${all.length?Math.round(wins/all.length*100):0}% win rate</p></div>

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
  sudokuTimer=setInterval(()=>{if(!sudoku||sudoku.done)return;const el=evRoot.querySelector('#evSudoTime');if(el){const time=Math.floor((Date.now()-sudoku.start)/1000);el.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}if(sudoku.practiceOpponent)nwBattleProgressTick(sudoku)},250);
}
// Preserve previous cell value AND pencil notes for undo, including hinted cells.
function nwRecordSudokuHistory(s,i){
  s.history.push({i,value:s.values[i],wrong:s.wrong.has(i),notes:[...(s.noteMarks[i]||[])],hintsLeft:s.hintsLeft});
}
function evSudokuRender(){
  const s=sudoku;if(!s)return;
  const pts=difficulties[s.difficulty].points;
  evDisplay(`${evHeader(s.practiceOpponent?'BATTLE':s.doublePractice?'DOUBLE TROUBLE TEST':worlds[currentWorld].name,s.practiceOpponent?nwBattleReturn:s.doublePractice?nwDoublePracticeScreen:evSudokuMenu)}${s.practiceOpponent?`<div class="nw-opponent-panel"><div class="nw-opponent-small-avatar">${nwAvatarImg(s.practiceOpponent.avatar,'nw-opponent-small-img')}</div><div class="nw-opponent-details"><div class="nw-opponent-top"><strong>${nwEscape(s.practiceOpponent.display_name)}</strong><span id="nwOpponentPct">0%</span></div><div class="nw-opponent-track" role="progressbar" aria-label="Opponent puzzle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="nwOpponentProgress"></div></div><div class="nw-opponent-errors">MISTAKES <span id="nwOpponentMistakes">0 / 3</span></div></div></div>`:''}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${(currentWorld==='cakefail'?cakefailImgs:currentWorld==='baggagehell'?baggagehellImgs:currentWorld==='donttakewater'?donttakewaterImgs:currentWorld==='balloonwrong'?balloonwrongImgs:currentWorld==='underthebed'?underthebedImgs:currentWorld==='unpreparedchristmas'?unpreparedchristmasImgs:currentWorld==='dontunwrap'?dontunwrapImgs:currentWorld==='solarsick'?solarsickImgs:currentWorld==='deepsea'?deepseaImgs:currentWorld==='bodyparts'?bodypartsImgs:currentWorld==='diner'?dinerImgs:currentWorld==='alien'?alienImgs:currentWorld==='ugly'?uglyImgs:currentWorld==='weird'?weirdImgs:currentWorld==='nineties'?ninetiesImgs:currentWorld==='olympus'?olympusImgs:currentWorld==='fairy'?fairyImgs:currentWorld==='christmas'?christmasImgs:currentWorld==='patissserie'?patissserieImgs:sudokuImgs).map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}">${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
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
