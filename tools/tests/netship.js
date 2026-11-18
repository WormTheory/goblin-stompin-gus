// Online co-op with the Testing Environment's ships: a host and a guest, each a whole game in its own sandbox (see
// net.js, whose harness this is), with a barge spawned on the host. The guest gets its own copy in the same place, both
// players stand on it and see each other there, the guest takes the helm and sails it, a goblin aboard and a hole in the
// deck show up on the guest, a player joining late gets the holed barge, and sinking and clearing it reach the guest.
const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('g.js','utf8');
const d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={mountWreck,shipKnock,shipBreak,tenvVeh,tenvFoe,tenvClear,get TENV(){return TENV},get TS(){return TS},set menuOpen(v){menuOpen=v},SHIPS,SHIP_X0,shipToWorld,shipOf,pwx,pwz,netFrameYaw,meshes,frame,players,P1,P2,NET,NETM,netHostWith,netJoinWith,netEnd,crush,get,goblins,setGobP,DT,venues,get seed(){return seed},get edits(){return edits},G};})();');
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

const d3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const yieldNow=()=>new Promise(r=>setImmediate(r));
(async()=>{
// ---- the host, in the Testing Environment, and a guest joining it (the guest's tab reloads into the host's world) ----
const key=(src0.match(/SAVE_KEY='([^']+)'/)||[])[1];
const H=game('host',SEED+3,{[key]:JSON.stringify({seed:4242,ed2:{},coll:{},down:[],dest:{},test:[],tenv:{boxes:[]}})});H.play();H.step(60);
const HT=H.T;HT.DT.invuln=true;
HT.netHostWith(hub.make(),'SHIPA','mem');
const J1=game('guestT1',SEED+11,{});J1.T.netJoinWith(hub.make(),'SHIPA','mem');for(let i=0;i<20&&!J1.reloads;i++){J1.step(1);H.step(1);}
const G=game('guest',SEED+11,{},Object.fromEntries(J1.SS._m)),GT=G.T;for(let i=0;i<80&&!GT.NET.joined;i++){G.step(1);H.step(1);await yieldNow();}
const both=n=>{for(let i=0;i<n;i++){H.step(1);G.step(1);}};
both(30);
console.log('guest joined the Testing Environment',ok(GT.NET.joined&&!!GT.TENV));
const W={x:0,z:0},Wg={x:0,z:0};
// (where a player really is, out in the world: on the host and on the guest)
const wpos=(T,p)=>({x:T.pwx(p),y:p.pos.y-(T.shipOf(p)?T.shipOf(p).sk:0),z:T.pwz(p)});
const dw=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

// ---- a barge spawned on the host: the guest gets the sea and its own copy, in the same slot, in the same place ----
HT.P1.cam.yaw=0.7;HT.menuOpen=true;HT.TS.n=1;HT.tenvVeh('barge');HT.menuOpen=false;both(80);
const S=HT.SHIPS.find(s=>s),Sg=S&&GT.SHIPS[S.slot];
if(!S){console.log('no ship spawned');process.exit(0);}
console.log('barge on the host: slot',S.slot,'| on the guest',ok(!!Sg&&Sg.n===S.n&&Sg.kind==='barge'),'| sea the same',ok(JSON.stringify(GT.TENV.sea)===JSON.stringify(HT.TENV.sea)),
  '| apart',Sg?f2(Math.hypot(Sg.x-S.x,Sg.z-S.z)):'-','heading off by',Sg?f2(Math.abs(Sg.yaw-S.yaw)):'-',ok(Sg&&Math.hypot(Sg.x-S.x,Sg.z-S.z)<0.1&&Math.abs(Sg.yaw-S.yaw)<0.01));
{let same=0,diff=0;for(let u=S.K.u0;u<=S.K.u1;u+=2)for(let w=S.K.w0;w<=S.K.w1;w+=3)for(let y=HT.G-2;y<HT.G+8;y++){const a=HT.get(S.ox+u,y,S.oz+w),b=GT.get(S.ox+u,y,S.oz+w);if(a===b)same++;else diff++;}
 const pm=[...GT.meshes.values()].filter(e=>e.cx>=GT.SHIP_X0/16).length;
 console.log('  its blocks: the same',same,'different',diff,ok(diff===0&&same>0),'| its chunks drawn on the guest',pm,ok(pm>0),'| water by it on the guest',ok(GT.get(S.x+0.5,HT.G-1,S.z+30.5)===9));}

// ---- both players aboard: the host's hippo dropped on the deck, the guest's too. Each is drawn on the other's screen
// hung off the ship, where they really are ----
const deck=(T,P,S,u,w)=>{T.shipToWorld(S,S.ox+u,S.oz+w,W);P.pos.set(W.x,T.G+3,W.z);P.vy=0;P.mvx=P.mvz=0;P.state='walk';};
deck(HT,HT.P1,S,0.5,4.5);deck(HT,HT.P2,S,-2.5,-1.5);both(90);
console.log('both aboard on the host:',ok(HT.shipOf(HT.P1)===S&&HT.shipOf(HT.P2)===S),'| on the guest: its own',ok(GT.shipOf(GT.P1)===Sg),'the host\'s',ok(GT.shipOf(GT.P2)===Sg),
  '| drawn off the ship: its own',ok(GT.P1.root.parent===Sg.pg),'the host\'s',ok(GT.P2.root.parent===Sg.pg),
  '| guest P1 vs host P2',f2(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))),'guest P2 vs host P1',f2(dw(wpos(GT,GT.P2),wpos(HT,HT.P1))),ok(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))<1&&dw(wpos(GT,GT.P2),wpos(HT,HT.P1))<1));
