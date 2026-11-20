// ---------- Big blasts: a whole town flattened (the nuclear plant going up, or the Testing Environment's button) ----------
// One crushBall a hundred and sixty blocks across froze the game for three seconds and sent a guest six megabytes. So a big
// blast is a job instead (docs/huge-explosions.md): a shockwave ring runs out from the middle, and behind it the job carves the
// chunks it has reached, nearest first, a few milliseconds a frame, writing straight into each chunk's blocks and doing the
// bookkeeping once a chunk rather than once a block. The shape is fixed by where a column is (hash2 and the blast's own seed,
// never Math.random), so a chunk made later, a guest online and a save loaded again all carve the same crater:
//   the crater: the middle 18%, a shallow scorched bowl dug into the ground, with a lip of rubble round it;
//   the flattened zone: out to 70%, everything above street level gone but the first block, with a few ragged stumps;
//   the damage ring: the rest, cut along a surface rising from street level to the sky, so buildings lose their top floors
//   and the side facing the blast. Only these go through the collapse physics, each building once.
// A crater is saved as one record in `craters` (beside `collapses`), carved by genChunk after the plan and before the edits;
// the edits it covered are dropped as it's carved. Online the host sends ['X',...] once and each guest runs the same job.
// (BB, its numbers and `craters` are in world/places.js, as chunks can be made before this file has run)
// (craters from a save or the host: only whole, sensible records)
// (w, if there is one: the snow clock when it went off, so the snow it melted stays melted in a save and online)
function bbValid(L){return Array.isArray(L)?L.filter(C=>C&&['x','y','z','R','s','n'].every(k=>Number.isFinite(C[k]))&&C.R>=BB_SMALL&&C.R<=400).map(C=>{const o={x:C.x,y:C.y,z:C.z,R:C.R,s:C.s,n:C.n};if(Number.isFinite(C.w)&&C.w>=0)o.w=C.w;return o;}).sort((a,b)=>a.n-b.n):[];}
// the blast's sizes, worked out once (kept off the record, which is saved and sent as it is)
function bbK(C){let K=C._k;if(!K){K={rc:C.R*0.18,rf:C.R*0.7,gy:C.y-1,D:Math.max(2,Math.round(C.R*0.055)),lip:Math.max(1,Math.round(C.R*0.02)),R2:(C.R*1.07)**2};Object.defineProperty(C,'_k',{value:K,enumerable:false});}return K;}
// what the blast does to one column: zone 0 nothing, 1 crater, 2 lip, 3 flattened, 4 damage ring. Everything from `cut` up goes
// (but water and bedrock); the crater's `floor` block is scorched; lip blocks l0..l1-1 are rubble.
function bbO(){return{zone:0,cut:H,floor:-1,fb:0,l0:0,l1:0,lb:0,t:0};}
function bbCol(C,K,x,z,o){
  o.zone=0;o.cut=H;o.floor=-1;o.l0=o.l1=0;
  const dx=x+0.5-C.x,dz=z+0.5-C.z,d2=dx*dx+dz*dz;if(d2>=K.R2)return o;
  const s=C.s,n1=hash2(x*3+s,z*5-s),nc=hash2((x>>2)+s*7,(z>>2)-s*3),de=Math.sqrt(d2)*(1+0.12*(0.6*nc+0.4*n1-0.5));   // (a ragged edge, in clumps)
  if(de>=C.R)return o;
  const gy=K.gy;
  if(de<K.rc){const f=gy-Math.round(K.D*(1-(de/K.rc)**2));o.zone=1;o.floor=f;o.fb=n1<0.55?COAL:n1<0.85?DEEPSLATE:GRAVEL;o.cut=f+1;}
  else if(de<K.rc*1.35){const t=(de-K.rc)/(K.rc*0.35),h=Math.max(0,Math.round((1-t)*K.lip*(0.6+0.5*n1)));o.zone=2;o.l0=gy+1;o.l1=gy+1+h;o.lb=nc<0.4?COBBLE:nc<0.75?GRAVEL:DIRT;o.cut=gy+1+h;}
  else if(de<K.rf){o.zone=3;const st=hash2((x>>1)*7+s,(z>>1)*11-s);o.cut=gy+2+(st<0.1?1+Math.floor(hash2(x+s*13,z-s)*BB_STUMP):0);}   // (a stump here and there)
  else{const t=(de-K.rf)/(C.R-K.rf);o.zone=4;o.t=t;o.cut=gy+2+Math.max(0,Math.round((H-gy)*t*t+(n1-0.5)*4));}
  return o;
}
// does the blast reach this chunk at all? (its nearest point, allowing for the ragged edge)
function bbNear(C,cx,cz){const x0=cx*CS,z0=cz*CS,dx=Math.max(x0-C.x,0,C.x-(x0+CS)),dz=Math.max(z0-C.z,0,C.z-(z0+CS));return Math.hypot(dx,dz);}
// carve one chunk's blocks. J: the live job (then it notes what it took for the building counts, gas pumps, water, effects);
// null for a chunk being made
function bbCarve(A,cx,cz,C,J){
  const K=bbK(C),x0=cx*CS,z0=cz*CS,o=bbO(),T=A.tileTops||tileTopsOf(A),L=CS*CS,host=J&&!netGuest();let n=0,lip=false;
  // the snow it reaches is melted (all of it, not just where blocks went), and what settles after starts from bare ground:
  // the snow clock when it went off (C.w), so a chunk made later, a save loaded again and a guest melt the same
  const melt=WX.snowCover>0?(Number.isFinite(C.w)?C.w:J?WX.snowClock:-1):-1;
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz;bbCol(C,K,x,z,o);if(!o.zone)continue;
    const base=lx+lz*CS,top=Math.max(T[(lz>>2)*4+(lx>>2)],o.l1);let n0=n,B=undefined;
    if(melt>=0){const ck=x*65536+z;if(!(snowBorn.get(ck)>=melt))snowBorn.set(ck,melt);}
    if(o.floor>=1){const i=base+o.floor*L,v=A[i];if(v&&v!==WATER&&v!==BEDROCK)A[i]=o.fb;}
    for(let y=Math.max(1,o.cut);y<=top&&y<H;y++){const i=base+y*L,v=A[i];if(!v||v===WATER||v===BEDROCK)continue;A[i]=AIR;n++;
      if(!host)continue;
      // (the building counts catch up over the next few frames, as they do for a collapse; a building vaporised outright is
      // counted in one go instead)
      if(y>G){if(B===undefined)B=bldgAt(x,z);if(B&&!J.vap.has(B.key))noteQ.push(x,y,z,v,B);}
      if(v===PUMP&&o.zone===4&&J.pumps.length<12)J.pumps.push({x,y,z,b:PUMP});
      if(y<=G+1&&(lx>0&&A[i-1]===WATER||lx<CS-1&&A[i+1]===WATER||lz>0&&A[i-CS]===WATER||lz<CS-1&&A[i+CS]===WATER||y+1<H&&A[i+L]===WATER))wfNoteRemoved(x,y,z);
      if(J.fx.length<J.fxN&&!(n%7))J.fx.push({x,y,z,b:v});}
    if(o.zone===2&&o.l1>o.l0){   // the lip: heaped on the ground as it is now (after any crater before it), never over air or water
      let y=Math.min(o.l1,H-1)-1;const lo=Math.max(1,o.l0-K.D-K.lip-6);while(y>=lo&&!A[base+y*L])y--;
      if(y>=lo&&A[base+y*L]!==WATER)for(let k=1;k<=o.l1-o.l0&&y+k<H;k++){const i=base+(y+k)*L;if(A[i])continue;A[i]=o.lb;lip=true;}}
    else if(o.zone>=3&&bbScar(A,base,x,z,C,K,o))lip=true;
    if(J&&(n>n0||o.l1>o.l0))navCols.delete(x*65536+z);
  }
  if(lip||n)tileTopsOf(A);   // (the rubble lip can rise above what was there)
  A.bb=Math.max(A.bb||0,C.n);
  return n;
}
// the flattened zone and the damage ring, below the cut: grass burnt to dirt, the street broken up in patches, and the buildings
// it vaporised left as heaps of rubble on their ground floors (only those: under the collapse it sets, which a chunk made again
// keeps, while the others are heaped up as they come down, bbSettle). Whether something's added is only the plan, hash2 and
// the blast's seed, so it's the same everywhere.
function bbStreet(v){return v===ASPHALT||v===LINE||v===LINEX||v===LINE_R||v===LINEX_R||v===CROSS||v===CROSSX||v===SIDEWALK||v===LANE||v===LANEX;}   // (a function: chunks can be carved before this file has run)
// (and everything else paved or laid that breaks up the same way: plazas, concourses, courts, a railway's ballast)
function bbPaved(v){return bbStreet(v)||v===CONCRETE||v===GRAVEL||v===COURT||v===COURT_L||v===CHECKER;}
// (grass, a mown lawn or a pitch: burnt to dirt)
function bbGrass(v){return v===GRASS||v===FLOWER||v===FIELD||v===FIELD_L;}
function bbScar(A,base,x,z,C,K,o){
  const L=CS*CS,s=C.s,w=o.zone===3?1:Math.max(0,1-o.t);let ch=false;
  for(let y=Math.min(o.cut,H)-1,k=0;y>=1&&k<8;y--){const i=base+y*L,v=A[i];if(!v)continue;k++;if(bbGrass(v)){A[i]=DIRT;ch=true;}else if(v!==LEAVES)break;}
  const gi=base+G*L,up=gi+L;
  if(bbPaved(A[gi])&&!A[up]){const h=hash2((x>>1)*13+s*3,(z>>1)*17-s);
    if(h<0.05+0.2*w){const n=hash2(x*7-s,z*3+s);A[gi]=n<0.5?GRAVEL:COBBLE;if(n<0.3)A[up]=COBBLE;ch=true;}}
  if(w>0.5&&!A[up]&&A[gi]&&A[gi]!==WATER){const B=bldgAt(x,z);
    if(B&&bbVap(C,K,B)&&hash2((x>>1)*5+s,(z>>1)*9-s)<0.55){const h=1+Math.floor(hash2(x-s*5,z+s*7)*2),m=bbRubble(x,z,s);
      for(let k=0;k<h;k++){const i=up+k*L;if(A[i])break;A[i]=k?m:COBBLE;}ch=true;}}
  // what's left standing of something that isn't a building (a stadium's stands, a station's platforms, a wall): rubble on top
  const v1=A[up],u2=up+L,bk=v1&&BLOCK[v1];
  if(w>0.5&&u2<A.length&&!A[u2]&&bk&&bk.solid&&!bk.transparent&&!bk.thin&&v1!==WATER&&v1!==LOG&&hash2((x>>1)*29-s,(z>>1)*31+s)<0.4*w&&!bldgAt(x,z)){
    const h=1+Math.floor(hash2(x+s*17,z-s*19)*2),m=bbRubble(x,z,s);for(let k=0;k<h;k++){const i=u2+k*L;if(i>=A.length||A[i])break;A[i]=k?m:COBBLE;}ch=true;}
  return ch;
}
// is this building one the blast vaporises (wholly inside the flattened zone, as bbPlots decides)? kept per building
function bbVap(C,K,B){
  const M=K.vap||(K.vap=new Map());let v=M.get(B.key);if(v!==undefined)return v;
  const b=B.b,X0=B.px*CELL,Z0=B.pz*CELL,x0=X0+b.x0,x1=X0+b.x1,z0=Z0+b.z0,z1=Z0+b.z1;
  v=Math.max(Math.hypot(x0-C.x,z0-C.z),Math.hypot(x1-C.x,z0-C.z),Math.hypot(x0-C.x,z1-C.z),Math.hypot(x1-C.x,z1-C.z))*1.07<K.rf;M.set(B.key,v);return v;
}
function bbRubble(x,z,s){const n=hash2(x*11+s,z*13-s);return n<0.45?COBBLE:n<0.75?GRAVEL:n<0.9?BRICK:CONCRETE;}
// a chunk being made: every crater that reaches it, in the order they went off (before its edits are put back)
function bbGen(a,cx,cz){
  if(!craters.length||cx>=SHIP_CX0)return;
  for(const C of craters){if(bbNear(C,cx,cz)>C.R*1.07)continue;
    const k=ckey(cx,cz);for(const J of BB.jobs)if(J.C===C&&J.pend.has(k)){J.pend.delete(k);bbPrune(C,cx,cz);}   // (the edits it covers, dropped first)
    bbCarve(a,cx,cz,C,null);}
}
// the smashed blocks this crater has carved over aren't wanted any more (they're under it now): dropped, so the save stays small
// and a chunk made again comes out as it is. Water's kept (the crater leaves water where it is).
function bbPrune(C,cx,cz){
  const k=ckey(cx,cz),L=chunkEdits.get(k);if(!L||!L.length)return;const K=bbK(C),o=bbO(),keep=[];
  for(const e of L){const x=e[0],y=e[1],z=e[2],b=e[3];bbCol(C,K,x,z,o);
    if(b!==WATER&&o.zone&&(y>=o.cut||y===o.floor||y>=o.l0&&y<o.l1)){const s=x+','+y+','+z;if(edits[s]===b)delete edits[s];continue;}
    keep.push(e);}
  if(keep.length!==L.length){if(keep.length)chunkEdits.set(k,keep);else chunkEdits.delete(k);}
}
// a chunk the job hasn't reached yet, about to be changed by something else: carved first, so the change lands on top of the
// crater as it does on every other machine (and in the save)
function bbTouch(x,z){
  const k=ckey(Math.floor(x/CS),Math.floor(z/CS));
  for(const J of BB.jobs)if(J.pend.has(k))bbDo(J,J.byK.get(k));
}
function bbDo(J,e){
  if(!J.pend.delete(e.k))return;
  for(const I of BB.jobs){if(I===J)break;if(I.pend.has(e.k))bbDo(I,I.byK.get(e.k));}   // (an earlier blast's carving of this chunk comes first)
  bbPrune(J.C,e.cx,e.cz);
  const A=chunks.get(e.k);if(!A||A.bb>=J.C.n)return 0;
  const n=bbCarve(A,e.cx,e.cz,J.C,J);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const k2=ckey(e.cx+a,e.cz+b),A2=chunks.get(k2);if(A2)A2.blkE=null;J.ch.add(k2);}   // (lights gone: the glow round them too)
  return n;
}
// has a blast taken everything here, as far as this column's chunk has been carved? (the railway's rails and sleepers aren't
// laid there: routeMarks)
function bbTorn(x,z){
  if(!craters.length)return false;const fx=Math.floor(x),fz=Math.floor(z),A=chunks.get(ckey(Math.floor(fx/CS),Math.floor(fz/CS))),bb=A&&A.bb||0;if(!bb)return false;
  const o=bbO();for(const C of craters){if(C.n>bb)continue;bbCol(C,bbK(C),fx,fz,o);if(o.zone&&o.zone<=3)return true;}
  return false;
}
// where a blast has taken everything: the plan's furniture, street furniture, lamps, doors and signs aren't put out there
function bbGone(x,z){
  for(const C of craters){const K=bbK(C),d=Math.hypot(x-C.x,z-C.z);if(d>=K.rf*0.93)continue;
    const J=BB.jobs.find(j=>j.C===C);if(!J||d<J.ring)return true;}
  return false;
}
// ---- setting one off ----
// x,y,z: the middle (y the first block above street level); R its reach. Small ones are just a crushBall.
function bigBlast(x,y,z,R,opt={}){
  if(R<BB_SMALL)return crushBall(x,y,z,R,opt);
  {const P=bbWorldPt(x,y,z);x=P.x;y=P.y;z=P.z;}   // (set off aboard a ship: out where it is, and the ship carved by bbShips)
  if(netGuest())return null;   // (the host's to set off: a guest's is sent over)
  const n=craters.reduce((m,c)=>Math.max(m,c.n),0)+1;
  const C={x:Math.round(x*10)/10,y:Math.round(y),z:Math.round(z*10)/10,R:Math.round(R),s:(hash2(n*977,Math.round(x)+Math.round(z)*7)*1e6)|0,n};
  if(WX.snowCover>0)C.w=WX.snowClock;   // (the snow it melts: bbCarve)
  if(netHost()&&NET.guests.size)netEmit(['X',C.x,C.y,C.z,C.R,C.s,C.n,C.w??-1]);
  return bbStart(C,true);
}
// (a crater record from anywhere: this game's own, the host's, a save's)
function bbStart(C,fresh){
  if(craters.some(c=>c.n===C.n))return null;
  craters.push(C);craters.sort((a,b)=>a.n-b.n);
  const K=bbK(C),list=[],plots=[],r=C.R*1.07+CS;
  for(let cx=Math.floor((C.x-r)/CS);cx<=Math.floor((C.x+r)/CS);cx++)for(let cz=Math.floor((C.z-r)/CS);cz<=Math.floor((C.z+r)/CS);cz++){const d=bbNear(C,cx,cz);if(d<=C.R*1.07)list.push({k:ckey(cx,cz),cx,cz,d});}
  list.sort((a,b)=>a.d-b.d);
  for(let px=Math.floor((C.x-r)/CELL);px<=Math.floor((C.x+r)/CELL);px++)for(let pz=Math.floor((C.z-r)/CELL);pz<=Math.floor((C.z+r)/CELL);pz++){
    const X0=px*CELL,Z0=pz*CELL,d=Math.hypot(Math.max(X0-C.x,0,C.x-X0-CELL),Math.max(Z0-C.z,0,C.z-Z0-CELL));if(d<=C.R*1.07)plots.push({px,pz,d});}
  plots.sort((a,b)=>a.d-b.d);
  const J={C,K,list,i:0,pend:new Set(list.map(e=>e.k)),byK:new Map(list.map(e=>[e.k,e])),plots,pi:0,seen:new Set(),vap:new Set(),
    ring:0,t:0,fresh,hit:new Set(),dead:0,bq:[],dq:[],ch:new Set(),pumps:[],fx:[],fxN:0,fires:[],sh:new Map(),work:0,worst:0,frames:0,nVap:0,done:false};
  BB.jobs.push(J);BB.jobs.sort((a,b)=>a.C.n-b.C.n);
  bbFxStart(J);
  return J;
}
// ---- each frame ----
function bbTick(dt){
  if(BB.pendR&&dt>0){const R=BB.pendR;BB.pendR=0;bbHere(R);}   // (the Testing Environment's button)
  BB.f=(BB.f|0)+1;bbArmTick(dt);bbFxTick(dt);
  if(!BB.jobs.length)return;
  const t0=performance.now(),host=!netGuest();
  for(const J of [...BB.jobs]){
    J.t+=dt;J.ring=Math.min(J.C.R*1.1,J.ring+BB.speed*dt);J.frames++;
    const tj=performance.now();
    bbPlots(J,host);
    J.fxN=host?20:0;J.fx.length=0;
    while(J.i<J.list.length&&J.list[J.i].d<=J.ring){
      const e=J.list[J.i];if(J.pend.has(e.k))bbDo(J,e);J.i++;
      if(performance.now()-t0>BB.ms)break;}
    if(J.ch.size){rebuildSet(J.ch);J.ch.clear();}
    bbThaw(J);let sw=0;if(host){bbHits(J);if(J.fresh)bbShips(J);const ts=performance.now();bbSettle(J,t0);sw=performance.now()-ts;bbCount(J,t0);bbEdgeFx(J);}
    const w=performance.now()-tj-sw;J.work+=w;if(w>J.worst)J.worst=w;   // (a building coming down costs what any collapse does: kept apart, J.sw)
    J.swT=(J.swT||0)+sw;if(sw>(J.sw||0))J.sw=sw;
    if(J.i>=J.list.length&&J.pi>=J.plots.length&&J.ring>=J.C.R*1.1&&!J.bq.length&&!J.dq.length&&[...J.sh.values()].every(Q=>Q.done))bbEnd(J,host);
  }
}
function bbEnd(J,host){
  BB.jobs.splice(BB.jobs.indexOf(J),1);J.done=true;
  for(const k of J.pend){const e=J.byK.get(k);bbPrune(J.C,e.cx,e.cz);}J.pend.clear();   // (anything left over: chunks never loaded)
  if(host&&J.nVap&&J.fresh)award(J.nVap*400,'Town flattened',J.C.x,J.C.y+6,J.C.z);
  farDirty=true;destroyVer++;if(host)save();
}
// the plots the ring has reached: their buildings sorted into vaporised (wholly inside the flattened zone: gone, counted
// destroyed in one go, no physics) and damaged (reaching into the damage ring: checked for collapse once the ring is past)
function bbPlots(J,host){
  const C=J.C,K=J.K;
  while(J.pi<J.plots.length&&J.plots[J.pi].d<=J.ring){const {px,pz}=J.plots[J.pi++];
    const S=superOf(px,pz),ax=S?S.ax:px,az=S?S.az:pz,k0=ax+','+az;if(J.seen.has(k0))continue;J.seen.add(k0);
    const P=plotInfo(ax,az),X0=ax*CELL,Z0=az*CELL;
    P.b.forEach((b,i)=>{const key=k0+','+i,x0=X0+b.x0,x1=X0+b.x1,z0=Z0+b.z0,z1=Z0+b.z1;
      const far=Math.max(Math.hypot(x0-C.x,z0-C.z),Math.hypot(x1-C.x,z0-C.z),Math.hypot(x0-C.x,z1-C.z),Math.hypot(x1-C.x,z1-C.z)),
        near=Math.hypot(Math.max(x0-C.x,0,C.x-x1),Math.max(z0-C.z,0,C.z-z1));
      if(near>=C.R*1.07)return;
      const L=K.gy+2+BB_STUMP;   // (above the tallest stump: what the plan makes below it is what the carve leaves)
      if(far*1.07<K.rf){J.vap.add(key);
        if(!(collapses[key]<=L)){collapses[key]=Math.min(collapses[key]??1e9,L);try{if(netGuest())NET_COLL.set(key,collapses[key]);}catch(e){}}
        if(host){J.nVap++;rampBldg(key);J.dq.push({b,px:ax,pz:az,key});}}
      else if(host)J.bq.push({B:{b,px:ax,pz:az,key},far:far*1.07});});}
}
// the damaged buildings, once the ring's past them, each checked once for collapse (only where it's loaded: elsewhere what's left
// stands on what's under it)
function bbSettle(J,t0){
  const C=J.C,K=J.K,o=bbO();
  for(let i=0;i<J.bq.length;i++){const q=J.bq[i];if(q.far>J.ring&&J.ring<C.R*1.1)continue;
    const {b,px,pz}=q.B,X0=px*CELL,Z0=pz*CELL;
    if(collapses[q.B.key]<=G+1){J.bq.splice(i--,1);continue;}
    // everything it could fall on wants to be loaded first (making chunks inside its collapse was most of the blast's worst frames)
    const reach=b.top+(b.roof||0)-G+2;let miss=null;
    for(let cx=Math.floor((X0+b.x0-reach)/CS);cx<=Math.floor((X0+b.x1+reach)/CS)&&!miss;cx++)for(let cz=Math.floor((Z0+b.z0-reach)/CS);cz<=Math.floor((Z0+b.z1+reach)/CS);cz++)
      if(!chunks.has(ckey(cx,cz))){miss=[cx,cz];break;}
    if(miss&&!(J.i>=J.list.length&&J.ring>=C.R*1.1))continue;   // (waits for them to load, while there's still carving to do)
    if(miss){let ok=true;for(const [x,z] of [[b.x0-1,b.z0-1],[b.x1,b.z0-1],[b.x0-1,b.z1],[b.x1,b.z1]])if(!chunks.has(ckey(Math.floor((X0+x)/CS),Math.floor((Z0+z)/CS))))ok=false;
      if(!ok){J.bq.splice(i--,1);continue;}}
    if(BB.f-(J.settled|0)<4||performance.now()-t0>BB.ms*0.5)return;   // (one building every few frames, and not on a busy one)
    J.settled=BB.f;J.bq.splice(i--,1);
    const top=b.top+(b.roof||0),list=[];let dx=0,dz=0;
    for(let x=b.x0;x<b.x1;x++)for(let z=b.z0;z<b.z1;z++){const wx=X0+x,wz=Z0+z;bbCol(C,K,wx,wz,o);if(o.zone<3||o.cut>top)continue;list.push({x:wx,y:Math.max(G+1,o.cut),z:wz});dx+=wx-C.x;dz+=wz-C.z;}
    if(!list.length)continue;
    const h=Math.hypot(dx,dz)||1;settle(list,{dx:dx/h,dz:dz/h,impact:true});
    if(collapses[q.B.key]!==undefined)bbHeap(C,K,b,X0,Z0,top);
  }
}
// a building the blast brought down: rubble heaped round its foot and over its ground floor (on top of what its own collapse
// leaves), more the taller it was and the nearer the blast. Host only, as edits (saved, and sent to guests like any others).
function bbHeap(C,K,b,X0,Z0,top){
  const o=bbO(),s=C.s,ch=new Set(),hm=Math.min(4,1+Math.round((top-G)/12));
  for(let x=b.x0-2;x<b.x1+2;x++)for(let z=b.z0-2;z<b.z1+2;z++){const wx=X0+x,wz=Z0+z;bbCol(C,K,wx,wz,o);if(o.zone<3)continue;
    const w=o.zone===3?1:Math.max(0,1-o.t),edge=x<b.x0||x>=b.x1||z<b.z0||z>=b.z1;
    if(hash2((wx>>1)*19+s,(wz>>1)*23-s)>(edge?0.35:0.55)*(0.4+0.6*w))continue;
    if(!chunks.has(ckey(Math.floor(wx/CS),Math.floor(wz/CS))))continue;
    const y0=colSupport(wx,wz,G+5);if(y0<G+1||y0>G+3)continue;
    const n=Math.max(1,Math.round(hm*(edge?0.5:1)*(0.5+hash2(wx+s*3,wz-s*11))));
    for(let y=y0;y<y0+n&&y<H;y++){if(get(wx,y,wz)!==AIR)break;const m=bbRubble(wx,wz+y,s);setRaw(wx,y,wz,m);addEdit(wx,y,wz,m);}
    ch.add(ckey(Math.floor(wx/CS),Math.floor(wz/CS)));}
  if(ch.size)rebuildSet(ch);
}
// the vaporised buildings' size, worked out a slice at a time, then counted gone
function bbCount(J,t0){
  while(J.dq.length){const q=J.dq[0],n=bldgSolidPart(q.b,q.px,q.pz,q.key,Math.max(t0+BB.ms,performance.now()+0.5));if(n===undefined)return;
    J.dq.shift();destroyed[q.key]=Math.max(destroyed[q.key]||0,n);destroyVer++;}
}
// the snow on everyone and everything inside the ring melted off (it settles again as on anything else)
function bbThaw(J){
  if(WX.snowCover<=0)return;
  const C=J.C,r=Math.min(J.ring,C.R),in_=(x,z)=>Math.hypot(x-C.x,z-C.z)<r,off=o=>{if(o&&o.snowU&&o.snowU.value>0)o.snowU.value=0;};
  for(const q of players)if(q.active&&in_(pwx(q),pwz(q)))off(q);
  for(const g of goblins)if(g.snowU&&g.snowU.value>0&&in_(g.pos.x,g.pos.z))off(g);
  for(const c of cars)if(c.snowU&&c.snowU.value>0&&in_(c.pos.x,c.pos.z))off(c);
  vehEach((K,o)=>{if(!o.snowU||!(o.snowU.value>0))return;const P=K.pos(o);if(P&&in_(P.x,P.z))off(o);});
}
// ---- the people, vehicles and things the ring reaches: hurt once each, by how close they were ----
const BB_CAUSE='Vaporised in a nuclear blast';
function bbHits(J){
  const C=J.C,K=J.K,r=J.ring,cx=C.x,cz=C.z,fall=d=>Math.max(0,1-(d-K.rf)/(C.R-K.rf));
  // (J.by and J.cause: a nuke launcher's, shotNuke in shots.js. A player killed is blamed on whoever fired it, as foeBoom does)
  const by=J.by||undefined,pk=by&&by.pvp;
  for(const q of players){if(!q.active||q.state==='dead'||J.hit.has(q))continue;const dx=pwx(q)-cx,dz=pwz(q)-cz,d=Math.hypot(dx,dz);if(d>r)continue;J.hit.add(q);
    addShake(d<C.R?1.6:0.5,q.pos.x,q.pos.z,30);rumble(q,d<C.R?1:0.5,1200);if(d>=C.R)continue;
    const h=d||1,n=d<K.rf?999:Math.round(10*fall(d)**1.5);
    if(n>0){damagePlayer(q,n,new V3(q.pos.x,q.pos.y+1,q.pos.z),new V3(dx/h,0.8,dz/h),BB_CAUSE,pk===q?undefined:by);if(pk&&pk!==q&&q.state==='dead')pvpKilled(pk,q);}}
  for(const g of goblins){if(g.state!=='chase'||J.hit.has(g))continue;const dx=g.pos.x-cx,dz=g.pos.z-cz,d=Math.hypot(dx,dz);if(d>r)continue;J.hit.add(g);if(d>=C.R)continue;
    const h=d||1,n=d<K.rf?g.hp+1:4*fall(d)**1.5;if(n<0.2)continue;damageGoblin(g,n,new V3(g.pos.x,g.pos.y+1,g.pos.z),new V3(dx/h,0,dz/h),J.cause||BB_CAUSE);
    if(g.state==='dead'&&++J.dead>BB_CORPSES){g.t=20;g.root.visible=false;}}   // (past the first few, the rest are just gone in the flash)
  for(const c of cars){if(!c.alive||J.hit.has(c))continue;const dx=c.pos.x-cx,dz=c.pos.z-cz,d=Math.hypot(dx,dz);if(d>r)continue;J.hit.add(c);if(d>=C.R)continue;
    if(d<K.rf){BB.quiet++;try{if(!drvSafe(c))explodeCar(c);}finally{BB.quiet--;}}   // (wrecked where it stands: no blast of its own, nothing set off round it)
    else{const n=90*fall(d)**1.5;if(n>2)damageCar(c,n,new V3(dx,0,dz));if(c.alive&&n>15)launchCar(c,3+n*0.06,new V3(dx,0,dz),4);}}
  for(const B of TRAIN_BOXES){const pr=B.proxy,T=pr&&pr.T;if(!pr||!pr.alive||!T)continue;const key=T.cars&&T.C?T.cars[pr.i]||pr:T;if(J.hit.has(key))continue;
    const dx=B.x-cx,dz=B.z-cz,d=Math.max(0,Math.hypot(dx,dz)-Math.max(B.hx||0,B.hz||0));if(d>r)continue;J.hit.add(key);if(d>=C.R)continue;
    trainHit(T,d<K.rf?1e5:400*fall(d)**1.5,new V3(dx,0,dz),pr.i);}
  for(const M of MINES){if(!M.live)continue;const d=Math.hypot(M.x-cx,M.z-cz);if(d>r||d>=C.R)continue;
    if(d<K.rf){M.live=false;mineShow(M.i,0,0,0,0);}else mineBoom(M);}
  if(J.pumps.length){pumpsHit(J.pumps);J.pumps.length=0;}
  const rk=Math.min(r,C.R);knockFixtures(cx,cz,rk,0,0);knockProps(cx,G+1,cz,rk,0,0);
}
// ---- the ships it reaches (ships.js): each one's blocks carved as the ring gets to them, a column at a time nearest first, to
// the same shape as the ground's (bbCol, where that column of the ship is out in the world, its heights as the ship floats),
// but through setRaw and addEdit, so shipDent counts them against its hull (it breaks, floods below the waterline and sinks as
// it would from any other smashing), and they're its save (cvSnap) and sent to guests. One with its middle, or a third of its deck, in the crater or
// the flattened zone is lost: what's left of it goes down. Host only, and only for a blast set off now (not one from a save)
const _bbv={x:0,z:0};
function bbShips(J){
  const C=J.C,K=J.K,o=bbO(),R=C.R*1.07,t0=performance.now();
  for(const S of SHIPS){if(!S)continue;let Q=J.sh.get(S);
    if(!Q){const SK=S.K,c=shipToWorld(S,S.ox+(SK.u0+SK.u1+1)/2,S.oz+(SK.w0+SK.w1+1)/2,_bbv),hw=Math.hypot(SK.u1+1-SK.u0,SK.w1+1-SK.w0)/2;
      const mid=Math.hypot(c.x-C.x,c.z-C.z);if(mid-hw>Math.min(J.ring,R))continue;   // (not reached yet, or never will be)
      const cols=[];for(let w=SK.w0;w<=SK.w1;w++)for(let u=SK.u0;u<=SK.u1;u++){shipToWorld(S,S.ox+u+0.5,S.oz+w+0.5,_bbv);const d=Math.hypot(_bbv.x-C.x,_bbv.z-C.z);if(d<R)cols.push({u,w,d});}
      cols.sort((a,b)=>a.d-b.d);Q={cols,i:0,mid,tot:(SK.u1+1-SK.u0)*(SK.w1+1-SK.w0),flat:0,ch:new Set(),done:false};J.sh.set(S,Q);}
    while(Q.i<Q.cols.length&&Q.cols[Q.i].d<=J.ring&&performance.now()-t0<BB.ms)bbShipCol(S,C,K,Q.cols[Q.i++],o,Q);
    if(Q.ch.size){rebuildSet(Q.ch);Q.ch.clear();}
    if(!Q.done&&Q.i>=Q.cols.length){Q.done=true;if(!S.dead&&(Q.mid<K.rf||Q.flat>=Q.tot/3))shipSink(S);}}
}
function bbShipCol(S,C,K,q,o,Q){
  const x=S.ox+q.u,z=S.oz+q.w;shipToWorld(S,x+0.5,z+0.5,_bbv);bbCol(C,K,Math.floor(_bbv.x),Math.floor(_bbv.z),o);if(!o.zone)return;if(o.zone<=3)Q.flat++;
  if(!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS))))return;
  const y1=Math.min(H-1,S.K.y1??H-1);let n=0;
  for(let y=Math.max(1,o.cut+Math.round(S.sk||0));y<=y1;y++){const b=rawGet(x,y,z);if(!b||b===WATER||b===BEDROCK)continue;setRaw(x,y,z,AIR);addEdit(x,y,z,AIR);n++;}
  if(n)for(const ox of [-1,1])for(const oz of [-1,1])Q.ch.add(ckey(Math.floor((x+ox)/CS),Math.floor((z+oz)/CS)));
}
// a point in a ship's pocket, out in the world where it really is (else as it is)
function bbWorldPt(x,y,z){if(x>=SHIP_X0){const S=shipOfPos(x,z);if(S){const t=shipToWorld(S,x,z,{x:0,z:0});return{x:t.x,y:y-S.sk,z:t.z};}}return{x,y,z};}
// ---- how it looks: a flash, a fireball that cools and rolls up into the mushroom's cap, a stem of dust drawn up into it, a dust
// surge along the ground, a condensation dome round the fireball for a moment and a collar round the stem, then the cloud drifting
// off with the wind and thinning away. All cubes, in three instanced meshes of its own (not the fires' smoke, which the rim fires
// took back), each cube's place worked out from the crater's seed and the time, so a guest's is the same. The boom and the shake
// reach each player at the speed of sound (BBF_SPD), and after dark it lights the world orange (bbGlowSky, from updateSky; with
// Block lighting, a pool of light on the ground round it too, bbMovLight).
const BBF_N=9000,BBF_W=2400,BBF_SPD=343,BBF_LIFE=110,BBF_WIND=SMOKE_WIND,BB_GLOWC=new THREE.Color(1,0.46,0.16),_bbc=new THREE.Color(),_bbc2=new THREE.Color(),_bbFog=new THREE.Color();
const BBF_HEAT=[[0,0x3a1408],[0.2,0x8a1e08],[0.4,0xe0460c],[0.6,0xff9a1a],[0.8,0xffe27a],[1,0xfffbea]].map(([k,c])=>[k,new THREE.Color(c)]);
const BBF=(()=>{const geo=new THREE.BoxGeometry(1,1,1),mb=o=>new THREE.MeshBasicMaterial(Object.assign({color:0xffffff,fog:false},o));
  return{glow:fxBatch(geo,mb(),BBF_N,false),cloud:fxBatch(new THREE.BoxGeometry(1,1,1),mb({transparent:true}),BBF_N,true),wil:fxBatch(geo,mb({transparent:true,opacity:0.5,depthWrite:false}),BBF_W,false),el:null};})();
