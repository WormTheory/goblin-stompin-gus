// Real pictures of goblins going after Gus the hard way: up a wall to a roof, and swimming out to him. (Needs t3.html: see
// tools/build_3d.py.) Usage, from tools/ui: node chaseshot.js outDir [seed]
const {chromium}=require('playwright');const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const out=process.argv[2]||'shots',seed=+(process.argv[3]||12345);
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const cap=async(tx,name)=>{await p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.65);color:#fff;font:14px sans-serif;visibility:visible!important';document.body.append(d);}d.textContent=tx+'  ('+new Date().toISOString().slice(0,16).replace('T',' ')+')';},tx);await p.screenshot({path:out+'/'+name+'.png'});console.log(name);};
// stand Gus somewhere, and bring a few goblins in at the given spots
const stage=(g)=>p.evaluate(({x,y,z,yaw,pitch,gobs})=>{const G=window.__G,P=G.players[0];clearInterval(window.__hold);P.pos.set(x,y,z);
  const list=G.goblins.filter(o=>!o.civ&&!o.staff&&!o.medic&&!o.ff&&!o.cop).slice(0,gobs.length);
  for(const o of G.goblins)if(!list.includes(o)&&o.state==='chase'){o.state='wait';o.t=-1e9;o.root.visible=false;}
  list.forEach((o,i)=>{const q=gobs[i];o.state='chase';o.hp=o.hpMax=99;o.stun=0;o.indoor=false;o.vy=0;o.t=0;o.act=null;o.detour=0;o.kv.set(0,0,0);o.pos.set(q[0],q[1],q[2]);o.root.visible=true;o.root.rotation.set(0,0,0);});
  window.__list=list;
  window.__hold=setInterval(()=>{P.hp=999;P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;for(const o of G.goblins)if(!list.includes(o)&&o.state==='chase'){o.state='wait';o.t=-1e9;o.root.visible=false;}for(const o of list)o.hp=99;},16);},g);
const wait=async(fn,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(150);}return false;};
// 1. a low building by the street: goblins at the foot of a wall, Gus on the roof edge above them
const site=await p.evaluate(()=>{const G=window.__G;for(let r=2;r<60;r++)for(let a=0;a<r*8;a++){const px=Math.round(Math.cos(a/r)*r),pz=Math.round(Math.sin(a/r)*r),P=G.plotInfo(px,pz);if(!P.b||P.type==='plains')continue;for(const q of P.b){if(q.top<52||q.top>66||q.x1-q.x0<10)continue;return {x0:px*32+q.x0,x1:px*32+q.x1,z0:pz*32+q.z0,z1:pz*32+q.z1,top:q.top};}}return null;});
console.log('site',JSON.stringify(site));
await stage({x:(site.x0+site.x1)/2,y:site.top+1,z:site.z0+1.5,yaw:Math.PI,pitch:-0.95,gobs:[[(site.x0+site.x1)/2-3,45,site.z0-3],[(site.x0+site.x1)/2+1,45,site.z0-4],[(site.x0+site.x1)/2+4,45,site.z0-2]]});
await p.waitForTimeout(3000);
const a=await wait(()=>window.__list.filter(g=>g.act&&g.act.k==='up').length>=2,90000);console.log('climbing',a,await p.evaluate(()=>window.__list.map(g=>[g.pos.x|0,g.pos.y|0,g.pos.z|0,g.act&&g.act.k].join())));
await p.waitForTimeout(1500);
await cap('Goblins climbing the wall of a building after Gus, who is on the roof','chase-climb');
// 2. water: Gus out in it, goblins paddling after him
const sea=await p.evaluate(()=>{const G=window.__G;for(let i=0;i<30000;i++){const x=Math.floor(Math.random()*3000-1500),z=Math.floor(Math.random()*3000-1500);let ok=true;for(let u=-14;u<=14&&ok;u+=2)for(let v=-14;v<=14&&ok;v+=2){if(G.get(x+u,44,z+v)!==9||G.get(x+u,43,z+v)!==9||G.get(x+u,45,z+v)!==0)ok=false;}if(ok)return {x,z};}return null;});
console.log('sea',JSON.stringify(sea));
if(sea){await stage({x:sea.x+.5,y:44.2,z:sea.z+.5,yaw:Math.PI,pitch:-0.35,gobs:[[sea.x-9,44,sea.z+13],[sea.x+7,44,sea.z+14],[sea.x+11,44,sea.z+11]]});
 await wait(()=>window.__list.filter(g=>g.wet&&g.state==='chase').length>=2,30000);console.log('swimming',await p.evaluate(()=>window.__list.map(g=>[g.pos.x|0,g.pos.y.toFixed(1),g.pos.z|0,g.wet,g.state].join())));await cap('Goblins swimming out to Gus in deep water','chase-swim');}
console.log(errs.join('\n')||'no errors');await b.close();})();
