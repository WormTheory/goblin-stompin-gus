// ---- traffic control: signals hang off mast arms over each lane; stop and yield signs sit on short posts ----
let trafficClock=0;
// 14 s cycle: the z road gets green, yellow, all-red, then the x road does
// (a 24 second cycle, 10 of green each way: a shorter one lets so few cars through per green that queues never clear)
function lightPhase(ct,axis){const t=(trafficClock+ct.o*24/14)%24,u=axis==='z'?t:(t+12)%24;return u<10?'g':u<11.5?'y':'r';}
// a signal or sign is working until something knocks its post flat
const sigKey=(ix,iz,d)=>'s'+ix+','+iz+','+d;
const falling=new Map();
function armAlive(ix,iz,d){const k=sigKey(ix,iz,d);return !downFix.has(k)&&!falling.has(k);}
const postAlive=armAlive;
function boxBusy(ix,iz,me){const X0=ix*CELL,Z0=iz*CELL;return cars.some(o=>o!==me&&o.alive&&!o.hw&&!o.rt&&!o.parked&&Math.abs(o.pos.y-me.pos.y)<2&&o.pos.x>X0-0.6&&o.pos.x<X0+ROADW+0.6&&o.pos.z>Z0-0.6&&o.pos.z<Z0+ROADW+0.6);}
function crossTraffic(ix,iz,me){const cx=ix*CELL+ROADW/2,cz=iz*CELL+ROADW/2;return cars.some(o=>o!==me&&o.alive&&!o.hw&&!o.path&&o.dir%2!==me.dir%2&&Math.abs(o.speed)>1&&Math.abs(o.pos.y-me.pos.y)<2&&Math.hypot(o.pos.x-cx,o.pos.z-cz)<13);}
// the speed a lane-following car may have so it stops at the line when it has to
function trafficLimit(c,dt){
  const rx=mod(c.pos.x,CELL),rz=mod(c.pos.z,CELL),d=c.dir;
  if(rx<ROADW&&rz<ROADW)return 99;
  if(d%2===0?rx>=ROADW:rz>=ROADW)return 99;
  let ix,iz,s;
  if(d===0){iz=Math.ceil(c.pos.z/CELL);ix=Math.floor(c.pos.x/CELL);s=iz*CELL-c.pos.z;}
  else if(d===2){iz=Math.floor(c.pos.z/CELL);ix=Math.floor(c.pos.x/CELL);s=c.pos.z-(iz*CELL+ROADW);}
  else if(d===1){ix=Math.ceil(c.pos.x/CELL);iz=Math.floor(c.pos.z/CELL);s=ix*CELL-c.pos.x;}
  else{ix=Math.floor(c.pos.x/CELL);iz=Math.floor(c.pos.z/CELL);s=c.pos.x-(ix*CELL+ROADW);}
  if(s>18)return 99;
  const key=ix*100003+iz;if(c.passK===key)return 99;
  const stopD=s-3.1-c.hz,axis=d%2?'x':'z',ct=ctlAt(ix,iz);   // (the front bumper at the stop line, behind the zebra crossing)
  let kind=ct.k;
  if(kind==='light'&&!armAlive(ix,iz,d))kind='stop';   // a knocked-down signal becomes a four-way stop
  if(kind==='yield'&&(ct.ax!==axis||!postAlive(ix,iz,d)))return 99;
  if(kind==='stop'&&ct.k==='stop'&&!postAlive(ix,iz,d))return 99;
  const brake=()=>stopD<=0.1?0:Math.min(8,Math.sqrt(8*(stopD-0.1)));
  if(kind==='light'){
    const ph=lightPhase(ct,axis);
    if(ph==='g'){if(stopD<0.5)c.passK=key;return 99;}
    if(stopD<(ph==='y'?2.5:-1.2)){c.passK=key;return 99;}  // already over the line: go on through
    return brake();
  }
  if(kind==='stop'){
    if(c.waitK!==key){c.waitK=key;c.waitT=0;}
    if(stopD<1.4&&Math.abs(c.speed)<0.7){
      c.waitT+=dt;
      // first come, first served, and only into an empty intersection
      const jx=ix*CELL+ROADW/2,jz=iz*CELL+ROADW/2;
      if(c.waitT>0.9&&(c.waitT>9||!boxBusy(ix,iz,c))&&(c.waitT>6||!cars.some(o=>o!==c&&o.alive&&!o.path&&!o.hw&&o.waitK===key&&o.passK!==key&&o.waitT>c.waitT&&Math.abs(o.speed)<1&&Math.hypot(o.pos.x-jx,o.pos.z-jz)<16))){c.passK=key;return 99;}
    }
    return brake();
  }
  if(stopD<9){
    if(c.waitK!==key){c.waitK=key;c.waitT=0;}
    if(stopD<1.5&&Math.abs(c.speed)<0.7)c.waitT+=dt;
    if(c.waitT>7||!boxBusy(ix,iz,c)&&!crossTraffic(ix,iz,c)){if(stopD<1.5)c.passK=key;return 4;}
    return brake();
  }
  return 99;
}
// props: signal heads under the mast arms, sign plates on the posts (only around the players)
const TL={house:new THREE.MeshLambertMaterial({color:0x1b1e21}),off:[0x3a100c,0x3a300c,0x0c3a1c].map(c=>new THREE.MeshBasicMaterial({color:c})),on:[0xff3b2e,0xffc23a,0x3dff7a].map(c=>new THREE.MeshBasicMaterial({color:c}))};
const TLG={house:boxGeo(0.46,1.2,0.38),lamp:boxGeo(0.26,0.26,0.06),plate:new THREE.PlaneGeometry(0.95,0.95)};
function signTex(draw){const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');if(x&&x.beginPath)draw(x);const t=new THREE.CanvasTexture(cv);return t;}
const octo=(x,r)=>{x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}x.closePath();};
const tri=(x,inset)=>{x.beginPath();x.moveTo(4+inset,8+inset*0.6);x.lineTo(60-inset,8+inset*0.6);x.lineTo(32,58-inset*1.2);x.closePath();};
const SIGN={
  stop:signTex(x=>{octo(x,31);x.fillStyle='#eeeae0';x.fill();octo(x,27);x.fillStyle='#b3161c';x.fill();x.fillStyle='#f4f1e8';x.font='bold 17px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('STOP',32,33);}),
  yield:signTex(x=>{tri(x,0);x.fillStyle='#c0181e';x.fill();tri(x,9);x.fillStyle='#f2efe6';x.fill();}),
  stopBack:signTex(x=>{octo(x,31);x.fillStyle='#8a8d90';x.fill();}),
  yieldBack:signTex(x=>{tri(x,0);x.fillStyle='#8a8d90';x.fill();})};
const SMAT={};for(const k in SIGN)SMAT[k]=new THREE.MeshLambertMaterial({map:SIGN[k],alphaTest:0.5});
const heads=[],signs=[];
function headAt(i){
  if(i>=120)return null;
  if(!heads[i]){const g=new THREE.Group();g.matrixAutoUpdate=false;g.add(new THREE.Mesh(TLG.house,TL.house));const lamps=[0,1,2].map(j=>{const m=new THREE.Mesh(TLG.lamp,TL.off[j]);m.position.set(0,0.38-0.38*j,0.2);g.add(m);return m;});g.visible=false;scene.add(g);heads[i]={g,lamps,ct:null,axis:'z'};}
  return heads[i];
}
function signAt(i){
  if(i>=120)return null;
  if(!signs[i]){const g=new THREE.Group();g.matrixAutoUpdate=false;const f=new THREE.Mesh(TLG.plate,SMAT.stop),b=new THREE.Mesh(TLG.plate,SMAT.stopBack);f.position.z=0.03;b.position.z=-0.03;b.rotation.y=Math.PI;g.add(f,b);g.visible=false;scene.add(g);signs[i]={g,f,b};}
  return signs[i];
}
const boards=[];let nBoard=0;
function boardAt(i){
  if(i>=40)return null;
  if(!boards[i]){const g=new THREE.Group();g.matrixAutoUpdate=false;const geo=new THREE.PlaneGeometry(7.7,3.7);
    const fm=new THREE.Mesh(geo,SMAT.stop),bm=new THREE.Mesh(geo,SMAT.stop);fm.position.z=0.15;bm.position.z=-0.15;bm.rotation.y=Math.PI;g.add(fm,bm);g.visible=false;scene.add(g);boards[i]={g,f:fm,b:bm};}
  return boards[i];
}
// ---- street furniture: slender lamp posts, signal masts and sign posts, drawn as instanced meshes ----
// anything big (Gus, a stomp, a speeding car, a blast) knocks them flat; downed ones stay down (saved)
const LAMP_SPOTS=[[ROADW,PL0+4,-1,0],[ROADW,PL1-4,-1,0],[CELL-1,PL0+4,1,0],[CELL-1,PL1-4,1,0],[PL0+4,ROADW,0,-1],[PL1-4,ROADW,0,-1],[PL0+4,CELL-1,0,1],[PL1-4,CELL-1,0,1]];
const BAR_MAX=3000,GLOW_MAX=800;
const FIX_BAR=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0x3a3f45}),BAR_MAX);
const FIX_GLOW=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffe6a8}),GLOW_MAX);
// (and boxes in their own colours: bunting, flags, billboard frames)
const COL_MAX=4000,FIX_COL=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff}),COL_MAX);
FIX_COL.setColorAt(0,new THREE.Color(0xffffff));
for(const m of [FIX_BAR,FIX_GLOW,FIX_COL]){m.frustumCulled=false;m.count=0;scene.add(m);}
let nCol=0;const _C=new THREE.Matrix4(),_fcF=new THREE.Color();
// a box in a fixture's own frame: (lx,ly,lz) from its foot, turned by its yaw; inst: FIX_BAR / FIX_GLOW / a colour
function pushRot(f,col,lx,ly,lz,sx,sy,sz,yaw=f.yaw){
  _A.makeTranslation(lx,ly,lz);_B.makeScale(sx,sy,sz);_A.multiply(_B);
  _C.makeRotationY(yaw);_A.premultiply(_C);_C.makeTranslation(f.x,f.y0||G+1,f.z);_A.premultiply(_C);_A.premultiply(_F);
  if(col===true||col===false){const inst=col?FIX_GLOW:FIX_BAR,i=col?nGlow:nBar;if(i>=(col?GLOW_MAX:BAR_MAX))return;inst.setMatrixAt(i,_A);if(col)nGlow++;else nBar++;return;}
  if(nCol>=COL_MAX)return;FIX_COL.setMatrixAt(nCol,_A);FIX_COL.setColorAt(nCol,_fcF.setHex(col));nCol++;
}
const _F=new THREE.Matrix4(),_A=new THREE.Matrix4(),_B=new THREE.Matrix4(),_ax=new THREE.Vector3();
let nBar=0,nGlow=0,nHead=0,nSign=0;const activeFix=[];
// tip a fixture over about its base, toward heading ang, by theta
function fallMatrix(bx,bz,theta,ang,by=G+1){
  _F.makeTranslation(-bx,-by,-bz);
  if(theta>0){_ax.set(Math.cos(ang),0,-Math.sin(ang));_A.makeRotationAxis(_ax,theta);_F.premultiply(_A);}
  _A.makeTranslation(bx,by,bz);_F.premultiply(_A);return _F;
}
// a thin bar from point a to point b (a cable, a rail): FIX_BAR, turned to lie along the line
const _AX1=new THREE.Vector3(1,0,0);
function pushSeg(a,b,th){
  if(nBar>=BAR_MAX)return;const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dy,dz);if(L<1e-4)return;
  _A.makeScale(th,th,L);_B.makeRotationAxis(_AX1,-Math.atan2(dy,Math.hypot(dx,dz)));_A.premultiply(_B);_B.makeRotationY(Math.atan2(dx,dz));_A.premultiply(_B);
  _B.makeTranslation((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);_A.premultiply(_B);FIX_BAR.setMatrixAt(nBar++,_A);
}

