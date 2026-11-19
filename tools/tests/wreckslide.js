// Wrecks keep going (vehicles/wreck-slide.js), in the Testing Environment: a plane wrecked at speed into a building
// (where its nose ends up, the blocks along its way knocked out and none left inside it), a car wrecked at speed into a
// thick wall (in a little), the same against bedrock (stopped flat), a car driven by Gnash and wrecked on the move (its
// own velocity, from wsTrack), a wreck barely moving, a light and a heavy one from the same speed (the heavy one goes
// further), a helicopter shot down flying (arcs down, lands on the ground), a tank and a Mobile Gear wrecked on the move,
// a forklift with a car on its forks wrecked on the move (the car comes down, nothing hangs in the air), a shell left on a
// platform whose blocks are then knocked out from under it (it falls).
// Every 'floating' figure should be 0.00. node wreckslide.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={addEdit,setGob,keys,mHeld,tenvSpawnOne,cars,get,setRaw,solidAt,CONCRETE,BRICK,BEDROCK,AIR,explodeCar,damageCar,planeHit,milHit,mechHit,forkMid,forkTop,WS,WS_TOUGH,wsDecel,wsGround,handOf,MG,planeDim,rebuildSet,ckey,CS,get G(){return G},set menuOpen(v){menuOpen=v},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f2=v=>(Math.round(v*100)/100).toFixed(2);
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
T.DT.invuln=true;
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z},FL=T.G+1;   // (the flat floor's top)
// (blocks: fill a box, count what's still solid in one)
const fill=(x0,x1,y0,y1,z0,z1,b)=>{const ch=new Set();for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++){T.get(x,y,z);T.setRaw(x,y,z,b);T.addEdit(x,y,z,b);ch.add(T.ckey(Math.floor(x/T.CS),Math.floor(z/T.CS)));}T.rebuildSet(ch);};
const solidIn=(x0,x1,y0,y1,z0,z1)=>{let k=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.solidAt(x,y,z))k++;return k;};
// (what's still solid inside a wreck's box, from a little over its underside: there should be nothing)
const inside=(W,p)=>{let k=0;const fx=Math.sin(W.h),fz=Math.cos(W.h);for(let u=-W.hz+0.3;u<=W.hz-0.3;u+=0.5)for(let v=-W.hx+0.3;v<=W.hx-0.3;v+=0.5)for(let y=Math.floor(p.y+0.4);y<p.y+W.hy-0.2;y++){if(T.solidAt(Math.floor(p.x+fx*u+fz*v),y,Math.floor(p.z+fz*u-fx*v)))k++;}return k;};
const floating=(W,p)=>f2(p.y-T.wsGround(W,p.x,p.y,p.z));
// (a place well away from Gus and everything before, along x)
let lane=0;const spot=()=>{lane++;return {x:Math.floor(home.x)+lane*70,z:Math.floor(home.z)};};   // (whole blocks, so the walls are where they're meant to be)
const near=(x,z)=>{put(x-20,FL+0.5,z);P.cam.yaw=Math.PI/2;run(0.4);};   // (Gus stood by, so the chunks are there)
function newCar(kind,x,z,h){near(x,z);P.cam.yaw=-Math.PI/2;T.tenvSpawnOne(kind);run(0.3);
  const c=T.cars.filter(o=>o.alive&&o.veh===kind).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c)return null;c.pos.set(x,FL,z);c.heading=h||0;c.speed=0;c.vy=0;c.g.position.copy(c.pos);run(0.1);c.pos.set(x,FL,z);return c;}
const vehIn=(k)=>{for(const V of T.venues.values()){if(k==='plane'&&V.kind==='airport'&&V.tenv)return V.pl[V.pl.length-1];if((k==='tank'||k==='heli')&&V.mil)return V.mil.filter(M=>M.kind===k).pop();if(k==='mech'&&V.mechs)return V.mechs[V.mechs.length-1];}return null;};

