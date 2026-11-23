// The World Generator's Noise view in a real browser (serving game/ itself): opened at ?seed=1&noise=land (twice, the
// second warm) to the first pass drawn and the last done; every field in turn (timed, and what the hover reads); a
// slider moved (redrawn live, no reload, kept in the address); zooming; back to the map (reloaded, as the settings
// changed); and from the map to Noise and back with no reload. Then the map alone, for comparison.
// node wgnoise.js [shotDir]   (from tools/ui; the real graphics card when there is one)
const {chromium}=require('playwright'),{spawn}=require('child_process'),path=require('path');
const out=process.argv[2],port=18000+Math.floor(Math.random()*900),F=['land','t','m','bio','rug','h','riv','town'];
const srv=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',path.join(__dirname,'..','..','game')],{stdio:'ignore'});
const base='http://127.0.0.1:'+port+'/WorldGen/?seed=1';
let bad=0;const ok=(c,t)=>{if(!c)bad++;console.log((c?'  ok   ':'  BAD  ')+t);};
(async()=>{await new Promise(r=>setTimeout(r,800));
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=d3d11']});const errs=[];
  const page=async()=>{const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errs.push(String(e)));return p;};
  const passes=p=>p.evaluate(()=>+document.getElementById('map').dataset.nzp||0);
  const first=p=>p.waitForFunction(()=>+document.getElementById('map').dataset.nzp>=1,null,{timeout:300000,polling:20});
  const done=p=>p.waitForFunction(()=>document.getElementById('map').dataset.nz==='done',null,{timeout:300000,polling:20});
  // (the map: shown, and nothing left to ask for for 400 ms running)
  const settle=async p=>{await p.waitForFunction(()=>document.getElementById('msg').hidden,null,{timeout:300000,polling:20});
    for(;;){await p.waitForTimeout(100);if(await p.evaluate(()=>document.getElementById('busy').hidden)){const t=Date.now();await p.waitForTimeout(400);if(await p.evaluate(()=>document.getElementById('busy').hidden))return t;}}};
  const tipAt=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.move(x+1,y);await p.waitForTimeout(120);return p.evaluate(()=>document.getElementById('tip').innerText.replace(/\n/g,' | '));};
  console.log('Noise view, seed 1, 1280 x 800');
  for(let run=0;run<2;run++){const p=await page(),t0=Date.now();await p.goto(base+'&noise=land');
    await first(p);const t1=Date.now()-t0;await done(p);
    console.log((run?'warm':'cold')+': first pass '+t1+' ms, sharp '+(Date.now()-t0)+' ms');
    if(!run){ok(await passes(p)===4,'four passes');ok(await p.evaluate(()=>[...document.querySelectorAll('.mo')].every(e=>e.hidden)),"the map's own controls hidden");await p.close();continue;}
    for(const f of F){const a=Date.now();if(f!=='land'){await p.click('#nz-'+f);await p.waitForTimeout(30);await first(p);}const c=Date.now()-a;await done(p);
      const tl=await tipAt(p,900,300),ts=await tipAt(p,450,150);   // (inland east of the start, and out at sea north-west of it, clear of the panel)
      console.log('  '+f.padEnd(5)+' first pass '+String(c).padStart(4)+' ms, sharp '+String(Date.now()-a).padStart(5)+' ms   land: '+tl+'   sea: '+ts);
      ok(/Sea/.test(ts)&&!/Sea/.test(tl.split('|')[0]),f+': land and sea read');
      ok(await p.evaluate(f=>new URL(location.href).searchParams.get('noise')===f,f),f+': in the address');
      if(out)await p.screenshot({path:out+'/nz_'+f+'.png'});}
    await p.click('#nz-land');await done(p);
    // (a slider: Land +1.5, live: no new worker, no reload)
    await p.evaluate(()=>{document.getElementById('seabox').open=true;window.__w0=performance.getEntriesByType('resource').filter(e=>/gen-worker/.test(e.name)).length;});
    const seaShare=(p2)=>(p2||p).evaluate(()=>{const c=document.getElementById('map'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=64)if(d[i+2]>d[i+1]+20)n++;return n/(d.length/64);});
    const before=await seaShare();
    const a=Date.now();await p.evaluate(()=>{const i=document.getElementById('sea_land');i.value=1.5;i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'));});
    await p.waitForFunction(()=>document.getElementById('map').dataset.nz!=='done',null,{timeout:5000,polling:10});await done(p);
    const after=await seaShare();
    console.log('  slider Land +1.5: sharp '+(Date.now()-a)+' ms; sea '+(before*100).toFixed(0)+'% of the view before, '+(after*100).toFixed(0)+'% after');
    const q=await page();await q.goto(base+'&noise=land&land=1.5');await done(q);const fresh=await seaShare(q);await q.close();
    ok(after<before&&Math.abs(after-fresh)<0.002,'more land, and the same as loading the game with that setting ('+(fresh*100).toFixed(1)+'% sea)');
    ok(await p.evaluate(()=>/land=1\.5/.test(location.search)&&performance.getEntriesByType('resource').filter(e=>/gen-worker/.test(e.name)).length===window.__w0),'kept in the address, no new worker');
    if(out)await p.screenshot({path:out+'/nz_slider.png'});
    // (more sliders, each changed live on its own field, the picture against a fresh load of the same address)
    const dig=p2=>p2.evaluate(()=>{const c=document.getElementById('map'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=4)h=(h*31+d[i]*7+d[i+1]*3+d[i+2])%1000000007;return h;});
    for(const [f,k,v] of [['town','clu',1],['town','towns',0.5],['t','temp',0.3],['h','mtn',0.4],['riv','riv',2],['bio','rain',-0.3]]){
      await p.click('#nz-'+f);await done(p);const d0=await dig(p);
      await p.evaluate(([k,v])=>{const i=document.getElementById('sea_'+k);i.value=v;i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'));},[k,v]);
      await p.waitForFunction(()=>document.getElementById('map').dataset.nz!=='done',null,{timeout:5000,polling:10});await done(p);const d1=await dig(p);
      const q=await page();await q.goto(p.url());await done(q);const d2=await dig(q);await q.close();
      ok(d1!==d0&&d1===d2,f+' with '+k+' '+v+': changed live, the same as a fresh load'+(d1!==d0&&d1===d2?'':' ('+[d0,d1,d2]+')'));if(d1!==d2&&out){await p.screenshot({path:out+'/bad_'+k+'_live.png'});const q2=await page();await q2.goto(p.url());await done(q2);await q2.screenshot({path:out+'/bad_'+k+'_fresh.png'});await q2.close();}
      if(out)await p.screenshot({path:out+'/nz_'+f+'_'+k+'.png'});}
    const z=Date.now();await p.mouse.move(640,400);await p.mouse.wheel(0,-800);await p.waitForTimeout(150);await done(p);console.log('  zoomed in: sharp '+(Date.now()-z)+' ms');
    const m=Date.now();await p.click('#vw-map');await p.waitForTimeout(100);const me=await settle(p);
    console.log('  back to Map (settings changed, so reloaded): '+(Date.now()-m)+' ms to everything in view');
    ok(await p.evaluate(()=>document.getElementById('nzBox').hidden&&![...document.querySelectorAll('.mo')].some(e=>e.hidden)&&!/noise/.test(location.search)),'the map as it was');
    await p.close();}
  {const p=await page();await p.goto(base);await p.waitForFunction(()=>document.getElementById('msg').hidden,null,{timeout:300000});
    await p.waitForFunction(()=>document.getElementById('busy').hidden,null,{timeout:300000,polling:100});
    const a=Date.now();await p.click('#vw-noise');await p.click('#nz-t');await done(p);console.log('Map to Noise (Temperature), no reload: sharp '+(Date.now()-a)+' ms');
    const c=Date.now();await p.click('#vw-map');await p.waitForTimeout(150);
    ok(await p.evaluate(()=>document.getElementById('msg').hidden&&document.getElementById('busy').hidden),'and back to the map at once ('+(Date.now()-c)+' ms)');
    await p.close();}
  // (the map alone, as it was, to compare)
  for(let run=0;run<2;run++){const p=await page(),t0=Date.now();await p.goto(base);
    await p.waitForFunction(()=>document.getElementById('msg').hidden,null,{timeout:300000,polling:20});const t1=Date.now()-t0;
    const te=await settle(p);console.log('Map '+(run?'warm':'cold')+': ready '+t1+' ms, everything in view '+(te-t0)+' ms');await p.close();}
  // (RTCPeerConnection: the game's online code looking for WebRTC in the map's second worker, as before)
  const e2=errs.filter(e=>!/RTCPeerConnection/.test(e));console.log(e2.length?'errors:\n'+e2.join('\n'):'no errors');
  console.log(bad?bad+' BAD':'all ok');await b.close();srv.kill();})().catch(e=>{console.error(e);srv.kill();process.exit(1);});
