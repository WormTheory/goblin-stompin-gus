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
  // (a carrier's deck weapons aren't online yet: a guest's carrier has them, but not their health. See the registry's note)
  'mount: net',
  // (the carrier loses health only from its blocks, by design: shipHit leaves it alone)
  'carrier: damage','carrier: points','carrier: rampage',
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
const centre=D=>{if(D.k==='car'){const c=D.o;return{x:c.pos.x,y:c.pos.y+(c.hy||1.4)*0.5,z:c.pos.z,r:c.hx+c.hz};}
  const B=E('TRAIN_BOXES').find(B=>B.proxy.T===D.o&&!B.soft);return B?{x:B.x,y:(B.y0+B.top)/2,z:B.z,r:(B.hx||1.5)+(B.hz||2)}:null;};
const famOf=(t,D)=>D.k==='car'?'car':t==='plane'||t==='jet'?'plane':t==='barge'||t==='carrier'?t:D.k;
function findNew(t,beforeC,beforeT,beforeS){
  const c=T.cars.find(c=>c.alive&&!beforeC.has(c));if(c)return{k:'car',o:c};
  for(const S of E('SHIPS'))if(S&&!beforeS.has(S))return{k:'ship',o:S};
  for(const B of E('TRAIN_BOXES')){const pr=B.proxy,o=pr.T;if(!o||beforeT.has(o)||!pr.alive)continue;
    P.pos.set(B.x,B.top,B.z);const D=E('drvFind')(P);if(D&&D.o===o)return D;}
  return null;}
