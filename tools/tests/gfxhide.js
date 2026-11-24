let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={DBG_HIDE,activeProps,activeFix,propCells,propCK,streetFurn,refreshFixtures,knockFixtures,knockFix,downFix,falling,goblins,FIX_BAR,cars,realmOf,get score(){return score},players,keys,frame,get,solidAt,DT,DBG_ITEMS,dbgItems,dbgMenuNav,dbgMenuToggle,dbgVal,GFX_OFF,toggleGfx,gfxArr,chunkArr,meshes,buildChunk,sewerStreet,caveMouth,metroOf,settlementLat,settlementAt,setRaw,CS,CELL,G,SEW0,SUB_F,AIR,BRICK,WATER,li,PROP_L,PROP_G};\n})();');
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
const [A]=T.players;const S=n=>{for(let i=0;i<n;i++){now+=16.7;T.frame(now);}};for(const f of els.play.L.click)f();pads.length=0;S(5);
// The debug Rendering switches: caves, sewers and subways stop being drawn, with the world itself left alone. Each kind:
// the open space and tunnel blocks in the chunks round one real example, with the switch on and off.
const {CS,CELL,G,SEW0,SUB_F,AIR,BRICK,GFX_OFF}=T;
const chunksOf=(px,pz)=>{const a=[];for(let x=px*CELL-CS;x<(px+1)*CELL+CS;x+=CS)for(let z=pz*CELL-CS;z<(pz+1)*CELL+CS;z+=CS)a.push([Math.floor(x/CS),Math.floor(z/CS)]);return a;};
// (open cells from y0 to y1, and how many of the real world's blocks changed anywhere in those chunks)
const open=(arrs,y0,y1)=>{let n=0;for(const a of arrs)for(let y=y0;y<=y1;y++)for(let i=0;i<CS*CS;i++)if(a[y*CS*CS+i]===AIR)n++;return n;};
const real=L=>L.map(([x,z])=>T.chunkArr(x,z));
const drawn=L=>L.map(([x,z])=>T.gfxArr(x,z));
function report(name,key,g,px,pz,y0,y1){
  const L=chunksOf(px,pz),r=real(L).map(a=>a.slice());
  const before=open(drawn(L),y0,y1);GFX_OFF[g]=true;const v=drawn(L),after=open(v,y0,y1);
  let diff=0;v.forEach((a,i)=>{for(let j=0;j<a.length;j++)if(a[j]!==r[i][j])diff++;});
  let same=0;real(L).forEach((a,i)=>{for(let j=0;j<a.length;j++)if(a[j]!==r[i][j])same++;});
  GFX_OFF[g]=false;
  console.log(name,'at plot',px,pz,': open cells drawn on',before,'off',after,'| cells drawn differently',diff,'| real blocks changed',same);
}
const R=60;let st=null,mo=null,me=null;
for(let d=0;d<R&&!(st&&mo);d++)for(let a=-d;a<=d;a++)for(let b=-d;b<=d;b++){if(Math.max(Math.abs(a),Math.abs(b))!==d)continue;
  if(!st&&T.sewerStreet(a,b))st=[a,b];if(!mo&&T.caveMouth(a,b))mo=[a,b];}
for(let a=-6;a<=6&&!me;a++)for(let b=-6;b<=6&&!me;b++){const M=T.metroOf(T.settlementLat(a,b));if(M&&M.stations.length)me=M.stations[0];}
if(st)report('sewers ','gSewers','sewers',st[0],st[1],SEW0,G);else console.log('no sewer found');
if(mo)report('caves  ','gCaves','caves',mo[0],mo[1],G-21,G);else console.log('no cave mouth found');
if(me)report('subways','gSubway','subway',me.px,me.pz,SUB_F,G);else console.log('no subway station found');
// a crater stays a crater: smash a hole in the street over a sewer and it's still drawn as a hole
if(st){const x=st[0]*CELL+3,z=st[1]*CELL+20,cx=Math.floor(x/CS),cz=Math.floor(z/CS),li=(y)=>T.li(((x%CS)+CS)%CS,y,((z%CS)+CS)%CS);
  T.setRaw(x,G,z,AIR);T.setRaw(x,G-1,z,AIR);GFX_OFF.sewers=true;const a=T.gfxArr(cx,cz);
  console.log('crater with sewers off: street',a[li(G)],'brick below',a[li(G-1)],'(both 0 is a hole), sewer space below that is solid',a[li(SEW0+3)]!==AIR);GFX_OFF.sewers=false;}
