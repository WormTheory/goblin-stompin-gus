// ---- light vehicles: a bicycle, a kick scooter, a self-balancing scooter (the Gobway) and a motor scooter ----
// They're cars as far as the traffic goes (VEH, cars.js; a body each built here by lightBuild), but each is ridden its
// own way (lightDrive, from drvCar, before the usual throttle):
//  bicycle: the throttle pedals at an easy cadence, up to about two thirds of its top speed; the special, tapped in a
//    rhythm, stands up on the pedals and sprints (c.cad, the cadence, 0 to 1, falling away between strokes), which tires
//    the legs (c.stam: empty, the strokes do nothing till it's back). The handbrake's the back brake, which skids.
//  kick scooter: no motor. Each press of the throttle is a kick (held, a kick every LV.kickHold s), each one less as it
//    nears its top speed, and it coasts a long way between. S is the foot on the back mudguard; the special an ollie.
//  Gobway: lean to go. The throttle leans you forward (c.lean, eased, -0.5 to 1) and it rolls at a speed set by how far
//    you lean, stopping itself when you stand up straight, and it turns on the spot. Near its top speed the bars push
//    back (c.push) with a beep; its battery (c.batt) runs down as it goes, and once it's low it goes at half speed.
//  motor scooter: twist and go, no gears: a smooth pull that tails off near the top. Its fuel (c.fuel) lasts a long
//    while, then it splutters along at a crawl. The special flicks the indicators on, to the side you're steering, or off.
// What's light is LIGHT_RIDE: thrown off by a wall (updateCars); open, so you're seen riding it (RIDE_SEAT, driving.js).
const LIGHT_RIDE={bike:1,bicycle:1,kick:1,segway:1,moped:1};
const LV={cruise:0.62,cadTap:0.26,cadFall:0.55,stamUse:0.07,stamBack:0.1,kick:3.4,kickHold:0.75,kickCD:0.28,
  lean:3.5,leanV:2.4,pushAt:0.9,batt:0.0035,battLow:0.12,fuel:0.0016,fuelLow:0.35,hop:4.5};
// (how fast each goes about the streets by itself, and how far it leans into a turn)
const LIGHT_AI={bicycle:6,kick:4,segway:4.5,moped:8.5},LIGHT_LEAN={bike:0.4,bicycle:0.35,moped:0.3,kick:0.18};
const lightOf=c=>!!c&&LIGHT_RIDE[c.veh]&&c.veh!=='bike';
// the model: from its file in src/assets/vehicles/ (assetVehParts, core/assets.js), in the model's own units as the
// other vehicles' are. Each part's a group turning about its own point; the goblin on it is the part rider (shown with
// the driver's head, as the motorcycle's rider is), his legs legL and legR, his body body; a bicycle's cranks crank
function lightBuild(c,t,g,b,wheels,front){
  const V=ASSETS.vehicles[t],{parts,boxes}=assetVehParts(V),G={},blink=[0,1].map(()=>new THREE.MeshBasicMaterial({color:0x3a2408}));
  const role={paint:c.paint,tire:smat(CARC.tire),hub:smat(CARC.hub),head:smat(CARC.head),tail:smat(CARC.tail),blinkL:blink[0],blinkR:blink[1],skin:smat(GC.skin),tunic:smat(GC.tunic),belt:smat(GC.belt)};
  for(const q of parts){const o=new THREE.Group();o.position.set(...q.lp);(q.par?G[q.par]:g).add(o);G[q.n]=o;
    if(/^wheel/.test(q.n))wheels.push(o);if(q.n==='steerF')front.push(o);}
  for(const q of boxes){const B=q.b,m=B.c[0]==='@'?role[B.c.slice(1)]:smat(parseInt(B.c.slice(1),16)),o=b(B.s[0],B.s[1],B.s[2],m,q.lp[0],q.lp[1],q.lp[2],q.part?G[q.part]:g);
    if(B.r)o.rotation.set(B.r[0],B.r[1],B.r[2]);}
  // (no steering part: the wheels it has are all there is; a wheel in the steering part is the front one)
  return{rider:G.rider||null,legs:[G.legL,G.legR].filter(Boolean),body:G.body||null,crank:G.crank||null,blink:G.steerF||t==='moped'?blink:null,clip:V.clip};
}
// the rider's pose at u from his clip (its file, so an edit from the editor's live preview shows at once)
const riderAt=(k,u)=>{const C=k&&ASSETS.clips[k];return C?assetPoseAt(C,u):null;};
// (where each light vehicle is in its rider's clip: a bicycle one turn of the cranks per two of the back wheel, a kick
// scooter through its kick, the Gobway by how far its rider leans, a motor scooter in its one pose)
function riderU(c){const V=c.veh;if(V==='bicycle'){const w=c.wheels[1]?c.wheels[1].rotation.x*0.5:0;return ((w/Math.PI)%2+2)%2;}
  if(V==='kick')return (c.kph??1)<1?c.kph*2:0;if(V==='segway')return 1+Math.max(-1,Math.min(1,c.lean!==undefined&&c.drv?c.lean:(c.wly||0)/0.16));return 1;}
