// Weather by region (render/weather.js): what each spell of weather becomes in each biome (rain as snow in the cold, none
// in the desert and a sandstorm for its storms, the rainforest wetter, fog on moors and swamps), a player in the desert
// in a storm getting a sandstorm, the snow lying in each biome through a clear summer and a winter's snow (never melting
// in the ice fields, white roofs in the tundra, none in the desert), winter freezing water only where it's cold enough,
// the cold map round the player, and the bands going online with the clock. node wxregion.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,biomeAt,BIOMES,wxLocal,wxLocalOf,WX,WX_TYPES,wxSet,snowAt,wxBands,chunkFreeze,COLD,COLD_N,COLD_S,clockState,seasonOf,climAt,landTop,set dayN(v){dayN=v},get dayN(){return dayN},WX_SEAS,');
const errs=[];{const ce=console.error;console.error=(...a)=>{errs.push(a.map(String).join(" ").slice(0,200));};}
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=1e6;A.hpMax=1e6;
const step=k=>{for(let i=0;i<k;i++){for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;}now+=16.7;T.frame(now);}};
step(60);
// a spot of each biome, nearest the start first
const want=['grassland','forest','taiga','tundra','ice','desert','badlands','scrub','savanna','rainforest','swamp','moor'],at={};
for(let r=1;r<=90&&Object.keys(at).length<want.length;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){
  const X=x*400,Z=z*400,k=T.BIOMES[T.biomeAt(X,Z)].k;if(!at[k]){let ok=true;for(const [dx,dz] of [[-64,0],[64,0],[0,-64],[0,64]])if(T.BIOMES[T.biomeAt(X+dx,Z+dz)].k!==k)ok=false;if(ok)at[k]=[X,Z];}}
console.log('spots',want.map(k=>k+(at[k]?' '+at[k].join(','):' none')).join(' | '));
const types=['clear','partly','cloudy','foggy','lrain','rain','hrain','storm','lsnow','snow','blizzard'];
for(const [sn,d] of [['spring',1],['winter',91]]){T.dayN=d;
  console.log('--',sn,'(spell by spell, a few spells each)');
  for(const k of want){if(!at[k])continue;const [x,z]=at[k],row=[];
    for(const ty of types){const seen=new Set();for(let s=0;s<6;s++){T.WX.type=ty;T.WX.until=10+s*0.37;seen.add(T.wxLocal(x,z,G0+1));}row.push(ty+'>'+[...seen].join('/'));}
    console.log(k.padEnd(10),row.join(' '));}}
// high on a mountain: rain comes down as snow
T.dayN=31;{let best=null;for(let i=0;i<4000;i++){const x=((i*7919)%300-150)*200,z=((i*104729)%301-150)*200,bk=T.BIOMES[T.biomeAt(x,z)].k;if(bk==='desert'||bk==='badlands'||bk==='savanna'||bk==='scrub'||bk==='rainforest')continue;const h=T.landTop(x,z)-G0;if(h>60&&(!best||h>best[2]))best=[x,z,h,bk];}
  if(best){T.WX.type='rain';T.WX.until=5;console.log('mountain',best.join(','),'summer rain at the top:',T.wxLocal(best[0],best[1],G0+best[2]),'at the foot:',T.wxLocal(best[0],best[1],G0+1));}else console.log('mountain none found');}
// a storm over the desert, a player standing in it
T.dayN=31;if(at.desert){A.pos.set(at.desert[0],G0+40,at.desert[1]);A.vy=0;T.wxSet('storm',true);step(30);
  let u=T.dayN+5;for(let j=0;j<40;j++){T.WX.until=u;if(T.wxLocal(A.pos.x,A.pos.z,G0+1)==='sand')break;u+=0.13;}
  for(let i=0;i<20;i++){T.WX.until=u;step(60);}
  const k=A.wxk;console.log('desert in a storm: local',A.wxL,'rain',k.rain.toFixed(2),'dust',k.dust.toFixed(2),'fog',k.fog.toFixed(2),'| world spell',T.WX.type,'rain',T.WX.k.rain.toFixed(2));
  const cx=Math.floor(A.pos.x/T.COLD_S),cz=Math.floor(A.pos.z/T.COLD_S),N=T.COLD_N,i=(((cz%N)+N)%N*N+((cx%N)+N)%N)*4;
  console.log('cold map under the player: temperature',(T.COLD[i]/255).toFixed(2),'(climate',T.climAt(A.pos.x,A.pos.z).t.toFixed(2)+') wet',(T.COLD[i+1]/127.5).toFixed(2));}
// the snow lying: a long clear summer, then a winter's snow, then a clear spell in it
const show=lbl=>console.log(lbl.padEnd(26),want.filter(k=>at[k]).map(k=>k+' '+T.snowAt(at[k][0],at[k][1],G0+1).toFixed(2)).join(' '));
T.dayN=31;T.WX.type='clear';Object.assign(T.WX.k,{snow:0,rain:0});for(let i=0;i<1200;i++)T.wxBands(1);T.WX.snowCover=0;show('after a clear summer');
T.dayN=91;Object.assign(T.WX.k,{snow:0.65,rain:0});T.WX.type='snow';for(let i=0;i<200;i++){T.wxBands(1);T.WX.snowCover=Math.min(1,T.WX.snowCover+T.WX.k.snow/70);}show('200s of winter snow');
Object.assign(T.WX.k,{snow:0,rain:0});for(let i=0;i<300;i++){T.wxBands(1);T.WX.snowCover=Math.max(0,T.WX.snowCover-1/600);}show('then 300s clear');
T.dayN=31;Object.assign(T.WX.k,{snow:0,rain:0.65});for(let i=0;i<200;i++)T.wxBands(1);show('200s of summer rain');
// winter's ice
T.WX.frozen=true;console.log('freezes in winter',want.filter(k=>at[k]).map(k=>k+' '+T.chunkFreeze(Math.floor(at[k][0]/16),Math.floor(at[k][1]/16))).join(' '));T.WX.frozen=false;
const cs=T.clockState();console.log('online: the clock carries the bands',JSON.stringify(cs.wx.snowB));
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
`);
process.exit(0);
