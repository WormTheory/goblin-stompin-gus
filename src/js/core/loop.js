// ---------- Loop ----------
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let last=performance.now();
// speed effects while charging: a smoothed 0..1 intensity, and streaks rushing past the lens
// running (trample or sprint): speed lines in the world around Gus, streaming back past him along the way he's
// actually moving -- real geometry in the scene, so the other player sees them too
function bodyStreaks(p,dt){
  const ox=p.bsx??p.pos.x,oz=p.bsz??p.pos.z;p.bsx=p.pos.x;p.bsz=p.pos.z;
  if(dt>0){const vx=(p.pos.x-ox)/dt,vz=(p.pos.z-oz)/dt,a=Math.min(1,dt*10);if(Math.hypot(vx,vz)<60){p.bvx=(p.bvx||0)+(vx-(p.bvx||0))*a;p.bvz=(p.bvz||0)+(vz-(p.bvz||0))*a;}}
  const sp=Math.hypot(p.bvx||0,p.bvz||0),want=(p.trK||0)>0.05&&p.state==='walk'&&sp>2&&!p.paused?Math.min(1,p.trK):0;
  p.bsK=(p.bsK||0)+(want-(p.bsK||0))*Math.min(1,dt*(want>(p.bsK||0)?6:5.5));
  // each streak is a thin tapered ribbon, drawn twice crossed (flat and upright) so it reads from any angle; a gradient
  // alpha map fades it from a bright head to nothing at the tail. (Plain GL lines are a single pixel wide -- too faint.)
  if(!p.bstr){if(p.bsK<0.02)return;
    const N=12,V=N*12,pos=new Float32Array(V*3),uv=new Float32Array(V*2),geo=new THREE.BufferGeometry();
    for(let i=0;i<N;i++)for(let q=0;q<2;q++){const o=(i*12+q*6)*2;uv.set([0,0,1,0,1,1,0,0,1,1,0,1],o);}
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    if(!bodyStreaks.tex){const c=document.createElement('canvas');c.width=64;c.height=4;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,64,0);
      gr.addColorStop(0,'#fff');gr.addColorStop(0.25,'#bbb');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,64,4);bodyStreaks.tex=new THREE.CanvasTexture(c);}
    const mat=new THREE.MeshBasicMaterial({color:0xfbf8f0,alphaMap:bodyStreaks.tex,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const ls=new THREE.Mesh(geo,mat);ls.frustumCulled=false;ls.renderOrder=9;scene.add(ls);
    p.bstr={ls,pos,pts:Array.from({length:N},()=>({life:0,t:1}))};}
  const B=p.bstr,P=B.pos,put=(o,x,y,z)=>{P[o]=x;P[o+1]=y;P[o+2]=z;};
  // each streak is born somewhere around him, a little ahead of his nose, pointing the way he's going -- and from then on
  // it's on its own: it holds its place in the world (drifting back slowly, like air he's pushing past) while he runs on
  // through it, and fades away. New ones only appear while he's running; the last few just finish and fade.
  const dx=(p.bvx||0)/(sp||1),dz=(p.bvz||0)/(sp||1),px=-dz,pz=dx;
  const live=want>0&&p.state!=='dead'&&!p.paused;let any=false;
  B.pts.forEach((s,i)=>{
    s.t+=dt/(s.life||1);
    if(s.t>=1&&live&&Math.random()<dt*14){   // (staggered, so they don't all appear at once)
      const a=Math.random()*Math.PI*2,r=1.35+Math.random()*1.0,sx=Math.cos(a)*r*1.15,sy=Math.sin(a)*r*0.75+0.15,ahead=0.8+Math.random()*2.2;
      s.x=p.pos.x+dx*ahead+px*sx;s.y=p.pos.y+1.1+sy;s.z=p.pos.z+dz*ahead+pz*sx;s.dx=dx;s.dz=dz;s.vx=-dx*(1.5+Math.random()*2);s.vz=-dz*(1.5+Math.random()*2);
      s.l=(1.3+Math.random()*1.4)*(0.6+0.4*Math.min(1,sp/14));s.w=0.025+Math.random()*0.02;s.life=0.35+Math.random()*0.25;s.t=0;}
    const o0=i*36;
    if(s.t>=1){for(let k=0;k<36;k++)P[o0+k]=0;return;}
    any=true;s.x+=s.vx*dt;s.z+=s.vz*dt;
    const hx=s.x,hy=s.y,hz=s.z,tx=hx-s.dx*s.l,tz=hz-s.dz*s.l,qx=-s.dz,qz=s.dx;
    // (each one grows in and shrinks away over its life instead of popping)
    const w=s.w*Math.sin(s.t*Math.PI),wt=w*0.35;
    for(let q=0;q<2;q++){const ax=q?0:qx,ay=q?1:0,az=q?0:qz,o=(i*12+q*6)*3;
      const h0=[hx-ax*w,hy-ay*w,hz-az*w],t0=[tx-ax*wt,hy-ay*wt,tz-az*wt],t1=[tx+ax*wt,hy+ay*wt,tz+az*wt],h1=[hx+ax*w,hy+ay*w,hz+az*w];
      put(o,...h0);put(o+3,...t0);put(o+6,...t1);put(o+9,...h0);put(o+12,...t1);put(o+15,...h1);}
  });
  B.ls.visible=any;B.ls.material.opacity=0.38;
  if(any)B.ls.geometry.attributes.position.needsUpdate=true;
}
function updateSpeedFx(p,dt){
  const mv=Math.hypot(p.mvx||0,p.mvz||0);
  const target=p.state!=='dead'&&!p.paused&&(p.wasCharging||mv>7)?1:0,k0=p.speedFx||0;
  p.speedFx=k0+(target-k0)*Math.min(1,dt*(target?5:3));
  // R2 windup: the camera leans in a notch at each charge level
  const wzT=p.state==='windup'||p.pHover&&p.state==='pound'?[0.06,0.12,0.19][p.stompLevel||0]:0,wz0=p.windZoom||0;
  p.windZoom=wz0+(wzT-wz0)*Math.min(1,dt*(wzT>wz0?7:4));
  const k=p.speedFx;
  if(!p.streak){
    const N=24,pos=new Float32Array(N*6),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.LineBasicMaterial({color:0xf4f1ea,transparent:true,opacity:0,depthTest:false,depthWrite:false,fog:false});
    const ls=new THREE.LineSegments(geo,mat);ls.frustumCulled=false;ls.renderOrder=10;ls.visible=false;
    // each player's streaks live on their own layer so they never show up in the other player's view
    ls.layers.set(1+p.idx);p.camera.layers.enable(1+p.idx);p.camera.add(ls);scene.add(p.camera);
    const spawn=s=>{s.a=Math.random()*Math.PI*2;s.r=2.4+Math.random()*2.2;s.z=-9-Math.random()*6;return s;};
    p.streak={ls,pos,spawn,pts:Array.from({length:N},()=>spawn({}))};
  }
  const S=p.streak;S.ls.visible=k>0.03;if(!S.ls.visible)return;
  S.ls.material.opacity=0.3*k;
  const sp=24+mv,len=1.2+sp*0.05,asp=Math.sqrt(p.camera.aspect||1.6);
  S.pts.forEach((s,i)=>{
    s.z+=sp*dt;if(s.z>-1.5)S.spawn(s);
    const x=Math.cos(s.a)*s.r*asp,y=Math.sin(s.a)*s.r,o=i*6;
    S.pos[o]=x;S.pos[o+1]=y;S.pos[o+2]=s.z;S.pos[o+3]=x;S.pos[o+4]=y;S.pos[o+5]=s.z-len;
  });
  S.ls.geometry.attributes.position.needsUpdate=true;
}
