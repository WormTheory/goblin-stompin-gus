// Rounds into walls: how often each kind of block breaks (by its toughness, WS_TOUGH: glass every time, brick half).
// Real rounds (fireRound with breaks) fired at a one-block wall of each, a fresh block each shot. node bulletglass.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,get,setRaw,fireRound,GLASS,STAINED,PLANKS,LOG,GRASS,BRICK,CONCRETE,METAL,AIR,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;
for(let i=0;i<60;i++){now+=16.7;T.frame(now);}
const x=Math.floor(A.pos.x)+6,y=Math.floor(A.pos.y)+1,z=Math.floor(A.pos.z);
for(const nm of ['GLASS','STAINED','PLANKS','LOG','GRASS','BRICK','CONCRETE','METAL']){let br=0,hit=0;
  for(let i=0;i<400;i++){T.setRaw(x,y,z,T[nm]);const r=T.fireRound({x:A.pos.x,y:y+0.5,z:z+0.5,at:{x:x+0.5,y:y+0.5,z:z+0.5},dmg:1,breaks:true,cause:'test'});if(r.hit==='wall')hit++;if(T.get(x,y,z)===T.AIR)br++;}
  console.log(nm.padEnd(9),'hit the wall',hit,'of 400, broke',(br/4).toFixed(0)+'%');}
console.log('done');
`);
process.exit(0);
