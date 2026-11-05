// ---- far city: past the smashable voxel range every building is one box, with window rows that light up at night ----
const MESHED_TEX=new THREE.DataTexture(MESHED,256,256,THREE.RGBAFormat);MESHED_TEX.magFilter=MESHED_TEX.minFilter=THREE.NearestFilter;MESHED_TEX.needsUpdate=true;
const FAR_FRAG=[
  ' float dR=min(length(vWP.xz-uCamP.xy),length(vWP.xz-uCamP.zw));if(dR<uRing.x||dR>=uRing.y)discard;',
  ' vec2 chk=floor(vWP.xz/16.0);',
  ' if(texture2D(uMeshed,(mod(chk,256.0)+0.5)/256.0).r>0.5)discard;',
  ' vec3 base=vCol*uLight;',
  ' float win=(1.0-step(0.5,vNY))*step(0.45,fract((vWP.x+vWP.z)*0.5))*step(0.35,fract((vWP.y-5.0)/5.0))*uWin;',
  ' float hh=fract(sin(dot(floor(vec3((vWP.x+vWP.z)*0.5,(vWP.y-5.0)/5.0,0.0)),vec3(12.9898,78.233,37.719)))*43758.5453);',
  ' base=mix(base,base*0.62+vec3(0.03,0.05,0.08)*uLight,win*0.7);',
  ' base+=win*step(0.42,hh)*uNightK*vec3(1.0,0.78,0.42)*0.85;',
  ' diffuseColor.rgb=base;'].join('\n');
const FAR_CAMP={value:new THREE.Vector4(0,0,0,0)};
// (the horizon test, per box: a box wholly over the horizon is pushed out of view, so none of it is drawn)
const FAR_HORIZ=[
  ' if(uWorldCurve>0.0){float hc=uHoriz.y-uHoriz.w;vec3 ic=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;',
  '  float hx=0.71*max(length(instanceMatrix[0].xyz),length(instanceMatrix[2].xyz)),d=length(ic.xz-uHoriz.xz),dn=d-hx;',
  '  if(hc>0.0&&dn>sqrt(hc/uWorldCurve)){float Y=ic.y+0.5*length(instanceMatrix[1].xyz)-uHoriz.y,df=d+hx;',
  '   float f=max(Y/dn-uWorldCurve*dn,Y/df-uWorldCurve*df);',
  '   if(Y<0.0){float sm=sqrt(-Y/uWorldCurve);if(sm>dn&&sm<df)f=max(f,-2.0*sqrt(-Y*uWorldCurve));}',
  '   if(f<-2.0*sqrt(hc*uWorldCurve)-1e-4)gl_Position=vec4(2.0,2.0,2.0,1.0);}}'].join('\n');
