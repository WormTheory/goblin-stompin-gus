// Esc in the pause menu: carries on playing, does nothing on the title screen, backs out of the new-city question
// first, and is ignored straight after pausing (the same press). The stub-THREE page, so only the menus are real.
// Usage: python3 tools/build_ui.py game/index.html tools/ui/ui.html, then from tools/ui: node escresume.js
// (Chat isn't checked: it only opens in an online game.)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:950}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
const st=()=>p.evaluate(()=>({pause:!document.getElementById('pause').hidden,confirm:!document.getElementById('confirm').hidden}));
let bad=0;const check=(name,ok,s)=>{if(!ok)bad++;console.log((ok?'ok   ':'BAD  ')+name+'  '+JSON.stringify(s));};
let s;
await p.keyboard.press('Escape');await p.waitForTimeout(300);s=await st();
check('title screen: Esc leaves the menu up',s.pause,s);
await p.click('#play');await p.waitForTimeout(400);s=await st();
check('Play hides the menu',!s.pause,s);
await p.keyboard.press('Escape');await p.waitForTimeout(100);s=await st();
check('Esc while playing pauses',s.pause,s);
await p.keyboard.press('Escape');await p.waitForTimeout(100);s=await st();
check('a second Esc within 300 ms is ignored',s.pause,s);
await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.waitForTimeout(300);s=await st();
check('Esc in the pause menu resumes',!s.pause,s);
await p.keyboard.press('Escape');await p.waitForTimeout(500);
await p.click('#newWorld');await p.waitForTimeout(200);s=await st();
check('New city opens the question',s.pause&&s.confirm,s);
await p.keyboard.press('Escape');await p.waitForTimeout(200);s=await st();
check('Esc on the question answers No, menu stays',s.pause&&!s.confirm,s);
const foc=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
check('focus back on New city',foc==='newWorld',{focus:foc});
await p.keyboard.press('Escape');await p.waitForTimeout(300);s=await st();
check('then Esc resumes',!s.pause,s);
console.log(errs.join('\n')||'no errors');console.log(bad?bad+' BAD':'all ok');await b.close();})();
