// Split-screen co-op pause menus, in the real page (stub 3D): each player's own pause panel opens the whole menu as
// theirs; player two's has no Game options, Dev or Testing Environment tab and none of the Game tab's new city, solo,
// online or hostility controls; the character picks live only in the Character tab, all four for each player, and
// picking the other player's character swaps you. Two pretend controllers stand in for the players.
// Usage (from tools/ui, after: python3 ../build_ui.py ../../game/index.html ui.html): node coopmenu.js [outDir]
const {chromium}=require('playwright');const out=process.argv[2]||'shots';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.addInitScript(()=>{const mk=i=>({index:i,id:'pad'+i,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
  window.__pads=[mk(0),mk(1)];navigator.getGamepads=()=>window.__pads;
  window.__tap=async(i,btn)=>{const B=window.__pads[i].buttons[btn];B.pressed=true;B.value=1;await new Promise(r=>setTimeout(r,120));B.pressed=false;B.value=0;await new Promise(r=>setTimeout(r,120));};});
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);
const tap=(i,btn)=>p.evaluate(([i,btn])=>window.__tap(i,btn),[i,btn]);
const st=()=>p.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden&&e.offsetParent!==null;};
  return {menu:!document.getElementById('pause').hidden,who:vis('menuWho')?document.getElementById('menuWho').textContent:'',
    tabs:[...document.querySelectorAll('.tabs [role=tab]')].filter(t=>!t.hidden).map(t=>t.textContent.replace(/\d+$/,'')).join(','),
    game:['play','playCoop','newWorld','testWorld','onlineBtn','fullBtn','charLink'].filter(vis).join(','),hostility:!!document.querySelector('.hostmain').offsetParent,
    p1paused:!document.querySelectorAll('.view .ppause')[1].hidden,p2paused:!document.querySelectorAll('.view .ppause')[0].hidden,
    picks:[...document.querySelectorAll('#charSel .cs-row')].map(r=>(r.offsetParent?'':'(hidden)')+[...r.querySelectorAll('.cs-card')].filter(c=>c.getAttribute('aria-checked')==='true').map(c=>c.dataset.c).join()).join(' / '),
    names:[...document.querySelectorAll('.view .who')].reverse().map(e=>e.textContent).join(' + ')};});
console.log('title screen',JSON.stringify(await st()));
await p.screenshot({path:out+'/coop-title.png'});
await p.click('#tabBtnCustom');await p.waitForTimeout(200);await p.screenshot({path:out+'/coop-character-tab.png'});
await p.click('#tabBtnGame');
await p.click('#playCoop');await p.waitForTimeout(500);console.log('playing co-op',JSON.stringify(await st()));
await tap(1,9);await p.waitForTimeout(200);console.log('player two pressed Start',JSON.stringify(await st()));
await tap(1,3);await p.waitForTimeout(300);console.log('player two pressed Y',JSON.stringify(await st()));
await p.screenshot({path:out+'/coop-p2-menu.png'});
await tap(0,5);await p.waitForTimeout(200);console.log('player one pressed RB (ignored)',JSON.stringify(await st()));
for(let k=0;k<4;k++)await tap(1,5);await p.waitForTimeout(200);console.log('player two RB x4',JSON.stringify(await st()),await p.evaluate(()=>document.querySelector('.tabs [aria-selected=true]').textContent));
await p.click('#tabBtnCustom');await p.waitForTimeout(200);
await p.click('#charSel .cs-row[data-seat="1"] .cs-card[data-c="grizzle"]');await p.waitForTimeout(200);console.log('player two picked Grizzle',JSON.stringify(await st()));
await p.screenshot({path:out+'/coop-p2-character.png'});
await p.click('#charSel .cs-row[data-seat="1"] .cs-card[data-c="gus"]');await p.waitForTimeout(200);console.log('player two picked Gus (player one\'s): swapped',JSON.stringify(await st()));
await tap(1,9);await p.waitForTimeout(400);console.log('player two pressed Start: playing',JSON.stringify(await st()));
await tap(0,9);await p.waitForTimeout(200);await tap(0,3);await p.waitForTimeout(300);console.log('player one Start, Y',JSON.stringify(await st()));
await p.screenshot({path:out+'/coop-p1-menu.png'});
await p.click('#tabBtnCustom');await p.waitForTimeout(200);
await p.click('#charSel .cs-row[data-seat="0"] .cs-card[data-c="gnash"]');await p.waitForTimeout(200);console.log('player one picked Gnash',JSON.stringify(await st()));
await p.reload();await p.waitForTimeout(1500);console.log('after a reload',JSON.stringify(await st()));
console.log(errs.join('\n')||'no errors');await b.close();})();
