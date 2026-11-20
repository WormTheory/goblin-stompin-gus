// The debug menu's and the Testing Environment's vehicle list: the two-seater plane and every kind of boat. Each is spawned
// as Gnash in the Testing Environment (a sea laid out for the boats), got into, driven or taxied a few seconds with W held,
// and got out of; then the debug menu's dropdown is opened on a kind far down the list, to check it's scrolled into view,
// and Clear takes the boats away. node spawnlist.js
// WORLD=1: in an ordinary city instead, from the nearest shore looking out to sea
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
if(process.env.WORLD)hdr=hdr.replace(',tenv:{boxes:[]}','');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,tenvVehKinds,drvFind,drvEnter,drvExit,BOATS,TENV_BOATS,ddOpts,seaPlot,CELL,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44;
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
T.DT.invuln=true;T.setGob(true);run(0.5);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};
if(process.env.WORLD){console.log('Testing Environment',!!T.TENV);const C=T.CELL,px0=Math.floor(P.pos.x/C),pz0=Math.floor(P.pos.z/C);let spot=null;
  for(let r=1;r<80&&!spot;r++)for(let i=-r;i<=r&&!spot;i++)for(const [a,b] of [[i,-r],[i,r],[-r,i],[r,i]]){const px=px0+a,pz=pz0+b;if(T.seaPlot(px,pz)||!T.seaPlot(px,pz+1)||[2,3,4].some(e=>T.seaPlot(px,pz+e)!==2))continue;spot=[px*C+16,pz*C+28];break;}
  console.log('shore at',spot);put(spot[0],60,spot[1]);run(3);home.x=P.pos.x;home.y=P.pos.y;home.z=P.pos.z;}
const kinds=T.tenvVehKinds();
console.log('in the list:',['light',...T.TENV_BOATS].map(k=>k+(kinds.includes(k)?'':' MISSING')).join(' '));
// the two-seater
{put(home.x,home.y,home.z);P.cam.yaw=Math.PI;P.cam.pitch=0;run(0.3);const msg=T.tenvSpawnOne('light');run(0.3);
 const V=T.venues.get('tenvPlanes'),pl=V&&V.pl[V.pl.length-1];console.log('two-seater:',msg,'light',!!(pl&&pl.light),'hp',pl&&pl.hp);
 if(pl){const g=pl.g;put(g.position.x,g.position.y+3,g.position.z);run(0.2);const D=T.drvFind(P);if(D)T.drvEnter(P,D);run(0.3);
   const x0=g.position.x,z0=g.position.z;hold(['KeyW'],4);
   console.log('  got in',P.drv&&P.drv.k,'  name',P.drv&&P.drv.o.light?'two-seater':'?','  moved',f1(Math.hypot(g.position.x-x0,g.position.z-z0)),'in 4 s');
   if(P.drv)T.drvExit(P);run(0.5);}}
// every boat
for(const k of T.TENV_BOATS){
  put(home.x,home.y,home.z);P.cam.yaw=Math.PI;P.cam.pitch=0;run(process.env.WORLD?2:0.3);
  const before=new Set(T.venues.keys()),msg=T.tenvSpawnOne(k);run(0.5);
  const key=[...T.venues.keys()].find(q=>q.startsWith('tenvBoat:')&&!before.has(q)),V=key&&T.venues.get(key);
  if(!V){console.log(k+':',msg);continue;}
  const g=V.boat,K=T.BOATS[k];put(g.position.x,g.position.y+K.fb+1.5,g.position.z);run(0.4);
  const D=T.drvFind(P);if(D&&D.k==='boat')T.drvEnter(P,D);run(0.3);
  const x0=g.position.x,z0=g.position.z;hold(['KeyW'],4);
  console.log(k+':',msg.replace(' ahead of Gus.',''),' afloat at',f1(g.position.y-G0),' got in',P.drv&&P.drv.k,' moved',f1(Math.hypot(g.position.x-x0,g.position.z-z0)),'in 4 s');
  if(P.drv)T.drvExit(P);run(0.5);}
// the debug menu's dropdown, opened on a kind far down the list: is the chosen one in view?
{T.DT.veh='cargo';const o=T.ddOpts('vehSel');console.log('dropdown entries',o.length,'  cargo at',o.findIndex(q=>q.v==='cargo'));}
// Clear takes the boats away (all but one being driven)
T.tenvClear();run(0.3);console.log('after Clear, spawned boats left:',[...T.venues.keys()].filter(q=>q.startsWith('tenvBoat:')).length);
console.log('errors',errs.length,errs.slice(0,3).join(' | '));process.exit(0);
`);
