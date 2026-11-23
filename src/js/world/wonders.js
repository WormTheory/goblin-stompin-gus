// ---- the wilds' wonders (plan phase 4): sea stacks and sea arches off rugged shores (seaStack, from seaWater), and out on
// the open plains stone arches in the desert, waterfalls down cliffs, and the rare landmarks: a giant's ribs in the
// desert, a great tree in the forests, a great baobab on the savanna, a wandering stone on the tundra, standing stones on
// the moor and grassland. Each inland one is at most one per cell of a lattice (WD_SP: its kind's spacing), worked out
// once (wdCell) from the plan and the land's own height, and cut into what plainsColumn made (wonderColumn, from
// genChunk). Arithmetic and Math.sqrt only, like the rest of the landscape. ----
const ARCH_SP=640,FALL_SP=512,LM_SP=1792,WD_C=new Map();let WD_S=null;
function wdCell(SP,fn,ix,iz){
  if(WD_S!==seed){WD_S=seed;WD_C.clear();}
  const k=(ix*100003+iz)*4+(SP===ARCH_SP?0:SP===FALL_SP?1:2);if(WD_C.has(k))return WD_C.get(k);
  const cx=Math.floor(ix*SP+64+hash2(ix*37+SP,iz*13+5)*(SP-128)),cz=Math.floor(iz*SP+64+hash2(ix*11+3,iz*41+SP)*(SP-128)),v=fn(ix,iz,cx,cz);
  if(WD_C.size>20000)WD_C.clear();WD_C.set(k,v);return v;}
const wdIn=(x,z,SP,fn)=>wdCell(SP,fn,Math.floor(x/SP),Math.floor(z/SP));
// (the biome near (x,z): the climate lattice's, never climAt, which the column being made may be using)
// (the biome round (x,z), only where the climate lattice's four corners round it all agree, so a wonder never stands
// over the dithered edge into the next biome: '' there)
const wdBio=(x,z)=>{const i=Math.floor(x/CL_SP),j=Math.floor(z/CL_SP),b=clCorner(i,j).b;
  return clCorner(i+1,j).b===b&&clCorner(i,j+1).b===b&&clCorner(i+1,j+1).b===b?BIOMES[b].k:'';};
// (where along (u) and across (w) a shape laid along the x axis (ax 0) or the z axis (ax 1) is (x,z) from its middle)
const wdUW=(S,x,z)=>S.ax?[z+0.5-S.z,x+0.5-S.x]:[x+0.5-S.x,z+0.5-S.z];
// a stone arch: in the desert, the badlands and the scrub, on open ground clear of roads and rivers
function wdArchAt(ix,iz,cx,cz){
  if(hash2(ix*19+7,iz*3+11)>0.5||cx*cx+cz*cz<START_R0*START_R0)return null;
  const b=wdBio(cx,cz);if(b!=='desert'&&b!=='badlands'&&b!=='scrub')return null;
  if(!rlfOpen(cx,cz,1)||roadNear(cx,cz)<36||riverAt(cx,cz,30))return null;
  const h0=plainsH(cx,cz);if(h0<0||RLF.salt||RLF.wl>-99)return null;
  const q=hash2(ix*5+2,iz*9+4);return {k:'arch',x:cx,z:cz,h0,ax:q<0.5?0:1,L:8+Math.floor(q*2*5)%6,H:12+Math.floor(hash2(ix*3+8,iz*7+1)*7),b};}
