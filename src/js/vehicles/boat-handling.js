// ---- a boat as you drive it (from drvBoat, driving.js) ----
// The throttle has notches that stay where they're left (bo.notch: -1 astern, 0 stop, 1 slow, 2 half, 3 full): W and S
// step it one a tap, and held they sweep along; a controller's triggers step it. The hull rides waves that grow with the
// wind, leans into its turns, and a fast boat planes: past two-thirds of its speed the bow lifts, the drag falls away and
// it goes faster, and cresting a wave it's thrown into the air (bo.dy, bo.lp, bo.lr: what updateBoat adds to its pose).
// Space drops the anchor: under way it stops hard and swings round on it. The rowboat has no engine: left and right click
// pull each oar (bo.row), both together go straight, one alone turns, and keeping a rhythm goes faster; the pedalo is
// pedalled with W, faster tapped in rhythm, and steered on a tiller. Right click is each kind's special (BOAT_SPEC)
const BOAT_H={notch:[-0.35,0,0.35,0.65,1],sweep:0.25,hold:0.4,plane:0.66,planeK:1.35,hop:5,wave:0.12};
const BOAT_SPEC={speed:'boost',launch:'horn blast',sail:'swing the boom',fish:'cast the net',tug:'push mode',ferry:'horn blast',navy:'deck gun',cargo:'horn blast',pedalo:'bell'};
const BOAT_FAST=K=>K.sp>=7;   // (the kinds that plane: speedboats and launches)
// the wind, one per world, wandering slowly round (the sailboat and the balloon read it): its heading, strength 0.3 up,
// more in stormy weather, and which way it blows as x and z
const WIND={a:null,t:0};
function windNow(dt){if(WIND.a===null)WIND.a=hash2(seed,31)*Math.PI*2;if(dt)WIND.t+=dt;
  const a=WIND.a+0.6*Math.sin(WIND.t/240),k=0.3+(WX.k.wind||0);return{a,k,x:Math.sin(a)*k,z:Math.cos(a)*k};}
// the throttle's notch from W/S (tapped, or held to sweep) or the triggers
function boatNotch(bo,i,dt){const z=i.z<-0.3?1:i.z>0.3?-1:0,tr=(i.rt||0)>0.6?1:(i.lt||0)>0.6?-1:0,d=z||tr;
  if(bo.notch===undefined)bo.notch=bo.sp>0.3?2:0;
  if(!d){bo.nT=0;bo.nD=0;return;}
  if(d!==bo.nD){bo.nD=d;bo.nT=BOAT_H.hold;}else{bo.nT-=dt;if(bo.nT>0)return;bo.nT=BOAT_H.sweep;}
  const n=Math.max(-1,Math.min(3,bo.notch+d));if(n!==bo.notch){bo.notch=n;if(audio)sfx('Throttle notch',()=>tone('square',260+n*70,260+n*70,0.05,0.03));}}
