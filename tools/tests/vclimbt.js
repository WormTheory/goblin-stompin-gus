// Spider-climbing vehicles: grab the side of a train, a car, a boat (and its container stacks) and a plane, hang on while
// it moves, climb up on to its roof, tip back over its edge on to its side, let go. node vclimbt.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,TRAINS,railPt,TRAIN_BOXES,BOATS,boatVenue,oceanDepth,vBox,ABIL,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;T.ABIL.climb=true;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
let face=false;const step=k=>{for(let i=0;i<k;i++){if(A.state!=="dead")A.hp=20;quiet();if(face)A.cam.yaw=A.heading+Math.PI;now+=16.7;T.frame(now);}};
const hold=(...k)=>{for(const q of k)T.keys.add(q);},free=(...k)=>{for(const q of k)T.keys.delete(q);};
// where he is on the box, in its own frame (along, across, up from its bottom)
const rel=v=>{const b=T.vBox(v);if(!b)return null;const dx=A.pos.x-b.x,dz=A.pos.z-b.z;return{al:dx*b.ax+dz*b.az,ac:-dx*b.az+dz*b.ax,y:A.pos.y-b.y0,b};};
const fmt=r=>r?'along '+r.al.toFixed(2)+' across '+r.ac.toFixed(2)+' up '+r.y.toFixed(2):'none';
// stand him beside box v (out across it by 'out' past its side), facing it
const beside=(v,out,al)=>{const b=T.vBox(v),s=1;A.state='walk';A.vcl=null;A.mvx=A.mvz=0;A.vy=0;A.grounded=true;A.standCar=null;A.rideC=null;
  A.pos.set(b.x+(-b.az)*(b.hc+out)*s+b.ax*(al||0),b.y0+.05,b.z+b.ax*(b.hc+out)*s+b.az*(al||0));A.heading=Math.atan2(b.az*s,-b.ax*s);A.cam.yaw=A.heading+Math.PI;};
// hold climb and forward into it, up it, over the top
function climbIt(name,v,out,al,ride,setV){
  beside(v,out,al);face=true;hold('KeyC','KeyW');let t=0;while(!(A.state==='climb'&&A.vcl)&&t<60){step(1);t++;}
  const got=A.state==='climb'&&!!A.vcl&&A.vcl.v===v;free('KeyW');step(2);
  const r0=rel(v);if(setV)setV();let maxDrift=0,lost=0,t1=0;
  // hanging on while it goes
  while(t1<ride){step(6);t1+=.1;const r=rel(v);if(!(A.state==='climb'&&A.vcl)){lost++;break;}maxDrift=Math.max(maxDrift,Math.hypot(r.al-r0.al,r.ac-r0.ac,r.y-r0.y));}
  const b=T.vBox(v),moved=b&&r0?Math.hypot(b.x-r0.b.x,b.z-r0.b.z):0;
  // up and over on to the roof
  hold('KeyW');let up=0;while(A.state!=='walk'&&up<400){step(1);up++;}free('KeyW');step(20);
  const top=A.standCar&&(A.standCar===v||A.standCar.T&&A.standCar.T===v.T);
  console.log(name.padEnd(9),'grabbed',got,'held for',t1.toFixed(1)+'s','while it went',moved.toFixed(1),'drift',maxDrift.toFixed(3),'let go',lost,'| up on top',!!top,'after',(up/60).toFixed(1)+'s','height',(A.pos.y-(b?b.y0:0)).toFixed(2));
  return top;
}
// from on top, with climb held, walk off its side: over the edge and on to the side, head down; then let go
function overEdge(name,v){
  const b=T.vBox(v);if(!b)return;const r=rel(v);
  A.heading=Math.atan2(-b.az,b.ax);A.cam.yaw=A.heading+Math.PI;face=true;hold('KeyC','KeyW');let t=0;while(!(A.state==='climb'&&A.vcl)&&t<240){step(1);t++;}free('KeyW');
  const ok=A.state==='climb'&&!!A.vcl,r2=rel(v);step(30);const still=A.state==='climb'&&!!A.vcl;
  free('KeyC');step(40);
  console.log(name.padEnd(9),'off the roof edge on to the side',ok,'head down',ok&&Math.cos(A.climbRoll||0)<-0.5||'', 'at',fmt(r2),'still on after .5s',still,'| let go: state',A.state,'clinging',!!A.vcl);
}
// ---- a train ----
for(let i=0;i<120;i++){A.pos.set(0,70,0);A.vy=0;step(1);}
for(let r=0;r<40&&!T.TRAINS.size;r++){A.pos.set(r*400,70,r*300);A.vy=0;step(30);}
const TQ=[...T.TRAINS.values()][0];
if(TQ){A.pos.set(T.railPt(TQ.C,TQ.s).x,70,T.railPt(TQ.C,TQ.s).z);step(60);}
if(TQ&&TQ.cars){const pr=TQ.cars[1].userData.proxy;TQ.v=0;TQ.wait=30;step(2);
  climbIt('train',pr,.9,0,4,()=>{TQ.wait=0;TQ.v=14;});
  overEdge('train',pr);
  // a train going by at speed, climb held: caught hold of, not run down
  TQ.wait=0;TQ.v=20;step(30);const pr2=TQ.cars[2].userData.proxy,b=T.vBox(pr2);
  {let sv=1;{const b0=T.vBox(pr2);step(1);const b1=T.vBox(pr2);sv=Math.sign((b1.x-b0.x)*b1.ax+(b1.z-b0.z)*b1.az)||1;}const b=T.vBox(pr2);A.state='walk';A.vcl=null;A.trainT=0;A.pos.set(b.x+(-b.az)*(b.hc+0.6)+b.ax*sv*(b.hl+3),b.y0+.05,b.z+b.ax*(b.hc+0.6)+b.az*sv*(b.hl+3));}
  face=false;hold('KeyC');const hp0=A.hp;let caught=null;for(let i=0;i<120&&!caught;i++){A.hp=20;quiet();now+=16.7;T.frame(now);if(A.vcl)caught=A.vcl.v;if(A.trainT>0)break;}
  console.log('train   ','passing at speed with climb held: caught hold',!!caught,'struck',A.trainT>0);free('KeyC');step(30);
} else console.log('no train');
// ---- cars: whichever kinds are near ----
{A.pos.set(0,70,0);A.vy=0;for(let i=0;i<300;i++){A.pos.set(0,70,0);A.vy=0;step(1);}
 const seen=new Set();for(let tries=0;tries<300&&seen.size<4;tries++){
   const c=T.cars.find(c=>c.alive&&!c.parked&&!c.isTrain&&!c.svc&&!seen.has(c.veh)&&Math.abs(c.speed)>4&&Math.hypot(c.pos.x,c.pos.z)<150);
   if(!c){A.pos.set(0,70,0);A.vy=0;step(10);continue;}seen.add(c.veh);
   if(climbIt(c.veh,c,.95,0,3))overEdge(c.veh,c);
   A.pos.set(0,70,0);A.vy=0;step(30);}}
