// ---- pause screen tabs ----
// ---- the map: every city block anyone has been near is remembered (per city) and drawn from the city plan ----
const MAP_KEY='goblin-stompin-gus-map';let explored=new Set(),exploredSeed=null,exploreT=0,exploreDirty=false,mapSaveT=0;
// the places you've found (any block of them seen): named on the map, with how much of each you've destroyed
const knownSets=new Map();
function noteKnown(px,pz){const S=settlementAt(px,pz);if(S)knownSets.set(S.rx+','+S.rz,S);}
function loadExplored(){explored=new Set();exploredSeed=seed;knownSets.clear();try{const m=JSON.parse(localStorage.getItem(MAP_KEY)||'null');if(m&&m.seed===seed&&Array.isArray(m.cells)){explored=new Set(m.cells);for(const c of m.cells){const [a,b]=c.split(',');noteKnown(+a,+b);}}}catch(e){}}
function saveExplored(){try{localStorage.setItem(MAP_KEY,JSON.stringify({seed,cells:[...explored]}));}catch(e){}}
function updateExplore(dt){
  if(exploredSeed!==seed)loadExplored();
  exploreT-=dt;mapSaveT-=dt;
  if(exploreT<=0){exploreT=0.5;
    for(const p of players){if(!p.active)continue;const cx=Math.floor(p.pos.x/CELL),cz=Math.floor(p.pos.z/CELL);
      for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(dx*dx+dz*dz>5)continue;const k=(cx+dx)+','+(cz+dz);if(!explored.has(k)&&tenvShow(cx+dx,cz+dz)){explored.add(k);exploreDirty=true;noteKnown(cx+dx,cz+dz);}}}}
  if(exploreDirty&&mapSaveT<=0){mapSaveT=5;exploreDirty=false;saveExplored();}
}
// a destroyed building, on the map and minimap: dark grey with pale diagonal hatching (like a rubble site)
const RUIN_SW='repeating-linear-gradient(45deg,#2e3034 0 3px,#a3a7ad 3px 5px)';
const ruinPats=new WeakMap();
function ruinPat(x,px){   // px: stripe repeat in canvas pixels (the minimap draws in world units, so its pattern is tiny)
  const k=px+'';let m=ruinPats.get(x);if(!m){m={};ruinPats.set(x,m);}if(m[k])return m[k];
  const c=document.createElement('canvas'),n=Math.max(2,Math.round(px));c.width=c.height=n;const g=c.getContext('2d');if(!g||!g.fillRect)return'#4a4c50';
  g.fillStyle='#2e3034';g.fillRect(0,0,n,n);g.strokeStyle='#a3a7ad';g.lineWidth=Math.max(0.5,n*0.28);
  g.beginPath();for(const o of [-n,0,n]){g.moveTo(o,n);g.lineTo(o+n,0);}g.stroke();
  return m[k]=x.createPattern(c,'repeat')||'#4a4c50';
}
// a block (or a whole multi-block site) every one of whose buildings is down
// a building shows as a ruin on the maps only once it's actually destroyed (90% of it gone) -- a topple that leaves
// most of it standing doesn't count. Untouched buildings are answered straight away, without working anything out.
function ruinedB(ax,az,i){const key=ax+','+az+','+i;if(!destroyed[key])return false;return !bldgStanding(plotInfo(ax,az).b[i],ax,az,key);}
function blockRuined(px,pz){const S=superOf(px,pz);let ax=px,az=pz;if(S){ax=S.ax;az=S.az;}const P=plotInfo(ax,az);if(!P.b.length)return false;
  for(let i=0;i<P.b.length;i++)if(!ruinedB(ax,az,i))return false;return true;}
