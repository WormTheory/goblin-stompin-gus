// ---------- Game feel: combos, score pop-ups, damage numbers and shouts, the City wrecked card ----------
// Every kill or smash a player makes within COMBO_T seconds of their last adds one to their combo, and it multiplies
// the points: +10% a step from the second, up to three times at x21 (comboMult). A combo's milestones get a name and a
// shout (COMBO_MILES). Each player has their own (p.cbN, p.cbT: plain numbers, so an online guest gets its own in the
// snapshot like the rest of the player); the best one this rampage is RAMP.best. Points are given out through award(),
// which also puts the line in the wreck feed (flashLabel) and floats the points up from where they were earned (hudPop).
const COMBO_T=3;
const COMBO_MILES=[[5,"Stompin'!"],[10,'STOMPTACULAR!'],[15,'Hippo-critical!'],[20,'GOBLINGEDDON!'],[30,'Unstoppable lump!'],[50,'HIPPOCALYPSE!'],[75,'Wallow of doom!'],[100,'Legend of the bog!']];
const comboMult=n=>Math.min(3,1+0.1*Math.max(0,n-1));
function comboName(n){let s='';for(const [k,t] of COMBO_MILES)if(n>=k)s=t;return s;}
// (damage numbers over the goblins and shouts like SPLAT!: on unless switched off in Options, kept in this browser)
const POPS_KEY='goblin-stompin-gus-pops';
let POPS_ON=true;try{POPS_ON=localStorage.getItem(POPS_KEY)!=='0';}catch(e){}
function comboBump(p){
  if(!p)return;p.cbN=(p.cbT>0?p.cbN||0:0)+1;p.cbT=COMBO_T;
  if(p.cbN>RAMP.best)RAMP.best=p.cbN;
  for(const [k,t] of COMBO_MILES)if(p.cbN===k)hudPop(null,null,null,'x'+k+' '+t,'mile',p);
}
// points for something a player did: who gets them (the nearest player to x,z unless said), the combo (unless
// o.bump is false: a block or two knocked out isn't a smash), the feed line if there's a label, the pop-up if there's a place
function award(pts,label,x,y,z,who,o){
  o=o||{};
  if(who===undefined){const n=x!=null?nearestPlayer(x,z):null;who=n&&n.p||null;}
  if(o.bump!==false&&who)comboBump(who);
  const got=Math.round(pts*(who?comboMult(who.cbN||0):1));
  score+=got;
  if(label)flashLabel(label+'  +'+got,who);
  if(x!=null&&got>0&&o.pop!==false)hudPop(x,y,z,'+'+got,'pts',who);
  return got;
}
// (the clock runs down on the host, or offline; a guest's comes in the snapshot)
function comboTick(p,dt){if(p.cbT>0&&!netGuest()){p.cbT=Math.max(0,p.cbT-dt);if(p.cbT===0)p.cbN=0;}}
function comboHud(p){
  const u=p.ui;if(!u.combo)return;const n=p.cbN||0,on=n>=2&&p.cbT>0;
  if(u.combo.hidden===on)u.combo.hidden=!on;if(!on){u.cbShown=0;return;}
  if(u.cbShown!==n){u.cbShown=n;u.cbn.textContent='x'+n;u.cbm.textContent=comboName(n)||'Combo!';
    const k=comboMult(n);u.cbx.textContent='Score x'+(Math.round(k*10)/10);
    u.combo.classList.remove('bump');void u.combo.offsetWidth;u.combo.classList.add('bump');}
  u.cbFill.style.width=(p.cbT/COMBO_T*100).toFixed(1)+'%';
}
// ---- pop-ups: pooled, placed on screen from a spot in the world each frame, floating up and fading ----
// kind: 'pts' (yolk +points), 'dmg' (tomato -damage), 'shout' (SPLAT! and friends), 'mile' (a combo milestone, in the
// middle of that player's half of the screen rather than at a spot). Only drawn in the view of the player they're for.
const POPS={el:null,pool:[],live:[],max:20,v:null,sndT:0};
function hudPop(x,y,z,txt,kind,who){
  if(!POPS_ON&&(kind==='dmg'||kind==='shout'))return;
  const p=who||P1;if(!p.active||p.net)return;
  if(!POPS.el){POPS.el=document.getElementById('pops');if(!POPS.el)return;}
  let P=POPS.live.length>=POPS.max?POPS.live.shift():POPS.pool.pop();
  if(!P){P={el:document.createElement('div')};POPS.el.appendChild(P.el);}
  P.x=x;P.y=y;P.z=z;P.p=p;P.t=0;P.kind=kind;P.life=kind==='mile'?1.8:kind==='shout'?1.1:0.95;
  P.el.className='pop px '+kind;P.el.textContent=txt;P.el.style.display='';P.dx=kind==='mile'?0:((POPS.n=(POPS.n||0)+1)*37%27-13);   // (a little sideways drift, not from Math.random: that would shift the game's own dice)
  POPS.live.push(P);
  // (a little blip for points, rising as the combo climbs, at most one every 70 ms; a fanfare for a milestone)
  try{const T=NET_FX&&NET_FX.tone||tone,now=performance.now();
    if(kind==='mile'){T('square',520,1040,0.18,0.06);setTimeout(()=>{try{T('square',780,1560,0.22,0.06);}catch(e){}},110);}
    else if(kind==='pts'&&now-POPS.sndT>70){POPS.sndT=now;const n=p.cbN||0;T('triangle',660+Math.min(30,n)*24,900+Math.min(30,n)*30,0.05,0.025);}}catch(e){}
}
function popTick(dt){
  if(!POPS.live.length)return;
  if(!POPS.v)try{POPS.v=new THREE.Vector3();}catch(e){return;}
  const calm=reduceMotion();
  for(let i=POPS.live.length-1;i>=0;i--){const P=POPS.live[i];P.t+=dt;
    if(P.t>=P.life||!P.p.active){P.el.style.display='none';POPS.live.splice(i,1);POPS.pool.push(P);continue;}
    const V=P.p.ui.view,vl=parseFloat(V.style.left)||0,vt=parseFloat(V.style.top)||0,vw=parseFloat(V.style.width)||innerWidth,vh=parseFloat(V.style.height)||innerHeight;
    let sx,sy;
    if(P.x==null){sx=vl+vw/2;sy=vt+vh*0.4;}
    else{const v=POPS.v.set(P.x,P.y,P.z);try{v.project(P.p.camera);}catch(e){continue;}
      if(!(v.z<1)||Math.abs(v.x)>1.2||Math.abs(v.y)>1.2){P.el.style.opacity='0';continue;}
      sx=vl+(v.x+1)/2*vw;sy=vt+(1-v.y)/2*vh;}
    const k=P.t/P.life,rise=calm?0:(P.kind==='mile'?14:P.kind==='shout'?30:48)*k,a=k<0.7?1:1-(k-0.7)/0.3;
    const sc=calm?1:P.t<0.12?0.5+P.t/0.12*0.7:P.t<0.24?1.2-(P.t-0.12)/0.12*0.2:1;
    P.el.style.opacity=a.toFixed(2);
    P.el.style.transform='translate('+(sx+P.dx*k).toFixed(1)+'px,'+(sy-rise).toFixed(1)+'px) translate(-50%,-50%) scale('+sc.toFixed(2)+')'+(P.kind==='shout'?' rotate(-8deg)':'');}
}
// (what a goblin's death is shouted as, from how it died)
function killShout(cause){
  const c=String(cause||'').toLowerCase();
  return /stomp|squash|flatten|landed|crash|sat on|pound/.test(c)?'SPLAT!':/bit|chomp|jaw/.test(c)?'CHOMP!':/trampl|run over|rammed|charg/.test(c)?'FLATTENED!':/blown|explo|blast|boom|rocket|grenade|shell/.test(c)?'KABOOM!':/shot|rifle|gun/.test(c)?'BLAM!':/club|dagger|stab/.test(c)?'WHACK!':'BONK!';
}
// ---- the City wrecked card, bottom right of each player's view: how much of the place they're in is wrecked ----
const WRECK_WORD={city:'City',coastcity:'City',large:'Town',small:'Town',harbortown:'Town',resort:'Town',village:'Village',fishing:'Village'};
function wreckHud(p,dt){
  const u=p.ui;if(!u.wreck)return;u.wreckT=(u.wreckT||0)-dt;if(u.wreckT>0)return;u.wreckT=0.25;
  let S=null,v=null;try{S=placeOf(p);v=S&&setListC.has(S.rx+','+S.rz)?setDestroyed(S):null;}catch(e){}
  const on=v!=null&&playing;if(u.wreck.hidden===on)u.wreck.hidden=!on;if(!on)return;
  const pc=Math.round(v*100),t=(WRECK_WORD[setKind(S)]||'Town')+' wrecked',k=t+pc;
  if(u.wreckK!==k){u.wreckK=k;u.wkT.textContent=t;u.wkV.textContent=pc+'%';u.wkFill.style.width=pc+'%';u.wkFill.classList.toggle('none',pc===0);}
}
// (Options: the damage numbers and shouts switch)
{const t=document.getElementById('popsTog');
 if(t){const show=()=>t.setAttribute('aria-checked',String(POPS_ON));show();
  t.addEventListener('click',()=>{POPS_ON=!POPS_ON;try{localStorage.setItem(POPS_KEY,POPS_ON?'1':'0');}catch(e){}show();});}}
