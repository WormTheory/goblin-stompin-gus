// The Testing Environment in the real page: title button, the spawner, a hospital spawned in, enemies ahead of Gus.
// Usage, from tools/ui (after python tools/build_3d.py game/index.html tools/ui/t3.html): node tenvshot.js [outDir]
const {chromium}=require('playwright');
const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
console.log('title button:',await p.evaluate(()=>document.getElementById('testWorld').textContent));
await p.screenshot({path:out+'/tenv-0-title.png'});
await p.evaluate(()=>document.getElementById('testWorld').click());
await p.waitForTimeout(6000);   // (the page reloads into the Testing Environment)
console.log('in tenv:',await p.evaluate(()=>!!window.__G.TENV),'panel shown:',await p.evaluate(()=>!document.getElementById('testPanel').hidden),
  'structure buttons:',await p.evaluate(()=>document.querySelectorAll('#tpGroups .tp-k').length),'note:',await p.evaluate(()=>document.getElementById('seedNote').textContent));
await p.screenshot({path:out+'/tenv-1-panel.png'});
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(8000);
await p.screenshot({path:out+'/tenv-2-empty.png'});
// back to the menu, spawn a hospital
await p.evaluate(()=>{document.exitPointerLock&&document.exitPointerLock();});
await p.evaluate(()=>{const b=[...document.querySelectorAll('#tpGroups .tp-k')].find(b=>b.dataset.k==='hospital');window.__pause&&0;b.click();});
for(let i=0;i<60;i++){await p.waitForTimeout(500);if(!(await p.evaluate(()=>!!window.__G.TS.search)))break;}
console.log('info:',await p.evaluate(()=>document.getElementById('tpInfo').textContent));
await p.screenshot({path:out+'/tenv-3-spawned-menu.png'});
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(15000);
await p.screenshot({path:out+'/tenv-4-hospital.png'});
const G=()=>p.evaluate(()=>{const P=window.__G.players[0];return [P.pos.x,P.pos.y,P.pos.z];});
console.log('gus at',(await G()).map(v=>v.toFixed(1)).join(' '));
// enemies ahead: a few goblins, a police officer and a police car
await p.evaluate(()=>{const G=window.__G;G.TS.n=5;G.tenvFoe('goblin');G.TS.n=1;G.tenvFoe('cop');G.tenvFoe('police');});
await p.waitForTimeout(1500);await p.screenshot({path:out+'/tenv-5-enemies.png'});
// from above
await p.evaluate(()=>{const P=window.__G.players[0],o=P.pos.clone();window.__hold=setInterval(()=>{P.pos.set(o.x,o.y+40,o.z+30);P.vy=0;P.cam.pitch=-0.75;P.hp=999;},20);});
await p.waitForTimeout(8000);await p.screenshot({path:out+'/tenv-6-above.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
