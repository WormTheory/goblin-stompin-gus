// ---------- Water flow ----------
// Water is finite: a block holds 0 to 8 eighths of water (8 is WATER, 1 to 7 the shallow WATER_L blocks, core/blocks.js),
// and what pours out of one place is taken from it. The flow itself works in 64ths (WF_FULL), kept in wfAmt for water
// it's moved (the block shows the nearest eighth), so a flood can level out nearly flat. Each step, every block of water
// that might move falls into the one under it as far as that has room, then levels out with the open blocks beside it
// (half the difference to each lower one; all it can, if there's water pressing down on it and none on the other), and
// won't wet a dry block with less than WF_FILM unless it pours over an edge, so a flood spreads thin and stops. Knock a hole in an aquarium and
// the tank drains to the bottom of the hole while the water runs out across the floor; dig into a tunnel from the sea bed
// and it floods. Only water that just moved or had something opened beside it is looked at (wfAct), so still water
// costs nothing. The sea, rivers and big lakes are endless (wfEndless): natural water in a body of WF_SEA blocks or more,
// or one running on past the world that's made, never goes down. Water that would go into a chunk not made yet waits for
// it (wfPark). A door lets it through, swinging open (wfSide). Only the host's game runs it (a guest skips the step that does): each block it changes goes through
// addEdit, which saves it and sends it to guests like any smashed block.
const WF_STEP=0.05,WF_BUDGET=6000,WF_MS=2,WF_LOOK=6000,WF_SEA=4000,WF_FULL=64,WF_FILM=12,WF_EVEN=4,WF_BAND=7,WF_PRESS=1500,WF_PRESS_N=6,WF_DRAW=0.15;
const wfRemoved=[];   // (blocks knocked out since the last step, x,y,z each: setRaw adds them, the step looks at them)
const wfAct=new Map();   // (bkey -> [x,y,z]: water that may move next step)
const wfPark=new Map();   // (the same, waiting for a chunk beside it to be made)
const wfAmt=new Map();   // (bkey -> 64ths, for water the flow has left between eighths)
const wfSrc=new Map();   // (bkey -> 1 endless, 0 not: worked out once per body of natural water)
const wfDirty=new Set();   // (chunks with water changed since they were last redrawn: redrawn every WF_DRAW, not every step)
// (still water waiting to freeze in winter, by block: [x,y,z,when it came to rest]. It's left WF_COLD_WAIT seconds, then
// each WF_COLD_T a block has a WF_COLD_P chance of icing over, so a flood freezes over bit by bit, not the moment it stops)
const wfCold=new Map(),WF_COLD_WAIT=8,WF_COLD_T=0.5,WF_COLD_P=0.06;
let wfColdT=0,wfColdClock=0;
let wfClock=0,wfDrawT=0,wfParkT=0,wfTurn=0,wfQuiet=false;   // (wfQuiet: the water's own changes, which setRaw needn't note)
const WF_SIDES=[[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]],WF_N6=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
// how many eighths of water a block holds: 0 open, 1 to 8 water, -1 anything else (water doesn't go there)
// (and the eighths a block shows for an amount in 64ths: the nearest, but never none while there's any)
const wfL=a=>a<=0?0:Math.max(1,Math.min(8,a+4>>3));
// (the eighths shown for an amount, keeping what's shown now while the amount stays within WF_BAND of it: water lapping
// to and fro across the line between two depths would otherwise redraw its chunk every time)
const wfShow=(a,cur)=>a<=0?0:cur>0&&Math.abs(a-cur*8)<=WF_BAND?cur:wfL(a);
const WF_LV=new Int8Array(256).fill(-1);WF_LV[AIR]=0;WF_LV[WATER]=8;for(let n=1;n<8;n++)WF_LV[WATER_L[n]]=n;
// the block there, or -1 if its chunk isn't made (looking would make it)
function wfGet(x,y,z){if(y<0||y>=H||x>=SHIP_X0)return -1;if(!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS))))return -1;return get(x,y,z);}
const wfUnmade=(x,y,z)=>y>=0&&y<H&&x<SHIP_X0&&!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS)));
// (a long-lived list, so it's kept from growing without end: a guest's never looked at, as only the host runs the water)
function wfNoteRemoved(x,y,z){if(wfRemoved.length<WF_LOOK*30)wfRemoved.push(Math.floor(x),Math.floor(y),Math.floor(z));}
function wfWake(x,y,z){const b=wfGet(x,y,z);if(b>0&&WET[b])wfAct.set(bkey(x,y,z),[x,y,z]);}
// (a door lets water through: it swings open for it, dressing/doors-clocks.js. So the block beside, in direction S, is the
// one beyond the door when there's a door there; a wall's only one block thick)
const wfDoor=(x,y,z)=>{const b=wfGet(x,y,z);return b>0&&!!BLOCK[b].door;};
function wfSide(x,y,z,S){const nx=x+S[0],nz=z+S[2];return wfDoor(nx,y,nz)?[nx+S[0],nz+S[2]]:[nx,nz];}
// (what's above and beside a block that's lost water, through doors too, may follow it in)
function wfWakeRound(x,y,z){wfWake(x,y+1,z);for(const S of WF_SIDES){const [nx,nz]=wfSide(x,y,z,S);wfWake(nx,y,nz);}}
// natural water (never changed) that's part of the sea, a river or a big lake: it never runs dry
function wfEndless(x,y,z){
  if(editAt(x,y,z)!==undefined)return false;   // (water that's poured in, or was changed, is only what's there)
  const k=bkey(x,y,z),c=wfSrc.get(k);if(c!==undefined)return c===1;
  const seen=new Set([k]),q=[x,y,z];let big=false;
  for(let i=0;i<q.length&&!big;i+=3){if(seen.size>=WF_SEA){big=true;break;}
    for(const [dx,dy,dz] of WF_N6){const nx=q[i]+dx,ny=q[i+1]+dy,nz=q[i+2]+dz;
      if(wfUnmade(nx,ny,nz)){big=true;break;}   // (it runs on past the world that's made)
      const nk=bkey(nx,ny,nz);if(seen.has(nk)||wfGet(nx,ny,nz)!==WATER)continue;seen.add(nk);q.push(nx,ny,nz);}}
  if(wfSrc.size>400000)wfSrc.clear();
  for(const s of seen)wfSrc.set(s,big?1:0);
  return big;
}
// (from the sea at x,y,z: through water it's poured that's full, to the lowest few blocks no higher than it that aren't full)
function wfPress(x,y,z,amt){
  const seen=new Set([bkey(x,y,z)]),q=[x,y,z],hol=[];
  for(let i=0;i<q.length&&q.length<WF_PRESS*3;i+=3)for(const [dx,dy,dz] of WF_N6){const nx=q[i]+dx,ny=q[i+1]+dy,nz=q[i+2]+dz;
    if(ny>y)continue;const nk=bkey(nx,ny,nz);if(seen.has(nk))continue;seen.add(nk);
    const v=amt(nx,ny,nz);if(v<0||editAt(nx,ny,nz)===undefined)continue;   // (only somewhere that's been opened up)
    if(v<WF_FULL){hol.push([nx,ny,nz]);continue;}
    q.push(nx,ny,nz);}
  return hol.sort((p,q)=>p[1]-q[1]).slice(0,WF_PRESS_N);
}
// how deep the water is over y at (x,z), for wading: 0 if dry. Never makes a chunk
function wadeDepth(x,y,z){const xi=Math.floor(x),zi=Math.floor(z);let yy=Math.floor(y+0.02);if(!WET[peek(xi,yy,zi)])return 0;
  for(let k=0;k<4&&WET[peek(xi,yy+1,zi)];k++)yy++;const t=peek(xi,yy,zi);return Math.max(0,yy+(t===WATER?0.9:BLOCK[t].lvl/8)-y);}
