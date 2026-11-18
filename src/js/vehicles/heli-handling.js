// ---- a helicopter as you fly it (from drvHeli, driving.js) ----
// Two ways to fly it, swapped with R (D-pad right), kept on the helicopter (M.agile). Simple: it goes the way you push,
// relative to where you look, but with weight: it tilts into the move first and the speed builds, and let go it flares
// nose-up and settles into a hover. Agile: W/S are the collective (climb and sink), A/D the pedals (it turns on the spot,
// the camera turning with it), and where you point the camera tilts it, so it strafes and pulls pedal turns. Starting up,
// the rotor spools up (M.spin) with a rising whine before it'll lift. Brought down to a quarter of its health the engine
// fails and it autorotates (M.auto): it sinks, turning slowly, still steerable, and Space near the ground flares it on to
// a rough landing that it survives if it isn't coming down too fast. The main rotor is a weapon: brushed against
// goblins it minces them, against a wall it chips blocks out and costs the helicopter some health
const HELI={top:16,acc:9,lag:0.35,vy:8,drag:0.35,tilt:0.32,yaw:1.4,rest:-0.25,agTilt:0.55,agAcc:22,agDrag:0.5,
  autoHp:0.25,autoVy:-5.5,autoSpin:0.55,flareH:6,flareVy:-1.5,hardVy:-12,rotorR:5,rotorY:2.8,chipCd:0.3};
// R: Simple or Agile
function heliMode(M,p,i){if(!i.hcModeP)return;M.agile=!M.agile;
  if(audio)sfx('Flight mode',()=>tone('square',M.agile?660:440,M.agile?660:440,0.07,0.03));
  flashLabel(M.agile?'Agile: W/S collective, A/D pedals, the camera tilts it':'Simple: it goes the way you push',p);}
// the engine failing at a quarter of its health: true while it's autorotating
function heliAuto(M,p){if(M.dead)return false;
  if(!M.auto&&M.hp<=MIL.heli.hp*HELI.autoHp){M.auto=true;if(audio)sfx('Engine failure',()=>{tone('sawtooth',220,60,0.9,0.12);noise(0.6,0.15,400,'lowpass');});
    flashLabel('Engine out! Autorotating: hold '+actMark(p,'hcUp')+' near the ground to flare',p);}
  return !!M.auto;}
// the flying: sets M.hv, M.vy, M.h, M.pitch and M.roll; returns whether the rotor's lifting
function heliFly(M,p,i,dt){const auto=heliAuto(M,p);
  M.spin+=((auto?HELI.autoSpin:1)-M.spin)*Math.min(1,dt*0.8);
  const lift=M.spin>0.8||auto&&M.spin>0.4,fx=Math.sin(M.h),fz=Math.cos(M.h),gy=groundAt(M.x,M.z,M.y+1),agl=M.y-gy;
  if(!M.ac)M.ac={x:0,z:0};
  let up,tP,tR;
  if(!M.agile){
    // Simple: toward a speed the way you push, through an acceleration that builds up (the tilt comes first)
    const yaw=p.cam.yaw+Math.PI,cx=Math.sin(yaw),cz=Math.cos(yaw),f=-i.z,r=i.x,top=HELI.top*(auto?0.7:1);
    let wx=cx*f-cz*r,wz=cz*f+cx*r;const wm=Math.hypot(wx,wz);if(wm>1){wx/=wm;wz/=wm;}
    let dx=lift?(wx*top-M.hv.x)*1.2:0,dz=lift?(wz*top-M.hv.z)*1.2:0;const dm=Math.hypot(dx,dz);if(dm>HELI.acc){dx*=HELI.acc/dm;dz*=HELI.acc/dm;}
    const k=Math.min(1,dt/HELI.lag);M.ac.x+=(dx-M.ac.x)*k;M.ac.z+=(dz-M.ac.z)*k;
    M.hv.x+=M.ac.x*dt;M.hv.z+=M.ac.z*dt;
    up=(i.jump?1:0)-(i.climb||i.charge?1:0);M.h=angTo(M.h,yaw,(auto?0.3:1.6)*dt);   // (autorotating, it hardly answers: it turns slowly on its own)
    // (tilted by what it's pushing against: the acceleration, and the air at speed; nose down positive)
    const tx=M.ac.x+M.hv.x*HELI.drag,tz=M.ac.z+M.hv.z*HELI.drag;
    tP=Math.max(-HELI.tilt,Math.min(HELI.tilt,(tx*fx+tz*fz)/HELI.acc*HELI.tilt));tR=-Math.max(-HELI.tilt,Math.min(HELI.tilt,(tx*fz-tz*fx)/HELI.acc*HELI.tilt));
    const e=Math.min(1,dt*5);M.pitch=(M.pitch||0)+(tP-(M.pitch||0))*e;M.roll=(M.roll||0)+(tR-(M.roll||0))*e;
  } else {
    // Agile: the collective, the pedals (the camera turned with it), and the attitude where the camera points
    up=Math.max(-1,Math.min(1,-i.z+(i.jump?1:0)-(i.climb||i.charge?1:0)));
    const dh=-i.x*HELI.yaw*dt*(lift?1:0.3);M.h+=dh;p.cam.yaw+=dh;
    const rel=angDiff(M.h,p.cam.yaw+Math.PI);
    tP=lift?Math.max(-HELI.agTilt,Math.min(HELI.agTilt,(HELI.rest-p.cam.pitch)*1.6)):0;tR=lift?Math.max(-HELI.agTilt,Math.min(HELI.agTilt,-rel*1.2)):0;
    const e=Math.min(1,dt*4);M.pitch=(M.pitch||0)+(tP-(M.pitch||0))*e;M.roll=(M.roll||0)+(tR-(M.roll||0))*e;
    const af=M.pitch*HELI.agAcc,as=-M.roll*HELI.agAcc,sx=fz,sz=-fx;   // (s: its left-hand side)
    M.ac.x=fx*af+sx*as-M.hv.x*HELI.agDrag;M.ac.z=fz*af+sz*as-M.hv.z*HELI.agDrag;
    if(lift){M.hv.x+=M.ac.x*dt;M.hv.z+=M.ac.z*dt;}
  }
  // (climbing and sinking; autorotating, it sinks whatever's asked, flared near the ground with the climb held)
  let vyT=lift?up*HELI.vy:Math.min(0,up)*HELI.vy;
  if(auto){vyT=Math.min(vyT,HELI.autoVy);if(up>0&&agl<HELI.flareH&&M.spin>0.4){vyT=HELI.flareVy;M.spin-=dt*0.25;}M.h+=0.5*dt;}
  M.vy+=(vyT-M.vy)*Math.min(1,dt*2);
  if(agl<=0.05&&M.vy<=0){M.hv.x*=Math.exp(-dt*4);M.hv.z*=Math.exp(-dt*4);M.ac.x=M.ac.z=0;}   // (sat on the ground it doesn't slide about)
  heliSpool(M,dt);
  return lift;}
