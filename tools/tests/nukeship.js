// The Nuke Launcher at sea and against the aircraft carrier (shots.js shotNuke, big-blast.js bbShips):
// 1. a warhead fired into the open sea: where it goes off, the worst frame while it runs and the water-flow work it starts
// 2. a carrier in the Testing Environment nuked from outside (a warhead landing in the sea beside it, by a deck weapon), and 3. one landing on
//    its flight deck: how much of it is left, whether it breaks and sinks, whether its deck weapons fall with their deck
// The game's own timing budgets need a real clock, so these games get the real performance.now (the frames are still stepped).
const fs=require('fs'),vm=require('vm'),{performance}=require('perf_hooks');
const src0=fs.readFileSync('g.js','utf8'),d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,P1,bigBlast,BB,get craters(){return craters},get edits(){return edits},chunks,ckey,CS,G,H,DT,SHIPS,SHIP_X0,tenvVeh,TS,'+
  'set menuOpen(v){menuOpen=v},shot,SHOTS,WEAPONS,get,rawGet,shipToWorld,worldToShip,shipOf,wfJobs:typeof WF!=="undefined"?WF:null,get wrecked(){return wrecked},seaPlot,CELL};})();');
if(src===src0)throw new Error('closing line not found');
const SAVE_KEY=(src0.match(/SAVE_KEY='([^']+)'/)||[])[1];
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
function game(name,rseed,ls){
  const timers=[];let clock=1000;
  const ctx={console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,performance,
    setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},__LS:store(ls),__SS:store()};
  vm.createContext(ctx);
  const head='var global=globalThis;let __s='+rseed+';Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};\n'+stubs+
    '\nO3.prototype.isObject3D=true;global.localStorage=__LS;global.sessionStorage=__SS;global.location={reload(){}};\n';
  vm.runInContext(head+src,ctx,{filename:name+'.js'});
  const T=ctx.__t,g={name,T,ctx,ft:[]};
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}
    const t0=performance.now();T.frame(clock);g.ft.push(performance.now()-t0);}};
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  return g;
}
const f1=v=>(+v).toFixed(1),SEED=+(process.env.SEED||1),ONLY=process.env.ONLY||'';
const W0=()=>null;
// a warhead fired as Gnash's launcher would (gob-weapons.js), from x,y,z toward tx,tz
function fire(T,x,y,z,tx,ty,tz){const W=T.WEAPONS.nuke,L=Math.hypot(tx-x,ty-y,tz-z)||1;
  return T.shot({kind:'nuke',x,y,z,vx:(tx-x)/L*W.speed,vy:(ty-y)/L*W.speed+(W.lob||0),vz:(tz-z)/L*W.speed,grav:W.grav||0,fuse:W.range/W.speed+0.5,R:W.R,dmg:W.dmg,cause:'test',crush:W.crush,vd:W.vd,bb:W.nuke});}
// frames until the shot's gone off and every blast job is done; the worst ones
function until(g,S,max){const T=g.T,f0=g.ft.length;let n=0,J=null,at=null;
  while(n<max){g.step(1);n++;if(S.live)continue;if(!at)at={x:S.pos.x,y:S.pos.y,z:S.pos.z,n};if(!J)J=T.BB.jobs[T.BB.jobs.length-1]||null;if(J&&J.done&&n>at.n+30)break;}
  const ft=g.ft.slice(f0+(at?at.n-1:0)),s=ft.slice().sort((a,b)=>a-b);
  return{at,J,n,worst:Math.max(...ft),p95:s[Math.floor(s.length*0.95)],med:s[s.length>>1],slow:ft.map((v,i)=>[v,i]).filter(q=>q[0]>50).slice(0,8)};}
// ---- 1. the open sea ----
if(!ONLY||ONLY==='sea'){const H=game('sea',SEED,{});H.play();H.step(120);const T=H.T;T.DT.invuln=true;
  // (the nearest open sea: a plot that's all water, with all water round it, looked for in rings round where Gus starts)
  const p=T.P1.pos.clone(),C=T.CELL,p0x=Math.floor(p.x/C),p0z=Math.floor(p.z/C),near=+(process.env.COAST||0);let sx=null,sz=null;
  for(let r=2;r<200&&sx===null;r++)for(let a=-r;a<=r&&sx===null;a++)for(const [px,pz] of [[p0x+a,p0z-r],[p0x+a,p0z+r],[p0x-r,p0z+a],[p0x+r,p0z+a]]){
    let ok=true;for(let i=-1;i<=1&&ok;i++)for(let j=-1;j<=1;j++)if(T.seaPlot(px+i,pz+j)!==2){ok=false;break;}
    if(ok&&near){ok=false;for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++)if(T.seaPlot(px+i,pz+j)===0)ok=true;}   // (COAST=1: with land within a few plots)
    if(ok){sx=px*C+C/2;sz=pz*C+C/2;break;}}
  if(sx===null)console.log('sea: none found');else{
    if(process.env.LAND){sx=Math.round(p.x)+40;sz=Math.round(p.z);}   // (LAND=1: on land by where Gus starts instead, to compare)
    T.P1.pos.set(sx-60,T.G+30,sz);T.P1.vy=0;H.step(240);   // (chunks round it made first: a flying Gus, invulnerable)
    T.P1.pos.set(sx-60,T.G+30,sz);T.P1.vy=0;H.step(1);
    const S=fire(T,sx-56,T.G+30,sz,sx,T.G,sz),r=until(H,S,60*30);
    console.log('sea: the warhead went off at y',r.at?f1(r.at.y-T.G):'never','(sea level 0) after',r.at?r.at.n:'-','frames | crater y',r.J?r.J.C.y-T.G:'-');
    console.log('  whole frame after it went off: worst',f1(r.worst),'ms, 95th',f1(r.p95),'median',f1(r.med),'| blast work worst',r.J?f1(r.J.worst):'-','ms | slow frames',JSON.stringify(r.slow.map(q=>[Math.round(q[0]),q[1]])));}}
