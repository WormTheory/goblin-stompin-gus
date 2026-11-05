// ---- landmarks: water towers, clock and bell towers, statues and obelisks ----
function monument(kind,r){
  const b={x0:PC-2,x1:PC+2,z0:PC-2,z1:PC+2,top:G+(kind==='statue'?13:19),style:kind,wall:MARBLE,win:MARBLE,kind:'landmark',ground:'landmark',floor:MARBLE,door:2,tier:0,neon:0,ant:0,gf:FH,band:0,roof:0,farSkip:true,noIndoor:true,doorSpec:null};
  b.detailTop=b.top;b.pose=Math.floor(r(97)*3);return b;
}
function wtowerAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G,d=Math.hypot(u-4,v-4);
  if((u===1||u===7)&&(v===1||v===7)&&fl<=16){STRUCT=true;return METAL;}               // the four legs
  if(u===4&&v===4&&fl<=16){STRUCT=true;return METAL;}                                // the riser pipe up the middle
  if(fl===8&&((v===1||v===7)&&u>=1&&u<=7||(u===1||u===7)&&v>=1&&v<=7)){STRUCT=true;return METAL;}   // bracing
  if(fl===17&&d<=3.7){STRUCT=true;return b.wall;}                                    // the tank's floor...
  if(fl>=18&&fl<=23&&d<=4.4&&d>3.35){STRUCT=true;return b.wall;}                     // ...its round wall...
  if(fl===24&&d<=4.0||fl===25&&d<=2.9||fl===26&&d<=1.6){STRUCT=true;return b.wall;}  // ...and its pointed lid
  if(fl===27&&d<0.8)return METAL;
  return AIR;
}
function towerAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,edge=u===0||u===W-1||v===0||v===D-1,corner=(u===0||u===W-1)&&(v===0||v===D-1);
  const clock=b.style==='ctower',shaft=clock?20:17,cx=(b.x0+b.x1)>>1;
  // the door at the foot, on the front
  if(edge&&v===0&&rx===cx&&fl<=3)return fl===2?DOOR_WK:DOOR_W;
  if(fl<=shaft){
    if(!edge)return fl%6===0&&fl>0?b.floor:AIR;
    STRUCT=true;if(corner)return b.trim;
    // tall slit windows up the middle of each face
    const mid=(u===0||u===W-1)?(v===2||v===3):(u===2||u===3);if(mid&&fl>4&&fl%6>=2&&fl%6<=4)return b.win;
    return b.wall;}
  if(fl===shaft+1){STRUCT=true;return b.trim;}   // a cornice
  if(clock){
    if(fl<=shaft+5){if(!edge)return AIR;STRUCT=true;if(corner)return b.trim;return MARBLE;}   // the clock stage (the dials go on its faces)
    if(fl===shaft+6){STRUCT=true;return b.trim;}
    const k=fl-(shaft+6),inset=k;   // a stepped spire
    if(u>=inset&&u<W-inset&&v>=inset&&v<D-inset&&inset<3){STRUCT=true;return k===2?METAL:SHINGLE;}
    if(k===3&&(u===2||u===3)&&(v===2||v===3))return METAL;
    return AIR;}
  // the belfry: open arches on every side between corner piers, the bell hanging inside (drawn separately)
  if(fl<=shaft+5){if(corner){STRUCT=true;return b.trim;}if(edge&&fl===shaft+5){STRUCT=true;return b.wall;}return AIR;}
  if(fl===shaft+6){STRUCT=true;return b.trim;}
  const k=fl-(shaft+6);
  if(u>=k&&u<W-k&&v>=k&&v<D-k&&k<3){STRUCT=true;return ROOF;}
  return AIR;
}
// a statue: a goblin hero in bronze on a marble plinth, sword raised (or pointing the way, or hands on hips); an
// obelisk: a tall marble needle on a stepped base
function statueAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G;
  if(fl<=3){STRUCT=true;return MARBLE;}   // the plinth
  // the figure: 2 blocks wide (u 1..2), facing -z
  const f=fl-3,P=b.pose,body=(u===1||u===2)&&(v===1||v===2);
  if(f<=2)return(u===1||u===2)&&v===2?BRONZE:AIR;                       // legs
  if(f<=5&&body)return BRONZE;                                           // body
  if(f<=7&&body)return BRONZE;                                           // head
  if(f===7&&(u===0||u===3)&&v===2)return BRONZE;                         // big ears
  if(P===0){if(u===0&&v===2&&(f===4||f===5))return BRONZE;                // left arm down; right arm raised, sword up
    if(u===3&&v===1&&f>=4&&f<=7)return BRONZE;if(u===3&&v===1&&f>=8&&f<=10)return METAL;return AIR;}
  if(P===1){if(u===0&&v===2&&(f===4||f===5))return BRONZE;if(u===3&&f===5&&(v===1||v===0))return BRONZE;return AIR;}   // pointing the way
  if((u===0||u===3)&&v===2&&f===4)return BRONZE;                         // hands on hips
  return AIR;
}
// what time and neglect have done to a building: windows boarded or smashed, holes knocked in its walls, roof and
// floors, its doorway boarded up, the signs dead, most of what was inside gone
function decayB(b,v,rx,rz,y,px,pz){
  if(v===AIR)return AIR;
  const h=hash2(px*977+rx*31+y*7+5,pz*613+rz*17+y*3+9),st=STRUCT;
  if(BLOCK[v]&&BLOCK[v].door)return PLANKS;
  if(v===GLASS||v===WIN_WARM||v===WIN_BLUE||v===WIN_GREEN){if(y<=G+FH||h<0.55)return PLANKS;if(h<0.85){STRUCT=false;return AIR;}return GLASS;}
  if(KIND[v]==='neon'||v===LAMP){STRUCT=false;return h<0.5?RUST:AIR;}
  if(st){if(y===b.top&&v===ROOF&&h<0.3||h<0.06&&y>G+1){STRUCT=false;return AIR;}if(v===b.floor&&h<0.12){STRUCT=false;return AIR;}return v;}
  if(h<0.7)return AIR;
  return h<0.85?CRATE:GRAVEL;
}
// an armory's corner turret: round(ish), slit windows, battlements round the top
function turretAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G,cut=(u===0||u===4)&&(v===0||v===4),edge=u===0||u===4||v===0||v===4;
  if(cut)return AIR;
  if(y===b.top)return edge&&(u+v)%2===1?(STRUCT=true,b.wall):AIR;
  if(y===b.top-1){STRUCT=true;return b.wall;}
  if(!edge)return AIR;
  STRUCT=true;return(u===2||v===2)&&fl%5===3?b.win:b.wall;
}
// a glasshouse: glass walls and a glass pitched roof on a metal frame, benches of plants inside
function greenAt(b,rx,rz,y){
  STRUCT=false;const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,edge=u===0||u===W-1||v===0||v===D-1,cz=(b.z0+b.z1)>>1;
  if(fl<=4){
    if(edge){if(u===0&&rz===cz&&fl<=3)return fl===2?DOOR_GB:DOOR_G;STRUCT=true;return(u+v)%4===0||fl===4?METAL:GLASS;}
    if(fl===1&&(v===2||v===D-3)&&u>=2&&u<=W-3)return PLANKS;
    if(fl===2&&(v===2||v===D-3)&&u>=2&&u<=W-3)return(u%2)?LEAVES:FLOWER;
    return AIR;}
  const k=fl-4,d=Math.min(u,W-1-u);   // the roof's two slopes, glazed
  if(d===k-1){STRUCT=true;return k%2?GLASS:METAL;}
  if(d>k-1&&(v===0||v===D-1))return GLASS;
  return AIR;
}
function churchAt(b,rx,rz,y){
  if(y>b.top)return houseRoof(b,rx,rz,y);
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,cx=(b.x0+b.x1)>>1,edge=u===0||u===W-1||v===0||v===D-1,corner=(u===0||u===W-1)&&(v===0||v===D-1),H=b.top-G;
  if(edge){
    if(v===0&&Math.abs(rx-cx)<=1&&fl<=4)return fl===2?DOOR_WK:DOOR_W;           // the double doors
    if(fl===H){STRUCT=true;return b.trim;}
    STRUCT=true;if(corner)return b.trim;
    if((u===0||u===W-1)&&v%3===1&&v>0&&v<D-1&&fl>=3&&fl<=H-2)return b.win;       // tall coloured windows down the sides
    if((v===0||v===D-1)&&Math.abs(rx-cx)<=(fl===H-2?1:0)&&fl>=H-3&&fl<=H-1)return b.win;   // a round window high in each end
    return b.wall;}
  if(fl===H)return AIR;
  const iu=rx-cx;
  // the altar on a step at the far end, a gold cross behind it, candles
  if(v>=D-3){if(fl===1&&v<=D-2&&Math.abs(iu)<=W/2-1)return MARBLE;if(fl===2&&v===D-3&&Math.abs(iu)<=1)return iu?LAMP:MARBLE;
    if(v===D-2&&iu===0&&fl>=4&&fl<=7)return GOLD;if(v===D-2&&Math.abs(iu)===1&&fl===6)return GOLD;return AIR;}
  return AIR;   // (the pews are props: see venueRoom)
}
function steepleAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,fl=y-G,S=b.shaft,edge=u===0||u===W-1||v===0||v===W-1,corner=(u===0||u===W-1)&&(v===0||v===W-1);
  if(fl<=S){if(!edge)return AIR;STRUCT=true;if(corner)return b.trim;return(u===W>>1||v===W>>1)&&fl>4&&fl%5>=2&&fl%5<=3?b.win:b.wall;}
  if(fl<=S+3){if(corner){STRUCT=true;return b.trim;}return AIR;}   // the open belfry
  if(fl===S+4){STRUCT=true;return b.trim;}
  // the spire, narrowing to a point, a cross on the top
  const k=fl-(S+4),c=(W-1)/2,lim=Math.max(0,c-Math.floor(k/3));
  if(Math.abs(u-c)<=lim+0.01&&Math.abs(v-c)<=lim+0.01&&k<=3*Math.ceil(c)+2){STRUCT=true;return SHINGLE;}
  const top=3*Math.ceil(c)+3;
  if(Math.abs(u-c)<0.6&&Math.abs(v-c)<0.6&&k>=top&&k<=top+3)return METAL;
  if(Math.abs(v-c)<0.6&&Math.abs(u-c)<1.6&&k===top+2)return METAL;
  return AIR;
}
function porticoAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,fl=y-G,pt=b.pTop-G,cx=(W-1)/2;
  if(fl<pt){if(v===0&&u%2===0&&Math.abs(u-cx)>1.6){STRUCT=true;return MARBLE;}return AIR;}   // the columns (a gap at the door)
  if(fl===pt){STRUCT=true;return MARBLE;}                                                     // the beam across the top
  const k=fl-pt;if(v===0&&Math.abs(u-cx)<=cx-k*2+0.01){STRUCT=true;return MARBLE;}           // the pediment
  return AIR;
}
function mastAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G,corner=(u===0||u===2)&&(v===0||v===2),band=Math.floor(fl/5)%2?b.win:b.wall;
  if(fl===b.top-G)return u===1&&v===1?NEON_R:AIR;
  if(corner){STRUCT=true;return band;}
  if(fl%5===0&&(u!==1||v!==1)){STRUCT=true;return band;}   // bracing rings
  return AIR;
}
// a cathedral: worked out in its own frame -- a along it from the great doors, c across it
function cathedralAt(b,rx,rz,y){
  const a=b.alongX?rx-b.x0:rz-b.z0,c=b.alongX?rz-b.z0:rx-b.x0,Lw=b.alongX?b.x1-b.x0:b.z1-b.z0,Cw=b.alongX?b.z1-b.z0:b.x1-b.x0,fl=y-G;
  const HA=11,HN=22,HT=34,nc0=3,nc1=Cw-4,mid=(Cw-1)/2;
  // the twin towers at the front corners
  const inT=a<6&&(c<5||c>=Cw-5);
  if(inT){const t0=c<5?0:Cw-5,tu=c-t0,edge=a===0||a===5||tu===0||tu===4;
    if(fl>HT){const cor=(a===0||a===5)&&(tu===0||tu===4);if(cor&&fl<=HT+3){STRUCT=true;return b.trim;}if(fl===HT+1&&edge&&(a+tu)%2===0){STRUCT=true;return b.trim;}return AIR;}
    if(fl===HT||fl===HA||fl===HN){STRUCT=true;return b.trim;}
    if(!edge)return AIR;
    STRUCT=true;
    if((a===2||a===3||tu===2)&&fl>HT-7&&fl<HT-1&&!(tu===0&&c<5&&false))return AIR;   // the belfry openings
    if((a===2||a===3||tu===2)&&fl>4&&fl%7>=3&&fl%7<=5)return b.win;
    return b.wall;}
  if(fl>HN+6)return AIR;
  // the roofs: the nave's steep gable, the aisles' lean-to slabs
  if(fl>HN){const k=fl-HN,d=Math.min(c-nc0,nc1-c);if(c<nc0||c>nc1)return AIR;if(d===k-1){STRUCT=true;return SHINGLE;}if(d>k-1&&(a===0||a===Lw-1)){STRUCT=true;return b.wall;}if(d>k-1&&k===6){STRUCT=true;return SHINGLE;}return AIR;}
  if(fl===HN&&c>=nc0&&c<=nc1){STRUCT=true;return(c===nc0||c===nc1)?b.trim:AIR;}
  if((c<nc0||c>nc1)&&fl>HA)return AIR;
  if((c<nc0||c>nc1)&&fl===HA){STRUCT=true;return ROOF;}
  // the front: the great doors, the rose window over them
  if(a===0){STRUCT=true;if(Math.abs(c-(Cw>>1))<=1&&fl<=5)return fl===2?DOOR_WK:DOOR_W;
    const rd=Math.hypot(c-mid,fl-16);if(rd<=3.2)return rd<1?GOLD:b.win;return b.wall;}
  if(a===Lw-1){STRUCT=true;if(Math.abs(c-mid)<=1&&fl>=6&&fl<=HN-3)return b.win;return b.wall;}
  // the outer walls of the aisles, their windows
  if(c===0||c===Cw-1){STRUCT=true;if(a%4===2&&fl>=3&&fl<=HA-2)return b.win;return b.wall;}
  // the arcades: piers every third block up to the aisle roof, the clerestory wall and its windows above
  if(c===nc0||c===nc1){
    if(fl<HA){if(a%3===0){STRUCT=true;return b.trim;}if(fl>=HA-2){STRUCT=true;return b.wall;}return AIR;}
    STRUCT=true;if(a%3===2&&fl>=HA+2&&fl<=HN-2)return b.win;return b.wall;}
  // inside: pews down the nave, the choir stalls, the altar and a gold cross
  if(c>nc0&&c<nc1){
    if(a>=Lw-4){if(fl===1&&a<=Lw-3&&Math.abs(c-mid)<=2)return MARBLE;if(a===Lw-2&&Math.abs(c-mid)<1&&fl>=6&&fl<=11)return GOLD;if(a===Lw-2&&Math.abs(c-mid)<2.6&&Math.abs(c-mid)>=1&&fl===9)return GOLD;return AIR;}
    if(a>=Lw-11&&a<Lw-5)return AIR;
    }
  return AIR;
}
// round things in a factory yard: a smokestack (brick, banded, hollow), a silo (tall, a cone on top), a tank (squat)
function roundAt(b,rx,rz,y){
  const W=b.x1-b.x0,u=rx-b.x0,v=rz-b.z0,c=(W-1)/2,d=Math.hypot(u-c,v-c),fl=y-G,H=b.top-G;STRUCT=true;
  if(b.style==='stack'){if(u===1&&v===1)return AIR;return fl%8===0?b.win:b.wall;}
  if(b.style==='silo'){if(fl<=H-2)return d<=2.45&&d>1.45?b.wall:AIR;if(fl===H-1)return d<=2.0?b.wall:AIR;return d<0.8?METAL:AIR;}
  if(fl<H)return d<=2.45&&d>1.45?b.wall:AIR;return d<=2.45?METAL:AIR;
}
// a data centre: a windowless concrete bunker with vents, a steel door, rows of server racks (their lights blinking),
// cooling units up on the roof
function dcAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,edge=u===0||u===W-1||v===0||v===D-1,cx=(b.x0+b.x1)>>1;
  if(fl>=9){if(u>=2&&u<W-2&&v>=2&&v<D-2&&(u-2)%5<3&&(v-2)%5<3){if(fl===9){STRUCT=false;return METAL;}if(fl===10)return(u-2)%5===1&&(v-2)%5===1?PAINT_DARK:METAL;}return AIR;}
  if(fl===8){STRUCT=true;return CONCRETE;}
  if(edge){if(v===0&&rx===cx&&fl<=3)return fl===2?DOOR_GB:DOOR_G;STRUCT=true;return fl===6&&(u+v)%3===0?METAL:b.wall;}
  if(v%3===2&&u>=2&&u<W-2&&fl<=5&&u!==((W-1)>>1))return(fl===2||fl===4)&&(u+v)%2?(u%3?NEON_G:NEON_B):PAINT_DARK;
  return AIR;
}
// an electricity pylon in a substation: a lattice tower with a crossarm at the top
function pylonAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,fl=y-G,H=b.top-G,c=(W-1)/2;STRUCT=true;
  if(fl>=H-1){if(v===1&&fl===H-1)return METAL;if(v===1&&fl===H&&(u===0||u===W-1||u===c))return METAL;return AIR;}
  if(Math.abs(u-c)<=1&&(v===0||v===2)&&Math.abs(u-c)===1)return METAL;
  if(Math.abs(u-c)<=1&&fl%4===0&&(v===0||v===2||Math.abs(u-c)===1))return METAL;
  STRUCT=false;return AIR;
}
// an indoor arena: a round bowl -- the outer wall (a band of glass round the concourse), the dome over it, the tiers of
// seats rising from the court's edge to the back, entrances at the four points of the compass
const arenaWC=R=>({v0:Math.floor(R-10),v1:Math.floor(R-6)});
function arenaAt(b,rx,rz,y){
  const W=b.x1-b.x0,c=(W-1)/2,u=rx-b.x0-c,v=rz-b.z0-c,d=Math.hypot(u,v),fl=y-G,R=c-0.3,wallH=22;
  if(d>R+0.5)return AIR;
  // the dome
  if(fl>wallH){const dd=Math.hypot(d,(fl-wallH)*1.7);if(dd<=R+0.5&&dd>R-0.9){STRUCT=true;return(Math.floor(Math.atan2(v,u)*8/Math.PI)+8)%2&&fl-wallH<8?PAINT_WHITE:b.wall;}return AIR;}
  // the outer wall: glass round the concourse level, doors at the four points
  if(d>R-0.9){STRUCT=true;const ent=(Math.abs(u)<1.6||Math.abs(v)<1.6);if(ent&&fl<=4)return Math.abs(u)<1.6&&v<0?(fl===2?DOOR_GB:DOOR_G):AIR;if(fl>=2&&fl<=5||fl>=14&&fl<=16)return b.win;return b.wall;}
  // the court in the middle (rectangular), the seats stepping up from its edge
  const cu=13,cv=8,inC=Math.abs(u)<=cu&&Math.abs(v)<=cv;
  if(inC){if(fl===1){const line=Math.abs(u)>cu-0.6||Math.abs(v)>cv-0.6||Math.abs(u)<0.6||Math.abs(Math.hypot(u,v)-2.5)<0.5;return line?COURT_L:COURT;}
    if(fl>=2&&fl<=4&&Math.abs(Math.abs(u)-(cu-1))<0.6&&Math.abs(v)<0.6)return METAL;if(fl===5&&Math.abs(Math.abs(u)-(cu-1.5))<1&&Math.abs(v)<1.2)return PAINT_WHITE;return AIR;}
  const e=Math.max(Math.abs(u)-cu,Math.abs(v)-cv)*0.75+Math.max(0,d-Math.hypot(cu,cv))*0.25,row=Math.floor(e),lvl=Math.min(18,Math.floor(row*0.85));
  // (a block of toilets let into the stands at each end, its door on the concourse. On this side of each end there's no concession stand.)
  {const G2=arenaWC(R),hu=Math.abs(u),hv=Math.abs(v);if(u*v>0&&d<=R-4&&hu>=3&&hu<9&&hv>=G2.v0){
    if(hv<G2.v1){if(fl===1)return CONCRETE;if(fl===5){STRUCT=true;return CONCRETE;}if(fl<5){const wall=hu<4||hu>=8||hv<G2.v0+1||hv>=G2.v1-1;if(!wall)return AIR;if(hv>=G2.v1-1&&Math.floor(hu)===6)return fl===3?DOOR_WK:DOOR_W;STRUCT=true;return b.wall===GLASS?CONCRETE:b.wall;}}
    else if(Math.abs(hu-6)<1.1){if(fl===1)return CONCRETE;if(fl<=4)return AIR;if(fl===5){STRUCT=true;return CONCRETE;}}}}
  if(d>R-4){if(fl===1)return CONCRETE;if(fl<=lvl-1&&fl>4)return CONCRETE;if(fl===2&&Math.floor(Math.atan2(v,u)*6/Math.PI)%3===0&&d<R-2.5)return PLANKS;return AIR;}   // the concourse round the back, the concession stands
  const tunnel=Math.abs(u)<1.6||Math.abs(v)<1.6;
  if(tunnel&&fl<=4)return fl===1?CONCRETE:AIR;
  if(fl<=lvl){STRUCT=fl===lvl;return CONCRETE;}
  if(fl===lvl+1)return row%2?SEAT_R:SEAT_B;
  return AIR;
}
// a prison guard tower: a concrete shaft, a glazed cabin on top under a flat roof with a searchlight
function gtowerAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G,H=b.top-G,edge=u===0||u===3||v===0||v===3;STRUCT=true;
  if(fl<=H-5)return(u===1||u===2)&&(v===1||v===2)?CONCRETE:AIR;
  if(fl===H-4)return CONCRETE;
  if(fl<H){if(!edge)return AIR;return(u===0||u===3)&&(v===0||v===3)?METAL:GLASS;}
  return(u===1&&v===1)?LAMP:CONCRETE;
}
// a power station's cooling tower: a great concrete hyperboloid, waisted, open at the top
function coolingAt(b,rx,rz,y){
  const W=b.x1-b.x0,c=(W-1)/2,d=Math.hypot(rx-b.x0-c,rz-b.z0-c),fl=y-G,H=b.top-G,t=fl/H,R=c*(1-0.3*Math.sin(Math.min(1,t/0.75)*Math.PI/2))+(t>0.75?(t-0.75)*c*0.6:0);
  if(fl<=2&&d<=c+0.3&&(Math.floor(Math.atan2(rz-b.z0-c,rx-b.x0-c)*10/Math.PI)+20)%2===0&&d>R-1.2){STRUCT=true;return CONCRETE;}   // the legs at its foot
  if(fl<=2)return AIR;
  if(d<=R+0.5&&d>R-0.6){STRUCT=true;return CONCRETE;}
  return AIR;
}
// a false front on a film studio's backlot: just the street face of a building, propped up with scaffolding behind
function facadeAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,fl=y-G,H=b.top-G;
  if(v===0){STRUCT=true;if(fl===H)return b.trim||MOSSSTONE;if(fl<=3&&u===(W>>1))return AIR;if(fl%5>=2&&fl%5<=3&&u%2===1)return b.win;return b.wall;}
  if((u===0||u===W-1)&&fl%3===0)return METAL;if((u===0||u===W-1))return fl<=H?METAL:AIR;
  return AIR;
}
// a film studio's gate: two piers and a great arch between them, the studio's name across it
function gateAt(b,rx,rz,y){
  const u=rx-b.x0,W=b.x1-b.x0,fl=y-G,H=b.top-G;STRUCT=true;
  if(u<=1||u>=W-2)return fl<H?b.wall:MARBLE;
  const a=Math.abs(u-(W-1)/2),arch=H-3-Math.round(Math.sqrt(Math.max(0,((W-4)/2)**2-a*a))*0.5);
  if(fl>=arch)return fl>=H-1?MARBLE:b.wall;
  return AIR;
}
// a mausoleum: a marble tomb house, columns along its front, a pediment, heavy doors; the floor open at the back where
// the stair goes down to the crypt
function mausoleumAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,cx=(b.x0+b.x1)>>1;STRUCT=true;
  if(fl>=7){const k=fl-6,d=Math.min(u,W-1-u);return d>=k-1&&(v===0||k===1)?MARBLE:(k===1?MARBLE:AIR);}
  if(fl===6)return MARBLE;
  if(v===0){if(u%2===0)return MARBLE;STRUCT=false;return AIR;}   // the colonnade
  if(v===1){if(Math.abs(rx-cx)<=1&&fl<=4)return fl===2?DOOR_WK:DOOR_W;return fl===5?MARBLE:(Math.abs(rx-cx)===2&&fl<=4?STONE:MARBLE);}
  if(u===0||u===W-1||v===D-1)return fl===3&&v%3===1?GLASS:MARBLE;
  STRUCT=false;return AIR;
}
// a nuclear reactor's containment building: a squat concrete cylinder with a dome
function containAt(b,rx,rz,y){
  const W=b.x1-b.x0,c=(W-1)/2,d=Math.hypot(rx-b.x0-c,rz-b.z0-c),fl=y-G,R=c+0.2,wallH=b.top-G-Math.round(R);
  if(fl<=wallH){if(d<=R&&d>R-1.1){STRUCT=true;return fl===3&&rz===b.z0&&Math.abs(rx-b.x0-c)<1.2?DOOR_W:(fl%6===0?METAL:PAINT_WHITE);}return AIR;}
  const dd=Math.hypot(d,fl-wallH);if(dd<=R&&dd>R-1.1){STRUCT=true;return PAINT_WHITE;}return AIR;
}
// a hangar: a half-barrel of corrugated metal over a wide floor, its front end open
function hangarAt(b,rx,rz,y){
  const W=b.x1-b.x0,c=(W-1)/2,u=rx-b.x0-c,v=rz-b.z0,D=b.z1-b.z0,fl=y-G,R=c+0.3,d=Math.hypot(u,fl*0.95);
  if(d>R)return AIR;
  if(d>R-1.1){STRUCT=true;return(v===0&&fl<R-2&&Math.abs(u)<R-1.5)?AIR:b.wall;}
  if(v===D-1){STRUCT=true;return fl%4===2&&Math.abs(u)<2?GLASS:b.wall;}
  return AIR;
}
// an airport's control tower: a slim shaft, the glass cab at the top under its roof, an aerial
function ctrlAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,fl=y-G,H=b.top-G,edge=u===0||u===W-1||v===0||v===W-1,mid=(W-1)/2;STRUCT=true;
  if(fl<H-6)return Math.abs(u-mid)<=1&&Math.abs(v-mid)<=1&&(Math.abs(u-mid)===1||Math.abs(v-mid)===1)?(fl%5===0?GLASS:b.wall):(Math.abs(u-mid)<1&&Math.abs(v-mid)<1?AIR:AIR);
  if(fl===H-6)return CONCRETE;
  if(fl<H-1)return edge?(fl===H-2?METAL:GLASS):AIR;
  if(fl===H-1)return CONCRETE;
  return u===mid&&v===mid?METAL:AIR;
}
function obeliskAt(b,rx,rz,y){
  const u=rx-b.x0,v=rz-b.z0,fl=y-G;STRUCT=true;
  if(fl===1)return MARBLE;
  if(fl===2)return u>0&&u<3||v>0&&v<3?MARBLE:(u>0&&u<3&&v>0&&v<3?MARBLE:AIR);
  if(fl<=18)return(u===1||u===2)&&(v===1||v===2)?MARBLE:AIR;
  if(fl===19)return(u===1||u===2)&&(v===1||v===2)?(u+v)%2?METAL:MARBLE:AIR;
  return AIR;
}
// the capitol's floors, laid out as a real one is: the rotunda in the middle, a chamber in each wing (the Senate to the west,
// the House to the east) two storeys high with a public gallery round it, and offices, hearing rooms and the rest around those.
// (s is the side, 0 west and 1 east; a how far out from the middle, w how far back from the front wall. Either side is the same plan.)
const capCell=(s,a,w)=>(s*42+a)*60+w;
const capChamber=(a,w)=>a>=20&&a<=38&&w>=20&&w<=45;
const capGal=(a,w)=>capChamber(a,w)&&w<=40&&(a<=23||a>=35||w<=23);   // (the gallery, round three sides: none over the rostrum)
const capRail=(a,w)=>capGal(a,w)&&(a===23&&w>=23||a===35&&w>=23||w===23&&a>=23&&a<=35||w===40);
let CAP_PLAN=null;
function capPlan(){
  if(CAP_PLAN)return CAP_PLAN;
  const F=[0,1,2,3].map(()=>new Uint8Array(84*60)),doors=[];   // (1 a wall, 2 a door, 3 an open archway)
  const set=(n,s,a,w,k)=>{F[n][capCell(s,a,w)]=k;};
  // (the walls round a room: a0 below 0 runs on across the middle of the building, so no wall there)
  const room=(n,s,a0,a1,w0,w1)=>{for(let a=Math.max(0,a0);a<=a1;a++){set(n,s,a,w0,1);set(n,s,a,w1,1);}for(let w=w0;w<=w1;w++){if(a0>=0)set(n,s,a0,w,1);set(n,s,a1,w,1);}};
  // (w the width either side of the middle: 0 for a single door, 1 for a double one three wide)
  const door=(n,s,a,w,ax,wd)=>{wd=wd||0;for(let i=-wd;i<=wd;i++)if(ax==='x')set(n,s,a+i,w,2);else set(n,s,a,w+i,2);doors.push({n,s,a,w,ax,wd});};
  for(let s=0;s<2;s++){
    for(let n=0;n<4;n++){
      // the front of each wing: a big room towards the middle, a narrow one at the end, the stair hall between them (doors on to the main corridor)
      room(n,s,15,24,0,14);door(n,s,20,14,'x');
      room(n,s,34,39,0,14);door(n,s,36,14,'x');
      // the back of each wing, behind the corridor that runs across behind the chamber
      room(n,s,25,39,51,59);door(n,s,32,51,'x');
      if(n%2===0){room(n,s,20,25,54,59);door(n,s,23,54,'x');}   // (a bathroom every other floor)
      else{room(n,s,15,25,51,59);door(n,s,20,51,'x');}
      // the back of the middle of the building
      room(n,s,-1,15,31,59);
    }
    // the chamber, through two floors: the great doors off the corridor, a door by the rostrum, and upstairs a door on to its gallery
    room(0,s,19,39,19,46);room(1,s,19,39,19,46);door(0,s,29,19,'x',1);door(0,s,19,42,'z');door(1,s,29,19,'x',1);
    // above it, a hearing room and a caucus room...
    room(2,s,19,39,19,34);room(2,s,19,39,34,46);door(2,s,29,19,'x',1);door(2,s,19,40,'z');
    // ...and above those, members' suites: an outer office off the corridor, the member's own room through it
    for(const [w0,w1] of [[19,28],[28,37],[37,46]]){const m=(w0+w1)>>1;room(3,s,19,29,w0,w1);room(3,s,29,39,w0,w1);door(3,s,19,m,'z');door(3,s,29,m,'z');}
    // the back of the middle: the statuary hall and the courtroom, the library, the dining room and kitchen, the archive and the police
    for(let a=0;a<15;a++){set(0,s,a,44,a<2?3:1);set(2,s,a,47,1);set(3,s,a,45,1);}
    door(0,s,15,38,'z');door(0,s,15,52,'z');door(1,s,15,36,'z');door(1,s,15,54,'z');door(2,s,15,40,'z');door(3,s,15,38,'z');door(3,s,15,52,'z');
  }
  door(2,0,1,47,'x');   // (the kitchen's, on one side only)
  return CAP_PLAN={F,doors};
}
// which way to go on storey n for a goblin with no route map to go by: how many steps each spot is from the target spot, a map for each
// target (filled in once: there are only so many rooms to be heading for). -1 is somewhere that can't be walked.
const CAP_FIELD=new Map();
function capField(n,s0,a0,w0,B,x0,z0){
  const key=n+':'+capCell(s0,a0,w0);let D=CAP_FIELD.get(key);if(D)return D;
  if(CAP_FIELD.size>64)CAP_FIELD.clear();D=new Int16Array(84*60).fill(-1);CAP_FIELD.set(key,D);
  // (and round the furniture, which a goblin can't walk through)
  const blocked=new Set();for(const f of roomProps(B.b,B.px,B.pz,n)){if(f.low)continue;const u=Math.floor(f.x-x0),a=u<0?-u-1:u,s=u<0?0:1;blocked.add(capCell(s,a,Math.floor(f.z-z0)));}
  const F=capPlan().F[n],open=(s,a,w)=>{if(a<0||a>38||w<1||w>58)return false;
    if(a<=15&&w<=31){if(n)return false;if(a===15)return w>=15&&w<=17;if(w===31)return a<3;return true;}   // (the rotunda, only on the ground floor)
    return F[capCell(s,a,w)]!==1&&!blocked.has(capCell(s,a,w));};
  if(!open(s0,a0,w0))return D;
  const q=[capCell(s0,a0,w0)];D[q[0]]=0;
  for(let i=0;i<q.length;i++){const k=q[i],w=k%60,sa=(k-w)/60,s=sa>=42?1:0,a=sa-s*42,d=D[k]+1;
    for(const [s2,a2,w2] of [[s,a+1,w],[s,a-1,w],[s,a,w+1],[s,a,w-1]]){const S=a2<0?1-s2:s2,A=a2<0?0:a2;if(!open(S,A,w2))continue;const c=capCell(S,A,w2);if(D[c]<0){D[c]=d;q.push(c);}}}
  return D;
}
function capStep(g,B,tx,tz){
  const q=capGeo(),x0=B.px*CELL+PL0+q.c,z0=B.pz*CELL+PL0+q.bf,n=Math.floor((g.pos.y-G-4)/FH);if(n<0||n>3)return null;
  const cell=(x,z)=>{const u=Math.floor(x-x0),s=u<0?0:1,a=u<0?-u-1:u,w=Math.floor(z-z0);return a>=0&&a<=38&&w>=1&&w<=58?[s,a,w]:null;};
  const A=cell(g.pos.x,g.pos.z),T=cell(tx,tz);if(!A||!T)return null;
  const D=capField(n,T[0],T[1],T[2],B,x0,z0),d=D[capCell(A[0],A[1],A[2])];if(d<3)return null;
  let best=null,bd=d;for(const [s,a,w] of [[A[0],A[1]+1,A[2]],[A[0],A[1]-1,A[2]],[A[0],A[1],A[2]+1],[A[0],A[1],A[2]-1]]){const S=a<0?1-s:s,Aa=a<0?0:a;if(Aa>38||w<1||w>58)continue;const e=D[capCell(S,Aa,w)];if(e>=0&&e<bd){bd=e;best=[S,Aa,w];}}
  return best&&{x:x0+(best[0]?best[1]+.5:-best[1]-.5),z:z0+best[2]+.5};
}
// what the floor of storey n is made of: carpet in the chambers and the grandest rooms, marble in the public halls, wood where people sit
function capFloor(n,s,a,w){
  if(n<2&&capChamber(a,w))return s?PAINT_GREEN:PAINT_RED;
  if(a<15&&w>=32)return n===0?(w<44?MARBLE:PLANKS):n===1?PLANKS:n===2?(w<47?PLANKS:FLOORT):w<45?FLOORT:MARBLE;
  if(a>=16&&a<=23&&w<=13)return n<2?PAINT_NAVY:PLANKS;
  if(n===2&&capChamber(a,w))return w<34?PAINT_NAVY:PLANKS;
  if(n===3&&capChamber(a,w))return a>=30?PAINT_NAVY:PLANKS;
  if(n===0&&a>=26&&w>=52)return PAINT_NAVY;
  if(n===3&&a>=26&&w>=52)return FLOORT;
  return MARBLE;
}
function capitolAt(b,rx,rz,y){
  const g=capGeo(),u=rx-PL0,v=rz-PL0,yy=y-G,c=g.c,ad=Math.abs(u-c+0.5),a=Math.floor(ad),w=v-g.bf;
  if(v<g.pz0||v>=g.pz1||u<g.px0||u>=g.px1)return AIR;
  // the plinth, three blocks high, with broad steps up the middle of the front
  if(v<g.pz0+3&&ad<14){if(yy<=v-g.pz0+1){STRUCT=true;return HOSPW;}return yy<=3?AIR:AIR;}
  if(yy<=3){
    STRUCT=true;
    // (the floors inside: the rotunda's has a gold ring and a dark band round it, like the compass stars let into real ones)
    if(yy===3&&a<15&&w>=1&&w<=30){const d=Math.hypot(u+.5-c,v+.5-g.dc);return d>=3.5&&d<4.5?GOLD:d<9.5&&d>=8.5?PAINT_NAVY:MARBLE;}
    if(yy===3&&a<39&&w>=1&&w<=58&&!(a===15&&w<31))return capFloor(0,u<c?0:1,a,w);
    return HOSPW;}
  // half columns all down the sides and across the back, carrying the cornice round the building
  if(a===40&&w>=0&&w<=60||w===60&&a<=40){if(yy>=24)return AIR;if(yy>=22){STRUCT=true;return yy===23?MARBLE:HOSPW;}if((a===40?w:a)%6===0){STRUCT=true;return HOSPW;}return AIR;}
  // the portico: a row of tall columns, an entablature and a stepped pediment
  if(v<g.bf){
    // (each wing has its own smaller one in front of its own doors, and a flag over it; half columns along the rest of the wall)
    if(a>=16&&a<=40){
      if(a>=22&&a<=36){const da=Math.abs(a-29);
        if(da===0&&w===-5&&yy>=25&&yy<=33){STRUCT=true;return METAL;}
        if(w===-5&&yy>=30&&yy<=33&&a>29&&a<=33)return yy%2?(u<c?PAINT_RED:PAINT_GREEN):PAINT_WHITE;
        if(w===-5&&yy<=18&&da%3===1&&da>1&&da<=7){STRUCT=true;return HOSPW;}
        if(w>=-5&&yy>=19&&yy<=20){STRUCT=true;return MARBLE;}
        if(w>=-5&&yy>=21&&da<7-2*(yy-21)){STRUCT=true;return HOSPW;}
        return AIR;}
      if(w===-1){if(yy>=24)return AIR;if(yy>=22){STRUCT=true;return yy===23?MARBLE:HOSPW;}if(a%6===0){STRUCT=true;return HOSPW;}}
      return AIR;}
    if(ad>=16)return AIR;
    // columns every 3 blocks, two rows deep, leaving a wide way in up the middle in line with the doors
    if((v===g.bf-3||v===g.bf-5)&&yy<=18&&ad>=3.4&&ad<15&&Math.abs((ad-3.5)/3-Math.round((ad-3.5)/3))<0.05){STRUCT=true;return HOSPW;}
    if(v>=g.bf-5&&yy>=19&&yy<=20){STRUCT=true;return yy===20?MARBLE:HOSPW;}
    if(v>=g.bf-5&&yy>=21){const k=yy-21;if(ad<15-2*k){STRUCT=true;return v===g.bf-5&&ad<15-2*k-1&&k<5?MARBLE:HOSPW;}}
    return AIR;
  }
  if(v>=g.back)return AIR;
  const dx=u+0.5-c,dz=v+0.5-g.dc,d=Math.hypot(dx,dz);
  // the central block, holding a rotunda that opens up into the dome
  if(ad<16&&v<g.bf+32){
    const wall=ad>=15||v===g.bf||v===g.bf+31;
    if(yy<28){
      if(wall){
        if(v===g.bf&&ad<3&&yy<=11)return yy===5?DOOR_WK:DOOR_W;   // the great doors
        if(ad>=15&&Math.abs(v-g.bf-16)<=1&&yy>=4&&yy<=6)return AIR;   // the ways through to the wings
        if(w===31&&ad<3&&yy>=4&&yy<=7)return AIR;   // and the way on to the statuary hall
        STRUCT=true;
        if((yy-4)%6>=1&&(yy-4)%6<=4&&((v===g.bf||v===g.bf+31)?u:v)%4===1)return WIN_WARM;
        return HOSPW;
      }
      // a ring of columns round the rotunda floor, a statue in the middle
      if(Math.abs(d-11)<0.5&&Math.abs(dx)>3&&Math.round(Math.atan2(dz,dx)*8/Math.PI)%2===0){STRUCT=true;return HOSPW;}
      // (a bronze founder on a marble plinth, under the dome)
      if(yy<=5&&d<1.8){STRUCT=true;return MARBLE;}
      if(yy>=6&&yy<=10&&d<.8)return BRONZE;
      if(yy===8&&d<1.6)return BRONZE;
      return AIR;
    }
    if(yy===28)return d<11?AIR:ROOF;
  }
  // the wings: four storeys of offices either side and behind
  if(ad<40&&yy<=24){
    const wall=ad>=39||v===g.bf||v===g.back-1;
    if(yy===23)return ROOF;
    if(yy===24)return wall&&(u+v)%2===0?HOSPW:AIR;   // balustrade
    if(wall){STRUCT=true;const lv=(yy-4)%FH;
      if(v===g.bf&&yy<=7&&a>=28&&a<=30)return yy===5?DOOR_WK:DOOR_W;   // (each wing's own doors, behind its portico)
      if(lv===4)return MARBLE;   // (a band of paler stone at each floor)
      if(lv<=2&&(ad>=39?w:a)%6>=2&&(ad>=39?w:a)%6<=3)return WIN_WARM;
      return HOSPW;}
    const lv=(yy-4)%FH,n=Math.floor((yy-4)/FH),s=u<c?0:1;
    if(b.stair){FL_SLAB=lv===4;const st=stairAt(b,rx,rz,y);if(st!==undefined)return st;const se=stairAt(b.east,rx,rz,y);if(se!==undefined)return se;}   // (a flight up each wing)
    if(lv===4){
      if(n===0&&capChamber(a,w)&&!capGal(a,w))return AIR;   // (the chamber runs up through this floor, but for its gallery)
      if(n===0&&capRail(a,w)){STRUCT=true;return MARBLE;}
      if(n<3)return(u%4===0&&v%4===2)?LAMP:capFloor(n+1,s,a,w);
      return AIR;}
    const k=capPlan().F[n][capCell(s,a,w)];
    // (wood panelling up the chamber's walls)
    if(k===1||k&&lv===3){STRUCT=true;return n===0&&lv<2&&capChamber(a<39?Math.max(a,20):a,Math.min(45,Math.max(w,20)))?PLANKS:HOSPW;}
    if(k===2)return lv===1?DOOR_WK:DOOR_W;
    if(k===3)return AIR;
    if(n===0&&yy===4&&a>=24&&a<=34&&w>=43&&w<=45){STRUCT=true;return MARBLE;}   // (the rostrum, in two steps)
    if(n===0&&yy===5&&a>=26&&a<=32&&w>=44&&w<=45){STRUCT=true;return PLANKS;}
    if(n===1&&lv===0&&capRail(a,w)){STRUCT=true;return MARBLE;}   // (the gallery's front)
    if(n===0&&capRail(a,w)&&((a===23||a===35)&&(w-23)%6===0||w===23&&Math.abs(a-29)===5)){STRUCT=true;return HOSPW;}   // (the columns holding it up)
    return AIR;
  }
  // the drum: a ring wall with windows and an outer colonnade, on top of the central block
  if(yy>=29&&yy<=36){
    if(d>=10.5&&d<12){STRUCT=true;return yy>=31&&yy<=34&&Math.round(Math.atan2(dz,dx)*12/Math.PI)%3===0?WIN_WARM:HOSPW;}
    if(d>=12.6&&d<13.4&&yy<=35&&Math.round(Math.atan2(dz,dx)*16/Math.PI)%2===0){STRUCT=true;return HOSPW;}
    if(yy===29&&d<13.6)return HOSPW;
    return AIR;
  }
  // the dome, and the lantern and spire on top of it
  // (ribs up the dome, a little round window between each pair low down)
  if(yy>=37&&yy<=47){const r3=Math.hypot(d,yy-36);if(Math.abs(r3-11.4)>=0.75)return AIR;STRUCT=true;const th=Math.atan2(dz,dx)*8/Math.PI,rib=Math.abs(th-Math.round(th))<.14;if(rib)return MARBLE;if(yy===39&&Math.abs(th-Math.floor(th)-.5)<.2)return WIN_WARM;return HOSPW;}
  if(yy>=48&&yy<=52){if(d>=2.6)return AIR;if(yy===52||yy===48){STRUCT=true;return MARBLE;}if(d>=1.5&&Math.round(Math.atan2(dz,dx)*4/Math.PI)%2===0){STRUCT=true;return HOSPW;}return AIR;}
  // (a bronze figure on the very top, a lit torch held up)
  if(yy===53)return d<1.6?MARBLE:AIR;
  if(yy>=54&&yy<=59)return d<0.8?BRONZE:AIR;
  if(yy===60)return d<0.8?LAMP:AIR;
  return AIR;
}
function capitolGround(col,u,v,x,z){
  const g=capGeo(),c=g.c,ad=Math.abs(u-c+0.5);
  col(G-1,DIRT);
  // a paved terrace round the building
  if(u>=g.px0-4&&u<g.px1+4&&v>=g.pz0-4&&v<g.pz1+4){col(G,SIDEWALK);return;}
  // a hedge all round, with the main gate on the axis
  if(u===0||u===g.W-1||v===0||v===g.L-1){col(G,GRASS);if(v===0&&ad<6)col(G,GRAVEL);else col(G+1,LEAVES);return;}
  if(v<g.pz0-4){
    // the promenade up the middle, with the long reflecting pool in it
    if(ad<5){
      if(ad<3&&v>=18&&v<g.pz0-26){col(G,WATER);col(G-1,WATER);return;}
      if(ad<3.6&&v>=17&&v<g.pz0-25){col(G,STONE);col(G+1,STONE);return;}
      col(G,GRAVEL);return;
    }
    // the great lawn, mown in stripes
    if(ad<28){col(G,(v>>3)%2?GRASS:FIELD);return;}
    // formal gardens: hedged flower beds on a grid of gravel walks, a fountain in the middle of each side
    const fu=c+(u<c?-41:41),fv=(g.pz0-4)/2,fd=Math.hypot(u+0.5-fu,v+0.5-fv);
    if(fd<5){col(G,fd<3?STONE:COBBLE);if(fd<3){col(G+1,fd<1.2?STONE:WATER);if(fd<1.2){col(G+2,STONE);col(G+3,WATER);}}return;}
    const gu=u%8,gv=v%8;
    if(gu<6&&gv<6&&u>3&&u<g.W-4){col(G,GRASS);if(gu===0||gu===5||gv===0||gv===5)col(G+1,LEAVES);else if((gu+gv)%2===0)col(G+1,FLOWER);return;}
    col(G,GRAVEL);return;
  }
  col(G,GRASS);
}
// avenues of trees down the sides of the front grounds, and a scatter round the building
function capitolTree(u,v,x,z){
  const g=capGeo();
  if(v<g.pz0-6&&(u===3||u===g.W-4)&&v%6===3&&v>2)return true;
  if(u<3||v<3||u>g.W-4||v>g.L-4||(x+z)%2)return false;
  if(u>=g.px0-7&&u<g.px1+7&&v>=g.pz0-7&&v<g.pz1+4)return false;
  if(v>=g.pz0-7&&hash2(x*3+1,z*7+5)<0.09)return true;
  return false;
}
// football stadium, sized to its site (a 4x6-block strip): a striped pitch along the long axis with full markings and
// goals, 16 rows of seating rising on every side with tunnels through, a tall back wall carrying a roof over the
// upper rows, a concourse round the outside and four floodlight masts
function stadiumField(W,L){
  const long=L>=W,sw=long?W:L,sl=long?L:W,fs=sw-48,fl=Math.min(sl-48,Math.round(fs*1.5));
  const fw=long?fs:fl,fh=long?fl:fs;return{fx0:(W-fw)>>1,fz0:(L-fh)>>1,fw,fh,long};
}
const STAND=16;
function stadiumCol(col,u,v,W,L,x,z){
  const F=stadiumField(W,L),fx1=F.fx0+F.fw,fz1=F.fz0+F.fh;
  const du=u<F.fx0?F.fx0-u:u>=fx1?u-fx1+1:0,dv=v<F.fz0?F.fz0-v:v>=fz1?v-fz1+1:0,d=Math.max(du,dv);
  if(d===0){
    col(G-1,DIRT);
    // pitch coordinates: a across, b along its length
    const pa=F.long?u-F.fx0:v-F.fz0,pb=F.long?v-F.fz0:u-F.fx0,A=F.long?F.fw:F.fh,Bl=F.long?F.fh:F.fw,ca=A/2-0.5,cb=Bl/2-0.5;
    const rc=Math.hypot(pa-ca,pb-cb),boxW=Math.round(A*0.3),boxD=Math.round(Bl*0.16),gW=Math.round(A*0.13),gD=Math.round(Bl*0.055);
    const endB=Math.min(pb,Bl-1-pb),offA=Math.abs(pa-ca);
    const line=pa===0||pa===A-1||pb===0||pb===Bl-1||Math.abs(pb-cb)<0.6||Math.abs(rc-9)<0.55
      ||(endB===boxD&&offA<=boxW)||(endB<=boxD&&Math.abs(offA-boxW)<0.6)||(endB===gD&&offA<=gW)||(endB<=gD&&Math.abs(offA-gW)<0.6);
    col(G,line?FIELD_L:(pb>>2)%2?GRASS:FIELD);
    // goals: posts and crossbar on each goal line
    if(endB===0&&offA<=4.5){if(offA>3.9){for(let y=G+1;y<=G+3;y++)col(y,HOSPW);}col(G+4,HOSPW);}
    return;
  }
  col(G,CONCRETE);
  const side=du>=dv,along=side?v:u,len=side?L:W,mid=len/2-0.5;
  // tunnels: through the middle of every side, and two more along each long side
  const tun=Math.abs(along-mid)<=2||(len>120&&(Math.abs(along-len*0.27)<=2||Math.abs(along-len*0.73)<=2));
  if(d<=STAND){
    if(!tun){for(let y=G+1;y<G+d;y++)col(y,CONCRETE);col(G+d,((along>>3)+(d>8?1:0))%2?SEAT_B:SEAT_R);}
    else if(d>=5)col(G+5,CONCRETE);
    if(d>=9)col(G+STAND+5,METAL);
    // (toilets under the stand beside the tunnel, the door opening off it)
    {const a=along-mid;if(side&&a>2&&a<=10&&d>=10){const wall=a<=3||a>9||d===10||d===STAND;for(let y=G+1;y<=G+4;y++)col(y,a<=3&&d===12&&y<=G+3?(y===G+2?DOOR_WK:DOOR_W):wall?CONCRETE:AIR);}}
    return;
  }
  if(d<=STAND+2){
    const y0=tun?G+5:G+1;for(let y=y0;y<=G+STAND+4;y++)col(y,CONCRETE);col(G+STAND+5,METAL);
    if(d===STAND+2&&(along%6===0))col(G+STAND+6,NEON_R);
    return;
  }
  // floodlight masts at the four outer corners of the concourse
  if((u===3||u===W-4)&&(v===3||v===L-4)){for(let y=G+1;y<=G+34;y++)col(y,METAL);col(G+35,LAMP);col(G+36,LAMP);}
}
// gas station forecourt: a canopy on four posts over two pump islands, and a tall price sign
function forecourtCol(col,rx,rz,P){
  // what says 'gas station' from a long way off: a broad flat canopy on four legs, a band of the brand's colour round its
  // edge with a lit strip under that, three islands of pumps beneath, and a tall price sign by the road
  const cx0=PL0+1,cx1=PL1-2,cz0=PL0+1,cz1=PL0+10,B=P&&P.b[0]&&P.b[0].brand,NE=(B&&B.neon)||NEON_R,BAND=(B&&B.wall&&B.wall!==BRICK&&B.wall!==STUCCO)?B.wall:PAINT_RED;
  if(rx>=cx0&&rx<cx1&&rz>=cz0&&rz<cz1){const e=rx===cx0||rx===cx1-1||rz===cz0||rz===cz1-1;col(G+6,e?NE:METAL);col(G+7,e?BAND:PAINT_WHITE);if(e)col(G+8,BAND);}
  if((rx===cx0+1||rx===cx1-2)&&(rz===cz0+1||rz===cz1-2))for(let y=G+1;y<=G+5;y++)col(y,METAL);
  for(const c of [PL0+4,PL0+8,PL0+12])if(Math.abs(rx-c)<=0&&rz>=PL0+3&&rz<=PL0+7){col(G+1,CONCRETE);if(rz===PL0+4||rz===PL0+6){col(G+2,PUMP);col(G+3,PUMP);}}
  if(rx===PL0&&rz===PL0+12)col(G+1,CONCRETE);   // the price sign's footing (the slim post and the board are meshes)
}
// one column of a highway: q 0..13 across it (0 and 13 are the barriers, over the pavements either side; four 3-wide lanes), 'along' its length
function hwDeck(a,lx,lz,along,q,HY,alongX){
  const put=(y,v)=>{a[li(lx,y,lz)]=v;};
  if(q===0||q===13){
    put(HY,CONCRETE);put(HY+1,CONCRETE);
    // a pillar every half block, down to the ground (or the riverbed)
    const m=mod(along,CELL);
    if(m===PL0+2||m===PL1-2)for(let y=HY-1;y>=0;y--){const b=a[li(lx,y,lz)];if(b!==AIR&&b!==WATER)break;put(y,CONCRETE);}
    return;
  }
  put(HY,q===6?(alongX?LINEX:LINE):q===7?(alongX?LINEX_R:LINE_R):(q===3||q===9)&&mod(along,6)<3?(alongX?LANEX:LANE):ASPHALT);
  put(HY-1,CONCRETE);
}
const ROADISH=new Set([ASPHALT,LINE,LINEX,LINE_R,LINEX_R,LANE,LANEX,CROSS,CROSSX,GRAVEL]);
// one column of a highway out on the plains, at signed distance n.sd across it: the same cross-section as the straight
// ones (barrier, lanes, centre line, lanes, barrier -- 14 across), its markings measured along its own length. On the
// ground the land's levelled for it (over a river it's a low bridge); up on a motorway deck there's a pillar now and
// then, standing on the ground below (never in the middle of a road down there).
// where a highway's toll plaza is (distance along it), if it has one: a long straight stretch well out from either town
function tollsOf(R){
  if(R.tolls)return R.tolls;R.tolls=[];if(TEST_OFF.has('tolls'))return R.tolls;if(R.kind!=='country'||R.L<700)return R.tolls;
  const sx=Math.round(R.pts[0][0]),sz=Math.round(R.pts[0][1]);if(hash2(sx*41+7,sz*13+3)>0.55)return R.tolls;
  const s=R.L*(0.32+0.36*hash2(sx*3+5,sz*7+1)),P0=rtPointL(R,s-30),P1=rtPointL(R,s+30);
  if(P0.tx*P1.tx+P0.tz*P1.tz<0.99||truckStopOf(R).some(T=>Math.abs(T.s0-s)<120))return R.tolls;
  const P=rtPointL(R,s);if(riverAt(P.x,P.z,RIV_W+14))return R.tolls;
  R.tolls.push(Math.round(s));return R.tolls;
}
const tollAt=(R,s)=>{for(const t of tollsOf(R))if(Math.abs(s-t)<=4.5)return t;return null;};
// how high a highway's road is at distance s along it: a motorway leaves town on its deck, ramps down one block in two,
// and runs on the ground across the plains (up again into the next town); a country highway's on the ground throughout
function rtFlat(R){if(R.flat===undefined)R.flat=[axisSpan(R.A.T,R.A.ax).kind!=='moto',axisSpan(R.B.T,R.B.ax).kind!=='moto'];return R.flat;}
function rtRamp(R,s){if(R.kind!=='moto')return null;const RL=2*(R.HY-G),F=rtFlat(R);
  if(s<RL&&s<=R.L-s&&!F[0])return{e:s,RL,nearA:true};if(R.L-s<RL&&!F[1])return{e:R.L-s,RL,nearA:false};if(s<RL&&!F[0])return{e:s,RL,nearA:true};return null;}
