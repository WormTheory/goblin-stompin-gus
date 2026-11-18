// Each vehicle's instrument (ui/instruments.js): every kind in the debug menu's vehicle list spawned in the Testing
// Environment, got into, driven a moment, and what's in the bottom-right corner (or over the view) read back: which
// instrument, drawn without NaN or undefined, and the controls column free of the readouts that moved into it. Boats
// and trains, which the list doesn't have, are drawn from made-up ones. node inst.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,tenvVehKinds,drvFind,INSTRUMENTS,BOATS,drvInst,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>hold(['KeyF'],0.1);
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
const bad=h=>/NaN|undefined|Infinity/.test(h);
T.DT.invuln=true;T.setGob(true);run(0.5);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};
let ki=0;for(const k of T.tenvVehKinds()){if(k==='carrier'||k==='barge')continue;   // (ships: drawn below, from a made-up one)
  const hx=home.x+(ki++)*70;
  put(hx,home.y,home.z);P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.tenvSpawnOne(k);run(1);
  // (walk out ahead of where it was put until there's something to get into)
  const fx=-Math.sin(P.cam.yaw),fz=-Math.cos(P.cam.yaw);let D=null;
  for(let d=2;d<=160&&!D;d+=0.5)for(const sd of [0,-6,6,-12,12]){if(D)break;put(hx+fx*d-fz*sd,home.y+0.3,home.z+fz*d+fx*sd);D=T.drvFind(P);}
  if(!D){console.log(k.padEnd(10),'nothing found to get into');continue;}
  tap();{let w=0;while(P.drv&&P.drv.jack&&w<60){run(0.1);w++;}}if(!P.drv){console.log(k.padEnd(10),'did not get in');continue;}
  hold(['KeyW'],1);run(0.2);
  const key=P.instK,sl=P.ui.speedo,el=key&&T.INSTRUMENTS[key]&&T.INSTRUMENTS[key].over?P.ui.instOv:P.ui.inst,h=key==='dial'?'(the dial)':el?el.innerHTML:'';
  const w=hudT(P.ui.drvHud&&P.ui.drvHud.txt.w);
  console.log(k.padEnd(10),P.drv.k.padEnd(8),'instrument',String(key).padEnd(8),' slot shown',!sl.hidden,' overlay shown',!P.ui.instOv.hidden,' drawn',h.length>20,' clean',!bad(h),
    ' controls column has throttle/climb/rudder readouts',/Throttle |Rudder |Climb /.test(w));
  if(P.drv&&P.drv.k==='mech')hold(['KeyF'],1.5);else tap();run(0.3);
  console.log('           out: slot hidden',sl.hidden,' overlay hidden',P.ui.instOv.hidden);}
// ---- boats and trains, drawn from made-up ones
{const g={rotation:{y:0.7},position:{x:0,y:45,z:0}};
 for(const bk of Object.keys(T.BOATS)){const bo={k:bk,K:T.BOATS[bk],g,sp:3,L:T.BOATS[bk].L},D={k:'boat',o:bo},key=bk==='row'||bk==='pedalo'?'row':'boat',h=T.INSTRUMENTS[key].draw(P,D,0.05);
   console.log('boat',bk.padEnd(8),'instrument',key,' drawn',h.length>20,' clean',!bad(h));}
 {const S={ord:3,sp:2.5,K:{top:6},rud:0.4},h=T.INSTRUMENTS.ship.draw(P,{k:'ship',o:S},0.05);console.log('ship           drawn',h.length>20,' clean',!bad(h));}
 const Tr={v:12,dir:1},h=T.INSTRUMENTS.train.draw(P,{k:'train',o:Tr},0.05);console.log('train          drawn',h.length>20,' clean',!bad(h));}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
