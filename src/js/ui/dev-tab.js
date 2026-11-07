// ---- the Dev tab: tune each move, and watch it. A spare copy of Gus (never in the players list) performs the move in a
// sandbox: block lookups see a flat empty field far from anything, and sounds, effects and smashing are switched off,
// with every hit volume recorded instead. Each frame of the run is recorded (every part of the model), and the
// preview plays that recording back with its own controls. ----
const DEV_SCRIPT={
  walk:{dur:2,inp:t=>({z:-1})},
  dodge:{dur:1.2,inp:t=>({x:t<0.3?-1:0,charge:t<0.08,chargePress:t===0})},
  roll:{dur:1.4,setup:()=>{ABIL.roll=true;},inp:t=>({z:t<0.3?-1:0,dashPress:t===0,dash:t<0.08})},
  blastDash:{dur:1.4,setup:()=>{ABIL.blastDash=true;},inp:t=>({z:t<0.3?-1:0,dashPress:t===0,dash:t<0.08})},
  blastAirDash:{dur:2,setup:()=>{ABIL.blastAirDash=true;},inp:t=>({jumpPress:t===0,jump:t<0.1,chargePress:Math.abs(t-0.35)<0.009,charge:t>=0.35&&t<0.7})},
  trample:{dur:2.4,inp:t=>({z:-1,charge:true,chargePress:t===0})},
  jump:{dur:1.4,inp:t=>({jumpPress:t===0,jump:t<0.1})},
  djump:{dur:2.2,inp:t=>({jumpPress:t===0||Math.abs(t-0.5)<0.009,jump:t<0.1||t>0.5&&t<0.6})},
  longJump:{dur:2.4,inp:t=>({z:-1,charge:t<0.6,chargePress:t===0,jumpPress:Math.abs(t-0.5)<0.009,jump:t>0.5&&t<0.6})},
  blastJump:{dur:3.2,setup:()=>{ABIL.blastJump=true;},inp:t=>({z:-1,charge:t<0.6,chargePress:t===0,jumpPress:Math.abs(t-0.5)<0.009,jump:t>0.5&&t<0.6})},
  dash:{dur:1.8,inp:t=>({jumpPress:t===0,jump:t<0.1,chargePress:Math.abs(t-0.35)<0.009,charge:t>=0.35&&t<0.7})},
  bite:{dur:1.1,inp:t=>({bitePress:Math.abs(t-0.05)<0.009,bite:t>=0.05&&t<0.12})},
  bite2:{dur:1.5,inp:t=>{const pr=[0.05,0.45].some(a=>Math.abs(t-a)<0.009);return{bitePress:pr,bite:pr};}},
  upper:{dur:2.2,inp:t=>{const pr=[0.05,0.45,0.85].some(a=>Math.abs(t-a)<0.009);return{bitePress:pr,bite:pr};}},
  airBite:{dur:1.5,inp:t=>({jumpPress:t===0,jump:t<0.1,bitePress:Math.abs(t-0.3)<0.009,bite:t>=0.3&&t<0.37})},
  stomp1:{dur:1.3,inp:t=>({stomp:t<0.08})},
  stomp2:{dur:2.4,inp:t=>({stomp:t<1.1})},
  stomp3:{dur:3.4,inp:t=>({stomp:t<2.1})},
  groundSpike:{dur:3.6,setup:()=>{ABIL.groundSpike=true;},inp:t=>({stomp:t<2.1})},
  pound:{dur:2,inp:t=>({jumpPress:t===0,jump:t<0.1,stomp:t>=0.35&&t<0.45})},
  pound2:{dur:3.3,inp:t=>({jumpPress:t===0,jump:t<0.1,stomp:t>=0.35&&t<1.95})},
  pound3:{dur:4.1,inp:t=>({jumpPress:t===0,jump:t<0.1,stomp:t>=0.35&&t<3.2})},
  // dropped from 12 blocks up
  crash:{dur:2.2,setup:P=>{P.pos.y+=12;P.peakY=P.pos.y;P.grounded=false;P.vy=0;},inp:t=>({})},
};
const DEVP={key:null,rec:null,f:0,play:true,speed:1,loop:true,yaw:0.75,pitch:0.32,r:null,scene:null,cam:null,PV:null,GB:null,figs:{},nodes:null,pool:{},resimT:0,simKey:'',char:'gus'};
// who's in the preview (the dropdown in its top left corner): Gus and Gertie are the same hippo in all but looks, so they share
// every move and setting; Gnash has only a goblin's moves, under his own names, with a goblin's fixed speeds and his club
const DEV_CHARS=[{k:'gus',n:'Gus'},{k:'gertie',n:'Gertie'},{k:'gnash',n:'Gnash'}],DEV_CHAR_KEY='goblin-stompin-gus-devchar';
const DEV_GNASH={walk:'Walk',trample:'Run',dodge:'Dash',jump:'Jump',bite:'Club swing'};
try{const c=localStorage.getItem(DEV_CHAR_KEY);if(DEV_CHARS.some(o=>o.k===c))DEVP.char=c;}catch(e){}
const devGnash=()=>DEVP.char==='gnash';
const devAbils=()=>devGnash()?DEV_ABIL.filter(D=>DEV_GNASH[D.k]):DEV_ABIL;
const devAbName=D=>devGnash()?DEV_GNASH[D.k]:D.n;
const DEV_O={x:500000.5,z:500000.5};   // where the sandbox is (nothing real is anywhere near)
const devGet=(x,y,z)=>{y=Math.floor(y);return y<=0?BEDROCK:y<G?STONE:y===G?GRASS:AIR;};
function devPV(){
  if(DEVP.PV)return DEVP.PV;
  const PV=makePlayer(0);scene.remove(PV.root);PV.active=true;PV.root.visible=true;PV.root.scale.setScalar(ES);   // (the real hippos are shrunk to ES too)
  for(const m of PV.eyeFront)m.visible=false;for(const m of PV.eyeSide)m.visible=true;
  DEVP.PV=PV;DEVP.figs.hippo=devFig(PV.root);return PV;
}
// a model in the preview: every part of it (what a recording keeps, frame by frame) and its rig
function devFig(root){
  const nodes=[];root.traverse(o=>nodes.push(o));
  // the rig: every pivot (a group, not a drawn part) is a joint, and its bone runs back to the nearest pivot above it
  const J=nodes.filter(o=>!o.isMesh&&!o.isLine&&!o.isPoints),bones=[];
  for(const o of J){let p=o.parent;while(p&&J.indexOf(p)<0)p=p.parent;if(p)bones.push(J.indexOf(p),J.indexOf(o));}
  // a joint with nothing hung below it (a leg, the jaw) gets an end point too: the far end of the parts it carries
  const tips=rigPoints(root).filter(q=>q.p).map(q=>({j:J.indexOf(q.o),p:q.p,name:q.name})).filter(t=>t.j>=0);
  return{root,nodes,skel:{J,bones,tips,P:new Float32Array((J.length+tips.length)*3),v:new THREE.Vector3(),labels:null}};
}
// Gnash: a goblin model in his blue tunic, posed from the player he's acting through (as others see him in the game)
function devGB(){
  if(DEVP.GB)return DEVP.GB;
  const root=new THREE.Group();root.name='root';root.rotation.order='YXZ';root.scale.setScalar(ES);root.visible=false;
  const m=goblinModel(root,{tunic:0x3a5f8a});
  m.head.name='head';m.arm.name='arm.club';m.armL.name='arm.free';m.legs[0].name='leg.L';m.legs[1].name='leg.R';
  DEVP.GB={root,m};DEVP.figs.gob=devFig(root);if(DEVP.scene)DEVP.scene.add(root);return DEVP.GB;
}
// act the move out and record it
function devSimulate(key,ch=DEVP.char){
     // (the last recording's block outlines)
  const gn=ch==='gnash',sc=DEV_SCRIPT[key],PV=devPV(),GB=gn?devGB():null,fig=gn?'gob':'hippo',nodes=DEVP.figs[fig].nodes,N=Math.round(sc.dur*60),M=nodes.length,FL=11;
  const rec={N,M,fig,ch,key,tr:new Float32Array(N*M*FL),pos:new Float32Array(N*4),hits:[],anchors:[]};
  const sv={get,playing,fly:DT.fly,abil:Object.assign({},ABIL),wx:WX.k.snow,gob:DT.gob,pg:PV.gob};
  PV.who=ch==='gertie'?1:0;dressHippo(PV);
  get=devGet;playing=true;DT.fly=false;Object.assign(ABIL,{bite:true,stomp:true,groundSpike:false,pound:true,jump:true,sprint:true,dash:true,roll:false,blastDash:false,blastAirDash:false,crash:true,trample:true,biteCombo:true,double:true,airDash:true,longJump:true,blastJump:false,chargeStomp:true,fullStomp:true,chargePound:true,fullPound:true});WX.k.snow=0;
  SBX={hits:[],anchors:[],frame:0};
  try{
    PV.gob=gn;if(gn){DT.gob=true;PV.wpns=null;gobArms(PV);}   // (a goblin's size, and just his club)
    {const Bd=bodyOf(PV);rec.hurt={hx:Bd.hx,hy:Bd.hy,hz:Bd.hz};}
    placePlayer(PV,new V3(DEV_O.x,G+1,DEV_O.z));PV.active=true;PV.heading=0;PV.cam.yaw=-Math.PI;PV.cam.pitch=-0.3;PV.stam=100;PV.exhausted=false;PV.twirl=0;PV.mvx=PV.mvz=0;
    if(sc.setup)sc.setup(PV);PV.lockT=null;PV.rage=0;PV.voice=null;PV.hbRuns=[];PV.crashT=0;PV.trNow=PV.trWas=false;PV.snowU.value=0;PV.wasCharging=false;PV.sinceCharge=9;PV.airJumps=airJumpsMax();PV.airDash=true;
    const I=PV.in;
    for(let f=0;f<N;f++){
      SBX.frame=f;const t=f/60,v=sc.inp(t);
      I.x=v.x||0;I.z=v.z||0;for(const k of ['charge','chargePress','dash','dashPress','sprint','sprintPress','stomp','bite','bitePress','jumpPress','jump','lockPress','climb','use'])I[k]=!!v[k];I.chargeHeld=I.charge;I.lookX=I.lookY=0;
      if(gn){if(PV.state==='walk')PV.heading=PV.cam.yaw+Math.PI;gobMove(PV,1/60);   // (as updatePlayer runs him: his body faces where he looks)
        gobBodyPose(GB.m,PV);GB.root.position.copy(PV.pos);GB.root.rotation.set(0,PV.heading,0);}
      else updatePlayer(PV,1/60);
      for(let i=0;i<M;i++){const o=nodes[i],b=(f*M+i)*FL,T=rec.tr;T[b]=o.position.x;T[b+1]=o.position.y;T[b+2]=o.position.z;T[b+3]=o.quaternion.x;T[b+4]=o.quaternion.y;T[b+5]=o.quaternion.z;T[b+6]=o.quaternion.w;T[b+7]=o.scale.x;T[b+8]=o.scale.y;T[b+9]=o.scale.z;T[b+10]=o.visible?1:0;}
      rec.pos[f*4]=PV.pos.x-DEV_O.x;rec.pos[f*4+1]=PV.pos.y;rec.pos[f*4+2]=PV.pos.z-DEV_O.z;rec.pos[f*4+3]=PV.heading;
    }
    rec.hits=SBX.hits;rec.anchors=SBX.anchors;
    // each volume stays up for a moment, or until the same kind of volume comes round again (a charge run's, every frame)
    for(let i=0;i<rec.hits.length;i++){const h=rec.hits[i];let u=h.f+24;for(let j=i+1;j<rec.hits.length;j++){const o=rec.hits[j];if(o.f>h.f&&o.kind===h.kind&&o.shape===h.shape){u=Math.min(u,o.f-1);break;}}h.until=Math.max(h.f,u);}
  }catch(e){console.error('dev preview',e);}
  finally{get=sv.get;playing=sv.playing;DT.fly=sv.fly;Object.assign(ABIL,sv.abil);WX.k.snow=sv.wx;PV.gob=sv.pg;DT.gob=sv.gob;SBX=null;PV.snowU.value=0;if(PV.voice)PV.voice=null;}
  // the frame of the preview: around everywhere he went
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,y1=G+2;for(let f=0;f<N;f++){x0=Math.min(x0,rec.pos[f*4]);x1=Math.max(x1,rec.pos[f*4]);z0=Math.min(z0,rec.pos[f*4+2]);z1=Math.max(z1,rec.pos[f*4+2]);y1=Math.max(y1,rec.pos[f*4+1]+2);}
  let rh=0;for(const h of rec.hits)rh=Math.max(rh,h.o.r||0,h.o.len||0,(h.o.sx||0)/2);
  rec.c={x:(x0+x1)/2,y:gn?G+1:G+1.5,z:(z0+z1)/2};rec.rad=Math.max(gn?2.4:4,Math.hypot(x1-x0,z1-z0)/2+2,(y1-G)*0.6,rh+1);
  return rec;
}
function devInitGL(){
  if(DEVP.r)return true;
  try{DEVP.r=new THREE.WebGLRenderer({canvas:document.getElementById('devCanvas'),antialias:true});}catch(e){return false;}
  DEVP.r.setPixelRatio(Math.min(devicePixelRatio||1,2));DEVP.r.setClearColor(0x141a20);
  const S=DEVP.scene=new THREE.Scene();
  S.add(new THREE.HemisphereLight(0xeef2e6,0x3a4030,0.95));const d=new THREE.DirectionalLight(0xffeedd,0.7);d.position.set(3,6,4);S.add(d);
  devFloor(S,DEVP.r);
  // every outline in here (hit volumes, the blocks a smash takes, his skeleton) is drawn as thin strips facing the camera
  DEVP.lb=devLB(10);S.add(DEVP.lb.m);DEVP.sk=devLB(12);S.add(DEVP.sk.m);
  DEVP.cam=new THREE.PerspectiveCamera(40,16/9,0.1,400);
  S.add(devPV().root);S.add(devGB().root);
  return true;
}
// the floor: just an orange grid on the ground, one square per block, a brighter line every 8. Painted onto a see-through
// sheet (a block's edges sit on whole numbers in the world, which is half a block off in here)
function devFloor(S,r){
  {const c=document.createElement('canvas'),T=64,N=8;c.width=c.height=T*N;const x=c.getContext('2d');x.clearRect(0,0,T*N,T*N);
   x.fillStyle='rgba(255,154,42,0.55)';for(let i=0;i<N;i++){x.fillRect(i*T-1,0,3,T*N);x.fillRect(0,i*T-1,T*N,3);}
   x.fillStyle='rgba(255,170,70,0.95)';x.fillRect(0,0,4,T*N);x.fillRect(T*N-4,0,4,T*N);x.fillRect(0,0,T*N,4);x.fillRect(0,T*N-4,T*N,4);
   const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(20,20);tx.anisotropy=r.capabilities.getMaxAnisotropy();
   const fl=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   fl.rotation.x=-Math.PI/2;fl.position.set(0.5,G+1+0.002,0.5);fl.renderOrder=-5;S.add(fl);}
}
// hit volumes in the preview (the same wireframes as the debug overlay)
const DEV_SOLID={};
{const cyl=new THREE.CylinderGeometry(1,1,1,24,1,true);cyl.translate(0,0.5,0);
 const cone=new THREE.ConeGeometry(1,1,24,1,true);cone.rotateX(-Math.PI/2);cone.translate(0,0,0.5);
 const slot=new THREE.BoxGeometry(1,1,1);slot.translate(0,0.5,0.5);
 Object.assign(DEV_SOLID,{semi:new THREE.SphereGeometry(1,20,8,0,Math.PI*2,0,Math.PI/2),box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,20,14),cap:new THREE.SphereGeometry(1,20,14),cyl,cone,slot});}
