let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
const fs=require('fs');
let src0=fs.readFileSync('g.js','utf8');
let src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={get,setRaw,addEdit,editAt,chunks,CS,G,H,WATER,AIR,STONE,SAND,GLASS,NET,players,frame,ckey,wfAct,wfPark,wfRemoved,wfSrc,wfAmt,bkey,updateWater,WF_STEP,wfEndless,wfPress,WF_LV,WATER_L,DOOR_G,cars,CAR_FLOAT_T,carPhysics,WX,freezeWorld,chunkFreeze,ICE_L,ICE,wadeDepth};\n})();');
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
eval(src);const T=window.__t;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
// Water flow (destruction/water-flow.js): finite water in eighths. Knock out a block under or beside water and it pours in;
// what comes out of a tank is taken from it, the sea never goes down, a flood spreads thin and stops. Prints each case.
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;run(1);
const {G,WATER:W,AIR,STONE,GLASS}=T;
const dig=(x,y,z)=>{T.setRaw(x,y,z,AIR);T.addEdit(x,y,z,AIR);};   // (as a smash does it)
const put=(x,y,z,b)=>{T.setRaw(x,y,z,b);T.addEdit(x,y,z,b);};
const lvAt=(x,y,z)=>{const b=T.get(x,y,z);return T.WF_LV[b]>0?T.WF_LV[b]:0;};
// (in 64ths, as the flow keeps it: eighths x 8, or what it's left between them)
const amtAt=(x,y,z)=>{const l=lvAt(x,y,z);if(!l)return 0;const m=T.wfAmt.get(T.bkey(x,y,z));return m!==undefined&&Math.max(1,Math.min(8,m+4>>3))===l?m:l*8;};
const units=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)n+=amtAt(x,y,z);return n;};   // (64ths)
const count=(x0,x1,y0,y1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(T.get(x,y,z)===W)n++;return n;};
const busy=()=>T.wfAct.size||T.wfRemoved.length||T.wfPark.size;
const settle=(max=6000)=>{let i=0;for(;i<max&&busy();i++)T.updateWater(T.WF_STEP);return i;};
let errs=0;const ok=(c,what)=>{if(!c){errs++;console.log('FAIL',what);}};
// 1. the sea: find a column of deep water and the sea bed under it
let sx=null,sz,bed;
for(let r=0;r<6000&&sx===null;r+=37)for(const [x,z] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]]){
  if(T.get(x,G,z)!==W||T.get(x,G-3,z)!==W)continue;let y=G;while(T.get(x,y,z)===W)y--;sx=x;sz=z;bed=y;break;}
