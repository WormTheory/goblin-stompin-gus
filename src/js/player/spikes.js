// ---- ground spikes: as the stomp lands, spikes of earth burst up one after another in a line ahead of him (one for a
// plain stomp, two charged, three at full charge), each bigger than the one before.
// Each comes up out of the ground (smashing anything built on top of it there) and throws goblins and cars into the
// air, then stands a moment and sinks back into the ground ----
const SPIKES=[];
// (stone: the world's own stone texture, cut out of the block atlas so it can repeat once per block across each face,
// a little darker toward the root)
const SPIKE_TEX=(()=>{const t=BLOCK[STONE].tiles[2],c=document.createElement('canvas');c.width=c.height=T;
  try{c.getContext('2d').drawImage(atlas,(t%AC)*T,Math.floor(t/AC)*T,T,T,0,0,T,T);}catch(e){}
  const x=new THREE.CanvasTexture(c);x.wrapS=x.wrapT=THREE.RepeatWrapping;x.magFilter=THREE.NearestFilter;x.minFilter=THREE.NearestFilter;return x;})();
const SPIKE_MAT=[0x8c8c8c,0xa6a6a6,0xbdbdbd,0xd6d6d6].map(c=>new THREE.MeshLambertMaterial({color:c,map:SPIKE_TEX}));
// a box whose texture repeats once per block on every face
function spikeBox(w,h,d){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes&&g.attributes.uv;if(!uv)return g;
  const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*dims[f][0],uv.getY(i)*dims[f][1]);}
  return g;}
