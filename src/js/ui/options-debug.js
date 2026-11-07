// ---- debug hitbox overlay (Options tab): wireframes of the volumes the game actually tests ----
const DBG_KEY='goblin-stompin-gus-debug';
const DBG={show:false,pBlock:false,nBlock:false,pDmg:false,nDmg:false,pHurt:false,nHurt:false};
try{const s=JSON.parse(localStorage.getItem(DBG_KEY)||'null');if(s){for(const k in DBG)if(typeof s[k]==='boolean')DBG[k]=s[k];if(typeof s.show!=='boolean')DBG.show=Object.keys(DBG).some(k=>k!=='show'&&DBG[k]);}}catch(e){}
let DBG_WHO='n';
// the Dev tab's sandbox, while a preview is being simulated (null otherwise): hit volumes are recorded, not drawn
let SBX=null;
const sbxCells=cells=>{const h=SBX&&SBX.hits[SBX.hits.length-1];if(h&&h.kind==='block')h.cells=cells;};
// game speed and free cam
const SPEEDS=[0.05,0.1,0.25,0.5,0.75,0.9,1,1.25,1.5,2];
const PSPEEDS=[1,1.5,2,2.5,3,4,5,6,7,8,9,10];
const DT={hpBars:false,dmgNums:false,fps:false,sndList:false,curve:2,psI:0,invuln:false,infStam:false,fly:false,gob:false,host:2,speedI:6,paused:false,freecam:false,step:false,quick:true,menu:false,kbdOpen:false,selHeld:false,cur:0,navDir:0,navT:0};
try{const q=JSON.parse(localStorage.getItem('goblin-stompin-gus-quickdbg')||'null');if(typeof q==='boolean')DT.quick=q;}catch(e){}
try{for(const k of ['fps','hpBars','dmgNums','sndList'])DT[k]=localStorage.getItem('goblin-stompin-gus-'+k)==='1';}catch(e){}
// the debug settings carry over from one session to the next (all but stopping time and the free cam, which would
// only be confusing to come back to)
const DT_KEY='goblin-stompin-gus-debug',DT_SAVED=['curve','psI','speedI','invuln','infStam','fly','fps','hpBars','dmgNums','sndList','quick'];
try{const q=JSON.parse(localStorage.getItem(DT_KEY)||'null');if(q&&typeof q==='object')for(const k of DT_SAVED)if(typeof q[k]===typeof DT[k])DT[k]=q[k];
  if(!(DT.speedI>=0&&DT.speedI<SPEEDS.length))DT.speedI=SPEEDS.indexOf(1);if(!(DT.psI>=0&&DT.psI<PSPEEDS.length))DT.psI=0;}catch(e){}
function saveDT(){try{const o={};for(const k of DT_SAVED)o[k]=DT[k];localStorage.setItem(DT_KEY,JSON.stringify(o));
  localStorage.setItem(HOST_KEY,String(DT.host));}catch(e){}}
// Enemy hostility, three steps (the main screen's slider and the quick menu's are one setting, kept
// from one session to the next): 0 Passive, nobody reacts to you at all, not even to being hit (they still get hurt);
// 1 Peaceful, nobody attacks or hunts you, but the townsfolk still run from you; 2 Normal
const HOST_KEY='goblin-stompin-gus-hostility',HOST_N=['Passive','Peaceful','Normal'],HOST_TXT=['Nobody reacts to you, even when hit','Nobody attacks you, but townsfolk still run','Goblins, cars, police and soldiers come for you'];
try{const s=localStorage.getItem(HOST_KEY);if(s==='0'||s==='1'||s==='2')DT.host=+s;else if(localStorage.getItem('goblin-stompin-gus-peaceful')==='1')DT.host=1;}catch(e){}   // (the old Peaceful box, ticked, is the middle step)
function syncHost(){for(const [i,o] of [['hostMain','hostMainVal']]){const el=document.getElementById(i),v=document.getElementById(o);if(el){el.value=String(DT.host);v.textContent=HOST_N[DT.host];}}const t=document.getElementById('hostMainTxt');if(t)t.textContent=HOST_TXT[DT.host];}
// the Interface switches: each part of the on-screen display, what picks it out on the page, and what it's called. (The
// menus aren't here, and nor are the touch buttons: without them there'd be no way back on a phone.) Hidden with one style
// sheet, so none of the code that updates them needs to know. Not saved, for the same reason as the Rendering switches.
const UI_PARTS={
  uiScore:['#readout','Kills & score','Top left'],
  uiClock:['.clock','Clock','The dial at the top right'],
  uiStatus:['#clockTxt','Status panel','Day, season, weather, moon and where you are, under the clock'],
  uiMini:['.mini','Minimap','Bottom left'],
  uiSpeedo:['.speedo','Speedometer','Bottom right'],
  uiHearts:['.hearts','Hearts','Your health'],
  uiStam:['.stam','Stamina bar','Under the hearts'],
  uiCharge:['.smeter','Charge meter','Winding up a stomp or a ground pound'],
  uiMsg:['.label','Messages','"Gus has fallen", "A car is coming for you" and the like'],
  uiHint:['.hint','Control hints','Which buttons do what, above the hearts'],
  uiPlace:['.placeBanner','Place names','The name that fades in as you arrive somewhere'],
  uiHurt:['.hurt','Hurt flash','The screen\'s red edges when you take a hit'],
  uiWater:['.water-tint','Underwater tint','The blue over the screen while you\'re under'],
  uiBadge:['#dbgBadge','Debug badge','"PAUSED" and "FREE CAM" at the top'],
  uiWho:['.who','Player names','Over the hearts in split screen'],
  uiJoin:['.join','Join prompt','Asking player two for a controller'],
  uiSplit:['#divider','Split-screen line','Between the two views']};
