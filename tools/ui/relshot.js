// Testing Environment, structures built in front of Gus: a hospital ahead, then (turned to the right) a fire station,
// then both from above. Usage, from tools/ui (after build_3d.py into t3.html): node relshot.js [outDir]
const {chromium}=require('playwright');
const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('testWorld').click());
await p.waitForTimeout(6000);
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(6000);
const gus=()=>p.evaluate(()=>{const P=window.__G.players[0];return [P.pos.x,P.pos.y,P.pos.z,P.cam.yaw].map(v=>+v.toFixed(2));});
const play=async ms=>{await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(ms);};
const menu=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(800);};
const spawn=async k=>{await menu();await p.evaluate(k=>{const b=[...document.querySelectorAll('#tpGroups .tp-k')].find(b=>b.dataset.k===k);b.click();},k);
  for(let i=0;i<80;i++){await p.waitForTimeout(500);if(!(await p.evaluate(()=>!!window.__G.TS.search)))break;}
  console.log(k,'->',await p.evaluate(()=>document.getElementById('tpInfo').textContent),JSON.stringify(await p.evaluate(()=>window.__G.TENV.boxes.slice(-1)[0])),'gus',(await gus()).join(' '));};
console.log('gus before',(await gus()).join(' '));
await p.evaluate(()=>{const P=window.__G.players[0];P.cam.yaw=0;P.cam.pitch=-0.05;});
await spawn('hospital');await play(12000);await p.screenshot({path:out+'/rel-1-hospital-ahead.png'});
await p.evaluate(()=>{const P=window.__G.players[0];P.cam.yaw=-Math.PI/2;P.cam.pitch=-0.05;});
await spawn('fire');await play(10000);await p.screenshot({path:out+'/rel-2-fire-ahead.png'});
await p.evaluate(()=>{const P=window.__G.players[0];P.cam.yaw=-Math.PI/2;});
await spawn('zoo');await play(12000);await p.screenshot({path:out+'/rel-3-zoo-ahead.png'});
await p.evaluate(()=>{const P=window.__G.players[0],o=P.pos.clone();window.__hold=setInterval(()=>{P.pos.set(o.x+20,o.y+90,o.z+90);P.vy=0;P.cam.yaw=0.4;P.cam.pitch=-0.8;P.hp=999;},20);});
await p.waitForTimeout(10000);await p.screenshot({path:out+'/rel-4-above.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
