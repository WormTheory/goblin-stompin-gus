// Chunk meshes made on worker threads (render/mesh-worker.js). Node has no workers, so the game normally makes every mesh
// there and then; this lends it stand-in workers that run the very script the game would send a real one (mwBody), in a
// sandbox of their own with nothing of the game's in reach (so a name the worker lacks shows up here), with every job and
// answer copied across as a real worker's would be, and the answers handed back a frame or more later. Checks: the
// worker's arrays are byte for byte those made on the main thread (plain, smashed, at night with the lamps on, leaves
// fallen, the snow's ruts); and in play, walking and smashing with the meshes made that way, every chunk ends up drawn
// exactly as making it again there and then draws it, nothing waits for ever, and a worker that fails hands back to the main thread.
const vm=require('vm');
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log(n,v?'ok':'BAD');};
global.THREE.BufferGeometry.prototype.setIndex=function(i){this.index=i;};
for(const f of els.play.L.click)f();pads.length=0;run(1);T.DT.invuln=true;
const src=T.mwBody();
const sandbox=()=>{const out=[];const ctx={postMessage:d=>out.push(d),onmessage:null,console};vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,out};};
// 1. the same arrays
const W=sandbox();
const same=(a,b)=>{if(!a||!b)return a===b;if(a.length!==b.length||a.constructor.name!==b.constructor.name)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i]&&!(a[i]!==a[i]&&b[i]!==b[i]))return false;return true;};
const sameR=(A,B)=>A.L.length===B.L.length&&A.L.every((d,i)=>{const e=B.L[i];if(!d||!e)return d===e;return ['p','u','c','k','b','i'].every(n=>same(d[n],e[n]));})
  &&same(A.rmB,B.rmB)&&(!A.light||same(A.light.lc,B.light.lc)&&A.light.ly0===B.light.ly0);
const P=T.players[0],cx0=Math.floor(P.pos.x/T.CS),cz0=Math.floor(P.pos.z/T.CS);
let n=0,bad=0,lit=0,water=0,marks=0;
const pass=tag=>{let b0=bad;const L=[];for(const [ax,az] of [[0,0],[17,5],[-23,31],[40,-12],[-60,-60]])for(let dx=0;dx<3;dx++)for(let dz=0;dz<3;dz++)L.push([cx0+ax+dx,cz0+az+dz]);
  for(const [cx,cz] of L.concat(extra)){
  const J=T.meshPrep(cx,cz,true);J.id=1;J.k=T.ckey(cx,cz);J.rm=null;
  W.out.length=0;W.ctx.onmessage({data:structuredClone(J,{transfer:T.meshXfer(J)})});const d=W.out[0];
  if(!d||d.err){bad++;if(bad<4)console.log('  worker failed:',d&&d.err);continue;}
  const J2=T.meshPrep(cx,cz,false),R=T.meshKernel(J2);n++;
  if(!sameR(structuredClone(d.R),R)){bad++;if(bad<4)console.log('  '+tag+' chunk',cx,cz,'differs');}
  if(R.L[0]&&R.L[0].b&&R.L[0].b.some(v=>v))lit++;if(R.L[1])water++;if(R.rmB)marks++;}
  console.log(' ',tag,'differing',bad-b0);};
// (and some chunks with paint or rails on their roads)
const extra=[];for(let r=0;r<40&&extra.length<6;r++)for(let i=-r;i<=r&&extra.length<6;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){if(extra.length>=6)break;const D=T.routeMarks(cx0+a,cz0+c);if(D&&!extra.some(q=>q[0]===cx0+a&&q[1]===cz0+c))extra.push([cx0+a,cz0+c]);}
pass('plain');
T.crush(cx0*T.CS+8,T.G+6,cz0*T.CS+8,6,-6,12);pass('smashed');
T.leafFall=0.5;pass('leaves fallen');T.leafFall=0;
console.log('chunks',n,'| with lamplight',lit,'| with water',water,'| with paint on the roads',marks);
chk('the worker makes the same arrays',n>100&&bad===0&&lit>0&&marks>0);
// 2. in play, through stand-in workers
const posted=[];let made=0;
class FakeWorker{constructor(){this.S=sandbox();made++;}
  postMessage(J,t){posted.push([this,structuredClone(J,{transfer:t}),posted.length]);}
  terminate(){this.dead=true;}}
