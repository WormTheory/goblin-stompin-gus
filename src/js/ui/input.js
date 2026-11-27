// ---------- Input ----------
const keys=new Set();
let atTitle=true,menuOpen=true,playing=false,begun=false,dragMode=false,downAt=null,coop=false,spacePrev=false,shiftPrev=false,qPrevK=false;
const pauseEl=document.getElementById('pause');
const touchMode=matchMedia('(pointer: coarse)').matches;
if(touchMode){document.getElementById('touch').hidden=false;dragMode=true;}
// (the keyboard and mouse handlers are named so player two's own window, ui/seats.js, can hand them its events too; they
// drive whoever has the keyboard, kbP(), player one unless the Controls screen gave it to player two)
function onKeyDown(e){
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  // Esc with the game paused carries on playing (in co-op, just your own hippo), or backs out of the new-world question
  // first. (Checked before the pausing below, so the Esc that pauses in full screen doesn't also resume.) Keys that
  // something else claims for Esc never get here: the chat box, choosing a new key on Controls, the expanded Dev preview.
  if(e.code==='Escape'&&(menuOpen||kbP().paused)){if(!e.repeat&&performance.now()-pauseAt>300)escResume();return;}
  if(menuOpen||kbP().paused)return;
  keys.add(e.code);
  // (Esc normally reaches the page only in drag mode, since the browser keeps it to let go of the mouse. In full
  // screen the game claims Esc (see kbLock), so a tap comes here and pauses, and holding it leaves full screen.)
  if(e.code==='Escape'&&!e.repeat&&!DT.kbdOpen&&!DT.menu)requestPause(kbP());
}
const onKeyUp=e=>keys.delete(e.code),onBlur=()=>{keys.clear();mHeld.clear();};
addEventListener('keydown',onKeyDown);addEventListener('keyup',onKeyUp);addEventListener('blur',onBlur);
// (the mouse is captured by player one's view, or by player two's own window while they have the keyboard there)
const locked=()=>document.pointerLockElement===canvas||w2Locked();
function unlockMouse(){try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}w2Unlock();}
// capturing the mouse. A request the browser turns down (Chrome refuses one made within about a second of Esc
// letting the mouse go) used to switch to click-and-drag looking for good, which left the mouse moving a cursor for
// the rest of the session. Now only a browser that has never once given the lock (and refused three times) falls
// back to dragging; otherwise the next click on the game takes the mouse back, and a hint says so.
let lockOk=false,lockFails=0,mouseMoveT=-1e9;
function wantLock(){
  if(dragMode||touchMode)return;
  const cv=kbCanvas();
  if(typeof cv.requestPointerLock!=='function'){dragMode=true;return;}
  try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){lockFailed();}
}
function lockFailed(){if(!lockOk&&++lockFails>=3)dragMode=true;}
// (playing on the mouse and keyboard, but the mouse isn't captured: a click on the game will capture it)
const mouseNeedsClick=()=>playing&&!menuOpen&&!kbP().paused&&!DT.kbdOpen&&!dragMode&&!touchMode&&!locked()&&(inputKind!=='pad'||performance.now()-mouseMoveT<3000);
let hintTime=0;
function startPlay(mode,fromPad){
  if(netOn()&&P2.net)mode='net';   // (online, player two's seat is someone else's: Play just carries on)
  if(mode==='coop'){coop=true;activateP2();}
  else if(mode==='solo'){coop=false;deactivateP2();}
  menuOpen=false;atTitle=false;for(const p of players){p.paused=false;p.ui.ppause.hidden=true;}
  pauseEl.hidden=true;playing=true;begun=true;hintTime=14;menuMode();
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audioWanted=true;if(!(DT.paused||SPEEDS[DT.speedI]===0))audio.resume();}catch(e){}
  if(!fromPad)wantLock();
}
let pauseAt=-1e9;   // (when play last paused: an Esc straight after it is the same press, e.g. the one that let the mouse go)
// Whose pause menu it is (menuBy): in split-screen co-op either player can open the whole menu, from their own pause
// panel. Player two's is just Resume, Map, Obituary, Character and Controls: it leaves out what changes the game for
// both of you (Options, the Dev tab, the Testing Environment, Quit to title, the Game tab's new city, solo, online and
// hostility controls) and the Patch notes (menuSeat). Its Character screen shows player two's own ability switches. Only their controller
// drives it, and only player one's drives player one's. (var: renderTime asks while the page is still loading)
var menuBy=null;
function menuP2(){return !!(menuBy&&menuBy!==P1&&inCoop());}
const P1_ONLY=['play','newWorld','testWorld','onlineBtn','onlinePanel','confirm','saveSw','savePanel','quitBtn','fullBtn','fullBtnP'];
function menuSeat(){
  const two=menuP2();pauseEl.classList.toggle('seat2',two);
  for(const id of P1_ONLY){const el=document.getElementById(id);if(el)el.classList.toggle('p1only',true);}
  for(const el of document.querySelectorAll('.gamepane .hostmain'))el.classList.add('p1only');
  for(const id of ['Gameplay','Perf','Display'])document.getElementById('tabBtn'+id).hidden=two;document.getElementById('tabBtnNotes').hidden=two;   // (player two's Settings is just their Controls, and Multiplayer's Players and Player 2 screen)
  document.getElementById('tabBtnDev').hidden=two||!DT.quick;
  if(two)document.getElementById('tabBtnTest').hidden=true;
  menuWhoShow();
  {const pc=document.getElementById('playCoop');if(pc)pc.textContent=two?'Resume':'Split screen';}   // (in player two's menu the co-op game is already on: the button just carries on)
  if(two&&['gameplay','perf','display','dev','test','notes'].includes(curTab))showTab('game');
}
// (the name over the tabs: whose menu it is, kept up to date if they pick someone else in the Character tab)
// (the corner tag on the pause card: 1P MENU in Gus green, 2P MENU in Gertie pink, with whose it is beside it; only in
// split-screen co-op, since playing alone or online there's only ever the one menu on this screen)
function menuWhoShow(){const w=document.getElementById('menuWho');if(!w)return;
  let split=false;try{split=inCoop()&&!P2.net;}catch(e){}
  w.hidden=!menuBy||atTitle||!split;
  if(menuBy){const two=menuBy!==P1;w.textContent=(two?'2P':'1P')+' menu';w.classList.toggle('p2',two);
    const sw=document.getElementById('subWho');if(sw)sw.textContent=inCoop()?charName(menuBy)+"'s menu":'';}}
