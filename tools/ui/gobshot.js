// Real 3D screenshots of playing as Gnash, picked with the title screen's character card (see tools/build_3d.py, which makes t3.html).
// Usage, from tools/ui: node gobshot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelector('#charSel .cs-card[data-c="goblin"]').click());
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
console.log('goblin mode on:',await p.evaluate(()=>window.__G.DT.gob));
// (a couple of goblins stood in front, to compare sizes with)
const stand=()=>p.evaluate(()=>{const G=window.__G,P=G.players[0];P.cam.pitch=-0.05;const fx=-Math.sin(P.cam.yaw),fz=-Math.cos(P.cam.yaw);let i=0;
  clearInterval(window.__h);window.__h=setInterval(()=>{i=0;for(const g of G.goblins.filter(g=>g.state==='chase'||g.civ&&g.state==='wait').slice(0,2)){const d=2.6+i*1.6,s=i?1:-1;
    g.state='chase';g.root.visible=true;g.t=20;g.pos.set(P.pos.x+fx*d-fz*s*0.8,P.pos.y,P.pos.z+fz*d+fx*s*0.8);g.heading=P.cam.yaw;i++;}},30);});
await stand();await p.waitForTimeout(6000);await p.screenshot({path:out+'/gob-view.png'});
await p.evaluate(()=>{window.__G.players[0].cam.pitch=1.3;});await p.waitForTimeout(1500);await p.screenshot({path:out+'/gob-up.png'});
await p.evaluate(()=>{window.__G.players[0].cam.pitch=-0.05;});
// (mid-swing: the arm raised, just before the blow lands)
await p.evaluate(()=>{const P=window.__G.players[0];clearInterval(window.__s);window.__s=setInterval(()=>{P.biteT=0.38*0.6;P.biteDur=0.38;P.lungeT=0.05;P.biteHit=false;},10);});
await p.waitForTimeout(1500);await p.screenshot({path:out+'/gob-swing.png'});
await p.evaluate(()=>{clearInterval(window.__s);const P=window.__G.players[0];P.biteT=0;P.lungeT=0;});
// the free cam leaves the body behind: there's a goblin where you were, not a hippo
await p.evaluate(()=>dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'})));
await p.evaluate(()=>{const P=window.__G.players[0];window.__G.FC_set&&window.__G.FC_set();});
await p.waitForTimeout(400);
await p.keyboard.down('KeyS');await p.waitForTimeout(700);await p.keyboard.up('KeyS');await p.waitForTimeout(800);await p.screenshot({path:out+'/gob-freecam.png'});
await p.evaluate(()=>dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'})));
await p.evaluate(()=>clearInterval(window.__h));
console.log(errs.join('\n')||'no errors');await b.close();})();
