// ---- road vehicles as you drive them (the vehicle overhaul's step 4) ----
// A driven car's velocity isn't tied to where it points: c.hvel is the way it's really going, which comes round to its
// heading as fast as its tyres grip (roadSlip; HANDLING's grip, less on grass, sand, snow and ice). The handbrake
// (Space, RB: rdHand) locks the back wheels, so it slides and slows; held through a turn above ROAD.dMin it's a drift
// (c.drift: on, ch the charge, 0 to 1 in three stages), and letting go fires a boost of ROAD.boost[stage] seconds
// (c.boostT). Heavy vehicles (HANDLING drift:false) only slide. On the keyboard the throttle comes on over a moment
// rather than at once (c.kThr). In the air, A/D turns it and W/S tips its nose. Each kind's own special (right click,
// LB: rdSpec) is in roadSpecial: a car flashes its headlights, a supercar burns nitro (c.nitro, refilled by drifting;
// with the handbrake on and the throttle down at a standstill it's launch control, c.launch), a motorcycle pulls a
// wheelie or a stoppie (c.wly), a four-wheeler or technical hops, a van flicks its hazard lights, a truck, lorry or bus
// works its air brakes, and a police car, ambulance or fire engine turns its siren on (c.siren), which traffic pulls
// over for (sirenYield). C (rdBehind) looks behind (drvCamera).
const ROAD={dMin:6.9,dRate:0.4,boost:[0.5,1.2,2],boostTop:1.3,boostAcc:20,ramp:3.2,nitro:0.35,hop:7,flash:22};
const ROAD_SIREN={amb:1,fire:1};
function roadKind(c){const V=c.veh;return c.police?'siren':ROAD_SIREN[V]?'siren':V==='super'?'nitro':V==='bike'?'wheelie':V==='kick'?'none':V==='bicycle'?'none':V==='moped'?'none':V==='kick'?'none':V==='bicycle'?'none':V==='moped'?'none':V==='quad'||V==='technical'?'hop':
  V==='truck'||V==='semi'||V==='bus'?'air':V==='van'||V==='pickup'||V==='news'||V==='rv'?'hazard':'flash';}