const UI_OFF=new Set();
function applyUi(){document.getElementById('uiOff').textContent=[...UI_OFF].map(k=>UI_PARTS[k][0]+'{display:none!important}').join('');}
// (the first row does the lot: everything off, or if it's all off already, everything back on)
function toggleUi(k){const all=Object.keys(UI_PARTS);if(k==='uiAll'){const on=UI_OFF.size<all.length;UI_OFF.clear();if(on)for(const q of all)UI_OFF.add(q);}else if(!UI_OFF.delete(k))UI_OFF.add(k);applyUi();}
const uiVal=k=>k==='uiAll'?UI_OFF.size<Object.keys(UI_PARTS).length:!UI_OFF.has(k);
const isUi=k=>k==='uiAll'||!!UI_PARTS[k];
// the quick menu's rows, section by section: [column, section's title, rows]
const DBG_COLS=4,DBG_SECS=[
  // (Show / hide tab only: every switch shown, or none)
  [0,'All',[{k:'_all',label:'Show all',act:true},{k:'_none',label:'Hide all',act:true}]],
  [0,'Time',[{k:'speed',label:'Game speed'},{k:'paused',label:'Stop time'}]],
  [0,'Camera',[{k:'freecam',label:'Free cam'},{k:'curve',label:'World curve'}]],
  [0,'World',[{k:'wx',label:'Weather'},{k:'season',label:'Season'}]],
  [1,'Player',[{k:'pspeed',label:'Player speed'},{k:'invuln',label:'Invulnerable'},{k:'infStam',label:'Infinite stamina'},{k:'fly',label:'Flying'},{k:'host',label:'Enemy hostility'}]],
  [1,'Overlays',[{k:'fps',label:'FPS counter'},{k:'hpBars',label:'Health bars'},{k:'dmgNums',label:'Damage numbers'},{k:'sndList',label:'Sound list'}]],
  [2,'Rendering',[{k:'gProps',label:'Props'},{k:'gFixtures',label:'Fixtures'},{k:'gCaves',label:'Caves'},{k:'gSewers',label:'Sewers'},{k:'gSubway',label:'Subways'}]],
  [2,'Hitboxes',[{k:'show',label:'Display hitboxes'},
    {k:'pBlock',label:'Player block hitboxes',col:'#ff9a2a'},{k:'nBlock',label:'NPC block hitboxes',col:'#e8d040'},
    {k:'pDmg',label:'Player damage hitboxes',col:'#ff3a3a'},{k:'nDmg',label:'NPC damage hitboxes',col:'#ff4fd8'},
    {k:'pHurt',label:'Player hurtboxes',col:'#46f06a'},{k:'nHurt',label:'NPC hurtboxes',col:'#46d4ff'}]],
  [3,'Interface',[{k:'uiAll',label:'Whole display'},...Object.keys(UI_PARTS).map(k=>({k,label:UI_PARTS[k][1]}))]]];
const DBG_ITEMS=DBG_SECS.flatMap(([c,sec,rows])=>rows.map(it=>Object.assign(it,{c,sec})));
// (the sliders: left and right only move one once it's been picked with A, and until then they go to the next column,
// as on any other row, so a slider never gets in the way of crossing the menu)
const DBG_SLIDE=new Set(['speed','pspeed','curve','host']);
// the Rendering switches, and what each one stops being drawn (not saved: a world with holes in the picture would only
// be confusing to come back to). The caves, sewers and subways redraw over the next few frames, nearest first.
const GFX_KEY={gProps:'props',gFixtures:'fixtures',gCaves:'caves',gSewers:'sewers',gSubway:'subway'};
function toggleGfx(k){const g=GFX_KEY[k],off=GFX_OFF[g]=!GFX_OFF[g];
  if(g==='props'){PROP_L.visible=PROP_G.visible=!off;return;}
  if(g==='fixtures'){FIX_BAR.visible=FIX_GLOW.visible=FIX_COL.visible=!off;trafficRefreshT=0;return;}   // (the signs, signal heads and billboard faces: at the end of refreshFixtures)
  if(g==='subway')for(const V of venues.values())if(V.kind==='sub')for(const c of V.cars)c.visible=!off;
  const P=P1.pos,d=e=>Math.hypot(e.cx*CS-P.x,e.cz*CS-P.z);
  leafQ.length=0;for(const e of [...meshes.values()].sort((a,b)=>d(b)-d(a)))leafQ.push(ckey(e.cx,e.cz));}
const curveTxt=()=>DT.curve===0?'Flat':DT.curve>0?'Down '+DT.curve:'Up '+(-DT.curve);
function dbgVal(k){return isUi(k)?uiVal(k):GFX_KEY[k]?!GFX_OFF[GFX_KEY[k]]:k==='curve'?curveTxt():k==='wx'?WX_TYPES[WX.type].n:k==='season'?SEASONS[seasonOf()]:k==='speed'?SPEEDS[DT.speedI]+'×':k==='pspeed'?PSPEEDS[DT.psI]+'×':k==='host'?HOST_N[DT.host]:k==='paused'||k==='freecam'||k==='invuln'||k==='infStam'||k==='fly'||k==='fps'||k==='hpBars'||k==='dmgNums'||k==='sndList'?DT[k]:DBG[k];}
// the rows on show: the individual hitbox switches only while 'Display hitboxes' is on
// the menu's two tabs: 0 the switches themselves, 1 "Show / hide", which picks the rows tab 0 lists (kept in this browser)
const DBG_HIDE_KEY='goblin-stompin-gus-dbghide',DBG_HIDE=new Set();
try{const h=JSON.parse(localStorage.getItem(DBG_HIDE_KEY)||'[]');if(Array.isArray(h))for(const k of h)if(DBG_ITEMS.some(it=>it.k===k))DBG_HIDE.add(k);}catch(e){}
// the rows on show: on the main tab, those not hidden (and the individual hitbox switches only while 'Display hitboxes'
// is on); on Show / hide, every row
function dbgItems(){const L=DT.tab?DBG_ITEMS:DBG_ITEMS.filter(it=>!it.act&&!DBG_HIDE.has(it.k)&&(!it.col||DBG.show));if(DT.cur>=L.length)DT.cur=Math.max(0,L.length-1);return L;}
// over to the other tab, keeping the highlight on the same row if it's there
function dbgTab(t){const k=(dbgItems()[DT.cur]||{}).k;DT.tab=t;DT.edit=null;DT.dd=null;const i=dbgItems().findIndex(it=>it.k===k);DT.cur=Math.max(0,i);tone('triangle',560,0,0.04,0.02);renderTime();}
// step a slider row (game speed or player speed) left or right
function dbgStep(k,d){if(k==='wx'){const L=Object.keys(WX_TYPES);wxSet(L[(L.indexOf(WX.type)+d+L.length)%L.length],true);WX.until=gameDays()+1;}
  else if(k==='season'){const y=Math.floor((dayN-1)/120);dayN=y*120+((seasonOf()+d+4)%4)*SEASON_LEN+1;wxSet(wxPick(seasonOf()),true);}
  else if(k==='curve')DT.curve=Math.max(-10,Math.min(10,DT.curve+d));
  else if(k==='host')DT.host=Math.max(0,Math.min(2,DT.host+d));
  else if(k==='speed')DT.speedI=Math.max(0,Math.min(SPEEDS.length-1,DT.speedI+d));else if(k==='pspeed')DT.psI=Math.max(0,Math.min(PSPEEDS.length-1,DT.psI+d));}
