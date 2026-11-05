// ---- emergency services ----
// Each station sends its vehicle along the streets (a breadth-first route over the street grid, never through a
// superblock) to the nearest bit of road; fire engines hose the fires down, ambulance crews tend the dead and carry them
// off, police officers get out and look around the scene, and come after you if they spot you.
const crimes=[];let svcT=0,svcSirenT=0;
// news crews cover fires, car wrecks and killings: one call per scene, however many things go wrong there
const newsCalls=[],NEWS_R=16,NEWS_TAKE=24;
function reportNews(x,z,what){if(!playing)return;const k=newsCalls.find(o=>Math.hypot(o.x-x,o.z-z)<30);if(k)k.t=playTime;else newsCalls.push({x,z,what,t:playTime,sentT:-1e9,next:0});}
function reportCrime(x,z){if(!playing)return;const k=crimes.find(o=>Math.hypot(o.x-x,o.z-z)<24);if(k){k.t=playTime;k.n++;}else crimes.push({x,z,t:playTime,n:1});}
// ---- the stations: each has three bays its vehicles live in (the fire station's engine bays, three bays of the
// hospital's car park by the doors for the ambulances, three in the police station's own lot). A vehicle goes out from
// its bay and comes back to it; one that's lost (destroyed, or gone off somewhere) is replaced after a while, but only
// when nobody's looking at its bay.
const STN=new Map();
function ambBayIdx(P){const L=P.lots&&P.lots[0];if(!L)return[];const b=P.b[0],cx=b.er&&b.er.mode==='front'?b.er.door:(b.x0+b.x1)/2;
  return lotBays(L).map((o,k)=>[k,Math.abs(o.x-cx)]).sort((a,c)=>a[1]-c[1]).slice(0,3).map(a=>a[0]);}
