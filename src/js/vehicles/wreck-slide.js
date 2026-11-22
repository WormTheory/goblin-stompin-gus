// ---- wrecks keep going ----
// A vehicle destroyed on the move doesn't stop dead: its wreck slides, rolls or falls on the way it was going (its
// velocity at that moment, kept for every vehicle by wsTrack), slowed by the ground (less the heavier it is: a lorry
// skids further than a car from the same speed), by the air or the water, and pulled down by gravity, so one shot down
// arcs to the ground. Every block in its way takes some of its speed, by how tough the block is (WS_TOUGH) over the
// wreck's mass (HANDLING's), and is knocked out the way a tank's ram knocks them out (so the rubble flies and a building
// that loses enough comes down); a block it can't afford, or bedrock, stops it there. So a plane crashed into a building
// at speed ends up partway inside it, and a car into a wall pushes in a little. Once it's still it rests on whatever's
// under it (wsGround), and drops if that's blown away later. Each kind's wreck update moves its model to match
// (milWreck, planeWreck, boatWreck, and the dead branches of updateCars, updateMechs and updateBalloons). Only the host,
// or a game alone, runs it: a guest online is sent the wreck's place each snapshot and the blocks it breaks, as for
// anything else.
// g gravity; air and water how fast the wreck slows off the ground (a share a second); fric the ground's braking on a
// wreck of mass 1 (blocks a second squared, divided by the square root of the mass); cost the speed one block of
// toughness 1 takes off a wreck of mass 1; drag how much of its speed scraping along takes off besides (a share a
// second, whatever its mass, so the fastest don't go on for ever); vmin the least speed that breaks anything; step how far it's moved at a
// time; tmax the longest it slides; stop the speed it's still at; cap the fastest believed (more is a jump, not speed)
const WS={g:24,air:0.3,water:0.9,fric:10,drag:0.7,cost:2,vmin:3,step:0.4,tmax:10,stop:0.3,cap:160};
const WS_TOUGH=(()=>{const T=new Float32Array(256).fill(1),set=(v,L)=>{for(const b of L)T[b]=v;};
  for(let b=0;b<BLOCK.length;b++)if(BLOCK[b]&&BLOCK[b].brittle)T[b]=0.2;   // (fences, railings, gravestones)
  set(0.2,[GLASS,STAINED,LEAVES,FLOWER,AWN_R,AWN_G,LAMP,NEON_G,NEON_M,NEON_B,NEON_R,NEON_Y,NEON_O,SCREEN]);
  set(0.5,[PLANKS,SHELF,BED,SOFA,CRATE,SIDING,SIDING_Y,SHINGLE,SEAT_B,SEAT_R,ICE]);
  set(0.7,[LOG,FRIDGE,ROOF,SAND,GRAVEL,PUMP,RED_SAND,SNOW,MUD]);
  set(0.9,[GRASS,DIRT,FIELD,FIELD_L,CLAY,WIN_BLUE,WIN_GREEN,WIN_WARM,COURT,COURT_L]);
  set(1.2,[BRICK,STUCCO,PAINT_BLUE,PAINT_RED,PAINT_GREEN,PAINT_ORANGE,PAINT_YELLOW,PAINT_WHITE,PAINT_NAVY,PAINT_DARK]);
  set(1.5,[CONCRETE,MOSSCON,COBBLE,STONE,MOSSSTONE,MARBLE,ASPHALT,LINE,LINEX,LINE_R,LINEX_R,CROSS,CROSSX,LANE,LANEX,SIDEWALK,HOSPW,HOSPX,CHECKER,POLICE]);
  set(2,[METAL,RUST,BRONZE,GOLD,DEEPSLATE,COAL,CRYSTAL]);
  T[BEDROCK]=Infinity;return T;})();
