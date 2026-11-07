// Two players in one vehicle: one goblin drives, the other works the gun (a technical's machine gun, a four-wheeler's
// rifle, a tank's turret, a helicopter's gun and rockets), aiming where they look; on your own, the weapon button moves
// you between the seats. Runs in the Testing Environment, both players goblins. node gunseat.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
// (each frame, after the real controls are read, each player's are replaced by the script's: IN[0], IN[1])
hdr=hdr.replace(/window\.__t=\{/,'window.__IN=[{},{}];{const _ri=readInputs;readInputs=function(dt){_ri(dt);for(const p of players){const I=window.__IN[p.idx]||{},o=p.__o||(p.__o={});const q={x:0,z:0,bite:false,stomp:false,use:false,weapon:false,jump:false,climb:false,charge:false,lockPress:false,...I};q.bitePress=q.bite&&!o.bite;Object.assign(p.in,q);p.__o={bite:q.bite};}};}window.__t={activateP2,setGob,tenvVeh,drvSwapTo,cars,venues,charName,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
for(const f of els.play.L.click)f();pads.length=0;run(1);
const [A,B]=T.players;T.activateP2();T.DT.invuln=true;T.DT.host=1;T.setGob(true);run(0.5);
const IN=window.__IN,f1=v=>v.toFixed(1),G0=44;
const hold=(i,o,s)=>{IN[i]=o;run(s);IN[i]={};run(0.05);};
const use=i=>hold(i,{use:true},0.1),swap=i=>hold(i,{weapon:true},0.1);
const put=(p,x,z)=>{p.pos.set(x,G0+1,z);p.vy=0;p.mvx=p.mvz=0;p.standCar=null;p.vcl=null;p.state='walk';};
const beside=(p,x,z,h,hx,s)=>put(p,x-Math.cos(h)*(hx+0.7)*s,z+Math.sin(h)*(hx+0.7)*s);
const seat=p=>p.drv?(p.drv.seat==='gun'?'gunner':'driver')+' of '+p.drv.k:'on foot';
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
const ammo=o=>o.wpn?Object.values(o.wpn).map(s=>s.W.name+' '+s.n+'/'+s.W.max).join(', '):'none';
const look=(p,x,y,z)=>{const c=p.camera.position,dx=x-c.x,dz=z-c.z;p.cam.yaw=Math.atan2(-dx,-dz);p.cam.pitch=Math.atan2(y-c.y,Math.hypot(dx,dz));};
// (a hostile goblin stood at x,z)
const target=(x,z)=>{const g=T.goblins.find(q=>q.state==='wait'&&!q.civ&&!q.special);g.state='chase';g.hp=g.hpMax=6;g.pos.set(x,G0+1,z);g.root.visible=true;g.stun=99;g.vy=0;g.kv.set(0,0,0);return g;};
console.log('players:',T.players.map(p=>T.charName(p)+(p.gob?' (goblin)':'')).join(' + '));

for(const k of ['technical','quad']){
  T.TS.vm='park';T.TS.n=1;const before=new Set(T.cars.filter(c=>c.alive));A.cam.yaw=Math.PI;run(0.1);T.tenvVeh(k);run(0.5);
  const c=T.cars.find(o=>o.alive&&!before.has(o)&&o.veh===k);if(!c){console.log(k+': none spawned');continue;}
  console.log('== '+k);
  beside(A,c.pos.x,c.pos.z,c.heading,c.hx,1);run(0.05);use(0);
  beside(B,c.pos.x,c.pos.z,c.heading,c.hx,-1);run(0.05);use(1);
  console.log('  A:',seat(A),' B:',seat(B),' car.drv is A',c.drv===A,' car.gnr is B',c.gnr===B);
  const x0=c.pos.x,z0=c.pos.z;IN[0]={z:-1};run(2);IN[0]={};
  console.log('  A drives 2 s: moved',f1(Math.hypot(c.pos.x-x0,c.pos.z-z0)),' B carried along, off its middle by',f1(Math.hypot(B.pos.x-c.pos.x,B.pos.z-c.pos.z)),' B shown on it',!!(B.gb&&B.gb.root.visible),' B up',B.gb?f1(B.gb.root.position.y-c.pos.y):'-');
  IN[0]={z:1};run(1.5);IN[0]={};run(1);
  // (a goblin off to the right, behind: B turns the gun on to it and fires)
  const r=-c.heading,tx=c.pos.x+Math.cos(c.heading)*10-Math.sin(c.heading)*4,tz=c.pos.z-Math.sin(c.heading)*10-Math.cos(c.heading)*4,g=target(tx,tz);run(0.1);
  for(let k3=0;k3<8;k3++){look(B,tx,G0+1.8,tz);run(0.12);}const yaw=c.gunYaw,a0=JSON.stringify(c.wpn&&c.wpn.gun.n),hp0=g.hp;
  {const H=B.ui.drvHud;console.log('  B display:',H&&!H.el.hidden,' crosshair',H&&!H.xh.hidden,' says',hudT(H&&H.txt.n),'|',hudT(H&&H.txt.w),' ammo panel',H&&!H.ammo.hidden);}
  {const H=A.ui.drvHud;console.log('  A display: crosshair',H&&!H.xh.hidden,' says',hudT(H&&H.txt.w));}
  const want=Math.atan2(tx-c.pos.x,tz-c.pos.z)-c.heading;
  console.log('  gun swung',f1(yaw),' toward the goblin at',f1(Math.atan2(Math.sin(want),Math.cos(want))));
  for(let k2=0;k2<(k==='quad'?4:1);k2++)hold(1,{bite:true},k==='quad'?0.1:1),run(0.5);
  console.log('  B fires: rounds',a0,'->',c.wpn.gun.n,' goblin hp',hp0,'->',g.hp,g.state);
  const a1=c.wpn.gun.n;hold(0,{bite:true},0.5);console.log('  A bite (the horn): rounds used',a1-c.wpn.gun.n);
  use(1);run(0.3);console.log('  B gets off:',seat(B),' car.gnr',c.gnr?'set':'null',' A still',seat(A));
  // (on your own: the weapon button moves you to the gun, and back)
  console.log('  A alone, free seat to move to',T.drvSwapTo(A));swap(0);console.log('  A weapon:',seat(A),' car.drv',c.drv?'set':'null',' left',!!c.left);
  {const n0=c.wpn.gun.n;hold(0,{bite:true},0.3);console.log('  A bite on the gun: rounds used',n0-c.wpn.gun.n);}
  swap(0);console.log('  A weapon again:',seat(A),' car.drv is A',c.drv===A,' left',!!c.left);
  use(0);run(0.3);console.log('  A gets out:',seat(A));
  g.state='wait';g.root.visible=false;c.alive=false;c.g.visible=false;}

for(const k of ['tank','heli']){
  T.TS.vm='park';T.TS.n=1;A.cam.yaw=Math.PI;run(0.1);T.tenvVeh(k);run(1);
  const V=[...T.venues.values()].find(v=>v.kind==='army'&&v.mil&&v.mil.some(m=>m.kind===k&&!m.dead&&!m.drv&&!m.gnr));const M=V&&V.mil.find(m=>m.kind===k&&!m.dead&&!m.drv&&!m.gnr);if(!M){console.log(k+': none spawned');continue;}
  console.log('== '+k,' state',M.state);const I=T.MIL[k];
  beside(A,M.x,M.z,M.h,I.hx,1);run(0.05);use(0);let n=0;while(A.drv&&A.drv.jack&&n<60){run(0.1);n++;}
  beside(B,M.x,M.z,M.h,I.hx,-1);run(0.05);use(1);
  console.log('  A:',seat(A),' B:',seat(B),' gnr is B',M.gnr===B);
  {const H=A.ui.drvHud,H2=B.ui.drvHud;console.log('  A display: crosshair',!H.xh.hidden,' says',hudT(H.txt.w));console.log('  B display: crosshair',!H2.xh.hidden,' says',hudT(H2.txt.n),'|',hudT(H2.txt.w));}
  if(k==='heli'){IN[0]={jump:true};run(3);IN[0]={};console.log('  A climbs 3 s: up',f1(M.y-G0),' B with it, up',f1(B.pos.y-G0));}
  // (A looks one way, B the other: the gun follows B)
  A.cam.yaw=M.h+Math.PI;B.cam.yaw=M.h+Math.PI-1.5;B.cam.pitch=-0.2;run(2.5);
  if(k==='tank'){const tw=M.h+M.tu,want=B.cam.yaw+Math.PI,d=Math.atan2(Math.sin(tw-want),Math.cos(tw-want)),dA=Math.atan2(Math.sin(tw-(A.cam.yaw+Math.PI)),Math.cos(tw-(A.cam.yaw+Math.PI)));
    console.log('  turret off where B looks by',f1(Math.abs(d)),'  off where A looks by',f1(Math.abs(dA)));}
  const shots=()=>{let n=0;for(const s of T.SHOTS)if(s.live&&!s.__c){s.__c=1;n++;}return n;},seen=()=>{for(const s of T.SHOTS)if(s.live)s.__c=1;};
  {const s0=shots(),w0=ammo(M);hold(0,{bite:true,stomp:true},0.3);console.log('  A bite/stomp: shots',shots()-s0,' ammo',w0,'->',ammo(M));}
  {const s0=shots(),w0=ammo(M);hold(1,{bite:true},0.6);if(k==='heli'){hold(1,{stomp:true},0.1);}console.log('  B bite'+(k==='heli'?' and stomp':'')+': shots',shots()-s0,' ammo',w0,'->',ammo(M));}
  // (A gets out; B stays on the gun, the vehicle left standing)
  use(0);run(k==='heli'?6:1);console.log('  A gets out:',seat(A),' vehicle',M.state,' B still',seat(B));
  {M.wpn&&Object.values(M.wpn).forEach(s=>{s.n=s.W.max;s.rl=0;s.cd=0;});const s0=shots();hold(1,{bite:true},0.6);console.log('  B fires with nobody driving: shots',shots()-s0,' rounds',ammo(M));}
  swap(1);console.log('  B weapon (to the controls):',seat(B),' drv is B',M.drv===B,' gnr',M.gnr?'set':'null');
  use(1);run(0.5);console.log('  B gets out:',seat(B),' vehicle',M.state);}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
