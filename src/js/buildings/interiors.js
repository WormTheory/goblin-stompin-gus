// ---- bathrooms: a walled room in a corner, clear of the stairs and the doors, a small part of the floor. They're secondary to
// what the building is for: one to an establishment on its ground floor (two only on a vast floor), one to a flat or a
// house (upstairs in a two-storey one), and in offices and wards one every third floor. ----
const WC_ROOMS=new Set(['diner','pizza','cafe','fastfood','sitdown','bar','soup','books','dentist','dispo','guns','dealer','armory','shop','market','drug','bigbox','grocery','ikea','office','lobby','bank','news','radio','stocks','school','library','police','firehall','courtroom','museum','aquarium','cinema','theater','disco','club','casino','factory','lab','barracks','terminal','stage','hosp','ward','lecture','mission','turbine','apartment']);
// (which side of a flat its bedroom and bathroom go: the wall away from any stairs in it)
const flats4=(I,J)=>I>=9&&J>=12&&I*J>=260;   // (four flats to a floor, or two; each with room for its own bathroom)
function flatBack(b,y0,y1,ez0){const S=b.stair;if(!S||S.ax!=='x')return 1;const c=(S.c0+S.c1)/2-ez0-1;return c>=y0&&c<y1&&c>(y0+y1)/2?-1:1;}
function wcRooms(b,I,J,n,ex0,ez0,fl,ex1,ez1,px,pz){
  const c=b._wc||(b._wc=new Map());let L=c.get(n);if(L)return L;L=[];c.set(n,L);L.ex0=ex0;L.ez0=ez0;
  // (always judged at the same height of the floor, so a building worked out again, or met from another chunk, picks the same corner)
  fl=n===0?2:(b.gf||FH)+FH*(n-1)+2;flo(b,fl);
  const kd=n===0?b.ground:b.kind;if(!WC_ROOMS.has(kd)||b.noIndoor||b.style!=='normal'&&b.style!=='house'||kd==='shop'&&!b.brand&&!b.station&&b.kind==='shop'||kd==='firehall')return L;
  if(b.decay||n>0&&!(kd==='apartment'||kd==='office'&&n%3===2||kd==='ward'&&n%3===2)||b.detailTop&&(n===0?G+1:G+(b.gf||FH)+1+FH*(n-1))>=b.detailTop)return L;
  if(b.home&&n!==(b.stair?1:0))return L;
  if(b.station){L.push(I<J?{u0:0,u1:Math.min(I,4),v0:J-3,v1:J,dv:0,home:true}:{u0:I-3,u1:I,v0:0,v1:Math.min(J,4),dside:-1,home:true});return L;}
  if(Math.min(I,J)<5||I*J<36)return L;
  const S=b.stair,area=I*J,big=area>1500,w=b.home?(area>=90?5:4):area>500?7:area>=100?5:area>=60?4:3,h=b.home?(area>=140?5:area>=90?4:3):area>500?5:area>=150?4:3,tr=ex0-b.x0,cxI=((b.x0+b.x1)>>1)-ex0-1,czJ=((b.z0+b.z1)>>1)-ez0-1,st=STRUCT;
  const hitsStair=(u0,u1,v0,v1)=>{for(const S of [b.stair,b.stair2]){if(!S)continue;const x0=u0+ex0+1,x1=u1+ex0+1,z0=v0+ez0+1,z1=v1+ez0+1,rx0=S.ax==='x'?S.r0-2:S.c0-1,rx1=S.ax==='x'?S.r0+S.L+2:S.c1+1,rz0=S.ax==='x'?S.c0-1:S.r0-2,rz1=S.ax==='x'?S.c1+1:S.r0+S.L+2;if(x0<rx1&&x1>rx0&&z0<rz1&&z1>rz0)return true;}return false;};
  // flats: one each, in whichever corner of the flat is clear of the stairs and their landing
  if(kd==='apartment'&&!b.home&&b.ground!=='firehall'&&b.style==='normal'){
    const cu=I>>1,cv=J>>1,clear=(u0,u1,v0,v1)=>{if(!S)return true;const x0=u0+ex0+1,x1=u1+ex0+1,z0=v0+ez0+1,z1=v1+ez0+1,al=S.ax==='x',a0=al?x0:z0,a1=al?x1:z1,c0=al?z0:x0,c1=al?z1:x1;return!(a0<S.r0+S.L+3&&a1>S.r0-3&&c0<S.c1+3&&c1>S.c0-3);},   // (well clear of the stairs, and of the way round them)
      put=(x0,x1,y0,y1)=>{const bk=flatBack(b,y0,y1,ez0);for(const H of [3])for(const [u0,v0,dv] of bk>0?[[x1-4,y1-H,0],[x0,y1-H,0],[x1-4,y0,1],[x0,y0,1]]:[[x1-4,y0,1],[x0,y0,1],[x1-4,y1-H,0],[x0,y1-H,0]]){if(clear(u0,u0+4,v0,v0+H)){L.push({u0,u1:u0+4,v0,v1:v0+H,dv,home:true});return;}}};
    if(flats4(I,J)){put(0,cu,0,cv-2);put(cu+1,I,0,cv-2);put(0,cu,cv+2,J);put(cu+1,I,cv+2,J);}
    else if(I>=12){put(0,cu,0,J);put(cu+1,I,0,J);}
    else put(0,I,0,J);
    return L;
  }
  const hitsDoor=(u0,u1,v0,v1)=>b.door===2?v0<2&&cxI+3>u0&&cxI-2<u1:b.door===3?v1>J-2&&cxI+3>u0&&cxI-2<u1:b.door===0?u0<2&&czJ+3>v0&&czJ-2<v1:u1>I-2&&czJ+3>v0&&czJ-2<v1;
  const score=(u0,u1,v0,v1)=>{let n2=0;for(let u=u0;u<u1;u+=1)for(let v=v0;v<v1;v+=1){const a=furnRaw(b,u+ex0+1,v+ez0+1,fl,ex0,ex1,ez0,ez1,px,pz);if(a!==AIR)n2++;}
    const backward=b.door===2?v0>0:b.door===3?v0===0:b.door===0?u0>0:u0===0;const du=(u0+u1)>>1,dv2=v0===0?v1:v0-1;let shut=dv2<0||dv2>=J?400:0;if(!shut)for(const d of [dv2,v0===0?dv2+1:dv2-1])if(d>=0&&d<J){for(const f2 of [fl-1,fl,fl+1]){flo(b,f2);if(furnRaw(b,du+ex0+1,d+ez0+1,f2,ex0,ex1,ez0,ez1,px,pz)!==AIR)shut+=200;}}flo(b,fl);if(S&&!shut&&hitsStair(du,du+1,dv2,dv2+1))shut=400;return n2+shut+(backward?0:1);};
  // (the four corners; if the stairs and the door rule them all out, a smaller room, then a spot along a wall)
  const at=(W,H)=>[[0,W,0,H],[I-W,I,0,H],[0,W,J-H,J],[I-W,I,J-H,J]],custFront=b.eat||kd==='dentist'||kd==='guns',ok=q=>!hitsStair(...q)&&!hitsDoor(...q)&&(!custFront||(b.door===3?q[3]===J:q[2]===0));   // (customers shouldn't have to go through the kitchen or the surgery)
  let cs=at(w,h).filter(ok);if(!cs.length)cs=at(3,3).filter(ok);if(!cs.length&&J>=8){const m=(J>>1)-2;cs=[[0,4,m,m+4],[I-4,I,m,m+4]].filter(ok);}
  if(!cs.length&&!custFront)cs=at(3,3).filter(q=>!hitsStair(...q));   // (a small corner still leaves a three-wide door clear)
  const cands=cs.map(q=>[score(...q),q]).sort((a,c)=>a[0]-c[0]);
  STRUCT=st;
  if(cands.length){const clearAt=(u,v)=>{if(u<0||v<0||u>=I||v>=J)return false;for(const f2 of [fl-1,fl,fl+1]){flo(b,f2);if(furnRaw(b,u+ex0+1,v+ez0+1,f2,ex0,ex1,ez0,ez1,px,pz)!==AIR){flo(b,fl);return false;}}flo(b,fl);return true;};
    const pick=q=>{const R={u0:q[0],u1:q[1],v0:q[2],v1:q[3],dv:q[2]===0?1:0,big};L.push(R);
      // (if the way out of that wall's blocked, a door in the side wall instead)
      const d=wcDoor(R),o=R.dv?d[1]+1:d[1]-1,o2=R.dv?o+1:o-1;if(!clearAt(d[0],o)||!clearAt(d[0],o2)){let done=false;for(const sd of [1,-1]){for(let v=q[2]+1;v<q[3]-1&&!done;v++){const ou=sd>0?q[1]:q[0]-1;if(clearAt(ou,v)&&clearAt(ou+sd,v)&&!hitsStair(ou,ou+1,v,v+1)){R.dside=sd;R.dc=v;done=true;}}if(done)break;}}};pick(cands[0][1]);if(big&&cands.length>1){const far=cands.filter(k=>k[1][0]!==cands[0][1][0]&&k[0]<20)[0];if(far)pick(far[1]);}}
  return L;
}
// (the rooms of floor n, for anything that isn't building the walls: props and door leaves)
function wcOf(b,n,px,pz){
  const gf=b.gf||FH,y0=n===0?G+1:G+gf+1+FH*(n-1),tr=b.tier>0&&(b.x1-b.x0)>=8&&y0>b.tier?2:0,ex0=b.x0+tr,ez0=b.z0+tr,ex1=b.x1-tr,ez1=b.z1-tr;
  return wcRooms(b,ex1-ex0-2,ez1-ez0-2,n,ex0,ez0,0,ex1,ez1,px,pz);
}
// a cell of one of those rooms: its wall, the way in, or air
function wcDoor(R){return R.dside?[R.dside<0?R.u0:R.u1-1,R.dc!==undefined?R.dc:(R.v0+R.v1)>>1]:[(R.u0+R.u1)>>1,R.dv?R.v1-1:R.v0];}
function wcBlock(b,R,iu,iv,level){
  const onV=iv===R.v0||iv===R.v1-1,onU=iu===R.u0||iu===R.u1-1;if(!onV&&!onU)return AIR;
  // walls of the building's own stuff, right up to the ceiling; a proper door in one of them
  const dr=wcDoor(R),door=iu===dr[0]&&iv===dr[1];
  if(door&&level<=2)return level===1?DOOR_WK:DOOR_W;
  return b.wall===GLASS?CONCRETE:b.wall;
}
// (the furniture itself is mostly props now, not blocks: furnTurns says which pieces, furnProps sets them out)
function furniture(b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz){
  if(!b._fp){b._fp=[px,pz];FURN_SEEN.add(px+','+pz+','+b.x0+','+b.z0);}
  {flo(b,fl);const n=FL_NO,lv=FL_LVL,iu=rx-ex0-1,iv=rz-ez0-1,W=wcRooms(b,ex1-ex0-2,ez1-ez0-2,n,ex0,ez0,fl,ex1,ez1,px,pz);for(const R of W)if(iu>=R.u0&&iu<R.u1&&iv>=R.v0&&iv<R.v1)return wcBlock(b,R,iu,iv,lv);flo(b,fl);}
  const v=furnRaw(b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz);
  if(b.kind==='ward'||!FURN_IDS.has(v))return v;
  const st=STRUCT,t=furnTurns(v,b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz);STRUCT=st;
  return t?AIR:v;
}
// (which buildings have been furnished. Kept apart from the buildings, since a plot forgotten and worked out again gets
// new ones while its chunks stay, and its rooms would come up empty.)
const FURN_SEEN=new Set();
const FURN_IDS=new Set([SOFA,BED,FRIDGE,SHELF,CRATE,LEAVES,SCREEN,PLANKS]);
const SHOP_ROOMS=new Set(['shop','books','dentist','dispo','guns','dealer','armory','grocery','market','drug','bigbox','ikea']);
// rooms in a row or rows between x0 and x1, each row with a corridor in front of it (corr wide), its door opening on that
function roomGrid(x0,x1,y0,y1,colW,rowH,corr,kinds,start){
  const out=[];let n=start||0;
  for(let y=y0;y+corr+Math.min(rowH,4)<=y1;){const v0=y+corr,left=y1-v0,h=left<rowH+corr+Math.min(rowH,4)?left:rowH;
    const nc=Math.max(1,Math.floor((x1-x0)/colW)),w=(x1-x0)/nc;
    for(let c=0;c<nc;c++){out.push({u0:Math.round(x0+c*w),u1:Math.round(x0+(c+1)*w),v0,v1:v0+h,k:kinds[n++%kinds.length]});}
    y=v0+h;}
  return out;
}
const roomAt=(L,u,v)=>{for(const R of L)if(u>=R.u0&&u<R.u1&&v>=R.v0&&v<R.v1)return R;return null;};
// a room's wall block at a cell in it (its door left open, in the wall towards its corridor), or -1 for inside it
function roomWall(R,u,v,level){
  if(u!==R.u0&&u!==R.u1-1&&v!==R.v0&&v!==R.v1-1)return -1;
  if(v===R.v0&&u>R.u0&&u<R.u1-1&&Math.abs(u-((R.u0+R.u1)>>1))<=1&&level<=2)return AIR;
  return PAINT_WHITE;
}
// a police station's rooms: a lobby across the front, a hall up the middle from the doors, rooms either side
const POL_G=['cells','armory','evidence','break','interview','squad','locker','squad','squad','evidence','cells','squad'],POL_U=['squad','break','evidence','squad','interview','locker','squad','squad','armory','squad'];
function policeRooms(b,I,J,n){
  const c=b._pr||(b._pr=new Map());let L=c.get(n);if(L)return L;
  const big=J>=14||I>=24,front=big?Math.min(8,Math.floor(J*.4)):Math.min(3,Math.floor(J*.34)),cu=I>>1,colW=big?11:9,rowH=big?8:J-front,corr=big?2:0,K=n===0?POL_G:POL_U,y0=n===0?front:big?2:0;
  L=[...roomGrid(0,cu-2,y0,J,colW,rowH,corr,K,n),...roomGrid(cu+3,I,y0,J,colW,rowH,corr,K,n+(n===0?1:3))];
  c.set(n,L);return L;
}
// a big hospital's ground floor: more rooms behind the lobby, and behind the emergency department
function hospRooms(b,I,J){
  if(b._hr)return b._hr;const E=b.er,cu=I>>1;let L=[];
  if(J>=24&&(!E||E.mode==='front')){
    const uR=E?E.u0:cu+3,vL=20;
    L=roomGrid(13,cu-2,vL,J,7,J-vL-2,2,['pharmacy','xray','exam','lab','exam','gift']);
    L.push(...roomGrid(0,8,1,vL-1,8,5,1,['admissions','chapel','gift']));   // (and down the far side of the lobby, opening on to it)
    if(!E)L.push(...roomGrid(cu+3,I,vL,J,7,J-vL-2,2,['exam','lab','exam','supply','staff','ct']));
    else if(J-E.v1>=5)L.push(...roomGrid(uR+1,I,E.v1+1,J,8,J-E.v1-1,0,['ct','supply','staff','exam','xray','lab']));
  }
  return b._hr=L;
}
// (a hospital's upper floors, in turn: wards, private rooms, operating theatres. Small ones are all wards.)
function hospFloor(b,n){return n>0&&b.x1-b.x0>=20&&b.z1-b.z0>=16?n%3===1?0:n%3===2?1:2:0;}
const CIVIC_ROOMS=new Set(['school','library','police','firehall','cells','courtroom']);
const WORK_ROOMS=new Set(['office','lobby','bank','radio','news','stocks']);
function roomFloor(b,rz){return VENUE_ROOMS.has(b.ground)?b.floor:b.eat?(rz>=b.z1-(b.eatTile||6)?FLOORT:b.floor):SHOP_ROOMS.has(b.ground)||CIVIC_ROOMS.has(b.ground)&&b.ground!=='firehall'&&b.ground!=='cells'||WORK_ROOMS.has(b.ground)&&b.floor!==PLANKS?b.floor:0;}
function furnTurns(v,b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz){
  if(v===SOFA||v===BED||v===FRIDGE||v===SHELF)return true;
  flo(b,fl);const lvl=FL_LVL,top=(FL_NO===0?(b.gf||FH)-2:FH-2);
  const at=(x,z,f)=>furnRaw(b,x,z,f,ex0,ex1,ez0,ez1,px,pz),below=lvl>0?at(rx,rz,fl-1):AIR,above=lvl<top?at(rx,rz,fl+1):AIR;
  if(v===CRATE)return below===SHELF;   // (goods on top of a shelf go with it. A crate on its own is a crate.)
  if(v===LEAVES)return lvl===0||lvl===1&&below===LEAVES;
  // a screen by itself, on something: a monitor. (A stack of them, or one high up, is a video wall and stays.)
  if(v===SCREEN)return lvl>=1&&lvl<=2&&below!==SCREEN&&above!==SCREEN&&below!==AIR;
  // planks on the floor, not part of a big platform: a table or a counter
  if(lvl!==0)return false;
  if(above!==AIR&&!(above===SCREEN&&furnTurns(SCREEN,b,rx,rz,fl+1,ex0,ex1,ez0,ez1,px,pz)))return false;
  let n=0;for(let i=-1;i<=1;i++)for(let k=-1;k<=1;k++)if((i||k)&&rx+i>ex0&&rx+i<ex1-1&&rz+k>ez0&&rz+k<ez1-1&&at(rx+i,rz+k,fl)===PLANKS)n++;
  return n<5;
}
// (no pillars in the way along the side of a flight of stairs: that's how you get round to its far end)
function byStairs(b,rx,rz){const S=b.stair;if(!S)return false;const c=S.ax==='x'?rz:rx;return c>=S.c0-4&&c<S.c1+4;}
function furnRaw(b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz){
  const W=ex1-ex0,D=ez1-ez0,I=W-2,J=D-2,iu=rx-ex0-1,iv=rz-ez0-1;
  flo(b,fl);const level=FL_LVL,floorNo=FL_NO,kind=floorNo===0?b.ground:b.kind;
  if(floorNo===0){const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;if((kind==='diner'||kind==='pizza'||kind==='cafe'||kind==='fastfood'||kind==='sitdown'||kind==='drug'||kind==='bar'||kind==='soup'||kind==='cinema'||kind==='bank'||kind==='news'||kind==='disco'||kind==='club'||kind==='dealer'||kind==='theater'||kind==='stocks'||kind==='ikea'||kind==='museum'||kind==='aquarium'||kind==='casino'||kind==='school'||kind==='factory'||kind==='lecture'||kind==='cells'||kind==='lab'||kind==='turbine'||kind==='stage'||kind==='barracks'||kind==='terminal'||kind==='mission')?iv<=0&&Math.abs(rx-cx)<=1:(b.door<2&&Math.abs(rz-cz)<=1)||(b.door>=2&&Math.abs(rx-cx)<=1))return AIR;}

  const h=hash2(px*977+rx*31+floorNo*7,pz*613+rz*17+floorNo*3);
  switch(kind){
    case 'lobby':
      if(iu%4===1&&iv%4===1&&!byStairs(b,rx,rz))return CONCRETE;   // (the pillars. The rest is props: see workRoom.)
      return AIR;
    case 'office':
      if(iu%4===1&&iv%4===1&&!byStairs(b,rx,rz))return CONCRETE;
      // a glass meeting room in the corner, when the floor's big enough
      if(I>=12&&J>=12&&level<=2&&(iu===I-6&&iv<=1||iv===4&&iu>=I-3))return GLASS;
      return AIR;
    case 'apartment':
      if(b.home){
        // a house's inside walls: left of the hall a living room, right of it the kitchen and, behind that, a bedroom;
        // upstairs (or in a big house) a bedroom each side and a bathroom
        const cu=I>>1,fv=b.door===3?J-1-iv:iv,lf=iu<cu-1,rt=iu>cu+1,up=floorNo>0;
        const sp=J>=9?J>>1:2;if(rt&&fv===sp&&!(b.stair&&floorNo===0)&&iu!==cu+3&&iu!==cu+4&&iu!==cu+5)return SIDING;if(lf&&J>=9&&floorNo===0&&fv===sp&&iu!==cu-3&&iu!==cu-4&&iu!==cu-5)return SIDING;
        if(up&&lf&&fv===sp&&iu!==cu-3&&iu!==cu-4&&iu!==cu-5&&J>=5)return SIDING;
        if(iu===cu-2&&(fv===0||fv===J-1))return SIDING;
        if(iu===cu+2&&(fv===0||fv===J-1)&&!(b.stair&&fv>=J-2))return SIDING;
        return AIR;}
      // a floor of flats: a corridor across the middle, a flat at each corner of it, a door each. (Too small for that: one flat.)
      if(I>=12&&!flats4(I,J)&&b.ground!=='firehall'&&iu===(I>>1)&&iv>0&&!(Math.abs(iv-(J>>1))<=1&&level<=2))return level<=3?PAINT_WHITE:AIR;
      if(flats4(I,J)&&b.ground!=='firehall'){const cu=I>>1,cv=J>>1;
        if(iv===cv-2||iv===cv+1)return level<=2&&Math.abs(iu-(I>>2))<=1||level<=2&&Math.abs(iu-cu-(I>>2))<=1?AIR:PAINT_WHITE;
        if(iu===cu&&iv!==cv-1&&iv!==cv)return PAINT_WHITE;}
      return AIR;
    case 'shop':
      return AIR;   // (props: see shopRoom)
    case 'police':
      // the rooms' walls: a door in each onto its corridor. (Their furniture: see civicRoom.)
      {const R=roomAt(policeRooms(b,I,J,floorNo),iu,iv);if(R){const w=roomWall(R,iu,iv,level);if(w!==-1)return w;
        // the holding cells: a row along the back of the room, walled apart, barred fronts with a way into each
        if(R.k==='cells'&&R.v1-R.v0>=7){const cv=R.v1-5,c=(iu-R.u0)%3;if(iv===cv)return c===2&&level<=2?AIR:level===0||level===3||iu%2===0?METAL:AIR;if(iv>cv&&c===0)return CONCRETE;}}}
      return AIR;
    case 'hosp':{
      // the main lobby (left of the doors): an L-shaped reception desk with monitors and a lit sign, rows of
      // waiting seats behind it, plants; the emergency department (right of the doors, behind a partition):
      // a triage desk inside its own entrance, curtained treatment bays round the walls, a nurses' station
      const cu=I>>1,E=b.er,front=E&&E.mode==='front';
      if(E){
        // the ER in its own frame: a runs along its outside wall (the one with its doors), d goes in from that wall
        const inER=front?(iu>E.u0&&iv<E.v1):(iv>E.v0),a=front?iu:iv,d=front?iv:I-1-iu,ea=front?E.door-ex0-1:E.door-ez0-1;
        const aLo=front?E.u0+1:E.v0+1,aHi=front?I:J,depth=front?E.v1:I;
        // the partition, with a red EMERGENCY sign over the way through from the lobby
        if(front&&((iu===E.u0&&iv<E.v1)||(iv===E.v1&&iu>=E.u0))){const gap=iu===E.u0&&iv>=7&&iv<=9;return gap?(level<3?AIR:level===3?NEON_R:HOSPW):HOSPW;}
        if(!front&&iv===E.v0){if(Math.abs(iu-cu)<=1)return level===3?NEON_R:AIR;return HOSPW;}
        if(inER){
          if(d===0&&Math.abs(a-ea)<=4&&Math.abs(a-ea)>=3&&level===3)return NEON_R;        // EMERGENCY by the doors (on the wall)
          return AIR;   // (the rest of the ER's furnishings are props: see hospProps)
        }
      }
      // (a blue sign hung above the reception desk; the desk, seats and so on are props: see hospProps)
      const d0=Math.max(2,cu-11),d1=cu-2;
      if(iv===7&&iu>=d0+2&&iu<=d1-1&&level===4)return NEON_B;
      {const R=roomAt(hospRooms(b,I,J),iu,iv);if(R){const w=roomWall(R,iu,iv,level);if(w!==-1)return w===PAINT_WHITE?HOSPW:w;}}
      return AIR;}
    case 'books':case 'dispo':case 'dealer':case 'armory':case 'market':case 'drug':case 'bigbox':case 'grocery':return AIR;   // (props: see shopRoom)
    case 'barn':return AIR;
    case 'dentist':
      // the waiting room, a wall with a door, three surgeries behind it
      if(iv===J-5&&!(iu>=I-3&&iu<=I-2&&level<=2))return SIDING;
      if(iv>J-5&&(iu===4||iu===9))return level<=2?SIDING:AIR;
      return AIR;
    case 'guns':
      // the shop, a wall with a door and a window on to it, the range behind: lanes with low walls between
      if(iv===J-5){if(iu>=I-3&&iu<=I-2&&level<=2)return AIR;if(iu>=2&&iu<I-5&&(level===1||level===2))return GLASS;return CONCRETE;}
      if(iv>J-5&&(iu===4||iu===9))return level<=1?CONCRETE:AIR;
      return AIR;
    case 'library':return AIR;   // (props: see civicRoom)
    case 'courtroom':
      // the wall between the lobby and the courtroom (the way through's kept clear)
      if(iv===3&&level<=6)return STONE;
      return AIR;
    case 'cinema':{
      // the lobby across the front: ticket desks either side of the doors, the long snack bar, an arcade corner, posters
      if(iv<=9){
        if(iv===7&&iu>=6&&iu<=I-7&&Math.abs(iu-(I>>1))>2&&level===3)return NEON_R;
        if(iv===9&&level>=2&&level<=4&&iu%6===1)return[PAINT_RED,PAINT_BLUE,PAINT_YELLOW,PAINT_GREEN][(iu/6|0)%4];
        return AIR;}
      // the wall behind the lobby, with the way through to the corridor
      if(iv===10){if(Math.abs(iu-(I>>1))<=2&&level<=3)return AIR;STRUCT=true;return CONCRETE;}
      if(iv<=12)return AIR;   // the corridor to the screens
      // three screening rooms side by side, walls between them; each one's door off the corridor near its back corner
      const R=Math.floor(I/3),k=Math.min(2,Math.floor(iu/R)),u=iu-k*R,Rw=k===2?I-2*R:R;
      if(u===0&&k>0){STRUCT=true;return CONCRETE;}
      if(iv===13){if(u>=2&&u<=4&&level<=3)return AIR;STRUCT=true;return CONCRETE;}
      // the screen across the far wall; the seats stepping up toward the back, an aisle at each side
      if(iv===J-1&&level>=2&&level<=12&&u>=2&&u<=Rw-2)return SCREEN;
      if(iv>=J-5)return AIR;   // (the space in front of the screen)
      const row=J-6-iv,h=Math.min(11,Math.floor(row/2));
      // the way in: from the door at the back, a passage under the raked seats out to the front by the screen
      if(u>=2&&u<=4){if(h>=5){if(level<=3)return AIR;if(level<h)return CONCRETE;return AIR;}if(level<=h)return AIR;}
      if(level<h&&(u>=1||k===0))return CONCRETE;
      if(level===h&&u>=2&&u<=Rw-2&&row%2===0)return SEAT_R;
      return AIR;}
    case 'radio':
      // the studio behind glass; the rest is props (see workRoom)
      if(iv===J-5&&!(iu>=1&&iu<=2&&level<=2))return level<=2&&iu>=3?GLASS:CONCRETE;
      return AIR;
    case 'news':
      if(iv===J-1&&level>=1&&level<=3&&iu>=1&&iu<=I-2)return SCREEN;   // (the wall of screens. Everything else is props.)
      return AIR;
    case 'bank':{
      // the vault at the back, a big room walled in steel and full of gold, its round door half open, in the fortress
      // banks. (The rest of the hall is props: see workRoom.)
      if(b.vault&&iv>=J-6){const vu=iu-((I-6)>>1);
        if(iv===J-6||vu===-1||vu===6){if(iv===J-6&&vu>=2&&vu<=3&&level<=2)return AIR;STRUCT=true;return level<=3?METAL:AIR;}
        if(vu>=0&&vu<=5&&iv>J-6){if(level===0&&(vu+iv)%2===0)return GOLD;if(level===1&&vu%2===0&&iv%2===0)return GOLD;return AIR;}}
      return AIR;}
    case 'disco':
      // (the dance floor's lights are drawn over the floor; the DJ, the bar and the sofas are props: see venueRoom)
      return AIR;
    case 'club':
      // a stage across the back with amps stacked on it and a mic stand; the bar down one side; the VIP sofas; green
      // neon all round up near the ceiling
      if(iv>=J-4){if(level===0)return PLANKS;return AIR;}
      if((iu===0||iu===I-1)&&level===4)return NEON_G;
      return AIR;
    case 'theater':{
      // the lobby; then the hall: the stalls, a balcony over the back of them, the orchestra pit, the stage
      if(iv<=1)return AIR;
      if(iv===2){if(Math.abs(iu-(I>>1))<=1&&level<=3)return AIR;STRUCT=true;return level<=4?CONCRETE:AIR;}
      if(level===5&&iv>=2&&iv<=4)return PLANKS;                                       // the balcony floor
      if(level===6&&iv>=3&&iv<=4&&iu>=1&&iu<=I-2&&iu!==(I>>1))return SEAT_R;
      if(level===6&&iv===5)return METAL;                                                // its rail
      if(iv>=3&&iv<=6&&level===0&&iu>=1&&iu<=I-2&&Math.abs(iu-(I>>1))>0)return SEAT_R;
      if(iv===7)return AIR;                                                             // the pit
      if(iv===8){if(iu<=1||iu>=I-2)return level<=9?(STRUCT=true,CONCRETE):AIR;if(iu===2||iu===I-3)return level<=7?AWN_R:CONCRETE;if(level>=8)return AWN_R;return AIR;}   // the arch and its curtains
      if(iv>8){if(level===0)return PLANKS;if(iv===J-1&&level<=7)return PAINT_DARK;}
      return AIR;}
    case 'stocks':
      // the trading floor: rows of desks with their screens, the big board high on the back wall
      if(iv===J-1&&level>=2&&level<=5&&iu>=1&&iu<=I-2)return SCREEN;
      return AIR;
    case 'ikea':{
      // the walls of the room sets (their furniture, and the warehouse behind, are props: see shopRoom)
      const wv=Math.floor(J*0.6);
      if(iv>=2&&iv<wv-1&&iu<I*0.72&&level<=3&&(iu%8===0&&(iv-2)%9>=3&&(iv-2)%9<=7||(iv-2)%9===0&&iu%8!==3&&iu%8!==4))return PAINT_WHITE;
      return AIR;}
    case 'museum':{
      // the lobby (gift shop, ticket desk), then galleries between white walls down the length of the building:
      // paintings, sculpture, the dinosaur
      if(iv<=3)return AIR;
      const long=I>=J,a=long?iu:iv-4,c=long?iv:iu,Wc=long?J:I,g=Math.floor(a/14),u=a%14,kind2=(g+(floorNo||0))%3,cvv=long?Math.floor((J+4)/2):(I>>1);
      if(u===0&&a>0){if(Math.abs(c-cvv)<=1&&level<=3)return AIR;if(level<=6){if(level>=2&&level<=3&&c%4!==0)return [PAINT_RED,PAINT_BLUE,PAINT_YELLOW,PAINT_GREEN,PAINT_ORANGE][(c+g)%5];return PAINT_WHITE;}return AIR;}
      if((c===Wc-1||c===0)&&level>=2&&level<=3&&u%4!==0&&u>1)return [PAINT_BLUE,PAINT_ORANGE,PAINT_RED,PAINT_GREEN][(a>>2)%4];
      if(kind2===1)return AIR;
      if(kind2===2){
        // the dinosaur: a long spine on two pairs of legs, ribs, a neck rising to the head, a tail sweeping down
        const dv=Math.abs(c-cvv),bone=STUCCO;
        if(dv===0&&level===5&&u>=3&&u<=11)return bone;
        if(dv===1&&(u===5||u===9)&&level<=4)return bone;
        if(dv===1&&u>=5&&u<=8&&(level===3||level===4)&&u%2===1)return bone;
        if(dv===0&&((u===3&&level===6)||(u===2&&level===7)||(u===1&&(level===7||level===8))))return bone;
        if(dv===0&&((u===12&&level===4)||(u===13&&level===3)))return bone;
        if(dv>=2&&dv<=3&&(u===1||u===13)&&level===0)return METAL;   // (the rope posts)
        return AIR;}
      return AIR;}
    case 'aquarium':{
      // tanks (glass fronts, sand, weed, water to the ceiling) down both long sides of the walkway, and in the middle a
      // great tank the walkway tunnels right through
      const long=I>=J,a=long?iu:iv,c=long?iv:iu,Wl=long?I:J,Wc=long?J:I,cw=(Wc-1)/2;
      if(a<4)return AIR;
      const tl=Math.floor(Wl/2)-5,th=Math.floor(Wl/2)+5;
      if(a>=tl&&a<=th){   // the tunnel tank
        const walk=Math.abs(c-cw)<=1.6;
        if(a===tl||a===th){if(walk)return level>=3&&level<=6?GLASS:AIR;return level<=6?GLASS:AIR;}
        if(walk){if(level<=2)return AIR;if(level===3)return GLASS;return level<=6?WATER:AIR;}
        if(Math.abs(c-cw)<=2.6&&level<=2)return GLASS;
        if(level===0)return SAND;if(level<=6)return(level<=2&&(a+c)%5===0)?LEAVES:WATER;return AIR;}
      if(a>=5&&a<Wl-1&&(c<=3||c>=Wc-4)){
        const front=c===3||c===Wc-4,end=a===5||a===Wl-2;
        if(front||end)return level<=6?GLASS:AIR;
        if(level===0)return SAND;if(level<=6)return(level<=3&&(a*3+c)%7===0)?LEAVES:WATER;return AIR;}
      return AIR;}
    case 'casino':{
      // the cashier's cage at the back, the signs over the food court. (Slot machines, tables and all: see venueRoom.)
      if(iu===I-1&&level===3&&iv%4===2)return [NEON_R,NEON_G,NEON_B,NEON_O][(iv>>2)%4];
      if(iv===J-3&&iu<=7){if(level===0)return PLANKS;if(level<=3)return iu%2?METAL:AIR;}
      return AIR;}
    case 'school':{
      // ground floor: the cafeteria, classrooms, the gym at the far end; upstairs: classrooms
      const long=I>=J,a=long?iu:iv,c=long?iv:iu,Wl=long?I:J,Wc=long?J:I;
      // the stair hall: one classroom's worth of building kept clear for the stairs (its walls and doorways are the classrooms' own)
      if(b.stairHall&&(floorNo||!b.stairHall[2])&&a>b.stairHall[0]-1&&a<=b.stairHall[1])return AIR;
      if(!floorNo&&a>=Wl-12){   // the gym: hoops at both ends, bleachers down one side
        if(a===Wl-12){if(Math.abs(c-(Wc>>1))<=1&&level<=2)return AIR;return level<=3?CONCRETE:AIR;}
        if(c<=1&&a>Wl-11&&level<=c)return SEAT_B;return AIR;}
      if(!floorNo&&a<10){if(a===9){if(Math.abs(c-(Wc>>1))<=1&&level<=2)return AIR;return level<=3?CONCRETE:AIR;}return AIR;}
      // classrooms: a wall every 8, the blackboard on it, rows of desks and chairs facing it, the teacher's desk
      const k=(a-10)%8;
      if(k===0){if(Math.abs(c-(Wc>>1))<=1&&level<=2)return AIR;if(level===1||level===2)return c%2&&c>1&&c<Wc-2?PAINT_DARK:SIDING;return level<=3?SIDING:AIR;}
      return AIR;}
    case 'factory':{
      // the production lines: conveyors with crates riding them, machines between; what it makes decides the rest
      const long=b.alongX,a=long?iu:iv,c=long?iv:iu,Wc=long?J:I,fk=b.fkind||'food';
      if(fk==='steel'&&Math.abs(c-(Wc>>1))<=1&&a>=6&&a<=9){if(level<=2)return(a===7||a===8)&&c===(Wc>>1)?NEON_O:RUST;return level===3?METAL:AIR;}
      if(fk==='chem'&&c%6===0&&level===5&&a>1)return METAL;   // pipes overhead
      return AIR;}
    case 'lecture':{
      // a lecture hall: rows of benched desks rising toward the back, the lectern and the big board at the front
      const long=I>=J,a=long?iu:iv,c=long?iv:iu,Wl=long?I:J,Wc=long?J:I;
      if(a===Wl-1&&level>=1&&level<=3&&c>=1&&c<=Wc-2)return PAINT_DARK;
      if(a===Wl-3&&Math.abs(c-(Wc>>1))<1&&level<=1)return PLANKS;
      const row=Wl-5-a;if(row>=0&&row%2===0&&c>=1&&c<=Wc-2&&Math.abs(c-(Wc>>1))>1){const h=Math.min(2,row>>2);if(level<h)return CONCRETE;if(level===h)return PLANKS;}
      return AIR;}
    case 'cells':{
      // cells down both sides of a central corridor: a bunk and a toilet in each, barred fronts onto the corridor
      const long=I>=J,a=long?iu:iv,c=long?iv:iu,Wc=long?J:I,mid=Wc>>1;
      if(Math.abs(c-mid)<=1)return AIR;   // the corridor
      if(b.stairHall&&a>=b.stairHall[0])return AIR;   // (the stair hall at its far end)
      const front=c===mid-2||c===mid+2;
      if(a%4===0){STRUCT=true;return CONCRETE;}   // walls between the cells
      if(front){if(a%4===2&&level<=2)return AIR;return level<=3?(level%2===0||a%2?METAL:AIR):AIR;}   // the bars (the door bars left open)
      return AIR;}
    case 'lab':{
      // vats bubbling green, tall glass tanks with something dark floating in each, cages, Tesla coils, the workbenches
      const cvv=J>>1;
      if(iv===J-1&&iu%3===1&&iu>0&&iu<I-1){if(level<=4){if(level===2||level===3)return iu%2?PAINT_DARK:NEON_G;return GLASS;}if(level===5)return METAL;}   // tanks
      if(iv===1&&iu%4===1&&iu<I-2&&level<=2)return level===2?METAL:CHAINLINK;   // cages
      if((iu===5||iu===I-6)&&iv===cvv){if(level<=4)return METAL;if(level===5)return NEON_B;}   // the coils
      return AIR;}
    case 'turbine':{
      // the turbine hall: great generator sets in a row down the middle, the control desks along one wall
      const long=I>=J,a=long?iu:iv,c=long?iv:iu,Wc=long?J:I,mid=Wc>>1;
      if(Math.abs(c-mid)<=2&&a%10>=2&&a%10<=7){if(level<=2)return Math.abs(c-mid)<=1?PAINT_GREEN:METAL;if(level===3&&a%10===4)return METAL;return AIR;}
      if(c===0&&a%3===1){if(level===0)return PLANKS;if(level===1)return SCREEN;}
      if(level===8&&(c===2||c===Wc-3))return METAL;   // the crane rails
      return AIR;}
    case 'barracks':
      return AIR;
    case 'terminal':
      // the check-in desks, rows of seats at the gates, the screens of departures
      if(iv===J-1&&level===3&&iu%5===2)return SCREEN;
      return AIR;
    case 'mission':
      // mission control: tiers of consoles facing the big screens on the end wall
      if(iv===J-1&&level>=1&&level<=3&&iu>=1&&iu<=I-2)return SCREEN;
      if(iv>=2&&iv<=J-4&&iv%3===2&&iu>=1&&iu<=I-2&&Math.abs(iu-(I>>1))>0){const h=Math.max(0,(J-4-iv)/3|0);if(level<h)return CONCRETE;if(level===h)return PLANKS;if(level===h+1)return SCREEN;}
      return AIR;
    case 'stage':{
      // a sound stage: a set built in the middle of the bare floor (a living room's walls), cameras and lights round it
      const cu=I>>1,cvv=J>>1;
      if(Math.abs(iu-cu)<=4&&Math.abs(iv-cvv)<=4){if((iu===cu-4||iv===cvv+4)&&level<=4)return iu===cu-4?STUCCO:SIDING;return AIR;}
      if(Math.abs(iu-cu)===6&&iv%4===1){if(level<=3)return METAL;if(level===4)return LAMP;}
      return AIR;}
    case 'diner':case 'pizza':case 'cafe':case 'fastfood':case 'bar':case 'soup':
      // the wall across the back of the room, with the kitchen behind it: a serving hatch, a way through, the lit menu
      // above. (Everything else in the room is props: see restProps.)
      if(iv===J-3){if(iu>=I-3&&iu<=I-2&&level<=2)return AIR;if(level===3&&iu>=3&&iu<I-5)return SCREEN;if(kind!=='bar'&&iu>=2&&iu<I-5&&(level===1||level===2))return AIR;return kind==='bar'?PLANKS:PAINT_WHITE;}
      return AIR;
    case 'sitdown':
      // the wall across the back, the kitchen behind it (a hatch, a way through). The rest is props: see restProps.
      if(iv===J-4){if(iu>=I-3&&iu<=I-2&&level<=2)return AIR;if(iu>=2&&iu<I-5&&(level===1||level===2))return AIR;return PAINT_WHITE;}
      if(level===5&&iv%4===2&&iu%4===2)return LAMP;
      return AIR;
    case 'firehall':
      // the engine floor is kept clear for the engines (their kit's props: see civicRoom)
      return AIR;
    case 'ward':
      // just the pillars: the beds, monitors and nurses' stations are props (see hospProps)
      if(iu%8===4&&iv%8===3){STRUCT=true;return CONCRETE;}
      // private rooms or operating theatres either side of a corridor, on some floors
      if(hospFloor(b,floorNo)){const cv=J>>1;if(iv===cv-3||iv===cv+2)return iu%8>=2&&iu%8<=6&&level<=2?AIR:HOSPW;if((iv<cv-3||iv>cv+2)&&iu%8===0)return HOSPW;}
      return AIR;
  }
  return AIR;
}
// multi-storey car park. Every deck is joined to the one above by a gentle ramp two lanes wide that runs along the
// middle aisle (half-height ramp blocks, so it takes two blocks to climb one: easy for cars and hippos alike);
// even decks ramp up toward +x on one lane, odd decks back toward -x on the other. Real parked cars fill the bays.
const GARAGE_LANE=(b,n)=>n%2?[b.z0+8,b.z0+11]:[b.z0+5,b.z0+8];   // three blocks wide
// where on deck n's ramp a column sits: 0..9 along the ramp, or -1
function garageRampI(b,n,rx,rz){
  const [l0,l1]=GARAGE_LANE(b,n);if(rz<l0||rz>=l1)return -1;
  const i=n%2?(b.x1-3)-rx:rx-(b.x0+2);return i>=0&&i<10?i:-1;
}
// a ramp lane plus a block of clearance at each end (no pillars there, so you can drive straight on and off)
function garageLaneZone(b,rx,rz){
  for(const n of [0,1]){const [l0,l1]=GARAGE_LANE(b,n);if(rz<l0||rz>=l1)continue;const i=n%2?(b.x1-3)-rx:rx-(b.x0+2);if(i>=-1&&i<=11)return true;}
  return false;
}
function garageAt(b,rx,rz,y,px,pz){
  const fl=y-G,x0=b.x0,x1=b.x1,z0=b.z0,z1=b.z1;
  const ex=rx===x0||rx===x1-1,ez=rz===z0||rz===z1-1;
  // pillars on a 6-block grid, except where one would stand in a ramp lane
  const col=((rx-x0)%6===0||rx===x1-1)&&((rz-z0)%6===0||rz===z1-1)&&!garageLaneZone(b,rx,rz);
  if(col){STRUCT=true;return CONCRETE;}
  flo(b,fl);const n=FL_NO;
  if(FL_SLAB||y===b.top){
    // the deck: open above the ramp coming up from below, whose last two blocks sit in the deck itself
    const i=n>0?garageRampI(b,n-1,rx,rz):-1;
    if(i>=0)return i<8?AIR:rampId((n-1)%2?1:0,i===8?1:2);
    if(y===b.top&&(ex||ez))return CONCRETE;
    // bay lines: the deck repeats an 18-deep module (bay row, aisle, bay row) across bigger car parks
    const q=(rz-z0)%18;
    return((rx-x0)%3===0&&(q<6||q>=12)&&rz<z1-1)?LANE:ASPHALT;
  }
  const lvl=FL_LVL,i=garageRampI(b,n,rx,rz);
  if(i>=0){const full=Math.floor(i/2);if(lvl<full)return CONCRETE;if(lvl===full)return rampId(n%2?1:0,i%2?2:1);return AIR;}
  // parapet on the upper decks (the ground floor is open so you can walk or drive in)
  if((ex||ez)&&n>0)return lvl<=1?CONCRETE:AIR;
  return AIR;
}
// the bays real parked cars can use on a car park's decks: centre x, z, deck height and which way they face
function garageBays(b,X0,Z0){
  const out=[],decks=Math.round((b.top-G)/FH);
  for(let n=0;n<=decks;n++){
    const y=G+FH*n+1;
    for(let m=0;b.z0+18*m+3<b.z1-3;m++)for(const [q,h,row] of [[3,0,0],[15,Math.PI,1]]){
      const zc=b.z0+18*m+q;if(zc+2>b.z1-1)continue;
      for(let bay=0;bay*3+3<=b.x1-b.x0-2;bay++){
        const x=X0+b.x0+bay*3+2.5;
        out.push({x,z:Z0+zc,y,h,n,bay,row:row+2*m});
      }
    }
  }
  return out;
}
// shopping mall: rows of shop units 8 wide and 8 deep, each with a glass shopfront, a doorway and a lit sign, either
// side of 4-wide concourses; above the ground floor the middle of each concourse is open (an atrium) with bridges
// across it every 16 blocks, and an escalator (steep ramps) in every concourse climbs to the floor above
const MALL_SIGNS=[NEON_G,NEON_M,NEON_B,NEON_R,LAMP];
// the mall's heart: a big atrium open through every floor to a glass roof, a walkway round it on each floor, and two
// 8-wide halls crossing the whole building (bridges over the atrium upstairs) out to an entrance in the middle of
// every side. u, v: position in the building; returns 'atrium', 'walk', 'hall' or null (shops and concourses)
function mallCut(u,v,W,D){
  const du=Math.abs(u+0.5-W/2),dv=Math.abs(v+0.5-D/2),A=Math.min(18,Math.floor(Math.min(W,D)*0.17));
  if(du<A&&dv<A)return'atrium';
  if(du<A+4&&dv<A+4)return'walk';
  if(du<4||dv<4)return'hall';
  return null;
}
function mallCutBlock(b,cut,u,v,W,D,lvl,n){
  const cu=u+0.5-W/2,cv=v+0.5-D/2,du=Math.abs(cu),dv=Math.abs(cv),A=Math.min(18,Math.floor(Math.min(W,D)*0.17)),hall=du<4||dv<4;
  if(FL_SLAB){
    if(cut!=='atrium')return(u+v)%2?SIDEWALK:b.floor;
    return hall?b.floor:AIR;                         // bridges over the atrium where the halls cross it
  }
  if(cut==='atrium'&&n>0){
    // a bridge's glass rails
    if(hall&&lvl===0&&((du>=3&&du<4&&dv>=4)||(dv>=3&&dv<4&&du>=4)))return GLASS;
    return AIR;
  }
  if(cut==='walk'){
    // glass balustrade round the atrium's edge upstairs (gaps where the bridges meet it)
    if(n>0&&lvl===0&&(du<A+1&&dv<A+1)&&!hall)return GLASS;
    return AIR;
  }
  if(cut==='hall')return AIR;
  // the atrium floor: fountain in the middle, kiosks at four corners, food-court tables, planters
  const d=Math.hypot(cu,cv);
  if(d<5.5){
    if(d<1.2)return lvl<=2?STONE:lvl===3?WATER:AIR;
    if(d>=4.5)return lvl===0?STONE:AIR;
    return lvl===0?WATER:AIR;
  }
  for(const [kx,kz] of [[-11,-11],[11,-11],[-11,11],[11,11]]){
    const a=Math.abs(cu-kx),c=Math.abs(cv-kz);
    if(a<2&&c<2){
      const corner=a>=1&&c>=1;
      if(corner&&lvl<=2)return METAL;
      if(lvl===3)return(kx>0)===(kz>0)?AWN_R:AWN_G;
      if(lvl===4&&a<1&&c<1)return MALL_SIGNS[(kx>0?1:0)+(kz>0?2:0)];
      return AIR;
    }
  }
  if(du>A-3&&dv>A-3)return lvl<=1?LEAVES:AIR;    // planters in the corners
  return AIR;   // (the food court's tables are props: see mallProps)
}
// (which shop units are toilets: the first clear one in the first row, the last in the last row, as [u0,v])
function mallWC(b){
  if(b._mw)return b._mw;const W=b.x1-b.x0,D=b.z1-b.z0,all=[];
  for(let v=1;v+6<D-1;v++){if((v+7)%14!==1)continue;for(let u0=1;u0+8<W-1;u0+=8){let ok=true;for(let a=u0-1;a<=u0+8&&ok;a++)for(let c=v-1;c<=v+6&&ok;c++)if(mallCut(a,c,W,D))ok=false;if(ok)all.push([u0,v]);}}
  const out=[];if(all.length){out.push(all[0]);if(all.length>1)out.push(all[all.length-1]);}
  return b._mw=out;
}
function mallAt(b,rx,rz,y,px,pz){
  if(!b._fp){b._fp=[px,pz];FURN_SEEN.add(px+','+pz+','+b.x0+','+b.z0);}
  const fl=y-G,u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0;
  const ex=u===0||u===W-1,ez=v===0||v===D-1;
  flo(b,fl);const n=FL_NO,lvl=FL_LVL;
  if(ex||ez){
    STRUCT=true;
    // ground floor: a big entrance where each hall meets its side, and a pair of smaller exits further along
    if(n===0&&!FL_SLAB){const along=ex?v:u,len=ex?D:W,a=along+0.5;
      if(Math.abs(a-len/2)<4&&lvl<5)return AIR;
      if(lvl===5&&Math.abs(a-len/2)<5)return b.neon;
      if((Math.abs(a-len*0.22)<1.5||Math.abs(a-len*0.78)<1.5)&&lvl<3)return AIR;}
    if(n===0&&v===0&&!ex){if(Math.abs(u-W/2)<=2&&lvl<4)return AIR;return lvl===b.gf-2?b.neon:lvl>=b.gf-1?b.wall:GLASS;}   // the glass front and main doors
    if(FL_SLAB)return b.wall;
    return lvl===2&&u%4===2?GLASS:b.wall;
  }
  const cut=mallCut(u,v,W,D);
  if(cut){if(y>b.detailTop&&cut!=='atrium'){STRUCT=true;return CONCRETE;}return mallCutBlock(b,cut,u,v,W,D,lvl,n);}
  // which band: q 0..7 a shop row, 8..13 a 6-wide concourse (period 14, starting with a concourse inside the doors)
  const q=(v+7)%14,inConc=q>=8,cIdx=Math.floor((v+7)/14);
  const hB=k=>k===0?b.gf:FH;   // storey k's height (the ground floor is taller)
  // escalators, two blocks wide: up from even storeys on the concourse's first two rows heading +x, from odd
  // storeys on its last two rows heading -x (so they never stack), one every 32 blocks along it
  const escAt=(k,q,u)=>{
    const L=hB(k);
    const clear=(s0,s1)=>{for(let w=Math.min(s0,s1)-1;w<=Math.max(s0,s1)+1;w++)if(mallCut(w,v,W,D))return false;return true;};
    if(k%2===0&&(q===8||q===9)){const j=u-4,i=((j%32)+32)%32;if(j>=0&&i<L&&j-i+L<=W-6&&clear(u-i,u-i+L-1))return{i,L,dir:0};}
    if(k%2===1&&(q===12||q===13)){const j=(W-5)-u,i=((j%32)+32)%32;if(j>=0&&i<L&&j-i+L<=W-6&&clear(u+i,u+i-L+1))return{i,L,dir:1};}
    return null;
  };
  const unit=Math.floor((u-1)/8),uu=(u-1)%8,h=hash2(px*131+unit*17+cIdx*7+n*3,pz*97+unit*5+cIdx*11+n);
  if(FL_SLAB){
    // the atrium: the middle two rows of each concourse stay open above the ground floor, crossed by bridges
    if(inConc&&(q===10||q===11)&&u%16>=2&&u>2&&u<W-3)return AIR;
    // escalator coming up through the slab
    if(n>0&&inConc){const e=escAt(n-1,q,u);if(e){if(e.i<e.L-1)return AIR;if(e.i===e.L-1)return rampId(e.dir,0);}}
    return(inConc&&(u+v)%2)?SIDEWALK:b.floor;
  }
  if(y>b.detailTop){STRUCT=true;return CONCRETE;}
  if(inConc){
    // escalators: one going up each way in every concourse (full-height ramps, one block per block)
    // the escalator up from this storey: alternate sides of the concourse each floor, so they never stack
    {const e=escAt(n,q,u);if(e){if(lvl<e.i)return CONCRETE;if(lvl===e.i)return rampId(e.dir,0);return AIR;}}
    // planters and benches down the middle
    if(lvl===0&&n===0&&(q===10||q===11)&&u%16===8)return LEAVES;
    if(u%16===0&&(q===8||q===13)){STRUCT=true;return CONCRETE;}
    return AIR;
  }
  // shops backing onto the atrium walkway or a hall: a glass shopfront on that side, with a doorway
  if(!inConc&&(mallCut(u+1,v,W,D)||mallCut(u-1,v,W,D)||mallCut(u,v+1,W,D)||mallCut(u,v-1,W,D))){
    if(lvl===3)return MALL_SIGNS[Math.floor(h*MALL_SIGNS.length)];if(lvl>3)return CONCRETE;
    const side=mallCut(u+1,v,W,D)||mallCut(u-1,v,W,D)?v:u;if(((side%8)+8)%8>=3&&((side%8)+8)%8<=4&&lvl<3)return AIR;
    return GLASS;
  }
  // shop units: side walls between units, a shopfront facing the concourse
  const front=q===7||q===0,last=v===D-2||v===1;
  if(uu===0){STRUCT=true;return CONCRETE;}
  if(front&&n%2===0&&mallWC(b).some(m=>m[0]===unit*8+1&&(m[1]-1===v||m[1]+6===v))){STRUCT=true;return q===0&&uu===6&&lvl<3?(lvl===1?DOOR_WK:DOOR_W):CONCRETE;}   // (a toilets' front: solid, one door)
  if(front&&!last){
    if(lvl===3)return MALL_SIGNS[Math.floor(h*MALL_SIGNS.length)];
    if(lvl>3)return CONCRETE;
    if((uu===4||uu===5)&&lvl<3)return AIR;     // doorway
    return GLASS;
  }
  if(front&&last)return lvl===3?MALL_SIGNS[Math.floor(h*MALL_SIGNS.length)]:CONCRETE;
  return AIR;   // (inside the shop, what it sells is props: see mallProps)
}
// a house's gable roof above its top floor: shingles stepping in toward the ridge, wall filling the gable ends
function houseRoof(b,rx,rz,y){
  const i=y-b.top-1;if(i<0||i>=b.roof)return AIR;
  const s=b.ridgeX?rz:rx,s0=b.ridgeX?b.z0:b.x0,s1=b.ridgeX?b.z1:b.x1,t=b.ridgeX?rx:rz,t0=b.ridgeX?b.x0:b.z0,t1=b.ridgeX?b.x1:b.z1;
  const d=Math.min(s-s0,s1-1-s);
  if(d===i)return SHINGLE;
  if(d>i&&(t===t0||t===t1-1)){STRUCT=true;return b.wall;}
  if(d>i&&i===b.roof-1)return SHINGLE;
  return AIR;
}
// the block a building has at (rx,rz,y); STRUCT says whether it holds the building up
let STRUCT=false;
// a building under construction: columns on a 4-block grid all the way up, floor slabs on the finished storeys,
// brick walls (with window gaps) on the lowest, and rusty rebar poking up from the columns above the last slab
function siteAt(b,rx,rz,y){
  if(y>b.top)return AIR;
  const u=rx-b.x0,v=rz-b.z0,W=b.x1-b.x0,D=b.z1-b.z0,fl=y-G,n=Math.floor((fl-1)/FH),slab=(fl%FH)===0;
  const col=(u%4===0&&u<W-2||u===W-1)&&(v%4===0&&v<D-2||v===D-1),edge=u===0||u===W-1||v===0||v===D-1;
  if(col){STRUCT=true;return n<b.done+1?CONCRETE:n===b.done+1&&(fl-1)%FH<2?RUST:AIR;}
  if(slab&&fl/FH<=b.done)return(u+v)%7===3&&fl/FH===b.done?AIR:CONCRETE;
  if(edge&&n<Math.min(2,b.done)&&!slab){const lv=(fl-1)%FH;if(rz===b.z0&&Math.abs(rx-((b.x0+b.x1)>>1))<=1&&n===0&&lv<4)return AIR;return lv>=1&&lv<=2&&(u+v)%3===1?AIR:b.wall;}
  if(edge&&n<b.done&&!slab&&(fl-1)%FH===0)return METAL;   // safety rails along the open edges
  return AIR;
}
