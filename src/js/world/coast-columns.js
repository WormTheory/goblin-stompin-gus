// one column of the sea and its shores
function seaColumn(a,col,px,pz,rx,rz,lx,lz,x,z){
  const t=plotType(px,pz),P=plotInfo(px,pz);
  if(t==='yard'||t==='navy'){yardColumn(a,col,P,px,pz,rx,rz,lx,lz,x,z);return;}
  if(t==='basin'||t==='nbasin'){
    // dredged out to 11 blocks at the quays, shelving up to the natural sea bed at any open edge
    {let e=99;for(const [a,b] of N4){if(['basin','nbasin','yard','navy'].includes(plotType(px+a,pz+b)))continue;e=Math.min(e,a>0?CELL-1-rx:a<0?rx:b>0?CELL-1-rz:rz);}
     const d=Math.max(oceanDepth(x,z),Math.min(11,oceanDepth(x,z)+e));for(let y=G-d;y<=G;y++)col(y,WATER);col(G-d-1,SAND);}
    craneCol(col,x,z);return;}
  if(t==='harbor'){harborColumn(col,P,rx,rz,x,z);return;}
  if(t==='rig'){seaWater(col,x,z);rigColumn(col,rx-16,rz-16);return;}
  // (well under water, however shallow it is here: a wreck standing out of the sea just looked like a ruin afloat)
  if(t==='wreck'){seaWater(col,x,z);const d=oceanDepth(px*CELL+16,pz*CELL+16);
    for(let y=G-d;y<G-1;y++){const v=wreckBlock(rx-1,rz-16,y-G+d,px*3+pz);if(v===null||v===AIR)continue;col(y,v!==RUST?v:hash2(x+y*7,z)<0.5?RUST:hash2(x,z+y)<0.6?MOSSSTONE:METAL);}return;}
  if(t==='beach'){const wet=natCoast(col,x,z,'beach');if(!wet)beachColumn(col,P,rx,rz,x,z);return;}
  const wet=natCoast(col,x,z);
  if(t==='lighthouse'){const d=Math.hypot(rx-P.lh.x,rz-P.lh.z);
    if(d<8){for(let y=G-3;y<=G+1;y++)col(y,AIR);const h=d<6.5?1:0;col(G-1,STONE);col(G,hash2(x*3,z*5)<0.4?MOSSSTONE:STONE);if(h&&d>4.6)col(G+1,hash2(x,z*3)<0.5?STONE:AIR);}   // the rocks it stands on
    plotBuildings(a,lx,lz,rx,rz,x,z,P);}
  if(!wet){const W=riverAt(x+0.5,z+0.5,RIV_W+5);if(W)plainsRiverColumn(col,W.d);}
}
// a town's beach: a row of beach huts at the back of the sand and a boardwalk behind them
function beachColumn(col,P,rx,rz,x,z){
  const w=-coastD(x,z);if(w>=21)return;
  if(w>=17){col(G,PLANKS);for(let y=G+1;y<=G+3;y++)col(y,AIR);return;}   // the boardwalk
  // the huts: on a grid, where the grid point falls in the back of the beach
  {const gx=Math.round(x/6)*6,gz=Math.round(z/6)*6;if(Math.abs(x-gx)<=1&&Math.abs(z-gz)<=1){const gw=-coastD(gx,gz);
    if(gw>=13&&gw<16&&hash2(gx*7+1,gz*3+5)<0.75){const c=CONT_C[Math.floor(hash2(gx,gz*7)*6)],u=x-gx,v=z-gz;
      // (striped, with a low pointed roof, the door on the side facing the water)
      const dd=[[1,0],[-1,0],[0,1],[0,-1]].reduce((m,q)=>coastD(gx+q[0]*6,gz+q[1]*6)>coastD(gx+m[0]*6,gz+m[1]*6)?q:m);
      for(let y=G+1;y<=G+2;y++)col(y,u===0&&v===0||u===dd[0]&&v===dd[1]?AIR:u===0||v===0?PAINT_WHITE:c);col(G+3,c);if(u===0&&v===0)col(G+4,c);col(G,PLANKS);return;}}}
  if(w>=13)return;
  // (the sunshades, loungers, towels and the lifeguard's chair are props: see coastProps)
}
// an oil rig, well out in deep water: four legs down to the bottom, the deck on top with its accommodation block, the
// drilling derrick, a crane and the flare stack
function rigColumn(col,u,v){
  const au=Math.abs(u),av=Math.abs(v);
  if((au===6||au===7)&&(av===6||av===7))for(let y=G-29;y<=G+8;y++)col(y,METAL);
  if(au<=7&&av<=7&&(au===7||av===7)&&(mod(G+2,1)===0))col(G+2,METAL);
  // the crane's boom, out over the side and rising
  if(v===-2&&u<=-7&&u>=-17)col(G+15+((-7-u)>>1),PAINT_YELLOW);
  if(au>11||av>11)return;
  col(G+9,CONCRETE);if(au===11||av===11){col(G+10,FENCE);return;}
  if(u>=-10&&u<=-3&&v>=3&&v<=10){const e=u===-10||u===-3||v===3||v===10;for(let y=G+10;y<=G+16;y++)col(y,e?((y-G)%2===0&&v===3?WIN_BLUE:PAINT_WHITE):AIR);
    // (the helipad on its roof: an H on a dark deck, with a yellow edge)
    {const e2=u===-10||u===-3||v===3||v===10,hx=u+6.5,hz=v-6.5;col(G+17,e2?PAINT_YELLOW:(Math.abs(hx)<=1.5&&(Math.abs(hz)>=1.5&&Math.abs(hz)<=2.5||Math.abs(hz)<=.5))||Math.abs(hx)===1.5&&Math.abs(hz)<=2.5?PAINT_WHITE:PAINT_DARK);}return;}
  if(u>=2&&u<=6&&v>=-6&&v<=-2){const du=Math.abs(u-4),dv=Math.abs(v+4);for(let y=G+10;y<=G+34;y++){const wdt=Math.max(0,Math.round(2-(y-G-10)/12));if((du===wdt||dv===wdt)&&du<=wdt&&dv<=wdt&&(du===dv||(y-G)%4===0))col(y,METAL);}return;}
  if(u===-9&&v===-9)for(let y=G+10;y<=G+22;y++)col(y,y===G+22?NEON_O:METAL);
  if(u===-7&&v===-2)for(let y=G+10;y<=G+14;y++)col(y,PAINT_YELLOW);
}
// a port's yard: concrete, the quay edge with its bollards, roadways on the street lines, container stacks (or, on a
// naval base, its barracks, a dry dock and a fence round it all)
function yardColumn(a,col,P,px,pz,rx,rz,lx,lz,x,z){
  for(let y=G+1;y<G+4;y++)col(y,AIR);
  col(G,CONCRETE);col(G-1,CONCRETE);col(G-2,STONE);
  let te=99,al=0;for(const [sa,sb] of P.wet){const q=fromSide(sa,sb,rx,rz);if(q<te){te=q;al=alongSide(sa,sb,rx,rz);}}
  if(te===0)col(G,STONE);   // (its bollards are props: see coastProps)
  const road=rx<ROADW||rz<ROADW;
  if(road&&te>1)col(G,ASPHALT);
  if(P.type==='yard'){
    craneCol(col,x,z);
    if(te===2||te===13)col(G,METAL);                 // the crane rails
    if(!road&&te>16&&rx>=ROADW+1&&rx<CELL-2&&rz>=ROADW+1&&rz<CELL-2){
      const u=rx-ROADW-1,v=rz-ROADW-1,cu=Math.floor(u/7),cv=Math.floor(v/4);
      if(u%7<6&&v%4<3){const n=Math.floor(hash2(px*31+cu*7+3,pz*17+cv*5+1)*5);
        for(let L=0;L<n;L++){const c=CONT_C[Math.floor(hash2(px*13+cu*3+L,pz*7+cv*11+L*5)*CONT_C.length)];col(G+1+L*2,c);col(G+2+L*2,c);}}}
    return;}
  // the naval base
  for(const [sa,sb] of N4){if(P.site.some(([qa,qb])=>qa===sa&&qb===sb))continue;
    if(fromSide(sa,sb,rx,rz)===0&&alongSide(sa,sb,rx,rz)>=ROADW)for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);}
  if(P.dock){const [sa,sb]=P.dock,tt=fromSide(sa,sb,rx,rz),w=alongSide(sa,sb,rx,rz)-PC;
    if(Math.abs(w)<=5&&tt<=26){
      if(Math.abs(w)===5||tt===26){for(let y=G-8;y<=G;y++)col(y,CONCRETE);}
      else{for(let y=G-7;y<=G;y++)col(y,AIR);col(G-8,CONCRETE);
        if(tt===0){for(let y=G-8;y<=G;y++)col(y,METAL);}        // the gate, holding the sea back
        else if(w===0&&tt%3===0)col(G-7,CONCRETE);}            // the keel blocks (the warship on them is in mooredBoats)
      return;}}
  plotBuildings(a,lx,lz,rx,rz,x,z,P);
}
// a town's harbour: a stone sea wall along the shore with a promenade behind it, piers out from it, boats tied up
function harborColumn(col,P,rx,rz,x,z){
  const [la,lb]=P.land,u=fromSide(la,lb,rx,rz),w=alongSide(la,lb,rx,rz),wet=(qx,qz)=>seaBlk(qx,qz)>=SEA_T;
  const pier=P.fish?P.pw>=0&&(w===P.pw||w===P.pw+1):(w>=9&&w<=11)||(w>=21&&w<=23);
  if(!wet(x,z)){
    for(let y=G+1;y<G+4;y++)col(y,AIR);col(G-1,STONE);
    const wall=wet(x+1,z)||wet(x-1,z)||wet(x,z+1)||wet(x,z-1);
    // (roads only where a street of the town actually comes through, not strips of tarmac running off into the grass)
    const road=w<ROADW&&P.rdW||u<ROADW&&(la<0||lb<0)&&P.rdU;
    // (the quay's paved right back to the town, tapering off to its open ends so it doesn't stop along a straight line)
    {let e=99;if(!P.fish)for(const [a,b] of N4){if(plotType(P.px+a,P.pz+b)==='harbor'||settlementAt(P.px+a,P.pz+b))continue;e=Math.min(e,a>0?CELL-1-rx:a<0?rx:b>0?CELL-1-rz:rz);}
     if(!road&&!wall&&coastD(x,z)<-(P.fish?9:Math.min(9+e,32))){plainsColumn(col,x,z);return;}}   // (back from the front: grass)
    if(P.fish){col(G,road?ASPHALT:wall?PLANKS:GRAVEL);
      // the fish shack: plank walls, a tarred roof, a door to the water
      if(P.shack){const S=P.shack;if(u>=S.u0&&u<=S.u1&&w>=S.w0&&w<=S.w1){const ed=u===S.u0||u===S.u1||w===S.w0||w===S.w1;col(G,PLANKS);
        for(let y=G+1;y<=G+3;y++)col(y,!ed||u===S.u1&&w===16&&y<G+3?AIR:y===G+2&&w===S.w0&&u===S.u0+2?GLASS:PLANKS);col(G+4,ROOF);if(Math.abs(u-(S.u0+S.u1)/2)<1)col(G+5,ROOF);if(u===S.u0+1&&w===S.w1-1){col(G+5,COBBLE);col(G+6,COBBLE);}}}
      return;}   // (a village's front: a plank wharf and gravel; its nets and crates are props)
    col(G,road?ASPHALT:wall?STONE:COBBLE);
    if(wall&&!pier)col(G+1,FENCE);
    else if(!wall&&w>=ROADW&&u>=ROADW&&(wet(x+2,z)||wet(x-2,z)||wet(x,z+2)||wet(x,z-2))){
      if(mod(x+z,9)===0){col(G+1,METAL);col(G+2,METAL);col(G+3,LAMP);}}
    return;}
  {let e=99;for(const [a,b] of N4){if(plotType(P.px+a,P.pz+b)==='harbor'||settlementAt(P.px+a,P.pz+b))continue;e=Math.min(e,a>0?CELL-1-rx:a<0?rx:b>0?CELL-1-rz:rz);}
   seaWater(col,x,z,Math.min(4,1+(e>>1)));}   // (dredged for the boats, shelving back up at its open edges)
  if(pier){col(G,PLANKS);for(let y=G+1;y<G+3;y++)col(y,AIR);
    if(u%4===1&&(P.fish?pier:w===9||w===11||w===21||w===23))for(let y=G-6;y<G;y++)col(y,LOG);
    return;}
}
