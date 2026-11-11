const evRoot=document.getElementById('game');
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function evDisplay(html){document.getElementById("home").hidden=true;evRoot.hidden=false;evRoot.innerHTML=html;}
function evHeader(title,back){queueMicrotask(()=>{const b=evRoot.querySelector('[data-back]');if(b)b.onclick=back;});return `<header class="ev-head"><button class="ev-btn ev-btn-alt" data-back aria-label="Back">‹ BACK</button><strong>${title}</strong><span></span></header>`;}
function showRooms(){clearInterval(sudokuTimer);sudoku=null;evDisplay(`<header class="ev-head"><button class="ev-btn ev-btn-alt" id="toHome">‹ BACK</button><strong>CHOOSE A ROOM</strong><span></span></header><section class="room-card"><div class="room-icon">☾ ✦ 🎃</div><h2>HALLOWEEN</h2><p>The original Goreburst Sudoku theme</p><button class="neon-button" id="enterRoom">ENTER ROOM</button></section>`);evRoot.querySelector('#toHome').onclick=showHome;evRoot.querySelector('#enterRoom').onclick=evSudokuMenu;}
function showHome(){clearInterval(sudokuTimer);sudoku=null;evRoot.hidden=true;document.getElementById('home').hidden=false;}
const sudokuImgs=['01_Pink_Neon_Bat.png','02_Blue_Neon_Moon.png','03_Orange_Neon_Pumpkin.png','04_Green_Neon_Cat.png','05_White_Pink_Ghost.png','06_Red_Neon_Heart.png','07_Purple_Neon_Candy.png','08_Yellow_Neon_Star.png','09_Cyan_Neon_Cross.png'];
const sudokuSrc=n=>'assets/events/'+sudokuImgs[n-1];
let sudoku=null, sudokuTimer=null;
function evSudokuMenu(){
  clearInterval(sudokuTimer);
  evDisplay(`${evHeader('SUDOKU',showRooms)}<section class="ev-sudo-landing ev-sudo-compact"><div class="ev-sudo-compact-eyebrow">✦ THE HAUNTED ARCADE ✦</div><h2>CHOOSE YOUR NIGHTMARE</h2><p>Three mistakes allowed · One hint per game</p><div class="ev-sudo-difficulties">${[['easy',350],['medium',650],['hard',1000]].map(([d,pts])=>`<button type="button" class="ev-sudo-difficulty ev-sudo-level" data-difficulty="${d}" aria-label="Play ${d} Sudoku"><span class="ev-sudo-level-name">${d.toUpperCase()}</span><span class="ev-sudo-level-points">SUDOKU</span></button>`).join('')}</div></section>`);
  evRoot.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>evSudokuStart(b.dataset.difficulty));
}
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
  const answer=makeSudokuSolution();
  const percent={easy:.60,medium:.45,hard:.35}[difficulty];
  const count=Math.round(81*percent);
  const givensLocal=new Set(shuffled(Array.from({length:81},(_,i)=>i)).slice(0,count));
  const puzzle=answer.map((n,i)=>givensLocal.has(i)?n:0);
  const sessionId=null;
  const givens=new Set(puzzle.map((n,i)=>n?i:-1).filter(i=>i>=0));
  sudoku={answer,values:[...puzzle],verifiedSessionId:sessionId,givens,selected:-1,choice:0,highlight:0,mistakes:0,wrong:new Set(),notes:false,noteMarks:{},history:[],hintsLeft:1,start:Date.now(),difficulty,done:false};
  evSudokuRender();clearInterval(sudokuTimer);
  sudokuTimer=setInterval(()=>{if(!sudoku||sudoku.done)return;const el=evRoot.querySelector('#evSudoTime');if(el){const time=Math.floor((Date.now()-sudoku.start)/1000);el.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}},1000);
}
function evSudokuRender(){
  const s=sudoku;if(!s)return;
  const pts={easy:350,medium:650,hard:1000}[s.difficulty];
  evDisplay(`${evHeader('SUDOKU',evSudokuMenu)}<div class="ev-sudo-shell"><div class="ev-sudo-stats"><div><small>DIFFICULTY</small><strong>${s.difficulty.toUpperCase()}</strong></div><div><small>MISTAKES</small><strong id="evSudoErrors">0 / 3</strong></div><div><small>TIME</small><strong id="evSudoTime">00:00</strong></div><div><small>POINTS</small><strong>—</strong></div></div><div class="ev-sudoku-grid" id="evSudoBoard">${s.values.map((n,i)=>`<button class="ev-sudoku-cell" data-cell="${i}" aria-label="Sudoku row ${Math.floor(i/9)+1} column ${i%9+1}">${n?`<img src="${sudokuSrc(n)}" alt="">`:''}</button>`).join('')}</div><div class="ev-sudoku-tray" aria-label="Select Sudoku symbol">${sudokuImgs.map((x,i)=>`<button data-symbol="${i+1}" aria-label="Choose symbol ${i+1}"><img src="${sudokuSrc(i+1)}" alt=""><small class="ev-sudo-remain"></small></button>`).join('')}</div><div class="ev-sudo-tools ev-sudo-tools-clean">${[['evSudoHint','✦','HINT'],['evSudoNotes','✎','NOTES'],['evSudoUndo','↶','UNDO'],['evSudoErase','⌫','ERASE']].map(([id,symbol,label])=>`<button type="button" id="${id}" class="ev-sudo-tool" aria-label="${label}" title="${label}"><span class="ev-sudo-tool-icon" aria-hidden="true">${symbol}</span><span class="ev-sudo-tool-label">${label}</span></button>`).join('')}</div><p class="ev-note">Select a tile, then choose a symbol. Tap a symbol first to light up every matching tile.</p></div>`,evSudokuMenu);
  // Safari-safe Sudoku sizing: content must never determine an empty row's height.
  // Match the rendered grid's border-box height to its actual width.
  evSudokuKeepBoardSquare();
  evRoot.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.cell;s.selected=i;if(s.values[i])s.highlight=s.values[i];evSudokuPaint()});
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>{const n=+b.dataset.symbol;if(evSudokuRemaining(n)===0)return;s.choice=n;s.highlight=n;if(s.selected>=0&&!s.givens.has(s.selected)&&s.values[s.selected]!==s.answer[s.selected]&&!s.done){if(s.notes){const i=s.selected;if(!s.values[i]){const marks=s.noteMarks[i]||[];s.noteMarks[i]=marks.includes(n)?marks.filter(x=>x!==n):[...marks,n];}evSudokuPaint()}else evSudokuPlace(n)}else evSudokuPaint()});
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
    el.className='ev-sudoku-cell'+(s.givens.has(i)?' given':'')+(peer?' peer':'')+(matching?' same':'')+(i===s.selected?' selected':'')+(s.wrong.has(i)?' bad':'');
    el.innerHTML=n?`<img src="${sudokuSrc(n)}" alt="">`:(s.noteMarks[i]?.length?`<span class="ev-sudo-note-marks">${s.noteMarks[i].sort((a,b)=>a-b).join(' ')}</span>`:'');
  });
  evRoot.querySelectorAll('[data-symbol]').forEach(b=>{const n=+b.dataset.symbol,remaining=evSudokuRemaining(n);b.classList.toggle('selected',s.highlight===n);b.classList.toggle('completed',remaining===0);b.disabled=remaining===0;b.querySelector('small').textContent=remaining===0?'✓':remaining;});
  const hint=evRoot.querySelector('#evSudoHint');if(hint){hint.disabled=s.hintsLeft<=0;hint.classList.toggle('used',s.hintsLeft<=0);hint.setAttribute('aria-label',s.hintsLeft?'Hint: 1 remaining':'Hint: 0 remaining');hint.title=s.hintsLeft?'1 hint remaining':'No hints remaining';}
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
function evSudokuEnd(won,pts=0){
  const s=sudoku;if(!s)return;
  const elapsed=Math.floor((Date.now()-s.start)/1000);
  const duration=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
  const title=won?'PUZZLE COMPLETE!':'NIGHTMARE OVER';
  const detail=won?(pts>0?`<strong>PUZZLE SOLVED</strong>`:'<strong>PUZZLE SOLVED</strong><small>Standalone local game</small>'):'<strong>THREE MISTAKES</strong><small>Try again!</small>';
  evDisplay(`${evHeader('SUDOKU',showRooms)}<section class="ev-sudo-end ev-sudo-result ${won?'ev-sudo-result-win':'ev-sudo-result-lose'}" role="region" aria-label="${title}"><div class="ev-sudo-result-kicker">✦ THE HAUNTED ARCADE ✦</div><div class="ev-sudo-result-symbol" aria-hidden="true">${won?'✦':'☠'}</div><h2>${title}</h2><div class="ev-sudo-result-detail">${detail}</div><div class="ev-sudo-end-stats"><span>DIFFICULTY<b>${s.difficulty.toUpperCase()}</b></span><span>TIME<b>${duration}</b></span><span>MISTAKES<b>${s.mistakes}/3</b></span></div><div class="ev-sudo-result-actions"><button type="button" id="evSudoAgain" class="ev-sudo-result-primary">${won?'PLAY AGAIN':'RETRY'}</button><button type="button" id="evSudoBack" class="ev-sudo-result-secondary">BACK TO ROOMS</button></div></section>`,showRooms);
  evRoot.querySelector('#evSudoAgain').onclick=()=>evSudokuStart(s.difficulty);
  evRoot.querySelector('#evSudoBack').onclick=showRooms;
}

function evSudokuCheck(){
  const s=sudoku;if(!s||s.done||!s.values.every((v,i)=>v===s.answer[i]))return;
  s.done=true;clearInterval(sudokuTimer);evSudokuEnd(true,0);
}

document.getElementById("start").onclick=showRooms;