BBF.cloud.renderOrder=1.5;BB.glowK=0;BB.glowP=null;   // (after the water, renderOrder 1, which would otherwise paint over it, and before the fires' smoke, 2, which mostly stands in front of it; it writes depth, being drawn far to near anyway, so smoke behind it stays behind it)
// (the cloud is see-through, like the fires' smoke, so its cubes are gathered here first and drawn far to near: sorted into
// BBF_BINS by distance from the camera, which is all the order see-through boxes this size need)
const BBF_ST=new Float32Array(BBF_N*8),BBF_BINS=64,BBF_BC=new Uint32Array(BBF_BINS+1),BBF_KEY=new Uint8Array(BBF_N),BBF_D=new Float32Array(BBF_N);
function bbCloudSend(n){const M=BBF.cloud,S=BBF_ST,P=players.find(q=>q.active)||players[0],cp=P&&P.camera.position;
  let lo=Infinity,hi=0;const D=BBF_D;
  for(let i=0;i<n;i++){const o=i*8,d=cp?(S[o]-cp.x)**2+(S[o+1]-cp.y)**2+(S[o+2]-cp.z)**2:0;D[i]=d;if(d<lo)lo=d;if(d>hi)hi=d;}
  const sc=hi>lo?BBF_BINS/(Math.sqrt(hi)-Math.sqrt(lo)+1e-6):0,sl=Math.sqrt(lo);BBF_BC.fill(0);
  for(let i=0;i<n;i++){const b=Math.min(BBF_BINS-1,Math.floor((Math.sqrt(D[i])-sl)*sc));BBF_KEY[i]=BBF_BINS-1-b;BBF_BC[BBF_KEY[i]+1]++;}
  for(let b=1;b<=BBF_BINS;b++)BBF_BC[b]+=BBF_BC[b-1];
  for(let i=0;i<n;i++){const j=BBF_BC[BBF_KEY[i]]++,o=i*8;_bbc.setRGB(S[o+4],S[o+5],S[o+6]);bbPut(M,j,S[o],S[o+1],S[o+2],S[o+3],_bbc);M.fxA.array[j]=S[o+7];}
  fxSent(M,n);}