function setKbdMenu(on){
  DT.kbdOpen=on;DT.menu=DT.quick&&(on||DT.selHeld);mHeld.clear();mTap.clear();renderTime();
  try{if(on){if(locked())document.exitPointerLock();}else if(!dragMode&&!menuOpen&&!P1.paused){const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}}catch(e){}
}
// the dropdown rows' choices, and choosing one (weather changes at once; season jumps to its first day)
function ddOpts(k){return k==='wx'?Object.keys(WX_TYPES).map(t=>({v:t,n:WX_TYPES[t].i+' '+WX_TYPES[t].n})):SEASONS.map((n,i)=>({v:i,n}));}
function ddCur(k){return k==='wx'?Object.keys(WX_TYPES).indexOf(WX.type):seasonOf();}
function ddChoose(k,j){
  if(k==='wx'){wxSet(Object.keys(WX_TYPES)[j],true);WX.until=gameDays()+1;}
  else{const y=Math.floor((dayN-1)/120);dayN=y*120+j*SEASON_LEN+1;wxSet(wxPick(seasonOf()),true);}
  DT.dd=null;tone('triangle',620,0,0.05,0.03);renderTime();
}
function dbgMenuToggle(){const it=dbgItems()[DT.cur];if(!it)return;
  if(DT.tab){if(it.k==='_all')DBG_HIDE.clear();else if(it.k==='_none'){for(const o of DBG_ITEMS)if(!o.act)DBG_HIDE.add(o.k);}else if(!DBG_HIDE.delete(it.k))DBG_HIDE.add(it.k);try{localStorage.setItem(DBG_HIDE_KEY,JSON.stringify([...DBG_HIDE]));}catch(e){}tone('triangle',it.k==='_none'||DBG_HIDE.has(it.k)?440:660,0,0.05,0.03);renderTime();return;}
  if(it.k==='wx'||it.k==='season'){if(DT.dd&&DT.dd.k===it.k)ddChoose(it.k,DT.dd.i);else{DT.dd={k:it.k,i:ddCur(it.k)};DT.ddScroll=0;DT.ddNav=true;tone('triangle',560,0,0.04,0.02);renderTime();}return;}
  DT.dd=null;
  if(DBG_SLIDE.has(it.k)){DT.edit=DT.edit===it.k?null:it.k;tone('triangle',DT.edit?620:480,0,0.05,0.03);renderTime();return;}
  if(GFX_KEY[it.k])toggleGfx(it.k);
  else if(isUi(it.k))toggleUi(it.k);
  else if(it.k==='freecam')setFreecam(!DT.freecam);
  else if(it.k==='paused')DT.paused=!DT.paused;
  else if(it.k==='invuln'||it.k==='infStam'||it.k==='fly'||it.k==='fps'||it.k==='hpBars'||it.k==='dmgNums'||it.k==='sndList'){DT[it.k]=!DT[it.k];try{localStorage.setItem('goblin-stompin-gus-'+it.k,DT[it.k]?'1':'0');}catch(e){}}
  else{DBG[it.k]=!DBG[it.k];try{localStorage.setItem(DBG_KEY,JSON.stringify(DBG));}catch(e){}}
  tone('triangle',620,0,0.05,0.03);renderTime();}
