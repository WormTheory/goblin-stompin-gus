// Riding the roller coaster in the real game (real three.js, tools/build_3d.py's t3.html): Gus put on a car for most of a
// lap, and at every frame drawn the car's height as drawn (its matrixWorld), his and the camera's. Prints the biggest jump
// between frames of each, and takes screenshots either side of the largest. Usage, from tools/ui: node coastershot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||1),out=process.argv[3]||'coaster';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(8000);
const park=await p.evaluate(()=>{const G=window.__G,o=G.players[0].pos,cx=Math.floor(o.x/G.CELL),cz=Math.floor(o.z/G.CELL);
  for(let r=0;r<500;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=G.superOf(cx+x,cz+z);if(q&&q.kind==='theme')return [q.ax,q.az];}return null;});
if(!park){console.log('no park');await b.close();return;}
console.log('park',park);
await p.evaluate(([ax,az])=>{const G=window.__G,P=G.players[0];window.__hold=setInterval(()=>{P.pos.set(ax*G.CELL+128,G.G+70,az*G.CELL+128);P.vy=0;P.hp=999;},20);},park);
let ok=false;for(let i=0;i<40&&!ok;i++){await p.waitForTimeout(1500);ok=await p.evaluate(([ax,az])=>{const V=window.__G.venues.get('t'+ax+','+az);return !!(V&&V.ride&&!V.survey&&V.K&&!V.K.off);},park);}
if(!ok){console.log('no coaster');await b.close();return;}
// on to car 1 (held there till he's standing on it), looking along the track
await p.evaluate(([ax,az])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0],K=G.venues.get('t'+ax+','+az).K,c=K.cars[1];window.__K=K;
  const put=()=>{P.state='walk';P.grounded=false;P.mvx=P.mvz=0;P.vy=0;P.pos.set(c.g.position.x,c.pr.top+0.05,c.g.position.z);P.peakY=P.pos.y;P.hp=999;};
  put();window.__hold=setInterval(()=>{P.hp=999;if(P.standCar!==c.pr)put();else{P.cam.yaw=c.pr.heading+Math.PI;P.cam.pitch=-0.25;}},20);
  const R=G.renderer,r0=R.render.bind(R);window.__log=[];
  R.render=(s,cam)=>{r0(s,cam);if(cam!==P.camera)return;c.g.updateMatrixWorld(true);
    window.__log.push([c.g.matrixWorld.elements[13],P.pos.y,cam.position.y,K.th,P.standCar===c.pr?1:0,performance.now()]);};},park);
await p.waitForTimeout(40000);
const L=await p.evaluate(()=>window.__log);
// (a long frame moves everything further, so each jump is also measured as a slope: height gained per block of track covered)
const C=await p.evaluate(()=>window.__K.C),big={car:[0],gus:[0],cam:[0]},sl={car:[0],gus:[0],cam:[0]};let on=0,dtMax=0;
for(let i=1;i<L.length;i++){if(L[i][4])on++;dtMax=Math.max(dtMax,L[i][5]-L[i-1][5]);if(!L[i][4]||!L[i-1][4])continue;
  const t=L[i][3],run=Math.abs(L[i][3]-L[i-1][3])*Math.hypot(Math.sin(t)*C.a,Math.cos(t)*C.b);
  [['car',0],['gus',1],['cam',2]].forEach(([k,j])=>{const d=Math.abs(L[i][j]-L[i-1][j]);if(d>big[k][0])big[k]=[d,i,+t.toFixed(3),+run.toFixed(2)];if(run>0.05&&d/run>sl[k][0])sl[k]=[d/run,i,+t.toFixed(3),+run.toFixed(2)];});}
console.log('longest frame',dtMax.toFixed(0),'ms');
console.log('frames drawn',L.length,'on the car',on);
for(const k in big)console.log(k.padEnd(4),'biggest change between frames drawn',big[k][0].toFixed(3),'(frame',big[k][1],'th',big[k][2],'track covered',big[k][3]+')','steepest',sl[k][0].toFixed(3),'(frame',sl[k][1],'th',sl[k][2],'covered',sl[k][3]+')');
const travel=L.length>1?(L[L.length-1][3]-L[0][3]):0;if(process.env.DUMP){const [a,z]=process.env.DUMP.split(',').map(Number);for(let i=a;i<=z&&i<L.length;i++)console.log(i,L[i].slice(0,4).map(v=>+v.toFixed(3)).join(' '),'rel',(L[i][1]-L[i][0]).toFixed(3),L[i][4],(L[i][5]-L[i-1][5]).toFixed(0)+'ms');}
console.log('track covered',travel.toFixed(2),'radians');
await p.screenshot({path:out+'/riding.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
