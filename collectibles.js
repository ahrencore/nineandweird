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
 const symbols=pair[1].map(function(file){return '<img class="nw-collectible-unowned" src="'+pair[0]+file+'" alt="" loading="lazy" draggable="false">';}).join('');
 const arc='<svg class="nw-planet-orbit" viewBox="0 0 180 180" aria-hidden="true"><defs><path id="nwCollectPlanetArc'+i+'" d="M 8,90 A 82,82 0 0,0 172,90"/></defs><circle cx="90" cy="90" r="75" fill="none" stroke="'+accent+'" opacity=".35" stroke-width=".8"/><circle cx="147" cy="41" r="3.4" fill="'+accent+'"/><path d="M27 20v9m-4.5-4.5h9" stroke="'+accent+'" stroke-width="1.2" stroke-linecap="round"/><text fill="'+accent+'" font-size="'+(label.length>26?10.2:label.length>20?11.2:12.5)+'" font-weight="700"><textPath href="#nwCollectPlanetArc'+i+'" startOffset="50%" text-anchor="middle">'+nwEscape(label)+'</textPath></text></svg>';
 return '<button type="button" class="nw-planet nw-collectible-planet" data-nw-collectible-world="'+id+'" aria-label="View '+nwEscape(label)+' collection, 0 of 9 collected" style="--planet-bg:'+bg+';--planet-accent:'+accent+';--planet-ink:'+ink+'"><span class="nw-planet-disc"><span class="nw-planet-pieces">'+symbols+'</span></span>'+arc+'<span class="nw-collectible-count" aria-hidden="true">0/9</span></button>';
}
function nwShowCollectibles(){
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme');
 const ids=nwCollectibleWorldIds();
 evDisplay(evHeader('COLLECTIBLES',showCategories,true)+'<div class="world-grid world-list nw-planet-grid nw-collectibles-planets">'+ids.map(nwCollectiblePlanet).join('')+'</div>');
 evRoot.querySelectorAll('[data-nw-collectible-world]').forEach(function(button){button.onclick=function(){nwShowCollectibleWorld(button.dataset.nwCollectibleWorld);};});
 nwResetViewToTop();
}
function nwShowCollectibleWorld(id){
 if(!nwCollectibleWorldIds().includes(id)){nwShowCollectibles();return;}
 evSudokuLeave();applyTheme('hub');evRoot.classList.add('nw-galaxy-theme','nw-collectibles-theme','nw-collectible-detail-theme');
 const colors=nwGalaxyColors[id]||['#141A33','#8E83BE','#F8EBDD'];
 const folder=nwTripleArtFiles[id][0],files=nwTripleArtFiles[id][1];
 const pieces=files.map(function(filename,i){
  const name=nwCollectiblePieceName(filename),speed=18+(i%4)*3.5;
  return '<div class="nw-collectible-piece" style="--piece-index:'+i+';--orbit-time:'+speed+'s" role="img" aria-label="'+nwEscape(name)+', not collected">'
    +'<div class="nw-collectible-float"><span class="nw-collectible-piece-disc"><img src="'+folder+filename+'" alt="" class="nw-collectible-piece-image nw-collectible-unowned" draggable="false" loading="lazy"></span></div>'
    +'<svg class="nw-collectible-name-orbit" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="nwCollectPieceOrbit'+i+'" d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0"/></defs><circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 5"/><text font-size="'+(name.length>24?7:name.length>18?8:9)+'" fill="currentColor" letter-spacing=".3"><textPath href="#nwCollectPieceOrbit'+i+'" startOffset="0%">'+nwEscape(name)+' ✧</textPath></text></svg>'
    +'</div>';
 }).join('');
 evDisplay(evHeader(worlds[id].name,nwShowCollectibles,true)+'<section class="nw-collectible-detail" style="--collect-bg:'+colors[0]+';--collect-accent:'+colors[1]+';--collect-ink:'+colors[2]+'"><div class="nw-collectible-detail-top"><strong>0 / 9 COLLECTED</strong></div><div class="nw-collectible-piece-grid">'+pieces+'</div><p class="nw-collectible-detail-note">Your collection is waiting to begin.</p></section>');
 nwResetViewToTop();
}