function groundSpikes(p,lvl){
  const A=AB.groundSpike,fx=Math.sin(p.heading),fz=Math.cos(p.heading);let d=2.6;
  for(let i=0;i<=lvl;i++){
    // (spaced as for spikes 30% bigger than they are)
    // (how hard the stomp was only decides how many spikes there are: each one's size -- and so its crater and how hard
    // it throws -- goes by its place in the line. The spacing's left as it was, wider the harder the stomp)
    const r0=(3+i*1.8)*(1+0.22*lvl)*A.size*0.32,h=(3+i*1.8)*0.7*A.size,r=h*0.32;d+=r0+0.4;
    const x=p.pos.x+fx*d,z=p.pos.z+fz*d,gy=spikeGround(x,z,r,p.pos.y);d+=r0+0.6;
    if(gy===null)continue;   // (no open ground there to rise out of)
    // (its root a block down in the ground: it comes up out of a crater of its own)
    const S={x,z,y:gy-1,h,r,delay:0.05+i*0.13,t:0,p,dx:fx,dz:fz,done:false,g:null};
    if(SBX){spikeHit(S);continue;}
    SPIKES.push(S);}
}
// where a spike comes up: out of the ground itself -- the earth, a road or pavement, a building's ground floor -- at
// about his own level. Anything built on top of it there (a wall, a bench, a parked trailer) isn't ground: the spike
// comes up underneath it and smashes it out of the way. Checked at the middle and round the edge of its base; the
// ground's height, or null where there's none near his level (up a bank, or over a real drop)
const SPIKE_EARTH=new Set([GRASS,DIRT,SAND,STONE,GRAVEL,CLAY]);
function spikeGround(x,z,r,y0){
  let gy=null;
  for(const [a,b] of [[0,0],[r*0.6,0],[-r*0.6,0],[0,r*0.6],[0,-r*0.6]]){
    const px=Math.floor(x+a),pz=Math.floor(z+b);let g=null;
    for(let yy=Math.floor(y0+2);yy>=Math.floor(y0-5);yy--){const b=get(px,yy,pz);if(!b||!BLOCK[b]||!BLOCK[b].solid)continue;
      if(yy<=G||SPIKE_EARTH.has(b)){g=yy+1;break;}}                                // (the ground: anything above it is in the way)
    if(g===null)return null;
    if(g-y0>2.2||y0-g>4.5)return null;                                            // (up a bank, or a real drop -- the stomp's own crater is fine)
    if(gy===null||g>gy)gy=g;}
  return gy;
}
function spikeHit(S){
  const A=AB.groundSpike,y=S.y;
  // it bursts up through anything standing there (the ground it comes out of stays)
  if(!hbOn('groundSpike')){{const R=0.9+S.r*0.75;crush(S.x,y,S.z,Math.ceil(R),0,Math.ceil(S.h),{force:1.5,dx:0,dz:0,up:2,round:R});}   // (a round hole, smashing whatever stands where it comes up)
    dbgHit('dmg','cap',dbgCap(S.x,y,S.z,S.r+A.hitR));
    for(const g of goblins){if(g.state!=='chase')continue;const dx=g.pos.x-S.x,dz=g.pos.z-S.z,dd=Math.hypot(dx,dz)||0.01,dy=g.pos.y-y;
      if(dd<S.r+A.hitR&&dy>-1.5&&dy<S.h){damageGoblin(g,A.dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(dx/dd*0.35,1.3,dz/dd*0.35),'Skewered by a ground spike');g.vy=Math.max(g.vy||0,A.launch*(0.8+S.h*0.04));}}
    for(const c of carsNear(S.x,S.z,S.r+A.hitR,y)){const away=new V3(c.pos.x-S.x,0,c.pos.z-S.z);damageCar(c,A.carDmg,away);if(c.alive)launchCar(c,A.launch*(0.7+S.h*0.04),away.lengthSq()>0.01?away.normalize():new V3(S.dx,0,S.dz),2);clang();}}
}
function spikeMesh(S){
  // a stepped cone of earth: stacked boxes, each narrower than the one below, darker at the root and paler at the tip
  const g=new THREE.Group(),N=Math.max(3,Math.round(S.h/1.2));
  for(let i=0;i<N;i++){const k=i/N,w=S.r*2*(1-k*0.85),hh=S.h/N,m=new THREE.Mesh(spikeBox(w,hh+0.02,w),SPIKE_MAT[Math.min(3,Math.floor(k*4))]);
    m.position.y=hh*(i+0.5);m.rotation.y=(i%2)*0.35;g.add(m);}
  const tip=new THREE.Mesh(spikeBox(S.r*0.25,S.h*0.18,S.r*0.25),SPIKE_MAT[3]);tip.position.y=S.h+S.h*0.06;g.add(tip);
  g.position.set(S.x,S.y-S.h,S.z);scene.add(g);return g;
}
function updateSpikes(dt){
  for(let i=SPIKES.length-1;i>=0;i--){const S=SPIKES[i];
    if(S.delay>0){S.delay-=dt;if(S.delay>0)continue;
      // bursting up: the hit, a spray of dirt, a crack of sound
      S.g=spikeMesh(S);spikeHit(S);puff(S.x,S.y,S.z,10+Math.round(S.h*2),0x7a5f44,S.r*0.9);
      for(let k=0;k<6;k++){const d=debris[(debrisIdx++)%debris.length];d.m.position.set(S.x+(Math.random()-.5)*S.r,S.y+0.3,S.z+(Math.random()-.5)*S.r);d.v.set((Math.random()-.5)*6,6+Math.random()*6,(Math.random()-.5)*6);d.spin.set(Math.random()*8,Math.random()*8,Math.random()*8);d.life=3;d.m.visible=true;}
      thud(Math.min(1,0.35+S.h*0.06));noise(0.3,0.12,500,'lowpass');addShake(Math.min(0.5,0.1+S.h*0.03),S.x,S.z,24);continue;}
    S.t+=dt;const RISE=0.12,HOLD=1.5,SINK=0.55;let e;
    if(S.t<RISE){const u=S.t/RISE;e=1-(1-u)*(1-u)*(1-u);}else if(S.t<RISE+HOLD)e=1;else e=Math.max(0,1-(S.t-RISE-HOLD)/SINK);
    S.g.position.y=S.y-S.h*(1-e)+(S.t<RISE+0.08?Math.sin(S.t*90)*0.04:0);
    if(S.t>RISE+HOLD+SINK){scene.remove(S.g);S.g.traverse(m=>{if(m.geometry)m.geometry.dispose();});SPIKES.splice(i,1);}}
}
// expanding rings along the ground where the rump lands
const shocks=[];
{const geo=new THREE.RingGeometry(0.82,1,40);for(let i=0;i<6;i++){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xf2efe6,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);shocks.push({m,t:0,d:0,r:1,life:0.45});}}
// expanding rings: flat on the ground, or (with face = a heading) standing upright facing that way, like a sonic boom in mid-air
function shockwave(x,y,z,r,face,life0){if(SBX)return;
  const L=life0||0.45;
  [[0,r,L],[0.07,r*0.6,L*0.78]].forEach(([delay,rr,life])=>{const s=shocks.find(o=>o.t<=0&&o.d<=0)||shocks[0];s.d=delay;s.t=life;s.life=life;s.r=rr;
    if(face===undefined){s.m.rotation.set(-Math.PI/2,0,0);s.m.position.set(x,y+0.08,z);}else{s.m.rotation.set(0,face,0);s.m.position.set(x,y,z);}
    s.m.scale.setScalar(0.3);s.m.material.opacity=0;s.m.visible=true;});
}
// a cone-shaped burst: point at the launch spot, flaring out backwards along the path, left behind as the hippo flies off
const cones=[];
{const geo=new THREE.ConeGeometry(1,1,28,1,true);for(let i=0;i<4;i++){const g=new THREE.Group(),m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xf2efe6,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=Math.PI/2;g.add(m);g.visible=false;scene.add(g);cones.push({g,m,t:0,life:0.35,d:0,R:1,Lm:1});}}
function shockCone(x,y,z,heading,R,len,life){if(SBX)return;
  [[0,1,1],[0.05,0.68,0.8]].forEach(([delay,k,lk])=>{const c=cones.find(o=>o.t<=0&&o.d<=0)||cones[0];c.d=delay;c.t=c.life=life*lk;c.R=R*k;c.Lm=len*k;c.g.position.set(x,y,z);c.g.rotation.set(0,heading,0);c.m.material.opacity=0;c.m.scale.set(0.05,0.05,0.05);c.g.visible=true;});
}
function updateCones(dt){for(const c of cones){if(c.t<=0)continue;if(c.d>0){c.d-=dt;continue;}c.t-=dt;const k=1-Math.max(0,c.t)/c.life,e=1-(1-k)*(1-k),r=0.12+c.R*e,l=0.3+c.Lm*e;c.m.scale.set(r,l,r);c.m.position.z=-l/2;c.m.material.opacity=0.55*(1-k);if(c.t<=0)c.g.visible=false;}}
function updateShocks(dt){for(const s of shocks){if(s.t<=0)continue;if(s.d>0){s.d-=dt;continue;}s.t-=dt;const k=1-Math.max(0,s.t)/s.life,e=1-(1-k)*(1-k);s.m.scale.setScalar(0.3+s.r*e);s.m.material.opacity=0.8*(1-k);if(s.t<=0)s.m.visible=false;}}
// a hard landing (or a ground pound) blasts a crater and flattens whatever's nearby; higher drops hit harder
const ROCKET_RISE=3.2,ROCKET_STAM=16,ROCKET_LEAN=0.2;   // (ROCKET_LEAN: the most the body leans into the way he's moving, radians; the legs swing the rest)
// the rockets' roar: a loop of filtered noise per hippo, faded in and out (and left running silent between boosts)
let rocketBuf=null;
function rocketSound(p,on){if(SBX||!audio)return;
  try{const R=p.rkSnd;
    if(on&&!R){if(!rocketBuf){const n=audio.sampleRate*2|0;rocketBuf=audio.createBuffer(1,n,audio.sampleRate);const ch=rocketBuf.getChannelData(0);let b=0;for(let i=0;i<n;i++){b=b*0.6+(Math.random()*2-1)*0.4;ch[i]=b;}}
      const src=audio.createBufferSource(),f=audio.createBiquadFilter(),f2=audio.createBiquadFilter(),g=audio.createGain();src.buffer=rocketBuf;src.loop=true;
      f.type='lowpass';f.frequency.value=900;f2.type='peaking';f2.frequency.value=180;f2.gain.value=9;g.gain.value=0;
      src.connect(f).connect(f2).connect(g).connect(audio.destination);src.start();p.rkSnd={src,f,g};}
    const S=p.rkSnd;if(!S)return;const t=audio.currentTime;
    S.g.gain.setTargetAtTime(on?0.11:0,t,on?0.05:0.06);if(on&&DT.sndList)sndNote(0.1,'Rocket boost');
    if(on)S.f.frequency.setTargetAtTime(750+Math.random()*350,t,0.03);
  }catch(e){}}   // rocket boost: its slow climb (blocks/s) and its stamina cost (per second)
