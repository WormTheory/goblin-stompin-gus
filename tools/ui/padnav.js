const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const mk=()=>({index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null});window.__pad=mk();
  Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{document.getElementById('tabBtnCustom').click();});await p.waitForTimeout(300);
await p.evaluate(()=>{document.querySelector('#abilList .tog[data-k="bite"]').focus();});
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(120);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(120);};
const cur=()=>p.evaluate(()=>document.activeElement&&(document.activeElement.dataset.k||document.activeElement.id||document.activeElement.textContent.slice(0,20)));
const path=[await cur()];
for(const [lbl,btn] of [['down',13],['down',13],['right',15],['right',15],['down',13],['down',13],['left',14],['down',13],['up',12],['up',12]]){await press(btn);path.push(lbl+'→'+await cur());}
console.log(path.join('  '));console.log(errs.join('\n')||'no errors');await b.close();})();