if(sx===null){console.log('no sea found');process.exit(0);}
A.pos.set(sx+0.5,G+3,sz+0.5);run(1);
const room=(x0,y0,z0,w,h)=>{for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+w;z++)for(let y=y0;y<y0+h;y++)dig(x,y,z);};
const seaU0=units(sx-2,sx+2,bed+1,G,sz-2,sz+2);
dig(sx,bed,sz);dig(sx,bed-1,sz);dig(sx,bed-2,sz);
let t=0;while(t<5&&T.get(sx,bed-2,sz)!==W){T.updateWater(T.WF_STEP);t+=T.WF_STEP;}settle();
console.log('sea shaft: full',count(sx,sx,bed-2,bed,sz,sz),'of 3 in',t.toFixed(1)+'s | sea round it still',units(sx-2,sx+2,bed+1,G,sz-2,sz+2),'of',seaU0);
ok(count(sx,sx,bed-2,bed,sz,sz)===3,'sea shaft');ok(units(sx-2,sx+2,bed+1,G,sz-2,sz+2)===seaU0,'the sea never goes down');
const bedAt=(x,z)=>{let y=G;while(T.get(x,y,z)===W)y--;return y;};
const rx=sx+3,rb=bedAt(rx,sz),ry=rb-6;room(rx,ry,sz,4,3);settle();
const dry=count(rx,rx+3,ry,ry+2,sz,sz+3);
for(let y=rb;y>=ry+3;y--)dig(rx,y,sz);const rs=settle();
console.log('sea room 48: dry before',dry,'after',count(rx,rx+3,ry,ry+2,sz,sz+3),'full in',(rs*T.WF_STEP).toFixed(1)+'s | shaft',count(rx,rx,ry+3,rb,sz,sz),'of',rb-ry-2);
ok(dry===0&&count(rx,rx+3,ry,ry+2,sz,sz+3)===48,'sea room');
let cx=sx-14;for(const k of [-14,-20,-26,-32,10,16,22,28])if(T.get(sx+k,G,sz)===W){cx=sx+k;break;}
const cb=bedAt(cx,sz),cy=cb-12;room(cx,cy,sz,10,5);settle();
for(let y=cb;y>cy+4;y--)dig(cx,y,sz);const cs=settle();
console.log('sea cavern 500: full',count(cx,cx+9,cy,cy+4,sz,sz+9),'in',(cs*T.WF_STEP).toFixed(1)+'s + shaft',count(cx,cx,cy+5,cb,sz,sz),'of',cb-cy-4);
ok(count(cx,cx+9,cy,cy+4,sz,sz+9)===500,'sea cavern');
// 2. a little tank: 2 x 2 of water on a stone pillar, its stone knocked out under it: the 32 eighths go on down, no more
const px=sx+40,pz=sz+40,py=G+20;
for(let x=px-6;x<=px+7;x++)for(let z=pz-6;z<=pz+7;z++)put(x,py-6,z,STONE);
for(let y=py-5;y<py;y++)for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,y,pz+b,STONE);
for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])put(px+a,py,pz+b,W);
settle();const u0=units(px-6,px+7,py-5,py,pz-6,pz+7);dig(px,py-1,pz);settle();
const u1=units(px-6,px+7,py-5,py,pz-6,pz+7);
let wide=0;for(let x=px-6;x<=px+7;x++)for(let z=pz-6;z<=pz+7;z++)if(lvAt(x,py-5,z))wide++;
console.log('tank of 4 holed underneath: eighths before',u0,'after',u1,'| tank now',units(px,px+1,py,py,pz,pz+1),'| spread over',wide,'blocks of the floor');
ok(u0===256&&u1===256,'a tank keeps its water');
// 3. water held in by a wall, the wall broken at its surface: what's above the hole's bottom runs out, none higher
const qx=px+30,qz=pz,qy=G+20;
for(let x=qx-1;x<=qx+8;x++)for(let z=qz-1;z<=qz+3;z++)for(let y=qy-4;y<=qy+3;y++)put(x,y,z,y===qy-4||x===qx-1||x===qx+8||z===qz-1||z===qz+3||x===qx+3?STONE:AIR);
for(let x=qx;x<=qx+2;x++)for(let z=qz;z<=qz+2;z++)for(let y=qy-3;y<=qy;y++)put(x,y,z,W);
settle();dig(qx+3,qy,qz+1);settle();
const pool=units(qx,qx+2,qy-3,qy+3,qz,qz+2),side=units(qx+4,qx+7,qy-3,qy+3,qz,qz+2),gap=amtAt(qx+3,qy,qz+1);
console.log('walled pool broken at its surface: pool',pool,'+ beside',side,'+ gap',gap,'=',pool+side+gap,'of',36*64,'| above the surface',units(qx,qx+7,qy+1,qy+3,qz,qz+2));
ok(pool+side+gap===36*64&&units(qx,qx+7,qy+1,qy+3,qz,qz+2)===0,'walled pool');
// 4. an aquarium's tank: 3 x 6 deep x 30 of water behind glass, in a big closed hall; a pane knocked out 3 up
const ax=qx+40,az=pz-10,ay=G+30,AW=40,AD=30;
for(let x=ax-1;x<=ax+AW;x++)for(let z=az-1;z<=az+AD;z++)for(let y=ay-1;y<=ay+8;y++)put(x,y,z,y===ay-1||y===ay+8||x===ax-1||x===ax+AW||z===az-1||z===az+AD?STONE:AIR);
for(let x=ax+5;x<ax+35;x++){for(let z=az;z<az+3;z++)for(let y=ay;y<ay+6;y++)put(x,y,z,W);for(let y=ay;y<ay+6;y++)put(x,y,az+3,GLASS);}
for(let z=az;z<=az+3;z++)for(let y=ay;y<ay+6;y++){put(ax+4,y,z,GLASS);put(ax+35,y,z,GLASS);}
settle();const tk0=units(ax+5,ax+34,ay,ay+5,az,az+2);
let worst=0,steps=0;dig(ax+20,ay+3,az+3);
for(;steps<6000&&busy();steps++){const t0=performance.now();T.updateWater(T.WF_STEP);worst=Math.max(worst,performance.now()-t0);}
const tk1=units(ax+5,ax+34,ay,ay+5,az,az+2),all=units(ax,ax+AW-1,ay,ay+7,az,az+AD-1);
let floor=0,dp=0,hi=0;for(let x=ax;x<ax+AW;x++)for(let z=az+4;z<az+AD;z++){const l=lvAt(x,ay,z);if(l)floor++;dp=Math.max(dp,l);for(let y=ay+1;y<ay+8;y++)if(lvAt(x,y,z))hi++;}
console.log('aquarium tank holed 3 up: tank',tk0,'->',tk1,'64ths | all of it',all,'| on the hall floor over',floor,'blocks, deepest',dp+'/8, any higher than the floor',hi,
  '| settled in',(steps*T.WF_STEP).toFixed(1)+'s, worst step',worst.toFixed(2),'ms');
