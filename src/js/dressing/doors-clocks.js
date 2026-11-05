// ---- doors: real doors in the doorways, that swing open (or slide apart: the big automatic entrances) as anyone
// walks up to them -- a hippo, a goblin -- and close again behind them. Wooden front doors on houses, glass doors on
// shops and offices, the big red barn doors. Drawn for the buildings near you; smash the doorway and its door goes. ----
const DOOR_RANGE=64,DOOR_MAX=90,DOORIDS=new Set([DOOR_W,DOOR_WK,DOOR_G,DOOR_GB,DOOR_BARN]);
// every door of a building, in world terms: along 'x' or 'z' (the way its width runs), from a0 to a1, in the wall
// block c, h high, what kind, which way is out (n) and whether it slides
function doorRects(b,px,pz){
  const X0=px*CELL,Z0=pz*CELL,out=[];
  const add=(ax,mid,w,c,n,h,kind,slide,tag)=>out.push({ax,a0:mid-w,a1:mid+w+1,c,n,h,kind,slide,key:px+','+pz+':'+b.x0+','+b.z0+':'+tag});
  if(b.bigbox){for(const e of b.bigbox)add('x',X0+e,1,Z0+b.z0,-1,4,'glass',true,'bb'+e);}
  else if(b.style!=='capitol'){const d=doorSpec(b);if(d){
    const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1,slide=d.k==='glass'&&d.h>=4&&d.w>=1;
    if(b.door===0)add('z',Z0+cz,d.w,X0+b.x0,-1,d.h,d.k,slide,'d');
    else if(b.door===1)add('z',Z0+cz,d.w,X0+b.x1-1,1,d.h,d.k,slide,'d');
    else if(b.door===2)add('x',X0+cx,d.w,Z0+b.z0,-1,d.h,d.k,slide,'d');
    else add('x',X0+cx,d.w,Z0+b.z1-1,1,d.h,d.k,slide,'d');}}
  if(b.er){if(b.er.mode==='front')add('x',X0+b.er.door,2,Z0+b.z0,-1,4,'glass',true,'er');else add('z',Z0+b.er.door,2,X0+b.x1-1,1,4,'glass',true,'er');}
  // the bathrooms' doors
  if(!b._wcAll&&!b.noIndoor&&(b.style==='normal'||b.style==='house')&&(b.top||0)>G){b._wcAll=true;const gf=b.gf||FH;for(let n=0,y=G+1;y<Math.min(b.top,b.detailTop||b.top);n++,y=G+gf+1+FH*(n-1))wcOf(b,n,px,pz);}
  if(b._wc)for(const [n,L] of b._wc)L.forEach((R,i)=>{const y=n===0?G+1:G+(b.gf||FH)+1+FH*(n-1),dr=wcDoor(R),rx=L.ex0+1+dr[0],rz=L.ez0+1+dr[1];
    if(R.dside)add('z',Z0+rz,0,X0+rx,R.dside,3,'wood',false,'wc'+n+'.'+i);else add('x',X0+rx,0,Z0+rz,R.dv?1:-1,3,'wood',false,'wc'+n+'.'+i);out[out.length-1].y=y;out[out.length-1].wc=true;});
  const wcD=(x,z,n,y,tag)=>{add('x',x,0,z,n,3,'wood',false,tag);const o=out[out.length-1];o.y=y;o.wc=true;};
  if(b.style==='arena'){const c=(b.x1-b.x0-1)/2,W=arenaWC(c-.3),f=c%1?.5:0,X=X0+b.x0+c,Z=Z0+b.z0+c;for(const sg of [-1,1])wcD(X+sg*(6+f),Z+sg*(W.v1-1+f),sg,G+2,'wc'+sg);}
  // (the capitol's: the great doors, each wing's own, and every room's, worked out from its plan)
  if(b.style==='capitol'){const g=capGeo(),U=X0+PL0,V=Z0+PL0+g.bf,at=(s,a)=>U+(s?g.c+a:g.c-1-a);
    add('x',U+g.c-.5,2.5,V,-1,8,'wood',false,'great');out[out.length-1].y=G+4;
    for(let s=0;s<2;s++){add('x',at(s,29),1,V,-1,4,'wood',false,'wing'+s);out[out.length-1].y=G+4;}
    for(const D of capPlan().doors){const y=G+4+FH*D.n,tag='r'+D.n+'.'+D.s+'.'+D.a+'.'+D.w;
      if(D.ax==='x')add('x',at(D.s,D.a),D.wd,V+D.w,-1,3,'wood',false,tag);else add('z',V+D.w,D.wd,at(D.s,D.a),D.s?-1:1,3,'wood',false,tag);
      const o=out[out.length-1];o.y=y;o.wc=true;}}
  if(b.style==='mall'||b.mall){for(const [u0,v] of mallWC(b))for(let fl=0;fl<4;fl+=2)wcD(X0+b.x0+u0+6,Z0+b.z0+v-1,-1,fl===0?G+1:G+b.gf+1+FH*(fl-1),'wc'+u0+'.'+v+'.'+fl);}
  return out;
}
// the look of each kind: shared materials, one unit box scaled into every part
const DM={wood:new THREE.MeshLambertMaterial({color:0x8a5a32}),woodD:new THREE.MeshLambertMaterial({color:0x6a4424}),brass:new THREE.MeshLambertMaterial({color:0xd8b048}),
  frame:new THREE.MeshLambertMaterial({color:0x40464e}),bar:new THREE.MeshLambertMaterial({color:0xb8bec4}),
  pane:new THREE.MeshLambertMaterial({color:0xa8d4ea,transparent:true,opacity:0.32,depthWrite:false}),
  barn:new THREE.MeshLambertMaterial({color:0xa8352c}),trim:new THREE.MeshLambertMaterial({color:0xece6d8})};
