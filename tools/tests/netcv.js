// Online co-op with the aircraft carriers out in the world (carrier-world.js): a host and a guest at a naval base, the
// host's carrier on the guest (and none of the guest's own), knocked about, broken and left; back, the host's remembered
// one on the guest the same, holes, break, wrecked weapons and jets, and on a player joining late. Harness from net.js.
//
const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('g.js','utf8');
const d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={cvSite,portCell,coastType,groundAt,get wrecked(){return wrecked},SAVE_KEY,CELL,mountWreck,shipKnock,shipBreak,tenvVeh,tenvFoe,tenvClear,get TENV(){return TENV},get TS(){return TS},set menuOpen(v){menuOpen=v},SHIPS,SHIP_X0,shipToWorld,shipOf,pwx,pwz,netFrameYaw,meshes,frame,players,P1,P2,NET,NETM,netHostWith,netJoinWith,netEnd,crush,get,goblins,setGobP,DT,venues,get seed(){return seed},get edits(){return edits},G};})();');
if(src===src0)throw new Error('closing line not found');
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
// one game: seed for its Math.random, its localStorage and sessionStorage contents
function game(name,rseed,ls,ss){
  const timers=[];let clock=1000;
  const ctx={btoa,atob,console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,
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
const key=(src0.match(/SAVE_KEY='([^']+)'/)||[])[1];
const H=game('host',SEED+3,{[key]:JSON.stringify({seed:4242,ed2:{},coll:{},down:[],dest:{},test:[]})});H.play();H.step(60);
const HT=H.T;HT.DT.invuln=true;
// (the nearest naval base with an anchorage)
let site=null;for(let r=0;r<=40&&!site;r++)for(let cx=-r;cx<=r&&!site;cx++)for(let cz=-r;cz<=r&&!site;cz++){if(Math.max(Math.abs(cx),Math.abs(cz))!==r)continue;const s=HT.cvSite(cx,cz);if(s)site=s;}
if(!site){console.log('no naval base');process.exit(0);}
const G0=HT.G,put=(T,p,x,z)=>{const y=T.groundAt(x,z,G0+60);p.pos.set(x,y+1,z);p.vy=0;p.mvx=p.mvz=0;p.state='walk';p.grounded=false;};
put(HT,HT.P1,site.bx,site.bz);H.step(30);
HT.netHostWith(hub.make(),'CVSEA','mem');
const J1=game('guestT1',SEED+11,{});J1.T.netJoinWith(hub.make(),'CVSEA','mem');for(let i=0;i<20&&!J1.reloads;i++){J1.step(1);H.step(1);}
const G=game('guest',SEED+11,{},Object.fromEntries(J1.SS._m)),GT=G.T;for(let i=0;i<80&&!GT.NET.joined;i++){G.step(1);H.step(1);await yieldNow();}
const both=n=>{for(let i=0;i<n;i++){H.step(1);G.step(1);}};
put(HT,HT.P2,site.bx+4,site.bz);both(240);
console.log('guest joined out in the world',ok(GT.NET.joined&&!GT.TENV),'| naval base',site.key);
const cvH=()=>HT.SHIPS.filter(S=>S&&S.cvKey===site.key);
let S=cvH()[0],Sg=S&&GT.SHIPS[S.slot];
console.log('the carrier on the host',ok(!!S),'| on the guest',ok(!!Sg&&Sg.n===S.n&&Sg.kind==='carrier'),'| the guest made none of its own',ok(GT.SHIPS.filter(s=>s).length===HT.SHIPS.filter(s=>s).length&&!GT.venues.has(site.key)),
 '| apart',Sg?f2(Math.hypot(Sg.x-S.x,Sg.z-S.z)):'-',ok(Sg&&Math.hypot(Sg.x-S.x,Sg.z-S.z)<0.1),'| its jets on the guest',ok(GT.venues.has('shipJets:'+S.n)));
if(!S||!Sg){process.exit(0);}
const pick=S=>{const L=[];for(let w=-88;w<=88;w+=2)for(let y=-2;y<=17;y+=1)for(let s=-14;s<=14;s+=2)L.push([S.ox-s,G0+y,S.oz+w]);return L;};
const cmp=(A,B,S)=>{let same=0,diff=0;for(const [x,y,z] of pick(S)){if(A.get(x,y,z)===B.get(x,y,z))same++;else diff++;}return[same,diff];};
// ---- knocked about on the host: a hole in the hull, a weapon wrecked, the stern broken off ----
HT.crush(S.ox+0.5,G0+16,S.oz+30.5,2,-1,1);HT.mountWreck(S.mounts[1]);both(20);
{const len0=S.K.w1-S.K.w0;for(let y=-6;y<=10&&S.K.w1-S.K.w0===len0;y+=2)for(let u=-15;u<=15;u+=2){HT.crush(S.ox+u+0.5,G0+y,S.oz-75.5,2,-1,1);both(3);}
 both(60*60);console.log('broken on the host: length',len0,'->',S.K.w1-S.K.w0,'| the guest\'s',Sg.K.w1-Sg.K.w0,ok(Sg.K.w1-Sg.K.w0===S.K.w1-S.K.w0),'| blocks that differ',cmp(HT,GT,S)[1]);}
// ---- both leave: dropped on the host and the guest; both back: the remembered one on both, the same ----
const far=(T,p)=>{p.pos.set(site.x+3000,G0+80,site.z);p.vy=0;p.state='walk';};
far(HT,HT.P1);far(HT,HT.P2);both(300);
console.log('both left: gone on the host',ok(!cvH().length),'| on the guest',ok(!GT.SHIPS.some(s=>s&&s.n===S.n)),'(ships out there: host',HT.SHIPS.filter(s=>s).map(s=>s.cvKey||s.kind).join(),'guest',GT.SHIPS.filter(s=>s).map(s=>s.n+s.kind).join()+')','| remembered',ok(typeof HT.wrecked[site.key]==='object'));
put(HT,HT.P1,site.bx,site.bz);put(HT,HT.P2,site.bx+4,site.bz);both(300);
S=cvH()[0];Sg=S&&GT.SHIPS[S.slot];
{const [same,diff]=S&&Sg?cmp(HT,GT,S):[0,-1];
 console.log('both back: on the host',ok(!!S),'| on the guest',ok(!!Sg&&Sg.n===S.n),'| length',S&&S.K.w1-S.K.w0,'guest',Sg&&Sg.K.w1-Sg.K.w0,ok(Sg&&S&&Sg.K.w1-Sg.K.w0===S.K.w1-S.K.w0),
  '| blocks the same',same,'different',diff,ok(diff===0),'| weapons wrecked',S&&S.mounts.filter(m=>m.dead).length,'guest',Sg&&Sg.mounts.filter(m=>m.dead).length,ok(S&&Sg&&S.mounts.filter(m=>m.dead).length===Sg.mounts.filter(m=>m.dead).length),
  '| jets',S&&S.jetV?S.jetV.pl.length:0,'guest',Sg&&Sg.jetV?Sg.jetV.pl.length:0,ok(S&&Sg&&(S.jetV?S.jetV.pl.length:0)===(Sg.jetV?Sg.jetV.pl.length:0)));}
// ---- a third player joining now: the same ----
if(S){const J2=game('late1',SEED+21,{});J2.T.netJoinWith(hub.make(),'CVSEA','mem');for(let i=0;i<20&&!J2.reloads;i++){J2.step(1);H.step(1);G.step(1);}
 const L=game('late',SEED+21,{},Object.fromEntries(J2.SS._m));for(let i=0;i<80&&!L.T.NET.joined;i++){L.step(1);H.step(1);G.step(1);await yieldNow();}
 for(let i=0;i<120;i++){H.step(1);G.step(1);L.step(1);}
 const Sl=L.T.SHIPS[S.slot],[same,diff]=Sl?cmp(HT,L.T,S):[0,-1];
 console.log('a third player joins: has it',ok(!!Sl&&Sl.n===S.n),'| length',Sl&&Sl.K.w1-Sl.K.w0,ok(Sl&&Sl.K.w1-Sl.K.w0===S.K.w1-S.K.w0),'| blocks the same',same,'different',diff,ok(diff===0),'| jets',Sl&&Sl.jetV?Sl.jetV.pl.length:0,ok(Sl&&(Sl.jetV?Sl.jetV.pl.length:0)===(S.jetV?S.jetV.pl.length:0)));}
console.log('done');process.exit(0);
})();
