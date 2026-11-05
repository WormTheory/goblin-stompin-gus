// ---------- Toppling: a rigid piece pivoting on a hinge, carving through whatever it falls into ----------
const topples=[];const _tv=new V3();
// The falling piece is one rigid thing, so it needn't ask about every block of it every frame. Its blocks are shared out among
// cuboid sections, and a section whose whole box is clear of everything in the world (known from each 4 x 4 of columns' top
// block, tileTop) is passed over in one go. Only the sections actually touching something look block by block.
const TOPPLE_SEC=8;
function toppleSections(surface,loc){
  const m=new Map();let mx=1e9,my=1e9,mz=1e9;
  for(const q of surface){if(q.x<mx)mx=q.x;if(q.y<my)my=q.y;if(q.z<mz)mz=q.z;}
  surface.forEach((q,i)=>{const k=Math.floor((q.x-mx)/TOPPLE_SEC)+Math.floor((q.y-my)/TOPPLE_SEC)*4096+Math.floor((q.z-mz)/TOPPLE_SEC)*16777216;let L=m.get(k);if(!L){L=[];m.set(k,L);}L.push(i);});
  const out=[];
  for(const L of m.values()){
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;
    for(const i of L){const x=loc[i*3],y=loc[i*3+1],z=loc[i*3+2];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(z<z0)z0=z;if(z>z1)z1=z;}
    const cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;out.push({cx,cy,cz,r:Math.hypot(x1-cx,y1-cy,z1-cz)+0.01,list:Int32Array.from(L)});}
  return out;
}
function makeTopple(blocks,pivot,D){
  const mesh=buildBodyMesh(blocks,null),surface=mesh.userData.surface;
  const grp=new THREE.Group();grp.position.copy(pivot);mesh.position.set(-pivot.x,-pivot.y,-pivot.z);grp.add(mesh);scene.add(grp);
  const loc=new Float32Array(surface.length*3);
  surface.forEach((q,i)=>{loc[i*3]=q.x+.5-pivot.x;loc[i*3+1]=q.y+.5-pivot.y;loc[i*3+2]=q.z+.5-pivot.z;});
  // only the far end hitting the ground ends the fall; the base near the hinge just grinds into it
  let maxR=0;const rad=new Float32Array(surface.length);for(let i=0;i<surface.length;i++){rad[i]=Math.hypot(loc[i*3],loc[i*3+1],loc[i*3+2]);if(rad[i]>maxR)maxR=rad[i];}
  const far=new Uint8Array(surface.length);for(let i=0;i<surface.length;i++)far[i]=rad[i]>maxR*0.55?1:0;
  let maxY=-1e9;for(const q of blocks)if(q.y>maxY)maxY=q.y;
  const big=blocks.filter(q=>q.b!==LEAVES&&q.b!==LOG).length>=60;
  topples.push({grp,mesh,blocks,loc,far,secs:toppleSections(surface,loc),bset:mesh.userData.set,maxR,n:surface.length,pivot:pivot.clone(),D:D.clone(),axis:new V3(D.z,0,-D.x),theta:0.02,omega:big?0.03:0.25,Lc:Math.max(1.5,(maxY+1-pivot.y)/2),hit:new Set(),t:0,q:new THREE.Quaternion(),big,rumbleT:0,dy:0,vy:0,dropping:false});
  if(big){tone('triangle',110,45,2.2,0.12);tone('triangle',90,40,1.6,0.1,0.8);}else{noise(0.25,0.3,1200,'bandpass');tone('triangle',200,90,0.4,0.08);}
}
function updateTopples(dt){
  for(let i=topples.length-1;i>=0;i--){
    const T=topples[i];T.t+=dt;
    // a toppling column speeds up as it leans: theta'' = 3g/(2*length) * sin(theta)
    // a piece hinged high up (it broke off part-way up a building): once it has swung down flat it keeps going, dropping
    // straight down and smashing through whatever is underneath until it hits the ground
    // (it starts sinking from the moment it tips: barely at first, more and more as it leans over, so by the time it
    // lies flat it is already falling and simply carries on; its spin dies away rather than stopping dead)
    const high=T.pivot.y>G+3,sn=Math.sin(Math.min(T.theta,Math.PI/2));
    if(T.dropping){T.vy=Math.min(40,T.vy+30*dt);T.omega*=Math.exp(-dt*9);T.theta=Math.min(Math.PI/2+0.45,T.theta+T.omega*dt);}
    else{T.omega+=(3*30/(4*T.Lc))*Math.sin(T.theta)*dt;T.omega=Math.min(T.omega,3);T.theta+=T.omega*dt;if(high)T.vy=Math.min(40,T.vy+30*dt*sn*sn*sn);}
    if(high||T.dropping){T.dy+=T.vy*dt;T.grp.position.y=T.pivot.y-T.dy;}
    T.q.setFromAxisAngle(T.axis,T.theta);T.grp.quaternion.copy(T.q);
    const batch=[],ch=new Set();let ground=0;
    // (the rotation as a matrix, once, rather than working it out afresh for each block)
    const qx=T.q.x,qy=T.q.y,qz=T.q.z,qw=T.q.w,R00=1-2*(qy*qy+qz*qz),R01=2*(qx*qy-qz*qw),R02=2*(qx*qz+qy*qw),R10=2*(qx*qy+qz*qw),R11=1-2*(qx*qx+qz*qz),R12=2*(qy*qz-qx*qw),R20=2*(qx*qz-qy*qw),R21=2*(qy*qz+qx*qw),R22=1-2*(qx*qx+qy*qy);
    const px=T.pivot.x,py=T.pivot.y-T.dy,pz=T.pivot.z,L=T.loc;
    for(const S of T.secs){
      const wy=R10*S.cx+R11*S.cy+R12*S.cz+py,low=Math.floor(wy-S.r);
      if(low>=H)continue;
      if(low>G){const wx=R00*S.cx+R01*S.cy+R02*S.cz+px,wz=R20*S.cx+R21*S.cy+R22*S.cz+pz;if(boxClear(wx-S.r,wx+S.r,wz-S.r,wz+S.r,low))continue;}
      const list=S.list;
      for(let j=0;j<list.length;j++){
        const k=list[j],lx=L[k*3],ly=L[k*3+1],lz=L[k*3+2],cy=Math.floor(R10*lx+R11*ly+R12*lz+py);
        if(cy>=H)continue;
        const cx=Math.floor(R00*lx+R01*ly+R02*lz+px),cz=Math.floor(R20*lx+R21*ly+R22*lz+pz),b=cy<=G?STONE:get(cx,cy,cz);
        // the ground (and the natural lie of the land: a grassy hill) stops it; anything else it smashes through
        if(cy<=G||(b===GRASS||b===DIRT||b===SAND)&&cy<=G+6){if(T.far[k]||T.dropping)ground++;continue;}
        if(b===AIR||b===WATER||b===BEDROCK)continue;
        setRaw(cx,cy,cz,AIR);addEdit(cx,cy,cz,AIR);batch.push({x:cx,y:cy,z:cz,b});
        ch.add(ckey(Math.floor(cx/CS),Math.floor(cz/CS)));for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])ch.add(ckey(Math.floor((cx+ox)/CS),Math.floor((cz+oz)/CS)));
      }
    }
    // is this block of the world inside the falling piece? (turned back into the piece's own frame and looked up)
    const within=(x,y,z)=>{const vx=x+.5-px,vy=y+.5-py,vz=z+.5-pz;return T.bset.has(bkey(Math.floor(R00*vx+R10*vy+R20*vz+T.pivot.x),Math.floor(R01*vx+R11*vy+R21*vz+T.pivot.y),Math.floor(R02*vx+R12*vy+R22*vz+T.pivot.z)));};
    const reach=(T.maxR+3)*(T.maxR+3),nearT=(x,y,z)=>(x-px)*(x-px)+(y-py)*(y-py)+(z-pz)*(z-pz)<reach;
    if(batch.length){
      rebuildSet(ch);save();
      const step=Math.ceil(batch.length/30);
      destroyFX(step>1?batch.filter((_,j)=>j%step===0):batch,{force:1,dx:T.D.x,dz:T.D.z,up:1},batch.length<3);
      if(T.big)T.omega=Math.max(0.15,T.omega*Math.max(0.7,1-0.0025*batch.length));
      if(T.dropping)T.vy*=Math.max(0.6,1-0.003*batch.length);   // ploughing through floors slows the drop a little
      settle(batch,{impact:true,dx:T.D.x,dz:T.D.z});pumpsHit(batch);
    }
    for(const g of goblins){if(g.state!=='chase'||T.hit.has(g)||!nearT(g.pos.x,g.pos.y,g.pos.z))continue;const x=Math.floor(g.pos.x),z=Math.floor(g.pos.z),y=Math.floor(g.pos.y);if(within(x,y,z)||within(x,y+1,z)){T.hit.add(g);damageGoblin(g,99,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(T.D.x,-0.5,T.D.z),'Flattened by a toppling building');if(g.state==='dead')flashLabel('Crushed  +100',(nearestPlayer(g.pos.x,g.pos.z)||{}).p);}}
    for(const c of cars){if(!c.alive||T.hit.has(c)||!nearT(c.pos.x,c.pos.y,c.pos.z))continue;const s=Math.sin(c.heading),k2=Math.cos(c.heading);for(const [a,b2] of c.pts){const x=Math.floor(c.pos.x+a*k2+b2*s),z=Math.floor(c.pos.z-a*s+b2*k2),y=Math.floor(c.pos.y);if(within(x,y,z)||within(x,y+1,z)){T.hit.add(c);damageCar(c,T.blocks.length>=25?999:12+T.blocks.length);clang();break;}}}
    if(T.big){T.rumbleT-=dt;if(T.rumbleT<=0){T.rumbleT=0.4;noise(0.5,0.35,250,'lowpass');addShake(0.12,T.pivot.x,T.pivot.z,60);}}
    if(!T.dropping&&T.theta>1.5&&ground<=Math.max(3,T.n*0.03)&&T.t<=14){T.dropping=true;}   // flat, but still up in the air
    else if(ground>Math.max(3,T.n*0.03)||T.t>14||T.dropping&&T.pivot.y-T.dy<-20){crashTopple(T);topples.splice(i,1);}
  }
}
function crashTopple(T){
  const counts=new Map(),sample=[],want=T.big?50:12;let sx=0,sz=0;
  for(const q of T.blocks){
    _tv.set(q.x+.5-T.pivot.x,q.y+.5-T.pivot.y,q.z+.5-T.pivot.z).applyQuaternion(T.q).add(T.pivot);_tv.y-=T.dy;
    const cx=Math.floor(_tv.x),cz=Math.floor(_tv.z),k=colKey(cx,cz);
    let e=counts.get(k);if(!e){e={x:cx,z:cz,n:0,logs:0,lv:0};counts.set(k,e);}e.n++;if(q.b===LOG)e.logs++;else if(q.b===LEAVES)e.lv++;sx+=cx;sz+=cz;
    if(Math.random()<want/T.blocks.length)sample.push({x:cx,y:Math.max(G+1,Math.floor(_tv.y)),z:cz,b:q.b});
  }
  sx/=T.blocks.length;sz/=T.blocks.length;
  destroyFX(sample,{force:1.3,dx:T.D.x,dz:T.D.z,up:1.3});
  {const fell=[];for(const q of T.blocks)if(q.b===PUMP){_tv.set(q.x+.5-T.pivot.x,q.y+.5-T.pivot.y,q.z+.5-T.pivot.z).applyQuaternion(T.q).add(T.pivot);_tv.y-=T.dy;fell.push({x:Math.floor(_tv.x),y:Math.max(G+1,Math.floor(_tv.y)),z:Math.floor(_tv.z)});}if(fell.length)pumpsFell(fell);}
  if(T.blocks.length>=6){
    const ch=new Set(),pileBase=[];
    for(const e of counts.values()){
      const tree=(e.logs+e.lv)>=e.n*0.6;if(!tree&&T.blocks.length<25)continue;
      for(const g of goblins)if(g.state==='chase'&&Math.floor(g.pos.x)===e.x&&Math.floor(g.pos.z)===e.z)damageGoblin(g,99,new V3(g.pos.x,g.pos.y+0.8,g.pos.z),new V3(0,1,0),'Buried under rubble');
      if(players.some(p=>p.active&&Math.abs(p.pos.x-(e.x+.5))<2.2&&Math.abs(p.pos.z-(e.z+.5))<2.2))continue;
      const mat=tree?(e.logs?LOG:LEAVES):COBBLE,h=tree?(e.logs?1:(e.lv>=6?2:1)):Math.min(6,Math.ceil(e.n*0.2)),base=colSupport(e.x,e.z,H);
      for(let y=base;y<base+h&&y<H;y++){setRaw(e.x,y,e.z,mat);addEdit(e.x,y,e.z,mat);}if(h>0)pileBase.push([e.x,base,e.z]);
      ch.add(ckey(Math.floor(e.x/CS),Math.floor(e.z/CS)));for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]])ch.add(ckey(Math.floor((e.x+ox)/CS),Math.floor((e.z+oz)/CS)));
    }
    rebuildSet(ch);save();dropFloating(pileBase);
    for(const c of cars)if(c.alive&&counts.has(colKey(Math.floor(c.pos.x),Math.floor(c.pos.z))))damageCar(c,T.blocks.length>=25?999:80);
    pumpsUnder(counts.values());
    ruinFires([...counts.values()],T.blocks.length);
  }
  if(T.big){noise(2.2,1,280,'lowpass');tone('sawtooth',55,22,2,0.3);thud(1);addShake(0.85,sx,sz,90);for(const p of players)if(p.active)rumble(p,1,800);smoke(sx,G+2,sz,14,0x77756e);}
  else{thud(0.5);addShake(0.25,sx,sz,20);}
  scene.remove(T.grp);T.mesh.geometry.dispose();
}

