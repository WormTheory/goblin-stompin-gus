// Real 3D screenshots of who's at the controls (vehicles/driving.js, seatPose and RIDE_SEAT) and of the health bars over
// every vehicle (ui/minimap.js, Options' Health bars). In the Testing Environment as Gnash: each vehicle spawned parked,
// got into, and looked at from beside it with the free camera; then a Mobile Gear, a balloon and the barge, side by side
// with their bars.
// Usage, from tools/ui (after python ../build_3d.py ../../game/index.html t3.html): node ridershot.js [outDir] [kinds]
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'shots',KINDS=(process.argv[3]||'forklift,tractor,car,super,hover,truck,balloon').split(',');
// (a copy of t3.html with the few extra internals this needs on window.__G)
fs.writeFileSync('t3ride.html',fs.readFileSync('t3.html','utf8').replace('window.__G={DT,','window.__G={DT,tenvSpawnOne,setChar,drvEnter,drvExit,rideShown,'));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3ride.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(6000);
if(await p.evaluate(()=>!document.getElementById('testPanel').hidden))await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(4000);
await p.evaluate(()=>{const G=window.__G;G.DT.invuln=true;G.DT.hpBars=true;G.setChar('goblin');});await p.waitForTimeout(1500);
// the free camera beside whatever the player's in, looking at the seat
const cam=(d,ang,up)=>p.evaluate(([d,ang,up])=>{const G=window.__G,P=G.players[0];clearInterval(window.__fc);
  if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));
  window.__fc=setInterval(()=>{const D=P.drv;if(!D)return;const o=D.o,g=o.g,h=g.rotation.y+ang,x=g.position.x,z=g.position.z,y=g.position.y;
    const cx=x+Math.sin(h)*d,cz=z+Math.cos(h)*d;G.FC.pos.set(cx,y+up,cz);G.FC.yaw=Math.atan2(-(x-cx),-(z-cz));G.FC.pitch=-0.25;},5);},[d,ang,up]);
for(const k of KINDS){
  await p.evaluate(()=>{const G=window.__G,P=G.players[0];clearInterval(window.__fc);if(P.drv)G.drvExit(P);if(G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));P.cam.yaw=0;});
  await p.waitForTimeout(400);
  const msg=await p.evaluate(k=>window.__G.tenvSpawnOne(k),k);await p.waitForTimeout(800);
  const r=await p.evaluate(k=>{const G=window.__G,P=G.players[0];let D=null;
    if(k==='balloon'){const V=G.venues.get('tenvBalloons');const B=V&&V.bl[V.bl.length-1];if(B)D={k:'balloon',o:B,V};}
    else{const c=G.cars.filter(c=>c.alive&&c.g.visible&&c.veh===k).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];if(c)D={k:'car',o:c};}
    if(!D)return 'none';G.drvEnter(P,D);return 'in '+D.k+' shown '+G.rideShown(P)+(D.o.dh?' head '+D.o.dh.visible:'');},k);
  await p.waitForTimeout(900);
  await cam(k==='balloon'?7:k==='truck'?9:5.5,1.0,k==='balloon'?3.5:2.2);await p.waitForTimeout(900);
  await p.screenshot({path:out+'/ride-'+k+'.png'});console.log(k.padEnd(9),r,'|',msg.slice(0,50));
}
await p.evaluate(()=>{const G=window.__G,P=G.players[0];clearInterval(window.__fc);if(P.drv)G.drvExit(P);if(G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));});
// health bars: a Mobile Gear and a balloon spawned ahead, from behind the player
await p.evaluate(()=>{const P=window.__G.players[0];P.cam.yaw=Math.PI/2;});
for(const k of ['mech','balloon'])await p.evaluate(k=>window.__G.tenvSpawnOne(k),k);
// (stepped well back from them, looking their way)
await p.evaluate(()=>{const G=window.__G,P=G.players[0],x=P.pos.x+22,z=P.pos.z,y=P.pos.y;clearInterval(window.__hold);
  window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=Math.PI/2;P.cam.pitch=0.05;},16);});await p.waitForTimeout(1500);
await p.screenshot({path:out+'/ride-bars.png'});
console.log('bars over',await p.evaluate(()=>[...window.__G.venues.values()].filter(V=>V.kind==='mech'||V.kind==='balloon').map(V=>V.kind+' '+(V.mechs||V.bl).length).join(', ')));
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3ride.html');})();