const stnTier=(px,pz)=>{const S=settlementAt(px,pz);return!S?1:S.type==='city'?3:S.type==='large'?2:1;};
function stationDef(px,pz){
  const k='st'+px+','+pz;let D=superCache.get(k);if(D!==undefined)return D;D=null;
  const S=superOf(px,pz),X0=px*CELL,Z0=pz*CELL,P=plotInfo(px,pz);
  let kind=null,bays=null;
  if(S&&S.ax===px&&S.az===pz&&S.kind==='hospital'&&P.lots&&P.lots[0]){kind='amb';const L=P.lots[0],LB=lotBays(L);bays=ambBayIdx(P).slice(0,stnTier(px,pz)).map(i=>LB[i]).map(o=>({x:X0+o.x,z:Z0+o.z,h:o.h+Math.PI}));}   // (reversed in: they sit nose-out)
  else if(S&&S.ax===px&&S.az===pz&&S.kind==='police'){const L=P.lots&&P.lots.find(L=>L.police);if(L){kind='police';bays=lotBays(L).filter((o,i)=>i%2===1).slice(0,stnTier(px,pz)).map(o=>({x:X0+o.x,z:Z0+o.z,h:o.h}));}}
  // a small town's police post: one block, the patrol car out front
  else if(!S&&plotType(px,pz)==='police'&&P.b[0]){kind='police';const b=P.b[0];bays=[0,1].slice(0,stnTier(px,pz)).map(i=>({x:X0+PL0+4+i*5,z:Z0+b.z0-3,h:0}));}
  else if(!S&&plotType(px,pz)==='fire'&&P.b[0]&&P.b[0].bays){kind='fire';const b=P.b[0];bays=b.bays.map(cx=>({x:X0+cx+0.5,z:Z0+b.z0+4.5,h:Math.PI}));}
  // a TV station: its vans out front, noses to the street, either side of the doors
  else if(!S&&plotType(px,pz)==='news'&&P.b[0]){kind='news';const b=P.b[0];bays=[3,15,6].slice(0,stnTier(px,pz)).map(u=>({x:X0+PL0+u,z:Z0+b.z0-2.4,h:Math.PI}));}
  if(kind&&bays&&bays.length){
    // each bay's way out: a few blocks straight back from the bay (out through the engine doors, or into the car park's aisle)
    for(const y of bays){const f=kind==='fire'||kind==='news'?6.5:kind==='amb'?4.5:-4.5;y.ex=y.x+Math.sin(y.h)*f;y.ez=y.z+Math.cos(y.h)*f;}   // (engines drive out forwards; the others back out of their bays)
    const B=P.b[0]&&P.b[0].brand;D={key:px+','+pz,px,pz,kind,bays,B,node:{x:px*CELL+RC,z:pz*CELL+RC}};
  }
  superCache.set(k,D);return D;
}
function stnState(D){let T=STN.get(D.key);if(!T){T={slots:D.bays.map(()=>({st:'home',t:0,car:null}))};STN.set(D.key,T);}return T;}
const stnDown=D=>collapses[D.key+',0']!==undefined;
// put a vehicle from the pool into a bay
function svcPark(c,D,i){
  const y=D.bays[i];c.pos.set(y.x,G+1,y.z);c.heading=y.h;c.speed=0;c.kv.set(0,0,0);c.hp=45;c.alive=true;c.hunter=false;c.parked=false;c.vy=0;c.reverseT=0;c.stuckT=0;c.hurt=0;c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.spot=null;
  c.paint.emissive.setHex(0);c.g.visible=true;c.driver=makeDriver(D.kind==='police');c.g.position.copy(c.pos);c.g.rotation.set(0,c.heading,0);
  c.svc={kind:D.kind,st:'parked',stn:D,slot:i,B:D.B,path:[],t:0,tx:y.x,tz:y.z,home:D.node,stuck:0,rev:0};
  stnState(D).slots[i].car=c;
  if(c.newsLogo&&D.B){c.newsStripe.color.setHex(parseInt(D.B.bg.slice(1),16));for(const m of c.newsLogo)m.material=brandTex(D.B,3.7);}   // (the pool's vans are painted for whichever station they turn out for)
}
function svcRelease(c){const S=c.svc;if(S&&S.stn){const sl=stnState(S.stn).slots[S.slot];if(sl.car===c)sl.car=null;}c.alive=false;c.g.visible=false;c.svc=null;c.respawnT=1e9;}
// the stations within reach of the players keep their bays filled (as far as the pool goes); far ones are put away
let stnT=0;
function updateStations(dt){
  stnT-=dt;if(stnT>0)return;stnT=0.5;
  const act=players.filter(p=>p.active);if(!act.length)return;
  const R=Math.min(viewFar()+30,190),near=new Set();
  for(const p of act){const c0=Math.floor((p.pos.x-R)/CELL),c1=Math.floor((p.pos.x+R)/CELL),d0=Math.floor((p.pos.z-R)/CELL),d1=Math.floor((p.pos.z+R)/CELL);
    for(let px=c0;px<=c1;px++)for(let pz=d0;pz<=d1;pz++){if(!tenvShow(px,pz))continue;const D=stationDef(px,pz);if(D&&!stnDown(D)&&Math.hypot(D.bays[0].x-p.pos.x,D.bays[0].z-p.pos.z)<R)near.add(D);}}
  // parked vehicles of stations nobody's near any more go back in the pool
  for(const c of SVC)if(c.alive&&c.svc&&c.svc.st==='parked'&&(!near.has(c.svc.stn)||stnDown(c.svc.stn)))svcRelease(c);
  for(const D of near){const T=stnState(D);
    D.bays.forEach((y,i)=>{const sl=T.slots[i];
      if(sl.st==='gone'&&playTime>=sl.t&&!visibleToAny(y.x,G+2,y.z))sl.st='home';   // a replacement turns up while nobody's watching
      if(sl.st==='home'&&!sl.car){const c=SVC.find(o=>!o.alive&&o.svcPool===D.kind);if(c)svcPark(c,D,i);}});}
}
// the station of a kind (with a vehicle at home) nearest to (x,z), and which bay
function pickStation(kind,x,z){
  let best=null;const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),news=kind==='news',R=news?NEWS_R:7;   // (TV stations are rare, so their vans come further)
  for(let i=cx-R;i<=cx+R;i++)for(let j=cz-R;j<=cz+R;j++){if(news&&(superOf(i,j)||plotType(i,j)!=='news'))continue;const D=stationDef(i,j);if(!D||D.kind!==kind||stnDown(D))continue;
    const T=stnState(D),k=T.slots.findIndex(sl=>sl.st==='home');if(k<0)continue;const d=Math.hypot(D.node.x-x,D.node.z-z);if(!best||d<best.d)best={D,k,d};}
  return best;
}
function nearestStation(kind,x,z){
  let best=null;const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),R=7,seen=new Set();
  for(let i=cx-R;i<=cx+R;i++)for(let j=cz-R;j<=cz+R;j++){
    let ax=i,az=j,ok=false;const S=superOf(i,j);
    if(S){ax=S.ax;az=S.az;ok=(kind==='amb'&&S.kind==='hospital')||(kind==='police'&&S.kind==='police');}
    else{const t=plotType(i,j);ok=(kind==='fire'&&t==='fire')||(kind==='police'&&t==='police')||(kind==='amb'&&t==='hospital');}
    if(!ok)continue;const key=ax+','+az;if(seen.has(key))continue;seen.add(key);
    if(collapses[key+',0']!==undefined)continue;
    const sx=ax*CELL+RC,sz=az*CELL+RC,d=Math.hypot(sx-x,sz-z);
    if(!best||d<best.d){const b=plotInfo(ax,az).b[0];best={x:sx,z:sz,d,B:b&&b.brand};}
  }
  return best;
}
// a route from (sx,sz) to the nearest open street beside (tx,tz): node centres, then the stopping point
// minD: stop no nearer than this to the target or any fire round it (fire engines keep their distance and use the hose)
// potholes: a stretch of street between two junctions is 'holed' if the road surface along its middle (and a lane
// either side) has been smashed through anywhere. Checked lazily and remembered for a few seconds.
const holeCache=new Map();
const edgeKey=(i,j,d)=>{const ni=i+DIRV[d][0],nj=j+DIRV[d][1];return 'e'+Math.min(i,ni)+','+Math.min(j,nj)+(d%2);};
function holeOn(i,j,d){
  const k=edgeKey(i,j,d),h=holeCache.get(k);if(h&&playTime-h.t<4)return h.bad;
  const x0=i*CELL+RC,z0=j*CELL+RC,[dx,dz]=DIRV[d];let bad=false;
  // (a chunk nothing's been smashed in is as it was built, with its road whole, and needn't be looked at. Looking meant making the
  // chunks along every street between the station and the scene there and then, a long stall each time a crew was sent out.
  // The odd gap a street has of its own, the driver spots and goes round: svcDrive looks ahead as it goes.)
  for(let t=0;t<=CELL&&!bad;t+=1)for(const l of [-1.6,0,1.6]){const x=x0+dx*t+dz*l,z=z0+dz*t+dx*l,ck=ckey(Math.floor(x/CS),Math.floor(z/CS));if(!chunkEdits.has(ck))continue;if(groundAt(x,z,G+3)<G+0.5){bad=true;break;}}
  holeCache.set(k,{t:playTime,bad});return bad;
}
// a route through a roundabout can't cut across its island (the bushes in the middle stop a truck dead): the junction's
// waypoint is swapped for a run of them round the circle, the same way the traffic goes (clockwise seen from above,
// island on the left), from where the route comes in to where it leaves
function svcRounds(pts,sx,sz){
  const out=[];
  for(let n=0;n<pts.length;n++){const b=pts[n];
    if(b.last||n===pts.length-1){out.push(b);continue;}
    const ix=Math.floor(b.x/CELL),iz=Math.floor(b.z/CELL);
    if(ctlAt(ix,iz).k!=='round'){out.push(b);continue;}
    const cx=ix*CELL+ROADW/2,cz=iz*CELL+ROADW/2,a=n?pts[n-1]:{x:sx,z:sz},c=pts[n+1];
    const tin=Math.atan2(a.z-cz,a.x-cx),tout=Math.atan2(c.z-cz,c.x-cx);
    let sweep=((tin-tout)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);if(sweep<0.3)sweep+=Math.PI*2;   // (straight back the way it came: once round)
    const steps=Math.max(2,Math.ceil(sweep/0.55));
    for(let k=0;k<=steps;k++){const f=tin-sweep*k/steps;out.push({x:cx+Math.cos(f)*RB_R,z:cz+Math.sin(f)*RB_R,turn:true,rb:true});}
  }
  return out;
}
const svcGap=k=>k==='fire'||k==='news'?10:0;   // (how far back from the scene it stops)
function svcRoute(sx,sz,tx,tz,off,ban,minD){off=off||0;minD=minD||0;
  let goal=null;const bx=Math.floor(tx/CELL),bz=Math.floor(tz/CELL);
  const hot=[];for(const F of fires)if(F.t>0.3&&Math.hypot(F.x-tx,F.z-tz)<40)hot.push(F);
  const heat=(x,z)=>{let m=1e9;for(const F of hot){const d=Math.hypot(F.x-x,F.z-z);if(d<m)m=d;}return m;};
  if(minD>0){
    // walk every open street round about in 2-block steps: the nearest spot to the target that's far enough from every fire
    for(let i=bx-2;i<=bx+2;i++)for(let j=bz-2;j<=bz+2;j++)for(const ax of [0,1]){if(!segOpen(i,j,ax))continue;
      for(let t=2;t<=CELL-2;t+=2){const X=ax?i*CELL+RC+t:i*CELL+RC,Z=ax?j*CELL+RC:j*CELL+RC+t,d=Math.hypot(X-tx,Z-tz);
        if(d<minD||heat(X,Z)<minD-1)continue;if(!goal||d<goal.d)goal={d,x:X,z:Z,a:[i,j],b:ax?[i+1,j]:[i,j+1]};}}
  }
  if(!goal)for(let i=bx-2;i<=bx+2;i++)for(let j=bz-2;j<=bz+2;j++){
    if(segOpen(i,j,0)){const X=i*CELL+RC,Z=Math.max(j*CELL+RC+2,Math.min((j+1)*CELL+RC-2,tz+off)),d=Math.hypot(X-tx,Z-tz);if(!goal||d<goal.d)goal={d,x:X,z:Z,a:[i,j],b:[i,j+1]};}
    if(segOpen(i,j,1)){const Z=j*CELL+RC,X=Math.max(i*CELL+RC+2,Math.min((i+1)*CELL+RC-2,tx+off)),d=Math.hypot(X-tx,Z-tz);if(!goal||d<goal.d)goal={d,x:X,z:Z,a:[i,j],b:[i+1,j]};}
  }
  if(!goal||goal.d>40)return null;
  const s0=[Math.round((sx-RC)/CELL),Math.round((sz-RC)/CELL)],K=(i,j)=>(i+30000)*65536+(j+30000);
  const lo0=Math.min(s0[0],goal.a[0])-4,hi0=Math.max(s0[0],goal.a[0])+5,lo1=Math.min(s0[1],goal.a[1])-4,hi1=Math.max(s0[1],goal.a[1])+5;
  // first try to keep off any stretch of street with a hole smashed in it; if there's no way round, go anyway
  let prev,end=null;
  for(const avoid of [true,false]){
    prev=new Map([[K(s0[0],s0[1]),null]]);const q=[s0];end=null;
    while(q.length){const [i,j]=q.shift();
      if((i===goal.a[0]&&j===goal.a[1])||(i===goal.b[0]&&j===goal.b[1])){end=[i,j];break;}
      for(let d=0;d<4;d++){if(!segOpen(i,j,d))continue;const ni=i+DIRV[d][0],nj=j+DIRV[d][1];if(ni<lo0||ni>hi0||nj<lo1||nj>hi1)continue;const k=K(ni,nj);if(prev.has(k))continue;
        if(ban&&ban.has(edgeKey(i,j,d)))continue;
        if(((ban&&ban.has(ni+','+nj))||(hot.length&&heat(ni*CELL+RC,nj*CELL+RC)<7))&&!((ni===goal.a[0]&&nj===goal.a[1])||(ni===goal.b[0]&&nj===goal.b[1])))continue;
        if(avoid&&holeOn(i,j,d))continue;
        prev.set(k,[i,j]);q.push([ni,nj]);}}
    if(end)break;
  }
  if(!end)return null;
  const nodes=[];for(let n=end;n;n=prev.get(K(n[0],n[1])))nodes.unshift(n);
  const pts=nodes.map(([i,j])=>({x:i*CELL+RC,z:j*CELL+RC,turn:false}));
  for(let n=1;n<pts.length-1;n++){const a=pts[n-1],b=pts[n],c=pts[n+1];pts[n].turn=Math.sign(b.x-a.x)!==Math.sign(c.x-b.x)||Math.sign(b.z-a.z)!==Math.sign(c.z-b.z);}
  pts.push({x:goal.x,z:goal.z,turn:true,last:true});
  return svcRounds(pts,sx,sz);
}
function svcStart(c,kind,pick,tx,tz){
  const D=pick.D,i=pick.k,y=D.bays[i],T=stnState(D);
  const pts=svcRoute(y.ex,y.ez,tx,tz,kind==='amb'?8:kind==='police'?-8:0,null,svcGap(kind));if(!pts||!pts.length)return false;
  if(!c||!(c.alive&&c.svc&&c.svc.stn===D&&c.svc.slot===i))svcPark(c,D,i);   // (not on show: it starts from its bay unseen)
  // out of the bay, then off along the streets
  c.svc={kind,st:'go',path:[{x:y.ex,z:y.ez,turn:true},...pts],t:0,tx,tz,home:D.node,stn:D,slot:i,stuck:0,rev:0,B:D.B};
  T.slots[i].st='out';T.slots[i].car=c;
  return true;
}
// back to the station: along the streets to its corner, out of the traffic to the bay's apron, and into the bay
function svcHome(c){const S=c.svc,D=S.stn,y=D&&D.bays[S.slot];
  if(!y||stnDown(D))return null;const pts=svcRoute(c.pos.x,c.pos.z,y.ex,y.ez,0)||[];return[...pts,{x:y.ex,z:y.ez,turn:true},{x:y.x,z:y.z,turn:true,last:true,bay:true,rev:S.kind==='amb'||S.kind==='news'}];}
