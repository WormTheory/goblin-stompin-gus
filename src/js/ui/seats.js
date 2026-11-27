// ---------- Who plays on what, and player two's own window ----------
// The Controls screen's Players section lists every input it has seen (the keyboard and mouse, and each controller) with
// a Player 1 / Player 2 switch on each. Left alone it's Auto, the old rule: playing alone the first controller is yours and
// the second joins with Start; in co-op the first two are one each, or a lone controller is player two's and the keyboard
// player one's. Touching a switch makes it Manual (kept in this browser, INMAP), and Auto puts it back. The seats only
// count while both are playing here: alone, the keyboard is always yours, and a controller set to player two is the one
// that joins.
const INMAP_KEY='goblin-stompin-gus-inputs';
const INMAP={auto:true,kb:1,pad:{}};
try{const o=JSON.parse(localStorage.getItem(INMAP_KEY)||'null');
  if(o&&typeof o==='object'){INMAP.auto=o.auto!==false;INMAP.kb=o.kb===2?2:1;if(o.pad&&typeof o.pad==='object')for(const k in o.pad)if(o.pad[k]===1||o.pad[k]===2)INMAP.pad[k]=o.pad[k];}}catch(e){}
function inmapSave(){try{localStorage.setItem(INMAP_KEY,JSON.stringify(INMAP));}catch(e){}}
function twoHere(){return !!(P2.active&&!P2.net);}
// (pad index -> 1, 2, or 0 for nobody's: Auto leaves a third controller and more out, as before)
function padSeats(pads){const m=new Map();
  if(INMAP.auto){if(twoHere()&&pads.length===1)m.set(pads[0].index,2);else pads.forEach((p,i)=>m.set(p.index,i<2?i+1:0));return m;}
  for(const p of pads){let v=INMAP.pad[p.index];
    // (a controller first seen in Manual goes to player two if nothing else is theirs yet, so it can join)
    if(v!==1&&v!==2){v=INMAP.kb===2||pads.some(q=>INMAP.pad[q.index]===2)?1:2;INMAP.pad[p.index]=v;inmapSave();}
    m.set(p.index,v);}
  return m;}
function kbP(){return !INMAP.auto&&INMAP.kb===2&&twoHere()?P2:P1;}
function kbCanvas(){return kbP()===P2&&w2Live()?W2.cv:canvas;}
// (a switch touched: Auto's answer for everything connected becomes Manual's starting point, then the one change)
function inmapSet(k,seat){
  if(INMAP.auto){const ps=connectedPads(),m=padSeats(ps);INMAP.auto=false;INMAP.kb=1;INMAP.pad={};for(const p of ps)INMAP.pad[p.index]=m.get(p.index)===2?2:1;}
  if(k==='kb')INMAP.kb=seat;else INMAP.pad[k]=seat;
  inmapSave();seatsRender();
}
// (when each input was last used, to light up its row: pressing something finds it in the list)
const SEAT={kbT:-1e9,padT:new Map(),sig:''};
function seatKb(){SEAT.kbT=performance.now();}
addEventListener('keydown',seatKb);addEventListener('mousedown',seatKb);
const padName=p=>String(p.id||'Controller').replace(/\s*\(.*$/,'').replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i,'').trim()||'Controller';
function seatsRender(){
  const box=document.getElementById('seatRows');if(!box)return;
  const ps=connectedPads(),m=padSeats(ps),kb=INMAP.auto?1:INMAP.kb;
  const seg=(k,v,lab)=>`<div class="seg seatseg" role="radiogroup" aria-label="${lab}">${[1,2].map(n=>`<button type="button" role="radio" class="s${n}" data-in="${k}" data-seat="${n}" aria-checked="${v===n}">Player ${n}</button>`).join('')}</div>`;
  let h=`<div class="seatrow" data-in="kb"><span class="seatname">Keyboard &amp; mouse</span>${seg('kb',kb,'Keyboard and mouse')}</div>`;
  for(const p of ps){const nm=padName(p);h+=`<div class="seatrow" data-in="${p.index}"><span class="seatname">Controller ${p.index+1}<small>${nm.replace(/[<&>"]/g,'')}</small></span>${seg(p.index,m.get(p.index)||0,'Controller '+(p.index+1))}</div>`;}
  const keep=document.activeElement&&box.contains(document.activeElement)?[document.activeElement.dataset.in,document.activeElement.dataset.seat]:null;
  box.innerHTML=h;
  if(keep){const b=box.querySelector(`button[data-in="${keep[0]}"][data-seat="${keep[1]}"]`);if(b){if(inputKind==='pad')padFocus(b);else b.focus({preventScroll:true});}}
  const au=document.getElementById('seatAuto');if(au)au.hidden=INMAP.auto;
  w2Show();
}
document.getElementById('seatRows').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[data-seat]');if(!b)return;inmapSet(b.dataset.in==='kb'?'kb':+b.dataset.in,+b.dataset.seat);});
document.getElementById('seatAuto').addEventListener('click',()=>{INMAP.auto=true;inmapSave();seatsRender();const r=document.querySelector('#seatRows button');if(r){if(inputKind==='pad')padFocus(r);else r.focus({preventScroll:true});}});
// (every frame, from readInputs: notes which controllers were used, redraws the list when they come or go, and checks on
// player two's window)
function seatsSeen(st){
  const now=performance.now();
  for(const s of st)if(s.b.some(Boolean)||s.p.axes.some(a=>Math.abs(a)>0.5))SEAT.padT.set(s.p.index,now);
  w2Check();
  const pane=document.getElementById('tabMulti');if(!menuOpen||!pane||pane.hidden)return;
  const sig=st.map(s=>s.p.index+':'+s.p.id).join('|')+'/'+JSON.stringify(INMAP)+(twoHere()?'2':'1')+(W2.win?'w':'');
  if(sig!==SEAT.sig){SEAT.sig=sig;seatsRender();}
  for(const r of document.querySelectorAll('#seatRows .seatrow')){const k=r.dataset.in,t=k==='kb'?SEAT.kbT:SEAT.padT.get(+k)||-1e9;r.classList.toggle('live',now-t<350);}
}

