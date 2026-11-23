// Real screenshots of the weather by region (render/weather.js): a sandstorm in the desert, a dusty savanna with its
// dust devils, the rainforest's haze, fog on the moor, a blizzard in the ice fields, the tundra white in summer, snow high
// on a mountain, and the start's grassland for comparison. Each spot is the nearest of its biome to the start.
// Usage, from tools/ui after build_3d.py: node wxshot.js outDir [seed]
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'wxshots',seed=+(process.argv[3]||1);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={DEVILS,biomeAt,BIOMES,WX,wxSet,wxLocal,landTop,snowAt,set dayN(v){dayN=v},get dayN(){return dayN},set tod(v){tod=v},');
fs.writeFileSync('t3w.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','300');localStorage.setItem('goblin-stompin-gus-detail','300');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3w.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
// [name, the weather wanted there (or any), biome, world spell, day (31 summer, 91 winter), look down, height above the ground, caption]
const ONLY=process.env.ONLY;
const S=[['sand','sand','desert','storm',31,0.05,3,'Desert: the world spell is a thunderstorm; here it is a sandstorm'],
  ['dust','dust','savanna','clear',31,0.02,3,'Savanna on a dusty day (dust devils come and go)'],
  ['haze','haze','rainforest','clear',31,0.05,3,'Rainforest: a clear spell comes as humid haze'],
  ['moor','foggy','moor','cloudy',1,0.05,3,'Moor: a cloudy spell comes as fog'],
  ['blizzard','blizzard','ice','snow',1,0.1,3,'Ice fields: snow comes as a blizzard'],
  ['tundra','','tundra','clear',31,-0.45,14,'Tundra on a clear summer day: its snow never goes'],
  ['taigarain','snow','taiga','rain',91,0.1,3,'Taiga in winter: the same rain spell comes down as snow'],
  ['grass','','grassland','rain',31,0.1,3,'The start\'s grassland in the same summer rain spell']];
for(const [name,want,bk,spell,day,pitch,up,cap] of S){if(ONLY&&!ONLY.split(',').includes(name))continue;
  const at=await p.evaluate(([bk,spell,day,want])=>{const G=window.__G;
    for(let r=1;r<=90;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const X=x*400,Z=z*400;
      if(G.BIOMES[G.biomeAt(X,Z)].k!==bk)continue;let ok=true;for(const [dx,dz] of [[-96,0],[96,0],[0,-96],[0,96]])if(G.BIOMES[G.biomeAt(X+dx,Z+dz)].k!==bk)ok=false;if(!ok)continue;
      G.dayN=day;G.tod=0.22;let u=day+0.4;for(let j=0;j<60;j++){G.wxSet(spell,true);G.WX.until=u;const L=G.wxLocal(X,Z,G.landTop(X,Z));if(!want||L===want)break;u+=0.137;}
      G.WX.until=u;return [X,Z,G.landTop(X,Z),G.wxLocal(X,Z,G.landTop(X,Z))];}
    return null;},[bk,spell,day,want]);
  if(!at){console.log(name,'no',bk);continue;}
  await p.evaluate(([x,y,z,pitch])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];window.__u=G.WX.until;window.__hold=setInterval(()=>{G.WX.until=window.__u;G.tod=0.22;P.pos.set(x,y,z);P.vy=0;P.cam.yaw=0.6;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[at[0],at[2]+up,at[1],pitch]);
  if(name==='dust')await p.evaluate(([x,y,z])=>{const G=window.__G;for(const d of [[28,0],[-28,0],[0,28],[0,-28]])G.DEVILS.push({x:x+d[0],z:z+d[1],y,t:30,a:0,s:0,still:1});},[at[0],at[2],at[1]]);   // (one's made to be seen)
  await p.waitForTimeout(16000);
  await p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},cap+' ('+at[3]+')');
  await p.screenshot({path:out+'/'+name+'.png'});console.log(name,at.join(' '));
}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3w.html');})();
