// ---- controls tab: shows whichever input the player is using (or the one they pick) ----
let inputKind=matchMedia('(pointer: coarse)').matches?'touch':'kbm',padStyle='xbox',ctlView='auto';
let lastPadT=-1e9;
function noteInput(kind,pad){
  if(kind==='pad')lastPadT=performance.now();
  let changed=kind!==inputKind;
  if(kind==='pad'&&pad){const st=/054c|playstation|dualsense|dualshock/i.test(pad.id||'')?'ps':'xbox';if(st!==padStyle){padStyle=st;changed=true;}}
  inputKind=kind;
  promptT=0;
  if(changed&&menuOpen&&curTab==='controls')renderControls();
}
addEventListener('keydown',()=>noteInput('kbm'),true);
addEventListener('mousedown',()=>noteInput('kbm'),true);
addEventListener('touchstart',()=>noteInput('touch'),{capture:true,passive:true});
document.querySelectorAll('.ctl-seg button').forEach(b=>b.addEventListener('click',()=>{ctlView=b.dataset.view;renderControls();}));
const CC={walk:'#6cbf45',look:'#4fb3b0',jump:'#5a92e0',bite:'#e0b030',stomp:'#e0564a',charge:'#e08a34',pause:'#9aa4ae',menu:'#7b8794'};
// ---- re-bindable controls: each action can have up to two keys (or mouse buttons) and up to two controller buttons.
// Kept in the browser. (Esc, ~ and the debug keys P V . [ ], Enter, which opens the online chat, and a controller's Start and Select, stay as they are.)
const BIND_KEY='goblin-binds-v1';
const ACTS=[
  {id:'fwd',n:'Walk forward',c:CC.walk,kb:['KeyW','ArrowUp'],pad:[]},
  {id:'back',n:'Walk back',c:CC.walk,kb:['KeyS','ArrowDown'],pad:[]},
  {id:'left',n:'Walk left',c:CC.walk,kb:['KeyA','ArrowLeft'],pad:[]},
  {id:'right',n:'Walk right',c:CC.walk,kb:['KeyD','ArrowRight'],pad:[]},
  {id:'jump',n:'Jump',c:CC.jump,kb:['Space'],pad:[0]},
  {id:'bite',n:'Bite',c:CC.bite,kb:['Mouse0'],pad:[2,5]},
  {id:'stomp',n:'Stomp',c:CC.stomp,kb:['Mouse2','KeyE'],pad:[7]},
  {id:'dashSprint',n:'Dash (hold to Sprint)',c:CC.charge,kb:['ShiftLeft','ShiftRight'],pad:[1,10]},
  {id:'dash',n:'Dash',c:'#f2c060',kb:[],pad:[]},
  {id:'sprint',n:'Sprint',c:'#c9662c',kb:[],pad:[6]},
  {id:'lock',n:'Lock on',c:'#e0564a',kb:['KeyQ'],pad:[11]},
  {id:'climb',n:'Spider Climb (hold)',c:'#9a7ae0',kb:['KeyC'],pad:[4]},
  {id:'use',n:'Get in / out (as Gnash)',c:'#6ab0d8',kb:['KeyF'],pad:[3]},
  {id:'weapon',n:'Next weapon (as Gnash)',c:'#b0b8c0',kb:['MouseWheelDown'],pad:[15]},   // (not R any more: the wheel does it)
  {id:'weaponPrev',n:'Previous weapon (as Gnash)',c:'#b0b8c0',kb:['MouseWheelUp'],pad:[14]},   // (D-pad left, which was push to talk's)
  {id:'reload',n:'Reload (as Gnash)',c:'#d0b070',kb:['KeyX'],pad:[13]},   // (D-pad down: a gun's next magazine)
  {id:'talk',n:'Push to talk (online voice chat)',c:'#7fc8a0',kb:['KeyT'],pad:[]},   // (no button free on a controller: set one in the Controls tab)
  {id:'quickChat',n:'Quick chat message (online)',c:'#8fb8e0',kb:[],pad:[12]},
  // (piloting a Mobile Gear: its own set, which only counts while you're in one, so these can share keys and buttons
  // with the ones above. mg: one of these; see mech.js. The weapons are named by where they're carried, since the
  // loadout picks what each slot holds)
  {id:'mgJump',n:'Jump (hold to fly up)',c:CC.jump,kb:['Space'],pad:[0],mg:true},
  {id:'mgQB',n:'Quick boost',c:'#5ec8f0',kb:['ShiftLeft'],pad:[2],mg:true},
  {id:'mgBoost',n:'Boost on / off',c:'#3a8fd8',kb:['KeyC'],pad:[1],mg:true},
  {id:'mgOut',n:'Get out (hold)',c:'#6ab0d8',kb:['KeyF'],pad:[3],mg:true},
  {id:'mgArmL',n:'Left arm weapon',c:'#ff9a3a',kb:['Mouse0'],pad:[4],mg:true},
  {id:'mgArmR',n:'Right arm weapon (hold)',c:CC.bite,kb:['Mouse2'],pad:[5],mg:true},
  {id:'mgShL',n:'Left shoulder weapon (Swarm Pod: hold to lock, let go to fire)',c:'#d8d8d0',kb:['KeyQ'],pad:[6],mg:true},
  {id:'mgShR',n:'Right shoulder weapon',c:CC.stomp,kb:['KeyE'],pad:[7],mg:true},
  {id:'mgLock',n:'Hard lock on / off',c:'#e0564a',kb:['Mouse1'],pad:[11],mg:true},
  {id:'mgAB',n:'Assault boost (again near a target: kick)',c:'#7fd0ff',kb:['KeyX'],pad:[10],mg:true},
  {id:'mgRep',n:'Repair kit',c:'#7ed060',kb:['KeyR'],pad:[13],mg:true},   // (D-pad down: up is the online quick chat)
  // (driving: each kind of vehicle has a set of its own, its control context (ctx, from its kind's entry in VEHICLE_KINDS),
  // read only while you're in one of that kind, so they never take keys off each other or the ones on foot. Steering and
  // the throttle are the walking keys and the left stick, as the Mobile Gear's movement is, and on a controller the
  // triggers are an analog throttle and brake in anything with wheels or a hull (i.rt, i.lt). Get in / out, Lock on and
  // the online chat keys stay as they are on foot. as: the control on foot whose place this takes, so the vehicles that
  // read it (a car's horn on bite, say) need nothing else)
  {id:'rdHand',n:'Handbrake, drift',c:CC.jump,kb:['Space'],pad:[5],ctx:'road'},
  {id:'rdHorn',n:'Horn (fire engine: water cannon)',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'road',as:'bite'},
  {id:'rdSpec',n:'Special (siren, nitro, wheelie, hop...)',c:CC.stomp,kb:['Mouse2'],pad:[4],ctx:'road',as:'stomp'},
  {id:'rdBehind',n:'Look behind (hold)',c:CC.look,kb:['KeyC'],pad:[10],ctx:'road'},
  {id:'rdSeat',n:'Swap seats (driver / gunner)',c:'#b0b8c0',kb:['KeyX'],pad:[1],ctx:'road',as:'weapon'},
  {id:'lfUp',n:'Raise the forks (hold)',c:CC.jump,kb:['Space'],pad:[5],ctx:'lift'},
  {id:'lfDown',n:'Lower the forks (hold)',c:'#9a7ae0',kb:['KeyC'],pad:[4],ctx:'lift'},
  {id:'lfTilt',n:'Tilt the mast (hold, with raise / lower)',c:CC.charge,kb:['ShiftLeft'],pad:[2],ctx:'lift'},
  {id:'lfHorn',n:'Horn',c:CC.bite,kb:['Mouse0'],pad:[1],ctx:'lift',as:'bite'},
  {id:'fmCruise',n:'Hand throttle: up a cruise step',c:CC.charge,kb:['KeyR'],pad:[15],ctx:'farm'},
  {id:'fmCruiseDn',n:'Hand throttle: down a cruise step',c:CC.charge,kb:['ShiftLeft'],pad:[13],ctx:'farm'},   // (D-pad down: up is the online quick chat, left push to talk)
  {id:'fmImp',n:'Raise / lower the implement',c:CC.jump,kb:['Space'],pad:[5],ctx:'farm'},
  {id:'fmSwap',n:'Swap implement (plough, mower, none)',c:CC.stomp,kb:['Mouse2'],pad:[4],ctx:'farm'},
  {id:'fmHorn',n:'Horn',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'farm',as:'bite'},
  {id:'tkFire',n:'Fire the gun',c:CC.bite,kb:['Mouse0'],pad:[7],ctx:'tank',as:'bite'},
  {id:'tkZoom',n:'Gunsight (hold)',c:CC.look,kb:['Mouse2'],pad:[6],ctx:'tank'},
  {id:'tkHull',n:'Hull lock on / off',c:'#9a7ae0',kb:['KeyC'],pad:[4],ctx:'tank'},
  {id:'tkCruise',n:'Cruise step',c:CC.charge,kb:['ShiftLeft'],pad:[10],ctx:'tank'},
  {id:'tkShell',n:'Shell: HE / AP',c:CC.stomp,kb:['KeyR'],pad:[15],ctx:'tank'},
  {id:'tkSeat',n:'Swap seats (driver / gunner)',c:'#b0b8c0',kb:['KeyX'],pad:[1],ctx:'tank',as:'weapon'},
  {id:'hcUp',n:'Climb',c:CC.jump,kb:['Space'],pad:[5],ctx:'heli',as:'jump'},
  {id:'hcDown',n:'Descend',c:'#9a7ae0',kb:['KeyC'],pad:[4],ctx:'heli',as:'climb'},
  {id:'hcGun',n:'Machine gun (hold)',c:CC.bite,kb:['Mouse0'],pad:[7],ctx:'heli',as:'bite'},
  {id:'hcRkt',n:'Rockets',c:CC.stomp,kb:['Mouse2'],pad:[6],ctx:'heli',as:'stomp'},
  {id:'hcMode',n:'Flight mode: Simple / Agile',c:CC.charge,kb:['KeyR'],pad:[15],ctx:'heli'},
  {id:'hcSeat',n:'Swap seats (pilot / gunner)',c:'#b0b8c0',kb:['KeyX'],pad:[1],ctx:'heli',as:'weapon'},
  {id:'arThrUp',n:'Throttle up (Direct mode)',c:CC.charge,kb:['ShiftLeft'],pad:[7],ctx:'air',as:'jump'},
  {id:'arThrDn',n:'Throttle down (Direct mode)',c:'#9a7ae0',kb:['KeyC'],pad:[6],ctx:'air',as:'climb'},
  {id:'arYawL',n:'Rudder left',c:CC.walk,kb:['KeyQ'],pad:[4],ctx:'air'},
  {id:'arYawR',n:'Rudder right',c:CC.walk,kb:['KeyE'],pad:[5],ctx:'air'},
  {id:'arBrake',n:'Brakes, airbrake',c:CC.jump,kb:['Space'],pad:[0],ctx:'air'},
  {id:'arGun',n:'Cannon (hold)',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'air',as:'bite'},
  {id:'arMsl',n:'Missile, smoke trail, autopilot',c:CC.stomp,kb:['Mouse2'],pad:[1],ctx:'air',as:'stomp'},
  {id:'arGear',n:'Undercarriage (jet: hook)',c:'#b0b8c0',kb:['KeyR'],pad:[10],ctx:'air',as:'weapon'},
  {id:'arLook',n:'Free look (hold, Mouse-aim)',c:CC.look,kb:['KeyX'],pad:[],ctx:'air'},
  {id:'arLock',n:'Lock on',c:'#e0564a',kb:['Mouse1'],pad:[11],ctx:'air',as:'lock'},
  {id:'seAnchor',n:'Drop / raise the anchor',c:CC.jump,kb:['Space'],pad:[5],ctx:'sea'},
  {id:'seHorn',n:'Horn (rowboat: left oar)',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'sea',as:'bite'},
  {id:'seSpec',n:'Special (rowboat: right oar)',c:CC.stomp,kb:['Mouse2'],pad:[4],ctx:'sea',as:'stomp'},
  {id:'seMid',n:'Ship: rudder amidships',c:'#9a7ae0',kb:['KeyC'],pad:[1],ctx:'sea',as:'climb'},
  {id:'seView',n:'Ship: bridge view',c:'#b0b8c0',kb:['KeyR'],pad:[15],ctx:'sea',as:'weapon'},
  {id:'rlRev',n:'Reverser: forward, neutral, reverse',c:CC.charge,kb:['KeyR'],pad:[15],ctx:'rail'},
  {id:'rlEmerg',n:'Emergency brake',c:CC.jump,kb:['Space'],pad:[0],ctx:'rail'},
  {id:'rlHorn',n:'Horn (hold for a long blast)',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'rail',as:'bite'},
  {id:'rlBell',n:'Bell',c:CC.stomp,kb:['Mouse2'],pad:[4],ctx:'rail'},
  {id:'blBurn',n:'Burner (hold)',c:CC.jump,kb:['Space'],pad:[0,7],ctx:'balloon',as:'jump'},
  {id:'blVent',n:'Vent',c:'#9a7ae0',kb:['KeyC'],pad:[1,6],ctx:'balloon',as:'climb'},
  {id:'blBag',n:'Drop a sandbag',c:CC.stomp,kb:['Mouse2'],pad:[5],ctx:'balloon'},
  {id:'blRope',n:'Drop / pull up the rope',c:CC.bite,kb:['Mouse0'],pad:[2],ctx:'balloon'},
];
for(const a of ACTS)if(a.mg)a.ctx='mg';
const MG_IDS=ACTS.filter(a=>a.mg).map(a=>a.id),MG_PRESS=MG_IDS.map(k=>k+'P');
// every vehicle's own controls (the Mobile Gear's among them), and the headings of their sections in the Controls tab
const CTX_IDS=ACTS.filter(a=>a.ctx).map(a=>a.id),CTX_PRESS=CTX_IDS.map(k=>k+'P');
const CTX_NAMES={road:'Driving cars, bikes and trucks',lift:'Driving a forklift',farm:'Driving a tractor',tank:'Driving a tank',heli:'Flying a helicopter',
  air:'Flying a plane',sea:'Boats and ships',rail:'Driving a train',balloon:'Flying a hot-air balloon',mg:'Piloting a Mobile Gear (Testing Environment)'};
