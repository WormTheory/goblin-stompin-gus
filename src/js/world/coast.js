// ---- the sea: here and there across the world a coastline, the sea beyond it. Decided from a smooth noise over the
// map (and a finer one for the coast's wiggles), so it can turn up anywhere -- except right on top of where you start ----
const SEA_T=0.34,seaPlotC=new Map();
// The ocean: continents and oceans, about half of each. A very broad, warped noise gives the continents (big and mid-sized,
// pushed apart by a tanh so there's broad land and broad sea), the lines where a still broader noise crosses zero are
// opened up into ocean (they join up round the continents, so the seas link into oceans rather than sitting in the land as
// lakes), and finer noises on top give the bays, headlands and coastal islands. Out at sea, island chains run along ridges
// off the continents' edges, with the odd group further out. Never right on top of where you start, which is slid along
// the noise to somewhere well inland with a coast in reach.
let OCEAN_O=null,seaDeepK=0,seaIsl=false,seaCcSeed=null;const SEA_CC=new Map();
// (the world's settings, WORLD_CFG: so far the World Generator's Land & sea and Climate sliders: more or less land, continent size,
// coast roughness, ocean channels and island chains, and Island size (islz). The World Generator sets window.GSG_WORLD
// (or the older GSG_SEA) before loading the game; the game itself never changes them, so they're the defaults, which leave
// every sum exactly as it was. A world made with others keeps them in its save (cfg: only what isn't a default, from
// worldCfgSent), so a guest online builds it with the host's)
const WORLD_DEF={land:0,size:1,rough:1,chan:1,isles:1,islz:1,temp:0,rain:0,czone:1,lat:1,mtn:0,mth:1,hill:1,lakes:1,riv:1,rmd:1,rwd:1,rwid:1,rlen:1,rbr:1,towns:1,csize:1,clu:0,sites:1,ter:1,tvar:1};   // (temp, rain, czone, lat: the climate's, world/climate.js; mtn, mth, hill, lakes: the land's shape, world/relief.js; riv, rmd, rwd, rwid, rlen, rbr: the rivers', world/routes.js; towns, csize, clu: the places, world/places.js; sites: farms and the big sites, world/country-sites.js; ter, tvar: the territories' size and how much it varies, world/territories.js)
const WORLD_CFG=Object.assign({},WORLD_DEF);
// (sets them from o, anything missing or not a number at its default: only before the world's worked out (loading), as
// what's been worked out already isn't redone)
function worldCfgSet(o){for(const k in WORLD_DEF)WORLD_CFG[k]=o&&typeof o[k]==='number'&&isFinite(o[k])?o[k]:WORLD_DEF[k];seaCcSeed=null;clSeed=null;seaPlotC.clear();plotCache.clear();if(RLF_SH)RLF_SH.clear();rlfRtC.clear();rlfRvC.clear();rlfRt16.clear();rlfRv16.clear();RLF_AIR.clear();RLF_MAPC.clear();RLF_VC.clear();RLF_VL.clear();if(RIV_H){RIV_H.clear();RIV_LV.clear();}rivCfg();terClear();}
const worldCfgSent=()=>{let o;for(const k in WORLD_DEF)if(WORLD_CFG[k]!==WORLD_DEF[k])(o=o||{})[k]=WORLD_CFG[k];return o;};
if(typeof window!=='undefined'&&(window.GSG_WORLD||window.GSG_SEA))worldCfgSet(window.GSG_WORLD||window.GSG_SEA);
function seaCont(fx,fz){
  if(WORLD_CFG.size!==1){fx/=WORLD_CFG.size;fz/=WORLD_CFG.size;}
  const wx=fx+420*gridNoise(fx,fz,1100,1201)+45*gridNoise(fx,fz,260,1223),wz=fz+420*gridNoise(fx,fz,1100,1307)+45*gridNoise(fx,fz,260,1327);
  let c=0.6*gridNoise(wx,wz,1500,1409)+0.28*gridNoise(wx,wz,600,1511)+0.12*gridNoise(wx,wz,210,1613);
  const ch=1-Math.abs(gridNoise(wx,wz,2600,1709)+0.25*gridNoise(wx,wz,700,1733));c+=0.5*WORLD_CFG.chan*Math.max(0,ch-0.65)/0.35;
  return Math.tanh(c*3)/Math.tanh(1.5)*0.5-0.165-0.1*WORLD_CFG.land;   // (the -0.165: about half the world land, measured over many seeds)
}
// (that's slow, and smooth over hundreds of blocks-of-32, so it's worked out once per corner of each one and blended)
function seaContAt(ix,iz){const k=ix*100003+iz;let v=SEA_CC.get(k);if(v===undefined){if(SEA_CC.size>300000)SEA_CC.clear();v=seaCont(ix,iz);SEA_CC.set(k,v);}return v;}
function seaContL(fx,fz){
  if(seaCcSeed!==seed){seaCcSeed=seed;SEA_CC.clear();OCEAN_O=null;}   // (a new city without a reload)
  const ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,w=fz-iz;
  if(!u&&!w)return seaContAt(ix,iz);   // (right on a corner, as the World Generator's far-out map asks: the same value, a quarter of the work)
  return (seaContAt(ix,iz)*(1-u)+seaContAt(ix+1,iz)*u)*(1-w)+(seaContAt(ix,iz+1)*(1-u)+seaContAt(ix+1,iz+1)*u)*w;
}
function seaRaw(fx,fz){
  // (+ is ocean: over SEA_T is water)
  const c=seaContL(fx,fz);
  // (the continent's edge made steep, so the finer noises only nudge the coast in and out -- bays, headlands, coves --
  // rather than carving it into long thin fingers, lakes and specks for miles either side of it)
  seaIsl=false;
  let v=SEA_T+c*0.9+0.16*Math.tanh(c/0.025)+0.08*WORLD_CFG.rough*gridNoise(fx,fz,150,541)+0.09*WORLD_CFG.rough*gridNoise(fx,fz,60,557)+0.045*WORLD_CFG.rough*gridNoise(fx,fz,16,313)+0.012*WORLD_CFG.rough*gridNoise(fx,fz,5,211);
  if(c>0.03){
    // (island chains: spots of land strung along ridges just off the continents' edges, each island a whole round one,
    // not a stringy line; and now and then a group of them further out)
    const e=Math.max(0,1-Math.abs(c-0.13)/0.09)*Math.max(0,Math.min(1,(gridNoise(fx,fz,400,1931)+0.05)/0.3));   // (off some coasts, not all)
    // (islz, the Island size slider, stretches the islands' noise and widens the ridge to hold them, while fading the
    // finer ripple and raising the cut-off, so bigger islands come with fewer specks between; at 1 every sum is as it was)
    const iz=WORLD_CFG.islz,rip=1/(iz*iz),cut=0.1+0.1*iz;
    const r=1-Math.abs(gridNoise(fx,fz,170,1759)+0.3*gridNoise(fx,fz,45,1811)),arc=Math.max(0,Math.min(1,(r-(1-0.25*Math.sqrt(iz)))/(0.12*Math.sqrt(iz))));
    const spot=Math.max(0,gridNoise(fx,fz,14*iz,2213)+0.2*rip*gridNoise(fx,fz,7*iz,2239)-cut)/0.45;
    const reg=Math.max(0,gridNoise(fx,fz,500,1913)-0.5)/0.5,blob=Math.max(0,gridNoise(fx,fz,22*iz,2017)+0.25*rip*gridNoise(fx,fz,7*iz,2111)-0.45);
    // (a ceiling on the value rather than taken off it: between the islands the value is calm and level, so the sea bed
    // rises smoothly round each one, straight from that value (oceanDepth, with seaIsl), rather than in steps)
    const isl=spot*arc*e*1.6*WORLD_CFG.isles+blob*reg*3.2*WORLD_CFG.isles;const f=SEA_T+(0.25-isl)*0.8;if(f<v){v=f;seaIsl=true;}}
  seaDeepK=Math.max(0,Math.min(1,(c-0.04)/0.2));   // (how far out into an ocean basin: off the continental shelf)
  return v;
}
function seaV(fx,fz){
  // fx, fz in blocks-of-32 units (fractional): the ocean's value there; over SEA_T is water
  if(seaCcSeed!==seed)seaContL(0,0);
  if(!OCEAN_O){
    // the noise slid along so the start lands somewhere well inland (a natural coastline, not a moat round the start)
    OCEAN_O=[0,0];const NT=WORLD_CFG.size!==1||WORLD_CFG.land||WORLD_CFG.chan!==1?4000:800;   // (the sliders' far ends can need longer)
    for(let k=0;k<NT;k++){const ox=(hash2(k*31+7,503)-0.5)*4000*WORLD_CFG.size,oz=(hash2(k*17+3,911)-0.5)*4000*WORLD_CFG.size;
      // (well inland right here, but with real coast within 40 blocks-of-32 or so, in some direction)
      let ok=seaRaw(ox,oz)<SEA_T-0.08;for(let a=0;a<12&&ok;a++){const A=a*Math.PI/6;if(seaRaw(ox+Math.cos(A)*11,oz+Math.sin(A)*11)>SEA_T-0.03)ok=false;}
      if(ok){let wet=false;for(let a=0;a<24&&!wet;a++){const A=a*Math.PI/12;for(const R of [22,30,38])if(seaRaw(ox+Math.cos(A)*R,oz+Math.sin(A)*R)>SEA_T+0.03)wet=true;}ok=wet;}
      // (and on a continent, not an island off one: land still in a good few directions far off)
      if(ok){let n=0;for(let a=0;a<24;a++){const A=a*Math.PI/12;for(const R of [250*WORLD_CFG.size,400*WORLD_CFG.size])if(seaRaw(ox+Math.cos(A)*R,oz+Math.sin(A)*R)<SEA_T)n++;}ok=n>=16;}
      if(ok){OCEAN_O=[ox,oz];break;}}}
  let v=seaRaw(fx+OCEAN_O[0],fz+OCEAN_O[1]);
  const d=Math.hypot(fx,fz);if(d<8)v-=(1-d/8)*1.5;
  return v;
}
const seaBlk=(x,z)=>seaV(x/CELL,z/CELL)+0.009*gridNoise(x/CELL,z/CELL,1,71)+0.004*gridNoise(x/CELL,z/CELL,0.35,73);
// a block that the sea (or its beach) reaches into at all: 'sea' biome; 2 if it's all water
function seaPlot(px,pz){
  if(TEST_OFF.has('sea'))return 0;
  const k=px*100003+pz;let v=seaPlotC.get(k);if(v!==undefined)return v;v=0;
  let mx=-9,mn=9;for(const a of [0,0.25,0.5,0.75,1])for(const b of [0,0.25,0.5,0.75,1]){const q=seaV(px+a,pz+b);if(q>mx)mx=q;if(q<mn)mn=q;}
  // (near the line: how near the water each part of the block actually is -- a block counts once the water, or its
  // beach, comes within about 10 blocks of it)
  if(mn>SEA_T+0.05)v=2;
  else if(mx>SEA_T-0.08){let cx=-1e9,cn=1e9;for(const a of [0,8,16,24,31])for(const b of [0,8,16,24,31]){const c=coastD(px*CELL+a,pz*CELL+b);if(c>cx)cx=c;if(c<cn)cn=c;}
    if(cx>-3)v=cn>3?2:1;}
  if(seaPlotC.size>200000)seaPlotC.clear();seaPlotC.set(k,v);return v;
}
// (the realm a plot is in: sea, city or plains. Not the climate's biome, which is biomeAt in world/climate.js)
const realmOf=(px,pz)=>seaPlot(px,pz)?'sea':settlementAt(px,pz)?'city':'plains';
// ---- the coast: what each block along the shore is ----
// Ports take whole stretches of coast: the land blocks along the shore in a port's patch of the map are paved over as
// its yard (container stacks and quayside cranes, or a naval base), and the water blocks next to them dredged out as
// basins, square-edged, where the ships tie up. A shore block next to a town is its harbour (a sea wall, a promenade,
// piers and moored boats); now and then a lonely headland gets a lighthouse; the rest is beach and open sea.
// A place that actually reaches the water is a coastal one: a city a coastal city (its shipping port, docks one side of
// that and a beach the other), a town a harbor town (docks and a beach) or a resort town (all beach), a village a fishing
// village (a little wharf). Naval bases, lighthouses, rigs and wrecks stand alone; the rest of the coast is just shore.
const N4=[[1,0],[-1,0],[0,1],[0,-1]];
function coastWf(px,pz){let wf=0;for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(seaBlk(px*CELL+4+i*8,pz*CELL+4+j*8)>=SEA_T)wf++;return wf;}
// the shore blocks a place has on its doorstep, in the order you'd go round it
function setFront(S){
  if(S._front)return S._front;const L=[],seen=new Set(),R=Math.ceil(S.R*1.5)+3;
  for(let x=S.cx-R;x<=S.cx+R;x++)for(let z=S.cz-R;z<=S.cz+R;z++){if(settlementAt(x,z)!==S)continue;
    for(const [a,b] of N4){const qx=x+a,qz=z+b,k=qx+','+qz;if(seen.has(k))continue;seen.add(k);if(seaPlot(qx,qz)===1&&coastWf(qx,qz)>=1)L.push([qx,qz]);}}
  if(L.length){let vx=0,vz=0;for(const [x,z] of L){vx+=x-S.cx;vz+=z-S.cz;}S._bear=Math.atan2(vz,vx);
    const of=L.map(q=>setOff(S,q[0],q[1])).sort((a,b)=>a-b);S._cuts=of;}
  return S._front=L;
}
function setOff(S,px,pz){let a=Math.atan2(pz-S.cz,px-S.cx)-S._bear;while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function setKind(S){
  if(S._kind)return S._kind;let k=S.type;
  if(setFront(S).length){const h=hash2(S.rx*83+11,S.rz*127+5);k=S.type==='city'?'coastcity':S.type==='large'?(h<0.3?'resort':'harbortown'):S.type==='small'?(h<0.5?'resort':'harbortown'):'fishing';}
  return S._kind=k;
}
// is this bit of a coastal place's shore its docks or its beach?
function coastRole(S,px,pz){
  const k=setKind(S);if(k==='fishing')return'harbor';if(k==='resort')return'beach';
  if(k==='coastcity'||k==='harbortown'){const c=S._cuts,cut=c[Math.floor((c.length-1)*(k==='coastcity'?0.5:0.6))];return setOff(S,px,pz)<=cut?'harbor':'beach';}
  return k==='village'?null:'beach';
}
// a block that could be a port's yard: shore, mostly land, with water beside it
const yardSite=(px,pz)=>seaPlot(px,pz)===1&&landish(px,pz)&&N4.some(([a,b])=>seaPlot(px+a,pz+b)&&!landish(px+a,pz+b));
// a coastal city's port: the patch of its coast with the most room for one
function cityPort(S){
  if(S._port)return S._port;const P=new Set(),c=new Map(),seen=new Set();
  if(setKind(S)==='coastcity'){for(const [fx,fz] of S._front)for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const x=fx+a,z=fz+b,k=x+','+z;if(seen.has(k))continue;seen.add(k);if(yardSite(x,z)){const q=Math.floor(x/8)*100003+Math.floor(z/8);c.set(q,(c.get(q)||0)+1);}}
    let best=null,bn=0;for(const [q,n] of c)if(n>bn){bn=n;best=q;}if(best!==null)P.add(best);}
  return S._port=P;
}
// the coastal place a bit of shore belongs to, if any
const coastOwnC=new Map();
function coastOwner(px,pz){
  const k=px*100003+pz;let v=coastOwnC.get(k);if(v!==undefined)return v;v=null;
  const t=seaPlot(px,pz)?coastType(px,pz):null;
  if(t==='harbor'||t==='beach'||t==='yard'||t==='basin'){let bd=1e9;for(let a=-9;a<=9;a++)for(let b=-9;b<=9;b++){const S=settlementAt(px+a,pz+b);if(!S)continue;const d=a*a+b*b;if(d<bd&&(t!=='yard'&&t!=='basin'||setKind(S)==='coastcity')){bd=d;v=S;}}}
  if(coastOwnC.size>50000)coastOwnC.clear();coastOwnC.set(k,v);return v;
}
const portC=new Map();
function portCell(px,pz){
  const cx=Math.floor(px/8),cz=Math.floor(pz/8),k=cx*100003+cz;let v=portC.get(k);if(v!==undefined)return v;v=null;
  const h=hash2(cx*197+41,cz*233+17),mx=cx*8+4,mz=cz*8+4,rx=Math.round(mx/SET_SP),rz=Math.round(mz/SET_SP);
  // (a shipping port only as part of a coastal city; a naval base only well away from any place)
  let nearAny=false;
  for(let a=rx-1;a<=rx+1&&!v;a++)for(let b=rz-1;b<=rz+1&&!v;b++){const S=settlementLat(a,b),d=Math.hypot(S.cx-mx,S.cz-mz);if(d<S.R*1.4+8)nearAny=true;if(S.type==='city'&&d<S.R*1.5+14&&cityPort(S).has(k))v='ship';}
  if(!v&&!nearAny&&h>0.5&&h<0.56)v='navy';
  if(portC.size>50000)portC.clear();portC.set(k,v);return v;
}
const landish=(px,pz)=>seaV(px+0.5,pz+0.5)<SEA_T;
const COAST=new Set(['sea','shore','harbor','beach','lighthouse','yard','navy','basin','nbasin','rig','wreck']);
const coastC=new Map();
function coastType(px,pz){
  const v=coastType1(px,pz);if(!TEST_OFF.size)return v;const key=v==='basin'?'yard':v==='nbasin'?'navy':v;
  if(!TEST_OFF.has(key)||v==='sea'||v==='shore')return v;
  return (v==='basin'||v==='nbasin')&&seaPlot(px,pz)===2?'sea':'shore';
}
// a block that a port's yard would go on (if its patch of coast has a port): shore, mostly land, with water beside it
function yardCand(px,pz){return !!portCell(px,pz)&&yardSite(px,pz);}
function coastType1(px,pz){
  const k=px*100003+pz;let v=coastC.get(k);if(v!==undefined)return v;
  const s=seaPlot(px,pz),K=portCell(px,pz);v=null;
  if(K&&yardCand(px,pz))v=K==='ship'?'yard':'navy';
  else if(s&&!landish(px,pz))for(const [a,b] of N4)if(yardCand(px+a,pz+b)){v=portCell(px+a,pz+b)==='ship'?'basin':'nbasin';break;}
  if(!v&&s===1){const wf=coastWf(px,pz);
    // (on a place's doorstep: its docks, or its beach, whichever this stretch of it is)
    if(wf>=1)for(const [a,b] of N4){const S=settlementAt(px+a,pz+b);if(S){const q=coastRole(S,px,pz);if(q==='harbor')v='harbor';else if(q==='beach'&&wf<=13)v='beach';break;}}
    if(!v&&landish(px,pz)&&hash2(px*61+7,pz*43+9)<0.07&&N4.some(([a,b])=>seaPlot(px+a,pz+b)&&!landish(px+a,pz+b)))v='lighthouse';
    // a town's beach: sandy shore within a few blocks of a place
    if(!v&&wf>=1&&wf<=13){let S=null;for(let a=-3;a<=3&&!S;a++)for(let b=-3;b<=3&&!S;b++)S=settlementAt(px+a,pz+b);if(S&&coastRole(S,px,pz)==='beach')v='beach';}}
  // out at sea: now and then an oil rig (well out, in deep water), or a wreck on the bottom
  if(!v&&s===2){const h=hash2(px*311+5,pz*173+9);
    if(h<0.0016&&N4.every(([a,b])=>seaPlot(px+a,pz+b)===2)&&coastD(px*CELL+16,pz*CELL+16)>60)v='rig';
    else if(h>0.996)v='wreck';}
  if(!v)v=s===2?'sea':'shore';
  if(coastC.size>100000)coastC.clear();coastC.set(k,v);return v;
}
// which way from (px,pz) each neighbour of the given types lies
const sidesOf=(px,pz,types)=>N4.filter(([a,b])=>types.includes(plotType(px+a,pz+b)));
// in a block, measured from its side (a,b): how far in from that edge (0 = the edge row), and the position along it
const fromSide=(a,b,rx,rz)=>a>0?CELL-1-rx:a<0?rx:b>0?CELL-1-rz:rz;
const alongSide=(a,b,rx,rz)=>a?rz:rx;
function coastInfo(p,px,pz,r,base){
  const t=p.type;p.stall=0;p.benches=false;p.lots=[];p.coast=true;
  if(t==='yard'||t==='navy'){
    p.wet=sidesOf(px,pz,[t==='yard'?'basin':'nbasin']);
    p.site=sidesOf(px,pz,t==='yard'?['yard','basin']:['navy','nbasin']);
    if(t==='yard'){
      // ship-to-shore cranes: two along each quay, legs on the land and the boom out over the water
      p.cranes=[];const X0=px*CELL,Z0=pz*CELL;
      // (along one quay: on a corner, two lots of booms would run through each other)
      for(const [a,b] of p.wet.slice(0,1))for(const c of [9,23]){
        const ax=a?'x':'z',s=a||b,E=ax==='x'?(s>0?X0+CELL:X0):(s>0?Z0+CELL:Z0);
        p.cranes.push({ax,s,E,c:(ax==='x'?Z0:X0)+c});}
    } else {
      // the naval base: a dry dock off one quay (a warship up on blocks in it), or two long barrack blocks
      if(p.wet.length&&r(150)<0.6)p.dock=p.wet[0];
      else for(const [z0,z1] of [[PL0,PL0+7],[PL1-8,PL1-1]]){const b=base({x0:PL0,x1:PL1-1,z0,z1,top:G+FH,wall:STUCCO,win:WIN_BLUE,band:CONCRETE,kind:'apartment',ground:'office',floor:FLOORT,door:z0===PL0?3:2});b.detailTop=b.top-1;p.b.push(b);}
    }
  } else if(t==='basin'||t==='nbasin'){
    const yd=sidesOf(px,pz,[t==='basin'?'yard':'navy']);
    if(yd.length)p.ship={side:yd[0],k:t==='basin'?'cargo':'navy',L:28,hw:t==='basin'?4:3};
  } else if(t==='harbor'){
    // the town's side, and how far out the sea wall stands (where the shore runs, squared off)
    const land=N4.find(([a,b])=>settlementAt(px+a,pz+b));p.land=land;const [a,b]=land;p.fish=setKind(settlementAt(px+a,pz+b))==='fishing';
    p.rdW=a?segOpen(px+a,pz,1):segOpen(px,pz+b,0);p.rdU=a?segOpen(a<0?px:px+1,pz,0):segOpen(px,b<0?pz:pz+1,1);
    let Q=22;for(let u=4;u<28;u++){const rx=a>0?CELL-1-u:a<0?u:16,rz=b>0?CELL-1-u:b<0?u:16;if(seaBlk(px*CELL+rx,pz*CELL+rz)>=SEA_T){Q=u;break;}}
    p.Q=Math.max(8,Math.min(22,Q));
    // (a village's one pier: wherever along its front the water's longest, so the coast's slant doesn't leave it without)
    if(p.fish){let bn=5;p.pw=-1;for(let w=6;w<=24;w++){let n=0;for(let u=2;u<CELL;u++){const rx=a>0?CELL-1-u:a<0?u:w,rz=b>0?CELL-1-u:b<0?u:w;if(seaBlk(px*CELL+rx,pz*CELL+rz)>=SEA_T)n++;}if(n>bn){bn=n;p.pw=w;}}}
    // (the berths between the piers. What lies in one goes by the kind of place: trawlers and rowboats in a village, tugs in a city's docks)
    const moor=setKind(settlementAt(px+a,pz+b))==='coastcity'?['tug','launch','fish','sail']:p.fish?['fish','row','fish','row']:['fish','sail','launch','fish'];
    p.boats=[];for(const [wc,i] of p.fish?[[7,0],[24,1]]:[[4,0],[16,1],[27,2]]){if(p.fish&&Math.abs(wc-p.pw)<7)continue;const a0=p.Q+3;if(r(170+i)>=0.85)continue;
      let k=moor[Math.floor(r(160+i)*4)];if(a0+BOATS[k].L+1>CELL)k='row';const L=BOATS[k].L,hw=Math.ceil(BOATS[k].W/2)+1;if(a0+L+1>CELL)continue;
      const at=(u,w)=>{const rx=a>0?CELL-1-u:a<0?u:w,rz=b>0?CELL-1-u:b<0?u:w;return seaBlk(px*CELL+rx,pz*CELL+rz)>=SEA_T+0.004;};
      if(at(a0-1,wc-hw)&&at(a0-1,wc+hw)&&at(a0+L,wc-hw)&&at(a0+L,wc+hw)&&at(a0+(L>>1),wc))p.boats.push({wc,a0,L,k});}
    // (a village's fish shack, on the gravel behind the wharf, if there's dry ground for it)
    if(p.fish&&p.Q>=11){const dry=(u,w)=>{const rx=a>0?CELL-1-u:a<0?u:w,rz=b>0?CELL-1-u:b<0?u:w;return coastD(px*CELL+rx,pz*CELL+rz)<-2;};if(dry(p.Q-9,13)&&dry(p.Q-9,19)&&dry(p.Q-4,13)&&dry(p.Q-4,19))p.shack={u0:p.Q-9,u1:p.Q-4,w0:13,w1:19};}
  } else if(t==='beach'){
    for(let k=0;k<40&&!p.lg;k++){const lx=3+Math.floor(r(200+k)*26),lz=3+Math.floor(r(260+k)*26),w=-coastD(px*CELL+lx,pz*CELL+lz);if(w>=4&&w<=8)p.lg={x:lx,z:lz};}
  } else if(t==='lighthouse'){
    // (out on the point: as near the water as the ground allows)
    let bx=PC,bz=PC,bv=-9;for(const ox of [-8,-4,0,4,8])for(const oz of [-8,-4,0,4,8]){const v=seaV(px+(PC+ox)/CELL,pz+(PC+oz)/CELL);if(v<SEA_T-0.03&&v>bv){bv=v;bx=PC+ox;bz=PC+oz;}}
    p.lh={x:bx,z:bz};
    const b=base({x0:bx-4,x1:bx+5,z0:bz-4,z1:bz+5,top:G+27,style:'lighthouse',wall:PAINT_WHITE,win:PAINT_RED,kind:'landmark',ground:'landmark',floor:STONE,door:2,farSkip:true});
    b.doorSpec={w:0,h:3,k:'wood'};b.beam=true;b.detailTop=b.top;p.b.push(b);
  }
}
// a lighthouse: a round tower banded red and white, a stair winding up inside, a gallery and the lantern on top
function lighthouseAt(b,rx,rz,y){
  const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1,u=rx-cx,v=rz-cz,d=Math.hypot(u,v),fl=y-G;
  if(fl<=21){const R=4.45-fl*0.045;
    if(d>R)return AIR;
    if(d>R-1){STRUCT=true;if(fl<=3&&u===0&&v<0)return DOOR_W;if(fl%6===3&&(u===0||v===0)&&d>3)return GLASS;return Math.floor((fl-1)/5)%2?PAINT_RED:PAINT_WHITE;}
    // the stair: one step a level, round and round the inside of the wall
    if(fl>=1&&d>R-2.6){const ang=Math.atan2(v,u),want=(fl*0.55)%(Math.PI*2)-Math.PI;let da=Math.abs(ang-want);if(da>Math.PI)da=Math.PI*2-da;if(da<0.5)return PLANKS;}
    if(fl===21&&d<=R-2.6)return PLANKS;
    return AIR;}
  if(fl===22)return d<=4.6?(d>3.6?STONE:PLANKS):AIR;                     // the gallery
  if(fl===23&&d>3.6&&d<=4.6)return FENCE;                                 // its railing
  if(fl>=23&&fl<=25){if(d<=2.6&&d>1.6){STRUCT=true;return GLASS;}if(d<1)return LAMP;return AIR;}   // the lantern
  if(fl===26)return d<=2.9?PAINT_RED:AIR;
  if(fl===27)return d<=1.6?PAINT_RED:AIR;
  return AIR;
}
// roughly how far (in blocks) (x,z) is from the shoreline: + out to sea, - inland (from the value and how fast it's
// changing there)
function coastD(x,z){
  const v=seaBlk(x,z),gx=seaBlk(x+2,z)-seaBlk(x-2,z),gz=seaBlk(x,z+2)-seaBlk(x,z-2);
  return (v-SEA_T)/Math.max(Math.hypot(gx,gz)/4,0.0004);
}
// how deep the sea is here, from the broad shape of the coast rather than the distance to the shoreline: that distance is
// worked out from how fast the value's changing, which jumps about, and left pits and steps all over the sea bed
// (no deeper than 12 on the continental shelf, down to 28 out over an ocean basin: seaV leaves which in seaDeepK; round an
// island out at sea, seaIsl, the sea bed rises straight from the island's value, down to the open sea bed by the time
// the island no longer sets the value)
function oceanDepth(x,z){
  const v=seaV(x/CELL,z/CELL),cap=12+Math.round(16*seaDeepK),u=Math.max(0,v-SEA_T);
  return Math.max(1,Math.min(cap,1+Math.floor(seaIsl?u/0.16*cap:u/0.0006*0.33)));
}
// the sea bed and the water over it: shelving gently from the shore, out to deep ocean; sand, then gravel further out,
// kelp in the shallows and on the shelf, the odd rock
function seaWater(col,x,z,minD,cd){
  if(cd===undefined)cd=coastD(x,z);
  // (the shore's flavour, close in: under cliffs the bed drops away faster, mangroves stand in a shallow muddy flat, and a
  // cold shore's bed is shingle)
  const F=cd<CF_IW+24?coastFlav(x,z):0,rc=F>=0&&cd<CF_IW+24?CF_RC:0,mg=F===3&&cd<CF_MW&&beachK(x,z,1)<0.3;
  // (shelving up to any nearby land, so a little island sits on a shoal and not on a pillar out of deep water)
  // (under a fjord's wall, a cold shore at its most rugged, the water's deep right up to it, however shallow the sea is
  // further out: eased in by how rugged it is and out again by 40 blocks from the shore, so it never ends in a step)
  const od=oceanDepth(x,z),fk=(F===1||F===2)?Math.max(0,Math.min(1,(rc-0.5)*4,(40-cd)/16)):0,d0=Math.max(minD||1,seaIsl?od:Math.min(od,1+Math.floor(Math.max(0,cd)*(0.6+1.2*rc))),Math.round(fk*Math.min(4+Math.max(0,cd)*2.5,24))),d=mg?Math.min(d0,2):d0,f=G-d-1,h=hash2(x*13+5,z*7+3);
  for(let y=f-2;y<f;y++)col(y,SAND);col(f,mg?MUD:(F===1||F===2)&&cd<14?GRAVEL:d>14?(h<0.5?GRAVEL:SAND):SAND);for(let y=G-d;y<=G;y++)col(y,WATER);
  if(d>=5&&d<=20&&h<0.035){const n=Math.min(d-2,2+Math.floor(hash2(x,z*5)*6));for(let y=f+1;y<=f+n;y++)col(y,LEAVES);}   // kelp
  else if(h>0.994){col(f+1,MOSSSTONE);if(h>0.998)col(f+2,MOSSSTONE);}
  if(F===2)iceShelf(col,x,z,cd);else if(mg)mangroveCol(col,x,z,f+1);
  else if(rc>0.4&&cd>=3&&cd<=24)seaStack(col,x,z,f);   // (sea stacks and arches off a rugged shore, world/wonders.js)
}
// the shore's flavour by its climate (plan section 6.3): 0 sand, 1 shingle (cold), 2 an ice shelf (frozen), 3 mangroves
// (warm and wet), 4 the badlands' red sand. From the blended climate, dithered a little per column so one gives way to the
// next raggedly rather than along a line. Into CF_RC, how rugged the land is (0..1), which stands any shore up into cliffs
const CF_IW=24,CF_MW=16,CF_HW=22;let CF_RC=0;
// how high a headland may stand at (x,z): rising 1.5 a block from a road, railway or river, 1.2 from the edge of a block
// that's neither open plains nor natural shore (a town, a farm, a site), 0 in one
function coastCap(x,z){
  let e=Math.min(roadNear(x,z),railDist(x,z,40)-4)*1.25;
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL),rx=x-px*CELL,rz=z-pz*CELL;
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const qx=px+dx,qz=pz+dz;
    if(PLAINS_OPEN(qx,qz)||seaPlot(qx,qz)&&(coastType(qx,qz)==='shore'||coastType(qx,qz)==='sea'))continue;
    const ex=dx<0?rx:dx>0?CELL-1-rx:0,ez=dz<0?rz:dz>0?CELL-1-rz:0;e=Math.min(e,Math.max(dx?ex:0,dz?ez:0));}
  return Math.max(0,e*1.2);
}
function coastFlav(x,z){
  const c=climAt(x,z),t=c.t,m=c.m;CF_RC=nzClamp01((clBlend('r')-0.32)/0.2);
  // (nudged as the biomes' columns are, bioJit, so one kind of shore gives way to the next in stretches of each rather than
  // at a line or speckled block by block)
  const J=bioJit(x,z),tj=t+J[0],mj=m+J[1];
  if(tj<0.17)return 2;if(tj<0.36)return 1;if(mj>0.8&&tj>0.55||tj>0.8&&mj>0.62)return 3;
  return bioPick(tj,mj,x,z,J[2])===BIO_I.badlands?4:0;
}
// what kind of natural shore (x,z) is, for the maps: 0 sand, 1 shingle, 2 an ice shelf, 3 mangroves, 4 red sand (as
// coastFlav), 5 cliffs and headlands (rugged), 6 a fjord's walls (cold and most rugged, as natLand builds them)
function coastKind(x,z){const F=coastFlav(x,z),rc=CF_RC;return (F===1||F===2)&&rc>0.5?6:F===2||F===3?F:rc>0.15?5:F;}
const COAST_KC=['#dccb92','#a4a298','#e4f0f4','#4f7a42','#c8764a','#7e7a70','#5c6470'],COAST_KN=['Sandy shores','Shingle shores','Ice shelves','Mangroves','Red sand shores','Cliffs & headlands','Fjords'];
// an ice shelf along a frozen shore: sea ice two blocks thick out to a ragged edge (11 to 24 blocks out), snow drifted on
// it, bites out of its edge, and floes beyond, thinning out. None in front of a town's beach or harbour (their boats)
function iceShelf(col,x,z,cd){
  if(cd>CF_IW+22||beachK(x,z,1)>0.1)return;
  const W=CF_IW*(0.45+0.55*nzClamp01(0.5+0.7*nzNoise(x/40,z/40,4431))),h=hash2(x*17+4433,z*29+4435);
  if(cd<W){if(cd>W-2.5&&h<0.15)return;col(G-1,PACKICE);col(G,PACKICE);if(cd<W-3&&nzNoise(x/9,z/9,4437)>0.25)col(G+1,SNOW);return;}
  if(nzNoise(x/5,z/5,4439)>0.4+0.5*(cd-W)/22)col(G,PACKICE);
}
// mangroves on a warm, wet shore: trees on arched roots in the shallows and on the mud, one to a 6-block cell where the
// cell's hash says, their crowns overlapping. The column's part of every tree within reach, the crowns first and then the
// wood, from y0 (the sea bed's top, or the ground's) up
const MG_T=[];
function mangroveCol(col,x,z,y0){
  const ix=Math.floor(x/6),iz=Math.floor(z/6);let n=0;
  for(let a=ix-1;a<=ix+1;a++)for(let b=iz-1;b<=iz+1;b++){
    const hh=hash2(a*31+4451,b*17+4453);if(hh>0.8)continue;
    const cx=a*6+1+Math.floor(hash2(a*7+4457,b*3+4459)*4),cz=b*6+1+Math.floor(hash2(a*5+4461,b*11+4463)*4),u=x-cx,v=z-cz;
    if(u<-3||u>3||v<-3||v>3)continue;
    const cd=coastD(cx,cz);if(cd<-4||cd>CF_MW-2||coastFlav(cx,cz)!==3||beachK(cx,cz,1)>=0.3)continue;
    MG_T[n++]=[u,v,4+Math.floor(hh*3.75),2.2+hash2(a*13+4465,b*5+4467)*1.2];}
  for(let i=0;i<n;i++){const [u,v,hg,R]=MG_T[i],r2=u*u+v*v;
    if(r2<=R*R)for(let y=G+hg-(r2<=(R-1)*(R-1)?1:0);y<=G+hg+(r2<=2?2:1);y++)col(y,LEAVES);}
  for(let i=0;i<n;i++){const [u,v,hg]=MG_T[i],au=Math.abs(u),av=Math.abs(v);
    const top=au+av===0?G+hg:au===1&&av===1?G+2:au+av===2&&(au===0||av===0)?G+1:-1;
    for(let y=y0;y<=top;y++)col(y,LOG);}
}
// the natural shore: open water; then either a sandy beach (wide where it's a town's) backed by dunes, or rocky cliffs
// standing up out of the water; then the grass. True if it's water here
function natCoast(col,x,z,kind){
  const cd=coastD(x,z);
  if(cd>=0){seaWater(col,x,z,1,cd);return true;}
  if(!natLand(col,x,z,kind,cd))plainsColumn(col,x,z,true);return false;
}
// near the water but dry: the beach or the cliffs (also reaching into the plains blocks along the shore). True if done
const nearSeaC=new Map();
function nearSea(px,pz){const k=px*100003+pz;let v=nearSeaC.get(k);if(v===undefined){v=false;for(let a=-1;a<=1&&!v;a++)for(let b=-1;b<=1&&!v;b++)if(seaPlot(px+a,pz+b))v=true;if(nearSeaC.size>100000)nearSeaC.clear();nearSeaC.set(k,v);}return v;}
// how much of a town's wide beach this spot is (0..1), blended across the blocks so the sand widens and narrows gradually
// instead of jumping at a block's edge
function beachK(x,z,orHarbor){
  const fx=x/CELL-0.5,fz=z/CELL-0.5,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,b=(p,q)=>{const t=coastType(p,q);return t==='beach'||orHarbor&&t==='harbor'?1:0;},s=t=>t*t*(3-2*t),su=s(u),sv=s(v);
  return (b(i,j)*(1-su)+b(i+1,j)*su)*(1-sv)+(b(i,j+1)*(1-su)+b(i+1,j+1)*su)*sv;
}
function natLand(col,x,z,kind,cd){
  const w=-cd,bk=beachK(x,z),bk1=beachK(x,z,1),F=coastFlav(x,z),rc=CF_RC;   // (and no cliffs in front of a town's harbour either: see below)
  // a rugged shore stands up out of the sea as a headland: a sheer face over a rocky foot, a top as high as the land's own
  // (the more rugged, the more of it), easing down toward the land behind from 12 blocks in. Kept back from roads,
  // railways, rivers and anything built (coastCap), and from a town's beach or harbour
  if(rc>0.15&&w<CF_HW&&bk1<0.5){
    // (a cold shore at its most rugged is a fjord's wall: higher, and sheer from the water up. Where the land's only just
    // rugged enough the headland comes in low and set back behind a strip of the beach, s, growing out to the water and
    // to its full height as the ruggedness climbs, so a beach becomes a headland along the shore rather than at a step)
    const s=nzSmooth(0.15,0.45,rc),fj=(F===1||F===2)&&rc>0.5,P=Math.round(s*rc*Math.min(Math.max(reliefNat(x,z),fj?16:10),fj?40:28)),w0=(1-s)*7,cap=P>=2&&w>=w0?coastCap(x,z):0;
    if(P>=2&&cap>=2){const ph=w>=12?Math.max(0,plainsH(x,z)):0,v=w-w0,h=Math.round(Math.min(cap,v<0.8&&!fj?Math.min(P,2):v<3*(1-s)?Math.min(P,1+v*2):w<12?P:P+(ph-P)*(w-12)/(CF_HW-12)));
      if(h>0){for(let y=G-2;y<G+h;y++)col(y,hash2(x*3+y,z*5)<0.3?MOSSSTONE:STONE);col(G+h,w<1.5?STONE:F===2?SNOW:BIOMES[biomeAt(x,z)].top||GRASS);return true;}}}
  // cliffs rise out of the beach as the noise climbs, instead of standing up suddenly beside it
  const rk=Math.max(0,Math.min(1,(gridNoise(x/CELL,z/CELL,7,77)-0.06)/0.14))*(1-bk1);
  if(rk>0&&w<10){
    const ph=Math.max(0,plainsH(x,z)),h0=w<3?w*2.4:7+(ph-7)*Math.min(1,(w-3)/7),h=Math.round(h0*rk);
    if(h>0||rk>0.5){for(let y=G-2;y<G+h;y++)col(y,hash2(x*3+y,z*5)<0.3?MOSSSTONE:STONE);col(G+h,w<3||rk<0.6?STONE:F===2?SNOW:BIOMES[biomeAt(x,z)].top||GRASS);return true;}}
  // (mangroves: a strip of mud under their trees, unless a town's cleared it for its beach)
  if(F===3&&bk<0.3&&w<8){col(G,MUD);col(G-1,MUD);col(G-2,DIRT);mangroveCol(col,x,z,G+1);return true;}
  const bw=7+13*bk;
  // a cold shore's shingle: gravel and cobbles, a ridge of it at the back, the odd piece of driftwood, snow over it all on a
  // frozen one
  if(w<bw&&(F===1||F===2)){const h=hash2(x*5+1,z*3+7);let y=G;col(G-2,GRAVEL);col(G-1,GRAVEL);col(G,h<0.12?COBBLE:h<0.16?STONE:GRAVEL);
    if(w>bw-4&&w>4&&gridNoise(x/6,z/6,1,91)>0)col(++y,GRAVEL);else if(h>0.994&&w>2)col(++y,LOG);
    if(F===2)col(y+1,SNOW);return true;}
  if(w<bw){const sd=F===4?RED_SAND:SAND;col(G,sd);col(G-1,sd);col(G-2,sd);
    if(w>bw-4&&w>4&&gridNoise(x/6,z/6,1,91)>0){col(G+1,sd);if(hash2(x*5+1,z*3+7)<0.08)col(G+2,LEAVES);}   // the dunes, with marram grass
    return true;}
  return false;
}
// what's afloat, in blocks: L long, W wide, d below the waterline, fb from the waterline up to the deck, hp, how fast it goes,
// what it's called when it's sunk and what that's worth. (The models and how they go are with the venues: see makeBoat.)
const CONT_C=[PAINT_RED,PAINT_BLUE,PAINT_GREEN,PAINT_ORANGE,PAINT_YELLOW,PAINT_WHITE,RUST,PAINT_NAVY];
const BOATS={
  pedalo:{L:2.8,W:1.6,d:.3,fb:.45,hp:15,sp:1.2,name:'Pedal boat',sc:25},
  row:{L:4.4,W:1.6,d:.3,fb:.45,hp:30,sp:2,name:'Rowboat',sc:50},
  speed:{L:7,W:2.4,d:.5,fb:.8,hp:60,sp:13,name:'Speedboat',sc:150,boom:1},
  launch:{L:10,W:3,d:.7,fb:1.1,hp:90,sp:7,name:'Motor launch',sc:200,boom:1},
  sail:{L:11,W:3,d:.8,fb:1,hp:80,sp:4,name:'Yacht',sc:250},
  fish:{L:13,W:3.8,d:1,fb:1.4,hp:120,sp:4,name:'Trawler',sc:300,boom:1.2},
  tug:{L:14,W:4.6,d:1.4,fb:1.4,hp:200,sp:5,name:'Tugboat',sc:400,boom:1.4},
  ferry:{L:28,W:7,d:1.6,fb:2,hp:400,sp:6,name:'Ferry',sc:800,boom:2},
  navy:{L:30,W:7,d:2.4,fb:3,hp:700,sp:6,name:'Warship',sc:2000,boom:3},
  cargo:{L:56,W:11,d:3,fb:3,hp:1000,sp:5,name:'Container ship',sc:2000,boom:3},
};
// a wreck on the sea bed, in its own frame: a along it, c across, h above the bed. It broke its back going down, so the bow
// lies skewed off the stern with a gap between; rusted through in places, and a stump of the bridge left. null: not part of it
function wreckBlock(a,c,h,seed){
  if(a<0||a>=30||a>=13&&a<17)return null;
  const bowEnd=a>=17,cc=bowEnd?c-3:c,ac=Math.abs(cc),H=bowEnd?5-Math.floor((a-17)/5):5;
  let w=4;if(a>21)w=4*(29-a)/8+0.4;if(a===0)w=3.4;
  const hole=hash2(seed+a*7+h*13,c*5+h)<(h>2?0.32:0.12);
  if(h<=H&&ac<=w){if(ac>w-1||h===0)return hole?null:RUST;return AIR;}
  if(a>=2&&a<=7&&ac<=3&&h>H&&h<=H+4-(a>>2)&&(a===2||a===7||ac===3))return hole?null:METAL;
  return null;
}
// a quayside crane: legs on the land (on its rails, t -3 and -11 from the edge), the boom right out over the water
const CRANE_REACH=13;
function craneBlock(t,wa,fl){
  const aw=Math.abs(wa);
  if((t===-3||t===-11)&&aw===3&&fl>=1&&fl<=19)return PAINT_RED;                 // the legs
  if(fl===12&&aw===3&&t>=-11&&t<=-3)return PAINT_RED;                           // the sill beam between them
  if(fl===19&&(t===-3||t===-11)&&aw<=3)return PAINT_RED;                        // the portal beams
  // the boom (only so far out: quays stand facing each other across a basin, and their booms mustn't meet)
  if(fl===20&&aw===2&&t>=-16&&t<=CRANE_REACH)return PAINT_RED;
  if(fl===21&&aw===0&&t>=-16&&t<=CRANE_REACH)return PAINT_RED;
  if(fl===20&&aw<=1&&t>=-16&&t<=CRANE_REACH&&t%4===0)return METAL;
  if(t===-7&&aw===2&&fl>=21&&fl<=26)return PAINT_RED;                            // the A-frame
  if(t===-7&&aw<=2&&fl===26)return PAINT_RED;
  if(t>=-15&&t<=-12&&aw<=2&&fl>=21&&fl<=23)return PAINT_WHITE;                   // the machine house
  if(t>=1&&t<=2&&aw<=1&&(fl===18||fl===19))return t===2?WIN_BLUE:PAINT_WHITE;   // the driver's cab
  if(t===7&&aw<=1&&fl===19)return METAL;                                         // the trolley...
  if(t===7&&wa===0&&fl>=14&&fl<=18)return CHAINLINK;                             // ...its hoist...
  if(t>=4&&t<=9&&aw<=1&&(fl===12||fl===13))return fl===13?PAINT_BLUE:PAINT_BLUE; // ...and the box on the hook
  return AIR;
}
function craneCol(col,x,z){
  const px=Math.floor(x/CELL),pz=Math.floor(z/CELL);
  for(const [a,b] of [[0,0],...N4]){if(plotType(px+a,pz+b)!=='yard')continue;const P=plotInfo(px+a,pz+b);
    for(const C of P.cranes){const q=C.ax==='x'?x:z,w=C.ax==='x'?z:x,t=C.s>0?q-C.E:C.E-1-q,wa=w-C.c;
      if(t<-16||t>17||Math.abs(wa)>3)continue;
      for(let fl=1;fl<=27;fl++){const v=craneBlock(t,wa,fl);if(v)col(G+fl,v);}}}
}
