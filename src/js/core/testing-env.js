// ---- the Testing Environment: an empty, flat world to try things out in. Any kind of structure can be spawned into it
// (the nearest one in this world's plan, dressed by the world's own code, built on the nearest clear ground in front of Gus),
// and goblins, police and cars a few steps ahead of where Gus is looking. Your own city is put aside meanwhile ----
const TENV_PARK='goblin-stompin-gus-city-parked';
// (kinds that are parts of a highway rather than a place: there's no highway here to put them on)
const TENV_SKIP=new Set(['pylons','billboards','tolls']);
const TS={search:null,n:1,vm:'hunt',dbg:false};
function tsSet(m){const el=document.getElementById('tpInfo');if(el)el.textContent=m;}
// (a source already spawned, or one that's under a box or the ring round it: a source is only ever used once, and away
// from anything built, so what's worked out and kept for one place is never the other's)
const tenvTaken=F=>TENV.boxes.some(B=>F.ax<B.sx+B.w&&B.sx<F.ax+F.w&&F.az<B.sz+B.h&&B.sz<F.az+F.h||F.ax<B.ax+B.w+2&&B.ax-2<F.ax+F.w&&F.az<B.az+B.h+2&&B.az-2<F.az+F.h);
function tpRender(){
  const box=document.getElementById('tpGroups');if(!box)return;
  if(!box.childElementCount)for(const [name,items] of stGroups()){const L=items.filter(([k])=>!TENV_SKIP.has(k));if(!L.length)continue;
    const sec=document.createElement('div'),h=document.createElement('div');h.className='tp-gh';h.textContent=name;
    const grid=document.createElement('div');grid.className='tp-grid';
    for(const [k,l] of L){const b=document.createElement('button');b.type='button';b.className='tp-k';b.dataset.k=k;b.textContent=l;b.addEventListener('click',()=>tenvSpawn(k));grid.append(b);}
    sec.append(h,grid);box.append(sec);}
  const pl=document.getElementById('tpPlaced'),ps=document.getElementById('tpPlacedSec');
  if(pl){pl.innerHTML='';const B=TENV?TENV.boxes:[];if(ps)ps.hidden=!B.length;
    B.forEach((F,i)=>{const r=document.createElement('div');r.className='tp-pl';const t=document.createElement('span');
      t.textContent=stName(F.k)+' · at '+Math.round((F.ax+F.w/2)*CELL)+', '+Math.round((F.az+F.h/2)*CELL);
      const go=document.createElement('button');go.type='button';go.className='pmenu';go.textContent='Go to';go.addEventListener('click',()=>{tenvGo(F);tsSet('Gus is beside the '+stName(F.k).toLowerCase()+' again.');});
      const rm=document.createElement('button');rm.type='button';rm.className='pmenu';rm.textContent='Remove';rm.addEventListener('click',()=>tenvRemove(i));
      r.append(t,go,rm);pl.append(r);});}
  for(const b of document.querySelectorAll('#tpN [data-n]'))b.setAttribute('aria-checked',String(+b.dataset.n===TS.n));
  for(const b of document.querySelectorAll('#tpVM [data-vm]'))b.setAttribute('aria-checked',String(b.dataset.vm===TS.vm));
  // (one button per kind of vehicle body the game has, so a new kind shows up here by itself; police cars are their own pool)
  const vb=document.getElementById('tpVehs');
  if(vb&&!vb.childElementCount)for(const t of tenvVehKinds()){const b=document.createElement('button');b.type='button';b.className='pmenu';b.dataset.veh=t;
    b.textContent=tenvVehName(t);b.addEventListener('click',()=>tenvVeh(t));vb.append(b);}
  // (the Mobile Gear's loadout: a row per slot, the weapons that fit it as a choice of buttons)
  const ld=document.getElementById('tpLoad');
  if(ld&&!ld.childElementCount)for(const S of MG_SLOTS){const r=document.createElement('div');r.className='tp-lr';const t=document.createElement('span');t.className='tp-count';t.textContent=S.n;
    const g=document.createElement('div');g.className='seg';g.setAttribute('role','radiogroup');g.setAttribute('aria-label','Mobile Gear '+S.n.toLowerCase());
    for(const k of S.ks){const b=document.createElement('button');b.type='button';b.setAttribute('role','radio');b.dataset.mgs=S.act;b.dataset.mgw=k;b.textContent=MG_WPNS[k].name;
      b.addEventListener('click',()=>{mgLoadSet(S.act,k);tpRender();tsSet('New Mobile Gears will carry the '+MG_WPNS[k].name+' on the '+S.n.toLowerCase()+'.');});g.append(b);}
    r.append(t,g);ld.append(r);}
  for(const b of document.querySelectorAll('#tpLoad [data-mgs]'))b.setAttribute('aria-checked',String(MG_LOAD[b.dataset.mgs]===b.dataset.mgw));
  if(TENV)seedLine();
}
// the Testing Environment's own tab, just right of Game: there only while in it (on: shown and opened)
function tpShow(on){
  const btn=document.getElementById('tabBtnTest'),panel=document.getElementById('testPanel');btn.hidden=!TENV;
  if(on&&TENV){showTab('test');tpRender();setTimeout(()=>{const b=document.getElementById('tpGo');if(b&&!panel.contains(document.activeElement))b.focus();},0);}
  else if(curTab==='test'||!on){showTab('game');const b=document.getElementById('testWorld');if(b&&!on)b.focus();}
}
// a fresh world (a new seed, nothing smashed, no saved position or obituary), built under the given switches: saved,
// then the page reloads so everything's worked out from scratch
function freshWorld(off,tenv,cfg){   // (cfg: New world's settings, WORLD_CFG's way, only what isn't a default)
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({seed:(Math.random()*1e9)|0,gen:WORLD_GEN,cfg,edits:{},coll:{},down:[],dest:{},test:[...off],tenv}));
    localStorage.removeItem(POS_KEY);localStorage.removeItem(OBIT_KEY);localStorage.removeItem(PLAY_KEY);
    if(localStorage.getItem(SAVE_KEY)){clearTimeout(saveTimer);saveBlocked=true;location.reload();return true;}}catch(e){}
  return false;
}
// into the Testing Environment: your city (as it is this moment, where you stand, its obituary) is put aside first
function tenvEnter(){
  if(WB.pending)return;   // (a big city still being read back in: it can't be put aside half loaded)
  try{savePos();playSave();}catch(e){}
  const park={key:SAVE_KEY,pos:localStorage.getItem(POS_KEY),obit:localStorage.getItem(OBIT_KEY),play:localStorage.getItem(PLAY_KEY)};
  try{localStorage.setItem(TENV_PARK,JSON.stringify(Object.assign({save:saveText()},park)));}
  catch(e){
    // (a city too big for localStorage goes aside in IndexedDB, as its saves do: see worldPut)
    if(!window.indexedDB){try{flashLabel("Can't put your world aside: the browser's storage is full");}catch(e2){}return;}
    svKv('park:'+SAVE_KEY,saveObj()).then(()=>{localStorage.setItem(TENV_PARK,JSON.stringify(Object.assign({idb:1},park)));tenvEnterNow();},
      ()=>{try{flashLabel("Can't put your world aside: the browser's storage is full");}catch(e2){}});
    return;}
  tenvEnterNow();
}
function tenvEnterNow(){
  if(freshWorld([],{boxes:[]}))return;
  // (no storage to reload from: started here and now)
  TENV={boxes:[]};tenvIndex();trInstall();document.getElementById('confirmYes').click();tpShow(true);
}
// and back out: the city you left, just as it was (or, if there isn't one, a brand-new one)
function tenvLeave(){
  let P=null;try{P=JSON.parse(localStorage.getItem(TENV_PARK)||'null');}catch(e){}
  if(P&&P.key===SAVE_KEY&&P.idb){svKv('park:'+SAVE_KEY).then(o=>{if(!o)throw 0;return worldPut(o);}).then(()=>{
      for(const [k,v] of [[POS_KEY,P.pos],[OBIT_KEY,P.obit],[PLAY_KEY,P.play]])if(v)localStorage.setItem(k,v);else localStorage.removeItem(k);
      localStorage.removeItem(TENV_PARK);svKv('park:'+SAVE_KEY,null).catch(()=>{});clearTimeout(saveTimer);saveBlocked=true;location.reload();},
    ()=>{try{flashLabel("Couldn't bring your world back");}catch(e){}});return;}
  if(P&&P.key===SAVE_KEY&&P.save){try{localStorage.setItem(SAVE_KEY,P.save);
    for(const [k,v] of [[POS_KEY,P.pos],[OBIT_KEY,P.obit],[PLAY_KEY,P.play]])if(v)localStorage.setItem(k,v);else localStorage.removeItem(k);
    localStorage.removeItem(TENV_PARK);clearTimeout(saveTimer);saveBlocked=true;location.reload();return;}catch(e){}}
  if(!freshWorld([])){TENV=null;tenvIndex();document.getElementById('confirmYes').click();tpShow(false);}
}
// the chunks a box covers (and one more all round, whose faces meet it) made again from the plan: shown or flat
function tenvRebuild(F){
  const c0x=Math.floor(F.ax*CELL/CS)-1,c1x=Math.floor(((F.ax+F.w)*CELL-1)/CS)+1,c0z=Math.floor(F.az*CELL/CS)-1,c1z=Math.floor(((F.az+F.h)*CELL-1)/CS)+1;
  for(let cx=c0x;cx<=c1x;cx++)for(let cz=c0z;cz<=c1z;cz++){const k=ckey(cx,cz);chunks.delete(k);gfxRecC.delete(k);}
  lastK=-1;
  for(let cx=c0x;cx<=c1x;cx++)for(let cz=c0z;cz<=c1z;cz++)if(meshes.has(ckey(cx,cz)))buildChunk(cx,cz);
  farDirty=true;
}
// Gus (and Gertie) put down on the grass just south of a box, looking at it
function tenvGo(F){
  const x=(F.ax+F.w/2)*CELL,z=(F.az+F.h)*CELL+6;
  for(const p of players){if(!p.active)continue;p.heading=Math.PI;placePlayer(p,new V3(x+(p===P1?0:3),G+1,z));}
  updateChunks(999,0);
  for(const p of players)if(p.active){const f=footprint(p);if(f!==null&&f!==undefined)p.pos.y=f;}
}
function tenvSpawn(key){
  if(!TENV)return;
  const p=players.find(q=>q.active)||P1;
  TS.search={key,cx:Math.floor(p.pos.x/CELL),cz:Math.floor(p.pos.z/CELL),r:0};
  tsSet('Looking for '+stName(key).toLowerCase()+'…');
}
// the search: ring by ring out from Gus, a few milliseconds a frame, passing over any that's already been spawned
function tenvTick(){
  const S=TS.search;if(!S||!TENV){TS.search=null;return;}
  const t0=performance.now(),cx=S.cx,cz=S.cz,R1=stR(S.key);
  for(;S.r<=R1;S.r++){const r=S.r;
    for(let i=-r;i<=r;i++)for(const [px,pz] of (r===0?[[cx,cz]]:Math.abs(i)===r?[[cx+i,cz-r],[cx+i,cz+r]]:[[cx+i,cz-r],[cx+i,cz+r],[cx-r,cz+i],[cx+r,cz+i]])){
      let m=null;TR.d++;try{m=stMatch(S.key,px,pz);}catch(e){}finally{TR.d--;}   // (the plan itself, not what's been moved)
      if(m&&!tenvTaken(m)){TS.search=null;tenvPlace(S.key,m);return;}}
    if(performance.now()-t0>12){S.r++;tsSet('Looking for '+stName(S.key).toLowerCase()+'… ('+Math.round(S.r*CELL).toLocaleString()+' blocks out)');return;}}
  TS.search=null;tsSet('No '+stName(S.key).toLowerCase().replace(/s$/,'')+' within '+(R1*CELL).toLocaleString()+' blocks.');
}
// the nearest ground in front of Gus that a w x h box fits on: clear of the other boxes (a block between them), of
// every box's source, and of the players
function tenvSpot(w,h){
  const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active)||P1,fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);
  // (where it'd ideally go: its middle far enough ahead that its near side is a few steps off)
  const reach=(Math.abs(fx)*w+Math.abs(fz)*h)*CELL/2+6,ix=(p.pos.x+fx*reach)/CELL-w/2,iz=(p.pos.z+fz*reach)/CELL-h/2,ax0=Math.round(ix),az0=Math.round(iz);
  const free=(ax,az)=>{
    for(const B of TENV.boxes){if(ax<B.ax+B.w+1&&B.ax-1<ax+w&&az<B.az+B.h+1&&B.az-1<az+h)return false;if(ax<B.sx+B.w+1&&B.sx-1<ax+w&&az<B.sz+B.h+1&&B.sz-1<az+h)return false;}
    for(const q of players)if(q.active&&q.pos.x>ax*CELL-3&&q.pos.x<(ax+w)*CELL+3&&q.pos.z>az*CELL-3&&q.pos.z<(az+h)*CELL+3)return false;
    return true;};
  let best=null,bd=1e9;
  for(let r=0;r<=14&&!best;r++)for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;
    const ax=ax0+i,az=az0+j;if(!free(ax,az))continue;
    // (in front: its middle ahead of Gus)
    const mx=(ax+w/2)*CELL-p.pos.x,mz=(az+h/2)*CELL-p.pos.z;if(mx*fx+mz*fz<=0)continue;
    const d=Math.hypot(ax-ix,az-iz);if(d<bd){bd=d;best={ax,az};}}
  return best||{ax:ax0,az:az0};
}
function tenvPlace(key,F){
  const T=tenvSpot(F.w,F.h,F),B={k:key,ax:T.ax,az:T.az,w:F.w,h:F.h,sx:F.ax,sz:F.az};
  TENV.boxes.push(B);tenvIndex();linkNearC.clear();tenvRebuild(B);save();
  tsSet(stName(key)+': one spawned just ahead of Gus.');tpRender();
}
// The plan, moved. Inside a moved box (and the ring round it) each of these answers as it would at the box's source,
// what it gives (block positions, a superblock's corner, a station's bays) moved across to where the box is. Only the
// outermost call is moved: the plan's own working, inside it, is all at the source. Keys (a prop's, a door's) stay the
// source's, which is only ever used once. Moved copies are kept per box, so whatever's put on one stays put.
function trMemo(B,o,mk){if(!o||typeof o!=='object')return o;let M=TR.c.get(B);if(!M)TR.c.set(B,M=new WeakMap());let r=M.get(o);if(r===undefined){r=mk(o,(B.ax-B.sx)*CELL,(B.az-B.sz)*CELL,B.ax-B.sx,B.az-B.sz);M.set(o,r);}return r;}
// f's place is arguments i, i+1: in blocks of CELL (u 1) or single blocks (u CELL)
function trWrap(f,i,u,sh){
  const at=(a,b)=>TENV_RM.size?TENV_RM.get(tenvK(Math.floor(a/u),Math.floor(b/u))):undefined;
  return i===0?function(a,b,c,d,e,g){if(TR.d)return f(a,b,c,d,e,g);const B=at(a,b);TR.d++;try{if(!B)return f(a,b,c,d,e,g);const r=f(a+(B.sx-B.ax)*u,b+(B.sz-B.az)*u,c,d,e,g);return sh?sh(r,B):r;}finally{TR.d--;}}
    :function(a,b,c,d,e,g){if(TR.d)return f(a,b,c,d,e,g);const B=at(b,c);TR.d++;try{if(!B)return f(a,b,c,d,e,g);const r=f(a,b+(B.sx-B.ax)*u,c+(B.sz-B.az)*u,d,e,g);return sh?sh(r,B):r;}finally{TR.d--;}};
}
const trCorner=(S,B)=>trMemo(B,S,(S,ox,oz,dx,dz)=>{const T=Object.create(S);T.ax=S.ax+dx;T.az=S.az+dz;return T;});
const trXZ=(o,ox,oz)=>{const T=Object.assign({},o);if(typeof o.x==='number')T.x+=ox;if(typeof o.z==='number')T.z+=oz;return T;};
const trList=(L,B)=>trMemo(B,L,(L,ox,oz)=>L.map(o=>trXZ(o,ox,oz)));
function trInstall(){
  if(TR.on)return;TR.on=true;
  seaPlot=trWrap(seaPlot,0,1);settlementAt=trWrap(settlementAt,0,1);plotType=trWrap(plotType,0,1);plotBounds=trWrap(plotBounds,0,1);
  turbineAt=trWrap(turbineAt,0,1);riverDir=trWrap(riverDir,0,1);nearSea=trWrap(nearSea,0,1);streetTown=trWrap(streetTown,0,1);
  jx=trWrap(jx,0,1);jz=trWrap(jz,0,1);sewerStreet=trWrap(sewerStreet,0,1);stripOpen=trWrap(stripOpen,0,1);segOpen=trWrap(segOpen,0,1);
  ctlAt=trWrap(ctlAt,0,1);jDeg=trWrap(jDeg,0,1);metrosNear=trWrap(metrosNear,0,1);
  metroStation=trWrap(metroStation,0,1,(st,B)=>trMemo(B,st,(st,ox,oz,dx,dz)=>{const T=Object.create(st);T.px=st.px+dx;T.pz=st.pz+dz;return T;}));
  superOf=trWrap(superOf,0,1,trCorner);bigPlainsAt=trWrap(bigPlainsAt,0,1,trCorner);
  plotInfo=trWrap(plotInfo,0,1,(P,B)=>trMemo(B,P,(P,ox,oz,dx,dz)=>{const T=Object.create(P);T.px=P.px+dx;T.pz=P.pz+dz;if(P.super)T.super=trCorner(P.super,B);return T;}));
  streetFurn=trWrap(streetFurn,0,1,trList);
  stationDef=trWrap(stationDef,0,1,(D,B)=>trMemo(B,D,(D,ox,oz,dx,dz)=>Object.assign({},D,{px:D.px+dx,pz:D.pz+dz,key:(D.px+dx)+','+(D.pz+dz),
    bays:D.bays.map(y=>Object.assign({},y,{x:y.x+ox,z:y.z+oz,ex:y.ex+ox,ez:y.ez+oz})),node:{x:D.node.x+ox,z:D.node.z+oz}})));
  // (in single blocks)
  superPart=trWrap(superPart,0,CELL);siteTrees=trWrap(siteTrees,0,CELL);railAt=trWrap(railAt,0,CELL);
  bridgeAt=trWrap(bridgeAt,0,CELL,(br,B)=>trMemo(B,br,(br,ox,oz)=>{const T=Object.assign({},br),s=br.ax?oz:ox,c=br.ax?ox:oz;T.s0+=s;T.s1+=s;T.c0+=c;T.c1+=c;return T;}));
  // (a building's dressing: its place is after the building)
  hospProps=trWrap(hospProps,1,1,trList);furnProps=trWrap(furnProps,1,1,trList);siteProps=trWrap(siteProps,1,1,trList);siteKind=trWrap(siteKind,0,1);bridgeDoor=trWrap(bridgeDoor,1,1);
  doorRects=trWrap(doorRects,1,1,(L,B)=>trMemo(B,L,(L,ox,oz)=>L.map(o=>{const T=Object.assign({},o),a=o.ax==='x'?ox:oz,c=o.ax==='x'?oz:ox;T.a0+=a;T.a1+=a;T.c+=c;return T;})));
  brandSpots=trWrap(brandSpots,1,1,(L,B)=>trMemo(B,L,(L,ox,oz)=>L.map(o=>{const T=trXZ(o,ox,oz);if(o.anc)T.anc=o.anc.map(([x,y,z])=>[x+ox,y,z+oz]);return T;})));
}
function tenvRemove(i){
  const F=TENV&&TENV.boxes[i];if(!F)return;TENV.boxes.splice(i,1);tenvIndex();
  // (gone for good: what was smashed there goes too, so a fresh one can be spawned in its place)
  const X0=F.ax*CELL,Z0=F.az*CELL,X1=X0+F.w*CELL,Z1=Z0+F.h*CELL,inF=(x,z)=>x>=X0&&x<X1&&z>=Z0&&z<Z1;
  for(const k in edits){const [x,,z]=k.split(',').map(Number);if(inF(x,z))delete edits[k];}
  for(const [k,L] of chunkEdits){const f=L.filter(([x,,z])=>!inF(x,z));if(!f.length)chunkEdits.delete(k);else if(f.length<L.length)chunkEdits.set(k,f);}
  for(const k in collapses){const [px,pz]=k.split(',').map(Number);if(px>=F.ax&&px<F.ax+F.w&&pz>=F.az&&pz<F.az+F.h)delete collapses[k];}
  for(let i2=0;i2<F.w;i2++)for(let j=0;j<F.h;j++)explored.delete((F.ax+i2)+','+(F.az+j));
  tenvRebuild(F);save();tsSet(stName(F.k)+' removed.');tpRender();
}
// enemies: a few steps ahead of where the camera looks, spread round that spot (cars further off, to drive in at you)
function tenvFoe(kind){
  if(!TENV)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const car=kind==='police'||kind==='car',fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),d=car?20:8,cx=p.pos.x+fx*d,cz=p.pos.z+fz*d;let made=0;
  for(let i=0;i<TS.n;i++){
    // (a car wants open ground, not a roof or a wall: a few tries for a clear spot)
    let x=cx,z=cz;for(let t=0;t<(car?16:1);t++){const a=Math.random()*Math.PI*2,r=i||t?(car?4:1.2)+Math.random()*(car?8+t:4):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;
      if(!car||groundAt(x,z,G+40)<=G+1.05&&!cars.some(o=>o.alive&&Math.hypot(o.pos.x-x,o.pos.z-z)<5))break;}
    const y=groundAt(x,z,car?G+40:p.pos.y+6),h=Math.atan2(p.pos.x-x,p.pos.z-z);
    if(car){
      let c=cars.find(o=>!o.alive&&!o.ws&&!o.svcPool&&!o.pullPool&&!o.parkPool&&!o.hwPool&&(kind==='police'?o.police:!o.police));
      if(!c){c=makeCar(cars.length,kind==='police');c.g.scale.setScalar(ES);c.respawnT=1e9;cars.push(c);}
      carSpawn(c,{veh:kind==='police'?null:pickVeh('street'),x,y,z,h,hunter:true,parked:false});
      c.driver=makeDriver(kind==='police');c.path=null;c.hw=null;c.rt=null;c.svc=null;c.leaving=false;c.rampKey=null;c.spot=null;c.makeWay=0;
      c.lastInter=-1;made++;continue;}
    if(kind==='cultist'){const g=freeCultist(64);if(!g)continue;
      cultSpawn(g,null,0);g.pos.set(x,y,z);g.heading=h;made++;continue;}
    if(FOES[kind]){const g=freeFoe(kind,64);if(!g)continue;foeSpawn(g,kind,null,0);g.pos.set(x,y,z);g.heading=h;made++;continue;}
    const civ=kind==='civ';
    let g=goblins.find(o=>!!o.civ===civ&&!o.staff&&!o.special&&o.state==='wait');
    if(!g){if(civ)addCiv();else addHostile();g=goblins[goblins.length-1];}
    g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.employer=null;g.claim=null;g.alert=false;g.act=null;g.wt=null;
    if(civ){g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.idle=0;g.screamCD=0;g.fleeing=false;g.detour=0;
      g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=0;g.armL.rotation.x=0;g.id=makeIdentity(g,dressGoblin(g));}
    else if(!spawnGoblin(g,true))continue;
    g.pos.set(x,y,z);g.indoor=false;g.heading=h;
    if(kind==='cop'){
      const L=dressGoblin(g);L.tunic=0x1c2a5a;L.pants=0x1c2a5a;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','apron','eyepatch'].includes(k));L.hatType='cap';L.hat=0x1c2a5a;L.show.push('cap');L.hatShown=L.hat;applyLook(g,L,ES);
      g.id=makeIdentity(g,L);g.id.occ='Police officer, Goblin Police Dept.';foeArm(g,GOB_FOES.police);}
    made++;}
  const nm={goblin:['goblin','goblins'],cultist:['cultist','cultists'],thief:['thief','thieves'],prepper:['prepper','preppers'],militia:['militiaman','militiamen'],cop:['police officer','police officers'],civ:['civilian','civilians'],police:['police car','police cars'],car:['hunting car','hunting cars']}[kind];
  tsSet(made?('Spawned '+made+' '+nm[made>1?1:0]+' ahead of Gus.'):'Couldn\'t spawn any '+nm[1]+' just now.');
}
// vehicles: any kind, a few steps further off than enemies. Hunting, they drive straight at Gus; parked, they sit there
// with nobody in them, to stand on, smash or get into (a parked police car still wakes up when Gus comes close)
const VEH_NAME={car:['car','cars'],van:['van','vans'],pickup:['pickup','pickups'],truck:['truck','trucks'],semi:['semi truck','semi trucks'],bus:['bus','buses'],
  fire:['fire engine','fire engines'],jet:['fighter jet','fighter jets'],balloon:['hot-air balloon','hot-air balloons'],amb:['ambulance','ambulances'],news:['news van','news vans'],rv:['motorhome','motorhomes'],technical:['technical','technicals'],quad:['four-wheeler','four-wheelers'],bicycle:['bicycle','bicycles'],kick:['kick scooter','kick scooters'],segway:['Gobway','Gobways'],moped:['motor scooter','motor scooters'],police:['police car','police cars'],moto:['motorcycle','motorcycles'],motorcycle:['motorcycle','motorcycles'],bike:['motorcycle','motorcycles'],super:['supercar','supercars'],forklift:['forklift','forklifts'],tractor:['tractor','tractors'],hover:['hovercraft','hovercraft'],barge:['barge','barges'],carrier:['aircraft carrier','aircraft carriers'],mech:['Mobile Gear','Mobile Gears'],
  light:['two-seater plane','two-seater planes'],row:['rowboat','rowboats'],pedalo:['pedal boat','pedal boats'],speed:['speedboat','speedboats'],launch:['launch','launches'],
  sail:['sailboat','sailboats'],fish:['fishing boat','fishing boats'],tug:['tug','tugs'],ferry:['ferry','ferries'],cargo:['container ship','container ships'],navy:['warship','warships']};
