// The title screen's arrow keys, in the real page: right and left change tab, up and down walk the buttons. node titlenav.js
const {chromium}=require('playwright'),path=require('path');
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:800}}),errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'t3.html'));await p.waitForTimeout(2500);
  const tab=()=>p.evaluate(()=>[...document.querySelectorAll('.tabs button')].find(t=>t.getAttribute('aria-selected')==='true').id);
  const foc=()=>p.evaluate(()=>document.activeElement&&(document.activeElement.id||document.activeElement.tagName));
  console.log('start',await tab(),await foc());
  for(const k of ['ArrowRight','ArrowRight','ArrowLeft','ArrowLeft','ArrowDown','ArrowDown','ArrowDown','ArrowUp','ArrowRight','ArrowLeft']){await p.keyboard.press(k);await p.waitForTimeout(120);console.log(k.padEnd(11),await tab(),await foc());}
  console.log('errors',errs.length,errs.slice(0,3));
  await b.close();
})();
