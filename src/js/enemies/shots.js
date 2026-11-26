// ---- fireballs, from a spellbook (WEAPONS.spellbook, whose numbers they all are): a glowing ball flying at its target,
// bending a little after it; a burst of flame against anything solid. A cultist's hurts players (and a vehicle in its way);
// a player goblin's hurts goblins (and players, with PvP on), and vehicles ----
const FIREB=[],FB_GEO=new THREE.BoxGeometry(1,1,1),FB_CORE=new THREE.MeshBasicMaterial({color:0xffe070}),FB_HALO=new THREE.MeshBasicMaterial({color:0xff4a10,transparent:true,opacity:0.55,depthWrite:false});
// (o: W the weapon, by who's to blame, cause, and pl the player goblin who cast it, if one did)
function fireball(x,y,z,tx,ty,tz,o){
  let F=FIREB.find(f=>!f.live);
  if(!F){if(FIREB.length>=24)return null;const g=new THREE.Group(),c=new THREE.Mesh(FB_GEO,FB_CORE),h=new THREE.Mesh(FB_GEO,FB_HALO);h.renderOrder=1.7;c.scale.setScalar(0.32);h.scale.setScalar(0.6);g.add(c);g.add(h);g.visible=false;scene.add(g);
    F={g,halo:h,pos:new V3(),v:new V3(),t:0,live:false,by:null,trail:0};FIREB.push(F);}
  o=o||{};const W=o.W||WEAPONS.spellbook,sp=W.ball.speed;F.W=W;F.pl=o.pl||null;F.cause=o.cause||W.player.cause;
  F.pos.set(x,y,z);{const ex=tx-x,ey=ty-y,ez=tz-z,L=Math.hypot(ex,ey,ez);if(L<1e-3)F.v.set(0,0,sp);else F.v.set(ex/L*sp,ey/L*sp,ez/L*sp);}
  F.t=0;F.live=true;F.by=o.by||null;F.trail=0;F.g.position.copy(F.pos);F.g.visible=true;
  if(audio)noise(0.35,0.05,900,'bandpass');
  return F;
}
function fbBurst(F){
  F.live=false;F.g.visible=false;if(F.pl){mineArea(F.pos.x,F.pos.z,1.2,F.pos.y,F.by);knockAt(F.pos.x,F.pos.y,F.pos.z,1.2,F.v.x,F.v.z);}   // (a player's sets off a landmine it bursts on, and knocks over what it bursts on)
  puff(F.pos.x,F.pos.y-0.15,F.pos.z,9,0xff6a10,0.45);puff(F.pos.x,F.pos.y-0.15,F.pos.z,5,0xffd040,0.3);
  if(audio)tone('sawtooth',170,45,0.35,0.06);
}
// what it bends after, within the spellbook's seek: a cultist's, the nearest player; a player goblin's, the nearest enemy
// goblin (not the townsfolk) or, with PvP on, another player, so long as it's ahead of the ball
function fbTarget(F){const R=F.W.ball.seek,pl=F.pl;
  if(!pl){const n=nearestPlayer(F.pos.x,F.pos.z);return n&&n.d<R?{x:n.p.pos.x,y:n.p.pos.y+1.5,z:n.p.pos.z}:null;}
  let best=null,bd=R;const see=(x,y,z)=>{const dx=x-F.pos.x,dz=z-F.pos.z,d=Math.hypot(dx,dz);if(d<bd&&dx*F.v.x+dz*F.v.z>0){bd=d;best={x,y,z};}};
  for(const g of goblins)if(g.state==='chase'&&!g.civ&&g.root.visible&&g.hp>0)see(g.pos.x,g.pos.y+0.8,g.pos.z);
  for(const q of pvpFoes(pl))see(q.pos.x,q.pos.y+(q.gob?0.8:1.5),q.pos.z);
  return best;}
