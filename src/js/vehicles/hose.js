// ---- Play as a goblin: a fire engine's water cannon. Driving one, Bite (held) sprays an arc of water from the top of
// it toward the crosshair, out to HOSE_R blocks. The water puts out the fires it falls on, and shoves the goblins and
// vehicles it hits back the way it's going, but hurts nobody (a tank's too heavy to move) ----
const HOSE_R=26,HOSE_TICK=0.1;
// where the water comes from: the monitor on the roof, a little ahead of the middle
function hoseFrom(c){const s=Math.sin(c.heading),k=Math.cos(c.heading);return{x:c.pos.x+s*0.6*ES,y:c.pos.y+3.1*ES,z:c.pos.z+k*0.6*ES};}
// the stream's path, u from 0 (the nozzle) to 1 (where it lands): straight toward the aim, bowed up in the middle
function hoseAt(H,u){return{x:H.sx+H.dx*u,y:H.sy+H.dy*u+Math.sin(Math.PI*u)*H.bow,z:H.sz+H.dz*u};}
// each step while you drive a fire engine: Bite held sprays (see drvCar)
function drvHose(c,i,dt){
  const p=c.drv;c.hoseT=(c.hoseT||0)-dt;
  if(!i.bite||!p){c.hose=null;return;}
  const N=hoseFrom(c),A=drvAim(p,30);let dx=A.x-N.x,dy=A.y-N.y,dz=A.z-N.z,L=Math.hypot(dx,dy,dz)||1;
  if(L>HOSE_R){const f=HOSE_R/L;dx*=f;dy*=f;dz*=f;L=HOSE_R;}
  // (short of the crosshair, it comes down where it would hit first: a wall, the ground)
  let u1=1;for(let u=0.08;u<=1;u+=0.04){const P={x:N.x+dx*u,y:N.y+dy*u+Math.sin(Math.PI*u)*Math.min(4,L*0.15),z:N.z+dz*u};
    if(P.y<0.5||solidAt(P.x,Math.floor(P.y),P.z)){u1=u;break;}}
  const H=c.hose={sx:N.x,sy:N.y,sz:N.z,dx:dx*u1,dy:dy*u1,dz:dz*u1,bow:Math.min(4,L*0.15)*u1,L:L*u1};
  // (the spray you see: drops along the arc, and a splash where it lands)
  for(let n=0;n<10;n++){const P=hoseAt(H,(n+Math.random())/10);puff(P.x,P.y,P.z,1,Math.random()<0.5?0xcfeaff:0x9fd2ff,0.07);}
  {const E=hoseAt(H,1);if(Math.random()<dt*14)puff(E.x,E.y,E.z,2,0xe6f4ff,0.6);}
  if(c.hoseT>0)return;c.hoseT=HOSE_TICK;
  if(audio)sfx('Water cannon',()=>noise(0.16,0.05,2400,'highpass'));
  hoseHit(c,H);
}
// what one burst of the stream does: along it (and most of all where it lands), fires go out and things are pushed
function hoseHit(c,H){
  const fl=Math.hypot(H.dx,H.dz)||1,ux=H.dx/fl,uz=H.dz/fl,pts=[];
  for(let u=0.35;u<=1.001;u+=0.13)pts.push(hoseAt(H,Math.min(1,u)));
  const E=pts[pts.length-1];
  const near=(x,y,z,r,top)=>{for(const P of pts){const d=Math.hypot(x-P.x,z-P.z);if(d<r+(P===E?1.6:0)&&P.y>y-1.2&&P.y<y+top+1)return P;}return null;};
  // fires: each one the water reaches burns down fast and goes out
  for(const F of fires){if(F.t<=0)continue;const r=(F.r||1)+1.4;
    if(Math.hypot(F.x-E.x,F.z-E.z)<r+1.2&&Math.abs(F.y-E.y)<4||near(F.x,F.y,F.z,r,2)){if(!F.douse)F.t=Math.min(F.t,6);F.douse=true;F.t-=1.1;
      if(Math.random()<0.5)smoke(F.x,F.y+0.5,F.z,1,0xdddddd);}}
  // goblins (and anyone else on foot but you): knocked back and off their feet for a moment, never hurt
  for(const g of goblins){if(g.state!=='chase'&&g.state!=='dead'||!g.root.visible)continue;
    if(Math.abs(g.pos.x-H.sx)>H.L+6||Math.abs(g.pos.z-H.sz)>H.L+6)continue;
    if(!near(g.pos.x,g.pos.y,g.pos.z,0.9,1.4))continue;
    if(Math.hypot(g.kv.x,g.kv.z)<12){g.kv.x+=ux*4.5;g.kv.z+=uz*4.5;}g.vy=Math.max(g.vy||0,2.2);if(g.state==='chase')g.stun=Math.max(g.stun||0,0.5);g.hoseT=playTime;}
  for(const q of players){if(q===c.drv||!q.active||q.state==='dead'||q.drv)continue;if(near(q.pos.x,q.pos.y,q.pos.z,0.9,1.6))shove(q,ux*0.35,uz*0.35);}
  // cars and lorries: pushed along, the smaller the further; trains, boats and tanks are too heavy to shift
  for(const o of cars){if(o===c||!o.alive||!o.g.visible)continue;if(Math.abs(o.pos.x-H.sx)>H.L+8||Math.abs(o.pos.z-H.sz)>H.L+8)continue;
    if(!near(o.pos.x,o.pos.y,o.pos.z,Math.max(o.hx,o.hz)+0.4,o.hy||1.4))continue;
    const m=o.veh==='bike'?1.6:o.veh==='semi'||o.veh==='bus'||o.veh==='fire'?0.35:o.veh==='truck'||o.veh==='rv'?0.6:1;
    if(Math.hypot(o.kv.x,o.kv.z)<9*m){o.kv.x+=ux*2.2*m;o.kv.z+=uz*2.2*m;}if(!o.drv&&o.speed)o.speed*=0.85;o.hoseT=playTime;}
  // a helicopter in the air is blown about a little
  for(const V of venues.values())for(const M of V.mil||[]){if(M.kind!=='heli'||M.dead||!M.hv)continue;if(near(M.x,M.y,M.z,2.4,MIL.heli.hy)){M.hv.x+=ux*1.2;M.hv.z+=uz*1.2;}}
}
