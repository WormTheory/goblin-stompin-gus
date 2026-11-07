// ---- car body physics: sits on four wheels, tips over edges, falls into pits, lands hard ----
function carPhysics(c,dt){
  const s=Math.sin(c.heading),k=Math.cos(c.heading),wx=c.hx*1.1,wz=c.hz-0.36;
  // on a ramp the wheels ride the slope (a long truck's sit well above or below its middle); anywhere else a car won't climb a ledge
  const onRamp=rampUnder(c.pos.x,c.pos.z,c.pos.y+0.5)||rampUnder(c.pos.x+s*wz,c.pos.z+k*wz,c.pos.y+0.5)||rampUnder(c.pos.x-s*wz,c.pos.z-k*wz,c.pos.y+0.5);
  const slope=onRamp?wz*0.5+0.2:0,reach=c.pos.y+0.4+slope;
  // a wheel inside a wall gives no support (it doesn't hold the car up mid-air)
  const sup=(a,b)=>{const v=supportAt(c.pos.x+a*k+b*s,c.pos.z-a*s+b*k,reach);return v===null?-1e9:v;};
  const fl=sup(wx,wz),fr=sup(-wx,wz),bl=sup(wx,-wz),br=sup(-wx,-wz),ce=sup(0,0);
  if(Math.max(fl,fr,bl,br,ce)<-1e8){c.grounded=true;c.vy=0;return;}
  const cl=v=>Math.max(v,c.pos.y-6);
  // (just up a step, front wheels first: the back ones still down below hold it up too, till they're up as well)
  const lip=c.stepT>0?1.15:0;if(lip)c.stepT-=dt;
  const near=v=>v>=c.pos.y-(onRamp?slope+0.9:0.35+lip);
  const frontOK=near(fl)||near(fr),backOK=near(bl)||near(br);
  const comOK=near(ce)||(frontOK&&backOK);
  let top=Math.max(fl,fr,bl,br,ce);
  // on a slope the body sits between its axles (the middle of the car, not its highest wheel), and a car already
  // rolling down one stays stuck to it instead of falling a little and landing every frame
  // (a wheel up on a kerb or a ramp's side wall doesn't count: on a slope a wheel is never more than half its distance from the middle above or below the ground there)
  // (and it rides on the middle of each axle there: a wheel catching the ramp's side wall mustn't bounce the whole car)
  const ceR=near(ce)?ce:c.pos.y,h=v=>near(v)&&(!onRamp||Math.abs(v-ceR)<=wz*0.5+0.35)?v:c.pos.y,fA=onRamp?h(sup(0,wz)):Math.max(h(fl),h(fr)),bA=onRamp?h(sup(0,-wz)):Math.max(h(bl),h(br));
  if(onRamp&&frontOK&&backOK)top=Math.max(near(ce)?ce:-1e9,(fA+bA)/2);
  const stick=c.grounded&&c.vy<=0.5&&comOK&&c.pos.y-top<(onRamp?0.9:0.3);
  let tp=0,tr=0;
  if(comOK&&(c.vy<=0&&c.pos.y<=top+0.03||stick)){
    // resting: follow the ground, but don't climb
    c.grounded=true;c.vy=0;
    if(onRamp){const d=top-c.pos.y,m=(Math.abs(c.speed)*0.65+1.8)*dt;if(d<slope+0.9)c.pos.y+=Math.max(-m,Math.min(m,d));}   // (no quicker than a slope climbs at this speed)
    else if(top-c.pos.y<0.3)c.pos.y+=(top-c.pos.y)*Math.min(1,dt*14);
    tp=Math.atan2(bA-fA,2*wz);tr=onRamp?0:Math.atan2((h(fl)+h(bl))/2-(h(fr)+h(br))/2,2*wx);
    c.spinP*=0.5;c.spinR*=0.5;
  } else {
    // falling: gravity, keep momentum, nose (or side) dips toward the drop and the car slides off the lip
    const was=c.grounded;c.grounded=false;
    c.vy-=25*dt;c.pos.y+=c.vy*dt;
    tp=Math.max(-1.2,Math.min(1.2,Math.atan2((cl(bl)+cl(br))/2-(cl(fl)+cl(fr))/2,2*wz)*1.6));
    tr=Math.max(-1.2,Math.min(1.2,Math.atan2((cl(fl)+cl(bl))/2-(cl(fr)+cl(br))/2,2*wx)*1.6));
    if(was&&!comOK){const lx=((fl+bl)-(fr+br))>0?-1:1,lz=((bl+br)-(fl+fr))>0?1:-1;const sx=(Math.abs(fl+fr-bl-br)>0.3?lz:0),sr=(Math.abs(fl+bl-fr-br)>0.3?lx:0);c.kv.x+=(sr*k+sx*s)*2.5;c.kv.z+=(-sr*s+sx*k)*2.5;}
    const land=supportAt(c.pos.x,c.pos.z,c.pos.y+0.4);
    // with its middle over the hole, the wheels still up on the lip don't hold it
    const floor=comOK?Math.max(land===null?-1e9:land,fl,fr,bl,br):(land===null?-1e9:land);
    if(c.vy<0&&c.pos.y<=floor){
      const hit=-c.vy;c.pos.y=floor;c.vy=0;
      if(hit>7){thud(Math.min(0.8,hit/25));puff(c.pos.x,c.pos.y,c.pos.z,8,0x8c8a84,1.2);clang();addShake(Math.min(0.3,hit/60),c.pos.x,c.pos.z,20);}
      if(hit>9)damageCar(c,(hit-9)*2.2,undefined,'acc');
      if(hit>4&&!onRamp)c.speed*=0.5;   // a real drop costs speed; rolling down a ramp's little steps doesn't
    }
  }
  // explosions and big stomps can set it spinning
  c.pitch+=c.spinP*dt;c.roll+=c.spinR*dt;c.spinP*=Math.exp(-dt*1.5);c.spinR*=Math.exp(-dt*1.5);
  const rate=Math.min(1,dt*(c.grounded?8:3));
  c.pitch+=(tp-c.pitch)*rate;c.roll+=(tr-c.roll)*rate;
}
// a car that's been going nowhere tries another way: off an exit it can't get down, back onto the motorway; on the
// motorway, over into the other lane; in town, back up and turn round
function carReroute(c){
  c.reroutes=(c.reroutes||0)+1;
  if(c.path){if(c.prevHw&&Math.abs(c.pos.y-c.prevHw.y)<1.2){c.hw=c.prevHw;c.prevHw=null;c.path=null;c.pathBlk=0;}return;}
  if(c.hw){const H=c.hw,k=Math.floor((H.lane+3)/CELL),off=H.lane-k*CELL,o2={'5.5':8.5,'8.5':5.5,'-0.5':2.5,'2.5':-0.5}[String(off)];if(o2!==undefined)H.lane=k*CELL+o2;return;}
  if(c.rt){c.rt.lane=c.rt.lane<3?4.5:1.5;return;}
  c.makeWay=1.1;c.jamT=0;c.waitK=null;c.passK=null;
}
function launchCar(c,up,dir,spin){
  if(c.isTrain)return;
  if(!c.alive)return;if(BLAME!=='acc')c.pBlameT=playTime;c.vy=Math.max(c.vy,up);c.grounded=false;
  if(dir){const h=Math.hypot(dir.x,dir.z)||1;c.kv.x+=dir.x/h*up*0.6;c.kv.z+=dir.z/h*up*0.6;}
  c.spinP+=(Math.random()-.5)*spin;c.spinR+=(Math.random()-.5)*spin;
}
// could any player see this spot right now? (inside their view cone, short of the fog, not hidden behind buildings)
function visibleToAny(x,y,z){
  const fogFar=viewFar();
  for(const p of players){
    if(!p.active)continue;const c=p.camera.position,dx=x-c.x,dy=y-c.y,dz=z-c.z,d=Math.hypot(dx,dy,dz);
    if(d>fogFar)continue;if(d<6)return true;
    const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
    if((dx*fx+dy*fy+dz*fz)/d<0.38)continue;
    let blocked=false;const n=Math.ceil(d/0.6);
    for(let i=1;i<n;i++){const t=i/n;if(solidAt(Math.floor(c.x+dx*t),Math.floor(c.y+dy*t),Math.floor(c.z+dz*t))){blocked=true;break;}}
    if(!blocked)return true;
  }
  return false;
}
// a street (running away from junction ix,iz in direction d) that runs past a destroyed block, on either side
function segRuinedA(ix,iz,ax){return ax===0?mapDead(ix-1,iz)||mapDead(ix,iz):mapDead(ix,iz-1)||mapDead(ix,iz);}
function segRuined(ix,iz,d){return d===0?segRuinedA(ix,iz,0):d===1?segRuinedA(ix,iz,1):d===2?segRuinedA(ix,iz-1,0):segRuinedA(ix-1,iz,1);}
function spawnTraffic(c){
  const al=players.filter(p=>p.active);if(!al.length)return false;
  const p=al[Math.floor(Math.random()*al.length)];
  for(let k=0;k<20;k++){
    // spawn out in the haze (close in only at the very start, so the streets aren't empty)
    // out in the haze, or closer in where buildings hide the spot (keeps traffic dense at long view distances)
    const far=viewFar(),hazeMin=Math.max(30,far*0.72),rMin=playTime<2?30:Math.min(hazeMin,36),rMax=Math.min(Math.max(hazeMin+12,far*0.92),150);
    const a=Math.random()*Math.PI*2,r=rMin+Math.random()*(rMax-rMin);
    const x=p.pos.x+Math.cos(a)*r,z=p.pos.z+Math.sin(a)*r;
    const alongZ=Math.random()<0.5;
    c.dir=alongZ?(Math.random()<.5?0:2):(Math.random()<.5?1:3);
    let px,pz;
    if(alongZ){px=Math.floor(x/CELL)*CELL+(c.dir===0?LANE_A:LANE_B);pz=Math.floor(z/CELL)*CELL+ROADW+1+Math.random()*(CELL-ROADW-2);}
    else{pz=Math.floor(z/CELL)*CELL+(c.dir===1?LANE_B:LANE_A);px=Math.floor(x/CELL)*CELL+ROADW+1+Math.random()*(CELL-ROADW-2);}
    if(groundAt(px,pz,G+3)!==G+1)continue;
    if(superPart(Math.floor(px),Math.floor(pz))&&superPart(Math.floor(px),Math.floor(pz))!=='road')continue;
    if(!segOpen(Math.floor(px/CELL),Math.floor(pz/CELL),alongZ?0:1))continue;
    if(!c.police&&segRuinedA(Math.floor(px/CELL),Math.floor(pz/CELL),alongZ?0:1))continue;   // (not among the ruins)
    if(cars.some(o=>o!==c&&o.alive&&Math.hypot(o.pos.x-px,o.pos.z-pz)<7))continue;
    if(players.some(q=>q.active&&Math.hypot(q.pos.x-px,q.pos.z-pz)<20))continue;
    if(playTime>=2&&Math.hypot(px-p.pos.x,pz-p.pos.z)<hazeMin&&visibleToAny(px,G+2,pz))continue;
    if(!c.police)setVeh(c,pickVeh('street'));
    c.driver=makeDriver(false);
    c.path=null;c.hw=null;c.rt=null;c.leaving=false;c.rampKey=null;
    c.pos.set(px,G+1,pz);c.kv.set(0,0,0);c.heading=DIRH[c.dir];c.speed=6;c.hp=30;c.alive=true;c.hunter=false;c.lastInter=-1;c.hurt=0;c.vy=0;c.reverseT=0;c.stuckT=0;c.pitch=0;c.roll=0;c.spinP=0;c.spinR=0;c.grounded=true;
    c.paint.emissive.setHex(0);c.g.visible=true;return true;
  }
  return false;
}
// who's to blame: damage counts as the hippos' doing unless it's marked an accident ('acc'), or happens while an
// accident is playing out (BLAME==='acc': a wreck exploding, the blast it sets off, the fire it leaves). A car that
// a hippo hit or threw in the last few seconds is still theirs when it then crashes.
let BLAME=null;const ACCIDENT={name:'A traffic accident'};
function withBlame(b,f){const prev=BLAME;BLAME=b;try{return f();}finally{BLAME=prev;}}
const carIsPlayers=c=>c.pBlameT!==undefined&&playTime-c.pBlameT<8;
function damageCar(c,n,dir,src){if(c.isTrain){trainHit(c.T,n,dir,c.i);return;}if(!c.alive)return;dmgPop(c.pos.x,c.pos.y+(c.hy||1.4)+0.3,c.pos.z,n,'#ffb04a');if(!(src==='acc'||(src===undefined&&BLAME==='acc')))c.pBlameT=playTime;c.hp-=n;c.hurt=0.1;if(dir){const h=Math.hypot(dir.x,dir.z);if(h>0.05){const kb=Math.min(9,2+n*0.3);c.kv.x+=dir.x/h*kb;c.kv.z+=dir.z/h*kb;}}if(c.hp<=0)explodeCar(c);}
// explosion effects pools
const debris=[];let debrisIdx=0;
const DEB_SIZES=[[1.0,0.5,1.6],[0.9,0.4,1.2],[1.6,0.15,1.0],[0.8,0.5,0.9],[0.32,0.72,0.72],[0.32,0.72,0.72],[0.32,0.72,0.72],[0.32,0.72,0.72],[0.8,0.35,0.7],[1.2,0.1,0.8],[2.0,0.18,0.15],[0.6,0.4,0.6]];
const DEB_PAINTED=[1,1,1,1,0,0,0,0,0,0,0,1];
for(let s=0;s<3;s++)DEB_SIZES.forEach((sz,i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sz[0],sz[1],sz[2]),new THREE.MeshLambertMaterial({color:[0,0,0,0,CARC.tire,CARC.tire,CARC.tire,CARC.tire,CARC.glass,CARC.stripe,CARC.bumper,0][i]}));m.visible=false;scene.add(m);debris.push({m,v:new V3(),spin:new V3(),life:0,painted:DEB_PAINTED[i]});});
const blasts=[];
for(let i=0;i<3;i++){const pair=[0xff8a2a,0xffd75a].map(col=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:col,transparent:true,fog:false}));m.visible=false;scene.add(m);return m;});blasts.push({m:pair,t:0});}
let blastIdx=0;
// a fireball's flash, a blast of t seconds at scale s (one function, so a guest playing online sees the same ones)
function blastFx(x,y,z,t,s){const bl=blasts[blastIdx++%blasts.length];bl.t=t;bl.s=s;for(const f of bl.m){f.position.set(x,y,z);f.visible=true;}}
const wrecks=[];