// (the controls on foot that a vehicle's own set takes over while you're in it: everything but Get in / out, Lock on and
// the online chat keys, which work everywhere)
const CTX_TAKES=['bite','stomp','jump','climb','charge','dash','sprint','weapon','weaponPrev','reload'];
const KB_RESERVED=new Set(['Escape','Backquote','KeyP','KeyV','Period','BracketLeft','BracketRight','Backspace','Delete','Enter','NumpadEnter']),PAD_RESERVED=new Set([8,9]);
let BINDS={};
function defaultBinds(){const o={};for(const a of ACTS)o[a.id]={kb:a.kb.slice(),pad:a.pad.slice()};return o;}
function loadBinds(){BINDS=defaultBinds();
  try{const v=JSON.parse(localStorage.getItem(BIND_KEY)||'null');if(v&&typeof v==='object')for(const a of ACTS){const b=v[a.id];if(!b)continue;
    if(Array.isArray(b.kb))BINDS[a.id].kb=[...new Set(b.kb.filter(c=>typeof c==='string'&&c.length<40&&!KB_RESERVED.has(c)))].slice(0,2);
    if(Array.isArray(b.pad))BINDS[a.id].pad=[...new Set(b.pad.filter(i=>Number.isInteger(i)&&i>=0&&i<24&&!PAD_RESERVED.has(i)))].slice(0,2);
    // (the Mobile Gear's weapons moved buttons on the controller: saved controls still on the old ones take the new)
    if(MG_PAD_WAS[a.id]!==undefined&&BINDS[a.id].pad.length===1&&BINDS[a.id].pad[0]===MG_PAD_WAS[a.id])BINDS[a.id].pad=a.pad.slice();}
    // (an action added since these were saved starts on its defaults, but not on a key or button the player has already
    // given something else in the same context: Reload's X or D-pad down, say, moved on to another move by hand, would
    // otherwise do both. It's left unbound there, for the player to set)
    // (saved before Previous weapon: push to talk still on its old D-pad left gives it up, and Next weapon takes the
    // wheel down if it has room for it)
    if(v&&typeof v==='object'&&!v.weaponPrev){const T=BINDS.talk.pad,W=BINDS.weapon.kb;if(T.length===1&&T[0]===14)BINDS.talk.pad=[];
      if(W.length<2&&!ACTS.some(o=>!o.ctx&&BINDS[o.id].kb.includes('MouseWheelDown')))W.push('MouseWheelDown');}
    // (Next weapon was on R as well as the wheel: saved controls from then let R go, once, and keep the wheel)
    if(v&&typeof v==='object'&&!localStorage.getItem(BIND_KEY+'-noR')){const W=BINDS.weapon.kb,i=W.indexOf('KeyR');if(i>=0)W.splice(i,1);
      if(!W.length&&!ACTS.some(o=>!o.ctx&&BINDS[o.id].kb.includes('MouseWheelDown')))W.push('MouseWheelDown');localStorage.setItem(BIND_KEY+'-noR','1');}
    if(v&&typeof v==='object')for(const a of ACTS){if(v[a.id])continue;const cx=a.ctx||'';
      for(const dev of ['kb','pad'])BINDS[a.id][dev]=BINDS[a.id][dev].filter(c=>!ACTS.some(o=>o!==a&&v[o.id]&&(o.ctx||'')===cx&&BINDS[o.id][dev].includes(c)));}}catch(e){}}
