// ---------- Players (Gus and Gertie) ----------
const SKINS=[
  {name:'GUS',skin:0x8f8399,dark:0x6c6177,belly:0xcfa3aa},
  {name:'GERTIE',skin:0xc08a7c,dark:0x93635a,belly:0xf0c2b2},
];
const players=[];
const hudEl=document.getElementById('hud');
function makePlayer(idx){
  const S=SKINS[idx%SKINS.length];   // (seats three and four exist only online, dressed as either hippo)
  const p={idx,who:idx,name:S.name,root:new THREE.Group(),rig:new THREE.Group(),legs:[],pupils:[],pos:new V3(),heading:0,state:'walk',t:0,phase:0,vy:0,hit:false,lastSin:0,biteT:0,biteRepeat:0,smashCD:0,chargeCD:0,hurt:0,slammed:false,fallDir:1,
    cam:{yaw:0,pitch:-0.3},camera:new THREE.PerspectiveCamera(72,1,0.25,420),hp:20,deadT:0,hurtFx:0,regenT:0,lastHp:-1,shake:0,active:false,pad:null,
    stam:100,exhausted:false,stamIdle:0,lungeT:0,airJumps:1,twirl:0,airDash:true,dashT:0,roarBurst:0,lastRoarK:0,wasCharging:false,biteHit:false,grounded:true,stompCharge:0,stompF:1,windPitch:0,fullPing:false,
    in:{x:0,z:0,charge:false,chargePress:false,stomp:false,bite:false,bitePress:false,jumpPress:false,jump:false}};
  p.camera.rotation.order='YXZ';
  const HC={skin:S.skin,dark:S.dark,belly:S.belly,mouth:0xd8697c,tooth:0xf4f0e2,eye:0x16161a,white:0xf6f3ea};
  p.snowU={value:0};const mats={};const mat=c=>mats[c]||(mats[c]=snowCar(new THREE.MeshLambertMaterial({color:c}),p));
  const box=(w,h,d,c,x,y,z,par)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);par.add(m);return m;};
  const {root,rig}=p;root.name='root';rig.name='rig';
  root.add(rig);rig.position.z=-0.85;
  const body=new THREE.Group();body.name='body';body.position.z=0.85;rig.add(body);
  box(1.55,1.15,2.4,HC.skin,0,1.3,0,body);
  box(1.35,0.14,2.0,HC.belly,0,0.7,0,body);
  box(1.25,0.3,1.9,HC.skin,0,1.95,-0.1,body);
  p.tail=box(0.12,0.4,0.08,HC.dark,0,1.35,-1.24,body);p.tail.rotation.x=0.4;
  const head=new THREE.Group();head.name='head';head.position.set(0,1.55,1.2);body.add(head);p.head=head;
  box(1.2,0.85,1.0,HC.skin,0,0.1,0.45,head);
  box(1.45,0.5,0.75,HC.skin,0,0.0,1.25,head);
  for(const s of[-1,1]){
    box(0.2,0.08,0.14,HC.dark,s*0.3,0.27,1.45,head);
    box(0.28,0.24,0.26,HC.skin,s*0.38,0.6,0.3,head);
    // front-facing pair (pupils shoved outward: wall-eyed)
    const fw=box(0.24,0.2,0.04,HC.white,s*0.38,0.62,0.44,head),fp=box(0.1,0.11,0.04,HC.eye,s*0.46,0.62,0.465,head);
    p.pupils.push({m:fp,s,ph:Math.random()*6});
    // side pair, like a real hippo's
    const sw=box(0.04,0.2,0.2,HC.white,s*0.52,0.62,0.3,head),sp=box(0.04,0.11,0.1,HC.eye,s*0.545,0.62,0.36,head);
    (p.eyeFront||(p.eyeFront=[])).push(fw,fp);(p.eyeSide||(p.eyeSide=[])).push(sw,sp);(p.sidePupils||(p.sidePupils=[])).push({m:sp,s,ph:Math.random()*6});
    (p.eyeWhites=p.eyeWhites||[]).push(fw,sw);
    box(0.16,0.2,0.1,HC.dark,s*0.42,0.66,0.02,head);
  }
  // (Gertie's bow: every hippo has one, shown only on Gertie, so either player can be either hippo -- see dressHippo)
  p.bow=[box(0.5,0.12,0.12,0xe0406a,0,0.62,-0.02,head),box(0.16,0.2,0.16,0xe0406a,0,0.62,-0.02,head)];
  const jaw=new THREE.Group();jaw.name='jaw';jaw.position.set(0,-0.25,0.2);head.add(jaw);p.jaw=jaw;
  box(1.38,0.28,1.25,HC.skin,0,-0.14,0.8,jaw);
  box(1.12,0.05,1.05,HC.mouth,0,0.02,0.8,jaw);
  for(const s of[-1,1])box(0.13,0.26,0.13,HC.tooth,s*0.48,0.13,1.28,jaw);
  for(const [x,z] of [[-0.5,0.8],[0.5,0.8],[-0.5,-0.8],[0.5,-0.8]]){
    const hip=new THREE.Group();hip.name='leg.'+(z>0?'F':'B')+(x<0?'R':'L');hip.position.set(x,0.78,z);body.add(hip);
    // leg ends inside the foot pad (no shared bottom face), and the pad sits a hair above the ground
    box(0.52,0.74,0.52,HC.dark,0,-0.37,0,hip);box(0.56,0.08,0.62,HC.belly,0,-0.73,0.03,hip);
    p.legs.push(hip);
  }
  p.mats=Object.values(mats);p.hm={skin:mat(HC.skin),dark:mat(HC.dark),belly:mat(HC.belly)};
  root.visible=false;scene.add(root);
  p.pool=new THREE.Mesh(new THREE.CircleGeometry(1,18),flatMat(0x4d0707,1,-3));p.pool.rotation.x=-Math.PI/2;p.pool.visible=false;scene.add(p.pool);
  const v=document.createElement('div');v.className='view';v.hidden=true;
  v.innerHTML=`<div class="water-tint" hidden></div><div class="hurt"></div><canvas class="mini" width="200" height="200" aria-hidden="true"></canvas><div class="speedo" aria-hidden="true"><svg viewBox="-50 -46 100 96"><path d="M-34.64,20 A40,40 0 1 1 34.64,20" pathLength="100" fill="none" stroke="rgba(238,240,230,.16)" stroke-width="7" stroke-linecap="round"/><path class="sp-fill" d="M-34.64,20 A40,40 0 1 1 34.64,20" pathLength="100" fill="none" stroke="#7fc24a" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 200" visibility="hidden"/>${[0,1,2,3,4,5,6].map(i=>{const a=(-120+i*40)*Math.PI/180;return `<line x1="${(Math.sin(a)*29).toFixed(1)}" y1="${(-Math.cos(a)*29).toFixed(1)}" x2="${(Math.sin(a)*33).toFixed(1)}" y2="${(-Math.cos(a)*33).toFixed(1)}" stroke="rgba(238,240,230,.5)" stroke-width="1.5"/>`;}).join('')}<line class="sp-needle" x1="0" y1="4" x2="0" y2="-31" stroke="#ffd75a" stroke-width="2.6" stroke-linecap="round" transform="rotate(-120)"/><circle r="4.2" fill="#ffd75a" stroke="#0c0f14" stroke-width="1.4"/><text class="sp-num" x="0" y="27" text-anchor="middle">0</text><text x="0" y="36" text-anchor="middle" class="sp-unit">km/h</text><text class="sp-vert" x="0" y="48" text-anchor="middle" visibility="hidden"></text></svg></div><div class="bar"><div class="hint" hidden></div><div class="smeter lv0" hidden><div class="sbar"><div class="mfill"></div><i class="tick"></i></div><span class="slv">STOMP</span></div><div class="label"></div><div class="who${idx?' p2':''}">${S.name}</div><div class="hearts" aria-label="${S.name} health"></div><div class="meter stam" aria-label="${S.name} trample stamina"><div class="mfill"></div></div></div><div class="join" hidden>${S.name}: connect a controller and press any button</div><div class="ppause" hidden><div class="pcard"><div class="ptitle${idx?' p2':''}">${S.name} · PAUSED</div><p class="pstatus"></p><button type="button" class="big${idx?' coop':''} pres">Resume</button><button type="button" class="pmenu">Pause menu</button><div class="prompts small pprompts"></div></div></div>`;
  hudEl.insertBefore(v,hudEl.firstChild);
  p.ui={mini:v.querySelector('.mini'),pprompts:v.querySelector('.pprompts'),spVert:v.querySelector('.sp-vert'),speedo:v.querySelector('.speedo'),spFill:v.querySelector('.sp-fill'),spNeedle:v.querySelector('.sp-needle'),spNum:v.querySelector('.sp-num'),view:v,tint:v.querySelector('.water-tint'),hurt:v.querySelector('.hurt'),hint:v.querySelector('.hint'),label:v.querySelector('.label'),who:v.querySelector('.who'),hearts:v.querySelector('.hearts'),join:v.querySelector('.join'),stam:v.querySelector('.stam'),stamFill:v.querySelector('.stam .mfill'),smeter:v.querySelector('.smeter'),smFill:v.querySelector('.smeter .mfill'),slv:v.querySelector('.slv'),ppause:v.querySelector('.ppause'),pres:v.querySelector('.pres'),pmenu:v.querySelector('.pmenu'),pstatus:v.querySelector('.pstatus'),timer:null};
  p.paused=false;
  return p;
}
players.push(makePlayer(0),makePlayer(1));
const P1=players[0],P2=players[1];
// ---- character customization: which pair of eyes each hippo wears ----
// ---- ability switches (Character tab), shared by both hippos and kept in this browser ----
const ABIL_KEY='goblin-stompin-gus-abilities';
// the base moves (bite, stomp, ground pound, jump, sprint, dash, air dash, long jump), each with its improved
// versions (an improved one only works while its base move is on; a 'full' one needs the one before it too)
const ABIL={bite:true,biteCombo:true,stomp:true,chargeStomp:true,fullStomp:true,groundSpike:false,pound:true,chargePound:true,fullPound:true,jump:true,double:true,triple:false,
  sprint:true,trample:true,dash:true,roll:false,blastDash:false,airDash:true,blastAirDash:false,longJump:true,blastJump:false,rocket:false,climb:true,crash:true,noFall:true};
