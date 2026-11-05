// ---------- Save ----------
let saveTimer=null;
function save(){if(saveBlocked)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{flushNotes(Infinity);try{localStorage.setItem(SAVE_KEY,JSON.stringify({seed,edits,coll:collapses,wreck:wrecked,down:[...downFix],dest:destroyed,test:[...TEST_OFF],tenv:TENV||undefined}));}catch(e){}},700);}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&typeof s.seed==='number'){seed=s.seed;TEST_OFF=new Set(Array.isArray(s.test)?s.test:[]);TENV=s.tenv&&Array.isArray(s.tenv.boxes)?{boxes:s.tenv.boxes.filter(B=>B&&[B.ax,B.az,B.w,B.h].every(Number.isFinite))}:null;tenvIndex();edits=s.edits||{};collapses=s.coll||{};wrecked=(s.wreck&&typeof s.wreck==='object')?s.wreck:{};destroyed=(s.dest&&typeof s.dest==='object')?s.dest:{};destroyVer++;setDCache.clear();downFix=new Map(Array.isArray(s.down)?s.down:[]);for(const k in edits){const [x,y,z]=k.split(',').map(Number);const ck=ckey(Math.floor(x/CS),Math.floor(z/CS));let l=chunkEdits.get(ck);if(!l){l=[];chunkEdits.set(ck,l);}l.push([x,y,z,edits[k]]);}return true;}}catch(e){}return false;}

// ---------- Renderer ----------
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.localClippingEnabled=true;
const SKY=new THREE.Color(0x6c7a74),DEEP=new THREE.Color(0x1d4a8a);
scene.background=SKY.clone();
scene.fog=new THREE.Fog(SKY.clone(),48,106);
const hemi=new THREE.HemisphereLight(0xe8f0e0,0x40483a,0.75);scene.add(hemi);
const sunLight=new THREE.DirectionalLight(0xffe8cc,0.55);sunLight.position.set(0.5,1,0.3);scene.add(sunLight);
// ---- sky dome: gradient, sun, moon and stars; it rides along with whichever camera is drawing ----
const skyU={uTop:{value:new THREE.Color(0x5d87b0)},uHor:{value:new THREE.Color(0xa9b8b4)},uSun:{value:new THREE.Vector3(0,1,0)},uMoon:{value:new THREE.Vector3(0,-1,0)},uNight:{value:0},uSunCol:{value:new THREE.Color(1,0.93,0.78)},uPhase:{value:0.5},uMoonLit:{value:1},uCover:{value:0},uHzn:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(70,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:[
    'uniform vec3 uTop,uHor,uSunCol,uSun,uMoon;uniform float uNight,uPhase,uMoonLit,uCover,uHzn;varying vec3 vD;',
    'void main(){',
    // (h: height above the horizon -- which, with the world bent, sits lower (or higher) than straight ahead)
    ' vec3 d=normalize(vD);float h=d.y-uHzn;',
    ' vec3 col=mix(uHor,uTop,smoothstep(0.0,0.55,h));',
    ' col=mix(col,uHor*0.78,1.0-smoothstep(-0.3,0.0,h));',
    ' float sd=max(dot(d,uSun),0.0);',
    ' float clear=1.0-0.92*uCover;',
    ' col+=uSunCol*(smoothstep(0.9988,0.9994,sd)*1.3*clear+0.35*pow(sd,48.0)*clear+0.12*pow(sd,6.0))*smoothstep(-0.12,0.0,uSun.y);',
    ' float md=max(dot(d,uMoon),0.0);',
    // the moon's phase: the lit part of the disc, bounded by the terminator (waxing lit on the right, waning on the left)
    ' vec3 mr=normalize(cross(uMoon,vec3(0.0001,1.0,0.0)));vec3 mu=cross(mr,uMoon);vec2 mp=vec2(dot(d,mr),dot(d,mu))/0.037;',
    ' float xn=mp.x/max(0.02,sqrt(max(0.0,1.0-mp.y*mp.y)));float sideM=uPhase<0.5?xn:-xn;',
    ' float lit=smoothstep(-0.07,0.07,sideM-cos(6.2832*uPhase));',
    ' col+=(vec3(0.86,0.9,1.0)*smoothstep(0.9991,0.9995,md)*(0.06+0.94*lit)+vec3(0.22,0.27,0.42)*pow(md,60.0)*uMoonLit)*uNight*clear;',
    ' vec3 q=floor(d*220.0);float st=fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);',
    ' col+=vec3(step(0.9982,st))*uNight*smoothstep(0.02,0.25,h)*0.85*clear;',
    ' gl_FragColor=vec4(col,1.0);',
    '}'].join('\n')}));
sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
// ---- clouds: the original blocky clouds, on three decks at different heights. Each deck has its own pattern, a
// different block size (bigger, chunkier blocks on the lower, nearer decks) and its own wind, so they slide past
// one another and give the sky some depth.
function cloudTex(seed,n){
  // one big 256-texel tile (four times the old one each way, with the same size of cloud blocks), every block placed
  // at random and wrapped round the tile's edges so it tiles seamlessly
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),r=mulberry(seed);if(!g||!g.fillRect)return c;
  g.fillStyle='rgba(200,214,196,.9)';
  for(let i=0;i<n*32;i++){const x=Math.floor(r()*N),y=Math.floor(r()*N),w=4+Math.floor(r()*10),h=2+Math.floor(r()*5);
    for(const ox of x+w>N?[0,-N]:[0])for(const oy of y+h>N?[0,-N]:[0])g.fillRect(x+ox,y+oy,w,h);}
  return c;
}
// a coarse, smooth patchiness map: laid over each deck at a scale that doesn't line up with the cloud tile, it thins
// the clouds out in some places and thickens them in others, so no stretch of sky ever looks like another
function cloudMask(seed){
  const N=32,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),r=mulberry(seed);if(!g||!g.createImageData)return c;
  const img=g.createImageData(N,N);for(let i=0;i<N*N;i++){const v=Math.round(255*r());img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v;img.data[i*4+3]=255;}
  g.putImageData(img,0,0);return c;
}
const CLOUD_VS='uniform float uWorldCurve;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vec2 dd=w.xz-cameraPosition.xz;w.y-=uWorldCurve*dot(dd,dd);gl_Position=projectionMatrix*viewMatrix*w;}';
const CLOUD_FS=['uniform sampler2D map;uniform sampler2D mask;uniform vec2 uMOff;uniform float uMRep;uniform vec2 uOff;uniform float uRep;uniform vec3 uTint;uniform float uOpacity;uniform float uShade;uniform float uCover;varying vec2 vUv;',
  'void main(){vec4 c=texture2D(map,vUv*uRep+uOff);float r=length(vUv-0.5)*2.0;float fade=1.0-smoothstep(0.55,1.0,r);',
  ' float m=texture2D(mask,vUv*uMRep+uMOff).r;m=smoothstep(0.28-0.5*uCover,0.72-0.45*uCover,m);',
  // overcast: the gaps between the cloud blocks fill in with a flat grey layer
  ' float fill=smoothstep(0.45,1.0,uCover)*0.85;float a=max(c.a,fill);vec3 rgb=mix(vec3(0.72,0.75,0.77),c.rgb,c.a);',
  ' gl_FragColor=vec4(rgb*uTint*uShade,a*uOpacity*fade*m);}'].join('\n');
// h: height above the top of the world; period: blocks per texture tile (64 texels); wind: blocks/second (x,z);
// size: deck width (x the view); n: how many cloud blocks in a tile
const CLOUD_DECKS=[
  {h:56,period:440,mperiod:1270,wind:[0.7,0.1],op:0.26,size:2.0,n:18,seed:77,slices:[[0,1]]},
  {h:30,period:600,mperiod:1630,wind:[1.6,-0.3],op:0.32,size:1.6,n:22,seed:211,slices:[[0,0.96]]},
  {h:10,period:840,mperiod:2110,wind:[2.8,0.4],op:0.38,size:1.3,n:20,seed:347,slices:[[0,0.92]]}];
const cloudLayers=[];
CLOUD_DECKS.forEach((D,di)=>{
  const tex=new THREE.CanvasTexture(cloudTex(D.seed,D.n));tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.magFilter=tex.minFilter=THREE.NearestFilter;
  const mtex=new THREE.CanvasTexture(cloudMask(D.seed+5));mtex.wrapS=mtex.wrapT=THREE.RepeatWrapping;mtex.magFilter=mtex.minFilter=THREE.LinearFilter;
  D.off=[0,0];D.drift=[0,0];
  for(const [dy,shade] of D.slices){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(600,600,48,48),new THREE.ShaderMaterial({vertexShader:CLOUD_VS,fragmentShader:CLOUD_FS,transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
      uniforms:{map:{value:tex},mask:{value:mtex},uMOff:{value:new THREE.Vector2()},uMRep:{value:1},uOff:{value:new THREE.Vector2()},uRep:{value:1},uTint:{value:new THREE.Color(1,1,1)},uOpacity:{value:D.op},uShade:{value:shade},uCover:{value:0}}}));
    m.rotation.x=-Math.PI/2;m.frustumCulled=false;
    // drawn far to near as seen from below: the highest deck first, each deck's top slice before its shaded underside
    m.renderOrder=-4+di*0.9+(-dy)*0.05;
    scene.add(m);cloudLayers.push({m,D,dy});
  }
});
let cloudDrift=0;
