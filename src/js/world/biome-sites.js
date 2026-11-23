// ---- sites that belong to one kind of country (plan phase 4): oil derricks in the desert and badlands, peat diggings
// on the moor, a research station in the ice fields, a safari lodge on the savanna, a stilt village in the swamp and a
// ski slope with its chairlift in cold mountains. They're kinds in BIGP like the others (country-sites.js), placed only
// where the climate at their middle is right (bigCell asks siteBioW), and laid out here block by block from the
// site's corner (U along x, V along z). Their buildings are in city-plan.js, their props in SITE_FN. ----
// how likely each kind of site is in each biome, against its usual odds (1 where a biome doesn't say). The biome sites
// are 0 everywhere but their own country.
const BIO_SITEW={
  ice:{lumber:0,campsite:0.2,quarry:0.5,mine:0.6,cult:0.5,prepper:0.5,militia:0.3,thieves:0.3,ruins:0.5,airfield:0.4,base:0.6,research:1},
  tundra:{lumber:0.2,campsite:0.4,airfield:0.6,thieves:0.6},
  taiga:{lumber:2.5,campsite:1.3},
  desert:{lumber:0,campsite:0.3,mine:1.5,ruins:1.8,nasa:2,base:1.5,cult:1.3,derricks:1},
  badlands:{lumber:0,campsite:0.4,mine:2,quarry:1.6,ruins:1.5,thieves:1.5,derricks:0.7},
  scrub:{lumber:0.3,militia:1.5,prepper:1.5},
  savanna:{lumber:0.2,campsite:0.8,safari:1},
  rainforest:{lumber:1.8,quarry:0.5,airfield:0.5,cult:1.5,ruins:1.6},
  swamp:{lumber:0.6,quarry:0.3,mine:0.3,cult:2,thieves:1.6,airfield:0.4,base:0.5,stilts:1},
  moor:{lumber:0.3,quarry:1.5,cult:1.5,ruins:1.4,peat:1}};