// (each cube of cloud its own shade, from its seed: lighter and darker, browner or greyer, and now and then a sooty one,
// so the cloud's lumpy and mottled rather than one flat colour)
const BBF_SOOT=new THREE.Color(0x2e2925),BBF_BROWN=new THREE.Color(0x8a6f58),_bbFr=x=>x-Math.floor(x);
function bbVar(c,a,b,d,soot){const v=0.68+0.64*_bbFr(d*13.37+a*7.1);c.r*=v;c.g*=v;c.b*=v;c.lerp(BBF_BROWN,0.35*_bbFr(b*17.3+d*3.1));
  if(_bbFr(a*91.7+b*3.3)>1-soot)c.lerp(BBF_SOOT,0.6);return c;}
const bbSm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x);};
// the colour of something at heat T (1 white-hot ... 0 dark red)
function bbHeat(T,out){T=Math.max(0,Math.min(1,T));for(let i=1;i<BBF_HEAT.length;i++)if(T<=BBF_HEAT[i][0]){const a=BBF_HEAT[i-1],b=BBF_HEAT[i];return out.copy(a[1]).lerp(b[1],(T-a[0])/(b[0]-a[0]));}return out.copy(BBF_HEAT[5][1]);}
// one cube into a batch (a plain scale and place: these never turn)
function bbPut(M,n,x,y,z,s,c){const a=M.instanceMatrix.array,o=n*16;a[o]=s;a[o+1]=a[o+2]=a[o+3]=a[o+4]=0;a[o+5]=s;a[o+6]=a[o+7]=a[o+8]=a[o+9]=0;a[o+10]=s;a[o+11]=0;a[o+12]=x;a[o+13]=y;a[o+14]=z;a[o+15]=1;
  const C=M.instanceColor.array;C[n*3]=c.r;C[n*3+1]=c.g;C[n*3+2]=c.b;}
