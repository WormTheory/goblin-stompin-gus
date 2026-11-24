// ---------- Petrol pumps going up and cars exploding (it was at the end of ui/options-debug.js) ----------
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
  blastFx(x,y+2.5,z,0.6,2.8);
  smoke(x,y+2,z,40,0x1e1e1e);puff(x,y,z,30,0x6a4a2a,3.5);
  for(let i=0;i<40;i++)emit(2,x+(Math.random()-.5)*5,y+1+Math.random()*4,z+(Math.random()-.5)*5,Math.random()<0.5?0xffb040:0xff6020,0.2,0.2,0.2,{force:4.2,dx:0,dz:0,up:2.4});
  for(let i=0;i<16;i++){const d=debris[(debrisIdx++)%debris.length];if(d.painted)d.m.material.color.setHex(0xcc3030);
    d.m.position.set(x+(Math.random()-.5)*2,y+1+Math.random(),z+(Math.random()-.5)*2);d.v.set((Math.random()-.5)*16,9+Math.random()*10,(Math.random()-.5)*16);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=4;d.m.visible=true;}
  noise(2.6,1.3,500,'lowpass');tone('sawtooth',55,18,2.2,0.45);tone('sine',80,24,1.8,0.35);
  addShake(1.3,x,z,70);
  if(BLAME!=='acc')award(150,'Gas pump blown',x,y+2,z);
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
  const pts=c.police?500:300;if(BLAME!=='acc'){reportCrime(p.x,p.z);RAMP.cars++;award(pts,c.police?'Police car tossed':c.crew&&CREW_NAME[c.veh]?CREW_NAME[c.veh]+' destroyed':'Car tossed',p.x,p.y+2,p.z);}
  if(c.police&&c.spot){policeDown[c.spot.split(':')[0]]=playTime+90;c.spot=null;}c.parked=false;
  if(c.svcPool&&c.svc){const keep=c.alive;svcDone(c,true);}
  // (inside a big blast: just gone, with no blast of its own and nothing set off round it, big-blast.js)
  if(BB.quiet){if(c.crew)crewWreck(c,p);if(c.parkPool&&c.spot){parkDown[c.spot]=playTime+120;c.spot=null;}return;}
  blastFx(p.x,p.y+1,p.z,0.6,1);
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
  wsCarHulk(c);   // (and its burnt-out shell carries on the way it was going: wreck-slide.js)
}
