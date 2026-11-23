// ---- territories: the land is divided into realms, each a group of settlements round a capital, with its own name and
// kind of rule (a kingdom, a principality, a free state...). Worked out on a lattice of territory tiles, TER_N cells a
// side, each tile TP settlement grid points across (WORLD_CFG.ter scales it; tvar is how much they vary). A tile's biggest
// place on land is a capital (now and then none: its neighbours share the land), given a head start by tvar; every cell
// then goes to the capital that can reach it most cheaply (Dijkstra over the cells, the tile and the eight round it):
// open land is cheap, the sea and lakes dear, a coastline, a river or a stream dearer to cross, and climbing, height and
// rugged ground dear too, so borders settle along coasts, rivers and mountain ridges. Nothing here touches the world:
// only hash2 with salts of its own and questions asked of the land, so the world's the same with or without it.
// Never asked while a chunk is being made (reliefNat shares its working state), only by maps and the banner ----
var TER=null;   // (a var: worldCfgSet clears it, and coast.js may call that while the page loads, before this file has run)
function terClear(){TER=null;}
const TER_N=24;
// (the sizes: a tile TP grid points across, cells cs plots across; remade when the seed or the settings change)
function terSt(){
  if(!TER||TER.seed!==seed){const W=WORLD_CFG,TP=6*W.ter,TT=TP*SET_SP;
    TER={seed,TP,TT,cs:TT/TER_N,samp:new Map(),seeds:new Map(),tiles:new Map(),info:new Map(),job:null};}
  return TER;}
// ---- the land under each cell (per tile): wet 0 land, 1 sea, 2 a lake; its natural height, ruggedness, and the rivers
// running through it (2 a river, 1 a stream). Sampled a few cells at a time if given a deadline (the banner's warming) ----
function terSamp(tx,tz,dl){
  const T=terSt(),k=tx+','+tz;let s=T.samp.get(k);if(s&&s.done)return s;
  if(!s){s={done:false,n:0,wet:new Uint8Array(TER_N*TER_N),h:new Float32Array(TER_N*TER_N),g:new Float32Array(TER_N*TER_N),riv:new Uint8Array(TER_N*TER_N)};T.samp.set(k,s);}
  const cs=T.cs,N=TER_N,vo=RLF_VON;
  // (the river valleys left out of the heights: they'd want every river round about worked out, and the rivers count anyway)
  RLF_VON=false;
  try{for(;s.n<N*N;s.n++){if(dl&&(s.n&7)===0&&performance.now()>dl)return null;
    const q=s.n,px=(tx*N+q%N+0.5)*cs,pz=(tz*N+Math.floor(q/N)+0.5)*cs;
    if(seaV(px,pz)>SEA_T){s.wet[q]=1;continue;}
    const X=px*CELL,Z=pz*CELL,h=reliefNat(X,Z);s.g[q]=ruggedAt(X,Z);
    if(h<-0.9&&RLF.lake>1)s.wet[q]=2;s.h[q]=Math.max(0,h);}}finally{RLF_VON=vo;}
  // (the rivers: each piece of a line in the tile, marked on the cells it passes through every half a cell. Read straight
  // from the rivers' index, each piece from the square its first point's in, rather than through riversNearBox, which
  // sorts out the repeats over so big a box far more slowly)
  const X0=tx*N*cs*CELL,Z0=tz*N*cs*CELL,cb=cs*CELL,X1=X0+N*cb,Z1=Z0+N*cb;
  for(let x=X0;x<=X1+511;x+=512)for(let z=Z0;z<=Z1+511;z+=512)ensureRivers(Math.min(x,X1),Math.min(z,Z1));
  for(let bx=Math.floor(X0/RT_B)-1;bx<=Math.floor(X1/RT_B)+1;bx++)for(let bz=Math.floor(Z0/RT_B)-1;bz<=Math.floor(Z1/RT_B)+1;bz++){const l=rvIdx.get(bx*100003+bz);if(!l)continue;
    for(let q=0;q<l.length;q+=2){const R=l[q],i=l[q+1],a=R.pts[i],b=R.pts[i+1];if(!b||Math.floor(a[0]/RT_B)!==bx||Math.floor(a[1]/RT_B)!==bz)continue;
      const v=R.trib?1:2,dx=b[0]-a[0],dz=b[1]-a[1],n=Math.max(1,Math.ceil(Math.sqrt(dx*dx+dz*dz)/(cb*0.5)));
      for(let t=0;t<=n;t++){const ci=Math.floor((a[0]+dx*t/n-X0)/cb),cj=Math.floor((a[1]+dz*t/n-Z0)/cb);if(ci<0||cj<0||ci>=N||cj>=N)continue;const c=cj*N+ci;if(s.riv[c]<v)s.riv[c]=v;}}}
  s.done=true;return s;}
