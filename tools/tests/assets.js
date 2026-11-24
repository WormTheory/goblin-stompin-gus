let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={PROPS,FIXM,assetProp,assetFix,liveProp,liveFix,liveMove,liveRecord,AB,HB,DEV_ABIL,assetMovesAll,HCLIP,hipAt,HC,liveVeh,VEH,setVeh,assetVehParts,get trafficRefreshT(){return trafficRefreshT},players,cars,goblins,frame,setGob,WEAPONS,GOB_WPN,STRIKES,ASSETS,assetCheck,assetFmt,assetWeapon,assetWeaponOf,assetClip,assetClipOf,wpnHitShapes,hitWorld,hitTouch,liveWeapon,liveClip,PICKUPS,hitGoblins,assetList,assetPlace,ASSET_LISTS,wpnHitSweep,hitHand,gobSwingU};\n})();');
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
global.localStorage={getItem:()=>null,setItem(){}};
global.requestAnimationFrame=()=>{};

const mk=i=>({index:i,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:{playEffect(){}}});
const pads=[mk(0),mk(1)];
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>pads},configurable:true});
console.error=()=>{};   // (the stub can't draw lightning, and says so in the weather's own stack trace)
eval(src);const T=window.__t;let now=1000;
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;
// The editor's asset files (src/assets/, tools/editor/): every file passes the check the editor and build use and
// keeps its exact layout through a load and save; what the game built from them matches the files; weapon hitboxes
// against goblin hurtboxes (player/hit-shapes.js); the live preview's entries (ui/editor-live.js).
const path=require('path'),AS=path.join(__dirname,'..','..','src','assets');
for(const kind of ['weapons','clips','bodies','grips','props','fixtures','moves','sites','vehicles']){
  const names=JSON.parse(fs.readFileSync(path.join(AS,kind,'_order.json'),'utf8')).order;let bad=[],moved=[];
  for(const n of names){const text=fs.readFileSync(path.join(AS,kind,n+'.json'),'utf8').replace(/\r\n/g,'\n'),a=JSON.parse(text);
    const E=T.assetCheck(kind,n,a);if(E.length)bad.push(n+': '+E.join('; '));if(T.assetFmt(a)!==text)moved.push(n);}
  console.log(kind,names.length,'files | problems',bad.length?bad.join(' | '):'none','| layout changed by a save',moved.length?moved.join(','):'none');}
// (the game's tables, from the build, against the files: a weapon's entry back as a file, a clip's keys)
{let wd=[],cd=[];
  for(const k in T.ASSETS.weapons){const f=JSON.parse(fs.readFileSync(path.join(AS,'weapons',k+'.json'),'utf8'));delete f.note;
    const back=T.assetWeaponOf(T.assetWeapon(f));if(JSON.stringify(back)!==JSON.stringify(T.assetWeaponOf(T.assetWeapon(T.ASSETS.weapons[k]))))wd.push(k);
    if(JSON.stringify(T.WEAPONS[k].model.held)!==JSON.stringify(T.assetWeapon(f).model.held))wd.push(k+'(held)');}
  for(const k in T.ASSETS.clips)if(T.ASSETS.clips[k].layout!=='rider'&&JSON.stringify((T.ASSETS.clips[k].layout==='hippo'?T.HCLIP:T.STRIKES)[k])!==JSON.stringify(T.assetClip(T.ASSETS.clips[k])))cd.push(k);
  console.log('game tables from the files: weapons',wd.length?'differ '+wd.join(','):'same','| clips',cd.length?'differ '+cd.join(','):'same');}
