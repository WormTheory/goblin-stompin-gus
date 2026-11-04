// Boats: every kind stood on, ridden, hit and sunk; swimming up on to one; what's moored on the coast; routes stay on open water. node boatride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,venues,damageCar,carsNear,TRAIN_BOXES,BOATS,boatVenue,boatLane,boatAt,lanePt,mooredBoats,plotType,seaPlot,oceanDepth,coastType,MOORS,CS,get scoreNow(){return score},get playTime(){return playTime},inpOf:()=>0,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
// open water: a plot well out, with sea all round
let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-4;i<=4&&ok;i++)for(let j=-4;j<=4&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<7)ok=false;if(ok)SP=[x,z];}
if(!SP){console.log('no open sea');process.exit(0);}
const X=SP[0]*32+16,Z=SP[1]*32+16;console.log('open sea at plot',SP.join(','));
const hover=()=>{A.pos.set(X+3000,G0+40,Z+3000);A.vy=0;};
const drop=(x,y,z)=>{A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(x,y,z);A.peakY=y;};
for(let i=0;i<120;i++){A.pos.set(X,G0+30,Z);A.vy=0;step(1);}
// (the game drops whatever isn't on its own list of boats near you: leave these test ones be)
{const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('test')?false:del(k);T.dropTest=del;}
const want=new Set(),kinds=Object.keys(T.BOATS);
for(const k of kinds){
  const key='test'+k,lane={ax:'x',cx:X,cz:Z,R:Math.max(14,T.BOATS[k].L),len:30};
  T.boatVenue(key,k,{x:X,z:Z,yaw:0,lane:null},want);let V=T.venues.get(key);
  const g=V.boat,b=V.bo,K=b.K;A.pos.set(X,G0+30,Z);step(3);
  // stood on, moored
  drop(X,G0+K.fb+3,Z-.2);step(120);const on=!!(A.standCar&&A.standCar.T===b),h=(A.pos.y-g.position.y).toFixed(2);
  // the bob: does the rider stay with it?
  let off=0;for(let i=0;i<60;i++){step(5);if(!(A.standCar&&A.standCar.T===b))off++;}
  // under way, round its route
  V.lane=lane;V.s=0;V.dir=1;const P=4*lane.len+2*Math.PI*lane.R,trip=Math.min(40,P/K.sp);let rideOff=0,rt=0;const b0=A.standCar;
  step(2);{const hi=b.bx.reduce((m,q)=>Math.max(m,q.top),0);drop(g.position.x,g.position.y+hi+1,g.position.z);}step(30);while(rt<trip){step(6);rt+=.1;if(!(A.standCar&&A.standCar.T===b))rideOff++;}
  // hits, by ordinary damage: count them, the score, whether the rider's let go
  const s0=T.scoreNow;let hits=0;while(!b.dead&&hits<500){T.damageCar(b.bx[0].pr,20);hits++;}
  const sc=T.scoreNow-s0;step(10);const still=!!(A.standCar&&A.standCar.T===b);
  // the sinking
  const yd=g.position.y;let t=0;while(g.visible&&t<40){A.pos.set(X,G0+30,Z);A.vy=0;step(6);t+=.1;}
  console.log(k.padEnd(7),'stood on',on,'at',h,'bobbing off',off+'/60','riding off',rideOff+'/'+Math.round(trip*10),'sunk by',hits,'x20, score',sc,'rider let go',!still,'sank in',t.toFixed(1)+'s','to',(g.position.y-G0).toFixed(1));
  // gone a while, then replaced out of sight
  b.deadT=121;A.pos.set(X+5000,G0+30,Z+5000);A.vy=0;step(3);const back=!b.dead;A.pos.set(X,G0+30,Z);A.vy=0;step(2);if(!back)console.log('  NOT replaced');
  T.dropTest(key);
}
// a hit from a real attack's reach
{T.boatVenue('testhit','fish',{x:X,z:Z,yaw:0},want);A.pos.set(X,G0+30,Z);A.vy=0;step(3);const V=T.venues.get('testhit'),near=T.carsNear(X+1,Z,3,G0+2);console.log('attack area finds the boat',near.some(c=>c.T===V.bo),'above it',T.carsNear(X,Z,3,G0+15).length);T.dropTest('testhit');}
// swimming up on to a big ship
{const key='testswim';T.boatVenue(key,'cargo',{x:X,z:Z,yaw:0},want);const V=T.venues.get(key),g=V.boat,top=g.position.y+V.bo.K.fb;
 const tryAt=(ox,oz,name)=>{A.state='walk';A.mvx=A.mvz=0;A.vy=0;A.grounded=false;A.pos.set(X+ox,G0-.2,Z+oz);step(10);const wet=A.wet;A.wet=true;A.grounded=false;A.vy=0;const y0=A.pos.y;inp0();let up=0;for(let i=0;i<120;i++){step(1);up=Math.max(up,A.pos.y);if(A.standCar&&A.standCar.T===V.bo)break;}console.log('swim '+name+': wet',wet,'rose',(up-y0).toFixed(1),'deck',(top-y0).toFixed(1),'aboard',!!(A.standCar&&A.standCar.T===V.bo));};
 const inp0=()=>{T.keys.add('Space');now+=16.7;T.frame(now);T.keys.delete('Space');};
 tryAt(7.5,-5,'beside the hull');tryAt(-7.5,5,'other side');T.dropTest(key);}
// routes never leave open water
{let n=0,bad=0,by={};for(let x=-400;x<=400;x++)for(let z=-400;z<=400;z++){const k=T.boatAt(x,z);if(!k||T.plotType(x,z)!=='sea')continue;const l=T.boatLane(x,z,k);by[k+(l?'':' no room')]=(by[k+(l?'':' no room')]||0)+1;if(!l)continue;n++;const P=4*l.len+2*Math.PI*l.R;for(let s=0;s<P;s+=4){const q=T.lanePt(l,s);if(T.plotType(Math.floor(q.x/32),Math.floor(q.z/32))!=='sea'){bad++;break;}}}
 console.log('routes',n,'leaving open water',bad,JSON.stringify(by));}
// what's moored, by type of plot and by kind of boat
{const by={};for(let x=-300;x<=300;x++)for(let z=-300;z<=300;z++){if(!T.seaPlot(x,z)||!T.MOORS.has(T.plotType(x,z)))continue;const t=T.plotType(x,z),P=T.plotInfo(x,z),L=T.mooredBoats(P,x,z);if(t==='harbor'&&P.fish)by['fishing village plots']=(by['fishing village plots']||0)+1;by[t+' plots']=(by[t+' plots']||0)+1;for(const B of L){const q=t+(t==='harbor'&&P.fish?' (village)':'')+': '+B.k+(B.ground?' on land':B.dry?' dry dock':'');by[q]=(by[q]||0)+1;}}
 Object.entries(by).sort().forEach(([k,v])=>console.log(String(v).padStart(6),k));}
console.log('done');
`);
process.exit(0);