// the boats that can be spawned (the kinds in BOATS, in this order)
const TENV_BOATS=['row','pedalo','speed','launch','sail','fish','tug','ferry','cargo','navy'];
// every kind of vehicle that can be spawned here, and its name with a capital (the panel's buttons and the debug menu's list)
const tenvVehKinds=()=>[...Object.keys(VEH),'police','tank','heli','plane','light','jet','balloon','mech',...TENV_BOATS,'barge','carrier'];
const tenvVehName=t=>(VEH_NAME[t]||[MIL[t]?MIL[t].name:t])[0].replace(/^./,c=>c.toUpperCase());
// the debug menu's Spawn: one of the kind picked, parked and empty, ready to get into (whatever the panel's count and
// hunting or parked say). What it managed is what the panel would have said
// one vehicle, parked, from the debug menu: in the Testing Environment or out in the city (TS.dbg lets the spawns below
// run outside it, finding the ground wherever the player is rather than on the Testing Environment's flat floor)
function tenvSpawnOne(t){const n=TS.n,vm=TS.vm;TS.n=1;TS.vm='park';TS.dbg=true;
  try{tenvVeh(t);}finally{TS.n=n;TS.vm=vm;TS.dbg=false;}const el=document.getElementById('tpInfo');return el?el.textContent:'';}