// (shared models: each view that shares the weapon's one model is it placed, and placing then taking the placing off
// gives the model back; a view with its own version is just that)
{let sh=0,own=0,bad=[];
  for(const k in T.ASSETS.weapons){const M=T.ASSETS.weapons[k].model;if(!M)continue;
    for(const j of T.ASSET_LISTS){const v=M[j];if(!v)continue;
      if(Array.isArray(v)||v.own){own++;continue;}sh++;
      const L=T.assetList(M,j);if(L.length!==M.boxes.length){bad.push(k+'.'+j+' count');continue;}
      L.forEach((b,i)=>{const u=T.assetPlace(b,v.at,true),o=M.boxes[i];
        if(u.p.some((x,q)=>Math.abs(x-o.p[q])>1e-4)||u.s.some((x,q)=>Math.abs(x-o.s[q])>1e-4))bad.push(k+'.'+j+'['+i+']');});}}
  console.log('shared models: views sharing',sh,'| with their own',own,'| round trip',bad.length?'off '+bad.join(','):'exact','| club dropped',!!T.WEAPONS.club.model.drop&&T.WEAPONS.club.model.drop.length);}
// ---- hit shapes ----
T.setGob(true);S(20);
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
const G=T.goblins.slice(0,1)[0];
const hitAt=(W,dx,dz,dy=0,h=0)=>{A.heading=h;G.state='chase';G.hp=1000;G.heading=0;G.pos.x=A.pos.x+dx;G.pos.y=A.pos.y+dy;G.pos.z=A.pos.z+dz;
  const hp=G.hp;if(W)T.wpnHitShapes(A,W,5,'test');else T.hitGoblins(A.pos.x+Math.sin(h)*T.WEAPONS.club.reach,A.pos.z+Math.cos(h)*T.WEAPONS.club.reach,T.WEAPONS.club.r,5,'test',A.pos.y);
  const r=G.hp<hp;G.state='wait';G.hp=0;return r;};
const club=T.WEAPONS.club;
console.log('club has hitboxes of its own',!!(club.hit&&club.hit.hitboxes),'| none: wpnHitShapes leaves it to the old hit',T.wpnHitShapes(A,{},5,'x')===false);
// (the built-in hit copied as a capsule: how often it agrees with the old circle over a grid round Gnash)
const cap={hit:{hitboxes:[{k:'capsule',p:[0,0.25,club.reach],r:club.r,h:5.5}]}};
{let same=0,n=0,both=0,onlyNew=0,onlyOld=0;for(let x=-3;x<=3;x+=0.25)for(let z=-3;z<=4;z+=0.25){const a=hitAt(null,x,z),b=hitAt(cap,x,z);n++;if(a===b)same++;if(a&&b)both++;else if(b)onlyNew++;else if(a)onlyOld++;}
  console.log('built-in hit as a capsule against the old circle: agree',same+'/'+n,'| both hit',both,'| only the capsule (its goblin has a body)',onlyNew,'| only the circle',onlyOld);}
