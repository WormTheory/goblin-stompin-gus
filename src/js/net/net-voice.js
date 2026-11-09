// ---------- Online co-op: voice chat ----------
// Off unless a player switches it on, and never kept on between visits. Until then nothing here touches the microphone,
// makes an AudioContext or adds anything to a connection: the only thing that runs is the host's list of who's on voice,
// and that says nothing at all until somebody is.
// Switched on, the microphone's stream goes straight to each other player who also has voice on, over the connection
// Trystero already has open to them (it renegotiates the connection itself, over its own data channel). Nobody sends
// audio to a player with voice off, so they never receive or decode any. The host keeps the list of who's on (the 'vr'
// message, from each guest's 'vo') and every player sends to whoever that list says. Switched off, the stream's taken off
// every connection, the microphone's let go, its audio lines are stopped and the AudioContext is closed.
// Between two tabs of one browser there's no real connection to carry sound, so voice is for games over the internet.
// Listen only (ticked in Options, or when there's no microphone to be had, or it's refused): the player's on the list as
// one to send to, but never asks for a microphone and sends nothing; an AudioContext is only made, for the speaking
// indicators, when the first voice arrives.
const VC_KEY='gsg-voice-v1',VC_SPEAK=0.02;   // (VC_SPEAK: how loud, as an RMS level, counts as talking for the indicator)
const VC={on:false,want:false,busy:false,ptt:true,vol:1,mute:new Set(),listen:false,lo:false,   // (listen: the Options box, kept; lo: on voice now with no microphone)
 
  ctx:null,mic:null,an:null,buf:null,   // (the microphone's stream, and an AudioContext only for the speaking indicators)
  tr:null,said:null,roster:[],sendTo:new Set(),remote:new Map(),pend:new Map(),
  talking:false,level:0,meterT:0,rsT:0,rsLast:'',hudKey:'',peersKey:'',note:''};
{try{const o=JSON.parse(localStorage.getItem(VC_KEY)||'null');if(o&&typeof o==='object'){VC.ptt=o.ptt!==false;VC.listen=o.listen===true;if(Number.isFinite(o.vol))VC.vol=Math.max(0,Math.min(1,o.vol));}}catch(e){}}
function vcSave(){try{localStorage.setItem(VC_KEY,JSON.stringify({ptt:VC.ptt,vol:VC.vol,listen:VC.listen}));}catch(e){}}
const vcCan=()=>chatAvail()&&!!NET.tr.av;
const vcSelf=()=>NET.tr?NET.tr.self:null;
function vcNote(s){VC.note=s||'';const e=chatEl('vcNote');if(e)e.textContent=VC.note;}
const vcTalkKeys=()=>{const k=BINDS.talk.kb[0],p=BINDS.talk.pad[0];return k&&p!=null?keyLabel(k)+' ('+padLabel(p,padStyle==='ps')+' on a controller)':k?keyLabel(k):p!=null?padLabel(p,padStyle==='ps'):'the Push to talk button (set one in the Controls tab)';};

