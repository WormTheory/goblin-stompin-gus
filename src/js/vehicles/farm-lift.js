// ---- the forklift's forks and the tractor's hitch (the vehicle overhaul's step 3) ----
// A forklift (c.fork: {h the forks' height above their lowest in blocks, tilt the mast's in degrees, back positive,
// load what's on them, risk how near it is to tipping, 0 to 1}) raises and lowers its carriage and tilts its mast
// (forkDrive, from drvCar). Raising with something over the forks picks it up: a crate (a CRATE block, taken out of the
// world), a goblin (who sits there flailing) or a light car. Lowering a load on to anything, a ledge or a roof or the
// ground, sets it down there. Driven forward fast with the forks up, they spear goblins and poke props off. A load
// held high in a sharp turn tips the forklift on its side (c.tipR), throwing the driver out; getting back in rights it.
// A tractor (c.farm: {cr the hand throttle's cruise step, 0 off, 1 to 3 low to high, imp 'plough', 'mower' or 'none',
// down whether the hitch is lowered}) holds its cruise speed with nothing pressed (farmDrive). Lowered and moving, the
// plough turns grass to dirt in a strip behind it and flings goblins aside, the mower shreds goblins; both cut
// down flowers; either slows it (FARM.slow). An empty hitch lowered on a hard road scrapes and throws sparks.
// farmLiftPost runs once everything has moved, for every forklift and tractor: their loads carried, their models posed.
const FORK={top:3.4,up:1.1,upLoad:0.65,tilt:6,tiltV:6,lance:2.2,tipLat:4,tipV:1.4,
  // (the forks' reach in front of its middle, along the heading, in blocks, and half their width)
  f0:0.75,f1:1.75,hw:0.55};
const FORK_CARS={car:1200,pickup:1800,bike:200,quad:300,super:1400};   // (light enough to lift, and what each weighs)
const FARM={cruise:[0,0.3,0.6,0.92],slow:0.65,back:2.0,hw:{plough:0.9,mower:1.3,none:0.4}};
function forkState(c){return c.fork||(c.fork={h:0,tilt:0,load:null,risk:0,beepT:0,lanceT:0});}
function farmState(c){return c.farm||(c.farm={cr:0,imp:'plough',down:false,saveT:0,scrapeT:0});}
function farmWorking(c){const F=c.farm;return!!F&&F.down&&F.imp!=='none';}
// (the model's parts, as buildVeh made them for this kind)
function flParts(c){return c.vehG&&c.vehG[c.veh];}
// back to how a fresh one is: the forks down and empty, the hitch up, on its wheels (carSpawn)
function farmReset(c){if(c.fork&&c.fork.load)forkDrop(c,false);c.fork=null;c.farm=null;c.tipR=0;c.tipV=0;c.tipFall=false;
  for(const k of ['forklift','tractor']){const P=c.vehG&&c.vehG[k];if(!P)continue;
    if(P.carr){P.carr.position.y=0;P.inner.position.y=0;P.mast.rotation.x=0;P.crate.visible=false;}
    if(P.imp){P.imp.position.y=0.75*0.8;P.plough.visible=true;P.mower.visible=false;}}}
// the driver's controls each step: raise, lower, tilt; the back-up beeper
function forkDrive(c,i,dt){const F=forkState(c),up=!!i.lfUp,dn=!!i.lfDown;
  if(i.lfTilt){if(up)F.tilt=Math.min(FORK.tilt,F.tilt+FORK.tiltV*dt);if(dn)F.tilt=Math.max(-FORK.tilt,F.tilt-FORK.tiltV*dt);}
  else{const v=F.load?FORK.upLoad:FORK.up;
    if(up){if(!F.load&&F.h<0.5)forkPick(c);F.h=Math.min(FORK.top,F.h+v*dt);}
    if(dn){const lo=forkFloor(c)-forkBase(c);F.h=Math.max(Math.max(0,lo),F.h-v*1.3*dt);if(F.load&&F.h<=Math.max(0,lo)+0.02)forkDrop(c,true);}
    if(F.h>0.02||up)F.liftSnd=(F.liftSnd||0)-dt;
    if((up||dn)&&F.liftSnd<=0&&audio){F.liftSnd=0.22;sfx('Forklift mast',()=>tone('sawtooth',up?95:80,up?110:70,0.2,0.025));}}
  if(c.speed<-0.3){F.beepT-=dt;if(F.beepT<=0){F.beepT=0.7;if(audio)sfx('Reversing beeper',()=>tone('square',1050,1050,0.28,0.03));}}else F.beepT=0;}
