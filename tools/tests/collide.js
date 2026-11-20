// Vehicles meeting by their mass (vehicles/collide.js), in the Testing Environment's flat world: each case sets two
// vehicles going (the striker held at its speed till they touch), lets them meet, and logs each one's speed and turn
// rate just after, how far it's turned a second later, the damage each took and anything else that happened (tipped,
// thrown up, rider thrown off, a hole in the wall). Cases: rear-end, T-bone, bus into a car and a car into a bus, a
// motorcycle into a van, a glancing side-swipe, a hit on a rear corner (should spin), a car glancing a wall, a bus and a
// car into a wall at the same lower speed (the bus smashes through), a forklift holding a car hit, each light vehicle hit
// by a car (and one ridden), and a hippo trampling a motorcycle and a bus, and run into by them.
// node collide.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,cars,get,setRaw,handOf,carMass,CO,drvEnter,drvExit,forkPick,carSpawn,setVeh,forkState,AB,hippoCar,boxesTouch,solidAt,setChar,damageCar,get TS(){return TS},get TRAIN_BOXES(){return TRAIN_BOXES},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const step=()=>{now+=16.7;T.frame(now);};
const run=s=>{for(let i=0;i<s*60;i++)step();};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
T.DT.invuln=true;T.DT.host=0;run(0.3);   // (pacifist: nothing comes after anyone, so the cars only do what they're set to)
const f2=v=>(Math.round(v*100)/100).toFixed(2),pad=(s,n)=>String(s).padEnd(n);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};let slot=0;
const used=new Set();
// a vehicle of a kind, out of the way of everything else, stood still at (x,z) facing h
function veh(kind,x,z,h){T.tenvSpawnOne(kind);run(0.2);const c=T.cars.filter(o=>o.alive&&o.veh===kind&&!used.has(o)).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c){console.log(kind,'not spawned');return null;}used.add(c);
  c.pos.x=x;c.pos.z=z;c.heading=h;c.speed=0;c.kv.set(0,0,0);c.yawV=0;c.spinT=0;c.spinH=undefined;c.parked=false;c.parkPool=null;c.left=true;c.hunter=false;c.hvel=null;c.tipR=0;c.tipFall=false;c.vy=0;
  c.hp=c.hpMax;return c;}
// a fresh patch of ground for each case, well apart, with the player stood off to one side
function area(){slot++;const x=home.x+slot*70,z=home.z+60;P.pos.set(x-30,home.y,z-30);P.vy=0;run(0.5);return {x,z};}
// set it going: the striker (and the other, if given a speed) held at its speed till something's touched it
function go(a,va,b,vb,max){const hp0=[a.hp,b?b.hp:0],h0=[a.heading,b?b.heading:0];let hit=-1;
  for(let i=0;i<(max||180);i++){
    if(hit<0){for(const [c,v] of [[a,va],[b,vb]]){if(!c||v===undefined)continue;c.speed=v;if(c.hvel){c.hvel.x=Math.sin(c.heading)*v;c.hvel.z=Math.cos(c.heading)*v;}c.kv.set(0,0,0);}}
    step();
    // (touching: the boxes overlap with the margin the game uses; alone, into a wall or a hippo: it's slowed or turned)
    const touch=b?T.boxesTouch(a.pos.x,a.pos.z,a.heading,a.hx+0.15,a.hz+0.15,b.pos.x,b.pos.z,b.heading,b.hx+0.15,b.hz+0.15):(Math.abs(a.speed)<Math.abs(va)*0.85||Math.abs(a.yawV||0)>0.01||a.hp<hp0[0]);
    if(hit<0&&touch)hit=i;
    if(hit>=0&&i>=hit+1)break;}
  const sv=c=>c?Math.hypot(Math.sin(c.heading)*c.speed+c.kv.x,Math.cos(c.heading)*c.speed+c.kv.z):0;
  const r={hit:hit>=0,va:sv(a),vb:sv(b),wa:a.yawV||0,wb:b?(b.yawV||0):0,ya:a.pos.y,yb:b?b.pos.y:0};
  let upA=0,upB=0;for(let i=0;i<60;i++){step();upA=Math.max(upA,a.pos.y-r.ya);if(b)upB=Math.max(upB,b.pos.y-r.yb);if(process.env.DBG&&i<12)console.log(i,a.veh,f2(a.pos.y),f2(a.vy),a.grounded,b&&b.veh,b&&f2(b.pos.y),b&&f2(b.vy));}
  const turn=(c,h)=>{let d=c.heading-h;d=Math.atan2(Math.sin(d),Math.cos(d));return Math.abs(d);};
  r.ta=turn(a,h0[0]);r.tb=b?turn(b,h0[1]):0;r.da=hp0[0]-a.hp;r.db=b?hp0[1]-b.hp:0;r.upA=upA;r.upB=upB;r.tipA=!!a.tipR;r.tipB=!!(b&&b.tipR);return r;}
