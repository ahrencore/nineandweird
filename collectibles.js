/* Nine & Weird Collectibles: presentation only. No earning, storage, or rewards. */
function nwCollectibleWorldIds(){
 return nwGalaxyOrder.filter(function(id){return id!=='classic'&&id!=='dark'&&!!worlds[id]&&!!nwTripleArtFiles[id]&&nwTripleArtFiles[id][1].length===9;});
}
// Fixed album position rarity: 1–2=1☆, 3–4=2☆, 5–6=3☆, 7–8=4☆, 9=5☆.
function nwCollectibleRarityStars(piece){return '☆'.repeat(Math.min(5,Math.ceil(piece/2)));}
function nwCollectiblePieceName(filename){
 return filename.replace(/^\d+_/,'').replace(/\.png$/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
}
function nwCollectiblePlanet(id,i){
 const w=worlds[id],pair=nwTripleArtFiles[id],colors=nwGalaxyColors[id]||['#141A33','#8E83BE','#F8EBDD'];
 const bg=colors[0],accent=colors[1],ink=colors[2],label=w.name;
 const symbols=pair[1].map(function(file,index){const num=nwCollectibleCount(id,index+1);return '<span class="nw-collect-planet-item"><img class="'+(num?'':'nw-collectible-unowned')+'" src="'+pair[0]+file+'" alt="" loading="lazy" draggable="false"></span>';}).join('');
 const arc='<svg class="nw-planet-orbit" viewBox="0 0 180 180" aria-hidden="true"><defs><path id="nwCollectPlanetArc'+i+'" d="M 8,90 A 82,82 0 0,0 172,90"/></defs><circle cx="90" cy="90" r="75" fill="none" stroke="'+accent+'" opacity=".35" stroke-width=".8"/><circle cx="147" cy="41" r="3.4" fill="'+accent+'"/><path d="M27 20v9m-4.5-4.5h9" stroke="'+accent+'" stroke-width="1.2" stroke-linecap="round"/><text fill="'+accent+'" font-size="'+(label.length>26?10.2:label.length>20?11.2:12.5)+'" font-weight="700"><textPath href="#nwCollectPlanetArc'+i+'" startOffset="50%" text-anchor="middle">'+nwEscape(label)+'</textPath></text></svg>';
 return '<button type="button" class="nw-planet nw-collectible-planet '+(nwCollectibleUnseen.includes(id)?'nw-notification-orbit':'')+'" data-nw-collectible-world="'+id+'" aria-label="View '+nwEscape(label)+' collection" style="--planet-bg:'+bg+';--planet-accent:'+accent+';--planet-ink:'+ink+'"><span class="nw-planet-disc"><span class="nw-planet-pieces">'+symbols+'</span></span>'+arc+'</button>';
}

let nwCollectibleState={pieces:[],inbox:[],friends:[],unseen:[],sent_today:0};
let nwCollectibleGalleryScroll=0,nwCollectibleAlbumScroll=0,nwCollectibleLastAlbum=null,nwCollectibleUnseen=[];
let nwCollectibleLoading=null,nwCollectibleNoticeCheck=0,nwCollectibleAccount=null;
function nwCollectibleCount(world,piece){const row=(nwCollectibleState.pieces||[]).find(function(p){return p.world===world&&p.piece===piece;});return row?Number(row.copies)||0:0;}
function nwCollectibleScrollElement(){return nwScrollTarget();}
function nwCollectibleRestore(pos){requestAnimationFrame(function(){requestAnimationFrame(function(){const t=nwCollectibleScrollElement();t.scrollTop=Math.min(Math.max(0,pos),Math.max(0,t.scrollHeight-t.clientHeight));});});}
async function nwCollectibleLoad(redraw){
 const account=nwCloud.user();if(!account||account.is_anonymous)return;
 if(nwCollectibleLoading)return nwCollectibleLoading;
 nwCollectibleLoading=(async function(){
  const c=await nwCloud.get();const res=await c.rpc('nw_collectible_snapshot');
  if(res.error)throw Error(res.error.message);
  if(nwCloud.user()?.id!==account.id)return;
  nwCollectibleState=res.data||{pieces:[],inbox:[],friends:[],unseen:[],sent_today:0};
  nwCollectibleUnseen=nwCollectibleState.unseen||[];
  nwCollectibleUpdateNotice();
  if(redraw&&evRoot.classList.contains('nw-collectibles-theme')&&!evRoot.classList.contains('nw-collectible-detail-theme')&&!evRoot.querySelector('.nw-collectibles-coming')&&!evRoot.classList.contains('nw-capsule-shop-theme')&&!evRoot.querySelector('[data-nw-trade-inbox]')){
   const t=nwCollectibleScrollElement(),y=t.scrollTop;nwCollectibleGalleryScroll=y;nwShowCollectibles();nwCollectibleRestore(y);
  }
 })().finally(function(){nwCollectibleLoading=null;});
 return nwCollectibleLoading;
}
function nwCollectibleUpdateNotice(){
 const incoming=(nwCollectibleState.inbox||[]).length>0;
 const btn=evRoot.querySelector('#nwCollectibles');
 if(btn){
  const active=incoming||(nwCollectibleState.unseen||[]).length>0;
  btn.classList.toggle('nw-notification-orbit',active);
  btn.classList.toggle('nw-mail-unclaimed',active);
 }
 const trade=evRoot.querySelector('[data-nw-collectible-action="trade"]');
 if(trade)trade.classList.toggle('nw-notification-orbit',incoming);
}
async function nwCollectibleRefreshNotice(force){
 const acc=nwCloud?.user();if(!acc||acc.is_anonymous)return;
 if(nwCollectibleAccount!==acc.id){nwCollectibleAccount=acc.id;nwCollectibleState={pieces:[],inbox:[],friends:[],unseen:[],sent_today:0};nwCollectibleGalleryScroll=0;nwCollectibleAlbumScroll=0;}
 if(!force&&Date.now()-nwCollectibleNoticeCheck<30000){nwCollectibleUpdateNotice();return;}
 nwCollectibleNoticeCheck=Date.now();
 try{await nwCollectibleLoad(false);}catch(e){console.warn('Collectibles update',e.message);}
}
async function nwCollectibleSeen(world){
 try{const c=await nwCloud.get();const r=await c.rpc('nw_collectible_seen',{p_world:world});if(r.error)throw Error(r.error.message);nwCollectibleState.unseen=(nwCollectibleState.unseen||[]).filter(function(id){return id!==world;});nwCollectibleUnseen=nwCollectibleState.unseen; nwCollectibleUpdateNotice();}catch(e){console.warn('Collectible seen',e.message);}
}
function nwCollectiblePhoto(p){
 // Match the established equipped-frame markup: the monthly orbit CSS targets
 // .nw-monthly-art-frame and .nw-equipped-art, not the static Friends thumbnail.
 const allowed=['usual','weird',...nwSeasonFrameTiers.map(function(t){return 'monthly-'+t.wins;})];
 const id=allowed.includes(p.frame)?p.frame:'usual';
 const src=id==='usual'?'frames/nw-free-usual.png?v=42':id==='weird'?'frames/nw-free-weird.png?v=42':'frames/nw-'+id+'.png';
 return '<span class="nw-collect-profile-photo nw-double-invite-row"><span class="nw-equipped-frame '+(id.startsWith('monthly-')?'nw-monthly-art-frame':'')+'">'+nwAvatarImg(p.avatar,'nw-equipped-avatar')+'<img class="nw-equipped-art" src="'+nwEscape(src)+'" alt=""></span></span>';
}
function nwCollectibleAsset(world,piece){const pair=nwTripleArtFiles[world];return pair&&piece>=1&&piece<=9?pair[0]+pair[1][piece-1]:'';}
function nwCollectiblePieceLabel(world,piece){const pair=nwTripleArtFiles[world];if(!pair||piece<1||piece>9)return '';if(world==='cakefail')return ['PIPING BAG DISASTER','OVERFLOWING CUPCAKE','RUNAWAY STRAWBERRY','FROSTING SPATULA','SPILLED SPRINKLES','SQUASHED FROSTING FLOWERS','OVERFLOWING MIXING BOWL','MELTING STRIPED CANDLE','COLLAPSING CHERRY CAKE'][piece-1];if(world==='baggagehell'&&piece===5)return 'LEAKING PURPLE GOO';return nwCollectiblePieceName(pair[1][piece-1]);}
function nwCollectibleBackAlbum(world){nwShowCollectibleWorld(world);nwCollectibleRestore(nwCollectibleAlbumScroll);}
function nwShowCollectiblePiece(world,index){
 const piece=index+1,count=nwCollectibleCount(world,piece),name=nwCollectiblePieceLabel(world,piece);
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectible-detail-theme','nw-collectible-piece-view');
 const colors=nwGalaxyColors[world]||['#141A33','#8E83BE','#F8EBDD'];
 const speed=18+((piece-1)%4)*3.5;
 const orbit='<div class="nw-collectible-piece nw-collectible-inspect" style="--piece-index:'+(piece-1)+';--orbit-time:'+speed+'s"><div class="nw-collectible-float"><span class="nw-collectible-piece-disc"><img src="'+nwCollectibleAsset(world,piece)+'" class="nw-collectible-piece-image '+(count?'':'nw-collectible-unowned')+'" alt="" draggable="false"></span>'+(count>1?'<span class="nw-collectible-duplicates">+'+(count-1)+'</span>':'')+'</div><svg class="nw-collectible-name-orbit" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="nwCollectInspectOrbit" d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0"/></defs><circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 5"/><text font-size="'+(name.length>24?7:name.length>18?8:9)+'" fill="currentColor" letter-spacing=".3"><textPath href="#nwCollectInspectOrbit" startOffset="0%">'+nwEscape(name)+' '+nwCollectibleRarityStars(piece)+'</textPath></text></svg></div>';
 evDisplay(evHeader(name,function(){nwCollectibleBackAlbum(world);},true)+'<section class="nw-collect-panel" style="--collect-bg:'+colors[0]+';--collect-accent:'+colors[1]+';--collect-ink:'+colors[2]+'"><p>'+nwEscape(worlds[world].name)+'</p><div class="nw-collect-panel-art">'+orbit+'</div>'+(count>1?'<strong class="nw-collect-extra">+'+(count-1)+' EXTRA</strong>':'')+'<button type="button" data-nw-send '+(count<=1?'disabled':'')+'>SEND</button><button type="button" data-nw-back>BACK</button><p class="nw-collect-error" role="status"></p></section>');
 evRoot.querySelector('[data-nw-back]').onclick=function(){nwCollectibleBackAlbum(world);};
 evRoot.querySelector('[data-nw-send]').onclick=function(){void nwCollectibleFriends(world,piece);};
 nwResetViewToTop();
}
async function nwCollectibleFriends(world,piece){
 try{await nwCollectibleLoad(false);}catch(e){nwCollectibleError(e);return;}
 if(nwCollectibleCount(world,piece)<2){nwShowCollectiblePiece(world,piece-1);return;}
 const friends=nwCollectibleState.friends||[],left=Math.max(0,5-Number(nwCollectibleState.sent_today||0));
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectible-send-theme');
 evDisplay(evHeader('SEND A PIECE',function(){nwShowCollectiblePiece(world,piece-1);},true)+'<section class="nw-collect-send"><h2>SEND A PIECE</h2><p>'+left+' / 5 sends left today</p><div class="nw-collect-friends">'+(friends.length?friends.map(function(f){return '<button type="button" data-nw-friend="'+nwEscape(f.id)+'" '+(left?'':'disabled')+'>'+nwCollectiblePhoto(f)+'<strong>'+nwEscape(f.name)+'</strong><span>›</span></button>';}).join(''):'<p>No friends available to send to.</p>')+'</div><p class="nw-collect-error" role="status"></p></section>');
 evRoot.querySelectorAll('[data-nw-friend]').forEach(function(b){b.onclick=function(){void nwCollectibleConfirm(world,piece,b.dataset.nwFriend);};});
 nwResetViewToTop();
}
async function nwCollectibleConfirm(world,piece,target){
 const friend=(nwCollectibleState.friends||[]).find(function(p){return p.id===target;});if(!friend)return;
 if(!window.confirm('Send '+nwCollectiblePieceLabel(world,piece)+' to '+friend.name+'? This uses 1 of your 5 daily sends.'))return;
 const buttons=evRoot.querySelectorAll('[data-nw-friend]');buttons.forEach(function(b){b.disabled=true;});
 try{const c=await nwCloud.get();const r=await c.rpc('nw_collectible_send',{p_world:world,p_piece:piece,p_target:target});if(r.error)throw Error(r.error.message);await nwCollectibleLoad(false);nwShowCollectiblePiece(world,piece-1);}
 catch(e){nwCollectibleError(e);buttons.forEach(function(b){b.disabled=false;});}
}
function nwCollectibleError(e){const el=evRoot.querySelector('.nw-collect-error');if(el)el.textContent=e.message||String(e);}
async function nwCollectibleInbox(){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectibles-inbox-theme');
 evDisplay(evHeader('TRADE',nwShowCollectibles,true)+'<section class="nw-collect-inbox" data-nw-trade-inbox><p>Loading received pieces...</p></section>');
 try{await nwCollectibleLoad(false);if(!evRoot.querySelector('[data-nw-trade-inbox]'))return;const inbox=nwCollectibleState.inbox||[],el=evRoot.querySelector('[data-nw-trade-inbox]');
 el.innerHTML=inbox.length?inbox.map(function(g){return '<article class="nw-collect-inbox-item">'+nwCollectiblePhoto(g)+'<div class="nw-collect-inbox-copy"><p>You have received a piece from <strong>'+nwEscape(g.name||'a friend')+'!</strong></p><img src="'+nwCollectibleAsset(g.world,g.piece)+'" alt="'+nwEscape(nwCollectiblePieceLabel(g.world,g.piece))+'"><small>'+nwEscape(nwCollectiblePieceLabel(g.world,g.piece))+'</small><button type="button" data-nw-claim="'+nwEscape(g.id)+'">CLAIM</button></div></article>';}).join(''):'<p class="nw-collect-empty">You have no new trade at the moment.</p>';
 el.innerHTML+='<p class="nw-collect-error" role="status"></p>';
 el.querySelectorAll('[data-nw-claim]').forEach(function(b){b.onclick=function(){void nwCollectibleClaim(b.dataset.nwClaim);};});
 }catch(e){nwCollectibleError(e);}
}
async function nwCollectibleClaim(id){
 const buttons=evRoot.querySelectorAll('[data-nw-claim]');buttons.forEach(function(b){b.disabled=true;});
 try{const c=await nwCloud.get();const r=await c.rpc('nw_collectible_claim',{p_id:id});if(r.error)throw Error(r.error.message);const prize=r.data;await nwCollectibleLoad(false);nwCollectibleCongrats(prize);}
 catch(e){nwCollectibleError(e);buttons.forEach(function(b){b.disabled=false;});}
}
function nwCollectibleCongrats(prize){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectibles-congrats-theme');
 evDisplay(evHeader('TRADE',nwCollectibleInbox,true)+'<section class="nw-collect-congrats"><h2>CONGRATS!</h2><p>'+(prize.is_new?'You have a new piece!':'You got an extra piece!')+'</p><img src="'+nwCollectibleAsset(prize.world,prize.piece)+'" alt=""><strong>'+nwEscape(nwCollectiblePieceLabel(prize.world,prize.piece))+'</strong><button type="button" data-nw-awesome>AWESOME!</button></section>');
 evRoot.querySelector('[data-nw-awesome]').onclick=nwCollectibleInbox;nwResetViewToTop();
}

function nwShowCollectibles(){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme');
 const ids=nwCollectibleWorldIds();
 nwCollectibleGalleryScroll=nwCollectibleGalleryScroll||0;
 evDisplay(evHeader('COLLECTIBLES',showCategories,true)+'<nav class="nw-collectibles-actions" aria-label="Collectibles actions"><button type="button" data-nw-collectible-action="trade" class="'+((nwCollectibleState.inbox||[]).length?'nw-notification-orbit':'')+'">TRADE</button><button type="button" data-nw-collectible-action="buy">BUY</button></nav><div class="world-grid world-list nw-planet-grid nw-collectibles-planets">'+ids.map(nwCollectiblePlanet).join('')+'</div>');
 evRoot.querySelectorAll('[data-nw-collectible-world]').forEach(function(button){button.onclick=function(){nwCollectibleGalleryScroll=nwCollectibleScrollElement().scrollTop;nwShowCollectibleWorld(button.dataset.nwCollectibleWorld);};});
 evRoot.querySelectorAll('[data-nw-collectible-action]').forEach(function(button){button.onclick=function(){if(button.dataset.nwCollectibleAction==='trade')void nwCollectibleInbox();else nwCollectibleBuyPage();};});
 nwCollectibleRestore(nwCollectibleGalleryScroll);
 void nwCollectibleLoad(true).catch(function(e){console.warn('Collectibles gallery',e.message);});
}
function nwShowCollectibleWorld(id){
 if(!nwCollectibleWorldIds().includes(id)){nwShowCollectibles();return;}
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectible-detail-theme');
 const colors=nwGalaxyColors[id]||['#141A33','#8E83BE','#F8EBDD'];
 const folder=nwTripleArtFiles[id][0],files=nwTripleArtFiles[id][1];
 nwCollectibleLastAlbum=id;
 const pieces=files.map(function(filename,i){
  const name=id==='cakefail'?["PIPING BAG DISASTER","OVERFLOWING CUPCAKE","RUNAWAY STRAWBERRY","FROSTING SPATULA","SPILLED SPRINKLES","SQUASHED FROSTING FLOWERS","OVERFLOWING MIXING BOWL","MELTING STRIPED CANDLE","COLLAPSING CHERRY CAKE"][i]:id==='baggagehell'&&i===4?'LEAKING PURPLE GOO':nwCollectiblePieceName(filename),speed=18+(i%4)*3.5;
  const count=nwCollectibleCount(id,i+1);
  return '<button type="button" data-nw-piece="'+i+'" class="nw-collectible-piece" style="--piece-index:'+i+';--orbit-time:'+speed+'s" aria-label="'+nwEscape(name)+', '+(count?count+' owned':'not collected')+'">'
    +'<div class="nw-collectible-float"><span class="nw-collectible-piece-disc"><img src="'+folder+filename+'" alt="" class="nw-collectible-piece-image '+(count?'':'nw-collectible-unowned')+'" draggable="false" loading="lazy"></span>'+(count>1?'<span class="nw-collectible-duplicates">+'+(count-1)+'</span>':'')+'</div>'
    +'<svg class="nw-collectible-name-orbit" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="nwCollectPieceOrbit'+i+'" d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0"/></defs><circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 5"/><text font-size="'+(name.length>24?7:name.length>18?8:9)+'" fill="currentColor" letter-spacing=".3"><textPath href="#nwCollectPieceOrbit'+i+'" startOffset="0%">'+nwEscape(name)+' '+nwCollectibleRarityStars(i+1)+'</textPath></text></svg>'
    +'</button>';
 }).join('');
 evDisplay(evHeader(worlds[id].name,nwShowCollectibles,true)+'<section class="nw-collectible-detail" style="--collect-bg:'+colors[0]+';--collect-accent:'+colors[1]+';--collect-ink:'+colors[2]+'"><div class="nw-collectible-detail-top"><strong>0 / 9 COLLECTED</strong></div><div class="nw-collectible-piece-grid">'+pieces+'</div><p class="nw-collectible-detail-note">Your collection is waiting to begin.</p></section>');
 evRoot.querySelectorAll('[data-nw-piece]').forEach(function(b){b.onclick=function(){nwCollectibleAlbumScroll=nwCollectibleScrollElement().scrollTop;nwShowCollectiblePiece(id,Number(b.dataset.nwPiece));};});
 nwResetViewToTop();
 if(nwCollectibleUnseen.includes(id))void nwCollectibleSeen(id);
}

function nwShowCollectibleComingSoon(action){
 if(action!=='trade'&&action!=='buy'){nwShowCollectibles();return;}
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectibles-coming-theme');
 const title=action==='trade'?'TRADE':'BUY';
 const detail=action==='trade'?'Cards your friends send you will appear here.':'Blind boxes containing collectible World pieces will be available here.';
 evDisplay(evHeader(title,nwShowCollectibles,true)+'<section class="nw-collectibles-coming"><span aria-hidden="true">✧ ✦ ✧</span><h2>COMING SOON</h2><p>'+detail+'</p></section>');
 nwResetViewToTop();
}


// Server-confirmed capsule shop; random outcomes and Diamond balances are server-owned.
const nwCapsuleTiers=[
 {id:'common',name:'COMMON',stars:1,price:300,color:'#FF4F9B'},
 {id:'uncommon',name:'UNCOMMON',stars:2,price:500,color:'#77C98D'},
 {id:'rare',name:'RARE',stars:3,price:700,color:'#58C8FF'},
 {id:'epic',name:'EPIC',stars:4,price:1000,color:'#7D4DFF'},
 {id:'legendary',name:'LEGENDARY',stars:5,price:1500,color:'#F2C14E'},
 {id:'mystery',name:'MYSTERY',stars:0,price:750,color:'#A6EAFC'}
];
let nwCapsuleSelectedTier='common',nwCapsulePurchasing=false;
function nwCapsuleDemoSvg(tier){
 const cfg=nwCapsuleTiers.find(function(t){return t.id===tier;})||nwCapsuleTiers[0];
 return '<div class="nw-capsule-visual '+(cfg.id==='mystery'?'nw-capsule-icy':'')+'" style="--capsule-color:'+cfg.color+'">'
 +'<svg class="nw-capsule-svg" viewBox="0 0 200 200" width="150" height="150" role="img" aria-label="'+nwEscape(cfg.name)+' matte capsule">'
 +'<g class="nw-capsule-pod">'
 +'<path class="nw-capsule-base" d="M25 100 A75 75 0 0 0 175 100 Z" fill="var(--capsule-color)" stroke="#2b1929" stroke-width="5"/>'
 +'<g class="nw-capsule-lid"><path d="M25 100 A75 75 0 0 1 175 100 Z" fill="var(--capsule-color)" stroke="#2b1929" stroke-width="5"/><path d="M25 100H175" stroke="#2b1929" stroke-width="4"/></g>'
 +'<circle class="nw-capsule-outline" cx="100" cy="100" r="75" fill="none" stroke="#2b1929" stroke-width="5"/>'
 +'</g></svg><span class="nw-capsule-spark-orbit" aria-hidden="true"><i></i></span>'
 +(cfg.id==='mystery'?'<span class="nw-capsule-frost" aria-hidden="true"></span>':'')+'</div>';
}
function nwCollectibleBuyPage(tab){
 const market=tab==='market';
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-capsule-shop-theme');
 const tabs='<div class="nw-capsule-tabs" role="group" aria-label="Buy sections"><button type="button" data-nw-buytab="capsules" class="'+(!market?'selected':'')+'">CAPSULE STORE</button><button type="button" data-nw-buytab="market" class="'+(market?'selected':'')+'">PLAYER MARKETPLACE</button></div>';
 const cards=nwCapsuleTiers.map(function(t){return '<article class="nw-capsule-tier-card"><div class="nw-capsule-tier-art">'+nwCapsuleDemoSvg(t.id)+'</div><h3>'+t.name+'</h3><div class="nw-capsule-tier-stars">'+(t.stars?'☆'.repeat(t.stars):'☆☆–☆☆☆☆☆')+'</div><div class="nw-capsule-tier-price">'+nwDiamondAmount(t.price.toLocaleString())+'</div><button type="button" data-nw-tier="'+t.id+'">BUY</button></article>';}).join('');
 const content=market
 ?'<section class="nw-capsule-market"><h2>PLAYER MARKETPLACE</h2><p>Buy and sell extra collectible pieces for Diamonds. Sellers will choose their own prices, up to 5,000 Diamonds.</p><span class="nw-capsule-pill">COMING SOON</span></section>'
 :'<section class="nw-capsule-store"><h2>CAPSULE STORE</h2><p class="nw-capsule-muted">Every capsule contains one random piece from a random World. You cannot choose the World. Duplicates are possible.</p><div class="nw-capsule-tier-grid">'+cards+'</div><p class="nw-capsule-odds">ICY BLUE MYSTERY: 25% each for ☆☆, ☆☆☆, ☆☆☆☆ and ☆☆☆☆☆. No ☆ rewards.</p></section>';
 evDisplay(evHeader('BUY',nwShowCollectibles,true)+'<main class="nw-capsule-shop">'+tabs+content+'</main>');
 evRoot.querySelectorAll('[data-nw-buytab]').forEach(function(b){b.onclick=function(){nwCollectibleBuyPage(b.dataset.nwBuytab==='market'?'market':'capsules');};});
 evRoot.querySelectorAll('[data-nw-tier]').forEach(function(b){b.onclick=function(){nwCapsuleSelectedTier=b.dataset.nwTier;nwCapsuleConfirmPreview();};});
 nwResetViewToTop();
}
function nwCapsuleConfirmPreview(){
 const tier=nwCapsuleTiers.find(function(t){return t.id===nwCapsuleSelectedTier;});if(!tier)return;
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-capsule-shop-theme');
 const mystery=tier.id==='mystery';
 evDisplay(evHeader('CONFIRM CAPSULE',function(){nwCollectibleBuyPage('capsules');},true)
  +'<main class="nw-capsule-shop"><section class="nw-capsule-confirm"><h2>'+tier.name+' CAPSULE</h2>'+nwCapsuleDemoSvg(tier.id)
  +'<p class="nw-capsule-tier-stars">'+(mystery?'☆☆ to ☆☆☆☆☆':'☆'.repeat(tier.stars))+'</p>'
  +'<p>Price: '+nwDiamondAmount(tier.price.toLocaleString())+'</p>'
  +'<p class="nw-capsule-muted">One random World, one random piece. Duplicates possible.'+(mystery?' Each rarity from ☆☆ to ☆☆☆☆☆ has exactly a 25% chance.':'')+'</p>'
  +'<p class="nw-capsule-error" role="alert"></p>'
  +'<div class="nw-capsule-confirm-actions"><button type="button" data-nw-cancel>BACK</button><button type="button" class="nw-capsule-primary" data-nw-buy>CONFIRM PURCHASE</button></div></section></main>');
 evRoot.querySelector('[data-nw-cancel]').onclick=function(){nwCollectibleBuyPage('capsules');};
 evRoot.querySelector('[data-nw-buy]').onclick=function(){void nwCapsuleCompletePurchase(tier);};
 nwResetViewToTop();
}
async function nwCapsuleCompletePurchase(tier){
 if(nwCapsulePurchasing)return;
 const errorEl=evRoot.querySelector('.nw-capsule-error'),buy=evRoot.querySelector('[data-nw-buy]');
 if(!errorEl||!buy)return;
 const uid=nwCloud?.user()?.id;
 if(!uid||nwCloud.user().is_anonymous){errorEl.textContent='Please sign in with a registered account to buy capsules.';return;}
 nwCapsulePurchasing=true;buy.disabled=true;buy.textContent='PURCHASING...';errorEl.textContent='';
 const key='nineweird-capsule-pending:'+uid;
 try{
  const c=await nwCloud.get();
  let pending=null;
  try{pending=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
  if(pending&&pending.tier!==tier.id)throw Error('Please finish your previous capsule purchase first.');
  const request=pending?.request||crypto.randomUUID();
  try{localStorage.setItem(key,JSON.stringify({tier:tier.id,request:request}))}catch(e){}
  const res=await c.rpc('nw_capsule_purchase',{p_tier:tier.id,p_request:request});
  if(res.error)throw Error(res.error.message);
  if(nwCloud.user()?.id!==uid)throw Error('Account changed during purchase');
  try{localStorage.removeItem(key)}catch(e){}
  try{await nwWalletSync()}catch(e){console.warn('Capsule wallet refresh:',e.message)}
  try{await nwCollectibleLoad(false)}catch(e){console.warn('Capsule album refresh:',e.message)}
  nwCapsuleOpenReward(res.data);
 }catch(e){
  const msg=e?.message||'Could not complete purchase';
  if(evRoot.querySelector('.nw-capsule-error'))evRoot.querySelector('.nw-capsule-error').textContent=msg;
  if(evRoot.querySelector('[data-nw-buy]')){evRoot.querySelector('[data-nw-buy]').disabled=false;evRoot.querySelector('[data-nw-buy]').textContent='RETRY PURCHASE';}
 }finally{nwCapsulePurchasing=false;}
}
function nwCapsuleOpenReward(prize){
 if(!prize||!nwCollectibleWorldIds().includes(prize.world)||!(prize.piece>=1&&prize.piece<=9)){nwCollectibleBuyPage('capsules');return;}
 const name=nwCollectiblePieceLabel(prize.world,prize.piece),pic=nwCollectibleAsset(prize.world,prize.piece),tier=nwCapsuleTiers.find(function(t){return t.id===prize.tier;})||nwCapsuleTiers[0];
 const orbitName=nwEscape(name)+' '+nwCollectibleRarityStars(prize.piece);
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-capsule-shop-theme');
 evDisplay(evHeader('CAPSULE OPENING',function(){nwCollectibleBuyPage('capsules');},true)
  +'<main class="nw-capsule-shop"><section class="nw-capsule-opening"><h2>'+tier.name+' CAPSULE</h2>'
  +'<div class="nw-capsule-demo-animation">'+nwCapsuleDemoSvg(tier.id)+'</div>'
  +'<div class="nw-capsule-sample-reveal"><div class="nw-capsule-sample-piece"><img src="'+nwEscape(pic)+'" alt="'+nwEscape(name)+'" draggable="false"><svg viewBox="0 0 160 160" aria-hidden="true"><defs><path id="nwCapsuleSampleArc" d="M80 80m-68 0a68 68 0 1 1 136 0a68 68 0 1 1 -136 0"/></defs><text fill="currentColor" font-size="'+(name.length>20?'8':'10')+'"><textPath href="#nwCapsuleSampleArc">'+orbitName+' · '+orbitName+' ·</textPath></text></svg></div>'
  +'<strong>'+(prize.is_new?'NEW COLLECTIBLE!':'EXTRA PIECE!')+'</strong><p>'+nwEscape(worlds[prize.world].name)+' · '+nwEscape(name)+'</p>'
  +'<button type="button" class="nw-capsule-primary" data-nw-done>AWESOME!</button></div></section></main>');
 evRoot.querySelector('[data-nw-done]').onclick=function(){nwCollectibleBuyPage('capsules');};
 nwResetViewToTop();
}
