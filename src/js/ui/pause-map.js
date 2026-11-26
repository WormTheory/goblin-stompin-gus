// ---- pause screen tabs ----
// ---- the map: every city block anyone has been near is remembered (per city) and drawn from the city plan ----
const MAP_KEY='goblin-stompin-gus-map';let explored=new Set(),exploredSeed=null,exploreT=0,exploreDirty=false,mapSaveT=0;
// the places you've found (any block of them seen): named on the map, with how much of each you've destroyed
const knownSets=new Map();
function noteKnown(px,pz){const S=settlementAt(px,pz);if(S)knownSets.set(S.rx+','+S.rz,S);}
function loadExplored(){explored=new Set();exploredSeed=seed;knownSets.clear();mapTileClear();try{const m=JSON.parse(localStorage.getItem(MAP_KEY)||'null');if(m&&m.seed===seed&&Array.isArray(m.cells)){explored=new Set(m.cells);for(const c of m.cells){const [a,b]=c.split(',');noteKnown(+a,+b);}}}catch(e){}}
function saveExplored(){try{localStorage.setItem(MAP_KEY,JSON.stringify({seed,cells:[...explored]}));}catch(e){}}
function updateExplore(dt){
  if(exploredSeed!==seed)loadExplored();
  exploreT-=dt;mapSaveT-=dt;
  if(exploreT<=0){exploreT=0.5;
    for(const p of players){if(!p.active)continue;const cx=Math.floor(p.pos.x/CELL),cz=Math.floor(p.pos.z/CELL);
      for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(dx*dx+dz*dz>5)continue;const k=(cx+dx)+','+(cz+dz);if(!explored.has(k)&&tenvShow(cx+dx,cz+dz)){explored.add(k);exploreDirty=true;noteKnown(cx+dx,cz+dz);mapTileStale(cx+dx,cz+dz);}}}}
  if(exploreDirty&&mapSaveT<=0){mapSaveT=5;exploreDirty=false;saveExplored();}
}
// ---- map markers: each player can mark one spot on the Map tab (click or tap it there; on a controller, Y marks the
// crosshair in the middle). It's that player's own: shown on the map and on their own minimap, with an arrow on the
// minimap's rim and how far it is when it's off the edge. Marking it again takes it away; marking somewhere else moves
// it. Kept in this browser for each seat, per world (a new world starts with none) ----
const MARK_KEY='goblin-stompin-gus-marks',MARK_COL=['#3fd6ff','#ff7ad6','#ffd75a','#9cff6a'];let marksSeed=null;
const markCol=p=>MARK_COL[p.idx%MARK_COL.length];
function loadMarks(){marksSeed=seed;for(const p of players)p.mark=null;
  try{const m=JSON.parse(localStorage.getItem(MARK_KEY)||'null');if(m&&m.seed===seed&&Array.isArray(m.m))m.m.forEach((q,i)=>{if(players[i]&&Array.isArray(q)&&isFinite(q[0])&&isFinite(q[1]))players[i].mark={x:+q[0],z:+q[1]};});}catch(e){}}
function saveMarks(){try{localStorage.setItem(MARK_KEY,JSON.stringify({seed,m:players.map(p=>p.mark?[Math.round(p.mark.x*10)/10,Math.round(p.mark.z*10)/10]:null)}));}catch(e){}}
function markOf(p){if(marksSeed!==seed)loadMarks();return p.mark||null;}
// whose marker the Map tab sets: whoever's menu it is (in split screen, either player's)
function mapOwner(){return menuBy&&menuBy.active?menuBy:players.find(q=>q.active)||P1;}
// mark a spot for p, or take the marker away if 'onIt' (pointing at the one that's there)
function toggleMark(p,wx,wz,onIt){
  if(onIt&&markOf(p)){p.mark=null;tone('triangle',440,0,0.05,0.03);}
  else{p.mark={x:wx,z:wz};tone('triangle',760,0,0.06,0.03);}
  saveMarks();}
// the marker on the map: a pin with its point on the spot, in the player's colour
function drawPin(x,sx,sy,col,big){const r=big?7:5.5,h=big?17:13;x.save();x.fillStyle=col;x.strokeStyle='#0c0f14';x.lineWidth=1.6;
  x.beginPath();x.moveTo(sx,sy);x.arc(sx,sy-h+r,r,Math.PI*0.78,Math.PI*0.22);x.closePath();x.fill();x.stroke();
  x.fillStyle='#0c0f14';x.beginPath();x.arc(sx,sy-h+r,r*0.38,0,Math.PI*2);x.fill();x.restore();}
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
const MAPC={derricks:'#3a3430',peat:'#5a4636',research:'#c83a3a',safari:'#c8a050',stilts:'#6a5a3a',ski:'#e0e8f0',tower5g:'#c8c8d0',prepper:'#7a6a3a',militia:'#3a4a2a',ruins:'#8a8a78',thieves:'#2a2420',wind:'#f0f4f4',campsite:'#6a9a4a',cult:'#5a1a24',mine:'#6a5a48',quarry:'#a8a090',lumber:'#4a6a2a',base:'#5a6a3a',airport:'#8a9aa8',airfield:'#9ab878',nasa:'#e8e8f0',theme:'#f05a8a',nuclear:'#d8d03a',arena:'#e07a2a',campus:'#a03a4a',prison:'#5a5a5a',jail:'#6a6a6a',water:'#4a9ad8',power:'#8a8a3a',zoo:'#5aa83a',studio:'#d0a04a',lab:'#3ad04a',castle:'#9a9a8a',ikea:'#0058a3',cathedral:'#c8b890',museum:'#d8c8a0',aquarium:'#3aa0d8',casino:'#e04ab0',school:'#c87a4a',factory:'#7a6a5a',datacenter:'#4a5a6a',electric:'#d8c83a',dump:'#7a6a50',derelict:'#6a6258',mansion:'#d8b0a0',trailers:'#a8a078',camp:'#8a7a5a',farmers:'#d0904a',nursery:'#5aa04a',dealer:'#4a8ad0',armory:'#8a4a3a',theater:'#a0283a',stocks:'#c8c0a0',court:'#3e766c',cemetery:'#5c6e58',church:'#a89880',library:'#8a6a4a',cinema:'#b03a4a',radio:'#d05a5a',news:'#3a5a9a',bank:'#c8a84a',disco:'#b04ac8',club:'#4aa04a',shops:'#c0607a',wtower:'#b8c4cc',bell:'#9a8a70',market:'#2f9a8a',drug:'#d0506a',food:'#c86a3a',fastfood:'#e0a030',sitdown:'#a0522d',fire:'#b8302a',build:'#a89060',ramp:'#5a6a4a',plains:'#6c9448',field:'#9a8a4a',orchard:'#4c7a32',truckstop:'#e0a52e',farm:'#b0503a',road:'#3a3f45',walk:'#565b5f',tower:'#4a5a70',mid:'#7a6450',park:'#3f8a3a',plaza:'#9a9a90',police:'#3456a8',grocery:'#2f9a8a',homes:'#c8a870',
  gas:'#c8433a',garage:'#6c7076',hospital:'#e8eaec',mall:'#9a52b8',stadium:'#56b04a',capitol:'#e8c35a',ghw:'#b07a3a',bigbox:'#2f7fd0',mega:'#5e7f9a',bigpark:'#3a9a3a',river:'#2f6fc8',highway:'#e8963a',empty:'#4a4f53',metro:'#3a6ad0',rail:'#3a3036',sea:'#2a5f9e',rig:'#c8c040',beach:'#d8c890',harbor:'#9a9488',yard:'#8f949a',navy:'#5c6672',lighthouse:'#e04040'};