// a waterfall: where the land drops ten blocks or more within a few blocks (an escarpment, a mesa's side, a mountain's
// cut-back face), found by sampling the cell every 16 blocks; a stream runs to its edge, the water falls down the face,
// and there's a pool at its foot
function wdFallAt(ix,iz,cx,cz){
  if(hash2(ix*23+1,iz*31+9)>0.55||cx*cx+cz*cz<START_R0*START_R0)return null;
  const E=clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP));if(E.r<0.28&&!(E.mesa>0.2))return null;
  const X0=ix*FALL_SP+64,Z0=iz*FALL_SP+64,N=Math.floor((FALL_SP-128)/16)+1,hs=[];let best=null;
  const hAt=(x,z)=>{const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);if(!PLAINS_OPEN(px,pz))return null;const h=plainsH(x,z);return h<0||RLF.wl>-99||RLF.salt?null:h;};
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)hs[i*N+j]=hAt(X0+i*16,Z0+j*16);
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=hs[i*N+j];if(a===null)continue;
    for(const [di,dj] of [[1,0],[0,1],[-1,0],[0,-1]]){const i2=i+di,j2=j+dj;if(i2<0||j2<0||i2>=N||j2>=N)continue;const c=hs[i2*N+j2];if(c===null)continue;
      if(a-c>=10&&(!best||a-c>best.d))best={d:a-c,x:X0+i*16,z:Z0+j*16,di,dj};}}
  if(!best)return null;
  // (along the line from the high sample to the low one, block by block: the edge, where it starts falling, and the foot)
  const x0=best.x,z0=best.z,t=clCorner(Math.round(x0/CL_SP),Math.round(z0/CL_SP)).t;let i0=-1,i1=-1,top=0,bot=0;const H=[];
  for(let a=0;a<=16;a++){const h=plainsH(x0+best.di*a,z0+best.dj*a);H.push(h);}
  top=H[0];if(top>rlfSnow(t)-2)return null;
  for(let a=0;a<16;a++)if(i0<0&&H[a]-H[a+1]>=2)i0=a;
  if(i0<0)return null;top=H[i0];bot=H[16];
  for(let a=i0+1;a<=16;a++)if(i1<0&&H[a]<=bot+1)i1=a;
  if(i1<0||top-bot<8||roadNear(x0,z0)<20)return null;
  return {k:'fall',x:x0,z:z0,di:best.di,dj:best.dj,i0,i1,top,bot,H};}
// a landmark: one of a few, by the country it's in, on open ground well clear of roads and rivers
function wdLmAt(ix,iz,cx,cz){
  if(hash2(ix*29+3,iz*17+13)>0.4||cx*cx+cz*cz<START_R0*START_R0)return null;
  const b=wdBio(cx,cz),k=b==='desert'||b==='badlands'||b==='scrub'?'ribs':b==='forest'||b==='rainforest'||b==='taiga'||b==='swamp'?'tree':b==='savanna'?'baobab':b==='tundra'||b==='ice'?'erratic':b?'henge':'';
  if(!k)return null;
  if(!rlfOpen(cx,cz,2)||roadNear(cx,cz)<50||riverAt(cx,cz,40))return null;
  const h0=plainsH(cx,cz);if(h0<0||RLF.wl>-99||RLF.cut||RLF.salt||h0>rlfRock(clCorner(Math.round(cx/CL_SP),Math.round(cz/CL_SP)).t))return null;
  return {k,x:cx,z:cz,h0,ax:hash2(ix*3+1,iz*5+2)<0.5?0:1,b};}
const WD_NAME={arch:'\u{1F3DC}️ Stone arch',fall:'\u{1F4A7} Waterfall',ribs:"\u{1F9B4} Giant's ribs",tree:'\u{1F333} Great tree',baobab:'\u{1F333} Great baobab',erratic:'\u{1FAA8} Wandering stone',henge:'\u{1F5FF} Standing stones',stack:'\u{1F30A} Sea stacks'};
// (the wonder within r blocks of (x,z), for where-you-are)
function wonderNear(x,z,r){
  for(const [SP,fn] of [[LM_SP,wdLmAt],[ARCH_SP,wdArchAt],[FALL_SP,wdFallAt]]){const W=wdIn(x,z,SP,fn);if(W){const dx=x-W.x,dz=z-W.z;if(dx*dx+dz*dz<r*r)return W;}}
  return null;}
