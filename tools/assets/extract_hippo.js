// one-off: the hippos' timed animations, as move.js worked them out in sums (sines, bells, smoothsteps), written out as
// keyframed clips (src/assets/clips/hip*.json, layout 'hippo'). Each channel is sampled finely and keys are laid down as
// far apart as they can go while the clip stays within TOL of the sums all the way (trying each ease), then the clips
// are read back through assetPoseAt and the worst difference printed.
const fs=require('fs'),path=require('path');
const A=require('./asset-format.js'),ROOT=path.join(__dirname,'..','..'),DIR=path.join(ROOT,'src/assets/clips');
const TOL=+(process.env.TOL||0.0025),NS=1600;
const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},ss=(a,b,x)=>sm((x-a)/(b-a)),PI=Math.PI;
const CH=A.ASSET_LAYOUTS.hippo.ch.map(c=>c[0]);
// each clip: its channels as functions of u (0 to 2), anything left out is 0
const CRASH_T=0.5;
function bite(A0,B0){return k=>{const open=sm(k/0.6),shut=sm((k-0.69)/0.1),jab=Math.exp(-Math.pow((k-0.79)/0.07,2)),lk=0.78,
  st=sm(k/lk),lift=Math.sin(Math.min(1,k/lk)*PI),settle=1-sm((k-lk)/(1-lk)),o={jaw:1.0*open*(1-shut),head:0.1*open*(1-shut)-0.16*jab,pitch:0.05*jab,
  legW:sm(k/0.2),lift:0.06*lift};const L=['legFR','legFL','legBR','legBL'];
  for(const i of A0)o[L[i]]=(0.35-0.8*st)*settle-0.15*lift;for(const i of B0)o[L[i]]=(-0.1+0.35*st)*settle;return o;};}
const CLIPS={
  hipBite1:{f:bite([0,3],[1,2]),note:'The first and second bites of the combo (the second with hipBite2\'s legs), and a bite in the air (its head and jaw only). The bite lands at about 1.5.'},
  hipBite2:{f:bite([1,2],[0,3]),note:'The second bite: the other pair of legs steps.'},
  hipUpper:{f:k=>{const dip=sm(k/0.38),up=sm((k-0.4)/0.16),back=sm((k-0.7)/0.3),lk=0.63,st=sm(k/lk),lift=Math.sin(Math.min(1,k/lk)*PI),settle=1-sm((k-lk)/(1-lk));
    return {head:0.42*dip*(1-up)-0.6*up*(1-back),pitch:0.09*dip*(1-up)-0.26*up*(1-back),jaw:k<0.42?1.05*sm(k/0.3):1.05*(1-sm((k-0.42)/0.12)),
      legFR:(0.25-0.75*st)*settle,legFL:(0.25-0.75*st)*settle,legBR:0.45*st*settle,legBL:0.45*st*settle,legW:sm(k/0.2),lift:0.06*lift};},note:'The combo\'s third hit: head down, then up.'},
  hipCrash:{f:k=>{const e=k*CRASH_T,k0=e<0.05?e/0.05:e<0.2?1:Math.max(0,1-(e-0.2)/0.3),q=k0*k0*(3-2*k0);
    return {outFR:-1.05*q,outFL:1.05*q,outBR:-1.05*q,outBL:1.05*q,legFR:-0.45*q,legFL:-0.45*q,legBR:0.45*q,legBL:0.45*q,lift:-0.42*q,sx:0.16*q,sy:-0.24*q,sz:0.1*q,head:0.12*q};},
    note:'A crash landing: splayed flat on his belly, then pushing back up (half a second). Wider, taller and longer multiply his size.'},
  hipLand:{f:k=>{const q=Math.sin((1-k)*PI)*0.16;return {sx:0.6*q,sy:-q,sz:0.3*q};},note:'Landing\'s squash (0.22 s; a small landing starts part way in).'},
  hipHop:{f:k=>{const q=Math.sin((1-k)*PI)*0.1;return {sy:q,sz:-0.5*q};},note:'Taking off\'s stretch (0.12 s; a small hop starts part way in).'},
  hipSpin:{f:k=>{const q=Math.sin(k*PI)*0.12;return {sx:0.45*q,sy:-q,sz:0.3*q};},note:'The bunch as a mid-air jump\'s spin kicks off (0.16 s).'},
  hipKnock:{f:k=>{const q=Math.sin(k*PI);return {pitch:-0.4*q,roll:0.12*q};},note:'Reeling from a hit (0.5 s).'},
  hipPoundLand:{f:k=>{const q=Math.sin(k*PI);return {sx:0.18*q,sy:0.12*q,sz:-0.24*q};},note:'A ground pound\'s landing (0.16 s).'},
  hipRoll:{f:k=>({curl:ss(0,0.18,k)*(1-ss(0.82,1,k)),spin:2*PI*ss(0.06,0.94,k)}),note:'The roll: curl tucks the legs and head in, somersault turns him over (a whole turn is 6.283).'}};
