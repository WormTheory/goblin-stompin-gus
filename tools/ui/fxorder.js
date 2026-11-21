// Do the see-through effects draw in the right order? Every effect against every other, against the water and in rain and
// snow, frozen in place and photographed in the real game. Each pair is shot twice: as the game draws it, and with the two
// drawn strictly far one first (the right answer for see-through things that don't cross). Where the two pictures differ,
// the game drew them in the wrong order, and the pair is flagged. Also lists every see-through material in the scene with
// its renderOrder, depthWrite and depthTest.
// Usage, from tools/ui (after python ../build_3d.py ../../game/index.html t3.html): node fxorder.js [outDir] [effects]
// effects: a comma list from FX below (default all). Open outDir/index.html to look through the shots, flagged ones first;
// outDir/report.txt has the list. SCENERY=1 keeps the world's solid things in the pictures (by default only the effects, the
// water and the sky are drawn), BAD sets how much of the picture may differ before a pair's flagged, SEED the world.
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'fxorder',ONLY=process.argv[3]?process.argv[3].split(','):null;
const EXP='puff,smoke,blood,addFire,fires,flameP,smokeP,shockwave,shockCone,shocks,cones,blastFx,blasts,fireball,FIREB,parts,PART_M,SEE_M,SEE_M2,flameM,smokeM,rainM,snowM,matWater,wxSet,WX,'+
  'supportAt,WATER,updateParts,updateFires,updateShocks,updateCones,updateFireballs,updateCars,';
const src=fs.readFileSync('t3.html','utf8');
// (frameMs: how long frames have been taking; set while the stage is laid out, so the fires make the plumes a quick machine sees)
fs.writeFileSync('t3fx.html',src.replace('window.__G={DT,','window.__G={'+EXP+'set frameMs(v){frameMs=v},DT,'));
const SAVE_KEY=src.match(/SAVE_KEY='([^']+)'/)[1];
// each effect: how long it's been going when the picture's taken (game seconds) and how high above the ground it starts.
// (fire and smoulder always sit on the ground under them, as in the game, so over the water they're tried on the bank)
const FX={
// (ages part way through fading out, where a see-through thing drawn in the wrong order shows most)
  dust:{age:0.75,dy:0.1},smoke:{age:0.9,dy:0.3},blood:{age:0.1,dy:1.4},
  fire:{age:3,dy:0,bank:true},smoulder:{age:3,dy:0,bank:true},
  ring:{age:0.2,dy:1.6},cone:{age:0.15,dy:1.4},flash:{age:0.25,dy:1.2},fireball:{age:0,dy:1.3}};
