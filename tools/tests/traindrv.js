// Trains as you drive them (vehicles/train-handling.js), as Gnash in a real city: the lever's notches (a tap a notch,
// held sweeping), power building speed slowly, the brakes taking distance (B5 against the emergency brake), the
// reverser (only when stopped; neutral, reverse), the next bend's safe speed on the instrument, wheels squealing past it,
// and a bend taken far too fast derailing the train; then a subway train on the same lever. node traindrv.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/const LS=\{\};global\.localStorage=.*\n/,'global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setTenv(v){const w=TENV;TENV=v;return w;},setGob,keys,mHeld,TRAINS,railPt,drvFind,trainSafe,TRAIN_DRV,BPS_KMH,TRAIN_LEN,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>(Math.round(v*10)/10).toFixed(1),G0=44;
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const hold=(ks,s)=>{for(const k of ks)K(k).add(k);run(s);for(const k of ks)K(k).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const beside=(x,y,z,h,hx)=>put(x-Math.cos(h)*(hx+0.7),y,z+Math.sin(h)*(hx+0.7));
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setTenv(null);T.setGob(true);run(0.5);
let TQ=null;for(let r=0;r<40&&!TQ;r++){put(r*400,70,r*300);run(0.5);TQ=[...T.TRAINS.values()].find(q=>!q.dead&&q.C&&q.C.L>400)||null;}
if(!TQ){console.log('no train found');process.exit(0);}
{const p=T.railPt(TQ.C,TQ.s);put(p.x,70,p.z);run(1);}
if(!TQ.cars){console.log('train not drawn');process.exit(0);}
const C=TQ.C;
// (the train put on a long straight run toward the far end, stopped, with Gnash in it)
let best=null;for(let s=TQ.dir>0?T.TRAIN_LEN+2:C.L-3;TQ.dir>0?s<C.L-200:s>200;s+=TQ.dir*10){let ok=true;for(let d=0;d<160&&ok;d+=8)if(T.trainSafe(C,s+TQ.dir*d)<Infinity)ok=false;if(ok){best=s;break;}}
TQ.v=0;TQ.wait=99;if(best!==null)TQ.s=best;run(0.3);
{const g=TQ.cars[1];beside(g.position.x,G0+1.2,g.position.z,g.rotation.y,1.3);run(0.3);beside(TQ.cars[1].position.x,TQ.cars[1].position.y+0.5,TQ.cars[1].position.z,TQ.cars[1].rotation.y,1.3);run(0.05);tap('KeyF');}
console.log('train: in',P.drv&&P.drv.k,'| a straight run',best!==null,'| controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,1).join(''));
const R=()=>TQ.rail||{},sp=()=>TQ.v;   // (T.v: speed along the train's own direction, forward plus)
// ---- the lever, and power
{tap('KeyW');const n1=R().n;hold(['KeyW'],1.2);const n2=R().n;run(2);const v2=sp();run(6);console.log('lever: W tapped',n1,' held 1.2 s more',n2,'(P5 is 5) | 2 s on:',f1(v2),' 8 s on:',f1(sp()),' (top',T.TRAIN_DRV.top+')');}
// ---- the reverser won't move while it's going
{tap('KeyR');console.log('  R while moving: reverser still',R().rev);}
// ---- braking: B5 from speed, then the emergency brake from the same speed
const brakeRun=(how)=>{while(R().n<5)tap('KeyW');let t=0;while(Math.abs(sp())<16&&t<20){run(0.2);t+=0.2;}const v0=sp(),s0=TQ.s;
  if(how==='b5'){hold(['KeyS'],2.5);}else tap('Space');t=0;while(Math.abs(sp())>0.05&&t<40){run(0.1);t+=0.1;}return{v0,d:Math.abs(TQ.s-s0),t,n:R().n,eb:R().eb,bp:R().bp};};
{const a=brakeRun('b5');console.log('brakes: from',f1(a.v0),'with S held to',a.n,': stopped in',f1(a.d),'blocks,',f1(a.t),'s  brake pipe',f1(a.bp));
 tap('KeyW');tap('KeyW');tap('KeyW');tap('KeyW');tap('KeyW');while(R().n>0)tap('KeyS');
 // (back the other way first, so there's room)
 tap('KeyR');tap('KeyR');console.log('  stopped, R twice: reverser',R().rev,'(reverse)');while(R().n<5)tap('KeyW');run(8);console.log('  P5 in reverse 8 s:',f1(sp()),'(the other way)');while(R().n>-5)tap('KeyS');let t=0;while(Math.abs(sp())>0.05&&t<30){run(0.2);t+=0.2;}
 tap('KeyR');console.log('  R again: reverser',R().rev,'(forward)');
 const b=brakeRun('eb');console.log('  emergency brake (Space) from',f1(b.v0),': stopped in',f1(b.d),'blocks,',f1(b.t),'s  lever',b.n,' emergency',b.eb);
 tap('KeyW');console.log('  W after: emergency off',!R().eb,' lever',R().n);while(R().n>0)tap('KeyS');while(R().n<0)tap('KeyW');tap('KeyR');console.log('  R: neutral',R().rev===0);while(R().n<5)tap('KeyW');run(3);console.log('  P5 in neutral 3 s: speed',f1(sp()));tap('KeyR');tap('KeyR');}
// ---- a bend: the sharpest ahead along this line, the train put well before it
let bend=null,bs=Infinity;for(let s=T.TRAIN_LEN+40;s<C.L-40;s+=2){const v=T.trainSafe(C,s);if(v<bs){bs=v;bend=s;}}
console.log('sharpest bend: safe speed',f1(bs),'(',f1(bs*T.BPS_KMH),'km/h ) at',bend);
const atBend=(v,show)=>{const dir=TQ.dir,front=bend-dir*80;TQ.s=Math.max(T.TRAIN_LEN+2,Math.min(C.L-3,front));TQ.v=v;const r=R();r.n=5;r.rev=1;r.eb=false;run(0.3);
  let t=0,sq=0,warn=false;let lim=null;while(t<20&&!TQ.dead&&(TQ.s-bend)*dir<20){run(0.05);t+=0.05;if(r.lim)lim=r.lim;if(r.sq>0.3)sq++;TQ.v=v;}
  return{lim,dead:!!TQ.dead,sq,passed:(TQ.s-bend)*dir>=20};};
if(bend!==null&&bs<T.TRAIN_DRV.top){
  const a=atBend(Math.min(bs*0.9,T.TRAIN_DRV.top));console.log('  at',f1(Math.min(bs*0.9,T.TRAIN_DRV.top)),'(under the limit): instrument marks',a.lim&&f1(a.lim),'km/h  through it',a.passed,' derailed',a.dead);
  const b=atBend(Math.min(bs*1.3,T.TRAIN_DRV.top));console.log('  at',f1(Math.min(bs*1.3,T.TRAIN_DRV.top)),'(over it): squealing',b.sq>0,' derailed',b.dead);
  if(bs*1.8<=T.TRAIN_DRV.top+0.01){T.DT.invuln=false;const c=atBend(bs*1.8);T.DT.invuln=true;   // (Invulnerability covers the train you're driving)
   console.log('  at',f1(bs*1.8),'(far over it): derailed',c.dead,' driver thrown out',!P.drv);}
  else console.log('  far over it would be past the top speed: no derailing at this bend');}
else console.log('  no bend on this line tighter than the top speed');
if(P.drv)tap('KeyF');run(1);
// ---- a subway train
{const was=T.setTenv(null);let S=null;for(let gx=-6;gx<=6&&!S;gx++)for(let gz=-6;gz<=6&&!S;gz++){put(gx*700+0.5,G0+40,gz*700+0.5);run(0.4);for(const V of T.venues.values())if(V.kind==='sub'&&V.cars&&V.cars[1]){S=V;break;}}
 if(!S)console.log('no subway');else{let n=0;while(n<600&&!(S.wait>1)){run(0.1);n++;}const c=S.cars[1].position,h=S.cars[1].rotation.y;
  put(c.x+Math.cos(h)*2,c.y-0.2,c.z-Math.sin(h)*2);run(0.2);tap('KeyF');run(0.3);const s0=S.s;hold(['KeyW'],1.4);run(3);
  console.log('subway: in',P.drv&&P.drv.k,' W held 1.4 s: lever',(S.T.rail||{}).n,' 3 s on: went',f1(S.s-s0),' speed',f1(S.v));tap('KeyF');}}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