// is there room at x,z for a vehicle reaching r out from its middle? Level ground, and clear of every car, tank,
// helicopter and plane already there (an airliner's wings reach about 12 out, a fighter jet's under 4: planeDim)
// the ground's height under x,z for a spawn: the Testing Environment's flat floor, or out in the city the first surface
// down from a little above the player (so a hillside, not the inside of the hill, and not a roof far overhead)
function spGround(x,z){if(TENV&&x<SHIP_X0)return groundAt(x,z,G+40);const p=players.find(q=>q.active)||P1;return groundAt(x,z,Math.min(H-2,p.pos.y+24));}
function tenvRoom(x,z,r){
  if(TENV&&x<SHIP_X0){if(groundAt(x,z,G+40)>G+1.05)return false;}
  // (out in the city, or on a ship's deck: level within a block across the vehicle's footprint, and not water)
  else{const y=spGround(x,z),k=r*0.7;if(get(Math.floor(x),Math.floor(y)-1,Math.floor(z))===WATER)return false;
    for(const [ox,oz] of [[k,0],[-k,0],[0,k],[0,-k]])if(Math.abs(spGround(x+ox,z+oz)-y)>1.05)return false;}
  if(cars.some(o=>o.alive&&Math.hypot(o.pos.x-x,o.pos.z-z)<r+4))return false;
  const A=venues.get('tenvArmy');if(A&&A.mil.some(M=>!M.dead&&Math.hypot(M.x-x,M.z-z)<r+3.5))return false;
  const L=venues.get('tenvPlanes');if(L&&L.pl.some(pl=>!pl.dead&&Math.hypot(pl.g.position.x-x,pl.g.position.z-z)<r+planeDim(pl).wx+0.5))return false;
  const Mg=venues.get('tenvMechs');if(Mg&&Mg.mechs.some(M=>Math.hypot(M.x-x,M.z-z)<r+3))return false;
  const Bl=venues.get('tenvBalloons');if(Bl&&Bl.bl.some(B=>Math.hypot(B.x-x,B.z-z)<r+BAL.er))return false;
  return true;
}
function tenvVeh(t){
  if(MIL[t]){tenvMil(t);return;}
  // (these stay out in the world even beside a ship, so spawned from aboard one they're put by where Gus really is)
  if(t==='plane'||t==='jet'||t==='light'){shipOutside(()=>tenvPlane(t==='jet',t==='light'));return;}
  if(BOATS[t]){shipOutside(()=>tenvBoat(t));return;}
  if(t==='balloon'){shipOutside(tenvBalloon);return;}
  if(t==='mech'){shipOutside(tenvMech);return;}
  if(SHIP_KINDS[t]){tenvShip(t);return;}
  if(t==='technical'||t==='quad'){tenvCrew(t);return;}
  if(!TENV&&!TS.dbg)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const park=TS.vm==='park',pol=t==='police',fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),cx=p.pos.x+fx*20,cz=p.pos.z+fz*20;let made=0;
  for(let i=0;i<TS.n;i++){
    // (open ground, not a roof or a wall, and not on top of another vehicle: a few tries for a clear spot)
    let x=cx,z=cz;for(let k=0;k<20;k++){const a=Math.random()*Math.PI*2,r=i||k?4+Math.random()*(10+k*1.5):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;
      if(tenvRoom(x,z,5))break;}
    const y=spGround(x,z),h=Math.atan2(p.pos.x-x,p.pos.z-z);
    // (parked ones come from the parked cars' pool, which sits still; hunters from the traffic's)
    const pk=park&&!pol;
    let c=cars.find(o=>!o.alive&&!o.ws&&!o.svcPool&&!o.pullPool&&!o.rvPool&&!o.hwPool&&!!o.parkPool===pk&&!!o.police===pol);
    if(!c){c=makeCar(cars.length,pol);c.g.scale.setScalar(ES);c.respawnT=1e9;if(pk)c.parkPool=true;cars.push(c);}
    carSpawn(c,{veh:pol?null:t,x,y,z,h,hunter:!park,parked:park});
    c.driver=pk?null:makeDriver(pol);if(c.dh)c.dh.visible=!pk;
    c.path=null;c.hw=null;c.rt=null;c.svc=null;c.leaving=false;c.rampKey=null;c.spot=null;c.makeWay=0;c.rusted=false;c.paint.color.setHex(c.color);
    c.lastInter=-1;made++;}
  const nm=VEH_NAME[t]||[t,t+'s'];
  tsSet(made?('Spawned '+made+' '+(park?'parked ':'hunting ')+nm[made>1?1:0]+' ahead of Gus.'):'Couldn\'t spawn any '+nm[1]+' just now.');
}
// the army's armour, in the Testing Environment: a base of its own with no ground (so walking about never sets it off),
// its tanks and helicopters put down a little way ahead of Gus. Hunting, they come straight for him (and stand down,
// back where they were put, once he's been well away a while); parked, they sit until he hurts one, then all come
function tenvArmy(){let V=venues.get('tenvArmy');
  if(!V){V={kind:'army',B:{ax:0,az:0,w:0,h:0},X0:0,Z0:0,W:0,Hh:0,cx:0,cz:0,mil:[],alert:false,awayT:0};venues.set('tenvArmy',V);}return V;}