// each step at the wheel, before it's turned and moved: what the throttle, top speed, pull and turn come to
function roadDrive(c,i,thr,dt,Hd,top,acc){
  const p=c.drv,D=c.drift||(c.drift={on:false,ch:0,sparkT:0}),hb=!!i.rdHand,air=!c.grounded;
  // (the keyboard's throttle comes on over a moment, and goes off quicker; a controller's triggers are already analog)
  if(!(p&&p.pad)){const k=Math.abs(thr)>Math.abs(c.kThr||0)?ROAD.ramp:ROAD.ramp*2;c.kThr=(c.kThr||0)+Math.max(-k*dt,Math.min(k*dt,thr-(c.kThr||0)));thr=c.kThr;}
  let yaw=1;c.hand=hb;
  // (launch control, a supercar's: handbrake on and the throttle down at a standstill, then let the handbrake go)
  if(c.veh==='super'&&Math.abs(c.speed)<0.6&&hb&&thr>0.5){c.launch=Math.min(1,(c.launch||0)+dt*1.2);c.speed=0;thr=0;
    if(audio&&Math.random()<dt*8)tone('sawtooth',120+c.launch*260,140+c.launch*260,0.08,0.025);return{thr,top,acc,yaw,grip:1};}
  if(c.launch&&!hb){if(c.launch>0.9){c.speed=Math.max(c.speed,top*0.3);c.boostT=Math.max(c.boostT||0,1);if(p)flashLabel('Perfect launch',p);}c.launch=0;}
  else if(!hb)c.launch=0;
  // (the drift: the handbrake held through a turn at speed; the charge builds while it lasts)
  const drifts=Hd.drift!==false,fast=Math.abs(c.speed)>ROAD.dMin;
  if(!D.on&&hb&&drifts&&fast&&Math.abs(c.steer)>0.25&&!air){D.on=true;D.ch=0;}
  if(D.on&&(!hb||Math.abs(c.speed)<4||air)){
    const st=Math.min(3,Math.floor(D.ch*3+1e-6));if(st>0&&!air){c.boostT=Math.max(c.boostT||0,ROAD.boost[st-1]);c.boostSt=st;if(audio)sfx('Drift boost',()=>{tone('sawtooth',220,520+st*80,0.35,0.05);noise(0.3,0.04,1800,'highpass');});}
    D.on=false;D.ch=0;}
  let grip=1;
  if(D.on){D.ch=Math.min(1,D.ch+dt*ROAD.dRate*(Hd.dchg||1));c.speed*=Math.exp(-dt*0.18);yaw=1.6;grip=0.12;
    if(c.veh==='super')c.nitro=Math.min(1,(c.nitro??1)+dt*0.3);   // (drifting fills the nitro)
    D.sparkT-=dt;if(D.sparkT<=0){D.sparkT=0.05;const st=Math.min(2,Math.floor(D.ch*3)),col=[0xffd447,0xffa03a,0xe0564a][st],fx=Math.sin(c.heading),fz=Math.cos(c.heading),rx=Math.cos(c.heading),rz=-Math.sin(c.heading);
      for(const s of [-1,1])puff(c.pos.x-fx*c.hz*0.8+rx*s*c.hx*0.8,c.pos.y+0.05,c.pos.z-fz*c.hz*0.8+rz*s*c.hx*0.8,1,D.ch>=1/3?col:0x9a948a,0.25);
      if(audio&&Math.random()<0.4)sfx('Tyres screeching',()=>noise(0.12,0.025,2600,'bandpass'));}}
  else if(hb){grip=0.15;yaw=1.3;if(c.speed>0)c.speed=Math.max(0,c.speed-Hd.brk*0.45*dt);else c.speed=Math.min(0,c.speed+Hd.brk*0.45*dt);if(thr>0)thr=0;}
  // (a boost from a drift, or nitro: pulls harder, and higher)
  if(c.boostT>0){c.boostT-=dt;top*=ROAD.boostTop;acc+=ROAD.boostAcc;if(thr<0.6)thr=Math.max(thr,0.6);if(Math.random()<dt*20){const fx=Math.sin(c.heading),fz=Math.cos(c.heading);puff(c.pos.x-fx*(c.hz+0.2),c.pos.y+0.5,c.pos.z-fz*(c.hz+0.2),1,0xffa03a,0.2);}}
  roadSpecial(c,i,dt,thr);
  if(c.nitroOn){top*=ROAD.boostTop;acc+=ROAD.boostAcc;thr=Math.max(thr,0.8);}
  if(c.airBrake){c.speed*=Math.exp(-dt*2.5);thr=Math.min(thr,0);}
  // (in the air: A/D still turns it, W/S tips its nose, so a jump can be straightened up before it lands)
  if(air){c.spinP+=-thr*dt*5;thr=0;yaw=0.8;}
  return{thr,top,acc,yaw,grip};}
// the kind's own special: right click (LB)
function roadSpecial(c,i,dt,thr){const k=roadKind(c),pr=!!i.rdSpecP,h=!!i.rdSpec,p=c.drv;c.nitroOn=false;c.airBrake=false;
  if(k==='nitro'){c.nitro=Math.min(1,(c.nitro??1)+dt*0.02);if(h&&c.nitro>0){c.nitro=Math.max(0,c.nitro-dt*ROAD.nitro);c.nitroOn=true;if(audio&&Math.random()<dt*6)sfx('Nitro',()=>noise(0.15,0.035,900,'lowpass'));}}
  else if(k==='wheelie'){const want=h&&c.grounded?(thr>0.1?-0.42:c.speed>2?0.3:0):0;c.wly=(c.wly||0)+(want-(c.wly||0))*Math.min(1,dt*5);if(h&&want>0)c.speed=Math.max(0,c.speed-18*dt);}
  else if(k==='hop'){if(c.hopHeld&&!h&&c.grounded){c.vy=ROAD.hop;c.grounded=false;c.pos.y+=0.05;if(audio)thud(0.15);}c.hopHeld=h;}
  else if(k==='air'){if(h&&Math.abs(c.speed)>0.3){c.airBrake=true;if(pr&&audio)sfx('Air brakes',()=>noise(0.6,0.06,3500,'highpass'));}}
  else if(k==='hazard'){if(pr){c.hazard=!c.hazard;c.hazG.visible=c.hazard;if(audio)tone('square',900,900,0.04,0.03);}}
  else if(k==='siren'){if(pr){c.siren=!c.siren;if(p)flashLabel(c.siren?'Siren on: traffic pulls over':'Siren off',p);}}
  else if(k==='flash'){if(pr){c.flashT=0.35;if(audio)tone('square',1500,1500,0.03,0.03);const fx=Math.sin(c.heading),fz=Math.cos(c.heading);
    // (goblins in the beams, ahead and near: dazzled a moment)
    for(const g of goblins){if(g.state!=='chase'||!g.root.visible)continue;const ox=g.pos.x-c.pos.x,oz=g.pos.z-c.pos.z,al=ox*fx+oz*fz;if(al<1||al>ROAD.flash||Math.abs(ox*fz-oz*fx)>2+al*0.3)continue;g.stun=Math.max(g.stun||0,0.8);}}}
  if(c.flashT>0)c.flashT-=dt;
  // (a siren going: its two notes, and the lights)
  if(c.siren){c.sirenT=(c.sirenT||0)-dt;if(c.sirenT<=0){c.sirenT=0.5;const hi=(c.sirenN=(c.sirenN||0)+1)%2;if(audio)sfx('Siren',()=>tone('triangle',hi?960:720,hi?960:720,0.45,0.035));}}}