// (the wonders whose middles are in the box x0..x1, z0..z1 (blocks), for the maps: [kind, x, z] each, kind a WD_NAME key)
// (ms: work out cells not known yet for no more than that long, then leave them; WD_MORE says some were left)
let WD_MORE=false;
function wondersIn(x0,z0,x1,z1,ms){const out=[],t0=ms?performance.now():0;WD_MORE=false;
  for(const [SP,fn,c] of [[LM_SP,wdLmAt,2],[ARCH_SP,wdArchAt,0],[FALL_SP,wdFallAt,1]])
    for(let i=Math.floor(x0/SP);i<=Math.floor(x1/SP);i++)for(let j=Math.floor(z0/SP);j<=Math.floor(z1/SP);j++){
      if(ms&&!(WD_S===seed&&WD_C.has((i*100003+j)*4+c))&&performance.now()-t0>ms){WD_MORE=true;continue;}
      const W=wdCell(SP,fn,i,j);
      if(W&&W.x>=x0&&W.x<x1&&W.z>=z0&&W.z<z1)out.push([W.k,W.k==='fall'?W.x+W.di*W.i0:W.x,W.k==='fall'?W.z+W.dj*W.i0:W.z]);}
  return out;}
// the standing stones' places round their ring (12, every 30 degrees)
const HENGE=[[1,0],[0.866,0.5],[0.5,0.866],[0,1],[-0.5,0.866],[-0.866,0.5],[-1,0],[-0.866,-0.5],[-0.5,-0.866],[0,-1],[0.5,-0.866],[0.866,-0.5]];
function wonderColumn(col,x,z){
  // (nothing near: the cells' own lookups are cached, so this is cheap for most columns)
  const A=wdIn(x,z,ARCH_SP,wdArchAt),F=wdIn(x,z,FALL_SP,wdFallAt),M=wdIn(x,z,LM_SP,wdLmAt);
  if(A&&Math.abs(x-A.x)<A.L+8&&Math.abs(z-A.z)<A.L+8)archColumn(col,x,z,A);
  if(F&&Math.abs(x-F.x)<30&&Math.abs(z-F.z)<30)fallColumn(col,x,z,F);
  if(M&&Math.abs(x-M.x)<26&&Math.abs(z-M.z)<26)lmColumn(col,x,z,M);
}
// (the ground under a column, as plainsColumn left it)
const wdGround=(x,z)=>G+Math.max(0,plainsH(x,z));
function archColumn(col,x,z,A){
  const [u,w]=wdUW(A,x,z),au=Math.abs(u);if(Math.abs(w)>1.6||au>A.L+3)return;
  const g=wdGround(x,z),base=G+A.h0,yo=base+Math.round(A.H*Math.sqrt(Math.max(0,1-(u/(A.L+3))*(u/(A.L+3))))),yi=au<A.L?base+Math.round((A.H-4)*Math.sqrt(Math.max(0,1-(u/A.L)*(u/A.L)))):-1;
  for(let y=g+1;y<=yo;y++){if(y<=yi)continue;col(y,A.b==='badlands'?((y>>1)%3?TERRA:TERRA2):A.b==='desert'?SANDSTONE:STONE);}
}
function fallColumn(col,x,z,F){
  // (along the fall's line from its high end, and across it)
  const a=F.di?(x-F.x)*F.di:(z-F.z)*F.dj,b=F.di?z-F.z:x-F.x;
  if(Math.abs(b)<=1&&a>=F.i0-7&&a<=F.i0){const g=G+Math.max(0,plainsH(x,z));col(g,WATER);if(a<F.i0-5)col(g-1,WATER);return;}   // the stream to the edge
  if(Math.abs(b)<=1&&a>F.i0&&a<F.i1+1){const g=G+Math.max(0,plainsH(x,z));for(let y=g+1;y<=G+F.top;y++)col(y,WATER);return;}   // the fall down the face
  // the plunge pool at its foot: 6 deep under the fall, shelving to 3 at its rim, deep enough to dive into
  {const fa=a-(F.i1+2),d2=fa*fa+b*b;if(d2<=20){const g=G+Math.max(0,plainsH(x,z)),D=d2<=5?6:d2<=10?5:d2<=15?4:3;
    col(g-D,GRAVEL);for(let y=g-D+1;y<=g;y++)col(y,WATER);if(d2>=15&&hash2(x*3+1,z*5+2)<0.4)col(g+1,MOSSSTONE);}}
}
function lmColumn(col,x,z,M){
  const g=wdGround(x,z),base=G+M.h0,[u,w]=wdUW(M,x,z);
  if(M.k==='ribs'){
    // a long-dead giant: a spine along its length, a rib every three blocks arching up over it, the skull at one end
    const BONE=PAINT_WHITE;
    if(u>=15&&u<=21&&Math.abs(w)<=3){const top=base+(u<=16?5:7);for(let y=g+1;y<=top;y++)col(y,BONE);if(u===21&&Math.abs(w)===2)col(base+5,COAL);if(u===21&&Math.abs(w)<=1)col(base+2,AIR);return;}   // the skull, its eye sockets and jaw
    if(Math.abs(u)<=14&&Math.abs(w)<0.6){col(base+9,BONE);if(Math.abs(u)>12)for(let y=g+1;y<base+9;y++)col(y,BONE);}
    const ru=Math.floor(u);if(mod(ru,3)===0&&ru>=-11&&ru<=12){const R=7*(1-0.35*(ru/14)*(ru/14)),yc=base+2;
      for(let y=g+1;y<=base+10;y++){const dy=y-yc,d=Math.sqrt(w*w+dy*dy);if(Math.abs(d-R)<0.75)col(y,BONE);}}
    return;}
  if(M.k==='tree'||M.k==='baobab'){
    const bb=M.k==='baobab',dx=x+0.5-M.x,dz=z+0.5-M.z,d=Math.sqrt(dx*dx+dz*dz),TR=bb?3.4:2.6,TH=bb?15:30;
    // the trunk, flared into roots at its foot
    for(let y=g+1;y<=base+TH;y++){const k=y-base,r=TR+(k<4?(4-k)*0.7:0);if(d<r)col(y,LOG);}
    // the crown: a great round head of leaves, or the baobab's flat spreading one
    const cy=base+TH+(bb?2:3),RX=bb?11:12,RY=bb?2.5:8;
    for(let y=cy-Math.ceil(RY);y<=cy+Math.ceil(RY);y++){const e=(y-cy)/RY,q=d*d/(RX*RX)+e*e;if(q<1&&hash2(x*7+y,z*3+y*5)<0.9-0.3*q)col(y,LEAVES);}
    if(!bb)for(const [ex,ez] of [[1,0],[-1,0],[0,1],[0,-1]]){const bx=dx*ex+dz*ez,by=Math.abs(dx*ez-dz*ex);if(bx>TR&&bx<9&&by<1)col(base+TH-4+Math.round(bx*0.6),LOG);}   // (branches out into the crown)
    return;}
  if(M.k==='erratic'){
    // a great boulder the ice left behind, alone on the open ground
    const dx=x+0.5-M.x,dz=z+0.5-M.z,n=nzNoise(x/5,z/5,4461)*0.18;
    for(let y=g;y<=base+11;y++){const dy=y-(base+3);const q=dx*dx/64+dy*dy/49+dz*dz/42;if(q<1+n)col(y,hash2(x*5+y,z*3)<0.25?MOSSSTONE:STONE);}
    return;}
  // standing stones: a ring of twelve, lintels across every other pair, a fallen one, and the altar stone in the middle
  const dx=x+0.5-M.x,dz=z+0.5-M.z;
  if(dx*dx+dz*dz<2.6){col(base+1,STONE);col(base+2,MOSSSTONE);return;}
  for(let i=0;i<12;i++){const [cx,cz]=HENGE[i],sx=cx*13,sz=cz*13,ex=dx-sx,ez=dz-sz;
    if(ex*ex+ez*ez<1.7){if(i===7){col(base+1,MOSSSTONE);return;}const h=5+Math.floor(hash2(M.x+i,M.z*3+i)*2);for(let y=g+1;y<=base+h;y++)col(y,y===base+h&&hash2(x,z+y)<0.4?MOSSSTONE:STONE);return;}}
  for(let i=0;i<12;i+=2){const [ax,az]=HENGE[i],[bx,bz]=HENGE[i+1],px=ax*13,pz=az*13,qx=bx*13-px,qz=bz*13-pz,L2=qx*qx+qz*qz,t=Math.max(0,Math.min(1,((dx-px)*qx+(dz-pz)*qz)/L2)),ox=dx-px-qx*t,oz=dz-pz-qz*t;
    if(i!==6&&ox*ox+oz*oz<1.1){col(base+7,STONE);return;}}
}
// a sea stack (or, now and then, an arch between two) a little way out off a rugged shore: one per 22-block cell at most,
// tapering as it rises, a rocky foot at the waterline, grass (snow in the cold) on top
const STK_SP=22,STK_C=new Map();
function stackOf(ix,iz){
  const k=ix*100003+iz;if(STK_C.has(k))return STK_C.get(k);let v=null;
  if(hash2(ix*41+7,iz*43+11)<0.35){const cx=ix*STK_SP+5+hash2(ix*3+1,iz*7+5)*12,cz=iz*STK_SP+5+hash2(ix*9+2,iz*5+3)*12,cd=coastD(cx,cz);
    if(cd>=6&&cd<=17&&beachK(cx,cz,1)<0.05){const F=coastFlav(cx,cz),rc=CF_RC,pt=coastType(Math.floor(cx/CELL),Math.floor(cz/CELL));
      if(rc>0.4&&F!==2&&(pt==='shore'||pt==='sea')){const q=hash2(ix*13+5,iz*11+9);
        let gx=coastD(cx+2,cz)-coastD(cx-2,cz),gz=coastD(cx,cz+2)-coastD(cx,cz-2);const L=Math.sqrt(gx*gx+gz*gz)||1;gx/=L;gz/=L;
        v={x:cx,z:cz,R:1.6+q*1.8,H:Math.round(6+hash2(ix*5+3,iz*3+1)*rc*16),cold:F===1,arch:q<0.28&&rc>0.5,tx:-gz,tz:gx};}}}
  if(STK_C.size>40000)STK_C.clear();STK_C.set(k,v);return v;}