// riding one: each step at the controls, before the throttle. Returns the throttle, top speed and pull for drvCar, and
// spot (true: it turns on the spot) and own (true: it's set its own speed, the Gobway)
function lightDrive(c,i,thr,dt,Hd,top,acc){
  const V=c.veh,p=c.drv,pr=!!i.rdSpecP;let spot=false,own=false;
  if(V==='bicycle'){
    if(c.stam===undefined){c.stam=1;c.cad=0;}
    if(pr&&thr>-0.1){if(c.stam>0.05){c.cad=Math.min(1,c.cad+LV.cadTap);c.stam=Math.max(0,c.stam-0.01);if(audio)sfx('Pedalling hard',()=>noise(0.06,0.012,700,'lowpass'));}}
    c.cad=Math.max(0,c.cad-dt*LV.cadFall);
    const sprint=c.cad>0.05;c.stam=sprint?Math.max(0,c.stam-dt*LV.stamUse*c.cad):Math.min(1,c.stam+dt*LV.stamBack);
    // (sprinting pedals even with the throttle off; the throttle alone is the easy cadence)
    if(sprint)thr=Math.max(thr,c.cad);top*=LV.cruise+(1-LV.cruise)*c.cad;acc*=1+c.cad;
  } else if(V==='kick'){
    c.kickCD=(c.kickCD||0)-dt;
    const on=drvThr(i)>0.4,fresh=on&&!c.kHeld;c.kHeld=on;   // (the throttle as pressed, not eased on: a tap's a kick)
    if(on&&c.grounded&&c.kickCD<=0&&(fresh||(c.kickHold=(c.kickHold||0)+dt)>=LV.kickHold)){
      c.kickHold=0;c.kickCD=LV.kickCD;c.kph=0;c.speed+=LV.kick*Math.max(0,1-Math.max(0,c.speed)/Hd.top);
      if(audio)sfx('Kick',()=>noise(0.08,0.02,900,'bandpass'));}
    if(!on)c.kickHold=LV.kickHold*0.6;   // (held from a standstill, the first kick comes at once; after that, in rhythm)
    if(thr>0)thr=0;
    // (an ollie: let go of the special)
    if(c.hopHeld&&!i.rdSpec&&c.grounded){c.vy=LV.hop;c.grounded=false;c.pos.y+=0.05;if(audio)noise(0.07,0.03,1400,'highpass');}c.hopHeld=!!i.rdSpec;
  } else if(V==='segway'){
    if(c.batt===undefined)c.batt=1;
    const want=Math.max(-0.5,Math.min(1,thr));c.lean=(c.lean||0)+(want-(c.lean||0))*Math.min(1,dt*LV.lean);
    let lim=c.batt<LV.battLow?0.5:1;const v=c.lean*Hd.top*lim;
    // (near the top, the bars push back: it won't go faster, and tells you with a beep)
    c.push=c.lean>LV.pushAt&&Math.abs(c.speed)>Hd.top*lim*0.88;if(c.push){c.beepT=(c.beepT||0)-dt;if(c.beepT<=0){c.beepT=0.45;if(audio)sfx('Gobway pushback beep',()=>tone('square',1650,1650,0.06,0.02));}}
    if(c.grounded)c.speed+=(v-c.speed)*Math.min(1,dt*LV.leanV);
    c.batt=Math.max(0,c.batt-dt*LV.batt*Math.abs(c.speed)/Hd.top);
    c.wly=c.lean*0.16+(v-c.speed)/Hd.top*0.1;   // (it tips as you lean, a little more while it catches up)
    thr=0;spot=true;own=true;
  } else if(V==='moped'){
    if(c.fuel===undefined){c.fuel=1;c.blink=0;}
    if(thr>0.1)c.fuel=Math.max(0,c.fuel-dt*LV.fuel*thr);
    if(c.fuel<=0){top*=LV.fuelLow;if(thr>0.1&&audio&&Math.random()<dt*3)sfx('Scooter splutters',()=>noise(0.1,0.03,300,'lowpass'));}
    acc*=Math.max(0.35,1-Math.pow(Math.max(0,c.speed)/top,2)*0.6);   // (twist and go: no gears, a pull that tails off near the top)
    if(pr){c.blink=c.blink?0:(c.steer>0.15?1:c.steer<-0.15?-1:(i.x>0?1:-1));if(audio)tone('square',1100,1100,0.025,0.025);}
    if(c.blink){c.blinkT=(c.blinkT||0)+dt;if(c.blinkT>0.36){c.blinkT=0;if(audio&&p)tone('square',2200,2200,0.012,0.012);}}
  }
  return{thr,top,acc,spot,own};
}
// its horn: a bicycle's or kick scooter's bell, the Gobway's beep, a scooter's high meep
function lightHorn(c){if(!audio)return;const V=c.veh;
  if(V==='bicycle'||V==='kick')sfx('Bicycle bell',()=>{tone('sine',2600,2580,0.35,0.03);tone('sine',2600,2580,0.35,0.03,0.18);});
  else if(V==='segway')sfx('Gobway beep',()=>tone('square',1300,1300,0.12,0.025));
  else sfx('Scooter horn',()=>{tone('square',720,720,0.22,0.03);tone('square',900,900,0.22,0.02);});}