// the rowboat's oars and the pedalo's pedals: returns {want, turn}, the speed asked and the turn
function boatRow(bo,i,dt,top){const R=bo.row||(bo.row={l:0,r:0,ok:0,tl:0,tr:0,tp:0,pz:0});R.tl+=dt;R.tr+=dt;R.tp+=dt;
  R.l=Math.max(0,R.l-dt*1.5);if(bo.k==='row')R.r=Math.max(0,R.r-dt*1.5);
  if(bo.k==='pedalo'){
    // (pedalled with W: held it goes, tapped in rhythm it goes faster; A/D the tiller)
    const on=i.z<-0.3,press=on&&!R.pz;R.pz=on;if(press){const t=R.tp;R.tp=0;R.ok=t>0.18&&t<0.6?Math.min(1,R.ok+0.2):Math.max(0,R.ok-0.3);}
    if(!on&&R.tp>0.8)R.ok=Math.max(0,R.ok-dt);R.l=on?1:R.l;R.r=-i.x;
    return{want:on||R.tp<0.4?top*(0.55+0.45*R.ok):0,turn:-i.x};}
  // (the oars: each stroke a push, both together straight on, one alone round; a steady stroke (0.5 to 1.2 s) is faster)
  const L=!!i.seHornP,Rt=!!i.seSpecP,rhythm=t=>t>0.5&&t<1.2;
  // (a stroke pulled before the oar's back round, under half a second, pushes less)
  let half=1;if(L){half=Math.min(1,R.tl/0.5);R.ok=rhythm(R.tl)?Math.min(1,R.ok+0.15):Math.max(0,R.ok-0.2);R.tl=0;R.l=1;}
  if(Rt){half=Math.min(half,R.tr/0.5);R.ok=rhythm(R.tr)?Math.min(1,R.ok+0.15):Math.max(0,R.ok-0.2);R.tr=0;R.r=1;}
  if(L||Rt){if(audio)sfx('Oar stroke',()=>noise(0.18,0.06,700,'lowpass'));const both=L&&Rt||L&&R.tr<0.2||Rt&&R.tl<0.2,push=top*0.35*(1+R.ok*0.6)*(both?1.4:1)*half*half;
    bo.sp=(bo.sp||0)+push;if(!both)bo.yr=(bo.yr||0)+(L?-1:1)*0.9;}   // (the left oar alone turns it right)
  if(R.tl>2&&R.tr>2)R.ok=Math.max(0,R.ok-dt*0.5);
  bo.sp*=Math.exp(-dt*0.7);bo.yr=(bo.yr||0)*Math.exp(-dt*1.8);bo.sp=Math.min(bo.sp,top*1.2);
  return{want:null,turn:0};}
// the boat's own special (right click), by kind
function boatSpecial(V,bo,p){const g=bo.g,K=bo.K,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),x=g.position.x,z=g.position.z,k=bo.k;
  if((bo.spT||0)>0)return;
  if(k==='speed'){bo.boostT=2.2;bo.spT=6;if(audio)sfx('Boost',()=>noise(0.8,0.2,600,'bandpass'));flashLabel('Boost!',p);return;}
  if(k==='tug'){bo.push=!bo.push;flashLabel(bo.push?'Push mode: shove what you touch':'Push mode off',p);return;}
  if(k==='pedalo'){bo.spT=0.6;if(audio)sfx('Bell',()=>{tone('triangle',1500,1500,0.4,0.05);tone('triangle',1880,1880,0.3,0.03);});return;}
  if(k==='launch'||k==='ferry'||k==='cargo'){bo.spT=3;const R=k==='launch'?16:26;
    if(audio)sfx('Horn blast',()=>{tone('sawtooth',110,108,1.4,0.12);tone('sawtooth',139,137,1.4,0.09);});addShake(0.3,x,z,40);
    // (goblins near it scatter: knocked back and stunned a moment)
    for(const q of goblins){if(q.state!=='chase'&&q.state!=='civ')continue;const dx=q.pos.x-x,dz=q.pos.z-z,d=Math.hypot(dx,dz);if(d>R||d<0.1)continue;
      q.stun=Math.max(q.stun||0,1.2);q.kv.x+=dx/d*8;q.kv.z+=dz/d*8;q.vy=Math.max(q.vy||0,3);}
    return;}
  if(k==='sail'){bo.spT=1.5;bo.boom=1;if(audio)sfx('Boom swing',()=>noise(0.4,0.12,300,'lowpass'));
    // (the boom swings across: goblins aboard or alongside, out to 6 either side, knocked overboard)
    const by='Knocked overboard by a boom';
    for(const q of goblins){if(q.state!=='chase')continue;const dx=q.pos.x-x,dz=q.pos.z-z,al=dx*tx+dz*tz,ac=-dx*tz+dz*tx;if(Math.abs(al)>bo.L*0.35||Math.abs(ac)>K.W/2+6||q.pos.y>G+K.fb+3)continue;
      const s=ac>=0?1:-1;damageGoblin(q,4,q.pos.clone(),new V3(-tz*s,0.5,tx*s),by,p);q.kv.x+=-tz*s*14;q.kv.z+=tx*s*14;q.vy=Math.max(q.vy||0,6);}
    for(const q of pvpFoes(p)){const dx=q.pos.x-x,dz=q.pos.z-z,al=dx*tx+dz*tz,ac=-dx*tz+dz*tx;if(Math.abs(al)>bo.L*0.35||Math.abs(ac)>K.W/2+6)continue;const s=ac>=0?1:-1;pvpHurt(p,q,3,q.pos.clone(),new V3(-tz*s,0.5,tx*s),by,{cd:1});}
    return;}
  if(k==='fish'){bo.spT=4;if(audio)sfx('Net cast',()=>noise(0.6,0.08,500,'lowpass'));let n=0;const by="Caught in a trawler's net";
    // (the net, over the stern: every goblin swimming within 10 of it caught and hauled in)
    const sx=x-tx*bo.L*0.5,sz=z-tz*bo.L*0.5;
    for(const q of goblins){if(q.state!=='chase'&&q.state!=='civ')continue;if(q.pos.y>G+1.5||Math.hypot(q.pos.x-sx,q.pos.z-sz)>10)continue;
      q.state==='civ'?(q.hp=0,q.state='dead'):damageGoblin(q,99,q.pos.clone(),new V3(sx-q.pos.x,0.5,sz-q.pos.z).normalize(),by,p);n++;}
    for(const q of pvpFoes(p)){if(q.pos.y>G+1.5||Math.hypot(q.pos.x-sx,q.pos.z-sz)>10)continue;pvpHurt(p,q,4,q.pos.clone(),null,by,{cd:2});}
    flashLabel(n?'Net cast: '+n+' caught':'Net cast: nothing',p);return;}
  if(k==='navy'){bo.spT=1.6;const A=drvAim(p,60),mx=x+tx*bo.L*0.3,my=G+K.fb+2,mz=z+tz*bo.L*0.3,L=Math.hypot(A.x-mx,A.y-my,A.z-mz)||1,sp=50;
    shot({kind:'shell',x:mx,y:my,z:mz,vx:(A.x-mx)/L*sp,vy:(A.y-my)/L*sp+3,vz:(A.z-mz)/L*sp,grav:2,fuse:4,R:4,dmg:4,cause:"Shelled by a goblin's warship",by:pvpBy(p),crush:3,vd:60,own:bo});
    smoke(mx,my,mz,3,0x8a8a80);if(audio)sfx('Deck gun',()=>{noise(0.5,0.5,350,'lowpass');tone('sawtooth',80,40,0.4,0.12);});addShake(0.25,x,z,30);}}
