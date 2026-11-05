// ---------- Meshing ----------
const FACES=[
 {dir:[-1,0,0],shade:.8, c:[[0,1,0,0,1],[0,0,0,0,0],[0,1,1,1,1],[0,0,1,1,0]]},
 {dir:[1,0,0], shade:.8, c:[[1,1,1,0,1],[1,0,1,0,0],[1,1,0,1,1],[1,0,0,1,0]]},
 {dir:[0,-1,0],shade:.55,c:[[1,0,1,1,0],[0,0,1,0,0],[1,0,0,1,1],[0,0,0,0,1]]},
 {dir:[0,1,0], shade:1,  c:[[0,1,1,1,1],[1,1,1,0,1],[0,1,0,1,0],[1,1,0,0,0]]},
 {dir:[0,0,-1],shade:.68,c:[[1,0,0,0,0],[0,0,0,1,0],[1,1,0,0,1],[0,1,0,1,1]]},
 {dir:[0,0,1], shade:.68,c:[[0,0,1,0,0],[1,0,1,1,0],[0,1,1,0,1],[1,1,1,1,1]]},
];
const AO=[0.5,0.68,0.84,1],DIM=0.8;
function faceVisible(b,nb){if(nb===AIR)return true;if(BLOCK[b].liquid)return false;return !!BLOCK[nb].transparent&&nb!==b;}
// the voxel world is unlit; at night it's darkened by WORLD_LIGHT, except glowing blocks (windows, neon, lamps),
// which are tagged with a vertex colour of 2 and always render at full brightness
const WORLD_LIGHT={value:new THREE.Color(1,1,1)};
function nightPatch(mat){
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uLight=WORLD_LIGHT;sh.uniforms.uSeasonW=SEASON_W;
    sh.fragmentShader='uniform vec3 uLight;uniform vec4 uSeasonW;\n'+sh.fragmentShader.replace('#include <color_fragment>',FOLIAGE_FRAG+'#ifdef USE_COLOR\n  float glowV=step(1.5,vColor.r);\n  diffuseColor.rgb*=mix(vColor*uLight,vec3(1.0),glowV);\n#endif'+SNOW_FRAG);
    weatherPatch(sh);
  };
  return mat;
}
// weather on the ground: a vertex flag (aSky) marks top faces with nothing above them; on those, snow settles in
// patches as the snow cover grows, and rain darkens them. Anything under a roof, a deck, an awning or a tree stays clear.
const SNOW_U={value:0},WET_U={value:0},SNOWCLK_U={value:0};
// the seasons on the plants: how much of spring, summer, autumn and winter it is (each season fades into the next over
// its last six days). Picked out in the shader by texture tile: leaves (tile 6), grass (0 top, 1 side), flowers (36), crops (55, 56).
const SEASON_W={value:new THREE.Vector4(1,0,0,0)};
function updateSeasonW(){const s=seasonOf(),f=(((dayN-1)%SEASON_LEN)+tod)/SEASON_LEN,t=Math.max(0,(f-0.8)/0.2),w=[0,0,0,0];w[s]=1-t;w[(s+1)%4]+=t;SEASON_W.value.set(w[0],w[1],w[2],w[3]);
  // the leaves come down over autumn's last days (a few, then most), and are back by the end of winter's turn into spring
  const fall=Math.round((w[3]*0.93+w[2]*Math.min(1,w[3]*4)*0.3)*10)/10;
  if(fall!==leafFall){leafFall=fall;leafQ.length=0;for(const k of meshes.keys())leafQ.push(k);}
  for(let n=0;n<4&&leafQ.length;n++){const e=meshes.get(leafQ.pop());if(e)buildChunk(e.cx,e.cz);}
  purgeLeaves();
}
const FOLIAGE_FRAG=`
  {vec2 tcF=floor(vec2(vUv.x*${AC}.0,(1.0-vUv.y)*${AR}.0));float tl=tcF.y*${AC}.0+tcF.x;
   float isLeaf=step(abs(tl-6.0),0.1),isGrass=step(tl,1.1),isFlower=step(abs(tl-36.0),0.1),isCrop=step(abs(tl-55.5),0.6);
   if(isLeaf+isGrass+isFlower+isCrop>0.5){
    vec3 c=diffuseColor.rgb;float lum=dot(c,vec3(0.3,0.59,0.11));float green=clamp((c.g-max(c.r,c.b))*5.0,0.0,1.0);
    vec4 W=uSeasonW;
    // which block this face belongs to (the one behind the face, seen from the camera), for per-tree, per-block variety
#if __VERSION__ >= 300
    vec3 nF=normalize(cross(dFdx(vWp),dFdy(vWp)));nF*=sign(dot(nF,cameraPosition-vWp));vec3 bp=floor(vWp-nF*0.02);
#else
    vec3 bp=floor(vWp-0.001);
#endif
    float hB=fract(sin(dot(mod(bp.xz+bp.y*vec2(7.13,3.31),613.0),vec2(12.9898,78.233)))*43758.5453);
    float hT=fract(sin(dot(mod(floor(bp.xz/5.0),613.0),vec2(39.346,11.135)))*43758.5453);
    // spring: fresh, light greens; summer: deep greens
    vec3 spr=c*vec3(1.03,1.08,0.84)+vec3(0.02,0.025,0.0),sum=c*vec3(0.86,0.97,0.82);
    // autumn: leaves turn gold, orange, red and brown (a tree-ish patch at a time); grass goes straw-coloured
    vec3 pal=hT<0.3?vec3(0.95,0.72,0.2):hT<0.6?vec3(0.95,0.48,0.12):hT<0.82?vec3(0.78,0.2,0.1):vec3(0.55,0.36,0.16);
    pal=mix(pal,vec3(0.9,0.6,0.15),step(0.85,hB)*0.5);
    vec3 aut=isLeaf>0.5?pal*(0.55+lum*1.4):mix(c,vec3(0.66,0.6,0.3)*(0.5+lum*1.2),0.55*green+0.3*isCrop);
    // winter: dull, dry grass, dead flowers, bare crop rows
    vec3 win=isLeaf>0.5?vec3(0.42,0.3,0.18)*(0.6+lum):mix(c,vec3(0.5,0.47,0.33)*(0.55+lum),0.75*max(green,isCrop));
    vec3 seas=spr*W.x+sum*W.y+aut*W.z+win*W.w;
    diffuseColor.rgb=mix(c,seas,max(max(green,isLeaf),isCrop));
    if(isFlower>0.5){float dead=W.w+W.z*0.5;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.45,0.38,0.25)*(0.6+lum*0.8),dead*(1.0-green)*0.9);}
   }}
`;
// when each column's top last changed (on the snow clock, which only runs while snow is building up): a top face uncovered
// by smashing starts bare and builds up its own snow at the normal rate. aSky = 0 (covered) or 1 + that time.
const snowBorn=new Map();
function weatherPatch(sh){
  sh.uniforms.uSnow=SNOW_U;sh.uniforms.uWet=WET_U;sh.uniforms.uSnowClk=SNOWCLK_U;
  sh.vertexShader='attribute float aSky;varying float vSky;varying float vBorn;varying vec3 vWp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vSky=step(0.5,aSky);vBorn=max(aSky-1.0,0.0);vWp=(modelMatrix*vec4(position,1.0)).xyz;');
  sh.fragmentShader='uniform float uSnow,uWet,uSnowClk;varying float vSky;varying float vBorn;varying vec3 vWp;\n'+sh.fragmentShader;
}
const SNOW_FRAG='\n  diffuseColor.rgb*=1.0-0.3*uWet*vSky;\n  if(vSky>0.5&&uSnow>0.0){\n  float snowN=fract(sin(dot(mod(floor(vWp.xz*4.0+0.001),509.0),vec2(12.9898,78.233)))*43758.5453);float snowL=min(uSnow,uSnowClk-vBorn);float snowC=step(snowN,snowL*1.12)*step(0.002,snowL);\n  float snowG=fract(sin(dot(mod(floor(vWp.xz*16.0+0.001),997.0),vec2(39.346,11.135)))*43758.5453);float snowV=0.84+0.11*snowG+0.03*step(0.93,snowG);\n  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(snowV,snowV+0.012,snowV+0.03)*uLight,snowC);}';   // (only top faces open to the sky, only when there's snow: no sums for every other pixel on screen)
const matOpaque=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.5}));
// (the paint and the rails laid on the ground: pulled toward the camera a touch so they never flicker with it)
const matDecal=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
const matWater=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
const scene=new THREE.Scene();
// three.js works out the matrix of every object in the scene on every frame, hidden or not, and the pools of hidden cars, doors
// and signs are most of them. What's hidden is skipped here (it's done again, in full, the frame it's shown), and so are cars,
// which batDraw has just done.
let wmFrame=0;
scene.updateMatrixWorld=function(){for(const c of this.children)if(c.visible&&c.wmDone!==wmFrame)c.updateMatrixWorld(true);};
const meshes=new Map();
// which chunks currently have a voxel mesh (wrapped into a 128x128 map); the far city hides itself there
const MESHED=new Uint8Array(256*256*4);let meshedDirty=true;
function markMeshed(cx,cz,on){const i=((((cz%256)+256)%256)*256+(((cx%256)+256)%256))*4,v=on?255:0;if(MESHED[i]===v)return;MESHED[i]=v;meshedDirty=true;}   // (a chunk rebuilt is still meshed: no need to send the whole map up again)
// a ramp is a wedge: flat bottom, sloped top, trapezoid sides, and an upright face at each end that has height
// a box within block (X,Y,Z) from (x0,y0,z0) to (x1,y1,z1) (fractions of the block), the tile laid on at its true
// scale (so a half-length panel shows half the tile, not the whole of it squashed); skip(i): leave face i off
function emitBox(out,X,Y,Z,x0,y0,z0,x1,y1,z1,tile,skip,sky){
  const tx=tile%AC,ty=Math.floor(tile/AC),B=[[x0,x1],[y0,y1],[z0,z1]];
  FACES.forEach((f,fi)=>{if(skip&&skip(fi))return;const n=out.p.length/3,[dx,dy,dz]=f.dir;
    for(const c of f.c){const px=B[0][c[0]],py=B[1][c[1]],pz=B[2][c[2]];
      let u,v;
      if(dx){u=c[3]===c[2]?pz:1-pz;v=py;}else if(dz){u=c[3]===c[0]?px:1-px;v=py;}else{u=c[3]===c[0]?px:1-px;v=c[4]===c[2]?pz:1-pz;}
      out.p.push(X+px,Y+py,Z+pz);out.u.push((tx+0.002+u*0.996)/AC,1-(ty+1)/AR+(0.002+v*0.996)/AR);
      const s=f.shade*DIM;out.c.push(s,s,s);out.k.push(dy===1&&sky?1:0);}
    out.i.push(n,n+1,n+2,n+2,n+1,n+3);});
}
// a fence: a thin panel (picket or boards) through the middle of its block, running on to whichever neighbours are
// fence too (or a wall it butts up against); on its own, along whichever way it would most likely run
const FENCEISH=b=>b===FENCE||b===FENCE_W||b===CHAINLINK;
function emitFence(out,X,Y,Z,b,info,xm,xp,zm,zp,up,sky){
  if(info.post){emitBox(out,X,Y,Z,0.43,0,0.43,0.57,0.98,0.57,info.tiles[2],()=>false,sky);return;}
  const t=info.thin,tile=info.tiles[2],con=n=>FENCEISH(n)||(n&&BLOCK[n].solid&&!BLOCK[n].transparent&&!BLOCK[n].brittle);
  let cx0=con(xm),cx1=con(xp),cz0=con(zm),cz1=con(zp);
  if(!cx0&&!cx1&&!cz0&&!cz1){cx0=cx1=true;}
  const topOpen=!FENCEISH(up);
  const runX=cx0||cx1,runZ=cz0||cz1;
  // along x: from the middle out to each connected side (or just the middle, as a post, if only the other way runs)
  if(runX)emitBox(out,X,Y,Z,cx0?0:0.5-t,0,0.5-t,cx1?1:0.5+t,1,0.5+t,tile,fi=>fi===2||(fi===3&&!topOpen)||(fi===0&&cx0&&FENCEISH(xm))||(fi===1&&cx1&&FENCEISH(xp)),sky);
  if(runZ)emitBox(out,X,Y,Z,0.5-t,0,cz0?0:0.5-t,0.5+t,1,cz1?1:0.5+t,tile,fi=>fi===2||(fi===3&&!topOpen)||(fi===4&&cz0&&FENCEISH(zm))||(fi===5&&cz1&&FENCEISH(zp)),sky);
}
function emitRamp(out,X,Y,Z,info){
  const R=info.ramp;
  // heights at the 4 top corners (x0z0, x1z0, x0z1, x1z1)
  const hAt=(fx,fz)=>{const t=R.dir===0?fx:R.dir===1?1-fx:R.dir===2?fz:1-fz;return R.h0+(R.h1-R.h0)*t;};
  const H00=hAt(0,0),H10=hAt(1,0),H01=hAt(0,1),H11=hAt(1,1);
  const quad=(vs,n,tile,shade,uvOf)=>{
    let [A,B,C,D]=vs;const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];
    const X3=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
    let cr=X3(e1,e2);if(Math.abs(cr[0])+Math.abs(cr[1])+Math.abs(cr[2])<1e-6)cr=X3(e1,[D[0]-A[0],D[1]-A[1],D[2]-A[2]]);   // a corner of zero height
    if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){const t=B;B=C;C=t;}
    const tx=tile%AC,ty=Math.floor(tile/AC),i0=out.p.length/3,s=shade*DIM;
    for(const v of [A,B,C,D]){out.p.push(X+v[0],Y+v[1],Z+v[2]);const [u,w]=uvOf(v);out.u.push((tx+0.002+u*0.996)/AC,1-(ty+1)/AR+(0.002+w*0.996)/AR);out.c.push(s,s,s);if(out.k)out.k.push(n[1]>0.5?1:0);}
    out.i.push(i0,i0+1,i0+2,i0+2,i0+1,i0+3);
  };
  const top=info.tiles[0],side=info.tiles[2];
  if(info.stair){
    // three steps to the block, each a tread and a riser, with a stepped profile down either side
    const N=3,along=R.dir<2,P=(t,c,h)=>{const q=R.dir%2?1-t:t;return along?[q,h,c]:[c,h,q];},nA=R.dir===0?[-1,0,0]:R.dir===1?[1,0,0]:R.dir===2?[0,0,-1]:[0,0,1];
    const uvT=v=>[v[0],v[2]],uvR=along?v=>[v[2],v[1]]:v=>[v[0],v[1]],uvS=along?v=>[v[0],v[1]]:v=>[v[2],v[1]];
    for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N,h0=i/N,h1=(i+1)/N;
      quad([P(t0,0,h1),P(t1,0,h1),P(t0,1,h1),P(t1,1,h1)],[0,1,0],top,1,uvT);                       // the tread
      quad([P(t0,0,h0),P(t0,1,h0),P(t0,0,h1),P(t0,1,h1)],nA,side,0.62,uvR);                         // the riser, darker so the steps show
      for(const c of [0,1]){const n=along?[0,0,c?1:-1]:[c?1:-1,0,0];quad([P(t0,c,0),P(t1,c,0),P(t0,c,h1),P(t1,c,h1)],n,side,along?0.68:0.8,uvS);}}   // the sides
    quad([P(0,0,0),P(1,0,0),P(0,1,0),P(1,1,0)],[0,-1,0],side,0.55,uvT);
    quad([P(1,0,0),P(1,1,0),P(1,0,1),P(1,1,1)],[-nA[0],0,-nA[2]],side,0.6,uvR);
    return;}
  // sloped top: A=(0,H00,0) B=(1,H10,0) C=(0,H01,1) D=(1,H11,1); normal points up-ish
  // (the texture runs the same way as on a flat block's top, so the two halves of a line tile meet in the middle here too)
  quad([[0,H00,0],[1,H10,0],[0,H01,1],[1,H11,1]],[0,1,0],top,1,v=>[1-v[0],v[2]]);
  quad([[0,0,0],[1,0,0],[0,0,1],[1,0,1]],[0,-1,0],side,0.55,v=>[v[0],v[2]]);
  // the four sides (each a trapezoid; skipped when it has no height)
  const sideQ=(a,b,ha,hb,n,sh,uOf)=>{if(ha<0.01&&hb<0.01)return;quad([[a[0],0,a[1]],[b[0],0,b[1]],[a[0],ha,a[1]],[b[0],hb,b[1]]],n,side,sh,v=>[uOf(v),v[1]]);};
  sideQ([0,0],[0,1],H00,H01,[-1,0,0],0.8,v=>v[2]);
  sideQ([1,0],[1,1],H10,H11,[1,0,0],0.8,v=>v[2]);
  sideQ([0,0],[1,0],H00,H10,[0,0,-1],0.68,v=>v[0]);
  sideQ([0,1],[1,1],H01,H11,[0,0,1],0.68,v=>v[0]);
}
// ---- the debug switches that stop props, caves, sewers and subways being drawn. Only the picture changes: the blocks are
// still there for everything that walks, falls or collides. The chunk is drawn from a copy with those places filled in
// with the plain earth that would be there without them, so no walls are left hanging in the dark. ----
const GFX_OFF={props:false,fixtures:false,caves:false,sewers:false,subway:false},GFX_KINDS=['caves','sewers','subway'];
const gfxRecC=new Map();
// every block this chunk's caves (0), sewer (1) and subway (2) wrote, found by running them again on a spare copy
function gfxRec(cx,cz){
  const k=ckey(cx,cz);let R=gfxRecC.get(k);if(R)return R;
  const a=chunkArr(cx,cz).slice(),x0=cx*CS,z0=cz*CS,m=new Map();
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const x=x0+lx,z=z0+lz,qx=Math.floor(x/CELL),qz=Math.floor(z/CELL),col=(y,b)=>{m.set(li(lx,y,lz),b*4);};
    if(bigPlainsAt(qx,qz)||bunkerAt(qx,qz))continue;   // (a mine's galleries or a bunker's rooms may run through a cave: those stay)
    caveCol(col,x,z);if(caveMouth(qx,qz))caveMouthColumn(col,mod(x,CELL),mod(z,CELL),x,z);}
  undergroundPass(a,x0,z0,(i,b,kind)=>{m.set(i,b*4+kind);});
  R=[...m];if(gfxRecC.size>800)gfxRecC.clear();gfxRecC.set(k,R);return R;
}
// the chunk as it's drawn: only what still stands as it was built is taken away (a crater stays a crater)
function gfxArr(cx,cz){
  const a=chunkArr(cx,cz).slice(),x0=cx*CS,z0=cz*CS,A=CS*CS;
  for(const [i,v] of gfxRec(cx,cz)){const kind=GFX_KINDS[v&3],b=v>>2;if(!GFX_OFF[kind]||a[i]!==b)continue;
    const y=Math.floor(i/A),r=i-y*A;
    if(y<G)a[i]=earthAt(x0+r%CS,y,z0+Math.floor(r/CS));
    else if(y>G)a[i]=AIR;
    else if(kind==='caves')a[i]=GRASS;   // (the hole in the ground closed over; a sewer's manhole covers stay)
    else if(b===AIR)a[i]=SIDEWALK;}
  return a;
}
// ---- the mesher's working buffers, kept between chunks (a chunk is rebuilt every time a block in it breaks, so it's worth not
// making thousands of little arrays each time). emitRamp and friends only push, so they take these or plain arrays alike. ----
class MBuf{
  constructor(T,n){this.T=T;this.a=new T(n);this.length=0;}
  room(n){if(this.length+n>this.a.length){const b=new this.T(Math.max(this.a.length*2,this.length+n));b.set(this.a.subarray(0,this.length));this.a=b;}return this.a;}
  push(){const n=arguments.length,A=this.room(n);let o=this.length;for(let i=0;i<n;i++)A[o++]=arguments[i];this.length=o;}
  take(){return this.a.slice(0,this.length);}
}
const mkBufs=()=>({p:new MBuf(Float32Array,1<<16),u:new MBuf(Float32Array,1<<15),c:new MBuf(Float32Array,1<<16),i:new MBuf(Uint32Array,1<<15),k:new MBuf(Float32Array,1<<14)});
const MB=[mkBufs(),mkBufs()];
// what's asked of every block many times over, as flat tables
const B_OPQ=new Uint8Array(BLOCK.length),B_SEE=new Uint8Array(BLOCK.length);
BLOCK.forEach((v,b)=>{B_OPQ[b]=b!==AIR&&!v.transparent?1:0;B_SEE[b]=v.transparent?1:0;});
// each face's corners worked out once: where the corner is, its texture spot, and the three blocks that shade it (as x,y,z
// offsets from the block, and as offsets into a chunk's array for blocks not on its edge)
const FACE_T=FACES.map(f=>{const [dx,dy,dz]=f.dir,axis=dx?0:dy?1:2,ua=(axis+1)%3,va=(axis+2)%3,lin=(x,y,z)=>x+z*CS+y*CS*CS;
  return {dx,dy,dz,dy1:dy===1,sel:dy===1?0:dy===-1?1:2,shade:f.shade*DIM,lin:lin(dx,dy,dz),cn:f.c.map(c=>{const du=[0,0,0],dv=[0,0,0];du[ua]=c[ua]?1:-1;dv[va]=c[va]?1:-1;
    const s1=[dx+du[0],dy+du[1],dz+du[2]],s2=[dx+dv[0],dy+dv[1],dz+dv[2]],cc=[dx+du[0]+dv[0],dy+du[1]+dv[1],dz+du[2]+dv[2]];
    return {x:c[0],y:c[1],z:c[2],u:c[3],v:c[4],s1,s2,cc,o1:lin(...s1),o2:lin(...s2),oc:lin(...cc)};})};});
