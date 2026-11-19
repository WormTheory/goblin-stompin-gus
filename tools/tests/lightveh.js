// The light vehicles (vehicles/light-vehicles.js): a bicycle, a kick scooter, the Gobway and a motor scooter, each
// spawned in the Testing Environment, got on as Gnash, ridden its own way and got off: the bicycle's easy pedalling and
// tapped sprint (and the legs tiring), the kick scooter's kicks and coasting, the Gobway's lean to go, turning on the
// spot and pushback, the motor scooter's twist and go and indicators; each one's instrument (none on the kick scooter),
// its controls, the rider shown, its rider's clip moving his legs; thrown off into a wall; and Gertie/Grizzle the same.
// node lightveh.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,drvFind,cars,get,setRaw,handOf,drvInst,VEH_MIX,setChar,set menuOpen(v){menuOpen=v},get TS(){return TS},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const hold=(ks,s)=>{for(const k of ks)K(k).add(k);run(s);for(const k of ks)K(k).delete(k);};
const down=ks=>{for(const k of ks)K(k).add(k);},up=ks=>{for(const k of ks)K(k).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const f2=v=>(Math.round(v*100)/100).toFixed(2);
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setGob(true);run(0.5);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};let spot=0;
function getIn(kind){if(P.drv){tap('KeyF');run(0.3);}put(home.x+(spot++)*80,home.y,home.z);P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.tenvSpawnOne(kind);run(1);
  const c=T.cars.filter(o=>o.alive&&o.veh===kind).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c){console.log(kind,'not spawned');return null;}
  put(c.pos.x+Math.cos(c.heading)*(c.hx+0.6),c.pos.y+0.2,c.pos.z-Math.sin(c.heading)*(c.hx+0.6));run(0.1);tap('KeyF');{let w=0;while(P.drv&&P.drv.jack&&w<60){run(0.1);w++;}}
  if(!P.drv||P.drv.o!==c){console.log(kind,'could not get in');return null;}
  const R=c.vehG[kind].rider;console.log(kind+': in',!!P.drv,' name',P.ui.drvHud?hudT(P.ui.drvHud.txt.n||''):'','instrument',T.drvInst(P),' rider shown',!!(P.gb&&P.gb.root.visible),' its own rider model hidden',R?!R.visible:'-');
  console.log('  controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split('  ·  ').slice(0,4).join(' | '));return c;}
function getOut(c){tap('KeyF');run(0.4);console.log('  got off:',!P.drv,' standing by it',f2(Math.hypot(P.pos.x-c.pos.x,P.pos.z-c.pos.z)));}
const kmh=c=>f2(Math.abs(c.speed)*3.6);
// ---- the bicycle
{const c=getIn('bicycle');if(c){hold(['KeyW'],6);console.log('  pedalling 6 s:',kmh(c),'km/h (top',T.handOf('bicycle').top*3.6,')');
  const l0=c.vehG.bicycle.lv.legs[0].rotation.x;run(0.1);console.log('  legs going round (your own goblin\\'s):',f2(P.gb.m.legs[0].rotation.x),'model leg',f2(l0));
  down(['KeyW']);for(let k=0;k<20;k++){tap('Mouse2');run(0.18);}const sp=c.speed,cad=c.cad,st=c.stam;console.log('  20 taps of the special in rhythm:',kmh(c),'km/h  cadence',f2(cad),' legs left',f2(st));
  for(let k=0;k<60;k++){tap('Mouse2');run(0.1);}console.log('  60 more: legs left',f2(c.stam),' speed',kmh(c));up(['KeyW']);run(3);console.log('  coasting 3 s:',kmh(c),' legs back to',f2(c.stam));
  hold(['Space'],1);console.log('  back brake 1 s:',kmh(c));
  hold(['KeyW'],4);const sw=c.speed;c.pos.x+=0;const fx=Math.sin(c.heading),fz=Math.cos(c.heading);
  for(let y=0;y<4;y++)for(let s=-2;s<=2;s++)T.setRaw(Math.floor(c.pos.x+fx*5+fz*s),Math.floor(c.pos.y)+y,Math.floor(c.pos.z+fz*5-fx*s),1);
  hold(['KeyW'],1.5);console.log('  into a wall at',f2(sw*3.6),'km/h: thrown off',!P.drv);if(P.drv)getOut(c);}}
// ---- the kick scooter
{const c=getIn('kick');if(c){tap('KeyW');run(0.3);const k1=c.speed;console.log('  one kick:',kmh(c),'km/h');run(2);console.log('  coasting 2 s:',kmh(c));
  for(let k=0;k<8;k++){tap('KeyW');run(0.3);}console.log('  8 kicks in rhythm:',kmh(c),'(top',f2(T.handOf('kick').top*3.6)+')');
  down(['KeyW']);run(0.2);const kl=c.vehG.kick.lv.legs[1].rotation.x;run(3.3);up(['KeyW']);console.log('  W held 3.5 s (a kick every',f2(0.75),'s):',kmh(c),' kicking leg swung',f2(kl));
  hold(['KeyS'],1);console.log('  foot brake 1 s:',kmh(c));
  const y0=c.pos.y;down(['Mouse2']);run(0.2);up(['Mouse2']);let hi=0;for(let k=0;k<40;k++){run(1/60);hi=Math.max(hi,c.pos.y-y0);}console.log('  ollie:',f2(hi),'high');
  getOut(c);}}
// ---- the Gobway
{const c=getIn('segway');if(c){hold(['KeyW'],0.4);const ln=c.lean,tl=c.wly;hold(['KeyW'],4);console.log('  lean forward: lean',f2(ln),'tilt',f2(tl),' after 4.4 s',kmh(c),'km/h (top',f2(T.handOf('segway').top*3.6)+')  pushback',!!c.push);
  run(2);console.log('  stood up straight 2 s:',kmh(c),' lean',f2(c.lean));
  const h0=c.heading,x0=c.pos.x,z0=c.pos.z;hold(['KeyD'],1);console.log('  turning on the spot 1 s: turned',f2(Math.abs(h0-c.heading)),'rad, moved',f2(Math.hypot(c.pos.x-x0,c.pos.z-z0)));
  hold(['KeyS'],2);console.log('  lean back 2 s:',f2(c.speed*3.6),'km/h');run(1);
  const b0=c.batt;c.batt=0.05;hold(['KeyW'],4);console.log('  battery',f2(b0),'-> low: top',kmh(c),'km/h, the light',T.drvInst(P));c.batt=b0;
  getOut(c);}}
// ---- the motor scooter
{const c=getIn('moped');if(c){hold(['KeyW'],1);const a=c.speed;hold(['KeyW'],2);const b=c.speed;hold(['KeyW'],6);console.log('  twist and go: 1 s',f2(a*3.6),' 3 s',f2(b*3.6),' 9 s',kmh(c),'km/h (top',T.handOf('moped').top*3.6,')');
  down(['KeyD']);tap('Mouse2');run(0.5);const bl=c.blink;up(['KeyD']);tap('Mouse2');console.log('  indicators: steering right',bl,' again: off',c.blink===0);
  const f0=c.fuel;c.fuel=0;hold(['KeyW'],4);console.log('  out of fuel: splutters along at',kmh(c),'km/h');c.fuel=f0;
  hold(['KeyS'],3);getOut(c);}}
// ---- out in the traffic
{let n={};for(const [t,p] of T.VEH_MIX.street)n[t]=p;console.log('street mix: bicycle',n.bicycle,'motor scooter',n.moped,'kick scooter',n.kick,'Gobway',n.segway);}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
