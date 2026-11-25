// ---------- Chunk meshes made on threads of their own ----------
// Making a chunk's mesh takes 1 to 2.5 ms, and a building coming down asks for dozens of them, so most of it is done off the
// main thread: meshAsk gathers what the chunk needs (meshPrep, render/meshing.js), sends it to one of a couple of workers,
// which run meshKernel on it, and the meshes are made from what comes back at the start of a later frame (meshTick), a
// frame or two late. The workers are made from this very page's own functions (their source, taken here while the page
// loads, before the profiler wraps any of them) and fixed tables, sent as a Blob, so the game stays one file. Where there
// are no workers (the tests, in Node) or they fail, or for ships' chunks and the debug menu's hidden caves, sewers and
// subways, it's all done there and then as before (buildChunk), and the picture comes out the same either way.
const MW_FNS=[meshKernel,blkFlood,blkAt,blkKeep,emitBox,emitFence,emitRamp].map(f=>f.toString()).join('\n')+'\n'+MBuf.toString()+'\nconst FENCEISH='+FENCEISH.toString()+',mkBufs='+mkBufs.toString()+';\n';
// (at most this many waiting for a worker at once, so a crater's worth of rebuilds can't queue up seconds of work behind
// the chunks that come into view)
const MW_LIM=8;
const MW={ws:[],off:false,pend:new Map(),done:[],id:0,why:''};
// the worker's script: the tables it reads, its own working arrays, and the functions
function mwBody(){
  const val=x=>ArrayBuffer.isView(x)?'new '+x.constructor.name+'(['+Array.from(x).join(',')+'])':JSON.stringify(x);
  const blk=BLOCK.map(b=>b&&{tiles:b.tiles,liquid:b.liquid,glow:b.glow,ramp:b.ramp,thin:b.thin,hide:b.hide,post:b.post,stair:b.stair,solid:b.solid,transparent:b.transparent,brittle:b.brittle});
  const K={CS,H,G,AC,AR,DIM,AO,RD_OPEN,BLW,BLA,BLN,BL_QM,GM_M,FACES,FACE_T,B_OPQ,B_SEE,RD_TOP,G_MIX,TILE_AVG,BL_D,BL_CX,BL_CZ,GMC,BLOCK:blk,
    AIR,STONE,WATER,GRASS,LEAVES,PINE,METAL,FENCE,FENCE_W,CHAINLINK};
  let s='"use strict";\n';for(const k in K)s+='const '+k+'='+val(K[k])+';\n';
  s+='let BL_ON=true,snowRoads=true,BL_x0=0,BL_z0=0,BL_any=false,BL_y0=0,BL_y1=-1,BL_r=0,BL_g=0,BL_b=0,GM_T=new Float32Array(0);\n';
  s+='const BL_R=new Uint8Array(BLN),BL_G=new Uint8Array(BLN),BL_B=new Uint8Array(BLN),BL_INQ=new Uint8Array(BLN),BL_Q=new Int32Array(BL_QM+1),BL_COLO=new Int32Array(BLA),BL_COLA=new Array(BLA).fill(null);\n';
  s+=MW_FNS+'const MB=[mkBufs(),mkBufs()];\n';
  // (what comes back is handed over, not copied)
  s+='onmessage=e=>{const J=e.data;BL_ON=J.BL;snowRoads=J.sr;let R;try{R=meshKernel(J);}catch(err){postMessage({id:J.id,k:J.k,err:String(err&&err.stack||err)});return;}\n'+
     '  const t=[];for(const d of R.L)if(d)for(const n of ["p","u","c","k","b","i"])if(d[n])t.push(d[n].buffer);if(R.light&&R.light.lc)t.push(R.light.lc.buffer);if(R.rmB)t.push(R.rmB.buffer);\n'+
     '  postMessage({id:J.id,k:J.k,R},t);};\n';
  return s;
}
// the workers, made the first time they're wanted: two, or one on a machine with only two cores
function mwUp(){
  if(MW.ws.length)return true;if(MW.off)return false;
  if(typeof Worker==='undefined'||typeof Blob==='undefined'||typeof URL==='undefined'||!URL.createObjectURL){MW.off=true;MW.why='no workers here';return false;}
  try{const u=URL.createObjectURL(new Blob([mwBody()],{type:'text/javascript'})),n=Math.max(1,Math.min(2,(navigator.hardwareConcurrency||2)-1));
    for(let i=0;i<n;i++){const w=new Worker(u);w.n=0;w.onmessage=mwGot;w.onerror=e=>mwFail('worker: '+(e&&e.message));MW.ws.push(w);}}
  catch(e){mwFail(e);return false;}
  return true;
}
// back to making them all on the main thread, for the rest of the game: what was waiting is asked for again
function mwFail(why){
  MW.off=true;MW.why=String(why);console.warn('chunk meshes made on the main thread from now on:',MW.why);
  for(const w of MW.ws)try{w.terminate();}catch(e){}MW.ws.length=0;
  for(const [k,P] of MW.pend)if(P.re&&meshes.has(k))rebuildQ.add(k);
  MW.pend.clear();MW.done.length=0;chunkScan.key='';   // (new chunks that were waiting: updateChunks looks again)
}
function mwGot(e){
  const d=e.data;this.n--;const P=MW.pend.get(d.k);if(!P||P.id!==d.id)return;
  if(d.err){mwFail(d.err);return;}
  MW.pend.delete(d.k);MW.done.push([P,d.R]);
}
// a chunk's mesh, made on a worker if there are any (and the result taken up by meshTick), or there and then
function meshAsk(cx,cz){
  if(cx>=SHIP_CX0||GFX_OFF.caves||GFX_OFF.sewers||GFX_OFF.subway||!mwUp()){buildChunk(cx,cz);return;}
  const k=ckey(cx,cz),Q=MW.pend.get(k);if(Q){Q.again=true;return;}   // (one at a time for a chunk; changed meanwhile, it's asked again once that one's back)
  const J=meshPrep(cx,cz,true),id=++MW.id,w=MW.ws.reduce((a,b)=>b.n<a.n?b:a);
  MW.pend.set(k,{id,re:meshes.has(k),again:false,stale:false,t:performance.now(),J:{cx,cz,mx0:J.mx0,mz0:J.mz0,yLo:J.yLo,yTop:J.yTop,pk:J.pk,rm:J.rm}});
  J.rm=null;J.id=id;J.k=k;w.n++;
  try{w.postMessage(J,meshXfer(J));}catch(e){mwFail(e);buildChunk(cx,cz);}
}
// (made there and then while one was on its way: what comes back is out of date)
function meshStale(cx,cz){if(MW.pend.size){const P=MW.pend.get(ckey(cx,cz));if(P)P.stale=true;}}
// whether a chunk's mesh is on its way
const meshWaiting=k=>MW.pend.has(k);
// the meshes that have come back, made (each frame, before the rebuilds)
function meshTick(){
  if(!MW.done.length&&!MW.pend.size)return;
  const now=performance.now();for(const P of MW.pend.values())if(now-P.t>5000){mwFail('no answer in 5 s');return;}
  for(const [P,R] of MW.done){const k=ckey(P.J.cx,P.J.cz);
    // (a rebuild for a chunk since dropped, out of view, is thrown away)
    if(!P.stale&&(!P.re||meshes.has(k)))meshApply(P.J,R);else if(!P.re)chunkScan.key='';   // (a new one not used: updateChunks looks again)
    if(P.again&&meshes.has(k))rebuildQ.add(k);}
  MW.done.length=0;
}
// (a new world: whatever was on its way is for the old one)
function meshForget(){for(const P of MW.pend.values())P.stale=true;MW.done.length=0;}