global.Worker=FakeWorker;global.Blob=class{constructor(p){this.p=p;}};global.URL.createObjectURL=()=>'blob:x';
T.MW.off=false;   // (it gave up on workers at the start, finding none)
let delay=2,answered=0,maxWait=0;const fail={on:false};
// (each frame: the jobs posted at least `delay` frames ago are answered, the order mixed up a bit as two threads would)
const pump=()=>{const keep=[];for(const q of posted){q[2]++;if(q[2]<delay+(q[1].id%2)){keep.push(q);continue;}const [w,J]=q;if(w.dead)continue;
    w.S.out.length=0;if(fail.on)J.nineM=null;w.S.ctx.onmessage({data:J});const d=w.S.out[0];answered++;w.onmessage.call(w,{data:structuredClone(d)});}
  posted.length=0;posted.push(...keep);};
const go=f=>{for(let i=0;i<f;i++){step(1);pump();maxWait=Math.max(maxWait,T.MW.pend.size);}};
// (out of town and back, then a few buildings brought down, then smashing about)
P.pos.set(P.pos.x+400,T.G+30,P.pos.z+150);P.vy=0;go(240);
P.pos.set(P.pos.x-400,T.G+30,P.pos.z-150);P.vy=0;go(240);
const list=[];for(let px=-6;px<=6;px++)for(let pz=-6;pz<=6;pz++){const I=T.plotInfo(px,pz);(I.b||[]).forEach(b=>{if(b.top>T.G+12)list.push([px*T.CELL+(b.x0+b.x1)/2,pz*T.CELL+(b.z0+b.z1)/2]);});}
let downed=0;T.collInFrame=true;for(const [x,z] of list.slice(0,6)){const B=T.bldgAt(x,z);if(B){T.collapseBuilding(B,T.G+1+T.FH*2,{x:1,z:0});downed++;}}T.collInFrame=false;
for(let i=0;i<40;i++){T.crush(P.pos.x+((i*7)%30)-15,T.G+3,P.pos.z+((i*11)%30)-15,4,-3,6);go(3);}
go(600);
console.log('workers',made,'| jobs answered',answered,'| most waiting at once',maxWait,'| buildings brought down',downed);
chk('meshes were made on the workers',T.MW.ws.length>0&&answered>200);
chk('none left waiting',T.MW.pend.size===0&&T.rebuildQ.size===0);
// (every chunk as it is drawn, against making it again there and then)
const H=e=>{const L=[];for(const m of e.m){const g=m.geometry;for(const k of ['position','uv','color','aSky','aBlk'])if(g.attributes[k])L.push(Array.from(g.attributes[k].array).join());L.push(Array.from(g.index.array||g.index).join());}return L.join('|');};
let diff=0,all=0;const keys=[...T.meshes.keys()];
for(const k of keys){const e=T.meshes.get(k);if(e.cx>=T.SHIP_CX0)continue;const a=H(e);T.buildChunk(e.cx,e.cz);all++;if(H(T.meshes.get(k))!==a){diff++;if(diff<4)console.log('  chunk',e.cx,e.cz,'drawn differently');}}
chk('every chunk drawn as it would be made now ('+all+')',all>100&&diff===0);
// 3. a worker that fails: back to the main thread, and what was waiting is made there
fail.on=true;for(let i=0;i<10;i++){T.crush(P.pos.x+i*3-15,T.G+3,P.pos.z+5,4,-3,6);go(2);}fail.on=false;go(60);
chk('a failing worker hands back to the main thread',T.MW.off&&T.MW.ws.length===0&&T.rebuildQ.size===0&&/TypeError/.test(T.MW.why));
console.log('gave up on the workers:',T.MW.why.split(String.fromCharCode(10))[0]);
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
const pass2=ok.every(Boolean)&&!errs.length;console.log(pass2?'all ok':'FAILED');process.exit(pass2?0:1);