// the wasteland: fully destroyed blocks, joined across the streets between them (and the junctions in the middle of four),
// as fill rectangles plus the outline round the outside, in world coordinates. On a grid of half-cells: for each block,
// the street strip on its low side and then the block itself.
function ruinGrid(c0,c1,r0,r1,ok){
  const memo=new Map(),isR=(px,pz)=>{const k=px*100003+pz;let v=memo.get(k);if(v===undefined){v=(!ok||ok(px,pz))&&mapDead(px,pz);memo.set(k,v);}return v;};
  const half=i=>{const p=Math.floor(i/2);return[p,i-2*p];};
  const inG=(i,j)=>{const [px,sx]=half(i),[pz,sz]=half(j);
    if(sx&&sz)return isR(px,pz);if(!sx&&sz)return isR(px-1,pz)&&isR(px,pz);if(sx&&!sz)return isR(px,pz-1)&&isR(px,pz);
    return isR(px-1,pz-1)&&isR(px,pz-1)&&isR(px-1,pz)&&isR(px,pz);};
  const lo=i=>{const [p,s]=half(i);return p*CELL+(s?ROADW:0);},hi=i=>{const [p,s]=half(i);return s?(p+1)*CELL:p*CELL+ROADW;};
  const cells=[],edges=[];
  for(let i=2*c0;i<=2*c1+1;i++)for(let j=2*r0;j<=2*r1+1;j++){if(!inG(i,j))continue;const a=lo(i),b=lo(j),c=hi(i),d=hi(j);cells.push([a,b,c,d]);
    if(!inG(i-1,j))edges.push([a,b,a,d]);if(!inG(i+1,j))edges.push([c,b,c,d]);if(!inG(i,j-1))edges.push([a,b,c,b]);if(!inG(i,j+1))edges.push([a,d,c,d]);}
  return{cells,edges};
}
const MAPC={nuclear:'#c8c850',tower5g:'#c8c8d0',prepper:'#7a6a3a',militia:'#3a4a2a',ruins:'#8a8a78',thieves:'#2a2420',wind:'#f0f4f4',campsite:'#6a9a4a',cult:'#5a1a24',mine:'#6a5a48',quarry:'#a8a090',lumber:'#4a6a2a',base:'#5a6a3a',airport:'#8a9aa8',nasa:'#e8e8f0',theme:'#f05a8a',nuclear:'#d8d03a',arena:'#e07a2a',campus:'#a03a4a',prison:'#5a5a5a',jail:'#6a6a6a',water:'#4a9ad8',power:'#8a8a3a',zoo:'#5aa83a',studio:'#d0a04a',lab:'#3ad04a',castle:'#9a9a8a',ikea:'#0058a3',cathedral:'#c8b890',museum:'#d8c8a0',aquarium:'#3aa0d8',casino:'#e04ab0',school:'#c87a4a',factory:'#7a6a5a',datacenter:'#4a5a6a',electric:'#d8c83a',dump:'#7a6a50',derelict:'#6a6258',mansion:'#d8b0a0',trailers:'#a8a078',camp:'#8a7a5a',farmers:'#d0904a',nursery:'#5aa04a',dealer:'#4a8ad0',armory:'#8a4a3a',theater:'#a0283a',stocks:'#c8c0a0',court:'#3e766c',cemetery:'#5c6e58',church:'#a89880',library:'#8a6a4a',cinema:'#b03a4a',radio:'#d05a5a',news:'#3a5a9a',bank:'#c8a84a',disco:'#b04ac8',club:'#4aa04a',shops:'#c0607a',wtower:'#b8c4cc',bell:'#9a8a70',market:'#2f9a8a',drug:'#d0506a',food:'#c86a3a',fastfood:'#e0a030',sitdown:'#a0522d',fire:'#b8302a',build:'#a89060',ramp:'#5a6a4a',plains:'#6c9448',field:'#9a8a4a',orchard:'#4c7a32',truckstop:'#e0a52e',farm:'#b0503a',road:'#3a3f45',walk:'#565b5f',tower:'#4a5a70',mid:'#7a6450',park:'#3f8a3a',plaza:'#9a9a90',police:'#3456a8',grocery:'#2f9a8a',homes:'#c8a870',
  gas:'#c8433a',garage:'#6c7076',hospital:'#e8eaec',mall:'#9a52b8',stadium:'#56b04a',capitol:'#e8c35a',ghw:'#b07a3a',bigbox:'#2f7fd0',mega:'#5e7f9a',bigpark:'#3a9a3a',river:'#2f6fc8',highway:'#e8963a',empty:'#4a4f53',metro:'#3a6ad0',rail:'#3a3036',sea:'#2a5f9e',rig:'#c8c040',beach:'#d8c890',harbor:'#9a9488',yard:'#8f949a',navy:'#5c6672',lighthouse:'#e04040'};
