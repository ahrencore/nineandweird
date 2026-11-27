/* Nine & Weird Collectibles: presentation only. No earning, storage, or rewards. */
function nwCollectibleWorldIds(){
 return nwGalaxyOrder.filter(function(id){return id!=='classic'&&id!=='dark'&&!!worlds[id]&&!!nwTripleArtFiles[id]&&nwTripleArtFiles[id][1].length===9;});
}
function nwCollectiblePieceName(filename){
 return filename.replace(/^\d+_/,'').replace(/\.png$/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
}
function nwCollectiblePlanet(id,i){
 const w=worlds[id],pair=nwTripleArtFiles[id],colors=nwGalaxyColors[id]||['#141A33','#8E83BE','#F8EBDD'];
 const bg=colors[0],accent=colors[1],ink=colors[2],label=w.name;
 const symbols=pair[1].map(function(file,index){const num=nwCollectibleCount(id,index+1);return '<span class="nw-collect-planet-item"><img class="'+(num?'':'nw-collectible-unowned')+'" src="'+pair[0]+file+'" alt="" loading="lazy" draggable="false">'+(num>1?'<small>+'+(num-1)+'</small>':'')+'</span>';}).join('');
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
  if(redraw&&evRoot.classList.contains('nw-collectibles-theme')&&!evRoot.classList.contains('nw-collectible-detail-theme')&&!evRoot.querySelector('.nw-collectibles-coming')&&!evRoot.querySelector('[data-nw-trade-inbox]')){
   const t=nwCollectibleScrollElement(),y=t.scrollTop;nwCollectibleGalleryScroll=y;nwShowCollectibles();nwCollectibleRestore(y);
  }
 })().finally(function(){nwCollectibleLoading=null;});
 return nwCollectibleLoading;
}
function nwCollectibleUpdateNotice(){
 const btn=evRoot.querySelector('#nwCollectibles');if(!btn)return;
 const active=(nwCollectibleState.inbox||[]).length>0||(nwCollectibleState.unseen||[]).length>0;
 btn.classList.toggle('nw-notification-orbit',active);
 btn.classList.toggle('nw-mail-unclaimed',active);
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
function nwCollectiblePhoto(p){return '<span class="nw-collect-profile-photo">'+nwFriendPhoto(p)+'</span>';}
function nwCollectibleAsset(world,piece){const pair=nwTripleArtFiles[world];return pair&&piece>=1&&piece<=9?pair[0]+pair[1][piece-1]:'';}
function nwCollectiblePieceLabel(world,piece){const pair=nwTripleArtFiles[world];if(!pair||piece<1||piece>9)return '';if(world==='cakefail')return ['PIPING BAG DISASTER','OVERFLOWING CUPCAKE','RUNAWAY STRAWBERRY','FROSTING SPATULA','SPILLED SPRINKLES','SQUASHED FROSTING FLOWERS','OVERFLOWING MIXING BOWL','MELTING STRIPED CANDLE','COLLAPSING CHERRY CAKE'][piece-1];if(world==='baggagehell'&&piece===5)return 'LEAKING PURPLE GOO';return nwCollectiblePieceName(pair[1][piece-1]);}
function nwCollectibleBackAlbum(world){nwShowCollectibleWorld(world);nwCollectibleRestore(nwCollectibleAlbumScroll);}
function nwShowCollectiblePiece(world,index){
 const piece=index+1,count=nwCollectibleCount(world,piece),name=nwCollectiblePieceLabel(world,piece);
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectible-detail-theme','nw-collectible-piece-view');
 evDisplay(evHeader(name,function(){nwCollectibleBackAlbum(world);},true)+'<section class="nw-collect-panel"><h2>'+nwEscape(name)+'</h2><p>'+nwEscape(worlds[world].name)+'</p><div class="nw-collect-panel-art"><img src="'+nwCollectibleAsset(world,piece)+'" class="'+(count?'':'nw-collectible-unowned')+'" alt=""></div>'+(count>1?'<strong class="nw-collect-extra">+'+(count-1)+' EXTRA</strong>':'')+'<button type="button" data-nw-send '+(count<=1?'disabled':'')+'>SEND</button><button type="button" data-nw-back>BACK</button><p class="nw-collect-error" role="status"></p></section>');
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
 evDisplay(evHeader('COLLECTIBLES',showCategories,true)+'<nav class="nw-collectibles-actions" aria-label="Collectibles actions"><button type="button" data-nw-collectible-action="trade">TRADE</button><button type="button" data-nw-collectible-action="buy">BUY</button></nav><div class="world-grid world-list nw-planet-grid nw-collectibles-planets">'+ids.map(nwCollectiblePlanet).join('')+'</div>');
 evRoot.querySelectorAll('[data-nw-collectible-world]').forEach(function(button){button.onclick=function(){nwCollectibleGalleryScroll=nwCollectibleScrollElement().scrollTop;nwShowCollectibleWorld(button.dataset.nwCollectibleWorld);};});
 evRoot.querySelectorAll('[data-nw-collectible-action]').forEach(function(button){button.onclick=function(){if(button.dataset.nwCollectibleAction==='trade')void nwCollectibleInbox();else nwShowCollectibleComingSoon('buy');};});
 nwCollectibleRestore(nwCollectibleGalleryScroll);
 void nwCollectibleLoad(false);
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
    +'<svg class="nw-collectible-name-orbit" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="nwCollectPieceOrbit'+i+'" d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0"/></defs><circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 5"/><text font-size="'+(name.length>24?7:name.length>18?8:9)+'" fill="currentColor" letter-spacing=".3"><textPath href="#nwCollectPieceOrbit'+i+'" startOffset="0%">'+nwEscape(name)+' ✧</textPath></text></svg>'
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
