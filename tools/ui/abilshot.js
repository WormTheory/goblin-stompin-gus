// The Character screen's ability switches, in the real page (stub 3D): basic moves and their upgrade tokens, on in full
// colour and off greyed out; each player's own set (player one's alone, then in split screen player one's and player
// two's, from their own pause menus), what's saved, and clicking and A on a controller to switch one.
// Usage (from tools/ui, after: python3 ../build_ui.py ../../game/index.html ui.html): node abilshot.js [outDir]
// Writes character-solo.png, character-p1.png and character-p2.png (1280 x 720, at twice the pixels).
const {chromium}=require('playwright');const out=process.argv[2]||'shots';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.addInitScript(()=>{const mk=i=>({index:i,id:'pad'+i,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
  window.__pads=[mk(0),mk(1)];navigator.getGamepads=()=>window.__pads;
  window.__tap=async(i,btn)=>{const B=window.__pads[i].buttons[btn];B.pressed=true;B.value=1;await new Promise(r=>setTimeout(r,120));B.pressed=false;B.value=0;await new Promise(r=>setTimeout(r,120));};
  // (player one's saved before there were two sets: player two should start with a copy)
  if(!sessionStorage.getItem('abilshot')){sessionStorage.setItem('abilshot','1');localStorage.clear();
    localStorage.setItem('goblin-stompin-gus-abilities',JSON.stringify({groundSpike:true,triple:true,double:true,roll:true,trample:false,fullPound:false,blastAirDash:false,crash:false}));}});
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
const tap=(i,btn)=>p.evaluate(([i,btn])=>window.__tap(i,btn),[i,btn]);
const saved=()=>p.evaluate(()=>{const f=k=>{const s=JSON.parse(localStorage.getItem(k)||'{}');return ['double','triple','trample','groundSpike','fullPound','roll','crash','pound'].map(x=>x+':'+(s[x]?1:0)).join(' ');};
  return 'player one '+f('goblin-stompin-gus-abilities')+' | player two '+f('goblin-stompin-gus-abilities2');});
const shown=()=>p.evaluate(()=>{const L=document.getElementById('abilList');return 'seat '+L.dataset.seat+' (visible '+!!L.offsetParent+'): '+[...L.querySelectorAll('.tog')].map(t=>t.dataset.k+(t.classList.contains('dim')?'~':t.getAttribute('aria-checked')==='true'?'+':'-')).join(' ')
  +'  | role '+[...new Set([...L.querySelectorAll('.tog')].map(t=>t.getAttribute('role')))].join()+', tick boxes '+L.querySelectorAll('.box').length;});
// (scrolled to the rows from Stomp to Jump, the middle of the list, with nothing focused)
const toAbil=()=>p.evaluate(()=>{const a=document.activeElement;if(a&&a.blur)a.blur();for(const e of document.querySelectorAll('.padfocus'))e.classList.remove('padfocus');
  document.querySelector('#abilList .tog[data-k="stomp"]').closest('.ab-row').scrollIntoView({block:'start'});});
console.log('saved at first',await saved());
await p.click('#charLink');await p.waitForTimeout(300);
// (a basic move switched off greys out its upgrades: Ground Pound off)
await p.click('#abilList .tog[data-k="pound"]');await p.waitForTimeout(150);
console.log('solo',await shown());
await toAbil();await p.waitForTimeout(250);await p.screenshot({path:out+'/character-solo.png'});
// contrast of an off switch's text on its grey
console.log('off contrast',await p.evaluate(()=>{const lum=c=>{const v=c.match(/\d+/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const t=document.querySelector('#abilList .tog[aria-checked="false"]'),bg=getComputedStyle(t).backgroundColor;
  return ['.nm','small','.st'].map(s=>{const a=lum(getComputedStyle(t.querySelector(s)).color),c=lum(s==='.st'?getComputedStyle(t.querySelector(s)).backgroundColor:bg);return s+' '+((Math.max(a,c)+.05)/(Math.min(a,c)+.05)).toFixed(1)+':1';}).join('  ');}));
// a greyed upgrade, clicked, switches on with its basic move
await p.click('#abilList .tog[data-k="chargePound"]');await p.waitForTimeout(150);console.log('clicked Charge Ground Pound',await shown());
await p.click('#abilList .tog[data-k="pound"]');await p.waitForTimeout(150);
console.log('saved after player one\'s clicks',await saved());
// split screen: player two switches theirs in their own menu
await p.click('#subBack');await p.click('#playCoop');await p.waitForTimeout(500);
await tap(1,9);await p.waitForTimeout(200);await tap(1,3);await p.waitForTimeout(300);
await p.click('#tabBtnCustom',{force:true});await p.waitForTimeout(300);
console.log('player two\'s menu',await shown());
for(const k of ['triple','double','groundSpike','roll'])await p.click('#abilList .tog[data-k="'+k+'"]');
await p.click('#abilList .tog[data-k="trample"]');await p.click('#abilList .tog[data-k="blastAirDash"]');await p.click('#abilList .tog[data-k="crash"]');
// (and one by controller: Y down to the switches, A on the first)
await tap(1,3);await p.waitForTimeout(200);console.log('player two Y: focus on',await p.evaluate(()=>document.activeElement.dataset.k));
await tap(1,0);await p.waitForTimeout(200);console.log('player two A',await shown());
await tap(1,0);await p.waitForTimeout(200);
console.log('player two after switching',await shown());
console.log('saved',await saved());
await toAbil();await p.waitForTimeout(250);await p.screenshot({path:out+'/character-p2.png'});
// player one's menu: still theirs
await tap(1,9);await p.waitForTimeout(400);await tap(1,9);await p.waitForTimeout(400);
await tap(0,9);await p.waitForTimeout(200);await tap(0,3);await p.waitForTimeout(300);
await p.click('#tabBtnCustom',{force:true});await p.waitForTimeout(300);
console.log('player one\'s menu',await shown());
await toAbil();await p.waitForTimeout(250);await p.screenshot({path:out+'/character-p1.png'});
await p.reload();await p.waitForTimeout(1500);await p.click('#charLink');await p.waitForTimeout(300);console.log('after a reload',await shown());
console.log(errs.join('\n')||'no errors');await b.close();})();
