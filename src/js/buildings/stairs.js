// ---- stairs: a straight flight per storey, stacked one above the other in a walled shaft, one block up for each block
// along. b.stair: {ax (the way it climbs), c0,c1 (its width, across), r0 (first row, along), L (rows)}, in the building's
// plot's coordinates. On any floor, you go up from the near end and come off at the far end of the next floor up. ----
function stairFloors(b){if(b._stY)return b._stY;const o=[G+1];for(let y=G+(b.gf||FH)+1;y<=b.detailTop;y+=FH)o.push(y);return b._stY=o;}
// (a very long building's second flight: the same floors, its own place)
const stair2Of=b=>b._st2||(b._st2={stair:b.stair2,_stY:stairFloors(b)});
function stairAt(b,rx,rz,y){
  const S=b.stair,r=(S.ax==='x'?rx:rz)-S.r0,c=S.ax==='x'?rz:rx;
  // (whatever the room's furnished with, the way onto the stairs and off them is kept clear, on every floor)
  if(!FL_SLAB&&c>=S.c0&&c<S.c1&&(r>=-3&&r<0||r>=S.L&&r<S.L+3))return AIR;
  if(r<-1||r>=S.L||c<S.c0-1||c>S.c1)return;
  const Y=stairFloors(b),side=c===S.c0-1||c===S.c1,dir=S.ax==='x'?0:2;
  for(let n=0;n+1<Y.length;n++){const L=Y[n+1]-Y[n],base=S.L-L,hole=base+Math.max(0,L-4);   // (hole: the first row with the floor above cut away for headroom)
    // a rail round the opening in the floor above: down both sides, and across its far end
    // (not across the end if another flight carries on from there: that rail would stand on its first step)
    if(y===Y[n+1]&&(side?r>=hole-1:r===hole-1&&n+2>=Y.length))return RAILPOST;
    if(r<base)continue;const sy=Y[n]+r-base;
    if(side){   // up each side: solid to the steps, a handrail on top of that, and open above it
      if(y>=Y[n]&&y<=sy){STRUCT=true;return CONCRETE;}if(y===sy+1)return RAILPOST;continue;}
    if(y===sy){STRUCT=true;return stairId(dir,S.m);}
    if(y<sy&&y>=Y[n]){STRUCT=true;return CONCRETE;}   // (solid under the steps: nothing wanders in underneath)
    if(y>sy&&y<=sy+3)return AIR;}
  if(r<0||side)return;
  return FL_SLAB?undefined:AIR;
}
// is a goblin actually on one of the flights (not just standing on the floor beside or above it)?
function onStair(g,B){
  const b=B.b,S=b.stair,alongX=S.ax==='x',r=(alongX?g.pos.x-B.px*CELL:g.pos.z-B.pz*CELL)-S.r0,c=alongX?g.pos.z-B.pz*CELL:g.pos.x-B.px*CELL;
  if(r<-0.1||r>=S.L+0.1||c<S.c0-0.1||c>S.c1+0.1)return false;
  const Y=stairFloors(b);for(let n=0;n+1<Y.length;n++){const base=S.L-(Y[n+1]-Y[n]);if(r>=base-0.1&&Math.abs(g.pos.y-(Y[n]+Math.floor(r)-base+1))<1.3)return true;}
  return false;
}
// where a goblin on its way up or down a building's stairs should head next (world coordinates), or null if it can't
// where next, for a goblin finding its way between a building's rooms to (tx,tz): out by its door, along the corridors and
// the hall, in by the other room's door. Null if there's nothing in the way but the open floor.
function roomStep(g,B,tx,tz){
  // (the capitol: door to door through its rooms, worked out from its plan)
  if(B.b.style==='capitol')return capStep(g,B,tx,tz);
  const b=B.b,fl=g.pos.y-G,gf=b.gf||FH,n=fl<gf?0:1+Math.floor((fl-gf-1)/FH),I=b.x1-b.x0-2,J=b.z1-b.z0-2;
  {const Xa=B.px*CELL+b.x0+1,Za=B.pz*CELL+b.z0+1,ua=g.pos.x-Xa,va=g.pos.z-Za,Ua=tx-Xa,Va=tz-Za,W=b._wc&&b._wc.get(n);
   // (in a bathroom: out by its door first)
   if(W)for(const R of W)if(ua>=R.u0&&ua<R.u1&&va>=R.v0&&va<R.v1&&!(Ua>=R.u0&&Ua<R.u1&&Va>=R.v0&&Va<R.v1)){if(R.dside){const dr=wcDoor(R),du=dr[0]+.5,cv=dr[1]+.5;return Math.abs(va-cv)<.7?{x:Xa+du+R.dside*1.7,z:Za+cv}:{x:Xa+du-R.dside*2,z:Za+cv};}const du=((R.u0+R.u1)>>1)+.5,dz=R.dv?R.v1:R.v0;return Math.abs(ua-du)<.7?{x:Xa+du,z:Za+dz+(R.dv?1.2:-1.2)}:{x:Xa+du,z:Za+dz+(R.dv?-1.5:1.5)};}
   // (two flats side by side: through the doorway in the middle of the wall between them)
   const kd=n===0?b.ground:b.kind;if(kd==='apartment'&&!b.home&&b.style==='normal'&&b.ground!=='firehall'&&I>=12&&!flats4(I,J)){const c=(I>>1)+.5;const mv=(J>>1)+.5;if((ua<c)!==(Ua<c))return Math.abs(va-mv)>1?{x:Xa+ua,z:Za+mv}:{x:Xa+Ua,z:Za+mv};}}
  const L=b.ground==='police'?policeRooms(b,I,J,n):b.ground==='hosp'&&n===0?hospRooms(b,I,J):null;if(!L)return null;
  const X0=B.px*CELL+b.x0+1,Z0=B.pz*CELL+b.z0+1,u=g.pos.x-X0,v=g.pos.z-Z0,U=tx-X0,V=tz-Z0;
  // (a hospital whose ER is across the back: through the gap in the wall between it and the lobby)
  if(b.ground==='hosp'&&n===0&&b.er&&b.er.mode!=='front'){const e=b.er.v0+.5,mid=(I>>1)+.5;if((v<e)!==(V<e))return Math.abs(u-mid)>1?{x:X0+mid,z:Z0+e+(v<e?-1.5:1.5)}:{x:X0+mid,z:Z0+e+(v<e?2:-2)};}
  if(!L.length)return null;
  const A=roomAt(L,Math.floor(u),Math.floor(v)),T=roomAt(L,Math.floor(U),Math.floor(V));
  if(A&&A===T)return null;
  const P=(a,c)=>({x:X0+a,z:Z0+c}),du=R=>((R.u0+R.u1)>>1)+.5,cu=((b.x0+b.x1)>>1)-b.x0-1+.5;
  if(A)return Math.abs(u-du(A))<1?P(du(A),A.v0-1.2):P(du(A),A.v0+1.4);
  if(T&&v>T.v0-2.6&&v<T.v0+1)return Math.abs(u-du(T))<1?P(du(T),T.v0+1.5):P(du(T),T.v0-1);
  // (nothing but open floor in a straight line: just go)
  {let clear=true;const ex=T?du(T):U,ez=T?T.v0-1:V;for(let i=1;i<=14&&clear;i++){const f=i/14;if(roomAt(L,Math.floor(u+(ex-u)*f),Math.floor(v+(ez-v)*f)))clear=false;}if(clear)return T?P(ex,ez):null;}
  const vt=T?T.v0-1:V;if(Math.abs(v-vt)<=2)return null;
  return Math.abs(u-cu)>1.4?P(cu,v):P(cu,vt);
}
function stairPoint(g,B,up){
  const r=stairRun(g,B,up);
  if(r&&!onStair(g,B)){const e=roomStep(g,B,r.x,r.z);if(e)return e;}
  return r;
}
function stairRun(g,B,up){
  const b=B.b,S=b.stair,alongX=S.ax==='x',R0=(alongX?B.px:B.pz)*CELL+S.r0,cW=(alongX?B.pz:B.px)*CELL+(S.c0+S.c1)/2,gR=alongX?g.pos.x:g.pos.z,gC=alongX?g.pos.z:g.pos.x;
  const Y=stairFloors(b);let n=0;while(n+1<Y.length&&Y[n+1]<=g.pos.y+0.6)n++;
  if(up?n+1>=Y.length:n===0&&g.pos.y<Y[0]+0.6)return null;
  // (in another room: along the corridor down the building's middle first, through the doorways, to the stair hall)
  if(b.stairHall&&!onStair(g,B)){const I=b.x1-b.x0-2,J=b.z1-b.z0-2,long=I>=J,iu=g.pos.x-B.px*CELL-b.x0-1,iv=g.pos.z-B.pz*CELL-b.z0-1,a=long?iu:iv,c=long?iv:iu,mid=((long?J:I)>>1)+0.5,h=b.stairHall;
    if(a<h[0]||a>h[1]+1){const P=(pa,pc)=>({x:B.px*CELL+b.x0+1+(long?pa:pc),z:B.pz*CELL+b.z0+1+(long?pc:pa)});return Math.abs(c-mid)>0.8?P(a,mid):P(a<h[0]?a+3:a-3,mid);}}
  // (coming at it from the wrong end: round the side first, not over the rails or into its solid back)
  if(!onStair(g,B)){const half=(S.c1-S.c0)/2,dirC=((alongX?b.z0+b.z1:b.x0+b.x1)/2-(S.c0+S.c1)/2)>=0?1:-1,aside=cW+dirC*(half+1.6),wrong=up?gR>R0-0.3:gR<R0+S.L+0.3;
    if(wrong&&Math.abs(gC-cW)<half+3){const to=Math.abs(gC-aside)<0.7?{r:up?R0-1.4:R0+S.L+0.6,c:aside}:{r:gR,c:aside};return alongX?{x:to.r,z:to.c}:{x:to.c,z:to.r};}}
  let R;
  if(onStair(g,B))R=up?R0+S.L+1:R0-0.6;   // (on the flight: on to the end of it)
  else{R=up?R0+S.L-(Y[n+1]-Y[n])-0.6:R0+S.L+0.6;if(Math.abs(gC-cW)<0.6&&Math.abs(gR-R)<0.5)R=up?R0+S.L+1:R0-0.6;}   // (to the foot or the head of it, then straight on)
  return alongX?{x:R,z:cW}:{x:cW,z:R};
}
function blockAt(b,rx,rz,y,px,pz){
  // a derelict building is built as it was, then left to rot (see decayB)
  if(b.decay&&!b._raw){b._raw=true;let v;try{v=blockAt(b,rx,rz,y,px,pz);}finally{b._raw=false;}return decayB(b,v,rx,rz,y,px,pz);}
  STRUCT=false;
  if(y<=G)return AIR;
  if(b.style==='turret')return y>b.top?AIR:turretAt(b,rx,rz,y);
  if(b.style==='greenhouse')return greenAt(b,rx,rz,y);
  if(b.style==='garage')return y>b.top?AIR:garageAt(b,rx,rz,y,px,pz);
  if(b.style==='site')return siteAt(b,rx,rz,y);
  if(b.style==='mall'&&y<b.top)return mallAt(b,rx,rz,y,px,pz);
  if(b.style==='mall'&&y===b.top&&mallCut(rx-b.x0,rz-b.z0,b.x1-b.x0,b.z1-b.z0)==='atrium')return GLASS;   // glass roof over the atrium
  if(b.style==='capitol')return capitolAt(b,rx,rz,y);
  if(b.style==='wtower')return y>b.top?AIR:wtowerAt(b,rx,rz,y);
  if(b.style==='lighthouse')return y>b.top?AIR:lighthouseAt(b,rx,rz,y);
  if(b.style==='ctower'||b.style==='btower')return y>b.top?AIR:towerAt(b,rx,rz,y);
  if(b.style==='statue')return y>b.top?AIR:statueAt(b,rx,rz,y);
  if(b.style==='obelisk')return y>b.top?AIR:obeliskAt(b,rx,rz,y);
  if(b.style==='church')return churchAt(b,rx,rz,y);
  if(b.style==='steeple')return y>b.top?AIR:steepleAt(b,rx,rz,y);
  if(b.style==='portico')return y>b.top?AIR:porticoAt(b,rx,rz,y);
  if(b.style==='mast')return y>b.top?AIR:mastAt(b,rx,rz,y);
  if(b.style==='cathedral')return y>b.top?AIR:cathedralAt(b,rx,rz,y);
  if(b.style==='stack'||b.style==='silo'||b.style==='tank')return y>b.top?AIR:roundAt(b,rx,rz,y);
  if(b.style==='dc')return y>b.top?AIR:dcAt(b,rx,rz,y);
  if(b.style==='pylon')return y>b.top?AIR:pylonAt(b,rx,rz,y);
  if(b.style==='arena')return y>b.top?AIR:arenaAt(b,rx,rz,y);
  if(b.style==='gtower')return y>b.top?AIR:gtowerAt(b,rx,rz,y);
  if(b.style==='cooling')return y>b.top?AIR:coolingAt(b,rx,rz,y);
  if(b.style==='facade')return y>b.top?AIR:facadeAt(b,rx,rz,y);
  if(b.style==='gate')return y>b.top?AIR:gateAt(b,rx,rz,y);
  if(b.style==='mausoleum')return y>b.top?AIR:mausoleumAt(b,rx,rz,y);
  if(b.style==='hangar')return y>b.top?AIR:hangarAt(b,rx,rz,y);
  if(b.style==='ctrl')return y>b.top?AIR:ctrlAt(b,rx,rz,y);
  if(b.style==='contain')return y>b.top?AIR:containAt(b,rx,rz,y);
  if(b.style==='house'&&y>b.top)return houseRoof(b,rx,rz,y);
  const tierOn=b.tier>0&&(b.x1-b.x0)>=8,ix0=b.x0+2,ix1=b.x1-2,iz0=b.z0+2,iz1=b.z1-2;
  const inner=rx>=ix0&&rx<ix1&&rz>=iz0&&rz<iz1,top=(tierOn&&!inner)?b.tier:b.top;
  if(y>top){
    // a sawtooth roof: rows of teeth, each a slope up to a band of glass facing the other way
    if(b.dome&&y<=top+b.dome.r+2){const cx=(b.x0+b.x1)/2-0.5,cz=(b.z0+b.z1)/2-0.5,dd=Math.hypot(rx-cx,rz-cz,(y-top)*1.05),R=b.dome.r;if(dd<=R&&dd>R-1.2){STRUCT=true;return(y-top)%3===1&&y-top<R-2?GLASS:METAL;}if(Math.hypot(rx-cx,rz-cz)<0.8&&y-top>R-1&&y-top<=R+1)return GOLD;return AIR;}
    if(b.saw&&y<=top+3){const a=b.alongX?rx-b.x0:rz-b.z0,m=a%5,d=y-top;if(m===4)return GLASS;if(d<=m){STRUCT=false;return ROOF;}}
    return AIR;}
  const up=tierOn&&y>b.tier,ex0=up?ix0:b.x0,ex1=up?ix1:b.x1,ez0=up?iz0:b.z0,ez1=up?iz1:b.z1;
  const ex=rx===ex0||rx===ex1-1,ez=rz===ez0||rz===ez1-1;
  const fl=y-G;
  // battlements: the roof a block down, the parapet round it notched into merlons
  if(b.crenel&&y>=b.top-1){STRUCT=true;if(y===b.top)return(ex||ez)&&(rx+rz)%2===0?b.wall:AIR;return(ex||ez)?b.wall:ROOF;}
  if(y===top){
    STRUCT=ex||ez||y>b.detailTop;
    if(b.style==='house')return(ex||ez)?b.wall:b.floor;
    if((ex||ez)&&top===b.top&&b.neon)return b.neon==='police'?((rx+rz)%2?NEON_B:NEON_R):b.neon;
    // hospital helipad: a big H on the roof
    if(b.bigbox&&!ex&&!ez&&(rx-b.x0)%6===3&&(rz-b.z0)%6===3)return LAMP;   // rows of lights in the superstore's roof
    if(b.heli&&!ex&&!ez){const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1,u=rx-cx,v=rz-cz;if((Math.abs(u)===2&&Math.abs(v)<=2)||(v===0&&Math.abs(u)<=2))return HOSPW;}
    return ROOF;
  }
  flo(b,fl);
  if(ex||ez){
    // (a fire station's front: red round every bay, used or not, so it can't be anything else)
    if(b.allBays&&FL_NO===0&&rz===ez0&&[PL0+3,PL0+7,PL0+11].some(c=>Math.abs(rx-c)<=2)&&!b.bays.some(c=>Math.abs(rx-c)<=1))return PAINT_RED;
    // a factory's loading docks: big openings in the far end wall, roller doors up
    if(b.docks&&FL_NO===0&&FL_LVL<5&&(b.dockSide===1?rx===ex1-1:rz===ez1-1)&&b.docks.some(d=>Math.abs((b.dockSide===1?rz:rx)-d)<=1))return AIR;
    // (a station's second door, on to the platform)
    if(b.station&&FL_NO===0&&FL_LVL<3&&(b.station==='x'?rz===ez1-1&&(rx===((b.x0+b.x1)>>1)||rx===((b.x0+b.x1)>>1)-1):rx===ex1-1&&(rz===((b.z0+b.z1)>>1)||rz===((b.z0+b.z1)>>1)-1)))return AIR;
    if(FL_NO===0&&FL_LVL<(b.bays&&rz===ez0?b.gf-1:4)&&isDoor(b,rx,rz,ex0,ex1,ez0,ez1)){
      // the fire station's bays stay open; the superstore's entrances and the ER get wide glass doors
      if(b.bays&&rz===ez0&&b.bays.some(c=>Math.abs(rx-c)<=1))return AIR;
      if(b.bigbox)return FL_LVL===1?DOOR_GB:DOOR_G;
      const er=b.er&&(b.er.mode==='front'?rz===ez0&&Math.abs(rx-b.er.door)<=2:rx===ex1-1&&Math.abs(rz-b.er.door)<=2);
      if(er)return FL_LVL===1?DOOR_GB:DOOR_G;
      const v=doorBlock(b,rx,rz,FL_LVL,false);if(v!==-1)return v;
      // round the door: the wall carries on (below, as the rest of the front would be)
    }
    if(bridgeDoor(b,px,pz,rx,rz,y))return AIR;
    STRUCT=true;
    if(ex&&ez)return b.wall;
    // superstore front: solid painted wall, a glass bay round each entrance, a lit stripe along the top
    if(b.bigbox&&FL_NO===0&&rz===ez0){
      if(FL_LVL===b.gf-3)return b.neon||NEON_G;
      if(b.bigbox.some(e=>Math.abs(rx-e)<=3)&&FL_LVL>=0&&FL_LVL<5)return GLASS;
      return b.wall;
    }
    if(b.bigbox)return(FL_NO===0&&FL_LVL===b.gf-3)?(b.neon||NEON_G):b.wall;   // no windows on the other sides, just the stripe
    // supermarket / kiosk front: floor-to-ceiling glass with a lit sign band above
    if(b.front&&FL_NO===0&&((b.door===2&&rz===ez0)||(b.door===0&&rx===ex0))){
      if(FL_LVL>=b.gf-3)return(b.neon||NEON_G);
      if(b.barred&&FL_LVL>0&&(rx+rz)%2===0)return METAL;   // (bars over the gun shop's windows)
      return FL_LVL===0?b.wall:GLASS;
    }
    // the hospital's red cross, on the front above the entrance
    if(b.cross&&rz===ez0){const cx=(b.x0+b.x1)>>1,u=rx-cx,v=fl-(b.gf+FH+2);if((Math.abs(u)<=1&&v===0)||(u===0&&Math.abs(v)<=1))return HOSPX;}
    if(FL_SLAB)return b.band||b.wall;
    if(b.dthru&&rx===ex1-1&&Math.abs(rz-b.dthru)<=1&&FL_NO===0&&FL_LVL>=1&&FL_LVL<=2)return GLASS;   // (the drive-thru window)
    if(b.rowWin&&FL_NO===0)return FL_LVL>=1&&FL_LVL<=3&&(ex?rz:rx)%5!==0?GLASS:b.wall;   // (a row of proper windows)
    if(b.front&&FL_NO===0)return b.wall;
    if(b.blank)return b.wall;   // (a club's blank walls)
    if(b.glitz&&FL_NO===0){if(FL_LVL===b.gf-3)return(Math.floor((rx+rz)/2)%2?NEON_Y:NEON_M);if(FL_LVL===b.gf-5)return(Math.floor((rx+rz)/2)%2?NEON_B:NEON_R);}   // (a casino: wrapped in neon)
    if(b.glassAll&&FL_NO===0)return(FL_LVL===0||FL_LVL>=b.gf-2)?b.wall:GLASS;   // (a showroom: glass all round)
    if(b.fort){const c=ex?rz:rx;return c%4===2&&FL_LVL>=1&&FL_LVL<=2?(FL_LVL===1?METAL:WIN_BLUE):b.wall;}   // (a fortress bank: narrow barred slits)
    if(b.style==='house')return(FL_LVL===1||FL_LVL===2)&&((ex?rz:rx)%3===1)?b.win:b.wall;
    if(b.kind==='school'){const c=ex?rz:rx;if(FL_LVL<1||FL_LVL>2||c%4===0)return b.wall;}   // (classroom windows: rows of big panes in brick, not an office's wall of lights)
    return FL_NO===0?(b.kind==='police'?WIN_BLUE:b.style==='normal'&&b.win===GLASS?GLASS:WIN_WARM):b.win;
  }
  if(y>b.detailTop){STRUCT=true;return CONCRETE;}
  if(b.stair){const v=stairAt(b,rx,rz,y);if(v!==undefined)return v;}
  if(b.stair2){const v=stairAt(stair2Of(b),rx,rz,y);if(v!==undefined)return v;}
  if(FL_SLAB)return((rx+FL_NO)%4===0&&rz%4===2)?LAMP:b.floor;
  const v=furniture(b,rx,rz,fl,ex0,ex1,ez0,ez1,px,pz);
  if(v===CONCRETE)STRUCT=true;
  return v;
}
// what of a building is still standing after it came down from level L: a jagged stump of wall (and pillars) a
// few blocks high round the ground floor, and the furniture resting on the ground floor. Decided from the seed alone,
// so a reloaded chunk rebuilds exactly the same ruin.
function collapseKeep(b,px,pz,rx,rz,y,L){
  if(y<L)return true;
  // the storey the break is in: its floor (the ground, or a floor slab) and the slab over it
  const gf=b.gf||FH,y0=L<G+gf?G:G+gf+Math.floor((L-G-gf)/FH)*FH,gTop=y0+(y0===G?gf:FH);
  if(y<=y0||y>=gTop)return false;
  const v=blockAt(b,rx,rz,y,px,pz);if(v===AIR)return false;
  if(STRUCT){
    // jagged: each wall column keeps 0-4 blocks, a little taller toward the corners, with the odd gap
    const wx=px*CELL+rx,wz=pz*CELL+rz,hh=hash2(wx*7+13,wz*11+5),corner=(rx===b.x0||rx===b.x1-1)&&(rz===b.z0||rz===b.z1-1);
    const h=hh<0.18?0:Math.min(gTop-y0-1,1+Math.floor(hash2(wx*3+1,wz*5+7+y0)*3.2)+(corner?1:0));
    return y<y0+1+h;
  }
  // furniture: kept if it sits on the floor, or on more kept furniture
  return y===y0+1||collapseKeep(b,px,pz,rx,rz,y-1,L)&&blockAt(b,rx,rz,y-1,px,pz)!==AIR&&!STRUCT;
}
