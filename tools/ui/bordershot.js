// Real screenshots of where biomes meet, and of coastlines, to see how smoothly one turns into the other: the nearest
// open-plains border of each pair of biomes to the start (seen from above, across it), a high look over one, and natural
// coasts from the land.
// Usage, from tools/ui after build_3d.py: node bordershot.js outDir [seed]   (ONLY=names to pick, N=how many borders)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'bordershots',seed=+(process.argv[3]||1),N=+(process.env.N||6);
let html=fs.readFileSync(process.env.T3||'t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,climAt,bioPick,BIOMES,biomeOfPlot,landTop,settlementAt,realmOf,PLAINS_OPEN,coastD,coastType,coastFlav,get CF_RC(){return CF_RC},seaPlot,WX,wxSet,wxLocal,set tod(v){tod=v},set dayN(v){dayN=v},reliefNat,bigPlainsAt,farmK,');
fs.writeFileSync('t3d.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','400');localStorage.setItem('goblin-stompin-gus-detail','400');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3d.html');await p.waitForTimeout(2500);
if(errs.length)console.log('ERR',errs);await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const ONLY=process.env.ONLY;
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
const hold=(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(x,z,y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};clr();G.dayN=45;
  const dx=tx-x,dz=tz-z,L=Math.hypot(dx,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(ty-y,L);
  window.__hold=setInterval(()=>{G.tod=0.25;clr();P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,tx,ty,tz]);
// borders: rings of plots round the start, each next to the one beside it; a pair of biomes is taken once, where both
// plots and their neighbours are open plains
const borders=await p.evaluate(N=>{const G=window.__G,seen=new Set(),res=[];const bi=(x,z)=>{const c=G.climAt(x,z);return G.bioPick(c.t,c.m,x,z);};
  const open=(px,pz)=>{for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++)if(G.realmOf(px+a,pz+c)!=='plains'||!G.PLAINS_OPEN(px+a,pz+c)||G.seaPlot(px+a,pz+c))return false;return true;};
  for(let r=4;r<=400&&res.length<N;r++)for(let i=-r;i<=r&&res.length<N;i+=2)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const px=a*2,pz=c*2,x=px*32+16,z=pz*32+16,b0=bi(x,z);
      for(const [dx,dz] of [[64,0],[0,64]]){const b1=bi(x+dx,z+dz);if(b1===b0)continue;const k=Math.min(b0,b1)+'-'+Math.max(b0,b1);if(seen.has(k))continue;
        if(!open(px,pz)||!open(px+dx/32,pz+dz/32))continue;seen.add(k);res.push([x+dx/2,z+dz/2,dx?1:0,G.BIOMES[b0].k,G.BIOMES[b1].k]);break;}}
  return res;},N);
for(const [x,z,ax,b0,b1] of borders){const nm='border-'+b0+'-'+b1;if(ONLY&&!ONLY.split(',').includes(nm))continue;
  // (looking along the border from one side and up, so both biomes are in the picture)
  const ty=await p.evaluate(([x,z])=>Math.max(window.__G.G0,window.__G.landTop(x,z)),[x,z]);
  const cx=ax?x:x-70,cz=ax?z-70:z;await hold(cx,ty+40,cz,x,ty,z);await p.waitForTimeout(20000);
  await cap(b0+' into '+b1+' ('+Math.round(x)+', '+Math.round(z)+')');await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,Math.round(x),Math.round(z));
  if(nm===('border-'+borders[0][3]+'-'+borders[0][4])&&(!ONLY||ONLY.includes('high'))){await hold(cx,ty+160,cz-(ax?120:0),x,ty,z);await p.waitForTimeout(22000);
    await cap('From high up: '+b0+' into '+b1);await p.screenshot({path:out+'/high-'+b0+'-'+b1+'.png'});console.log('high');}}
// coasts: the nearest natural shores, seen from the land looking out along them
const coasts=await p.evaluate(()=>{const G=window.__G,res=[];
  for(let r=1;r<=700&&res.length<3;r++)for(let i=-r;i<=r&&res.length<3;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=a*200,z=c*200,cd=G.coastD(x,z);if(cd<-2||cd>2)continue;
    if(G.coastType(Math.floor(x/32),Math.floor(z/32))!=='shore'||G.settlementAt(Math.floor(x/32),Math.floor(z/32)))continue;
    if(res.some(q=>Math.hypot(q[0]-x,q[1]-z)<3000))continue;
    // (which way is the land: the side the coast's distance grows)
    const gx=G.coastD(x+8,z)-G.coastD(x-8,z),gz=G.coastD(x,z+8)-G.coastD(x,z-8),L=Math.hypot(gx,gz)||1;res.push([x,z,gx/L,gz/L]);}
  return res;});
