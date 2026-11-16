// The newer vehicles: the supercar (rare in the traffic, very fast), forklifts by factory loading docks, the hovercraft
// (over water as over land, sliding round its turns), the fighter jet (flies harder and faster than the airliner, a
// cannon and missiles) and the hot-air balloon (burn to rise, vent to sink, drift, shot down). node newveh.js
// (the city half: the traffic's mix and the factories; then the Testing Environment half, as a second process)
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
const TENVMODE=process.argv[2]==='tenv';
hdr=hdr.slice(0,n).join('\n');
if(!TENVMODE)hdr=hdr.replace(/const LS=\{\};global\.localStorage=.*\n/,'global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,VEH,VEH_MIX,pickVeh,parkSpots,plotInfo,CELL,keys,mHeld,setRaw,solidAt,BAL,tenvSpawnOne,tenvVehKinds,tenvVehName,WATER,get G(){return G},drvFind,SHOTS,lockTargets,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),f2=v=>v.toFixed(2);
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>hold(['KeyF'],0.1);
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const beside=(x,y,z,h,hx)=>put(x-Math.cos(h)*(hx+0.7),y,z+Math.sin(h)*(hx+0.7));
const st=()=>P.drv?P.drv.k:'on foot';
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setGob(true);run(0.5);
if(!TENVMODE){
// ---- the supercar in the traffic: its share of each mix, and how often it's picked
{const sh=k=>(T.VEH_MIX[k].find(e=>e[0]==='super')||[0,0])[1];console.log('supercar share: street',sh('street'),' highway',sh('hw'),' parked',sh('park'));
 let ns=0,nf=0,nh=0;for(let i=0;i<20000;i++){const v=T.pickVeh('street');if(v==='super')ns++;if(v==='forklift')nf++;if(v==='hover')nh++;}
 console.log('  20000 street picks: supercars',ns,'(about 200 expected), forklifts',nf,' hovercraft',nh);
 const tot=k=>T.VEH_MIX[k].reduce((a,e)=>a+e[1],0);console.log('  mixes add up to',f2(tot('street')),f2(tot('hw')),f2(tot('park')));}
// ---- forklifts: their spots by every factory near here (outside the hall, between the lorries, facing the docks)
{const px0=Math.floor(P.pos.x/T.CELL),pz0=Math.floor(P.pos.z/T.CELL);let nF=0,shown=0,first=null;
 for(let dx=-60;dx<=60;dx++)for(let dz=-60;dz<=60;dz++){const px=px0+dx,pz=pz0+dz;if(T.plotType(px,pz)!=='super')continue;const S=T.superOf(px,pz);if(S.kind!=='factory'||S.ax!==px||S.az!==pz)continue;
   nF++;const all=T.parkSpots(px,pz),fk=all.filter(o=>o.veh==='forklift'),lo=all.filter(o=>o.key.includes(':lor')),b=T.plotInfo(px,pz).b[0],X0=px*T.CELL,Z0=pz*T.CELL;
   const inHall=fk.filter(o=>o.x>X0+b.x0&&o.x<X0+b.x1+1&&o.z>Z0+b.z0&&o.z<Z0+b.z1+1).length;
   let near=1e9;for(const f of fk)for(const l of lo)near=Math.min(near,Math.hypot(f.x-l.x,f.z-l.z));
   const face=fk.every(o=>Math.abs(Math.sin(o.h))>0.99===!!b.alongX);
   if(shown<4){shown++;console.log('factory',px,pz,(b.alongX?'along x':'along z')+':',lo.length,'docks,',fk.length,'forklift spots, in the hall',inHall,' nearest lorry middle',f1(near),' facing the docks',face);}
   if(!first)first={px,pz,fk};}
 console.log('factories within 60 plots:',nF);
 // (go there and wait: the parked cars' pool puts forklifts out by the docks)
 if(first){const o=first.fk[0];put(o.x+30,T.G+1.2,o.z+30);let fl=[];for(let k=0;k<40&&fl.length<1;k++){run(0.5);fl=T.cars.filter(c=>c.alive&&c.veh==='forklift');}
   console.log('  forklifts parked there after waiting:',fl.length,fl.length?' first at a forklift spot '+first.fk.some(o=>o.key===fl[0].spot)+', nobody in it '+!fl[0].driver:'');}}
}
else{
const tk=T.tenvVehKinds();console.log('spawn list has: supercar',tk.includes('super'),' forklift',tk.includes('forklift'),' hovercraft',tk.includes('hover'),' fighter jet',tk.includes('jet'),' balloon',tk.includes('balloon'),' names',['super','forklift','hover','jet','balloon'].map(T.tenvVehName).join(', '));
P.cam.yaw=Math.PI;P.cam.pitch=0;   // (looking toward +z)
const newest=()=>T.cars.filter(c=>c.alive).sort((a,b)=>b.pos.z-a.pos.z)[0];
const clear=()=>{if(P.drv)tap();T.tenvClear();run(0.3);};
// ---- top speeds on the flat: a car, then the supercar, the forklift and the hovercraft
const drag=(k,s)=>{clear();P.cam.yaw=Math.PI;T.tenvSpawnOne(k);run(0.3);const c=T.cars.find(c=>c.alive&&c.veh===k);if(!c){console.log(k,': none spawned');return null;}
  beside(c.pos.x,c.pos.y+0.2,c.pos.z,c.heading,c.hx);run(0.05);tap();if(!P.drv){console.log(k,': could not get in');return null;}
  c.heading=Math.PI;const x0=c.pos.x,z0=c.pos.z;let t50=null,mx=0;for(let i=0;i<s*10;i++){hold(['KeyW'],0.1);mx=Math.max(mx,c.speed);if(t50===null&&c.speed>=20)t50=(i+1)/10;}
  const d=Math.hypot(c.pos.x-x0,c.pos.z-z0);console.log(T.tenvVehName(k)+': '+st()+', W '+s+' s: top speed '+f1(mx)+', 20 a second after '+(t50===null?'never':t50+' s')+', went '+f1(d)+', hp '+f1(c.hp));return c;};
drag('car',6);drag('super',8);drag('forklift',4);
{const c=drag('super',1);if(c){const H=P.ui.drvHud;console.log('  display says',hudT(H&&H.txt.n));}}
// ---- the hovercraft: a pool dug ahead, driven across it; a car driven into it sinks
{const GG=T.G;console.log('flat floor: ground at',f1(T.groundAt(0,0,GG+20)),' sea level block',GG);
 const pool=(x0,z0)=>{for(let x=x0-12;x<=x0+12;x++)for(let z=z0;z<=z0+60;z++){for(let y=GG-4;y<=GG;y++)T.setRaw(x,y,z,T.WATER);}};
 const go=k=>{clear();P.cam.yaw=Math.PI;T.tenvSpawnOne(k);run(0.3);const c=T.cars.find(c=>c.alive&&c.veh===k);beside(c.pos.x,c.pos.y+0.2,c.pos.z,c.heading,c.hx);run(0.05);tap();
   const X=Math.floor(c.pos.x),Z=Math.floor(c.pos.z)+8;pool(X,Z);run(0.2);c.heading=0;c.speed=0;const y0=c.pos.y;let lo=1e9,ov=0,on=0;
   for(let i=0;i<40;i++){hold(['KeyW'],0.1);if(T.get(Math.floor(c.pos.x),GG,Math.floor(c.pos.z))===T.WATER){ov++;lo=Math.min(lo,c.pos.y);}}
   console.log(T.tenvVehName(k)+': driven 4 s into a pool, frames over the water',ov,' lowest there',lo<1e8?f1(lo-y0):'-',' (start 0), now',f1(c.pos.y-y0),' speed',f1(c.speed),' went',f1(c.pos.z-Z+8));return c;};
 go('car');const c=go('hover');
 if(c){c.speed=0;c.hvel=null;run(0.5);
  // (full speed out on the water, then hard left: how far the way it goes lags behind the way it points)
  c.heading=0;for(let i=0;i<15;i++)hold(['KeyW'],0.1);let x=c.pos.x,z=c.pos.z,slip=0;
  for(let i=0;i<10;i++){hold(['KeyW','KeyA'],0.1);const vx=c.pos.x-x,vz=c.pos.z-z;x=c.pos.x;z=c.pos.z;let a=Math.atan2(vx,vz)-c.heading;a=Math.atan2(Math.sin(a),Math.cos(a));slip=Math.max(slip,Math.abs(a));}
  console.log('  hard turn on the water: slides up to',f1(slip*57.3),'degrees off the way it points; still afloat',c.pos.y>=GG+0.9);
  // (left alone it stays up on the water)
  tap();run(2);console.log('  got out over the water: hovercraft still at',f1(c.pos.y-GG),'over sea level, alive',c.alive);}
}
// ---- the fighter jet against the airliner: take-off run, speed after a while at full throttle, a bank's roll rate
const fly=jet=>{clear();P.cam.yaw=Math.PI;T.tenvSpawnOne(jet?'jet':'plane');run(0.3);const V=T.venues.get('tenvPlanes'),pl=V&&V.pl[V.pl.length-1];if(!pl){console.log('no plane');return null;}
  const g=pl.g;beside(g.position.x,g.position.y+0.3,g.position.z,g.rotation.y,1.25);run(0.05);tap();if(!P.drv){console.log('could not get in');return null;}
  const y0=g.position.y;let tOff=null,t=0;
  // (throttle up, then pull up once fast enough)
  for(let i=0;i<300&&tOff===null;i++){hold(['Space'].concat(pl.free&&pl.free.v>30?['KeyS']:[]),0.1);t+=0.1;if(g.position.y>y0+2)tOff=t;}
  for(let i=0;i<30;i++)hold(['Space','KeyS'],0.1);
  for(let i=0;i<120;i++)hold(['Space'],0.1);
  const F=pl.free,v12=F.v;hold(['KeyA'],0.5);const r1=F.rl;run(0.1);
  console.log((jet?'fighter jet':'airliner')+': off the ground after',tOff===null?'never':f1(tOff)+' s',' speed after 12 s more at full throttle',f1(v12),' height',f1(g.position.y-y0),' bank after half a second of A',f2(r1),' dead',pl.dead);
  const H=P.ui.drvHud;console.log('  controls:',hudT(H&&H.txt.w).split('  ·  ').slice(0,9).join(' | '));
  return pl;};
fly(false);fly(true);
// ---- the jet's guns on the ground: the cannon held, a missile at a locked tank
{clear();P.cam.yaw=Math.PI;T.tenvSpawnOne('jet');run(0.3);const V=T.venues.get('tenvPlanes'),pl=V.pl[V.pl.length-1],g=pl.g;
 beside(g.position.x,g.position.y+0.3,g.position.z,g.rotation.y,1.25);run(0.05);tap();
 const n0=pl.wpn&&pl.wpn.gun.n;T.mHeld.add('Mouse0');run(1);T.mHeld.delete('Mouse0');run(0.1);
 console.log('jet cannon held 1 s:',n0,'->',pl.wpn&&pl.wpn.gun.n,'rounds');
 // (a parked tank ahead of the jet, looked at, locked, and a missile fired)
 const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),A=T.venues.get('tenvArmy');
 P.cam.yaw=h+Math.PI;run(0.1);const pp=P.pos.clone();P.pos.set(g.position.x,P.pos.y,g.position.z);T.tenvSpawnOne('tank');P.pos.copy(pp);run(0.3);
 const M=T.venues.get('tenvArmy')&&T.venues.get('tenvArmy').mil.slice(-1)[0];
 if(M){const hp0=M.hp;P.cam.yaw=Math.atan2(-(M.x-P.camera.position.x),-(M.z-P.camera.position.z));P.cam.pitch=-0.1;run(0.2);hold(['KeyQ'],0.05);run(0.1);
   console.log('  locked on the tank',P.lockT&&P.lockT.T===M||P.lockT===M||!!(P.lockT&&P.lockT.kind==='tank'),' tank',f1(Math.hypot(M.x-g.position.x,M.z-g.position.z)),'off');
   T.mHeld.add('Mouse2');run(0.05);T.mHeld.delete('Mouse2');const ms=T.SHOTS.filter(s=>s.kind==='missile').length;run(4);
   console.log('  a missile away',ms>0,' tank hp',f1(hp0),'->',f1(M.hp),' missiles left',pl.wpn.rkt.n);}
 else console.log('  no tank spawned');}
// ---- the hot-air balloon
{clear();P.cam.yaw=Math.PI;T.tenvSpawnOne('balloon');run(0.3);const V=T.venues.get('tenvBalloons'),B=V&&V.bl[0];
 if(!B)console.log('no balloon');else{
  console.log('balloon: spawned', T.TRAIN_BOXES.filter(b=>b.proxy.T===B).length,'boxes');
  beside(B.x,B.y+0.3,B.z,B.h,B.BW||1.1);run(0.05);tap();console.log('  get in:',st());
  const y0=B.y;hold(['Space'],6);const y1=B.y;console.log('  burner 6 s: up',f1(y1-y0),' heat',f2(B.heat),' flame lit while burning');
  run(4);const y2=B.y;console.log('  4 s more, let go: up another',f1(y2-y1),' rising at',f1(B.vy));
  const x0=B.x,z0=B.z;hold(['KeyW'],5);console.log('  W 5 s (drifting the way the view points): went',f1(Math.hypot(B.x-x0,B.z-z0)),' height',f1(B.y-y0));
  hold(['KeyC'],5);const y3=B.y;console.log('  vent 5 s: height',f1(y3-y0),' sinking at',f1(B.vy));
  {const H=P.ui.drvHud;console.log('  display:',hudT(H&&H.txt.n),' controls:',hudT(H&&H.txt.w).split('  ·  ').join(' | '));}
  let t=0;while(B.y>y0+0.05&&t<60){hold(['KeyC'],0.5);t+=0.5;}console.log('  back down on the ground after',f1(t),'s more, at',f1(B.y-y0));
  // (a goblin dropped on top of the envelope stands there)
  tap();const top=B.y+T.BAL.e1;put(B.x+0.5,top+2,B.z+0.3);run(1.5);console.log('  dropped on the envelope: standing at',f1(P.pos.y-top),'above its top, standing on it',!!(P.standCar&&P.standCar.T===B));
  // (up again with a pilot, then shot down)
  put(B.x+3,y0+0.3,B.z);run(0.3);beside(B.x,B.y+0.3,B.z,B.h,1.1);run(0.05);tap();hold(['Space'],8);const ya=B.y;
  T.trainHit(B,200);run(0.2);console.log('  shot down at',f1(ya-y0),'up: dead',B.dead,' pilot thrown out',!P.drv);
  run(5);console.log('  5 s later the basket lies at',f1(B.y-y0),' envelope shown',B.env.visible);}}
}
console.log('errors',errs.length,errs.slice(0,3));
`);
if(!TENVMODE)process.stdout.write(require('child_process').execFileSync(process.execPath,[__filename,'tenv'],{env:process.env,maxBuffer:1e8}));
process.exit(0);
