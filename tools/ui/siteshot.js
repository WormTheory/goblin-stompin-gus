// The compounds' people and the military base's armour in the real page: the thieves, preppers and militia at their posts
// and roused, then the base's tanks and helicopters parked and then coming for Gus.
// Usage, from tools/ui (after python tools/build_3d.py game/index.html tools/ui/t3.html, with TENV, TS, tenvSpawn, tenvTick,
// tenvClear, tenvFoe, SHOTS, DT and groundAt added to window.__G): node siteshot.js [outDir]
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
const site=(style)=>p.evaluate(s=>{const V=[...window.__G.venues.values()].filter(v=>v.kind==='guards'&&v.style===s).pop();return V&&{cx:V.cx,cz:V.cz,posts:V.posts.map(q=>[q.x,q.z,q.y]),roused:V.roused};},style);
for(const [k,dist] of process.env.ONLY==='base'?[]:[['thieves',22],['prepper',40],['militia',50]]){
  await spawn(k);let V=await site(k);if(!V){console.log('no venue',k);continue;}
  const F=V.posts.find(q=>q[2]<50)||V.posts[0];
  await hold(F[0],F[1]+dist,F[0],F[1],-0.12,0.25);await p.waitForTimeout(3000);await p.screenshot({path:out+'/'+k+'-1-posts.png'});
  console.log(k,'calm',JSON.stringify(await site(k)).slice(0,60));
  await hold(F[0]+2,F[1]+(k==='thieves'?9:14),F[0],F[1],-0.1,0.3);
  for(let i=0;i<3;i++){await p.waitForTimeout(1300);await p.screenshot({path:out+'/'+k+'-2-roused-'+i+'.png'});}
  console.log(k,'roused',(await site(k)).roused,'shots',await p.evaluate(()=>window.__G.SHOTS.filter(s=>s.live).map(s=>s.kind).join(',')));
}
await spawn('base');
const army=()=>p.evaluate(()=>{const V=[...window.__G.venues.values()].find(v=>v.kind==='army');return V&&{X0:V.X0,Z0:V.Z0,W:V.W,alert:V.alert,mil:V.mil.map(M=>[M.kind,M.state,+M.x.toFixed(0),+M.y.toFixed(0),+M.z.toFixed(0)])};});
let A=await army();console.log('base',JSON.stringify(A).slice(0,200));
// outside the fence, looking at the motor pool and the pads
await hold(A.X0+48,A.Z0-14,A.X0+50,A.Z0+40,-0.12,0);await p.waitForTimeout(3000);await p.screenshot({path:out+'/base-1-parked.png'});
await hold(A.X0+78,A.Z0+30,A.X0+78,A.Z0+62,-0.15,0.2);await p.waitForTimeout(2500);await p.screenshot({path:out+'/base-2-helis.png'});
// in the base
await hold(A.X0+68,A.Z0+64,A.X0+46,A.Z0+42,-0.08,0.3);
for(let i=0;i<5;i++){await p.waitForTimeout(2000);await p.screenshot({path:out+'/base-3-attack-'+i+'.png'});}
A=await army();console.log('base after',JSON.stringify(A).slice(0,300));
await hold(A.X0+68,A.Z0+64,A.X0+90,A.Z0+64,0.3,0.4);await p.waitForTimeout(1500);await p.screenshot({path:out+'/base-4-up.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
