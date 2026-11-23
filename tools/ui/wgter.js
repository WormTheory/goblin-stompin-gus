// The World Generator's territories in a real browser (serving game/ itself): the map at seed 1 with the Territories
// layer (coloured land, borders, names, capitals), the hover naming the territory, the Territories sliders (redrawn
// without loading the game again), and the Noise view's Territories field. Screenshots to shotDir (work/territory-shots unless given).
// The page is opened as a browser with an older worker in its cache would see it: the plain gen-worker.js address answers
// with a worker that knows nothing (as an old copy knew nothing of territories, and the map was all sea); the page must
// load its own. The territories are checked by their colours on the canvas, not just by what the page says it did.
// node wgter.js [shotDir]   (from tools/ui)
const {chromium}=require('playwright'),{spawn}=require('child_process'),path=require('path'),fs=require('fs');
const out=process.argv[2]||path.join(__dirname,'..','..','work','territory-shots'),port=18000+Math.floor(Math.random()*900);
const srv=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',path.join(__dirname,'..','..','game')],{stdio:'ignore'});
const base='http://127.0.0.1:'+port+'/WorldGen/?seed=1';
let bad=0;const ok=(c,t)=>{if(!c)bad++;console.log((c?'  ok   ':'  BAD  ')+t);};
(async()=>{fs.mkdirSync(out,{recursive:true});await new Promise(r=>setTimeout(r,800));
  const b=await chromium.launch();const errs=[];
  const p=await b.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(String(e)));
  let stale=0;await p.route(/\/WorldGen\/gen-worker\.js$/,r=>{stale++;r.fulfill({contentType:'text/javascript',body:"onmessage=e=>postMessage({id:e.data.id,ok:{}});"});});
  // (how many territory colours fill the canvas: its pixels sampled on a grid, the sea's and the background's left out,
  // colours counted that are strongly coloured, as only the territories' are in the Noise view's field)
  const hues=()=>p.evaluate(()=>{const c=document.getElementById('map'),x=c.getContext('2d'),W=c.width,H=c.height,d=x.getImageData(0,0,W,H).data,n=new Map();
    for(let j=8;j<60;j++)for(let i=8;i<60;i++){const q=(Math.floor(H*j/68)*W+Math.floor(W*i/68))*4,r=d[q],g=d[q+1],b=d[q+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      if(mx-mn<70||(b>r+30&&b>g+10&&mx<170))continue;const k=(r>>5)+','+(g>>5)+','+(b>>5);n.set(k,(n.get(k)||0)+1);}
    return [...n.values()].filter(v=>v>=4).length;});p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text());});
  const settle=async()=>{await p.waitForFunction(()=>document.getElementById('msg').hidden,null,{timeout:300000,polling:50});
    for(;;){await p.waitForTimeout(150);if(await p.evaluate(()=>document.getElementById('busy').hidden)){await p.waitForTimeout(500);if(await p.evaluate(()=>document.getElementById('busy').hidden))return;}}};
  const tipAt=async(x,y)=>{await p.mouse.move(x,y);await p.mouse.move(x+1,y);await p.waitForTimeout(600);return p.evaluate(()=>document.getElementById('tip').innerText.replace(/\n/g,' | '));};
  let t0=Date.now();await p.goto(base);await p.waitForTimeout(1500);
  if(stale){ok(false,'the page asked for the plain worker address, which a cache may answer with an old copy');await b.close();srv.kill();console.log('1 BAD');process.exit(1);}
  await settle();console.log('map settled in',Date.now()-t0,'ms');
  ok(await p.evaluate(()=>document.getElementById('lay-ter').getAttribute('aria-pressed')==='true'),'Territories layer on');
  ok(stale===0,"the page's own worker loaded, never the plain address a cache may answer");
  if(out)await p.screenshot({path:out+'/wg_territories_near.png'});
  // (zoomed out a little so several territories show)
  await p.evaluate(()=>{for(let i=0;i<3;i++)document.getElementById('zout').click();});t0=Date.now();await settle();console.log('zoomed out, settled in',Date.now()-t0,'ms');
  if(out)await p.screenshot({path:out+'/wg_territories.png'});
  const tip=await tipAt(900,450);console.log('  hover:',tip);ok(/Kingdom|Principality|Duchy|Republic|Free State|Nation|Empire|Commonwealth|Confederacy|Federation|Theocracy|Tribal|Khanate|Chiefdom|Dominion|Horde/.test(tip),'hover names a territory');
  // (the sliders: Size 2, no new game loaded)
  const w0=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/index\.html/.test(e.name)).length);
  await p.evaluate(()=>{document.getElementById('terbox').open=true;const i=document.getElementById('sea_ter');i.value=2;i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'));});
  await p.waitForTimeout(400);t0=Date.now();await settle();console.log('Size ×2, settled in',Date.now()-t0,'ms');
  const w1=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/index\.html/.test(e.name)).length);
  ok(w1===w0,'the game not loaded again for the territories\' sliders ('+w0+' -> '+w1+')');
  ok(await p.evaluate(()=>new URL(location.href).searchParams.get('ter')==='2'),'in the address');
  if(out)await p.screenshot({path:out+'/wg_territories_size2.png'});
  // (the Noise view's field)
  await p.evaluate(()=>{const i=document.getElementById('sea_ter');i.value=1;i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'));});await p.waitForTimeout(300);await settle();
  await p.click('#vw-noise');await p.click('#nz-ter');
  await p.waitForFunction(()=>['done','far'].includes(document.getElementById('map').dataset.nz),null,{timeout:300000,polling:50});
  const st=await p.evaluate(()=>document.getElementById('map').dataset.nz);console.log('  noise field:',st);ok(st==='done','Noise view: territories drawn');
  const hn=await hues();ok(hn>=4,'Noise view: '+hn+' territory colours on the canvas');
  const nt=await tipAt(900,450);console.log('  noise hover:',nt);
  if(out)await p.screenshot({path:out+'/wg_noise_territories.png'});
  console.log('page errors/warnings:',errs.length?errs.slice(0,5).join(' || '):'none');ok(!errs.filter(e=>!/RTCPeerConnection/.test(e)).length,'no errors');
  await b.close();srv.kill();console.log(bad?bad+' BAD':'all ok');process.exit(bad?1:0);
})().catch(e=>{console.error(e);srv.kill();process.exit(1);});
