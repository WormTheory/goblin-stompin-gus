// Jump on to a moving vehicle: Gus should land on it, take no damage, and be carried along. node carride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=500;A.hpMax=500;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){quiet();now+=16.7;T.frame(now);}};
for(let i=0;i<300;i++){A.pos.set(0,60,0);A.vy=0;step(1);}
let done=0;
for(let tries=0;tries<400&&done<6;tries++){
  const c=T.cars.filter(c=>c.alive&&!c.parked&&Math.abs(c.speed)>5&&!c.isTrain&&!c.svc&&Math.hypot(c.pos.x-A.pos.x,c.pos.z-A.pos.z)<120)[0];
  if(!c){step(6);continue;}
  done++;
  // drop on from three blocks above its roof, a little ahead of where it'll be
  const fx=Math.sin(c.heading),fz=Math.cos(c.heading),dir=Math.sign(c.speed)||1;
  A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(c.pos.x+fx*dir*Math.abs(c.speed)*.55,c.pos.y+(c.hy||1.4)+3,c.pos.z+fz*dir*Math.abs(c.speed)*.55);
  const hp0=A.hp;let landed=false,rode=0,maxD=0;
  for(let i=0;i<360;i++){A.vy=A.grounded?0:A.vy;step(1);if(A.standCar===c){landed=true;rode+=1/60;}else if(landed)break;}
  console.log(c.veh,'speed',Math.abs(c.speed).toFixed(0),'landed',landed,'rode',rode.toFixed(1)+'s','damage',hp0-A.hp,'alive',c.alive);
  A.pos.set(A.pos.x,60,A.pos.z);A.vy=0;step(30);
}
`);
process.exit(0);