// ---- a container ship ----
{let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-4;i<=4&&ok;i++)for(let j=-4;j<=4&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<7)ok=false;if(ok)SP=[x,z];}
 if(!SP)console.log('no open sea');else{const X=SP[0]*32+16,Z=SP[1]*32+16;for(let i=0;i<120;i++){A.pos.set(X,G0+30,Z);A.vy=0;step(1);}
  {const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('test')?false:del(k);}
  T.boatVenue('testcargo','cargo',{x:X,z:Z,yaw:0,lane:null},new Set());const V=T.venues.get('testcargo'),bo=V.bo;A.pos.set(X,G0+30,Z);step(3);
  // the hull, from the water, at the middle of the ship
  const hull=bo.bx.map(s=>s.pr).filter(pr=>T.vBox(pr)).sort((a,c)=>{const A1=T.vBox(a),C1=T.vBox(c);return (C1.hl*C1.hc)-(A1.hl*A1.hc);});
  const hb=bo.bx.find(s=>Math.abs(s.c)<3&&s.x===0&&s.top<bo.K.fb+.5)||bo.bx.find(s=>s.x===0);
  climbIt('ship hull',hb.pr,.9,0,2,()=>{V.lane={ax:'x',cx:X,cz:Z,R:Math.max(14,bo.L),len:30};V.s=0;V.dir=1;});
  // on deck: walk at the nearest container stack with climb held
  const stacks=bo.bx.filter(s=>s.top>bo.K.fb+2&&s.c>-bo.L/2+bo.L*.2);
  if(stacks.length){const st=stacks.sort((p,q)=>q.top-p.top)[0];let b=T.vBox(st.pr);
    // stood on the deck a couple of blocks in front of the tallest stack, facing it
    free('KeyC');A.state='walk';A.vcl=null;A.grounded=false;A.vy=0;A.mvx=A.mvz=0;const sg=st.c<0?1:-1;
    A.pos.set(b.x+b.ax*sg*(b.hl+2.2),b.y0+st.top-1.5-2.4*0,b.z+b.az*sg*(b.hl+2.2));A.pos.y=T.vBox(hb.pr).top()+1;step(40);
    b=T.vBox(st.pr);const deck=A.pos.y,onDeck=!!(A.standCar&&A.standCar.T===bo);A.heading=Math.atan2(b.x-A.pos.x,b.z-A.pos.z);face=true;hold('KeyC','KeyW');let t=0;while(!(A.state==='climb'&&A.vcl)&&t<600){step(1);t++;}
    const gv=A.vcl&&A.vcl.v,got=A.state==='climb'&&gv===st.pr;let up=0;while(A.state!=='walk'&&up<900){step(1);up++;}free('KeyW');step(20);
    console.log('stack    ','on deck',onDeck,'walked at the tallest container stack ('+(b.top()-deck).toFixed(1)+' high) with climb held: grabbed',got,'after',(t/60).toFixed(1)+'s; up on top',!!A.standCar&&A.standCar.T===bo&&A.standCar.top>=st.pr.top-.1,'after',(up/60).toFixed(1)+'s, height above the deck',(A.pos.y-deck).toFixed(2));
    free('KeyC');}
  else console.log('no stacks / not on deck',stacks.length,!!A.standCar);
 }}
// ---- a plane ----
{let B=null;for(let r=0;r<500&&!B;r++)for(let i=-r;i<=r&&!B;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.bigPlainsAt(x,z);if(q&&q.kind==='airport'){B=q;break;}}
 if(!B)console.log('no airport');else{const X0=B.ax*32,Z0=B.az*32;for(let i=0;i<200;i++){A.pos.set(X0+100,70,Z0+70);A.vy=0;step(1);}
  const V=[...T.venues.values()].find(v=>v.kind==='airport'&&v.B.ax===B.ax&&v.B.az===B.az);
  if(V&&V.pl){const pl=V.pl[1];climbIt('plane',pl.pr[0],.9,-5,2);}else console.log('no planes');}}
`);
process.exit(0);
