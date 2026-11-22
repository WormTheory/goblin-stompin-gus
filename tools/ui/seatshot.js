// The Controls screen's Players section and player two's own window (ui/seats.js), in the real page with real three.js:
// the list of inputs (keyboard and two pretend controllers), each one lighting up as it's used, Auto's seats, giving the
// keyboard to player two; then Second window and Co-op: the window opens, player two's HUD and picture are in it, the
// keyboard typed into it walks player two (not player one), a controller still walks player one; closing it brings back
// split screen. Screenshots of each go to outDir.
// Usage (from tools/ui, after: python ../build_3d.py ../../game/index.html t3.html): node seatshot.js [outDir]
const {chromium}=require('playwright');const fs=require('fs');const out=process.argv[2]||'shots-seats';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const mk=i=>({index:i,id:(i?'Wireless Controller':'Xbox 360 Controller')+' (STANDARD GAMEPAD)',connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
  window.__pads=[mk(0),mk(1)];navigator.getGamepads=()=>window.__pads;
  window.__tap=async(i,btn)=>{const B=window.__pads[i].buttons[btn];B.pressed=true;B.value=1;await new Promise(r=>setTimeout(r,120));B.pressed=false;B.value=0;await new Promise(r=>setTimeout(r,120));};});
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(4000);
const st=()=>p.evaluate(()=>{const G=window.__G,[P1,P2]=G.players,r=q=>[...document.querySelectorAll(q)];
  return {rows:r('#seatRows .seatrow').map(e=>e.querySelector('.seatname').textContent+'='+(e.querySelector('[aria-checked=true]')||{dataset:{seat:'-'}}).dataset.seat+(e.classList.contains('live')?'*':'')).join(' | '),
    auto:document.getElementById('seatAuto').hidden?'auto':'manual',p2active:P2.active,p2view:P2.ui.view.ownerDocument===document?'here':'window',
    p1:[P1.pos.x.toFixed(1),P1.pos.z.toFixed(1)].join(','),p2:[P2.pos.x.toFixed(1),P2.pos.z.toFixed(1)].join(','),p1pad:!!P1.pad,p2pad:!!P2.pad,divider:!document.getElementById('divider').hidden};});
await p.click('#play');await p.waitForTimeout(1500);
await p.keyboard.press('Escape');await p.waitForTimeout(400);
await p.click('#tabBtnControls',{force:true});await p.waitForTimeout(300);
console.log('controls, auto, alone',JSON.stringify(await st()));
await p.evaluate(()=>window.__tap(1,10));await p.waitForTimeout(80);
console.log('controller 2 pressed L3 (lit)',JSON.stringify(await st()));
await p.$eval('#seats',e=>e.scrollIntoView());await p.screenshot({path:out+'/players-auto.png'});
await p.click('#seatRows button[data-in="kb"][data-seat="2"]');await p.waitForTimeout(150);
console.log('keyboard given to player 2',JSON.stringify(await st()));
await p.click('#scrSeg button[data-scr="win"]');await p.waitForTimeout(150);
await p.screenshot({path:out+'/players-manual.png'});
console.log('open window button shown',await p.isVisible('#scrOpen'));
await p.click('#subBack',{force:true});await p.waitForTimeout(200);
const [w]=await Promise.all([p.waitForEvent('popup'),p.click('#playCoop')]);
await p.waitForTimeout(3000);
console.log('co-op in two windows',JSON.stringify(await st()));
console.log('popup has',await w.evaluate(()=>({canvas:!!document.querySelector('canvas.w2cv'),view:!!document.querySelector('.hud .view'),who:(document.querySelector('.view .who')||{}).textContent,fs:!document.querySelector('.w2fs').hidden,size:innerWidth+'x'+innerHeight})));
await p.screenshot({path:out+'/window1.png'});await w.screenshot({path:out+'/window2.png'});
// the keyboard in the second window walks player two
const a=await st();await w.bringToFront();await w.keyboard.down('KeyW');await w.waitForTimeout(1200);await w.keyboard.up('KeyW');await w.waitForTimeout(200);
const c=await st();console.log('W held in window 2: player one',a.p1,'->',c.p1,' player two',a.p2,'->',c.p2);
// a controller walks player one
await p.evaluate(()=>{window.__pads[0].axes[1]=-1;});await p.waitForTimeout(1200);await p.evaluate(()=>{window.__pads[0].axes[1]=0;});await p.waitForTimeout(200);
const d=await st();console.log('controller 1 stick: player one',c.p1,'->',d.p1,' player two',c.p2,'->',d.p2);
await w.screenshot({path:out+'/window2-walked.png'});
await w.close();await p.waitForTimeout(600);
console.log('window closed',JSON.stringify(await st()));
await p.screenshot({path:out+'/after-close.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
