// Options, the PvP switch under Goblin pathfinding: Off to start, a click on On picks it and saves it, it's kept over a
// reload, and its description follows. Controller: down from the pathfinding switch lands on it, left and right move
// between the two, A picks one, down goes on to the next setting. Screenshot of the section.
// Usage: python3 tools/build_ui.py game/index.html tools/ui/ui.html, then from tools/ui: node pvpopt.js [shot.png]
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
let bad=0;const check=(name,ok,s)=>{if(!ok)bad++;console.log((ok?'ok   ':'BAD  ')+name+'  '+JSON.stringify(s));};
const errs=[];
const open=async ctx=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{const mk=()=>({index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null});window.__pad=mk();
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>document.getElementById('tabBtnMulti').click());await p.waitForTimeout(300);return p;};
const st=p=>p.evaluate(()=>{const c=[...document.querySelectorAll('#pvpSeg [data-pvp]')].filter(b=>b.getAttribute('aria-checked')==='true').map(b=>b.textContent);
  return{on:c.join(),key:localStorage.getItem('goblin-stompin-gus-pvp'),txt:(document.getElementById('pvpTxt')||{textContent:''}).textContent.slice(0,40)};});
const ctx=await b.newContext({viewport:{width:1200,height:950}});
let p=await open(ctx),s=await st(p);
check('default: Off',s.on==='Off'&&s.key===null&&s.txt.startsWith('Players can\'t'),s);
await p.click('#pvpSeg [data-pvp="1"]');s=await st(p);
check('click On: picked and saved',s.on==='On'&&s.key==='1'&&s.txt.startsWith('Players can lock'),s);
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>document.getElementById('tabBtnMulti').click());await p.waitForTimeout(300);s=await st(p);
check('kept over a reload',s.on==='On',s);
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(120);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(120);};
const cur=()=>p.evaluate(()=>{const a=document.activeElement;return a?(a.id||a.textContent):'';});
await p.evaluate(()=>{const h=document.querySelector('#pathSeg [data-path="0"]');h.focus();h.classList.add('padfocus');});
const path=[await cur()];for(const [l,k] of [['down',13],['left',14]]){await press(k);path.push(l+'→'+await cur());}
await press(0);s=await st(p);path.push('A→'+s.on);
await press(15);path.push('right→'+await cur());await press(0);const s2=await st(p);path.push('A→'+s2.on);
await press(13);path.push('down→'+await cur());await press(12);path.push('up→'+await cur());
check('pad: down from pathfinding to On (the one picked), left to Off, A picks it',path[1]==='down→On'&&path[2]==='left→Off'&&s.on==='Off'&&s.key==='0',path);
check('pad: right to On, A picks it, down to the next setting, up back to it',path[4]==='right→On'&&s2.on==='On'&&s2.key==='1'&&path[6]==='down→detailDist'&&path[7]==='up→On',path);
if(process.argv[2]){const sec=await p.evaluateHandle(()=>document.getElementById('pvpSeg').closest('.custom'));await sec.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  await sec.screenshot({path:process.argv[2]});console.log('shot '+process.argv[2]);}
await ctx.close();
console.log(errs.join('\n')||'no errors');console.log(bad?bad+' BAD':'all ok');await b.close();})();
