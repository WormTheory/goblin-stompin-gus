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
// With Block lighting on (BLOCK_LIGHT, render/block-light.js), each corner also carries the light from lamps and neon round
// it (aBlk), which lifts the dark toward full brightness: by day there's no dark to lift, so the day looks as it always did.
function nightPatch(mat){
  blkDefines(mat);
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uLight=WORLD_LIGHT;sh.uniforms.uSeasonW=SEASON_W;sh.uniforms.uFogGlow=FOG_GLOW;sh.uniforms.uCarP=CARL_U.uCarP;sh.uniforms.uCarD=CARL_U.uCarD;sh.uniforms.uMovP=MOVL_U.uMovP;sh.uniforms.uMovC=MOVL_U.uMovC;
    sh.vertexShader='#ifdef BLOCK_LIGHT\nattribute vec3 aBlk;varying vec3 vBlk;\n#endif\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef BLOCK_LIGHT\n vBlk=aBlk;\n#endif');
    sh.fragmentShader='uniform vec3 uLight;uniform vec4 uSeasonW;uniform float uFogGlow;\n#ifdef BLOCK_LIGHT\nvarying vec3 vBlk;uniform vec4 uCarP['+CAR_LN+'];uniform vec3 uCarD['+CAR_LN+'];uniform vec4 uMovP['+MOV_LN+'];uniform vec3 uMovC['+MOV_LN+'];\n#endif\n'+sh.fragmentShader.replace('#include <color_fragment>',FOLIAGE_FRAG+LIT_FRAG+'#ifdef USE_COLOR\n  float glowV=step(1.5,vColor.r);\n  diffuseColor.rgb*=mix(vColor*litC,vec3(1.0),glowV);\n#endif'+SNOW_FRAG).replace('#include <fog_fragment>',FOG_LIT_FRAG);
    weatherPatch(sh);
  };
  return mat;
}
// (a torch-like fall-off: bright close to, dropping away quickly; the moonlight's what's left when it's gone)
// (and the nearest moving cars' headlights, CARL_U: a cone ahead of each, fading out over 22 blocks; w is how dark it is, 0 for none)
// (and the nearest moving glowing things, MOVL_U -- a fireball, a blast's flash: a pool of their colour round each, out to w)
// (only on faces turned toward the lamp, from the face's slope on screen, and not far below it, so a car on an overpass doesn't
// light the deck's underside or the road under it)
const LIT_FRAG='\n#ifdef BLOCK_LIGHT\n  vec3 litC=uLight+pow(vBlk,vec3(1.5))*max(vec3(1.0)-uLight,vec3(0.0));\n#if __VERSION__ >= 300\n  vec3 nH=normalize(cross(dFdx(vWp),dFdy(vWp)));\n#endif\n  for(int i=0;i<'+CAR_LN+';i++){vec4 cp=uCarP[i];if(cp.w<=0.0)break;vec3 dv=vWp-cp.xyz;float dl=length(dv)+0.001;\n   float hl=smoothstep(0.72,0.93,dot(dv/dl,uCarD[i]))*(1.0-smoothstep(1.0,22.0,dl))*(1.0-smoothstep(1.5,2.5,-dv.y-dl*0.2));\n#if __VERSION__ >= 300\n   hl*=clamp(-dot(nH,dv/dl)*12.0,0.0,1.0);\n#endif\nlitC+=vec3(1.0,0.92,0.75)*hl*hl*cp.w*1.4*max(vec3(1.0)-uLight,vec3(0.0));}\n  for(int i=0;i<'+MOV_LN+';i++){vec4 mp=uMovP[i];if(mp.w<=0.0)break;vec3 dv=vWp-mp.xyz;float dl=length(dv)+0.001;float ml=1.0-smoothstep(0.0,mp.w,dl);ml*=ml;\n#if __VERSION__ >= 300\n   ml*=clamp(0.25-dot(nH,dv/dl)*3.0,0.0,1.0);\n#endif\n   litC+=uMovC[i]*ml*1.6*max(vec3(1.0)-uLight,vec3(0.0));}\n#else\n  vec3 litC=uLight;\n#endif\n';
// lights in the weather's fog: at night, glowing faces (windows, neon, lamps) and what block light lights up fade into the
// fog over a longer way than everything else, and the fog in front of them takes on a little of their colour, so a lit
// street shows through the murk as a soft glow some way past where the buildings are lost. FOG_GLOW is how thick the
// weather's fog is (0 to 1) times the debug menu's Fog light strength (DT.fogLit, 1 to begin with), set per view by
// renderView (0 under water and in clear weather, so the plain distance fog at the view's edge is untouched); the shader
// weighs it by how dark it is, so by day nothing changes. (three r128's fog_fragment,
// with fogDepth, written out again: a few sums a pixel, nothing per frame but the one uniform.)
const FOG_GLOW={value:0};
const FOG_LIT_FRAG=`
#ifdef USE_FOG
  float fogFactor=smoothstep(fogNear,fogFar,fogDepth);
  float fogLt=0.0;
  if(uFogGlow>0.0){
#ifdef USE_COLOR
    fogLt=glowV;
#endif
#ifdef BLOCK_LIGHT
    vec3 fogB=pow(vBlk,vec3(1.5));fogLt=max(fogLt,min(1.0,max(max(fogB.r,fogB.g),fogB.b)*1.4)*0.8);
#endif
    fogLt*=min(3.0,uFogGlow)*clamp((0.75-max(max(uLight.r,uLight.g),uLight.b))*2.5,0.0,1.0);
  }
  if(fogLt>0.0){
    vec3 fogSrc=gl_FragColor.rgb;
    float fogL=smoothstep(fogNear,fogFar*(1.0+1.4*fogLt),fogDepth);
    float fogHz=min(1.5,fogLt)*fogFactor*(1.0-smoothstep(fogFar*0.8,fogFar*(1.0+2.2*fogLt),fogDepth));
    gl_FragColor.rgb=mix(fogSrc,fogColor,fogL)+fogSrc*fogHz*0.55;
  }else gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor);
#endif
`;
// weather on the ground: a vertex flag (aSky) marks top faces with nothing above them; on those, snow settles in
// patches as the snow cover grows, and rain darkens them. Anything under a roof, a deck, an awning or a tree stays clear.
const SNOW_U={value:0},WET_U={value:0},SNOWCLK_U={value:0};
// snow and wet by place: the snow lying in each band of climate (uSnowB: polar, cold, temperate, warm; the temperate
// one is uSnow, as before), and a map of how cold and how wet each 16-block cell is (COLD, wrapped every 4096 blocks
// and kept round the players by coldTick, weather.js): red the temperature, lower on the mountains; green how wet the
// ground gets in the rain (none in the desert); blue the snow that never goes (the tundra's and the ice fields'). An unfilled cell is temperate and ordinary, so it's as it always was.
const SNOWB_U={value:new THREE.Vector4(0,0,0,0)},COLD_N=256,COLD_S=16,COLD=new Uint8Array(COLD_N*COLD_N*4);
for(let i=0;i<COLD.length;i+=4){COLD[i]=128;COLD[i+1]=128;COLD[i+3]=255;}
const COLD_TEX=new THREE.DataTexture(COLD,COLD_N,COLD_N,THREE.RGBAFormat);COLD_TEX.wrapS=COLD_TEX.wrapT=THREE.RepeatWrapping;COLD_TEX.magFilter=COLD_TEX.minFilter=THREE.LinearFilter;COLD_TEX.needsUpdate=true;
const COLDT_U={value:COLD_TEX};
// (the bands' snow at a cell's temperature, blended between them: polar to 0.1, cold at 0.28, temperate from 0.38 to 0.5, warm from 0.62)
const SNOW_GLSL='uniform vec4 uSnowB;uniform sampler2D uColdT;\nfloat snowHere(vec3 p,out float wk){vec4 c=texture2D(uColdT,p.xz*'+(1/(COLD_N*COLD_S))+');wk=c.g*2.0;float t=c.r;\n return max(c.b,t<0.28?mix(uSnowB.x,uSnowB.y,clamp((t-0.1)/0.18,0.0,1.0)):t<0.5?mix(uSnowB.y,uSnowB.z,clamp((t-0.28)/0.1,0.0,1.0)):mix(uSnowB.z,uSnowB.w,clamp((t-0.5)/0.12,0.0,1.0)));}\n';
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
const RD_OPEN=14;let snowRoads=true;   // (off: roads snow over like any other ground, as they used to; for the tests and for comparing)
function weatherPatch(sh){
  sh.uniforms.uSnow=SNOW_U;sh.uniforms.uWet=WET_U;sh.uniforms.uSnowClk=SNOWCLK_U;sh.uniforms.uSnowB=SNOWB_U;sh.uniforms.uColdT=COLDT_U;
  sh.vertexShader='attribute float aSky;varying float vSky;varying float vBorn;varying float vRd;varying vec3 vWp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vSky=step(0.5,abs(aSky));vBorn=max(aSky-1.0,0.0);vRd=max(-aSky,0.0);vWp=(modelMatrix*vec4(position,1.0)).xyz;');
  sh.fragmentShader='uniform float uSnow,uWet,uSnowClk;varying float vSky;varying float vBorn;varying float vRd;varying vec3 vWp;\n'+SNOW_GLSL+sh.fragmentShader;
}
// (a road, vRd = 1 + how far across its lane, see roadLanes: the traffic's wheels keep two ruts all but bare, the strip
// between them thin and grey, and the snow lies as deep as anywhere only along the kerbs and down the middle. In the
// heaviest snow the ruts pack down grey instead. Tarmac with no lanes, from RD_OPEN: a little less snow all over)
const SNOW_FRAG='\n  if(vSky>0.5){float wkS;float snS=snowHere(vWp,wkS);diffuseColor.rgb*=1.0-0.3*uWet*wkS*(1.0-snS);\n  if(snS>0.0){\n  float snowN=fract(sin(dot(mod(floor(vWp.xz*4.0+0.001),509.0),vec2(12.9898,78.233)))*43758.5453);float snowL=min(snS,uSnowClk-vBorn);\n  float snowG=fract(sin(dot(mod(floor(vWp.xz*16.0+0.001),997.0),vec2(39.346,11.135)))*43758.5453);float snowV=0.84+0.11*snowG+0.03*step(0.93,snowG);\n  vec3 snowK=vec3(snowV,snowV+0.012,snowV+0.03);\n  if(vRd>0.5){float rdT=vRd-1.0,rdL=step(rdT,'+(RD_OPEN-3).toFixed(1)+'),rdP=abs(mod(rdT+(snowN-0.5)*0.3,4.0)-2.0);\n   float rdLane=mix(0.6,1.0-smoothstep(1.3,1.65,rdP),rdL),rdRut=rdL*(1.0-smoothstep(0.3,0.6,abs(rdP-0.8)));\n   diffuseColor.rgb*=1.0-0.12*rdLane*smoothstep(0.03,0.25,snowL);\n   snowL*=1.0-rdLane*(0.42+rdRut*mix(0.48,0.1,smoothstep(0.7,1.0,snS)));\n   snowK=mix(snowK,vec3(0.66,0.64,0.61)*(0.9+0.2*snowG),rdLane*(0.3+0.5*rdRut));}\n  float snowC=step(snowN,snowL*1.12)*step(0.002,snowL);\n  diffuseColor.rgb=mix(diffuseColor.rgb,snowK*litC,snowC);}}';   // (only top faces open to the sky, only when there's snow: no sums for every other pixel on screen)
const matOpaque=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.5}));
// (the paint and the rails laid on the ground: pulled toward the camera a touch so they never flicker with it)
const matDecal=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
const matWater=nightPatch(new THREE.MeshBasicMaterial({map:tex,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
BL_MATS.push(matOpaque,matDecal,matWater);
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
      const s=f.shade*DIM;out.c.push(s,s,s);out.k.push(dy===1&&sky?1:0);if(out.b&&BL_ON)out.b.push(BL_r,BL_g,BL_b);}
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
    for(const v of [A,B,C,D]){out.p.push(X+v[0],Y+v[1],Z+v[2]);const [u,w]=uvOf(v);out.u.push((tx+0.002+u*0.996)/AC,1-(ty+1)/AR+(0.002+w*0.996)/AR);out.c.push(s,s,s);if(out.k)out.k.push(n[1]>0.5?(info.stair||!snowRoads?1:-1-RD_OPEN):0);if(out.b&&BL_ON)out.b.push(BL_r,BL_g,BL_b);}
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
const mkBufs=()=>({p:new MBuf(Float32Array,1<<16),u:new MBuf(Float32Array,1<<15),c:new MBuf(Float32Array,1<<16),i:new MBuf(Uint32Array,1<<15),k:new MBuf(Float32Array,1<<14),b:new MBuf(Uint8Array,1<<16)});
const MB=[mkBufs(),mkBufs()];
// what's asked of every block many times over, as flat tables
const B_OPQ=new Uint8Array(BLOCK.length),B_SEE=new Uint8Array(BLOCK.length);
BLOCK.forEach((v,b)=>{B_OPQ[b]=b!==AIR&&!v.transparent?1:0;B_SEE[b]=v.transparent?1:0;});
// each face's corners worked out once: where the corner is, its texture spot, and the three blocks that shade it (as x,y,z
// offsets from the block, and as offsets into a chunk's array for blocks not on its edge)
// (and the same as offsets into block light's window, render/block-light.js)
const FACE_T=FACES.map(f=>{const [dx,dy,dz]=f.dir,axis=dx?0:dy?1:2,ua=(axis+1)%3,va=(axis+2)%3,lin=(x,y,z)=>x+z*CS+y*CS*CS,wl=(x,y,z)=>x+z*BLW+y*BLA;
  return {dx,dy,dz,dy1:dy===1,sel:dy===1?0:dy===-1?1:2,shade:f.shade*DIM,lin:lin(dx,dy,dz),wf:wl(dx,dy,dz),cn:f.c.map(c=>{const du=[0,0,0],dv=[0,0,0];du[ua]=c[ua]?1:-1;dv[va]=c[va]?1:-1;
    const s1=[dx+du[0],dy+du[1],dz+du[2]],s2=[dx+dv[0],dy+dv[1],dz+dv[2]],cc=[dx+du[0]+dv[0],dy+du[1]+dv[1],dz+du[2]+dv[2]];
    return {x:c[0],y:c[1],z:c[2],u:c[3],v:c[4],s1,s2,cc,o1:lin(...s1),o2:lin(...s2),oc:lin(...cc),w1:wl(...s1),w2:wl(...s2),wc:wl(...cc)};})};});
// Roads in the snow. Traffic keeps a road from snowing over, so a road's top faces say where across the road each corner
// is (aSky below zero: -(1 + t), t counted in lanes of 4 with the wheels' ruts at 1.2 and 2.8, or RD_OPEN on tarmac with no
// lanes to it: a car park, a runway, a ramp), and SNOW_FRAG keeps the ruts clear. Nothing in the blocks says which way a
// road runs or how wide it is, so roadLanes works both out from the blocks round about, whatever way the road goes: D is
// each road column's distance to the nearest column that isn't road (over the chunk and RD_M columns round it, at the
// same level or a step up or down, so a ramp carries on), and H the most D gets to on the way up from a column to the
// road's middle, which is half the road's width. Half of 3 to 4 is a lane each way of that width, about 6 two lanes each
// way of 3 counted out from the middle (a motorway's deck), under 3 one lane down the middle, and over 6.6 open tarmac;
// between 4.3 and 5.8 is where streets meet, churned right across. Each corner takes the nearest-to-the-edge of the four
// columns round it. Only chunks with road in them pay for it, for the three levels they come to first.
const RD_M=12,RD_W=CS+2*RD_M,RD_TOP=new Uint8Array(BLOCK.length);
for(const b of [ASPHALT,LINE,LINEX,LINE_R,LINEX_R,LANE,LANEX,CROSS,CROSSX])RD_TOP[b]=1;
BLOCK.forEach((v,b)=>{if(v.ramp&&!v.stair)RD_TOP[b]=2;});
const RD_D=new Float32Array(RD_W*RD_W),RD_H=new Float32Array(RD_W*RD_W),RD_B=Array.from({length:33},()=>[]),RD_OUT=[0,1,2].map(()=>new Float32Array((CS+1)*(CS+1))),RD_Y=[];
function roadLanes(a,tops,at,x0,z0){
  const ys=RD_Y;ys.length=0;
  for(let i=0;i<CS*CS;i++){const y=tops[i];if(y<0||RD_TOP[a[i+y*CS*CS]]!==1||ys.indexOf(y)>=0)continue;if(ys.length<3)ys.push(y);}
  const W=RD_W,M=RD_M,D=RD_D,Hh=RD_H,C1=CS+1;
  for(let n=0;n<ys.length;n++){const y=ys[n],O=RD_OUT[n];
    for(let j=0;j<W;j++)for(let i=0;i<W;i++){const lx=i-M,lz=j-M,b0=at(lx,y,lz),b1=at(lx,y+1,lz);
      D[j*W+i]=RD_TOP[b1]||(RD_TOP[b0]?!B_OPQ[b1]:b0===AIR&&RD_TOP[at(lx,y-1,lz)])?99:0;}
    // (one odd block with road either side of it is a manhole's lid, not the road's edge)
    for(let j=1;j<W-1;j++)for(let i=1;i<W-1;i++){const k=j*W+i;if(!D[k]&&D[k-1]===99&&D[k+1]===99&&D[k-W]&&D[k+W])D[k]=99;}
    for(let j=0;j<W;j++)for(let i=0;i<W;i++){const k=j*W+i;let d=D[k];if(!d)continue;
      if(i&&D[k-1]+1<d)d=D[k-1]+1;if(j){if(D[k-W]+1<d)d=D[k-W]+1;if(i&&D[k-W-1]+1.414<d)d=D[k-W-1]+1.414;if(i<W-1&&D[k-W+1]+1.414<d)d=D[k-W+1]+1.414;}D[k]=d;}
    for(const B of RD_B)B.length=0;
    for(let j=W-1;j>=0;j--)for(let i=W-1;i>=0;i--){const k=j*W+i;let d=D[k];if(!d){Hh[k]=0;continue;}
      if(i<W-1&&D[k+1]+1<d)d=D[k+1]+1;if(j<W-1){if(D[k+W]+1<d)d=D[k+W]+1;if(i<W-1&&D[k+W+1]+1.414<d)d=D[k+W+1]+1.414;if(i&&D[k+W-1]+1.414<d)d=D[k+W-1]+1.414;}
      if(d>8)d=8;D[k]=Hh[k]=d;RD_B[Math.round(d*4)].push(k);}
    for(let q=32;q>0;q--)for(const k of RD_B[q]){const i=k%W,j=(k-i)/W,d=D[k]+0.01;let h=Hh[k];
      for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=W||jj>=W)continue;const o=jj*W+ii;if(D[o]>d&&Hh[o]>h)h=Hh[o];}
      Hh[k]=h;}
    for(let cz=0;cz<=CS;cz++)for(let cx=0;cx<=CS;cx++){let d=99,h=0;
      for(let dj=-1;dj<=0;dj++)for(let di=-1;di<=0;di++){const o=(cz+dj+M)*W+cx+di+M;if(D[o]<d)d=D[o];if(Hh[o]>h)h=Hh[o];}
      O[cz*C1+cx]=h>6.6?RD_OPEN:h>=5.8?Math.min(8,(h-d)*4/3):h>4.3?Math.min(d,2.4):h>=3?d*4/Math.min(h,4):Math.max(0,d+2-h);}
    // (a highway across the plains runs at any angle, where distances counted in blocks come out ragged, and has a hard
    // shoulder besides: there the plan itself says how far each corner is from the road's middle. Not on a motorway's ramp)
    if(y===G){const L=routesNearBox(x0,z0,x0+CS-1,z0+CS-1);
      if(L.length)for(let cz=0;cz<=CS;cz++)for(let cx=0;cx<=CS;cx++){const n=nearestOn(L,x0+cx,z0+cz,9.6);
        if(n&&!(n.i===0&&n.t<=0||n.i===n.R.pts.length-2&&n.t>=1)&&!(n.R.kind==='moto'&&rtRamp(n.R,n.s)))O[cz*C1+cx]=Math.min(8,n.d*4/3);}}
  }
}
// the kinds of ground that blend into each other at their edges (buildChunk's gMix)
const G_MIX=new Uint8Array(256),GMC=[1,1,1],GM_M=26;const GM_Q=new Array(49).fill(null);   // (the chunks round about, while one's blended)
let GM_S=new Float32Array(0),GM_T=new Float32Array(0);const GM_OWN=new Float32Array(CS*CS*4);for(const b of [GRASS,DIRT,SAND,RED_SAND,SNOW,MUD,GRAVEL,TERRA,TERRA2,SALT,STONE,SANDSTONE])G_MIX[b]=1;
// a chunk's columns' top ground colours for the blend ([r,g,b,1] a column, or 0,0,0,0 where the top isn't ground), kept
// with the chunk's block array (made again when the chunk is; a dug-out column keeps its old colour till then, which only
// tints its neighbours a little)
const GM_CC=new WeakMap();
function gmCols(qx,qz){
  const N=chunkArr(qx,qz);let C=GM_CC.get(N);if(C)return C;C=new Float32Array(CS*CS*4);const A2=CS*CS;
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const c0=lx+lz*CS;let bb=0;
    for(let y=H-1;y>=0;y--){const v=N[c0+y*A2];if(v){if(!BLOCK[v].liquid)bb=v;break;}}
    if(!G_MIX[bb])continue;const t=BLOCK[bb].tiles[0]*3,o=c0*4;let r=TILE_AVG[t],g=TILE_AVG[t+1],bl=TILE_AVG[t+2];
    if(bb===GRASS){const T=bioTint(qx*CS+lx,qz*CS+lz,0);r*=T[0];g*=T[1];bl*=T[2];}C[o]=r;C[o+1]=g;C[o+2]=bl;C[o+3]=1;}
  gmSig(C);GM_CC.set(N,C);return C;}