COAST_KC.forEach((c,i)=>MAPC['cf'+i]=c);
// the wilds' wonders on the maps: a marker each, in its kind's colour (world/wonders.js)
const WD_MC={arch:'#e0904a',fall:'#4ad0f0',ribs:'#c070e0',tree:'#c070e0',baobab:'#c070e0',erratic:'#c070e0',henge:'#c070e0'},
  WD_LEG=[['wd_arch','Stone arches'],['wd_fall','Waterfalls'],['wd_lm','Landmarks']];
MAPC.wd_arch=WD_MC.arch;MAPC.wd_fall=WD_MC.fall;MAPC.wd_lm=WD_MC.henge;
const MAP_LEG=[['base','Military bases'],['airport','Airports'],['airfield','Airfields'],['mine','Mines'],['quarry','Quarries'],['lumber','Lumber camps'],['campsite','Campsites'],['cult','Cult altars'],['tower5g','5G towers'],['prepper','Prepper compounds'],['militia','Militia compounds'],['ruins','Ruins'],['thieves',"Thieves' hideouts"],['derricks','Oil fields'],['peat','Peat diggings'],['research','Research stations'],['safari','Safari lodges'],['stilts','Stilt villages'],['ski','Ski slopes'],['wind','Wind farms'],['nasa','Launch sites'],['theme','Theme parks'],['nuclear','Nuclear plants'],['arena','Arenas'],['campus','Universities'],['prison','Prisons'],['jail','Jails'],['water','Water works'],['power','Power stations'],['zoo','Zoos'],['studio','Film studios'],['lab','Goblin labs'],['ikea','Furniture superstores'],['cathedral','Cathedrals'],['museum','Museums'],['aquarium','Aquariums'],['casino','Casinos'],['school','Schools'],['factory','Factories'],['datacenter','Data centers'],['electric','Electric company'],['dump','Garbage dumps'],['derelict','Abandoned buildings'],['mansion','Mansions'],['trailers','Trailer parks'],['camp','Encampments'],['farmers',"Farmer's markets"],['nursery','Tree nurseries'],['dealer','Car dealers'],['armory','Armories'],['theater','Theatres'],['stocks','Stock exchange'],['church','Churches'],['cemetery','Cemeteries'],['library','Libraries'],['cinema','Cinemas'],['bank','Banks'],['disco','Discos'],['club','Night clubs'],['news','TV news'],['radio','Radio stations'],['court','Basketball courts'],['shops','Little shops & bars'],['wtower','Water towers'],['bell','Bell towers'],['ramp','Interchanges'],['food','Restaurants'],['fastfood','Fast food'],['sitdown','Sit-down restaurants'],['fire','Fire stations'],['build','Building sites'],['plains','Plains'],['farm','Farms'],['truckstop','Truck stops'],['tower','Towers'],['mid','Mid-rises'],['homes','Homes'],['park','Parks'],['plaza','Plazas'],['market','Supermarkets'],['drug','Drugstores'],['gas','Gas stations'],['police','Police'],
  ['hospital','Hospitals'],['garage','Car parks'],['mall','Malls'],['bigbox','Superstores'],['mega','Mega-buildings'],['stadium','Stadiums'],['capitol','The capitol'],['river','Rivers'],['rail','Railways'],['sea','Ocean'],['beach','Beaches'],['yard','Shipping ports'],['navy','Naval bases'],['lighthouse','Lighthouses'],['rig','Oil rigs'],...COAST_KN.map((n,i)=>['cf'+i,n]),...WD_LEG,['ghw','Country highways'],['ruin','Destroyed'],['highway','Highways']];
// the sea on the maps: each block sampled on a grid (water, beach, land), ports and harbours in their own colours
const seaMapC=new Map();
function seaMapCells(px,pz,n){
  const k=(px*100003+pz)*8+n;let v=seaMapC.get(k);if(v)return v;
  const t=plotType(px,pz),st=CELL/n;v=[];
  const ks=v.k=[];   // (each cell's legend entry, where it isn't the block's own: a natural shore's kind)
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=px*CELL+(i+0.5)*st,z=pz*CELL+(j+0.5)*st;let c,kk=null;
    if(t==='yard'||t==='navy')c=MAPC[t];else if(t==='basin'||t==='nbasin')c=MAPC.sea;
    else{const cd=coastD(x,z),nat=t==='shore'||t==='sea'||t==='lighthouse',ck=nat&&cd>-12&&cd<26?coastKind(x,z):-1;
      if(cd>=0){const f=Math.min(1,cd/80);c='rgb('+Math.round(70-46*f)+','+Math.round(128-66*f)+','+Math.round(196-82*f)+')';   // (shallows light, the deep ocean dark)
        if(ck===2&&cd<CF_IW*0.7||ck===3&&cd<CF_MW*0.6){c=COAST_KC[ck];kk='cf'+ck;}}   // (an ice shelf, mangroves out in the shallows)
      else if(ck>=0&&cd>-9){c=COAST_KC[ck];kk='cf'+ck;}   // (a natural shore, by its kind)
      else c=t==='harbor'&&cd>-9?MAPC.harbor:t==='beach'&&cd>-17?MAPC.beach:t==='beach'&&cd>-21?'#a07a50':cd>-7?(t==='rig'||t==='wreck'?MAPC.sea:gridNoise(x/CELL,z/CELL,7,77)>0.12?'#8a8a80':MAPC.beach):MAPC.plains;}
    if(t==='rig'&&Math.abs(i*st+st/2-16)<12&&Math.abs(j*st+st/2-16)<12)c='#c8c040';
    if(t==='lighthouse'){const P=plotInfo(px,pz);if(Math.abs(i*st+st/2-P.lh.x)<st&&Math.abs(j*st+st/2-P.lh.z)<st)c=MAPC.lighthouse;}
    v.push(c);ks.push(kk);}
  if(seaMapC.size>20000)seaMapC.clear();seaMapC.set(k,v);return v;
}
const MAPV={cx:null,cz:null,ppb:1.6,hl:null};   // hl: the legend entry being pointed at, lit up on the map   // centre (blocks) and pixels per block
// (dragging, zooming and so on ask for the map to be drawn, at most once a frame -- a fast mouse sends several moves a frame)
let mapRaf=0;
function mapDraw(){if(mapRaf)return;mapRaf=requestAnimationFrame(()=>{mapRaf=0;renderMap();})||0;}
function mapPan(dx,dy){if(MAPV.cx===null)return;MAPV.cx+=dx/MAPV.ppb;MAPV.cz+=dy/MAPV.ppb;mapDraw();}
// (the furthest out it goes is far enough to see everything you've explored at once, from wherever the map's centred,
// however far you've roamed; never less far out than it always went)
function mapMinPPB(){
  const cv=document.getElementById('mapCanvas'),w=Math.max(200,cv&&cv.clientWidth||600),h=Math.max(200,cv&&cv.clientHeight||400),B=exploredBox();
  if(!B)return 0.35;
  const cx=MAPV.cx===null?B.x0*CELL:MAPV.cx,cz=MAPV.cz===null?B.z0*CELL:MAPV.cz;
  const hx=Math.max(Math.abs(cx-(B.x0-1)*CELL),Math.abs((B.x1+2)*CELL-cx)),hz=Math.max(Math.abs(cz-(B.z0-1)*CELL),Math.abs((B.z1+2)*CELL-cz));
  return Math.min(0.35,w/2/hx,h/2/hz);
}
function mapZoom(k){MAPV.ppb=Math.max(mapMinPPB(),Math.min(8,MAPV.ppb*k));mapDraw();}
// the corners of everything explored, in city blocks (worked out again only when more has been explored)
let expBox=null,expBoxN=-1,expBoxSet=null;
function exploredBox(){
  if(expBoxN===explored.size&&expBoxSet===explored)return expBox;
  expBoxN=explored.size;expBoxSet=explored;expBox=null;
  for(const c of explored){const i=c.indexOf(','),a=+c.slice(0,i),b=+c.slice(i+1);
    if(!expBox)expBox={x0:a,x1:a,z0:b,z1:b};else{if(a<expBox.x0)expBox.x0=a;if(a>expBox.x1)expBox.x1=a;if(b<expBox.z0)expBox.z0=b;if(b>expBox.z1)expBox.z1=b;}}
  return expBox;
}
// back to where you are
function mapRecentre(){MAPV.cx=null;mapDraw();}
// a marker at a point on the map canvas (CSS pixels from its corner), or at the middle (the controller's crosshair)
function mapClick(sx,sy){const cv=document.getElementById('mapCanvas');if(!cv||MAPV.cx===null)return;
  const w=Math.max(200,cv.clientWidth||600),h=Math.max(200,cv.clientHeight||400),k=MAPV.ppb;
  if(sx===undefined){sx=w/2;sy=h/2;}
  const p=mapOwner(),m=markOf(p),wx=MAPV.cx+(sx-w/2)/k,wz=MAPV.cz+(sy-h/2)/k;
  // (within a few pixels of the spot, or on the pin's head standing above it, counts as pointing at the marker)
  const onIt=!!m&&(Math.hypot(m.x-wx,m.z-wz)*k<=12||Math.abs(m.x-wx)*k<=9&&(m.z-wz)*k>=0&&(m.z-wz)*k<=19);
  toggleMark(p,wx,wz,onIt);mapDraw();}
