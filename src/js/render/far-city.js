// ---- far city: past the smashable voxel range every building is one box, with window rows that light up at night ----
const MESHED_TEX=new THREE.DataTexture(MESHED,256,256,THREE.RGBAFormat);MESHED_TEX.magFilter=MESHED_TEX.minFilter=THREE.NearestFilter;MESHED_TEX.needsUpdate=true;
// (shaded the way the voxel world is: each face by its direction, as FACES' shade times DIM, so a box comes out as dark as the
// blocks it stands for. A building's top is its roof's colour; its sides are its walls, with the share of glowing windows it
// really has drawn as rows of windows at full brightness, as the real ones are, day and night. The rows cover WP of each side,
// and the walls between are made up so the side's average comes out right whatever the share.)
const FAR_FRAG=[
  ' float dR=min(length(vWP.xz-uCamP.xy),length(vWP.xz-uCamP.zw));if(dR<uRing.x||dR>=uRing.y)discard;',
  ' vec2 chk=floor(vWP.xz/16.0);',
  ' if(texture2D(uMeshed,(mod(chk,256.0)+0.5)/256.0).r>0.5)discard;',
  ' float up=step(0.5,vN.y),dn=step(0.5,-vN.y),side=1.0-up-dn;',
  ' float sh=(up+dn*0.55+side*mix(0.68,0.8,step(0.5,abs(vN.x))))*0.8;',
  ' vec3 c0=mix(vCol,vTop,up);',
  // (grass turns with the seasons as it does up close: the same sums as FOLIAGE_FRAG's for grass, on the box's colour)
  ' if(vWin.a<-0.5&&vWin.a>-1.5){float lum=dot(c0,vec3(0.3,0.59,0.11)),green=clamp((c0.g-max(c0.r,c0.b))*5.0,0.0,1.0);vec4 W=uSeasonW;',
  '  vec3 seas=(c0*vec3(1.03,1.08,0.84)+vec3(0.02,0.025,0.0))*W.x+c0*vec3(0.86,0.97,0.82)*W.y+mix(c0,vec3(0.66,0.6,0.3)*(0.5+lum*1.2),0.55*green)*W.z+mix(c0,vec3(0.5,0.47,0.33)*(0.55+lum),0.75*green)*W.w;',
  '  c0=mix(c0,seas,green);}',
  // (a treetop, -4: its leaves turn and fall with the seasons as the blocks' do (the same colours as FOLIAGE_FRAG's), the
  // whole tree at once, by its own share: vWin.r says when its leaves come down, vWin.g which autumn colour it turns)
  ' if(vWin.a<-3.5&&vWin.a>-4.5){if(vWin.r<uLeafFall)discard;vec4 W=uSeasonW;float lum=dot(c0,vec3(0.3,0.59,0.11)),hT=vWin.g;',
  '  vec3 pal=hT<0.3?vec3(0.95,0.72,0.2):hT<0.6?vec3(0.95,0.48,0.12):hT<0.82?vec3(0.78,0.2,0.1):vec3(0.55,0.36,0.16);',
  '  c0=(c0*vec3(1.03,1.08,0.84)+vec3(0.02,0.025,0.0))*W.x+c0*vec3(0.86,0.97,0.82)*W.y+pal*(0.55+lum*1.4)*W.z+vec3(0.42,0.3,0.18)*(0.6+lum)*W.w;}',
  ' vec3 wall=c0*sh*uLight;',
  // (and weather on the tops, but not the sea's: rain darkens them, snow settles on them, on average as it does on the
  // blocks' tops, where each spot is covered once its own share of the snow comes)
  ' if(up>0.5&&abs(vWin.a+2.0)>0.5){float wkF;float snF=snowHere(vWP,wkF);wall*=1.0-0.3*uWet*wkF*(1.0-snF);float snowL=min(snF,uSnowClk);wall=mix(wall,vec3(0.897,0.909,0.927)*uLight,clamp(snowL*1.12,0.0,1.0)*step(0.002,snowL));}',
  ' const float WP=0.3575;',
  ' float uw=uWin*step(-2.5,vWin.a);',   // (no windows on a box that isn't a building, -3)
  ' float win=side*step(0.45,fract((vWP.x+vWP.z)*0.5))*step(0.35,fract((vWP.y-5.0)/5.0))*uw;',
  ' float f=max(vWin.a,0.0)*side*uw,g=min(1.0,f/WP),gw=max(0.0,(f-WP)/(1.0-WP)),k=mix(1.0,(1.0-0.75*WP-0.25*min(f,WP))/(1.0-WP),side*uw);',
  ' vec3 base=mix(mix(wall*k,vWin.rgb,gw),mix(wall*0.75,vWin.rgb,g),win*step(0.001,uw));',
  ' float hh=fract(sin(dot(floor(vec3((vWP.x+vWP.z)*0.5,(vWP.y-5.0)/5.0,0.0)),vec3(12.9898,78.233,37.719)))*43758.5453);',
  ' base+=win*(1.0-g)*step(0.42,hh)*uNightK*vec3(1.0,0.78,0.42)*0.85;   // (and at night, lights on in the windows that don\'t glow)',
  ' diffuseColor.rgb=base;'].join('\n');
const FAR_CAMP={value:new THREE.Vector4(0,0,0,0)},LEAFFALL_U={value:0};
// (the horizon test, per box: a box wholly over the horizon is pushed out of view, so none of it is drawn)
const FAR_HORIZ=[
  ' if(uWorldCurve>0.0){float hc=uHoriz.y-uHoriz.w;vec3 ic=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;',
  '  float hx=0.71*max(length(instanceMatrix[0].xyz),length(instanceMatrix[2].xyz)),d=length(ic.xz-uHoriz.xz),dn=d-hx;',
  '  if(hc>0.0&&dn>sqrt(hc/uWorldCurve)){float Y=ic.y+0.5*length(instanceMatrix[1].xyz)-uHoriz.y,df=d+hx;',
  '   float f=max(Y/dn-uWorldCurve*dn,Y/df-uWorldCurve*df);',
  '   if(Y<0.0){float sm=sqrt(-Y/uWorldCurve);if(sm>dn&&sm<df)f=max(f,-2.0*sqrt(-Y*uWorldCurve));}',
  '   if(f<-2.0*sqrt(hc*uWorldCurve)-1e-4)gl_Position=vec4(2.0,2.0,2.0,1.0);}}'].join('\n');
