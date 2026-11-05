// ---- spider-climb (hold LB / C) ----
function wallAhead(p,d,y){return solidAt(Math.floor(p.pos.x+d[0]*0.75),Math.floor(y),Math.floor(p.pos.z+d[1]*0.75));}
// grab the wall in front (up to 'reach' blocks away): square up to it and press against its face
function wrapA(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
// a snap in position/heading is absorbed by a visual offset that eases away, so the model glides instead of jumping
function easeSnap(p,ox,oy,oz,oh){if(!p.visOff)p.visOff=new V3();p.visOff.x+=ox;p.visOff.y+=oy;p.visOff.z+=oz;p.headOff=wrapA((p.headOff||0)+oh);}
function startClimb(p,reach){
  const sx=Math.sin(p.heading),cz=Math.cos(p.heading),xFirst=Math.abs(sx)>Math.abs(cz),ways=[xFirst?[Math.sign(sx),0]:[0,Math.sign(cz)]];
  // (coming in at a slant, the wall he's rubbing along is off to one side of the way he's mostly facing: that counts too)
  if(Math.abs(xFirst?cz:sx)>0.25)ways.push(xFirst?[0,Math.sign(cz)]:[Math.sign(sx),0]);
  let cell=null,lat=0,d=ways[0];
  // (straight ahead first, then out to his shoulders: a thin pillar that's stopped his shoulder is still something to grab)
  for(const w of ways){
    for(const o of [0,0.3,-0.3,0.6,-0.6]){
      for(let s=0.3;s<=reach&&!cell;s+=0.15){const cx=Math.floor(p.pos.x+w[0]*s-w[1]*o),cz2=Math.floor(p.pos.z+w[1]*s+w[0]*o);if(solidAt(cx,Math.floor(p.pos.y+0.6),cz2)||solidAt(cx,Math.floor(p.pos.y+1.4),cz2)){cell=[cx,cz2];lat=o;d=w;}}
      if(cell)break;
    }
    if(cell)break;
  }
  if(!cell)return false;
  const ox=p.pos.x,oz=p.pos.z,oh=p.heading;
  // grabbed with a shoulder: shuffle across until the block's right in front of him (if there's room to)
  if(lat){const v=d[0]?p.pos.z:p.pos.x,c=d[0]?cell[1]:cell[0],to=Math.max(c+0.2,Math.min(c+0.8,v)),nx=d[0]?p.pos.x:to,nz=d[0]?to:p.pos.z;
    if(solidAt(Math.floor(nx),Math.floor(p.pos.y+0.6),Math.floor(nz))||solidAt(Math.floor(nx),Math.floor(p.pos.y+1.4),Math.floor(nz)))return false;
    p.pos.x=nx;p.pos.z=nz;}
  if(d[0]){const face=d[0]>0?cell[0]:cell[0]+1;p.pos.x=face-d[0]*0.06;}else{const face=d[1]>0?cell[1]:cell[1]+1;p.pos.z=face-d[1]*0.06;}
  p.climbD=d;p.heading=Math.atan2(d[0],d[1]);easeSnap(p,ox-p.pos.x,0,oz-p.pos.z,oh-p.heading);p.climbRoll=0;p.climbFlip=climbFlipFor(p,d);p.state='climb';p.t=0;p.vy=0;p.mvx=p.mvz=0;p.dashT=0;p.longJump=false;
  thud(0.12);rumble(p,0.15,50);return true;
}
// hauling up over the top of a wall (his back to the drop, D the way he's facing it): where to put him down, on a top
// at height 'top'. He's far longer than a block, so on a pillar or a narrow ledge he can't just go a body's length in:
// that would be past it, or inside the wall behind it. side says which way to turn if he has to stand along a ledge.
function haulSpot(p,D,top,side){
  const hd=Math.atan2(D[0],D[1]),at=s=>[p.pos.x+D[0]*s,p.pos.z+D[1]*s];
  const fits=(s,h)=>{const [x,z]=at(s),y=p.pos.y;p.pos.y=top;const hit=bodyHits(p,x,z,h);p.pos.y=y;return !hit;};
  const under=s=>{const [x,z]=at(s),v=supportAt(x,z,top+0.1);return v!==null&&Math.abs(v-top)<0.6;};
  const put=(s,h)=>{const [x,z]=at(s);return{x,z,h};};
  if(under(1.3)){for(let s=1.3;s>=0.6;s-=0.1)if(under(s)&&fits(s,hd))return put(s,hd);}   // room: as far in as his nose allows
  else if(fits(0.56,hd))return put(0.56,hd);   // the top's a block deep with nothing behind it: square in the middle of it
  // a wall right behind a narrow ledge: he stands along the ledge, as close in as his flank allows
  const sg=side<0?-1:1;
  for(const k of [sg,-sg])for(const s of [0.5,0.4,0.3,0.2,0.1]){const h=Math.atan2(-D[1]*k,D[0]*k);if(under(s)&&fits(s,h))return put(s,h);}
  // no room for that either: forefeet up with his nose to the wall and his back end hanging out over the drop
  for(const s of [0.1,0,-0.1,-0.2,-0.3]){const [x,z]=at(s),g=supportMax(x,z,hd,top+0.1,HIPPO_PTS);if(g!==null&&Math.abs(g-top)<0.6&&fits(s,hd))return put(s,hd);}
  if(under(1.3))return put(1.3,hd);
  // no room on the block itself, but only a step down on the far side: over it and on to that
  for(const k of [1.3,1.7,2.1,2.5]){const [x,z]=at(k),v=supportAt(x,z,top+0.1);if(v!==null&&v>=top-1.05&&v<top){const y=p.pos.y;p.pos.y=v;const hit=bodyHits(p,x,z,hd);p.pos.y=y;if(!hit)return{x,z,h:hd,y:v};}}
  return null;
}
// climbing sideways into an inside corner: step onto the wall that's blocking the way (s = crawl direction)
function climbCornerIn(p,d,s){
  const y=p.pos.y,cx=Math.floor(p.pos.x+s[0]*0.7-d[0]*0.6),cz=Math.floor(p.pos.z+s[1]*0.7-d[1]*0.6);
  if(!solidAt(cx,Math.floor(y+0.6),cz)&&!solidAt(cx,Math.floor(y+1.4),cz))return false;
  let nx=p.pos.x-d[0]*0.45,nz=p.pos.z-d[1]*0.45;
  if(s[0]){const face=s[0]>0?cx:cx+1;nx=face-s[0]*0.06;}else{const face=s[1]>0?cz:cz+1;nz=face-s[1]*0.06;}
  if(solidAt(Math.floor(nx),Math.floor(y+0.6),Math.floor(nz))||solidAt(Math.floor(nx),Math.floor(y+1.4),Math.floor(nz)))return false;
  // swing round the inside corner line (old wall face meets the new one)
  const E=[p.pos.x+d[0]*0.06,y,p.pos.z+d[1]*0.06];if(s[0])E[0]=s[0]>0?cx:cx+1;else E[2]=s[1]>0?cz:cz+1;
  p.climbD=s;startPiv(p,{E,to:[nx,y,nz],dur:0.3,next:'climb',heading:Math.atan2(s[0],s[1])});return true;
}
// crawling sideways off the end of a wall: wrap around the outside corner onto the side face
function climbCornerOut(p,d,s){
  const y=p.pos.y,cx=Math.floor(p.pos.x+d[0]*0.75),cz=Math.floor(p.pos.z+d[1]*0.75);
  let nx=p.pos.x,nz=p.pos.z;
  if(s[0]){const face=s[0]>0?cx+1:cx;nx=face+s[0]*0.06;}else{const face=s[1]>0?cz+1:cz;nz=face+s[1]*0.06;}
  if(d[0]){const face=d[0]>0?cx:cx+1;nx=face+d[0]*0.5;}else{const face=d[1]>0?cz:cz+1;nz=face+d[1]*0.5;}
  const nd=[-s[0],-s[1]],free=h=>!solidAt(Math.floor(nx),Math.floor(y+h),Math.floor(nz));
  if(!free(0.6)||!free(1.4))return false;
  if(![0.6,1.4].some(h=>solidAt(Math.floor(nx+nd[0]*0.75),Math.floor(y+h),Math.floor(nz+nd[1]*0.75))))return false;
  // wrap round the outside corner line (front face meets side face)
  const E=[0,y,0];
  if(s[0])E[0]=s[0]>0?cx+1:cx;else E[2]=s[1]>0?cz+1:cz;
  if(d[0])E[0]=d[0]>0?cx:cx+1;else E[2]=d[1]>0?cz:cz+1;
  p.climbD=nd;startPiv(p,{E,to:[nx,y,nz],dur:0.38,next:'climb',heading:Math.atan2(nd[0],nd[1])});return true;
}
// ---- ceilings and overhangs ----
const axisOf=(x,z)=>Math.abs(x)>Math.abs(z)?[Math.sign(x),0]:[0,Math.sign(z)];
const hangRoom=(x,cy,z)=>[1,2].every(h=>!solidAt(Math.floor(x),cy-h,Math.floor(z)));
// climbing up a wall into a ceiling (an overhang, a balcony, the ceiling of a room): turn onto it
function climbToCeil(p,d,cy){
  // the underside of whatever's overhead, just out from the wall
  for(let y=Math.floor(p.pos.y+1.5);y<=cy;y++)if(solidAt(Math.floor(p.pos.x-d[0]*1.2),y,Math.floor(p.pos.z-d[1]*1.2))||solidAt(Math.floor(p.pos.x-d[0]*0.6),y,Math.floor(p.pos.z-d[1]*0.6))){cy=y;break;}
  const nx=p.pos.x-d[0]*1.6,nz=p.pos.z-d[1]*1.6;
  if(!solidAt(Math.floor(nx),cy,Math.floor(nz))||!hangRoom(nx,cy,nz))return false;
  startPiv(p,{E:'center',to:[nx,cy,nz],dur:0.42,next:'ceil',heading:Math.atan2(-d[0],-d[1])});thud(0.08);return true;
}
// jumping up into a ceiling with climb held: grab it
function grabCeil(p){
  // the first solid block overhead, within reach of his back/feet
  const fx=Math.floor(p.pos.x),fz=Math.floor(p.pos.z);let cy=null;
  for(let y=Math.floor(p.pos.y+1);y<=Math.floor(p.pos.y+2.7);y++)if(solidAt(fx,y,fz)){cy=y;break;}
  if(cy===null||!hangRoom(p.pos.x,cy,p.pos.z))return false;
  startPiv(p,{E:'center',to:[p.pos.x,cy,p.pos.z],dur:0.28,next:'ceil',heading:p.heading});thud(0.12);rumble(p,0.15,50);return true;
}
// crawling along a ceiling into a wall: turn down onto it, head first
function ceilToWall(p,hx,hz,cy){
  const a=axisOf(hx,hz),c=a[0]?Math.floor(p.pos.x+a[0]*1.0):Math.floor(p.pos.z+a[1]*1.0),face=(a[0]||a[1])>0?c:c+1;
  let nx=p.pos.x,nz=p.pos.z;if(a[0])nx=face-a[0]*0.06;else nz=face-a[1]*0.06;
  const ny=cy-2.7;
  if(![0.6,1.4].every(h=>solidAt(Math.floor(nx+a[0]*0.75),Math.floor(ny+h),Math.floor(nz+a[1]*0.75))))return false;
  if(![0.6,1.4,2.2].every(h=>!solidAt(Math.floor(nx),Math.floor(ny+h),Math.floor(nz))))return false;
  p.climbD=a;p.climbRoll=Math.PI;p.climbFlip=Math.abs(p.in.z)>0.3?(p.in.z<0?-1:1):climbFlipFor(p,a);   // the held stick keeps going down
  startPiv(p,{E:'center',to:[nx,ny,nz],dur:0.42,next:'climb',heading:Math.atan2(a[0],a[1])});return true;
}
// crawling off the edge of an overhang: wrap round its lip onto the outside face, heading up (then over the top)
function ceilOverEdge(p,hx,hz,cy){
  const a=axisOf(hx,hz),c=a[0]?Math.floor(p.pos.x+a[0]*0.3):Math.floor(p.pos.z+a[1]*0.3),face=(a[0]||a[1])>0?c+1:c;
  let nx=p.pos.x,nz=p.pos.z;if(a[0])nx=face+a[0]*0.06;else nz=face+a[1]*0.06;
  const ny=cy-0.3,d=[-a[0],-a[1]];
  if(!solidAt(Math.floor(nx+d[0]*0.75),Math.floor(ny+0.6),Math.floor(nz+d[1]*0.75)))return false;
  if(![0.6,1.4].every(h=>!solidAt(Math.floor(nx),Math.floor(ny+h),Math.floor(nz))))return false;
  const E=a[0]?[face,cy,p.pos.z]:[p.pos.x,cy,face];
  p.climbD=d;p.climbRoll=0;p.climbFlip=Math.abs(p.in.z)>0.3?(p.in.z<0?1:-1):climbFlipFor(p,d);   // the held stick keeps going up
  startPiv(p,{E,to:[nx,ny,nz],dur:0.45,next:'climb',heading:Math.atan2(d[0],d[1])});return true;
}
// climbing down onto a floor: step off the wall onto it (forward and away if head-down, backing off if tail-down)
function climbDismount(p,d,gnd,headDown){
  const back=headDown?1.7:2.6,nx=p.pos.x-d[0]*back,nz=p.pos.z-d[1]*back;
  // somewhere flat to stand, with headroom, and nothing in between
  const sup=supportAt(nx,nz,gnd+0.6);if(sup===null||Math.abs(sup-gnd)>0.6)return false;
  for(let s=0.5;s<=back;s+=0.5)for(const h of[0.5,1.5]){if(solidAt(Math.floor(p.pos.x-d[0]*s),Math.floor(gnd+h),Math.floor(p.pos.z-d[1]*s)))return false;}
  const hd=headDown?Math.atan2(-d[0],-d[1]):Math.atan2(d[0],d[1]);
  startPiv(p,{E:'center',to:[nx,sup,nz],dur:headDown?0.45:0.4,next:'walk',heading:hd});
  thud(0.1);return true;
}
// walking off a ledge with climb held: tip over the edge onto the wall below, head first
function climbFlipFor(p,d){const fd=-Math.sin(p.cam.yaw)*d[0]-Math.cos(p.cam.yaw)*d[1];return fd<-0.3?-1:1;}
function climbOverEdge(p,mx,mz){
  const a=Math.abs(mx)>Math.abs(mz)?[Math.sign(mx),0]:[0,Math.sign(mz)],y=p.pos.y;
  let cell=null;
  for(let s=0;s<=0.45&&cell===null;s+=0.05){const qx=p.pos.x+a[0]*s,qz=p.pos.z+a[1]*s;if(groundAt(qx,qz,y)<y-3)cell=a[0]?Math.floor(qx):Math.floor(qz);}
  if(cell===null)return false;
  const face=(a[0]||a[1])>0?cell:cell+1,d=[-a[0],-a[1]],ny=y-2.7;
  let nx=p.pos.x,nz=p.pos.z;if(a[0])nx=face+a[0]*0.06;else nz=face+a[1]*0.06;
  const wallOK=[0.6,1.4].every(h=>solidAt(Math.floor(nx+d[0]*0.75),Math.floor(ny+h),Math.floor(nz+d[1]*0.75)));
  const free=[0.6,1.4,2.2].every(h=>!solidAt(Math.floor(nx),Math.floor(ny+h),Math.floor(nz)));
  if(!wallOK||!free)return false;
  // the edge he pivots over: on the lip of the ledge, level with his feet
  const E=a[0]?[face,y,p.pos.z]:[p.pos.x,y,face];
  p.climbD=d;p.climbRoll=Math.PI;p.climbFlip=climbFlipFor(p,d);
  startPiv(p,{E,to:[nx,ny,nz],dur:0.42,next:'climb',heading:Math.atan2(d[0],d[1])});
  thud(0.1);rumble(p,0.15,50);return true;
}
