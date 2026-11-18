// ---- the compounds' people (see sitePeople and the guards' venue): three kinds of enemy, each from its own pool ----
// What they carry is gear, a weapon in WEAPONS (weapons.js), and its damage, range, rate of fire and the rest are the
// weapon's, the same as when Gnash has it. What's theirs is how they use it: gun, {near: the shortest range they'll
// shoot at, aim: seconds aiming before each shot, cause}; bomb (grenades), {near, far: how far they'll throw, every:
// seconds between throws, from, to, cause}; hitBy, what it's called when their weapon kills up close; and for the
// unarmed (gear null), melee, their fists: {dmg, every, cause}. Each shot comes FOE_JIT or less later than the weapon's
// every, at random, so a squad doesn't fire as one
const FOES={
  thief:{name:'Thief',label:'Thief slain',tunic:0x18181c,pants:0x101012,hat:'bandana',hatc:0x0c0c0e,gear:'dagger',hp:3,spd:3.5,hitBy:'Stabbed by a thief',
    jobs:['Burglar','Cat burglar','Pickpocket','Fence','Safecracker','Lookout','Getaway runner','Second-storey man']},
  prepper:{name:'Prepper',label:'Prepper killed',tunic:0x7a6a4a,pants:0x3a3020,hat:'cap',hatc:0x5a4a2a,gear:'rifle',held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:2.6,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.7,cause:'Shot by a prepper'},bomb:{near:6,far:18,every:[7,11],cause:'Blown up by a grenade'},
    jobs:['Prepper','Doomsday prepper','Bunker quartermaster','Canned-goods hoarder','Off-grid survivalist','Water-filter enthusiast']},
  militia:{name:'Militiaman',label:'Militiaman killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,gear:'rifle',held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:2.8,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.55,cause:'Shot by the militia'},bomb:{near:6,far:24,every:[6,9],cause:'Blown up by a grenade'},
    jobs:['Militiaman','Weekend warrior','Self-styled colonel','Sentry','Rifleman','Camo enthusiast','Drill sergeant (unpaid)']},
  // (an airport's security officers, posted at the checkpoint in each terminal hall: no guns, but they'll tackle you)
  security:{name:'Security officer',label:'Security officer down',tunic:0x2a3550,pants:0x1c2233,hat:'cap',hatc:0x1c2233,gear:null,hp:4,spd:3.3,melee:{dmg:1,every:1.0,cause:'Tackled by airport security',w:'Fists'},
    jobs:['Airport security officer','Bag screener','Checkpoint supervisor','Behaviour detection officer','Security dog handler (no dog)']},
  // (the aircraft carrier's crew: see carrier-crew.js)
  deckhand:{name:'Deckhand',label:'Deckhand killed',tunic:0xe0c020,pants:0x2a2e3a,hat:'cap',hatc:0xe0c020,gear:null,hp:3,spd:3.4,melee:{dmg:1,every:1.0,cause:'Punched by a deckhand',w:'Fists'},
    jobs:['Aircraft handler','Catapult crewman','Plane captain','Fuel handler','Ordnanceman','Chock runner','Landing signal officer','Safety observer']},
  sailor:{name:'Sailor',label:'Sailor killed',tunic:0x3a5a8a,pants:0x22324a,hat:'cap',hatc:0xeef0f2,gear:'rifle',held:[0.22,0.22,0.22,0x2a2a2a],hp:4,spd:3.0,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.7,cause:'Shot by a sailor'},jobs:['Seaman','Boatswain\'s mate','Machinist\'s mate','Cook','Radioman','Fire controlman','Gunner\'s mate','Yeoman']},
  marine:{name:'Marine',label:'Marine killed',tunic:0x5a6a3a,pants:0x3a4428,hat:'hardhat',hatc:0x4a5630,gear:'rifle',held:[0.22,0.22,0.22,0x2a2a2a],hp:6,spd:3.2,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.5,cause:'Shot by a marine'},bomb:{near:6,far:20,every:[8,12],cause:'Blown up by a marine\'s grenade'},jobs:['Marine','Lance corporal','Sergeant of the guard','Sentry','Rifleman','Ship\'s guard']},
  // (the bases' soldiers, who crew the tanks and helicopters and come out of them on foot: see crews.js and carjack.js)
  soldier:{name:'Soldier',label:'Soldier killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,gear:'rifle',held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:3.0,
    hitBy:'Clubbed with a rifle butt',gun:{near:3,aim:0.5,cause:'Shot by a soldier'},jobs:['Tank crewman','Gunner','Driver','Corporal','Private first class','Helicopter pilot']}};
