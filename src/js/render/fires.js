// ---- the rivers flow: flecks of foam drift downstream on the water near you ----
const FLECK_N=180,flecks=new THREE.InstancedMesh(new THREE.BoxGeometry(0.55,0.03,0.2),new THREE.MeshBasicMaterial({color:0xe4f4ff,transparent:true,opacity:0.6,depthWrite:false}),FLECK_N);
flecks.frustumCulled=false;flecks.count=0;scene.add(flecks);
const fleckL=[],_fk=new THREE.Matrix4();
const riverFlow=k=>hash2(k*41+7,977)<0.5?1:-1;   // which way each river runs
function updateFlecks(dt){
  const p=players.find(q=>q.active);if(!p){flecks.count=0;return;}
  // the rivers near you (their pieces), and which way each runs
  if(!fleckL.near||Math.hypot(p.pos.x-fleckL.nx,p.pos.z-fleckL.nz)>24){fleckL.near=riversNearBox(p.pos.x-70,p.pos.z-70,p.pos.x+70,p.pos.z+70);fleckL.nx=p.pos.x;fleckL.nz=p.pos.z;}
  const near=fleckL.near;
  if(!near.length){flecks.count=0;fleckL.length=0;return;}
  const spawn=f=>{const q=2*Math.floor(Math.random()*near.length/2),R=near[q],i=near[q+1],[ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],t=Math.random(),l=Math.hypot(bx-ax,bz-az)||1,tx=(bx-ax)/l,tz=(bz-az)/l,o=(Math.random()-0.5)*2*(RIV_W-1.5);
    const fl=hash2(R.id*41+7,977)<0.5?1:-1;f.dx=tx*fl;f.dz=tz*fl;f.x=ax+(bx-ax)*t-tz*o;f.z=az+(bz-az)*t+tx*o;f.sp=1.2+Math.random()*1.2;f.life=6+Math.random()*10;};
  while(fleckL.length<FLECK_N){const f={};spawn(f);fleckL.push(f);}
  let n=0;
  for(const f of fleckL){
    f.life-=dt;f.x+=f.dx*f.sp*dt;f.z+=f.dz*f.sp*dt;
    if(f.life<=0||Math.abs(f.x-p.pos.x)>70||Math.abs(f.z-p.pos.z)>70)spawn(f);
    // only over open water (not under a bridge)
    // (and not in a chunk that isn't there yet: nobody can see it, and making it for a fleck of foam is no reason to stall)
    if(!chunks.has(ckey(Math.floor(f.x/CS),Math.floor(f.z/CS)))||get(Math.floor(f.x),G-2,Math.floor(f.z))!==WATER||get(Math.floor(f.x),G-1,Math.floor(f.z))!==AIR)continue;
    _fk.makeRotationY(Math.atan2(f.dx,f.dz)+Math.PI/2);_fk.setPosition(f.x,G-2+0.9,f.z);flecks.setMatrixAt(n++,_fk);
  }
  flecks.count=n;flecks.instanceMatrix.needsUpdate=true;
}
// ---- gas pumps: smash one and it goes up in a fireball a moment later, which can set off the others ----
// ---- lingering fires: after explosions and collapses, flames lick up off the wreckage and a column of smoke rises
// for a while. Each fire has its own pools of instanced flame and smoke puffs. Standing in one hurts. ----
const fires=[],FL_N=1600,SM_N=4500;
const flameM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.92,depthWrite:true}),FL_N);
const smokeM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false,fog:false}),SM_N);
const flameP=[],smokeP=[],_smLive=[];let flI=0,smI=0,flLive=0,smLive=0;
{const c0=new THREE.Color(0xffffff);
 for(let i=0;i<FL_N;i++)flameP.push({x:0,y:0,z:0,vy:0,life:0,max:1,s:1,ph:0});
 for(let i=0;i<SM_N;i++)smokeP.push({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,max:1,s:1,g:0.2,glow:0});
 flameM.setColorAt(0,c0);smokeM.setColorAt(0,c0);flameM.instanceMatrix.usage=flameM.instanceColor.usage=smokeM.instanceMatrix.usage=smokeM.instanceColor.usage=THREE.DynamicDrawUsage;
 flameM.frustumCulled=false;smokeM.frustumCulled=false;flameM.renderOrder=1;smokeM.renderOrder=2;/* flames first (writing depth), then smoke over them: smoke in front veils the fire, smoke behind it doesn't */flameM.count=0;smokeM.count=0;scene.add(flameM);scene.add(smokeM);}
