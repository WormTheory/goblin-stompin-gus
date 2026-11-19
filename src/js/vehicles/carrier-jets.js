// ---- the aircraft carrier's jets (phase 4). Fighter jets (makeJet) stand parked about the flight deck, in a venue of
// the ship's own (an airport flagged tenv and ship, so updateTenvPlanes flies them), hung off the ship's picture and in its
// pocket like the cars and tanks aboard (shipVehEach), so they ride along, are flown off its edge, and are carried back
// into the pocket flying in over it. Two ways the carrier helps them: its catapults (taxi on to one, nose along the track,
// and open the throttle wide: held a moment, then flung down the track and off the end at flying speed) and its
// arresting wires (lower the hook with the weapon button, touch down on the angled strip, and the hook catches a wire
// and stops it dead in a few lengths). At general quarters pilots run to them, are towed on to the catapults, launched,
// and fly attack runs at you, then come back and land on the wires (jetAI) ----
// (where they're parked: [s, w, facing]; clear of the landing strip, the catapults and the deck weapons)
const CV_JETS=[[9,-70,0.3],[9,-56,0.3],[9,-42,0.3],[11,18,0.35],[11,32,0.35],[-11,22,-0.35],[-11,36,-0.35],[-11,50,-0.35]];
// the catapults, as the deck's paint has them (carrier.js): the bow pair, straight ahead, and the waist pair along the
// angled deck: [s at the start, w at the start, heading, length]
const CV_ANGH=Math.atan(0.16);   // (the angled deck's heading in the pocket, toward the bow and out to port)
const CV_CATS=[[-5,38,0,48],[5,38,0,48],[cvAng(-24)+3,-24,CV_ANGH,30],[cvAng(-24)-3,-24,CV_ANGH,30]];
// (the arresting wires: across the angled strip at these w, as far out as its edges)
const CV_WIRES=[-70,-66,-62,-58];
const CAT_V=78,CAT_HOLD=0.7;   // (the speed it leaves a catapult at, and how long it's held on it first)
// the jets, made with the ship (makeShip): parked, empty
function shipJetsInit(S){
  if(S.kind!=='carrier'||S.jetV)return;
  const V={kind:'airport',tenv:true,ship:S,planes:[],pl:[]};S.jetV=V;venues.set('shipJets:'+S.n,V);
  CV_JETS.forEach(([s,w,h],i)=>{const g=makeJet(),x=S.ox-s+0.5,z=S.oz+w+0.5;g.position.set(x,G+17,z);g.rotation.set(0,h,0);S.pg.add(g);
    const pl={isPlane:true,jet:true,cvJet:true,S,home:i,g,hp:PLANE_HP,dead:false,v:0,crew:null};
    // (where it is, for the crews' code, which runs to a vehicle by its x, z and heading)
    Object.defineProperties(pl,{x:{get(){return this.g.position.x;}},z:{get(){return this.g.position.z;}},yaw:{get(){return this.g.rotation.y;}}});
    V.planes.push(g);V.pl.push(pl);});
}
// (dropped with the ship: anyone flying one is put out first, and those still aboard go with it)
function shipJetsDrop(S){const V=S.jetV;if(!V)return;
  V.pl=V.pl.filter(pl=>{if(players.some(q=>q.drv&&q.drv.o===pl)||pl.g.position.x<SHIP_X0&&pl.free&&!pl.dead)return true;if(pl.g.parent)pl.g.parent.remove(pl.g);return false;});
  V.planes=V.pl.map(pl=>pl.g);if(!V.pl.length)venues.delete('shipJets:'+S.n);}
// a carrier jet's place in its ship's frame: s, w and heading, or null if it isn't aboard one
function jetOnShip(pl){const P=pl.g.position;if(P.x<SHIP_X0)return null;const S=shipOfPos(P.x,P.z);if(!S||S.kind!=='carrier')return null;
  return{S,s:S.ox-P.x,w:P.z-S.oz,h:pl.g.rotation.y};}
