// ---- the railways: lines linking some of the places to their neighbours (more often between bigger places), never
// across the sea. A line leaves each place along the row of blocks two rows short of its middle (or the column two
// columns short), with the station in the place's own column (row); halfway between the two places it bends round
// (on big curves) onto the other place's row. On ballast; over the rivers on steel truss bridges; across the roads on
// level crossings with barriers that come down for the trains. In a place, the blocks it runs through are given over
// to it (a fenced cutting). ----
const RAIL_C=20,RAIL_R=14,RAIL_EXT=11;
const railLinkC=new Map();
function railLink(rx,rz,dx,dz){
  // the line from place (rx,rz) to the next one east (dx=1) or south (dz=1), or null
  if(TEST_OFF.has('rail'))return null;
  const key=rx+','+rz+','+dx;let Lk=railLinkC.get(key);if(Lk!==undefined)return Lk;Lk=null;railLinkC.set(key,null);   // (null while it's worked out)
  const A=settlementLat(rx,rz),B=settlementLat(rx+dx,rz+dz),h=hash2(rx*373+dx*11+17,rz*197+dz*29+3);
  const big=t=>t==='city'||t==='large'||t==='small',p=big(A.type)&&big(B.type)?0.4:big(A.type)||big(B.type)?0.16:0.04;
  const real=S=>{const s=settlementAt(S.cx,S.cz);return s&&s.rx===S.rx&&s.rz===S.rz;};
  // (a line always runs from a station to a station: both its places have to have room for one, on the right block)
  const ex0=dx===1,stOK=S=>{const px=ex0?S.cx:S.cx-2,pz=ex0?S.cz-2:S.cz,s=settlementAt(px,pz);return!!s&&s.rx===S.rx&&s.rz===S.rz&&!isRiver(px,pz)&&!(px===0&&pz===0)&&!seaPlot(px,pz);};
  if(h<p&&!TEST_OFF.has('station')&&real(A)&&real(B)&&stOK(A)&&stOK(B)){
    const X=q=>q*CELL+RAIL_C+0.5,ex=dx===1;
    // along the line (u) and across it (v), in place coordinates; then turned into world coordinates
    const uA=ex?A.cx:A.cz,uB=ex?B.cx:B.cz,vA=ex?A.cz-2:A.cx-2,vB=ex?B.cz-2:B.cx-2;
    const W=(u,v)=>ex?[u,v]:[v,u];
    // the bend: in a column (row) about halfway, as clear of the roads as can be found
    let j=Math.round((uA+uB)/2);
    if(vA!==vB){let best=1e9,bj=j;for(const o of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6]){const q=j+o;let n=0;for(let v=Math.min(vA,vB);v<=Math.max(vA,vB);v+=0.25){const [wx,wz]=W(X(q),v*CELL+RAIL_C);if(routeAt(wx,wz,12))n++;if(settlementAt(Math.floor(wx/CELL),Math.floor(wz/CELL)))n+=2;}if(n<best){best=n;bj=q;}}j=bj;}
    const u0=X(uA)-RAIL_EXT,u1=X(uB)+RAIL_EXT,va=X(vA),vb=X(vB),uj=X(j),sv=Math.sign(vb-va)||1,R=RAIL_R;
    const el=[];
    const seg=(a0,a1,v)=>el.push({t:'s',ax:ex?'x':'z',c:v,a0,a1});
    const arc=(cu,cv,aDir,bDir)=>{const [cx,cz]=W(cu,cv),[ix,iz]=W(...aDir),[ox,oz]=W(...bDir),cen=[cx-ix*R+ox*R,cz-iz*R+oz*R];
      el.push({t:'a',cx:cen[0],cz:cen[1],r:R,th0:Math.atan2(-oz,-ox),th1:Math.atan2(iz,ix)});};
    if(vA===vB)seg(u0,u1,va);
    else{seg(u0,uj-R,va);arc(uj,va,[1,0],[0,sv]);el.push({t:'s',ax:ex?'z':'x',c:uj,a0:Math.min(va,vb)+R,a1:Math.max(va,vb)-R});arc(uj,vb,[0,sv],[1,0]);seg(uj+R,u1,vb);}
    // the line as a string of points a block apart, from A to B (for the trains, the crossings and the map)
    const pts=[];
    const addSeg=(u0b,u1b,v)=>{for(let u=u0b;u<u1b;u+=1)pts.push(W(u,v));};
    const addArc=E=>{let d=E.th1-E.th0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const n=Math.ceil(Math.abs(d)*E.r);for(let i=0;i<n;i++){const t=E.th0+d*i/n;pts.push([E.cx+Math.cos(t)*E.r,E.cz+Math.sin(t)*E.r]);}};
    if(vA===vB)addSeg(u0,u1,va);
    else{addSeg(u0,uj-R,va);addArc(el[1]);for(let v=va+sv*R;sv>0?v<vb-R:v>vb+R;v+=sv)pts.push(W(uj,v));addArc(el[3]);addSeg(uj+R,u1,vb);}
    // no line across the sea (or right along its edge)
    let wet=false;for(let i=0;i<pts.length&&!wet;i+=8){const [x,z]=pts[i];if(seaPlot(Math.floor(x/CELL),Math.floor(z/CELL)))wet=true;}
    // (nor one that would run along a highway instead of just crossing it: the track and its bridges would stand in the lanes)
    if(!wet){let run=0;for(let i=0;i<pts.length&&!wet;i+=4){const [x,z]=pts[i];if(routeAt(x,z,10)){run+=4;if(run>=48)wet=true;}else run=0;}}
    if(!wet){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const [x,z] of pts){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
      Lk={key:'L'+key,A,B,ex,el,pts,L:pts.length,box:[x0-8,z0-8,x1+8,z1+8],sA:RAIL_EXT,sB:pts.length-1-RAIL_EXT,
        stA:W(uA,vA),stB:W(uB,vB)};}
  }
  if(railLinkC.size>4000)railLinkC.clear();railLinkC.set(key,Lk);return Lk;
}
// the lines anywhere near block (px,pz)
const railNearC=new Map();
function railLinksNear(px,pz){
  const k=px*100003+pz;let v=railNearC.get(k);if(v)return v;v=[];
  const rx=Math.round(px/SET_SP),rz=Math.round(pz/SET_SP),X0=px*CELL,Z0=pz*CELL;
  for(let a=rx-2;a<=rx+1;a++)for(let b=rz-2;b<=rz+1;b++)for(const [dx,dz] of [[1,0],[0,1]]){const L=railLink(a,b,dx,dz);
    if(L&&L.box[0]<=X0+CELL&&L.box[2]>=X0&&L.box[1]<=Z0+CELL&&L.box[3]>=Z0)v.push(L);}
  if(railNearC.size>60000)railNearC.clear();railNearC.set(k,v);return v;
}
function railLinksInBox(x0,z0,x1,z1){
  const out=new Set();for(let px=Math.floor(x0/CELL);px<=Math.floor(x1/CELL);px+=4)for(let pz=Math.floor(z0/CELL);pz<=Math.floor(z1/CELL);pz+=4)for(const L of railLinksNear(px,pz))out.add(L);
  return [...out];
}
// the line nearest (x,z): across it (c: signed, blocks from the track's middle), along it (s), its direction there
// ('x', 'z' or 'a' on a bend), the line and the piece; null if none within 8
function railAt(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),L0=railLinksNear(px,pz);if(!L0.length)return null;
  let best=null,bd=8;const qx=x+0.5,qz=z+0.5;
  for(const L of L0)for(let i=0;i<L.el.length;i++){const E=L.el[i];
    if(E.t==='s'){const al=E.ax==='x'?qx:qz,ac=E.ax==='x'?qz:qx;if(al<E.a0-0.5||al>E.a1+0.5)continue;const c=ac-E.c;if(Math.abs(c)<bd){bd=Math.abs(c);best={c,s:al,ax:E.ax,L,E,i};}}
    else{const dx=qx-E.cx,dz=qz-E.cz,d=Math.hypot(dx,dz);let th=Math.atan2(dz,dx),d0=E.th1-E.th0;while(d0>Math.PI)d0-=2*Math.PI;while(d0<-Math.PI)d0+=2*Math.PI;
      let t=th-E.th0;while(t>Math.PI)t-=2*Math.PI;while(t<-Math.PI)t+=2*Math.PI;const f=t/d0;if(f<-0.02||f>1.02)continue;
      const c=d-E.r;if(Math.abs(c)<bd){bd=Math.abs(c);best={c,s:Math.abs(t)*E.r,ax:'a',L,E,i};}}}
  return best;
}
function railNear(x,z){const R=railAt(Math.floor(x),Math.floor(z));return R?Math.abs(R.c):99;}
const railPlotC=new Map();
function railPlot(px,pz){
  const k=px*100003+pz;let v=railPlotC.get(k);if(v!==undefined)return v;v=false;
  if(railLinksNear(px,pz).length)for(let a=0;a<CELL&&!v;a+=3)for(let b=0;b<CELL&&!v;b+=3){const R=railAt(px*CELL+a,pz*CELL+b);if(R&&Math.abs(R.c)<5)v=true;}
  if(railPlotC.size>100000)railPlotC.clear();railPlotC.set(k,v);return v;
}
function rectRail(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(railPlot(ax+i,az+j))return true;return false;}
// is block (px,pz) a station? Its axis ('x'/'z') if so: the block of a line's end in a place, on the place's own column
// (row), if it's really in the place
function railStation(px,pz){
  if(TEST_OFF.has('station'))return null;
  for(const L of railLinksNear(px,pz))for(const [S,st] of [[L.A,L.stA],[L.B,L.stB]]){
    if(st[0]!==px||st[1]!==pz)continue;
    const s=settlementAt(px,pz);if(!s||s.rx!==S.rx||s.rz!==S.rz||isRiver(px,pz)||px===0&&pz===0)continue;
    return L.ex?'x':'z';}
  return null;
}
// does the line carry on past this end of it (another line leaving the place the same way)?
function railCarriesOn(L,end){
  if(end==='A')return !!railLink(L.A.rx-(L.ex?1:0),L.A.rz-(L.ex?0:1),L.ex?1:0,L.ex?0:1);
  return !!railLink(L.B.rx,L.B.rz,L.ex?1:0,L.ex?0:1);
}
function railInfo(p,px,pz,base){
  p.stall=0;p.benches=false;p.lots=[];p.rail=true;
  if(p.type!=='station')return;
  const ax=railStation(px,pz);p.stnAx=ax;
  // the station building: brick, two storeys, across the town side of the platforms
  // (one grand hall, under a hipped roof with a clock tower: you can tell it from a long way off)
  const b=ax==='x'?base({x0:PL0+1,x1:PL1-1,z0:ROADW+1,z1:RAIL_C-4,gf:9,top:G+9,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'shop',ground:'shop',floor:FLOORT,door:2})
    :base({x0:ROADW+1,x1:RAIL_C-4,z0:PL0+1,z1:PL1-1,gf:9,top:G+9,wall:BRICK,win:WIN_WARM,band:CONCRETE,kind:'shop',ground:'shop',floor:FLOORT,door:0});
  b.doorSpec={w:1,h:3,k:'wood'};b.detailTop=b.top-1;b.station=ax;b.rfForce={k:'hip',c:SHINGLE,clock:true};p.b.push(b);
}
const ROADTOP=new Set([ASPHALT,LINE,LINEX,LINE_R,LINEX_R,CROSS,CROSSX,LANE,LANEX,SIDEWALK]);
// laid over whatever the chunk has made: the track bed (or a bridge, or a crossing), the fences, the stations' platforms
function railPass(a,x0,z0){
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,rx=mod(x,CELL),rz=mod(z,CELL),px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
    const R=railAt(x,z);if(!R||Math.abs(R.c)>5.5)continue;
    const set=(y,b)=>{a[li(lx,y,lz)]=b;},at=y=>a[li(lx,y,lz)];
    const c=R.c,ac=Math.abs(c),s=Math.floor(R.s),town=!!settlementAt(px,pz);
    const stn=town&&R.ax!=='a'&&plotInfo(px,pz).stnAx===R.ax;
    if(ac<=2.5){
      // the track bed: cut through whatever was there (but not the motorways' pillars)
      for(let y=G+1;y<=G+9;y++)if(at(y)!==CONCRETE)set(y,AIR);
      let wet=false;for(let y=G-3;y<=G;y++)if(at(y)===WATER)wet=true;
      if(wet){
        // a steel truss bridge
        set(G,CONCRETE);
        if(ac>1.5){set(G+1,METAL);set(G+5,METAL);if(mod(s,4)===0)for(let y=G+2;y<=G+4;y++)set(y,METAL);}
        else if(mod(s,4)===0)set(G+5,METAL);
        if(mod(s,8)===0&&ac<=1.5)for(let y=G-1;y>1;y--){const b=at(y);if(b!==WATER&&b!==AIR)break;set(y,CONCRETE);}
      } else if(ROADTOP.has(at(G))){}   // a level crossing: the road (or the pavement) runs on over the rails
      else{set(G,GRAVEL);set(G-1,DIRT);if(at(G-2)===AIR||at(G-2)===WATER)set(G-2,DIRT);}
      // the end of the line: buffer stops
      if(R.E.t==='s'&&ac<=1.5){const L=R.L,first=R.i===0,last=R.i===L.el.length-1,sgn=L.el.length===1?0:0;
        if(first&&!railCarriesOn(L,'A')&&Math.abs(R.s-R.E.a0)<1.01||last&&!railCarriesOn(L,'B')&&Math.abs(R.s-R.E.a1)<1.01){set(G+1,ac>0.5?PAINT_RED:METAL);if(ac<=0.5)set(G+2,PAINT_RED);}}
      continue;}
    if(!town)continue;
    const u=R.ax==='x'?rx:rz;
    // a station: platforms either side of the track, a canopy on posts over each, benches, the yellow line
    if(stn&&u>=ROADW+1&&u<=CELL-2){
      if(ac<=4.5){for(let y=G+1;y<=G+4;y++)set(y,AIR);set(G,CONCRETE);set(G+1,ac<3.5?PAINT_YELLOW:CONCRETE);
        set(G+5,u%8===4&&ac<3.5?LAMP:ROOF);
        if(ac>3.5&&u%6===0)for(let y=G+2;y<=G+4;y++)set(y,METAL);
        else if(ac>3.5&&u%6===3)set(G+2,SEAT_B);}
      else if(c>4.5&&c<=5.5){set(G+1,FENCE);}
      continue;}
    // through a place: a fence either side of the line (gaps where the streets and pavements cross)
    if(ac>3.5&&ac<=4.5&&rx>=PL0&&rx<PL1&&rz>=PL0&&rz<PL1)set(G+1,FENCE);
  }
}
// ---- the trains and the level crossings ----
const TRAIN_LEN=4*10.6;
// ---- the train cars as solid boxes, this frame: you can climb onto one and ride it (like a car); a moving train
// smashes into whatever's on the track -- you, cars, goblins -- and sends it flying; and it can be wrecked ----
const TRAIN_BOXES=[],TRAIN_HX=1.3,TRAIN_HZ=4.9,TRAIN_H=3.5;
// (hit by a moving train: hurt, and thrown forward and up)
function trainStrike(p,d,k,cause){p.trainT=1;damagePlayer(p,Math.max(4,Math.round(3+9*k)),p.pos.clone(),d,cause||'Hit by a train');if(p.hp>0){const f=14+26*k;p.mvx=d.x*f;p.mvz=d.z*f;p.vy=Math.max(p.vy||0,10+14*k);p.grounded=false;p.knockT=1.2;p.state='walk';}thud(0.8);addShake(0.5,p.pos.x,p.pos.z,20);}
function trainBoxes(cs,speed,y0,T){
  cs.forEach((g,ci)=>{const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h);let pr=g.userData.proxy;
    if(!pr)pr=g.userData.proxy={isTrain:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:TRAIN_HX,hz:TRAIN_HZ,hy:TRAIN_H,heading:0,top:0,veh:'train'};
    pr.T=T;pr.i=ci;pr.alive=!T||!T.dead&&!(T.carDead&&T.carDead[ci]);pr.pos.set(g.position.x,g.position.y,g.position.z);pr.heading=h;pr.top=g.position.y+TRAIN_H;
    TRAIN_BOXES.push({x:g.position.x,z:g.position.z,tx,tz,y0:g.position.y,top:pr.top,v:speed,proxy:pr});});
  // what's on the track in front of it (or alongside, at any real speed): struck, thrown aside and up, hurt
  if(Math.abs(speed)<2)return;
  const n=TRAIN_BOXES.length-cs.length,k=Math.max(0.3,Math.min(1,Math.abs(speed)/24)),sgn=speed<0?-1:1;   // (the cars all point the same way, whichever way they're going)
  const hit=(o,r,y)=>{for(let i=n;i<TRAIN_BOXES.length;i++){const B=TRAIN_BOXES[i];if(y>B.top-0.3||y<B.y0-1.5)continue;
    const dx=o.pos.x-B.x,dz=o.pos.z-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx;if(Math.abs(al)>TRAIN_HZ+r||Math.abs(ac)>TRAIN_HX+r)continue;
    if(o.in&&o.cam&&o.in.climb&&!o.gob&&vGrab(o,3,B.proxy))return null;   // (a hippo holding climb catches hold of it instead)
    const sg=ac>=0?1:-1,nx=-B.tz*sg,nz=B.tx*sg,need=TRAIN_HX+r-Math.abs(ac)+0.05;o.pos.x+=nx*need;o.pos.z+=nz*need;
    return new V3(B.tx*sgn*0.8+nx*0.6,0,B.tz*sgn*0.8+nz*0.6);}return null;};
  for(const p of players){if(p.trainT>0)continue;if(!p.active||p.hp<=0||p.standCar&&p.standCar.isTrain||p.vcl&&p.state==='climb'||p.drv)continue;const d=hit(p,0.75*ES,p.pos.y+0.5);
    if(d)trainStrike(p,d,k);}
  for(const c of cars){if(!c.alive||c.trainT>0)continue;const d=hit(c,c.hx,c.pos.y+0.5);
    if(d){c.trainT=1;damageCar(c,Math.round(6+16*k),d,'acc');if(c.alive)launchCar(c,6+10*k,d.clone().multiplyScalar(1+2.5*k),6);clang();thud(0.7);}}
  for(const g of goblins)if(g.state==='chase'&&!(g.trainT>0)){const d=hit(g,0.5,g.pos.y+0.5);
    if(d){g.trainT=1;damageGoblin(g,Math.round(3+10*k),g.pos.clone(),d.clone().multiplyScalar(1+k),'Hit by a train',ACCIDENT);g.vy=Math.max(g.vy||0,12+16*k);g.kv.x+=d.x*(14+26*k);g.kv.z+=d.z*(14+26*k);}}
}
function railPt(L,s){const i=Math.max(0,Math.min(L.L-2,Math.floor(s))),f=Math.max(0,Math.min(1,s-i)),a=L.pts[i],b=L.pts[i+1];
  const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return{x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,tx:(b[0]-a[0])/l,tz:(b[1]-a[1])/l};}
