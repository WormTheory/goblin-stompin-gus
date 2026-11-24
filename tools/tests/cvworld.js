let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={crush,mountWreck,shipKnock,cvSnap,get edits(){return edits},CV_JETS,cvSite,cvOpen,cvWorldRefresh,refreshVenues,get seed(){return seed},get wrecked(){return wrecked},SHIPS,SHIP_X0,SHIP_KINDS,shipFits,shipOf,shipToWorld,worldToShip,pwx,pwz,venues,players,goblins,frame,keys,DT,setGob,get,groundAt,coastType,portCell,seaPlot,plotType,meshes,shipSink,shipGQ,drvFind,drvEnter,drvExit,get TENV(){return TENV},get playing(){return playing},set menuOpen(v){menuOpen=v},SAVE_KEY,CELL};\n})();');
const deep=()=>new Proxy(function(){}, {get:(t,p)=>p===Symbol.toPrimitive?()=>0:(p==='length'?0:deep()),apply:()=>deep(),construct:()=>deep()});
const {Q,V3,Rot,Col,Mat,O3,M4,THREE}=require('./stub-three.js');   // (the stand-in three.js every suite shares)
const listeners={};
const el=()=>({remove(){},querySelectorAll:()=>[],closest:()=>null,matches:()=>false,contains:()=>false,attrs:{},kids:[],setAttribute(k,v){this.attrs[k]=v},style:{setProperty(k,v){this[k]=v}},hidden:false,textContent:'',innerHTML:'',classList:{contains(){return false},add(){},remove(){},toggle(){}},append(...k){this.kids.push(...k)},insertBefore(){},querySelector:()=>el(),focus(){},dataset:{},
 L:{},addEventListener(t,f){(this.L[t]=this.L[t]||[]).push(f)},getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),clearRect(){},fillRect(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},set fillStyle(v){}}),requestPointerLock(){}});