// the shapes of lamps, signals, sign posts, flags and billboards: files, src/assets/fixtures/*.json, edited in the editor
// (core/assets.js reads them). fixDraw puts one's boxes, its own frame turned by yaw: its pole boxes in FIX_BAR, its lamps
// in FIX_GLOW while it stands; fixSpot is where one of its spots is in the world (a signal's lights, a sign's face)
const FIXM=assetFixAll(ASSETS);
function fixDraw(f,M,yaw,lit){for(const q of M.boxes)pushRot(f,q[0]===ASSET_POLE?false:q[0]===ASSET_LAMP?lit:q[0],q[1],q[2],q[3],q[4],q[5],q[6],yaw);}
function fixSpot(f,M,k,yaw,by){const p=M.spots[k]||[0,0,0],c=Math.cos(yaw),n=Math.sin(yaw);return [f.x+p[0]*c+p[2]*n,by+p[1],f.z-p[0]*n+p[2]*c];}
function placeGroup(g,x,y,z,yaw){_B.makeRotationY(yaw);_B.setPosition(x,y,z);g.matrix.multiplyMatrices(_F,_B);g.matrixWorldNeedsUpdate=true;g.visible=true;}
function drawFix(f,near){
  const dn=downFix.get(f.key),fl=falling.get(f.key);
  let theta=0,ang=0;
  if(dn!==undefined){theta=Math.PI/2*0.97;ang=dn;}else if(fl){const k=Math.min(1,fl.t/0.7);theta=Math.PI/2*0.97*k*k;ang=fl.ang;}
  const lit=dn===undefined&&!fl,by=f.y0||G+1;
  fallMatrix(f.x,f.z,theta,ang,by);
  // (a lamp's and a signal's arm reach along +x in their files: turned to point the way the spot says, rx,rz or s)
  if(f.type==='lamp'){fixDraw(f,FIXM.lamp,Math.atan2(-f.rz,f.rx),lit);blkLampDown(f,lit);}
  else if(f.type==='signal'){
    const M=FIXM.signal,yw=Math.atan2(-f.s[1],f.s[0]);fixDraw(f,M,yw,lit);
    if(near){const h=headAt(nHead++);if(h){const q=fixSpot(f,M,'head',yw,by);placeGroup(h.g,q[0],q[1],q[2],f.yaw+Math.PI);h.ct=f.ct;h.axis=f.axis;h.lit=lit;}}
  } else if(f.type==='bunt'){
    // a string of coloured pennants sagging between two poles
    const L=f.L,cols=[0xe53935,0xffd23a,0x1e88e5,0x43a047,0xffffff];
    for(const e of [-L/2,L/2])pushRot(f,false,e,2.6,0,0.12,5.2,0.12);
    for(let i=0;i<=L*1.6;i++){const t=-L/2+i/1.6,sag=4.9-1.0*(1-((2*t/L)**2));pushRot(f,cols[i%5],t,sag-0.28,0,0.34,0.44,0.04);}
  } else if(f.type==='flag')fixDraw(f,FIXM.flag,f.yaw,lit);
  else if(f.type==='board'){
    const M=FIXM.board;fixDraw(f,M,f.yaw,lit);
    if(near){const B=boardAt(nBoard++);if(B){const q=fixSpot(f,M,'ad',f.yaw,by);B.f.material=adMat(f.ad);B.b.visible=false;placeGroup(B.g,q[0],q[1],q[2],f.yaw);}}   // (one-sided: the back is just the bare frame)
  } else {
    const M=FIXM.sign;fixDraw(f,M,f.yaw,lit);
    if(near){const s=signAt(nSign++);if(s){const q=fixSpot(f,M,'face',f.yaw,by);s.f.material=f.ct.k==='stop'?SMAT.stop:SMAT.yield;s.b.material=f.ct.k==='stop'?SMAT.stopBack:SMAT.yieldBack;placeGroup(s.g,q[0],q[1],q[2],f.yaw);}}
  }
}