// ---- a track: the run of lines that carry straight on through their stations, end to end -- one train on it ----
const chainC=new Map();
function railChainOf(L){
  const back=Q=>railLink(Q.A.rx-(Q.ex?1:0),Q.A.rz-(Q.ex?0:1),Q.ex?1:0,Q.ex?0:1),fwd=Q=>railLink(Q.B.rx,Q.B.rz,Q.ex?1:0,Q.ex?0:1);
  let first=L,n=0;while(n<60){const p=back(first);if(!p)break;first=p;n++;}
  let C=chainC.get(first.key);if(C)return C;
  const links=[first];for(let cur=first,m=0;m<60;m++){const nx=fwd(cur);if(!nx)break;links.push(nx);cur=nx;}
  const pts=[],stops=[];
  links.forEach((Q,i)=>{const a=i===0?0:Q.sA,b=i===links.length-1?Q.L:Q.sB,off=pts.length;if(i===0)stops.push(off+Q.sA);
    for(let q=a;q<b;q++)pts.push(Q.pts[q]);stops.push(off+(Q.sB-a));});
  C={key:'C'+first.key,links,pts,L:pts.length,stops};chainC.set(first.key,C);return C;
}
// the trains, one per track, kept going wherever they are (whether or not they're drawn)
const TRAINS=new Map();
function updateTrains(dt){
  for(const T of TRAINS.values()){
    const C=T.C;
    if(T.dead||T.halted){T.deadT+=dt;
      if(T.halted&&T.v>0){T.v=Math.max(0,T.v-30*dt);T.s+=T.v*T.dir*dt;}   // (a car gone: it grinds to a stop)
     
      // a wreck: smouldering a while; then (once nobody's near enough to see) a new train in service
      if(T.deadT<40&&Math.random()<dt*4&&T.cars){const g=T.cars[Math.floor(Math.random()*T.cars.length)];smoke(g.position.x+(Math.random()-.5)*2,g.position.y+3,g.position.z+(Math.random()-.5)*6,1,0x2a2a2a);}
      if(T.deadT>120&&!players.some(p=>p.active&&Math.hypot(railPt(C,T.s).x-p.pos.x,railPt(C,T.s).z-p.pos.z)<350)){T.dead=false;T.halted=false;T.carDead=null;T.carHP=null;T.v=0;T.wait=8;T.s=T.dir>0?TRAIN_LEN+1:C.L-2-TRAIN_LEN;T.rebuild=true;}
      continue;}
    if(T.drv){drvTrain(T,dt);continue;}   // (a goblin driving it: see drvTrain)
    // to the next station ahead (or the end of the line), easing in; a wait there; at the end, back the other way
    const end=T.dir>0?C.L-2:1;let next=end;
    for(const st of C.stops){const f=Math.max(1,Math.min(C.L-2,st+T.dir*TRAIN_LEN/2));if((f-T.s)*T.dir>0.5&&(f-next)*T.dir<0)next=f;}
    const left=(next-T.s)*T.dir;
    if(T.wait>0){T.wait-=dt;if(T.wait<=0&&Math.abs(T.s-end)<1){T.s-=T.dir*TRAIN_LEN;T.dir=-T.dir;}}
    else{const want=left<70?Math.max(1.2,left*0.32):24;T.v+=(want-T.v)*Math.min(1,dt*(want<T.v?1.2:0.3));T.s+=T.v*T.dir*dt;if(left<=0.4){T.s=next;T.v=0;T.wait=12;}}
  }
}
const CAR_HP=150;
// hitting a train (it takes a lot): shudder, sparks of damage; wrecked, it blows up car by car and lies there burning
function trainHit(T,n,dir,ci){
  if(T&&T.isPlane){planeHit(T,n);return;}
  if(T&&T.isBoat){boatHit(T,n);return;}
  if(T&&T.isAnimal){animalHit(T,n,dir);return;}
  if(T&&T.isRide){rideHit(T,n,ci);return;}
  if(T&&T.isMil){milHit(T,n,dir);return;}
  if(!T||T.dead||!T.cars)return;const N=T.cars.length;if(ci===undefined)ci=0;
  if(!T.carHP){T.carHP=T.cars.map(()=>CAR_HP);T.carDead=T.cars.map(()=>false);}
  if(T.carDead[ci])return;T.carHP[ci]-=n;
  {const g=T.cars[ci];dmgPop(g.position.x,g.position.y+4,g.position.z,Math.round(n),'#ffb04a');vHitFx(g.position.x,g.position.y+2.5,g.position.z,n);}
  if(T.carHP[ci]>0)return;
  // that car blows up and lies there burning, and the train grinds to a stop; the rest can still be taken apart
  T.carDead[ci]=true;if(!T.halted){T.halted=true;T.deadT=0;T.wait=0;}
  const g=T.cars[ci],p=g.position;blastFx(p.x,p.y+2,p.z,0.6,1.8);
  smoke(p.x,p.y+2,p.z,18,0x262626);
  for(let k=0;k<6;k++){const d=debris[(debrisIdx++)%debris.length];d.m.position.set(p.x+(Math.random()-.5)*2,p.y+2+Math.random(),p.z+(Math.random()-.5)*6);d.v.set((Math.random()-.5)*16,8+Math.random()*10,(Math.random()-.5)*16);d.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);d.life=25;d.m.visible=true;}
  g.traverse(o=>{if(o.isMesh)o.material=TRM.dark;});g.rotation.z=(ci%2?1:-1)*(0.25+Math.random()*0.3);
  noise(1,1,600,'lowpass');tone('sawtooth',60,18,1.2,0.3);addShake(0.8,p.x,p.z,40);hitGoblins(p.x,p.z,9,8,'Blown up with a train',p.y+1);
  score+=500;
  const who=(nearestPlayer(p.x,p.z)||{}).p;
  if(T.carDead.every(Boolean)){T.dead=true;score+=1000;flashLabel('Train destroyed  +1500',who);}else flashLabel('Train car destroyed  +500',who);
}
function refreshRailVenues(p,want){
  const ls=railLinksInBox(p.pos.x-1000,p.pos.z-1000,p.pos.x+1000,p.pos.z+1000),seen=new Set();
  for(const L of ls){
    const C=railChainOf(L);if(seen.has(C))continue;seen.add(C);
    // the point of the track nearest you
    let bi=0,bd=1e9;for(let i=0;i<C.L;i+=4){const d=Math.hypot(C.pts[i][0]-p.pos.x,C.pts[i][1]-p.pos.z);if(d<bd){bd=d;bi=i;}}
    if(bd>1000)continue;
    // its train (set going the first time the track's anywhere near you, somewhere along it)
    let T=TRAINS.get(C.key);
    if(!T){T={C,s:Math.max(TRAIN_LEN+1,Math.min(C.L-2-TRAIN_LEN,C.stops[Math.floor(Math.random()*C.stops.length)])),dir:Math.random()<0.5?1:-1,v:0,wait:Math.random()*10,dead:false,deadT:0};TRAINS.set(C.key,T);}
    // drawn whenever it's within a long way of you (so it never pops in or out in view)
    const tp=railPt(C,T.s);
    if(Math.hypot(tp.x-p.pos.x,tp.z-p.pos.z)<1100||bd<900){const key='R'+C.key;want.add(key);if(!venues.has(key)){const cars2=[];for(let i=0;i<4;i++){const g=makeTrainCar(i===0||i===3,i===3);scene.add(g);cars2.push(g);}
      T.cars=cars2;venues.set(key,{kind:'rtrain',T,cars:cars2,hornT:0});}}
    // the level crossings near you: runs of road across the track (where it runs straight)
    if(bd>200)continue;
    let run=null;const i0s=Math.max(0,bi-170),i1s=Math.min(C.L,bi+170);
    const flush=()=>{if(!run)return;const [i0,i1]=run;run=null;if(i1-i0>40||i0===i0s||i1===i1s-1)return;const xk='X'+C.key+','+i0;want.add(xk);if(venues.has(xk))return;
      const P=railPt(C,(i0+i1)/2),ax=Math.abs(P.tx)>0.99?'x':Math.abs(P.tz)>0.99?'z':null;if(!ax)return;
      const q0=ax==='x'?Math.min(C.pts[i0][0],C.pts[i1][0]):Math.min(C.pts[i0][1],C.pts[i1][1]),q1=ax==='x'?Math.max(C.pts[i0][0],C.pts[i1][0]):Math.max(C.pts[i0][1],C.pts[i1][1]);
      const V=makeCrossing(ax,ax==='x'?P.z:P.x,Math.floor(q0),Math.floor(q1));V.C=C;V.i0=i0;V.i1=i1;venues.set(xk,V);};
    // (a stretch of track in a chunk not made yet is nothing to look at, and no reason to make one: its crossings can wait until it's there)
    for(let i=i0s;i<i1s;i++){const [x,z]=C.pts[i];if(!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS)))){run=null;continue;}const b=get(Math.floor(x),G,Math.floor(z)),up=get(Math.floor(x),G+1,Math.floor(z));
      const rd=(b===ASPHALT||b===LINE||b===LINEX||b===LINE_R||b===LINEX_R||b===CROSS||b===CROSSX)&&!up;
      if(rd){if(!run)run=[i,i];else run[1]=i;}else flush();}
    flush();
  }
}
const XM={post:new THREE.MeshLambertMaterial({color:0xf0f0ea}),red:new THREE.MeshLambertMaterial({color:0xd02020}),dark:new THREE.MeshLambertMaterial({color:0x22262c}),
  on:new THREE.MeshBasicMaterial({color:0xff3020}),off:new THREE.MeshLambertMaterial({color:0x401010})};
