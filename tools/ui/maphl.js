// The Map tab's legend highlight over a big explored area: a 120 x 120 square of blocks marked explored round where you
// start, the map zoomed right out, then each of a few legend entries pointed at in turn. Prints how long each took to
// show (until the map's drawn with nothing left to do) and saves a screenshot of one.
// python3 tools/build_ui.py game/index.html tools/ui/ui.html, then node maphl.js [ui.html] [out.png] from tools/ui
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
// (a copy of the page that can be told to read the explored list again)
const fs=require('fs'),src=path.resolve(process.argv[2]||'ui.html'),cp=src.replace(/\.html$/,'-mhl.html');
fs.writeFileSync(cp,fs.readFileSync(src,'utf8').replace('function loadExplored(){','window.__mapX=()=>{exploredSeed=null;};function loadExplored(){'));
const url='file://'+cp;
await p.goto(url);await p.waitForTimeout(1500);await p.click('#play');await p.waitForTimeout(4000);
// (a big square explored, round the first block you've seen, and the map told to read its list again)
await p.evaluate(()=>{const m=JSON.parse(localStorage.getItem('goblin-stompin-gus-map'));const [a,b]=m.cells[0].split(',').map(Number),cells=[];
  for(let i=-60;i<60;i++)for(let j=-60;j<60;j++)cells.push((a+i)+','+(b+j));localStorage.setItem('goblin-stompin-gus-map',JSON.stringify({seed:m.seed,cells}));window.__mapX();});
await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.click('#tabBtnMap');await p.waitForTimeout(500);
const cv=await p.$('#mapCanvas');const bb=await cv.boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);
for(let i=0;i<40;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(20);}
// (let the tiles all be drawn first)
await p.waitForTimeout(6000);
// time a redraw: from a change till a frame passes with no more drawing asked for
const settle=()=>p.evaluate(()=>new Promise(res=>{const t0=performance.now();let last=t0,n=0;const f=()=>{const t=performance.now();n++;if(t-last>40)last=t;if(n>3&&t-last<40&&t-t0>200){res(Math.round(t-t0));return;}requestAnimationFrame(f);};requestAnimationFrame(f);}));
const longest=()=>p.evaluate(()=>new Promise(res=>{let worst=0,prev=performance.now(),n=0;const f=()=>{const t=performance.now();worst=Math.max(worst,t-prev);prev=t;if(++n<40)requestAnimationFrame(f);else res(Math.round(worst));};requestAnimationFrame(f);}));
const items=await p.$$('#mapLegend li');
const want=['plains','farm','shop','highway','rail','ruin','sea'];
for(const li of items){const k=await li.getAttribute('data-k');if(!want.includes(k))continue;
  const L=longest();await li.hover();const w=await L;await p.waitForTimeout(800);
  console.log('pointing at',k.padEnd(8),' longest frame while it drew',w,'ms');
  if(k==='farm')await p.screenshot({path:process.argv[3]||'maphl.png'});
  await p.mouse.move(bb.x+5,bb.y+5);await p.waitForTimeout(400);}
console.log(errs.join('\n')||'no errors');await b.close();})();
