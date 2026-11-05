// ---- boats out at sea, and the subway's trains ----
// a boat, built along +z, its waterline at y=0: the hull comes from a run of boxes narrowing to the bow, and what's on deck
// depends on what it is. Each hull section and each deckhouse also goes down in g.userData.bx, as what you stand on and hit
function makeBoat(k,len,seed){
  const K=BOATS[k],L=len||K.L,W=K.W,d=K.d,fb=K.fb,g=new THREE.Group(),S=seed||0,boxes=[],rnd=i=>hash2(S*7+i*13+3,i*5+S*3+1);
  const bx=(m,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(LM_BOX,typeof m==='number'?zmat(m):m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);g.add(o);return o;};
  // something to stand on: its top, half its width and length, where it is along the boat and across it
  const solid=(top,hx,hz,c,x)=>boxes.push({top,hx,hz,c:c||0,x:x||0,y0:-d});
  const house=(m,sx,sy,sz,x,y0,z)=>{bx(m,sx,sy,sz,x,y0+sy/2,z);solid(y0+sy,sx/2,sz/2,z,x);};
  const hull=(side,below,deck,stripe,bow,rise)=>{
    const secs=[[.84,-L/2,-L/2+Math.min(1.2,L*.1),0],[1,-L/2+Math.min(1.2,L*.1),L/2-bow,0],[.82,L/2-bow,L/2-bow*.62,rise*.4],[.56,L/2-bow*.62,L/2-bow*.28,rise*.75],[.26,L/2-bow*.28,L/2,rise]];
    for(const [w,z0,z1,up] of secs){const n=z1-z0,zc=(z0+z1)/2,wd=W*w,h=fb+up;
      bx(below,wd*.9,d,n,0,-d/2,zc);bx(side,wd,h,n,0,h/2,zc);bx(deck,Math.max(.12,wd-.3),.06,n,0,h+.02,zc);if(stripe!==null)bx(stripe,wd+.04,Math.min(.3,fb*.2),n,0,fb*.62,zc);
      solid(h,wd/2,n/2,zc);}};
  const win=TRM.win,steel=0x5a6068,white=0xf0f0ea,tint=[0xc8302a,0x2a5ac8,0x2f8a4a,0xe8862a,0x1f8a96,0x7a3a9a][Math.floor(rnd(1)*6)];
  if(k==='row'){
    hull(0x8a5a32,0x5a3a20,0x4a3420,null,1.4,.1);
    bx(0xd8c8a0,W-.4,.08,.4,0,fb+.14,.2);bx(0xd8c8a0,W-.4,.08,.34,0,fb+.14,-1.1);bx(0xa87a48,.1,.08,2.6,W/2+.1,fb+.24,-.2);bx(0xa87a48,.1,.08,2.6,-W/2-.1,fb+.24,-.2);
  }else if(k==='pedalo'){
    hull(tint,0xf0f0ea,white,null,.8,.06);bx(white,.3,1.1,.3,0,fb+.6,1);bx(tint,.34,.3,.5,0,fb+1.2,1.14);bx(0xe8c83a,.1,.1,.2,0,fb+1.14,1.44);bx(P_DARK,W-.4,.3,.5,0,fb+.2,-.5);
  }else if(k==='speed'){
    hull(white,tint,0xb8895a,tint,2.4,.25);house(white,1.5,.3,1.8,0,fb,-.2);bx(win,1.6,.5,.08,0,fb+.5,.9);bx(0x2b2f36,.5,1,.5,0,fb*.5+.2,-L/2-.2);bx(tint,1.2,.35,.5,0,fb+.45,-.8);
  }else if(k==='launch'){
    hull(white,0x2a3a5a,0xb8895a,tint,2.8,.3);house(white,2.1,1.2,3.6,0,fb,0);bx(win,2.14,.5,3.1,0,fb+.78,0);bx(win,1.7,.5,.06,0,fb+.78,1.82);bx(tint,2.2,.12,3.7,0,fb+1.26,0);bx(steel,.06,1.4,.06,0,fb+2,-1);
    bx(steel,W-.1,.05,.05,0,fb+.5,-L/2+.2);bx(0xd8c8a0,1.6,.2,1,0,fb+.2,-3.4);
  }else if(k==='sail'){
    hull(white,0x24304a,0xb8895a,tint,3.2,.3);house(white,1.7,.7,3.2,0,fb,-.4);bx(win,1.74,.25,2.6,0,fb+.42,-.4);
    bx(0x2b2f36,.16,12,.16,0,fb+6,1);bx(0x2b2f36,.1,.1,4.4,0,fb+1.4,-1.1);
    // the mainsail and the jib, in steps, narrowing to the top
    for(let i=0;i<6;i++){const q=1-i/6,n=4.2*q+.2;bx(i%3===2?tint:white,.06,1.7,n,0,fb+2.4+i*1.7,1-n/2-.08);}
    for(let i=0;i<5;i++){const q=1-i/5,n=3*q+.2;bx(white,.06,1.7,n,0,fb+1.5+i*1.7,1.14+n/2);}
  }else if(k==='fish'){
    hull(tint,0x7a2a22,0x8a7a5a,white,3.4,.5);
    house(white,2.8,2,2.8,0,fb,1.4);bx(win,2.84,.6,2.4,0,fb+1.5,1.4);bx(win,2.2,.6,.06,0,fb+1.5,2.84);bx(tint,3,.14,3,0,fb+2.04,1.4);
    bx(steel,.2,5,.2,0,fb+4.5,-.5);bx(steel,.12,.12,4,0,fb+3.2,-2.3);bx(0x8a9aa0,.03,2.6,.03,0,fb+1.9,-4.2);
    // the gantry over the stern and the drum of net under it, floats and fish boxes
    for(const s of [-1,1])bx(steel,.16,3,.16,s*(W/2-.5),fb+1.5,-L/2+1.2);bx(steel,W-1,.16,.16,0,fb+3,-L/2+1.2);
    bx(0x5a7a6a,2,.9,.9,0,fb+.5,-L/2+2.8);bx(0xe8862a,.4,.3,.4,1,fb+.2,-2);bx(0xe8c83a,.34,.28,.34,1.2,fb+.2,-1.5);bx(0x7a5a36,.8,.4,.6,-1,fb+.22,-1.8);
  }else if(k==='tug'){
    hull(0x22262c,0xa83228,0x6a6a60,0xc8302a,3.6,.5);
    house(white,3.2,1.8,5,0,fb,.2);house(white,2.4,1.6,2.4,0,fb+1.8,1.2);bx(win,2.44,.6,2,0,fb+2.9,1.2);bx(win,1.9,.6,.06,0,fb+2.9,2.42);bx(0x22262c,2.6,.14,2.6,0,fb+3.46,1.2);
    bx(0xd8a020,.9,2.2,.9,0,fb+2.9,-1.2);bx(0x22262c,.94,.5,.94,0,fb+3.8,-1.2);bx(steel,.12,1.8,.12,0,fb+4.2,1.2);
    // the towing bitts, and old tyres all round for fenders
    bx(0x22262c,.6,.8,.5,0,fb+.4,-L/2+2);for(const s of [-1,1])for(let i=0;i<4;i++)bx(0x16181c,.14,.7,.7,s*(W/2+.07),fb*.5,-L/2+2.2+i*2.6);
  }else if(k==='ferry'){
    hull(white,0x1f3558,0x8a8a80,0x2a5ac8,5,.5);const n=L-9;
    house(white,W-1,2.2,n,0,fb,-1);bx(win,W-.96,.9,n-1,0,fb+1.3,-1);
    house(white,W-2,2,n*.62,0,fb+2.2,0);bx(win,W-1.96,.8,n*.62-.8,0,fb+3.3,0);
    house(white,W-3,1.4,3,0,fb+4.2,n*.2);bx(win,W-2.96,.7,3.06,0,fb+5.1,n*.2);
    bx(0x2a5ac8,1.4,2.4,1.8,0,fb+5.4,-n*.2);bx(white,1.44,.5,1.84,0,fb+6,-n*.2);
    for(const s of [-1,1])for(const z of [-.3,.1])bx(0xe8862a,.8,.6,2.2,s*(W/2-.9),fb+2.6,z*n);
  }else if(k==='navy'){
    const grey=0x737d87,dk=0x59626b;
    hull(grey,0x6a2a26,dk,null,8,1);bx(white,.06,1,1.6,W/2+.01,fb*.7,L/2-9);bx(white,.06,1,1.6,-W/2-.01,fb*.7,L/2-9);
    // the forward gun, the superstructure in steps, the mast and its radar, a funnel, missile tubes, and the helipad on the stern
    const gz=L/2-10.5;bx(grey,2.2,.9,2.4,0,fb+.45,gz);bx(dk,.26,.26,3,0,fb+.7,gz+2.6);solid(fb+.9,1.1,1.2,gz);
    const z0=-L*.08;house(grey,W-2,2.6,L*.32,0,fb,z0);house(grey,W-3,2,L*.16,0,fb+2.6,z0+L*.05);bx(win,W-2.96,.7,.06,0,fb+4,z0+L*.13);bx(win,W-2.96,.7,L*.14,0,fb+4,z0+L*.05);
    bx(dk,.4,4.6,.4,0,fb+6.9,z0+L*.03);bx(dk,2.6,.2,.2,0,fb+7.6,z0+L*.03);
    const rad=bx(0xd8dce2,2.2,.5,.26,0,fb+9.4,z0+L*.03);g.userData.radar=rad;
    bx(dk,1.8,2.6,2.2,0,fb+3.6,z0-L*.1);bx(0x22262c,1.84,.4,2.24,0,fb+4.7,z0-L*.1);
    bx(dk,2.4,1,2.2,0,fb+.5,-L*.27);solid(fb+1,1.2,1.1,-L*.27);
    bx(dk,W-1.4,.04,5,0,fb+.1,-L/2+3.6);bx(white,3,.05,.3,0,fb+.12,-L/2+3.6);bx(white,.3,.05,2,1.4,fb+.12,-L/2+3.6);bx(white,.3,.05,2,-1.4,fb+.12,-L/2+3.6);
  }else{
    // a container ship: the bridge and funnel at the stern, the stacks all down the deck (as high as they'd safely go), a raised bow
    const big=W>=11;hull(0x1f3558,0xa83228,0x7a4a2a,null,L*.16,1.6);
    const bz=-L/2+L*.1,bl=L*.11;house(white,W-1.5,7,bl,0,fb,bz);for(let y=2;y<7;y+=2)bx(win,W-1.46,.7,bl+.04,0,fb+y,bz);bx(white,W+1,.5,2.4,0,fb+7.2,bz+bl*.3);bx(win,W+1.04,.3,1.2,0,fb+7.1,bz+bl*.3);
    bx(tint,2,3.4,2.4,0,fb+8.2,bz-bl*.25);bx(0x22262c,2.04,.5,2.44,0,fb+9.6,bz-bl*.25);bx(steel,.2,3,.2,0,fb+8.6,bz+bl*.2);
    const CC=[0xc8302a,0x2a5ac8,0x3a9a3a,0xe8862a,0xe8c83a,0xe8e8e8,0x8a4a2a,0x1f8a96],rows=big?[-3.4,0,3.4]:[-2.4,1,4.4].map(v=>v-1),z0=bz+bl/2+1.2,z1=L/2-L*.16-.6,bays=Math.max(2,Math.floor((z1-z0)/6.3));
    for(let bay=0;bay<bays;bay++){const zc=z0+3+bay*6.3;let hi=0;
      rows.forEach((r2,ri)=>{const n=1+Math.floor(rnd(bay*7+ri+2)*(big?4:3));hi=Math.max(hi,n);for(let l=0;l<n;l++)bx(CC[Math.floor(rnd(bay*11+ri*5+l*3+4)*CC.length)],3.1,2.3,6,r2,fb+1.2+l*2.4,zc);});
      solid(fb+.05+hi*2.4,rows[2]+1.6,3,zc);}
  }
  g.userData.bx=boxes;bakeBoat(g);return g;
}
// (all a boat's boxes as one mesh, or a port full of container ships would be hundreds of draw calls. The radar still turns)
const BOAT_M=new THREE.MeshLambertMaterial({vertexColors:true});
function bakeBoat(g){
  const P=[],N=[],C=[],I=[],keep=g.userData.radar,kids=g.children.slice();
  for(const o of kids){if(o===keep)continue;const s=o.scale,q=o.position,c=o.material.color||{r:1,g:1,b:1};
    for(const [a,b,d] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
      const u=a?[0,a,0]:b?[0,0,b]:[d,0,0],v=a?[0,0,1]:b?[1,0,0]:[0,1,0],i0=P.length/3;
      for(const [m,n] of [[-1,-1],[1,-1],[1,1],[-1,1]]){P.push(q.x+s.x/2*(a+m*u[0]+n*v[0]),q.y+s.y/2*(b+m*u[1]+n*v[1]),q.z+s.z/2*(d+m*u[2]+n*v[2]));N.push(a,b,d);C.push(c.r,c.g,c.b);}
      I.push(i0,i0+1,i0+2,i0,i0+2,i0+3);}}
  const G2=new THREE.BufferGeometry();G2.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G2.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G2.setAttribute('color',new THREE.Float32BufferAttribute(C,3));G2.setIndex(I);
  g.children.length=0;g.add(new THREE.Mesh(G2,BOAT_M));if(keep)g.add(keep);
}
// a boat's body, this frame, for standing on and hitting: one box per piece of it. Only near someone (nothing else can reach it)
function boatBoxes(bo,v){
  const g=bo.g,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),y=g.position.y,o=g.position;
  if(!bo.bx){bo.bx=g.userData.bx;bo.bx.forEach((s,i)=>{s.pr={isTrain:true,isBoat:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:s.hx,hz:s.hz,hy:s.top,heading:0,top:0,veh:'boat',T:bo,i};});}
  for(const s of bo.bx){const pr=s.pr;pr.pos.set(o.x,y,o.z);pr.heading=h;pr.top=y+s.top;pr.alive=true;
    TRAIN_BOXES.push({x:o.x+tx*s.c+tz*s.x,z:o.z+tz*s.c-tx*s.x,tx,tz,y0:y+s.y0,top:pr.top,v,hx:s.hx,hz:s.hz,proxy:pr});}
}
// what a boat under way runs down, in the water: thrown aside, hurt
function boatStrike(bo,v){
  const g=bo.g,K=bo.K,x0=g.position.x,z0=g.position.z,h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h),k=Math.max(.2,Math.min(1,v/16)),HL=bo.L/2,HW=K.W/2;
  for(const g2 of goblins){if(g2.hp<=0||g2.trainT>0||g2.state==='wait'||g2.state==='dead'||!g2.root.visible||g2.pos.y>G+K.fb||g2.pos.y<G-K.d-2)continue;
    const dx=g2.pos.x-x0,dz=g2.pos.z-z0,al=dx*tx+dz*tz,ac=-dx*tz+dz*tx;if(Math.abs(al)>HL+.5||Math.abs(ac)>HW+.5)continue;
    const sg=ac>=0?1:-1,D=new V3(tx*.7-tz*sg*.7,0,tz*.7+tx*sg*.7);g2.trainT=1;damageGoblin(g2,Math.round(2+10*k),g2.pos.clone(),D,'Hit by a boat',ACCIDENT);g2.vy=Math.max(g2.vy||0,6+10*k);g2.kv.x+=D.x*(8+16*k);g2.kv.z+=D.z*(8+16*k);}
}
const BOAT_GONE=new Map();
// hitting a boat: it shudders and starts to burn and list; holed for good, it goes up (or, with no engine to speak of, just
// breaks up) and goes down. Up in a dry dock or on the sand it stays where it is, burnt out
function boatHit(bo,n){
  if(bo.dead)return;const g=bo.g,p=g.position,K=bo.K;dmgPop(p.x,p.y+K.fb+2,p.z,Math.round(n),'#ffb04a');bo.hp-=n;bo.shake=.25;vHitFx(p.x,p.y+K.fb,p.z,n);if(bo.hp>0)return;
  bo.dead=true;bo.deadT=0;bo.y0=p.y;BOAT_GONE.set(bo.key,playTime);const s=K.boom||0,sz=Math.max(1,Math.min(3,bo.L/10));
  if(s){const bl=blasts[blastIdx++%blasts.length];bl.t=.5+s*.15;bl.s=1+s*.6;for(const f of bl.m){f.position.set(p.x,p.y+K.fb+1,p.z);f.visible=true;}smoke(p.x,p.y+K.fb+1,p.z,Math.round(10+s*8),0x262626);
    noise(.6+s*.3,1,600,'lowpass');tone('sawtooth',70,16,.6+s*.3,.3);addShake(.3+s*.3,p.x,p.z,20+s*15);hitGoblins(p.x,p.z,3+s*4,4+s*3,'Blown up with a boat',p.y+1);}
  else{puff(p.x,p.y+.6,p.z,14,0x8a5a32,1.2);noise(.3,.5,1400,'bandpass');}
  for(let k=0,N=Math.round(3+sz*3);k<N;k++){const D=debris[(debrisIdx++)%debris.length];D.m.position.set(p.x+(Math.random()-.5)*K.W,p.y+1+Math.random()*2,p.z+(Math.random()-.5)*bo.L*.6);D.v.set((Math.random()-.5)*16,6+Math.random()*10,(Math.random()-.5)*16);D.spin.set((Math.random()-.5)*12,(Math.random()-.5)*12,(Math.random()-.5)*12);D.life=25;D.m.visible=true;}
  if(s)g.traverse(o=>{if(o.isMesh){o.userData.mat=o.userData.mat||o.material;o.material=TRM.dark;}});
  score+=K.sc;flashLabel(K.name+' sunk  +'+K.sc,(nearestPlayer(p.x,p.z)||{}).p);
}
function boatWreck(V,dt){
  const bo=V.bo,g=V.boat,p=g.position,K=bo.K;bo.deadT+=dt;
  if(V.dry||V.ground){if(!K.boom)g.visible=false;else if(bo.deadT<60&&Math.random()<dt*3)smoke(p.x,p.y+K.fb+1,p.z,2,0x262626);}
  else if(g.visible){const T=Math.min(30,4+bo.L*.7),k=Math.min(1,bo.deadT/T);
    // (down by the bow first... a big one rolling over as it goes, burning till the water reaches it)
    p.y=bo.y0-(K.d+K.fb+6+bo.L*.25)*k*k;g.rotation.x=bo.tilt=(bo.L>10?.3:.15)*Math.min(1,k*1.5);g.rotation.z=bo.roll=(V.ph>3?1:-1)*(bo.L>10?.25:.5)*Math.min(1,k*2);
    if(k<.7&&K.boom&&Math.random()<dt*6)smoke(p.x+(Math.random()-.5)*K.W,G+2,p.z+(Math.random()-.5)*bo.L*.5,2,0x262626);
    if(Math.random()<dt*(6+bo.L*.4))puff(p.x+(Math.random()-.5)*K.W,G+1,p.z+(Math.random()-.5)*bo.L*.7,2,0xcfe8ff,.8);
    if(k>=1)g.visible=false;}
  // (a new one's been brought in, once no one's looking)
  if(bo.deadT>120&&!players.some(q=>q.active&&Math.hypot(p.x-q.pos.x,p.z-q.pos.z)<350)){bo.dead=false;bo.hp=bo.max;g.visible=true;g.traverse(o=>{if(o.isMesh&&o.userData.mat)o.material=o.userData.mat;});if(bo.y0!==undefined)p.y=bo.y0;g.rotation.set(0,g.rotation.y,0);BOAT_GONE.delete(bo.key);}
}
// where a boat is, s along its route: a racetrack, two straights and a turn at each end (so nothing swings round on the spot,
// and a big ship has room): the position along the route's axis and across it, and the way it's heading
function lanePt(l,s){
  const L=l.len,R=l.R,P=4*L+2*Math.PI*R;s=mod(s,P);let a,c,h;
  if(s<2*L){a=-L+s;c=R;h=0;}
  else if(s<2*L+Math.PI*R){const t=(s-2*L)/R;a=L+R*Math.sin(t);c=R*Math.cos(t);h=t;}
  else if(s<4*L+Math.PI*R){a=L-(s-2*L-Math.PI*R);c=-R;h=Math.PI;}
  else{const t=(s-4*L-Math.PI*R)/R;a=-L-R*Math.sin(t);c=-R*Math.cos(t);h=Math.PI+t;}
  const da=Math.cos(h),dc=-Math.sin(h);
  return l.ax==='x'?{x:l.cx+a,z:l.cz+c,yaw:Math.atan2(da,dc)}:{x:l.cx+c,z:l.cz+a,yaw:Math.atan2(dc,da)};
}
// the longest route for this boat from here that's open water all the way, deep enough for it; or none
const LANE_C=new Map(),LANE_R={cargo:56,navy:34,ferry:30,tug:16,fish:12,sail:12,launch:13,speed:12},LANE_L={cargo:220,navy:180,ferry:160,tug:60,fish:50,sail:40,launch:70,speed:40};
function boatLane(px,pz,k){
  const K0=px*100003+pz;if(LANE_C.has(K0))return LANE_C.get(K0);let out=null;
  const K=BOATS[k],h=hash2(px*3+1,pz*5+2),l={ax:h<.5?'x':'z',cx:px*CELL+16,cz:pz*CELL+16,R:LANE_R[k],len:0};
  for(let n=LANE_L[k];n>=0&&!out;n-=20){l.len=n;let ok=true;const P=4*n+2*Math.PI*l.R;
    for(let s=0;s<P&&ok;s+=4){const q=lanePt(l,s);if(plotType(Math.floor(q.x/CELL),Math.floor(q.z/CELL))!=='sea'||oceanDepth(q.x,q.z)<K.d+2)ok=false;}
    if(ok)out=Object.assign({},l);}
  if(LANE_C.size>5000)LANE_C.clear();LANE_C.set(K0,out);return out;
}
function boatVenue(key,k,o,want){
  want.add(key);if(venues.has(key))return;
  {const t0=BOAT_GONE.get(key);if(t0!==undefined){if(playTime-t0<120)return;BOAT_GONE.delete(key);}}
  const seed=Math.abs(key.split('').reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7))%9973,g=makeBoat(k,o.L,seed);scene.add(g);const K=BOATS[k],L=o.L||K.L,max=K.hp*Math.max(.6,L/K.L);
  const V=Object.assign({kind:'boat',boat:g,ph:hash2(seed,3)*6.28,y0:G+.85},o);
  V.bo={isBoat:true,key,k,K,g,L,hp:max,max,dead:false,deadT:0};
  if(V.lane){V.s=hash2(seed,7)*(4*V.lane.len+2*Math.PI*V.lane.R);V.dir=hash2(seed,9)<.5?1:-1;}
  else{g.position.set(V.x,V.y0,V.z);g.rotation.y=V.yaw;}
  venues.set(key,V);
}
function updateBoat(V,dt,t){
  const bo=V.bo,g=V.boat,K=bo.K;
  if(bo.dead){boatWreck(V,dt);return;}
  if(g.userData.radar)g.userData.radar.rotation.y=t*1.4;
  // (pulled up on the sand: it lies wherever the ground turns out to be, once that's been built)
  if(V.ground&&!V.landed){if(chunks.has(ckey(Math.floor(V.x/CS),Math.floor(V.z/CS)))){V.landed=true;V.y0=groundAt(V.x,V.z,G+8)+K.d;}else return;}
  let v=0;
  if(bo.drv)v=drvBoat(V,dt);
  else if(V.lane){
    const sp=K.sp*(bo.hp<bo.max*.5?.5:1);V.s+=sp*V.dir*dt;v=sp;const q=lanePt(V.lane,V.s);g.position.x=q.x;g.position.z=q.z;g.rotation.y=V.dir>0?q.yaw:q.yaw+Math.PI;}
  // afloat: it rides the swell, the smaller the more; hurt, it's on fire and has a list
  const sw=V.dry||V.ground?0:Math.min(1,6/bo.L),hurt=bo.hp<bo.max*.5,shake=bo.shake>0?(bo.shake-=dt,Math.sin(t*50)*bo.shake*.1):0;
  g.position.y=V.y0+Math.sin(t*1.3+V.ph)*.09*(sw+.2)*(sw?1:0)-(hurt&&!V.dry&&!V.ground?K.fb*.15:0);
  g.rotation.set(Math.sin(t*1.1+V.ph*2)*.012*sw*3+(v?.01:0),g.rotation.y,Math.sin(t*.9+V.ph)*.03*sw+shake+(hurt?(V.ph>3?.07:-.07):0),'YXZ');
  const me=players.find(q=>q.active&&Math.hypot(q.pos.x-g.position.x,q.pos.z-g.position.z)<bo.L+80);
  if(hurt&&K.boom&&me&&Math.random()<dt*5)smoke(g.position.x+(Math.random()-.5)*K.W*.5,g.position.y+K.fb+1,g.position.z+(Math.random()-.5)*bo.L*.3,1,0x2a2a2a);
  if(!me)return;
  boatBoxes(bo,v);
  if(v>=2){boatStrike(bo,v);if(Math.random()<dt*8){const h=g.rotation.y;puff(g.position.x-Math.sin(h)*bo.L*.5,G+1,g.position.z-Math.cos(h)*bo.L*.5,1,0xeaf6ff,.6);}}
}
// swimming beside a boat, jump is enough to get you aboard (it's the only way up the side of a big one, short of a rocket)
function boatBeside(p){
  let best=null;for(const B of TRAIN_BOXES){if(!B.proxy.isBoat||B.top<p.pos.y||B.top-p.pos.y>14)continue;const dx=p.pos.x-B.x,dz=p.pos.z-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx;
    if(Math.abs(al)<=B.hz+2.6&&Math.abs(ac)<=B.hx+2.6&&(!best||B.top<best.top))best=B;}
  return best;
}
// what's tied up on a plot of the coast, worked out once: the boats in a harbour's berths, ships at the quays of a port or a naval
// base, a warship in a dry dock, a boat or two off a beach and a rowboat on the sand, a supply boat at an oil rig
function mooredBoats(P,px,pz){
  if(P._mb)return P._mb;const L=P._mb=[],X0=px*CELL,Z0=pz*CELL,t=P.type,r=i=>hash2(px*37+i*11+1,pz*53+i*7+2);
  const put=(k,x,z,yaw,o)=>L.push(Object.assign({k,x,z,yaw},o));
  if(t==='harbor'){const [a,b]=P.land,W=(u,w)=>[X0+(a>0?CELL-1-u:a<0?u:w)+.5,Z0+(b>0?CELL-1-u:b<0?u:w)+.5],out=Math.atan2(a>0?-1:a<0?1:0,b>0?-1:b<0?1:0);
    for(const B of P.boats){const [x,z]=W(B.a0+B.L/2,B.wc);put(B.k,x,z,out+(r(B.wc)<.3?Math.PI:0));}
    if(P.fish&&P.pw>=0){
      // (rowboats moored either side of the pier, one pulled up on the wharf)
      for(const [u,w] of [[P.Q+5,P.pw-2],[P.Q+9,P.pw+3],[P.Q+14,P.pw-2]]){if(u>=CELL-3)continue;const [x,z]=W(u,w);if(seaBlk(x,z)>=SEA_T&&coastD(x,z)>3&&hash2(x*7,z*3)<.8)put('row',x,z,out);}
      const [x,z]=W(P.Q-3,22);if(seaBlk(x,z)<SEA_T&&coastD(x,z)<-1)put('row',x,z,out+1.4,{ground:true});}
  }else if(t==='basin'||t==='nbasin'){
    if(P.ship){const [a,b]=P.ship.side,cg=P.ship.k==='cargo',hw=BOATS[P.ship.k].W/2,tt=3+hw,al=(CELL-1)/2,x=X0+(a>0?CELL-1-tt:a<0?tt:al)+.5,z=Z0+(b>0?CELL-1-tt:b<0?tt:al)+.5,yaw=(a?0:Math.PI/2)+(r(1)<.5?Math.PI:0);
      if(!cg||r(5)<.8)put(P.ship.k,x,z,yaw,{L:28});
      // (a tug standing by further out)
      if(cg&&r(2)<.45){const t2=tt+hw+5;put('tug',X0+(a>0?CELL-1-t2:a<0?t2:al+6)+.5,Z0+(b>0?CELL-1-t2:b<0?t2:al+6)+.5,yaw);}}
  }else if(t==='navy'){
    if(P.dock){const [a,b]=P.dock,tt=13.5,w=PC,x=X0+(a>0?CELL-1-tt:a<0?tt:w)+.5,z=Z0+(b>0?CELL-1-tt:b<0?tt:w)+.5;put('navy',x,z,Math.atan2(a,b),{L:22,dry:true,y0:G-6+BOATS.navy.d});}
  }else if(t==='beach'){
    // (anchored off the beach: wherever there's depth for it, well out from the swimmers)
    let n=0;for(let i=0;i<24&&n<2;i++){const x=X0+3+r(i+1)*26,z=Z0+3+r(i+41)*26,cd=coastD(x,z);if(cd<12||cd>40||seaBlk(x,z)<SEA_T||L.some(B=>Math.hypot(B.x-x,B.z-z)<16))continue;put(r(i+81)<.55?'sail':r(i+90)<.5?'launch':'speed',x,z,r(i+70)*6.28);n++;}
    for(let i=0;i<12;i++){const x=X0+3+r(i+101)*26,z=Z0+3+r(i+141)*26,w=-coastD(x,z);if(w>=2&&w<=5&&r(99)<.6){put('row',x,z,r(i+170)*6.28,{ground:true});break;}}
  }else if(t==='rig'){
    if(r(3)<.7)put('tug',X0+16,Z0+36,Math.PI/2);
  }
  return L;
}
const MOORS=new Set(['harbor','basin','nbasin','navy','beach','rig']);
// the pedal boats on a theme park's lake, going slowly round
function pondBoats(S,want){
  const R2=plotInfo(S.ax,S.az).theme;if(!R2||!R2.pond)return;const Pd=R2.pond;
  for(let i=0;i<4;i++)boatVenue('b'+S.ax+','+S.az+','+i,'pedalo',{lane:{ax:'x',cx:S.ax*CELL+Pd.cu,cz:S.az*CELL+Pd.cv,R:Pd.r*(.4+i*.13),len:0}},want);
}
// out on the open sea: boats on their rounds, now and then a ferry or a big ship
const boatAt=(px,pz)=>{const h=hash2(px*577+3,pz*829+5);return h<0.005?'cargo':h<0.008?'ferry':h<0.009?'navy':h<0.03?'sail':h<0.042?'launch':h<0.052?'fish':h<0.057?'speed':h<0.06?'tug':null;};
function refreshSeaVenues(p,want){
  for(let px=Math.floor((p.pos.x-450)/CELL);px<=Math.floor((p.pos.x+450)/CELL);px++)for(let pz=Math.floor((p.pos.z-450)/CELL);pz<=Math.floor((p.pos.z+450)/CELL);pz++){
    if(!tenvShow(px,pz))continue;const k0=boatAt(px,pz);if(!k0||plotType(px,pz)!=='sea')continue;
    // (a big ship can be seen from further off)
    if(BOATS[k0].L<20&&Math.hypot(px*CELL+16-p.pos.x,pz*CELL+16-p.pos.z)>280)continue;
    const lane=boatLane(px,pz,k0);if(lane)boatVenue('s'+px+','+pz,k0,{lane},want);}
  for(let px=Math.floor((p.pos.x-180)/CELL);px<=Math.floor((p.pos.x+180)/CELL);px++)for(let pz=Math.floor((p.pos.z-180)/CELL);pz<=Math.floor((p.pos.z+180)/CELL);pz++){
    if(!tenvShow(px,pz)||!seaPlot(px,pz)||!MOORS.has(plotType(px,pz)))continue;
    mooredBoats(plotInfo(px,pz),px,pz).forEach((B,i)=>boatVenue('m'+px+','+pz+','+i,B.k,B,want));}
  // the subway trains: one going round each city's loop
  if(!TENV){const ppx=Math.floor(p.pos.x/CELL),ppz=Math.floor(p.pos.z/CELL),rx=Math.round(ppx/SET_SP),rz=Math.round(ppz/SET_SP);
   for(let a=rx-1;a<=rx+1;a++)for(let b=rz-1;b<=rz+1;b++){const M=metroOf(settlementLat(a,b));if(!M)continue;
     const cx=(M.x0+M.x1)/2*CELL,cz=(M.z0+M.z1)/2*CELL;if(Math.hypot(cx-p.pos.x,cz-p.pos.z)>500)continue;
     const key='u'+a+','+b;want.add(key);if(venues.has(key))continue;
     const cars2=[];for(let i=0;i<3;i++){const g=makeTrainCar(i===0);scene.add(g);cars2.push(g);}
     venues.set(key,{kind:'sub',T:{cars:cars2,dead:false,sub:true},M,s:M.stops.length?M.stops[Math.floor(Math.random()*M.stops.length)]:0,v:0,wait:Math.random()*8,cars:cars2});}}
}
function updateSeaVenue(V,dt,t){
  if(V.kind==='boat'){updateBoat(V,dt,t);return;}
  // a subway train: round and round its loop, waiting a while at each station
  const M=V.M,N=M.path.length;let next=1e9;for(const st of M.stops){let d=mod(st+16-V.s,N);if(d<0.3)d+=N;if(d<next)next=d;}
  if(V.T.halted)V.v=0;
  else if(V.wait>0){V.wait-=dt;if(V.wait<=0)V.s+=0.5;}
  else{const want=next<40?Math.max(1.2,next*0.4):16;V.v+=(want-V.v)*Math.min(1,dt*(want<V.v?1.6:0.4));V.s=mod(V.s+V.v*dt,N);if(next<=0.4){V.v=0;V.wait=10;}}
  V.cars.forEach((g,i)=>{if(V.T.carDead&&V.T.carDead[i])return;const s2=mod(V.s-5.3-i*10.6,N),k=Math.floor(s2),a=M.path[k],b=M.path[(k+1)%N],f=s2-k;
    g.position.set(a[0]+(b[0]-a[0])*f,SUB_F+1.2,a[1]+(b[1]-a[1])*f);g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);g.visible=!GFX_OFF.subway;});
  trainBoxes(V.cars,V.v,SUB_F+1.2,V.T);
}
function refreshVenues(){
  const want=new Set();
  for(const p of viewers()){
    refreshSeaVenues(p,want);if(!TENV)refreshRailVenues(p,want);refreshCultVenues(p,want);refreshSiteVenues(p,want);
    for(let px=Math.floor((p.pos.x-170)/CELL);px<=Math.floor((p.pos.x+170)/CELL);px++)for(let pz=Math.floor((p.pos.z-170)/CELL);pz<=Math.floor((p.pos.z+170)/CELL);pz++){
      if(!tenvShow(px,pz))continue;const S=superOf(px,pz);
      if(S&&S.kind==='theme'&&LM_TYPES.has(plotType(S.ax,S.az))){const k='t'+S.ax+','+S.az;want.add(k);if(!venues.has(k))venues.set(k,{S,kind:'theme',k,ride:null});pondBoats(S,want);}
      if(!S||S.ax!==px||S.az!==pz)continue;
      if(S.kind==='stadium'||S.kind==='arena'){const k='v'+px+','+pz;want.add(k);if(!venues.has(k)){const V={S,kind:S.kind,seats:null,cheer:0,cheerT:8,ball:null};
        if(S.kind==='stadium'){const W=(S.w-1)*CELL+PL1-PL0,L=(S.h-1)*CELL+PL1-PL0,F=stadiumField(W,L);V.pitch={x0:px*CELL+PL0+F.fx0,z0:pz*CELL+PL0+F.fz0,w:F.fw,h:F.fh,y:G+1,long:F.long};}
        else{const b=plotInfo(px,pz).b[0],c=(b.x1-b.x0-1)/2;V.pitch={x0:px*CELL+b.x0+c+0.5-13,z0:pz*CELL+b.z0+c+0.5-8,w:26,h:16,y:G+2,long:false};}
        venues.set(k,V);}}
      if(S.kind==='zoo'){const k='z'+px+','+pz;want.add(k);if(!venues.has(k))venues.set(k,{S,kind:'zoo',animals:null});}}
    // trains on the railways near you; the airports' planes and the launch sites' rockets
    if(!TENV){const l=routesNearBox(p.pos.x-420,p.pos.z-420,p.pos.x+420,p.pos.z+420),rs=new Set();for(let q=0;q<l.length;q+=2){const R=l[q];if(rs.has(R)||!railOf(R))continue;rs.add(R);
      const k='r'+Math.round(R.pts[0][0])+','+Math.round(R.pts[0][1]);want.add(k);if(venues.has(k))continue;
      const cars2=[];for(let i=0;i<4;i++){const g=makeTrainCar(i===0);scene.add(g);cars2.push(g);}
      venues.set(k,{kind:'train',R,s:45+Math.random()*(R.L-90),dir:Math.random()<0.5?1:-1,v:0,wait:0,cars:cars2});}}
    for(let px=Math.floor((p.pos.x-700)/CELL);px<=Math.floor((p.pos.x+700)/CELL);px+=1)for(let pz=Math.floor((p.pos.z-700)/CELL);pz<=Math.floor((p.pos.z+700)/CELL);pz+=1){
      if(biomeOf(px,pz)!=='plains'||!tenvShow(px,pz))continue;const B=bigPlainsAt(px,pz);if(!B||B.ax!==px||B.az!==pz||B.kind!=='airport'&&B.kind!=='nasa')continue;const k='b'+px+','+pz;want.add(k);if(venues.has(k))continue;
      if(B.kind==='airport'){const planes=[];for(let i=0;i<3;i++){const g=makePlane(i);scene.add(g);planes.push(g);}venues.set(k,{kind:'airport',B,planes,st:0,t:0,path:null});}
      else{const g=makeRocket();scene.add(g);venues.set(k,{kind:'nasa',B,rocket:g,st:'pad',t:0,y:0,v:0,lastHr:-1});}}
    if(!TENV){const l=routesNearBox(p.pos.x-180,p.pos.z-180,p.pos.x+180,p.pos.z+180),rs=new Set();for(let q=0;q<l.length;q+=2){const R=l[q];if(rs.has(R))continue;rs.add(R);
      for(const ts of tollsOf(R)){const k='t'+Math.round(R.pts[0][0])+','+Math.round(R.pts[0][1])+':'+ts;want.add(k);if(venues.has(k))continue;
        const P=rtPoint(R,ts),ox=-P.tz,oz=P.tx,arms=[];
        for(const L of [1.5,4.5,-1.5,-4.5]){const sg=Math.sign(L),piv=sg*(Math.abs(L)+1.5),ds=sg*2.2,g=new THREE.Group(),lift=new THREE.Group();
          g.position.set(P.x+ox*piv+P.tx*ds,G+2.1,P.z+oz*piv+P.tz*ds);g.rotation.y=Math.atan2(-ox*sg,-oz*sg)-Math.PI/2;g.add(lift);
          for(let i=0;i<4;i++){const m=new THREE.Mesh(LM_BOX,i%2?LMM.ledOff:TOLLM);m.scale.set(0.65,0.13,0.13);m.position.x=0.33+i*0.65;lift.add(m);}
          scene.add(g);arms.push({g,lift,L,a:0,x:g.position.x,z:g.position.z});}
        venues.set(k,{kind:'toll',R,ts,arms});}}}}
  if(TENV)for(const k of ['tenvArmy','tenvPlanes'])if(venues.has(k))want.add(k);
  for(const [k,V] of venues)if(!want.has(k)&&!drvHeld(V)){if(V.ride)scene.remove(V.ride);if(V.animals)for(const A of V.animals)scene.remove(A.g);if(V.arms)for(const A of V.arms)scene.remove(A.g);if(V.cars)for(const g of V.cars)scene.remove(g);if(V.planes)for(const g of V.planes)scene.remove(g);if(V.rocket){scene.remove(V.rocket);}if(V.boat)scene.remove(V.boat);if(V.figs)for(const F of V.figs)scene.remove(F.g);if(V.glow)scene.remove(V.glow);if(V.slots)homeDrop(V);if(V.mil)for(const M of V.mil)scene.remove(M.g);if(V.rotor)scene.remove(V.rotor);if(V.T&&V.T.cars===V.cars)V.T.cars=null;venues.delete(k);}
}
// the zoo's animals: built from boxes, each wandering its enclosure
const ZM={};const zmat=c=>ZM[c]||(ZM[c]=new THREE.MeshLambertMaterial({color:c}));
function makeAnimal(sp){
  const g=new THREE.Group(),bx=(w,h,d,c,x,y,z,par=g)=>{const m=new THREE.Mesh(LM_BOX,zmat(c));m.scale.set(w,h,d);m.position.set(x,y,z);par.add(m);return m;},legs=[];
  const leg=(x,z,h,w,c)=>{const p=new THREE.Group();p.position.set(x,h,z);g.add(p);bx(w,h,w,c,0,-h/2,0,p);legs.push(p);};
  if(sp==='giraffe'){bx(1.0,1.0,2.0,0xe0b040,0,2.6,0);for(const [x,z] of [[-.35,.7],[.35,.7],[-.35,-.7],[.35,-.7]])leg(x,z,2.1,0.22,0xd0a030);const n=bx(0.35,2.2,0.35,0xe0b040,0,4.0,0.85);n.rotation.x=0.25;bx(0.45,0.4,0.8,0xe0b040,0,5.1,1.3);for(let i=0;i<5;i++)bx(0.3,0.3,0.05,0x7a4a1a,(i%2?.51:-.51),2.5+(i%3)*0.25,-0.8+i*0.4);}
  else if(sp==='elephant'){bx(2.0,1.8,3.0,0x8a8a92,0,2.4,0);for(const [x,z] of [[-.6,1],[.6,1],[-.6,-1],[.6,-1]])leg(x,z,1.5,0.6,0x7a7a82);bx(1.2,1.2,1.0,0x8a8a92,0,2.9,1.9);bx(0.35,1.5,0.35,0x7a7a82,0,1.9,2.45);for(const s2 of[-1,1])bx(0.15,1.0,0.9,0x9a9aa2,s2*0.7,3.0,1.7);}
  else if(sp==='lion'){bx(0.9,0.8,1.8,0xc89a4a,0,1.2,0);for(const [x,z] of [[-.3,.6],[.3,.6],[-.3,-.6],[.3,-.6]])leg(x,z,0.8,0.22,0xb88a3a);bx(1.1,1.0,0.6,0x7a4a1a,0,1.55,1.0);bx(0.6,0.55,0.5,0xc89a4a,0,1.5,1.3);bx(0.12,0.12,0.9,0xb88a3a,0,1.3,-1.2);}
  else if(sp==='zebra'){bx(0.8,0.85,1.8,0xf2f2f2,0,1.5,0);for(let i=0;i<5;i++)bx(0.82,0.87,0.12,0x1a1a1a,0,1.5,-0.7+i*0.35);for(const [x,z] of [[-.25,.65],[.25,.65],[-.25,-.65],[.25,-.65]])leg(x,z,1.1,0.18,0xeeeeee);bx(0.3,0.9,0.4,0xf2f2f2,0,2.2,0.95);bx(0.35,0.35,0.7,0x1a1a1a,0,2.6,1.25);}
  else if(sp==='penguin'){bx(0.5,0.75,0.45,0x1a1a20,0,0.55,0);bx(0.36,0.6,0.08,0xf4f4f0,0,0.5,0.23);bx(0.32,0.28,0.32,0x1a1a20,0,1.05,0);bx(0.12,0.08,0.2,0xf0a020,0,1.0,0.22);legs.push(new THREE.Group());}
  else{bx(0.55,0.7,0.45,0x6a4424,0,1.0,0);bx(0.45,0.42,0.42,0x6a4424,0,1.55,0.05);bx(0.32,0.25,0.06,0xd8b48a,0,1.5,0.27);for(const [x,z] of [[-.18,0],[.18,0]])leg(x,z,0.65,0.16,0x5a3a1a);const t=bx(0.08,0.08,0.8,0x5a3a1a,0,0.9,-0.5);t.rotation.x=-0.6;}
  return{g,legs};
}
// the animals can be hurt: each has a stand-in in TRAIN_BOXES, so every attack that reaches a car or a train reaches them.
// Their boxes are soft (you can't stand on one or bump into it). What's killed stays dead, and is saved with the world.
const ANIMALS={giraffe:{name:'Giraffe',hp:25,pts:75,hx:0.6,hz:1.3,hy:5.6},elephant:{name:'Elephant',hp:45,pts:150,hx:1.1,hz:2.2,hy:3.6},lion:{name:'Lion',hp:20,pts:100,hx:0.6,hz:1.4,hy:2},
  zebra:{name:'Zebra',hp:15,pts:50,hx:0.5,hz:1.2,hy:2.8},penguin:{name:'Penguin',hp:5,pts:25,hx:0.35,hz:0.35,hy:1.2},monkey:{name:'Monkey',hp:8,pts:25,hx:0.4,hz:0.4,hy:1.8}};