// (the forks' height in the world when they're at their lowest, and the middle of them)
function forkBase(c){return c.pos.y+0.17*ES;}
function forkMid(c){const fx=Math.sin(c.heading),fz=Math.cos(c.heading),a=(FORK.f0+FORK.f1)/2;return{x:c.pos.x+fx*a,y:forkBase(c)+(c.fork?c.fork.h:0),z:c.pos.z+fz*a,fx,fz};}
// the highest thing under the forks' tips: lowering stops on it
function forkFloor(c){const M=forkMid(c);let top=-1e9;
  for(const a of [FORK.f0+0.2,FORK.f1-0.1])for(const s of [-FORK.hw*0.6,FORK.hw*0.6]){const x=c.pos.x+M.fx*a+M.fz*s,z=c.pos.z+M.fz*a-M.fx*s;
    for(let y=Math.floor(M.y+0.2);y>=Math.floor(M.y)-6&&y>=0;y--)if(solidAt(x,y,z)){if(y+1>top)top=y+1;break;}}
  return top;}
// raising with nothing on the forks: whatever's over them comes up with them
function forkPick(c){const F=forkState(c),M=forkMid(c);
  // (a crate stood just in front, level with the forks)
  for(let a=FORK.f1+0.15;a>FORK.f0+0.3;a-=0.2){const x=Math.floor(c.pos.x+M.fx*a),y=Math.floor(M.y+0.2),z=Math.floor(c.pos.z+M.fz*a);
    if(get(x,y,z)===CRATE){setRaw(x,y,z,AIR);addEdit(x,y,z,AIR);rebuildSet(new Set([ckey(Math.floor(x/CS),Math.floor(z/CS))]));save();F.load={k:'crate',name:'CRATE',kg:120};return;}}
  // (a goblin stood on them)
  for(const g of goblins){if(g.state!=='chase'||!g.root.visible)continue;const ox=g.pos.x-c.pos.x,oz=g.pos.z-c.pos.z,al=ox*M.fx+oz*M.fz,lat=Math.abs(ox*M.fz-oz*M.fx);
    if(al>FORK.f0-0.1&&al<FORK.f1+0.3&&lat<FORK.hw+0.35&&Math.abs(g.pos.y-M.y)<0.7){F.load={k:'gob',g,name:'GOBLIN',kg:40,al:Math.min(al,FORK.f1-0.3),lat:ox*M.fz-oz*M.fx};g.forkOn=c;
      if(audio)sfx('Goblin picked up on the forks',()=>tone('triangle',700,1100,0.15,0.04));return;}}
  // (a light car whose near end is over the forks)
  for(const o of cars){if(o===c||!o.alive||!o.g.visible||o.drv||o.gnr||!FORK_CARS[o.veh]||o.forkOn)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,al=ox*M.fx+oz*M.fz,lat=ox*M.fz-oz*M.fx;
    if(Math.abs(o.pos.y-c.pos.y)>0.8)continue;const rel=o.heading-c.heading,ext=Math.abs(Math.cos(rel))*o.hz+Math.abs(Math.sin(rel))*o.hx,near=al-ext;
    // (cars bump each other apart, so one nosed up to it is a little way off the forks: it's slid back on to them)
    if(near>c.hz-0.4&&near<FORK.f1+0.7&&Math.abs(lat)<o.hx+0.3){F.load={k:'car',o,name:drvName({k:'car',o}).toUpperCase(),kg:FORK_CARS[o.veh],al:al-Math.max(0,near-(FORK.f1-0.55)),lat,rel};o.forkOn=c;o.speed=0;o.left=true;o.hunter=false;o.path=null;o.rt=null;o.hw=null;
      if(audio)clang();return;}}}