const LJ_GRACE=0.1;   // (a dash set off by tapping dash/sprint can still be turned into a long jump this soon after it starts)
const POUND_BONUS=[0,9,20],CRASH_T=0.5,DODGE_TAP=0.2;   // (a press of the trample button let go within DODGE_TAP s is a dodge)   // a charged ground pound hits like a fall this much higher
// the blast long jump's take-off: a fireball out of his backside that throws him forward
function blastOff(p,hx,hz,A=AB.blastJump,k=1){
  const x=p.pos.x-hx*1.6,y=p.pos.y+0.8*ES,z=p.pos.z-hz*1.6;
  if(!SBX){blastFx(x,y,z,0.45*k,1.5*k);
    smoke(x,y,z,16,0x2a2622);puff(x,p.pos.y,z,14,0x6a5a48,1.6);
    for(let i=0;i<26;i++)emit(2,x+(Math.random()-.5)*1.2,y+(Math.random()-.5)*1.2,z+(Math.random()-.5)*1.2,Math.random()<0.5?0xffb040:0xff6020,0.18,0.18,0.18,{force:3,dx:-hx,dz:-hz,up:1.2});
    shockCone(p.pos.x,y,p.pos.z,Math.atan2(hx,hz),2.6*k,6*k,0.45);}
  if(!SBX){noise(1.1,1.1,650,'lowpass');tone('sawtooth',70,26,0.9,0.32);tone('sine',90,30,0.7,0.25);
    addShake(0.7,x,z,40);rumble(p,1,320);p.shake=Math.max(p.shake,0.25);p.roarBurst=0.6;}
  // (whatever's right behind him gets caught in it)
  if(A.blastR>0){hitGoblins(x,z,A.blastR,Math.round(A.dmg*0.75),'Caught in a blast long jump',p.pos.y);
    for(const c of carsNear(x,z,A.blastR,p.pos.y)){damageCar(c,Math.round(A.carDmg*0.75),new V3(-hx,0,-hz));if(c.alive)launchCar(c,7,new V3(-hx,0,-hz),5);}}
}
function fallImpact(p,drop,pound,lvl=0){
  const AK=pound?['pound','pound2','pound3'][lvl]||'pound':'crash',A=AB[AK];
  // (a pound's or a crash landing's custom hitboxes count their frames from the moment he hits the ground, however long the fall)
  hbStart(p,AK);hbTick(p,0);
  if(!pound){p.crashT=CRASH_T;p.landT=0;}   // legs splay out and he flattens for a moment
  const fx=p.pos.x,fz=p.pos.z,y=p.pos.y;
  const sev=pound?1+drop/7:Math.max(0.3,(drop-3)/7);
  const r=pound?Math.min(3,2+Math.floor(drop/6)):(drop<8?1:drop<14?2:3);
  const deep=pound?(drop>10?2:1):(drop<10?1:2);
  const cust=hbOn(AK);
  if(!cust){const o={force:0.9+0.35*sev,up:1.3+0.3*sev};blockHit(A,fx,y,fz,Math.sin(p.heading),Math.cos(p.heading),o,sz=>crush(fx,y,fz,Math.max(0,Math.round(r*sz)),-deep,0,o));}
  const gr=A.hitR+drop*0.35,gd=pound?Math.round(Math.min(40,12+drop*1.6)*A.dmg/12):Math.min(40,Math.round(A.dmg+drop*1.6));
  if(!cust)hitGoblins(fx,fz,gr,gd,pound?'Ground-pounded':'Landed on from a great height',y);
  if(!cust)for(const c of carsNear(fx,fz,gr,y)){const away=new V3(c.pos.x-fx,0,c.pos.z-fz);damageCar(c,Math.round(gd*A.carMul),away);if(sev>1)launchCar(c,Math.min(9,3+sev*2),away,2);clang();}
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,rr=1.5+r;puff(fx+Math.cos(a)*rr,y,fz+Math.sin(a)*rr,2,0x9a948a,0.6);}
  addShake(Math.min(0.9,0.3+0.15*sev),fx,fz,14+8*sev);thud(Math.min(1,0.5+0.15*sev));
  if(sev>1.3)tone('sine',50,22,0.8,Math.min(0.45,0.15*sev));
  rumble(p,Math.min(1,0.4+0.2*sev),180+60*sev);p.shake=Math.max(p.shake,Math.min(0.6,0.2+0.1*sev));
  // (the shockwave's outer ring reaches exactly as far as the pound does damage)
  if(pound){stompGrunt(p,Math.min(2,Math.floor(sev)));const rr=cust?hbReach(AK):gr;if(rr)shockwave(fx,y,fz,rr-0.3,undefined,0.32+rr*0.02);}
  flashLabel(pound?'Ground pound':'Crash landing',p);
}
const BITE_SOLO_CD=0.85;   // seconds from one bite to the next with the combo switched off (and after an air bite)
// one cooldown shared by every bite, on the ground or in the air: biting in either puts the other on hold too
function gusBite(p){
  if(p.biteT>0||p.state!=='walk'||!playing||!p.active||(p.biteCD||0)>0)return;
  if(p.gob){const W=gobW(p);p.biteStep=-1;p.comboWin=0;p.biteDur=W.dur;p.biteT=W.dur;p.lungeT=W.lunge;p.biteHit=true;p.biteCD=W.cd;if(p.wpn!=='rifle')sfx('Club swing',()=>{woosh(0.13,0.22,520,1700,0.1);});return;}
  // no aim assist: the bite goes exactly where he's facing (lock-on is how to aim at someone)
  // in the air: a single snap, no combo
  if(!p.grounded){if((p.airBiteCD||0)>0)return;hbStart(p,'airBite');p.airBiteCD=1.0;p.biteCD=BITE_SOLO_CD;p.biteStep=-1;p.comboWin=0;p.biteDur=0.3;p.biteT=0.3;p.lungeT=0.16;p.lurch={t:0,dur:Math.max(0.05,AB.airBite.dist/Math.max(0.1,AB.airBite.speed)),dist:AB.airBite.dist};p.biteHit=true;sfx('Air bite',()=>{tone('triangle',150,260,0.1,0.06);woosh(0.12,0.2,600,1900);});return;}
  // on the ground: which hit of the 3-bite combo this is (keep pressing within the window to chain them);
  // each hit is one planted step forward
  // (bite combo switched off: every bite is the first one, with a longer cooldown before the next)
  const step=(ABIL.biteCombo&&p.comboWin>0&&(p.biteStep??2)>=0&&p.biteStep<2)?p.biteStep+1:0;p.biteStep=step;p.comboWin=0;
  // bites 1 and 2: jaws open wide through the lurch and slam shut right as it ends (that's when it hits)
  const fin=step===2;hbStart(p,fin?'upper':step===1?'bite2':'bite');p.biteDur=fin?0.6:0.38;p.biteT=p.biteDur;p.lungeT=fin?0.26:0.3;{const A=fin?AB.upper:step===1?AB.bite2:AB.bite;p.lurch={t:0,dur:Math.max(0.05,A.dist/Math.max(0.1,A.speed)),dist:A.dist};}p.biteHit=true;p.biteCD=ABIL.biteCombo?p.biteDur-0.02:BITE_SOLO_CD;
  // whatever speed he walked in with carries into the lurch and bleeds off, rather than stopping dead
  p.carryV=Math.max(p.carryV||0,p.lastSp||0);
  p.biteLeg0=p.legs.map(l=>l.rotation.x);   // the legs blend out of wherever they were mid-stride
  if(fin){sfx('Bite combo finisher',()=>{tone('triangle',120,320,0.1,0.06);woosh(0.3,0.34,300,2300,0.1);tone('sine',150,70,0.3,0.05,0.1);});}
  else sfx('Bite',()=>{woosh(0.13,0.22,520,1700,0.1);tone('triangle',150+step*30,260+step*30,0.08,0.06,0.28);});
}
function doBite(p){
  if(p.wallBite){p.wallBite=false;if(p.state==='climb'){wallBiteHit(p);return;}}   // (bitten from a wall: see wallBite)
  if(p.gob){gobAttack(p);return;}
  const hx=Math.sin(p.heading),hz=Math.cos(p.heading),bx=p.pos.x+hx*2.5,bz=p.pos.z+hz*2.5,fin=p.biteStep===2,A=p.biteStep===-1?AB.airBite:fin?AB.upper:p.biteStep===1?AB.bite2:AB.bite;
  const cust=hbOn(p.biteStep===-1?'airBite':fin?'upper':p.biteStep===1?'bite2':'bite');
  if(!cust){const o={force:fin?1.1:0.8,dx:hx,dz:hz};blockHit(A,bx,p.pos.y+0.6,bz,hx,hz,o,sz=>crush(bx,p.pos.y+0.6,bz,Math.max(0,Math.round(sz)),0,1,o));}
  if(fin){p.shake=Math.max(p.shake,0.12);rumble(p,0.45,120);}
  // a wide, long jaw sweep from the snout out to about 3.5 blocks ahead
  // one jaw zone: everything within 1.6 blocks of the line from 1.4 to 3.4 blocks ahead of the snout (a rounded
  // slot, 2.6 blocks up and down), for goblins and cars alike
  const J0=1.4,J1=3.4,JR=A.hitR,JH=2.6,ax=p.pos.x+hx*J0,az=p.pos.z+hz*J0,hitG=new Set(),hitC=new Set();
  const segD=(x,z)=>{const t=Math.max(0,Math.min(J1-J0,(x-ax)*hx+(z-az)*hz));return Math.hypot(x-(ax+hx*t),z-(az+hz*t));};
  if(!cust)dbgHit('dmg','slot',{x:ax,y:p.pos.y-JH,z:az,len:J1-J0,r:JR,h:2*JH,rot:p.heading});
  if(!cust){
    for(const g of goblins){if(g.state!=='chase'||hitG.has(g))continue;if(segD(g.pos.x,g.pos.z)<JR&&Math.abs(g.pos.y-p.pos.y)<JH){hitG.add(g);damageGoblin(g,A.dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),fin?new V3(hx*0.6,1.6,hz*0.6):new V3(hx,0.4,hz),fin?'Uppercut':'Bitten');
      // the uppercut shoves survivors well back, and pops anything it kills high into the air
      if(fin){if(g.state==='dead'){g.vy=Math.max(g.vy,21);g.kv.x+=hx*4;g.kv.z+=hz*4;}else{g.kv.x+=hx*1.5;g.kv.z+=hz*1.5;g.vy=Math.max(g.vy,10);g.stun=Math.max(g.stun||0,0.7);}}}}
    // cars: their body against the same slot (checked at points a half-block apart along it)
    const near=new Set();for(let t=0;t<=J1-J0+1e-6;t+=0.5)for(const c of carsInCyl(ax+hx*t,az+hz*t,JR,p.pos.y-JH,p.pos.y+JH))near.add(c);
    for(const c of near){if(hitC.has(c))continue;hitC.add(c);damageCar(c,A.carDmg,new V3(hx,0,hz));if(fin&&c.alive){c.kv.x+=hx*11;c.kv.z+=hz*11;c.vy=Math.max(c.vy||0,6.5);c.grounded=false;c.spinP=(c.spinP||0)-1.5;thud(0.4);}clang();}   // the uppercut shoves cars hard
  }
  tone('square',200,90,0.08,0.15);noise(0.06,0.3,900,'bandpass');
}
let score=0,kills=0;
function damagePlayer(p,n,pt,dir,cause,killer){
  if(!p.active||p.state==='dead'||DT.invuln||p.drv)return;   // (driving: the vehicle takes it)
  if(p.dodge&&p.dodge.t<p.dodge.dur*0.85)return;   // mid-dodge: it misses
  dmgPop(p.pos.x,p.pos.y+2.2,p.pos.z,n,'#ff5a5a');
  p.hurt=0.1;noise(0.08,0.35,600,'lowpass');
  const q=pt||new V3(p.pos.x,p.pos.y+1.3,p.pos.z);
  blood(q.x,q.y,q.z,8+n*4,dir?dir.clone().multiplyScalar(-0.5):null);
  if(dir)blood(q.x+dir.x*0.8,q.y,q.z+dir.z*0.8,4+n*2,dir);
  splat(q.x+(Math.random()-.5),q.z+(Math.random()-.5),q.y,0.2+Math.random()*0.3*n);
  p.hp-=n;p.hurtFx=0.35;p.regenT=0;p.shake=Math.max(p.shake,0.15);rumble(p,0.35+n*0.12,140);
  // knockback: heavy hits (cars, blasts) throw the hippo; a goblin's jab only nudges
  if(dir&&p.hp>0){
    const h=Math.hypot(dir.x,dir.z)||1,kb=n>=4?13:n>=2?9:2.2,up=n>=4?6.5:n>=2?4.5:0;
    if(n>=2&&p.state==='windup'){p.state='walk';cutVoice(p);}   // a big hit breaks a stomp windup
    p.mvx=(p.mvx||0)*0.3+dir.x/h*kb;p.mvz=(p.mvz||0)*0.3+dir.z/h*kb;
    if(up>0){p.vy=Math.max(p.vy,up);p.grounded=false;}
    p.knockT=n>=2?0.5:0.15;
  }
  if(p.hp<=0){
    if(p.voice){setVoice(p,0);p.lastRoarK=0;}
    p.hp=0;p.deadT=6;p.state='dead';p.t=0;p.slammed=false;p.fallDir=Math.random()<.5?1:-1;
    startCorpse(p,n,dir);
    flashLabel(charName(p)+' has fallen');recordHippoObit(p,cause||'Died',killer);
    tone('sawtooth',150,38,1.6,0.2);tone('sawtooth',110,30,1.8,0.12,0.15);
    p.pool.position.set(p.pos.x,groundAt(p.pos.x,p.pos.z,p.pos.y)+0.02+p.idx*0.005,p.pos.z);p.pool.scale.setScalar(0.1);p.pool.visible=true;
  } else if(p.hp<=6&&Math.random()<0.4)tone('sawtooth',180,90,0.5,0.12);
}