function animalBox(A){
  const I=ANIMALS[A.sp];if(!A.pr){A.isAnimal=true;A.hp=I.hp;A.pr={isTrain:true,alive:true,pos:new V3(),kv:new V3(),vy:0,spinP:0,spinR:0,speed:0,hurt:0,hx:I.hx,hz:I.hz,hy:I.hy,heading:0,top:0,veh:'train',T:A,i:0};}
  const y=A.g.position.y,pr=A.pr;pr.pos.set(A.x,y,A.z);pr.heading=A.h;pr.top=y+I.hy;
  TRAIN_BOXES.push({x:A.x,z:A.z,tx:Math.sin(A.h),tz:Math.cos(A.h),y0:y,top:pr.top,v:0,hx:I.hx,hz:I.hz,proxy:pr,soft:true});
}
function animalHit(A,n,dir){
  if(A.dead||!A.pr)return;const I=ANIMALS[A.sp],y=A.g.position.y,by=y+I.hy*0.5;
  dmgPop(A.x,y+I.hy+0.2,A.z,Math.round(n),'#ffe14a');A.hp-=n;A.frit=6;A.wait=0;
  blood(A.x,by,A.z,5+n*2,dir?dir.clone().multiplyScalar(-0.4):null);if(dir)blood(A.x,by,A.z,3+n,dir);
  splat(A.x+(Math.random()-.5)*.6,A.z+(Math.random()-.5)*.6,y+0.5,0.15+Math.random()*0.2);tone('square',480,220,0.08,0.07);
  const h=dir?Math.hypot(dir.x,dir.z):0;if(h>0.05){const kb=Math.min(13,3+n*0.6)*(A.hp<=0?1.6:1);A.kx=(A.kx||0)+dir.x/h*kb;A.kz=(A.kz||0)+dir.z/h*kb;}
  if(A.hp>0)return;
  A.dead=true;A.deadT=0;A.pr.alive=false;A.vy=h>0.05?5:2;A.fy=y;A.fall=Math.random()<.5?1:-1;wrecked[A.wk]=1;save();
  reportNews(A.x,A.z,'killing');
  if(BLAME!=='acc'){reportCrime(A.x,A.z);score+=I.pts;flashLabel(I.name+' killed  +'+I.pts,(nearestPlayer(A.x,A.z)||{}).p);}
  tone('sawtooth',620,110,0.45,0.1);splat(A.x,A.z,y+0.5,0.3+I.hx*0.5);
}
// (a dead one's thrown by the blow, keels over on its side, and lies where it lands)
function animalFall(A,dt){
  if(A.deadT>=3)return;A.deadT+=dt;const I=ANIMALS[A.sp],gy=groundAt(A.x,A.z,A.fy+3);
  A.x+=(A.kx||0)*dt;A.z+=(A.kz||0)*dt;{const k=Math.exp(-dt*2.5);A.kx=(A.kx||0)*k;A.kz=(A.kz||0)*k;}
  A.vy-=26*dt;A.fy+=A.vy*dt;if(gy!==null&&A.fy<=gy){A.fy=gy;A.vy=0;}
  const tip=Math.min(1,A.deadT*2.5);A.g.rotation.z=A.fall*tip*Math.PI/2;A.g.position.set(A.x,A.fy+I.hx*tip,A.z);
}