// the capitol, once any of it's been drawn (for the star on its dome)
let mapCapS=null;
const mapClvC=new Map();   // cloverOf, remembered (it looks over 16 crossings each time)
function mapClover(px,pz){const k=px*100003+pz;let v=mapClvC.get(k);if(v===undefined){v=cloverOf(px,pz);mapClvC.set(k,v);}return v;}
// ---- the blocks, roads and rivers (then the ruins and the railways and highways) of the explored blocks c0..c1 x r0..r1, at k pixels per metre with
// the world's origin at (ox,oz). o.all: every building drawn standing (the ruins go on top separately, in their own tiles);
// otherwise ruined ones are left out and passed back in o.ruins. o.HL/o.hits: the legend entry being pointed at, and its
// pieces. Far out, where a block's only a few pixels across, the sea's drawn coarser and the slivers too thin to see are
// left out ----
// (whether a piece of legend entry c is wanted in the hits: HL '*' takes every entry's, for a tile to keep)
const hlOn=(HL,c)=>HL===c||HL==='*';
function drawMapBlocks(x,k,ox,oz,c0,c1,r0,r1,o){
  const X=v=>ox+v*k,Z=v=>oz+v*k,HL=o.HL,hits=o.hits,ruins=o.ruins,all=o.all;
  const bpx=CELL*k,seaN=bpx>=24?8:bpx>=12?4:bpx>=6?2:1,fine=bpx>=8;
  // (id: the building a piece is, [px,pz,i], so a tile's kept pieces can leave out one that's come down since)
  const rect=(x0,z0,x1,z1,col,cat,id)=>{const a=X(x0),b=Z(z0),ww=(x1-x0)*k+0.6,hh=(z1-z0)*k+0.6;x.fillStyle=col;x.fillRect(a,b,ww,hh);if(HL&&cat&&hlOn(HL,cat))hits.push([a,b,ww,hh,col,cat,id]);};
    for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++){
    if(!explored.has(px+','+pz))continue;
    const X0=px*CELL,Z0=pz*CELL,t=plotType(px,pz);
    if(seaPlot(px,pz)){const n=seaN,st=CELL/n,C=seaMapCells(px,pz,n),key=t==='yard'||t==='basin'?'yard':t==='navy'||t==='nbasin'?'navy':t==='lighthouse'?'lighthouse':t==='beach'?'beach':t==='rig'?'rig':'sea';
      for(let j=0;j<n;j++)for(let i=0;i<n;i++)rect(X0+i*st,Z0+j*st,X0+(i+1)*st,Z0+(j+1)*st,C[j*n+i],C.k[j*n+i]||key);continue;}
    if(realmOf(px,pz)==='plains'){
      {const RC=reliefMapCells(px,pz,seaN),n=seaN,st=CELL/n;if(!RC)rect(X0,Z0,X0+CELL,Z0+CELL,BIOMES[biomeOfPlot(px,pz)].map,'plains');
        else for(let j=0;j<n;j++)for(let i=0;i<n;i++)rect(X0+i*st,Z0+j*st,X0+(i+1)*st,Z0+(j+1)*st,RC[j*n+i],'plains');}
      if(fine){const FL=farmLane(px,pz);if(FL)rect(X0+PC-1,FL.z0,X0+PC+1,FL.z1,'#a89a78','farm');}
      if(t==='truckstop'){const P=plotInfo(px,pz);for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,MAPC.truckstop,'truckstop');}
      if(t==='dump')rect(X0+1,Z0+1,X0+CELL-1,Z0+CELL-1,MAPC.dump,'dump');
      if(fine&&turbineAt(px,pz))rect(X0+13,Z0+13,X0+19,Z0+19,MAPC.wind,'wind');
      if(t==='castle')rect(X0+5,Z0+5,X0+CELL-5,Z0+CELL-5,MAPC.castle,'castle');
      if(t==='nuclear'||t==='base'||t==='airport'||t==='airfield'||t==='nasa'||t==='mine'||t==='quarry'||t==='lumber'||t==='campsite'||t==='cult'||t==='tower5g'||t==='prepper'||t==='militia'||t==='ruins'||t==='thieves'||BIO_SITES.has(t)){rect(X0,Z0,X0+CELL,Z0+CELL,MAPC[t],t);const P=plotInfo(px,pz);for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,'#3a3f45',t);}
      {const FD=t==='plains'&&farmlandOf(px,pz);if(FD)rect(X0,Z0,X0+CELL,Z0+CELL,FD.kind==='orchard'?MAPC.orchard:MAPC.field,'farm');}
      if(t==='farm'){const P=plotInfo(px,pz);if(fine){if(P.north)rect(X0+PC-1,Z0+P.field.z1,X0+PC+1,Z0+CELL,'#a89a78','farm');else rect(X0+PC-1,Z0,X0+PC+1,Z0+P.field.z0,'#a89a78','farm');}rect(X0+P.field.x0,Z0+P.field.z0,X0+P.field.x1,Z0+P.field.z1,MAPC.field,'farm');for(const b of P.b)rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,MAPC.farm,'farm');}
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
      if(S.kind==='capitol')mapCapS=S;
      // buildings of the site, drawn darker, clipped to this block
      if(S.kind!=='bigpark'&&S.kind!=='stadium'){const P=plotInfo(S.ax,S.az),AX=S.ax*CELL,AZ=S.az*CELL;x.fillStyle='rgba(0,0,0,0.28)';
        P.b.forEach((b,bi)=>{const bx0=Math.max(AX+b.x0,X0),bz0=Math.max(AZ+b.z0,Z0),bx1=Math.min(AX+b.x1,X0+CELL),bz1=Math.min(AZ+b.z1,Z0+CELL);if(bx1>bx0&&bz1>bz0){const ru=!all&&ruinedB(S.ax,S.az,bi);if(ru){if(!blockRuined(S.ax,S.az))ruins.push([bx0,bz0,bx1,bz1]);}else{x.fillStyle='rgba(0,0,0,0.28)';x.fillRect(X(bx0),Z(bz0),(bx1-bx0)*k,(bz1-bz0)*k);}}});}
      continue;
    }
    rect(X0+ROADW,Z0+ROADW,X0+CELL,Z0+CELL,MAPC.walk);
    {const a=jz(px,pz),b=jx(px,pz),JC={alley:'#24282c',yard:'#4f7a3e'};if(a)rect(X0,Z0+ROADW,X0+ROADW,Z0+CELL,JC[a]);if(b)rect(X0+ROADW,Z0,X0+CELL,Z0+ROADW,JC[b]);}
    {const B=plotBounds(px,pz);rect(X0+B.x0,Z0+B.z0,X0+B.x1,Z0+B.z1,t==='park'?MAPC.park:t==='plaza'?MAPC.plaza:t==='homes'?'#5f8a46':t==='ramp'?MAPC.ramp:'#4a4f53',(t==='park'||t==='plaza'||t==='homes'||t==='ramp')?t:null);}
    const P=plotInfo(px,pz),col=MAPC[t]||'#777';
    P.b.forEach((b,bi)=>{if(!all&&ruinedB(px,pz,bi)){if(!blockRuined(px,pz))ruins.push([X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1]);}else rect(X0+b.x0,Z0+b.z0,X0+b.x1,Z0+b.z1,col,t,all?[px,pz,bi]:null);});
  }
  // the rivers winding across the plains (through the places they're blocks of their own, drawn above)
  {const L=riversNearBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL);x.strokeStyle=MAPC.river;x.lineWidth=Math.max(1.5,RIV_W*2*k);x.lineCap='round';x.beginPath();
   for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1],[ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],mx=(ax+bx)/2,mz=(az+bz)/2,px=Math.floor(mx/CELL),pz=Math.floor(mz/CELL);
     if(!explored.has(px+','+pz)||settlementAt(px,pz)||seaV(mx/CELL,mz/CELL)>SEA_T)continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));}
   x.stroke();}
  if(!all)drawMapRuins(x,k,ox,oz,c0,c1,r0,r1,ruins,HL,hits);
  drawMapLines(x,k,ox,oz,c0,c1,r0,r1,HL,hits);
}
// the railways, highways, slip roads and cloverleaves over the explored blocks (over the ruins too)
function drawMapLines(x,k,ox,oz,c0,c1,r0,r1,HL,hits){
  const X=v=>ox+v*k,Z=v=>oz+v*k;
  const rect=(x0,z0,x1,z1,col,cat)=>{const a=X(x0),b=Z(z0),ww=(x1-x0)*k+0.6,hh=(z1-z0)*k+0.6;x.fillStyle=col;x.fillRect(a,b,ww,hh);if(HL&&cat&&hlOn(HL,cat))hits.push([a,b,ww,hh,col,cat]);};
  const E=[];for(let px=c0;px<=c1;px++)for(let pz=r0;pz<=r1;pz++)if(explored.has(px+','+pz))E.push(px,pz,realmOf(px,pz)==='plains'?1:0);
  // the railways you've seen
  {x.strokeStyle=MAPC.rail;x.lineWidth=Math.max(2,4*k);x.lineCap='butt';x.beginPath();
   for(const L of railLinksInBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL))for(let i=0;i+4<L.L;i+=4){const [ax,az]=L.pts[i],[bx,bz]=L.pts[Math.min(L.L-1,i+4)];
     if(!explored.has(Math.floor(ax/CELL)+','+Math.floor(az/CELL)))continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));if(hlOn(HL,'rail'))hits.push([X(Math.min(ax,bx))-2,Z(Math.min(az,bz))-2,Math.abs(bx-ax)*k+4,Math.abs(bz-az)*k+4,'#8a7a80','rail']);}
   x.stroke();}
  // raised highways over the streets you've seen
  x.fillStyle='rgba(232,150,58,0.85)';
  for(let q=0;q<E.length;q+=3){const px=E[q],pz=E[q+1],X0=px*CELL,Z0=pz*CELL;
    if(hwRow(pz,px)){x.fillRect(X(X0),Z(Z0-3),CELL*k+0.6,14*k);if(hlOn(HL,'highway'))hits.push([X(X0),Z(Z0-3),CELL*k+0.6,14*k,'#e8963a','highway']);}
    if(hwCol(px,pz)){x.fillRect(X(X0-3),Z(Z0),14*k,CELL*k+0.6);if(hlOn(HL,'highway'))hits.push([X(X0-3),Z(Z0),14*k,CELL*k+0.6,'#e8963a']);}}
  // the ground highways across the plains
  x.fillStyle='rgba(176,122,58,0.9)';
  for(let q=0;q<E.length;q+=3){if(!E[q+2])continue;const px=E[q],pz=E[q+1],X0=px*CELL,Z0=pz*CELL;
    if(gRow(pz,X0+16)){x.fillRect(X(X0),Z(Z0-3),CELL*k+0.6,14*k);if(hlOn(HL,'ghw'))hits.push([X(X0),Z(Z0-3),CELL*k+0.6,14*k,'#b07a3a','ghw']);}
    if(gCol(px,Z0+16)){x.fillRect(X(X0-3),Z(Z0),14*k,CELL*k+0.6);if(hlOn(HL,'ghw'))hits.push([X(X0-3),Z(Z0),14*k,CELL*k+0.6,'#b07a3a']);}}
  // the highways out across the plains on their own lines (motorways over the country highways), and the truck stops
  {const L=routesNearBox(c0*CELL,r0*CELL,(c1+1)*CELL,(r1+1)*CELL),seen=new Set();
   for(const kind of ['country','moto']){x.strokeStyle=kind==='moto'?'rgba(232,150,58,0.95)':'rgba(176,122,58,0.95)';x.lineWidth=Math.max(1.5,14*k);x.lineCap='butt';x.beginPath();
     for(let q=0;q<L.length;q+=2){const R=L[q],i=L[q+1];if(R.kind!==kind)continue;const [ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],px=Math.floor((ax+bx)/2/CELL),pz=Math.floor((az+bz)/2/CELL);
       if(!explored.has(px+','+pz)||settlementAt(px,pz))continue;x.moveTo(X(ax),Z(az));x.lineTo(X(bx),Z(bz));
       if(hlOn(HL,kind==='moto'?'highway':'ghw'))hits.push([Math.min(X(ax),X(bx))-1,Math.min(Z(az),Z(bz))-1,Math.abs(X(bx)-X(ax))+2,Math.abs(Z(bz)-Z(az))+2,kind==='moto'?'#e8963a':'#b07a3a',kind==='moto'?'highway':'ghw']);}
     x.stroke();}
   for(let q=0;q<L.length;q+=2){const R=L[q];if(R.kind!=='country'||seen.has(R))continue;seen.add(R);for(const T of truckStopOf(R)){if(!explored.has(Math.floor(T.cx/CELL)+','+Math.floor(T.cz/CELL)))continue;
     const c=(u,v)=>[X(T.cx+T.tx*u+T.nx*v),Z(T.cz+T.tz*u+T.nz*v)];x.fillStyle=MAPC.road;x.beginPath();for(const [u,v] of [[-44,7],[44,7],[44,58],[-44,58]]){const [a,b]=c(u,v);x.lineTo(a,b);}x.closePath();x.fill();
     x.fillStyle=MAPC.truckstop;x.beginPath();for(const [u,v] of [[-26,11],[26,11],[26,27],[-26,27]]){const [a,b]=c(u,v);x.lineTo(a,b);}x.closePath();x.fill();
     const bp=[Math.floor((T.cx+T.nx*47)/CELL),Math.floor((T.cz+T.nz*47)/CELL)];for(const b of plotInfo(bp[0],bp[1]).b)rect(bp[0]*CELL+b.x0,bp[1]*CELL+b.z0,bp[0]*CELL+b.x1,bp[1]*CELL+b.z1,MAPC.truckstop,'truckstop');}}}
  // their slip roads and cloverleaves
  {x.fillStyle='rgba(232,150,58,0.7)';const seen=new Set(),box=(ax0,az0,ax1,az1)=>{const a=X(Math.min(ax0,ax1)),b=Z(Math.min(az0,az1)),ww=Math.abs(ax1-ax0)*k+0.4,hh=Math.abs(az1-az0)*k+0.4;x.fillRect(a,b,ww,hh);if(hlOn(HL,'ramp'))hits.push([a,b,ww,hh,'#e8963a','ramp']);};
   for(let q=0;q<E.length;q+=3){const px=E[q],pz=E[q+1];
     const cv=mapClover(px,pz);
     if(cv&&!seen.has('c'+cv.j+','+cv.k)){seen.add('c'+cv.j+','+cv.k);const cx=cv.j*CELL+4,cz=cv.k*CELL+4;
       for(let n=0;n<4;n++)for(const o of CLV)if(o.t==='deck'||o.t==='slope'){const [a0,b0]=cvRot(n,o.p0,o.q0),[a1,b1]=cvRot(n,o.p1,o.q1);box(cx+a0,cz+b0,cx+a1,cz+b1);}}
     for(const [ax,kk,m] of [['x',pz,px],['x',pz+1,px],['z',px,pz],['z',px+1,pz]]){
       if(!(ax==='x'?hwRow(kk,m):hwCol(kk,m)))continue;const m0=icOf(ax,kk,m);if(m0===null||seen.has(ax+kk+','+m0))continue;seen.add(ax+kk+','+m0);
       const HY=ax==='x'?HY_X:HY_Z,base=kk*CELL;
       for(const side of [1,-1])for(const R of icRamps(ax,m0,side,HY)){const c0=base+(side>0?12:-8);if(ax==='x')box(R.a0,c0,R.a1,c0+4);else box(c0,R.a0,c0+4,R.a1);}
     }}}
}
// the ruins: hatched, outlined in red -- the wasteland of whole destroyed blocks (joined across their streets), then the
// single buildings that are down. Returns whether there were any
function drawMapRuins(x,k,ox,oz,c0,c1,r0,r1,ruins,HL,hits){
  const X=v=>ox+v*k,Z=v=>oz+v*k,pat=ruinPat(x,7),RG=ruinGrid(c0,c1,r0,r1,(px,pz)=>explored.has(px+','+pz));
  if(!RG.cells.length&&!ruins.length)return false;
  // (in a tile, the hatching's lined up with the world, so it runs on unbroken into the next tile)
  if(pat.setTransform&&typeof DOMMatrix==='function')pat.setTransform(new DOMMatrix().translate(((ox%7)+7)%7,((oz%7)+7)%7));
  x.fillStyle=pat;for(const [x0,z0,x1,z1] of RG.cells)x.fillRect(X(x0),Z(z0),(x1-x0)*k+0.6,(z1-z0)*k+0.6);
  x.strokeStyle='#e0503c';x.lineWidth=1.5;x.beginPath();for(const [a,b,c,d] of RG.edges){x.moveTo(X(a),Z(b));x.lineTo(X(c),Z(d));}x.stroke();
  if(hlOn(HL,'ruin'))for(const [x0,z0,x1,z1] of RG.cells)hits.push([X(x0),Z(z0),(x1-x0)*k,(z1-z0)*k,'#a3a7ad','ruin']);
  for(const [x0,z0,x1,z1] of ruins){const a=X(x0),b=Z(z0),ww=(x1-x0)*k,hh=(z1-z0)*k;x.fillStyle=pat;x.fillRect(a,b,ww,hh);x.strokeStyle='#e0503c';x.lineWidth=1.5;x.strokeRect(a+0.75,b+0.75,ww-1.5,hh-1.5);if(hlOn(HL,'ruin'))hits.push([a,b,ww,hh,'#a3a7ad','ruin']);}
  return true;
}
// the single buildings that are down (and not part of a wholly destroyed block), clipped to the explored blocks
// c0..c1 x r0..r1 they cover: worked out from the list of damaged buildings, not by looking over every block
let mapRuinL=null,mapRuinV='';
function mapRuinPieces(c0,c1,r0,r1,rv){
  const v=rv+','+explored.size;
  if(mapRuinV!==v||!mapRuinL){mapRuinV=v;mapRuinL=[];
    for(const key in destroyed){const p=key.split(',');if(p.length!==3)continue;const ax=+p[0],az=+p[1],i=+p[2];if(!isFinite(ax)||!isFinite(az)||!isFinite(i))continue;
      const b=plotInfo(ax,az).b[i];if(!b||seaPlot(ax,az)||realmOf(ax,az)==='plains'||plotType(ax,az)==='river'||!ruinedB(ax,az,i)||blockRuined(ax,az))continue;
      const sup=plotType(ax,az)==='super'?superOf(ax,az):null;if(sup&&(sup.kind==='bigpark'||sup.kind==='stadium'))continue;
      mapRuinL.push([ax*CELL+b.x0,az*CELL+b.z0,ax*CELL+b.x1,az*CELL+b.z1,!!sup]);}}
  const out=[];
  for(const [x0,z0,x1,z1,sup] of mapRuinL){
    const p0=Math.floor(x0/CELL),p1=Math.floor((x1-1e-6)/CELL),q0=Math.floor(z0/CELL),q1=Math.floor((z1-1e-6)/CELL);
    if(p1<c0||p0>c1||q1<r0||q0>r1)continue;
    if(!sup){if(explored.has(p0+','+q0))out.push([x0,z0,x1,z1]);continue;}
    for(let px=p0;px<=p1;px++)for(let pz=q0;pz<=q1;pz++){if(!explored.has(px+','+pz))continue;
      const X0=px*CELL,Z0=pz*CELL,bx0=Math.max(x0,X0),bz0=Math.max(z0,Z0),bx1=Math.min(x1,X0+CELL),bz1=Math.min(z1,Z0+CELL);if(bx1>bx0&&bz1>bz0)out.push([bx0,bz0,bx1,bz1]);}}
  return out;
}
// ---- the map's tiles: up to 256 device pixels square but never more than 16 blocks across (so one's quick to draw
// however far out), at zoom steps half an octave apart (step L is 2^(L/2) pixels per metre), each drawn at the step just
// finer than the zoom it's shown at, so it's only ever shrunk a little. Blocks and ruins
// are separate tiles (the ruins with the railways and highways drawn again over them): knocking something down redraws
// only the ruins. Kept until the world changes or a block in one is
// first explored, the least recently used thrown away past MAPT_MAX pixels in all ----
const MAPT_MAX=16e6,mapTiles=new Map(),mapStale=[];let mapTPix=0;
let mapTSeed=null,mapTDpr=0;
// (a block explored: the tiles round it are drawn again next time they're shown)
function mapTileStale(px,pz){if(mapTiles.size)mapStale.push(px,pz);}
function mapTileClear(){mapTiles.clear();mapTPix=0;mapStale.length=0;mapClvC.clear();mapCapS=null;mapRuinL=null;}
function mapTileGeo(L,tx,tz,dpr){const s=Math.pow(2,L/2),n=Math.max(32,Math.min(256,Math.pow(2,Math.floor(Math.log2(16*CELL*s*dpr))))),W=n/(s*dpr),wx0=tx*W,wz0=tz*W;
  return{s,n,W,wx0,wz0,c0:Math.floor(wx0/CELL)-1,c1:Math.floor((wx0+W)/CELL)+1,r0:Math.floor(wz0/CELL)-1,r1:Math.floor((wz0+W)/CELL)+1};}
