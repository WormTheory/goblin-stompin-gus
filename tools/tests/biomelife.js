// Living in each biome (plan phase 4): how many cities, towns and villages each biome has (world/places.js, fewer and
// smaller in the ice fields, tundra, desert, badlands and rainforest), what a town's houses and little shops are built
// of and how steep the houses' roofs are (BIO_TOWN), what the townsfolk and street goblins wear there (lookBiome), and
// the banner naming a biome as you come into it out in the open, and beside a place's name. node biomelife.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,bigPlainsAt,BIGP,get,farmK,BIO_SITE_N,parkSpots,siteProps,biomeAt,biomeOfPlot,BIOMES,bioPick,climAt,settlementLat,settlementAt,setName,plotInfo,plotType,dressGoblin,PB,landTop,seaPlot,SET_SP,CELL,BLK:{STUCCO,SANDSTONE,TERRA,PLANKS,LOG,SIDING,SIDING_Y,BRICK,PAINT_RED,COBBLE,STONE,MOSSSTONE,CONCRETE},');
const errs=[];{const ce=console.error;console.error=(...a)=>{errs.push(a.map(String).join(" ").slice(0,200));};}
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=1e6;A.hpMax=1e6;
const step=k=>{for(let i=0;i<k;i++){for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;}now+=16.7;T.frame(now);}};
step(30);
const bk=i=>T.BIOMES[i].k,BN={};for(const k in T.BLK)BN[T.BLK[k]]=k;
// places by biome, over a square of the lattice
const cnt={};for(let rx=-45;rx<=45;rx++)for(let rz=-45;rz<=45;rz++){const S=T.settlementLat(rx,rz),X=rx*T.SET_SP*T.CELL,Z=rz*T.SET_SP*T.CELL;if(T.seaPlot(rx*T.SET_SP,rz*T.SET_SP))continue;
  const c=T.climAt(X,Z),b=bk(T.bioPick(c.t,c.m,X,Z));(cnt[b]=cnt[b]||{city:0,large:0,small:0,village:0,n:0})[S.type]++;cnt[b].n++;}
console.log('places by biome (on land, of '+91*91+' lattice points):');
for(const b in cnt){const C=cnt[b];console.log('  '+b.padEnd(10),'n',String(C.n).padStart(4),'city',(C.city/C.n*100).toFixed(0).padStart(3)+'%','large',(C.large/C.n*100).toFixed(0).padStart(3)+'%','small',(C.small/C.n*100).toFixed(0).padStart(3)+'%','village',(C.village/C.n*100).toFixed(0).padStart(3)+'%');}
// a town in each biome: its houses' and shops' walls and roofs
const seen={};
for(let r=1;r<=45;r++)for(let i=-r;i<=r;i++)for(const [rx,rz] of [[i,-r],[i,r],[-r,i],[r,i]]){const S=T.settlementLat(rx,rz);
  const px=S.cx,pz=S.cz,b=bk(T.biomeOfPlot(px,pz));if(seen[b]||!T.settlementAt(px,pz))continue;
  const walls={},roofs={},sw={};let homes=0;
  for(let a=-6;a<=6;a++)for(let c=-6;c<=6;c++){const t=T.plotType(px+a,pz+c);if(t!=='homes'&&t!=='shops')continue;const P=T.plotInfo(px+a,pz+c);
    for(const B of P.b){if(t==='homes'&&B.home){homes++;walls[BN[B.wall]||B.wall]=(walls[BN[B.wall]||B.wall]||0)+1;const rk=(B.roofK===undefined?1:B.roofK)+' x'+(B.roofN||0)+'='+B.roof;roofs[rk]=(roofs[rk]||0)+1;}
      else if(t==='shops')sw[BN[B.wall]||B.wall]=(sw[BN[B.wall]||B.wall]||0)+1;}}
  if(!homes)continue;seen[b]=1;
  console.log('town in',b.padEnd(10),T.setName(S).padEnd(22),S.type.padEnd(8),'houses',homes,'walls',JSON.stringify(walls),'roofs (rise a step x steps = height)',JSON.stringify(roofs),'shops',JSON.stringify(sw));}
// what goblins wear: one dressed at each of 60 spots round a spot of each biome
const g=T.goblins.find(q=>q.civ)||T.goblins[0],spots={};g.vendor=null;
for(let r=1;r<=90;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const X=x*400,Z=z*400,b=bk(T.biomeAt(X,Z));if(spots[b])continue;let ok=true;for(const [dx,dz] of [[-64,0],[64,0],[0,-64],[0,64]])if(bk(T.biomeAt(X+dx,Z+dz))!==b)ok=false;if(ok)spots[b]=[X,Z];}
for(const b in spots){const [X,Z]=spots[b],c={};
  for(let k=0;k<60;k++){g.pos.set(X+(k%8)*5,G0+1,Z+Math.floor(k/8)*5);const L=T.dressGoblin(g,true);for(const s of L.show)c[s]=(c[s]||0)+1;c['hat:'+L.hatType]=(c['hat:'+L.hatType]||0)+1;}
  console.log('wear in',b.padEnd(10),Object.keys(c).sort().map(k=>k+' '+c[k]).join(', '));}
