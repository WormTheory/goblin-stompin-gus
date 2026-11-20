// Real screenshots of the debug menu's Profiler overlay, with a blast going off for a spike.
// Usage, from tools/ui after build_3d.py: node profshot.js [outDir]
const {chromium}=require('playwright');
const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(()=>{localStorage.setItem('goblin-stompin-gus-prof','1');});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
await p.evaluate(()=>{const G=window.__G,P=G.players[0];G.crush(P.pos.x+10,P.pos.y,P.pos.z,7);});
await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{const e=document.getElementById('profPane');return {shown:!e.hidden,text:e.innerText};});
console.log(r.shown?'shown':'HIDDEN');console.log(r.text);
await p.screenshot({path:out+'/prof.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