// (can this water freeze now? Out in the open, at rest, and resting on something: the ground, ice, or full water that isn't
// draining away -- never left hanging as a sheet over water still running off underneath)
function wfCanFreeze(x,y,z){const b=wfGet(x,y,z);if(!(b>0&&WET[b])||wfGet(x,y+1,z)!==AIR||wfAct.has(bkey(x,y,z)))return false;
  const u=wfGet(x,y-1,z);if(u<0||wetFalling(u)||u===WATER&&wfAct.has(bkey(x,y-1,z)))return false;
  return y>=ICE_Y0&&y<=ICE_Y1&&chunkFreeze(Math.floor(x/CS),Math.floor(z/CS));}
// (ice whose water's gone from under it melts back to water and goes on down: ice doesn't hang in the air)
function wfUnderIce(x,y,z){const b=wfGet(x,y+1,z);if(b!==ICE&&!ICE_LV[b])return;const u=wfGet(x,y,z);if(u!==AIR&&!wetFalling(u))return;
  const cx=Math.floor(x/CS),cz=Math.floor(z/CS),A=chunkArr(cx,cz),i=li(x-cx*CS,y+1,z-cz*CS);A[i]=b===ICE?WATER:WATER_L[ICE_LV[b]];lastK=-1;
  wfDirty.add(ckey(cx,cz));wfAct.set(bkey(x,y+1,z),[x,y+1,z]);}