// the banner: out in the open from the start's grassland into another biome, then into a place there
const out=(want,town)=>{for(let r=1;r<=300;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const px=x*3,pz=z*3;if(bk(T.biomeOfPlot(px,pz))!==want)continue;if(!!T.settlementAt(px,pz)!==town||T.seaPlot(px,pz))continue;return [px*32+16,pz*32+16];}return null;};
// (the test's page has no body to put the banner on: a stand-in)
if(!T.PB.el)T.PB.el={innerHTML:'',classList:{on:0,add(){this.on=1},remove(){this.on=0},contains(){return !!this.on}}};
const html=()=>T.PB.el?T.PB.el.innerHTML.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim()+(T.PB.el.classList.contains('on')?' [shown]':' [hidden]'):'none';
for(const want of ['desert','taiga']){const s=out(want,false);if(!s){console.log('banner: no open',want);continue;}
  A.pos.set(s[0],T.landTop(s[0],s[1])+1,s[1]);A.vy=0;step(60);const a=html();step(150);console.log('banner, out in the open in',want,': after 1s:',a,'| after 3.5s:',html());
  step(400);const t=out(want,true);if(t){A.pos.set(t[0],T.landTop(t[0],t[1])+1,t[1]);A.vy=0;step(30);console.log('banner, into a place there:',html());}}
// the biome sites: the nearest of each kind (searched plot by plot), its biome, what's built there and its props
{const want=['derricks','peat','research','safari','stilts','ski'],got={},cnt={},farmIce=[0,0];
  for(let r=0;r<=260&&Object.keys(got).length<want.length;r++)for(let i=-r;i<=r;i++)for(const [px,pz] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const B=T.bigPlainsAt(px,pz);if(!B)continue;cnt[B.kind]=(cnt[B.kind]||0)+(B.ax===px&&B.az===pz?1:0);if(want.includes(B.kind)&&!got[B.kind])got[B.kind]=B;}
  console.log('sites within 260 plots (anchors):',JSON.stringify(cnt));
  // (the ice fields are further out: research stations looked for on their own grid, out to 900 plots)
  if(!got.research){let best=null;const K=T.BIGP.find(q=>q.kind==='research');for(let r=0;r<=450&&!best;r++)for(let i=-r;i<=r&&!best;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const ax=a*K.w,az=c*K.h;const p=T.climAt(ax*32+32,az*32+32);if(p.t>0.25)continue;const B=T.bigPlainsAt(ax,az);if(B&&B.kind==='research'){best=B;break;}}if(best)got.research=best;}
  for(const k of want){const B=got[k];if(!B){console.log('site',k,'none found');continue;}
    const X=B.ax*32,Z=B.az*32,bl={};let props=0,cars=0;
    for(let x=X;x<X+B.w*32;x+=2)for(let z=Z;z<Z+B.h*32;z+=2)for(let y=G0-2;y<G0+40;y++){const b=T.get(x,y,z);if(b)bl[b]=(bl[b]||0)+1;}
    for(let a=0;a<B.w;a++)for(let c=0;c<B.h;c++){const P=T.plotInfo(B.ax+a,B.az+c);props+=T.siteProps(P,B.ax+a,B.az+c).length;cars+=T.parkSpots(B.ax+a,B.az+c).length;}
    const top=Object.entries(bl).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([b,n])=>b+':'+n).join(' ');
    console.log('site',k.padEnd(9),'at',B.ax,B.az,'biome',bk(T.biomeOfPlot(B.ax+1,B.az+1)).padEnd(10),'label',T.BIO_SITE_N[k],'| buildings',[...Array(B.w*B.h).keys()].reduce((n,i)=>n+T.plotInfo(B.ax+i%B.w,B.az+Math.floor(i/B.w)).b.length,0),'props',props,'cars',cars,'| blocks (every 2nd column)',top);}
  for(let px=-200;px<=200;px+=2)for(let pz=-200;pz<=200;pz+=2){if(T.farmK(px,pz)===null)continue;farmIce[0]++;if(bk(T.biomeOfPlot(px,pz))==='ice')farmIce[1]++;}
  console.log('farm plots',farmIce[0],'of them in the ice fields',farmIce[1]);}
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
`);
process.exit(0);