// ---- 2 and 3. the carrier ----
const tenvLS=()=>({[SAVE_KEY]:JSON.stringify({seed:12345,edits:{},coll:{},down:[],dest:{},test:[],tenv:{boxes:[]}})});
function carrier(label,deck){
  const H=game(label,SEED,tenvLS());H.play();H.step(60);const T=H.T;T.DT.invuln=true;
  T.menuOpen=true;T.TS.n=1;T.tenvVeh('carrier');T.menuOpen=false;const S=T.SHIPS.find(s=>s);if(!S){console.log(label,': no ship');return;}
  if(S.crewV)S.crewV.off=true;H.step(240);
  const K=S.K,count=()=>{let n=0;for(let w=K.w0;w<=K.w1;w++)for(let y=K.y0;y<=K.y1;y++)for(let u=K.u0;u<=K.u1;u+=1){const b=T.rawGet(S.ox+u,y,S.oz+w);if(b&&b!==9)n++;}return n;};
  const n0=count(),hp0=S.hp,mt0=S.mounts.map(M=>M.y);
  // (Gus off to one side, well out of it; the warhead from above, toward the ship's middle or the sea beside it)
  const c=T.shipToWorld(S,S.ox+(K.u0+K.u1+1)/2,S.oz+(K.w0+K.w1+1)/2,{x:0,z:0}),M0=S.mounts[0],side=T.shipToWorld(S,M0.x-S.ox>0?S.ox+K.u1+14:S.ox+K.u0-14,M0.z,{x:0,z:0});   // (the sea off its side, by its first deck weapon)
  const tgt=deck?c:side,P=T.P1;P.pos.set(tgt.x+150,T.G+40,tgt.z);P.vy=0;H.step(30);
  const sh=fire(T,tgt.x,T.G+60,tgt.z+0.01,tgt.x,T.G,tgt.z);sh.v.set(0,-20,0);   // (straight down on to it)
  const r=until(H,sh,60*30),n1=count();
  let t=0;const ships=()=>T.SHIPS.filter(s=>s);while(t<60&&ships().some(s=>!s.dead)){H.step(30);t+=0.5;}
  console.log(label+': went off at y',r.at?f1(r.at.y-T.G):'never','| crater at',r.J?f1(r.J.C.x-c.x)+','+f1(r.J.C.z-c.z)+' from its middle, y '+(r.J.C.y-T.G):'-','| ship blocks',n0,'->',n1,'('+Math.round(100*(1-n1/n0))+'% gone) | health',Math.round(hp0),'->',Math.round(S.hp));
  console.log('  worst frame',f1(r.worst),'ms, 95th',f1(r.p95),'| blast work worst',r.J?f1(r.J.worst):'-','ms | slow',JSON.stringify(r.slow.map(q=>[Math.round(q[0]),q[1]])));
  console.log('  ships now',ships().length,'| afloat',ships().filter(s=>!s.dead).length,'| sinking',ships().filter(s=>s.dead).length,'| the carrier',S.dead?'sinking or gone':'afloat','after',t,'s');
  const mts=S.mounts.map((M,i)=>({k:M.kind,dead:M.dead,dy:f1(M.y-mt0[i]),gone:!M.g.parent||M.gone,under:T.rawGet(Math.floor(M.x),Math.floor(M.y)-1,Math.floor(M.z))}));
  console.log('  deck weapons:',mts.map(m=>m.k+(m.dead?' wrecked':'')+' dropped '+m.dy+(m.gone?' gone':'')+' on '+m.under).join('; '));
  // (a weapon stood over nothing: any left like that?)
  console.log('  deck weapons hanging over nothing:',S.mounts.filter(M=>M.g.parent&&!M.gone&&!T.rawGet(Math.floor(M.x),Math.floor(M.y)-1,Math.floor(M.z))&&!T.rawGet(Math.floor(M.x)+1,Math.floor(M.y)-1,Math.floor(M.z))).length);
}
if(!ONLY||ONLY==='side')carrier('carrier nuked from the sea beside it',false);
if(!ONLY||ONLY==='deck')carrier('carrier nuked on its flight deck',true);
process.exit(0);