// the rows shown before anyone picks their own (Show / hide): left and right pass over the columns left empty
{const L=T.dbgItems(),nav=(dy,dx)=>{T.DT.navDir='';T.dbgMenuNav('kbd',dy,dx,0);T.DT.navDir='';return T.dbgItems()[T.DT.cur];};
 console.log('shown at first',L.length,'of',T.DBG_ITEMS.filter(o=>!o.act).length,':',L.map(o=>o.k).join(','));
 T.DT.cur=L.findIndex(o=>o.k==='fps');const r=nav(0,1).k,l=(T.DT.cur=L.findIndex(o=>o.k==='speed'),nav(0,-1).k);console.log('right from FPS counter goes to',r,', left from Game speed to',l);
 T.DBG_HIDE.clear();}
// the switches themselves, and a chunk redrawn with each off
for(const it of T.DBG_ITEMS.filter(it=>it.sec==='Rendering')){const was=T.dbgVal(it.k);T.DT.cur=T.dbgItems().indexOf(it);T.dbgMenuToggle();console.log(it.label,'switch:',was,'->',T.dbgVal(it.k));S(60);T.dbgMenuToggle();}
S(60);
console.log('props meshes visible after switching back',T.PROP_L.visible,T.PROP_G.visible);
// the menu: every row reachable, up/down within a column, left/right across on a plain row, adjusting on a slider
{const L=T.dbgItems(),byC=[0,1,2,3].map(c=>L.filter(o=>o.c===c).map(o=>o.k));console.log('columns',JSON.stringify(byC));
 const nav=(dy,dx)=>{T.DT.navDir='';T.dbgMenuNav('kbd',dy,dx,0);T.DT.navDir='';return T.dbgItems()[T.DT.cur];};
 const seen=new Set();T.DT.cur=0;const s0=T.DT.speedI,c0=T.DT.curve,p0=T.DT.psI;for(let i=0;i<400;i++){const it=nav(i%5===4?0:1,i%5===4?1:0);seen.add(it.k);}T.DT.speedI=s0;T.DT.curve=c0;T.DT.psI=p0;
 console.log('rows reached by walking the menu',seen.size,'of',L.length);
 T.DT.cur=L.findIndex(o=>o.k==='paused');console.log('right from Stop time goes to',nav(0,1).k,', then left back to',nav(0,-1).k);
 T.DT.cur=L.findIndex(o=>o.k==='speed');const s1=T.DT.speedI;console.log('left on Game speed, not picked: goes to',nav(0,-1).k,'and speed index stays',s1,'->',T.DT.speedI);
 T.DT.cur=L.findIndex(o=>o.k==='speed');T.dbgMenuToggle();console.log('picked with A:',T.DT.edit,'; then left: stays on',nav(0,-1).k,'speed index',s1,'->',T.DT.speedI,'; A again lets go:',(T.dbgMenuToggle(),T.DT.edit),'; picked again, then down lets go:',(T.dbgMenuToggle(),nav(1,0).k),T.DT.edit);T.DT.speedI=s1;}
// the Enemy hostility slider: picked with A, then left and right step it, Normal, Peaceful, Passive, and no further
{const L=T.dbgItems(),nav=(dy,dx)=>{T.DT.navDir='';T.dbgMenuNav('kbd',dy,dx,0);T.DT.navDir='';};
 T.DT.cur=L.findIndex(o=>o.k==='host');const h0=T.DT.host,seen=[T.dbgVal('host')];nav(0,-1);const unpicked=T.dbgItems()[T.DT.cur].k;
 T.DT.cur=L.findIndex(o=>o.k==='host');T.dbgMenuToggle();for(let i=0;i<3;i++){nav(0,-1);seen.push(T.dbgVal('host'));}nav(0,1);seen.push(T.dbgVal('host'));T.dbgMenuToggle();
 console.log('hostility: left, not picked, goes to',unpicked,'; picked, left x3 then right:',seen.join(' > '),'; stored',T.DT.host);T.DT.host=h0;}
