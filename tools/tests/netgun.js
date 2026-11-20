// Online co-op, a guest's goblin in a fight and at the wheel: a host and a guest, each a whole game in its own sandbox,
// joined by an in-memory transport (the setup is net.js's). A guest's own rifle shot shows its tracer at once, once, and
// the streak goes; its nuke launcher's warhead flies on the host and is drawn flying on the guest; stealing a car and a
// motorcycle, the guest sees its own goblin do it where the host has it; drivers are dressed their own way, the same on
// the guest, and whoever's hauled out is dressed as they were at the wheel.
// (The stubs are the standard header's, taken from dead6.js, so this keeps up with it.)
const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('g.js','utf8');
const d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={cultSees,tenvPlace,tenvSpawnOne,tenvClear,MG,get TENV(){return TENV},netSendSnap,netRewind,netUnwind,NETP,makeTopple,topples,NETF,V3,BRICK,NET_VN,venues,TRAINS,netVenueModels,frame,players,P1,P2,NET,NETM,netHostWith,netJoinWith,netClose,netEnd,crush,get,goblins,cars,keys,ABIL,fires,setGobP,'+
  'collapseBuilding,bldgAt,plotInfo,CELL,FH,knockFix,activeFix,activeProps,falling,downFix,NET_BG,netBgTick,netBgClock,get collapses(){return collapses},'+
  'mineLay,MINES,MINEV,minesClear,foeArm,GOB_FOES,TRACERS,award,POPS,DT,setCombo,setPvp,pvpOn,doBite,obitList,get seed(){return seed},get edits(){return edits},get menuOpen(){return menuOpen},get saveBlocked(){return saveBlocked},chunks,ckey,CS,G,SHOTS,WEAPONS,BB,get craters(){return craters},gobAmmo,NETSO,setVeh};})();');
if(src===src0)throw new Error('closing line not found');
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
// one game: seed for its Math.random, its localStorage and sessionStorage contents
function game(name,rseed,ls,ss){
  const timers=[];let clock=1000;
  const ctx={console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,
    performance:{now:()=>clock},setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},
    __LS:store(ls),__SS:store(ss)};
  vm.createContext(ctx);
  const head='var global=globalThis;let __s='+rseed+';Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};\n'+stubs+
    '\nO3.prototype.isObject3D=true;global.localStorage=__LS;global.sessionStorage=__SS;global.location={reload(){}};\n';
  vm.runInContext(head+src,ctx,{filename:name+'.js'});
  const T=ctx.__t,g={name,T,ctx,LS:ctx.__LS,SS:ctx.__SS,reloads:0};
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;g.now=clock;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}if(g.bg)T.netBgTick();else T.frame(clock);hub.pump();}};   // (g.bg: a tab in the background, run by the worker's timer rather than animation frames)
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  T.NET.onReload=()=>{g.reloads++;};
  T.NET.makeTr=(kind,code)=>{if(String(code).startsWith('gsg-lobby'))throw new Error('no lobby in this suite (see lobby.js)');return hub.make();};
  return g;
}
// the network: messages wait in a queue until pumped, and go through JSON on the way
const hub={ts:[],q:[],sent:0,bytes:0,n:0,lat:0,jit:0,rnd:Math.random,   // (lat: frames each message takes to arrive, one way; jit: up to that many more, at random, and whatever's behind a late one waits for it)
  make(){const T={kind:'mem',self:'m'+this.ts.length,on:{},open:true,
      send:(d,to)=>{if(!T.open)return;const s=JSON.stringify(d);hub.sent++;hub.bytes+=s.length;hub.q.push({from:T.self,to:to||null,s,due:hub.n+2*hub.lat+(hub.jit?Math.floor(hub.rnd()*hub.jit):0)});},
      close:()=>{if(!T.open)return;T.open=false;for(const o of hub.ts)if(o!==T&&o.open)hub.q.push({leave:T.self,to:o.self});}};
    for(const o of this.ts)if(o.open){this.q.push({join:T.self,to:o.self});this.q.push({join:o.self,to:T.self});}
    this.ts.push(T);return T;},
  pump(){this.n++;let n=0;while(this.q.length&&n++<10000&&!(this.q[0].due>this.n)){const m=this.q.shift();
    for(const T of this.ts){if(!T.open||T.self===m.from)continue;if(m.to&&m.to!==T.self)continue;
      if(m.join){if(T.on.join)T.on.join(m.join);}else if(m.leave){if(T.on.leave)T.on.leave(m.leave);}else if(T.on.msg)T.on.msg(m.from,JSON.parse(m.s));}}}};
const f2=v=>(+v).toFixed(2),ok=b=>b?'ok':'BAD';
const SEED=+(process.env.SEED||1);

