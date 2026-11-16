const evRoot=document.getElementById('game');
function evDisplay(html){document.getElementById("home").hidden=true;evRoot.hidden=false;evRoot.innerHTML=html;}
function evHeader(title,back){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=()=>back();});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong>${title}</strong><span></span></header>`;}
const worlds={classic:{name:'CLASSIC',label:'Classic',theme:'classic'},dark:{name:'CLASSIC DARK',label:'Classic Dark',theme:'dark'},halloween:{name:'HALLOWEEN',label:'Halloween',theme:'halloween'},patissserie:{name:'PÂTISSERIE',label:'Pâtisserie',theme:'patissserie'},christmas:{name:'CHRISTMAS',label:'Christmas',theme:'christmas'},fairy:{name:'FAIRY WORLD',label:'Fairy World',theme:'fairy'},olympus:{name:'OLYMPUS',label:'Olympus',theme:'olympus'},nineties:{name:'90s THROWBACK',label:'90s Throwback',theme:'nineties'},weird:{name:'WHAT AM I LOOKING AT?',label:'What Am I Looking At?',theme:'weird'},ugly:{name:'UGLY LITTLE THINGS',label:'Ugly Little Things',theme:'ugly'},alien:{name:'ALIEN SUPERMARKET',label:'Alien Supermarket',theme:'alien'},diner:{name:'DO NOT EAT THAT',label:'Do Not Eat That',theme:'diner'},bodyparts:{name:'BODY PARTS DEPARTMENT',label:'Body Parts Department',theme:'bodyparts'},deepsea:{name:'DEEP SEA MISFITS',label:'Deep Sea Misfits',theme:'deepsea'},solarsick:{name:'THE SOLAR SYSTEM IS SICK',label:'The Solar System Is Sick',theme:'solarsick'},dontunwrap:{name:"PLEASE DON'T UNWRAP THAT",label:"Please Don't Unwrap That",theme:'dontunwrap'},unpreparedchristmas:{name:'UNPREPARED CHRISTMAS',label:'Unprepared Christmas',theme:'unpreparedchristmas'},underthebed:{name:'SOMETHING UNDER THE BED',label:'Something Under the Bed',theme:'underthebed'},balloonwrong:{name:'BALLOON ANIMALS GONE WRONG',label:'Balloon Animals Gone Wrong',theme:'balloonwrong'},donttakewater:{name:'DO NOT TAKE WITH WATER',label:'Do Not Take With Water',theme:'donttakewater'},baggagehell:{name:'BAGGAGE CLAIM FROM HELL',label:'Baggage Claim from Hell',theme:'baggagehell'},cakefail:{name:'CAKE DECORATING WAS A MISTAKE',label:'Cake Decorating Was a Mistake',theme:'cakefail'}};
let currentWorld='halloween',roomPage=0,roomCollection='usual';
const difficulties={easy:{fill:.60,points:350,hints:1},medium:{fill:.50,points:650,hints:1},hard:{fill:.40,points:1000,hints:1},expert:{fill:.35,points:1350,hints:2},extreme:{fill:.30,points:1750,hints:3}};
function applyTheme(world){evRoot.className='ev-root theme-'+(world||'hub');}

const nwGroups={usual:['classic','dark','halloween','patissserie','christmas','fairy','olympus','nineties'],weird:['weird','ugly','alien','diner','bodyparts','deepsea','solarsick','dontunwrap','unpreparedchristmas','underthebed','balloonwrong','donttakewater','baggagehell','cakefail']};
const nwFavKey='nineweird-favourites-v1',nwPointsKey='nineweird-points-v1';
const nwScroll={usual:0,weird:0,fav:0};
const nwRoomPages={usual:0,weird:0,fav:0};
function nwRead(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}}
function nwWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function nwFavs(){const a=nwRead(nwFavKey,[]);return Array.isArray(a)?a.filter((id,i)=>worlds[id]&&a.indexOf(id)===i):[]}
function nwIsFav(id){return nwFavs().includes(id)}
function nwToggleFav(id){const a=nwFavs(),b=a.includes(id)?a.filter(x=>x!==id):[...a,id];nwWrite(nwFavKey,b);return b.includes(id)}
function nwPoints(){const n=Number(nwRead(nwPointsKey,0));return Number.isFinite(n)&&n>0?Math.floor(n):0}
function nwAwardPoints(n){nwWrite(nwPointsKey,nwPoints()+n)}
// Local-first player profile & weekly puzzle performance. Cloud sync is NOT enabled yet.
const nwProfileKey='nineweird-profile-v1', nwResultsKey='nineweird-results-v1';
const nwAvatarChoices=['🦇','🍰','🪐','👁️','🧁','🐙','👾','🎀','🎃','⭐','🍄','🧠'];
function nwEscape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function nwProfile(){const p=nwRead(nwProfileKey,{});return {name:typeof p.name==='string'?p.name:'Guest Player',avatar:nwAvatarChoices.includes(p.avatar)?p.avatar:'🦇'}}
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
  const u=window.nwCloud?.user();const p=nwProfile();const recovery=!!window.nwCloud?.isRecovering?.();
  evDisplay(`${evHeader('PLAYER PROFILE',showCategories)}<section class="nw-new-panel"><div class="nw-profile-avatar">${p.avatar}</div><h2>${nwEscape(p.name)}</h2><p class="nw-muted" id="nwAccountStatus">${u?'Signed in: '+nwEscape(u.email||'account'):'Guest profile · Saved on this device'}</p><label class="nw-new-label" for="nwName">DISPLAY NAME</label><input id="nwName" maxlength="24" value="${nwEscape(p.name)}" autocomplete="nickname"><label class="nw-new-label">CHOOSE AN AVATAR</label><div class="nw-avatar-grid">${nwAvatarChoices.map(a=>`<button class="nw-avatar-choice ${a===p.avatar?'chosen':''}" data-avatar="${a}" aria-label="Choose ${a} avatar">${a}</button>`).join('')}</div><button class="nw-action" id="nwSaveProfile">SAVE PROFILE</button><div class="nw-auth-message"><strong>${u?'YOUR ACCOUNT':'SIGN IN OR REGISTER'}</strong><p id="nwAuthNotice">${u?'Profile changes save to your account. Puzzle results and favorites still remain local during this first authentication stage.':'Email sign-in enables your online account. Existing guest puzzle progress stays on this device for now.'}</p>${u?`${recovery?`<label class="nw-new-label" for="nwNewPassword">NEW PASSWORD</label><input id="nwNewPassword" type="password" minlength="6" placeholder="New password (6+ characters)"><button class="nw-action" id="nwSetPassword">SET NEW PASSWORD</button>`:''}<button class="nw-action" id="nwSignOut">SIGN OUT</button>`:`<label class="nw-new-label" for="nwEmail">EMAIL</label><input id="nwEmail" type="email" autocomplete="email" placeholder="you@example.com"><label class="nw-new-label" for="nwPassword">PASSWORD</label><input id="nwPassword" type="password" autocomplete="current-password" minlength="6" placeholder="Password (6+ characters)"><div class="nw-auth-actions"><button class="nw-action" id="nwSignIn">SIGN IN</button><button class="nw-action" id="nwRegister">REGISTER</button><button class="nw-action" id="nwReset">RESET PASSWORD</button></div>`}</div></section>`);
  let avatar=p.avatar;
  evRoot.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{avatar=b.dataset.avatar;evRoot.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('chosen',x===b))});
  const notice=(s)=>{const el=evRoot.querySelector('#nwAuthNotice');if(el)el.textContent=s};
  const save=evRoot.querySelector('#nwSaveProfile');
  save.onclick=async()=>{
    const name=evRoot.querySelector('#nwName').value.trim().slice(0,24)||'Guest Player';
    save.disabled=true;
    try{
      if(window.nwCloud?.user())await nwCloud.saveProfile(name,avatar);
      nwWrite(nwProfileKey,{name,avatar});nwShowProfile();
    }catch(e){notice('Could not save profile: '+e.message);save.disabled=false;}
  };
  if(u){
    if(recovery){evRoot.querySelector('#nwSetPassword').onclick=async()=>{try{const password=evRoot.querySelector('#nwNewPassword').value;if(password.length<6)throw new Error('Use at least 6 characters.');await nwCloud.finishRecovery(password);nwShowProfile()}catch(e){notice(e.message)}}}
    evRoot.querySelector('#nwSignOut').onclick=async()=>{
      try{await nwCloud.signOut();nwShowProfile()}catch(e){notice(e.message)}
    };
  }else{
    const credentials=()=>{
      const email=evRoot.querySelector('#nwEmail').value.trim(),password=evRoot.querySelector('#nwPassword').value;
      if(!email||!email.includes('@'))throw new Error('Enter a valid email address.');
      return {email,password};
    };
    const action=async(fn)=>{
      const buttons=Array.from(evRoot.querySelectorAll('.nw-auth-actions button'));
      buttons.forEach(b=>b.disabled=true);
      try{await fn();}catch(e){notice(e.message)}finally{buttons.forEach(b=>b.disabled=false)}
    };
    evRoot.querySelector('#nwSignIn').onclick=()=>action(async()=>{
      const {email,password}=credentials();if(!password)throw new Error('Enter your password.');
      await nwCloud.signIn(email,password);await nwLoadCloudProfile();nwShowProfile();
    });
    evRoot.querySelector('#nwRegister').onclick=()=>action(async()=>{
      const {email,password}=credentials();if(password.length<6)throw new Error('Use at least 6 characters for your password.');
      const result=await nwCloud.signUp(email,password);
      if(result?.session){await nwLoadCloudProfile();nwShowProfile()}
      else notice('Registration requested. Check your email for a confirmation link, then return here and sign in.');
    });
    evRoot.querySelector('#nwReset').onclick=()=>action(async()=>{
      const {email}=credentials();await nwCloud.resetPassword(email);
      notice('If this email is registered, a password recovery message will be sent.');
    });
  }
}
async function nwLoadCloudProfile(){
  if(!window.nwCloud?.user())return;
  try{const data=await nwCloud.readProfile();if(data){
    const avatar=nwAvatarChoices.includes(data.avatar)?data.avatar:'🦇';
    nwWrite(nwProfileKey,{name:data.display_name||'Guest Player',avatar});
  }}catch(e){console.warn('Could not load Nine & Weird profile',e.message)}
}
if(window.nwCloud){nwCloud.onChange(()=>{
  if(nwCloud.user())nwLoadCloudProfile().then(()=>{
    if(document.getElementById('nwAccountStatus'))nwShowProfile();
  });
});}

function nwShowTrophy(tab='brain',offset=0){
  evSudokuLeave();applyTheme('hub');const r=nwWeeklyReport(offset),prior=nwWeeklyReport(offset-1),p=nwProfile();
  const weekTitle=new Date(r.start).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const brain=()=>`<div class="nw-report-head"><strong>${r.brain===null?'—':r.brain} / 1000</strong><span>Brain Power · playful game score, not IQ</span></div><div class="nw-report-grid"><article><small>ACCURACY</small><strong>${r.accuracy==null?'—':r.accuracy+'%'}</strong><em>Correct placements / attempts</em><span>${nwReportDelta(r.accuracy,prior.accuracy,' pts')} vs prior week</span></article><article><small>SPEED</small><strong>${nwFormatTime(r.adjusted)}</strong><em>Average difficulty-adjusted time</em><span>${r.adjusted!=null&&prior.adjusted!=null?nwFormatTime(Math.abs(r.adjusted-prior.adjusted))+(r.adjusted<=prior.adjusted?' faster':' slower'):'—'} vs prior week</span></article><article><small>CONSISTENCY</small><strong>${r.consistency==null?'—':r.consistency+'%'}</strong><em>${r.wins.length}/${r.rows.length} puzzles completed</em><span>${nwReportDelta(r.consistency,prior.consistency,' pts')} vs prior week</span></article><article><small>IMPROVEMENT</small><strong>${nwReportDelta(r.brain,prior.brain)}</strong><em>Change in overall Brain Power</em><span>Compare weeks using arrows below</span></article></div><div class="nw-report-difficulty"><h3>DIFFICULTY PERFORMANCE</h3>${Object.entries(r.difficulty).map(([d,v])=>`<div class="nw-difficulty-line"><span>${d.toUpperCase()}</span><strong>${v.won} / ${v.played} completed</strong><div class="nw-difficulty-track"><i style="width:${v.played?(v.won/v.played*100):0}%"></i></div></div>`).join('')}</div><p class="nw-muted">${r.rows.length?'Based on recorded puzzles this week. Hints are included in activity but not counted as manual correct placements.':'No recorded puzzles in this week yet. Play a puzzle to start your report.'}</p>`;
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
function showBattle(){evSudokuLeave();applyTheme('hub');evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>BATTLE</strong><span></span></header><section class="nw-battle"><div class="nw-battle-star">★</div><h2>YOUR TOTAL POINTS</h2><strong class="nw-battle-number">${nwPoints().toLocaleString()}</strong><p>Complete Sudoku puzzles to earn points in any room.</p><div class="nw-battle-soon"><strong>BATTLE MODE</strong><p>Competitive features and leaderboard coming later.</p></div><small>Local points only. Past scores cannot be recovered. Points begin accumulating after this update.</small></section>`);evRoot.querySelector('#toHome').onclick=showCategories}

