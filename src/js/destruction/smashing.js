// ---------- Particles, decals ----------
// Dust, smoke, sparks, flying rubble and blood are hundreds of little boxes, and in a big collapse most are in the air at once.
// Each is an ordinary object to the code that moves it (position, rotation, scale, material.color), but none is in the scene:
// each frame fxDraw copies the live ones into one instanced mesh per kind, so they cost one draw call a kind rather than one each.
const fxObj=(c,o)=>{const m=new THREE.Group();m.material={color:new THREE.Color(c),opacity:o};m.visible=false;return m;};
function fxBatch(geo,mat,n,transparent){
  const M=new THREE.InstancedMesh(geo,mat,n);M.frustumCulled=false;M.count=0;
  M.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);M.instanceMatrix.usage=M.instanceColor.usage=THREE.DynamicDrawUsage;
  if(transparent){const a=new THREE.InstancedBufferAttribute(new Float32Array(n),1);a.usage=THREE.DynamicDrawUsage;geo.setAttribute('aFxA',a);M.fxA=a;
    mat.onBeforeCompile=sh=>{sh.vertexShader='attribute float aFxA;varying float vFxA;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vFxA=aFxA;');
      sh.fragmentShader='varying float vFxA;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.a*=vFxA;');};
    mat.customProgramCacheKey=()=>'fxalpha';}
  scene.add(M);return M;
}
// one box's place in the batch: scale, then rotation (as three.js would make it from x, y and z in that order), then position
function fxPut(M,i,o){
  const e=M.instanceMatrix.array,j=i*16,r=o.rotation,s=o.scale,c=o.material.color,C=M.instanceColor.array,t=o.position,A=Math.cos(r.x),B=Math.sin(r.x),D=Math.cos(r.y),E=Math.sin(r.y),F=Math.cos(r.z),H2=Math.sin(r.z);
  e[j]=D*F*s.x;e[j+1]=(A*H2+B*F*E)*s.x;e[j+2]=(B*H2-A*F*E)*s.x;e[j+3]=0;
  e[j+4]=-D*H2*s.y;e[j+5]=(A*F-B*H2*E)*s.y;e[j+6]=(B*F+A*H2*E)*s.y;e[j+7]=0;
  e[j+8]=E*s.z;e[j+9]=-B*D*s.z;e[j+10]=A*D*s.z;e[j+11]=0;
  e[j+12]=t.x;e[j+13]=t.y;e[j+14]=t.z;e[j+15]=1;
  if(t.x>=SHIP_X0)shipFx(e,j);   // (in a ship's pocket: drawn where the ship really is)
  C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;
}
// (n boxes written to an instanced mesh: only those are sent up to the graphics card, and nothing at all if it's empty and was already)
const fxSent=(M,n)=>{if(!n&&!M.count)return;M.count=n;for(const [a,w] of [[M.instanceMatrix,16],[M.instanceColor,3],[M.fxA,1]])if(a){a.needsUpdate=true;if(a.updateRange){a.updateRange.offset=0;a.updateRange.count=n*w;}}};
const parts=[];
for(let i=0;i<200;i++)parts.push({m:fxObj(0xb79a72,1),v:new V3(),life:0,kind:0});
const PART_M=fxBatch(new THREE.BoxGeometry(0.22,0.22,0.22),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}),200,true);
// (the see-through effects take turns by renderOrder, as three.js sorts whole meshes and every batch sits at the origin:
// the part of a big blast's cloud and the see-through boxes beyond a water surface 0.9 (SEE_U), rings and cones there 0.95, water 1, flames 1.1, the rest of the cloud 1.5, the see-through boxes (these puffs, fires' smoke, dust devils, flashes and fireballs' glow,
// drawn as one sorted batch, SEE_M below) beyond the nearest ring 1.6, rings and cones 1.7, the boxes nearer than it 1.8.
// All after the water, so it never paints over them; and none that fades writes depth, so a fading one never cuts a box-shaped
// hole in the water or smoke behind it. tools/ui/fxorder.js checks every pair of them.)
PART_M.renderOrder=1.6;
let pIdx=0;
function takePart(){for(let k=0;k<parts.length;k++){const p=parts[(pIdx+k)%parts.length];if(p.life<=0){pIdx=(pIdx+k+1)%parts.length;return p;}}const p=parts[pIdx];pIdx=(pIdx+1)%parts.length;return p;}
function puff(x,y,z,n,color=0x9a948a,spread=1){if(SBX)return;for(let i=0;i<n;i++){const p=takePart();p.kind=0;p.life=0.7+Math.random()*0.5;p.m.material.color.setHex(color);p.m.position.set(x+(Math.random()-.5)*1.4*spread,y+0.15,z+(Math.random()-.5)*1.4*spread);const a=Math.random()*Math.PI*2,s=(2+Math.random()*3)*spread;p.v.set(Math.cos(a)*s,1.5+Math.random()*2.5,Math.sin(a)*s);p.sz=1;p.m.scale.setScalar(1);p.m.visible=true;}}
// spray kicked up by a swimmer at height y: small drops sized to their body (a goblin's a good deal smaller than a hippo's),
// thrown out from behind them and away. A goblin's eyes are its camera, so none of it ever lands in front of a
// first-person view; ring (falling in) spreads a hippo's all round him, a goblin's still only behind.
function swimSpray(p,y,n,k=1,ring=false){if(SBX)return;const B=bodyOf(p),s=B.hy/HIPPO_BODY.hy,fx=Math.sin(p.heading),fz=Math.cos(p.heading),all=ring&&!p.gob;
  for(let i=0;i<n;i++){const q=takePart();q.kind=0;q.life=0.45+Math.random()*0.35;q.sz=0.45*s*k;q.m.material.color.setHex(0xcfe8ff);
    // (a: the way out, measured from straight behind; f and d its forward and sideways parts)
    const a=all?Math.random()*Math.PI*2:(Math.random()-.5)*Math.PI*0.8,f=-Math.cos(a),d=Math.sin(a),dx=fx*f+fz*d,dz=fz*f-fx*d;
    q.m.position.set(p.pos.x+fx*f*B.hz*0.9+fz*d*B.hx*0.9,y+0.05,p.pos.z+fz*f*B.hz*0.9-fx*d*B.hx*0.9);
    const v=(1+Math.random()*1.6)*s*k;q.v.set(dx*v,(1.2+Math.random()*1.4)*Math.sqrt(s*k),dz*v);q.m.scale.setScalar(q.sz);q.m.visible=true;}}
