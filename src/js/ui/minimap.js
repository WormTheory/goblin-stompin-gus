// ---- speedometer: sideways ground speed in km/h (one block = one metre); underneath, the fall speed shows only during a fall big enough to crash-land ----
const SPEEDO_MAX=120;
// ---- the minimap: the streets and blocks around you, turned so that up is the way the camera faces.
// Hostile goblins and police in red, townsfolk in white, your partner in green (a green arrow on the rim when they're off it)
const MINI_RANGE=64;
function updateMinimap(p,dt){
  p.miniT=(p.miniT||0)-dt;if(p.miniT>0)return;p.miniT=1/20;
  const cv=p.ui.mini;if(!cv)return;const x=cv.getContext&&cv.getContext('2d');if(!x||!x.setTransform)return;
  const S=cv.width,C=S/2,RAD=C-5,k=RAD/MINI_RANGE,yaw=p.cam.yaw,fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=-fz,rz=fx,px=p.pos.x,pz=p.pos.z;
  const toS=(wx,wz)=>{const dx=wx-px,dz=wz-pz;return[C+(rx*dx+rz*dz)*k,C-(fx*dx+fz*dz)*k];};
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,S,S);
  x.save();x.beginPath();x.arc(C,C,RAD,0,Math.PI*2);x.clip();
  x.fillStyle='#2b2f34';x.fillRect(0,0,S,S);
  // the world, drawn in world coordinates through a rotating transform
  x.setTransform(rx*k,-fx*k,rz*k,-fz*k,C-(rx*px+rz*pz)*k,C+(fx*px+fz*pz)*k);
  const R=MINI_RANGE*1.45,c0x=Math.floor((px-R)/CELL),c1x=Math.floor((px+R)/CELL),c0z=Math.floor((pz-R)/CELL),c1z=Math.floor((pz+R)/CELL),done=new Set();
  for(let cx=c0x;cx<=c1x;cx++)for(let cz=c0z;cz<=c1z;cz++){
    const X0=cx*CELL,Z0=cz*CELL,t=plotType(cx,cz);
    if(!tenvShow(cx,cz)){x.fillStyle=MAPC.plains;x.fillRect(X0,Z0,CELL,CELL);continue;}
    if(seaPlot(cx,cz)){const n=4,st=CELL/n,C=seaMapCells(cx,cz,n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){x.fillStyle=C[j*n+i];x.fillRect(X0+i*st,Z0+j*st,st,st);}continue;}
    if(t==='river'){x.fillStyle=MAPC.road;x.fillRect(X0,Z0,CELL,CELL);x.fillStyle=MAPC.river;if(riverDir(cx,cz)==='x')x.fillRect(X0,Z0+10,CELL,20);else x.fillRect(X0+10,Z0,20,CELL);continue;}
    if(t==='plains'||t==='farm'||t==='truckstop'){x.fillStyle=MAPC.plains;x.fillRect(X0,Z0,CELL,CELL);x.fillStyle='#5b5f63';if(gRow(cz,X0+16))x.fillRect(X0,Z0-3,CELL,14);if(gCol(cx,Z0+16))x.fillRect(X0-3,Z0,14,CELL);continue;}
    x.fillStyle='#565b5f';x.fillRect(X0+ROADW,Z0+ROADW,CELL-ROADW,CELL-ROADW);
    const Sp=superOf(cx,cz);
    if(Sp){if(done.has(Sp))continue;done.add(Sp);
      const sx0=Sp.ax*CELL+PL0,sz0=Sp.az*CELL+PL0;x.fillStyle=Sp.kind==='bigpark'?MAPC.park:Sp.kind==='stadium'?MAPC.stadium:'#4a4f53';
      x.fillRect(sx0,sz0,(Sp.w-1)*CELL+PW,(Sp.h-1)*CELL+PW);
      if(Sp.kind!=='bigpark'&&Sp.kind!=='stadium'){const allR=blockRuined(Sp.ax,Sp.az);plotInfo(Sp.ax,Sp.az).b.forEach((b,bi)=>{const ru=!allR&&ruinedB(Sp.ax,Sp.az,bi);x.fillStyle=ru?ruinPat(x,4):(MAPC[Sp.kind]||MAPC.mega);x.fillRect(Sp.ax*CELL+b.x0,Sp.az*CELL+b.z0,b.x1-b.x0,b.z1-b.z0);if(ru){x.strokeStyle='#e0503c';x.lineWidth=0.7;x.strokeRect(Sp.ax*CELL+b.x0+0.35,Sp.az*CELL+b.z0+0.35,b.x1-b.x0-0.7,b.z1-b.z0-0.7);}});}
      continue;}
    const B=plotBounds(cx,cz);x.fillStyle=t==='park'?MAPC.park:t==='plaza'?MAPC.plaza:t==='homes'?'#5f8a46':t==='ramp'?MAPC.ramp:'#4a4f53';
    x.fillRect(X0+B.x0,Z0+B.z0,B.x1-B.x0,B.z1-B.z0);
    const col=MAPC[t]||'#7a7f86';const allR=blockRuined(cx,cz);plotInfo(cx,cz).b.forEach((b,bi)=>{const ru=!allR&&ruinedB(cx,cz,bi);x.fillStyle=ru?ruinPat(x,4):col;x.fillRect(X0+b.x0,Z0+b.z0,b.x1-b.x0,b.z1-b.z0);if(ru){x.strokeStyle='#e0503c';x.lineWidth=0.7;x.strokeRect(X0+b.x0+0.35,Z0+b.z0+0.35,b.x1-b.x0-0.7,b.z1-b.z0-0.7);}});
  }
  // the railways
  if(!TENV){x.strokeStyle=MAPC.rail;x.lineWidth=4;x.beginPath();for(const L of railLinksInBox(c0x*CELL,c0z*CELL,(c1x+1)*CELL,(c1z+1)*CELL))for(let i=0;i+4<L.L;i+=4){x.moveTo(L.pts[i][0],L.pts[i][1]);x.lineTo(L.pts[Math.min(L.L-1,i+4)][0],L.pts[Math.min(L.L-1,i+4)][1]);}x.stroke();}
  // rivers and highways out across the plains, on their own lines
  if(!TENV){const X0=c0x*CELL,Z0=c0z*CELL,X1=(c1x+1)*CELL,Z1=(c1z+1)*CELL,pl=(ax,az,bx,bz)=>!settlementAt(Math.floor((ax+bx)/2/CELL),Math.floor((az+bz)/2/CELL));
   const draw=(L,pick,col,w)=>{x.strokeStyle=col;x.lineWidth=w;x.lineCap='round';x.beginPath();for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1];if(!pick(R))continue;const [ax,az]=R.pts[i],[bx,bz]=R.pts[i+1];if(!pl(ax,az,bx,bz))continue;x.moveTo(ax,az);x.lineTo(bx,bz);}x.stroke();};
   draw(riversNearBox(X0,Z0,X1,Z1),()=>true,MAPC.river,RIV_W*2);
   const L=routesNearBox(X0,Z0,X1,Z1);draw(L,R=>R.kind==='country','#5b5f63',14);draw(L,R=>R.kind==='moto','#7a7f86',14);}
  {const RG=ruinGrid(c0x,c1x,c0z,c1z,null);if(RG.cells.length){x.fillStyle=ruinPat(x,4);for(const [a,b,c,d] of RG.cells)x.fillRect(a,b,c-a,d-b);
    x.strokeStyle='#e0503c';x.lineWidth=0.7;x.beginPath();for(const [a,b,c,d] of RG.edges){x.moveTo(a,b);x.lineTo(c,d);}x.stroke();}}
  x.setTransform(1,0,0,1,0,0);
  const dot=(wx,wz,col,r)=>{const [sx,sy]=toS(wx,wz);if(Math.hypot(sx-C,sy-C)>RAD)return;x.fillStyle=col;x.beginPath();x.arc(sx,sy,r,0,Math.PI*2);x.fill();x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=1;x.stroke();};
  for(const c of cars)if(c.alive&&(c.hunter||c.svcPool==='police'))dot(c.pos.x,c.pos.z,'#ff3b30',3.6);
  for(const g of goblins){if(g.state!=='chase'||!g.root.visible)continue;dot(g.pos.x,g.pos.z,g.civ?'#f2f2ee':'#ff3b30',2.8);}
  // your partner: a green dot, or a green arrow on the rim pointing their way
  for(const o of players){if(o===p||!o.active||o.state==='dead')continue;const [sx,sy]=toS(o.pos.x,o.pos.z),dd=Math.hypot(sx-C,sy-C);
    if(dd<=RAD-6)dot(o.pos.x,o.pos.z,'#5fe36a',4.2);
    else{const a=Math.atan2(sy-C,sx-C),ex=C+Math.cos(a)*(RAD-7),ey=C+Math.sin(a)*(RAD-7);x.save();x.translate(ex,ey);x.rotate(a);x.fillStyle='#5fe36a';x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=1.2;
      x.beginPath();x.moveTo(7,0);x.lineTo(-5,-6);x.lineTo(-5,6);x.closePath();x.fill();x.stroke();x.restore();}}
  // you: an arrow in the middle, pointing the way you face
  {const h=p.heading,sx=rx*Math.sin(h)+rz*Math.cos(h),sy=-(fx*Math.sin(h)+fz*Math.cos(h)),a=Math.atan2(sy,sx);
   x.save();x.translate(C,C);x.rotate(a);x.fillStyle=p.idx?'#ffb0d8':'#ffd75a';x.strokeStyle='#0c0f14';x.lineWidth=1.5;x.beginPath();x.moveTo(8,0);x.lineTo(-6,-6);x.lineTo(-3,0);x.lineTo(-6,6);x.closePath();x.fill();x.stroke();x.restore();}
  x.restore();
  x.strokeStyle='rgba(238,240,230,.85)';x.lineWidth=3;x.beginPath();x.arc(C,C,RAD,0,Math.PI*2);x.stroke();
  // north marker on the rim
  {const a=Math.atan2(-(fx*0+fz*-1),rx*0+rz*-1),nx=C+Math.cos(a)*(RAD-1),ny=C+Math.sin(a)*(RAD-1);x.fillStyle='#0c0f14';x.beginPath();x.arc(nx,ny,7,0,Math.PI*2);x.fill();x.fillStyle='#eef0e6';x.font='bold 10px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('N',nx,ny+0.5);}
}
function updateSpeedo(p,dt){
  if(!p.ui.speedo)return;
  const C=p.state==='dead'&&p.corpse?p.corpse:null,x=C?C.x:p.pos.x,y=C?C.y:p.pos.y,z=C?C.z:p.pos.z;
  let raw=0,rawY=0;
  if(p.spX!==undefined&&dt>0){raw=Math.hypot(x-p.spX,z-p.spZ)/dt*3.6;rawY=(y-p.spY)/dt*3.6;}
  p.spX=x;p.spY=y;p.spZ=z;
  if(raw>400){raw=0;rawY=0;}   // a respawn or teleport isn't speed
  const kk=Math.min(1,dt*7);p.spV=(p.spV||0)+(raw-(p.spV||0))*kk;p.spVY=(p.spVY||0)+(rawY-(p.spVY||0))*kk;
  p.spT=(p.spT||0)-dt;if(p.spT>0)return;p.spT=1/20;   // redraw at 20 Hz
  const v=Math.max(0,p.spV),k=Math.min(1,v/SPEEDO_MAX),shown=Math.round(v);
  if(shown!==p.spShown){p.spShown=shown;p.ui.spNum.textContent=String(shown);}
  // a crash landing is coming when you're falling from 5+ blocks above the ground (or ground-pounding)
  let crash=false;
  if(!C&&!p.grounded&&p.vy<0){const gnd=groundAt(p.pos.x,p.pos.z,p.pos.y);crash=p.state==='pound'||ABIL.crash&&((p.peakY??p.pos.y)-gnd)>=5;}
  const vy=Math.round(p.spVY),vtxt=crash&&vy<-2?'↓ '+Math.abs(vy):'';
  // colour by how hard the landing will be: yellow, then orange, then red
  const heat=-vy<70?'y':-vy<95?'o':'r';
  if(vtxt!==p.spVShown){p.spVShown=vtxt;p.ui.spVert.textContent=vtxt;p.ui.spVert.setAttribute('visibility',vtxt?'visible':'hidden');}
  if(heat!==p.spHeat){p.spHeat=heat;p.ui.spVert.setAttribute('class','sp-vert '+heat);}
  p.ui.spNeedle.setAttribute('transform','rotate('+(-120+240*k).toFixed(1)+')');
  p.ui.spFill.setAttribute('stroke-dasharray',(k*100).toFixed(1)+' 200');p.ui.spFill.setAttribute('visibility',k<0.01?'hidden':'visible');
  p.ui.spFill.setAttribute('stroke',k<0.55?'#7fc24a':k<0.8?'#f0a04a':'#e0564a');
}
let camClock=0;   // real seconds, for camera effects (they run on even when the game is slowed)
function placeCamera(p){
  drvHud(p);
  if(DT.gob){if(p.drv)drvCamera(p);else gobCamera(p);return;}
  const cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;
  const hang=p.state==='ceil'||(p.state==='piv'&&p.piv&&p.piv.next==='ceil');p.camHang=(p.camHang||0)+((hang?1:0)-(p.camHang||0))*0.12;
  const tx=p.pos.x,ty=p.pos.y+(2.4-3.6*p.camHang)*ES,tz=p.pos.z,sk=p.speedFx||0;
  // pull the camera in when a building is behind Gus; tuck in a little closer while charging
  // an air dash: the camera is left behind for a moment -- it's thrown a couple of blocks the opposite way to the dash
  // (back if he dashes away from it, forward if he dashes toward it, sideways for a sideways dash), then eases back
  let lurch=0;if(p.lurchAt){const e=camClock-p.lurchAt;if(e<0.9){const k=e<0.07?e/0.07:Math.exp(-(e-0.07)*4.5);lurch=2.6*ES*k*k*(3-2*k);}else p.lurchAt=0;}
  const base=7.5*ES*(1-0.15*sk)*(1-(p.windZoom||0));let dist=base;
  for(let t=0.6;t<=base;t+=0.3){if(solidAt(Math.floor(tx-fx*t),Math.floor(ty-fy*t),Math.floor(tz-fz*t))){dist=Math.max(0.8,t-0.5);break;}}
  let cx=tx-fx*dist,cy=ty-fy*dist,cz=tz-fz*dist;
  if(lurch>0){const lx=-Math.sin(p.heading),lz=-Math.cos(p.heading);let l=lurch;
    while(l>0.2&&solidAt(Math.floor(cx+lx*l),Math.floor(cy),Math.floor(cz+lz*l)))l*=0.5;   // (not into a wall)
    // never so far forward that it reaches him
    const nx=cx+lx*l,nz=cz+lz*l;if(Math.hypot(nx-tx,nz-tz)>1.6*ES){cx=nx;cz=nz;}}
  const gy=supportAt(cx,cz,cy);if(gy!==null&&cy<gy+0.4)cy=gy+0.4;
  p.camera.position.set(cx,cy,cz);p.camera.rotation.set(p.cam.pitch,p.cam.yaw,0);
  if(p.shake>0.002&&gameSpeed()>0){p.camera.position.x+=(Math.random()-.5)*p.shake;p.camera.position.y+=(Math.random()-.5)*p.shake;p.camera.position.z+=(Math.random()-.5)*p.shake;}
  // charging: a fine rattle plus a jolt on each heavy footfall
  if(sk>0.01){
    const t=p.t,j=0.012*sk*(p.sprinting?0.4:1);
    p.camera.position.x+=(Math.sin(t*31)+Math.sin(t*53+1.3))*j;
    p.camera.position.y+=(Math.sin(t*37+0.7)+Math.sin(t*59+2.1))*j-(p.grounded?0.04*sk*(p.sprinting?0.4:1)*Math.abs(Math.cos(p.phase)):0);
    p.camera.rotation.z=(Math.sin(t*23)+Math.sin(t*41+0.5))*0.002*sk*(p.sprinting?0.4:1);
  }
  // winding up the R2 stomp (or hovering to charge a ground pound): a low tremble that steps up at each charge level
  if(p.state==='windup'||p.state==='pound'&&p.pHover){
    const t=p.t,t0=p.state==='pound'?PFLIP:0,j=[0.012,0.022,0.036][p.stompLevel||0],ease=Math.min(1,Math.max(0,p.t-t0)/0.25)*j;
    p.camera.position.x+=(Math.sin(t*29+0.4)+Math.sin(t*47+2.2))*ease;
    p.camera.position.y+=(Math.sin(t*33+1.1)+Math.sin(t*61))*ease;
    p.camera.rotation.z+=(Math.sin(t*19)+Math.sin(t*37+0.9))*ease*0.12;
  }
}
// ---- debug overlays drawn over the 3D view: health bars over everything that can be hurt, and damage numbers that
// pop up where hits land (2D, projected through each player's camera, bent like the world curve bends things) ----
const DMG_POPS=[],_dov=new THREE.Vector3();
function dmgPop(x,y,z,n,col){if(!DT.dmgNums||SBX||!(n>0))return;DMG_POPS.push({x:x+(Math.random()-0.5)*0.6,y,z:z+(Math.random()-0.5)*0.6,n,col,t:0});if(DMG_POPS.length>200)DMG_POPS.shift();}
let dovCtx=null,dovOn=false;
function drawDbgOverlay(dt,views){
  const cv=document.getElementById('dbgOver');if(!cv)return;
  for(let i=DMG_POPS.length-1;i>=0;i--){DMG_POPS[i].t+=dt;if(DMG_POPS[i].t>1.1)DMG_POPS.splice(i,1);}
  const want=(DT.hpBars||DMG_POPS.length>0)&&playing;
  if(!want){if(dovOn){dovCtx&&dovCtx.clearRect(0,0,cv.width,cv.height);dovOn=false;}return;}
  const dpr=Math.min(devicePixelRatio||1,2),W=Math.round(innerWidth*dpr),Hh=Math.round(innerHeight*dpr);
  if(cv.width!==W||cv.height!==Hh){cv.width=W;cv.height=Hh;}
  const x=dovCtx||(dovCtx=cv.getContext('2d'));x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,innerWidth,innerHeight);dovOn=true;
  for(const [p,vx,vy,vw,vh] of views){
    const cam=p.camera,top=innerHeight-(vy+vh),k=CURVE_U.value;
    x.save();x.beginPath();x.rect(vx,top,vw,vh);x.clip();
    const proj=(wx,wy,wz)=>{const d2=(wx-cam.position.x)**2+(wz-cam.position.z)**2;_dov.set(wx,wy-k*d2,wz).project(cam);if(_dov.z>1||_dov.z<-1)return null;return[vx+(_dov.x+1)/2*vw,top+(1-_dov.y)/2*vh,Math.sqrt(d2)];};
    if(DT.hpBars){
      const bar=(wx,wy,wz,hp,max,col)=>{const s=proj(wx,wy,wz);if(!s||s[2]>70)return;const f=Math.max(0,Math.min(1,hp/max)),bw=Math.max(18,46-s[2]*0.4),bh=5;
        x.fillStyle='rgba(10,12,16,.75)';x.fillRect(s[0]-bw/2-1,s[1]-bh-1,bw+2,bh+2);x.fillStyle=f>0.6?col:f>0.3?'#e8c14a':'#ff4a3a';x.fillRect(s[0]-bw/2,s[1]-bh,bw*f,bh);
        if(s[2]<28){x.font='600 10px ui-monospace,Menlo,monospace';x.fillStyle='#e8ece4';x.textAlign='center';x.fillText(Math.max(0,Math.ceil(hp))+'/'+Math.round(max),s[0],s[1]-bh-3);}};
      for(const g of goblins){if(!g.root.visible||g.state==='wait'||g.state==='dead'||!(g.hp>0))continue;if(!(g.hpMax>=g.hp))g.hpMax=g.hp;bar(g.pos.x,g.pos.y+2.1,g.pos.z,g.hp,g.hpMax,g.civ?'#9ad0ff':'#7fd04a');}
      for(const c of cars){if(!c.alive||!c.g.visible)continue;if(!(c.hpMax>=c.hp))c.hpMax=Math.max(c.hp,c.svcPool?45:30);bar(c.pos.x,c.pos.y+(c.hy||1.4)+0.5,c.pos.z,c.hp,c.hpMax,'#5ab4ff');}
      for(const V of venues.values()){
        if(V.kind==='army')for(const M of V.mil){if(!M.dead)bar(M.x,M.y+MIL[M.kind].hy+0.6,M.z,M.hp,MIL[M.kind].hp,'#5ab4ff');}
        else if(V.kind==='airport'&&V.pl)for(const pl of V.pl){if(!pl.dead&&pl.g.visible)bar(pl.g.position.x,pl.g.position.y+5,pl.g.position.z,pl.hp,PLANE_HP,'#5ab4ff');}
        else if(V.kind==='boat'&&V.bo&&!V.bo.dead&&V.boat.visible){const g=V.boat;bar(g.position.x,g.position.y+V.bo.K.fb+2,g.position.z,V.bo.hp,V.bo.max,'#5ab4ff');}
        else if(V.kind==='rtrain'&&V.T&&!V.T.dead&&V.cars)V.cars.forEach((g,i)=>{if(!(V.T.carDead&&V.T.carDead[i]))bar(g.position.x,g.position.y+4.2,g.position.z,V.T.carHP?V.T.carHP[i]:CAR_HP,CAR_HP,'#5ab4ff');});}
      for(const q of players){if(!q.active||q.state==='dead'||q===p)continue;bar(q.pos.x,q.pos.y+2.5,q.pos.z,q.hp,20,'#7fd04a');}
    }
    for(const d of DMG_POPS){const s=proj(d.x,d.y+d.t*1.6,d.z);if(!s||s[2]>90)continue;const a=d.t<0.7?1:Math.max(0,1-(d.t-0.7)/0.4),sz=Math.round(16+Math.min(14,d.n*0.5)-s[2]*0.08);
      x.font='800 '+Math.max(10,sz)+'px system-ui,sans-serif';x.textAlign='center';x.lineWidth=3;x.strokeStyle='rgba(0,0,0,'+0.8*a+')';x.globalAlpha=a;x.strokeText(String(Math.round(d.n*10)/10),s[0],s[1]);x.fillStyle=d.col;x.fillText(String(Math.round(d.n*10)/10),s[0],s[1]);x.globalAlpha=1;}
    x.restore();
  }
}
function renderView(p,x,y,w,h){
  const c=p.camera.position,under=get(c.x,c.y,c.z)===WATER;
  p.ui.tint.hidden=!under;
  const far=lodFar();
  if(under){scene.fog.color.copy(DEEP);scene.background.copy(DEEP);scene.fog.near=1;scene.fog.far=18;}
  else{const fk=Math.max(0.2,WX.k.fog);scene.fog.color.copy(SKY);scene.background.copy(SKY);scene.fog.near=far*0.45*fk*fk;scene.fog.far=far*fk;}
  placePrecip(c,p.idx);
  p.camera.aspect=w/h;p.camera.fov=72-6*(p.speedFx||0)-8*(p.windZoom||0);p.camera.far=far+40;p.camera.near=DT.gob?0.12:0.25;p.camera.updateProjectionMatrix();
  renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);
  sky.position.copy(p.camera.position);
  if(p.lockMark&&p.lockMark.visible)p.lockMark.quaternion.copy(p.camera.quaternion);
  // the sky's horizon goes where the world's edge appears: bent down, the top of the curve (or the end of the view, if
  // that comes first); bent up, the rim of the bowl. Measured from where it'd sit with the world flat
  {const k=CURVE_U.value,hh=Math.max(0.5,c.y-(G+1)),F=Math.max(60,far);let sl=-(hh/F+k*F);if(k>0&&Math.sqrt(hh/k)<F)sl=-2*Math.sqrt(hh*k);
   const at=sl=>sl/Math.sqrt(1+sl*sl);skyU.uHzn.value=k?at(sl)-at(-hh/F):0;}
  gobView(p);CURVE_CAM.copy(p.camera.position);HORIZ_U.value.set(CURVE_CAM.x,CURVE_CAM.y,CURVE_CAM.z,HORIZ_Y0);renderer.render(scene,p.camera);
}
// shrink every character and vehicle model to ES (feet stay on the ground: their origins are at the base)
for(const p of players)p.root.scale.setScalar(ES);
for(const g of goblins)g.root.scale.setScalar(ES);
for(const c of cars)c.g.scale.setScalar(ES);
