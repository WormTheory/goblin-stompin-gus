// The debug menu with a controller and the keyboard: the vehicle dropdown opened and stepped through with the d-pad (is
// the highlighted choice always in view?), then the menu opened on one device and driven and closed from the other.
// python3 tools/build_ui.py game/index.html tools/ui/ui.html, then node dbgmenu.js from tools/ui
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:760}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('goblin-stompin-gus-quickdbg','true');
  const mk=()=>({index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null});window.__pad=mk();
  Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
await p.click('#play');await p.waitForTimeout(800);
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(90);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(90);};
const st=()=>p.evaluate(()=>{const d=document.getElementById('dbgPad'),cur=document.querySelector('#dpRows .dr.cur');
  return{open:!d.hidden,pad:document.getElementById('dpClose').hidden,row:cur&&cur.children[1].textContent};});
// to the vehicle row: open with Select, step down until the row's the vehicle dropdown
await press(8);let s=await st();console.log('Select opens:',s.open);
for(let i=0;i<80&&s.row!=='Vehicle';i++){await press(i<40?13:15);s=await st();}
console.log('at row',s.row);
await press(0);   // (open the list)
let worst=0,steps=0,shown=0;
for(let i=0;i<50;i++){await press(13);const r=await p.evaluate(()=>{const l=document.querySelector('#dpRows .ddl'),c=l&&l.querySelector('.ddo.cur');if(!c)return null;
  const a=l.getBoundingClientRect(),q=c.getBoundingClientRect(),pad=document.getElementById('dbgPad').getBoundingClientRect();
  const out=Math.max(0,a.top-q.top,q.bottom-a.bottom,pad.top-q.top,q.bottom-pad.bottom);return{out,t:c.textContent};});
  if(!r)break;steps++;if(r.out<1)shown++;worst=Math.max(worst,r.out);}
console.log('d-pad down the vehicle list:',steps,'steps, highlighted choice in view',shown,'times, furthest out of view',worst.toFixed(0)+'px');
await press(1);await press(1);s=await st();console.log('B twice (list, then menu):',s.open?'still open':'closed');
// opened with the keyboard, driven and closed with the controller
await p.keyboard.press('Backquote');await p.waitForTimeout(150);s=await st();console.log('~ opens:',s.open,' keyboard prompts',!s.pad);
const r0=s.row;await press(13);s=await st();console.log('d-pad moves it:',s.row!==r0,' controller prompts now',s.pad);
await press(8);s=await st();console.log('Select closes it:',!s.open);
// opened with the controller, driven and closed with the keyboard
await press(8);s=await st();const r1=s.row;await p.keyboard.press('ArrowDown');await p.waitForTimeout(150);s=await st();
console.log('Select opens, arrow key moves it:',s.row!==r1,' keyboard prompts now',!s.pad);
await p.keyboard.press('Backquote');await p.waitForTimeout(150);s=await st();console.log('~ closes it:',!s.open);
// once more each way, so no second copy is left open behind the first
await p.keyboard.press('Backquote');await p.waitForTimeout(150);await press(8);s=await st();console.log('~ then Select:',s.open?'still open':'closed');
await press(8);await p.keyboard.press('Backquote');await p.waitForTimeout(150);s=await st();console.log('Select then ~:',s.open?'still open':'closed');
console.log(errs.join('\n')||'no errors');await b.close();})();
