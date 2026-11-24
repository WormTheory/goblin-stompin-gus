// terr: territories (world/territories.js). For a seed (each in a process of its own): how long the tiles take, a hash of
// every cell's owner over a square of tiles (worked out twice, in two orders, and again after clearing), how many places
// each territory has (every one should have two or more where the land allows), their names (none a place's, none twice)
// and kinds of rule; that the world itself (chunks, places, their names) is the same whatever the territory settings;
// and that a world saved with territory settings, loaded again (as a guest gets the host's world), has the same territories.
// Usage: node terr.js [seeds, default 1,2,3]   (CFG='{"ter":2}' to look at other settings)
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs'),cp=require('child_process');
const WS=process.env.WSEED;
if(WS===undefined){
  const seeds=(process.argv[2]||'1,2,3').split(',').map(Number);
  for(const s of seeds)process.stdout.write(cp.execFileSync(process.execPath,[__filename],{env:Object.assign({},process.env,{WSEED:String(s)}),encoding:'utf8',maxBuffer:1<<26}));
  process.exit(0);
}
let src0=fs.readFileSync('g.js','utf8');
const NAMES=['genChunk','seed','CS','CELL','SET_SP','WORLD_CFG','WORLD_DEF','worldCfgSet','worldCfgSent','saveObj','save','load','seaV','SEA_T','settlementLat','settlementAt','setName','terSt','terTile','terCell','terAt','terOfSet','terInfo','terClear','terWarm','terPeekCell','TER_N','TER_SOV','clearWorld'];
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={};'+NAMES.map(n=>`try{if(typeof ${n}!=='undefined')window.__t.${n}=${n};}catch(e){}`).join('')+'\n})();');
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
// (a fresh world with this seed, as the World Generator hands one over)
const LS=new Map();{const SK=src0.match(/SAVE_KEY='([^']+)'/)[1],GEN=+src0.match(/WORLD_GEN=(\d+)/)[1];LS.set(SK,JSON.stringify(Object.assign({seed:+WS,gen:GEN,edits:{},coll:{},down:[],dest:{},test:[]},process.env.CFG?{cfg:JSON.parse(process.env.CFG)}:{})));}
global.localStorage={getItem:k=>LS.has(k)?LS.get(k):null,setItem(k,v){LS.set(k,String(v))},removeItem:k=>LS.delete(k),key:i=>[...LS.keys()][i]??null,get length(){return LS.size}};
global.requestAnimationFrame=()=>{};
Object.defineProperty(global,'navigator',{value:{getGamepads:()=>[]},configurable:true});
eval(src);const T=window.__t;
const fnv=(h,b)=>Math.imul(h^b,16777619)>>>0;
const hashStr=(h,s)=>{for(let i=0;i<s.length;i++)h=fnv(h,s.charCodeAt(i));return h;};
const hx=h=>h.toString(16).padStart(8,'0');
console.log('== seed '+T.seed+(T.seed===+WS?'':' (WANTED '+WS+')')+' cfg '+JSON.stringify(T.worldCfgSent()||{}));
const R=+(process.env.R||3);   // (tiles each way round the start's)
// every cell's owner over the square, in the order given
function ownHash(order){let h=2166136261;const L={};
  for(const [tx,tz] of order){const t=T.terTile(tx,tz);L[tx+','+tz]=t;}
  for(let tx=-R;tx<=R;tx++)for(let tz=-R;tz<=R;tz++){const t=L[tx+','+tz];for(let q=0;q<t.lab.length;q++)h=hashStr(h,t.lab[q]===255?'-':t.ids[t.lab[q]]);}
  return hx(h);}
const sq=[];for(let tx=-R;tx<=R;tx++)for(let tz=-R;tz<=R;tz++)sq.push([tx,tz]);
let t0=Date.now();T.terTile(0,0);const tFirst=Date.now()-t0;
t0=Date.now();const h1=ownHash(sq);const tAll=Date.now()-t0;
const St=T.terSt();console.log(`tile ${St.TP.toFixed(1)} grid points (${Math.round(St.TT*T.CELL)} blocks) across, cells ${Math.round(St.cs*T.CELL)} blocks; first tile ${tFirst} ms, ${sq.length} tiles ${tAll} ms (${(tAll/sq.length).toFixed(0)} ms each)`);
const h2=ownHash(sq.slice().reverse());T.terClear();const h3=ownHash(sq.slice().reverse());T.terClear();
// (and worked out from the outside in, warming a little at a time as the game does)
for(const [tx,tz] of sq){const N=T.TER_N,cs=T.terSt().cs,px=(tx+0.5)*N*cs,pz=(tz+0.5)*N*cs;let g=0;while(T.terWarm(px,pz,2)===undefined&&g<5000)g++;}
const h4=ownHash(sq);
console.log(`owners ${h1}; again reversed ${h2}, after clearing ${h3}, warmed bit by bit ${h4}: ${h1===h2&&h2===h3&&h3===h4?'same':'DIFFERENT'}`);
// ---- the places in each territory (capitals in the inner square, places counted further out so all of each is in) ----
const by=new Map(),SP=T.SET_SP,TP=St.TP;let alive=0;
const G0=Math.floor(-(R+1)*TP),G1=Math.ceil((R+2)*TP);
for(let rx=G0;rx<=G1;rx++)for(let rz=G0;rz<=G1;rz++){const S=T.settlementLat(rx,rz);if(S.none||T.seaV(S.cx+0.5,S.cz+0.5)>T.SEA_T)continue;alive++;
  const id=T.terOfSet(S);if(!id)continue;if(!by.has(id))by.set(id,[]);by.get(id).push(S);}