// (the guest's camera: turned into the ship's frame as the host turned it, so it looks the same way out in the world)
console.log('  guest camera yaw, out in the world: guest',f2(GT.P1.cam.yaw+GT.netFrameYaw(GT.P1)),'host',f2(HT.P2.cam.yaw+HT.netFrameYaw(HT.P2)),ok(Math.abs(GT.P1.cam.yaw+GT.netFrameYaw(GT.P1)-HT.P2.cam.yaw-HT.netFrameYaw(HT.P2))<0.02));
// (the guest walks along the deck)
{const pads=G.ctx.navigator.getGamepads(),h0=HT.P2.pos.clone();GT.P1.cam.yaw=Math.PI;both(5);pads[0].axes[1]=-1;both(60);pads[0].axes[1]=0;both(30);
 console.log('  guest walked on the deck: host has it',f2(d3(HT.P2.pos,h0)),'along',ok(d3(HT.P2.pos,h0)>2&&HT.shipOf(HT.P2)===S),'| apart on the two',f2(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))),ok(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))<1));}

// ---- the guest at the helm, as a goblin: the engine rung up, the barge sails; the guest's copy keeps up with it, and
// the guest rides along in it ----
HT.setGobP(HT.P2,true);both(20);
{const h=S.K.helm;HT.P2.pos.set(S.ox+h[0],h[1],S.oz+h[2]);HT.P2.vy=0;HT.P2.mvx=HT.P2.mvz=0;both(30);
 const pads=G.ctx.navigator.getGamepads(),btn=(b,on)=>{pads[0].buttons[b].pressed=on;pads[0].buttons[b].value=on?1:0;};
 btn(3,true);G.step(1);H.step(1);btn(3,false);both(30);
 console.log('guest pressed use at the helm: host has it at the helm',ok(HT.P2.drv&&HT.P2.drv.k==='ship'),'| guest\'s display shows its ship',ok(GT.P1.drv&&GT.P1.drv.o===Sg));
 const x0=S.x,z0=S.z;let most=0;pads[0].axes[1]=-1;for(let i=0;i<480;i++){G.step(1);H.step(1);if(i>60)most=Math.max(most,Math.hypot(Sg.x-S.x,Sg.z-S.z));}pads[0].axes[1]=0;
 pads[0].axes[0]=1;both(240);pads[0].axes[0]=0;both(60);
 console.log('  8 s ahead, then rudder over: sailed',f2(Math.hypot(S.x-x0,S.z-z0)),ok(Math.hypot(S.x-x0,S.z-z0)>5),'order',S.ord,'guest shows',Sg.ord,ok(Sg.ord===S.ord),
   '| guest copy behind the host by at most',f2(most),ok(most<Math.max(1.5,S.sp*0.3)),'heading off by',f2(Math.abs(Sg.yaw-S.yaw)),ok(Math.abs(Sg.yaw-S.yaw)<0.05));
 console.log('  guest still at the helm on its own screen',f2(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))),ok(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))<1.5),
   '| guest camera from the ship',f2(Math.hypot(GT.P1.camera.position.x-Sg.x,GT.P1.camera.position.z-Sg.z)),ok(Math.hypot(GT.P1.camera.position.x-Sg.x,GT.P1.camera.position.z-Sg.z)<60),
   '| the host still aboard on the guest',f2(dw(wpos(GT,GT.P2),wpos(HT,HT.P1))),ok(dw(wpos(GT,GT.P2),wpos(HT,HT.P1))<1.5));
 // (the weapon button: the bridge view on the guest's own screen, and back to the chase camera)
 btn(15,true);G.step(1);H.step(1);btn(15,false);both(20);const bc=GT.P1.camera.position.y;
 console.log('  guest pressed weapon: bridge view on the host',ok(!!HT.P2.shipBridge),'and on the guest',ok(!!GT.P1.shipBridge),'| guest camera looking ahead from the bridge',f2(GT.P1.cam.pitch),ok(Math.abs(GT.P1.cam.pitch+0.08)<0.05));
 btn(15,true);G.step(1);H.step(1);btn(15,false);both(20);
 console.log('  and again: the chase camera',ok(!HT.P2.shipBridge&&!GT.P1.shipBridge),'| camera height',f2(bc),'then',f2(GT.P1.camera.position.y),ok(Math.abs(GT.P1.camera.position.y-bc)>0.5));
 btn(3,true);G.step(1);H.step(1);btn(3,false);both(40);console.log('  pressed use again: away from the helm',ok(!HT.P2.drv&&!GT.P1.drv));}