// ---- a plane into a building ----
{const s=spot(),bz=s.z+40;
  // (a hollow concrete block of offices, 20 wide, 16 deep and 14 high, with a floor every 4, side on to the plane)
  fill(s.x-10,s.x+10,FL,FL+13,bz,bz+15,T.CONCRETE);fill(s.x-9,s.x+9,FL,FL+12,bz+1,bz+14,T.AIR);for(const y of [FL+3,FL+7,FL+11])fill(s.x-9,s.x+9,y,y,bz+1,bz+14,T.CONCRETE);
  const before=solidIn(s.x-10,s.x+10,FL,FL+13,bz,bz+15);
  near(s.x,s.z);P.cam.yaw=-Math.PI/2;T.tenvSpawnOne('plane');run(0.3);const pl=vehIn('plane');
  if(!pl)console.log('plane: not spawned');else{const D=T.planeDim(pl),p=pl.g.position;
    p.set(s.x,FL+2,bz-D.hz-12);pl.g.rotation.set(0,0,0);run(0.05);p.set(s.x,FL+2,bz-D.hz-12);
    pl.wsV=[0,-2,55];T.planeHit(pl,9999);const W=pl.ws;
    console.log('plane wrecked at 55 a second, 12 blocks short of the building: sliding',!!W,' mass',W&&W.m);
    let t=0;for(;t<12&&W.on;t+=0.1)run(0.1);
    const nose=p.z+D.hz-bz,after=solidIn(s.x-10,s.x+10,FL,FL+13,bz,bz+15),corr=solidIn(Math.floor(s.x-D.hx),Math.floor(s.x+D.hx),Math.floor(p.y+0.4),Math.floor(p.y+D.hy-0.2),bz,Math.floor(p.z+D.hz)-1);
    console.log('  stopped after',f2(t),'s: nose',f2(nose),'blocks into the building (16 deep), tail',f2(bz-(p.z-D.hz)),'blocks outside it  partway in:',nose>1&&p.z-D.hz<bz);
    console.log('  building blocks knocked out',before-after,'of',before,' left solid along its way, front wall to nose',corr,' left inside its box',inside(W,p),' floating',floating(W,p),' height above the floor',f2(p.y-FL));
    run(3);console.log('  3 s later: still there',f2(p.z+D.hz-bz),' floating',floating(W,p));}}

// ---- cars into walls ----
const c0hz=k=>({car:1.9,bus:5.2}[k]||2)*0.85;
function intoWall(kind,speed,wb,label){const s=spot(),wz=s.z+3;fill(s.x-4,s.x+4,FL,FL+3,wz,wz+5,wb);
  const c=newCar(kind,s.x,s.z-c0hz(kind),0);if(!c){console.log(label+': no car');return;}
  c.wsV=[0,0,speed];T.explodeCar(c);const W=c.ws;let t=0;for(;t<8&&W&&W.on;t+=0.05)run(0.05);
  const left=solidIn(s.x-4,s.x+4,FL,FL+3,wz,wz+5);
  console.log(label+': '+kind+' (mass '+T.handOf(kind).mass+') wrecked at',speed,'a second, its front 3 blocks short of a 6-deep wall: front',f2(c.pos.z+c.hz-wz),'blocks into it, blocks broken',9*4*6-left,
    ' stopped after',f2(t),'s  left inside it',W?inside(W,c.pos):'-',' floating',W?floating(W,c.pos):'-',' shell shown',c.g.visible);
  return c;}
intoWall('car',26,T.CONCRETE,'car into concrete');
intoWall('car',26,T.BRICK,'car into brick');
intoWall('car',26,T.BEDROCK,'car into bedrock');
intoWall('car',6,T.CONCRETE,'car slowly into concrete');
intoWall('bus',26,T.CONCRETE,'bus into concrete');

// ---- Gnash driving a car, wrecked on the move: its velocity is its own ----
{const s=spot(),wz=s.z+70;fill(s.x-4,s.x+4,FL,FL+3,wz,wz+5,T.CONCRETE);T.setGob(true);run(0.3);
  const c=newCar('car',s.x,s.z,0);put(c.pos.x+(c.hx+0.6),FL+0.2,c.pos.z);run(0.1);tap('KeyF');
  if(!P.drv||P.drv.o!==c)console.log('driven car: could not get in');
  else{T.keys.add('KeyW');let i=0;while(c.pos.z+c.hz<wz-8&&i++<60*8)run(1/60);const sp=c.speed;T.DT.invuln=false;T.damageCar(c,9999);T.DT.invuln=true;T.keys.delete('KeyW');
    const W=c.ws;console.log('driven car wrecked at',f2(sp),'a second, 8 short of a wall: its wreck set off at',W?f2(Math.hypot(W.vx,W.vz)):'-',' Gnash out',!P.drv);
    run(6);console.log('  Gnash thrown out',!P.drv,' then: front',f2(c.pos.z+c.hz-wz),'blocks into the wall, floating',W?floating(W,c.pos):'-');}
  T.setGob(false);run(0.3);}

// ---- barely moving ----
{const s=spot(),c=newCar('car',s.x,s.z,0);if(c){c.wsV=[0,0,1.5];T.explodeCar(c);run(3);console.log('car wrecked at 1.5 a second: went',f2(c.pos.z-s.z),' floating',floating(c.ws,c.pos));}}

