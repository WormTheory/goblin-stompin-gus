// ---- the Dev tab's ability tuning: every number the hippos' moves use that's worth adjusting, with its default.
// AB[ability][param] is read by the moves themselves; changes are kept in the browser. blk: what it smashes (shape
// 'orig' = the move's own hand-made shape, scaled by size; or a sphere/cube/cone of that radius) ----
const DEV_ABIL=[
  {k:'walk',n:'Walk',ps:[['speed','Movement speed',4.2,0.5,20,0.1]]},
  {k:'dodge',n:'Dash',ps:[['dist','Movement distance',4,0.5,20,0.1],['speed','Movement speed',14,2,60,0.5],['stamina','Stamina cost',12,0,100,1]]},
  {k:'trample',n:'Trample (charge run)',ps:[['dmg','Damage to enemies',5,0,100,1],['carDmg','Damage to cars',6,0,100,1],['hitR','Hit radius',1.6,0.3,10,0.1],['stamina','Stamina cost (per second)',20.2,0,100,0.5],['speed','Movement speed',8,1,40,0.5]],blk:['orig',1.6,'Smash radius']},
  {k:'jump',n:'Jump',ps:[['launch','Launch speed (height)',9.5,2,30,0.1]]},
  {k:'djump',n:'Double jump',ps:[['launch','Launch speed (height)',8.8,2,30,0.1]]},
  {k:'longJump',n:'Long jump',ps:[['launch','Launch speed (height)',8,2,30,0.1],['speed','Movement speed (forward)',13,1,50,0.5]]},
  {k:'roll',n:'Roll',ps:[['dist','Movement distance',8,1,30,0.1],['speed','Movement speed',17,2,60,0.5],['hop','Hop speed (height)',4.5,0,20,0.1],['stamina','Stamina cost',15,0,100,1],['dmg','Damage to enemies',8,0,100,1],['carDmg','Damage to cars',8,0,100,1],['hitR','Hit radius',1.8,0.3,10,0.1],['blkR','Block-smash radius',1.5,0,6,0.1]]},
  {k:'blastDash',n:'Blast dash',ps:[['dist','Movement distance',11,1,40,0.1],['speed','Movement speed',30,2,80,0.5],['stamina','Stamina cost',18,0,100,1],['dmg','Damage to enemies',10,0,100,1],['carDmg','Damage to cars',10,0,100,1],['hitR','Hit radius',2,0.3,10,0.1],['blkR','Block-smash radius',1.6,0,6,0.1],['blastR','Blast radius behind',3,0,15,0.1]]},
  {k:'blastAirDash',n:'Blast air dash',ps:[['dist','Movement distance',14,1,50,0.1],['speed','Movement speed',34,2,90,0.5],['stamina','Stamina cost',25,0,100,1],['dmg','Damage to enemies',12,0,100,1],['carDmg','Damage to cars',10,0,100,1],['hitR','Hit radius',2.2,0.3,10,0.1],['blkR','Block-smash radius',1.8,0,6,0.1],['blastR','Blast radius behind',3,0,15,0.1]]},
  {k:'blastJump',n:'Blast long jump',ps:[['launch','Launch speed (height)',14,2,40,0.1],['speed','Movement speed (forward)',30,1,80,0.5],['dmg','Damage to enemies',12,0,100,1],['carDmg','Damage to cars',10,0,100,1],['hitR','Hit radius',2.4,0.5,10,0.1],['blastR','Blast radius behind',3.5,0,15,0.1]]},
  {k:'dash',n:'Air dash',ps:[['dmg','Damage to enemies',7,0,100,1],['carDmg','Damage to cars',6,0,100,1],['hitR','Hit radius',1.8,0.3,10,0.1],['stamina','Stamina cost',20,0,100,1],['dist','Movement distance',4.8,0.5,40,0.1],['speed','Movement speed',15,2,60,0.5]],blk:['orig',1,'Smash size']},
  {k:'bite',n:'Bite',ps:[['dmg','Damage to enemies',10,0,100,1],['carDmg','Damage to cars',5,0,100,1],['hitR','Hit radius (jaw sweep)',1.6,0.3,8,0.1],['dist','Movement distance (lurch)',1.4,0,10,0.1],['speed','Movement speed (lurch)',4.7,0.5,30,0.1]],blk:['orig',1,'Smash size']},
  {k:'bite2',n:'Bite (2nd hit)',ps:[['dmg','Damage to enemies',10,0,100,1],['carDmg','Damage to cars',5,0,100,1],['hitR','Hit radius (jaw sweep)',1.6,0.3,8,0.1],['dist','Movement distance (lurch)',1.4,0,10,0.1],['speed','Movement speed (lurch)',4.7,0.5,30,0.1]],blk:['orig',1,'Smash size']},
  {k:'upper',n:'Uppercut (3rd bite)',ps:[['dmg','Damage to enemies',14,0,100,1],['carDmg','Damage to cars',7,0,100,1],['hitR','Hit radius (jaw sweep)',1.6,0.3,8,0.1],['dist','Movement distance (lurch)',1.8,0,10,0.1],['speed','Movement speed (lurch)',4.7,0.5,30,0.1]],blk:['orig',1,'Smash size']},
  {k:'airBite',n:'Air bite',ps:[['dmg','Damage to enemies',10,0,100,1],['carDmg','Damage to cars',5,0,100,1],['hitR','Hit radius (jaw sweep)',1.6,0.3,8,0.1],['dist','Movement distance (lurch)',1.3,0,10,0.1],['speed','Movement speed (lurch)',6.5,0.5,30,0.1]],blk:['orig',1,'Smash size']},
  {k:'stomp1',n:'Stomp',ps:[['dmg','Damage to enemies',8,0,100,1],['carDmg','Damage to cars',8,0,100,1],['hitR','Hit radius',4,0.5,30,0.1]],blk:['orig',1,'Crater size']},
  {k:'stomp2',n:'Stomp (charged)',ps:[['dmg','Damage to enemies',14,0,100,1],['carDmg','Damage to cars',15,0,100,1],['hitR','Hit radius',6.5,0.5,30,0.1]],blk:['orig',2,'Crater size']},
  {k:'groundSpike',n:'Ground spike',ps:[['dmg','Damage to enemies',10,0,100,1],['carDmg','Damage to cars',10,0,100,1],['hitR','Hit radius (round each spike)',1.4,0,10,0.1],['size','Spike size',1,0.3,4,0.05],['launch','Throw upward',10,0,30,0.5]]},
  {k:'stomp3',n:'Stomp (full charge)',ps:[['dmg','Damage to enemies',25,0,100,1],['carDmg','Damage to cars',28,0,100,1],['hitR','Hit radius',10,0.5,30,0.1]],blk:['orig',3,'Crater size']},
  {k:'pound',n:'Ground pound',ps:[['dmg','Damage to enemies (+1.6 per block fallen)',12,0,100,1],['carMul','Damage to cars (× enemy damage)',0.8,0,3,0.05],['hitR','Hit radius (+0.35 per block fallen)',5.5,0.5,30,0.1]],blk:['orig',1,'Crater size']},
  {k:'pound2',n:'Ground pound (charged)',ps:[['dmg','Damage to enemies (+1.6 per block fallen)',12,0,100,1],['carMul','Damage to cars (× enemy damage)',0.8,0,3,0.05],['hitR','Hit radius (+0.35 per block fallen)',5.5,0.5,30,0.1]],blk:['orig',1,'Crater size']},
  {k:'pound3',n:'Ground pound (full charge)',ps:[['dmg','Damage to enemies (+1.6 per block fallen)',12,0,100,1],['carMul','Damage to cars (× enemy damage)',0.8,0,3,0.05],['hitR','Hit radius (+0.35 per block fallen)',5.5,0.5,30,0.1]],blk:['orig',1,'Crater size']},
  {k:'crash',n:'Crash landing',ps:[['dmg','Damage to enemies (+1.6 per block fallen)',3,0,100,1],['carMul','Damage to cars (× enemy damage)',0.8,0,3,0.05],['hitR','Hit radius (+0.35 per block fallen)',2.5,0.5,30,0.1]],blk:['orig',1,'Crater size']},
];
const DEV_KEY='goblin-stompin-gus-dev',AB={};
function abDefaults(k){const D=DEV_ABIL.find(a=>a.k===k),o={};for(const [pk,,d] of D.ps)o[pk]=d;if(D.blk){o.shape=D.blk[0];o.size=D.blk[1];}return o;}
for(const D of DEV_ABIL)AB[D.k]=abDefaults(D.k);
try{const sv=JSON.parse(localStorage.getItem(DEV_KEY)||'{}');for(const k in sv)if(AB[k])for(const pk in sv[k])if(pk in AB[k])AB[k][pk]=sv[k][pk];}catch(e){}
const abSave=()=>{try{localStorage.setItem(DEV_KEY,JSON.stringify(AB));}catch(e){}};
// ---- custom hitboxes: a move can have its own list of hit volumes in place of its built-in hits, each live for a range
// of frames (at 60 a second) counted from the moment the move starts (its anchor: the button press for bites and jumps,
// the release for a stomp, the start of a dash or charge run, the moment a ground pound or crash landing hits the ground). A charge run's list repeats for as long
// as the charge lasts. Each volume: kind ('dmg' hurts goblins and cars, once each per time it switches on; 'block'
// smashes), shape (sphere, cube, cone, cylinder), r (radius; a cone's end radius), len (a cone's length, a cylinder's
// height), and its origin: fwd, up, side (to his right) from his feet. ----
const HB_KEY='goblin-stompin-gus-hitbox',HB={};
try{const v=JSON.parse(localStorage.getItem(HB_KEY)||'{}');for(const k in v)if(v[k]&&Array.isArray(v[k].boxes))HB[k]={on:!!v[k].on,boxes:v[k].boxes};}catch(e){}
const hbSave=()=>{try{localStorage.setItem(HB_KEY,JSON.stringify(HB));}catch(e){}};
const hbOn=k=>!!(HB[k]&&HB[k].on);
// how far round him a move's custom damage hitboxes reach on the ground (null: none of them does damage)
function hbReach(k){const H=HB[k];if(!H||!H.on)return null;let m=0;
  for(const B of H.boxes){if(B.kind==='block')continue;const ext=B.shape==='cone'?B.len:B.shape==='cube'?B.r*1.41:B.r;m=Math.max(m,Math.hypot(B.fwd||0,B.side||0)+ext);}
  return m>0?m:null;}
