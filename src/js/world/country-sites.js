// ---- castles: now and then, out in open country well away from any place, a castle on its hill: a moat round the
// foot of the mound, curtain walls with round towers and battlements on top, a gatehouse with its portcullis, the keep ----
const castleC=new Map();
function castleAt(px,pz){
  return false;   // (castles are gone)
  const k=px*100003+pz;let v=castleC.get(k);if(v!==undefined)return v;v=false;
  if(hash2(px*523+7,pz*271+13)<0.0016&&biomeOf(px,pz)==='plains'){let near=false;
    for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2&&!near;b++)if(settlementAt(px+a,pz+b))near=true;
    if(!near&&!bigPlainsAt(px,pz)&&!plotNearLines(px,pz,8)&&farmK(px,pz)===null&&!rivPlotNear(px,pz)&&![[4,4],[28,4],[4,28],[28,28],[16,16]].some(([a,b])=>tsAt(px*CELL+a,pz*CELL+b)))v=true;}
  castleC.set(k,v);return v;
}
function castleColumn(a,col,px,pz,rx,rz,lx,lz,x,z){
  const c=15.5,d=Math.max(Math.abs(rx-c),Math.abs(rz-c)),dr=Math.hypot(rx-c,rz-c),wall=STONE,trim=MOSSSTONE;
  for(let y=G+1;y<G+40;y++)col(y,AIR);col(G-1,DIRT);
  // the mound: flat on top (4 up), sloping down to the moat
  const top=G+4;let hill=d<=11?4:Math.max(0,Math.round(4-(d-11)*1.6));
  // the moat round the bottom, and the causeway and steps up to the gate (on the north side)
  const onPath=Math.abs(rx-c)<=1.6&&rz<c;
  if(d>=13.5&&d<=15&&!onPath){col(G,WATER);col(G-1,WATER);col(G-2,SAND);return;}
  if(d>15){col(G,GRASS);return;}
  if(onPath)hill=Math.min(4,Math.max(0,Math.round(14-d)));   // (the path up climbs a block at a time)
  for(let y=G;y<G+hill;y++)col(y,DIRT);col(G+hill,onPath?GRAVEL:GRASS);
  if(onPath&&d>=13.5){col(G,PLANKS);return;}   // the drawbridge over the moat
  if(d>11)return;
  // the curtain wall: 8 high, a walkway on top behind the battlements; round towers at the corners
  const tw=(cx,cz)=>Math.hypot(rx-cx,rz-cz);let tD=99;for(const cx of [5,26])for(const cz of [5,26])tD=Math.min(tD,tw(cx,cz));
  if(tD<=3.2){const h=top+13;if(tD>2.2){for(let y=top+1;y<=h;y++)col(y,(y-top)%5===3&&tD>2.6?(rx+rz)%2?wall:trim:wall);if((rx+rz)%2===0)col(h+1,trim);}else col(top+h-top,PLANKS);return;}
  if(d>=10&&d<=11){
    // the gatehouse: two towers flanking the arch, the portcullis half up
    if(rz<c&&Math.abs(rx-c)<=4){if(Math.abs(rx-c)<=1.6){for(let y=top+1;y<=top+3;y++)col(y,y===top+3?METAL:AIR);for(let y=top+4;y<=top+10;y++)col(y,wall);if((rx+rz)%2===0)col(top+11,trim);return;}
      for(let y=top+1;y<=top+11;y++)col(y,y-top===6&&rz===Math.floor(c-11)?GLASS:wall);if((rx+rz)%2===0)col(top+12,trim);return;}
    for(let y=top+1;y<=top+8;y++)col(y,wall);if(d===11&&(rx+rz)%2===0)col(top+9,trim);return;}
  // the keep in the middle: a tall square tower, windows, battlements, a flag on top (drawn as blocks)
  if(d<=4){if(d>=3.5||d===4){for(let y=top+1;y<=top+22;y++)col(y,(y-top)%6===4&&(Math.abs(rx-c)<0.6||Math.abs(rz-c)<0.6)?GLASS:wall);if((rx+rz)%2===0)col(top+23,trim);
      if(rz<c&&Math.abs(rx-c)<0.6&&d===4){col(top+1,DOOR_W);col(top+2,DOOR_WK);col(top+3,DOOR_W);}return;}
    for(let y=top+6;y<=top+22;y+=6)col(y,PLANKS);if(Math.abs(rx-c)<0.6&&Math.abs(rz-c)<0.6){for(let y=top+23;y<=top+29;y++)col(y,METAL);col(top+29,PAINT_RED);}return;}
  // the bailey: grass, two low outbuildings along the walls
  if((rx===8||rx===23)&&rz>=17&&rz<=21){for(let y=top+1;y<=top+4;y++)col(y,y===top+4?ROOF:wall);}
}
// ---- the big sites out on the plains, each over a rectangle of blocks: an airport (6 x 2 blocks, its runway along x), a
// space agency's launch site (2 x 3) and a military base (2 x 2). Each sits on its own grid of anchor blocks, and only
// where the whole rectangle (and a ring of a couple of blocks round it) is open country clear of everything else. ----
const BIGP=[{kind:'airport',w:14,h:6,p:0.11,salt:11},{kind:'nasa',w:2,h:3,p:0.005,salt:23},{kind:'base',w:4,h:4,p:0.02,salt:37},{kind:'quarry',w:6,h:6,p:0.035,salt:67},{kind:'mine',w:3,h:3,p:0.016,salt:53},{kind:'lumber',w:4,h:3,p:0.018,salt:79},{kind:'campsite',w:2,h:2,p:0.009,salt:83},{kind:'nuclear',w:8,h:8,p:0.1,salt:131},{kind:'cult',w:1,h:1,p:0.0025,salt:97},{kind:'tower5g',w:1,h:1,p:0.004,salt:101},{kind:'prepper',w:2,h:2,p:0.006,salt:103},{kind:'militia',w:2,h:2,p:0.005,salt:107},{kind:'ruins',w:2,h:2,p:0.008,salt:109},{kind:'thieves',w:1,h:1,p:0.002,salt:113}],bigPC=new Map(),bigOK=new Map();
// is kind i's site (anchored at ax,az) there? (clear of the places, the sea, the roads, the farms... and of the
// sites of the kinds before it in the list, which win any overlap)
function bigCell(i,ax,az){
  const K=BIGP[i],kk=K.kind+ax+','+az;let ok=bigOK.get(kk);if(ok!==undefined)return ok;
  ok=hash2(ax*389+K.salt,az*211+K.salt*3)<K.p&&!TEST_OFF.has(K.kind);
  if(ok)for(let a=ax-2;a<ax+K.w+2&&ok;a++)for(let b=az-2;b<az+K.h+2&&ok;b++){const inR=a>=ax&&a<ax+K.w&&b>=az&&b<az+K.h;if(settlementAt(a,b)||seaPlot(a,b)||inR&&railPlot(a,b)||inR&&(farmK(a,b)!==null||tsPlot(a,b)||plotNearLines(a,b,2)||rivPlotNear(a,b)))ok=false;}
  if(ok)for(let a=ax;a<ax+K.w&&ok;a++)for(let b=az;b<az+K.h&&ok;b++)for(let i2=0;i2<i&&ok;i2++){const K2=BIGP[i2];if(bigCell(i2,Math.floor(a/K2.w)*K2.w,Math.floor(b/K2.h)*K2.h))ok=false;}
  bigOK.set(kk,ok);return ok;
}
function bigPlainsAt(px,pz){
  const k=px*100003+pz;let v=bigPC.get(k);if(v!==undefined)return v;v=null;
  for(let i=0;i<BIGP.length;i++){const K=BIGP[i],ax=Math.floor(px/K.w)*K.w,az=Math.floor(pz/K.h)*K.h;
    if(bigCell(i,ax,az)){v={kind:K.kind,ax,az,w:K.w,h:K.h};break;}}
  bigPC.set(k,v);return v;
}
function bigColumn(col,B,U,V,x,z){
  col(G-1,DIRT);col(G,GRASS);for(let y=G+1;y<G+60;y++)col(y,AIR);
  if(B.kind==='mine'){mineColumn(col,B,U,V,x,z);return;}
  if(B.kind==='quarry'){quarryColumn(col,B,U,V,x,z);return;}
  if(B.kind==='lumber'){lumberColumn(col,B,U,V,x,z);return;}
  if(B.kind==='campsite'){campsiteColumn(col,B,U,V,x,z);return;}
  if(B.kind==='cult'){cultColumn(col,B,U,V,x,z);return;}
  if(B.kind==='tower5g'){tower5gColumn(col,B,U,V,x,z);return;}
  if(B.kind==='prepper'){prepperColumn(col,B,U,V,x,z);return;}
  if(B.kind==='militia'){militiaColumn(col,B,U,V,x,z);return;}
  if(B.kind==='ruins'){ruinsColumn(col,B,U,V,x,z);return;}
  if(B.kind==='thieves'){thievesColumn(col,B,U,V,x,z);return;}
  const W=B.w*CELL,Hh=B.h*CELL,fence=(U===1||U===W-2||V===1||V===Hh-2)&&U>=1&&U<=W-2&&V>=1&&V<=Hh-2;
  if(B.kind==='nuclear'){
    // a high fence, a gatehouse road in, the switchyard of transformers feeding the pylons away across the country
    if(fence&&!(V===1&&U>=14&&U<=17)){for(let y=G+1;y<=G+6;y++)col(y,CHAINLINK);col(G,GRAVEL);return;}
    col(G,(U*3+V)%7===0?GRAVEL:CONCRETE);
    if(U>=14&&U<=17&&V<=34||V>=30&&V<=33&&U>=14&&U<=W-20||U>=94&&U<=97&&V>=30&&V<=215){col(G,ASPHALT);return;}
    if(U>=4&&U<=30&&V>=38&&V<=62){col(G,ASPHALT);if((U-4)%3===0&&(V-38)%10<4)col(G,LANE);return;}
    if(U>=104&&U<=215&&V>=165&&V<=240){col(G,GRAVEL);if((U-104)%6<2&&(V-165)%8<3){col(G+1,METAL);col(G+2,RUST);col(G+3,PAINT_DARK);if((U+V)%2)col(G+4,METAL);}return;}
    if((U===W-8||V===Hh-8)&&(U+V)%2===0&&hash2(x,z)<0.2){col(G+1,PAINT_YELLOW);col(G+2,PAINT_DARK);}
    return;}
  if(B.kind==='base'){
    const road=U>=30&&U<=33&&V<=Hh-3||V>=30&&V<=33&&U>=2&&U<=W-3||V>=94&&V<=97&&U>=30&&U<=W-3||U>=94&&U<=97&&V>=30&&V<=Hh-3;
    if(fence&&!(V===1&&U>=30&&U<=33)){for(let y=G+1;y<=G+4;y++)col(y,CHAINLINK);return;}
    if(road){col(G,ASPHALT);if(V===3&&U>=30&&U<=33&&U!==30)col(G+3,(U%2)?PAINT_RED:PAINT_WHITE);if(V===3&&U===29)for(let y=G+1;y<=G+3;y++)col(y,METAL);return;}   // the boom at the gate
    if(U>=35&&U<=37&&V>=3&&V<=5){const e=U===35||U===37||V===3||V===5;if(e)for(let y=G+1;y<=G+3;y++)col(y,y===G+2&&(U===36||V===4)?GLASS:PAINT_WHITE);col(G+4,METAL);return;}   // the guard post
    if(U>=4&&U<=28&&V>=4&&V<=28){col(G,CONCRETE);   // the parade ground, its flagpole and the reviewing stand
      if(U===16&&V===10){for(let y=G+1;y<=G+12;y++)col(y,METAL);}if(V===10&&U>=17&&U<=20){col(G+11,PAINT_RED);col(G+10,U%2?PAINT_WHITE:PAINT_RED);col(G+12,PAINT_BLUE);}
      if(V>=26&&U>=10&&U<=22){col(G+1,PLANKS);if(V===27){col(G+2,PLANKS);col(G+3,SEAT_B);}else col(G+2,SEAT_B);}return;}
    {const d=Math.hypot(U-26.5,V-48.5);if(d<3.6){col(G,CONCRETE);if(Math.abs(d-3)<0.5||(Math.abs(U-26.5)<0.6||Math.abs(U-28.5)<0.6||Math.abs(U-24.5)<0.6)&&Math.abs(V-48.5)<2.2&&(Math.abs(U-26.5)>1||Math.abs(V-48.5)<0.6))col(G,PAINT_YELLOW);return;}}   // the helipad
    // helipads, each a concrete disc with a white H (the helicopters on them are vehicles: see armyVenue)
    for(const [hu,hv] of [[78,48],[78,76]]){const a=U-hu,b2=V-hv,d=Math.hypot(a,b2);if(d>9)continue;col(G,CONCRETE);if(d>8)col(G,PAINT_WHITE);
      if(Math.abs(a)<=3&&Math.abs(b2)<=4&&(Math.abs(a)===3||b2===0))col(G,PAINT_WHITE);
      return;}
    // the second motor pool: bays marked out in rows (its tanks are vehicles: see armyVenue)
    if(U>=100&&U<=124&&V>=38&&V<=90){col(G,ASPHALT);const a=mod(U-100,8)-3,b2=mod(V-38,12)-4;if((Math.abs(a)===2)&&b2>=-3&&b2<=3)col(G,PAINT_WHITE);return;}
    // ammunition bunkers: long earth mounds with a concrete door at one end
    if(V>=102&&V<=124&&U>=38&&U<=90){const a=mod(U-38,18)-6,b2=V-102;if(a>=-5&&a<=5&&b2<=18){const hh=Math.max(0,Math.round(4-Math.abs(a)*0.7));if(b2===0&&hh>0){for(let y=G+1;y<=G+hh;y++)col(y,CONCRETE);return;}for(let y=G+1;y<=G+hh;y++)col(y,y===G+hh?GRASS:DIRT);}return;}
    // the firing range: sand lanes running up to targets
    if(U>=4&&U<=26&&V>=66&&V<=124){col(G,SAND);if(V>=120){col(G+1,DIRT);col(G+2,DIRT);}if(V===118&&U%5===2){col(G+1,METAL);col(G+2,PAINT_WHITE);col(G+3,PAINT_RED);}if(V===70&&U%5===2)col(G+1,PLANKS);return;}
    // the assault course: walls and logs to get over
    if(U>=36&&U<=60&&V>=66&&V<=92){col(G,DIRT);if((V-66)%8===0&&U%6<4){col(G+1,PLANKS);col(G+2,PLANKS);}return;}
    if(U>=36&&U<=60&&V>=36&&V<=58){col(G,ASPHALT);return;}   // the motor pool (its row of tanks are vehicles: see armyVenue)
    if(hash2(x*7+1,z*3+5)<0.05)col(G,DIRT);return;}
  if(B.kind==='airport'){
    if(fence&&!(V===Hh-2&&U>=78&&U<=82)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
    // a second runway along the far side, joined up by taxiways at either end
    if(V>=124&&V<=133&&U>=112&&U<=W-9){col(G,ASPHALT);if((V===128||V===129)&&U%12<6&&U>120&&U<W-17)col(G,PAINT_WHITE);if((U>=114&&U<=118||U>=W-15&&U<=W-11)&&V>=125&&V<=132&&V%2===1)col(G,PAINT_WHITE);if((V===124||V===133)&&U%8===0)col(G,NEON_Y);return;}
    if(V>=42&&V<=123&&(U>=124&&U<=127||U>=W-24&&U<=W-21)){col(G,ASPHALT);if(U===125||U===W-22)col(G,PAINT_YELLOW);return;}
    // the road in from the gate, the long-stay car park beside it, the cargo apron
    if(U>=78&&U<=82&&V>=77){col(G,ASPHALT);return;}
    if(U>=30&&U<=76&&V>=128&&V<=180){col(G,ASPHALT);if((U-30)%3===0&&(V-128)%12<5)col(G,LANE);return;}
    if(U>=36&&U<=76&&V>=80&&V<=118){col(G,ASPHALT);if((U-36)%3===0&&(V-80)%12<5)col(G,LANE);return;}
    if(U>=160&&U<=W-60&&V>=88&&V<=98){col(G,CONCRETE);return;}
    if(V>=24&&V<=33&&U>=8&&U<=W-9){col(G,ASPHALT);   // the runway: centre dashes, threshold bars, edge lights
      if((V===28||V===29)&&U%12<6&&U>16&&U<W-17)col(G,PAINT_WHITE);
      if((U>=10&&U<=14||U>=W-15&&U<=W-11)&&V>=25&&V<=32&&V%2===1)col(G,PAINT_WHITE);
      if((V===24||V===33)&&U%8===0)col(G,NEON_Y);return;}
    if(V>=38&&V<=41&&U>=20&&U<=W-21||V>=34&&V<=37&&(U>=20&&U<=23||U>=110&&U<=113||U>=W-24&&U<=W-21)){col(G,ASPHALT);if((V===39&&U>22&&U<W-23)||(V<38&&(U===21||U===111||U===W-22)))col(G,PAINT_YELLOW);return;}   // the taxiway
    if(V>=42&&V<=63&&U>=30&&U<=130){col(G,CONCRETE);if((U===48||U===80||U===112)&&V<60)col(G,PAINT_YELLOW);return;}   // the apron
    if(V>=64&&V<=76&&U>=30&&U<=100&&!(U>=66&&U<94&&V<76)&&!(U>=34&&U<62&&V<76)){col(G,ASPHALT);return;}   // the car park and the drop-off
    return;}
  // the space agency
  if(fence&&!(V===1&&U>=40&&U<=43)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  if(U>=40&&U<=43&&V<=4||U>=40&&U<=43&&V>=20&&V<=24){col(G,ASPHALT);return;}
  if(U>=12&&U<=19&&V>=30&&V<=71){col(G,GRAVEL);return;}   // the crawlerway out to the pad
  {const du=Math.abs(U-16),dv=Math.abs(V-80);
   if(du<=9&&dv<=9){col(G,CONCRETE);col(G+1,CONCRETE);if(du<=2&&dv<=8){col(G+1,AIR);col(G,AIR);col(G-1,AIR);col(G-2,CONCRETE);}return;}}   // the pad and its flame trench
  // the launch tower: a red lattice beside the pad, its swing arms reaching to the rocket
  {const tu=U-26,tv=V-79;if(tu>=0&&tu<=3&&tv>=0&&tv<=3){const c=(tu===0||tu===3)&&(tv===0||tv===3);for(let y=G+1;y<=G+46;y++){const k=y-G;if(c)col(y,k%8<4?PAINT_RED:RUST);else if(k%6===0&&(tu===0||tu===3||tv===0||tv===3))col(y,RUST);}return;}
   if(tu<0&&tu>=-6&&tv>=1&&tv<=2){for(const ay of [G+28,G+38])col(ay,METAL);if(tu>=-1)col(G+1,CONCRETE);return;}}
  if(hash2(x*5+3,z*9+1)<0.04)col(G+1,FLOWER);
}
// an underground bunker:
// ---- an underground bunker: out in a quiet field, a steel hatch in the grass (and a vent pipe beside it); under it a
// shaft down to concrete rooms -- the main hall, a bunk room, a store room of supplies, a radio room -- through blast doors ----
const bunkC=new Map();
function bunkerAt(px,pz){
  if(TEST_OFF.has('bunker'))return false;
  const k=px*100003+pz;let v=bunkC.get(k);if(v!==undefined)return v;v=false;
  if(hash2(px*613+29,pz*307+41)<0.0015&&biomeOf(px,pz)==='plains'&&!railPlot(px,pz)&&!bigPlainsAt(px,pz)&&farmK(px,pz)===null&&dumpAt(px,pz)===null&&!castleAt(px,pz)&&!tsPlot(px,pz)&&!plotNearLines(px,pz,3)&&!rivPlotNear(px,pz))v=true;
  bunkC.set(k,v);return v;
}
function bunkerColumn(col,rx,rz,x,z){
  const u=rx-PC,v=rz-PC,au=Math.abs(u);
  // the hatch (and the shaft under it, steel-lined), a vent pipe
  if(au<=1&&Math.abs(v)<=1){col(G,METAL);for(let y=G-11;y<G;y++)col(y,AIR);col(G-12,CONCRETE);return;}
  if(u===3&&v===-3){col(G+1,METAL);col(G+2,METAL);}
  const room=(x0,x1,z0,z1)=>u>=x0&&u<=x1&&v>=z0&&v<=z1,
    inHall=room(-6,6,-2,9),inBunk=room(-14,-8,0,8),inStore=room(8,14,0,8),inRadio=room(-4,4,11,16),inRoom=inHall||inBunk||inStore||inRadio;
  const shell=room(-15,15,-3,17);if(!shell)return;
  if(au<=2&&Math.abs(v)<=2){for(let y=G-11;y<G;y++)col(y,METAL);col(G-12,CONCRETE);return;}   // the shaft's lining
  for(let y=G-13;y<=G-7;y++)col(y,CONCRETE);
  // the doorways between the rooms (blast doors: thick steel frames, yellow-and-black striped)
  const door=(u===-7&&v>=3&&v<=4)||(u===7&&v>=3&&v<=4)||(v===10&&au<=1);
  if(inRoom||door){for(let y=G-11;y<=G-8;y++)col(y,AIR);col(G-12,CONCRETE);
    if(door){col(G-8,(u+v)%2?PAINT_YELLOW:PAINT_DARK);return;}
    if((u+v)%5===0)col(G-7,LAMP);
    // (the bunks, the store's shelves, the radio desks and the hall's table are props: see bunkerProps)
    return;}
  if(u===-7||u===7||v===10){for(let y=G-11;y<=G-8;y++)col(y,METAL);}   // the blast walls
}
// ---- railways: some of the country highways have a railway running alongside (16 blocks off, on the side clear of
// any truck stop), a station with its platform and shelter at each end, and a train shuttling between them ----
function railOf(R){
  if(R.rail!==undefined)return R.rail;R.rail=null;return null;   // (the railways have their own lines now)
  if(R.kind!=='country'||R.L<520)return null;
  const sx=Math.round(R.pts[0][0]),sz=Math.round(R.pts[0][1]);if(hash2(sx*71+9,sz*37+5)>0.4)return null;
  let side=hash2(sx*9+2,sz*11+4)<0.5?1:-1;const TS=truckStopOf(R);
  if(TS.some(T=>T.side===side))side=-side;if(TS.some(T=>T.side===side))return null;
  R.rail={side,off:16*side};return R.rail;
}
function railColumn(col,x,z){
  const n=routeAt(x+0.5,z+0.5,24);if(!n)return;const R=n.R,RL=railOf(R);if(!RL)return;
  if(n.i===0&&n.t<=0||n.i===R.pts.length-2&&n.t>=1)return;
  const e=Math.min(n.s,R.L-n.s);if(e<25)return;
  const o=n.sd*RL.side;   // (across, measured outward on the railway's side)
  if(Math.abs(o-16)<=2.2){for(let y=G+1;y<G+9;y++)col(y,AIR);
    if(riverAt(x+0.5,z+0.5,RIV_W+2)){col(G,PLANKS);if(Math.abs(o-16)>1.6)col(G+1,METAL);return;}   // a bridge over a river
    col(G,GRAVEL);col(G-1,DIRT);return;}
  // the stations: a platform beside the line near each end, with a shelter on posts over part of it
  if(e>=28&&e<=62&&o>18.2&&o<=22){for(let y=G+1;y<G+7;y++)col(y,AIR);col(G,CONCRETE);col(G+1,CONCRETE);
    if(e>=38&&e<=52){if(o>21.5&&Math.round(e)%4===0)for(let y=G+2;y<=G+4;y++)col(y,METAL);if(o>18.6)col(G+5,ROOF);if(o>21.5&&Math.round(e)===45){col(G+2,SEAT_B);}}}
}
// ---- powerlines: lines of tall lattice pylons striding across the plains alongside some of the highways (well back
// from the road), the cables sagging between them ----
function pylonsOf(R){
  if(R.pylons)return R.pylons;const out=[];R.pylons=out;if(TEST_OFF.has('pylons'))return out;
  if(R.kind!=='country'||R.L<500)return out;const sx=Math.round(R.pts[0][0]),sz=Math.round(R.pts[0][1]);
  if(hash2(sx*17+3,sz*29+7)>0.45)return out;
  const side=hash2(sx*5+1,sz*3+9)<0.5?1:-1,off=26;
  for(let s=60;s<R.L-60;s+=46){const P=rtPointL(R,s),nx=-P.tz*side,nz=P.tx*side,x=Math.round(P.x+nx*off),z=Math.round(P.z+nz*off);
    let ok=true;for(const [a,b] of [[0,0],[-3,-3],[3,3],[-3,3],[3,-3]]){const qx=x+a,qz=z+b,px=Math.floor(qx/CELL),pz=Math.floor(qz/CELL);
      if(settlementAt(px,pz)||seaPlot(px,pz)||railNear(qx,qz)<5||roadNear(qx,qz,0)<3||farmK(px,pz)!==null||castleAt(px,pz)||dumpAt(px,pz)!==null||bunkerAt(px,pz)||farmLaneCol(qx,qz)||bigPlainsAt(px,pz)){ok=false;break;}}
    if(!ok){out.push(null);continue;}
    const ax=Math.abs(P.tx)>Math.abs(P.tz)?'z':'x';   // (the crossarm runs across the line)
    out.push({x,z,ax,h0:Math.max(0,plainsH(x,z)),key:'py'+x+','+z});}
  return out;
}
const pyIdx=new Map();
function pylonsNear(x,z){
  const k=Math.floor(x/64)*100003+Math.floor(z/64);let L=pyIdx.get(k);if(L)return L;L=[];if(pyIdx.size>4000)pyIdx.clear();
  const X=Math.floor(x/64)*64,Z=Math.floor(z/64)*64,RL=routesNearBox(X-40,Z-40,X+104,Z+104),seen=new Set();
  for(let q=0;q<RL.length;q+=2){const R=RL[q];if(seen.has(R))continue;seen.add(R);for(const p of pylonsOf(R))if(p&&p.x>=X-4&&p.x<X+68&&p.z>=Z-4&&p.z<Z+68)L.push(p);}
  pyIdx.set(k,L);return L;
}
function pylonColumn(col,x,z){
  for(const p of pylonsNear(x,z)){const u=x-p.x,v=z-p.z;if(Math.abs(u)>3||Math.abs(v)>3)continue;
    const a=p.ax==='x'?u:v,c=p.ax==='x'?v:u,base=G+p.h0;
    for(let y=G+1;y<=base;y++)col(y,DIRT);
    for(let k=1;k<=19;k++){const y=base+k;
      if(k<=16&&Math.abs(a)===1&&Math.abs(c)===1)col(y,METAL);
      else if(k<=16&&k%4===0&&Math.abs(a)<=1&&Math.abs(c)<=1&&(Math.abs(a)===1||Math.abs(c)===1))col(y,METAL);
      else if(k===16&&c===0&&Math.abs(a)<=3)col(y,METAL);
      else if(k>16&&a===0&&c===0)col(y,METAL);}
    return;}
}
// ---- garbage dumps: now and then, a block of the plains right on the edge of a place is the town dump, its gate
// facing the town. dumpAt: the side the town is on (0 -x, 1 +x, 2 -z, 3 +z), or null ----
const dumpC=new Map();
// A garbage dump: four blocks by four, out past the last houses, where one of the town's streets comes to an end. That
// street carries on through a gate as a gravel road into the middle of it.
const dumpSC=new Map();
function dumpSite(ax,az){
  const k=ax*100003+az;let v=dumpSC.get(k);if(v!==undefined)return v;dumpSC.set(k,null);v=null;   // (null while it's worked out)
  if(hash2(ax*389+11,az*167+3)<0.22){
    let ok=true;
    for(let i=0;i<4&&ok;i++)for(let j=0;j<4&&ok;j++){const px=ax+i,pz=az+j;if(biomeOf(px,pz)!=='plains'||railPlot(px,pz)||bigPlainsAt(px,pz)||plotNearLines(px,pz,4)||farmK(px,pz)!==null||rivPlotNear(px,pz)||[[4,4],[28,4],[4,28],[28,28],[16,16]].some(([a,b])=>tsAt(px*CELL+a,pz*CELL+b)))ok=false;}
    // a street ending at one of its sides: (side, i) -- 0 low x, 1 high x, 2 low z, 3 high z; i blocks along that side
    if(ok)for(const i of [1,2,0,3]){if(v)break;for(let side=0;side<4&&!v;side++){
      const open=side===0?segBase(ax-1,az+i,1):side===1?segBase(ax+4,az+i,1):side===2?segBase(ax+i,az-1,0):segBase(ax+i,az+4,0);
      if(open)v={ax,az,side,i};}}
  }
  dumpSC.set(k,v);return v;
}
function dumpAt(px,pz){
  if(TEST_OFF.has('dump'))return null;
  return dumpSite(Math.floor(px/4)*4,Math.floor(pz/4)*4);
}
// the street's last junction, right on the dump's high side: paved through to the gate
function dumpGateAt(ix,iz){
  if(TEST_OFF.has('dump'))return false;
  const A=dumpSite(Math.floor((ix-1)/4)*4,Math.floor(iz/4)*4);if(A&&A.side===1&&A.ax+4===ix&&A.az+A.i===iz)return true;
  const B=dumpSite(Math.floor(ix/4)*4,Math.floor((iz-1)/4)*4);return !!B&&B.side===3&&B.az+4===iz&&B.ax+B.i===ix;
}
function dumpColumn(a,col,px,pz,rx,rz,lx,lz,x,z){
  const D=dumpAt(px,pz),SZ=4*CELL,U=x-D.ax*CELL,V=z-D.az*CELL,hs=(k,n)=>hash2(D.ax*(7+k)+n*3,D.az*(11+k)+n*5);
  col(G-1,DIRT);col(G,(U*3+V)%5===0?DIRT:GRAVEL);for(let y=G+1;y<G+18;y++)col(y,AIR);
  // d: how far in from the gate's side; w: along that side; g: the road's near edge along it (it lines up with the street outside)
  const d=D.side===0?U:D.side===1?SZ-1-U:D.side===2?V:SZ-1-V,w=D.side<2?V:U,g=D.i*CELL,road=w>=g&&w<g+ROADW&&d<92;
  // the fence, with the gate where the road comes through
  if(U===0||V===0||U===SZ-1||V===SZ-1){if(d===0&&road)return;for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  if(road){col(G,d<16?ASPHALT:GRAVEL);return;}
  // the sorting shed by the gate: a rusty tin shed, open on the side facing the road
  {const sa=d-6,sb=w-(g+ROADW+2);if(sa>=0&&sa<=18&&sb>=0&&sb<=11){const e=sa===0||sa===18||sb===0||sb===11;col(G,CONCRETE);if(e&&sb!==0)for(let y=G+1;y<=G+5;y++)col(y,RUST);col(G+6,METAL);if(!e&&(U+V)%3===0)col(G+1,CRATE);return;}}
  // the weighbridge hut on the other side of the road
  {const sa=d-5,sb=g-3-w;if(sa>=0&&sa<=4&&sb>=0&&sb<=3){col(G,CONCRETE);const e=sa===0||sa===4||sb===0||sb===3;if(e){for(let y=G+1;y<=G+3;y++)col(y,y===G+2&&sa===2?GLASS:PAINT_WHITE);}col(G+4,METAL);return;}}
  // great mounds of rubbish: dirt and gravel, bin bags, crates, scrap, a few things that were once bright colours
  let h=0;for(let i=0;i<16;i++){const mx=10+hs(0,i)*(SZ-20),mz=10+hs(1,i)*(SZ-20),rr=9+hs(2,i)*9,top=6+hs(3,i)*8,q=Math.hypot(U-mx,V-mz);h=Math.max(h,top*(1-(q/rr)**2));}
  // (kept off the road and clear of the yard by the gate)
  {const off=Math.abs(w-(g+ROADW/2))-ROADW/2;if(d<26&&off<22)h=0;else if(d<96&&off<6)h=Math.min(h,off*0.8);else if(d<96)h=Math.min(h,Math.max(0,off*0.9));}
  h=Math.floor(h+hash2(x*5+1,z*7+3)*1.6);
  const JUNK=[GRAVEL,GRAVEL,DIRT,PAINT_DARK,PAINT_DARK,CRATE,RUST,PAINT_GREEN,PLANKS,METAL,PAINT_WHITE,PAINT_BLUE];
  for(let y=1;y<=h&&y<17;y++)col(G+y,JUNK[Math.floor(hash2(x*31+y*7,z*17+y*3)*JUNK.length)]);
  // bulldozers parked on the flat, by the road's far end
  for(const [ba,bb] of [[96,-2],[100,10],[84,-12],[88,14]]){const u=d-ba,v=w-(g+bb);if(u<0||u>2||v<-1||v>3||h>0)continue;
    if(v===-1){col(G+1,METAL);col(G+2,METAL);return;}   // the blade
    col(G+1,PAINT_DARK);if(v>=0&&v<=2&&u<=2){col(G+2,PAINT_YELLOW);if(v>=1&&u>=0&&u<=2)col(G+3,u===1?GLASS:PAINT_YELLOW);if(v>=1)col(G+4,PAINT_YELLOW);}return;}
}
// ---- farms: out on the plains, a block or few to either side of a country highway, with a straight gravel lane
// (north or south) out to it ----
const farmC=new Map(),farmCand=(px,pz)=>hash2(px*19+5,pz*23+7)<0.1&&biomeOf(px,pz)==='plains';
// a farm on block (px,pz): {s (-1: its road is to the north, 1: to the south), zEnd (where its lane meets the road's
// edge)} or null. Which way is tried first is down to the farm; the lane must cross only open plains (no river, no
// other farm, no town) and reach a country highway within four blocks.
function farmK(px,pz){
  if(TEST_OFF.has('farm'))return null;
  const key=px*100003+pz;let v=farmC.get(key);if(v!==undefined)return v;v=null;
  if(farmCand(px,pz)&&!plotNearLines(px,pz,6)&&![[4,4],[28,4],[4,28],[28,28],[16,16]].some(([a,b])=>tsAt(px*CELL+a,pz*CELL+b))){
    const x=px*CELL+PC;
    const tryDir=s=>{
      for(let z=s<0?pz*CELL-1:(pz+1)*CELL,n=0;n<64;z+=s*2,n++){
        const qz=Math.floor(z/CELL);if(qz!==pz&&(biomeOf(px,qz)!=='plains'||farmCand(px,qz)))return null;
        const R=routeAt(x,z,10);if(R&&R.R.kind!=='country')continue;
        if(R&&R.d<7.5)return{s,zEnd:z};
        const W=riverAt(x,z,RIV_W+6);if(W&&W.d<RIV_W+5)return null;}
      return null;};
    const first=hash2(px*41+9,pz*13+2)<0.5?-1:1;
    v=tryDir(first)||tryDir(-first);
  }
  farmC.set(key,v);return v;
}
// does a farm lane cross block (px,pz)? {z0,z1}: the stretch of it in this block (along column PC), or false
function farmLane(px,pz){
  for(let e=1;e<=3;e++){const F=farmK(px,pz+e);if(F&&F.s<0&&F.zEnd<(pz+1)*CELL)return{z0:Math.max(pz*CELL,F.zEnd),z1:(pz+1)*CELL,zEnd:F.zEnd};}
  for(let e=1;e<=3;e++){const F=farmK(px,pz-e);if(F&&F.s>0&&F.zEnd>=pz*CELL)return{z0:pz*CELL,z1:Math.min((pz+1)*CELL,F.zEnd+1),zEnd:F.zEnd};}
  return false;}
const farmNorth=(px,pz)=>{const F=farmK(px,pz);return!!F&&F.s>0;};   // its road is south of it: laid out the other way round
// is column (x,z) on a farm lane (including the flare where it meets the road)?
function farmLaneCol(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),L=farmLane(px,pz);if(!L)return false;
  const dx=Math.abs(x+0.5-(px*CELL+PC)),dz=Math.abs(z-L.zEnd);
  return z>=L.z0&&z<L.z1&&(dx<=1||dz<=4&&dx<=1+(4-dz)+0.5);
}
// ---- farmland: some farms have big fields or orchards in the open plains beside them (and behind, away from the
// road), fenced round the outside. Which blocks, and what's grown, is down to the farm. ----
const fieldC=new Map();
function farmlandSpec(fx,fz){
  // (each farm works 4 to 6 blocks each way, running back from its road: it's cut short only by what's in the way)
  const r=n=>hash2(fx*37+n*11,fz*53+n*7),W=4+Math.floor(r(5)*3),w=Math.floor(r(4)*W);
  return{kind:r(2)<0.55?'crop':'orchard',crop:r(3)<0.5?0:1,w,e:W-1-w,depth:4+Math.floor(r(6)*3)};
}
const fieldFree=(px,pz)=>dumpAt(px,pz)===null&&!castleAt(px,pz)&&!bigPlainsAt(px,pz)&&biomeOf(px,pz)==='plains'&&farmK(px,pz)===null&&!farmLane(px,pz)&&!plotNearLines(px,pz,4)&&![[4,4],[28,4],[4,28],[28,28],[16,16]].some(([a,b])=>tsAt(px*CELL+a,pz*CELL+b));
// the farmland on block (px,pz): {kind,crop,fx,fz} or null
function farmlandOf(px,pz){
  const key=px*100003+pz;let v=fieldC.get(key);if(v!==undefined)return v;v=null;
  if(fieldFree(px,pz))
    for(let dx=-5;dx<=5&&!v;dx++)for(let dz=-5;dz<=5&&!v;dz++){const fx=px-dx,fz=pz-dz;if(farmK(fx,fz)===null)continue;
      const S=farmlandSpec(fx,fz);if(!S)continue;const bz=farmNorth(fx,fz)?-1:1;   // 'behind': away from the road
      if(dx<-S.w||dx>S.e)continue;{const bk=dz*bz;if(bk<0||bk>=S.depth)continue;}if(dx===0&&dz===0)continue;
      v={kind:S.kind,crop:S.crop,fx,fz};}
  fieldC.set(key,v);return v;
}
const PLAINS_OPEN=(px,pz)=>biomeOf(px,pz)==='plains'&&farmK(px,pz)===null&&!farmlandOf(px,pz)&&dumpAt(px,pz)===null&&!castleAt(px,pz)&&!bunkerAt(px,pz)&&!bigPlainsAt(px,pz)&&!caveMouth(px,pz)&&!turbineAt(px,pz);
// close to a highway's line or a farm lane out on the plains (keep it flat, keep the trees off)
function roadNear(x,z,pad){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);let e=1e9;
  {const R=routeAt(x,z,40);if(R)e=Math.min(e,R.d-9.6);}
  {const W=riverAt(x,z,40);if(W)e=Math.min(e,W.d-RIV_W-4);}
  {const k=Math.floor(x/16)*100003+Math.floor(z/16);if(!tsC.has(k))tsAt(x,z);for(const T of tsC.get(k)||[]){const dx=x+0.5-T.cx,dz=z+0.5-T.cz,u=dx*T.tx+dz*T.tz,v=dx*T.nx+dz*T.nz;
     e=Math.min(e,Math.hypot(Math.max(0,Math.abs(u)-46),Math.max(0,v-60,6.5-v))-2);}}
  {const L=farmLane(px,pz);if(L&&z>=L.z0-2&&z<L.z1+2)e=Math.min(e,(Math.abs(x-(px*CELL+PC-0.5))-1)*14/(pad||8));}
  e=Math.min(e,linkNear(x,z));
  return e;
}
function plainsH(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);if(!PLAINS_OPEN(px,pz))return 0;
  const rx=x-px*CELL,rz=z-pz*CELL;let f=1;
  f=Math.min(f,Math.max(0,roadNear(x,z))/14);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){if(!dx&&!dz||PLAINS_OPEN(px+dx,pz+dz))continue;
    const ex=dx<0?rx:dx>0?CELL-1-rx:0,ez=dz<0?rz:dz>0?CELL-1-rz:0;f=Math.min(f,Math.max(dx?ex:0,dz?ez:0)/14);}
  const n=(Math.sin(x*0.043+1.7)+Math.sin(z*0.051+0.4)+Math.sin((x+z)*0.029+2.3)*0.8+Math.sin((x-z)*0.037+0.9)*0.6)/3.4;
  const h=(n+0.3)*4.4*f;
  return h<-0.9?-1:Math.max(0,Math.round(h));
}
