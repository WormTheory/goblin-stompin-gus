// Road vehicles as you drive them (vehicles/road-handling.js), in the Testing Environment as Gnash: the keyboard's
// throttle easing on, the handbrake sliding and slowing, a drift charging through its three stages and the boost it
// fires, a heavy lorry only sliding, steering easing off with speed, grip on grass, each kind's special (a car's
// headlights dazzling a goblin, a supercar's nitro and launch control, a motorcycle's wheelie and stoppie, a
// four-wheeler's hop, a van's hazard lights, a lorry's air brakes, a police car's siren), looking behind, and in the air
// W/S tipping the nose. node roadt.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,tenvFoe,drvFind,cars,get,setRaw,ROAD,handOf,set menuOpen(v){menuOpen=v},get TS(){return TS},');
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
  const want=kind==='police'?(o=>o.police):(o=>o.veh===kind&&!o.police);
  const c=T.cars.filter(o=>o.alive&&want(o)).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c){console.log(kind,'not spawned');return null;}
  put(c.pos.x+Math.cos(c.heading)*(c.hx+0.6),c.pos.y+0.2,c.pos.z-Math.sin(c.heading)*(c.hx+0.6));run(0.1);tap('KeyF');{let w=0;while(P.drv&&P.drv.jack&&w<60){run(0.1);w++;}}
  if(!P.drv||P.drv.o!==c){console.log(kind,'could not get in');return null;}return c;}
function gob(x,y,z){T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.filter(q=>q.state==='chase'&&q.root.visible).sort((a,b)=>Math.hypot(a.pos.x-x,a.pos.z-z)-Math.hypot(b.pos.x-x,b.pos.z-z))[0];
  if(g){g.pos.set(x,y,z);g.vy=0;g.kv.set(0,0,0);g.stun=0;}return g;}