// up/down move the highlight within its column (letting go of a picked slider); left/right move across to the next
// column, about level, or change the slider that's been picked; a step on the first push, then repeating
function dbgMenuNav(src,dy,dx,dt){
  const d=dy?'y'+dy:dx?'x'+dx:'';
  const act=()=>{const L=dbgItems();if(!L.length)return;if(DT.dd){if(dy){const n=ddOpts(DT.dd.k).length;DT.dd.i=(DT.dd.i+dy+n)%n;DT.ddNav=true;tone('triangle',520,0,0.03,0.02);}renderTime();return;}
    const it=L[DT.cur],colOf=c=>L.filter(o=>o.c===c),here=colOf(it.c),j=here.indexOf(it);
    if(dy){DT.edit=null;DT.cur=L.indexOf(here[(j+dy+here.length)%here.length]);tone('triangle',520,0,0.03,0.02);}
    else if(dx&&DT.edit===it.k)dbgStep(it.k,dx);
    else if(dx){const N=colOf((it.c+dx+DBG_COLS)%DBG_COLS);DT.cur=L.indexOf(N[Math.min(j,N.length-1)]);tone('triangle',520,0,0.03,0.02);}
    renderTime();};
  if(d!==DT.navDir){DT.navDir=d;DT.navT=0.35;if(d)act();}
  else if(d){DT.navT-=dt;if(DT.navT<=0){DT.navT=0.12;act();}}
}
const FC={pos:new THREE.Vector3(),yaw:0,pitch:0};
const gameSpeed=()=>DT.paused||DT.menu?0:SPEEDS[DT.speedI];
function setFreecam(on){
  if(on===DT.freecam)return;DT.freecam=on;
  if(on){const c=P1.camera;FC.pos.copy(c.position);FC.yaw=P1.cam.yaw;FC.pitch=P1.cam.pitch;}
  renderTime();
}
function renderTime(){
  saveDT();
  syncHost();
  CURVE_U.value=DT.curve*0.00012;
  const bd=document.getElementById('dbgBadge'),parts=[];
  if(DT.paused)parts.push('PAUSED');else if(SPEEDS[DT.speedI]!==1)parts.push('SPEED '+SPEEDS[DT.speedI]+'×');
  if(DT.freecam)parts.push('FREE CAM');
  bd.hidden=!parts.length||DT.menu;bd.textContent=parts.join(' · ');
  const dp=document.getElementById('dbgPad');dp.hidden=!DT.menu;
  for(const b of document.querySelectorAll('#dbgMenuTog .tog'))b.setAttribute('aria-checked',String(DT.quick));
  // (the Dev tab comes and goes with the debug menu; if it's the tab on show as it goes, Game options takes its place)
  {const dv=document.getElementById('tabBtnDev');if(dv&&dv.hidden!==!DT.quick){dv.hidden=!DT.quick;try{if(!DT.quick&&curTab==='dev')showTab('options');}catch(e){}}}
  if(DT.menu){
    const dbgL=dbgItems();
    {const tb=document.getElementById('dpTabs');if(tb)tb.innerHTML=['Switches','Show / hide'].map((n,t)=>'<button type="button" data-t="'+t+'"'+(t===DT.tab?' class="on"':'')+'>'+n+'</button>').join('');}
    const dbgRows=dbgL.map((it,i)=>{const nAll=DBG_ITEMS.filter(o=>!o.act).length,v=it.act?(it.k==='_all'?(nAll-DBG_HIDE.size)+' / '+nAll+' shown':''):DT.tab?!DBG_HIDE.has(it.k):dbgVal(it.k),txt=typeof v==='boolean'?(DT.tab?(v?'SHOWN':'HIDDEN'):v?'ON':'OFF'):v;
      let body=txt;
      if(DT.tab){}
      else if(DBG_SLIDE.has(it.k)){const n=it.k==='curve'?21:it.k==='host'?3:(it.k==='speed'?SPEEDS:PSPEEDS).length,f=(it.k==='curve'?DT.curve+10:it.k==='host'?DT.host:it.k==='speed'?DT.speedI:DT.psI)/(n-1)*100;body='<span class="sl" data-k="'+it.k+'"><i style="width:'+f+'%"></i><b style="left:'+f+'%"></b></span><span class="slv">'+txt+'</span>';}
      else if(it.k==='wx'||it.k==='season')body='<span class="dd">'+(it.k==='wx'?WX_TYPES[WX.type].i+' ':'')+txt+' ▾</span>';
      let list='';
      if(DT.dd&&DT.dd.k===it.k){const cur=ddCur(it.k);list='<div class="ddl">'+ddOpts(it.k).map((o,j)=>'<div class="ddo'+(j===DT.dd.i?' cur':'')+(j===cur?' sel':'')+'" data-j="'+j+'">'+o.n+'</div>').join('')+'</div>';}
      return '<div class="dr'+(i===DT.cur?' cur':'')+(DT.edit===it.k?' edit':'')+'" data-i="'+i+'"><span>'+(it.col?'<i class="sw" style="background:'+it.col+'"></i>':'')+'</span><span>'+it.label+'</span><em'+(v===false?' class="off"':'')+'>'+body+'</em></div>'+list;});
    // laid out by column, then by section
    document.getElementById('dpRows').innerHTML=Array.from({length:DBG_COLS},(_,c)=>c).map(c=>'<div>'+DBG_SECS.filter(s=>s[0]===c).map(s=>dbgL.some(it=>it.sec===s[1])?'<div class="dps"><h5>'+s[1]+'</h5>'+dbgL.map((it,i)=>it.sec===s[1]?dbgRows[i]:'').join('')+'</div>':'').join('')+'</div>').join('');
    if(!dbgL.length)document.getElementById('dpRows').innerHTML='<p class="dpnone">Every switch is hidden. Show some on the Show / hide tab.</p>';
    // (on a short screen the menu scrolls: keep the highlight in view)
    {const r=document.querySelector('#dpRows .dr.cur');if(r&&r.scrollIntoView)r.scrollIntoView({block:'nearest'});}
    {const l=document.querySelector('#dpRows .ddl');if(l){l.scrollTop=DT.ddScroll||0;if(DT.ddNav){DT.ddNav=false;const cur=l.querySelector('.ddo.cur');if(cur){const t=cur.offsetTop,b=t+cur.offsetHeight;if(t<l.scrollTop)l.scrollTop=t;else if(b>l.scrollTop+l.clientHeight)l.scrollTop=b-l.clientHeight;DT.ddScroll=l.scrollTop;}}}}
    dp.classList.toggle('mouse',DT.kbdOpen);
    const pad=DT.selHeld;
    document.getElementById('dpHint').textContent=DT.tab?'pick which switches the first tab lists':'game paused';
    setPrompts(document.getElementById('dpPrompts'),DT.tab?(pad?[[['DPAD:v'],'Choose'],[['A'],'Show / hide'],[['DPAD:h'],'Column'],[['LB','RB'],'Tab'],[['SELECT'],'Close'],[['B'],'Close']]:[[['LMB'],'Show / hide'],[['KEY:↑','KEY:↓'],'Choose'],[['KEY:Space'],'Show / hide'],[['KEY:←','KEY:→'],'Column'],[['KEY:Tab'],'Tab'],[['KEY:~'],'Close']]):DT.edit?(pad?[[['DPAD:h'],'Adjust'],[['A'],'Done'],[['B'],'Done'],[['DPAD:v'],'Choose']]:[[['KEY:←','KEY:→'],'Adjust'],[['KEY:Space'],'Done'],[['KEY:Esc'],'Done'],[['KEY:↑','KEY:↓'],'Choose']])
      :pad?[[['DPAD:v'],'Choose'],[['A'],'Select'],[['DPAD:h'],'Column'],[['LB','RB'],'Tab'],[['RS'],'Camera'],[['SELECT'],'Close'],[['B'],'Close']]:[[['LMB'],'Select'],[['KEY:↑','KEY:↓'],'Choose'],[['KEY:Space'],'Select'],[['KEY:←','KEY:→'],'Column'],[['KEY:Tab'],'Tab'],[['KEY:~'],'Close']]);
    document.getElementById('dpClose').hidden=pad;
  }
}
{const rows=document.getElementById('dpRows');
 rows.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('ddl'))DT.ddScroll=e.target.scrollTop;},true);
 rows.addEventListener('mouseover',e=>{const o=e.target.closest('.ddo');if(o&&DT.dd){const j=+o.dataset.j;if(j!==DT.dd.i){DT.dd.i=j;renderTime();}return;}
   const row=e.target.closest('.dr');if(!row||!DT.kbdOpen)return;const i=+row.dataset.i;if(i!==DT.cur){DT.cur=i;renderTime();}});
 rows.addEventListener('click',e=>{const o=e.target.closest('.ddo');if(o&&DT.dd){ddChoose(DT.dd.k,+o.dataset.j);return;}
   if(e.target.closest('.sl'))return;
   const row=e.target.closest('.dr');if(!row)return;const ni=+row.dataset.i;if(DT.dd&&dbgItems()[ni].k!==DT.dd.k)DT.dd=null;DT.cur=ni;dbgMenuToggle();});
 // the sliders: press and drag anywhere along the track
 const slSet=x=>{const k=DT.slDrag,el=rows.querySelector('.sl[data-k="'+k+'"]');if(!el)return;const r=el.getBoundingClientRect(),f=Math.max(0,Math.min(1,(x-r.left)/r.width));
   if(k==='curve')DT.curve=Math.round(f*20)-10;else if(k==='host')DT.host=Math.round(f*2);else if(k==='speed')DT.speedI=Math.round(f*(SPEEDS.length-1));else DT.psI=Math.round(f*(PSPEEDS.length-1));renderTime();};
 rows.addEventListener('pointerdown',e=>{const sl=e.target.closest('.sl');if(!sl)return;DT.slDrag=sl.dataset.k;DT.dd=null;const row=sl.closest('.dr');if(row)DT.cur=+row.dataset.i;slSet(e.clientX);e.preventDefault();});
 addEventListener('pointermove',e=>{if(DT.slDrag)slSet(e.clientX);});
 addEventListener('pointerup',()=>{DT.slDrag=null;});
 document.getElementById('dpClose').addEventListener('click',()=>setKbdMenu(false));
 document.getElementById('dpTabs').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-t]');if(b&&+b.dataset.t!==DT.tab)dbgTab(+b.dataset.t);});}