const yieldNow=()=>new Promise(r=>setImmediate(r));   // (lets an awaited connection finish, as a browser would between frames)
(async()=>{
// ---- the host: its own city, playing ----
const H=game('host',SEED,{});H.play();H.step(120);
const HT=H.T;console.log('host seed',HT.seed,'P1 at',f2(HT.P1.pos.x),f2(HT.P1.pos.y),f2(HT.P1.pos.z));
// smash something before anyone joins, so the save has edits in it
{const p=HT.P1.pos,x=Math.floor(p.x)+6,z=Math.floor(p.z);HT.crush(x,HT.G+1,z,2,-1,3);}
H.step(10);
console.log('host edits before join',Object.keys(HT.edits).length);
HT.netHostWith(hub.make(),'TESTA','mem');
console.log('hosting',HT.NET.mode===1?'yes':'no','status:',HT.NET.status);

// ---- a guest with a different city: joins, gets the host's world, reloads into it ----
const G1=game('guest1',SEED+977,{});G1.step(30);
console.log('guest city seed before joining',G1.T.seed,'(different from the host:',ok(G1.T.seed!==HT.seed)+')');
G1.T.netJoinWith(hub.make(),'TESTA','mem');
for(let i=0;i<20&&!G1.reloads;i++){G1.step(1);H.step(1);}
console.log('guest asked to reload into the host world',ok(G1.reloads===1),'kept in session storage',ok(!!G1.SS.getItem('gsg-net-world')),'local save untouched',ok(!G1.LS.getItem('goblin-city-v95')||JSON.parse(G1.LS.getItem('goblin-city-v95')).seed!==HT.seed));
H.step(5);console.log('host keeps the seat for the guest while it reloads',ok(HT.P2.active&&HT.P2.net&&HT.P2.net.gone>0));

// ---- the same tab after its reload: session storage carried over, the rest as it was ----
// (score numbers start off now: switched on for this guest, so its pop-ups can be checked)
const G=game('guest',SEED+977,Object.assign(Object.fromEntries(G1.LS._m),{'goblin-stompin-gus-pop-score':'1'}),Object.fromEntries(G1.SS._m));
const GT=G.T;
console.log('reloaded guest builds the host world: seed',GT.seed,ok(GT.seed===HT.seed),'edits',Object.keys(GT.edits).length,ok(Object.keys(GT.edits).length===Object.keys(HT.edits).length),'saving blocked',ok(GT.saveBlocked));
for(let i=0;i<60&&!GT.NET.joined;i++){G.step(1);H.step(1);await yieldNow();}
if(process.env.DBG)console.log('dbg',GT.NET.mode,GT.NET.status,HT.NET.status);
console.log('guest joined',ok(GT.NET.joined),'seat',GT.NET.seat,'playing',ok(!GT.menuOpen),'host has player two',ok(HT.P2.active&&!!HT.P2.net));
for(let i=0;i<60;i++){H.step(1);G.step(1);}
console.log('messages so far',hub.sent,'bytes',hub.bytes,'(about',Math.round(hub.bytes/((hub.sent||1))),'a message)');
// the guest's view: its own hippo where the host has player two, the host's hippo as its P2
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
console.log('guest P1 vs host P2',f2(d(GT.P1.pos,HT.P2.pos)),'guest P2 vs host P1',f2(d(GT.P2.pos,HT.P1.pos)),ok(d(GT.P1.pos,HT.P2.pos)<1.5&&d(GT.P2.pos,HT.P1.pos)<1.5));
{const cd=q=>f2(Math.hypot(q.camera.position.x-q.pos.x,q.camera.position.y-q.pos.y,q.camera.position.z-q.pos.z));console.log('camera from its hippo: guest',cd(GT.P1),'host',cd(HT.P1),'(guest P2 on the host',cd(HT.P2)+')');}
console.log('hp shown',GT.P1.hp,'state',GT.P1.state,'host P2',HT.P2.hp,HT.P2.state);
// goblins and cars mirrored
{const hg=HT.goblins.filter(g=>g.root.visible&&Math.hypot(g.root.position.x-HT.P2.pos.x,g.root.position.z-HT.P2.pos.z)<170).length,gg=[...GT.NETM.g.values()].filter(g=>g.root.visible).length;
 const hc=HT.cars.filter(c=>c.g.visible&&Math.hypot(c.g.position.x-HT.P2.pos.x,c.g.position.z-HT.P2.pos.z)<220).length,gc=[...GT.NETM.c.values()].filter(c=>c.g.visible).length;
 const own=GT.goblins.filter(g=>!g.net&&g.root.visible).length;
 console.log('venues near: host',HT.venues.size,'trains',HT.TRAINS.size,'| guest',GT.venues.size,'trains',GT.TRAINS.size,'| venue joints placed by the host',GT.NET_VN.size);
 {const hm=new Map(),gm=new Map();HT.netVenueModels((k,o)=>hm.set(k,o.position));GT.netVenueModels((k,o)=>gm.set(k,o.position));let n=0,far=0;
  for(const [k,P] of hm){const Q=gm.get(k);if(!Q||Math.hypot(P.x-HT.P2.pos.x,P.z-HT.P2.pos.z)>300)continue;n++;far=Math.max(far,Math.hypot(P.x-Q.x,P.y-Q.y,P.z-Q.z));}
  console.log('venue models within reach',n,'furthest a guest one is from the host one',f2(far),'(a train moves about 2 in the 0.1 s a guest is behind)');}
 if(process.env.DBG){HT.netVenueModels((k,o)=>console.log(' model',k,f2(o.position.x),f2(o.position.z),'dist',f2(Math.hypot(o.position.x-HT.P2.pos.x,o.position.z-HT.P2.pos.z))));for(const [k,V] of HT.venues)console.log(' venue',k,V.kind,Object.keys(V).join(','));}
 console.log('goblins shown host',hg,'guest',gg,'| vehicles host',hc,'guest',gc,'| guest\'s own goblins out',own,ok(own===0));}

// ---- the guest's goblin fires a rifle: its tracer and crack at once on the guest, and the streak gone again ----
const pads=G.ctx.navigator.getGamepads(),press=(b,n)=>{pads[0].buttons[b].pressed=true;pads[0].buttons[b].value=1;for(let i=0;i<n;i++){G.step(1);H.step(1);}pads[0].buttons[b].pressed=false;pads[0].buttons[b].value=0;};
{HT.setGobP(HT.P2,true);for(let i=0;i<20;i++){H.step(1);G.step(1);}
 const arm=q=>{q.wpns=['rifle'];q.wpn='rifle';q.ammo={};q.relT=0;};arm(HT.P2);arm(GT.P1);for(let i=0;i<10;i++){H.step(1);G.step(1);}
 const vis=()=>GT.TRACERS.filter(T=>T.m.visible).length;for(let i=0;i<30&&vis();i++){H.step(1);G.step(1);}
 const v0=vis();pads[0].buttons[2].pressed=true;pads[0].buttons[2].value=1;let first=-1,hostAt=-1;
 let rise=0,was=0;for(let i=0;i<12;i++){G.step(1);if(first<0&&vis()>v0)first=i;const n=vis();if(n>was)rise++;was=n;H.step(1);if(hostAt<0&&HT.P2.shotN)hostAt=i;}
 pads[0].buttons[2].pressed=false;pads[0].buttons[2].value=0;
 let left=0;for(let i=0;i<60;i++){H.step(1);G.step(1);const n=vis();if(n>was)rise++;was=n;}left=vis();
 console.log('guest rifle shot: tracer on the guest after',first,'frames',ok(first===0),'(fired on the host after',hostAt+')','| streaks still showing a second later',left,ok(left===0),'| streaks shown',rise,ok(rise===1));
 HT.setGobP(HT.P2,false);for(let i=0;i<20;i++){H.step(1);G.step(1);}}

// ---- the guest's goblin fires the nuke launcher: the warhead flies off on the host before it goes off, and the guest sees it fly ----
{HT.setGobP(HT.P2,true);for(let i=0;i<20;i++){H.step(1);G.step(1);}
 const arm=q=>{q.wpns=['nuke'];q.wpn='nuke';q.ammo={};q.relT=0;};arm(HT.P2);arm(GT.P1);for(let i=0;i<10;i++){H.step(1);G.step(1);}
 GT.P1.cam.pitch=0.25;HT.P2.cam.pitch=0.25;for(let i=0;i<5;i++){H.step(1);G.step(1);}
 const c0=HT.craters.length;press(2,4);
 const S=HT.SHOTS.find(s=>s.live&&s.kind==='nuke');const gm=()=>[...GT.NETSO.values()].some(M=>M.k==='nuke'&&M.m.visible);const p0=S?{x:S.pos.x,y:S.pos.y,z:S.pos.z}:null;
 const dP=p0?Math.hypot(p0.x-HT.P2.pos.x,p0.z-HT.P2.pos.z):-1;let life=0,gSeen=0;
 for(let i=0;i<600&&S&&S.live;i++){H.step(1);G.step(1);life++;if(gm())gSeen++;}
 const end=S?{x:S.pos.x,y:S.pos.y,z:S.pos.z}:null;
 console.log('guest nuke: launched on the host',ok(!!S),'from',dP.toFixed(2),'blocks off the guest goblin','| flew',life,'frames',ok(life>20),'landed',end?Math.hypot(end.x-p0.x,end.z-p0.z).toFixed(1):'-','blocks away','| warhead seen flying on the guest',gSeen,'frames',ok(gSeen>life*0.6),'| a crater',ok(HT.craters.length>c0));
 for(let i=0;i<300;i++){H.step(1);G.step(1);}
 console.log('guest nuke shells left on the guest',GT.SHOTS.filter(s=>s.live).length,ok(GT.SHOTS.filter(s=>s.live).length===0));
 HT.setGobP(HT.P2,false);for(let i=0;i<20;i++){H.step(1);G.step(1);}}
// ---- the guest's goblin steals a car: its own goblin seen hauling the driver out (posed as the host has it), then out
// of sight in a closed car with its own head at the wheel; on a motorcycle sat astride it. The street's drivers are
// dressed their own way, the same on the guest, and whoever's hauled out is dressed as they were at the wheel ----
{HT.setGobP(HT.P2,true);for(let i=0;i<20;i++){H.step(1);G.step(1);}
 const drs=HT.cars.filter(c=>c.alive&&c.g.visible&&c.dh.visible&&c.driver&&c.driver.look&&!c.police&&!c.net);
 const dressed=drs.filter(c=>c.dhL===c.driver.look).length;
 let gsame=0,gn=0;for(const c of drs){const m=GT.NETM.c.get(HT.cars.indexOf(c));if(!m||!m.g.visible)continue;gn++;if(m.dhM&&m.dhL&&JSON.stringify(m.dhL)===JSON.stringify(c.driver.look))gsame++;}
 console.log('street drivers with a look of their own',drs.length,'dressed as it at the wheel',dressed,ok(drs.length>0&&dressed===drs.length),'| the same on the guest',gsame+'/'+gn,ok(gn>0&&gsame===gn));
 for(const kind of ['car','bike']){
  const c=HT.cars.find(c=>c.alive&&c.g.visible&&c.dh.visible&&c.driver&&!c.police&&c.veh==='car'&&!c.crew&&!c.svcPool);
  if(!c){console.log(kind+': no car about to steal');continue;}
  if(kind==='bike')HT.setVeh(c,'bike');
  const look=c.driver.look;c.speed=0;c.parked=true;HT.P2.pos.set(c.pos.x+Math.cos(c.heading)*(c.hx+0.6),c.pos.y,c.pos.z-Math.sin(c.heading)*(c.hx+0.6));
  for(let i=0;i<10;i++){H.step(1);G.step(1);}
  pads[0].buttons[3].pressed=true;G.step(1);H.step(1);pads[0].buttons[3].pressed=false;
  let seen=0,jackF=0,far=0,victim=null;
  for(let i=0;i<200;i++){H.step(1);G.step(1);const D=HT.P2.drv;if(D&&D.jack){jackF++;if(D.jack.v)victim=D.jack.v;const K=GT.P1.gb;
    if(K&&K.root.visible&&HT.P2.jackA){seen++;far=Math.max(far,Math.hypot(K.root.position.x-HT.P2.jackA.root.position.x,K.root.position.z-HT.P2.jackA.root.position.z));}}}
  const dressedOut=victim&&victim.id&&victim.id.look===look||victim&&victim.id&&JSON.stringify(victim.id.look)===JSON.stringify(look);
  const K=GT.P1.gb,m=GT.NETM.c.get(HT.cars.indexOf(c));
  const after=kind==='bike'?!!(K&&K.root.visible&&Math.hypot(K.root.position.x-c.g.position.x,K.root.position.z-c.g.position.z)<2):!!(K&&!K.root.visible&&m&&m.dh.visible&&m.dhL&&m.dhL.tunic===(HT.P2.who?0xa83232:0x3a5f8a));
  console.log(kind+': stolen',ok(!!HT.P2.drv&&!HT.P2.drv.jack),'| the guest saw its own goblin',seen,'of',jackF,'frames of it',ok(seen>jackF*0.6),'at most',far.toFixed(2),'off the host\'s',ok(far<1.5),
    '| the driver hauled out dressed as at the wheel',ok(!!dressedOut),kind==='bike'?'| its goblin astride it on the guest':'| hidden in it, its own head at the wheel on the guest',ok(after));
  pads[0].buttons[3].pressed=true;G.step(1);H.step(1);pads[0].buttons[3].pressed=false;for(let i=0;i<60;i++){H.step(1);G.step(1);}
  if(kind==='bike')HT.setVeh(c,'car');}
 HT.setGobP(HT.P2,false);for(let i=0;i<20;i++){H.step(1);G.step(1);}}

console.log('done');
})();