const FOE_JIT=0.4;   // (see above: the most a shot comes later than the weapon's every)
const foeMade={};
function freeFoe(k,cap=12){let g=goblins.find(o=>o.foeKind===k&&o.state==='wait');if(!g&&(foeMade[k]||0)<cap){addFoe(k);g=goblins[goblins.length-1];}return g||null;}
function addFoe(k){foeMade[k]=(foeMade[k]||0)+1;const F=FOES[k];
  makeGoblin({club:false,gear:F.gear,held:F.held,tunic:F.tunic},{special:true,foeKind:k,homeV:null,aim:0,aimK:null,gunCD:0,bombCD:0,hold:false});
}
// one of them out of the pool, dressed and alive; V is its compound (null for one spawned to fight straight away), i its post
function foeSpawn(g,k,V,i,look){
  const F=FOES[k],P=V&&V.posts[i];g.homeV=V;g.slot=i;g.post=P||null;g.hold=!!P&&P.y>G+3;   // (posted up a tower: it stays up there)
  g.hp=g.hpMax=F.hp;g.spd=F.spd;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.atk=1;g.detour=0;g.stuck=0;g.kv.set(0,0,0);g.stun=0;g.act=null;g.wt=null;g.indoor=false;g.alert=false;
  g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.employer=null;g.claim=null;g.trip=null;g.stUp=undefined;g.aim=0;g.gunCD=0.5+Math.random();g.bombCD=3+Math.random()*3;
  g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=-0.5;g.armL.rotation.x=0;if(g.orb)g.orb.visible=false;
  const L={skin:pick(GPAL.skin),tunic:F.tunic,pants:F.pants,hat:F.hatc,acc:F.pants,acc2:0x111111,hair:0x1b1b1b,show:[F.hat],foe:k,hatType:F.hat,hatShown:F.hatc,h:0.9+Math.random()*0.25,w:0.92+Math.random()*0.16,hs:0.94+Math.random()*0.12};
  if(look)Object.assign(L,look);   // (a carrier's deck crew: their jerseys)
  if(k==='thief'&&Math.random()<0.6)L.show.push('eyepatch');if(k!=='thief'&&Math.random()<0.3)L.show.push('pouch');
  applyLook(g,L,ES);g.id=makeIdentity(g,L);g.id.occ=pick(F.jobs);
  return g;
}
// at its post: standing about, looking round now and then
function guardCalm(g,dt){
  const P=g.post;g.aim=0;if(g.orb)g.orb.visible=false;let moving=false;
  if(P&&playing&&g.stun<=0){const dx=P.x-g.pos.x,dz=P.z-g.pos.z,dd=Math.hypot(dx,dz);
    if(dd>0.3&&gobGround(g.pos.x+dx/dd*0.45,g.pos.z+dz/dd*0.45,g.pos.y)-g.pos.y<=1.05){const st=Math.min(dd,1.6*dt);g.pos.x+=dx/dd*st;g.pos.z+=dz/dd*st;moving=true;g.phase+=dt*7;g.heading=Math.atan2(dx,dz);}
    else g.heading=P.h0+Math.sin(g.t*0.3+g.slot)*1.2;}
  g.arm.rotation.x=-0.5;g.armL.rotation.x*=0.9;
  return moving;
}
// hunting: aim and fire, or wind up and throw, when there's a shot; true while busy at it (or posted up a tower), so it
// stays where it is
// (F: what it's armed with, gear, and how it uses it, gun and bomb; an officer's is COP_FOE, police-gun.js)
function foeRanged(g,p,d,ddy,dt,F=FOES[g.foeKind]){
  g.gunCD-=dt;g.bombCD-=dt;const aimW=F.pistol?'pistol':'aim',GW=F.gun&&WEAPONS[F.gear];
  const face=r=>{let df=Math.atan2(p.pos.x-g.pos.x,p.pos.z-g.pos.z)-g.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;g.heading+=Math.max(-r*dt,Math.min(r*dt,df));};
  if(g.aim>0){
    if(g.stun>0||!playing||g.wet){g.aim=0;if(g.orb)g.orb.visible=false;return false;}
    g.aim-=dt;face(8);
    // (shouldering the rifle, or raising the handgun in both hands, and holding it on him; or drawing the grenade back
    // behind the head: see strikes.js)
    if(g.aimK==='gun')gobStrike(g,aimW,1-Math.max(0,g.aim)/F.gun.aim);
    else{g.orb.visible=true;gobStrike(g,'throw',1-Math.max(0,g.aim)/0.6);}
    if(g.aim<=0){g.relS=0;g.relK=g.aimK==='gun'?aimW:'throw';
      // (again once the weapon's ready, give or take: its every, less the next aim, which comes off it)
      if(g.aimK==='gun'){foeShoot(g,p,F);g.gunCD=Math.max(0,GW.every-F.gun.aim)+Math.random()*FOE_JIT;}
      else{foeThrow(g,p,F.bomb);const E2=F.bomb.every;g.bombCD=E2[0]+Math.random()*(E2[1]-E2[0]);g.orb.visible=false;}}
    return true;}
  // (just fired or thrown: the kick, or the arm coming through, and back down)
  const fol=(g.relS??9)<STRIKE_FT&&g.relK;if(fol)gobStrike(g,g.relK,1+g.relS/STRIKE_FT);
  const ready=playing&&g.stun<=0&&g.vy===0&&!g.wet&&!g.act;
  if(ready&&F.bomb&&g.bombCD<=0){
    // (a bomb can go over a wall: they'll lob one without a clear view, if you're near enough)
    if(d>F.bomb.near&&d<F.bomb.far&&Math.abs(ddy)<10&&(cultSees(g,p)||d<F.bomb.far*0.7)){g.aim=0.6;g.aimK='bomb';return true;}g.bombCD=0.5;}
  if(ready&&F.gun&&g.gunCD<=0){
    if(d>F.gun.near&&d<GW.range&&Math.abs(ddy)<24&&cultSees(g,p)){g.aim=F.gun.aim;g.aimK='gun';if(audio)tone('square',1400,1200,0.04,0.03);return true;}g.gunCD=0.3;}
  if(!fol)g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);
  if(g.hold){face(3);if(!fol)g.arm.rotation.x=-0.5;return true;}
  return false;
}
// a shot from what it carries (F.gear, a rifle or a handgun): there and back in the instant, a tracer to show it; more
// likely to miss the further off he is. The damage, and whether it breaks the block it hits, are the weapon's
function foeShoot(g,p,F){const W=WEAPONS[F.gear];
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.8,y0=g.pos.y+1.05,z0=g.pos.z+fz*0.8;
  const d=Math.hypot(p.pos.x-x0,p.pos.z-z0);
  // (a block in the way stops the round there: they may have taken aim before he ducked behind something. A handgun's
  // crack is sharper and shorter: WEAPONS)
  fireRound({x:x0,y:y0,z:z0,at:{x:p.pos.x,y:p.pos.y+1.2,z:p.pos.z},tgt:p,hit:Math.max(0.3,0.92-d/60),miss:[1.6,3.1,-0.45,1.5,1.6],step:0.4,
    pdmg:W.dmg,cause:F.gun.cause,id:g.id,breaks:W.breaks,snd:()=>wpnCrack(F.gear)});
  puff(x0,y0-0.1,z0,1,0xffe070,0.1);
}
// a bomb lobbed in an arc at where he's standing (give or take), fuse fizzing
function foeThrow(g,p,B6){const GR=WEAPONS.grenade;   // (its fuse, blast and damage are the grenade's, as Gnash's are)
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.4,y0=g.pos.y+1.6,z0=g.pos.z+fz*0.4;
  const a=Math.random()*6.283,e=Math.random()*1.8,tx=p.pos.x+Math.cos(a)*e,tz=p.pos.z+Math.sin(a)*e,ty=p.pos.y+0.3,D=Math.hypot(tx-x0,tz-z0),T=0.55+D/16,Gv=20;
  shot({kind:'grenade',x:x0,y:y0,z:z0,vx:(tx-x0)/T,vy:(ty-y0+0.5*Gv*T*T)/T,vz:(tz-z0)/T,grav:Gv,fuse:GR.fuse,R:GR.R,dmg:GR.dmg,cause:B6.cause,by:g.id,bounce:true,crush:GREN_CRUSH});
  if(audio)noise(0.2,0.04,500,'lowpass');
}