let ci=0;for(const [x,z,gx,gz] of coasts){const nm='coast-'+(++ci);if(ONLY&&!ONLY.split(',').includes(nm))continue;
  const ty=await p.evaluate(()=>window.__G.G0);await hold(x+gx*60-gz*50,ty+30,z+gz*60+gx*50,x-gz*20,ty,z+gx*20);await p.waitForTimeout(20000);
  await cap('A natural coast ('+Math.round(x)+', '+Math.round(z)+')');await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,Math.round(x),Math.round(z));}
// where a beach turns into a headland: shores just rugged enough for one (CF_RC part way)
const fades=await p.evaluate(()=>{const G=window.__G,res=[];
  for(let r=1;r<=900&&res.length<2;r++)for(let i=-r;i<=r&&res.length<2;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=a*160,z=c*160,cd=G.coastD(x,z);if(cd<-2||cd>2)continue;
    if(G.coastType(Math.floor(x/32),Math.floor(z/32))!=='shore'||G.settlementAt(Math.floor(x/32),Math.floor(z/32)))continue;
    G.coastFlav(x,z);const rc=G.CF_RC;if(rc<0.2||rc>0.35)continue;if(res.some(q=>Math.hypot(q[0]-x,q[1]-z)<3000))continue;
    const gx=G.coastD(x+8,z)-G.coastD(x-8,z),gz=G.coastD(x,z+8)-G.coastD(x,z-8),L=Math.hypot(gx,gz)||1;res.push([x,z,gx/L,gz/L]);}
  return res;});
let fi=0;for(const [x,z,gx,gz] of fades){const nm='fade-'+(++fi);if(ONLY&&!ONLY.split(',').includes(nm))continue;
  const ty=await p.evaluate(()=>window.__G.G0);await hold(x+gx*40-gz*30,ty+12,z+gz*40+gx*30,x-gz*10,ty+2,z+gx*10);await p.waitForTimeout(20000);
  await cap('Where a beach becomes a headland ('+Math.round(x)+', '+Math.round(z)+')');await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,Math.round(x),Math.round(z));}
// sites among hills: the nearest few with the land round them standing well above them (SITES=x,z;x,z to look at those
// spots instead, as in another build where they may not be)
const sites=process.env.SITES?process.env.SITES.split(';').map(q=>q.split(',').map(Number)):await p.evaluate(()=>{const G=window.__G,res=[],seen=new Set();
  for(let r=150;r<=400&&res.length<3;r++)for(let i=-r;i<=r&&res.length<3;i++)for(const [px,pz] of [[i,-r],[i,r],[-r,i],[r,i]]){const B=G.bigPlainsAt(px,pz),F=!B&&G.farmK(px,pz);if(!B&&!F)continue;
    const ax=B?B.ax:px,az=B?B.az:pz,w=B?B.w:1,h=B?B.h:1,k=ax+','+az;if(seen.has(k))continue;seen.add(k);if(B&&(B.kind==='ski'||B.kind==='mine'||B.kind==='quarry'))continue;
    let mx=0;for(let a=-1;a<=w;a++)for(let b=-1;b<=h;b++)mx=Math.max(mx,G.reliefNat((ax+a)*32+16,(az+b)*32+16));
    if(mx>20&&!res.some(q=>Math.hypot(q[0]-ax*32,q[1]-az*32)<2000))res.push([(ax+w/2)*32,(az+h/2)*32]);}
  return res;});
let si=0;for(const [x,z] of sites){const nm='site-'+(++si);if(ONLY&&!ONLY.split(',').includes(nm))continue;
  const ty=await p.evaluate(()=>window.__G.G0);await hold(x-60,ty+45,z-60,x,ty,z);await p.waitForTimeout(22000);
  await cap('A site out in the hills ('+Math.round(x)+', '+Math.round(z)+')');await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,Math.round(x),Math.round(z));}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3d.html');})();