function smoke(x,y,z,n,color){for(let i=0;i<n;i++){const p=takePart();p.kind=2;p.life=1.4+Math.random();p.m.material.color.setHex(color);p.m.position.set(x+(Math.random()-.5)*0.6,y,z+(Math.random()-.5)*0.6);p.v.set((Math.random()-.5)*0.8,1.6+Math.random()*1.4,(Math.random()-.5)*0.8);p.m.scale.setScalar(1.5);p.m.visible=true;}}
// (Options' Hide blood: no spray, no splats on the ground and no pool under a fallen hippo. Each player's own choice,
// online too: a guest's game makes the blood the host sends through these same functions.)
const BLOOD_KEY='goblin-stompin-gus-noblood';let BLOOD_OFF=false;try{BLOOD_OFF=localStorage.getItem(BLOOD_KEY)==='1';}catch(e){}
function blood(x,y,z,n,dir){if(SBX||BLOOD_OFF)return;for(let i=0;i<n;i++){const p=takePart();p.kind=1;p.life=1.4;const s=(0.05+Math.random()*0.1)/0.22;p.m.scale.set(s,s,s);p.m.material.color.setHex([0x7a0b0b,0x9c1212,0x5c0707][i%3]);p.m.position.set(x,y,z);p.v.set((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3);if(dir)p.v.addScaledVector(dir,2+Math.random()*5);p.m.visible=true;}}
function updateParts(dt){const w=windNow();for(const p of parts){if(p.life<=0)continue;p.life-=dt;const m=p.m;
  if(p.kind===1){p.v.y-=20*dt;m.position.addScaledVector(p.v,dt);const g=groundAt(m.position.x,m.position.z,m.position.y);if(m.position.y<=g){if(Math.random()<0.5)splat(m.position.x,m.position.z,g+0.5,0.08+Math.random()*0.2);p.life=0;}m.material.opacity=1;}
  else if(p.kind===2){p.v.multiplyScalar(1-0.9*dt);m.position.addScaledVector(p.v,dt);m.position.x+=w.x*SMOKE_WIND*0.8*dt;m.position.z+=w.z*SMOKE_WIND*0.8*dt;m.scale.setScalar(1.5+(2.4-p.life)*1.3);m.material.opacity=Math.max(0,Math.min(1,p.life))*0.75;}
  else{p.v.y-=6*dt;p.v.multiplyScalar(1-2*dt);m.position.addScaledVector(p.v,dt);m.material.opacity=Math.max(0,Math.min(1,p.life*1.6));m.scale.setScalar((p.sz||1)*(1+(1-p.life)));}
  if(p.life<=0)m.visible=false;}}
const decals=[];let decalIdx=0,decalsDirty=false;
for(let i=0;i<160;i++){const m=fxObj([0x5a0a0a,0x6e0d0d,0x4a0606][i%3],1);m.rotation.x=-Math.PI/2;decals.push(m);}
const DECAL_M=fxBatch(new THREE.CircleGeometry(1,10),new THREE.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false}),160,false);
// (they lie flat at the same height, so overlapping ones would fight over the depth buffer and flicker: they don't write
// depth, and are drawn oldest first, so where two overlap the newer one is simply painted over the older; drawn after
// the rest of the solid scene, so the ground under them can't paint over them in turn)
DECAL_M.renderOrder=2;
function splat(x,z,y,r){if(SBX||BLOOD_OFF)return;const g=supportAt(x,z,y);if(g===null)return;const m=decals[decalIdx++%decals.length];m.position.set(x,g+0.015,z);m.scale.set(r*(0.7+Math.random()*0.6),r*(0.7+Math.random()*0.6),1);m.rotation.z=Math.random()*6.28;m.visible=true;decalsDirty=true;}
const flatMat=(c,o,f)=>new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,polygonOffset:true,polygonOffsetFactor:f,polygonOffsetUnits:f});
const scorches=[];let scorchIdx=0;
{const sg=new THREE.CircleGeometry(1,14),sm=flatMat(0x141210,0.85,-4);for(let i=0;i<8;i++){const m=new THREE.Mesh(sg,sm);m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);scorches.push(m);}}