// The menu has two faces: the title screen (atTitle: before the first game, and after Quit to title), with the
// logo, Gus stomping along in front of the city and the main menu card; and the pause menu. Either can open a screen
// (Options, Map, Character...) in the same card, with a Back button at its head (subHead); B, Esc or Back returns to
// where it was opened from (backHome), and LB / RB (Q / E on the keyboard) step through the screens (subStep).
const SUB_TITLES={map:'Map',obit:'Obituary',custom:"Who's stompin'?",controls:'Settings',gameplay:'Settings',perf:'Settings',display:'Settings',multi:'Settings',notes:'Patch notes',dev:'Dev',test:'Testing Environment'};
// Settings: one screen with its own tabs (setTabs, under its heading). LB / RB step through those while it's open, and
// Settings opens again on whichever tab was last looked at
const SET_TABS=['controls','gameplay','perf','display','multi'];let setLast='controls';
const isSetTab=t=>SET_TABS.includes(t);
const setFirst=()=>menuP2()?'controls':setLast;   // (player two has only Controls and Multiplayer)
// (Play solo / Co-op and Play online: on the title screen they're in its main menu, paused they're in Settings'
// Multiplayer tab. The very same buttons are moved between the two, so everything that listens to them carries on)
const MP_MOVE=['play','playCoop','onlineBtn','onlinePanel'];
function mpPlace(){
  const tm=document.getElementById('titleMenu'),mp=document.getElementById('mpMenu');if(!tm||!mp)return;
  const to=atTitle?tm:mp,before=atTitle?tm.querySelector('.tm2'):null;
  for(const id of MP_MOVE){const el=document.getElementById(id);if(el&&el.parentNode!==to)to.insertBefore(el,before);}
}
let SUB_FROM=null;
function menuMode(){
  const pe=document.getElementById('pause');if(!pe||!pe.classList)return;
  const home=curTab==='game';
  pe.classList.toggle('title',atTitle);pe.classList.toggle('home',home);pe.dataset.tab=curTab;
  try{document.body.classList.toggle('attitle',atTitle&&menuOpen);}catch(e){}
  const sh=document.getElementById('subHead');if(sh)sh.hidden=home;
  const st=document.getElementById('subTitle');if(st&&!home)st.textContent=SUB_TITLES[curTab]||'';
  const set=isSetTab(curTab),stb=document.getElementById('setTabs');if(stb)stb.hidden=!set;if(set)setLast=curTab;
  try{mpPlace();}catch(e){}
  // (on the pause menu, Play and Co-op switch between solo and co-op: only the one you're not playing is offered)
  let co=false;try{co=inCoop();}catch(e){}
  pe.classList.toggle('coopon',co);
  const pl=document.getElementById('play');if(pl)pl.textContent=atTitle?'Play':'Play solo';
  try{menuWhoShow();}catch(e){}
}
// Quit to title: the game stops where it is (the city, the score and everyone in it are kept) and the title screen
// comes back, Gus stomping along again; Play carries on from there.
function toTitle(){
  if(menuP2())return;
  atTitle=true;for(const p of players){p.paused=false;p.ui.ppause.hidden=true;}
  showTab('game');renderRampage();
  const pb=document.getElementById('play');if(inputKind==='pad')padFocus(pb);else pb.focus({preventScroll:true});
}
function openSub(tab,from){SUB_FROM=from||null;showTab(tab);
  const pane=document.querySelector('.main .tabpane:not([hidden])'),U=pane?paneUnits(pane):[];
  if(inputKind==='pad'){if(U.length)unitFocus(U[0]);else padFocus(document.getElementById('subBack'));}
  else{const b=document.getElementById('subBack');if(b&&b.offsetParent)b.focus({preventScroll:true});}}