const kinds=E('tenvVehKinds()');const did={},spare={};
let kx=-600;for(const t of kinds){
  E('tenvClear()');quiet();put(kx+=60,0);P.cam.yaw=0;run(0.3);   // (each on fresh ground: the last one's wreck leaves a crater)
  const bc=new Set(T.cars.filter(c=>c.alive)),bt=new Set(E('TRAIN_BOXES').map(B=>B.proxy.T).filter(Boolean)),bs=new Set(E('SHIPS').filter(Boolean));
  E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')(t);E('menuOpen=false');run(0.3);
  const D=findNew(t,bc,bt,bs);if(!D){check(t,'spawned',false);continue;}
  const fam=famOf(t,D);did[fam]=(did[fam]||0)+1;check(fam==='car'?t:fam,'registry',!!E('VEHICLE_KINDS')[D.k],'no VEHICLE_KINDS.'+D.k);
  // snow: a blizzard over it for a few seconds
  {const W=E('WX'),sc=W.snowCover;W.snowCover=1;for(let i=0;i<8;i++)E('updateVehSnow')(0.5);W.snowCover=sc;
   const o=D.o,K=E('VEHICLE_KINDS')[D.k];
   if(K&&K.snow==='blocks'){   // (made of blocks: its chunks are drawn with open tops marked for snow)
     let n=0;for(const [k,v] of E('meshes'))if(v.cx>=E('SHIP_CX0'))for(const m of v.m){const a=m.geometry&&m.geometry.attributes&&m.geometry.attributes.aSky;if(a&&a.array&&Array.prototype.some.call(a.array,x=>x>=0.5))n++;}
     check(fam,'snow',n>0,'no open tops in its chunks');}
   else check(fam==='car'?t:fam,'snow',!!(o.snowU),'no snowU');}
  // health shown while driving
  const h0=hpOf(D);check(fam==='car'?t:fam,'hp',isFinite(h0)&&E('drvHP')(D).max>0,'drvHP '+JSON.stringify(E('drvHP')(D)));
  // a rifle round while someone's driving it: the vehicle takes it (and Invulnerability covers it)
  {const w=P.drv;P.drv=D;DT.invuln=true;shoot(P,1,null,new V3(1,0,0),'test','t');const h1=hpOf(D);DT.invuln=false;
   shoot(P,1,null,new V3(1,0,0),'test','t');const h2=hpOf(D);P.drv=w;
   check(fam==='car'?t:fam,'invuln',h1===h0,h0+' -> '+h1);check(fam==='car'?t:fam,'damage',h2<h1,h1+' -> '+h2);}
  // one of Gnash's rifle rounds at it from the side (fireRound, as gobShoot fires it): it takes the hit (a ship: a few
  // rounds at its side, each knocking out the block it strikes, which is what a ship's health is)
  if(D.k==='ship'&&E("typeof fireRound==='function'")){const S=D.o,h1=S.hp,r0=Math.random;Math.random=()=>0.01;
    const B=E('TRAIN_BOXES').find(B=>B.proxy.T===S);
    if(B){const L=B.hx+B.hz+6;for(let i=0;i<4;i++)E('fireRound')({x:B.x-B.tz*L,y:B.y0+0.6+i*(B.top-B.y0-1)/4,z:B.z+B.tx*L,dir:{x:B.tz,y:0,z:-B.tx},range:L*2,step:0.2,by:P,dmg:2,cause:'test',vehs:true,vd:6,breaks:true,ship:true});run(0.2);}
    Math.random=r0;check(fam,'bullets',S.hp<h1,h1+' -> '+S.hp);}
  else if(E("typeof fireRound==='function'")){const c=centre(D);if(c){const h1=hpOf(D);
    E('fireRound')({x:c.x-c.r-6,y:c.y,z:c.z,dir:{x:1,y:0,z:0},range:c.r+12,step:0.2,by:P,gobs:true,gb:[0.45,0,1.5],dmg:2,cause:'test',vehs:true,vd:6,ship:true});
    check(fam==='car'?t:fam,'bullets',hpOf(D)<h1,h1+' -> '+hpOf(D));}}
  // destroyed (nobody in it): points for it
  {const s0=E('score'),r0=E('RAMP').cars;hurt(D,1e5);run(0.2);check(fam==='car'?t:fam,'points',E('score')>s0,'score unchanged');
   check(fam==='car'?t:fam,'rampage',E('RAMP').cars===r0+1,'vehicles destroyed '+r0+' -> '+E('RAMP').cars);}
  // online: is its health sent to guests? (cars in the car snapshot, a Mobile Gear in its own, the rest by venue)
  {let ok=false;if(D.k==='car')ok=true;else if(D.k==='mech')ok=E('NET_MGK').includes('hp');
   else if(D.k==='ship')ok=E('netShips')().some(e=>e[1]===D.o.n&&Math.abs(e[8]-D.o.hp)<0.01);   // (a ship's in its own snapshot, netShips)
   else{const L=E('netVenueHP')({});ok=L.some(([vk])=>{const V=T.venues.get(vk);return V&&(V===D.V||V.mil&&V.mil.includes(D.o)||V.pl&&V.pl.includes(D.o)||V.bo===D.o||V.T===D.o);});}
   check(fam==='car'?t:fam,'net',ok);}
  if(t==='carrier'){const S=D.o;spare.carrier=S;}
  if(t==='tank'||t==='heli')spare[t]=1;
  flush('vehicle '+t+' ('+D.k+')');
}
// a carrier's deck weapon (on a carrier spawned again, or else the one above: a carrier takes no harm from hits)
{E('tenvClear()');quiet();put(0,0);P.cam.yaw=0;run(0.3);const bs=new Set(E('SHIPS').filter(Boolean));E('menuOpen=true');E('TS').n=1;E('tenvVeh')('carrier');E('menuOpen=false');run(0.5);
 const S=E('SHIPS').find(q=>q&&!bs.has(q))||spare.carrier;const Mt=S&&S.mounts&&S.mounts[0];
 if(!Mt)check('mount','spawned',false);else{const D={k:'mount',o:Mt,V:S.V};
  {const W=E('WX'),sc=W.snowCover;W.snowCover=1;for(let i=0;i<8;i++)E('updateVehSnow')(0.5);W.snowCover=sc;check('mount','snow',!!Mt.snowU);}
  check('mount','hp',isFinite(hpOf(D)));
  // a rifle round at it from out in the world (its box there, B.mw): it takes the hit
  {E('shipBoxes')(S);const B=E('TRAIN_BOXES').find(B=>B.proxy.T===Mt&&B.mw);if(B){const h1=Mt.hp;
    E('fireRound')({x:B.x-8,y:(B.y0+B.top)/2,z:B.z,dir:{x:1,y:0,z:0},range:14,step:0.2,by:P,dmg:2,cause:'test',vehs:true,vd:6,ship:true});
    check('mount','bullets',Mt.hp<h1,h1+' -> '+Mt.hp);}else check('mount','bullets',false,'no box in the world');}
  const h0=Mt.hp,w=P.drv;P.drv=D;DT.invuln=true;shoot(P,1,null,new V3(1,0,0),'test','t');const h1=Mt.hp;DT.invuln=false;shoot(P,1,null,new V3(1,0,0),'test','t');const h2=Mt.hp;P.drv=w;
  check('mount','invuln',h1===h0,h0+' -> '+h1);check('mount','damage',h2<h1,h1+' -> '+h2+' (its own health)');
  const s0=E('score'),r0=E('RAMP').cars;E('trainHit')(Mt,1e5);check('mount','points',E('score')>s0);check('mount','rampage',E('RAMP').cars===r0+1,r0+' -> '+E('RAMP').cars);
  check('mount','net',false);}
 flush('vehicle carrier deck weapon');}
