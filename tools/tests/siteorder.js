// Does the world's plan depend on the order it's asked about? It mustn't: two players online, or one player coming at a
// place from another side, would be told different things about the same plot. Every plot of a square round the start
// is asked what big site, farm, dump, bunker, plot type, turbine and airport it has, whether it's open plains and how
// high its middle stands, in four orders (rows forward, rows backward, columns
// backward, shuffled), with everything remembered thrown away in between, and the answers compared plot by plot.
// node siteorder.js [half-width in plots, default 120]   (W=... the same; SEED= the world)
const {T,E,els,pads,run,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;run(1);
const W=+(process.argv[2]||process.env.W||120);
const fresh=()=>{T.worldCfgSet(undefined);T.clearWorld();};
const ask=(px,pz)=>{const B=T.bigPlainsAt(px,pz),fk=T.farmK(px,pz),d=E('dumpAt')(px,pz),bk=E('bunkerAt')(px,pz);
  return (B?B.kind+'@'+B.ax+','+B.az:'-')+'|'+(fk===null?'-':'farm'+fk)+'|'+(d===null||d===undefined?'-':'dump')+'|'+(bk?'bunker':'-')+'|'+T.plotType(px,pz)+'|'+(E('PLAINS_OPEN')(px,pz)?'open':'shut')+'|'+(T.turbineAt(px,pz)?'turbine':'-')+'|'+(E('airportAt')(px,pz)?'airport':'-')+'|h'+T.plainsH(px*32+16.5,pz*32+16.5).toFixed(2);};
const FIELDS=['big site','farm','dump','bunker','plot type','open plains','turbine','airport','height'];
const plots=[];for(let px=-W;px<W;px++)for(let pz=-W;pz<W;pz++)plots.push([px,pz]);
let s=12345;const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
const orders={
  'rows forward':plots,
  'rows backward':[...plots].reverse(),
  'columns backward':[...plots].sort((a,b)=>b[1]-a[1]||b[0]-a[0]),
  'shuffled':[...plots].map(p=>[rnd(),p]).sort((a,b)=>a[0]-b[0]).map(q=>q[1]),
};
const res={};
for(const name in orders){fresh();const m=new Map();for(const [px,pz] of orders[name])m.set(px+','+pz,ask(px,pz));res[name]=m;}
const base=res['rows forward'];let bad=0;
for(const name in orders){if(name==='rows forward')continue;const m=res[name];let n=0;const ex=[];
  const by={};for(const [k,v] of base)if(m.get(k)!==v){n++;const A=v.split('|'),B=m.get(k).split('|');A.forEach((x,i)=>{if(x!==B[i])by[FIELDS[i]]=(by[FIELDS[i]]||0)+1;});if(ex.length<6)ex.push(k+': '+v+'  ->  '+m.get(k));}
  if(n)console.log('    by answer',JSON.stringify(by));
  console.log(name.padEnd(18),'plots answered differently',n,'of',base.size,n?'BAD':'ok');for(const e of ex)console.log('   ',e);bad+=n;}
// and asked twice the same way, to be sure the comparison itself is steady
{fresh();let n=0;for(const [px,pz] of plots)if(ask(px,pz)!==base.get(px+','+pz))n++;console.log('rows forward again'.padEnd(18),'plots answered differently',n,n?'BAD':'ok');bad+=n;}
// and the blocks themselves: the same chunks made in one order and then the other, from nothing each time
{const hash=a=>{let h=2166136261;for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return h>>>0;};
 const cs=[];for(let i=0;i<60;i++)cs.push([Math.floor((rnd()-0.5)*2*W*2),Math.floor((rnd()-0.5)*2*W*2)]);
 const make=L=>{fresh();const m=new Map();for(const [cx,cz] of L)m.set(cx+','+cz,hash(T.genChunk(cx,cz)));return m;};
 const A=make(cs),B=make([...cs].reverse());let n=0;for(const [k,v] of A)if(B.get(k)!==v)n++;
 console.log('chunks made in two orders'.padEnd(26),'different',n,'of',cs.length,n?'BAD':'ok');bad+=n;}
console.log('errors',errs.length,errs.slice(0,3));
console.log(bad||errs.length?'FAILED':'all ok');process.exit(bad||errs.length?1:0);
