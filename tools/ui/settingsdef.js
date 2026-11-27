// Settings' Defaults buttons in the real page: every setting is changed, each tab's Defaults pressed, and what the tabs
// show (and still show after a reload) compared with a fresh page's. node settingsdef.js, after build_3d (t3.html)
const {chromium}=require('playwright'),path=require('path');
const TABS=['tabControls','tabGameplay','tabPerf','tabDisplay','tabMulti'];
const snap=p=>p.evaluate(T=>{const o={};for(const id of T){const pane=document.getElementById(id),L=[];
  for(const el of pane.querySelectorAll('input[type=range]'))L.push(el.id+'='+el.value);
  for(const el of pane.querySelectorAll('.tog[role=checkbox]'))L.push((el.id||el.dataset.k)+'='+el.getAttribute('aria-checked'));
  for(const g of pane.querySelectorAll('.seg')){const c=g.querySelector('[aria-checked="true"]');L.push((g.id||g.getAttribute('aria-label'))+'='+(c&&c.textContent));}
  o[id]=L;}return o;},TABS);
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:800}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'t3.html'));await p.waitForTimeout(2500);
  const fresh=await snap(p);
  // change everything: sliders to their far end, switches flipped, the other button of each row
  await p.evaluate(T=>{for(const id of T){const pane=document.getElementById(id);
    for(const el of pane.querySelectorAll('input[type=range]')){el.value=el.min;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
    for(const el of pane.querySelectorAll('.tog[role=checkbox]'))el.click();
    for(const g of pane.querySelectorAll('.seg')){const n=[...g.querySelectorAll('button')].find(x=>x.getAttribute('aria-checked')!=='true');if(n)n.click();}}},TABS);
  const changed=await snap(p);let nch=0;for(const t of TABS)nch+=changed[t].filter((x,i)=>x!==fresh[t][i]).length;
  await p.click('#optBtn');await p.waitForTimeout(300);
  for(const t of TABS){await p.click('#tabBtn'+t.slice(3));await p.waitForTimeout(200);await p.click(`[data-def="${t}"]`);await p.waitForTimeout(200);}
  const after=await snap(p);
  await p.reload();await p.waitForTimeout(2500);const reload=await snap(p);
  let bad=0;for(const t of TABS)for(const [nm,S] of [['after Defaults',after],['after a reload',reload]])fresh[t].forEach((x,i)=>{if(S[t][i]!==x){bad++;console.log(t,nm,'want',x,'got',S[t][i]);}});
  console.log('settings changed',nch,'| differing from a fresh page after Defaults and a reload',bad);
  console.log('errors',errs.length,errs.slice(0,3));await b.close();process.exit(bad||errs.length?1:0);})();
