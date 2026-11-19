// ---- a tank as you drive it (from drvTank and tankGun, driving.js) ----
// Its tracks: W/S drive them (a cruise step, Left Shift, holds a third, two-thirds or all of its speed with nothing
// pressed; S knocks it off), and it has weight, building speed slowly and taking a moment to stop. A/D turn it on its
// tracks: at a standstill it pivots on the spot, moving one track is slowed, so turns widen with speed. On a slope the hull
// tilts with the ground (M.pitch, M.roll, which milPlace shows). The gun: hull lock (C) holds the turret straight ahead
// so you can look round without it swinging; its aim blooms (M.bloom) while the tank moves or the turret swings, shown by
// the crosshair growing, and settles over about a second when still; R swaps HE (a wide crater) for AP (a narrow tunnel
// punched deep, twice the damage to vehicles); right click held is the gunsight, zoomed in from the turret with range marks
const TANK={acc:2.6,brk:6,pivot:0.9,turnK:0.45,settle:1,spread:[0.004,0.05],zoomFov:22,apDepth:9};
// the tracks: returns how fast the hull turns
function tankDrive(M,p,i,dt){const top=handOf('tank').top;
  if(i.tkCruiseP){M.cruise=((M.cruise||0)+1)%4;if(audio)sfx('Cruise step',()=>tone('square',300+M.cruise*120,300+M.cruise*120,0.06,0.03));flashLabel(M.cruise?'Cruise: '+['','slow','half','full'][M.cruise]:'Cruise off',p);}
  let thr=-i.z;if(thr<-0.1&&M.cruise)M.cruise=0;if(Math.abs(thr)<0.1&&M.cruise)thr=M.cruise/3;
  const want=thr*top,r=(Math.abs(want)>Math.abs(M.sv)&&want*M.sv>=0?TANK.acc:TANK.brk)*dt;
  M.sv+=Math.max(-r,Math.min(r,want-M.sv));
  return -i.x*TANK.pivot*(1-TANK.turnK*Math.min(1,Math.abs(M.sv)/top));}
// the gun's own switches, pressed by whoever has the gun (g): hull lock and the shell type
function tankSwitches(M,g,i){
  if(i.tkHullP){M.hullLock=!M.hullLock;flashLabel(M.hullLock?'Hull lock: the turret stays straight ahead':'Hull lock off',g);}
  if(i.tkShellP){M.shell=M.shell==='ap'?'he':'ap';if(audio)sfx('Shell loaded',()=>{clang();tone('square',M.shell==='ap'?520:380,0,0.05,0.03);});flashLabel(M.shell==='ap'?'AP shells: punch deep, hit vehicles hard':'HE shells: a wide crater',g);}}
// the hull tilted to the ground under its tracks
function tankTilt(M,dt){const I=MIL[M.kind],fx=Math.sin(M.h),fz=Math.cos(M.h),lx=fz,lz=-fx,a=I.hz*0.8,b=I.hx*0.8,y=M.y+1.5;
  const gf=groundAt(M.x+fx*a,M.z+fz*a,y),gb=groundAt(M.x-fx*a,M.z-fz*a,y),gl=groundAt(M.x+lx*b,M.z+lz*b,y),gr=groundAt(M.x-lx*b,M.z-lz*b,y);
  const pt=Math.max(-0.35,Math.min(0.35,-Math.atan2(gf-gb,2*a))),rl=Math.max(-0.35,Math.min(0.35,Math.atan2(gl-gr,2*b))),k=Math.min(1,dt*6);
  M.pitch=(M.pitch||0)+(pt-(M.pitch||0))*k;M.roll=(M.roll||0)+(rl-(M.roll||0))*k;}
// the gun's bloom: grows with the tank's speed, its turning and the turret's swing; settles over about a second
function tankBloom(M,turn,trav,dt){const top=handOf('tank').top,bt=Math.min(1,Math.abs(M.sv)/top*0.8+Math.abs(trav)/1.4*0.6+Math.abs(turn)*0.5);
  M.bloom=M.bloom||0;M.bloom=bt>M.bloom?M.bloom+(bt-M.bloom)*Math.min(1,dt*6):Math.max(bt,M.bloom-dt/TANK.settle);}
// a shell's velocity thrown off by the bloom
function tankSpread(M,F){const s=TANK.spread[0]+(M.bloom||0)*TANK.spread[1],sp=Math.hypot(F.vx,F.vy,F.vz);
  F.vx+=(Math.random()*2-1)*s*sp;F.vy+=(Math.random()*2-1)*s*sp;F.vz+=(Math.random()*2-1)*s*sp;return F;}
