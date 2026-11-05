// a link road out across open country (a stray bit of town joined up to the rest): plain asphalt with its centre line,
// levelled into the ground. Returns false if there isn't one in this column
function linkRoad(col,px,pz,rx,rz,x,z){
  const roadX=rx<ROADW,roadZ=rz<ROADW;
  if(!stripOpen(px,pz,roadX,roadZ)||(roadX&&!roadZ?gCol(px,z):roadZ&&!roadX?gRow(pz,x):false))return false;
  let top=ASPHALT;
  if(roadX&&!roadZ&&(rx===RC-1||rx===RC))top=rx===RC?LINE_R:LINE;
  else if(roadZ&&!roadX&&(rz===RC-1||rz===RC))top=rz===RC?LINEX_R:LINEX;
  else if(roadX&&roadZ&&jDeg(px,pz)<=2)top=bendLine(px,pz,rx,rz);
  col(G-1,DIRT);col(G,top);for(let y=G+1;y<G+10;y++)col(y,AIR);
  return true;
}
// distance from (x,z) to the nearest street, link road or not (for levelling the land and keeping trees off it: a town's
// edge street runs along the low side of the plains block next door, so it's out on the plains too)
const linkNearC=new Map();
function linkNear(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),ck=px*100003+pz;let L=linkNearC.get(ck);
  if(L===undefined){L=[];for(let i=px-1;i<=px+1;i++)for(let j=pz-1;j<=pz+1;j++)for(const d of [0,1])if(segOpen(i,j,d))L.push(d===0?[i*CELL,i*CELL+ROADW,j*CELL,(j+1)*CELL+ROADW]:[i*CELL,(i+1)*CELL+ROADW,j*CELL,j*CELL+ROADW]);linkNearC.set(ck,L);}
  let e=1e9;for(const [a,b,c,d] of L){const dx=x<a?a-x:x>b?x-b:0,dz=z<c?c-z:z>d?z-d:0;e=Math.min(e,Math.hypot(dx,dz));}
  return e;
}
function genChunk(cx,cz){
  // (a chunk lies inside one block, so it's all shown or all flat)
  if(TENV&&!TR.raw){const B=TENV_PL.get(tenvK(Math.floor(cx*CS/CELL),Math.floor(cz*CS/CELL)));if(!B)return flatChunk(cx,cz);if(B.sx!==B.ax||B.sz!==B.az)return trChunk(cx,cz,B);}
  const a=new Uint8Array(CS*CS*H),x0=cx*CS,z0=cz*CS;
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,rx=mod(x,CELL),rz=mod(z,CELL);
    const col=(y,b)=>{a[li(lx,y,lz)]=b;};
    for(let y=0;y<G;y++)col(y,earthAt(x,y,z));
    caveCol(col,x,z);
    // a river block: water, banks and bridges (streets across it stay, with the water running underneath)
    // the plains: rolling grass, ponds, the odd boulder; farms; rivers winding through with grassy banks
    {const qx=Math.floor(x/CELL),qz=Math.floor(z/CELL);if(seaPlot(qx,qz)){seaColumn(a,col,qx,qz,rx,rz,lx,lz,x,z);continue;}}
    {const qx=Math.floor(x/CELL),qz=Math.floor(z/CELL);if(biomeOf(qx,qz)==='plains'){
      const TS=tsAt(x,z);
      if(TS)truckStopColumn(a,col,TS,qx,qz,rx,rz,lx,lz,x,z);
      else if(plotType(qx,qz)==='truckstop'){plainsColumn(col,x,z);const P=plotInfo(qx,qz);for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1){col(G,b.floor);buildingColumn(a,lx,lz,rx,rz,b,collapses[qx+','+qz+','+bi],qx,qz);break;}}}
      else if(plotType(qx,qz)==='dump')dumpColumn(a,col,qx,qz,rx,rz,lx,lz,x,z);
      else if(plotType(qx,qz)==='castle')castleColumn(a,col,qx,qz,rx,rz,lx,lz,x,z);
      else if(bigPlainsAt(qx,qz)){const B=bigPlainsAt(qx,qz);bigColumn(col,B,x-B.ax*CELL,z-B.az*CELL,x,z);{const Pq=plotInfo(qx,qz);for(const b of Pq.b)if(!b.noIndoor&&rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1)col(G,b.floor);plotBuildings(a,lx,lz,rx,rz,x,z,Pq);}}
      else if(plotType(qx,qz)==='farm')farmColumn(a,col,qx,qz,rx,rz,lx,lz,x,z);
      else if((rx<ROADW||rz<ROADW)&&linkRoad(col,qx,qz,rx,rz,x,z)){}
      else if(farmlandOf(qx,qz))farmlandColumn(col,farmlandOf(qx,qz),qx,qz,rx,rz,x,z);
      else{plainsColumn(col,x,z);if(farmLaneCol(x,z)){col(G-1,DIRT);col(G,GRAVEL);col(G+1,AIR);}if(bunkerAt(qx,qz))bunkerColumn(col,rx,rz,x,z);else if(caveMouth(qx,qz))caveMouthColumn(col,rx,rz,x,z);else if(turbineAt(qx,qz))turbineColumn(col,rx,rz);}   // (a farm lane: two blocks wide, flaring out where it meets the road)
      pylonColumn(col,x,z);railColumn(col,x,z);
      // a river winding through: its water and banks cut into whatever's there
      {const W=riverAt(x+0.5,z+0.5,RIV_W+5);if(W)plainsRiverColumn(col,W.d);}
      continue;}}
    {const qx=Math.floor(x/CELL),qz=Math.floor(z/CELL);if(isRiver(qx,qz)&&riverColumn(col,qx,qz,rx,rz))continue;}
    // inside a superblock (its pavement ring or its site): laid out in the superblock's own coordinates
    {const S=superOf(Math.floor(x/CELL),Math.floor(z/CELL));if(S&&x-S.ax*CELL>=ROADW&&z-S.az*CELL>=ROADW){superColumn(a,col,S,x,z,lx,lz);continue;}}
    const roadX=rx<ROADW,roadZ=rz<ROADW,cpx=Math.floor(x/CELL),cpz=Math.floor(z/CELL);
    // a joined street: an alley or shared back gardens (an intersection joins in only when all four of its arms do)
    let J=null;
    if(roadX&&!roadZ)J=jz(cpx,cpz);else if(roadZ&&!roadX)J=jx(cpx,cpz);
    else if(roadX&&roadZ){const a=jz(cpx,cpz),b=jz(cpx,cpz-1),c=jx(cpx,cpz),d=jx(cpx-1,cpz);if(a&&a===b&&a===c&&a===d)J=a;}
    const PB=(roadX||roadZ)?null:plotBounds(cpx,cpz);
    // (a station stands out over most of the pavement on its town side: the line leaves it no other room to grow)
    if(PB&&plotType(cpx,cpz)==='station'){const sa=railStation(cpx,cpz);if(sa==='x')PB.z0=Math.min(PB.z0,ROADW+1);else if(sa==='z')PB.x0=Math.min(PB.x0,ROADW+1);}
    if(J){joinColumn(col,J,roadX&&!roadZ?rx:roadZ&&!roadX?rz:Math.min(rx,rz),roadX&&!roadZ?z:x,x,z);}
    else if((roadX||roadZ)&&!stripOpen(cpx,cpz,roadX,roadZ))plainsColumn(col,x,z);   // no street on this side: open ground
    else if(roadX||roadZ){
      let top=ASPHALT;
      // zebra crossings only where streets meet (not at a dead end, a corner or a bend)
      const cwZ=roadX&&!roadZ&&(rz===ROADW||rz===ROADW+1?jDeg(cpx,cpz)>=3:(rz===CELL-2||rz===CELL-1)&&jDeg(cpx,cpz+1)>=3);
      const cwX=roadZ&&!roadX&&(rx===ROADW||rx===ROADW+1?jDeg(cpx,cpz)>=3:(rx===CELL-2||rx===CELL-1)&&jDeg(cpx+1,cpz)>=3);
      if(cwZ)top=CROSS;
      else if(cwX)top=CROSSX;
      // (a solid double yellow down the middle, the same as the highways, and a white stop line across the lane coming up
      // to lights or a stop sign. Traffic keeps right, so that's a different half of the road at each end.)
      else if(roadX&&!roadZ&&(rx===RC-1||rx===RC))top=rx===RC?LINE_R:LINE;
      else if(roadZ&&!roadX&&(rz===RC-1||rz===RC))top=rz===RC?LINEX_R:LINEX;
      else if(roadX&&!roadZ&&(rz===CELL-3&&rx<RC&&stopLine(cpx,cpz+1)||rz===ROADW+2&&rx>RC&&stopLine(cpx,cpz)))top=LANEX;
      else if(roadZ&&!roadX&&(rx===CELL-3&&rz>RC&&stopLine(cpx+1,cpz)||rx===ROADW+2&&rz<RC-1&&stopLine(cpx,cpz)))top=LANE;
      else if(roadX&&roadZ&&jDeg(cpx,cpz)<=2)top=bendLine(cpx,cpz,rx,rz);
      if(roadX&&roadZ&&ctlAt(Math.floor(x/CELL),Math.floor(z/CELL)).k==='round'){const is=roundIsland(rx,rz);if(is){top=GRASS;if(is===2){col(G+1,LEAVES);col(G+2,LEAVES);}else if(hash2(x,z)<0.3)col(G+1,FLOWER);}}
      col(G,top);
    } else if(rx<PB.x0||rx>=PB.x1||rz<PB.z0||rz>=PB.z1){
      col(G,SIDEWALK);
      if(((rx===ROADW||rx===CELL-1)&&(rz===PL0+4||rz===PL1-4))||((rz===ROADW||rz===CELL-1)&&(rx===PL0+4||rx===PL1-4))){/* street lamp: a slender mesh post, see street furniture */}
      else if((rx===ROADW||rx===ROADW+1)&&rz>=STZ-1&&rz<=STZ+1){
        // street vendor's stall: counter, posts, striped awning
        const P=plotInfo(Math.floor(x/CELL),Math.floor(z/CELL));
        if(P.stall&&P.type!=='ramp'){
          if(rx===ROADW){col(G+1,rz===STZ?CRATE:PLANKS);if(rz===STZ)col(G+2,FLOWER);else{col(G+2,METAL);col(G+3,METAL);}}
          col(G+4,P.stall===1?AWN_R:AWN_G);
        }
      }
    } else {
      const P=plotInfo(Math.floor(x/CELL),Math.floor(z/CELL));
      if(P.type==='park'){
        col(G-1,DIRT);
        const path=rx===PC-1||rx===PC||rz===PC-1||rz===PC,border=rx===PL0||rx===PL1-1||rz===PL0||rz===PL1-1;
        if(P.pond&&rx>=PC-5&&rx<=PC+4&&rz>=PC-5&&rz<=PC+4){
          if(rx===PC-5||rx===PC+4||rz===PC-5||rz===PC+4)col(G,STONE);
          else{col(G,WATER);col(G-1,WATER);}
        } else if(!P.pond&&!P.statue&&rx>=PC-3&&rx<=PC+2&&rz>=PC-3&&rz<=PC+2){
          col(G,GRAVEL);
          if(rx===PC-3||rx===PC+2||rz===PC-3||rz===PC+2)col(G+1,STONE);else col(G+1,WATER);
          if(rx>=PC-1&&rx<=PC&&rz>=PC-1&&rz<=PC){col(G+1,STONE);col(G+2,STONE);col(G+3,WATER);}
        } else if(path)col(G,GRAVEL);
        else{
          col(G,GRASS);
          if(border)col(G+1,LEAVES);
          else if(hash2(x*5+3,z*11+1)<0.07)col(G+1,FLOWER);
        }
        if(P.statue&&rx>=PC-3&&rx<=PC+2&&rz>=PC-3&&rz<=PC+2)col(G,GRAVEL);   // (gravel round the statue)
        plotBuildings(a,lx,lz,rx,rz,x,z,P);
      }
      else if(P.type==='ramp'){col(G-1,DIRT);col(G,GRASS);}   // plain mown grass: cars drive across it to and from the ramps
      else if(P.type==='court'){col(G-1,DIRT);courtCol(col,P,rx,rz,x,z);}
      else if(P.type==='camp'){col(G-1,DIRT);campCol(col,P,rx,rz,x,z);}
      else if(P.type==='farmers'){farmersCol(col,P,rx,rz,x,z);}
      else if(P.type==='cemetery'){col(G-1,DIRT);cemeteryCol(col,P,rx,rz,x,z);plotBuildings(a,lx,lz,rx,rz,x,z,P);}
      else if(P.type==='plaza'){
        col(G,(rx+rz)%2?SIDEWALK:CONCRETE);
        if(P.feat==='pillar'&&rx>=PC-1&&rx<=PC&&rz>=PC-1&&rz<=PC){for(let y=G+1;y<=G+6;y++)col(y,MOSSSTONE);col(G+7,NEON_G);}
        plotBuildings(a,lx,lz,rx,rz,x,z,P);
      } else {
        // the ground, then whatever the plot lays out around its buildings
        const B0=P.b[0];let gnd=CONCRETE;
        if(P.type==='garage'||P.type==='gas'||P.type==='fastfood')gnd=ASPHALT;
        else if(P.type==='homes'||P.type==='wtower'||P.type==='bell'||P.type==='mansion'||P.type==='nursery'||P.type==='trailers'){gnd=GRASS;col(G-1,DIRT);}
        else if(P.type==='dealer')gnd=ASPHALT;
        else if(P.type==='rail'||P.type==='station'){gnd=GRASS;col(G-1,DIRT);}
        else if(P.type==='metro'){gnd=(rx+rz)%2?SIDEWALK:CONCRETE;const st=metroStation(cpx,cpz),u=st&&st.ax==='x'?rx:rz,c=st&&st.ax==='x'?rz-RAIL_C:rx-RAIL_C;
          if(st&&c>=-4&&c<=6&&u>=PL0+1&&u<PL1-1&&(u%6===2)&&(c===-4||c===6)){col(G+1,GRASS);col(G+2,LEAVES);}else if(st&&c===1&&u%6===5&&u>=PL0+1&&u<PL1-1)col(G+1,SEAT_B);}
        else if((P.type==='grocery'||P.type==='hospital')&&B0&&rz<B0.z0)gnd=ASPHALT;
        col(G,gnd);
        if(P.type==='homes')yardCol(col,P,rx,rz,x,z);
        else if(P.type==='wtower'||P.type==='bell')landmarkYard(col,P,rx,rz,x,z);
        else if(P.type==='derelict')derelictYard(col,P,rx,rz,x,z);
        else if(P.type==='mansion')mansionYard(col,P,rx,rz,x,z);
        else if(P.type==='trailers')trailerYard(col,P,rx,rz,x,z);
        else if(P.type==='nursery')nurseryYard(col,P,rx,rz,x,z);
        else if(P.type==='dealer')dealerLot(col,P,rx,rz,x,z);
        else if(P.type==='datacenter'){col(G,(rx+rz)%9===0?GRAVEL:CONCRETE);if((rx===PL0||rx===PL1-1||rz===PL0||rz===PL1-1)&&!(rz===PL0&&Math.abs(rx-PC)<=1))for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);}
        else if(P.type==='electric'&&rx>=P.substation.x0){const S2=P.substation;col(G,GRAVEL);
          if(rx===S2.x0||rx===S2.x1-1||rz===S2.z0||rz===S2.z1-1){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);}
          else if((rx-S2.x0)%5>=2&&(rx-S2.x0)%5<=3&&(rz-PL0)%6>=2&&(rz-PL0)%6<=3&&rz>PL0+6&&rz<PL1-6){col(G+1,METAL);col(G+2,(rx+rz)%2?RUST:METAL);col(G+3,PAINT_DARK);if((rx+rz)%2===0)col(G+4,METAL);}}
        else if(P.bollards&&B0&&rz===B0.z0-2&&rx%2===0&&Math.abs(rx-((B0.x0+B0.x1)>>1))>1)col(G+1,CONCRETE);   // bollards
        else if(P.type==='gas')forecourtCol(col,rx,rz,P);
        else if(P.type==='grocery'&&rz<B0.z0){if(rz>=PL0+1&&rz<PL0+5&&rx%3===0)col(G,LANE);if(rz===B0.z0-1&&rx>=B0.x0&&rx<B0.x1){const aw=B0.brand?B0.brand.awn:'g';if(aw!=='none')col(G+5,aw==='r'?AWN_R:AWN_G);}}
        else if(P.type==='hospital'&&rz<B0.z0){if(rz===B0.z0-2&&rx%4<2)col(G,CROSS);}
        else if(P.type==='food'&&P.patio&&rz>=P.patio.z0&&rz<P.patio.z1){
          // the patio's paving (its tables and umbrellas are props: see patioProps)
          col(G,(rx+rz)%2?SIDEWALK:CONCRETE);
        }
        else if(P.type==='police'&&rz<B0.z0&&rz>=PL0){col(G,ASPHALT);if(rz>=B0.z0-5&&(rx===PL0+2||rx===PL0+6||rx===PL0+11))col(G,LINE_R);}
        else if(P.type==='fire'&&rz<B0.z0){col(G,ASPHALT);if(B0.bays.some(c=>Math.abs(rx-c)===2))col(G,LINE_R);}
        else if(P.type==='build')buildSiteCol(col,P,rx,rz,x,z);
        else if(P.type==='fastfood'){const b=P.b[0],B=b.brand;
          if(rx===P.pole.x&&rz===P.pole.z)col(G+1,CONCRETE);   // the pole sign's footing
          if(rx===b.x1+2&&rz===b.z1-2){col(G+1,METAL);col(G+2,SCREEN);}   // the drive-thru menu board
          if((rx===b.x1+3||rx===b.x0-2)&&rz>=b.z0&&rz<b.z1&&(rz%2))col(G,LANE);}
        else if(P.type==='sitdown'&&rz<P.b[0].z0){const b=P.b[0];if(Math.abs(rx-((b.x0+b.x1)>>1))<=3&&rz===b.z0-1){col(G+5,(b.brand&&b.brand.wall)===PLANKS?PLANKS:AWN_R);}if(rz<b.z0-1&&rx%5===2&&rz===PL0+1){col(G+1,FLOWER);}}
        {const L=lotAt(P,rx,rz);if(L)col(G,lotMark(L,rx,rz)?lotLine(L):ASPHALT);}
        for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1){if(b.style==='house')col(G,b.floor);else if(roomFloor(b,rz))col(G,roomFloor(b,rz));buildingColumn(a,lx,lz,rx,rz,b,collapses[Math.floor(x/CELL)+','+Math.floor(z/CELL)+','+bi],Math.floor(x/CELL),Math.floor(z/CELL));break;}}
      }
    }
  }
  // sky-bridges between towers, spanning the street
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,br=bridgeAt(x,z);if(!br)continue;
    for(let y=br.y0;y<=br.y1&&y<H;y++){const v=bridgeBlock(br,x,z,y);if(v!==AIR||y>br.y0&&y<br.y1)a[li(lx,y,lz)]=v;}
  }
  // raised highways: deck, crash barriers, the centre line, and pillars down onto the pavements either side
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz;
    const pa=Math.floor((z+3)/CELL);{const q=z-pa*CELL+3;if(q>=0&&q<=13){const r=hwRampAt('x',pa,x);if(r)hwRampCol(a,lx,lz,q,HY_X,r,x);else if(hwRow(pa,Math.floor(x/CELL)))hwSeg(a,lx,lz,x,q,HY_X,true,pa);}}
    const pb=Math.floor((x+3)/CELL);{const q=x-pb*CELL+3;if(q>=0&&q<=13){const r=hwRampAt('z',pb,z);if(r)hwRampCol(a,lx,lz,q,HY_Z,r,z);else if(hwCol(pb,Math.floor(z/CELL)))hwSeg(a,lx,lz,z,q,HY_Z,false,pb);}}
  }
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const put=(y,v)=>{a[li(lx,y,lz)]=v;};rampColumn(put,x0+lx,z0+lz);cloverColumn(put,x0+lx,z0+lz);}
  // ground-level highways across the plains (in the places themselves they're just the main street)
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,pa=Math.floor((z+3)/CELL),pb=Math.floor((x+3)/CELL);
    let rowQ=gRow(pa,x)&&biomeOf(Math.floor(x/CELL),pa)==='plains'?z-pa*CELL+3:-1,colQ=gCol(pb,z)&&biomeOf(pb,Math.floor(z/CELL))==='plains'?x-pb*CELL+3:-1;if(rowQ>13)rowQ=-1;if(colQ>13)colQ=-1;
    if(rowQ<0&&colQ<0)continue;
    for(let y=G+1;y<G+12;y++)a[li(lx,y,lz)]=AIR;   // (clear any hill, tree or pond)
    for(let y=G-2;y<G;y++)a[li(lx,y,lz)]=DIRT;
    if(rowQ>=0&&colQ>=0)a[li(lx,G,lz)]=ASPHALT;   // where two meet: an open junction
    // a town street coming up to the highway from the side (where it runs along the edge of town): an opening in the barrier
    else if(rowQ===0&&colQ<0&&mod(x,CELL)<ROADW&&segOpen(Math.floor(x/CELL),pa-1,0)){a[li(lx,G,lz)]=ASPHALT;}
    else if(rowQ===13&&colQ<0&&mod(x,CELL)<ROADW&&segOpen(Math.floor(x/CELL),pa,0)){a[li(lx,G,lz)]=ASPHALT;}
    else if(colQ===0&&rowQ<0&&mod(z,CELL)<ROADW&&segOpen(pb-1,Math.floor(z/CELL),1)){a[li(lx,G,lz)]=ASPHALT;}
    else if(colQ===13&&rowQ<0&&mod(z,CELL)<ROADW&&segOpen(pb,Math.floor(z/CELL),1)){a[li(lx,G,lz)]=ASPHALT;}
    else if(rowQ>=0)hwDeck(a,lx,lz,x,rowQ,G,true);else hwDeck(a,lx,lz,z,colQ,G,false);
  }
  // the highways out across the plains, on their own curving lines: country highways on the ground, motorways up on
  // their decks. (They start at the edge of town; where one cuts across a stray bit of another place, it goes right
  // through whatever's there.)
  {const L=routesNearBox(x0,z0,x0+CS-1,z0+CS-1);
   if(L.length){const LC=[],LM=[],LZ=[];for(let q=0;q<L.length;q+=2)(L[q].kind!=='moto'?LC:L[q].HY===HY_Z?LZ:LM).push(L[q],L[q+1]);
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
      const x=x0+lx,z=z0+lz;
      // (not past either end of a route: there it's the town's own street or deck)
      const past=n=>n.i===0&&n.t<=0||n.i===n.R.pts.length-2&&n.t>=1;
      if(LC.length){const n=nearestOn(LC,x+0.5,z+0.5,9.6);if(n&&!past(n))routeColumn(a,lx,lz,x,z,n,G);}
      if(LM.length){const n=nearestOn(LM,x+0.5,z+0.5,9.6);if(n&&!past(n))routeColumn(a,lx,lz,x,z,n,n.R.HY);}
      if(LZ.length){const n=nearestOn(LZ,x+0.5,z+0.5,9.6);if(n&&!past(n))routeColumn(a,lx,lz,x,z,n,n.R.HY);}   // (the along-z motorways, higher up, pass over the along-x ones)
    }}}
  // plains trees: a few scattered, more where copses grow (leaves may reach across chunk edges, so look wider)
  {const putT=(px,py,pz,b,onlyAir)=>{const lx=px-x0,lz=pz-z0;if(lx<0||lz<0||lx>=CS||lz>=CS||py<0||py>=H)return;const i=li(lx,py,lz);if(onlyAir&&a[i]!==AIR)return;a[i]=b;};
   for(let z=z0-2;z<z0+CS+2;z++)for(let x=x0-2;x<x0+CS+2;x++){
     const wood=siteTrees(x,z);if(!wood&&!PLAINS_OPEN(Math.floor(x/CELL),Math.floor(z/CELL))||(x+z)%2||roadNear(x,z,14)<4||railNear(x,z)<6)continue;
     const copse=wood?wood:lumberNear(Math.floor(x/CELL),Math.floor(z/CELL))?1.1:Math.max(0,Math.sin(x*0.021+0.6)+Math.sin(z*0.026+2.2)-1.0);
     if(hash2(x*3+1,z*7+5)>0.006+0.11*copse)continue;
     if(boardNear(x,z,7))continue;
     const h=plainsH(x,z);if(h<0)continue;
     const gy=G+h,th=4+Math.floor(hash2(x,z+99)*3),top=gy+th;
     for(let y=1;y<=th;y++)putT(x,gy+y,z,LOG,false);
     for(let dy=-2;dy<=1;dy++){const rad=dy<=-1?2:1;for(let dz=-rad;dz<=rad;dz++)for(let dx=-rad;dx<=rad;dx++){if(rad===2&&Math.abs(dx)===2&&Math.abs(dz)===2&&hash2(x+dx*5,z+dz*5+dy)<.6)continue;putT(x+dx,top+dy,z+dz,LEAVES,true);}}
     putT(x,top+1,z,LEAVES,true);
   }}
  // park trees (leaves may reach across chunk edges, so look a little wider)
  const put=(px,py,pz,b,onlyAir)=>{const lx=px-x0,lz=pz-z0;if(lx<0||lz<0||lx>=CS||lz>=CS||py<0||py>=H)return;const i=li(lx,py,lz);if(onlyAir&&a[i]!==AIR)return;a[i]=b;};
  for(let z=z0-2;z<z0+CS+2;z++)for(let x=x0-2;x<x0+CS+2;x++){
    const rx=mod(x,CELL),rz=mod(z,CELL);
    const BS=superOf(Math.floor(x/CELL),Math.floor(z/CELL));
    if(BS&&BS.kind==='capitol'){
      const u=x-BS.ax*CELL-PL0,v=z-BS.az*CELL-PL0;
      if(u<0||v<0||u>=CAP.W||v>=CAP.L||!capitolTree(u,v,x,z))continue;
    } else if(BS&&BS.kind==='bigpark'){
      const u=x-BS.ax*CELL-PL0,v=z-BS.az*CELL-PL0,W=(BS.w-1)*CELL+PW,L=(BS.h-1)*CELL+PW;
      if(u<0||v<0||u>=W||v>=L||!bigParkTree(u,v,W,L,x,z))continue;
    } else {
    if(rx<PL0+1||rx>PL1-2||rz<PL0+1||rz>PL1-2||(rx>=PC-5&&rx<=PC+4&&rz>=PC-5&&rz<=PC+4)||rx===PC-1||rx===PC||rz===PC-1||rz===PC||(rx+rz)%2)continue;
    if(hash2(x*3+1,z*7+5)>0.22)continue;
    if(plotInfo(Math.floor(x/CELL),Math.floor(z/CELL)).type!=='park')continue;
    }
    const gy=G;
    const th=4+Math.floor(hash2(x,z+99)*3),top=gy+th;
    for(let y=1;y<=th;y++)put(x,gy+y,z,LOG,false);
    for(let dy=-2;dy<=1;dy++){const rad=dy<=-1?2:1;for(let dz=-rad;dz<=rad;dz++)for(let dx=-rad;dx<=rad;dx++){if(rad===2&&Math.abs(dx)===2&&Math.abs(dz)===2&&hash2(x+dx*5,z+dz*5+dy)<.6)continue;put(x+dx,top+dy,z+dz,LEAVES,true);}}
    put(x,top+1,z,LEAVES,true);
  }
  undergroundPass(a,x0,z0);
  railPass(a,x0,z0);
  if(TR.raw)return a;   // (a moved box's source: what's smashed and frozen is the box's own, added by trChunk)
  const ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  if(WX.frozen)freezeArr(a,true);
  return a;
}
// a chunk of a moved box: the same chunk of its source, as the plan makes it there (what's fallen down at the box
// standing in for what fell at the source), then what's been smashed here
function trChunk(cx,cz,B){
  const dx=B.sx-B.ax,dz=B.sz-B.az,real=collapses,mv=k=>{const m=typeof k==='string'&&/^(-?\d+),(-?\d+)(,.*)$/.exec(k);return m?(+m[1]-dx)+','+(+m[2]-dz)+m[3]:k;};
  collapses=new Proxy(real,{get:(o,k)=>o[mv(k)],has:(o,k)=>mv(k) in o});
  let a;TR.raw++;TR.d++;try{a=genChunk(cx+dx*CELL/CS,cz+dz*CELL/CS);}finally{TR.raw--;TR.d--;collapses=real;}
  const x0=cx*CS,z0=cz*CS,ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  if(WX.frozen)freezeArr(a,true);
  return a;
}
// the Testing Environment's empty ground: grass on top, the usual earth and bedrock under it (smashed blocks still apply)
function flatChunk(cx,cz){
  const a=new Uint8Array(CS*CS*H),x0=cx*CS,z0=cz*CS;
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){for(let y=0;y<G;y++)a[li(lx,y,lz)]=earthAt(x0+lx,y,z0+lz);a[li(lx,G,lz)]=GRASS;}
  const ce=chunkEdits.get(ckey(cx,cz));
  if(ce)for(const [x,y,z,b] of ce)a[li(x-x0,y,z-z0)]=b;
  if(WX.frozen)freezeArr(a,true);
  return a;
}
function chunkArr(cx,cz){const k=ckey(cx,cz);if(k===lastK)return lastA;let a=chunks.get(k);if(!a){a=genChunk(cx,cz);chunks.set(k,a);}lastK=k;lastA=a;return a;}
// leaves fall in autumn and are gone in winter: leafFall is the share of leaf blocks that are down (each block has its own
// threshold), and a fallen leaf block counts as air everywhere -- you walk through it, snow settles under it, nothing draws it
let leafFall=0;const leafQ=[],leafCheckQ=new Set();
// the block actually stored there (fallen leaves included)
function rawGet(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0||y>=H)return AIR;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);return chunkArr(cx,cz)[li(x-cx*CS,y,z-cz*CS)];}
// a tree trunk was knocked out: any of its leaves (fallen for the winter or not) that no longer connect to a trunk are gone
// for good, so they don't grow back in spring hanging in mid-air
function purgeLeaves(){
  if(!leafCheckQ.size)return;const ch=new Set(),done=new Set();
  for(const key of leafCheckQ){const [x0,y0,z0]=key.split(',').map(Number);
    const inBox=(x,y,z)=>Math.abs(x-x0)<=5&&Math.abs(z-z0)<=5&&y>=y0-3&&y<=y0+10;
    for(let x=x0-5;x<=x0+5;x++)for(let z=z0-5;z<=z0+5;z++)for(let y=y0-3;y<=y0+10;y++){
      const k0=x+','+y+','+z;if(done.has(k0)||rawGet(x,y,z)!==LEAVES)continue;
      // one clump of leaves: does it touch a trunk (or run off the edge of the search, where it may)?
      const comp=[[x,y,z]],seen=new Set([k0]);let held=false;
      for(let i=0;i<comp.length;i++){const [a,b,c]=comp[i];
        for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const nx=a+dx,ny=b+dy,nz=c+dz,nb=rawGet(nx,ny,nz);
          if(nb===LOG){held=true;continue;}if(nb!==LEAVES)continue;const nk=nx+','+ny+','+nz;if(seen.has(nk))continue;
          if(!inBox(nx,ny,nz)){held=true;continue;}seen.add(nk);comp.push([nx,ny,nz]);}}
      for(const k of seen)done.add(k);
      if(!held)for(const [a,b,c] of comp){if(!leafDown(a,b,c))continue;   // (leaves you can see are already dealt with: they fall)
        setRaw(a,b,c,AIR);addEdit(a,b,c,AIR);ch.add(ckey(Math.floor(a/CS),Math.floor(c/CS)));}
    }}
  leafCheckQ.clear();if(ch.size){rebuildSet(ch);save();}
}
const leafHash=(x,y,z)=>hash2(x*7+y*131,z*13+y*17);
const leafDown=(x,y,z)=>leafFall>0&&leafHash(x,y,z)<leafFall;
function get(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0||y>=H)return AIR;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const b=chunkArr(cx,cz)[li(x-cx*CS,y,z-cz*CS)];return b===LEAVES&&leafDown(x,y,z)?AIR:b;}
function setRaw(x,y,z,b){if(y<0||y>=H)return;if(b===AIR&&y>G)noteRemoved(x,y,z);if(WX.snowCover>0){let open=true;for(let yy=y+1;yy<H;yy++)if(get(x,yy,z)){open=false;break;}if(open)snowBorn.set(Math.floor(x)*65536+Math.floor(z),WX.snowClock);}navCols.delete(Math.floor(x)*65536+Math.floor(z));const cx=Math.floor(x/CS),cz=Math.floor(z/CS);if(b!==LOG&&rawGet(x,y,z)===LOG)leafCheckQ.add(Math.floor(x)+','+Math.floor(y)+','+Math.floor(z));if(b===AIR&&get(x,y,z)===ICE)b=WATER;chunkArr(cx,cz)[li(x-cx*CS,y,z-cz*CS)]=b;}
function addEdit(x,y,z,b){if(b===AIR&&get(x,y,z)===WATER)b=WATER;edits[x+','+y+','+z]=b;const k=ckey(Math.floor(x/CS),Math.floor(z/CS));let l=chunkEdits.get(k);if(!l){l=[];chunkEdits.set(k,l);}l.push([x,y,z,b]);}
function solidAt(x,y,z){if(y<0)return true;if(y>=H)return false;const b=get(x,y,z);return !!(b&&BLOCK[b].solid);}
function groundAt(x,z,fromY){const xi=Math.floor(x),zi=Math.floor(z);for(let y=Math.min(H-1,Math.floor(fromY+1.2));y>=0;y--){const b=y<0?STONE:get(xi,y,zi);if(b&&BLOCK[b].solid)return BLOCK[b].ramp?y+rampH(b,x-xi,z-zi):y+1;}return 0;}
// what something standing at height y rests on: the first solid block at or below its feet, but only if that block has open air above it (otherwise it's a wall, and nothing gets lifted up it)
function supportAt(x,z,y){const xi=Math.floor(x),zi=Math.floor(z);for(let yy=Math.min(H-1,Math.floor(y+0.05));yy>=0;yy--){const b=get(xi,yy,zi);if(b&&BLOCK[b].solid){if(solidAt(xi,yy+1,zi)){
  // a ramp sitting on this block still makes a floor (something that slipped a little below its slope rides back up)
  const a2=get(xi,yy+1,zi);if(BLOCK[a2].ramp&&!solidAt(xi,yy+2,zi))return yy+1+rampH(a2,x-xi,z-zi);return null;}
  return BLOCK[b].ramp?yy+rampH(b,x-xi,z-zi):yy+1;}}return 0;}