// ---- a tile's capital, or null: its biggest place on land (by type, then by hash2), unless the tile's left without one
// (more often the more the sizes vary). off is its head start, in cells' worth of cost ----
const TER_RANK={city:3,large:2,small:1,village:0};
function terSeed(tx,tz){
  const T=terSt(),k=tx+','+tz;let v=T.seeds.get(k);if(v!==undefined)return v;v=null;
  const W=WORLD_CFG,h=i=>hash2(tx*7919+i*101+4513,tz*6271+i*37+3301),TT=T.TT;
  if(h(1)>=0.18*W.tvar){let best=null,bs=-1;
    for(let rx=Math.floor(tx*T.TP)-1;rx<=Math.ceil((tx+1)*T.TP)+1;rx++)for(let rz=Math.floor(tz*T.TP)-1;rz<=Math.ceil((tz+1)*T.TP)+1;rz++){
      const S=settlementLat(rx,rz);if(S.none||S.cx<tx*TT||S.cx>=(tx+1)*TT||S.cz<tz*TT||S.cz>=(tz+1)*TT||seaV(S.cx+0.5,S.cz+0.5)>SEA_T)continue;
      const sc=TER_RANK[S.type]+hash2(rx*313+77,rz*571+19)*0.9;if(sc>bs){bs=sc;best=S;}}
    if(best)v={id:k,tx,tz,S:best,ci:Math.floor((best.cx+0.5)/T.cs),cj:Math.floor((best.cz+0.5)/T.cs),off:(h(2)-0.5)*2*W.tvar*TER_N*0.3};}
  T.seeds.set(k,v);return v;}
// ---- the cells round tile (tx,tz) (it and the eight round it, M a side from its corner (x0,z0)) shared out among the
// capitals given: each to the one it costs least to reach. own is an index into seeds per cell, -1 none ----
function terRun(tx,tz,seeds){
  const N=TER_N,M=N*3,n=M*M,wet=new Uint8Array(n),hh=new Float32Array(n),gg=new Float32Array(n),rv=new Uint8Array(n);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const s=terSamp(tx+a,tz+b),o=(b+1)*N*M+(a+1)*N;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=j*N+i,w=o+j*M+i;wet[w]=s.wet[q];hh[w]=s.h[q];gg[w]=s.g[q];rv[w]=s.riv[q];}}
  const dist=new Float64Array(n).fill(Infinity),own=new Int16Array(n).fill(-1),x0=(tx-1)*N,z0=(tz-1)*N;
  // (a binary heap of cells by cost, ties by index, so it comes out the same everywhere)
  const H=[],less=(p,q)=>dist[p]<dist[q]||dist[p]===dist[q]&&p<q;
  const push=c=>{H.push(c);let i=H.length-1;while(i){const pi=(i-1)>>1;if(!less(H[i],H[pi]))break;[H[i],H[pi]]=[H[pi],H[i]];i=pi;}};
  const pop=()=>{const t=H[0],l=H.pop();if(H.length){H[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<H.length&&less(H[a],H[m]))m=a;if(b<H.length&&less(H[b],H[m]))m=b;if(m===i)break;[H[i],H[m]]=[H[m],H[i]];i=m;}}return t;};
  seeds.forEach((S,si)=>{const i=S.ci-x0,j=S.cj-z0;if(i<0||j<0||i>=M||j>=M)return;const c=j*M+i;if(-S.off<dist[c]){dist[c]=-S.off;own[c]=si;push(c);}});
  const done=new Uint8Array(n),D8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
  while(H.length){const c=pop();if(done[c])continue;done[c]=1;const ci=c%M,cj=(c-ci)/M,ha=hh[c],wa=wet[c];
    for(const [dx,dz,L] of D8){const i=ci+dx,j=cj+dz;if(i<0||j<0||i>=M||j>=M)continue;const e=j*M+i;if(done[e])continue;
      const we=wet[e],he=hh[e],ge=gg[e];
      let w=we===1?10*L:we===2?6*L:L*(1+he/60+2.5*ge*ge);   // (open land cheap; the sea, lakes, height and rugged ground dear)
      if(we!==wa)w+=we===1||wa===1?8:4;   // (a coastline, or a lakeshore)
      if(rv[e]&&!rv[c])w+=rv[e]===2?9:4;   // (across a river or a stream)
      w+=0.12*Math.abs(he-ha);   // (climbing or dropping)
      const d=dist[c]+w;if(d<dist[e]){dist[e]=d;own[e]=own[c];push(e);}}}
  return {own,x0,z0,M};}