const DEV_FILL={dmg:new THREE.MeshBasicMaterial({color:0xff3a3a,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}),block:new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}),hurt:new THREE.MeshBasicMaterial({color:0x46f06a,transparent:true,opacity:0.1,depthWrite:false,side:THREE.DoubleSide})};
// a batch of thick lines: segments are gathered in world space, then laid out as strips about px pixels wide, turned to face
// the camera (the browser's own GL lines can come out invisible, so none are used in the preview)
function devLB(order){
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide});
  const geo=new THREE.BufferGeometry(),m=new THREE.Mesh(geo,mat);m.renderOrder=order;m.frustumCulled=false;
  const v=new THREE.Vector3(),w=new THREE.Vector3();
  return{m,geo,n:0,S:new Float32Array(6*4096),K:new Float32Array(4*4096),cap:0,
    reset(){this.n=0;},
    seg(ax,ay,az,bx,by,bz,col,px=2){
      if((this.n+1)*6>this.S.length){const S=new Float32Array(this.S.length*2),K=new Float32Array(this.K.length*2);S.set(this.S);K.set(this.K);this.S=S;this.K=K;}
      const i=this.n*6,j=this.n*4;this.S[i]=ax;this.S[i+1]=ay;this.S[i+2]=az;this.S[i+3]=bx;this.S[i+4]=by;this.S[i+5]=bz;
      this.K[j]=col.r;this.K[j+1]=col.g;this.K[j+2]=col.b;this.K[j+3]=px;this.n++;},
    // every segment of a line geometry, carried by matrix M
    geo2(g,M,col){const a=g.attributes.position;for(let i=0;i+1<a.count;i+=2){v.fromBufferAttribute(a,i).applyMatrix4(M);w.fromBufferAttribute(a,i+1).applyMatrix4(M);this.seg(v.x,v.y,v.z,w.x,w.y,w.z,col);}},
    flush(cam,hpx){
      const n=this.n;if(n>this.cap){this.cap=Math.max(n,this.cap*2,256);
        geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.cap*12),3));geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(this.cap*12),3));
        const I=new Uint32Array(this.cap*6);for(let q=0;q<this.cap;q++){const b=q*4;I.set([b,b+1,b+2,b+1,b+3,b+2],q*6);}geo.setIndex(new THREE.BufferAttribute(I,1));}
      if(!n){m.visible=false;return;}m.visible=true;
      const P=geo.attributes.position.array,Cc=geo.attributes.color.array,S=this.S,K=this.K,cp=cam.position,k=2*Math.tan(cam.fov*Math.PI/360)/Math.max(1,hpx),E=cam.matrixWorld.elements;
      for(let q=0;q<n;q++){const i=q*6,ax=S[i],ay=S[i+1],az=S[i+2],bx=S[i+3],by=S[i+4],bz=S[i+5];
        if(K[q*4+3]<0){   // a dot: a little square facing the camera
          const r=-K[q*4+3]*k/2*Math.hypot(cp.x-ax,cp.y-ay,cp.z-az),o=q*12;let c=0;
          for(const [u,t] of [[-1,-1],[1,-1],[-1,1],[1,1]]){P[o+c]=ax+(E[0]*u+E[4]*t)*r;P[o+c+1]=ay+(E[1]*u+E[5]*t)*r;P[o+c+2]=az+(E[2]*u+E[6]*t)*r;c+=3;}
          for(let c2=0;c2<4;c2++){Cc[o+c2*3]=K[q*4];Cc[o+c2*3+1]=K[q*4+1];Cc[o+c2*3+2]=K[q*4+2];}continue;}
        const dx=bx-ax,dy=by-ay,dz=bz-az,ex=cp.x-(ax+bx)/2,ey=cp.y-(ay+by)/2,ez=cp.z-(az+bz)/2;
        let sx=dy*ez-dz*ey,sy=dz*ex-dx*ez,sz=dx*ey-dy*ex,sl=Math.hypot(sx,sy,sz);
        if(sl<1e-9){sx=1;sy=0;sz=0;sl=1;}sx/=sl;sy/=sl;sz/=sl;
        const px=K[q*4+3]*k/2,wa=px*Math.hypot(cp.x-ax,cp.y-ay,cp.z-az),wb=px*Math.hypot(cp.x-bx,cp.y-by,cp.z-bz),o=q*12;
        P[o]=ax-sx*wa;P[o+1]=ay-sy*wa;P[o+2]=az-sz*wa;P[o+3]=ax+sx*wa;P[o+4]=ay+sy*wa;P[o+5]=az+sz*wa;
        P[o+6]=bx-sx*wb;P[o+7]=by-sy*wb;P[o+8]=bz-sz*wb;P[o+9]=bx+sx*wb;P[o+10]=by+sy*wb;P[o+11]=bz+sz*wb;
        for(let c=0;c<4;c++){Cc[o+c*3]=K[q*4];Cc[o+c*3+1]=K[q*4+1];Cc[o+c*3+2]=K[q*4+2];}}
      geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.setDrawRange(0,n*6);}};
}
const DEV_COL={dmg:new THREE.Color(0xff3a3a),block:new THREE.Color(0xff9a2a),hurt:new THREE.Color(0x46f06a),bone:new THREE.Color(0x5ad2ff),joint:new THREE.Color(0xffffff),tip:new THREE.Color(0xffd75a)};
const devT=new THREE.Object3D();
// (V: which preview, its pool, scene and lines; O: where its field is in the world)
function devDraw(kind,shape,o,used,V=DEVP,O=DEV_O){
  const m=devT;m.rotation.set(o.rx||0,o.rot||0,o.rz||0,'YXZ');m.scale.set(1,1,1);
  const x=o.x-O.x,z=o.z-O.z;let g;
  if(shape==='box'){g=dbgGeo.box;m.scale.set(o.sx,o.sy,o.sz);m.position.set(x,o.y+o.sy/2,z);}
  else if(shape==='cyl'){g=dbgGeo.cyl;m.scale.set(o.r,o.h,o.r);m.position.set(x,o.y,z);}
  else if(shape==='slot'){g=dbgSlotGeo(o.len,o.r);m.scale.set(1,o.h,1);m.position.set(x,o.y,z);}
  else if(shape==='cap'){g=dbgCapGeo(o.dn/o.r,o.up/o.r);m.scale.setScalar(o.r);m.position.set(x,o.y,z);}
  else if(shape==='cone'){g=dbgGeo.cone;m.scale.set(o.r,o.r,o.len);m.position.set(x,o.y,z);}
  else{g=dbgGeo.sph;m.scale.setScalar(o.r);m.position.set(x,o.y,z);}
  m.updateMatrix();V.lb.geo2(g,m.matrix,DEV_COL[kind]);
  // and a faint solid copy of it
  const SP=V.pool['~'+shape]||(V.pool['~'+shape]=[]),k='~'+shape;let q=SP[used[k]||0];
  if(!q){q=new THREE.Mesh(DEV_SOLID[shape]||DEV_SOLID.sph,DEV_FILL.dmg);q.renderOrder=9;q.frustumCulled=false;V.scene.add(q);SP.push(q);}
  used[k]=(used[k]||0)+1;q.visible=true;q.material=DEV_FILL[kind];q.position.copy(m.position);q.rotation.copy(m.rotation);q.scale.copy(m.scale);
  if(shape==='slot'){q.scale.set(2*o.r,o.h,o.len+2*o.r);q.position.set(x-Math.sin(o.rot||0)*o.r,o.y,z-Math.cos(o.rot||0)*o.r);}
  else if(shape==='cap'){q.scale.set(o.r,o.r,o.r);q.geometry=o.dn===0?DEV_SOLID.semi:DEV_SOLID.cap;}
}
// the blocks a smash takes: one outlined cube (and a faint fill) per block
const DEV_CELL_FILL=new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:0.07,depthWrite:false});
const DEV_EDGES=[[0,0,0,1,0,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,1,1,1,1,1],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
function devCells(h,used){
  const C=h.cells,Q=DEVP.pool.cellf||(DEVP.pool.cellf=[]),col=DEV_COL.block,e=0,s=1;
  for(let i=0;i<C.length;i+=3){
    const n=used.cells||0;if(n>=900)return;used.cells=n+1;
    const x=C[i]-DEV_O.x+e,y=C[i+1]+e,z=C[i+2]-DEV_O.z+e;
    for(const E of DEV_EDGES)DEVP.lb.seg(x+E[0]*s,y+E[1]*s,z+E[2]*s,x+E[3]*s,y+E[4]*s,z+E[5]*s,col,1.5);
    let q=Q[n];if(!q){q=new THREE.Mesh(DEV_SOLID.box,DEV_CELL_FILL);q.renderOrder=9;q.frustumCulled=false;DEVP.scene.add(q);Q.push(q);}
    q.position.set(x-e+0.5,y-e+0.5,z-e+0.5);q.rotation.set(0,0,0);q.scale.setScalar(1);q.visible=true;
  }
}
function devApply(fr){
  const R=DEVP.rec,F=R&&DEVP.figs[R.fig];if(!R||!F)return;const f=Math.max(0,Math.min(R.N-1,Math.floor(fr))),M=R.M,FL=11,T=R.tr;
  for(const k in DEVP.figs)if(DEVP.figs[k]!==F)DEVP.figs[k].root.visible=false;
  F.nodes.forEach((o,i)=>{const b=(f*M+i)*FL;o.position.set(T[b],T[b+1],T[b+2]);o.quaternion.set(T[b+3],T[b+4],T[b+5],T[b+6]);o.scale.set(T[b+7],T[b+8],T[b+9]);o.visible=T[b+10]>0.5;});
  F.root.position.x-=DEV_O.x;F.root.position.z-=DEV_O.z;F.root.visible=true;
  // the hit volumes: only on the frames they're live
  for(const k in DEVP.pool)for(const m of DEVP.pool[k])m.visible=false;
  const used={};DEVP.lb.reset();DEVP.sk.reset();
  for(const h of R.hits){if(f!==h.f)continue;const blk=h.kind==='block';if(blk?!devOpt('devShowBlock'):!devOpt('devShowDmg'))continue;
    if(blk&&h.cells)devCells(h,used);devDraw(blk?'block':'dmg',h.shape,h.o,used);}   // (a smash: the blocks it takes, and its volume)
  if(devOpt('devShowHurt')){const px=R.pos[f*4],py=R.pos[f*4+1],pz=R.pos[f*4+2],h=R.pos[f*4+3];
    const B=R.hurt||HIPPO_BODY;devDraw('hurt','box',{x:px+Math.sin(h)*P_OFF+DEV_O.x,y:py,z:pz+Math.cos(h)*P_OFF+DEV_O.z,sx:2*B.hx,sy:B.hy,sz:2*B.hz,rot:h},used);}
  devSkel(F,devOpt('devShowSkel')?DEVP.sk:null,devOpt('devShowBones'));
  document.getElementById('devTime').textContent=(f/60).toFixed(2)+' / '+((R.N-1)/60).toFixed(2)+' s  (frame '+f+')';
  {const ph=document.getElementById('devPh');if(ph)ph.style.left=(f/R.N*100)+'%';}
  const sc=document.getElementById('devScrub');sc.max=String(R.N-1);if(document.activeElement!==sc)sc.value=String(f);
}
// where a figure's joints are now (for the names), and its skeleton drawn into S if that's wanted
function devSkel(F,S,names){
  {const K=F.skel;if(K&&(S||names)){F.root.updateMatrixWorld(true);const P=K.P;
    K.J.forEach((o,i)=>{K.v.setFromMatrixPosition(o.matrixWorld);P[i*3]=K.v.x;P[i*3+1]=K.v.y;P[i*3+2]=K.v.z;});
    K.tips.forEach((t,n)=>{K.v.copy(t.p).applyMatrix4(K.J[t.j].matrixWorld);const a=(K.J.length+n)*3;P[a]=K.v.x;P[a+1]=K.v.y;P[a+2]=K.v.z;});
    if(S){const J=K.J.length;
      for(let i=0;i<K.bones.length;i+=2){const a=K.bones[i]*3,b=K.bones[i+1]*3;S.seg(P[a],P[a+1],P[a+2],P[b],P[b+1],P[b+2],DEV_COL.bone,2.5);}
      K.tips.forEach((t,n)=>{const a=(J+n)*3,b=t.j*3;S.seg(P[b],P[b+1],P[b+2],P[a],P[a+1],P[a+2],DEV_COL.bone,2.5);S.seg(P[a],P[a+1],P[a+2],P[a],P[a+1],P[a+2],DEV_COL.tip,-6);});
      for(let i=0;i<J;i++){const a=i*3;S.seg(P[a],P[a+1],P[a+2],P[a],P[a+1],P[a+2],DEV_COL.joint,-7);}}}}   // (bones, then the joints as dots on top)
}
// the names of his bones, pinned beside each joint (and each end point) on the preview
function devLabels(cam,w,h){devLabelsIn(document.getElementById('devBones'),DEVP.figs,DEVP.rec&&DEVP.rec.fig,devOpt('devShowBones'),cam,w,h);}
// (any preview's: box holds the names, figs its models, fig the one showing)
function devLabelsIn(box,figs,fig,on,cam,w,h){
  const F=fig&&figs[fig],K=F&&F.skel;if(!box||!K)return;
  box.hidden=!on;if(!on)return;
  if(box.dataset.fig!==fig){box.dataset.fig=fig;box.innerHTML='';for(const k in figs)figs[k].skel.labels=null;}   // (another model: its own names)
  if(!K.labels){K.labels=[];const add=(t,tip)=>{const e=document.createElement('span');e.textContent=t;if(tip)e.className='tip';box.appendChild(e);K.labels.push(e);};
    K.J.forEach(o=>add(o.name||'(joint)',false));K.tips.forEach(t=>add(t.name,true));}
  cam.updateProjectionMatrix();const v=K.v,P=K.P,placed=[];
  K.labels.forEach((e,i)=>{v.set(P[i*3],P[i*3+1],P[i*3+2]).project(cam);
    if(v.z>1||v.z<-1){e.style.display='none';return;}e.style.display='';
    let x=(v.x+1)/2*w,y=(1-v.y)/2*h;
    for(let n=0;n<12&&placed.some(q=>Math.abs(q[0]-x)<60&&Math.abs(q[1]-y)<12);n++)y+=13;   // (don't stack names on top of each other)
    placed.push([x,y]);e.style.left=x+'px';e.style.top=y+'px';});
}
const devOpt=id=>{const e=document.getElementById(id);return !!(e&&e.checked);};
function devTick(dt){
  if(!document.getElementById('devSecAbil').open)return;
  if(!devInitGL())return;
  if(!DEVP.key){devSetChar(DEVP.char,true);devSelect(devAbils()[0].k);}
  if(DEVP.resimT>0){DEVP.resimT-=dt;if(DEVP.resimT<=0){const k=DEVP.rec?DEVP.f/DEVP.rec.N:0;DEVP.rec=devSimulate(DEVP.key);DEVP.f=Math.min(DEVP.rec.N-1,k*DEVP.rec.N);if(DEVP.mode==='adv')devRenderTrack();}}
  const R=DEVP.rec;if(!R)return;
  if(DEVP.play){DEVP.f+=dt*60*DEVP.speed;if(DEVP.f>=R.N){if(DEVP.loop)DEVP.f=DEVP.f%R.N;else{DEVP.f=R.N-1;DEVP.play=false;devPlayBtn();}}}
  devApply(DEVP.f);
  // the preview fills what's left of the tab, so the whole of it shows without scrolling (unless it's expanded to the window)
  {const fig=document.querySelector('.devfig'),tab=document.getElementById('tabDev'),wrap=document.getElementById('devWrap');
   if(fig&&tab&&wrap&&!fig.classList.contains('devmax')){const want=Math.max(360,Math.floor(tab.clientHeight-(wrap.offsetHeight-fig.offsetHeight)-4));if(Math.abs(fig.offsetHeight-want)>1)fig.style.height=want+'px';}}
  {const rs=document.getElementById('devRS'),bt=document.querySelector('.devbot');if(rs&&bt)rs.style.bottom=(bt.offsetHeight+16)+'px';}   // (the right-hand panes stop above the timeline)
  const cv=DEVP.r.domElement,w=cv.clientWidth|0,h=cv.clientHeight|0;if(w<10||h<10)return;
  if(cv.width!==Math.round(w*DEVP.r.getPixelRatio())||cv.height!==Math.round(h*DEVP.r.getPixelRatio()))DEVP.r.setSize(w,h,false);
  const C=DEVP.cam,c=R.c,d=R.rad*2.1*(DEVP.zoom||1);C.aspect=w/h;C.updateProjectionMatrix();
  C.position.set(c.x+Math.sin(DEVP.yaw)*Math.cos(DEVP.pitch)*d,c.y+Math.sin(DEVP.pitch)*d+1,c.z+Math.cos(DEVP.yaw)*Math.cos(DEVP.pitch)*d);C.lookAt(c.x,c.y+0.6,c.z);
  // (drawn flat, in daylight, whatever the world's doing)
  const L0=WORLD_LIGHT.value.clone(),cu=CURVE_U.value;WORLD_LIGHT.value.setRGB(1,1,1);CURVE_U.value=0;
  C.updateMatrixWorld();DEVP.lb.flush(C,h);DEVP.sk.flush(C,h);devLabels(C,w,h);
  try{DEVP.r.render(DEVP.scene,C);}finally{WORLD_LIGHT.value.copy(L0);CURVE_U.value=cu;}
}
function devPlayBtn(){document.getElementById('devPlay').innerHTML=DEVP.play?'&#x23F8;':'&#x25B6;';}
function devSelect(k){
  DEVP.key=k;DEVP.f=0;DEVP.play=true;devPlayBtn();
  devMarkAbil();
  devRenderParams();DEVP.rec=devSimulate(k);DEVP.sel=0;if(DEVP.mode==='adv'){devRenderTrack();devRenderHbProps();}
  devRenderGnash();
}
// pick who's in the preview. Gnash's moves are a goblin's, with fixed speeds and his own hits, so the hippo's settings and
// custom hitboxes don't apply to him: in their place, what his move does
function devSetChar(c,quiet){
  if(!DEV_CHARS.some(o=>o.k===c))return;DEVP.char=c;try{localStorage.setItem(DEV_CHAR_KEY,c);}catch(e){}
  const dd=document.getElementById('devChDD');
  if(dd){const C=DEV_CHARS.find(o=>o.k===c);dd.querySelector('button').textContent=C.n;
    for(const li of dd.querySelectorAll('li')){const on=li.dataset.c===c;li.classList.toggle('on',on);li.setAttribute('aria-selected',String(on));}}
  devRenderAbList();
  const gn=devGnash(),pa=document.getElementById('devPaneAb'),pg=document.getElementById('devPaneGn'),tm=document.getElementById('devTlMode');
  if(gn&&DEVP.mode==='adv')devSetMode('simple',true);
  if(pa)pa.hidden=gn;if(pg)pg.hidden=!gn;if(tm)tm.hidden=gn;
  if(quiet)return;
  devSelect(devAbils().some(D=>D.k===DEVP.key)?DEVP.key:devAbils()[0].k);
}
function devRenderAbList(){
  const list=document.getElementById('devList');if(!list)return;
  list.innerHTML=devAbils().map(D=>'<li role="option" data-k="'+D.k+'">'+devAbName(D)+'</li>').join('');devMarkAbil();
}
// what Gnash's move does: a goblin's fixed numbers, and what the recording shows
function devRenderGnash(){
  const box=document.getElementById('devGnData');if(!box||!devGnash())return;const R=DEVP.rec,k=DEVP.key,W=GOB_WPN.club,fr=s=>Math.round(s*60)+' frames ('+(+s.toFixed(2))+' s)';
  const rows=[];const row=(a,b)=>rows.push('<div class="devfd"><span>'+a+'</span><b>'+b+'</b></div>');
  if(k==='walk')row('Walking speed',GOB_WALK+' blocks/s');
  if(k==='trample')row('Running speed',GOB_RUN+' blocks/s'),row('Hits','none (a goblin can\u2019t trample)');
  if(k==='jump')row('Hop (launch speed)',GOB_HOP);
  if(k==='bite'){row('Weapon',W.name);row('Swing',fr(W.dur));row('Lunge',fr(W.lunge));row('Again after',fr(W.cd));row('Damage','1 to goblins and cars');row('Reach','1.1 ahead, 1 round');}
  if(R){let x1=0,y1=0;for(let f=0;f<R.N;f++){x1=Math.max(x1,Math.hypot(R.pos[f*4],R.pos[f*4+2]));y1=Math.max(y1,R.pos[f*4+1]-G-1);}
    row('Recording',R.N+' frames ('+(R.N/60).toFixed(2)+' s)');row('Furthest moved',x1.toFixed(2)+' blocks');row('Highest',y1.toFixed(2)+' blocks up');
    const hf=[...new Set(R.hits.map(h=>h.f))];if(hf.length)row('Hit frames',hf.length>6?hf[0]+' to '+hf[hf.length-1]+' ('+hf.length+')':hf.join(', '));}
  box.innerHTML=rows.join('');
}
const devFmt=(v,st)=>st>=1?String(Math.round(v)):v.toFixed(st>=0.1?1:2);
function devRenderParams(){
  if(devGnash())return;
  const D=DEV_ABIL.find(a=>a.k===DEVP.key),A=AB[D.k],Dd=abDefaults(D.k),box=document.getElementById('devParams');
  const row=(pk,lbl,v,mn,mx,st)=>'<div class="devp'+(Math.abs(v-Dd[pk])>1e-9?' chg':'')+'" data-p="'+pk+'"><span>'+lbl+'</span><input type="range" class="vrange" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'" aria-label="'+lbl+'"><input type="number" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+devFmt(v,st)+'" aria-label="'+lbl+' value"><button type="button" class="rs" title="Default ('+devFmt(Dd[pk],st)+')" aria-label="Reset '+lbl+'">&#x21BA;</button></div>';
  let h=D.ps.map(([pk,lbl,,mn,mx,st])=>row(pk,lbl,A[pk],mn,mx,st)).join('');
  if(D.blk){
    h+='<div class="devp'+(A.shape!==Dd.shape?' chg':'')+'"><span>Damage to blocks: shape</span><span class="devseg" id="devShape" style="grid-column:2 / 5">'+[['orig','Original'],['sphere','Sphere'],['semi','Semi-sphere'],['cube','Cube'],['cone','Cone']].map(([v,n])=>'<button type="button" data-v="'+v+'"'+(A.shape===v?' class="on"':'')+'>'+n+'</button>').join('')+'</span></div>';
    h+=row('size','Damage to blocks: '+(A.shape==='orig'?D.blk[2].toLowerCase():A.shape==='cone'?'cone length (half)':'radius'),A.size,0,12,0.1);
  }
  if(!D.blk)h+='<div class="vnote">This move doesn&rsquo;t smash anything.</div>';
  box.innerHTML=h;
}
function devChanged(){abSave();DEVP.resimT=0.15;devMarkAbil();}
// has this ability been changed from how it comes (any setting, or custom hitboxes switched on)?
function abModified(k){const A=AB[k],D=abDefaults(k);if(hbOn(k))return true;
  for(const pk in D){const a=A&&A[pk],d=D[pk];if(typeof d==='number'?!(Math.abs((+a)-d)<=1e-9):a!==d)return true;}return false;}
// the ability picker: the current one on the button, the changed ones in yellow
function devMarkAbil(){
  const dd=document.getElementById('devAbDD');if(!dd)return;const b=dd.querySelector('button'),D=DEV_ABIL.find(a=>a.k===DEVP.key),gn=devGnash();   // (Gnash's moves can't be changed here: never marked)
  for(const li of dd.querySelectorAll('li')){const k=li.dataset.k,on=k===DEVP.key;li.classList.toggle('on',on);li.setAttribute('aria-selected',String(on));li.classList.toggle('mod',!gn&&abModified(k));}
  if(D){const m=!gn&&abModified(D.k);b.textContent=devAbName(D)+(m?' \u2022':'');b.classList.toggle('mod',m);}
}
// ---- the advanced timeline: the recording's frames across, a row of built-in hits for reference, and a row per custom
// hitbox (drag the bar to move it, its ends to change when it's live); the dashed line is where the move starts ----
const HB_SHAPES=[['sphere','Sphere'],['semi','Semi-sphere'],['cube','Cube'],['cone','Cone'],['cylinder','Cylinder']];
const HB_ICON={sphere:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><ellipse cx="8" cy="8" rx="6.2" ry="2.2"/></svg>',
  semi:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 11a6.2 6.2 0 0 1 12.4 0"/><ellipse cx="8" cy="11" rx="6.2" ry="2.1"/></svg>',
  cube:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l5.6 3.1v6.2L8 14.2l-5.6-3.1V4.9z"/><path d="M2.4 4.9L8 8l5.6-3.1M8 8v6.2"/></svg>',
  cone:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 8L12.6 2.4M1.8 8l10.8 5.6"/><ellipse cx="12.6" cy="8" rx="1.9" ry="5.6"/></svg>',
  cylinder:'<svg viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="8" cy="3.6" rx="5.4" ry="1.9"/><path d="M2.6 3.6v8.8a5.4 1.9 0 0 0 10.8 0V3.6"/></svg>'};
DEVP.mode='simple';DEVP.sel=0;
const hbOf=k=>HB[k]||(HB[k]={on:false,boxes:[]});
function hbAnchor(){const R=DEVP.rec;if(!R||!R.anchors)return null;const a=R.anchors.filter(o=>o.k===DEVP.key);return a.length?a[a.length-1].f:null;}
function hbNew(kind){const A=AB[DEVP.key]||{};return{kind,shape:'sphere',bone:'root',r:kind==='block'?1.5:2,len:3,fwd:2,up:1,side:0,a:0,b:10,dmg:Math.round(A.dmg||10),carDmg:Math.round(A.carDmg||A.dmg||8)};}
function hbChanged(){hbSave();devRenderTrack();devRenderHbProps();DEVP.resimT=0.15;devMarkAbil();}
// the move's built-in hits as editable hitboxes: runs of the same kind and shape (gaps of a few frames bridged),
// placed relative to where he was and which way he faced at the time
function hbFromBuiltIn(){
  const R=DEVP.rec,anc=hbAnchor();if(!R||anc===null)return[];
  const groups=[];
  for(const h of R.hits){const kind=h.kind==='block'?'block':'dmg';
    let G=groups.find(g=>g.kind===kind&&g.shape===h.shape&&h.f-g.last<=8);
    if(!G){G={kind,shape:h.shape,first:h.f,last:h.f,o:h.o,f:h.f};groups.push(G);}G.last=h.f;}
  const A=AB[DEVP.key]||{};
  return groups.map(G=>{const o=G.o,f=G.f,px=R.pos[f*4]+DEV_O.x,py=R.pos[f*4+1],pz=R.pos[f*4+2]+DEV_O.z,hd=R.pos[f*4+3],hx=Math.sin(hd),hz=Math.cos(hd);
    let shape='sphere',r=o.r||1,len=3,cx=o.x,cy=o.y,cz=o.z;
    if(G.shape==='box'){shape='cube';r=Math.max(o.sx,o.sz,o.sy)/2;cy=o.y+o.sy/2;}
    else if(G.shape==='cyl'){shape='cylinder';r=o.r;len=o.h;}
    else if(G.shape==='cone'){shape='cone';r=o.r;len=o.len;}
    else if(G.shape==='cap'&&o.dn===0)shape='semi';
    else if(G.shape==='slot'){shape='sphere';r=o.r+o.len/2;cx=o.x+Math.sin(o.rot)*o.len/2;cz=o.z+Math.cos(o.rot)*o.len/2;cy=o.y+o.h/2;}
    const dx=cx-px,dz=cz-pz,r1=v=>Math.round(v*10)/10;
    return{kind:G.kind,shape,r:r1(r),len:r1(len),fwd:r1(dx*hx+dz*hz),side:r1(-dx*hz+dz*hx),up:r1(cy-py),a:G.first-anc,b:G.last-anc,dmg:Math.round(A.dmg||10),carDmg:Math.round(A.carDmg||8)};});
}
function devRenderTrack(){
  const T=document.getElementById('devTrack'),R=DEVP.rec;if(!T||!R)return;
  const N=R.N,anc=hbAnchor(),H=hbOf(DEVP.key),pc=f=>(f/N*100).toFixed(3)+'%';
  let h='<div class="ruler" data-ruler="1">';
  const step=N>150?30:N>80?15:10;for(let f=0;f<N;f+=step)h+='<span class="tick" style="left:'+pc(f)+'"><b>'+f+'</b></span>';
  h+='</div><div class="row"><span class="nm">built-in hits'+(H.on?' (replaced)':'')+'</span>';
  const seen=new Set();for(const x of R.hits){const kind=x.kind==='block'?'block':'dmg',key=kind+x.f;if(seen.has(key))continue;seen.add(key);h+='<span class="mk '+kind+'" style="left:'+pc(x.f)+';top:'+(kind==='block'?11:4)+'px;height:8px"></span>';}
  h+='</div>';
  H.boxes.forEach((B,i)=>{const a=(anc??0)+B.a,b=(anc??0)+B.b;
    h+='<div class="row"><span class="nm">'+(i+1)+'. '+(B.kind==='block'?'block':'damage')+' '+B.shape+'</span><span class="bar '+(B.kind==='block'?'block':'dmg')+(i===DEVP.sel?' sel':'')+'" data-i="'+i+'" style="left:'+pc(a)+';width:calc('+pc(b-a+1)+')"><i class="l"></i><i class="r"></i></span></div>';});
  if(!H.boxes.length)h+='<div class="row"><span class="nm">no custom hitboxes yet: add one, or copy the built-in hits</span></div>';
  if(anc!==null)h+='<span class="anc" style="left:'+pc(anc)+'" title="the move starts"></span>';
  h+='<span class="ph" id="devPh"></span>';
  T.innerHTML=h;
  document.getElementById('devHbOn').checked=H.on;
}
function devRenderHbProps(){
  const box=document.getElementById('devHbProps'),side=document.getElementById('devHbSide'),H=hbOf(DEVP.key),B=H.boxes[DEVP.sel];
  document.getElementById('devPaneHb').hidden=!B||DEVP.mode!=='adv';document.getElementById('devPaneHbT').hidden=DEVP.mode!=='adv';
  const nm=B?'Hitbox '+(DEVP.sel+1)+' ('+(B.kind==='block'?'Smash blocks':'Damage')+')':'';document.querySelector('#devPaneHb>summary').textContent=B?nm:'Hitbox';document.querySelector('#devPaneHbT>summary').textContent=B?nm+': timing'+(B.kind==='block'?'':' & damage'):'Timing & damage';
  if(!B){box.innerHTML='<div class="vnote">Pick a hitbox in the timeline to edit it. Frames count from the dashed line (the start of the move), 60 to a second'+(DEVP.key==='trample'?'; a charge run repeats its hitboxes for as long as it lasts':'')+'.</div>';side.innerHTML='';return;}
  const row=(pk,lbl,v,mn,mx,st)=>'<div class="devp" data-hp="'+pk+'"><span>'+lbl+'</span><input type="range" class="vrange" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'" aria-label="'+lbl+'"><input type="number" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'" aria-label="'+lbl+' value"><span></span></div>';
  const N=DEVP.rec?DEVP.rec.N:180,bone=B.bone||'root';
  // beside the preview: what it is, where it sits, how big it is
  let h='';
  {const cur=HB_SHAPES.find(([v])=>v===B.shape)||HB_SHAPES[0];
   h+='<div class="devp"><span>Shape</span><div class="devdd" id="devHbShape"><button type="button" aria-haspopup="listbox" aria-expanded="false">'+HB_ICON[cur[0]]+cur[1]+'</button><ul role="listbox" hidden>'+HB_SHAPES.map(([v,n])=>'<li role="option" data-v="'+v+'"'+(B.shape===v?' class="on" aria-selected="true"':'')+'>'+HB_ICON[v]+n+'</li>').join('')+'</ul></div></div>';}
  h+='<div class="devp"><span>Origin</span><select id="devHbBone" style="grid-column:2 / 4" aria-label="Bone the hitbox follows">'+RIG_NAMES.map(n=>'<option value="'+n+'"'+(n===bone?' selected':'')+'>'+(n==='root'?'root (where he stands)':n)+'</option>').join('')+'</select></div>';
  h+=row('side','Offset X',B.side,-3,3,0.1)+row('up','Offset Y',B.up,-3,3,0.1)+row('fwd','Offset Z',B.fwd,-3,3,0.1);
  h+=row('rx','Rotation X',B.rx||0,-180,180,1)+row('ry','Rotation Y',B.ry||0,-180,180,1)+row('rz','Rotation Z',B.rz||0,-180,180,1);
  h+=row('r',B.shape==='cube'?'Size':B.shape==='cone'?'End radius':'Radius',B.r,0.1,15,0.1);
  if(B.shape==='cone'||B.shape==='cylinder')h+=row('len',B.shape==='cone'?'Length':'Height',B.len,0.2,30,0.1);
  side.innerHTML=h;
  // below: when it's live, and what it does
  let b=row('a','Active from frame',B.a,-60,N,1)+row('b','Active to frame',B.b,-60,N,1);
  if(B.kind!=='block')b+=row('dmg','Damage to enemies',B.dmg,0,100,1)+row('carDmg','Damage to cars',B.carDmg,0,100,1);
  box.innerHTML=b;
}
function devSetMode(m,keep){if(m==='adv'&&devGnash())return;DEVP.mode=m;for(const b of document.querySelectorAll('#devTlMode button'))b.classList.toggle('on',b.dataset.m===m);
  document.getElementById('devScrub').hidden=m==='adv';document.getElementById('devTrack').hidden=m!=='adv';document.getElementById('devAdvBar').hidden=m!=='adv';if(m!=='adv'){document.getElementById('devPaneHb').hidden=true;document.getElementById('devPaneHbT').hidden=true;}
  if(!keep)try{localStorage.setItem('goblin-stompin-gus-devtl',m);}catch(e){}if(m==='adv'){DEVP.sel=0;devRenderTrack();devRenderHbProps();}}
{
  document.getElementById('devTlMode').addEventListener('click',e=>{const b=e.target.closest('button');if(b)devSetMode(b.dataset.m);});
  document.getElementById('devHbOn').addEventListener('change',e=>{const H=hbOf(DEVP.key);H.on=e.target.checked;if(H.on&&!H.boxes.length){H.boxes=hbFromBuiltIn();DEVP.sel=0;}hbChanged();});
  const add=kind=>{const H=hbOf(DEVP.key),B=hbNew(kind);H.boxes.push(B);DEVP.sel=H.boxes.length-1;hbChanged();};
  document.getElementById('devHbAddD').addEventListener('click',()=>add('dmg'));
  document.getElementById('devHbAddB').addEventListener('click',()=>add('block'));
  document.getElementById('devHbCopy').addEventListener('click',()=>{const H=hbOf(DEVP.key),L=hbFromBuiltIn();if(!L.length)return;H.boxes.push(...L);DEVP.sel=H.boxes.length-L.length;hbChanged();});
  document.getElementById('devHbDup').addEventListener('click',()=>{const H=hbOf(DEVP.key),B=H.boxes[DEVP.sel];if(!B)return;H.boxes.splice(DEVP.sel+1,0,Object.assign({},B));DEVP.sel++;hbChanged();});
  document.getElementById('devHbDel').addEventListener('click',()=>{const H=hbOf(DEVP.key);if(!H.boxes[DEVP.sel])return;H.boxes.splice(DEVP.sel,1);DEVP.sel=Math.max(0,DEVP.sel-1);hbChanged();});
  for(const props of [document.getElementById('devHbProps'),document.getElementById('devHbSide')]){
  props.addEventListener('input',e=>{const r=e.target.closest('.devp');if(!r||!r.dataset.hp)return;const B=hbOf(DEVP.key).boxes[DEVP.sel];if(!B)return;let v=+e.target.value;if(!isFinite(v))return;
    B[r.dataset.hp]=v;if(r.dataset.hp==='a'&&B.b<v)B.b=v;if(r.dataset.hp==='b'&&B.a>v)B.a=v;
    const other=r.querySelector(e.target.type==='range'?'input[type=number]':'input[type=range]');if(other)other.value=String(v);
    hbSave();devRenderTrack();DEVP.resimT=0.15;});
  props.addEventListener('change',e=>{if(e.target.id!=='devHbBone')return;const B=hbOf(DEVP.key).boxes[DEVP.sel];if(!B)return;B.bone=e.target.value;hbSave();DEVP.resimT=0.15;});
  props.addEventListener('click',e=>{const B=hbOf(DEVP.key).boxes[DEVP.sel];if(!B)return;
    const k=e.target.closest('#devHbKind button'),dd=e.target.closest('#devHbShape'),sh=e.target.closest('#devHbShape li');
    if(k){B.kind=k.dataset.v;hbChanged();}
    else if(sh){B.shape=sh.dataset.v;hbChanged();}
    else if(dd&&e.target.closest('button')){const u=dd.querySelector('ul'),b=dd.querySelector('button');u.hidden=!u.hidden;b.setAttribute('aria-expanded',String(!u.hidden));}});}
  // (a click anywhere else closes the shape list)
  document.addEventListener('pointerdown',e=>{const dd=document.getElementById('devHbShape');if(dd&&!dd.contains(e.target)){const u=dd.querySelector('ul');if(u&&!u.hidden){u.hidden=true;dd.querySelector('button').setAttribute('aria-expanded','false');}}});
  // the track: click the ruler to jump there; drag a bar (or its ends)
  const T=document.getElementById('devTrack');let drag=null;
  const frameAt=x=>{const r=T.getBoundingClientRect(),R=DEVP.rec;return R?Math.round((x-r.left)/r.width*R.N):0;};
  T.addEventListener('pointerdown',e=>{
    if(e.target.closest('.ruler')){drag={seek:true};DEVP.play=false;devPlayBtn();DEVP.f=Math.max(0,Math.min(DEVP.rec.N-1,frameAt(e.clientX)));T.setPointerCapture(e.pointerId);return;}
    const bar=e.target.closest('.bar');if(!bar)return;const i=+bar.dataset.i,B=hbOf(DEVP.key).boxes[i];DEVP.sel=i;
    drag={i,mode:e.target.classList.contains('l')?'l':e.target.classList.contains('r')?'r':'m',f0:frameAt(e.clientX),a:B.a,b:B.b};
    T.setPointerCapture(e.pointerId);devRenderHbProps();for(const o of T.querySelectorAll('.bar'))o.classList.toggle('sel',+o.dataset.i===i);e.preventDefault();});
  T.addEventListener('pointermove',e=>{if(!drag)return;
    if(drag.seek){DEVP.f=Math.max(0,Math.min(DEVP.rec.N-1,frameAt(e.clientX)));return;}
    const B=hbOf(DEVP.key).boxes[drag.i],d=frameAt(e.clientX)-drag.f0;
    if(drag.mode==='m'){B.a=drag.a+d;B.b=drag.b+d;}else if(drag.mode==='l')B.a=Math.min(drag.b,drag.a+d);else B.b=Math.max(drag.a,drag.b+d);
    const bar=T.querySelector('.bar[data-i="'+drag.i+'"]'),anc=hbAnchor()??0,N=DEVP.rec.N;if(bar){bar.style.left=((anc+B.a)/N*100)+'%';bar.style.width=((B.b-B.a+1)/N*100)+'%';}});
  const end=()=>{if(drag&&!drag.seek){hbSave();devRenderHbProps();DEVP.resimT=0.15;}drag=null;};
  T.addEventListener('pointerup',end);T.addEventListener('pointercancel',end);
  try{if(localStorage.getItem('goblin-stompin-gus-devtl')==='adv')setTimeout(()=>devSetMode('adv'),0);}catch(e){}
}
{
  const list=document.getElementById('devList');
  devRenderAbList();
  // the character picker, top left
  {const cd=document.getElementById('devChDD'),cl=document.getElementById('devChList'),cb=cd.querySelector('button'),openC=v=>{cl.hidden=!v;cb.setAttribute('aria-expanded',String(v));};
   cl.innerHTML=DEV_CHARS.map(C=>'<li role="option" data-c="'+C.k+'">'+C.n+'</li>').join('');
   cb.addEventListener('click',()=>openC(cl.hidden));
   cl.addEventListener('click',e=>{const li=e.target.closest('li');if(li){openC(false);devSetChar(li.dataset.c);}});
   document.addEventListener('pointerdown',e=>{if(!cl.hidden&&!cd.contains(e.target))openC(false);});
   devSetChar(DEVP.char,true);}
  const dd=document.getElementById('devAbDD'),ddb=dd.querySelector('button'),open=v=>{list.hidden=!v;ddb.setAttribute('aria-expanded',String(v));};
  ddb.addEventListener('click',()=>open(list.hidden));
  list.addEventListener('click',e=>{const li=e.target.closest('li');if(li){open(false);devSelect(li.dataset.k);}});
  document.addEventListener('pointerdown',e=>{if(!list.hidden&&!dd.contains(e.target))open(false);});
  devMarkAbil();
  const box=document.getElementById('devParams');
  box.addEventListener('input',e=>{const r=e.target.closest('.devp');if(!r||!r.dataset.p)return;const pk=r.dataset.p;let v=+e.target.value;if(!isFinite(v))return;
    AB[DEVP.key][pk]=v;const other=r.querySelector(e.target.type==='range'?'input[type=number]':'input[type=range]');const st=+e.target.step||0.1;if(other)other.value=e.target.type==='range'?devFmt(v,st):String(v);
    r.classList.toggle('chg',Math.abs(v-abDefaults(DEVP.key)[pk])>1e-9);devChanged();});
  box.addEventListener('click',e=>{
    const sb=e.target.closest('#devShape button');if(sb){AB[DEVP.key].shape=sb.dataset.v;devRenderParams();devChanged();return;}
    const rs=e.target.closest('.rs');if(rs){const r=rs.closest('.devp'),pk=r.dataset.p;AB[DEVP.key][pk]=abDefaults(DEVP.key)[pk];devRenderParams();devChanged();}});
  document.getElementById('devResetAb').addEventListener('click',()=>{AB[DEVP.key]=abDefaults(DEVP.key);devRenderParams();devChanged();});
  document.getElementById('devResetAll').addEventListener('click',()=>{for(const D of DEV_ABIL)AB[D.k]=abDefaults(D.k);devRenderParams();devChanged();});
  document.getElementById('devPlay').addEventListener('click',()=>{const R=DEVP.rec;if(R&&!DEVP.play&&DEVP.f>=R.N-1)DEVP.f=0;DEVP.play=!DEVP.play;devPlayBtn();});
  document.getElementById('devRestart').addEventListener('click',()=>{DEVP.f=0;});
  const sc=document.getElementById('devScrub');sc.addEventListener('input',()=>{DEVP.f=+sc.value;DEVP.play=false;devPlayBtn();});
  document.getElementById('devSpeed').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;DEVP.speed=+b.dataset.s;for(const o of document.querySelectorAll('#devSpeed button'))o.classList.toggle('on',o===b);});
  document.getElementById('devLoop').addEventListener('change',e=>{DEVP.loop=e.target.checked;});
  // expand the preview to fill the window (and back)
  {const fig=document.querySelector('.devfig'),mb=document.getElementById('devMax');
   const setMax=v=>{fig.classList.toggle('devmax',v);mb.setAttribute('aria-pressed',String(v));mb.innerHTML=v?'&#x2921;':'&#x2922;';mb.title=v?'Shrink the preview back (Esc)':'Expand the preview to fill the window (Esc to shrink)';if(!v)fig.style.height='';};
   mb.addEventListener('click',()=>setMax(!fig.classList.contains('devmax')));
   // space plays / pauses while the preview is up (and Esc shrinks it); ahead of the menu's own keys
   const live=()=>fig.getClientRects().length>0&&!ST.fly.on;   // (on screen: the Dev tab is open in the menu; and not flying through the Structures preview, where Space goes up)
   const typing=t=>t&&(t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.tagName==='INPUT'&&/^(text|number|search)$/.test(t.type));
   window.addEventListener('keydown',e=>{if(!live())return;
     if(e.key==='Escape'&&fig.classList.contains('devmax')){setMax(false);e.preventDefault();e.stopImmediatePropagation();return;}
     if(e.code!=='Space'&&e.key!==' ')return;if(typing(e.target))return;
     e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
     const R=DEVP.rec;if(R&&!DEVP.play&&DEVP.f>=R.N-1)DEVP.f=0;DEVP.play=!DEVP.play;devPlayBtn();},true);
   window.addEventListener('keyup',e=>{if(live()&&(e.code==='Space'||e.key===' ')&&!typing(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);}
  // drag the preview round
  const cv=document.getElementById('devCanvas');let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!drag)return;DEVP.yaw-=(e.clientX-drag.x)*0.01;DEVP.pitch=Math.max(0.05,Math.min(1.35,DEVP.pitch+(e.clientY-drag.y)*0.01));drag={x:e.clientX,y:e.clientY};});
  cv.addEventListener('pointerup',()=>{drag=null;});cv.addEventListener('pointercancel',()=>{drag=null;});
  // and scroll to zoom
  cv.addEventListener('wheel',e=>{e.preventDefault();DEVP.zoom=Math.max(0.15,Math.min(4,(DEVP.zoom||1)*Math.pow(1.0015,e.deltaY)));},{passive:false});
}
