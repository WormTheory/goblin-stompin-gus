// ---- spider-climbing the side of a vehicle: a car, a truck, a train car, a boat (and the containers stacked on one), a plane ----
// (a vehicle isn't made of blocks, so it gets a cling of its own: he holds on at a spot on one face of its box, kept in the
// vehicle's own frame -- along the face, and up from the bottom of the box -- so wherever it drives, sails or flies off to,
// and however it turns, he goes with it. p.vcl is that hold; it only means anything while p.state is 'climb')
// the box of a car, or of one piece of a train, boat or plane (its stand-in in TRAIN_BOXES), as it is right now
function vBox(v){
  const V=!v.isTrain&&VEH[v.veh];
  if(V){const ax=Math.sin(v.heading),az=Math.cos(v.heading);
    return{x:v.pos.x,z:v.pos.z,ax,az,hl:v.hz,hc:v.hx,y0:v.pos.y,top:l=>v.pos.y+V.roof(Math.max(-v.hz,Math.min(v.hz,l))/ES)*ES,h:v.heading};}
  for(const B of TRAIN_BOXES)if(B.proxy===v&&!B.soft&&B.top-B.y0>=1)return{x:B.x,z:B.z,ax:B.tx,az:B.tz,hl:B.hz||TRAIN_HZ,hc:B.hx||TRAIN_HX,y0:B.y0,top:()=>B.top,h:Math.atan2(B.tx,B.tz)};
  return null;
}
// a face of a box: k 'c' is a long side (out across it), k 'l' an end (out along it); s which of the two
const vFace=(b,f)=>f.k==='c'?{nx:-b.az*f.s,nz:b.ax*f.s,tx:b.ax,tz:b.az,dist:b.hc,R:b.hl}:{nx:b.ax*f.s,nz:b.az*f.s,tx:-b.az,tz:b.ax,dist:b.hl,R:b.hc};
const vLocal=(b,x,z)=>{const dx=x-b.x,dz=z-b.z;return{al:dx*b.ax+dz*b.az,ac:-dx*b.az+dz*b.ax};};
// how high the face's top is where he's holding it (a car's roof isn't the same height all along)
const vTopAt=(b,f,u)=>b.top(f.k==='c'?u:f.s*b.hl);
// every vehicle near enough to grab
function vNear(p,r){
  const out=[];
  for(const c of cars){if(c.alive&&Math.hypot(c.pos.x-p.pos.x,c.pos.z-p.pos.z)<c.hz+r+2)out.push(c);}
  for(const B of TRAIN_BOXES){if(B.soft||!B.proxy.alive||B.top-B.y0<1||Math.hypot(B.x-p.pos.x,B.z-p.pos.z)>Math.max(B.hx||TRAIN_HX,B.hz||TRAIN_HZ)+r+2)continue;out.push(B.proxy);}
  return out;
}
// put him where his hold is, this frame (and turn him, and the camera, with the vehicle)
function vPin(p){
  const H=p.vcl,b=vBox(H.v);if(!b||!H.v.alive)return false;
  const F=vFace(b,H.f),o=F.dist+0.06;
  p.pos.x=b.x+F.nx*o+F.tx*H.u;p.pos.z=b.z+F.nz*o+F.tz*H.u;p.pos.y=b.y0+H.y;
  const dh=wrapA(b.h-H.h);H.h=b.h;if(Math.abs(dh)<0.7&&p.cam)p.cam.yaw+=dh;
  p.heading=Math.atan2(-F.nx,-F.nz);p.climbD=[-F.nx,-F.nz];return b;
}
// (players move before the vehicles do: once they've moved, he's put back on his hold, model and all)
function vRepin(p){const x=p.pos.x,y=p.pos.y,z=p.pos.z;if(!vPin(p))return;const dx=p.pos.x-x,dy=p.pos.y-y,dz=p.pos.z-z;
  p.root.position.x+=dx;p.root.position.y+=dy;p.root.position.z+=dz;if(p.rootP){p.rootP[0]+=dx;p.rootP[1]+=dy;p.rootP[2]+=dz;}}
