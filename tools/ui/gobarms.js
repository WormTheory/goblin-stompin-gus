// Real 3D screenshots of Gnash's weapons: the club, the dagger mid-stab and the rifle mid-shot, with the weapon bar by
// his hearts and the rifle's crosshair (see player/gob-weapons.js). Picks Gnash on the title screen and arms him.
// Usage, from tools/ui (after python3 ../build_3d.py ../../game/index.html t3.html): node gobarms.js [seed] [outDir] [tag]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots',tag=process.argv[4]||'';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-character','goblin');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
console.log('goblin mode',await p.evaluate(()=>window.__G.DT.gob));
await p.evaluate(()=>{const P=window.__G.players[0];P.wpns=['club','dagger','rifle'];P.wpn='club';P.gren=5;P.cam.pitch=-0.1;});
const shot=async(nm,wpn,attack,wait)=>{await p.evaluate(w=>{const P=window.__G.players[0];P.wpn=w;P.wpnT=-9;},wpn);await p.waitForTimeout(600);
  if(attack){await p.mouse.down();await p.waitForTimeout(wait);}
  console.log(nm.padEnd(8),await p.evaluate(()=>{const e=document.querySelector('.gwpn'),x=document.querySelector('.gxh');return (e&&!e.hidden?e.textContent:'no bar')+' | crosshair '+(x&&!x.hidden);}));
  await p.screenshot({path:out+'/gobarms'+tag+'-'+nm+'.png'});if(attack){await p.mouse.up();await p.waitForTimeout(700);}};
await shot('club','club',false);await shot('swing','club',true,120);await shot('dagger','dagger',false);await shot('stab','dagger',true,110);await shot('rifle','rifle',false);await shot('fire','rifle',true,40);
console.log(errs.join('\n')||'no errors');await b.close();})();
