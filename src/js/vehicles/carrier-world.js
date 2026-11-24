// ---- Aircraft carriers out in the world (outside the Testing Environment): one at anchor off each naval base, in open
// water just off the coast, found once from the seed (cvSite). It's the Testing Environment's carrier in every way (ships.js,
// carrier.js, its crew and deck weapons, its jets, breaking up, online co-op through net-sync.js's ship list): only how it
// comes and goes is different. It's made when a player comes within CV_LOAD of its anchorage (each in a venue of its own,
// 'cv'+patch, with V.cvKey) and dropped once nobody's within CV_UNLOAD of it or of anything broken off it, nobody's aboard
// and nobody's driving it or one of its jets. It remembers everything (cvSnap, into wrecked[key], so it's saved with the
// world, goes in save slots and exports, and reaches guests online): where it was left and which way it pointed, its
// health and leaks, every block smashed aboard (packed, relative to the ship), its hull's count and where it's broken off
// (the ends that broke away had sunk), its knocked-over and lost furniture, its wrecked deck weapons, and its jets (where
// each is parked and how hurt, or gone). Taken when it's dropped and whenever the world's saved; made again from it by
// cvRestore. Sunk (its health gone, not just broken up), it's gone for good: wrecked[key] is 1. Only the host (or a game
// on its own) makes them; a guest gets the host's, as any ship. ----
const CV_LOAD=600,CV_UNLOAD=850,CV_PATCH=8*CELL;   // (a naval base's patch of the map: portCell's, 8 plots a side)
const cvSiteC=new Map();let cvSiteSeed=null;
// is the sea open enough for the carrier at x,z facing yaw: deep water, nothing built out there (an oil rig), under its
// whole footprint and a margin round it? Worked out from the map's plan alone, so nothing needs generating to know
function cvOpen(x,z,yaw){
  const K=SHIP_KINDS.carrier,m=14,c=Math.cos(yaw),s=Math.sin(yaw),seen=new Map();
  for(let u=K.u0-m;u<=K.u1+1+m;u+=6)for(let w=K.w0-m;w<=K.w1+1+m;w+=6){
    const X=x+u*c+w*s,Z=z-u*s+w*c,px=Math.floor(X/CELL),pz=Math.floor(Z/CELL),k=px*100003+pz;
    let ok=seen.get(k);if(ok===undefined){ok=seaPlot(px,pz)===2&&plotType(px,pz)==='sea';seen.set(k,ok);}
    if(!ok)return false;}
  return true;
}
// the anchorage off the naval base in the patch cx,cz (in CV_PATCH units), or null if there's no base there or no
// room: the nearest open water to the base's yard, lying along the coast (or else straight out from it)
function cvSite(cx,cz){
  if(cvSiteSeed!==seed){cvSiteC.clear();cvSiteSeed=seed;}
  const k=cx*100003+cz;if(cvSiteC.has(k))return cvSiteC.get(k);let v=null;
  if(!TENV&&!TEST_OFF.has('navy')&&portCell(cx*8,cz*8)==='navy'){
    let n=0,bx=0,bz=0;
    for(let a=0;a<8;a++)for(let b=0;b<8;b++){const px=cx*8+a,pz=cz*8+b;if(coastType(px,pz)==='navy'){n++;bx+=px*CELL+CELL/2;bz+=pz*CELL+CELL/2;}}
    if(n){bx/=n;bz/=n;const a0=hash2(cx*71+5,cz*97+3)*Math.PI*2,flip=hash2(cx*13+1,cz*29+7)<0.5?Math.PI:0;
      for(let d=120;d<=640&&!v;d+=16)for(let i=0;i<24&&!v;i++){const A=a0+i*Math.PI/12,x=bx+Math.cos(A)*d,z=bz+Math.sin(A)*d;
        for(const yaw of [Math.atan2(-Math.sin(A),Math.cos(A))+flip,Math.atan2(Math.cos(A),Math.sin(A))])
          if(cvOpen(x,z,yaw)){v={key:'cv'+cx+','+cz,x:Math.round(x)+0.5,z:Math.round(z)+0.5,yaw,bx,bz};break;}}}}
  if(cvSiteC.size>20000)cvSiteC.clear();cvSiteC.set(k,v);return v;
}
// where a viewer really is (aboard a ship, its place out in the world)
const cvVX=p=>p.pos.x>=SHIP_X0?pwx(p):p.pos.x,cvVZ=p=>p.pos.x>=SHIP_X0?pwz(p):p.pos.z;
// a carrier made at its anchorage (or where it was left, as it was: st), stopped, crew aboard
function cvSpawn(site,st){
  const o=st&&typeof st==='object'?st:null,S=makeShip('carrier',o?o.x:site.x,o?o.z:site.z,o?o.yaw:site.yaw),V={kind:'ship',ships:[S],cv:S,cvKey:site.key,seed};
  S.cvKey=site.key;S.V=V;venues.set(site.key,V);if(o)cvRestore(S,o);
  return S;
}
// ---- remembering one: what's changed about it, small enough to save with the world ----
const cvR2=v=>Math.round(v*100)/100;
function cvPack(a){let t='';for(let i=0;i<a.length;i+=4096)t+=String.fromCharCode.apply(null,a.slice(i,i+4096));return btoa(t);}
function cvUnpack(t){const s=atob(t),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a;}
function cvSnap(S){
  const st={x:cvR2(S.x),z:cvR2(S.z),yaw:cvR2(S.yaw),hp:cvR2(S.hp),leak:cvR2(S.leak||0)};
  // (every block smashed or put aboard and in the water round it: u, y, w and the block, a byte each)
  const [a,b,c,d]=shipChunkBox(S),B=[];
  for(let cx=a;cx<=b;cx++)for(let cz=c;cz<=d;cz++){const ck=ckey(cx,cz),L=chunkEdits.get(ck);if(!L)continue;
    editsEach(ck,L,(x,y,z,bl)=>{const u=x-S.ox,w=z-S.oz;
      if(bl===undefined||bl>255||u<-127||u>127||w<-127||w>127||y<0||y>255)return;B.push(u+128,y,w+128,bl);});}
  if(B.length)st.ed=cvPack(B);
  const Hl=S.hull;if(Hl&&(Hl.tot!==Hl.tot0||S.K.base))st.hull=[Hl.a,Hl.b,Hl.tot,Array.from(Hl.n),Array.from(Hl.n0)];
  if(S.K.base)st.cut=[S.K.w0,S.K.w1];
  if(S.props){const L=[];S.props.forEach((f,i)=>{if(f.gone)L.push([i,-9]);else if(f.down!==undefined||f.fall)L.push([i,cvR2(f.down!==undefined?f.down:f.fall.ang)]);});if(L.length)st.pr=L;}
  if(S.mounts)st.mt=S.mounts.map(Mt=>Mt.dead?-1:Math.round(Mt.hp));
  // (its jets: each one's place parked aboard and its health; one its own pilot is flying, back home where it's parked; 0 for
  // one that's gone: wrecked, or taken off by a player)
  st.jt=CV_JETS.map(([s,w,h],i)=>{const pl=S.jetV&&S.jetV.pl.find(q=>q.home===i);if(!pl||pl.dead||players.some(q=>q.drv&&q.drv.o===pl))return 0;
    if(pl.ai)return[0.5-s,G+17,w+0.5,h,Math.round(pl.hp)];
    const P=pl.g.position;if(pl.free&&pl.free.air||P.x<SHIP_X0||shipOfPos(P.x,P.z)!==S)return 0;
    return[cvR2(P.x-S.ox),cvR2(P.y),cvR2(P.z-S.oz),cvR2(pl.g.rotation.y),Math.round(pl.hp)];});
  return st;
}
// ...and made again as it was (just after makeShip, before any of its chunks are made)
function cvRestore(S,st){
  if(st.cut)cvCut(S,st.cut[0],st.cut[1]);
  // (its smashed blocks, into the pocket's edits so its chunks are made with them; and, online, sent to the guests a
  // moment later, once they've made their copy of it: cvWorldRefresh)
  if(st.ed){const B=cvUnpack(st.ed),L=[];for(let i=0;i+3<B.length;i+=4){const x=S.ox+B[i]-128,y=B[i+1],z=S.oz+B[i+2]-128,b=B[i+3];
    editPut(x,y,z,b);L.push(x,y,z,b);}
    shipForget(S.slot,true);if(netHost())S.cvEd=L;}
  const Hl=S.hull;if(Hl&&st.hull){const [a,b,tot,n,n0]=st.hull;if(n.length===Hl.n.length){Hl.a=a;Hl.b=b;Hl.tot=tot;Hl.n.set(n);Hl.n0.set(n0);}}
  S.hp=st.hp;S.leak=st.leak||0;
  if(st.pr&&S.props){for(const [i,v] of st.pr){const f=S.props[i];if(!f)continue;if(v===-9)f.gone=true;else f.down=v;}}
  if(S.props)S.propsT=0.05;   // (drawn again in a moment: any whose floor's gone, gone)
  if(st.mt&&S.mounts)st.mt.forEach((h,i)=>{const Mt=S.mounts[i];if(!Mt||Mt.dead)return;
    if(h<0){Mt.dead=true;Mt.hp=0;Mt.g.traverse(o=>{if(o.isMesh)o.material=mtMat(0x1e1f21);});Mt.head.rotation.z=0.35;Mt.lift.rotation.x=0.5;if(Mt.caps)for(const c of Mt.caps)c.visible=false;}
    else Mt.hp=Math.min(Mt.hp,h);});
  if(st.jt){cvJetsKeep(S,i=>!!st.jt[i]);if(S.jetV)for(const pl of S.jetV.pl){const j=st.jt[pl.home];pl.g.position.set(S.ox+j[0],j[1],S.oz+j[2]);pl.g.rotation.y=j[3];pl.hp=Math.min(pl.hp,j[4]);}}
  // (for an online guest's copy: where it's cut and which jets it has, netShips' e[15], cvNetApply)
  if(st.cut||st.jt&&st.jt.some(j=>!j))S.cvNet=[st.cut||0,st.jt?st.jt.map(j=>j?1:0):0];
}
// broken (as shipBreak leaves it): only w from a to b left afloat, and what was on the rest gone with it
function cvCut(S,a,b){
  const base=S.K.base||S.K,gone=w=>w<a||w>b;
  S.K=Object.assign(Object.create(base),{base,w0:a,w1:b,block:(u,y,w)=>gone(w)?0:base.block(u,y,w),
    boxes:base.boxes?base.boxes.filter(q=>q[3]>=a&&q[2]<=b).map(q=>[q[0],q[1],Math.max(q[2],a),Math.min(q[3],b),q[4],q[5]]):null,
    doors:base.doors?()=>base.doors().filter(d=>!gone(d.ax==='w'?d.a0:d.c)):undefined});S.bx=null;
  const Hl=S.hull;if(Hl){for(let j=0;j<Hl.n.length;j++)if(gone(Hl.w0+j*SHIP_SL)){Hl.tot-=Hl.n[j];Hl.n[j]=0;Hl.n0[j]=0;}Hl.a=Math.max(Hl.a,a);Hl.b=Math.min(Hl.b,b);}
  if(S.crewV)for(const P of S.crewV.posts)if(gone(Math.floor(P.z)-S.oz))P.cut=true;
  if(S.props)for(const f of S.props)if(gone(Math.floor(f.z)-S.oz))f.gone=true;
  for(const Mt of S.mounts||[])if(gone(Math.floor(Mt.z)-S.oz)){Mt.dead=true;Mt.hp=0;if(Mt.g.parent)Mt.g.parent.remove(Mt.g);}
  if(S.jetV)cvJetsKeep(S,i=>{const z=S.oz+CV_JETS[i][1];return !gone(Math.floor(z)-S.oz);});
}
// only the jets whose places (CV_JETS) keep(i) says, the rest taken away
function cvJetsKeep(S,keep){const JV=S.jetV;if(!JV)return;
  JV.pl=JV.pl.filter(pl=>{if(keep(pl.home))return true;if(pl.g.parent)pl.g.parent.remove(pl.g);return false;});JV.planes=JV.pl.map(pl=>pl.g);
  if(!JV.pl.length){venues.delete('shipJets:'+S.n);S.jetV=null;}}