const EASES=[undefined,'l','i','o'];
const ez=(e,s)=>e==='i'?s*s:e==='o'?1-(1-s)*(1-s):e==='l'?s:s*s*(3-2*s);
const r4=v=>Math.round(v*1e4)/1e4||0;
function fit(f){
  const U=[],V=[];for(let i=0;i<=NS;i++){U.push(2*i/NS);V.push(f(i/NS));}
  if(V.every(v=>Math.abs(v)<1e-9))return [[0,0]];
  if(V.every(v=>Math.abs(v-V[0])<TOL))return [[0,r4(V[0])]];
  // (the fewest keys: keys may only go on every STEP-th sample, and a stretch between two keys counts if one ease keeps
  // every sample between within TOL; then the shortest path from the first sample to the last)
  const STEP=8,C=[];for(let i=0;i<=NS;i+=STEP)C.push(i);
  const ok=(a,b)=>{const va=r4(V[a]),vb=r4(V[b]);for(const e of EASES){let g=true;
    for(let i=a+1;i<b;i++){const s=(U[i]-U[a])/(U[b]-U[a]);if(Math.abs(va+(vb-va)*ez(e,s)-V[i])>TOL){g=false;break;}}if(g)return e===undefined?'':e;}return null;};
  const n=C.length,best=new Array(n).fill(1e9),from=new Array(n).fill(-1),how=new Array(n);best[0]=0;
  for(let j=1;j<n;j++)for(let i=j-1;i>=0;i--){if(best[i]+1>=best[j])continue;const e=ok(C[i],C[j]);if(e!==null){best[j]=best[i]+1;from[j]=i;how[j]=e;}}
  const K=[];for(let j=n-1;j>0;j=from[j]){const q=[r4(U[C[j]]),r4(V[C[j]])];if(how[j])q.push(how[j]);K.unshift(q);}
  K.unshift([0,r4(V[0])]);
  while(K.length>2&&Math.abs(K[K.length-1][1]-K[K.length-2][1])<1e-9&&!K[K.length-1][2])K.pop();
  return K;
}
const order=JSON.parse(fs.readFileSync(path.join(DIR,'_order.json'),'utf8'));
let worst=0,keys=0;
for(const name in CLIPS){const C=CLIPS[name],tracks={};
  for(const c of CH)tracks[c]=fit(k=>C.f(k)[c]||0);
  const file={layout:'hippo',tracks,note:C.note};
  const E=A.assetCheck('clips',name,file);if(E.length)console.log(name,'PROBLEMS',E);
  fs.writeFileSync(path.join(DIR,name+'.json'),A.fmt(file));
  if(!order.order.includes(name))order.order.push(name);
  let w=0,n=0;for(const c of CH)n+=tracks[c].length>1?tracks[c].length:0;
  for(let i=0;i<=400;i++){const k=i/400,P=A.assetPoseAt(file,2*k),o=C.f(k);CH.forEach((c,j)=>{w=Math.max(w,Math.abs(P[j]-(o[c]||0)));});}
  worst=Math.max(worst,w);keys+=n;console.log(name.padEnd(13),'keys',String(n).padStart(3),'| worst',w.toFixed(5));}
fs.writeFileSync(path.join(DIR,'_order.json'),JSON.stringify(order,null,2)+'\n');
console.log('clips',Object.keys(CLIPS).length,'keys',keys,'worst',worst.toFixed(5));
