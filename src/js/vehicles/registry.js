// ---- every kind of vehicle in one table ----
// What every vehicle does alike, in VEHICLE_BASE, and what each kind says for itself, in VEHICLE_KINDS (keyed as drvFind
// names them, p.drv.k). Snow (updateVehSnow), smoke (vehSmoke), points (vehDamage), the driving display's health
// (drvHP), the floating health bars (drawDbgOverlay), the health sent online (netVenueHP) and the guard tests all read
// it, so a new kind of vehicle wants an entry here.
// The switches: snow, gathers snow on top; smoke, smokes once its health is under that share of the whole (and burns
// under half of it); pts, points for destroying it (and label, what the award says); rampage, counted among the
// cars totaled in This rampage; invuln, Invulnerability covers it while someone drives it (drvSafe); net, its health
// sent to guests by its venue (netOwn: in a snapshot of its own); bullets and blasts, what can hurt it.
const VEHICLE_BASE={snow:true,smoke:0.5,pts:0,label:null,rampage:false,invuln:true,net:true,netOwn:false,bullets:true,blasts:true,impact:false};
// Each kind: venue, the kind of venue its vehicles are kept in, and list(V) those in one (a car has none: they're the
// traffic, cars); pos(o) where it stands; top(o) how far above that its health bar goes (a hit's number a little
// higher); mid(o) where a hit's sparks fly; hp(o,i) and max(o) its health (i: a train's car); dead(o); shown(o), whether
// it's in sight to show a bar; groups(o) its models, for snow; hit(o,n,dir,i) its damage entry.
// (All functions, so nothing here is read before the files defining MIL, MG, BAL and the rest have loaded.)
const _vkp={x:0,y:0,z:0},vkAt=(x,y,z)=>{_vkp.x=x;_vkp.y=y;_vkp.z=z;return _vkp;};
const VEHICLE_KINDS={
  car:{name:'Car',rampage:true,snow:false,smoke:0,   // (their own snow and smoke: snowCar, updateCars)
    pos:c=>c.pos,top:c=>(c.hy||1.4)+0.5,mid:c=>(c.hy||1.4)*0.6,max:c=>c.hpMax>=c.hp?c.hpMax:Math.max(c.hp,carHP(c)),
    dead:c=>!c.alive,shown:c=>c.g.visible,hit:(c,n,dir)=>damageCar(c,n,dir)},
  train:{name:'Train',venue:'rtrain',list:V=>V.T&&V.cars?[V.T]:[],perCar:true,carTop:()=>4.2,top:()=>4.2,mid:()=>2.5,groups:T=>T.cars||[],
    pos:T=>T.cars[0].position,hp:(T,i)=>T.carHP?T.carHP[i||0]:CAR_HP,max:()=>CAR_HP,hit:(T,n,dir,i)=>trainHit(T,n,dir,i)},
  subway:{name:'Subway train',venue:'sub',list:V=>V.T&&V.cars?[V.T]:[],perCar:true,carTop:()=>TRAIN_H+0.7,top:()=>TRAIN_H+0.7,mid:()=>2.5,groups:T=>T.cars||[],
    pos:T=>T.cars[0].position,hp:(T,i)=>T.carHP?T.carHP[i||0]:CAR_HP,max:()=>CAR_HP,hit:(T,n,dir,i)=>trainHit(T,n,dir,i)},
  tank:{name:'Tank',venue:'army',list:V=>V.mil.filter(M=>M.kind==='tank'),impact:true,pts:()=>MIL.tank.pts,label:()=>'Tank destroyed',
    pos:M=>vkAt(M.x,M.y,M.z),top:M=>MIL[M.kind].hy+0.6,mid:M=>MIL[M.kind].hy*0.6,max:M=>MIL[M.kind].hp,hit:(M,n,dir)=>milHit(M,n,dir)},
  heli:{name:'Helicopter',venue:'army',list:V=>V.mil.filter(M=>M.kind==='heli'),impact:true,pts:()=>MIL.heli.pts,label:()=>'Helicopter destroyed',
    pos:M=>vkAt(M.x,M.y,M.z),top:M=>MIL[M.kind].hy+0.6,mid:M=>MIL[M.kind].hy*0.6,max:M=>MIL[M.kind].hp,hit:(M,n,dir)=>milHit(M,n,dir)},
  plane:{name:'Plane',venue:'airport',list:V=>V.pl||[],pts:()=>1000,label:()=>'Airplane destroyed',
    pos:pl=>pl.g.position,top:pl=>planeDim(pl).hy+0.8,mid:()=>2.5,max:pl=>planeMax(pl),shown:pl=>pl.g.visible,hit:(pl,n)=>planeHit(pl,n)},
  boat:{name:'Boat',venue:'boat',list:V=>V.bo?[V.bo]:[],pts:bo=>bo.K.sc,label:bo=>bo.K.name+' sunk',
    pos:bo=>bo.g.position,top:bo=>bo.K.fb+2,mid:bo=>bo.K.fb,max:bo=>bo.max,shown:bo=>bo.g.visible,hit:(bo,n)=>boatHit(bo,n)},
  balloon:{name:'Hot-air balloon',venue:'balloon',list:V=>V.bl||[],pts:()=>400,label:()=>'Hot-air balloon brought down',
    pos:B=>vkAt(B.x,B.y,B.z),top:()=>BAL.e1+0.8,mid:()=>BAL.e0+2,max:()=>BAL.hp,hit:(B,n)=>balloonHit(B,n)},
  mech:{name:'Mobile Gear',venue:'mech',list:V=>V.mechs||[],impact:true,netOwn:true,pts:()=>2000,label:()=>'Mobile Gear destroyed',   // (its health goes in its own snapshot: netMechs)
    pos:M=>vkAt(M.x,M.y,M.z),top:()=>MG.hy+0.8,mid:()=>5,max:()=>MG.hp,hit:(M,n)=>mechHit(M,n)},
  // (ships and their deck weapons: phase 6 puts them on the registry's snow and online health)
  ship:{name:'Ship',venue:'ship',list:V=>V.ships||[],snow:false,smoke:0,net:false,
    pos:S=>{const P=shipPose(S);return vkAt(P.x,P.y,P.z);},top:S=>shipPose(S).hy+2,mid:S=>S.K.hy||2,max:S=>S.K.hp,hit:(S,n,dir,i)=>shipHit(S,n,i)},
  mount:{name:'Deck weapon',venue:'ship',list:V=>(V.ships||[]).flatMap(S=>S.dead?[]:S.mounts||[]),snow:false,net:false,pts:()=>300,label:Mt=>Mt.K.name+' destroyed',
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
  o.dead=true;o.deadT=0;const pts=K.pts(o);if(pts&&BLAME!=='acc'){award(pts,K.label(o),x,y+K.top(o)+1,z);if(K.rampage)RAMP.cars++;}
  return 2;}
// smoke off a badly hurt vehicle, from where it is (x,y,z), by its health as its kind reads it (a guest: the host's)
function vehSmoke(k,o,x,y,z,dt,i){const K=VEHICLE_KINDS[k];if(!(K.smoke>0))return;vDamaged(x,y,z,netHp(o,K.hp(o,i))/K.max(o),dt,K.smoke);}
// the health of what's being driven, by its kind (a carrier's deck weapon shows its ship's)
function vehHealth(D){const K=VEHICLE_KINDS[D.k],o=D.o;if(!K)return{hp:CAR_HP,max:CAR_HP};
  if(D.k==='mount')return{hp:o.S.hp,max:o.S.K.hp};return{hp:K.hp(o,D.ci),max:K.max(o)};}