function farPatch(mat,win,ring){
  const U={uLight:WORLD_LIGHT,uNightK:skyU.uNight,uMeshed:{value:MESHED_TEX},uWin:{value:win},uRing:ring,uCamP:FAR_CAMP,uHoriz:HORIZ_U};
  mat.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute vec3 aCol;varying vec3 vCol;varying vec3 vWP;varying float vNY;uniform vec4 uHoriz;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vCol=aCol;vNY=abs(normal.y);\n#ifdef USE_INSTANCING\n vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;\n'+FAR_HORIZ+'\n#else\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;\n#endif');
    sh.fragmentShader='uniform vec3 uLight;uniform float uNightK,uWin;uniform sampler2D uMeshed;uniform vec2 uRing;uniform vec4 uCamP;varying vec3 vCol;varying vec3 vWP;varying float vNY;\n'+sh.fragmentShader.replace('#include <color_fragment>',FAR_FRAG);
  };
  return mat;
}
function farInst(cap,win,ring){
  const g=new THREE.BoxGeometry(1,1,1),col=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);g.setAttribute('aCol',col);
  const m=new THREE.InstancedMesh(g,farPatch(new THREE.MeshBasicMaterial({color:0xffffff}),win,ring),cap);m.count=0;m.frustumCulled=false;scene.add(m);
  return{m,col,cap,n:0,win,ring};
}
// ---- far city, in three rings (levels of detail). Each ring is a pair of instanced box meshes (buildings with
// windows, and flat ground), built around the players by a job that runs a few milliseconds a frame and swaps in when
// it's done; each ring's shader only draws its own band of distance from the nearest player, so neighbouring rings
// meet cleanly however far apart their builds were made.
//  near ring (to ~480 past the full-detail city): every building, stepped towers, highways, cloverleaves, bridges;
//    rebuilt every 24 blocks you move (and when something falls down)
//  middle ring (the next ~1600): one plain box per building, highways; rebuilt every 192 blocks
//  far ring (out to the horizon): one box per town block, its height guessed from what the block is (no buildings
//    worked out at all); rebuilt every 768 blocks ----
const _fc=new THREE.Color(),_fc2=new THREE.Color();
const topColor=b=>{const t=BLOCK[b].tiles[0];return tileColor[t]!==undefined?tileColor[t]:0x888888;};
const FARC={sea:new THREE.Color(topColor(WATER)),deep:new THREE.Color(topColor(WATER)).multiplyScalar(0.62),sand:new THREE.Color(topColor(SAND)),con:new THREE.Color(topColor(CONCRETE)),side:new THREE.Color(topColor(SIDEWALK)),park:new THREE.Color(topColor(GRASS)),plaza:new THREE.Color(topColor(CONCRETE)),road:new THREE.Color(topColor(ASPHALT))};
// staging buffers: a job writes boxes here; they're copied into the ring's meshes when it finishes
const farStage=()=>({mat:new Float32Array(16*2048),col:new Float32Array(3*2048),n:0});
function farBox(F,x0,y0,z0,x1,y1,z1,c){
  if((F.n+1)*16>F.mat.length){const m=new Float32Array(F.mat.length*2);m.set(F.mat);F.mat=m;const q=new Float32Array(F.col.length*2);q.set(F.col);F.col=q;}
  const o=F.n*16,m=F.mat;m.fill(0,o,o+16);m[o]=x1-x0;m[o+5]=y1-y0;m[o+10]=z1-z0;m[o+12]=(x0+x1)/2;m[o+13]=(y0+y1)/2;m[o+14]=(z0+z1)/2;m[o+15]=1;
  F.col[F.n*3]=c.r;F.col[F.n*3+1]=c.g;F.col[F.n*3+2]=c.b;F.n++;
}
// the far view of a block of the sea and its shore: n x n patches of water, beach, grass, or a port's concrete
function farSea(SG,px,pz,n){
  const t=plotType(px,pz),st=CELL/n,X0=px*CELL,Z0=pz*CELL;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=X0+i*st,z=Z0+j*st;
    if(t==='yard'||t==='navy'){farBox(SG,x,G+0.4,z,x+st,G+1,z+st,FARC.con);continue;}
    const q=t==='basin'||t==='nbasin'||n===1&&seaPlot(px,pz)===2?1:seaBlk(x+st/2,z+st/2);
    if(q>=SEA_T)farBox(SG,x,G+0.4,z,x+st,G+0.95,z+st,n<=2&&seaPlot(px,pz)===2?FARC.deep:FARC.sea);
    else if(n>1&&coastD(x+st/2,z+st/2)>-8)farBox(SG,x,G+0.4,z,x+st,G+1,z+st,FARC.sand);
    else farBox(SG,x,G+0.4,z,x+st,G+1.6,z+st,FARC.park);}
}
// the far view of one plains block: the rivers and highways crossing it, as boxes along their lines (each piece drawn
// by the block its middle falls in, every third piece standing for three)
const _fw=new THREE.Color();
function farLinesPlot(SB,SG,px,pz){
  const X0=px*CELL,Z0=pz*CELL,X1=X0+CELL,Z1=Z0+CELL,inP=(x,z)=>x>=X0&&x<X1&&z>=Z0&&z<Z1;
  const seg=(F,R,i,w,y0,y1,c)=>{const j=Math.min(i+3,R.pts.length-1),[ax,az]=R.pts[i],[bx,bz]=R.pts[j];if(!inP((ax+bx)/2,(az+bz)/2))return;
    farBox(F,Math.min(ax,bx)-w,y0,Math.min(az,bz)-w,Math.max(ax,bx)+w,y1,Math.max(az,bz)+w,c);};
  {const L=riversNearBox(X0,Z0,X1-1,Z1-1);_fw.setHex(blockColor(WATER));for(let q=0;q<L.length;q+=2)if(L[q+1]%3===0)seg(SG,L[q],L[q+1],RIV_W*0.8,G+0.45,G+1.64,_fw);}
  {const L=routesNearBox(X0,Z0,X1-1,Z1-1);for(let q=0;q<L.length;q+=2){if(L[q+1]%3)continue;const R=L[q];
    // (a motorway's ramps up into town, as far off as anywhere)
    const rp=R.kind==='moto'&&rtRamp(R,R.cum[L[q+1]]+1.5),yt=rp?rtSurfY(R,R.cum[L[q+1]]+1.5):G+1.66;
    seg(rp?SB:SG,R,L[q+1],6,rp?yt-1.2:G+0.45,yt,FARC.road);}}
}
function farGrow(F,cap){if(cap<=F.cap)return;scene.remove(F.m);F.m.geometry.dispose();F.m.material.dispose();const N=farInst(cap,F.win,F.ring);scene.remove(N.m);F.m=N.m;F.col=N.col;F.cap=cap;scene.add(F.m);}
function mkLod(step,mk){const ring={value:new THREE.Vector2(0,0)};return{B:farInst(2048,1,ring),G:farInst(1024,0,ring),ring,sb:farStage(),sg:farStage(),step,mk,job:null,cx:1e9,cz:1e9,key:-1,coll:-1,collT:0};}
// the near ring: everything (as the single far city used to be)
function* farJobNear(SB,SG,act,ra,rb){
  if(TENV){const p0=act[0];farBox(SG,p0.pos.x-rb-64,G+0.3,p0.pos.z-rb-64,p0.pos.x+rb+64,G+0.4,p0.pos.z+rb+64,FARC.park);return;}   // (the Testing Environment: grass to the horizon)
  {const p0=act[0];farBox(SG,p0.pos.x-rb-64,G+0.3,p0.pos.z-rb-64,p0.pos.x+rb+64,G+0.4,p0.pos.z+rb+64,FARC.road);}  // road-coloured floor
    const seen=new Set();
    for(const p of act)for(let px=Math.floor((p.pos.x-rb)/CELL);px<=Math.floor((p.pos.x+rb)/CELL);px++){yield;for(let pz=Math.floor((p.pos.z-rb)/CELL);pz<=Math.floor((p.pos.z+rb)/CELL);pz++){
      const k=px*100003+pz;if(seen.has(k))continue;
      const d=Math.hypot(px*CELL+CELL/2-p.pos.x,pz*CELL+CELL/2-p.pos.z);
      if(d>rb+CELL||d<ra-CELL*1.5)continue;   // outside this ring
      seen.add(k);
      const P=plotInfo(px,pz),X0=px*CELL,Z0=pz*CELL;
      if(seaPlot(px,pz))farSea(SG,px,pz,4);
      else if(biomeOf(px,pz)==='plains'){farBox(SG,X0,G+0.4,Z0,X0+CELL,G+1.6,Z0+CELL,FARC.park);farLinesPlot(SB,SG,px,pz);if(turbineAt(px,pz))farTurbine(SB,px,pz,1);}   // the plains: all grass (hills are only drawn up close), and what crosses them
      else farBox(SG,X0+ROADW,G+0.4,Z0+ROADW,X0+CELL,G+0.97,Z0+CELL,P.type==='park'?FARC.park:P.type==='plaza'?FARC.plaza:FARC.side);
      if(hwRow(pz,px)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
      if(hwCol(px,pz)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
      {const cv=cloverOf(px,pz);if(cv){_fc.setHex(blockColor(CONCRETE));const cx=cv.j*CELL+4,cz=cv.k*CELL+4;
        for(let n=0;n<4;n++){const ev=n%2===0,hA=ev?HY_X:HY_Z,hB=ev?HY_Z:HY_X;for(const o of CLV){if(o.t!=='deck'&&o.t!=='slope')continue;
          const [a0,b0]=cvRot(n,o.p0,o.q0),[a1,b1]=cvRot(n,o.p1,o.q1),x0=Math.max(X0,cx+Math.min(a0,a1)),x1=Math.min(X0+CELL,cx+Math.max(a0,a1)),z0=Math.max(Z0,cz+Math.min(b0,b1)),z1=Math.min(Z0+CELL,cz+Math.max(b0,b1));
          if(x1<=x0||z1<=z0)continue;const h=o.t==='deck'?(o.h==='A'?hA:hB):(hA+hB)/2;farBox(SB,x0,h-1,z0,x1,h+1,z1,_fc);}}}}
      P.b.forEach((b,bi)=>{
        if(b.farSkip)return;
        const cap=collapses[px+','+pz+','+bi];let top=b.top;if(cap!==undefined)top=Math.min(top,cap-1);if(top<=G)return;
        _fc.setHex(blockColor(b.wall)).lerp(_fc2.setHex(blockColor(b.win)),0.3);
        if(b.tier>0&&(b.x1-b.x0)>=8){
          farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,Math.min(top,b.tier)+1,Z0+b.z1,_fc);
          if(top>b.tier)farBox(SB,X0+b.x0+2,b.tier+1,Z0+b.z0+2,X0+b.x1-2,top+1,Z0+b.z1-2,_fc);
        } else farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,top+1+(b.roof||0)*0.6,Z0+b.z1,_fc);
      });
      if(P.super&&P.super.kind==='capitol'&&px===P.super.ax&&pz===P.super.az&&collapses[px+','+pz+',0']===undefined){
        const g=capGeo(),sx=X0+PL0,sz=Z0+PL0;_fc.setHex(blockColor(HOSPW));
        farBox(SG,sx,G+0.97,sz,sx+g.W,G+1.02,sz+g.L,FARC.park);
        farBox(SB,sx+g.px0,G+1,sz+g.bf,sx+g.px1,G+24,sz+g.back,_fc);
        farBox(SB,sx+g.px0,G+1,sz+g.pz0,sx+g.px1,G+4,sz+g.bf,_fc);
        farBox(SB,sx+g.c-16,G+24,sz+g.bf,sx+g.c+16,G+29,sz+g.bf+32,_fc);
        farBox(SB,sx+g.c-12,G+29,sz+g.dc-12,sx+g.c+12,G+42,sz+g.dc+12,_fc);
        farBox(SB,sx+g.c-7,G+42,sz+g.dc-7,sx+g.c+7,G+48,sz+g.dc+7,_fc);
        farBox(SB,sx+g.c-1,G+48,sz+g.dc-1,sx+g.c+1,G+60,sz+g.dc+1,_fc);
      }
      if(P.super&&P.super.kind==='bigpark'&&px===P.super.ax&&pz===P.super.az){
        const SS=P.super;farBox(SG,X0+PL0,G+0.97,Z0+PL0,X0+(SS.w-1)*CELL+PL1,G+1.02,Z0+(SS.h-1)*CELL+PL1,FARC.park);
      }
      if(P.super&&P.super.kind==='stadium'&&px===P.super.ax&&pz===P.super.az){
        const SS=P.super,sx=X0+PL0,sz=Z0+PL0,W=(SS.w-1)*CELL+PW,L=(SS.h-1)*CELL+PW,F=stadiumField(W,L),o=STAND+2;
        const x0=sx+F.fx0-o,x1=sx+F.fx0+F.fw+o,z0=sz+F.fz0-o,z1=sz+F.fz0+F.fh+o,y1=G+STAND+5;_fc.setHex(blockColor(CONCRETE));
        farBox(SB,x0,G+1,z0,x1,y1,z0+o,_fc);farBox(SB,x0,G+1,z1-o,x1,y1,z1,_fc);
        farBox(SB,x0,G+1,z0+o,x0+o,y1,z1-o,_fc);farBox(SB,x1-o,G+1,z0+o,x1,y1,z1-o,_fc);
        farBox(SG,sx+F.fx0,G+0.97,sz+F.fz0,sx+F.fx0+F.fw,G+1.02,sz+F.fz0+F.fh,FARC.park);
      }
      for(const ax of[0,1]){const br=bridgeOf(px,pz,ax);if(!br)continue;_fc.setHex(blockColor(br.wall));
        if(ax)farBox(SB,br.c0,br.y0,br.s0,br.c1,br.y1+1,br.s1,_fc);else farBox(SB,br.s0,br.y0,br.c0,br.s1,br.y1+1,br.c1,_fc);}
    }}
}
// the middle ring: a plain box per building
function* farJobMid(SB,SG,act,ra,rb){
  if(TENV){const p0=act[0];farBox(SG,p0.pos.x-rb-64,G+0.3,p0.pos.z-rb-64,p0.pos.x+rb+64,G+0.4,p0.pos.z+rb+64,FARC.park);return;}
  {const p0=act[0];farBox(SG,p0.pos.x-rb-64,G+0.3,p0.pos.z-rb-64,p0.pos.x+rb+64,G+0.4,p0.pos.z+rb+64,FARC.road);}
  const seen=new Set();
  for(const p of act)for(let px=Math.floor((p.pos.x-rb)/CELL);px<=Math.floor((p.pos.x+rb)/CELL);px++){yield;for(let pz=Math.floor((p.pos.z-rb)/CELL);pz<=Math.floor((p.pos.z+rb)/CELL);pz++){
    const k=px*100003+pz;if(seen.has(k))continue;
    const d=Math.hypot(px*CELL+CELL/2-p.pos.x,pz*CELL+CELL/2-p.pos.z);if(d>rb+CELL||d<ra-CELL)continue;seen.add(k);
    const X0=px*CELL,Z0=pz*CELL;
    if(seaPlot(px,pz)){farSea(SG,px,pz,2);continue;}
    if(biomeOf(px,pz)==='plains'){farBox(SG,X0,G+0.4,Z0,X0+CELL,G+1.6,Z0+CELL,FARC.park);farLinesPlot(SB,SG,px,pz);if(turbineAt(px,pz))farTurbine(SB,px,pz,1.6);
      if(hwRow(pz,px)&&!hwGround('x',pz,X0+16)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
      if(hwCol(px,pz)&&!hwGround('z',px,Z0+16)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
      continue;}
    const P=plotInfo(px,pz);
    farBox(SG,X0+ROADW,G+0.4,Z0+ROADW,X0+CELL,G+0.97,Z0+CELL,P.type==='park'?FARC.park:P.type==='plaza'?FARC.plaza:FARC.side);
    if(hwRow(pz,px)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
    if(hwCol(px,pz)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
    P.b.forEach((b,bi)=>{if(b.farSkip||b.x1-b.x0<3||b.z1-b.z0<3)return;
      const cap=collapses[px+','+pz+','+bi];let top=b.top;if(cap!==undefined)top=Math.min(top,cap-1);if(top<=G)return;
      _fc.setHex(blockColor(b.wall)).lerp(_fc2.setHex(blockColor(b.win)),0.3);
      farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,(b.tier>0&&top>b.tier?(b.tier+top)/2:top)+1,Z0+b.z1,_fc);});
    if(P.super&&P.super.kind==='capitol'&&px===P.super.ax&&pz===P.super.az&&collapses[px+','+pz+',0']===undefined){
      const g=capGeo(),sx=X0+PL0,sz=Z0+PL0;_fc.setHex(blockColor(HOSPW));
      farBox(SB,sx+g.px0,G+1,sz+g.bf,sx+g.px1,G+24,sz+g.back,_fc);farBox(SB,sx+g.c-12,G+24,sz+g.dc-12,sx+g.c+12,G+44,sz+g.dc+12,_fc);}
    if(P.super&&P.super.kind==='stadium'&&px===P.super.ax&&pz===P.super.az){
      const SS=P.super,sx=X0+PL0,sz=Z0+PL0,W=(SS.w-1)*CELL+PW,L=(SS.h-1)*CELL+PW;_fc.setHex(blockColor(CONCRETE));
      farBox(SB,sx,G+1,sz,sx+W,G+STAND+5,sz+L,_fc);}
  }}
}
// the far ring: one box per town block, from the cheap per-block guesses (no plots worked out)
const FAR3_WALLS=[BRICK,CONCRETE,SIDING,STUCCO,GLASS,PAINT_WHITE].map(b=>new THREE.Color(blockColor(b)).lerp(new THREE.Color(blockColor(GLASS)),0.25));
function* farJobFar(SB,SG,act,ra,rb){
  if(TENV){const p0=act[0];farBox(SG,p0.pos.x-rb-128,G+0.3,p0.pos.z-rb-128,p0.pos.x+rb+128,G+0.4,p0.pos.z+rb+128,FARC.park);return;}
  {const p0=act[0];farBox(SG,p0.pos.x-rb-128,G+0.3,p0.pos.z-rb-128,p0.pos.x+rb+128,G+0.4,p0.pos.z+rb+128,FARC.park);}   // (out here it's mostly fields)
  const seen=new Set(),C4=4*CELL;
  for(const p of act)for(let qx=Math.floor((p.pos.x-rb)/C4);qx<=Math.floor((p.pos.x+rb)/C4);qx++){yield;for(let qz=Math.floor((p.pos.z-rb)/C4);qz<=Math.floor((p.pos.z+rb)/C4);qz++){
    const k=qx*100003+qz;if(seen.has(k))continue;
    const d=Math.hypot(qx*C4+C4/2-p.pos.x,qz*C4+C4/2-p.pos.z);if(d>rb+C4||d<ra-C4)continue;seen.add(k);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const px=qx*4+i,pz=qz*4+j,X0=px*CELL,Z0=pz*CELL;
      if(seaPlot(px,pz)){farSea(SG,px,pz,1);continue;}
      const ty=setType(px,pz);if(!ty){if(turbineAt(px,pz))farTurbine(SB,px,pz,2.6);continue;}
      farBox(SG,X0,G+0.45,Z0,X0+CELL,G+0.97,Z0+CELL,FARC.side);
      if(hwRow(pz,px)&&!hwGround('x',pz,X0+16)){_fc.setHex(blockColor(CONCRETE));farBox(SB,X0,HY_X-1,Z0-3,X0+CELL,HY_X+2,Z0+11,_fc);}
      if(hwCol(px,pz)&&!hwGround('z',px,Z0+16)){_fc.setHex(blockColor(CONCRETE));farBox(SB,X0-3,HY_Z-1,Z0,X0+11,HY_Z+2,Z0+CELL,_fc);}
      const t=baseType(px,pz),h=hash2(px*41+7,pz*37+3);let top=0,inset=0;
      if(t==='tower')top=30+h*60;else if(t==='mid')top=12+h*16;else if(t==='homes'){top=6+h*3;inset=3;}
      else if(t==='park'||t==='plaza')continue;else top=6+h*6;
      farBox(SB,X0+PL0+inset,G+1,Z0+PL0+inset,X0+PL1-inset,G+1+top,Z0+PL1-inset,FAR3_WALLS[Math.floor(hash2(px*13+1,pz*19+5)*FAR3_WALLS.length)]);}
  }}
}
// a wind turbine in the distance: its tower, the nacelle, and the three blades held still (each a short run of boxes
// along the blade, since a box can't lean); k thickens it all the further off it is, so it still reads as a line
function farTurbine(SB,px,pz,k=1){
  const X=px*CELL,Z=pz*CELL,w=Math.max(1,0.9*k);_fc.setHex(0xf2f4f4);
  farBox(SB,X+16-w,G+1,Z+16-w,X+16+w,G+41,Z+16+w,_fc);                         // the tower
  farBox(SB,X+16-w,G+41,Z+13,X+16+w,G+43,Z+20,_fc);                             // the nacelle
  const cx=X+16,cy=G+42,cz=Z+12.6,N=6,L=18,t=0.35*k;
  for(let b=0;b<3;b++){const a=Math.PI/2+b*Math.PI*2/3,dx=Math.cos(a),dy=Math.sin(a);
    for(let s=0;s<N;s++){const t0=1+s*L/N,t1=t0+L/N,mx=cx+dx*(t0+t1)/2,my=cy+dy*(t0+t1)/2,hw=Math.abs(dx)*(t1-t0)/2+t,hh=Math.abs(dy)*(t1-t0)/2+t;
      farBox(SB,mx-hw,my-hh,cz-0.3*k,mx+hw,my+hh,cz+0.3*k,_fc);}}
}
const LODS=[mkLod(24,farJobNear),mkLod(192,farJobMid),mkLod(768,farJobFar)];
// the job's boxes go into the ring's meshes (grown if they need to be)
function farCommit(L){
  for(const [F,S] of [[L.B,L.sb],[L.G,L.sg]]){
    if(S.n>F.cap)farGrow(F,Math.ceil(S.n*1.25/1024)*1024);
    F.m.instanceMatrix.array.set(S.mat.subarray(0,S.n*16));F.col.array.set(S.col.subarray(0,S.n*3));
    F.m.count=S.n;F.m.instanceMatrix.needsUpdate=true;F.col.needsUpdate=true;}
}
let farDirty=true,farT=0;
const FAR_BUDGET=4;   // milliseconds a frame for building the far rings
function updateFar(dt){
  if(meshedDirty){MESHED_TEX.needsUpdate=true;meshedDirty=false;}
  const act=players.filter(q=>q.active);if(!act.length)return;
  {const a=act[0].pos,b=(act[1]||act[0]).pos;FAR_CAMP.value.set(a.x,a.z,b.x,b.z);}
  // where each ring starts and ends (it's nothing at all if you can't see past the full-detail city)
  const near=viewR*CS,R=lodFar(),on=R>near+8,b1=Math.min(R,near+480),b2=Math.min(R,b1+1600);
  const edges=on?[[0,b1],[b1,b2],[b2,R+64]]:[[0,0],[0,0],[0,0]];
  LODS.forEach((L,i)=>L.ring.value.set(edges[i][0],edges[i][1]));
  // start (or restart) a ring's build when you've moved far enough from where it was last built, the settings change,
  // or (nearer rings) something has fallen down
  farT-=dt;
  if(farT<=0||farDirty){farT=0.25;
    const key=Math.round(R)*100+viewR,nColl=Object.keys(collapses).length,p=act[0].pos,dirty=farDirty;farDirty=false;
    LODS.forEach((L,i)=>{
      const [r0,r1]=edges[i];L.collT-=0.25;
      const moved=Math.hypot(p.x-L.cx,p.z-L.cz)>L.step,collCh=i<2&&nColl!==L.coll&&L.collT<=0;
      if(!(dirty||moved||key!==L.key||collCh))return;
      if(!on||r1<=r0){L.job=null;L.sb.n=0;L.sg.n=0;farCommit(L);L.key=key;L.cx=p.x;L.cz=p.z;return;}
      // built with a margin round its ring, so it still covers the ring as you move until the next build
      const m=L.step+(i===2?256:64);
      L.sb.n=0;L.sg.n=0;L.job=L.mk(L.sb,L.sg,act.map(q=>({pos:q.pos.clone()})),Math.max(0,r0-m),r1+m);
      L.cx=p.x;L.cz=p.z;L.key=key;L.coll=nColl;if(collCh)L.collT=i?4:0;
    });
  }
  // run the builds, nearest ring first, for a few milliseconds
  const t0=performance.now();
  for(const L of LODS){while(L.job&&performance.now()-t0<FAR_BUDGET){const r=L.job.next();if(r.done){L.job=null;farCommit(L);}}}
  // stretch the cloud deck to cover the whole view
  // (bent down, the decks must reach on round past the horizon, down to where the world's edge drops out of sight)
  {const s=Math.max(1,(lodFar()+120)/300),k=CURVE_U.value,act=players.filter(p=>p.active),cy=act.length?Math.max(...act.map(p=>p.camera.position.y)):G+8;
   const a=k>0?2*Math.sqrt(Math.max(1,cy-(G+1))*k):0;
   for(const L of cloudLayers){let half=300*s*L.D.size;
     if(k>0){const hc=Math.max(1,H+L.D.h-cy);half=Math.max(half,Math.min(20000,(a+Math.sqrt(a*a+4*k*hc))/(2*k)/0.7));}
     L.m.scale.set(half/300,half/300,1);}}
}
