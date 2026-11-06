// ---- who's about, by the time of day ----
// The day runs dawn (6am) round to dawn: daytime is 6am to about 8pm, night the rest. The streets are busy from
// morning to evening and nearly empty in the small hours; homes fill up in the evening and stay full overnight;
// shops, offices and restaurants fill during their opening hours (a skeleton staff after); gas stations, hospitals,
// police and fire stations are manned round the clock.
const hourNow=()=>(6+tod*24)%24;
function tabAt(T,h){for(let i=0;i<T.length;i++){const [h0,v0]=T[i],[h1,v1]=T[(i+1)%T.length],span=((h1-h0)+24)%24||24,d=((h-h0)+24)%24;if(d<=span)return v0+(v1-v0)*d/span;}return T[0][1];}
const STREET_T=[[0,0.15],[5,0.15],[7,0.6],[9,1],[19,1],[21,0.55],[23,0.25]],HOME_T=[[0,1],[6,0.9],[8,0.45],[10,0.3],[17,0.45],[19,0.8],[21,1]];
const streetBusy=()=>tabAt(STREET_T,hourNow());
// open from a to b (o'clock), ramping up and down over an hour either side; closed, a skeleton staff
const openAt=(h,a,b)=>{const up=Math.max(0,Math.min(1,h-a+1)),dn=Math.max(0,Math.min(1,b-h+1));return 0.08+0.92*Math.min(up,dn);};
function occOf(b){
  const h=hourNow(),c=b.signCat||'';
  if(b.decay)return 0.04;   // (the odd squatter)
  if(c==='kiosk'||c==='gas'||c==='hospital'||c==='police'||c==='fire'||b.kind==='ward'||b.kind==='police')return 0.9;
  if(b.style==='house'||b.kind==='apartment'&&!c)return tabAt(HOME_T,h);
  if(c==='cafe')return openAt(h,6,17);
  if(c==='bar')return openAt(h<8?h+24:h,16,26);   // (afternoon till 2 in the morning)
  if(c==='soup')return tabAt([[0,0.05],[7,0.15],[8,0.95],[9.5,0.35],[11.5,0.4],[12.5,1],[14,0.3],[17,0.35],[18,1],[19.5,0.3],[21,0.05]],h);
  if(c==='dentist')return openAt(h,8,17);
  if(c==='library')return openAt(h,9,20);
  if(c==='ikea')return openAt(h,10,21);
  if(c==='campus')return 0.3+0.6*openAt(h,8,22);
  if(c==='zoo')return openAt(h,9,18);
  if(c==='prison'||c==='jail'||c==='power'||c==='water'||c==='lab')return 0.75;
  if(b.kind==='cells')return 0.85;
  if(b.kind==='lecture')return openAt(h,8,18);
  if(c==='museum'||c==='aquarium')return openAt(h,9,18);
  if(c==='casino')return 0.6+0.4*openAt(h<6?h+24:h,18,28);
  if(c==='school')return openAt(h,7.5,15.5);
  if(c==='factory')return 0.4+0.5*openAt(h,6,22);
  if(c==='dealer'||c==='nursery')return openAt(h,9,19);
  if(c==='theater')return openAt(h,17,23);
  if(c==='stocks')return openAt(h,9,16);
  if(c==='armory')return openAt(h,8,18);
  if(c==='cinema')return openAt(h,12,24);
  if(c==='bank')return openAt(h,9,17);
  if(c==='radio'||c==='news')return 0.6+0.3*tabAt(STREET_T,h);
  if(c==='disco'||c==='club')return openAt(h<10?h+24:h,21,28);
  if(b.kind==='church')return 0.15+0.5*openAt(h,8,12);
  if(b.kind==='landmark')return 0;
  if(c==='sitdown'||c==='fastfood'||c==='pizza'||c==='diner'||c==='food')return openAt(h,10,23);
  if(b.kind==='office'||c==='office')return openAt(h,8,18);
  if(c==='garage')return 0.25+0.5*tabAt(STREET_T,h);
  if(c||b.kind==='shop'||b.kind==='grocery'||b.kind==='bigbox')return openAt(h,9,21);
  return 0.3+0.4*tabAt(STREET_T,h);
}
// how many staff a business has on right now (24-hour places always keep at least one)
const staffCapNow=b=>{const cap=STAFF_CAP[b.signCat]||0;if(!cap)return 0;const o=occOf(b);return Math.max(o>=0.85?1:0,Math.round(cap*o));};
function staffAt(key){let n=0;for(const o of goblins)if(o.staff&&o.state==='chase'&&o.employer&&o.employer.key===key)n++;return n;}
function spawnStaff(g){
  const al=players.filter(p=>p.active);if(!al.length)return false;
  const c=al[Math.floor(Math.random()*al.length)],R=55,cand=[],seen=new Set();
  for(let px=Math.floor((c.pos.x-R)/CELL);px<=Math.floor((c.pos.x+R)/CELL);px++)for(let pz=Math.floor((c.pos.z-R)/CELL);pz<=Math.floor((c.pos.z+R)/CELL);pz++){
    if(!tenvShow(px,pz))continue;let qx=px,qz=pz;const S=superOf(px,pz);if(S){qx=S.ax;qz=S.az;}
    const k0=qx+','+qz;if(seen.has(k0))continue;seen.add(k0);
    plotInfo(qx,qz).b.forEach((b,bi)=>{const cap=b.brand&&staffCapNow(b);if(!cap)return;const key=k0+','+bi;if(staffAt(key)<cap&&bldgStanding(b,qx,qz,key))cand.push({b,bi,key,ax:qx*CELL,az:qz*CELL});});
  }
  if(!cand.length)return false;
  const E=cand[Math.floor(Math.random()*cand.length)],b=E.b;
  // somewhere free on the ground floor, inside the walls
  let pos=null;
  for(let k=0;k<30&&!pos;k++){
    const x=E.ax+b.x0+2+Math.floor(Math.random()*Math.max(1,b.x1-b.x0-4)),z=E.az+b.z0+2+Math.floor(Math.random()*Math.max(1,b.z1-b.z0-4));
    if(Math.hypot(x-c.pos.x,z-c.pos.z)<12)continue;
    if(get(x,G+1,z)===AIR&&get(x,G+2,z)===AIR&&solidAt(x,G,z))pos=new V3(x+.5,G+1,z+.5);
  }
  if(!pos)return false;
  g.vendor=null;g.indoor=true;g.employer={key:E.key,b,ax:E.ax,az:E.az};
  g.pos.copy(pos);g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=Math.random()*3;g.screamCD=0;g.fleeing=false;g.detour=0;
  g.heading=Math.random()*6.28;g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=0;g.armL.rotation.x=0;
  // dressed as anyone, then put in uniform
  const L=dressGoblin(g),U=uniformOf(b.brand,b.signCat);
  L.tunic=U.shirt;L.pants=U.pants;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','pouch','apron'].includes(k));
  L.hatType=U.hatType;if(U.hatType!=='none'){L.hat=U.hat;L.show.push(U.hatType);}
  if(U.apron!=null){L.acc=U.apron;L.show.push('apron');}
  L.hatShown=U.hatType==='none'?L.skin:L.hat;applyLook(g,L,ES);
  g.id=makeIdentity(g,L);{const J=STAFF_JOBS_BY[b.brand.n]||STAFF_JOBS[b.signCat];g.id.occ=J[Math.floor(Math.random()*J.length)]+' at Goblin '+brandName(b.brand);}
  return true;
}
function findSidewalk(cx,cz,rMin,rMax){for(let k=0;k<60;k++){const a=Math.random()*Math.PI*2,r=rMin+Math.random()*(rMax-rMin),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,s=surfaceAt(x,z);if(s.y===G+1&&s.b===SIDEWALK||s.b===GRASS&&biomeOf(Math.floor(x/CELL),Math.floor(z/CELL))==='plains')return new V3(Math.floor(x)+.5,s.y,Math.floor(z)+.5);}return null;}
function freeStall(x,z){
  const out=[];
  for(let px=Math.floor((x-45)/CELL);px<=Math.floor((x+45)/CELL);px++)for(let pz=Math.floor((z-45)/CELL);pz<=Math.floor((z+45)/CELL);pz++){
    if(!plotInfo(px,pz).stall)continue;
    const sx=px*CELL+ROADW+1.5,sz=pz*CELL+STZ+0.5,d=Math.hypot(sx-x,sz-z);
    if(d<14||d>45||get(px*CELL+ROADW,G+1,pz*CELL+STZ)!==CRATE)continue;
    if(goblins.some(o=>o.civ&&o.state==='chase'&&o.vendor&&o.vendor.x===sx&&o.vendor.z===sz))continue;
    out.push({x:sx,z:sz});
  }
  return out.length?out[Math.floor(Math.random()*out.length)]:null;
}
// somewhere inside a building near (cx,cz): a random storey's floor, in the open, with headroom
function findIndoor(cx,cz,rMin,rMax,wf){
  for(let k=0;k<40;k++){
    const a=Math.random()*6.283,rr=rMin+Math.random()*(rMax-rMin),x=Math.floor(cx+Math.cos(a)*rr),z=Math.floor(cz+Math.sin(a)*rr);
    const B=bldgAt(x,z);if(!B)continue;const b=B.b;if(b.noIndoor)continue;if(wf&&Math.random()>wf(b))continue;   // (wf: how likely anyone's in a building like this right now)
    const cap=collapses[B.key],hi=Math.min(b.detailTop,b.top-1,cap!==undefined?cap-1:1e9)-2;
    const lv=[];for(let y=G+1;y<=hi;y++){flo(b,y-G);if(FL_LVL===0)lv.push(y);}
    if(!lv.length)continue;
    const fy=lv[Math.floor(Math.random()*lv.length)];
    if(get(x,fy,z)!==AIR||get(x,fy+1,z)!==AIR||!solidAt(x,fy-1,z))continue;
    // not out on the facade or a balcony: walls on at least two sides within a few blocks
    let walls=0;for(const [vx,vz] of DIRV){for(let s=1;s<=6;s++)if(solidAt(x+vx*s,fy+1,z+vz*s)){walls++;break;}}
    if(walls<3)continue;
    return new V3(x+.5,fy,z+.5);
  }
  return null;
}
function indoorWander(g){
  const E=g.employer;
  for(let k=0;k<12;k++){const x=Math.floor(g.pos.x+(Math.random()-.5)*8),z=Math.floor(g.pos.z+(Math.random()-.5)*8),y=Math.floor(g.pos.y);
    if(E&&(x<E.ax+E.b.x0+1||x>=E.ax+E.b.x1-1||z<E.az+E.b.z0+1||z>=E.az+E.b.z1-1))continue;   // staff keep to their own shop floor
    if(get(x,y,z)===AIR&&get(x,y+1,z)===AIR&&solidAt(x,y-1,z)&&bldgAt(x,z)&&!propCells.has(propCK(x,y,z)))return{x:x+.5,z:z+.5};}
  return null;
}
function spawnCiv(g){
  const al=players.filter(p=>p.active);if(!al.length)return false;
  const c=al[Math.floor(Math.random()*al.length)];
  let pos=null;g.vendor=null;
  const sb=streetBusy();
  if(Math.random()<0.45*sb){const s=freeStall(c.pos.x,c.pos.z);if(s){pos=new V3(s.x,G+1,s.z);g.vendor=s;}}   // (stalls are a daytime thing)
  // some are at home or at work, inside the buildings -- more of them indoors as the streets empty at night, and in
  // whichever buildings people would be in at this hour
  g.indoor=false;
  if(!pos&&Math.random()<0.4+0.5*(1-sb)){pos=findIndoor(c.pos.x,c.pos.z,10,36,occOf);if(pos)g.indoor=true;}
  if(!pos)pos=findSidewalk(c.pos.x,c.pos.z,18,40);
  if(!pos||!spawnOK(pos.x,pos.z))return false;
  g.pos.copy(pos);g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=0;g.screamCD=0;g.fleeing=false;g.detour=0;
  g.heading=g.vendor?-Math.PI/2:Math.random()*6.28;g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=0;g.armL.rotation.x=0;
  g.id=makeIdentity(g,dressGoblin(g));if(g.vendor)g.id.occ='Street vendor';
  return true;
}
function squeal(d){const att=Math.max(0.08,1-d/28);tone('sawtooth',950+Math.random()*350,1500+Math.random()*300,0.2,0.045*att);tone('sine',1300,900,0.22,0.03*att,0.05);}
function civAI(g,dt){
  if(!playing||g.stun>0)return false;
  const thr=jackFear(g,dt)||(passiveNow()?null:nearestPlayer(g.pos.x,g.pos.z,true));   // (with hostility at Passive, nothing to run from -- unless it's just been thrown out of its car)
  let speed=0,want=g.heading;
  if(thr&&thr.d<(g.vendor?9:14)){
    // a hippo! run, screaming
    g.vendor=null;g.fleeing=true;
    want=Math.atan2(g.pos.x-thr.p.pos.x,g.pos.z-thr.p.pos.z);speed=3.8;
    g.screamCD-=dt;if(g.screamCD<=0){g.screamCD=1.4+Math.random()*2.2;squeal(thr.d);}
  } else {
    g.fleeing=false;
    if(g.vendor){
      g.heading+=(-Math.PI/2-g.heading)*Math.min(1,dt*4);
      g.pos.x+=(g.vendor.x-g.pos.x)*Math.min(1,dt*3);g.pos.z+=(g.vendor.z-g.pos.z)*Math.min(1,dt*3);
      g.arm.rotation.x=-0.5+Math.sin(g.t*3)*0.3;g.armL.rotation.x=-0.3;
      return false;
    }
    g.wtT-=dt;
    if(!g.wt||g.wtT<=0||Math.hypot(g.wt.x-g.pos.x,g.wt.z-g.pos.z)<0.8){g.wt=g.indoor?indoorWander(g):findSidewalk(g.pos.x,g.pos.z,3,10);g.wtT=7+Math.random()*4;g.idle=g.employer?(Math.random()<0.6?2+Math.random()*5:0):Math.random()<0.35?1+Math.random()*2.5:0;}
    if(g.idle>0)g.idle-=dt;
    else if(g.wt){want=Math.atan2(g.wt.x-g.pos.x,g.wt.z-g.pos.z);speed=1.5;}
  }
  if(g.detour>0){g.detour-=dt;want=g.detourH;}
  let diff=want-g.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  g.heading+=Math.max(-7*dt,Math.min(7*dt,diff));
  let moving=false;
  if(speed>0){
    const fx=Math.sin(g.heading),fz=Math.cos(g.heading),ahead=gobGround(g.pos.x+fx*0.45,g.pos.z+fz*0.45,g.pos.y,g,dt);
    if(ahead-g.pos.y>1.05){
      g.stuck+=dt;
      if(g.stuck>0.25){let best=null,bs=-9;const tx=Math.sin(want),tz=Math.cos(want);for(const [vx,vz] of DIRV){if(gobGround(g.pos.x+vx*1.2,g.pos.z+vz*1.2,g.pos.y)-g.pos.y>1.05)continue;const s=vx*tx+vz*tz+Math.random()*0.4;if(s>bs){bs=s;best=[vx,vz];}}if(best){g.detour=1;g.detourH=Math.atan2(best[0],best[1]);}else g.wt=null;g.stuck=0;}
    } else {g.pos.x+=fx*speed*dt;g.pos.z+=fz*speed*dt;moving=true;g.phase+=dt*speed*4.5;g.stuck=0;}
  }
  if(g.fleeing){g.arm.rotation.x=-2.7+Math.sin(g.t*18)*0.35;g.armL.rotation.x=-2.7+Math.sin(g.t*18+2)*0.35;}
  else{const sw=moving?Math.sin(g.phase)*0.4:0;g.arm.rotation.x=sw;g.armL.rotation.x=-sw;}
  return moving;
}
const DIRV=[[0,1],[1,0],[0,-1],[-1,0]],DIRH=[0,Math.PI/2,Math.PI,-Math.PI/2];
let playTime=0;
function resetGoblins(){for(const g of goblins){g.state='wait';g.t=Math.random()*6;g.root.visible=false;}}
// a spot a goblin may turn up at: near a building that's still standing (so not out in open country, unless there's a
// farm nearby, and not among ruins)
const spawnOK=(x,z)=>nearStanding(x,z);
function spawnGoblin(g,any){
  const al=alivePlayers();if(!al.length)return false;
  const c=al[Math.floor(Math.random()*al.length)];
  // about a third lurk inside the buildings; the rest come up the street ('any': placed by the caller, e.g. out of a
  // police car, so no need to find a spot)
  let pos=null,inside=false;
  if(any)pos=c.pos.clone();
  // down in the sewers or the subway: they come at you along the tunnel
  if(!any&&c.pos.y<G-1&&underAt(c.pos.x,c.pos.y,c.pos.z)){
    for(let k=0;k<40&&!pos;k++){const a=Math.random()*6.283,rr=8+Math.random()*20,x=Math.floor(c.pos.x+Math.cos(a)*rr),z=Math.floor(c.pos.z+Math.sin(a)*rr);
      for(let y=Math.floor(c.pos.y)+3;y>=Math.floor(c.pos.y)-3;y--){const f=get(x,y-1,z);if(f&&f!==WATER&&!get(x,y,z)&&!get(x,y+1,z)){pos=new V3(x+0.5,y,z+0.5);break;}}}
    if(!pos)return false;}
  for(let k=0;k<8&&!pos;k++){
    const q=Math.random()<0.35+0.3*(1-streetBusy())?findIndoor(c.pos.x,c.pos.z,12,34):null;
    if(q){if(spawnOK(q.x,q.z)){pos=q;inside=true;}continue;}
    const st=findStreet(c.pos.x,c.pos.z,24,38);if(spawnOK(st.x,st.z))pos=st;
  }
  if(!pos)return false;
  g.indoor=inside;
  g.pos.copy(pos);g.hp=g.hpMax=4;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.atk=1;g.detour=0;
  g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=-0.5;g.kv.set(0,0,0);g.stun=0;
  g.id=makeIdentity(g,dressGoblin(g));
  return true;
}
function damageGoblin(g,n,pt,dir,cause,by){
  if(g.state!=='chase')return;
  dmgPop(g.pos.x,g.pos.y+1.6,g.pos.z,n,'#ffe14a');
  if(!by&&BLAME==='acc')by=ACCIDENT;
  g.hp-=n;g.hurt=0.1;if(cause!=='Fell to death')g.hitT=playTime;
  if(g.homeV&&!g.homeV.roused&&!calmNow())(g.cultist?cultRouse:siteRouse)(g.homeV);   // (hurt one at the altar or the compound and the whole lot turn on you)
  if(g.snowU&&g.snowU.value>0.05){puff(g.pos.x,g.pos.y+1.3*ES,g.pos.z,6,0xf0f4fa,0.35);g.snowU.value=0;}
  // (at Passive, a hit doesn't put anyone off what they're doing, unless it kills them)
  if(g.news&&!(passiveNow()&&g.hp>0)){endNews(g,true);g.indoor=false;g.wt=null;}   // hit: drop everything and run (or fall)
  if(g.hp>0&&!passiveNow()&&(g.medic||g.ff)){if(g.medic&&g.medic.cur)g.medic.cur.tended=false;g.medic=null;g.ff=null;g.indoor=false;g.wt=null;}   // hit: forget the job and run
  blood(pt.x,pt.y,pt.z,5+n*2,dir?dir.clone().multiplyScalar(-0.4):null);
  if(dir)blood(pt.x,pt.y,pt.z,3+n,dir);
  splat(pt.x+(Math.random()-.5)*.6,pt.z+(Math.random()-.5)*.6,pt.y,0.15+Math.random()*0.2);
  tone('square',480,220,0.08,0.07);
  // knockback: harder hits throw them farther, and a killing blow sends them flying
  if(dir){const h=Math.hypot(dir.x,dir.z);if(h>0.05){const dead=g.hp<=0,kb=Math.min(13,3+n*0.6)*(dead?1.6:1);g.kv.x+=dir.x/h*kb;g.kv.z+=dir.z/h*kb;g.vy=Math.max(g.vy,dead?6:3.5);g.stun=0.45;}}
  if(g.hp<=0){g.state='dead';g.t=0;g.sink=0;const n2=nearestPlayer(g.pos.x,g.pos.z);reportNews(g.pos.x,g.pos.z,'killing');
    // 'by' is an NPC (a car's driver) when they did it; otherwise the nearest hippo gets the credit
    recordObit(g,cause||'Killed by a hippo',by||(n2&&n2.p));
    if(by){g.vendor=null;}
    else reportCrime(g.pos.x,g.pos.z);
    if(by){}
    else if(g.civ){score+=25;g.vendor=null;flashLabel('Civilian flattened  +25',n2&&n2.p);}else{score+=100;kills++;flashLabel((g.cultist?'Cultist slain':g.foeKind?FOES[g.foeKind].label:'Goblin killed')+'  +100',n2&&n2.p);}
    tone('sawtooth',620,110,0.45,0.1);splat(g.pos.x,g.pos.z,g.pos.y+0.5,0.6);}
}
function knockMove(o,dt){
  if(Math.abs(o.kv.x)+Math.abs(o.kv.z)<0.05){o.kv.x=o.kv.z=0;return;}
  const nx=o.kv.x*dt,nz=o.kv.z*dt;
  if(canStand(o.pos.x+nx,o.pos.z,o.pos.y))o.pos.x+=nx;else o.kv.x*=-0.3;
  if(canStand(o.pos.x,o.pos.z+nz,o.pos.y))o.pos.z+=nz;else o.kv.z*=-0.3;
  const s=supportAt(o.pos.x,o.pos.z,o.pos.y),air=s!==null&&o.pos.y>s+0.05;
  const k=Math.exp(-dt*(air?0.8:6));o.kv.x*=k;o.kv.z*=k;
}
