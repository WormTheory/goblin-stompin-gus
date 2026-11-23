// Real screenshots of the biome sites in the far view (render/far-city.js, farBioSite): each the nearest of its kind to
// the start, seen from DIST blocks off with chunks drawn only DETAIL blocks round the camera, so the site is all far rings.
// Usage, from tools/ui after build_3d.py: node farsiteshot.js outDir [seed]   (ONLY=derricks,ski to pick; DIST, DETAIL)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'farsiteshots',seed=+(process.argv[3]||1),DIST=+(process.env.DIST||330),DETAIL=process.env.DETAIL||'96';
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,bigPlainsAt,BIGP,landTop,WX,wxSet,wxLocal,set tod(v){tod=v},set dayN(v){dayN=v},');
fs.writeFileSync('t3f.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s,d])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','1200');localStorage.setItem('goblin-stompin-gus-detail',d);},[SAVE_KEY,seed,DETAIL]);
await p.goto('file://'+process.cwd()+'/t3f.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const ONLY=process.env.ONLY;
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
const hold=(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(x,z,y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};clr();G.dayN=45;
  const dx=tx-x,dz=tz-z,L=Math.hypot(dx,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(ty-y,L);
  window.__hold=setInterval(()=>{G.tod=0.25;clr();P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,tx,ty,tz]);
const N={derricks:'Oil field',peat:'Peat diggings',research:'Research station',safari:'Safari lodge',stilts:'Stilt village',ski:'Ski slope'};
for(const k of Object.keys(N)){if(ONLY&&!ONLY.split(',').includes(k))continue;
  const at=await p.evaluate(k=>{const G=window.__G,K=G.BIGP.find(q=>q.kind===k);
    for(let r=0;r<=460;r++)for(let i=-r;i<=r;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const ax=a*K.w,az=c*K.h,B=G.bigPlainsAt(ax,az);if(B&&B.kind===k&&B.ax===ax&&B.az===az)return [ax,az,K.w,K.h];}return null;},k);
  if(!at){console.log(k,'none');continue;}
  const [ax,az,w,h]=at,cx=ax*32+w*16,cz=az*32+h*16,x=cx-DIST*0.7,z=cz-DIST*0.7;
  const G0=await p.evaluate(([x,z])=>{const G=window.__G;return [G.G0,G.landTop(x,z)];},[x,z]);
  const y=Math.max(G0[0]+70,G0[1]+40);await hold(x,y,z,cx,G0[0]+(k==='ski'?14:2),cz);
  await p.waitForTimeout(+(process.env.WAIT||22000));await cap(N[k]+' in the far view, '+DIST+' blocks off ('+ax*32+', '+az*32+')');await p.screenshot({path:out+'/far-'+k+'.png'});console.log(k,ax,az);}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3f.html');})();