for(const b of document.querySelectorAll('#dbgMenuTog .tog'))b.addEventListener('click',()=>{DT.quick=!DT.quick;if(!DT.quick){DT.kbdOpen=false;DT.menu=false;}try{localStorage.setItem('goblin-stompin-gus-quickdbg',JSON.stringify(DT.quick));}catch(e){}renderTime();tone('triangle',DT.quick?660:440,0,0.05,0.03);});
for(const i of ['hostMain'])document.getElementById(i).addEventListener('input',e=>{DT.host=+e.target.value;renderTime();});
renderTime();
addEventListener('keydown',e=>{
  if(menuOpen)return;
  if(e.code==='Backquote'&&!e.repeat){if(DT.quick)setKbdMenu(!DT.kbdOpen);e.preventDefault();return;}
  if(DT.kbdOpen&&DT.quick){
    const c=e.code,dy=(c==='ArrowUp'||c==='KeyW')?-1:(c==='ArrowDown'||c==='KeyS')?1:0,dx=(c==='ArrowLeft'||c==='KeyA')?-1:(c==='ArrowRight'||c==='KeyD')?1:0;
    if(dy||dx){DT.navDir='';dbgMenuNav('kbd',dy,dx,0);DT.navDir='';e.preventDefault();return;}
    if((c==='Space'||c==='Enter')&&!e.repeat){dbgMenuToggle();e.preventDefault();return;}
    if(c==='Tab'){if(!e.repeat)dbgTab(DT.tab?0:1);e.preventDefault();return;}
    if(c==='Escape'){if(DT.edit){DT.edit=null;renderTime();return;}if(DT.dd){DT.dd=null;renderTime();return;}setKbdMenu(false);return;}
  }
  if(e.repeat)return;
  if(e.code==='KeyP'){DT.paused=!DT.paused;renderTime();}
  else if(e.code==='Period'&&DT.paused)DT.step=true;
  else if(e.code==='BracketLeft'){DT.speedI=Math.max(0,DT.speedI-1);renderTime();}
  else if(e.code==='BracketRight'){DT.speedI=Math.min(SPEEDS.length-1,DT.speedI+1);renderTime();}
  else if(e.code==='KeyV')setFreecam(!DT.freecam);
});
// flying the free cam (real time, so it works while the game is paused or slowed)
function updateFreecam(dt,pad){
  const I=P1.in,fast=keys.has('ShiftLeft')||keys.has('ShiftRight')||(pad&&pad.b[1]);
  let up=(keys.has('Space')?1:0)-(keys.has('KeyC')?1:0);
  if(pad){up+=(pad.p.buttons[7]?pad.p.buttons[7].value:0)-(pad.p.buttons[6]?pad.p.buttons[6].value:0);
    const rx=Math.abs(pad.p.axes[2]||0)>0.15?pad.p.axes[2]:0,ry=Math.abs(pad.p.axes[3]||0)>0.15?pad.p.axes[3]:0;FC.yaw-=rx*2.4*dt;FC.pitch=Math.max(-1.5,Math.min(1.5,FC.pitch-ry*1.8*dt));}
  const sp=(fast?60:18)*dt,cy=Math.cos(FC.yaw),sy=Math.sin(FC.yaw),cp=Math.cos(FC.pitch),spp=Math.sin(FC.pitch);
  // forward follows where you look (pitch included); strafing stays level
  const fx=-sy*cp,fy=spp,fz=-cy*cp,rx=cy,rz=-sy,mz=-(I.z||0),mx=I.x||0;
  FC.pos.x+=(fx*mz+rx*mx)*sp;FC.pos.y+=(fy*mz+up)*sp;FC.pos.z+=(fz*mz+rz*mx)*sp;
  FC.pos.y=Math.max(1,Math.min(H+60,FC.pos.y));
  for(const k in I)if(typeof I[k]==='boolean')I[k]=false;I.x=I.z=0;I.lookX=I.lookY=0;
}   // who's acting right now: 'p' while a hippo's own move is being worked out, otherwise 'n'
const DBG_COL={pBlock:0xff9a2a,nBlock:0xe8d040,pDmg:0xff3a3a,nDmg:0xff4fd8,pHurt:0x46f06a,nHurt:0x46d4ff};
const dbgGeo={};
{const box=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));dbgGeo.box=box;
 const ring=(n,f)=>{const a=[];for(let i=0;i<n;i++){const t0=i/n*Math.PI*2,t1=(i+1)/n*Math.PI*2;a.push(...f(t0),...f(t1));}return a;};
 // cylinder: radius 1, from y=0 to y=1
 const cy=[...ring(20,t=>[Math.cos(t),0,Math.sin(t)]),...ring(20,t=>[Math.cos(t),1,Math.sin(t)])];for(let i=0;i<4;i++){const t=i*Math.PI/2;cy.push(Math.cos(t),0,Math.sin(t),Math.cos(t),1,Math.sin(t));}
 const g1=new THREE.BufferGeometry();g1.setAttribute('position',new THREE.Float32BufferAttribute(cy,3));dbgGeo.cyl=g1;
 // sphere: three great circles, radius 1
 const sp=[...ring(24,t=>[Math.cos(t),Math.sin(t),0]),...ring(24,t=>[Math.cos(t),0,Math.sin(t)]),...ring(24,t=>[0,Math.cos(t),Math.sin(t)])];
 const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));dbgGeo.sph=g2;
 // cone: apex at the origin, opening along +z to a circle of radius 1 at z=1
 const cn=[...ring(24,t=>[Math.cos(t),Math.sin(t),1])];for(let i=0;i<8;i++){const t=i*Math.PI/4;cn.push(0,0,0,Math.cos(t),Math.sin(t),1);}
 const g3=new THREE.BufferGeometry();g3.setAttribute('position',new THREE.Float32BufferAttribute(cn,3));dbgGeo.cone=g3;}