ok(all===tk0,'the aquarium keeps its water');ok(tk1<tk0&&tk1>=30*3*3*64,'drains to the bottom of the hole');ok(hi===0,'nothing stands up off the floor');ok(steps<6000,'it settles');
// 4b. a door: a pool behind a wall with a glass door in it, a block knocked out beside the water: it goes through the door
const dx0=ax,dz0=az+AD+20,dy=G+30;
for(let x=dx0-1;x<=dx0+20;x++)for(let z=dz0-1;z<=dz0+6;z++)for(let y=dy-1;y<=dy+4;y++)put(x,y,z,y===dy-1||y===dy+4||x===dx0-1||x===dx0+20||z===dz0-1||z===dz0+6||x===dx0+6?STONE:AIR);
put(dx0+6,dy,dz0+2,T.DOOR_G);put(dx0+6,dy+1,dz0+2,T.DOOR_G);
for(let x=dx0;x<dx0+6;x++)for(let z=dz0;z<dz0+6;z++)for(let y=dy;y<dy+2;y++)put(x,y,z,W);
put(dx0+2,dy+2,dz0+2,STONE);dig(dx0+2,dy+2,dz0+2);settle();
const dIn=units(dx0,dx0+5,dy,dy+3,dz0,dz0+5),dOut=units(dx0+7,dx0+19,dy,dy+3,dz0,dz0+5);
console.log('through a door: behind it',dIn,'+ beyond it',dOut,'=',dIn+dOut,'of',72*64,'| the door still there',T.get(dx0+6,dy,dz0+2)===T.DOOR_G&&T.get(dx0+6,dy+1,dz0+2)===T.DOOR_G);
ok(dOut>0&&dIn+dOut===72*64&&T.get(dx0+6,dy,dz0+2)===T.DOOR_G,'through a door');
// 5. a block knocked out with no water near it: nothing happens
dig(qx+5,qy+2,qz+1);settle();console.log('dry hole stays dry',T.get(qx+5,qy+2,qz+1)===AIR);ok(T.get(qx+5,qy+2,qz+1)===AIR,'dry hole');
// 6. online: the host sends each changed block to its guests, as a smashed one
const out=[];T.NET.mode=1;T.NET.guests.set('g',{net:{out}});
put(px+4,py-5,pz+4,STONE);for(let i=0;i<4;i++)put(px+3+i,py-4,pz+3,W);dig(px+2,py-4,pz+3);settle(40);
T.NET.mode=0;T.NET.guests.clear();
const sent=[];for(const e of out)if(e[0]==='e')for(let i=0;i<e[1].length;i+=4)sent.push(e[1][i+3]);
console.log('sent to a guest',sent.length,'blocks, shallow water among them',sent.some(v=>T.WF_LV[v]>0&&T.WF_LV[v]<8));
ok(sent.some(v=>T.WF_LV[v]>0&&T.WF_LV[v]<8),'online');
// 7. the edge of the made world: a tunnel from the sea runs to the end of its chunk, and the next chunk isn't made yet
let ex=null,ez,eb;
for(let r=2600;r<9000&&ex===null;r+=53)for(const [x,z] of [[r,r],[-r,r],[r,-r],[-r,-r]]){
  const c=Math.floor(x/T.CS);if(T.chunks.has(T.ckey(c+1,Math.floor(z/T.CS))))continue;
  if(T.get(x,G,z)!==W||T.get(x,G-3,z)!==W)continue;ex=x;ez=z;eb=bedAt(x,z);break;}
