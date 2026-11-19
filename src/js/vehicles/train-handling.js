// ---- a train as you drive it (from drvTrain and drvSub, driving.js) ----
// One lever (T.rail.n) from five brake notches through neutral to five power notches, stepped by W and S (held, it sweeps)
// or a controller's triggers; it stays where it's left. The reverser (R, only when stopped) says which way power drives it,
// forward, neutral or reverse, so the camera's free to look round. The train carries its weight: power builds speed
// slowly, the brakes take real distance (the brake pipe's pressure, bp, comes on over a moment), and Space throws the
// emergency brake. Every bend has a safe speed: the instrument marks the slowest one coming up (lim, in km/h), the wheels
// squeal past it, and taking a bend far too fast derails the train, which is wrecked car by car
const TRAIN_DRV={acc:1.3,brk:2.4,emerg:4.2,top:30,lat:6,derail:1.55,look:110,hold:0.4,sweep:0.2};
// the lever, the reverser and the emergency brake; returns the rail state
function trainLever(T,p,i,dt,v){const R=T.rail||(T.rail={n:0,rev:1,bp:0,lim:null,eb:false});
  const z=i.z<-0.3?1:i.z>0.3?-1:0,tr=(i.rt||0)>0.6?1:(i.lt||0)>0.6?-1:0,d=z||tr;
  if(!d){R.dT=0;R.dD=0;}
  else{let go=false;if(d!==R.dD){R.dD=d;R.dT=TRAIN_DRV.hold;go=true;}else{R.dT-=dt;if(R.dT<=0){R.dT=TRAIN_DRV.sweep;go=true;}}
    if(go){const n=Math.max(-5,Math.min(5,R.n+d));if(n!==R.n){R.n=n;if(d>0)R.eb=false;if(audio)sfx('Lever notch',()=>{clang();tone('square',200+(n+5)*30,200+(n+5)*30,0.04,0.02);});}}}
  if(i.rlEmergP&&!R.eb){R.eb=true;R.n=-5;if(audio)sfx('Emergency brake',()=>noise(1.2,0.25,2500,'highpass'));flashLabel('Emergency brake!',p);}
  if(i.rlRevP){if(Math.abs(v)>0.3)flashLabel('Stop the train before moving the reverser',p);
    else{R.rev=R.rev===1?0:R.rev===0?-1:1;if(audio)sfx('Reverser',()=>clang());flashLabel('Reverser: '+(R.rev>0?'forward':R.rev<0?'reverse':'neutral'),p);}}
  // (the horn: a toot, or a long blast held; the bell)
  T.hornT=(T.hornT||0)-dt;if(i.rlHorn&&T.hornT<=0){T.hornT=i.rlHornP?0.45:0.3;sfx('Train horn',()=>{tone('sawtooth',311,300,0.5,0.07);tone('sawtooth',370,360,0.5,0.06);});}
  if(i.rlBellP)sfx('Train bell',()=>{tone('triangle',1250,1250,0.5,0.05);tone('triangle',1250,1250,0.5,0.04);});
  return R;}
// the speed along the track (v: signed, along the track's own direction), with power, brakes and the reverser
function trainPull(R,v,fw,dt,top){
  const a=R.n>0&&R.rev?R.n/5*TRAIN_DRV.acc*(Math.abs(v)<top?1:0):0;v+=fw*a*dt;
  R.bp+=((R.eb?1:R.n<0?-R.n/5:0)-R.bp)*Math.min(1,dt*2.5);
  const b=R.bp*(R.eb?TRAIN_DRV.emerg:TRAIN_DRV.brk)*dt;v-=Math.sign(v)*Math.min(Math.abs(v),b);
  v*=Math.exp(-dt*0.012);return Math.max(-top,Math.min(top,v));}
// the safe speed at track point s (blocks a second): from how sharply it bends over 8 blocks; Infinity on the straight
function trainSafe(C,s){const a=railPt(C,Math.max(0,s-4)),b=railPt(C,Math.min(C.L-2,s+4)),d=Math.abs(Math.atan2(a.tx*b.tz-a.tz*b.tx,a.tx*b.tx+a.tz*b.tz));
  return d<0.02?Infinity:Math.sqrt(TRAIN_DRV.lat*8/d);}
// the bend coming up, overspeed and derailing: lead is the leading end's place along the track, dir which way it's going
function trainBends(T,p,R,v,lead,dir,dt){const C=T.C;let lim=Infinity;
  for(let d=4;d<=TRAIN_DRV.look;d+=4){const s=lead+dir*d;if(s<1||s>C.L-2)break;lim=Math.min(lim,trainSafe(C,s));}
  R.lim=lim<TRAIN_DRV.top?lim*BPS_KMH:null;
  const here=trainSafe(C,lead),sp=Math.abs(v);if(sp<=here*1.12){R.sq=0;return false;}
  R.sq=(R.sq||0)-dt;if(R.sq<=0){R.sq=0.35;if(audio)sfx('Wheels squealing',()=>tone('sawtooth',1900,2100,0.3,0.04));if(p)flashLabel('Too fast for the bend!',p);}
  if(sp<here*TRAIN_DRV.derail)return false;
  // (off the rails: the leading car goes up, and the rest pile in behind)
  const P=railPt(C,lead),g=T.cars&&T.cars[0];airCrash(P.x,(g?g.position.y:G)+1.5,P.z,4,'Killed when a train came off the rails');
  for(let ci=0;ci<(T.cars?T.cars.length:0);ci++)trainHit(T,CAR_HP*3,null,ci);
  if(p)flashLabel('Derailed!',p);return true;}
// the controls, for the column down the left
function trainHow(p,D){const A=id=>actMark(p,id),R=D.o.rail||{rev:1};
  return actPair(p,'fwd','back')+' lever: power / brake, a notch a tap  ·  '+A('rlRev')+' reverser ('+(R.rev>0?'forward':R.rev<0?'reverse':'neutral')+')  ·  '+A('rlEmerg')+' emergency brake  ·  '+A('rlHorn')+' horn (hold: long)  ·  '+A('rlBell')+' bell'+'  ·  ';}
