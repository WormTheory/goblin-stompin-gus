const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:950}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{document.getElementById('tabBtnDev').click();});await p.waitForTimeout(300);
await p.evaluate(()=>{document.getElementById('devSecAbil').open=false;document.getElementById('devSecStruct').open=true;});
for(let i=0;i<10;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.getElementById('devStInfo').textContent);if(/·/.test(t)){console.log('info:',t);break;}}
await p.click('#devStDD button');await p.waitForTimeout(200);await p.screenshot({path:'st1.png'});
await p.click('#devStList li[data-k="airport"]');
for(let i=0;i<20;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.getElementById('devStInfo').textContent);if(/·/.test(t)){console.log('info:',t);break;}}
await p.click('#devStDD button');await p.click('#devStList li[data-k="caves"]');
for(let i=0;i<20;i++){await p.waitForTimeout(500);const t=await p.evaluate(()=>document.getElementById('devStInfo').textContent);if(/·|No /.test(t)){console.log('info:',t);break;}}
await p.screenshot({path:'st2.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
