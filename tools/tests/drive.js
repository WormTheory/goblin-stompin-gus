// Driving in goblin mode: E beside a car, a train, a boat, a tank, a helicopter and a plane gets in; the controls move
// it; E again gets out beside it. node drive.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
const TENVMODE=process.argv[2]==='tenv';
hdr=hdr.slice(0,n).join('\n');
// (site.js starts in the empty Testing Environment; the city half of this runs in a real city, and the other half is
// run as a second process)
if(!TENVMODE)hdr=hdr.replace(/const LS=\{\};global\.localStorage=.*\n/,'global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,setVeh,VEH_MIX,keys,mHeld,TRAINS,railPt,BOATS,boatVenue,oceanDepth,PLANE_LIFT,drvFind,setRaw,vehBlast,get nEdits(){return Object.keys(edits).length},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44;
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>hold(['KeyE'],0.1);
const fire=()=>{T.mHeld.add('Mouse0');run(0.05);T.mHeld.delete('Mouse0');run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
// beside a box (its middle x,z, heading h, half width hx): a little way off its left side
const beside=(x,y,z,h,hx)=>put(x-Math.cos(h)*(hx+0.7),y,z+Math.sin(h)*(hx+0.7));
const st=()=>P.drv?P.drv.k:'on foot';
T.DT.invuln=true;T.setGob(true);run(0.5);
if(!TENVMODE){
// near nothing: E does nothing
{const x=P.pos.x,z=P.pos.z;tap();console.log('E with nothing near:',st(),' moved',f1(Math.hypot(P.pos.x-x,P.pos.z-z)));}

// ---- a car
{let c=null;for(let k=0;k<60&&!c;k++){run(0.5);c=T.cars.filter(c=>c.alive&&c.g.visible&&!c.svcPool&&!c.police&&c.pos.y<G0+3&&Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z)<90)[0];}
 if(!c)console.log('no car found');else{
  c.speed=0;beside(c.pos.x,c.pos.y+0.2,c.pos.z,c.heading,c.hx);run(0.05);tap();
  console.log('car ('+c.veh+'): in',st(),' same car',P.drv&&P.drv.o===c,' camera behind it',f1(Math.hypot(P.camera.position.x-c.pos.x,P.camera.position.z-c.pos.z)));
  const x0=c.pos.x,z0=c.pos.z,h0=c.heading;hold(['KeyW'],2.5);const d=Math.hypot(c.pos.x-x0,c.pos.z-z0);
  console.log('  W 2.5 s: moved',f1(d),' speed',f1(c.speed),' still on the street (not recycled)',c.alive,' me with it',f1(Math.hypot(P.pos.x-c.pos.x,P.pos.z-c.pos.z)));
  hold(['KeyW','KeyD'],1);console.log('  W+D 1 s: heading turned',f1(c.heading-h0),'(right is negative)');
  {const H=P.ui.drvHud;console.log('  display: shown',!!H&&!H.el.hidden,' crosshair',!!H&&!H.xh.hidden,' says',H&&H.name.textContent);}
  // (a one-block step on a slab built up in the air, so nothing else is in the way)
  {c.speed=0;run(0.3);const X=Math.floor(c.pos.x),Z=Math.floor(c.pos.z),Y=G0+16,made=[];
   for(let a=-6;a<=45;a++)for(let b=-4;b<=4;b++){T.setRaw(X+a,Y-1,Z+b,3);for(let y=Y;y<Y+6;y++)T.setRaw(X+a,y,Z+b,a>=8&&y===Y?3:0);made.push([X+a,Z+b]);}
   c.pos.set(X+0.5,Y,Z+0.5);c.heading=Math.PI/2;c.steer=0;c.vy=0;run(0.3);
   const cy=c.pos.y;hold(['KeyW'],2.5);console.log('  W at a one-block step: up by',f1(c.pos.y-cy),' went',f1(c.pos.x-X),' hp',f1(c.hp));
   // (a wall across the far end of the slab: hit at speed, it's smashed through)
   {for(let b=-4;b<=4;b++)for(let y=Y+1;y<Y+4;y++)T.setRaw(X+40,y,Z+b,3);c.speed=0;run(0.2);c.pos.set(X+10.5,Y+1,Z+0.5);c.heading=Math.PI/2;c.steer=0;c.vy=0;c.stepT=0;run(0.3);
    const e0=T.nEdits,h0=c.hp;let t=0,v=0;T.keys.add('KeyW');while(t<4&&c.pos.x<X+36){run(0.05);t+=0.05;}v=c.speed;run(0.4);T.keys.delete('KeyW');
    console.log('  W into a wall at',f1(v),': wall blocks smashed',T.nEdits-e0,' car hp',h0,'->',f1(c.hp),' through it',c.pos.x>X+40);}
   c.speed=0;run(0.5);}   // (and the rest happens up there)
  hold(['KeyS'],1.5);console.log('  S 1.5 s: speed',f1(c.speed));
  hold(['KeyS'],1.5);console.log('  S on: reversing',f1(c.speed));run(1);
  tap();console.log('  E again:',st(),' out beside it',f1(Math.hypot(P.pos.x-c.pos.x,P.pos.z-c.pos.z)),' left',!!c.left);
  run(3);console.log('  3 s later: car speed',f1(c.speed),' still there',c.alive);
  hold(['KeyW'],1);console.log('  W on foot walks again: in',st());}}

// ---- a motorcycle (one of the traffic, made into one)
{let c=null;for(let k=0;k<60&&!c;k++){run(0.5);c=T.cars.filter(c=>c.alive&&c.g.visible&&!c.svcPool&&!c.police&&!c.drv&&!c.left&&c.pos.y<G0+3&&Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z)<90)[0];}
 console.log('motorcycles in the traffic mix:',Object.entries(T.VEH_MIX).map(([k,m])=>k+' '+((m.find(e=>e[0]==='bike')||[0,0])[1]*100)+'%').join(', '));
 if(!c)console.log('no car found');else{
  T.setVeh(c,'bike');c.speed=0;beside(c.pos.x,c.pos.y+0.2,c.pos.z,c.heading,c.hx);run(0.05);tap();
  console.log('motorcycle: in',st(),' size',f1(c.hx*2),'x',f1(c.hz*2),' display says',P.ui.drvHud&&P.ui.drvHud.name.textContent);
  const x0=c.pos.x,z0=c.pos.z;hold(['KeyW'],2);console.log('  W 2 s: moved',f1(Math.hypot(c.pos.x-x0,c.pos.z-z0)),' speed',f1(c.speed));
  T.keys.add('KeyW');T.keys.add('KeyA');run(0.6);console.log('  W+A: leaning',f1(c.g.rotation.z),'(left is negative)');T.keys.delete('KeyA');run(0.6);T.keys.delete('KeyW');
  hold(['KeyS'],2);tap();run(0.5);console.log('  E again:',st(),' beside it',f1(Math.hypot(P.pos.x-c.pos.x,P.pos.z-c.pos.z)));}}

// ---- a train
{let TQ=null;for(let r=0;r<40&&!TQ;r++){put(r*400,70,r*300);run(0.5);TQ=[...T.TRAINS.values()].find(q=>!q.dead)||null;}
 if(TQ){const p=T.railPt(TQ.C,TQ.s);put(p.x,70,p.z);run(1);}
 if(!TQ||!TQ.cars)console.log('no train found');else{
  TQ.v=0;TQ.wait=99;run(0.1);const g=TQ.cars[1];beside(g.position.x,G0+1.2,g.position.z,g.rotation.y,1.3);run(0.05);tap();
  console.log('train: in',st(),' car',P.drv&&P.drv.ci);
  const s0=TQ.s;hold(['KeyW'],4);const v1=TQ.v*TQ.dir;console.log('  W 4 s (looking along it): moved along the track',f1(TQ.s-s0),' speed',f1(v1),' me by the car',f1(Math.hypot(P.pos.x-TQ.cars[1].position.x,P.pos.z-TQ.cars[1].position.z)));
  P.cam.yaw+=Math.PI;run(0.1);hold(['KeyW'],3);console.log('  turned round, W 3 s: speed',f1(TQ.v*TQ.dir),'(the other way now)');
  tap();console.log('  E again:',st(),' train speed',f1(TQ.v),' waits',f1(TQ.wait));run(1);}}

// ---- a boat (out on open sea)
{let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-3;i<=3&&ok;i++)for(let j=-3;j<=3&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<5)ok=false;if(ok)SP=[x,z];}
 if(!SP)console.log('no open sea');else{
  const X=SP[0]*32+16,Z=SP[1]*32+16;put(X,G0+20,Z);run(2);
  {const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('test')?false:del(k);}
  T.boatVenue('testdrive','launch',{x:X,z:Z,yaw:0,lane:null},new Set());const V=T.venues.get('testdrive'),g=V.boat;run(0.5);
  beside(g.position.x,G0+0.6,g.position.z,g.rotation.y,1.5);run(0.05);tap();
  console.log('boat (launch): in',st());
  const x0=g.position.x,z0=g.position.z,h0=g.rotation.y;hold(['KeyW'],4);console.log('  W 4 s: moved',f1(Math.hypot(g.position.x-x0,g.position.z-z0)),' speed',f1(V.bo.sp),' afloat at',f1(g.position.y-G0));
  hold(['KeyW','KeyA'],2);console.log('  W+A 2 s: turned',f1(g.rotation.y-h0));
  tap();run(0.5);console.log('  E again:',st(),' in the water beside it',f1(Math.hypot(P.pos.x-g.position.x,P.pos.z-g.position.z)),' y',f1(P.pos.y-G0));
  const gx=g.position.x;run(3);console.log('  3 s on: it stays put (off its route)',f1(Math.abs(g.position.x-gx)));}}

}else{
// ---- the military base (Testing Environment)
const spawnK=k=>{T.tenvSpawn(k);let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}return T.TENV.boxes[T.TENV.boxes.length-1];};
{const B=spawnK('base');run(3);const V=[...T.venues.values()].find(v=>v.kind==='army');
 if(!V)console.log('no base');else{
  const M=V.mil.find(m=>m.kind==='tank');beside(M.x,M.y+0.2,M.z,M.h,1.6);run(0.05);tap();
  console.log('tank: in',st(),' base alerted',V.alert);
  const x0=M.x,z0=M.z,h0=M.h;hold(['KeyW'],3);console.log('  W 3 s: moved',f1(Math.hypot(M.x-x0,M.z-z0)),' speed',f1(M.sv));
  hold(['KeyA'],1.5);console.log('  A 1.5 s: turned on the spot',f1(M.h-h0-0),' moved',f1(Math.hypot(M.x-x0,M.z-z0)));
  P.cam.yaw=M.h+Math.PI+1.2;run(2);console.log('  turret follows the view: off by',f1(Math.abs(Math.atan2(Math.sin(M.h+M.tu-(P.cam.yaw+Math.PI)),Math.cos(M.h+M.tu-(P.cam.yaw+Math.PI))))));
  {const H=P.ui.drvHud;console.log('  display: shown',!H.el.hidden,' crosshair',!H.xh.hidden,' gun marker',!H.xt.hidden,' says',H.name.textContent,'|',H.wpn.textContent);}
  // (the gun marker shows where the shot really goes off: aimed too high, the gun can't follow, and it says so)
  {const pc=(V,pitch,yawOff)=>{P.cam.yaw=V.h+Math.PI+(yawOff||0);P.cam.pitch=pitch;run(2.6);const pr=V.pred&&{...V.pred},A=V.aim||null;V.cd=0;const n0=new Set(T.SHOTS.filter(s=>s.live));T.mHeld.add('Mouse0');run(0.02);T.mHeld.delete('Mouse0');
     const S=T.SHOTS.find(s=>s.live&&!n0.has(s));let last=null;for(let k=0;k<400&&S&&S.live;k++){last={x:S.pos.x,y:S.pos.y,z:S.pos.z};run(1/60);}
     const d=(a,b)=>a&&b?f1(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)):'-';return{pr,A,last,s:'marker to crosshair point '+(A?d(pr,A):'-')+(pr&&pr.air?', the shell never comes down on anything (marker faint, where it passes as far off as the crosshair point)':', marker to where it went off '+d(pr,last))};};
   console.log('  shell, aimed at the ground ahead:',pc(M,-0.1,Math.PI).s);
   console.log('  shell, aimed high up (more than the gun can lift):',pc(M,0.75,Math.PI).s);}
  const n0=T.SHOTS.filter(s=>s.live&&s.kind==='shell').length,e0=T.nEdits;P.cam.pitch=-0.35;run(0.3);fire();console.log('  bite: shells in the air',T.SHOTS.filter(s=>s.live&&s.kind==='shell').length-n0,' crosshair dim while reloading',P.ui.drvHud.xh.classList.contains('cool'));run(2);
  console.log('  shell at the ground: blocks blown out',T.nEdits-e0);
  {const o=V.mil.find(m=>m.kind==='tank'&&m!==M&&!m.dead),h0=o.hp;T.vehBlast(o.x,o.y+1,o.z,4.5,60,M);console.log('  a shell bursting on another tank: its hp',h0,'->',o.hp);}
  // (locking on: the turret keeps on it wherever you look, and the shell goes to it)
  {const o=V.mil.find(m=>m.kind==='tank'&&m!==M&&!m.dead),c=P.camera.position;for(let k=0;k<3;k++){P.cam.yaw=Math.atan2(c.x-o.x,c.z-o.z);P.cam.pitch=Math.atan2(o.y+1.2-c.y,Math.hypot(o.x-c.x,o.z-c.z));run(0.1);}hold(['KeyQ'],0.1);
   console.log('  Q looking at another tank: locked on it',P.lockT===o,' crosshair red',P.ui.drvHud.xh.classList.contains('lock'),' says',P.ui.drvHud.wpn.textContent);
   P.cam.yaw+=2;run(2.5);const a=M.h+M.tu,off=Math.atan2(Math.sin(a-Math.atan2(o.x-M.x,o.z-M.z)),Math.cos(a-Math.atan2(o.x-M.x,o.z-M.z))),h1=o.hp;fire();run(3);
   console.log('  looking well away: turret off the target by',f1(Math.abs(off)),' bite: its hp',h1,'->',o.hp);
   hold(['KeyQ'],0.1);console.log('  Q again: locked',!!P.lockT);}
  tap();run(1);console.log('  E again:',st(),' tank',M.state,' me beside it',f1(Math.hypot(P.pos.x-M.x,P.pos.z-M.z)));
  {const o=V.mil.find(m=>m.kind==='tank'&&m!==M&&!m.dead),c=P.camera.position;P.cam.yaw=Math.atan2(P.pos.x-o.x,P.pos.z-o.z);run(0.3);hold(['KeyQ'],0.1);
   console.log('  on foot, Q facing a tank:',P.lockT?(P.lockT.isMil?'locked on the '+P.lockT.kind:'locked on something else'):'nothing locked',' its hp',o.hp);hold(['KeyQ'],0.1);}
  const mx=M.x;run(3);console.log('  3 s on: tank stays',f1(Math.abs(M.x-mx)));
  const H=V.mil.find(m=>m.kind==='heli');beside(H.x,H.y+0.2,H.z,H.h,1.0);run(0.05);tap();
  console.log('helicopter: in',st());
  run(2);const y0=H.y;hold(['Space'],3);console.log('  spin-up, then Jump 3 s: climbed',f1(H.y-y0),' rotor',f1(H.spin));
  const hx=H.x,hz=H.z;P.cam.yaw=Math.PI;hold(['KeyW'],3);console.log('  W 3 s, looking along +z: moved x',f1(H.x-hx),'z',f1(H.z-hz),' facing',f1(H.h));
  const r0=T.SHOTS.filter(s=>s.live&&s.kind==='rocket').length;fire();console.log('  bite: rockets',T.SHOTS.filter(s=>s.live&&s.kind==='rocket').length-r0);
  {const pc=(pitch)=>{P.cam.pitch=pitch;run(1);const pr=H.pred&&{...H.pred};H.cd=0;const n0=new Set(T.SHOTS.filter(s=>s.live));T.mHeld.add('Mouse0');run(0.02);T.mHeld.delete('Mouse0');
     const S=T.SHOTS.find(s=>s.live&&!n0.has(s));let last=null;for(let k=0;k<400&&S&&S.live;k++){last={x:S.pos.x,y:S.pos.y,z:S.pos.z};run(1/60);}
     return pr&&last?f1(Math.hypot(pr.x-last.x,pr.y-last.y,pr.z-last.z)):'-';};
   console.log('  rocket marker to where it went off:',pc(-0.5),' display: marker shown',!P.ui.drvHud.xt.hidden);}
  const up=H.y-T.groundAt(H.x,H.z,H.y);tap();run(0.2);console.log('  E again',f1(up),'up:',st(),' heli',H.state,' me falling',P.grounded?'no':'yes');
  run(8);{const H2=V.mil.find(m=>m.kind==='heli'&&!m.dead&&m!==H);if(H2){beside(H2.x,H2.y+0.2,H2.z,H2.h,1.0);run(0.05);tap();run(2);hold(['Space'],1.5);
   const y0=Math.floor(H2.y),z0=Math.floor(H2.z)+14,e0=T.nEdits;for(let x=Math.floor(H2.x)-5;x<=Math.floor(H2.x)+5;x++)for(let y=y0-2;y<y0+6;y++)for(let z=z0;z<z0+2;z++)T.setRaw(x,y,z,3);
   P.cam.yaw=Math.PI;H2.h=0;hold(['KeyW'],3);console.log('helicopter flown into a wall at speed: wrecked',H2.dead,' blocks blown out',T.nEdits-e0,' me thrown clear',st(),' hp',P.hp);}}
  {const H3=V.mil.find(m=>m.kind==='heli'&&m.spin<0.5&&!m.drv);if(H3){const x0=Math.floor(H3.x),z0=Math.floor(H3.z),y0=Math.floor(H3.y),h0=H3.hp;
    for(let x=x0-4;x<=x0+4;x++)for(let z=z0-4;z<=z0+4;z++)for(let y=y0-6;y<y0;y++)T.setRaw(x,y,z,0);run(3);
    console.log('a stopped helicopter ('+(H3.dead?'wrecked':H3.state)+'), ground under it dug out 6 deep: dropped',f1(y0-H3.y),' hp',h0,'->',f1(H3.hp));}else console.log('no parked helicopter left');}
  console.log('first helicopter, 8 s on: height',f1(H.y-T.groundAt(H.x,H.z,H.y)),' rotor',f1(H.spin),' me on the ground',P.grounded,' hp',P.hp);}}

