// Airplanes: stand on a parked one's wing and body, ride the flying one its whole round trip, wreck them. node planeride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,plotInfo,venues,bigPlainsAt,damageCar,TRAIN_BOXES,get scoreNow(){return score},');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
let keepG=null;const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'&&g!==keepG){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
let B=null;for(let r=0;r<500&&!B;r++)for(let i=-r;i<=r&&!B;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.bigPlainsAt(x,z);if(q&&q.kind==='airport'){B=q;break;}}
if(!B){console.log('no airport');process.exit(0);}
const X0=B.ax*32,Z0=B.az*32;console.log('airport at',B.ax,B.az);
for(let i=0;i<200;i++){A.pos.set(X0+100,70,Z0+70);A.vy=0;step(1);}
const V=[...T.venues.values()].find(v=>v.kind==='airport'&&v.B===B||v.kind==='airport'&&v.B.ax===B.ax&&v.B.az===B.az);if(!V||!V.pl){console.log('no planes',!!V,[...T.venues.values()].map(v=>v.kind).join(','));process.exit(0);}
const drop=(x,y,z)=>{A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(x,y,z);};
// a parked plane: drop on the body, then on a wing, then walk under the wing
{const g=V.pl[1].g;drop(g.position.x,g.position.y+7,g.position.z);step(90);console.log('parked, body:','on plane',!!(A.standCar&&A.standCar.isPlane),'height above its wheels',(A.pos.y-g.position.y).toFixed(2));
 drop(g.position.x+7,g.position.y+5,g.position.z-.6);step(90);console.log('parked, wing:','on plane',!!(A.standCar&&A.standCar.isPlane),'height',(A.pos.y-g.position.y).toFixed(2));
 drop(g.position.x+7,g.position.y+.2,g.position.z+.6);step(30);console.log('under the wing: on plane',!!(A.standCar&&A.standCar.isPlane),'height',(A.pos.y-g.position.y).toFixed(2));}
// the moving one: on board at the gate, for a whole round trip
{const pl=V.pl[0],g=pl.g;V.path=null;step(2);drop(g.position.x,g.position.y+3.9,g.position.z);step(30);
 let t=0,off=0,maxH=0,lastI=-1,seq=[],far=0,turnMax=0,lastH=g.rotation.y,hid=0;while(t<320){const on=!!(A.standCar&&A.standCar.T===pl);if(!on)off++;step(6);t+=.1;maxH=Math.max(maxH,g.position.y-45);if(V.i!==lastI){seq.push(V.i);lastI=V.i;}far=Math.max(far,Math.hypot(g.position.x-X0,g.position.z-Z0));if(!g.visible)hid++;
  if(!on){drop(g.position.x,g.position.y+3.9,g.position.z);}
  const d=Math.atan2(Math.sin(g.rotation.y-lastH),Math.cos(g.rotation.y-lastH));turnMax=Math.max(turnMax,Math.abs(d));lastH=g.rotation.y;if(seq.length>22)break;}
 console.log('round trip',t.toFixed(0)+'s','checks off the plane',off,'of',Math.round(t*10),'highest',maxH.toFixed(0),'furthest from the airport',far.toFixed(0),'hidden',hid,'biggest turn in a tenth of a second',turnMax.toFixed(2),'waypoints',seq.join(','));}
// does anything clip? the flying plane's whole round trip, without a rider, against the buildings and the parked planes
{const pl=V.pl[0],g=pl.g,rects=[];for(let a=0;a<B.w;a++)for(let c=0;c<B.h;c++){const Pq=T.plotInfo(B.ax+a,B.az+c),ox=X0+a*32,oz=Z0+c*32;for(const b of Pq.b)rects.push([ox+b.x0,ox+b.x1,oz+b.z0,oz+b.z1,b.ground+'/'+b.style]);}console.log('airport buildings',rects.length,JSON.stringify(rects.filter(R=>/terminal|hangar/.test(R[4])).slice(0,6).map(R=>[R[0]-X0,R[2]-Z0,R[4]])));
 const pts=(g2)=>{const h=g2.rotation.y,tx=Math.sin(h),tz=Math.cos(h),o=[];for(let a=-9;a<=9;a+=1)o.push([g2.position.x+tx*a,g2.position.z+tz*a]);for(let c=-10;c<=10;c+=1)o.push([g2.position.x+tx*.6+tz*c,g2.position.z+tz*.6-tx*c]);return o;};
 for(const i of [1,2]){const hit={};for(const [x,z] of pts(V.pl[i].g))for(const R of rects)if(x>=R[0]&&x<R[1]&&z>=R[2]&&z<R[3])hit[R[4]]=1;console.log('parked plane',i,'at',(V.pl[i].g.position.x-X0),(V.pl[i].g.position.z-Z0),'inside',JSON.stringify(Object.keys(hit)));}
 A.pos.set(X0+100,90,Z0+70);A.vy=0;V.path=null;step(2);const hits={},seen=new Set();let t2=0,lastI=-1;const P1=pts(V.pl[1].g).concat(pts(V.pl[2].g));
 while(t2<300){A.pos.set(Math.max(X0-300,Math.min(X0+500,g.position.x)),120,g.position.z);A.vy=0;step(3);t2+=.05;if(V.i!==lastI){seen.add(V.i);lastI=V.i;}if(g.position.y>G0+1)continue;
  for(const [x,z] of pts(g)){for(const R of rects)if(x>=R[0]&&x<R[1]&&z>=R[2]&&z<R[3])hits[R[4]]=(hits[R[4]]||0)+1;for(const [a,c] of P1)if(Math.hypot(a-x,c-z)<.6)hits.parked=(hits.parked||0)+1;}if(seen.size>=19&&V.i===0)break;}
 console.log('taxi and runway clips',JSON.stringify(hits),'after',t2.toFixed(0)+'s','waypoints seen',seen.size);}