// Player two's own window: the Controls screen's Player 2 screen lets player two play in a second window (meant for a second monitor) instead of on half
// of this one. It's an empty page opened from here and written into, with a canvas and player two's HUD (P2.ui.view, moved
// across) and a renderer of its own (W2.r), drawing the same scene from P2's camera (renderView's R): the same game, so
// nothing's sent between them, but the graphics card holds everything twice. Where the browser has the Window Management
// API (Chrome, Edge) and it's allowed, the window opens full screen on the other monitor; elsewhere it opens beside, to be
// dragged across, with a full-screen button. Both windows' keys and mouse go to the same handlers, and controllers are read
// through both (w2Pads), since a browser may only tell the window with focus about them.
const W2_KEY='goblin-stompin-gus-screen2';
const W2={mode:'split',win:null,cv:null,r:null,hud:null,fs:null,idle:null,ok:false,w:0,h:0,pr:0,cls:null,ui:null,uiOff:null,flt:null,blocked:false,aa:null};
try{W2.mode=localStorage.getItem(W2_KEY)==='win'?'win':'split';}catch(e){}
try{navigator.permissions.query({name:'window-management'}).then(st=>{W2.ok=st.state==='granted';st.onchange=()=>{W2.ok=st.state==='granted';};}).catch(()=>{});}catch(e){}
function w2Open_(){return !!(W2.win&&!W2.win.closed);}
function w2Live(){return !!(W2.r&&w2Open_()&&twoHere());}
function w2Locked(){try{return !!(w2Open_()&&W2.cv&&W2.win.document.pointerLockElement===W2.cv);}catch(e){return false;}}
function w2Unlock(){try{if(w2Open_()&&W2.win.document.pointerLockElement)W2.win.document.exitPointerLock();}catch(e){}}
function w2Pads(ps){
  if(!w2Open_())return ps;let q=[],dt=0;
  try{q=Array.from(W2.win.navigator.getGamepads());dt=W2.win.performance.timeOrigin-performance.timeOrigin;}catch(e){return ps;}
  const out=ps.slice();
  for(const p of q){if(!p||!p.connected)continue;const o=out[p.index];if(!o||!o.connected||p.timestamp+dt>o.timestamp)out[p.index]=p;}
  return out;
}
// (the other monitor, if the browser will say: getScreenDetails asks permission the first time)
async function w2Screen(){if(!('getScreenDetails' in window))return null;
  try{const d=await window.getScreenDetails();W2.ok=true;return d.screens.find(s=>s!==d.currentScreen)||null;}catch(e){return null;}}