function farPatch(mat,win,ring){
  const U={uLight:WORLD_LIGHT,uNightK:skyU.uNight,uMeshed:{value:MESHED_TEX},uWin:{value:win},uRing:ring,uCamP:FAR_CAMP,uHoriz:HORIZ_U,uSeasonW:SEASON_W,uSnow:SNOW_U,uWet:WET_U,uSnowClk:SNOWCLK_U,uSnowB:SNOWB_U,uColdT:COLDT_U,uLeafFall:LEAFFALL_U};
  mat.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute vec3 aCol;attribute vec3 aTop;attribute vec4 aWin;varying vec3 vCol;varying vec3 vTop;varying vec4 vWin;varying vec3 vWP;varying vec3 vN;uniform vec4 uHoriz;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vCol=aCol;vTop=aTop;vWin=aWin;vN=normal;\n#ifdef USE_INSTANCING\n vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;\n'+FAR_HORIZ+'\n#else\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;\n#endif');
    sh.fragmentShader=SNOW_GLSL+'uniform vec3 uLight;uniform vec4 uSeasonW;uniform float uNightK,uWin,uSnow,uWet,uSnowClk,uLeafFall;uniform sampler2D uMeshed;uniform vec2 uRing;uniform vec4 uCamP;varying vec3 vCol;varying vec3 vTop;varying vec4 vWin;varying vec3 vWP;varying vec3 vN;\n'+sh.fragmentShader.replace('#include <color_fragment>',FAR_FRAG);
  };
  return mat;
}
function farInst(cap,win,ring){
  const g=new THREE.BoxGeometry(1,1,1),col=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3),top=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3),wn=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);
  g.setAttribute('aCol',col);g.setAttribute('aTop',top);g.setAttribute('aWin',wn);
  const m=new THREE.InstancedMesh(g,farPatch(new THREE.MeshBasicMaterial({color:0xffffff}),win,ring),cap);m.count=0;m.frustumCulled=false;scene.add(m);
  return{m,col,top,wn,cap,n:0,win,ring};
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
const _fc=new THREE.Color();
const topColor=b=>{const t=BLOCK[b].tiles[0];return tileColor[t]!==undefined?tileColor[t]:0x888888;};
const FARC={sea:new THREE.Color(topColor(WATER)),deep:new THREE.Color(topColor(WATER)).multiplyScalar(0.62),sand:new THREE.Color(topColor(SAND)),con:new THREE.Color(topColor(CONCRETE)),side:new THREE.Color(topColor(SIDEWALK)),park:new THREE.Color(topColor(GRASS)),plaza:new THREE.Color(topColor(CONCRETE)),road:new THREE.Color(topColor(ASPHALT))};
// (a shore's colours by its flavour, coastFlav: shingle, sea ice, the mangroves' mud, red sand)
const FARC_CF=[null,new THREE.Color(topColor(GRAVEL)),new THREE.Color(topColor(PACKICE)),new THREE.Color(topColor(MUD)),new THREE.Color(topColor(RED_SAND))];
// what a building looks like from outside, for its far box: the colour of its walls (glowing windows apart), of its glowing
// windows and how much of the walls they make up, and of its roof. Taken from the very blocks the full-detail city builds it
// from, a hundred and sixty picked at random over its sides and its top (the same ones every time), so a building looks the same
// colour from afar as up close: a dark roof stays dark, a wall of lit windows stays lit. Kept on the building, since it's a
// couple of hundred calls of blockAt (a third of a millisecond: the far rings' jobs stop for breath after each new one). The middle ring,
// where a building is a few pixels across, makes do with a third of the samples.
const _flA=[0,0,0],_flB=[0,0,0],_flC=[0,0,0],_flD=[0,0,0];
function farTile(t,o,k){const h=tileColor[t]!==undefined?tileColor[t]:0x888888;o[0]+=((h>>16)&255)*k;o[1]+=((h>>8)&255)*k;o[2]+=(h&255)*k;}
// (the blocks that are windows: a building none of whose sides' samples is one gets no rows of windows drawn on its far box)
const FAR_WINB=new Set([GLASS,WIN_BLUE,WIN_GREEN,WIN_WARM,STAINED]);
const farAvg=(o,n,dflt)=>n?new THREE.Color(o[0]/n/255,o[1]/n/255,o[2]/n/255):new THREE.Color(dflt);
function farLook(b,px,pz,fine=true){
  if(b._far&&(b._far.fine||!fine))return b._far;
  const NS=fine?128:40,NT=fine?32:12;
  const sv=STRUCT,W=b.x1-b.x0,D=b.z1-b.z0,tierOn=b.tier>0&&W>=8,rf=roofOf(b),hi=b.top+(b.roof||0);
  let sd=Math.floor(hash2(px*73+b.x0*7+b.z1,pz*91+b.z0*5+b.top)*4294967296)>>>0;
  const rnd=()=>{sd=(Math.imul(sd,1664525)+1013904223)>>>0;return sd/4294967296;};
  const wall=_flA,glow=_flB,roof=_flC,roofG=_flD;wall.fill(0);glow.fill(0);roof.fill(0);roofG.fill(0);let nw=0,ng=0,nr=0,nrg=0,nwin=0;
  // the sides: a spot on the outline (a tiered tower's upper part has its own, two in), then in from there to the first
  // block, as it's seen from straight out (the middle ring's fewer samples go on to the full number if they've found no window
  // yet, so a building with only a few isn't taken for one with none)
  for(let n=0;n<(fine||nwin||ng?NS:128);n++){
    const y=G+1+Math.floor(rnd()*(b.top-G)),ins=tierOn&&y>b.tier?2:0,w=W-2*ins,d=D-2*ins;if(w<=0||d<=0)continue;
    let t=rnd()*2*(w+d),rx,rz,dx=0,dz=0;
    if(t<w){rx=b.x0+ins+Math.floor(t);rz=b.z0+ins;dz=1;}
    else if((t-=w)<w){rx=b.x0+ins+Math.floor(t);rz=b.z1-1-ins;dz=-1;}
    else if((t-=w)<d){rz=b.z0+ins+Math.floor(t);rx=b.x0+ins;dx=1;}
    else{rz=b.z0+ins+Math.floor(t-d);rx=b.x1-1-ins;dx=-1;}
    for(let s=0;s<=Math.min(w,d)/2;s++){const v=blockAt(b,rx+dx*s,rz+dz*s,y,px,pz),B=v!==AIR&&BLOCK[v];if(!B||B.hide||B.thin||B.liquid)continue;
      if(FAR_WINB.has(v))nwin++;
      if(B.glow){farTile(B.tiles[2],glow,1);ng++;}else{farTile(B.tiles[2],wall,1);nw++;}break;}
  }
  // the top: the highest block in each of a few columns (whatever's on the roof, or the roof itself)
  for(let n=0;n<NT;n++){
    const rx=b.x0+Math.floor(rnd()*W),rz=b.z0+Math.floor(rnd()*D);let ty=-1,tv=AIR;
    if(rf)roofColumn((y,v)=>{if(v!==AIR&&y>=ty){ty=y;tv=v;}},b,rf,rx,rz);
    for(let y=hi;y>Math.max(G,ty);y--){const v=blockAt(b,rx,rz,y,px,pz);if(v!==AIR&&!BLOCK[v].hide){ty=y;tv=v;break;}}
    if(tv===AIR)continue;const B=BLOCK[tv];if(B.liquid)continue;
    if(B.glow){farTile(B.tiles[0],roofG,1.25);nrg++;}else{farTile(B.tiles[0],roof,1);nr++;}   // (a glowing block isn't shaded: brighter than the top-face shade the box gets)
  }
  // (a neon rim or rows of lamps are thin lines up close, and read as no more than that from afar: the roof's colour is what
  // the rest of it is made of, unless the most of it glows)
  if(nrg>nr){for(let i=0;i<3;i++)roof[i]+=roofG[i];nr+=nrg;}
  STRUCT=sv;
  const c=farAvg(wall,nw,blockColor(b.wall));
  return b._far={fine,wall:c,glow:farAvg(glow,ng,0),f:nwin||ng?ng/Math.max(1,nw+ng):-3,top:farAvg(roof,nr,topColor(ROOF))};
}
// staging buffers: a job writes boxes here; they're copied into the ring's meshes when it finishes
// (each box: its matrix, its colour (the sides), its top's colour, and its glowing windows' colour and share of the sides;
// on a box of ground with no windows, that share says what it is instead: -1 grass, which turns with the seasons, -2 the sea,
// and -3 anything else with no look of its own: a highway, bridge, stadium or wind turbine, which gets no windows. A building
// built from a plain colour that should still have them is given a look, farWinL)
const farStage=()=>({mat:new Float32Array(16*2048),col:new Float32Array(3*2048),top:new Float32Array(3*2048),wn:new Float32Array(4*2048),n:0});
const farGrowArr=(a,n)=>{const q=new Float32Array(n);q.set(a);return q;};
function farBox(F,x0,y0,z0,x1,y1,z1,c,L){
  if((F.n+1)*16>F.mat.length){const N=F.mat.length*2;F.mat=farGrowArr(F.mat,N);F.col=farGrowArr(F.col,N*3/16);F.top=farGrowArr(F.top,N*3/16);F.wn=farGrowArr(F.wn,N/4);}
  const o=F.n*16,m=F.mat;m.fill(0,o,o+16);m[o]=x1-x0;m[o+5]=y1-y0;m[o+10]=z1-z0;m[o+12]=(x0+x1)/2;m[o+13]=(y0+y1)/2;m[o+14]=(z0+z1)/2;m[o+15]=1;
  const i=F.n*3,t=L?L.top:c;F.col[i]=c.r;F.col[i+1]=c.g;F.col[i+2]=c.b;F.top[i]=t.r;F.top[i+1]=t.g;F.top[i+2]=t.b;
  const j=F.n*4;if(L){F.wn[j]=L.glow.r;F.wn[j+1]=L.glow.g;F.wn[j+2]=L.glow.b;F.wn[j+3]=L.f;}else{F.wn.fill(0,j,j+3);F.wn[j+3]=c===FARC.park||c.grass?-1:c===FARC.sea||c===FARC.deep||c===_fw?-2:-3;}
  F.n++;
}
// the far view of a block of the sea and its shore: n x n patches of water, beach, grass, or a port's concrete
function farSea(SG,px,pz,n){
  const t=plotType(px,pz),st=CELL/n,X0=px*CELL,Z0=pz*CELL;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=X0+i*st,z=Z0+j*st;
    if(t==='yard'||t==='navy'){farBox(SG,x,G+0.4,z,x+st,G+1,z+st,FARC.con);continue;}
    const q=t==='basin'||t==='nbasin'||n===1&&seaPlot(px,pz)===2?1:seaBlk(x+st/2,z+st/2);
    if(q>=SEA_T){const cd=n>1?coastD(x+st/2,z+st/2):99;
      if(cd<CF_IW*0.6&&coastFlav(x+st/2,z+st/2)===2)farBox(SG,x,G+0.4,z,x+st,G+1,z+st,FARC_CF[2]);
      else farBox(SG,x,G+0.4,z,x+st,G+0.95,z+st,n<=2&&seaPlot(px,pz)===2?FARC.deep:FARC.sea);}
    else if(n>1&&coastD(x+st/2,z+st/2)>-8)farBox(SG,x,G+0.4,z,x+st,G+1,z+st,FARC_CF[coastFlav(x+st/2,z+st/2)]||FARC.sand);
    else farBox(SG,x,G+0.4,z,x+st,G+1.6,z+st,farBio(px,pz).g);}
}
// the far view of one plains block: the rivers and highways crossing it, as boxes along their lines (each piece drawn
// by the block its middle falls in, every third piece standing for three)
const _fw=new THREE.Color();
const FAR_DARK=new THREE.Color(0,0,0),farWinL=c=>({glow:FAR_DARK,f:0,top:c});   // (a plain-coloured building's look: windows, none glowing)
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
function farGrow(F,cap){if(cap<=F.cap)return;scene.remove(F.m);F.m.geometry.dispose();F.m.material.dispose();const N=farInst(cap,F.win,F.ring);scene.remove(N.m);F.m=N.m;F.col=N.col;F.top=N.top;F.wn=N.wn;F.cap=cap;scene.add(F.m);}
function mkLod(step,mk){const ring={value:new THREE.Vector2(0,0)};return{B:farInst(2048,1,ring),G:farInst(1024,0,ring),ring,sb:farStage(),sg:farStage(),step,mk,job:null,cx:1e9,cz:1e9,key:-1,coll:-1,cr:-1,dv:-1,collT:0};}
// ---- trees and still water in the far rings. The near ring has every tree, as the chunks grow it (its trunk and two boxes
// of leaves, which is near enough what a blocky tree is), so that where the full-detail city takes over a tree only gains
// its detail; further off, woods are clumps of treetops. Ponds and lakes are water a hair above the ground, as rivers are. ----
const FAR_LEAF=new THREE.Color(blockColor(LEAVES)),FAR_TRUNK=new THREE.Color(blockColor(LOG));
// (each biome's ground and leaves seen from afar, world/climate.js: its top block's colour, a grassy one's grass tinted, and
// so turning with the seasons; grassland's are the plain ones, so a grassland world looks as it always did)
const FAR_PINE=new THREE.Color(blockColor(PINE)),FAR_CACT=new THREE.Color(blockColor(CACTUS));
const FAR_BIO=BIOMES.map(B=>{const top=B.top||GRASS;let g,l;
  if(B.i===BIO_GRASS){g=FARC.park;l=FAR_LEAF;}
  else{g=new THREE.Color(topColor(top));if(top===GRASS){g.r*=B.grass[0];g.g*=B.grass[1];g.b*=B.grass[2];g.grass=true;}
    l=FAR_LEAF.clone();l.r*=B.leaf[0];l.g*=B.leaf[1];l.b*=B.leaf[2];}
  return {g,l};});