function seaStack(col,x,z,f){
  const ix=Math.floor(x/STK_SP),iz=Math.floor(z/STK_SP);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const S=stackOf(ix+a,iz+b);if(!S)continue;
    const legs=S.arch?[[S.x+S.tx*(S.R+3.5),S.z+S.tz*(S.R+3.5)],[S.x-S.tx*(S.R+3.5),S.z-S.tz*(S.R+3.5)]]:[[S.x,S.z]],R=S.arch?S.R*0.8+0.4:S.R;
    for(const [lx,lz] of legs){const dx=x+0.5-lx,dz=z+0.5-lz,d=Math.sqrt(dx*dx+dz*dz);if(d>R+1)continue;
      let top=-1;for(let y=f;y<=G+S.H;y++){const k=(y-G)/S.H,r=y<=G+1?R+0.8:R*(1-0.25*Math.max(0,k));if(d<r){col(y,hash2(x*3+y,z*5)<0.3?MOSSSTONE:STONE);top=y;}}
      if(top>G+2&&d<R*0.7)col(top,S.cold?SNOW:GRASS);return;}
    if(S.arch){const ax=S.x+S.tx*(S.R+3.5),az=S.z+S.tz*(S.R+3.5),qx=-2*S.tx*(S.R+3.5),qz=-2*S.tz*(S.R+3.5),L2=qx*qx+qz*qz,dx=x+0.5-ax,dz=z+0.5-az,t=Math.max(0,Math.min(1,(dx*qx+dz*qz)/L2)),ox=dx-qx*t,oz=dz-qz*t;
      if(ox*ox+oz*oz<R*R){for(let y=G+S.H-3;y<=G+S.H;y++)col(y,STONE);col(G+S.H,S.cold?SNOW:GRASS);return;}}}
}