// ---- the catapults: has it rolled to a stop at the start of one, lined up? Then it's hooked on to it, held there till
// the throttle's wide open ----
function jetCatCheck(pl,p){
  const F=pl.free;if(!pl.jet||pl.cat||F.v>8)return;const J=jetOnShip(pl);if(!J)return;
  for(const c of CV_CATS){const [s0,w0,h,len]=c,du=-(J.s-s0),dw=J.w-w0,al=du*Math.sin(h)+dw*Math.cos(h),ac=du*Math.cos(h)-dw*Math.sin(h);
    if(al<-6||al>10||Math.abs(ac)>2.5||Math.abs(angDiff(J.h,h))>0.45)continue;
    pl.cat={S:J.S,c,ph:'wait',t:0,d:Math.max(0,al)};F.v=0;
    if(p)flashLabel('On the catapult: open the throttle wide to launch',p);if(audio)sfx('Catapult hooked on',()=>{thud(0.4);tone('square',300,260,0.08,0.03);});return;}
}
// one step on the catapult (from drvPlane, in place of its own): held, then down the track, building to CAT_V by the
// end, and let go there. True while it's still on it
function jetCatTick(pl,dt){
  const C=pl.cat,F=pl.free,g=pl.g,S=C.S,[s0,w0,h,len]=C.c;if(S.dead||!shipOfPos(g.position.x,g.position.z)){pl.cat=null;return false;}
  C.t+=dt;F.rl=0;F.air=false;
  if(C.ph==='wait'){F.v=0;if(F.thr>=0.95){C.ph='hold';C.t=0;if(audio)sfx('Catapult tension',()=>{noise(0.6,0.12,900,'bandpass');tone('sawtooth',90,140,0.6,0.05);});}}   // (sat on it till the throttle's wide open)
  else if(C.ph==='hold'){F.thr=1;F.v=0;if(Math.random()<dt*20)puff(g.position.x,G+17.3,g.position.z,1,0xf2f4f6,0.6);
    if(C.t>=CAT_HOLD){C.ph='go';C.t=0;if(audio)sfx('Catapult launch',()=>{noise(1.0,0.4,700,'lowpass');thud(0.7);tone('sawtooth',70,30,0.8,0.12);});}}
  else{F.thr=1;F.v=Math.min(CAT_V,F.v+CAT_V*CAT_V/(2*len)*dt);C.d+=F.v*dt;if(Math.random()<dt*30)puff(g.position.x,G+17.2,g.position.z,1,0xf2f4f6,0.8);}
  const d=Math.min(C.d,len);g.position.set(S.ox-s0+0.5+Math.sin(h)*d,G+17,S.oz+w0+0.5+Math.cos(h)*d);
  F.pt=C.ph==='go'?Math.min(0.12,C.d/len*0.12):0;F.gm=0;F.vy=0;g.rotation.set(-F.pt,h,0,'YXZ');pl.v=F.v;
  if(C.d>=len){pl.cat=null;F.pt=0.14;F.gm=0.05;return false;}   // (off the end: flying, nose up)
  return true;
}
// ---- the hook and the wires ----
function jetHookSwap(pl,p){pl.hook=!pl.hook;jetHookPose(pl);if(p)flashLabel(pl.hook?'Hook down: land on the angled strip to catch a wire':'Hook up',p);
  if(audio)sfx('Arresting hook',()=>tone('square',pl.hook?520:700,pl.hook?380:900,0.08,0.03));}
// (the hook itself, under the tail: made the first time it's lowered)
function jetHookPose(pl){const m=pl.g.children[0];if(!pl.hookM){const k=new THREE.Group();k.position.set(0,1.1,-6.6);
    const b=new THREE.Mesh(LM_BOX,JETM.dark);b.scale.set(0.18,0.18,2.2);b.position.set(0,0,-1.1);k.add(b);
    const t=new THREE.Mesh(LM_BOX,JETM.dark);t.scale.set(0.5,0.25,0.25);t.position.set(0,0,-2.2);k.add(t);m.add(k);pl.hookM=k;}
  pl.hookM.rotation.x=pl.hook?0.75:-0.05;}
