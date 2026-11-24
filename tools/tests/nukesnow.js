// Big blasts melting snow and scarring every kind of ground (destruction/big-blast.js):
// 1. snow lying, a blast at the capitol: every column it reaches has its snow melted (loaded or made later), people inside lose theirs
// 2. the capitol's lawn, a stadium's pitch and stands, a town railway: no lawn or pitch left green in the flattened zone, rubble
//    on the stadium's stands, the rails torn up
// 3. the save loaded again: the melted snow is still melted
// 4. no snow lying: nothing noted
const fs=require('fs'),vm=require('vm'),{performance}=require('perf_hooks');
const src0=fs.readFileSync('g.js','utf8'),d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,P1,bigBlast,BB,WX,snowBorn,get craters(){return craters},chunks,ckey,chunkArr,CS,G,H,CELL,PL0,save,capitolPlan,superOf,railAt,settlementAt,bbCol,bbK,bbO,bbTorn,goblins,FIELD,FIELD_L,GRASS,FLOWER,COBBLE,CONCRETE,SEAT_B,SEAT_R,GRAVEL};})();');
if(src===src0)throw new Error('closing line not found');
const SAVE_KEY=(src0.match(/SAVE_KEY='([^']+)'/)||[])[1];
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
function game(name,rseed,ls){
  const timers=[];let clock=1000;
  const ctx={console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,performance,
    setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},__LS:store(ls),__SS:store()};
  vm.createContext(ctx);
  const head='var global=globalThis;let __s='+rseed+';Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};\n'+stubs+
    '\nO3.prototype.isObject3D=true;global.localStorage=__LS;global.sessionStorage=__SS;global.location={reload(){}};\n';
  vm.runInContext(head+src,ctx,{filename:name+'.js'});
  const T=ctx.__t,g={name,T,ctx,LS:ctx.__LS};
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}T.frame(clock);}};
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  return g;
}
const ok=b=>b?'ok':'BAD',SEED=+(process.env.SEED||1);let bad=0;const chk=b=>{if(!b)bad++;return ok(b);};
const yieldNow=()=>new Promise(r=>setImmediate(r));
const blk=(T,x,y,z)=>{const cx=Math.floor(x/16),cz=Math.floor(z/16),A=T.chunkArr(cx,cz);return A[(x-cx*16)+(z-cz*16)*16+y*256];};
function blast(g,x,z,R){const J=g.T.bigBlast(x,g.T.G+1,z,R);let f=0;while(!J.done&&f<60*60){g.step(1);f++;}g.step(30);return J;}
// every column of the crater: [checked, snow not melted]
function snowCheck(T,C,step){let n=0,miss=0;const o=T.bbO(),K=T.bbK(C);
  for(let x=Math.floor(C.x-C.R);x<=C.x+C.R;x+=step)for(let z=Math.floor(C.z-C.R);z<=C.z+C.R;z+=step){T.bbCol(C,K,x,z,o);if(!o.zone)continue;n++;
    if(!(T.snowBorn.get((x+1048576)*4194304+(z+1048576))>=C.w))miss++;}
  return [n,miss];}