// how it looks this frame, worked out from how it's moving (so a guest online, who only has its place, sees the same):
// a bicycle's cranks and legs go round with the back wheel; a kick scooter's back leg kicks while it's speeding up; the
// Gobway (whoever's on it) tips with its speeding up and slowing down; a scooter's indicators blink. L: online, the lights
function lightLook(c,dt,L){const G2=c.vehG[c.veh];if(!G2||!G2.lv||dt<=0)return;const lv=G2.lv,V=c.veh;
  const lp=c.lkP||(c.lkP={x:c.pos.x,z:c.pos.z,v:0,a:0}),sp=Math.hypot(c.pos.x-lp.x,c.pos.z-lp.z)/dt,v=sp<40?sp:lp.v;
  lp.a+=((v-lp.v)/dt-lp.a)*Math.min(1,dt*6);lp.v+=(v-lp.v)*Math.min(1,dt*10);lp.x=c.pos.x;lp.z=c.pos.z;
  if(V==='kick'){if(!c.drv&&(c.kph??1)>=1&&lp.a>0.4)c.kph=0;if(c.kph<1)c.kph=Math.min(1,c.kph+dt*2);}   // (a kick takes half a second; one by itself whenever it's picking up speed)
  const P=riderAt(lv.clip,riderU(c));if(P){if(lv.legs[0])lv.legs[0].rotation.x=P[0];if(lv.legs[1])lv.legs[1].rotation.x=P[1];if(lv.body)lv.body.rotation.x=P[2];if(lv.crank)lv.crank.rotation.x=P[3];}
  if(V==='segway'&&!c.drv&&!c.netM)c.wly=Math.max(-0.12,Math.min(0.2,lp.v/9*0.12+lp.a*0.03));
  else if(V==='moped'&&lv.blink){const b=L!==undefined?(L&8?-1:L&16?1:0):c.blink||0,on=b&&Math.floor(performance.now()/360)%2===0;
    lv.blink[0].color.setHex(on&&b<0?0xffa024:0x3a2408);lv.blink[1].color.setHex(on&&b>0?0xffa024:0x3a2408);}
}
// your own goblin on it, posed (after seatPose): the legs going round on a bicycle, a kick, a scooter's feet forward
function lightRider(p,c){if(!lightOf(c))return;const K=gobKit(p),G2=c.vehG[c.veh],P=G2&&G2.lv&&riderAt(G2.lv.clip,riderU(c));if(!P)return;
  K.m.legs[0].rotation.set(P[0],0,0);K.m.legs[1].rotation.set(P[1],0,0);}
// the controls column: what the special and the handbrake do on each
const LIGHT_HOW={bicycle:['rdSpec','pedal hard (tap)','rdHand','back brake','bite','bell'],kick:['fwd','kick (tap)','rdSpec','ollie (let go)','rdHand','brake','bite','bell'],
  segway:['fb','lean forward / back','bite','beep'],moped:['rdSpec','indicators','rdHand','back brake','bite','horn']};