// a goblin and a car in its way, on the taxiway
{const pl=V.pl[0],g=pl.g;V.path=null;step(2);V.i=2;V.pos={u:112,v:39.5,h:0};V.sp=7;V.hd=Math.PI;A.pos.set(X0+100,90,Z0+70);A.vy=0;step(3);
 const gb=T.goblins.find(q=>!q.civ&&!q.staff&&!q.medic&&!q.ff&&!q.cop)||T.goblins[0],c=T.cars.find(q=>q.alive&&!q.svc&&!q.isTrain)||T.cars[0];
 const put=()=>{const h=g.rotation.y,tx=Math.sin(h),tz=Math.cos(h);return [g.position.x+tx*14,g.position.z+tz*14];};
 keepG=gb;const [gx,gz]=put();gb.state='chase';gb.hp=9999;gb.stun=0;gb.root.visible=true;gb.civ=false;gb.pos.set(gx,g.position.y,gz);gb.vy=0;gb.trainT=0;
 const hp0=gb.hp;let t3=0,ghit=false;while(t3<6&&!ghit){gb.pos.set(gx,g.position.y,gz);gb.state='chase';gb.root.visible=true;step(3);t3+=.05;if(gb.hp<hp0)ghit=true;}
 keepG=null;console.log('goblin in the way: hit',ghit,'damage',hp0-gb.hp,'after',t3.toFixed(1)+'s','thrown up',gb.vy.toFixed(1),'plane speed',V.sp.toFixed(0));
 V.i=3;V.pos={u:140,v:28.5,h:0};V.sp=24;V.hd=Math.PI/2;step(3);
 const [cx,cz]=put();c.alive=true;c.hp=9999;c.trainT=0;c.speed=0;c.pos.set(cx,g.position.y,cz);const hc=c.hp;let t4=0,chit=false;while(t4<4&&!chit){c.pos.set(cx,g.position.y,cz);step(2);t4+=.033;if(c.hp<hc)chit=true;}
 console.log('car in the way: hit',chit,'damage',hc-c.hp,'after',t4.toFixed(1)+'s','plane speed',V.sp.toFixed(0));}
// wrecking: a parked one, by repeated hits, and the flying one in the air
{const pl=V.pl[2],p0=pl.pr[0],s0=T.scoreNow;A.pos.set(X0+100,60,Z0+60);let hits=0;while(!pl.dead&&hits<100){T.damageCar(p0,40);hits++;}console.log('parked wrecked after',hits,'hits of 40, score',T.scoreNow-s0,'alive flag',p0.alive);step(5);console.log('  proxy alive now',p0.alive);}
{const pl=V.pl[0],g=pl.g;V.path=null;step(2);V.i=7;V.pos={u:300,v:28.5,h:60};V.sp=70;step(10);const y0=g.position.y;drop(g.position.x,g.position.y+3.9,g.position.z);step(10);T.damageCar(pl.pr[0],999);let t=0;while(pl.fall&&t<20){step(6);t+=.1;}console.log('shot down at height',(y0-45).toFixed(0),'hit the ground after',t.toFixed(1)+'s','at',(g.position.y-45).toFixed(1),'player on it',!!(A.standCar&&A.standCar.T===pl));
 for(let i=0;i<50;i++)step(6);pl.deadT=121;A.pos.set(X0+5000,120,Z0+5000);step(5);console.log('replaced after 2 minutes out of sight',!pl.dead);}
console.log('done');
`);
process.exit(0);
