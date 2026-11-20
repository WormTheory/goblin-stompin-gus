// ---------- The game as it was left: score, this rampage, each player, the clock and weather, the vehicle you were in ----------
// Kept beside the world (PLAY_KEY, one of the save's SV_KEYS, so a save file carries it too) rather than in it: it's
// small and changes all the time, so it's written with where you're standing (every couple of seconds, on leaving the
// page, Save now), while the world, which can be megabytes, is only written as it's smashed. Per city (by seed), never in
// the Testing Environment or for an online guest (whose game is the host's). Anything missing, as in a save from before
// it was kept, stays as a new game has it. Each seat's own part waits for that player: player one at boot, player two
// when they join. Gus and Gertie (and Gnash and Grizzle) are kept and given back alike: nothing here reads p.who.
const PLAY_KEY='goblin-stompin-gus-play';
let PLAY_PEND=null,PLAY_LAST='';   // (the seats' parts not yet given back; the last thing written, so an unchanged one isn't written again)
const plNum=(v,d)=>typeof v==='number'&&Number.isFinite(v)?v:d,plR=(v,n)=>+v.toFixed(n);
// the vehicle a player's in, as something that can be put back: its kind, where it stands and its health. Trains,
// subways, boats, ships, deck weapons and a carrier's jets can't be made again on their own, so they're left out (and
// the player comes back on foot, on the ground there)
function playVeh(p){const D=p.drv;if(!D||!D.o||D.netS)return null;const o=D.o,S=drvPose(D);if(!(S.x<SHIP_X0)||![S.x,S.y,S.z].every(Number.isFinite))return null;
  let t=null;
  if(D.k==='car')t=o.police?'police':o.veh;
  else if(D.k==='tank'||D.k==='heli'||D.k==='mech'||D.k==='balloon')t=D.k;
  else if(D.k==='plane'&&!o.cvJet)t=o.jet?'jet':o.light?'light':'plane';
  if(!t||D.k==='car'&&!VEH[t]&&t!=='police')return null;
  const h=vehHealth(D),R={k:D.k,t,seat:D.seat==='gun'?'gun':'drv',x:plR(S.x,2),y:plR(S.y,2),z:plR(S.z,2),h:plR(S.h,3),hp:plR(h.hp,1)};
  if(D.k==='plane'){const g=groundAt(S.x,S.z,S.y+0.5);R.air=S.y-g>2;}   // (a plane in the air isn't put back: there's no knowing it'd be over a runway)
  if(D.k==='mech'&&o.load)R.load=o.load;
  // (two players in the one vehicle: the other's seat says so, and goes back into the same one)
  const q=players.find(q=>q!==p&&q.active&&q.drv&&q.drv.o===o);if(q)R.with=q.idx;
  return R;
}
function playOf(p){
  const dead=p.deadT>0||!(p.hp>0)||p.state==='dead';   // (dead when saved: back at full health, as after a respawn)
  const R={i:p.idx,gob:!!p.gob,hp:dead?20:plR(p.hp,2),stam:dead?100:plR(plNum(p.stam,100),1)};
  if(p.gob&&p.wpns){const st={};for(const k of GOB_STACKS)st[stkField(k)]=p[stkField(k)]||0;
    R.w={wpns:p.wpns.slice(),wpn:p.wpn,ammo:Object.assign({},p.ammo||{}),spare:Object.assign({},p.spare||{}),st};}
  if(!dead){const v=playVeh(p);if(v)R.veh=v;}
  return R;
}
function playSave(){try{
  if(saveBlocked||TENV||netGuest()||netWorldText())return;
  const pl=players.filter(p=>p.active&&!p.net).map(playOf);
  // (a seat whose player hasn't joined yet this time keeps what it had)
  if(PLAY_PEND)for(const r of PLAY_PEND)if(!pl.some(q=>q.i===r.i))pl.push(r);
  const s=JSON.stringify({seed,score,kills,playTime:plR(playTime,1),
    ramp:{cars:RAMP.cars,best:RAMP.best,b:[...RAMP.bldgs],r:[...RAMP.razed],pre:[...RAMP.pre],seen:[...RAMP.seen]},clock:clockState(),pl});
  if(s!==PLAY_LAST){localStorage.setItem(PLAY_KEY,s);PLAY_LAST=s;}}catch(e){}}