// the shell as fired, by type
function tankFire(M,F,g){const ap=M.shell==='ap';
  shot({kind:'shell',x:F.x,y:F.y,z:F.z,vx:F.vx,vy:F.vy,vz:F.vz,grav:2,fuse:4,R:ap?2:4.5,dmg:ap?6:4,cause:'Blown up by a goblin in a tank',by:pvpBy(g),crush:ap?1.2:3.2,vd:ap?120:60,own:M,ap});
  M.bloom=1;}
// an AP shell striking a wall: a tunnel bored on along its line, through whatever it meets, apDepth blocks at most
function apTunnel(S){const v=S.v,L=Math.hypot(v.x,v.y,v.z)||1,dx=v.x/L,dy=v.y/L,dz=v.z/L;let gap=0;
  for(let d=0.5;d<=TANK.apDepth;d+=0.8){const x=S.pos.x+dx*d,y=S.pos.y+dy*d,z=S.pos.z+dz*d;
    if(solidAt(x,Math.floor(y),z)){gap=0;crushBall(x,y,z,0.95,{force:1.6});}else if(++gap>3&&d>2)break;}}
// the gunsight (right click held, on whoever has the gun): the view from the turret, zoomed in. From drvCamera; true
// when it's placed the camera
function tankSight(p){const D=p.drv,M=D&&D.k==='tank'&&D.o,on=!!(M&&drvArmed(p)&&drvIn(p).tkZoom);
  if(!on){p.tkFov=0;return false;}
  p.tkFov=TANK.zoomFov;   // (the field of view the view's drawn at: minimap.js reads it)
  const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  p.camera.position.set(M.x+fx*1.6,M.y+2.9+fy*1.6,M.z+fz*1.6);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);p.drvCamD=0.5;return true;}
// the crosshair's bloom and reload ring, and the gunsight's range marks (from drvHud)
function tankHud(p,H){const D=p.drv,M=D&&D.k==='tank'&&drvArmed(p)?D.o:null;
  if(!M){if(H.tk){H.xh.style.transform='';H.xh.style.background='';H.tk.hidden=true;}return;}
  if(!H.tk){const s=document.createElement('div');s.className='tsight';s.style.cssText='position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at center,transparent 34%,rgba(8,10,8,.92) 36%)';
    let h='<div style="position:absolute;left:50%;top:50%;width:46%;height:2px;margin-left:-23%;background:rgba(0,0,0,.75)"></div><div style="position:absolute;left:50%;top:50%;width:2px;height:30%;background:rgba(0,0,0,.75)"></div>';
    [100,200,300,400].forEach((r,k)=>{h+='<div style="position:absolute;left:50%;top:calc(50% + '+(14+k*16)+'px);width:'+(40-k*6)+'px;height:2px;margin-left:-'+(20-k*3)+'px;background:rgba(0,0,0,.75)"></div><div style="position:absolute;left:calc(50% + '+(26-k*3)+'px);top:calc(50% + '+(7+k*16)+'px);font:11px monospace;color:#111">'+r+'</div>';});
    s.innerHTML=h;H.el.insertBefore(s,H.el.firstChild||null);H.tk=s;}
  H.tk.hidden=!p.tkFov;
  const sc=(1+(M.bloom||0)*1.6).toFixed(2);if(H.xh.dataset.sc!==sc){H.xh.dataset.sc=sc;H.xh.style.transform='scale('+sc+')';}
  const w=M.wpn&&M.wpn.shell,rl=w&&w.rl>0?1-w.rl/w.W.reload:1,bg=rl<1?'conic-gradient(rgba(255,212,71,.6) '+Math.round(rl*360)+'deg,transparent 0)':'';
  if(H.xh.style.background!==bg)H.xh.style.background=bg;}
// the controls, for the column down the left
function tankHow(p,D,armed,G){const A=id=>actMark(p,id),M=D.o;if(D.seat==='gun')return G+A('tkZoom')+' gunsight (hold)  ·  '+A('tkShell')+(M.shell==='ap'?' HE shells':' AP shells')+'  ·  ';
  return actPair(p,'fwd','back')+' tracks  ·  '+actPair(p,'left','right')+' turn (pivots when still)  ·  '+A('tkCruise')+' cruise '+(M.cruise?['','slow','half','full'][M.cruise]:'off')+'  ·  '+(armed?G+A('tkZoom')+' gunsight (hold)  ·  '+A('tkShell')+(M.shell==='ap'?' HE shells':' AP shells')+'  ·  '+A('tkHull')+(M.hullLock?' hull lock off':' hull lock')+'  ·  ':'');}
