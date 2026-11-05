// ---------- Traffic ----------
const cars=[];
const PAINTS=[0x4c8a2a,0x8a3b2a,0x2a6fdb,0x8a8a2a,0x5a2a6a,0xc9a02a,0x2a7a7a,0xa83232,0x3a3f46,0xd6d2c4];
const CARC={stripe:0xf4efe4,glass:0x1b2a3c,tire:0x16181c,hub:0x9aa0a8,bumper:0x22252b,head:0xffe9a0,tail:0xd2302a};
const sharedMat={};const smat=c=>sharedMat[c]||(sharedMat[c]=new THREE.MeshLambertMaterial({color:c}));
function snowCar(mat,c){
  mat.snowU=c.snowU;   // (batDraw reads each box's snow from here)
  mat.onBeforeCompile=sh=>{sh.uniforms.uCarSnow=c.snowU;sh.uniforms.uLightC=WORLD_LIGHT;
    sh.vertexShader='varying float vUp;varying vec3 vWp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vUp=normalize((modelMatrix*vec4(objectNormal,0.0)).xyz).y;vWp=position;');
    sh.fragmentShader='uniform float uCarSnow;uniform vec3 uLightC;varying float vUp;varying vec3 vWp;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','float sn=fract(sin(dot(mod(floor(vWp.xz*5.0+0.001),509.0),vec2(12.9898,78.233)))*43758.5453);float sc=smoothstep(0.55,0.85,vUp)*step(sn,uCarSnow*1.15)*step(0.002,uCarSnow);\n float sg=fract(sin(dot(mod(floor(vWp.xz*16.0+vWp.y*7.0+0.001),997.0),vec2(39.346,11.135)))*43758.5453);float sv=0.84+0.11*sg+0.03*step(0.93,sg);\n gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(sv,sv+0.012,sv+0.03)*max(uLightC,vec3(0.22)),sc);\n#include <dithering_fragment>');};
  mat.customProgramCacheKey=()=>'carsnow';return mat;
}
function makeCar(i,police){
  const c={police:!!police,parked:false,spot:null,g:new THREE.Group(),pos:new V3(),kv:new V3(),heading:0,speed:0,steer:0,vy:0,wheels:[],front:[],alive:false,hp:30,dir:0,hunter:false,lastInter:-1,reverseT:0,stuckT:0,ramCD:0,hurt:0,smokeT:0,respawnT:1+i*0.6,honkT:0};
  c.color=police?0x1c1e24:PAINTS[i%PAINTS.length];c.snowU={value:0};c.paint=snowCar(new THREE.MeshLambertMaterial({color:c.color}),c);
  c.vehG={};const gcar=new THREE.Group();c.g.add(gcar);c.vehG.car={g:gcar,wheels:c.wheels,front:c.front};
  const b=(w,h,d,m,x,y,z,p=gcar)=>{const o=new THREE.Mesh(boxGeo(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
  b(2.0,0.6,3.8,c.paint,0,0.78,0);b(2.06,0.1,3.86,smat(CARC.stripe),0,1.0,0);
  if(police){
    // black-and-white with a light bar
    b(2.04,0.3,1.5,smat(0xf2f2ee),0,0.78,0.15);
    c.lightR=new THREE.MeshBasicMaterial({color:0x401010});c.lightB=new THREE.MeshBasicMaterial({color:0x101a40});
    b(0.55,0.15,0.32,c.lightR,-0.3,1.76,-0.25);b(0.55,0.15,0.32,c.lightB,0.3,1.76,-0.25);
  }
  b(1.7,0.6,1.9,c.paint,0,1.38,-0.25);b(1.72,0.4,1.55,smat(CARC.glass),0,1.4,-0.25);b(1.5,0.4,1.92,smat(CARC.glass),0,1.4,-0.25);
  for(const s of[-1,1]){b(0.35,0.18,0.06,smat(CARC.head),s*0.65,0.85,1.91);b(0.35,0.15,0.06,smat(CARC.tail),s*0.65,0.85,-1.91);}
  b(2.06,0.18,0.15,smat(CARC.bumper),0,0.52,1.92);b(2.06,0.18,0.15,smat(CARC.bumper),0,0.52,-1.92);
  for(const [x,z] of [[-1,1.25],[1,1.25],[-1,-1.25],[1,-1.25]]){
    const piv=new THREE.Group();piv.position.set(x*0.95,0.38,z);gcar.add(piv);
    const spin=new THREE.Group();piv.add(spin);b(0.32,0.72,0.72,smat(CARC.tire),0,0,0,spin);b(0.34,0.26,0.26,smat(CARC.hub),0,0,0,spin);
    c.wheels.push(spin);if(z>0)c.front.push(piv);
  }
  // goblin driver poking out of the sunroof
  const dh=new THREE.Group();dh.position.set(0.35,1.4,-0.1);c.g.add(dh);c.dh=dh;
  b(0.48,0.42,0.42,smat(GC.skin),0,0.45,0,dh);
  for(const s of[-1,1]){const e=b(0.3,0.1,0.06,smat(GC.skin),s*0.36,0.52,0,dh);e.rotation.z=s*0.35;b(0.1,0.07,0.03,smat(GC.eye),s*0.11,0.51,0.22,dh);}
  // hazard lights: four amber lamps at the corners, only shown (blinking) when it's broken down on the shoulder
  c.hazM=new THREE.MeshBasicMaterial({color:0x3a2408});c.hazG=new THREE.Group();c.hazG.visible=false;c.g.add(c.hazG);
  for(let k=0;k<4;k++)b(0.26,0.16,0.08,c.hazM,0,0,0,c.hazG);
  c.g.rotation.order='YXZ';c.pitch=0;c.roll=0;c.grounded=true;c.spinP=0;c.spinR=0;
  setVeh(c,'car');
  c.g.visible=false;scene.add(c.g);return c;
}
// ---- vehicle types: sizes (before the world scale ES) and roof heights along their length (for standing on them)
const VEH={bus:{hx:1.25,hz:5.2,hy:3.3,head:[0.5,2.7,4.3],roof:l=>3.3},
  car:{hx:1.0,hz:1.9,hy:1.6,head:[0.35,1.4,-0.1],roof:l=>l>-1.2&&l<0.7?1.68:1.1},
  van:{hx:1.05,hz:2.4,hy:2.3,head:[0.4,2.15,0.6],roof:l=>2.25},
  pickup:{hx:1.0,hz:2.6,hy:1.9,head:[0.35,1.9,0.5],roof:l=>l>-0.4&&l<1.4?1.95:1.0},
  truck:{hx:1.2,hz:3.5,hy:3.3,head:[0.45,2.05,2.4],roof:l=>l>1.6?2.1:3.2},
  semi:{hx:1.25,hz:6.6,hy:3.9,head:[0.5,3.1,4.2],roof:l=>l>2.4?(l>5.0?1.75:3.1):3.85},
  fire:{hx:1.2,hz:3.7,hy:3.0,head:[0.45,2.6,2.3],roof:l=>l>1.6?2.5:3.0},
  amb:{hx:1.15,hz:3.0,hy:2.8,head:[0.4,2.2,1.9],roof:l=>l>1.2?2.0:2.8},
  news:{hx:1.05,hz:2.4,hy:2.3,head:[0.4,2.15,0.6],roof:l=>2.25},
  bike:{hx:0.45,hz:1.15,hy:1.7,head:[0,1.62,-0.2],roof:l=>l>-0.7&&l<0.3?1.2:0.95}};
// which vehicles each kind of traffic is made of
const VEH_MIX={street:[['car',0.58],['bike',0.08],['van',0.12],['pickup',0.12],['truck',0.10]],hw:[['car',0.5],['bike',0.05],['van',0.1],['pickup',0.1],['truck',0.12],['semi',0.13]],park:[['car',0.67],['bike',0.08],['van',0.12],['pickup',0.13]]};
const pickVeh=mix=>{let u=Math.random();for(const [t,p] of VEH_MIX[mix]){if(u<p)return t;u-=p;}return'car';};
// build (once) and show a vehicle body on a car object; its size, wheel footprint and roof go with it
function setVeh(c,t){
  if(!c.vehG[t])c.vehG[t]=buildVeh(c,t);
  for(const k in c.vehG)c.vehG[k].g.visible=k===t;
  const V=VEH[t],G2=c.vehG[t];c.veh=t;c.wheels=G2.wheels;c.front=G2.front;
  c.hx=V.hx*ES;c.hz=V.hz*ES;c.hy=V.hy*ES;
  c.pts=[[0,0],[V.hx*0.9,V.hz-0.2],[-V.hx*0.9,V.hz-0.2],[V.hx*0.9,-V.hz+0.2],[-V.hx*0.9,-V.hz+0.2]].map(([a,b])=>[a*ES,b*ES]);
  if(t==='semi')c.pts.push([0,(V.hz/2)*ES],[0,(-V.hz/2)*ES]);
  c.dh.position.set(...V.head);
  if(c.hazG)c.hazG.children.forEach((m,k)=>m.position.set((k&1?1:-1)*(V.hx-0.12),t==='semi'||t==='truck'?1.05:0.86,(k&2?1:-1)*(V.hz+0.03)));
}
function buildVeh(c,t){
  const g=new THREE.Group();c.g.add(g);const wheels=[],front=[];
  const b=(w,h,d,m,x,y,z,p=g)=>{const o=new THREE.Mesh(boxGeo(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
  const wheel=(x,z,steer,big)=>{const piv=new THREE.Group();piv.position.set(x,big?0.5:0.38,z);g.add(piv);const sp=new THREE.Group();piv.add(sp);
    const r=big?0.96:0.72;b(0.34,r,r,smat(CARC.tire),0,0,0,sp);b(0.36,r*0.36,r*0.36,smat(CARC.hub),0,0,0,sp);wheels.push(sp);if(steer)front.push(piv);};
  const lights=(w,y,zf,zb)=>{for(const s2 of[-1,1]){b(0.35,0.18,0.06,smat(CARC.head),s2*w,y,zf);b(0.35,0.16,0.06,smat(CARC.tail),s2*w,y,zb);}};
  const glass=smat(CARC.glass),bump=smat(CARC.bumper),cargo=c.cargoM||(c.cargoM=snowCar(new THREE.MeshLambertMaterial({color:c.color===0xf2f2ee?0xd8d8d0:0xeeeee6}),c)),dark=smat(0x2a2d33),chrome=smat(0xb8bcc0);
  if(t==='van'){
    // a boxy delivery van: tall body, short sloped nose, windows up front only
    b(2.1,1.75,4.4,c.paint,0,1.32,-0.15);b(2.06,0.9,0.5,c.paint,0,0.95,2.3);
    b(1.94,0.6,0.08,glass,0,1.85,2.06);for(const s2 of[-1,1])b(0.06,0.55,1.0,glass,s2*1.06,1.85,1.45);
    b(2.16,0.1,4.46,smat(CARC.stripe),0,1.05,-0.15);b(2.16,0.2,0.15,bump,0,0.55,2.58);b(2.16,0.2,0.15,bump,0,0.55,-2.4);
    lights(0.7,0.95,2.57,-2.39);
    for(const [x,z,st] of [[-1,1.6,1],[1,1.6,1],[-1,-1.55,0],[1,-1.55,0]])wheel(x*1.0,z,st);
  } else if(t==='bus'){
    // a yellow school bus: a long body, a row of windows down each side, a stubby bonnet
    const yel=c.busM||(c.busM=snowCar(new THREE.MeshLambertMaterial({color:0xf2b705}),c));
    b(2.4,0.45,10.4,dark,0,0.75,0);b(2.5,2.3,8.8,yel,0,2.0,-0.7);b(2.3,1.1,1.6,yel,0,1.45,4.4);
    for(const s2 of[-1,1]){for(let k=0;k<7;k++)b(0.06,0.7,0.9,glass,s2*1.26,2.45,3.0-k*1.2);b(0.06,0.14,8.6,dark,s2*1.27,1.55,-0.7);}
    b(2.2,0.8,0.08,glass,0,2.5,3.72);b(2.4,0.6,0.08,glass,0,2.45,-5.1);
    b(2.5,0.22,0.15,bump,0,0.62,5.2);b(2.5,0.22,0.15,bump,0,0.62,-5.12);lights(0.85,1.15,5.2,-5.12);
    for(const [x,z,st] of [[-1,3.6,1],[1,3.6,1],[-1,-3.0,0],[1,-3.0,0]])wheel(x*1.08,z,st,true);
  } else if(t==='pickup'){
    // cab up front, open bed behind with low sides and a tailgate
    b(2.0,0.6,5.0,c.paint,0,0.8,0);b(1.96,0.85,1.9,c.paint,0,1.53,0.5);
    b(1.84,0.5,0.08,glass,0,1.6,1.46);b(1.84,0.4,0.08,glass,0,1.6,-0.46);for(const s2 of[-1,1])b(0.06,0.45,1.3,glass,s2*1.01,1.62,0.5);
    for(const s2 of[-1,1])b(0.12,0.5,2.04,c.paint,s2*0.94,1.35,-1.48);b(1.74,0.5,0.12,c.paint,0,1.35,-2.44);
    b(2.06,0.2,0.15,bump,0,0.52,2.55);b(2.06,0.2,0.15,bump,0,0.52,-2.55);b(1.3,0.26,0.1,chrome,0,0.92,2.53);
    lights(0.7,0.9,2.52,-2.52);
    for(const [x,z,st] of [[-1,1.65,1],[1,1.65,1],[-1,-1.6,0],[1,-1.6,0]])wheel(x*0.97,z,st);
  } else if(t==='truck'){
    // a box truck: cab, then a tall white cargo box, dual rear wheels
    b(2.14,0.4,6.7,dark,0,0.75,0);
    b(2.2,1.5,1.7,c.paint,0,1.6,2.55);b(2.0,0.6,0.08,glass,0,2.0,3.42);for(const s2 of[-1,1])b(0.06,0.55,0.8,glass,s2*1.11,2.0,2.8);
    b(2.4,2.4,4.8,cargo,0,2.15,-0.9);b(2.46,0.25,4.86,c.paint,0,1.2,-0.9);
    b(2.26,0.25,0.15,bump,0,0.6,3.45);b(2.3,0.2,0.15,bump,0,0.6,-3.35);
    lights(0.8,1.05,3.43,-3.34);
    for(const [x,z,st] of [[-1,2.45,1],[1,2.45,1],[-1,-1.4,0],[1,-1.4,0],[-1,-2.5,0],[1,-2.5,0]])wheel(x*1.05,z,st,true);
  } else if(t==='fire'){
    // a fire engine: red, a crew cab with a light bar, lockers down the sides, a ladder on top
    const red=c.fireM||(c.fireM=snowCar(new THREE.MeshLambertMaterial({color:0xc8201c}),c)),wht=smat(0xf2f2ee);
    b(2.24,0.45,7.1,dark,0,0.75,0);b(2.3,1.6,2.2,red,0,1.75,2.5);b(2.1,0.6,0.08,glass,0,2.15,3.62);for(const s2 of[-1,1])b(0.06,0.55,1.4,glass,s2*1.16,2.15,2.4);
    b(2.4,1.7,4.6,red,0,1.75,-1.2);b(2.46,0.18,4.66,wht,0,1.2,-1.2);for(const s2 of[-1,1])for(let k=0;k<3;k++)b(0.04,1.1,1.3,chrome,s2*1.21,1.85,-0.1-k*1.5);
    for(const s2 of[-1,1])b(0.12,0.12,5.8,chrome,s2*0.55,2.75,-0.6);for(let k=0;k<10;k++)b(1.0,0.08,0.08,chrome,0,2.75,2.2-k*0.6);
    const lr=new THREE.MeshBasicMaterial({color:0xff2a2a}),lb=new THREE.MeshBasicMaterial({color:0x3a7aff});b(0.6,0.18,0.35,lr,-0.45,2.62,3.0);b(0.6,0.18,0.35,lb,0.45,2.62,3.0);c.flash=[lr,lb];
    b(2.36,0.25,0.15,chrome,0,0.65,3.65);b(2.4,0.25,0.15,bump,0,0.65,-3.6);lights(0.85,1.05,3.65,-3.6);
    for(const [x,z,st] of [[-1,2.6,1],[1,2.6,1],[-1,-1.6,0],[1,-1.6,0],[-1,-2.7,0],[1,-2.7,0]])wheel(x*1.05,z,st,true);
  } else if(t==='amb'){
    // an ambulance: a white box body with a red stripe and cross, a cab up front, a light bar
    const wht=c.ambM||(c.ambM=snowCar(new THREE.MeshLambertMaterial({color:0xf4f4f0}),c)),red=smat(0xd0201c);
    b(2.14,0.4,5.9,dark,0,0.7,0);b(2.2,1.3,1.5,wht,0,1.45,2.15);b(2.0,0.55,0.08,glass,0,1.85,2.92);for(const s2 of[-1,1])b(0.06,0.5,0.9,glass,s2*1.11,1.85,2.2);
    b(2.4,2.2,3.9,wht,0,1.95,-0.75);b(2.46,0.3,3.96,red,0,1.4,-0.75);
    for(const s2 of[-1,1]){b(0.04,0.7,0.22,red,s2*1.22,2.35,-0.75);b(0.04,0.22,0.7,red,s2*1.22,2.35,-0.75);}
    b(0.7,0.22,0.04,red,0,2.35,-2.72);b(0.22,0.7,0.04,red,0,2.35,-2.72);
    const lr=new THREE.MeshBasicMaterial({color:0xff2a2a}),lw=new THREE.MeshBasicMaterial({color:0xffffff});b(0.55,0.18,0.3,lr,-0.4,2.22,2.4);b(0.55,0.18,0.3,lw,0.4,2.22,2.4);c.flash=[lr,lw];
    b(2.26,0.22,0.15,bump,0,0.55,2.95);b(2.3,0.22,0.15,bump,0,0.55,-2.75);lights(0.8,0.95,2.94,-2.74);
    for(const [x,z,st] of [[-1,1.9,1],[1,1.9,1],[-1,-1.8,0],[1,-1.8,0]])wheel(x*1.02,z,st,true);
  } else if(t==='news'){
    // a TV news van: a white delivery van in the station's colour and name, a satellite dish up on a mast
    const wht=c.newsM||(c.newsM=snowCar(new THREE.MeshLambertMaterial({color:0xf4f4f0}),c));c.newsStripe=new THREE.MeshLambertMaterial({color:0x0d2a5a});
    b(2.1,1.75,4.4,wht,0,1.32,-0.15);b(2.06,0.9,0.5,wht,0,0.95,2.3);
    b(1.94,0.6,0.08,glass,0,1.85,2.06);for(const s2 of[-1,1])b(0.06,0.55,1.0,glass,s2*1.06,1.85,1.45);
    b(2.16,0.3,4.46,c.newsStripe,0,0.82,-0.15);b(2.16,0.2,0.15,bump,0,0.55,2.58);b(2.16,0.2,0.15,bump,0,0.55,-2.4);
    c.newsLogo=[-1,1].map(s2=>b(0.04,0.7,2.6,smat(0xf4f4f0),s2*1.06,1.55,-0.7));
    b(0.8,0.14,0.8,dark,0,2.25,-1.1);b(0.14,1.1,0.14,chrome,0,2.8,-1.1);
    const dish=b(1.25,1.25,0.1,wht,0,3.4,-1.0);dish.rotation.x=-0.7;b(0.08,0.08,0.5,chrome,0,3.55,-0.75);
    lights(0.7,0.95,2.57,-2.39);
    for(const [x,z,st] of [[-1,1.6,1],[1,1.6,1],[-1,-1.55,0],[1,-1.55,0]])wheel(x*1.0,z,st);
  } else if(t==='bike'){
    // a motorcycle: two wheels, a tank and seat, a headlamp on the forks, and the goblin riding it astride (his head is
    // the driver's head every vehicle has)
    const piv=new THREE.Group();piv.position.set(0,0.38,0.82);g.add(piv);const sp=new THREE.Group();piv.add(sp);
    b(0.2,0.76,0.76,smat(CARC.tire),0,0,0,sp);b(0.22,0.3,0.3,smat(CARC.hub),0,0,0,sp);wheels.push(sp);front.push(piv);
    for(const s2 of[-1,1])b(0.06,0.7,0.06,chrome,s2*0.14,0.38,-0.1,piv);   // (the forks turn with the front wheel)
    b(0.9,0.06,0.06,dark,0,0.78,-0.16,piv);b(0.22,0.2,0.1,smat(CARC.head),0,0.62,0.02,piv);
    {const sp2=new THREE.Group();sp2.position.set(0,0.38,-0.82);g.add(sp2);b(0.24,0.76,0.76,smat(CARC.tire),0,0,0,sp2);b(0.26,0.3,0.3,smat(CARC.hub),0,0,0,sp2);wheels.push(sp2);}
    b(0.3,0.3,1.3,dark,0,0.62,0);b(0.42,0.32,0.62,c.paint,0,0.92,0.35);b(0.36,0.14,0.8,smat(0x1a1a1a),0,0.86,-0.32);
    b(0.34,0.12,0.5,c.paint,0,0.62,-0.85);b(0.2,0.12,0.06,smat(CARC.tail),0,0.66,-1.11);for(const s2 of[-1,1])b(0.1,0.1,0.8,chrome,s2*0.2,0.45,-0.55);
    // the rider: a tunic, arms out to the bars, legs down to the pegs
    const sk=smat(GC.skin),tun=smat(GC.tunic);b(0.5,0.62,0.36,tun,0,1.27,-0.22);b(0.52,0.1,0.38,smat(GC.belt),0,0.99,-0.22);
    for(const s2 of[-1,1]){const a=b(0.16,0.16,0.62,sk,s2*0.3,1.33,0.12);a.rotation.x=0.35;const l=b(0.18,0.5,0.2,tun,s2*0.24,0.78,-0.05);l.rotation.x=-0.5;}
  } else if(t==='semi'){
    // an articulated lorry, carried as one rigid body: tractor (long nose, tall cab, stacks) and a big box trailer
    b(2.24,0.45,4.3,dark,0,0.8,4.2);
    b(2.0,1.1,1.4,c.paint,0,1.45,5.75);b(1.6,0.8,0.1,chrome,0,1.3,6.47);
    b(2.4,2.4,2.0,c.paint,0,2.0,4.1);b(2.4,0.6,1.0,c.paint,0,3.5,3.6);
    b(2.2,0.8,0.08,glass,0,2.45,5.12);for(const s2 of[-1,1])b(0.06,0.7,0.9,glass,s2*1.21,2.45,4.55);
    for(const s2 of[-1,1]){b(0.18,2.2,0.18,chrome,s2*1.15,2.9,3.05);b(0.3,0.5,1.0,chrome,s2*1.3,1.0,4.0);}
    b(2.5,2.9,9.2,cargo,0,2.45,-2.0);b(2.56,0.3,9.26,c.paint,0,1.15,-2.0);b(2.3,0.3,9.0,dark,0,0.85,-2.0);
    b(2.36,0.25,0.15,bump,0,0.65,6.55);b(2.5,0.25,0.15,bump,0,0.75,-6.6);
    lights(0.85,1.05,6.55,-6.62);
    for(const [x,z,st] of [[-1,5.6,1],[1,5.6,1],[-1,3.0,0],[1,3.0,0],[-1,2.0,0],[1,2.0,0],[-1,-4.6,0],[1,-4.6,0],[-1,-5.7,0],[1,-5.7,0]])wheel(x*1.05,z,st,true);
  }
  return{g,wheels,front};
}
for(let i=0;i<26;i++)cars.push(makeCar(i));
for(let i=0;i<4;i++){const c=makeCar(100+i,true);c.respawnT=2+i;cars.push(c);}
// parked cars: their own pool, filling car-park decks and supermarket lots near you (nobody inside)
for(let i=0;i<36;i++){const c=makeCar(200+i);c.g.scale.setScalar(ES);c.parkPool=true;c.respawnT=0.5+i*0.15;cars.push(c);}
// highway traffic: its own pool, driving the elevated decks near you
for(let i=0;i<16;i++){const c=makeCar(300+i);c.g.scale.setScalar(ES);c.hwPool=true;c.respawnT=0.5+i*0.2;cars.push(c);}
// broken down (or pulled over) on a highway's shoulder: a few cars kept for that, and a couple of police cars
const PULL=[];
for(let i=0;i<3;i++){const c=makeCar(400+i);c.g.scale.setScalar(ES);c.parkPool=true;c.pullPool=true;c.respawnT=1e9;cars.push(c);PULL.push(c);}
for(let i=0;i<2;i++){const c=makeCar(410+i,true);c.g.scale.setScalar(ES);c.parkPool=true;c.pullPool=true;c.respawnT=1e9;cars.push(c);PULL.push(c);}
// emergency services: fire engines, ambulances and police cars sent out from the stations to whatever's going on
const SVC=[];
for(let i=0;i<9;i++)for(const t of ['fire','amb','police']){const c=makeCar(700+SVC.length,t==='police');c.g.scale.setScalar(ES);if(t!=='police')setVeh(c,t);c.svcPool=t;c.respawnT=1e9;cars.push(c);SVC.push(c);}
for(let i=0;i<6;i++){const c=makeCar(700+SVC.length);c.g.scale.setScalar(ES);setVeh(c,'news');c.svcPool='news';c.respawnT=1e9;cars.push(c);SVC.push(c);}   // (TV stations are few and far between: fewer of these)
// grow the goblin, civilian and car pools when the crowd slider asks for more than they hold
function ensureCrowdPools(){
  const hostNeed=Math.ceil(14*crowd)+6,civNeed=Math.ceil(12*crowd)+2,carNeed=Math.ceil(26*traffic);
  let h=0,cv=0,tr=0;for(const g of goblins){if(g.civ)cv++;else h++;}for(const c of cars)if(!c.police&&!c.parkPool)tr++;
  while(h<hostNeed){addHostile();h++;}
  while(cv<civNeed){addCiv();cv++;}
  while(tr<carNeed){const c=makeCar(tr);c.g.scale.setScalar(ES);cars.push(c);tr++;}
}
ensureCrowdPools();
// ---- pulled over: now and then a car stopped on a highway's hard shoulder with its hazards blinking -- sometimes
// nobody in it (broken down, the driver gone for help), sometimes with a police car pulled in behind, lights going.
// The places it can happen are fixed along each country highway (straight stretches, clear of truck stops and farm
// gates); which of them have a car on any given day is up to the day. ----
const PULL_OFF=6.85;
function pullSpots(R){
  if(R.pulls)return R.pulls;const out=[];R.pulls=out;if(R.kind!=='country'||R.L<420)return out;
  const sx=Math.round(R.pts[0][0]),sz=Math.round(R.pts[0][1]),TS=truckStopOf(R);
  for(let k=0,s=210;s<R.L-210;k++,s+=380){
    const P0=rtPointL(R,s-26),P1=rtPointL(R,s+26);if(P0.tx*P1.tx+P0.tz*P1.tz<0.985)continue;
    if(TS.some(T=>Math.abs(T.s0-s)<100)||tollsOf(R).some(t=>Math.abs(t-s)<120))continue;
    const dir=hash2(sx*5+k*3,sz*7+k)<0.5?1:-1;
    let gate=false;for(let a=-18;a<=18&&!gate;a+=3){const P=rtPointL(R,s+a),x=P.x-P.tz*dir*8.6,z=P.z+P.tx*dir*8.6;if(farmLaneCol(Math.floor(x),Math.floor(z)))gate=true;}
    if(gate)continue;
    out.push({R,s,k,dir,key:'pull'+sx+','+sz+':'+k});
  }
  return out;
}
const pullToday=o=>{const h=hash2(o.R.pts[0][0]*3+o.k*17+dayN*131,o.R.pts[0][1]*7+o.k*5+dayN*29);return h<0.16?{police:hash2(o.k*11+dayN,o.s|0)<0.35,empty:hash2(o.k*13+dayN*7,(o.s|0)+3)<0.45}:null;};
let pullT=0;
function pullCarAt(c,o,s,veh){
  const R=o.R,P=rtPoint(R,s),tx=P.tx*o.dir,tz=P.tz*o.dir,x=P.x-tz*PULL_OFF,z=P.z+tx*PULL_OFF;
  setVeh(c,veh);c.pos.set(x,G+1,z);c.heading=Math.atan2(tx,tz);c.speed=0;c.kv.set(0,0,0);c.hp=30;c.alive=true;c.hunter=false;c.parked=true;c.vy=0;
  c.rt=null;c.hw=null;c.path=null;c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.paint.emissive.setHex(0);c.g.visible=true;
  c.g.position.copy(c.pos);c.g.rotation.set(0,c.heading,0);
}
function managePull(){
  const act=players.filter(p=>p.active);if(!act.length)return;
  const far=viewFar(),RB=Math.min(far+10,230);
  for(const p of act){
    const l=routesNearBox(p.pos.x-RB,p.pos.z-RB,p.pos.x+RB,p.pos.z+RB),rs=new Set();
    for(let q=0;q<l.length;q+=2){const R=l[q];if(rs.has(R)||R.kind!=='country')continue;rs.add(R);
      for(const o of pullSpots(R)){
        const day=pullToday(o);if(!day)continue;
        if(cars.some(c=>c.alive&&c.pullPool&&(c.spot===o.key||c.spot===o.key+'p')))continue;
        if(parkDown[o.key]&&playTime<parkDown[o.key])continue;
        const P=rtPoint(R,o.s),d=Math.hypot(P.x-p.pos.x,P.z-p.pos.z);if(d<45||d>RB)continue;
        if(groundAt(P.x,P.z,G+3)!==G+1)continue;   // (the road there is built, and still there)
        if(d<far*0.8&&visibleToAny(P.x,G+2,P.z))continue;   // (never pops up in plain view: only out in the haze, or unseen)
        const civ=PULL.find(c=>!c.alive&&!c.police),cop=day.police?PULL.find(c=>!c.alive&&c.police):null;
        if(!civ||(day.police&&!cop))continue;
        if(cars.some(c=>c.alive&&!c.pullPool&&Math.hypot(c.pos.x-P.x,c.pos.z-P.z)<16))continue;
        const hv=hash2(o.k*7+dayN*3,(o.s|0)*5),veh=hv<0.55?'car':hv<0.7?'van':hv<0.85?'pickup':hv<0.95?'truck':'semi';
        pullCarAt(civ,o,o.s,veh);civ.spot=o.key;civ.hazard=true;civ.hazG.visible=true;
        if(day.empty&&!day.police){civ.driver=null;civ.dh.visible=false;}else{civ.driver=makeDriver(false);civ.dh.visible=true;}
        if(cop){pullCarAt(cop,o,o.s-o.dir*(civ.hz/ES+cop.hz/ES+3.5)*ES,'car');cop.spot=o.key+'p';cop.pullLit=true;cop.driver=makeDriver(true);cop.dh.visible=true;}
      }}}
}
// police cars park at the stations near you and come after you when you get close
const policeDown={};
const parkDown={};
const r2=c=>c%2?'semi':'truck';
function parkSpots(px,pz){
  const P=plotInfo(px,pz),X0=px*CELL,Z0=pz*CELL,out=[];
  if(P.type==='plains')for(const o of abandonedSpots(px,pz))out.push(o);
  if(P.type==='thieves')for(const [u,v,h,i] of [[8,26,0.3,0],[24,25,-1.2,1],[22,4,1.6,2]])out.push({x:X0+u,z:Z0+v,y:G+1,h,key:px+','+pz+':st'+i,p:0.9});   // (the stolen cars)   // (wrecks dumped in the fields)
  if(P.type==='super'&&P.super.kind==='garage'&&P.b.length){for(const o of garageBays(P.b[0],X0,Z0)){o.key=px+','+pz+':'+o.n+':'+o.bay+':'+o.row;o.p=0.6;out.push(o);}}
  else if(P.type==='grocery'){for(let k=4;k<=8;k++)out.push({x:X0+3*k+2,z:Z0+PL0+3,y:G+1,h:0,key:px+','+pz+':lot'+k,p:0.45});}
  if(P.dealer){
    // the cars for sale: rows across the lot, and two on show in the showroom
    for(let i=0;i<1;i++)for(let j=0;j<4;j++)out.push({x:X0+PL0+15.8,z:Z0+PL0+2+j*4,y:G+1,h:Math.PI/2,key:px+','+pz+':deal'+i+j,p:0.85,veh:['car','car','pickup','van'][(i+j)%4]});
    for(let j=0;j<3;j++)out.push({x:X0+PL0+2+j*4,z:Z0+PL0+15,y:G+1,h:0,key:px+','+pz+':dealb'+j,p:0.85});
    out.push({x:X0+PL0+4.5,z:Z0+PL0+6,y:G+1,h:0.6,key:px+','+pz+':show0',p:0.95});out.push({x:X0+PL0+10,z:Z0+PL0+6.5,y:G+1,h:-0.5,key:px+','+pz+':show1',p:0.95});}
  if(P.type==='trailers')for(const b of P.b){const sx=b.door===1?b.x1+2.2:b.x0-2.2;out.push({x:X0+sx,z:Z0+b.z0+5,y:G+1,h:0,key:px+','+pz+':tr'+b.x0+b.z0,p:0.55,veh:'pickup'});}
  if(P.buses){const B0=P.b[0];for(let k=0;k*13+12<B0.x1-B0.x0;k++)out.push({x:X0+B0.x0+6.5+k*13,z:Z0+PL0+2.4,y:G+1,h:Math.PI/2,key:px+','+pz+':bus'+k,p:0.8,veh:'bus'});}
  if(P.lorries){const L=P.lorries;for(const c of L.cs)out.push(L.wide?{x:X0+L.a,z:Z0+c+0.5,y:G+1,h:Math.PI/2,key:px+','+pz+':lor'+c,p:0.8,veh:r2(c)}:{x:X0+c+0.5,z:Z0+L.a,y:G+1,h:0,key:px+','+pz+':lor'+c,p:0.8,veh:r2(c)});}
  if(P.lots)P.lots.forEach((L,li)=>{if(L.police)return;const skip=li===0&&P.super&&P.super.kind==='hospital'?ambBayIdx(P):null;lotBays(L).forEach((o,k)=>{if(skip&&skip.includes(k))return;out.push({x:X0+o.x,z:Z0+o.z,y:G+1,h:o.h,key:px+','+pz+':L'+li+':'+k,p:0.4});});});
  return out;
}
function spawnParked(c){
  const act=players.filter(p=>p.active);if(!act.length)return false;
  const p=act[Math.floor(Math.random()*act.length)],R=Math.min(75,Math.max(55,viewFar()))-12,PR=Math.ceil(R/CELL),pcx=Math.floor(p.pos.x/CELL),pcz=Math.floor(p.pos.z/CELL);
  const cand=[];
  for(let dx=-PR;dx<=PR;dx++)for(let dz=-PR;dz<=PR;dz++){
    const qx=pcx+dx,qz=pcz+dz,t=plotType(qx,qz);
    if(t==='super'){const S=superOf(qx,qz);if(S.ax!==qx||S.az!==qz)continue;}
    for(const o of parkSpots(qx,qz)){
      if(hash2(Math.floor(o.x)*13+o.y,Math.floor(o.z)*7+o.y*3)>o.p)continue;
      if(parkDown[o.key]&&playTime<parkDown[o.key])continue;
      if(cars.some(q=>q!==c&&q.alive&&q.spot===o.key))continue;
      const d=Math.hypot(o.x-p.pos.x,o.z-p.pos.z);if(d>R)continue;
      cand.push(o);
    }
  }
  cand.sort((a,b)=>Math.hypot(a.x-p.pos.x,a.z-p.pos.z)-Math.hypot(b.x-p.pos.x,b.z-p.pos.z));
  for(let k=0;k<8&&cand.length;k++){
    const o=cand.splice(Math.floor(Math.random()*Math.min(10,cand.length)),1)[0];
    // the bay has to still be there, empty, and not right in front of someone
    const g=supportAt(o.x,o.z,o.y+0.5);if(g===null||Math.abs(g-o.y)>0.3)continue;
    if(solidAt(Math.floor(o.x),o.y,Math.floor(o.z))||solidAt(Math.floor(o.x),o.y+1,Math.floor(o.z)))continue;
    if(players.some(q=>q.active&&Math.hypot(q.pos.x-o.x,q.pos.z-o.z)<6))continue;
    if(visibleToAny(o.x,o.y+1,o.z))continue;   // (never pops into a bay in plain view)
    setVeh(c,o.veh||pickVeh('park'));c.paint.color.setHex(o.rust?RUST_PAINTS[Math.floor(hash2(Math.floor(o.x),Math.floor(o.z))*RUST_PAINTS.length)]:c.color);c.rusted=!!o.rust;c.spot=o.key;c.pos.set(o.x,o.y,o.z);c.heading=o.h;c.speed=0;c.kv.set(0,0,0);c.hp=30;c.alive=true;c.hunter=false;c.parked=true;c.vy=0;c.driver=null;c.dh.visible=false;
    c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.paint.emissive.setHex(0);c.g.visible=true;
    return true;
  }
  return false;
}
// a street car coming up to the foot of an on-ramp (in the lane it leaves from): sometimes it takes it
function onRampAhead(c){
  const x=c.pos.x,z=c.pos.z;let ax,k,m0,side,lat;
  if(c.dir===2){ax='x';k=Math.floor(z/CELL);m0=Math.floor(x/CELL);side=1;lat=z-(k*CELL+14);}
  else if(c.dir===0){ax='x';k=Math.floor(z/CELL)+1;m0=Math.floor(x/CELL)-4;side=-1;lat=(k*CELL-6)-z;}
  else if(c.dir===3){ax='z';k=Math.floor(x/CELL);m0=Math.floor(z/CELL)-4;side=1;lat=x-(k*CELL+14);}
  else{ax='z';k=Math.floor(x/CELL)+1;m0=Math.floor(z/CELL);side=-1;lat=(k*CELL-6)-x;}
  if(lat<5||lat>11)return null;
  if(!(ax==='x'?hwRow(k,m0):hwCol(k,m0))||icOf(ax,k,m0)!==m0)return null;
  const key=ax+k+','+m0+','+side;if(c.rampKey===key)return null;c.rampKey=key;
  if(Math.random()>0.3)return null;
  const R=icRoutes(ax,k,m0,side);R.ax=ax;return R;
}
// ---- highway traffic out on the plains follows the routes' own curving lines: a car on a route keeps to its lane
// (two each way: 1.5 and 4.5 blocks right of the centre line), steering for a point a little way ahead along it. At
// either end it hands over: onto a place's main street (a country highway) or its motorway deck. ----
const RT_LANES=[1.5,4.5];
// where along route R a point is (searching near segment hint i): {i,s,t,cx,cz,tx,tz,sd}
function rtProject(R,x,z,i0){
  const P=R.pts;let best=null,bd=1e18;const a=Math.max(0,(i0??0)-6),b=Math.min(P.length-2,(i0??P.length)+6);
  const lo=i0===undefined?0:a,hi=i0===undefined?P.length-2:b;
  for(let i=lo;i<=hi;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9;let t=((x-ax)*dx+(z-az)*dz)/l2;t=t<0?0:t>1?1:t;
    const cx=ax+dx*t,cz=az+dz*t,d2=(x-cx)*(x-cx)+(z-cz)*(z-cz);if(d2<bd){bd=d2;const l=Math.sqrt(l2);best={i,t,s:R.cum[i]+t*l,cx,cz,tx:dx/l,tz:dz/l,sd:(x-cx)*(-dz/l)+(z-cz)*(dx/l)};}}
  return best;
}
// the point at distance s along R, plus its direction
function rtPoint(R,s){
  s=Math.max(0,Math.min(R.L,s));let lo=0,hi=R.cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(R.cum[m]<=s)lo=m;else hi=m;}
  const [ax,az]=R.pts[lo],[bx,bz]=R.pts[Math.min(lo+1,R.pts.length-1)],l=Math.max(1e-6,R.cum[Math.min(lo+1,R.cum.length-1)]-R.cum[lo]),t=Math.min(1,(s-R.cum[lo])/l);
  const L2=Math.hypot(bx-ax,bz-az)||1;return{x:ax+(bx-ax)*t,z:az+(bz-az)*t,tx:(bx-ax)/L2,tz:(bz-az)/L2,i:lo};
}
// put car c on route R at distance s, heading dir (+1 along it, -1 back), in lane 'lane'
function rtPlace(c,R,s,dir,lane){
  const P=rtPoint(R,s),tx=P.tx*dir,tz=P.tz*dir,x=P.x-tz*lane,z=P.z+tx*lane;
  c.rt={R,dir,lane,i:P.i};c.hw=null;c.path=null;
  c.pos.set(x,rtSurfY(R,s),z);c.heading=Math.atan2(tx,tz);
}
// the routes leaving a place's highway at one of its ends (T, axis, side), with which end of each it is
function routesAtExit(T,ax,side){
  const [ex,ez]=exitPt(T,ax,side),out=[];
  for(let q=0,L=routesNearBox(ex-8,ez-8,ex+8,ez+8);q<L.length;q+=2){const R=L[q];if(out.some(o=>o.R===R))continue;
    if(R.A.T===T&&R.A.ax===ax&&R.A.s===side)out.push({R,dir:1,s:0});else if(R.B.T===T&&R.B.ax===ax&&R.B.s===side)out.push({R,dir:-1,s:R.L});}
  return out;
}
function spawnHw(c){
  const act=players.filter(p=>p.active);if(!act.length)return false;
  const p=act[Math.floor(Math.random()*act.length)],pcx=Math.floor(p.pos.x/CELL),pcz=Math.floor(p.pos.z/CELL),L=[];
  // motorway decks through places near you (for cars joining up an on-ramp, or cruising in town)
  for(let d=-5;d<=5;d++){if(hwRow(pcz+d,pcx))L.push({ax:'x',k:pcz+d});if(hwCol(pcx+d,pcz))L.push({ax:'z',k:pcx+d});}
  c.path=null;c.leaving=false;c.leaveT=0;c.icKey=null;c.cvKey=null;c.rt=null;
  // now and then, a car joins from the street up a nearby on-ramp instead
  if(L.length&&Math.random()<0.22){
    const opts=[];
    for(const H of L){const pa=Math.floor((H.ax==='x'?p.pos.x:p.pos.z)/CELL);for(let m=pa-5;m<=pa+5;m++){const m0=icOf(H.ax,H.k,m);if(m0===m)for(const side of [1,-1])opts.push({H,m0,side});}}
    for(let tries=0;tries<4&&opts.length;tries++){
      const o=opts.splice(Math.floor(Math.random()*opts.length),1)[0],R=icRoutes(o.H.ax,o.H.k,o.m0,o.side),s0=R.on[0];
      const y=groundAt(s0.x,s0.z,G+3);if(Math.abs(y-(G+1))>0.5)continue;if(!segOpen(Math.floor(s0.x/CELL),Math.floor(s0.z/CELL),o.H.ax==='x'?0:1))continue;
      if(Math.hypot(s0.x-p.pos.x,s0.z-p.pos.z)<40&&visibleToAny(s0.x,y+1,s0.z))continue;
      if(cars.some(q=>q!==c&&q.alive&&Math.hypot(q.pos.x-s0.x,q.pos.z-s0.z)<8))continue;
      const nx=R.on[1];
      setVeh(c,(()=>{let t;do t=pickVeh('hw');while(t==='semi');return t;})());
      c.path=R.on.slice(1);c.pathEnd='join';c.join={ax:o.H.ax,dir:R.d,lane:R.outer,y:R.HY+1};c.hw=null;
      c.driver=makeDriver(false);c.dh.visible=true;c.spot=null;c.parked=false;
      c.pos.set(s0.x,y,s0.z);c.heading=Math.atan2(nx.x-s0.x,nx.z-s0.z);c.speed=4;c.kv.set(0,0,0);c.hp=30;c.alive=true;c.hunter=false;c.vy=0;
      c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.paint.emissive.setHex(0);c.g.visible=true;
      return true;
    }
  }
  // the routes out across the plains near you
  const RL=[];{const l=routesNearBox(p.pos.x-170,p.pos.z-170,p.pos.x+170,p.pos.z+170);for(let q=0;q<l.length;q+=2)if(!RL.includes(l[q]))RL.push(l[q]);}
  if(!RL.length&&!L.length)return false;
  const ok=(x,y,z)=>{
    if(groundAt(x,z,y+1)!==y)return false;
    if(cars.some(o=>o!==c&&o.alive&&Math.abs(o.pos.y-y)<2&&Math.hypot(o.pos.x-x,o.pos.z-z)<14+o.hz))return false;
    if(Math.hypot(x-p.pos.x,z-p.pos.z)<70&&visibleToAny(x,y+1,z))return false;
    return true;};
  const go=(x,y,z)=>{setVeh(c,pickVeh('hw'));c.driver=makeDriver(false);c.dh.visible=true;c.spot=null;c.parked=false;
    c.speed=16;c.kv.set(0,0,0);c.hp=30;c.alive=true;c.hunter=false;c.vy=0;
    c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.paint.emissive.setHex(0);c.g.visible=true;};
  for(let tries=0;tries<10;tries++){
    if(RL.length&&(Math.random()<0.75||!L.length)){
      const R=RL[Math.floor(Math.random()*RL.length)],me=rtProject(R,p.pos.x,p.pos.z),dir=Math.random()<0.5?1:-1,lane=RT_LANES[Math.floor(Math.random()*2)];
      const s=me.s+(Math.random()<0.5?-1:1)*(40+Math.random()*Math.max(10,Math.min(80,viewFar()-45)));if(s<4||s>R.L-4)continue;
      const lane2=R.kind==='country'&&(dir>0?R.L-s:s)<200?1.5:lane,P=rtPoint(R,s),tx=P.tx*dir,tz=P.tz*dir,x=P.x-tz*lane2,z=P.z+tx*lane2,y=rtSurfY(R,s);
      if(settlementAt(Math.floor(x/CELL),Math.floor(z/CELL)))continue;
      if(!ok(x,y,z))continue;
      rtPlace(c,R,s,dir,lane2);c.rt.split=true;go(x,y,z);c.pos.set(x,y,z);return true;
    }
    if(!L.length)continue;
    const H=L[Math.floor(Math.random()*L.length)],dir=Math.random()<0.5?1:-1,base=H.k*CELL;
    // lanes (2 wide): keep right -- along +x that's the +z side, along +z the -x side
    const lanesPos=H.ax==='x'?(dir>0?[5.5,8.5]:[-0.5,2.5]):(dir>0?[-0.5,2.5]:[5.5,8.5]),lane=base+lanesPos[Math.floor(Math.random()*2)];
    const along=(H.ax==='x'?p.pos.x:p.pos.z)+(Math.random()<0.5?-1:1)*(40+Math.random()*Math.max(10,Math.min(70,viewFar()-45)));
    if(!(H.ax==='x'?hwRow(H.k,Math.floor(along/CELL)):hwCol(H.k,Math.floor(along/CELL))))continue;
    const x=H.ax==='x'?along:lane,z=H.ax==='x'?lane:along,y=hwSurf(H.ax);
    if(!ok(x,y,z))continue;
    go(x,y,z);c.hw={ax:H.ax,dir,lane,y};
    c.pos.set(x,y,z);c.heading=H.ax==='x'?(dir>0?Math.PI/2:-Math.PI/2):(dir>0?0:Math.PI);
    return true;
  }
  return false;
}
function spawnPolice(c){
  for(const p of players){
    if(!p.active)continue;
    const pcx=Math.floor(p.pos.x/CELL),pcz=Math.floor(p.pos.z/CELL),PR=Math.ceil(viewFar()/CELL),minD=playTime<2?24:Math.max(24,viewFar()*0.72);
    for(let dx=-PR;dx<=PR;dx++)for(let dz=-PR;dz<=PR;dz++){
      const px=pcx+dx,pz=pcz+dz;const PI_=plotInfo(px,pz);if(!(PI_.type==='super'&&PI_.super.kind==='police'&&PI_.super.ax===px&&PI_.super.az===pz))continue;
      if(collapses[px+','+pz+',0']!==undefined)continue;
      const k=px+','+pz;if(policeDown[k]&&playTime<policeDown[k])continue;
      const PL=PI_.lots.find(L=>L.police);if(!PL)continue;
      const bays=lotBays(PL).filter((o,i)=>i%2===0).slice(0,6);
      for(let s=0;s<bays.length;s++){
        const spot=k+':'+s;if(cars.some(o=>o!==c&&o.alive&&o.spot===spot))continue;
        const x=px*CELL+bays[s].x,z=pz*CELL+bays[s].z;
        const pd=Math.hypot(x-p.pos.x,z-p.pos.z);if(pd<minD||pd>viewFar()+8)continue;
        if(supportAt(x,z,G+2)!==G+1)continue;
        c.spot=spot;c.pos.set(x,G+1,z);c.heading=bays[s].h;c.speed=0;c.kv.set(0,0,0);c.hp=40;c.alive=true;c.hunter=false;c.parked=true;c.vy=0;c.driver=makeDriver(true);
        c.pitch=c.roll=c.spinP=c.spinR=0;c.grounded=true;c.reverseT=0;c.stuckT=0;c.hurt=0;c.paint.emissive.setHex(0);c.g.visible=true;
        return true;
      }
    }
  }
  return false;
}
let sirenT=0,sirenHi=false;
// more cars when you can see further, so the streets don't thin out
const trafficTarget=()=>Math.round(Math.min(26,(P2.active?11:9)*Math.max(1,viewR/4.5))*traffic);
const LANE_A=ROADW*0.25,LANE_B=ROADW*0.75;
function laneOf(c){
  if(c.dir===0)return Math.floor(c.pos.x/CELL)*CELL+LANE_A;
  if(c.dir===2)return Math.floor(c.pos.x/CELL)*CELL+LANE_B;
  if(c.dir===1)return Math.floor(c.pos.z/CELL)*CELL+LANE_B;
  return Math.floor(c.pos.z/CELL)*CELL+LANE_A;
}
function carFoot(c){return supportMax(c.pos.x,c.pos.z,c.heading,c.pos.y,c.pts);}