async function w2Open(){
  if(w2Open_()){try{W2.win.focus();}catch(e){}return;}
  // (already allowed: ask for the screens first and open straight on to the other one, full screen. Otherwise open now,
  // while the click still counts, and move it across once the browser's been asked)
  let sc=W2.ok?await w2Screen():null;
  const f=sc?`popup,fullscreen,left=${sc.availLeft},top=${sc.availTop},width=${sc.availWidth},height=${sc.availHeight}`:'popup,width=960,height=540';
  let w=null;try{w=window.open('','gsg-player2',f);}catch(e){}
  W2.blocked=!w;
  if(!w){seatsRender();return;}
  if(!w2Setup(w)){try{w.close();}catch(e){}seatsRender();return;}
  if(!sc){sc=await w2Screen();if(sc&&w2Open_())try{w.moveTo(sc.availLeft,sc.availTop);w.resizeTo(sc.availWidth,sc.availHeight);}catch(e){}}
  // (the keyboard stays here unless it's player two's)
  setTimeout(()=>{if(kbP()===P1)try{window.focus();}catch(e){}},400);
  seatsRender();
}
function w2Setup(w){
  let d;try{d=w.document;d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title>Goblin-Stompin\' Gus</title></head><body></body></html>');d.close();}catch(e){return false;}
  for(const el of document.querySelectorAll('style,link[rel="stylesheet"]')){const c=d.importNode(el,true);if(el.id==='uiOff')W2.uiOff=c;c.removeAttribute('id');d.head.append(c);}
  const own=d.createElement('style');
  own.textContent='html,body{margin:0;height:100%;overflow:hidden;background:#0c0f14}canvas.w2cv{position:fixed;inset:0;width:100%;height:100%;display:block}'+
    '.w2fs{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:60;pointer-events:auto;font:400 20px/1 var(--f-px);letter-spacing:.5px;text-transform:uppercase;color:var(--ink);background:var(--bone);padding:8px 14px 6px;border:3px solid var(--ink);border-radius:var(--wobs);box-shadow:3px 3px 0 var(--ink);cursor:pointer}'+
    '.w2idle{position:fixed;inset:0;display:grid;place-items:center;font:400 64px/1 var(--f-px);letter-spacing:2px;text-transform:uppercase;color:var(--pink);text-shadow:4px 4px 0 var(--ink)}';
  d.head.append(own);
  const cv=d.createElement('canvas');cv.className='w2cv';
  const hud=d.createElement('div');hud.className='hud';
  const idle=d.createElement('div');idle.className='w2idle';
  const fs=d.createElement('button');fs.type='button';fs.className='w2fs';fs.textContent='Full screen';
  fs.addEventListener('click',()=>{try{const r=d.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{});}catch(e){}});
  d.body.append(cv,idle,hud,fs);
  // (three.js tells WebGL2 from WebGL1 by instanceof, against this window's WebGL2RenderingContext, and a context from the
  // other window's canvas is the other window's kind: lent theirs while it looks, it gets WebGL2 as the first window does)
  let r;const G2=window.WebGL2RenderingContext;
  try{if(w.WebGL2RenderingContext)window.WebGL2RenderingContext=w.WebGL2RenderingContext;r=new THREE.WebGLRenderer({canvas:cv,antialias:false});}catch(e){return false;}
  finally{window.WebGL2RenderingContext=G2;}
  if(!r||typeof r.render!=='function')return false;
  r.localClippingEnabled=true;
  Object.assign(W2,{win:w,cv,r,hud,fs,idle,w:0,h:0,pr:0,cls:null,flt:null,aa:aaNew()});   // (aa: its own anti-aliasing target, render/view.js)
  hud.append(P2.ui.view);
  // (this window's keys and mouse drive the game as the first window's do: whoever has the keyboard, kbP)
  w.addEventListener('keydown',e=>{seatKb();onKeyDown(e);});w.addEventListener('keyup',onKeyUp);w.addEventListener('blur',onBlur);
  w.addEventListener('mousemove',onMouseMove);w.addEventListener('mouseup',onMouseUp);w.addEventListener('mousedown',seatKb);
  cv.addEventListener('mousedown',onCanvasDown);cv.addEventListener('wheel',onWheel,{passive:false});cv.addEventListener('contextmenu',e=>e.preventDefault());
  // (Esc lets the mouse go: that pauses player two, if it's theirs and this window still has focus)
  d.addEventListener('pointerlockchange',()=>{if(w2Locked()){lockOk=true;return;}
    try{if(kbP()===P2&&playing&&!menuOpen&&!P2.paused&&!dragMode&&d.hasFocus())requestPause(P2);}catch(e){}});
  w.addEventListener('pagehide',()=>setTimeout(w2Check,0));
  try{regionsClear();}catch(e){}   // (merged far chunks have let their arrays go once drawn: made again, they keep them, regDrop)
  try{r.compile(scene,P2.camera);}catch(e){}   // (its own copy of every program now, not mid-game: warmShaders)
  w2Sync();layout();
  return true;
}
// (the window shut, from either side: player two's HUD comes home and it's split screen again)
function w2Close(){
  if(!W2.r&&!W2.win)return;
  const hud=document.getElementById('hud');if(hud)hud.insertBefore(P2.ui.view,hud.firstChild);
  try{if(W2.aa&&W2.aa.rt)W2.aa.rt.dispose();}catch(e){}
  try{W2.r.dispose();}catch(e){}
  try{if(W2.win&&!W2.win.closed)W2.win.close();}catch(e){}
  Object.assign(W2,{win:null,cv:null,r:null,hud:null,fs:null,idle:null,uiOff:null,aa:null});
  layout();seatsRender();
}
function w2Check(){if((W2.win||W2.r)&&!w2Open_())w2Close();else w2Sync();}
addEventListener('pagehide',()=>{try{if(w2Open_())W2.win.close();}catch(e){}});
// (what the first window's page carries that the picture and HUD answer to: the brightness, the Interface switches, the body's classes)
function w2Sync(){
  if(!w2Open_())return;const d=W2.win.document;
  const f=canvas.style.filter||'';if(f!==W2.flt){W2.flt=f;W2.cv.style.filter=f;}
  const c=document.body.className;if(c!==W2.cls){W2.cls=c;d.body.className=c;}
  const u=document.getElementById('uiOff');if(u&&W2.uiOff&&u.textContent!==W2.uiOff.textContent)W2.uiOff.textContent=u.textContent;
  const live=twoHere();W2.idle.hidden=live;if(!live&&W2.idle.textContent!==charName(P2))W2.idle.textContent=charName(P2);
  W2.fs.hidden=!!d.fullscreenElement||w2Locked();
}
function w2Render(){
  if(!w2Live())return;const W=W2.win,w=W.innerWidth,h=W.innerHeight;if(w<2||h<2)return;
  const pr=pxRatio(Math.min(W.devicePixelRatio||1,1.5),w,h);   // (RENDER SCALE here too)
  if(pr!==W2.pr){W2.pr=pr;W2.r.setPixelRatio(pr);W2.w=0;}
  if(w!==W2.w||h!==W2.h){W2.w=w;W2.h=h;W2.r.setSize(w,h,false);layout();}
  W2.r.setScissorTest(false);aaBegin(W2.aa,W2.r);renderView(P2,0,0,w,h,W2.r);aaEnd(W2.aa,W2.r,w,h);
}
// (Player 2 screen: player two on half this screen or in a window of their own)
function w2Show(){
  const seg=document.getElementById('scrSeg');if(!seg)return;
  for(const b of seg.querySelectorAll('button'))b.setAttribute('aria-checked',String(b.dataset.scr===W2.mode));
  const op=document.getElementById('scrOpen');if(op)op.hidden=W2.mode!=='win'||w2Open_();
  const n=document.getElementById('scrNote');if(n){n.hidden=!(W2.mode==='win'&&W2.blocked&&!w2Open_());n.textContent='The browser blocked the window: allow pop-ups for this page.';}
}
document.getElementById('scrSeg').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[data-scr]');if(!b)return;
  W2.mode=b.dataset.scr==='win'?'win':'split';try{localStorage.setItem(W2_KEY,W2.mode);}catch(err){}
  if(W2.mode==='split')w2Close();else if(twoHere()&&!w2Open_())w2Open();
  w2Show();});
document.getElementById('scrOpen').addEventListener('click',()=>w2Open());
// (Co-op, clicked, with Second window chosen: the window opens with it. A controller's press can't open one, so a pad that
// starts co-op plays in split screen until Open window is clicked)
{const s0=startPlay;startPlay=function startPlay(mode,fromPad){if(mode==='coop'&&W2.mode==='win'&&!fromPad&&!netOn()&&!w2Open_())w2Open();s0(mode,fromPad);};}
seatsRender();
