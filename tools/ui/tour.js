// Flies a hidden Gus to a list of spots and takes a real 3D screenshot at each. (Needs t3.html: see tools/build_3d.py.)
// Usage, from tools/ui: node tour.js scenes.json outDir [seed] [waitMs]
// scenes.json: [[name,x,y,z,yaw,pitch], ...]. Or a string of JavaScript run in the page, returning that list
// (with G=window.__G to hand), so spots can be worked out from the world itself.
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync(process.env.T3||'t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const scenes=fs.readFileSync(process.argv[2],'utf8'),out=process.argv[3]||'shots',seed=+(process.argv[4]||12345),wait=+(process.argv[5]||6000);
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
// (TOUR_VIEW: how far to see, in blocks. The fog's set by it, so big sites can be seen whole.)
if(process.env.TOUR_VIEW)await p.addInitScript(v=>{localStorage.setItem('goblin-stompin-gus-view',v);localStorage.setItem('goblin-stompin-gus-detail',String(Math.min(+v,480)));},process.env.TOUR_VIEW);
await p.goto('file://'+process.cwd()+'/'+(process.env.T3||'t3.html'));await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
// (no HUD and no Gus in the picture: this is for looking at the world. Time stands still so nothing wrecks the view.)
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
const list=scenes.trim().startsWith('[')?JSON.parse(scenes):await p.evaluate(s=>{const G=window.__G;return eval(s);},scenes);
for(const [name,x,y,z,yaw,pitch,cut,caption] of list){
  // (a seventh value: slice the world off above that height, to look down into a room with its roof gone)
  await p.evaluate(c=>{const G=window.__G,T=G.THREE;G.renderer.clippingPlanes=c?[new T.Plane(new T.Vector3(0,-1,0),c)]:[];window.__propY=c?c-3.3:0;},cut||0);
  await p.evaluate(([x,y,z,yaw,pitch])=>{clearInterval(window.__hold);const P=window.__G.players[0];P.root.visible=false;window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,yaw,pitch]);
  await p.waitForTimeout(wait);
  // (an eighth value, or TOUR_NOTE: what the picture's for, burned into it along with when it was taken)
  await p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;z-index:99999;visibility:visible!important';document.body.append(d);}d.textContent=tx;},(caption||process.env.TOUR_NOTE||name)+'  |  '+new Date().toISOString().replace('T',' ').slice(0,19)+' UTC');
  await p.screenshot({path:out+'/'+name+'.png'});console.log(name,Math.round(x),Math.round(y),Math.round(z));
}
console.log(errs.join('\n')||'no errors');await b.close();})();
