// ---- world curve (a debug toy): every vertex drops (or rises) by k times the square of its distance from the camera,
// across the ground, so the world bends away over the horizon like a little planet (or curls up like a bowl). Done in
// three.js's own projection step, so it applies to every material; each material gets the shared uniform on compile.
// (The camera's position is worked out from the view matrix: three.js only fills in cameraPosition for some materials.) ----
const CURVE_U={value:0};
THREE.ShaderChunk.common='uniform float uWorldCurve;\n'+THREE.ShaderChunk.common;
if(THREE.ShaderChunk.project_vertex.includes('mvPosition = modelViewMatrix * mvPosition;'))
  THREE.ShaderChunk.project_vertex=THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',
    'vec4 wcP = modelMatrix * mvPosition; vec3 wcT = viewMatrix[3].xyz; vec2 wcD = wcP.xz + vec2( dot( viewMatrix[0].xyz, wcT ), dot( viewMatrix[2].xyz, wcT ) ); wcP.y -= uWorldCurve * dot( wcD, wcD ); mvPosition = viewMatrix * wcP;');
Object.defineProperty(THREE.Material.prototype,'onBeforeCompile',{configurable:true,
  set(f){this._obc=f;},
  get(){const f=this._obc,w=function(sh,r){sh.uniforms.uWorldCurve=CURVE_U;if(f)f.call(this,sh,r);};w.toString=()=>'wc|'+(f?f.toString():'');return w;}});
// ...and three.js decides what's on screen from where things really are, so with the world bent it would cull things that
// the bend has carried into view (or keep ones it has carried out). Its frustum test is taught the same bend: each object's
// bounding sphere is moved by it and grown to cover how unevenly it bends across the sphere.
const CURVE_CAM=new THREE.Vector3();
// Bent down, the world also has a horizon: the ground rises in view out to a distance sqrt(h/k) (h = the camera's height
// over the ground) and falls away beyond it, so anything out past there whose top stays below that line is hidden behind
// the ground. The ground is taken to be as low as it ever gets (a river's surface), so nothing that could show is skipped.
// The test: from the camera, the steepest the ground ever rises is -2*sqrt(h*k) (a drop of h/s + k*s over s); a thing
// at (horizontal distance s, height Y over the camera) appears at Y/s - k*s, and is hidden if every part of it is
// further than the horizon and lower than that.
const HORIZ_Y0=44-2,HORIZ_U={value:new THREE.Vector4(0,0,0,HORIZ_Y0)};
function horizHidden(cx,cy,cz,hr,top){
  const k=CURVE_U.value;if(!(k>0))return false;const C=CURVE_CAM,h=C.y-HORIZ_Y0;if(h<=0)return false;
  const d=Math.hypot(cx-C.x,cz-C.z),dn=d-hr;if(dn<=Math.sqrt(h/k))return false;
  const Y=top-C.y,df=d+hr;let f=Math.max(Y/dn-k*dn,Y/df-k*df);
  if(Y<0){const sm=Math.sqrt(-Y/k);if(sm>dn&&sm<df)f=Math.max(f,-2*Math.sqrt(-Y*k));}
  return f<-2*Math.sqrt(h*k)-1e-4;
}
{const F=THREE.Frustum&&THREE.Frustum.prototype;if(F&&F.intersectsObject){const orig=F.intersectsObject,sp=new THREE.Sphere();
  F.intersectsObject=function(o){const k=CURVE_U.value,g=o.geometry;if(!k||!g)return orig.call(this,o);
    if(g.boundingSphere===null)g.computeBoundingSphere();sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    if(!o.isInstancedMesh&&horizHidden(sp.center.x,sp.center.y,sp.center.z,sp.radius,sp.center.y+sp.radius))return false;   // (over the horizon)
    const d=Math.hypot(sp.center.x-CURVE_CAM.x,sp.center.z-CURVE_CAM.z),r=sp.radius,lo=k*Math.max(0,d-r)**2,hi=k*(d+r)**2;
    sp.center.y-=(lo+hi)/2;sp.radius+=Math.abs(hi-lo)/2;return this.intersectsSphere(sp);};}}