try{const s=JSON.parse(localStorage.getItem(ABIL_KEY)||'null');if(s&&typeof s==='object'){for(const k in ABIL)if(typeof s[k]==='boolean')ABIL[k]=s[k];
  // (saved before the full-charge versions existed: charging was both levels or none)
  if(s.fullStomp===undefined)ABIL.fullStomp=ABIL.chargeStomp;if(s.fullPound===undefined)ABIL.fullPound=ABIL.chargePound;}}catch(e){}
if(ABIL.triple)ABIL.double=true;if(ABIL.roll&&ABIL.blastDash)ABIL.blastDash=false;if(ABIL.fullStomp)ABIL.chargeStomp=true;if(ABIL.fullPound)ABIL.chargePound=true;
const airJumpsMax=()=>!ABIL.jump?0:ABIL.triple?2:ABIL.double?1:0;
// how many levels a stomp / a ground pound can be charged to (0: not at all)
const stompCap=()=>!ABIL.stomp?0:ABIL.fullStomp?2:ABIL.chargeStomp?1:0,poundCap=()=>!ABIL.pound?0:ABIL.fullPound?2:ABIL.chargePound?1:0;
function renderAbil(){for(const b of document.querySelectorAll('#abilList .tog')){const on=!!ABIL[b.dataset.k],base=b.dataset.base,prev=b.dataset.prev,off=(base&&!ABIL[base])||(prev&&!ABIL[prev]);
  b.setAttribute('aria-checked',String(on));b.classList.toggle('dim',!!off);}}