// the load comes off: set down where it is (put true), or thrown off (a tip, a forklift recycled)
function forkDrop(c,put){const F=c.fork,L=F&&F.load;if(!L)return;F.load=null;const M=forkMid(c);
  if(L.k==='crate'){const x=Math.floor(c.pos.x+M.fx*(FORK.f1-0.15)),z=Math.floor(c.pos.z+M.fz*(FORK.f1-0.15));let y=Math.floor(M.y+0.3);   // (under the tips, where lowering stopped)
    while(y>0&&!solidAt(x,y-1,z))y--;if(put&&!solidAt(x,y,z)){setRaw(x,y,z,CRATE);addEdit(x,y,z,CRATE);rebuildSet(new Set([ckey(Math.floor(x/CS),Math.floor(z/CS))]));save();}
    else puff(c.pos.x+M.fx*1.2,M.y+0.4,c.pos.z+M.fz*1.2,6,0xb9874a,0.6);}   // (thrown: it breaks)
  else if(L.k==='gob'){const g=L.g;g.forkOn=null;if(!put){g.kv.x+=M.fx*4;g.kv.z+=M.fz*4;g.vy=4;g.stun=0.6;}}
  else if(L.k==='car'){const o=L.o;o.forkOn=null;o.vy=0;o.grounded=false;}
  if(put&&audio)thud(0.2);}
// the forklift each step, driven or not: its load carried with it, lancing at speed, how tippy it is, and tipping
function forkPost(c,dt){const F=c.fork;if(!F)return;const M=forkMid(c),L=F.load;
  if(L){if(L.k==='gob'){const g=L.g;if(g.state!=='chase'||!g.root.visible||g.forkOn!==c){if(g.forkOn===c)g.forkOn=null;F.load=null;}
      else{g.pos.set(c.pos.x+M.fx*L.al+M.fz*L.lat,M.y+0.07,c.pos.z+M.fz*L.al-M.fx*L.lat);g.vy=0;g.kv.set(0,0,0);g.stun=Math.max(g.stun||0,0.25);g.root.position.copy(g.pos);
        if(g.arm)g.arm.rotation.x=-1.6+Math.sin(playTime*18+g.pos.x)*0.9;}}   // (flailing)
    else if(L.k==='car'){const o=L.o;if(!o.alive||o.forkOn!==c||o.drv){if(o.forkOn===c)o.forkOn=null;F.load=null;}
      else{o.heading=c.heading+L.rel;o.pos.set(c.pos.x+M.fx*L.al+M.fz*L.lat,M.y+0.07,c.pos.z+M.fz*L.al-M.fx*L.lat);o.speed=0;o.vy=0;o.grounded=true;o.kv.set(0,0,0);
        o.g.position.copy(o.pos);o.g.rotation.set(-F.tilt*0.017,o.heading,0);}}}
  // (the forks up and going forward at a fair speed: a lance at that height)
  F.lanceT-=dt;if(F.h>0.6&&c.speed>FORK.lance&&F.lanceT<=0){F.lanceT=0.15;const tx=c.pos.x+M.fx*(FORK.f1+0.1),tz=c.pos.z+M.fz*(FORK.f1+0.1);
    for(const g of goblins){if(g.state!=='chase'||!g.root.visible||g.forkOn)continue;const dx=g.pos.x-tx,dz=g.pos.z-tz;
      if(dx*dx+dz*dz<0.8&&M.y>g.pos.y-0.2&&M.y<g.pos.y+1.6){const d=new V3(M.fx,0.3,M.fz);damageGoblin(g,1,{x:g.pos.x,y:M.y,z:g.pos.z},d,'Speared by a forklift',c.drv||null);g.kv.x+=M.fx*5;g.kv.z+=M.fz*5;g.vy=Math.max(g.vy||0,3);}}
    knockProps(tx,M.y,tz,0.5,M.fx,M.fz);}
  // (how tippy: the load's height against how hard it's turning, plus a little for the height and the weight alone)
  const hf=F.h/FORK.top,lf=L?Math.min(1,L.kg/1500):0,yr=Math.abs(angDiff(c.heading,F.lastH===undefined?c.heading:F.lastH))/Math.max(dt,1e-3),lat=Math.abs(c.speed)*yr;F.lastH=c.heading;
  const r=Math.min(1,0.18*hf+0.08*lf+lat*(hf+0.25*lf)/FORK.tipLat);F.risk+=(r-F.risk)*Math.min(1,dt*8);
  if(!c.tipR&&r>=1&&hf>0.3&&Math.abs(c.speed)>FORK.tipV)forkTip(c,Math.sign(angDiff(c.heading,F.lastH0===undefined?c.heading:F.lastH0))||1);F.lastH0=c.heading;}
