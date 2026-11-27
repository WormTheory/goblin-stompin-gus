// The far rings don't work out what the curve of the world hides: a plot the horizon covers gets a stand-in, one coarse
// box (farHid and farCached, render/far-city.js). The picture must come out the same as if every plot were worked out,
// because the shader was already hiding those boxes one by one. This checks that, without drawing anything:
//  1. standing at a few spots, at street level, 120 blocks up and at the ceiling, the rings are built both ways (the
//     free camera switches the horizon rule off) and every box that would be drawn, by the shader's own test
//     (horizHidden, core/setup.js) from that camera, must be in both builds, ring by ring: none missing, no stand-in showing;
//  2. flying and climbing, the rings left to build at their real few milliseconds a frame, for how long a stand-in
//     showed over the horizon (coarse land where the plot's own boxes should be, until the next build lands). None is
//     allowed in level flight, in a helicopter's climb or in a jet stood on its tail (a plane's builds are made for its
//     ceiling); thrown or shot straight up on foot, which nothing in the game does that fast, it only says how long.
// Usage: node farhoriz.js     (VIEW=2400 the view distance, SPOTS=300,300,2500,-1800 where to stand)
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;
const VIEW=+(process.env.VIEW||2400),SPOTS=(process.env.SPOTS||'300,300,2500,-1800').split(',').map(Number);
T.viewSetting=VIEW;T.farDirty=true;
const P=T.players[0],LODS=T.LODS,G=T.G,names=['near ring','middle ring','far ring','backdrop'];
const settle=()=>{T.updateFar(1/60);for(let i=0;i<40000&&LODS.some(L=>L.job);i++)T.updateFar(1/60);};
const put=(x,y,z)=>{P.pos.x=x;P.pos.y=y;P.pos.z=z;P.camera.position.set(x,y+2,z);};
// (each ring's shown boxes by where and how big they are, with what the shader's horizon test goes by: the middle, half
// the width across the corners, and the top. The floor a ring lays under itself is left out: it's as big as the ring)
const shown=E(`()=>LODS.map(L=>{const out=new Map();for(const F of [L.B,L.G]){const a=F.m.instanceMatrix.array;for(let i=0;i<F.m.count;i++){const o=i*16,
    sx=Math.hypot(a[o],a[o+1],a[o+2]),sy=Math.hypot(a[o+4],a[o+5],a[o+6]),sz=Math.hypot(a[o+8],a[o+9],a[o+10]),cx=a[o+12],cy=a[o+13],cz=a[o+14];
    if(Math.abs(sy-0.1)<0.02&&Math.abs(cy-G-0.35)<0.02&&sx>500)continue;
    let k='';for(let j=0;j<15;j++)k+=Math.round(a[o+j]*50)+',';out.set(k,[cx,cy,cz,0.71*Math.max(sx,sz),cy+sy/2]);}}return out;})`);
const seen=E(`(b,x,y,z)=>{CURVE_CAM.set(x,y,z);return !horizHidden(b[0],b[1],b[2],b[3],b[4]);}`);
// (the stand-ins in each ring's shown build: every plot a build is given is noted as farCached hands it over, and the
// list goes with the build when it's swapped in)
const cur=new Map(),standShown=LODS.map(()=>[]);
E(`(note,done)=>{const o=farCached;farCached=function*(L,k,SB,SG,a,b,fn,x){yield* o(L,k,SB,SG,a,b,fn,x);if(L&&L.plan){const E=L.cache.get(k);if(E&&E.lo!==undefined)note(L,E);}};
  const c=farCommit;farCommit=L=>{c(L);done(L);};}`)((L,E)=>{let C=cur.get(L);if(!C||C.bn!==L.bn)cur.set(L,C={bn:L.bn,list:[]});C.list.push(E);},
  L=>{const C=cur.get(L),i=LODS.indexOf(L);if(i>=0)standShown[i]=C&&C.bn===L.bn?C.list:[];});
const boxesOf=E=>{const out=[];for(const a of [E.b,E.g])if(a){const n=a.length/26;for(let i=0;i<n;i++){const o=i*16,
  sx=Math.hypot(a[o],a[o+1],a[o+2]),sy=Math.hypot(a[o+4],a[o+5],a[o+6]),sz=Math.hypot(a[o+8],a[o+9],a[o+10]);out.push([a[o+12],a[o+13],a[o+14],0.71*Math.max(sx,sz),a[o+13]+sy/2]);}}return out;};
