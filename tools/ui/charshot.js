// The Character tab's character select (player one's row), in the real page (stub 3D): screenshots of the cards, picking each one with the
// mouse and with the arrow keys, what's remembered, and the name on the HUD once playing.
// Usage (from tools/ui, after: python3 ../build_ui.py ../../game/index.html ui.html): node charshot.js [outDir]
const {chromium}=require('playwright');const out=process.argv[2]||'shots';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:860},deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
await p.goto('file://'+process.cwd()+'/ui.html');await p.waitForTimeout(1500);await p.click('#tabBtnCustom');
const state=()=>p.evaluate(()=>({checked:[...document.querySelectorAll('#charSel [data-seat="0"] .cs-card')].filter(c=>c.getAttribute('aria-checked')==='true').map(c=>c.dataset.c).join(),
  note:document.getElementById('charNote').textContent,saved:localStorage.getItem('goblin-stompin-gus-character'),focus:document.activeElement&&document.activeElement.dataset.c||document.activeElement.id}));
console.log('at first',JSON.stringify(await state()));
await p.screenshot({path:out+'/char-gus.png'});
await p.click('#charSel [data-seat="0"] .cs-card[data-c="gertie"]');await p.waitForTimeout(200);console.log('clicked Gertie',JSON.stringify(await state()));
await p.screenshot({path:out+'/char-gertie.png'});
// keyboard: focus the cards, then right moves along them (rather than to the next tab)
await p.focus('#charSel [data-seat="0"] .cs-card[data-c="gertie"]');await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);console.log('arrow right',JSON.stringify(await state()));
await p.screenshot({path:out+'/char-gnash.png'});
await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);console.log('arrow right at the end',JSON.stringify(await state()));
await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await p.waitForTimeout(100);console.log('arrow left twice',JSON.stringify(await state()));
await p.keyboard.press('ArrowDown');await p.waitForTimeout(100);console.log('arrow down',JSON.stringify(await state()));
await p.keyboard.press('ArrowUp');await p.waitForTimeout(100);console.log('arrow up',JSON.stringify(await state()));
await p.click('#charSel [data-seat="0"] .cs-card[data-c="gnash"]');
await p.reload();await p.waitForTimeout(1500);await p.click('#tabBtnCustom');console.log('after a reload',JSON.stringify(await state()));
await p.click('#tabBtnGame');await p.click('#playCoop');await p.waitForTimeout(600);
console.log('playing co-op, HUD names',await p.evaluate(()=>[...document.querySelectorAll('.view .who')].map(e=>e.textContent+(e.classList.contains('p2')?'(p2)':'')).join(' ')));
await p.setViewportSize({width:390,height:800});await p.keyboard.press('Escape');await p.evaluate(()=>{document.getElementById('pause').hidden=false;});await p.waitForTimeout(300);
await p.screenshot({path:out+'/char-phone.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