function hbStart(p,k){if(SBX)SBX.anchors.push({k,f:SBX.frame});if(!hbOn(k))return;(p.hbRuns||(p.hbRuns=[])).push({k,t:0,hit:[]});}
// a hitbox's orientation: his facing, turned by its rotations (degrees): X tips its front up, Y turns it to his right,
// Z rolls it to his right. Returned as the volume's own axes in the world (X: its left, Y: its up, Z: its front) and as
// the Euler angles (order YXZ) that draw it
function hbBasis(hd,B){
  const D=Math.PI/180,x=-(B.rx||0)*D,y=hd-(B.ry||0)*D,z=(B.rz||0)*D;
  const a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z),ce=c*e,cf=c*f,de=d*e,df=d*f;
  return{X:[ce+df*b,a*f,cf*b-de],Y:[de*b-cf,a*e,df+ce*b],Z:[a*d,-b,a*c],ex:x,ey:y,ez:z};
}
// is the point inside the volume (grown by pad)? Worked out in the volume's own axes
function hbInside(B,ox,oy,oz,Bs,x,y,z,pad){
  const dx=x-ox,dy=y-oy,dz=z-oz,X=Bs.X,Y=Bs.Y,Z=Bs.Z;
  const lx=dx*X[0]+dy*X[1]+dz*X[2],ly=dx*Y[0]+dy*Y[1]+dz*Y[2],lz=dx*Z[0]+dy*Z[1]+dz*Z[2],R=B.r+pad;
  if(B.shape==='sphere')return lx*lx+ly*ly+lz*lz<=R*R;
  if(B.shape==='semi')return ly>=-pad&&lx*lx+ly*ly+lz*lz<=R*R;   // a dome: the top half of a ball, flat side down on the origin
  if(B.shape==='cube')return Math.abs(lx)<=R&&Math.abs(ly)<=R&&Math.abs(lz)<=R;
  if(B.shape==='cone'){if(lz<-pad||lz>B.len+pad)return false;return Math.hypot(lx,ly)<=Math.max(0,lz)*B.r/Math.max(0.1,B.len)+pad;}
  return Math.hypot(lx,lz)<=R&&ly>=-pad&&ly<=B.len+pad;   // cylinder, standing on its origin
}
// draw it (the debug overlay, and the Dev tab's preview)
function hbDbg(kind,B,ox,oy,oz,Bs){
  const E={rx:Bs.ex,rot:Bs.ey,rz:Bs.ez};
  if(B.shape==='sphere')dbgHit(kind,'sph',{x:ox,y:oy,z:oz,r:B.r});
  else if(B.shape==='semi')dbgHit(kind,'cap',Object.assign({x:ox,y:oy,z:oz,r:B.r,dn:0,up:B.r},E));
  else if(B.shape==='cube')dbgHit(kind,'box',Object.assign({x:ox,y:oy-B.r,z:oz,sx:2*B.r,sy:2*B.r,sz:2*B.r},E));
  else if(B.shape==='cone')dbgHit(kind,'cone',Object.assign({x:ox,y:oy,z:oz,len:B.len,r:B.r},E));
  else dbgHit(kind,'cyl',Object.assign({x:ox,y:oy,z:oz,r:B.r,h:B.len},E));
}
// a block-smashing hitbox: every block whose middle is inside it
function crushVol(B,ox,oy,oz,Bs,hx,hz){
  const o={force:1.1,dx:hx,dz:hz,up:1};
  hbDbg('block',B,ox,oy,oz,Bs);
  const SC=SBX?[]:null;   // (in the Dev tab's sandbox: just list the blocks it would take)
  const E=Math.ceil(B.shape==='cube'?B.r*1.75:B.shape==='cone'||B.shape==='cylinder'?Math.hypot(B.len,B.r):B.r)+1;
  if(!SC&&oy-E<G+7)knockFixtures(ox,oz,B.r+0.9,hx,hz);
  if(!SC)knockProps(ox,oy,oz,B.r+0.9,hx,hz);
  const ch=new Set(),broken=[];
  for(let by=Math.floor(oy-E);by<=Math.floor(oy+E);by++)for(let bz=Math.floor(oz-E);bz<=Math.floor(oz+E);bz++)for(let bx=Math.floor(ox-E);bx<=Math.floor(ox+E);bx++){
    if(by<1||by>=H||!hbInside(B,ox,oy,oz,Bs,bx+0.5,by+0.5,bz+0.5,0.25))continue;
    if(SC){SC.push(bx,by,bz);continue;}
    const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK)continue;
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    for(const ex of[-1,0,1])for(const ez of[-1,0,1])ch.add(ckey(Math.floor((bx+ex)/CS),Math.floor((bz+ez)/CS)));
  }
  if(SC){sbxCells(SC);return 0;}
  if(broken.length){rebuildSet(ch);save();destroyFX(broken.slice(0,120),o);settle(broken,o);pumpsHit(broken);}
  return broken.length;
}
function hbApply(p,B,hit,ox,oy,oz,hx,hz){
  const Bs=hbBasis(Math.atan2(hx,hz),B);
  if(B.kind==='block'){crushVol(B,ox,oy,oz,Bs,hx,hz);return;}
  hbDbg('dmg',B,ox,oy,oz,Bs);
  if(SBX)return;
  for(const g of goblins){if(g.state!=='chase'||hit.has(g))continue;
    if(hbInside(B,ox,oy,oz,Bs,g.pos.x,g.pos.y+0.8,g.pos.z,0.45)){hit.add(g);damageGoblin(g,B.dmg,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(hx,0.5,hz),'Flattened by a hippo');}}
  for(const c of cars){if(!c.alive||hit.has(c)||Math.hypot(c.pos.x-ox,c.pos.z-oz)>B.r*1.75+B.len+c.hz+2)continue;
    const s=Math.sin(c.heading),k=Math.cos(c.heading),y=c.pos.y+c.hy/2;
    const pts=[[0,0],[c.hx,c.hz],[-c.hx,c.hz],[c.hx,-c.hz],[-c.hx,-c.hz],[0,c.hz],[0,-c.hz]];
    if(pts.some(([a,b])=>hbInside(B,ox,oy,oz,Bs,c.pos.x+a*k+b*s,y,c.pos.z-a*s+b*k,0.3))){hit.add(c);damageCar(c,B.carDmg,new V3(hx,0,hz));clang();}}
}
// the named points of a hippo's rig: its pivots ('root', 'body', 'head', 'jaw', 'leg.FL'...), and for a pivot with nothing hung
// below it, the far end of the parts it carries too ('foot.FL', 'jaw.tip'...). {name, o: the pivot, p: a point in its space or null}
function rigPoints(root){
  const J=[];root.traverse(o=>{if(!o.isMesh&&!o.isLine&&!o.isPoints&&o.name)J.push(o);});
  const L=J.map(o=>({name:o.name,o,p:null}));
  for(const o of J){if(J.some(q=>q!==o&&q.parent===o))continue;let lo=null,hi=null;
    for(const m of o.children){if(!m.isMesh||!m.geometry)continue;const g=m.geometry;if(!g.boundingBox&&g.computeBoundingBox)g.computeBoundingBox();const bb=g.boundingBox;if(!bb)continue;
      const a=[bb.min.x+m.position.x,bb.min.y+m.position.y,bb.min.z+m.position.z],b=[bb.max.x+m.position.x,bb.max.y+m.position.y,bb.max.z+m.position.z];
      lo=lo?lo.map((v,k)=>Math.min(v,a[k])):a;hi=hi?hi.map((v,k)=>Math.max(v,b[k])):b;}
    if(!lo)continue;const c=lo.map((v,k)=>(v+hi[k])/2);let best=null,bd=-1;
    for(let ax=0;ax<3;ax++)for(const e of [lo[ax],hi[ax]]){const q=c.slice();q[ax]=e;const d=Math.hypot(q[0],q[1],q[2]);if(d>bd){bd=d;best=q;}}
    L.push({name:o.name.startsWith('leg.')?'foot.'+o.name.slice(4):o.name+'.tip',o,p:new THREE.Vector3(best[0],best[1],best[2])});}
  return L;
}
const RIG_NAMES=(()=>{const pref=['root','body','head','jaw','jaw.tip','leg.FL','leg.FR','leg.BL','leg.BR','foot.FL','foot.FR','foot.BL','foot.BR'],at=n=>{const i=pref.indexOf(n);return i<0?99:i;};
  return rigPoints(players[0].root).map(q=>q.name).filter(n=>n!=='rig').sort((a,b)=>at(a)-at(b));})();