// rolling along the deck (drvPlane, on the ground) with the hook down: as the hook passes over a wire on the angled
// strip, it catches it. (Past the last one it's a bolter: open the throttle and go round)
function jetTrapCheck(pl,p){
  if(!pl.hook||pl.trap||pl.free.v<8)return;const J=jetOnShip(pl);if(!J)return;const tw=J.w-Math.cos(J.h)*5,ts=J.s+Math.sin(J.h)*5;   // (where the hook is: off the tail)
  const k=CV_WIRES.findIndex(w=>Math.abs(tw-w)<1.6);if(k<0||Math.abs(ts-cvAng(tw))>8.5)return;pl.trap={n:k+1,v0:pl.free.v};
  if(p)flashLabel('Trapped! Caught the '+['first','second','third','fourth'][k]+' wire',p);
  if(audio)sfx('Arresting wire',()=>{thud(0.9);noise(0.5,0.25,400,'lowpass');tone('sawtooth',240,60,0.7,0.06);});
}
// caught: stopped in a few lengths whatever the throttle's doing
function jetTrapTick(pl,dt){const F=pl.free;F.thr=0;F.v=Math.max(0,F.v-Math.max(26,F.v*2.6)*dt);
  if(F.v<=0.3){F.v=0;F.thr=0;pl.trap=null;pl.hook=false;jetHookPose(pl);}}
// ---- pilots. At general quarters a pilot runs to each parked jet; once he's in, it's towed on to a free catapult and
// launched, flies at whoever's nearest (cannon on a pass, missiles from further off, pulling up and away to come round
// again), and after a while (or with its missiles gone, or the ship stood down) comes back: out behind the stern, down
// the glide slope along the angled strip with its hook down, and on to the wires; then it's towed back to its spot and
// the pilot goes below. Its flying is steered directly (jetFly) rather than through the stick, so it holds a line well
// enough to land on a moving ship ----
const JET_AI={cruise:85,attack:72,approach:44,turn:0.85,sortie:75,rest:15,tow:5,gs:0.065,min:12};
// ---- AI aircraft seeing something in their way (a carrier's jets, a base's helicopters): a pilot looks ahead along
// where it's going and pulls up, banks away or (a helicopter) climbs over it. Not perfectly: each pilot has their own
// knack (k, 0.55 to 1: how far ahead they look and how quick they are), looks only every so often, can miss what's
// there, and takes a moment to react, so now and then one still flies into something. Cheap: a handful of block
// lookups a few times a second each, more only once something's seen ----
const AIR_AV={look:0.18,miss:0.3,react:[0.15,0.5],hold:1.1,jetT:[1.3,2.4]};
// solid there? Only what's already been built (a chunk not made yet counts as clear, so looking never makes the world),
// and a point out in the world near a ship is looked for in its pocket too, so a jet coming at a carrier sees its
// island before it's over the hull
function airSolid(x,y,z){
  if(y>=H)return false;const xi=Math.floor(x),zi=Math.floor(z),yi=Math.floor(y);
  if(chunks.has(ckey(Math.floor(xi/CS),Math.floor(zi/CS)))&&solidAt(xi,yi,zi))return true;
  if(x<SHIP_X0)for(const S of SHIPS){if(!S||Math.abs(x-S.x)>220||Math.abs(z-S.z)>220)continue;
    const o=worldToShip(S,x,z,_avP),ox=Math.floor(o.x),oz=Math.floor(o.z);
    if(chunks.has(ckey(Math.floor(ox/CS),Math.floor(oz/CS)))&&solidAt(ox,Math.floor(y+S.sk),oz))return true;}
  return false;}
