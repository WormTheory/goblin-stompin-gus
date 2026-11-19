// ---- structures from the editor's Structures tab (src/assets/sites/, the format in core/assets.js): a site switched on
// there is built in place of every one of its kind and size, block by block as it was edited, turned to face the way
// that one faces, with its own props, people and parked vehicles. With none switched on, nothing here does anything ----
const SITES=new Map();   // (kind: its sites switched on, each with its blocks decoded, A)
const siteC=new Map(),siteI=new Map();   // (siteC: per plot, the site built there or null; siteI: one per place a site's built)
function sitesLoad(){
  SITES.clear();siteC.clear();siteI.clear();
  for(const s of assetSitesOn(ASSETS)){const A=assetSiteDecode(s);if(!A)continue;s.A=A;if(!SITES.has(s.kind))SITES.set(s.kind,[]);SITES.get(s.kind).push(s);}
}
sitesLoad();
// turning: one quarter turn takes x to z and z to -x (a door on side 0, -x, ends up on 2, -z). SITE_CYC is the sides in
// that order; SITE_ROT[k][block] is a block turned k times (ramps and stairs face the other way round, road markings
// running along x run along z)
const SITE_CYC=[0,2,1,3],SITE_ROT=[];
{const one=new Uint8Array(256);for(let i=0;i<256;i++)one[i]=i;const D=[2,3,1,0];   // (a ramp's or a stair's way up: +x, -x, +z, -z, turned)
 for(let i=0;i<12;i++){const d=Math.floor(i/3),k=i%3;one[RAMP0+i]=rampId(D[d],k);}
 for(let i=0;i<36;i++){const t=Math.floor(i/12),d=Math.floor(i%12/3),k=i%3;one[RAMPL0+i]=rampLineId(D[d],k,t);}
 for(let i=0;i<12;i++){const m=Math.floor(i/4),d=i%4;one[STAIR0+i]=stairId(D[d],m);}
 for(const [a,b] of [[LINE,LINEX],[LINE_R,LINEX_R],[CROSS,CROSSX],[LANE,LANEX]]){one[a]=b;one[b]=a;}
 SITE_ROT.push(Uint8Array.from(one.map((v,i)=>i)));let cur=one;
 for(let k=1;k<4;k++){SITE_ROT.push(cur);const nx=new Uint8Array(256);for(let i=0;i<256;i++)nx[i]=one[cur[i]];cur=nx;}}
// which way a place faces: its first building's door, or -1
function siteFace(m){for(const b of plotInfo(m.ax,m.az).b)if(b.door>=0&&b.door<=3)return b.door;return -1;}
// the site built at plot (px,pz), if any: {s (the file), k (quarter turns), key, ax, az, w, h, X0, Z0 (its lot's corner), LX, LZ
// (the lot's size along x and z)}
function siteOf(px,pz){
  if(!SITES.size)return null;const ck=px*131071+pz;
  if(siteC.has(ck))return siteC.get(ck);let I=null;
  for(const [kind,L] of SITES){let m=null;try{m=stMatch(kind,px,pz);}catch(e){}if(!m)continue;
    const ik=kind+':'+m.ax+','+m.az;if(siteI.has(ik)){I=siteI.get(ik);break;}
    const fi=siteFace(m),fits=(s,k)=>k%2?s.w===m.h&&s.h===m.w:s.w===m.w&&s.h===m.h;
    // (each version of this kind that fits this one, turned to face its way if it can be)
    const C=[];for(const s of L){let k0=s.face>=0&&fi>=0?(SITE_CYC.indexOf(fi)-SITE_CYC.indexOf(s.face)+4)%4:0;
      for(const d of [0,1,3,2]){const k=(k0+d)%4;if(fits(s,k)){C.push([s,k]);break;}}}
    if(!C.length)continue;const [s,k]=C[Math.floor(hash2(m.ax*7+3,m.az*11+5)*C.length)%C.length];
    const NX=s.size[0],NZ=s.size[2];
    I={s,k,key:ik,kind,ax:m.ax,az:m.az,w:m.w,h:m.h,X0:m.ax*CELL+PL0,Z0:m.az*CELL+PL0,LX:k%2?NZ:NX,LZ:k%2?NX:NZ,props:null};
    siteI.set(ik,I);break;}
  siteC.set(ck,I);return I;
}
// (is world column (x,z) inside a site's lot: then the plan's own dressing there is left out)
function siteIn(x,z){if(craters.length&&bbGone(x,z))return true;   // (and nothing of the plan's where a big blast has taken everything)
  if(!SITES.size)return false;const I=siteOf(Math.floor(x/CELL),Math.floor(z/CELL));return !!I&&x>=I.X0&&x<I.X0+I.LX&&z>=I.Z0&&z<I.Z0+I.LZ;}