const ROWS=[];
function row(name,a,b,r,extra){ROWS.push(name);console.log(pad(name,34),pad(a.veh+' m'+T.carMass(a),12),pad(b?b.veh+' m'+T.carMass(b):'-',12),r.hit?'':'NO HIT',
  '| after: speed',f2(r.va),f2(r.vb),' yawV',f2(r.wa),f2(r.wb),' | 1 s on: turned',f2(r.ta),f2(r.tb),' | damage',Math.round(r.da),Math.round(r.db),(r.upA>0.4||r.upB>0.4)?' | thrown up '+f2(r.upA)+' '+f2(r.upB):'',(r.tipA||r.tipB)?' | tipped '+r.tipA+' '+r.tipB:'',extra||'');}
// ---- car against car ----
{const A=area(),b=veh('car',A.x,A.z,0),a=veh('car',A.x,A.z-12,0);row('car rear-ends a car (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('car',A.x,A.z,Math.PI/2),a=veh('car',A.x,A.z-10,0);row('car T-bones a car (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('car',A.x,A.z,0),a=veh('bus',A.x,A.z-16,0);row('bus hits a car (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('bus',A.x,A.z,0),a=veh('car',A.x,A.z-16,0);row('car hits a bus (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('van',A.x,A.z,Math.PI/2),a=veh('bike',A.x,A.z-10,0);row('motorcycle hits a van side-on (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('car',A.x+1.55,A.z+6,Math.PI),a=veh('car',A.x,A.z-6,0);row('glancing side-swipe (10 each way)',a,b,go(a,10,b,10));}
{const A=area(),b=veh('car',A.x+0.9,A.z,0),a=veh('car',A.x-0.9,A.z-12,0);row('hit on a rear corner (12)',a,b,go(a,12,b,0));}
{const A=area(),b=veh('van',A.x,A.z,Math.PI/2),a=veh('bus',A.x,A.z-16,0);row('bus T-bones a van (14)',a,b,go(a,14,b,0));}
// ---- into walls, driven ----
function wall(x0,z0,len,ax){for(let k=-len;k<=len;k++)for(let y=0;y<4;y++)T.setRaw(Math.floor(ax==='x'?x0+k:x0),Math.floor(home.y)+y,Math.floor(ax==='x'?z0:z0+k),1);}
function driven(kind,x,z,h){const c=veh(kind,x,z,h);P.pos.set(c.pos.x+2,c.pos.y+0.2,c.pos.z);run(0.1);T.drvEnter(P,{k:'car',o:c});run(0.2);c.pos.set(x,c.pos.y,z);c.heading=h;c.yawV=0;return c;}
function out(){if(P.drv)T.drvExit(P);run(0.2);}
T.DT.invuln=false;
{const A=area();wall(A.x,A.z+8,12,'x');const a=driven('car',A.x-8,A.z+5,Math.PI/2-0.35);const r=go(a,10,null,undefined);row('car glancing a wall (10, 20 deg)',a,null,r);out();}
for(const k of ['car','bus']){const A=area();wall(A.x,A.z+9,6,'x');const a=driven(k,A.x,A.z-2,0);const holed=()=>{let n=0;for(let x=-2;x<=2;x++)for(let y=0;y<3;y++)if(!T.solidAt(Math.floor(A.x+x),Math.floor(home.y)+y,Math.floor(A.z+9)))n++;return n;};
  const r=go(a,9,null,undefined);row(k+' into a wall (9)',a,null,r,' | hole '+holed()+' blocks');out();}
// (a tall one's hole used to start a block up, leaving the bottom row as a kerb: each row of the hole straight ahead, bottom first)
for(const k of ['car','pickup','van','truck'])for(const v of [12,20]){const A=area();wall(A.x,A.z+9,6,'x');const a=driven(k,A.x,A.z-2,0);
  const rows=()=>[0,1,2].map(y=>{let n=0;for(let x=-1;x<=1;x++)if(!T.solidAt(Math.floor(A.x+x),Math.floor(home.y)+y,Math.floor(A.z+9)))n++;return n;}).join(' ');
  const r=go(a,v,null,undefined);row(k+' into a wall ('+v+')',a,null,r,' | open of 3 across, rows from the bottom '+rows());out();}
T.DT.invuln=true;
// ---- your own car hit on its back corner: it spins, and you still steer ----
{const A=area(),b=driven('car',A.x+0.9,A.z,0),a=veh('car',A.x-0.9,A.z-12,0);const r=go(a,12,b,0);const h0=b.heading;T.keys.add('KeyD');run(0.5);T.keys.delete('KeyD');
  row('your car hit on a back corner (12)',a,b,r,' | still steering: turned '+f2(Math.abs(b.heading-h0))+' in 0.5 s with D held');out();}
// ---- a forklift holding a car, hit from the side ----
{const A=area(),f=veh('forklift',A.x,A.z,0);T.forkState(f);const held=veh('car',A.x,A.z+f.hz+0.2+2.0,0);run(0.1);T.forkPick(f);const L=f.fork&&f.fork.load;
  const a=veh('car',A.x-12,A.z+1,Math.PI/2);const r=go(a,12,f,0);row('car hits a forklift holding a car',a,f,r,' | held '+(L?L.k:'nothing')+' mass together '+T.carMass(f)+' | still on the forks '+!!(f.fork&&f.fork.load));}
// ---- the light ones, hit side-on by a car ----
for(const k of ['bicycle','kick','segway','moped']){const A=area(),b=veh(k,A.x,A.z,Math.PI/2),a=veh('car',A.x,A.z-10,0);row(k+' hit by a car (10)',a,b,go(a,10,b,0));}
{const A=area(),b=driven('bicycle',A.x,A.z,Math.PI/2),a=veh('car',A.x,A.z-10,0);const r=go(a,10,b,0);row('ridden bicycle hit by a car (10)',a,b,r,' | rider thrown off '+!P.drv);out();}
// ---- a hippo and vehicles ----
function hippoAt(x,z,h){if(P.drv)T.drvExit(P);P.pos.set(x,home.y,z);P.heading=h;P.vy=0;P.mvx=P.mvz=0;P.state='walk';run(0.1);}
for(const k of ['bike','bus']){const A=area(),c=veh(k,A.x,A.z,Math.PI/2);hippoAt(A.x,A.z-3.2,0);const hp0=c.hp,J=T.hippoCar(P,c,0,T.AB.trample.speed,A.x+0.5,A.z-c.hx);run(0.1);
  const v=Math.hypot(Math.sin(c.heading)*c.speed+c.kv.x,Math.cos(c.heading)*c.speed+c.kv.z),w=c.yawV;run(1);
  console.log(pad('hippo tramples a '+k+' off-centre',34),pad(k+' m'+T.carMass(c),12),pad('hippo m'+T.CO.hippo,12),'| after: speed',f2(v),' yawV',f2(w),' | impulse',J?f2(J.j):'none');}
for(const k of ['bike','bus']){const A=area(),c=veh(k,A.x,A.z-10,0);hippoAt(A.x,A.z,0);const p0={x:P.pos.x,z:P.pos.z};const r=go(c,10,null,undefined,120);
  console.log(pad(k+' runs into a hippo (10)',34),pad(k+' m'+T.carMass(c),12),pad('hippo',12),'| after: speed',f2(r.va),' | hippo shoved',f2(Math.hypot(P.pos.x-p0.x,P.pos.z-p0.z)));}
// ---- the big vehicles and wrecks (step 5) ----
const sp=c=>Math.hypot(Math.sin(c.heading)*c.speed+c.kv.x,Math.cos(c.heading)*c.speed+c.kv.z);
// a car wrecked at speed slides on into a parked car
{const A=area(),b=veh('car',A.x,A.z,Math.PI/2),a=veh('car',A.x,A.z-17,0);for(let i=0;i<24;i++){a.speed=20;a.kv.set(0,0,0);step();}
  const hp0=b.hp,p0={x:b.pos.x,z:b.pos.z},w0={x:a.pos.x,z:a.pos.z};T.damageCar(a,999,undefined,'acc');let vb=0,wb=0;
  for(let i=0;i<150;i++){step();if(b.alive){vb=Math.max(vb,sp(b));wb=Math.max(wb,Math.abs(b.yawV||0));}}
  console.log(pad('car wrecked at 20 slides into a car',34),pad('car wreck',12),pad('car m1',12),'| wreck slid',f2(Math.hypot(a.pos.x-w0.x,a.pos.z-w0.z)),' | parked car: top speed',f2(vb),' yawV',f2(wb),' moved',f2(Math.hypot(b.pos.x-p0.x,b.pos.z-p0.z)),' damage',Math.round(hp0-b.hp));}
// a car spinning as it's wrecked spins on
for(const w of [0,4]){const A=area(),a=veh('car',A.x,A.z,0);for(let i=0;i<10;i++){a.speed=12;a.kv.set(0,0,0);step();}
  a.yawV=w;const h0=a.heading;T.damageCar(a,999,undefined,'acc');run(1.5);let d=a.heading-h0;d=Math.atan2(Math.sin(d),Math.cos(d));
  console.log(pad('car wrecked at 12, spinning '+w,34),pad('car wreck',12),pad('-',12),'| turned',f2(Math.abs(d)),'as it slid');}
// a car driven into a parked plane's side (carsOutOfBig: the plane's mass)
{const A=area();T.tenvSpawnOne('plane');run(0.3);const B=T.TRAIN_BOXES.filter(B=>B.proxy.isPlane||(B.proxy.T&&B.proxy.T.isPlane)).sort((u,v)=>Math.hypot(u.x-P.pos.x,u.z-P.pos.z)-Math.hypot(v.x-P.pos.x,v.z-P.pos.z))[0];
  if(!B)console.log('car into a parked plane: no plane spawned');
  else{const px=B.tz,pz=-B.tx,a=veh('car',B.x-px*((B.hx||2)+10),B.z-pz*((B.hx||2)+10),Math.atan2(px,pz));const pl=B.proxy.T||B.proxy,hp0=a.hp,ph0=pl.hp;
    let hit=-1,v=0,w=0;for(let i=0;i<150;i++){if(hit<0){a.speed=14;a.kv.set(0,0,0);}step();if(hit<0&&(a.hp<hp0||pl.hp<ph0||Math.abs(a.yawV||0)>0.01||a.speed<13))hit=i;if(hit>=0&&i===hit+1){v=sp(a)*Math.sign(a.speed||1);w=a.yawV||0;}if(hit>=0&&i>hit+30)break;}
    console.log(pad('car into a parked plane (14)',34),pad('car m1',12),pad('plane m'+(pl.jet?3:pl.light?2:6),12),hit<0?'NO HIT':'','| after: speed',f2(v),' yawV',f2(w),' | damage',Math.round(hp0-a.hp),Math.round(ph0-(pl.hp||0)));}}
// ---- settling level: every car thrown up, cartwheeled or tipped is back flat on the ground in a few seconds, and a pooled
// Gobway that comes back as another kind doesn't keep its lean (the model's pitch and roll, so a wheelie or lean counts) ----
const tilt=c=>Math.max(Math.abs(c.g.rotation.x),Math.abs(c.g.rotation.z));
function settles(name,cs,secs){let t=0,worst=0;for(;t<secs*60;t++){step();worst=Math.max(...cs.map(tilt));if(t>30&&cs.every(c=>c.grounded&&tilt(c)<0.03))break;}
  console.log(pad('settles level: '+name,40),'| level after',t>=secs*60?'NEVER ('+secs+' s), still '+f2(worst):f2(t/60)+' s');}
{const A=area(),b=veh('car',A.x,A.z,0),a=veh('bus',A.x,A.z-16,0);go(a,14,b,0);settles('car thrown by a bus',[a,b],5);}
{const A=area(),b=veh('moped',A.x,A.z,Math.PI/2),a=veh('car',A.x,A.z-10,0);go(a,12,b,0);settles('moped cartwheeled by a car',[a,b],5);}
{const A=area(),b=veh('van',A.x,A.z,Math.PI/2),a=veh('bus',A.x,A.z-16,0);go(a,14,b,0);settles('van tipped over (righted after 9 s)',[a,b],14);}
{const A=area(),c=veh('segway',A.x,A.z,0);for(let i=0;i<40;i++){c.speed=i<25?5:0;step();}const w=c.wly||0;
  c.alive=false;c.g.visible=false;T.carSpawn(c,{veh:'car',x:A.x,y:c.pos.y,z:A.z+5,h:0});c.left=true;c.parked=false;c.parkPool=null;
  settles('a leaning Gobway ('+f2(w)+') back as a car',[c],3);}
// ---- drifting into a wall: sideways (the slide, not its heading) at smash speed breaks through; slowly, it doesn't ----
T.DT.invuln=false;
for(const [k,vs] of [['car',15],['car',5],['car',3],['van',5],['bus',9],['bus',3]]){const A=area();wall(A.x,A.z+9,8,'x');const a=driven(k,A.x,A.z+9-a0(k),Math.PI/2);const hp0=a.hp;
  let hit=-1,inW=0;for(let i=0;i<120;i++){if(hit<0){a.speed=2;a.hvel={x:Math.sin(a.heading)*2,z:Math.cos(a.heading)*2+vs};a.kv.set(0,0,0);}step();inW=Math.max(inW,a.pos.z+a.hx-(A.z+9));
    if(hit<0&&(a.hp<hp0||Math.hypot(a.hvel?a.hvel.z:0)<vs*0.8))hit=i;if(hit>=0&&i>hit+30)break;}
  let n=0;for(let x=-4;x<=4;x++)for(let y=0;y<3;y++)if(!T.solidAt(Math.floor(A.x+x),Math.floor(home.y)+y,Math.floor(A.z+9)))n++;
  // (into the wall: how far its side got past the wall's face, which only means something when there's no hole)
  console.log(pad(k+' drifting sideways into a wall ('+vs+')',40),hit<0?'NO HIT':'','| hole',n,'blocks  damage',Math.round(hp0-a.hp),n?'':'  side into the wall '+f2(Math.max(0,inW)));out();}
function a0(k){return k==='bus'?5:4;}
// ---- a wreck sliding into a wall, head on and sideways, still breaks it (wreck-slide.js) ----
for(const [nm,h] of [['head on',0],['sideways',Math.PI/2]])for(const v of [16,24]){const A=area();wall(A.x,A.z+9,8,'x');const a=veh('car',A.x,A.z,h);a.pos.z=A.z+9-(h?a.hx:a.hz)-2.5;
  for(let i=0;i<6;i++){a.speed=0;a.kv.set(0,0,v);step();}T.damageCar(a,999,undefined,'acc');run(2);
  let n=0;for(let x=-4;x<=4;x++)for(let y=0;y<3;y++)if(!T.solidAt(Math.floor(A.x+x),Math.floor(home.y)+y,Math.floor(A.z+9)))n++;
  console.log(pad('car wrecked sliding '+nm+' at '+v+' into a wall',40),'| hole',n,'blocks');}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
