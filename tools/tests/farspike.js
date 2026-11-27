// What makes updateFar's worst frames while flying fast? Player one is flown in a straight line (updateFar alone, 60 times
// a second, as farspeed.js does) with a list of the plan's questions timed (FN, by name: each one's own time and whatever
// it asks in turn), and it says how many frames went over 8 and 16 ms, what the worst eight spent it on, and each name's
// calls, total and longest single call. A build is meant to stop for breath every few milliseconds: a frame far over
// that is one question that took tens of milliseconds at a stroke (a place's streets worked out cold, setConns, used to).
// Measurements only: compare before and after a change.
// Usage: node farspike.js     (SPD=213 the speed, VIEW=2400, SECS=20, FN=setConns,plotInfo,... the names timed)
const {T,E,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;
const VIEW=+(process.env.VIEW||2400),SECS=+(process.env.SECS||20),V=+(process.env.SPD||213);
T.viewSetting=VIEW;T.farDirty=true;
const P=T.players[0],LODS=T.LODS;
// (each name wrapped where the game looks it up; one that isn't there, or can't be swapped, is left out)
const names=(process.env.FN||'setConns,farCommit,plotInfo,settlementLat,settlementAt,plainsH,farTerrain,farPonds,farWoods,farTownWater,routesNearBox,bigPlainsAt,superOf,farmlandOf,seaPlot,farPack,farUnpack').split(',');
const st={};
for(const n of names){
  try{E(n);E('(f)=>{const o='+n+';'+n+'=function(){const t=performance.now();try{return o.apply(this,arguments);}finally{f(performance.now()-t);}}}')(ms=>{const s=st[n];s.n++;s.ms+=ms;s.max=Math.max(s.max,ms);s.cur+=ms;});st[n]={n:0,ms:0,max:0,cur:0};}
  catch(e){delete st[n];}}
const settle=()=>{for(let i=0;i<3000&&LODS.some(L=>L.job);i++)T.updateFar(1/60);};
P.pos.x=300;P.pos.z=300;T.farDirty=true;T.updateFar(1/60);settle();
for(const k in st){st[k].n=0;st[k].ms=0;st[k].max=0;}
const fr=[];let tot=0;
for(let f=0;f<SECS*60;f++){P.pos.x+=V/60;P.pos.z+=V*0.25/60;for(const k in st)st[k].cur=0;
  const t0=performance.now();T.updateFar(1/60);const d=performance.now()-t0;tot+=d;
  fr.push({d,by:Object.fromEntries(Object.entries(st).map(([k,s])=>[k,s.cur]))});}
fr.sort((a,b)=>b.d-a.d);
console.log('speed',V,'blocks/s | updateFar avg',(tot/fr.length).toFixed(2),'ms worst',fr[0].d.toFixed(1),'| frames over 8 ms:',fr.filter(r=>r.d>8).length,'over 16 ms:',fr.filter(r=>r.d>16).length,'of',fr.length);
console.log('the worst 8 frames:');
for(const r of fr.slice(0,8))console.log('   ',r.d.toFixed(1),'ms |',Object.entries(r.by).filter(([k,v])=>v>0.5).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+' '+v.toFixed(1)).join(', '));
console.log('by name (each with what it asks in turn):');
for(const [k,s] of Object.entries(st).sort((a,b)=>b[1].ms-a[1].ms).slice(0,12))console.log('   ',k.padEnd(16),'calls',String(s.n).padStart(8),'| total',s.ms.toFixed(0).padStart(6),'ms | longest',s.max.toFixed(1),'ms');
console.log('errors',errs.length);
const ok=!errs.length;
console.log(ok?'farspike ok':'farspike FAILED');
process.exit(ok?0:1);
