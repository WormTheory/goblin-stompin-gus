// Saving and loading in the real page: smash things all over, save, reload, and check every smashed block came back as it was, for
// the current packed format and for a save in the old one ("x,y,z":b). Also says how big the save is per smashed block.
// Usage, from tools/ui, after python tools/build_3d.py game/index.html tools/ui/t3.html: node savetest.js
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:320,height:180}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const open=async()=>{await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(1500);await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);};
await p.addInitScript(([k])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:12345}));},[SAVE_KEY]);
await open();
// smashes round Gus, including negative coordinates and a pit deep enough to reach water and earth
const made=await p.evaluate(()=>{const G=window.__G,P=G.players[0];let n=0;for(let i=0;i<40;i++){const a=i*0.7,r=i*6;n+=G.crush(P.pos.x+Math.cos(a)*r-400,G.G+1,P.pos.z+Math.sin(a)*r-400,4,-6,8)||0;}return n;});
await p.waitForTimeout(2500);
const before=await p.evaluate(()=>JSON.stringify(Object.entries(window.__G.editsNow()).sort()));
const size=await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));return {all:localStorage.getItem(k).length,ed2:s.ed2?JSON.stringify(s.ed2).length:-1,old:!!s.edits};},SAVE_KEY);
const n=JSON.parse(before).length;
console.log('smashed',made,'distinct edits',n,'edits in save',size.ed2,'chars,',(size.ed2/n).toFixed(1),'per edit (the old way',(JSON.stringify(Object.fromEntries(JSON.parse(before))).length/n).toFixed(1)+')');
await open();
const after=await p.evaluate(()=>JSON.stringify(Object.entries(window.__G.editsNow()).sort()));
console.log('packed save comes back the same:',after===before);
const blocks=await p.evaluate(()=>{const G=window.__G,e=G.editsNow();let bad=0,n=0;for(const k in e){const [x,y,z]=k.split(',').map(Number);if(n++>4000)break;if(G.get(x,y,z)!==e[k]&&!(e[k]===0))bad++;}return bad;});
console.log('blocks in the world not matching their edit:',blocks);
// an old save still loads, and is rewritten in the new form
await p.evaluate(([k,ed])=>{const s=JSON.parse(localStorage.getItem(k));delete s.ed2;s.edits=Object.fromEntries(JSON.parse(ed));window.__noSave=1;localStorage.setItem('oldsave',JSON.stringify(s));},[SAVE_KEY,before]);
await p.addInitScript(k=>{if(localStorage.getItem('oldsave')){localStorage.setItem(k,localStorage.getItem('oldsave'));localStorage.removeItem('oldsave');}},SAVE_KEY);
await open();
const after2=await p.evaluate(()=>JSON.stringify(Object.entries(window.__G.editsNow()).sort()));
console.log('old save comes back the same:',after2===before);
console.log(errs.join('\n')||'no errors');await b.close();})();