const els={};
global.window=global;global.THREE=THREE;global.devicePixelRatio=1;global.innerWidth=800;global.innerHeight=600;
global.document={querySelector:()=>el(),getElementById:id=>els[id]||(els[id]=Object.assign(el(),{appendChild(){},style:{}})),createElement:()=>Object.assign(el(),{style:{}}),querySelectorAll:()=>[],addEventListener(){},pointerLockElement:null};
global.addEventListener=(t,f)=>{(listeners['w'+t]=listeners['w'+t]||[]).push(f)};
global.matchMedia=()=>({matches:false});
const CVSEED=+(process.env.CVSEED||4242);const LS=process.env.CVLOAD?JSON.parse(fs.readFileSync(process.env.CVLOAD,'utf8')):{};global.localStorage={getItem:k=>k in LS?LS[k]:(/goblin-city-v/.test(k)?JSON.stringify({seed:CVSEED,edits:{},coll:{},down:[],dest:{},test:[]}):null),setItem(k,v){LS[k]=String(v)},removeItem(k){delete LS[k]}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
// Aircraft carriers out in the world (vehicles/carrier-world.js): one anchored off each naval base, made as a player
// comes near and dropped once they've gone, coming back whole; sunk, gone for good (and saved so)
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44,PATCH=8*T.CELL;
console.log('world seed',T.seed,'| Testing Environment',!!T.TENV);
// ---- the naval bases within 60 patches of the middle, and their anchorages
const bases=[];{const t0=Date.now();let nb=0;
 for(let cx=-60;cx<=60;cx++)for(let cz=-60;cz<=60;cz++){if(T.portCell(cx*8,cz*8)!=='navy')continue;let n=0;for(let a=0;a<8;a++)for(let b=0;b<8;b++)if(T.coastType(cx*8+a,cz*8+b)==='navy')n++;if(!n)continue;nb++;
  const s=T.cvSite(cx,cz);if(s)bases.push(s);}
 bases.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
 console.log('naval bases',nb,'| with an anchorage',bases.length,'|',Date.now()-t0,'ms');
 for(const s of bases.slice(0,4))console.log(' ',s.key,'anchored at',f1(s.x),f1(s.z),'yaw',f1(s.yaw),'|',f1(Math.hypot(s.x-s.bx,s.z-s.bz)),'from the base | open sea',T.cvOpen(s.x,s.z,s.yaw));}
if(!bases.length){console.log('no carrier anywhere near');process.exit(0);}
const site=bases[0];
const put=(x,z)=>{const y=T.groundAt(x,z,G0+60);P.pos.set(x,y+1,z);P.vy=0;P.mvx=P.mvz=0;P.state='walk';P.grounded=false;};
const cvs=()=>T.SHIPS.filter(S=>S&&S.cvKey===site.key);
T.DT.invuln=true;T.setGob(true);
// ---- coming near: at the base's yard
put(site.bx,site.bz);run(3);
let S=cvs()[0];
console.log('Gnash at the naval base,',f1(Math.hypot(site.x-P.pos.x,site.z-P.pos.z)),'from the anchorage: carrier made',!!S,'| venue',T.venues.has(site.key));
if(!S){console.log('errors',errs.length,errs.slice(0,5));process.exit(0);}
console.log('  at',f1(S.x),f1(S.z),'yaw',f1(S.yaw),'| where it should be',S.x===site.x&&S.z===site.z,'| fits',T.shipFits(S,S.x,S.z,S.yaw),'| health',S.hp,'| crew',!!S.crewV&&!S.crewV.off,'mounts',(S.mounts||[]).length,'jets',S.jetV?S.jetV.pl.length:0,'| jets venue',T.venues.has('shipJets:'+S.n));
{let fr=0,last=-1,same=0;const pm=()=>[...T.meshes.values()].filter(e=>e.cx>=T.SHIP_X0/16).length;while(fr<600&&same<20){run(1/60);fr++;const k=pm();same=k===last?same+1:0;last=k;}fr-=same;console.log('  pocket chunks drawn',[...T.meshes.values()].filter(e=>e.cx>=T.SHIP_X0/16).length,'after',fr,'frames');}
const W={x:0,z:0},sleep=ms=>new Promise(r=>setTimeout(r,ms));
const deck=(S,s,w)=>{P.pos.set(S.ox-s+0.5,G0+17.2,S.oz+w+0.5);P.vy=0;P.mvx=P.mvz=0;P.state='walk';P.grounded=false;};
const crewOut=S=>S.crewV.slots.filter(g=>g&&g.state!=='wait').length;
const away=()=>{const S0=cvs()[0],x=(S0?S0.x:site.x)+3000,z=S0?S0.z:site.z;P.pos.set(x,G0+80,z);P.vy=0;P.state='walk';run(3);};
const back=(x,z)=>{put(x,z);run(3);return cvs()[0];};
// (blocks of it, s,y,w as carrier.js counts them, to compare one with the next)
const pick=[];for(let w=-80;w<=80;w+=4)for(let y=-2;y<=17;y+=3)for(let s=-14;s<=14;s+=4)pick.push([s,y,w]);
const blocks=S=>pick.map(([s,y,w])=>T.get(S.ox-s,G0+y,S.oz+w)).join(',');
(async()=>{
if(process.env.CVLOAD){
 // ---- a game loaded from the save the first run left: the carrier where it was, as it was
 const st=T.wrecked[site.key];console.log('loaded: remembered',!!st&&typeof st==='object');
 if(st&&typeof st==='object'){const S=back(st.x,st.z+150);const want=JSON.parse(fs.readFileSync(process.env.CVLOAD+'.blocks','utf8'));
  console.log('  carrier',!!S,'| where it was left',!!S&&Math.hypot(S.x-st.x,S.z-st.z)<0.01,'| health',S&&f1(S.hp),'| length',S&&S.K.w1-S.K.w0,'| blocks the same',!!S&&blocks(S)===want.b,
   '| wrecked weapons',S&&S.mounts.filter(m=>m.dead).length,'| jets',S&&S.jetV?S.jetV.pl.length:0,'| props down',S&&S.props.filter(f=>f.down!==undefined).length);}
 console.log('errors',errs.length,errs.slice(0,5));process.exit(0);}
// ---- aboard: the crew at their posts, general quarters once you're on the deck
deck(S,0,20);run(4);
console.log('Gnash dropped on the flight deck: aboard',T.shipOf(P)===S,'| crew out',crewOut(S),'| general quarters',S.crewV.roused);
// ---- leaving it untouched: dropped, its crew and jets with it; back, the same again
put(site.bx,site.bz);run(2);away();
console.log('Gnash 3000 away: carrier gone',!T.SHIPS.includes(S),'| venue gone',!T.venues.has(site.key),'| jets venue gone',!T.venues.has('shipJets:'+S.n),'| its crew left about',T.goblins.filter(g=>g.state!=='wait'&&g.homeV===S.crewV).length,'| ships',T.SHIPS.filter(s=>s).length);
let S2=back(site.bx,site.bz);
console.log('back again: a carrier',!!S2,'| a new one',S2&&S2!==S,'| at its anchorage',!!S2&&S2.x===site.x&&S2.z===site.z,'| health',S2&&f1(S2.hp));
if(!S2){console.log('errors',errs.length,errs.slice(0,5));process.exit(0);}
// ---- knocked about, then left: a crater in the deck, a hole in the hull, a deck weapon wrecked, a prop knocked over,
// a jet moved and hurt, and the ship moved off (as if sailed)
T.crush(S2.ox+0.5,G0+16,S2.oz+30.5,2,-1,1);T.crush(S2.ox+0.5,G0+0,S2.oz-20.5,2,-1,1);run(0.3);
T.mountWreck(S2.mounts[1]);
const fi=S2.props.findIndex(f=>!f.gone&&f.type!=='bunk');T.shipKnock(S2.props[fi],1,0);run(2);
const pl=S2.jetV.pl[2];pl.g.position.x+=3;pl.hp=123;
S2.x+=200;S2.yaw+=0.4;S2.grp.position.x=S2.x;S2.grp.rotation.y=S2.yaw;run(0.5);
const was={x:S2.x,z:S2.z,yaw:S2.yaw,hp:S2.hp,leak:S2.leak,b:blocks(S2),jet:[pl.g.position.x-S2.ox,pl.hp]};
console.log('knocked about: health',f1(was.hp),'| leaking',was.leak,'| weapon wrecked',S2.mounts[1].dead,'| prop',S2.props[fi].type,'down',S2.props[fi].down!==undefined,'| moved to',f1(S2.x),f1(S2.z));
away();
const st=T.wrecked[site.key];console.log('left: remembered',!!st&&typeof st==='object','| its size',JSON.stringify(st).length,'chars');
let S3=back(was.x,was.z+150);
const J=S3&&S3.jetV.pl.find(q=>q.home===pl.home);
console.log('back: a carrier',!!S3,'| where it was left',!!S3&&S3.x===was.x&&S3.z===was.z&&Math.abs(S3.yaw-was.yaw)<0.01,'| none at the anchorage',cvs().length===1,'| health',S3&&f1(S3.hp),'(was',f1(was.hp)+')','| leak',S3&&S3.leak,
 '| blocks the same',!!S3&&blocks(S3)===was.b,'| weapon still wrecked',!!S3&&S3.mounts[1].dead,'others fine',!!S3&&S3.mounts.filter(m=>m.dead).length===1,'| prop down',!!S3&&S3.props[fi].down!==undefined,
 '| the jet where it was',!!J&&Math.abs(J.g.position.x-S3.ox-was.jet[0])<0.02,'hp',J&&J.hp);
// ---- broken in two, then left: only the end that stayed afloat comes back
let len0=S3.K.w1-S3.K.w0;
{let n=0;for(let y=-6;y<=10&&S3.K.w1-S3.K.w0===len0;y+=2)for(let u=-15;u<=15;u+=2){T.crush(S3.ox+u+0.5,G0+y,S3.oz-75.5,2,-1,1);n++;run(0.05);}run(1);
 console.log('a cut near the stern:',n,'blasts | broke',S3.K.w1-S3.K.w0<len0,'| length',len0,'->',S3.K.w1-S3.K.w0,'| afloat',!S3.dead);}
run(60);
const was2={len:S3.K.w1-S3.K.w0,hp:S3.hp,b:blocks(S3),dead:S3.mounts.filter(m=>m.dead).length,jets:S3.jetV?S3.jetV.pl.length:0,props:S3.props.filter(f=>f.down!==undefined).length};
away();const S4=back(S3.x,S3.z+150);
console.log('back: length',S4&&S4.K.w1-S4.K.w0,'(was',was2.len+') | health',S4&&f1(S4.hp),'(was',f1(was2.hp)+') | blocks the same',!!S4&&blocks(S4)===was2.b,'| weapons wrecked or gone',S4&&S4.mounts.filter(m=>m.dead).length,'(was',was2.dead+') | jets',S4&&S4.jetV?S4.jetV.pl.length:0,'(was',was2.jets+')');
// ---- saved: the next run loads it (CVLOAD)
await sleep(1500);
if(process.env.CVSAVE){fs.writeFileSync(process.env.CVSAVE,JSON.stringify(LS));fs.writeFileSync(process.env.CVSAVE+'.blocks',JSON.stringify({b:blocks(S4)}));console.log('saved for the next run');}
else{
// ---- one in use isn't dropped: Gnash aboard while it's moved far from anywhere
 deck(S4,0,20);run(1);S4.x+=2500;S4.grp.position.x=S4.x;run(3);
 console.log('sailed 2500 off with Gnash aboard: kept',T.SHIPS.includes(S4),'| Gnash aboard',T.shipOf(P)===S4,'| the anchorage gets no second one',cvs().length===1);
// ---- sunk: gone for good, even after leaving and coming back, and saved so
 S4.x-=2500;S4.grp.position.x=S4.x;run(0.5);put(site.bx,site.bz);run(1);S4.hp=0;run(2);
 console.log('sunk: sinking',S4.dead,'| noted',T.wrecked[site.key]===1);
 run(50);
 console.log('  50 s on: gone',!T.SHIPS.includes(S4),'| venue gone',!T.venues.has(site.key));
 away();put(site.bx,site.bz);run(3);
 console.log('  away and back: no carrier',cvs().length===0);
 await sleep(1500);const sv=JSON.parse(LS[T.SAVE_KEY]||'{}');console.log('  in the save',!!(sv.wreck&&sv.wreck[site.key]===1));
 {const s2=bases[1];put(s2.bx,s2.bz);run(3);const C=T.SHIPS.find(S=>S&&S.cvKey===s2.key);console.log('the next naval base (',s2.key,'): carrier',!!C,'| ships out',T.SHIPS.filter(s=>s).length);}}
console.log('errors',errs.length,errs.slice(0,5));
process.exit(0);
})();
