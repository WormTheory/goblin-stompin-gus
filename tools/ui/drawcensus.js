// What the renderer draws in a frame, by kind: walks the real game's scene and groups every shown mesh, so it's easy to see
// which things cost a draw call each. Software rendering, so only the counts mean anything, not the frame rate.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node drawcensus.js [seed] [wait ms]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),wait=+(process.argv[3]||15000);
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(wait);
const r=await p.evaluate(()=>{
  const G=window.__G,S=G.scene,R=G.renderer,cam=G.players[0].camera,M=new Map(),F=new window.THREE.Frustum(),P=new window.THREE.Matrix4();
  P.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);F.setFromProjectionMatrix(P);
  let shown=0,inView=0;
  const walk=(o,path)=>{if(!o.visible||!o.layers.test(cam.layers))return;
    if(o.isMesh||o.isLine||o.isPoints){shown++;
      const m=Array.isArray(o.material)?o.material[0]:o.material,g=o.geometry;
      if(!g.boundingSphere)g.computeBoundingSphere();
      const vis=!o.frustumCulled||F.intersectsObject(o);if(vis)inView++;
      const pos=g.attributes.position,tri=(g.index?g.index.count:pos?pos.count:0)/3*(o.isInstancedMesh?o.count:1);
      const k=(o.isInstancedMesh?'Inst ':'')+m.type+(m.map?' map':'')+(m.transparent?' transp':'')+' '+(o.userData.tag||'')+(path||'')+(g.type||'');
      let e=M.get(k);if(!e){e={n:0,vis:0,tri:0};M.set(k,e);}e.n++;if(vis){e.vis++;e.tri+=tri;}}
    for(const c of o.children)walk(c,path);};
  for(const c of S.children)walk(c,c.isMesh||c.isInstancedMesh?'':(c.name||c.type)+' > ');
  const groups=[];S.children.forEach((c,i)=>{if(c.isMesh)return;let n=0,sz=new Set(),mat=new Set();c.traverse(o=>{if(o.isMesh&&o.visible){n++;sz.add(o.geometry.type+JSON.stringify(o.geometry.parameters||{}).slice(0,40));mat.add(o.material.type+':'+(o.material.color?o.material.color.getHexString():''));}});if(n>1)groups.push([i,c.type,c.visible,c.position.x|0,c.position.z|0,n,[...sz].slice(0,3).join(' '),[...mat].slice(0,4).join(' ')]);});
  groups.sort((a,b)=>b[5]-a[5]);
  const un=new Map();S.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.visible||!o.layers.test(cam.layers)||!(o.parent&&o.parent!==S))return;let p=o;while(p){if(!p.visible)return;p=p.parent;}const m=o.material;const k=[o.geometry.type,JSON.stringify(o.geometry.parameters||{}).slice(0,30),m.type,m.color&&m.color.getHexString(),m.map?'map':'',m.transparent?'tr':'',m.opacity<1?'op':'',m.side,m.polygonOffset?'po'+m.polygonOffsetFactor:'',m._obc?'obc':'',m.snowU?'snow':''].join(' ');un.set(k,(un.get(k)||0)+1);});
  window.__un=[...un].sort((a,b)=>b[1]-a[1]).slice(0,25);
  return {un:window.__un,groups:groups.slice(0,1),calls:R.info.render.calls,tris:R.info.render.triangles,geos:R.info.memory.geometries,tex:R.info.memory.textures,progs:R.info.programs.length,shown,inView,top:[...M].sort((a,b)=>b[1].vis-a[1].vis).slice(0,40)};
});
console.log('calls',r.calls,'tris',r.tris,'geometries',r.geos,'textures',r.tex,'programs',r.progs,'shown',r.shown,'in view',r.inView);
for(const [k,e] of r.top)console.log(String(e.vis).padStart(5),'/',String(e.n).padEnd(5),String(Math.round(e.tri)).padStart(8),'tris ',k);
for(const g of r.un)console.log(g[1],g[0]);
console.log(errs.join('\n')||'no errors');await b.close();})();