function backHome(){
  const from=SUB_FROM&&document.getElementById(SUB_FROM);SUB_FROM=null;showTab('game');
  const el=from&&from.offsetParent?from:document.getElementById(!atTitle?'resumeBtn':players[1].active&&!players[1].net?'playCoop':'play');
  if(el){if(inputKind==='pad')padFocus(el);else el.focus({preventScroll:true});}
}
// (the screens in order, for LB / RB: the ones whose tab is there to be had)
function subStep(d){
  // (in Settings, its own tabs; elsewhere the screens, with Settings as one of them)
  const set=isSetTab(curTab);
  let L=TABS.filter(([t,id])=>t!=='game'&&!document.getElementById('tabBtn'+id).hidden&&isSetTab(t)===set).map(t=>t[0]);
  if(!set){const i=L.indexOf('notes');L.splice(i<0?L.length:i,0,setFirst());}
  if(!L.length)return;
  const i=L.indexOf(curTab),n=i<0?(d>0?0:L.length-1):(i+d+L.length)%L.length;
  if(curTab==='game')SUB_FROM=document.activeElement&&document.activeElement.id||null;
  showTab(L[n]);const pane=document.querySelector('.main .tabpane:not([hidden])');
  if(inputKind==='pad'){const U=pane?paneUnits(pane):[];if(U.length)unitFocus(U[0]);else padFocus(document.getElementById('subBack'));}
}
document.getElementById('subBack').addEventListener('click',()=>backHome());
document.getElementById('resumeBtn').addEventListener('click',()=>startPlay(null));
document.getElementById('quitBtn').addEventListener('click',()=>toTitle());
menuMode();   // (the page opens on the title screen)
document.getElementById('optBtn').addEventListener('click',()=>openSub(setFirst(),'optBtn'));
document.getElementById('setBtn').addEventListener('click',()=>openSub(setFirst(),'setBtn'));
// Defaults, at the foot of each Settings tab: every setting in that tab back to what a new player starts with. Each is
// put back through its own control, as if clicked or dragged, so it's saved and takes effect just as it would by hand.
// (r: a slider and its value; t: a switch and whether it's on; b: a button to press unless it's already the one picked;
// f: anything else.) Whatever's player one's alone (.p1only) or switched off (a guest's hostility) is left be.
const SET_DEFS={
  tabControls:[['b','.ctl-seg [data-view="auto"]'],['t','#camTog',false],['b','#planeSeg [data-pctl="auto"]'],['f',()=>{const r=document.getElementById('rbReset');if(r)r.click();}]],
  tabGameplay:[['r','#hostMain',3],['r','#daySpeed',3]],
  tabPerf:[['r','#viewDist',112],['r','#detailDist',112],['r','#propDist',64],['r','#crowdDist',1],['r','#trafficDist',1],['r','#fireDur',2],['r','#fireCap',5],
    ['b','#pathSeg [data-path="0"]'],['t','#blkTog',true],['t','#trkTog',true],['t','#dbgMenuTog .tog',false]],
  tabDisplay:[['r','#sndVol',100],['r','#brightness',100],['t','#scorePopTog',false],['t','#dmgPopTog',false],['t','#shoutTog',false],['t','#hpBarTog',false],
    ['t','#bloodTog',false],['t','#keysTog',false],['t','#calmTog',false]],
  tabMulti:[['f',()=>{const a=document.getElementById('seatAuto');if(a&&!a.hidden)a.click();}],['b','#scrSeg [data-scr="split"]'],['b','#pvpSeg [data-pvp="0"]'],
    ['t','#chatShowTog',true],['t','#vcPttTog',true],['t','#vcMicTog',true],['t','#vcHearTog',true],['r','#vcMicVol',100],['r','#vcVol',100],['t','#vcTog',false]],
};
function setDefaults(tab){
  const two=menuP2();
  for(const [k,q,v] of SET_DEFS[tab]||[]){
    if(k==='f'){try{q();}catch(e){}continue;}
    const el=document.querySelector(q);if(!el||el.disabled||two&&el.closest('.p1only'))continue;
    if(k==='r'){if(+el.value!==v){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}}
    else if(k==='t'){if((el.getAttribute('aria-checked')==='true')!==v)el.click();}
    else if(el.getAttribute('aria-checked')!=='true')el.click();
  }
}
for(const b of document.querySelectorAll('[data-def]'))b.addEventListener('click',()=>{setDefaults(b.dataset.def);try{tone('triangle',660,0,0.06,0.03);}catch(e){}});
document.getElementById('devLink').addEventListener('click',()=>openSub('dev','devLink'));
addEventListener('keydown',e=>{if(!menuOpen||BIND_CAP||e.repeat)return;const t=e.target;if(t&&(t.tagName==='INPUT'&&t.type!=='range'&&t.type!=='checkbox'||t.tagName==='TEXTAREA'))return;
  if(e.code==='KeyQ'||e.code==='KeyE'){e.preventDefault();subStep(e.code==='KeyE'?1:-1);}});
