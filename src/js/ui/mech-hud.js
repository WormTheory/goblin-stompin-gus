// ---- Piloting a Mobile Gear: the camera and the display (see vehicles/mech.js) ----
// the view: straight behind it, well back and high enough to see over its head with the crosshair in the middle of the
// screen, turned only by you (it never swings round behind it by itself, as the
// other vehicles' chase camera does), pulled in where something's in the way; it widens a little at speed and jolts on
// quick boosts and hard landings
function mechCamera(p){
  const M=p.drv.o,cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  const by=M.g.position.y+9.4;
  const tx=M.x,ty=by,tz=M.z,sp=Math.hypot(M.vx,M.vz),base=11+Math.min(1.5,sp*0.05);let dist=base;
  for(let t=0.6;t<=base;t+=0.3){if(solidAt(Math.floor(tx-fx*t),Math.floor(ty-fy*t),Math.floor(tz-fz*t))){dist=Math.max(0.8,t-0.5);break;}}
  let cx=tx-fx*dist,cy=ty-fy*dist,cz=tz-fz*dist;const gy=supportAt(cx,cz,cy);if(gy!==null&&cy<gy+0.4)cy=gy+0.4;
  p.drvCamD=dist;p.camera.position.set(cx,cy,cz);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);
  // (the view widens a few degrees skating, more on a quick boost)
  const want=(M.qbT>0?9:0)+(M.grounded&&M.boostOn&&sp>2?Math.min(6,sp*0.33):M.airB?4:0);p.mgFov=(p.mgFov||0)+(want-(p.mgFov||0))*0.12;
  if(p.shake>0.002&&gameSpeed()>0){const c=p.camera.position;c.x+=(Math.random()-.5)*p.shake;c.y+=(Math.random()-.5)*p.shake;c.z+=(Math.random()-.5)*p.shake;}
}
// the line of controls along the top of the display
function mechHint(p){const L=id=>actMark(p,id),M=p.drv.o;
  return L('mgQB')+' quick boost  ·  '+L('mgBoost')+' boost '+(M.boostOn?'ON':'off')+'  ·  '+L('mgAB')+(M.ab&&M.ab.ph==='go'?' stop, or kick':' assault boost')+'  ·  '+L('mgJump')+' jump, hold to fly  ·  '+L('mgLock')+(M.hard?' let go':' lock on')+'  ·  '+L('mgRep')+' repair ('+(M.kits??MG.kits)+' left)  ·  hold '+L('mgOut')+' get out';}