// the white of the flash over the whole picture (under the HUD and menus)
function bbFlashEl(){if(BBF.el===null){BBF.el=0;try{const w=document.getElementById('world'),e=document.createElement('div');e.style.cssText='position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none';
  if(w&&w.parentNode&&w.parentNode.insertBefore){w.parentNode.insertBefore(e,w.nextSibling);BBF.el=e;}}catch(e){}}return BBF.el||null;}
function bbFxStart(J){
  const C=J.C,host=!netGuest(),fresh=J.fresh||!host;
  if(!fresh)return;   // (an old one from a save: just carved, no show)
  if(host){// fires and plumes round the rim, each lit as the ring reaches it
    for(let i=0;i<BB_FIRES+BB_PLUMES;i++){const a=Math.random()*Math.PI*2,d=C.R*(0.66+Math.random()*0.24);J.fires.push({x:C.x+Math.cos(a)*d,z:C.z+Math.sin(a)*d,d,big:i<BB_PLUMES});}
    J.fires.sort((a,b)=>a.d-b.d);}
  // its cubes' numbers, from the seed (four a cube)
  const sd=new Float32Array(5800*4);let h=(C.s*2654435761)>>>0||1;for(let i=0;i<sd.length;i++){h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;sd[i]=h/4294967296;}
  // who hears the boom when: each player by how far off they are
  const ear=[];for(const q of players)if(q.active){const d=Math.hypot(pwx(q)-C.x,pwz(q)-C.z);ear.push({q,d,t:d/BBF_SPD});}
  BB.clouds.push({x:C.x,y:C.y,z:C.z,R:C.R,t:0,sd,ear,snd:false,wx:0,wz:0});
}
// the boom, the shake and the rumble, as the sound gets to each player
function bbBoom(CL){
  for(let i=CL.ear.length-1;i>=0;i--){const E=CL.ear[i];if(CL.t<E.t)continue;CL.ear.splice(i,1);const k=Math.max(0.3,1-E.d/(CL.R*5));
    if(!CL.snd&&audio){CL.snd=true;const v=Math.max(0.3,1-E.d/(CL.R*10));noise(5,1.5*v,180,'lowpass');tone('sawtooth',42,12,4.5,0.5*v);tone('sine',30,16,6,0.45*v);}
    if(!SBX&&E.q.active){E.q.shake=Math.max(E.q.shake,1.2*k);rumble(E.q,k,1500);}}
}
function bbFxTick(dt){
  const B=BBF;let ng=0,nc=0,nw=0,fl=0,glow=0;BB.glowP=null;
  const Lw=WORLD_LIGHT.value,fog=scene.fog,P=players.filter(q=>q.active);if(fog)_bbFog.copy(fog.color);
  // (a cloud's cubes are lit, not glowing: dimmed by the world's light, then toward the fog's colour by how far off it is)
  // (a cube of cloud: place, size, colour and how see-through)
  const put=(x,y,z,s,c,al)=>{const o=nc*8,S=BBF_ST;S[o]=x;S[o+1]=y;S[o+2]=z;S[o+3]=s;S[o+4]=c.r;S[o+5]=c.g;S[o+6]=c.b;S[o+7]=al;nc++;};
  let FK=0;const lit=c=>{c.r*=Lw.r;c.g*=Lw.g;c.b*=Lw.b;if(FK>0)c.lerp(_bbFog,FK);return c;};
  for(let i=BB.clouds.length-1;i>=0;i--){const CL=BB.clouds[i];CL.t+=dt;const T=CL.t,R=CL.R,sd=CL.sd;
    if(T>BBF_LIFE){BB.clouds.splice(i,1);continue;}
    CL.roll=(CL.roll||0)+0.8*bbSm(1,4,T)*Math.exp(-T/30)*dt;
    bbBoom(CL);
    {const w=windNow(),g=bbSm(4,12,T)*BBF_WIND;CL.wx+=w.x*g*dt;CL.wz+=w.z*g*dt;}
    // the flash: the screen whited out, and the sky and the world lit up
    fl=Math.max(fl,1-Math.pow(T/1.4,0.7));if(T<6)WX.flash=Math.max(WX.flash,1.6*Math.exp(-T/1.5));
    let dmin=Infinity;for(const q of P)dmin=Math.min(dmin,Math.hypot(pwx(q)-CL.x,pwz(q)-CL.z));
    FK=fog?Math.min(0.45,dmin/(fog.far*4)):0;
    const rise=1-Math.exp(-T/7),capH=CL.y+R*(0.18+0.95*rise),rfb=R*0.2*Math.min(1,Math.pow(T/0.6,0.45)),cube=R*0.032;
    const k=bbSm(1.5,7,T),Rt=R*(0.11+0.2*rise),rt=R*(0.085+0.06*rise),cx=CL.x+CL.wx*k,cz=CL.z+CL.wz*k;
    // how bright it glows (the fireball, then the cap's underside a while), for the night's light
    const gi=Math.min(1,1.2*Math.exp(-T/5)+0.35*Math.exp(-T/25))*(1-bbSm(R*3,R*10,dmin));
    if(gi>glow){glow=gi;BB.glowP={x:cx,y:CL.y+(capH-CL.y)*k+rfb*(1-k),z:cz,R,k:gi};}
    // ---- the fireball, rolling up into the cap ----
    for(let j=0;j<1800;j++){const o=j*4,a=sd[o],b=sd[o+1],c=sd[o+2],d=sd[o+3];
      const sz=cube*(0.8+0.5*d)*(1-bbSm(60+30*d,95+15*d,T));if(sz<0.05)continue;
      // (one shape all the way: a ring whose hole starts at nothing is a ball, each cube at its latitude on it; the hole opens, the
      // tube thins, and the surface rolls over the top, down the outside and in underneath, inner cubes faster, so it fills round)
      const u=2*a-1,ph=2*Math.PI*b,rr=0.55+0.45*Math.cbrt(c),by=CL.y+rfb*0.85+R*0.25*bbSm(0.8,3,T),cy=by+(capH-by)*k;
      const tp=Math.asin(u)-CL.roll*(0.5+1.0*(1-rr)/0.45),tr=(rfb+(rt-rfb)*k)*rr,rad=Rt*k+tr*Math.cos(tp),under=Math.sin(tp)<-0.2?k:(Math.cos(tp)<-0.6?0.5*k:0);
      const x=cx+Math.cos(ph)*rad,z=cz+Math.sin(ph)*rad,y=cy+tr*Math.sin(tp)*(1-0.25*k)+R*0.03*(d-0.5)*k;
      const Tm=Math.exp(-T/1.6)*(1.15-0.35*rr)+under*0.55*Math.exp(-Math.max(0,T-3)/12);
      if(Tm>0.32){if(ng<BBF_N)bbPut(B.glow,ng++,x,y,z,sz,bbHeat(Tm,_bbc));}
      else if(nc<BBF_N){const sk=Math.min(1,(0.32-Tm)/0.25);_bbc.setHex(0x5e534c).lerp(_bbc2.setHex(0xbdb4aa),Math.max(0,Math.min(1,(y-capH)/rt*0.5+0.5)));
        lit(bbVar(_bbc,a,b,d,0.16)).lerp(bbHeat(Tm,_bbc2),1-sk);put(x,y,z,sz*(1+0.4*k),_bbc,(0.85-0.35*(rr-0.55)/0.45*k)*(1-bbSm(55,100,T)));}}
    // ---- the stem: dust drawn up from the ground into the cap, leaning with it ----
    const gro=bbSm(1.2,5,T),top=capH-rt*0.7;
    for(let j=0;j<700&&nc<BBF_N;j++){const o=(2000+j)*4,a=sd[o],b=sd[o+1],c=sd[o+2],d=sd[o+3],hf=(a+T*0.08)%1;if(hf>gro)continue;
      const sz=cube*(0.9+0.5*d)*1.2*(1-bbSm(45+30*d,80+20*d,T));if(sz<0.05)continue;
      // (flaring out at the top into the underside of the ring, loose and thinning there)
      const fl=bbSm(0.68,1,hf),y=CL.y+hf*(top-CL.y)+fl*rt*0.45*(d-0.35),wid=R*0.045*(1+(1-hf)*(1-hf)*1.6)*(0.4+0.6*Math.sqrt(c))+fl*fl*(Rt*k*0.9+rt*0.4)*(0.3+0.7*c),ang=2*Math.PI*b+T*0.04*(1-0.6*fl),lean=k*hf*hf;
      _bbc.setHex(0x7e6e5c).lerp(_bbc2.setHex(0xaba196),hf);lit(bbVar(_bbc,a,b,d,0.1));if(T<10)_bbc.lerp(_bbc2.setHex(0xff8a30),0.5*hf*hf*Math.exp(-T/5));
      put(CL.x+CL.wx*lean+Math.cos(ang)*wid,y,CL.z+CL.wz*lean+Math.sin(ang)*wid,sz*(1+0.7*fl),_bbc,(0.7-0.35*fl)*(1-bbSm(50,90,T)));}
    // ---- the ground surge: a ring of dust going out with the shock, then settling ----
    // (once out, it keeps billowing: rolling over, climbing, spreading further and drifting off with the wind as it thins)
    const ring=R*1.1*(1-Math.exp(-T/1.6)),fade=1-bbSm(20,58,T),bil=bbSm(1.5,30,T);
    if(fade>0)for(let j=0;j<1200&&nc<BBF_N;j++){const o=(3000+j)*4,a=sd[o],b=sd[o+1],c=sd[o+2],d=sd[o+3],ph=T*(0.35+0.45*d)+a*40,ang=2*Math.PI*a+T*0.006*(b-0.5);
      const r=ring*(1-0.18*b*Math.min(1,T/2))+R*0.02*(c-0.5)+R*0.22*bil*(0.25+0.75*b)+R*0.018*Math.sin(ph)*bil;
      const hh=R*0.045*(1-b)*(0.4+0.6*c)*(0.4+0.6*Math.exp(-T/8))+R*0.07*bil*c*(1.2+Math.cos(ph*0.8+d*6));_bbc.setHex(0xb3a48c);lit(bbVar(_bbc,a,b,d,0.06));if(T<1.2)_bbc.lerp(_bbc2.setRGB(1,1,1),1-T/1.2);
      put(CL.x+Math.cos(ang)*r+CL.wx*bil*0.45,CL.y+hh*0.5,CL.z+Math.sin(ang)*r+CL.wz*bil*0.45,cube*1.1*(0.6+0.8*d)*(1+1.3*bil)*Math.sqrt(fade),_bbc,0.62*fade*(1-0.45*bil));}
    // ---- the condensation dome round the fireball for a moment, and the collar round the stem ----
    const wk=bbSm(0.25,0.6,T)*(1-bbSm(1.5,3.2,T));
    if(wk>0.01){B.wil.material.opacity=0.55*wk;const rw=R*(0.3+0.25*bbSm(0.25,3,T));lit(_bbc2.setRGB(1,1,1));
      for(let j=0;j<1100&&nw<BBF_W;j++){const o=(4200+j)*4,a=sd[o],b=sd[o+1],c=sd[o+2],u=b*0.95,ph=2*Math.PI*a,sq=Math.sqrt(1-u*u);
        bbPut(B.wil,nw++,CL.x+sq*Math.cos(ph)*rw,CL.y+u*rw*0.85+R*0.04,CL.z+sq*Math.sin(ph)*rw,cube*1.4*(0.7+0.6*c),_bbc2);}}
    const ck=bbSm(7,11,T)*(1-bbSm(30,45,T));
    if(ck>0.01){const ch=CL.y+(capH-CL.y)*0.5,cr=R*0.16*(0.6+0.4*rise);
      for(let j=0;j<320&&nc<BBF_N;j++){const o=(5400+j)*4,a=sd[o],b=sd[o+1],c=sd[o+2],d=sd[o+3],ang=2*Math.PI*a+T*0.03*(b-0.4),r=cr*(0.7+0.6*b)*(1+0.08*Math.sin(T*0.5+d*9));
        _bbc.setHex(0xe2ddd5).lerp(_bbc2.setHex(0xa9a196),0.6*c);lit(bbVar(_bbc,a,b,d,0.03));
        put(CL.x+CL.wx*k*0.25+Math.cos(ang)*r,ch+R*0.05*(c-0.5)*(1-Math.abs(b-0.5)),CL.z+CL.wz*k*0.25+Math.sin(ang)*r,cube*(0.7+0.9*d)*1.2*ck,_bbc,0.6*ck);}}
  }
  fxSent(B.glow,ng);bbCloudSend(nc);fxSent(B.wil,nw);
  const e=(fl>0||BBF.el)&&bbFlashEl();if(e){const v=Math.max(0,fl).toFixed(3);if(e.style.opacity!==v)e.style.opacity=v;}
  BB.glowK=glow*0.4;   // (after dark: how far the world's light goes orange, read by updateSky)
}
// (updateSky, after the weather's flash) the night lit orange by a blast, and the sky low down with it
function bbGlowSky(){if(BB.glowK<=0)return;const k=BB.glowK*skyU.uNight.value;if(k<=0.002)return;
  WORLD_LIGHT.value.lerp(BB_GLOWC,k);skyU.uHor.value.lerp(BB_GLOWC,k*0.8);skyU.uTop.value.lerp(BB_GLOWC,k*0.3);}
