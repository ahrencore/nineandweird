const evRoot=document.getElementById('game');
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function evDisplay(html){document.getElementById("home").hidden=true;evRoot.hidden=false;evRoot.innerHTML=html;}
function evHeader(title,back){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=back;});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong>${title}</strong><span></span></header>`;}
const worlds={classic:{name:'CLASSIC',label:'Classic',theme:'classic'},dark:{name:'CLASSIC DARK',label:'Classic Dark',theme:'dark'},halloween:{name:'HALLOWEEN',label:'Halloween',theme:'halloween'},patissserie:{name:'PÂTISSERIE',label:'Pâtisserie',theme:'patissserie'},christmas:{name:'CHRISTMAS',label:'Christmas',theme:'christmas'},fairy:{name:'FAIRY WORLD',label:'Fairy World',theme:'fairy'},olympus:{name:'OLYMPUS',label:'Olympus',theme:'olympus'},nineties:{name:'90s THROWBACK',label:'90s Throwback',theme:'nineties'},weird:{name:'WHAT AM I LOOKING AT?',label:'What Am I Looking At?',theme:'weird'},ugly:{name:'UGLY LITTLE THINGS',label:'Ugly Little Things',theme:'ugly'},alien:{name:'ALIEN SUPERMARKET',label:'Alien Supermarket',theme:'alien'},diner:{name:'DO NOT EAT THAT',label:'Do Not Eat That',theme:'diner'},bodyparts:{name:'BODY PARTS DEPARTMENT',label:'Body Parts Department',theme:'bodyparts'},deepsea:{name:'DEEP SEA MISFITS',label:'Deep Sea Misfits',theme:'deepsea'}};
let currentWorld='halloween',roomPage=0,roomCollection='usual';
const difficulties={easy:{fill:.60,points:350,hints:1},medium:{fill:.50,points:650,hints:1},hard:{fill:.40,points:1000,hints:1},expert:{fill:.35,points:1350,hints:2},extreme:{fill:.30,points:1750,hints:3}};
function applyTheme(world){evRoot.className='ev-root theme-'+(world||'hub');}

const nwGroups={usual:['classic','dark','halloween','patissserie','christmas','fairy','olympus','nineties'],weird:['weird','ugly','alien','diner','bodyparts','deepsea']};
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
  nwScroll[roomCollection]={top:target.scrollTop||0,room:roomPage};
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
function showBattle(){clearInterval(sudokuTimer);sudoku=null;applyTheme('hub');evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>BATTLE</strong><span></span></header><section class="nw-battle"><div class="nw-battle-star">★</div><h2>YOUR TOTAL POINTS</h2><strong class="nw-battle-number">${nwPoints().toLocaleString()}</strong><p>Complete Sudoku puzzles to earn points in any room.</p><div class="nw-battle-soon"><strong>BATTLE MODE</strong><p>Competitive features and leaderboard coming later.</p></div><small>Local points only. Past scores cannot be recovered. Points begin accumulating after this update.</small></section>`);evRoot.querySelector('#toHome').onclick=showCategories}