function tenvMil(kind){
  if(!TENV&&!TS.dbg)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const park=TS.vm==='park',V=tenvArmy(),fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),cx=p.pos.x+fx*26,cz=p.pos.z+fz*26;let made=0;
  for(let i=0;i<TS.n;i++){
    let x=cx,z=cz;for(let k=0;k<24;k++){const a=Math.random()*Math.PI*2,r=i||k?6+Math.random()*(12+k*1.5):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;
      if(tenvRoom(x,z,kind==='heli'?6:4))break;}
    const h=Math.atan2(p.pos.x-x,p.pos.z-z),mk=kind==='tank'?makeTank():makeHeli();TS.mil=(TS.mil||0)+1;
    const M=Object.assign({isMil:true,crew:MIL_CREW[kind],kind,V,x,y:spGround(x,z),z,h,tu:0,hp:MIL[kind].hp,dead:false,key:'mil:tenv:'+Date.now()+':'+TS.mil,home:{x,z,h},state:park?'park':'hunt',
      cd:1.5+i*0.4,rcd:6,burst:0,bt:0,stuck:0,v:0,vy:0,spin:0,oa:Math.random()*6.3,hurt:0},mk);
    scene.add(M.g);milPlace(M);V.mil.push(M);made++;}
  if(!park&&made){V.alert=true;V.awayT=0;}
  V.cx=p.pos.x;V.cz=p.pos.z;   // (where it stands down from: how far Gus has gone is measured from here)
  const nm=kind==='tank'?['tank','tanks']:['helicopter','helicopters'];
  tsSet('Spawned '+made+' '+(park?'parked ':'hunting ')+nm[made>1?1:0]+' ahead of Gus.');
}
// planes, in the Testing Environment: an airliner parked on the grass ahead of Gus, nose pointing the way he's looking,
// so it can be got into and taken straight off (no runway needed: any flat run of about 40 blocks). They're kept in an
// airport of their own (the 'tenvPlanes' venue, flagged tenv, so updateAirport's timetable leaves them be)
function tenvPlane(jet,light){
  if(!TENV&&!TS.dbg)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  let V=venues.get('tenvPlanes');if(!V){V={kind:'airport',tenv:true,planes:[],pl:[]};venues.set('tenvPlanes',V);}
  const fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);let made=0;
  for(let i=0;i<TS.n;i++){
    // (each a wingspan apart, side by side across where Gus is looking, on open ground clear of the others)
    const sm=jet||light;let x=0,z=0,ok=false;for(let k=0;k<30&&!ok;k++){const side=(i%2?1:-1)*Math.ceil(i/2)*(sm?14:30)+(k?(Math.random()-.5)*k*4:0),ahead=(sm?24:36)+(k?Math.random()*k*3:0);
      x=p.pos.x+fx*ahead-fz*side;z=p.pos.z+fz*ahead+fx*side;
      const y0=spGround(x,z);const Q=jet?JET_DIM:light?LIGHT_DIM:PLANE_DIM;ok=tenvRoom(x,z,Q.wx+0.5)&&Math.abs(spGround(x+fx*Q.hz,z+fz*Q.hz)-y0)<1.05&&Math.abs(spGround(x-fx*Q.hz,z-fz*Q.hz)-y0)<1.05;}
    if(!ok)continue;
    const g=jet?makeJet():light?makeLightPlane(V.planes.length):makePlane(V.planes.length);g.position.set(x,spGround(x,z),z);g.rotation.set(0,Math.atan2(fx,fz),0);scene.add(g);
    V.planes.push(g);V.pl.push({isPlane:true,jet:!!jet,light:!!light,g,hp:light?LIGHT_HP:PLANE_HP,dead:false,v:0});made++;}
  tsSet(made?'Spawned '+made+(jet?' fighter jet':light?' two-seater plane':' plane')+(made>1?'s':'')+'.':'There\'s no clear ground for a plane just ahead. Try looking another way.');
}
// the Mobile Gear (see vehicles/mech.js): only here for now. Each press stands as many as the count says a little way
// ahead of Gus, facing him, empty, to climb into. They're kept in a venue of their own, 'tenvMechs'
function tenvMech(){
  if(!TENV&&!TS.dbg)return;const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  let V=venues.get('tenvMechs');if(!V){V={kind:'mech',mechs:[]};venues.set('tenvMechs',V);}
  const fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),cx=p.pos.x+fx*14,cz=p.pos.z+fz*14;let made=0;
  for(let i=0;i<TS.n;i++){let x=cx,z=cz,ok=false;
    for(let k=0;k<24&&!ok;k++){const a=Math.random()*Math.PI*2,r=i||k?5+Math.random()*(10+k*1.5):0;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;ok=tenvRoom(x,z,3)&&mgFits(x,spGround(x,z),z);}
    if(!ok)continue;const M=newMech(V,x,z,Math.atan2(p.pos.x-x,p.pos.z-z));made++;
    {const gy=mgGround(x,z,H+60,M);if(gy>M.y)M.y=gy;}}   // (over a ship: up on its deck, the top of the box that stands for it)
  if(!V.mechs.length)venues.delete('tenvMechs');
  tsSet(made?'Spawned '+made+' Mobile Gear'+(made>1?'s':'')+'. Goblins only.':'No room for a Mobile Gear just there.');
}
// boats: on open water ahead of Gus, pointing the way he's looking, tied up where they're put and empty, to swim out to and
// take the helm of (as Gnash or Grizzle). In the Testing Environment a sea is laid out first if there isn't one big enough;
// out in the city it has to be water that's already there. Each is a boat venue of its own, keyed 'tenvBoat:n', which
// refreshVenues keeps wherever it was put
let tenvBoatN=0;
// the top of the water a boat of kind K would float on at x,z heading yaw, if it's deep enough everywhere under it (else null)
function tenvBoatWater(K,x,z,yaw){
  const tx=Math.sin(yaw),tz=Math.cos(yaw),d=Math.ceil(K.d)+1,top=y=>get(x0,y,z0);let wy=null,x0=0,z0=0;
  for(let a=-K.L/2;a<=K.L/2+0.01;a+=Math.max(1,K.L/12))for(const c of [-K.W/2-0.5,0,K.W/2+0.5]){
    x0=Math.floor(x+tx*a+tz*c);z0=Math.floor(z+tz*a-tx*c);if(!chunks.has(ckey(Math.floor(x0/CS),Math.floor(z0/CS))))return null;
    let y=G+1;while(y>G-3&&top(y)!==WATER)y--;if(top(y)!==WATER||top(y+1)!==AIR)return null;
    if(wy===null)wy=y;else if(y!==wy)return null;
    if(top(y-d)!==WATER)return null;}
  return wy===null?null:wy+1;
}
function tenvBoat(k){
  const p=players.find(q=>q.active&&q.deadT<=0)||players.find(q=>q.active);if(!p)return;
  const K=BOATS[k],yaw=Math.atan2(-Math.sin(p.cam.yaw),-Math.cos(p.cam.yaw)),fx=Math.sin(yaw),fz=Math.cos(yaw),nm=VEH_NAME[k];
  // (in the Testing Environment: a sea ahead, made, moved or grown for it, tenvSeaFor)
  if(TENV)tenvSeaFor(p.pos.x,p.pos.z,fx,fz,Math.max(80,Math.ceil(K.L*1.5)));
  const taken=(x,z)=>{for(const [key,V] of venues)if(key.startsWith('tenvBoat:')&&!V.bo.dead&&Math.hypot(V.boat.position.x-x,V.boat.position.z-z)<(V.bo.L+K.L)/2+3)return true;
    const Vs=venues.get('tenvShips');return!!(Vs&&Vs.ships.some(S=>Math.hypot(S.x-x,S.z-z)<K.L/2+60));};
  let made=0;
  for(let i=0;i<TS.n;i++){let x=0,z=0,y0=null;
    // (the nearest open water straight ahead, a little to either side, out to 300 blocks)
    for(let d=Math.max(10,K.L/2+6);d<=300&&y0===null;d+=4)for(const side of [0,-K.W*2-4,K.W*2+4,-K.W*5-10,K.W*5+10]){x=p.pos.x+fx*d-fz*side;z=p.pos.z+fz*d+fx*side;
      if(TENV){for(let cx=Math.floor((x-K.L)/CS);cx<=Math.floor((x+K.L)/CS);cx++)for(let cz=Math.floor((z-K.L)/CS);cz<=Math.floor((z+K.L)/CS);cz++)chunkArr(cx,cz);}
      if(taken(x,z))continue;y0=tenvBoatWater(K,x,z,yaw);if(y0!==null)break;}
    if(y0===null)break;
    boatVenue('tenvBoat:'+(++tenvBoatN),k,{x,z,yaw,y0:y0-0.15},new Set());made++;}
  tsSet(made?'Spawned '+made+' '+nm[made>1?1:0]+' ahead of Gus.':'No open water deep enough for a '+nm[0]+' just ahead.');
}
function updateTenvPlanes(V,dt){
  for(const pl of V.pl){
    if(!pl.dead&&pl.g.visible)vehSmoke('plane',pl,pl.g.position.x,pl.g.position.y+3,pl.g.position.z,dt);
    if(pl.dead){planeWreck(pl,V,dt);planeBoxes(pl,0);}
    else if(pl.free){drvPlane(pl,dt);if(!pl.dead){planeBoxes(pl,pl.free.v);if(pl.free.v>=2)planeStrike(pl,pl.free.v);}}
    else planeBoxes(pl,0);}
}
function tenvClear(){
  for(const g of goblins)if(g.state!=='wait'){g.state='wait';g.t=0;g.root.visible=false;g.cop=null;g.inv=false;g.ff=null;g.medic=null;g.news=null;g.vendor=null;g.claim=null;g.act=null;g.homeV=null;}
  fbClear();
  for(const c of cars)if(c.alive&&!c.svcPool){c.alive=false;c.g.visible=false;c.hunter=false;c.respawnT=1e9;}
  // (the tanks and helicopters too, all but one Gus is driving)
  {const V=venues.get('tenvArmy');if(V){V.mil=V.mil.filter(M=>{if(players.some(q=>q.drv&&q.drv.o===M))return true;if(M.g.parent)M.g.parent.remove(M.g);return false;});V.alert=false;if(!V.mil.length)venues.delete('tenvArmy');}}
  {const V=venues.get('tenvMechs');if(V){V.mechs=V.mechs.filter(M=>{if(players.some(q=>q.drv&&q.drv.o===M))return true;scene.remove(M.g);return false;});if(!V.mechs.length)venues.delete('tenvMechs');}}
  {const V=venues.get('tenvBalloons');if(V){V.bl=V.bl.filter(B=>{if(players.some(q=>q.drv&&q.drv.o===B))return true;scene.remove(B.g);return false;});if(!V.bl.length)venues.delete('tenvBalloons');}}
  shipsClear();
  for(const [key,V] of venues)if(key.startsWith('tenvBoat:')&&!players.some(q=>q.drv&&q.drv.o===V.bo)){scene.remove(V.boat);venues.delete(key);}
  {const V=venues.get('tenvPlanes');if(V){V.pl=V.pl.filter(pl=>{if(players.some(q=>q.drv&&q.drv.o===pl))return true;scene.remove(pl.g);return false;});V.planes=V.pl.map(pl=>pl.g);if(!V.pl.length)venues.delete('tenvPlanes');}}
  tsSet('Cleared every goblin and vehicle.');
}
document.getElementById('testWorld').addEventListener('click',()=>{if(TENV)tpShow(true);else tenvEnter();});
document.getElementById('tpGo').addEventListener('click',()=>startPlay());
document.getElementById('tpNormal').addEventListener('click',()=>tenvLeave());
document.getElementById('tpClear').addEventListener('click',()=>tenvClear());
// a big blast ahead of Gus (big-blast.js), set off once the menu's closed
{const r=document.getElementById('tpBBR'),v=document.getElementById('tpBBRVal');
 r.addEventListener('input',()=>{v.textContent=r.value;});
 document.getElementById('tpBB').addEventListener('click',()=>{BB.pendR=+r.value;startPlay();});}
