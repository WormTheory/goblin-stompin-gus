// ---- Piloting a Mobile Gear: the camera and the display (see vehicles/mech.js) ----
// the view: over its right shoulder, well back, turned only by you (it never swings round behind it by itself, as the
// other vehicles' chase camera does), pulled in where something's in the way; it widens a little at speed and jolts on
// quick boosts and hard landings
function mechCamera(p){
  const M=p.drv.o,cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp,rx=Math.cos(p.cam.yaw),rz=-Math.sin(p.cam.yaw);
  const by=M.g.position.y+6.7;let side=1.7;
  // (the shoulder it looks over can't be inside a wall: tucked in toward the middle if it would be)
  while(side>0.1&&solidAt(Math.floor(M.x+rx*side),Math.floor(by),Math.floor(M.z+rz*side)))side*=0.5;
  const tx=M.x+rx*side,ty=by,tz=M.z+rz*side,sp=Math.hypot(M.vx,M.vz),base=9+Math.min(1.5,sp*0.06);let dist=base;
  for(let t=0.6;t<=base;t+=0.3){if(solidAt(Math.floor(tx-fx*t),Math.floor(ty-fy*t),Math.floor(tz-fz*t))){dist=Math.max(0.8,t-0.5);break;}}
  let cx=tx-fx*dist,cy=ty-fy*dist,cz=tz-fz*dist;const gy=supportAt(cx,cz,cy);if(gy!==null&&cy<gy+0.4)cy=gy+0.4;
  p.drvCamD=dist;p.camera.position.set(cx,cy,cz);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);
  // (the view widens a few degrees skating, more on a quick boost)
  const want=(M.qbT>0?9:0)+(M.grounded&&M.boostOn&&sp>2?Math.min(6,sp*0.33):M.airB?4:0);p.mgFov=(p.mgFov||0)+(want-(p.mgFov||0))*0.12;
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
// the line of controls along the top of the display
function mechHint(p){const L=id=>actMark(p,id);
  return L('mgQB')+' quick boost  ·  '+L('mgBoost')+' boost '+(p.drv.o.boostOn?'ON':'off')+'  ·  '+L('mgJump')+' jump, hold to fly  ·  hold '+L('mgOut')+' get out';}
// the energy gauge under the crosshair: how much is left, red and flashing while it's redlined; beside it the speed
function mechHud(p,H){
  const on=p.drv&&p.drv.k==='mech'&&!p.drv.jack;
  if(!H.mg){if(!on)return;const el=document.createElement('div');el.className='mgen';el.innerHTML='<span class="mgl">EN</span><span class="mgb"><i></i></span><span class="mgs"></span>';H.el.append(el);
    H.mg={el,fill:el.querySelector('.mgb i'),spd:el.querySelector('.mgs'),last:''};}
  H.mg.el.hidden=!on;if(!on)return;
  const M=p.drv.o,f=Math.max(0,Math.min(1,M.en/MG.enMax)),red=M.red>0,st=(f*100).toFixed(0)+(red?'r':'')+(M.boostOn?'b':'')+Math.round(Math.hypot(M.vx,M.vz));
  if(st===H.mg.last)return;H.mg.last=st;
  H.mg.fill.style.width=(f*100).toFixed(1)+'%';H.mg.el.classList.toggle('red',red);H.mg.el.classList.toggle('boost',M.boostOn);
  H.mg.spd.textContent=red?'REDLINE':Math.round(Math.hypot(M.vx,M.vz)*3.6)+' km/h';
}
