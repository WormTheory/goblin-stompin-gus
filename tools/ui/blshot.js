// Block lighting at night, real three.js: the same spots with Options' Block lighting on and off (render/block-light.js).
// Usage, from tools/ui after `python tools/build_3d.py game/index.html tools/ui/t3.html`: node blshot.js [seed] [outDir] [hour]
const {chromium}=require('playwright');
const fs=require('fs');
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={DT,','window.__G={setTodHour,get BL(){return BL_ON},LAMP,NEON_G,NEON_M,NEON_B,NEON_R,NEON_Y,NEON_O,DT,');
fs.writeFileSync('t3bl.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots-bl',hour=+(process.argv[4]||23);
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let spots=null;
for(const on of [true,false]){
  const p=await b.newPage({viewport:{width:1280,height:720}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
  await p.addInitScript(([k,s,on])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-blocklight',on?'1':'0');localStorage.setItem('goblin-stompin-gus-dayspeed','0');},[SAVE_KEY,seed,on]);
  await p.goto('file://'+process.cwd()+'/t3bl.html');await p.waitForTimeout(3000);
  await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(8000);
  await p.evaluate(h=>window.__G.setTodHour(h),hour);
  console.log('block lighting',await p.evaluate(()=>window.__G.BL));
  if(!spots)spots=await p.evaluate(()=>{const G=window.__G,P=G.players[0],o=P.pos,S=[];
    // (the brightest street near the start: most neon and lamp blocks in a few storeys over the pavement)
    const N=new Set([G.LAMP,G.NEON_G,G.NEON_M,G.NEON_B,G.NEON_R,G.NEON_Y,G.NEON_O]);let best=null,bn=0;
    for(let x=o.x-80;x<=o.x+80;x+=8)for(let z=o.z-80;z<=o.z+80;z+=8){let n=0;for(let dx=0;dx<8;dx++)for(let dz=0;dz<8;dz++)for(let y=G.G+1;y<G.G+9;y++)if(N.has(G.get(Math.floor(x+dx),y,Math.floor(z+dz))))n++;if(n>bn){bn=n;best=[x+4,z+4];}}
    S.push(['01-above-start',o.x,o.y+40,o.z,P.cam.yaw,-0.75]);
    if(best){S.push(['02-neon-above',best[0]+18,G.G+16,best[1]+18,Math.atan2(18,18),-0.45]);S.push(['03-neon-street',best[0]+10,G.G+3,best[1]+2,Math.PI/2,-0.05]);}
    S.push(['04-street',o.x,G.G+3,o.z,P.cam.yaw,-0.1]);
    return S;});
  for(const [name,x,y,z,yaw,pitch] of spots){
    await p.evaluate(([x,y,z,yaw,pitch])=>{clearInterval(window.__hold);const P=window.__G.players[0];window.__hold=setInterval(()=>{P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;},20);},[x,y,z,yaw,pitch]);
    await p.waitForTimeout(14000);await p.screenshot({path:out+'/'+name+(on?'-on':'-off')+'.png'});console.log(name,on?'on':'off',Math.round(x),Math.round(y),Math.round(z));
  }
  console.log(errs.join('\n')||'no errors');await p.close();
}
await b.close();})();
