// ---- the compounds' people (see sitePeople and the guards' venue): three kinds of enemy, each from its own pool ----
// What they carry is their weapons list, keys in WEAPONS (weapons.js; see GOB_FOES there for what reads it), and each
// weapon's damage, range, rate of fire and the rest are the weapon's, the same as when Gnash has it. What's theirs is how
// they use them: gun, {near: the shortest range they'll shoot at, aim: seconds aiming before each shot, cause}; bomb
// (grenades), {near, far: how far they'll throw, every: seconds between throws, from, to, cause}; held, the colour of
// the grenade in the hand winding up; hitBy, what it's called when their weapon kills up close; for the unarmed (an empty
// list), melee, their fists: {dmg, every, cause}; and pack, anything carried but never used (a soldier's spare grenade,
// dropped when he's killed). Each shot comes FOE_JIT or less later than the weapon's every, at random, so a squad
// doesn't fire as one
const FOES={
  thief:{name:'Thief',label:'Thief slain',tunic:0x18181c,pants:0x101012,hat:'bandana',hatc:0x0c0c0e,weapons:['dagger'],hp:3,spd:3.5,hitBy:'Stabbed by a thief',
    jobs:['Burglar','Cat burglar','Pickpocket','Fence','Safecracker','Lookout','Getaway runner','Second-storey man']},
  prepper:{name:'Prepper',label:'Prepper killed',tunic:0x7a6a4a,pants:0x3a3020,hat:'cap',hatc:0x5a4a2a,weapons:['rifle','grenade'],held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:2.6,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.7,cause:'Shot by a prepper'},bomb:{near:6,far:18,every:[7,11],cause:'Blown up by a grenade'},
    jobs:['Prepper','Doomsday prepper','Bunker quartermaster','Canned-goods hoarder','Off-grid survivalist','Water-filter enthusiast']},
  militia:{name:'Militiaman',label:'Militiaman killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,weapons:['rifle','grenade'],held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:2.8,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.55,cause:'Shot by the militia'},bomb:{near:6,far:24,every:[6,9],cause:'Blown up by a grenade'},
    jobs:['Militiaman','Weekend warrior','Self-styled colonel','Sentry','Rifleman','Camo enthusiast','Drill sergeant (unpaid)']},
  // (an airport's security officers, posted at the checkpoint in each terminal hall: no guns, but they'll tackle you)
  security:{name:'Security officer',label:'Security officer down',tunic:0x2a3550,pants:0x1c2233,hat:'cap',hatc:0x1c2233,weapons:[],hp:4,spd:3.3,melee:{dmg:1,every:1.0,cause:'Tackled by airport security',w:'Fists'},
    jobs:['Airport security officer','Bag screener','Checkpoint supervisor','Behaviour detection officer','Security dog handler (no dog)']},
  // (the aircraft carrier's crew: see carrier-crew.js)
  deckhand:{name:'Deckhand',label:'Deckhand killed',tunic:0xe0c020,pants:0x2a2e3a,hat:'cap',hatc:0xe0c020,weapons:[],hp:3,spd:3.4,melee:{dmg:1,every:1.0,cause:'Punched by a deckhand',w:'Fists'},
    jobs:['Aircraft handler','Catapult crewman','Plane captain','Fuel handler','Ordnanceman','Chock runner','Landing signal officer','Safety observer']},
  sailor:{name:'Sailor',label:'Sailor killed',tunic:0x3a5a8a,pants:0x22324a,hat:'cap',hatc:0xeef0f2,weapons:['rifle'],hp:4,spd:3.0,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.7,cause:'Shot by a sailor'},jobs:['Seaman','Boatswain\'s mate','Machinist\'s mate','Cook','Radioman','Fire controlman','Gunner\'s mate','Yeoman']},
  marine:{name:'Marine',label:'Marine killed',tunic:0x5a6a3a,pants:0x3a4428,hat:'hardhat',hatc:0x4a5630,weapons:['rifle','grenade'],held:[0.22,0.22,0.22,0x2a2a2a],hp:6,spd:3.2,hitBy:'Clubbed with a rifle butt',
    gun:{near:3,aim:0.5,cause:'Shot by a marine'},bomb:{near:6,far:20,every:[8,12],cause:'Blown up by a marine\'s grenade'},jobs:['Marine','Lance corporal','Sergeant of the guard','Sentry','Rifleman','Ship\'s guard']},
  // (the bases' soldiers, who crew the tanks and helicopters and come out of them on foot: see crews.js and carjack.js)
  soldier:{name:'Soldier',label:'Soldier killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,weapons:['rifle'],pack:['grenade'],hp:5,spd:3.0,
    hitBy:'Clubbed with a rifle butt',gun:{near:3,aim:0.5,cause:'Shot by a soldier'},jobs:['Tank crewman','Gunner','Driver','Corporal','Private first class','Helicopter pilot']}};