function rtSurfY(R,s){const r=rtRamp(R,s);return r?R.HY+1-r.e/2:G+1;}
const OPEN_TOP=new Set([ASPHALT,LINE,LINEX,LINE_R,LINEX_R,LANE,LANEX,CROSS,CROSSX]);
function routeColumn(a,lx,lz,x,z,n,HY){
  if(HY!==G){const r=rtRamp(n.R,n.s);if(!r)HY=G;else return routeRampCol(a,lx,lz,x,z,n,r);}
  const put=(y,v)=>{a[li(lx,y,lz)]=v;},R=n.R,ad=Math.abs(n.sd),along=Math.floor(n.s);
  // out on the plains a highway is a little wider than through town: a hard shoulder outside the outer lane each side
  // (room for a broken-down car), easing out from town width over the first and last 50 blocks
  // (a motorway counts from the foot of its ramp, which is town width, so the barrier carries straight on off the ramp)
  const F=R.kind==='moto'?rtFlat(R):null,RL=F?2*(R.HY-G):0,e=Math.min(n.s-(F&&!F[0]?RL:0),R.L-n.s-(F&&!F[1]?RL:0)),t=Math.max(0,Math.min(1,(e-10)/40));let W=6+2.0*t*t*(3-2*t);   // (the extra width outside the outer lane is the hard shoulder)
  // (and where it runs into a town's main street, the barriers close in to the street's own width over the last stretch,
  // by which time the outer lane's cars have moved over, instead of the road just stepping in at the junction)
  {if(!R.nar){const nar=E=>{const [px,pz]=E===R.A?R.pts[0]:R.pts[R.pts.length-1],a=E.ax==='x'?px-E.s:px,b=E.ax==='x'?pz:pz-E.s;return biomeOf(Math.floor(a/CELL),Math.floor(b/CELL))!=='plains';};R.nar=[(!F||F[0])&&nar(R.A),(!F||F[1])&&nar(R.B)];}
   if(R.nar[0]&&n.s<14)W=Math.min(W,4+n.s/7);if(R.nar[1]&&R.L-n.s<14)W=Math.min(W,4+(R.L-n.s)/7);}
  if(ad>=W+1.4)return false;
  const bar=ad>=W;
  const surf=ASPHALT;   // (the lines are painted on over the top, at the road's own angle: see routeMarks)
  if(HY===G){
    const wet=riverAt(x+0.5,z+0.5,RIV_W+1);
    for(let y=G+1;y<G+12;y++)put(y,AIR);if(!wet)for(let y=G-2;y<G;y++)put(y,DIRT);
    if(bar&&farmLaneCol(x,z)){put(G,ASPHALT);return true;}   // a farm lane joins here: an opening in the barrier
    if(bar&&tsApron(x,z)){put(G,ASPHALT);return true;}       // (and the way into a truck stop)
    if(bar&&OPEN_TOP.has(a[li(lx,G,lz)]))return true;        // (and wherever another road's already here: where two meet it's an open junction, not a wall across its lanes)
    if(bar){put(G,CONCRETE);put(G+1,CONCRETE);return true;}
    put(G-1,CONCRETE);put(G,surf);
    // a toll plaza: islands between the lanes, a booth on each, a canopy right across on posts, the sign along its edge
    {const T2=tollAt(R,n.s);if(T2!==null){const ds=n.s-T2,sd=n.sd,k=Math.round(sd/3),isl=Math.abs(sd-k*3)<0.5&&Math.abs(k)<=2;
      if(Math.abs(ds)<=4&&isl)put(G+1,CONCRETE);
      if(Math.abs(ds)<=1&&isl&&k!==0){for(let y=G+1;y<=G+3;y++)put(y,y===G+2?GLASS:PAINT_WHITE);put(G+4,METAL);}
      if(Math.abs(ds)===3&&isl)for(let y=G+2;y<=G+5;y++)put(y,METAL);
      if(Math.abs(ds)<=3&&ad<W)put(G+6,Math.abs(ds)===3?(Math.floor(sd)%2?PAINT_RED:PAINT_WHITE):METAL);}}
    return true;}
  for(let y=HY+1;y<HY+7&&y<H;y++)put(y,AIR);   // (headroom: through anything built up there)
  if(bar){put(HY,CONCRETE);put(HY+1,CONCRETE);
    const m=mod(along,CELL);if(m===PL0+2||m===PL1-2){let y=HY-1;while(y>0&&(a[li(lx,y,lz)]===AIR||a[li(lx,y,lz)]===WATER))y--;const b=a[li(lx,y,lz)];
      if(!ROADISH.has(b))for(let yy=HY-1;yy>y;yy--)put(yy,CONCRETE);}
    return true;}
  put(HY-1,CONCRETE);put(HY,surf);return true;
}
// a motorway's ramp down from the deck at the edge of town: ramp blocks one block in two, rising toward the town;
// a barrier each side; pillars under it now and then
function routeRampCol(a,lx,lz,x,z,n,r){
  const put=(y,v)=>{a[li(lx,y,lz)]=v;},R=n.R,ad=Math.abs(n.sd),W=6;if(ad>=W+1.4)return false;
  const d=Math.floor(r.e),y=R.HY-Math.floor(d/2),kind=d%2===0?2:1,P=rtPoint(R,n.s),tx=r.nearA?-P.tx:P.tx,tz=r.nearA?-P.tz:P.tz;
  const rise=Math.abs(tx)>=Math.abs(tz)?(tx>0?0:1):(tz>0?2:3);
  for(let yy=y+1;yy<=y+6&&yy<H;yy++)put(yy,AIR);
  if(ad>=W){put(y,CONCRETE);if(y>G)put(y+1,CONCRETE);if(d%8===0)for(let yy=y-1;yy>0;yy--){const b=a[li(lx,yy,lz)];if(b!==AIR&&b!==WATER)break;put(yy,CONCRETE);}return true;}
  put(y,rampId(rise,kind));if(y-1>G)put(y-1,CONCRETE);
  return true;
}
// which layer of the ground a block is in: the boundaries wander up and down so the strata look natural
function earthAt(x,y,z){
  if(y===0)return BEDROCK;
  const w=Math.sin(x*0.071)+Math.sin(z*0.093+1.3)+Math.sin((x+z)*0.031+2.1),d=G-1-y;
  if(y<=2&&hash2(x*7+y,z*5+1)<(y===1?0.6:0.25))return BEDROCK;
  if(d<3+w*0.4)return DIRT;
  if(d<8+w*1.2)return CLAY;
  if(d<10+w*1.5)return GRAVEL;
  if(d<24+w*2.5){const q=hash2(x*31+y*7,z*17+y*3);return q<0.025?COAL:q<0.034?RUST:STONE;}
  {const q=hash2(x*13+y*11,z*29+y*5);return q<0.012?CRYSTAL:q<0.017?GOLD:q<0.024?RUST:DEEPSLATE;}
}
// the whole column of it, in a chunk's array from offset o (the same as asking earthAt of each height, but the part that wanders
// only depends on where the column is, and every chunk made goes through this 256 x 44 times)
function earthCol(a,o,x,z){
  const w=Math.sin(x*0.071)+Math.sin(z*0.093+1.3)+Math.sin((x+z)*0.031+2.1),A=CS*CS,g1=3+w*0.4,g2=8+w*1.2,g3=10+w*1.5,g4=24+w*2.5;
  a[o]=BEDROCK;
  for(let y=1;y<G;y++){
    const d=G-1-y;let v;
    if(y<=2&&hash2(x*7+y,z*5+1)<(y===1?0.6:0.25))v=BEDROCK;
    else if(d<g1)v=DIRT;else if(d<g2)v=CLAY;else if(d<g3)v=GRAVEL;
    else if(d<g4){const q=hash2(x*31+y*7,z*17+y*3);v=q<0.025?COAL:q<0.034?RUST:STONE;}
    else{const q=hash2(x*13+y*11,z*29+y*5);v=q<0.012?CRYSTAL:q<0.017?GOLD:q<0.024?RUST:DEEPSLATE;}
    a[o+y*A]=v;}
}
// is the street in this column of block (px,pz) there? (roadX: the strip along its low-x edge; roadZ: along its
// low-z edge; both: the intersection at its corner, there if any of its four arms is)
function stripOpen(px,pz,roadX,roadZ){
  if(roadX&&!roadZ)return segOpen(px,pz,0);if(roadZ&&!roadX)return segOpen(px,pz,1);
  return jSquare(px,pz);
}
// is the square at intersection (ix,iz) paved? Only where streets actually meet or bend (two or more arms): at a dead
// end the street just stops at the end of its strip, level with the blocks beside it, instead of poking a square out
// past them into the grass
function jSquare(ix,iz){let n=0;for(let d=0;d<4;d++)if(segOpen(ix,iz,d)&&++n>=2)return true;
  // (where a country highway leaves town on its west or north side, the junction at the edge of town is where it
  // carries on out across the plains)
  return n===1&&(ghwRow(iz,ix)&&hwLine('x',iz,ix-1)===null||ghwCol(ix,iz)&&hwLine('z',ix,iz-1)===null||dumpGateAt(ix,iz));}