// ---- on and off ----
async function vcStart(){
  if(VC.on||VC.busy)return;
  if(!chatAvail()){vcNote('Voice chat works in an online game: host one or join one first.');vcOptsDraw();return;}
  if(!NET.tr.av){vcNote("Voice chat needs a game over the internet: between two tabs of one browser there's no connection to carry it.");vcOptsDraw();return;}
  VC.want=true;
  const md=typeof navigator!=='undefined'&&navigator.mediaDevices;
  if(VC.listen)return vcBegin(null,'Voice chat is on, listening only: you hear the others, and the game never asks for your microphone.');
  if(!md||!md.getUserMedia)return vcBegin(null,"No microphone: listening only. (This browser won't let the game use one here: it needs the game's website, rather than a file opened from disk.)",true);
  VC.busy=true;vcNote('Asking for the microphone...');vcOptsDraw();
  let st=null;
  try{st=await md.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});}
  catch(e){VC.busy=false;const n=e&&e.name;
    // (no microphone, or not allowed one: voice goes on anyway, to hear the others)
    return vcBegin(null,'No microphone: listening only. '+(n==='NotAllowedError'||n==='SecurityError'?"The microphone wasn't allowed: allow it from the browser's address bar, then switch voice chat off and on again to talk."
      :n==='NotFoundError'||n==='OverconstrainedError'||n==='NotReadableError'?'None could be used.'
      :"Couldn't start it ("+((e&&e.message)||n||e)+').'),true);}
  VC.busy=false;
  vcBegin(st,VC.ptt?'Voice chat is on. Hold '+vcTalkKeys()+' to talk.':'Voice chat is on, with an open microphone.');
}
// (voice on: with the microphone's stream, or none for listening only)
function vcBegin(st,msg,flash){
  // (switched off again, or out of the game, while the browser was asking: let it go at once)
  if(!VC.want||!vcCan()){if(st)for(const t of st.getTracks())t.stop();VC.want=false;vcNote(vcCan()?'':'Voice chat works in an online game: host one or join one first.');vcOptsDraw();return;}
  VC.mic=st;VC.lo=!st;VC.talking=!!st&&!VC.ptt;
  if(st){for(const t of st.getAudioTracks())t.enabled=VC.talking;
    try{vcCtx();const src=VC.ctx.createMediaStreamSource(st);
      VC.an=VC.ctx.createAnalyser();VC.an.fftSize=512;src.connect(VC.an);VC.buf=new Uint8Array(VC.an.fftSize);}   // (measured only: never played back)
    catch(e){VC.an=null;VC.buf=null;}}
  VC.on=true;VC.tr=null;VC.said=null;
  vcNote(msg);if(flash)flashLabel('No microphone: listening only',P1);
  vcSync();vcAnnounce();vcHudDraw();vcOptsDraw();chatVis();
}
// (the AudioContext, made when first wanted: only ever used to measure how loud someone is)
function vcCtx(){if(!VC.ctx)try{const AC=window.AudioContext||window.webkitAudioContext;VC.ctx=new AC();}catch(e){VC.ctx=null;}return VC.ctx;}
function vcOff(quiet){
  VC.want=false;if(!VC.on)return;VC.on=false;
  const T=VC.tr;
  if(T&&T.av&&VC.mic)for(const id of VC.sendTo)try{T.av.remove(VC.mic,id);}catch(e){}
  VC.sendTo.clear();VC.pend.clear();for(const id of [...VC.remote.keys()])vcDrop(id);
  if(VC.mic)for(const t of VC.mic.getTracks())try{t.stop();}catch(e){}
  VC.mic=null;VC.lo=false;VC.talking=false;VC.level=0;
  if(VC.ctx)try{VC.ctx.close();}catch(e){}
  VC.ctx=null;VC.an=null;VC.buf=null;
  // (the connections' audio lines go too, so nothing's left negotiated, sent or decoded: switched on again, new ones are made)
  if(T&&T.av)for(const pc of T.av.conns())try{for(const x of pc.getTransceivers())if(!x.stopped&&x.receiver&&x.receiver.track&&x.receiver.track.kind==='audio')x.stop();}catch(e){}
  if(!quiet){vcAnnounce();vcNote('Voice chat is off.');}else vcNote('');
  VC.hudKey='';vcHudDraw();vcOptsDraw();try{chatVis();}catch(e){}
}
// (telling the host whether this player's on voice; the host itself just puts it in its list)
function vcAnnounce(){
  if(netHost()){VC.rsT=0;return;}
  if(netGuest()&&NET.joined&&NET.host&&NET.tr){NET.tr.send({t:'vo',on:VC.on?1:0,mic:VC.mic?1:0},NET.host);VC.said=NET.tr;}
}