// the energy gauge: a thin bar along the bottom of the lock box, its whole width, how much is left, red and flashing while
// it's redlined; under it, thinner, its own impact meter (how near it is to being staggered), with "STAGGERED" flashing
// under that while it is (made after the weapons' display, which makes the lock box)
function mechHud(p,H){
  const on=p.drv&&p.drv.k==='mech'&&!p.drv.jack;
  mgWpnHud(p,H,on);
  if(!H.mg){if(!on)return;const el=document.createElement('div');el.className='mgen';el.innerHTML='<i></i>';H.mgw.lb.append(el);
    const im=document.createElement('div');im.className='mgim';im.innerHTML='<i></i>';H.mgw.lb.append(im);
    const sg=document.createElement('div');sg.className='mgst';sg.textContent='STAGGERED';H.mgw.lb.append(sg);
    H.mg={el,fill:el.querySelector('i'),im,imf:im.querySelector('i'),sg,last:''};}
  H.mg.el.hidden=H.mg.im.hidden=!on;if(!on){H.mg.sg.hidden=true;return;}
  const M=p.drv.o,f=Math.max(0,Math.min(1,M.en/MG.enMax)),red=M.red>0,stag=M.stag>0,fi=stag?1:Math.max(0,Math.min(1,(M.imp||0)/MG.impMax));
  const st=(f*100).toFixed(1)+(red?'r':'')+'i'+(fi*100).toFixed(0)+(stag?'s':'');
  if(st===H.mg.last)return;H.mg.last=st;
  H.mg.fill.style.width=(f*100).toFixed(1)+'%';H.mg.el.classList.toggle('red',red);
  H.mg.imf.style.width=(fi*100).toFixed(0)+'%';H.mg.im.classList.toggle('st',stag);H.mg.sg.hidden=!stag;
}
// the weapons' display: the lock box round the crosshair (its size the lock box's angle at the view's field of view), a
// bracket on what's soft-locked, a heavier one on a hard lock, the missile locks as pips by their targets; up either
// side of the lock box a tall gauge for each weapon, the left-hand weapons' on the left (the arm's nearest the box), how
// much is loaded, or while it reloads how far along it is; and down in the corner beside the speedometer each weapon's
// button, its load and its name, laid out as they're carried (shoulders above, arms below, left side on the left)
const MGW_SPOT={mgShL:'tl',mgShR:'tr',mgArmL:'bl',mgArmR:'br'},MGW_GAUGE={mgArmL:'l1',mgShL:'l2',mgArmR:'r1',mgShR:'r2'};
function mgWpnHud(p,H,on){
  let W=H.mgw;
  if(!W){if(!on)return;const el=document.createElement('div');el.className='mgwh';el.innerHTML='<div class="mglb"></div><div class="mgro"></div>';H.el.append(el);W=H.mgw={el,lb:el.querySelector('.mglb'),ro:el.querySelector('.mgro'),tk:[],wb:null,key:''};}
  W.el.hidden=!on;if(!on)return;
  const M=p.drv.o;mgArm(M);const cam=p.camera,fov=cam.fov||72;
  {const h=(Math.tan(MGW.box)/Math.tan(fov*Math.PI/360)*100).toFixed(1)+'%';if(W.lbH!==h){W.lbH=h;W.lb.style.height=h;}}
  W.lb.classList.toggle('on',!!M.soft||!!M.hard);H.xh.classList.toggle('lock',!!M.hard);
  // (the markers: the target, then a pip per missile lock beside each)
  const marks=[],T=mgTarget(M);if(T)marks.push({t:T,c:M.hard?'tk hard':'tk'});
  if(M.pod){const seen=new Map();for(const t of M.pod.locks){const n=seen.get(t)||0;seen.set(t,n+1);marks.push({t,c:'pip',n});}}
  let k=0;
  for(const m of marks){const t=m.t,ty=lockY(t),d2=(t.pos.x-cam.position.x)**2+(t.pos.z-cam.position.z)**2;_dhv.set(t.pos.x,ty-CURVE_U.value*d2,t.pos.z).project(cam);
    if(!(_dhv.z<1&&_dhv.z>-1))continue;let e=W.tk[k];if(!e){e=document.createElement('div');W.el.append(e);W.tk.push(e);}k++;
    if(e.className!==m.c)e.className=m.c;e.hidden=false;
    const sx=(_dhv.x+1)/2*100,sy=(1-_dhv.y)/2*100;e.style.left=sx.toFixed(2)+'%';e.style.top=sy.toFixed(2)+'%';
    if(m.c==='pip')e.style.transform='translate('+(14+m.n*9)+'px,-18px) rotate(45deg)';}
  for(;k<W.tk.length;k++)W.tk[k].hidden=true;
  // (a tank or helicopter locked on to: its health and its impact meter, two short bars under the bracket)
  {if(!W.ti){W.ti=document.createElement('div');W.ti.className='mgti';W.ti.innerHTML='<i class="h"><b></b></i><i class="m"><b></b></i>';W.el.append(W.ti);
      W.tih=W.ti.querySelector('.h b');W.tim=W.ti.querySelector('.m b');W.tiK='';}
    let show=false;
    if(T&&isMilT(T)&&!T.dead){const ty=lockY(T),d2=(T.pos.x-cam.position.x)**2+(T.pos.z-cam.position.z)**2;_dhv.set(T.pos.x,ty-CURVE_U.value*d2,T.pos.z).project(cam);
      if(_dhv.z<1&&_dhv.z>-1){show=true;const I=MIL[T.kind],hf=Math.max(0,Math.min(1,T.hp/I.hp)),st=T.stag>0,mf=st?1:Math.max(0,Math.min(1,(T.imp||0)/impMax(T)));
        W.ti.style.left=((_dhv.x+1)/2*100).toFixed(2)+'%';W.ti.style.top=((1-_dhv.y)/2*100).toFixed(2)+'%';
        const key=(hf*100).toFixed(0)+'/'+(mf*100).toFixed(0)+(st?'s':'');if(key!==W.tiK){W.tiK=key;W.tih.style.width=(hf*100).toFixed(0)+'%';W.tim.style.width=(mf*100).toFixed(0)+'%';W.ti.classList.toggle('st',st);}}}
    W.ti.hidden=!show;}
  // (the gauges and the readouts, made again if the controller's been picked up or put down, so the buttons are right,
  // or it's another Mobile Gear with other weapons)
  const key=(p.pad?'p':'k')+mgLoadCode(M.load||MG_LOAD_DEF);
  if(W.key!==key){W.key=key;if(W.wb)for(const b of W.wb){b.c.remove();b.g.remove();}
    W.wb=mgWpnList(M).map(D=>{const c=document.createElement('div');c.className='mgc '+MGW_SPOT[D.act];
      c.innerHTML='<span class="cb">'+hudHTML(actMark(p,D.act))+'</span><b class="cn"></b><span class="cw"></span>';W.ro.append(c);
      const g=document.createElement('div');g.className='mgg '+MGW_GAUGE[D.act];g.innerHTML='<i></i>';W.lb.append(g);
      return{c,g,D,n:c.querySelector('.cn'),w:c.querySelector('.cw'),f:g.querySelector('i'),last:''};});
    W.ro.append(...['tl','tr','bl','br'].map(sp=>W.wb.find(b=>MGW_SPOT[b.D.act]===sp).c));}   // (in reading order)
  for(const b of W.wb){const s=M.wpn[b.D.k],rl=s.rl>0,cool=!!b.D.cool,locks=b.D.k==='pod'&&M.pod?M.pod.locks.length:-1,brace=b.D.k==='cannon'&&M.brace>0;
    const st=(rl?'r'+s.rl.toFixed(1):'n'+s.n)+'l'+locks+(brace?'b':'');if(st===b.last)continue;b.last=st;
    const f=rl?1-s.rl/s.W.reload:s.n/s.W.max;b.f.style.height=(Math.max(0,Math.min(1,f))*100).toFixed(1)+'%';
    b.g.classList.toggle('rl',rl);b.c.classList.toggle('rl',rl);b.g.classList.toggle('lo',!rl&&!cool&&s.n<=s.W.max*0.25);
    b.n.textContent=rl?s.rl.toFixed(1)+'s':cool?'—':String(s.n);
    b.w.textContent=b.D.name+(rl?(cool?' · cooling':' · reloading'):locks>=0?' · '+locks+' locked':brace?' · bracing':'');}
}