// Reset world: everything spawned, smashed or killed here gone, a fresh empty Testing Environment (a second press, within a
// few seconds, to be sure)
function tenvReset(){
  if(!TENV)return;
  if(freshWorld([],{boxes:[]}))return;
  TENV={boxes:[]};tenvIndex();tenvClear();document.getElementById('confirmYes').click();tpShow(true);
}
{const b=document.getElementById('tpReset');let armT=0;
 b.addEventListener('click',()=>{if(performance.now()<armT){armT=0;b.textContent='Reset world';tenvReset();return;}
   armT=performance.now()+4000;b.textContent='Sure? Press again';tsSet('Press Reset world again to clear out everything spawned and smashed here.');
   setTimeout(()=>{if(performance.now()>=armT){armT=0;b.textContent='Reset world';}},4100);});}
for(const b of document.querySelectorAll('#tpVM [data-vm]'))b.addEventListener('click',()=>{TS.vm=b.dataset.vm;tpRender();});
for(const b of document.querySelectorAll('#tpFoes [data-foe]'))b.addEventListener('click',()=>tenvFoe(b.dataset.foe));
for(const b of document.querySelectorAll('#tpN [data-n]'))b.addEventListener('click',()=>{TS.n=+b.dataset.n;tpRender();});
// where Gus was standing last time (in this city): saved every couple of seconds and when the page closes
const POS_KEY='goblin-stompin-gus-pos';
function savePos(){try{if(saveBlocked||netGuest()||!P1.active||P1.deadT>0||!isFinite(P1.pos.x)||P1.pos.x>=SHIP_X0)return;
  let x=P1.pos.x,y=P1.pos.y,z=P1.pos.z;
  // (in a vehicle: on the ground under it, where it's made again on loading (ui/play-save.js), or he gets out if it can't be)
  if(P1.drv){const S=drvPose(P1.drv);if(!(S.x<SHIP_X0)||![S.x,S.y,S.z].every(Number.isFinite))return;x=S.x;z=S.z;y=groundAt(x,z,S.y+0.5);if(!(y>0))return;}
  else if(!P1.grounded||P1.state!=='walk')return;   // (only where he's standing: never mid-jump, mid-boost or clinging to a wall)
  localStorage.setItem(POS_KEY,JSON.stringify({seed,x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2),h:+P1.heading.toFixed(3),yaw:+P1.cam.yaw.toFixed(3)}));}catch(e){}}
