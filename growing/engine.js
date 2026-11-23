'use strict';
/* Pure, deterministic 37-cell hex engine. No DOM, storage or billing dependencies. */
const HexEngine=(()=>{
  const cells=[];
  for(let r=-3;r<=3;r++) for(let q=Math.max(-3,-r-3);q<=Math.min(3,-r+3);q++) cells.push({q,r});
  const index=new Map(cells.map((c,i)=>[`${c.q},${c.r}`,i]));
  const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const adjacent=cells.map(c=>directions.map(([dq,dr])=>index.get(`${c.q+dq},${c.r+dr}`)).filter(v=>v!==undefined));
  const pick=(arr,random=Math.random)=>arr[Math.floor(random()*arr.length)];
  const empties=b=>b.flatMap((v,i)=>v===0?[i]:[]);
  function findPath(board,from,to){
    if(from===to||!board[from]||board[to]!==0||from<0||to<0||to>=board.length)return null;
    const prev=new Map([[from,-1]]),todo=[from];
    for(let k=0;k<todo.length;k++)for(const next of adjacent[todo[k]]){
      if(board[next]||prev.has(next))continue;
      prev.set(next,todo[k]);if(next===to){let path=[to],cursor=to;while(cursor!==from){cursor=prev.get(cursor);path.push(cursor)}return path.reverse()}
      todo.push(next);
    }
    return null;
  }
  function reachable(board,from){if(!board[from])return new Set();const out=new Set(),todo=[from];for(let k=0;k<todo.length;k++)for(const n of adjacent[todo[k]])if(!board[n]&&!out.has(n)){out.add(n);todo.push(n)}return out}
  function component(board,start){const value=board[start];if(!value)return[];const found=new Set([start]),todo=[start];for(let k=0;k<todo.length;k++)for(const n of adjacent[todo[k]])if(board[n]===value&&!found.has(n)){found.add(n);todo.push(n)}return todo.sort((a,b)=>a-b)}
  function matching(board){let seen=new Set(),result=[];for(let i=0;i<37;i++){if(!board[i]||seen.has(i))continue;const members=component(board,i);members.forEach(j=>seen.add(j));if(members.length>=4)result.push({level:board[i],members})}return result.sort((a,b)=>a.level-b.level||a.members[0]-b.members[0])}
  function mergeAt(board,match,anchor,{allowDisconnected=false}={}){
    // Hard invariant: only four or more CONNECTED, identical-level creatures may vanish.
    if(!match||match.members.length<4||!match.members.includes(anchor)||match.members.some(i=>board[i]!==match.level))throw new Error('Invalid merge: must be 4+ connected same-level creatures');
    const actual=component(board,anchor);
    if(!allowDisconnected&&(actual.length!==match.members.length||actual.some(i=>!match.members.includes(i))))throw new Error('Invalid merge: cluster is not a single connected component');
    const before=match.level;match.members.forEach(i=>board[i]=0);const after=before<20?before+1:0;board[anchor]=after;return {from:before,to:after,anchor,size:match.members.length,points:(before===20?5000:100*(before+1)),cleared:before===20}}
  function resolve(board,{manualAnchor=null,random=Math.random,spawned=[],onMerge=null}={}){
    let results=[],priorityAnchor=manualAnchor,limit=100;
    while(limit-->0){const all=matching(board);if(!all.length)break;
      // Lowest level, then row-major. Manual anchor applies only when within matching group.
      const chosen=all[0];let anchor;
      if(priorityAnchor!==null&&chosen.members.includes(priorityAnchor))anchor=priorityAnchor;
      else{const newWithin=chosen.members.filter(i=>spawned.includes(i));anchor=pick(newWithin.length?newWithin:chosen.members,random)}
      if(onMerge)onMerge({phase:"merging",board:board.slice(),members:chosen.members.slice(),level:chosen.level,anchor});
      results.push(mergeAt(board,chosen,anchor));
      if(onMerge)onMerge({phase:"merged",board:board.slice(),members:[],level:chosen.level+1,anchor});
      priorityAnchor=anchor;spawned=[anchor];
    }
    return results;
  }
  function spawn(board,queue,random=Math.random){if(empties(board).length<queue.length)return null;let positions=[];for(const level of queue){const i=pick(empties(board),random);board[i]=level;positions.push(i)}return positions}
  // Test 8: the user-approved early-tier experiment. Higher tiers unchanged.
  // Temporary weights maintain the prior approach: two lower levels share
  // the top chance. Never generate above the highest current board level.
  // Preview queues stay fixed until spawned (including existing saved previews).
  const spawnTiers=[
    {max:3, levels:[1,2],           weights:[50,50]},
    {max:6, levels:[1,2,3],         weights:[40,40,20]},
    {max:10,levels:[2,3,4,5],       weights:[35,35,15,15]},
    {max:13,levels:[3,4,5,6,7],     weights:[25,25,20,15,15]},
    {max:16,levels:[4,5,6,7,8],     weights:[30,30,20,10,10]},
    {max:20,levels:[5,6,7,8,9,10],  weights:[25,25,20,12,10,8]}
  ];
  function nextQueue(board,random=Math.random){
    const highest=Math.max(1,...board);
    const tier=spawnTiers.find(t=>highest<=t.max)||spawnTiers[spawnTiers.length-1];
    const allowed=tier.levels.map((level,i)=>({level,weight:tier.weights[i]}))
      .filter(item=>item.level<=highest);
    const total=allowed.reduce((sum,item)=>sum+item.weight,0);
    return Array.from({length:4},()=>{
      const roll=Math.max(0,Math.min(0.9999999999999999,random()))*total;
      let cumulative=0;
      for(const item of allowed){
        cumulative+=item.weight;
        if(roll<cumulative)return item.level;
      }
      return allowed[allowed.length-1].level;
    });
  }
  function move(board,queue,from,to,random=Math.random){
    const path=findPath(board,from,to);if(!path)return {ok:false,reason:'blocked'};
    const copy=board.slice();copy[to]=copy[from];copy[from]=0;
    const frames=[{phase:'moved',board:copy.slice(),members:[],anchor:to}];
    let merges=[],spawned=[];
    const capture=frame=>frames.push(frame);
    const landed=component(copy,to);
    if(landed.length>=4){
      capture({phase:'merging',board:copy.slice(),members:landed.slice(),level:copy[to],anchor:to});
      merges.push(mergeAt(copy,{level:copy[to],members:landed},to));
      capture({phase:'merged',board:copy.slice(),members:[],anchor:to});
      merges.push(...resolve(copy,{manualAnchor:to,random,onMerge:capture}));
    }
    if(!merges.length){
      if(empties(copy).length<4)return {ok:true,gameOver:true,board:copy,path,merges:[],spawned:[],queue:queue.slice(),frames};
      spawned=spawn(copy,queue,random);
      capture({phase:'spawned',board:copy.slice(),members:spawned.slice()});
      merges=resolve(copy,{spawned,random,onMerge:capture});
    }
    return {ok:true,gameOver:false,board:copy,path,merges,spawned,frames,queue:spawned.length?nextQueue(copy,random):queue.slice()};
  }
  function juice(board){const copy=board.slice(),results=[];let guard=100;while(guard-->0){let level=0,ids=[];for(let v=1;v<=20;v++){let temp=copy.flatMap((x,i)=>x===v?[i]:[]);if(temp.length>=4){level=v;ids=temp;break}}if(!level)break;results.push(mergeAt(copy,{level,members:ids},ids[0],{allowDisconnected:true}))}return{board:copy,merges:results}}
  function shrink(board){const items=board.flatMap((v,i)=>v?[{v,i}]:[]).sort((a,b)=>a.v-b.v||a.i-b.i);if(items.length<=3)return null;const copy=board.slice();items.slice(0,3).forEach(({i})=>copy[i]=0);return{board:copy,removed:items.slice(0,3).map(x=>x.i)}}
  function initial(random=Math.random){const board=Array(37).fill(0);spawn(board,[1,1,1,1,2,2,2,3],random);resolve(board,{random});return board}
  return Object.freeze({cells,adjacent,findPath,reachable,component,matching,resolve,spawn,nextQueue,move,juice,shrink,initial,empties});
})();
