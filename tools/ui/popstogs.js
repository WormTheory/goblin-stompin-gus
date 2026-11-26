// Options, On screen: the Damage numbers, Shouts and Health bars switches. Each defaults as it should, switches only
// itself and saves under its own key, survives a reload, and the old single switch (off) turns all three off once.
// Controller up/down reaches each and A switches it; Enter and Space do on the keyboard. Screenshot of the section.
// Usage: python3 tools/build_ui.py game/index.html tools/ui/ui.html, then from tools/ui: node popstogs.js [shot.png]
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
let bad=0;const check=(name,ok,s)=>{if(!ok)bad++;console.log((ok?'ok   ':'BAD  ')+name+'  '+JSON.stringify(s));};
const errs=[];
const open=async(ctx,pre,arg)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{const mk=()=>({index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null});window.__pad=mk();
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  if(pre)await p.addInitScript(pre,arg);
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>document.getElementById('tabBtnDisplay').click());await p.waitForTimeout(300);return p;};
const st=p=>p.evaluate(()=>{const a=id=>document.getElementById(id).getAttribute('aria-checked');const L=k=>localStorage.getItem('goblin-stompin-gus-'+k);
  return{dmg:a('dmgPopTog'),shout:a('shoutTog'),hp:a('hpBarTog'),kDmg:L('pop-dmg'),kShout:L('pop-shout'),kHp:L('hpBars'),old:L('pops')};});
const ctx=await b.newContext({viewport:{width:1200,height:950}});
let p=await open(ctx),s=await st(p);
check('defaults: numbers and shouts on, health bars off',s.dmg==='true'&&s.shout==='true'&&s.hp==='false',s);
await p.click('#shoutTog');s=await st(p);
check('Shouts click: only shouts off, saved alone',s.dmg==='true'&&s.shout==='false'&&s.hp==='false'&&s.kShout==='0'&&s.kDmg===null,s);
await p.click('#hpBarTog');s=await st(p);
check('Health bars click: only health bars on',s.dmg==='true'&&s.shout==='false'&&s.hp==='true'&&s.kHp==='1',s);
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>document.getElementById('tabBtnDisplay').click());await p.waitForTimeout(300);s=await st(p);
check('kept over a reload',s.dmg==='true'&&s.shout==='false'&&s.hp==='true',s);
// controller: from Damage numbers, down to Shouts and Health bars, A switches each; up goes back
const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(120);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(120);};
const cur=()=>p.evaluate(()=>document.activeElement&&document.activeElement.id);
await p.evaluate(()=>document.getElementById('dmgPopTog').focus());
const path=[await cur()];for(const [l,k] of [['right',15],['down',13],['left',14],['up',12],['down',13]]){await press(k);path.push(l+'→'+await cur());}
// (two to a row: Damage numbers and Shouts, then Health bars and Reduced motion)
check('pad round the switches',path[1].endsWith('shoutTog')&&path[2].endsWith('calmTog')&&path[3].endsWith('hpBarTog')&&path[4].endsWith('dmgPopTog')&&path[5].endsWith('hpBarTog'),path);
await p.evaluate(()=>document.getElementById('shoutTog').focus());await press(0);s=await st(p);
check('pad A switches Shouts back on',s.shout==='true'&&s.dmg==='true'&&s.hp==='true',s);
await p.evaluate(()=>document.getElementById('dmgPopTog').focus());await p.keyboard.press('Enter');await p.waitForTimeout(150);s=await st(p);
check('Enter switches Damage numbers off',s.dmg==='false'&&s.kDmg==='0'&&s.shout==='true',s);
await p.keyboard.press('Enter');await p.waitForTimeout(150);s=await st(p);
check('Enter again switches it back on',s.dmg==='true'&&s.kDmg==='1',s);
await p.click('#hpBarTog');await p.waitForTimeout(100);
// the shot: the On screen section
if(process.argv[2]){const sec=await p.evaluateHandle(()=>document.getElementById('dmgPopTog').closest('.custom'));await sec.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  await sec.screenshot({path:process.argv[2]});console.log('shot '+process.argv[2]);}
await ctx.close();
// the old single switch, off: all three off, the old key gone; on (or never set): the defaults
for(const [old,want] of [['0','false'],['1',null]]){
  const c2=await b.newContext({viewport:{width:1200,height:950}});
  p=await open(c2,o=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('goblin-stompin-gus-pops',o);localStorage.setItem('goblin-stompin-gus-hpBars','1');}},old);
  s=await st(p);
  if(want)check('old switch off: all three off',s.dmg==='false'&&s.shout==='false'&&s.hp==='false'&&s.old===null&&s.kDmg==='0'&&s.kShout==='0'&&s.kHp==='0',s);
  else check('old switch on: numbers and shouts on, health bars as they were',s.dmg==='true'&&s.shout==='true'&&s.hp==='true',s);
  await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>document.getElementById('tabBtnDisplay').click());await p.waitForTimeout(300);
  const s2=await st(p);check('  ... and the same after a reload',s2.dmg===s.dmg&&s2.shout===s.shout&&s2.hp===s.hp,s2);
  await c2.close();}
console.log(errs.join('\n')||'no errors');console.log(bad?bad+' BAD':'all ok');await b.close();})();
