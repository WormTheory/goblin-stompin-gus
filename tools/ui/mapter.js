// Territories in the game (stub three.js): the banner naming the territory you're in once it's worked out, and the Map
// tab's borders and names over a big explored square, zoomed out. Screenshot to out.png.
// python3 tools/build_ui.py game/index.html tools/ui/ui.html, then node mapter.js [ui.html] [out.png] from tools/ui
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
const src=path.resolve(process.argv[2]||'ui.html'),cp=src.replace(/\.html$/,'-mter.html');
fs.writeFileSync(cp,fs.readFileSync(src,'utf8').replace('function loadExplored(){','window.__mapX=()=>{exploredSeed=null;};function loadExplored(){'));
await p.goto('file://'+cp);await p.waitForTimeout(1500);await p.click('#play');
// (the banner: a place's first, then the territory's once it's known and you've been in it a couple of seconds)
let ban='',t0=Date.now();
while(Date.now()-t0<30000){await p.waitForTimeout(250);const t=await p.evaluate(()=>{const e=document.querySelector('.placeBanner');return e?e.textContent:'';});
  if(/Capital:/.test(t)){ban=t;break;}}
console.log('banner:',ban||'NONE','after',Date.now()-t0,'ms');
await p.evaluate(()=>{const m=JSON.parse(localStorage.getItem('goblin-stompin-gus-map'));const [a,b]=m.cells[0].split(',').map(Number),cells=[];
  for(let i=-180;i<180;i++)for(let j=-180;j<180;j++)cells.push((a+i)+','+(b+j));localStorage.setItem('goblin-stompin-gus-map',JSON.stringify({seed:m.seed,cells}));window.__mapX();});
await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.click('#tabBtnMap');await p.waitForTimeout(500);
const cv=await p.$('#mapCanvas');const bb=await cv.boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);
for(let i=0;i<26;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(20);}
// (the longest frame while the territories are worked out a little at a time)
const worst=await p.evaluate(()=>new Promise(res=>{let w=0,prev=performance.now(),n=0;const f=()=>{const t=performance.now();w=Math.max(w,t-prev);prev=t;if(++n<300)requestAnimationFrame(f);else res(Math.round(w));};requestAnimationFrame(f);}));
console.log('longest map frame while drawing',worst,'ms');
await p.waitForTimeout(2000);await p.screenshot({path:process.argv[3]||'mapter.png'});
console.log('errors',errs.length?errs.slice(0,4).join(' | '):'none');
await b.close();})();