// the driving: returns its speed
function boatDrive(V,bo,p,i,dt){const g=bo.g,K=bo.K,fast=BOAT_FAST(K),oars=bo.k==='row'||bo.k==='pedalo';
  let top=Math.max(6,K.sp*1.6),turn=-i.x;
  if(i.seAnchorP){bo.anchor=!bo.anchor;if(audio)sfx('Anchor',()=>{noise(0.9,0.18,250,'lowpass');clang();});flashLabel(bo.anchor?'Anchor down':'Anchor up',p);if(bo.anchor)bo.anT=Math.sign(bo.sp||0)*(turn||(Math.random()<0.5?-1:1));}
  if(i.seSpecP&&!oars||bo.k==='pedalo'&&i.seSpecP)boatSpecial(V,bo,p);
  bo.spT=(bo.spT||0)-dt;bo.boostT=Math.max(0,(bo.boostT||0)-dt);if(bo.boom>0)bo.boom=Math.max(0,bo.boom-dt*2);
  const w=windNow(dt);
  let want;
  if(oars){const r=boatRow(bo,i,dt,top);want=r.want;turn=bo.k==='pedalo'?r.turn:0;}
  else{boatNotch(bo,i,dt);want=top*BOAT_H.notch[bo.notch+1];
    if(bo.k==='sail'&&bo.notch>0){const rel=Math.abs(Math.sin(g.rotation.y-w.a)),k2=0.45+0.9*rel*Math.min(1.3,w.k/0.6);want*=k2;}   // (under sail: fastest across the wind)
    if(bo.boostT>0){want=top*1.6;if(Math.random()<dt*30)puff(g.position.x-Math.sin(g.rotation.y)*bo.L*0.5,G+1,g.position.z-Math.cos(g.rotation.y)*bo.L*0.5,2,0xffffff,0.8);}}
  // (planing: the bow up, faster, and answering quicker)
  bo.plane=fast&&!bo.anchor&&(bo.sp||0)>top*BOAT_H.plane;if(bo.plane&&want>0)want*=BOAT_H.planeK;
  if(bo.anchor){want=0;bo.sp=(bo.sp||0)*Math.exp(-dt*2.5);g.rotation.y+=(bo.anT||1)*Math.min(1.2,Math.abs(bo.sp)*0.12+0.05)*dt*Math.min(1,10/bo.L+0.3);}
  else if(want!==null)bo.sp=(bo.sp||0)+(want-(bo.sp||0))*Math.min(1,dt*(0.3+3/bo.L)*(bo.plane?1.6:1));
  // (the rudder bites only under way; the rowboat turns by its oars)
  g.rotation.y+=turn*dt*Math.min(1.2,10/bo.L+0.15)*Math.max(-1,Math.min(1,(bo.sp||0)/3))+(bo.yr||0)*dt;
  // the hull's pose: waves (bigger in wind, for small boats), a lean into turns, the bow up when planing, and air off a crest
  const A=BOAT_H.wave*(0.6+w.k)*Math.min(1,8/bo.L);bo.wph=(bo.wph||0)+dt*(1.3+Math.abs(bo.sp)*0.12);const s=Math.sin(bo.wph);
  const lr=-turn*Math.min(1,Math.abs(bo.sp)/top)*0.16,lp=(bo.plane?-0.09:0)+A*0.5*Math.cos(bo.wph)-(bo.sp>0.5&&want>bo.sp?0.03:0);
  bo.lr=(bo.lr||0)+(lr-(bo.lr||0))*Math.min(1,dt*3);bo.lp=(bo.lp||0)+(lp-(bo.lp||0))*Math.min(1,dt*3);
  if(bo.air){bo.vy-=20*dt;bo.dy+=bo.vy*dt;bo.lp-=0.15*dt;if(bo.dy<=0){bo.dy=0;bo.air=false;puff(g.position.x,G+1,g.position.z,10,0xeaf6ff,1.4);if(audio)sfx('Splash',()=>noise(0.5,0.2,900,'lowpass'));}}
  else{bo.dy=A*s;if(bo.plane&&bo.sp>top*0.8&&(bo.ws||0)<0.97&&s>=0.97&&A>0.08){bo.air=true;bo.vy=BOAT_H.hop*Math.min(1,A/0.15)*(bo.sp/top);}}
  bo.ws=s;}