for(const b of document.querySelectorAll('#abilList .tog'))b.addEventListener('click',()=>{const k=b.dataset.k;ABIL[k]=!ABIL[k];
  // switching an improved version on brings what it builds on with it; switching a step off takes the ones after it off
  if(ABIL[k]){if(b.dataset.base)ABIL[b.dataset.base]=true;if(b.dataset.prev)ABIL[b.dataset.prev]=true;if(b.dataset.excl)ABIL[b.dataset.excl]=false;}   // (Roll and Blast Dash: one or the other)
  else for(const o of document.querySelectorAll('#abilList .tog[data-prev="'+k+'"]'))ABIL[o.dataset.k]=false;
  for(const p of players){p.airJumps=Math.min(p.airJumps,airJumpsMax());}
  renderAbil();tone('triangle',ABIL[k]?660:440,0,0.05,0.03);try{localStorage.setItem(ABIL_KEY,JSON.stringify(ABIL));}catch(e){}});
renderAbil();
// each hippo has its own eyes: Gus the real-hippo ones on the sides of his head, Gertie the wall-eyed ones up front
const EYES=['side','front'];
// which hippo a player is (p.who: 0 Gus, 1 Gertie) is only how they look and sound, never what they can do: p.idx is
// the seat (player one or two), and the moves, sizes and abilities are the same for both (suite twins checks it)
function dressHippo(p){
  const S=SKINS[p.who];p.name=S.name;p.hm.skin.color.setHex(S.skin);p.hm.dark.color.setHex(S.dark);p.hm.belly.color.setHex(S.belly);
  for(const m of p.bow)m.visible=p.who===1;
  for(const m of p.eyeFront)m.visible=EYES[p.who]==='front';for(const m of p.eyeSide)m.visible=EYES[p.who]==='side';
  if(p.ui&&p.ui.who){p.ui.who.textContent=charName(p).toUpperCase();p.ui.who.classList.toggle('p2',charTint(p)===1);}
  // (and the join prompt and the pause card, which were written with the skin's name)
  // (a goblin's tunic says which goblin: on the body the others see, and on the stand-in that carjacks)
  for(const g of [p.gb,p.jackA])if(g&&g.m&&g.m.roles&&g.m.roles.tunic)g.m.roles.tunic.color.setHex(GOB_TUNIC[p.who?1:0]);
  if(p.ui&&p.ui.join){p.ui.join.textContent=charName(p).toUpperCase()+': connect a controller and press any button';const t=p.ui.ppause&&p.ui.ppause.querySelector('.ptitle');if(t&&t.textContent!==undefined)t.textContent=charName(p)+' · PAUSED';}
}
// (first called once the debug settings exist, from ui/char-select.js)
const GOB_NAMES=['Gnash','Grizzle'];   // (the goblins you can play: Gnash and his cousin Grizzle, p.who 0 and 1 as for the hippos)
const charName=p=>p.gob?GOB_NAMES[p.who?1:0]:p.who?'Gertie':'Gus';
const GOB_TUNIC=[0x3a5f8a,0xa83232];   // (Gnash in blue, Grizzle in red)
const charTint=p=>{if(!p.gob)return p.who;const o=players.find(q=>q!==p);return o&&!o.gob?1-o.who:p.who;};   // (0 or 1: which of the two colours a player's marked in, on the maps and the HUD)
{
  const vs=document.getElementById('viewDist'),vl=document.getElementById('viewVal');
  const dds=document.getElementById('detailDist'),ddl=document.getElementById('detailVal');
  const show=()=>{vs.value=String(viewSetting);vl.textContent=Math.max(viewSetting,detailSetting)+' blocks';dds.value=String(detailSetting);ddl.textContent=detailSetting+' blocks';};show();
  vs.addEventListener('input',()=>{
    viewSetting=Math.max(VIEW_MIN,Math.min(VIEW_MAX,Math.round((+vs.value||112)/16)*16));show();farDirty=true;
    try{localStorage.setItem(VIEW_KEY,String(viewSetting));}catch(e){}
  });
  dds.addEventListener('input',()=>{
    detailSetting=Math.max(DETAIL_MIN,Math.min(DETAIL_MAX,Math.round((+dds.value||112)/16)*16));
    viewR=players[1].active?VIEW_COOP():VIEW_SOLO();show();farDirty=true;
    try{localStorage.setItem(DETAIL_KEY,String(detailSetting));}catch(e){}
  });
  const cs=document.getElementById('crowdDist'),cl=document.getElementById('crowdVal');
  const showC=()=>{cs.value=String(crowd);cl.textContent=Math.round(crowd*100)+'%';};showC();
  cs.addEventListener('input',()=>{
    crowd=Math.max(0,Math.min(CROWD_MAX,Math.round((+cs.value||0)*4)/4));showC();ensureCrowdPools();
    try{localStorage.setItem(CROWD_KEY,String(crowd));}catch(e){}
  });
  const ts=document.getElementById('trafficDist'),tl=document.getElementById('trafficVal');
  const showT=()=>{ts.value=String(traffic);tl.textContent=Math.round(traffic*100)+'%';};showT();
  ts.addEventListener('input',()=>{traffic=Math.max(0,Math.min(10,Math.round((+ts.value||0)*4)/4));showT();ensureCrowdPools();try{localStorage.setItem(TRAFFIC_KEY,String(traffic));}catch(e){}});
  const ds=document.getElementById('daySpeed'),dl=document.getElementById('daySpeedVal'),dn=document.getElementById('daySpeedNote');
  const showD=()=>{
    const m=DAY_SPEEDS[daySpd];ds.value=String(daySpd);
    dl.textContent=m===0?'Frozen':m===1?'Normal':'×'+m;
    if(m===0)dn.textContent='The sun stays where it is.';
    else{const mins=10/m;dn.textContent='One full day and night takes '+(mins>=1?(Math.round(mins*10)/10)+' minute'+(mins===1?'':'s'):Math.round(mins*60)+' seconds')+'.';}
  };showD();
  const fs=document.getElementById('fireDur'),fl=document.getElementById('fireDurVal'),fn=document.getElementById('fireDurNote');
  const showF=()=>{fs.value=String(fireDurI);const D=FIRE_DURS[fireDurI];fl.textContent=D.l;
    fn.textContent=D.m===Infinity?'Fires and smoke never go out.':'How long the wreckage of explosions and collapses keeps burning and smoking ('+(D.m===4?'the usual':'×'+(D.m/4))+').';};showF();
  fs.addEventListener('input',()=>{fireDurI=Math.max(0,Math.min(FIRE_DURS.length-1,Math.round(+fs.value)||0));showF();try{localStorage.setItem(FIREDUR_KEY,String(fireDurI));}catch(e){}if(typeof refireDur==='function')refireDur();});
  const cps=document.getElementById('fireCap'),cpl=document.getElementById('fireCapVal');
  const showCap=()=>{cps.value=String(fireCapI);cpl.textContent=FIRE_CAPS[fireCapI]===Infinity?'No limit':String(FIRE_CAPS[fireCapI]);};showCap();
  cps.addEventListener('input',()=>{fireCapI=Math.max(0,Math.min(FIRE_CAPS.length-1,Math.round(+cps.value)||0));showCap();try{localStorage.setItem(FIRECAP_KEY,String(fireCapI));}catch(e){}if(typeof trimFires==='function')trimFires(0);});
  ds.addEventListener('input',()=>{daySpd=Math.max(0,Math.min(DAY_SPEEDS.length-1,Math.round(+ds.value)||0));showD();try{localStorage.setItem(DAYSPD_KEY,String(daySpd));}catch(e){}});
}
const alivePlayers=()=>players.filter(p=>p.active&&p.state!=='dead');
function nearestPlayer(x,z,aliveOnly=true){let best=null,bd=1e9;for(const p of players){if(!p.active||(aliveOnly&&p.state==='dead'))continue;const d=Math.hypot(p.pos.x-x,p.pos.z-z);if(d<bd){bd=d;best=p;}}return best?{p:best,d:bd}:null;}
function addShake(amt,x,z,radius=20){if(SBX)return;for(const p of players){if(!p.active)continue;const k=Math.max(0,1-Math.hypot(p.pos.x-x,p.pos.z-z)/radius);if(amt*k>p.shake)p.shake=amt*k;}}
// messages stack up: each new one appears at the bottom and pushes the others up; each fades out after a couple of
// seconds (a repeat of the newest just refreshes it), and at most four show at once
function flashLabel(s,who){if(SBX)return;for(const p of (who?[who]:players)){if(!p.active)continue;const box=p.ui.label;if(!box)continue;try{
  let el=box.lastElementChild;
  if(el&&el._s===s&&!el.classList.contains('old')){clearTimeout(el._t);}
  else{el=document.createElement('div');el.className='lbl';el._s=s;el.innerHTML=hudHTML(s);box.append(el);
    const live=Array.from(box.children||[]).filter(c=>!c.classList.contains('old'));while(live.length>4){const o=live.shift();clearTimeout(o._t);o.remove();}}
  el._t=setTimeout(()=>{el.classList.add('old');setTimeout(()=>el.remove(),400);},2400);}catch(e){}}}
