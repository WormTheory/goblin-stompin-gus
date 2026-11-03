// How long the props take where there are most of them. (Needs t3.html: see tools/build_3d.py.)
// Usage, from tools/ui: node proptime.js [seed]
// Stands in the biggest shops it finds and reports the cost of one refreshProps, and of first reading a whole floor.
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1],seed=+(process.argv[2]||1);
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:640,height:360}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
const list=await p.evaluate(()=>{const G=window.__G,C=32,out=[],seen=new Set();
  for(let r=0;r<90;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){
    const s=G.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z;
    for(const q of G.plotInfo(ax,az).b){const k=q.ground||q.kind;if(seen.has(k))continue;seen.add(k);out.push([k,(q.x1-q.x0)*(q.z1-q.z0),ax*C+(q.x0+q.x1)/2,az*C+(q.z0+q.z1)/2]);}}
  return out.sort((a,c)=>c[1]-a[1]).filter(a=>['bigbox','grocery','market','drug','ikea','office','school','apartment'].includes(a[0])).slice(0,6);});
for(const [k,area,x,z] of list){
  await p.evaluate(([x,z])=>{clearInterval(window.__hold);const P=window.__G.players[0];window.__hold=setInterval(()=>{P.pos.set(x,46,z);P.vy=0;P.hp=999;},20);},[x,z]);
  await p.waitForTimeout(9000);
  const m=await p.evaluate(()=>{const G=window.__G;const t0=performance.now();for(let i=0;i<5;i++)G.refreshProps();return{ms:(performance.now()-t0)/5,props:G.activeProps.length,boxes:G.propBoxes};});
  console.log(k,'area',area,'refresh ms',m.ms.toFixed(2),'props',m.props,'boxes',m.boxes);
}
console.log(errs.join('\n')||'no errors');await b.close();})();
