// Real 3D screenshots of driving in goblin mode: up to a car, F, the view from behind it, and driving off.
// Usage, from tools/ui (after tools/build_3d.py has made t3.html): node driveshot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
await p.evaluate(()=>document.querySelector('#dbgCheat [data-k="gob"]').click());await p.waitForTimeout(1000);
// beside the nearest car on the street, stopped
let ok=false;for(let k=0;k<30&&!ok;k++){ok=await p.evaluate(()=>{const G=window.__G,P=G.players[0];
  const c=G.cars.filter(c=>c.alive&&c.g.visible&&!c.svcPool&&!c.police).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c)return false;c.speed=0;const h=c.heading;P.pos.set(c.pos.x-Math.cos(h)*(c.hx+0.7),c.pos.y+0.1,c.pos.z+Math.sin(h)*(c.hx+0.7));P.vy=0;P.state='walk';
  P.cam.yaw=Math.atan2(c.pos.x-P.pos.x,c.pos.z-P.pos.z)+Math.PI;P.cam.pitch=-0.2;window.__car=c;return true;});if(!ok)await p.waitForTimeout(1000);}
await p.waitForTimeout(300);await p.screenshot({path:out+'/drive-0-beside.png'});
await p.keyboard.down('KeyF');await p.waitForTimeout(500);await p.keyboard.up('KeyF');await p.waitForTimeout(1200);
console.log('in:',await p.evaluate(()=>{const P=window.__G.players[0];return P.drv?P.drv.k+' '+(P.drv.o===window.__car):'no';}));
await p.screenshot({path:out+'/drive-1-in.png'});
await p.keyboard.down('KeyW');await p.waitForTimeout(2500);await p.screenshot({path:out+'/drive-2-going.png'});await p.keyboard.up('KeyW');
await p.keyboard.down('KeyS');await p.waitForTimeout(2000);await p.keyboard.up('KeyS');
await p.keyboard.down('KeyF');await p.waitForTimeout(500);await p.keyboard.up('KeyF');await p.waitForTimeout(1500);
console.log('out:',await p.evaluate(()=>{const P=window.__G.players[0],c=window.__car;return(P.drv?'still in':'on foot')+' '+Math.hypot(P.pos.x-c.pos.x,P.pos.z-c.pos.z).toFixed(1);}));
await p.screenshot({path:out+'/drive-3-out.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
