// Online chat in a real browser: two tabs joined as in netshot.js (whose start this copies). The guest presses Enter,
// types a line holding W the while, and sends it; the host's tab must show it (as text) and the guest mustn't have walked.
// Then the host sends one with a controller's worth of keys, and voice chat is tried between the tabs, where it should
// say it needs a game over the internet without ever asking for the microphone. Both tabs are screenshotted.
// Usage, from tools/ui after `python tools/build_3d.py game/index.html tools/ui/t3.html`: node chatshot.js [seed] [outDir]
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const seed=+(process.argv[2]||12345),out=process.argv[3]||'chatshots';
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
  await ctx.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));
    // (counted: voice chat mustn't ask for the microphone unless it's switched on, and can't be between two tabs)
    window.__gum=0;try{const md=navigator.mediaDevices;if(md){const g=md.getUserMedia.bind(md);md.getUserMedia=c=>{window.__gum++;return g(c);};}}catch(e){}},[SAVE_KEY,seed]);
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
  const pos=async()=>B.evaluate(()=>{const p=window.__G.players[0].pos;return [p.x,p.y,p.z];});
  if(await B.evaluate(()=>window.__G.menuOpen)){await B.click('#play');await wait(800);}   // (back to the game from the menu, as a player would)
  if(process.env.DBG)console.log('guest state',await B.evaluate(()=>{const G=window.__G;return JSON.stringify({menu:G.menuOpen,playing:G.playing,avail:G.chatAvail(),show:G.CHAT.show,paused:G.players[0].paused,kbd:G.DT.kbdOpen,mode:G.NET.mode,joined:G.NET.joined,host:!!G.NET.host});}));
  await B.keyboard.press('Enter');await wait(300);
  await A.evaluate(()=>{window.__G.DT.host=0;});   // (Passive: no goblin knocking the guest about while it's measured standing still)
  await wait(700);const p0=await pos();   // (where it stands once the chat's open: settled from the click back into the game)
  const open=await B.evaluate(()=>!document.getElementById('chatIn').hidden&&document.activeElement===document.getElementById('chatIn'));
  await B.keyboard.down('KeyW');await B.keyboard.type('wasd <b>bold?</b> hello from the guest',{delay:15});await wait(600);
  await B.screenshot({path:out+'/1-guest-typing.png'});
  const inp=await B.evaluate(()=>{const I=window.__G.players[0].in;return [I.x,I.z,I.jump,I.bite];});console.log('controls while typing with W held',JSON.stringify(inp),inp.every(v=>!v)?'ok':'BAD');
  if(process.env.DBG)console.log('while typing',await B.evaluate(()=>{const p=window.__G.players[0];return JSON.stringify({in:{x:p.in.x,z:p.in.z,jump:p.in.jump},state:p.state,hp:p.hp,vel:p.vel&&[p.vel.x,p.vel.y,p.vel.z]});}));
  await B.keyboard.press('Enter');await B.keyboard.up('KeyW');await wait(800);
  const p1=await pos();const moved=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]);
  const hostSaw=await A.evaluate(()=>[...document.querySelectorAll('#chatLog .chat-ln')].map(e=>e.textContent));
  const bold=await A.evaluate(()=>document.querySelectorAll('#chatLog b').length);
  console.log('guest: chat opened and focused',open,'| walked while typing',moved.toFixed(2),moved<0.3?'ok':'BAD','| host shows',JSON.stringify(hostSaw),hostSaw.some(t=>t.includes('<b>bold?</b> hello from the guest'))?'ok':'BAD','| markup made',bold,bold?'BAD':'ok');
  await A.bringToFront();await A.keyboard.press('Enter');await wait(200);await A.keyboard.type('and hello back',{delay:10});await A.keyboard.press('Enter');await wait(800);
  const guestSaw=await B.evaluate(()=>[...document.querySelectorAll('#chatLog .chat-ln')].map(e=>e.textContent));
  console.log('guest shows',JSON.stringify(guestSaw),guestSaw.some(t=>t.includes('and hello back'))?'ok':'BAD');
  await A.screenshot({path:out+'/2-host.png'});await B.bringToFront();await B.screenshot({path:out+'/3-guest.png'});
  await wait(9000);await B.screenshot({path:out+'/4-guest-faded.png'});
  // voice between two tabs: refused with a note, no microphone asked for
  await B.keyboard.press('Escape');await wait(600);
  const menu=await B.evaluate(()=>!document.getElementById('pause').hidden);if(!menu){await B.evaluate(()=>window.__G&&0);}
  await B.evaluate(()=>{const b=document.getElementById('tabBtnOptions')||[...document.querySelectorAll('[role=tab]')].find(t=>/Options/.test(t.textContent));if(b)b.click();});await wait(300);
  await B.evaluate(()=>document.getElementById('vcTog').click());await wait(500);
  const note=await B.textContent('#vcNote'),gum=await B.evaluate(()=>window.__gum);
  await B.evaluate(()=>document.getElementById('chatOpts').scrollIntoView());await wait(200);await B.screenshot({path:out+'/5-guest-options.png'});
  console.log('voice between tabs: note',JSON.stringify(note),/internet/.test(note)?'ok':'BAD','| microphone asked',gum,gum===0?'ok':'BAD');
  console.log('page errors',errs.length,errs.slice(0,5));
  await b.close();srv.close();
})();
