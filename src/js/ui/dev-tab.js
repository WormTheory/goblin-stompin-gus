// ---- recording a move: a spare copy of Gus (never in the players list) performs it in a sandbox: block lookups see a
// flat empty field far from anything, and sounds, effects and smashing are switched off, with every hit volume recorded
// instead. Each frame of the run is recorded (every part of the model). The editor's Hippo tab plays these back
// (editor-live.js), and the Dev tab's enemy preview draws with the same lines and labels. ----
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
        gobBodyPose(GB.m,PV);gobBodyRoot(GB.root,GB.m,PV.pos.x,PV.pos.y,PV.pos.z,PV.heading);gobGunGrip(GB.m,GB.root,PV);}
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
