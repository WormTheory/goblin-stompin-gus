// Real 3D screenshots of co-op with one hippo and one goblin: the title screen's player-two row, then a split-screen
// game of Gus and Gnash stood facing each other (each seen in the other's view). See char-select.js and setGobP.
// Usage, from tools/ui (after python3 ../build_3d.py ../../game/index.html t3.html): node mixshot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-character','gus');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.click('#charSel2 .cs-p2b[data-k="goblin"]');await p.waitForTimeout(300);
console.log('title:',await p.evaluate(()=>[...document.querySelectorAll('#charSel2 .cs-p2b')].map(b=>b.textContent+(b.getAttribute('aria-checked')==='true'?' *':'')).join(' / ')+'  |  '+document.getElementById('charNote').textContent),
  ' saved',await p.evaluate(()=>localStorage.getItem('goblin-stompin-gus-character2')));
await (await p.$('#charSel')).screenshot({path:out+'/mix-title.png'});
await p.evaluate(()=>document.getElementById('playCoop').click());await p.waitForTimeout(12000);
const G=()=>window.__G;
console.log('players:',await p.evaluate(()=>window.__G.players.map(q=>(q.gob?'goblin':'hippo')+' active '+q.active).join(', ')));
// stand them 5 apart on open ground, facing each other
await p.evaluate(()=>{const [A,B]=window.__G.players;B.pos.set(A.pos.x+2.2,A.pos.y,A.pos.z-6);B.vy=0;
  A.cam.yaw=0;A.heading=Math.PI;A.cam.pitch=-0.15;B.cam.yaw=Math.PI;B.heading=0;B.cam.pitch=-0.05;});
await p.waitForTimeout(2500);
await p.evaluate(()=>{const [A,B]=window.__G.players;A.cam.yaw=Math.atan2(-(B.pos.x-A.pos.x),-(B.pos.z-A.pos.z));B.cam.yaw=Math.atan2(-(A.pos.x-B.pos.x),-(A.pos.z-B.pos.z));});
await p.waitForTimeout(1500);await p.screenshot({path:out+'/mix-coop.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
