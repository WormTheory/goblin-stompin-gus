// Real screenshots of the wilds' wonders (world/wonders.js): the nearest of each landmark, a stone arch, a waterfall, sea
// stacks and a sea arch, a glacier and a fjord wall, and a tarn seen from far off. Usage, from tools/ui after build_3d.py:
// node wondershot.js outDir [seed]   (ONLY=ribs,arch,... to pick)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'wondershots',seed=+(process.argv[3]||1);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,wdIn,wdArchAt,wdFallAt,wdLmAt,stackOf,ARCH_SP,FALL_SP,LM_SP,coastD,coastFlav,get CF_RC(){return CF_RC},plainsH,climAt,clBlend,rlfSnow,nzNoise,realmOf,rlfInCell,rlfTarnAt,TARN_SP,landTop,WX,wxSet,wxSeed,wxLocal,set tod(v){tod=v},set dayN(v){dayN=v},');
fs.writeFileSync('t3w.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','400');localStorage.setItem('goblin-stompin-gus-detail','300');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3w.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const ONLY=process.env.ONLY,on=k=>!ONLY||ONLY.split(',').includes(k);
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
const hold=(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(x,z,y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};clr();G.dayN=45;
  const dx=tx-x,dz=tz-z,L=Math.hypot(dx,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(ty-y,L);
  window.__hold=setInterval(()=>{G.tod=0.25;clr();P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,tx,ty,tz]);
const shot=async(nm,v,tx,wait)=>{await hold(...v);await p.waitForTimeout(wait||18000);await cap(tx);await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,v.map(Math.round).join(' '));};
const ring=(R,body)=>p.evaluate(([R,body])=>{const G=window.__G,f=new Function('G','a','c',body);for(let r=0;r<=R;r++)for(let i=-r;i<=r;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const v=f(G,a,c);if(v)return v;}return null;},[R,body]);
if(errs.length)console.log('page errors:',errs.join(' | '));const G0=await p.evaluate(()=>window.__G.G0);
// the landmarks
const LMS=[['ribs',"A giant's ribs"],['tree','A great tree in the forest'],['baobab','A great baobab on the savanna'],['erratic','A wandering stone on the tundra'],['henge','Standing stones']];
for(const [k,tx] of LMS){if(!on(k))continue;
  const M=await ring(60,"const M=G.wdIn(a*G.LM_SP+1,c*G.LM_SP+1,G.LM_SP,G.wdLmAt);return M&&M.k==='"+k+"'?M:null;");if(!M){console.log(k,'none');continue;}
  const far=k==='tree'?46:k==='baobab'?40:k==='erratic'?26:34,y=G0+M.h0+(k==='tree'?20:k==='henge'?10:7);
  await shot(k,[M.x-far*0.8,y,M.z-far*0.6,M.x,G0+M.h0+(k==='tree'?18:k==='baobab'?9:3),M.z],tx+(k==='ribs'?' in the '+M.b:'')+' ('+M.x+', '+M.z+')');}
// a stone arch
if(on('arch')){const W=await ring(40,"return G.wdIn(a*G.ARCH_SP+1,c*G.ARCH_SP+1,G.ARCH_SP,G.wdArchAt);");
  if(W)await shot('arch',[W.x+(W.ax?32:4),G0+W.h0+7,W.z+(W.ax?4:32),W.x,G0+W.h0+W.H/2,W.z],'A stone arch in the '+W.b+' ('+W.x+', '+W.z+')');}
// a waterfall, from the foot looking up at it
if(on('fall')){const F=await ring(40,"return G.wdIn(a*G.FALL_SP+1,c*G.FALL_SP+1,G.FALL_SP,G.wdFallAt);");
  if(F){const fx=F.x+F.di*(F.i1+16),fz=F.z+F.dj*(F.i1+16),ex=F.x+F.di*F.i0,ez=F.z+F.dj*F.i0;await shot('fall',[fx+F.dj*8,G0+F.bot+8,fz+F.di*8,ex,G0+F.top-3,ez],'A waterfall down a '+(F.top-F.bot)+'-block drop ('+ex+', '+ez+')');}}
// sea stacks and a sea arch, from the sea
for(const [nm,want,tx] of [['stacks',false,'Sea stacks off a rugged shore'],['seaarch',true,'A sea arch off a rugged shore']]){if(!on(nm))continue;
  const S=await ring(700,"const S=G.stackOf(a,c);return S&&S.arch==="+want+"?S:null;");if(!S)continue;
  let gx=-S.tz,gz=S.tx;const cd=await p.evaluate(([x,z,gx,gz])=>window.__G.coastD(x+gx*4,z+gz*4)-window.__G.coastD(x,z),[S.x,S.z,gx,gz]);if(cd<0){gx=-gx;gz=-gz;}
  await shot(nm,[S.x+gx*34+S.tx*10,G0+8,S.z+gz*34+S.tz*10,S.x,G0+S.H*0.5,S.z],tx+' ('+Math.round(S.x)+', '+Math.round(S.z)+')');}
// a glacier
if(on('glacier')){const g=await ring(500,"const x=a*48,z=c*48,cl=G.climAt(x,z);if(cl.t>=0.3||G.clBlend('r')<=0.5||G.nzNoise(x/80,z/80,4451)<=0.25)return null;if(G.realmOf(Math.floor(x/32),Math.floor(z/32))!=='plains')return null;const h=G.plainsH(x,z);return h>G.rlfSnow(cl.t)-10?[x,z,h]:null;");
  if(g)await shot('glacier',[g[0]-40,G0+g[2]+24,g[1]-40,g[0],G0+g[2],g[1]],'A glacier in cold mountains ('+g[0]+', '+g[1]+')');}
// a fjord wall, from the water
if(on('fjord')){const f=await ring(900,"const x=a*64,z=c*64,cd=G.coastD(x,z);if(cd<-6||cd>6)return null;const F=G.coastFlav(x,z);if((F!==1&&F!==2)||G.CF_RC<=0.7)return null;return [x,z];");
  if(f){let [x,z]=f;const g=await p.evaluate(([x,z])=>{const G=window.__G;let gx=G.coastD(x+3,z)-G.coastD(x-3,z),gz=G.coastD(x,z+3)-G.coastD(x,z-3);const L=Math.hypot(gx,gz)||1;return [gx/L,gz/L];},[x,z]);
    await shot('fjord',[x+g[0]*40-g[1]*16,G0+5,z+g[1]*40+g[0]*16,x-g[1]*8,G0+12,z+g[0]*8],'A fjord wall on a cold, rugged shore ('+x+', '+z+')');}}
// a tarn seen from far off (the far view draws its water at its own level)
if(on('tarn')){const t=await ring(60,"return G.rlfInCell(a*G.TARN_SP+1,c*G.TARN_SP+1,G.TARN_SP,G.rlfTarnAt);");
  if(t){const y=await p.evaluate(([x,z])=>window.__G.landTop(x,z),[t.x-150,t.z-150]);await shot('tarn',[t.x-150,Math.max(G0+t.L+95,y+60),t.z-150,t.x,G0+t.L,t.z],'A tarn high in the mountains, from 210 blocks off ('+t.x+', '+t.z+')',24000);}}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3w.html');})();