const farBio=(px,pz)=>FAR_BIO[biomeOfPlot(px,pz)];
function farLeaf(F,x0,y0,z0,x1,y1,z1,hFall,hCol,c){farBox(F,x0,y0,z0,x1,y1,z1,c||FAR_LEAF);const j=(F.n-1)*4;F.wn[j]=hFall;F.wn[j+1]=hCol;F.wn[j+3]=-4;}
// the trees in one block, as genChunk grows them: x, z, the ground's top, the trunk's height and the species of each. Worked out once (a
// third of a millisecond for a block of plains) and kept, unless something in the block has been smashed since: then a
// tree whose trunk was knocked out is left out, as its leaves are gone too (purgeLeaves)
const farTreeC=new Map();let farTreeNew=false;
function farTreesOf(px,pz){
  const k=px*100003+pz,cx=px*CELL/CS,cz=pz*CELL/CS,E4=[];let ed=0;
  for(let a=0;a<CELL/CS;a++)for(let b=0;b<CELL/CS;b++){const ce=chunkEdits.get(ckey(cx+a,cz+b));if(ce){E4.push(ce);ed+=ce.length;}}
  const cn=craters.length+BB.jobs.length*1000,E=farTreeC.get(k);   // (asked again once a blast's job is over, as it only counts behind its ring till then)
  if(E&&E.ed===ed&&E.seed===seed&&E.cn===cn)return E.t;
  farTreeNew=true;
  // (a big blast's carving isn't kept as edits: a tree it reaches is asked of the crater instead)
  const bl=farBlastNear(px,pz);
  let gone=null;if(ed){gone=new Map();for(const ce of E4)for(const [x,y,z,b] of ce)gone.set(x+','+y+','+z,b);}
  const t=[],X0=px*CELL,Z0=pz*CELL,pl=PLAINS_OPEN(px,pz)||!!bigPlainsAt(px,pz),S=superOf(px,pz);
  const pk=S?S.kind==='capitol'||S.kind==='bigpark':plotInfo(px,pz).type==='park';
  if(!pl&&!pk){farTreeC.set(k,{ed,seed,cn,t});return t;}
  const cap=pk&&S&&S.kind==='capitol';   // (the capitol's avenue trees go by the column, the rest only where x+z is even)
  for(let z=Z0;z<Z0+CELL;z++)for(let x=X0+(cap?0:(X0+z)&1);x<X0+CELL;x+=cap?1:2){
    // (no tree is likelier than this anywhere, the thickest woods included: most columns are done with here)
    if(!cap&&hash2(x*3+1,z*7+5)>0.32)continue;
    let T=pl?plainsTree(x,z):null;
    if(pk&&parkTree(x,z))T=[G,4+Math.floor(hash2(x,z+99)*3),0];   // (as the chunks do, the park's pass comes last)
    if(!T)continue;
    if(gone){let ok=true;for(let y=T[0]+1;y<=T[0]+T[1]&&ok;y++){const v=gone.get(x+','+y+','+z);if(v!==undefined&&v!==LOG)ok=false;}if(!ok)continue;}
    if(bl&&farCraterTop(x,z,x+1,z+1,T[0]+T[1])<T[0]+T[1])continue;
    t.push(x,z,T[0],T[1],T[2]);
  }
  if(farTreeC.size>40000)farTreeC.clear();
  farTreeC.set(k,{ed,seed,cn,t});return t;
}
function farTreeBoxes(SG,t,lc){
  for(let i=0;i<t.length;i+=5){const x=t[i],z=t[i+1],gy=t[i+2],top=gy+t[i+3],sp=t[i+4],hF=hash2(x*5+11,z*3+7),hC=hash2(x*7+3,z*13+1);
    // (each species as treeGrow shapes it, near enough: TREE_K)
    if(sp===6){farBox(SG,x,gy+1,z,x+1,top+1,z+1,FAR_CACT);continue;}
    if(sp===7){farBox(SG,x,gy+1,z,x+1,top+1,z+1,FAR_TRUNK);continue;}
    if(sp===2){farBox(SG,x,gy+1,z,x+1,gy+3,z+1,FAR_TRUNK);farBox(SG,x-2,gy+3,z-2,x+3,top-1,z+3,FAR_PINE);farBox(SG,x-1,top-1,z-1,x+2,top+3,z+2,FAR_PINE);continue;}
    farBox(SG,x,gy+1,z,x+1,top-2,z+1,FAR_TRUNK);
    if(sp===3||sp===8){farLeaf(SG,x-3,top,z-3,x+4,top+1,z+4,hF,hC,lc);farLeaf(SG,x-2,top+1,z-2,x+3,top+2,z+3,hF,hC,lc);continue;}
    if(sp===4||sp===5||sp===1){farLeaf(SG,x-3,top-2,z-3,x+4,top+1,z+4,hF,hC,lc);farLeaf(SG,x-1,top+1,z-1,x+2,top+2,z+2,hF,hC,lc);continue;}
    farLeaf(SG,x-2,top-2,z-2,x+3,top,z+3,hF,hC,lc);
    farLeaf(SG,x-1,top,z-1,x+2,top+2,z+2,hF,hC,lc);}
}
// woods seen from further off: where the plains' copses are thick (or round a lumber camp or a campsite), one to three
// clumps of treetops to each square of the given size, rather than every tree. (roads: keep them off the roads, which the
// far ring, where a road is a hair across and the test would cost more than the rest put together, does without)
function farWoods(SG,px,pz,cell,roads){
  const site=bigPlainsAt(px,pz),X0=px*CELL,Z0=pz*CELL,bi=biomeOfPlot(px,pz),lc=bi===BIO_I.taiga?FAR_PINE:FAR_BIO[bi].l;let open=null,lum=null;
  for(let j=0;j<CELL;j+=cell)for(let i=0;i<CELL;i+=cell){const x=X0+i+(cell>>1),z=Z0+j+(cell>>1);
    let c=site?siteTrees(x,z):0;
    if(!c){if(lum===null)lum=lumberNear(px,pz);c=lum?1.1:plainsCopse(x,z);if(c<0.3)continue;
      if(open===null)open=PLAINS_OPEN(px,pz);if(!open)continue;}
    const hN=reliefNat(x,z);
    if(hN<-0.9||hN>rlfRock(CLIM.t)-6||roads&&roadNear(x,z,14)<6||farScorched(x,z))continue;   // (not in a pond, nor up on the bare rock, nor on a road, nor where a big blast flattened everything)
    const n=c>0.7?3:c>0.45?2:1,gy=site?0:Math.max(0,Math.round(hN));   // (on the land as it stands, near enough: a site's is level)
    for(let q=0;q<n;q++){const h=hash2(x*11+q*37,z*17+q*5),h2=hash2(x*3+q*7,z*29+q*13),w=cell*(0.4+0.25*h),
      ox=x+(h2-0.5)*(cell-w)*0.9,oz=z+(hash2(x+q*3,z*7+1)-0.5)*(cell-w)*0.9,top=G+gy+6+3*h2;
      farLeaf(SG,ox-w/2,G+gy+1.6,oz-w/2,ox+w/2,top,oz+w/2,hash2(x*5+q,z*3+q*11),h,lc);}
  }
}
// the land standing up off the plains (world/relief.js), seen from afar: a column of ground for each st x st square of an
// open block whose land rises, as high as the land in its middle, in its biome's colour, or bare rock or snow by height.
// exact: as the chunks build it (plainsH, the near ring); else the land's own height (further off)
const FAR_ROCK=new THREE.Color(topColor(STONE)),FAR_SNOW=new THREE.Color(topColor(SNOW));
function farTerrain(SG,px,pz,st,exact){
  climAt(px*CELL+16,pz*CELL+16);if(clBlend('r')<0.28&&WORLD_CFG.hill<=1.5||!PLAINS_OPEN(px,pz))return;   // (no more than the rolling hills)
  const g=farBio(px,pz).g,X0=px*CELL,Z0=pz*CELL,o=st>>1;
  for(let j=0;j<CELL;j+=st)for(let i=0;i<CELL;i+=st){const x=X0+i+o,z=Z0+j+o,h=exact?plainsH(x,z):Math.round(reliefNat(x,z));if(h<2)continue;
    const t=CLIM.t;farBox(SG,X0+i,G+1.6,Z0+j,X0+i+st,G+h+1,Z0+j+st,h>rlfSnow(t)?FAR_SNOW:h>rlfRock(t)?FAR_ROCK:g);}
}
// a block of open plains' ponds, found every st blocks and joined into runs along each row
function farPonds(SG,px,pz,st,exact){
  const X0=px*CELL,Z0=pz*CELL,o=st>>1;let open=null;
  for(let z=Z0;z<Z0+CELL;z+=st){let run=-1;
    for(let x=X0;x<=X0+CELL;x+=st){
      let w=x<X0+CELL&&reliefNat(x+o,z+o)<-0.9;
      if(w){if(open===null)open=PLAINS_OPEN(px,pz);w=open&&(!exact||plainsH(x+o,z+o)<0);}
      if(w&&run<0)run=x;else if(!w&&run>=0){farBox(SG,run,G+0.45,z,x,G+1.62,z+st,FARC.sea);run=-1;}}}
}
// water in an ellipse (a lake, a pond), as runs of rows st deep, its top at y
function farOval(SG,cx,cz,rx,rz,st,y){
  for(let z=cz-rz;z<cz+rz;z+=st){const m=z+st/2-cz;if(Math.abs(m)>=rz)continue;const hw=rx*Math.sqrt(1-(m/rz)**2);if(hw<1)continue;
    farBox(SG,cx-hw,y-0.5,z,cx+hw,y,Math.min(z+st,cz+rz),FARC.sea);}
}
// the water in town: a park's pond, a big park's lake and reservoir, a theme park's boating lake
function farTownWater(SG,px,pz,P,st){
  const X0=px*CELL,Z0=pz*CELL,S=superOf(px,pz);
  if(!S){if(P.type==='park'&&P.pond)farBox(SG,X0+PC-4,G+0.4,Z0+PC-4,X0+PC+4,G+0.99,Z0+PC+4,FARC.sea);return;}
  if(px!==S.ax||pz!==S.az)return;
  if(S.kind==='bigpark'){const W=(S.w-1)*CELL+PW,L=(S.h-1)*CELL+PW,g=bigParkGeo(W,L),sx=X0+PL0,sz=Z0+PL0,[lx,lz,lr,lq]=g.lake,[rx,rz,rr]=g.res;
    farOval(SG,sx+lx,sz+lz,lr,lq,st,G+1.04);farOval(SG,sx+rx,sz+rz,rr,rr,st,G+1.04);}
  else if(S.kind==='theme'){const T=plotInfo(S.ax,S.az).theme;if(T&&T.pond){const r=T.pond.r-1.5;farOval(SG,X0+T.pond.cu,Z0+T.pond.cv,r,r,st,G+0.99);}}
}
// ---- what's been destroyed, as the far rings show it. Worked out from what's saved and sent online (collapses, destroyed,
// craters), so it's the same after loading and on a guest. ----
const FAR_RUB=new THREE.Color(topColor(COBBLE)),FAR_SCORCH=new THREE.Color(topColor(DIRT));
const _fbo={zone:0,cut:H,floor:-1,fb:0,l0:0,l1:0,lb:0,t:0},FAR_CS=[[0.5,0.5],[0.2,0.2],[0.8,0.2],[0.2,0.8],[0.8,0.8]];
// (the average height a box over x0..x1, z0..z1 still stands to after the big blasts: what bbCol cuts away, at five spots)
function farCraterTop(x0,z0,x1,z1,top){
  if(!craters.length)return top;let s=0;
  for(const [fx,fz] of FAR_CS){const x=Math.floor(x0+(x1-x0)*fx),z=Math.floor(z0+(z1-z0)*fz);let c=top;
    for(const C of craters){const d=Math.hypot(x-C.x,z-C.z);if(d>C.R*1.2||d>farRing(C))continue;bbCol(C,bbK(C),x,z,_fbo);if(_fbo.zone&&_fbo.cut-1<c)c=_fbo.cut-1;}
    s+=c;}
  return Math.floor(s/FAR_CS.length);
}
// (how far out a blast's shockwave has got: the far rings take it in only behind it, as the chunks are carved)
function farRing(C){const J=BB.jobs.find(j=>j.C===C);return J?J.ring:1e9;}
// (inside a big blast's flattened zone: the ground's scorched and nothing stands)
const farScorched=(x,z)=>craters.length>0&&craters.some(C=>{const d=Math.hypot(x-C.x,z-C.z);return d<bbK(C).rf&&d<=farRing(C);});
// (a big blast reaching this plot at all)
const farBlastNear=(px,pz)=>craters.length>0&&craters.some(C=>Math.hypot(px*CELL+CELL/2-C.x,pz*CELL+CELL/2-C.z)<C.R*1.07+CELL);
// how high a building still stands: its collapse, the craters, and the blocks knocked out of it (a building smashed about
// loses height by the share of it gone; its total's worked out first by the job, farSolid)
function farTop(b,X0,Z0,key){
  const cap=collapses[key];let top=b.top;if(cap!==undefined)top=Math.min(top,cap-1);
  const d=destroyed[key];if(d){const N=bSolidC.get(key);top=Math.min(top,G+Math.round((top-G)*(N?Math.max(0,1-d/N):0)));}
  return Math.min(top,farCraterTop(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,top));
}
function* farSolid(b,px,pz,key){if(destroyed[key])while(bldgSolidPart(b,px,pz,key,performance.now()+1)===undefined)yield;}
// (brought down to a heap: a low box of rubble rather than a stub of the building)
const farRubble=(F,b,X0,Z0,top)=>farBox(F,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,top+1,Z0+b.z1,FAR_RUB);
// the plots with a building that's come down or been knocked about (a superblock's every plot), for the far ring, which
// otherwise only guesses: they're drawn building by building instead
function farDamaged(){
  const S=new Set(),add=k=>{const a=k.split(','),px=+a[0],pz=+a[1];if(S.has(px+','+pz))return;const B=superOf(px,pz);
    if(B&&B.ax===px&&B.az===pz){for(let i=0;i<B.w;i++)for(let j=0;j<B.h;j++)S.add((px+i)+','+(pz+j));}else S.add(px+','+pz);};
  for(const k in collapses)add(k);for(const k in destroyed)add(k);
  return S;
}
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
      const P=plotInfo(px,pz),X0=px*CELL,Z0=pz*CELL,sc=farScorched(X0+CELL/2,Z0+CELL/2);
      if(seaPlot(px,pz))farSea(SG,px,pz,4);
      else if(realmOf(px,pz)==='plains'){farBox(SG,X0,G+0.4,Z0,X0+CELL,G+1.6,Z0+CELL,sc?FAR_SCORCH:farBio(px,pz).g);if(!sc)farTerrain(SG,px,pz,8,true);farLinesPlot(SB,SG,px,pz);if(turbineAt(px,pz)&&!sc)farTurbine(SB,px,pz,1);if(!sc)yield* farCountry(SB,SG,px,pz,0);}   // the plains: all grass (hills are only drawn up close), and what crosses them
      else farBox(SG,X0+ROADW,G+0.4,Z0+ROADW,X0+CELL,G+0.97,Z0+CELL,sc?FAR_SCORCH:P.type==='park'?FARC.park:P.type==='plaza'?FARC.plaza:FARC.side);
      if(!seaPlot(px,pz)){if(realmOf(px,pz)==='plains')farPonds(SG,px,pz,4,true);else farTownWater(SG,px,pz,P,2);}
      farTreeNew=false;farTreeBoxes(SG,farTreesOf(px,pz),farBio(px,pz).l);if(farTreeNew)yield;
      if(hwRow(pz,px)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
      if(hwCol(px,pz)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
      {const cv=cloverOf(px,pz);if(cv){_fc.setHex(blockColor(CONCRETE));const cx=cv.j*CELL+4,cz=cv.k*CELL+4;
        for(let n=0;n<4;n++){const ev=n%2===0,hA=ev?HY_X:HY_Z,hB=ev?HY_Z:HY_X;for(const o of CLV){if(o.t!=='deck'&&o.t!=='slope')continue;
          const [a0,b0]=cvRot(n,o.p0,o.q0),[a1,b1]=cvRot(n,o.p1,o.q1),x0=Math.max(X0,cx+Math.min(a0,a1)),x1=Math.min(X0+CELL,cx+Math.max(a0,a1)),z0=Math.max(Z0,cz+Math.min(b0,b1)),z1=Math.min(Z0+CELL,cz+Math.max(b0,b1));
          if(x1<=x0||z1<=z0)continue;const h=o.t==='deck'?(o.h==='A'?hA:hB):(hA+hB)/2;farBox(SB,x0,h-1,z0,x1,h+1,z1,_fc);}}}}
      for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];
        if(b.farSkip)continue;
        const key=px+','+pz+','+bi;yield* farSolid(b,px,pz,key);
        const top=farTop(b,X0,Z0,key);if(top<=G)continue;if(top<G+3&&top<b.top){farRubble(SB,b,X0,Z0,top);continue;}
        if(!b._far||!b._far.fine){farLook(b,px,pz);yield;}const L=b._far;
        if(b.tier>0&&(b.x1-b.x0)>=8){
          farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,Math.min(top,b.tier)+1,Z0+b.z1,L.wall,L);
          if(top>b.tier)farBox(SB,X0+b.x0+2,b.tier+1,Z0+b.z0+2,X0+b.x1-2,top+1,Z0+b.z1-2,L.wall,L);
        } else farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,top+1+(top<b.top?0:(b.roof||0)*0.6),Z0+b.z1,L.wall,L);   // (no roof on what's left)
      }
      if(P.super&&P.super.kind==='capitol'&&px===P.super.ax&&pz===P.super.az&&collapses[px+','+pz+',0']===undefined){
        const g=capGeo(),sx=X0+PL0,sz=Z0+PL0;_fc.setHex(blockColor(HOSPW));const cL=farWinL(_fc);
        farBox(SG,sx,G+0.97,sz,sx+g.W,G+1.02,sz+g.L,FARC.park);
        farBox(SB,sx+g.px0,G+1,sz+g.bf,sx+g.px1,G+24,sz+g.back,_fc,cL);
        farBox(SB,sx+g.px0,G+1,sz+g.pz0,sx+g.px1,G+4,sz+g.bf,_fc,cL);
        farBox(SB,sx+g.c-16,G+24,sz+g.bf,sx+g.c+16,G+29,sz+g.bf+32,_fc,cL);
        farBox(SB,sx+g.c-12,G+29,sz+g.dc-12,sx+g.c+12,G+42,sz+g.dc+12,_fc,cL);
        farBox(SB,sx+g.c-7,G+42,sz+g.dc-7,sx+g.c+7,G+48,sz+g.dc+7,_fc,cL);
        farBox(SB,sx+g.c-1,G+48,sz+g.dc-1,sx+g.c+1,G+60,sz+g.dc+1,_fc,cL);
      }
      if(P.super&&P.super.kind==='bigpark'&&px===P.super.ax&&pz===P.super.az){
        const SS=P.super;farBox(SG,X0+PL0,G+0.97,Z0+PL0,X0+(SS.w-1)*CELL+PL1,G+1.02,Z0+(SS.h-1)*CELL+PL1,FARC.park);
      }
      if(P.super&&P.super.kind==='stadium'&&px===P.super.ax&&pz===P.super.az){
        const SS=P.super,sx=X0+PL0,sz=Z0+PL0,W=(SS.w-1)*CELL+PW,L=(SS.h-1)*CELL+PW,F=stadiumField(W,L),o=STAND+2;
        const x0=sx+F.fx0-o,x1=sx+F.fx0+F.fw+o,z0=sz+F.fz0-o,z1=sz+F.fz0+F.fh+o,y1=G+STAND+5;_fc.setHex(blockColor(CONCRETE));
        // (each stand as much of it as the big blasts left)
        const st=(a,b,c,d)=>{const t=farCraterTop(a,b,c,d,y1-1);if(t>G)farBox(SB,a,G+1,b,c,t+1,d,t<G+3?FAR_RUB:_fc);};
        st(x0,z0,x1,z0+o);st(x0,z1-o,x1,z1);st(x0,z0+o,x0+o,z1-o);st(x1-o,z0+o,x1,z1-o);
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
    const X0=px*CELL,Z0=pz*CELL,sc=farScorched(X0+CELL/2,Z0+CELL/2);
    if(seaPlot(px,pz)){farSea(SG,px,pz,2);continue;}
    if(realmOf(px,pz)==='plains'){farBox(SG,X0,G+0.4,Z0,X0+CELL,G+1.6,Z0+CELL,sc?FAR_SCORCH:farBio(px,pz).g);if(!sc)farTerrain(SG,px,pz,16,false);farLinesPlot(SB,SG,px,pz);if(turbineAt(px,pz)&&!sc)farTurbine(SB,px,pz,1.6);if(!sc)yield* farCountry(SB,SG,px,pz,1);
      farPonds(SG,px,pz,8,false);farWoods(SG,px,pz,16,true);
      if(hwRow(pz,px)&&!hwGround('x',pz,X0+16)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
      if(hwCol(px,pz)&&!hwGround('z',px,Z0+16)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
      continue;}
    const P=plotInfo(px,pz);
    farBox(SG,X0+ROADW,G+0.4,Z0+ROADW,X0+CELL,G+0.97,Z0+CELL,sc?FAR_SCORCH:P.type==='park'?FARC.park:P.type==='plaza'?FARC.plaza:FARC.side);
    farTownWater(SG,px,pz,P,6);
    if(hwRow(pz,px)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('x',pz,X0+CELL/2)-1;farBox(SB,X0,y-1,Z0-3,X0+CELL,y+2,Z0+11,_fc);}
    if(hwCol(px,pz)){_fc.setHex(blockColor(CONCRETE));const y=hwSurf('z',px,Z0+CELL/2)-1;farBox(SB,X0-3,y-1,Z0,X0+11,y+2,Z0+CELL,_fc);}
    yield* farPlotBuildings(SB,P,px,pz);
  }}
}
// the middle ring's buildings on one plot, one plain box each (and the far ring's, on a plot where something's been destroyed)
function* farPlotBuildings(SB,P,px,pz){
    const X0=px*CELL,Z0=pz*CELL;
    for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(b.farSkip||b.x1-b.x0<3||b.z1-b.z0<3)continue;
      const key=px+','+pz+','+bi;yield* farSolid(b,px,pz,key);
      const top=farTop(b,X0,Z0,key);if(top<=G)continue;if(top<G+3&&top<b.top){farRubble(SB,b,X0,Z0,top);continue;}
      if(!b._far){farLook(b,px,pz,false);yield;}const L=b._far;
      farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,(b.tier>0&&top>b.tier?(b.tier+top)/2:top)+1,Z0+b.z1,L.wall,L);}
    if(P.super&&P.super.kind==='capitol'&&px===P.super.ax&&pz===P.super.az&&collapses[px+','+pz+',0']===undefined){
      const g=capGeo(),sx=X0+PL0,sz=Z0+PL0;_fc.setHex(blockColor(HOSPW));const cL=farWinL(_fc);
      farBox(SB,sx+g.px0,G+1,sz+g.bf,sx+g.px1,G+24,sz+g.back,_fc,cL);farBox(SB,sx+g.c-12,G+24,sz+g.dc-12,sx+g.c+12,G+44,sz+g.dc+12,_fc,cL);}
    if(P.super&&P.super.kind==='stadium'&&px===P.super.ax&&pz===P.super.az){
      const SS=P.super,sx=X0+PL0,sz=Z0+PL0,W=(SS.w-1)*CELL+PW,L=(SS.h-1)*CELL+PW;_fc.setHex(blockColor(CONCRETE));
      const t=farCraterTop(sx,sz,sx+W,sz+L,G+STAND+4);if(t>G)farBox(SB,sx,G+1,sz,sx+W,t+1,sz+L,t<G+3?FAR_RUB:_fc);}
}
// ---- the plains' farms and country sites in the far rings: fields and orchards as patches of their colour (crop rows are
// dirt and leaves or flowers, an orchard's grass under its trees' crowns), and the buildings of a farm or site. A landmark
// (a hangar, a tower, a reactor's dome, a launch tower) is drawn as columns of the height it really is, sampled every few
// blocks, since one box round all of it would stand far too big ----
const FAR_SITES=new Set(['farm','truckstop','nuclear','base','airport','airfield','nasa','mine','quarry','lumber','campsite','cult','tower5g','prepper','militia','ruins','thieves','derricks','peat','research','safari','stilts','ski']);
const farMix=(a,b,f)=>{const c=new THREE.Color(topColor(a));c.lerp(new THREE.Color(topColor(b)),f);return c;};
// (green ones turn with the seasons as grass does: farBox gives them the grass's -1)
const FAR_FIELD={veg:farMix(DIRT,LEAVES,0.5),flower:farMix(DIRT,FLOWER,0.5),orchard:farMix(GRASS,LEAVES,0.45)};
FAR_FIELD.veg.grass=FAR_FIELD.orchard.grass=true;
// a landmark's outline every st blocks: [x0,z0,x1,z1,top] runs (block coordinates in its plot), kept on it
function farProfile(b,px,pz,st){
  const P=b._farP||(b._farP={});if(P[st])return P[st];const out=[],hi=b.top+(b.roof||0)+2;
  for(let z=b.z0;z<b.z1;z+=st){let run=null;const z1=Math.min(b.z1,z+st);
    for(let x=b.x0;x<b.x1;x+=st){const x1=Math.min(b.x1,x+st),cx=Math.floor((x+x1)/2),cz=Math.floor((z+z1)/2);let t=G;
      for(let y=hi;y>G;y--){const v=blockAt(b,cx,cz,y,px,pz);if(v!==AIR&&!BLOCK[v].hide&&!BLOCK[v].liquid){t=y;break;}}
      if(run&&run[4]===t)run[2]=x1;else{if(run&&run[4]>G)out.push(run);run=[x,z,x1,z1,t];}}
    if(run&&run[4]>G)out.push(run);}
  return P[st]=out;
}
// one plains block's farmland, or its farm's or site's field and buildings. lvl 0 the near ring, 1 the middle, 2 the far
function* farCountry(SB,SG,px,pz,lvl){
  const X0=px*CELL,Z0=pz*CELL,t=plotType(px,pz);
  if(t==='plains'){const F=farmlandOf(px,pz);if(F)farBox(SG,X0,G+0.4,Z0,X0+CELL,G+1.62,Z0+CELL,F.kind==='orchard'?FAR_FIELD.orchard:F.crop?FAR_FIELD.flower:FAR_FIELD.veg);return;}
  if(!FAR_SITES.has(t))return;
  const P=plotInfo(px,pz);
  if(t==='farm'&&P.field){const F=P.field;farBox(SG,X0+F.x0+1,G+0.4,Z0+F.z0+1,X0+F.x1-1,G+1.62,Z0+F.z1-1,FAR_FIELD.veg);}
  for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(b.farSkip||b.x1-b.x0<2||b.z1-b.z0<2)continue;
    const key=px+','+pz+','+bi;yield* farSolid(b,px,pz,key);
    const top=farTop(b,X0,Z0,key);if(top<=G)continue;if(top<G+3&&top<b.top){farRubble(SB,b,X0,Z0,top);continue;}
    if(!b._far||lvl===0&&!b._far.fine){farLook(b,px,pz,lvl===0);yield;}const L=b._far;
    if(b.kind==='landmark'&&lvl<2){const st=lvl?8:4,fresh=!(b._farP&&b._farP[st]),R=farProfile(b,px,pz,st);if(fresh)yield;
      for(const r of R)farBox(SB,X0+r[0],G+1,Z0+r[1],X0+r[2],Math.min(r[4],top)+1,Z0+r[3],L.wall,L);}
    else farBox(SB,X0+b.x0,G+1,Z0+b.z0,X0+b.x1,top+1+(lvl===0&&top>=b.top?(b.roof||0)*0.6:0),Z0+b.z1,L.wall,L);}
}
// the far ring: one box per town block, from the cheap per-block guesses (no plots worked out)
// (no buildings are worked out out here, so each block gets a typical look: one of the common wall materials, with the share
// of glowing windows and the roof colour the buildings nearer in have on average)
const FAR3_LOOKS=[BRICK,CONCRETE,SIDING,STUCCO,GLASS,PAINT_WHITE].map(b=>({wall:new THREE.Color(blockColor(b)),glow:new THREE.Color(blockColor(WIN_WARM)),f:0.25,top:new THREE.Color(0.44,0.33,0.28)}));
function* farJobFar(SB,SG,act,ra,rb){
  if(TENV){const p0=act[0];farBox(SG,p0.pos.x-rb-128,G+0.3,p0.pos.z-rb-128,p0.pos.x+rb+128,G+0.4,p0.pos.z+rb+128,FARC.park);return;}
  {const p0=act[0];farBox(SG,p0.pos.x-rb-128,G+0.3,p0.pos.z-rb-128,p0.pos.x+rb+128,G+0.4,p0.pos.z+rb+128,FARC.park);}   // (out here it's mostly fields)
  const seen=new Set(),C4=4*CELL,dmg=farDamaged();
  for(const p of act)for(let qx=Math.floor((p.pos.x-rb)/C4);qx<=Math.floor((p.pos.x+rb)/C4);qx++){yield;for(let qz=Math.floor((p.pos.z-rb)/C4);qz<=Math.floor((p.pos.z+rb)/C4);qz++){
    const k=qx*100003+qz;if(seen.has(k))continue;
    const d=Math.hypot(qx*C4+C4/2-p.pos.x,qz*C4+C4/2-p.pos.z);if(d>rb+C4||d<ra-C4)continue;seen.add(k);
    {const bi=biomeOfPlot(qx*4+2,qz*4+2);if(bi!==BIO_GRASS)farBox(SG,qx*C4,G+0.31,qz*C4,qx*C4+C4,G+0.42,qz*C4+C4,FAR_BIO[bi].g);}   // (a biome's ground under the fields)
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const px=qx*4+i,pz=qz*4+j,X0=px*CELL,Z0=pz*CELL,sc=farScorched(X0+CELL/2,Z0+CELL/2);
      if(seaPlot(px,pz)){farSea(SG,px,pz,1);continue;}
      const ty=setType(px,pz);if(!ty){if(sc)farBox(SG,X0,G+0.45,Z0,X0+CELL,G+0.6,Z0+CELL,FAR_SCORCH);else if(turbineAt(px,pz))farTurbine(SB,px,pz,2.6);if(realmOf(px,pz)==='plains'){if(!sc)farTerrain(SG,px,pz,32,false);farPonds(SG,px,pz,16,false);farWoods(SG,px,pz,32,false);if(!sc)yield* farCountry(SB,SG,px,pz,2);}continue;}
      farBox(SG,X0,G+0.45,Z0,X0+CELL,G+0.97,Z0+CELL,sc?FAR_SCORCH:FARC.side);
      // (a plot where something's come down or been knocked about, or that a big blast reached: its real buildings, as
      // they've been left, rather than the guess)
      if(dmg.has(px+','+pz)||farBlastNear(px,pz)){if(!sc)yield* farPlotBuildings(SB,plotInfo(px,pz),px,pz);yield;continue;}
      if(hwRow(pz,px)&&!hwGround('x',pz,X0+16)){_fc.setHex(blockColor(CONCRETE));farBox(SB,X0,HY_X-1,Z0-3,X0+CELL,HY_X+2,Z0+11,_fc);}
      if(hwCol(px,pz)&&!hwGround('z',px,Z0+16)){_fc.setHex(blockColor(CONCRETE));farBox(SB,X0-3,HY_Z-1,Z0,X0+11,HY_Z+2,Z0+CELL,_fc);}
      const t=baseType(px,pz),h=hash2(px*41+7,pz*37+3);let top=0,inset=0;
      if(t==='tower')top=30+h*60;else if(t==='mid')top=12+h*16;else if(t==='homes'){top=6+h*3;inset=3;}
      else if(t==='park'||t==='plaza')continue;else top=6+h*6;
      {const L=FAR3_LOOKS[Math.floor(hash2(px*13+1,pz*19+5)*FAR3_LOOKS.length)];farBox(SB,X0+PL0+inset,G+1,Z0+PL0+inset,X0+PL1-inset,G+1+top,Z0+PL1-inset,L.wall,L);}}
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
    F.m.instanceMatrix.array.set(S.mat.subarray(0,S.n*16));F.col.array.set(S.col.subarray(0,S.n*3));F.top.array.set(S.top.subarray(0,S.n*3));F.wn.array.set(S.wn.subarray(0,S.n*4));
    F.m.count=S.n;F.m.instanceMatrix.needsUpdate=true;F.col.needsUpdate=F.top.needsUpdate=F.wn.needsUpdate=true;}
}
let farDirty=true,farT=0;
const FAR_BUDGET=4;   // milliseconds a frame for building the far rings
function updateFar(dt){
  if(meshedDirty){MESHED_TEX.needsUpdate=true;meshedDirty=false;}
  LEAFFALL_U.value=leafFall;
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
      // (a building down or a crater: soon, the further rings less often; blocks knocked out: every few seconds at most)
      const cc=nColl!==L.coll||craters.length!==L.cr,dc=destroyVer!==L.dv,collCh=(cc||dc)&&L.collT<=0;
      const moved=Math.hypot(p.x-L.cx,p.z-L.cz)>L.step;
      if(!(dirty||moved||key!==L.key||collCh))return;
      if(!on||r1<=r0){L.job=null;L.sb.n=0;L.sg.n=0;farCommit(L);L.key=key;L.cx=p.x;L.cz=p.z;return;}
      // built with a margin round its ring, so it still covers the ring as you move until the next build
      const m=L.step+(i===2?256:64);
      L.sb.n=0;L.sg.n=0;L.job=L.mk(L.sb,L.sg,act.map(q=>({pos:q.pos.clone()})),Math.max(0,r0-m),r1+m);
      L.cx=p.x;L.cz=p.z;L.key=key;L.coll=nColl;L.cr=craters.length;L.dv=destroyVer;if(collCh)L.collT=cc?[0,4,8][i]:[3,6,12][i];
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
