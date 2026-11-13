// Options, the Goblin pathfinding switch under Enemy hostility: Advanced to start, a click on Simple picks it and saves it,
// it's kept over a reload, and its description follows. Controller: down from the hostility slider lands on it, left and
// right move between the two, A picks one, down goes on to the next setting. Screenshot of the section.
// Usage: python3 tools/build_ui.py game/index.html tools/ui/ui.html, then from tools/ui: node pathopt.js [shot.png]
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
let bad=0;const check=(name,ok,s)=>{if(!ok)bad++;console.log((ok?'ok   ':'BAD  ')+name+'  '+JSON.stringify(s));};
const errs=[];
const open=async ctx=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{const mk=()=>({index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null});window.__pad=mk();
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>document.getElementById('tabBtnOptions').click());await p.waitForTimeout(300);return p;};
const st=p=>p.evaluate(()=>{const c=[...document.querySelectorAll('#pathSeg [data-path]')].filter(b=>b.getAttribute('aria-checked')==='true').map(b=>b.textContent);
  return{on:c.join(),key:localStorage.getItem('goblin-stompin-gus-pathing'),txt:document.getElementById('pathTxt').textContent.slice(0,40)};});
const ctx=await b.newContext({viewport:{width:1200,height:950}});
let p=await open(ctx),s=await st(p);
check('default: Advanced',s.on==='Advanced'&&s.key===null&&s.txt.startsWith('Goblins climb'),s);
await p.click('#pathSeg [data-path="1"]');s=await st(p);
check('click Simple: picked and saved',s.on==='Simple'&&s.key==='1'&&s.txt.startsWith('The old chase'),s);
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>document.getElementById('tabBtnOptions').click());await p.waitForTimeout(300);s=await st(p);
check('kept over a reload',s.on==='Simple',s);
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(120);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(120);};
const cur=()=>p.evaluate(()=>{const a=document.activeElement;return a?(a.id||a.textContent):'';});
await p.evaluate(()=>{const h=document.getElementById('hostMain');h.focus();h.classList.add('padfocus');});
const path=[await cur()];for(const [l,k] of [['down',13],['left',14]]){await press(k);path.push(l+'→'+await cur());}
await press(0);s=await st(p);path.push('A→'+s.on);
await press(15);path.push('right→'+await cur());await press(0);const s2=await st(p);path.push('A→'+s2.on);
await press(13);path.push('down→'+await cur());await press(12);path.push('up→'+await cur());await press(12);path.push('up→'+await cur());
check('pad: down from hostility to Simple (the one picked), left to Advanced, A picks it',path[1]==='down→Simple'&&path[2]==='left→Advanced'&&s.on==='Advanced'&&s.key==='0',path);
check('pad: right to Simple, A picks it, down to the next setting, up back to it and on to hostility',path[4]==='right→Simple'&&s2.on==='Simple'&&path[6]==='down→detailDist'&&path[7]==='up→Simple'&&path[8]==='up→hostMain',path);
if(process.argv[2]){const sec=await p.evaluateHandle(()=>document.getElementById('pathSeg').closest('.custom'));await sec.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  await sec.screenshot({path:process.argv[2]});console.log('shot '+process.argv[2]);}
await ctx.close();
console.log(errs.join('\n')||'no errors');console.log(bad?bad+' BAD':'all ok');await b.close();})();
