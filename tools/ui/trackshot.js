// Tracks in the snow (render/snow-tracks.js) in the real game: pictures of a street after the traffic's been along it,
// and what the tracks cost a frame on this machine's graphics card (frame times with them on and off, in turns).
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node trackshot.js outDir [level] [seed]
// (SOFT=1 draws with swiftshader instead; PERF=0 skips the timing; WAIT=seconds of traffic first, 25)
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const out=process.argv[2]||'trackshots',lv=+(process.argv[3]||0.65),seed=+(process.argv[4]||12345);
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:process.env.SOFT?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']:['--use-angle=d3d11','--ignore-gpu-blocklist','--disable-frame-rate-limit','--disable-gpu-vsync']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,300));});
await p.addInitScript(([k,s])=>{window.GSG_TEST=1;localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(5000);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
await p.evaluate(lv=>{const g=window.__gsg;g('wxSet')('clear',true);g('setTodHour')(13);g('setTodStop')(true);
  const f=()=>g('(v=>{WX.snowP=WX.snowC=WX.snowCover=WX.snowW=v;WX.snowClock=50;})')(lv);f();window.__snow=setInterval(f,15);},lv);
// (the nearest crossroads, watched from over the street running off it)
const S=await p.evaluate(()=>{const g=window.__gsg,P=window.__G.players[0],o=P.pos,CELL=g('CELL'),Gy=g('G');let best=null;
  for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){const px=Math.floor(o.x/CELL)+i,pz=Math.floor(o.z/CELL)+j;if(g('jDeg')(px,pz)>=4){const d=i*i+j*j;if(!best||d<best.d)best={d,px,pz};}}
  const X=best.px*CELL+4,Z=best.pz*CELL+4;
  return [['low',X,Gy+4.5,Z+30,0,-0.28],['high',X,Gy+16,Z+34,0,-0.75],['top',X,Gy+26,Z+3,0,-1.45],['wide',X,Gy+60,Z+55,0,-0.85]];});
const hold=s=>p.evaluate(([n,x,y,z,yaw,pitch])=>{clearInterval(window.__hold);const P=window.__G.players[0];P.root.visible=false;window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;},20);},s);
await hold(S[0]);
await p.waitForTimeout(+(process.env.WAIT||25)*1000);
for(const s of S){await hold(s);await p.waitForTimeout(1500);await p.screenshot({path:out+'/'+s[0]+'.png'});
  await p.evaluate(()=>window.__gsg('SNOW_TRACKS=false'));await p.waitForTimeout(400);await p.screenshot({path:out+'/'+s[0]+'-off.png'});
  await p.evaluate(()=>window.__gsg('SNOW_TRACKS=true'));console.log(s[0]);}
if(process.env.PERF!=='0'){await hold(S[1]);await p.waitForTimeout(1000);
  const gather=ms=>p.evaluate(ms=>new Promise(r=>{const a=[];let l=performance.now();const t0=l;const f=()=>{const n=performance.now();a.push(n-l);l=n;n-t0<ms?requestAnimationFrame(f):r(a);};requestAnimationFrame(f);}),ms);
  const avg=a=>{a=a.slice(1);return a.reduce((x,y)=>x+y,0)/a.length;},on=[],off=[];
  for(let r=0;r<4;r++){await p.evaluate(()=>window.__gsg('SNOW_TRACKS=true'));on.push(avg(await gather(2500)));
    await p.evaluate(()=>window.__gsg('SNOW_TRACKS=false'));off.push(avg(await gather(2500)));}
  const m=a=>a.reduce((x,y)=>x+y,0)/a.length;
  console.log('frame avg with tracks '+m(on).toFixed(2)+' ms ('+on.map(v=>v.toFixed(2)).join(' ')+'), without '+m(off).toFixed(2)+' ms ('+off.map(v=>v.toFixed(2)).join(' ')+')');
  const js=await p.evaluate(()=>{const f=window.__gsg('trkTick'),v=window.__gsg('trkView'),P=window.__G.players[0];window.__gsg('SNOW_TRACKS=true');const t=performance.now();for(let i=0;i<600;i++){f(1/60);v(P);}return (performance.now()-t)/600;});
  console.log('tracks script a frame: '+js.toFixed(3)+' ms');}
console.log(errs.join('\n')||'no errors');await b.close();})();