const BAD=+(process.env.BAD||0.0005);   // (a pair is flagged when this much of the picture differs)
const NAMES=Object.keys(FX).filter(k=>!ONLY||ONLY.includes(k));
(async()=>{fs.mkdirSync(out+'/img',{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','200');},[SAVE_KEY,+(process.env.SEED||12345)]);
await p.goto('file://'+process.cwd()+'/t3fx.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(9000);
// (a page of its own to compare the pictures in)
const cmp=await b.newPage();await cmp.setContent('<canvas id=c></canvas>');
const diff=(a,r)=>cmp.evaluate(async([a,r])=>{const ld=s=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src='data:image/png;base64,'+s;});
  const A=await ld(a),R=await ld(r),c=document.getElementById('c'),w=c.width=A.width,h=c.height=A.height,x=c.getContext('2d');
  x.drawImage(A,0,0);const da=x.getImageData(0,0,w,h).data;x.drawImage(R,0,0);const D=x.getImageData(0,0,w,h),dr=D.data;let n=0;
  for(let i=0;i<da.length;i+=4){const d=Math.max(Math.abs(da[i]-dr[i]),Math.abs(da[i+1]-dr[i+1]),Math.abs(da[i+2]-dr[i+2]));
    if(d>20){n++;dr[i]=255;dr[i+1]=0;dr[i+2]=255;}else{const g=(dr[i]+dr[i+1]+dr[i+2])/9;dr[i]=dr[i+1]=dr[i+2]=g;}}
  x.putImageData(D,0,0);return{frac:n/(w*h),png:c.toDataURL('image/png').split(',')[1]};},[a.toString('base64'),r.toString('base64')]);

// set up: free camera, time stopped, clear weather, and the helpers the shots use
const setup=await p.evaluate(()=>{const G=window.__G;G.DT.invuln=true;G.wxSet('clear',true);
  if(!G.DT.freecam)dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));G.DT.paused=true;
  const F=window.FXT={};
  F.waterMeshes=()=>{const L=[];G.scene.traverse(o=>{if(o.isMesh&&o.material===G.matWater)L.push(o);});return L;};
  // the water: the middle of the most of it near the start
  const W=F.waterMeshes().map(o=>{o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);return{x:(bb.min.x+bb.max.x)/2,z:(bb.min.z+bb.max.z)/2,y:bb.max.y};});
  if(!W.length)return null;
  let best=W[0],bn=-1;for(const a of W){const n=W.filter(b=>Math.hypot(a.x-b.x,a.z-b.z)<24).length;if(n>bn){bn=n;best=a;}}
  const C=F.C={x:best.x,y:best.y,z:best.z};
  const ground=(x,z)=>G.supportAt(x,z,250),wet=(x,z)=>{const g=ground(x,z);return G.get(Math.floor(x),Math.floor(g),Math.floor(z))===G.WATER||g<C.y+0.5;};
  // dry, level ground for the pairs: the two spots and the middle within a block of each other, not water
  F.YAW=0.7;const fx=-Math.sin(F.YAW),fz=-Math.cos(F.YAW);
  search:for(let r=14;r<80;r+=2)for(let a=0;a<6.28;a+=0.3){const x=C.x+Math.cos(a)*r,z=C.z+Math.sin(a)*r,g=ground(x,z);
    const gs=[-3,-1.5,0,1.5,3].map(d=>ground(x+fx*d,z+fz*d));if(gs.some((v,i)=>Math.abs(v-g)>1||wet(x+fx*[-3,-1.5,0,1.5,3][i],z+fz*[-3,-1.5,0,1.5,3][i])))continue;
    F.D={x,y:Math.max(...gs),z};break search;}
  // the bank nearest the middle of the water, and which way the water lies from it
  bank:for(let r=1;r<40;r+=0.5)for(let a=0;a<6.28;a+=0.2){const x=C.x+Math.cos(a)*r,z=C.z+Math.sin(a)*r;if(wet(x,z))continue;
    const back=[1,2,3].every(k=>!wet(x+Math.cos(a)*k,z+Math.sin(a)*k));if(!back)continue;F.S={x,y:ground(x,z),z,dx:-Math.cos(a),dz:-Math.sin(a)};break bank;}
  // (puffs, fires' smoke, flashes and fireballs' glow are drawn as one batch sorted far to near, SEE_M: pairs of those can't be
  // drawn any other way, so they're only photographed)
  F.groups={dust:()=>[G.SEE_M,G.SEE_M2],smoke:()=>[G.SEE_M,G.SEE_M2],blood:()=>[G.SEE_M,G.SEE_M2],fire:()=>[G.flameM,G.SEE_M,G.SEE_M2],smoulder:()=>[G.SEE_M,G.SEE_M2],
    ring:()=>G.shocks.map(s=>s.m),cone:()=>G.cones.map(c=>c.m),flash:()=>[G.SEE_M,G.SEE_M2],fireball:()=>[G.SEE_M,G.SEE_M2],water:F.waterMeshes};
  // (yaw: the way the camera looks; flat: a ring lying on the ground rather than standing facing the camera)
  F.spawn={dust:(x,y,z)=>G.puff(x,y,z,14,0x9a948a,1.1),smoke:(x,y,z)=>G.smoke(x,y,z,10,0x4a4a4a),blood:(x,y,z)=>G.blood(x,y,z,14,null),
    fire:(x,y,z)=>G.addFire(x,y,z,1.1,60,true),smoulder:(x,y,z)=>G.addFire(x,y,z,1.1,60,false,{smoke:2}),
    ring:(x,y,z,yaw,flat)=>flat?G.shockwave(x,y-1.5,z,3):G.shockwave(x,y,z,3,yaw),cone:(x,y,z,yaw)=>G.shockCone(x,y,z,yaw+Math.PI/2,1.6,4,0.5),
    flash:(x,y,z)=>G.blastFx(x,y,z,0.6,0.7),fireball:(x,y,z)=>{const f=G.fireball(x,y,z,x+1,y,z,{});if(f)f.v.set(0,0,0);}};
  F.clear=()=>{for(const q of G.parts){q.life=0;q.m.visible=false;}G.fires.length=0;for(const q of G.flameP)q.life=0;for(const q of G.smokeP)q.life=0;
    for(const s of G.shocks){s.t=0;s.d=0;s.m.visible=false;}for(const c of G.cones){c.t=0;c.d=0;c.g.visible=false;}
    for(const bl of G.blasts){bl.t=0;for(const m of bl.m)m.visible=false;}for(const f of G.FIREB){f.live=false;f.g.visible=false;}};
  F.step=dt=>{G.updateParts(dt);G.updateFires(dt);G.updateShocks(dt);G.updateCones(dt);G.updateFireballs(dt);G.updateCars(dt);};
  // the camera D away from (tx,ty,tz), looking at it
  F.cam=(yaw,pitch,D,tx,ty,tz)=>{const cp=Math.cos(pitch),P=G.players[0];G.FC.pos.set(tx+Math.sin(yaw)*cp*D,ty-Math.sin(pitch)*D,tz+Math.cos(yaw)*cp*D);G.FC.yaw=yaw;G.FC.pitch=pitch;
    P.camera.position.copy(G.FC.pos);P.camera.rotation.set(pitch,yaw,0,'YXZ');P.camera.updateMatrixWorld();};
  // lay out a scene: a list of [effect,x,y,z,age], each started so it's age seconds old now
  F.stage=(list,yaw,flat)=>{F.clear();G.frameMs=16;const T=Math.max(0,...list.map(e=>e[4]));let t=0;const dt=1/30,todo=list.slice().sort((a,b)=>b[4]-a[4]);
    while(true){while(todo.length&&T-todo[0][4]<=t+1e-6){const e=todo.shift();F.spawn[e[0]](e[1],e[2],e[3],yaw,flat);}if(t>=T-1e-6)break;F.step(Math.min(dt,T-t));t+=dt;}
    F.step(0);};
  // the reference: the far group drawn first, then the near one (each keeping its own order inside), then put back
  F.saved=null;
  F.ref=(far,near)=>{const L=[];const put=(objs,base)=>{const os=[...new Set(objs)].filter(Boolean),r0=Math.min(...os.map(o=>o.renderOrder));for(const o of os){L.push([o,o.renderOrder]);o.renderOrder=base+(o.renderOrder-r0)*0.1;}};
    put(far,50);put(near,60);F.saved=L;};
  // (a chunk merged into a region meanwhile copies its renderOrder from the old meshes: put any such back too)
  F.unref=()=>{if(F.saved)for(const [o,r] of F.saved)o.renderOrder=r;F.saved=null;for(const o of F.waterMeshes())if(o.renderOrder>=50)o.renderOrder=1;};
  // every see-through thing in the scene, grouped by what it is
  F.inventory=()=>{const M=new Map();G.scene.traverse(o=>{const m=o.material;if(!m||Array.isArray(m)||!m.transparent)return;
    const k=[String(o.renderOrder).padStart(5),o.type.padEnd(13),m.type.padEnd(18),'#'+(m.color?m.color.getHexString():'------'),'depthWrite '+m.depthWrite,'depthTest '+m.depthTest,m.blending===2?'additive':'normal',o.position.lengthSq()<1e-6?'at origin':'placed'].join(' | ');M.set(k,(M.get(k)||0)+1);});
    return [...M].sort((a,b)=>parseFloat(a[0])-parseFloat(b[0]));};
  // only the effects, the water and the sky left showing: every other material hidden, and the page's own overlays
  F.hide=()=>{G.fireball(0,-999,0,1,-999,0,{});const keep=new Set([G.matWater,G.SEE_M.material,G.SEE_M2.material,G.PART_M.material,G.flameM.material,G.smokeM.material,G.rainM.material,G.snowM.material,
      ...G.shocks.map(s=>s.m.material),...G.cones.map(c=>c.m.material),...G.blasts.flatMap(b=>b.m.map(m=>m.material)),...G.FIREB.flatMap(f=>f.g.children.map(c=>c.material))]);
    G.scene.traverse(o=>{const m=o.material;if(!m||Array.isArray(m)||o.renderOrder<0||keep.has(m))return;m.visible=false;});F.clear();
    document.querySelectorAll('body *').forEach(e=>{if(e!==G.renderer.domElement&&!e.contains(G.renderer.domElement))e.style.visibility='hidden';});};
  return{C,D:F.D,S:F.S};});