// how hard the ground brakes a wreck of mass m, sliding (a halted train grinding to a stop too)
const wsDecel=m=>WS.fric/Math.sqrt(Math.max(0.2,m||1));
// ---- every vehicle's velocity, from how far it's moved since last frame (smoothed a little; a jump, a respawn or a
// crossing into a ship's pocket, counts as standing still). Run once a frame after everything has moved ----
function wsTrack(dt){if(!(dt>0)||netGuest())return;
  const one=(o,x,y,z)=>{let P=o.wsP;if(!P){o.wsP=[x,y,z];o.wsV=[0,0,0];return;}const V=o.wsV,vx=(x-P[0])/dt,vy=(y-P[1])/dt,vz=(z-P[2])/dt;
    if(Math.hypot(vx,vy,vz)>WS.cap){V[0]=V[1]=V[2]=0;}else{V[0]+=(vx-V[0])*0.6;V[1]+=(vy-V[1])*0.6;V[2]+=(vz-V[2])*0.6;}P[0]=x;P[1]=y;P[2]=z;};
  for(const c of cars){if(c.alive&&c.g.visible)one(c,c.pos.x,c.pos.y,c.pos.z);else c.wsP=null;}
  vehEach((K,o)=>{if(K.k==='ship'||K.k==='mount'||K.perCar)return;if(K.dead(o)){o.wsP=null;return;}const P=K.pos(o);one(o,P.x,P.y,P.z);});}
// ---- a wreck's slide: started as it's destroyed. k its kind (VEHICLE_KINDS'), o the vehicle, P where it stands (x,y,z,
// the middle of its underside), h which way it faces, hx/hz/hy half its width, half its length and its height, m its
// mass, and float for a boat (it drifts on the water, sinking as boatWreck has it, and nothing pulls it down) ----
function wsStart(o,P,h,hx,hz,hy,m,float){
  if(netGuest()||SBX)return null;const V=o.wsV||[0,0,0];
  const W={o,vx:V[0],vy:float?0:V[1],vz:V[2],m:m||1,hx,hz,hy,h,float:!!float,on:true,t:0,air:false};
  if(!float){const g=wsGround(W,P.x,P.y,P.z);W.air=P.y>g+0.05;if(!W.air&&W.vy<0)W.vy=0;}
  o.ws=W;o.wsP=null;return W;}
// the kinds, each from what it keeps (the box it's hit by, its heading, its mass)
function wsStartKind(k,o){
  if(k==='car'){const W=wsStart(o,o.pos,o.heading,o.hx,o.hz,o.hy*0.8,carMass(o));if(W){W.car=true;W.w=o.yawV||0;}return W;}   // (a car spinning as it's wrecked spins on: collide.js)
  if(k==='tank'||k==='heli'){const I=MIL[o.kind];return wsStart(o,o,o.h,I.hx,I.hz,I.hy,handOf(o.kind).mass);}
  if(k==='plane'){const D=planeDim(o);return wsStart(o,o.g.position,o.g.rotation.y,D.hx,D.hz,D.hy,o.jet?3:o.light?2:handOf('plane').mass);}
  if(k==='mech')return wsStart(o,o,o.h,MG.r,MG.r,MG.hy,handOf('mech').mass);
  if(k==='balloon')return wsStart(o,o,o.h,BAL.bw,BAL.bw,BAL.bh,handOf('balloon').mass);
  if(k==='boat'){let V=null;for(const v of venues.values())if(v.bo===o){V=v;break;}if(!V||V.dry||V.ground)return null;return wsStart(o,o.g.position,o.g.rotation.y,o.K.W/2,o.L/2,o.K.fb+1,handOf('boat').mass*Math.max(0.3,o.L/12),true);}
  return null;}
// the top of what's under a point of the wreck, from its underside y down: a ramp under it there counts, but a whole
// block level with its underside is one it's inside (stopped against or landed by) and the ground's further down
function wsColTop(x,y,z,lo){const xi=Math.floor(x),zi=Math.floor(z);
  for(let yy=Math.min(H-1,Math.floor(y+0.05)),y0=Math.max(0,lo||0);yy>=y0;yy--){const b=get(xi,yy,zi);if(!b||!BLOCK[b].solid)continue;const R=BLOCK[b].ramp,top=R?yy+rampH(b,x-xi,z-zi):yy+1;
    if(top>y+(R?0.6:0.35))continue;return top;}
  return 0;}
// what the wreck rests on: the highest of what's under it anywhere across its underside (its middle and corners, then
// every block or so between, each only down as far as the highest found so far), so it lies on whatever holds it up:
// never hanging over nothing, and never sunk into the stub of a wall it's ploughed through
function wsGround(W,x,y,z){const fx=Math.sin(W.h),fz=Math.cos(W.h),a=W.hz*0.9,s=W.hx*0.9;let g=wsColTop(x,y,z);
  for(const [u,v] of [[a,s],[a,-s],[-a,s],[-a,-s]])g=Math.max(g,wsColTop(x+fx*u+fz*v,y,z+fz*u-fx*v));
  const nu=Math.ceil(2*a),nv=Math.ceil(2*s);
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){const u=-a+2*a*i/(nu||1),v=-s+2*s*j/(nv||1);g=Math.max(g,wsColTop(x+fx*u+fz*v,y,z+fz*u-fx*v,Math.floor(g)));}
  return g;}