// over it goes, toward the outside of the turn: the load thrown, the driver too
function forkTip(c,side){c.tipV=side*0.01;c.tipR=side*0.06;c.tipFall=true;const F=c.fork;F.risk=1;forkDrop(c,false);c.speed*=0.3;
  const p=c.drv;if(p){drvExit(p);p.vy=5;p.grounded=false;flashLabel('The forklift tipped over!',p);}if(audio){thud(0.6);clang();}}
// on its side (falling, then lying there), or rocked back on to its wheels once someone's got back in
function tipPost(c,dt){if(!c.tipR)return;const s=Math.sign(c.tipR);if(c.drv)c.tipFall=false;
  if(c.tipFall){if(Math.abs(c.tipR)<Math.PI/2){c.tipV+=s*dt*7;c.tipR+=c.tipV*dt;if(Math.abs(c.tipR)>=Math.PI/2){c.tipR=s*Math.PI/2;c.tipV=0;puff(c.pos.x,c.pos.y+0.3,c.pos.z,8,0x9a948a,0.8);if(audio)thud(0.5);}}}
  else{c.tipR-=s*Math.min(Math.abs(c.tipR),dt*2.2);if(Math.abs(c.tipR)<0.01){c.tipR=0;if(c.fork)c.fork.risk=0;}}
  c.g.position.y+=Math.abs(Math.sin(c.tipR))*c.hx;}   // (lying on its side, not half sunk in the ground)
// the forklift's turning point is its front axle, so its tail swings out (drvCar has already turned it about its middle)
function forkPivot(c,dh){const a=0.3*ES,fx=Math.sin(c.heading),fz=Math.cos(c.heading),px=Math.sin(c.heading-dh),pz=Math.cos(c.heading-dh);
  nudgeFlat(c,(px-fx)*a,(pz-fz)*a);}
// the tractor's controls each step: the hand throttle's steps, the implement, and the throttle that comes of them
function farmDrive(c,i,thr,top){const F=farmState(c);
  if(i.fmCruiseP){F.cr=Math.min(3,F.cr+1);if(audio)tone('square',500+F.cr*120,500+F.cr*120,0.05,0.03);}
  if(i.fmCruiseDnP){F.cr=Math.max(0,F.cr-1);if(audio)tone('square',500+F.cr*120,500+F.cr*120,0.05,0.03);}
  if(i.fmImpP){F.down=!F.down;if(audio)sfx('Tractor hitch',()=>tone('sawtooth',F.down?140:90,F.down?70:150,0.25,0.03));}
  if(i.fmSwapP){F.imp={plough:'mower',mower:'none',none:'plough'}[F.imp];flashLabel(F.imp==='none'?'Nothing on the hitch':'The '+F.imp+' on the hitch',c.drv);}
  if(thr<-0.1)F.cr=0;   // (the brake knocks the hand throttle off)
  if(Math.abs(thr)<0.1&&F.cr>0){const want=FARM.cruise[F.cr]*top*(farmWorking(c)?FARM.slow:1);thr=Math.max(-0.4,Math.min(1,(want-c.speed)*0.8));}
  return thr;}