if(ex===null)console.log('edge: no sea found');else{
  const ty=eb-3,x1=(Math.floor(ex/T.CS)+1)*T.CS-1,nb=T.ckey(Math.floor(ex/T.CS)+1,Math.floor(ez/T.CS));
  for(let y=eb;y>=ty;y--)dig(ex,y,ez);for(let x=ex+1;x<=x1;x++)dig(x,ty,ez);
  for(let i=0;i<1200&&!(T.wfPark.size&&count(ex,x1,ty,ty,ez,ez)===x1-ex+1);i++)T.updateWater(T.WF_STEP);
  console.log('edge: tunnel',count(ex,x1,ty,ty,ez,ez),'of',x1-ex+1,'| waiting at the edge',T.wfPark.size,'| next chunk still unmade',!T.chunks.has(nb));
  T.get(x1+1,ty,ez);for(let x=x1+1;x<=x1+4;x++)dig(x,ty,ez);for(let i=0;i<300&&busy();i++)T.updateWater(T.WF_STEP);
  console.log('edge: once made, the tunnel on in it',count(x1+1,x1+4,ty,ty,ez,ez),'of 4 | still waiting',T.wfPark.size);
  ok(count(x1+1,x1+4,ty,ty,ez,ez)===4,'edge');}
// 8. cars: one dropped into the sea floats a few seconds, then sinks to the bed; one driven into a flood slows in
// shallow water and stops in deep (carPhysics run on its own, moved by its speed)
{const c=T.cars[0],ys=[];c.pos.set(sx+0.5,G+4,sz+0.5);c.vy=0;c.grounded=false;c.speed=0;c.kv.x=c.kv.z=0;c.floatT=0;c.wDep=0;
  for(let i=0;i<14*60;i++){T.carPhysics(c,1/60);if(i%60===59)ys.push(c.pos.y-G);}
  const afloat=ys.slice(1,4).every(y=>y>-0.2&&y<0.9),sunk=ys[13]<ys[6]-3;
  console.log('car into the sea, height over sea level each second:',ys.map(y=>y.toFixed(1)).join(' '));ok(afloat&&sunk,'a car floats, then sinks');
  const fx=sx+60,fy=G+40;for(let x=fx-2;x<fx+40;x++)for(let z=sz-3;z<=sz+3;z++){T.setRaw(x,fy-1,z,STONE);T.setRaw(x,fy,z,x>=fx+10&&x<fx+20?T.WATER_L[3]:x>=fx+20?W:AIR);}
  c.pos.set(fx,fy,sz+0.5);c.vy=0;c.grounded=true;c.heading=Math.PI/2;c.wDep=0;let vS=0,vD=0;
  for(let i=0;i<8*60;i++){c.speed=Math.min(12,c.speed+10/60);c.pos.x+=c.speed/60;T.carPhysics(c,1/60);c.pos.z=sz+0.5;const u=c.pos.x-fx;if(u>12&&u<18)vS=Math.max(vS,c.speed);if(u>21)vD=Math.max(vD,c.speed);}
  console.log('car driven through 3/8 water: top speed',vS.toFixed(1),'| into 8/8:',vD.toFixed(1),'| got',(c.pos.x-fx).toFixed(1),'along');ok(vS>2&&vS<8&&vD<0.5,'cars wade and get stuck');}
