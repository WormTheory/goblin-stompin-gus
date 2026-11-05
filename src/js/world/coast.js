// ---- the sea: here and there across the world a coastline, the sea beyond it. Decided from a smooth noise over the
// map (and a finer one for the coast's wiggles), so it can turn up anywhere -- except right on top of where you start ----
const SEA_T=0.34,seaPlotC=new Map();
// The ocean: continents and oceans from a very broad, slow noise (with finer ones on top for the bays, headlands and
// islands), plus a long, steady slope down into open ocean off to one side of the world (which side, from the seed), so
// there's always a coast within a day's walk; never right on top of where you start
let OCEAN_DIR=null,OCEAN_O=null;
const seaRaw=(fx,fz)=>0.62*gridNoise(fx,fz,160,991)+0.24*gridNoise(fx,fz,48,557)+0.11*gridNoise(fx,fz,14,313)+0.025*gridNoise(fx,fz,4,211);
function seaV(fx,fz){
  // fx, fz in blocks-of-32 units (fractional): the ocean's value there; over SEA_T is water
  if(!OCEAN_O){
    // the noise slid along so the start lands somewhere well inland (a natural coastline, not a moat round the start)
    OCEAN_O=[0,0];for(let k=0;k<400;k++){const ox=(hash2(k*31+7,503)-0.5)*4000,oz=(hash2(k*17+3,911)-0.5)*4000;
      // (well inland right here, but with real coast within 40 blocks-of-32 or so, in some direction)
      let ok=seaRaw(ox,oz)<SEA_T-0.15;for(let a=0;a<12&&ok;a++){const A=a*Math.PI/6;if(seaRaw(ox+Math.cos(A)*11,oz+Math.sin(A)*11)>SEA_T-0.05)ok=false;}
      if(ok){let wet=false;for(let a=0;a<24&&!wet;a++){const A=a*Math.PI/12;for(const R of [22,30,38])if(seaRaw(ox+Math.cos(A)*R,oz+Math.sin(A)*R)>SEA_T+0.08)wet=true;}ok=wet;}
      if(ok){OCEAN_O=[ox,oz];break;}}
    const a=hash2(9173,4421)*Math.PI*2;OCEAN_DIR=[Math.cos(a),Math.sin(a)];}
  let v=seaRaw(fx+OCEAN_O[0],fz+OCEAN_O[1]);
  const p=fx*OCEAN_DIR[0]+fz*OCEAN_DIR[1];v+=Math.max(0,Math.min(1,(p-40)/30))*0.75;
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
const biomeOf=(px,pz)=>seaPlot(px,pz)?'sea':settlementAt(px,pz)?'city':'plains';
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
const oceanDepth=(x,z)=>Math.max(1,Math.min(28,1+Math.floor(Math.max(0,seaV(x/CELL,z/CELL)-SEA_T)/0.0006*0.33)));
// the sea bed and the water over it: shelving gently from the shore, out to deep ocean; sand, then gravel further out,
// kelp in the shallows and on the shelf, the odd rock
function seaWater(col,x,z,minD,cd){
  if(cd===undefined)cd=coastD(x,z);
  // (shelving up to any nearby land, so a little island sits on a shoal and not on a pillar out of deep water)
  const d=Math.max(minD||1,Math.min(oceanDepth(x,z),1+Math.floor(Math.max(0,cd)*0.6))),f=G-d-1,h=hash2(x*13+5,z*7+3);
  for(let y=f-2;y<f;y++)col(y,SAND);col(f,d>14?(h<0.5?GRAVEL:SAND):SAND);for(let y=G-d;y<=G;y++)col(y,WATER);
  if(d>=5&&d<=20&&h<0.035){const n=Math.min(d-2,2+Math.floor(hash2(x,z*5)*6));for(let y=f+1;y<=f+n;y++)col(y,LEAVES);}   // kelp
  else if(h>0.994){col(f+1,MOSSSTONE);if(h>0.998)col(f+2,MOSSSTONE);}
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
  const w=-cd,bk=beachK(x,z);   // (and no cliffs in front of a town's harbour either: see below)
  // cliffs rise out of the beach as the noise climbs, instead of standing up suddenly beside it
  const rk=Math.max(0,Math.min(1,(gridNoise(x/CELL,z/CELL,7,77)-0.06)/0.14))*(1-beachK(x,z,1));
  if(rk>0&&w<10){
    const ph=Math.max(0,plainsH(x,z)),h0=w<3?w*2.4:7+(ph-7)*Math.min(1,(w-3)/7),h=Math.round(h0*rk);
    if(h>0||rk>0.5){for(let y=G-2;y<G+h;y++)col(y,hash2(x*3+y,z*5)<0.3?MOSSSTONE:STONE);col(G+h,w<3||rk<0.6?STONE:GRASS);return true;}}
  const bw=7+13*bk;
  if(w<bw){col(G,SAND);col(G-1,SAND);col(G-2,SAND);
    if(w>bw-4&&w>4&&gridNoise(x/6,z/6,1,91)>0){col(G+1,SAND);if(hash2(x*5+1,z*3+7)<0.08)col(G+2,LEAVES);}   // the dunes, with marram grass
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
