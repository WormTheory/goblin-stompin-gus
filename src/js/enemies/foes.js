// ---- the compounds' people (see sitePeople and the guards' venue): three kinds of enemy, each from its own pool ----
// gun: [shortest, longest range, seconds to aim, cooldown range, damage]; bomb: [shortest, longest throw, cooldown range,
// fuse after it leaves the hand, blast radius, damage]
const FOES={
  thief:{name:'Thief',label:'Thief slain',tunic:0x18181c,pants:0x101012,hat:'bandana',hatc:0x0c0c0e,gear:'dagger',hp:3,spd:3.5,melee:[1,1.0,'Stabbed by a thief'],
    jobs:['Burglar','Cat burglar','Pickpocket','Fence','Safecracker','Lookout','Getaway runner','Second-storey man']},
  prepper:{name:'Prepper',label:'Prepper killed',tunic:0x7a6a4a,pants:0x3a3020,hat:'cap',hatc:0x5a4a2a,gear:'rifle',held:[0.12,0.34,0.12,0x8a8a90],hp:5,spd:2.6,melee:[1,1.4,'Clubbed with a rifle butt'],
    gun:[3,42,0.7,[1.8,2.8],1,'Shot by a prepper'],bomb:[6,18,[7,11],2.2,3.4,3,'Blown up by a pipe bomb'],
    jobs:['Prepper','Doomsday prepper','Bunker quartermaster','Canned-goods hoarder','Off-grid survivalist','Water-filter enthusiast']},
  militia:{name:'Militiaman',label:'Militiaman killed',tunic:0x4a5a2a,pants:0x2a3018,hat:'hardhat',hatc:0x3a4a22,gear:'rifle',held:[0.22,0.22,0.22,0x3a4a22],hp:5,spd:2.8,melee:[1,1.3,'Clubbed with a rifle butt'],
    gun:[3,48,0.55,[1.3,2.2],1,'Shot by the militia'],bomb:[6,24,[6,9],1.6,3.2,3,'Blown up by a grenade'],
    jobs:['Militiaman','Weekend warrior','Self-styled colonel','Sentry','Rifleman','Camo enthusiast','Drill sergeant (unpaid)']}};