const _avP={x:0,z:0};
// along a line from x,y,z (dx,dy,dz a unit direction), a point every st blocks out to distance d (close enough not to
// step over a tower): how far to the first solid one, or 0
function airRay(x,y,z,dx,dy,dz,d,st){for(let k=st;k<=d;k+=st)if(airSolid(x+dx*k,y+dy*k,z+dz*k))return k;return 0;}
// a pilot's look-ahead state (o.av), made the first time it's needed, with their own knack
function airAvOf(o){return o.av||(o.av={k:0.55+Math.random()*0.45,cd:Math.random()*AIR_AV.look,t:0,rt:-1,side:0,up:0,top:0});}
// (seen it: acts after a moment, unless it's already acting, when it just keeps at it)
function airAvSaw(A){if(A.t>0){A.t=AIR_AV.hold;return;}if(A.rt<0)A.rt=AIR_AV.react[0]+(AIR_AV.react[1]-AIR_AV.react[0])*Math.random()*(1.45-A.k);}
// a jet's look ahead, from jetSteer: where it'll be in the next second or two along its heading h and climb. Seen
// something, it picks whichever of climbing or a hard bank either way looks clearest (climbing if it's a tie) and
// returns {hw,gw} to fly instead for a moment; null when there's nothing to do
function jetAvoid(pl,h,dt){
  const F=pl.free,P=pl.g.position,A=airAvOf(pl);A.t-=dt;
  if(A.rt>=0){A.rt-=dt;if(A.rt<0)A.t=AIR_AV.hold;}
  if((A.cd-=dt)<=0){A.cd=AIR_AV.look;
    const d=Math.max(30,F.v*(AIR_AV.jetT[0]+(AIR_AV.jetT[1]-AIR_AV.jetT[0])*A.k)),c=Math.cos(F.gm);
    if(airRay(P.x,P.y,P.z,Math.sin(h)*c,Math.sin(F.gm),Math.cos(h)*c,d,3)&&(A.t>0||Math.random()>AIR_AV.miss*(1.3-A.k))){
      if(A.t<=0&&A.rt<0){   // (which way out: up, or a turn either way; the further each looks clear, the better)
        const ray=(hh,g)=>airRay(P.x,P.y,P.z,Math.sin(hh)*Math.cos(g),Math.sin(g),Math.cos(hh)*Math.cos(g),d,4)||d*1.5,
          u=ray(h,0.5)*1.1,l=ray(h-0.8,0),r=ray(h+0.8,0);
        A.up=u>=Math.max(l,r)?1:0.3;A.side=l>r?-1:r>l?1:(Math.random()<0.5?-1:1);if(A.up===1&&u>=d*1.5)A.side*=0.3;}
      airAvSaw(A);}}
  if(A.t<=0)return null;
  return{hw:h+A.side*2,gw:A.up===1?0.5:Math.max(0.12,F.gm)};}
// which way to pull away after a pass: straight on if that looks clear, else the nearest turn either way that does (a
// pilot who doesn't think to look, now and then, just goes straight on)
function jetBreakHdg(pl,h){const P=pl.g.position,A=airAvOf(pl);if(Math.random()<AIR_AV.miss*(1.3-A.k))return h;
  for(const o of [0,0.6,-0.6,1.2,-1.2,1.9,-1.9])if(!airRay(P.x,P.y,P.z,Math.sin(h+o)*0.96,0.28,Math.cos(h+o)*0.96,140,4))return h+o;
  return h;}
// (a carrier jet's own place: where it's parked, and is it there?)
function jetHomeAt(pl){const [s,w,h]=CV_JETS[pl.home],S=pl.S;return{x:S.ox-s+0.5,z:S.oz+w+0.5,h};}
function jetAtHome(pl){if(pl.free&&(pl.free.air||pl.free.v>0.3))return false;const H=jetHomeAt(pl),P=pl.g.position;return Math.hypot(P.x-H.x,P.z-H.z)<1.5&&Math.abs(P.y-(G+17))<0.3;}
// a point of the ship (s, y above the sea, w) in the frame the jet is in now
function jetPt(pl,s,y,w){const S=pl.S,x=S.ox-s+0.5,z=S.oz+w+0.5,P=pl.g.position;
  if(P.x>=SHIP_X0)return{x,y:G+y,z};const t=shipToWorld(S,x,z,{x:0,z:0});return{x:t.x,y:G+y-S.sk,z:t.z};}