const dbgMat={};for(const k in DBG_COL)dbgMat[k]=new THREE.LineBasicMaterial({color:DBG_COL[k],transparent:true,opacity:0.9,depthTest:false,fog:false});
const dbgPool={box:[],cyl:[],sph:[],cap:[],slot:[],cone:[]},dbgUsed={box:0,cyl:0,sph:0,cap:0,slot:0,cone:0},dbgTrans=[];
// a rounded slot: a circle of radius r swept len along +z, from y=0 to y=1 (the bite's jaw zone). Cached per shape.
const slotCache=new Map();
function dbgSlotGeo(len,r){
  const key=len.toFixed(2)+','+r.toFixed(2);let g=slotCache.get(key);if(g)return g;
  const a=[],N=14,outline=y=>{const pts=[];for(let i=0;i<=N;i++){const t=Math.PI+i/N*Math.PI;pts.push([Math.cos(t)*r,Math.sin(t)*r]);}
    for(let i=0;i<=N;i++){const t=i/N*Math.PI;pts.push([Math.cos(t)*r,len+Math.sin(t)*r]);}
    for(let i=0;i<pts.length;i++){const p0=pts[i],p1=pts[(i+1)%pts.length];a.push(p0[0],y,p0[1],p1[0],y,p1[1]);}};
  outline(0);outline(1);
  for(const [x,z] of [[r,0],[-r,0],[r,len],[-r,len],[0,-r],[0,len+r]])a.push(x,0,z,x,1,z);
  g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));slotCache.set(key,g);return g;
}
// the true shape of an area hit: a ball of radius r (unit here), sliced flat a set distance below and above its
// centre. Outlined as rings at the cut faces and in between, plus eight curved ribs. Cached per proportion.
const capCache=new Map();
function dbgCapGeo(dn,up){
  const key=dn.toFixed(2)+','+up.toFixed(2);let g=capCache.get(key);if(g)return g;
  const lo=-Math.min(1,dn),hi=Math.min(1,up),a=[],N=28;
  const ring=y=>{const rr=Math.sqrt(Math.max(0,1-y*y));for(let i=0;i<N;i++){const t0=i/N*Math.PI*2,t1=(i+1)/N*Math.PI*2;a.push(Math.cos(t0)*rr,y,Math.sin(t0)*rr,Math.cos(t1)*rr,y,Math.sin(t1)*rr);}};
  ring(lo);ring(hi);for(let k=1;k<4;k++)ring(lo+(hi-lo)*k/4);
  for(let m=0;m<8;m++){const t=m/8*Math.PI*2,c=Math.cos(t),sn=Math.sin(t),M=12;
    for(let i=0;i<M;i++){const y0=lo+(hi-lo)*i/M,y1=lo+(hi-lo)*(i+1)/M,r0=Math.sqrt(Math.max(0,1-y0*y0)),r1=Math.sqrt(Math.max(0,1-y1*y1));a.push(c*r0,y0,sn*r0,c*r1,y1,sn*r1);}}
  g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));capCache.set(key,g);return g;
}
function dbgMesh(shape){const P=dbgPool[shape];let m=P[dbgUsed[shape]];if(!m){m=new THREE.LineSegments(dbgGeo[shape]||dbgGeo.sph,dbgMat.pBlock);m.renderOrder=10;m.frustumCulled=false;scene.add(m);P.push(m);}dbgUsed[shape]++;m.visible=true;return m;}
// draw one volume this frame. o: {x,y,z} is the base centre (box: centre of the bottom face), sx/sy/sz box size,
// r/h cylinder radius and height, r sphere radius (centre at y), rot for a box's heading
function dbgDraw(kind,shape,o){const m=dbgMesh(shape);m.material=dbgMat[kind];m.rotation.set(o.rx||0,o.rot||0,o.rz||0,'YXZ');
  if(shape==='box'){m.scale.set(o.sx,o.sy,o.sz);m.position.set(o.x,o.y+o.sy/2,o.z);}
  else if(shape==='cyl'){m.scale.set(o.r,o.h,o.r);m.position.set(o.x,o.y,o.z);}
  else if(shape==='slot'){m.geometry=dbgSlotGeo(o.len,o.r);m.scale.set(1,o.h,1);m.position.set(o.x,o.y,o.z);}
  else if(shape==='cap'){m.geometry=dbgCapGeo(o.dn/o.r,o.up/o.r);m.scale.setScalar(o.r);m.position.set(o.x,o.y,o.z);}
  else if(shape==='cone'){m.scale.set(o.r,o.r,o.len);m.position.set(o.x,o.y,o.z);}
  else{m.scale.setScalar(o.r);m.position.set(o.x,o.y,o.z);}}
