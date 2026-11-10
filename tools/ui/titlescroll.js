// The title menu as the page loads: no scroll bar, and nothing that could show one, at common window sizes. Scroll bars
// are drawn (Playwright's --hide-scrollbars is left off) and the web fonts are let through but held back (FONT_MS,
// default 1500), so the first layouts use the fallback fonts as on a slow connection. Every element that could scroll
// (overflowing an auto or scroll box) or has a scroll bar's gutter is listed, 20 times a second for 3.5 s.
// Usage (from tools/ui, after: python3 ../build_ui.py ../../game/index.html ui.html): node titlescroll.js [outDir]
const {chromium}=require('playwright');const out=process.argv[2]||'shots';const FD=+(process.env.FONT_MS||1500);
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});let bad=0;
for(const [w,h] of [[1280,720],[1366,768],[1920,1080],[1920,953],[1280,600]]){const p=await b.newPage({viewport:{width:w,height:h}});
  await p.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();
    if(/fonts\.(googleapis|gstatic)/.test(u)){await new Promise(q=>setTimeout(q,FD));return r.continue().catch(()=>{});}return r.abort();});
  await p.goto('file://'+process.cwd()+'/ui.html',{waitUntil:'commit'});const seen=new Set();
  for(let i=0;i<70;i++){await p.waitForTimeout(50);
    const r=await p.evaluate(()=>{if(!document.getElementById('pause')||!document.getElementById('pause').classList.contains('title'))return null;
      return [...document.querySelectorAll('#pause *')].filter(e=>{if(!e.getClientRects().length)return false;const s=getComputedStyle(e);
        const gut=e.offsetWidth-e.clientWidth-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth);
        return (/(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight&&s.scrollbarWidth!=='none')||(/(auto|scroll)/.test(s.overflowX)&&e.scrollWidth>e.clientWidth&&s.scrollbarWidth!=='none')||(gut>0.5&&e.clientWidth>0);})
        .map(e=>(e.id||String(e.className).slice(0,24)||e.tagName)+' '+e.scrollHeight+'/'+e.clientHeight).join(' | ');}).catch(()=>null);
    if(r===null)continue;if(r)bad++;
    const line=(r?'BAD ':'ok  ')+w+'x'+h+' '+(r||'nothing can show a scroll bar');if(!seen.has(line)){seen.add(line);console.log(line,'(from '+i*50+' ms)');}}
  await p.screenshot({path:out+'/title-'+w+'x'+h+'.png'});await p.close();}
console.log(bad?'scroll bars possible':'all ok');await b.close();})();