function showCategories(){
  clearInterval(sudokuTimer);sudoku=null;applyTheme('hub');
  evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>CHOOSE YOUR SIDE</strong><span></span></header><section class="world-categories" aria-label="Room collections"><button class="world-category world-category-usual" data-collection="usual"><span class="world-category-art" aria-hidden="true">✦</span><strong>THE USUAL</strong><small>The worlds you know and love.</small><span class="world-category-action">EXPLORE</span></button><button class="world-category world-category-weird" data-collection="weird"><span class="world-category-art" aria-hidden="true">◉</span><strong>THE WEIRD</strong><small>Don't ask. Just play.</small><span class="world-category-action">ENTER</span></button><button class="world-category world-category-fav nw-category-wide" data-collection="fav"><span class="nw-category-icon" aria-hidden="true">♥</span><strong>FAV</strong><small>Your saved rooms</small></button><button class="world-category world-category-battle nw-category-wide" id="nwBattle"><span class="nw-category-icon" aria-hidden="true">★</span><strong>BATTLE</strong><small>View your points</small></button></section>`);
  evRoot.querySelector('#toHome').onclick=showHome;
  evRoot.querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>{roomCollection=b.dataset.collection;nwScroll[roomCollection]=0;nwRoomPages[roomCollection]=0;showRooms(0)});
  evRoot.querySelector('#nwBattle').onclick=showBattle;
}
function showRooms(page=nwRoomPages[roomCollection]||0){
  const ids=roomCollection==='fav'?nwFavs():nwGroups[roomCollection]||nwGroups.usual;
  const perPage=20,total=roomCollection==='fav'?ids.length:Math.max(20,ids.length),pages=Math.max(1,Math.ceil(total/perPage));
  page=Number.isFinite(page)?page:0;
  clearInterval(sudokuTimer);sudoku=null;applyTheme('hub');
  roomPage=Math.max(0,Math.min(page,pages-1));
  nwRoomPages[roomCollection]=roomPage;
  const files={halloween:['assets/events/',sudokuImgs],patissserie:['assets/patissserie/',patissserieImgs],christmas:['assets/christmas/',christmasImgs],fairy:['assets/fairy/',fairyImgs],olympus:['assets/olympus/',olympusImgs],nineties:['assets/90s/',ninetiesImgs],weird:['assets/weird/',weirdImgs],ugly:['assets/ugly/',uglyImgs],alien:['assets/alien/',alienImgs],diner:['assets/diner/',dinerImgs],bodyparts:['assets/bodyparts/',bodypartsImgs],deepsea:['assets/deepsea/',deepseaImgs]};
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
function showHome(){clearInterval(sudokuTimer);sudoku=null;evRoot.hidden=true;document.getElementById('home').hidden=false;}
const sudokuImgs=['01_Pink_Neon_Bat.png','02_Blue_Neon_Moon.png','03_Orange_Neon_Pumpkin.png','04_Green_Neon_Cat.png','05_White_Pink_Ghost.png','06_Red_Neon_Heart.png','07_Purple_Neon_Candy.png','08_Yellow_Neon_Star.png','09_Cyan_Neon_Cross.png'];
const patissserieImgs=['01_croissant.png','02_macaron.png','03_eclair.png','04_fruit_tart.png','05_cinnamon_roll.png','06_donut.png','07_madeleine.png','08_pretzel.png','09_cupcake.png'];
const christmasImgs=['01_santa_hat.png','02_christmas_tree.png','03_gold_star.png','04_snowflake.png','05_gingerbread.png','06_snowman.png','07_purple_gift.png','08_pink_candy_cane.png','09_orange_candle.png'];
const fairyImgs=['01_fairy.png','02_lantern.png','03_potion.png','04_crystal.png','05_mushroom.png','06_moon.png','07_blossom.png','08_butterfly.png','09_key.png'];
const olympusImgs=['01_zeus_lightning.png','02_poseidon_trident.png','03_hades_helmet.png','04_athena_owl.png','05_apollo_lyre.png','06_artemis_bow.png','07_aphrodite_shell.png','08_hermes_sandals.png','09_dionysus_grapes.png'];
const ninetiesImgs=['01_tamagotchi.png','02_handheld.png','03_smiley.png','04_lava_lamp.png','05_roller_skate.png','06_slime.png','07_boombox.png','08_cd.png','09_floppy_disk.png'];
const dinerImgs=['01_eyeball_pudding.png','02_screaming_sandwich.png','03_tooth_candy.png','04_finger_spaghetti.png','05_brain_jelly.png','06_worm_apple.png','07_moldy_cupcake.png','08_bloody_popsicle.png','09_cursed_fried_egg.png'];
const bodypartsImgs=['01_eyeball_tray.png','02_zipper_heart.png','03_ear_display.png','04_brain_jar.png','05_chattering_teeth.png','06_bony_hand.png','07_ribbon_lungs.png','08_nose_perfume.png','09_spine_hanger.png'];
const deepseaImgs=['01_anglerfish.png','02_blobfish.png','03_vampire_squid.png','04_sea_bunny.png','05_dumbo_octopus.png','06_leafy_sea_dragon.png','07_nudibranch.png','08_giant_isopod.png','09_jellyfish.png'];
const alienImgs=['01_canned_moonlight.png','02_radioactive_milk.png','03_eyeball_cereal.png','04_bottled_screams.png','05_plasma_chips.png','06_alien_noodles.png','07_ufo_juice.png','08_meteor_popcorn.png','09_saturn_snack_cup.png'];
const uglyImgs=['01_gloop.png','02_chomps.png','03_noodle.png','04_blink.png','05_grumble.png','06_pinky.png','07_wobbles.png','08_stinky.png','09_crumbs.png'];
const weirdImgs=['01_eyeball.png','02_telephone.png','03_melting_clock.png','04_cloud_legs.png','05_door.png','06_eye_hand.png','07_fish_bulb.png','08_winged_key.png','09_moon_face.png'];
const sudokuSrc=n=>currentWorld==='deepsea'?'assets/deepsea/'+deepseaImgs[n-1]:currentWorld==='bodyparts'?'assets/bodyparts/'+bodypartsImgs[n-1]:currentWorld==='diner'?'assets/diner/'+dinerImgs[n-1]:currentWorld==='alien'?'assets/alien/'+alienImgs[n-1]:currentWorld==='ugly'?'assets/ugly/'+uglyImgs[n-1]:currentWorld==='weird'?'assets/weird/'+weirdImgs[n-1]:currentWorld==='nineties'?'assets/90s/'+ninetiesImgs[n-1]:currentWorld==='olympus'?'assets/olympus/'+olympusImgs[n-1]:currentWorld==='fairy'?'assets/fairy/'+fairyImgs[n-1]:currentWorld==='christmas'?'assets/christmas/'+christmasImgs[n-1]:currentWorld==='patissserie'?'assets/patissserie/'+patissserieImgs[n-1]:'assets/events/'+sudokuImgs[n-1];
let sudoku=null, sudokuTimer=null;
function evSudokuMenu(){clearInterval(sudokuTimer);applyTheme(worlds[currentWorld].theme);evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="difficulty-panel"><button type="button" class="nw-fav-toggle" id="nwFavToggle" aria-pressed="${nwIsFav(currentWorld)}">${nwIsFav(currentWorld)?'♥ FAVOURITED':'♡ ADD TO FAV'}</button><h2>CHOOSE DIFFICULTY</h2><div class="difficulty-list">${Object.keys(difficulties).map(d=>`<button class="theme-button" data-difficulty="${d}">${d.toUpperCase()}</button>`).join('')}</div></section>`);evRoot.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>evSudokuStart(b.dataset.difficulty));evRoot.querySelector('#nwFavToggle').onclick=()=>{const v=nwToggleFav(currentWorld),b=evRoot.querySelector('#nwFavToggle');b.textContent=v?'♥ FAVOURITED':'♡ ADD TO FAV';b.setAttribute('aria-pressed',String(v));};}
function shuffled(v){const x=[...v];for(let i=x.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[x[k],x[i]]=[x[i],x[k]]}return x}
function makeSudokuSolution(){const nums=shuffled([1,2,3,4,5,6,7,8,9]);const rOrder=shuffled([0,1,2]).flatMap(b=>shuffled([0,1,2]).map(n=>b*3+n));const cOrder=shuffled([0,1,2]).flatMap(b=>shuffled([0,1,2]).map(n=>b*3+n));return Array.from({length:81},(_,i)=>nums[(rOrder[Math.floor(i/9)]*3+Math.floor(rOrder[Math.floor(i/9)]/3)+cOrder[i%9])%9])}
// Solve the server-issued puzzle locally for existing correct-placement and hint UI.
// The server never sends its completed solution to the client.
function gbSolveSudokuPuzzle(puzzle){
  const a=[...puzzle].map(Number);if(a.length!==81)return null;
  const candidates=(i)=>{const row=Math.floor(i/9),col=i%9,used=new Set();
    for(let k=0;k<9;k++){used.add(a[row*9+k]);used.add(a[k*9+col]);}
    const r0=Math.floor(row/3)*3,c0=Math.floor(col/3)*3;
    for(let r=r0;r<r0+3;r++)for(let c=c0;c<c0+3;c++)used.add(a[r*9+c]);
    return [1,2,3,4,5,6,7,8,9].filter(n=>!used.has(n));};
  function recurse(){let best=-1,opts=null;
    for(let i=0;i<81;i++)if(!a[i]){const cur=candidates(i);if(!cur.length)return false;
      if(!opts||cur.length<opts.length){best=i;opts=cur;if(cur.length===1)break;}}
    if(best<0)return true;
    for(const n of opts){a[best]=n;if(recurse())return true;}a[best]=0;return false;
  }
  return recurse()?a:null;
}
async function evSudokuStart(difficulty){
  applyTheme(worlds[currentWorld].theme);
  const answer=makeSudokuSolution();
  const percent=difficulties[difficulty].fill;
  const count=Math.round(81*percent);
  const givensLocal=new Set(shuffled(Array.from({length:81},(_,i)=>i)).slice(0,count));
  const puzzle=answer.map((n,i)=>givensLocal.has(i)?n:0);
  const sessionId=null;
  const givens=new Set(puzzle.map((n,i)=>n?i:-1).filter(i=>i>=0));
  sudoku={answer,values:[...puzzle],verifiedSessionId:sessionId,givens,selected:-1,choice:0,highlight:0,mistakes:0,wrong:new Set(),notes:false,noteMarks:{},history:[],hintsLeft:difficulties[difficulty].hints,start:Date.now(),difficulty,done:false};
  evSudokuRender();clearInterval(sudokuTimer);
  sudokuTimer=setInterval(()=>{if(!sudoku||sudoku.done)return;const el=evRoot.querySelector('#evSudoTime');if(el){const time=Math.floor((Date.now()-sudoku.start)/1000);el.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}},1000);
}
function evSudokuRender(){
  const s=sudoku;if(!s)return;
  const pts=difficulties[s.difficulty].points;
  evDisplay(`${evHeader(worlds[currentWorld].name,evSudokuMenu)}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${(currentWorld==='deepsea'?deepseaImgs:currentWorld==='bodyparts'?bodypartsImgs:currentWorld==='diner'?dinerImgs:currentWorld==='alien'?alienImgs:currentWorld==='ugly'?uglyImgs:currentWorld==='weird'?weirdImgs:currentWorld==='nineties'?ninetiesImgs:currentWorld==='olympus'?olympusImgs:currentWorld==='fairy'?fairyImgs:currentWorld==='christmas'?christmasImgs:currentWorld==='patissserie'?patissserieImgs:sudokuImgs).map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}">${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
  // Safari-safe Sudoku sizing: content must never determine an empty row's height.
  // Match the rendered grid's border-box height to its actual width.
  evSudokuKeepBoardSquare();
  evRoot.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;s.selected=i;if(s.values[i])s.highlight=s.values[i];evSudokuPaint()});
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>{const n=+b.dataset.symbol;if(evSudokuRemaining(n)===0)return;s.choice=n;s.highlight=n;if(s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]&&!s.done){if(s.notes){const i=s.selected;if(!s.values[i]){const marks=s.noteMarks[i]||[];s.noteMarks[i]=marks.includes(n)?marks.filter(x=>x!==n):[...marks,n];}evSudokuPaint()}else evSudokuPlace(n)}else evSudokuPaint()});
  evRoot.querySelector('#evSudoNotes').onclick=()=>{s.notes=!s.notes;evRoot.querySelector('#evSudoNotes').classList.toggle('active',s.notes);evRoot.querySelector('#evSudoNotes').setAttribute('aria-pressed',String(s.notes));};
  evRoot.querySelector('#evSudoErase').onclick=()=>{if(s.selected<0||s.givens.has(s.selected)||s.values[s.selected]===s.answer[s.selected]||s.done)return;s.history.push([s.selected,s.values[s.selected],s.wrong.has(s.selected)]);s.values[s.selected]=0;s.wrong.delete(s.selected);evSudokuPaint()};
  evRoot.querySelector('#evSudoUndo').onclick=()=>{if(s.done)return;let prev;while(s.history.length){const candidate=s.history.pop();if(s.values[candidate[0]]!==s.answer[candidate[0]]){prev=candidate;break}}if(prev){s.values[prev[0]]=prev[1];if(prev[2])s.wrong.add(prev[0]);else s.wrong.delete(prev[0]);s.selected=prev[0];evSudokuPaint()}};
  evRoot.querySelector('#evSudoHint').onclick=()=>{if(s.done||s.hintsLeft<=0)return;const i=s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]?s.selected:s.values.findIndex((n,i)=>n!==s.answer[i]&&!s.givens.has(i));if(i>=0){s.hintsLeft--;s.values[i]=s.answer[i];s.wrong.delete(i);s.selected=i;evSudokuPaint();evSudokuCheck()}};
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
  s.history.push([i,s.values[i],s.wrong.has(i)]);s.values[i]=n;
  if(n!==s.answer[i]){
    s.mistakes++;s.wrong.add(i);evSudokuPaint();
    if(s.mistakes>=3){s.done=true;clearInterval(sudokuTimer);setTimeout(()=>evSudokuEnd(false),420)}
    return;
  }
  s.wrong.delete(i);evSudokuPaint();evSudokuCheck();
}
function sudokuSymbol(n){return (currentWorld==='halloween'||currentWorld==='patissserie'||currentWorld==='christmas'||currentWorld==='fairy'||currentWorld==='olympus'||currentWorld==='nineties'||currentWorld==='weird'||currentWorld==='ugly'||currentWorld==='alien'||currentWorld==='diner'||currentWorld==='bodyparts'||currentWorld==='deepsea')?`<img src="${sudokuSrc(n)}" alt="${n}">`:`<span class="number-symbol">${n}</span>`;}
function evSudokuEnd(won){const s=sudoku;if(!s)return;applyTheme(worlds[currentWorld].theme);const elapsed=Math.floor((Date.now()-s.start)/1000);const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;const pts=won?difficulties[s.difficulty].points+([100,70,30][s.mistakes]||0):0;if(won&&!s.pointsCredited){nwAwardPoints(pts);s.pointsCredited=true;}evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="result-panel"><div class="result-mark">${won?'✦':'×'}</div><h2>${won?'Puzzle Completed!':'Puzzle Not Completed'}</h2>${won?`<div class="result-score"><small>TOTAL POINTS</small><strong>${pts.toLocaleString()}</strong></div>`:'<p>Three mistakes. Try again!</p>'}<div class="result-stats"><div>DIFFICULTY<strong>${s.difficulty.toUpperCase()}</strong></div><div>TIME<strong>${duration}</strong></div><div>MISTAKES<strong>${s.mistakes} / 3</strong></div></div><div class="result-actions"><button class="theme-button" id="evSudoAgain">${won?'PLAY AGAIN':'RETRY'}</button><button class="theme-button" id="evSudoBack">BACK TO ROOMS</button></div></section>`);evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);evRoot.querySelector('#evSudoBack').onclick=()=>showRooms();}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true);
}

document.getElementById("start").onclick=showCategories;