function updateFireballs(dt){
  if(!playing)return;
  for(const F of FIREB){if(!F.live)continue;F.t+=dt;const W=F.W,B=W.ball,sp=B.speed,pl=F.pl;
    // (a little magic in it: it bends gently toward its target, enough to follow a slow one, not a dodge)
    const n=fbTarget(F);
    if(n){const ex=n.x-F.pos.x,ey=n.y-F.pos.y,ez=n.z-F.pos.z,L=Math.hypot(ex,ey,ez)||1,k=Math.min(1,dt*B.bend);
      const vx=F.v.x+(ex/L*sp-F.v.x)*k,vy=F.v.y+(ey/L*sp-F.v.y)*k,vz=F.v.z+(ez/L*sp-F.v.z)*k,M=Math.hypot(vx,vy,vz)||1;F.v.set(vx/M*sp,vy/M*sp,vz/M*sp);}
    let done=false;const ns=Math.max(1,Math.ceil(sp*dt/0.3)),h=()=>{const m=Math.hypot(F.v.x,F.v.z)||1;return new V3(F.v.x/m,0.3,F.v.z/m);};
    for(let k=0;k<ns&&!done;k++){F.pos.addScaledVector(F.v,dt/ns);
      if(!pl){for(const p of players){if(!p.active||p.state==='dead')continue;if(p.dodge&&p.dodge.t<p.dodge.dur*0.85)continue;   // (mid-dodge: it flies on by)
        const hx=F.pos.x-p.pos.x,hz=F.pos.z-p.pos.z,hy=F.pos.y-p.pos.y;
        if(hx*hx+hz*hz<B.r*B.r&&hy>-0.3&&hy<2.4){shotPlayer(p,W.dmg,F.pos.clone(),h(),F.cause,F.by);done=true;break;}}}
      else{for(const g of goblins){if(g.state!=='chase'||!g.root.visible||!(g.hp>0))continue;const hx=F.pos.x-g.pos.x,hz=F.pos.z-g.pos.z,hy=F.pos.y-g.pos.y;
          if(hx*hx+hz*hz<B.rg*B.rg&&hy>-0.3&&hy<1.6){damageGoblin(g,W.dmg,F.pos.clone(),h(),F.cause);done=true;break;}}
        if(!done)for(const q of pvpFoes(pl)){const r=q.gob?B.rg:B.r,hx=F.pos.x-q.pos.x,hz=F.pos.z-q.pos.z,hy=F.pos.y-q.pos.y;
          if(hx*hx+hz*hz<r*r&&hy>-0.3&&hy<(q.gob?1.6:2.4)){pvpHurt(pl,q,W.dmg,F.pos.clone(),h(),W.player.pvp,{cd:0});done=true;break;}}}
      // (a vehicle in its way takes it as a round's worth: VEH_SHOT_K times the damage, through the blast's harm)
      if(!done&&pl){const s=sp*dt/ns,k=knockRay(F.pos.x-F.v.x/sp*s,F.pos.y-F.v.y/sp*s,F.pos.z-F.v.z/sp*s,F.v.x/sp,F.v.y/sp,F.v.z/sp,s);if(k)done=true;}   // (a player's bursts on a fixture or prop: fbBurst knocks it over)
      if(!done&&shotHitsVeh({pos:F.pos,own:null})){vehBlast(F.pos.x,F.pos.y,F.pos.z,1.5,W.dmg*VEH_SHOT_K,null);done=true;}
      if(!done&&(solidAt(F.pos.x,Math.floor(F.pos.y),F.pos.z)||F.pos.y<0))done=true;}
    if(done||F.t>B.life){fbBurst(F);continue;}
    F.g.position.copy(F.pos);F.g.rotation.x+=dt*7;F.g.rotation.y+=dt*5;F.halo.scale.setScalar(0.55+0.12*Math.sin(F.t*30));
    F.trail-=dt;if(F.trail<=0){F.trail=0.04;puff(F.pos.x,F.pos.y-0.15,F.pos.z,1,Math.random()<0.5?0xff7a1a:0xffc040,0.12);}
  }
}
function fbClear(){gobPickupsClear();minesClear();for(const F of FIREB){F.live=false;F.g.visible=false;}for(const S of SHOTS){S.live=false;S.g.visible=false;}for(const T of TRACERS)T.m.visible=false;}
// ---- bullets' tracers: a thin streak of light from the muzzle, gone in a moment ----
const TRACERS=[],TR_MAT=new THREE.MeshBasicMaterial({color:0xfff0a0});
function tracer(x0,y0,z0,x1,y1,z1){
  let T=TRACERS.find(o=>o.t<=0);if(!T){if(TRACERS.length>=24)T=TRACERS[0];else{const m=new THREE.Mesh(FB_GEO,TR_MAT);m.visible=false;scene.add(m);T={m,t:0};TRACERS.push(T);}}
  let cv=false;if(x0>=SHIP_X0){const S=shipOfPos(x0,z0);if(S){cv=true;shipToWorld(S,x0,z0,_sv);x0=_sv.x;z0=_sv.z;y0-=S.sk;shipToWorld(S,x1,z1,_sv);x1=_sv.x;z1=_sv.z;y1-=S.sk;}}   // (fired aboard a ship: drawn where that is)
  trPlace(T,x0,y0,z0,x1,y1,z1);T.m.visible=true;T.t=0.07;
  // (its start kept on the muzzle while it shows, tracerFollow: TR_FOL, set by fireRound for the round being fired, says
  // whose. A player's own shot on foot follows their view; a vehicle's gun, the vehicle (not one in a ship's pocket))
  const F=TR_FOL;T.fol=null;
  if(F&&F.p)T.fol={p:F.p,wk:F.wk,mz:F.mz,x1,y1,z1};
  else if(F&&F.o&&!cv){const q=F.o.pos||F.o;if(isFinite(q.x+q.y+q.z)&&q.x<SHIP_X0)T.fol={o:F.o,x0,y0,z0,ox:q.x,oy:q.y,oz:q.z,x1,y1,z1};}
}
// (the streak from x0,y0,z0 to x1,y1,z1; its light, the moving light and halo, is the muzzle flash: where it starts, the
// size of a flash, not the middle of the streak, which put the light out along the bullet's path: glowAt, glowR in block-light.js)
function trPlace(T,x0,y0,z0,x1,y1,z1){
  const L=Math.hypot(x1-x0,y1-y0,z1-z0)||0.01;T.m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);T.m.scale.set(0.05,0.05,L);T.m.lookAt(x1,y1,z1);
  const U=T.m.userData;(U.lp||(U.lp=new THREE.Vector3())).set(x0,y0,z0);U.lr=0.3;
}
// Tracers kept on the gun that fired them. A shot is fired in the players' step, before the view's placed for the frame,
// and the streak stays for a few frames after; left where it started, it trailed behind the muzzle of anyone moving
// (and well behind a jet's nose). So once every view's placed (the frame loop), each one's start is put back on its muzzle:
// a player's own, the barrel's tip as their view gun's posed now (gobMuzzle, or where it was taken from when fired) in the
// view as it's placed now; a vehicle's, moved on as far as the vehicle has. The far end stays where the round went.
// (And p.camAt: where each player stood when their view was placed, for gobEyeNow)
let TR_FOL=null;const _tfV=new THREE.Vector3(),_tfM=new Map();
function tracerFollow(){
  for(const p of players)if(p.active){const a=p.camAt||(p.camAt={x:0,y:0,z:0});a.x=p.pos.x;a.y=p.pos.y;a.z=p.pos.z;}
  _tfM.clear();
  for(const T of TRACERS){const F=T.fol;if(!F||!(T.t>0))continue;let x0,y0,z0;
    if(F.p){const p=F.p;if(!p.active||DT.freecam&&p===P1)continue;
      let C=_tfM.get(p);if(!C)_tfM.set(p,C={});
      if(!(F.wk in C))C[F.wk]=gobMuzzle(p,F.wk);
      const m=C[F.wk]||F.mz,K=p.camera;_tfV.set(m.x,m.y,m.z).applyQuaternion(K.quaternion).add(K.position);x0=_tfV.x;y0=_tfV.y;z0=_tfV.z;}   // (the camera has no parent: its own turn and place are its view's)
    else{const q=F.o.pos||F.o;x0=F.x0+q.x-F.ox;y0=F.y0+q.y-F.oy;z0=F.z0+q.z-F.oz;}
    if(isFinite(x0+y0+z0))trPlace(T,x0,y0,z0,F.x1,F.y1,F.z1);}
}
// ---- things thrown and fired that go off: grenades, tank shells, rockets. Each flies under gravity (a shell
// barely), a bomb bounces and rolls until its fuse is done; a shell or a rocket goes off on whatever it hits ----
// GREN_CRUSH: how far a grenade's blast knocks out blocks. (More than a tank shell's 2.6 on paper, but a shell goes off
// in the wall it hits, and a grenade's usually lying on the ground a step or two away when its fuse runs out: the ball's
// flattened underneath, so this takes a shallow crater and the foot of a wall within about 3 blocks)
const GREN_CRUSH=2.8;
const SHOTS=[],SHOT_LOOK={grenade:[[0.24,0.24,0.24],0x3a4a22],shell:[[0.28,0.28,0.7],0x2a2a24],rocket:[[0.22,0.22,0.9],0xd8d8d0],nuke:[[0.42,0.42,0.75],0x6f7f34],missile:[[0.2,0.2,0.75],0xe8e4d8]},SHOT_M={};
function shot(o){
  if(NET.mode===2&&NET.joined)return null;   // (a guest online: only the host's game fires shells, and they're shown here from its snapshots, netShotsPlace)
  let S=SHOTS.find(q=>!q.live&&q.kind===o.kind);
  if(!S){const L=SHOT_LOOK[o.kind],m=new THREE.Mesh(FB_GEO,SHOT_M[o.kind]||(SHOT_M[o.kind]=new THREE.MeshLambertMaterial({color:L[1]})));m.scale.set(...L[0]);m.visible=false;scene.add(m);S={kind:o.kind,g:m,pos:new V3(),v:new V3(),live:false};SHOTS.push(S);}
  Object.assign(S,{grav:o.grav,fuse:o.fuse??9,R:o.R,dmg:o.dmg,cause:o.cause,by:o.by||null,bounce:!!o.bounce,t:0,live:true,trail:0,crush:o.crush||0,vd:o.vd,own:o.own||null,ap:!!o.ap,hitB:false,tgt:o.tgt||null,chase:o.chase||null,at:o.at||null,sp:o.sp||0,turn:o.turn||0,skipP:o.skipP||null,gobs:!!o.gobs,bb:o.bb||0});   // (skipP: the player who fired it, not hit by it as it leaves; gobs: it goes off on a goblin it reaches, a rocket launcher's; bb: a nuke's big blast, its reach)
  S.pos.set(o.x,o.y,o.z);S.v.set(o.vx,o.vy,o.vz);S.g.position.copy(S.pos);S.g.visible=true;return S;
}
// a blast: the flash, smoke and noise, everyone near it hurt (less at the edge) and thrown, goblins too, maybe a crater
// (vd: the harm to vehicles at the middle, by default six times what it does to you; own: a vehicle it spares)
function foeBoom(x,y,z,R,dmg,cause,by,crush,vd,own){
  blastFx(x,y+0.5,z,0.5,R*0.3);
  smoke(x,y+0.5,z,6+Math.round(R*2),0x2e2e2e);puff(x,y,z,8,0xff8a2a,0.6);
  if(audio){noise(0.7,0.5,500,'lowpass');tone('sawtooth',90,24,0.7,0.16);}addShake(0.25+R*0.08,x,z,R*8);
  for(const q of players){if(!q.active||q.state==='dead')continue;const dx=q.pos.x-x,dz=q.pos.z-z,dy=q.pos.y+1-y,d3=Math.hypot(dx,dz,dy);if(d3>R)continue;
    // (by, for a player's shot with PvP on, is that player: see pvpBy. Their own blast isn't blamed on them)
    const h=Math.hypot(dx,dz)||1,pk=by&&by.pvp,alive=q.state!=='dead';damagePlayer(q,Math.max(1,Math.round(dmg*(1-0.6*d3/R))),new V3(q.pos.x,q.pos.y+1,q.pos.z),new V3(dx/h,0.6,dz/h),cause,pk===q?undefined:by);
    if(pk&&pk!==q&&alive&&q.state==='dead')pvpKilled(pk,q);}
  hitGoblins(x,z,R,dmg,cause,y);vehBlast(x,y,z,R*1.15,vd??dmg*6,own);mineArea(x,z,R,y,by);knockAt(x,y,z,R);   // (and any landmine it reaches goes up too; fixtures and props go over)
  if(crush)crushBall(x,y,z,crush);
}
// (a guest online runs this alone: its tracers fade on their own, and the host's shells are shown it from the snapshots)
function tracerTick(dt){for(const T of TRACERS)if(T.t>0){T.t-=dt;if(T.t<=0)T.m.visible=false;}}
function updateShots(dt){
  tracerTick(dt);
  if(!playing)return;
  for(const S of SHOTS){if(!S.live)continue;S.t+=dt;S.fuse-=dt;
    // (a nuke's warhead has no fuse: it flies on till it meets something, or it would go off in the air and be carved at the
    // ground under it, short of where it was going)
    let boom=!S.bb&&S.fuse<=0;if(S.tgt||S.chase||S.at)boom=shotSteer(S,dt)||boom;const ns=Math.max(1,Math.ceil(Math.hypot(S.v.x,S.v.y,S.v.z)*dt/0.4));
    for(let k=0;k<ns&&!boom;k++){const h=dt/ns;S.v.y-=S.grav*h;const nx=S.pos.x+S.v.x*h,ny=S.pos.y+S.v.y*h,nz=S.pos.z+S.v.z*h;
      if(hardAt(nx,ny,nz)||ny<1){
        if(!S.bounce){boom=true;S.hitB=true;break;}
        // (a bomb: off the ground it bounces low and rolls; off a wall it comes back)
        if(!hardAt(nx,S.pos.y,nz)){S.v.y=-S.v.y*0.3;S.v.x*=0.55;S.v.z*=0.55;if(Math.abs(S.v.y)<1.2)S.v.y=0;S.pos.x=nx;S.pos.z=nz;}
        else{S.v.x*=-0.4;S.v.z*=-0.4;}continue;}
      S.pos.set(nx,ny,nz);
      if(S.bb&&nx<SHIP_X0&&get(nx,Math.floor(ny),nz)===WATER){boom=true;break;}   // (a nuke goes off as it hits the water: sunk to the sea bed first, its crater cut the coast round it down below the sea)
      // (a shell or a rocket goes off on whoever it reaches, too)
      if(!S.bounce)for(const q of players){if(!q.active||q.state==='dead'||q.drv&&q.drv.o===S.own||q===S.skipP&&S.t<0.6)continue;const hx=S.pos.x-q.pos.x,hz=S.pos.z-q.pos.z,hy=S.pos.y-q.pos.y;if(hx*hx+hz*hz<1.6*1.6&&hy>-0.3&&hy<2.4){boom=true;break;}}
      if(!S.bounce&&!boom&&S.gobs)for(const g of goblins){if(g.state!=='chase'||!g.root.visible)continue;const hx=S.pos.x-g.pos.x,hz=S.pos.z-g.pos.z,hy=S.pos.y-g.pos.y;if(hx*hx+hz*hz<0.7*0.7&&hy>-0.2&&hy<1.6){boom=true;break;}}
      if(!S.bounce&&!boom&&shotHitsVeh(S))boom=true;
      if(!S.bounce&&!boom&&knockRay(S.pos.x-S.v.x*h,S.pos.y-S.v.y*h,S.pos.z-S.v.z*h,S.v.x*h,S.v.y*h,S.v.z*h,1))boom=true;}   // (a fixture or prop in its way: it goes off on it, and foeBoom knocks it over)
    if(boom||S.t>(S.bb?120:12)){S.live=false;S.g.visible=false;if(S.ap&&S.hitB)apTunnel(S);impX=S.imp||1;   // (an AP shell into a wall bores on: tank-handling.js)
     foeBoom(S.pos.x,S.pos.y,S.pos.z,S.R,S.dmg,S.cause,S.by,S.crush,S.vd,S.own);impX=1;
     if(S.bb)shotNuke(S);continue;}   // (imp: how much a heavy shell fills an impact meter: see impHit)
    if(S.pos.x>=SHIP_X0)shipShotOut(S);   // (fired from aboard a ship and gone over its side: out into the world)
    S.g.position.copy(S.pos);
    if(S.bounce){S.g.rotation.x+=dt*Math.hypot(S.v.x,S.v.z)*1.5;S.trail-=dt;if(S.trail<=0){S.trail=0.08;puff(S.pos.x,S.pos.y+0.1,S.pos.z,1,0x9a9a8a,0.08);}}   // (the fuse fizzing)
    else{const h=Math.hypot(S.v.x,S.v.z);S.g.rotation.set(-Math.atan2(S.v.y,h),Math.atan2(S.v.x,S.v.z),0,'YXZ');S.trail-=dt;if(S.trail<=0){S.trail=0.03;smoke(S.pos.x,S.pos.y,S.pos.z,1,S.kind==='rocket'?0xdadada:0x6a6a6a);}}
    if(S.pos.x>=SHIP_X0){shipPt(S.g.position);S.g.rotation.y+=shipYawAt(S.pos.x,S.pos.z);}   // (still aboard: drawn where that is on the ship)
  }
}
// a nuke's warhead landing: a big blast (big-blast.js) at street level under it, or lower if it's come down in a
// hole. Its goblin kills are the weapon's (so they count as the player's), and with PvP on a player it kills is blamed on
// whoever fired it; the one who fired it is caught in it like anyone else
// (its reach: the debug menu's Nuke strength if it's been set, else the warhead's own: options-debug.js)
const nukeR=()=>DT.nukeR||WEAPONS.nuke.nuke;
// (on a ship, out in the world where the ship really is: bigBlast carves the ships it reaches, bbShips. On the water, or on a
// ship, at sea level, as on a street)
function shotNuke(S){
  const P=bbWorldPt(S.pos.x,S.pos.y,S.pos.z);let y=Math.max(1,Math.min(Math.round(P.y),G+1));
  if(get(P.x,y,P.z)===WATER||get(P.x,y-1,P.z)===WATER)y=G+1;
  const J=bigBlast(P.x,y,P.z,DT.nukeR||S.bb);
  if(J&&J.C){J.by=S.by;J.cause=S.cause;}}