// (carLightsView, with Block lighting on after dark) a pool of its light on the ground round it, in the last moving light's place
function bbMovLight(j,dk){const G=BB.glowP;if(!G||G.k<0.02||dk<=0)return j;const i=Math.min(j,MOV_LN-1),n=G.k*dk;
  MOVL_U.uMovP.value[i].set(G.x,G.y,G.z,G.R*2.6);MOVL_U.uMovC.value[i].set(BB_GLOWC.r*n,BB_GLOWC.g*n,BB_GLOWC.b*n);return Math.max(j,i+1);}
// (host) debris thrown off the front as it's carved, the dust it raises, and the rim's fires as the ring gets to them
function bbEdgeFx(J){
  const C=J.C;
  if(J.fx.length){let dx=0,dz=0;for(const q of J.fx){dx+=q.x-C.x;dz+=q.z-C.z;}const h=Math.hypot(dx,dz)||1;destroyFX(J.fx,{force:2.6,dx:dx/h,dz:dz/h,up:1.6},true);}
  if(J.ring<C.R)for(const q of players){if(!q.active)continue;const a=Math.atan2(pwz(q)-C.z,pwx(q)-C.x)+(Math.random()-0.5)*1.2,x=C.x+Math.cos(a)*J.ring,z=C.z+Math.sin(a)*J.ring;
    if(Math.hypot(x-pwx(q),z-pwz(q))<140)puff(x,C.y,z,3,0x9a8a74,2.5);}
  while(J.fires.length&&J.fires[0].d<=J.ring){const F=J.fires.shift();if(!chunks.has(ckey(Math.floor(F.x/CS),Math.floor(F.z/CS))))continue;
    const g=supportAt(F.x,F.z,H-1),y=g===null?C.y:g;
    if(F.big)addFire(F.x,y,F.z,3,60,false,{smoke:4,rise:3.4,spread:1});else addFire(F.x,y,F.z,1.4+Math.random()*1.6,30+Math.random()*30,true,{smoke:1,rise:1.4,spread:0.6});}
}
// ---- the nuclear plant: lose a reactor and, after a few seconds' siren, the whole place goes up ----
function bbNukeKey(B){const S=superOf(B.px,B.pz)||bigPlainsAt(B.px,B.pz);return S?'nuke:'+S.ax+','+S.az:'nuke:'+B.key;}
function bbReactor(B){
  if(netGuest()||!B||B.b.style!=='contain')return;const key=bbNukeKey(B);if(wrecked[key]||BB.armed.some(a=>a.key===key))return;
  const b=B.b,x=B.px*CELL+(b.x0+b.x1)/2,z=B.pz*CELL+(b.z0+b.z1)/2;
  BB.armed.push({key,x,z,t:6,s:7});
}
function bbArmTick(dt){
  for(let i=BB.armed.length-1;i>=0;i--){const A=BB.armed[i];A.t-=dt;
    if(Math.ceil(A.t)<A.s&&A.t>0){A.s=Math.ceil(A.t);flashLabel('☢ Meltdown: '+A.s);
      if(audio){tone('square',520,880,0.45,0.08);tone('square',880,520,0.45,0.08,0.5);}}
    if(A.t<=0){BB.armed.splice(i,1);wrecked[A.key]=1;bigBlast(A.x,G+1,A.z,160);}}
}
// (a reactor brought down, or knocked about till it no longer stands)
{const cb=collapseBuilding;collapseBuilding=function collapseBuilding(B,L,push){const r=cb(B,L,push);try{bbReactor(B);}catch(e){}return r;};}
{const nb=noteBlock;let n=0;noteBlock=function noteBlock(x,y,z,v,B){nb(x,y,z,v,B);if(B&&B.b.style==='contain'&&!(++n%40)&&!netGuest()&&!bldgStanding(B.b,B.px,B.pz,B.key))bbReactor(B);};}
// the Testing Environment's button: one ahead of Gus, its edge where he stands
function bbHere(R){
  const p=players.find(q=>q.active)||P1,fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);
  return bigBlast(pwx(p)+fx*R,G+1,pwz(p)+fz*R,R);
}
