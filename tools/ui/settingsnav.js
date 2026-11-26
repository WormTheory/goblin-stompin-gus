// The Settings screen in the real page: the title screen has no Workshop line, Settings opens on its tabs, the pause
// menu's Play solo / Play online live in the Multiplayer tab (and go back to the title menu on Quit to title), and a
// controller walks the tabs. Screenshots of each tab go to outDir. node settingsnav.js [outDir], after build_3d (t3.html)
const {chromium}=require('playwright'),path=require('path');
const out=process.argv[2]||'settingsshots';require('fs').mkdirSync(out,{recursive:true});
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:800}}),errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{window.__pad={index:0,id:'Xbox pad',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null};
    window.GSG_TEST=1;Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  await p.goto('file://'+path.resolve(__dirname,'t3.html'));await p.waitForTimeout(2500);
  const ev=f=>p.evaluate(typeof f==='string'?f:'('+f.toString()+')()');
  const vis=id=>ev(`(()=>{const e=document.getElementById('${id}');return !!(e&&e.offsetParent)})()`);
  console.log('title: workshop shown',await vis('testWorld'),'| online btn in title menu',await ev(()=>document.getElementById('onlineBtn').parentNode.id));
  await p.screenshot({path:out+'/title.png'});
  await p.click('#optBtn');await p.waitForTimeout(400);
  console.log('title Settings opens',await ev("__gsg('curTab')"),'| title',await ev(()=>document.getElementById('subTitle').textContent),'| tabs shown',await vis('setTabs'));
  await p.click('#tabBtnMulti');await p.waitForTimeout(300);await p.screenshot({path:out+'/title-multi.png'});
  await p.click('#subBack');await p.waitForTimeout(300);
  await p.click('#play');await p.waitForTimeout(1500);
  await ev("__gsg('pause()')");await p.waitForTimeout(500);
  console.log('pause: workshop shown',await vis('testWorld'),'| Play online on pause screen',await vis('onlineBtn'),'| Settings btn',await vis('setBtn'));
  await p.screenshot({path:out+'/pause.png'});
  await p.click('#setBtn');await p.waitForTimeout(400);
  for(const t of ['Controls','Gameplay','Perf','Display','Multi']){await p.click('#tabBtn'+t);await p.waitForTimeout(350);await p.screenshot({path:out+'/set-'+t+'.png'});}
  console.log('multi tab: play online here',await vis('onlineBtn'),'| parent',await ev(()=>document.getElementById('onlineBtn').parentNode.id),'| co-op btn',await vis('playCoop'),'| play solo',await vis('play'));
  // controller: back, then Settings by pad, LB/RB along its tabs, up to its tab and right
  await p.click('#subBack');await p.waitForTimeout(300);
  const press=async i=>{await ev(`window.__pad.buttons[${i}].pressed=true;window.__pad.buttons[${i}].value=1`);await p.waitForTimeout(140);await ev(`window.__pad.buttons[${i}].pressed=false;window.__pad.buttons[${i}].value=0`);await p.waitForTimeout(140);};
  const st=()=>ev(()=>__gsg('curTab')+' @'+(document.activeElement&&(document.activeElement.id||document.activeElement.textContent.slice(0,16))));
  await ev("__gsg('padFocus')(document.getElementById('setBtn'))");
  const log=[];await press(0);log.push('A '+await st());
  await press(5);log.push('RB '+await st());await press(5);log.push('RB '+await st());await press(5);log.push('RB '+await st());await press(5);log.push('RB '+await st());await press(4);log.push('LB '+await st());
  for(let i=0;i<8;i++){await press(12);}log.push('up* '+await st());
  await press(13);log.push('down '+await st());await press(15);log.push('right '+await st());await press(13);log.push('down '+await st());
  await press(1);log.push('B '+await st());
  console.log(log.join('\n'));
  // the abilities: no ON / OFF
  await p.click('#tabBtnCustom');await p.waitForTimeout(400);
  console.log('ability tags',await ev(()=>[...new Set([...document.querySelectorAll('#abilList .st')].map(e=>e.textContent))].join('|')));
  await p.screenshot({path:out+'/character.png'});await ev(()=>document.querySelector('#abilList .ab-row').scrollIntoView());await p.waitForTimeout(200);await p.screenshot({path:out+'/abilities.png'});await p.click('#subBack');await p.waitForTimeout(300);
  console.log('seed line',await ev(()=>document.getElementById('seedNote').textContent));
  await p.click('#quitBtn');await p.waitForTimeout(500);
  console.log('back at title: online btn parent',await ev(()=>document.getElementById('onlineBtn').parentNode.id),'| order',await ev(()=>[...document.getElementById('titleMenu').children].slice(0,5).map(e=>e.id||e.className).join(',')));
  console.log('errors',errs.length,errs.slice(0,3));
  await b.close();
})();
