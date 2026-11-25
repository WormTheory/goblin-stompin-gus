// Screenshots of roads under snow, in the real game (needs t3.html: python tools/build_3d.py game/index.html tools/ui/t3.html).
// Usage, from tools/ui: node snowshot.js outDir [levels, e.g. 0.35,0.65,1] [seed]. OLD=1: roads snowed over as they used to be.
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const out=process.argv[2]||'snowshots',levels=(process.argv[3]||'0.35,0.65,1').split(',').map(Number),seed=+(process.argv[4]||12345);
const only=process.env.ONLY?process.env.ONLY.split(','):null;
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:process.env.SOFT?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,300));});
await p.addInitScript(([k,s])=>{window.GSG_TEST=1;localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
if(process.env.OLD)await p.evaluate(()=>window.__gsg('snowRoads=false'));
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(6000);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
await p.evaluate(()=>{const g=window.__gsg;g('wxSet')('clear',true);g('setTodHour')(13);g('setTodStop')(true);});
const scenes=await p.evaluate(()=>{const g=window.__gsg,G=window.__G,P=G.players[0],o=P.pos,S=[],CELL=g('CELL'),Gy=g('G');
  // (the nearest crossroads to spawn, and the street running off it)
  let best=null;for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){const px=Math.floor(o.x/CELL)+i,pz=Math.floor(o.z/CELL)+j;if(g('jDeg')(px,pz)>=4){const d=i*i+j*j;if(!best||d<best.d)best={d,px,pz};}}
  if(best){const X=best.px*CELL+4,Z=best.pz*CELL+4;
    S.push(['street-low',X,Gy+4.5,Z+30,0,-0.28]);
    S.push(['street-high',X,Gy+16,Z+34,0,-0.75]);
    S.push(['cross-top',X,Gy+26,Z+3,0,-1.45]);
    S.push(['town-above',X,Gy+70,Z+60,0,-0.8]);}
  {let d=null;const px0=Math.floor(o.x/CELL),pz0=Math.floor(o.z/CELL);for(let i=-40;i<=40&&!d;i++)for(let j=-40;j<=40;j++)if(g('hwRow')(pz0+j,px0+i)&&g('hwRow')(pz0+j,px0+i+1)){d=[px0+i,pz0+j];break;}
   if(d){const hy=g('HY_X'),X=d[0]*CELL+20,Z=d[1]*CELL+4;S.push(['deck',X,hy+7,Z,-Math.PI/2,-0.3]);S.push(['deck-top',X,hy+22,Z,-Math.PI/2,-1.25]);}}
  const L=g('routesNearBox')(o.x-2500,o.z-2500,o.x+2500,o.z+2500).filter((r,i)=>i%2==0&&r);
  const view=(R,s,h,name,pt)=>{const A=g('rtPoint')(R,s),B=g('rtPoint')(R,s+40);S.push([name,A.x,h,A.z,Math.atan2(A.x-B.x,A.z-B.z),pt]);};
  const moto=L.find(r=>r.kind==='moto'),country=L.find(r=>r.kind==='country');
  if(moto){view(moto,moto.L/2,moto.HY+7,'motorway',-0.3);view(moto,moto.L/2,moto.HY+22,'motorway-top',-1.2);view(moto,6,moto.HY+12,'motorway-end',-0.4);}
  if(country){view(country,country.L/2,Gy+7,'country',-0.3);view(country,country.L/2,Gy+20,'country-top',-1.2);}
  return S;});
for(const [name,x,y,z,yaw,pitch] of scenes){if(only&&!only.includes(name))continue;
  await p.evaluate(([x,y,z,yaw,pitch])=>{clearInterval(window.__hold);const P=window.__G.players[0];P.root.visible=false;window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;},20);},[x,y,z,yaw,pitch]);
  await p.waitForTimeout(9000);
  if(process.env.OLD){await p.evaluate(()=>window.__gsg('snowRoads=false;for(const e of [...meshes.values()])buildChunk(e.cx,e.cz);0'));await p.waitForTimeout(1500);}
  for(const lv of levels){
    await p.evaluate(lv=>{clearInterval(window.__snow);const f=()=>window.__gsg('(v=>{WX.snowP=WX.snowC=WX.snowCover=WX.snowW=v;WX.snowClock=50;})')(lv);f();window.__snow=setInterval(f,15);},lv);
    await p.waitForTimeout(700);
    await p.screenshot({path:out+'/'+name+'-'+lv+'.png'});}
  console.log(name,Math.round(x),Math.round(y),Math.round(z));
}
console.log(errs.join('\n')||'no errors');await b.close();})();
