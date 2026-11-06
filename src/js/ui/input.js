// ---------- Input ----------
const keys=new Set();
let menuOpen=true,playing=false,dragMode=false,downAt=null,coop=false,spacePrev=false,shiftPrev=false,qPrevK=false;
const pauseEl=document.getElementById('pause');
const touchMode=matchMedia('(pointer: coarse)').matches;
if(touchMode){document.getElementById('touch').hidden=false;dragMode=true;}
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(menuOpen||P1.paused)return;
  keys.add(e.code);
  if(e.code==='Escape'&&dragMode)requestPause(P1);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();mHeld.clear();});
const locked=()=>document.pointerLockElement===canvas;
let hintTime=0;
function startPlay(mode,fromPad){
  if(mode==='coop'){coop=true;activateP2();}
  else if(mode==='solo'){coop=false;deactivateP2();}
  menuOpen=false;for(const p of players){p.paused=false;p.ui.ppause.hidden=true;}
  pauseEl.hidden=true;playing=true;hintTime=14;
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audioWanted=true;if(!(DT.paused||SPEEDS[DT.speedI]===0))audio.resume();}catch(e){}
  if(!dragMode&&!fromPad){try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{dragMode=true;});}catch(e){dragMode=true;}}
}
function pause(){if(TENV)tpShow(true);menuOpen=true;playing=false;keys.clear();mHeld.clear();pauseEl.hidden=false;renderObitCount();if(curTab==='obit'){obitSel=0;renderObits();}if(curTab==='controls')renderControls();if(curTab==='map'){MAPV.cx=null;saveExplored();setTimeout(renderMap,0);}try{if(locked())document.exitPointerLock();}catch(e){}const pf=document.getElementById(players[1].active?'playCoop':'play');if(inputKind==='pad')padFocus(pf);else pf.focus();}
// losing the mouse (another window clicked, alt-tab) pauses -- unless you're playing on a controller, which keeps
// working with the game in the background (as long as the page is still showing; 'on a controller': you've used one
// in the last minute -- so the Alt of an Alt-Tab doesn't count against it)
document.addEventListener('pointerlockchange',()=>{if(!locked()&&!menuOpen&&!dragMode&&!P1.paused&&!DT.kbdOpen&&!(performance.now()-lastPadT<60000&&connectedPads().length))requestPause(P1);});
// in co-op each hippo pauses on their own; the city only stops once everyone has paused
const inCoop=()=>coop&&P2.active;
function requestPause(p){if(inCoop())pausePlayer(p);else pause();}
function pausePlayer(p){
  p.paused=true;p.ui.ppause.hidden=false;
  if(p===P1){keys.clear();mHeld.clear();try{if(locked())document.exitPointerLock();}catch(e){}p.ui.pres.focus();}
}
function resumePlayer(p,fromPad){
  p.paused=false;p.ui.ppause.hidden=true;
  if(p===P1&&!fromPad&&!dragMode){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
  try{if(audio&&!(DT.paused||SPEEDS[DT.speedI]===0))audio.resume();}catch(e){}
}
for(const p of players){p.ui.pres.addEventListener('click',()=>resumePlayer(p,false));p.ui.pmenu.addEventListener('click',()=>pause());}
document.addEventListener('pointerlockerror',()=>{dragMode=true;});
document.getElementById('peaceTog').addEventListener('click',()=>{peaceful=!peaceful;DT.peace=peaceful;try{localStorage.setItem(PEACE_KEY,peaceful?'1':'0');}catch(e){}syncPeace();tone('triangle',620,0,0.05,0.03);renderTime();});
syncPeace();
document.getElementById('play').addEventListener('click',()=>startPlay('solo'));
document.getElementById('playCoop').addEventListener('click',()=>startPlay('coop'));
function look(p,dx,dy,k){
  if(DT.freecam&&p===P1){FC.yaw-=dx*k;FC.pitch=Math.max(-1.5,Math.min(1.5,FC.pitch-dy*k));return;}
  // locked on: sideways mouse flicks switch targets instead of turning the camera
  if(p.lockT&&!p.drv){
    p.flickAcc=(p.flickAcc||0)*0.9+dx;p.flickAccY=(p.flickAccY||0)*0.9+dy;
    if(Math.abs(p.flickAcc)>110&&Math.abs(p.flickAcc)>=Math.abs(p.flickAccY)){p.flickReq=Math.sign(p.flickAcc);p.flickAcc=p.flickAccY=0;}
    else if(Math.abs(p.flickAccY)>110){p.flickReqY=Math.sign(p.flickAccY);p.flickAcc=p.flickAccY=0;}
    return;
  }
  p.cam.yaw-=dx*k;
  p.cam.pitch=camPitch(p.cam.pitch-dy*k);
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{
  if(menuOpen||P1.paused||DT.kbdOpen)return;
  const code='Mouse'+e.button;
  if(e.button===2){mHeld.add(code);mTap.add(code);if(!locked()&&dragMode&&!touchMode)downAt={x:e.clientX,y:e.clientY,b:2,moved:false};return;}
  if(locked()){mHeld.add(code);mTap.add(code);}
  else if(dragMode&&!touchMode)downAt={x:e.clientX,y:e.clientY,b:e.button,moved:false};
  else if(!dragMode){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
});
addEventListener('mouseup',e=>{const code='Mouse'+e.button;mHeld.delete(code);if(e.button===2){downAt=null;return;}if(downAt&&!downAt.moved&&!menuOpen&&!P1.paused)mTap.add(code);downAt=null;});
addEventListener('mousemove',e=>{
  if(menuOpen||P1.paused||DT.kbdOpen)return;
  if(locked())look(P1,e.movementX,e.movementY,0.0024);
  else if(downAt){if(Math.abs(e.clientX-downAt.x)+Math.abs(e.clientY-downAt.y)>5)downAt.moved=true;if(downAt.moved)look(P1,e.movementX,e.movementY,0.005);}
});
let tId=null,tX=0,tY=0;
canvas.addEventListener('touchstart',e=>{if(!playing)return;const t=e.changedTouches[0];tId=t.identifier;tX=t.clientX;tY=t.clientY;},{passive:true});
canvas.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===tId){look(P1,t.clientX-tX,t.clientY-tY,0.006);tX=t.clientX;tY=t.clientY;}},{passive:true});
canvas.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===tId)tId=null;},{passive:true});
document.querySelectorAll('.tb[data-a]').forEach(b=>{
  const k=b.dataset.a;
  b.addEventListener('pointerdown',e=>{e.preventDefault();touchHeld.add(k);b.classList.add('on');});
  const up=()=>{touchHeld.delete(k);b.classList.remove('on');};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
});
{const b=document.getElementById('tBite');b.addEventListener('pointerdown',e=>{e.preventDefault();touchHeld.add('bite');});const up=()=>{touchHeld.delete('bite');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);}
document.getElementById('tMenu').addEventListener('click',pause);