// each step, from updateShips: pilots sent at general quarters, and the jets they've climbed into started up
function shipJetsTick(S,dt){
  const V=S.jetV,C=S.crewV;if(!V)return;
  for(const pl of V.pl){
    if(pl.call&&(pl.call.state!=='chase'||!pl.call.mount))pl.call=null;
    if(pl.dead||pl.drv){pl.ai=null;pl.crew=null;continue;}
    pl.rest=Math.max(0,(pl.rest||0)-dt);
    if(pl.ai)continue;   // (flown: drvPlane hands it to jetAI)
    if(pl.crew){if(C&&C.roused&&!C.off&&!calmNow())jetAIStart(pl);else pl.crew=null;continue;}
    if(C&&!C.off&&C.roused&&!pl.call&&!pl.rest&&playing&&!calmNow()&&jetAtHome(pl)){
      const P=pl.g.position,ix=P.x+(S.ox-P.x)*0.5,g=crewSend('sailor',ix,P.z,pl,'drv');
      if(g){g.pos.y=G+17;g.root.position.copy(g.pos);g.id.occ='Fighter pilot';pl.call=g;}}}
}
// in: towed to the first free catapult (one no other jet is using), or left to wait for one
function jetAIStart(pl){
  const V=pl.S.jetV,busy=new Set(V.pl.filter(q=>q!==pl&&q.ai&&q.ai.cat>=0&&(q.ai.ph==='tow'||q.ai.ph==='cat')).map(q=>q.ai.cat));
  const P=pl.g.position;let k=-1,bd=1e9;CV_CATS.forEach((c,i)=>{if(busy.has(i))return;const x=pl.S.ox-c[0]+0.5,z=pl.S.oz+c[1]+0.5,d=Math.hypot(x-P.x,z-P.z);if(d<bd){bd=d;k=i;}});
  if(k<0)return;const c=CV_CATS[k];
  pl.free=pl.free||{v:0,vy:0};Object.assign(pl.free,{v:0,vy:0,thr:0,gm:0,pt:0,rl:0,air:false});wpnInit(pl,'jet');pl.hook=false;if(pl.hookM)jetHookPose(pl);
  pl.ai={ph:'tow',cat:k,t:0,T:Math.max(3,bd/JET_AI.tow),from:{x:P.x,z:P.z,h:pl.g.rotation.y},to:{x:pl.S.ox-c[0]+0.5,z:pl.S.oz+c[1]+0.5,h:c[2]},sortie:0,mcd:3,gcd:0,ext:0};
}
// towed along the deck (to a catapult, or home): slid there and turned, at a walk
function jetTow(pl,A,dt){A.t+=dt;const k=Math.min(1,A.t/A.T),e=k*k*(3-2*k),g=pl.g;
  g.position.set(A.from.x+(A.to.x-A.from.x)*e,G+17,A.from.z+(A.to.z-A.from.z)*e);g.rotation.set(0,A.from.h+angDiff(A.from.h,A.to.h)*e,0);pl.free.v=0;pl.v=0;return k>=1;}
// flown straight at a point (in its own frame) at speed sp: turning, banking and climbing as fast as a jet may
function jetFly(pl,tx,ty,tz,sp,dt){const P=pl.g.position,dx=tx-P.x,dz=tz-P.z;
  return jetSteer(pl,Math.atan2(dx,dz),Math.max(-0.45,Math.min(0.4,Math.atan2(ty-P.y,Math.max(25,Math.hypot(dx,dz))))),sp,dt);}
