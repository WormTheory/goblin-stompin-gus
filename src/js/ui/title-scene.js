// ---------- The title screen's backdrop ----------
// A side view of Gus's real model (the same boxes the game builds him from, makePlayer) stomping along on the spot,
// in front of a stylised city that scrolls past behind him: rows of blocky buildings in the menus' crayon colours, each
// row further back than the last, so they slide by at different speeds, under a flat sky with a few clouds. Every box
// has a thick ink outline (a slightly bigger copy of it, drawn from the inside, the "inverted hull" trick).
// It's a little scene of its own, drawn on the game's own canvas in place of the city while the title screen is up
// (titleDraw, from frame), and never touched once you're playing. With reduced motion on it holds still.
const TSC={ok:null,t:0,scroll:0,stomp:0,shake:0,dust:[]};
const TS_INK=0x2b1b2e;
// (reduced motion: the system's setting, or the Options switch)
const reduceMotion=()=>reduce||!!(document.body&&document.body.classList&&document.body.classList.contains('calm'));
// many boxes as one mesh: {x,y,z,w,h,d,c} each (x,y,z its bottom middle), coloured per vertex; grow>0 makes the outline
// copy instead (every box that much bigger all round, faces turned inside out, plain ink)
function tsGeo(L,grow){
  const n=L.length,P=new Float32Array(n*72),N=new Float32Array(n*72),C=new Float32Array(n*72),I=[];
  const F=[[0,1,0,[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[0,-1,0,[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]],[1,0,0,[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],
    [-1,0,0,[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[0,0,1,[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[0,0,-1,[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]]];
  const col=new THREE.Color();
  L.forEach((b,i)=>{col.setHex(b.c||TS_INK);const hw=b.w/2+grow,hh=b.h/2+grow,hd=b.d/2+grow,cy=b.y+b.h/2;
    F.forEach(([nx,ny,nz,V],f)=>{const o=i*24+f*4;
      V.forEach(([a,bb,c],k)=>{const q=(o+k)*3;P[q]=b.x+a*hw;P[q+1]=cy+bb*hh;P[q+2]=b.z+c*hd;N[q]=nx;N[q+1]=ny;N[q+2]=nz;C[q]=col.r;C[q+1]=col.g;C[q+2]=col.b;});
      I.push(o,o+1,o+2,o,o+2,o+3);});});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
  g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setIndex(I);return g;
}
// a row of the backdrop: its boxes laid out over [0,L), drawn twice side by side so it can wrap round for ever
function tsRow(S,L,boxes,line,speed){
  const grp=new THREE.Group(),mat=TSC.mat,ink=TSC.ink,g=tsGeo(boxes,0),h=line>0?tsGeo(boxes,line):null;
  for(const k of [0,1]){const m=new THREE.Mesh(g,mat);m.position.x=k*L;grp.add(m);if(h){const o=new THREE.Mesh(h,ink);o.position.x=k*L;grp.add(o);}}
  S.add(grp);return {grp,L,speed};
}
const tsR=(i,salt)=>{const v=Math.sin(i*127.1+salt*311.7)*43758.5453;return v-Math.floor(v);};
function titleInit(){
  if(TSC.ok!==null)return TSC.ok;
  TSC.ok=false;
  try{
    if(typeof renderer.getContext!=='function')return false;   // (the tests' stand-in for three.js has nothing to draw with)
    const S=TSC.scene=new THREE.Scene();S.background=new THREE.Color(0xa8e0f0);
    S.add(new THREE.HemisphereLight(0xfff6dc,0x9a8aa0,0.95));const d=new THREE.DirectionalLight(0xffffff,0.5);d.position.set(5,9,10);S.add(d);
    TSC.cam=new THREE.PerspectiveCamera(28,16/9,0.5,900);
    TSC.mat=new THREE.MeshLambertMaterial({vertexColors:true});
    TSC.ink=new THREE.MeshBasicMaterial({color:TS_INK,side:THREE.BackSide});
    // Gus himself: a hippo made the way the players are, side eyes, no bow, outlined box by box
    const G=makePlayer(0);scene.remove(G.root);if(G.pool)scene.remove(G.pool);try{G.ui.view.remove();}catch(e){}
    for(const m of G.eyeFront)m.visible=false;for(const m of G.eyeSide)m.visible=true;for(const m of G.bow)m.visible=false;
    const hull=[];G.root.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.parameters)hull.push(o);});
    for(const o of hull){const P=o.geometry.parameters,t=0.05,h=new THREE.Mesh(o.geometry,TSC.ink);h.scale.set((P.width+2*t)/P.width,(P.height+2*t)/P.height,(P.depth+2*t)/P.depth);o.add(h);}
    G.root.visible=true;G.root.rotation.y=Math.PI/2;S.add(G.root);TSC.gus=G;
    // the street he walks along: road, kerb, pavement, and the dashes down the middle (these scroll with him)
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,460),new THREE.MeshLambertMaterial({color:0x8a8296}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-0.02,-180);S.add(ground);
    const W=60,near=[];
    near.push({x:W/2,y:-0.02,z:-3.2,w:W+0.01,h:0.2,d:2.2,c:0xd8cfc0},{x:W/2,y:-0.02,z:-4.4,w:W+0.01,h:0.22,d:0.25,c:0xf3ead5});
    for(let i=0;i<W;i+=4)near.push({x:i+1,y:-0.015,z:1.6,w:2,h:0.03,d:0.22,c:0xfff6dc});
    // lamp posts and trees along the pavement
    for(let i=0;i<W;i+=10){near.push({x:i+2,y:0,z:-3.6,w:0.22,h:3.6,d:0.22,c:0x5a4a5e},{x:i+2.45,y:3.5,z:-3.6,w:1.1,h:0.22,d:0.3,c:0x5a4a5e},{x:i+2.9,y:3.25,z:-3.6,w:0.45,h:0.28,d:0.4,c:0xffd447});
      near.push({x:i+7,y:0,z:-3.7,w:0.35,h:1.4,d:0.35,c:0x8a5a3a},{x:i+7,y:1.3,z:-3.7,w:1.7,h:1.5,d:1.7,c:0x6fbf3a});}
    TSC.rows=[tsRow(S,W,near,0.05,1)];
    // three rows of buildings, near to far: low shops and houses, then mid-rise blocks, then towers on the skyline
    // (each row wider than the most the camera can see of it, even on a very wide screen, so it can wrap unseen)
    const ROWS=[{z:-12,L:90,hm:[3.5,8],wd:[3.5,7],c:[0xc8a07a,0xb4a38d,0xe2c89a,0xd99a7a,0x9fae8a],line:0.09,win:0xfff1b8},
      {z:-40,L:160,hm:[8,17],wd:[6,10],c:[0xa8b8c8,0xb4a38d,0x9fae8a,0xc8a07a,0xb8aac8],line:0.16,win:0xffd447},
      {z:-100,L:340,hm:[14,32],wd:[9,16],c:[0xb9b4d6,0xa9bfd8,0xc4b6cf],line:0.3,win:0xe9e2f6}];
    for(const R of ROWS){const B=[];let x=0,i=0;
      while(x<R.L-R.wd[0]){const w=Math.min(R.L-x,R.wd[0]+tsR(i,R.z)*(R.wd[1]-R.wd[0])),h=R.hm[0]+tsR(i,R.z+1)*(R.hm[1]-R.hm[0]),c=R.c[Math.floor(tsR(i,R.z+2)*R.c.length)],dd=R.wd[0];
        B.push({x:x+w/2,y:0,z:R.z,w:w*0.92,h,d:dd,c});
        // a roof edge and rows of windows facing the street (just thin boxes on the front)
        B.push({x:x+w/2,y:h,z:R.z,w:w*0.96,h:R.line*3,d:dd+0.2,c:0x6b5a6e});
        const ww=Math.max(0.5,w*0.12),wh=ww*1.3,gx=ww*1.9,gy=wh*1.8,nx=Math.max(1,Math.floor((w*0.8)/gx)),ny=Math.max(1,Math.floor((h-1.5)/gy));
        for(let a=0;a<nx;a++)for(let b=0;b<ny;b++)if(tsR(i*31+a*7+b,R.z+9)>0.22)B.push({x:x+w/2+(a-(nx-1)/2)*gx,y:1+b*gy,z:R.z+dd/2+0.02,w:ww,h:wh,d:0.06,c:R.win});
        x+=w+0.6+tsR(i,R.z+3)*1.4;i++;}
      TSC.rows.push(tsRow(S,R.L,B,R.line,1));}
    // a few clouds, high up and far off, drifting on their own
    const CL=[];for(let i=0;i<7;i++)CL.push({x:i*74+tsR(i,5)*30,y:32+tsR(i,6)*14,z:-140,w:22+tsR(i,7)*14,h:6,d:4,c:0xffffff},{x:i*74+tsR(i,5)*30+6,y:36+tsR(i,6)*14,z:-140,w:12,h:5,d:4,c:0xffffff});
    TSC.clouds=tsRow(S,520,CL,0.35,0.15);TSC.rows.push(TSC.clouds);
    // dust kicked up by a stomp
    const dg=new THREE.BoxGeometry(0.3,0.3,0.3),dm=new THREE.MeshLambertMaterial({color:0xefe4d0});
    for(let i=0;i<14;i++){const m=new THREE.Mesh(dg,dm);m.visible=false;S.add(m);TSC.dust.push({m,t:9,vx:0,vy:0,vz:0});}
    TSC.ok=true;
  }catch(e){TSC.ok=false;}
  return TSC.ok;
}
// one frame of the title screen (false: nothing drawn, so the city is drawn as usual)
function titleDraw(dt,w,h){
  if(!titleInit())return false;
  const calm=reduceMotion(),G=TSC.gus,cam=TSC.cam;
  dt=Math.min(dt,0.05);TSC.t+=dt;
  // stomping along: a walk on the spot, and every few seconds he rears up and slams down (and the street stops a moment)
  const CYC=3.4,u=calm?0:(TSC.t%CYC)/CYC,rear=u>0.72&&u<0.86?Math.sin((u-0.72)/0.14*Math.PI/2):u>=0.86&&u<0.9?1-(u-0.86)/0.04:0;
  if(u>=0.9&&TSC.stomp<0.9&&!calm){TSC.shake=0.35;for(const D of TSC.dust){D.t=0;const a=Math.random()*Math.PI*2;D.vx=Math.cos(a)*(2+Math.random()*3);D.vz=Math.sin(a)*1.5;D.vy=2+Math.random()*3;D.m.position.set(1.2+Math.random()*0.6,0.2,(Math.random()-0.5)*1.4);}}
  TSC.stomp=u;
  const v=calm?0:rear>0?0.4:2.4;TSC.scroll+=v*dt;
  const ph=TSC.scroll*2.1;
  G.legs.forEach((l,i)=>{l.rotation.x=calm?0:Math.sin(ph+(i===0||i===3?0:Math.PI))*0.55*(1-rear);});
  G.rig.rotation.x=-0.34*rear;G.rig.position.y=0.4*rear;
  G.root.position.y=calm?0:Math.abs(Math.sin(ph))*0.07*(1-rear);
  G.head.rotation.x=calm?0:Math.sin(ph*2)*0.04-0.15*rear;
  if(G.jaw)G.jaw.rotation.x=rear>0.3?0.4*rear:0;
  {const sq=u>=0.9&&u<0.97?1-Math.abs(u-0.93)/0.035:0;G.root.scale.set(1+0.12*Math.max(0,sq),1-0.14*Math.max(0,sq),1);}
  for(const D of TSC.dust){if(D.t>1.1){D.m.visible=false;continue;}D.t+=dt;D.vy-=9*dt;D.m.position.x+=D.vx*dt;D.m.position.y=Math.max(0.1,D.m.position.y+D.vy*dt);D.m.position.z+=D.vz*dt;D.m.visible=true;const k=Math.max(0.01,1-D.t/1.1);D.m.scale.setScalar(k);}
  // the camera: low down at the side, tipped up a touch, so his feet are about two thirds of the way down the screen with
  // the skyline above; and Gus about a quarter of the way in from the left (the menu card is on the right)
  const asp=w/Math.max(1,h),dist=26,hw=dist*Math.tan(14*Math.PI/180)*asp;
  cam.aspect=asp;cam.updateProjectionMatrix();
  const cx=asp>1.1?hw*0.42:0;TSC.shake*=Math.exp(-dt*9);const sx=(Math.random()-0.5)*TSC.shake,sy=(Math.random()-0.5)*TSC.shake;
  cam.position.set(cx+sx,1.17+sy,dist);cam.lookAt(cx+sx,2.46+sy,0);
  // each row scrolls at the street's speed (the far ones look slower, being further off), wrapping round
  for(const R of TSC.rows){const s=R===TSC.clouds?TSC.t*1.5:TSC.scroll*R.speed;R.grp.position.x=cx-R.L*0.5-((s%R.L)+R.L)%R.L;}
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
  const L0=WORLD_LIGHT.value.clone(),cu=CURVE_U.value;WORLD_LIGHT.value.setRGB(1,1,1);CURVE_U.value=0;
  try{renderer.render(TSC.scene,cam);}finally{WORLD_LIGHT.value.copy(L0);CURVE_U.value=cu;}
  return true;
}