// a homing missile (a Mobile Gear's): for a moment it flies as launched, then speeds up to S.sp and turns, at most
// S.turn a second, after its target (S.tgt, while it lives) or the spot it was sent at (S.at). True once it's on
// the target, to go off
function shotSteer(S,dt){
  let x,y,z;const T=S.tgt;
  if(T&&!lockAlive(T))S.tgt=null;
  if(S.tgt){x=T.pos.x;y=lockY(T);z=T.pos.z;}
  else if(S.chase){const c=S.chase();if(!c){S.chase=null;return false;}x=c.x;y=c.y;z=c.z;if(Math.hypot(x-S.pos.x,y-S.pos.y,z-S.pos.z)<1.4)return true;}   // (a point that moves: a carrier's missile after someone)
  else if(S.at){x=S.at.x;y=S.at.y;z=S.at.z;}else return false;
  const dx=x-S.pos.x,dy=y-S.pos.y,dz=z-S.pos.z,d=Math.hypot(dx,dy,dz)||0.01;
  if(S.tgt&&d<(isMilT(T)||T.isMountT||T.isJetT?2.4:isCarT(T)?1.6:1.2))return true;
  if(S.t<0.25)return false;
  const v=S.v,sp=Math.min(S.sp,Math.hypot(v.x,v.y,v.z)+S.sp*2*dt),L=Math.hypot(v.x,v.y,v.z)||1,k=Math.min(1,S.turn*dt);
  let ux=v.x/L+(dx/d-v.x/L)*k,uy=v.y/L+(dy/d-v.y/L)*k,uz=v.z/L+(dz/d-v.z/L)*k;const U=Math.hypot(ux,uy,uz)||1;
  v.set(ux/U*sp,uy/U*sp,uz/U*sp);return false;}
