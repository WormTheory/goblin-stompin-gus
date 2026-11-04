// Screenshots of the dev tab's Structures preview with the real three.js (t3.html from tools/build_3d.py), each
// structure dressed with its signs, lamps, props and the rest, then one flown into.
// Usage, from tools/ui: node stshot.js [seed] [outDir] [kinds,comma,separated]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots/st',kinds=(process.argv[4]||'shops,gas,fastfood,news,capitol,hospital,zoo,theme,harbor,fishing,billboards').split(',');
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{document.getElementById('tabBtnDev').click();for(const d of document.querySelectorAll('#tabDev details.devsec'))d.open=d.id==='devSecStruct';});
await p.waitForTimeout(1500);
const pick=async k=>{await p.evaluate(()=>document.querySelector('#devStDD>button').click());await p.waitForTimeout(200);
  await p.evaluate(k=>document.querySelector('#devStList li[data-k="'+k+'"]').click(),k);
  for(let i=0;i<240;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.getElementById('devStInfo').textContent);if(/ · at |No /.test(t))break;}
  await p.waitForTimeout(2500);};
const fig=await p.$('.devstfig');
for(const k of kinds){await pick(k);const info=await p.evaluate(()=>document.getElementById('devStInfo').textContent);console.log(k,'|',info);
  await fig.screenshot({path:out+'/'+k+'.png'});}
// fly in: through the front of the last one, then up
const fk=process.env.FLY||kinds[0];await pick(fk);
await p.evaluate(()=>document.getElementById('devStFly').click());await p.waitForTimeout(300);
await p.mouse.move(700,500);
await p.keyboard.down('KeyW');await p.waitForTimeout(+(process.env.FLYMS||2600));await p.keyboard.up('KeyW');await p.waitForTimeout(1500);
await fig.screenshot({path:out+'/fly-'+fk+'.png'});
console.log('fly hint |',await p.evaluate(()=>document.getElementById('devStHint').textContent));
await p.keyboard.press('Escape');await p.waitForTimeout(300);
console.log('after Esc: menu still open',await p.evaluate(()=>!document.getElementById('pause').hidden),'fly button',await p.evaluate(()=>document.getElementById('devStFly').textContent));
console.log(errs.join('\n')||'no errors');await b.close();})();
