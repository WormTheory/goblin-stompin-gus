// Vehicles crashing: ordinary traffic runs goblins down (not just the police), and two big vehicles (boats here) that meet
// both take a knock, once per meeting rather than every frame. node vcrash.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,TRAIN_BOXES,BOATS,boatVenue,oceanDepth,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=20;
let keep=null;const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'&&g!==keep){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=20;quiet();now+=16.7;T.frame(now);}};
for(let i=0;i<300;i++){A.pos.set(0,70,0);A.vy=0;step(1);}
// a goblin stood in the road ahead of ordinary traffic
{let done=0,hits=0,tries=0;while(done<5&&tries<400){tries++;
  const c=T.cars.find(c=>c.alive&&!c.parked&&!c.isTrain&&!c.svc&&!c.hunter&&Math.abs(c.speed)>8&&Math.hypot(c.pos.x-A.pos.x,c.pos.z-A.pos.z)<120);if(!c){step(10);continue;}
  const g=T.goblins.find(q=>!q.civ&&!q.staff&&!q.medic&&!q.ff&&!q.cop)||T.goblins[0];g.civ=false;keep=g;const fx=Math.sin(c.heading),fz=Math.cos(c.heading),dir=Math.sign(c.speed);
  g.state='chase';g.hp=500;g.hpMax=500;g.root.visible=true;g.stun=0;g.trainT=0;g.vy=0;g.pos.set(c.pos.x+fx*dir*(c.hz+2),c.pos.y,c.pos.z+fz*dir*(c.hz+2));
  const hp0=g.hp,sp0=Math.abs(c.speed);let t=0;const ax=g.pos.x,az=g.pos.z;while(t<60&&g.hp===hp0){g.state='chase';g.root.visible=true;A.pos.set(ax+8,c.pos.y+25,az);A.vy=0;step(1);t++;}
  done++;if(g.hp<hp0)hits++;console.log(c.veh.padEnd(7),'at',sp0.toFixed(0),'goblin hit',g.hp<hp0,'took',hp0-g.hp,'thrown up',(g.vy||0).toFixed(1),'car now at',Math.abs(c.speed).toFixed(1));
  keep=null;step(30);}
 console.log('traffic ran down',hits,'of',done);}
// two boats steered into each other
{let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-4;i<=4&&ok;i++)for(let j=-4;j<=4&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<7)ok=false;if(ok)SP=[x,z];}
 if(!SP)console.log('no open sea');else{const X=SP[0]*32+16,Z=SP[1]*32+16;for(let i=0;i<120;i++){A.pos.set(X,G0+30,Z);A.vy=0;step(1);}
  {const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('test')?false:del(k);}
  const want=new Set();T.boatVenue('testa','tug',{x:X,z:Z,yaw:0,lane:null},want);T.boatVenue('testb','tug',{x:X,z:Z+30,yaw:0,lane:null},want);
  const Va=T.venues.get('testa'),Vb=T.venues.get('testb');A.pos.set(X+30,G0+30,Z);A.vy=0;step(3);
  // (their lanes overlap: a goes round one, b round the same one, the other way)
  const lane={ax:'x',cx:X,cz:Z+15,R:15,len:0};Va.lane=lane;Va.s=0;Va.dir=1;Vb.lane=lane;Vb.s=Math.PI*15;Vb.dir=-1;
  const hp=v=>v.bo.hp;const a0=hp(Va),b0=hp(Vb);let hits=0,last=a0,t=0;
  while(t<20&&!Va.bo.dead&&!Vb.bo.dead){A.pos.set(X+30,G0+30,Z);A.vy=0;step(6);t+=.1;if(hp(Va)<last){hits++;last=hp(Va);}}
  console.log('two tugs on a collision course: crashes',hits,'in',t.toFixed(1)+'s, damage',a0-hp(Va),b0-hp(Vb),'sunk',!!Va.bo.dead,!!Vb.bo.dead);}}
`);
process.exit(0);