const FOE_JIT=0.4;   // (see above: the most a shot comes later than the weapon's every)
const foeMade={};
function freeFoe(k,cap=12){let g=goblins.find(o=>o.foeKind===k&&o.state==='wait');if(!g&&(foeMade[k]||0)<cap){addFoe(k);g=goblins[goblins.length-1];}return g||null;}
function addFoe(k){foeMade[k]=(foeMade[k]||0)+1;const F=FOES[k];
  makeGoblin(Object.assign(foeModelOpt(F),{tunic:F.tunic}),{special:true,foeKind:k,homeV:null,aim:0,aimK:null,gunCD:0,bombCD:0,hold:false});
}
// one of them out of the pool, dressed and alive; V is its compound (null for one spawned to fight straight away), i its post
function foeSpawn(g,k,V,i,look){
  const F=FOES[k],P=V&&V.posts[i];g.homeV=V;g.slot=i;g.post=P||null;g.hold=!!P&&P.y>G+3;   // (posted up a tower: it stays up there)
  g.hp=g.hpMax=F.hp;g.spd=F.spd;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.atk=1;g.detour=0;g.stuck=0;g.kv.set(0,0,0);g.stun=0;g.act=null;g.wt=null;g.indoor=false;g.alert=false;
  g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.employer=null;g.claim=null;g.trip=null;g.stUp=undefined;g.aim=0;g.gunCD=0.5+Math.random();g.bombCD=3+Math.random()*3;foeFresh(g);
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
// (F: its kind's entry, what it carries and how it uses its gun and grenades: FOES, or GOB_FOES.police for an officer)
// (a goblin armed afresh: a full magazine, nothing half done)
function foeFresh(g){g.mag=undefined;g.relT=0;g.burstN=0;g.mineCD=4+Math.random()*5;if(g.mineB)g.mineB.visible=false;}
// (its rounds left: a full magazine till it's fired any)
const foeMag=(g,W)=>g.mag===undefined?W.mag:g.mag;
function foeRanged(g,p,d,ddy,dt,F=foeOf(g)){
  g.gunCD-=dt;g.bombCD-=dt;g.mineCD=(g.mineCD??6)-dt;const gk=foeGunK(F),GW=gk&&F.gun&&WEAPONS[gk],aimW=GW&&GW.npc.pose,bomb=foeThrowK(F)&&F.bomb,mineK=foeMineK(F);
  // (how long it aims and the closest it'll fire at: its kind's own, or for a spell the spellbook's: conjuring time and
  // range are the weapon's, the same for a player goblin. spell: a fireball grows in the free hand as it's conjured)
  const aimT=GW&&(F.gun.aim??GW.cast),near=GW&&(F.gun.near??GW.near),spell=GW&&GW.kind==='spell',side=!!wpnOfKind(F.weapons,'melee');
  const face=r=>{let df=Math.atan2(p.pos.x-g.pos.x,p.pos.z-g.pos.z)-g.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;g.heading+=Math.max(-r*dt,Math.min(r*dt,df));};
  // reloading: stood still, the magazine changed (its look: the gun's npc.rl, strikes.js); given up if it's knocked about,
  // or for its blade or club if he's come in close (it'll finish another time)
  if(g.relT>0){
    if(!GW||g.stun>0||!playing||g.wet||side&&d<near){g.relT=0;return false;}
    g.relT-=dt;face(4);gobStrike(g,GW.npc.rl||'rlMag',2*(1-Math.max(0,g.relT)/g.relD));
    if(g.relT<=g.relD*0.5&&!g.relH){g.relH=true;wpnClack(gk,1);}
    if(g.relT<=0){g.relT=0;g.mag=GW.mag;g.gunCD=0.15;wpnClack(gk,2);}
    return true;}
  // the rest of a burst (an assault rifle's): held on him, a round every so often, each with its own small kick
  if(g.burstN>0){
    if(g.stun>0||!playing||g.wet){g.burstN=0;return false;}
    g.burstT-=dt;face(8);gobStrike(g,aimW,1+0.2*Math.min(1,1-Math.max(0,g.burstT)/GW.every));
    if(g.burstT<=0){foeShoot(g,p,F);g.mag=foeMag(g,GW)-1;g.burstN=g.mag>0?g.burstN-1:0;g.burstT=GW.every;
      if(!g.burstN){g.relS=0;g.relK=aimW;}}
    return true;}
  if(g.aim>0){
    if(g.stun>0||!playing||g.wet){g.aim=0;if(g.orb)g.orb.visible=false;if(g.mineB)g.mineB.visible=false;return false;}
    g.aim-=dt;face(8);
    // (shouldering the rifle, or raising the handgun in both hands, and holding it on him; or drawing the grenade back
    // behind the head: see strikes.js)
    if(g.aimK==='gun'){const k=1-Math.max(0,g.aim)/aimT;gobStrike(g,aimW,k);
      if(spell&&g.orb){g.orb.visible=true;g.orb.scale.setScalar(0.4+k*0.9);g.roles.orb.emissive.setHex(0xff5a00);}}   // (raised high as it grows, drawn back, hurled: strikes.js)
    else if(g.aimK==='mine'){const u=1-Math.max(0,g.aim)/FOE_PLANT;gobStrike(g,WEAPONS[mineK].npc.pose,u);if(g.mineB)g.mineB.visible=true;}   // (crouched, the mine set down with the free hand: strikes.js)
    else{g.orb.visible=true;gobStrike(g,'throw',1-Math.max(0,g.aim)/0.6);}
    if(g.aim<=0){g.relS=0;g.relK=g.aimK==='gun'?aimW:g.aimK==='mine'?WEAPONS[mineK].npc.pose:'throw';
      // (again once the weapon's ready, give or take: its every, less the next aim, which comes off it)
      if(g.aimK==='gun'){foeShoot(g,p,F);if(spell&&g.orb)g.orb.visible=false;g.gunCD=Math.max(0,GW.every-aimT)+Math.random()*(GW.npc.jit??FOE_JIT);
        // (a magazine runs down; an automatic carries on into a burst)
        if(GW.mag){g.mag=foeMag(g,GW)-1;const b=GW.npc.burst||1;if(b>1&&g.mag>0){g.burstN=Math.min(b,g.mag+1)-1;g.burstT=GW.every;}}}
      else if(g.aimK==='mine'){foeMine(g,F,mineK);if(g.mineB)g.mineB.visible=false;}
      else{foeThrow(g,p,bomb);const E2=bomb.every;g.bombCD=E2[0]+Math.random()*(E2[1]-E2[0]);g.orb.visible=false;}}
    return true;}
  // (just fired or thrown: the kick, or the arm coming through, and back down)
  const fol=(g.relS??9)<STRIKE_FT&&g.relK;if(fol)gobStrike(g,g.relK,1+g.relS/STRIKE_FT);
  const ready=playing&&g.stun<=0&&g.vy===0&&!g.wet&&!g.act;
  // (its magazine's empty: it reloads once the shot's follow-through is done, unless he's close enough for its blade or club)
  if(ready&&GW&&GW.mag&&g.mag<=0&&!(side&&d<near)){if(fol)return true;g.relT=g.relD=GW.reload;g.relH=false;wpnClack(gk,0);return true;}
  // (a landmine in his path, now and then: knelt and set down where it stands, for him to run on to)
  if(ready&&mineK&&g.mineCD<=0){if(d>4&&d<20&&Math.abs(ddy)<3){g.aim=FOE_PLANT;g.aimK='mine';return true;}g.mineCD=0.8;}
  if(ready&&bomb&&g.bombCD<=0){
    // (a bomb can go over a wall: they'll lob one without a clear view, if you're near enough)
    if(d>bomb.near&&d<bomb.far&&Math.abs(ddy)<10&&(cultSees(g,p)||d<bomb.far*0.7)){g.aim=0.6;g.aimK='bomb';return true;}g.bombCD=0.5;}
  if(ready&&GW&&g.gunCD<=0&&!(GW.mag&&foeMag(g,GW)<=0)){   // (never with nothing in it: see above)
    if(d>near&&d<GW.range&&Math.abs(ddy)<(GW.npc.dy??24)&&cultSees(g,p)){g.aim=aimT;g.aimK='gun';if(audio)wpnCue(gk,aimT);return true;}g.gunCD=0.3;}
  if(!fol)g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);
  if(g.hold){face(3);if(!fol)g.arm.rotation.x=-0.5;return true;}
  return false;
}
// a shot from the gun it carries (a rifle or a handgun, from its weapons list; or a fireball from a spellbook): there and back in the instant, a tracer
// to show it; more likely to miss the further off he is. The damage, and whether it breaks the block it hits, are the weapon's
function foeShoot(g,p,F){const gk=foeGunK(F),W=WEAPONS[gk];
  // (a spell: a fireball hurled overarm from just over its head at his chest, flat enough to clear a knee-high wall)
  if(W.kind==='spell'){const fx=Math.sin(g.heading),fz=Math.cos(g.heading);
    fireball(g.pos.x+fx*0.5,g.pos.y+1.6,g.pos.z+fz*0.5,p.pos.x,p.pos.y+1.5,p.pos.z,{W,by:g.id,cause:F.gun.cause});return;}
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.8,y0=g.pos.y+1.05,z0=g.pos.z+fz*0.8;
  const d=Math.hypot(p.pos.x-x0,p.pos.z-z0);
  // (a rocket launcher: a rocket off the shoulder that flies at him, aimed off a little more the further he is, and bursts
  // on whatever it meets, him included; all its numbers the weapon's. At a player in a vehicle it's locked on, and homes
  // in on wherever the vehicle goes, as a player's does: lock in WEAPONS)
  if(W.proj){const y1=g.pos.y+1.25,e=Math.min(2.5,d/25),a=Math.random()*6.283,tx=p.pos.x+Math.cos(a)*e*Math.random(),ty=p.pos.y+1+(Math.random()-0.5)*e,tz=p.pos.z+Math.sin(a)*e*Math.random(),
      L=Math.hypot(tx-x0,ty-y1,tz-z0)||1;
    shot({kind:W.proj,x:x0,y:y1,z:z0,vx:(tx-x0)/L*W.speed,vy:(ty-y1)/L*W.speed,vz:(tz-z0)/L*W.speed,grav:W.grav||0,fuse:W.range/W.speed+0.5,R:W.R,dmg:W.dmg,cause:F.gun.cause,by:g.id,crush:W.crush,vd:W.vd,bb:W.nuke,
      ...(W.lock&&p.drv?{chase:()=>p.drv&&p.state!=='dead'?{x:p.pos.x,y:p.pos.y+1,z:p.pos.z}:null,sp:W.lock.sp,turn:W.lock.turn}:{})});
    wpnCrack(gk);smoke(g.pos.x-fx*0.9,y1,g.pos.z-fz*0.9,3,0xbababa);return;}   // (and its backblast)
  // (a shotgun: its pellets, each its own round, each less likely to land the further he is)
  if(W.pellets){for(let i=0;i<W.pellets;i++)fireRound({x:x0,y:y0,z:z0,at:{x:p.pos.x,y:p.pos.y+1.2,z:p.pos.z},tgt:p,hit:Math.max(0.05,0.95-d/(W.npc.fall||14)),miss:[1.6,3.1,-0.45,1.5,1.6],step:0.4,
      pdmg:W.dmg,cause:F.gun.cause,id:g.id,breaks:W.breaks,snd:i?null:()=>wpnCrack(gk)});
    puff(x0,y0-0.1,z0,2,0xffe070,0.14);return;}
  // (a block in the way stops the round there: they may have taken aim before he ducked behind something. A handgun's
  // crack is sharper and shorter: WEAPONS)
  fireRound({x:x0,y:y0,z:z0,at:{x:p.pos.x,y:p.pos.y+1.2,z:p.pos.z},tgt:p,hit:Math.max(0.3,0.92-d/(W.npc.fall||60)),miss:[1.6,3.1,-0.45,1.5,1.6],step:0.4,
    pdmg:W.dmg,cause:F.gun.cause,id:g.id,breaks:W.breaks,snd:()=>wpnCrack(gk)});
  puff(x0,y0-0.1,z0,1,0xffe070,0.1);
}
// a bomb lobbed in an arc at where he's standing (give or take), fuse fizzing
function foeThrow(g,p,B6){const GR=WEAPONS.grenade;   // (its fuse, blast and damage are the grenade's, as Gnash's are)
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.4,y0=g.pos.y+1.6,z0=g.pos.z+fz*0.4;
  const a=Math.random()*6.283,e=Math.random()*1.8,tx=p.pos.x+Math.cos(a)*e,tz=p.pos.z+Math.sin(a)*e,ty=p.pos.y+0.3,D=Math.hypot(tx-x0,tz-z0),T=0.55+D/16,Gv=20;
  shot({kind:'grenade',x:x0,y:y0,z:z0,vx:(tx-x0)/T,vy:(ty-y0+0.5*Gv*T*T)/T,vz:(tz-z0)/T,grav:Gv,fuse:GR.fuse,R:GR.R,dmg:GR.dmg,cause:B6.cause,by:g.id,bounce:true,crush:GREN_CRUSH});
  if(audio)noise(0.2,0.04,500,'lowpass');
}

