// Takes real 3D screenshots of the game with the actual three.js (see tools/build_3d.py, which makes t3.html).
// Usage, from tools/ui: node real3d.js [seed] [outDir]
// (Software rendering by default, so the picture is right but the frame rate says nothing about a real graphics card.)
const {chromium}=require('playwright');
const fs=require('fs');
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
// (A saved seed makes every run show the same world.)
await p.addInitScript(s=>{if(!localStorage.getItem('goblin-city-v42'))localStorage.setItem('goblin-city-v42',JSON.stringify({seed:s}));},seed);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.screenshot({path:out+'/00-menu.png'});
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
await p.screenshot({path:out+'/01-spawn.png'});
const fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();const f=()=>{n++;performance.now()-t>3000?r(n/3):requestAnimationFrame(f)};requestAnimationFrame(f)}));
console.log('frames per second',fps.toFixed(1));
// (Scenes are found from the world's own data, since coordinates change with the seed.)
const scenes=await p.evaluate(()=>{const G=window.__G,P=G.players[0],o=P.pos,S=[];
  S.push(['02-above-spawn',o.x,o.y+45,o.z,P.cam.yaw,-0.7]);
  const L=G.routesNearBox(o.x-2500,o.z-2500,o.x+2500,o.z+2500).filter((r,i)=>i%2==0&&r);
  const view=(R,s,h,name)=>{const A=G.rtPoint(R,s),B=G.rtPoint(R,s+40);S.push([name,A.x,h,A.z,Math.atan2(A.x-B.x,A.z-B.z),-0.25]);};
  const moto=L.find(r=>r.kind==='moto'),country=L.find(r=>r.kind==='country');
  if(moto){view(moto,moto.L/2,moto.HY+8,'03-motorway');view(moto,2,moto.HY+10,'04-motorway-end');}
  if(country)view(country,country.L/2,52,'05-country-road');
  return S;});
for(const [name,x,y,z,yaw,pitch] of scenes){
  // (Held in place while the chunks and far rings load, otherwise he falls out of the shot.)
  await p.evaluate(([x,y,z,yaw,pitch])=>{clearInterval(window.__hold);const P=window.__G.players[0];window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;},20);},[x,y,z,yaw,pitch]);
  await p.waitForTimeout(15000);await p.screenshot({path:out+'/'+name+'.png'});console.log(name,Math.round(x),Math.round(y),Math.round(z));
}
console.log(errs.join('\n')||'no errors');await b.close();})();