console.log('capsule: ahead',hitAt(cap,0,1.1),'| behind',hitAt(cap,0,-1.5),'| far ahead',hitAt(cap,0,3.5),'| turned to face +x, goblin at +x',hitAt(cap,1.1,0,0,Math.PI/2),'| turned, goblin still ahead of where he faced',hitAt(cap,0,1.1,0,Math.PI/2));
const side={hit:{hitboxes:[{k:'box',p:[0.8,0.6,0.6],s:[0.6,1.2,0.6]}]}};
console.log('box out to his +x side: there',hitAt(side,0.8,0.6),'| the other side',hitAt(side,-0.8,0.6),'| straight ahead',hitAt(side,0,1.2));
const tilt={hit:{hitboxes:[{k:'capsule',p:[0,0.6,0.8],r:0.15,h:1.6,rot:[0,0,Math.PI/2]}]}};
console.log('a sweep across, tilted on its side: at its left end',hitAt(tilt,-0.75,0.8),'| right end',hitAt(tilt,0.75,0.8),'| standing up (no tilt) the ends miss',hitAt({hit:{hitboxes:[{k:'capsule',p:[0,0.6,0.8],r:0.15,h:1.6}]}},0.75,0.8));
console.log('above his head: a goblin on a ledge 1.5 up',hitAt({hit:{hitboxes:[{k:'sphere',p:[0,2,0.8],r:0.4}]}},0,0.8,1.5),'| on the ground under it',hitAt({hit:{hitboxes:[{k:'sphere',p:[0,2,0.8],r:0.4}]}},0,0.8,0));
// (a swing in time: a katana with a capsule along its blade, following the hand, live on part of the blow. The swing is
// stepped as the game steps it (biteT counting down, wpnHitSweep each frame) and the goblin is hit only while the
// capsule's live and touching it, once a swing)
{const K=T.WEAPONS.katana,old=K.hit,P=K.player;A.gob=true;A.wpns=['club','katana'];A.wpn='katana';A.state='walk';
  const swing=(span,dx,dz,dt=1/60)=>{K.hit={hitboxes:[{k:'capsule',on:'hand',p:[0,0,0.55],r:0.15,h:0.9,rot:[1.5708,0,0],t:span}]};
    A.heading=0;G.state='chase';G.hp=1000;G.heading=Math.PI;G.pos.x=A.pos.x+dx;G.pos.y=A.pos.y;G.pos.z=A.pos.z+dz;
    A.biteDur=P.dur;A.biteT=P.dur;A.lungeT=P.lunge;A.hsOn=false;let first=null,n=0,hp=G.hp;
    while(A.biteT>0){T.wpnHitSweep(A);if(G.hp<hp){n++;hp=G.hp;if(first===null)first=+T.gobSwingU(A).toFixed(2);}A.biteT-=dt;A.lungeT-=dt;}
    T.wpnHitSweep(A);G.state='wait';G.hp=0;return n?'hit at u '+first+(n>1?' ('+n+' times!)':''):'missed';};
  console.log('a swing in time: live as it lands, goblin ahead',swing([0.85,1.1],0,0.9),'| well behind',swing([0.85,1.1],0,-2),'| live only in the wind-up',swing([0.05,0.3],0,0.9),
    '| a short span at 60 fps',swing([1.02,1.06],0,0.9),'| and at 15 fps (stepped over, still counted)',swing([1.02,1.06],0,0.9,1/15),'| live all through: hit once',swing([0,2],0,0.9));
  const h0=T.hitHand('katana',0.2),h1=T.hitHand('katana',1);console.log('the hand moves with the blow: wind-up',h0.o.map(v=>+v.toFixed(2)).join(','),'| landing',h1.o.map(v=>+v.toFixed(2)).join(','));
  K.hit=old;}
// ---- the live preview ----
{const f=JSON.parse(fs.readFileSync(path.join(AS,'weapons','dagger.json'),'utf8'));const same=T.WEAPONS.dagger,gw=T.GOB_WPN.dagger,dmg0=same.dmg;
  f.model.boxes[0].s=[0.5,0.5,0.5];f.dmg=dmg0+7;   // (the shared model, which held uses)
  console.log('live weapon:',T.liveWeapon('dagger',f),'| same entry kept',T.WEAPONS.dagger===same,'| new shape',T.WEAPONS.dagger.model.held[0][0]===0.5,'| new damage reaches Gnash',T.GOB_WPN.dagger===gw&&T.GOB_WPN.dagger.dmg===dmg0+7,'| unknown weapon:',T.liveWeapon('nope',f));
  const back=JSON.parse(fs.readFileSync(path.join(AS,'weapons','dagger.json'),'utf8'));T.liveWeapon('dagger',back);console.log('put back: damage',T.GOB_WPN.dagger.dmg===dmg0);
  const c=JSON.parse(fs.readFileSync(path.join(AS,'clips','club.json'),'utf8'));c.tracks.arm[1][1]=-2;console.log('live clip:',T.liveClip('club',c),'| in the table',T.STRIKES.club[0][1][1]===-2);}
  {const f=JSON.parse(fs.readFileSync(path.join(AS,'props','bed.json'),'utf8')),n0=T.PROPS.bed.length;f.boxes.push({s:[0.2,0.2,0.2],p:[0,1,0],c:'#ff0000',glow:true});
    const r=T.liveProp('bed',f);console.log('live prop:',r,'| a box more',T.PROPS.bed.length===n0+1,'| glows',T.PROPS.bed[n0][0]===0x1000000+0xff0000,'| dressing redrawn',T.trafficRefreshT===0,'| unknown prop',T.liveProp('nosuch',f)!=='ok');
    const g=JSON.parse(fs.readFileSync(path.join(AS,'fixtures','lamp.json'),'utf8'));g.boxes[1].s[1]=9;console.log('live fixture:',T.liveFix('lamp',g),'| taller post',T.FIXM.lamp.boxes[1][5]===9);}
