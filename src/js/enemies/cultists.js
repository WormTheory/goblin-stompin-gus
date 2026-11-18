// ---- cultists (see addCultist and the cult altars' venue) ----
const CULT_JOBS=['Cultist','Acolyte of the Altar','Candle-bearer','Chanting novice','Keeper of the sigil','High priest (self-appointed)','Ritual dagger polisher','Doom prophet','Hooded initiate'];
// a cultist out of the pool, dressed and alive; V is its altar (null for one spawned to fight straight away), i its place in the circle
function cultSpawn(g,V,i){
  g.homeV=V;g.slot=i;g.ring=V?i/V.n*Math.PI*2:0;
  g.hp=g.hpMax=4;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.atk=1;g.detour=0;g.stuck=0;g.kv.set(0,0,0);g.stun=0;g.act=null;g.wt=null;g.indoor=false;g.alert=false;
  g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.employer=null;g.claim=null;g.trip=null;g.stUp=undefined;g.aim=0;g.aimK=null;g.gunCD=1+Math.random();g.bombCD=99;
  g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=-0.5;g.armL.rotation.x=0;g.orb.visible=false;
  const L={skin:pick(GPAL.skin),tunic:CULT_ROBE,pants:0x1a0a0c,hat:CULT_HOOD,acc:0x2a0408,acc2:0x2a0408,hair:0x1b1b1b,show:[],cult:true,hatType:'hood',hatShown:CULT_HOOD,h:0.92+Math.random()*0.2,w:0.95+Math.random()*0.1,hs:0.95+Math.random()*0.1};
  applyLook(g,L,ES);g.id=makeIdentity(g,L);g.id.occ=pick(CULT_JOBS);
  return g;
}
// at the rite: shuffling round the altar facing it, arms raised and swaying with the chant
function cultCalm(g,dt){
  const V=g.homeV;g.ring+=dt*0.18;g.aim=0;g.orb.visible=false;
  const x=V.cx+Math.cos(g.ring)*CULT_RING,z=V.cz+0.5+Math.sin(g.ring)*CULT_RING,dx=x-g.pos.x,dz=z-g.pos.z,dd=Math.hypot(dx,dz);let moving=false;
  if(playing&&g.stun<=0&&dd>0.08){const st=Math.min(dd,(dd>1.5?2.4:1.2)*dt);
    if(gobGround(g.pos.x+dx/dd*0.45,g.pos.z+dz/dd*0.45,g.pos.y)-g.pos.y<=1.05){g.pos.x+=dx/dd*st;g.pos.z+=dz/dd*st;moving=true;g.phase+=dt*(dd>1.5?11:4);}}
  const want=dd>1.5?Math.atan2(dx,dz):Math.atan2(V.cx-g.pos.x,V.cz+0.5-g.pos.z);let df=want-g.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;g.heading+=Math.max(-5*dt,Math.min(5*dt,df));
  const ph=g.t*1.6+g.slot*1.3;g.arm.rotation.x=-2.7-0.25*Math.sin(ph);g.armL.rotation.x=-2.7-0.25*Math.sin(ph+0.6);
  return moving;
}
// can it see the hippo? (a straight line from its eyes to his middle, through no solid block)
function cultSees(g,p){
  const x0=g.pos.x,y0=g.pos.y+1.3,z0=g.pos.z,ex=p.pos.x-x0,ey=p.pos.y+1.2-y0,ez=p.pos.z-z0,n=Math.ceil(Math.hypot(ex,ey,ez)/0.5);
  for(let i=1;i<n;i++){const k=i/n;if(solidAt(x0+ex*k,Math.floor(y0+ey*k),z0+ez*k))return false;}return true;
}
// hunting: a fireball from range is its spellbook's, through foeRanged (foes.js), as any enemy's gun; a dagger up close