function loadPos(){try{const q=JSON.parse(localStorage.getItem(POS_KEY)||'null');if(q&&q.seed===seed&&[q.x,q.y,q.z].every(Number.isFinite)&&q.y>0&&q.y<H)return q;}catch(e){}return null;}
addEventListener('pagehide',savePos);addEventListener('beforeunload',savePos);
document.addEventListener('visibilitychange',()=>{if(document.hidden)savePos();});
function boot(){
  P1.active=true;P1.heading=0;
  const sp=loadPos();
  if(sp){P1.heading=sp.h||0;placePlayer(P1,new V3(sp.x,sp.y,sp.z));if(Number.isFinite(sp.yaw))P1.cam.yaw=sp.yaw;P1.spawnSnap=true;}
  else placePlayer(P1,new V3(10.5,G+1,10.5));
  if(P2.active){P2.heading=P1.heading;placePlayer(P2,sp?findStreet(P1.pos.x,P1.pos.z,3,6):new V3(13.5,G+1,13.5));}
  updateChunks(999,0);
  // (once the ground under him has been built, stand him back on it)
  if(sp){const f=footprint(P1);if(f!==null&&f!==undefined&&f>=P1.pos.y-1.5)P1.pos.y=f;}
  try{playPlayer(P1);}catch(e){}   // (his health, weapons and the vehicle he was in: ui/play-save.js)
  layout();
  seedLine();   // (ui/saves.js: the version, the seed and where it's saved)
  if(TENV)tpShow(true);
}
if(!load())seed=(Math.random()*1e9)|0;
playLoad();   // (the score, this rampage, the clock and weather as they were: ui/play-save.js)
if(TENV)trInstall();
resize();
boot();
requestAnimationFrame(frame);