// (the light vehicles: their files are the game's table as they are, a vehicle's parts in order, and a live edit to one
// and to its rider's clip)
{const vd=[];for(const k in T.ASSETS.vehicles){const f=JSON.parse(fs.readFileSync(path.join(AS,'vehicles',k+'.json'),'utf8'));delete f.note;if(JSON.stringify(f)!==JSON.stringify(T.ASSETS.vehicles[k]))vd.push(k);}
  const rc=Object.keys(T.ASSETS.clips).filter(k=>T.ASSETS.clips[k].layout==='rider');
  const P=T.assetVehParts(T.ASSETS.vehicles.bicycle),order=P.parts.every((q,i)=>!q.par||P.parts.findIndex(x=>x.n===q.par)<i);
  console.log('vehicles',Object.keys(T.ASSETS.vehicles).join(','),vd.length?'differ '+vd.join(','):'same as their files','| rider clips',rc.join(','),'| each one has its clip',Object.values(T.ASSETS.vehicles).every(v=>rc.includes(v.clip)),'| parts after their parents',order);
  const f=JSON.parse(fs.readFileSync(path.join(AS,'vehicles','kick.json'),'utf8')),n0=f.boxes.length;f.boxes.push({s:[0.3,0.3,0.3],p:[0,1,0],c:'#ff0000'});
  console.log('live vehicle:',T.liveVeh('kick',f),'| a box more',T.ASSETS.vehicles.kick.boxes.length===n0+1,'| unknown',T.liveVeh('nosuch',f)!=='ok');
  const c=JSON.parse(fs.readFileSync(path.join(AS,'clips','rdKick.json'),'utf8'));c.tracks.legR[0][1]=-2;console.log('live rider clip:',T.liveClip('rdKick',c),'| in the table',T.ASSETS.clips.rdKick.tracks.legR[0][1]===-2,'| not in STRIKES',!T.STRIKES.rdKick);
  T.liveVeh('kick',JSON.parse(fs.readFileSync(path.join(AS,'vehicles','kick.json'),'utf8')));T.liveClip('rdKick',JSON.parse(fs.readFileSync(path.join(AS,'clips','rdKick.json'),'utf8')));}
// (the props and fixtures the game has against their files: every prop's colours and boxes, each fixture's boxes and spots)
{const pd=[],fd=[];for(const k in T.ASSETS.props){const a=T.assetProp(T.ASSETS.props[k]);if(k!=='bed'&&(T.PROPS[k].length!==a.length||T.PROPS[k].some((q,i)=>q[0]!==a[i][0])))pd.push(k);}
  for(const k in T.ASSETS.fixtures)if(k!=='lamp'&&JSON.stringify(T.FIXM[k])!==JSON.stringify(T.assetFix(T.ASSETS.fixtures[k])))fd.push(k);
  console.log('props in the game',Object.keys(T.PROPS).length,'from files',Object.keys(T.ASSETS.props).length,pd.length?'differ '+pd.join(','):'same','| fixtures',Object.keys(T.FIXM).join(','),fd.length?'differ '+fd.join(','):'same');}