function pause(by){menuBy=by&&by.ui?by:P1;pauseAt=performance.now();SUB_FROM=null;if(curTab!=='game')showTab('game');   // (the pause menu always opens on its own buttons)
  if(TENV)tpShow(true);menuSeat();renderChar();menuOpen=true;playing=false;menuMode();keys.clear();mHeld.clear();pauseEl.hidden=false;renderObitCount();if(curTab==='obit'){obitSel=0;renderObits();}if(curTab==='controls')renderControls();if(curTab==='map'){MAPV.cx=null;saveExplored();setTimeout(renderMap,0);}renderRampage();unlockMouse();const pf=document.getElementById(curTab==='game'?'resumeBtn':'subBack');if(inputKind==='pad')padFocus(pf);else pf.focus();}
// the browser keeps Esc to let go of the mouse, so letting go is how Esc pauses. But the mouse is also let go when the
// window loses focus (another window clicked, alt-tab) or the tab is hidden, and that mustn't pause: the game carries on
// in the background (a host's tab hidden, say), and a click on it takes the mouse back. Alt-tab can let the mouse go
// before the window hears it's lost focus, so the pause waits LOCK_WAIT, and losing focus or being hidden any time from
// just before letting go till then calls it off. (Not on a controller either: one used in the last minute keeps working
// with the mouse let go.)
const LOCK_WAIT=350;
let blurAt=-1e9,lockLostT=null;
function lockCalmOff(){blurAt=performance.now();if(lockLostT!==null){clearTimeout(lockLostT);lockLostT=null;}}
addEventListener('blur',lockCalmOff);
document.addEventListener('visibilitychange',()=>{if(document.hidden)lockCalmOff();});
function lockLostPause(){if(kbP()!==P1)return;if(!menuOpen&&!dragMode&&!P1.paused&&!DT.kbdOpen&&!chatHasEsc()&&!locked()&&!(performance.now()-lastPadT<60000&&connectedPads().length))requestPause(P1);}
document.addEventListener('pointerlockchange',()=>{if(locked()){lockOk=true;lockFails=0;return;}
  if(lockLostT!==null)clearTimeout(lockLostT);const t0=performance.now();
  // (a long frame, the Testing Environment's say, can hold the window's blur back past the wait: a check that comes late
  // waits once more, so a blur already on its way gets in first)
  const chk=late=>{lockLostT=null;if(document.hidden||blurAt>t0-200||(document.hasFocus&&!document.hasFocus()))return;
    if(!late&&performance.now()-t0>LOCK_WAIT+100){lockLostT=setTimeout(()=>chk(true),150);return;}lockLostPause();};
  lockLostT=setTimeout(()=>chk(false),LOCK_WAIT);});
