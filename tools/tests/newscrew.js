// News crews: for a fire, a car wreck and a killing near each TV station, does a van turn out, stop short of the scene, put
// out a reporter and a camera operator with their kit, and get home to its bay? Also how far news stations reach.
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={SVC,stationDef,stnState,newsCalls,addFire,fires,explodeCar,damageGoblin,updateServices,V3,cars,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=1e6;
const step=k=>{for(let i=0;i<k;i++){A.hp=1e6;A.vy=0;for(const g of T.goblins)if(g.state==='chase'&&!g.news&&!g.civ&&!g.staff){g.state='wait';g.t=-1e9;g.root.visible=false;}now+=16.7;T.frame(now);}};
const stations=[];for(let r=0;r<130&&stations.length<3;r++)for(let i=-r;i<=r&&stations.length<3;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const D=T.stationDef(x,z);if(D&&D.kind==='news'&&!stations.includes(D))stations.push(D);}
console.log('stations found',stations.length,stations.map(D=>D.key+' bays '+D.bays.length+' '+(D.B&&D.B.n)).join('; '));
const clear=()=>{T.newsCalls.length=0;T.fires.length=0;for(const c of T.SVC)if(c.svcPool==='news'&&c.alive&&c.svc&&c.svc.st!=='parked'){c.alive=false;c.g.visible=false;c.svc=null;}};
const scene={
  fire:(x,z)=>{T.addFire(x,45,z,1.5,60);},
  crash:(x,z)=>{const c=T.cars.find(o=>!o.alive&&!o.svcPool&&!o.police&&!o.parkPool&&!o.hwPool);c.alive=true;c.pos.set(x,45,z);c.g.visible=true;c.hp=1;T.explodeCar(c);},
  // two cars running into each other
  bump:(x,z)=>{const [c,d]=T.cars.filter(o=>!o.alive&&!o.svcPool&&!o.police&&!o.parkPool&&!o.hwPool);for(const o of [c,d]){o.alive=true;o.g.visible=true;o.hp=30;o.pos.set(x,45,z);o.heading=0;}d.pos.z+=c.hz+d.hz-0.5;c.speed=12;d.speed=0;},
  killing:(x,z)=>{const g=T.goblins.find(o=>o.civ&&!o.staff&&o.state==='wait');g.state='chase';g.hp=1;g.root.visible=true;g.pos.set(x,45,z);T.damageGoblin(g,5,new T.V3(x,46,z),null,'Test');},
};
for(const D of stations)for(const what of ['fire','crash','bump','killing']){
  const X=D.node.x,Z=D.node.z;
  // stand well off so the bays fill and nothing's in the way, then make the scene three blocks along
  clear();for(let i=0;i<120;i++){A.pos.set(X+6,60,Z+6);step(1);}
  const tx=X+96,tz=Z;scene[what](tx,tz);step(3);const called=T.newsCalls.map(k=>k.what).join(',');
  let c=null,t=0;while(t<8&&!c){A.pos.set(tx,60,tz);step(6);t+=.1;c=T.SVC.find(o=>o.svcPool==='news'&&o.alive&&o.svc&&o.svc.st==='go');}
  if(!c){console.log(D.key,what,'called',called,'NO VAN',T.newsCalls.length);continue;}
  const sent=t;let gap=null,crew=0,kit=0,jobs='',peak=0,st=[c.svc.st],hp=c.hp,label=c.svc.story;t=0;
  while(t<130&&c.svc){A.pos.set(c.pos.x+8,60,c.pos.z+8);step(6);t+=.1;if(!c.svc)break;
    if(c.svc.st!==st[st.length-1]){st.push(c.svc.st);if(c.svc.st==='work')gap=Math.hypot(c.pos.x-tx,c.pos.z-tz);}
    const G2=T.goblins.filter(g=>g.news&&g.news.car===c&&g.state==='chase');if(G2.length>crew){crew=G2.length;jobs=G2.map(g=>g.id.occ).join(' / ');}
    for(const g of G2)if(g.kit&&(g.kit.mic.visible||g.kit.cam.visible))kit=Math.max(kit,G2.filter(q=>q.kit&&(q.kit.mic.visible||q.kit.cam.visible)).length);
    if(c.svc.st==='parked')break;}
  const left=T.goblins.filter(g=>g.news).length;
  console.log(D.key,what,'called',called,'sent after',sent.toFixed(1),'story',label,'stopped',gap===null?'-':gap.toFixed(1),'from scene; crew',crew,'with kit',kit,'['+jobs+']',st.join('>'),t.toFixed(0)+'s','hp',c.hp,'crew still out',left);
}
// ordinary traffic left alone in a city: how many scenes does it make for the news by itself?
clear();const D0=stations[0];let calls=new Set();for(let i=0;i<7200;i++){A.pos.set(D0.node.x+6,60,D0.node.z+6);step(1);for(const k of T.newsCalls)if(k.what==='car crash')calls.add(k);}
console.log('traffic alone, 2 minutes: car crash scenes',calls.size);
`);
process.exit(0);