// (the hippos' clips: in HCLIP and not STRIKES, hipAt against the sums they were made from (move.js before them), and one
// edited live)
{const n=Object.keys(T.HCLIP),sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};let w=0;
  for(let i=0;i<=200;i++){const k=i/200,H=T.hipAt('hipBite1',2*k),open=sm(k/0.6),shut=sm((k-0.69)/0.1),jab=Math.exp(-Math.pow((k-0.79)/0.07,2));
    w=Math.max(w,Math.abs(H[T.HC.jaw]-open*(1-shut)),Math.abs(H[T.HC.head]-(0.1*open*(1-shut)-0.16*jab)));
    const C=T.hipAt('hipCrash',2*k),e=k*0.5,k0=e<0.05?e/0.05:e<0.2?1:Math.max(0,1-(e-0.2)/0.3),q=k0*k0*(3-2*k0);w=Math.max(w,Math.abs(C[T.HC.outFR]+1.05*q),Math.abs(C[T.HC.lift]+0.42*q));}
  const f=JSON.parse(fs.readFileSync(path.join(AS,'clips','hipKnock.json'),'utf8'));f.tracks.pitch=[[0,0],[1,-1]];T.liveClip('hipKnock',f);const p1=T.hipAt('hipKnock',1)[T.HC.pitch];
  T.liveClip('hipKnock',JSON.parse(fs.readFileSync(path.join(AS,'clips','hipKnock.json'),'utf8')));
  console.log('hippo clips',n.length,'| in STRIKES',n.filter(k=>T.STRIKES[k]).length,'| worst against the old sums',w.toFixed(4),'| live edit',p1,'| put back',T.hipAt('hipKnock',1)[T.HC.pitch].toFixed(3));}
// (the hippos' moves: the game's tables from their files, a move edited live, and a recording for the editor's Hippo tab)
{const D=T.assetMovesAll(T.ASSETS);let same=JSON.stringify(D)===JSON.stringify(T.DEV_ABIL);for(const m of D)for(const [pk,,v] of m.ps)if(T.AB[m.k][pk]!==v)same=false;
  console.log('moves in the game',T.DEV_ABIL.length,'from files',D.length,same?'same':'DIFFERENT','| custom hitboxes',Object.keys(T.HB).length);
  const f=JSON.parse(fs.readFileSync(path.join(AS,'moves','stomp1.json'),'utf8')),A=T.AB.stomp1;f.params.dmg.v=33;
  const R0=T.liveRecord('stomp1');
  f.hitboxes={on:true,boxes:[{kind:'dmg',shape:'sphere',bone:'root',r:2,len:3,fwd:2,up:1,side:0,a:0,b:5,dmg:9,carDmg:9}]};
  console.log('live move:',T.liveMove('stomp1',f),'| same entry',T.AB.stomp1===A,'| damage',A.dmg,'| hitboxes on',!!(T.HB.stomp1&&T.HB.stomp1.on),'| unknown',T.liveMove('nope',f));
  const R=T.liveRecord('stomp1'),m=R.model;
  console.log('recording: frames',R.N,'parts',m.length,'boxes',m.filter(q=>q.g).length,'named',m.filter(q=>q.n).map(q=>q.n).join(','),'| root at',R.tr[0].toFixed(2),R.tr[2].toFixed(2),
    '| hits built-in',R0.hits.length,'custom',R.hits.filter(h=>h.src===0).length,'lines',R.hits.every(h=>h.L.length>0&&h.L.length%6===0),'| near him',R.hits.every(h=>Math.abs(h.L[0])<20&&Math.abs(h.L[2])<20),'| anchors',R.anchors.join(','));
  const back=JSON.parse(fs.readFileSync(path.join(AS,'moves','stomp1.json'),'utf8'));T.liveMove('stomp1',back);console.log('put back: damage',A.dmg,'| hitboxes',!!T.HB.stomp1);}
S(5);console.log('frames after: ok');
// (the editor's own scripts: one that doesn't parse leaves the whole editor stuck on Loading, with no tabs)
{const ED=path.join(__dirname,'..','editor'),bad=[];for(const f of fs.readdirSync(ED).filter(f=>f.endsWith('.js'))){try{new Function(fs.readFileSync(path.join(ED,f),'utf8'));}catch(e){bad.push(f+': '+e.message);}}
  console.log('editor scripts parse:',bad.length?bad.join('; '):'all');}