// how many streets meet at an intersection
const jDegC=new Map();
function jDeg(ix,iz){const k=ix*100003+iz;let v=jDegC.get(k);if(v===undefined){v=0;for(let d=0;d<4;d++)if(segOpen(ix,iz,d))v++;jDegC.set(k,v);}return v;}
// does the road stop for this junction (lights or a stop sign)?
const stopLine=(ix,iz)=>{const k=ctlAt(ix,iz).k;return k==='light'||k==='stop';};
// where a street just carries on or turns a corner there's no junction to paint, so its centre line runs on through the
// square instead of leaving a gap: out from the middle along each of the two arms
function bendLine(ix,iz,rx,rz){
  // (the last junction before a highway leaves town: it only has the one arm, but the road carries straight on through it)
  if(jDeg(ix,iz)===1){const zr=segOpen(ix,iz,0)||segOpen(ix,iz,2);return zr?(rx===RC?LINE_R:rx===RC-1?LINE:ASPHALT):(rz===RC?LINEX_R:rz===RC-1?LINEX:ASPHALT);}
  // (a corner needs its two double lines to meet in an elbow, which whole-block tiles can't draw: see routeMarks)
  if((segOpen(ix,iz,0)||segOpen(ix,iz,2))&&(segOpen(ix,iz,1)||segOpen(ix,iz,3)))return ASPHALT;
  const zArm=rx===RC-1||rx===RC,xArm=rz===RC-1||rz===RC;
  if(zArm&&(segOpen(ix,iz,0)&&rz>=RC-1||segOpen(ix,iz,2)&&rz<=RC))return rx===RC?LINE_R:LINE;
  if(xArm&&(segOpen(ix,iz,1)&&rx>=RC-1||segOpen(ix,iz,3)&&rx<=RC))return rz===RC?LINEX_R:LINEX;
  return ASPHALT;
}
