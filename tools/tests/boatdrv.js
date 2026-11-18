// Boats as you drive them (vehicles/boat-handling.js), out on open sea as Gnash: the throttle's notches (a tap a notch,
// held sweeping, staying put let go), planing (a speedboat's bow up and faster), a turn's lean, waves and a hop off a
// crest, the anchor (stopping hard and swinging round), each kind's special (the speedboat's boost, the launch's horn
// scattering goblins, the yacht's boom and sail, the trawler's net, the tug's push mode, the warship's deck gun, the
// pedalo's bell), the rowboat's oars (one alone turns, both straight on, a steady rhythm faster) and the pedalo's pedals,
// and the ship's anchor at the carrier's helm is left to the carrier suite. node boatdrv.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/const LS=\{\};global\.localStorage=.*\n/,'global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setTenv(v){const w=TENV;TENV=v;return w;},setGob,keys,mHeld,BOATS,boatVenue,oceanDepth,plotType,drvFind,windNow,BOAT_H,WX,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f2=v=>(Math.round(v*100)/100).toFixed(2),G0=44;
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const hold=(ks,s)=>{for(const k of ks)K(k).add(k);run(s);for(const k of ks)K(k).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setTenv(null);T.setGob(true);run(0.5);
let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-4;i<=4&&ok;i++)for(let j=-4;j<=4&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<6)ok=false;if(ok)SP=[x,z];}
if(!SP){console.log('no open sea');process.exit(0);}
const X=SP[0]*32+16,Z=SP[1]*32+16;put(X,G0+20,Z);run(2);
{const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('test')?false:del(k);T.drop=del;}
let nb=0;
// (a boat of that kind made at the middle of the open water, and Gnash put in it)
function boat(k){if(P.drv){tap('KeyF');run(0.3);}const key='test'+k+(nb++);T.boatVenue(key,k,{x:X,z:Z,yaw:0,lane:null},new Set());const V=T.venues.get(key),g=V.boat;run(0.3);
  for(const [kk,V2] of T.venues)if(kk!==key&&String(kk).startsWith('test'))T.drop(kk);
  let d=null;for(let r=0.6;r<4&&!d;r+=0.4){put(g.position.x-Math.cos(g.rotation.y)*(V.bo.K.W/2+r),G0+0.6,g.position.z+Math.sin(g.rotation.y)*(V.bo.K.W/2+r));run(0.1);d=T.drvFind(P);}
  if(d&&d.o===V.bo){tap('KeyF');}if(!P.drv||P.drv.o!==V.bo){console.log(k,': could not get in');return null;}P.cam.yaw=Math.PI-g.rotation.y;P.cam.pitch=-0.1;return V;}