// the hitch at work behind it: ploughing, mowing, or a bare hitch scraping the road
function farmPost(c,dt){const F=c.farm;if(!F)return;
  F.saveT-=dt;if(F.dirty&&F.saveT<=0){F.dirty=false;F.saveT=1;save();}
  if(!F.down||!c.grounded||Math.abs(c.speed)<0.4)return;
  const fx=Math.sin(c.heading),fz=Math.cos(c.heading),bx=c.pos.x-fx*FARM.back,bz=c.pos.z-fz*FARM.back,y=Math.floor(c.pos.y-0.5),hw=FARM.hw[F.imp];
  if(F.imp==='none'){const b=get(Math.floor(bx),y,Math.floor(bz));F.scrapeT-=dt;
    if(b!==GRASS&&b!==DIRT&&b!==SAND&&b!==FIELD&&b!==FIELD_L&&F.scrapeT<=0){F.scrapeT=0.08;puff(bx,c.pos.y+0.05,bz,2,0xffb040,0.25);if(audio)sfx('Hitch scraping the road',()=>tone('sawtooth',1800+Math.random()*700,900,0.07,0.02));}
    return;}
  // (the strip behind it, a block at a time across)
  const ch=new Set();
  for(let s=-hw;s<=hw+0.01;s+=0.5){const x=Math.floor(bx+fz*s),z=Math.floor(bz-fx*s);
    // (flowers, cut down or turned under; grass, and a sports pitch, ploughed to dirt)
    if(get(x,y+1,z)===FLOWER){setRaw(x,y+1,z,AIR);addEdit(x,y+1,z,AIR);ch.add(ckey(Math.floor(x/CS),Math.floor(z/CS)));puff(x+0.5,y+1.2,z+0.5,2,F.imp==='mower'?0x5a9a3a:0x6e5a42,0.3);}
    const b=get(x,y,z);if(F.imp==='plough'&&(b===GRASS||b===FIELD||b===FIELD_L)){setRaw(x,y,z,DIRT);addEdit(x,y,z,DIRT);ch.add(ckey(Math.floor(x/CS),Math.floor(z/CS)));}}
  if(ch.size){rebuildSet(ch);F.dirty=true;}
  // (goblins in its way behind: the plough throws them aside, the mower doesn't let them go)
  for(const g of goblins){if(g.state!=='chase'||!g.root.visible||g.forkOn)continue;const ox=g.pos.x-bx,oz=g.pos.z-bz,al=ox*fx+oz*fz,lat=ox*fz-oz*fx;
    if(Math.abs(al)>0.9||Math.abs(lat)>hw+0.4||Math.abs(g.pos.y-c.pos.y)>1.2)continue;const pt={x:g.pos.x,y:g.pos.y+0.6,z:g.pos.z},by=c.drv||null;
    if(F.imp==='plough'){if(g.ploughT>playTime-0.6)continue;g.ploughT=playTime;const sd=lat<0?-1:1;damageGoblin(g,1,pt,new V3(fz*sd,0.5,-fx*sd),'Ploughed under',by);
      g.kv.x+=fz*sd*7;g.kv.z+=-fx*sd*7;g.vy=Math.max(g.vy||0,5);g.stun=Math.max(g.stun||0,0.7);}
    else{damageGoblin(g,99,pt,new V3(-fx,0.6,-fz),'Mown down',by);blood(pt.x,pt.y,pt.z,20,new V3(-fx*2,1,-fz*2));}}}
// once everything's moved: every forklift and tractor about, their loads and implements, and their models to match
function farmLiftPost(dt){for(const c of cars){if(!c.alive||!c.g.visible)continue;const V=c.veh;
  if(V!=='forklift'&&V!=='tractor'){if(c.tipR){c.tipR=0;c.tipV=0;}continue;}
  if(V==='forklift'){forkPost(c,dt);tipPost(c,dt);const F=c.fork,P=flParts(c);if(F&&P&&P.carr){const k=1/ES;P.carr.position.y=F.h*k;P.inner.position.y=F.h*k*0.5;P.mast.rotation.x=-F.tilt*Math.PI/180;P.crate.visible=!!(F.load&&F.load.k==='crate');}}
  else{farmPost(c,dt);const F=c.farm,P=flParts(c);if(F&&P&&P.imp){const K=0.8,want=F.down?0.35*K:0.75*K;P.imp.position.y+=(want-P.imp.position.y)*Math.min(1,dt*6);P.plough.visible=F.imp==='plough';P.mower.visible=F.imp==='mower';}}}}
// their lines in the controls column (drvHow): the forks, or the hand throttle and the hitch
function carHow(p,D,armed,G){const A=id=>actMark(p,id),V=D.o.veh;
  if(V==='forklift')return A('lfUp')+'/'+A('lfDown')+' forks up/down  ·  '+A('lfTilt')+' + up/down tilt the mast  ·  '+G;
  if(V==='tractor'){const F=D.o.farm||{imp:'plough',down:false},w=F.imp==='none'?'hitch':F.imp;
    return A('fmCruise')+'/'+A('fmCruiseDn')+' hand throttle  ·  '+A('fmImp')+(F.down?' raise the ':' lower the ')+w+'  ·  '+A('fmSwap')+' swap implement  ·  '+G;}
  return G;}