if(!setup||!setup.D||!setup.S){console.log('no water with dry ground beside it near the start: try another SEED',JSON.stringify(setup));await b.close();return;}
const frames=n=>p.evaluate(n=>new Promise(r=>{let k=0;const f=()=>++k>=n?r():requestAnimationFrame(f);requestAnimationFrame(f);}),n);
// let the world load round the water, take stock of the see-through materials, then clear the stage
await p.evaluate(()=>{const F=window.FXT;F.cam(0.7,-0.3,16,F.C.x,F.C.y+2,F.C.z);});await p.waitForTimeout(6000);
await p.evaluate(()=>{const F=window.FXT,C=F.C;F.stage(['fire','dust','smoke','ring','cone','flash','fireball'].map((k,i)=>[k,C.x+i,C.y+2,C.z,0.5]),0.7);});await frames(1);
const inv=await p.evaluate(()=>window.FXT.inventory());
if(!process.env.SCENERY)await p.evaluate(()=>window.FXT.hide());
const showWater=on=>p.evaluate(on=>{window.__G.matWater.visible=on;},on);
const shots=[];
async function shot(name,list,cam,far,near,flat){
  await p.evaluate(([list,cam,flat])=>{const F=window.FXT;F.cam(...cam);F.stage(list,cam[0],flat);},[list,cam,!!flat]);
  await frames(2);const a=await p.screenshot();fs.writeFileSync(out+'/img/'+name+'.png',a);
  const rec={name,flag:false,frac:null,note:''};
  if(far&&near){
    const shared=await p.evaluate(([f,n])=>{const F=window.FXT,A=F.groups[f](),B=F.groups[n]();return A.some(o=>B.includes(o));},[far,near]);
    if(shared)rec.note='same batch';
    else{await p.evaluate(([f,n])=>{const F=window.FXT;F.ref(F.groups[f](),F.groups[n]());},[far,near]);await frames(2);
      const r=await p.screenshot();await p.evaluate(()=>window.FXT.unref());
      const d=await diff(a,r);rec.frac=d.frac;rec.flag=d.frac>BAD;
      if(rec.flag){fs.writeFileSync(out+'/img/'+name+'-ref.png',r);fs.writeFileSync(out+'/img/'+name+'-diff.png',Buffer.from(d.png,'base64'));}}}
  shots.push(rec);console.log((rec.flag?'WRONG ':rec.frac===null?'      ':'ok    ')+name+(rec.frac!==null?' '+(rec.frac*100).toFixed(2)+'%':'')+(rec.note?' ('+rec.note+')':''));
}
const {C,D,S}=setup,YAW=0.7,fx=-Math.sin(YAW),fz=-Math.cos(YAW);
const at=(k,x,g,z)=>[k,x,g+FX[k].dy,z,FX[k].age];
// 1. each effect in front of each other (and of itself), side on, on dry ground (the water hidden, so only the pair's in it)
await showWater(false);
for(const near of NAMES)for(const far of NAMES){
  const list=[at(near,D.x-fx*2.5,D.y,D.z-fz*2.5),at(far,D.x+fx*2.5,D.y,D.z+fz*2.5)];
  await shot(near+'_over_'+far,list,[YAW,-0.1,10,D.x,D.y+1.8,D.z],near===far?null:far,near===far?null:near);}
