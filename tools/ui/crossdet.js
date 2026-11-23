// Runs the cross-browser determinism check (crossdet.html, crossdet.py): Chromium through Playwright, then Firefox headless
// if it's installed (FIREFOX= its path; the usual Windows one by default). node crossdet.js
const cp=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const PORT=8741,URL=b=>`http://127.0.0.1:${PORT}/tools/ui/crossdet.html?b=${b}`;
for(const f of fs.readdirSync(__dirname))if(/^crossdet-.*\.json$/.test(f))fs.unlinkSync(path.join(__dirname,f));
const srv=cp.spawn(process.env.PY||'python',[path.join(__dirname,'crossdet.py'),String(PORT)],{stdio:['ignore','pipe','inherit']});
srv.stdout.on('data',d=>process.stdout.write(d));
const wait=(f,s)=>new Promise(r=>{const t0=Date.now(),i=setInterval(()=>{if(fs.existsSync(f)||Date.now()-t0>s*1000){clearInterval(i);r(fs.existsSync(f));}},500);});
(async()=>{await new Promise(r=>setTimeout(r,1200));
  const {chromium}=require('playwright');const B=await chromium.launch();const pg=await B.newPage();await pg.goto(URL('chromium'));
  await wait(path.join(__dirname,'crossdet-chromium.json'),600);await B.close();
  const FF=process.env.FIREFOX||'C:/Program Files/Mozilla Firefox/firefox.exe';
  if(fs.existsSync(FF)){const prof=fs.mkdtempSync(path.join(os.tmpdir(),'crossdet-ff-'));
    const ff=cp.spawn(FF,['-headless','-no-remote','-profile',prof,URL('firefox')],{stdio:'ignore'});
    const ok=await wait(path.join(__dirname,'crossdet-firefox.json'),600);try{ff.kill();}catch(e){}if(!ok)console.log('firefox: no answer');}
  else console.log('no Firefox at',FF);
  // (node too: the same worker's sums, for the tests' own engine)
  await new Promise(r=>setTimeout(r,800));srv.kill();
  for(const f of fs.readdirSync(__dirname))if(/^crossdet-.*\.json$/.test(f)){const o=JSON.parse(fs.readFileSync(path.join(__dirname,f)));console.log(f,o.error||('chunks '+o.out.length+' numbers '+o.nums+' ms '+o.ms+' '+o.ua));}
})();
