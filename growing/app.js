'use strict';
const APP=(()=>{
 const NW_GLOOP_STINKY_ART='data:image/webp;base64,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';
 const E=HexEngine,EMBEDDED=window.parent!==window&&typeof window.parent.nwGrowingUserId==='function',ACCOUNT=EMBEDDED?window.parent.nwGrowingUserId():null;
 const names=['Crab','Tripod','Caterpillar','Bat','Olive','Shaggy','Snail','Mushroom','Dinosaur','Coil','Tentacles','Gloop','Chomps','Noodle','Blink','Grumble','Pinky','Wobbles','Stinky','Crumbs'];
 const artFiles=['10_crab','11_tripod','12_caterpillar','13_bat','14_olive','15_shaggy','16_snail','17_mushroom','18_dinosaur','19_coil','20_tentacles','01_gloop','02_chomps','03_noodle','04_blink','05_grumble','06_pinky','07_wobbles','08_stinky','09_crumbs'];
 const rewards=[[500,'diamonds',30],[1000,'energy',20],[2000,'diamonds',40],[3000,'energy',20],[5000,'diamonds',50],[7500,'energy',20],[10000,'ray',1],[15000,'diamonds',60],[20000,'energy',30],[30000,'juice',1],[45000,'diamonds',70],[60000,'ray',1],[80000,'energy',50],[100000,'diamonds',150],[150000,'diamonds',300]];
 const packs=[{price:'RM4.90',items:[['energy',50],['diamonds',200],['ray',1]]},{price:'RM9.90',items:[['energy',150],['diamonds',500],['juice',1],['ray',2]]},{price:'RM23.90',items:[['energy',500],['diamonds',1500],['juice',3],['ray',3]]}];
 const dailyMissions=[
  {id:'battle1',label:'Join 1 Battle',goal:1,reward:10,kind:'battles'},
  {id:'battle2',label:'Join 2 Battles',goal:2,reward:15,kind:'battles'},
  {id:'battle3',label:'Join 3 Battles',goal:3,reward:20,kind:'battles'},
  {id:'world1',label:'Complete 1 Worlds Sudoku',goal:1,reward:10,kind:'worlds'},
  {id:'world2',label:'Complete 2 Worlds Sudokus',goal:2,reward:15,kind:'worlds'},
  {id:'merge3',label:'Complete 3 merges',goal:3,reward:10,kind:'merges'},
  {id:'merge8',label:'Complete 8 merges',goal:8,reward:15,kind:'merges'},
  {id:'merge12',label:'Complete 12 merges',goal:12,reward:20,kind:'merges'},
  {id:'spend30',label:'Spend 30 Growing Energy',goal:30,reward:10,kind:'spent'},
  {id:'play',label:'Play any game mode',goal:1,reward:5,kind:'played'}
 ];
 const todayUTC=t=>new Date(t).toISOString().slice(0,10);
 const app=document.getElementById('app');let state,view='home',selected=-1,route=[],hover=-1,locked=false,turnNote='',modalActive=false,uiTimer=null,previewBoard=null,mergeGlow=[];
 let verificationSeed=null;
 async function fetchVerificationSeed(){
  if(!EMBEDDED||typeof window.parent.nwGrowingSeed!=='function')return;
  try{const data=await window.parent.nwGrowingSeed();if(data&&Number.isSafeInteger(Number(data.seed)))verificationSeed={period:data.period,seed:Number(data.seed)};}
  catch(e){console.warn('Growing verification initialization:',e.message)}
 }
 function nextVerifiedRandom(v){v.rngState=(Math.imul(v.rngState,1664525)+1013904223)>>>0;return v.rngState/4294967296}
 function newVerifiedBoard(week){
  const v=verificationSeed?.period===week?{period:week,seed:verificationSeed.seed,rngState:verificationSeed.seed>>>0,actions:[]}:null;
  const rng=v?()=>nextVerifiedRandom(v):Math.random;
  const board=E.initial(rng),queue=E.nextQueue(board,rng);
  return {board,queue,verifier:v};
 }
 function sendVerifiedProof(force=false){
  const v=state?.verifier;
  if(!EMBEDDED||!v||!live()||v.period!==state.weekId||!Array.isArray(v.actions)||!v.actions.length)return;
  if(!force&&v.actions.length%8!==0)return;
  if(typeof window.parent.nwGrowingVerifyScore==='function')void window.parent.nwGrowingVerifyScore(v.period,state.score,v.actions).catch(e=>console.warn('Growing verification:',e.message));
 }

 const img=(lvl)=>`<img src="assets/${artFiles[lvl-1]}.png" alt="${names[lvl-1]}">`;
 const fmt=n=>Number(n||0).toLocaleString('en-US');
 function load(){
  if(EMBEDDED)return typeof window.parent.nwGrowingLoadSave==='function'?window.parent.nwGrowingLoadSave(ACCOUNT):null;
  return null; // Standalone preview has no user account and never persists progress.
 }
 function save(){
  if(EMBEDDED&&typeof window.parent.nwGrowingQueueSave==='function')window.parent.nwGrowingQueueSave(state,ACCOUNT);
 }
 function fresh(){const n=newVerifiedBoard(weekId(Date.now()));return{board:n.board,queue:n.queue,verifier:n.verifier,natural:100,bonus:0,nextRegen:0,diamonds:EMBEDDED?window.parent.nwDiamondBalance():0,juice:1,ray:1,score:0,total:0,claimed:[],notices:[],highest:Math.max(...n.board),discovered:[...new Set(n.board.filter(Boolean))],lastAt:Date.now(),gameOver:false,testOffset:0,weekId:weekId(Date.now()),boardWeekId:weekId(Date.now()),packs:[],started:false,daily:{date:todayUTC(Date.now()),battles:0,worlds:0,merges:0,spent:0,played:0,claimed:[]}}}
 function weekId(now){const d=new Date(now),day=d.getUTCDay(),toTue=(day+5)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-toTue*86400000).toISOString().slice(0,10)}
 function now(){return Date.now()+(state?.testOffset||0)}
 function live(){return [2,3,4].includes(new Date(now()).getUTCDay())}
 function countdown(){const t=now(),start=Date.parse(weekId(t)+'T00:00:00Z'),end=start+(live()?3:7)*86400000;const diff=Math.max(0,end-t);return `${Math.floor(diff/86400000)}d ${Math.floor(diff/3600000)%24}h ${Math.floor(diff/60000)%60}m ${live()?'remaining':'until next event'}`}
 function applyInventory(){
  if(!EMBEDDED||typeof window.parent.nwPrizeTransferReceipts!=='function')return;
  const applied=new Set(Array.isArray(state.inventoryApplied)?state.inventoryApplied:[]);
  let changed=false;
  for(const receipt of window.parent.nwPrizeTransferReceipts('tg')){
   if(applied.has(receipt.id)||receipt.period!==state.weekId)continue;
   const n=Number(receipt.quantity);
   if(!Number.isSafeInteger(n)||n<1)continue;
   if(receipt.item==='tg_energy')state.bonus=(state.bonus||0)+n;
   else if(receipt.item==='tg_ray')state.ray=(state.ray||0)+n;
   else if(receipt.item==='tg_juice')state.juice=(state.juice||0)+n;
   else continue;
   applied.add(receipt.id);changed=true;
  }
  if(changed)state.inventoryApplied=[...applied];

 }
 function sync(){const t=now();if(!state)state=fresh();if(!state.daily||state.daily.date!==todayUTC(t))state.daily={date:todayUTC(t),battles:0,worlds:0,merges:0,spent:0,played:0,claimed:[]};if(weekId(t)!==state.weekId||state.boardWeekId!==weekId(t)){
  const newWeek=weekId(t),b=newVerifiedBoard(newWeek),board=b.board;
  state.weekId=newWeek;state.boardWeekId=newWeek;
  state.board=board;state.queue=b.queue;state.verifier=b.verifier;
  state.score=0;state.claimed=[];state.packs=[];
  state.highest=Math.max(...board);state.discovered=[...new Set(board.filter(Boolean))];
  state.gameOver=false;state.started=false;
  selected=-1;route=[];hover=-1;previewBoard=null;mergeGlow=[];locked=false;turnNote='';
 }applyInventory();if(EMBEDDED){const activity=window.parent.nwRead(window.parent.nwGrowingActivityKey(),{}),o=activity.day===todayUTC(t)?activity:{};state.daily.battles=Math.max(state.daily.battles||0,Number(o.battles)||0);state.daily.worlds=Math.max(state.daily.worlds||0,Number(o.worlds)||0);state.daily.played=Math.max(state.daily.played||0,Number(o.played)||0);state.diamonds=window.parent.nwDiamondBalance();}if(state.natural<100&&state.nextRegen&&t>=state.nextRegen){const count=Math.min(100-state.natural,1+Math.floor((t-state.nextRegen)/300000));state.natural+=count;state.nextRegen=state.natural===100?0:state.nextRegen+count*300000}save()}
 function energy(){return state.natural+state.bonus}
 function spend(){state.daily.spent++;state.daily.played=1;if(state.natural){if(state.natural===100||!state.nextRegen)state.nextRegen=now()+300000;state.natural--}else if(state.bonus)state.bonus--}
 function grant(type,count){if(type==='energy')state.bonus+=count;else if(type==='diamonds'&&EMBEDDED){if(window.parent.nwGrowingAdjustDiamonds(count))state.diamonds=window.parent.nwDiamondBalance();}else state[type]+=count}
 function announce(text,items){state.notices.push(items?{text,items}:text)}
 function points(merges){for(const m of merges){state.score+=m.points;state.total+=m.points;if(m.to&&!state.discovered.includes(m.to))state.discovered.push(m.to);state.highest=Math.max(state.highest,m.to||m.from)}for(const [at,type,n] of rewards)if(state.score>=at&&!state.claimed.includes(at)){state.claimed.push(at);grant(type,n);announce(`MILESTONE ${fmt(at)}!`,[[type,n]])}}
 function itemIcon(type){return type==='juice'?'<img class="item-icon" src="assets/mutation_juice.png" alt="Mutation Juice">':type==='ray'?'<img class="item-icon" src="assets/shrink_ray.png" alt="Shrink Ray">':type==='energy'?'<span class="currency-icon energy-symbol">ϟ</span>':'<img class="item-icon official-diamond" src="assets/official_diamond.png" alt="Diamonds">'}
 function rewardTrack(){
   const next=rewards.find(([pt])=>!state.claimed.includes(pt));
   return `<div class="milestone-card"><div class="milestone-title"><b>MILESTONE REWARDS</b><span>${state.claimed.length}/15</span></div>
     <div class="milestone-scroll" tabindex="0" aria-label="Swipe milestone rewards"><div class="milestone-journey">
       <div class="milestone-rail"><i style="width:${Math.max(0,(state.claimed.length-1)/14*100)}%"></i></div>
       ${rewards.map(([pt,type,num])=>`<div class="milestone-stop ${state.claimed.includes(pt)?'earned':''} ${next?.[0]===pt?'next':''}">
         <div class="milestone-prize">${itemIcon(type)}<strong>${num}</strong></div>
         <span class="milestone-node">${state.claimed.includes(pt)?'✓':''}</span><small>${fmt(pt)}</small>
       </div>`).join('')}</div></div>
     <div class="milestone-foot">${next?'NEXT · '+fmt(next[0])+' POINTS':'ALL MILESTONES COMPLETE'}</div></div>`;
 }

 function btn(t,action,extra=''){return `<button class="btn ${extra}" data-action="${action}">${t}</button>`}
 function top(){return EMBEDDED?'':`<div class="top">${btn('‹','back','back')}<span class="mark">TUE — THU</span><span class="wallet">💎 <b>${fmt(state.diamonds)}</b></span></div>`}
 function milestone(){return rewardTrack()}
 function energyCard(){return `<div class="energy">ϟ ${fmt(state.natural)} / 100 ${state.bonus?`<small style="font-size:15px">+${state.bonus}</small>`:''}</div><div class="muted">${state.natural>=100?'Energy full':`Next ϟ in ${Math.max(0,Math.ceil((state.nextRegen-now())/60000))}m`} · 1 Energy / 5 min</div><div class="energy-bar"><i style="width:${state.natural}%"></i></div>`}
 function home(){view='home';sync();const next=rewards.find(([pt])=>!state.claimed.includes(pt));const claimed=state.daily.claimed||[];const ready=dailyMissions.filter(m=>!claimed.includes(m.id)&&(state.daily[m.kind]||0)>=m.goal).length;app.innerHTML=top()+`<section class="growing-hero">
 <div class="growing-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
 <div class="growing-hero-heading"><div class="growing-eyebrow">･ ༝ ･</div><h1 class="title growing-arched-title"><svg viewBox="0 0 960 190" role="img" aria-label="They’re Growing!" preserveAspectRatio="xMidYMid meet"><defs><path id="growing-title-curve" d="M60 154 Q480 -4 900 154"/></defs><text font-family="Eater,serif" font-size="85" fill="currentColor" textLength="832" lengthAdjust="spacingAndGlyphs"><textPath href="#growing-title-curve" startOffset="50%" text-anchor="middle">THEY'RE GROWING!</textPath></text></svg></h1>
 <div class="growing-class-photo-wrap growing-lab-promo"><div class="growing-smoke" aria-hidden="true"><i></i><i></i><i></i><i></i></div><img class="growing-class-photo growing-approved-lab-art" src="${NW_GLOOP_STINKY_ART}" alt="Gloop and Stinky in white lab coats experimenting with a bubbling green potion"></div>
  <div class="growing-event-pill"><span class="live-dot"></span>${live()?'NOW LIVE':'TUE — THU'}<span class="pill-divider">✦</span>${countdown()}</div></div>
 </section>
 <section class="growing-dashboard"><div class="growing-score-block"><span class="g-label">EVENT SCORE</span><strong>${fmt(state.score)}</strong></div><div class="growing-energy-block"><span class="g-label">ENERGY</span><strong><span class="energy-glyph">ϟ</span> ${fmt(energy())}</strong><div class="g-energy-meter"><i style="width:${state.natural}%"></i></div><small>${state.natural>=100?'FULL':`+1 IN ${Math.max(0,Math.ceil((state.nextRegen-now())/60000))} MIN`}</small></div></section>
 <div class="growing-actions">${btn('♛<span>RANK</span>','rank','tiny-action')}${btn('▣<span>MISSIONS'+(ready?' <em>'+ready+'</em>':'')+'</span>','missions','tiny-action')}</div>
 ${btn(state.started?'CONTINUE GROWING':'START GROWING','play','main growing-start')}
 ${milestone()}
 <nav class="growing-lobby-nav" aria-label="Event features">${btn('ϟ<span>ENERGY</span>','shop')}${btn('✦<span>BOOSTERS</span>','boosters')}${btn('▦<span>EVOLUTIONS</span>','roster')}${btn('?<span>HOW TO PLAY</span>','help')}</nav>
 <div class="growing-packs-link">${btn('PREMIUM PACKS','packs')}</div>`;wire()}

 function positions(){const R=22.5,ww=Math.sqrt(3)*R;return E.cells.map(({q,r})=>({x:170+ww*(q+r/2),y:167+1.5*R*r}))}
 const pos=positions();
 function hexes(){const displayed=previewBoard||state.board;return `<svg id="hexmap" viewBox="-4 4 348 327" aria-label="Pointy-top 37-hex board">${displayed.map((v,i)=>{let p=pos[i],selectedCls=i===selected?' selected':'',reach=!locked&&selected>=0&&E.reachable(state.board,selected).has(i)?' reachable':'',glow=mergeGlow.includes(i)?' merge-glow':'',ppts='0,-22.5 19.5,-11.25 19.5,11.25 0,22.5 -19.5,11.25 -19.5,-11.25';return `<g class="hex${selectedCls}${reach}${glow}" data-cell="${i}" transform="translate(${p.x},${p.y})" tabindex="0" role="button" aria-label="${v?'Level '+v+' '+names[v-1]:'Empty hex'}"><polygon points="${ppts}"/>${v?`<image href="assets/${artFiles[v-1]}.png" x="-17" y="-19" width="34" height="34" pointer-events="none"/><rect x="8" y="6" width="13" height="12" rx="4" fill="#23172d" stroke="#e5a6ff" stroke-width=".7" pointer-events="none"/><text x="14.5" y="15.5" text-anchor="middle" pointer-events="none">${v}</text>`:''}</g>`}).join('')}${route.length>1?`<polyline class="pathline" points="${route.map(i=>pos[i].x+','+pos[i].y).join(' ')}"/>`:''}</svg>`}
 function game(){view='game';sync();app.innerHTML=top()+`<h2 class="title small">THEY'RE GROWING!</h2><div class="stats"><div class="stat"><small>ENERGY</small><b>ϟ ${energy()}</b></div><div class="stat"><small>EVENT SCORE</small><b>${fmt(state.score)}</b></div><div class="stat"><small>TOP LEVEL</small><b>${state.highest}</b></div></div><div class="board-wrap">${hexes()}</div><div class="message" role="status">${state.gameOver?'NOT ENOUGH SPACE TO SPAWN FOUR! Use a booster or restart.':turnNote||''}</div><div class="center muted">NEXT</div><div class="next">${state.queue.map(v=>`<div class="mini">${img(v)}<b>${v}</b></div>`).join('')}</div><div class="tools"><button class="btn tool" data-action="juice">${itemIcon('juice')}<small>Mutation Juice<br><b>× ${state.juice}</b></small></button><button class="btn tool" data-action="ray">${itemIcon('ray')}<small>Shrink Ray<br><b>× ${state.ray}</b></small></button></div><div class="two">${btn('Get Energy +','shop')}${btn('Restart Board','restart')}</div><div class="two">${btn('Milestones','milestones')}${btn('Evolution Guide','roster')}</div>`;wire();bindBoard()}
 function boardTap(i){if(locked)return;const b=state.board;if(b[i]){selected=selected===i?-1:i;route=[];turnNote=selected<0?'Selection cleared.':'Choose a glowing empty hex.';game();return}if(selected<0)return;executeMove(selected,i)}
 function executeMove(from,to){
   if(locked)return;
   sync();
   if(state.gameOver){turnNote='Use a booster or restart to continue.';game();return}
   if(!energy()){offerEnergyRefill();return}
   const result=E.move(state.board,state.queue,from,to,state.verifier?()=>nextVerifiedRandom(state.verifier):Math.random);
   if(!result.ok){turnNote='No unobstructed path to that hex. Zero Energy spent.';game();return}
   locked=true;spend();state.board=result.board;state.queue=result.queue;state.gameOver=result.gameOver;points(result.merges);if(state.verifier&&state.verifier.period===state.weekId)state.verifier.actions.push({type:'move',from,to});state.daily.merges+=result.merges.length;sendVerifiedProof();if(EMBEDDED&&live()&&state.score>0)void window.parent.nwLbSubmit('tg',state.score).catch(e=>console.warn('Growing rank sync:',e.message));
   selected=-1;route=result.path;save();
   const frames=result.frames||[];let step=0;
   function nextFrame(){
     if(step>=frames.length){previewBoard=null;mergeGlow=[];route=[];
       turnNote=result.gameOver?'BOARD FULL':result.merges.length?'NICE MERGE!':'';
       locked=false;if(view==='game')game();showNotices();return;
     }
     const f=frames[step++];previewBoard=f.board;mergeGlow=f.phase==='merging'?f.members:[];
     if(f.phase==='moved')turnNote='';
     else if(f.phase==='spawned')turnNote='';
     else if(f.phase==='merging')turnNote='MERGE!';
     else if(f.phase==='merged')turnNote='';
     if(view==='game')game();
     setTimeout(nextFrame,f.phase==='spawned'?110:f.phase==='merging'?150:f.phase==='moved'?55:45);
   }
   nextFrame();
 }
 function targetAt(svg,clientX,clientY){let p=svg.createSVGPoint();p.x=clientX;p.y=clientY;const xy=p.matrixTransform(svg.getScreenCTM().inverse());let best=-1,dist=Infinity;for(let i=0;i<pos.length;i++){const d=Math.hypot(xy.x-pos[i].x,xy.y-pos[i].y);if(d<dist){best=i;dist=d}}return dist<=23?best:-1}
 function bindBoard(){const svg=document.getElementById('hexmap');let pointer=null;svg.addEventListener('pointerdown',e=>{const g=e.target.closest('[data-cell]');if(!g)return;const i=+g.dataset.cell;if(state.board[i]){pointer={from:i,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId)}});svg.addEventListener('pointerup',e=>{if(!pointer)return;const p=pointer;pointer=null;const dist=Math.hypot(e.clientX-p.x,e.clientY-p.y);const end=targetAt(svg,e.clientX,e.clientY);if(dist>=11&&end>=0&&end!==p.from){executeMove(p.from,end)}else if(dist>=11){turnNote='Drag ended outside the board. No Energy spent.';game()}else boardTap(p.from)});svg.addEventListener('pointercancel',()=>pointer=null);svg.querySelectorAll('.hex').forEach(el=>{el.addEventListener('click',e=>{if(e.detail===0)boardTap(+el.dataset.cell);else if(state.board[+el.dataset.cell]===0)boardTap(+el.dataset.cell)});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();boardTap(+el.dataset.cell)}})})}
 function overlay(title,content,actions=[['CLOSE',()=>{}]]){modalActive=true;const m=document.createElement('div');m.className='modal-shade';m.innerHTML=`<section class="modal" role="dialog" aria-modal="true"><h2>${title}</h2>${content}<div>${actions.map(([n],i)=>`<button class="btn ${i===0?'main':''}" data-choice="${i}">${n}</button>`).join('')}</div></section>`;document.body.appendChild(m);m.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const fn=actions[+b.dataset.choice][1];m.remove();modalActive=false;if(fn)fn()});m.querySelector('button')?.focus()}
 function showNotices(){if(modalActive||!state.notices.length)return;const notice=state.notices.shift(),items=notice&&typeof notice==='object'?notice.items:null;save();const art=items?`<div class="prize-gallery">${items.map(([type,n])=>`<div class="prize-card">${itemIcon(type)}<strong>${n===1?'×1':'+'+n}</strong><span>${type==='diamonds'?'DIAMONDS':type==='energy'?'ENERGY':type==='juice'?'MUTATION JUICE':'SHRINK RAY'}</span></div>`).join('')}</div>`:`<p class="hint">${String(notice)}</p>`;overlay('CONGRATULATIONS!',art,[['AWESOME!',showNotices]])}
 function how(){overlay('HOW TO GROW',`<p>Drag ONE creature to an empty hex. Any unblocked route is valid, including winding paths around obstacles. Valid moves cost exactly <b>1 Energy</b>.</p><p>Connect <b>4 or more</b> creatures of the same level. The whole connected group becomes <b>one</b> upgraded creature at the destination, with no new spawns.</p><p>When a move does not merge, the <b>exact next four</b> previewed creatures spawn randomly. New groups merge automatically, lowest levels first and then reading order.</p><p>If fewer than four hexes remain free for that spawn, the turn ends in a recoverable Game Over: use a booster or restart. Board persists if you close the tab.</p>`)}
 function guide(){overlay('EVOLUTION GUIDE',`<div class="roster">${names.map((n,i)=>`<div class="${state.discovered.includes(i+1)?'':'locked'}">${img(i+1)}<br><b>${i+1}</b> ${n}</div>`).join('')}</div>`)}
 function useBooster(kind){sync();if(!state[kind]){overlay('NO BOOSTERS',`<p>You have no ${kind==='juice'?'Mutation Juice':'Shrink Ray'} left.</p>`,[['SHOP',()=>shop('boost')],['CLOSE',()=>{}]]);return}const result=kind==='juice'?E.juice(state.board):E.shrink(state.board);if(!result||((kind==='juice')&&!result.merges.length)){overlay('NO EFFECT',`<p>${kind==='juice'?'You need at least four creatures of one level anywhere on the board.':'You must have at least four creatures on the board.'} The item was not consumed.</p>`);return}overlay(kind==='juice'?'MUTATION JUICE':'SHRINK RAY',`<p>${kind==='juice'?`Merge same-level creatures anywhere. ${result.merges.length} merge(s) available.`:'Remove exactly the three lowest-level creatures for ZERO points.'}</p>`,[['USE BOOSTER',()=>{const fresh=kind==='juice'?E.juice(state.board):E.shrink(state.board);if(!fresh)return;state.board=fresh.board;state[kind]--;if(kind==='juice')points(fresh.merges);if(state.verifier&&state.verifier.period===state.weekId)state.verifier.actions.push({type:kind});state.gameOver=false;sendVerifiedProof();turnNote='Booster used. Keep growing!';save();game();showNotices()}],['CANCEL',()=>{}]])}
 function restart(){overlay('RESTART BOARD?',`<p>The current 37-hex arrangement will be replaced. Your earned score, Diamonds, Energy, discoveries and milestones remain untouched.</p>`,[['RESTART',()=>{if(state.verifier&&state.verifier.period===state.weekId){const rng=()=>nextVerifiedRandom(state.verifier);state.board=E.initial(rng);state.queue=E.nextQueue(state.board,rng);state.verifier.actions.push({type:'restart'});}else{state.board=E.initial();state.queue=E.nextQueue(state.board);}state.gameOver=false;sendVerifiedProof();selected=-1;turnNote='Fresh board!';save();game()}],['CANCEL',()=>{}]])}
 function offerEnergyRefill(){
 if(modalActive)return;
 const available=EMBEDDED&&typeof window.parent.nwGrowingInventoryAmount==='function'?window.parent.nwGrowingInventoryAmount():0;
 if(available>0)overlay('OUT OF ENERGY!','<p>You have '+available+' Energy in Inventory. Want to use some?</p>',[['YES, USE ENERGY',()=>chooseReserveEnergy(available)],['NOT NOW',()=>{}]]);
 else overlay('OUT OF ENERGY!','<p>There is no Energy left in Inventory.</p>',[['GET ENERGY',()=>shop('energy')],['NOT NOW',()=>{}]]);
}
function chooseReserveEnergy(amount){
 const max=Math.max(0,Math.trunc(amount));if(!max){shop('energy');return;}
 overlay('USE ENERGY','<p>In Inventory: <strong>'+max+'</strong></p><div class="nw-grow-refill-count"><button type="button" data-nw-delta="-1">−</button><input id="nwEnergyQty" type="number" min="1" max="'+max+'" value="'+Math.min(30,max)+'" inputmode="numeric" aria-label="Energy to use"><button type="button" data-nw-delta="1">+</button></div><p id="nwEnergyRefillMessage" role="status"></p>',[['USE ENERGY',()=>{}],['BACK',offerEnergyRefill]]);
 const modal=document.querySelector('.modal-shade'),input=modal.querySelector('#nwEnergyQty');
 const quantity=()=>Math.max(1,Math.min(max,Math.trunc(Number(input.value)||1)));
 const update=()=>{input.value=String(quantity())};
 modal.querySelectorAll('[data-nw-delta]').forEach(b=>b.onclick=()=>{input.value=quantity()+Number(b.dataset.nwDelta);update()});
 input.onchange=update;
 const choices=modal.querySelectorAll('[data-choice]');choices[0].onclick=async()=>{
  const n=quantity();choices[0].disabled=true;choices[1].disabled=true;
  try{
   if(!EMBEDDED||typeof window.parent.nwGrowingUseReserve!=='function')throw Error('Inventory unavailable');
   await window.parent.nwGrowingUseReserve(n);
   if(modal.isConnected){modal.remove();modalActive=false;}
   save();game();
   overlay('ENERGY ADDED!','<p>+'+n+' Energy. You can keep playing right here.</p>',[['CONTINUE',()=>{}]]);
  }catch(e){if(modal.isConnected){modal.querySelector('#nwEnergyRefillMessage').textContent=e.message;choices[0].disabled=false;choices[1].disabled=false;}}
 };
}
function shop(kind='energy'){sync();const list=kind==='energy'?[['energy',30,100],['juice',1,100],['ray',1,80]]:[['juice',1,100],['ray',1,80],['energy',30,100]];overlay(kind==='boost'?'BOOSTER SHOP':'GET ENERGY',`<p class="hint">💎 ${fmt(state.diamonds)}</p>${list.map(([k,n,c])=>`<div class="item"><div><strong>${itemIcon(k)} ${n} ${k}</strong><small></small></div><button class="btn" data-buy="${k}" data-count="${n}" data-cost="${c}">💎 ${c}</button></div>`).join('')}<h3 style="color:#e5a6ff">PREMIUM PACKS</h3><div class="hint"></div>`,[['VIEW PACKS',packsScreen],['CLOSE',()=>{}]]);const m=document.querySelector('.modal-shade');m.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{const type=b.dataset.buy,n=+b.dataset.count,c=+b.dataset.cost;if(b.disabled)return;b.disabled=true;
 try{
  if(state.diamonds<c){m.remove();modalActive=false;overlay('NOT ENOUGH DIAMONDS','<p>You need more Diamonds to get Energy.</p>',[['VIEW PACKS',packsScreen],['BACK TO ENERGY',()=>shop('energy')],['CLOSE',()=>{}]]);return}
  if(EMBEDDED&&typeof window.parent.nwWalletCurrent==='function'&&window.parent.nwWalletCurrent()){
   await window.parent.nwWalletPurchase('tg_'+type);
   state.diamonds=window.parent.nwDiamondBalance();
  }else{
   if(EMBEDDED){if(!window.parent.nwGrowingAdjustDiamonds(-c))return;state.diamonds=window.parent.nwDiamondBalance();}
   else state.diamonds-=c;
   grant(type,n);
  }
  announce(`PURCHASE RECEIVED`,[[type,n]]);save();m.remove();modalActive=false;if(view==='game')game();else home();showNotices();
 }catch(e){console.warn('Growing purchase:',e.message);m.remove();modalActive=false;overlay('PURCHASE UNAVAILABLE',`<p>${String(e.message||'Try again.')}</p>`)}
 finally{b.disabled=false}
})}
 function packsScreen(){overlay('PREMIUM PACKS',`<div class="pack-grid">${packs.map((p,i)=>`<div class="pack-card"><span class="pack-tag">PACK ${i+1}</span><strong>${p.items.map(([k,n])=>`<span>${itemIcon(k)} ×${n}</span>`).join('')}</strong><button class="btn" disabled>${p.price}</button><small>COMING SOON</small></div>`).join('')}</div>`)}
 function boosterShop(){shop('boost')}

 function milestonePage(){overlay('MILESTONE REWARDS',`<p>Weekly score: <b>${fmt(state.score)}</b></p>${rewardTrack()}`)}
 function rank(){
 sync();sendVerifiedProof(true);
 if(state.score<2000){overlay('RANKINGS LOCKED','<p>Earn 2,000 points to unlock the leaderboard!</p>');return;}
 overlay('RANKINGS','<div id="nwLbTG">Connecting to rankings…</div>');
 (async()=>{if(!EMBEDDED)throw Error('Online rankings require the main Nine & Weird game.');if(live())void window.parent.nwLbSubmit('tg',state.score).catch(e=>console.warn('Growing leaderboard submission:',e.message));const rows=await window.parent.nwLbRank('tg'),el=document.getElementById('nwLbTG');if(el){el.innerHTML=window.parent.nwLbMarkup(rows,'tg');el.querySelector('[data-nw-lb-rewards]')?.addEventListener('click',()=>overlay('REWARDS',window.parent.nwLbRewardsMarkup('tg')));}})().catch(e=>{const el=document.getElementById('nwLbTG');if(el)el.textContent='Leaderboard unavailable: '+e.message;});
}
 function missionScreen(){
  sync();const d=state.daily;
  const ordered=[...dailyMissions].sort((a,b)=>{const rank=m=>d.claimed.includes(m.id)?2:(d[m.kind]||0)>=m.goal?0:1;return rank(a)-rank(b)||dailyMissions.indexOf(a)-dailyMissions.indexOf(b)});
  const rows=ordered.map(m=>{const v=Math.min(m.goal,d[m.kind]||0),done=v>=m.goal,claimed=d.claimed.includes(m.id);return `<div class="mission-row ${done&&!claimed?'ready-to-claim':''}"><div class="mission-main"><b>${m.label}</b><small>${v} / ${m.goal}</small><div class="mission-meter"><i style="width:${v/m.goal*100}%"></i></div></div><div class="mission-claim"><span>ϟ +${m.reward}</span><button class="btn mini-claim" data-claim="${m.id}" ${!done||claimed?'disabled':''}>${claimed?'CLAIMED':done?'CLAIM':'LOCKED'}</button></div></div>`}).join('');
  overlay('DAILY MISSIONS',`<p class="hint">DAILY RESET · 00:00 UTC</p><div class="mission-list">${rows}</div>`,[['CLOSE',()=>{}]]);
  const popup=document.querySelector('.modal-shade');popup.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const m=dailyMissions.find(x=>x.id===b.dataset.claim);if(!m||state.daily.claimed.includes(m.id)||(state.daily[m.kind]||0)<m.goal)return;state.daily.claimed.push(m.id);grant('energy',m.reward);save();popup.remove();modalActive=false;if(view==='game')game();else home();missionScreen()});
 }

 function planet(){view='planet';app.innerHTML=top()+`<h1 class="title">EVENT GALAXY</h1><div class="planet"><span>THEY'RE<br>GROWING!</span></div><p class="center" style="color:var(--lime)">${live()?'NOW LIVE: TUE – THU':'COMING SOON: TUE – THU'}</p><p class="muted">The orbit glows for the live period. Your event planet is also available in the main game's Events carousel.</p>${btn('OPEN EVENT','home','main')}`;wire()}
 function testTool(which){if(which==='test-points'){state.score+=5000;for(const [at,k,n] of rewards)if(state.score>=at&&!state.claimed.includes(at)){state.claimed.push(at);grant(k,n);announce(`MILESTONE ${fmt(at)}!`,[[k,n]])}}if(which==='test-energy')grant('energy',50);if(which==='test-energy500')grant('energy',500);if(which==='test-week'){state.testOffset+=7*86400000;sync()}if(which==='test-merge'){state.board=Array(37).fill(0);[16,17,18].forEach(i=>state.board[i]=2);state.board[12]=2;state.board[24]=3;state.queue=[1,1,2,2];state.gameOver=false;turnNote='Test setup: move Level 2 into a connected cluster to merge.'}if(which==='test-path'){state.board=Array(37).fill(0);state.board[3]=1;[4,10,11,12,17,18,24,25,26].forEach(i=>state.board[i]=3);state.queue=[1,1,1,2];state.gameOver=false;turnNote='Test setup: try winding an unblocked path around obstacles.'}if(which==='test-full'){state.board=Array(37).fill(0);for(let i=0;i<34;i++)state.board[i]=i%3+1;state.board[0]=4;state.board[1]=0;state.board[34]=2;state.board[35]=0;state.board[36]=0;state.queue=[1,2,3,1];state.gameOver=false;turnNote='Test setup: fewer than four spawning spaces should cause recoverable Game Over.'}if(which==='reset'){overlay('RESET TEST DATA?',`<p>Reset only They're Growing! beta gameplay for this account?</p>`,[['RESET',()=>{state=fresh();save();selected=-1;home()}],['CANCEL',()=>{}]]);return}save();home();showNotices()}
 function wire(){app.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{const action=el.dataset.action;if(action==='back'){if(view==='game'||view==='planet')home();else if(EMBEDDED)window.parent.showCategories();else planet()}else if(action==='exit'&&EMBEDDED)window.parent.showCategories();else if(action==='home')home();else if(action==='play'){state.started=true;save();game();}else if(action==='shop')shop();else if(action==='boosters')boosterShop();else if(action==='help')how();else if(action==='roster')guide();else if(action==='packs')packsScreen();else if(action==='planet')planet();else if(action==='rank')rank();else if(action==='missions')missionScreen();else if(action==='milestones')milestonePage();else if(action==='juice'||action==='ray')useBooster(action);else if(action==='restart')restart();else if(action.startsWith('test-')||action==='reset')testTool(action)}))}
 async function start(){state=load();await fetchVerificationSeed();if(!state||!Array.isArray(state.board)||state.board.length!==37)state=fresh();sync();home();uiTimer=setInterval(()=>{sync();if(document.querySelector('.modal-shade'))return;const old=view;if(old==='home')home();else if(old==='planet')planet()},30000)}
 window.nwGrowingApplyInventory=()=>{if(!state)return;sync();if(view==='game')game();else if(view==='home')home();};
 window.nwGrowingNavigateBack=()=>{if(view==='game'||view!=='home'){if(modalActive){document.querySelector('.modal-shade')?.remove();modalActive=false;}home();return true;}return false;};
 return{start,getState:()=>structuredClone(state),engine:E};
})();
APP.start();