const slipA=c=>c.hvel&&Math.hypot(c.hvel.x,c.hvel.z)>1?Math.abs(T.angDiff?0:0)+Math.abs(Math.atan2(Math.sin(Math.atan2(c.hvel.x,c.hvel.z)-c.heading),Math.cos(Math.atan2(c.hvel.x,c.hvel.z)-c.heading))):0;
// ---- a car
{const c=getIn('car');if(c){
  console.log('car: controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,4).join(' | '));
  hold(['KeyW'],0.1);const k1=c.kThr;hold(['KeyW'],0.3);console.log('  W 0.1 s: throttle',f2(k1),' 0.4 s:',f2(c.kThr),' speed',f2(c.speed));
  hold(['KeyW'],3);const v0=c.speed;hold(['KeyW','KeyD'],1.2);const vT=c.speed,sT=slipA(c);
  console.log('  W 3.4 s:',f2(v0),' then a turn: speed',f2(vT),' slide angle',f2(sT));
  // (the handbrake straight on: slows and slides)
  hold(['KeyW'],2);const v1=c.speed;hold(['Space'],0.8);console.log('  handbrake 0.8 s from',f2(v1),': down to',f2(c.speed),' drift',c.drift&&c.drift.on);
  // (a drift: handbrake held through a turn at speed)
  hold(['KeyW'],3);const v2=c.speed;down(['Space','KeyD','KeyW']);run(0.3);const on=c.drift&&c.drift.on;run(2.5);const ch=c.drift.ch,sl=slipA(c),vd=c.speed;up(['Space']);run(1/60);const bT=c.boostT;
  console.log('  drift from',f2(v2),': on',on,' charge after 2.8 s',f2(ch),'(stage',Math.floor(ch*3)+')  slide angle',f2(sl),' speed',f2(vd),' let go: boost',f2(bT),'s');
  const vb0=c.speed;run(0.6);up(['KeyD']);run(0.4);console.log('    speed through the boost',f2(vb0),'->',f2(c.speed),' top',T.handOf('car').top);up(['KeyW']);
  // (the headlights: a goblin ahead dazzled)
  hold(['KeyS'],2.5);run(1);const fx=Math.sin(c.heading),fz=Math.cos(c.heading),g=gob(c.pos.x+fx*9,c.pos.y,c.pos.z+fz*9);hold(['Mouse2'],0.05);
  console.log('  right click, a goblin 9 ahead: dazzled',g&&g.stun>0.3,'(',f2(g?g.stun:0),')');
  // (look behind)
  down(['KeyC']);run(0.2);const ry=P.camera.rotation.y;up(['KeyC']);run(0.2);console.log('  C held: camera looks back',Math.abs(Math.atan2(Math.sin(ry-c.heading),Math.cos(ry-c.heading)))<0.05,' let go: forward again',Math.abs(Math.atan2(Math.sin(P.camera.rotation.y-c.heading),Math.cos(P.camera.rotation.y-c.heading)))>2.5);
  // (in the air: W tips the nose down)
  c.pos.y+=12;c.vy=0;c.grounded=false;run(0.05);const p0=c.pitch;hold(['KeyW'],0.5);console.log('  in the air, W 0.5 s: nose',f2(p0),'->',f2(c.pitch));run(2);}}
// ---- a lorry: too heavy to drift
{const c=getIn('semi');if(c){hold(['KeyW'],5);const v=c.speed;down(['Space','KeyD','KeyW']);run(2);up(['Space','KeyD','KeyW']);console.log('lorry: from',f2(v),'handbrake and turn: drift',!!(c.drift&&c.drift.on),' charge',f2(c.drift?c.drift.ch:0),' speed',f2(c.speed),' boost',f2(c.boostT||0));
  hold(['KeyW'],3);const va=c.speed;hold(['Mouse2'],1);console.log('  air brakes 1 s from',f2(va),':',f2(c.speed));
  console.log('  controls:',hudT(P.ui.drvHud.txt.w).split(' | ').slice(0,3).join(' | '));}}
// ---- a supercar: nitro and launch control
{const c=getIn('super');if(c){down(['Space','KeyW']);run(1.2);const L=c.launch;up(['Space']);run(1/60);const v0=c.speed;run(1);up(['KeyW']);
  console.log('supercar: handbrake + throttle at a standstill 1.2 s: launch',f2(L),' let go: speed',f2(v0),' after 1 s',f2(c.speed),' boost',f2(c.boostT||0));
  hold(['KeyS'],4);run(1);hold(['KeyW'],2);const a=c.speed;hold(['KeyW'],2);const b=c.speed-a;hold(['KeyS'],4);run(1);hold(['KeyW'],2);const n0=c.nitro,a2=c.speed;hold(['KeyW','Mouse2'],2);
  console.log('  2 s more throttle: +',f2(b),' with nitro: +',f2(c.speed-a2),' nitro',f2(n0),'->',f2(c.nitro));}}
// ---- a motorcycle: wheelie, stoppie
{const c=getIn('bike');if(c){hold(['KeyW'],2);down(['KeyW','Mouse2']);run(0.8);const w=c.wly;up(['KeyW']);run(0.6);const s=c.wly;up(['Mouse2']);run(0.6);
  console.log('motorcycle: wheelie (W + right click)',f2(w),' stoppie (right click, rolling)',f2(s),' back down',f2(c.wly));}}
// ---- a four-wheeler: hop
{const c=getIn('quad');if(c){const y0=c.pos.y;down(['Mouse2']);run(0.3);up(['Mouse2']);let hi=0;for(let k=0;k<40;k++){run(1/60);hi=Math.max(hi,c.pos.y-y0);}console.log('four-wheeler: right click let go: hops',f2(hi),'high');}}
// ---- a van: hazard lights
{const c=getIn('van');if(c){tap('Mouse2');const on=c.hazard&&c.hazG.visible;tap('Mouse2');console.log('van: right click: hazard lights',on,' again: off',!c.hazard);}}
// ---- a police car: siren
{const c=getIn('police');if(c){tap('Mouse2');run(1);console.log('police car: right click: siren',!!c.siren,' controls say siren off',/siren off/.test(hudT(P.ui.drvHud.txt.w)));tap('Mouse2');console.log('  again: off',!c.siren);
  tap('KeyF');run(0.3);}}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