const HIPPO_FEET=[[0,0],[.55,.9],[-.55,.9],[.55,-.9],[-.55,-.9]].map(([a,b])=>[a*ES,b*ES]);
const ptsOf=p=>p&&p.gob?GOB_FEET:HIPPO_FEET;   // (a player's feet: a hippo's, or a goblin's, see setGobP)
const CAR_PTS=[[0,0],[.9,1.7],[-.9,1.7],[.9,-1.7],[-.9,-1.7]].map(([a,b])=>[a*ES,b*ES]);
// the top of any car under the hippo (cabin roof or hood/trunk), if his feet are at or above it
function carTop(p){
  let best=null,bc=null;const s=Math.sin(p.heading),k=Math.cos(p.heading);
  for(const c of cars){
    if(!c.alive||Math.hypot(c.pos.x-p.pos.x,c.pos.z-p.pos.z)>c.hz+3)continue;
    const cs=Math.sin(c.heading),ck=Math.cos(c.heading);
    for(const [a,b] of ptsOf(p)){
      const dx=p.pos.x+a*k+b*s-c.pos.x,dz=p.pos.z-a*s+b*k-c.pos.z,la=dx*ck-dz*cs,lb=dx*cs+dz*ck;
      if(Math.abs(la)>c.hx*1.05||Math.abs(lb)>c.hz*1.03)continue;
      const top=c.pos.y+VEH[c.veh].roof(lb/ES)*ES;
      if(top<=p.pos.y+(p.vy<0&&!p.grounded?1.1:0.35)&&(best===null||top>best)){best=top;bc=c;}
    }
  }
  for(const B of TRAIN_BOXES){const BX=B.hx||TRAIN_HX,BZ=B.hz||TRAIN_HZ;if(B.soft||Math.hypot(B.x-p.pos.x,B.z-p.pos.z)>Math.max(BX,BZ)+3)continue;
    for(const [a,b] of ptsOf(p)){const dx=p.pos.x+a*k+b*s-B.x,dz=p.pos.z-a*s+b*k-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx;
      if(Math.abs(al)>BZ||Math.abs(ac)>BX)continue;if(B.top<=p.pos.y+(B.proxy===p.rideC?1.2:0.35)&&(best===null||B.top>best||B.top===best&&B.proxy===p.rideC)){best=B.top;bc=B.proxy;}}}
  return best===null?null:{y:best,c:bc};
}
function footprint(p){
  const g=supportMax(p.pos.x,p.pos.z,p.heading,p.pos.y,ptsOf(p)),ct=carTop(p);
  // (the track rising just ahead of a coaster car, under his front feet, mustn't lift him off the one he's riding)
  if(ct&&(g===null||ct.y>g||ct.c===p.rideC&&ct.c.T&&ct.c.T.isRide&&g-ct.y<3)){p.standCar=ct.c;return ct.y;}
  p.standCar=null;return g;
}
function placePlayer(p,pos){
  p.pos.copy(pos);p.state='walk';p.t=0;p.vy=0;p.peakY=pos.y;p.hurt=0;p.biteT=0;p.hp=20;p.stam=100;p.exhausted=false;p.lungeT=0;p.biteHit=false;p.deadT=0;p.regenT=0;
  p.root.visible=true;p.root.rotation.set(0,0,0);p.head.rotation.x=0;for(const l of p.legs)l.rotation.set(0,0,0);p.corpse=null;p.mvx=p.mvz=0;
  p.pos.y=footprint(p)??p.pos.y;p.cam.yaw=p.heading+Math.PI;p.cam.pitch=-0.3;
}
function activateP2(){
  if(P2.active)return;
  P2.active=true;P2.heading=P1.heading;
  placePlayer(P2,findStreet(P1.pos.x,P1.pos.z,3,6));
  viewR=VIEW_COOP();layout();flashLabel('Gertie joined');
}
function deactivateP2(){P2.paused=false;P2.ui.ppause.hidden=true;P2.active=false;P2.root.visible=false;P2.pool.visible=false;viewR=VIEW_SOLO();layout();}
function shove(p,dx,dz){const nx=p.pos.x+dx,nz=p.pos.z+dz;if(groundAt(nx,nz,p.pos.y)-p.pos.y<1.05){p.pos.x=nx;p.pos.z=nz;}}
function startStomp(p){if(p.state!=='walk'||!p.grounded)return;p.state='windup';p.t=0;p.stompCharge=0;p.stompLevel=0;}
// three stomp strengths: tapped, held 1 second, held the full 2 seconds
const STOMP_LV=[
  {r:1,d0:-1,d1:1,gr:4,  gd:8, cd:8, sh:0.4, shR:16,f:1},
  {r:2,d0:-2,d1:1,gr:6.5,gd:14,cd:15,sh:0.6, shR:26,f:2},
  {r:3,d0:-2,d1:2,gr:10, gd:25,cd:28,sh:0.85,shR:40,f:3},
];
const stompLevelOf=c=>c>=2?2:c>=1?1:0;
// cars are hit by their whole body, not their centre: the distance from the hit to the nearest point of the car's
// box (the same box the NPC hurtbox overlay shows). That lets every attack use one area for goblins and cars alike.
const CAR_HX=1.0*ES,CAR_HZ=1.9*ES,CAR_HY=1.6*ES;   // a plain car (each vehicle carries its own hx, hz, hy)
function carNearest(c,x,y,z){
  const s=Math.sin(c.heading),k=Math.cos(c.heading),dx=x-c.pos.x,dz=z-c.pos.z;
  const lx=dx*k-dz*s,lz=dx*s+dz*k,cx=Math.max(-c.hx,Math.min(c.hx,lx)),cz=Math.max(-c.hz,Math.min(c.hz,lz));
  const cy=Math.max(c.pos.y,Math.min(c.pos.y+c.hy,y));
  return{d2:Math.hypot(lx-cx,lz-cz),dy:cy-y};
}
// an area hit (a ball of radius r at height y, cut to the vReach band), or with y undefined a plain flat circle
function carsNear(x,z,r,y){return cars.filter(c=>{if(!c.alive)return false;
  if(y===undefined)return carNearest(c,x,c.pos.y,z).d2<r;
  const dn=Math.max(2.5,r*0.45),up=Math.max(3,r*0.6);if(c.pos.y+c.hy<y-dn||c.pos.y>y+up)return false;
  const yy=Math.max(y-dn,Math.min(y+up,y)),n=carNearest(c,x,yy,z);return Math.hypot(n.d2,n.dy)<r;}).concat(trainsNear(x,z,r,y===undefined?null:y-3,y===undefined?null:y+3));}
