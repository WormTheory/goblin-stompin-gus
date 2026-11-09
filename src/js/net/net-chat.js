// ---------- Online co-op: text chat ----------
// A typed line rides on the game's own connection as one more message type, 'chat'. A guest sends its line to the host;
// the host checks it (its length, how often that player's been typing) and passes it on to everyone with the sender's
// name and colour, the sender's own copy included, so every screen shows the same lines in the same order. Lines only
// ever reach the page as text (textContent), never as markup, so nobody can put anything on another player's screen
// but words. Nothing here does anything outside an online game.
const CHAT_MAX=120,CHAT_SHOW=8000,CHAT_KEEP=40;   // (longest line, ms a line stays up, lines kept for when the chat's opened again)
const CHAT_RATE={n:4,ms:5000,gap:300};   // (at most 4 lines in 5 seconds, and none within 0.3 s of the last)
const CHAT_QUICK=['Over here!','Help!','Follow me!','Wait for me!','Nice one!','Smash it!'];   // (a controller's messages)
const CHAT_KEY='gsg-chat-v1';
const CHAT={open:false,quick:false,qi:0,qT:0,qy:0,lines:[],sent:[],show:true,incoming:true,closedAt:-1e9};
{try{const o=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(o&&typeof o==='object'){CHAT.show=o.show!==false;CHAT.incoming=o.incoming!==false;}}catch(e){}}
function chatSave(){try{localStorage.setItem(CHAT_KEY,JSON.stringify({show:CHAT.show,incoming:CHAT.incoming}));}catch(e){}}
const chatEl=id=>document.getElementById(id);
// (somebody to talk to: hosting, or in someone's game)
const chatAvail=()=>!!(NET.tr&&(netHost()||netGuest()&&NET.joined&&NET.host));
// a line as it's allowed to be: one line of plain text, no control or direction-flipping characters, trimmed, not too long
function chatClean(s){return String(s==null?'':s).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim().slice(0,CHAT_MAX);}
// (a player's name and colour as the chat shows them: the HUD's two colours for the first two, two more for the others)
function chatName(p){let n=charName(p);if(players.some(q=>q!==p&&(q.active||q.net)&&charName(q)===n))n+=' (P'+(p.idx+1)+')';return n;}
const chatCol=p=>p.idx>=2?['#8fd0ff','#a8e07a'][(p.idx-2)%2]:charTint(p)?'#ffb0d8':'#ffd75a';
function chatRateOk(L,now){while(L.length&&now-L[0]>CHAT_RATE.ms)L.shift();if(L.length>=CHAT_RATE.n||L.length&&now-L[L.length-1]<CHAT_RATE.gap)return false;L.push(now);return true;}

// ---- sending and passing on ----
function chatSend(text){
  const x=chatClean(text);if(!x||!chatAvail())return false;
  if(!chatRateOk(CHAT.sent,performance.now())){chatSys('Slow down a little: one line at a time.');return false;}
  if(netHost())chatPost(P1,x);else NET.tr.send({t:'chat',x},NET.host);
  return true;
}
// (host: a guest's line, checked again here, since a guest could be running anything)
function chatFromGuest(p,m){
  const x=chatClean(m.x);if(!x)return;const N=p.net;N.chat=N.chat||[];
  if(!chatRateOk(N.chat,performance.now())){NET.tr.send({t:'chat',sys:'Slow down a little: one line at a time.'},N.peer);return;}
  chatPost(p,x);
}
// (host: a line goes out to every guest, and on to this screen)
function chatPost(p,x){
  const m={t:'chat',s:p.idx,n:chatName(p),c:chatCol(p),x};
  for(const q of NET.guests.values())if(!q.net.gone)NET.tr.send(m,q.net.peer);
  chatShow(m.n,m.c,x,p===P1);
}
// (guest: a line from the host, its own included)
function chatGot(m){
  if(typeof m.sys==='string'){chatSys(chatClean(m.sys));return;}
  const x=chatClean(m.x);if(!x)return;
  const n=chatClean(m.n).slice(0,32)||'Someone',c=/^#[0-9a-f]{3,8}$/i.test(m.c)?m.c:'#eef0e6';
  chatShow(n,c,x,m.s===NET.seat);
}

// ---- on screen ----
function chatShow(n,c,x,own){
  if(!own&&!CHAT.incoming)return;
  const ln=document.createElement('div');ln.className='chat-ln';
  const a=document.createElement('span');a.className='chat-n';a.textContent=n+': ';a.style.color=c;
  const b=document.createElement('span');b.textContent=x;ln.append(a,b);
  chatAdd(ln,{n,c,x});
  if(!own)try{tone('triangle',880,1320,0.06,0.025);}catch(e){}
}
function chatSys(x){if(!x)return;const ln=document.createElement('div');ln.className='chat-ln sys';ln.textContent=x;chatAdd(ln,{x,sys:true});}
function chatAdd(ln,rec){
  rec.el=ln;CHAT.lines.push(rec);chatEl('chatLog').append(ln);
  while(CHAT.lines.length>CHAT_KEEP){const o=CHAT.lines.shift();try{o.el.remove();}catch(e){}}
  ln._t=setTimeout(()=>{try{ln.classList.add('old');}catch(e){}},CHAT_SHOW);
  chatVis();
  try{const L=chatEl('chatLog');L.scrollTop=L.scrollHeight;}catch(e){}
}
// (the chat's corner of the screen: there in an online game, with chat switched on, or while anyone's on voice)
function chatVis(){const e=chatEl('chat');if(!e)return;const on=chatAvail()&&(CHAT.show||VC.on);if(e.hidden===on)e.hidden=!on;chatEl('chatLog').hidden=!CHAT.show;}
function chatTick(dt){
  chatVis();
  if(CHAT.open&&(!chatAvail()||menuOpen||P1.paused))chatClose();
  if(CHAT.quick){CHAT.qT-=dt;if(CHAT.qT<=0||!chatAvail()||menuOpen||P1.paused)chatQuickClose();}
}
// everything put away and forgotten (leaving the game)
function chatReset(){
  if(CHAT.open)chatClose();if(CHAT.quick)chatQuickClose();
  for(const o of CHAT.lines){clearTimeout(o.el._t);try{o.el.remove();}catch(e){}}CHAT.lines.length=0;CHAT.sent.length=0;
  const e=chatEl('chat');if(e)e.hidden=true;
}

