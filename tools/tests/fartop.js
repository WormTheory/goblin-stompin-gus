// The far rings leave out what the curve of the world hides, and for open country and open sea they go by a rule of
// thumb for how high anything drawn there can stand (farLowTop, render/far-city.js: the land's own height at a few
// points and some room over it). If a ring ever drew something taller than the rule says, it could be left out while
// its top showed over the horizon. So: two stretches of the world, one round the start and one in the mountains, every
// few plots, each open-country or open-sea plot drawn as the near and middle rings draw it and each 4 x 4 block of them as
// the far ring does, and the tallest box of each set against the rule. The stand-in a hidden plot gets (farCellBack) is
// held to the same height. It fails if anything stands over the rule, and says how much room was left.
// Usage: node fartop.js     (STEP=4 plots between samples, N=240 plots across each stretch, AT=x,z,x,z the stretches' corners)
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;
const N=+(process.env.N||240),STEP=+(process.env.STEP||4),AT=(process.env.AT||'-120,-120,-2600,1700').split(',').map(Number);
const look=E(`(X0,Z0,N,STEP)=>{const tb=farStage(),tg=farStage(),st={},bad=[];let rel=0;
  const go=g=>{while(!g.next().done){}};
  const top=()=>{let m=0;for(const S of [tb,tg])for(let i=0;i<S.n;i++){const o=i*16,t=S.mat[o+13]+S.mat[o+5]/2;if(t>m)m=t;}return m;};
  const note=(nm,px,pz,n,fn,x)=>{const lim=farLowTop(px,pz,n);if(lim>=H)return;
    tb.n=0;tg.n=0;go(fn(tb,tg,n>1?px/n:px,n>1?pz/n:pz,x));const t=top(),s=st[nm]||(st[nm]={n:0,room:1e9});s.n++;s.room=Math.min(s.room,lim-t);
    if(t>lim+1e-6)bad.push(nm+' at plot '+px+','+pz+': '+t.toFixed(1)+' over a rule of '+lim.toFixed(1));};
  for(let px=X0;px<X0+N;px+=STEP)for(let pz=Z0;pz<Z0+N;pz+=STEP){
    rel=Math.max(rel,reliefNat(px*CELL+16,pz*CELL+16));
    note('near ring',px,pz,1,farPlotNear);note('middle ring',px,pz,1,farPlotMid);note('stand-in, a plot',px,pz,1,farCellBack,CELL);}
  const dmg=farDamaged();
  for(let qx=Math.floor(X0/4);qx<Math.floor((X0+N)/4);qx++)for(let qz=Math.floor(Z0/4);qz<Math.floor((Z0+N)/4);qz++){
    note('far ring',qx*4,qz*4,4,farQuadFar,dmg);note('stand-in, 4 x 4 plots',qx*4,qz*4,4,farCellBack,4*CELL);}
  return {st,bad,rel};}`);
let bad=[],n=0;
for(let i=0;i+1<AT.length;i+=2){
  const r=look(AT[i],AT[i+1],N,STEP);bad=bad.concat(r.bad);
  console.log('plots from '+AT[i]+','+AT[i+1]+' (land up to '+r.rel.toFixed(0)+' over the plain):');
  for(const [k,s] of Object.entries(r.st)){n+=s.n;console.log('   '+k.padEnd(24)+String(s.n).padStart(6)+' checked, the nearest to the rule: '+s.room.toFixed(1)+' under it');}
}
for(const b of bad.slice(0,20))console.log('   TOO TALL: '+b);
const ok=!errs.length&&!bad.length&&n>2000;
if(errs.length)console.log('errors:',errs.slice(0,5));
console.log(ok?'PASS: nothing the far rings draw on open country or open sea stands over the rule that hides it ('+n+' checked)'
  :'FAIL: '+(bad.length?bad.length+' drawn taller than farLowTop allows':n<=2000?'too few open plots found to say ('+n+')':'errors'));
process.exit(ok?0:1);