// the slide: where it's really going comes round to where it points as fast as the tyres grip (k a share of that)
function roadGrip(c,Hd){let g=Hd.grip||9;const b=get(Math.floor(c.pos.x),Math.floor(c.pos.y-0.5),Math.floor(c.pos.z));
  if(b===GRASS||b===DIRT||b===FIELD||b===FIELD_L||b===GRAVEL||b===FLOWER)g*=Hd.off||0.6;else if(b===SAND)g*=(Hd.off||0.6)*0.75;else if(b===ICE)g*=0.2;
  if(WX.snowCover>0.3&&c.snowOpen)g*=0.6;return g;}
function roadSlip(c,dt,Hd,k){const vx=Math.sin(c.heading)*c.speed,vz=Math.cos(c.heading)*c.speed;if(!c.hvel)c.hvel={x:vx,z:vz};const H=c.hvel;
  // (turned all at once, more than any steering could in a step, crossing into a ship's frame say: the slide turns with it)
  if(c.slipH!==undefined){const j=angDiff(c.slipH,c.heading);if(Math.abs(j)>0.3){const cs=Math.cos(j),sn=Math.sin(j),x=H.x;H.x=x*cs+H.z*sn;H.z=-x*sn+H.z*cs;}}c.slipH=c.heading;
  if(c.grounded){const r=Math.min(1,dt*roadGrip(c,Hd)*k);H.x+=(vx-H.x)*r;H.z+=(vz-H.z)*r;}
  const sx=(H.x-vx)*dt,sz=(H.z-vz)*dt;if(Math.abs(sx)+Math.abs(sz)>1e-4){const x0=c.pos.x,z0=c.pos.z;nudgeFlat(c,sx,sz);if(c.pos.x===x0&&c.pos.z===z0){H.x=vx;H.z=vz;}}}
// a car going about its own business: is a player's siren coming up behind it? (updateCars pulls it over, as for a
// service vehicle on a call)
function sirenYield(c){for(const q of players){const D=q.drv;if(!D||D.k!=='car'||!D.o.siren||D.o===c)continue;const sv=D.o,ox=sv.pos.x-c.pos.x,oz=sv.pos.z-c.pos.z;if(Math.abs(ox)+Math.abs(oz)>40)continue;
  const vs=Math.sin(sv.heading),vc=Math.cos(sv.heading),along=-(ox*vs+oz*vc),lat=Math.abs(ox*vc-oz*vs);if(along>0&&along<30&&lat<4.5)return true;}return false;}
// the controls column's lines for a road vehicle: the handbrake and its special
const ROAD_SPEC={flash:'flash headlights',nitro:'nitro (hold)',wheelie:'wheelie / stoppie (hold)',hop:'hop (let go)',air:'air brakes (hold)',hazard:'hazard lights'};
function roadHow(p,D,G){const A=id=>actMark(p,id),c=D.o,k=roadKind(c),sp=k==='siren'?(c.siren?'siren off':'siren on'):ROAD_SPEC[k];
  return A('rdHand')+(handOf(c.veh||'car').drift===false?' handbrake':' handbrake / drift')+'  ·  '+A('rdSpec')+' '+sp+'  ·  '+A('rdBehind')+' look behind  ·  '+G;}