// ---- who's on voice (the host's list) ----
function vcRosterTick(dt){
  VC.rsT-=dt;if(VC.rsT>0||!NET.tr)return;VC.rsT=0.25;
  const L=[{s:0,id:NET.tr.self,n:chatName(P1),c:chatCol(P1),on:VC.on?1:0,mic:VC.mic?1:0}];   // (mic: sending as well as hearing; 0 listens only)
  for(const q of NET.guests.values())if(!q.net.gone)L.push({s:q.idx,id:q.net.peer,n:chatName(q),c:chatCol(q),on:q.net.vo?1:0,mic:q.net.vo&&q.net.vm?1:0});
  if(!VC.rsLast&&!L.some(r=>r.on))return;   // (nobody's switched voice on yet: nothing to tell anyone)
  const k=JSON.stringify(L);if(k===VC.rsLast)return;VC.rsLast=k;
  for(const q of NET.guests.values())if(!q.net.gone)NET.tr.send({t:'vr',l:L},q.net.peer);
  vcRoster(L);
}
// (everyone: the list as the host sent it, checked, and what this player sends to whom made to match it)
function vcRoster(l){
  if(!Array.isArray(l))return;
  VC.roster=l.slice(0,NET_SEATS+2).filter(r=>r&&typeof r.id==='string'&&r.id.length<80).map(r=>({s:r.s|0,id:r.id,n:chatClean(r.n).slice(0,32)||'Someone',
    c:/^#[0-9a-f]{3,8}$/i.test(r.c)?r.c:'#eef0e6',on:!!r.on,mic:!!r.on&&r.mic!==0&&r.mic!==false}));
  vcSync();vcHudDraw();vcOptsDraw();
}
// (who this player sends to: everyone on voice, listeners too; and who it hears: those of them with a microphone)
const vcWanted=()=>{const me=vcSelf();return new Set(VC.roster.filter(r=>r.on&&r.id!==me).map(r=>r.id));};
const vcHeard=()=>{const me=vcSelf();return new Set(VC.roster.filter(r=>r.on&&r.mic&&r.id!==me).map(r=>r.id));};
function vcSync(){
  const T=NET.tr;
  if(VC.tr!==T){   // (a new connection, after a reconnect: whatever went over the old one went with it)
    VC.sendTo.clear();VC.pend.clear();for(const id of [...VC.remote.keys()])vcDrop(id);VC.tr=T;VC.said=null;
    if(VC.on&&T&&T.av)T.av.onStream(vcGotStream);}
  if(!VC.on||!T||!T.av)return;
  if(VC.mic){const want=vcWanted();   // (listening only, nothing's ever sent)
    for(const id of want)if(!VC.sendTo.has(id)){try{T.av.add(VC.mic,id);VC.sendTo.add(id);}catch(e){}}
    for(const id of [...VC.sendTo])if(!want.has(id)){try{T.av.remove(VC.mic,id);}catch(e){}VC.sendTo.delete(id);}}
  const hear=vcHeard();
  for(const id of [...VC.remote.keys()])if(!hear.has(id))vcDrop(id);
  for(const [id,st] of VC.pend)if(hear.has(id)){VC.pend.delete(id);vcPlay(id,st);}
}

// ---- hearing the others ----
function vcGotStream(st,peer){
  if(!VC.on||!st)return;   // (with voice off nobody should be sending: nothing's played)
  if(!vcHeard().has(peer)){VC.pend.set(peer,st);return;}   // (it can beat the host's list here: kept till the list says they're on)
  vcPlay(peer,st);
}
function vcPlay(peer,st){
  vcDrop(peer);const r={st,el:null,src:null,an:null,buf:null,lvl:0};
  try{const a=new Audio();a.autoplay=true;a.srcObject=st;a.volume=VC.vol;a.muted=VC.mute.has(peer);const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});r.el=a;}catch(e){}
  try{if(vcCtx()){r.src=VC.ctx.createMediaStreamSource(st);r.an=VC.ctx.createAnalyser();r.an.fftSize=512;r.src.connect(r.an);r.buf=new Uint8Array(512);}}catch(e){}
  VC.remote.set(peer,r);vcHudDraw();
}
function vcDrop(peer){
  const r=VC.remote.get(peer);if(!r)return;VC.remote.delete(peer);
  if(r.el)try{r.el.pause();r.el.srcObject=null;}catch(e){}
  if(r.src)try{r.src.disconnect();}catch(e){}
}
function vcLevel(an,buf){if(!an||!buf)return 0;try{an.getByteTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;s+=v*v;}return Math.sqrt(s/buf.length);}catch(e){return 0;}}

// ---- every frame, while voice is on ----
function vcTick(dt){
  if(VC.tr!==NET.tr)vcSync();
  if(netGuest()&&VC.said!==NET.tr)vcAnnounce();
  // (push to talk: the microphone's track is only enabled while the button's held; otherwise it sends silence)
  const talk=VC.ptt?!!(P1.in.talk&&!CHAT.open):true;
  if(VC.mic&&talk!==VC.talking){VC.talking=talk;for(const t of VC.mic.getAudioTracks())t.enabled=talk;vcHudDraw();}
  VC.meterT-=dt;if(VC.meterT>0)return;VC.meterT=0.08;
  VC.level=VC.talking?vcLevel(VC.an,VC.buf):0;
  for(const r of VC.remote.values())r.lvl=vcLevel(r.an,r.buf);
  vcHudDraw();
}
// the speaking indicators: a chip per player on voice, lit while they're talking
function vcHudDraw(){
  const e=chatEl('vcHud');if(!e)return;
  if(!VC.on){if(!e.hidden){e.hidden=true;e.innerHTML='';VC.hudKey='';}return;}
  const me=vcSelf(),rows=[];
  const mine=VC.roster.find(r=>r.id===me);
  // (a listener's chip says so, and never lights: there's nothing of theirs to hear)
  if(VC.lo)rows.push({n:(mine?mine.n:charName(P1))+' (you, listening)',c:mine?mine.c:chatCol(P1),talk:false,ic:'🎧',mute:false});
  else rows.push({n:(mine?mine.n:charName(P1))+' (you)',c:mine?mine.c:chatCol(P1),talk:VC.talking&&VC.level>VC_SPEAK,ic:'🎙',mute:!VC.talking});
  for(const r of VC.roster){if(!r.on||r.id===me)continue;
    if(!r.mic){rows.push({n:r.n+' (listening)',c:r.c,talk:false,ic:'🎧',mute:true});continue;}
    const R=VC.remote.get(r.id),m=VC.mute.has(r.id);
    rows.push({n:r.n,c:r.c,talk:!m&&!!R&&R.lvl>VC_SPEAK,ic:m?'🔇':'🔊',mute:m||!R});}
  const k=JSON.stringify(rows);if(k===VC.hudKey)return;VC.hudKey=k;
  e.hidden=false;e.innerHTML='';
  for(const r of rows){const d=document.createElement('span');d.className='vc'+(r.talk?' talk':'')+(r.mute?' mute':'');
    const i=document.createElement('span');i.className='ic';i.textContent=r.ic;i.setAttribute('aria-hidden','true');
    const n=document.createElement('span');n.textContent=r.n;n.style.color=r.c;d.append(i,n);e.append(d);}
}