// is the ground at (x,z) a ramp's slope? (lets walkers and cars take a rise they'd otherwise call a wall)
function rampUnder(x,z,y){const xi=Math.floor(x),zi=Math.floor(z);for(let yy=Math.min(H-1,Math.floor(y+1.5));yy>=Math.max(0,Math.floor(y-1.5));yy--){const b=get(xi,yy,zi);if(b&&BLOCK[b].solid)return !!BLOCK[b].ramp;}return false;}
function supportMax(cx,cz,h,y,pts){const s=Math.sin(h),c=Math.cos(h);let g=null;for(const [a,b] of pts){const v=supportAt(cx+a*c+b*s,cz-a*s+b*c,y);if(v!==null&&(g===null||v>g))g=v;}return g;}
function canStand(x,z,y){const s=supportAt(x,z,y);return s!==null&&s-y<1.05;}
function nudgeFlat(o,dx,dz){const s=supportAt(o.pos.x+dx,o.pos.z+dz,o.pos.y);if(s!==null&&s-o.pos.y<0.3){o.pos.x+=dx;o.pos.z+=dz;}}
function nudge(o,dx,dz){if(canStand(o.pos.x+dx,o.pos.z+dz,o.pos.y)){o.pos.x+=dx;o.pos.z+=dz;}}
function surfaceAt(x,z){const xi=Math.floor(x),zi=Math.floor(z);let y=H-1;while(y>0&&get(xi,y,zi)===AIR)y--;return{y:y+1,b:get(xi,y,zi)};}
const STREET=new Set([ASPHALT,LINE,LINEX,LINE_R,LINEX_R,CROSS,CROSSX,SIDEWALK,GRASS,CONCRETE]);
function findStreet(cx,cz,rMin,rMax){
  for(let k=0;k<160;k++){
    const a=Math.random()*Math.PI*2,r=rMin+Math.random()*(rMax-rMin)+(k>110?k-110:0);
    const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,s=surfaceAt(x,z);
    if(!(s.y===G+1&&STREET.has(s.b))&&!(s.b===GRASS&&biomeOf(Math.floor(x/CELL),Math.floor(z/CELL))==='plains'))continue;
    return new V3(Math.floor(x)+.5,s.y,Math.floor(z)+.5);
  }
  const x=Math.round(cx/CELL)*CELL+RC,z=Math.round(cz/CELL)*CELL+RC;
  return new V3(x,groundAt(x,z,H-2),z);
}

