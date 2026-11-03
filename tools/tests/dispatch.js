// Can the emergency services still get out? For fire engines, police cars and ambulances in turn: find a station, check
// its way out is clear of blocks, send a vehicle to a spot a few blocks along the streets, and see it arrive and go home.
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={pickStation,svcStart,SVC,stationDef,stnState,setPlaying:v=>{playing=v},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=1e6;
const step=k=>{for(let i=0;i<k;i++){A.hp=1e6;A.vy=0;for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=16.7;T.frame(now);}};
const findAll=(kind,want)=>{const out=[];for(let r=0;r<130&&out.length<want;r++)for(let i=-r;i<=r&&out.length<want;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const D=T.stationDef(x,z);if(D&&D.kind===kind&&!out.includes(D))out.push(D);}return out;};
for(const kind of ['fire','police','amb'])for(const D of findAll(kind,4)){
  const y=D.bays[0];
  // the way out: every block from the bay to where it joins the aisle or the street, and the bay itself, at driving height
  let blocked=0;for(let t=0;t<=1;t+=.1)for(const up of [1,2])if(T.get(Math.floor(y.x+(y.ex-y.x)*t),44+up,Math.floor(y.z+(y.ez-y.z)*t)))blocked++;
  // stand nearby so the bays fill, then call it out
  const X=D.node.x,Z=D.node.z;for(let i=0;i<120;i++){A.pos.set(X+6,60,Z+6);step(1);}
  const P=T.pickStation(kind,X,Z);if(!P){console.log(kind,D.key,'no vehicle at home','blocked',blocked);continue;}
  const c=T.stnState(P.D).slots[P.k].car||T.SVC.find(o=>!o.alive&&o.svcPool===kind);
  const tx=X+64,tz=Z,ok=T.svcStart(c,kind,P,tx,tz);if(!ok){console.log(kind,D.key,'no route','blocked',blocked);continue;}
  const x0=c.pos.x,z0=c.pos.z;let far=0,t=0,left=0,states=[c.svc.st];
  while(t<70){A.pos.set(c.pos.x+6,60,c.pos.z+6);step(6);t+=.1;if(!c.svc)break;const d=Math.hypot(c.pos.x-x0,c.pos.z-z0);if(d>far)far=d;if(!left&&d>6)left=t;const st=c.svc.st;if(st!==states[states.length-1])states.push(st);if(st==='parked')break;}
  console.log(kind,D.key,'blocked',blocked,'out in',left?left.toFixed(1)+'s':'NEVER','got',far.toFixed(0),'away',states.join('>'),'hp',c.hp);
}
`);
process.exit(0);
