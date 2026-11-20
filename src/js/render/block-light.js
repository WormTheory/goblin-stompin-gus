// ---------- Block light: lamps, neon, lit windows and screens lighting what's round them at night ----------
// Worked out afresh each time a chunk is meshed (buildChunk), by a flood fill out from every light within reach: each block
// travelled takes one off a light's level (15 at most), see-through blocks let it through, solid ones stop it. Red, green and
// blue are filled separately, so neon lights its street in its own colour. The result goes into each corner of each face as a
// vertex colour (aBlk), averaged from the same four blocks the corner's shading reads, and the night shader (nightPatch) lifts
// the dark toward it. Nothing's kept but the mesh: no light in saves or online, as it all follows from the blocks.
// The sources: blocks with light:[level,colour] in BLOCK, the street lamps while they stand, lamp and screen props, and fires.
// Options' Block lighting (BL_ON, localStorage BL_KEY) turns it all off: no fill, no aBlk, the shader as it was.
const BL_KEY='goblin-stompin-gus-blocklight';
let BL_ON=true;try{if(localStorage.getItem(BL_KEY)==='0')BL_ON=false;}catch(e){}
// each block's light as a level per channel (its level, scaled by its colour)
const B_LIT=new Uint8Array(BLOCK.length),B_LR=new Uint8Array(BLOCK.length),B_LG=new Uint8Array(BLOCK.length),B_LB=new Uint8Array(BLOCK.length);
function blkRGB(lv,hex){const r=(hex>>16)&255,g=(hex>>8)&255,b=hex&255,m=Math.max(r,g,b,1);return [Math.round(lv*r/m),Math.round(lv*g/m),Math.round(lv*b/m)];}
BLOCK.forEach((v,b)=>{if(!v||!v.light)return;const [r,g,bb]=blkRGB(v.light[0],v.light[1]);B_LIT[b]=v.light[0];B_LR[b]=r;B_LG[b]=g;B_LB[b]=bb;});
// the street lamps (the cell their lamp hangs in) and the props that light up: [level, colour, height of the light above the prop's foot]
const BL_STREET=blkRGB(15,0xffd08a);
const PROP_LT={flamp:[10,0xffd49a,1.3],dlamp:[8,0xffd49a,0.9],oplamp:[12,0xf4f8ff,1.6],studiolight:[12,0xf4f8ff,1.6],tv:[6,0x8cc8ff,0.6],
  monitor:[4,0x8cc8ff,0.9],candles:[5,0xffa040,0.4],arcade:[6,0xc070ff,1.2],slot:[6,0xffd040,1.2],jukebox:[7,0xff70c0,1],vending:[6,0xe8f4ff,1.2],fishtank:[5,0x60c0ff,0.8]};