// in co-op each hippo pauses on their own; the city only stops once everyone has paused
const inCoop=()=>coop&&P2.active;
function requestPause(p){if(inCoop())pausePlayer(p);else pause();}
function pausePlayer(p){
  p.paused=true;p.ui.ppause.hidden=false;if(p===kbP())pauseAt=performance.now();
  if(p===kbP()){keys.clear();mHeld.clear();unlockMouse();try{p.ui.pres.focus();}catch(e){}}
}
function resumePlayer(p,fromPad){
  p.paused=false;p.ui.ppause.hidden=true;
  if(p===kbP()&&!fromPad)wantLock();
  try{if(audio&&!(DT.paused||SPEEDS[DT.speedI]===0))audio.resume();}catch(e){}
}
function escResume(){
  if(menuOpen){
    const cf=document.getElementById('confirm');
    if(!cf.hidden){document.getElementById('confirmNo').click();const nw=document.getElementById('newWorld');if(inputKind==='pad')padFocus(nw);else nw.focus();return;}
    // (Esc closes a card popped out beside the title menu, Local saves or Play online)
    for(const [pid,bid] of [['savePanel','saveLocal'],['onlinePanel','onlineBtn']]){const pn=document.getElementById(pid);
      if(pn&&!pn.hidden&&atTitle){titlePop(null);const b=document.getElementById(bid);if(inputKind==='pad')padFocus(b);else b.focus();return;}}
    const t=document.activeElement;
    if(t&&(t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.tagName==='INPUT'&&/^(text|number|search)$/.test(t.type))){t.blur();return;}
    if(curTab!=='game'){backHome();return;}   // (a screen opened from the menu: back to the menu first)
    if(atTitle||!begun)return;   // (the title screen: nothing to go back to)
    startPlay(null);   // (as the controller's Start: same players as before, and the mouse is captured again)
  }else if(kbP().paused&&!DT.kbdOpen)resumePlayer(kbP(),false);
}
for(const p of players){p.ui.pres.addEventListener('click',()=>resumePlayer(p,false));p.ui.pmenu.addEventListener('click',()=>pause(p));}
document.addEventListener('pointerlockerror',lockFailed);
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
  k*=scopeK(p);   // (down a scope, slower to match the zoom)
  p.cam.yaw-=dx*k;
  p.cam.pitch=camPitch(p.cam.pitch-dy*k,p);
}
function onCanvasDown(e){
  if(menuOpen||kbP().paused||DT.kbdOpen)return;
  const code='Mouse'+e.button;if(e.button===1)e.preventDefault();   // (middle click: no scrolling the page)
  if(e.button===2){mHeld.add(code);mTap.add(code);if(!locked()&&dragMode&&!touchMode)downAt={x:e.clientX,y:e.clientY,b:2,moved:false};return;}
  if(locked()){mHeld.add(code);mTap.add(code);}
  else if(dragMode&&!touchMode)downAt={x:e.clientX,y:e.clientY,b:e.button,moved:false};
  else wantLock();
}
// (the wheel's notches, up or down, are presses like a button's, for one frame: Gnash's previous and next weapon)
function onWheel(e){if(menuOpen||kbP().paused||DT.kbdOpen||!e.deltaY)return;e.preventDefault();mTap.add(e.deltaY<0?'MouseWheelUp':'MouseWheelDown');}
function onMouseUp(e){const code='Mouse'+e.button;mHeld.delete(code);if(e.button===2){downAt=null;return;}if(downAt&&!downAt.moved&&!menuOpen&&!kbP().paused)mTap.add(code);downAt=null;}
function onMouseMove(e){
  if(menuOpen||kbP().paused||DT.kbdOpen)return;
  if(!locked()&&(e.movementX||e.movementY))mouseMoveT=performance.now();
  if(locked())look(kbP(),e.movementX,e.movementY,0.0024);
  else if(downAt){if(Math.abs(e.clientX-downAt.x)+Math.abs(e.clientY-downAt.y)>5)downAt.moved=true;if(downAt.moved)look(kbP(),e.movementX,e.movementY,0.005);}
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('mousedown',onCanvasDown);canvas.addEventListener('wheel',onWheel,{passive:false});
addEventListener('mouseup',onMouseUp);addEventListener('mousemove',onMouseMove);
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
document.getElementById('tMenu').addEventListener('click',()=>pause(P1));

// ---------- Gamepads ----------
const padPrev=new Map();let padCount=-1;
const DZ=0.18,dead=v=>Math.abs(v)<DZ?0:(v-Math.sign(v)*DZ)/(1-DZ);
// (with player two's own window open, either window may be the one with focus, and a browser may only tell the focused one
// about its controllers: both are asked and the fresher reading of each controller taken, w2Pads in ui/seats.js)
function connectedPads(){let ps=[];try{ps=navigator.getGamepads?Array.from(navigator.getGamepads()):[];}catch(e){}ps=w2Pads(ps);return ps.filter(p=>p&&p.connected).sort((a,b)=>a.index-b.index);}
function rumble(p,s,ms){try{const pad=p&&p.pad;if(pad&&pad.vibrationActuator)pad.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:Math.min(1,s),weakMagnitude:Math.min(1,s*0.6)});}catch(e){}}
// in a vehicle, its own controls (its control context, ctx in VEHICLE_KINDS) take the place of the ones on foot: those
// the vehicle reads under their old names (as: a car's horn is still bite) are filled from it, the rest left off
const CTX_PRESSES={bite:'bitePress',jump:'jumpPress',charge:'chargePress',dash:'dashPress',sprint:'sprintPress'};
function ctxApply(p){const cx=p.drv&&!p.drv.jack?drvCtx(p.drv):null;if(!cx||cx==='mg')return;const i=p.in;
  for(const k of CTX_TAKES){i[k]=false;if(CTX_PRESSES[k])i[CTX_PRESSES[k]]=false;}
  let lock=null;
  for(const a of ACTS){if(a.ctx!==cx||!a.as)continue;const h=!!i[a.id],pr=!!i[a.id+'P'];
    if(a.as==='lock'){lock=(lock||false)||pr;continue;}
    i[a.as]=i[a.as]||h;if(CTX_PRESSES[a.as])i[CTX_PRESSES[a.as]]=i[CTX_PRESSES[a.as]]||pr;}
  if(lock!==null)i.lockPress=lock;}
