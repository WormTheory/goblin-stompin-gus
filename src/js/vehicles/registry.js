// ---- every kind of vehicle in one table ----
// What every vehicle does alike, in VEHICLE_BASE, and what each kind says for itself, in VEHICLE_KINDS (keyed as drvFind
// names them, p.drv.k). Snow (updateVehSnow), smoke (vehSmoke), points (vehDamage), the driving display's health
// (drvHP), the floating health bars (drawDbgOverlay), the health sent online (netVenueHP) and the guard tests all read
// it, so a new kind of vehicle wants an entry here.
// The switches: snow, gathers snow on top (true: updateVehSnow does it; 'blocks': it's made of real blocks, whose
// chunks settle snow on their open tops like the ground's, aSky in meshing.js, so there's nothing to add); smoke, smokes once its health is under that share of the whole (and burns
// under half of it); pts, points for destroying it (and label, what the award says); rampage, counted among the
// vehicles destroyed in This rampage (every kind: a train by the car, a ship once when it sinks); invuln, Invulnerability covers it while someone drives it (drvSafe); net, its health
// sent to guests by its venue (netOwn: in a snapshot of its own); bullets and blasts, what can hurt it.
// And how it's driven, each kind saying for itself (functions of D, what p.drv holds, since a car's kind covers forklifts
// and tractors too): ctx, its control context (its own set of controls in ACTS, read only while you're in it; null: the
// ones on foot); handling, its numbers (a profile from HANDLING: handOf); inst, the instrument in the bottom-right
// corner (a key in INSTRUMENTS, or null for none); how(p,D,armed,G), its own lines at the top of the controls column
// down the left (drvHud; G the weapons' lines, if it's armed), each ending in '  ·  '.
// All of it lives on the vehicle, never on who's driving, so every character drives each one alike.
const VEHICLE_BASE={snow:true,smoke:0.5,pts:0,label:null,rampage:true,invuln:true,net:true,netOwn:false,bullets:true,blasts:true,impact:false,
  ctx:()=>null,handling:D=>handOf(D.k),inst:()=>null,how:(p,D,armed,G)=>G};
// ---- each vehicle's handling: one profile per kind (a car's by its body, c.veh), over the defaults in HANDLING._ ----
// top speed and acc (blocks a second, and a second squared), brk braking, rev the most it goes backwards, steer how fast
// it turns at full lock (radians a second), fall the speed at which that's eased right off (1 - speed/fall, never under 45%; 0: it doesn't), coast how fast
// it slows with nothing pressed, accFall (a supercar) the speed by which its pull has gone, mass for crashes; a road
// vehicle's grip how fast its slide comes round to where it points (a second), off that share of it on grass, dirt and
// sand, drift false for one too heavy to drift (it only slides) and dchg how fast a drift charges (road-handling.js).
// A road vehicle's steering eases off with speed, to 45% by three times its top speed if it has no fall of its own
const HANDLING={_:{top:20,acc:10,brk:26,rev:8,steer:1.7,fall:0,coast:0.9,accFall:0,mass:1,grip:9,off:0.6,dchg:1},
  car:{top:24},bike:{top:28,mass:0.4,steer:2.1,grip:10,dchg:1.2},quad:{top:22,mass:0.6,grip:7,off:1},technical:{grip:7,off:1},
  van:{mass:1.4,steer:1.45,grip:7,dchg:0.7},pickup:{mass:1.3,steer:1.5,grip:7,off:0.8,dchg:0.8},news:{mass:1.4,steer:1.45,grip:7,dchg:0.7},rv:{mass:2,steer:1.3,grip:6,dchg:0.5},
  amb:{top:25,mass:1.6,grip:8},fire:{mass:3,steer:1.25,grip:5,drift:false},truck:{mass:2.5,steer:1.25,grip:5,drift:false},semi:{top:17,mass:4,steer:1.1,grip:4,drift:false},bus:{top:17,mass:4,steer:1.15,grip:4,drift:false},
  super:{top:62,acc:24,fall:110,accFall:90,grip:12},   // (its pull and its steering ease off with speed, to no less than 45%)
  forklift:{top:8,acc:5,rev:6,steer:2.6,mass:1.5},tractor:{top:11,acc:7,rev:6,mass:2},hover:{top:27,acc:8,brk:7,coast:0.35,mass:1.2},
  tank:{top:7,mass:8},heli:{top:16,mass:4},plane:{mass:6},boat:{mass:3},train:{top:30,mass:20},subway:{top:25,mass:15},balloon:{mass:1},ship:{mass:50},mech:{mass:10}};