// 2. each effect over the water, looking down at it (the water's the far one); fire and smoulder on the bank, the water beyond
await showWater(true);
for(const k of NAMES)for(const [v,pitch] of [['low',-0.45],['steep',-1.0]]){
  if(FX[k].bank){const yaw=Math.atan2(-S.dx,-S.dz);await shot(k+'_by_water_'+v,[at(k,S.x,S.y,S.z)],[yaw,pitch,12,S.x+S.dx*2,S.y+1.5,S.z+S.dz*2],'water',k);}
  else await shot(k+'_over_water_'+v,[at(k,C.x,C.y,C.z)],[YAW,pitch,12,C.x,C.y+1.2,C.z],'water',k,true);}
// 3. each effect in rain and in snow (no reference: the weather is everywhere, near and far)
await showWater(false);
for(const w of ['rain','snow']){await p.evaluate(w=>{const G=window.__G;G.wxSet(w,true);G.WX.k.fog=0;},w);await frames(3);
  for(const k of NAMES)await shot(k+'_in_'+w,[at(k,D.x,D.y,D.z)],[YAW,-0.1,9,D.x,D.y+2,D.z]);}
await p.evaluate(()=>window.__G.wxSet('clear',true));await showWater(true);
const flagged=shots.filter(s=>s.flag);
let txt='See-through materials in the scene (renderOrder | object | material | colour | depthWrite | depthTest | blending | where its position is) x how many\n';
for(const [k,n] of inv)txt+='  '+k+'  x'+n+'\n';
txt+='\nWrong order ('+flagged.length+' of '+shots.filter(s=>s.frac!==null).length+' checked):\n'+flagged.map(s=>'  '+s.name+' '+(s.frac*100).toFixed(2)+'% of the picture').join('\n')+'\n';
fs.writeFileSync(out+'/report.txt',txt);
const card=s=>`<figure class="${s.flag?'bad':''}"><a href="img/${s.name}.png"><img src="img/${s.name}.png"></a>${s.flag?`<a href="img/${s.name}-ref.png"><img src="img/${s.name}-ref.png"></a><a href="img/${s.name}-diff.png"><img src="img/${s.name}-diff.png"></a>`:''}<figcaption>${s.name.replace(/_/g,' ')}${s.frac!==null?' · '+(s.frac*100).toFixed(2)+'%':''}${s.note?' · '+s.note:''}</figcaption></figure>`;
fs.writeFileSync(out+'/index.html',`<!doctype html><meta charset=utf-8><title>Effect draw order</title><style>body{font:14px system-ui;background:#16181c;color:#ddd;margin:16px}figure{display:inline-block;margin:6px;vertical-align:top}img{width:320px;display:block;margin-bottom:2px}.bad figcaption{color:#ff6a6a;font-weight:600}pre{white-space:pre-wrap}</style>
<h2>Wrong order (${flagged.length})</h2><p>Game · far one drawn first · difference</p>${flagged.map(card).join('')}<h2>All shots</h2>${shots.filter(s=>!s.flag).map(card).join('')}<pre>${txt.replace(/</g,'&lt;')}</pre>`);
console.log(txt);console.log(errs.join('\n')||'no errors');process.exitCode=flagged.length?1:0;await b.close();fs.unlinkSync('t3fx.html');})();