function showCategories(){
  evSudokuLeave();applyTheme('hub');
  evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>CHOOSE YOUR SIDE</strong><span></span></header><section class="world-categories" aria-label="Room collections"><div class="nw-profile-entry"><button id="nwProfileButton" class="nw-profile-button" aria-label="Open player profile"><span>${nwProfile().avatar}</span></button><div>${nwEscape(nwProfile().name)}</div><small>TAP TO EDIT PROFILE / SIGN IN</small></div><button class="world-category world-category-usual" data-collection="usual"><span class="world-category-art" aria-hidden="true">✦</span><strong>THE USUAL</strong><small>The worlds you know and love.</small><span class="world-category-action">EXPLORE</span></button><button class="world-category world-category-weird" data-collection="weird"><span class="world-category-art" aria-hidden="true">◉</span><strong>THE WEIRD</strong><small>Don't ask. Just play.</small><span class="world-category-action">ENTER</span></button><button class="world-category world-category-fav nw-category-wide" data-collection="fav"><span class="nw-category-icon" aria-hidden="true">♥</span><strong>FAV</strong><small>Your saved rooms</small></button><button class="world-category world-category-battle nw-category-wide" id="nwBattle"><span class="nw-category-icon" aria-hidden="true">★</span><strong>BATTLE</strong><small>View your points</small></button><button class="world-category nw-category-wide nw-trophy-tile" id="nwTrophy"><span class="nw-category-icon" aria-hidden="true">🏆</span><strong>TROPHY CASE</strong><small>Titles and weekly brain reports</small></button></section>`);
  evRoot.querySelector('#toHome').onclick=showHome;
  evRoot.querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>{roomCollection=b.dataset.collection;nwScroll[roomCollection]=0;nwRoomPages[roomCollection]=0;showRooms(0)});
  evRoot.querySelector('#nwBattle').onclick=showBattle;evRoot.querySelector('#nwTrophy').onclick=()=>nwShowTrophy();evRoot.querySelector('#nwProfileButton').onclick=nwShowProfile;
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
function evSudokuLeave(){if(sudoku&&!sudoku.done&&sudoku.start)nwSaveResult(sudoku,false);evSudokuCancelLoss();clearInterval(sudokuTimer);sudoku=null;}
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
async function evSudokuStart(difficulty){
  evSudokuLeave();
  applyTheme(worlds[currentWorld].theme);
  const {answer,puzzle}=nwMakeUniquePuzzle(difficulty);
  const givens=new Set(puzzle.map((n,i)=>n?i:-1).filter(i=>i>=0));
  sudoku={answer,values:[...puzzle],givens,selected:-1,choice:0,highlight:0,mistakes:0,wrong:new Set(),notes:false,noteMarks:{},history:[],hintsLeft:difficulties[difficulty].hints,start:Date.now(),difficulty,done:false,reportAttempts:0,reportCorrect:0,reportHints:0,reportSaved:false};
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
  evDisplay(`${evHeader(worlds[currentWorld].name,evSudokuMenu)}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${(currentWorld==='cakefail'?cakefailImgs:currentWorld==='baggagehell'?baggagehellImgs:currentWorld==='donttakewater'?donttakewaterImgs:currentWorld==='balloonwrong'?balloonwrongImgs:currentWorld==='underthebed'?underthebedImgs:currentWorld==='unpreparedchristmas'?unpreparedchristmasImgs:currentWorld==='dontunwrap'?dontunwrapImgs:currentWorld==='solarsick'?solarsickImgs:currentWorld==='deepsea'?deepseaImgs:currentWorld==='bodyparts'?bodypartsImgs:currentWorld==='diner'?dinerImgs:currentWorld==='alien'?alienImgs:currentWorld==='ugly'?uglyImgs:currentWorld==='weird'?weirdImgs:currentWorld==='nineties'?ninetiesImgs:currentWorld==='olympus'?olympusImgs:currentWorld==='fairy'?fairyImgs:currentWorld==='christmas'?christmasImgs:currentWorld==='patissserie'?patissserieImgs:sudokuImgs).map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}">${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
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
function evSudokuEnd(won){const s=sudoku;if(!s)return;nwSaveResult(s,won);applyTheme(worlds[currentWorld].theme);const elapsed=Math.floor((Date.now()-s.start)/1000);const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;const pts=won?difficulties[s.difficulty].points+([100,70,30][s.mistakes]||0):0;if(won&&!s.pointsCredited){nwAwardPoints(pts);s.pointsCredited=true;}evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="result-panel"><div class="result-mark">${won?'✦':'×'}</div><h2>${won?'Puzzle Completed!':'Puzzle Not Completed'}</h2>${won?`<div class="result-score"><small>TOTAL POINTS</small><strong>${pts.toLocaleString()}</strong></div>`:'<p>Three mistakes. Try again!</p>'}<div class="result-stats"><div>DIFFICULTY<strong>${s.difficulty.toUpperCase()}</strong></div><div>TIME<strong>${duration}</strong></div><div>MISTAKES<strong>${s.mistakes} / 3</strong></div></div><div class="result-actions"><button class="theme-button" id="evSudoAgain">${won?'PLAY AGAIN':'RETRY'}</button><button class="theme-button" id="evSudoBack">BACK TO ROOMS</button></div></section>`);evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);evRoot.querySelector('#evSudoBack').onclick=()=>showRooms();}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true);
}

document.getElementById("start").onclick=showCategories;