// benches and litter bins are props now: drawn and listed as props, and goblins go round them, out to the lamp posts' distance
{T.refreshFixtures();const str=T.activeProps.filter(f=>f.type==='parkbench'||f.type==='litterbin'),old=T.activeFix.filter(f=>f.type==='bench'||f.type==='bin');
 const far=str.reduce((m,f)=>Math.max(m,Math.max(Math.abs(f.x-A.pos.x),Math.abs(f.z-A.pos.z))),0);
 console.log('street props',str.filter(f=>f.type==='parkbench').length,'benches',str.filter(f=>f.type==='litterbin').length,'bins, furthest',far.toFixed(0),'blocks; still old fixtures',old.length,'; also listed for traffic',str.filter(f=>T.activeFix.includes(f)).length);
 const b=str.find(f=>f.type==='parkbench');if(b){console.log('bench: all three of its cells block goblins',[-1,0,1].every(e=>T.propCells.get(T.propCK(b.x+Math.cos(b.yaw)*.9*e,b.y0,b.z-Math.sin(b.yaw)*.9*e))===b));
   const s0=T.score,n=T.knockFixtures(b.x,b.z,1.1,1,0);console.log('a car hitting it: knocked',n,'score +',T.score-s0);S(60);T.refreshFixtures();console.log('down after falling',T.downFix.has(b.key),' still blocks goblins',T.propCells.get(T.propCK(b.x,b.y0,b.z))===b);}
 // how long street furniture lasts with nobody touching it: goblins held up by it shove it over
 S(60*60);T.refreshFixtures();const all=T.activeProps.filter(f=>f.type==='parkbench'||f.type==='litterbin');
 console.log('after a minute of goblins walking about:',all.filter(f=>T.downFix.has(f.key)).length,'of',all.length,'street props down; goblins',T.goblins.length);}
// the Interface switches: one at a time, and the whole display
{const css=()=>els.uiOff.textContent,rows=T.DBG_ITEMS.filter(it=>it.sec==='Interface');
 const tog=k=>{T.DT.cur=T.dbgItems().findIndex(o=>o.k===k);T.dbgMenuToggle();};
 let ok=0;for(const it of rows.slice(1)){const on0=T.dbgVal(it.k);tog(it.k);const hid=css().includes('{display:none');tog(it.k);if(on0&&hid&&T.dbgVal(it.k)&&!css())ok++;}
 console.log('interface rows',rows.length,'each hides and comes back',ok,'of',rows.length-1);
 tog('uiAll');console.log('whole display off:',css().split('}').length-1,'rules, row says',T.dbgVal('uiAll'));tog('uiMini');console.log('one back on: row says',T.dbgVal('uiAll'),'rules',css().split('}').length-1);tog('uiAll');console.log('all off again, rules',css().split('}').length-1);tog('uiAll');console.log('all on again, css empty',css()==='');}
// the Show / hide tab's Show all and Hide all
{const L0=T.dbgItems().length;T.DT.tab=1;const L=T.dbgItems(),row=k=>{T.DT.cur=T.dbgItems().findIndex(o=>o.k===k);T.dbgMenuToggle();};
 console.log('Show / hide tab first rows:',L.slice(0,2).map(o=>o.label).join(', '),'| on the main tab too:',T.DBG_ITEMS.filter(o=>o.act).some(o=>{T.DT.tab=0;const r=T.dbgItems().includes(o);T.DT.tab=1;return r;}));
 row('_none');T.DT.tab=0;const n0=T.dbgItems().length;T.DT.tab=1;row('_all');T.DT.tab=0;console.log('main tab rows: before',L0,'after Hide all',n0,'after Show all',T.dbgItems().length);}
process.exit(0);
