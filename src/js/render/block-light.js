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
const BL_FIRE=new Map(),BL_FIRE_N=24,BL_FIRE_C=0xff8a30;let blFireT=0;
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
  }
  for(const [o,e] of BL_FIRE){const w=want.get(o);if(!w||w[6]!==e[6]||w[0]!==e[0]||w[2]!==e[2]){BL_FIRE.delete(o);blkAround(e[0],e[2],e[6]-1);}}
  for(const [o,w] of want)if(!BL_FIRE.has(o)){BL_FIRE.set(o,w);blkAround(w[0],w[2],w[6]-1);}
}
// halos: in the weather's fog at night, the air round a street lamp, a lamp prop or a fire glows, as real fog scatters a
// light round it (traffic lights too, in whichever colour's showing). A soft disc facing the camera on each of the BL_HALO_N nearest such lights (one instanced mesh, drawn
// additively; walls in front hide it as they would the light), picked afresh a couple of times a second by blkHaloTick.
// How strong is HALO_U.uStr, set per view by renderView with FOG_GLOW (fog thickness times the Fog light slider) times how
// dark it is; nothing's drawn when that's 0, so a clear night or the day costs nothing. Each halo fades out into the fog a
// little further off than the lit faces do (uNear, uFar: the fog's), and as you get right up to it.
const BL_HALO_N=96,HALO_U={uStr:{value:0},uNear:{value:0},uFar:{value:1},uWorldCurve:CURVE_U};
const HALO_A=new THREE.InstancedBufferAttribute(new Float32Array(BL_HALO_N*4),4);HALO_A.usage=THREE.DynamicDrawUsage;
// (made the first time it's needed: the scene isn't there yet when this file runs)
let HALO=null;
function haloMesh(){const g=new THREE.PlaneGeometry(2,2);g.setAttribute('aHalo',HALO_A);
  const m=new THREE.InstancedMesh(g,new THREE.ShaderMaterial({uniforms:HALO_U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'uniform float uStr,uNear,uFar,uWorldCurve;attribute vec4 aHalo;varying vec2 vP;varying vec3 vC;varying float vA;void main(){'+
      'vec4 w=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);vec2 dd=w.xz-cameraPosition.xz;w.y-=uWorldCurve*dot(dd,dd);'+
      'vec4 mv=viewMatrix*w;float d=-mv.z,s=aHalo.w;'+
      // (brought toward the camera by most of its size, so the lamp's own post and the ground under it don't cut it off)
      'mv.xyz*=max(0.05,d-s*0.7)/max(d,0.05);mv.xy+=position.xy*s;gl_Position=projectionMatrix*mv;'+
      'vP=position.xy;vC=aHalo.rgb;vA=uStr*smoothstep(1.5,5.0,d)*(1.0-smoothstep(mix(uNear,uFar,0.5),uFar*(1.0+1.2*min(uStr,1.5)),d));}',
    fragmentShader:'varying vec2 vP;varying vec3 vC;varying float vA;void main(){float r=dot(vP,vP);if(r>1.0)discard;float a=(1.0-r);a*=a;gl_FragColor=vec4(vC*a*vA*0.24,1.0);}'}),BL_HALO_N);
  m.count=0;m.frustumCulled=false;m.renderOrder=3;scene.add(m);return m;}
let blHaloT=0;const _hM=new THREE.Matrix4(),_hV=new THREE.Vector3(),_hC=new THREE.Color();
function blkHaloTick(dt){
  if(HALO_U.uStr.value<=0.001){if(HALO)HALO.visible=false;return;}
  if(!HALO)HALO=haloMesh();HALO.visible=true;if((blHaloT-=dt)>0)return;blHaloT=0.25;
  const P=players.filter(q=>q.active),L=[],R=Math.min(80,HALO_U.uFar.value*2.6);
  const near=(x,z)=>{let d=Infinity;for(const q of P)d=Math.min(d,Math.hypot(q.pos.x-x,q.pos.z-z));return d;};
  const add=(x,y,z,r,g,b)=>{const d=near(x,z);if(d<R)L.push([x,y,z,r,g,b,d]);};
  const cs=new Set();for(const q of P)for(let qx=Math.floor((q.pos.x-R)/CS);qx<=Math.floor((q.pos.x+R)/CS);qx++)for(let qz=Math.floor((q.pos.z-R)/CS);qz<=Math.floor((q.pos.z+R)/CS);qz++)cs.add(qx+','+qz);
  for(const c of cs){const [qx,qz]=c.split(',').map(Number);if(!meshes.has(ckey(qx,qz)))continue;
    // (the street lamps that stand and are lit, as blkFill has them)
    if(qx<SHIP_CX0)for(const S of blkLamps(qx,qz)){if(downFix.has(S.key)||falling.has(S.key)||blkLampOut.has(S.key))continue;
      if(chunks.has(ckey(Math.floor(S.fx/CS),Math.floor(S.fz/CS)))&&(get(S.fx,G,S.fz)===ASPHALT||get(S.fx,G+1,S.fz)!==AIR))continue;
      if(get(S.x,S.y,S.z)!==AIR)continue;add(S.x+0.5,S.y+0.3,S.z+0.5,BL_STREET[0],BL_STREET[1],BL_STREET[2]);}
    const M=BL_PROPS.get(ckey(qx,qz));if(M)for(const p of M.values())add(p[0]+0.5,p[1]+0.5,p[2]+0.5,p[3],p[4],p[5]);}
  for(const p of BL_FIRE.values())add(p[0]+0.5,p[1]+0.5,p[2]+0.5,p[3],p[4],p[5]);
  // (traffic lights: the lamp that's on in each signal head drawn near you, as headLamps shows it; a smaller halo, level 7)
  for(const h of heads){if(!h.g.visible||!h.lit)continue;const ph=lightPhase(h.ct,h.axis),j=ph==='r'?0:ph==='y'?1:2;
    _hV.set(0,0.38-0.38*j,0.35).applyMatrix4(h.g.matrix);_hC.copy(TL.on[j].color);add(_hV.x,_hV.y,_hV.z,_hC.r*7,_hC.g*7,_hC.b*7);}
  L.sort((a,b)=>a[6]-b[6]);const n=Math.min(BL_HALO_N,L.length),A=HALO_A.array;
  for(let i=0;i<n;i++){const [x,y,z,r,g,b]=L[i],m=Math.max(r,g,b,1);_hM.makeTranslation(x,y,z);HALO.setMatrixAt(i,_hM);
    A[i*4]=r/m;A[i*4+1]=g/m;A[i*4+2]=b/m;A[i*4+3]=1.2+m*0.17;}   // (bigger the brighter: reaching about 3.7 blocks out round a street lamp)
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
  blkLampOut.clear();BL_PROPS.clear();BL_FIRE.clear();
  for(const [k,e] of meshes){e.lc=null;rebuildQ.add(k);}
  trafficRefreshT=0;   // (the props and lamps noted again)
}
const BL_MATS=[];
