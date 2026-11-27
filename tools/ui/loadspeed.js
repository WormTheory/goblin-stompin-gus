// Does the full-detail world keep up with the player, in the real game? tools/tests/chunkspeed.js asks the same in Node,
// where there are no mesh threads; this flies the real page, threads and all: the camera goes in a straight line at each
// of a few speeds, well above the ground, and for the second half of each run it says how much of the detail distance was
// drawn (average and worst, sampled ten times a second), how far ahead the detail reached, the frames a second, how
// many mesh threads there are and the most jobs that were waiting on them.
// Usage, from tools/ui after build_3d.py: node loadspeed.js [seed]
//   (SPEEDS=24,62,90,185 DETAIL=112 VIEW=2400 SECS=16 ALT=120 LOAD=1: LOADING SPEED 0 Low to 3 Max; ANGLE=d3d11, or swiftshader with no graphics card)
// The plan's targets: 95% drawn at 90 blocks a second at DETAIL 112, 90% at 62 at DETAIL 224. It fails if the one for
// the DETAIL it's run at isn't met.
const {chromium}=require('playwright');
const fs=require('fs');
const seed=+(process.argv[2]||1),E=k=>process.env[k];
const SPEEDS=(E('SPEEDS')||'24,62,90,185').split(',').map(Number),VIEW=E('VIEW')||'2400',DETAIL=E('DETAIL')||'112',SECS=+(E('SECS')||16),ALT=+(E('ALT')||120),LOAD=E('LOAD')||'1',ANGLE=E('ANGLE')||'d3d11';
let html=fs.readFileSync('t3.html','utf8');
// (MW_LIM, the most jobs the mesh threads are given at once, came with the loader's rework: without it this still flies
// the game as it was before, for a figure to compare, and says "of 0")
html=html.replace('window.__G={','window.__G={G0:G,meshes,chunkOrder,ckey,MW,WX,wxSet,wxLocal,get viewR(){return viewR},get lim(){return typeof MW_LIM==="undefined"?0:MW_LIM},set tod(v){tod=v},');
fs.writeFileSync('t3ls.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle='+ANGLE,'--ignore-gpu-blocklist','--enable-gpu-rasterization'].concat(ANGLE==='swiftshader'?['--enable-unsafe-swiftshader']:[])});
const p=await b.newPage({viewport:{width:+(E('W')||1280),height:+(E('H')||720)}});   // (W, H: a small window where the drawing itself is the slow part, a machine with no graphics card)
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.addInitScript(([k,s,v,d,l])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view',v);localStorage.setItem('goblin-stompin-gus-detail',d);localStorage.setItem('goblin-stompin-gus-loadspeed',l);},[SAVE_KEY,seed,VIEW,DETAIL,LOAD]);
await p.goto('file://'+process.cwd()+'/t3ls.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
// (the camera's held on a line along +x, as farfastshot.js holds it; each sample: [share drawn, blocks the detail reaches ahead, jobs waiting])
const fly=(x0,z0,v)=>p.evaluate(([x0,z0,v,ALT])=>{clearInterval(window.__hold);clearInterval(window.__samp);const G=window.__G,P=G.players[0],t0=performance.now();
  const yaw=Math.atan2(-1,0),step=()=>{const t=(performance.now()-t0)/1000;G.tod=0.3;for(let i=0;i<4&&G.WX.type!=='clear';i++)G.wxSet('clear',true);P.pos.set(x0+v*t,G.G0+ALT,z0);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=-0.2;P.hp=999;P.root.visible=false;};
  step();window.__hold=setInterval(step,4);window.__S=[];window.__fr=0;window.__at=()=>[P.pos.x,P.pos.z];
  const fr=()=>{window.__fr++;if(window.__hold)requestAnimationFrame(fr);};requestAnimationFrame(fr);
  window.__samp=setInterval(()=>{const R=G.viewR,CS=16,pcx=Math.floor(P.pos.x/CS),pcz=Math.floor(P.pos.z/CS);let n=0,m=0;
    for(const o of G.chunkOrder(R)){n++;if(G.meshes.has(G.ckey(pcx+o[0],pcz+o[1])))m++;}
    let a=(R+1)*CS;for(let d=0;d<=R;d++)if(!G.meshes.has(G.ckey(pcx+d,pcz))){a=d*CS;break;}
    window.__S.push([m/n,a,G.MW.pend.size,performance.now(),window.__fr]);},100);},[x0,z0,v,ALT]);
const info=await p.evaluate(()=>({cores:navigator.hardwareConcurrency}));
console.log('detail',DETAIL,'far view',VIEW,'loading speed',['Low','Normal','High','Max'][+LOAD]||LOAD,'| cores',info.cores);
// (everything in sight made first)
await fly(300,300,0);for(let i=0;i<120;i++){await p.waitForTimeout(500);const S=await p.evaluate(()=>window.__S.slice(-1)[0]);if(S&&S[0]>=1)break;}
const res=[];let x=300;
for(const v of SPEEDS){
  await fly(x,300,v);await p.waitForTimeout(SECS*1000);
  const R=await p.evaluate(()=>({S:window.__S,at:window.__at(),w:window.__G.MW.ws.length,lim:window.__G.lim,off:window.__G.MW.why}));x=R.at[0];
  const S=R.S.slice(R.S.length>>1),avg=S.reduce((a,s)=>a+s[0],0)/S.length,min=Math.min(...S.map(s=>s[0])),ah=S.reduce((a,s)=>a+s[1],0)/S.length,q=Math.max(...R.S.map(s=>s[2]));
  const fps=(S[S.length-1][4]-S[0][4])/((S[S.length-1][3]-S[0][3])/1000);
  res.push({v,avg});
  console.log('speed',String(v).padStart(4),'blocks/s | detail drawn avg',(100*avg).toFixed(0).padStart(3)+'%','worst',(100*min).toFixed(0).padStart(3)+'%','| reaches ahead avg',ah.toFixed(0).padStart(4),'blocks |',fps.toFixed(0),'fps | mesh threads',R.w+(R.off?' ('+R.off+')':''),'| most jobs waiting',q,'of',R.lim);
  // (let it catch up before the next speed)
  await fly(x,300,0);for(let i=0;i<120;i++){await p.waitForTimeout(500);const S2=await p.evaluate(()=>window.__S.slice(-1)[0]);if(S2&&S2[0]>=1)break;}
}
const want=DETAIL==='112'?[90,0.95]:DETAIL==='224'?[62,0.9]:null,got=want&&res.find(r=>r.v===want[0]);
if(got)console.log('target: '+Math.round(want[1]*100)+'% of the detail drawn at '+want[0]+' blocks a second: '+(100*got.avg).toFixed(0)+'%'+(got.avg>=want[1]?', met':', NOT met'));
console.log(errs.join('\n')||'no errors');
const ok=!errs.length&&(!got||got.avg>=want[1]);console.log(ok?'loadspeed ok':'loadspeed FAILED');
await b.close();fs.unlinkSync('t3ls.html');process.exit(ok?0:1);})();
