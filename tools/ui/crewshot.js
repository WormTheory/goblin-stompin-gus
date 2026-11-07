// Crews in the real page: the militia compound's technicals and four-wheelers parked empty, its people running out and
// climbing aboard once it's set off, then driving round Gus and firing; the base's soldiers running out of the barracks to
// the tanks; and close-ups of each vehicle, crewed, from the Testing Environment's buttons.
// Usage, from tools/ui (after python tools/build_3d.py game/index.html tools/ui/t3.html): node crewshot.js [outDir]
const {chromium}=require('playwright');
const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(6000);
const spawn=async k=>{await p.evaluate(k=>{const G=window.__G;clearInterval(window.__hold);G.tenvClear();G.tenvSpawn(k);},k);
  for(let i=0;i<60;i++){await p.waitForTimeout(500);if(!(await p.evaluate(()=>!!window.__G.TS.search)))break;}
  console.log(k,await p.evaluate(()=>document.getElementById('tpInfo').textContent));
  if(await p.evaluate(()=>!document.getElementById('testPanel').hidden))await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(9000);};
// hold Gus at (x,z), the camera looking at (lx,lz) from behind him, turned a little so he's not in the way
const hold=(x,z,lx,lz,pitch,yawOff)=>p.evaluate(([x,z,lx,lz,pitch,yawOff])=>{const G=window.__G,P=G.players[0];clearInterval(window.__hold);G.DT.invuln=true;
  const y=G.groundAt(x,z,80);window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.hp=20;P.heading=Math.atan2(lx-x,lz-z);P.cam.yaw=Math.atan2(-(lx-x),-(lz-z))+yawOff;P.cam.pitch=pitch;},16);},[x,z,lx,lz,pitch,yawOff]);
const state=()=>p.evaluate(()=>{const G=window.__G;return{v:G.CREWCARS.filter(c=>c.alive).map(c=>c.veh[0]+(c.crew?(c.crew.drv?'D':'-')+(c.crew.gun?'G':'-'):'')+'@'+c.pos.x.toFixed(0)+','+c.pos.z.toFixed(0)).join(' '),
  run:G.goblins.filter(g=>g.state==='chase'&&g.mount).length};});
const shot=async(n)=>{await p.screenshot({path:out+'/'+n+'.png'});console.log(n,JSON.stringify(await state()));};
if(process.env.ONLY!=='base'){
await spawn('militia');
const V=await p.evaluate(()=>{const V=[...window.__G.venues.values()].find(v=>v.kind==='guards'&&v.style==='militia');return{X0:V.X0,Z0:V.Z0};});
// from outside the south bank, looking across the yard at them, parked and empty
await hold(V.X0+46,V.Z0+80,V.X0+46,V.Z0+30,-0.2,0);await p.waitForTimeout(3500);await shot('militia-1-parked');
// in close: the camp's set off, and out they run from the HQ to the vehicles
await hold(V.X0+47,V.Z0+46,V.X0+46,V.Z0+28,-0.22,0.15);
for(const [w,n] of [[500,'militia-2-run-0'],[900,'militia-2-run-1'],[1200,'militia-2-run-2'],[2500,'militia-3-go-0'],[3000,'militia-3-go-1'],[3000,'militia-3-go-2']]){await p.waitForTimeout(w);await shot(n);}
}
// ---- the base: soldiers out of the barracks to the motor pool ----
await spawn('base');
const A=await p.evaluate(()=>{const V=[...window.__G.venues.values()].find(v=>v.kind==='army');return{X0:V.X0,Z0:V.Z0};});
await hold(A.X0+47,A.Z0+62,A.X0+47,A.Z0+36,-0.18,0.2);
for(const [w,n] of [[300,'base-1-run-0'],[700,'base-1-run-1'],[900,'base-1-run-2'],[2500,'base-2-go']]){await p.waitForTimeout(w);await p.screenshot({path:out+'/'+n+'.png'});
  console.log(n,await p.evaluate(()=>{const G=window.__G,V=[...G.venues.values()].find(v=>v.kind==='army');return V.mil.filter(M=>M.kind==='tank'&&M.state!=='park').map(M=>M.state+(M.crew?'*':'')).join(' ')+' | running '+G.goblins.filter(g=>g.state==='chase'&&g.mount).length;}));}
// ---- close-ups, from the Testing Environment's buttons ----
for(const t of ['technical','quad']){
  await p.evaluate(t=>{const G=window.__G;clearInterval(window.__hold);G.tenvClear();G.TS.n=1;G.TS.vm='park';G.tenvVeh(t);const c=G.CREWCARS.find(o=>o.alive);
    c.crew.drv={name:'A'};c.crew.gun={name:'B'};G.crewShow(c);c.crew.go=false;},t);
  const c=await p.evaluate(()=>{const c=window.__G.CREWCARS.find(o=>o.alive);return{x:c.pos.x,z:c.pos.z,h:c.heading};});
  const s=Math.sin(c.h+0.9),k=Math.cos(c.h+0.9),d=t==='quad'?5:8;
  await hold(c.x+s*d,c.z+k*d,c.x,c.z,-0.25,0.25);await p.waitForTimeout(2500);await shot('close-'+t);}
console.log(errs.join('\n')||'no errors');await b.close();})();