// the train cars (their stand-ins) whose boxes come within r of (x,z), between heights y0 and y1 (if given)
function trainsNear(x,z,r,y0,y1){const out=[];for(const B of TRAIN_BOXES){const pr=B.proxy;if(!pr.alive||y0!==null&&(y1<B.y0||y0>B.top))continue;
  const dx=x-B.x,dz=z-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx;if(Math.hypot(Math.max(0,Math.abs(al)-(B.hz||TRAIN_HZ)),Math.max(0,Math.abs(ac)-(B.hx||TRAIN_HX)))<r&&!out.includes(pr)&&!(pr.isBoat&&out.some(o=>o.T===pr.T)))out.push(pr);}return out;}   // (a boat's many boxes are one boat: one hit)
// a moving car's bumper zone: its body plus a small margin. Anything whose body touches it is struck.
// (the hippo's box is his body, rump to shoulders: 1.45 either side of his middle; his head isn't in it)
const RAM_M=0.3,P_OFF=0;
// (each player's own body: a hippo's, or a goblin's when they play as one. hx/hz half-width and half-length, hy height;
// lat/along/ys the points bodyHits tests, at head height only: a block at the feet is a step up, the ground's business)
const HIPPO_BODY={hx:0.75*ES,hz:1.45*ES,hy:2.1*ES,lat:[-0.75*ES*0.95,0,0.75*ES*0.95],along:[-1.42,-0.5,0.5,1.42].map(v=>v*ES),ys:[1.25*ES,1.95*ES]};
const GOB_BODY={hx:0.38,hz:0.38,hy:1.35,lat:[-0.38,0,0.38],along:[-0.38,0,0.38],ys:[1.1,1.3]};
const bodyOf=p=>p&&p.gob?GOB_BODY:HIPPO_BODY;
const pBoxC=q=>({x:q.pos.x+Math.sin(q.heading)*P_OFF,z:q.pos.z+Math.cos(q.heading)*P_OFF});
// the same box is his body for bumping into things: would it overlap a wall (anything solid above a single step up) or
// a car (that he isn't standing on top of) with him at (x,z) facing h?
// (the solid fill under a flight of stairs isn't in the way of a long body walking up: its nose is over the next steps)
function underSteps(x,y,z){for(let k=1;k<=4;k++){const v=get(x,y+k,z);if(!v||!BLOCK[v].solid)return false;if(BLOCK[v].stair)return true;}return false;}
function bodyHits(p,x,z,h){
  const Bd=bodyOf(p);if(p.gob)h=0;   // (a goblin's body is square to the world, or looking round a corridor would wedge its corners in the walls)
  const s=Math.sin(h),c=Math.cos(h);
  // (climbing a flight his nose reaches the landing before his feet do: the lip of a floor doesn't stop him there)
  let onSteps=false;{const xi=Math.floor(x),zi=Math.floor(z),y0=Math.floor(p.pos.y);for(let k=-1;k<=1&&!onSteps;k++){const v=get(xi,y0+k,zi);if(v&&BLOCK[v].stair)onSteps=true;}}
  for(const b of Bd.along)for(const a of Bd.lat){if(a===0&&b>-1&&b<1)continue;   // (just the edge of the box)
    const wx=Math.floor(x+a*c+b*s),wz=Math.floor(z-a*s+b*c);
    for(const yy of Bd.ys){const fy=Math.floor(p.pos.y+yy),bl=get(wx,fy,wz);if(bl&&BLOCK[bl].solid&&!BLOCK[bl].ramp&&!underSteps(wx,fy,wz)&&!(onSteps&&!solidAt(wx,fy+1,wz)))return true;}}
  const bx=x+s*P_OFF,bz=z+c*P_OFF;
  for(const cr of cars){if(!cr.alive||cr===p.standCar||Math.abs(cr.pos.x-bx)>cr.hz+4||Math.abs(cr.pos.z-bz)>cr.hz+4)continue;
    if(p.pos.y>=cr.pos.y+cr.hy-0.45||p.pos.y+Bd.hy<=cr.pos.y)continue;
    if(boxesTouch(cr.pos.x,cr.pos.z,cr.heading,cr.hx,cr.hz,bx,bz,h,Bd.hx,Bd.hz))return true;}
  return false;}