const inner=[...by.keys()].filter(id=>{const [a,b]=id.split(',').map(Number);return Math.abs(a)<R&&Math.abs(b)<R;});
const counts=inner.map(id=>by.get(id).length).sort((a,b)=>a-b),one=inner.filter(id=>by.get(id).length<2);
console.log(`territories ${inner.length} (capitals within ${R-1} tiles): places each min ${counts[0]} median ${counts[counts.length>>1]} max ${counts[counts.length-1]}; with fewer than 2: ${one.length}${one.length?' ('+one.map(id=>{const I=T.terInfo(id);return I.title+' at '+I.cap.cx+','+I.cap.cz+(T.settlementLat(I.cap.rx+1,I.cap.rz).none?'':'')}).join('; ')+')':''}`);
{const own=new Set();for(const id of inner)for(const S of by.get(id))if(T.terOfSet(S)!==id)own.add(S);console.log('every place in its own territory:',own.size?own.size+' NOT':'yes');}
{const caps=inner.filter(id=>T.terOfSet(T.terInfo(id).cap)===id).length;console.log(`capitals in their own territory: ${caps}/${inner.length}`);}
// ---- names and kinds of rule ----
{const names=new Map(),sets=new Set(),kinds={};let clash=0,dup=0;
  // (a place's name: any place within two tiles of the territory's own)
  const near=id=>{const [a,b]=id.split(',').map(Number),o=new Set();for(let rx=Math.floor((a-2)*TP);rx<=Math.ceil((a+3)*TP);rx++)for(let rz=Math.floor((b-2)*TP);rz<=Math.ceil((b+3)*TP);rz++){const S=T.settlementLat(rx,rz);if(!S.none)o.add(T.setName(S));}return o;};
  for(const id of by.keys()){const I=T.terInfo(id);if(near(id).has(I.name))clash++;if(names.has(I.name)&&names.get(I.name)!==id)dup++;names.set(I.name,id);kinds[I.sov]=(kinds[I.sov]||0)+1;}
  console.log(`names: ${names.size}, the same as a place's nearby ${clash}, the same as another territory's ${dup}`);
  console.log('kinds:',Object.entries(kinds).sort((a,b)=>b[1]-a[1]).map(([k,n])=>k+' '+n).join(', '));
  console.log('e.g.',inner.slice(0,6).map(id=>{const I=T.terInfo(id);return `${I.title} (capital ${T.setName(I.cap)}, ${by.get(id).length} places)`;}).join('; '));}
// ---- the world doesn't change with the territories' settings: chunks, places and their names ----
function worldHash(){let h=2166136261;for(const [cx,cz] of [[0,0],[3,-2],[-20,9],[40,-33],[150,150]]){const a=T.genChunk(cx,cz);for(let i=0;i<a.length;i+=7)h=fnv(h,a[i]);}
  for(let rx=-6;rx<=6;rx++)for(let rz=-6;rz<=6;rz++){const S=T.settlementLat(rx,rz);h=hashStr(h,S.type+S.cx+','+S.cz+S.R+(S.none?'x':'')+T.setName(S));}return hx(h);}
{const cfg0=Object.assign({},T.worldCfgSent()||{}),w0=worldHash();
  T.worldCfgSet(Object.assign({},cfg0,{ter:2.2,tvar:0.3}));T.clearWorld();const w1=worldHash(),hb=ownHash(sq);
  T.worldCfgSet(cfg0);T.clearWorld();const w2=worldHash();
  console.log(`world with these settings ${w0}, with ter 2.2 tvar 0.3 ${w1}, back ${w2}: ${w0===w1&&w1===w2?'same':'DIFFERENT'}; territories then ${hb} (${hb===h1?'SAME AS BEFORE?':'different, as they should be'})`);}
// ---- saved with territory settings and loaded again (a guest builds the host's world from that save) ----
{const cfg={ter:1.7,tvar:0.4};T.worldCfgSet(cfg);const ha=ownHash(sq),sent=JSON.stringify(T.worldCfgSent());T.save&&T.save();
  const text=JSON.stringify(T.saveObj());T.worldCfgSet(null);const hd=ownHash(sq);
  // (the host's save text, as a guest gets it, into a fresh store, loaded)
  const SK=src0.match(/SAVE_KEY='([^']+)'/)[1];LS.set(SK,text);const ok=T.load();const hb=ownHash(sq);
  console.log(`saved cfg ${sent}; loaded ${ok?'ok':'FAILED'} cfg ${JSON.stringify(T.worldCfgSent())}: territories ${ha} -> ${hb} ${ha===hb?'same':'DIFFERENT'} (defaults meanwhile ${hd})`);
  LS.set(SK,JSON.stringify({seed:T.seed,edits:{}}));T.worldCfgSet(null);T.load();console.log('an old save with no cfg loads with the defaults:',T.WORLD_CFG.ter===1&&T.WORLD_CFG.tvar===1?'yes':'NO');}
