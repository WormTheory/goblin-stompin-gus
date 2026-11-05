// ---- caves: under the land (not under the sea or the rivers), well below the streets and their sewers: winding
// tunnels (where two smooth 3-D noises both pass through zero) and here and there a great cavern, glowing fungus and
// crystals on their floors. Out in the wilds now and then a cave mouth: a rocky hole sloping down to a chamber ----
function noise3(x,y,z,sp,salt){
  const fx=x/sp,fy=y/sp,fz=z/sp,ix=Math.floor(fx),iy=Math.floor(fy),iz=Math.floor(fz),u=fx-ix,v=fy-iy,w=fz-iz;
  const su=u*u*(3-2*u),sv=v*v*(3-2*v),sw=w*w*(3-2*w),h=(a,b,c)=>hash2(a*1013+b*7919+salt,c*3571+b*197+salt*5)*2-1;
  const l=(b,c)=>h(ix,b,c)*(1-su)+h(ix+1,b,c)*su;
  return (l(iy,iz)*(1-sv)+l(iy+1,iz)*sv)*(1-sw)+(l(iy,iz+1)*(1-sv)+l(iy+1,iz+1)*sv)*sw;
}
// (the same noise, for a whole column at once: the x-z interpolation done once per lattice level)
function colNoise3(x,z,sp,salt){
  const fx=x/sp,fz=z/sp,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,w=fz-iz,su=u*u*(3-2*u),sw=w*w*(3-2*w),cache={};
  const plane=iy=>{let v=cache[iy];if(v===undefined){const h=(a,c)=>hash2(a*1013+iy*7919+salt,c*3571+iy*197+salt*5)*2-1;v=cache[iy]=(h(ix,iz)*(1-su)+h(ix+1,iz)*su)*(1-sw)+(h(ix,iz+1)*(1-su)+h(ix+1,iz+1)*su)*sw;}return v;};
  return yy=>{const fy=yy/sp,iy=Math.floor(fy),v=fy-iy,sv=v*v*(3-2*v);return plane(iy)*(1-sv)+plane(iy+1)*sv;};
}
const CAVE_TOP=G-14;
function caveCol(col,x,z){
  if(TEST_OFF.has('caves'))return;
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);if(seaPlot(px,pz)||isRiver(px,pz)||nearSea(px,pz)||settlementAt(px,pz))return;
  // a cavern: a broad chamber where a slow noise runs high, its roof and floor rough
  const cv=gridNoise(x,z,52,401);let c0=99,c1=-99;
  if(cv>0.42){const yc=16+8*gridNoise(x,z,90,409),h=(cv-0.42)*48;c0=Math.max(3,Math.round(yc-h*0.55+2*gridNoise(x,z,6,413)));c1=Math.min(CAVE_TOP,Math.round(yc+h*0.45+2*gridNoise(x,z,5,419)));}
  let prev=false,floorDone=false;const h=hash2(x*41+3,z*67+11),N1=colNoise3(x,z,24,431),N2=colNoise3(x,z,24,439);
  for(let y=3;y<=CAVE_TOP;y++){
    let open=y>=c0&&y<=c1;
    if(!open&&Math.abs(N1(y*1.5))<0.09&&Math.abs(N2(y*1.5))<0.09)open=true;
    if(open){col(y,AIR);
      // on the floor: glowing fungus, now and then a crystal
      if(!prev&&!floorDone&&y>3){floorDone=true;if(h<0.035)col(y,NEON_G);else if(h>0.992)col(y,CRYSTAL);}}
    prev=open;
  }
}
// a cave mouth: a block of the wilds with a ragged hole in it, the floor sloping down to a chamber 20 blocks down
const caveMouthC=new Map();
function caveMouth(px,pz){
  const k=px*100003+pz;let v=caveMouthC.get(k);if(v!==undefined)return v;
  v=!TEST_OFF.has('caves')&&hash2(px*523+31,pz*211+17)<0.03&&biomeOf(px,pz)==='plains'&&farmK(px,pz)===null&&!farmlandOf(px,pz)&&dumpAt(px,pz)===null&&!bunkerAt(px,pz)&&!bigPlainsAt(px,pz)&&!nearSea(px,pz)&&!plotNearLines(px,pz,2)&&!rivPlotNear(px,pz)&&!railPlot(px,pz)&&!tsPlot(px,pz);
  if(v)for(let a=-2;a<=2&&v;a++)for(let b=-2;b<=2&&v;b++)if(settlementAt(px+a,pz+b))v=false;   // (out in the wilds)
  if(caveMouthC.size>100000)caveMouthC.clear();caveMouthC.set(k,v);return v;
}
function caveMouthColumn(col,rx,rz,x,z){
  const v=rz-16,av=Math.abs(v),rough=hash2(x*3+1,z*5+7);
  // the passage: five wide, sloping down from u 6 to u 26, its walls and roof ragged
  if(rx>=6&&rx<=26&&av<=2+(rough<0.3?1:0)){const fl=G-Math.max(0,Math.min(20,Math.floor((rx-6)*1.0))),hh=4+(rough<0.5?1:0);
    for(let y=fl;y<=Math.min(G+4,fl+hh);y++)col(y,AIR);col(fl-1,rough<0.4?GRAVEL:STONE);
    if(fl+hh<G)col(fl+hh+1,rough<0.5?MOSSSTONE:STONE);}
  // the chamber at the bottom
  {const d=Math.hypot(rx-24,(rz-16)*1.1);if(d<7){const h=Math.round(4+Math.sqrt(49-d*d)*0.7);for(let y=G-20;y<=G-20+h;y++)col(y,AIR);col(G-21,STONE);if(rough<0.04)col(G-20,NEON_G);}}
  // round the mouth: rocks
  if(rx>=3&&rx<=12&&av>=3&&av<=5&&rough<0.55){col(G+1,rough<0.25?MOSSSTONE:STONE);if(rough<0.12)col(G+2,MOSSSTONE);}
  if(rx>=3&&rx<=5&&av<=5&&rough<0.3)col(G+1,MOSSSTONE);
}
// ---- mines, quarries and lumber camps out in the wilds: laid out in the site's own coordinates (U, V) ----
function mineOre(B){return['coal','gold','iron'][Math.floor(hash2(B.ax*31+7,B.az*17+3)*3)];}
const ORE_B={coal:COAL,gold:GOLD,iron:RUST};
function mineColumn(col,B,U,V,x,z){
  const W=B.w*CELL,Hh=B.h*CELL,ore=ORE_B[mineOre(B)],h=hash2(x*7+3,z*13+5);
  const fence=(U===1||U===W-2||V===1||V===Hh-2)&&U>=1&&U<=W-2&&V>=1&&V<=Hh-2;
  col(G,h<0.6?GRAVEL:DIRT);
  // the galleries: timbered tunnels at 23 down, rails down the middle, ore showing in the walls, lamps
  const GL=G-23,gal=(a,b0,b1,wv)=>Math.abs(a)<=1&&wv>=b0&&wv<=b1;
  const inG=gal(U-12,6,58,V)||gal(V-30,8,56,U)||gal(V-42,8,56,U)||gal(V-54,8,56,U)||gal(U-42,14,56,V);
  const nearG=!inG&&(gal(U-12+(U>12?-1:1),6,58,V)||gal(V-30+(V>30?-1:1),8,56,U)||gal(V-42+(V>42?-1:1),8,56,U)||gal(V-54+(V>54?-1:1),8,56,U)||gal(U-42+(U>42?-1:1),14,56,V));
  if(inG){for(let y=GL+1;y<=GL+4;y++)col(y,AIR);col(GL,(U===12||V===30||V===42||V===54||U===42)?METAL:GRAVEL);
    const al=Math.abs(U-12)<=1||Math.abs(U-42)<=1?V:U;
    if(al%4===0)col(GL+4,LOG);if(al%8===4&&h<0.5)col(GL+1,RUST);}
  else if(nearG){const al=Math.abs(U-12)===2||Math.abs(U-42)===2?V:U;for(let y=GL+1;y<=GL+4;y++)col(y,al%4===0?PLANKS:hash2(x+y*5,z)<0.22?ore:STONE);if(al%8===2)col(GL+3,LAMP);}
  // the shaft, straight down under the headframe, with its cage guides
  if(U>=41&&U<=44&&V>=15&&V<=18){for(let y=GL+1;y<=G+1;y++)col(y,(U===41||U===44)&&(V===15||V===18)?METAL:AIR);return;}
  // the adit: an inclined tunnel in from the yard, timber sets every few blocks
  if(U>=10&&U<=14&&V>=4&&V<=30){const fl=Math.max(GL,G-Math.floor((V-4)*0.9)),side=U===10||U===14;
    for(let y=fl+1;y<=fl+5;y++)col(y,AIR);col(fl,V>8?GRAVEL:DIRT);if(U===12)col(fl,METAL);
    if(V%3===0){if(side)for(let y=fl+1;y<=fl+4;y++)col(y,LOG);col(fl+5,LOG);}
    if(fl+6<G)col(fl+6,STONE);
    if(V===4)for(let y=G+1;y<=G+4;y++)col(y,side?LOG:AIR);if(V===4&&!side)col(G+5,LOG);
    return;}
  if(fence&&!(V===1&&U>=28&&U<=33)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  if(U>=28&&U<=33&&V<=12)col(G,GRAVEL);
  // the headframe: four steel legs, braced, up to the sheave wheel on top
  {const a=U-42.5,b=V-16.5;if(Math.abs(a)<=3.5&&Math.abs(b)<=3.5){const leg=Math.abs(a)===3.5&&Math.abs(b)===3.5;
    for(let y=G+1;y<=G+20;y++){if(leg||(y-G)%5===0&&(Math.abs(a)===3.5||Math.abs(b)===3.5))col(y,PAINT_RED);}
    col(G+20,METAL);if((Math.abs(a)===2.5&&Math.abs(b)<=2.5||Math.abs(b)===2.5&&Math.abs(a)<=2.5))col(G+1,FENCE);
    if(U===42||U===43)for(let y=G+21;y<=G+28;y++){const r=Math.hypot(V-16.5,y-(G+24.5));if(Math.abs(r-3.2)<0.6||r<0.8)col(y,METAL);}
    return;}}
  // spoil heaps and the ore pile
  for(const [cu,cv2,m] of [[16,50,GRAVEL],[28,56,GRAVEL],[52,48,ore],[18,78,GRAVEL],[36,84,GRAVEL],[56,80,GRAVEL],[78,82,ore]]){const d=Math.hypot(U-cu,V-cv2),hh=Math.round((m===ore?5:9)-d*0.75);if(hh>0){for(let y=G+1;y<=G+hh;y++)col(y,m===ore&&y<G+hh-1?GRAVEL:m);return;}}
  // mine carts on a short line out to the pile
  if(V===36&&U>=16&&U<=88)col(G,METAL);
  // the ore silo at the end of the line, and a conveyor from it up to the plant
  {const d=Math.hypot(U-86,V-30);if(d<4.6){for(let y=G+1;y<=G+14;y++)col(y,d>3.4||y===G+14?(y%4?METAL:RUST):AIR);return;}}
  if(U===78&&V>=36&&V<=48){const yy=G+2+Math.floor((48-V)*0.6);col(yy,METAL);if(V%4===0)for(let y=G+1;y<yy;y++)col(y,METAL);}
  // (the carts themselves are props: see siteProps)
}
// a quarry: an enormous terraced pit, its benches stepping down 27 blocks to a pool of rainwater, a haul road
// running straight down into it, an excavator and dump trucks at work; the crusher and its conveyor, the stockpiles
function quarryColumn(col,B,U,V,x,z){
  const W=B.w*CELL,Hh=B.h*CELL,h=hash2(x*5+1,z*11+3);
  const fence=(U===1||U===W-2||V===1||V===Hh-2)&&U>=1&&U<=W-2&&V>=1&&V<=Hh-2;
  if(fence&&!(V===1&&U>=58&&U<=65)){col(G,GRAVEL);for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  col(G,GRAVEL);col(G-1,DIRT);
  // the pit: a rounded rectangle; how far in from its rim (the benches 5 wide, each 3 lower)
  const p0=24,p1=W-14,R=22;
  const dx=Math.max(p0+R-U,0,U-(p1-R)),dz=Math.max(p0+R-V,0,V-(p1-R)),din=R-Math.hypot(Math.max(0,p0+R-U,U-(p1-R)),Math.max(0,p0+R-V,V-(p1-R)));
  const d=dx>0&&dz>0?din:Math.min(U-p0,p1-U,V-p0,p1-V);
  if(d>=0){
    const lvl=Math.min(8,Math.floor(d/5));let fl=G-lvl*3;
    // the haul road: straight down from the rim toward the middle, a ramp of one block in two
    const road=V>=62&&V<=68&&U>=p0-2&&U<=p0+60;
    if(road){fl=Math.max(G-24,G-Math.floor((U-p0)/2));}
    for(let y=fl+1;y<=G+6;y++)col(y,AIR);
    col(fl,road?GRAVEL:lvl===8&&gridNoise(x,z,10,457)>-0.1?WATER:h<0.7?GRAVEL:STONE);
    if(road&&(V===62||V===68)&&U%4===0)col(fl+1,PAINT_ORANGE);   // (marker posts along the edge)
    // machines on the benches: the excavator, and dump trucks heading up
    {const a=U-72,b=V-78;if(lvl>=7&&a>=-2&&a<=2&&b>=-2&&b<=1){col(fl+1,PAINT_DARK);col(fl+2,PAINT_YELLOW);col(fl+3,PAINT_YELLOW);if(Math.abs(a)<=1&&b>=0)col(fl+4,PAINT_YELLOW);if(a===0&&b===-1)col(fl+3,WIN_BLUE);}
     if(lvl>=7&&b>=-6&&b<=-3&&a>=-1&&a<=0)col(fl+4,PAINT_YELLOW);if(lvl>=7&&b===-7&&a>=-1&&a<=0){col(fl+3,PAINT_YELLOW);col(fl+2,METAL);}}
    for(const tu of [p0+22,p0+44]){const a=U-tu,b=V-65;if(road&&a>=-2&&a<=2&&b>=-1&&b<=1){col(fl+1,PAINT_DARK);col(fl+2,PAINT_YELLOW);if(a>=-1)col(fl+3,a===2?WIN_BLUE:PAINT_YELLOW);if(a<=0&&a>=-2)col(fl+3,GRAVEL);}}
    return;}
  // the works beside the pit: the conveyor up from the pit to the crusher, the stockpiles
  if(U===45&&V>=14&&V<=p0+4){col(G+7,METAL);if(V%5===0)for(let y=G+1;y<=G+6;y++)col(y,METAL);return;}
  for(const [cu,cv2,m] of [[66,10,GRAVEL],[82,10,SAND],[98,11,GRAVEL],[112,12,STONE],[128,10,SAND],[144,11,GRAVEL],[160,10,STONE],[176,12,GRAVEL]]){const dd=Math.hypot(U-cu,V-cv2),hh=Math.round(8-dd*0.8);if(hh>0){for(let y=G+1;y<=G+hh;y++)col(y,m);return;}}
  if(U>=58&&U<=65&&V<=20)col(G,ASPHALT);
}
// a lumber camp: a clearing cut in the forest -- the sawmill, stacks of sawn timber, log piles, a logging truck,
// the loggers' cabins, stumps all over; dense woods all round
const lumberClear=(U,V)=>Math.hypot((U-62)/54,(V-46)/38);
function lumberForest(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),B=bigPlainsAt(px,pz);
  if(B&&B.kind==='lumber')return lumberClear(x-B.ax*CELL,z-B.az*CELL)>1.08;
  return false;
}
// near a lumber camp (within a block of it): the woods there grow thick
const lumberNearC=new Map();
function lumberNear(px,pz){const k=px*100003+pz;let v=lumberNearC.get(k);if(v===undefined){v=false;for(let a=-2;a<=2&&!v;a++)for(let b=-2;b<=2&&!v;b++){const B=bigPlainsAt(px+a,pz+b);if(B&&B.kind==='lumber')v=true;}if(lumberNearC.size>100000)lumberNearC.clear();lumberNearC.set(k,v);}return v;}
function lumberColumn(col,B,U,V,x,z){
  const h=hash2(x*3+7,z*5+1),e=lumberClear(U,V);
  if(e>1.08){col(G,GRASS);if(h<0.04)col(G+1,FLOWER);return;}   // (the woods: the trees go in with the others)
  col(G,h<0.45?DIRT:GRASS);
  if(e>0.75&&h>0.965){col(G+1,LOG);return;}   // stumps
  // the track out of the clearing to the south
  if(U>=46&&U<=49&&V>=48){col(G,GRAVEL);return;}
  // log piles: long stacks, three, two, one high
  for(const [u0,v0] of [[12,24],[12,58],[88,24],[88,50]])if(U>=u0&&U<=u0+22&&V>=v0&&V<=v0+7){const r=V-v0,n=r<=1?1:r<=3?2:r<=5?3:r<=6?2:1;for(let y=G+1;y<=G+n;y++)col(y,LOG);return;}
  // sawn timber, stacked on bearers
  if(U>=66&&U<=82&&(V>=14&&V<=30||V>=62&&V<=78)&&(V-14)%4<3&&(U-66)%6<5){col(G+1,LOG);col(G+2,PLANKS);col(G+3,PLANKS);if((U+V)%3)col(G+4,PLANKS);return;}
  // the logging truck: its cab and the trailer loaded with logs
  {const a=U-58,b=V-44;if(b>=0&&b<=2&&a>=0&&a<=15){if(a<=3){col(G+1,PAINT_DARK);col(G+2,PAINT_RED);col(G+3,a<=1?WIN_BLUE:PAINT_RED);}else{col(G+1,PAINT_DARK);col(G+2,LOG);col(G+3,LOG);if(b===1)col(G+4,LOG);if(a%5===0)col(G+4,METAL);}return;}}
  // (the saw horses and chopping blocks are props: see siteProps)
}
// ---- campsites: a loop of gravel track round a meadow; motorhomes pulled up along it, tents pitched in the middle, each
// pitch with its fire pit and picnic table; the wash block and the warden's hut by the gate; trees round the edge ----
const CAMP_TENT_C=[AWN_R,AWN_G,PAINT_ORANGE,PAINT_BLUE,PAINT_YELLOW];
function campPitches(B){
  if(B.pitches)return B.pitches;const P=[];B.pitches=P;const r=n=>hash2(B.ax*131+n*17,B.az*71+n*29);
  // RVs along the outside of the loop (north and south runs), tents inside it
  for(let i=0;i<4;i++){if(r(i)<0.75)P.push({k:'rv',u:16+i*10,v:5,c:i});if(r(i+10)<0.75)P.push({k:'rv',u:16+i*10,v:56,c:i+4});}
  for(let i=0;i<3;i++)for(let j=0;j<2;j++)if(r(20+i*3+j)<0.8)P.push({k:'tent',u:19+i*10,v:21+j*14,c:Math.floor(r(40+i*3+j)*5),ax:r(60+i*3+j)<0.5});
  return P;
}
function campsiteColumn(col,B,U,V,x,z){
  const h=hash2(x*7+5,z*3+1);col(G,GRASS);
  const loop=(U>=10&&U<=13||U>=50&&U<=53)&&V>=10&&V<=53||(V>=10&&V<=13||V>=50&&V<=53)&&U>=10&&U<=53;
  if(loop||U>=30&&U<=33&&V<10){col(G,GRAVEL);return;}
  for(const p of campPitches(B)){
    if(p.k==='rv'){const a=U-p.u,b=V-p.v;
      // a gravel pad for the motorhome (which is a real vehicle: see parkSpots), its fire pit in front; the picnic table,
      // camp chairs and cool box are props (campProps)
      if(a>=0&&a<=7&&b>=0&&b<=2){col(G,GRAVEL);return;}
      const fv=p.v<20?p.v-3:p.v+5;
      if(Math.abs(U-(p.u+2))<=1&&Math.abs(V-fv)<=1){if(U===p.u+2&&V===fv){col(G+1,LOG);}else col(G+1,STONE);return;}
      continue;}
    // a tent: an A-frame, three wide and four long, its door at one end; the fire pit beside it
    const a=p.ax?U-p.u:V-p.v,c=p.ax?V-p.v:U-p.u;
    if(a>=0&&a<=3&&c>=0&&c<=2){const tc=CAMP_TENT_C[p.c];if(c===1){col(G+2,tc);if(a===0)col(G+1,AIR);}else col(G+1,tc);return;}
    const fu=p.u+(p.ax?1:5),fv2=p.v+(p.ax?5:1);
    if(Math.abs(U-fu)<=1&&Math.abs(V-fv2)<=1){col(G+1,U===fu&&V===fv2?LOG:STONE);return;}
  }
  if(h<0.03)col(G+1,FLOWER);
}
// where the trees go on a site out in the wilds (round a campsite's edge, in a lumber camp's woods)
function siteTrees(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),B=bigPlainsAt(px,pz);if(!B)return false;
  const U=x-B.ax*CELL,V=z-B.az*CELL;
  if(B.kind==='lumber')return lumberClear(U,V)>1.08?1.1:0;
  if(B.kind==='campsite')return (U<7||U>56||V>59)&&!(U>=28&&U<=35&&V<12)&&!(V<9)?1.1:0;
  if(B.kind==='thieves')return Math.hypot(U-16,V-16)>13?1.4:0;
  if(B.kind==='ruins'){for(const [u0,v0,u1,v1] of RUIN_ROOMS)if(U>=u0-1&&U<=u1+1&&V>=v0-1&&V<=v1+1)return 0;
    if(Math.hypot(U-46,V-44)<7||V>=25&&V<=30&&U>=34&&U<=60||Math.abs(U-32)<=3&&Math.abs(V-30)<=3)return 0;return 0.35;}
  return 0;
}
// ---- cult altars, deep in the wilds: a ring of standing stones round a blood-stained altar, a sigil burned into the
// ground, torches, bones, dead trees; robed figures circling it, chanting (see the venues) ----
function cultColumn(col,B,U,V,x,z){
  const h=hash2(x*11+3,z*5+7),du=U-16,dv=V-16,d=Math.hypot(du,dv);
  col(G,d<14&&h<0.5?DIRT:GRASS);
  // the sigil: a circle and a five-pointed star, scorched into the ground
  {let on=Math.abs(d-6.5)<0.55;if(!on&&d<7){for(let i=0;i<5&&!on;i++){const a0=-Math.PI/2+i*4*Math.PI/5,a1=a0+4*Math.PI/5,ax=Math.cos(a0)*6.5,az=Math.sin(a0)*6.5,bx=Math.cos(a1)*6.5,bz=Math.sin(a1)*6.5;
    const t=Math.max(0,Math.min(1,((du-ax)*(bx-ax)+(dv-az)*(bz-az))/((bx-ax)**2+(bz-az)**2)));if(Math.hypot(du-ax-(bx-ax)*t,dv-az-(bz-az)*t)<0.55)on=true;}}
   if(on)col(G,h<0.7?PAINT_RED:PAINT_DARK);}
  // the altar: a stone slab, blood on top, candles at its corners
  if(Math.abs(du)<=1&&Math.abs(dv)<=0.5+0.5){if(Math.abs(du)<=1&&dv>=0&&dv<=1){col(G+1,STONE);col(G+2,(Math.abs(du)===1)?NEON_O:PAINT_RED);return;}}
  // the standing stones
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9+0.3,sx=Math.round(Math.cos(a)*10.5),sz=Math.round(Math.sin(a)*10.5);
    if(du===sx&&dv===sz){const n=3+Math.floor(hash2(B.ax*7+i,B.az*3+i)*3);for(let y=G+1;y<=G+n;y++)col(y,y===G+n&&i%3===0?MOSSSTONE:i%2?STONE:MOSSSTONE);return;}}
  // torches on poles, and a fire before the altar
  for(const [tu,tv] of [[13,0],[-13,0],[0,13],[0,-13]])if(du===tu&&dv===tv){col(G+1,LOG);col(G+2,LOG);col(G+3,NEON_O);return;}
  if(du===0&&dv===-3){col(G+1,LOG);return;}
  if(Math.abs(du)<=1&&Math.abs(dv+3)<=1&&!(du===0&&dv===-3)){col(G+1,STONE);return;}
  // dead trees round the clearing
  // (the bones about, the candles, the skull and the book are props: see siteProps)
  if(d>14&&h>0.985){const n=4+Math.floor(hash2(x,z*3)*4);for(let y=G+1;y<=G+n;y++)col(y,LOG);return;}
}
// ---- abandoned cars: rusting wrecks dumped out in the fields, alone, or now and then a whole heap of them ----
function abandonedSpots(px,pz){
  const h=hash2(px*733+41,pz*347+59);if(h>0.07||!PLAINS_OPEN(px,pz)||TEST_OFF.has('wrecks'))return [];
  const n=h<0.012?4+Math.floor(hash2(px,pz*9)*3):1,out=[],X0=px*CELL,Z0=pz*CELL;
  for(let i=0;i<n;i++){const r=k=>hash2(px*97+i*13+k,pz*61+i*7+k*3);
    const x=X0+7+r(1)*18,z=Z0+7+r(2)*18,ph=plainsH(Math.floor(x),Math.floor(z));
    if(ph<0||roadNear(x,z,10)<8||railNear(x,z)<6)continue;
    if([[-2,-2],[2,2],[-2,2],[2,-2]].some(([a,b])=>plainsH(Math.floor(x+a),Math.floor(z+b))!==ph))continue;
    if(out.some(o=>Math.hypot(o.x-x,o.z-z)<5.5))continue;
    out.push({x,z,y:G+1+ph,h:r(3)*6.283,key:px+','+pz+':ab'+i,p:0.95,veh:['car','car','pickup','van'][Math.floor(r(4)*4)],rust:true});}
  return out;
}
const RUST_PAINTS=[0x6a3a22,0x7a4a2a,0x5a4a3a,0x7a6a5a,0x4a3a2a,0x8a5a3a];
// ---- the cultists: robed goblins circling the altar, arms up, chanting. They're real goblins the whole time (out of
// their own pool: see addCultist), so they can be stomped mid-rite; come too close, or hurt one, and the whole circle
// turns on you, throwing fireballs from range and stabbing with their ritual daggers up close (cultCast) ----
const CULTM={glow:new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.5,depthWrite:false})};
const CULT_RING=5.6;   // (how far from the altar they walk: clear of the fire's ring of stones, inside the standing stones)
function refreshCultVenues(p,want){
  for(let px=Math.floor((p.pos.x-140)/CELL);px<=Math.floor((p.pos.x+140)/CELL);px++)for(let pz=Math.floor((p.pos.z-140)/CELL);pz<=Math.floor((p.pos.z+140)/CELL);pz++){
    if(biomeOf(px,pz)!=='plains'||!tenvShow(px,pz))continue;const B=bigPlainsAt(px,pz);if(!B||B.kind!=='cult')continue;
    const key='c'+px+','+pz;want.add(key);if(venues.has(key))continue;
    const cx=px*CELL+16.5,cz=pz*CELL+16.5,n=5+Math.floor(hash2(px,pz)*3);
    const glow=new THREE.Mesh(LM_BOX,CULTM.glow);glow.position.set(cx,G+3.2,cz+0.5);scene.add(glow);
    venues.set(key,{kind:'cult',cx,cz,n,slots:new Array(n).fill(null),slain:new Array(n).fill(false),glow,chantT:0,roused:false,awayT:0});}
}
function updateCultVenue(V,dt,t){
  const me=players.find(q=>q.active),d=me?Math.hypot(me.pos.x-V.cx,me.pos.z-V.cz):999;
  // who's still in the circle: one gone home (you went off, like any goblin) leaves a place to fill again; one killed
  // stays dead until the cult's had a couple of quiet minutes
  for(let i=0;i<V.n;i++){const g=V.slots[i];if(!g)continue;
    if(g.homeV!==V||g.state==='wait'){V.slots[i]=null;continue;}
    if(g.state==='dead'){V.slain[i]=true;V.slots[i]=null;g.homeV=null;}}
  // roused: they're out hunting you; they gather again once you've been long gone
  if(V.roused){if(d>90){V.awayT+=dt;if(V.awayT>120){V.roused=false;V.slain.fill(false);}}else V.awayT=0;V.glow.visible=false;return;}
  V.glow.visible=true;const pulse=0.5+0.5*Math.sin(t*2.1);V.glow.scale.set(1.2+pulse*0.8,0.8+pulse*1.2,1.2+pulse*0.8);CULTM.glow.opacity=0.25+0.35*pulse;
  // the circle, there whenever you're near enough to see it
  if(me&&playing&&d<70)for(let i=0;i<V.n;i++){if(V.slots[i]||V.slain[i])continue;
    const g=freeCultist();if(!g)break;cultSpawn(g,V,i);
    const x=V.cx+Math.cos(g.ring)*CULT_RING,z=V.cz+0.5+Math.sin(g.ring)*CULT_RING;g.pos.set(x,groundAt(x,z,G+6),z);g.heading=Math.atan2(V.cx-x,V.cz+0.5-z);V.slots[i]=g;}
  // the chant: a low drone, rising and falling
  V.chantT-=dt;if(V.chantT<=0&&audio&&playing&&d<70){V.chantT=2.6;const vol=0.05*(1-d/70);tone('sine',98,92,2.2,vol);tone('sine',147,140,2.2,vol*0.6);tone('triangle',196,185,1.2,vol*0.3,1.1);}
  // too close: they turn on you
  if(d<15&&playing&&me&&!calmNow())cultRouse(V);
}
function cultRouse(V){
  if(V.roused)return;V.roused=true;V.awayT=0;const n=nearestPlayer(V.cx,V.cz),me=n&&n.p;
  // (they don't all let fly at once: a ragged volley, a few starting for you with their daggers out)
  V.slots.forEach((g,i)=>{if(!g||g.state!=='chase')return;g.castCD=0.5+i*0.45+Math.random()*0.4;if(me)g.heading=Math.atan2(me.pos.x-g.pos.x,me.pos.z-g.pos.z);});
  if(audio)tone('sawtooth',220,110,0.9,0.08);if(me)flashLabel('The cult turns on you!',me);
}
// the circle's gone out of range: those still at their rite go home with it (any already out hunting you carry on)
function homeDrop(V){for(const g of V.slots)if(g&&g.homeV===V&&!V.roused&&g.state==='chase'){g.state='wait';g.t=0;g.root.visible=false;g.homeV=null;}}
// ---- 5G towers: a steel monopole in a little fenced compound, its antenna panels up top on three sides, a dish, the
// equipment cabinets at its foot, a red light on the very top ----
function tower5gColumn(col,B,U,V,x,z){
  col(G,GRASS);
  if(U<9||U>22||V<9||V>22)return;
  col(G,GRAVEL);
  if((U===9||U===22||V===9||V===22)&&!(V===9&&U>=15&&U<=16)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  if(U>=15&&U<=16&&V>=15&&V<=16){for(let y=G+1;y<=G+32;y++)col(y,METAL);col(G+33,U===15&&V===15?NEON_R:AIR);return;}
  const a=U-15.5,b=V-15.5;
  if(Math.max(Math.abs(a),Math.abs(b))===2.5)col(G+26,METAL);   // the platform round the top
  if((U===13||U===18)&&V>=15&&V<=16||V===13&&U>=15&&U<=16)for(let y=G+27;y<=G+30;y++)col(y,PAINT_WHITE);   // antenna panels
  if(V===18&&U>=15&&U<=16){col(G+23,PAINT_WHITE);col(G+24,PAINT_WHITE);}   // the dish
  if((U>=11&&U<=12||U>=19&&U<=20)&&V>=19&&V<=20){col(G+1,METAL);col(G+2,METAL);}   // the cabinets
}
// ---- wind farms: patches of the plains (picked on a coarse grid) where every other block has a turbine on it ----
const turbC=new Map();
function turbineAt(px,pz){
  const k=px*100003+pz;let v=turbC.get(k);if(v!==undefined)return v;v=false;
  if(!TEST_OFF.has('wind')&&mod(px+pz,2)===0&&hash2(Math.floor(px/7)*311+5,Math.floor(pz/7)*157+3)<0.07&&biomeOf(px,pz)==='plains'&&farmK(px,pz)===null&&dumpAt(px,pz)===null&&!bigPlainsAt(px,pz)&&!bunkerAt(px,pz)&&!caveMouth(px,pz)&&!tsPlot(px,pz)&&!rivPlotNear(px,pz)&&!nearSea(px,pz)){
    const cx=px*CELL+16,cz=pz*CELL+16;if(roadNear(cx,cz,16)>=12&&railNear(cx,cz)>=10)v=true;}
  if(turbC.size>100000)turbC.clear();turbC.set(k,v);return v;
}
function turbineColumn(col,rx,rz){
  if(rx>=13&&rx<=18&&rz>=13&&rz<=18){for(let y=G+1;y<=G+3;y++)col(y,AIR);col(G,CONCRETE);}   // the foundation
  if(rx>=15&&rx<=16&&rz>=15&&rz<=16)for(let y=G+1;y<=G+40;y++)col(y,PAINT_WHITE);           // the tower
  if(rx>=15&&rx<=16&&rz>=13&&rz<=19){col(G+41,PAINT_WHITE);col(G+42,PAINT_WHITE);}          // the nacelle and hub
  if(rx===15&&rz===18)col(G+43,NEON_R);
}
const TURBM=new THREE.MeshLambertMaterial({color:0xf2f4f4});
function makeRotor(){
  const g=new THREE.Group();const hub=new THREE.Mesh(LM_BOX,TURBM);hub.scale.set(1.4,1.4,1.4);g.add(hub);
  for(let i=0;i<3;i++){const arm=new THREE.Group();arm.rotation.z=i*Math.PI*2/3;const b=new THREE.Mesh(LM_BOX,TURBM);b.scale.set(0.9,17,0.25);b.position.y=9;arm.add(b);
    const tip=new THREE.Mesh(LM_BOX,TURBM);tip.scale.set(0.5,3,0.2);tip.position.y=18.5;arm.add(tip);g.add(arm);}
  return g;
}
// ---- doomsday preppers' compounds: a concrete wall topped with wire round the lot; the house, a watchtower, solar
// panels, a water tank, stacked containers of supplies, a fuel tank, a vegetable patch -- and the hatch to the bunker ----
function prepperColumn(col,B,U,V,x,z){
  const W=B.w*CELL,Hh=B.h*CELL,h=hash2(x*3+1,z*7+5);col(G,h<0.3?DIRT:GRASS);
  const edge=U<=1||U>=W-2||V<=1||V>=Hh-2;
  if(edge){if(V<=1&&U>=29&&U<=34){col(G,GRAVEL);if(U===29||U===34)for(let y=G+1;y<=G+3;y++)col(y,METAL);return;}
    if(U<=0||U>=W-1||V<=0||V>=Hh-1)return;
    col(G+1,CONCRETE);col(G+2,CONCRETE);col(G+3,CHAINLINK);return;}
  if(U>=29&&U<=34&&V<=8){col(G,GRAVEL);return;}
  // the bunker under the far corner
  if(U>=32&&V>=32){const u=U-32,v=V-32;if(Math.abs(u-PC)<=8&&v>=PC-1)bunkerColumn(col,u,v,x,z);if(Math.abs(u-PC)<=3&&Math.abs(v-PC)<=3)return;}
  // the watchtower by the gate
  {const a=U-54,b=V-5;if(a>=0&&a<=4&&b>=0&&b<=4){const corner=(a===0||a===4)&&(b===0||b===4);
    for(let y=G+1;y<=G+8;y++)if(corner)col(y,LOG);col(G+9,PLANKS);if(a===0||a===4||b===0||b===4){col(G+10,corner?LOG:PLANKS);}col(G+12,ROOF);if(corner)col(G+11,LOG);return;}}
  // solar panels, rows on short posts
  if(U>=36&&U<=60&&V>=12&&V<=27&&(V-12)%4<2){if(U%3===0)col(G+1,METAL);col(G+2,PAINT_NAVY);return;}
  // the water tank
  {const d=Math.hypot(U-12,V-48);if(d<3.4){for(let y=G+1;y<=G+6;y++)col(y,d>2.4||y===G+6?METAL:AIR);return;}}
  // supplies: stacked shipping containers
  if(U>=22&&U<=29&&(V>=40&&V<=42||V>=44&&V<=46)){const c=V<43?RUST:PAINT_GREEN;col(G+1,c);col(G+2,c);if(U>=24&&V<43){col(G+3,PAINT_BLUE);col(G+4,PAINT_BLUE);}return;}
  // the fuel tank on its cradle
  if(U>=4&&U<=10&&V>=30&&V<=32){col(G+1,U%3===1?METAL:RUST);col(G+2,RUST);if(V===31)col(G+3,RUST);return;}
  // the vegetable patch
  if(U>=36&&U<=48&&V>=32&&V<=46){col(G,DIRT);if(V%2===0)col(G+1,LEAVES);return;}
  // sandbags by the house
  if(V===23&&U>=8&&U<=14)col(G+1,SAND);
}
// ---- militia compounds: an earth bank with sandbags along its top all round, a watchtower at each corner, the HQ
// shed, rows of camouflage tents, a firing range with its targets, a couple of armed pickups, the flag ----
function militiaColumn(col,B,U,V,x,z){
  const W=B.w*CELL,Hh=B.h*CELL,h=hash2(x*5+3,z*3+9);col(G,h<0.5?DIRT:GRASS);
  // the corner watchtowers
  for(const [tu,tv] of [[3,3],[W-8,3],[3,Hh-8],[W-8,Hh-8]]){const a=U-tu,b=V-tv;if(a>=0&&a<=4&&b>=0&&b<=4){const corner=(a===0||a===4)&&(b===0||b===4);
    for(let y=G+1;y<=G+9;y++)if(corner)col(y,LOG);col(G+10,PLANKS);if(a===0||a===4||b===0||b===4)col(G+11,SAND);return;}}
  // the bank: earth, sandbags on top; a gap at the gate with concrete blocks either side
  if(U<=2||U>=W-3||V<=2||V>=Hh-3){
    if(V<=2&&U>=29&&U<=34){col(G,GRAVEL);return;}
    if(V<=2&&(U===28||U===35)){col(G+1,CONCRETE);col(G+2,CONCRETE);return;}
    const out=U===0||U===W-1||V===0||V===Hh-1;col(G+1,DIRT);if(!out){col(G+2,DIRT);col(G+3,SAND);}return;}
  if(U>=29&&U<=34&&V<=10){col(G,GRAVEL);return;}
  // the tents: camouflage A-frames in rows
  for(let i=0;i<4;i++)for(let j=0;j<2;j++){const a=U-(8+i*5),b=V-(10+j*8);if(a>=0&&a<=2&&b>=0&&b<=3){const c=(i+j)%2?PAINT_GREEN:PAINT_DARK;if(a===1){col(G+2,c);if(b===0)col(G+1,AIR);}else col(G+1,c);return;}}
  // the firing range: a sandbag firing line, the targets at the far end
  if(V===40&&U>=8&&U<=56&&U%6!==2){col(G+1,SAND);return;}
  if(V===58&&U>=10&&U<=54&&(U-10)%8<3){if((U-10)%8===1){col(G+1,LOG);}col(G+2,(U-10)%8===1?PAINT_RED:PAINT_WHITE);col(G+3,PAINT_WHITE);return;}
  if(V===59&&U>=8&&U<=56){col(G+1,DIRT);col(G+2,DIRT);col(G+3,DIRT);return;}   // (the backstop)
  // the armed pickups ('technicals')
  for(const tu of [40,48]){const a=U-tu,b=V-28;if(a>=0&&a<=4&&b>=0&&b<=2){col(G+1,PAINT_DARK);col(G+2,PAINT_GREEN);if(a<=1)col(G+3,a===1&&b===1?WIN_BLUE:PAINT_GREEN);if(a===3&&b===1){col(G+3,METAL);col(G+4,METAL);}return;}}
  // the flag, and the fire pit
  if(U===32&&V===34){for(let y=G+1;y<=G+11;y++)col(y,METAL);return;}
  if(V===34&&U>=33&&U<=35){col(G+10,PAINT_DARK);col(G+11,U===34?PAINT_RED:PAINT_DARK);return;}
  if(Math.abs(U-24)<=1&&Math.abs(V-34)<=1){col(G+1,U===24&&V===34?LOG:STONE);return;}
}
// ---- ruins: the remains of something old and stone -- roofless rooms, their walls broken down to stumps in places
// and still standing tall in others, a row of columns (some fallen), a broken round tower, a well; ivy, rubble,
// trees growing up through it all ----
const RUIN_ROOMS=[[6,8,26,24],[34,6,58,20],[10,34,30,56]];
function ruinsColumn(col,B,U,V,x,z){
  const h=hash2(x*13+5,z*7+11),stone=()=>{const q=hash2(x*3+1,z*5+(B.ax|0));return q<0.45?MOSSSTONE:q<0.8?COBBLE:STONE;};
  col(G,GRASS);
  for(const [u0,v0,u1,v1] of RUIN_ROOMS){
    if(U<u0||U>u1||V<v0||V>v1)continue;
    const wall=U===u0||U===u1||V===v0||V===v1;
    if(wall){const n=gridNoise(x,z,5,467),hh=n<-0.25?0:Math.max(1,Math.round(3.5+n*5+(h-0.5)*2));
      for(let y=G+1;y<=G+hh;y++)col(y,stone());if(hh>=4&&h<0.3)col(G+hh,LEAVES);
      if(hh===0&&h<0.5)col(G+1,GRAVEL);return;}
    col(G,h<0.55?COBBLE:GRASS);   // the floor, grass coming up through it
    if(h>0.97)col(G+1,h>0.99?COBBLE:GRAVEL);
    return;}
  // a row of columns: some standing, some broken off, some lying fallen
  if(V===27&&U>=36&&U<=58&&(U-36)%4===0){const n=1+Math.floor(hash2(U*7+B.ax,B.az+3)*7);for(let y=G+1;y<=G+n;y++)col(y,y===G+n&&n>=6?STONE:MARBLE);return;}
  if(V===28&&(U===41||U===42||U===43)&&hash2(B.ax,B.az*3)<0.6){col(G+1,MARBLE);return;}
  // the broken tower
  {const d=Math.hypot(U-46,V-44);if(d>=4.3&&d<5.6){const ang=Math.atan2(V-44,U-46),hh=Math.max(0,Math.round(4+5*Math.sin(ang*1.3+1)+gridNoise(x,z,3,473)*2));for(let y=G+1;y<=G+hh;y++)col(y,stone());if(hh===0)col(G+1,GRAVEL);return;}
   if(d<4.3){col(G,COBBLE);return;}}
  // the well
  {const a=U-32,b=V-30;if(Math.abs(a)<=1&&Math.abs(b)<=1){if(a===0&&b===0){for(let y=G-6;y<=G;y++)col(y,y<=G-4?WATER:AIR);col(G-7,STONE);}else{col(G+1,COBBLE);}return;}}
  if(h<0.02)col(G+1,h<0.008?COBBLE:GRAVEL);   // rubble in the grass
}
// ---- the thieves' hideout: hidden in a thicket, a ramshackle shack and a tin shed, the loot piled up outside, stolen
// cars (see the parking), a fire, and a stair down to the stash under the ground ----
function thievesColumn(col,B,U,V,x,z){
  const h=hash2(x*7+1,z*11+3),d=Math.hypot(U-16,V-16);col(G,d<12&&h<0.5?DIRT:GRASS);
  // the stash: down a stair, a plank-lined room full of crates and gold
  if(U>=13&&U<=14&&V>=21&&V<=24){const i=V-20,top=G-i;for(let y=top+1;y<=G+2;y++)col(y,AIR);col(top,PLANKS);return;}
  if(U>=9&&U<=18&&V>=25&&V<=30){const e=U===9||U===18||V===25||V===30;
    for(let y=G-5;y<=G-1;y++)col(y,e||y===G-5||y===G-1?PLANKS:AIR);
    if(U>=13&&U<=14&&V===25)for(let y=G-4;y<=G-2;y++)col(y,AIR);
    if(!e&&(U===10||U===17))col(G-4,(U+V)%2?GOLD:CRATE);if(!e&&(V===29)&&U%2)col(G-3,GOLD);
    return;}
  if(U>=12&&U<=15&&V===20||U===12&&V>=21&&V<=24||U===15&&V>=21&&V<=24){col(G+1,FENCE);return;}
  // the loot, piled outside the shack
  // (the heap itself is props: see siteProps)
  // the fire
  if(Math.abs(U-16)<=1&&Math.abs(V-6)<=1){col(G+1,U===16&&V===6?LOG:STONE);return;}
  if(d>12&&h<0.02)col(G+1,LEAVES);
}