let ok=true,n1=0;
// ---- 1. the same picture, standing ----
for(let s=0;s+1<SPOTS.length;s+=2)for(const [nm,alt] of [['street level',3],['120 up',120],['the ceiling',T.H-G]]){
  const x=SPOTS[s],z=SPOTS[s+1],y=G+alt;
  T.DT.freecam=false;put(x,y,z);T.farDirty=true;settle();const A=shown(),nA=A.map(m=>m.size);
  T.DT.freecam=true;T.farDirty=true;settle();const B=shown(),nB=B.map(m=>m.size);T.DT.freecam=false;
  let miss=0,extra=0,vis=0;const eg=[];
  for(let i=0;i<4;i++){
    for(const [k,b] of B[i])if(seen(b,x,y+2,z)){vis++;if(!A[i].has(k)){miss++;if(eg.length<4)eg.push('missing from the '+names[i]+': a box at '+b.slice(0,3).map(v=>v.toFixed(0)).join(',')+' top '+b[4].toFixed(1));}}
    for(const [k,b] of A[i])if(seen(b,x,y+2,z)&&!B[i].has(k)){extra++;if(eg.length<4)eg.push('a box that should not show in the '+names[i]+' at '+b.slice(0,3).map(v=>v.toFixed(0)).join(',')+' top '+b[4].toFixed(1));}}
  n1+=vis;const nAll=nB.reduce((a,b)=>a+b,0),nNow=nA.reduce((a,b)=>a+b,0);
  console.log(('at '+x+','+z+', '+nm+':').padEnd(30)+String(vis).padStart(7)+' boxes in sight of '+nAll+' worked out in full; with the horizon rule '+nNow+' are built ('+Math.round(100-100*nNow/nAll)+'% fewer), '+miss+' missing, '+extra+' that should not show');
  for(const e of eg)console.log('      '+e);
  if(miss||extra)ok=false;
}
// ---- 2. stand-ins in sight while climbing ----
// (a stand-in shows if the ring draws it at all, inside its band round the player and inside what its build covers,
// and the horizon doesn't hide it from the camera)
const showing=()=>{let n=0;const x=P.pos.x,y=P.camera.position.y,z=P.pos.z;
  for(let i=0;i<3;i++){const L=LODS[i],r=L.ring.value,c=L.cov.c.value,cr=L.cov.r.value;if(r.y<=0)continue;
    for(const E of standShown[i])for(const b of boxesOf(E)){const d=Math.hypot(b[0]-x,b[2]-z);if(d+b[3]<r.x||d-b[3]>r.y)continue;
      if(Math.hypot(b[0]-c.x,b[2]-c.y)-b[3]>cr.y)continue;if(seen(b,x,y,z))n++;}}
  return n;};
const lagging=()=>LODS.slice(0,3).some(L=>L.bm>=0&&T.farLag(L,P.pos)>1);   // (a ring with nothing built yet draws nothing: the backdrop's there)
let ok2=true;
// (name, speed over the ground, climb, in a plane, and whether any stand-in showing fails the suite. A ring left behind,
// further from its build than the build allowed for, isn't counted: farspeed.js is the check on that)
for(const [nm,v,up,plane,must] of [['level at 213 blocks a second, 120 up',213,0,false,true],['a helicopter climbing 8 a second at 16',16,8,false,true],
    ['a jet at 213 pulled up to climb 150 a second',213,150,true,true],['thrown up at 40 a second for a second',0,40,false,false],['shot up at 120 a second on foot',0,120,false,false]]){
  const top=nm.startsWith('thrown')?G+43:T.H+80,y0=up?G+3:G+120;
  P.drv=plane?{k:'plane'}:null;put(900,y0,-400);T.farDirty=true;settle();
  let bad=0,fr=0,y=y0,lag=0;
  // (flies level for two seconds, climbs, then five seconds more level, for the builds behind to land)
  for(let f=0;f<60*60;f++){if(f>=120&&y<top){y=Math.min(top,y+up/60);fr=f;}if(f>(up?fr+300:1200))break;
    put(P.pos.x+v/60,y,P.pos.z+v*0.25/60);T.updateFar(1/60);
    if(f%6===0){if(lagging())lag++;else if(showing())bad++;}}
  // (times in ms, which baseline.sh masks: they differ run to run)
  console.log((nm+':').padEnd(48)+(bad?'stand-ins in sight for about '+bad*100+' ms':'no stand-in in sight')+(lag?' (a ring was left behind for '+lag*100+' ms of it, not counted)':''));
  if(bad&&must)ok2=false;
}
P.drv=null;
if(errs.length)console.log('errors:',errs.slice(0,5));
const good=ok&&ok2&&!errs.length&&n1>20000;
console.log(good?'PASS: the far rings show the same boxes with the horizon rule as without ('+n1+' in sight compared), and no stand-in shows in flight'
  :'FAIL: '+[ok?'':'the picture differs standing still',ok2?'':'a stand-in showed in flight',n1>20000?'':'too few boxes in sight to say ('+n1+')',errs.length?'errors':''].filter(Boolean).join(', '));
process.exit(good?0:1);
