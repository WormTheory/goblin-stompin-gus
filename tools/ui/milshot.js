// Testing Environment vehicles in the real page: a tank, a helicopter, a plane and a motorcycle spawned ahead of a goblin
// (goblin mode), health bars on; walking into the tank; E gets into the plane and it takes off. node milshot.js [outDir]
const {chromium}=require('playwright');const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(8000);
await p.evaluate(()=>{const G=window.__G,P=G.players[0];G.DT.hpBars=true;G.DT.invuln=true;P.cam.yaw=Math.PI;G.TS.n=1;G.TS.vm='park';for(const t of ['tank','heli','plane','bike'])G.tenvVeh(t);});
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(1500);
await p.evaluate(()=>{const G=window.__G;G.setGob(true);});await p.waitForTimeout(4000);
const info=()=>p.evaluate(()=>{const G=window.__G,P=G.players[0];const A=G.venues.get('tenvArmy'),PL=G.venues.get('tenvPlanes');
  return {gus:[P.pos.x,P.pos.y,P.pos.z].map(v=>+v.toFixed(1)),drv:P.drv?P.drv.k:null,army:A?A.mil.map(M=>[M.kind,M.state,+M.x.toFixed(1),+M.y.toFixed(1),+M.z.toFixed(1),M.hp]):null,
   planes:PL?PL.pl.map(pl=>[+pl.g.position.x.toFixed(1),+pl.g.position.y.toFixed(1),+pl.g.position.z.toFixed(1),pl.hp,pl.free?+pl.free.v.toFixed(0):null]):null,bikes:G.cars?G.cars.filter(c=>c.alive).map(c=>c.veh+' '+c.pos.x.toFixed(0)+','+c.pos.z.toFixed(0)):null};});
console.log(JSON.stringify(await info()));
await p.screenshot({path:out+'/mil-1-spawned.png'});
// walk into the tank from in front of it
const T0=await p.evaluate(()=>{const M=window.__G.venues.get('tenvArmy').mil.find(m=>m.kind==='tank');return [M.x,M.z];});
await p.evaluate(([x,z])=>{const P=window.__G.players[0];P.pos.set(x,45,z-8);P.vy=0;P.cam.yaw=Math.PI;},T0);await p.waitForTimeout(300);
await p.keyboard.down('KeyW');await p.waitForTimeout(2500);await p.keyboard.up('KeyW');
const g1=(await info()).gus;console.log('walked at the tank (middle z',T0[1].toFixed(1)+', its front end 2.7 short of that): stopped at z',g1[2],'x',g1[0]);
// into the plane
const PL0=await p.evaluate(()=>{const pl=window.__G.venues.get('tenvPlanes').pl[0],g=pl.g;return [g.position.x,g.position.z,g.rotation.y];});
await p.evaluate(([x,z,h])=>{const P=window.__G.players[0];P.pos.set(x-Math.cos(h)*2,46,z+Math.sin(h)*2);P.vy=0;},PL0);await p.waitForTimeout(500);
await p.keyboard.press('KeyE');await p.waitForTimeout(800);console.log('E beside the plane:',(await info()).drv);
await p.keyboard.down('KeyW');await p.waitForTimeout(4000);await p.keyboard.down('Space');await p.waitForTimeout(3000);await p.keyboard.up('Space');await p.keyboard.up('KeyW');
console.log('after W 4 s, W+Jump 3 s:',JSON.stringify((await info()).planes));
await p.screenshot({path:out+'/mil-2-flying.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
