// Trains: ride one round its bends without falling off; it reverses without the cars jumping; a hit launches you; it can be wrecked.
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={TRAINS,railPt,damageCar,TRAIN_BOXES,setScore:0,get scoreNow(){return score},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
for(let i=0;i<120;i++){A.pos.set(0,70,0);A.vy=0;step(1);}
let tries=0;for(let r=0;r<40&&!T.TRAINS.size;r++){A.pos.set(r*400,70,r*300);A.vy=0;step(30);}
const best=[...T.TRAINS.values()].map(q=>{const C2=q.C;let bends=0;for(let i=3;i<C2.L-3;i+=1){const a=T.railPt(C2,i-2),b=T.railPt(C2,i+2);if(a.tx*b.tx+a.tz*b.tz<.995)bends++;}return{q,bends};}).sort((a,c)=>c.bends-a.bends)[0];
if(!best){console.log('no train');process.exit(0);}
const TQ=best.q,CH=TQ.C;console.log('track length',CH.L,'cells on a bend',best.bends,'stops',CH.stops.length);
const on=()=>{const c=TQ.cars[1],h=c.rotation.y,tx=Math.sin(h),tz=Math.cos(h);/* near one corner of the roof, where a bend swings you furthest */A.pos.set(c.position.x+tx*3.2+tz*.5,c.position.y+3.6,c.position.z+tz*3.2-tx*.5);A.vy=0;A.grounded=true;A.state='walk';};
A.pos.set(T.railPt(CH,TQ.s).x,70,T.railPt(CH,TQ.s).z);step(60);
if(!TQ.cars){console.log('no cars');process.exit(0);}
TQ.wait=0;on();step(5);
let t=0,off=0,cells=0,maxG=0,lastH=null,turned=0,flip=0,prev=TQ.cars.map(g=>[g.position.x,g.position.z]),rev=0,maxJump=0,dir0=TQ.dir;
while(t<400){step(6);t+=.1;TQ.wait=Math.min(TQ.wait,.3);
  const J=Math.max(...TQ.cars.map((g,i)=>Math.hypot(g.position.x-prev[i][0],g.position.z-prev[i][1])));if(J>maxJump)maxJump=J;prev=TQ.cars.map(g=>[g.position.x,g.position.z]);
  if(TQ.dir!==dir0){rev++;dir0=TQ.dir;}
  const h=TQ.cars[1].rotation.y;if(lastH!==null){const d=Math.atan2(Math.sin(h-lastH),Math.cos(h-lastH));turned+=Math.abs(d);if(Math.abs(d)>flip)flip=Math.abs(d);}lastH=h;
  const top=topOf();if(A.pos.y<top-1){off++;console.log(' fell at s',TQ.s.toFixed(0),'v',TQ.v.toFixed(1),'t',t.toFixed(1),'y',A.pos.y.toFixed(1),'hp',A.hp,'state',A.state,'trainT',A.trainT);on();}
  if(rev>=2&&turned>2)break;}
function topOf(){return TQ.cars[0].position.y+3.5;}
console.log('rode for',t.toFixed(0)+'s','turned through',turned.toFixed(2),'rad, biggest turn in a tenth of a second',flip.toFixed(3),'reversals',rev,'fell off',off,'biggest car jump in a tenth of a second',maxJump.toFixed(2),'(top speed 2.4)');
// hit by it: stand on the line ahead of it at speed
TQ.wait=0;TQ.v=24;
const place=()=>{const ahead=T.railPt(CH,Math.max(3,Math.min(CH.L-3,TQ.s+TQ.dir*14)));return ahead;};
{A.state='walk';const a=place();A.pos.set(a.x,45.2,a.z);A.vy=0;A.grounded=true;A.trainT=0;let hit=false,top=0,far=0,x0=0,z0=0;for(let i=0;i<300;i++){step(1);if(!hit&&A.trainT>0){hit=true;x0=A.pos.x;z0=A.pos.z;}if(hit){top=Math.max(top,A.pos.y-45);far=Math.max(far,Math.hypot(A.pos.x-x0,A.pos.z-z0));}}
 console.log('s',TQ.s.toFixed(0),'dir',TQ.dir,'v',TQ.v.toFixed(0),'stand',!!A.standCar);console.log('Gus hit:',hit,'launched',top.toFixed(1),'high and',far.toFixed(1),'away');}
{TQ.v=24;TQ.wait=0;const g=T.goblins[0],a=place();g.state='chase';g.hp=500;g.hpMax=500;g.root.visible=true;g.pos.set(a.x,45,a.z);g.vy=0;g.stun=0;g.trainT=0;A.pos.set(a.x+40,60,a.z+40);let hit=false,top=0,far=0,x0=0,z0=0;for(let i=0;i<300;i++){A.hp=9999;now+=16.7;T.frame(now);for(const o of T.goblins)if(o!==g&&o.state==='chase'){o.state='wait';o.t=-1e9;}if(!hit&&g.trainT>0){hit=true;x0=g.pos.x;z0=g.pos.z;}if(hit){top=Math.max(top,g.pos.y-45);far=Math.max(far,Math.hypot(g.pos.x-x0,g.pos.z-z0));}}
 console.log('goblin hit:',hit,'launched',top.toFixed(1),'high and',far.toFixed(1),'away','state',g.state);}
// wrecked: one car at a time
{A.pos.set(TQ.cars[0].position.x+30,60,TQ.cars[0].position.z);step(30);const pr=TQ.cars.map(g=>g.userData.proxy);const v0=TQ.v;for(const c of pr)if(c){let n=0;while(c.alive&&n<50){T.damageCar(c,40);n++;step(2);}console.log('car',c.i,'took',n,'hits of 40, train stopped',!!TQ.halted,'all gone',!!TQ.dead);}step(120);console.log('speed now',TQ.v.toFixed(1),'solid wreck boxes',T.TRAIN_BOXES.length);}
`);
process.exit(0);