// ---- the airport (Testing Environment)
{const B=spawnK('airport');run(3);const V=[...T.venues.values()].find(v=>v.kind==='airport');
 if(!V||!V.pl)console.log('no airport',!!V);else{
  const pl=V.pl[1],g=pl.g;beside(g.position.x,g.position.y+0.2,g.position.z,g.rotation.y,1.25);run(0.05);tap();
  console.log('plane: in',st(),' parked one',P.drv&&P.drv.o===pl);
  // (then put at the start of the runway, so there's room to take off)
  g.position.set(V.B.ax*32+120,g.position.y,V.B.az*32+28.5);g.rotation.y=Math.PI/2;P.cam.yaw=-Math.PI/2;run(0.2);
  const x0=g.position.x,z0=g.position.z;hold(['KeyW'],1.5);console.log('  W 1.5 s: rolling at',f1(pl.free.v),' moved',f1(Math.hypot(g.position.x-x0,g.position.z-z0)),' height',f1(g.position.y-G0-1));
  hold(['Space'],1);console.log('  Jump below take-off speed: height',f1(g.position.y-G0-1));
  hold(['KeyW'],1.5);hold(['KeyW','Space'],4);console.log('  W, then W+Jump 4 s: speed',f1(pl.free.v),' height',f1(g.position.y-G0-1),' wrecked',pl.dead);
  hold(['KeyD'],2);run(1);console.log('  D 2 s: heading',f1(g.rotation.y));
  {const y1=g.position.y;hold(['KeyC'],2);console.log('  C 2 s: height',f1(g.position.y-G0-1),' came down',f1(y1-g.position.y));}
  tap();run(0.2);console.log('  E again:',st(),' falling',!P.grounded);const eP=T.nEdits;
  let t=0;while(t<40&&!pl.dead&&(t<1||pl.free.vy<0)){run(0.5);t+=0.5;}
  console.log('  left to itself at full speed: down after',f1(t),'s, wrecked',pl.dead,' me on the ground',P.grounded,' crater blocks',T.nEdits-eP);}}
}
console.log('errors',errs.length,errs.slice(0,3));
`);
if(!TENVMODE)process.stdout.write(require('child_process').execFileSync(process.execPath,[__filename,'tenv'],{env:process.env,maxBuffer:1e8}));
process.exit(0);