// the fill's window: a chunk and 15 blocks round it (nothing further off can reach it), every height, plus a layer above and below
const BLW=CS+30,BLA=BLW*BLW,BLN=BLA*(H+2);
const BL_R=new Uint8Array(BLN),BL_G=new Uint8Array(BLN),BL_B=new Uint8Array(BLN),BL_INQ=new Uint8Array(BLN);
const BL_QM=(1<<19)-1,BL_Q=new Int32Array(BL_QM+1);   // (a cell's only ever in the queue once, and the window has fewer than 2^19)
const BL_CX=new Uint8Array(BLA),BL_CZ=new Uint8Array(BLA),BL_COLO=new Int32Array(BLA),BL_COLA=new Array(BLA).fill(null);
for(let c=0;c<BLA;c++){BL_CX[c]=c%BLW;BL_CZ[c]=Math.floor(c/BLW);}
// how far a column of the window is from the blocks whose light the chunk's faces read (its own and one either side): light
// that can't get that far is no use, so it's never followed (most of a city street's windows are well out of reach)
const BL_D=new Uint8Array(BLW);for(let w=0;w<BLW;w++)BL_D[w]=Math.max(0,14-w,w-(15+CS));
let BL_y0=0,BL_y1=-1,BL_x0=0,BL_z0=0,BL_any=false;   // (the layers the last fill wrote, cleared after; the window's corner in the world)
let BL_r=0,BL_g=0,BL_b=0;   // (the light emitBox, emitFence and emitRamp give their corners: set by buildChunk before each)
// where a chunk's light-giving blocks are, found once and kept on its array (setRaw drops it when one comes or goes)
function blkEmitters(A,qx,qz){
  if(A.blkE)return A.blkE;const L=[],A2=CS*CS,dk=new Map();
  for(let i=0;i<A.length;i++)if(B_LIT[A[i]]){
    // (not one in a building whose lights are out, lights-out.js)
    if(BL_DARK.size&&i>=(G+1)*A2){const c=i%A2;let d=dk.get(c);if(d===undefined){d=bldgDarkAt(qx*CS+c%CS,qz*CS+Math.floor(c/CS));dk.set(c,d);}if(d)continue;}
    L.push(i);}
  A.blkE=Int32Array.from(L);return A.blkE;
}
// the street lamps whose lamps hang in a chunk (where the plan puts them; whether each still stands is asked at the time)
const blkLampC=new Map();
function blkLamps(qx,qz){
  const k=ckey(qx,qz);let L=TENV?null:blkLampC.get(k);if(L)return L;L=[];
  const x0=qx*CS,z0=qz*CS;
  for(let px=Math.floor((x0-3)/CELL);px<=Math.floor((x0+CS+2)/CELL);px++)for(let pz=Math.floor((z0-3)/CELL);pz<=Math.floor((z0+CS+2)/CELL);pz++){
    if(!tenvShow(px,pz)||biomeOf(px,pz)==='plains')continue;const X0=px*CELL,Z0=pz*CELL;
    for(const [lx,lz,rx,rz] of lampSpotsOf(px,pz,X0,Z0,plotBounds(px,pz))){
      const hx=Math.floor(X0+lx+0.5+rx*1.5),hz=Math.floor(Z0+lz+0.5+rz*1.5);if(hx<x0||hx>=x0+CS||hz<z0||hz>=z0+CS)continue;
      L.push({key:'l'+(X0+lx)+','+(Z0+lz),fx:X0+lx,fz:Z0+lz,x:hx,y:G+6,z:hz});}}
  if(!TENV){if(blkLampC.size>4000)blkLampC.clear();blkLampC.set(k,L);}return L;
}
// lamp and screen props seen so far, by chunk (refreshProps meets them as they're drawn: drawProp calls blkProp)
const BL_PROPS=new Map();
function blkProp(f,standing){
  const T=PROP_LT[f.type];if(!T||!BL_ON||f.x>=SHIP_X0)return;
  const x=Math.floor(f.x),z=Math.floor(f.z),y=Math.floor(f.y0+T[2]),k=ckey(Math.floor(x/CS),Math.floor(z/CS));
  let M=BL_PROPS.get(k);const had=!!(M&&M.has(f.key));if(had===standing)return;
  if(standing){if(!M){M=new Map();BL_PROPS.set(k,M);}const c=blkRGB(T[0],T[1]);M.set(f.key,[x,y,z,c[0],c[1],c[2]]);}else M.delete(f.key);
  blkAround(x,z,T[0]-1);
}
// a street lamp knocked over goes dark (drawFix asks each time it's drawn)
const blkLampOut=new Set();
function blkLampDown(f,lit){
  if(!BL_ON)return;
  if(!lit){if(blkLampOut.has(f.key))return;blkLampOut.add(f.key);}else{if(!blkLampOut.has(f.key))return;blkLampOut.delete(f.key);}
  blkAround(Math.floor(f.x+f.rx*1.5),Math.floor(f.z+f.rz*1.5),14);
}
// fires (render/fires.js: the lingering ones in 'fires', and campfires in 'hearths') light their surroundings too. They come
// and go, and die down, so a couple of times a second blkFireTick works out which should be lit and how brightly, and remeshes
// round any that started, went out or dropped a step. Only after dark (by day the light wouldn't show, and the remeshing would
// be wasted), and only the BL_FIRE_N nearest the players, so a town left burning doesn't remesh half the map.
// Traffic lights go in the same list: the lamp that's on in each of the BL_SIG_N nearest signal heads drawn (heads, in
// fixtures), at level 9 in its colour (the heads hang high, so less would hardly reach the road), so the junction's lit red, then green, then amber; each change remeshes round it.
const BL_FIRE=new Map(),BL_FIRE_N=24,BL_FIRE_C=0xff8a30,BL_SIG_N=12,_bsV=new THREE.Vector3();let blFireT=0;
function blkFireTick(dt){
  if((blFireT-=dt)>0)return;blFireT=0.5;
  const want=new Map();
  if(BL_ON&&Math.max(WORLD_LIGHT.value.r,WORLD_LIGHT.value.g,WORLD_LIGHT.value.b)<0.8){
    const L=[],P=players.filter(q=>q.active),dist=(x,z)=>{let d=Infinity;for(const q of P)d=Math.min(d,Math.hypot(q.pos.x-x,q.pos.z-z));return d;};
    // (a fire's brightness: by its size, dimming in steps as it dies down over its last third, as its flames do)
    for(const F of fires){if(!F.flames)continue;const k=Math.min(1,F.t/(F.life*0.35)),lv=Math.round(Math.min(14,9+F.r*2)*Math.ceil(k*3)/3);if(lv>=3)L.push([F,F.x,F.y,F.z,lv,dist(F.x,F.z)]);}
    for(const H of hearths.values())L.push([H,H.x,H.y,H.z,9,dist(H.x,H.z)]);
    L.sort((a,b)=>a[5]-b[5]);
    for(let i=0;i<Math.min(BL_FIRE_N,L.length);i++){const [o,x,y,z,lv,d]=L[i];if(d>CS*12)break;const c=blkRGB(lv,BL_FIRE_C);want.set(o,[Math.floor(x),Math.floor(y)+1,Math.floor(z),c[0],c[1],c[2],lv]);}
    const S=[];for(const h of heads){if(!h.g.visible||!h.lit)continue;const ph=lightPhase(h.ct,h.axis),j=ph==='r'?0:ph==='y'?1:2;
      _bsV.set(0,0.38-0.38*j,0.35).applyMatrix4(h.g.matrix);const d=dist(_bsV.x,_bsV.z);if(d<CS*4)S.push([h,_bsV.x,_bsV.y,_bsV.z,j,d]);}
    S.sort((a,b)=>a[5]-b[5]);
    for(let i=0;i<Math.min(BL_SIG_N,S.length);i++){const [h,x,y,z,j]=S[i],c=blkRGB(9,TL.on[j].color.getHex());want.set(h,[Math.floor(x),Math.floor(y),Math.floor(z),c[0],c[1],c[2],9]);}
  }
  for(const [o,e] of BL_FIRE){const w=want.get(o);if(!w||w[6]!==e[6]||w[0]!==e[0]||w[1]!==e[1]||w[2]!==e[2]||w[3]!==e[3]||w[4]!==e[4]){BL_FIRE.delete(o);blkAround(e[0],e[2],e[6]-1);}}
  for(const [o,w] of want)if(!BL_FIRE.has(o)){BL_FIRE.set(o,w);blkAround(w[0],w[2],w[6]-1);}
}
// halos: in the weather's fog at night, the air round a street lamp, a lamp prop or a fire glows, as real fog scatters a
// light round it (traffic lights get theirs with everything else that glows, carLightsView), and so does the air in front of lit windows and neon:
// not a halo a block (a tower's side has hundreds), but one soft, dimmer one for each patch of them (blkPatches). A soft disc facing the camera on each of the BL_HALO_N nearest such lights (one instanced mesh, drawn
// additively), picked afresh a few times a second by blkHaloTick from those the camera could see (blkSeen: a lamp indoors
// or a window round the back gets none, as its halo would show through the wall).
// How strong is HALO_U.uStr, set per view by renderView: the weather's fog thickness times the debug menu's Halos slider
// (DT.halo) times how dark it is; nothing's drawn when that's 0, so a clear night or the day costs nothing. Each halo fades out into the fog a
// long way further off than the fog's end (uNear, uFar: the fog's), as the lit faces do, and as you get right up to it.
const BL_HALO_N=256,BL_HALO_PN=160,BL_HALO_CN=96,HALO_U={uStr:{value:0},uNear:{value:0},uFar:{value:1},uWorldCurve:CURVE_U};
const HALO_A=new THREE.InstancedBufferAttribute(new Float32Array((BL_HALO_N+BL_HALO_CN)*4),4);HALO_A.usage=THREE.DynamicDrawUsage;
// (made the first time it's needed: the scene isn't there yet when this file runs)
let HALO=null;
function haloMesh(){const g=new THREE.PlaneGeometry(2,2);g.setAttribute('aHalo',HALO_A);
  const m=new THREE.InstancedMesh(g,new THREE.ShaderMaterial({uniforms:HALO_U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'uniform float uStr,uNear,uFar,uWorldCurve;attribute vec4 aHalo;varying vec2 vP;varying vec3 vC;varying float vA;void main(){'+
      'vec4 w=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);vec2 dd=w.xz-cameraPosition.xz;w.y-=uWorldCurve*dot(dd,dd);'+
      'vec4 mv=viewMatrix*w;float d=-mv.z,s=aHalo.w;'+
      // (brought toward the camera by most of its size, so the lamp's own post and the ground under it don't cut it off)
      'mv.xyz*=max(0.05,d-s*0.7)/max(d,0.05);mv.xy+=position.xy*s;gl_Position=projectionMatrix*mv;'+
      'vP=position.xy;vC=aHalo.rgb;vA=uStr*smoothstep(1.5,5.0,d)*(1.0-smoothstep(mix(uNear,uFar,0.5),uFar*(1.0+2.5*min(uStr,1.5)),d));}',
    fragmentShader:'varying vec2 vP;varying vec3 vC;varying float vA;void main(){float r=dot(vP,vP);if(r>1.0)discard;float a=(1.0-r);a*=a;gl_FragColor=vec4(vC*a*vA*0.24,1.0);}'}),BL_HALO_N+BL_HALO_CN);
  m.count=0;m.frustumCulled=false;m.renderOrder=3;scene.add(m);return m;}