// the site's own block column at lot column (lx,lz): its index into s.A, or -1
function siteCol(I,lx,lz){
  const s=I.s,NX=s.size[0],NZ=s.size[2];let u,v;
  switch(I.k){case 0:u=lx;v=lz;break;case 1:u=lz;v=NZ-1-lx;break;case 2:u=NX-1-lx;v=NZ-1-lz;break;default:u=NX-1-lz;v=lx;}
  return (v*NX+u)*s.size[1];
}
// a point in the site's own frame (blocks from its lot's corner) in the world's, and a heading turned with it
function sitePt(I,u,v){const s=I.s,NX=s.size[0],NZ=s.size[2];let x,z;
  switch(I.k){case 0:x=u;z=v;break;case 1:x=NZ-v;z=u;break;case 2:x=NX-u;z=NZ-v;break;default:x=v;z=NX-u;}
  return [I.X0+x,I.Z0+z];}
const siteYaw=(I,y)=>(y||0)-I.k*Math.PI/2;
// the chunk's blocks inside a site's lot, from its own lowest height up (above its top, air). A building there that's
// fallen stays fallen: above where it gave way, inside its footprint, nothing
function siteStamp(a,cx,cz){
  if(!SITES.size)return;const x0=cx*CS,z0=cz*CS,I=siteOf(Math.floor(x0/CELL),Math.floor(z0/CELL));if(!I)return;
  const s=I.s,A=s.A,Y0=s.y0,NY=s.size[1],R=SITE_ROT[I.k],cut=[];
  for(let px=I.ax;px<I.ax+I.w;px++)for(let pz=I.az;pz<I.az+I.h;pz++){const B=plotInfo(px,pz).b;
    for(let bi=0;bi<B.length;bi++){const c=collapses[px+','+pz+','+bi],b=B[bi];if(c!==undefined)cut.push([px*CELL+b.x0,pz*CELL+b.z0,px*CELL+b.x1,pz*CELL+b.z1,c]);}}
  for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){
    const x=x0+lx,z=z0+lz,u=x-I.X0,v=z-I.Z0;if(u<0||v<0||u>=I.LX||v>=I.LZ)continue;
    const b0=siteCol(I,u,v);let top=H;for(const q of cut)if(x>=q[0]&&x<q[2]&&z>=q[1]&&z<q[3])top=Math.min(top,Math.max(G+1,q[4]));
    for(let y=Math.max(0,Y0);y<H;y++)a[li(lx,y,lz)]=y>=top||y-Y0>=NY?AIR:R[A[b0+y-Y0]];}
}
// ---- its props, drawn with the rest by refreshProps ----
function siteTplProps(I){
  if(I.props)return I.props;
  I.props=(I.s.props||[]).filter(q=>PROPS[q.m]).map((q,i)=>{const [x,z]=sitePt(I,q.p[0],q.p[2]);
    return {prop:true,type:q.m,x,z,y0:q.p[1],yaw:siteYaw(I,q.yaw),tint:q.tint!=null?q.tint:0x8a6a4a,rad:.5,key:'st:'+I.key+':'+i};});
  return I.props;
}
function sitePropsAdd(p,R,got,out){
  const seen=new Set();
  for(let px=Math.floor((p.pos.x-R)/CELL);px<=Math.floor((p.pos.x+R)/CELL);px++)for(let pz=Math.floor((p.pos.z-R)/CELL);pz<=Math.floor((p.pos.z+R)/CELL);pz++){
    const I=siteOf(px,pz);if(!I||seen.has(I))continue;seen.add(I);
    for(const f of siteTplProps(I)){if(out(f,p,R)||got.has(f.key))continue;const fx=Math.floor(f.x),fz=Math.floor(f.z),fy=Math.floor(f.y0);
      if(!chunks.has(ckey(Math.floor(fx/CS),Math.floor(fz/CS)))||get(fx,fy-(f.y0%1?0:1),fz)===AIR||get(fx,Math.ceil(f.y0),fz)!==AIR)continue;
      got.add(f.key);activeProps.push(f);drawProp(f);if(!downFix.has(f.key)&&!falling.has(f.key))propCells.set(propCK(f.x,f.y0,f.z),f);}}
}
// ---- its parked vehicles: in place of the plan's inside its lot (parkSpots0 is the plan's, vehicles/cars.js) ----
function parkSpots(px,pz){
  let L=parkSpots0(px,pz);if(craters.length)L=L.filter(o=>!bbGone(o.x,o.z));if(!SITES.size)return L;const I=siteOf(px,pz);if(!I)return L;
  const out=L.filter(o=>!siteIn(o.x,o.z));
  if(I.ax===px&&I.az===pz)(I.s.cars||[]).forEach((c,i)=>{if(!VEH[c.k])return;const [x,z]=sitePt(I,c.p[0],c.p[2]);out.push({x,z,y:c.p[1],h:siteYaw(I,c.yaw),key:'st:'+I.key+':c'+i,p:1,veh:c.k});});
  return out;
}
// ---- its people: a venue per site that has any, keeping each at its spot while a player's near. Townsfolk (staff,
// civilians) stand at theirs till something sends them running; enemies of the compounds' kinds (FOES) keep their posts
// till roused, as at the compounds; street goblins come for you as soon as they're out ----
function refreshSitePpl(p,want){
  if(!SITES.size)return;const seen=new Set();
  for(let px=Math.floor((p.pos.x-120)/CELL);px<=Math.floor((p.pos.x+120)/CELL);px++)for(let pz=Math.floor((p.pos.z-120)/CELL);pz<=Math.floor((p.pos.z+120)/CELL);pz++){
    if(!tenvShow(px,pz))continue;const I=siteOf(px,pz);if(!I||seen.has(I)||!(I.s.people||[]).length)continue;seen.add(I);
    const key='sp'+I.key;want.add(key);if(venues.has(key))continue;
    const posts=I.s.people.map((q,i)=>{const [x,z]=sitePt(I,q.p[0],q.p[2]);return {x,z,y:q.p[1],h0:siteYaw(I,q.yaw),k:q.k};});
    const cx=I.X0+I.LX/2,cz=I.Z0+I.LZ/2;
    venues.set(key,{kind:'siteppl',key,style:'site',posts,slots:posts.map(()=>null),slain:posts.map(()=>false),X0:I.X0,Z0:I.Z0,cx,cz,roused:false,awayT:0,rouse:I.s.rouse??16});}
}
const SITE_TOWN=new Set(['staff','civilian']);
function sitePplFill(V,i){
  const F=V.posts[i],k=F.k;let g=null;
  if(FOES[k]){g=freeFoe(k);if(!g)return null;foeSpawn(g,k,V,i);}
  else if(SITE_TOWN.has(k)){g=goblins.find(o=>o.civ&&!o.staff&&o.state==='wait');if(!g)return null;
    g.vendor={x:F.x,z:F.z,h:F.h0};g.indoor=true;g.employer=null;g.hp=g.hpMax=3;g.state='chase';g.t=0;g.sink=0;g.hurt=0;g.vy=0;g.kv.set(0,0,0);g.stun=0;g.wt=null;g.idle=0;g.screamCD=0;g.fleeing=false;g.detour=0;
    g.root.visible=true;g.root.rotation.set(0,0,0);g.arm.rotation.x=0;g.armL.rotation.x=0;
    const L=dressGoblin(g);if(k==='staff'){L.acc=0xe8e2d0;if(!L.show.includes('apron'))L.show.push('apron');applyLook(g,L,ES);}
    g.id=makeIdentity(g,L);g.id.occ=k==='staff'?'Staff':g.id.occ;}
  else{g=goblins.find(o=>!o.civ&&!o.special&&!o.cultist&&o.state==='wait');if(!g||!spawnGoblin(g,true))return null;}
  g.pos.set(F.x,F.y,F.z);g.heading=F.h0;return g;
}
function updateSitePpl(V,dt){
  const me=players.find(q=>q.active);let dmin=1e9;if(me)for(const F of V.posts)dmin=Math.min(dmin,Math.hypot(me.pos.x-F.x,me.pos.z-F.z));
  for(let i=0;i<V.slots.length;i++){const g=V.slots[i];if(!g)continue;
    if(g.state==='dead'){V.slain[i]=true;V.slots[i]=null;if(g.homeV===V)g.homeV=null;continue;}
    // (gone home, or a townsperson who's run off: the spot's free again)
    if(g.state==='wait'||FOES[V.posts[i].k]&&g.homeV!==V||SITE_TOWN.has(V.posts[i].k)&&!g.vendor){V.slots[i]=null;}}
  if(V.roused){if(dmin>110){V.awayT+=dt;if(V.awayT>120){V.roused=false;V.slain.fill(false);}}else V.awayT=0;}
  if(me&&playing&&dmin<70)for(let i=0;i<V.posts.length;i++){if(V.slots[i]||V.slain[i])continue;const k=V.posts[i].k;
    if(V.roused&&FOES[k])continue;if(!FOES[k]&&!SITE_TOWN.has(k)&&(dmin<14||calmNow()))continue;   // (a street goblin turns up out of sight, and only to fight)
    const g=sitePplFill(V,i);if(!g)break;V.slots[i]=g;}
  if(!V.roused&&me&&playing&&dmin<V.rouse&&!calmNow()&&V.posts.some(F=>FOES[F.k]))siteRouse(V);
}
