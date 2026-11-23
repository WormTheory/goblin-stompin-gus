// The pause map's wonders and coasts (ui/pause-map.js: wonder markers over explored plots, natural shores coloured by
// coastKind, their key entries): squares explored round seed 1's waterfalls and arches north-east of the start and a
// stretch of coast to the west, the map dragged to each and zoomed in, each legend entry pointed at. Screenshots to outDir.
// python3 tools/build_ui.py game/index.html tools/ui/ui.html, then node mapwd.js [outDir] from tools/ui
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const out=process.argv[2]||'mapwd';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
const src=path.resolve('ui.html'),cp=src.replace(/\.html$/,'-mwd.html');
fs.writeFileSync(cp,fs.readFileSync(src,'utf8').replace('function loadExplored(){','window.__mapX=()=>{exploredSeed=null;};window.__ck=(px,pz)=>seaPlot(px,pz)===1&&coastType(px,pz)==="shore"?coastKind(px*32+16,pz*32+16):-1;function loadExplored(){').replace('const MAPV={','const MAPV=window.__MAPV={').replace('function mapRecentre(){','window.__mapDraw=()=>mapDraw();function mapRecentre(){'));
const SK=fs.readFileSync(src,'utf8').match(/SAVE_KEY='([^']+)'/)[1];
await p.addInitScript(k=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:1}));},SK);
await p.goto('file://'+cp);await p.waitForTimeout(1500);await p.click('#play');await p.waitForTimeout(4000);
const AREAS=[['wonders',150,-140,40]];
{const c=await p.evaluate(()=>{const seen=[];for(let r=4;r<=260&&seen.length<400;r+=2)for(let i=-r;i<=r;i+=2)for(const [a,b] of [[i,-r],[i,r],[-r,i],[r,i]]){const k=window.__ck(a,b);if(k>=0)seen.push([a,b,k]);}
  let best=null;for(const [a,b] of seen){const ks=new Set(seen.filter(q=>Math.abs(q[0]-a)<35&&Math.abs(q[1]-b)<35).map(q=>q[2]));if(!best||ks.size>best[2])best=[a,b,ks.size,[...ks].join('')];}return best;});
 console.log('shore picked',c);AREAS.push(['coast',c[0],c[1],40]);}
await p.evaluate(A=>{const m=JSON.parse(localStorage.getItem('goblin-stompin-gus-map'));const cells=new Set(m.cells);
  for(const [,x,z,r] of A)for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++)cells.add((x+i)+','+(z+j));
  localStorage.setItem('goblin-stompin-gus-map',JSON.stringify({seed:m.seed,cells:[...cells]}));window.__mapX();},AREAS);
await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.click('#tabBtnMap');await p.waitForTimeout(800);
const leg=await p.evaluate(()=>[...document.querySelectorAll('#mapLegend li')].map(l=>l.getAttribute('data-k')+':'+l.textContent.trim()).filter(t=>/^(cf|wd_)/.test(t)));
console.log('key entries',leg.length,leg.join(' | '));
const cv=await p.$('#mapCanvas');const bb=await cv.boundingBox(),cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
const view=async(x,z,ppb,nm)=>{await p.evaluate(([x,z,ppb])=>{const M=window.__MAPV;M.cx=x*32;M.cz=z*32;M.ppb=ppb;window.__mapDraw();},[x,z,ppb]);await p.waitForTimeout(5000);await p.screenshot({path:out+'/map-'+nm+'.png'});};
await view(-20,-70,0.035,'wide');
for(const [nm,x,z] of AREAS)await view(x,z,0.16,nm);

for(const k of ['wd_fall','cf5']){const li=await p.$('#mapLegend li[data-k="'+k+'"]');if(!li){console.log('no entry',k);continue;}await li.hover();await p.waitForTimeout(1500);await p.screenshot({path:out+'/map-hl-'+k+'.png'});}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync(cp);})();
