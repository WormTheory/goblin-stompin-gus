// Real 3D screenshots of the light vehicles (vehicles/light-vehicles.js): each parked and empty, then ridden by Gnash
// (from beside, the free camera), and its instrument in the corner while it's going (the kick scooter has none).
// Usage, from tools/ui (after python ../build_3d.py ../../game/index.html t3.html): node lightshot.js [outDir] [kinds]
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'shots',KINDS=(process.argv[3]||'bicycle,kick,segway,moped').split(',');
fs.writeFileSync('t3light.html',fs.readFileSync('t3.html','utf8').replace('window.__G={DT,','window.__G={DT,tenvSpawnOne,setChar,drvEnter,drvExit,rideShown,'));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3light.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(6000);
if(await p.evaluate(()=>!document.getElementById('testPanel').hidden))await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(4000);
await p.evaluate(()=>{const G=window.__G;G.DT.invuln=true;G.setChar('goblin');});await p.waitForTimeout(1500);
const key=(code,dn)=>p.evaluate(([c,d])=>dispatchEvent(new KeyboardEvent(d?'keydown':'keyup',{code:c})),[code,dn]);
// (the free camera beside the vehicle at x,z, or the one the player's in)
const cam=(d,ang,up,c0)=>p.evaluate(([d,ang,up,c0])=>{const G=window.__G,P=G.players[0];clearInterval(window.__fc);
  if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));
  window.__fc=setInterval(()=>{const o=P.drv?P.drv.o:G.cars[c0];if(!o)return;const g=o.g,h=g.rotation.y+ang,x=g.position.x,z=g.position.z,y=g.position.y;
    const cx=x+Math.sin(h)*d,cz=z+Math.cos(h)*d;G.FC.pos.set(cx,y+up,cz);G.FC.yaw=Math.atan2(-(x-cx),-(z-cz));G.FC.pitch=-0.3;},5);},[d,ang,up,c0]);
const camOff=()=>p.evaluate(()=>{const G=window.__G;clearInterval(window.__fc);if(G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));});
for(const k of KINDS){
  await p.evaluate(()=>{const G=window.__G,P=G.players[0];if(P.drv)G.drvExit(P);P.cam.yaw=0;});await camOff();await p.waitForTimeout(400);
  await p.evaluate(k=>window.__G.tenvSpawnOne(k),k);await p.waitForTimeout(900);
  const ci=await p.evaluate(k=>{const G=window.__G,P=G.players[0];let best=-1,bd=1e9;G.cars.forEach((c,i)=>{if(c.alive&&c.g.visible&&c.veh===k){const d=Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z);if(d<bd){bd=d;best=i;}}});return best;},k);
  if(ci<0){console.log(k,'not spawned');continue;}
  await cam(3.2,1.1,1.4,ci);await p.waitForTimeout(900);await p.screenshot({path:out+'/'+k+'-parked.png'});
  await camOff();
  const r=await p.evaluate(ci=>{const G=window.__G,P=G.players[0],c=G.cars[ci];G.drvEnter(P,{k:'car',o:c});return 'shown '+G.rideShown(P);},ci);
  await p.waitForTimeout(600);await cam(3.6,1.2,1.5);
  await key('KeyW',true);await p.waitForTimeout(k==='kick'?400:1600);await p.screenshot({path:out+'/'+k+'-ridden.png'});
  await camOff();await p.waitForTimeout(1200);await key('KeyW',false);if(k==='moped'){await key('KeyD',true);await p.mouse.click(640,360,{button:'right'});await key('KeyD',false);}
  await p.waitForTimeout(300);await p.screenshot({path:out+'/'+k+'-hud.png'});
  const inst=await p.evaluate(()=>{const P=window.__G.players[0];const el=P.ui.speedo;return el.hidden?'none':el.getBoundingClientRect().toJSON();});
  if(inst!=='none')await p.screenshot({path:out+'/'+k+'-instrument.png',clip:{x:inst.x-10,y:inst.y-10,width:inst.width+20,height:inst.height+20}});
  console.log(k.padEnd(8),r,'| instrument',inst==='none'?'none':Math.round(inst.width)+'x'+Math.round(inst.height));
}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3light.html');})();
