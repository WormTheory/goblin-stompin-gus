// Gus on a real car going up or down a real ramp: does he stay on? node rampride.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){A.hp=9999;quiet();now+=16.7;T.frame(now);}};
const R={down:{n:0,off:0,drop:0},up:{n:0,off:0,drop:0}};let spots=0;
const stand=c=>{A.state='walk';A.mvx=A.mvz=0;A.vy=0;A.grounded=true;A.pos.set(c.pos.x,c.pos.y+(T.VEH?0:0)+2.2,c.pos.z);A.heading=c.heading;};
for(let sx=0;sx<60&&R.down.n+R.up.n<16;sx++){
  const ax=sx%2,d=(sx>>1)*260-3000;A.pos.set(ax?4:d,70,ax?d:4);A.vy=0;A.state='walk';step(40);spots++;
  const before=new Map(T.cars.map(c=>[c,c.pos.y]));step(12);
  const movers=T.cars.filter(c=>c.alive&&!c.parked&&!c.svc&&!c.isTrain&&Math.abs(c.speed)>4&&(Math.abs(c.pos.y-(before.get(c)||c.pos.y))>0.25||c.pos.y>50));
  for(const c of movers.slice(0,2)){let dir=c.pos.y<before.get(c)?'down':c.pos.y>50?'down':'up';const y0=c.pos.y;
    // on to its roof, and settled there
    A.pos.set(c.pos.x,c.pos.y+6,c.pos.z);A.vy=0;A.grounded=false;A.state='walk';A.mvx=A.mvz=0;let got=false;
    for(let i=0;i<90&&!got;i++){A.pos.x=c.pos.x;A.pos.z=c.pos.z;step(1);if(A.standCar===c&&A.grounded)got=true;}
    if(!got)continue;
    let off=false,t=0,mn=c.pos.y,mx=c.pos.y;while(t<30){step(1);t+=1/60;mn=Math.min(mn,c.pos.y);mx=Math.max(mx,c.pos.y);if(A.standCar!==c||Math.hypot(A.pos.x-c.pos.x,A.pos.z-c.pos.z)>3){off=true;break;}}
    const e=R[dir];e.n++;if(off)e.off++;e.drop+=mx-mn;console.log(dir.padEnd(5),c.veh,'speed',Math.abs(c.speed).toFixed(0),'height changed',(mx-mn).toFixed(1),off?'FELL OFF after '+t.toFixed(1)+'s':'stayed on');
    A.pos.set(A.pos.x,70,A.pos.z);A.vy=0;step(10);}
}
console.log('spots',spots,JSON.stringify(R));
`);
process.exit(0);
