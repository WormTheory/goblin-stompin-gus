// ---- under the streets: brick sewers below every town street, and in each city its subway, deeper down ----
// The sewers: a brick tunnel along the middle of each street (a channel of water between two walkways), crossing at the
// junctions, lamps here and there, iron manhole covers in the road over them. There's no way down to them from the
// street (the pavement stairwells were taken out): they're only reached by smashing through.
// The subway: one line in each city, a loop round its middle under the blocks (deep enough to pass under the rivers and
// everything else), a station halfway along each side: a plaza up top with a wide stair down under a glass canopy, and
// a tiled hall below with platforms either side of the track. The trains are drawn with the venues.
const SEW0=G-8,SUB_F=G-20;
function streetTown(px,pz){
  if(TEST_OFF.has('sewers'))return false;
  if(!settlementAt(px,pz)||isRiver(px,pz))return false;
  const S=superOf(px,pz);return !S;
}
// a block with a sewer under the street beside it along x=0..7 (for finding one: the Structures previewer, the tests)
function sewerStreet(px,pz){
  if(!streetTown(px,pz))return false;
  const t=plotType(px,pz);return t!=='rail'&&t!=='station'&&t!=='metro'&&t!=='ramp'&&t!=='river'&&!!stripOpen(px,pz,true,false);
}
// ---- the subway loops ----
const metroC=new Map();
function metroOf(S){
  // a city's loop: the blocks a round its middle each way; its four stations (a block on each side, clear of the
  // highways' rows and columns, the railway, the river and anything big)
  if(TEST_OFF.has('subway')||S.type!=='city')return null;
  const key=S.rx+','+S.rz;let M=metroC.get(key);if(M!==undefined)return M;
  M=null;const sa=settlementAt(S.cx,S.cz);
  if(sa&&sa.rx===S.rx&&sa.rz===S.rz){
    const a=Math.max(3,Math.min(5,Math.round(S.R*0.45))),x0=S.cx-a,x1=S.cx+a,z0=S.cz-a,z1=S.cz+a;
    M={S,a,x0,x1,z0,z1,stations:[]};
    const ok=(px,pz)=>settlementAt(px,pz)===sa&&!isRiver(px,pz)&&!railPlot(px,pz)&&!cloverOf(px,pz)&&!rampSite(px,pz)&&!routeCuts(px,pz)&&!(px===0&&pz===0)&&!macroHit(px,pz);
    for(const [ax,k,c] of [['x',z0,S.cx],['x',z1,S.cx],['z',x0,S.cz],['z',x1,S.cz]])
      for(const o of [1,2,-1,-2,3]){const px=ax==='x'?c+o:k,pz=ax==='x'?k:c+o;if(ok(px,pz)){M.stations.push({ax,px,pz});break;}}
    // the train's way round: corners at the middle of the corner blocks
    const X=q=>q*CELL+20.5,P=[[X(x0),X(z0)],[X(x1),X(z0)],[X(x1),X(z1)],[X(x0),X(z1)]];M.path=[];
    for(let i=0;i<4;i++){const [ax0,az0]=P[i],[bx0,bz0]=P[(i+1)%4],l=Math.hypot(bx0-ax0,bz0-az0);for(let t=0;t<l;t+=1)M.path.push([ax0+(bx0-ax0)*t/l,az0+(bz0-az0)*t/l]);}
    M.stops=M.stations.map(st=>{const cx=st.px*CELL+20.5,cz=st.pz*CELL+20.5;let bi=0,bd=1e9;M.path.forEach((p,i)=>{const d=Math.hypot(p[0]-cx,p[1]-cz);if(d<bd){bd=d;bi=i;}});return bi;});
  }
  if(metroC.size>2000)metroC.clear();metroC.set(key,M);return M;
}
// (does a big site of the macro grid cover this block? -- worked out without asking superOf, which asks us)
function macroHit(px,pz){const M=macroOf1(px,pz);return !!M&&M.kind!=='hood'&&px>=M.ax&&px<M.ax+M.w&&pz>=M.az&&pz<M.az+M.h;}
function metrosNear(px,pz){
  const out=[],rx=Math.round(px/SET_SP),rz=Math.round(pz/SET_SP);
  for(let a=rx-1;a<=rx+1;a++)for(let b=rz-1;b<=rz+1;b++){const M=metroOf(settlementLat(a,b));if(M&&px>=M.x0-1&&px<=M.x1+1&&pz>=M.z0-1&&pz<=M.z1+1)out.push(M);}
  return out;
}
function metroStation(px,pz){for(const M of metrosNear(px,pz))for(const st of M.stations)if(st.px===px&&st.pz===pz)return st;return null;}
function rectMetro(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(metroStation(ax+i,az+j))return true;return false;}
// (rec, if given, hears of every block written, with 1 for the sewer or 2 for the subway: see gfxRec)
function undergroundPass(a,x0,z0,rec){
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,rx=mod(x,CELL),rz=mod(z,CELL),px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
    let kind=1;
    const set=(y,b)=>{const i=li(lx,y,lz);a[i]=b;if(rec)rec(i,b,kind);},at=y=>a[li(lx,y,lz)];
    const rX=rx<ROADW,rZ=rz<ROADW;
    // the sewer
    if((rX||rZ)&&streetTown(px,pz)){
      const inZ=rx>=2&&rx<=5,inX=rz>=2&&rz<=5,chZ=rx>=3&&rx<=4,chX=rz>=3&&rz<=4;
      let inner,ch;
      if(rX&&rZ){inner=inZ||inX;ch=chZ&&inX||chX&&inZ;}
      else if(rX){inner=inZ;ch=chZ;}else{inner=inX;ch=chX;}
      const al=rX&&!rZ?z:x;
      for(let y=SEW0;y<G;y++)set(y,BRICK);
      if(inner){set(SEW0+1,ch?WATER:COBBLE);for(let y=SEW0+2;y<G-1;y++)set(y,AIR);
        if(!(rX&&rZ)&&(rX?rx===2||rx===5:rz===2||rz===5))set(G-2,BRICK);}            // (the vault's corners)
      else if(!(rX&&rZ)&&mod(al,10)===5&&(rX?rx===1:rz===1))set(G-4,LAMP);
      if(!(rX&&rZ)&&(rX?rx===3:rz===3)&&mod(al,48)===30&&ROADTOP.has(at(G))&&at(G)!==SIDEWALK)set(G,METAL);   // a manhole cover
    }
    // the subway
    kind=2;
    for(const M of metrosNear(px,pz)){
      for(const [ax,k] of [['x',M.z0],['x',M.z1],['z',M.x0],['z',M.x1]]){
        const cc=(ax==='x'?z:x)-(k*CELL+20),s=ax==='x'?x:z,lo=(ax==='x'?M.x0:M.z0)*CELL+16,hi=(ax==='x'?M.x1:M.z1)*CELL+25;
        if(s<lo||s>hi)continue;
        const st=metroStation(px,pz),inSt=st&&st.ax===ax&&(ax==='x'?pz:px)===k;
        if(inSt){metroStationCol(set,at,ax==='x'?rx:rz,cc,ax);continue;}
        if(Math.abs(cc)>4)continue;
        if(Math.abs(cc)===4){for(let y=SUB_F;y<=SUB_F+6;y++)if(at(y)!==AIR||y===SUB_F)set(y,CONCRETE);continue;}
        set(SUB_F,Math.abs(cc)===1?METAL:GRAVEL);for(let y=SUB_F+1;y<=SUB_F+5;y++)set(y,AIR);
        if(at(SUB_F+6)!==AIR)set(SUB_F+6,cc===0&&mod(s,8)===0?LAMP:CONCRETE);
      }
    }
  }
}
// one column of a subway station (its block: along the line u 0..31, across it c from the track's middle). The hall:
// platforms either side, tiled walls, lamps, benches. The stair: four blocks wide, from the pavement on the far end of
// the block down under the plaza to the hall, in stair blocks (rising toward the pavement, so a ramp underfoot); a glass
// canopy over its mouth, a sign on a post. ax: the way the line runs (u along it)
function metroStationCol(set,at,u,c,ax){
  const ac=Math.abs(c);
  // the hall
  if(u>=8&&ac<=7){
    if(ac===7&&!(c===-7&&u<=12)){for(let y=SUB_F;y<=SUB_F+6;y++)set(y,PAINT_WHITE);}
    else{set(SUB_F+6,(u%6===2&&ac===4)?LAMP:CONCRETE);
      if(ac<=2){set(SUB_F,ac===1?METAL:GRAVEL);for(let y=SUB_F+1;y<=SUB_F+5;y++)set(y,AIR);}
      else{set(SUB_F,CONCRETE);set(SUB_F+1,ac===3?PAINT_YELLOW:CONCRETE);for(let y=SUB_F+2;y<=SUB_F+5;y++)set(y,AIR);if(ac===6&&u%6===0)set(SUB_F+2,SEAT_B);}}}
  else if(u<8&&ac<=4){
    if(ac===4){for(let y=SUB_F;y<=SUB_F+6;y++)set(y,CONCRETE);}
    else{set(SUB_F,ac===1?METAL:GRAVEL);for(let y=SUB_F+1;y<=SUB_F+5;y++)set(y,AIR);set(SUB_F+6,CONCRETE);}}
  // the stair: c -12..-8, stepping down from the pavement at u 30 to the hall's level at u 11, a landing beyond
  if(c>=-11&&c<=-8&&u>=8&&u<=30){
    const i=Math.min(19,30-u),top=G-i;
    for(let y=SUB_F;y<=top;y++)set(y,CONCRETE);
    if(i<19)set(top,stairId(ax==='x'?0:2,0));   // (each step a stair block, its low edge meeting the step below)
    const head=i<=4?G+3:top+4;for(let y=top+1;y<=head;y++)set(y,AIR);
    if(i>4&&top+5<G)set(top+5,CONCRETE);
    if(u>=26&&u<=30){set(G+4,GLASS);}   // the canopy
  }
  // the stairway's tiled sides
  if((c===-12||c===-7)&&u>=8&&u<=25){const i=Math.min(19,30-u),top=G-i;for(let y=top+1;y<=top+4&&y<G;y++)if(c===-12||y>SUB_F+6)set(y,PAINT_WHITE);}
  // round the stair's mouth: railings along its sides, posts holding up the canopy, the sign
  if((c===-12||c===-7)&&u>=26&&u<=30){set(G+1,FENCE);set(G+2,AIR);set(G+3,AIR);if(u===26||u===30){set(G+1,METAL);set(G+2,METAL);set(G+3,METAL);}set(G+4,GLASS);}
  if(c===-6&&u===31){for(let y=G+1;y<=G+3;y++)set(y,METAL);set(G+4,NEON_B);}
}
// what's under you here: 'sewer', 'subway' or null
function underAt(x,y,z){
  if(y>=G-1)return null;
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
  if(y>SEW0&&streetTown(px,pz)&&(mod(x,CELL)<ROADW||mod(z,CELL)<ROADW))return'sewer';
  if(y>SUB_F&&y<SUB_F+7&&metrosNear(px,pz).length)return'subway';
  if(y<G-3&&!settlementAt(px,pz)&&!seaPlot(px,pz))return'cave';
  return null;
}