// (a capital only stands if, shared out with every other capital round it, it gets at least two places: one alone on
// an island, or crowded out by its neighbours, isn't one, and its land goes to them)
function terSeedOK(S){
  if(S.ok!==undefined)return S.ok;const T=terSt(),seeds=[];
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const Q=terSeed(S.tx+a,S.tz+b);if(Q)seeds.push(Q);}
  const R=terRun(S.tx,S.tz,seeds),me=seeds.indexOf(S),cs=T.cs;let n=0;
  for(let rx=Math.floor((S.tx-1)*T.TP)-1;rx<=Math.ceil((S.tx+2)*T.TP)+1&&n<2;rx++)for(let rz=Math.floor((S.tz-1)*T.TP)-1;rz<=Math.ceil((S.tz+2)*T.TP)+1&&n<2;rz++){
    const P=settlementLat(rx,rz);if(P.none||seaV(P.cx+0.5,P.cz+0.5)>SEA_T)continue;
    const i=Math.floor((P.cx+0.5)/cs)-R.x0,j=Math.floor((P.cz+0.5)/cs)-R.z0;if(i<0||j<0||i>=R.M||j>=R.M)continue;if(R.own[j*R.M+i]===me)n++;}
  return S.ok=n>=2;}
// ---- whose each cell of a tile is: ids (the capitals' tile keys) and lab (an index into ids per cell, 255 none) ----
function terTile(tx,tz){
  const T=terSt(),k=tx+','+tz;let r=T.tiles.get(k);if(r)return r;
  const N=TER_N,seeds=[];
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const S=terSeed(tx+a,tz+b);if(S&&terSeedOK(S))seeds.push(S);}
  const ids=[],lab=new Uint8Array(N*N).fill(255);
  if(seeds.length){const R=terRun(tx,tz,seeds);
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const o=R.own[(j+N)*R.M+i+N];if(o<0)continue;const id=seeds[o].id;let x=ids.indexOf(id);if(x<0){x=ids.length;ids.push(id);}lab[j*N+i]=x;}}
  else{   // (no capital anywhere near, far out at sea: the nearest one further off has it all)
    let best=null,bd=1e9;for(let d=2;d<=4&&!best;d++)for(let a=-d;a<=d;a++)for(let b=-d;b<=d;b++){if(Math.max(Math.abs(a),Math.abs(b))!==d)continue;const S=terSeed(tx+a,tz+b);if(S&&a*a+b*b<bd&&terSeedOK(S)){bd=a*a+b*b;best=S;}}
    if(best){ids.push(best.id);lab.fill(0);}}
  const land=new Uint8Array(N*N);{const s=terSamp(tx,tz);for(let q=0;q<N*N;q++)land[q]=s.wet[q]===0?1:0;}
  r={tx,tz,ids,lab,land};T.tiles.set(k,r);
  if(T.tiles.size>1500)T.tiles.delete(T.tiles.keys().next().value);
  return r;}