// ---- light and heavy, from the same speed, on open ground ----
{const out=[];for(const k of ['bike','car','truck','semi']){const s=spot(),c=newCar(k,s.x,s.z,Math.PI/2);if(!c)continue;c.wsV=[18,0,0];T.explodeCar(c);run(6);out.push(k+' (mass '+T.handOf(k).mass+') '+f2(c.pos.x-s.x));}
  console.log('wrecked at 18 a second on open ground, how far each went:',out.join(', '),'  (worked out for mass 1:',f2(18/T.WS.drag-T.wsDecel(1)/T.WS.drag**2*Math.log(1+T.WS.drag*18/T.wsDecel(1)))+')');}

// ---- a helicopter shot down flying ----
{const s=spot();near(s.x,s.z);P.cam.yaw=-Math.PI/2;T.tenvSpawnOne('heli');run(0.3);const M=vehIn('heli');
  if(M){M.x=s.x;M.z=s.z;M.y=FL+25;M.h=0;M.wsV=[0,2,20];const y0=M.y;T.milHit(M,9999);const W=M.ws;let t=0,top=M.y;for(;t<10&&W.on;t+=0.05){run(0.05);top=Math.max(top,M.y);}run(1);
    console.log('helicopter shot down at 20 a second, 25 up: rose to',f2(top-y0),'more, came down',f2(M.z-s.z),'blocks on, after',f2(t),'s, on the floor',f2(M.y-FL),' floating',floating(W,M));}}

// ---- a tank and a Mobile Gear wrecked on the move into a wall ----
for(const k of ['tank','mech']){const s=spot(),wz=s.z+(k==='tank'?5:6);fill(s.x-6,s.x+6,FL,FL+9,wz,wz+5,T.BRICK);near(s.x,s.z);P.cam.yaw=-Math.PI/2;T.tenvSpawnOne(k);run(0.3);const M=vehIn(k);
  if(!M){console.log(k,'not spawned');continue;}M.x=s.x;M.z=s.z;M.y=FL;M.h=0;if(M.vx!==undefined){M.vx=M.vz=0;}run(0.05);M.x=s.x;M.z=s.z;M.y=FL;
  const sp=k==='tank'?9:24;M.wsV=[0,0,sp];(k==='tank'?T.milHit:T.mechHit)(M,9999);const W=M.ws,r=k==='tank'?T.MIL.tank.hz:T.MG.r;run(6);
  console.log(k,'wrecked at',sp,'a second into a brick wall: front',f2(M.z+r-wz),'blocks into it, floating',W?floating(W,M):'-',' left inside it',W?inside(W,M):'-');}

// ---- a forklift with a car on its forks, wrecked on the move ----
{const s=spot();T.setGob(true);run(0.3);const c=newCar('forklift',s.x,s.z,0);put(c.pos.x+(c.hx+0.6),FL+0.2,c.pos.z);run(0.1);tap('KeyF');
  if(!P.drv||P.drv.o!==c)console.log('forklift: could not get in');
  else{const o=newCar('car',s.x,s.z+c.hz+0.05+2,0);o.pos.set(s.x,FL,s.z+c.hz+0.05+o.hz);o.heading=0;run(0.2);hold(['Space'],2.5);
    const up=o.pos.y-FL,L=c.fork&&c.fork.load;console.log('forklift: car on the forks',!!(L&&L.o===o),' raised',f2(up));
    T.keys.add('KeyW');run(1.2);T.DT.invuln=false;T.damageCar(c,9999);T.DT.invuln=true;T.keys.delete('KeyW');
    const W=c.ws;console.log('  wrecked moving at',W?f2(Math.hypot(W.vx,W.vz)):'-','a second: its load let go',!(c.fork&&c.fork.load),' car on the forks still',!!o.forkOn);
    run(5);console.log('  5 s on: forklift shell floating',W?floating(W,c.pos):'-',' the car',f2(o.pos.y-T.groundAt(o.pos.x,o.pos.z,o.pos.y+0.5)),'over the ground under it, alive',o.alive,' forklift went',f2(c.pos.z-s.z));}
  T.setGob(false);run(0.3);}

// ---- a shell left on a platform, the platform then knocked out ----
{const s=spot();fill(s.x-4,s.x+4,FL,FL+2,s.z-4,s.z+4,T.CONCRETE);const c=newCar('car',s.x,s.z,0);c.pos.y=FL+3;c.g.position.copy(c.pos);c.wsV=[0,0,0];T.explodeCar(c);run(1);
  const W=c.ws,y1=c.pos.y;fill(s.x-4,s.x+4,FL,FL+2,s.z-4,s.z+4,T.AIR);run(2);
  console.log('shell on a platform 3 high, at',f2(y1-FL),'; platform knocked out from under it: now at',f2(c.pos.y-FL),' floating',floating(W,c.pos));}

console.log('errors',errs.length,errs.slice(0,3).join(' / '));process.exit(0);
`);
