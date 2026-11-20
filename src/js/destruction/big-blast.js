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
// ---- how it looks: a flash, a fireball, a shockwave ring along the ground, a mushroom cloud, debris off the front, fires round the rim ----
{const geo=new THREE.RingGeometry(0.9,1,96);for(let i=0;i<2;i++){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xfff2d8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);BB.rings.push({m,J:null});}}
// a puff of the fires' own smoke (fires.js), kept by the cloud and moved by it
function bbPuff(x,y,z,s,life,g,glow){const p=smokeP[smI];smI=(smI+1)%SM_N;p.x=x;p.y=y;p.z=z;p.vx=p.vy=p.vz=0;p.life=p.max=life;p.s=s;p.g=g;p.glow=glow;return p;}
function bbFxStart(J){
  const C=J.C,host=!netGuest(),fresh=J.fresh||!host;
  const R=BB.rings.find(o=>!o.J)||BB.rings[0];R.J=J;R.m.position.set(C.x,C.y+0.3,C.z);R.m.scale.setScalar(1);R.m.visible=true;
  if(!fresh)return;   // (an old one from a save: just carved, no show)
  WX.flash=1.5;for(const q of players)if(q.active){addShake(1.2,q.pos.x,q.pos.z,10);rumble(q,1,1500);}
  if(host){blastFx(C.x,C.y+C.R*0.05,C.z,2.2,C.R*0.14);
    if(audio){noise(5,1.5,180,'lowpass');tone('sawtooth',42,12,4.5,0.5);tone('sine',30,16,6,0.45);}
    // fires and plumes round the rim, each lit as the ring reaches it
    for(let i=0;i<BB_FIRES+BB_PLUMES;i++){const a=Math.random()*Math.PI*2,d=C.R*(0.66+Math.random()*0.24);J.fires.push({x:C.x+Math.cos(a)*d,z:C.z+Math.sin(a)*d,d,big:i<BB_PLUMES});}
    J.fires.sort((a,b)=>a.d-b.d);}
  // the mushroom cloud: a stem and a cap of the smoke pool's biggest puffs, rising and spreading for half a minute
  const CL={x:C.x,z:C.z,y:C.y,R:C.R,t:0,P:[]};
  for(let i=0;i<54;i++){const cap=i>=18,life=26+Math.random()*6,p=bbPuff(C.x,C.y,C.z,C.R*(cap?0.05:0.035)*(0.7+Math.random()*0.6),life,0.32+Math.random()*0.12,1);
    CL.P.push({p,max:life,cap,a:Math.random()*Math.PI*2,r:Math.sqrt(Math.random()),h:Math.random()});}
  BB.clouds.push(CL);
}
function bbFxTick(dt){
  for(const R of BB.rings){const J=R.J;if(!J)continue;const k=J.ring/(J.C.R*1.1);R.m.scale.setScalar(Math.max(1,J.ring));R.m.material.opacity=0.75*(1-k*k);
    if(J.done||k>=1){R.m.visible=false;R.J=null;}}
  for(let i=BB.clouds.length-1;i>=0;i--){const CL=BB.clouds[i];CL.t+=dt;const t=CL.t,rise=1-Math.exp(-t/4),capY=CL.y+10+CL.R*0.55*rise;let live=0;
    for(const q of CL.P){const p=q.p;if(p.max!==q.max||p.life<=0)continue;live++;
      if(q.cap){const rr=CL.R*(0.06+0.2*rise)*q.r,a=q.a+t*0.04;p.x=CL.x+Math.cos(a)*rr;p.z=CL.z+Math.sin(a)*rr;p.y=capY+(q.h-0.3)*CL.R*0.12*rise;}
      else{const rr=CL.R*0.05*q.r*(1+t*0.02);p.x=CL.x+Math.cos(q.a)*rr;p.z=CL.z+Math.sin(q.a)*rr;p.y=CL.y+q.h*(capY-CL.y);}
      p.vx=p.vy=p.vz=0;}
    if(!live||t>40)BB.clouds.splice(i,1);}
}
// (host) debris thrown off the front as it's carved, the dust it raises, and the rim's fires as the ring gets to them
function bbEdgeFx(J){
  const C=J.C;
  if(J.fx.length){let dx=0,dz=0;for(const q of J.fx){dx+=q.x-C.x;dz+=q.z-C.z;}const h=Math.hypot(dx,dz)||1;destroyFX(J.fx,{force:2.6,dx:dx/h,dz:dz/h,up:1.6},true);}
  if(J.ring<C.R)for(const q of players){if(!q.active)continue;const a=Math.atan2(pwz(q)-C.z,pwx(q)-C.x)+(Math.random()-0.5)*1.2,x=C.x+Math.cos(a)*J.ring,z=C.z+Math.sin(a)*J.ring;
    if(Math.hypot(x-pwx(q),z-pwz(q))<140)puff(x,C.y,z,3,0x9a8a74,2.5);}
  while(J.fires.length&&J.fires[0].d<=J.ring){const F=J.fires.shift();if(!chunks.has(ckey(Math.floor(F.x/CS),Math.floor(F.z/CS))))continue;
    const g=supportAt(F.x,F.z,H-1),y=g===null?C.y:g;
    if(F.big)addFire(F.x,y,F.z,3,60,false,{smoke:4,rise:3.4});else addFire(F.x,y,F.z,1.4+Math.random()*1.6,30+Math.random()*30,true,{smoke:1,rise:1.4});}
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