// a hit volume that flashes for a moment; 'block' or 'dmg', credited to whoever is acting
// kind: 'block' or 'dmg' (one area for goblins and cars alike)
function dbgHit(kind,shape,o,who){if(SBX){SBX.hits.push({f:SBX.frame,kind,shape,o:Object.assign({},o)});return;}const k=(who||DBG_WHO)+(kind==='block'?'Block':'Dmg');if(!DBG.show||!DBG[k])return;dbgTrans.push({k,shape,o,t:0.35});}
// an area hit around height y: the ball of radius r, cut to the band vReach allows
const dbgCap=(x,y,z,r)=>({x,y,z,r,dn:Math.max(2.5,r*0.45),up:Math.max(3,r*0.6)});
// the vertical band an area hit around height y reaches (see vReach)
const dbgBand=(x,y,z,r)=>({x,z,r,y:y-Math.max(2.5,r*0.45),h:Math.max(2.5,r*0.45)+Math.max(3,r*0.6)});
function updateDebug(dt){
  for(const s in dbgUsed)dbgUsed[s]=0;
  if(!DBG.show){dbgTrans.length=0;for(const s in dbgPool)for(const m of dbgPool[s])m.visible=false;return;}
  for(let i=dbgTrans.length-1;i>=0;i--){const T=dbgTrans[i];T.t-=dt;if(T.t<=0||!DBG[T.k]){dbgTrans.splice(i,1);continue;}dbgDraw(T.k,T.shape,T.o);}
  const near=(o)=>players.some(p=>p.active&&Math.hypot(o.x-p.pos.x,o.z-p.pos.z)<90);
  if(DBG.pHurt)for(const p of players)if(p.active&&p.state!=='dead'){const b=pBoxC(p);dbgDraw('pHurt','box',{x:b.x,y:p.pos.y,z:b.z,sx:2*bodyOf(p).hx,sy:bodyOf(p).hy,sz:2*bodyOf(p).hz,rot:p.heading});}
  if(DBG.nHurt){
    for(const g of goblins)if(g.state==='chase'&&g.root.visible&&near(g.pos))dbgDraw('nHurt','cyl',{x:g.pos.x,y:g.pos.y,z:g.pos.z,r:0.45,h:1.6});
    for(const c of cars)if(c.alive&&near(c.pos))dbgDraw('nHurt','box',{x:c.pos.x,y:c.pos.y,z:c.pos.z,sx:2*c.hx,sy:c.hy,sz:2*c.hz,rot:c.heading});
  }
  if(DBG.nDmg){
    // a moving car (fast enough, and not just after hitting someone) strikes any hurtbox touching its bumper zone
    for(const c of cars)if(c.alive&&Math.abs(c.speed)>3&&c.ramCD<=0&&near(c.pos))dbgDraw('nDmg','box',{x:c.pos.x,y:c.pos.y,z:c.pos.z,sx:2*(c.hx+RAM_M),sy:c.hy,sz:2*(c.hz+RAM_M),rot:c.heading});
    for(const F of fires)if(F.flames&&F.t>F.life*0.35*0.3)dbgDraw('nDmg','cyl',{x:F.x,y:F.y-1.5,z:F.z,r:F.r*0.85,h:4});
  }
  for(const s in dbgPool){const P=dbgPool[s];for(let i=dbgUsed[s];i<P.length;i++)P[i].visible=false;}
}
const pendingBooms=[],boomedAt=new Map();
function pumpsHit(list){
  for(const q of list){if(q.b!==PUMP)continue;const k=q.x+','+q.z;const t=boomedAt.get(k);if(t!==undefined&&playTime-t<6)continue;boomedAt.set(k,playTime);
    pendingBooms.push({x:q.x+.5,y:G+1,z:q.z+.5,t:0.18+Math.random()*0.25,blame:BLAME});}
}
// pumps that fell: they blow where they land
function pumpsFell(list){
  for(const q of list){const k=q.x+','+q.z;const t=boomedAt.get(k);if(t!==undefined&&playTime-t<6)continue;boomedAt.set(k,playTime);
    pendingBooms.push({x:q.x+.5,y:q.y,z:q.z+.5,t:0.05+Math.random()*0.15,blame:BLAME});}
}
function updateBooms(dt){for(let i=pendingBooms.length-1;i>=0;i--){const b=pendingBooms[i];b.t-=dt;if(b.t<=0){pendingBooms.splice(i,1);withBlame(b.blame,()=>gasBoom(b.x,b.y,b.z));}}}
function gasBoom(x,y,z){const w=DBG_WHO;DBG_WHO='n';try{gasBoom0(x,y,z);}finally{DBG_WHO=w;}}
function gasBoom0(x,y,z){
  const p=new V3(x,y,z);
  // a huge fireball: big enough to wreck the forecourt, the canopy and the shop
  const bl=blasts[blastIdx++%blasts.length];bl.t=0.6;bl.s=2.8;for(const f of bl.m){f.position.set(x,y+2.5,z);f.visible=true;}
  smoke(x,y+2,z,40,0x1e1e1e);puff(x,y,z,30,0x6a4a2a,3.5);
  for(let i=0;i<40;i++)emit(2,x+(Math.random()-.5)*5,y+1+Math.random()*4,z+(Math.random()-.5)*5,Math.random()<0.5?0xffb040:0xff6020,0.2,0.2,0.2,{force:4.2,dx:0,dz:0,up:2.4});
  for(let i=0;i<16;i++){const d=debris[(debrisIdx++)%debris.length];if(d.painted)d.m.material.color.setHex(0xcc3030);
    d.m.position.set(x+(Math.random()-.5)*2,y+1+Math.random(),z+(Math.random()-.5)*2);d.v.set((Math.random()-.5)*16,9+Math.random()*10,(Math.random()-.5)*16);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=4;d.m.visible=true;}
  noise(2.6,1.3,500,'lowpass');tone('sawtooth',55,18,2.2,0.45);tone('sine',80,24,1.8,0.35);
  addShake(1.3,x,z,70);
  if(BLAME!=='acc'){score+=150;flashLabel('Gas pump blown  +150',(nearestPlayer(x,z)||{}).p);}
  for(const q of players){if(!q.active)continue;const dg=Math.hypot(q.pos.x-x,q.pos.z-z),d3=Math.hypot(dg,q.pos.y-y);rumble(q,Math.max(0.2,1-d3/60),900);if(q===players.find(o=>o.active))dbgHit('dmg','cap',dbgCap(x,y,z,13));if(d3<13&&vReach(q.pos.y-y,13))damagePlayer(q,d3<6?8:5,new V3(q.pos.x,q.pos.y+1.2,q.pos.z),new V3((q.pos.x-x)/(dg||1),0.8,(q.pos.z-z)/(dg||1)),'Blown up in a gas explosion');}
  hitGoblins(x,z,15,14,'Blown up at the gas station',y);
  for(const pr of trainsNear(x,z,15,y-15,y+15))trainHit(pr.T,120,null,pr.i);   // (a blast tears into a train too)
  for(const o of cars){if(!o.alive)continue;const n=carNearest(o,x,y,z),d=Math.hypot(n.d2,n.dy);if(d>=15||!vReach(o.pos.y-y,15)&&!vReach(o.pos.y+o.hy-y,15))continue;launchCar(o,Math.max(5,19-d),new V3(o.pos.x-x,0,o.pos.z-z),9);if(d<10)damageCar(o,d<5?40:22);}

  // the blast tears a ball out of the forecourt, the canopy overhead and the shop next door, and sets off the other pumps
  crushBall(x,y,z,7.5,{force:3.2,up:2.4});
  // then the spilled fuel burns
  addFire(x,y,z,4.5,32+Math.random()*10);
  for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2,d=4+Math.random()*4;addFire(x+Math.cos(a)*d,y,z+Math.sin(a)*d,1.6+Math.random(),18+Math.random()*12);}
}
function explodeCar(c){const w=DBG_WHO;DBG_WHO='n';try{return withBlame(carIsPlayers(c)?null:'acc',()=>explodeCar0(c));}finally{DBG_WHO=w;}}
function explodeCar0(c){
  c.alive=false;c.g.visible=false;c.respawnT=6;c.hunter=false;
  const p=c.pos.clone();reportNews(p.x,p.z,'car crash');
  const pts=c.police?500:300;if(BLAME!=='acc'){reportCrime(p.x,p.z);score+=pts;flashLabel((c.police?'Police car destroyed  +':c.crew&&CREW_NAME[c.veh]?CREW_NAME[c.veh]+' destroyed  +':'Car destroyed  +')+pts,(nearestPlayer(p.x,p.z)||{}).p);}
  if(c.police&&c.spot){policeDown[c.spot.split(':')[0]]=playTime+90;c.spot=null;}c.parked=false;
  if(c.svcPool&&c.svc){const keep=c.alive;svcDone(c,true);}
  const bl=blasts[blastIdx++%blasts.length];bl.t=0.6;bl.s=1;for(const f of bl.m){f.position.set(p.x,p.y+1,p.z);f.visible=true;}
  smoke(p.x,p.y+1,p.z,22,0x262626);puff(p.x,p.y,p.z,16,0x5a4a3a,1.6);
  for(let i=0;i<12;i++){const d=debris[(debrisIdx++)%debris.length];
    if(d.painted)d.m.material.color.setHex(c.color);
    d.m.position.set(p.x+(Math.random()-.5)*2,p.y+0.8+Math.random(),p.z+(Math.random()-.5)*3);d.v.set((Math.random()-.5)*14,7+Math.random()*9,(Math.random()-.5)*14);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=25;d.m.visible=true;d.m.material.emissive.setHex(0x331100);}
  noise(1.4,1.0,700,'lowpass');tone('sawtooth',70,22,1.2,0.35);
  addShake(0.8,p.x,p.z,30);
  for(const q of players){if(!q.active)continue;const dg=Math.hypot(q.pos.x-p.x,q.pos.z-p.z),d3=Math.hypot(dg,q.pos.y-p.y);rumble(q,Math.max(0.15,1-d3/30),600);if(q===players.find(o=>o.active))dbgHit('dmg','cap',dbgCap(p.x,p.y,p.z,5));if(d3<5&&vReach(q.pos.y-p.y,5)&&!(c.trainT>0&&q.standCar&&q.standCar.isTrain))damagePlayer(q,4,new V3(q.pos.x,q.pos.y+1.2,q.pos.z),new V3((q.pos.x-p.x)/(dg||1),0.6,(q.pos.z-p.z)/(dg||1)),'Caught in a car explosion');}
  if(c.driver)dropGoblinCorpse(p.x+1.2,p.y,p.z,c.driver);
  if(c.crew)crewWreck(c,p);   // (a militia vehicle's driver and gunner: see crews.js)
  if(c.parkPool&&c.spot){parkDown[c.spot]=playTime+120;c.spot=null;}
  hitGoblins(p.x,p.z,6,10,'Caught in a car explosion',p.y);
  crush(p.x,p.y,p.z,1,-1,0,{force:2.2,up:1.5});
  wrecks.push({p,t:10});
  addFire(p.x,p.y,p.z,1.7,16+Math.random()*8);
  // chain reactions
  if(!(c.trainT>0))for(const pr of trainsNear(p.x,p.z,6,p.y-6,p.y+6))trainHit(pr.T,40,null,pr.i);   // (a car it's just run down doesn't derail the train)
  for(const o of cars){if(!o.alive)continue;const n=carNearest(o,p.x,p.y,p.z),d=Math.hypot(n.d2,n.dy);if(d>=6||!vReach(o.pos.y-p.y,6)&&!vReach(o.pos.y+o.hy-p.y,6))continue;launchCar(o,Math.max(3,9-d),new V3(o.pos.x-p.x,0,o.pos.z-p.z),5);damageCar(o,d<4?14:8);}
}
