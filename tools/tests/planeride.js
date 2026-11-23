// Airports and airfields: where the airports go (by a city, joined to its street), standing on a parked plane, riding the
// one going round its whole round trip, whether anything going round clips the buildings or the parked planes, the
// pilots shown, the checkpoint's security, wrecking and replacing. node planeride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace('class V3{','class V3{transformDirection(m){const e=m.elements,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z;this.y=e[1]*x+e[5]*y+e[9]*z;this.z=e[2]*x+e[6]*y+e[10]*z;return this.normalize()}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}').replace('setColorAt(){this.instanceColor={needsUpdate:false}}','setColorAt(){if(!this.instanceColor)this.instanceColor={needsUpdate:false,array:new Float32Array(this.count*3)}}').replace('class Q{','class Q{setFromUnitVectors(a,b){let r=a.x*b.x+a.y*b.y+a.z*b.z+1,x,y,z;if(r<1e-6){r=0;if(Math.abs(a.x)>Math.abs(a.z)){x=-a.y;y=a.x;z=0}else{x=0;y=-a.z;z=a.y}}else{x=a.y*b.z-a.z*b.y;y=a.z*b.x-a.x*b.z;z=a.x*b.y-a.y*b.x}const l=Math.hypot(x,y,z,r)||1;this.x=x/l;this.y=y/l;this.z=z/l;this.w=r/l;return this}').replace('PlaneGeometry:class{dispose(){}}','PlaneGeometry:class{dispose(){}setAttribute(){}}').replace(/window\.__t=\{/,'window.__t={G0:G,plotInfo,venues,bigPlainsAt,damageCar,settlementAt,jSquare,ASPHALT,LANE,rawGet,planeDim,get scoreNow(){return score},');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'&&!g.homeV){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
const f1=v=>(+v).toFixed(1);
const find=(kind,flip)=>{for(let r=0;r<600;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.bigPlainsAt(x,z);if(q&&q.kind===kind&&(flip===undefined||!!q.flip===flip))return q;}return null;};
const drop=(x,y,z)=>{A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(x,y,z);};
for(const [kind,flip] of [['airport',false],['airport',true],['airfield',undefined]].filter((c,i)=>!process.env.ONLY||process.env.ONLY.includes(i))){
 const B=find(kind,flip);if(!B){console.log('no',kind,flip);continue;}
 const X0=B.ax*32,Z0=B.az*32,W=B.w*32,H=B.h*32,ap=kind==='airport';
 console.log('==== '+kind+(ap?(B.flip?' (city to its north, mirrored)':' (city to its south)'):'')+' at',B.ax,B.az,B.w+'x'+B.h);
 if(ap){// the road in: through the gate and on into the town's street, paved all the way
  const ix=B.ax+B.i,x=ix*32+3,zs=B.flip?[Z0-40,Z0-20,Z0-4,Z0+2,Z0+30,Z0+60]:[Z0+H+40,Z0+H+20,Z0+H+3,Z0+H-3,Z0+H-30,Z0+H-60];
  console.log('  town plots beyond the gate:',[-1,0,1].map(d=>!!T.settlementAt(ix+d,B.flip?B.az-1:B.az+B.h)).join(','),' the junction paved',B.flip?'(inside the fence)':T.jSquare(ix,B.az+B.h));
  console.log('  road surface from town to the drop-off:',zs.map(z=>{const b=T.rawGet(x,G0,z);return b===T.ASPHALT||b===T.LANE?'road':'block '+b;}).join(', '));}
 for(let i=0;i<200;i++){A.pos.set(X0+W/2,70,Z0+H/2);A.vy=0;step(1);}
 const V=[...T.venues.values()].find(v=>v.kind==='airport'&&v.B&&v.B.ax===B.ax&&v.B.az===B.az);if(!V||!V.pl){console.log('  no planes',!!V);continue;}
 const pk=V.pl.filter(pl=>pl.park),fl=V.pl.filter(pl=>pl.fly);
 console.log('  planes',V.pl.length,'(going round',fl.length+', parked',pk.length+')  health',V.pl.map(pl=>pl.hp).join(','),' pilots shown in the ones going round',fl.map(pl=>pl.g.userData.pilots.every(f=>f.visible)).join(','),' in the parked',pk.some(pl=>pl.g.userData.pilots.some(f=>f.visible)));
 if(ap){const G2=[...T.venues.values()].find(v=>v.kind==='guards'&&v.key==='g'+B.ax+','+B.az);console.log('  security posts',G2?G2.posts.length:0,' on duty',G2?G2.slots.filter(Boolean).length:0,' foe',G2&&G2.foe,' posts inside the terminal',G2?G2.posts.filter(F=>{const z=F.z-Z0;return B.flip?z>256-124&&z<256-98:z>98&&z<124;}).length:0);}
 // the buildings, to check against
 const rects=[];for(let a=0;a<B.w;a++)for(let c=0;c<B.h;c++){const Pq=T.plotInfo(B.ax+a,B.az+c),ox=X0+a*32,oz=Z0+c*32;for(const b of Pq.b)rects.push([ox+b.x0,ox+b.x1,oz+b.z0,oz+b.z1,b.ground+'/'+b.style]);}
 console.log('  buildings',rects.length,' kinds',[...new Set(rects.map(R=>R[4]))].join(' '));
 const pts=pl=>{const g2=pl.g,Q=T.planeDim(pl),h=g2.rotation.y,tx=Math.sin(h),tz=Math.cos(h),o=[];for(let a=-Q.hz;a<=Q.hz;a+=0.5)o.push([g2.position.x+tx*a,g2.position.z+tz*a]);for(let c=-Q.wx;c<=Q.wx;c+=0.5)o.push([g2.position.x+tx*Q.wo+tz*c,g2.position.z+tz*Q.wo-tx*c]);return o;};
 for(const pl of pk){const hit={};for(const [x,z] of pts(pl))for(const R of rects)if(x>=R[0]&&x<R[1]&&z>=R[2]&&z<R[3])hit[R[4]]=1;console.log('  parked at',f1(pl.g.position.x-X0),f1(pl.g.position.z-Z0),'facing',f1(pl.g.rotation.y),' inside',JSON.stringify(Object.keys(hit)));}
 // a parked plane: drop on the body, then on a wing
 {const pl=pk[0],g=pl.g,Q=T.planeDim(pl);drop(g.position.x,g.position.y+Q.hy+3,g.position.z);step(90);console.log('  health',V.pl.map(pl=>pl.hp).join(','));console.log('  parked, body: on plane',!!(A.standCar&&A.standCar.isPlane),' height above its wheels',f1(A.pos.y-g.position.y));
  drop(g.position.x+Q.wx*0.8,g.position.y+Q.wy+3,g.position.z+Math.cos(g.rotation.y)*Q.wo);step(90);console.log('  parked, wing: on plane',!!(A.standCar&&A.standCar.isPlane),' height',f1(A.pos.y-g.position.y));}
 // the one going round: its whole round trip without a rider, watched from above it, for clipping and how it goes
 {A.standCar=null;const pl=fl[0],g=pl.g,S=pl.fly,L=S.path.length;S.i=0;S.t=0;S.sp=0;S.pos={u:S.path[1][0],v:S.path[1][1],h:0};
  const hits={},seen=new Set(),sq=[];let t=0,maxH=0,hid=0,far=0,pil=0,mv=0,out=0,lastI=-1,laps=0;const P1=[].concat(...pk.map(pts));
  while(t<900){A.pos.set(Math.max(X0-300,Math.min(X0+W+300,g.position.x)),G0+260,g.position.z);A.vy=0;step(3);t+=.05;
   if(S.i!==lastI){if(S.i===0&&lastI>0)laps++;seen.add(S.i);lastI=S.i;sq.push(S.i);}if(laps)break;
   maxH=Math.max(maxH,g.position.y-G0-1);if(!g.visible)hid++;far=Math.max(far,Math.hypot(g.position.x-X0-W/2,g.position.z-Z0-H/2));
   if(g.visible&&S.path[S.i][0]!=='wait'){mv++;if(g.userData.pilots.every(f=>f.visible))pil++;}
   if(g.position.y>G0+1.5||!g.visible)continue;const u=g.position.x-X0,v=g.position.z-Z0;if(u<0||u>W||v<0||v>H)out++;
   for(const [x,z] of pts(pl)){for(const R of rects)if(x>=R[0]&&x<R[1]&&z>=R[2]&&z<R[3])hits[R[4]]=(hits[R[4]]||0)+1;for(const [a,c] of P1)if(Math.hypot(a-x,c-z)<.6)hits.parked=(hits.parked||0)+1;}}
  console.log('  round trip',f1(t)+'s, waypoints',seen.size,'of',L,' highest',f1(maxH),' furthest',f1(far),' hidden',f1(hid*.05)+'s',' pilot shown',pil+'/'+mv,' on the ground off the site',out,' clips',JSON.stringify(hits),' order',sq.join(','),' health',V.pl.map(pl=>pl.hp).join(','));}
 // riding it: on board at its stand, the whole way round
 {const pl=fl[0],g=pl.g,S=pl.fly,Q=T.planeDim(pl);S.i=0;S.t=0;S.sp=0;S.pos={u:S.path[1][0],v:S.path[1][1],h:0};step(2);drop(g.position.x,g.position.y+Q.hy+1.6,g.position.z);step(30);
  let t=0,off=0,n=0,seq=0,lastI=S.i;while(t<900){const on=!!(A.standCar&&A.standCar.T===pl);n++;if(!on){off++;drop(g.position.x,g.position.y+Q.hy+1.6,g.position.z);}step(6);t+=.1;if(S.i!==lastI){seq++;if(S.i===0)break;lastI=S.i;}}
  console.log('  ridden round:',f1(t)+'s, checks off the plane',off,'of',n,' waypoints',seq,' health',V.pl.map(pl=>pl.hp).join(','));}
 // wrecking: a parked one, and it's replaced once out of sight a while
 {console.log('  health now',V.pl.map(pl=>pl.dead?'dead':pl.hp).join(','));const pl=pk.find(q=>!q.dead)||pk[0],p0=pl.pr[0],s0=T.scoreNow;A.pos.set(pl.g.position.x+30,G0+40,pl.g.position.z+30);let hits=0;while(!pl.dead&&hits<100){T.damageCar(p0,40);hits++;}
  console.log('  parked one wrecked after',hits,'hits of 40, score',T.scoreNow-s0);for(let i=0;i<50;i++)step(6);pl.deadT=121;A.pos.set(X0+5000,G0+120,Z0+5000);step(5);console.log('  replaced after 2 minutes out of sight',!pl.dead,' health',pl.hp);}
}
console.log('done');
`);
process.exit(0);