const vReach=(dy,r)=>dy>-Math.max(2.5,r*0.45)&&dy<Math.max(3,r*0.6);   // how far below/above the source an area hit still reaches
function hitGoblins(x,z,r,n,cause,y){if(y!==undefined)dbgHit('dmg','cap',dbgCap(x,y,z,r));for(const g of goblins){if(g.state!=='chase')continue;const dx=g.pos.x-x,dz=g.pos.z-z,dy=y===undefined?0:g.pos.y-y,d=Math.hypot(dx,dz)||0.01;if(Math.hypot(d,dy)<r&&(y===undefined||vReach(dy,r)))damageGoblin(g,n,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(dx/d,0.6,dz/d),cause);}}
// every car has someone at the wheel
// (look: how they're dressed, shown at the wheel (dhSync, cars.js) and on whoever's hauled out or killed. From a
// sequence of its own, drvRnd, so a car changing hands doesn't move on everything else's Math.random)
let DRV_S=12345;const drvRnd=()=>{DRV_S=(DRV_S*16807)%2147483647;return(DRV_S-1)/2147483646;};
function makeDriver(police){
  const look=lookNew(!police,false,drvRnd);if(police)lookCop(look);
  return{name:pick(GOB.first)+' '+pick(GOB.last),age:17+Math.floor(Math.random()*70),occ:police?'Police officer':pick(['Commuter','Delivery driver','Cab driver','Pizza courier','Getaway driver','Joyrider','Tow-truck moonlighter','Lost tourist']),
    hobby:pick(GOB.hobby),quirk:pick(GOB.quirk),civ:!police,look};
}
function dropGoblinCorpse(x,y,z,driver){
  const g=goblins.find(o=>o.state==='wait'&&!o.civ&&!o.special);if(!g)return;
  g.pos.set(x,y,z);g.kv.set(0,0,0);g.vy=0;g.hp=g.hpMax=1;g.state='chase';g.root.visible=true;g.root.rotation.set(0,0,0);g.heading=Math.random()*6.28;
  // the body that drops out of the wreck is that car's driver
  const D=driver||makeDriver(false);
  g.id=makeIdentity(g,D.look?(applyLook(g,D.look,ES),D.look):dressGoblin(g));Object.assign(g.id,{name:D.name,age:D.age,occ:D.occ,hobby:D.hobby,quirk:D.quirk,civ:D.civ});
  damageGoblin(g,99,new V3(x,y+1,z),new V3(0,1,0),'Killed when their car exploded');
}
