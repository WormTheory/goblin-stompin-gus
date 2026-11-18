// Photographs the vehicle instruments page made by tools/tests/instsheet.js. node instshot.js in.html out.png
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1});
await p.goto('file://'+path.resolve(process.argv[2]||'inst.html'));await p.waitForTimeout(1500);
await p.screenshot({path:process.argv[3]||'inst.png',fullPage:true});await b.close();})();