HT.setGobP(HT.P2,false);both(20);

// ---- a goblin aboard: the guest sees it on the deck, where the host has it ----
{deck(HT,HT.P1,S,0.5,6.5);HT.P1.cam.yaw=Math.PI;both(30);HT.menuOpen=true;HT.TS.n=1;HT.tenvFoe('goblin');HT.menuOpen=false;both(30);
 const i=HT.goblins.findIndex(g=>g.state!=='wait'&&HT.shipOf(g)===S),g=HT.goblins[i],m=GT.NETM.g.get(i);
 if(!g)console.log('no goblin aboard');else console.log('a goblin aboard on the host: on the guest',ok(!!m&&m.root.visible),'| in its ship',ok(m&&GT.shipOf(m)===Sg),'| apart',m?f2(d3(m.pos,g.pos)):'-',ok(m&&d3(m.pos,g.pos)<1.5));
 for(const q of HT.goblins)if(q.state!=='wait'){q.state='wait';q.t=0;q.root.visible=false;}both(20);}

// ---- smashing the deck on the host: the same blocks go on the guest ----
{const x=Math.floor(S.ox)+2,z=Math.floor(S.oz)+9;HT.crush(x,HT.G,z,2,-1,3);both(30);
 let same=0,diff=0,gone=0;for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)for(let y=HT.G-3;y<HT.G+3;y++){const p=HT.get(x+a,y,z+b),q=GT.get(x+a,y,z+b);if(p===q)same++;else diff++;}
 for(const k in HT.edits){const [a]=k.split(',').map(Number);if(a>=HT.SHIP_X0)gone++;}
 console.log('a hole smashed in the deck: blocks changed aboard on the host',gone,ok(gone>0),'| the same on the guest',same,'different',diff,ok(diff===0),'| health host',f2(S.hp),'guest',f2(Sg.hp),ok(Math.abs(S.hp-Sg.hp)<0.5),'(it leaks, so a moment behind)');}

// ---- a guest joining late builds the same ship, holes and all ----
{const J2=game('late1',SEED+21,{});J2.T.netJoinWith(hub.make(),'SHIPA','mem');for(let i=0;i<20&&!J2.reloads;i++){J2.step(1);H.step(1);G.step(1);}
 const L=game('late',SEED+21,{},Object.fromEntries(J2.SS._m));for(let i=0;i<80&&!L.T.NET.joined;i++){L.step(1);H.step(1);G.step(1);await yieldNow();}
 for(let i=0;i<60;i++){H.step(1);G.step(1);L.step(1);}
 const Sl=L.T.SHIPS[S.slot];let same=0,diff=0;
 if(Sl)for(let u=S.K.u0;u<=S.K.u1;u++)for(let w=S.K.w0;w<=S.K.w1;w++)for(let y=HT.G-2;y<HT.G+3;y++){const a=HT.get(S.ox+u,y,S.oz+w),b=L.T.get(S.ox+u,y,S.oz+w);if(a===b)same++;else diff++;}
 console.log('a third player joins with the barge holed: has it',ok(!!Sl&&Sl.n===S.n),'| its blocks the same',same,'different',diff,ok(Sl&&diff===0));
 L.T.netEnd();for(let i=0;i<20;i++){H.step(1);G.step(1);L.step(1);}}

