// Do goblins walk round furniture? In a few kinds of shop, a goblin chases a hippo across the room, and we count how
// often it stands in the same cell as an upright prop. Then Gus walks through the room and knocks props over.
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,process.env.OLD?'window.__t={':'window.__t={propCells,propCK,activeProps,refreshProps,propDown:f=>downFix.has(f.key),furnProps,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;
const CELL=32;A.hp=999;
const gob=T.goblins.find(g=>!g.civ&&!g.staff&&!g.medic&&!g.ff&&!g.cop)||T.goblins[0];
for(const c of T.cars){c.alive=false;c.respawnT=1e9;c.g.visible=false;}
const step=k=>{for(let i=0;i<k;i++){A.hp=999;A.vy=0;for(const g of T.goblins)if(g!==gob&&g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=16.7;T.frame(now);}};
for(const k of ['food','market','drug','school','police','ikea']){
  const F=T.stFind(k,0,0);if(!F){console.log(k,'none found');continue;}
  const P=T.plotInfo(F.ax,F.az),b=P.b.slice().sort((p,q)=>(q.x1-q.x0)*(q.z1-q.z0)-(p.x1-p.x0)*(p.z1-p.z0))[0],X0=F.ax*CELL,Z0=F.az*CELL,y=45;
  const s0={x:X0+b.x0+3.5,z:Z0+b.z0+3.5},s1={x:X0+b.x1-3.5,z:Z0+b.z1-3.5};
  for(let i=0;i<60;i++){A.pos.set(s1.x,y,s1.z);step(1);}
  gob.state='chase';gob.hp=99;gob.stun=0;gob.indoor=true;gob.civ=false;gob.root.visible=true;gob.pos.set(s0.x,y,s0.z);gob.vy=0;gob.t=0;gob.detour=0;gob.trip=null;
  let t=0,ok=false,inside=0,frames=0;
  while(t<40&&!ok){A.pos.set(s1.x,y,s1.z);step(6);t+=0.1;frames++;
    if(T.propCells&&T.propCells.has(T.propCK(gob.pos.x,gob.pos.y+.2,gob.pos.z)))inside++;
    if(Math.hypot(gob.pos.x-s1.x,gob.pos.z-s1.z)<2.5)ok=true;}
  const props=T.activeProps?T.activeProps.length:0;
  // Gus walks the length of the room
  gob.state='wait';gob.root.visible=false;const down=()=>T.activeProps?T.activeProps.filter(T.propDown).length:0;
  const W=60;for(let i=0;i<=W;i++){A.pos.set(s0.x+(s1.x-s0.x)*i/W,y,s0.z+(s1.z-s0.z)*i/W);A.heading=Math.atan2(s1.x-s0.x,s1.z-s0.z);step(2);}
  step(60);const knocked=down();
  console.log(k,'size',b.x1-b.x0,'x',b.z1-b.z0,'props near',props,ok?'goblin reached in '+t.toFixed(0)+'s':'goblin FAILED at '+gob.pos.x.toFixed(1)+','+gob.pos.z.toFixed(1),'checks inside a prop',inside,'of',frames,'knocked by Gus',knocked);
}
`);
process.exit(0);
