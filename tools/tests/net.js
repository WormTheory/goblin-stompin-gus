// Online co-op: a host and a guest, each a whole game in its own sandbox (its own globals, storage and Math.random),
// joined by an in-memory transport that passes every message through JSON, as a network would. Checks the guest builds
// the host's world from its save, the guest's controls move its hippo on the host, snapshots arrive and are shown,
// smashing on the host smashes the same blocks on the guest, and both ends cope with the other going away.
// (The stubs are the standard header's, taken from dead6.js, so this keeps up with it.)
const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('g.js','utf8');
const d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={netRewind,netUnwind,NETP,makeTopple,topples,NETF,V3,BRICK,NET_VN,venues,TRAINS,netVenueModels,frame,players,P1,P2,NET,NETM,netHostWith,netJoinWith,netClose,netEnd,crush,get,goblins,cars,keys,ABIL,fires,setGobP,'+
  'get seed(){return seed},get edits(){return edits},get menuOpen(){return menuOpen},get saveBlocked(){return saveBlocked},chunks,ckey,CS,G};})();');
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
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;g.now=clock;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}T.frame(clock);hub.pump();}};
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  T.NET.onReload=()=>{g.reloads++;};
  T.NET.makeTr=()=>hub.make();
  return g;
}
// the network: messages wait in a queue until pumped, and go through JSON on the way
const hub={ts:[],q:[],sent:0,bytes:0,n:0,lat:0,   // (lat: frames each message takes to arrive, one way)
  make(){const T={kind:'mem',self:'m'+this.ts.length,on:{},open:true,
      send:(d,to)=>{if(!T.open)return;const s=JSON.stringify(d);hub.sent++;hub.bytes+=s.length;hub.q.push({from:T.self,to:to||null,s,due:hub.n+2*hub.lat});},
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
const G=game('guest',SEED+977,Object.fromEntries(G1.LS._m),Object.fromEntries(G1.SS._m));
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

// ---- the guest's controls: hold forward on its controller and turn the camera ----
{const pads=G.ctx.navigator.getGamepads();const before={x:HT.P2.pos.x,y:HT.P2.pos.y,z:HT.P2.pos.z},h1={x:HT.P1.pos.x,y:HT.P1.pos.y,z:HT.P1.pos.z};
 GT.P1.cam.yaw=HT.P2.cam.yaw+0.5;
const lag=[];
 pads[0].axes[1]=-1;let firstG=-1,firstH=-1;const g0={x:GT.P1.pos.x,y:GT.P1.pos.y,z:GT.P1.pos.z};
 for(let i=0;i<90;i++){G.step(1);H.step(1);if(firstG<0&&d(GT.P1.pos,g0)>0.3)firstG=i;if(firstH<0&&d(HT.P2.pos,before)>0.3)firstH=i;
   if(i%10===9)lag.push(d(GT.P1.pos,HT.P2.pos));}pads[0].axes[1]=0;
 console.log('frames before it moved: on the guest',firstG,'on the host',firstH,'| guest ahead of the host while running',lag.map(f2).join(' '));
 const moved=d(HT.P2.pos,before);
 console.log('guest held forward 1.5 s: host P2 moved',f2(moved),ok(moved>3),'camera yaw passed on',ok(Math.abs(HT.P2.cam.yaw-GT.P1.cam.yaw)<0.01),'host P1 stayed',f2(d(HT.P1.pos,h1)),ok(d(HT.P1.pos,h1)<0.5));
 for(let i=0;i<20;i++){G.step(1);H.step(1);}
 console.log('guest sees itself there',f2(d(GT.P1.pos,HT.P2.pos)),ok(d(GT.P1.pos,HT.P2.pos)<1.5),'(guessing its own moves:',GT.NETP.on?'yes':'no',')');
 // a press: jump
 const y0=HT.P2.pos.y;pads[0].buttons[0].pressed=true;G.step(1);pads[0].buttons[0].pressed=false;let top=y0;
 for(let i=0;i<30;i++){G.step(1);H.step(1);top=Math.max(top,HT.P2.pos.y);}
 console.log('guest tapped jump: host P2 rose',f2(top-y0),ok(top-y0>1));}

// ---- smashing on the host: the same blocks go on the guest ----
{const p=HT.P2.pos,x=Math.floor(p.x)+4,z=Math.floor(p.z)+4,y=HT.G+1;
 const before=Object.keys(HT.edits).length;HT.crush(x,y,z,3,-1,4);const changed=Object.keys(HT.edits).filter(k=>!(k in GT.edits));
 for(let i=0;i<30;i++){H.step(1);G.step(1);}
 let same=0,diff=0;for(const k of Object.keys(HT.edits)){const [a,b,c]=k.split(',').map(Number);if(HT.get(a,b,c)===GT.get(a,b,c))same++;else diff++;}
 console.log('crush on the host: new edits',Object.keys(HT.edits).length-before,'blocks the same on the guest',same,'different',diff,ok(diff===0&&Object.keys(HT.edits).length>before));}

// ---- a column of bricks toppling over beside the guest: its model on the guest follows the host's, then goes ----
{const p=HT.P2.pos,x=Math.floor(p.x)+6,z=Math.floor(p.z)-3,y0=Math.floor(p.y),L=[];for(let y=y0;y<y0+12;y++)L.push({x,y,z,b:HT.BRICK});
 HT.makeTopple(L,new HT.V3(x+0.5,y0,z+0.5),new HT.V3(1,0,0));let most=0,worst=0;
 for(let i=0;i<300&&(HT.topples.length||GT.NETF.size);i++){H.step(1);G.step(1);most=Math.max(most,GT.NETF.size);
   const T=HT.topples[0],F=[...GT.NETF.values()][0];if(T&&F)worst=Math.max(worst,Math.abs(T.grp.quaternion.w-F.o.quaternion.w));}
 for(let i=0;i<20;i++){H.step(1);G.step(1);}
 let diff=0;for(const k of Object.keys(HT.edits)){const [a,b2,c]=k.split(',').map(Number);if(HT.get(a,b2,c)!==GT.get(a,b2,c))diff++;}
 console.log('a topple on the host: guest showed',most,'falling piece',ok(most>=1),'most its turn lagged',f2(worst),'gone after',ok(GT.NETF.size===0),'blocks where it landed differ',diff,ok(diff===0));}

// ---- a guest goblin (Gnash) seat: switching kind on the host shows on the guest ----
{HT.setGobP(HT.P1,true);for(let i=0;i<20;i++){H.step(1);G.step(1);}console.log('host turned goblin: guest P2 is a goblin',ok(GT.P2.gob===true));HT.setGobP(HT.P1,false);for(let i=0;i<20;i++){H.step(1);G.step(1);}}

// ---- the guest as a goblin, driving: gets into a car beside it, drives off, the chase camera follows ----
{HT.setGobP(HT.P2,true);for(let i=0;i<20;i++){H.step(1);G.step(1);}
 const c=HT.cars.find(c=>c.alive&&c.g.visible&&!c.police&&c.veh==='car');
 if(!c)console.log('no car about to drive');else{
  c.speed=0;HT.P2.pos.set(c.pos.x+Math.cos(c.heading)*(c.hx+0.6),c.pos.y,c.pos.z-Math.sin(c.heading)*(c.hx+0.6));
  for(let i=0;i<10;i++){H.step(1);G.step(1);}
  const pads=G.ctx.navigator.getGamepads();pads[0].buttons[3].pressed=true;G.step(1);H.step(1);pads[0].buttons[3].pressed=false;
  for(let i=0;i<150;i++){H.step(1);G.step(1);}   // (pulling the driver out takes a moment)
  const inCar=!!HT.P2.drv;console.log('guest pressed use by a car: host has it driving',ok(inCar),'guest knows',ok(!!(GT.P1.drv&&GT.P1.drv.netS)),GT.P1.drv?GT.P1.drv.k:'');
  const c0={x:c.pos.x,y:c.pos.y,z:c.pos.z};pads[0].axes[1]=-1;for(let i=0;i<90;i++){G.step(1);H.step(1);}pads[0].axes[1]=0;
  const cam=GT.P1.camera.position,S=GT.P1.drv&&GT.P1.drv.netS;
  console.log('drove for 1.5 s: car moved',f2(d(c.pos,c0)),ok(d(c.pos,c0)>3),'guest camera from the car',S?f2(Math.hypot(cam.x-S.x,cam.z-S.z)):'-',ok(S&&Math.hypot(cam.x-S.x,cam.z-S.z)<16&&Math.hypot(cam.x-S.x,cam.z-S.z)>2),'guest car mirror apart',f2(d(GT.NETM.c.get(HT.cars.indexOf(c)).pos,c.pos)));
  pads[0].buttons[3].pressed=true;G.step(1);H.step(1);pads[0].buttons[3].pressed=false;for(let i=0;i<60;i++){H.step(1);G.step(1);}
  console.log('pressed use again: out',ok(!HT.P2.drv&&!GT.P1.drv));}
 HT.setGobP(HT.P2,false);for(let i=0;i<20;i++){H.step(1);G.step(1);}}

// ---- a slow network: a tenth of a second each way. The guest's own hippo still moves at once, and ends up where the host has it ----
{hub.lat=6;for(let i=0;i<30;i++){G.step(1);H.step(1);}
 if(process.env.DBG)console.log('dbg pred',GT.NETP.on,GT.NETP.snap,GT.P1.state,GT.P1.gob,HT.P2.state,!!HT.P2.drv,!!HT.P2.standCar,!!HT.P2.rideC);
 const pads=G.ctx.navigator.getGamepads(),g0={x:GT.P1.pos.x,y:GT.P1.pos.y,z:GT.P1.pos.z},h0={x:HT.P2.pos.x,y:HT.P2.pos.y,z:HT.P2.pos.z};let fg=-1,fh=-1,jump=0,prev=null;
 pads[0].axes[0]=1;for(let i=0;i<100;i++){G.step(1);H.step(1);if(fg<0&&d(GT.P1.pos,g0)>0.3)fg=i;if(fh<0&&d(HT.P2.pos,h0)>0.3)fh=i;
   if(prev)jump=Math.max(jump,d(GT.P1.pos,prev));prev={x:GT.P1.pos.x,y:GT.P1.pos.y,z:GT.P1.pos.z};}
 pads[0].axes[0]=0;for(let i=0;i<60;i++){G.step(1);H.step(1);}
 console.log('with 0.1 s each way: frames before moving, guest',fg,'host',fh,ok(fg>=0&&fg<fh),'| biggest step in one frame',f2(jump),ok(jump<0.6),'| apart once stopped',f2(d(GT.P1.pos,HT.P2.pos)),ok(d(GT.P1.pos,HT.P2.pos)<0.5));
 // a bite: on the host the goblins go back to where this guest is seeing them, for its step
 {pads[0].buttons[2].pressed=true;G.step(1);pads[0].buttons[2].pressed=false;for(let i=0;i<14;i++){G.step(1);H.step(1);}
  const moving=HT.goblins.map((g,i)=>[g,i]).filter(([g,i])=>g.root.visible&&GT.NETM.g.get(i)&&GT.NETM.g.get(i).root.visible);
  let now=0,back=0,n=0;const rw=HT.netRewind(HT.P2);
  for(const [g,i] of moving){const m=GT.NETM.g.get(i);back+=Math.hypot(g.pos.x-m.pos.x,g.pos.z-m.pos.z);n++;}
  HT.netUnwind();for(const [g,i] of moving){const m=GT.NETM.g.get(i);now+=Math.hypot(g.pos.x-m.pos.x,g.pos.z-m.pos.z);}
  console.log('lag compensation on a guest bite:',rw?'on':'off',ok(rw),'| goblins where the guest sees them: as they are now, off by',f2(now/(n||1)),'on average; put back, off by',f2(back/(n||1)),ok(back<=now+0.01));}
 hub.lat=0;for(let i=0;i<20;i++){G.step(1);H.step(1);}}

// ---- the guest's connection drops without a word: the host keeps its seat, the guest finds its way back ----
{const T=hub.ts.filter(t=>t.open).find(t=>t===GT.NET.tr);const at={x:HT.P2.pos.x,y:HT.P2.pos.y,z:HT.P2.pos.z};
 T.close();   // (as a network failing: the host hears it's gone; the guest hears nothing)
 for(let i=0;i<30;i++){H.step(1);G.step(1);}
 console.log('dropped: host keeps the seat',ok(HT.P2.active&&!!HT.P2.net&&HT.P2.net.gone>0),'status',HT.NET.status);
 let back=-1;for(let i=0;i<1200;i++){H.step(1);G.step(1);await yieldNow();if(HT.P2.net&&!HT.P2.net.gone&&GT.NET.tr&&GT.NET.host&&back<0)back=i;if(back>=0&&i>back+60)break;}
 console.log('guest came back after',(back/60).toFixed(1),'s',ok(back>0),'no reload',ok(G.reloads===0),'hippo where it was (give or take a shove)',f2(d(HT.P2.pos,at)),ok(d(HT.P2.pos,at)<3),'guest shows itself there',f2(d(GT.P1.pos,HT.P2.pos)),ok(d(GT.P1.pos,HT.P2.pos)<1));}

// ---- the guest leaves: the host plays on alone ----
GT.netEnd();for(let i=0;i<10;i++){H.step(1);G.step(1);}
console.log('guest left: host P2 gone',ok(!HT.P2.active&&!HT.P2.net),'host still hosting',ok(HT.NET.mode===1),'guest went home (reload)',ok(G.reloads===1&&!G.SS.getItem('gsg-net-join')));
// ---- another guest joins, then the host stops: the guest is told and goes home ----
const G3=game('guest3',SEED+977,Object.fromEntries(G1.LS._m),Object.fromEntries(G1.SS._m));
for(let i=0;i<60&&!G3.T.NET.joined;i++){G3.step(1);H.step(1);await yieldNow();}
console.log('a guest rejoins',ok(G3.T.NET.joined&&HT.P2.active));
HT.netEnd();for(let i=0;i<10;i++){H.step(1);G3.step(1);}
console.log('host stopped: guest left the game',ok(G3.T.NET.mode===0&&G3.reloads===1),'host solo',ok(!HT.P2.active&&HT.NET.mode===0));
console.log('done');
})();