// ---- the Options tab ----
function vcOptsDraw(){
  const t=chatEl('vcTog');if(!t)return;
  t.setAttribute('aria-checked',String(VC.on||VC.busy));t.classList.toggle('dim',!VC.on&&!vcCan());
  chatEl('vcPttTog').setAttribute('aria-checked',String(VC.ptt));chatEl('vcPttTog').classList.toggle('dim',VC.lo||VC.listen);   // (nothing to talk with)
  chatEl('vcLoTog').setAttribute('aria-checked',String(VC.listen));
  chatEl('vcPttTxt').textContent='Hold '+vcTalkKeys()+' to talk. Untick for an open microphone';
  const v=chatEl('vcVol');if(document.activeElement!==v)v.value=String(Math.round(VC.vol*100));chatEl('vcVolVal').textContent=Math.round(VC.vol*100)+'%';
  if(!VC.note)chatEl('vcNote').textContent=vcCan()?'':netOn()?'Voice chat needs a game over the internet, not between two tabs.':'Voice chat can be switched on once you\'re in an online game.';
  // (one button per player on voice: muting them is only for you)
  const me=vcSelf(),L=VC.on?VC.roster.filter(r=>r.on&&r.mic&&r.id!==me):[];
  const k=JSON.stringify(L.map(r=>[r.id,r.n,VC.mute.has(r.id)]));if(k===VC.peersKey)return;VC.peersKey=k;
  const box=chatEl('vcPeers');box.innerHTML='';
  for(const r of L){const b=document.createElement('button');b.type='button';b.className='tog';b.setAttribute('role','checkbox');b.setAttribute('aria-checked',String(VC.mute.has(r.id)));
    const bx=document.createElement('span');bx.className='box';bx.setAttribute('aria-hidden','true');
    const tl=document.createElement('span');tl.className='tl';tl.append('Mute '+r.n);const sm=document.createElement('small');sm.textContent=VC.lo?'Only for you':'Only for you: '+r.n+' still hears you';tl.append(sm);
    b.append(bx,tl);b.addEventListener('click',()=>vcMute(r.id,!VC.mute.has(r.id)));box.append(b);}
}
function vcMute(id,on){if(on)VC.mute.add(id);else VC.mute.delete(id);const r=VC.remote.get(id);if(r&&r.el)r.el.muted=on;vcHudDraw();vcOptsDraw();}
chatEl('vcTog').addEventListener('click',()=>{if(VC.on||VC.busy)vcOff(false);else vcStart();});
chatEl('vcPttTog').addEventListener('click',()=>{VC.ptt=!VC.ptt;vcSave();if(VC.on)vcNote(VC.ptt?'Push to talk: hold '+vcTalkKeys()+' to talk.':'Open microphone: the others hear you whenever you speak.');vcOptsDraw();});
// (listening only, switched while voice is on: it starts again the new way)
chatEl('vcLoTog').addEventListener('click',()=>{VC.listen=!VC.listen;vcSave();if(VC.on){vcOff(true);vcStart();}else vcOptsDraw();});
chatEl('vcVol').addEventListener('input',e=>{VC.vol=Math.max(0,Math.min(1,(+e.target.value||0)/100));for(const r of VC.remote.values())if(r.el)r.el.volume=VC.vol;chatEl('vcVolVal').textContent=Math.round(VC.vol*100)+'%';});
chatEl('vcVol').addEventListener('change',vcSave);
vcOptsDraw();