function svcDone(c,lost){
  const S=c.svc;
  if(S&&S.st==='parked'&&!lost){svcRelease(c);return;}
  if(S&&S.stn){const sl=stnState(S.stn).slots[S.slot];if(sl.car===c)sl.car=null;sl.st='gone';sl.t=playTime+(lost?90:20);}
  // whoever it brought along heads off with it
  for(const g of goblins){if(g.news&&g.news.car===c){endNews(g);if(g.state==='chase'){g.state='wait';g.root.visible=false;g.t=0;}}if(g.ff&&g.ff.car===c){g.ff=null;if(g.state==='chase'){g.state='wait';g.root.visible=false;g.t=0;}}if(g.medic&&g.medic.car===c){g.medic=null;if(g.state==='chase'){g.state='wait';g.root.visible=false;g.t=0;}}if(g.cop&&g.cop.car===c&&g.inv){g.state='wait';g.root.visible=false;g.t=0;g.cop=null;g.inv=false;}if(g.claim===c)g.claim=null;}
  c.alive=false;c.g.visible=false;c.svc=null;c.respawnT=1e9;
}
// a fresh route from where it is now, steering clear of the junction it was stuck heading for
function svcReroute(c,noNode){
  const S=c.svc,W=S.path[0];if(!W)return;
  S.ban=S.ban||new Set();if(!W.last&&!noNode)S.ban.add(Math.round((W.x-RC)/CELL)+','+Math.round((W.z-RC)/CELL));
  // (start from the junction behind it, so the new way doesn't lead straight back through the blockage)
  if(S.st!=='go'&&S.stn){const p=svcHome(c);if(p&&p.length){S.path=p;S.rev=0.6;}return;}
  const go=S.st==='go',bx=c.pos.x-Math.sin(c.heading)*12,bz=c.pos.z-Math.cos(c.heading)*12,pts=svcRoute(bx,bz,go?S.tx:S.home.x,go?S.tz:S.home.z,go?(S.kind==='amb'?8:S.kind==='police'?-8:0):0,S.ban,go?svcGap(S.kind):0);
  if(pts&&pts.length){if(Math.hypot(pts[0].x-c.pos.x,pts[0].z-c.pos.z)<3&&pts.length>1)pts.shift();S.path=pts;S.rev=0.6;}
}
// out of ideas: take on another call-out of the same kind nearby if there is one, otherwise head back to the station
function svcGiveUp(c){
  const S=c.svc;
  if(S.st==='go'){
    for(const g of goblins)if(g.claim===c)g.claim=null;
    let nt=null;const far=(x,z)=>Math.hypot(x-S.tx,z-S.tz)>20&&!SVC.some(o=>o!==c&&o.alive&&o.svc&&o.svc.st!=='parked'&&o.svcPool===c.svcPool&&Math.hypot(o.svc.tx-x,o.svc.tz-z)<20);
    if(S.kind==='fire'){for(const F of fires)if(F.t>3&&far(F.x,F.z)){nt=[F.x,F.z];break;}}
    else if(S.kind==='amb'){for(const g of goblins)if(g.state==='dead'&&!g.claim&&g.t<9&&far(g.pos.x,g.pos.z)){nt=[g.pos.x,g.pos.z];break;}}
    else if(S.kind==='news'){for(const k of newsCalls)if(playTime-k.sentT>45&&far(k.x,k.z)){nt=[k.x,k.z];k.sentT=playTime;S.story=k.what;break;}}
    else{for(const k of crimes)if(!k.sent&&far(k.x,k.z)){nt=[k.x,k.z];k.sent=true;break;}}
    if(nt){const pts=svcRoute(c.pos.x,c.pos.z,nt[0],nt[1],0,null,svcGap(S.kind));if(pts&&pts.length){S.tx=nt[0];S.tz=nt[1];S.path=pts;S.tries=0;S.ban=null;S.t=0;
      if(S.kind==='amb')for(const g of goblins)if(g.state==='dead'&&!g.claim&&Math.hypot(g.pos.x-nt[0],g.pos.z-nt[1])<16)g.claim=c;return;}}
    S.tries=0;S.ban=null;svcLeave(c);
  } else svcDone(c);
}
// a fire engine that's finished: the nearest other fire nobody else is seeing to, if one's within reach
function svcNextFire(c){
  const S=c.svc;let best=null,bd=1e9;
  for(const F of fires){if(F.t<2||Math.hypot(F.x-S.tx,F.z-S.tz)<18)continue;const d=Math.hypot(F.x-c.pos.x,F.z-c.pos.z);if(d>200||d>=bd)continue;
    if(SVC.some(o=>o!==c&&o.alive&&o.svc&&o.svc.st!=='parked'&&o.svcPool==='fire'&&Math.hypot(o.svc.tx-F.x,o.svc.tz-F.z)<24))continue;
    if(!players.some(p=>p.active&&Math.hypot(p.pos.x-F.x,p.pos.z-F.z)<160))continue;bd=d;best=F;}
  if(!best)return false;
  const pts=svcRoute(c.pos.x,c.pos.z,best.x,best.z,0,null,10);if(!pts||!pts.length)return false;
  S.st='go';S.t=0;S.tx=best.x;S.tz=best.z;S.path=pts;S.wrap=false;S.tries=0;S.ban=null;S.stuck=0;S.douseT=0;
  return true;
}
function svcLeave(c){const S=c.svc;const pts=S.stn?svcHome(c):svcRoute(c.pos.x,c.pos.z,S.home.x,S.home.z);S.st='leave';S.t=0;S.path=pts||[];}
function svcDrive(c,dt){
  const S=c.svc;if(!S){svcDone(c);return;}
  if(S.st==='parked'){c.speed*=Math.exp(-dt*6);return;}
  S.t+=dt;
  if(S.st==='go'||S.st==='leave'){
    const W=S.path[0];
    if(!W){if(S.st==='go'){S.st='work';S.t=0;svcArrive(c);}else if(S.stn&&!stnDown(S.stn)){const D=S.stn,i=S.slot;stnState(D).slots[i].st='home';svcPark(c,D,i);}else svcDone(c);return;}
    const dx=W.x-c.pos.x,dz=W.z-c.pos.z,dist=Math.hypot(dx,dz);
    if(dist<(W.bay?1.2:W.last?1.8:W.rb?1.5:2.8)){S.path.shift();return;}
    S.holeT=(S.holeT||0)-dt;
    if(S.holeT<=0&&!W.bay&&!W.rev){S.holeT=0.3;const fx=Math.sin(c.heading),fz=Math.cos(c.heading);let hole=false;
      for(const a of [3,4.5,6])if(groundAt(c.pos.x+fx*a,c.pos.z+fz*a,G+3)<G+0.5){hole=true;break;}
      if(hole&&dist>4){const ai=Math.round((c.pos.x-fx*10-RC)/CELL),aj=Math.round((c.pos.z-fz*10-RC)/CELL),bi=Math.round((W.x-RC)/CELL),bj=Math.round((W.z-RC)/CELL);
        const d=bi>ai?1:bi<ai?3:bj>aj?0:2;S.ban=S.ban||new Set();const ek=edgeKey(ai,aj,d);
        if(!S.ban.has(ek)){S.ban.add(ek);holeCache.set(ek,{t:playTime,bad:true});c.speed=Math.min(c.speed,2);svcReroute(c,true);return;}}}
    if(S.st==='go'&&svcGap(S.kind)){let m=1e9;for(const F of fires)if(F.t>0.3){const d=Math.hypot(F.x-c.pos.x,F.z-c.pos.z);if(d<m)m=d;}if(m<9&&Math.hypot(S.tx-c.pos.x,S.tz-c.pos.z)<26){S.path.length=0;c.speed*=0.5;return;}}
    if(W.rev){
      let df=Math.atan2(-dx,-dz)-c.heading;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;   // the back pointing at the bay
      c.heading+=Math.max(-1.6*dt,Math.min(1.6*dt,df));c.steer=Math.max(-1,Math.min(1,-df*2));
      const want=-Math.min(2.6,0.4+dist*0.8)*(Math.abs(df)<0.6?1:0.25);c.speed+=(want-c.speed)*Math.min(1,dt*3);
      S.revT=(S.revT||0)+dt;if(S.revT>14){S.path.shift();S.revT=0;}   // can't get in: it's parked as near as makes no odds
      // reversing beeps
      S.beepT=(S.beepT||0)-dt;if(S.beepT<=0){S.beepT=0.6;const n=nearestPlayer(c.pos.x,c.pos.z,false);if(n&&n.d<35)tone('square',1050,1050,0.18,0.025*Math.max(0.1,1-n.d/35));}
      return;}
    let diff=Math.atan2(dx,dz)-c.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    if(S.rev>0){S.rev-=dt;c.speed=Math.max(-4,c.speed-10*dt);c.heading-=Math.sign(diff)*dt*1.2;return;}
    const rate=Math.max(1.4,Math.min(3.4,Math.abs(c.speed)*0.4));c.heading+=Math.max(-rate*dt,Math.min(rate*dt,diff));c.steer=Math.max(-1,Math.min(1,diff*2));
    let target=14;if(W.turn)target=Math.min(target,3.5+dist*0.75);if(W.last)target=Math.min(target,1+dist*0.7);if(Math.abs(diff)>0.7)target=Math.min(target,3);
    const sh=Math.sin(c.heading),ch=Math.cos(c.heading);S.blk=null;
    for(const o of cars){if(o===c||!o.alive)continue;const ox=o.pos.x-c.pos.x,oz=o.pos.z-c.pos.z,along=ox*sh+oz*ch,lat=Math.abs(ox*ch-oz*sh);if(along>0&&along<9+c.hz&&lat<1.6&&Math.abs(o.pos.y-c.pos.y)<2){if(!o.svcPool&&(!S.blk||along<S.blkD)){S.blk=o;S.blkD=along;}if(o.svcPool||Math.abs(o.speed)<0.3&&S.stuck>1.5){if(W.last&&dist<16&&S.st==='go'){S.path.shift();return;}if(o.svcPool)continue;}target=Math.min(target,along<4+c.hz?0:2);}}   // (another crew's already parked at the scene: stop behind it)
    if(target<c.speed)c.speed=Math.max(target,c.speed-14*dt);else c.speed=Math.min(target,c.speed+7*dt);
    // stuck behind something: back up a little and try again; hopelessly stuck, give up and go home
    if(Math.abs(c.speed)<0.4&&(target>1||S.blk)){S.stuck+=dt;if(S.stuck>2.5){S.stuck=0;S.tries=(S.tries||0)+1;
      // a car in the way: tell it to back off. Otherwise back up a little, and every other time find another way round
      if(S.blk&&S.blk.alive&&!S.blk.parked&&!S.blk.hunter&&!S.blk.hw&&!S.blk.path)S.blk.makeWay=2.2;
      if(S.tries%2===0)svcReroute(c);else S.rev=0.8;
      if(S.tries>8)svcGiveUp(c);}}else if(Math.abs(c.speed)>2)S.stuck=0;
    // the siren
    if(S.st==='go'&&S.kind!=='news'){const n=nearestPlayer(c.pos.x,c.pos.z,false);if(n&&n.d<70){svcSirenT-=dt;if(svcSirenT<=0){svcSirenT=0.5;const att=Math.max(0.08,1-n.d/70),hi=Math.floor(S.t*2)%2,f=S.kind==='amb'?(hi?960:720):S.kind==='fire'?(hi?620:520):(hi?1040:780);tone('sine',f,f*1.02,0.45,0.03*att);tone('triangle',f,f,0.45,0.02*att);}}}
    return;
  }
  // at the scene
  c.speed*=Math.exp(-dt*5);
  if(S.kind==='fire'){
    let near=null,nd=1e9;for(const F of fires){if(F.t<=0.3||Math.hypot(F.x-S.tx,F.z-S.tz)>18)continue;const d=Math.hypot(F.x-c.pos.x,F.z-c.pos.z);if(d<nd){nd=d;near=F;}}   // (the fires round the call-out)
    const crew=goblins.filter(g=>g.ff&&g.ff.car===c&&g.state==='chase');
    if(!near||S.t>50){S.wrap=true;if(!crew.length||S.t>65){if(!svcNextFire(c))svcLeave(c);}return;}   // (crew back aboard: on to the next fire, if there's one going)
    const hosing=crew.some(g=>g.ff.ph==='spray');
    // the hose: an arcing stream from the top of the engine to the fire
    const sx=c.pos.x,sy=c.pos.y+2.6*ES,sz=c.pos.z;
    if(!hosing)for(let n=0;n<3;n++){const u=Math.random(),x=sx+(near.x-sx)*u,z=sz+(near.z-sz)*u,y=sy+(near.y+0.5-sy)*u+Math.sin(Math.PI*u)*Math.min(6,nd*0.25);puff(x,y,z,1,Math.random()<0.5?0xcfeaff:0x9fd2ff,0.32);}
    S.douseT=(S.douseT||0)-dt;
    if(S.douseT<=0){S.douseT=0.4;noise(0.35,0.05,2400,'highpass');
      for(const F of fires){if(Math.hypot(F.x-near.x,F.z-near.z)<12){if(!F.douse)F.t=Math.min(F.t,8);F.douse=true;F.t-=1.2;smoke(F.x,F.y+0.5,F.z,1,0xdddddd);}}}
  } else if(S.kind==='amb'){
    if(!S.crew){S.crew=true;}
    const busy=goblins.some(g=>g.medic&&g.medic.car===c&&g.state==='chase');
    if((!busy&&S.t>2)||S.t>45)svcLeave(c);
  } else if(S.kind==='police'){
    const busy=goblins.some(g=>g.cop&&g.cop.car===c&&g.state==='chase');
    if((!busy&&S.t>3)||S.t>70)svcLeave(c);
  } else if(S.kind==='news'){
    // the crew gets out if there's anyone about to see it, and shoots until the piece is done (or they've been chased off)
    const crew=goblins.filter(g=>g.news&&g.news.car===c&&g.state==='chase');
    if(!crew.length&&!S.fled&&S.t<NEWS_TAKE-4)svcArrive(c);
    if(S.t>NEWS_TAKE)S.wrap=true;
    if(S.fled||S.t>=NEWS_TAKE){if(!crew.length)svcLeave(c);else if(S.t>NEWS_TAKE+20){for(const g of crew){endNews(g);g.state='wait';g.root.visible=false;g.t=0;}svcLeave(c);}}
  }
}
function svcArrive(c){
  const S=c.svc,side=[Math.cos(c.heading)*1.8,-Math.sin(c.heading)*1.8];
  if(S.kind==='fire'){
    // two firefighters in turnout gear and red helmets get down and take the hoses in
    const free=goblins.filter(o=>o.staff&&o.state==='wait');
    for(let n=0;n<Math.min(2,free.length);n++){const g=free[n];
      g.pos.set(c.pos.x+side[0]*(n?-1:1),c.pos.y,c.pos.z+side[1]*(n?-1:1));g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=0;g.fleeing=false;g.detour=0;g.vendor=null;g.indoor=false;g.employer=null;g.medic=null;
      g.heading=0;g.root.visible=true;g.root.rotation.set(0,0,0);
      const L=dressGoblin(g);L.tunic=0xc2a24e;L.pants=0x9a8240;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','pouch','apron'].includes(k));L.hatType='hardhat';L.hat=0xc62828;L.show.push('hardhat');L.hatShown=L.hat;applyLook(g,L,ES);
      g.id=makeIdentity(g,L);g.id.occ='Firefighter at Goblin '+(S.B?brandName(S.B):'Fire Station');
      g.ff={car:c,ph:'go',side:n?-1:1};}
  }
  if(S.kind==='amb'){
    // a crew of two hops out to see to the bodies
    const list=goblins.filter(o=>o.state==='dead'&&o.claim===c);if(!list.length)return;
    const free=goblins.filter(o=>o.staff&&o.state==='wait');
    for(let n=0;n<Math.min(2,free.length);n++){const g=free[n];
      g.pos.set(c.pos.x+side[0]*(n?-1:1),c.pos.y,c.pos.z+side[1]*(n?-1:1));g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=0;g.fleeing=false;g.detour=0;g.vendor=null;g.indoor=false;g.employer=null;
      g.heading=0;g.root.visible=true;g.root.rotation.set(0,0,0);
      const L=dressGoblin(g);L.tunic=0x2f6fb3;L.pants=0x23324f;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','pouch','apron'].includes(k));L.hatType='none';L.hatShown=L.skin;applyLook(g,L,ES);
      g.id=makeIdentity(g,L);g.id.occ='Paramedic at Goblin '+(S.B?brandName(S.B):'Hospital');
      g.medic={car:c,list:n?list.slice().reverse():list,ph:'walk',t:0,cur:null,walkT:0};}
  } else if(S.kind==='police'){
    // two officers get out and have a look round
    const free=goblins.filter(o=>!o.civ&&!o.special&&o.state==='wait');
    for(let n=0;n<Math.min(2,free.length);n++){const g=free[n];spawnGoblin(g,true);
      g.pos.set(c.pos.x+side[0]*(n?-1:1),c.pos.y,c.pos.z+side[1]*(n?-1:1));g.indoor=false;
      const L=dressGoblin(g);L.tunic=0x1c2a5a;L.pants=0x1c2a5a;L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','apron','eyepatch'].includes(k));L.hatType='cap';L.hat=0x1c2a5a;L.show.push('cap');L.hatShown=L.hat;applyLook(g,L,ES);
      g.id=makeIdentity(g,L);g.id.occ='Police officer, Goblin '+(S.B?brandName(S.B):'Police Dept.');
      g.cop={car:c,x:S.tx,z:S.tz,t:0};g.inv=true;}
  } else if(S.kind==='news'){
    // a reporter with a microphone and an operator with a camera, the scene behind the reporter (there's no one to film if nobody's near)
    const n0=nearestPlayer(c.pos.x,c.pos.z,false);if(!n0||n0.d>70)return;
    const free=goblins.filter(o=>o.staff&&o.state==='wait').slice(0,2);if(!free.length)return;
    let tx=S.tx-c.pos.x,tz=S.tz-c.pos.z;const al=Math.hypot(tx,tz)||1;tx/=al;tz/=al;
    const u=Math.max(1,Math.min(5,al-5)),R={x:c.pos.x+tx*u+side[0]*1.3,z:c.pos.z+tz*u+side[1]*1.3},C={x:R.x-tx*3.4,z:R.z-tz*3.4};
    free.forEach((g,n)=>{
      g.pos.set(c.pos.x+side[0]*(n?-1:1),c.pos.y,c.pos.z+side[1]*(n?-1:1));g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=0;g.fleeing=false;g.detour=0;g.vendor=null;g.indoor=false;g.employer=null;g.medic=null;g.ff=null;
      g.heading=0;g.root.visible=true;g.root.rotation.set(0,0,0);
      const L=dressGoblin(g);L.show=L.show.filter(k=>!['cap','top','beanie','hardhat','bandana','mohawk','scarf','tie','backpack','pouch','apron'].includes(k));
      if(n){L.tunic=0x3b3f46;L.pants=0x23262c;L.hatType='cap';L.hat=0x23262c;L.show.push('cap');L.hatShown=L.hat;}
      else{L.tunic=0x1f3a78;L.pants=0x1f3a78;L.hatType='none';L.hatShown=L.skin;L.show.push('tie');}
      applyLook(g,L,ES);
      g.id=makeIdentity(g,L);g.id.occ=(n?'Camera operator':'Reporter')+' at Goblin '+(S.B?brandName(S.B):'News');
      const K=newsKit(g);K.mic.visible=!n;K.cam.visible=!!n;
      g.news={car:c,cam:!!n,x:n?C.x:R.x,z:n?C.z:R.z,ph:'go',walkT:0,mate:free[n?0:1]||null};});
    if(!S.said){S.said=true;flashLabel((S.B?S.B.n:'The news')+' is covering the '+(S.story||'story'),n0.p);}
  }
}
// the things they carry: made the first time a goblin's picked for the job, kept out of sight the rest of the time
function newsKit(g){
  if(g.kit)return g.kit;
  const b=(w,h,d,col,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),smat(col));o.position.set(x,y,z);p.add(o);return o;};
  const mic=new THREE.Group(),cam=new THREE.Group();mic.visible=cam.visible=false;g.arm.add(mic);g.root.add(cam);
  b(0.07,0.07,0.26,0x22242a,0,-0.42,0.12,mic);b(0.13,0.13,0.13,0x8a8d92,0,-0.42,0.3,mic);
  cam.position.set(0.3,1.1,0.08);b(0.22,0.26,0.5,0x23262c,0,0,0,cam);b(0.16,0.16,0.14,0x54585f,0,0,0.31,cam);b(0.08,0.06,0.04,0xe53935,0,0.15,0.2,cam);   // (on the shoulder, with its red light on)
  return g.kit={mic,cam};
}
function endNews(g,hit){const K=g.news;if(!K)return;g.news=null;if(g.kit)g.kit.mic.visible=g.kit.cam.visible=false;if(hit&&K.car.svc)K.car.svc.fled=true;}
// walk a crew member toward (tx,tz); true while moving
function crewWalk(g,tx,tz,dt,sp){
  const want=Math.atan2(tx-g.pos.x,tz-g.pos.z);let diff=want-g.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  g.heading+=Math.max(-7*dt,Math.min(7*dt,diff));
  const fx=Math.sin(g.heading),fz=Math.cos(g.heading);
  if(groundAt(g.pos.x+fx*0.45,g.pos.z+fz*0.45,g.pos.y)-g.pos.y<=1.05){g.pos.x+=fx*sp*dt;g.pos.z+=fz*sp*dt;g.phase+=dt*10;const sw=Math.sin(g.phase)*0.45;g.arm.rotation.x=sw;g.armL.rotation.x=-sw;return true;}
  g.heading+=dt*3;return false;
}
// a firefighter: out of the engine, up to a few blocks from the fire, hose it down; back to the engine when it's out
function fireAI(g,dt){
  const K=g.ff,c=K.car,S=c.alive&&c.svc;
  if(!S||S.st!=='work'||S.wrap)K.ph='back';
  if(K.ph!=='back'){
    let F=null,fd=1e9;for(const f of fires){if(f.t<=0.3||Math.hypot(f.x-S.tx,f.z-S.tz)>18)continue;const d=Math.hypot(f.x-g.pos.x,f.z-g.pos.z);if(d<fd){fd=d;F=f;}}
    if(!F)K.ph='back';
    else{
      // stand a few blocks short of the fire, on the engine's side, spread out a little
      const ax=c.pos.x-F.x,az=c.pos.z-F.z,al=Math.hypot(ax,az)||1,ox=-az/al*K.side*2,oz=ax/al*K.side*2,sx=F.x+ax/al*5+ox,sz=F.z+az/al*5+oz;
      if(Math.hypot(sx-g.pos.x,sz-g.pos.z)>0.8&&K.ph!=='spray'){K.ph='go';K.walkT=(K.walkT||0)+dt;if(K.walkT>12)K.ph='spray';return crewWalk(g,sx,sz,dt,2.6);}
      K.ph='spray';g.heading=Math.atan2(F.x-g.pos.x,F.z-g.pos.z);g.arm.rotation.x=-1.35+Math.sin(g.t*9)*0.06;g.armL.rotation.x=-1.25;
      // the hose: an arcing jet from their hands to the flames
      const hx=g.pos.x+Math.sin(g.heading)*0.5,hz=g.pos.z+Math.cos(g.heading)*0.5,hy=g.pos.y+1.0*ES,dd=Math.hypot(F.x-hx,F.z-hz);
      for(let n=0;n<2;n++){const u=Math.random(),x=hx+(F.x-hx)*u,z=hz+(F.z-hz)*u,y=hy+(F.y+0.5-hy)*u+Math.sin(Math.PI*u)*Math.min(3,dd*0.3);puff(x,y,z,1,Math.random()<0.5?0xcfeaff:0x9fd2ff,0.3);}
      return false;
    }
  }
  if(Math.hypot(c.pos.x-g.pos.x,c.pos.z-g.pos.z)<2.8||!c.alive){g.state='wait';g.root.visible=false;g.ff=null;g.t=0;return false;}
  return crewWalk(g,c.pos.x,c.pos.z,dt,2.6);
}
// a news crew: to their marks by the van, the reporter talking to the camera with the scene behind them, then back aboard.
// (a hippo that comes close gets filmed instead)
function newsAI(g,dt){
  const K=g.news,c=K.car,S=c.alive&&c.svc;
  if(!S||S.st!=='work'||S.wrap)K.ph='back';
  if(K.ph==='back'){
    K.walkT+=dt;if(!c.alive||Math.hypot(c.pos.x-g.pos.x,c.pos.z-g.pos.z)<2.8||K.walkT>30){endNews(g);g.state='wait';g.root.visible=false;g.t=0;return false;}
    return crewWalk(g,c.pos.x,c.pos.z,dt,2.8);
  }
  if(K.ph==='go'){K.walkT+=dt;if(Math.hypot(K.x-g.pos.x,K.z-g.pos.z)>0.6&&K.walkT<9)return crewWalk(g,K.x,K.z,dt,2.6);K.ph='shoot';K.walkT=0;}
  const M=K.mate&&K.mate.state==='chase'&&K.mate.news?K.mate:null;
  if(K.cam){
    const n=nearestPlayer(g.pos.x,g.pos.z,false),look=n&&n.d<30?n.p.pos:M?M.pos:{x:S.tx,z:S.tz};g.heading=Math.atan2(look.x-g.pos.x,look.z-g.pos.z);
    g.arm.rotation.x=-2.5;g.armL.rotation.x=-1.2;
  } else{
    const look=M?M.pos:c.pos;g.heading=Math.atan2(look.x-g.pos.x,look.z-g.pos.z);
    g.arm.rotation.x=-1.45+Math.sin(g.t*2.3)*0.05;g.armL.rotation.x=-0.5+Math.sin(g.t*3.1)*0.45;   // (the microphone up, the other hand making the point)
  }
  return false;
}
// a paramedic: walk to each body, work on it for a few seconds, have it carried off, then back to the ambulance
function medicAI(g,dt){
  const M=g.medic;
  let tx=null,tz=null;
  if(M.ph==='walk'){const C=M.list.find(o=>o.state==='dead'&&o.claim===M.car&&!o.tended);if(!C)M.ph='back';else{M.cur=C;tx=C.pos.x;tz=C.pos.z;M.walkT+=dt;if(Math.hypot(tx-g.pos.x,tz-g.pos.z)<1.3||M.walkT>14){M.ph='treat';M.t=0;M.walkT=0;C.tended=true;}}}
  if(M.ph==='treat'){
    M.t+=dt;const C=M.cur;g.heading=Math.atan2(C.pos.x-g.pos.x,C.pos.z-g.pos.z);
    g.arm.rotation.x=-1.1+Math.sin(M.t*11)*0.35;g.armL.rotation.x=-1.1+Math.sin(M.t*11)*0.35;   // chest compressions
    M.beep=(M.beep||0)-dt;if(M.beep<=0){M.beep=0.9;tone('sine',1320,1320,0.09,0.03);puff(C.pos.x,C.pos.y+0.4,C.pos.z,3,0xaee6ff,0.25);}
    if(M.t>3.5){puff(C.pos.x,C.pos.y+0.4,C.pos.z,8,0xf4f4f0,0.5);C.state='wait';C.root.visible=false;C.t=0;C.claim=null;C.tended=false;M.ph='walk';}
    return false;
  }
  if(M.ph==='back'){tx=M.car.pos.x;tz=M.car.pos.z;if(Math.hypot(tx-g.pos.x,tz-g.pos.z)<2.8||!M.car.alive){g.state='wait';g.root.visible=false;g.medic=null;g.t=0;return false;}}
  if(tx===null)return false;
  return crewWalk(g,tx,tz,dt,2.4);
}
// a police officer looking round the scene: somewhere nearby to walk to (back to the car once they've had enough)
function copSpot(g){
  const K=g.cop;if(K.t>35)return{x:K.car.pos.x,z:K.car.pos.z};
  for(let n=0;n<10;n++){const x=Math.floor(K.x+(Math.random()-.5)*14),z=Math.floor(K.z+(Math.random()-.5)*14),y=Math.floor(g.pos.y);if(get(x,y,z)===AIR&&get(x,y+1,z)===AIR&&solidAt(x,y-1,z))return{x:x+.5,z:z+.5};}
  return null;
}
function updateServices(dt){
  svcT-=dt;if(svcT>0)return;svcT=1;
  if(!playing||crowd<=0||TENV)return;   // (the Testing Environment has no roads or stations to send anyone from)
  const act=players.filter(p=>p.active);if(!act.length)return;
  const near=(x,z,R)=>act.some(p=>Math.hypot(p.pos.x-x,p.pos.z-z)<R);
  const busy=(kind,x,z,R)=>SVC.some(c=>c.alive&&c.svc&&c.svc.st!=='parked'&&c.svcPool===kind&&Math.hypot(c.svc.tx-x,c.svc.tz-z)<R);
  // a vehicle from the nearest station with one at home: its parked one if it's on show, or one from the pool
  const send=(kind,x,z)=>{const pk=pickStation(kind,x,z);if(!pk)return null;let c=stnState(pk.D).slots[pk.k].car;if(!c||!c.alive)c=SVC.find(o=>!o.alive&&o.svcPool===kind);if(!c)return null;return svcStart(c,kind,pk,x,z)?c:null;};
  // fires
  for(const F of fires){if(F.t<3||F.douse||!near(F.x,F.z,140)||busy('fire',F.x,F.z,24))continue;const c=send('fire',F.x,F.z);if(c){flashLabel('Fire engine on its way',(nearestPlayer(F.x,F.z)||{}).p);break;}}
  // bodies
  for(const g of goblins){if(g.state!=='dead'||g.claim||g.t>9||!near(g.pos.x,g.pos.z,140)||busy('amb',g.pos.x,g.pos.z,16))continue;const c=send('amb',g.pos.x,g.pos.z);
    if(c){for(const o of goblins)if(o.state==='dead'&&!o.claim&&Math.hypot(o.pos.x-g.pos.x,o.pos.z-g.pos.z)<16)o.claim=c;break;}}
  // crimes: police come to look into killings and smashed buildings and cars
  for(let i=crimes.length-1;i>=0;i--)if(playTime-crimes[i].t>40)crimes.splice(i,1);
  if(!calmNow())for(const k of crimes){if(k.sent||!near(k.x,k.z,160)||busy('police',k.x,k.z,30))continue;const c=send('police',k.x,k.z);if(c){k.sent=true;break;}}
  // the news: fires, wrecks and killings, one van to a scene. (A scene still going after a while gets another visit.)
  for(const F of fires)if(F.t>=3&&!F.news){F.news=true;reportNews(F.x,F.z,'fire');}
  for(let i=newsCalls.length-1;i>=0;i--)if(playTime-newsCalls[i].t>40)newsCalls.splice(i,1);
  for(const k of newsCalls){if(playTime-k.sentT<45||playTime<k.next||!near(k.x,k.z,160)||busy('news',k.x,k.z,30))continue;k.next=playTime+5;const c=send('news',k.x,k.z);if(c){c.svc.story=k.what;k.sentT=playTime;break;}}
}
let trafficRefreshT=0;
