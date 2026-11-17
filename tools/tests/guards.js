// Guard tests: the things every vehicle, every gun and every enemy kind should all do alike, checked for each one, so a
// new vehicle, gun or enemy that misses one shows up here. node guards.js
// Each check prints ok or the gaps it found. Gaps known today are listed in EXPECTED below (with why), so the suite
// passes now and says NEW GAP for anything else; fixing one prints FIXED, and its line should then be deleted.
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
// (E: anything inside the game's one scope, by name; assigning through it swaps a function for the length of a check)
hdr=hdr.replace(/window\.__t=\{/,'window.__ev=s=>eval(s);window.__t={');
eval(hdr+`
eval(src);const T=window.__t,E=window.__ev;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const DT=E('DT'),G0=44;
// ---- known gaps today (family/kind: check). Delete a line when it's fixed ----
const EXPECTED=new Set([
  // (the vehicle registry, phase 3: snow only on cars, base armour, planes and Mobile Gears)
  'balloon: snow','barge: snow','carrier: snow','mount: snow',
  // (points: no award when these are destroyed)
  'balloon: points','mech: points','mount: points',
  // (online health sync: not sent)
  'balloon: net','barge: net','carrier: net','mount: net',
  // (the carrier loses health only from its blocks, by design: shipHit leaves it alone)
  'carrier: damage','carrier: points',
  // (the soldiers who crew the base's armour have no entry in the Dev tab's enemy list)
  'soldier: dev',
]);
const seen=new Set(),out=[];let newGaps=0,fixed=0;
const check=(who,what,ok,info)=>{const k=who+': '+what;seen.add(k);const exp=EXPECTED.has(k);
  if(!ok&&!exp){newGaps++;out.push('  NEW GAP '+k+(info?' ('+info+')':''));}
  else if(ok&&exp){fixed++;out.push('  FIXED   '+k+' (delete it from EXPECTED)');}
  return ok;};
const flush=label=>{console.log(label+(out.length?'':' ok'));for(const l of out)console.log(l);out.length=0;};
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const put=(x,z)=>{P.pos.set(x,G0+1,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.rideC=null;P.vcl=null;P.state='walk';P.hp=20;};
E('setGobP')(P,true);run(0.3);

// ==== every vehicle: snow, health, damage, Invulnerability, points, online health ====
// (one of each kind the debug menu spawns, then a carrier's deck weapon; the street's boats and trains, and the
// two-seater planes, aren't spawned in the Testing Environment)
const shoot=E("typeof shotPlayer==='function'?shotPlayer:damagePlayer");   // (so this runs on an older build too)
const hpOf=D=>{const h=E('drvHP')(D);return h&&isFinite(h.hp)?h.hp:NaN;};
const hurt=(D,n)=>{if(D.k==='car')E('damageCar')(D.o,n,new V3(1,0,0));else E('trainHit')(D.o,n,new V3(1,0,0),D.ci);};
const famOf=(t,D)=>D.k==='car'?'car':t==='plane'||t==='jet'?'plane':t==='barge'||t==='carrier'?t:D.k;
function findNew(t,beforeC,beforeT,beforeS){
  const c=T.cars.find(c=>c.alive&&!beforeC.has(c));if(c)return{k:'car',o:c};
  for(const S of E('SHIPS'))if(S&&!beforeS.has(S))return{k:'ship',o:S};
  for(const B of E('TRAIN_BOXES')){const pr=B.proxy,o=pr.T;if(!o||beforeT.has(o)||!pr.alive)continue;
    P.pos.set(B.x,B.top,B.z);const D=E('drvFind')(P);if(D&&D.o===o)return D;}
  return null;}
const kinds=E('tenvVehKinds()');const did={},spare={};
for(const t of kinds){
  E('tenvClear()');quiet();put(0,0);P.cam.yaw=0;run(0.3);
  const bc=new Set(T.cars.filter(c=>c.alive)),bt=new Set(E('TRAIN_BOXES').map(B=>B.proxy.T).filter(Boolean)),bs=new Set(E('SHIPS').filter(Boolean));
  E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')(t);E('menuOpen=false');run(0.3);
  const D=findNew(t,bc,bt,bs);if(!D){check(t,'spawned',false);continue;}
  const fam=famOf(t,D);did[fam]=(did[fam]||0)+1;
  // snow: a blizzard over it for a few seconds
  {const W=E('WX'),sc=W.snowCover;W.snowCover=1;for(let i=0;i<8;i++)E('updateVehSnow')(0.5);W.snowCover=sc;
   const o=D.o;check(fam==='car'?t:fam,'snow',!!(o.snowU),'no snowU');}
  // health shown while driving
  const h0=hpOf(D);check(fam==='car'?t:fam,'hp',isFinite(h0)&&E('drvHP')(D).max>0,'drvHP '+JSON.stringify(E('drvHP')(D)));
  // a rifle round while someone's driving it: the vehicle takes it (and Invulnerability covers it)
  {const w=P.drv;P.drv=D;DT.invuln=true;shoot(P,1,null,new V3(1,0,0),'test','t');const h1=hpOf(D);DT.invuln=false;
   shoot(P,1,null,new V3(1,0,0),'test','t');const h2=hpOf(D);P.drv=w;
   check(fam==='car'?t:fam,'invuln',h1===h0,h0+' -> '+h1);check(fam==='car'?t:fam,'damage',h2<h1,h1+' -> '+h2);}
  // destroyed (nobody in it): points for it
  {const s0=E('score');hurt(D,1e5);run(0.2);check(fam==='car'?t:fam,'points',E('score')>s0,'score unchanged');}
  // online: is its health sent to guests? (cars in the car snapshot, a Mobile Gear in its own, the rest by venue)
  {let ok=false;if(D.k==='car')ok=true;else if(D.k==='mech')ok=E('NET_MGK').includes('hp');
   else{const L=E('netVenueHP')({});ok=L.some(([vk])=>{const V=T.venues.get(vk);return V&&(V===D.V||V.mil&&V.mil.includes(D.o)||V.pl&&V.pl.includes(D.o)||V.bo===D.o||V.T===D.o);});}
   check(fam==='car'?t:fam,'net',ok);}
  if(t==='carrier'){const S=D.o;spare.carrier=S;}
  if(t==='tank'||t==='heli')spare[t]=1;
  flush('vehicle '+t+' ('+D.k+')');
}
// a carrier's deck weapon (one spawned again, since the one above was wrecked)
{E('tenvClear()');quiet();put(0,0);P.cam.yaw=0;run(0.3);const bs=new Set(E('SHIPS').filter(Boolean));E('menuOpen=true');E('TS').n=1;E('tenvVeh')('carrier');E('menuOpen=false');run(0.5);
 const S=E('SHIPS').find(q=>q&&!bs.has(q));const Mt=S&&S.mounts&&S.mounts[0];
 if(!Mt)check('mount','spawned',false);else{const D={k:'mount',o:Mt,V:S.V};
  {const W=E('WX'),sc=W.snowCover;W.snowCover=1;for(let i=0;i<8;i++)E('updateVehSnow')(0.5);W.snowCover=sc;check('mount','snow',!!Mt.snowU);}
  check('mount','hp',isFinite(hpOf(D)));
  const h0=Mt.hp,w=P.drv;P.drv=D;DT.invuln=true;shoot(P,1,null,new V3(1,0,0),'test','t');const h1=Mt.hp;DT.invuln=false;shoot(P,1,null,new V3(1,0,0),'test','t');const h2=Mt.hp;P.drv=w;
  check('mount','invuln',h1===h0,h0+' -> '+h1);check('mount','damage',h2<h1,h1+' -> '+h2+' (its own health)');
  const s0=E('score');E('trainHit')(Mt,1e5);check('mount','points',E('score')>s0);
  check('mount','net',false);}
 flush('vehicle carrier deck weapon');}
// a train being driven, with Invulnerability on (a stand-in train: there are no railways here)
{const g={position:new V3(),rotation:{},traverse(){}},Tr={cars:[g,g],C:{}},w=P.drv;P.drv={k:'train',o:Tr,ci:0};DT.invuln=true;E('trainHit')(Tr,10,undefined,0);DT.invuln=false;P.drv=w;
 {const h=Tr.carHP?Tr.carHP[0]:E('CAR_HP');check('train','invuln',h===E('CAR_HP'),'car hp '+h);}flush('vehicle train (stand-in)');}
console.log('families covered:',Object.entries(did).map(([k,n])=>k+(n>1?' x'+n:'')).join(', '),'| not spawnable here: boats, trains, subways, two-seater planes');

// ==== every enemy gun: rounds stop at walls, and a player driving has the vehicle hurt ====
// (Math.random pinned low, so every round that can hit does; the target alone on open ground, then shut in a stone box)
const box=(on)=>{const x=Math.floor(P.pos.x),y=Math.floor(P.pos.y),z=Math.floor(P.pos.z);
  for(let a=-2;a<=2;a++)for(let b=-1;b<=4;b++)for(let c=-2;c<=2;c++){const edge=Math.abs(a)===2||Math.abs(c)===2||b===-1||b===4;if(edge)E('setRaw')(x+a,y+b,z+c,on?3:0);}};
const R0=Math.random;const pin=()=>{Math.random=()=>0.001;},unpin=()=>{Math.random=R0;};
let tank=null;{E('tenvClear()');quiet();put(0,0);run(0.2);E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')('tank');E('menuOpen=false');run(0.3);
 for(const V of T.venues.values())if(V.mil)for(const M of V.mil)if(M.kind==='tank'&&!M.dead)tank=M;}
let heli=null;{E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')('heli');E('menuOpen=false');run(0.3);
 for(const V of T.venues.values())if(V.mil)for(const M of V.mil)if(M.kind==='heli'&&!M.dead)heli=M;}
// each gun: fire(target place) fires a few rounds from about 20 off at P
const X0=60,Z0=60,GY=G0+1;
const guns={
  'foeShoot (rifles, handguns)':()=>{const g={pos:new V3(X0-20,GY,Z0),heading:Math.PI/2,id:'t'};for(let i=0;i<6;i++)E('foeShoot')(g,P,E('FOES').militia.gun);},
  'crewGun (technical)':()=>{const c={veh:'technical',pos:new V3(X0-20,GY,Z0),heading:Math.PI/2,vehG:{technical:{}},crew:{gun:'t',go:true,yaw:0,cd:0,burst:5,bt:0}};
    const F=E('CREW_GUN').technical;for(let i=0;i<5;i++)E('crewGun')(c,F.bt+0.01);},
  'helicopter gun (AI)':()=>{const M=heli;if(!M)return;M.state='hunt';M.spin=1;M.drv=null;M.gnr=null;
    for(let i=0;i<6;i++){M.x=X0-20;M.z=Z0;M.y=GY+13;M.h=Math.atan2(P.pos.x-M.x,P.pos.z-M.z);M.burst=6-i;M.bt=0;M.cd=10;M.rcd=100;M.oa=Math.PI;E('updateHeli')(M,M.V,0.13);}},
  'jetAIGun (fighter jet)':()=>{const pl={ai:{gcd:0},g:{position:new V3(X0-20,GY+3,Z0),rotation:{y:Math.PI/2}},crew:'t'};E('wpnInit')(pl,'jet');
    for(let i=0;i<3;i++){pl.ai.gcd=0;E('jetAIGun')(pl,{q:P,x:P.pos.x,y:P.pos.y,z:P.pos.z},0.1);}},
  'mountAI (CIWS)':()=>{const Mt={kind:'ciws',S:{},cd:0,spin:1,burst:0,acc:0,crew:'t',wpn:{gun:{n:999,cd:0,rl:0,W:{gap:0,max:999,reload:1}}}};
    const mt=E('mountThreat'),ma=E('mountAimAt'),mm=E('mountMuzzle');
    window.__mt=()=>({x:P.pos.x,y:P.pos.y+1,z:P.pos.z,o:P.drv?{p:P,veh:true}:{p:P}});window.__mm=()=>({x:X0-20,y:GY+2,z:Z0});
    E('mountThreat=()=>window.__mt();mountAimAt=()=>{};mountMuzzle=()=>window.__mm()');
    try{for(let i=0;i<3;i++)E('mountAI')(Mt,0.1);}finally{E('mountThreat')!==mt&&(window.__r=[mt,ma,mm],E('mountThreat=window.__r[0];mountAimAt=window.__r[1];mountMuzzle=window.__r[2]'));}},
  'fireball (cultists)':()=>{const F=E('fireball')(X0-20,GY+1.5,Z0,P.pos.x,P.pos.y+1.5,P.pos.z,'t');for(let i=0;i<60*3&&F&&F.live;i++)E('updateFireballs')(1/60);},
};
for(const [name,fire] of Object.entries(guns)){
  const res={};
  for(const sc of ['open','driving','walled']){E('tenvClear()');quiet();put(X0,Z0);
    for(let a=-30;a<=6;a++)for(let b=-6;b<=6;b++)for(let y=0;y<8;y++)E('setRaw')(X0+a,G0+1+y,Z0+b,0);   // (a clear field, whatever the last check left)
    if(sc==='walled')box(true);
    const D=sc==='driving'&&tank?{k:'tank',o:tank,V:tank.V}:null;if(D){tank.dead=false;tank.hp=E('MIL').tank.hp;tank.x=X0;tank.z=Z0;tank.y=G0+1;E('milPlace')(tank);E('milBoxes')(tank,0);}   // (the tank where P is, its box in TRAIN_BOXES for the guns that trace a line)
    const w=P.drv;P.drv=D;const h0=P.hp,v0=D?tank.hp:0;pin();try{fire();}catch(e){res[sc]='threw '+e.message;}unpin();P.drv=w;
    res[sc]=res[sc]||{hp:P.hp-h0,veh:D?tank.hp-v0:0};if(sc==='walled')box(false);P.hp=20;}
  const r=res;check(name,'hurts on foot',r.open.hp<0,JSON.stringify(r.open));
  check(name,'hurts a driver\\'s vehicle',r.driving.veh<0&&r.driving.hp===0,JSON.stringify(r.driving));
  check(name,'stopped by walls',r.walled.hp===0,JSON.stringify(r.walled));
  flush('gun '+name+' | on foot '+r.open.hp+' hp, driving: tank '+(r.driving.veh||0)+', boxed in '+r.walled.hp);
}
// a vehicle's gun (gunRound) at a goblin: hits it in the open, not through a wall
{const g=T.goblins.find(g=>g.state==='wait');const shootAt=walled=>{E('tenvClear()');quiet();put(X0,Z0);
   for(let a=-30;a<=6;a++)for(let b=-6;b<=6;b++)for(let y=0;y<8;y++)E('setRaw')(X0+a,G0+1+y,Z0+b,0);
   g.state='chase';g.pos.set(X0,GY,Z0);g.hp=50;g.root.visible=true;P.pos.set(X0-25,GY,Z0+8);if(walled)for(let a=-10;a<=-5;a++)for(let b=-3;b<=3;b++)for(let y=0;y<5;y++)E('setRaw')(X0+a,GY+y,Z0+b,3);   // (thick: a round breaks the block it hits half the time)
   const h=g.hp;pin();for(let i=0;i<5;i++)E('gunRound')(tank,P,X0-20,GY+0.8,Z0,2,0,'test','test',{x:X0,y:GY+0.8,z:Z0});unpin();const d=h-g.hp;g.state='wait';g.root.visible=false;return d;};
 const o=shootAt(false),w=shootAt(true);check('gunRound (vehicle guns)','hurts a goblin',o>0,o);check('gunRound (vehicle guns)','stopped by walls',w===0,w);
 flush('gun gunRound | goblin hurt '+o+' in the open, '+w+' through a wall');}

// ==== blasts and shells against each kind of box a vehicle stands in for ====
// (each kind of box pushed alone, with a stand-in for what it belongs to; trainHit swapped for a recorder)
{const kinds={train:{C:1,cars:[1]},plane:{isPlane:1},boat:{isBoat:1},ship:{isShip:1},mount:{isMount:1},animal:{isAnimal:1,soft:1},
   ride:{isRide:1},'ride (soft: wheel rim, carousel)':{isRide:1,soft:1},tank:{isMil:1},mech:{isMech:1},balloon:{isBalloon:1}};
 const TB=E('TRAIN_BOXES'),th=E('trainHit');let got=[];window.__th=(o)=>got.push(o);E('trainHit=(o)=>window.__th(o)');
 try{for(const [k,f] of Object.entries(kinds)){const o={...f,alive:true};delete o.soft;const pr={alive:true,T:o,i:0};const B={x:500,z:500,tx:0,tz:1,y0:G0,top:G0+3,v:0,hx:1.5,hz:2,proxy:pr,soft:!!f.soft};
   const saved=TB.splice(0);TB.push(B);got=[];E('vehBlast')(500,G0+1,503,4,20,null);const blast=got.includes(o);
   const S={pos:new V3(500,G0+1.5,500),own:null};const shell=!!E('shotHitsVeh')(S);TB.splice(0);TB.push(...saved);
   check(k,'blast',blast);
   // (a shell goes off on anything solid, and on a zoo animal; it flies on through a wheel's rim or a carousel's box)
   const want=!(f.soft&&!f.isAnimal);check(k,'shell',shell===want,'went off '+shell);}}
 finally{window.__th0=th;E('trainHit=window.__th0');}
 flush('blasts and shells vs every kind of vehicle box');}

// ==== every enemy kind: the fields the AI reads, and a place in the Dev tab's enemy list ====
{E('jackKinds()');const F=E('FOES'),dev=new Set(E('DEV_FOE_KINDS').map(d=>d.k)),W=E('WEAPONS');
 for(const k in F){const f=F[k],bad=[];for(const n of ['name','label','tunic','pants','hat','hatc','hp','spd','jobs'])if(f[n]===undefined)bad.push(n);
   if(!Array.isArray(f.melee)||f.melee.length<3)bad.push('melee');if(f.gear!=null&&!W[f.gear])bad.push('gear '+f.gear);
   if(f.gun&&f.gun.length<6)bad.push('gun');if(f.bomb&&f.bomb.length<7)bad.push('bomb');
   check(k,'fields',!bad.length,bad.join(','));check(k,'dev',dev.has(k));}
 flush('enemy kinds ('+Object.keys(F).join(', ')+')');}

for(const k of EXPECTED)if(!seen.has(k)){console.log('  (expected gap not checked any more: '+k+')');}
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
console.log(newGaps?'GUARDS: '+newGaps+' NEW GAP(S)':'GUARDS: no new gaps','| expected gaps',EXPECTED.size-fixed,'| fixed',fixed);
process.exit(0);
`);