// a landmine set down where it stands (foeRanged's crouch), for a player to step on: the weapon's numbers, the cause
// its kind's (mine, in FOES) if it says, and it's a while before the next (its every, if it says)
const FOE_PLANT=0.9;   // (seconds crouching to set it down)
function foeMine(g,F,k){const M=F.mine||{},E2=M.every||[9,15],fx=Math.sin(g.heading),fz=Math.cos(g.heading);
  mineLay(g.pos.x+fx*0.55,g.pos.y,g.pos.z+fz*0.55,{side:'g',by:g.id,cause:M.cause||'Blown up by a landmine',k});
  g.mineCD=E2[0]+Math.random()*(E2[1]-E2[0]);}

// ---- a gun and a blade or club: any enemy whose weapons list has both (a police officer's club and handgun) draws the gun
// to aim and fire at range and puts it away (its model's stow: holstered, slung) for the blade or club up close. Which it
// does is foeRanged's: inside its kind's gun.near it won't shoot, so the chase closes in and strikes ----
// armed as kind F (an officer out of a police car, carjacked out of one, or the Testing Environment's: GOB_FOES.police),
// if its model carries F's gun (only a street goblin's does: goblinModel)
function foeArm(g,F){const gk=foeGunK(F);if(gk&&!(g.wkit&&g.wkit.k===gk))return;
  g.arms=F;g.aim=0;g.aimK=null;g.gunCD=0.4+Math.random()*0.8;g.bombCD=foeThrowK(F)?3+Math.random()*3:99;g.relK=null;foeFresh(g);}
// which is in hand: the gun while it's aimed and just after the shot, the blade or club the rest of the time, the gun put
// away whenever it isn't out. 0 the blade or club alone (its kind carries no gun), 1 blade or club with the gun put away,
// 2 the gun out (online guests are sent this: net-sync.js)
const wkitState=g=>{const k=foeGunK(foeOf(g));if(!k||!g.wkit||g.wkit.k!==k)return 0;
  return g.aim>0&&g.aimK==='gun'||g.relT>0||g.burstN>0||(g.relS??9)<STRIKE_FT&&g.relK===WEAPONS[k].npc.pose?2:1;};   // (and while it's reloading or firing a burst)
function wkitShow(K,n){
  if(K.shown===n)return;K.shown=n;   // (only when it changes: batDraw picks the change up)
  for(const m of K.melee)m.visible=n!==2;for(const m of K.gun)m.visible=n===2;for(const m of K.stow)m.visible=n===1;
}
// (in the game: put away once it's dead, or calmed down by the hostility setting with a shot half aimed)
const wkitTick=g=>{const n=wkitState(g);wkitShow(g.wkit,n===2&&(g.state!=='chase'||calmNow())?1:n);};