const foeMade={};
function freeFoe(k,cap=12){let g=goblins.find(o=>o.foeKind===k&&o.state==='wait');if(!g&&(foeMade[k]||0)<cap){addFoe(k);g=goblins[goblins.length-1];}return g||null;}
function addFoe(k){foeMade[k]=(foeMade[k]||0)+1;const F=FOES[k];
  const root=new THREE.Group();root.rotation.order='YXZ';
  const m=goblinModel(root,{club:false,gear:F.gear,held:F.held,tunic:F.tunic,shareGeo:true});
  goblins.push({snowU:m.snowU,root,legs:m.legs,head:m.head,arm:m.arm,armL:m.armL,mats:m.mats,roles:m.roles,acc:m.acc,orb:m.orb||null,pos:new V3(),kv:new V3(),stun:0,heading:0,vy:0,hp:4,state:'wait',t:0,phase:0,atk:1,hurt:0,sink:0,detour:0,detourH:0,stuck:0,civ:false,special:true,foeKind:k,homeV:null,aim:0,aimK:null,gunCD:0,bombCD:0,hold:false});
  root.visible=false;root.scale.setScalar(ES);   // (not added to the scene: batDraw draws it)
}
// one of them out of the pool, dressed and alive; V is its compound (null for one spawned to fight straight away), i its post
function foeSpawn(g,k,V,i){
  const F=FOES[k],P=V&&V.posts[i];g.homeV=V;g.slot=i;g.post=P||null;g.hold=!!P&&P.y>G+3;   // (posted up a tower: it stays up there)
  g.hp=g.hpMax=F.hp;g.spd=F.spd;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.atk=1;g.detour=0;g.stuck=0;g.kv.set(0,0,0);g.stun=0;g.act=null;g.wt=null;g.indoor=false;g.alert=false;
  g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.employer=null;g.claim=null;g.trip=null;g.stUp=undefined;g.aim=0;g.gunCD=0.5+Math.random();g.bombCD=3+Math.random()*3;
  g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=-0.5;g.armL.rotation.x=0;if(g.orb)g.orb.visible=false;
  const L={skin:pick(GPAL.skin),tunic:F.tunic,pants:F.pants,hat:F.hatc,acc:F.pants,acc2:0x111111,hair:0x1b1b1b,show:[F.hat],foe:k,hatType:F.hat,hatShown:F.hatc,h:0.9+Math.random()*0.25,w:0.92+Math.random()*0.16,hs:0.94+Math.random()*0.12};
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
function foeRanged(g,p,d,ddy,dt){
  const F=FOES[g.foeKind];g.gunCD-=dt;g.bombCD-=dt;
  const face=r=>{let df=Math.atan2(p.pos.x-g.pos.x,p.pos.z-g.pos.z)-g.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;g.heading+=Math.max(-r*dt,Math.min(r*dt,df));};
  if(g.aim>0){
    if(g.stun>0||!playing||g.wet){g.aim=0;if(g.orb)g.orb.visible=false;return false;}
    g.aim-=dt;face(8);
    if(g.aimK==='gun'){g.arm.rotation.x=-1.5;g.armL.rotation.x=-1.35;}
    else{const k=1-Math.max(0,g.aim)/0.6;g.orb.visible=true;g.armL.rotation.x=-0.6-2.3*Math.min(1,k*1.5);g.arm.rotation.x=-0.5;}
    if(g.aim<=0){
      if(g.aimK==='gun'){foeShoot(g,p,F.gun);g.gunCD=F.gun[3][0]+Math.random()*(F.gun[3][1]-F.gun[3][0]);}
      else{foeThrow(g,p,F.bomb);g.bombCD=F.bomb[2][0]+Math.random()*(F.bomb[2][1]-F.bomb[2][0]);g.orb.visible=false;g.armL.rotation.x=-1.0;}}
    return true;}
  const ready=playing&&g.stun<=0&&g.vy===0&&!g.wet&&!g.act;
  if(ready&&F.bomb&&g.bombCD<=0){
    // (a bomb can go over a wall: they'll lob one without a clear view, if you're near enough)
    if(d>F.bomb[0]&&d<F.bomb[1]&&Math.abs(ddy)<10&&(cultSees(g,p)||d<F.bomb[1]*0.7)){g.aim=0.6;g.aimK='bomb';return true;}g.bombCD=0.5;}
  if(ready&&F.gun&&g.gunCD<=0){
    if(d>F.gun[0]&&d<F.gun[1]&&Math.abs(ddy)<24&&cultSees(g,p)){g.aim=F.gun[2];g.aimK='gun';if(audio)tone('square',1400,1200,0.04,0.03);return true;}g.gunCD=0.3;}
  g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);
  if(g.hold){face(3);g.arm.rotation.x=-0.5;return true;}
  return false;
}
// a rifle shot: there and back in the instant, a tracer to show it; more likely to miss the further off he is
function foeShoot(g,p,G6){
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.8,y0=g.pos.y+1.05,z0=g.pos.z+fz*0.8;
  const d=Math.hypot(p.pos.x-x0,p.pos.z-z0),hit=!(p.dodge&&p.dodge.t<p.dodge.dur*0.85)&&Math.random()<Math.max(0.3,0.92-d/60);
  let tx=p.pos.x,ty=p.pos.y+1.2,tz=p.pos.z;
  if(!hit){const a=Math.random()*6.283,r=1.6+Math.random()*1.5;tx+=Math.cos(a)*r;tz+=Math.sin(a)*r;ty+=(Math.random()-0.3)*1.5;const k=1.6;tx=x0+(tx-x0)*k;ty=y0+(ty-y0)*k;tz=z0+(tz-z0)*k;}
  tracer(x0,y0,z0,tx,ty,tz);puff(x0,y0-0.1,z0,1,0xffe070,0.1);
  if(audio){noise(0.09,0.14,2600,'highpass');tone('square',220,90,0.06,0.04);}
  if(hit){const h=Math.hypot(tx-x0,tz-z0)||1;damagePlayer(p,G6[4],new V3(tx,ty,tz),new V3((tx-x0)/h,0.2,(tz-z0)/h),G6[5],g.id);}
}
// a bomb lobbed in an arc at where he's standing (give or take), fuse fizzing
function foeThrow(g,p,B6){
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.4,y0=g.pos.y+1.6,z0=g.pos.z+fz*0.4;
  const a=Math.random()*6.283,e=Math.random()*1.8,tx=p.pos.x+Math.cos(a)*e,tz=p.pos.z+Math.sin(a)*e,ty=p.pos.y+0.3,D=Math.hypot(tx-x0,tz-z0),T=0.55+D/16,Gv=20;
  shot({kind:g.foeKind==='prepper'?'pipe':'grenade',x:x0,y:y0,z:z0,vx:(tx-x0)/T,vy:(ty-y0+0.5*Gv*T*T)/T,vz:(tz-z0)/T,grav:Gv,fuse:B6[3],R:B6[4],dmg:B6[5],cause:B6[6],by:g.id,bounce:true});
  if(audio)noise(0.2,0.04,500,'lowpass');
}
