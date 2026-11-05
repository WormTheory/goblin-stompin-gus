// ---- parking: every block (and multi-block site) with buildings gets a surface car park, unless a multi-storey
// car park is right next door. A lot is a strip along one side: a row of bays against the building, an aisle to the
// pavement. Buildings are set back to make room. ----
function nearGarage(px,pz){for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const S=superOf(px+dx,pz+dz);if(S&&S.kind==='garage')return true;}return false;}
function lotRect(side,x0,x1,z0,z1,d){
  if(side===0)return{x0,x1,z0,z1:z0+d,face:0};   // cars nose in toward +z
  if(side===1)return{x0:x1-d,x1,z0,z1,face:3};   // toward -x
  if(side===2)return{x0,x1,z0:z1-d,z1,face:2};   // toward -z
  return{x0,x1:x0+d,z0,z1,face:1};               // toward +x
}
function shrinkOut(b,L){
  if(b.x1<=L.x0||b.x0>=L.x1||b.z1<=L.z0||b.z0>=L.z1)return;
  if(L.face===0)b.z0=Math.max(b.z0,L.z1);else if(L.face===2)b.z1=Math.min(b.z1,L.z0);else if(L.face===3)b.x1=Math.min(b.x1,L.x0);else b.x0=Math.max(b.x0,L.x1);
}
function addLots(p,px,pz,r){
  p.lots=[];
  if(nearGarage(px,pz)&&!(p.super&&['mall','bigbox','market','drug','sitdown'].includes(p.super.kind)))return;   // (big stores always have their own)   // (a mall always has its own)
  const t=p.type,S=p.super,lot=L=>{p.lots.push(L);for(const b of p.b)shrinkOut(b,L);p.b=p.b.filter(b=>b.x1-b.x0>=4&&b.z1-b.z0>=4);};
  // (towers and mid-rises fill their block: a real one has its car park underneath, and they need the room for stairs and bathrooms)
  if(t==='sitdown')p.lots.push({x0:PL0,x1:PL1,z0:PL0+17,z1:PL1,face:2});
  else if(S&&px===S.ax&&pz===S.az){
    const W=(S.w-1)*CELL,D=(S.h-1)*CELL,X1=PL1+W,Z1=PL1+D;
    if(S.kind==='hospital')lot(lotRect(0,PL0,X1,PL0,Z1,8));
    else if(S.kind==='bigbox'||S.kind==='market'){const b=p.b[0],z1=b.z0-4;p.lots.push(z1-(PL0+2)>=17?{x0:PL0+2,x1:X1-2,z0:PL0+2,z1,face:0,big:'z'}:{x0:PL0+2,x1:X1-2,z0:PL0+2,z1:b.z0-1,face:0});}   // rows of bays, or one row along the front if it's shallow
    else if((S.kind==='drug'||S.kind==='sitdown')&&p.siteLot)p.lots.push(...p.siteLot);
    else if(S.kind==='mall'){const b=p.b[0],longZ=S.h>S.w;
      p.lots.push(longZ?{x0:PL0+2,x1:X1-2,z0:b.z1+4,z1:Z1-2,face:0,big:'z'}:{x0:b.x1+4,x1:X1-2,z0:PL0+2,z1:Z1-2,face:1,big:'x'});}
    else if(S.kind==='mega')lot(lotRect(Math.floor(r(60)*4),PL0,X1,PL0,Z1,7));
    else if(S.kind==='police'){const L=lotRect(W>=D?3:0,PL0,X1,PL0,Z1,14);L.police=true;lot(L);const B=p.b[0];if(B)B.stair={ax:'x',c0:B.z0+3,c1:B.z0+6,r0:B.x0+4,L:FH};}   // (stairs: put in once the car park has settled where the walls are)
    else if(S.kind==='capitol'){const g=capGeo();p.lots.push({x0:PL0+g.px0,x1:PL0+g.px1,z0:PL0+g.L-7,z1:PL0+g.L-1,face:2});}
    else if(S.kind==='stadium'){
      // big car parks filling the concourses at both ends
      const SW=W+PW,SL=D+PW,F=stadiumField(SW,SL);
      if(F.long){for(const v0 of [1,9])p.lots.push({x0:PL0+4,x1:PL0+SW-4,z0:PL0+v0,z1:PL0+v0+7,face:0},{x0:PL0+4,x1:PL0+SW-4,z0:PL0+SL-v0-7,z1:PL0+SL-v0,face:2});}
      else{for(const u0 of [1,9])p.lots.push({x0:PL0+u0,x1:PL0+u0+7,z0:PL0+4,z1:PL0+SL-4,face:1},{x0:PL0+SW-u0-7,x1:PL0+SW-u0,z0:PL0+4,z1:PL0+SL-4,face:3});}
    }
  }
}
// is this spot in a lot painted with a bay line? and where are its bays (centre, and which way the car faces)
const lotLine=L=>L.big?(L.big==='z'?LANE:LANEX):(L.face===0||L.face===2)?LANE:LANEX;   // white stall dividers, running the way the cars park
// a big car park: an 18-deep module repeating along its length (a row of bays, a 6-wide aisle, another row of bays)
function bigLotMark(L,x,z){const q=L.big==='z'?(z-L.z0)%18:(x-L.x0)%18,along=L.big==='z'?x-L.x0:z-L.z0;return(q<5||q>=13)&&along%3===0;}
function lotMark(L,x,z){if(L.big)return bigLotMark(L,x,z);
  const band=L.face===0?z>=L.z1-4:L.face===2?z<L.z0+4:L.face===1?x>=L.x1-4:x<L.x0+4,along=(L.face===0||L.face===2)?x-L.x0:z-L.z0;
  return band&&along%3===0;
}
function lotBays(L){
  if(L.big){const out=[],len=L.big==='z'?L.z1-L.z0:L.x1-L.x0,wid=L.big==='z'?L.x1-L.x0:L.z1-L.z0;
    for(let m=0;18*m+17<=len;m++)for(const [q,h] of [[2.5,0],[15.5,Math.PI]])for(let k=0;3*k+4<=wid;k++){
      const a=3*k+2,s=18*m+q;
      out.push(L.big==='z'?{x:L.x0+a,z:L.z0+s,h}:{x:L.x0+s,z:L.z0+a,h:h+Math.PI/2});}
    return out;}
  const out=[],alongX=L.face===0||L.face===2,len=alongX?L.x1-L.x0:L.z1-L.z0;
  for(let k=0;3*k+4<=len;k++){const a=(alongX?L.x0:L.z0)+3*k+2;   // midway between two divider lines (block k*3 and block k*3+3, so a closing line has to fit too)
    if(L.face===0)out.push({x:a,z:L.z1-2,h:0});else if(L.face===2)out.push({x:a,z:L.z0+2,h:Math.PI});
    else if(L.face===1)out.push({x:L.x1-2,z:a,h:Math.PI/2});else out.push({x:L.x0+2,z:a,h:-Math.PI/2});}
  return out;
}
const lotAt=(P,x,z)=>{if(P.lots)for(const L of P.lots)if(x>=L.x0&&x<L.x1&&z>=L.z0&&z<L.z1)return L;return null;};
// ---- sky-bridges: some neighbouring towers are joined across the street, a glassed-in walkway a storey tall ----
const bridgeCache=new Map();
const towerTopOuter=b=>b.tier>0&&(b.x1-b.x0)>=8?b.tier:b.top;
// the bridge between plot (px,pz) and its +x (ax 0) or +z (ax 1) neighbour, or null
function bridgeOf(px,pz,ax){
  const k=px*1000003+pz*2+ax;let br=bridgeCache.get(k);if(br!==undefined)return br;br=null;
  const qx=ax?px:px+1,qz=ax?pz+1:pz;
  if(plotType(px,pz)==='tower'&&plotType(qx,qz)==='tower'&&!(ax?hwRow(pz+1,px):hwCol(px+1,pz))&&!(ax?jx(px,pz+1):jz(px+1,pz))&&hash2(px*131+ax*17+7,pz*71+ax*5+3)<0.5){
    const a=plotInfo(px,pz).b[0],b=plotInfo(qx,qz).b[0];
    // the walkway floor has to be a floor slab in both towers
    if((a.gf-b.gf)%FH===0){
      const lo=G+Math.max(a.gf,b.gf),hi=Math.min(towerTopOuter(a),towerTopOuter(b))-FH-1,slots=Math.floor((hi-lo)/FH);
      if(slots>=1){
        const y0=lo+FH*Math.floor(hash2(px*53+ax,pz*97+ax*3)*slots);
        const X0=px*CELL,Z0=pz*CELL,QX=qx*CELL,QZ=qz*CELL;
        br=ax?{ax,s0:Z0+a.z1,s1:QZ+b.z0,c0:X0+PC-2,c1:X0+PC+3,y0,y1:y0+FH,wall:a.wall}
             :{ax,s0:X0+a.x1,s1:QX+b.x0,c0:Z0+PC-2,c1:Z0+PC+3,y0,y1:y0+FH,wall:a.wall};
        if(br.s1-br.s0<2)br=null;
      }
    }
  }
  bridgeCache.set(k,br);return br;
}
function bridgeAt(x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
  for(const q of [px-1,px]){const br=bridgeOf(q,pz,0);if(br&&x>=br.s0&&x<br.s1&&z>=br.c0&&z<br.c1)return br;}
  for(const q of [pz-1,pz]){const br=bridgeOf(px,q,1);if(br&&z>=br.s0&&z<br.s1&&x>=br.c0&&x<br.c1)return br;}
  return null;
}
// the walkway's own blocks in a column: floor, low wall, glass sides, roof
function bridgeBlock(br,x,z,y){
  if(y<br.y0||y>br.y1)return AIR;
  const cc=br.ax?x:z,edge=cc===br.c0||cc===br.c1-1;
  if(y===br.y0)return((br.ax?z:x)%4===0&&!edge)?LAMP:CONCRETE;
  if(y===br.y1)return edge?br.wall:ROOF;
  if(!edge)return AIR;
  return y===br.y0+1?br.wall:GLASS;
}
// a doorway through a tower's wall where a bridge meets it
function bridgeDoor(b,px,pz,rx,rz,y){
  if(b.kind!=='office')return false;
  const chk=(br,cross)=>br&&y>br.y0&&y<br.y1&&cross>br.c0&&cross<br.c1-1;
  const wx=px*CELL+rx,wz=pz*CELL+rz;
  if(rx===b.x1-1&&chk(bridgeOf(px,pz,0),wz))return true;
  if(rx===b.x0&&chk(bridgeOf(px-1,pz,0),wz))return true;
  if(rz===b.z1-1&&chk(bridgeOf(px,pz,1),wx))return true;
  if(rz===b.z0&&chk(bridgeOf(px,pz-1,1),wx))return true;
  return false;
}
// what goes in a building's doorway, by what it is and how big: {w: half-width (0 = one block wide), h: height, k: kind}
// A house gets a single wooden front door, a barn its big doors; a little shop, diner or kiosk a single glass door; a
// mid-sized building glass double doors (three wide); towers, hospitals, police stations, supermarkets and the like the
// full-height glass entrance. Fire-station bays and car parks stay open (things drive in and out).
function doorSpec(b){
  if(b.doorSpec!==undefined)return b.doorSpec;
  const span=(b.door<2?b.z1-b.z0:b.x1-b.x0),st=Math.round((b.top-G)/FH);let d;
  if(b.style==='house')d=b.wall===RUST?{w:1,h:4,k:'barn'}:{w:0,h:3,k:'wood'};
  else if(b.style==='garage'||b.style==='site')d=null;
  else if(b.kind==='ward'||b.kind==='police'||b.style==='mall'||b.bigbox||b.ground==='grocery'||b.ground==='market'||(b.gf||FH)>FH||st>=8)d={w:1,h:4,k:'glass'};
  else if(span<16&&st<=2)d={w:0,h:3,k:'glass'};
  else d={w:1,h:3,k:'glass'};
  b.doorSpec=d;return d;
}
function doorBlock(b,rx,rz,lvl,big){
  const d=big?{w:2,h:4,k:'glass'}:doorSpec(b);if(!d)return AIR;
  const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1,off=big?0:(b.door<2?rz-cz:rx-cx);
  if(Math.abs(off)>d.w||lvl>=d.h)return -1;   // (the rest of the opening: wall round the door)
  if(d.k==='wood')return lvl===1?DOOR_WK:DOOR_W;
  if(d.k==='barn')return DOOR_BARN;
  return lvl===1?DOOR_GB:DOOR_G;
}
function isDoor(b,rx,rz,ex0,ex1,ez0,ez1){
  if(b.bigbox)return rz===ez0&&b.bigbox.some(e=>Math.abs(rx-e)<=1);
  if(b.bays&&rz===ez0&&b.bays.some(c=>Math.abs(rx-c)<=1))return true;   // a fire station's big bay doors
  if(b.er&&(b.er.mode==='front'?rz===ez0&&Math.abs(rx-b.er.door)<=2:rx===ex1-1&&Math.abs(rz-b.er.door)<=2))return true;   // the ER's wide doors
  const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
  if(b.door===0)return rx===ex0&&Math.abs(rz-cz)<=1;
  if(b.door===1)return rx===ex1-1&&Math.abs(rz-cz)<=1;
  if(b.door===2)return rz===ez0&&Math.abs(rx-cx)<=1;
  return rz===ez1-1&&Math.abs(rx-cx)<=1;
}
// which storey a height (fl blocks above the street) falls in: FL_SLAB = it's a floor slab, FL_LVL = blocks above
// that storey's floor (0 = standing height), FL_NO = storey number (0 = ground floor)
let FL_SLAB=false,FL_LVL=0,FL_NO=0;
function flo(b,fl){
  const gf=b.gf||FH;
  if(fl<gf){FL_SLAB=false;FL_LVL=fl-1;FL_NO=0;return;}
  const f2=fl-gf;
  if(f2%FH===0){FL_SLAB=true;FL_LVL=-1;FL_NO=1+f2/FH;return;}
  FL_SLAB=false;FL_LVL=(f2-1)%FH;FL_NO=1+Math.floor((f2-1)/FH);
}
// what sits on each floor: lobbies, offices, apartments, shops, the police station, hospitals, supermarkets
