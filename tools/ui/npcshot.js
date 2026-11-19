// Real 3D screenshots of each light vehicle ridden by a goblin out in the traffic (vehicles/light-vehicles.js): a traffic
// car near the player is brought back from the pool as that kind (as after a wreck, its goblin hidden first: carSpawn
// must show him again) and goes on its way, and the free camera follows it.
// Usage, from tools/ui (after python ../build_3d.py ../../game/index.html t3.html): node npcshot.js [outDir] [kinds]
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'shots',KINDS=(process.argv[3]||'bicycle,kick,segway,moped').split(',');
fs.writeFileSync('t3npc.html',fs.readFileSync('t3.html','utf8').replace('window.__G={DT,','window.__G={DT,setVeh,carSpawn,'));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3npc.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
await p.evaluate(()=>{window.__G.DT.invuln=true;});
const cam=ci=>p.evaluate(ci=>{const G=window.__G;clearInterval(window.__fc);
  if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));
  window.__fc=setInterval(()=>{const o=G.cars[ci];if(!o)return;const g=o.g,h=g.rotation.y+1.1,x=g.position.x,z=g.position.z,y=g.position.y;
    const cx=x+Math.sin(h)*3.4,cz=z+Math.cos(h)*3.4;G.FC.pos.set(cx,y+1.5,cz);G.FC.yaw=Math.atan2(-(x-cx),-(z-cz));G.FC.pitch=-0.3;},5);},ci);
const used=[];
for(const k of KINDS){
  // (the nearest traffic car with a goblin at the wheel, going about its round)
  const ci=await p.evaluate(([k,used])=>{const G=window.__G,P=G.players[0];let best=-1,bd=1e9;
    G.cars.forEach((c,i)=>{if(c.alive&&c.g.visible&&c.driver&&!c.parked&&!c.hunter&&!c.police&&!c.svcPool&&!c.crew&&!used.includes(i)){const d=Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z);if(d<bd){bd=d;best=i;}}});
    if(best>=0){const c=G.cars[best];c.dh.visible=false;G.carSpawn(c,{veh:k,x:c.pos.x,y:c.pos.y,z:c.pos.z,h:c.heading,speed:4,parked:false});}return best;},[k,used]);
  if(ci<0){console.log(k,'no traffic car');continue;}used.push(ci);
  await cam(ci);await p.waitForTimeout(2500);await p.screenshot({path:out+'/npc-'+k+'.png'});
  const st=await p.evaluate(([ci,k])=>{const c=window.__G.cars[ci],R=c.vehG[k].rider;return 'driver head '+c.dh.visible+', rider '+(R&&R.visible)+', speed '+c.speed.toFixed(1);},[ci,k]);
  console.log(k.padEnd(8),st);
}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3npc.html');})();