const MAP_LEG=[['base','Military bases'],['airport','Airports'],['mine','Mines'],['quarry','Quarries'],['lumber','Lumber camps'],['campsite','Campsites'],['cult','Cult altars'],['tower5g','5G towers'],['prepper','Prepper compounds'],['militia','Militia compounds'],['ruins','Ruins'],['thieves',"Thieves' hideouts"],['wind','Wind farms'],['nasa','Launch sites'],['theme','Theme parks'],['nuclear','Nuclear plants'],['arena','Arenas'],['campus','Universities'],['prison','Prisons'],['jail','Jails'],['water','Water works'],['power','Power stations'],['zoo','Zoos'],['studio','Film studios'],['lab','Goblin labs'],['ikea','Furniture superstores'],['cathedral','Cathedrals'],['museum','Museums'],['aquarium','Aquariums'],['casino','Casinos'],['school','Schools'],['factory','Factories'],['datacenter','Data centers'],['electric','Electric company'],['dump','Garbage dumps'],['derelict','Abandoned buildings'],['mansion','Mansions'],['trailers','Trailer parks'],['camp','Encampments'],['farmers',"Farmer's markets"],['nursery','Tree nurseries'],['dealer','Car dealers'],['armory','Armories'],['theater','Theatres'],['stocks','Stock exchange'],['church','Churches'],['cemetery','Cemeteries'],['library','Libraries'],['cinema','Cinemas'],['bank','Banks'],['disco','Discos'],['club','Night clubs'],['news','TV news'],['radio','Radio stations'],['court','Basketball courts'],['shops','Little shops & bars'],['wtower','Water towers'],['bell','Bell towers'],['ramp','Interchanges'],['food','Restaurants'],['fastfood','Fast food'],['sitdown','Sit-down restaurants'],['fire','Fire stations'],['build','Building sites'],['plains','Plains'],['farm','Farms'],['truckstop','Truck stops'],['tower','Towers'],['mid','Mid-rises'],['homes','Homes'],['park','Parks'],['plaza','Plazas'],['market','Supermarkets'],['drug','Drugstores'],['gas','Gas stations'],['police','Police'],
  ['hospital','Hospitals'],['garage','Car parks'],['mall','Malls'],['bigbox','Superstores'],['mega','Mega-buildings'],['stadium','Stadiums'],['capitol','The capitol'],['river','Rivers'],['rail','Railways'],['sea','Ocean'],['beach','Beaches'],['yard','Shipping ports'],['navy','Naval bases'],['lighthouse','Lighthouses'],['rig','Oil rigs'],['ghw','Country highways'],['ruin','Destroyed'],['highway','Highways']];