// flown on a heading, climbing (or diving) at gm, at speed sp; never let down into the sea or the ground, except on
// to a deck at the end of a landing (final: its own rule)
function jetSteer(pl,hw,gw,sp,dt,final){
  const F=pl.free,g=pl.g,P=g.position;let h=g.rotation.y;
  const av=final?null:jetAvoid(pl,h,dt);if(av){hw=av.hw;gw=Math.max(gw,av.gw);}   // (something in the way: out of it)
  const tm=av?JET_AI.turn*1.3:JET_AI.turn,tr=Math.max(-tm,Math.min(tm,angDiff(h,hw)*1.6));h+=tr*dt;
  F.rl+=(Math.max(-1.1,Math.min(1.1,tr*1.2))-F.rl)*Math.min(1,dt*3);
  if(!final&&P.y+Math.min(0,F.vy)*2<G+JET_AI.min-2)gw=Math.max(gw,0.3);   // (too low and sinking: pull up)
  F.gm+=(gw-F.gm)*Math.min(1,dt*2.5);
  F.v+=(sp-F.v)*Math.min(1,dt*0.7);F.pt=F.gm+0.05;F.thr=Math.min(1,0.4+sp/120);F.air=true;
  const vh=F.v*Math.cos(F.gm),nx=P.x+Math.sin(h)*vh*dt,nz=P.z+Math.cos(h)*vh*dt,ny=P.y+F.v*Math.sin(F.gm)*dt;F.vy=F.v*Math.sin(F.gm);
  if(ny<G+1||solidAt(nx,Math.floor(ny+0.5),nz)){planeCrash(pl,nx,ny+1,nz,ny<G+2);return false;}   // (flown into something, or the sea)
  P.set(nx,Math.min(ny,H+80),nz);g.rotation.set(-F.pt,((h%6.2832)+6.2832)%6.2832,-F.rl,'YXZ');pl.v=F.v;g.visible=true;return true;
}
// who it's after: the nearest player up and about, where they are in its frame
function jetQuarry(pl){const Sj=pl.g.position.x>=SHIP_X0?pl.S:null,P=pl.g.position;let best=null,bd=1e9;
  for(const q of players){if(!q.active||q.state==='dead')continue;const o=shipPosIn(q.pos,Sj),d=Math.hypot(o.x-P.x,o.z-P.z);if(d<bd){bd=d;best={q,x:o.x,y:o.y,z:o.z,d};}}
  return best;}