function makeCrossing(ax,lc,q0,q1){
  // each side of the track: a barrier from each side of the road, meeting in the middle; a post with two red lamps
  const arms=[],lamps=[],half=(q1-q0+1)/2,bx=(m,sx,sy,sz,x,y,z,g)=>{const o=new THREE.Mesh(LM_BOX,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;};
  for(const side of [-1,1])for(const [end,dirA] of [[q0-0.5,1],[q1+1.5,-1]]){
    const g=new THREE.Group(),lift=new THREE.Group(),c=lc+side*3.7;
    const wx=ax==='x'?end:c,wz=ax==='x'?c:end;g.position.set(wx,G+1,wz);
    const dx=ax==='x'?dirA:0,dz=ax==='x'?0:dirA;
    bx(XM.post,0.25,2.6,0.25,0,1.3,0,g);bx(XM.dark,0.9,0.4,0.2,0,2.4,0,g);
    const l1=bx(XM.off,0.22,0.22,0.12,-0.25,2.4,0.12,g),l2=bx(XM.off,0.22,0.22,0.12,0.25,2.4,0.12,g);lamps.push(l1,l2);
    lift.position.y=1.1;const arm=new THREE.Group();arm.rotation.y=Math.atan2(-dz,dx);arm.add(lift);g.add(arm);
    const n=Math.max(1,Math.round(half/0.9));for(let i=0;i<n;i++){const m=new THREE.Mesh(LM_BOX,i%2?XM.post:XM.red);m.scale.set(half/n,0.14,0.1);m.position.x=0.2+(i+0.5)*half/n;lift.add(m);}
    lift.rotation.z=1.45;scene.add(g);arms.push({g,lift});}
  return{kind:'xing',ax,lc,q0,q1,arms,lamps,a:1.45,closed:false,bellT:0};
}
function updateRailVenue(V,dt,t){
  if(V.kind==='xing'){
    let shut=false;const mid=(V.i0+V.i1)/2,mq=(V.q0+V.q1)/2;
    for(const T of TRAINS.values()){if(T.C!==V.C||T.dead)continue;
      const tail=T.s-T.dir*TRAIN_LEN,lo=Math.min(T.s,tail),hi=Math.max(T.s,tail),ahead=(mid-T.s)*T.dir;
      if(mid>lo-8&&mid<hi+8||ahead>0&&ahead<85&&T.wait<=0)shut=true;}
    if(shut&&!V.closed&&playing&&audio){const me=players.find(q=>q.active);if(me){const d=Math.hypot((V.ax==='x'?mq:V.lc)-me.pos.x,(V.ax==='x'?V.lc:mq)-me.pos.z);if(d<90)V.bellT=0.01;}}
    V.closed=shut;
    V.a+=((shut?0:1.45)-V.a)*Math.min(1,dt*1.6);for(const A of V.arms)A.lift.rotation.z=V.a;
    const on=shut&&Math.floor(t*2.2)%2===0;V.lamps.forEach((l,i)=>{l.material=shut&&((i%2===0)===on)?XM.on:XM.off;});
    if(shut&&V.bellT>0){V.bellT-=dt;if(V.bellT<=0){V.bellT=0.55;const me=players.find(q=>q.active);const d=me?Math.hypot((V.ax==='x'?mq:V.lc)-me.pos.x,(V.ax==='x'?V.lc:mq)-me.pos.z):999;if(d<90&&audio)tone('triangle',1320,1300,0.25,0.05*(1-d/90));}}
    return;}
  // a train: drawn where it's got to on its track (updateTrains moves it); a fresh one after a wreck
  const T=V.T,C=T.C,me=players.find(q=>q.active);
  if(T.rebuild){T.rebuild=false;for(const g of V.cars)scene.remove(g);V.cars=[];for(let i=0;i<4;i++){const g=makeTrainCar(i===0||i===3,i===3);scene.add(g);V.cars.push(g);}}
  T.cars=V.cars;
  // (numbered from the end furthest along the line, whichever way it's going: it has an engine at each end, and just drives
  // off the other way at the end of the line. Each car lies along the track between its two ends, so it swings round bends.)
  const hi=T.dir>0?T.s:T.s+TRAIN_LEN,cs=[];V.cars.forEach((g,i)=>{const c=hi-5.3-i*10.6,P=railPt(C,c),Fa=railPt(C,c+4),Ba=railPt(C,c-4);if(T.carDead&&T.carDead[i]){cs.push(P);return;}g.position.set((Fa.x+Ba.x)/2,G+1.2,(Fa.z+Ba.z)/2);g.rotation.y=Math.atan2(Fa.x-Ba.x,Fa.z-Ba.z);cs.push(P);});
  if(T.carHP)V.cars.forEach((g,i)=>{if(!(T.carDead&&T.carDead[i]))vDamaged(g.position.x,g.position.y+3.6,g.position.z,T.carHP[i]/CAR_HP,dt);});
  // the horn, now and then, when it's near you and moving
  V.hornT-=dt;
  if(me&&!T.dead&&T.v>8&&V.hornT<=0&&audio&&playing){const d=Math.hypot(cs[0].x-me.pos.x,cs[0].z-me.pos.z);if(d<120){V.hornT=9;tone('sawtooth',311,300,0.9,0.05*(1-d/120));tone('sawtooth',370,360,0.9,0.04*(1-d/120));}}
  trainBoxes(V.cars,T.dead?0:T.v*T.dir,G+1.2,T);
}
// how fast a car may go for the level crossings ahead of it (they stop short of the barriers when they're down)
function xingLimit(c){
  let lim=99;
  for(const V of venues.values()){if(V.kind!=='xing'||!V.closed)continue;
    const sh=Math.sin(c.heading),ch=Math.cos(c.heading),h=V.ax==='x'?ch:sh;if(Math.abs(h)<0.45)continue;
    const along=V.ax==='x'?c.pos.x:c.pos.z;if(along<V.q0-1.5||along>V.q1+2.5)continue;
    const across=V.ax==='x'?c.pos.z:c.pos.x,dist=(V.lc-across)*Math.sign(h)-4.6-(c.hz||2.2);
    if(dist>-1.5&&dist<34)lim=Math.min(lim,Math.max(0,dist*0.7));}
  return lim;
}