// ---------- Gamepads ----------
const padPrev=new Map();let padCount=-1;
const DZ=0.18,dead=v=>Math.abs(v)<DZ?0:(v-Math.sign(v)*DZ)/(1-DZ);
function connectedPads(){let ps=[];try{ps=navigator.getGamepads?Array.from(navigator.getGamepads()):[];}catch(e){}return ps.filter(p=>p&&p.connected).sort((a,b)=>a.index-b.index);}
function rumble(p,s,ms){try{const pad=p&&p.pad;if(pad&&pad.vibrationActuator)pad.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:Math.min(1,s),weakMagnitude:Math.min(1,s*0.6)});}catch(e){}}
function readInputs(dt){
  const pads=connectedPads();
  if(pads.length!==padCount){padCount=pads.length;document.getElementById('padNote').textContent=padCount===0?'No controllers found yet. Press a button on one to wake it up.':padCount===1?'1 controller ready. Press A or Start to play. For co-op, plug in a second controller, or pick Co-op to play keyboard + controller.':padCount+' controllers ready. Press Start on the second one for co-op.';}
  const st=pads.map(p=>{const prev=padPrev.get(p.index)||[];const b=p.buttons.map(x=>!!(x&&(x.pressed||x.value>0.5)));return{p,b,pr:b.map((v,i)=>v&&!prev[i])};});
  for(const s of st)if(s.pr.some(Boolean)||s.p.axes.some(a=>Math.abs(a)>0.5)){noteInput('pad',s.p);break;}
  for(const s of st)padPrev.set(s.p.index,s.b);
  P1.pad=null;P2.pad=null;let s1=null,s2=null;
  if(coop&&P2.active){if(st.length>=2){s1=st[0];s2=st[1];}else s2=st[0]||null;}
  else{s1=st[0]||null;s2=st[1]||null;}
  if(s1)P1.pad=s1.p;if(s2&&P2.active)P2.pad=s2.p;
  P2.ui.join.hidden=!(P2.active&&!P2.pad);
  for(const p of players){const i=p.in;i.x=0;i.z=0;i.charge=false;i.chargePress=false;i.stomp=false;i.bite=false;i.bitePress=false;i.jumpPress=false;i.jump=false;i.lockPress=false;i.dash=false;i.dashPress=false;i.sprint=false;i.sprintPress=false;i.lookX=0;i.lookY=0;i.climb=false;i.use=false;}
  // (rebinding a control in the menu: the next button pressed on any controller is the one)
  if(menuOpen&&BIND_CAP){if(performance.now()-BIND_CAP.t>200)for(const s of st){const i=s.pr.findIndex(Boolean);if(i<0)continue;
      if(BIND_CAP.dev==='pad'){if(PAD_RESERVED.has(i))bindCancel();else setBind(BIND_CAP.id,'pad',BIND_CAP.i,i);}else if(i===1||i===9)bindCancel();break;}
    mTap.clear();return;}
  if(menuOpen){menuPad(st,dt);mTap.clear();return;}
  // the debug quick menu: Select on any controller opens it and Select (or B) closes it again; ~ does the same on the
  // keyboard. The game is paused meanwhile, and the controllers drive the menu instead of the hippos.
  if(!DT.quick)DT.selHeld=false;
  else for(const s of st){if(s.pr[8])DT.selHeld=!DT.selHeld;else if(DT.selHeld&&s.pr[1]){if(DT.edit){DT.edit=null;renderTime();}else if(DT.dd){DT.dd=null;renderTime();}else DT.selHeld=false;}}
  const wasOpen=DT.menu;DT.menu=DT.quick&&(DT.selHeld||DT.kbdOpen);if(!DT.menu){DT.dd=null;DT.edit=null;}
  if(DT.menu){
    let dy=0,dx=0;
    for(const s of DT.selHeld?st:[]){const ax=s.p.axes,lx=ax[0]||0,ly=ax[1]||0;
      if(ly<-0.55||s.b[12])dy=-1;else if(ly>0.55||s.b[13])dy=1;
      if(lx<-0.55||s.b[14])dx=-1;else if(lx>0.55||s.b[15])dx=1;
      if(s.pr[0])dbgMenuToggle();}
    dbgMenuNav('pad',dy,dx,dt);
    if(!wasOpen)renderTime();
  } else if(wasOpen){renderTime();}
  // with the menu open the right stick still turns the camera (the free cam's too)
  if(DT.menu&&DT.selHeld)for(const [p,s] of [[P1,s1],[P2,s2]]){if(!s||!p.active)continue;
    const dz=v=>Math.abs(v)>0.15?v:0,rx=dz(s.p.axes[2]||0),ry=dz(s.p.axes[3]||0);
    if(DT.freecam&&p===P1){FC.yaw-=rx*2.4*dt;FC.pitch=Math.max(-1.5,Math.min(1.5,FC.pitch-ry*1.8*dt));}
    else if(!p.lockT||p.drv){p.cam.yaw-=rx*2.8*dt;p.cam.pitch=camPitch(p.cam.pitch-ry*1.8*dt);}}
  if(DT.menu&&DT.selHeld||wasOpen&&!DT.menu){s1=null;s2=null;}   // (the press that closes it doesn't also jump or trample)
  if(s1&&s1.b[8])s1=null;if(s2&&s2.b[8])s2=null;   // Select itself never plays
  // a paused player's controller drives their own pause panel
  const skip=new Set();
  for(const [p,s] of [[P1,s1],[P2,s2]]){
    if(!p.active||!p.paused||!s)continue;
    if(s.pr[0]||s.pr[9]){resumePlayer(p,true);skip.add(p);}
    else if(s.pr[3]){pause();break;}
  }
  if(menuOpen){mTap.clear();return;}
  if(!P2.active&&s2&&(s2.pr[9]||s2.pr[0])){coop=true;activateP2();P2.pad=s2.p;skip.add(P2);}
  const I=P1.in;
  if(!P1.paused){
    const A={};for(const a of ACTS){const h=kbAct(a.id);A[a.id]=h;A[a.id+'P']=h&&!kbPrevA[a.id];kbPrevA[a.id]=h;}
    I.z+=(A.back?1:0)-(A.fwd?1:0);I.x+=(A.right?1:0)-(A.left?1:0);
    I.charge=A.dashSprint;I.chargePress=A.dashSprintP;I.dash=A.dash;I.dashPress=A.dashP;I.sprint=A.sprint;I.sprintPress=A.sprintP;
    I.stomp=A.stomp;I.jumpPress=A.jumpP;I.jump=A.jump;I.lockPress=A.lockP;I.climb=A.climb;I.bite=A.bite;I.bitePress=A.biteP;I.use=A.use;
  }else for(const a of ACTS)kbPrevA[a.id]=false;
  mTap.clear();
  const apply=(p,s)=>{
    if(!s||p.paused||skip.has(p))return;const ax=s.p.axes,b=s.b,pr=s.pr,i=p.in;
    if(pr[9]){requestPause(p);return;}
    if(!i.x&&!i.z){i.x=dead(ax[0]||0);i.z=dead(ax[1]||0);}
    const rx=dead(ax[2]||0),ry=dead(ax[3]||0);
    if((!p.lockT||p.drv)&&!(DT.freecam&&p===P1)){p.cam.yaw-=rx*2.8*dt;p.cam.pitch=camPitch(p.cam.pitch-ry*1.8*dt);}
    // the buttons, as bound (see BINDS)
    const pb=id=>BINDS[id].pad.some(k=>b[k]),pp=id=>BINDS[id].pad.some(k=>pr[k]);
    {const bx=(pb('right')?1:0)-(pb('left')?1:0),bz=(pb('back')?1:0)-(pb('fwd')?1:0);if(bx||bz){i.x=bx;i.z=bz;}}
    i.lockPress=i.lockPress||pp('lock');
    i.lookX=ax[2]||0;i.lookY=ax[3]||0;  // right stick flicks switch lock-on targets
    i.climb=i.climb||pb('climb');
    i.charge=i.charge||pb('dashSprint');i.chargePress=i.chargePress||pp('dashSprint');
    i.dash=i.dash||pb('dash');i.dashPress=i.dashPress||pp('dash');
    i.sprint=i.sprint||pb('sprint');i.sprintPress=i.sprintPress||pp('sprint');
    i.stomp=i.stomp||pb('stomp');i.use=i.use||pb('use');
    i.jumpPress=i.jumpPress||pp('jump');i.jump=i.jump||pb('jump');
    i.bite=i.bite||pb('bite');
    i.bitePress=i.bitePress||pp('bite');
  };
  if(DT.menu&&DT.kbdOpen){const I=P1.in;for(const k in I)if(typeof I[k]==='boolean')I[k]=false;I.x=I.z=0;}
  apply(P1,s1);if(P2.active)apply(P2,s2);
  for(const p of players)p.in.chargeHeld=p.in.charge;
  if(DT.freecam&&!P1.paused)updateFreecam(dt,s1);
  if(!ABIL.climb)for(const p of players)p.in.climb=false;
}