function mapTileMake(n){const c=document.createElement('canvas');c.width=c.height=n;mapTPix+=n*n;const g=c.getContext&&c.getContext('2d');return g&&g.fillRect&&g.drawImage?{c,g}:null;}
// what the ruins depend on: what's been knocked down, and which of the places you've found are wiped out (not every
// change in their figures, which keep catching up while the map's open)
function mapRuinVer(){let g='';for(const S of knownSets.values())if(setGone(S))g+=S.rx+','+S.rz+';';return destroyVer+'|'+g;}
function mapTileBuild(T,L,tx,tz,dpr,rv){
  const G=mapTileGeo(L,tx,tz,dpr),B=exploredBox(),ox=-G.wx0*G.s,oz=-G.wz0*G.s;
  let {c0,c1,r0,r1}=G;if(B){c0=Math.max(c0,B.x0-1);c1=Math.min(c1,B.x1+1);r0=Math.max(r0,B.z0-1);r1=Math.min(r1,B.z1+1);}
  // (each legend entry's pieces are kept with the tile as it's drawn, T.hb and T.hr, so pointing at one in the legend
  // lights them up straight from the tiles, however far out: no going over every block again)
  if(!T.base){const C=mapTileMake(G.n);if(!C)return false;C.g.setTransform(dpr,0,0,dpr,0,0);const H=[];if(B&&c0<=c1&&r0<=r1)drawMapBlocks(C.g,G.s,ox,oz,c0,c1,r0,r1,{all:true,HL:'*',hits:H});T.base=C.c;T.hb=mapHitsBy(H);}
  if(T.rv!==rv){T.rv=rv;
    if(T.ruin){mapTPix-=G.n*G.n;T.ruin=null;}T.hr=null;
    if(B&&c0<=c1&&r0<=r1){const C=mapTileMake(G.n);if(!C)return false;C.g.setTransform(dpr,0,0,dpr,0,0);const H=[];if(drawMapRuins(C.g,G.s,ox,oz,c0,c1,r0,r1,mapRuinPieces(c0,c1,r0,r1,rv),'*',H)){T.hr=mapHitsBy(H);drawMapLines(C.g,G.s,ox,oz,c0,c1,r0,r1,null,null);T.ruin=C.c;}else mapTPix-=G.n*G.n;}}
  return true;
}
// a tile's highlight pieces, sorted by legend entry
function mapHitsBy(H){const o={};for(const h of H)(o[h[5]]||(o[h[5]]=[])).push(h);return o;}
// a block explored since: throw away the tiles it's in (and the ones next to them: a block's highways and ramps spill over)
function mapTileDrop(key){const T=mapTiles.get(key);if(!T)return;const n=mapTileGeo(T.L,0,0,mapTDpr).n;mapTPix-=n*n*((T.base?1:0)+(T.ruin?1:0));mapTiles.delete(key);}
function mapTileSweep(dpr){
  if(!mapStale.length)return;
  for(const [key,T] of mapTiles){const G=mapTileGeo(T.L,T.tx,T.tz,dpr);
    for(let q=0;q<mapStale.length;q+=2){const px=mapStale[q],pz=mapStale[q+1];if(px>=G.c0-1&&px<=G.c1+1&&pz>=G.r0-1&&pz<=G.r1+1){mapTileDrop(key);break;}}}
  mapStale.length=0;
}
// draw the tiles over the view (device pixels, from the canvas's corner); any not drawn yet are drawn, for a few
// milliseconds a frame, the middle of the view first -- the rest shown meanwhile from tiles of the steps either side, if
// there are any. Returns whether some are still to draw (null: tiles can't be made here)
function mapTilesDraw(x,W,H,dpr,k,cx,cz,HL){
  const L=Math.max(-14,Math.min(8,Math.ceil(2*Math.log2(k)-1e-9))),G0=mapTileGeo(L,0,0,dpr),TW=G0.W;
  const tx0=Math.floor((cx-W/2/dpr/k)/TW),tx1=Math.floor((cx+W/2/dpr/k)/TW),tz0=Math.floor((cz-H/2/dpr/k)/TW),tz1=Math.floor((cz+H/2/dpr/k)/TW);
  const B=exploredBox(),bx0=B?(B.x0-2)*CELL:0,bx1=B?(B.x1+3)*CELL:0,bz0=B?(B.z0-2)*CELL:0,bz1=B?(B.z1+3)*CELL:0;
  const sx=v=>Math.round(W/2+(v-cx)*k*dpr),sz=v=>Math.round(H/2+(v-cz)*k*dpr);
  const want=[];
  for(let tx=tx0;tx<=tx1;tx++)for(let tz=tz0;tz<=tz1;tz++){
    if(!B||(tx+1)*TW<bx0||tx*TW>bx1||(tz+1)*TW<bz0||tz*TW>bz1)continue;   // (nothing explored there)
    want.push(tx,tz,Math.hypot((tx+0.5)*TW-cx,(tz+0.5)*TW-cz));}
  const ord=[];for(let i=0;i<want.length;i+=3)ord.push(i);ord.sort((a,b)=>want[a+2]-want[b+2]);
  const t0=performance.now(),rv=mapRuinVer();let more=false,built=0;
  // (the missing tiles first, then the ruins that are out of date)
  for(const pass of [0,1])for(const i of ord){const tx=want[i],tz=want[i+1],key=L+','+tx+','+tz;let T=mapTiles.get(key);
    if(pass?!T||!T.base||T.rv===rv:T&&T.base)continue;
    if(built&&performance.now()-t0>=8){more=true;break;}
    if(!T){T={L,tx,tz,base:null,ruin:null,rv:null};mapTiles.set(key,T);}
    if(!mapTileBuild(T,L,tx,tz,dpr,rv))return null;built++;}
  const got=[];
  for(const i of ord){const tx=want[i],tz=want[i+1],key=L+','+tx+','+tz,T=mapTiles.get(key);
    if(T){mapTiles.delete(key);mapTiles.set(key,T);}   // (most recently used last)
    if(!T||!T.base){more=true;got.push(null);continue;}
    if(T.rv!==rv)more=true;
    got.push(T);}
  while(mapTPix>MAPT_MAX&&mapTiles.size>got.length)mapTileDrop(mapTiles.keys().next().value);
  // the stand-ins for the tiles still to come
  if(more){const sub=[L-1,L+1,L-2,L+2,L-3,L-4];
    ord.forEach((i,n)=>{if(got[n])return;const tx=want[i],tz=want[i+1],a=sx(tx*TW),b=sz(tz*TW),c=sx((tx+1)*TW),d=sz((tz+1)*TW);
      x.save();x.beginPath();x.rect(a,b,c-a,d-b);x.clip();
      for(const L2 of sub){const TW2=mapTileGeo(L2,0,0,dpr).W;let any=false;
        for(let ux=Math.floor(tx*TW/TW2);ux<=Math.floor(((tx+1)*TW-1e-6)/TW2);ux++)for(let uz=Math.floor(tz*TW/TW2);uz<=Math.floor(((tz+1)*TW-1e-6)/TW2);uz++){
          const U=mapTiles.get(L2+','+ux+','+uz);if(!U||!U.base)continue;any=true;const e=sx(ux*TW2),f=sz(uz*TW2),g=sx((ux+1)*TW2),h=sz((uz+1)*TW2);
          x.drawImage(U.base,e,f,g-e,h-f);if(U.ruin)x.drawImage(U.ruin,e,f,g-e,h-f);}
        if(any)break;}
      x.restore();});}
  ord.forEach((i,n)=>{const T=got[n];if(!T)return;const tx=want[i],tz=want[i+1],a=sx(tx*TW),b=sz(tz*TW),c=sx((tx+1)*TW),d=sz((tz+1)*TW);
    x.drawImage(T.base,a,b,c-a,d-b);if(T.ruin)x.drawImage(T.ruin,a,b,c-a,d-b);});
  // the highlighted legend entry: everything else dims, its own pieces come back bright with an outline, from what each
  // tile kept as it was drawn (each tile's own clipped to it, as a piece near its edge is kept by the tiles either side)
  if(HL){x.fillStyle='rgba(8,10,14,0.74)';x.fillRect(0,0,W,H);
    ord.forEach((i,n)=>{const T=got[n];if(!T)return;const L1=T.hb&&T.hb[HL]||[],L2=T.hr&&T.hr[HL]||[];if(!L1.length&&!L2.length)return;
      const tx=want[i],tz=want[i+1],a=sx(tx*TW),b=sz(tz*TW),c=sx((tx+1)*TW),d=sz((tz+1)*TW),f=(c-a)/(G0.n/dpr);
      x.save();x.beginPath();x.rect(a,b,c-a,d-b);x.clip();
      const up=id=>!id||!ruinedB(id[0],id[1],id[2]);   // (a building down since the tile was drawn is a ruin now)
      for(const Lh of [L1,L2])for(const h of Lh){if(!up(h[6]))continue;x.fillStyle=h[4];x.fillRect(a+h[0]*f,b+h[1]*f,h[2]*f,h[3]*f);}
      x.strokeStyle='#ffe27a';x.lineWidth=1.2*dpr;
      for(const Lh of [L1,L2])for(const [p,q,ww,hh,,,id] of Lh)if(up(id))x.strokeRect(a+p*f+0.5*dpr,b+q*f+0.5*dpr,Math.max(dpr,ww*f-dpr),Math.max(dpr,hh*f-dpr));
      x.restore();});}
  return more;
}
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
  let c0=Math.floor((MAPV.cx-w/2/k)/CELL)-1,c1=Math.ceil((MAPV.cx+w/2/k)/CELL)+1,r0=Math.floor((MAPV.cz-h/2/k)/CELL)-1,r1=Math.ceil((MAPV.cz+h/2/k)/CELL)+1;
  // (zoomed right out, only look over the blocks that have been explored, not the whole view)
  {const B=exploredBox();if(B){c0=Math.max(c0,B.x0-1);c1=Math.min(c1,B.x1+1);r0=Math.max(r0,B.z0-1);r1=Math.min(r1,B.z1+1);}}
  // everything drawn is tagged with its legend entry; the one being pointed at is drawn again, bright, over a dimmed map
  // (from the pieces the tiles kept; drawn straight, block by block, only where tiles can't be made)
  const HL=MAPV.hl;let more=false;
  if(mapTSeed!==seed||mapTDpr!==dpr){mapTileClear();mapTSeed=seed;mapTDpr=dpr;}
  mapTileSweep(dpr);
  const tiled=(()=>{x.setTransform(1,0,0,1,0,0);x.imageSmoothingEnabled=true;const r=mapTilesDraw(x,cv.width,cv.height,dpr,k,MAPV.cx,MAPV.cz,HL);x.setTransform(dpr,0,0,dpr,0,0);if(r===null)return false;more=r;return true;})();
  if(!tiled){const hits=[];drawMapBlocks(x,k,ox,oz,c0,c1,r0,r1,{HL,hits,ruins:[]});
    // the highlighted legend entry: everything else dims, its own pieces come back bright with an outline
    if(HL){x.fillStyle='rgba(8,10,14,0.74)';x.fillRect(0,0,w,h);
      for(const [a,b,ww,hh,col] of hits){x.fillStyle=col;x.fillRect(a,b,ww,hh);}
      x.strokeStyle='#ffe27a';x.lineWidth=1.2;for(const [a,b,ww,hh] of hits)x.strokeRect(a+0.5,b+0.5,Math.max(1,ww-1),Math.max(1,hh-1));}}
  // the territories' borders and names (ui/map-territories.js)
  if(!HL&&mapTerDraw(x,w,h,k,X,Z))more=true;
  // the wilds' wonders in the blocks you've explored: a diamond each in its kind's colour, named when zoomed in (lit up
  // when their legend entry's pointed at). Worked out a few milliseconds a frame, so zoomed far out they come in by degrees
  {const B=exploredBox();if(B){const vx0=Math.max(MAPV.cx-w/2/k,B.x0*CELL),vx1=Math.min(MAPV.cx+w/2/k,(B.x1+1)*CELL),vz0=Math.max(MAPV.cz-h/2/k,B.z0*CELL),vz1=Math.min(MAPV.cz+h/2/k,(B.z1+1)*CELL);
    if(vx1>vx0&&vz1>vz0&&(vx1-vx0)*(vz1-vz0)<4e8){const L=wondersIn(vx0,vz0,vx1,vz1,6);if(WD_MORE)more=true;
      x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
      for(const [kd,wx,wz] of L){if(!explored.has(Math.floor(wx/CELL)+','+Math.floor(wz/CELL)))continue;
        const cat=kd==='arch'?'wd_arch':kd==='fall'?'wd_fall':'wd_lm',lit=HL===cat;if(HL&&!lit)continue;
        const sx=X(wx),sz=Z(wz),r=lit?8:6;x.beginPath();x.moveTo(sx,sz-r);x.lineTo(sx+r,sz);x.lineTo(sx,sz+r);x.lineTo(sx-r,sz);x.closePath();
        x.fillStyle=WD_MC[kd];x.fill();x.lineWidth=lit?2:1.5;x.strokeStyle=lit?'#ffe27a':'#111';x.stroke();
        if(k>=0.5){const nm=WD_NAME[kd].replace(/^\S+\s/,'');x.font='700 11px "Atkinson Hyperlegible Next", system-ui, sans-serif';x.lineWidth=3;x.strokeStyle='rgba(0,0,0,0.85)';x.strokeText(nm,sx,sz-13);x.fillStyle='#f4ecd8';x.fillText(nm,sx,sz-13);}}
      x.textAlign='start';x.textBaseline='alphabetic';}}}
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
  if(mapCapS){const g=capGeo(),sx=X(mapCapS.ax*CELL+PL0+g.c),sz=Z(mapCapS.az*CELL+PL0+g.dc);x.fillStyle='#ffe27a';x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?4:9;x.lineTo(sx+Math.cos(a)*rr,sz+Math.sin(a)*rr);}x.closePath();x.fill();}
  // the markers: everyone's, the one whose menu it is drawn last, on top (and on a controller, the crosshair that Y marks)
  {const own=mapOwner();for(const p of [...players.filter(q=>q!==own),own]){const m=p.active&&markOf(p);if(m)drawPin(x,X(m.x),Z(m.z),markCol(p),p===own);}
   if(inputKind==='pad'){const cx=w/2,cy=h/2;x.strokeStyle='rgba(0,0,0,.7)';x.lineWidth=3;x.beginPath();x.moveTo(cx-9,cy);x.lineTo(cx+9,cy);x.moveTo(cx,cy-9);x.lineTo(cx,cy+9);x.stroke();
     x.strokeStyle='#f4f1e6';x.lineWidth=1.4;x.stroke();}}
  // you (and your friend): arrows pointing the way you face
  for(const p of players){if(!p.active)continue;const px=X(p.pos.x),pz=Z(p.pos.z),hx=Math.sin(p.heading),hz=Math.cos(p.heading);
    x.fillStyle=charTint(p)?'#f08ac0':'#ffffff';x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();
    x.moveTo(px+hx*11,pz+hz*11);x.lineTo(px-hx*6+hz*6,pz-hz*6-hx*6);x.lineTo(px-hx*3,pz-hz*3);x.lineTo(px-hx*6-hz*6,pz-hz*6+hx*6);x.closePath();x.fill();x.stroke();}
  const note=document.getElementById('mapNote');
  if(note)note.textContent=explored.size+' blocks explored. Drag to pan, scroll to zoom, click to set a marker; on a controller, the right stick pans, the triggers zoom and Y sets a marker.';
  // (tiles still to draw: on with them next frame)
  if(more&&menuOpen&&curTab==='map')mapDraw();
}
// the legend, and mouse panning / zooming
{const lg=document.getElementById('mapLegend');
 if(lg){lg.innerHTML=MAP_LEG.map(([k,n])=>'<li tabindex="0" data-k="'+k+'"><i style="background:'+(k==='ruin'?RUIN_SW+';outline:1px solid #e0503c':MAPC[k]||'#e8963a')+'"></i>'+n+'</li>').join('');
  const setHl=k=>{if(MAPV.hl===k)return;MAPV.hl=k;for(const li of lg.querySelectorAll('li'))li.classList.toggle('on',li.dataset.k===k);mapDraw();};
  for(const li of lg.querySelectorAll('li')){li.addEventListener('mouseenter',()=>setHl(li.dataset.k));li.addEventListener('focus',()=>setHl(li.dataset.k));
    li.addEventListener('mouseleave',()=>{if(document.activeElement!==li)setHl(null);});li.addEventListener('blur',()=>setHl(null));}}
 const cv=document.getElementById('mapCanvas');let drag=null;const ptrs=new Map();let pinch=0;
 if(cv&&cv.addEventListener){
  // one finger (or the mouse) drags the map; two fingers pinch to zoom
  const spread=()=>{const v=[...ptrs.values()];return v.length>=2?Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y):0;};
  // (a click or tap that doesn't drag sets a marker there: see mapClick)
  let tap=null,tapT=0;
  cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};pinch=spread();cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);
    tap=ptrs.size===1&&(e.button===undefined||e.button===0)?{x:e.clientX,y:e.clientY,moved:0}:null;});
  cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;if(tap)tap.moved=Math.max(tap.moved,Math.hypot(e.clientX-tap.x,e.clientY-tap.y));ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size>=2){const d=spread();if(pinch>0&&d>0)mapZoom(d/pinch);pinch=d;drag=null;return;}
    if(!drag)return;mapPan(-(e.clientX-drag.x),-(e.clientY-drag.y));drag={x:e.clientX,y:e.clientY};});
  const up=e=>{ptrs.delete(e.pointerId);pinch=spread();drag=null;};
  cv.addEventListener('pointerup',e=>{const t=tap;tap=null;up(e);
    // (held back a moment: a double click or double tap re-centres instead, and leaves the marker alone)
    if(t&&t.moved<6&&e.type==='pointerup'){clearTimeout(tapT);const r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;tapT=setTimeout(()=>mapClick(sx,sy),260);}});
  cv.addEventListener('pointercancel',e=>{tap=null;up(e);});
  cv.addEventListener('dblclick',()=>{clearTimeout(tapT);mapRecentre();});
  cv.addEventListener('wheel',e=>{e.preventDefault();mapZoom(e.deltaY<0?1.15:1/1.15);},{passive:false});
 }
 addEventListener('keydown',e=>{if(menuOpen&&curTab==='map'&&e.code==='KeyC'&&!e.repeat)mapRecentre();});
 addEventListener('resize',()=>{if(menuOpen&&curTab==='map')mapDraw();});
}
const TABS=[['game','Game'],['test','Test'],['map','Map'],['obit','Obit'],['custom','Custom'],['controls','Controls'],['perf','Perf'],['display','Display'],['multi','Multi'],['notes','Notes'],['dev','Dev']];let curTab='game';
// (a tab whose button is hidden -- the Testing Environment's, outside it -- is passed over by next / previous tab)
function showTab(which){
  if(typeof which==='number'){const d=which<tabIndex()?-1:1;for(let k=0;k<TABS.length;k++,which+=d){const T=TABS[(which%TABS.length+TABS.length)%TABS.length];if(!document.getElementById('tabBtn'+T[1]).hidden){which=T[0];break;}}}
  curTab=which;
  for(const [t,id] of TABS){const on=t===which;document.getElementById('tab'+id).hidden=!on;document.getElementById('tabBtn'+id).setAttribute('aria-selected',String(on));}
  if(which==='obit'){obitSel=0;renderObits();}if(which==='controls')renderControls();if(which==='map'){MAPV.cx=null;setTimeout(renderMap,0);}
  menuMode();
}
const tabIndex=()=>TABS.findIndex(t=>t[0]===curTab);