// one step of a pilot's jet (from drvPlane, before its own flying): false hands the step back to drvPlane (on the
// catapult, and rolling out on the deck after landing)
function jetAI(pl,dt){
  const A=pl.ai,F=pl.free,g=pl.g,P=g.position,S=pl.S,C=S.crewV;wpnTick(pl,dt);A.t+=dt;
  if(S.dead){pl.ai=null;return false;}
  const done=()=>!C.roused||calmNow()||A.sortie>JET_AI.sortie||pl.wpn&&pl.wpn.rkt&&pl.wpn.rkt.n<=0&&pl.wpn.gun.n<20;
  if(A.ph==='tow'){if(jetTow(pl,A,dt)){A.ph='cat';const c=CV_CATS[A.cat];pl.cat={S,c,ph:'wait',t:0,d:0};}return true;}
  if(A.ph==='cat'){F.thr=1;if(!pl.cat){A.ph='fight';A.sortie=0;}return false;}
  if(A.ph==='park'){if(jetTow(pl,A,dt)){pl.ai=null;pl.crew=null;pl.rest=JET_AI.rest;Object.assign(F,{v:0,vy:0,thr:0,gm:0,pt:0,rl:0,air:false});pl.v=0;pl.wpn=null;g.rotation.set(0,A.to.h,0);}return true;}
  if(A.ph==='roll'){
    // (down on the deck: caught by a wire, rolled to a stop and towed home; past the wires still going, a bolter: round again)
    if(pl.trap)return false;
    if(F.v<0.5&&!F.air){const H=jetHomeAt(pl);A.ph='park';A.t=0;A.T=Math.max(3,Math.hypot(H.x-P.x,H.z-P.z)/JET_AI.tow);A.from={x:P.x,z:P.z,h:g.rotation.y};A.to=H;return true;}
    const J=jetOnShip(pl);if(J&&J.w-5>CV_WIRES[CV_WIRES.length-1]+3&&F.v>15){A.ph='back';A.sortie=JET_AI.sortie;P.y+=0.3;F.gm=0.12;F.v=Math.max(F.v,50);return true;}
    return false;}
  A.sortie+=dt;A.mcd-=dt;A.gcd-=dt;
  if(A.ph==='fight'&&done()){A.ph='back';}
  if(A.ph==='fight'){
    const Q=jetQuarry(pl);if(!Q){A.ph='back';return true;}
    const floor=Math.max(G+JET_AI.min,(shipOfPos(Q.x,Q.z)||Q.x>=SHIP_X0?G+30:G+JET_AI.min));
    if(A.ext>0){A.ext-=dt;const h=A.exh!==undefined?A.exh:g.rotation.y;return jetFly(pl,P.x+Math.sin(h)*200,G+55,P.z+Math.cos(h)*200,JET_AI.cruise,dt);}
    const ok=jetFly(pl,Q.x,Math.max(floor,Q.y+4),Q.z,Q.d<300?JET_AI.attack:JET_AI.cruise,dt);if(!ok)return true;
    // (lined up on them: the cannon close in, a missile from further off; too close, pull up and away and come round)
    const h=g.rotation.y,dx=Q.x-P.x,dy=Q.y+1-P.y,dz=Q.z-P.z,L=Math.hypot(dx,dy,dz)||1,cosA=(dx*Math.sin(h)*Math.cos(F.gm)+dy*Math.sin(F.gm)+dz*Math.cos(h)*Math.cos(F.gm))/L;
    if(Q.d<55){A.ext=3.5;A.exh=jetBreakHdg(pl,h);return true;}
    if(cosA>0.985&&L<170&&pl.wpn.gun.n>0)jetAIGun(pl,Q,dt);
    if(cosA>0.9&&L>70&&L<280&&A.mcd<=0&&P.x<SHIP_X0&&wpnFire(pl,'rkt')){A.mcd=6;jetAIMissile(pl,Q.q);}
    return true;}
  // (coming back: out to a point well behind the stern on the angled strip's line, then down the glide slope to the wires)
  const dS=17,TD=jetPt(pl,cvAng(-72),dS,-72),FA=jetPt(pl,cvAng(-72)-Math.sin(CV_ANGH)*260,dS,-72-Math.cos(CV_ANGH)*260),
    ax=TD.x-FA.x,az=TD.z-FA.z,aL=Math.hypot(ax,az)||1,ux=ax/aL,uz=az/aL;
  const al=(P.x-TD.x)*ux+(P.z-TD.z)*uz,cr=(P.x-TD.x)*-uz+(P.z-TD.z)*ux;
  if(A.ph==='back'){
    // (round the pattern: out past the stern well off to one side, then turned in on to the line from far behind, and
    // only on to final once lined up on it; not lined up by the time it's close, round again)
    if(!C.roused&&A.sortie<JET_AI.sortie)A.sortie=JET_AI.sortie;
    const hd=angDiff(g.rotation.y,Math.atan2(ux,uz));
    if(A.leg!=='in'){
      const sd=cr<0?-1:1,fx=TD.x-ux*600-uz*sd*130,fz=TD.z-uz*600+ux*sd*130;
      if(al<-520)A.leg='in';
      return jetFly(pl,fx,TD.y+30,fz,JET_AI.cruise,dt);}
    if(al>-420&&Math.abs(cr)<15&&Math.abs(hd)<0.25){A.ph='final';A.leg=null;pl.hook=true;jetHookPose(pl);}
    else if(al>-280||Math.abs(cr)>400)A.leg=null;
    const hw=Math.atan2(ux,uz)+Math.max(-1,Math.min(1,cr*0.012));
    return jetSteer(pl,hw,Math.max(-0.3,Math.min(0.3,(TD.y+30-P.y)*0.03)),JET_AI.cruise*0.8,dt);}
  // 'final': on to the strip's line and down the glide slope, slowing to approach speed; too far off it, too high or
  // overshot, waved off and round again
  const yW=TD.y+Math.max(0,-al)*JET_AI.gs+0.4;
  if(Math.abs(cr)>14&&al>-110||al>30||al>-60&&P.y-yW>7){A.ph='back';pl.hook=false;jetHookPose(pl);return true;}
  const hw=Math.atan2(ux,uz)+Math.max(-0.7,Math.min(0.7,cr*0.025)),gw=-Math.atan(JET_AI.gs)+Math.max(-0.25,Math.min(0.2,(yW-P.y)*0.05));
  const ok=jetSteer(pl,hw,gw,al>-220?JET_AI.approach:JET_AI.cruise*0.8,dt,true);
  if(!ok)return true;
  if(P.x>=SHIP_X0&&al>-14&&P.y-TD.y<0.9){P.y=TD.y;F.air=false;F.gm=0;F.vy=-1;F.pt=0.04;F.rl=0;F.thr=0;A.ph='roll';return false;}   // (wheels on the deck: drvPlane's rollout and the wires)
  return true;
}
// the cannon at them: a short burst as it lines up, each round with a chance of finding someone on foot (a vehicle
// takes them as rounds through gunRound)
function jetAIGun(pl,Q,dt){const A=pl.ai;if(A.gcd>0)return;const P=pl.g.position,h=pl.g.rotation.y,mx=P.x+Math.sin(h)*6.8,my=P.y+1.2,mz=P.z+Math.cos(h)*6.8,q=Q.q;
  for(let n=0;n<3;n++){if(!wpnFire(pl,'gun'))break;pl.wpn.gun.cd=0;
    if(q.drv){gunRound(pl,null,mx,my,mz,3,0.01,'Gunned down by a fighter jet','Jet cannon',{x:Q.x,y:Q.y+0.8,z:Q.z});continue;}
    fireRound({x:mx,y:my,z:mz,at:{x:Q.x,y:Q.y+0.6,z:Q.z},tgt:q,hit:0.1,miss:[1,4,0,0],step:0.4,pdmg:1,cause:'Gunned down by a fighter jet',id:pl.crew,   // (a wall in the way takes it)
      snd:()=>{if(audio)sfx('Jet cannon',()=>noise(0.05,0.1,2400,'highpass'));}});}
  A.gcd=0.1;}
// a missile at them, homing on where they really are (it's fired out in the world)
function jetAIMissile(pl,q){const P=pl.g.position,h=pl.g.rotation.y,F=pl.free,sd=(pl.rkN=(pl.rkN||0)+1)%2?1:-1,tx=Math.sin(h),tz=Math.cos(h),sp=F.v+60;
  shot({kind:'missile',x:P.x+tx*0.6-tz*sd*1.8,y:P.y+0.9,z:P.z+tz*0.6+tx*sd*1.8,vx:tx*sp,vy:Math.sin(F.gm)*sp,vz:tz*sp,grav:0,fuse:6,R:3.2,dmg:3,crush:1.8,vd:60,own:pl,
    cause:"Blown up by a fighter jet's missile",sp:F.v+80,turn:3,chase:()=>{if(!q.active||q.state==='dead')return null;const Sq=shipOf(q);return{x:pwx(q),y:q.pos.y+1-(Sq?Sq.sk:0),z:pwz(q)};}});
  if(audio)sfx('Jet missile',()=>noise(0.4,0.2,1100,'bandpass'));}
