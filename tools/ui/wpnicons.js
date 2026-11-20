// Real screenshots of the weapon bar's icons (player/gob-weapons.js, wpnIcon): Gnash armed with every weapon, the bar
// close up with each in hand, and each icon on its own, big. Usage, from tools/ui (after
// python3 ../build_3d.py ../../game/index.html t3.html): node wpnicons.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-character','goblin');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
const all=await p.evaluate(()=>{const G=window.__G,P=G.players[0];P.wpns=G.GOB_WPN_ORDER.slice();P.wpn='club';P.gren=5;P.mines=3;return G.GOB_WPN_ORDER;});
console.log('weapons',all.join(','));
const n=await p.evaluate(()=>{const G=window.__G;return Object.keys(G.WPN_ICON).map(k=>k+':'+(G.WPN_ICON[k]?'ok':'none')).join(' ');});
console.log('icons',n);
for(const w of ['club','rifle','landmine']){await p.evaluate(w=>{window.__G.players[0].wpn=w;},w);await p.waitForTimeout(500);
  const el=await p.$('.gwpn');if(el)await el.screenshot({path:out+'/wpnbar-'+w+'.png'});}
await p.screenshot({path:out+'/wpnbar-whole.png'});
// each icon big, on a grey card, in a grid
await p.evaluate(()=>{const G=window.__G,d=document.createElement('div');d.id='iconSheet';
  d.style.cssText='position:fixed;inset:0;z-index:99999;background:#3a4048;display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-content:flex-start';
  for(const k in G.WPN_ICON){const c=document.createElement('div');c.style.cssText='background:#1b1f25;padding:6px;font:12px monospace;color:#ddd';
    c.innerHTML=(G.WPN_ICON[k]?'<img style="width:192px;height:96px;display:block" src="'+G.WPN_ICON[k]+'">':'(none)')+k;d.appendChild(c);}
  document.body.appendChild(d);});
await p.waitForTimeout(300);await p.screenshot({path:out+'/wpnicons-sheet.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