// the blocks the wreck's box would run into, moved by (dx,dz) from P: along its leading end and leading side, from a
// little above its underside to its top (a boat's from the waterline). Each solid one once, ramps under it left out
function wsAhead(W,P,dx,dz,out,gone){
  const fx=Math.sin(W.h),fz=Math.cos(W.h),mf=dx*fx+dz*fz,ms=dx*fz-dz*fx,yb=W.float?G+1:P.y,r0=Math.floor(yb+0.3),r1=Math.max(r0,Math.ceil(yb+W.hy)-1),seen=new Set();
  const at=(u,v)=>{const x=Math.floor(P.x+dx+fx*u+fz*v),z=Math.floor(P.z+dz+fz*u-fx*v);
    for(let y=r0;y<=r1;y++){if(y<1||y>=H)continue;const k=x+','+y+','+z;if(seen.has(k)||gone&&gone.has(k))continue;seen.add(k);
      const b=get(x,y,z);if(!b||!BLOCK[b].solid||BLOCK[b].ramp&&y===Math.floor(yb+0.05))continue;out.push({x,y,z,b});}};
  const N=(L)=>Math.max(1,Math.ceil(L*2));
  if(Math.abs(mf)>1e-4){const u=Math.sign(mf)*W.hz,n=N(2*W.hx);for(let i=0;i<=n;i++)at(u,-W.hx+2*W.hx*i/n);}
  if(Math.abs(ms)>1e-4){const v=Math.sign(ms)*W.hx,n=N(2*W.hz);for(let i=0;i<=n;i++)at(-W.hz+2*W.hz*i/n,v);}
  return out;}
// (a wreck stops against any other vehicle in its way, vehIn)
// knocking out what it's ploughed through (as tankRam does: the rubble flies the way it's going, and settle brings down
// whatever's left hanging)
function wsBreak(L,fx,fz,sp){if(!L.length)return;const ch=new Set();
  for(const B of L){setRaw(B.x,B.y,B.z,AIR);addEdit(B.x,B.y,B.z,AIR);for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((B.x+ox)/CS),Math.floor((B.z+oz)/CS)));}
  const o={force:Math.min(2.5,0.8+sp*0.03),dx:fx,dz:fz,up:1};rebuildSet(ch);save();destroyFX(L.slice(0,120),o);settle(L,o);pumpsHit(L);}