// the sea on the maps: each block sampled on a grid (water, beach, land), ports and harbours in their own colours
const seaMapC=new Map();
function seaMapCells(px,pz,n){
  const k=(px*100003+pz)*8+n;let v=seaMapC.get(k);if(v)return v;
  const t=plotType(px,pz),st=CELL/n;v=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=px*CELL+(i+0.5)*st,z=pz*CELL+(j+0.5)*st;let c;
    if(t==='yard'||t==='navy')c=MAPC[t];else if(t==='basin'||t==='nbasin')c=MAPC.sea;
    else{const cd=coastD(x,z);
      if(cd>=0){const f=Math.min(1,cd/80);c='rgb('+Math.round(70-46*f)+','+Math.round(128-66*f)+','+Math.round(196-82*f)+')';}   // (shallows light, the deep ocean dark)
      else c=t==='harbor'&&cd>-9?MAPC.harbor:t==='beach'&&cd>-17?MAPC.beach:t==='beach'&&cd>-21?'#a07a50':cd>-7?(t==='rig'||t==='wreck'?MAPC.sea:gridNoise(x/CELL,z/CELL,7,77)>0.12?'#8a8a80':MAPC.beach):MAPC.plains;}
    if(t==='rig'&&Math.abs(i*st+st/2-16)<12&&Math.abs(j*st+st/2-16)<12)c='#c8c040';
    if(t==='lighthouse'){const P=plotInfo(px,pz);if(Math.abs(i*st+st/2-P.lh.x)<st&&Math.abs(j*st+st/2-P.lh.z)<st)c=MAPC.lighthouse;}
    v.push(c);}
  if(seaMapC.size>20000)seaMapC.clear();seaMapC.set(k,v);return v;
}
const MAPV={cx:null,cz:null,ppb:1.6,hl:null};   // hl: the legend entry being pointed at, lit up on the map   // centre (blocks) and pixels per block
function mapPan(dx,dy){if(MAPV.cx===null)return;MAPV.cx+=dx/MAPV.ppb;MAPV.cz+=dy/MAPV.ppb;renderMap();}
function mapZoom(k){MAPV.ppb=Math.max(0.35,Math.min(8,MAPV.ppb*k));renderMap();}
// back to where you are
function mapRecentre(){MAPV.cx=null;renderMap();}
function renderMap(){
  const cv=document.getElementById('mapCanvas');if(!cv||!cv.getContext)return;
  if(exploredSeed!==seed)loadExplored();
  const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(200,cv.clientWidth||600),h=Math.max(200,cv.clientHeight||400);
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  const x=cv.getContext('2d');if(!x||!x.fillRect)return;x.setTransform(dpr,0,0,dpr,0,0);
  const me=players.find(p=>p.active)||players[0];
  if(MAPV.cx===null){MAPV.cx=me.pos.x;MAPV.cz=me.pos.z;}
  const k=MAPV.ppb,ox=w/2-MAPV.cx*k,oz=h/2-MAPV.cz*k,X=v=>ox+v*k,Z=v=>oz+v*k;
  x.fillStyle='#0b0f13';x.fillRect(0,0,w,h);
  const c0=Math.floor((MAPV.cx-w/2/k)/CELL)-1,c1=Math.ceil((MAPV.cx+w/2/k)/CELL)+1,r0=Math.floor((MAPV.cz-h/2/k)/CELL)-1,r1=Math.ceil((MAPV.cz+h/2/k)/CELL)+1;
  // everything drawn is tagged with its legend entry; the one being pointed at is drawn again, bright, over a dimmed map
  const HL=MAPV.hl,hits=[];
  const ruins=[];   // destroyed buildings, drawn last so they stand out
  const rect=(x0,z0,x1,z1,col,cat)=>{const a=X(x0),b=Z(z0),ww=(x1-x0)*k+0.6,hh=(z1-z0)*k+0.6;x.fillStyle=col;x.fillRect(a,b,ww,hh);if(HL&&cat===HL)hits.push([a,b,ww,hh,col]);};
  let seenCap=null;
  for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++){
    if(!explored.has(px+','+pz))continue;
    const X0=px*CELL,Z0=pz*CELL,t=plotType(px,pz);
    if(seaPlot(px,pz)){const n=8,st=CELL/n,C=seaMapCells(px,pz,n),key=t==='yard'||t==='basin'?'yard':t==='navy'||t==='nbasin'?'navy':t==='lighthouse'?'lighthouse':t==='beach'?'beach':t==='rig'?'rig':'sea';
      for(let j=0;j<n;j++)for(let i=0;i<n;i++)rect(X0+i*st,Z0+j*st,X0+(i+1)*st,Z0+(j+1)*st,C[j*n+i],key);continue;}
    if(biomeOf(px,pz)==='plains'){
      rect(X0,Z0,X0+CELL,Z0+CELL,MAPC.plains,'plains');
      {const FL=farmLane(px,pz);if(FL)rect(X0+PC-1,FL.z0,X0+PC+1,FL.z1,'#a89a78','farm');}
      if(t==='truckstop'){const P=plotInfo(px,pz);for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,MAPC.truckstop,'truckstop');}
      if(t==='dump')rect(X0+1,Z0+1,X0+CELL-1,Z0+CELL-1,MAPC.dump,'dump');
      if(turbineAt(px,pz))rect(X0+13,Z0+13,X0+19,Z0+19,MAPC.wind,'wind');
      if(t==='castle')rect(X0+5,Z0+5,X0+CELL-5,Z0+CELL-5,MAPC.castle,'castle');
      if(t==='nuclear'||t==='base'||t==='airport'||t==='nasa'||t==='mine'||t==='quarry'||t==='lumber'||t==='campsite'||t==='cult'||t==='tower5g'||t==='prepper'||t==='militia'||t==='ruins'||t==='thieves'){rect(X0,Z0,X0+CELL,Z0+CELL,MAPC[t],t);const P=plotInfo(px,pz);for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,'#3a3f45',t);}
      {const FD=t==='plains'&&farmlandOf(px,pz);if(FD)rect(X0,Z0,X0+CELL,Z0+CELL,FD.kind==='orchard'?MAPC.orchard:MAPC.field,'farm');}
      if(t==='farm'){const P=plotInfo(px,pz);if(P.north)rect(X0+PC-1,Z0+P.field.z1,X0+PC+1,Z0+CELL,'#a89a78','farm');else rect(X0+PC-1,Z0,X0+PC+1,Z0+P.field.z0,'#a89a78','farm');rect(X0+P.field.x0,Z0+P.field.z0,X0+P.field.x1,Z0+P.field.z1,MAPC.field,'farm');for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,MAPC.farm,'farm');}
      continue;
    }
    rect(X0,Z0,X0+CELL,Z0+CELL,MAPC.road);
    if(t==='river'){
      const row=riverDir(px,pz)==='x';
      if(row)rect(X0,Z0+ROADW+2,X0+CELL,Z0+CELL-2,MAPC.river,'river');else rect(X0+ROADW+2,Z0,X0+CELL-2,Z0+CELL,MAPC.river,'river');
      continue;
    }
    if(t==='super'){
      // this block's share of the merged site (its own streets are gone)
      const S=superOf(px,pz),lx0=px===S.ax?ROADW:0,lz0=pz===S.az?ROADW:0;
      rect(X0+lx0,Z0+lz0,X0+CELL,Z0+CELL,MAPC.walk);
      const sx0=S.ax*CELL+PL0,sz0=S.az*CELL+PL0,sx1=(S.ax+S.w-1)*CELL+PL1,sz1=(S.az+S.h-1)*CELL+PL1;
      const ix0=Math.max(sx0,X0),iz0=Math.max(sz0,Z0),ix1=Math.min(sx1,X0+CELL),iz1=Math.min(sz1,Z0+CELL);
      if(ix1>ix0&&iz1>iz0)rect(ix0,iz0,ix1,iz1,S.kind==='bigpark'?MAPC.bigpark:(MAPC[S.kind]||MAPC.mega),S.kind==='bigpark'?'park':MAPC[S.kind]?S.kind:'mega');
      if(S.kind==='capitol')seenCap=S;
      // buildings of the site, drawn darker, clipped to this block
      if(S.kind!=='bigpark'&&S.kind!=='stadium'){const P=plotInfo(S.ax,S.az),AX=S.ax*CELL,AZ=S.az*CELL;x.fillStyle='rgba(0,0,0,0.28)';
        P.b.forEach((b,bi)=>{const bx0=Math.max(AX+b.x0,X0),bz0=Math.max(AZ+b.z0,Z0),bx1=Math.min(AX+b.x1,X0+CELL),bz1=Math.min(AZ+b.z1,Z0+CELL);if(bx1>bx0&&bz1>bz0){const ru=ruinedB(S.ax,S.az,bi);if(ru){if(!blockRuined(S.ax,S.az))ruins.push([bx0,bz0,bx1,bz1]);}else{x.fillStyle='rgba(0,0,0,0.28)';x.fillRect(X(bx0),Z(bz0),(bx1-bx0)*k,(bz1-bz0)*k);}}});}
      continue;
    }
    rect(X0+ROADW,Z0+ROADW,X0+CELL,Z0+CELL,MAPC.walk);
    {const a=jz(px,pz),b=jx(px,pz),JC={alley:'#24282c',yard:'#4f7a3e'};if(a)rect(X0,Z0+ROADW,X0+ROADW,Z0+CELL,JC[a]);if(b)rect(X0+ROADW,Z0,X0+CELL,Z0+ROADW,JC[b]);}
    {const B=plotBounds(px,pz);rect(X0+B.x0,Z0+B.z0,X0+B.x1,Z0+B.z1,t==='park'?MAPC.park:t==='plaza'?MAPC.plaza:t==='homes'?'#5f8a46':t==='ramp'?MAPC.ramp:'#4a4f53',(t==='park'||t==='plaza'||t==='homes'||t==='ramp')?t:null);}
    const P=plotInfo(px,pz),col=MAPC[t]||'#777';
    P.b.forEach((b,bi)=>{if(ruinedB(px,pz,bi)){if(!blockRuined(px,pz))ruins.push([X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1]);}else rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,col,t);});
  }
  // the rivers winding across the plains (through the places they're blocks of their own, drawn above)
  {const L=riversNearBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL);x.strokeStyle=MAPC.river;x.lineWidth=Math.max(1.5,RIV_W*2*k);x.lineCap='round';x.beginPath();
   for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1],[ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],mx=(ax+bx)/2,mz=(az+bz)/2,px=Math.floor(mx/CELL),pz=Math.floor(mz/CELL);
     if(!explored.has(px+','+pz)||settlementAt(px,pz))continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));}
   x.stroke();}
  // the ruins: hatched, outlined in red
  {const pat=ruinPat(x,7),RG=ruinGrid(c0,c1,r0,r1,(px,pz)=>explored.has(px+','+pz));
   x.fillStyle=pat;for(const [x0,z0,x1,z1] of RG.cells)x.fillRect(X(x0),Z(z0),(x1-x0)*k+0.6,(z1-z0)*k+0.6);
   x.strokeStyle='#e0503c';x.lineWidth=1.5;x.beginPath();for(const [a,b,c,d] of RG.edges){x.moveTo(X(a),Z(b));x.lineTo(X(c),Z(d));}x.stroke();
   if(HL==='ruin')for(const [x0,z0,x1,z1] of RG.cells)hits.push([X(x0),Z(z0),(x1-x0)*k,(z1-z0)*k,'#a3a7ad']);
   for(const [x0,z0,x1,z1] of ruins){const a=X(x0),b=Z(z0),ww=(x1-x0)*k,hh=(z1-z0)*k;x.fillStyle=pat;x.fillRect(a,b,ww,hh);x.strokeStyle='#e0503c';x.lineWidth=1.5;x.strokeRect(a+0.75,b+0.75,ww-1.5,hh-1.5);if(HL==='ruin')hits.push([a,b,ww,hh,'#a3a7ad']);}}
  // the railways you've seen
  {x.strokeStyle=MAPC.rail;x.lineWidth=Math.max(2,4*k);x.lineCap='butt';x.beginPath();
   for(const L of railLinksInBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL))for(let i=0;i+4<L.L;i+=4){const [ax,az]=L.pts[i],[bx,bz]=L.pts[Math.min(L.L-1,i+4)];
     if(!explored.has(Math.floor(ax/CELL)+','+Math.floor(az/CELL)))continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));if(HL==='rail')hits.push([X(Math.min(ax,bx))-2,Z(Math.min(az,bz))-2,Math.abs(bx-ax)*k+4,Math.abs(bz-az)*k+4,'#8a7a80']);}
   x.stroke();}
  // raised highways over the streets you've seen
  x.fillStyle='rgba(232,150,58,0.85)';
  for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++){if(!explored.has(px+','+pz))continue;const X0=px*CELL,Z0=pz*CELL;
    if(hwRow(pz,px)){x.fillRect(X(X0),Z(Z0-3),CELL*k+0.6,14*k);if(HL==='highway')hits.push([X(X0),Z(Z0-3),CELL*k+0.6,14*k,'#e8963a']);}
    if(hwCol(px,pz)){x.fillRect(X(X0-3),Z(Z0),14*k,CELL*k+0.6);if(HL==='highway')hits.push([X(X0-3),Z(Z0),14*k,CELL*k+0.6,'#e8963a']);}}
  // the ground highways across the plains
  x.fillStyle='rgba(176,122,58,0.9)';
  for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++){if(!explored.has(px+','+pz)||biomeOf(px,pz)!=='plains')continue;const X0=px*CELL,Z0=pz*CELL;
    if(gRow(pz,X0+16)){x.fillRect(X(X0),Z(Z0-3),CELL*k+0.6,14*k);if(HL==='ghw')hits.push([X(X0),Z(Z0-3),CELL*k+0.6,14*k,'#b07a3a']);}
    if(gCol(px,Z0+16)){x.fillRect(X(X0-3),Z(Z0),14*k,CELL*k+0.6);if(HL==='ghw')hits.push([X(X0-3),Z(Z0),14*k,CELL*k+0.6,'#b07a3a']);}}
  // the highways out across the plains on their own lines (motorways over the country highways), and the truck stops
  {const L=routesNearBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL),seen=new Set();
   for(const kind of ['country','moto']){x.strokeStyle=kind==='moto'?'rgba(232,150,58,0.95)':'rgba(176,122,58,0.95)';x.lineWidth=Math.max(1.5,14*k);x.lineCap='butt';x.beginPath();
     for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1];if(R.kind!==kind)continue;const [ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],px=Math.floor((ax+bx)/2/CELL),pz=Math.floor((az+bz)/2/CELL);
       if(!explored.has(px+','+pz)||settlementAt(px,pz))continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));
       if(HL===(kind==='moto'?'highway':'ghw'))hits.push([Math.min(X(ax),X(bx))-1,Math.min(Z(az),Z(bz))-1,Math.abs(X(bx)-X(ax))+2,Math.abs(Z(bz)-Z(az))+2,kind==='moto'?'#e8963a':'#b07a3a']);}
     x.stroke();}
   for(let q=0;q<L.length;q+=2){const R=L[q];if(R.kind!=='country'||seen.has(R))continue;seen.add(R);for(const T of truckStopOf(R)){if(!explored.has(Math.floor(T.cx/CELL)+','+Math.floor(T.cz/CELL)))continue;
     const c=(u,v)=>[X(T.cx+T.tx*u+T.nx*v),Z(T.cz+T.tz*u+T.nz*v)];x.fillStyle=MAPC.road;x.beginPath();for(const [u,v] of [[-44,7],[44,7],[44,58],[-44,58]]){const [a,b]=c(u,v);x.lineTo(a,b);}x.closePath();x.fill();
     x.fillStyle=MAPC.truckstop;x.beginPath();for(const [u,v] of [[-26,11],[26,11],[26,27],[-26,27]]){const [a,b]=c(u,v);x.lineTo(a,b);}x.closePath();x.fill();
     const bp=[Math.floor((T.cx+T.nx*47)/CELL),Math.floor((T.cz+T.nz*47)/CELL)];for(const b of plotInfo(bp[0],bp[1]).b)rect(bp[0]*CELL+b.x0,bp[1]*CELL+b.z0,bp[0]*CELL+b.x1,bp[1]*CELL+b.z1,MAPC.truckstop,'truckstop');}}}
  // their slip roads and cloverleaves
  {x.fillStyle='rgba(232,150,58,0.7)';const seen=new Set(),box=(ax0,az0,ax1,az1)=>{const a=X(Math.min(ax0,ax1)),b=Z(Math.min(az0,az1)),ww=Math.abs(ax1-ax0)*k+0.4,hh=Math.abs(az1-az0)*k+0.4;x.fillRect(a,b,ww,hh);if(HL==='ramp')hits.push([a,b,ww,hh,'#e8963a']);};
   for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++){if(!explored.has(px+','+pz))continue;
     const cv=cloverOf(px,pz);
     if(cv&&!seen.has('c'+cv.j+','+cv.k)){seen.add('c'+cv.j+','+cv.k);const cx=cv.j*CELL+4,cz=cv.k*CELL+4;
       for(let n=0;n<4;n++)for(const o of CLV)if(o.t==='deck'||o.t==='slope'){const [a0,b0]=cvRot(n,o.p0,o.q0),[a1,b1]=cvRot(n,o.p1,o.q1);box(cx+a0,cz+b0,cx+a1,cz+b1);}}
     for(const [ax,kk,m] of [['x',pz,px],['x',pz+1,px],['z',px,pz],['z',px+1,pz]]){
       if(!(ax==='x'?hwRow(kk,m):hwCol(kk,m)))continue;const m0=icOf(ax,kk,m);if(m0===null||seen.has(ax+kk+','+m0))continue;seen.add(ax+kk+','+m0);
       const HY=ax==='x'?HY_X:HY_Z,base=kk*CELL;
       for(const side of [1,-1])for(const R of icRamps(ax,m0,side,HY)){const c0=base+(side>0?12:-8);if(ax==='x')box(R.a0,c0,R.a1,c0+4);else box(c0,R.a0,c0+4,R.a1);}
     }}}
  // the highlighted legend entry: everything else dims, its own pieces come back bright with an outline
  if(HL){x.fillStyle='rgba(8,10,14,0.74)';x.fillRect(0,0,w,h);
    for(const [a,b,ww,hh,col] of hits){x.fillStyle=col;x.fillRect(a,b,ww,hh);}
    x.strokeStyle='#ffe27a';x.lineWidth=1.2;for(const [a,b,ww,hh] of hits)x.strokeRect(a+0.5,b+0.5,Math.max(1,ww-1),Math.max(1,hh-1));}
  // the places you've found: each one's name over its middle, and how much of it you've destroyed
  {x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
   for(const S of knownSets.values()){const sx=X(S.cx*CELL+CELL/2),sz=Z(S.cz*CELL+CELL/2);if(sx<-120||sx>w+120||sz<-40||sz>h+40)continue;
     const big=S.type==='city'?15:S.type==='large'?13.5:12;
     x.font='800 '+big+'px "Atkinson Hyperlegible Next", system-ui, sans-serif';x.lineWidth=3.5;x.strokeStyle='rgba(0,0,0,0.85)';x.strokeText(setName(S),sx,sz-14);x.fillStyle='#fff3d6';x.fillText(setName(S),sx,sz-14);
     {const kn=PLACE_KIND[setKind(S)];x.font='700 12px "Atkinson Hyperlegible Next", system-ui, sans-serif';x.lineWidth=3;x.strokeText(kn,sx,sz+1);x.fillStyle='#ffe9b0';x.fillText(kn,sx,sz+1);}
     const kk=S.rx+','+S.rz,v=setListC.has(kk)?setDestroyed(S):null,t=v===null?'Destroyed: ?':'Destroyed: '+Math.round(v*100)+'%';
     x.font='700 12px "Atkinson Hyperlegible Next", system-ui, sans-serif';x.lineWidth=3;x.strokeText(t,sx,sz+15);x.fillStyle=v===null?'#c8c8c0':v>=1?'#ff6a50':v>0?'#ffb08a':'#cfe8c0';x.fillText(t,sx,sz+15);}
   x.textAlign='start';x.textBaseline='alphabetic';}
  // the capitol: a star on the dome
  if(seenCap){const g=capGeo(),sx=X(seenCap.ax*CELL+PL0+g.c),sz=Z(seenCap.az*CELL+PL0+g.dc);x.fillStyle='#ffe27a';x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?4:9;x.lineTo(sx+Math.cos(a)*rr,sz+Math.sin(a)*rr);}x.closePath();x.fill();}
  // you (and your friend): arrows pointing the way you face
  for(const p of players){if(!p.active)continue;const px=X(p.pos.x),pz=Z(p.pos.z),hx=Math.sin(p.heading),hz=Math.cos(p.heading);
    x.fillStyle=p.idx?'#f08ac0':'#ffffff';x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();
    x.moveTo(px+hx*11,pz+hz*11);x.lineTo(px-hx*6+hz*6,pz-hz*6-hx*6);x.lineTo(px-hx*3,pz-hz*3);x.lineTo(px-hx*6-hz*6,pz-hz*6+hx*6);x.closePath();x.fill();x.stroke();}
  const note=document.getElementById('mapNote');
  if(note)note.textContent=explored.size+' city blocks explored. Drag to pan, scroll to zoom; on a controller, the right stick pans and the triggers zoom.';
}
// the legend, and mouse panning / zooming
{const lg=document.getElementById('mapLegend');
 if(lg){lg.innerHTML=MAP_LEG.map(([k,n])=>'<li tabindex="0" data-k="'+k+'"><i style="background:'+(k==='ruin'?RUIN_SW+';outline:1px solid #e0503c':MAPC[k]||'#e8963a')+'"></i>'+n+'</li>').join('');
  const setHl=k=>{if(MAPV.hl===k)return;MAPV.hl=k;for(const li of lg.querySelectorAll('li'))li.classList.toggle('on',li.dataset.k===k);renderMap();};
  for(const li of lg.querySelectorAll('li')){li.addEventListener('mouseenter',()=>setHl(li.dataset.k));li.addEventListener('focus',()=>setHl(li.dataset.k));
    li.addEventListener('mouseleave',()=>{if(document.activeElement!==li)setHl(null);});li.addEventListener('blur',()=>setHl(null));}}
 const cv=document.getElementById('mapCanvas');let drag=null;const ptrs=new Map();let pinch=0;
 if(cv&&cv.addEventListener){
  // one finger (or the mouse) drags the map; two fingers pinch to zoom
  const spread=()=>{const v=[...ptrs.values()];return v.length>=2?Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y):0;};
  cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};pinch=spread();cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size>=2){const d=spread();if(pinch>0&&d>0)mapZoom(d/pinch);pinch=d;drag=null;return;}
    if(!drag)return;mapPan(-(e.clientX-drag.x),-(e.clientY-drag.y));drag={x:e.clientX,y:e.clientY};});
  const up=e=>{ptrs.delete(e.pointerId);pinch=spread();drag=null;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('dblclick',()=>mapRecentre());
  cv.addEventListener('wheel',e=>{e.preventDefault();mapZoom(e.deltaY<0?1.15:1/1.15);},{passive:false});
 }
 addEventListener('keydown',e=>{if(menuOpen&&curTab==='map'&&e.code==='KeyC'&&!e.repeat)mapRecentre();});
 addEventListener('resize',()=>{if(menuOpen&&curTab==='map')renderMap();});
}
const TABS=[['game','Game'],['map','Map'],['obit','Obit'],['custom','Custom'],['controls','Controls'],['options','Options'],['notes','Notes'],['dev','Dev']];let curTab='game';
function showTab(which){
  if(typeof which==='number')which=TABS[(which+TABS.length)%TABS.length][0];
  curTab=which;
  for(const [t,id] of TABS){const on=t===which;document.getElementById('tab'+id).hidden=!on;document.getElementById('tabBtn'+id).setAttribute('aria-selected',String(on));}
  if(which==='obit'){obitSel=0;renderObits();}if(which==='controls')renderControls();if(which==='map'){MAPV.cx=null;setTimeout(renderMap,0);}
}
const tabIndex=()=>TABS.findIndex(t=>t[0]===curTab);
