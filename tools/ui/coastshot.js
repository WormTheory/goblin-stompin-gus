// Real screenshots of the coasts by biome (world/coast.js, coastFlav): a sandy shore, shingle in the cold, an ice shelf
// where it's frozen, mangroves where it's warm and wet, the badlands' red sand, and a rugged shore's headland. Each is the
// nearest natural stretch of that kind to the start, seen from the sea.
// Usage, from tools/ui after build_3d.py: node coastshot.js outDir [seed]   (ONLY=sand,ice,... to pick)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'coastshots',seed=+(process.argv[3]||1);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,gridNoise,settlementAt,coastFlav,coastD,coastType,get CF_RC(){return CF_RC},WX,wxSet,set tod(v){tod=v},set dayN(v){dayN=v},');
fs.writeFileSync('t3c.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','300');localStorage.setItem('goblin-stompin-gus-detail','300');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3c.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
// [name, flavour (or 'rug'), how far out to sea, height above the water, pitch, caption]
const ONLY=process.env.ONLY;
const S=[['sand',0,34,8,-0.12,'A sandy shore, temperate'],['shingle',1,36,9,-0.18,'Shingle on a cold shore'],
  ['ice',2,40,12,-0.2,'An ice shelf along a frozen shore, floes beyond'],['mangrove',3,48,12,-0.15,'Mangroves on a warm, wet shore'],
  ['redsand',4,36,9,-0.18,'Red sand in the badlands'],['rugged','rug',45,10,0.05,'A rugged shore: a headland']];
for(const [name,fl,off,up,pitch,cap] of S){if(ONLY&&!ONLY.split(',').includes(name))continue;
  const at=await p.evaluate(([fl,off])=>{const G=window.__G;
    for(let r=1;r<=700;r++)for(let i=-r;i<=r;i++)for(const [a,b] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=a*160,z=b*160,cd=G.coastD(x,z);if(cd<-3||cd>3)continue;
      const t=G.coastType(Math.floor(x/32),Math.floor(z/32));if(t!=='shore'&&t!=='sea')continue;
      const f=G.coastFlav(x,z),rg=G.CF_RC;if(fl==='rug'?rg<0.7:rg>0||f!==fl)continue;
      // (a plain stretch of it: not the old cliffs the noise stands up, nor a town's doorstep)
      if(fl!=='rug'&&G.gridNoise(x/32,z/32,7,77)>0.02)continue;{let tw=false;for(let u=-3;u<=3;u++)for(let v=-3;v<=3;v++)if(G.settlementAt(Math.floor(x/32)+u,Math.floor(z/32)+v))tw=true;if(tw)continue;}
      let gx=G.coastD(x+3,z)-G.coastD(x-3,z),gz=G.coastD(x,z+3)-G.coastD(x,z-3);const L=Math.hypot(gx,gz)||1;gx/=L;gz/=L;
      return [x+gx*off,z+gz*off,Math.atan2(gx,gz),x,z];}
    return null;},[fl,off]);
  if(!at){console.log(name,'none');continue;}
  await p.evaluate(([x,z,yaw,pitch,up])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];G.wxSet('clear',true);G.dayN=31;
    window.__hold=setInterval(()=>{G.tod=0.22;if(G.WX.type!=='clear')G.wxSet('clear',true);P.pos.set(x,G.G0+up,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[at[0],at[1],at[2],pitch,up]);
  await p.waitForTimeout(16000);
  await p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},cap+' ('+Math.round(at[3])+', '+Math.round(at[4])+')');
  await p.screenshot({path:out+'/'+name+'.png'});console.log(name,at.map(v=>v.toFixed(1)).join(' '));
}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3c.html');})();