// ---- sunk on the host: it goes down on the guest too, washing both off into the sea, and is gone ----
{S.hp=0;let sank=0,down=0;for(let i=0;i<60*24;i++){H.step(1);G.step(1);if(Sg.dead)sank=1;down=Math.max(down,Sg.sk);if(!HT.SHIPS[S.slot]&&!GT.SHIPS[S.slot])break;}
 both(30);
 console.log('sunk on the host: going down on the guest',ok(sank&&down>3),'| gone from both',ok(!HT.SHIPS[S.slot]&&!GT.SHIPS[S.slot]),'| both players back in the world on the guest',ok(GT.P1.pos.x<GT.SHIP_X0&&GT.P2.pos.x<GT.SHIP_X0),
   'drawn off the scene',ok(GT.P1.root.parent===GT.P2.root.parent&&GT.P1.root.parent!==null&&!GT.P1.root.parent.shipPg));}

// ---- another one in the same slot: whole again on the guest (nothing left of the last one's holes) ----
{HT.P1.pos.set(HT.TENV.sea.x0-6,HT.G+1,(HT.TENV.sea.z0+HT.TENV.sea.z1)/2);HT.P1.cam.yaw=-Math.PI/2;both(30);
 HT.menuOpen=true;HT.tenvVeh('barge');HT.menuOpen=false;both(80);
 const S2=HT.SHIPS.find(s=>s),S2g=S2&&GT.SHIPS[S2.slot];let diff=0,n=0;
 if(S2g)for(let u=S2.K.u0;u<=S2.K.u1;u++)for(let w=S2.K.w0;w<=S2.K.w1;w++)for(let y=HT.G-2;y<HT.G+3;y++){n++;if(HT.get(S2.ox+u,y,S2.oz+w)!==GT.get(S2.ox+u,y,S2.oz+w))diff++;}
 console.log('another barge in slot',S2?S2.slot:'-','| on the guest',ok(!!S2g&&S2g.n===S2.n),'| blocks that differ',diff,'of',n,ok(S2g&&diff===0));
 // (the guest's own hippo walks off the side into the sea, guessing its own moves as it goes: no jump on either end,
 // and its camera still looks the same way out in the world)
 if(S2g){deck(HT,HT.P2,S2,2.5,0.5);both(90);const pads=G.ctx.navigator.getGamepads();GT.P1.cam.yaw=-Math.PI/2;both(10);
  const y0=GT.P1.cam.yaw+GT.netFrameYaw(GT.P1),on=GT.shipOf(GT.P1)===S2g;let jump=0,prev=null;
  pads[0].axes[1]=-1;for(let i=0;i<150;i++){G.step(1);H.step(1);const w=wpos(GT,GT.P1);if(prev)jump=Math.max(jump,dw(w,prev));prev=w;}pads[0].axes[1]=0;both(60);
  const y1=GT.P1.cam.yaw+GT.netFrameYaw(GT.P1);
  console.log('  guest walked off the side: was aboard',ok(on),'| off it on the host',ok(!HT.shipOf(HT.P2)),'and on the guest',ok(!GT.shipOf(GT.P1)),'| drawn off the scene',ok(!GT.P1.root.parent.shipPg),
    '| biggest step in a frame',f2(jump),ok(jump<0.8),'| apart',f2(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))),ok(dw(wpos(GT,GT.P1),wpos(HT,HT.P2))<1),'| camera turned in the world by',f2(Math.abs(y1-y0)),ok(Math.abs(y1-y0)<0.02));}}