// ---- typing a line (the keyboard) ----
function chatOpen(){
  if(CHAT.open||!chatAvail()||!CHAT.show)return;
  if(CHAT.quick)chatQuickClose();
  CHAT.open=true;keys.clear();mHeld.clear();
  const c=chatEl('chat'),i=chatEl('chatIn');c.classList.add('open');i.hidden=false;i.value='';chatVis();
  for(const o of CHAT.lines)clearTimeout(o.el._t);
  try{i.focus();}catch(e){}
  try{const L=chatEl('chatLog');L.scrollTop=L.scrollHeight;}catch(e){}
}
function chatClose(){
  if(!CHAT.open)return;CHAT.open=false;CHAT.closedAt=performance.now();keys.clear();
  const c=chatEl('chat'),i=chatEl('chatIn');c.classList.remove('open');try{i.blur();}catch(e){}i.hidden=true;i.value='';
  // (the lines brought back for reading fade again a moment later)
  for(const o of CHAT.lines){const ln=o.el;clearTimeout(ln._t);if(!ln.classList.contains('old'))ln._t=setTimeout(()=>{try{ln.classList.add('old');}catch(e){}},CHAT_SHOW);}
}
// (Esc that cancels the chat also lets go of a captured mouse: that isn't a request to pause)
const chatHasEsc=()=>CHAT.open||performance.now()-CHAT.closedAt<500;
addEventListener('keydown',e=>{
  if(e.code!=='Enter'&&e.code!=='NumpadEnter'||e.repeat)return;
  if(CHAT.open||menuOpen||!playing||P1.paused||DT.kbdOpen||BIND_CAP||!chatAvail()||!CHAT.show)return;
  e.preventDefault();chatOpen();
});
{
  const i=chatEl('chatIn');
  // (keys typed here stop here: none reach the game's own key handlers, so nothing walks, jumps or opens a debug view)
  i.addEventListener('keydown',e=>{e.stopPropagation();
    if(e.code==='Enter'||e.code==='NumpadEnter'){e.preventDefault();if(!e.repeat){chatSend(i.value);chatClose();}}
    else if(e.code==='Escape'){e.preventDefault();chatClose();}});
  i.addEventListener('keyup',e=>e.stopPropagation());
  document.addEventListener('pointerlockchange',()=>{if(!locked()&&CHAT.open)chatClose();});
}

// ---- quick messages (a controller) ----
// The quick chat button (D-pad up unless rebound) brings up a short list: up and down (the D-pad or the left stick) pick,
// A sends, B or the button again puts it away. While it's up, that controller drives the list rather than the hippo.
function chatPad(s){
  const pp=id=>BINDS[id].pad.some(k=>s.pr[k]);
  if(!CHAT.quick){
    if(!pp('quickChat')||!chatAvail()||!CHAT.show||CHAT.open)return false;
    CHAT.quick=true;CHAT.qi=0;CHAT.qT=8;CHAT.qy=0;chatQuickDraw();return true;}
  const y=s.p.axes[1]||0,dy=y<-0.55?-1:y>0.55?1:0,st=dy&&dy!==CHAT.qy?dy:0;CHAT.qy=dy;
  const mv=(s.pr[12]?-1:0)+(s.pr[13]?1:0)+st;
  if(mv){CHAT.qi=(CHAT.qi+mv+CHAT_QUICK.length)%CHAT_QUICK.length;CHAT.qT=8;chatQuickDraw();}
  if(s.pr[0]){chatSend(CHAT_QUICK[CHAT.qi]);chatQuickClose();}
  else if(s.pr[1]||pp('quickChat')&&!s.pr[12])chatQuickClose();
  return true;
}
function chatQuickDraw(){
  const e=chatEl('chatQuick');e.hidden=false;e.innerHTML='';
  CHAT_QUICK.forEach((t,k)=>{const d=document.createElement('div');d.className='q'+(k===CHAT.qi?' on':'');d.textContent=t;e.append(d);});
  const h=document.createElement('div');h.className='qh';h.innerHTML=hudHTML(btnMark(bindGlyph('pad',0))+' send · '+btnMark(bindGlyph('pad',1))+' close');e.append(h);
}
function chatQuickClose(){CHAT.quick=false;const e=chatEl('chatQuick');if(e){e.hidden=true;e.innerHTML='';}}

// ---- the Options tab: show chat, mute the others ----
function chatOptsDraw(){
  chatEl('chatShowTog').setAttribute('aria-checked',String(CHAT.show));
  chatEl('chatInTog').setAttribute('aria-checked',String(CHAT.incoming));
  const q=BINDS.quickChat.pad[0];chatEl('chatQkKey').textContent=q==null?'the Quick chat button (Controls tab)':padLabel(q,padStyle==='ps');
}
chatEl('chatShowTog').addEventListener('click',()=>{CHAT.show=!CHAT.show;if(!CHAT.show){chatClose();chatQuickClose();}chatSave();chatOptsDraw();chatVis();});
chatEl('chatInTog').addEventListener('click',()=>{CHAT.incoming=!CHAT.incoming;chatSave();chatOptsDraw();});
chatOptsDraw();