function lightHow(p,D,G){const L=LIGHT_HOW[D.o.veh],A=id=>id==='fb'?actPair(p,'fwd','back'):actMark(p,id);let s='';
  for(let k=0;k<L.length;k+=2)s+=A(L[k])+' '+L[k+1]+'  ·  ';return s+A('rdBehind')+' look behind  ·  '+G;}

// ---- their instruments (INSTRUMENTS, ui/instruments.js). The kick scooter has none ----
// a bicycle computer on the bars: the speed, the cadence, and how much is left in the legs
function inCycle(p,D){const c=D.o,v=Math.max(0,p.spV),cad=Math.round(Math.abs(c.speed)>0.5?(c.cad>0.05?70+c.cad*45:Math.max(0,drvThr(drvIn(p)))>0.1?72:0):0),st=inCl(c.stam??1,0,1);
  let s=`<rect x="0" y="0" width="150" height="74" rx="10" fill="#1d2126" stroke="${IN_INK}" stroke-width="4"/><rect x="8" y="8" width="134" height="46" rx="4" fill="#b9c7a2"/>`;
  s+=inT(100,44,32,v.toFixed(1),'mono','end',0,'#22301c')+inT(104,44,9,'km/h','mono','start',0,'#3c4c34')+inT(16,22,9,cad+' rpm','mono','start',0,'#3c4c34');
  for(let k=0;k<10;k++)s+=`<rect x="${10+k*13}" y="60" width="10" height="7" rx="1" fill="${k/10<st?(st<0.25?IN_TOM:IN_GUS):'rgba(238,240,230,.14)'}"/>`;
  return s;}
// the Gobway's display on its bars: the battery, a bubble that shows how far you're leaning, the speed and a light
// (green riding, yellow pushing back, red with the battery low)
function inGyro(p,D){const c=D.o,b=inCl(c.batt??1,0,1),ln=inCl(c.lean||0,-1,1),v=Math.round(Math.max(0,p.spV)),st=b<LV.battLow?IN_TOM:c.push?IN_YOLK:IN_GUS;
  let s=`<rect x="0" y="0" width="140" height="84" rx="16" fill="#1b2026" stroke="${IN_INK}" stroke-width="4"/>`;
  for(let k=0;k<5;k++)s+=`<rect x="${14+k*14}" y="12" width="11" height="8" rx="2" fill="${k/5<b-0.001?(b<LV.battLow?IN_TOM:'#6ad0ff'):'rgba(238,240,230,.14)'}"/>`;
  s+=`<circle cx="118" cy="16" r="6" fill="${st}"/>`;
  s+=`<path d="M22,62 Q70,40 118,62" fill="none" stroke="rgba(238,240,230,.35)" stroke-width="3" stroke-linecap="round"/><line x1="70" y1="45" x2="70" y2="56" stroke="rgba(238,240,230,.5)" stroke-width="1.5"/>`;
  const x=70+ln*44,y=62-22*(1-Math.pow(ln,2))*0.98;s+=`<circle cx="${inF(x)}" cy="${inF(y-1)}" r="6" fill="${c.push?IN_YOLK:'#6ad0ff'}" stroke="${IN_INK}" stroke-width="1.5"/>`;
  return s+inT(70,80,12,v+' km/h','mono','middle',0,IN_PAPER);}
// a scooter's round speedometer, the fuel gauge set into it, and the indicators' arrows
function inMoped(p,D){const c=D.o,f=inCl(c.fuel??1,0,1),v=Math.max(0,p.spV),on=c.blink&&(c.blinkT||0)<0.18;
  let s=`<circle r="54" fill="${IN_PAPER}" stroke="${IN_INK}" stroke-width="4"/>`;
  s+=inDial({v,max:80,unit:'km/h',ticks:4,labels:[0,20,40,60,80],r:44,fill:false,num:''});
  // (the fuel gauge in the gap at the bottom of the dial, empty on the left)
  s+=`<path d="${inArc(46,212,148)}" fill="none" stroke="rgba(43,27,46,.3)" stroke-width="5"/>${f>0.01?`<path d="${inArc(46,212,212-64*f)}" fill="none" stroke="${f<0.15?IN_TOM:IN_GUS}" stroke-width="5"/>`:''}${inT(-30,50,8,'E','px ink-t','middle',2)}${inT(30,50,8,'F','px ink-t','middle',2)}`;
  for(const s2 of[-1,1])s+=`<path d="M${s2*68},-40 l${-s2*10},8 l${s2*10},8 z" fill="${on&&c.blink===s2?IN_GUS:'rgba(43,27,46,.25)'}" stroke="${IN_INK}" stroke-width="1.5"/>`;
  return s;}