// pushing another boat (a tug's push mode): it's moved along with this one, the smaller the more
function boatPush(bo,hit,dx,dz){const o=hit&&hit.T;if(!o||o===bo||!o.K||!o.g)return false;const k=Math.min(1,bo.L/o.L*1.2);
  o.g.position.x+=dx*k;o.g.position.z+=dz*k;const V=[...venues.values()].find(v=>v.bo===o);if(V){V.x=o.g.position.x;V.z=o.g.position.z;}return true;}
// the controls, for the column down the left
function boatHow(p,D,armed,G){const A=id=>actMark(p,id),bo=D.o,sp=BOAT_SPEC[bo.k],an=A('seAnchor')+(bo.anchor?' raise the anchor':' drop the anchor')+'  ·  ';
  if(bo.k==='row')return A('seHorn')+' left oar  ·  '+A('seSpec')+' right oar  ·  both: straight on, in a steady stroke  ·  '+an;
  if(bo.k==='pedalo')return A('fwd')+' pedal (tap in rhythm: faster)  ·  '+A('left')+'/'+A('right')+' tiller  ·  '+an+A('seSpec')+' bell  ·  ';
  return A('fwd')+'/'+A('back')+' throttle, a notch a tap  ·  '+A('left')+'/'+A('right')+' rudder  ·  '+an+(sp?A('seSpec')+' '+(bo.k==='tug'&&bo.push?'push mode off':sp)+'  ·  ':'')+A('seHorn')+' horn  ·  ';}
