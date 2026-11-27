// Does the full-detail world keep up with the player? Player one is flown in a straight line at each of a few speeds
// (ALT blocks up, the whole game running 60 frames a second), and over the second half of each run it says how many of
// the chunks that should be drawn in detail (chunkOrder(viewR) round the player) were, on average and at worst; how far
// ahead along the line of flight the detail reached before the first chunk not yet drawn; how many chunks were made and
// meshed and what each cost; and the frames' times. Each run starts with everything in sight made.
// (Node has no workers, so every mesh is made on the main thread here: the real game hands most of that to its mesh
// workers and has more of each frame left for making chunks. Compare a change with itself, before and after.)
// Usage: node chunkspeed.js     (DETAIL=112 the detail distance, VIEW=2400 the far view, SECS=20 a run, ALT=120,
//                                SPEEDS=0,24,62,90,185: standing, a car, a supercar, an airliner, a jet)
const {T,E,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;step(120);
T.DT.invuln=true;
const DETAIL=+(process.env.DETAIL||112),VIEW=+(process.env.VIEW||2400),SECS=+(process.env.SECS||20),ALT=+(process.env.ALT||120);
const SPEEDS=(process.env.SPEEDS||'0,24,62,90,185').split(',').map(Number);
T.detailSetting=DETAIL;T.viewSetting=VIEW;E('viewR=VIEW_SOLO()');T.farDirty=true;
const P=T.players[0];
// (the share of the chunks in range that are drawn, and how far the detail reaches along +x, the way he's going)
const cov=E('(px,pz)=>{const R=viewR,pcx=Math.floor(px/CS),pcz=Math.floor(pz/CS);let n=0,m=0;for(const [dx,dz] of chunkOrder(R)){n++;if(meshes.has(ckey(pcx+dx,pcz+dz)))m++;}return [m,n];}');
const ahead=E('(px,pz)=>{const R=viewR,pcx=Math.floor(px/CS),pcz=Math.floor(pz/CS);for(let d=0;d<=R;d++)if(!meshes.has(ckey(pcx+d,pcz)))return d*CS;return (R+1)*CS;}');
let gens=0,genMs=0;E('(f)=>{const o=genChunk;genChunk=function(cx,cz){const t=performance.now();const r=o.apply(this,arguments);f(performance.now()-t);return r;}}')(ms=>{gens++;genMs+=ms;});
let builds=0,buildMs=0;E('(f)=>{const o=buildChunk;buildChunk=function(){const t=performance.now();const r=o.apply(this,arguments);f(performance.now()-t);return r;}}')(ms=>{builds++;buildMs+=ms;});
console.log('detail',DETAIL,'('+cov(P.pos.x,P.pos.z)[1],'chunks in range), far view',VIEW);
let x=P.pos.x;const z=P.pos.z,res=[];
const put=()=>{P.pos.set(x,T.G+ALT,z);P.vy=0;P.grounded=false;};
for(const v of SPEEDS){
  for(let i=0;i<120*60;i++){put();step(1);const c=cov(x,z);if(c[0]===c[1])break;}   // (everything in sight made first)
  gens=0;genMs=0;builds=0;buildMs=0;let sumC=0,minC=1,sumA=0,minA=1e9,n=0,fms=0,worst=0;
  for(let f=0;f<SECS*60;f++){x+=v/60;put();const t0=performance.now();step(1);const d=performance.now()-t0;fms+=d;worst=Math.max(worst,d);
    if(f>=SECS*30){const c=cov(x,z),r=c[0]/c[1];sumC+=r;minC=Math.min(minC,r);const a=ahead(x,z);sumA+=a;minA=Math.min(minA,a);n++;}}
  res.push({v,avg:sumC/n,min:minC});
  console.log('speed',String(v).padStart(4),'blocks/s | detail drawn avg',(100*sumC/n).toFixed(0).padStart(3)+'%','worst',(100*minC).toFixed(0).padStart(3)+'%','| reaches ahead avg',(sumA/n).toFixed(0).padStart(4),'least',String(minA).padStart(4),'blocks | made',String(gens).padStart(5),'('+(genMs/Math.max(1,gens)).toFixed(2)+' ms each) meshed',String(builds).padStart(5),'('+(buildMs/Math.max(1,builds)).toFixed(2)+' ms each) | frame avg',(fms/(SECS*60)).toFixed(2),'ms worst',worst.toFixed(0));
}
console.log('errors',errs.length);
const ok=!errs.length;
console.log(ok?'chunkspeed ok':'chunkspeed FAILED');
process.exit(ok?0:1);