// 9. swimming: a pool two blocks deep and a 6/8 top is swum in at the shallower surface; a 2/8 puddle isn't
{const bx=sx+120,by=G+40,bz=sz;for(let x=bx-4;x<=bx+4;x++)for(let z=bz-4;z<=bz+4;z++)for(let y=by-1;y<=by+4;y++){const e=Math.abs(x-bx)===4||Math.abs(z-bz)===4||y===by-1;T.setRaw(x,y,z,e?STONE:y<by+2?W:y===by+2?T.WATER_L[6]:AIR);}
  A.pos.set(bx+0.5,by+3,bz+0.5);A.vy=0;run(3);const deep=A.wet,ay=A.pos.y-by;
  for(let x=bx-3;x<=bx+3;x++)for(let z=bz-3;z<=bz+3;z++)for(let y=by;y<=by+3;y++)T.setRaw(x,y,z,y===by?T.WATER_L[2]:AIR);
  A.pos.set(bx+0.5,by+1,bz+0.5);A.vy=0;run(2);
  console.log('swimming: in a pool with a 6/8 top',deep,'floating',ay.toFixed(2),'over its floor (surface 2.75) | in a 2/8 puddle',A.wet);
  ok(deep&&ay>1.8&&ay<2.8&&!A.wet,'swimming in shallow-topped water');}
// 10. winter: shallow water freezes to a sheet of ice as thick as it was, and thaws back; water that pours out in winter
// freezes over once it's still. (Over the sea, a stone floor 6 up, inside the height freezing reaches)
{const ix=sx+3,iz=sz+3,iy=G+7,cold=T.chunkFreeze;
  for(let x=ix-3;x<=ix+9;x++)for(let z=iz-3;z<=iz+3;z++){put(x,iy-1,z,STONE);put(x,iy,z,Math.abs(z-iz)===3||x===ix-3||x===ix+9?STONE:AIR);}
  put(ix,iy,iz,T.WATER_L[5]);put(ix+1,iy,iz,W);
  T.WX.frozen=true;const canFreeze=T.chunkFreeze(Math.floor(ix/16),Math.floor(iz/16));T.freezeWorld(true);
  const f1=T.get(ix,iy,iz),f2=T.get(ix+1,iy,iz);T.WX.frozen=false;T.freezeWorld(false);const t1=T.get(ix,iy,iz),t2=T.get(ix+1,iy,iz);
  console.log('winter here',canFreeze,'| 5/8 water froze to 5/8 ice',f1===T.ICE_L[5],'full to ice',f2===T.ICE,'| thawed back',t1===T.WATER_L[5],t2===W);
  if(canFreeze){ok(f1===T.ICE_L[5]&&f2===T.ICE&&t1===T.WATER_L[5]&&t2===W,'freeze and thaw');
    T.WX.frozen=true;for(let y=iy;y<iy+3;y++)put(ix+6,y,iz,W);dig(ix+6,iy+3,iz);settle();let ice=0,wet=0;
    for(let x=ix-2;x<=ix+8;x++)for(let z=iz-2;z<=iz+2;z++){const b=T.get(x,iy,z);if(b===T.ICE||T.ICE_L.includes(b)&&b)ice++;else if(T.WF_LV[b]>0)wet++;}
    T.WX.frozen=false;T.freezeWorld(false);console.log('poured out in winter: frozen over',ice,'blocks, still water',wet);ok(ice>0&&wet===0,'freezes over when still');}}
// 11. wading: how deep the water is at the feet
{const bx=sx+140,by=G+40,bz=sz;for(let x=bx-3;x<=bx+3;x++)for(let z=bz-3;z<=bz+3;z++){T.setRaw(x,by-1,z,STONE);T.setRaw(x,by,z,T.WATER_L[4]);T.setRaw(x,by+1,z,AIR);T.setRaw(x,by+2,z,AIR);}
  A.pos.set(bx+0.5,by+0.5,bz+0.5);A.vy=0;run(1.5);const k6=A.wadeK;
  for(let x=bx-3;x<=bx+3;x++)for(let z=bz-3;z<=bz+3;z++)T.setRaw(x,by,z,AIR);run(0.5);
  console.log('wading in 4/8 water: walking speed x',k6.toFixed(2),'| dry x',A.wadeK.toFixed(2),'| depth there',T.wadeDepth(bx+0.5,by,bz+0.5).toFixed(2));ok(k6<0.85&&k6>0.4&&A.wadeK===1,'wading slows');}
console.log('left moving',T.wfAct.size,'queued',T.wfRemoved.length/3,'waiting',T.wfPark.size);
console.log(errs?'waterflow: FAILED '+errs:'waterflow: passed');
process.exit(errs?1:0);