// ---------- Block smashing ----------
// ---- what each material does when it breaks ----
const tileColor=[];
try{const d=actx.getImageData(0,0,atlas.width,atlas.height).data;for(let t=0;t<AC*AR;t++){let r=0,g=0,b=0,n=0;const ox=(t%AC)*T,oy=Math.floor(t/AC)*T;for(let y=0;y<T;y++)for(let x=0;x<T;x++){const o=((oy+y)*atlas.width+ox+x)*4;if(d[o+3]<128)continue;r+=d[o];g+=d[o+1];b+=d[o+2];n++;}tileColor[t]=n?((r/n)<<16|(g/n)<<8|(b/n)):0x888888;}}catch(e){}
const shadeHex=(h,k)=>{const r=Math.min(255,((h>>16)&255)*k),g=Math.min(255,((h>>8)&255)*k),b=Math.min(255,(h&255)*k);return(r<<16)|(g<<8)|b;};
const blockColor=b=>{const t=BLOCK[b]&&BLOCK[b].tiles;return t&&tileColor[t[2]]!==undefined?tileColor[t[2]]:0x888888;};
const KIND={};
for(const b of [WIN_BLUE,WIN_GREEN,WIN_WARM,GLASS,ICE,PACKICE])KIND[b]='glass';
for(const b of [NEON_G,NEON_M,NEON_Y,NEON_O,LAMP])KIND[b]='neon';
for(const b of [METAL,RUST])KIND[b]='metal';
for(const b of [LOG,PLANKS])KIND[b]='wood';
for(const b of [LEAVES,GRASS,PINE,REEDS,CACTUS])KIND[b]="plant";
for(const b of [DIRT,SAND,SNOW,RED_SAND,MUD,SALT])KIND[b]="dirt";KIND[SANDSTONE]=KIND[TERRA]=KIND[TERRA2]="stone";
for(const b of [MARBLE])KIND[b]='stone';for(const b of [BRONZE])KIND[b]='metal';for(const b of [SHELF,CRATE,DOOR_W,DOOR_WK,DOOR_BARN,FENCE,FENCE_W])KIND[b]='wood';KIND[DOOR_G]=KIND[DOOR_GB]=KIND[STAINED]='glass';KIND[GRAVE]=KIND[GRAVEX]='stone';KIND[CHAINLINK]=KIND[GOLD]='metal';
for(const b of [BED,SOFA,AWN_R,AWN_G])KIND[b]='fabric';
KIND[PUMP]='metal';KIND[SIDING]='wood';KIND[SIDING_Y]='wood';KIND[SHINGLE]='wood';KIND[HOSPX]='neon';
KIND[FLOWER]='plant';KIND[SCREEN]='glass';KIND[NEON_B]='neon';KIND[NEON_R]='neon';KIND[FRIDGE]='metal';
const SHARD={[HOSPX]:0xff5a5a,[WIN_BLUE]:0x7fc4ee,[WIN_GREEN]:0xa6f272,[WIN_WARM]:0xf6c464,[GLASS]:0xd4ecf4,[NEON_G]:0x9cff6e,[NEON_M]:0xff60d6,[LAMP]:0xeeffaa,[SCREEN]:0x7af0dc,[NEON_B]:0x6aa8ff,[NEON_R]:0xff5a5a};
const rubble=[];
for(let i=0;i<260;i++)rubble.push({m:fxObj(0xffffff,1),v:new V3(),spin:new V3(),life:0,kind:0,rest:false,sx:1,sy:1,sz:1,half:0.1,grav:20,drag:0,col:0,ph:0});
const RUBBLE_M=fxBatch(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),260,false);
// (the see-through ones are written furthest from the camera first, so they blend the way they would drawn one at a time)
const fxOrder=[];
let decalsShip=false;   // (blood or scorch marks in a ship's pocket, drawn where the ship is now)
function fxDraw(){
  let n=0;for(const r of rubble)if(r.m.visible)fxPut(RUBBLE_M,n++,r.m);
  if(n||RUBBLE_M.count)fxSent(RUBBLE_M,n);
  if(decalsDirty||decalsShip&&shipN){decalsDirty=false;decalsShip=false;n=0;const L=decals.length;for(let k=0;k<L;k++){const d=decals[(decalIdx+k)%L];if(d.visible){fxPut(DECAL_M,n++,d);if(d.position.x>=SHIP_X0)decalsShip=true;}}fxSent(DECAL_M,n);}   // (any on a ship: put again every frame, so they go where it goes)
  fxOrder.length=0;const c=P1.camera.position;
  for(const p of parts)if(p.m.visible){const t=p.m.position;p.d=(t.x-c.x)*(t.x-c.x)+(t.y-c.y)*(t.y-c.y)+(t.z-c.z)*(t.z-c.z);fxOrder.push(p);}
  if(fxOrder.length>1)fxOrder.sort((a,b)=>b.d-a.d);
  n=0;for(const p of fxOrder){PART_M.fxA.array[n]=p.m.material.opacity;fxPut(PART_M,n++,p.m);}
  if(n||PART_M.count)fxSent(PART_M,n);
  seeDraw();
}
// ---- the see-through boxes, all drawn as one: the puffs above, fires' smoke (render/fires.js), dust devils (render/weather.js),
// blast flashes (blastFx) and fireballs' glow. three.js sorts whole meshes, not the boxes in them, so kept apart they'd take turns by renderOrder whatever
// stood nearer; gathered here each frame and drawn far to near, each shows through the others the way it should. The meshes
// they used to draw with still hold them (PART_M and smokeM filled as before, the flashes and glows still moved and faded)
// but aren't drawn themselves. ----
// (in two: the boxes beyond the nearest shockwave ring or cone drawn before it, the rest after, so a ring shows through the
// smoke in front of it and over the smoke behind it)
const SEE_N=5000,seeBatch=()=>fxBatch(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}),SEE_N,true);
// (and the boxes on the far side of a water surface from the camera, in the water seen from above it or out of it seen from
// under it, in a third, SEE_U, drawn before the water: after it, they'd paint over it as if in front)
const SEE_M=seeBatch(),SEE_M2=seeBatch(),SEE_U=seeBatch();SEE_M.renderOrder=1.6;SEE_M2.renderOrder=1.8;SEE_U.renderOrder=0.9;
let seeOff=false;
function seeDraw(){
  if(!seeOff){seeOff=true;PART_M.visible=false;smokeM.visible=false;devilM.visible=false;FB_HALO.visible=false;for(const bl of blasts)for(const f of bl.m)f.material.visible=false;}
  const c=P1.camera.position,d2=(e,o)=>(e[o+12]-c.x)**2+(e[o+13]-c.y)**2+(e[o+14]-c.z)**2;
  // the few loose ones (flashes, fireballs' glow), sorted far to near
  // (the tests' stand-in three.js has no world matrices: there the flashes, glows and rings are simply left out)
  const X=SEE_X;X.length=0;
  const one=m=>{if(!m.updateWorldMatrix)return;m.updateWorldMatrix(true,false);const M=m.material;if(M.opacity<=0)return;const e=m.matrixWorld.elements;X.push({e,c:M.color,a:M.opacity,d:d2(e,0)});};
  for(const bl of blasts)if(bl.t>0)for(const f of bl.m)if(f.visible)one(f);
  for(const F of FIREB)if(F.live&&F.g.visible)one(F.halo);
  // (the dust devils' boxes too: drawn on their own after all the smoke, a devil behind a plume showed through it)
  const dm=devilM.instanceMatrix&&devilM.instanceMatrix.array;
  if(dm)for(let i=0;i<devilM.count;i++){let q=SEE_DV[i];if(!q||q.e.buffer!==dm.buffer)q=SEE_DV[i]={e:dm.subarray(i*16,i*16+16),c:devilM.material.color,a:0,d:0};
    q.a=devilM.material.opacity;q.d=d2(q.e,0);X.push(q);}
  if(X.length>1)X.sort((a,b)=>b.d-a.d);
  // (a ring or cone on the far side of a water surface from the camera is drawn before the water, like SEE_U's boxes, and
  // doesn't split the batch)
  const cw=bbWet(c.x,c.y,c.z);
  let cut=-1;const near=t=>{if(!t.updateWorldMatrix)return;t.updateWorldMatrix(true,false);const e=t.matrixWorld.elements;
    const u=bbWet(e[12],e[13],e[14])!==cw;if(t.renderOrder===1.7||t.renderOrder===0.95)t.renderOrder=u?0.95:1.7;   // (left alone when a tool's set it otherwise: fxorder)
    if(u)return;const d=d2(e,0);if(cut<0||d<cut)cut=d;};
  for(const s of shocks)if(s.m.visible)near(s.m);for(const k of cones)if(k.g.visible)near(k.m);
  // merged with the puffs (PART_M, put far to near by fxDraw) and fires' smoke (smokeM, put far to near by updateFires):
  // a pass down the three lists rather than sorting every box again
  const pe=PART_M.instanceMatrix.array,pc=PART_M.instanceColor.array,pa=PART_M.fxA.array,pn=PART_M.count;
  const se=smokeM.instanceMatrix.array,sc=smokeM.instanceColor.array,sa=smokeM.material.opacity,sn=smokeM.count;
  let i=0,j=0,x=0,o=0,ou=0,M=SEE_M,E=M.instanceMatrix.array,C=M.instanceColor.array,A=M.fxA.array;
  const UE=SEE_U.instanceMatrix.array,UC=SEE_U.instanceColor.array,UA=SEE_U.fxA.array;
  let di=pn?d2(pe,0):-1,dj=sn?d2(se,0):-1,dx=X.length?X[0].d:-1;
  for(let n=0;n<SEE_N;n++){
    const d=Math.max(di,dj,dx);if(d<0)break;
    if(M===SEE_M&&cut>=0&&d<cut){fxSent(SEE_M,o);M=SEE_M2;o=0;E=M.instanceMatrix.array;C=M.instanceColor.array;A=M.fxA.array;}   // (nearer than the nearest ring: drawn after it)
    // (the box's matrix, from s in e, and its colour and alpha)
    let e,s,r,g,b,a,pf=false;
    if(d===di){e=pe;s=i*16;r=pc[i*3];g=pc[i*3+1];b=pc[i*3+2];a=pa[i];pf=true;i++;di=i<pn?d2(pe,i*16):-1;}
    else if(d===dj){e=se;s=j*16;r=sc[j*3];g=sc[j*3+1];b=sc[j*3+2];a=sa;j++;dj=j<sn?d2(se,j*16):-1;}
    else{const L=X[x];e=L.e;s=0;r=L.c.r;g=L.c.g;b=L.c.b;a=L.a;x++;dx=x<X.length?X[x].d:-1;}
    const u=bbWet(e[s+12],e[s+13],e[s+14])!==cw,TE=u?UE:E,TC=u?UC:C,TA=u?UA:A,k=u?ou++:o++,t=k*16;
    for(let q=0;q<16;q++)TE[t+q]=e[s+q];if(pf)for(const q of SEE_K)TE[t+q]*=0.22;
    TC[k*3]=r;TC[k*3+1]=g;TC[k*3+2]=b;TA[k]=a;}
  fxSent(M,o);if(M===SEE_M)fxSent(SEE_M2,0);fxSent(SEE_U,ou);
}
const SEE_X=[],SEE_DV=[],SEE_K=[0,1,2,4,5,6,8,9,10];   // (SEE_K: a matrix's turn-and-size part, scaled by a puff's 0.22 box)
let rIdx=0;
function takeRubble(){for(let k=0;k<rubble.length;k++){const r=rubble[(rIdx+k)%rubble.length];if(r.life<=0){rIdx=(rIdx+k+1)%rubble.length;return r;}}const r=rubble[rIdx];rIdx=(rIdx+1)%rubble.length;return r;}
// kind: 0 chunk, 1 shard, 2 spark, 3 leaf
function emit(kind,x,y,z,col,sx,sy,sz,o){
  const r=takeRubble(),m=r.m;
  r.kind=kind;r.rest=false;r.col=col;r.sx=sx;r.sy=sy;r.sz=sz;r.half=Math.min(sx,sy,sz)/2;r.ph=Math.random()*6;
  r.life=kind===2?0.35+Math.random()*0.4:kind===3?2+Math.random()*1.5:kind===1?2.5+Math.random()*1.5:4+Math.random()*3;
  r.grav=kind===3?3:kind===2?14:20;r.drag=kind===3?2.5:kind===2?1:0.2;
  const f=o.force,a=Math.random()*Math.PI*2,sp=(1.5+Math.random()*3.5)*f*(kind===2?1.8:kind===1?1.4:1);
  r.v.set(Math.cos(a)*sp+o.dx*f*(3+Math.random()*4),(2+Math.random()*4)*f*(o.up||1),Math.sin(a)*sp+o.dz*f*(3+Math.random()*4));
  r.spin.set((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14);
  m.position.set(x+(Math.random()-.5)*0.8,y+(Math.random()-.5)*0.8,z+(Math.random()-.5)*0.8);
  m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
  m.scale.set(sx,sy,sz);m.material.color.setHex(col);m.visible=true;
}
function updateRubble(dt){for(const r of rubble){if(r.life<=0)continue;r.life-=dt;const m=r.m;
  if(r.rest){const g=supportAt(m.position.x,m.position.z,m.position.y);if(g===null||g<m.position.y-r.half-0.2)r.rest=false;}
  if(!r.rest){
    r.v.y-=r.grav*dt;if(r.drag)r.v.multiplyScalar(Math.max(0,1-r.drag*dt));
    m.position.addScaledVector(r.v,dt);m.rotation.x+=r.spin.x*dt;m.rotation.y+=r.spin.y*dt;m.rotation.z+=r.spin.z*dt;
    if(r.kind===3){m.position.x+=Math.sin(r.life*7+r.ph)*dt*1.2;m.position.z+=Math.cos(r.life*5+r.ph)*dt*1.2;}
    const g=supportAt(m.position.x,m.position.z,m.position.y);
    if(g!==null&&m.position.y<g+r.half){
      if(r.kind===2)r.life=0;
      else{m.position.y=g+r.half;
        if(Math.abs(r.v.y)<1.6||r.kind===3){r.rest=true;r.v.set(0,0,0);m.rotation.x=0;m.rotation.z=0;}
        else{r.v.y*=r.kind===1?-0.2:-0.35;r.v.x*=0.6;r.v.z*=0.6;r.spin.multiplyScalar(0.5);}}
    }
  }
  if(r.kind===2)m.material.color.setHex(Math.random()<0.5?r.col:0xffffff);
  else if(r.kind===1&&!r.rest)m.material.color.setHex(Math.random()<0.15?0xffffff:r.col);
  const sc=r.life<0.5?Math.max(0,r.life/0.5):1;m.scale.set(r.sx*sc,r.sy*sc,r.sz*sc);
  if(r.life<=0)m.visible=false;}}
function destroyFX(list,o,quiet){
  if(!list.length)return;
  const per=Math.max(1,Math.min(4,Math.floor(56/list.length)));
  const kinds=new Set();let sx=0,sy=0,sz=0,dustCol=null;
  for(const {x,y,z,b} of list){
    const k=KIND[b]||'stone',cx=x+.5,cy=y+.5,cz=z+.5,base=blockColor(b);
    kinds.add(k);sx+=cx;sy+=cy;sz+=cz;
    const jitter=()=>shadeHex(base,DIM*(0.8+Math.random()*0.35));
    if(k==='glass'){
      for(let i=0;i<per+2;i++){const s=0.18+Math.random()*0.22;emit(1,cx,cy,cz,SHARD[b],s,s*(0.6+Math.random()),0.04,o);}
      emit(0,cx,cy,cz,jitter(),0.3,0.3,0.3,o);
    } else if(k==='neon'){
      for(let i=0;i<6;i++)emit(2,cx,cy,cz,SHARD[b],0.07,0.07,0.07,o);
      for(let i=0;i<2;i++)emit(1,cx,cy,cz,SHARD[b],0.22,0.16,0.05,o);
    } else if(k==='metal'){
      for(let i=0;i<per;i++){const s=0.3+Math.random()*0.3;emit(0,cx,cy,cz,jitter(),s,0.07,s*0.8,o);}
      for(let i=0;i<3;i++)emit(2,cx,cy,cz,0xffb040,0.06,0.06,0.06,o);
    } else if(k==='wood'){
      for(let i=0;i<per+1;i++)emit(0,cx,cy,cz,jitter(),0.1,0.1,0.35+Math.random()*0.3,o);
    } else if(k==='fabric'){
      for(let i=0;i<per+3;i++)emit(3,cx,cy,cz,jitter(),0.18,0.05,0.18,o);
    } else if(k==='plant'){
      const leaf=b===GRASS?0x5f9f35:0x3f7a2a;
      for(let i=0;i<per+3;i++)emit(3,cx,cy,cz,b===FLOWER?[0xd23a3a,0xf2d040,0x4f8a32][i%3]:shadeHex(leaf,0.8+Math.random()*0.4),0.16,0.03,0.16,o);
      if(b===GRASS)for(let i=0;i<per;i++)emit(0,cx,cy,cz,shadeHex(0x86603f,DIM),0.2,0.2,0.2,o);
    } else {
      for(let i=0;i<per;i++){const s=0.18+Math.random()*0.3;emit(0,cx,cy,cz,jitter(),s,s*(0.7+Math.random()*0.5),s*(0.7+Math.random()*0.5),o);}
      if(dustCol===null)dustCol=shadeHex(base,1.1);
    }
  }
  const n=list.length;sx/=n;sy/=n;sz/=n;
  if(dustCol!==null){puff(sx,sy-0.5,sz,Math.min(16,3+n*2),dustCol,1+Math.min(1,n/9));if(n>=4)smoke(sx,sy,sz,Math.min(6,n>>1),shadeHex(dustCol,0.9));}
  if(quiet)return;
  const near=nearestPlayer(sx,sz,false),att=near?Math.max(0.12,1-near.d/40):0.5;
  // (each inside sfx, so the sound list names it and the name ends with it: set by hand, the tag stayed on and named every sound after it)
  if(kinds.has('stone')||kinds.has('dirt'))sfx('Stone breaks',()=>{noise(0.35+Math.min(0.4,n*0.03),0.5*att,450,'lowpass');tone('sine',70,35,0.3,0.25*att);});
  if(kinds.has('glass'))sfx('Glass breaks',()=>{noise(0.3,0.3*att,5200,'highpass');for(let i=0;i<4;i++)tone('sine',2200+Math.random()*1800,1800+Math.random()*1200,0.12,0.05*att,Math.random()*0.25);});
  if(kinds.has('metal'))sfx('Metal breaks',()=>{tone('square',520,240,0.14,0.08*att);noise(0.12,0.25*att,3000,'bandpass');});
  if(kinds.has('neon'))sfx('Neon breaks',()=>{tone('sawtooth',1900,180,0.2,0.06*att);noise(0.18,0.2*att,6000,'highpass');});
  if(kinds.has('wood'))sfx('Wood breaks',()=>{noise(0.14,0.4*att,1400,'bandpass');tone('triangle',190,80,0.12,0.1*att);});
  if(kinds.has('plant'))sfx('Plants torn',()=>noise(0.25,0.15*att,2600,'bandpass'));
  if(kinds.has('fabric'))sfx('Fabric tears',()=>noise(0.22,0.2*att,1700,'bandpass'));
  if(n>=6)addShake(Math.min(0.35,0.05*n),sx,sz,18);
}
// blocks too soft or brittle to stop a falling hippo
const SOFT=new Set([LEAVES,FLOWER,GLASS,WIN_BLUE,WIN_GREEN,WIN_WARM,AWN_R,AWN_G,CRATE,SHELF,SOFA,BED,SCREEN,LAMP,NEON_G,NEON_M,NEON_B,NEON_R]);
// break only the soft blocks among these cells (same effects, saving and collapse checks as crush)
function smashSoftCells(list,opt){
  const ch=new Set(),broken=[];
  for(const [bx,by,bz] of list){
    if(by<1||by>=H)continue;const b=get(bx,by,bz);if(!SOFT.has(b))continue;
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    chNear(ch,bx,bz);
  }
  if(broken.length){rebuildSet(ch);save();destroyFX(broken,opt);settle(broken,opt);pumpsHit(broken);}
  return broken.length;
}
// is the layer the hippo would land on all soft? then smash through it (and the soft stuff right around the body)
function smashSoftUnder(p,g){
  const y=Math.floor(g-1),s=Math.sin(p.heading),c=Math.cos(p.heading),cells=new Map();
  let soft=0;
  for(const [a,b] of ptsOf(p)){
    const x=Math.floor(p.pos.x+a*c+b*s),z=Math.floor(p.pos.z-a*s+b*c),blk=get(x,y,z);
    if(blk===AIR||WET[blk])continue;
    if(!SOFT.has(blk))return false;   // something solid under a foot: land on it
    soft++;
  }
  if(!soft)return false;
  const cx=Math.floor(p.pos.x),cz=Math.floor(p.pos.z);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const yy of [y,y+1])cells.set((cx+dx)+','+yy+','+(cz+dz),[cx+dx,yy,cz+dz]);
  const n=smashSoftCells([...cells.values()],{force:1.1,up:0.6});
  if(n){p.vy=p.state==='pound'?p.vy:p.vy*0.92;thud(0.15);rumble(p,0.25,60);}
  return n>0;
}
// trampling's block-breaking zone: the same round area in front of the hippo that tramples goblins (radius R), from
// his feet up through his body (h blocks); ramps underfoot are left alone so he can still run up and down them
// (the chunks to redraw for a block gone at bx,bz: its own, and any it's on the edge of, corners too. One to four of them,
// rather than nine looked up for every block)
function chNear(ch,bx,bz){
  const a=Math.floor((bx-1)/CS),b=Math.floor((bx+1)/CS),c=Math.floor((bz-1)/CS),d=Math.floor((bz+1)/CS);
  ch.add(ckey(a,c));if(b!==a)ch.add(ckey(b,c));if(d!==c){ch.add(ckey(a,d));if(b!==a)ch.add(ckey(b,d));}
}
function crushDisc(x,y,z,R,h,opt={}){
  if(shipN&&x<SHIP_X0)shipSmash(x,y,z,R,opt,(X,Y,Z,o)=>crushDisc(X,Y,Z,R,h,o));   // (a ship there: see ships.js)
  const o={force:opt.force||1,dx:opt.dx||0,dz:opt.dz||0,up:opt.up||1},y0=Math.floor(y+0.05);
  dbgHit('block','cyl',{x,y:y0,z,r:R,h});
  const SC=SBX?[]:null;   // (in the Dev tab's sandbox: just list the blocks it would take)
  if(!SC&&y0<G+7)knockFixtures(x,z,R+0.5,o.dx,o.dz);
  if(!SC)knockProps(x,y0,z,R+0.5,o.dx,o.dz);
  const ch=new Set(),broken=[],Ri=Math.ceil(R)+1;
  for(let dy=0;dy<h;dy++)for(let dz=-Ri;dz<=Ri;dz++)for(let dx=-Ri;dx<=Ri;dx++){
    const bx=Math.floor(x)+dx,by=y0+dy,bz=Math.floor(z)+dz;if(by<1||by>=H)continue;
    {const nx=Math.max(bx,Math.min(bx+1,x))-x,nz=Math.max(bz,Math.min(bz+1,z))-z;if(nx*nx+nz*nz>R*R)continue;}   // any block the circle reaches into
    if(SC){SC.push(bx,by,bz);continue;}
    const b=get(bx,by,bz);if(b===AIR||WET[b]||b===BEDROCK||BLOCK[b].ramp&&!BLOCK[b].stair)continue;
    {const ab=BLOCK[get(bx,by+1,bz)];if(ab&&ab.ramp&&!ab.stair)continue;}   // (nor what a ramp rests on: without it his feet lose the slope at every block)
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    chNear(ch,bx,bz);
  }
  if(SC){sbxCells(SC);return 0;}
  if(broken.length){rebuildSet(ch);save();destroyFX(broken,o);settle(broken,o);pumpsHit(broken);}
  return broken.length;
}
// a smash of a chosen shape: a ball of radius R; a cube R either side; or a cone from the hit point out 2R along the
// facing (hx,hz), opening at 35 degrees
function crushShape(shape,x,y,z,R,hx,hz,opt={}){
  if(shipN&&x<SHIP_X0)shipSmash(x,y,z,R*2,opt,(X,Y,Z,o,a)=>{const c=Math.cos(a),s=Math.sin(a);crushShape(shape,X,Y,Z,R,hx*c+hz*s,-hx*s+hz*c,o);});
  const o={force:opt.force||1,dx:opt.dx||0,dz:opt.dz||0,up:opt.up||1},L=opt.len||2*R,CT=opt.ct||0.7,hl=Math.hypot(hx,hz)||1,ux=hx/hl,uz=hz/hl;
  if(shape==='sphere')dbgHit('block','sph',{x,y,z,r:R});
  else if(shape==='semi')dbgHit('block','cap',{x,y,z,r:R,dn:0,up:R});
  else if(shape==='cube')dbgHit('block','box',{x,y:y-R,z,sx:2*R,sy:2*R,sz:2*R});
  else dbgHit('block','cone',{x,y,z,len:L,r:L*CT,rot:Math.atan2(ux,uz)});
  const SC=SBX?[]:null;   // (in the Dev tab's sandbox: just list the blocks it would take)
  if(!SC&&y-R<G+7)knockFixtures(x,z,R+0.9,o.dx,o.dz);
  if(!SC)knockProps(x,y,z,R+0.9,o.dx,o.dz);
  const ch=new Set(),broken=[],E=Math.ceil(shape==='cone'?L:R)+1;   // (a semi-sphere just leaves the lower half out)
  for(let by=Math.floor(y-E);by<=Math.floor(y+E);by++)for(let bz=Math.floor(z-E);bz<=Math.floor(z+E);bz++)for(let bx=Math.floor(x-E);bx<=Math.floor(x+E);bx++){
    if(by<1||by>=H)continue;const cx=bx+0.5-x,cy=by+0.5-y,cz=bz+0.5-z;
    if(shape==='sphere'){if(cx*cx+cy*cy+cz*cz>R*R+0.25)continue;}
    else if(shape==='semi'){if(cy<-0.5||cx*cx+cy*cy+cz*cz>R*R+0.25)continue;}   // (only blocks whose middle is at or above the flat side)
    else if(shape==='cube'){if(Math.abs(cx)>R+0.01||Math.abs(cy)>R+0.01||Math.abs(cz)>R+0.01)continue;}
    else{const a=cx*ux+cz*uz;if(a<-0.5||a>L)continue;const pr=Math.sqrt(Math.max(0,cx*cx+cy*cy+cz*cz-a*a));if(pr>Math.max(0,a)*CT+0.6)continue;}
    if(SC){SC.push(bx,by,bz);continue;}
    const b=get(bx,by,bz);if(b===AIR||WET[b]||b===BEDROCK)continue;
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    chNear(ch,bx,bz);
  }
  if(SC){sbxCells(SC);return 0;}
  if(broken.length){rebuildSet(ch);save();destroyFX(broken.slice(0,120),o);settle(broken,o);pumpsHit(broken);}
  return broken.length;
}
function crush(x,y,z,r,d0,d1,opt={}){
  if(shipN&&x<SHIP_X0)shipSmash(x,y,z,r+Math.max(Math.abs(d0),Math.abs(d1)),opt,(X,Y,Z,o)=>crush(X,Y,Z,r,d0,d1,o));
  const o={force:opt.force||1,dx:opt.dx||0,dz:opt.dz||0,up:opt.up||1};
  dbgHit('block','box',{x:Math.floor(x)+0.5,y:Math.floor(y)+d0,z:Math.floor(z)+0.5,sx:2*r+1,sy:d1-d0+1,sz:2*r+1});
  const SC=SBX?[]:null;   // (in the Dev tab's sandbox: just list the blocks it would take)
  if(!SC&&y+d0<G+7)knockFixtures(x,z,r+0.9,o.dx,o.dz);
  if(!SC)knockProps(x,y+d0,z,r+0.9,o.dx,o.dz);
  const x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),ch=new Set(),broken=[];
  const RR=opt.round?opt.round*opt.round:0;   // (opt.round: round in plan, this radius, instead of square)
  for(let dy=d0;dy<=d1;dy++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
    const bx=x0+dx,by=y0+dy,bz=z0+dz;
    if(by<1||by>=H)continue;
    if(RR&&dx*dx+dz*dz>RR)continue;
    if(SC){SC.push(bx,by,bz);continue;}
    const b=get(bx,by,bz);if(b===AIR||WET[b]||b===BEDROCK)continue;
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    chNear(ch,bx,bz);
  }
  if(SC){sbxCells(SC);return 0;}
  if(broken.length){rebuildSet(ch);save();destroyFX(broken,o);settle(broken,o);pumpsHit(broken);}
  return broken.length;
}