// touching down while autorotating: a rough landing it survives, unless it's coming down too fast
function heliTouch(M,p,vy){if(vy>-2.5)return;
  if(vy<HELI.hardVy){airCrash(M.x,M.y+1,M.z,4,'Killed when a helicopter crashed');milHit(M,MIL.heli.hp*99);return;}
  milHit(M,Math.round(-vy*1.5));clang();addShake(0.4,M.x,M.z,20);if(!M.dead)flashLabel('Rough landing!',p);}
// the rotor's whine as it spools up
function heliSpool(M,dt){if(!(M.spin<0.97&&M.spin>0.05)||!audio||!playing)return;M.whT=(M.whT||0)-dt;
  if(M.whT<=0){M.whT=0.12;const f=250+M.spin*650;sfx('Rotor spooling up',()=>tone('sine',f,f*1.04,0.12,0.03));}}
// the main rotor brushing goblins (and other players, with PvP on) and walls
function heliRotor(M,p,dt){if(M.spin<0.5||M.dead)return;const fx=Math.sin(M.h),fz=Math.cos(M.h),cx=M.x+fx*0.3,cz=M.z+fz*0.3,ry=M.y+HELI.rotorY,R=HELI.rotorR;
  for(const g of goblins){if(g.state!=='chase'||g.rotT>0)continue;const dx=g.pos.x-cx,dz=g.pos.z-cz,d=Math.hypot(dx,dz);
    if(d>R+0.3||d<1.2||ry<g.pos.y+0.2||ry>g.pos.y+1.7)continue;g.rotT=0.5;
    damageGoblin(g,25,new V3(g.pos.x,ry,g.pos.z),new V3(dx/(d||1),0.4,dz/(d||1)),'Minced by a helicopter rotor',p);blood(g.pos.x,ry,g.pos.z,6);}
  for(const g of goblins)if(g.rotT>0)g.rotT-=dt;
  for(const q of pvpFoes(p)){const dx=q.pos.x-cx,dz=q.pos.z-cz,d=Math.hypot(dx,dz);if(d>R+0.3||d<1.2||ry<q.pos.y+0.2||ry>q.pos.y+2.2)continue;
    pvpHurt(p,q,6,new V3(q.pos.x,ry,q.pos.z),new V3(dx/(d||1),0.4,dz/(d||1)),'Minced by a helicopter rotor',{cd:0.5});}
  M.chipT=(M.chipT||0)-dt;if(M.chipT>0)return;
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2,r=k%2?R-0.3:R*0.65,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;
    if(!solidAt(x,Math.floor(ry),z))continue;
    M.chipT=HELI.chipCd;crushBall(x,ry,z,0.9);puff(x,ry,z,6,0xffd060,0.4);clang();milHit(M,3);M.spin*=0.92;addShake(0.25,M.x,M.z,15);
    if(audio)sfx('Rotor strike',()=>noise(0.25,0.3,1800,'bandpass'));break;}}
// the controls, for the column down the left
function heliHow(p,D,armed,G){const A=id=>actMark(p,id),M=D.o;if(D.seat==='gun')return G;
  const md=A('hcMode')+(M.agile?' Simple mode':' Agile mode')+'  ·  ';
  if(M.agile)return A('fwd')+'/'+A('back')+' collective  ·  '+A('left')+'/'+A('right')+' pedals  ·  camera tilts it  ·  '+md+G;
  return A('hcUp')+' climb  ·  '+A('hcDown')+' drop  ·  '+md+G;}