// where a named point of his rig is in the world right now ('root', or none: where he stands)
function bonePos(p,name,out){
  if(!name||name==='root'){out.set(p.pos.x,p.pos.y,p.pos.z);return out;}
  const r=(p.rigPts||(p.rigPts=rigPoints(p.root))).find(q=>q.name===name);if(!r){out.set(p.pos.x,p.pos.y,p.pos.z);return out;}
  p.root.updateMatrixWorld(true);if(r.p)out.copy(r.p).applyMatrix4(r.o.matrixWorld);else out.setFromMatrixPosition(r.o.matrixWorld);return out;
}
const _hbO=new THREE.Vector3();
// run the custom volumes of every move he's in the middle of: each from its bone (or where he stands), moved by its
// offset X (to his right), Y (up) and Z (forward)
function hbTick(p,dt){
  const R=p.hbRuns;if(!R||!R.length)return;
  const hx=Math.sin(p.heading),hz=Math.cos(p.heading);
  for(let i=R.length-1;i>=0;i--){const run=R[i],H=HB[run.k];
    if(!H||!H.on||!H.boxes.length||p.state==='dead'||run.k==='trample'&&!p.trNow){R.splice(i,1);continue;}
    // every frame since the last tick counts (at a low frame rate, or sped up, one tick can cover several of the move's
    // frames: a box live for just one of them mustn't be skipped)
    const f=Math.floor(run.t*60+1e-6);let maxB=0;for(const B of H.boxes)maxB=Math.max(maxB,B.b);
    if(run.k!=='trample'&&(run.lf??-1)>=maxB){R.splice(i,1);continue;}
    // (no new frame since the last tick -- a fast screen ticks several times a frame -- the current frame's boxes stay live)
    const f0=Math.min(f,Math.max((run.lf??-1)+1,f-60)),live=new Set();
    for(let q=f0;q<=f;q++){const fq=run.k==='trample'?q%(maxB+1):q;H.boxes.forEach((B,bi)=>{if(fq>=B.a&&fq<=B.b)live.add(bi);});}
    run.lf=Math.max(run.lf??-1,f);
    H.boxes.forEach((B,bi)=>{
      if(!live.has(bi))return;
      // each damage box hurts a given goblin or car only once for the whole move, however many frames it's live for
      // (a charge run included: once per run)
      if(!run.hit[bi])run.hit[bi]=new Set();
      const o=bonePos(p,B.bone,_hbO);hbApply(p,B,run.hit[bi],o.x+hx*B.fwd-hz*B.side,o.y+B.up,o.z+hz*B.fwd+hx*B.side,hx,hz);
    });
    run.t+=dt;}
}
// a move's smash: its own shape, or the shape picked in the Dev tab
function blockHit(A,x,y,z,hx,hz,opt,orig){return A.shape&&A.shape!=='orig'?crushShape(A.shape,x,y,z,A.size,hx,hz,Object.assign({dx:hx,dz:hz},opt)):orig(A.size);}
const PFLIP=0.26,PHOLD=0.14;   // how long the ground pound's somersault takes before he hovers or drops
function stompImpact(p,lvl=0){
  const L=STOMP_LV[lvl],f=L.f,A=AB['stomp'+(lvl+1)];
  const fx=Math.sin(p.heading),fz=Math.cos(p.heading),ix=p.pos.x+fx*1.3,iz=p.pos.z+fz*1.3;
  puff(ix,p.pos.y,iz,Math.round(8+8*f));
  const cust=hbOn('stomp'+(lvl+1));
  if(!cust){const o={force:0.9+0.4*f,up:1.2+0.3*f};blockHit(A,ix,p.pos.y,iz,fx,fz,o,sz=>crush(ix,p.pos.y,iz,Math.max(0,Math.round(sz)),L.d0,L.d1,o));}
  if(!cust)hitGoblins(ix,iz,A.hitR,A.dmg,'Stomped flat',p.pos.y);
  if(!cust)for(const c of carsNear(ix,iz,A.hitR,p.pos.y)){const away=new V3(c.pos.x-ix,0,c.pos.z-iz);damageCar(c,A.carDmg,away);if(lvl>=1)launchCar(c,lvl===2?9:5,away,lvl===2?4:2);clang();}
  if(lvl===2){for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=5+Math.random()*3;puff(ix+Math.cos(a)*rr,p.pos.y,iz+Math.sin(a)*rr,2,0x9a948a,0.6);}}
  // the same ground shockwave as a ground pound, its outer ring spreading to exactly the edge of the damage (the custom
  // damage hitboxes' reach, round him, if they're in use; none if they do no damage)
  {const rr=cust?hbReach('stomp'+(lvl+1)):A.hitR;if(rr)shockwave(cust?p.pos.x:ix,p.pos.y,cust?p.pos.z:iz,rr-0.3,undefined,0.32+rr*0.02);}
  addShake(L.sh,ix,iz,L.shR);thud(Math.min(1,0.6+0.2*f));if(lvl>=1)tone('sine',lvl===2?42:60,20,lvl===2?1.1:0.6,lvl===2?0.45:0.25);
  rumble(p,Math.min(1,0.4+0.25*f),150+90*f);
  if(ABIL.groundSpike)groundSpikes(p,lvl);
}
