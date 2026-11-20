// Wind turbines brought down: the rotor goes over with the tower (or drops by itself if the nacelle's just smashed),
// ends up lying flat on the ground, and is still lying there after the turbine's been left and come back to. node turbfall.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,groundAt,venues,crush,get:get,AIR,turbineAt,topples,get wreckedNow(){return wrecked},');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
const hover=(x,y,z,k)=>{for(let i=0;i<k;i++){A.pos.set(x,y,z);A.vy=0;A.state='walk';step(1);}};
const tur=[];for(let r=0;r<400&&tur.length<2;r++)for(let i=-r;i<=r&&tur.length<2;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]])if(tur.length<2&&T.turbineAt(x,z)&&!tur.some(q=>Math.abs(q[0]-x)+Math.abs(q[1]-z)<4))tur.push([x,z]);
console.log('turbines',JSON.stringify(tur));
const f=v=>v.toFixed(1);
for(const [mode,[px,pz]] of [['base',tur[0]],['nacelle',tur[1]]]){
  const cx=px*32+16,cz=pz*32+16,key='w'+px+','+pz;hover(cx+30,G0+3,cz+30,200);const V=T.venues.get(key);if(!V){console.log(mode,'no venue');continue;}
  const r=V.rotor;console.log(mode,'standing rotor at height',f(r.position.y-G0));
  if(mode==='base')T.crush(cx,G0+2,cz,3,-2,2,{dx:1,dz:0});else T.crush(cx,G0+42,cz-3,3,-2,2);
  let rode=0,mx=0;for(let i=0;i<60*12&&!V.down;i++){hover(cx+30,G0+3,cz+30,1);if(V.fall&&V.fall.T)rode++;mx=Math.max(mx,r.position.y-G0);}
  const q=r.quaternion;console.log(mode,'down',!!V.down,'rode the topple frames',rode,'lying at height',f(r.position.y-G0),'ground there',f(T.groundAt?T.groundAt(r.position.x,r.position.z,r.position.y)-G0:0),'flat',Math.abs(Math.abs(q.x)-Math.SQRT1_2)<0.01&&Math.abs(Math.abs(q.w)-Math.SQRT1_2)<0.01,'on record',!!T.wreckedNow[V.wk]);
  const P=[r.position.x,r.position.y,r.position.z];hover(cx+4000,G0+40,cz+4000,200);console.log(mode,'venue dropped',!T.venues.has(key));hover(cx+30,G0+3,cz+30,200);
  const V2=T.venues.get(key);console.log(mode,'back: lying',!!(V2&&V2.down),'same place',!!V2&&Math.hypot(V2.rotor.position.x-P[0],V2.rotor.position.y-P[1],V2.rotor.position.z-P[2])<0.05);
}
console.log('done');
`);
process.exit(0);