addEventListener('pagehide',playSave);addEventListener('beforeunload',playSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)playSave();});
// a saved clock, checked over: anything missing or nonsense stays as it is now
function playClock(k){
  if(!k||typeof k!=='object'||!(plNum(k.dayN,0)>=1))return;const C=clockState(),w=k.wx&&typeof k.wx==='object'?k.wx:{};
  C.tod=((plNum(k.tod,C.tod)%1)+1)%1;C.dayN=Math.floor(k.dayN);C.clockT=plNum(k.clockT,C.clockT);C.tc=plNum(k.tc,C.tc);C.wc=plNum(k.wc,C.wc);
  if(WX_TYPES[w.type])C.wx.type=w.type;C.wx.until=plNum(w.until,C.wx.until);
  if(w.k&&typeof w.k==='object')for(const n of WX_KEYS)C.wx.k[n]=plNum(w.k[n],C.wx.k[n]);
  for(const n of ['wet','snowCover','snowClock'])C.wx[n]=plNum(w[n],C.wx[n]);
  clockApply(C);
  // (winter's ice: chunks made from here on freeze as they're made, and any made already are frozen now)
  WX.frozen=false;freezeQ.length=0;if(seasonOf()===3){WX.frozen=true;freezeWorld(true);}
  try{updateSeasonW();}catch(e){}try{renderTime();}catch(e){}
}
// on loading (just after the world, before anyone's placed): what belongs to the whole game, and each seat's part kept back
function playLoad(){
  PLAY_PEND=null;if(TENV||netWorldText())return;
  let q=null;try{q=JSON.parse(localStorage.getItem(PLAY_KEY)||'null');}catch(e){}
  if(!q||typeof q!=='object'||q.seed!==seed)return;
  score=Math.max(0,plNum(q.score,0));kills=Math.max(0,Math.floor(plNum(q.kills,0)));playTime=Math.max(0,plNum(q.playTime,0));
  const R=q.ramp;if(R&&typeof R==='object'){RAMP.cars=Math.max(0,plNum(R.cars,0));RAMP.best=Math.max(0,plNum(R.best,0));
    for(const [f,k] of [['b','bldgs'],['r','razed'],['pre','pre'],['seen','seen']]){RAMP[k].clear();if(Array.isArray(R[f]))for(const v of R[f])if(typeof v==='string')RAMP[k].add(v);}
    RAMP.nB=RAMP.bldgs.size;RAMP.nR=RAMP.razed.size;}
  playClock(q.clock);
  PLAY_PEND=Array.isArray(q.pl)?q.pl.filter(r=>r&&typeof r==='object'&&Number.isInteger(r.i)):[];
}
// a new city: nothing carried over
function playReset(){PLAY_PEND=null;PLAY_LAST='';try{localStorage.removeItem(PLAY_KEY);}catch(e){}}
// a seat's part, given back to its player once they're placed: health, stamina, a goblin's weapons, the vehicle
function playPlayer(p){
  if(!PLAY_PEND||!p||!p.active||p.net)return;const j=PLAY_PEND.findIndex(r=>r.i===p.idx);if(j<0)return;const R=PLAY_PEND.splice(j,1)[0];
  const hp=plNum(R.hp,0);if(hp>0)p.hp=Math.min(p.hp,hp);
  p.stam=Math.max(0,Math.min(100,plNum(R.stam,p.stam)));
  if(!!R.gob!==!!p.gob)return;   // (someone else picked since: Gnash's weapons don't go to Gus)
  if(p.gob&&R.w&&Array.isArray(R.w.wpns))try{playArms(p,R.w);}catch(e){}
  if(p.gob&&R.veh)try{playVehBack(p,R.veh);}catch(e){}
}
function playArms(p,W){
  const st=W.st&&typeof W.st==='object'?W.st:{};
  for(const k of GOB_STACKS){const f=stkField(k);p[f]=Math.max(0,Math.min(stkMax(k),Math.floor(plNum(st[f],p[f]||0))));}
  const ws=W.wpns.filter((k,i,a)=>typeof k==='string'&&GOB_WPN[k]&&a.indexOf(k)===i&&!(WEAPONS[k].stack&&!(p[stkField(k)]>0)));
  if(!ws.length)return;p.wpns=ws;p.wpn=ws.includes(W.wpn)?W.wpn:ws[0];p.relT=0;p.ammo={};p.spare={};
  for(const k of ws){const W2=WEAPONS[k],a=W.ammo&&W.ammo[k],s=W.spare&&W.spare[k];
    if(W2.mag&&Number.isFinite(a))p.ammo[k]=Math.max(0,Math.min(W2.mag,Math.floor(a)));
    if(W2.spare!==undefined&&Number.isFinite(s))p.spare[k]=Math.max(0,Math.floor(s));}
  p.wpnT=camClock;
}
// the vehicle, made again where it stood (on the ground under it, if it was flying) and the player put back in their seat
function playVehBack(p,R){
  if(!['x','y','z','h'].every(k=>Number.isFinite(R[k])))return;
  // (in with the other player, if they're already back in it)
  if(Number.isInteger(R.with)){const q=players.find(q=>q.idx===R.with&&q.active&&q.drv);
    if(q&&q.drv.k===R.k){const o=q.drv.o,D=Object.assign({},q.drv,{seat:undefined});
      if(R.seat==='gun'){if(!o.gnr&&gunSeat(D)){D.seat='gun';drvEnter(p,D);}}else if(!o.drv)drvEnter(p,D);return;}}
  const o=playVehMake(R);if(!o)return;
  const D=o.D;delete o.D;const max=VEHICLE_KINDS[D.k]?VEHICLE_KINDS[D.k].max(D.o):0,hp=plNum(R.hp,0);
  if(hp>0&&max>0)D.o.hp=Math.min(max,hp);
  if(R.seat==='gun'){if(!gunSeat(D))return;D.seat='gun';}
  drvEnter(p,D);drvSeat(p);
}
function playVehMake(R){
  const x=R.x,z=R.z,h=R.h,gy=groundAt(x,z,R.y+0.5),y=Number.isFinite(gy)&&gy>0?gy:R.y;
  if(R.k==='car'){const c=playCar(R.t,x,R.y,z,h);return c?{D:{k:'car',o:c}}:null;}
  if(R.k==='tank'||R.k==='heli'){
    const V=tenvArmy(),mk=R.k==='tank'?makeTank():makeHeli();TS.mil=(TS.mil||0)+1;
    // (empty and left standing, as a player leaves one: getting in isn't a carjacking)
    const M=Object.assign({isMil:true,crew:null,kind:R.k,V,x,y,z,h,tu:0,hp:MIL[R.k].hp,dead:false,key:'mil:tenv:'+Date.now()+':'+TS.mil,home:{x,z,h},state:'idle',
      cd:1.5,rcd:6,burst:0,bt:0,stuck:0,v:0,vy:0,spin:0,oa:Math.random()*6.3,hurt:0},mk);
    scene.add(M.g);milPlace(M);V.mil.push(M);return{D:{k:R.k,o:M,V}};}
  if(R.k==='mech'){let V=venues.get('tenvMechs');if(!V){V={kind:'mech',mechs:[]};venues.set('tenvMechs',V);}
    const M=newMech(V,x,z,h,R.load);M.y=Math.max(y,mgGround(x,z,y+1.5,M));return{D:{k:'mech',o:M,V}};}
  if(R.k==='balloon'){let V=venues.get('tenvBalloons');if(!V){V={kind:'balloon',bl:[]};venues.set('tenvBalloons',V);}
    const n=(TS.bal=(TS.bal||0)+1),M=makeBalloon(n),B={isBalloon:true,key:'bal:'+n,ck:n,V,g:M.g,flame:M.flame,env:M.env,x,y,z,h,vx:0,vz:0,vy:0,heat:0,hp:BAL.hp,dead:false,deadT:0};
    scene.add(B.g);balPlace(B);V.bl.push(B);return{D:{k:'balloon',o:B,V}};}
  if(R.k==='plane'){if(R.air)return null;
    let V=venues.get('tenvPlanes');if(!V){V={kind:'airport',tenv:true,planes:[],pl:[]};venues.set('tenvPlanes',V);}
    const jet=R.t==='jet',light=R.t==='light',g=jet?makeJet():light?makeLightPlane(V.planes.length):makePlane(V.planes.length);
    g.position.set(x,y,z);g.rotation.set(0,h,0);scene.add(g);
    const pl={isPlane:true,jet,light,g,hp:light?LIGHT_HP:PLANE_HP,dead:false,v:0};V.planes.push(g);V.pl.push(pl);return{D:{k:'plane',o:pl,V}};}
  return null;
}
// a car of kind t put down at x,y,z facing h, parked and empty (as the debug menu's Spawn makes one: tenvVeh)
function playCar(t,x,y,z,h){
  if(t==='technical'||t==='quad'){const c=crewCar();if(!c)return null;crewPut(c,t,x,z,h,null,'militia');c.spot=null;c.pos.y=y;c.g.position.copy(c.pos);return c;}
  const pol=t==='police';if(!pol&&!VEH[t])return null;
  let c=cars.find(o=>!o.alive&&!o.ws&&!o.svcPool&&!o.pullPool&&!o.rvPool&&!o.hwPool&&!!o.parkPool===!pol&&!!o.police===pol);
  if(!c){c=makeCar(cars.length,pol);c.g.scale.setScalar(ES);c.respawnT=1e9;if(!pol)c.parkPool=true;cars.push(c);}
  carSpawn(c,{veh:pol?null:t,x,y,z,h,hunter:false,parked:true,place:true});
  c.driver=null;if(c.dh)c.dh.visible=false;
  c.path=null;c.hw=null;c.rt=null;c.svc=null;c.leaving=false;c.rampKey=null;c.spot=null;c.makeWay=0;c.rusted=false;c.paint.color.setHex(c.color);c.lastInter=-1;
  return c;
}
// player two's part comes back when they join
{const a0=activateP2;activateP2=function activateP2(){const was=P2.active;a0();if(!was&&P2.active)playPlayer(P2);};}