// (whether a chunk's columns are all one ground colour, kept on its array as u: 0 no ground at all, 1 one colour, in
// ur/ug/ub, 2 more than one. Where the chunk being meshed and every chunk the blend reaches are one and the same colour,
// blending changes nothing, and buildChunk leaves it out)
function gmSig(C){let u=0,r=0,g=0,b=0;
  for(let o=0;o<C.length;o+=4){if(!C[o+3])continue;if(!u){u=1;r=C[o];g=C[o+1];b=C[o+2];}else if(C[o]!==r||C[o+1]!==g||C[o+2]!==b){u=2;break;}}
  C.u=u;C.ur=r;C.ug=g;C.ub=b;return C;}
function buildChunk(cx,cz){
  const gfx=GFX_OFF.caves||GFX_OFF.sewers||GFX_OFF.subway?new Map():null;
  const a0=gfx?gfxArr(cx,cz):chunkArr(cx,cz),x0=cx*CS,z0=cz*CS,A2=CS*CS,lf=leafFall>0;
  const gfxGet=(x,y,z)=>{const qx=Math.floor(x/CS),qz=Math.floor(z/CS),k=ckey(qx,qz);let v=gfx.get(k);if(!v){v=gfxArr(qx,qz);gfx.set(k,v);}return v[li(mod(x,CS),y,mod(z,CS))];};
  const a=lf?a0.map((b,i)=>{if(b!==LEAVES)return b;const y=Math.floor(i/A2),r=i-y*A2;return leafDown(x0+(r%CS),y,z0+Math.floor(r/CS))?AIR:b;}):a0;   // (leaves that have fallen)
  // (a ship's chunk is laid out from the ship's own middle, not where its pocket is: numbers that big lose their fractions on
  // the graphics card, and the deck shakes as it moves. See ships.js)
  const pkS=cx>=SHIP_CX0?shipPg(cz):null,mx0=pkS?x0-pkS.ox:x0,mz0=pkS?z0-pkS.oz:z0;
  // (the eight chunks round about, fetched only if a block on the edge ends up asking)
  const NB=[null,null,null,null,null,null,null,null,null];
  const at=(lx,y,lz)=>{if(y<0)return STONE;if(y>=H)return AIR;
    if(lx>=0&&lx<CS&&lz>=0&&lz<CS)return a[lx+lz*CS+y*A2];
    if(gfx)return gfxGet(x0+lx,y,z0+lz);
    const ni=lx<0?0:lx<CS?1:2,nj=lz<0?0:lz<CS?1:2,o=nj*3+ni;let N=NB[o];if(!N)N=NB[o]=chunkArr(cx+ni-1,cz+nj-1);
    const b=N[lx-(ni-1)*CS+(lz-(nj-1)*CS)*CS+y*A2];return b===LEAVES&&lf&&leafDown(x0+lx,y,z0+lz)?AIR:b;};
  const opq=(lx,y,lz)=>B_OPQ[at(lx,y,lz)]===1;
  const bufs=MB;for(const d of bufs){d.p.length=d.u.length=d.c.length=d.i.length=d.k.length=d.b.length=0;}
  // the top of each column (the highest thing in it, even glass or leaves): only that block's top face is open to the sky
  const tops=new Int16Array(A2).fill(-1);for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++)for(let y=H-1;y>=0;y--){const b=a[lx+lz*CS+y*A2];if(b){tops[lz*CS+lx]=BLOCK[b].liquid?-1:y;break;}}
  let yTop=H-1;scan:for(;yTop>0;yTop--){const o=yTop*A2;for(let i=0;i<A2;i++)if(a[o+i])break scan;}
  // (roads' tops say where across the road they are, so the snow leaves the traffic's ruts: roadLanes)
  if(snowRoads)roadLanes(a,tops,at,x0,z0);
  // the lowest layer with anything open in it (here or along the neighbours' edges): everything below is buried solid
  let yLo=0;low:for(;yLo<yTop;yLo++){
    const o=yLo*A2;for(let i=0;i<A2;i++)if(!B_OPQ[a[o+i]])break low;
    for(let k=0;k<CS;k++)if(!opq(-1,yLo,k)||!opq(CS,yLo,k)||!opq(k,yLo,-1)||!opq(k,yLo,CS))break low;
  }
  yLo=Math.max(0,yLo-1);
  // the light from lamps and neon round about (none, and nothing to do, with Block lighting off or nothing lit in reach)
  const BL=BL_ON,lit=BL&&blkFill(cx,cz,yLo,yTop);
  // (a column of a building whose lights are out, lights-out.js: asked once a column, only where something glows)
  // (the biome's tint on grass and leaves, world/climate.js: asked once a column, g 0 grass, 1 leaves; 1,1,1 in grassland)
  const tnF=new Uint8Array(A2*2),tnC=new Float32Array(A2*6),tint=(lx,lz,g)=>{const i=(lz*CS+lx)*2+g;
    if(!tnF[i]){tnF[i]=1;const T=bioTint(x0+lx,z0+lz,g);tnC[i*3]=T[0];tnC[i*3+1]=T[1];tnC[i*3+2]=T[2];}return i*3;};
  // (where one kind of ground meets another, grass and sand, sand and red sand, dirt and snow..., the top faces' colours
  // blend from one to the other over some 50 blocks: each column's top ground colour (its texture's average times the
  // grass's tint; nothing where the top isn't ground) is blurred twice with a 25-wide box each way, and each corner takes
  // the blurred colour of the four columns round it, as a multiple of this block's own texture's average. The grid is the
  // chunk and GM_M columns round it, enough for the two blurs; the other chunks' columns come from gmCols, kept per chunk)
  const GM=GM_M,GW=CS+2*GM,GN=GW*GW,gS=GM_S.length===GN*4?GM_S:(GM_S=new Float32Array(GN*4)),gT=GM_T.length===GN*4?GM_T:(GM_T=new Float32Array(GN*4));
  // (most chunks are inside one biome on one kind of ground, all of it the same colour as far as the blend reaches: then
  // there's nothing to blend, and the top faces take the grass's tint as they always did. The chunk's own columns as they
  // are here (fallen leaves, hidden features) and the others as gmCols has them)
  let gmOn=false;{const O=gmSig(GM_OWN);for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const i=lz*CS+lx,y=tops[i],bb=y>=0?a[lx+lz*CS+y*A2]:0,o=i*4;
      O[o+3]=0;if(!G_MIX[bb])continue;const t=BLOCK[bb].tiles[0]*3;let r=TILE_AVG[t],g=TILE_AVG[t+1],bl=TILE_AVG[t+2];
      if(bb===GRASS){const T=tnC,k=tint(lx,lz,0);r*=T[k];g*=T[k+1];bl*=T[k+2];}O[o]=r;O[o+1]=g;O[o+2]=bl;O[o+3]=1;}
    gmSig(O);let u=O.u,r=O.ur,g=O.ug,b=O.ub;
    if(u===1){const q0=-Math.floor(GM/CS)-1,q1=Math.floor((CS+GM-1)/CS);
      for(let qz=q0;qz<=q1&&!gmOn;qz++)for(let qx=q0;qx<=q1;qx++){if(!qx&&!qz)continue;const gi=(qz+3)*7+qx+3,C=GM_Q[gi]||(GM_Q[gi]=gmCols(cx+qx,cz+qz));
        if(C.u===2||C.u===1&&(C.ur!==r||C.ug!==g||C.ub!==b)){gmOn=true;break;}}}
    else gmOn=u===2;}
  if(gmOn)for(let j=0;j<GW;j++)for(let i=0;i<GW;i++){const lx=i-GM,lz=j-GM,o=(j*GW+i)*4;
    if(lx>=0&&lx<CS&&lz>=0&&lz<CS){const y=tops[lz*CS+lx],bb=y>=0?a[lx+lz*CS+y*A2]:0;gS[o+3]=0;gS[o]=gS[o+1]=gS[o+2]=0;
      if(!G_MIX[bb])continue;const t=BLOCK[bb].tiles[0]*3;let r=TILE_AVG[t],g=TILE_AVG[t+1],bl=TILE_AVG[t+2];
      if(bb===GRASS){const T=bioTint(x0+lx,z0+lz,0);r*=T[0];g*=T[1];bl*=T[2];}gS[o]=r;gS[o+1]=g;gS[o+2]=bl;gS[o+3]=1;continue;}
    const qx=Math.floor(lx/CS),qz=Math.floor(lz/CS),gi=(qz+3)*7+qx+3,C=GM_Q[gi]||(GM_Q[gi]=gmCols(cx+qx,cz+qz)),q=((lz-qz*CS)*CS+lx-qx*CS)*4;
    gS[o]=C[q];gS[o+1]=C[q+1];gS[o+2]=C[q+2];gS[o+3]=C[q+3];}
  GM_Q.fill(null);
  // (a 25-wide box along x then z, twice: sliding sums, missing columns past the grid's edge counting as nothing)
  const box=(A,B,dx,dy)=>{for(let l=0;l<GW;l++){let r=0,g=0,b=0,w=0;
    for(let k=-12;k<GW;k++){const ia=k+12,ib=k-13;
      if(ia<GW){const o=(l*dy+ia*dx)*4;r+=A[o];g+=A[o+1];b+=A[o+2];w+=A[o+3];}
      if(ib>=0){const o=(l*dy+ib*dx)*4;r-=A[o];g-=A[o+1];b-=A[o+2];w-=A[o+3];}
      if(k>=0){const o=(l*dy+k*dx)*4;B[o]=r;B[o+1]=g;B[o+2]=b;B[o+3]=w;}}}};
  if(gmOn){box(gS,gT,1,GW);box(gT,gS,GW,1);box(gS,gT,1,GW);box(gT,gS,GW,1);}
  const gMix=(lx,lz,y,cx,cz,own)=>{let r=0,g=0,b=0,w=0;
    for(let dj=-1;dj<=0;dj++)for(let di=-1;di<=0;di++){const o=((lz+cz+dj+GM)*GW+lx+cx+di+GM)*4;r+=gS[o];g+=gS[o+1];b+=gS[o+2];w+=gS[o+3];}
    const t=own*3;if(w<1e-6){GMC[0]=GMC[1]=GMC[2]=1;return GMC;}
    GMC[0]=Math.min(1.45,r/w/(TILE_AVG[t]||1));GMC[1]=Math.min(1.45,g/w/(TILE_AVG[t+1]||1));GMC[2]=Math.min(1.45,b/w/(TILE_AVG[t+2]||1));return GMC;};
  const dkC=BL_DARK.size?new Int8Array(A2).fill(-1):null,darkCol=(lx,lz)=>{const i=lz*CS+lx;if(dkC[i]<0)dkC[i]=bldgDarkAt(x0+lx,z0+lz)?1:0;return dkC[i]===1;};
  for(let y=yLo;y<=yTop;y++){
    const midY=y>=1&&y<H-1;
    for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const i0=lx+lz*CS+y*A2,b=a[i0];if(!b)continue;
    const info=BLOCK[b],liquid=!!info.liquid,glow=!!info.glow&&!(y>G&&BL_DARK.size&&darkCol(lx,lz)),out=bufs[liquid?1:0];
    if(lit&&(info.ramp||info.thin))blkAt(x0+lx,y,z0+lz);else BL_r=BL_g=BL_b=0;
    if(info.ramp){emitRamp(out,mx0+lx,y,mz0+lz,info);continue;}
    if(info.hide)continue;
    if(info.thin){emitFence(out,mx0+lx,y,mz0+lz,b,info,at(lx-1,y,lz),at(lx+1,y,lz),at(lx,y,lz-1),at(lx,y,lz+1),at(lx,y+1,lz),tops[lz*CS+lx]===y);continue;}
    const skyTop=tops[lz*CS+lx]===y,tg=b===GRASS?0:b===LEAVES||b===PINE?1:-1,ti=tg<0?-1:tint(lx,lz,tg);
    const waterTop=liquid&&at(lx,y+1,lz)!==WATER;
    // (not on the chunk's edge, nor the world's top or bottom: every block asked about is right here in the array)
    const inner=midY&&lx>0&&lx<CS-1&&lz>0&&lz<CS-1,tiles=info.tiles;
    for(let fi=0;fi<6;fi++){
      const F=FACE_T[fi],nb=inner?a[i0+F.lin]:at(lx+F.dx,y+F.dy,lz+F.dz);
      if(nb!==AIR&&(liquid||!B_SEE[nb]||nb===b))continue;   // (the face is hidden)
      const tile=tiles[F.sel],tx=tile%AC,ty=Math.floor(tile/AC);
      const P=out.p.room(12),U=out.u.room(8),C=out.c.room(12),K=out.k.room(4),n=out.p.length/3,Bv=BL?out.b.room(12):null;
      let po=out.p.length,uo=out.u.length,co=out.c.length,ko=out.k.length,bo=BL?out.b.length:0;
      const wb=lit?(lx+15)+(lz+15)*BLW+(y+1)*BLA:0,wi=wb+F.wf;   // (the block, and the open one in front of the face, in block light's window)
      const gm=gmOn&&F.dy1&&skyTop&&G_MIX[b]===1;
      const X=x0+lx,Z=z0+lz,sky=F.dy1&&skyTop?1+(snowBorn.get(colKey(X,Z))||0):0,V0=1-(ty+1)/AR;
      // (a road's top that hasn't been smashed open since the snow came; a road at a fourth level in one chunk is open tarmac)
      const rdI=sky===1&&snowRoads&&(RD_TOP[b]===1||b===METAL&&RD_TOP[at(lx-1,y,lz)]===1&&RD_TOP[at(lx+1,y,lz)]===1)?RD_Y.indexOf(y):-2,rdO=rdI>=0?RD_OUT[rdI]:null;
      for(let q=0;q<4;q++){
        const c=F.cn[q];
        P[po++]=mx0+lx+c.x;P[po++]=waterTop&&c.y===1?y+0.88:y+c.y;P[po++]=mz0+lz+c.z;
        U[uo++]=(tx+0.002+c.u*0.996)/AC;U[uo++]=V0+(0.002+c.v*0.996)/AR;
        let s;
        if(glow){s=2;if(BL){Bv[bo++]=0;Bv[bo++]=0;Bv[bo++]=0;}}
        else{
          s=F.shade;
          if(!liquid){
            const s1=inner?B_OPQ[a[i0+c.o1]]:+opq(lx+c.s1[0],y+c.s1[1],lz+c.s1[2]),s2=inner?B_OPQ[a[i0+c.o2]]:+opq(lx+c.s2[0],y+c.s2[1],lz+c.s2[2]);
            const cc=inner?B_OPQ[a[i0+c.oc]]:+opq(lx+c.cc[0],y+c.cc[1],lz+c.cc[2]);
            s*=AO[s1&&s2?0:3-(s1+s2+cc)];
            // (smooth light: the open ones of the same four blocks the shading reads, averaged; a solid one has no light of its own)
            if(lit){let r=BL_R[wi],g=BL_G[wi],b=BL_B[wi],m=1;
              if(!s1){const w=wb+c.w1;r+=BL_R[w];g+=BL_G[w];b+=BL_B[w];m++;}if(!s2){const w=wb+c.w2;r+=BL_R[w];g+=BL_G[w];b+=BL_B[w];m++;}
              if(!cc&&!(s1&&s2)){const w=wb+c.wc;r+=BL_R[w];g+=BL_G[w];b+=BL_B[w];m++;}
              const k=17/m;Bv[bo++]=r*k+0.5;Bv[bo++]=g*k+0.5;Bv[bo++]=b*k+0.5;}
            else if(BL){Bv[bo++]=0;Bv[bo++]=0;Bv[bo++]=0;}
          } else if(lit){Bv[bo++]=BL_R[wi]*17;Bv[bo++]=BL_G[wi]*17;Bv[bo++]=BL_B[wi]*17;}
          else if(BL){Bv[bo++]=0;Bv[bo++]=0;Bv[bo++]=0;}
        }
        if(gm){const M=gMix(lx,lz,y,c.x,c.z,tile);C[co++]=s*M[0];C[co++]=s*M[1];C[co++]=s*M[2];}
        else if(ti<0||F.sel===1&&!tg){C[co++]=s;C[co++]=s;C[co++]=s;}
        else if(tg||F.dy1){C[co++]=s*tnC[ti];C[co++]=s*tnC[ti+1];C[co++]=s*tnC[ti+2];}
        else{C[co++]=s*(1+tnC[ti])/2;C[co++]=s*(1+tnC[ti+1])/2;C[co++]=s*(1+tnC[ti+2])/2;}   // (a grass block's side: its green edge, half)
        K[ko++]=rdO?-1-rdO[(lz+c.z)*(CS+1)+lx+c.x]:rdI===-1?-1-RD_OPEN:sky;
      }
      out.p.length=po;out.u.length=uo;out.c.length=co;out.k.length=ko;if(BL)out.b.length=bo;
      const I=out.i.room(6);let io=out.i.length;I[io++]=n;I[io++]=n+1;I[io++]=n+2;I[io++]=n+2;I[io++]=n+1;I[io++]=n+3;out.i.length=io;
    }
    }
  }
  const k=ckey(cx,cz),old=meshes.get(k);
  regionTouch(cx,cz);
  if(old)for(const m of old.m){if(m.parent)m.parent.remove(m);m.geometry.dispose();}
  const m=[],pk=cx>=SHIP_CX0,par=pkS?pkS.grp:scene;   // (a ship's blocks hang off the ship, wherever it's got to: see ships.js)
  bufs.forEach((d,i)=>{
    if(i&&(!d.i.length||pk))return;   // (a ship's own water, round its hull, isn't drawn: the sea it's in is)   // (no water in this chunk: no mesh for it to go round every frame)
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(d.p.take(),3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(d.u.take(),2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(d.c.take(),3));g.setAttribute('aSky',new THREE.Float32BufferAttribute(d.k.take(),1));
    if(BL)g.setAttribute('aBlk',new THREE.BufferAttribute(d.b.take(),3,true));
    const big=d.p.length/3>65535,ia=d.i.take();
    g.setIndex(new THREE.BufferAttribute(big?ia:Uint16Array.from(ia),1));
    // (where it is, known already: saves three.js going through every corner to find out)
    if(THREE.Sphere)g.boundingSphere=new THREE.Sphere(new V3(mx0+CS/2,(yLo+yTop+1)/2,mz0+CS/2),Math.hypot(CS/2,(yTop+1-yLo)/2,CS/2)+0.01);
    const mesh=new THREE.Mesh(g,i?matWater:matOpaque);if(i)mesh.renderOrder=1;par.add(mesh);m.push(mesh);
  });
  if(!pk){const mk=routeMarks(cx,cz);if(mk)m.push(mk);}
  const E={cx,cz,m};meshes.set(k,E);if(!pk)markMeshed(cx,cz,true);
  if(BL)blkDone(cx,cz,E,yLo,yTop);
}
// ---- the paint on the highways out on the plains: thin flat strips laid on the road surface at the road's own angle,
// following its curves -- the yellow centre line and the dashed white lines between the lanes. Built with each chunk
// (each little piece of road by the chunk its middle is in), skipping any piece whose road has been smashed away. ----
function routeMarks(cx,cz){
  const x0=cx*CS,z0=cz*CS,L=routesNearBox(x0,z0,x0+CS-1,z0+CS-1);
  const P=[],U=[],C=[],K=[],I=[],Bl=[];
  const uvOf=t=>[((t%AC)+0.5)/AC,1-(Math.floor(t/AC)+1)/AR+0.5/AR];
  // (yb: the height at the b end, if it isn't level -- on a ramp)
  const quad=(ax,az,bx,bz,nx,nz,o,w,y,t,yb=y)=>{const n=P.length/3,[u,v]=uvOf(t),o0=o-w/2,o1=o+w/2;
    for(const [px,pz,py] of [[ax+nx*o0,az+nz*o0,y],[ax+nx*o1,az+nz*o1,y],[bx+nx*o0,bz+nz*o0,yb],[bx+nx*o1,bz+nz*o1,yb]]){P.push(px,py,pz);U.push(u,v);C.push(0.8,0.8,0.8);K.push(1);if(BL_ON){blkAt(px,py,pz);Bl.push(BL_r,BL_g,BL_b);}}
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
      const gb=get(Math.floor(px),G,Math.floor(pz));if((gb!==GRAVEL&&gb!==PLANKS)||get(Math.floor(px),G+1,Math.floor(pz))!==AIR||bbTorn(px,pz))continue;
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
   const inC=(x,z)=>x>=x0&&x<x0+CS&&z>=z0&&z<z0+CS,ok=(x,z)=>{const gx=Math.floor(x),gz=Math.floor(z),b=get(gx,G,gz);return b&&b!==WATER&&get(gx,G+1,gz)===AIR&&!bbTorn(x,z);};
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
  if(BL_ON)g.setAttribute('aBlk',new THREE.BufferAttribute(Uint8Array.from(Bl),3,true));
  const mesh=new THREE.Mesh(g,matDecal);scene.add(mesh);return mesh;
}
function clearWorld(){rebuildQ.clear();regionsClear();planJob.S=null;for(const e of meshes.values())for(const m of e.m){if(m.parent)m.parent.remove(m);m.geometry.dispose();}meshes.clear();MESHED.fill(0);meshedDirty=true;farDirty=true;chunks.clear();FAR_BS.clear();gfxRecC.clear();plotCache.clear();if(RLF_SH)RLF_SH.clear();plotTypeC.clear();lampSpotC.clear();blkLampC.clear();BL_PROPS.clear();blkLampOut.clear();bridgeCache.clear();superCache.clear();siteC.clear();siteI.clear();setCache.clear();setAtCache.clear();jDegC.clear();linkNearC.clear();if(RIV_H){RIV_H.clear();RIV_LV.clear();}ctlCache.clear();zoneCache.clear();farmC.clear();cloverCache.clear();clearLayout();joinCache.clear();icCache.clear();ctlCache.clear();lastK=-1;
  // (and the rest of what's remembered about a world's plan, which used to be left as the last world had it when a new
  // one was made without loading the page again: coasts, ports, railways, airports, dumps, turbines, names)
  for(const M of [apAtC,dumpSC,setNameC,chainC,coastOwnC,portC,coastC,nearSeaC,hwDeadC,railLinkC,railNearC,railPlotC,furnC,metroC,caveMouthC,lumberNearC,turbC,STK_C,CAP_FIELD,propBorn,bsignUp])M.clear();}
// ---- far chunks drawn in fours: each chunk is its own draw call or three, which at a long detail distance is the bulk of a frame's.
// So a group of up to 4 x 4 chunks a little way off that nothing has happened to for a while is copied into one mesh per material,
// and the chunks themselves hidden. The picture's the same. Anything changing in the group (a block smashed, a chunk dropped) simply
// puts the separate chunks back, and it's merged again once it has settled. They stay merged as you come nearer: that costs nothing,
// and changing them back only happens if something there changes. ----
const REGIONS=new Map(),regionChanged=new Map(),REG_MIN=6,REG_FAR=5,REG_SETTLE=120;   // (REG_FAR in chunks; REG_SETTLE in frames)
let regClock=0,regionsOn=true,regionQ=[];
const regionKey=(cx,cz)=>ckey(cx>>2,cz>>2);
function regionUnmerge(rk){
  const R=REGIONS.get(rk);if(!R)return;REGIONS.delete(rk);
  for(const m of R.m){scene.remove(m);m.geometry.dispose();}
  for(const k of R.members){const e=meshes.get(k);if(e)for(const m of e.m)m.visible=true;}
}
function regionTouch(cx,cz){const rk=regionKey(cx,cz);regionChanged.set(rk,regClock);if(REGIONS.size)regionUnmerge(rk);}
function regionsClear(){for(const R of REGIONS.values())for(const m of R.m){scene.remove(m);m.geometry.dispose();}REGIONS.clear();regionChanged.clear();regionQ.length=0;}
// (the merged copy's arrays are only needed until they're on the graphics card; the chunks keep their own. Not while
// player two has a window of their own, whose renderer uploads them again: ui/seats.js)
function regDrop(){if(!W2.r)this.array=null;}
function regionMerge(rk,keys){
  const byMat=new Map();
  for(const k of keys){const e=meshes.get(k);if(!e)return;for(const m of e.m){if(!m.geometry.index||!m.geometry.index.array)return;let L=byMat.get(m.material);if(!L){L=[];byMat.set(m.material,L);}L.push(m);}}
  const out=[];let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const k of keys){const e=meshes.get(k);x0=Math.min(x0,e.cx*CS);z0=Math.min(z0,e.cz*CS);x1=Math.max(x1,(e.cx+1)*CS);z1=Math.max(z1,(e.cz+1)*CS);}
  for(const [mat,L] of byMat){
    let nv=0,ni=0;for(const m of L){nv+=m.geometry.attributes.position.count;ni+=m.geometry.index.count;}
    if(!ni)continue;
    const P=new Float32Array(nv*3),U=new Float32Array(nv*2),C=new Float32Array(nv*3),K=new Float32Array(nv),I=nv>65535?new Uint32Array(ni):new Uint16Array(ni),Bk=BL_ON?new Uint8Array(nv*3):null;
    let v=0,o=0,y0=1e9,y1=-1e9;
    for(const m of L){const a=m.geometry.attributes,q=m.geometry.index.array,pp=a.position.array;
      P.set(pp,v*3);U.set(a.uv.array,v*2);C.set(a.color.array,v*3);K.set(a.aSky.array,v);if(Bk&&a.aBlk)Bk.set(a.aBlk.array,v*3);
      for(let i=1;i<pp.length;i+=3){const y=pp[i];if(y<y0)y0=y;if(y>y1)y1=y;}
      for(let i=0;i<q.length;i++)I[o++]=q[i]+v;
      v+=a.position.count;}
    const g=new THREE.BufferGeometry();
    for(const [n,arr,w] of [['position',P,3],['uv',U,2],['color',C,3],['aSky',K,1],['aBlk',Bk,3]]){if(!arr)continue;const A=new THREE.BufferAttribute(arr,w,n==='aBlk');A.onUpload(regDrop);g.setAttribute(n,A);}
    const IA=new THREE.BufferAttribute(I,1);IA.onUpload(regDrop);g.setIndex(IA);
    g.boundingSphere=new THREE.Sphere(new V3((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),Math.hypot((x1-x0)/2,(y1-y0)/2,(z1-z0)/2)+0.01);
    const M=new THREE.Mesh(g,mat);M.renderOrder=L[0].renderOrder;scene.add(M);out.push(M);
  }
  for(const k of keys)for(const m of meshes.get(k).m)m.visible=false;
  REGIONS.set(rk,{m:out,members:keys});
}
function regionTick(){
  regClock++;if(!regionsOn||!THREE.Sphere)return;
  // (every half second or so, which groups are ready; one merged every other frame)
  if(regClock%30===0){
    const act=players.filter(p=>p.active),groups=new Map();
    for(const [k,e] of meshes){if(e.cx>=SHIP_CX0)continue;const rk=regionKey(e.cx,e.cz);if(REGIONS.has(rk))continue;let G2=groups.get(rk);if(!G2){G2={keys:[],cx:e.cx,cz:e.cz};groups.set(rk,G2);}G2.keys.push(k);}
    regionQ.length=0;
    for(const [rk,G2] of groups){if(G2.keys.length<REG_MIN||regClock-(regionChanged.get(rk)??-1e9)<REG_SETTLE)continue;
      const mx=(G2.cx>>2)*4+2,mz=(G2.cz>>2)*4+2;let far=true;for(const p of act)if(Math.max(Math.abs(mx-p.pos.x/CS),Math.abs(mz-p.pos.z/CS))<REG_FAR)far=false;
      if(far)regionQ.push([rk,G2.keys]);}
  }
  if(regClock%2===0&&regionQ.length){const [rk,keys]=regionQ.pop();if(!REGIONS.has(rk)&&regClock-(regionChanged.get(rk)??-1e9)>=REG_SETTLE)regionMerge(rk,keys);}
}
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
  shipChunks();   // (each ship's own blocks, all of them, kept for as long as it's there)
  const centers=players.filter(p=>p.active).map(p=>[Math.floor(pwx(p)/CS),Math.floor(pwz(p)/CS)]);   // (aboard a ship: where the ship really is)
  if(DT.freecam)centers.push([Math.floor(FC.pos.x/CS),Math.floor(FC.pos.z/CS)]);
  const cheb=(cx,cz)=>{let m=1e9;for(const [a,b] of centers)m=Math.min(m,Math.max(Math.abs(cx-a),Math.abs(cz-b)));return m;};
  // (standing in the same chunk with everything in sight already made, there's nothing to go through)
  const key=R+'|'+centers.join('|'),same=key===chunkScan.key;
  if(!same)for(const [k,e] of meshes){if(e.cx<SHIP_CX0&&cheb(e.cx,e.cz)>R+1){regionTouch(e.cx,e.cz);for(const m of e.m){if(m.parent)m.parent.remove(m);m.geometry.dispose();}meshes.delete(k);markMeshed(e.cx,e.cz,false);}}
  unloadT-=dt;
  if(unloadT<=0){unloadT=2;for(const k of chunks.keys()){const cx=Math.floor(k/65536)-32768,cz=(k%65536)-32768;if(cx<SHIP_CX0&&cheb(cx,cz)>R+4)chunks.delete(k);}lastK=-1;if(plotCache.size>30000){plotCache.clear();plotTypeC.clear();lampSpotC.clear();bridgeCache.clear();superCache.clear();joinCache.clear();icCache.clear();ctlCache.clear();}}
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
// At most 5 ms a frame (it was 9): in a rampage there's nearly always a queue, and a chunk takes 1 to 2.5 ms, so the
// difference was most of what pushed those frames past 16.7 ms. The cost is that a far hole may show a few frames late, so
// the chunk nearest a player goes first, as that's where the smashing being looked at is.
const REBUILD_MS=5;
function flushRebuilds(){
  if(!rebuildQ.size)return;
  const t0=performance.now(),ms=Math.min(REBUILD_MS,3+rebuildQ.size*0.5);   // (more waiting: a bit more time, so it can't fall far behind; at least one a frame, however long it takes)
  if(rebuildQ.size>2){let best=-1,bd=1e9;
    for(const p of players){if(!p.active)continue;const x=pwx(p)/CS-.5,z=pwz(p)/CS-.5;
      for(const k of rebuildQ){if(collHold.has(k))continue;const e=meshes.get(k);if(!e)continue;const d=Math.abs(e.cx-x)+Math.abs(e.cz-z);if(d<bd){bd=d;best=k;}}}
    if(best!==-1){rebuildQ.delete(best);const e=meshes.get(best);buildChunk(e.cx,e.cz);if(performance.now()-t0>ms)return;}}
  for(const k of rebuildQ){if(collHold.has(k))continue;rebuildQ.delete(k);const e=meshes.get(k);if(!e)continue;buildChunk(e.cx,e.cz);if(performance.now()-t0>ms)break;}
}

