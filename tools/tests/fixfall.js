// Street fixtures and props on their way down: between full refreshes only those falling are drawn again (fixFallRedraw,
// dressing/rooms-furn.js). Checks that every frame of their fall leaves the instanced boxes exactly as a full refresh would
// have, lamps, benches and props together, knocked at different moments, and the time it takes against a full refresh.
// (the stand-in three.js doesn't work out matrices, so the real one's Matrix4 is lent to it, where it's installed)
let real=null;try{real=require('three');}catch(e){}
if(real){const S=require('./stub-three.js');for(const n of Object.getOwnPropertyNames(real.Matrix4.prototype))if(n!=='constructor')S.M4.prototype[n]=real.Matrix4.prototype[n];}
else console.log('(three.js not installed: npm install three, for the boxes to be checked)');
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log(n,v?'ok':'BAD');};
for(const f of els.play.L.click)f();pads.length=0;run(2);T.DT.invuln=true;
// (the stand-in three.js doesn't keep the boxes: these do)
const IM=['FIX_BAR','FIX_GLOW','FIX_COL','PROP_L','PROP_G'].map(n=>{const M=T[n],m=new Map(),c=new Map();
  M.setMatrixAt=(i,a)=>m.set(i,Array.from(a.elements));M.setColorAt=(i,col)=>c.set(i,[col.r,col.g,col.b]);return {n,M,m,c};});
const snap=()=>IM.map(o=>{const out=[];for(let i=0;i<o.M.count;i++)out.push((o.m.get(i)||[]).concat(o.c.get(i)||[]));return {n:o.n,count:o.M.count,out};});
const same=(a,b)=>a.every((x,k)=>{const y=b[k];if(x.count!==y.count)return false;for(let i=0;i<x.out.length;i++){const p=x.out[i],q=y.out[i];if(p.length!==q.length)return false;for(let j=0;j<p.length;j++)if(Math.abs(p[j]-q[j])>1e-6)return false;}return true;});
// (into town, where there are lamps, benches and bins)
const P=T.players[0];
const at=(()=>{for(let r=0;r<60;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]])if(T.setType(a,c)==='city'&&T.setType(a+1,c)==='city')return [a,c];})();
P.pos.set(at[0]*T.CELL+4,T.G+1.2,at[1]*T.CELL+4);P.vy=0;run(2);T.refreshFixtures();
const lamps=T.activeFix.filter(f=>f.type==='lamp'),furn=T.activeFix.filter(f=>f.prop||f.type==='parkbench'||f.type==='litterbin');
console.log('near: lamps',lamps.length,'benches and bins',furn.length,'fixtures',T.activeFix.length,'props',T.activeProps.length);
chk('some to knock over',lamps.length>=3&&furn.length>=1);
let frames=0,bad=0,partial=0,full=0,moved=0,prevY=[];const tP=[],tF=[];
const fr=T.fixFallRedraw,rf=T.refreshFixtures;
T.fixFallRedraw=function(){const t=performance.now();const r=fr();if(r){partial++;tP.push(performance.now()-t);}return r;};
T.refreshFixtures=function(){const t=performance.now();rf();full++;tF.push(performance.now()-t);};
const knock=f=>T.knockFix(f,1,0);
const plan={2:[lamps[0]],9:[lamps[1],furn[0]],20:[lamps[2]]};
for(let i=0;i<80;i++){
  for(const f of plan[i]||[])knock(f);
  step(1);frames++;
  if((T.falling.size||i<50)&&i%6===5){const a=snap();rf();const b=snap();if(a[0].out.some((r,k)=>r[13]!==prevY[k]))moved++;prevY=a[0].out.map(r=>r[13]);if(!same(a,b)){bad++;if(bad<4)console.log('  frame',i,'differs from a full refresh');}}
}
chk('every frame as a full refresh would draw it ('+frames+' frames, '+partial+' with only the falling redrawn)',bad===0&&partial>20);
if(real)chk('and the boxes really move as they fall',moved>0);
chk('all landed',lamps.slice(0,3).every(f=>T.downFix.has(f.key))&&T.downFix.has(furn[0].key));
const avg=a=>a.length?(a.reduce((s,x)=>s+x,0)/a.length):0;
console.log('time: only the falling',avg(tP).toFixed(3),'ms, a full refresh',avg(tF).toFixed(3),'ms ('+full+')');
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
const pass=ok.every(Boolean)&&!errs.length;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