const _hand={};
function handOf(k){if(_hand[k])return _hand[k];const H=Object.assign({},HANDLING._,HANDLING[k]||{});H.k=k;return _hand[k]=H;}
// Each kind: venue, the kind of venue its vehicles are kept in, and list(V) those in one (a car has none: they're the
// traffic, cars); pos(o) where it stands; top(o) how far above that its health bar goes (a hit's number a little
// higher); mid(o) where a hit's sparks fly; hp(o,i) and max(o) its health (i: a train's car); dead(o); shown(o), whether
// it's in sight to show a bar; groups(o) its models, for snow; hit(o,n,dir,i) its damage entry.
// (All functions, so nothing here is read before the files defining MIL, MG, BAL and the rest have loaded.)
const _vkp={x:0,y:0,z:0},vkAt=(x,y,z)=>{_vkp.x=x;_vkp.y=y;_vkp.z=z;return _vkp;};
const VEHICLE_KINDS={
  car:{name:'Car',rampage:true,snow:false,smoke:0,   // (their own snow and smoke: snowCar, updateCars)
    ctx:D=>D.seat==='gun'?null:D.o.veh==='forklift'?'lift':D.o.veh==='tractor'?'farm':'road',handling:D=>handOf(D.o.veh||'car'),inst:D=>CAR_INST[D.o.veh]||'car',how:carHow,
    pos:c=>c.pos,top:c=>(c.hy||1.4)+0.5,mid:c=>(c.hy||1.4)*0.6,max:c=>c.hpMax>=c.hp?c.hpMax:Math.max(c.hp,carHP(c)),
    dead:c=>!c.alive,shown:c=>c.g.visible,hit:(c,n,dir)=>damageCar(c,n,dir)},
  train:{name:'Train',venue:'rtrain',ctx:()=>'rail',inst:()=>'train',how:trainHow,list:V=>V.T&&V.cars?[V.T]:[],perCar:true,carTop:()=>4.2,top:()=>4.2,mid:()=>2.5,groups:T=>T.cars||[],
    pos:T=>T.cars[0].position,hp:(T,i)=>T.carHP?T.carHP[i||0]:CAR_HP,max:()=>CAR_HP,hit:(T,n,dir,i)=>trainHit(T,n,dir,i)},
  subway:{name:'Subway train',venue:'sub',ctx:()=>'rail',inst:()=>'train',how:trainHow,list:V=>V.T&&V.cars?[V.T]:[],perCar:true,carTop:()=>TRAIN_H+0.7,top:()=>TRAIN_H+0.7,mid:()=>2.5,groups:T=>T.cars||[],
    pos:T=>T.cars[0].position,hp:(T,i)=>T.carHP?T.carHP[i||0]:CAR_HP,max:()=>CAR_HP,hit:(T,n,dir,i)=>trainHit(T,n,dir,i)},
  tank:{name:'Tank',venue:'army',ctx:()=>'tank',inst:()=>'tank',how:tankHow,list:V=>V.mil.filter(M=>M.kind==='tank'),impact:true,pts:()=>MIL.tank.pts,label:()=>'Tank destroyed',
    pos:M=>vkAt(M.x,M.y,M.z),top:M=>MIL[M.kind].hy+0.6,mid:M=>MIL[M.kind].hy*0.6,max:M=>MIL[M.kind].hp,hit:(M,n,dir)=>milHit(M,n,dir)},
  heli:{name:'Helicopter',venue:'army',ctx:()=>'heli',inst:()=>'heli',how:heliHow,list:V=>V.mil.filter(M=>M.kind==='heli'),impact:true,pts:()=>MIL.heli.pts,label:()=>'Helicopter destroyed',
    pos:M=>vkAt(M.x,M.y,M.z),top:M=>MIL[M.kind].hy+0.6,mid:M=>MIL[M.kind].hy*0.6,max:M=>MIL[M.kind].hp,hit:(M,n,dir)=>milHit(M,n,dir)},
  plane:{name:'Plane',venue:'airport',ctx:()=>'air',inst:D=>D.o.jet?'jet':D.o.light?'steam':'pfd',how:planeHow,list:V=>V.pl||[],pts:()=>1000,label:()=>'Airplane destroyed',
    pos:pl=>pl.g.position,top:pl=>planeDim(pl).hy+0.8,mid:()=>2.5,max:pl=>planeMax(pl),shown:pl=>pl.g.visible,hit:(pl,n)=>planeHit(pl,n)},
  boat:{name:'Boat',venue:'boat',ctx:()=>'sea',inst:D=>D.o.k==='row'||D.o.k==='pedalo'?'row':'boat',how:boatHow,list:V=>V.bo?[V.bo]:[],pts:bo=>bo.K.sc,label:bo=>bo.K.name+' sunk',
    pos:bo=>bo.g.position,top:bo=>bo.K.fb+2,mid:bo=>bo.K.fb,max:bo=>bo.max,shown:bo=>bo.g.visible,hit:(bo,n)=>boatHit(bo,n)},
  balloon:{name:'Hot-air balloon',venue:'balloon',ctx:()=>'balloon',inst:()=>'balloon',how:(p,D)=>actMark(p,'jump')+' burner (rise)  ·  '+actMark(p,'climb')+' vent (sink)  ·  Move to drift  ·  ',list:V=>V.bl||[],pts:()=>400,label:()=>'Hot-air balloon brought down',
    pos:B=>vkAt(B.x,B.y,B.z),top:()=>BAL.e1+0.8,mid:()=>BAL.e0+2,max:()=>BAL.hp,hit:(B,n)=>balloonHit(B,n)},
  mech:{name:'Mobile Gear',venue:'mech',ctx:()=>'mg',inst:()=>'dial',list:V=>V.mechs||[],impact:true,netOwn:true,pts:()=>2000,label:()=>'Mobile Gear destroyed',   // (its health goes in its own snapshot: netMechs)
    pos:M=>vkAt(M.x,M.y,M.z),top:()=>MG.hy+0.8,mid:()=>5,max:()=>MG.hp,hit:(M,n)=>mechHit(M,n)},
  // (a ship's health, and its deck weapons', go in its own snapshot, netShips. See docs/multiplayer.md)
  ship:{name:'Ship',venue:'ship',ctx:()=>'sea',inst:()=>'ship',how:(p,D)=>shipHow(p,D.o),list:V=>V.ships||[],snow:'blocks',smoke:0,netOwn:true,
    pos:S=>{const P=shipPose(S);return vkAt(P.x,P.y,P.z);},top:S=>shipPose(S).hy+2,mid:S=>S.K.hy||2,max:S=>S.K.hp,hit:(S,n,dir,i)=>shipHit(S,n,i)},
  // (where it is, x,y,z, is in its ship's pocket, which is right for snow: what's over it there is the ship's own blocks)
  mount:{name:'Deck weapon',venue:'ship',how:(p,D)=>D.o.kind==='ciws'?actMark(p,'bite')+' fire (hold)  ·  ':actMark(p,'bite')+' launch'+(D.o.kind==='sparrow'?' (lock on first)':'')+'  ·  ',list:V=>(V.ships||[]).flatMap(S=>S.dead?[]:S.mounts||[]),netOwn:true,pts:()=>300,label:Mt=>Mt.K.name+' destroyed',groups:Mt=>[Mt.g],
    pos:Mt=>vkAt(Mt.x,Mt.y,Mt.z),top:()=>2.4,mid:()=>1.5,max:Mt=>Mt.K.hp,dead:Mt=>Mt.dead||Mt.S.dead,hit:(Mt,n)=>mountHit(Mt,n)},
};
// (filled in: the base's switches under each kind's own, and the usual ways of reading health)
for(const k in VEHICLE_KINDS){const K=VEHICLE_KINDS[k];K.k=k;for(const s in VEHICLE_BASE)if(!(s in K))K[s]=VEHICLE_BASE[s];
  if(!K.hp)K.hp=o=>o.hp;if(!K.dead)K.dead=o=>!!o.dead;if(!K.shown)K.shown=()=>true;if(!K.groups)K.groups=o=>o.g?[o.g]:[];
  if(typeof K.pts!=='function'){const v=K.pts;K.pts=()=>v;}if(!K.label)K.label=()=>K.name+' destroyed';}
