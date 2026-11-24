// Does something fixed to the camera (the first-person weapon) stay put on screen as the view turns, far from the start?
// Renders one small box hung in front of the camera with the game's own renderer and materials (so the world-curve
// patch to three.js's project_vertex is in), at the start and tens of thousands of blocks out, turning the view a
// little at a time, and reports how far the box's edges wander in pixels (0 is right).
// Usage, from tools/ui after build_3d.py: node vmjit.js [t3.html]
const {chromium}=require('playwright');
const page=process.argv[2]||'t3.html';
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:480}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/'+page);await p.waitForFunction(()=>window.__G,null,{timeout:60000}).catch(()=>console.log('no __G',errs));await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{const G=window.__G,THREE=window.THREE,R=G.renderer;
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(70,640/480,0.1,1000);cam.rotation.order='YXZ';
  const vm=new THREE.Group();vm.rotation.order='YXZ';vm.scale.setScalar(0.5);sc.add(vm);
  const bx=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.11,0.42),new THREE.MeshLambertMaterial({color:0xffffff,emissive:0xffffff,depthTest:false,depthWrite:false,transparent:true}));
  bx.position.set(0.3,-0.3,-0.92);bx.frustumCulled=false;vm.add(bx);
  const rt=new THREE.WebGLRenderTarget(640,480),px=new Uint8Array(640*480*4),out={};
  const t0=R.getRenderTarget();
  for(const X of [0,20000,60000,200000]){let lo=[1e9,1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9,-1e9];const seen=[];
    for(let i=0;i<40;i++){const yaw=0.3+i*0.0007,pit=-0.1+i*0.0003;
      cam.position.set(X+0.37,61.7,-X*0.7+0.13);cam.rotation.set(pit,yaw,0);cam.updateMatrixWorld();
      vm.position.copy(cam.position);vm.rotation.set(pit,yaw,0);vm.updateMatrixWorld(true);
      R.setRenderTarget(rt);R.setClearColor(0,1);R.clear();R.render(sc,cam);R.readRenderTargetPixels(rt,0,0,640,480,px);
      let x0=1e9,y0=1e9,x1=-1,y1=-1;
      for(let y=0;y<480;y++)for(let x=0;x<640;x++){if(px[(y*640+x)*4]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
      const e=[x0,y0,x1,y1];seen.push(e.join(','));for(let k=0;k<4;k++){lo[k]=Math.min(lo[k],e[k]);hi[k]=Math.max(hi[k],e[k]);}}
    out[X]={wander:Math.max(...[0,1,2,3].map(k=>hi[k]-lo[k])),first:seen[0]};}
  R.setRenderTarget(t0);return out;});
for(const X in r)console.log('x',X.padStart(6),'edges wander',r[X].wander,'px (box at',r[X].first+')');
console.log(errs.join('\n')||'no errors');await b.close();})();