(async()=>{
// ---- 1 and 2 ----
const A=game('a',SEED,{});A.play();A.step(120);const T=A.T;
T.WX.k.snow=1;T.WX.snowCover=1;T.WX.snowClock=50;A.step(30);
const cap=T.capitolPlan();console.log('capitol at plot',cap&&cap.ax,cap&&cap.az);
const cx=(cap.ax+cap.w/2)*T.CELL,cz=(cap.az+cap.h/2)*T.CELL;
// put Gus by it, snowy, so the ring reaches him
T.P1.pos.x=cx+40;T.P1.pos.z=cz;T.P1.snowU.value=0.9;A.step(120);T.P1.snowU.value=0.9;
const loadedBefore=new Set(T.chunks.keys());
const J=blast(A,cx,cz,160),C=J.C;
console.log('crater record has the snow clock',C.w,chk(C.w>=50));
console.log('Gus\'s snow melted off',T.P1.snowU.value.toFixed(2),chk(T.P1.snowU.value<0.3));
for(let x=Math.floor(C.x-C.R);x<=C.x+C.R;x+=16)for(let z=Math.floor(C.z-C.R);z<=C.z+C.R;z+=16)T.chunkArr(Math.floor(x/16),Math.floor(z/16));   // (the ones not loaded, made now)
{const [n,m]=snowCheck(T,C,3);console.log('snow melted over the crater: columns',n,'still snowy',m,chk(n>1000&&m===0));}
// outside it: untouched
{let out=0;for(let a=0;a<64;a++){const x=Math.floor(C.x+Math.cos(a)*C.R*1.4),z=Math.floor(C.z+Math.sin(a)*C.R*1.4);if(T.snowBorn.get((x+1048576)*4194304+(z+1048576))>=C.w)out++;}console.log('outside the blast still snowy (melted samples)',out,chk(out===0));}
// the capitol's lawn: none of it left green in the flattened zone
{const o=T.bbO(),K=T.bbK(C);let n=0,green=0;
  for(let x=cap.ax*T.CELL;x<(cap.ax+cap.w)*T.CELL;x++)for(let z=cap.az*T.CELL;z<(cap.az+cap.h)*T.CELL;z++){T.bbCol(C,K,x,z,o);if(o.zone!==3)continue;
    for(let y=T.G+1;y>=T.G-2;y--){const b=blk(T,x,y,z);if(!b)continue;n++;if(b===T.FIELD||b===T.FIELD_L||b===T.GRASS||b===T.FLOWER)green++;break;}}
  console.log('capitol grounds in the flattened zone: columns',n,'still green',green,chk(n>500&&green===0));}
// ---- a stadium ----
let St=null;for(let r=0;r<60&&!St;r++)for(let px=-r;px<=r&&!St;px++)for(let pz=-r;pz<=r;pz++){if(Math.max(Math.abs(px),Math.abs(pz))!==r)continue;const S=T.superOf(Math.floor(T.P1.pos.x/T.CELL)+px,Math.floor(T.P1.pos.z/T.CELL)+pz);if(S&&S.kind==='stadium'){St=S;break;}}
if(!St)console.log('no stadium found near: skipped');
else{const sx=(St.ax+St.w/2)*T.CELL,sz=(St.az+St.h/2)*T.CELL;console.log('stadium at plot',St.ax,St.az);
  const J2=blast(A,sx,sz,160),C2=J2.C,o=T.bbO(),K=T.bbK(C2);let pitch=0,green=0,stand=0,heaped=0;
  for(let x=St.ax*T.CELL;x<(St.ax+St.w)*T.CELL;x++)for(let z=St.az*T.CELL;z<(St.az+St.h)*T.CELL;z++){T.bbCol(C2,K,x,z,o);if(o.zone!==3)continue;
    const g0=blk(T,x,T.G,z),g1=blk(T,x,T.G+1,z),g2=blk(T,x,T.G+2,z);
    if(!g1&&g0){pitch++;if(g0===T.FIELD||g0===T.FIELD_L||g0===T.GRASS)green++;}
    if(g1===T.CONCRETE||g1===T.SEAT_B||g1===T.SEAT_R){stand++;if(g2)heaped++;}}
  console.log('stadium pitch left green',green,'of',pitch,chk(pitch>100&&green===0),'stands with rubble on',heaped,'of',stand,chk(stand>0&&heaped>stand*0.15));}
// ---- a railway through a town ----
{let rx=null;for(let r=0;r<2400&&!rx;r+=8)for(let a=0;a<64&&!rx;a++){const x=Math.floor(T.P1.pos.x+Math.cos(a/64*6.283)*r),z=Math.floor(T.P1.pos.z+Math.sin(a/64*6.283)*r),R=T.railAt(x,z);
   if(R&&Math.abs(R.c)<0.5&&T.settlementAt(Math.floor(x/T.CELL),Math.floor(z/T.CELL)))rx=[x,z];}
 if(rx){console.log('town railway at',rx.join(','));blast(A,rx[0],rx[1],100);}}
{let n=0,torn=0,ball=0,broke=0;const o=T.bbO();
  for(const Cx of T.craters){const K=T.bbK(Cx);for(let x=Math.floor(Cx.x-Cx.R*0.7);x<=Cx.x+Cx.R*0.7;x++)for(let z=Math.floor(Cx.z-Cx.R*0.7);z<=Cx.z+Cx.R*0.7;z++){
    T.bbCol(Cx,K,x,z,o);if(o.zone!==3)continue;const R=T.railAt(x,z);if(!R||Math.abs(R.c)>1.5)continue;n++;T.chunkArr(Math.floor(x/16),Math.floor(z/16));if(T.bbTorn(x+0.5,z+0.5))torn++;
    if(blk(T,x,T.G,z)===T.GRAVEL){ball++;if(blk(T,x,T.G+1,z))broke++;}}}
  console.log('railway in the flattened zone: columns',n,'rails torn up',torn,n?chk(torn===n):'(none here)','ballast',ball,'with rubble on',broke);}
// ---- 3. saved and loaded again ----
await yieldNow();T.save();for(let i=0;i<60;i++){A.step(1);await yieldNow();}
const L=game('reload',SEED,Object.fromEntries(A.LS._m));L.step(2);L.step(30);
{const LT=L.T,C1=LT.craters.find(c=>c.n===C.n);console.log('reloaded: crater keeps its snow clock',C1&&C1.w,chk(C1&&C1.w===C.w),'snow cover',LT.WX.snowCover.toFixed(2));
  if(C1){for(let x=Math.floor(C1.x-C1.R);x<=C1.x+C1.R;x+=16)for(let z=Math.floor(C1.z-C1.R);z<=C1.z+C1.R;z+=16)LT.chunkArr(Math.floor(x/16),Math.floor(z/16));
    const [n,m]=snowCheck(LT,C1,3);console.log('reloaded: snow still melted, columns',n,'snowy again',m,chk(n>1000&&m===0));}}
// ---- 4. no snow ----
{const B=game('b',SEED+5,{});B.play();B.step(120);const TB=B.T;TB.WX.k.snow=0;TB.WX.snowCover=0;const s0=TB.snowBorn.size;const J=blast(B,TB.P1.pos.x+60,TB.P1.pos.z,120);
  console.log('no snow: no snow clock',J.C.w===undefined?'ok':'BAD','snow notes',s0,'->',TB.snowBorn.size,chk(TB.snowBorn.size===s0));}
console.log(bad?'FAILED '+bad:'all ok');
process.exit(bad?1:0);
})().catch(e=>{console.log('ERROR',e&&e.stack||e);process.exit(1);});