// take hold of face f of vehicle v at the point nearest him (he's at or just off it)
function vHold(p,v,b,f,headDown){
  const F=vFace(b,f),L=vLocal(b,p.pos.x,p.pos.z),u0=f.k==='c'?L.al:L.ac,u=Math.max(-F.R+0.45,Math.min(F.R-0.45,u0));
  const top=vTopAt(b,f,u),y=Math.max(0,Math.min(top-b.y0-0.7,(headDown?top-2.7:p.pos.y)-b.y0));
  if(top-b.y0<0.9)return false;
  const ox=p.pos.x,oy=p.pos.y,oz=p.pos.z,oh=p.heading;
  p.vcl={v,f,u,y,h:b.h};vPin(p);
  easeSnap(p,ox-p.pos.x,oy-p.pos.y,oz-p.pos.z,oh-p.heading);
  p.climbRoll=headDown?Math.PI:0;p.climbFlip=climbFlipFor(p,p.climbD);p.state='climb';p.t=0;p.vy=0;p.mvx=p.mvz=0;p.dashT=0;p.longJump=false;
  p.standCar=null;p.rideC=null;p.piv=null;p.vb=null;markStick(p);
  thud(0.12);rumble(p,0.15,50);return true;
}
// the side of a vehicle right in front of him (up to 'reach' away), at the height of his body: grab it
function vGrab(p,reach,only){
  const hx=Math.sin(p.heading),hz=Math.cos(p.heading);
  for(const v of only?[only]:vNear(p,reach)){const b=vBox(v);if(!b)continue;
    let hit=only?vLocal(b,p.pos.x,p.pos.z):null;
    for(let s=0.3;s<=reach&&!hit;s+=0.15){const L=vLocal(b,p.pos.x+hx*s,p.pos.z+hz*s);if(Math.abs(L.al)<=b.hl&&Math.abs(L.ac)<=b.hc)hit=L;}
    if(!hit)continue;
    // something there at body height (not one he's up on top of already, nor one passing far overhead)
    const L=vLocal(b,p.pos.x,p.pos.z),f=Math.abs(L.ac)-b.hc>Math.abs(L.al)-b.hl?{k:'c',s:Math.sign(L.ac)||1}:{k:'l',s:Math.sign(L.al)||1};
    const top=vTopAt(b,f,f.k==='c'?L.al:L.ac);if(top<=p.pos.y+0.6||b.y0>p.pos.y+1.4)continue;
    if(vHold(p,v,b,f,false))return true;
  }
  return false;
}
// walking off the edge of a vehicle's roof with climb held: tip over onto its side, head first
function vOverEdge(p,mx,mz){
  const v=p.standCar;if(!v||!v.alive)return false;const b=vBox(v);if(!b)return false;
  const L=vLocal(b,p.pos.x+mx*0.6,p.pos.z+mz*0.6),ea=Math.abs(L.ac)-b.hc,el=Math.abs(L.al)-b.hl;
  if(ea<=0&&el<=0)return false;   // (still over the roof)
  const f=ea>el?{k:'c',s:Math.sign(L.ac)||1}:{k:'l',s:Math.sign(L.al)||1},F=vFace(b,f);
  // (anything right under the lip -- a deck, the next car of the train -- is somewhere to step down to, not a wall to climb)
  const ox=p.pos.x,oz=p.pos.z;p.pos.x=b.x+F.nx*(F.dist+0.06)+F.tx*(f.k==='c'?L.al:L.ac);p.pos.z=b.z+F.nz*(F.dist+0.06)+F.tz*(f.k==='c'?L.al:L.ac);
  const ok=vTopAt(b,f,f.k==='c'?L.al:L.ac)-b.y0>=2&&vHold(p,v,b,f,true);
  if(!ok){p.pos.x=ox;p.pos.z=oz;}return ok;
}
// clinging on: the stick moves him up, down and along the face, round its corners, up over the top onto the roof,
// or down off the bottom; let go of climb (or jump) and he lets go
function vClimb(p,inp,dt){
  const H=p.vcl;let b=vPin(p);
  const off=(vy,push)=>{const d=p.climbD||[0,1];p.vcl=null;p.state='walk';p.grounded=false;p.vy=vy;p.mvx=-d[0]*push;p.mvz=-d[1]*push;p.heading=Math.atan2(-d[0],-d[1]);startVBlend(p,0.3);};
  if(!b){off(0,1);return false;}   // (it's gone: wrecked, or out of reach of the world)
  if(!inp.climb){off(3.2,4.5);p.hopT=0.1;puff(p.pos.x,p.pos.y+0.8,p.pos.z,4,0xd6d8d0,0.4);return false;}
  if(inp.jumpPress){off(8.5,7);p.airBiteCD=0;p.hopT=0.12;p.qJump=0;grunt(p,false);puff(p.pos.x,p.pos.y+1,p.pos.z,6,0xd6d8d0,0.5);return false;}
  const d=p.climbD;
  {const fd=-Math.sin(p.cam.yaw)*d[0]-Math.cos(p.cam.yaw)*d[1];if(!stickHeld(p)&&Math.abs(fd)>0.5)p.climbFlip=fd>0?1:-1;}
  const fl=p.climbFlip||1;let up=-inp.z*fl,side=inp.x*fl;const mag=Math.hypot(up,side);if(mag>1){up/=mag;side/=mag;}
  let F=vFace(b,H.f);
  // along the face (sideways on the wall is (-d.z, d.x), as on a wall of blocks); off the end, round the corner on to the next face
  if(side){const w=-d[1]*F.tx+d[0]*F.tz;H.u+=side*2.6*dt*w;
    if(Math.abs(H.u)>F.R-0.45){const sg=Math.sign(H.u),nf=H.f.k==='c'?{k:'l',s:sg}:{k:'c',s:sg},NF=vFace(b,nf),top=vTopAt(b,nf,0);
      if(top-b.y0>H.y+0.7&&NF.R>0.9){
        const ox=p.pos.x,oz=p.pos.z,oh=p.heading,cu=(F.nx*NF.tx+F.nz*NF.tz)*F.dist;
        H.f=nf;H.u=Math.max(-NF.R+0.45,Math.min(NF.R-0.45,cu-Math.sign(cu)*0.45));vPin(p);easeSnap(p,ox-p.pos.x,0,oz-p.pos.z,oh-p.heading);F=NF;
      } else H.u=sg*(F.R-0.45);}}
  const top=vTopAt(b,H.f,H.u)-b.y0;
  if(up>0){H.y+=up*3.2*dt;
    // over the top: up on to the roof (or the deck, or the top of the stack), facing in across it
    if(H.y+0.6>top){
      const inn=Math.min(1.3,F.dist+F.dist-0.3),x=b.x+F.nx*(F.dist-inn)+F.tx*H.u,z=b.z+F.nz*(F.dist-inn)+F.tz*H.u;
      const ox=p.pos.x,oy=p.pos.y,oz=p.pos.z,oh=p.heading,v=H.v;
      p.vcl=null;p.state='walk';p.grounded=true;p.vy=0;p.pos.set(x,b.y0+top,z);p.heading=Math.atan2(-F.nx,-F.nz);p.peakY=p.pos.y;p.landT=0.12;
      startVBlend(p,0.35);easeSnap(p,ox-x,oy-p.pos.y,oz-z,oh-p.heading);
      p.standCar=v;p.rideC=v;p.rideX=v.pos.x;p.rideZ=v.pos.z;p.rideH=v.heading;thud(0.15);grunt(p,false);return false;}
  } else if(up<0){
    // down to the bottom of the box, or to the ground (or water) beside it: let go there, on to his feet
    const gnd=groundAt(p.pos.x+d[0]*-0.6,p.pos.z+d[1]*-0.6,p.pos.y)-b.y0;
    H.y=Math.max(Math.max(0,gnd),H.y+up*3.2*dt);
    if(H.y<=Math.max(0,gnd)+0.001){p.vcl=null;p.state='walk';p.grounded=false;p.vy=0;startVBlend(p,0.3);return false;}
  }
  H.y=Math.min(H.y,Math.max(0,top-0.6));
  vPin(p);
  const moving=mag>0.1;if(moving){p.phase+=dt*7;const dr=wrapA(Math.atan2(side,up)-(p.climbRoll||0));p.climbRoll=wrapA((p.climbRoll||0)+dr*Math.min(1,dt*5.5));}
  return moving;
}
