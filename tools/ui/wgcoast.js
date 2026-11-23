// The World Generator's Coasts and Wonders layers in a real browser (serving game/ itself): seed 1 zoomed in on the
// waterfalls and rugged shores north-east of the start, counting the wonders' markers and the coloured shore plots, and
// the legend's entries. Screenshots to shotDir if given.
// node wgcoast.js [shotDir]   (from tools/ui)
const {chromium}=require('playwright'),{spawn}=require('child_process'),path=require('path');
const out=process.argv[2],port=18000+Math.floor(Math.random()*900);
const srv=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',path.join(__dirname,'..','..','game')],{stdio:'ignore'});
const base='http://127.0.0.1:'+port+'/WorldGen/?seed=1';
let bad=0;const ok=(c,t)=>{if(!c)bad++;console.log((c?'  ok   ':'  BAD  ')+t);};
(async()=>{await new Promise(r=>setTimeout(r,800));
  const b=await chromium.launch();const errs=[];
  const p=await b.newPage({viewport:{width:1400,height:900}});p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text());});
  const settle=async()=>{await p.waitForFunction(()=>document.getElementById('msg').hidden,null,{timeout:300000,polling:50});
    for(;;){await p.waitForTimeout(150);if(await p.evaluate(()=>document.getElementById('busy').hidden)){await p.waitForTimeout(500);if(await p.evaluate(()=>document.getElementById('busy').hidden))return;}}};
  await p.goto(base);await settle();
  ok(await p.evaluate(()=>document.getElementById('lay-wd').getAttribute('aria-pressed')==='true'&&document.getElementById('lay-coast').getAttribute('aria-pressed')==='true'),'Coasts and Wonders layers on');
  const leg=await p.evaluate(()=>document.getElementById('legend').innerText);
  ok(/Waterfall/.test(leg)&&/Stone arch/.test(leg)&&/Fjord/.test(leg)&&/Mangroves/.test(leg)&&/Ice shelf/.test(leg),'legend has the wonders and the coasts');
  for(const [nm,X,Z,S] of [['wg_wonders',130,-170,5],['wg_wonders_close',150,-122,14],['wg_coasts',-200,0,4]]){
    await p.evaluate(([X,Z,S])=>window.__wg.go(X,Z,S),[X,Z,S]);await p.waitForTimeout(300);await settle();
    const n=await p.evaluate(()=>{let w=0,c=0,k={};for(const d of window.__wg.det()){w+=d.wd.length;for(const q of d.wd)k[q[2]]=(k[q[2]]||0)+1;if(d.cc)c++;}return {w,c,k};});
    console.log(' ',nm,'wonders',n.w,JSON.stringify(n.k),'| tiles with coloured shores',n.c);
    if(nm==='wg_wonders')ok(n.w>0,'wonders found');if(nm==='wg_coasts')ok(n.c>0,'shores coloured');
    if(out)await p.screenshot({path:out+'/'+nm+'.png'});}
  console.log('page errors/warnings:',errs.length?errs.slice(0,5).join(' || '):'none');ok(!errs.filter(e=>!/RTCPeerConnection/.test(e)).length,'no errors');
  await b.close();srv.kill();console.log(bad?bad+' BAD':'all ok');process.exit(bad?1:0);
})().catch(e=>{console.error(e);srv.kill();process.exit(1);});
