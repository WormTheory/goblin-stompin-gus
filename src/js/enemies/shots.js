// ---- cultists' fireballs: a glowing ball flying at the hippo, bending a little after him; two hearts if it hits, a burst
// of flame against anything solid ----
const FIREB=[],FB_SPEED=15,FB_GEO=new THREE.BoxGeometry(1,1,1),FB_CORE=new THREE.MeshBasicMaterial({color:0xffe070}),FB_HALO=new THREE.MeshBasicMaterial({color:0xff4a10,transparent:true,opacity:0.55,depthWrite:false});
function fireball(x,y,z,tx,ty,tz,by){
  let F=FIREB.find(f=>!f.live);
  if(!F){if(FIREB.length>=24)return null;const g=new THREE.Group(),c=new THREE.Mesh(FB_GEO,FB_CORE),h=new THREE.Mesh(FB_GEO,FB_HALO);c.scale.setScalar(0.32);h.scale.setScalar(0.6);g.add(c);g.add(h);g.visible=false;scene.add(g);
    F={g,halo:h,pos:new V3(),v:new V3(),t:0,live:false,by:null,trail:0};FIREB.push(F);}
  F.pos.set(x,y,z);{const ex=tx-x,ey=ty-y,ez=tz-z,L=Math.hypot(ex,ey,ez);if(L<1e-3)F.v.set(0,0,FB_SPEED);else F.v.set(ex/L*FB_SPEED,ey/L*FB_SPEED,ez/L*FB_SPEED);}
  F.t=0;F.live=true;F.by=by||null;F.trail=0;F.g.position.copy(F.pos);F.g.visible=true;
  if(audio)noise(0.35,0.05,900,'bandpass');
  return F;
}
function fbBurst(F){
  F.live=false;F.g.visible=false;
  puff(F.pos.x,F.pos.y-0.15,F.pos.z,9,0xff6a10,0.45);puff(F.pos.x,F.pos.y-0.15,F.pos.z,5,0xffd040,0.3);
  if(audio)tone('sawtooth',170,45,0.35,0.06);
}
function updateFireballs(dt){
  if(!playing)return;
  for(const F of FIREB){if(!F.live)continue;F.t+=dt;
    // (a little magic in it: it bends gently toward the nearest hippo, enough to follow a slow one, not a dodge)
    const n=nearestPlayer(F.pos.x,F.pos.z);
    if(n&&n.d<40){const ex=n.p.pos.x-F.pos.x,ey=n.p.pos.y+1.5-F.pos.y,ez=n.p.pos.z-F.pos.z,L=Math.hypot(ex,ey,ez)||1,k=Math.min(1,dt*0.6);
      const vx=F.v.x+(ex/L*FB_SPEED-F.v.x)*k,vy=F.v.y+(ey/L*FB_SPEED-F.v.y)*k,vz=F.v.z+(ez/L*FB_SPEED-F.v.z)*k,M=Math.hypot(vx,vy,vz)||1;F.v.set(vx/M*FB_SPEED,vy/M*FB_SPEED,vz/M*FB_SPEED);}
    let done=false;const ns=Math.max(1,Math.ceil(FB_SPEED*dt/0.3));
    for(let k=0;k<ns&&!done;k++){F.pos.addScaledVector(F.v,dt/ns);
      for(const p of players){if(!p.active||p.state==='dead')continue;if(p.dodge&&p.dodge.t<p.dodge.dur*0.85)continue;   // (mid-dodge: it flies on by)
        const hx=F.pos.x-p.pos.x,hz=F.pos.z-p.pos.z,hy=F.pos.y-p.pos.y;
        if(hx*hx+hz*hz<1.4*1.4&&hy>-0.3&&hy<2.4){const h=Math.hypot(F.v.x,F.v.z)||1;damagePlayer(p,2,F.pos.clone(),new V3(F.v.x/h,0.3,F.v.z/h),"Burned up by a cultist's fireball",F.by);done=true;break;}}
      if(!done&&(solidAt(F.pos.x,Math.floor(F.pos.y),F.pos.z)||F.pos.y<0))done=true;}
    if(done||F.t>3.5){fbBurst(F);continue;}
    F.g.position.copy(F.pos);F.g.rotation.x+=dt*7;F.g.rotation.y+=dt*5;F.halo.scale.setScalar(0.55+0.12*Math.sin(F.t*30));
    F.trail-=dt;if(F.trail<=0){F.trail=0.04;puff(F.pos.x,F.pos.y-0.15,F.pos.z,1,Math.random()<0.5?0xff7a1a:0xffc040,0.12);}
  }
}
function fbClear(){for(const F of FIREB){F.live=false;F.g.visible=false;}for(const S of SHOTS){S.live=false;S.g.visible=false;}for(const T of TRACERS)T.m.visible=false;}
// ---- bullets' tracers: a thin streak of light from the muzzle, gone in a moment ----
const TRACERS=[],TR_MAT=new THREE.MeshBasicMaterial({color:0xfff0a0});
function tracer(x0,y0,z0,x1,y1,z1){
  let T=TRACERS.find(o=>o.t<=0);if(!T){if(TRACERS.length>=24)T=TRACERS[0];else{const m=new THREE.Mesh(FB_GEO,TR_MAT);m.visible=false;scene.add(m);T={m,t:0};TRACERS.push(T);}}
  const L=Math.hypot(x1-x0,y1-y0,z1-z0)||0.01;T.m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);T.m.scale.set(0.05,0.05,L);T.m.lookAt(x1,y1,z1);T.m.visible=true;T.t=0.07;
}
// ---- things thrown and fired that go off: pipe bombs, grenades, tank shells, rockets. Each flies under gravity (a shell
// barely), a bomb bounces and rolls until its fuse is done; a shell or a rocket goes off on whatever it hits ----
const SHOTS=[],SHOT_LOOK={pipe:[[0.14,0.14,0.36],0x8a8a90],grenade:[[0.24,0.24,0.24],0x3a4a22],shell:[[0.28,0.28,0.7],0x2a2a24],rocket:[[0.22,0.22,0.9],0xd8d8d0]},SHOT_M={};
function shot(o){
  let S=SHOTS.find(q=>!q.live&&q.kind===o.kind);
  if(!S){const L=SHOT_LOOK[o.kind],m=new THREE.Mesh(FB_GEO,SHOT_M[o.kind]||(SHOT_M[o.kind]=new THREE.MeshLambertMaterial({color:L[1]})));m.scale.set(...L[0]);m.visible=false;scene.add(m);S={kind:o.kind,g:m,pos:new V3(),v:new V3(),live:false};SHOTS.push(S);}
  Object.assign(S,{grav:o.grav,fuse:o.fuse??9,R:o.R,dmg:o.dmg,cause:o.cause,by:o.by||null,bounce:!!o.bounce,t:0,live:true,trail:0,crush:o.crush||0,vd:o.vd,own:o.own||null});
  S.pos.set(o.x,o.y,o.z);S.v.set(o.vx,o.vy,o.vz);S.g.position.copy(S.pos);S.g.visible=true;return S;
}
// a blast: the flash, smoke and noise, everyone near it hurt (less at the edge) and thrown, goblins too, maybe a crater
// (vd: the harm to vehicles at the middle, by default six times what it does to you; own: a vehicle it spares)
function foeBoom(x,y,z,R,dmg,cause,by,crush,vd,own){
  const bl=blasts[blastIdx++%blasts.length];bl.t=0.5;bl.s=R*0.3;for(const f of bl.m){f.position.set(x,y+0.5,z);f.visible=true;}
  smoke(x,y+0.5,z,6+Math.round(R*2),0x2e2e2e);puff(x,y,z,8,0xff8a2a,0.6);
  if(audio){noise(0.7,0.5,500,'lowpass');tone('sawtooth',90,24,0.7,0.16);}addShake(0.25+R*0.08,x,z,R*8);
  for(const q of players){if(!q.active||q.state==='dead')continue;const dx=q.pos.x-x,dz=q.pos.z-z,dy=q.pos.y+1-y,d3=Math.hypot(dx,dz,dy);if(d3>R)continue;
    const h=Math.hypot(dx,dz)||1;damagePlayer(q,Math.max(1,Math.round(dmg*(1-0.6*d3/R))),new V3(q.pos.x,q.pos.y+1,q.pos.z),new V3(dx/h,0.6,dz/h),cause,by);}
  hitGoblins(x,z,R,dmg,cause,y);vehBlast(x,y,z,R*1.15,vd??dmg*6,own);
  if(crush)crushBall(x,y,z,crush);
}
function updateShots(dt){
  for(const T of TRACERS)if(T.t>0){T.t-=dt;if(T.t<=0)T.m.visible=false;}
  if(!playing)return;
  for(const S of SHOTS){if(!S.live)continue;S.t+=dt;S.fuse-=dt;
    let boom=S.fuse<=0;const ns=Math.max(1,Math.ceil(Math.hypot(S.v.x,S.v.y,S.v.z)*dt/0.4));
    for(let k=0;k<ns&&!boom;k++){const h=dt/ns;S.v.y-=S.grav*h;const nx=S.pos.x+S.v.x*h,ny=S.pos.y+S.v.y*h,nz=S.pos.z+S.v.z*h;
      if(solidAt(nx,Math.floor(ny),nz)||ny<1){
        if(!S.bounce){boom=true;break;}
        // (a bomb: off the ground it bounces low and rolls; off a wall it comes back)
        if(!solidAt(nx,Math.floor(S.pos.y),nz)){S.v.y=-S.v.y*0.3;S.v.x*=0.55;S.v.z*=0.55;if(Math.abs(S.v.y)<1.2)S.v.y=0;S.pos.x=nx;S.pos.z=nz;}
        else{S.v.x*=-0.4;S.v.z*=-0.4;}continue;}
      S.pos.set(nx,ny,nz);
      // (a shell or a rocket goes off on whoever it reaches, too)
      if(!S.bounce)for(const q of players){if(!q.active||q.state==='dead'||q.drv&&q.drv.o===S.own)continue;const hx=S.pos.x-q.pos.x,hz=S.pos.z-q.pos.z,hy=S.pos.y-q.pos.y;if(hx*hx+hz*hz<1.6*1.6&&hy>-0.3&&hy<2.4){boom=true;break;}}
      if(!S.bounce&&!boom&&shotHitsVeh(S))boom=true;}
    if(boom||S.t>12){S.live=false;S.g.visible=false;foeBoom(S.pos.x,S.pos.y,S.pos.z,S.R,S.dmg,S.cause,S.by,S.crush,S.vd,S.own);continue;}
    S.g.position.copy(S.pos);
    if(S.bounce){S.g.rotation.x+=dt*Math.hypot(S.v.x,S.v.z)*1.5;S.trail-=dt;if(S.trail<=0){S.trail=0.08;puff(S.pos.x,S.pos.y+0.1,S.pos.z,1,S.kind==='pipe'?0xffd040:0x9a9a8a,0.08);}}   // (the fuse fizzing)
    else{const h=Math.hypot(S.v.x,S.v.z);S.g.rotation.set(-Math.atan2(S.v.y,h),Math.atan2(S.v.x,S.v.z),0,'YXZ');S.trail-=dt;if(S.trail<=0){S.trail=0.03;smoke(S.pos.x,S.pos.y,S.pos.z,1,S.kind==='rocket'?0xdadada:0x6a6a6a);}}
  }
}
const vReach=(dy,r)=>dy>-Math.max(2.5,r*0.45)&&dy<Math.max(3,r*0.6);   // how far below/above the source an area hit still reaches
function hitGoblins(x,z,r,n,cause,y){if(y!==undefined)dbgHit('dmg','cap',dbgCap(x,y,z,r));for(const g of goblins){if(g.state!=='chase')continue;const dx=g.pos.x-x,dz=g.pos.z-z,dy=y===undefined?0:g.pos.y-y,d=Math.hypot(dx,dz)||0.01;if(Math.hypot(d,dy)<r&&(y===undefined||vReach(dy,r)))damageGoblin(g,n,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(dx/d,0.6,dz/d),cause);}}
// every car has someone at the wheel
function makeDriver(police){
  return{name:pick(GOB.first)+' '+pick(GOB.last),age:17+Math.floor(Math.random()*70),occ:police?'Police officer':pick(['Commuter','Delivery driver','Cab driver','Pizza courier','Getaway driver','Joyrider','Tow-truck moonlighter','Lost tourist']),
    hobby:pick(GOB.hobby),quirk:pick(GOB.quirk),civ:!police};
}
function dropGoblinCorpse(x,y,z,driver){
  const g=goblins.find(o=>o.state==='wait'&&!o.civ&&!o.special);if(!g)return;
  g.pos.set(x,y,z);g.kv.set(0,0,0);g.vy=0;g.hp=g.hpMax=1;g.state='chase';g.root.visible=true;g.root.rotation.set(0,0,0);g.heading=Math.random()*6.28;
  // the body that drops out of the wreck is that car's driver
  const D=driver||makeDriver(false);
  g.id=makeIdentity(g,dressGoblin(g));Object.assign(g.id,{name:D.name,age:D.age,occ:D.occ,hobby:D.hobby,quirk:D.quirk,civ:D.civ});
  damageGoblin(g,99,new V3(x,y+1,z),new V3(0,1,0),'Killed when their car exploded');
}