// one step of a wreck at P: returns how fast it hit the ground, if it came down this step (0 if not)
function wsStep(W,P,dt){if(!W)return 0;let landed=0;
  if(W.on){W.t+=dt;
    let sp=Math.hypot(W.vx,W.vz);
    if(W.float){const k=Math.exp(-WS.water*dt);W.vx*=k;W.vz*=k;}
    else if(W.air){const k=Math.exp(-WS.air*dt);W.vx*=k;W.vz*=k;}
    else if(sp>0){const n=Math.max(0,sp-(wsDecel(W.m)+WS.drag*sp)*dt)/sp;W.vx*=n;W.vz*=n;}
    sp=Math.hypot(W.vx,W.vz);
    if(W.w){W.h+=W.w*dt;W.w*=Math.exp(-dt*(W.air?0.2:2.5));if(Math.abs(W.w)<0.02)W.w=0;}   // (a car's wreck turning, as it was when it went, or knocked round)
    // (along the ground, a little at a time: what's ahead is hit, broken if it can be paid for, else it stops there.
    // A single block's step at its feet, with nothing above it, it rides up over instead, losing a little)
    if(sp>0.01){let left=sp*dt,kn=0;const broke=[],gone=new Set();
      while(left>1e-6&&sp>0.01){const d=Math.min(WS.step,left),dx=W.vx/sp*d,dz=W.vz/sp*d;
        // (a live car in the way is knocked aside by the same impulse as two cars meeting, slowing it: collide.js's wsCars;
        // any other vehicle in the way stops it, as a driven one is stopped, unless it's already caught up in it, when it may slide clear)
        {const yb=W.float?G+1:P.y;if(!W.float&&kn<4&&wsCars(W,P.x+dx,P.z+dz,yb+0.3,yb+W.hy)){kn++;sp=Math.hypot(W.vx,W.vz);continue;}if(vehIn(P.x+dx,P.z+dz,W.h,W.hx,W.hz,yb+0.3,yb+W.hy,W.o)&&!vehIn(P.x,P.z,W.h,W.hx,W.hz,yb+0.3,yb+W.hy,W.o)){W.vx=W.vz=0;sp=0;break;}}
        const A=wsAhead(W,P,dx,dz,[],gone);
        if(A.length){const yb=W.float?G+1:P.y,r0=Math.floor(yb+0.3);
          if(!W.float&&A.every(B=>B.y===r0)&&!wsAhead(W,{x:P.x,y:P.y+1,z:P.z},dx,dz,[],gone).length&&wsColTop(P.x+dx,P.y+1,P.z+dz)<=P.y+1.01){P.y=r0+1;W.vx*=0.85;W.vz*=0.85;sp*=0.85;}
          else{let cost=0;for(const B of A)cost+=WS_TOUGH[B.b];cost*=WS.cost/W.m;
            if(sp<WS.vmin||!(cost<sp)){W.vx=W.vz=0;sp=0;break;}
            broke.push(...A);for(const B of A)gone.add(B.x+','+B.y+','+B.z);   // (counted gone at once, so the rest of the step sees past them)
            const n=(sp-cost)/sp;W.vx*=n;W.vz*=n;sp-=cost;}}
        P.x+=dx;P.z+=dz;left-=d;}
      if(broke.length){const fx=W.vx/(sp||1),fz=W.vz/(sp||1);
        wsBreak(broke,fx,fz,sp);knockProps(P.x+fx*W.hz,P.y+1,P.z+fz*W.hz,Math.max(W.hx,1)+1,fx,fz);if(!W.clangT){W.clangT=0.15;clang();}}}
    if(W.clangT>0)W.clangT=Math.max(0,W.clangT-dt);
    if(W.float){if(W.t>WS.tmax||sp<WS.stop)W.on=false;return 0;}
    // (up and down: off the ground it falls, and lands on whatever's under where it was)
    const g=wsGround(W,P.x,P.y,P.z);
    if(W.air||P.y>g+0.05||W.vy>0){W.vy-=WS.g*dt;const ny=P.y+W.vy*dt;
      if(ny<=g){landed=Math.max(0,-W.vy);P.y=g;W.vy=0;W.air=false;}else{P.y=ny;W.air=true;}}
    else{P.y=g;W.vy=0;W.air=false;}
    if(!W.air&&(sp<WS.stop||W.t>WS.tmax)){W.vx=W.vz=0;W.on=false;}
    return landed;}
  // (still: lying on what's under it; blow that away and down it goes)
  if(W.float)return 0;
  const g=wsGround(W,P.x,P.y,P.z);
  if(P.y>g+0.02){W.vy-=WS.g*dt;P.y=Math.max(g,P.y+W.vy*dt);if(P.y<=g){landed=-W.vy;W.vy=0;}}else{W.vy=0;if(P.y<g)P.y=g;}
  return landed;}
// a car's wreck: the burnt-out shell slides on, and lies there a while before it's cleared away (carSpawn makes it new)
function wsCarDark(c,on){c.g.traverse(o=>{if(!o.isMesh)return;if(on){if(!o.userData.wsMat)o.userData.wsMat=o.material;o.material=TRM.dark;}else if(o.userData.wsMat){o.material=o.userData.wsMat;o.userData.wsMat=null;}});}
function wsCarHulk(c){const W=wsStartKind('car',c);if(!W)return;W.hulkT=12;c.g.visible=true;wsCarDark(c,true);if(c.dh)c.dh.visible=false;}
// (each frame the car's dead: true while its shell is still lying there, so nothing brings it back meanwhile)
function wsCarStep(c,dt){const W=c.ws;if(!W)return false;
  const v=wsStep(W,c.pos,dt);if(v>8)thud(Math.min(1,v/25));
  if(!W.on){W.hulkT-=dt;if(W.hulkT<=0){c.ws=null;c.g.visible=false;wsCarDark(c,false);return false;}}
  c.heading=W.h;c.g.position.copy(c.pos);c.g.rotation.set(c.pitch||0,c.heading,0.12);return true;}
