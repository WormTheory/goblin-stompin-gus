// Flies the Structures preview's camera into a structure and takes pictures inside (real three.js: t3.html).
// Usage, from tools/ui: node stfly.js [seed] [kind] [outDir]   (each shot: where it is in the structure's box, 0..1 across
// and along, the height above the ground, and which way it looks)
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),kind=process.argv[3]||'hospital',out=process.argv[4]||'shots/st';
const shots=JSON.parse(process.env.SHOTS||'[[0.5,0.5,1.8,0.6,-0.15],[0.3,0.4,6.5,2.2,-0.2],[0.5,0.5,40,0.6,-1.2]]');
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{document.getElementById('tabBtnDev').click();for(const d of document.querySelectorAll('#tabDev details.devsec'))d.open=d.id==='devSecStruct';});
await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('#devStDD>button').click());await p.waitForTimeout(200);
await p.evaluate(k=>document.querySelector('#devStList li[data-k="'+k+'"]').click(),kind);
for(let i=0;i<240;i++){await p.waitForTimeout(500);if(await p.evaluate(()=>!!window.__G.ST.box))break;}
await p.waitForTimeout(1500);
await p.evaluate(()=>window.__G.stFlySet(true));
const fig=await p.$('.devstfig');let n=0;
// (shots looking at the furniture: from a few blocks off a prop on the ground floor, then from upstairs)
const near=await p.evaluate(()=>{const G=window.__G,B=G.ST.box,L=G.activeProps.filter(f=>f.x>=B[0]&&f.x<B[2]&&f.z>=B[1]&&f.z<B[3]);const t={};for(const f of L)t[f.type]=(t[f.type]||0)+1;return {n:L.length,types:t,first:L.slice(0,400).map(f=>[f.x,f.y0,f.z,f.type])};});
console.log('props in box',near.n,JSON.stringify(near.types));
if(near.first.length){const pick=[near.first[Math.floor(near.first.length*0.3)],near.first[Math.floor(near.first.length*0.7)]];
  for(const [x,y,z] of pick){await p.evaluate(([x,y,z])=>{const S=window.__G.ST,F=S.fly;F.pos.set(x+3.2,y+1.6,z+3.2);F.yaw=Math.atan2(3.2,3.2);F.pitch=-0.3;F.V.pos.copy(F.pos);S.dressT=0;F.at.set(1e9,0,0);},[x,y,z]);
    await p.waitForTimeout(3500);await fig.screenshot({path:out+'/fly-'+kind+'-p'+(n++)+'.png'});}}
for(const [u,v,h,yaw,pitch] of shots){
  await p.evaluate(([u,v,h,yaw,pitch])=>{const S=window.__G.ST,B=S.box,F=S.fly;F.pos.set(B[0]+(B[2]-B[0])*u,44+h,B[1]+(B[3]-B[1])*v);F.yaw=yaw;F.pitch=pitch;F.V.pos.copy(F.pos);S.dressT=0;F.at.set(1e9,0,0);},[u,v,h,yaw,pitch]);
  await p.waitForTimeout(3500);await fig.screenshot({path:out+'/fly-'+kind+'-'+(n++)+'.png'});}
console.log(errs.join('\n')||'no errors');await b.close();})();