// (an online guest's copy of a carrier the host remembered: cut where the host's is and with the same jets, from netShips)
function cvNetApply(S,c){if(!c||S.kind!=='carrier')return;if(c[0])cvCut(S,c[0][0],c[0][1]);if(c[1])cvJetsKeep(S,i=>!!c[1][i]);}
// every carrier out now remembered as it is (when the world's saved)
function cvSnapAll(){if(TENV||netGuest())return;for(const [k,V] of venues)if(V.cvKey&&V.cv&&!V.cv.dead&&V.ships.includes(V.cv))wrecked[k]=cvSnap(V.cv);}
{const s0=save;let t=null;save=function save(){clearTimeout(t);t=setTimeout(cvSnapAll,500);s0();};}
// is anyone using it: aboard, at its helm or a deck weapon, or flying one of its jets?
function cvBusy(V){
  for(const p of players){if(!p.active)continue;const S=shipOf(p);if(S&&V.ships.includes(S))return true;
    const o=p.drv&&p.drv.o;if(o&&(V.ships.includes(o)||o.S&&V.ships.includes(o.S)))return true;}
  return false;
}
// a carrier (and anything broken off it) dropped: its crew stood down and put away, then the ships themselves
function cvDrop(V){
  if(V.cv&&!V.cv.dead&&V.ships.includes(V.cv)&&V.seed===seed&&wrecked[V.cvKey]!==1)wrecked[V.cvKey]=cvSnap(V.cv);
  for(const S of [...V.ships]){const C=S.crewV;
    if(C)for(let i=0;i<C.slots.length;i++){const g=C.slots[i];if(g&&g.homeV===C){g.state='wait';g.t=0;g.root.visible=false;g.homeV=null;}C.slots[i]=null;}
    if(S.jetV){const JV=S.jetV;JV.pl=JV.pl.filter(pl=>{if(players.some(q=>q.drv&&q.drv.o===pl))return true;if(pl.g.parent)pl.g.parent.remove(pl.g);return false;});JV.planes=JV.pl.map(pl=>pl.g);}
    shipDrop(S);}
  V.ships.length=0;venues.delete(V.cvKey);
}
// once a second (from refreshVenues): make the carriers players have come near, drop the ones they've left, and note any
// that's sunk. want: the venues to keep
function cvWorldRefresh(want){
  if(TENV||netGuest())return;
  for(const [k,V] of [...venues]){if(!V.cvKey)continue;
    // (sunk: never again. The venue goes once it's under and everything broken off it has gone too)
    if(V.cv.dead&&wrecked[k]!==1){wrecked[k]=1;save();}
    if(!V.ships.length||V.seed!==seed){cvDrop(V);continue;}
    if(V.cv.cvEd){const L=V.cv.cvEd;V.cv.cvEd=null;if(netHost())for(const p of NET.guests.values())for(let i=0;i<L.length;i+=3000)p.net.out.push(['e',L.slice(i,i+3000)]);}
    let near=cvBusy(V);
    for(const p of viewers()){if(near)break;const x=cvVX(p),z=cvVZ(p);for(const S of V.ships)if(Math.hypot(S.x-x,S.z-z)<CV_UNLOAD){near=true;break;}}
    if(near)want.add(k);else cvDrop(V);}
  const vs=viewers().map(p=>[cvVX(p),cvVZ(p)]),near=(x,z)=>vs.some(([a,b])=>Math.hypot(x-a,z-b)<CV_LOAD);
  // (one remembered where it was left, wherever that is now)
  for(const k in wrecked){const st=wrecked[k];if(k[0]!=='c'||k[1]!=='v'||!st||typeof st!=='object'||venues.has(k)||!near(st.x,st.z))continue;
    const [cx,cz]=k.slice(2).split(',').map(Number),s=cvSite(cx,cz);if(s&&s.key===k){cvSpawn(s,st);want.add(k);}}
  // (and the rest, at their anchorages)
  for(const [x,z] of vs){
    for(let cx=Math.floor((x-CV_LOAD-CV_PATCH)/CV_PATCH);cx<=Math.floor((x+CV_LOAD+CV_PATCH)/CV_PATCH);cx++)
      for(let cz=Math.floor((z-CV_LOAD-CV_PATCH)/CV_PATCH);cz<=Math.floor((z+CV_LOAD+CV_PATCH)/CV_PATCH);cz++){
        const s=cvSite(cx,cz);if(!s||wrecked[s.key]||venues.has(s.key)||!near(s.x,s.z))continue;
        cvSpawn(s,null);want.add(s.key);}}
}
