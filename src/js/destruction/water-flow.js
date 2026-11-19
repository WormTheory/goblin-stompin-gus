// ---------- Water flow ----------
// Knock out a block that water was resting on (or holding back at the side) and the water pours into the hole, then on
// into any open space it reaches that's no higher than its own surface, until that space is full: a pit dug under a river
// fills up, a tunnel broken into from the sea bed floods all the way along. The water it came from stays put (the sea and
// the rivers don't run dry), but a small body of water (under WF_BIG blocks) spills no more than it holds (a fountain's
// spout spills a few blocks, not a plaza's worth). It spreads one block further every WF_STEP seconds, so it's seen
// pouring in, and it waits at the edge of the world that's made, going on when that part is (a breach's park). WF_CAP is only
// a safety net, so one breach into a huge network of tunnels can't grow the save without end.
// Only the host's game runs it (a guest skips the step that does): each block it fills goes through addEdit, which saves
// it and sends it to guests like any smashed block.
const WF_CAP=20000,WF_BIG=300,WF_STEP=0.25,WF_PER_STEP=160,WF_LOOK=6000;
const wfRemoved=[];   // (blocks knocked out since the last step, x,y,z each: setRaw adds them, the step looks at them)
const wfJobs=[];   // a breach being filled: {top: the water's surface, front: the blocks to fill next (x,y,z each), left,
                  //  park: blocks it reached whose chunk isn't made yet, waiting for it (x,y,z each)}
const wfSeen=new Set();   // (blocks some breach already means to fill, so two breaches into one hole don't both count it)
let wfClock=0;
const WF_SIDES=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]],WF_N6=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
// the block there, or -1 if its chunk isn't made (looking would make it, and the water never needs to go that far)
function wfGet(x,y,z){if(y<0||y>=H||x>=SHIP_X0)return -1;if(!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS))))return -1;return get(x,y,z);}
// (a long-lived list, so it's kept from growing without end: a guest's never looked at, as only the host fills)
function wfNoteRemoved(x,y,z){if(wfRemoved.length<WF_LOOK*30)wfRemoved.push(Math.floor(x),Math.floor(y),Math.floor(z));}
// how much water there is in the body that (x,y,z) is part of, counting no further than WF_BIG (past that it's endless)
function wfBody(x,y,z){
  const seen=new Set([x+','+y+','+z]),q=[x,y,z];
  for(let i=0;i<q.length&&seen.size<WF_BIG;i+=3)for(const [dx,dy,dz] of WF_N6){
    const nx=q[i]+dx,ny=q[i+1]+dy,nz=q[i+2]+dz,k=nx+','+ny+','+nz;
    if(seen.has(k)||wfGet(nx,ny,nz)!==WATER)continue;seen.add(k);q.push(nx,ny,nz);}
  return seen.size>=WF_BIG?WF_CAP:seen.size;
}
// (a block's chunk not made yet: the only kind of -1 from wfGet worth waiting for)
const wfUnmade=(x,y,z)=>y>=0&&y<H&&x<SHIP_X0&&!chunks.has(ckey(Math.floor(x/CS),Math.floor(z/CS)));
// a block just knocked out: if water sits on it or beside it, a breach starts filling it
function wfBreach(x,y,z){
  if(wfGet(x,y,z)!==AIR||wfSeen.has(x+','+y+','+z))return;
  let top=-1,from=null;
  const look=(nx,ny,nz)=>{if(wfGet(nx,ny,nz)!==WATER)return;let t=ny;while(wfGet(nx,t+1,nz)===WATER)t++;if(t>top){top=t;from=[nx,ny,nz];}};
  look(x,y+1,z);for(const [dx,,dz] of WF_SIDES)look(x+dx,y,z+dz);
  if(!from)return;
  wfSeen.add(x+','+y+','+z);wfJobs.push({top,front:[x,y,z],park:[],left:wfBody(from[0],from[1],from[2])});
}
function updateWater(dt){
  if(!wfRemoved.length&&!wfJobs.length)return;
  wfClock+=dt;if(wfClock<WF_STEP)return;wfClock=0;
  for(let n=0;wfRemoved.length&&n<WF_LOOK;n++){const z=wfRemoved.pop(),y=wfRemoved.pop(),x=wfRemoved.pop();wfBreach(x,y,z);}
  let budget=WF_PER_STEP;const ch=new Set();
  for(const J of wfJobs){
    // (what was waiting at the edge of the made world goes on once its chunk is made)
    if(J.park.length){const still=[];for(let k=0;k<J.park.length;k+=3){const x=J.park[k],y=J.park[k+1],z=J.park[k+2];
      if(wfUnmade(x,y,z))still.push(x,y,z);else J.front.push(x,y,z);}J.park=still;}
    const next=[];let i=0;
    for(;i<J.front.length&&budget>0&&J.left>0;i+=3){const x=J.front[i],y=J.front[i+1],z=J.front[i+2];
      if(wfUnmade(x,y,z)){J.park.push(x,y,z);continue;}   // (its chunk let go since, as the players moved off)
      if(wfGet(x,y,z)!==AIR)continue;
      setRaw(x,y,z,WATER);addEdit(x,y,z,WATER);budget--;J.left--;
      for(const ox of[-1,0,1])for(const oz of[-1,0,1])ch.add(ckey(Math.floor((x+ox)/CS),Math.floor((z+oz)/CS)));
      // on to what's open round it, down first, and up only as far as the water's surface
      for(const [dx,dy,dz] of WF_N6){const nx=x+dx,ny=y+dy,nz=z+dz,k=nx+','+ny+','+nz;
        if(ny>J.top||wfSeen.has(k))continue;
        if(wfUnmade(nx,ny,nz)){wfSeen.add(k);J.park.push(nx,ny,nz);continue;}
        if(wfGet(nx,ny,nz)!==AIR)continue;wfSeen.add(k);next.push(nx,ny,nz);}}
    // (what the budget didn't reach this step goes first next time)
    J.front=J.left>0?J.front.slice(i).concat(next):[];if(J.left<=0)J.park=[];
  }
  for(let j=wfJobs.length-1;j>=0;j--)if(!wfJobs[j].front.length&&!wfJobs[j].park.length)wfJobs.splice(j,1);
  if(!wfJobs.length)wfSeen.clear();
  if(ch.size){rebuildSet(ch);save();}
}