// (whose cell (ix,iz) is: the territory's id, or null; terPeekCell only answers from tiles already worked out, and
// undefined for the rest, so per-frame code never works one out)
function terCell(ix,iz){const tx=Math.floor(ix/TER_N),tz=Math.floor(iz/TER_N),R=terTile(tx,tz),l=R.lab[(iz-tz*TER_N)*TER_N+ix-tx*TER_N];return l===255?null:R.ids[l];}
function terPeekCell(ix,iz){const T=terSt(),tx=Math.floor(ix/TER_N),tz=Math.floor(iz/TER_N),R=T.tiles.get(tx+','+tz);if(!R)return undefined;const l=R.lab[(iz-tz*TER_N)*TER_N+ix-tx*TER_N];return l===255?null:R.ids[l];}
// (whose plot (px,pz) is, and a settlement's: its middle's)
const terCellOf=(px,pz)=>{const cs=terSt().cs;return [Math.floor((px+0.5)/cs),Math.floor((pz+0.5)/cs)];};
function terAt(px,pz){const [i,j]=terCellOf(px,pz);return terCell(i,j);}
const terOfSet=S=>terAt(S.cx,S.cz);
// ---- names: goblin-ish bits, as places get (setName), with a realm's ending. The two halves step through their lists
// along the lattice (by sums the seed shifts), so no two territories within a dozen tiles share a name; one that's a
// place's name nearby takes the next ending. The kind of rule is picked by weight, and says how the whole title goes ----
const TER_SUF=['land','ia','mark','shire','reach','march','vania','wold','fen','moor','dale','mire','gard','holm','stan','ovia','ania','realm','heath','marsh','combe','field','hollow','worth','borough'];
const TER_SOV=[['Kingdom',14,'Kingdom of #'],['Principality',8,'Principality of #'],['Duchy',8,'Duchy of #'],['Grand Duchy',4,'Grand Duchy of #'],['Republic',11,'Republic of #'],
  ['Free State',5,'Free State of #'],['Nation',6,'# Nation'],['Empire',4,'# Empire'],['Commonwealth',5,'Commonwealth of #'],['Confederacy',4,'# Confederacy'],['Federation',4,'Federation of #'],
  ['Theocracy',3,'Theocracy of #'],['Tribal Lands',6,'# Tribal Lands'],['Khanate',4,'Khanate of #'],['Chiefdom',6,'Chiefdom of #'],['Dominion',4,'Dominion of #'],['Horde',3,'The # Horde']];
const TER_SOVW=TER_SOV.reduce((s,r)=>s+r[1],0);
function terBase(tx,tz,i){const m=(v,n)=>(v%n+n)%n,c1=Math.floor(hash2(5501,7717)*50),c2=Math.floor(hash2(8807,3323)*25);
  return NM_A[m(tx*7+tz*17+c1+Math.floor(i/25),NM_A.length)]+TER_SUF[m(tx*3+tz*11+c2+i,TER_SUF.length)];}
function terInfo(id){
  if(id==null)return null;const T=terSt();let o=T.info.get(id);if(o)return o;
  const [tx,tz]=id.split(',').map(Number),S=terSeed(tx,tz);if(!S||!terSeedOK(S))return null;
  // (names already taken: the places round about)
  const taken=new Set();
  for(let rx=Math.floor((tx-2)*T.TP);rx<=Math.ceil((tx+3)*T.TP);rx++)for(let rz=Math.floor((tz-2)*T.TP);rz<=Math.ceil((tz+3)*T.TP);rz++){const P=settlementLat(rx,rz);if(!P.none)taken.add(setName(P));}
  let name=terBase(tx,tz,0);for(let i=1;i<50&&taken.has(name);i++)name=terBase(tx,tz,i);
  let w=hash2(tx*4421+9,tz*3301+17)*TER_SOVW,sv=TER_SOV[0];for(const r of TER_SOV){if(w<r[1]){sv=r;break;}w-=r[1];}
  // (a colour of its own, the golden ratio along the lattice so neighbours differ)
  const hue=((tx*0.381966+tz*0.618034+hash2(tx*97+3,tz*89+5)*0.15)%1+1)%1;
  o={id,tx,tz,cap:S.S,name,sov:sv[0],title:sv[2].replace('#',name),hue};T.info.set(id,o);return o;}
// ---- warming: the cells round a tile sampled a little at a time (ms a call), then the tile worked out, so per-frame
// code and the pause map never work out a whole tile in one frame. terWarm gives the territory at a plot once known
// (undefined till then); terLook a cell's from what's worked out already: its id, null for none, false over water ----
function terWarmTile(tx,tz,ms){
  const T=terSt();if(T.tiles.has(tx+','+tz))return true;const dl=performance.now()+ms;
  for(let d=0;d<=2;d++)for(let a=-d;a<=d;a++)for(let b=-d;b<=d;b++)if(Math.max(Math.abs(a),Math.abs(b))===d&&!terSamp(tx+a,tz+b,dl))return false;
  if(performance.now()>dl)return false;terTile(tx,tz);return true;}
function terWarm(px,pz,ms){const [ix,iz]=terCellOf(px,pz);if(!terWarmTile(Math.floor(ix/TER_N),Math.floor(iz/TER_N),ms))return undefined;return terPeekCell(ix,iz);}
function terLook(ix,iz){const T=terSt(),tx=Math.floor(ix/TER_N),tz=Math.floor(iz/TER_N),R=T.tiles.get(tx+','+tz);if(!R)return undefined;
  const q=(iz-tz*TER_N)*TER_N+ix-tx*TER_N,l=R.lab[q];return R.land[q]?(l===255?null:R.ids[l]):false;}