// ---- the aircraft carrier: its deck weapons (a guest manning one, one wrecked), its jets, furniture knocked over
// aboard, and breaking in two (the wreck on the guest too, from the same blocks, tipping as the host's does; a player
// joining late gets both pieces) ----
{HT.tenvClear();both(40);HT.P1.pos.set(HT.TENV.sea.x0-6,HT.G+1,(HT.TENV.sea.z0+HT.TENV.sea.z1)/2);HT.P1.cam.yaw=-Math.PI/2;HT.P1.vy=0;both(20);
 HT.menuOpen=true;HT.tenvVeh('carrier');HT.menuOpen=false;both(150);
 const C=HT.SHIPS.find(s=>s&&s.kind==='carrier'),Cg=C&&GT.SHIPS[C.slot];
 if(!C)console.log('no carrier spawned');else{
  const host0=HT.DT.host;HT.DT.host=2;both(2);   // (Peaceful: the crew leave everyone be, so nobody sounds general quarters and mans everything)
  const nm=C.mounts?C.mounts.length:0;
  console.log('a carrier on the host: on the guest',ok(!!Cg&&Cg.n===C.n),'| deck weapons',Cg&&Cg.mounts?Cg.mounts.length:0,'of',nm,ok(Cg&&Cg.mounts&&Cg.mounts.length===nm&&nm>0),'| its jets',ok(GT.venues.has('shipJets:'+C.n)));
  // (the guest, as a goblin, mans the first deck weapon and turns its view: the host's turns, and so does the guest's copy)
  HT.setGobP(HT.P2,true);both(20);
  const Mt=C.mounts[0];HT.P2.pos.set(Mt.x+1.2,Mt.y,Mt.z);HT.P2.vy=0;HT.P2.mvx=HT.P2.mvz=0;both(30);
  const pads=G.ctx.navigator.getGamepads(),btn=(b,on)=>{pads[0].buttons[b].pressed=on;pads[0].buttons[b].value=on?1:0;};
  btn(3,true);G.step(1);H.step(1);btn(3,false);both(30);
  const at=HT.P2.drv&&HT.P2.drv.k==='mount';
  console.log('guest pressed use at a',Mt.K.name+': host has it there',ok(at),'| guest\'s copy is the one it\'s at',ok(GT.P1.drv&&GT.P1.drv.o===Cg.mounts[0]));
  const y0=Mt.yaw;pads[0].axes[2]=1;both(60);pads[0].axes[2]=0;both(30);const gm=Cg.mounts[0];
  console.log('  turned the view: the host\'s turned',f2(Math.abs(Mt.yaw-y0)),ok(Math.abs(Mt.yaw-y0)>0.2),'| the guest\'s copy off by',f2(Math.abs(gm.yaw-Mt.yaw)),ok(Math.abs(gm.yaw-Mt.yaw)<0.05),
    '| its head turned to match',ok(Math.abs(gm.head.rotation.y-(gm.yaw-gm.h))<0.001));
  btn(3,true);G.step(1);H.step(1);btn(3,false);both(40);console.log('  pressed use again: off it',ok(!HT.P2.drv&&!GT.P1.drv));
  HT.setGobP(HT.P2,false);both(20);
  // (one wrecked on the host: blackened on the guest, and its health there)
  const j=nm-1;HT.mountWreck(C.mounts[j]);both(30);
  console.log('a deck weapon wrecked on the host: on the guest',ok(Cg.mounts[j].dead&&Cg.mounts[j].hp===0),'| the others not',ok(!Cg.mounts[0].dead));
  // (a jet nudged along the deck and hurt on the host)
  const pl=C.jetV.pl[0],GV=GT.venues.get('shipJets:'+C.n),gpl=GV&&GV.pl[0];pl.g.position.x-=3;pl.hp-=5;both(40);
  console.log('a jet moved and hurt on the host: the guest\'s apart',gpl?f2(d3(gpl.g.position,pl.g.position)):'-',ok(gpl&&d3(gpl.g.position,pl.g.position)<0.05),'| its health',gpl?gpl.netHp:'-',ok(gpl&&Math.abs(gpl.netHp-pl.hp)<0.01));
  // (furniture knocked over aboard: the guest sees it go over, and lying the same way)
  const fi=C.props?C.props.findIndex(f=>!f.gone&&!f.fall&&f.down===undefined):-1;
  if(fi<0)console.log('no furniture aboard');else{const f=C.props[fi],fg=Cg.props&&Cg.props[fi];HT.shipKnock(f,1,0);let fell=0;
   for(let i=0;i<60;i++){H.step(1);G.step(1);if(fg&&fg.fall)fell++;}
   console.log('a',f.type,'knocked over aboard: the guest showed it falling for',fell,'frames',ok(fell>=10),'| lying the same way',ok(fg&&fg.down!==undefined&&Math.abs(fg.down-f.down)<0.01));}
  // (broken in two near the stern: the wreck on the guest too, in the same slot, from the same blocks)
  const Hl=C.hull;let bi=-1;for(let i=0;i<Hl.n.length;i++)if(Hl.n0[i]>=20){bi=i+12;break;}
  const W=HT.shipBreak(C,bi);both(40);const Wg=W&&GT.SHIPS[W.slot];
  const same=(A,B,S,K)=>{let s=0,d=0;for(let u=K.u0;u<=K.u1;u+=2)for(let w=K.w0;w<=K.w1;w+=2)for(let y=HT.G-6;y<HT.G+20;y+=2){const a=A.get(S.ox+u,y,S.oz+w),b=B.get(S.ox+u,y,S.oz+w);if(a===b)s++;else d++;}return[s,d];};
  const [s1,d1]=same(HT,GT,C,C.K),[s2,d2]=W?same(HT,GT,W,W.K):[0,1];
  console.log('broken in two on the host: the guest\'s carrier broken at the same place',ok(Cg.K.w0===C.K.w0&&Cg.K.w1===C.K.w1),'| its wreck in slot',W?W.slot:'-',ok(!!Wg&&Wg.n===W.n),
    '| blocks that differ: the rest',d1,'of',s1+d1,ok(d1===0),'the wreck',d2,'of',s2+d2,ok(d2===0));
  // (a third player joins now: both pieces, as they are)
  {const J2=game('late2',SEED+31,{});J2.T.netJoinWith(hub.make(),'SHIPA','mem');for(let i=0;i<20&&!J2.reloads;i++){J2.step(1);H.step(1);G.step(1);}
   const L=game('late3',SEED+31,{},Object.fromEntries(J2.SS._m));for(let i=0;i<80&&!L.T.NET.joined;i++){L.step(1);H.step(1);G.step(1);await yieldNow();}
   for(let i=0;i<60;i++){H.step(1);G.step(1);L.step(1);}
   const Cl=L.T.SHIPS[C.slot],Wl=W&&L.T.SHIPS[W.slot],[s3,d3b]=Cl?same(HT,L.T,C,C.K):[0,1];
   console.log('  a third player joins: the carrier broken',ok(Cl&&Cl.K.w0===C.K.w0&&Cl.K.w1===C.K.w1),'| the wreck',ok(!!Wl&&Wl.n===W.n),'| blocks that differ',d3b,ok(d3b===0));
   L.T.netEnd();for(let i=0;i<20;i++){H.step(1);G.step(1);L.step(1);}}
  // (left alone, the wreck drifts off and tips its far end under, on both)
  let most=0;for(let i=0;i<60*16;i++){H.step(1);G.step(1);if(W.brk&&Wg&&Wg.brk)most=Math.max(most,Math.abs(W.grp.rotation.x-Wg.grp.rotation.x));if(!HT.SHIPS[W.slot])break;}
  console.log('  the wreck tips under: host',W.brk?f2(W.brk.tilt):'-','guest',Wg&&Wg.brk?f2(Wg.brk.tilt):'-',ok(W.brk&&W.brk.tilt>0.05&&Math.abs(W.brk.tilt-Wg.brk.tilt)<0.05),'| most its tip was off by',f2(most),ok(most<0.05),
    '| apart',Wg?f2(Math.hypot(Wg.x-W.x,Wg.z-W.z)):'-',ok(Wg&&Math.hypot(Wg.x-W.x,Wg.z-W.z)<0.5));HT.DT.host=host0;}}
// ---- cleared on the host: gone on the guest ----
HT.tenvClear();both(80);
console.log('cleared on the host: no ships on the guest',ok(!GT.SHIPS.some(s=>s)),'no ship venue',ok(!GT.venues.has('tenvShips')));
// ---- a host on the older version: the guest is told it can't join ----
HT.netEnd();for(let i=0;i<5;i++){H.step(1);G.step(1);}
console.log('done');
})();
