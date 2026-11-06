// The Testing Environment's own menu tab: absent in a city; in the Testing Environment it's there, right of Game, and
// opens on its own; the Game tab is the normal title screen; leaving takes it away again. node tabshot.js [outDir]
const {chromium}=require('playwright');const out=process.argv[2]||'shots';
(async()=>{require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
const tabs=()=>p.evaluate(()=>[...document.querySelectorAll('.tabs [role=tab]')].filter(b=>!b.hidden).map(b=>(b.getAttribute('aria-selected')==='true'?'*':'')+b.textContent.replace(/\d+$/,'')).join(' | '));
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
console.log('city:',await tabs());
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(8000);
console.log('testing environment:',await tabs());await p.screenshot({path:out+'/tab-1-test.png'});
await p.evaluate(()=>document.getElementById('tabBtnGame').click());await p.waitForTimeout(500);
console.log('game tab clicked:',await tabs());await p.screenshot({path:out+'/tab-2-game.png'});
// next tab from Game (as the shoulder buttons do), and back
await p.evaluate(()=>showTabNext&&0).catch(()=>{});
await p.keyboard.press('Tab');
await p.evaluate(()=>document.getElementById('testWorld').click());await p.waitForTimeout(500);console.log('Testing Environment button on Game tab:',await tabs());
await p.evaluate(()=>document.getElementById('tpGo').click());await p.waitForTimeout(3000);await p.keyboard.press('Escape');await p.waitForTimeout(800);
console.log('paused in play:',await tabs());
await p.evaluate(()=>document.getElementById('tpNormal').click());await p.waitForTimeout(8000);
console.log('back to the city:',await tabs());
console.log(errs.join('\n')||'no errors');await b.close();})();