// a train being driven, with Invulnerability on (a stand-in train: there are no railways here)
{const g={position:new V3(),rotation:{},traverse(){}},Tr={cars:[g,g],C:{}},w=P.drv;P.drv={k:'train',o:Tr,ci:0};DT.invuln=true;E('trainHit')(Tr,10,undefined,0);DT.invuln=false;P.drv=w;
 {const h=Tr.carHP?Tr.carHP[0]:E('CAR_HP');check('train','invuln',h===E('CAR_HP'),'car hp '+h);}
 // (This rampage counts each train car wrecked)
 {const r0=E('RAMP').cars;E('trainHit')(Tr,1e5,undefined,0);check('train','rampage',E('RAMP').cars===r0+1,r0+' -> '+E('RAMP').cars);}flush('vehicle train (stand-in)');}
console.log('families covered:',Object.entries(did).map(([k,n])=>k+(n>1?' x'+n:'')).join(', '),'| not spawnable here: boats, trains, subways, two-seater planes');

// ==== the registry itself: every kind has what the shared code reads ====
{const VK=E('VEHICLE_KINDS');for(const k in VK){const K=VK[k],bad=[];for(const f of ['pos','top','mid','hp','max','dead','shown','groups','pts','label','hit'])if(typeof K[f]!=='function'&&!(k==='car'&&f==='groups'))bad.push(f);
   for(const f of ['snow','smoke','rampage','invuln','net','bullets','blasts'])if(K[f]===undefined)bad.push(f);if(k!=='car'&&!K.venue)bad.push('venue');if(k!=='car'&&typeof K.list!=='function')bad.push('list');
   check('registry '+k,'fields',!bad.length,bad.join(','));}
 flush('vehicle registry ('+Object.keys(VK).join(', ')+')');}

// ==== every car kind: carSpawn brings it back whole, at its kind's health (VEH's hp), and the health bar's full reads that ====
{const VEH=E('VEH'),cs=E('carSpawn'),c=E('makeCar')(990,false),cp=E('makeCar')(991,true);c.g.scale.setScalar(E('ES'));
 for(const t in VEH){c.hp=1;c.hpMax=1;c.alive=false;cs(c,{veh:t,x:0,y:E('G')+1,z:0,h:0,parked:true});const want=VEH[t].hp||30;
   check('car '+t,'spawn',c.alive&&c.hp===want&&c.hpMax===want&&c.veh===t&&E('VEHICLE_KINDS').car.max(c)===want,'hp '+c.hp+'/'+c.hpMax+' want '+want);}
 cs(cp,{x:0,y:E('G')+1,z:0});check('car police','spawn',cp.hp===40&&cp.hpMax===40,'hp '+cp.hp);
 flush('car spawns ('+Object.keys(VEH).length+' kinds and a police car)');}

// ==== every enemy gun: rounds stop at walls, and a player driving has the vehicle hurt ====
// (Math.random pinned low, so every round that can hit does; the target alone on open ground, then shut in a stone box
// with thick walls, since rounds that break blocks chew a block out each time with the random number pinned)
const box=(on)=>{const x=Math.floor(P.pos.x),y=Math.floor(P.pos.y),z=Math.floor(P.pos.z);
  for(let a=-9;a<=9;a++)for(let b=-1;b<=4;b++)for(let c=-9;c<=9;c++){const edge=Math.abs(a)>=2||Math.abs(c)>=2||b===-1||b===4;if(edge)E('setRaw')(x+a,y+b,z+c,on?3:0);}};
const R0=Math.random;const pin=()=>{Math.random=()=>0.001;},unpin=()=>{Math.random=R0;};
let tank=null;{E('tenvClear()');quiet();put(0,0);run(0.2);E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')('tank');E('menuOpen=false');run(0.3);
 for(const V of T.venues.values())if(V.mil)for(const M of V.mil)if(M.kind==='tank'&&!M.dead)tank=M;}