const BIO_SITES=new Set(['derricks','peat','research','safari','stilts','ski']);
// (their names where you are, render/daynight.js)
const BIO_SITE_N={derricks:'\u{1F6E2}\uFE0F Oil field',peat:'\u{1FAA3} Peat diggings',research:'\u{1F52C} Research station',safari:'\u{1F992} Safari lodge',stilts:'\u{1F6D6} Stilt village',ski:'\u26F7\uFE0F Ski slope'};
// the climate's say in a site of kind K at the middle (cx,cz): its biome's weight, the ski slope by temperature and
// ruggedness alone (cold mountains, whatever the biome)
function siteBioW(K,cx,cz){
  const E=clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP));
  if(K.kind==='ski'){const g=ruggedAt(cx,cz);return E.t<0.36&&g>0.3&&g<0.7?1:0;}
  const W=BIO_SITEW[BIOMES[E.b].k],w=W&&W[K.kind];
  return w!==undefined?w:BIO_SITES.has(K.kind)?0:1;
}
// (the biome a site was put in, remembered on it: its ground)
const bsBio=B=>B.bio||(B.bio=bioNear((B.ax+B.w/2)*CELL,(B.az+B.h/2)*CELL));
function bioSiteColumn(col,B,U,V,x,z){
  if(B.kind==='derricks')derrickColumn(col,B,U,V,x,z);
  else if(B.kind==='peat')peatColumn(col,B,U,V,x,z);
  else if(B.kind==='research')researchColumn(col,B,U,V,x,z);
  else if(B.kind==='safari')safariColumn(col,B,U,V,x,z);
  else if(B.kind==='stilts')stiltColumn(col,B,U,V,x,z);
  else skiColumn(col,B,U,V,x,z);
}
// ---- oil derricks: a drilling rig's lattice tower in the middle, nodding-donkey pumpjacks round it, the storage tanks
// and the site office by the track, all behind a fence ----
const DERRICK_JACKS=[[6,8],[72,8],[6,40],[72,40],[30,84]];
function derrickColumn(col,B,U,V,x,z){
  const Bio=bsBio(B),top=Bio.k==='badlands'?RED_SAND:SAND,h=hash2(x*5+3,z*7+11);
  col(G-1,Bio.k==='badlands'?TERRA:SANDSTONE);col(G,top);
  const W=B.w*CELL;
  if((U===1||U===W-2||V===1||V===W-2)&&U>=1&&V>=1&&U<=W-2&&V<=W-2&&!(V>=60&&V<=62)){col(G+1,CHAINLINK);col(G+2,CHAINLINK);return;}
  // the track across the site and the spur up to the rig
  if(V>=60&&V<=62||U>=46&&U<=49&&V>=38&&V<60){col(G,GRAVEL);return;}
  // the rig: a pad, the drill floor four up, the tower narrowing to the crown 34 up, braced on every face
  {const du=U-48,dv=V-24,au=Math.abs(du),av=Math.abs(dv);
    if(au<=7&&av<=7){col(G,CONCRETE);
      if(au<=5&&av<=5)for(let k=1;k<=34;k++){const hw=5-Math.floor(k*3/34),y=G+k;
        if(au>hw||av>hw)continue;
        const edgeU=au===hw,edgeV=av===hw;
        if(edgeU&&edgeV){col(y,METAL);continue;}
        if(k===4){col(y,PLANKS);continue;}   // the drill floor
        if(k===34){col(y,METAL);continue;}   // the crown
        if(edgeU||edgeV){const q=edgeU?dv:du,ph=(k%8)/8,a=Math.round(-hw+ph*2*hw);if(q===a||q===-a)col(y,METAL);}}
      // the pipe rack and the mud tanks beside the pad
      if(dv>=6&&dv<=7&&au<=4){col(G+1,RUST);col(G+2,RUST);}
      return;}}
  // the pipe from the rig to the tanks, down the side of the spur
  if(U===51&&V>=32&&V<=72&&!(V>=59&&V<=63)){col(G+1,METAL);return;}
  if(V===72&&U>=51&&U<=58){col(G+1,METAL);return;}
  // the storage tanks
  for(const cu of [62,74,86]){const du=U-cu,dv=V-78,d2=du*du+dv*dv;
    if(d2<=20){col(G,CONCRETE);for(let y=G+1;y<=G+7;y++)col(y,y===G+5?PAINT_RED:PAINT_WHITE);col(G+8,d2<=6?METAL:PAINT_WHITE);return;}
    if(d2<=30){col(G,CONCRETE);return;}}
  // the pumpjacks: a gravel pad, the gearbox and its cranks, the Samson post, the walking beam and the horse's head over
  // the well
  for(const [u0,v0] of DERRICK_JACKS){const a=U-u0,b=V-v0;if(a<-1||a>13||b<-1||b>3)continue;
    col(G,GRAVEL);if(a<0||a>12||b<0||b>2)return;
    if(b===1){if(a<=3){col(G+1,METAL);col(G+2,METAL);}
      if(a===6){for(let y=G+1;y<=G+5;y++)col(y,METAL);}
      if(a>=2&&a<=11)col(G+6,PAINT_DARK);
      if(a>=11){col(G+5,PAINT_YELLOW);col(G+6,PAINT_YELLOW);col(G+4,PAINT_YELLOW);}
      if(a===12){col(G+1,METAL);col(G+2,RUST);}
      return;}
    // (either side: the cranks and their weights, the pitman arms up to the beam, the post's legs)
    if(a>=1&&a<=2){col(G+2,PAINT_RED);col(G+3,PAINT_RED);}
    if(a===2){col(G+4,METAL);col(G+5,METAL);}
    if(a===6){for(let y=G+1;y<=G+4;y++)col(y,METAL);}
    return;}
  // a flare stack in the far corner
  if(U===88&&V===10){for(let y=G+1;y<=G+14;y++)col(y,METAL);col(G+15,RUST);return;}
  if(h<0.01)col(G+1,Bio.k==='badlands'?RUST:CACTUS);
}
// ---- peat diggings on the moor: stepped trenches cut into the bog, the cut turves stacked to dry beside them, a stone
// bothy, an open shed of dried peat and the track out ----
function peatColumn(col,B,U,V,x,z){
  const h=hash2(x*3+17,z*11+5);col(G-2,MUD);col(G-1,MUD);
  if(U>=54&&U<=57||V>=44&&V<=47&&U>=20&&U<54){col(G,GRAVEL);return;}
  for(const v0 of [8,20,32]){
    if(V>=v0&&V<=v0+4&&U>=8&&U<=50){
      // (the first row a step down, the rest two: a bank cut back a row at a time)
      if(V===v0){col(G,AIR);return;}
      col(G,AIR);col(G-1,h<0.14?WATER:AIR);return;}
    // the turves drying: rows of little stacks along the bank
    if(V===v0-2&&U>=8&&U<=50&&U%4<2){col(G,MUD);col(G+1,MUD);if(h<0.4)col(G+2,MUD);return;}}
  // the peat shed: log posts, a plank roof, dried peat stacked under it
  if(U>=24&&U<=40&&V>=50&&V<=58){col(G,DIRT);
    const post=(U===24||U===40||U===32)&&(V===50||V===58);
    if(post){for(let y=G+1;y<=G+3;y++)col(y,LOG);}
    else if(U>25&&U<39&&V>51&&V<57&&U%5!==0){col(G+1,MUD);col(G+2,MUD);}
    col(G+4,PLANKS);return;}
  if(h<0.012){col(G+1,STONE);return;}
}
// ---- a research station in the ice fields: red modules (the lab and the living quarters, in city-plan.js), a radar
// dome on its tower, a radio mast, a weather screen and a helipad cleared out of the snow ----
function researchColumn(col,B,U,V,x,z){
  col(G-1,SNOW);col(G,SNOW);
  // the helipad: concrete, its yellow ring and a white H
  {const du=U-46,dv=V-22,d2=du*du+dv*dv;if(d2<=42){col(G,d2>=25?PAINT_YELLOW:CONCRETE);
    if((Math.abs(du)===2&&Math.abs(dv)<=3)||(dv===0&&Math.abs(du)<=2))col(G,PAINT_WHITE);return;}}
  // the radar: a lattice tower and the white dome on top
  {const du=U-48,dv=V-48;if(Math.abs(du)<=4&&Math.abs(dv)<=4){col(G,CONCRETE);
      if(Math.abs(du)===2&&Math.abs(dv)===2)for(let y=G+1;y<=G+8;y++)col(y,METAL);
      if(Math.abs(du)<=3&&Math.abs(dv)<=3)col(G+9,METAL);
      for(let y=G+10;y<=G+14;y++){const e=y-(G+10.5),r2=du*du+dv*dv+e*e;if(r2<=16.5&&e>=-0.5)col(y,PAINT_WHITE);}
      return;}}
  // the radio mast, red and white
  if(U===58&&V===6){for(let k=1;k<=24;k++)col(G+k,(k>>2)%2?PAINT_RED:PAINT_WHITE);col(G+25,LAMP);return;}
  if((U===56||U===60)&&V===6){col(G,CONCRETE);return;}
  // the weather screen on its legs
  if(U>=40&&U<=41&&V>=4&&V<=5){col(G+1,METAL);col(G+2,METAL);col(G+3,PAINT_WHITE);return;}
  // the paths between, trodden into the snow
  if(V>=30&&V<=31&&U>=4&&U<=44||U>=34&&U<=35&&V>=4&&V<=44)col(G,GRAVEL);
}
// ---- a safari lodge on the savanna: the lodge, tents on their decks, a watchtower over a waterhole and the track ----
const SAFARI_TENTS=[[32,4],[42,4],[52,4],[32,16]];
function safariColumn(col,B,U,V,x,z){
  const h=hash2(x*13+1,z*3+9);col(G,GRASS);
  // the waterhole: water two deep, a mud rim with reeds
  {const du=U-26,dv=V-46,d=Math.sqrt(du*du+dv*dv);
    if(d<6){col(G-2,MUD);col(G-1,WATER);col(G,WATER);return;}
    if(d<8){col(G,MUD);if(h<0.3)col(G+1,REEDS);return;}}
  if(V>=26&&V<=28||U>=12&&U<=14&&V>=18&&V<26||U>=58&&U<=60&&V>28){col(G,DIRT);return;}
  // the tents: a deck of planks, an A-frame of canvas on it, open at the front
  for(const [u0,v0] of SAFARI_TENTS){const a=U-u0,b=V-v0;if(a<0||a>6||b<0||b>8)continue;
    col(G+1,PLANKS);if(a<1||a>5||b<2||b>7)return;
    if(a===3){col(G+4,STUCCO);if(b===7){col(G+2,STUCCO);col(G+3,STUCCO);}}
    else if(a===2||a===4){col(G+3,STUCCO);if(b===7)col(G+2,STUCCO);}
    else{col(G+2,STUCCO);}
    return;}
  // the watchtower: log legs, a deck six up with a rail, a thatched roof
  {const du=U-52,dv=V-44,au=Math.abs(du),av=Math.abs(dv);
    if(au<=2&&av<=2){
      if(au===2&&av===2){for(let y=G+1;y<=G+10;y++)col(y,LOG);}
      if(!(du===0&&dv===2))col(G+7,PLANKS);if((au===2||av===2)&&!(au===2&&av===2)&&!(du===0&&dv===2))col(G+8,FENCE);
      col(G+11,SHINGLE);if(au<=1&&av<=1)col(G+12,SHINGLE);if(au===0&&av===0)col(G+13,SHINGLE);
      // (the ladder up its back)
      if(du===0&&dv===2)for(let y=G+1;y<=G+6;y++)col(y,FENCE);
      return;}
    if(au<=3&&av<=3){col(G+11,SHINGLE);return;}}
  if(h<0.02)col(G+1,FLOWER);
}
// ---- a stilt village in the swamp: huts on log stilts over the water, joined by boardwalks, one running out to dry land
// ----
const STILT_HUTS=[[14,14],[42,12],[14,44],[46,42],[30,28]];
function stiltColumn(col,B,U,V,x,z){
  const h=hash2(x*7+29,z*13+3),n=nzNoise(x/9,z/9,6113)*0.5+0.5;
  col(G-2,MUD);col(G-1,MUD);
  // (the open water, mud banks where the noise is high, reeds along them)
  const bank=n>0.62||U<2||V<2||U>61||V>61;col(G,bank?MUD:WATER);if(bank&&h<0.25||!bank&&h<0.06)col(G+1,REEDS);
  for(const [hx,hz] of STILT_HUTS){const du=U-hx,dv=V-hz,au=Math.abs(du),av=Math.abs(dv);if(au>3||av>3)continue;
    col(G+1,AIR);
    if((au===3||au===0)&&(av===3||av===0)){col(G,LOG);col(G+1,LOG);}   // the stilts
    col(G+2,PLANKS);
    if(au<=2&&av<=2&&(au===2||av===2)){const door=dv===2&&du===0;
      for(let y=G+3;y<=G+5;y++)col(y,door&&y<=G+4?AIR:dv===-2&&du===0&&y===G+4?GLASS:PLANKS);}
    // the roof: a pyramid of shingles over the porch
    col(G+6,SHINGLE);if(au<=2&&av<=2)col(G+7,SHINGLE);if(au<=1&&av<=1)col(G+8,SHINGLE);if(au===0&&av===0)col(G+9,SHINGLE);
    return;}
  // the boardwalks: from each hut to the middle one, and from it south to the edge
  let walk=U>=30&&U<=31&&V>=28;
  for(const [hx,hz] of STILT_HUTS){if(V>=hz&&V<=hz+1&&U>=Math.min(hx,30)&&U<=Math.max(hx,31))walk=true;if(U>=30&&U<=31&&V>=Math.min(hz,28)&&V<=Math.max(hz,29))walk=true;}
  if(walk){col(G+1,PLANKS);if((U+V)%4===0)col(G,LOG);}
}
// ---- a ski slope in cold mountains: the piste rising across the site's back two thirds, a chairlift up it on pylons with
// its stations top and bottom, a log lodge and the car park at the foot ----
// (how high the piste stands V blocks from the front, and the chairlift's cable)
const skiH=V=>{const s=nzClamp01((V-36)/88);return Math.round(30*s*Math.sqrt(s));};
const skiCab=V=>G+5+Math.round(31*(V-32)/88);
function skiColumn(col,B,U,V,x,z){
  const h=hash2(x*5+13,z*3+7),hs=skiH(V);col(G-1,STONE);col(G,SNOW);
  for(let y=G;y<G+hs;y++)col(y,STONE);col(G+hs,SNOW);
  // the car park
  if(U>=60&&U<=92&&V>=4&&V<=24){col(G,ASPHALT);if((U-60)%5===0&&V>=6&&V<=11||(U-60)%5===0&&V>=17&&V<=22)col(G,LANE);return;}
  if(U>=72&&U<=75&&V<4){col(G,ASPHALT);return;}
  // the chairlift's stations: posts and a red roof over the bull wheel, bottom and top
  for(const [v0,y0] of [[26,G],[116,G+skiH(120)]]){const dv=V-v0,du=U-70;if(dv<0||dv>8||Math.abs(du)>4)continue;
    for(let y=G+hs+1;y<y0+1;y++)col(y,STONE);
    if(Math.abs(du)===4&&(dv===0||dv===8))for(let y=y0+1;y<=y0+5;y++)col(y,METAL);
    col(y0+6,PAINT_RED);if(Math.abs(du)<=1&&dv>=3&&dv<=5)col(y0+5,METAL);
    return;}
  // the cables up and down, the chairs hanging from them, and the pylons every 16 blocks
  if(V>=34&&V<=116){const yc=skiCab(V);
    if(U===68||U===72){col(yc,METAL);if((V+(U===72?4:0))%8===0){col(yc-1,METAL);col(yc-2,PAINT_DARK);}}
    if((V-36)%16===0&&V>=44&&V<=108){if(U===70)for(let y=G+hs+1;y<yc;y++)col(y,METAL);if(U>=67&&U<=73)col(yc+1,METAL);}
    if(U>=67&&U<=73)return;}
  // marker poles down the sides of the piste
  if((U===8||U===56)&&V>40&&V%12===0){col(G+hs+1,PAINT_ORANGE);col(G+hs+2,PAINT_ORANGE);return;}
  if(hs===0&&h<0.01)col(G+1,STONE);
}
