// The Open games list in a real browser: tabs of one browser joined through the "two tabs of this browser" transport.
// One tab hosts a listed game, another hosts a private one, and a third opens Play online: it should list the first
// and not the second, join it with one click (reloading into the host's city), and see it leave the list when it
// stops hosting. Screenshots of the panel at each step.
// Usage, from tools/ui after `python tools/build_3d.py game/index.html tools/ui/t3.html`: node lobbyshot.js [seed] [outDir]
// (P2P=1: through Trystero and the internet, rather than between the tabs directly)
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const seed=+(process.argv[2]||12345),out=process.argv[3]||'lobbyshots';
const P2P=!!process.env.P2P;
const ROOT=path.resolve(__dirname,'..','..');
const SAVE_KEY=fs.readFileSync(path.join(__dirname,'t3.html'),'utf8').match(/SAVE_KEY='([^']+)'/)[1];
const three=path.dirname(require.resolve('three/build/three.min.js'));
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);
  const f=u.startsWith('/node_modules/three/build/')?path.join(three,path.basename(u)):path.join(ROOT,u);
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript':'application/octet-stream'});r.end(d);});});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  fs.mkdirSync(out,{recursive:true});await new Promise(r=>srv.listen(0,r));const url='http://localhost:'+srv.address().port+'/tools/ui/t3.html';
  const opt={args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']};
  if(process.env.CHROME)opt.executablePath=process.env.CHROME;
  const b=await chromium.launch(opt);
  const ctx=await b.newContext({viewport:{width:960,height:720}});
  await ctx.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
  const errs=[];const watch=(p,n)=>{p.on('pageerror',e=>errs.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(n+': '+m.text().slice(0,200));});};
  const tab=async(n,priv)=>{const p=await ctx.newPage();watch(p,n);await p.goto(url);await wait(2500);
    await p.click('#onlineBtn');if(!P2P)await p.check('#netLocal');if(priv!==undefined)await p.setChecked('#netPrivate',priv);return p;};
  const games=p=>p.$$eval('#netGames .on-game',L=>L.map(b=>b.textContent+(b.disabled?' (disabled)':'')));
  const note=p=>p.textContent('#netGamesNote');
  const until=async(f,ms)=>{const t=Date.now();while(Date.now()-t<ms){if(await f())return true;await wait(250);}return false;};
  // a listed host and a private one
  const A=await tab('hostA',false);await A.click('#netHost');
  const codeA=await (async()=>{let c='';for(let i=0;i<20&&!c;i++){await wait(250);c=(await A.textContent('#netCodeShow')).trim();}return c;})();
  const C=await tab('hostC',true);await C.click('#netHost');
  const codeC=await (async()=>{let c='';for(let i=0;i<20&&!c;i++){await wait(250);c=(await C.textContent('#netCodeShow')).trim();}return c;})();
  console.log('listed host',codeA,'· private host',codeC);
  // the private one's tick box is kept for next time in this browser: the browsing tab unticks it (it's not hosting)
  const B=await tab('browser',false);
  const t0=Date.now();const seen=await until(async()=>(await games(B)).some(s=>s.includes(codeA)),8000);
  console.log('browser lists the listed game:',seen?'ok, after '+((Date.now()-t0)/1000).toFixed(1)+' s':'BAD');
  await wait(3500);
  const L=await games(B);console.log('browser list:',JSON.stringify(L));
  console.log('private game kept off the list:',L.some(s=>s.includes(codeC))?'BAD':'ok');
  console.log('host A sees its own game listed:',(await games(A)).some(s=>s.includes(codeA))?'BAD':'no, ok','· host A list',JSON.stringify(await games(A)));
  await B.screenshot({path:out+'/1-list.png'});
  const pan=await B.$('#onlinePanel');if(pan)await pan.screenshot({path:out+'/1-panel.png'});
  // join with one click: the tab reloads into the host's city and joins again by itself
  await B.click('#netGames .on-game[data-code="'+codeA+'"]');
  let st='';for(let i=0;i<120;i++){await wait(500);try{st=await B.textContent('#netStatus');if(/Playing online/.test(st))break;}catch(e){}}
  console.log('browser after clicking it:',st);
  await wait(1500);
  console.log('host A status:',await A.textContent('#netStatus'));
  // another browsing tab sees two players in it now, then sees it go when A stops hosting
  const D=await tab('browser2',false);
  await until(async()=>(await games(D)).some(s=>s.includes(codeA)),8000);
  console.log('second browser list:',JSON.stringify(await games(D)));
  await D.screenshot({path:out+'/2-list-two-players.png'});
  await A.bringToFront();await A.click('#netLeave');
  const t1=Date.now();const went=await until(async()=>!(await games(D)).some(s=>s.includes(codeA)),12000);
  console.log('stopped hosting: gone from the list',went?'ok, after '+((Date.now()-t1)/1000).toFixed(1)+' s':'BAD');
  console.log('second browser list now:',JSON.stringify(await games(D)),'note:',await note(D));
  // closing the panel leaves the lobby; opening it again finds what's there afresh
  await D.click('#onlineBtn');await wait(500);await D.click('#onlineBtn');await wait(300);
  console.log('panel reopened, note:',await note(D));
  await wait(4500);console.log('then:',await note(D));
  await D.screenshot({path:out+'/3-empty.png'});
  console.log('page errors:',errs.length?errs.join(' | '):'none');
  await b.close();srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
