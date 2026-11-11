const evRoot=document.getElementById('game');
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function evDisplay(html){document.getElementById("home").hidden=true;evRoot.hidden=false;evRoot.innerHTML=html;}
function evHeader(title,back){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=back;});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong>${title}</strong><span></span></header>`;}
const worlds={classic:{name:'CLASSIC',label:'Classic',theme:'classic'},dark:{name:'CLASSIC DARK',label:'Classic Dark',theme:'dark'},halloween:{name:'HALLOWEEN',label:'Halloween',theme:'halloween'}};
let currentWorld='halloween',roomPage=0;
const difficulties={easy:{fill:.60,points:350,hints:1},medium:{fill:.50,points:650,hints:1},hard:{fill:.40,points:1000,hints:1},expert:{fill:.35,points:1350,hints:2},extreme:{fill:.30,points:1750,hints:3}};
function applyTheme(world){evRoot.className='ev-root theme-'+(world||'hub');}
function showRooms(page=0){page=Number.isFinite(page)?page:0;clearInterval(sudokuTimer);sudoku=null;applyTheme('hub');roomPage=Math.max(0,Math.min(page,Math.ceil(24/18)-1));let tiles='';for(let i=roomPage*18;i<Math.min((roomPage+1)*18,24);i++){const id=['classic','dark','halloween'][i];if(id){const w=worlds[id];const samples=id==='halloween'?sudokuImgs.slice(0,4).map(x=>`<img src="assets/events/${x}" alt="">`).join(''):'<span>1 2 3 4</span>';tiles+=`<button class="world-tile world-${id}" data-world="${id}"><strong>${w.name}</strong><div class="world-samples">${samples}</div></button>`}else tiles+='<div class="world-tile world-locked" aria-label="Locked world"><span aria-hidden="true">♙</span><small>LOCKED</small></div>'}evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>CHOOSE A WORLD</strong><span></span></header><div class="world-grid">${tiles}</div><nav class="world-pagination"><button id="prevWorldPage" ${roomPage===0?'disabled':''} aria-label="Previous page">‹</button><span>PAGE ${roomPage+1} / ${Math.ceil(24/18)}</span><button id="nextWorldPage" ${roomPage===Math.ceil(24/18)-1?'disabled':''} aria-label="Next page">›</button></nav>`);evRoot.querySelector('#toHome').onclick=showHome;evRoot.querySelector('#prevWorldPage').onclick=()=>showRooms(roomPage-1);evRoot.querySelector('#nextWorldPage').onclick=()=>showRooms(roomPage+1);evRoot.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{currentWorld=b.dataset.world;evSudokuMenu()})}
function showHome(){clearInterval(sudokuTimer);sudoku=null;evRoot.hidden=true;document.getElementById('home').hidden=false;}
const sudokuImgs=['01_Pink_Neon_Bat.png','02_Blue_Neon_Moon.png','03_Orange_Neon_Pumpkin.png','04_Green_Neon_Cat.png','05_White_Pink_Ghost.png','06_Red_Neon_Heart.png','07_Purple_Neon_Candy.png','08_Yellow_Neon_Star.png','09_Cyan_Neon_Cross.png'];
const sudokuSrc=n=>'assets/events/'+sudokuImgs[n-1];
let sudoku=null, sudokuTimer=null;
function evSudokuMenu(){clearInterval(sudokuTimer);applyTheme(worlds[currentWorld].theme);evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="difficulty-panel"><h2>CHOOSE DIFFICULTY</h2><div class="difficulty-list">${Object.keys(difficulties).map(d=>`<button class="theme-button" data-difficulty="${d}">${d.toUpperCase()}</button>`).join('')}</div></section>`);evRoot.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>evSudokuStart(b.dataset.difficulty));}
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
  evDisplay(`${evHeader(worlds[currentWorld].name,evSudokuMenu)}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?sudokuSymbol(n):''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${sudokuImgs.map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}">${sudokuSymbol(i+1)}<small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
  // Safari-safe Sudoku sizing: content must never determine an empty row's height.
  // Match the rendered grid's border-box height to its actual width.
  evSudokuKeepBoardSquare();
  evRoot.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;s.selected=i;if(s.values[i])s.highlight=s.values[i];evSudokuPaint()});
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>{const n=+b.dataset.symbol;if(evSudokuRemaining(n)===0){s.choice=n;s.highlight=n;evSudokuPaint();return;}s.choice=n;s.highlight=n;if(s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]&&!s.done){if(s.notes){const i=s.selected;if(!s.values[i]){const marks=s.noteMarks[i]||[];s.noteMarks[i]=marks.includes(n)?marks.filter(x=>x!==n):[...marks,n];}evSudokuPaint()}else evSudokuPlace(n)}else evSudokuPaint()});
  evRoot.querySelector('#evSudoNotes').onclick=()=>{s.notes=!s.notes;evRoot.querySelector('#evSudoNotes').classList.toggle('active',s.notes);evRoot.querySelector('#evSudoNotes').setAttribute('aria-pressed',String(s.notes));};
  evRoot.querySelector('#evSudoErase').onclick=()=>{if(s.selected<0||s.givens.has(s.selected)||s.values[s.selected]===s.answer[s.selected]||s.done)return;s.history.push([s.selected,s.values[s.selected],s.wrong.has(s.selected)]);s.values[s.selected]=0;s.wrong.delete(s.selected);evSudokuPaint()};
  evRoot.querySelector('#evSudoUndo').onclick=()=>{if(s.done)return;let prev;while(s.history.length){const candidate=s.history.pop();if(s.values[candidate[0]]!==s.answer[candidate[0]]){prev=candidate;break}}if(prev){s.values[prev[0]]=prev[1];if(prev[2])s.wrong.add(prev[0]);else s.wrong.delete(prev[0]);s.selected=prev[0];evSudokuPaint()}};
  evRoot.querySelector('#evSudoHint').onclick=()=>{if(s.done||s.hintsLeft<=0)return;const i=s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]?s.selected:s.values.findIndex((n,i)=>n!==s.answer[i]&&!s.givens.has(i));if(i>=0){s.hintsLeft--;s.values[i]=s.answer[i];s.wrong.delete(i);s.selected=i;s.highlight=0;evSudokuPaint();evSudokuCheck()}};
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
    const peer=s.selected>=0&&(r===rr||c===cc||(Math.floor(r/3)===Math.floor(rr/3)&&Math.floor(c/3)===Math.floor(cc/3)));
    const matching=s.highlight>0&&n===s.highlight&&!s.wrong.has(i);
    const matchLine=s.highlight>0&&s.values.some((v,j)=>v===s.highlight&&!s.wrong.has(j)&&(Math.floor(j/9)===r||j%9===c));
    el.className='ev-sudoku-cell'+(s.givens.has(i)?' given':'')+(peer?' peer':'')+(matchLine?' match-line':'')+(matching?' same':'')+(i===s.selected?' selected':'')+(s.wrong.has(i)?' bad':'');
    el.innerHTML=n?sudokuSymbol(n):(s.noteMarks[i]?.length?`<span class="ev-sudo-note-marks">${s.noteMarks[i].sort((a,b)=>a-b).join(' ')}</span>`:'');
  });
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>{const n=+b.dataset.symbol,remaining=evSudokuRemaining(n);b.classList.toggle('selected',s.highlight===n);b.classList.toggle('completed',remaining===0);b.disabled=remaining===0;b.setAttribute('aria-hidden',String(remaining===0));b.tabIndex=remaining===0?-1:0;b.querySelector('small').textContent=remaining===0?'':remaining;});
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
  s.wrong.delete(i);s.highlight=0;s.choice=0;evSudokuPaint();evSudokuCheck();
}
function sudokuSymbol(n){return currentWorld==='halloween'?`<img src="${sudokuSrc(n)}" alt="${n}">`:`<span class="number-symbol">${n}</span>`;}
function evSudokuEnd(won){const s=sudoku;if(!s)return;applyTheme(worlds[currentWorld].theme);const elapsed=Math.floor((Date.now()-s.start)/1000);const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;const pts=won?difficulties[s.difficulty].points+([100,70,30][s.mistakes]||0):0;evDisplay(`${evHeader(worlds[currentWorld].name,showRooms)}<section class="result-panel"><div class="result-mark">${won?'✦':'×'}</div><h2>${won?'Puzzle Completed!':'Puzzle Not Completed'}</h2>${won?`<div class="result-score"><small>TOTAL POINTS</small><strong>${pts.toLocaleString()}</strong></div>`:'<p>Three mistakes. Try again!</p>'}<div class="result-stats"><div>DIFFICULTY<strong>${s.difficulty.toUpperCase()}</strong></div><div>TIME<strong>${duration}</strong></div><div>MISTAKES<strong>${s.mistakes} / 3</strong></div></div><div class="result-actions"><button class="theme-button" id="evSudoAgain">${won?'PLAY AGAIN':'RETRY'}</button><button class="theme-button" id="evSudoBack">BACK TO ROOMS</button></div></section>`);evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);evRoot.querySelector('#evSudoBack').onclick=()=>showRooms(0);}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true);
}

document.getElementById("start").onclick=()=>showRooms(0);