let heli=null;{E('menuOpen=true');E('TS').n=1;E('TS').vm='park';E('tenvVeh')('heli');E('menuOpen=false');run(0.3);
 for(const V of T.venues.values())if(V.mil)for(const M of V.mil)if(M.kind==='heli'&&!M.dead)heli=M;}
// each gun: fire(target place) fires a few rounds from about 20 off at P
const X0=60,Z0=60,GY=G0+1;
const guns={
  'foeShoot (rifles, handguns)':()=>{const g={pos:new V3(X0-20,GY,Z0),heading:Math.PI/2,id:'t'};for(let i=0;i<6;i++)E('foeShoot')(g,P,E('FOES').militia);},
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
{const F=E('FOES'),dev=new Set(E('DEV_FOE_KINDS').map(d=>d.k)),W=E('WEAPONS');
 for(const k in F){const f=F[k],bad=[];for(const n of ['name','label','tunic','pants','hat','hatc','hp','spd','jobs'])if(f[n]===undefined)bad.push(n);
   check(k,'fields',!bad.length,bad.join(','));check(k,'dev',dev.has(k));}
 flush('enemy kinds ('+Object.keys(F).join(', ')+')');}

// ==== every kind of goblin's weapons list (FOES and GOB_FOES): each entry a weapon in WEAPONS, built into its model, used
// by its AI (a gun at range, grenades thrown, its blow up close) and dropped when a player goblin kills it ====
{const F=E('FOES'),GF=E('GOB_FOES'),W=E('WEAPONS'),R0=Math.random,gm=E('goblinModel'),fo=E('foeModelOpt'),so=E('strikeOf'),gg=E('gobGear');
 const kinds=[...Object.keys(GF).map(k=>[k,GF[k]]),...Object.keys(F).map(k=>[k,F[k]])],devK=new Map(E('DEV_FOE_KINDS').map(d=>[d.arms,d]));
 const nodes=o=>{const r=E('new THREE.Group()');gm(r,o);let n=0;r.traverse(()=>n++);return n;},bare=nodes({weapons:[]});
 const nBox=k=>{let n=0;E('wpnBoxes')(W[k].model.held,()=>n++);return n;};
 for(const [k,f] of kinds){const L=f.weapons,bad=[];
   if(!Array.isArray(L)){check(k,'weapons list',false,'none');continue;}
   for(const w of L.concat(f.pack||[]))if(!W[w])bad.push(w+' not in WEAPONS');
   check(k,'weapons list',!bad.length,bad.join(', '));if(bad.length)continue;
   const kOf=t=>L.filter(w=>W[w].kind===t),mk=kOf('melee'),gk=kOf('gun'),tk=kOf('throw');
   check(k,'no more than one of each kind',mk.length<2&&gk.length<2&&tk.length<2,L.join(','));
   // (the model: a blade or club and a gun each as the weapon's boxes, a gun beside a blade or club with a holster; an orb in
   // the left hand for grenades or a spell)
   const want=bare+mk.concat(gk).reduce((s,w)=>s+nBox(w),0)+(mk.length&&gk.length?1:0)+(tk.length||f.spell?1:0),got=nodes(fo(f));
   check(k,'model carries its weapons',got===want,'parts '+(got-bare)+' over a bare goblin, its weapons make '+(want-bare));
   // (the AI: each gun has how it's used (gun) and is aimed inside its range; grenades have bomb and are thrown; up close
   // it strikes with its blade or club, or a rifle by its butt, at the weapon's numbers, else with fists of its own)
   if(gk.length){const w=W[gk[0]];let aims=false;
     if(f.gun){E('tenvClear()');quiet();put(X0,Z0);for(let a=-60;a<=6;a++)for(let b=-6;b<=6;b++)for(let y=0;y<8;y++)E('setRaw')(X0+a,G0+1+y,Z0+b,0);const q=E('freeFoe')('militia',24);E('foeSpawn')(q,'militia',null,0);q.vy=0;q.stun=0;q.act=null;
       const d=Math.min(w.range-2,Math.max(f.gun.near+2,10));q.pos.set(P.pos.x-d,P.pos.y,P.pos.z);q.heading=Math.PI/2;q.aim=0;q.aimK=null;q.gunCD=0;q.bombCD=99;
       E('foeRanged')(q,P,d,0,0.01,Object.assign({},f,{bomb:null}));aims=q.aimK==='gun';q.state='wait';q.root.visible=false;q.aim=0;}
     check(k,'AI fires its '+gk[0],!!f.gun&&aims,f.gun?'never aimed':'no gun entry: how it uses it');}
   if(tk.length){let thrown=false;
     if(f.bomb){E('tenvClear()');quiet();put(X0,Z0);const q=E('freeFoe')('militia',24);E('foeSpawn')(q,'militia',null,0);q.vy=0;q.stun=0;q.act=null;
       const d=(f.bomb.near+f.bomb.far)/2;q.pos.set(P.pos.x-d,P.pos.y,P.pos.z);q.heading=Math.PI/2;q.aim=0;q.aimK=null;q.gunCD=99;q.bombCD=0;
       E('foeRanged')(q,P,d,0,0.01,Object.assign({},f,{gun:null}));thrown=q.aimK==='bomb';q.state='wait';q.root.visible=false;q.aim=0;}
     check(k,'AI throws its '+tk[0],!!f.bomb&&thrown,f.bomb?'never wound up':'no bomb entry: how it throws');}
   if(k!=='civilian'){const s=so(f),m=mk[0]||L.find(w=>W[w].butt),sw=m&&(W[m].kind==='melee'?W[m]:W[m].butt);
     check(k,'strikes up close with '+(m||'fists'),m?s.dmg===sw.dmg&&s.every===sw.every&&!!f.hitBy&&s.cause===f.hitBy:!!(f.melee&&f.melee.dmg>0&&f.melee.every>0&&f.melee.cause)&&s===f.melee,JSON.stringify(s));}
   // (what it drops: the first weapon a goblin can wield that's dropped, and grenades if it carries any)
   {Math.random=()=>0.9;const d=gg({arms:f});Math.random=R0;const wd=L.find(w=>W[w].drop&&!W[w].stack&&E('GOB_WPN')[w])||null;
    check(k,'drops its weapons',d.wpn===wd&&(d.gren>0)===(L.concat(f.pack||[]).includes('grenade')),'drops '+d.wpn+' and '+d.gren+' grenades');}
   // (and the Dev tab plays each: a shoot for a gun, a throw for grenades, an attack up close)
   {const D=devK.get(f),a=D?D.anims:[];check(k,'Dev tab plays its weapons',!!D&&(!gk.length||a.includes('shoot'))&&(!tk.length||a.includes('throw'))&&(k==='civilian'||a.includes('attack')),D?a.join(','):'not listed');}}
 flush('weapons lists ('+kinds.map(([k,f])=>k+': '+(f.weapons||[]).join('+')).join('; ')+')');}

// ==== one weapon, one set of numbers: nothing about a weapon set anywhere but WEAPONS, and the same in either hand ====
{const F=E('FOES'),W=E('WEAPONS'),GF=E('GOB_FOES'),COP=GF.police,STAT=['dmg','range','every','cd','breaks','r','reach','R','fuse','refire','hp'];
 // (what a shooter may say for itself: how it uses the weapon, never how hard it hits, how far, how often or what it breaks)
 const OWN={gun:['near','aim','cause'],bomb:['near','far','every','cause']};
 const own=(who,f)=>{for(const n of ['gun','bomb']){const o=f[n];if(!o)continue;const extra=Object.keys(o).filter(x=>!OWN[n].includes(x));
     check(who,'no '+n+' stats of its own',!extra.length&&!Array.isArray(o),Array.isArray(o)?'an array of numbers':extra.join(','));}
   if(E('foeMeleeK')(f))check(who,'no melee stats of its own',!f.melee,'melee '+JSON.stringify(f.melee));};
 for(const k in F)own(k,F[k]);for(const k in GF)own(k,GF[k]);
 for(const k in W){const w=W[k],bad=[];if(w.npc)for(const n of Object.keys(w.npc))if(STAT.includes(n)||n==='gun')bad.push('npc.'+n);
   if(w.player)for(const n of STAT)if(w.player[n]!==undefined&&w.player[n]!==(n==='cd'?w.every??w.player.cd:w[n]))bad.push('player.'+n+' '+w.player[n]+' vs '+w[n]);
   check('weapon '+k,'one set of numbers',!bad.length,bad.join(', '));}
 flush('weapon stats only in WEAPONS ('+Object.keys(W).join(', ')+'; FOES, GOB_FOES)');
 // the same gun in an enemy's hands: a round that lands does the weapon's damage, it starts shooting inside the weapon's
 // range and not past it, and a round into a wall breaks it as Gnash's do (Math.random pinned low: every chance comes off)
 for(const [who,f] of [['militia (rifle)',F.militia],['police (handgun)',COP]]){const w=W[E('foeGunK')(f)];
   E('tenvClear()');quiet();put(X0,Z0);for(let a=-60;a<=6;a++)for(let b=-6;b<=6;b++)for(let y=0;y<8;y++)E('setRaw')(X0+a,G0+1+y,Z0+b,0);P.hp=20;
   const g={pos:new V3(X0-20,GY,Z0),heading:Math.PI/2,id:'t'};pin();E('foeShoot')(g,P,f);unpin();
   check(who,'damage as the weapon',20-P.hp===w.dmg,'took '+(20-P.hp)+', the weapon does '+w.dmg);P.hp=20;
   const q=E('freeFoe')('militia',24);E('foeSpawn')(q,'militia',null,0);q.vy=0;q.stun=0;q.act=null;q.wet=false;
   const tries=d=>{q.pos.set(P.pos.x-d,P.pos.y,P.pos.z);q.heading=Math.PI/2;q.aim=0;q.aimK=null;q.gunCD=0;q.bombCD=99;E('foeRanged')(q,P,d,0,0.01,Object.assign({},f,{bomb:null}));return q.aimK==='gun';};
   const inR=tries(w.range-2),outR=tries(w.range+2);q.state='wait';q.root.visible=false;q.aim=0;
   check(who,'range as the weapon',inR&&!outR,'aims at '+(w.range-2)+': '+inR+', at '+(w.range+2)+': '+outR);
   const bx=X0-8;for(let b=-2;b<=2;b++)for(let y=0;y<4;y++)E('setRaw')(bx,G0+1+y,Z0+b,3);
   let gone=0;pin();E('foeShoot')(g,P,f);unpin();run(0.1);for(let b=-2;b<=2;b++)for(let y=0;y<4;y++)if(!E('solidAt')(bx,G0+1+y,Z0+b))gone++;
   check(who,'breaks blocks as the weapon',(gone>0)===!!w.breaks,'blocks broken '+gone+', the weapon breaks: '+!!w.breaks);
   for(let b=-2;b<=2;b++)for(let y=0;y<4;y++)E('setRaw')(bx,G0+1+y,Z0+b,0);P.hp=20;}
 // up close: each strikes with what it carries, at that weapon's damage and rate (a rifle by its butt)
 {const so=E('strikeOf'),c=so(GF.goblin),d=so(GF.cultist),t=so(F.thief),m=so(F.militia);
  check('street goblin','club as the weapon',c.dmg===W.club.dmg&&c.every===W.club.every,JSON.stringify(c));
  check('cultist','dagger as the weapon',d.dmg===W.dagger.dmg&&d.every===W.dagger.every,JSON.stringify(d));
  check('thief','dagger as the weapon',t.dmg===W.dagger.dmg&&t.every===W.dagger.every,JSON.stringify(t));
  check('militia','rifle butt as the weapon',m.dmg===W.rifle.butt.dmg&&m.every===W.rifle.butt.every,JSON.stringify(m));}
 // the grenade: an enemy's carries the weapon's fuse, blast and damage
 {E('tenvClear()');quiet();put(X0,Z0);const n0=E('SHOTS').length;const g={pos:new V3(X0-12,GY,Z0),heading:Math.PI/2,id:'t'};E('foeThrow')(g,P,F.prepper.bomb);
  const S=E('SHOTS')[E('SHOTS').length-1],G2=W.grenade;check('prepper','grenade as the weapon',!!S&&S.fuse===G2.fuse&&S.R===G2.R&&S.dmg===G2.dmg,S?('fuse '+S.fuse+' R '+S.R+' dmg '+S.dmg):'none thrown');if(S)S.live=false;}
 flush('the same weapon in the hands of an enemy as of a player');}

// (the street left as it was)
for(const k of EXPECTED)if(!seen.has(k)){console.log('  (expected gap not checked any more: '+k+')');}
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
console.log(newGaps?'GUARDS: '+newGaps+' NEW GAP(S)':'GUARDS: no new gaps','| expected gaps',EXPECTED.size-fixed,'| fixed',fixed);
process.exit(0);
`);
