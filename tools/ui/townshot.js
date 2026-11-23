// Real screenshots of towns built their biome's way (world/climate.js BIO_TOWN, city-plan.js bioShops, roofs.js roofOf):
// for each biome named, the nearest town in it, the camera over a block with a shop or eatery built that way, and a
// count of how its town blocks came out (shops, plazas, parks).
// Usage, from tools/ui after build_3d.py: node townshot.js outDir [seed]   (BIOMES=desert,taiga,... to pick)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'townshots',seed=+(process.argv[3]||1);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,settlementLat,settlementAt,BIOMES,biomeOfPlot,plotType,plotInfo,landTop,WX,wxSet,wxLocal,set tod(v){tod=v},set dayN(v){dayN=v},');
fs.writeFileSync('t3t.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','400');localStorage.setItem('goblin-stompin-gus-detail','300');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3t.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
const hold=(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(x,z,y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};clr();G.dayN=45;
  const dx=tx-x,dz=tz-z,L=Math.hypot(dx,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(ty-y,L);
  window.__hold=setInterval(()=>{G.tod=0.25;clr();P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,tx,ty,tz]);
const BI=(process.env.BIOMES||'desert,taiga,badlands,moor,grassland').split(',');
for(const bk of BI){
  const at=await p.evaluate(bk=>{const G=window.__G;for(let r=1;r<=45;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const S=G.settlementLat(a,c);if(!G.settlementAt(S.cx,S.cz))continue;if(G.BIOMES[G.biomeOfPlot(S.cx,S.cz)].k!==bk)continue;
      const n={};let best=null;for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++){const px=S.cx+dx,pz=S.cz+dz;if(!G.settlementAt(px,pz))continue;const t=G.plotType(px,pz);n[t]=(n[t]||0)+1;
        if(!best){const P=G.plotInfo(px,pz),q=P.b.find(b=>b.bstyle||bk==='grassland'&&b.signCat&&b.top-G.G0<=16);if(q)best=[px*32+(q.x0+q.x1)/2,pz*32+(q.z0+q.z1)/2,q.bstyle||'-',q.signCat,q.door];}}
      if(best)return {best,n:['shops','plaza','park','homes','food','fastfood'].map(k=>k+' '+(n[k]||0)).join(', ')};}return null;},bk);
  if(!at){console.log(bk,'none');continue;}
  const [x,z,st,cat,door]=at.best,G0=await p.evaluate(()=>window.__G.G0),D=[[-1,0],[1,0],[0,-1],[0,1]][door]||[0,-1];
  await hold(x+D[0]*22+D[1]*12,G0+13,z+D[1]*22+D[0]*12,x,G0+4,z);await p.waitForTimeout(16000);
  await cap(bk+' town: a '+cat+' built '+st+' ('+Math.round(x)+', '+Math.round(z)+') | blocks within 8: '+at.n);await p.screenshot({path:out+'/town-'+bk+'.png'});console.log(bk,Math.round(x),Math.round(z),st,cat,'|',at.n);}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3t.html');})();
