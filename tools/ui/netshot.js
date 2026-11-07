// Online co-op in a real browser: two tabs of one browser joined through the "two tabs of this browser" transport
// (a BroadcastChannel), with the real three.js. The host opens a room from the Play online panel, the guest types in
// the code and joins (reloading into the host's city), walks forward, and the host smashes the ground beside the
// guest; both tabs are screenshotted at each step, and where each thinks the guest's hippo is gets compared.
// Usage, from tools/ui after `python tools/build_3d.py game/index.html tools/ui/t3.html`: node netshot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const seed=+(process.argv[2]||12345),out=process.argv[3]||'netshots';
// (P2P=1: through Trystero and the internet, as two players far apart would be, rather than between the tabs directly)
const P2P=!!process.env.P2P;
const ROOT=path.resolve(__dirname,'..','..');
const SAVE_KEY=fs.readFileSync(path.join(__dirname,'t3.html'),'utf8').match(/SAVE_KEY='([^']+)'/)[1];
// (served over http, so both tabs share an origin and the BroadcastChannel joins them; three.js from wherever node finds it)
const three=path.dirname(require.resolve('three/build/three.min.js'));
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);
  const f=u.startsWith('/node_modules/three/build/')?path.join(three,path.basename(u)):path.join(ROOT,u);
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript':'application/octet-stream'});r.end(d);});});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  fs.mkdirSync(out,{recursive:true});await new Promise(r=>srv.listen(0,r));const url='http://localhost:'+srv.address().port+'/tools/ui/t3.html';
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await b.newContext({viewport:{width:960,height:600}});
  await ctx.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));},[SAVE_KEY,seed]);
  const errs=[];const watch=(p,n)=>{p.on('pageerror',e=>errs.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(n+': '+m.text().slice(0,200));});};
  const A=await ctx.newPage();watch(A,'host');await A.goto(url);await wait(3000);
  await A.click('#onlineBtn');if(!P2P)await A.check('#netLocal');await A.click('#netHost');
  let code='';for(let i=0;i<20&&!code;i++){await wait(250);code=(await A.textContent('#netCodeShow')).trim();}
  console.log('host room code',code||'(none)');
  await A.screenshot({path:out+'/0-host-menu.png'});if(!code){console.log('host status:',await A.textContent('#netStatus'));}
  await A.click('#play');await wait(1500);
  const B=await ctx.newPage();watch(B,'guest');await B.goto(url);await wait(3000);
  await B.click('#onlineBtn');if(!P2P)await B.check('#netLocal');await B.fill('#netCode',code);await B.click('#netJoin');
  // (it reloads into the host's city, then joins again by itself)
  let st='';for(let i=0;i<120;i++){await wait(500);try{st=await B.textContent('#netStatus');if(/Playing online/.test(st))break;}catch(e){}}
  console.log('guest status:',st);
  await wait(3000);
  const where=async()=>{const h=await A.evaluate(()=>{const P=window.__G.players;return P.map(p=>({a:p.active,x:p.pos.x,y:p.pos.y,z:p.pos.z}));});
    const g=await B.evaluate(()=>{const P=window.__G.players;return P.map(p=>({a:p.active,x:p.pos.x,y:p.pos.y,z:p.pos.z}));});
    const d=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z).toFixed(2);
    return 'host sees guest at '+[h[1].x,h[1].y,h[1].z].map(v=>v.toFixed(1)).join(',')+' · guest itself '+[g[0].x,g[0].y,g[0].z].map(v=>v.toFixed(1)).join(',')+' · apart '+d(h[1],g[0])+' · host hippo apart '+d(h[0],g[1]);};
  console.log('joined:',await where());
  await A.screenshot({path:out+'/1-host.png'});await B.screenshot({path:out+'/1-guest.png'});
  // the guest walks forward
  await B.bringToFront();
  // (a tab that's lost the mouse pauses itself, as it would for anyone; Play carries on in the same online game)
  await B.evaluate(()=>{if(!document.getElementById('pause').hidden)document.getElementById('play').click();});await wait(300);
  await B.keyboard.down('KeyW');await wait(1800);await B.keyboard.up('KeyW');await wait(600);
  console.log('after the guest walked:',await where());
  await A.screenshot({path:out+'/2-host.png'});await B.screenshot({path:out+'/2-guest.png'});
  // the host's game smashes a crater right beside the guest
  const n0=await B.evaluate(()=>Object.keys(window.__G.editsNow()).length);
  await A.evaluate(()=>{const G=window.__G,p=G.players[1].pos;G.crush(Math.floor(p.x+4),Math.floor(p.y)+1,Math.floor(p.z),3,-2,3);});
  await wait(1500);
  const n1=await B.evaluate(()=>Object.keys(window.__G.editsNow()).length),nh=await A.evaluate(()=>Object.keys(window.__G.editsNow()).length);
  console.log('smashed blocks: host has',nh,'edits, guest had',n0,'and now has',n1);
  await A.screenshot({path:out+'/3-host.png'});await B.screenshot({path:out+'/3-guest.png'});
  // the host's tab goes into the background, as one of two tabs always is: the browser stops giving it animation frames,
  // so its game must run on from the worker's timer, or the guest's world freezes. (Playwright never really hides a
  // tab, so it's done by hand: the page says it's hidden, and its animation frames are held back till it's shown.)
  await A.evaluate(()=>{window.__raf=window.requestAnimationFrame;window.__rq=[];window.requestAnimationFrame=f=>{window.__rq.push(f);return 1;};
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await wait(500);
  const hb=await A.evaluate(()=>{const p=window.__G.players[1].pos;return [p.x,p.z];}),sn0=await B.evaluate(()=>window.__G.NET.cur?window.__G.NET.cur.n:0);
  await B.bringToFront();await B.keyboard.down('KeyW');await wait(2000);await B.keyboard.up('KeyW');await wait(800);
  const ha=await A.evaluate(()=>{const p=window.__G.players[1].pos;return [p.x,p.z];}),sn1=await B.evaluate(()=>window.__G.NET.cur?window.__G.NET.cur.n:0);
  console.log('host tab hidden: guest walked',Math.hypot(ha[0]-hb[0],ha[1]-hb[1]).toFixed(2),'on the host',Math.hypot(ha[0]-hb[0],ha[1]-hb[1])>2?'ok':'BAD','| snapshots meanwhile',sn1-sn0,sn1-sn0>=20?'ok':'BAD');
  await A.evaluate(()=>{delete document.hidden;window.requestAnimationFrame=window.__raf;for(const f of window.__rq)window.__raf(f);document.dispatchEvent(new Event('visibilitychange'));});
  await wait(500);
  // (THIRD=1: a third tab joins too, and every tab should see three hippos)
  if(process.env.THIRD){const C=await ctx.newPage();watch(C,'third');await C.goto(url);await wait(3000);
    await C.click('#onlineBtn');if(!P2P)await C.check('#netLocal');await C.fill('#netCode',code);await C.click('#netJoin');
    let s3='';for(let i=0;i<120;i++){await wait(500);try{s3=await C.textContent('#netStatus');if(/Playing online/.test(s3))break;}catch(e){}}
    await wait(3000);const n=async P=>P.evaluate(()=>window.__G.players.filter(p=>p.active).length);
    console.log('third tab:',s3,'| players each tab sees: host',await n(A),'guest',await n(B),'third',await n(C));
    await A.screenshot({path:out+'/4-host.png'});await C.screenshot({path:out+'/4-third.png'});}
  console.log(errs.length?errs.slice(0,20).join('\n'):'no errors');
  await b.close();srv.close();
})();
