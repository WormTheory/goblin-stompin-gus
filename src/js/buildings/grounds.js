// ---- the grounds of the big complexes ----
const coasterH=th=>Math.max(2,Math.round(7+4*Math.sin(2*th)+3*Math.sin(th+0.7)));
const B5_GROUND={
  // the university quad: lawns crossed by paths, trees along them
  campus(col,P,u,v,x,z){col(G-1,DIRT);const h=hash2(x*3+1,z*5+7);
    const path=Math.abs(u-v)<1.2||Math.abs(u+v-2*PL0-48)<1.2||(u-PL0)%16===8||v===PL0+16||v===PL0+17;
    col(G,path?GRAVEL:GRASS);if(!path&&h<0.02){for(let y=G+1;y<=G+3;y++)col(y,LOG);for(let y=G+4;y<=G+6;y++)col(y,LEAVES);}else if(!path&&h<0.05)col(G+1,FLOWER);},
  // the prison: the high wall right round (razor wire along the top), a gate through it at the gatehouse, the yard
  prison(col,P,u,v,x,z){const Q=P.prison,edge=u===Q.x0||u===Q.x1-1||v===Q.z0||v===Q.z1-1;
    if(edge){if(v===Q.z0&&Math.abs(u-(Q.x0+Q.x1)/2+0.5)<=1.6)return;for(let y=G+1;y<=G+9;y++)col(y,CONCRETE);col(G+10,CHAINLINK);return;}
    const [a0,a1,b0,b1]=Q.yard;if(u>=a0&&u<a1&&v>=b0&&v<b1){col(G,ASPHALT);if((u===a0||u===a1-1||v===b0||v===b1-1)&&!(v===b0&&Math.abs(u-(a0+a1)/2)<1.6)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);}
      else if(u===a0+2&&Math.abs(v-(b0+b1)/2)<0.6){for(let y=G+1;y<=G+4;y++)col(y,METAL);col(G+5,PAINT_WHITE);}else if(v===b1-3&&u%4===0)col(G+1,PLANKS);return;}
    col(G,GRAVEL);},
  // the water works: the settling tanks (a low rim, water, the hub in the middle), the filter beds, mown grass
  water(col,P,u,v,x,z){col(G-1,DIRT);col(G,GRASS);
    for(const [cx,cz] of P.clar){const d=Math.hypot(u-cx,v-cz);if(d<=7.5){if(d>6.6){col(G,CONCRETE);col(G+1,CONCRETE);}else if(d<0.9){col(G,CONCRETE);col(G+1,METAL);col(G+2,METAL);}else{col(G,WATER);col(G-1,WATER);col(G-2,CONCRETE);}return;}}
    const [fx0,fz0,fx1,fz1]=P.filt;if(u>=fx0&&u<fx1&&v>=fz0&&v<fz1){const e=u===fx0||u===fx1-1||v===fz0||v===fz1-1||(u-fx0)%6===0||(v-fz0)%6===0;if(e){col(G,CONCRETE);col(G+1,CONCRETE);}else{col(G,v%2?WATER:GRAVEL);col(G-1,GRAVEL);}return;}
    if((u-PL0)%7===0&&(v-PL0)%9===0)col(G+1,FLOWER);},
  // the power station's yard: the coal heaped up on its pad, the switchyard of transformers behind a fence
  power(col,P,u,v,x,z){col(G,GRAVEL);const C=P.power.coal,W2=P.power.switch;
    if(u>=C[0]&&u<C[1]&&v>=C[2]&&v<C[3]){const cu=(C[0]+C[1])/2,h=Math.max(0,Math.round(6-Math.abs(u-cu)*1.4-Math.max(0,Math.min(v-C[2],C[3]-1-v)<3?3-Math.min(v-C[2],C[3]-1-v):0)));col(G,CONCRETE);for(let y=1;y<=h;y++)col(G+y,COAL);return;}
    if(u>=W2[0]&&u<W2[1]&&v>=W2[2]&&v<W2[3]){if(u===W2[0]||u===W2[1]-1||v===W2[2]||v===W2[3]-1){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
      if((u-W2[0])%3===2&&(v-W2[2])%4===1){col(G+1,METAL);col(G+2,RUST);col(G+3,PAINT_DARK);}return;}},
  // the zoo: paths between the enclosures, and each enclosure's own ground, fence and furniture
  zoo(col,P,u,v,x,z){col(G-1,DIRT);col(G,GRASS);
    for(const E of P.encl){if(u<E.x0||u>=E.x1||v<E.z0||v>=E.z1)continue;const edge=u===E.x0||u===E.x1-1||v===E.z0||v===E.z1-1,h=hash2(x*7+2,z*3+9);
      if(edge){col(G,GRASS);col(G+1,E.g==='pool'?GLASS:E.g==='rock'?STONE:FENCE_W);col(G+2,E.g==='pool'?GLASS:CHAINLINK);return;}
      if(E.g==='sav'){col(G,h<0.3?SAND:GRASS);if(h>0.985){for(let y=G+1;y<=G+4;y++)col(y,LOG);for(let y=G+5;y<=G+6;y++)col(y,LEAVES);}}
      else if(E.g==='dirt'){col(G,DIRT);if(h>0.97)col(G+1,LOG);}
      else if(E.g==='rock'){col(G,h<0.5?GRAVEL:SAND);const rd=Math.hypot(u-(E.x0+E.x1)/2,v-(E.z0+E.z1)/2);if(rd<3.5)for(let y=G+1;y<=G+Math.round(3.5-rd);y++)col(y,STONE);}
      else if(E.g==='pool'){const ins=u>E.x0+1&&u<E.x1-2&&v>E.z0+3&&v<E.z1-2;if(ins){col(G,WATER);col(G-1,WATER);}else col(G,ICE);}
      else if(E.g==='trees'){col(G,DIRT);if((u+v)%5===0&&h<0.5){for(let y=G+1;y<=G+5;y++)col(y,LOG);for(let y=G+5;y<=G+7;y++)col(y,LEAVES);}else if(h>0.9)col(G+1,PLANKS);}
      return;}
    col(G,(u+v)%2?GRAVEL:SIDEWALK);},
  // the film studio: tarmac lots, the water tank (a wide shallow pool with its painted-sky backdrop), the backlot street
  studio(col,P,u,v,x,z){col(G,ASPHALT);const T2=P.tank;
    if(u>=T2.x0&&u<T2.x1&&v>=T2.z0&&v<T2.z1){if(v===T2.z1-1){for(let y=G+1;y<=G+12;y++)col(y,PAINT_BLUE);col(G+13,PAINT_WHITE);return;}
      if(u===T2.x0||u===T2.x1-1||v===T2.z0){col(G,CONCRETE);col(G+1,CONCRETE);return;}col(G,WATER);col(G-1,WATER);col(G-2,CONCRETE);return;}
    },
  arena(col,P,u,v,x,z){col(G,(u+v)%2?SIDEWALK:CONCRETE);},
  nuclear(col,P,u,v,x,z){const Q=P.nuke;col(G,(u*3+v)%7===0?GRAVEL:CONCRETE);
    if(u===Q.x0||u===Q.x1-1||v===Q.z0||v===Q.z1-1){if(v===Q.z0&&Math.abs(u-PL0-11)<=1)return;for(let y=G+1;y<=G+4;y++)col(y,CHAINLINK);col(G+5,CHAINLINK);return;}
    if(u>=PL0+33&&u<=PL0+47&&v>=PL0+38&&v<=PL0+48&&(u-PL0)%3===0&&(v-PL0)%4===1){col(G+1,METAL);col(G+2,RUST);col(G+3,PAINT_DARK);}},
  theme(col,P,u,v,x,z){const R2=P.theme;if(!R2)return;   // (a park whose first plot went to something else has no plan: without this, every chunk it touches failed)
    // (the small park is all bright paving. The big one would be a sea of it, so there it's bright walks between lawns.)
    {const fun=[SIDEWALK,PAINT_YELLOW,SIDEWALK,PAINT_RED,SIDEWALK,PAINT_BLUE][((u>>1)+(v>>1))%6];
     if(R2.gm===undefined)col(G,fun);
     else{const C=R2.coaster,W2=R2.wheel,C2=R2.carousel,e=Math.hypot((u+0.5-C.cu)/C.a,(v+0.5-C.cv)/C.b);
      const walk=Math.abs(u-R2.gm)<=5&&v<PL0+44||v>=PL0+20&&v<=PL0+42&&u>=PL0+8&&u<=R2.span||Math.abs(u-W2.cu)<=4&&v>=PL0+40&&v<=PL0+172||v>=PL0+126&&v<=PL0+132&&u>=PL0+122&&u<=W2.cu||v>=PL0+40&&v<=PL0+160&&Math.abs(u-PL0+124)<=3||e>=1.08&&e<=1.2||
        Math.hypot(u-W2.cu,v-W2.cv)<27||Math.hypot(u-C2.cu,v-C2.cv)<17;
      if(walk)col(G,fun);else{col(G,GRASS);col(G-1,DIRT);const h=hash2(x*7+1,z*5+3);if(h<0.012)col(G+1,FLOWER);else if(h<0.016){col(G+1,LOG);col(G+2,LOG);col(G+3,LEAVES);}}}}
    // the boating lake
    if(R2.pond){const Pd=R2.pond,d=Math.hypot(u+.5-Pd.cu,v+.5-Pd.cv);if(d<Pd.r){col(G,d<Pd.r-1.5?WATER:SIDEWALK);if(d<Pd.r-1.5)col(G-1,STONE);if(d<Pd.r-1.5)return;}}
    // the coaster: a looping track on trestles, rising and dipping round its circuit
    {const C=R2.coaster,du=(u+0.5-C.cu)/C.a,dv=(v+0.5-C.cv)/C.b,e=Math.hypot(du,dv),th=Math.atan2(dv,du);
     if(e<0.86){col(G,GRASS);col(G-1,DIRT);}
     if(Math.abs(e-1)*Math.min(C.a,C.b)<0.75){const h=coasterH(th);col(G+h,METAL);if(((Math.round((th+Math.PI)*20))%5===0))for(let y=G+1;y<G+h;y++)col(y,RUST);}}
    // the Ferris wheel's A-frame legs
    {const W2=R2.wheel;for(const dz of [-2,2])if(v===W2.cv+dz){for(let y=G+1;y<W2.hub;y++){const off=Math.round((W2.hub-y)*0.42);if(u===W2.cu-off||u===W2.cu+off)col(y,METAL);}if(u===W2.cu)col(W2.hub,METAL);}}
    // the carousel's round plinth
    {const C2=R2.carousel,d=Math.hypot(u+0.5-C2.cu,v+0.5-C2.cv);if(d<6.2)col(G,d>5.4?PAINT_YELLOW:PLANKS);}
    if(P.stalls)for(const S2 of P.stalls){const a=u-S2.x0,b2=(v-S2.z0)*S2.face+(S2.face<0?2:0);if(a<0||a>2||b2<0||b2>2)continue;if((a===0||a===2)&&(b2===0||b2===2))for(let y=G+1;y<=G+3;y++)col(y,METAL);col(G+4,a===1?PAINT_WHITE:S2.aw);if(b2===2&&a===1){col(G+1,PLANKS);col(G+2,[PAINT_ORANGE,PAINT_RED,PAINT_YELLOW,LEAVES,FLOWER][S2.crop]);}}}
};
function landmarkYard(col,P,rx,rz,x,z){
  const b=P.b[0];if(!b)return;const cx=(b.x0+b.x1)>>1;
  if(Math.abs(rx-cx)<=1&&rz<b.z0){col(G,GRAVEL);return;}
  if(P.type==='wtower'){const x0=b.x0-2,x1=b.x1+1,z0=b.z0-2,z1=b.z1+1;
    if((rx===x0||rx===x1)&&rz>=z0&&rz<=z1||(rz===z0||rz===z1)&&rx>=x0&&rx<=x1)col(G+1,FENCE_W);return;}
  if(rx>=b.x0-1&&rx<=b.x1&&rz>=b.z0-1&&rz<=b.z1){col(G,GRAVEL);return;}
  if(rx===PL0||rx===PL1-1||rz===PL1-1)col(G+1,LEAVES);else if(hash2(x*5+3,z*11+1)<0.09)col(G+1,FLOWER);
}
// a plot's buildings (and monuments) over whatever ground it has
function plotBuildings(a,lx,lz,rx,rz,x,z,P){
  for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(rx>=b.x0&&rx<b.x1&&rz>=b.z0&&rz<b.z1){buildingColumn(a,lx,lz,rx,rz,b,collapses[P.px+','+P.pz+','+bi],P.px,P.pz);return;}}
}
function yardCol(col,P,rx,rz,x,z){
  for(const b of P.b){
    const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
    if(b.door===0&&rx<b.x0&&Math.abs(rz-cz)<=1){col(G,GRAVEL);return;}
    if(b.door===1&&rx>=b.x1&&Math.abs(rz-cz)<=1){col(G,GRAVEL);return;}
    if(b.door===2&&rz<b.z0&&Math.abs(rx-cx)<=1){col(G,GRAVEL);return;}
    if(b.door===3&&rz>=b.z1&&Math.abs(rx-cx)<=1){col(G,GRAVEL);return;}
  }
  // round the edge: a hedge, or (mostly, out in the suburbs) a white picket fence -- open where the path comes through
  const sub=zoneAt(P.px,P.pz)==='suburb',hp=hash2(P.px*71+5,P.pz*37+9);
  {const B=plotBounds(P.px,P.pz);if((B.x0===PL0&&rx===PL0)||(B.x1===PL1&&rx===PL1-1)||(B.z0===PL0&&rz===PL0)||(B.z1===PL1&&rz===PL1-1)){col(G+1,sub&&hp<0.7?FENCE:LEAVES);return;}}
  // between the neighbours' gardens: tall board fences in the suburbs, now and then a low picket fence in town
  if((rx===PC||rz===PC)&&rx>=PL0&&rx<PL1&&rz>=PL0&&rz<PL1){
    if(sub&&hp<0.85){col(G+1,FENCE_W);col(G+2,FENCE_W);return;}
    if(!sub&&hp<0.4){col(G+1,FENCE);return;}}
  if(hash2(x*5+3,z*11+1)<0.06)col(G+1,FLOWER);
}
// a river block's column. Rivers run along a row of blocks (or a column): the water fills everything between the
// riverside street and the next block's, with a railed promenade along each bank, steps down to the water, and the
// crossing streets carried over on bridges (road deck at street level, railed pavements each side, water beneath).
// Returns false for road columns, which the normal street code then draws (on top of the water under a bridge).
function riverColumn(col,px,pz,rx,rz){
  const alongX=riverDir(px,pz)==='x';   // the river runs along x (a row); otherwise along z (a column)
  const a=alongX?rx:rz,c=alongX?rz:rx;   // a: along the river, c: across it
  if(rx<ROADW&&rz<ROADW)return false;     // intersections stay as they are
  if(c<ROADW)return false;                // the riverside drive
  const bank=c<ROADW+2||c>=CELL-2;
  // the water's surface is two blocks below the street; the stone bed is eleven blocks down
  const WL=G-2,RB=G-11,under=()=>{col(RB,STONE);for(let y=RB+1;y<G;y++)col(y,y<=WL?WATER:AIR);};
  // the cross streets at either end of the block: carried over on bridges where they're there (where they aren't --
  // at the edge of town -- the water just runs on)
  const nearOpen=alongX?segOpen(px,pz,0):segOpen(px,pz,1),farOpen=alongX?segOpen(px+1,pz,0):segOpen(px,pz+1,1);
  if(a<ROADW&&nearOpen){if(!bank)under();return false;}   // a street crossing on its bridge
  const bridgeSW=a>=ROADW&&a<ROADW+3&&nearOpen||a>=CELL-3&&farOpen;
  if(bank){col(G,SIDEWALK);if((c===ROADW+1||c===CELL-2)&&!bridgeSW&&!(c===ROADW+1&&(a===PC-1||a===PC)))col(G+1,METAL);return true;}   // a gap in the rail at the top of the steps
  if(bridgeSW){under();col(G,SIDEWALK);if(a===ROADW+2||a===CELL-3)col(G+1,METAL);return true;}
  col(RB,STONE);for(let y=RB+1;y<=G;y++)col(y,y<=WL?WATER:AIR);
  // steps down from the near bank to the riverbed, so you can climb back out
  const i=c-(ROADW+2);
  if((a===PC-1||a===PC)&&i>=0&&i<G-RB){for(let y=RB;y<G-i;y++)col(y,STONE);col(G-i,rampId(alongX?3:1,0));}
  return true;
}
function superColumn(a,col,S,x,z,lx,lz){
  const ux=x-S.ax*CELL,uz=z-S.az*CELL,ix1=(S.w-1)*CELL+PL1,iz1=(S.h-1)*CELL+PL1;
  if(ux<PL0||uz<PL0||ux>=ix1||uz>=iz1){col(G,SIDEWALK);return;}
  if(S.kind==='stadium'){stadiumCol(col,ux-PL0,uz-PL0,ix1-PL0,iz1-PL0,x,z);const L=lotAt(plotInfo(S.ax,S.az),ux,uz);if(L)col(G,lotMark(L,ux,uz)?lotLine(L):ASPHALT);return;}
  if(S.kind==='bigpark'){bigParkCol(col,ux-PL0,uz-PL0,ix1-PL0,iz1-PL0,x,z);return;}
  if(S.kind==='capitol'){capitolGround(col,ux-PL0,uz-PL0,x,z);const P=plotInfo(S.ax,S.az),b=P.b[0];{const L=lotAt(P,ux,uz);if(L)col(G,lotMark(L,ux,uz)?lotLine(L):ASPHALT);}if(b&&ux>=b.x0&&ux<b.x1&&uz>=b.z0&&uz<b.z1)buildingColumn(a,lx,lz,ux,uz,b,collapses[S.ax+','+S.az+',0'],S.ax,S.az);return;}
  const P=plotInfo(S.ax,S.az),B0=P.b[0];
  let gnd=CONCRETE;
  if(S.kind==='garage')gnd=ASPHALT;
  else if(S.kind==='hospital'&&S.w>=3&&uz>=B0.z0&&!P.b.some(q=>ux>=q.x0&&ux<q.x1&&uz>=q.z0&&uz<q.z1)){gnd=(Math.abs(ux-(B0.x0+B0.x1>>1))<=1||uz===B0.z1+3||uz===B0.z1+4)?SIDEWALK:GRASS;if(gnd===GRASS){col(G-1,DIRT);if(hash2(x*3+5,z*7+1)<0.012){for(let y=G+1;y<=G+3;y++)col(y,LOG);for(let y=G+4;y<=G+6;y++)col(y,LEAVES);}}}
  else if(S.kind==='hospital'&&uz<B0.z0){gnd=(uz===B0.z0-3&&ux%4<2)?CROSS:ASPHALT;if(uz===B0.z0-1&&ux>=B0.x0&&ux<B0.x1&&Math.abs(ux-((B0.x0+B0.x1)>>1))<=5)col(G+5,HOSPW);
    if(B0.er&&B0.er.mode==='front'&&Math.abs(ux-B0.er.door)<=4&&uz>=B0.z0-4){col(G+5,Math.abs(ux-B0.er.door)===4||uz===B0.z0-4?NEON_R:HOSPW);if(Math.abs(ux-B0.er.door)===4&&uz===B0.z0-4)for(let y=G+1;y<=G+4;y++)col(y,HOSPW);}}
  else if(S.kind==='school'&&S.w>=3&&uz<B0.z0){const cxs=(B0.x0+B0.x1)>>1;if(uz<PL0+7)gnd=(uz===PL0+6||(ux-PL0)%13===0&&uz<PL0+5)?LANE:ASPHALT;else if(Math.abs(ux-cxs)<=2)gnd=SIDEWALK;else{gnd=GRASS;col(G-1,DIRT);}}
  else if(S.kind==='school'&&S.w>=3&&uz>=B0.z0&&uz<B0.z1&&ux>=B0.x0&&ux<B0.x1)gnd=B0.floor;   // (indoors: tiles, not the lawn)
  else if(S.kind==='school'&&S.w>=3&&uz<P.school.pz0){gnd=GRASS;col(G-1,DIRT);}
  else if(S.kind==='hospital'&&S.w>=3&&uz>=B0.z0)gnd=FLOORT;   // (indoors)
  else if(S.kind==='mall'&&(ux+uz)%2)gnd=SIDEWALK;
  else if(S.kind==='factory')gnd=(ux+uz)%7===0?GRAVEL:ASPHALT;
  col(G,gnd);
  if(S.kind==='school'&&P.school)schoolYard(col,P,ux,uz,x,z);
  if(B5_GROUND[S.kind])B5_GROUND[S.kind](col,P,ux,uz,x,z);
  if(S.kind==='cinema'&&B0&&uz>=B0.z0-4&&uz<B0.z0&&Math.abs(ux-((B0.x0+B0.x1)>>1))<=12){   // the marquee: a lit canopy right across the doors
    const cxm=(B0.x0+B0.x1)>>1,e=uz===B0.z0-4||Math.abs(ux-cxm)===12;col(G+6,e?NEON_Y:METAL);if(uz===B0.z0-4){col(G+7,(ux+uz)%2?NEON_R:NEON_Y);col(G+8,PAINT_DARK);col(G+9,(ux+uz)%2?NEON_Y:NEON_R);}
    if(Math.abs(ux-cxm)===12&&uz===B0.z0-4)for(let y=G+1;y<=G+5;y++)col(y,METAL);}
  if(S.kind==='casino'&&B0&&uz>=B0.z0-4&&uz<B0.z0&&Math.abs(ux-((B0.x0+B0.x1)>>1))<=5){   // the gold canopy over the doors
    const e=uz===B0.z0-4||Math.abs(ux-((B0.x0+B0.x1)>>1))===5;col(G+6,e?NEON_Y:GOLD);if(e&&uz===B0.z0-4&&Math.abs(ux-((B0.x0+B0.x1)>>1))===5)for(let y=G+1;y<=G+5;y++)col(y,GOLD);}
  {const L=lotAt(P,ux,uz);if(L)col(G,lotMark(L,ux,uz)?lotLine(L):ASPHALT);}
  if(S.kind==='school'&&S.w>=3&&B0){const cxs=(B0.x0+B0.x1)>>1,du=Math.abs(ux-cxs);
    // the way in: a white canopy on posts over the front steps
    if(du<=4&&uz>=B0.z0-4&&uz<B0.z0){col(G+5,PAINT_WHITE);if(du===4&&uz===B0.z0-4)for(let y=G+1;y<=G+4;y++)col(y,PAINT_WHITE);}}
  for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(ux>=b.x0&&ux<b.x1&&uz>=b.z0&&uz<b.z1){if(roomFloor(b,uz))col(G,roomFloor(b,uz));buildingColumn(a,lx,lz,ux,uz,b,collapses[S.ax+','+S.az+','+bi],S.ax,S.az);
    // and on the roof, the school's little clock tower, standing over the entrance
    if(S.kind==='school'&&S.w>=3&&bi===0&&collapses[S.ax+','+S.az+',0']===undefined){const du=Math.abs(ux-((b.x0+b.x1)>>1)),dv=uz-b.z0;
      if(du<=3&&dv>=0&&dv<=6){const edge=du===3||dv===0||dv===6,T0=b.top+1;
        if(edge)for(let y=T0;y<=T0+6;y++)col(y,y-T0>=3&&y-T0<=5&&(dv===0||dv===6)&&du<=1?PAINT_WHITE:BRICK);
        col(T0+7,PAINT_RED);if(du<=2&&dv>=1&&dv<=5)col(T0+8,PAINT_RED);if(du<=1&&dv>=2&&dv<=4)col(T0+9,PAINT_RED);if(du===0&&dv===3)col(T0+10,METAL);}}
    break;}}
}
// ---- a huge city park (think Central Park): a stone wall with gates all round, a lake with a beach and a wooden
// footbridge, a reservoir with a running track, a fountain terrace, an open meadow, dense woods, and gravel paths:
// a loop just inside the wall plus two long winding ones ----
function bigParkGeo(W,L){
  const m=Math.min(W,L);
  return{lake:[W*0.6,L*0.42,W*0.16,L*0.11],res:[W*0.3,L*0.76,m*0.1],fount:[W*0.5,L*0.18,6],meadow:[W*0.12,L*0.26,W*0.42,L*0.56],woods:[W*0.66,L*0.6,m*0.16]};
}
function bigParkPath(u,v,W,L,wid){
  if((u>=5&&u<5+wid||u>=W-5-wid&&u<W-5||v>=5&&v<5+wid||v>=L-5-wid&&v<L-5)&&u>=5&&u<W-5&&v>=5&&v<L-5)return true;
  if(Math.abs(v-(L*0.5+Math.sin(u/14)*L*0.12))<wid*0.6)return true;
  if(Math.abs(u-(W*0.5+Math.sin(v/11)*W*0.15))<wid*0.6)return true;
  return false;
}
function bigParkCol(col,u,v,W,L,x,z){
  const g=bigParkGeo(W,L);col(G-1,DIRT);
  // the wall, with a gate every 32 blocks
  if(u===0||v===0||u===W-1||v===L-1){col(G,GRASS);const along=(u===0||u===W-1)?v:u;if(along%32>=3)col(G+1,MOSSSTONE);else col(G,GRAVEL);return;}
  const [lx,lz,lr,lq]=g.lake,le=((u-lx)/lr)**2+((v-lz)/lq)**2,path=bigParkPath(u,v,W,L,2);
  if(le<1){col(G,WATER);col(G-1,WATER);col(G-2,SAND);if(path){col(G,PLANKS);if(Math.abs(v-(L*0.5+Math.sin(u/14)*L*0.12))>0.6&&Math.abs(u-(W*0.5+Math.sin(v/11)*W*0.15))>0.6)col(G+1,LOG);}return;}
  if(le<1.15&&!path){col(G,SAND);return;}
  const [rx,rz,rr]=g.res,rd=Math.hypot(u-rx,v-rz);
  if(rd<rr){col(G,WATER);col(G-1,WATER);col(G-2,STONE);return;}
  if(rd<rr+1){col(G,STONE);col(G+1,STONE);return;}
  if(rd<rr+3){col(G,GRAVEL);return;}
  const [fx,fz,fr]=g.fount,fd=Math.hypot(u-fx,v-fz);
  if(fd<fr){col(G,fd<2.5?STONE:COBBLE);if(fd<2.5){col(G+1,fd<1.2?STONE:WATER);if(fd<1.2){col(G+2,STONE);col(G+3,WATER);}}return;}
  if(path){col(G,GRAVEL);return;}
  col(G,GRASS);
  // benches beside the paths, flowers in the beds
  if(bigParkPath(u,v,W,L,4)&&hash2(x*13+5,z*7+3)<0.03)col(G+1,PLANKS);
  else if(hash2(x*5+3,z*11+1)<0.03)col(G+1,FLOWER);
}
// should a tree grow here (park trees grow in the generic tree pass)?
function bigParkTree(u,v,W,L,x,z){
  if(u<3||v<3||u>W-4||v>L-4||(x+z)%2)return false;
  const g=bigParkGeo(W,L),[lx,lz,lr,lq]=g.lake;
  if(((u-lx)/lr)**2+((v-lz)/lq)**2<1.5)return false;
  const [rx,rz,rr]=g.res;if(Math.hypot(u-rx,v-rz)<rr+5)return false;
  const [fx,fz,fr]=g.fount;if(Math.hypot(u-fx,v-fz)<fr+3)return false;
  if(bigParkPath(u,v,W,L,6))return false;
  const [mx0,mz0,mx1,mz1]=g.meadow;if(u>mx0&&u<mx1&&v>mz0&&v<mz1)return false;
  const [wx,wz,wr]=g.woods,dense=Math.hypot(u-wx,v-wz)<wr;
  return hash2(x*3+1,z*7+5)<(dense?0.32:0.07);
}
// ---- the capitol: a great white domed building on a raised plinth at the back of its 4x6-block site, a pillared
// portico and broad steps in front, a long reflecting pool and lawn running up to it between formal gardens ----
// site coordinates: u across (0..113), v from the front (0) to the back (177)
const CAP={W:CELL*3+PW,L:CELL*5+PW};
function capGeo(){const W=CAP.W,L=CAP.L,c=W/2,bf=L-70;return{W,L,c,bf,back:L-10,px0:c-42,px1:c+42,pz0:bf-12,pz1:L-8,dc:bf+16};}
// a church's nave: long walls with tall stained-glass windows, a steep gable roof, pews either side of the aisle, the
// altar at the far end (big: bigger and taller); and a porch of columns with a pediment across the front of a
// grand building (its door in the middle)
function churchB(x0,z0,W,D,big,r){
  const wall=[STONE,MOSSSTONE,BRICK][Math.floor(r(85)*3)];
  const b={x0,x1:x0+W,z0,z1:z0+D,top:G+(big?11:8),style:'church',wall,win:STAINED,kind:'church',ground:'church',floor:PLANKS,door:2,tier:0,neon:0,ant:0,gf:FH,band:0,
    ridgeX:false,roof:Math.floor(W/2),trim:wall===BRICK?MARBLE:STONE,noIndoor:false,doorSpec:{w:1,h:4,k:'wood'}};
  b.detailTop=b.top;return b;
}
function portico(b,d,top,x0,x1){
  x0=x0===undefined?b.x0:x0;x1=x1===undefined?b.x1:x1;
  b.porTop=top+Math.min(4,Math.floor((x1-x0)/2));
  const p={x0,x1,z0:b.z0-d,z1:b.z0,top:top+Math.min(4,Math.floor((b.x1-b.x0)/2)),pTop:top,style:'portico',wall:MARBLE,win:MARBLE,kind:'landmark',ground:'landmark',floor:MARBLE,door:2,tier:0,neon:0,ant:0,gf:FH,band:0,roof:0,noIndoor:true,doorSpec:null,farSkip:false};
  p.top=top+Math.min(4,Math.floor((x1-x0)/2));p.detailTop=p.top;b.porch=p;return p;
}
