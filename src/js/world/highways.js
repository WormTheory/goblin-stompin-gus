// ---- raised highways: through a place, a motorway runs up on a deck on pillars along its line. Along-x ones run 14
// blocks up, along-z ones 20 up, so where they cross one passes over the other. (Out on the plains they stay up too,
// curving away on their own line: see the routes.) ----
const HY_X=G+14,HY_Z=G+20;
// (the motorways no longer come down to the ground anywhere: these are kept for the code that asks)
const hwProf=()=>null,hwGround=()=>false;
// a highway at ground level along row k / column k at column a along it: a country highway through a place
const gRow=(k,a)=>ghwRow(k,Math.floor(a/CELL)),gCol=(k,a)=>ghwCol(k,Math.floor(a/CELL));
// the height of the road surface there
// the surface of a town's motorway deck (on line k, at 'al' along it, if given: lower down its ramp to the street)
function hwSurf(ax,k,al){const b=(ax==='x'?HY_X:HY_Z)+1;if(k===undefined||al===undefined)return b;const r=hwRampAt(ax,k,al);return r?Math.max(G+1,b-r.dc/2):b;}
// one column of a raised highway, wherever it is along its length
function hwSeg(a,lx,lz,along,q,HY,alongX,k){hwDeck(a,lx,lz,along,q,HY,alongX);}
// Where a place's motorway leaves it only one way, the deck doesn't just stop: at the end with nowhere to go it ramps
// down onto the street, one block in two, finishing before the next crossroads. Where along line k that ramp is
// (if 'al' is on it): d, the whole blocks down from its top (dc: the same, unrounded), and the way it rises
const hwRampC=new Map();
// a street car at crossroads (ix,iz) can't head off in direction dir: that stretch of street is a motorway's ramp down,
// coming the other way (it can still drive up it from the far end)
let dbgRev=0,dbgJoin=0;
function rampBlocked(ix,iz,dir){const ax=dir%2?'x':'z',k=ax==='x'?iz:ix,c=ax==='x'?ix:iz;return (dir===0||dir===1)?hwDeadEnd(ax,k,c-1)===1:hwDeadEnd(ax,k,c)===-1;}
function hwFootNear(H,c){const k=Math.floor((H.lane+3)/CELL),al=H.ax==='x'?c.pos.x:c.pos.z;for(let d=0;d<=8;d+=2)if(hwRampAt(H.ax,k,al-H.dir*d))return true;return false;}
function hwRampAt(ax,k,al){
  const m=Math.floor(al/CELL),HY=ax==='x'?HY_X:HY_Z,RL=2*(HY-G);
  for(let mm=m-2;mm<=m+1;mm++){const e=hwDeadEnd(ax,k,mm);if(!e)continue;
    // (out: past the crossroads at its top, over the stretch of street the ramp takes over -- built up solid under it)
    if(e>0){const a0=Math.min((mm+1)*CELL,(mm+2)*CELL-RL);if(al>=a0&&al<a0+RL)return{d:Math.floor(al-a0),dc:al-a0,rise:ax==='x'?1:3,out:al>=(mm+1)*CELL+ROADW};}
    else{const a1=Math.max(mm*CELL+ROADW,(mm-1)*CELL+ROADW+RL);if(al<a1&&al>=a1-RL)return{d:Math.floor(a1-1-al)+0,dc:a1-al,rise:ax==='x'?0:2,out:al<mm*CELL};}}
  return null;
}
// how far along the deck a motorway car is from the top of the ramp it's heading for (0 once it's on it), or a long way
function rampAhead(H,al){
  const k=Math.floor((H.lane+3)/CELL),m0=Math.floor(al/CELL),RL=2*((H.ax==='x'?HY_X:HY_Z)-G);
  for(let i=-1;i<=5;i++){const m=m0+i*H.dir;if(hwDeadEnd(H.ax,k,m)!==H.dir)continue;
    const top=H.dir>0?Math.min((m+1)*CELL,(m+2)*CELL-RL):Math.max(m*CELL+ROADW,(m-1)*CELL+ROADW+RL);
    return Math.max(0,(top-al)*H.dir);}
  return 1e9;
}
function hwRampCol(a,lx,lz,q,HY,r,along){
  const put=(y,v)=>{a[li(lx,y,lz)]=v;},y=HY-Math.floor(r.d/2),kind=r.d%2===0?2:1;
  // the deck's lines carry on down it: the centre line all the way to the street's own, the lane lines until it starts to narrow
  let mark=q===6?0:q===7?1:-1;
  // the last stretch tapers from the deck's width to the street's, instead of landing as a block wider than the road
  {const RL=2*(HY-G),left=RL-r.dc,inset=left<16?Math.round((16-Math.max(0,left))/16*3):0;if(!inset&&(q===3||q===9)&&mod(along,6)<3)mark=2;q-=inset;if(q<0||q>13-2*inset)return;if(q===13-2*inset)q=13;}
  for(let yy=y+1;yy<=y+5&&yy<H;yy++)put(yy,AIR);
  if(r.out)for(let yy=G;yy<y;yy++)put(yy,CONCRETE);   // an embankment: the street it lands on doesn't run on underneath it
  if(q===0||q===13){put(y,CONCRETE);if(y>G)put(y+1,CONCRETE);
    if(mod(along,8)===0)for(let yy=y-1;yy>G;yy--)put(yy,CONCRETE);return;}
  put(y,mark<0?rampId(r.rise,kind):rampLineId(r.rise,kind,mark));if(y-1>G)put(y-1,CONCRETE);
}
// is block m the last of a motorway span on line k that goes nowhere beyond it? +1 / -1 (which end), or 0
const hwDeadC=new Map();
function hwDeadEnd(ax,k,m){
  const key=ax+k+','+m;let v=hwDeadC.get(key);if(v!==undefined)return v;v=0;
  if(hwLine(ax,k,m)==='moto'){
    const r0=Math.round((ax==='x'?m:k)/SET_SP),q0=Math.round((ax==='x'?k:m)/SET_SP);
    for(let rx=r0-1;rx<=r0+1&&!v;rx++)for(let rz=q0-1;rz<=q0+1&&!v;rz++){const T=placeAt(rx,rz);if(lineOf(T,ax)!==k)continue;const S=axisSpan(T,ax);if(!S||S.kind!=='moto'||m<S.m0||m>S.m1)continue;
      if(m===S.m1&&!sideUsed(T,ax,1))v=1;else if(m===S.m0&&!sideUsed(T,ax,-1))v=-1;}}
  if(hwDeadC.size>50000)hwDeadC.clear();hwDeadC.set(key,v);return v;
}
// ---- highway interchanges: on- and off-ramps. Along a highway, a four-block stretch of the blocks either side is
// given over to slip roads: on each side, an on-ramp climbs from the street up to the deck and merges in through a
// gap in the crash barrier, and an off-ramp peels away and comes back down, each going the way traffic on that side
// of the highway flows. They climb one block in two (so 28 blocks to the lower decks, 40 to the higher ones), on
// slim decks with low walls and pillars, crossing the side streets overhead.
const icCache=new Map(),RAMP_M=18;   // (the merge lanes: long enough for a lorry to get fully across before the lane ends)
// the interchange (its first block along the highway) on highway ax ('x' row k / 'z' column k) covering block m, or null
function icOf(ax,k,m){
  const seg=Math.floor(m/8),key=ax+k+','+seg;let v=icCache.get(key);
  if(v===undefined){
    v=null;
    const h=hash2(seg*131+(ax==='x'?7:3),k*97+11),m0=seg*8+2+Math.floor(hash2(seg*17+k,k*3+5)*2);
    const SC=settlementAt(ax==='x'?m0+2:k,ax==='x'?k:m0+2);
    if(h<0.55||SC&&SC.type==='city'&&zoneAt(ax==='x'?m0+2:k,ax==='x'?k:m0+2)!=='suburb'){
      let ok=true;
      for(let i=0;i<4&&ok;i++)for(const j of [k-1,k]){
        const px=ax==='x'?m0+i:j,pz=ax==='x'?j:m0+i;
        const ST=settlementAt(px,pz);
        if(isRiver(px,pz)||cloverOf(px,pz)||!ST||ST.type!=='city'||!(ax==='x'?hwRow(k,m0+i):hwCol(k,m0+i))){ok=false;break;}}   // (superblocks keep clear of interchange sites, not the other way round)
      for(let i=-2;i<=6&&ok;i++)if(ax==='x'?hwCol(m0+i,k)||hwCol(m0+i,k-1):hwRow(m0+i,k)||hwRow(m0+i,k-1))ok=false;   // no crossing highway (or its cloverleaf) in the way
      if(ok&&[0,1,2,3].some(i=>ax==='x'?hwRow(k-1,m0+i)||hwRow(k+1,m0+i):hwCol(k-1,m0+i)||hwCol(k+1,m0+i)))ok=false;
      if(ok)v=m0;
    }
    icCache.set(key,v);
  }
  return v!==null&&m>=v&&m<v+4?v:null;
}
// is block (px,pz) part of an interchange site (no buildings there)?
function rampSite(px,pz){
  return (hwRow(pz,px)&&icOf('x',pz,px)!==null)||(hwRow(pz+1,px)&&icOf('x',pz+1,px)!==null)||(hwCol(px,pz)&&icOf('z',px,pz)!==null)||(hwCol(px+1,pz)&&icOf('z',px+1,pz)!==null);
}
// the slip roads of one interchange side: rising stretches (a0..a1, higher toward +a if s>0) and merge stretches at deck
// level. Every ramp's foot comes down right at the edge of a cross street (the first and last streets of the site), so
// cars turn straight off the street onto it, and off it onto the street.
function icRamps(ax,m0,side,HY){
  const L=2*(HY-G),d=ax==='x'?side:-side,out=[],lo=m0*CELL+ROADW,hi=(m0+4)*CELL;
  if(d>0){
    out.push({k:'rise',a0:lo,a1:lo+L,s:1},{k:'merge',a0:lo+L,a1:lo+L+RAMP_M});
    out.push({k:'merge',a0:hi-L-RAMP_M,a1:hi-L},{k:'rise',a0:hi-L,a1:hi,s:-1});
  } else {
    out.push({k:'rise',a0:hi-L,a1:hi,s:-1},{k:'merge',a0:hi-L-RAMP_M,a1:hi-L});
    out.push({k:'merge',a0:lo+L,a1:lo+L+RAMP_M},{k:'rise',a0:lo,a1:lo+L,s:1});
  }
  return out;
}
// the routes cars drive over an interchange side, as waypoints {x,z,v} (v: target speed). d: the way traffic flows.
// on: from the street up the on-ramp, across the merge lane into the outer lane. off: from the outer lane into the
// merge lane, down the off-ramp, and on to the side street below, turning away from the highway.
// on: from the cross street (in the lane nearest the ramp, heading for the highway), a tight turn onto the foot of
// the ramp, up it, across the merge lane into the outer lane. off: from the outer lane into the merge lane, down the
// off-ramp, and a turn at its foot into the cross street's near lane, heading away from the highway.
function icRoutes(ax,k,m0,side){
  const HY=ax==='x'?HY_X:HY_Z,L=2*(HY-G),M=RAMP_M,d=ax==='x'?side:-side,base=k*CELL,away=side>0?1:-1;
  const slip=base+(side>0?14:-6),outer=base+(side>0?8.5:-0.5),mid=base+(side>0?10.5:-3.5),P=(a,c,v,r,g)=>ax==='x'?{x:a,z:c,v,r,g}:{x:c,z:a,v,r,g};
  const S0=m0*CELL,S4=(m0+4)*CELL,lo=S0+ROADW;
  let on,off,onLane,offLane;
  if(d>0){
    onLane=S0+LANE_B;offLane=S4+LANE_A;const ms=S4-L-M;
    on=[P(onLane,slip+away*12,7),P(onLane,slip+away*4.5,6),P(lo-1,slip,6),P(lo+3,slip,6),P(lo+L,slip,9,0,1),P(lo+L+3,slip-away*2,11,1.5),P(lo+L+8,outer+away*0.4,12,1.5),P(lo+L+13,outer,14,1.5),P(lo+L+M+12,outer,16)];
    off={start:ms-12,pts:[P(ms+3,outer,14),P(ms+7,mid,12),P(S4-L-1,slip,10),P(S4-3,slip,7),P(S4+1,slip,6),P(offLane,slip+away*4.5,6),P(offLane,slip+away*14,8)]};   // (straight down to the ramp's foot before turning: a turn begun higher up runs off its side)
  } else {
    onLane=S4+LANE_A;offLane=S0+LANE_B;const me=lo+L+M;
    on=[P(onLane,slip+away*12,7),P(onLane,slip+away*4.5,6),P(S4+1,slip,6),P(S4-3,slip,6),P(S4-L,slip,9,0,1),P(S4-L-3,slip-away*2,11,1.5),P(S4-L-8,outer+away*0.4,12,1.5),P(S4-L-13,outer,14,1.5),P(S4-L-M-12,outer,16)];
    off={start:me+12,pts:[P(me-3,outer,14),P(me-7,mid,12),P(lo+L+1,slip,10),P(lo+3,slip,7),P(lo-1,slip,6),P(offLane,slip+away*4.5,6),P(offLane,slip+away*14,8)]};
  }
  // the street direction a car comes off the ramp into (DIRV order: +z, +x, -z, -x)
  const leaveDir=ax==='x'?(away>0?0:2):(away>0?1:3);
  return{on,off,d,outer,base,HY,leaveDir,away,slip,onLane};
}
// draw the slip-road blocks in one column, if it has any
function rampColumn(put,x,z){
  for(const ax of ['x','z']){
    const a=ax==='x'?x:z,c=ax==='x'?z:x,HY=ax==='x'?HY_X:HY_Z,cf=Math.floor(c/CELL);
    for(const k of [cf,cf+1]){
      const m=Math.floor(a/CELL);if(!(ax==='x'?hwRow(k,m):hwCol(k,m)))continue;
      const base=k*CELL,dc=c-base,side=dc>=10&&dc<=20?1:dc>=-13&&dc<=-3?-1:0;if(!side)continue;
      const m0=icOf(ax,k,m);if(m0===null)continue;
      // across: barrier (the deck's edge), inner wall, the 4-wide lane, outer wall
      const bar=side>0?10:-3,inner=side>0?11:-4,outer=side>0?16:-9,lane=side>0?dc>=12&&dc<=15:dc>=-8&&dc<=-5;
      const street=((a%CELL)+CELL)%CELL<ROADW;
      const RS=icRamps(ax,m0,side,HY);
      const wide=side>0?dc>16:dc<-9;   // just the throat at a ramp's foot, out beyond its outer wall
      for(const R of RS){
        if(a<R.a0||a>=R.a1)continue;
        if(wide&&R.k==='merge')continue;
        // the foot: the pavement between the ramp and the cross street is paved over as road
        if(R.k==='rise'){const foot=R.s>0?a-R.a0:(R.a1-1)-a;if(foot<3&&(side>0?dc>=11&&dc<=20:dc<=-4&&dc>=-13))put(G,ASPHALT);if(wide)break;}
        if(R.k==='merge'){
          // the slip lane ends in a wall at the far end (where it has merged into, or has yet to leave, the highway)
          const endA=RS.some(o=>o.k==='rise'&&o.a1===R.a0)?R.a1-1:R.a0;
          if(a===endA&&(dc===bar||dc===inner||lane)){put(HY-1,CONCRETE);put(HY,CONCRETE);put(HY+1,CONCRETE);}
          else if(dc===bar||dc===inner||lane){put(HY-1,CONCRETE);put(HY,ASPHALT);put(HY+1,AIR);}
          else if(dc===outer){put(HY-1,CONCRETE);put(HY,CONCRETE);put(HY+1,CONCRETE);if(a%8===0&&!street)for(let y=HY-2;y>G;y--)put(y,CONCRETE);}
        } else {
          const t=R.s>0?a-R.a0:(R.a1-1)-a,i=t>>1,hi=t&1,dir=ax==='x'?(R.s>0?0:1):(R.s>0?2:3);
          if(lane){put(G+1+i,rampId(dir,hi?2:1));if(i>0)put(G+i,CONCRETE);}
          else if((dc===inner||dc===outer)&&t>=4){put(G+1+i,CONCRETE);put(G+2+i,CONCRETE);if(i>0)put(G+i,CONCRETE);if(a%8===0&&!street)for(let y=G+i-1;y>G;y--)put(y,CONCRETE);}
        }
        break;
      }
    }
  }
}
// ---- cloverleaf interchanges: where an along-x highway (14 up) crosses an along-z one (20 up), the four blocks round
// each corner of the crossing are given over to a cloverleaf. In each quadrant there's a loop (traffic that has just
// passed under/over the crossing peels off to the right, swings round 270 degrees, climbing or dropping the 6 blocks
// between the decks, and merges onto the other highway before the crossing: a left turn made of right turns) and,
// outside it, a connector (right turns: off the other highway before the crossing, round the outside of the loop,
// and onto this one after it). Everything is laid out once, in one quadrant's own frame (p along road A -- the one the
// loop leaves -- q along road B, both measured from the middle of the crossing), and rotated into the other three.
const cloverCache=new Map();
function cloverAt(j,k){
  const key=j+','+k;let v=cloverCache.get(key);
  if(v===undefined){
    v=hwCol(j,k)&&hwRow(k,j);
    // (anywhere that's built up all round the crossing, so the ramps have somewhere to go: not just in a city)
    if(v){const S=settlementAt(j,k);if(!S)v=false;for(let px=j-2;px<=j+1&&v;px++)for(let pz=k-2;pz<=k+1&&v;pz++)if(settlementAt(px,pz)!==S||biomeOf(px,pz)!=='city')v=false;}
    for(let d=1;d<=3&&v;d++)if(hwCol(j-d,k)||hwCol(j+d,k)||hwRow(k-d,j)||hwRow(k+d,j))v=false;
    for(let px=j-2;px<=j+1&&v;px++)for(let pz=k-2;pz<=k+1&&v;pz++)if(isRiver(px,pz))v=false;
    cloverCache.set(key,v);
  }
  return v;
}
// the crossing whose cloverleaf covers block (px,pz), or null
function cloverOf(px,pz){for(let j=px-1;j<=px+2;j++)for(let k=pz-1;k<=pz+2;k++)if(cloverAt(j,k))return{j,k};return null;}
function rectRamp(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(rampSite(ax+i,az+j))return true;return false;}
function rectClover(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(cloverOf(ax+i,az+j))return true;return false;}
// the pieces, in the quadrant frame (cells [p0,p1)x[q0,q1)). t: 'deck' (road surface), 'wall', 'slope'/'swall' (a ramp's
// road and its walls, axis ax, low cell c0, its c0 end at road h0's height). h: which road's height ('A' or 'B').
// pil: walls carry a pillar every 6 cells along this axis
const CLV=(()=>{
  const P=[],D=(p0,p1,q0,q1,h)=>P.push({t:'deck',p0,p1,q0,q1,h}),W=(p0,p1,q0,q1,h,pil)=>P.push({t:'wall',p0,p1,q0,q1,h,pil});
  const S=(t,p0,p1,q0,q1,ax,c0,h0,pil)=>P.push({t,p0,p1,q0,q1,ax,c0,h0,pil});
  // -- the loop: off road A after the crossing...
  W(7,8,7,13,'A');D(8,19,6,13,'A');W(7,19,13,14,'A','p');
  S('slope',19,31,8,13,'p',19,'A');S('swall',19,31,7,8,'p',19,'A','p');S('swall',19,31,13,14,'p',19,'A','p');
  D(31,36,8,13,'B');W(31,37,7,8,'B','p');W(36,37,7,14,'B','q');                       // first corner
  D(31,36,13,25,'B');W(30,31,13,25,'B','q');W(36,37,13,25,'B','q');
  D(31,36,25,30,'B');W(36,37,25,31,'B');W(30,37,30,31,'B','p');                      // second corner
  D(13,31,25,30,'B');W(13,31,24,25,'B','p');W(13,30,30,31,'B','p');
  D(8,13,25,30,'B');W(7,8,24,31,'B','q');W(7,13,30,31,'B');                          // third corner
  D(8,13,19,25,'B');W(7,8,19,24,'B','q');W(13,14,19,25,'B','q');
  D(6,13,8,19,'B');W(7,13,7,8,'B');W(13,14,7,19,'B','q');                            // ...and into road B's merge lane
  // -- the connector: off road B before the crossing, round the outside of the loop, onto road A after it
  D(6,13,38,50,'B');W(7,13,50,51,'B');W(13,14,38,51,'B','q');
  D(8,13,33,38,'B');W(7,8,32,38,'B','q');W(7,13,32,33,'B');
  D(13,39,33,38,'B');W(13,39,32,33,'B','p');W(14,39,38,39,'B','p');
  D(39,44,33,38,'B');W(44,45,32,39,'B','q');W(39,44,38,39,'B');
  D(39,44,31,33,'B');S('slope',39,44,19,31,'q',19,'A');D(39,44,13,19,'A');
  W(38,39,31,32,'B');W(44,45,31,32,'B');S('swall',38,39,19,31,'q',19,'A','q');S('swall',44,45,19,31,'q',19,'A','q');W(38,39,13,19,'A','q');W(44,45,13,19,'A','q');
  D(39,44,8,13,'A');W(38,39,7,13,'A','q');W(38,44,7,8,'A','p');
  D(44,56,6,13,'A');W(44,56,13,14,'A','p');W(56,57,7,13,'A');
  return P;
})();
// world vector of a quadrant-frame direction, for quadrant n (rotated n quarter turns: (p,q) -> (-q,p) each)
function cvRot(n,a,b){for(let i=0;i<n;i++){const t=a;a=-b;b=t;}return[a,b];}
// draw a column's share of any cloverleaf
function cloverColumn(put,x,z){
  const j0=Math.round((x-4)/CELL),k0=Math.round((z-4)/CELL);
  for(let j=j0-2;j<=j0+2;j++)for(let k=k0-2;k<=k0+2;k++){
    if(!cloverAt(j,k))continue;
    const X=x-(j*CELL+4),Z=z-(k*CELL+4),n=X>=0?(Z>=0?0:3):(Z>=0?1:2);
    const p=n===0?X:n===1?Z:n===2?-X-1:-Z-1,q=n===0?Z:n===1?-X-1:n===2?-Z-1:X;
    if(p<6||q<6||p>57||q>51)continue;
    const even=n%2===0,hA=even?HY_X:HY_Z,hB=even?HY_Z:HY_X,hOf=h=>h==='A'?hA:hB;
    const street=mod(x,CELL)<ROADW||mod(z,CELL)<ROADW;
    const here=CLV.filter(o=>p>=o.p0&&p<o.p1&&q>=o.q0&&q<o.q1);if(!here.length)continue;
    for(const o of here){
      if(o.t==='deck'){const h=hOf(o.h);put(h-1,CONCRETE);put(h,ASPHALT);put(h+1,AIR);put(h+2,AIR);}
      else if(o.t==='wall'){const h=hOf(o.h);put(h-1,CONCRETE);put(h,CONCRETE);put(h+1,CONCRETE);
        if(o.pil&&here.length===1&&!street&&(o.pil==='p'?p:q)%6===0)for(let y=h-2;y>G;y--)put(y,CONCRETE);}
      else{
        // a ramp: 12 cells climbing the 6 blocks between the decks, half a block a cell
        const h0=hOf(o.h0),h1=o.h0==='A'?hB:hA,up=h1>h0,c=o.ax==='p'?p:q,t=up?c-o.c0:(o.c0+11)-c,lo=Math.min(h0,h1),i=t>>1;
        if(o.t==='slope'){
          const v=up?(o.ax==='p'?[1,0]:[0,1]):(o.ax==='p'?[-1,0]:[0,-1]),[wx,wz]=cvRot(n,v[0],v[1]);
          const dir=wx>0?0:wx<0?1:wz>0?2:3;
          put(lo+1+i,rampId(dir,t&1?2:1));put(lo+i,CONCRETE);put(lo+i-1,CONCRETE);put(lo+i+2,AIR);
        } else {put(lo+i,CONCRETE);put(lo+1+i,CONCRETE);put(lo+2+i,CONCRETE);
          if(o.pil&&here.length===1&&!street&&c%6===0)for(let y=lo+i-1;y>G;y--)put(y,CONCRETE);}
      }
    }
    return;
  }
}
// the two routes in quadrant n of crossing (j,k), in world coordinates: the loop (A -> B) and the connector (B -> A).
// start: the distance along the road a car is from the crossing's middle where it decides (it's in the outer lane by then)
function cloverRoutes(j,k,n){
  const cx=j*CELL+4,cz=k*CELL+4,W=(p,q,v,r,g)=>{const [a,b]=cvRot(n,p,q);return{x:cx+a,z:cz+b,v,r,g};};
  const even=n%2===0,hA=even?HY_X:HY_Z,hB=even?HY_Z:HY_X,axA=even?'x':'z',axB=even?'z':'x';
  const [ax_,az_]=cvRot(n,1,0),[bx_,bz_]=cvRot(n,0,-1);
  const dirA=axA==='x'?Math.sign(ax_):Math.sign(az_),dirB=axB==='x'?Math.sign(bx_):Math.sign(bz_);
  const latA=W(0,4.5),latB=W(4.5,0),laneA=axA==='x'?latA.z:latA.x,laneB=axB==='x'?latB.z:latB.x;   // (the across-the-road coordinate, as for laneA)
  const sA=W(-4,0),sB=W(0,57);
  const loop={ax:axA,dir:dirA,start:axA==='x'?sA.x:sA.z,
    pts:[W(8,5.5,13),W(13,8.5,11),W(18,10.5,9),W(31.5,10.5,6,1.5),W(33.5,14.5,5,1.5),W(33.5,26,7,1.5),W(30,27.5,5,1.5),W(12.5,27.5,7,1.5),W(10.5,24,5,1.5),W(9.5,17,8,0,1),W(5,10.5,10,1.5),W(4.5,3,13)],
    join:{ax:axB,dir:dirB,lane:laneB,y:hB+1}};
  const conn={ax:axB,dir:dirB,start:axB==='x'?sB.x:sB.z,
    pts:[W(5.5,48,13),W(8.5,43,11),W(10.5,38,7,1.5),W(10.5,35.5,5,1.5),W(14.5,35.5,6,1.5),W(37.5,35.5,8,1.5),W(41.5,32,5,1.5),W(41.5,10.5,6,1.5),W(46,10.5,9,1.5,1),W(50,8.5,11),W(53,5.5,13),W(60,4.5,15)],
    join:{ax:axA,dir:dirA,lane:laneA,y:hA+1}};
  return{loop,conn};
}
// a highway car nearing a cloverleaf: now and then it takes the loop or the connector there
function cloverChoice(c,H){
  if(!c.hw||c.path)return;
  const a=H.ax==='x'?c.pos.x:c.pos.z,k=Math.floor((H.lane+4)/CELL),ja=Math.round((a-4)/CELL);
  for(let j=ja-2;j<=ja+2;j++){
    const J=H.ax==='x'?j:k,K=H.ax==='x'?k:j;if(!cloverAt(J,K))continue;
    for(let n=0;n<4;n++){const R=cloverRoutes(J,K,n);
      for(const [nm,Rt] of [['l',R.loop],['c',R.conn]]){
        if(Rt.ax!==H.ax||Rt.dir!==H.dir)continue;
        const da=(Rt.start-a)*H.dir,key=J+','+K+nm+n;
        if(da>0&&da<6&&c.cvKey!==key){c.cvKey=key;if(c.veh!=='semi'&&Math.random()<0.3){c.path=Rt.pts.slice();c.pathEnd='join';c.join=Rt.join;c.prevHw=c.hw;c.pathBlk=0;c.hw=null;return;}}
      }}
  }
}
// does a multi-block site span a highway (its inner streets would be built over)?
function rectHighway(ax,az,w,h){for(let i=1;i<w;i++)for(let j=0;j<h;j++)if(hwCol(ax+i,az+j)||ghwCol(ax+i,az+j))return true;for(let j=1;j<h;j++)for(let i=0;i<w;i++)if(hwRow(az+j,ax+i)||ghwRow(az+j,ax+i))return true;return false;}
// (a highway out of town cutting across one of its blocks: nothing big gets built there, or the road would slice straight through it)
function rectCuts(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(routeCuts(ax+i,az+j))return true;return false;}
function rectRiver(ax,az,w,h){for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(isRiver(ax+i,az+j))return true;return false;}