const DBOX=new THREE.BoxGeometry(1,1,1);DBOX.ub=[1,1,1];
function doorLeaf(kind,w,h,side){
  // a leaf w wide and h high, its hinge edge at x=0 and the rest of it toward +x*side
  const g=new THREE.Group(),bx=(m,cx,cy,sx,sy,sz,cz=0)=>{const o=new THREE.Mesh(DBOX,m);o.position.set(cx*side,cy,cz);o.scale.set(sx,sy,sz);g.add(o);return o;};
  if(kind==='steel'){bx(DM.frame,w/2,h/2,w-0.04,h-0.04,0.1);bx(DM.bar,w/2,h*0.5,w*0.7,0.08,0.13);bx(DM.bar,w-0.2,h*0.48,0.08,0.2,0.16);}
  else if(kind==='wood'){bx(DM.wood,w/2,h/2,w-0.04,h-0.04,0.1);bx(DM.woodD,w/2,h*0.72,w*0.62,h*0.3,0.12);bx(DM.woodD,w/2,h*0.27,w*0.62,h*0.34,0.12);
    for(const z of [-0.08,0.08])bx(DM.brass,w-0.18,h*0.46,0.08,0.08,0.06,z);}
  else if(kind==='barn'){bx(DM.barn,w/2,h/2,w-0.04,h-0.04,0.14);
    for(const z of [-0.09,0.09]){bx(DM.trim,w/2,h-0.12,w-0.04,0.16,0.04,z);bx(DM.trim,w/2,0.12,w-0.04,0.16,0.04,z);bx(DM.trim,0.1,h/2,0.16,h-0.04,0.04,z);bx(DM.trim,w-0.12,h/2,0.16,h-0.04,0.04,z);
      const L=Math.hypot(w-0.3,h-0.3),a=Math.atan2(h-0.3,w-0.3);for(const s of [1,-1]){const o=bx(DM.trim,w/2,h/2,L,0.14,0.04,z);o.rotation.z=a*s*side;}}}
  else{const f=0.09;bx(DM.frame,f/2,h/2,f,h,0.12);bx(DM.frame,w-f/2,h/2,f,h,0.12);bx(DM.frame,w/2,h-f/2,w,f,0.12);bx(DM.frame,w/2,0.12,w,0.24,0.12);
    bx(DM.pane,w/2,h/2,w-2*f,h-f-0.24,0.04);for(const z of [-0.1,0.1])bx(DM.bar,w/2,1.05,w-0.3,0.06,0.06,z);}
  return g;
}
const doorPool=[],doorsOn=new Map();   // doorsOn: key -> {R (rect), v (visual), open, want}
function doorVisual(R){
  // reuse a hidden one of the same make, else build one
  const tag=R.kind+'|'+(R.a1-R.a0)+'|'+R.h+'|'+(R.slide?1:0);
  let v=doorPool.find(o=>!o.used&&o.tag===tag);
  if(!v){if(doorPool.length>=DOOR_MAX*1.4)return null;
    const g=new THREE.Group(),W=R.a1-R.a0,two=W>1,leaves=[];
    if(!two){const hg=new THREE.Group();hg.add(doorLeaf(R.kind,W,R.h,1));g.add(hg);leaves.push({hg,side:1,w:W});}
    else for(const side of [1,-1]){const hg=new THREE.Group();hg.position.x=side>0?0:W;hg.add(doorLeaf(R.kind,W/2,R.h,side));g.add(hg);leaves.push({hg,side,w:W/2});}
    scene.add(g);v={tag,g,leaves,used:false};doorPool.push(v);}
  v.used=true;v.g.visible=true;
  const dy=R.y||G+1;if(R.ax==='x'){v.g.position.set(R.a0,dy,R.c+0.5);v.g.rotation.set(0,0,0);}else{v.g.position.set(R.c+0.5,dy,R.a0);v.g.rotation.set(0,-Math.PI/2,0);}
  return v;
}
function tryDoor(R,p,want){
  if(want.has(R.key))return;const mx=(R.a0+R.a1)/2,cx=R.ax==='x'?mx:R.c+0.5,cz=R.ax==='x'?R.c+0.5:mx,d=Math.hypot(cx-p.pos.x,cz-p.pos.z);
  if(d>DOOR_RANGE)return;
  // (only the near bathrooms get drawn, so a tower's don't use up the street's doors)
  if(R.wc&&(d>30||Math.abs((R.y||G+1)-p.pos.y)>7))return;
  // the doorway still there (its middle column, at the bottom)
  if(!DOORIDS.has(get(Math.floor(cx),R.y||G+1,Math.floor(cz))))return;
  R.x=cx;R.z=cz;R.d=d;want.set(R.key,R);
}
function stadiumDoors(S){
  const W=(S.w-1)*CELL+PL1-PL0,Ls=(S.h-1)*CELL+PL1-PL0,F=stadiumField(W,Ls),X0=S.ax*CELL+PL0,Z0=S.az*CELL+PL0,v=Math.floor(Ls/2-.5)+3,out=[];
  for(const u of [F.fx0-12,F.fx0+F.fw-1+12])out.push({ax:'x',a0:X0+u,a1:X0+u+1,c:Z0+v,n:-1,h:3,kind:'wood',slide:false,y:G+1,wc:true,key:'st'+S.ax+','+S.az+':'+u});
  return out;
}
function refreshDoors(){
  const want=new Map(),seenS=new Set();
  for(const p of viewers()){seenS.clear();
    for(let qx=Math.floor((p.pos.x-DOOR_RANGE)/CELL);qx<=Math.floor((p.pos.x+DOOR_RANGE)/CELL);qx++)for(let qz=Math.floor((p.pos.z-DOOR_RANGE)/CELL);qz<=Math.floor((p.pos.z+DOOR_RANGE)/CELL);qz++){
      const t=plotType(qx,qz);if(t==='plains'||t==='river'||t==='ramp'||!tenvShow(qx,qz))continue;
      // (a big site's doors all hang off its first plot, however far across the site they are: from any part of it, go to that plot,
      // or the doors at the far end of a capitol or a campus only appear when you're near the other end)
      let px=qx,pz=qz;if(t==='super'){const S=superOf(qx,qz);if(seenS.has(S))continue;seenS.add(S);px=S.ax;pz=S.az;}
      const P=plotInfo(px,pz);
      P.b.forEach((b,bi)=>{if(collapses[px+','+pz+','+bi]!==undefined&&collapses[px+','+pz+','+bi]<=G+1+4)return;
        for(const R of doorRects(b,px,pz))tryDoor(R,p,want);});
      if(t==='super'&&superOf(px,pz).kind==='stadium')for(const R of stadiumDoors(superOf(px,pz)))tryDoor(R,p,want);
    }}
  // the nearest ones, up to the limit
  const list=[...want.values()].sort((a,b)=>a.d-b.d).slice(0,DOOR_MAX),keep=new Set(list.map(R=>R.key));
  for(const [k,D] of doorsOn)if(!keep.has(k)){if(D.v){D.v.used=false;D.v.g.visible=false;}doorsOn.delete(k);}
  for(const R of list){const D=doorsOn.get(R.key);if(D){D.R=R;continue;}const v=doorVisual(R);if(v)doorsOn.set(R.key,{R,v,open:0,dir:1});}
}
function updateDoors(dt){
  const who=[];for(const p of players)if(p.active&&p.state!=='dead')who.push([p.pos.x,p.pos.z,p.pos.y,3.4]);
  for(const g of goblins)if(g.root.visible&&g.state!=='wait'&&g.state!=='dead'&&g.hp>0)who.push([g.pos.x,g.pos.z,g.pos.y,2.2]);
  for(const D of doorsOn.values()){
    const R=D.R;let near=null,nd=1e9;
    for(const [x,z,y,r] of who){if(Math.abs(y-(R.y||G+1))>3)continue;const d=Math.hypot(x-R.x,z-R.z)-((R.a1-R.a0)/2-0.5);if(d<r&&d<nd){nd=d;near=[x,z];}}
    const tgt=near?1:0;
    if(near&&D.open<0.05){const out=(R.ax==='x'?near[1]-R.z:near[0]-R.x)*R.n>0;D.dir=out?1:-1;   // (swings away from whoever's coming)
      if(D.open<0.02&&D.R.d<40)R.kind==='glass'?noise(0.18,0.03,1800,'bandpass'):tone('sawtooth',140,95,0.18,0.012);}
    D.open+=(tgt-D.open)*Math.min(1,dt*(tgt?7:3.5));
    const v=D.v;if(!v)continue;const o=D.open;
    for(const L of v.leaves){
      if(R.slide){L.hg.rotation.y=0;L.hg.position.z=0;const base=L.side>0?0:R.a1-R.a0;L.hg.position.x=base-L.side*o*L.w*0.92;}
      else{
        // local +z is world out for doors along x on the far side... work out which way 'away' is in the leaf's frame
        const outZ=(R.ax==='x'?R.n:-R.n)*D.dir;   // +1: swing toward local -z
        L.hg.rotation.y=o*1.5*outZ*L.side;}
    }
  }
}
// ---- clock faces and bells on the towers: real dials (their hands keep the game's time) and a bronze bell that
// swings when it rings. On the hour a bell tower strikes the hour; a clock tower plays its chime. ----
const LM_RANGE=170,lmOn=new Map(),LM_TYPES=new Set(['lighthouse','plaza','bell','radio','news','bank','disco','stocks','super','datacenter','lab']);
let dialTex=null;
function dialMat(){
  if(dialTex)return dialTex;
  const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
  if(x&&x.beginPath&&x.fillText){
    x.fillStyle='#f4efe0';x.beginPath();x.arc(128,128,124,0,Math.PI*2);x.fill();x.lineWidth=10;x.strokeStyle='#2a2a2a';x.stroke();
    x.fillStyle='#222';for(let i=0;i<60;i++){const a=i/60*Math.PI*2,r0=i%5?108:100,r1=116;x.lineWidth=i%5?2:5;x.strokeStyle='#222';x.beginPath();x.moveTo(128+Math.sin(a)*r0,128-Math.cos(a)*r0);x.lineTo(128+Math.sin(a)*r1,128-Math.cos(a)*r1);x.stroke();}
    const RN=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];x.font='700 22px Georgia, serif';x.textAlign='center';x.textBaseline='middle';
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.fillText(RN[i],128+Math.sin(a)*80,128-Math.cos(a)*80);}
    x.beginPath();x.arc(128,128,8,0,Math.PI*2);x.fill();}
  const t=new THREE.CanvasTexture(cv);return dialTex=new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:0.3});
}
const LMM={coach:new THREE.MeshLambertMaterial({color:0xd8dce0}),loco:new THREE.MeshLambertMaterial({color:0xd02a2a}),canopy:new THREE.MeshLambertMaterial({color:0xe84a6a}),gold:new THREE.MeshLambertMaterial({color:0xd4af37}),arc:new THREE.MeshBasicMaterial({color:0xc8e8ff}),ledOn:new THREE.MeshBasicMaterial({color:0x40ff60}),ledOn2:new THREE.MeshBasicMaterial({color:0x40a0ff}),ledOff:new THREE.MeshBasicMaterial({color:0x0a1a0a}),blink:new THREE.MeshBasicMaterial({color:0x400808}),dish:new THREE.MeshLambertMaterial({color:0xeef0f2}),vault:new THREE.MeshLambertMaterial({color:0x8a9098}),bar:new THREE.MeshLambertMaterial({color:0xc8ccd0}),ball:new THREE.MeshLambertMaterial({color:0xd8dce4,emissive:0x303040}),hand:new THREE.MeshLambertMaterial({color:0x1c1c1c}),bell:new THREE.MeshLambertMaterial({color:0xb08a3c}),beam:new THREE.MeshLambertMaterial({color:0x5a4028})};
LMM.beam=new THREE.MeshBasicMaterial({color:0xfff4c0,transparent:true,opacity:0.2,depthWrite:false});
const LM_CONE=new THREE.ConeGeometry(5.6,2.2,12),LM_DISH=new THREE.CylinderGeometry(1.5,0.5,0.35,16),LM_VAULT=new THREE.CylinderGeometry(1.5,1.5,0.5,20),LM_BALL=new THREE.SphereGeometry(0.75,10,8),LM_DIAL=new THREE.PlaneGeometry(3.7,3.7),LM_BELL=new THREE.CylinderGeometry(0.55,1.05,1.35,12),LM_BOX=new THREE.BoxGeometry(1,1,1);LM_BOX.ub=[1,1,1];
function lmVisual(b,px,pz){
  const g=new THREE.Group(),X0=px*CELL,Z0=pz*CELL,cx=X0+(b.x0+b.x1)/2,cz=Z0+(b.z0+b.z1)/2,v={g,hands:[],bell:null};
  if(b.clock){
    // four dials, one on each face of the clock stage (its middle is 24 up), each with an hour and a minute hand
    const W=(b.x1-b.x0)/2+0.04,yc=G+24;
    for(let k=0;k<4;k++){const f=new THREE.Group(),a=k*Math.PI/2;f.position.set(cx+Math.sin(a)*W,yc,cz+Math.cos(a)*W);f.rotation.y=a;
      const d=new THREE.Mesh(LM_DIAL,dialMat());f.add(d);
      const mk=(len,wd)=>{const h=new THREE.Group();h.position.z=0.04;const m=new THREE.Mesh(LM_BOX,LMM.hand);m.scale.set(wd,len,0.05);m.position.y=len/2-0.15;h.add(m);f.add(h);return h;};
      v.hands.push([mk(1.05,0.16),mk(1.55,0.1)]);g.add(f);}
  }
  if(b.bell){
    // the bell hangs from a beam across the belfry (whose floor is 18 up)
    const pv=new THREE.Group();pv.position.set(cx,G+23.6,cz);const bm=new THREE.Mesh(LM_BOX,LMM.beam);bm.scale.set(b.x1-b.x0-0.2,0.3,0.3);bm.position.set(cx,G+23.8,cz);g.add(bm);
    const bl=new THREE.Mesh(LM_BELL,LMM.bell);bl.position.y=-0.85;pv.add(bl);const cl=new THREE.Mesh(LM_BOX,LMM.hand);cl.scale.set(0.16,0.7,0.16);cl.position.y=-1.4;pv.add(cl);g.add(pv);v.bell=pv;}
  if(b.mast){const l=new THREE.Mesh(LM_BOX,LMM.blink);l.scale.setScalar(0.6);l.position.set(X0+b.x0+1.5,b.top+1.4,Z0+b.z0+1.5);g.add(l);v.blink=l;}
  if(b.dishes){
    // two satellite dishes up on the roof, tipped up at the sky
    for(const [fx,fz,a] of [[0.3,0.35,0.6],[0.7,0.6,-0.9]]){const d=new THREE.Group();d.position.set(X0+b.x0+(b.x1-b.x0)*fx,b.top+1,Z0+b.z0+(b.z1-b.z0)*fz);d.rotation.y=a;
      const post=new THREE.Mesh(LM_BOX,LMM.hand);post.scale.set(0.25,1.6,0.25);post.position.y=0.8;d.add(post);
      const dish=new THREE.Mesh(LM_DISH,LMM.dish);dish.position.y=2.1;dish.rotation.x=-0.75;d.add(dish);g.add(d);}}
  if(b.vault){
    // the vault's round steel door, swung half open beside its doorway
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,vx=X0+b.x0+1+((I-6)>>1)+3,vz=Z0+b.z0+1+J-6;const d=new THREE.Group();d.position.set(vx-1.6,G+2.6,vz+0.5);
    const disc=new THREE.Mesh(LM_VAULT,LMM.vault);disc.rotation.x=Math.PI/2;disc.position.x=1.6;d.add(disc);
    for(let k=0;k<3;k++){const sp=new THREE.Mesh(LM_BOX,LMM.bar);sp.scale.set(2.6,0.16,0.16);sp.rotation.z=k*Math.PI/3;sp.position.set(1.6,0,-0.35);d.add(sp);}
    d.rotation.y=-1.1;g.add(d);}
  if(b.fish){
    // fish: each swims its own lazy loop inside one of the tanks
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,long=I>=J,Wl=long?I:J,Wc=long?J:I,W=(a,c)=>long?[X0+b.x0+1+a,Z0+b.z0+1+c]:[X0+b.x0+1+c,Z0+b.z0+1+a];
    const tl=Math.floor(Wl/2)-5,th=Math.floor(Wl/2)+5,tanks=[[6,tl-1,0,2.6],[th+1,Wl-3,0,2.6],[6,tl-1,Wc-3.6,Wc-1],[th+1,Wl-3,Wc-3.6,Wc-1],[tl+1,th-1,0,Wc-1]];
    v.fish=[];const cols=[0xff8a20,0xffd030,0x30a0ff,0xff4060,0xf0f0f0,0x40e0c0];
    for(let i=0;i<22;i++){const T2=tanks[i%tanks.length];if(T2[1]<=T2[0])continue;const m=new THREE.Mesh(LM_BOX,LMM['f'+(i%6)]||(LMM['f'+(i%6)]=new THREE.MeshLambertMaterial({color:cols[i%6],emissive:0x101010})));
      m.scale.set(0.5,0.28,0.14);g.add(m);const [ax0,az0]=W(T2[0],T2[2]),[ax1,az1]=W(T2[1],T2[3]);
      v.fish.push({m,x0:Math.min(ax0,ax1)+0.6,x1:Math.max(ax0,ax1)+0.4,z0:Math.min(az0,az1)+0.6,z1:Math.max(az0,az1)+0.4,y:G+1.6+Math.random()*(i%5===4?1.2:4.6),ph:Math.random()*7,sp:0.15+Math.random()*0.25,tunnel:i%5===4});}}
  if(b.smoke){v.smoke={x:X0+b.x0+1.5,y:b.top+1,z:Z0+b.z0+1.5,t:0};}
  if(b.steam){v.steam={x:X0+(b.x0+b.x1)/2,y:b.top+1,z:Z0+(b.z0+b.z1)/2,t:0};}
  if(b.arms){v.arms=[];for(const [ax,az] of b.arms){const m=new THREE.Mesh(LM_BOX,LMM.bar);m.scale.set(13.4,0.5,0.6);m.position.set(X0+ax+0.5,G+2.4,Z0+az+0.5);g.add(m);v.arms.push(m);}}
  if(b.coils){
    // the Tesla coils: arcs of lightning crackling off their tops
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,cv=J>>1;v.coils=[[5,cv],[I-6,cv]].map(([iu,iv])=>({x:X0+b.x0+1+iu+0.5,z:Z0+b.z0+1+iv+0.5,y:G+6.6}));v.arcs=[];
    for(let i=0;i<10;i++){const m=new THREE.Mesh(LM_BOX,LMM.arc);m.visible=false;g.add(m);v.arcs.push(m);}
    v.vats=[];for(let iv=2;iv<J-2;iv+=5)for(const iu of [2,I-3])v.vats.push({x:X0+b.x0+1+iu+0.5,z:Z0+b.z0+1+iv+0.5});v.t=0;}
  if(b.leds){
    // the server racks' lights, blinking away
    v.leds=[];const W=b.x1-b.x0,D=b.z1-b.z0;for(let i=0;i<48;i++){const vv=2+3*Math.floor(Math.random()*Math.floor((D-3)/3)),uu=2+Math.floor(Math.random()*(W-4));if(uu===((W-1)>>1))continue;
      const m=new THREE.Mesh(LM_BOX,LMM.ledOff);m.scale.set(0.12,0.07,0.05);m.position.set(X0+b.x0+uu+0.2+Math.random()*0.6,G+1.2+Math.random()*4.6,Z0+b.z0+vv-0.03);g.add(m);v.leds.push(m);}}
  if(b.ticker){
    // the stock ticker: a band of prices crawling across the back wall of the trading floor
    const I=b.x1-b.x0-2,m=new THREE.Mesh(new THREE.PlaneGeometry(I,0.9),tickerMat());m.position.set(X0+b.x0+1+I/2,G+8.2,Z0+b.z1-1-0.06);m.rotation.y=Math.PI;g.add(m);}
  if(b.disco){
    // the dance floor: a grid of coloured squares that keep changing; a mirror ball spinning over it
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,u0=X0+b.x0+3,u1=X0+b.x0+1+I-2,v0=Z0+b.z0+3,v1=Z0+b.z0+1+J-3;
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(u1-u0,v1-v0),discoMat());fl.rotation.x=-Math.PI/2;fl.position.set((u0+u1)/2,G+1.03,(v0+v1)/2);g.add(fl);
    const ball=new THREE.Mesh(LM_BALL,LMM.ball);ball.position.set((u0+u1)/2,b.top-1.6,(v0+v1)/2);g.add(ball);v.ball=ball;}
  if(b.beam){const bm=new THREE.Group(),c0=(b.x0+b.x1)>>1,c1=(b.z0+b.z1)>>1;bm.position.set(X0+c0+0.5,G+24.5,Z0+c1+0.5);
    for(const sg of [1,-1]){const m=new THREE.Mesh(LM_BOX,LMM.beam);m.scale.set(1.4,1.4,70);m.position.z=sg*36;bm.add(m);}g.add(bm);v.beam=bm;}
  scene.add(g);return v;
}
let tickTex=null;
function tickerMat(){
  if(tickTex)return tickTex;const cv=document.createElement('canvas');cv.width=1024;cv.height=64;const x=cv.getContext('2d');
  if(x&&x.fillText){x.fillStyle='#050a05';x.fillRect(0,0,1024,64);x.font='700 34px ui-monospace, Menlo, monospace';x.textBaseline='middle';
    const S=['GOB','SNOT','MUD','WART','GRUB','BOG','HIPO','TOAD','FANG','SLAG','RUST','GLUM'];let px=10;
    for(let i=0;i<12;i++){const up=Math.random()<0.55,ch=(Math.random()*9).toFixed(2),t=S[i]+' '+(10+Math.random()*90).toFixed(2)+(up?' \u25B2':' \u25BC')+ch+'   ';x.fillStyle=up?'#5cff6a':'#ff5a4a';x.fillText(t,px,33);px+=x.measureText(t).width;if(px>1000)break;}}
  const t=new THREE.CanvasTexture(cv);t.wrapS=THREE.RepeatWrapping;tickTex=new THREE.MeshBasicMaterial({map:t});return tickTex;
}
let discoTex=null,discoCv=null,discoT=0;
function discoMat(){
  if(discoTex)return discoTex;discoCv=document.createElement('canvas');discoCv.width=discoCv.height=8;
  const t=new THREE.CanvasTexture(discoCv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat&&t.repeat.set&&t.repeat.set(2,2);
  discoTex=new THREE.MeshBasicMaterial({map:t});return discoTex;
}
function discoTick(dt){
  discoT-=dt;if(discoT>0||!discoCv)return;discoT=0.35;const x=discoCv.getContext('2d');if(!x||!x.fillRect)return;
  const C=['#ff3a8c','#3ad0ff','#ffe03a','#7aff4a','#b44aff','#ff8a2a','#1a1a24'];
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.fillStyle=C[Math.floor(Math.random()*C.length)];x.fillRect(i,j,1,1);}
  discoTex.map.needsUpdate=true;
}
// the campfires (see hearths): the fire pits on a campsite, an encampment's barrel fire, the fire before a cult's altar, the
// militia's and thieves' fires. Each is a real fire burning on its wood, with a bed of glowing embers under the flames
// (which is also what the Structures preview shows, as it doesn't run the flames). Gone with the wood.
const campOn=new Map(),CAMP_FIRE=new THREE.MeshBasicMaterial({color:0xff8a2a});
function campFires(dt){
  campFires.t=(campFires.t||0)-dt;
  if(campFires.t<=0){campFires.t=1;const want=new Set();
    for(const p of viewers()){for(let px=Math.floor((p.pos.x-80)/CELL);px<=Math.floor((p.pos.x+80)/CELL);px++)for(let pz=Math.floor((p.pos.z-80)/CELL);pz<=Math.floor((p.pos.z+80)/CELL);pz++){
      if(!tenvShow(px,pz))continue;const pts=[],t=plotType(px,pz);
      if(t==='camp'){const P=plotInfo(px,pz);pts.push([px*CELL+P.fire.x,pz*CELL+P.fire.z,RUST,'Burned in a barrel fire']);}
      else if(t==='campsite'||t==='cult'||t==='militia'||t==='thieves'){const B=bigPlainsAt(px,pz);if(B.ax!==px||B.az!==pz)continue;const X0=B.ax*CELL,Z0=B.az*CELL;
        if(t==='cult')pts.push([X0+16,Z0+13,LOG,'Burned in the altar fire']);
        if(t==='militia')pts.push([X0+24,Z0+34,LOG,'Burned in a campfire']);
        if(t==='thieves')pts.push([X0+16,Z0+6,LOG,'Burned in a campfire']);
        if(t==='campsite')for(const q of campPitches(B))pts.push(q.k==='rv'?[X0+q.u+2,Z0+(q.v<20?q.v-3:q.v+5),LOG,'Burned in a campfire']:[X0+q.u+(q.ax?1:5),Z0+q.v+(q.ax?5:1),LOG,'Burned in a campfire']);}
      for(const [x,z,base,why] of pts){const k=x+','+z;if(get(x,G+1,z)!==base)continue;want.add(k);
        if(!campOn.has(k)){const m=new THREE.Mesh(LM_BOX,CAMP_FIRE);m.position.set(x+0.5,G+2.04,z+0.5);m.scale.set(0.62,0.08,0.62);scene.add(m);campOn.set(k,m);
          hearths.set(k,{x:x+0.5,y:G+2,z:z+0.5,s:base===RUST?0.9:1,acc:0,sacc:Math.random(),hurt:0.9*Math.random(),why});}}}}
    for(const [k,m] of campOn)if(!want.has(k)){scene.remove(m);campOn.delete(k);hearths.delete(k);}}
  const f=0.75+0.25*Math.sin(performance.now()*0.02)*Math.sin(performance.now()*0.013);CAMP_FIRE.color.setRGB(1,0.3+0.2*f,0.08);
}
function refreshLandmarks(){
  const want=new Set();
  for(const p of viewers()){
    for(let px=Math.floor((p.pos.x-LM_RANGE)/CELL);px<=Math.floor((p.pos.x+LM_RANGE)/CELL);px++)for(let pz=Math.floor((p.pos.z-LM_RANGE)/CELL);pz<=Math.floor((p.pos.z+LM_RANGE)/CELL);pz++){
      const t=plotType(px,pz);if(!LM_TYPES.has(t)||!tenvShow(px,pz))continue;const P=plotInfo(px,pz);
      P.b.forEach((b,bi)=>{if(b.beam){const key=px+','+pz+','+bi,cx=px*CELL+((b.x0+b.x1)>>1),cz=pz*CELL+((b.z0+b.z1)>>1);if(collapses[key]!==undefined||want.has(key)||!get(cx,G+24,cz))return;want.add(key);if(!lmOn.has(key))lmOn.set(key,{v:lmVisual(b,px,pz),b,x:cx,z:cz,swing:0,ringT:0});return;}
        if(!b.clock&&!b.bell&&!b.mast&&!b.dishes&&!b.disco&&!b.vault&&!b.ticker&&!b.fish&&!b.smoke&&!b.leds&&!b.arms&&!b.steam&&!b.coils)return;const key=px+','+pz+','+bi;if(want.has(key))return;
        if(collapses[key]!==undefined)return;   // (gone with the building)
        const X0=px*CELL,Z0=pz*CELL,cx=X0+((b.x0+b.x1)>>1),cz=Z0+((b.z0+b.z1)>>1);if(Math.hypot(cx-p.pos.x,cz-p.pos.z)>((b.disco||b.vault||b.ticker||b.fish||b.leds||b.coils)?70:LM_RANGE))return;
        // still standing where it matters (a tower's corner piers up top, a mast's top, a roof corner...)?
        const ay=b.clock?G+23:b.bell?G+20:b.mast||b.smoke?b.top-1:b.dishes?b.top:b.steam?G+10:G+1;if(!get(b.steam?X0+((b.x0+b.x1)>>1):X0+b.x0,ay,b.steam?Z0+b.z0+1:Z0+b.z0+(b.smoke?1:0))&&!b.steam)return;
        want.add(key);if(!lmOn.has(key))lmOn.set(key,{v:lmVisual(b,px,pz),b,x:cx,z:cz,swing:0,ringT:0});});}}
  for(const [k,L] of lmOn)if(!want.has(k)){scene.remove(L.v.g);lmOn.delete(k);}
}
let lmHour=-1,chimeQ=[];
function bellStrike(vol,delay){tone('sine',392,390,2.6,vol,delay);tone('sine',784,780,1.4,vol*0.45,delay);tone('sine',1176,1170,0.8,vol*0.22,delay);tone('triangle',196,195,3.2,vol*0.5,delay);}
function updateLandmarks(dt){
  const h=hourNow(),mins=h-Math.floor(h),h12=(h%12)/12;
  // on the hour: the nearest bell tower strikes it (as many strokes as the hour), the nearest clock tower chimes
  const hr=Math.floor(h);
  if(lmHour<0)lmHour=hr;
  else if(hr!==lmHour){lmHour=hr;
    if(playing&&audio){const me=players.find(q=>q.active);let nb=null,nbd=1e9,nc=null,ncd=1e9;
      for(const L of lmOn.values()){const d=me?Math.hypot(L.x-me.pos.x,L.z-me.pos.z):1e9;if(L.b.bell&&d<nbd){nbd=d;nb=L;}if(L.b.clock&&d<ncd){ncd=d;nc=L;}}
      if(nb&&nbd<150){const n=hr%12||12,vol=0.09*(1-nbd/150);for(let i=0;i<n;i++)bellStrike(vol,i*1.3);nb.ringT=n*1.3+1.2;}
      if(nc&&ncd<150){const vol=0.08*(1-ncd/150);[659,523,587,392].forEach((f,i)=>tone('sine',f,f,1.6,vol,i*0.75));nc.ringT=3.5;}}}
  discoTick(dt);
  if(tickTex&&tickTex.map.offset)tickTex.map.offset.x=(tickTex.map.offset.x+dt*0.05)%1;
  campFires(dt);
  {const on=Math.floor(performance.now()/700)%2===0;LMM.blink.color.setHex(on?0xff2020:0x400808);}
  const tnow=performance.now()/1000;
  for(const L of lmOn.values()){
    if(L.v.ball)L.v.ball.rotation.y+=dt*1.2;
    if(L.v.fish)for(const F of L.v.fish){const t=tnow*F.sp+F.ph,u=(Math.sin(t)+1)/2,w=(Math.sin(t*1.7+1)+1)/2;F.m.position.set(F.x0+(F.x1-F.x0)*u,F.y+Math.sin(t*2.3)*0.3,F.z0+(F.z1-F.z0)*w);F.m.rotation.y=Math.atan2((F.x1-F.x0)*Math.cos(t),(F.z1-F.z0)*1.7*Math.cos(t*1.7+1))+Math.PI/2;}
    if(L.v.steam){const S2=L.v.steam;S2.t-=dt;if(S2.t<=0){S2.t=0.12;smoke(S2.x+(Math.random()-.5)*8,S2.y,S2.z+(Math.random()-.5)*8,2,0xf2f2f0);}}
    if(L.v.arms)for(const m of L.v.arms)m.rotation.y+=dt*0.12;
    if(L.v.beam)L.v.beam.rotation.y+=dt*0.8;
    if(L.v.coils){const V=L.v;V.t-=dt;
      if(V.t<=0){V.t=0.06+Math.random()*0.12;const on=Math.random()<0.7;
        for(const m of V.arcs){m.visible=on&&Math.random()<0.7;if(!m.visible)continue;const C=V.coils[Math.floor(Math.random()*V.coils.length)],a=Math.random()*Math.PI*2,len=1.5+Math.random()*3,dy=(Math.random()-0.3)*2;
          m.position.set(C.x+Math.cos(a)*len/2,C.y+dy/2,C.z+Math.sin(a)*len/2);m.scale.set(len,0.08,0.08);m.rotation.set(0,-a,Math.atan2(dy,len));}
        const me=players.find(q=>q.active);if(on&&me&&Math.hypot(V.coils[0].x-me.pos.x,V.coils[0].z-me.pos.z)<22&&Math.random()<0.4)noise(0.06,0.05,3200,'highpass');
        if(Math.random()<0.25&&V.vats.length){const W2=V.vats[Math.floor(Math.random()*V.vats.length)];puff(W2.x,G+3.2,W2.z,1,0x70ff60,0.15);}}}
    if(L.v.smoke){const S2=L.v.smoke;S2.t-=dt;if(S2.t<=0){S2.t=0.3;smoke(S2.x,S2.y,S2.z,1,0x8a8a88);}}
    if(L.v.leds&&Math.random()<dt*8)for(let i=0;i<6;i++){const m=L.v.leds[Math.floor(Math.random()*L.v.leds.length)];if(m)m.material=Math.random()<0.5?LMM.ledOff:(Math.random()<0.7?LMM.ledOn:LMM.ledOn2);}
    for(const [hh,mm] of L.v.hands){hh.rotation.z=-h12*Math.PI*2;mm.rotation.z=-mins*Math.PI*2;}
    if(L.v.bell){L.ringT=Math.max(0,L.ringT-dt);L.swing+=dt*4.8;const amp=Math.min(0.5,L.ringT*0.35);L.v.bell.rotation.x=Math.sin(L.swing)*amp;}
  }
}
// ---- crowds at the stadiums and arenas, the players and cheerleaders, the zoo's animals ----
// A game is on at a stadium on some afternoons and evenings (every third day in the afternoon, the day after that in
// the evening), at an arena on alternate evenings: then the stands fill, the teams play, the cheerleaders dance, and
// every so often the crowd jumps up roaring. Otherwise the stands are all but empty.
const FANS_MAX=7000,CR_B=new THREE.InstancedMesh(new THREE.BoxGeometry(0.62,0.72,0.42),new THREE.MeshLambertMaterial({color:0xffffff}),FANS_MAX),CR_H=new THREE.InstancedMesh(new THREE.BoxGeometry(0.44,0.4,0.4),new THREE.MeshLambertMaterial({color:GC.skin}),FANS_MAX);
CR_B.setColorAt(0,new THREE.Color(0xffffff));
for(const m of [CR_B,CR_H]){m.frustumCulled=false;m.count=0;scene.add(m);}
const PL_MAX=64,PL_B=new THREE.InstancedMesh(new THREE.BoxGeometry(0.8,1.1,0.5),new THREE.MeshLambertMaterial({color:0xffffff}),PL_MAX),PL_H=new THREE.InstancedMesh(new THREE.BoxGeometry(0.55,0.5,0.5),new THREE.MeshLambertMaterial({color:GC.skin}),PL_MAX);
PL_B.setColorAt(0,new THREE.Color(0xffffff));for(const m of [PL_B,PL_H]){m.frustumCulled=false;m.count=0;scene.add(m);}
const BALL=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6),new THREE.MeshLambertMaterial({color:0xf4f4f0}));BALL.visible=false;scene.add(BALL);
const venues=new Map(),TOLLM=new THREE.MeshLambertMaterial({color:0xe02a2a});let venueT=0;
const gameOn=kind=>{const h=hourNow();return kind==='stadium'?(dayN%3===0&&h>=13&&h<17||dayN%3===1&&h>=19&&h<22):(dayN%2===0&&h>=19&&h<22);};
function venueSeats(V){
  // every seat in the stands with room above it (scanned once the venue's blocks are built)
  const S=V.S,x0=S.ax*CELL+PL0,z0=S.az*CELL+PL0,x1=(S.ax+S.w-1)*CELL+PL1,z1=(S.az+S.h-1)*CELL+PL1,out=[],yMax=V.kind==='stadium'?G+STAND+2:G+24;
  for(let x=x0;x<x1;x++)for(let z=z0;z<z1;z++)for(let y=G+1;y<=yMax;y++){const b=get(x,y,z);if((b===SEAT_R||b===SEAT_B)&&get(x,y+1,z)===AIR){out.push([x+0.5,y+1,z+0.5,hash2(x*13+y,z*7+y*3)]);break;}}
  return out;
}
