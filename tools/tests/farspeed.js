// The far view while moving fast: is the land out to the horizon always drawn? Flies player one in a straight line at
// each of a few speeds (updateFar alone, 60 times a second, its builds given their real few milliseconds a frame) and
// says, per ring, how much of the time the ring last built still covered its whole band round the player, the furthest
// the player got from where it was built, and how long a build took. The backdrop (the always-there coarse land) is
// checked the same way.
// Usage: node farspeed.js            (VIEW=2400 the view distance, SECS=20 a run, SPEEDS=20,90,213,600)
const {T,E,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;
const VIEW=+(process.env.VIEW||2400),SECS=+(process.env.SECS||20),SPEEDS=(process.env.SPEEDS||'20,90,213,600').split(',').map(Number);
T.viewSetting=VIEW;T.farDirty=true;
const P=T.players[0],LODS=T.LODS,names=['near','mid','far','back'];
// (where each ring's shown build was made, noted as it's swapped in)
const shown=LODS.map(()=>null);
E('(f)=>{const o=farCommit;farCommit=L=>{o(L);f(L);}}')(L=>{const i=LODS.indexOf(L);if(i>=0)shown[i]={x:L.bx!==undefined?L.bx:L.cx,z:L.bz!==undefined?L.bz:L.cz,m:L.bm!==undefined?L.bm:L.step+(i===2?256:64),t:tNow,n:L.B.m.count+L.G.m.count};});
let tNow=0,ok=true;const hasBD='farBackOK' in T;
const settle=()=>{for(let i=0;i<3000&&LODS.some(L=>L.job);i++)T.updateFar(1/60);};
for(const v of SPEEDS){
  P.pos.x=300;P.pos.z=300;T.farDirty=true;T.updateFar(1/60);settle();
  const st=LODS.map(()=>({bad:0,maxD:0,builds:0,last:0,gap:0}));let frames=0,ms=0,worst=0,bdBad=0;
  for(let f=0;f<SECS*60;f++){tNow=f/60;P.pos.x+=v/60;P.pos.z+=v*0.25/60;
    const t0=process.hrtime.bigint();T.updateFar(1/60);const dt=Number(process.hrtime.bigint()-t0)/1e6;ms+=dt;worst=Math.max(worst,dt);frames++;
    LODS.forEach((L,i)=>{const S=shown[i],s=st[i];if(!S){s.bad++;return;}const d=Math.hypot(P.pos.x-S.x,P.pos.z-S.z);
      if(d>S.m+1)s.bad++;s.maxD=Math.max(s.maxD,d);if(S.t!==s.last){s.builds++;s.gap=Math.max(s.gap,S.t-s.last);s.last=S.t;}});
    if(hasBD&&!T.farBackOK())bdBad++;}
  console.log('speed',String(v).padStart(4),'blocks/s | updateFar avg',(ms/frames).toFixed(2),'ms worst',worst.toFixed(1));
  LODS.forEach((L,i)=>{const s=st[i];console.log('   ',names[i].padEnd(4),'uncovered',(100*s.bad/frames).toFixed(0).padStart(3)+'% of the time | furthest from its build',s.maxD.toFixed(0).padStart(5),'(margin',shown[i]?shown[i].m:'-',') | builds',String(s.builds).padStart(3),'| longest wait',s.gap.toFixed(1),'s | boxes',shown[i]?shown[i].n:0);
    if(v<=213&&i<3&&s.bad/frames>0.02)ok=false;});
  if(hasBD){console.log('    backdrop uncovered',(100*bdBad/frames).toFixed(0)+'% of the time');if(bdBad)ok=false;}
}
console.log('errors',errs.length);
console.log(ok?'farspeed ok':'farspeed FAILED: a ring was left behind');
process.exit(ok&&!errs.length?0:1);
