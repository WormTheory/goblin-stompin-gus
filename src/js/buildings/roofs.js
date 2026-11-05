// ---- roofs: what stops every little shop being the same dark box. Each kind of place gets a shape it's known for: a
// hipped red hat on a pizza place, a mansard on a burger bar, a tin barrel on a diner, a false front on a corner shop... ----
const PAINTED=new Set([PAINT_RED,PAINT_GREEN,PAINT_BLUE,PAINT_ORANGE,PAINT_YELLOW,PAINT_WHITE,PAINT_NAVY]);
function roofOf(b){
  if(b._rf!==undefined)return b._rf;let v=null;const cat=b.signCat,B=b.brand;
  if(b.rfForce)return b._rf=b.rfForce;
  if(cat&&b.style==='normal'&&b.top-G<=16&&!b.tier&&!b.fort&&!b.saw&&b.x1-b.x0>=5&&b.z1-b.z0>=5&&cat!=='kiosk'){
    const col=B&&PAINTED.has(B.wall)?B.wall:null,h=hash2(b.x0*31+(B?B.n.length:0)*7+b.z1,b.z0*17+b.top),pick=L=>L[Math.floor(h*L.length)];
    if(cat==='pizza')v={k:'hip',c:PAINT_RED};
    else if(cat==='fastfood')v={k:'mansard',c:col||PAINT_RED};
    else if(cat==='diner')v={k:'barrel',c:METAL};
    else if(cat==='cafe')v={k:'gable',c:PLANKS};
    else if(cat==='sitdown')v={k:h<0.5?'gable':'hip',c:B&&B.wall===PLANKS?PLANKS:SHINGLE};
    else if(cat==='drug')v={k:'front',c:col||b.wall};
    else if(cat==='bank')v={k:'dome',c:GOLD};
    else if(cat==='library')v={k:'hip',c:PAINT_GREEN};
    else if(cat==='disco')v={k:'ball'};
    else if(cat==='club'||cat==='theater')v={k:'front',c:b.wall};
    else if(cat==='shop'&&b.top-G<=8||SHOP_ROOF.has(cat))v={k:pick(['front','mansard','gable','front']),c:pick([SHINGLE,SHINGLE,PLANKS,col||PAINT_RED])};
    if(v&&(v.k==='hip'||v.k==='mansard'||v.k==='gable'||v.k==='barrel'))b.neon=0;   // (the roof says it now: no neon rim as well)
  }
  return b._rf=v;
}
const SHOP_ROOF=new Set(['books','dentist','dispo','guns','bar','soup']);
function roofColumn(put,b,rf,rx,rz){
  const T=b.top,W=b.x1-b.x0,D=b.z1-b.z0,e=Math.min(rx-b.x0,b.x1-1-rx,rz-b.z0,b.z1-1-rz),long=W>=D,n=long?D:W,c=long?rz-b.z0:rx-b.x0,cross=Math.min(c,n-1-c);
  const stack=(h,v)=>{for(let y=T+1;y<=T+h;y++)put(y,v);};
  if(rf.clock){
    // the clock tower, up through the middle of the roof
    const du=Math.abs(rx-(b.x0+b.x1-1)/2),dv=Math.abs(rz-(b.z0+b.z1-1)/2),HT=13;
    if(du<=2&&dv<=2){for(let y=T+1;y<=T+HT;y++){const k=y-T,face=k>=8&&k<=10&&(du===2||dv===2)&&(du<=1||dv<=1);put(y,face?(du===0&&dv===2||dv===0&&du===2)&&k===9?PAINT_DARK:PAINT_WHITE:du===2||dv===2?BRICK:AIR);}
      put(T+HT+1,SHINGLE);if(du<=1&&dv<=1)put(T+HT+2,SHINGLE);if(du<1&&dv<1){put(T+HT+3,SHINGLE);put(T+HT+4,METAL);}return;}}
  if(rf.k==='hip')stack(Math.min(e+1,4),rf.c);
  else if(rf.k==='mansard'){if(e<2)stack(e+1,rf.c);}
  else if(rf.k==='gable')stack(Math.min(cross+1,4),rf.c);
  else if(rf.k==='barrel'){const t=(c-(n-1)/2)/(n/2);stack(Math.round(Math.sqrt(Math.max(0,1-t*t))*Math.min(3,n/2)),rf.c);}
  else if(rf.k==='front'){
    // the false front over the doors, stepped up in the middle; air-conditioning units on the flat roof behind
    const fd=b.door===0?rx-b.x0:b.door===1?b.x1-1-rx:b.door===2?rz-b.z0:b.z1-1-rz,al=b.door<2?rz-b.z0:rx-b.x0,L=b.door<2?D:W,q=Math.abs(al-(L-1)/2);
    if(fd===0)stack(q<L*0.2?3:q<L*0.36?2:1,rf.c);
    else if(fd>=3&&fd<=4&&q>=1&&q<=2)stack(1,METAL);
  } else if(rf.k==='dome'){
    const d=Math.hypot(rx-(b.x0+b.x1-1)/2,rz-(b.z0+b.z1-1)/2),R=Math.min(W,D)/2-1.5;if(d<R)stack(Math.max(1,Math.round(Math.sqrt(R*R-d*d))),rf.c);
    if(d<0.8)for(let y=T+1;y<=T+Math.round(R)+2;y++)put(y,y>T+Math.round(R)?METAL:rf.c);
  } else if(rf.k==='pad'){
    // a helipad on the roof: a white ring and an H, a red light at each corner of it
    const dx=rx-(b.x0+b.x1-1)/2,dz=rz-(b.z0+b.z1-1)/2,d=Math.hypot(dx,dz);
    if(d<=7){stack(1,d>6||(Math.abs(dx)<=3&&Math.abs(dz)<=3&&(Math.abs(dx)===3||Math.abs(dx)<1&&Math.abs(dz)<1||Math.floor(dz)===0&&Math.abs(dx)<=3))?PAINT_WHITE:CONCRETE);}
  } else if(rf.k==='whale'){
    // a great blue whale leaping off the roof, its tail in the air
    const u=rx-(b.x0+b.x1-1)/2,v=rz-(b.z0+b.z1-1)/2;
    for(let y=T+1;y<=T+18;y++){const k=y-T,e1=(u/13)**2+(v/5)**2+((k-6)/5.5)**2;
      if(e1<1){put(y,k<4?PAINT_WHITE:PAINT_BLUE);continue;}
      if(u>11&&u<19&&Math.abs(v)<=1&&k>=4+(u-11)*0.8&&k<=7+(u-11)*0.8){put(y,PAINT_BLUE);continue;}
      if(u>=17&&u<=20&&Math.abs(v)<=6-(u-17)&&k>=11&&k<=13){put(y,PAINT_NAVY);continue;}}
    if(Math.abs(u+9)<=1&&(v===5||v===-5))put(T+7,PAINT_DARK);
  } else if(rf.k==='ball'){
    // a mirror ball on a pole
    const dx=rx-(b.x0+b.x1-1)/2,dz=rz-(b.z0+b.z1-1)/2;if(Math.abs(dx)<1&&Math.abs(dz)<1)stack(3,METAL);
    for(let y=T+3;y<=T+10;y++){const d=Math.hypot(dx,dz,y-(T+6.5));if(d<3.9&&d>2.5)put(y,(rx+rz+y)%3===0?NEON_M:(rx+rz+y)%3===1?GLASS:NEON_B);}
  }
}
function buildingColumn(a,lx,lz,rx,rz,b,cap,px,pz){
  const put=(y,v)=>{if(y<H)a[li(lx,y,lz)]=v;};const rf=roofOf(b);
  const tierOn=b.tier>0&&(b.x1-b.x0)>=8;
  const inner=rx>=b.x0+2&&rx<b.x1-2&&rz>=b.z0+2&&rz<b.z1-2;
  const top=((tierOn&&!inner)?b.tier:b.top)+(b.roof||0),lim=cap!==undefined?Math.min(top,cap-1):top;
  for(let y=G+1;y<=lim&&y<H;y++)put(y,blockAt(b,rx,rz,y,px,pz));
  if(cap!==undefined)for(let y=Math.max(G+1,cap);y<=top&&y<cap+FH+1;y++)if(collapseKeep(b,px,pz,rx,rz,y,cap))put(y,blockAt(b,rx,rz,y,px,pz));
  if(rf&&cap===undefined)roofColumn(put,b,rf,rx,rz);
  if(b.ant&&cap===undefined&&rx===((b.x0+b.x1)>>1)&&rz===((b.z0+b.z1)>>1)){const t2=Math.min(H-2,b.top+b.ant);for(let y=b.top+1;y<=t2;y++)put(y,METAL);put(t2+1,NEON_M);}
}
// what kind of control an intersection has: traffic lights, an all-way stop, or yield signs on one road
// (in residential streets there are no traffic lights: stop and yield signs, and now and then a roundabout)
const ctlCache=new Map();
function ctlAt(ix,iz){
  const key=ix*100003+iz;let c=ctlCache.get(key);if(c)return c;
  // a corner, a dead end or a plain bend in the road isn't a junction: nothing to control
  {let n=0;for(let d=0;d<4;d++)if(segOpen(ix,iz,d))n++;if(n<3){c={k:'none'};ctlCache.set(key,c);return c;}}
  const h=hash2(ix*71+5,iz*53+9);
  if(gRow(iz,ix*CELL+RC)||gCol(ix,iz*CELL+RC)){c={k:'light',o:hash2(ix*13+1,iz*29+3)*14};ctlCache.set(key,c);return c;}   // a highway through town: traffic lights
  let homes=0;for(const [a,b] of [[ix-1,iz-1],[ix,iz-1],[ix-1,iz],[ix,iz]])if(plotType(a,b)==='homes')homes++;
  if(homes>=2){
    const open=[0,1,2,3].every(d=>segOpen(ix,iz,d));
    if(open&&hash2(ix*19+7,iz*23+5)<0.35)c={k:'round'};
    else c=h<0.6?{k:'stop'}:{k:'yield',ax:hash2(ix*7+2,iz*3+8)<0.5?'x':'z'};
  }
  else if(h<0.45)c={k:'light',o:hash2(ix*13+1,iz*29+3)*14};
  else if(h<0.8)c={k:'stop'};
  else c={k:'yield',ax:hash2(ix*7+2,iz*3+8)<0.5?'x':'z'};
  ctlCache.set(key,c);return c;
}
// a roundabout's island, in the middle of its intersection: a grassy circle with a clump of bushes
function roundIsland(rx,rz){const r=Math.hypot(rx+0.5-ROADW/2,rz+0.5-ROADW/2);return r<1.25?2:r<2.3?1:0;}
// where each exit of a roundabout leaves the circle (angle about its centre), for a car heading off that way
const RB_R=3.5,RB_EXIT=[Math.atan2(ROADW/2,ROADW*0.25-ROADW/2),Math.atan2(ROADW*0.75-ROADW/2,ROADW/2),Math.atan2(-ROADW/2,ROADW*0.75-ROADW/2),Math.atan2(ROADW*0.25-ROADW/2,-ROADW/2)];
function LANE_OFF_X(){return ROADW*0.25-ROADW/2;}
const benchRow=v=>v===PC-3||v===PC+2,benchCol=v=>v===PC-6||v===PC-5||v===PC+5||v===PC+6;
// a house's garden: hedges round the edge, gravel paths from the front doors to the pavement, a few flowers
// a construction site's ground: a fence (with a gate), dirt and gravel, spoil heaps, the site office, the crane
function buildSiteCol(col,P,rx,rz,x,z){
  col(G,hash2(x*3+1,z*5+7)<0.5?DIRT:GRAVEL);
  const edge=rx===PL0||rx===PL1-1||rz===PL0||rz===PL1-1;
  if(edge){if(!(rz===PL0&&Math.abs(rx-PC)<=1)){col(G+1,METAL);col(G+2,rx%2?METAL:AIR);}return;}
  // the site office: a container up front, left of the gate
  if(rx>=PL0+1&&rx<PL0+7&&rz>=PL0+1&&rz<PL0+4){col(G+1,RUST);col(G+2,rx===PL0+3&&rz===PL0+1?GLASS:RUST);col(G+3,RUST);}
  // spoil heaps
  {const d=Math.hypot(rx-(PL1-4),rz-(PL0+2.5));if(d<2.5){col(G+1,DIRT);if(d<1.3)col(G+2,DIRT);}}
  // the crane: a 2x2 lattice mast, then a jib along x and a counter-jib with its weights
  const C=P.crane;if(!C)return;
  const mast=rx>=C.x&&rx<C.x+2&&rz>=C.z&&rz<C.z+2;
  // (the two off-diagonal legs run solid all the way up, the other two have alternate gaps: it reads as a lattice and stays in one piece)
  if(mast){const u=rx-C.x,v=rz-C.z;for(let y=G+1;y<=C.top;y++)col(y,u===v&&(y+u)%2===0?AIR:METAL);col(C.top+1,METAL);col(C.top+2,METAL);return;}
  if(rz===C.z||rz===C.z+1){
    if(rx<C.x&&rx>=PL0){col(C.top+1,(rx%2)?METAL:AIR);col(C.top+2,METAL);}
    if(rx>=C.x+2&&rx<PL1-1){col(C.top+1,CONCRETE);col(C.top+2,METAL);}
  }
  // the hook, hanging from the jib with a pallet of bricks on it
  // (out past the end of the building, so the crane hangs from nothing but its own mast)
  if(rx===PL0+1&&rz===C.z){for(let y=C.top+1;y>G+8;y--)col(y,METAL);col(G+7,BRICK);col(G+8,PLANKS);}
  if(rx===C.x&&rz===C.z+2){col(C.top,GLASS);col(C.top-1,METAL);col(C.top+1,METAL);}   // the cab, bolted to the side of the mast
}
// an alley or a strip of back gardens where a street would be. c: across it (0..7), a: along it (world coordinate)
function joinColumn(col,J,c,a,x,z){
  if(J==='alley'){
    // where it meets the street at either end, the pavement carries straight across its mouth
    {const ra=mod(a,CELL);if(ra>=ROADW&&(ra<PL0||ra>=PL1)){col(G,SIDEWALK);return;}}
    // cracked asphalt with a drain down the middle; bins and crates pushed against the walls now and then
    col(G,(c===3||c===4)&&mod(a,6)===0?GRAVEL:hash2(x*3+1,z*7+5)<0.08?CONCRETE:ASPHALT);
    const seg=Math.floor(a/9),h=hash2(seg*31+(c<4?1:2),Math.floor(x/CELL)*17+Math.floor(z/CELL)*5+seg);
    if((c===0||c===7)&&h<0.45){const k=mod(a,9);
      if(k===2||k===3){col(G+1,RUST);col(G+2,RUST);}            // a dumpster
      else if(k===5&&h<0.25)col(G+1,CRATE);}
  } else {
    // back gardens: lawn either side of a fence down the middle, with a tree here and there
    col(G-1,DIRT);col(G,GRASS);
    if(c===3){if(mod(a,8)!==0)col(G+1,PLANKS);}
    else if(hash2(x*13+7,z*5+3)<0.025&&(c===1||c===6)){col(G+1,LOG);col(G+2,LOG);col(G+3,LEAVES);col(G+4,LEAVES);}
    else if(hash2(x*5+3,z*11+1)<0.05)col(G+1,FLOWER);
  }
}
function plainsColumn(col,x,z,noShore){
  if(!noShore&&nearSea(Math.floor(x/CELL),Math.floor(z/CELL))){const cd=coastD(x,z);if(cd>=0){seaWater(col,x,z,1,cd);return;}if(cd>-22&&natLand(col,x,z,null,cd))return;}
  const h=plainsH(x,z);
  if(h<0){col(G-1,SAND);col(G,WATER);return;}
  for(let y=G;y<G+h;y++)col(y,DIRT);col(G+h,GRASS);
  const v=hash2(x*7+3,z*11+5);
  if(v<0.045)col(G+h+1,FLOWER);
  else if(v<0.055)col(G+h+1,LEAVES);                        // a bush
  else if(v>0.9975){col(G+h+1,MOSSSTONE);if(v>0.9992)col(G+h+2,STONE);}   // a boulder
}
function farmColumn(a,col,px,pz,rx,rz,lx,lz,x,z){
  const P=plotInfo(px,pz),F=P.field;
  col(G,GRASS);col(G-1,DIRT);
  if(rx>=F.x0&&rx<F.x1&&rz>=F.z0&&rz<F.z1){
    const edge=rx===F.x0||rx===F.x1-1||rz===F.z0||rz===F.z1-1;
    if(edge){if((rx+rz)%2===0||rx===F.x0||rx===F.x1-1)col(G+1,(rx+rz)%4===0?LOG:PLANKS);if(rz===(P.north?F.z1-1:F.z0)&&Math.abs(rx-PC)<=1)col(G+1,AIR);}   // fence, with a gate
    else if(rz%2===0)col(G,DIRT);                             // furrows
    else{col(G,DIRT);col(G+1,LEAVES);}                         // rows of crops
  } else if(rz===(P.north?PL1-12:PL0+11)||(rx>=PC-1&&rx<=PC&&(P.north?rz>=F.z1:rz<F.z0)))col(G,GRAVEL); // the farm track
  for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1){col(G,b.eat&&rz>=b.z1-(b.eatTile||6)?FLOORT:b.floor);buildingColumn(a,lx,lz,rx,rz,b,collapses[px+','+pz+','+bi],px,pz);break;}}
}
// farmland beside a farm: rows of crops (leafy veg, or flowers), or an orchard of small fruit trees in a grid; a
// rail fence round the outside edge of the whole spread (not between its blocks, nor against the farm's own block)
function farmlandColumn(col,F,px,pz,rx,rz,x,z){
  col(G-1,DIRT);col(G,GRASS);
  const same=(a,b)=>{const o=farmlandOf(a,b);return o&&o.fx===F.fx&&o.fz===F.fz||a===F.fx&&b===F.fz;};
  if(rx===0&&!same(px-1,pz)||rx===CELL-1&&!same(px+1,pz)||rz===0&&!same(px,pz-1)||rz===CELL-1&&!same(px,pz+1)){
    if((rx+rz)%2===0||rx===0||rx===CELL-1)col(G+1,(rx+rz)%4===0?LOG:PLANKS);return;}
  if(F.kind==='crop'){if(rz%2===0)col(G,DIRT);else{col(G,DIRT);col(G+1,F.crop?FLOWER:LEAVES);}return;}
  // orchard: a tree every 5 blocks each way -- a short trunk with a small round crown (each column works out its own
  // part, so trees can straddle chunk edges)
  const gx=mod(x,5),gz=mod(z,5),dx=gx-2,dz=gz-2,ax=Math.abs(dx),az=Math.abs(dz);
  if(rx<3||rx>CELL-4||rz<3||rz>CELL-4)return;
  if(!dx&&!dz){col(G+1,LOG);col(G+2,LOG);col(G+3,LEAVES);col(G+4,LEAVES);return;}
  if(ax<=1&&az<=1){col(G+3,LEAVES);if(ax+az<2)col(G+4,LEAVES);}
}
// a river out on the plains: no embankments, just grassy banks sloping down to sand and the water
// a river out on the plains, d blocks from its centre line: no embankments, just grassy banks sloping down to sand and
// the water (cut into whatever the column already had)
function plainsRiverColumn(col,d){
  const WL=G-2,RB=G-11;
  if(d>RIV_W+4)return;
  if(d>RIV_W+2){col(G-1,DIRT);col(G,GRASS);for(let y=G+1;y<G+8;y++)col(y,AIR);return;}
  if(d>RIV_W){col(G-1,SAND);for(let y=G;y<G+8;y++)col(y,AIR);return;}
  const bed=RB+Math.round((d/RIV_W)*6);col(bed,SAND);for(let y=bed+1;y<=WL;y++)col(y,WATER);
  for(let y=WL+1;y<G+8;y++)col(y,AIR);   // open to the sky (the ground layers would otherwise roof it over)
}
// a landmark's grounds: a gravel path in from the street to its door; a fence round the water tower; a hedge, flower
// beds and a ring of gravel round the bell tower
// a basketball court: green-blue hard court, white lines (the edge, halfway, the centre circle, a key and a three-point
// arc at each end), a hoop on a post at each end, chain-link round it, grass outside
function courtCol(col,P,rx,rz,x,z){
  const C=P.court,inC=rx>=C.x0&&rx<C.x1&&rz>=C.z0&&rz<C.z1;
  if(!inC){col(G,GRASS);if((rx===C.x0-1||rx===C.x1)&&rz>=C.z0-1&&rz<=C.z1||(rz===C.z0-1||rz===C.z1)&&rx>=C.x0-1&&rx<=C.x1){if(!(rz===C.z0-1&&Math.abs(rx-PC)<=1)){col(G+1,CHAINLINK);col(G+2,CHAINLINK);col(G+3,CHAINLINK);}}
    else if(rx===PL0||rx===PL1-1||rz===PL0||rz===PL1-1)col(G+1,LEAVES);return;}
  const u=rx-C.x0,v=rz-C.z0,W=C.x1-C.x0,D=C.z1-C.z0,cu=(W-1)/2,cv=(D-1)/2;
  let line=u===0||u===W-1||v===0||v===D-1||u===W>>1;
  const dc=Math.hypot(u-cu,v-cv);if(dc>1.6&&dc<2.5)line=true;
  for(const e of [0,W-1]){const du=Math.abs(u-e);if(du<=4&&Math.abs(v-cv)<=1.6&&(du===4||Math.abs(v-cv)>1.1))line=true;}
  col(G,line?COURT_L:COURT);
  // the hoops: a post just off each end line, the backboard and the orange rim reaching out over the court
  for(const [e,s] of [[0,1],[W-1,-1]]){
    if(u===e&&Math.abs(v-cv)<0.6){for(let y=G+1;y<=G+4;y++)col(y,METAL);col(G+5,METAL);}
    if(u===e+s&&Math.abs(v-cv)<1.6){col(G+5,PAINT_WHITE);col(G+6,PAINT_WHITE);}
    if(u===e+2*s&&Math.abs(v-cv)<0.6)col(G+5,NEON_O);}
}
// a cemetery: a low stone wall with a gate onto the street, gravel paths across, headstones (some crosses) in rows
// facing the paths, a few dark yews
const y0lamp=(rx,rz)=>(rx+rz)%5===0;
function cemeteryCol(col,P,rx,rz,x,z){
  col(G,GRASS);
  // the crypt under the graves: stone walls, a vaulted roof, rows of stone coffins, burial niches, lamps; the stair down
  // from the mausoleum (a block a step)
  {const C=P.crypt;if(C&&rx>=C.x0&&rx<C.x1&&rz>=C.z0&&rz<C.z1){
    const edge=rx===C.x0||rx===C.x1-1||rz===C.z0||rz===C.z1-1;col(G-8,STONE);col(G-7,COBBLE);col(G-2,STONE);col(G-1,DIRT);
    if(edge){for(let y=G-6;y<=G-3;y++)col(y,(y===G-5&&(rx+rz)%2===0)?(hash2(x,z)<0.5?CRATE:AIR):STONE);if(y0lamp(rx,rz))col(G-4,LAMP);}
    else{for(let y=G-6;y<=G-3;y++)col(y,AIR);const u=rx-C.x0,v=rz-C.z0;
      if(u%4===2&&v%3===1&&!(rx>=C.sx-1&&rx<C.sx1+1))col(G-6,MARBLE);   // the coffins
      if(u%6===0&&v%6===0)for(let y=G-6;y<=G-3;y++)col(y,MOSSSTONE);}   // pillars
    // the stair down
    if(rx>=C.sx&&rx<C.sx1&&rz>=C.sz&&rz<C.sz+8){const k=Math.min(7,rz-C.sz+1);for(let y=G-7;y<=G-k;y++)col(y,y===G-7?COBBLE:STONE);for(let y=G-k+1;y<=G;y++)col(y,AIR);return;}}}
  const path=Math.abs(rx-PC+0.5)<1.1||rz===PC-1;
  if(rx===PL0||rx===PL1-1||rz===PL0||rz===PL1-1){if(rz===PL0&&Math.abs(rx-PC+0.5)<1.1){col(G,GRAVEL);return;}col(G+1,COBBLE);if((rx+rz)%4===0)col(G+2,COBBLE);return;}
  if(path){col(G,GRAVEL);return;}
  const b=P.b[0];if(b&&rx>=b.x0-1&&rx<=b.x1&&rz>=b.z0-1&&rz<=b.z1){col(G,GRAVEL);return;}
  if((rx===PL0+1||rx===PL1-2)&&(rz===PL0+1||rz===PL1-2)){for(let y=G+1;y<=G+5;y++)col(y,LEAVES);return;}   // yews in the corners
  if(rx>=PL0+2&&rx<=PL1-3&&rz>=PL0+2&&rz<=PL1-3&&rz%2===0&&rx%2===1&&hash2(x*7+1,z*3+5)<0.88)col(G+1,hash2(x*5+3,z*11+7)<0.25?GRAVEX:GRAVE);
}
// an abandoned building's lot: cracked concrete with weeds and grass coming through, heaps of rubble, a chain-link
// fence along the street with gaps torn in it
function derelictYard(col,P,rx,rz,x,z){
  const h=hash2(x*13+7,z*5+3);
  if(h<0.12)col(G,GRASS);else if(h<0.2)col(G,GRAVEL);
  if(rz===PL0&&!(Math.abs(rx-PC)<=1)&&hash2(x*3,z*7+1)>0.25){col(G+1,CHAINLINK);if(hash2(x+5,z)>0.3)col(G+2,CHAINLINK);return;}
  const b=P.b[0];if(b&&(rx===b.x0-1||rx===b.x1||rz===b.z1)&&h>0.7){col(G+1,h>0.85?COBBLE:GRAVEL);if(h>0.93)col(G+2,GRAVEL);return;}
  if(hash2(x*7+2,z*11+9)<0.08)col(G+1,FLOWER);
}
// a mansion's grounds: iron railings along the street with stone gate piers, the gravel drive up to a turning circle
// before the porch, a fountain on the lawn, the pool out the back, hedges down the sides
function mansionYard(col,P,rx,rz,x,z){
  const b=P.b[0],cx=(b.x0+b.x1)>>1;
  if(rz===PL0){if(Math.abs(rx-cx)<=1){col(G,GRAVEL);return;}if(Math.abs(rx-cx)===2){for(let y=G+1;y<=G+3;y++)col(y,STONE);col(G+4,MARBLE);return;}col(G+1,CHAINLINK);col(G+2,CHAINLINK);return;}
  if(rx===PL0||rx===PL1-1||rz===PL1-1){col(G+1,LEAVES);col(G+2,LEAVES);return;}
  if(rz<b.z0-3&&Math.abs(rx-cx)<=1||rz>=b.z0-6&&rz<b.z0-3&&Math.abs(rx-cx)<=5){col(G,GRAVEL);return;}
  // the fountain on the lawn
  {const fx=PL0+4,fz=PL0+4,d=Math.max(Math.abs(rx-fx),Math.abs(rz-fz));if(d<=1){col(G,STONE);col(G+1,d===1?STONE:WATER);if(d===0){col(G+1,STONE);col(G+2,STONE);col(G+3,WATER);}return;}}
  // the pool
  if(rz>=b.z1+2&&rz<=PL1-2&&rx>=PL0+3&&rx<=PL1-4){const edge=rz===b.z1+2||rz===PL1-2||rx===PL0+3||rx===PL1-4;if(edge)col(G,SIDEWALK);else{col(G,WATER);col(G-1,WATER);}return;}
  if(hash2(x*5+3,z*11+1)<0.04)col(G+1,FLOWER);
}
// a trailer park: the gravel lane down the middle, each trailer up on blocks with a washing line and some junk
function trailerYard(col,P,rx,rz,x,z){
  if(Math.abs(rx-PC+0.5)<=1.6){col(G,GRAVEL);return;}
  const h=hash2(x*9+1,z*3+7);
  for(const b of P.b){
    // washing line: two posts and the washing hung between them, beside the trailer
    if(rx===(b.door===1?b.x0-1:b.x1)&&(rz===b.z0+1||rz===b.z0+5)){for(let y=G+1;y<=G+3;y++)col(y,METAL);return;}
    if(rx===(b.door===1?b.x0-1:b.x1)&&rz>b.z0+1&&rz<b.z0+5&&rz%2===0){col(G+3,[PAINT_WHITE,AWN_R,PAINT_BLUE][(rz+rx)%3]);return;}}
  // (the junk by each trailer's step, a lawn chair and a barbecue are props: see siteProps)
  if(h<0.05)col(G+1,FLOWER);else if(h<0.07)col(G,DIRT);
}
// a tree nursery: rows of saplings, rows of potted plants, gravel walks
function nurseryYard(col,P,rx,rz,x,z){
  if(rz===PL0+7||rx===PC-1||rx===PL0){col(G,GRAVEL);return;}
  if(rx<PC-1&&rz>PL0+7&&(rx-PL0)%3===2&&(rz-PL0)%3===0){col(G+1,LOG);col(G+2,LOG);col(G+3,LEAVES);col(G+4,LEAVES);return;}
  if(rx<PC-1&&rz>PL0+7&&((rx-PL0)%3===2&&(rz-PL0)%3!==0&&(rz-PL0)%3!==2||(rx-PL0)%3!==2&&(rz-PL0)%3===0&&(rx-PL0)%3===1)){col(G+3,LEAVES);return;}
  // (the potted plants for sale, out front, are props: see siteProps)
}
// a car dealer's lot: painted bays, the cars stand in them (real parked cars)
function dealerLot(col,P,rx,rz,x,z){
  if(rx>=PL0+14&&rz>=PL0+1&&rz<PL1-1&&(rz-PL0)%4===0)col(G,LANE);
  if(rz>=PL0+13&&rz<PL1-1&&rx>=PL0+1&&(rx-PL0)%4===0&&rx<PL0+14)col(G,LANEX);
}
// a homeless encampment: bare ground with weeds, tents (an A-frame of tarp each), a barrel fire
function campCol(col,P,rx,rz,x,z){
  const h=hash2(x*7+3,z*13+1);col(G,h<0.5?DIRT:h<0.7?GRAVEL:GRASS);
  if(rz===PL0&&hash2(x,z*3)>0.4){col(G+1,CHAINLINK);col(G+2,CHAINLINK);return;}
  if(rx===P.fire.x&&rz===P.fire.z){col(G+1,RUST);return;}
  for(const t of P.camp){const u=rx-t.x0,v=rz-t.z0,a=t.ax?u:v,c=t.ax?v:u;
    if(a>=0&&a<4&&c>=0&&c<3){if(c===1)col(G+2,t.c);else col(G+1,t.c);return;}}   // (the bedding, carts and crates are props: see siteProps)
  if(h>0.96)col(G+1,FLOWER);
}
// a farmer's market: paving, and the stalls' striped awnings
function farmersCol(col,P,rx,rz,x,z){
  col(G,(rx+rz)%2?SIDEWALK:CONCRETE);
  for(const S of P.stalls){const u=rx-S.x0,v=(rz-S.z0)*S.face+(S.face<0?2:0);if(u<0||u>2||v<0||v>2)continue;
    col(G+4,u===1?PAINT_WHITE:S.aw);   // (its poles, and the tables, baskets and crates of produce under it, are props: see siteProps)
    return;}
}
// a school's grounds: a playground (climbing frame, slide, swings) on tarmac and a grass playing field with its lines,
// chain-link round both
function schoolYard(col,P,ux,uz,x,z){
  const Y=P.school;if(ux<Y.px0||ux>=Y.px1||uz<Y.pz0||uz>=Y.pz1)return;
  const W=Y.px1-Y.px0,D=Y.pz1-Y.pz0,u=ux-Y.px0,v=uz-Y.pz0,long=W>=D,a=long?u:v,c=long?v:u,L=long?W:D,C=long?D:W;
  if(u===0||v===0||u===W-1||v===D-1){if(!(a===2||a===3))for(let y=G+1;y<=G+2;y++)col(y,CHAINLINK);return;}
  if(a<12){col(G,ASPHALT);   // the playground
    if(a>=2&&a<=4&&c>=2&&c<=4){if(a===3&&c===3)col(G+3,PLANKS);else if((a+c)%2===0){col(G+1,METAL);col(G+2,METAL);col(G+3,PAINT_RED);}}   // a climbing frame
    if(a===7&&c>=2&&c<=3){col(G+1,METAL);col(G+2,METAL);col(G+3,METAL);}if(a===8&&c>=2&&c<=3)col(G+2,PAINT_YELLOW);if(a===9&&c>=2&&c<=3)col(G+1,PAINT_YELLOW);   // the slide
    if((a===2||a===6)&&c===C-4){for(let y=G+1;y<=G+4;y++)col(y,METAL);}if(a>2&&a<6&&c===C-4)col(G+4,METAL);if((a===3||a===5)&&c===C-4)col(G+1,PLANKS);   // swings
    return;}
  col(G,(a===12||a===L-2||c===1||c===C-2||a===((12+L)>>1))?FIELD_L:FIELD);   // the playing field
  if((a===13||a===L-3)&&Math.abs(c-(C>>1))<=1){col(G+1,PAINT_WHITE);col(G+2,PAINT_WHITE);if(c===(C>>1)-1||c===(C>>1)+1)col(G+3,PAINT_WHITE);}
}