// the glowing blocks of a chunk gathered into patches, 8 blocks a side: each patch's middle, its colour summed, and how many
// there are. Kept on the chunk's list of light-giving blocks (blkEmitters), so it goes when that does.
function blkPatches(A,qx,qz){
  const E=blkEmitters(A,qx,qz);if(E.halo)return E.halo;const M=new Map(),A2=CS*CS;
  // (and by which way its wall runs, from the blocks either side along x: a corner's two faces get one each, each in its wall)
  const wall=(x,y,z)=>{const b=x<0||x>=CS?get(qx*CS+x,y,qz*CS+z):A[y*A2+z*CS+x];return B_OPQ[b]||B_LIT[b];};
  for(let q=0;q<E.length;q++){const e=E[q],y=Math.floor(e/A2),r=e-y*A2,x=r%CS,z=Math.floor(r/CS),b=A[e],k=(x>>3)+(z>>3)*4+(y>>3)*16+(wall(x-1,y,z)&&wall(x+1,y,z)?0:1024);
    let P=M.get(k);if(!P){P=[0,0,0,0,0,0,0];M.set(k,P);}P[0]+=x;P[1]+=y;P[2]+=z;P[3]+=B_LR[b];P[4]+=B_LG[b];P[5]+=B_LB[b];P[6]++;}
  const L=[];for(const P of M.values()){const n=P[6];if(n<2)continue;L.push([qx*CS+P[0]/n+0.5,P[1]/n+0.5,qz*CS+P[2]/n+0.5,P[3]/n,P[4]/n,P[5]/n,n]);}
  return E.halo=L;
}
// whether (x,y,z) can be seen from (cx,cy,cz): nothing solid in the way but glowing blocks (a window doesn't hide the one
// beside it), looked for every 3/4 block along the line, stopping short of the light's own block; chunks not made yet count as open
function blkSeen(cx,cy,cz,x,y,z){
  const dx=x-cx,dy=y-cy,dz=z-cz,L=Math.hypot(dx,dy,dz),n=Math.floor((L-1.2)/0.75);let lk=null,lA=null;
  for(let i=1;i<=n;i++){const t=i*0.75/L,X=Math.floor(cx+dx*t),Y=Math.floor(cy+dy*t),Z=Math.floor(cz+dz*t);if(Y<0||Y>=H)continue;
    const qx=Math.floor(X/CS),qz=Math.floor(Z/CS),k=ckey(qx,qz);if(k!==lk){lk=k;lA=chunks.get(k);}if(!lA)continue;
    const b=lA[li(X-qx*CS,Y,Z-qz*CS)];if(B_OPQ[b]&&!B_LIT[b])return false;}
  return true;
}
const blkSeenAny=(C,x,y,z)=>{for(const c of C)if(blkSeen(c.x,c.y,c.z,x,y,z))return true;return false;};
let blHaloT=0,blHaloS=0;const _hM=new THREE.Matrix4(),_hV=new THREE.Vector3(),_hC=new THREE.Color();
function blkHaloTick(dt){
  if(HALO_U.uStr.value<=0.001){if(HALO)HALO.visible=false;blHaloS=0;return;}
  if(!HALO)HALO=haloMesh();HALO.visible=true;if((blHaloT-=dt)>0)return;blHaloT=0.25;
  const P=players.filter(q=>q.active),C=P.map(q=>q.camera.position),L=[],R=Math.min(80,HALO_U.uFar.value*2.6),RP=Math.min(160,HALO_U.uFar.value*3.5);
  const near=(x,z)=>{let d=Infinity;for(const q of P)d=Math.min(d,Math.hypot(q.pos.x-x,q.pos.z-z));return d;};
  // (s: how far out it reaches, k: how bright; left out, both go by the light's level)
  const LP=[],add=(x,y,z,r,g,b,s,k,T=L)=>{const d=near(x,z);if(d<(T===L?R:RP))T.push([x,y,z,r,g,b,d,s,k]);};
  const cs=new Set();for(const q of P)for(let qx=Math.floor((q.pos.x-RP)/CS);qx<=Math.floor((q.pos.x+RP)/CS);qx++)for(let qz=Math.floor((q.pos.z-RP)/CS);qz<=Math.floor((q.pos.z+RP)/CS);qz++)cs.add(qx+','+qz);
  for(const c of cs){const [qx,qz]=c.split(',').map(Number);if(!meshes.has(ckey(qx,qz)))continue;
    // (the street lamps that stand and are lit, as blkFill has them)
    if(qx<SHIP_CX0&&near((qx+0.5)*CS,(qz+0.5)*CS)<R+CS)for(const S of blkLamps(qx,qz)){if(downFix.has(S.key)||falling.has(S.key)||blkLampOut.has(S.key))continue;
      if(chunks.has(ckey(Math.floor(S.fx/CS),Math.floor(S.fz/CS)))&&(get(S.fx,G,S.fz)===ASPHALT||get(S.fx,G+1,S.fz)!==AIR))continue;
      if(get(S.x,S.y,S.z)!==AIR)continue;add(S.x+0.5,S.y+0.3,S.z+0.5,BL_STREET[0],BL_STREET[1],BL_STREET[2]);}
    const M=BL_PROPS.get(ckey(qx,qz));if(M)for(const p of M.values())add(p[0]+0.5,p[1]+0.5,p[2]+0.5,p[3],p[4],p[5]);
    // (windows and neon, further out than the lamps, as a tower's lit side shows a long way off: a patch's halo grows with
    // how many glowing blocks it has, and is a little fainter than a lamp's; a big patch counts as nearer than it is)
    for(const p of blkPatches(chunkArr(qx,qz),qx,qz)){add(p[0],p[1],p[2],p[3],p[4],p[5],Math.min(6,2+Math.sqrt(p[6])*0.45),0.45+0.45*Math.min(1,p[6]/24),LP);
      const e=LP[LP.length-1];if(e&&e[0]===p[0]&&e[1]===p[1]&&e[2]===p[2])e[6]/=1+Math.sqrt(p[6])/3;}}
  for(const p of BL_FIRE.values())add(p[0]+0.5,p[1]+0.5,p[2]+0.5,p[3],p[4],p[5]);
  // (the lamps, fires and signals first, then up to BL_HALO_PN window and neon patches, so a wall of windows close by never
  // crowds out the street lamps further off; nearest first, and only those the camera could see, so a lamp indoors or a
  // window round the back doesn't glow through the wall)
  L.sort((a,b)=>a[6]-b[6]);LP.sort((a,b)=>a[6]-b[6]);
  // (a patch's middle may be just behind a roof with its top half showing above it: its top's tried too)
  const pick=(S,m,T)=>{for(let i=0,c=0;i<S.length&&T.length<m&&c<m*4;i++){const e=S[i];c++;if(blkSeenAny(C,e[0],e[1],e[2])||e[7]>=2&&blkSeenAny(C,e[0],e[1]+e[7]*0.6,e[2]))T.push(e);}};
  const T=[];pick(L,BL_HALO_N-BL_HALO_PN,T);pick(LP,BL_HALO_N,T);const n=T.length,A=HALO_A.array;
  for(let i=0;i<n;i++){const [x,y,z,r,g,b,,s,k]=T[i],m=Math.max(r,g,b,1),f=(k??1)/m;_hM.makeTranslation(x,y,z);HALO.setMatrixAt(i,_hM);
    A[i*4]=r*f;A[i*4+1]=g*f;A[i*4+2]=b*f;A[i*4+3]=s??1.2+m*0.17;}   // (bigger the brighter: reaching about 3.7 blocks out round a street lamp)
  blHaloS=n;HALO.count=n;HALO.instanceMatrix.needsUpdate=true;HALO_A.needsUpdate=true;
}
// ---- everything else that glows: halos in fog, and vehicles' headlights on the road ----
// Lamps and fires are above. Everything else drawn to glow -- the head and tail lamps, indicators, hazards and light bars
// of every vehicle, lit signs, billboards and marquees, level crossing lights, the altar's glow, spell orbs, fireballs,
// flames out of jets and balloons, explosions -- is found by what it's drawn with: an unlit, flat-coloured material
// (MeshBasicMaterial, bright enough to be a light) or a lit one glowing (an emissive colour turned up, as the cars' lamps are
// after dark). Once a second blkGlowScan looks through the scene for such meshes (not the world's blocks, instanced
// effects, decals, markers drawn over everything, or anything faint); each view then puts a halo on the BL_HALO_CN nearest
// that are showing and lit right now, in their colour as it is now, so a flashing light bar's halo flashes with it.
// A picture's colour (a sign's) is taken from its texture, averaged once. carLightsView, from renderView, does it per view.
// Headlights: the CAR_LN nearest moving cars cast a cone of light along the road ahead, into CARL_U for the voxel shader
// (LIT_FRAG; with Block lighting on, after dark).
const CAR_LN=6,CARL_U={uCarP:{value:Array.from({length:CAR_LN},()=>new THREE.Vector4())},uCarD:{value:Array.from({length:CAR_LN},()=>new THREE.Vector3())}};
const _cl=new THREE.Vector3(),_cf=new THREE.Vector3(),_gc=new THREE.Color(),_gs=new THREE.Vector3();
let BL_GLOW=[],blGlowT=0;
// (a texture's average colour, from a tiny copy of it)
function texAvg(t){
  if(t._avg!==undefined)return t._avg;let a=null;
  try{const im=t.image;if(im&&im.width){const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.drawImage(im,0,0,8,8);
    const d=x.getImageData(0,0,8,8).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4){const w=d[i+3]/255;r+=d[i]*w;g+=d[i+1]*w;b+=d[i+2]*w;n+=w;}
    if(n>0)a=new THREE.Color(r/n/255,g/n/255,b/n/255);}}catch(e){}
  return t._avg=a;
}
// a material's glow as it is now, into _gc, and how bright (0 if it isn't one)
function glowOf(m){
  if(!m||m.vertexColors||m.depthTest===false||m.polygonOffset||m.alphaMap)return 0;
  if(m.type==='MeshBasicMaterial'){if(m.transparent&&m.opacity<0.4)return 0;_gc.copy(m.color);
    if(m.map){const a=texAvg(m.map);if(!a)return 0;_gc.multiply(a);}
    const k=Math.max(_gc.r,_gc.g,_gc.b);return k<0.5?0:k*(m.transparent?m.opacity:1);}
  if(m.emissive){_gc.copy(m.emissive);const k=Math.max(_gc.r,_gc.g,_gc.b);return k<0.3?0:k;}
  return 0;
}
function blkGlowScan(){
  const L=[];
  scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o===HALO)return;const m=o.material;if(Array.isArray(m)||!m)return;
    if(m.type!=='MeshBasicMaterial'&&!m.emissive||m.vertexColors||m.depthTest===false||m.polygonOffset||m.alphaMap)return;
    // (not the countless lit materials with no glow at all, nor anything hidden; a lamp that's off now (dark, but bright
    // enough to be a light's off colour) stays in, as it may come on before the next look)
    const c=m.type==='MeshBasicMaterial'?m.color:m.emissive;if(Math.max(c.r,c.g,c.b)<(m.type==='MeshBasicMaterial'?0.15:0.05)||!shownIn(o))return;
    L.push(o);});
  BL_GLOW=L;blkGlowLight(L);
}
// ...and the ones that stay put (a sign, a billboard, a marquee: not a vehicle's lamps, nor anything that flashes) light
// what's round them as the lamps do: the BL_GLOWL_N nearest the players, into the fill (blkFill) like the fires, at a level
// by their size and brightness; one coming, going or changing remeshes round it. Each look notes where every one was and
// its colour, and it's only counted once it's been the same two looks running (anything ever seen to change colour, never).
const BL_GLOWL=new Map(),BL_GLOWL_N=48;
function blkGlowLight(L){
  const want=new Map(),Wl=WORLD_LIGHT.value;
  if(BL_ON&&Math.max(Wl.r,Wl.g,Wl.b)<0.8){
    const P=players.filter(q=>q.active),S=[];
    for(const o of L){const m=o.material;if(m.type!=='MeshBasicMaterial'||o.userData.noGlowLight)continue;
      _cl.setFromMatrixPosition(o.matrixWorld);const kk=glowOf(m),hx=_gc.getHex(),c=kk?hx*32+Math.round(kk*20):-1;
      const same=o._gp&&o._gp.distanceToSquared(_cl)<1e-4;if(o._gcol!==undefined&&o._gcol!==c&&same)o._gflk=true;
      o._gst=same&&o._gcol===c?(o._gst||0)+1:0;if(!o._gp)o._gp=new THREE.Vector3();o._gp.copy(_cl);o._gcol=c;
      if(o._gflk||o._gst<1||!kk)continue;
      let d=Infinity;for(const q of P)d=Math.min(d,Math.hypot(q.pos.x-_cl.x,q.pos.z-_cl.z));if(d>48)continue;
      if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();_gs.setFromMatrixScale(o.matrixWorld);
      const r=o.geometry.boundingSphere.radius*Math.max(_gs.x,_gs.y,_gs.z),lv=Math.round(Math.min(12,5+r*2)*Math.min(1,kk));if(lv<3)continue;
      S.push([o,Math.floor(_cl.x),Math.floor(_cl.y),Math.floor(_cl.z),hx,lv,d]);}
    S.sort((a,b)=>a[6]-b[6]);
    for(let i=0;i<Math.min(BL_GLOWL_N,S.length);i++){const [o,x,y,z,c,lv]=S[i],q=blkRGB(lv,c);want.set(o,[x,y,z,q[0],q[1],q[2],lv]);}
  }
  for(const [o,e] of BL_GLOWL){const w=want.get(o);if(!w||w[0]!==e[0]||w[1]!==e[1]||w[2]!==e[2]||w[3]!==e[3]||w[4]!==e[4]||w[5]!==e[5]||w[6]!==e[6]){BL_GLOWL.delete(o);blkAround(e[0],e[2],e[6]-1);}}
  for(const [o,w] of want)if(!BL_GLOWL.has(o)){BL_GLOWL.set(o,w);blkAround(w[0],w[2],w[6]-1);}
}
const shownIn=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true;};
function carLightsView(p){
  const L=WORLD_LIGHT.value,dk=Math.min(1,Math.max(0,(0.75-Math.max(L.r,L.g,L.b))*2.5)),cam=p.camera.position;
  // headlights on the road: moving cars only (a parked one's are as good as off)
  let k=0;
  if(BL_ON&&dk>0){const near=[];for(const c of cars){if(!c.alive||!c.g.visible||c.parked||Math.abs(c.speed||0)<0.5&&!c.drv)continue;const d=Math.hypot(c.pos.x-cam.x,c.pos.z-cam.z);if(d<64)near.push([c,d]);}
    near.sort((a,b)=>a[1]-b[1]);
    for(const [c] of near){if(k>=CAR_LN)break;
      c.g.updateMatrixWorld();_cf.set(0,0,1).transformDirection(c.g.matrixWorld);_cf.y=0;if(_cf.lengthSq()<1e-4)continue;_cf.normalize();
      _cl.set(0,0.85,1.9).applyMatrix4(c.g.matrixWorld);CARL_U.uCarP.value[k].set(_cl.x,_cl.y,_cl.z,dk);CARL_U.uCarD.value[k].copy(_cf);k++;}}
  for(let i=k;i<CAR_LN;i++)CARL_U.uCarP.value[i].w=0;
  // (the scene looked through once a second after dark, for the ground light above, and for the halos below in fog)
  if(playTime>=blGlowT){blGlowT=playTime+1;if(BL_ON&&dk>0||HALO&&HALO.visible)blkGlowScan();else if(BL_GLOWL.size)blkGlowLight([]);}
  // halos on everything else that glows (that this view's camera could see: checked a few times a second each)
  if(!HALO||!HALO.visible)return;
  const V=p._hv||(p._hv=new WeakMap());
  const R=Math.min(80,HALO_U.uFar.value*2.6),G2=[];
  for(const o of BL_GLOW){_cl.setFromMatrixPosition(o.matrixWorld);const d=Math.hypot(_cl.x-cam.x,_cl.z-cam.z);if(d<R)G2.push([o,d]);}
  G2.sort((a,b)=>a[1]-b[1]);
  let n=blHaloS;const A=HALO_A.array,end=BL_HALO_N+BL_HALO_CN;
  for(const [o] of G2){if(n>=end)break;if(!shownIn(o))continue;_cl.setFromMatrixPosition(o.matrixWorld);
    let v=V.get(o);if(!v||playTime>=v[0]){v=[playTime+0.25,blkSeen(cam.x,cam.y,cam.z,_cl.x,_cl.y,_cl.z)];V.set(o,v);}if(!v[1])continue;
    const kk=glowOf(o.material);if(!kk)continue;const m=Math.max(_gc.r,_gc.g,_gc.b);_gs.setFromMatrixScale(o.matrixWorld);
    if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const r=o.geometry.boundingSphere.radius*Math.max(_gs.x,_gs.y,_gs.z);
    _hM.makeTranslation(_cl.x,_cl.y,_cl.z);HALO.setMatrixAt(n,_hM);
    const f=Math.min(1,kk)*1.1/m;A[n*4]=_gc.r*f;A[n*4+1]=_gc.g*f;A[n*4+2]=_gc.b*f;A[n*4+3]=Math.min(6,Math.max(1.8,1+r*1.6));n++;}   // (even a small lamp's halo reaches a couple of blocks out)
  HALO.count=n;HALO.instanceMatrix.needsUpdate=true;HALO_A.needsUpdate=true;
}
// every chunk within r blocks of (x,z) meshed again
function blkAround(x,z,r){
  if(r<0)return;
  for(let qx=Math.floor((x-r)/CS);qx<=Math.floor((x+r)/CS);qx++)for(let qz=Math.floor((z-r)/CS);qz<=Math.floor((z+r)/CS);qz++){const k=ckey(qx,qz);if(meshes.has(k))rebuildQ.add(k);}
}
// how lit a block was when its chunk was last meshed: 0 none, 1 (levels 1-5), 2 (6-10), 3 (11-15), two bits a block, kept
// on the mesh entry of a chunk with any light (e.lc, from layer e.ly0)
function blkCls(x,y,z){
  const qx=Math.floor(x/CS),qz=Math.floor(z/CS),e=meshes.get(ckey(qx,qz));if(!e||!e.lc)return 0;
  const yy=y-e.ly0;if(yy<0||yy>=e.lh)return 0;const i=yy*CS*CS+(z-qz*CS)*CS+(x-qx*CS);
  return (e.lc[i>>2]>>((i&3)*2))&3;
}
// a block changed (setRaw): a light coming or going, or something solid put into the light's way or taken out of it, can
// change the light up to a light's reach away, which may be in the chunks next door
function blkEdit(x,y,z,old,nb,A){
  if(B_LIT[old]||B_LIT[nb]){A.blkE=null;blkAround(x,z,14);return;}
  if(B_OPQ[old]===B_OPQ[nb]||!meshes.size)return;
  x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);
  const c=Math.max(blkCls(x,y,z),blkCls(x-1,y,z),blkCls(x+1,y,z),blkCls(x,y-1,z),blkCls(x,y+1,z),blkCls(x,y,z-1),blkCls(x,y,z+1));
  if(c)blkAround(x,z,[0,4,9,14][c]);
}
// the fill for chunk (cx,cz), whose faces run from layer yLo to yTop: the light in every open block of the window
// (BL_R/G/B, at (x-BL_x0)+(z-BL_z0)*BLW+(y+1)*BLA). Returns whether any light got anywhere.
function blkFill(cx,cz,yLo,yTop){
  const x0=cx*CS-15,z0=cz*CS-15,NB=[];BL_x0=x0;BL_z0=z0;BL_any=false;
  for(let j=0;j<3;j++)for(let i=0;i<3;i++)NB.push(chunkArr(cx+i-1,cz+j-1));
  const tLo=yLo-1,tHi=yTop+1;let qt=0,ylo=H,yhi=-1;
  const seed=(wx,wz,y,r,g,b)=>{if(wx<0||wx>=BLW||wz<0||wz>=BLW||y<0||y>=H)return;
    if(Math.max(r,g,b)<=BL_D[wx]+BL_D[wz]+(y<tLo?tLo-y:y>tHi?y-tHi:0))return;   // (too far off to reach)
    const n=wx+wz*BLW+(y+1)*BLA;
    if(BL_R[n]>=r&&BL_G[n]>=g&&BL_B[n]>=b)return;if(BL_R[n]<r)BL_R[n]=r;if(BL_G[n]<g)BL_G[n]=g;if(BL_B[n]<b)BL_B[n]=b;
    if(!BL_INQ[n]){BL_INQ[n]=1;BL_Q[qt]=n;qt=(qt+1)&BL_QM;}if(y<ylo)ylo=y;if(y>yhi)yhi=y;};
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){const A=NB[j*3+i],E=blkEmitters(A,cx+i-1,cz+j-1),ox=(i-1)*CS+15,oz=(j-1)*CS+15,qx=cx+i-1,qz=cz+j-1;
    for(let q=0;q<E.length;q++){const e=E[q],y=Math.floor(e/(CS*CS)),r=e-y*CS*CS,b=A[e];seed(ox+(r%CS),oz+Math.floor(r/CS),y,B_LR[b],B_LG[b],B_LB[b]);}
    if(qx<SHIP_CX0){
      for(const L of blkLamps(qx,qz)){if(downFix.has(L.key)||falling.has(L.key))continue;
        // (where the street plan's lamp isn't drawn, as in refreshFixtures; its foot may be in a chunk not made yet, which isn't made for this)
        if(chunks.has(ckey(Math.floor(L.fx/CS),Math.floor(L.fz/CS)))&&(get(L.fx,G,L.fz)===ASPHALT||get(L.fx,G+1,L.fz)!==AIR))continue;
        if(A[li(L.x-qx*CS,L.y,L.z-qz*CS)]!==AIR)continue;
        seed(L.x-x0,L.z-z0,L.y,BL_STREET[0],BL_STREET[1],BL_STREET[2]);}
      const M=BL_PROPS.get(ckey(qx,qz));if(M)for(const P of M.values())seed(P[0]-x0,P[2]-z0,P[1],P[3],P[4],P[5]);}
  }
  for(const P of BL_FIRE.values())seed(P[0]-x0,P[2]-z0,P[1],P[3],P[4],P[5]);   // (fires: seed leaves out those too far off)
  for(const P of BL_GLOWL.values())seed(P[0]-x0,P[2]-z0,P[1],P[3],P[4],P[5]);
  if(!qt){BL_y0=0;BL_y1=-1;return false;}
  // the columns of the window: which of the nine chunks each is in, and where in it
  for(let c=0;c<BLA;c++){const wx=BL_CX[c],wz=BL_CZ[c],i=wx<15?0:wx<15+CS?1:2,j=wz<15?0:wz<15+CS?1:2;BL_COLA[c]=NB[j*3+i];BL_COLO[c]=(wx-15-(i-1)*CS)+(wz-15-(j-1)*CS)*CS;}
  // (written out six times over rather than as a little function: this loop is most of the cost)
  const R=BL_R,Gn=BL_G,Bn=BL_B,INQ=BL_INQ,Q=BL_Q,QM=BL_QM,D=BL_D,A2=CS*CS;let qh=0,qe=qt,k=0,cc=0,up=0,yl=ylo,yh=yhi;
  while(qh!==qe){
    const n=Q[qh];qh=(qh+1)&QM;INQ[n]=0;
    const r=R[n]-1,g=Gn[n]-1,bb=Bn[n]-1,mx=r>g?(r>bb?r:bb):(g>bb?g:bb);if(mx<=0)continue;
    const y1=(n/BLA)|0,c=n-y1*BLA,y=y1-1,wx=BL_CX[c],wz=BL_CZ[c],dy=y<tLo?tLo-y:y>tHi?y-tHi:0,dxz=D[wx]+D[wz];
    if(wx>0&&mx>D[wx-1]+D[wz]+dy){k=n-1;cc=c-1;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;}}}
    if(wx<BLW-1&&mx>D[wx+1]+D[wz]+dy){k=n+1;cc=c+1;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;}}}
    if(wz>0&&mx>D[wx]+D[wz-1]+dy){k=n-BLW;cc=c-BLW;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;}}}
    if(wz<BLW-1&&mx>D[wx]+D[wz+1]+dy){k=n+BLW;cc=c+BLW;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;}}}
    if(y>0&&mx>dxz+(y-1<tLo?tLo-y+1:y-1>tHi?y-1-tHi:0)){k=n-BLA;cc=c;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y-1)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;if(y-1<yl)yl=y-1;if(y-1>yh)yh=y-1;}}}
    if(y<H-1&&mx>dxz+(y+1<tLo?tLo-y-1:y+1>tHi?y+1-tHi:0)){k=n+BLA;cc=c;if(!B_OPQ[BL_COLA[cc][BL_COLO[cc]+(y+1)*A2]]){up=0;if(R[k]<r){R[k]=r;up=1;}if(Gn[k]<g){Gn[k]=g;up=1;}if(Bn[k]<bb){Bn[k]=bb;up=1;}if(up&&!INQ[k]){INQ[k]=1;Q[qe]=k;qe=(qe+1)&QM;if(y+1<yl)yl=y+1;if(y+1>yh)yh=y+1;}}}
  }
  BL_y0=yl;BL_y1=yh;BL_any=true;return true;
}
// the light in block (x,y,z) of the world (as a channel's level times 17, 0 to 255), while a chunk's being meshed
function blkAt(x,y,z){
  const wx=Math.floor(x)-BL_x0,wz=Math.floor(z)-BL_z0;y=Math.floor(y);
  if(!BL_any||wx<0||wx>=BLW||wz<0||wz>=BLW||y<-1||y>H){BL_r=BL_g=BL_b=0;return;}
  const n=wx+wz*BLW+(y+1)*BLA;BL_r=BL_R[n]*17;BL_g=BL_G[n]*17;BL_b=BL_B[n]*17;
}
// after meshing: how lit each of the chunk's own blocks is, for blkEdit, kept on its mesh entry; then the window wiped
function blkDone(cx,cz,e,yLo,yTop){
  e.lc=null;
  if(BL_any){
    const ly0=Math.max(0,yLo-1),ly1=Math.min(H-1,yTop+1),lh=ly1-ly0+1,lc=new Uint8Array((lh*CS*CS+3)>>2);let any=false;
    for(let y=ly0;y<=ly1;y++)for(let lz=0;lz<CS;lz++){let n=15+(lz+15)*BLW+(y+1)*BLA,i=(y-ly0)*CS*CS+lz*CS;
      for(let lx=0;lx<CS;lx++,n++,i++){const m=Math.max(BL_R[n],BL_G[n],BL_B[n]);if(m){lc[i>>2]|=(m>10?3:m>5?2:1)<<((i&3)*2);any=true;}}}
    if(any){e.lc=lc;e.ly0=ly0;e.lh=lh;}
    if(BL_y1>=BL_y0){BL_R.fill(0,(BL_y0+1)*BLA,(BL_y1+2)*BLA);BL_G.fill(0,(BL_y0+1)*BLA,(BL_y1+2)*BLA);BL_B.fill(0,(BL_y0+1)*BLA,(BL_y1+2)*BLA);}
  }
  BL_any=false;BL_y0=0;BL_y1=-1;
}
// the shader's side: with Block lighting on, the materials are compiled with BLOCK_LIGHT (see nightPatch)
function blkDefines(mat){if(BL_ON)mat.defines=Object.assign(mat.defines||{},{BLOCK_LIGHT:''});else if(mat.defines)delete mat.defines.BLOCK_LIGHT;}
// Options' switch: every material set again, every chunk meshed again (through rebuildQ, a few a frame)
function setBlockLight(on){
  on=!!on;if(on===BL_ON)return;BL_ON=on;try{localStorage.setItem(BL_KEY,on?'1':'0');}catch(e){}
  for(const m of BL_MATS){blkDefines(m);m.needsUpdate=true;}
  blkLampOut.clear();BL_PROPS.clear();BL_FIRE.clear();BL_GLOWL.clear();
  for(const [k,e] of meshes){e.lc=null;rebuildQ.add(k);}
  trafficRefreshT=0;   // (the props and lamps noted again)
}
const BL_MATS=[];
