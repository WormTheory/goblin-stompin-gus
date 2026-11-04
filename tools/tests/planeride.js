// Airplanes: stand on a parked one's wing and body, ride the flying one its whole round trip, wreck them. node planeride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={venues,bigPlainsAt,damageCar,TRAIN_BOXES,get scoreNow(){return score},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
let B=null;for(let r=0;r<500&&!B;r++)for(let i=-r;i<=r&&!B;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.bigPlainsAt(x,z);if(q&&q.kind==='airport'){B=q;break;}}
if(!B){console.log('no airport');process.exit(0);}
const X0=B.ax*32,Z0=B.az*32;console.log('airport at',B.ax,B.az);
for(let i=0;i<200;i++){A.pos.set(X0+100,70,Z0+70);A.vy=0;step(1);}
const V=[...T.venues.values()].find(v=>v.kind==='airport'&&v.B===B);if(!V||!V.pl){console.log('no planes',!!V);process.exit(0);}
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
// wrecking: a parked one, by repeated hits, and the flying one in the air
{const pl=V.pl[2],p0=pl.pr[0],s0=T.scoreNow;A.pos.set(X0+100,60,Z0+60);let hits=0;while(!pl.dead&&hits<100){T.damageCar(p0,40);hits++;}console.log('parked wrecked after',hits,'hits of 40, score',T.scoreNow-s0,'alive flag',p0.alive);step(5);console.log('  proxy alive now',p0.alive);}
{const pl=V.pl[0],g=pl.g;V.path=null;step(2);V.i=7;V.pos={u:300,v:28.5,h:60};V.sp=70;step(10);const y0=g.position.y;drop(g.position.x,g.position.y+3.9,g.position.z);step(10);T.damageCar(pl.pr[0],999);let t=0;while(pl.fall&&t<20){step(6);t+=.1;}console.log('shot down at height',(y0-45).toFixed(0),'hit the ground after',t.toFixed(1)+'s','at',(g.position.y-45).toFixed(1),'player on it',!!(A.standCar&&A.standCar.T===pl));
 for(let i=0;i<50;i++)step(6);pl.deadT=121;A.pos.set(X0+5000,120,Z0+5000);step(5);console.log('replaced after 2 minutes out of sight',!pl.dead);}
console.log('done');
`);
process.exit(0);