let posSaveT=0;const CS=16, H=200, G=44, CELL=32, ROADW=8, SAVE_KEY='goblin-city-v92';
// one city block: road, sidewalk, the plot (buildings, parks), sidewalk again; building floors every FH blocks
const SW=3,PL0=ROADW+SW,PL1=CELL-SW,PW=PL1-PL0,PC=PL0+(PW>>1),RC=ROADW>>1,FH=5,STZ=PC-1;
// traffic control at each intersection, one fixture per approach (indexed by car direction 0..3):
// c = the sidewalk corner on the driver's right (relative to the intersection's corner), s = which way the signal arm reaches over the lane
const APPR=[{c:[-1,-1],s:[1,0]},{c:[-1,ROADW],s:[0,-1]},{c:[ROADW,ROADW],s:[-1,0]},{c:[ROADW,-1],s:[0,1]}];
// ES: size of hippos, goblins and cars relative to the blocks (below 1 = the city feels bigger)
const ES=0.85;
const V3=THREE.Vector3;
const mod=(a,n)=>((a%n)+n)%n;
// view distance in chunks (16 blocks each), set from the menu slider; split screen draws a bit less
// render distance, in blocks; past VOXEL_MAX chunks the city is drawn as simplified far boxes
// how long fires and smoke last (a multiple of their natural burn time; the last step keeps them going for good)
const FIRE_DURS=[{m:1,l:'Brief'},{m:2,l:'Short'},{m:4,l:'Normal'},{m:8,l:'Long'},{m:16,l:'Very long'},{m:Infinity,l:'Forever'}],FIREDUR_KEY='goblin-stompin-gus-firedur';
// and how many may burn at once (the oldest goes out to make room)
const FIRE_CAPS=[5,10,20,35,50,70,100,140,200,Infinity],FIRECAP_KEY='goblin-stompin-gus-firecap';
let fireCapI=5;try{const v=parseInt(localStorage.getItem(FIRECAP_KEY));if(v>=0&&v<FIRE_CAPS.length)fireCapI=v;}catch(e){}
let fireDurI=2;try{const v=parseInt(localStorage.getItem(FIREDUR_KEY));if(v>=0&&v<FIRE_DURS.length)fireDurI=v;}catch(e){}
const VIEW_KEY='goblin-stompin-gus-view';let viewSetting=112;
const VIEW_MIN=48,VIEW_MAX=8000,VOXEL_MAX=64;
// the full-detail distance (the smashable voxel city, and the traffic, goblins and props that live in it), in blocks
const DETAIL_KEY='goblin-stompin-gus-detail',DETAIL_MIN=48,DETAIL_MAX=1024;let detailSetting=null;
// traffic density: scales the number of cars on the road
const TRAFFIC_KEY='goblin-stompin-gus-traffic';let traffic=1;
try{const v=localStorage.getItem(TRAFFIC_KEY);if(v!==null&&+v>=0&&+v<=10)traffic=+v;}catch(e){}
// crowd density: scales hostile goblins and civilians (0 = an empty city)
const CROWD_KEY='goblin-stompin-gus-crowd';let crowd=1;
const CROWD_MAX=30;   // (3000%: up to about 420 hostile goblins, which the batched drawing and crowding grid can take)
try{const v=localStorage.getItem(CROWD_KEY);if(v!==null&&+v>=0&&+v<=CROWD_MAX)crowd=+v;}catch(e){}
// day/night speed: how fast the clock runs (0 = frozen at the current time of day)
const DAYSPD_KEY='goblin-stompin-gus-dayspeed',DAY_SPEEDS=[0,0.25,0.5,1,2,4,8,16];let daySpd=3;
try{const v=localStorage.getItem(DAYSPD_KEY);if(v!==null&&+v>=0&&+v<DAY_SPEEDS.length)daySpd=+v;}catch(e){}
try{let v=+localStorage.getItem(VIEW_KEY);if(v>=3&&v<=20)v*=CS;if(v>=VIEW_MIN&&v<=VIEW_MAX)viewSetting=v;}catch(e){}
try{const v=+localStorage.getItem(DETAIL_KEY);if(v>=DETAIL_MIN&&v<=DETAIL_MAX)detailSetting=v;}catch(e){}
if(detailSetting===null)detailSetting=Math.min(224,viewSetting);   // (what the one old slider gave)
// where the fog fully hides things; traffic is born and removed beyond the part of it you can make out
const viewFar=()=>viewR*CS-6;
const VIEW_SOLO=()=>Math.max(3,Math.min(VOXEL_MAX,Math.round(detailSetting/CS))),VIEW_COOP=()=>Math.max(3,Math.round(VIEW_SOLO()*0.7));
// how far you can see at all (voxels plus the far city); split screen draws 70% of it
const lodFar=()=>Math.max(viewFar(),viewSetting*(players[1]&&players[1].active?0.7:1));
let viewR=VIEW_SOLO();

