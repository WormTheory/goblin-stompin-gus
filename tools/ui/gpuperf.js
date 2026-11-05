// Real frame rates, on this machine's real graphics card: the game at 1280x720 with the frame cap off, standing in a city, and then
// while a tall building topples. Prints the card's name, frames per second, and frame times (the time between frames, so all of
// it counts: JavaScript, the driver and the card).
// (STRESS=8 brings down the buildings round it too. RUN=1 instead moves across the city at 30 blocks a second. VIEW=2000 DETAIL=500 set the view and detail distances; WAITMS how long to let the distance load first.)
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node gpuperf.js [page.html] [seed] [nth tallest]
const {chromium}=require('playwright');
const fs=require('fs');
const page=process.argv[2]||process.cwd()+'/t3.html',seed=+(process.argv[3]||12345),nth=+(process.argv[4]||0);
const SAVE_KEY=fs.readFileSync(page,'utf8').match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{
const VIEW=process.env.VIEW,DETAIL=process.env.DETAIL,WAITMS=+(process.env.WAITMS||12000);
const b=await chromium.launch({headless:process.env.HEADED?false:true,args:['--use-gl=angle','--use-angle=d3d11','--ignore-gpu-blocklist','--enable-gpu-rasterization','--disable-frame-rate-limit','--disable-gpu-vsync']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s,v,d])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));if(v)localStorage.setItem('goblin-stompin-gus-view',v);if(d)localStorage.setItem('goblin-stompin-gus-detail',d);},[SAVE_KEY,seed,VIEW,DETAIL]);
await p.goto('file://'+page);await p.waitForTimeout(2500);
const gpu=await p.evaluate(()=>{const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl'),e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown';});
console.log('card:',gpu);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(5000);
await p.evaluate(nth=>{const G=window.__G,P=G.players[0],list=[];const pcx=Math.floor(P.pos.x/G.CELL),pcz=Math.floor(P.pos.z/G.CELL);
  for(let px=pcx-30;px<=pcx+30;px++)for(let pz=pcz-30;pz<=pcz+30;pz++){(G.plotInfo(px,pz).b||[]).forEach((b,i)=>{if(b.top>G.G+6)list.push({b,i,px,pz});});}
  list.sort((a,c)=>c.b.top-a.b.top);const E=list[nth],B=E.b,x=E.px*G.CELL+(B.x0+B.x1)/2,z=E.pz*G.CELL+(B.z0+B.z1)/2;
  window.__spot=[x,z];window.__hold=setInterval(()=>{P.pos.set(x+45,G.G+1,z+45);P.vy=0;P.hp=999;P.cam.yaw=Math.atan2(45,45);P.cam.pitch=0.3;},20);},nth);
await p.waitForTimeout(WAITMS);
const gather=ms=>p.evaluate(ms=>new Promise(r=>{const a=[];let l=performance.now();const t0=l;const f=()=>{const n=performance.now();a.push(n-l);l=n;n-t0<ms?requestAnimationFrame(f):r(a);};requestAnimationFrame(f);}),ms);
const st=(tag,a)=>{a=a.slice(1);const m=[...a].sort((x,y)=>x-y),q=f=>m[Math.floor(f*(m.length-1))].toFixed(1),tot=a.reduce((x,y)=>x+y,0);console.log(tag.padEnd(14),`${(a.length/tot*1000).toFixed(0)} fps  frame avg ${(tot/a.length).toFixed(1)} ms  p50 ${q(.5)} p90 ${q(.9)} p99 ${q(.99)} worst ${q(1)}  (frames ${a.length})`);};
st('standing',await gather(5000));
const calls=await p.evaluate(()=>window.__G.renderer.info.render.calls);console.log('draw calls',calls);
await p.evaluate(n=>{window.__stress=n;},+(process.env.STRESS||0));
if(process.env.RUN){await p.evaluate(()=>{const G=window.__G,P=G.players[0];clearInterval(window.__hold);let [x,z]=window.__spot,a=0;x+=45;z+=45;window.__hold=setInterval(()=>{a+=0.01;x+=0.6;z+=Math.sin(a)*0.3;P.pos.set(x,G.G+1.5,z);P.vy=0;P.hp=999;P.cam.yaw=-Math.PI/2;P.cam.pitch=0.1;},20);});
  st('running',await gather(15000));console.log(errs.slice(0,5).join(String.fromCharCode(10))||'no errors');await b.close();return;}
await p.evaluate(()=>{const G=window.__G,[x,z]=window.__spot;G.collapseBuilding(G.bldgAt(x,z),G.G+1+G.FH*2,{x:1,z:0});for(let a=0;a<(window.__stress||0);a++){const dx=[40,-40,0,0,40,-40,40,-40][a],dz=[0,0,40,-40,40,40,-40,-40][a],B=G.bldgAt(x+dx,z+dz);if(B&&B.b.top>G.G+10)G.collapseBuilding(B,G.G+1+G.FH,{x:Math.sign(-dx)||1,z:0});}});
st('toppling',await gather(7000));
st('after, fires',await gather(6000));
console.log(errs.slice(0,5).join('\n')||'no errors');await b.close();})();