// ---- the throttle's notches, on a launch
{const V=boat('launch');if(V){const bo=V.bo,g=V.boat;
  console.log('launch: controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,6).join(' | '));
  tap('KeyW');const n1=bo.notch;run(3);const v1=bo.sp;tap('KeyW');tap('KeyW');const n3=bo.notch;run(5);const v3=bo.sp;tap('KeyW');
  console.log('  W tapped: notch',n1,' 3 s on, nothing held:',f2(v1),'| twice more: notch',n3,' 5 s on:',f2(v3),'| once more: still',bo.notch,'(full is the top)');
  hold(['KeyS'],1.2);const nh=bo.notch;run(4);console.log('  S held 1.2 s: swept down to',nh,' 4 s on: speed',f2(bo.sp));
  hold(['KeyS'],0.05);run(4);console.log('  S tapped: notch',bo.notch,' 4 s on:',f2(bo.sp),'(astern)');
  tap('KeyW');tap('KeyW');tap('KeyW');tap('KeyW');run(6);const h0=g.rotation.y;hold(['KeyD'],1);console.log('  full ahead',f2(bo.sp),' planing',!!bo.plane,'| D 1 s: turned',f2(h0-g.rotation.y),' leaning',f2(bo.lr),'(into the turn)');
  // (the anchor at speed: a hard stop and a swing round)
  run(2);const h1=g.rotation.y,v=bo.sp;tap('Space');run(1.5);const v15=bo.sp;run(2);console.log('  Space at',f2(v),': anchor',!!bo.anchor,' 1.5 s on:',f2(v15),' 3.5 s on:',f2(bo.sp),' swung round',f2(Math.abs(g.rotation.y-h1)));
  tap('Space');console.log('  Space again: anchor',!!bo.anchor);
  // (its horn blast: goblins near it knocked back)
  tap('Mouse2');console.log('  right click: horn blast (special', bo.spT>0,')');}}
// ---- a speedboat: planing, the boost, waves and a hop
{const V=boat('speed');if(V){const bo=V.bo;T.WX.k.wind=0.8;
  tap('KeyW');tap('KeyW');tap('KeyW');let tp=-1,t=0;while(t<12){run(0.1);t+=0.1;if(tp<0&&bo.plane)tp=t;}
  console.log('speedboat: full ahead: planing after',f2(tp),'s  speed',f2(bo.sp),'(top',Math.max(6,T.BOATS.speed.sp*1.6)+')  bow up',f2(bo.lp));
  let hops=0,mx=0;for(let k=0;k<200;k++){run(0.05);if(bo.air){hops+=bo.vy>0&&bo.dy<0.3?1:0;mx=Math.max(mx,bo.dy);}}console.log('  10 s in a stiff wind: in the air off crests, highest',f2(mx),'above the water');
  const v0=bo.sp;tap('Mouse2');run(1);console.log('  right click: boost',f2(v0),'->',f2(bo.sp),'| again at once:',(tap('Mouse2'),bo.boostT>1.5?'boosted again':'cooling down'));T.WX.k.wind=0.4;}}
// ---- the yacht: the sail's speed against the wind, and the boom
{const V=boat('sail');if(V){const bo=V.bo,g=V.boat,w=T.windNow();
  const at=a=>{g.rotation.y=a;bo.sp=0;tap('KeyW');tap('KeyW');tap('KeyW');run(8);const v=bo.sp;tap('KeyS');tap('KeyS');tap('KeyS');run(3);return v;};
  console.log('yacht under full sail: running before the wind',f2(at(w.a)),' across it',f2(at(w.a+Math.PI/2)));
  const gs=T.goblins.filter(q=>q.state==='chase'||q.state==='wait').slice(0,1);
  tap('Mouse2');console.log('  right click: the boom swings',bo.boom>0);}}
// ---- the trawler's net
{const V=boat('fish');if(V){const bo=V.bo,g=V.boat,h=g.rotation.y;let n=0;
  for(const q of T.goblins){if(n>=3)break;if(q.state==='chase'||q.state==='civ')continue;}
  tap('Mouse2');console.log('trawler: right click: net cast, says',hudT(P.ui.flash&&P.ui.flash.textContent)||'(label)','| cooling down',bo.spT>0);}}
// ---- the tug's push mode, the warship's deck gun
{const V=boat('tug');if(V){tap('Mouse2');console.log('tug: right click: push mode',!!V.bo.push);tap('Mouse2');console.log('  again:',!!V.bo.push);}}
{const V=boat('navy');if(V){const n0=T.SHOTS.length;tap('Mouse2');run(0.1);console.log('warship: right click: a shell fired',T.SHOTS.length>n0||T.SHOTS.some(s=>s.own===V.bo));}}
// ---- the rowboat: an oar alone turns, both go straight, a steady stroke is faster
{const V=boat('row');if(V){const bo=V.bo,g=V.boat;
  const h0=g.rotation.y;for(let k=0;k<4;k++){tap('Mouse0');run(0.75);}const tL=g.rotation.y-h0;run(3);
  // (both oars for 6.8 s: a stroke every 0.85 s, then after a rest a frantic one every 0.25 s; how far each went)
  const both=(n,gap)=>{const x0=g.position.x,z0=g.position.z,h1=g.rotation.y;for(let k=0;k<n;k++){T.mHeld.add('Mouse0');T.mHeld.add('Mouse2');run(0.05);T.mHeld.delete('Mouse0');T.mHeld.delete('Mouse2');run(gap);}
    return{d:Math.hypot(g.position.x-x0,g.position.z-z0),t:g.rotation.y-h1,ok:bo.row.ok};};
  const S=both(8,0.8);run(5);const F=both(23,0.25);
  console.log('rowboat: left oar 4 strokes: turned',f2(tL),'| both oars 6.8 s, a steady stroke: went',f2(S.d),' turned',f2(S.t),' rhythm',f2(S.ok),'| frantic: went',f2(F.d),' rhythm',f2(F.ok));
  console.log('  controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,3).join(' | '));}}
// ---- the pedalo: W held, then W in rhythm
{const V=boat('pedalo');if(V){const bo=V.bo;hold(['KeyW'],4);const vH=bo.sp;
  for(let k=0;k<16;k++){hold(['KeyW'],0.15);run(0.2);}const vR=bo.sp;
  tap('Mouse2');console.log('pedalo: W held 4 s:',f2(vH),'| W tapped in rhythm:',f2(vR),' rhythm',f2(bo.row.ok),'| right click: bell');}}
if(P.drv)tap('KeyF');
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