// a fire at (x,y,z): r is how wide it burns, life in seconds; flames:false is just smouldering smoke
function addFire(x,y,z,r,life,flames=true,o={}){
  trimFires(1);   // too many: the oldest go out
  const L=life*Math.min(FIRE_DURS[fireDurI].m,1e6);
  fires.push({x,y,z,r,t:L,life:L,base:life,born:playTime,flames,acc:0,sacc:0,hurt:0,sm:o.smoke??1,rise:o.rise??1,blame:BLAME});
}
// the duration setting changed: fires already burning take on the new length (each keeps how far through it was)
// put out the oldest fires until there's room for 'room' more under the cap
function trimFires(room){const cap=FIRE_CAPS[fireCapI];while(fires.length>0&&fires.length+room>cap){let k=0;for(let i=1;i<fires.length;i++)if(fires[i].born<fires[k].born)k=i;fires.splice(k,1);}}
function refireDur(){const m=Math.min(FIRE_DURS[fireDurI].m,1e6);for(const F of fires){const f=F.t/F.life;F.life=F.base*m;F.t=F.life*f;}}
const _firM=new THREE.Matrix4(),_firQ=new THREE.Quaternion(),_firS=new V3(),_firP=new V3(),_firC=new THREE.Color(),FL_COLS=[0xfff2a0,0xffc23a,0xff7a1e,0xd8380e];
function updateFires(dt){
  for(let i=fires.length-1;i>=0;i--){
    const F=fires[i];if(FIRE_DURS[fireDurI].m!==Infinity||F.douse)F.t-=dt;if(F.t<=0){fires.splice(i,1);continue;}
    // the heat melts the snow round it (it starts settling again, from nothing, once the fire's out) -- off the ground,
    // and off any car, goblin or hippo standing close by
    F.melt=(F.melt||0)-dt;
    if(F.melt<=0&&WX.snowCover>0){F.melt=1+Math.random()*0.5;const R=F.r+1.5,ch=new Set();let melted=0;
      for(let x=Math.floor(F.x-R);x<=Math.floor(F.x+R);x++)for(let z=Math.floor(F.z-R);z<=Math.floor(F.z+R);z++){
        if(Math.hypot(x+0.5-F.x,z+0.5-F.z)>R)continue;const key=x*65536+z,was=snowBorn.get(key)||0;
        if(WX.snowClock-was>0.02){snowBorn.set(key,WX.snowClock);ch.add(ckey(Math.floor(x/CS),Math.floor(z/CS)));melted++;}}
      if(ch.size)rebuildSet(ch);
      if(melted>3)puff(F.x,F.y+0.6,F.z,4,0xe8eef4,R*0.5);   // a little steam
      const near=o=>o&&o.snowU&&o.snowU.value>0&&Math.hypot(o.pos.x-F.x,o.pos.z-F.z)<R+2;
      for(const o of cars)if(o.alive&&near(o))o.snowU.value=Math.max(0,o.snowU.value-0.6);
      for(const o of goblins)if(near(o))o.snowU.value=Math.max(0,o.snowU.value-0.6);
      for(const o of players)if(o.active&&near(o))o.snowU.value=Math.max(0,o.snowU.value-0.6);}
    // burns hard, then dies down over the last third
    const k=Math.min(1,F.t/(F.life*0.35)),R=F.r;
    if(F.flames){
      F.acc+=dt*R*R*9*k;
      while(F.acc>=1){F.acc--;const p=flameP[flI];flI=(flI+1)%FL_N;
        const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*R,px=F.x+Math.cos(a)*d,pz=F.z+Math.sin(a)*d;
        const g=supportAt(px,pz,F.y+3);p.x=px;p.z=pz;p.y=(g===null?F.y:g)+0.1;
        p.vy=2+Math.random()*2.5*(0.6+0.4*k);p.max=p.life=0.45+Math.random()*0.5;p.s=(0.35+Math.random()*0.45)*(0.6+0.5*Math.min(1,R/2.5))*(0.5+0.5*k);p.ph=Math.random()*6;}
      // burns whoever stands in it (and goblins)
      F.hurt-=dt;
      if(F.hurt<=0&&k>0.3){F.hurt=0.9;
        for(const q of players){if(!q.active||q.state==='dead')continue;const dx=q.pos.x-F.x,dz=q.pos.z-F.z,dy=q.pos.y-F.y;if(Math.hypot(dx,dz)<R*0.85&&dy>-1.5&&dy<2.5){const d=Math.hypot(dx,dz)||1;damagePlayer(q,1,new V3(q.pos.x,q.pos.y+0.6,q.pos.z),new V3(dx/d*0.4,0.5,dz/d*0.4),'Burned to death');flashLabel('Burning!',q);}}
        withBlame(F.blame,()=>hitGoblins(F.x,F.z,R*0.85,1,'Burned in the wreckage',F.y));}
    }
    // (a very thick plume puts out bigger puffs rather than ever more of them)
    const smR=Math.min(F.sm,2.5),smS=Math.sqrt(Math.max(1,F.sm/2.5));
    // (see-through boxes are what a slow graphics card struggles with most, up close: when frames are running long, thinner plumes)
    F.sacc+=dt*(1.5+R*1.6)*smR*(0.4+0.6*k)*(frameMs>40?0.35:frameMs>25?0.6:1);
    while(F.sacc>=1){F.sacc--;const p=smokeP[smI];smI=(smI+1)%SM_N;
      const a=Math.random()*Math.PI*2,d=Math.random()*R*0.7;p.x=F.x+Math.cos(a)*d;p.z=F.z+Math.sin(a)*d;p.y=F.y+0.8+Math.random();
      const ri=F.rise;p.vx=(0.5+(Math.random()-.5)*0.6)*Math.sqrt(ri);p.vz=(0.25+(Math.random()-.5)*0.6)*Math.sqrt(ri);p.vy=(2.2+Math.random()*1.6)*ri;p.max=p.life=(3.5+Math.random()*3)*(1+(ri-1)*0.9);p.s=(0.8+Math.random()*0.8+R*0.25)*(1+(ri-1)*0.35)*smS;p.g=F.flames?0.1+Math.random()*0.08:0.32+Math.random()*0.12;p.glow=F.flames?k*(0.55+Math.random()*0.35):0;}
  }
  // (nothing burning and the last of it gone: nothing to go through, or to send to the graphics card)
  if(!fires.length&&!flLive&&!smLive){if(flameM.count)flameM.count=0;if(smokeM.count)smokeM.count=0;return;}
  // (the live ones packed at the front, and only those drawn and sent up)
  let nf=0;
  for(let i=0;i<FL_N;i++){const p=flameP[i];
    if(p.life<=0)continue;
    p.life-=dt;const u=1-Math.max(0,p.life)/p.max;p.y+=p.vy*dt;p.x+=Math.sin(p.ph+u*9)*dt*0.6;
    const sc=p.s*(1-u*0.8);_firS.set(sc,sc*1.4,sc);_firP.set(p.x,p.y,p.z);_firQ.setFromAxisAngle(_upAx,p.ph+u*2);
    flameM.setMatrixAt(nf,_firM.compose(_firP,_firQ,_firS));flameM.setColorAt(nf,_firC.setHex(FL_COLS[Math.min(3,Math.floor(u*4))]));nf++;}
  flLive=nf;flameM.count=nf;
  // smoke is see-through, so it has to be drawn far-to-near: live puffs are sorted by distance from the camera
  // and packed into the instance slots in that order (otherwise a pale puff behind could paint over a dark one)
  const live=_smLive;live.length=0;
  for(let i=0;i<SM_N;i++){const p=smokeP[i];if(p.life<=0)continue;
    p.life-=dt;if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy*=1-0.08*dt;p.i=i;live.push(p);}
  const cp=(players.find(q=>q.active)||players[0]).camera.position;
  for(const p of live)p.cd=(p.x-cp.x)**2+(p.y-cp.y)**2+(p.z-cp.z)**2;
  live.sort((a,b)=>b.cd-a.cd);
  for(let n=0;n<live.length;n++){const p=live[n],u=1-p.life/p.max;
    const sc=p.s*(1+u*2.6)*(u>0.85?(1-u)/0.15:1);_firS.set(sc,sc,sc);_firP.set(p.x,p.y,p.z);_firQ.setFromAxisAngle(_upAx,u*1.5+p.i);
    smokeM.setMatrixAt(n,_firM.compose(_firP,_firQ,_firS));const g=p.g*(1-u*0.25)*WORLD_LIGHT.value.r,w=p.glow*Math.max(0,1-u*3.2);   // lit orange from below while it's still low over the flames
    smokeM.setColorAt(n,_firC.setRGB(g*(1-w)+1.0*w,g*(1-w)+0.42*w,g*1.05*(1-w)+0.12*w));}
  smLive=live.length;smokeM.count=live.length;
  for(const [M,n] of [[flameM,nf],[smokeM,live.length]])for(const [a,w] of [[M.instanceMatrix,16],[M.instanceColor,3]])if(a){a.needsUpdate=true;if(a.updateRange){a.updateRange.offset=0;a.updateRange.count=n*w;}}
}
const _upAx=new V3(0,1,0);
// a round blast: knocks out everything within R (a ragged ball, flattened so it bites into the ground less)
function crushBall(x,y,z,R,opt={}){
  const o={force:opt.force||1,dx:0,dz:0,up:opt.up||1};
  dbgHit('block','sph',{x,y,z,r:R});
  const SC=SBX?[]:null;   // (in the Dev tab's sandbox: just list the blocks it would take)
  if(!SC)knockFixtures(x,z,R+1,0,0);
  if(!SC)knockProps(x,y,z,R+1,0,0);
  const x0=Math.floor(x),y0=Math.floor(y),z0=Math.floor(z),ch=new Set(),broken=[],Ri=Math.ceil(R);
  for(let dy=-2;dy<=Ri;dy++)for(let dz=-Ri;dz<=Ri;dz++)for(let dx=-Ri;dx<=Ri;dx++){
    const bx=x0+dx,by=y0+dy,bz=z0+dz;if(by<1||by>=H)continue;
    const dd=Math.hypot(dx,dz,dy<0?dy*2.2:dy*0.9),lim=R*(0.82+0.3*hash2(bx*7+by,bz*13+by*5));if(dd>lim)continue;
    if(SC){SC.push(bx,by,bz);continue;}
    const b=get(bx,by,bz);if(b===AIR||b===WATER||b===BEDROCK)continue;
    setRaw(bx,by,bz,AIR);addEdit(bx,by,bz,AIR);broken.push({x:bx,y:by,z:bz,b});
    for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((bx+ox)/CS),Math.floor((bz+oz)/CS)));
  }
  if(SC){sbxCells(SC);return 0;}
  if(broken.length){rebuildSet(ch);save();
    for(let i=broken.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[broken[i],broken[j]]=[broken[j],broken[i]];}
    destroyFX(broken.slice(0,90),o);settle(broken,o);pumpsHit(broken);}
  return broken.length;
}
// rubble landing on gas pumps sets them off
function pumpsUnder(cols){const hit=[];for(const c of cols)for(let y=G+1;y<=G+4;y++){const v=get(c.x,y,c.z);if(v===PUMP)hit.push({x:c.x,y,z:c.z,b:PUMP});}if(hit.length)pumpsHit(hit);}
// once a building has come down: fires break out at random along the rubble, and a smoke plume (sized by the building)
// climbs high over the wreck so you can see it from across the city
function ruinFires(cols,mass){
  if(mass<25||!cols.length)return;
  // a fallen tree is just a fallen tree: no fire
  {let veg=0,n=0;for(const c of cols){veg+=(c.logs||0)+(c.lv||0);n+=c.n||0;}if(n&&veg>=n*0.6)return;}
  let sx=0,sz=0;for(const c of cols){sx+=c.x+.5;sz+=c.z+.5;}sx/=cols.length;sz/=cols.length;
  const S=Math.min(4,Math.max(0.5,mass/450)),top=(x,z)=>{const g=supportAt(x,z,H-1);return g===null?G+1:g;};
  // the main plume, thick and climbing far up into the sky, with a couple of smaller ones off the far ends of the heap
  addFire(sx,top(sx,sz),sz,1.4+S*1.4,30+S*12,false,{smoke:S*1.7,rise:2.4+S*0.8});
  const np=mass<200?0:Math.min(3,1+Math.floor(mass/1500));
  for(let i=0;i<np;i++){const c=cols[Math.floor(Math.random()*cols.length)];addFire(c.x+.5,top(c.x+.5,c.z+.5),c.z+.5,1+S*0.6,24+S*8,false,{smoke:S*0.8,rise:1.8+S*0.6});}
  const nf=mass<60?(Math.random()<0.5?1:2):Math.min(18,3+Math.round(mass/140));
  for(let i=0;i<nf;i++){const c=cols[Math.floor(Math.random()*cols.length)],x=c.x+.5+(Math.random()-.5),z=c.z+.5+(Math.random()-.5);
    addFire(x,top(x,z),z,1.2+Math.random()*1.6,18+Math.random()*20,true,{smoke:0.9,rise:1.3});}
}
