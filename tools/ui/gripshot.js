// Real 3D screenshots of goblins holding guns in both hands (enemies/strikes.js, gunGrip): a militiaman and a police officer
// aiming and firing at Gus, the militiaman carrying his rifle while calm, and Gnash's rifle and handgun, first person and as
// the others see him. In the Testing Environment, from the free camera set beside each one.
// Usage, from tools/ui (after python ../build_3d.py ../../game/index.html t3.html): node gripshot.js [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'shots';
// (a copy of t3.html with the few extra internals this needs on window.__G)
fs.writeFileSync('t3grip.html',fs.readFileSync('t3.html','utf8').replace('window.__G={DT,','window.__G={DT,tenvFoe,setChar,gobArms,'));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3grip.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(6000);
if(await p.evaluate(()=>!document.getElementById('testPanel').hidden))await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(4000);
// Gus held still, looking north; enemies spawn 8 ahead of him
await p.evaluate(()=>{const G=window.__G,P=G.players[0];G.DT.invuln=true;G.TS.n=1;const x=P.pos.x,z=P.pos.z,y=P.pos.y;
  window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.hp=20;P.cam.yaw=0;P.cam.pitch=-0.1;},16);});
await p.waitForTimeout(500);
await p.evaluate(()=>{const G=window.__G;G.tenvFoe('militia');});
await p.evaluate(()=>{const G=window.__G,P=G.players[0];P.cam.yaw=0.6;});await p.waitForTimeout(100);
await p.evaluate(()=>{const G=window.__G;G.tenvFoe('cop');});
// (and Gus well back from them, so they stand and shoot rather than come in with the butt and the club)
await p.evaluate(()=>{const G=window.__G,P=G.players[0];clearInterval(window.__hold);const x=P.pos.x,z=P.pos.z+14,y=P.pos.y;
  window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.hp=20;P.cam.yaw=0;P.cam.pitch=-0.1;},16);});
await p.waitForTimeout(300);
// the free camera beside a goblin, looking at it from its right (s=1) or left (s=-1), d away
const cam=(sel,s,d,ang)=>p.evaluate(([sel,s,d,ang])=>{const G=window.__G;clearInterval(window.__fc);
  if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));
  window.__fc=setInterval(()=>{const g=G.goblins.find(o=>o.root.visible&&(sel==='cop'?o.pkit&&o.gun:o.foeKind===sel));if(!g)return;
    const h=g.heading+ang*s,cx=g.pos.x+Math.sin(h)*d,cz=g.pos.z+Math.cos(h)*d;
    G.FC.pos.set(cx,g.pos.y+1.0,cz);G.FC.yaw=Math.atan2(-(g.pos.x-cx),-(g.pos.z-cz));G.FC.pitch=-0.12;},5);},[sel,s,d,ang]);
const burst=async(nm,n,gap)=>{for(let i=0;i<n;i++){await p.waitForTimeout(gap);await p.screenshot({path:out+'/grip-'+nm+'-'+i+'.png'});}};
await cam('militia',1,2.6,1.2);await burst('militia-side',8,300);
await cam('militia',-1,2.6,0.6);await burst('militia-front',3,700);
await cam('cop',1,2.4,1.3);await burst('cop-side',8,300);
await cam('cop',-1,2.4,0.5);await burst('cop-front',3,600);
// calm (Peaceful): the rifle carried low in both hands
await p.evaluate(()=>{window.__G.DT.host=1;});await p.waitForTimeout(1500);
await cam('militia',1,2.6,1.3);await burst('militia-calm',2,800);
console.log('poses',await p.evaluate(()=>window.__G.goblins.filter(g=>g.root.visible&&(g.foeKind||g.arms)).map(g=>(g.foeKind||'cop')+' arm '+g.arm.rotation.x.toFixed(2)+' armL '+g.armL.rotation.x.toFixed(2)).join(' | ')));
// Gnash: first person, then seen from beside him
await p.evaluate(()=>{const G=window.__G;clearInterval(window.__fc);if(G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));G.setChar('goblin');});
await p.waitForTimeout(1500);
for(const w of ['rifle','handgun']){await p.evaluate(w=>{const P=window.__G.players[0];window.__G.gobArms(P);P.wpns=['club','handgun','rifle'];P.wpn=w;P.wpnT=-9;},w);
  await p.waitForTimeout(800);await p.screenshot({path:out+'/grip-gnash-fp-'+w+'.png'});}
for(const w of ['rifle','handgun']){await p.evaluate(w=>{const G=window.__G,P=G.players[0];P.wpn=w;clearInterval(window.__fc);if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));
    window.__fc=setInterval(()=>{const h=P.heading,cx=P.pos.x+Math.cos(h)*2.2+Math.sin(h)*1.2,cz=P.pos.z-Math.sin(h)*2.2+Math.cos(h)*1.2;
      G.FC.pos.set(cx,P.pos.y+1.0,cz);G.FC.yaw=Math.atan2(-(P.pos.x-cx),-(P.pos.z-cz));G.FC.pitch=-0.1;},5);},w);
  await p.waitForTimeout(800);await p.screenshot({path:out+'/grip-gnash-seen-'+w+'.png'});}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3grip.html');})();
