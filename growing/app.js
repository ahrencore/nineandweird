'use strict';
const APP=(()=>{
 const E=HexEngine,EMBEDDED=window.parent!==window&&typeof window.parent.nwGrowingUserId==='function',KEY=EMBEDDED?'nw-growing-live-v1:'+window.parent.nwGrowingUserId():'nw-growing-live-standalone-v1';
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
 const img=(lvl)=>`<img src="assets/${artFiles[lvl-1]}.png" alt="${names[lvl-1]}">`;
 const fmt=n=>Number(n||0).toLocaleString('en-US');
 function load(){try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('Offline save unavailable',e)}}
 function fresh(){const b=E.initial();return{board:b,queue:E.nextQueue(b),natural:100,bonus:0,nextRegen:0,diamonds:EMBEDDED?window.parent.nwDiamondBalance():0,juice:1,ray:1,score:0,total:0,claimed:[],notices:[],highest:Math.max(...b),discovered:[...new Set(b.filter(Boolean))],lastAt:Date.now(),gameOver:false,testOffset:0,weekId:weekId(Date.now()),boardWeekId:weekId(Date.now()),packs:[],started:false,daily:{date:todayUTC(Date.now()),battles:0,worlds:0,merges:0,spent:0,played:0,claimed:[]}}}
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
  for(const receipt of window.parent.nwPrizeTransferReceipts('tg')){
   if(applied.has(receipt.id)&&typeof window.parent.nwPrizeAckTransfer==='function')window.parent.nwPrizeAckTransfer(receipt.id);
  }
 }
 function sync(){const t=now();if(!state)state=fresh();if(!state.daily||state.daily.date!==todayUTC(t))state.daily={date:todayUTC(t),battles:0,worlds:0,merges:0,spent:0,played:0,claimed:[]};if(weekId(t)!==state.weekId||state.boardWeekId!==weekId(t)){
  const newWeek=weekId(t),board=E.initial();
  state.weekId=newWeek;state.boardWeekId=newWeek;
  state.board=board;state.queue=E.nextQueue(board);
  state.score=0;state.claimed=[];state.packs=[];
  state.highest=Math.max(...board);state.discovered=[...new Set(board.filter(Boolean))];
  state.gameOver=false;state.started=false;
  selected=-1;route=[];hover=-1;previewBoard=null;mergeGlow=[];locked=false;turnNote='';
 }applyInventory();if(EMBEDDED){const o=window.parent.nwRead(window.parent.nwGrowingActivityKey(),{});state.daily.battles=Math.max(state.daily.battles||0,Number(o.battles)||0);state.daily.worlds=Math.max(state.daily.worlds||0,Number(o.worlds)||0);state.daily.played=Math.max(state.daily.played||0,Number(o.played)||0);state.diamonds=window.parent.nwDiamondBalance();}if(state.natural<100&&state.nextRegen&&t>=state.nextRegen){const count=Math.min(100-state.natural,1+Math.floor((t-state.nextRegen)/300000));state.natural+=count;state.nextRegen=state.natural===100?0:state.nextRegen+count*300000}save()}
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
 <div class="growing-class-photo-wrap"><div class="growing-smoke" aria-hidden="true"><i></i><i></i><i></i><i></i></div><img class="growing-class-photo" src="assets/uglies_class_photo.png" alt="All twenty Ugly Little Things together on two benches"></div>
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
   if(!energy()){turnNote='No Energy left; visit Get Energy.';game();return}
   const result=E.move(state.board,state.queue,from,to);
   if(!result.ok){turnNote='No unobstructed path to that hex. Zero Energy spent.';game();return}
   locked=true;spend();state.board=result.board;state.queue=result.queue;state.gameOver=result.gameOver;points(result.merges);state.daily.merges+=result.merges.length;if(EMBEDDED&&live()&&state.score>0)void window.parent.nwLbSubmit('tg',state.score).catch(e=>console.warn('Growing rank sync:',e.message));
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
 function useBooster(kind){sync();if(!state[kind]){overlay('NO BOOSTERS',`<p>You have no ${kind==='juice'?'Mutation Juice':'Shrink Ray'} left.</p>`,[['SHOP',()=>shop('boost')],['CLOSE',()=>{}]]);return}const result=kind==='juice'?E.juice(state.board):E.shrink(state.board);if(!result||((kind==='juice')&&!result.merges.length)){overlay('NO EFFECT',`<p>${kind==='juice'?'You need at least four creatures of one level anywhere on the board.':'You must have at least four creatures on the board.'} The item was not consumed.</p>`);return}overlay(kind==='juice'?'MUTATION JUICE':'SHRINK RAY',`<p>${kind==='juice'?`Merge same-level creatures anywhere. ${result.merges.length} merge(s) available.`:'Remove exactly the three lowest-level creatures for ZERO points.'}</p>`,[['USE BOOSTER',()=>{const fresh=kind==='juice'?E.juice(state.board):E.shrink(state.board);if(!fresh)return;state.board=fresh.board;state[kind]--;if(kind==='juice')points(fresh.merges);state.gameOver=false;turnNote='Booster used. Keep growing!';save();game();showNotices()}],['CANCEL',()=>{}]])}
 function restart(){overlay('RESTART BOARD?',`<p>The current 37-hex arrangement will be replaced. Your earned score, Diamonds, Energy, discoveries and milestones remain untouched.</p>`,[['RESTART',()=>{state.board=E.initial();state.queue=E.nextQueue(state.board);state.gameOver=false;selected=-1;turnNote='Fresh board!';save();game()}],['CANCEL',()=>{}]])}
 function shop(kind='energy'){sync();const list=kind==='energy'?[['energy',10,100],['juice',1,100],['ray',1,80]]:[['juice',1,100],['ray',1,80],['energy',10,100]];overlay(kind==='boost'?'BOOSTER SHOP':'GET ENERGY',`<p class="hint">💎 ${fmt(state.diamonds)}</p>${list.map(([k,n,c])=>`<div class="item"><div><strong>${itemIcon(k)} ${n} ${k}</strong><small></small></div><button class="btn" data-buy="${k}" data-count="${n}" data-cost="${c}">💎 ${c}</button></div>`).join('')}<h3 style="color:#e5a6ff">PREMIUM PACKS</h3><div class="hint"></div>`,[['VIEW PACKS',packsScreen],['CLOSE',()=>{}]]);const m=document.querySelector('.modal-shade');m.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const type=b.dataset.buy,n=+b.dataset.count,c=+b.dataset.cost;if(state.diamonds<c){m.remove();modalActive=false;overlay('NOT ENOUGH DIAMONDS','<p>Not enough Diamonds.</p>');return}if(EMBEDDED){if(!window.parent.nwGrowingAdjustDiamonds(-c))return;state.diamonds=window.parent.nwDiamondBalance();}else state.diamonds-=c;grant(type,n);announce(`PURCHASE RECEIVED`,[[type,n]]);save();m.remove();modalActive=false;if(view==='game')game();else home();showNotices()})}
 function packsScreen(){overlay('PREMIUM PACKS',`<div class="pack-grid">${packs.map((p,i)=>`<div class="pack-card"><span class="pack-tag">PACK ${i+1}</span><strong>${p.items.map(([k,n])=>`<span>${itemIcon(k)} ×${n}</span>`).join('')}</strong><button class="btn" disabled>${p.price}</button><small>COMING SOON</small></div>`).join('')}</div>`)}
 function boosterShop(){shop('boost')}

 function milestonePage(){overlay('MILESTONE REWARDS',`<p>Weekly score: <b>${fmt(state.score)}</b></p>${rewardTrack()}`)}
 function rank(){
 sync();
 if(state.score<2000){overlay('RANKINGS LOCKED','<p>Earn 2,000 points to unlock the leaderboard!</p>');return;}
 overlay('RANKINGS','<div id="nwLbTG">Connecting to rankings…</div>');
 (async()=>{if(!EMBEDDED)throw Error('Online rankings require the main Nine & Weird game.');if(live())await window.parent.nwLbSubmit('tg',state.score);const rows=await window.parent.nwLbRank('tg'),el=document.getElementById('nwLbTG');if(el)el.innerHTML=window.parent.nwLbMarkup(rows,'tg');})().catch(e=>{const el=document.getElementById('nwLbTG');if(el)el.textContent='Leaderboard unavailable: '+e.message;});
}
 function missionScreen(){
  sync();const d=state.daily;
  const ordered=[...dailyMissions].sort((a,b)=>{const rank=m=>d.claimed.includes(m.id)?2:(d[m.kind]||0)>=m.goal?0:1;return rank(a)-rank(b)||dailyMissions.indexOf(a)-dailyMissions.indexOf(b)});
  const rows=ordered.map(m=>{const v=Math.min(m.goal,d[m.kind]||0),done=v>=m.goal,claimed=d.claimed.includes(m.id);return `<div class="mission-row ${done&&!claimed?'ready-to-claim':''}"><div class="mission-main"><b>${m.label}</b><small>${v} / ${m.goal}</small><div class="mission-meter"><i style="width:${v/m.goal*100}%"></i></div></div><div class="mission-claim"><span>ϟ +${m.reward}</span><button class="btn mini-claim" data-claim="${m.id}" ${!done||claimed?'disabled':''}>${claimed?'CLAIMED':done?'CLAIM':'LOCKED'}</button></div></div>`}).join('');
  overlay('DAILY MISSIONS',`<p class="hint">DAILY RESET · 00:00 UTC</p><div class="mission-list">${rows}</div>`,[['CLOSE',()=>{}]]);
  const popup=document.querySelector('.modal-shade');popup.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const m=dailyMissions.find(x=>x.id===b.dataset.claim);if(!m||state.daily.claimed.includes(m.id)||(state.daily[m.kind]||0)<m.goal)return;state.daily.claimed.push(m.id);grant('energy',m.reward);save();popup.remove();modalActive=false;if(view==='game')game();else home();missionScreen()});
 }

 function planet(){view='planet';app.innerHTML=top()+`<h1 class="title">EVENT GALAXY</h1><div class="planet"><span>THEY'RE<br>GROWING!</span></div><p class="center" style="color:var(--lime)">${live()?'NOW LIVE: TUE – THU':'COMING SOON: TUE – THU'}</p><p class="muted">The orbit glows for the live period. Your event planet is also available in the main game's Events carousel.</p>${btn('OPEN EVENT','home','main')}`;wire()}
 function testTool(which){if(which==='test-points'){state.score+=5000;for(const [at,k,n] of rewards)if(state.score>=at&&!state.claimed.includes(at)){state.claimed.push(at);grant(k,n);announce(`MILESTONE ${fmt(at)}!`,[[k,n]])}}if(which==='test-energy')grant('energy',50);if(which==='test-energy500')grant('energy',500);if(which==='test-week'){state.testOffset+=7*86400000;sync()}if(which==='test-merge'){state.board=Array(37).fill(0);[16,17,18].forEach(i=>state.board[i]=2);state.board[12]=2;state.board[24]=3;state.queue=[1,1,2,2];state.gameOver=false;turnNote='Test setup: move Level 2 into a connected cluster to merge.'}if(which==='test-path'){state.board=Array(37).fill(0);state.board[3]=1;[4,10,11,12,17,18,24,25,26].forEach(i=>state.board[i]=3);state.queue=[1,1,1,2];state.gameOver=false;turnNote='Test setup: try winding an unblocked path around obstacles.'}if(which==='test-full'){state.board=Array(37).fill(0);for(let i=0;i<34;i++)state.board[i]=i%3+1;state.board[0]=4;state.board[1]=0;state.board[34]=2;state.board[35]=0;state.board[36]=0;state.queue=[1,2,3,1];state.gameOver=false;turnNote='Test setup: fewer than four spawning spaces should cause recoverable Game Over.'}if(which==='reset'){overlay('RESET OFFLINE DATA?',`<p>Delete only They're Growing! local beta progress for this account?</p>`,[['RESET',()=>{localStorage.removeItem(KEY);state=fresh();selected=-1;home()}],['CANCEL',()=>{}]]);return}save();home();showNotices()}
 function wire(){app.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{const action=el.dataset.action;if(action==='back'){if(view==='game'||view==='planet')home();else if(EMBEDDED)window.parent.showCategories();else planet()}else if(action==='exit'&&EMBEDDED)window.parent.showCategories();else if(action==='home')home();else if(action==='play'){state.started=true;save();game();}else if(action==='shop')shop();else if(action==='boosters')boosterShop();else if(action==='help')how();else if(action==='roster')guide();else if(action==='packs')packsScreen();else if(action==='planet')planet();else if(action==='rank')rank();else if(action==='missions')missionScreen();else if(action==='milestones')milestonePage();else if(action==='juice'||action==='ray')useBooster(action);else if(action==='restart')restart();else if(action.startsWith('test-')||action==='reset')testTool(action)}))}
 function start(){state=load()||fresh();if(!Array.isArray(state.board)||state.board.length!==37)state=fresh();sync();home();uiTimer=setInterval(()=>{sync();if(document.querySelector('.modal-shade'))return;const old=view;if(old==='home')home();else if(old==='planet')planet()},30000)}
 window.nwGrowingApplyInventory=()=>{if(!state)return;sync();if(view==='game')game();else if(view==='home')home();};
 window.nwGrowingNavigateBack=()=>{if(view==='game'||view!=='home'){if(modalActive){document.querySelector('.modal-shade')?.remove();modalActive=false;}home();return true;}return false;};
 return{start,getState:()=>structuredClone(state),engine:E};
})();
APP.start();