function wfFreezeTick(dt){
  wfColdClock+=dt;if(!wfCold.size)return;if(!WX.frozen){wfCold.clear();return;}
  wfColdT+=dt;if(wfColdT<WF_COLD_T)return;wfColdT=0;let n=0;
  for(const [k,c] of wfCold){if(++n>3000)break;if(wfAct.has(k)||wfColdClock-c[3]<WF_COLD_WAIT||Math.random()>=WF_COLD_P)continue;
    const [x,y,z]=c,b0=wfGet(x,y,z);if(!(b0>0&&WET[b0])){wfCold.delete(k);continue;}if(!wfCanFreeze(x,y,z))continue;wfCold.delete(k);   // (gone: forget it; not yet: it waits on)
    const cx=Math.floor(x/CS),cz=Math.floor(z/CS),A=chunkArr(cx,cz),i=li(x-cx*CS,y,z-cz*CS),b=A[i];
    A[i]=b===WATER?ICE:ICE_L[BLOCK[b].lvl];lastK=-1;wfDirty.add(ckey(cx,cz));}}
function updateWater(dt){
  wfFreezeTick(dt);
  wfDrawT+=dt;   // (a big flood over many chunks redraws less often, up to 4 times as long between, so it doesn't fill every frame's rebuilds)
  if(wfDirty.size&&(wfDrawT>=WF_DRAW*Math.min(4,1+Math.max(0,wfDirty.size-4)/4)||!wfAct.size)){wfDrawT=0;rebuildSet(wfDirty);wfDirty.clear();}
  if(!wfRemoved.length&&!wfAct.size&&!wfPark.size)return;
  wfClock+=dt;if(wfClock<WF_STEP)return;wfClock=0;
  // (something opened: the water on it and beside it may move)
  for(let n=0;wfRemoved.length&&n<WF_LOOK;n++){const z=wfRemoved.pop(),y=wfRemoved.pop(),x=wfRemoved.pop();
    wfWakeRound(x,y,z);}
  // (what's waiting at the edge of the made world tries again once a second)
  wfParkT+=WF_STEP;if(wfParkT>=0.999&&wfPark.size){wfParkT=0;for(const [k,v] of wfPark)wfAct.set(k,v);wfPark.clear();}
  if(!wfAct.size)return;
  // (top down, so water pours on down through open air in one step; what came in from the side goes on next step, a block a step)
  const t0=performance.now(),chg=new Map(),got=new Set(),list=[...wfAct.values()].sort((p,q)=>q[1]-p[1]),inL=new Set(wfAct.keys());wfAct.clear();
  wfTurn=(wfTurn+1)&3;
  // (this step's amounts in 64ths: what's changed so far, or what's there; -1 not for water, -2 a chunk not made)
  const amt=(x,y,z)=>{const k=bkey(x,y,z),c=chg.get(k);if(c)return c[3];const b=wfGet(x,y,z);if(b<0)return wfUnmade(x,y,z)?-2:-1;
    const l=WF_LV[b];if(l<=0)return l;const m=wfAmt.get(k);return m!==undefined&&m>0&&Math.abs(m-l*8)<=WF_BAND?m:l*8;};
  const put=(x,y,z,a,side)=>{const k=bkey(x,y,z);chg.set(k,[x,y,z,a]);if(side)got.add(k);else if(!inL.has(k)){inL.add(k);list.push([x,y,z]);}};
  let n=0;
  for(;n<list.length;n++){
    if(n>=WF_BUDGET||(n&255)===255&&performance.now()-t0>WF_MS)break;
    const [x,y,z]=list[n],k=bkey(x,y,z);
    if(got.has(k)){wfAct.set(k,list[n]);continue;}
    let a=amt(x,y,z);if(a<=0)continue;
    const src=a===WF_FULL&&wfEndless(x,y,z);let moved=false,wait=false;
    // (the sea and rivers only pour into somewhere that's been opened up: never into open air the world was made with, so a
    // waterfall, or a river beside a ledge, stays as it was when something's smashed near it)
    const shut=(X,Y,Z,l)=>src&&l===0&&editAt(X,Y,Z)===undefined;
    // down, as far as the block under it has room
    const d=y>0?amt(x,y-1,z):-1;
    if(d===-2)wait=true;
    // (into open air it falls a block a step, so there's water on the way down from where it's pouring out, which the
    // mesh draws as a stream on down to where it lands, render/meshing.js)
    else if(d>=0&&d<WF_FULL&&!shut(x,y-1,z,d)){const m=src?WF_FULL-d:Math.min(a,WF_FULL-d);put(x,y-1,z,d+m,d===0);if(!src)a-=m;moved=true;}
    // then out to the sides, once it can't fall
    if(a>0&&(d<0||d===WF_FULL||src)){
      const up=amt(x,y+1,z)>0;   // (water pressing down on it: it fills what's beside it right up, as in a flooded room)
      for(let j=0;j<4&&a>0;j++){const S=WF_SIDES[(j+wfTurn)&3],[nx,nz]=wfSide(x,y,z,S),s=amt(nx,y,nz);
        if(s===-2){wait=true;continue;}if(s<0||s>=a||shut(nx,y,nz,s))continue;
        const pr=up&&!(amt(nx,y+1,nz)>0);if(!pr&&a-s<WF_EVEN)continue;   // (near enough level: it stops)
        let m=(a-s)>>1;
        if(pr)m=Math.min(a,WF_FULL-s);
        else if(s===0&&a<WF_FILM){const u=amt(nx,y-1,nz);m=u>=0&&u<WF_FULL?a:0;}   // (too little to wet a dry block, unless it goes over the edge)
        if(!m)continue;if(src)m=Math.min(m,WF_FULL-s);put(nx,y,nz,s+m,true);if(!src)a-=m;moved=true;}}
    // the sea presses on: what it's already poured, full to the brim, passes it on to the lowest hollow it reaches no higher
    // than itself, a block a step, so a flooded tunnel or cave fills right up and not just to a slope
    if(src&&!moved)for(const f of wfPress(x,y,z,amt)){put(f[0],f[1],f[2],WF_FULL);moved=true;}
    if(src&&moved)wfAct.set(k,list[n]);   // (it goes on pouring while there's room)
    if(moved){if(!src)put(x,y,z,a);
      // (what's above and beside may follow it in)
      wfWakeRound(x,y,z);}
    if(wait)wfPark.set(k,list[n]);
    // (come to rest in winter: it waits to freeze over, wfFreezeTick)
    else if(!moved&&WX.frozen&&y>=ICE_Y0&&y<=ICE_Y1&&!chg.has(k)&&!wfCold.has(k))wfCold.set(k,[x,y,z,wfColdClock]);
  }
  for(;n<list.length;n++){const [x,y,z]=list[n];wfAct.set(bkey(x,y,z),list[n]);}   // (what the budget didn't reach goes next time)
  // what changed, into the world: saved, sent to guests and redrawn
  const ch=wfDirty,n0=ch.size;wfQuiet=true;
  try{for(const [k,[x,y,z,a]] of chg){
    if(a>0)wfAct.set(k,[x,y,z]);
    const g0=wfGet(x,y,z),l0=g0>0?Math.max(0,WF_LV[g0]):0,l=wfShow(a,l0);if(a>0&&a!==l*8)wfAmt.set(k,a);else wfAmt.delete(k);
    const b=l?l===8?WATER:WATER_L[l]:AIR;if(wfGet(x,y,z)===b)continue;
    setRaw(x,y,z,b);addEdit(x,y,z,b);
    if(l<l0)wfUnderIce(x,y,z);   // (less water here than there was: ice over it may have lost what held it up)
    const cx=Math.floor(x/CS),cz=Math.floor(z/CS),lx=x-cx*CS,lz=z-cz*CS;ch.add(ckey(cx,cz));
    if(lx===0)ch.add(ckey(cx-1,cz));else if(lx===CS-1)ch.add(ckey(cx+1,cz));
    if(lz===0)ch.add(ckey(cx,cz-1));else if(lz===CS-1)ch.add(ckey(cx,cz+1));}}
  finally{wfQuiet=false;}
  if(wfAmt.size>300000)wfAmt.clear();
  if(ch.size>n0)save();
}
