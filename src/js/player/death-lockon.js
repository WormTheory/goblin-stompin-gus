// ---- the hippo's body after death: a tumbling rigid box, launched according to what killed it ----
// (COM = centre of mass; the box spans the legs too, so 'upright' means standing on its feet)
const CORPSE_H=[0.75,0.8,1.6],CORPSE_ZC=0.1,CORPSE_COM=[0,0.8,0.2];
function corpseRot(C){
  const cy=Math.cos(C.yaw),sy=Math.sin(C.yaw),cx=Math.cos(C.pitch),sx=Math.sin(C.pitch),cz=Math.cos(C.roll),sz=Math.sin(C.roll);
  return[cy*cz+sy*sx*sz,-cy*sz+sy*sx*cz,sy*cx, cx*sz,cx*cz,-sx, -sy*cz+cy*sx*sz,sy*sz+cy*sx*cz,cy*cx];
}
function startCorpse(p,n,dir){
  const h=dir?Math.hypot(dir.x,dir.z)||1:1,dx=dir?dir.x/h:0,dz=dir?dir.z/h:0,hd=p.heading;
  const lat=dx*Math.cos(hd)-dz*Math.sin(hd),lon=dx*Math.sin(hd)+dz*Math.cos(hd),rnd=()=>Math.random()-0.5;
  const cause=!dir?'collapse':n>=4?(dir.y>=0.5?'blast':'car'):n>=2?'shove':'beaten';
  const C={x:p.pos.x+Math.sin(hd)*CORPSE_COM[2]*ES,y:p.pos.y+CORPSE_COM[1]*ES,z:p.pos.z+Math.cos(hd)*CORPSE_COM[2]*ES,vx:0,vy:0,vz:0,yaw:hd,pitch:0,roll:0,wy:0,wp:0,wr:0,delay:0,prefer:null,cause,rest:0,hits:0};
  const side=Math.abs(lat)>0.15?Math.sign(lat):(Math.random()<.5?1:-1);
  if(cause==='blast'){C.vx=dx*9;C.vz=dz*9;C.vy=10;C.wr=-side*(5+Math.random()*3);C.wp=lon*5+rnd()*4;C.wy=rnd()*4;}
  else if(cause==='car'){C.vx=dx*13;C.vz=dz*13;C.vy=5.5;C.wr=-lat*8+rnd()*2;C.wp=lon*6+rnd();C.wy=rnd()*3;}
  else if(cause==='shove'){C.vx=dx*7;C.vz=dz*7;C.vy=3.5;C.wr=-lat*5;C.wp=lon*2.5;C.wy=rnd()*1.5;}
  else{C.vx=dx*1.2;C.vz=dz*1.2;C.delay=0.45;C.prefer=-side*Math.PI/2;C.wr=-side*0.6;}   // legs give way, then it keels over away from the blow
  C.vx+=(p.mvx||0)*0.5;C.vz+=(p.mvz||0)*0.5;C.vy+=Math.max(0,p.vy||0)*0.5;
  p.corpse=C;p.root.rotation.order='YXZ';
}
function stepCorpse(p,dt){
  const C=p.corpse;if(!C)return;
  const R=corpseRot(C),hx=CORPSE_H[0]*ES,hy=CORPSE_H[1]*ES,hz=CORPSE_H[2]*ES;
  const minY=R[5]*CORPSE_ZC*ES-(Math.abs(R[3])*hx+Math.abs(R[4])*hy+Math.abs(R[5])*hz);
  if(C.delay>0){C.delay-=dt;}
  else{
    C.vy-=25*dt;
    const nx=C.x+C.vx*dt,nz=C.z+C.vz*dt;
    if(solidAt(Math.floor(nx),Math.floor(C.y),Math.floor(nz))){C.vx*=-0.3;C.vz*=-0.3;C.wy+=(Math.random()-.5)*2;}   // slams into a wall
    else{C.x=nx;C.z=nz;}
    C.y+=C.vy*dt;C.yaw+=C.wy*dt;C.pitch+=C.wp*dt;C.roll+=C.wr*dt;
  }
  const g=groundAt(C.x,C.z,C.y+0.5);
  let grounded=false;
  if(C.y+minY<=g+0.02){
    const impact=-C.vy;C.y=g-minY;grounded=C.vy<=0.5;   // still on its way up: not resting on the ground yet
    if(C.vy<0)C.vy=impact>3?impact*0.22:0;
    if(impact>3.5){C.hits++;thud(Math.min(0.9,0.25+impact/22));addShake(Math.min(0.5,impact/30),C.x,C.z,16);puff(C.x,g,C.z,6,0x8c8a84,0.7);
      blood(C.x,g+0.4,C.z,10+Math.round(impact),new V3(Math.random()-.5,0.6,Math.random()-.5));splat(C.x,C.z,g,0.4+impact*0.03);
      // tumbling bodies lose most of their spin on each hit
      C.wr*=0.55;C.wp*=0.55;C.wy*=0.6;}
    if(grounded){const f=Math.exp(-5*dt);C.vx*=f;C.vz*=f;}
  }
  if(grounded&&C.delay<=0){
    // settle onto a side, the back or the feet: whichever is nearest (or the side it was pushed toward)
    const q=Math.PI/2,tp=Math.round(C.pitch/Math.PI)*Math.PI;
    let tr=(C.prefer!==null&&Math.abs(C.roll)<q*0.98)?C.prefer:Math.round(C.roll/q)*q;
    // a dead hippo doesn't come to rest standing on its feet: tip it onto the nearer side
    if(Math.cos(tp)*Math.cos(tr)>0.5){tr+=(C.roll>=tr?1:-1)*q;C.prefer=tr;}
    C.wr+=((tr-C.roll)*16-C.wr*4.5)*dt;C.wp+=((tp-C.pitch)*16-C.wp*4.5)*dt;C.wy*=Math.exp(-4*dt);
    if(Math.abs(C.wr)+Math.abs(C.wp)<0.2&&Math.abs(C.vx)+Math.abs(C.vz)<0.3)C.rest+=dt;
  }
  // place the model: the root sits at the COM minus the rotated COM offset
  const ox=CORPSE_COM[0]*ES,oy=CORPSE_COM[1]*ES,oz=CORPSE_COM[2]*ES;
  p.root.rotation.set(C.pitch,C.yaw,C.roll);
  p.root.position.set(C.x-(R[0]*ox+R[1]*oy+R[2]*oz),C.y-(R[3]*ox+R[4]*oy+R[5]*oz),C.z-(R[6]*ox+R[7]*oy+R[8]*oz));
  p.pos.set(C.x,Math.max(g,C.y-oy),C.z);
  if(C.rest<0.3)p.pool.position.set(C.x,g+0.02+p.idx*0.005,C.z);
  return grounded;
}
// ---- lock-on (R3 / Q): pick a hostile goblin ahead, keep facing it, strafe around it ----
// what can be locked onto: any living goblin (hostile or civilian), any working car (they all have a goblin at the wheel),
// and the army's tanks and helicopters (unless someone's driving it)
const isCarT=t=>!!(t&&t.wheels),isMilT=t=>!!(t&&t.isMil);
const lockAlive=t=>isMilT(t)?!t.dead&&!t.drv:isCarT(t)?t.alive:t.state==='chase';
// the height of its middle (where the marker sits, and what a gun aims at)
const lockY=t=>isMilT(t)?t.pos.y+MIL[t.kind].hy*0.55:t.pos.y+(isCarT(t)?0.9:1.1);
// can the camera actually see it? march from the camera to the target's middle through the voxels; anything solid
// and opaque in between hides it (leaves and glass don't)
function seenFrom(a,bx,by,bz){
  const dx=bx-a.x,dy=by-a.y,dz=bz-a.z,L=Math.hypot(dx,dy,dz);if(L<0.01)return true;
  for(let t=0.4;t<L-0.6;t+=0.35){const k=t/L,b=get(Math.floor(a.x+dx*k),Math.floor(a.y+dy*k),Math.floor(a.z+dz*k));if(b&&BLOCK[b]&&BLOCK[b].solid&&!BLOCK[b].transparent)return false;}
  return true;
}
const lockSeen=(p,t)=>seenFrom(p.camera.position,t.pos.x,lockY(t),t.pos.z);
// hidden targets can still be picked, but only when nothing visible qualifies
const HIDDEN=1000;
function lockTargets(p,range){
  // (a tank or a helicopter is big enough to pick out twice as far off, and a helicopter well overhead)
  const out=[],add=(t,y,k=1)=>{const dx=t.pos.x-p.pos.x,dz=t.pos.z-p.pos.z,d=Math.hypot(dx,dz);if(d<0.6||d>range*k||Math.abs(y-p.pos.y)>(k>1?45:12))return;out.push({t,dx,dz,d,hid:lockSeen(p,t)?0:HIDDEN});};
  for(const g of goblins)if(g.state==='chase')add(g,g.pos.y);
  for(const c of cars)if(c.alive&&!c.parkPool&&c.drv!==p&&c.gnr!==p)add(c,c.pos.y);
  for(const V of venues.values())if(V.kind==='army')for(const M of V.mil)if(M.pos&&lockAlive(M))add(M,M.pos.y,2);
  return out;
}
function lockCandidate(p){
  const fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);let best=null,bs=1e9;
  for(const o of lockTargets(p,24)){
    const c=(o.dx*fx+o.dz*fz)/o.d;if(c<0.35)continue;   // within about 70 degrees of where you're looking
    const sc=o.d*(1.7-c)*(o.t.civ?1.15:1)+o.hid;if(sc<bs){bs=sc;best=o.t;}   // hostiles win a near tie
  }
  return best;
}
// the next target to the left (dir -1) or right (dir +1) of the current one, as seen on screen
function lockSwitch(p,dir){
  const fwd=p.cam.yaw+Math.PI,wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
  const sx=t=>-wrap(Math.atan2(t.pos.x-p.pos.x,t.pos.z-p.pos.z)-fwd);   // + is to the right on screen
  const cur=sx(p.lockT);let best=null,bs=1e9;
  for(const o of lockTargets(p,26)){
    if(o.t===p.lockT)continue;const s=sx(o.t);if(Math.abs(s)>1.75)continue;   // roughly in front
    const delta=(s-cur)*dir;if(delta<0.02)continue;
    const sc=delta+o.d*0.004+o.hid;if(sc<bs){bs=sc;best=o.t;}
  }
  if(best){setLock(p,best);return true;}
  tone('square',180,140,0.05,0.025);return false;
}
// the next target farther away (dir -1, stick up) or closer (dir +1, stick down), preferring ones in about the same direction
function lockSwitchDepth(p,dir){
  const fwd=p.cam.yaw+Math.PI,wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
  const sx=t=>-wrap(Math.atan2(t.pos.x-p.pos.x,t.pos.z-p.pos.z)-fwd);
  const cur=p.lockT,dc=Math.hypot(cur.pos.x-p.pos.x,cur.pos.z-p.pos.z),sc0=sx(cur);let best=null,bs=1e9;
  for(const o of lockTargets(p,26)){
    if(o.t===cur)continue;const s=sx(o.t);if(Math.abs(s)>1.75)continue;
    const step=dir<0?o.d-dc:dc-o.d;if(step<0.75)continue;   // has to be meaningfully farther / closer
    const sc=step+Math.abs(s-sc0)*6+o.hid;if(sc<bs){bs=sc;best=o.t;}
  }
  if(best){setLock(p,best);return true;}
  tone('square',180,140,0.05,0.025);return false;
}
function lockMarker(p){
  if(!p.lockMark){
    const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:0.92,depthTest:false,depthWrite:false,fog:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.15,0.21,28),mat),dot=new THREE.Mesh(new THREE.CircleGeometry(0.05,14),mat);
    for(const m of [ring,dot]){m.renderOrder=20;m.layers.set(1+p.idx);g.add(m);}
    p.camera.layers.enable(1+p.idx);g.visible=false;scene.add(g);p.lockMark=g;
  }
  return p.lockMark;
}
function setLock(p,g){
  p.lockT=g;const m=lockMarker(p);m.visible=!!g;
  if(g){p.lockPulse=0.25;tone('triangle',720,980,0.07,0.045);rumble(p,0.15,50);}
}
function updateLock(p,dt,inp){
  if(inp.lockPress){
    if(p.lockT){setLock(p,null);tone('triangle',620,380,0.07,0.035);}
    else{const g=lockCandidate(p);if(g)setLock(p,g);else tone('square',180,140,0.06,0.03);}
  }
  let T=p.lockT;if(!T){p.flickReq=0;return;}
  if(!lockAlive(T)){setLock(p,null);tone('triangle',520,300,0.08,0.03);return;}   // it died (or the car blew up): the lock lets go
  // right-stick flick (or mouse flick) to the next target left or right; the stick has to come back to centre between flicks
  // right stick: a flick left/right moves along the row on screen, up/down picks farther/closer; it must return to centre between flicks
  const lx=inp.lookX||0,ly=inp.lookY||0,mag=Math.hypot(lx,ly);
  if(mag<0.3)p.flickReady=true;
  else if(mag>0.65&&p.flickReady!==false){p.flickReady=false;if(Math.abs(lx)>=Math.abs(ly))lockSwitch(p,Math.sign(lx));else lockSwitchDepth(p,Math.sign(ly));T=p.lockT;}
  if(p.flickReq){lockSwitch(p,p.flickReq);p.flickReq=0;T=p.lockT;}
  if(p.flickReqY){lockSwitchDepth(p,p.flickReqY);p.flickReqY=0;T=p.lockT;}
  const dx=T.pos.x-p.pos.x,dz=T.pos.z-p.pos.z;
  if(Math.hypot(dx,dz)>(isMilT(T)?60:30)){setLock(p,null);return;}
  // face it, and swing the camera round behind
  let d=Math.atan2(dx,dz)-p.heading;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
  // (mid-roll or blast dash he faces the way he's going, turning back to it once it's over; the camera stays on it)
  const rolling=!!(p.dodge&&(p.dodge.roll||p.dodge.blast));
  // (just out of one: an eased turn back -- quick at first, settling gently onto it -- rather than a snap)
  if((p.state==='walk'||p.state==='windup')&&!rolling){
    if(p.rollOut&&(p.sinceDodge??9)<0.9)p.heading+=Math.sign(d)*Math.min(Math.abs(d),Math.min(7*dt,Math.max(1.6*dt,Math.abs(d)*dt*6.75)));
    else p.heading+=Math.max(-9*dt,Math.min(9*dt,d));}
  // the camera swings round behind him onto the target itself (so it doesn't follow him round as he turns out of a roll)
  let cd=(Math.atan2(dx,dz)+Math.PI)-p.cam.yaw;while(cd>Math.PI)cd-=Math.PI*2;while(cd<-Math.PI)cd+=Math.PI*2;
  p.cam.yaw+=cd*Math.min(1,dt*6);
  // the marker: over its centre of mass, a constant size on screen, a little pop when it locks
  const m=lockMarker(p);
  p.lockPulse=Math.max(0,(p.lockPulse||0)-dt);
  if(isCarT(T))m.position.set(T.pos.x,T.pos.y+0.95*ES,T.pos.z);
  else if(isMilT(T))m.position.set(T.pos.x,lockY(T),T.pos.z);
  else{const r=T.root;m.position.set(r.position.x,r.position.y+0.72*r.scale.y,r.position.z);}
  // tilt the camera to follow the target up or down (biased a little downward so Gus stays in frame)
  {const hd=Math.max(1,Math.hypot(dx,dz)),rise=m.position.y-(p.pos.y+2.4*ES);
   const want=Math.max(-1.0,Math.min(0.45,Math.atan2(rise,hd)*0.75-0.22));
   p.cam.pitch+=(want-p.cam.pitch)*Math.min(1,dt*4);}
  const cam=p.camera.position,dist=Math.hypot(m.position.x-cam.x,m.position.y-cam.y,m.position.z-cam.z);
  m.scale.setScalar(Math.max(0.55,dist*0.05)*(1+p.lockPulse*1.6));
}