function readInputs(dt){
  const pads=connectedPads();
  if(pads.length!==padCount){padCount=pads.length;document.getElementById('padNote').textContent=padCount===0?'No controller found':padCount===1?'1 controller ready':padCount+' controllers ready. Press Start on the second one for co-op.';}
  const st=pads.map(p=>{const prev=padPrev.get(p.index)||[];const b=p.buttons.map(x=>!!(x&&(x.pressed||x.value>0.5)));return{p,b,pr:b.map((v,i)=>v&&!prev[i])};});
  for(const s of st)if(s.pr.some(Boolean)||s.p.axes.some(a=>Math.abs(a)>0.5)){noteInput('pad',s.p);break;}
  for(const s of st)padPrev.set(s.p.index,s.b);
  // which controllers are whose (padSeats, ui/seats.js: as the Controls screen's Players section has them, or the old
  // rule: alone, the first is yours and the second joins; in co-op the first two are one each, or a lone one is player two's)
  P1.pad=null;P2.pad=null;const PS=padSeats(st.map(s=>s.p)),S1=st.filter(s=>PS.get(s.p.index)===1),S2=st.filter(s=>PS.get(s.p.index)===2);
  let s1=S1[0]||null,s2=S2[0]||null;
  seatsSeen(st);
  if(s1)P1.pad=s1.p;if(s2&&P2.active&&!P2.net)P2.pad=s2.p;
  P2.ui.join.hidden=!(P2.active&&!P2.pad&&kbP()!==P2);
  for(const p of players){const i=p.in;i.x=0;i.z=0;i.charge=false;i.chargePress=false;i.stomp=false;i.bite=false;i.bitePress=false;i.jumpPress=false;i.jump=false;i.lockPress=false;i.dash=false;i.dashPress=false;i.sprint=false;i.sprintPress=false;i.lookX=0;i.lookY=0;i.climb=false;i.use=false;i.weapon=false;i.weaponPrev=false;i.reload=false;i.talk=false;i.kbd=false;i.rt=i.lt=0;for(const k of CTX_IDS)i[k]=i[k+'P']=false;}
  // (rebinding a control in the menu: the next button pressed on any controller is the one)
  if(menuOpen&&BIND_CAP){if(performance.now()-BIND_CAP.t>200)for(const s of st){const i=s.pr.findIndex(Boolean);if(i<0)continue;
      if(BIND_CAP.dev==='pad'){if(PAD_RESERVED.has(i))bindCancel();else setBind(BIND_CAP.id,'pad',BIND_CAP.i,i);}else if(i===1||i===9)bindCancel();break;}
    mTap.clear();return;}
  if(menuOpen){
    // (split screen: the menu answers only the controller of whoever opened it)
    const mine=!inCoop()||!menuBy?st:st.filter(s=>menuBy===P2?S2.includes(s):!S2.includes(s)||!S2.length);
    menuPad(mine,dt);mTap.clear();return;}
  // the debug quick menu: Select on any controller opens it and Select (or B) closes it again; ~ does the same on the
  // keyboard. The game is paused meanwhile, and the controllers drive the menu instead of the hippos. It's one menu
  // however it was opened: either device moves about in it and either closes it. DT.selHeld says the controller was
  // the last used in it (its button prompts, and the right stick turning the camera), DT.kbdOpen the keyboard (the
  // mouse pointer let go, to click)
  if(!DT.quick)DT.selHeld=false;
  else for(const s of st){const open=DT.selHeld||DT.kbdOpen;if(inCoop()&&S2.includes(s)&&!open)continue;   // (player two can't open the debug menu: it's player one's, as the Dev tab is)
    if(s.pr[8]){if(open)setKbdMenu(false);else DT.selHeld=true;}
    else if(open&&s.pr[1]){DT.selHeld=true;if(DT.edit){DT.edit=null;renderTime();}else if(DT.dd){DT.dd=null;renderTime();}else setKbdMenu(false);}}
  const wasOpen=DT.menu;DT.menu=DT.quick&&(DT.selHeld||DT.kbdOpen);if(!DT.menu){DT.dd=null;DT.edit=null;}
  if(DT.menu){
    let dy=0,dx=0,used=false;
    for(const s of st){if(inCoop()&&S2.includes(s))continue;const ax=s.p.axes,lx=ax[0]||0,ly=ax[1]||0;
      if(ly<-0.55||s.b[12])dy=-1;else if(ly>0.55||s.b[13])dy=1;
      if(lx<-0.55||s.b[14])dx=-1;else if(lx>0.55||s.b[15])dx=1;
      if(s.pr[0]){used=true;dbgMenuToggle();}if(s.pr[4]||s.pr[5]){used=true;dbgTab(DT.tab?0:1);}}
    // (opened on the keyboard and then driven with a controller: its prompts from here on)
    if((used||dy||dx)&&!DT.selHeld){DT.selHeld=true;renderTime();}
    dbgMenuNav('pad',dy,dx,dt);
    if(!wasOpen)renderTime();
  } else if(wasOpen){renderTime();}
  // with the menu open the right stick still turns the camera (the free cam's too)
  if(DT.menu&&DT.selHeld)for(const [p,s] of [[P1,s1],[P2,s2]]){if(!s||!p.active)continue;
    const dz=v=>Math.abs(v)>0.15?v:0,rx=dz(s.p.axes[2]||0),ry=dz(s.p.axes[3]||0);
    if(DT.freecam&&p===P1){FC.yaw-=rx*2.4*dt;FC.pitch=Math.max(-1.5,Math.min(1.5,FC.pitch-ry*1.8*dt));}
    else if(!p.lockT||p.drv){const zk=scopeK(p);p.cam.yaw-=rx*2.8*dt*zk;p.cam.pitch=camPitch(p.cam.pitch-ry*1.8*dt*zk,p);}}
  if(DT.menu||wasOpen&&!DT.menu){s1=null;s2=null;}   // (the press that closes it doesn't also jump or trample)
  if(s1&&s1.b[8])s1=null;if(s2&&s2.b[8])s2=null;   // Select itself never plays
  // a paused player's controller drives their own pause panel
  const skip=new Set();
  for(const [p,s] of [[P1,s1],[P2,s2]]){
    if(!p.active||!p.paused||!s)continue;
    if(s.pr[0]||s.pr[9]){resumePlayer(p,true);skip.add(p);}
    else if(s.pr[3]){pause(p);break;}
  }
  if(menuOpen){mTap.clear();return;}
  if(!P2.active&&!netOn()&&s2&&(s2.pr[9]||s2.pr[0])){coop=true;activateP2();P2.pad=s2.p;skip.add(P2);}
  const KP=kbP(),I=KP.in;
  if(!KP.paused){
    const A={};for(const a of ACTS){const h=kbAct(a.id);A[a.id]=h;A[a.id+'P']=h&&!kbPrevA[a.id];kbPrevA[a.id]=h;}
    I.z+=(A.back?1:0)-(A.fwd?1:0);I.x+=(A.right?1:0)-(A.left?1:0);
    I.kbd=!KP.pad;   // (flying on the keyboard: a plane is flown WASD-style, see drvPlane; the same rule as the hints' p.pad)
    I.charge=A.dashSprint;I.chargePress=A.dashSprintP;I.dash=A.dash;I.dashPress=A.dashP;I.sprint=A.sprint;I.sprintPress=A.sprintP;
    I.stomp=A.stomp;I.jumpPress=A.jumpP;I.jump=A.jump;I.lockPress=A.lockP;I.climb=A.climb;I.bite=A.bite;I.bitePress=A.biteP;I.use=A.use;I.weapon=A.weapon;I.weaponPrev=A.weaponPrev;I.reload=A.reload;I.talk=A.talk;
    for(const k of CTX_IDS){I[k]=A[k];I[k+'P']=A[k+'P'];}
  }else for(const a of ACTS)kbPrevA[a.id]=false;
  mTap.clear();
  const apply=(p,s)=>{
    if(!s||p.paused||skip.has(p))return;const ax=s.p.axes,b=s.b,pr=s.pr,i=p.in;
    if(pr[9]){requestPause(p);return;}
    if(!i.x&&!i.z){i.x=dead(ax[0]||0);i.z=dead(ax[1]||0);}
    const rx=dead(ax[2]||0),ry=dead(ax[3]||0);
    if((!p.lockT||p.drv)&&!(DT.freecam&&p===P1)){const zk=scopeK(p);p.cam.yaw-=rx*2.8*dt*zk;p.cam.pitch=camPitch(p.cam.pitch-ry*1.8*dt*zk,p);}
    // the buttons, as bound (see BINDS)
    const pb=id=>BINDS[id].pad.some(k=>b[k]),pp=id=>BINDS[id].pad.some(k=>pr[k]);
    {const bx=(pb('right')?1:0)-(pb('left')?1:0),bz=(pb('back')?1:0)-(pb('fwd')?1:0);if(bx||bz){i.x=bx;i.z=bz;}}
    i.lockPress=i.lockPress||pp('lock');
    i.lookX=ax[2]||0;i.lookY=ax[3]||0;  // right stick flicks switch lock-on targets
    i.climb=i.climb||pb('climb');
    i.charge=i.charge||pb('dashSprint');i.chargePress=i.chargePress||pp('dashSprint');
    i.dash=i.dash||pb('dash');i.dashPress=i.dashPress||pp('dash');
    i.sprint=i.sprint||pb('sprint');i.sprintPress=i.sprintPress||pp('sprint');
    i.stomp=i.stomp||pb('stomp');i.use=i.use||pb('use');i.weapon=i.weapon||pb('weapon');i.weaponPrev=i.weaponPrev||pb('weaponPrev');i.reload=i.reload||pb('reload');
    i.jumpPress=i.jumpPress||pp('jump');i.jump=i.jump||pb('jump');
    i.bite=i.bite||pb('bite');
    i.bitePress=i.bitePress||pp('bite');
    i.talk=i.talk||pb('talk');
    for(const k of CTX_IDS){if(pb(k))i[k]=true;if(pp(k))i[k+'P']=true;}
    // (the triggers, as far as they're pulled: a vehicle's analog throttle and brake)
    {const tv=k=>{const x=s.p.buttons[k];return x?Math.max(0,Math.min(1,+x.value||(x.pressed?1:0))):0;};i.rt=Math.max(i.rt||0,tv(7));i.lt=Math.max(i.lt||0,tv(6));}
  };
  if(DT.menu){const I=P1.in;for(const k in I)if(typeof I[k]==='boolean')I[k]=false;I.x=I.z=0;}
  // (online chat: the controller's quick messages take it over while their list is up, and while a line's being typed
  // or picked player one stands still, so the keys typed never walk them off)
  if(s1&&chatPad(s1))s1=null;
  // (every controller a player has counts: a second one of player one's adds to the first, as the keyboard does)
  apply(P1,s1);if(s1)for(const s of S1)if(s!==s1)apply(P1,s);
  if(P2.active&&!P2.net){apply(P2,s2);if(s2)for(const s of S2)if(s!==s2)apply(P2,s);}
  for(const p of players)if(!p.net)ctxApply(p);
  if(CHAT.open||CHAT.quick){const I=P1.in;for(const k in I)if(typeof I[k]==='boolean')I[k]=false;I.x=I.z=0;I.lookX=I.lookY=0;}
  for(const p of players)p.in.chargeHeld=p.in.charge;
  if(DT.freecam&&!P1.paused)updateFreecam(dt,s1);
  for(const p of players)if(!abilOf(p).climb)p.in.climb=false;   // (each player's own switch)
}