function buildChunk(cx,cz){
  const gfx=GFX_OFF.caves||GFX_OFF.sewers||GFX_OFF.subway?new Map():null;
  const a0=gfx?gfxArr(cx,cz):chunkArr(cx,cz),x0=cx*CS,z0=cz*CS,A2=CS*CS,lf=leafFall>0;
  const gfxGet=(x,y,z)=>{const qx=Math.floor(x/CS),qz=Math.floor(z/CS),k=ckey(qx,qz);let v=gfx.get(k);if(!v){v=gfxArr(qx,qz);gfx.set(k,v);}return v[li(mod(x,CS),y,mod(z,CS))];};
  const a=lf?a0.map((b,i)=>{if(b!==LEAVES)return b;const y=Math.floor(i/A2),r=i-y*A2;return leafDown(x0+(r%CS),y,z0+Math.floor(r/CS))?AIR:b;}):a0;   // (leaves that have fallen)
  // (the eight chunks round about, fetched only if a block on the edge ends up asking)
  const NB=[null,null,null,null,null,null,null,null,null];
  const at=(lx,y,lz)=>{if(y<0)return STONE;if(y>=H)return AIR;
    if(lx>=0&&lx<CS&&lz>=0&&lz<CS)return a[lx+lz*CS+y*A2];
    if(gfx)return gfxGet(x0+lx,y,z0+lz);
    const ni=lx<0?0:lx<CS?1:2,nj=lz<0?0:lz<CS?1:2,o=nj*3+ni;let N=NB[o];if(!N)N=NB[o]=chunkArr(cx+ni-1,cz+nj-1);
    const b=N[lx-(ni-1)*CS+(lz-(nj-1)*CS)*CS+y*A2];return b===LEAVES&&lf&&leafDown(x0+lx,y,z0+lz)?AIR:b;};
  const opq=(lx,y,lz)=>B_OPQ[at(lx,y,lz)]===1;
  const bufs=MB;for(const d of bufs){d.p.length=d.u.length=d.c.length=d.i.length=d.k.length=0;}
  // the top of each column (the highest thing in it, even glass or leaves): only that block's top face is open to the sky
  const tops=new Int16Array(A2).fill(-1);for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++)for(let y=H-1;y>=0;y--){const b=a[lx+lz*CS+y*A2];if(b){tops[lz*CS+lx]=BLOCK[b].liquid?-1:y;break;}}
  let yTop=H-1;scan:for(;yTop>0;yTop--){const o=yTop*A2;for(let i=0;i<A2;i++)if(a[o+i])break scan;}
  // the lowest layer with anything open in it (here or along the neighbours' edges): everything below is buried solid
  let yLo=0;low:for(;yLo<yTop;yLo++){
    const o=yLo*A2;for(let i=0;i<A2;i++)if(!B_OPQ[a[o+i]])break low;
    for(let k=0;k<CS;k++)if(!opq(-1,yLo,k)||!opq(CS,yLo,k)||!opq(k,yLo,-1)||!opq(k,yLo,CS))break low;
  }
  yLo=Math.max(0,yLo-1);
  for(let y=yLo;y<=yTop;y++){
    const midY=y>=1&&y<H-1;
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const i0=lx+lz*CS+y*A2,b=a[i0];if(!b)continue;
    const info=BLOCK[b],liquid=!!info.liquid,glow=!!info.glow,out=bufs[liquid?1:0];
    if(info.ramp){emitRamp(out,x0+lx,y,z0+lz,info);continue;}
    if(info.hide)continue;
    if(info.thin){emitFence(out,x0+lx,y,z0+lz,b,info,at(lx-1,y,lz),at(lx+1,y,lz),at(lx,y,lz-1),at(lx,y,lz+1),at(lx,y+1,lz),tops[lz*CS+lx]===y);continue;}
    const skyTop=tops[lz*CS+lx]===y;
    const waterTop=liquid&&at(lx,y+1,lz)!==WATER;
    // (not on the chunk's edge, nor the world's top or bottom: every block asked about is right here in the array)
    const inner=midY&&lx>0&&lx<CS-1&&lz>0&&lz<CS-1,tiles=info.tiles;
    for(let fi=0;fi<6;fi++){
      const F=FACE_T[fi],nb=inner?a[i0+F.lin]:at(lx+F.dx,y+F.dy,lz+F.dz);
      if(nb!==AIR&&(liquid||!B_SEE[nb]||nb===b))continue;   // (the face is hidden)
      const tile=tiles[F.sel],tx=tile%AC,ty=Math.floor(tile/AC);
      const P=out.p.room(12),U=out.u.room(8),C=out.c.room(12),K=out.k.room(4),n=out.p.length/3;
      let po=out.p.length,uo=out.u.length,co=out.c.length,ko=out.k.length;
      const X=x0+lx,Z=z0+lz,sky=F.dy1&&skyTop?1+(snowBorn.get(X*65536+Z)||0):0,V0=1-(ty+1)/AR;
      for(let q=0;q<4;q++){
        const c=F.cn[q];
        P[po++]=X+c.x;P[po++]=waterTop&&c.y===1?y+0.88:y+c.y;P[po++]=Z+c.z;
        U[uo++]=(tx+0.002+c.u*0.996)/AC;U[uo++]=V0+(0.002+c.v*0.996)/AR;
        let s;
        if(glow)s=2;
        else{
          s=F.shade;
          if(!liquid){
            const s1=inner?B_OPQ[a[i0+c.o1]]:+opq(lx+c.s1[0],y+c.s1[1],lz+c.s1[2]),s2=inner?B_OPQ[a[i0+c.o2]]:+opq(lx+c.s2[0],y+c.s2[1],lz+c.s2[2]);
            const cc=inner?B_OPQ[a[i0+c.oc]]:+opq(lx+c.cc[0],y+c.cc[1],lz+c.cc[2]);
            s*=AO[s1&&s2?0:3-(s1+s2+cc)];
          }
        }
        C[co++]=s;C[co++]=s;C[co++]=s;K[ko++]=sky;
      }
      out.p.length=po;out.u.length=uo;out.c.length=co;out.k.length=ko;
      const I=out.i.room(6);let io=out.i.length;I[io++]=n;I[io++]=n+1;I[io++]=n+2;I[io++]=n+2;I[io++]=n+1;I[io++]=n+3;out.i.length=io;
    }
    }
  }
  const k=ckey(cx,cz),old=meshes.get(k);
  if(old)for(const m of old.m){scene.remove(m);m.geometry.dispose();}
  const m=[];
  bufs.forEach((d,i)=>{
    if(i&&!d.i.length)return;   // (no water in this chunk: no mesh for it to go round every frame)
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(d.p.take(),3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(d.u.take(),2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(d.c.take(),3));g.setAttribute('aSky',new THREE.Float32BufferAttribute(d.k.take(),1));
    const big=d.p.length/3>65535,ia=d.i.take();
    g.setIndex(new THREE.BufferAttribute(big?ia:Uint16Array.from(ia),1));
    const mesh=new THREE.Mesh(g,i?matWater:matOpaque);if(i)mesh.renderOrder=1;scene.add(mesh);m.push(mesh);
  });
  {const mk=routeMarks(cx,cz);if(mk)m.push(mk);}
  meshes.set(k,{cx,cz,m});markMeshed(cx,cz,true);
}
// ---- the paint on the highways out on the plains: thin flat strips laid on the road surface at the road's own angle,
// following its curves -- the yellow centre line and the dashed white lines between the lanes. Built with each chunk
// (each little piece of road by the chunk its middle is in), skipping any piece whose road has been smashed away. ----
function routeMarks(cx,cz){
  const x0=cx*CS,z0=cz*CS,L=routesNearBox(x0,z0,x0+CS-1,z0+CS-1);
  const P=[],U=[],C=[],K=[],I=[];
  const uvOf=t=>[((t%AC)+0.5)/AC,1-(Math.floor(t/AC)+1)/AR+0.5/AR];
  // (yb: the height at the b end, if it isn't level -- on a ramp)
  const quad=(ax,az,bx,bz,nx,nz,o,w,y,t,yb=y)=>{const n=P.length/3,[u,v]=uvOf(t),o0=o-w/2,o1=o+w/2;
    for(const [px,pz,py] of [[ax+nx*o0,az+nz*o0,y],[ax+nx*o1,az+nz*o1,y],[bx+nx*o0,bz+nz*o0,yb],[bx+nx*o1,bz+nz*o1,yb]]){P.push(px,py,pz);U.push(u,v);C.push(0.8,0.8,0.8);K.push(1);}
    I.push(n,n+1,n+2,n+1,n+3,n+2);};
  const byRoute=new Map();for(let q=0;q<L.length;q+=2){if(!byRoute.has(L[q]))byRoute.set(L[q],[]);byRoute.get(L[q]).push(L[q],L[q+1]);}
  for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1],[ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],mx=(ax+bx)/2,mz=(az+bz)/2;
    if(mx<x0||mx>=x0+CS||mz<z0||mz>=z0+CS)continue;
    const y=G;
    // (where two highways meet, the one that came first keeps its lines through the junction: they don't cross in a tangle)
    const yield2=(px,pz)=>{for(const [Q,LQ] of byRoute){if(Q.id>=R.id)continue;const n=nearestOn(LQ,px,pz,6.5);if(n&&!rtRamp(Q,n.s)&&!rtRamp(R,R.cum[i]))return true;}return false;};
    const l=Math.hypot(bx-ax,bz-az);if(l<1e-6)continue;const tx=(bx-ax)/l,tz=(bz-az)/l,nx=-tz,nz=tx,Y=y+1.02;
    // where along the road this piece is (the end stretches narrow back to town width: the lane lines stay put)
    const s0=R.cum[i];
    // a strip from a to b (distances along this piece), offset o across: laid in short bits, each only where there's
    // road right under it (so none of it hangs over a hole smashed in the road, or over anything else). Down a motorway's
    // ramp at the edge of town it follows the slope.
    const strip=(a,b,o,w,t)=>{for(let u=a;u<b-1e-6;){const v=Math.min(b,Math.floor(u+1e-6)+1),m=(u+v)/2,px=ax+tx*m+nx*o,pz=az+tz*m+nz*o,fx=Math.floor(px),fz=Math.floor(pz),r=rtRamp(R,s0+m);
      if(r){const gy=R.HY-Math.floor(Math.floor(r.e)/2),rb=BLOCK[get(fx,gy,fz)];if(rb&&rb.ramp&&get(fx,gy+1,fz)===AIR)quad(ax+tx*u,az+tz*u,ax+tx*v,az+tz*v,nx,nz,o,w,rtSurfY(R,s0+u)+0.03,t,rtSurfY(R,s0+v)+0.03);}
      else if(get(fx,y,fz)===ASPHALT&&get(fx,y+1,fz)===AIR&&!yield2(px,pz))quad(ax+tx*u,az+tz*u,ax+tx*v,az+tz*v,nx,nz,o,w,Y,t);u=v;}};
    // the same markings as the straight highways through town, in the same places, so they carry straight on where the
    // two meet: a double yellow line (two thin strips either side of the centre) and dashed white lane lines 3 out,
    // 3 blocks painted and 3 not -- in step with the town's dashes at either end (counted from whichever end is nearer)
    strip(0,l,-0.156,0.19,80);strip(0,l,0.156,0.19,80);
    const ia=R.A.ax==='x'?0:1,a0=R.pts[0][ia],b0=R.pts[R.pts.length-1][ia],half=R.L/2;
    const phase=s=>s<half?{p:mod(a0+R.A.s*s,6),k:R.A.s}:{p:mod(b0+R.B.s*(R.L-s),6),k:-R.B.s};
    for(const o of [-3,3]){let a=0;while(a<l-1e-6){const s=s0+a,{p,k}=phase(s),on=p<3;
      let len=k>0?(on?3-p:6-p):(on?p:p-3);if(len<1e-4)len=1e-3;len=Math.min(len,l-a);if(s<half&&s+len>half)len=half-s;
      if(on)strip(a,a+len,o,0.13,81);a+=len;}}
  }
  // where a street turns a corner, its double yellow line turns with it: the same two strips as the line tiles either side,
  // meeting in an elbow in the middle of the junction (the block lines stop at the edge of the square: see bendLine)
  if(mod(x0,CELL)===0&&mod(z0,CELL)===0){const ix=x0/CELL,iz=z0/CELL,dz=segOpen(ix,iz,0)?1:segOpen(ix,iz,2)?-1:0,dx=segOpen(ix,iz,1)?1:segOpen(ix,iz,3)?-1:0;
    if(dx&&dz&&jDeg(ix,iz)===2&&!ghwRow(iz,ix)&&!ghwCol(ix,iz)){const cx=x0+RC,cz=z0+RC,OF=0.156,W=0.19;
      const run=(ux,uz,a,b,o)=>{for(let u=a;u<b-1e-6;){const v=Math.min(b,Math.floor(u+1)),m=(u+v)/2,px=cx+ux*m+(uz?o:0),pz=cz+uz*m+(ux?o:0),fx=Math.floor(px),fz=Math.floor(pz);
        if(get(fx,G,fz)===ASPHALT&&get(fx,G+1,fz)===AIR)quad(cx+ux*u+(uz?o:0),cz+uz*u+(ux?o:0),cx+ux*v+(uz?o:0),cz+uz*v+(ux?o:0),-uz,ux,0,W,G+1.02,80);u=v;}};
      // (each arm's inner strip stops where it meets the other arm's, its outer strip runs on to the outside of the corner)
      run(dx,0,OF-W/2,RC,dz*OF);run(dx,0,-OF-W/2,RC,-dz*OF);
      run(0,dz,OF-W/2,RC,dx*OF);run(0,dz,-OF-W/2,RC,-dx*OF);}}
  // the railway: two steel rails on sleepers, laid on the ballast at the line's own angle
  const LR=routesNearBox(x0-20,z0-20,x0+CS+20,z0+CS+20);
  for(let q=0;q<LR.length;q+=2){const R=LR[q],RL=railOf(R);if(!RL)continue;const i=LR[q+1],[ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],l=Math.hypot(bx-ax,bz-az);if(l<1e-6)continue;
    const tx=(bx-ax)/l,tz=(bz-az)/l,nx=-tz,nz=tx,o=RL.off;
    for(let a=0;a<l;a+=1){const m=a+0.5,s=R.cum[i]+m;if(Math.min(s,R.L-s)<25)continue;const px=ax+tx*m+nx*o,pz=az+tz*m+nz*o;if(px<x0||px>=x0+CS||pz<z0||pz>=z0+CS)continue;
      const gb=get(Math.floor(px),G,Math.floor(pz));if((gb!==GRAVEL&&gb!==PLANKS)||get(Math.floor(px),G+1,Math.floor(pz))!==AIR)continue;
      const cx=ax+tx*m,cz=az+tz*m;quad(cx+nx*(o-1.15),cz+nz*(o-1.15),cx+nx*(o+1.15),cz+nz*(o+1.15),-tx,-tz,0,0.36,G+1.04,8);   // a sleeper
      for(const k of [-0.72,0.72])quad(ax+tx*a,az+tz*a,ax+tx*(a+1),az+tz*(a+1),nx,nz,o+k,0.13,G+1.16,18);}}   // the rails
  // the truck stops' lorry bays: long white lines out from the road behind the canopy, square to the road
  {const k=Math.floor(x0/16)*100003+Math.floor(z0/16);if(!tsC.has(k))tsAt(x0,z0);
    for(const T of tsC.get(k)||[]){
      for(let u=-42;u<=42;u+=7){if(Math.abs(u)<=14)continue;const ax=T.cx+T.tx*u+T.nx*31,az=T.cz+T.tz*u+T.nz*31;
        for(let v=0;v<12;v++){const px=ax+T.nx*(v+0.5),pz=az+T.nz*(v+0.5);if(px<x0||px>=x0+CS||pz<z0||pz>=z0+CS)continue;
          if(get(Math.floor(px),G,Math.floor(pz))!==ASPHALT||get(Math.floor(px),G+1,Math.floor(pz))!==AIR)continue;
          quad(ax+T.nx*v,az+T.nz*v,ax+T.nx*(v+1),az+T.nz*(v+1),-T.nz,T.nx,0,0.18,G+1.02,81);}}}}
  // the railways: sleepers across, two steel rails along, down the middle of each line (where there's still ground
  // under them); round the bends in short straight pieces
  {const Ls=new Set();for(const [qx,qz] of [[x0,z0],[x0+CS-1,z0+CS-1]])for(const L of railLinksNear(Math.floor(qx/CELL),Math.floor(qz/CELL)))Ls.add(L);
   const inC=(x,z)=>x>=x0&&x<x0+CS&&z>=z0&&z<z0+CS,ok=(x,z)=>{const gx=Math.floor(x),gz=Math.floor(z),b=get(gx,G,gz);return b&&b!==WATER&&get(gx,G+1,gz)===AIR;};
   for(const L of Ls){const p=L.pts;
     for(let i=0;i<p.length-1;i++){const [ax,az]=p[i],[bx,bz]=p[i+1];const mx=(ax+bx)/2,mz=(az+bz)/2;if(!inC(Math.floor(mx),Math.floor(mz))||!ok(mx,mz))continue;
       // (a stretch shared with the next line along, through a station: drawn by only one of them)
       if(L.A&&i<RAIL_EXT&&railCarriesOn(L,'A'))continue;
       const l=Math.hypot(bx-ax,bz-az)||1,tx=(bx-ax)/l,tz=(bz-az)/l;
       quad(mx-tz*1.15,mz+tx*1.15,mx+tz*1.15,mz-tx*1.15,-tx,-tz,0,0.36,G+1.07,8);
       for(const k of [-0.72,0.72])quad(ax,az,bx,bz,-tz,tx,k,0.13,G+1.2,18);}}}
  if(!I.length)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('aSky',new THREE.Float32BufferAttribute(K,1));g.setIndex(I);
  const mesh=new THREE.Mesh(g,matDecal);scene.add(mesh);return mesh;
}
function clearWorld(){rebuildQ.clear();for(const e of meshes.values())for(const m of e.m){scene.remove(m);m.geometry.dispose();}meshes.clear();MESHED.fill(0);meshedDirty=true;farDirty=true;chunks.clear();gfxRecC.clear();plotCache.clear();plotTypeC.clear();lampSpotC.clear();bridgeCache.clear();superCache.clear();setCache.clear();setAtCache.clear();jDegC.clear();linkNearC.clear();ctlCache.clear();zoneCache.clear();farmC.clear();cloverCache.clear();clearLayout();joinCache.clear();icCache.clear();ctlCache.clear();lastK=-1;}
let unloadT=0,chunkScan={key:'',size:-1,full:false};
// where to look for a chunk to make next, nearest first: worked out once for a view distance, not every frame
let chunkOrd=null,chunkOrdR=-1;
function chunkOrder(R){
  if(chunkOrdR===R)return chunkOrd;
  const L=[];for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const d=dx*dx+dz*dz;if(d<=(R+0.6)*(R+0.6))L.push([dx,dz,d]);}
  L.sort((a,b)=>a[2]-b[2]);chunkOrd=L;chunkOrdR=R;return L;
}
function updateChunks(budget,dt){
  const R=viewR;
  const centers=players.filter(p=>p.active).map(p=>[Math.floor(p.pos.x/CS),Math.floor(p.pos.z/CS)]);
  if(DT.freecam)centers.push([Math.floor(FC.pos.x/CS),Math.floor(FC.pos.z/CS)]);
  const cheb=(cx,cz)=>{let m=1e9;for(const [a,b] of centers)m=Math.min(m,Math.max(Math.abs(cx-a),Math.abs(cz-b)));return m;};
  // (standing in the same chunk with everything in sight already made, there's nothing to go through)
  const key=R+'|'+centers.join('|'),same=key===chunkScan.key;
  if(!same)for(const [k,e] of meshes){if(cheb(e.cx,e.cz)>R+1){for(const m of e.m){scene.remove(m);m.geometry.dispose();}meshes.delete(k);markMeshed(e.cx,e.cz,false);}}
  unloadT-=dt;
  if(unloadT<=0){unloadT=2;for(const k of chunks.keys()){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cheb(cx,cz)>R+4)chunks.delete(k);}lastK=-1;if(plotCache.size>30000){plotCache.clear();plotTypeC.clear();lampSpotC.clear();bridgeCache.clear();superCache.clear();joinCache.clear();icCache.clear();ctlCache.clear();}}
  if(same&&chunkScan.full&&chunkScan.size===meshes.size)return;
  let made=0,gens=0;
  scan:for(const [dx,dz] of chunkOrder(R))for(const [pcx,pcz] of centers){
    if(meshes.has(ckey(pcx+dx,pcz+dz)))continue;
    if(made>=budget)break scan;
    // (a mesh needs its neighbours' blocks too, which may mean making all eight first: no more than three a frame, then carry on next time)
    const X=pcx+dx,Z=pcz+dz;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(!chunks.has(ckey(X+a,Z+b))){chunkArr(X+a,Z+b);if(++gens>=3){chunkScan.key=key;chunkScan.full=false;return;}}
    buildChunk(X,Z);made++;
  }
  chunkScan.key=key;chunkScan.full=!made;chunkScan.size=meshes.size;
}
// ---- chunks whose blocks have changed wait here and are rebuilt at the end of the frame, in the order they asked, a few
// milliseconds' worth at a time. Something smashing its way through a street asks for the same few chunks every frame; this
// way each gets rebuilt in its turn rather than all of them every time. (The blocks themselves have already changed: it's
// only the picture that may be a frame or two behind while a building comes down.) ----
const rebuildQ=new Set();
function rebuildSet(set){for(const k of set)if(meshes.has(k))rebuildQ.add(k);}
function flushRebuilds(){
  if(!rebuildQ.size)return;
  const t0=performance.now(),ms=Math.min(9,3+rebuildQ.size*0.5);let n=0;   // (more waiting: a bit more time, so it can't fall far behind)
  for(const k of rebuildQ){rebuildQ.delete(k);const e=meshes.get(k);if(!e)continue;buildChunk(e.cx,e.cz);n++;if(n>=2&&performance.now()-t0>ms)break;}
}