// the kinds kept in each kind of venue
const VEH_BY_VENUE={};for(const k in VEHICLE_KINDS){const v=VEHICLE_KINDS[k].venue;if(v)(VEH_BY_VENUE[v]=VEH_BY_VENUE[v]||[]).push(VEHICLE_KINDS[k]);}
// every vehicle kept in a venue, kind by kind: fn(K, the vehicle, its venue)
function vehEach(fn){for(const V of venues.values()){const ks=VEH_BY_VENUE[V.kind];if(!ks)continue;for(const K of ks)for(const o of K.list(V))fn(K,o,V);}}
// The steps every vehicle's damage entry shares: nothing if it's already wrecked or Invulnerability covers it; a blow
// heavy enough can stagger it (impHit); the number of the hit, the health off it, sparks; and at none, wrecked, with
// points for it (not for an accident). Returns 0 if it took nothing, 1 if hurt, 2 if that destroyed it: each kind's
// own entry (milHit, planeHit, boatHit, balloonHit, mechHit, mountHit) adds what's its own
function vehDamage(k,o,n){const K=VEHICLE_KINDS[k];if(K.dead(o)||K.invuln&&drvSafe(o))return 0;if(K.impact)n=impHit(o,n);
  const P=K.pos(o),x=P.x,y=P.y,z=P.z;dmgPop(x,y+K.top(o),z,Math.round(n),'#ffb04a');o.hp-=n;vHitFx(x,y+K.mid(o),z,n);
  if(o.hp>0)return 1;
  o.dead=true;o.deadT=0;const pts=K.pts(o);if(BLAME!=='acc'){if(pts)award(pts,K.label(o),x,y+K.top(o)+1,z);if(K.rampage)RAMP.cars++;}
  return 2;}
// smoke off a badly hurt vehicle, from where it is (x,y,z), by its health as its kind reads it (a guest: the host's)
function vehSmoke(k,o,x,y,z,dt,i){const K=VEHICLE_KINDS[k];if(!(K.smoke>0))return;vDamaged(x,y,z,netHp(o,K.hp(o,i))/K.max(o),dt,K.smoke);}
// the health of what's being driven, by its kind (a carrier's deck weapon shows its ship's)
function vehHealth(D){const K=VEHICLE_KINDS[D.k],o=D.o;if(!K)return{hp:CAR_HP,max:CAR_HP};
  if(D.k==='mount')return{hp:o.S.hp,max:o.S.K.hp};return{hp:K.hp(o,D.ci),max:K.max(o)};}
// the control context of what's being driven (see ctx above)
function drvCtx(D){const K=D&&VEHICLE_KINDS[D.k];return K?K.ctx(D):null;}
// the handling profile of what's being driven
function drvHand(D){const K=VEHICLE_KINDS[D.k];return K?K.handling(D):handOf(D.k);}