const MG_PAD_WAS={mgArmL:6,mgArmR:7,mgShL:4,mgShR:5};
function saveBinds(){try{localStorage.setItem(BIND_KEY,JSON.stringify(BINDS));}catch(e){}}
loadBinds();
const KEY_NAMES={Mouse0:'Left click',Mouse1:'Middle click',Mouse2:'Right click',Mouse3:'Mouse 4',Mouse4:'Mouse 5',MouseWheelUp:'Wheel up',MouseWheelDown:'Wheel down',Space:'Space',ShiftLeft:'Left Shift',ShiftRight:'Right Shift',
  ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',AltLeft:'Left Alt',AltRight:'Right Alt',MetaLeft:'Left ⌘',MetaRight:'Right ⌘',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
  Enter:'Enter',Tab:'Tab',CapsLock:'Caps Lock',Comma:',',Slash:'/',Semicolon:';',Quote:"'",Backslash:'\\',Minus:'-',Equal:'=',Insert:'Insert',Home:'Home',End:'End',PageUp:'Page Up',PageDown:'Page Down',IntlBackslash:'\\'};
function keyLabel(c){if(!c)return '—';if(KEY_NAMES[c])return KEY_NAMES[c];if(c.startsWith('Key'))return c.slice(3);if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad'))return 'Num '+c.slice(6);return c;}
function padLabel(i,ps){if(i==null)return '—';
  const X=['A','B','X','Y','LB','RB','LT','RT','View','Menu','L3','R3','D-pad ↑','D-pad ↓','D-pad ←','D-pad →','Guide'],P=['✕','○','□','△','L1','R1','L2','R2','Create','Options','L3','R3','D-pad ↑','D-pad ↓','D-pad ←','D-pad →','PS'];
  return (ps?P:X)[i]||('Button '+(i+1));}
const actOf=id=>ACTS.find(a=>a.id===id);
// what's held right now on the keyboard, mouse and touch buttons (Gus's own controls)
const mHeld=new Set(),mTap=new Set(),touchHeld=new Set(),kbPrevA={};
function kbAct(id){const B=BINDS[id];if(B)for(const c of B.kb)if(c.startsWith('Mouse')?(mHeld.has(c)||mTap.has(c)):keys.has(c))return true;return touchHeld.has(id);}
// a button in the HUD, drawn as the menus draw it (glyph): a line of HUD text carries ⟦glyph id⟧ where one goes, and hudHTML
// turns that line into the page's markup
// (the sticks pressed in are named L3 and R3: LS and RS are the sticks themselves, pushed about)
const PAD_GLYPH=['A','B','X','Y','LB','RB','LT','RT','SELECT','START','KEY:L3','KEY:R3','DPAD:v','DPAD:v','DPAD:h','DPAD:h'];
function bindGlyph(dev,v){if(v==null)return null;if(dev==='pad')return PAD_GLYPH[v]||'KEY:'+padLabel(v,padStyle==='ps');return v==='Mouse0'?'LMB':v==='Mouse2'?'RMB':v==='Mouse1'?'WHEEL':v==='MouseWheelUp'?'WHEELUP':v==='MouseWheelDown'?'WHEELDN':'KEY:'+keyLabel(v);}
const btnMark=g=>g?'⟦'+g+'⟧':'';
// (the first button bound to an action, on a player's controller or else the keyboard and mouse)
// (in a vehicle, a control on foot that its own set takes over is named by what's bound there: a car's horn, not bite)
const CTX_AS={};for(const a of ACTS)if(a.ctx&&a.as)(CTX_AS[a.ctx]=CTX_AS[a.ctx]||{})[a.as]=a.id;
const ctxId=(p,id)=>{if(!p||!p.drv||p.drv.jack)return id;const cx=drvCtx(p.drv),m=cx&&cx!=='mg'&&CTX_AS[cx];return m&&m[id]||id;};
// (the walking actions have no controller buttons: they're the left stick, so that's what's shown for them)
const STICK_ID={fwd:'LS:v',back:'LS:v',left:'LS:h',right:'LS:h'};
const actMark=(p,id)=>{id=ctxId(p,id);const B=BINDS[id];return btnMark(p&&p.pad?bindGlyph('pad',B.pad[0])??STICK_ID[id]:bindGlyph('kb',B.kb[0]));};
// a pair of actions (W/S, A/D) as one control: the stick shown once on a controller
const actPair=(p,a,b)=>{const x=actMark(p,a),y=actMark(p,b);return x===y?x:x+'/'+y;};
function hudHTML(s){return String(s).split(/⟦([^⟧]*)⟧/).map((t,i)=>i%2?glyph(t):glEsc(t)).join('');}
// the bottom-of-screen hint, from the bindings
function bindHint(pad,p){
  const L=id=>{const B=BINDS[id];return pad?(B.pad.length?btnMark(bindGlyph('pad',B.pad[0])):null):(B.kb.length?btnMark(bindGlyph('kb',B.kb[0])):null);},hv=(p&&!p.gob?abilOf(p):ABIL).trample?'trample':'sprint',out=[];
  if(p&&p.gob)return gobHint(L,p);
  if(L('stomp'))out.push('Hold '+L('stomp')+' stomp');if(L('bite'))out.push(L('bite')+' bite');if(L('jump'))out.push(L('jump')+' jump');
  if(L('dashSprint'))out.push('tap '+L('dashSprint')+' dash, hold to '+hv);else{if(L('dash'))out.push(L('dash')+' dash');}
  if(L('sprint'))out.push('hold '+L('sprint')+' to '+hv);
  return out.join('  ·  ');
}
// playing as Gnash: his own moves (the hippo's stomps and trample aren't his), with whatever's in his hand
function gobHint(L,p){const w=p&&p.wpns?p.wpn:'club',out=[];
  // (each weapon says what its attack is, WEAPONS' player.verb; a gun with a magazine can be reloaded)
  const W=WEAPONS[w];if(L('bite'))out.push(L('bite')+' '+(W&&W.player&&W.player.verb||'swing the club'));
  if(L('reload')&&W&&W.mag)out.push(L('reload')+' reload');
  if(L('stomp'))out.push(L('stomp')+(W&&W.player&&W.player.scope?' look down the scope (hold)':' throw a grenade'));if(L('jump'))out.push(L('jump')+' jump');
  if(L('dashSprint'))out.push('tap '+L('dashSprint')+' dash, hold to sprint');else{if(L('dash'))out.push(L('dash')+' dash');}
  if(L('sprint'))out.push('hold '+L('sprint')+' to sprint');
  if(L('climb'))out.push('hold '+L('climb')+' climb');if(L('weapon'))out.push(L('weapon')+' next weapon');if(L('weaponPrev'))out.push(L('weaponPrev')+' previous weapon');if(L('use'))out.push(L('use')+' get in');
  return out.join('  ·  ');
}
// ---- rebinding: pick a slot, then press what goes in it
let BIND_CAP=null,bindMsg='',bindClickT=0;
function bindCancel(){BIND_CAP=null;bindMsg='';renderControls();}
function setBind(id,dev,i,val){
  bindMsg='';
  const cx=actOf(id).ctx||'';   // (a vehicle's controls (a Mobile Gear's, a car's...) and the ones on foot never take keys off each other)
  if(val!=null)for(const a of ACTS){if((a.ctx||'')!==cx)continue;const L=BINDS[a.id][dev],j=L.indexOf(val);if(j>=0&&!(a.id===id&&j===i)){L.splice(j,1);if(a.id!==id)bindMsg=(dev==='kb'?keyLabel(val):padLabel(val,padStyle==='ps'))+' was taken off '+a.n+'.';}}
  const L=BINDS[id][dev];
  if(val==null){if(i<L.length)L.splice(i,1);}else if(i<L.length)L[i]=val;else L.push(val);
  BINDS[id][dev]=[...new Set(L)].slice(0,2);saveBinds();
  const cap=BIND_CAP;BIND_CAP=null;renderControls();
  // (keep the highlight on the slot just set, for a controller or the keyboard)
  if(cap){const el=document.querySelector(`.rbs[data-a="${cap.id}"][data-d="${cap.dev}"][data-i="${Math.min(cap.i,BINDS[cap.id][cap.dev].length)}"]`);if(el){if(inputKind==='pad'&&typeof padFocus==='function')padFocus(el);else try{el.focus({preventScroll:true});}catch(e){}}}
}
addEventListener('keydown',e=>{if(!BIND_CAP)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  if(e.code==='Escape'){bindCancel();return;}
  if(BIND_CAP.dev!=='kb')return;
  if(e.code==='Backspace'||e.code==='Delete'){setBind(BIND_CAP.id,'kb',BIND_CAP.i,null);return;}
  if(KB_RESERVED.has(e.code)){bindMsg=keyLabel(e.code)+' is kept for the menu and debug keys: pick another.';renderControls();return;}
  setBind(BIND_CAP.id,'kb',BIND_CAP.i,e.code);},true);
addEventListener('mousedown',e=>{if(!BIND_CAP||BIND_CAP.dev!=='kb'||performance.now()-BIND_CAP.t<150)return;
  e.preventDefault();e.stopImmediatePropagation();bindClickT=performance.now();setBind(BIND_CAP.id,'kb',BIND_CAP.i,'Mouse'+e.button);},true);
addEventListener('wheel',e=>{if(!BIND_CAP||BIND_CAP.dev!=='kb'||performance.now()-BIND_CAP.t<150||!e.deltaY)return;
  e.preventDefault();e.stopImmediatePropagation();setBind(BIND_CAP.id,'kb',BIND_CAP.i,e.deltaY<0?'MouseWheelUp':'MouseWheelDown');},{capture:true,passive:false});
addEventListener('contextmenu',e=>{if(BIND_CAP||performance.now()-bindClickT<600)e.preventDefault();},true);
document.getElementById('ctlBody').addEventListener('click',e=>{
  const r=e.target.closest&&e.target.closest('#rbReset');
  if(r){BINDS=defaultBinds();saveBinds();BIND_CAP=null;bindMsg='Back to the default controls.';renderControls();return;}
  const b=e.target.closest&&e.target.closest('.rbs');if(!b)return;
  if(performance.now()-bindClickT<350)return;   // (the click that follows a mouse button just bound)
  if(BIND_CAP&&BIND_CAP.id===b.dataset.a&&BIND_CAP.dev===b.dataset.d&&BIND_CAP.i===+b.dataset.i){bindCancel();return;}
  BIND_CAP={id:b.dataset.a,dev:b.dataset.d,i:+b.dataset.i,t:performance.now()};bindMsg='';renderControls();
  const el=document.querySelector(`.rbs[data-a="${BIND_CAP.id}"][data-d="${BIND_CAP.dev}"][data-i="${BIND_CAP.i}"]`);if(el){if(inputKind==='pad'&&typeof padFocus==='function')padFocus(el);else try{el.focus({preventScroll:true});}catch(e){}}
});
function rebindHTML(){
  const ps=padStyle==='ps',slot=(a,dev,i)=>{const L=BINDS[a.id][dev],v=L[i],cap=!!BIND_CAP&&BIND_CAP.id===a.id&&BIND_CAP.dev===dev&&BIND_CAP.i===i;
    if(i>L.length)return `<td><button type="button" class="rbs empty" disabled aria-hidden="true">—</button></td>`;
    const txt=cap?(dev==='kb'?'Press a key or click…':'Press a button…'):v==null?'+ Add':(dev==='kb'?keyLabel(v):padLabel(v,ps));
    return `<td><button type="button" class="rbs${cap?' cap':''}${v==null&&!cap?' empty':''}" data-a="${a.id}" data-d="${dev}" data-i="${i}" aria-label="${glEsc(a.n)}, ${dev==='kb'?'keyboard':'controller'} ${i+1}: ${glEsc(txt)}">${glEsc(txt)}</button></td>`;};
  const note=BIND_CAP?(BIND_CAP.dev==='kb'?'Press the key or mouse button for '+actOf(BIND_CAP.id).n+'. Backspace clears the slot; Esc cancels.':'Press the controller button for '+actOf(BIND_CAP.id).n+'. Start cancels.'):
    (bindMsg||'Pick a slot, then press the key, mouse button or controller button you want for it. In a vehicle, steering and the throttle are the walking keys and the left stick (on a controller the triggers are the throttle and brake), and each kind of vehicle has its own set below.');
  return `<div class="rb"><div class="rb-head"><h3>Rebind controls</h3><button type="button" class="pmenu" id="rbReset">Reset to defaults</button></div>
    <p class="rb-note" role="status">${glEsc(note)}</p>
    <div class="rb-wrap"><table class="rb-t"><thead><tr><th scope="col">Action</th><th scope="col" colspan="2">Keyboard and mouse</th><th scope="col" colspan="2">Controller</th></tr></thead><tbody>
    ${ACTS.map((a,k)=>(a.ctx&&(k===0||ACTS[k-1].ctx!==a.ctx)?`<tr class="rb-sec"><th scope="colgroup" colspan="5">${glEsc(CTX_NAMES[a.ctx]||a.ctx)}</th></tr>`:'')+`<tr><th scope="row"><i style="background:${a.c}"></i>${glEsc(a.n)}</th>${slot(a,'kb',0)}${slot(a,'kb',1)}${slot(a,'pad',0)}${slot(a,'pad',1)}</tr>`).join('')}
    </tbody></table></div></div>`;
}
// colours for the pictures: what a key / controller button is bound to
const keyCol=c=>{for(const a of ACTS)if(!a.ctx&&BINDS[a.id].kb.includes(c))return a.c;return null;};
const padCol=i=>{for(const a of ACTS)if(!a.ctx&&BINDS[a.id].pad.includes(i))return a.c;return null;};
function padSVG(ps){
  const L=ps?{A:'✕',B:'○',X:'□',Y:'△',LB:'L1',RB:'R1',LT:'L2',RT:'R2',ST:'≡'}:{A:'A',B:'B',X:'X',Y:'Y',LB:'LB',RB:'RB',LT:'LT',RT:'RT',ST:'≡'};
  const btn=(x,y,t,c)=>`<circle cx="${x}" cy="${y}" r="12.5" fill="${c}" stroke="#0a0d10" stroke-width="2"/><text x="${x}" y="${y+4.5}" text-anchor="middle" style="font:700 12px var(--f-mono)" fill="#0c0f14">${t}</text>`;
  const pill=(x,y,w,h,t,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${c}" stroke="#0a0d10" stroke-width="2"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" style="font:700 11px var(--f-mono)" fill="#0c0f14">${t}</text>`;
  const stick=(x,y,t,c)=>`<circle cx="${x}" cy="${y}" r="27" fill="#161a20" stroke="${c}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="17" fill="#3a424c"/><text x="${x}" y="${y+4.5}" text-anchor="middle" style="font:700 12px var(--f-mono)" fill="${c}">${t}</text>`;
  return `<svg viewBox="0 0 420 270" role="img" aria-label="Controller layout">
   ${pill(88,8,66,26,L.LT,padCol(6)||'#5a636e')}${pill(266,8,66,26,L.RT,padCol(7)||'#5a636e')}
   <path d="M110,70 Q210,54 310,70 Q372,80 388,150 Q404,232 360,252 Q332,264 306,230 L272,192 Q210,184 148,192 L114,230 Q88,264 60,252 Q16,232 32,150 Q48,80 110,70Z" fill="#2a3038" stroke="#0a0d10" stroke-width="3"/>
   ${pill(76,40,86,22,L.LB,padCol(4)||'#5a636e')}${pill(258,40,86,22,L.RB,padCol(5)||'#5a636e')}
   ${stick(122,126,'L',CC.walk)}${stick(255,182,'R',CC.look)}
   <rect x="156" y="160" width="18" height="46" rx="3" fill="#161a20"/><rect x="142" y="174" width="46" height="18" rx="3" fill="#161a20"/>
   <rect x="161" y="100" width="22" height="12" rx="6" fill="#161a20"/>
   <rect x="229" y="100" width="24" height="13" rx="6" fill="${CC.pause}" stroke="#0a0d10" stroke-width="1.5"/><text x="241" y="110.5" text-anchor="middle" style="font:700 10px var(--f-mono)" fill="#0c0f14">${L.ST}</text>
   ${btn(298,100,L.Y,padCol(3)||'#5a636e')}${btn(273,126,L.X,padCol(2)||'#5a636e')}${btn(323,126,L.B,padCol(1)||'#5a636e')}${btn(298,152,L.A,padCol(0)||'#5a636e')}
  </svg>`;
}
// the legend beside the picture: each action and what it's bound to
function legendRows(dev,gb,gs,gk,or){
  const ps=padStyle==='ps',hv=ABILS[abilSeat()].trample?'trample':'sprint';   // (whoever's menu it is: their own switches)
  const DESC={jump:'Jump',bite:'Bite',stomp:'Stomp',dashSprint:'Tap: dash · Hold: '+hv+' · In mid-air: air dash',dash:'Dash · In mid-air: air dash',sprint:'Hold: '+hv+' · In mid-air: air dash',lock:'Lock on',climb:'Spider Climb (hold)',talk:'Push to talk (online)',quickChat:'Quick chat (online)'};
  const chip=(a,v)=>dev==='kb'?(String(v).startsWith('Mouse')?gs(keyLabel(v),a.c):gk(keyLabel(v))):(v<4?gb(padLabel(v,ps),a.c):gs(padLabel(v,ps),a.c));
  let out='';
  if(dev==='kb'){const w=['fwd','left','back','right'].map(id=>BINDS[id].kb[0]).filter(Boolean);if(w.length)out+=`<dt>${w.map(c=>gk(keyLabel(c))).join('')}</dt><dd>Walk</dd>`;}
  else{const w=['fwd','left','back','right'].map(id=>BINDS[id].pad[0]).filter(v=>v!=null);if(w.length)out+=`<dt>${w.map(v=>gs(padLabel(v,ps),CC.walk)).join('')}</dt><dd>Walk</dd>`;}
  for(const a of ACTS){if(!DESC[a.id])continue;const L=BINDS[a.id][dev];if(!L.length)continue;
    out+=`<dt>${L.map(v=>chip(a,v)).join(or)}</dt><dd>${DESC[a.id]}</dd>`;}
  return out;
}
function renderControls(){
  const view=ctlView==='auto'?inputKind:ctlView,ps=padStyle==='ps',body=document.getElementById('ctlBody');if(!body)return;
  document.querySelectorAll('.ctl-seg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.view===ctlView)));
  const now=document.getElementById('ctlNow');
  now.textContent=(ctlView==='auto'?'Showing what you’re using: ':'Showing: ')+(view==='pad'?(ps?'PlayStation-style controller':'Xbox-style controller'):view==='touch'?'touch screen':'keyboard and mouse');
  const gb=(t,c)=>`<span class="gb" style="background:${c}">${t}</span>`,gs=(t,c)=>`<span class="gs" style="${c?'background:'+c+';color:#0c0f14;border-color:#0a0d10':''}">${t}</span>`,gk=t=>`<span class="gk">${t}</span>`,or='<span class="or">or</span>';
  if(view==='pad'){
    const L=ps?{A:'✕',B:'○',X:'□',LB:'L1',RB:'R1',LT:'L2',RT:'R2',ST:'Options',L3:'L3'}:{A:'A',B:'B',X:'X',LB:'LB',RB:'RB',LT:'LT',RT:'RT',ST:'Start',L3:'L3'};
    body.innerHTML=`<div class="ctl-grid"><div class="ctl-fig">${padSVG(ps)}<p class="ctl-note">Co-op: Gertie needs her own controller. Press ${L.ST} on a second controller to join mid-game.</p></div>
    <dl class="ctl-legend">
      <dt>${gs('L stick',CC.walk)}</dt><dd>Walk</dd>
      <dt>${gs('R stick',CC.look)}</dt><dd>Look around</dd>
      ${legendRows('pad',gb,gs,gk,or)}
      <dt>${gs(L.ST,CC.pause)}</dt><dd>Pause</dd>
      <dt>${gs('D-pad',CC.menu)}</dt><dd>In menus: move the highlight</dd>
      <dt>${gs(L.LB,CC.menu)}${gs(L.RB,CC.menu)}</dt><dd>In menus: switch tabs</dd>
    </dl></div>${rebindHTML()}`;
  } else if(view==='touch'){
    const t=(x,y,w,h,txt,c)=>`<span style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;background:${c}">${txt}</span>`;
    body.innerHTML=`<div class="ctl-grid"><div class="ctl-fig"><div class="touchmock" role="img" aria-label="On-screen buttons">
      ${t(9,52,8,12,'▲',CC.walk)}${t(1,65,8,12,'◀',CC.walk)}${t(17,65,8,12,'▶',CC.walk)}${t(9,78,8,12,'▼',CC.walk)}${t(9,65,8,12,'JUMP',CC.jump)}
      ${t(74,58,11,15,'BITE',CC.bite)}${t(87,58,11,15,'STOMP',CC.stomp)}${t(74,76,11,15,'DASH',CC.charge)}${t(87,76,11,15,'MENU',CC.pause)}
      <span style="left:34%;top:30%;width:32%;height:30%;background:transparent;border:2px dashed ${CC.look};color:${CC.look}">DRAG TO LOOK</span>
    </div></div>
    <dl class="ctl-legend">
      <dt>${gs('Arrows',CC.walk)}</dt><dd>Walk</dd>
      <dt>${gs('Drag',CC.look)}</dt><dd>Look around (drag anywhere else on screen)</dd>
      <dt>${gs('JUMP',CC.jump)}</dt><dd>Jump</dd>
      <dt>${gs('BITE',CC.bite)}</dt><dd>Bite</dd>
      <dt>${gs('STOMP',CC.stomp)}</dt><dd>Stomp</dd>
      <dt>${gs('DASH',CC.charge)}</dt><dd>Tap: dash · Hold: ${ABIL.trample?'trample':'sprint'}</dd>
      <dt>${gs('MENU',CC.pause)}</dt><dd>Pause</dd>
    </dl></div>`;
  } else {
    const K0=(k,c,span)=>`<span class="${c?'on':''}" style="${c?'background:'+c+';':''}${span?'grid-column:span '+span:''}">${k}</span>`,blank=(n)=>`<span style="visibility:hidden;grid-column:span ${n}"></span>`;
    const KC={Tab:'Tab',Caps:'CapsLock',Shift:'ShiftLeft',Ctrl:'ControlLeft',Alt:'AltLeft',Space:'Space',',':'Comma'},K=(k,c,span)=>K0(k,k==='Esc'?c:keyCol(KC[k]||('Key'+k))||(k==='Alt'?keyCol('AltRight'):null),span);
    const kb=`<div class="kb" role="img" aria-label="Keyboard keys used">${K('Esc',CC.pause,2)}${blank(8)}
      ${K('Tab',null,2)}${K('Q','#e0564a')}${K('W',CC.walk)}${K('E',CC.stomp)}${K('R')}${K('T')}${K('Y')}${K('U')}${K('I')}
      ${K('Caps',null,2)}${K('A',CC.walk)}${K('S',CC.walk)}${K('D',CC.walk)}${K('F')}${K('G')}${K('H')}${K('J')}${K('K')}
      ${K('Shift',CC.charge,2)}${K('Z')}${K('X')}${K('C','#9a7ae0')}${K('V')}${K('B')}${K('N')}${K('M')}${K(',')}
      ${K('Ctrl',null,2)}${K('Alt')}${K('Space',CC.jump,6)}${K('Alt')}</div>`;
    const mouse=`<svg viewBox="0 0 120 150" style="max-width:120px" role="img" aria-label="Mouse buttons"><path d="M60,8 C28,8 14,30 14,62 L14,100 C14,128 34,144 60,144 C86,144 106,128 106,100 L106,62 C106,30 92,8 60,8Z" fill="#1a2027" stroke="${CC.look}" stroke-width="3"/><path d="M60,8 C28,8 14,30 14,62 L58,62 L58,8Z" fill="${keyCol('Mouse0')||'#3a424c'}"/><path d="M62,8 C92,8 106,30 106,62 L62,62 L62,8Z" fill="${keyCol('Mouse2')||'#3a424c'}"/><text x="36" y="44" text-anchor="middle" style="font:700 11px var(--f-mono)" fill="#0c0f14">L</text><text x="84" y="44" text-anchor="middle" style="font:700 11px var(--f-mono)" fill="#0c0f14">R</text><text x="60" y="110" text-anchor="middle" style="font:600 10px var(--f-mono)" fill="${CC.look}">MOVE</text></svg>`;
    body.innerHTML=`<div class="ctl-grid"><div class="ctl-fig">${kb}${mouse}</div>
    <dl class="ctl-legend">
      ${legendRows('kb',gb,gs,gk,or)}
      <dt>${gs('Mouse',CC.look)}</dt><dd>Look around</dd>
      <dt>${gk('Esc')}</dt><dd>Pause and resume</dd>
      <dt>${gs('Co-op',CC.menu)}</dt><dd>Gertie needs a controller</dd>
    </dl></div>${rebindHTML()}`;
  }
}
renderControls();
function addHostile(){
  const g=makeGoblin({weapons:GOB_FOES.police.weapons});g.t=Math.random()*6;   // (any of them may be sent out as police, so all carry an officer's weapons, the handgun hidden till then: foeArm, foes.js)
}
for(let i=0;i<16;i++)addHostile();
// civilians: shoppers, commuters and stall vendors who never fight back
const CIV_LOOKS=[{tunic:0x3a5f8a,hat:'cap',hatc:0xc9a02a},{tunic:0x8a3a5f},{tunic:0xc9a02a,hat:'top'},{tunic:0x5c5c66,hat:'top'},{tunic:0xa83232,hat:'cap',hatc:0x2a2a2a},{tunic:0x2a7a5a},{tunic:0xd6d2c4,hat:'cap',hatc:0xa83232}];
let civMade=0;
function addCiv(){
  const i=civMade++;
  const look=CIV_LOOKS[i%CIV_LOOKS.length];
  const g=makeGoblin({weapons:GOB_FOES.civilian.weapons,tunic:look.tunic,hat:look.hat,hatc:look.hatc,skin:[0x7aa848,0x5f8a34,GC.skin][i%3]},{hp:3,civ:true,vendor:null,wt:null,wtT:0,idle:0,screamCD:0,fleeing:false});
  g.t=Math.random()*3;
}
for(let i=0;i<14;i++)addCiv();
// staff: a separate few townsfolk who work in the shops, restaurants, hospitals and stations near you, in uniform
for(let i=0;i<24;i++){addCiv();goblins[goblins.length-1].staff=true;}
// cultists: their own few, robed and hooded, who live at the cult altars (or come from the Testing Environment). Never
// sent into town, and never counted against the street's goblins. Made the first time they're wanted (freeCultist)
const CULT_ROBE=0x4a0a12,CULT_HOOD=0x2a0408;let cultMade=0;
function freeCultist(cap=8){let g=goblins.find(o=>o.cultist&&o.state==='wait');if(!g&&cultMade<cap){addCultist();g=goblins[goblins.length-1];}return g||null;}
function addCultist(){cultMade++;
  makeGoblin(Object.assign(foeModelOpt(GOB_FOES.cultist),{cult:true,tunic:CULT_ROBE}),{cultist:true,special:true,homeV:null,ring:0,slot:0,cast:0,castCD:0});
}
const STAFF_CAP={courthouse:3,base:4,airport:4,airfield:2,nasa:4,nuclear:3,campus:4,prison:4,jail:2,water:2,power:4,zoo:2,lab:3,ikea:6,museum:3,aquarium:3,casino:6,school:5,factory:5,datacenter:1,electric:2,dealer:3,armory:2,theater:3,stocks:4,nursery:2,library:2,cinema:3,radio:2,news:4,bank:3,disco:3,club:3,books:1,dentist:2,dispo:1,guns:1,bar:2,soup:3,bigbox:8,market:5,drug:3,grocery:3,hospital:5,police:3,fire:3,sitdown:4,fastfood:3,kiosk:2,diner:2,pizza:2,cafe:2,shop:2};
const STAFF_JOBS={bigbox:['Cashier','Greeter','Stocker','Shift manager','Electronics associate','Cart wrangler'],grocery:['Cashier','Stocker','Deli clerk','Bagger','Produce clerk'],market:['Cashier','Stocker','Deli clerk','Bagger','Produce clerk','Butcher'],drug:['Pharmacist','Pharmacy tech','Cashier','Stocker'],
  hospital:['Nurse','Doctor','Orderly','Surgeon','Paramedic','Receptionist'],police:['Police officer','Desk sergeant','Detective'],fire:['Firefighter','Fire captain'],
  sitdown:['Server','Host','Line cook','Bartender'],fastfood:['Fry cook','Cashier','Drive-thru attendant','Shift manager'],kiosk:['Gas station attendant','Clerk'],
  diner:['Waiter','Short-order cook'],pizza:['Pizza maker','Delivery driver'],cafe:['Barista'],shop:['Sales clerk','Store manager','Cashier'],
  base:['Soldier','Sergeant','Officer'],airport:['Pilot','Flight attendant','Check-in agent','Baggage handler','Air traffic controller','Gate agent'],airfield:['Flying instructor','Mechanic','Pilot','Club secretary'],nasa:['Rocket scientist','Flight director','Astronaut'],nuclear:['Reactor operator','Safety inspector'],
  campus:['Professor','Student','Librarian','Dean'],prison:['Prison guard','Warden'],jail:['Jailer','Deputy'],water:['Plant operator'],power:['Plant operator','Engineer'],zoo:['Zookeeper','Gift shop clerk'],lab:['Mad scientist','Lab assistant','Henchgoblin'],
  ikea:['Co-worker','Cashier','Meatball cook','Warehouse picker'],museum:['Curator','Guard','Guide','Gift shop clerk'],aquarium:['Aquarist','Guide','Ticket clerk'],casino:['Croupier','Cashier','Security','Waitress','Pit boss'],
  school:['Teacher','Principal','Janitor','Lunch lady'],factory:['Machinist','Foreman','Forklift driver','Welder'],datacenter:['Systems engineer'],electric:['Lineman','Clerk'],
  dealer:['Car salesman','Sales manager','Mechanic'],armory:['Quartermaster','Guard'],theater:['Usher','Stagehand','Actor','Box office clerk'],stocks:['Trader','Broker','Analyst'],nursery:['Gardener','Clerk'],
  courthouse:['Judge','Bailiff','Court clerk','Lawyer'],library:['Librarian','Library assistant'],cinema:['Usher','Projectionist','Snack-bar clerk'],radio:['DJ','Producer'],news:['News anchor','Camera operator','Reporter','Producer'],bank:['Bank teller','Loan officer','Security guard','Bank manager'],disco:['DJ','Bartender','Bouncer'],club:['Bouncer','Bartender','Sound tech'],
  books:['Bookseller'],dentist:['Dentist','Dental hygienist','Receptionist'],dispo:['Budtender'],guns:['Gunsmith','Clerk'],bar:['Bartender','Bouncer'],soup:['Cook','Volunteer','Server']};
const STAFF_JOBS_BY={COSTCO:['Forklift driver','Cashier','Sample lady','Membership clerk'],"SAM'S CLUB":['Forklift driver','Cashier','Membership clerk'],'DOLLAR GENERAL':['Cashier','Stocker'],CVS:['Pharmacist','Cashier','Pharmacy tech'],WALGREENS:['Pharmacist','Cashier','Pharmacy tech'],SUBWAY:['Sandwich artist'],GAMESTOP:['Sales clerk','Store manager'],
  'BEST BUY':['Geek squad agent','Sales associate'],'WAFFLE HOUSE':['Grill operator','Waitress'],STARBUCKS:['Barista'],"DUNKIN'":['Barista','Donut fryer']};
// a brand's name as it'd be written (WAL-MART -> Wal-Mart, McDONALD'S -> McDonald's)
const brandName=B=>({IHOP:'IHOP',CVS:'CVS',BP:'BP','AT&T':'AT&T',GAMESTOP:'GameStop',RADIOSHACK:'RadioShack',FEDEX:'FedEx'}[B.n]||B.n.replace(/[A-Za-z']+/g,w=>{const l=w.toLowerCase();return l==='of'?l:l.startsWith('mc')?'Mc'+l.charAt(2).toUpperCase()+l.slice(3):l.charAt(0).toUpperCase()+l.slice(1);}));
// what the staff wear: the brand's main colour for the shirt (and cap or apron in its second colour);
// scrubs in hospitals, navy at the police station, turnout gear and a red helmet at the fire station
const hx=c=>parseInt(c.slice(1),16),isPale=c=>{const v=hx(c);return((v>>16)&255)+((v>>8)&255)+(v&255)>600;};
const UNI_OVR={'WAL-MART':{shirt:0x1d4f91,hat:0xffc220},TARGET:{shirt:0xcc0000,pants:0xc8b48a,hat:0xcc0000},'BEST BUY':{shirt:0x0046be,pants:0xc8b48a,hat:0xfff200},
  "McDONALD'S":{shirt:0xda291c,hat:0xffc72c},STARBUCKS:{shirt:0x1e3932,hat:0x00704a,apron:0x00704a},'WAFFLE HOUSE':{shirt:0xf2f2ee,hat:0x111111,apron:0xffd200}};
function uniformOf(B,cat){
  if(cat==='hospital')return{shirt:0x4fa3c7,pants:0x4fa3c7,hatType:'none'};
  if(cat==='police')return{shirt:0x1c2a5a,pants:0x1c2a5a,hat:0x1c2a5a,hatType:'cap'};
  if(cat==='fire')return{shirt:0x2d3a52,pants:0x3d3528,hat:0xc62828,hatType:'hardhat'};
  const prim=isPale(B.bg)?hx(B.fg):hx(B.bg),sec=isPale(B.bg)?hx(B.ac):hx(B.ac===B.bg?B.fg:B.ac);
  const food=cat==='fastfood'||cat==='diner'||cat==='pizza'||cat==='cafe'||cat==='sitdown';
  const u={shirt:prim,pants:0x2b2e35,hat:sec,hatType:food&&cat!=='sitdown'?'cap':cat==='kiosk'?'cap':'none',apron:food?sec:null};
  return Object.assign(u,UNI_OVR[B.n]||{});
}