// turning, or something moving into him, left him overlapping: nudge him out to the nearest free spot (never stuck)
function bodyFree(p){
  if(!bodyHits(p,p.pos.x,p.pos.z,p.heading))return;
  for(const d of [0.12,0.25,0.4,0.6,0.85])for(let k=0;k<8;k++){const a=k*Math.PI/4+p.heading+Math.PI,nx=p.pos.x+Math.sin(a)*d,nz=p.pos.z+Math.cos(a)*d;
    // (on a narrow ledge his middle may hang out over the drop, so long as his feet are still on it)
    if((Math.abs(groundAt(nx,nz,p.pos.y+0.5)-p.pos.y)<0.6||Math.abs((supportMax(nx,nz,p.heading,p.pos.y,ptsOf(p))??-9)-p.pos.y)<0.6)&&!bodyHits(p,nx,nz,p.heading)){p.pos.x=nx;p.pos.z=nz;return;}}
}
// do two boxes (centre, heading, half-width, half-length) overlap on the ground plane? separating-axis test
function boxesTouch(ax,az,ah,awx,awz,bx,bz,bh,bwx,bwz){
  const A=[[Math.cos(ah),-Math.sin(ah)],[Math.sin(ah),Math.cos(ah)]],B=[[Math.cos(bh),-Math.sin(bh)],[Math.sin(bh),Math.cos(bh)]],dx=bx-ax,dz=bz-az;
  for(const [ux,uz] of [...A,...B]){
    const ra=awx*Math.abs(A[0][0]*ux+A[0][1]*uz)+awz*Math.abs(A[1][0]*ux+A[1][1]*uz);
    const rb=bwx*Math.abs(B[0][0]*ux+B[0][1]*uz)+bwz*Math.abs(B[1][0]*ux+B[1][1]*uz);
    if(Math.abs(dx*ux+dz*uz)>ra+rb)return false;}
  return true;
}
// is a hippo's hurtbox touching this car's bumper zone?
const carHitsPlayer=(c,q)=>{const Bd=bodyOf(q);if(!(q.pos.y<c.pos.y+c.hy&&q.pos.y+Bd.hy>c.pos.y))return false;const b=pBoxC(q);return boxesTouch(c.pos.x,c.pos.z,c.heading,c.hx+RAM_M,c.hz+RAM_M,b.x,b.z,q.heading,Bd.hx,Bd.hz);};
// ...or a goblin's (a 0.45-wide cylinder, 1.6 tall)
const carHitsGoblin=(c,g)=>g.pos.y<c.pos.y+c.hy&&g.pos.y+1.6>c.pos.y&&carNearest(c,g.pos.x,c.pos.y,g.pos.z).d2<0.45+RAM_M;
// a straight-sided cylinder from y0 to y1 (the bite's jaw zones)
function carsInCyl(x,z,r,y0,y1){return cars.filter(c=>c.alive&&c.pos.y<y1&&c.pos.y+c.hy>y0&&carNearest(c,x,c.pos.y,z).d2<r).concat(trainsNear(x,z,r,y0,y1));}
