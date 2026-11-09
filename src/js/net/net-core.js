// ---------- Online co-op: transports and sessions ----------
// One player's browser, the host, runs the whole game as it always has, with the second seat (P2) driven by a guest's
// controls arriving over the network. The guest's browser builds the same city from the host's save, sends its controls
// and its camera, and draws what the host sends back: the players, the goblins, the traffic, smashed blocks, dust and
// sounds. It runs none of the game's own goblins, traffic or damage itself (so nothing can disagree with the host).
// Every message is a plain JSON object with a type `t`, so a headless server in Node could one day send the very same
// ones. docs/multiplayer.md has the whole protocol.
const NET_PROTO=1;
// (Trystero finds the other player through public Nostr relays and then talks to them directly over WebRTC. It's only
// fetched once someone picks online play, so the game still opens and plays with no network at all.)
const NET_TRYSTERO='https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm';
const NET_APP='goblin-stompin-gus/net1';
// TURN servers, for players whose routers won't let a direct connection through. None are set: a build of your own can
// put some here (for instance Cloudflare's), as [{urls:['turn:...'],username:'...',credential:'...'}]. Never commit real ones.
const NET_TURN=null;
const NET_SEATS=4;   // (players online, the host among them: seats past the second are made when someone takes one)
const NET_SNAP_HZ=15,NET_IN_HZ=30,NET_DELAY=100;   // (snapshots a second from the host, controls a second from a guest, and how far behind the host a guest draws, ms, so it always has two snapshots to blend between)
const NET_SS_JOIN='gsg-net-join',NET_SS_WORLD='gsg-net-world';   // (sessionStorage: this tab's own, so a guest tab never touches the city saved in this browser)
const NET={mode:0,tr:null,code:'',kind:'',seat:0,now:0,host:null,status:'',joined:false,snapT:0,inT:0,pingT:0,rtt:0,
  guests:new Map(),   // (host: peer id -> the seat's player)
  lastHeard:0,q:[],cur:null,off:null,seq:0,wantSeat:1};
const netHost=()=>NET.mode===1,netGuest=()=>NET.mode===2,netOn=()=>NET.mode>0;
// is a player's body run by someone over the network? (host: a guest's seat; guest: everyone, the host included)
const netRemote=p=>!!(p&&p.net);
// (a room code: five letters, no look-alikes. Not from Math.random, which the tests seed)
function netCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let s='';try{const r=new Uint8Array(5);crypto.getRandomValues(r);for(const v of r)s+=A[v%A.length];}catch(e){for(let i=0;i<5;i++)s+=A[(Date.now()/(i+1)|0)%A.length];}return s;}
function netId(){try{const r=new Uint8Array(6);crypto.getRandomValues(r);return Array.from(r,v=>v.toString(16).padStart(2,'0')).join('');}catch(e){return 'p'+Date.now().toString(36);}}
function netStatus(s){NET.status=s;try{netUiStatus(s);}catch(e){}}

// ---- transports: {kind, self, on:{msg(peer,data), join(peer), leave(peer)}, send(data,to?), close()} ----
// two tabs of this browser, through a BroadcastChannel (for trying it out on one machine, and the UI tests)
function netLoopback(code){
  if(typeof BroadcastChannel==='undefined')throw new Error("this browser can't link its tabs (no BroadcastChannel). Untick \"Two tabs of this browser\" to play over the internet");
  const bc=new BroadcastChannel('gsg-net:'+code),self=netId(),seen=new Map();
  const T={kind:'loop',self,on:{},send(d,to){try{bc.postMessage({k:'m',from:self,to:to||null,d});}catch(e){}},
    close(){clearInterval(hb);try{bc.postMessage({k:'bye',from:self});bc.close();}catch(e){}}};
  bc.onmessage=e=>{const m=e.data;if(!m||m.from===self||(m.to&&m.to!==self))return;
    if(m.k==='bye'){if(seen.delete(m.from)&&T.on.leave)T.on.leave(m.from);return;}
    const fresh=!seen.has(m.from);seen.set(m.from,Date.now());
    if(fresh){if(m.k==='hi')bc.postMessage({k:'hb',from:self});if(T.on.join)T.on.join(m.from);}
    if(m.k==='m'&&T.on.msg)T.on.msg(m.from,m.d);};
  // (a tab that's closed may not get to say goodbye: one not heard from for five seconds has gone)
  const hb=setInterval(()=>{try{bc.postMessage({k:'hb',from:self});}catch(e){}const t=Date.now();for(const [k,v] of seen)if(t-v>5000){seen.delete(k);if(T.on.leave)T.on.leave(k);}},1000);
  bc.postMessage({k:'hi',from:self});
  return T;
}
// anywhere on the internet, peer to peer, through Trystero (loaded on first use)
async function netTrystero(code){
  const mod=await import(NET_TRYSTERO);
  const cfg={appId:NET_APP};if(NET_TURN)cfg.turnConfig=NET_TURN;
  const room=mod.joinRoom(cfg,code),a=room.makeAction('m'),old=Array.isArray(a);   // (older Trystero gave [send, receive]; newer an object)
  const T={kind:'p2p',self:mod.selfId,on:{},
    send(d,to){try{if(old)a[0](d,to||null);else a.send(d,to?{target:to}:undefined);}catch(e){}},
    close(){try{room.leave();}catch(e){}},
    // (voice chat: a microphone's stream added to, or taken off, the connection to one player. Trystero renegotiates the
    // connection over its own data channel; nothing here runs unless someone switches voice on)
    av:{add(st,to){if(old)room.addStream(st,to);else room.addStream(st,{target:to});},
      remove(st,to){if(old)room.removeStream(st,to);else room.removeStream(st,{target:to});},
      onStream(f){if(old)room.onPeerStream(f);else room.onPeerStream=f;},
      conns(){try{return Object.values(room.getPeers?room.getPeers():{});}catch(e){return [];}}}};
  const got=(d,meta)=>{const peer=typeof meta==='string'?meta:meta&&meta.peerId;if(T.on.msg)T.on.msg(peer,d);};
  const join=id=>{if(T.on.join)T.on.join(id);},leave=id=>{if(T.on.leave)T.on.leave(id);};
  if(old){a[1](got);room.onPeerJoin(join);room.onPeerLeave(leave);}
  else{a.onMessage=got;room.onPeerJoin=join;room.onPeerLeave=leave;}
  return T;
}
async function netOpen(kind,code){if(NET.makeTr)return NET.makeTr(kind,code);return kind==='loop'?netLoopback(code):netTrystero(code);}   // (NET.makeTr: the tests' own transport)

// ---- hosting ----
function netHostWith(tr,code,kind){
  NET.mode=1;NET.tr=tr;NET.code=code;NET.kind=kind;NET.guests.clear();
  tr.on.msg=netHostMsg;tr.on.join=()=>{};tr.on.leave=netHostDropped;
  netStatus('Hosting '+netVia(kind)+'. Room code '+code+' · '+netWaitTxt(kind));netBgClock();
}
// (which way a game's played, for the status line: so ticking "Two tabs of this browser" plainly changes something)
const netVia=kind=>kind==='loop'?"between this browser's tabs":'online';
const netWaitTxt=kind=>kind==='loop'?'open the game in another tab of this browser, tick "Two tabs of this browser" there too, and join with this code':'waiting for someone to join';
// (a page opened from a file: some browsers keep each such tab to itself, so two of them can't find each other)
const netFromFile=()=>{try{return location.protocol==='file:';}catch(e){return false;}};
const NET_FILE_TIP=" Opened from a file, some browsers keep tabs apart: use the game's website, or serve the folder (python -m http.server) and open it from there.";
async function netStartHost(kind){
  if(netOn())return;const code=netCode();netStatus('Opening a room...');
  try{netHostWith(await netOpen(kind,code),code,kind);}catch(e){NET.mode=0;netStatus("Couldn't open a room: "+(e&&e.message||e));}
}
// (what a guest sends about itself when it asks to join, and what the host takes from it)
function netCid(){let c=null;try{c=sessionStorage.getItem('gsg-net-cid');if(!c){c=netId();sessionStorage.setItem('gsg-net-cid',c);}}catch(e){}return c||(NET.cid||(NET.cid=netId()));}   // (this tab, through a reload or a dropped connection, so the host keeps its seat for it)
function netHello(){return{t:'hello',v:NET_PROTO,cid:netCid(),who:CHAR==='gertie'?1:0,gob:CHAR==='goblin',abil:Object.assign({},ABIL),seat:NET.wantSeat};}
function netHostMsg(peer,m){
  if(!m||typeof m!=='object')return;
  const p=NET.guests.get(peer);
  if(m.t==='hello')return netSeat(peer,m);
  if(m.t==='ping'){NET.tr.send({t:'pong',a:m.a,b:NET.now},peer);return;}
  if(!p)return;
  p.net.heard=NET.now;
  if(m.t==='in')netGotInput(p,m);
  else if(m.t==='chat')chatFromGuest(p,m);
  else if(m.t==='vo'){p.net.vo=!!m.on;p.net.vm=m.mic!==0&&m.mic!==false;}   // (a guest switched its voice chat on or off, with a microphone or listening only: see vcRosterTick)
  else if(m.t==='bye')netHostLeft(peer);
}
// a guest asking to join: seat them as player two, if that seat's free (online play is two players: the second split-screen
// seat is the only other one there is)
function netSeat(peer,m){
  if(m.v!==NET_PROTO){NET.tr.send({t:'deny',why:'The host is playing a different version of the game.'},peer);return;}
  let p=NET.guests.get(peer);
  // (the same tab back after its connection dropped: its seat, its hippo just where it was)
  if(!p&&m.cid)for(const q of players)if(q.net&&q.net.gone&&q.net.cid===m.cid){NET.guests.delete(q.net.peer);q.net.peer=peer;q.net.gone=0;q.net.heard=NET.now;NET.guests.set(peer,q);p=q;break;}
  if(!p){
    // (player two's seat first, if nobody's in it here; then a third and fourth, made as they're wanted)
    let seat=-1;for(let s=1;s<NET_SEATS;s++){const q=players[s];if(!q||!q.active&&!q.net){seat=s;break;}}
    if(seat<0){NET.tr.send({t:'deny',why:'That game is full.'},peer);return;}
    while(players.length<=seat)players.push(makePlayer(players.length));
    p=players[seat];p.net={peer,cid:m.cid||null,gone:0,seat,heard:NET.now,inb:null,pr:{},sent:{},pose:null,looks:new Map(),cars:new Map(),out:[],seq:0};NET.guests.set(peer,p);}
  p.net.inb=null;p.net.pr={};p.net.inN=0;p.net.vo=false;   // (vo: on voice chat. A tab that's just joined, or reloaded, isn't till it says so)
  // (two players who've both picked the same hippo: the guest's the other one, so they can tell each other apart. The
  // two are the same in everything but looks)
  p.who=m.who?1:0;if(!m.gob&&!P1.gob&&p.who===P1.who)p.who=1-P1.who;setGobP(p,!!m.gob);
  // (each player keeps the abilities they've switched on in their own browser)
  p.abil={};for(const k in ABIL)p.abil[k]=typeof(m.abil||{})[k]==='boolean'?m.abil[k]:ABIL[k];
  dressHippo(p);
  if(!p.active)netActivate(p);layout();
  p.net.sent={};p.net.looks.clear();p.net.cars.clear();p.net.out.length=0;
  flashLabel(charName(p)+' joined online');
  NET.tr.send({t:'welcome',v:NET_PROTO,seat:p.net.seat,code:NET.code,save:saveText({tenv:TENV||undefined}),host:{who:P1.who,gob:!!P1.gob},
    clock:netClock()},peer);
  netHostStatus();
}
function netHostStatus(){const here=[...NET.guests.values()].filter(q=>!q.net.gone).map(q=>charName(q));netStatus('Hosting '+netVia(NET.kind)+'. Room code '+NET.code+' · '+(here.length?here.join(', ')+(here.length>1?' are':' is')+' here':netWaitTxt(NET.kind)));}
// a guest's seat comes into the game beside the host
function netActivate(p){if(p===P2)return activateP2();p.active=true;p.paused=false;p.heading=P1.heading;placePlayer(p,findStreet(P1.pos.x,P1.pos.z,3,6));}
function netDeactivate(p){if(p.gb){p.gb.root.visible=false;p.gb.vm.visible=false;}if(p===P2)return deactivateP2();p.active=false;p.paused=false;p.root.visible=false;p.pool.visible=false;}
// a guest gone quiet or dropped: its seat (and its hippo, standing still) is kept a while for it to come back to
function netHostDropped(peer){
  const p=NET.guests.get(peer);if(!p)return;if(!p.net.cid)return netHostLeft(peer);
  if(!p.net.gone){p.net.gone=NET.now;p.net.inb=null;flashLabel(charName(p)+' lost the connection...');netStatus('Hosting '+netVia(NET.kind)+'. Room code '+NET.code+' · waiting for '+charName(p)+' to come back');}
}
function netHostLeft(peer){
  const p=NET.guests.get(peer);if(!p)return;NET.guests.delete(peer);
  const nm=charName(p);p.net=null;p.abil=null;
  for(const k in p.in)if(typeof p.in[k]==='boolean')p.in[k]=false;p.in.x=p.in.z=0;
  if(p.drv)drvExit(p);netDeactivate(p);layout();
  flashLabel(nm+' left the game');netHostStatus();
}
// a guest's controls: what's held now replaces what was held; a press counts once, on the host's next frame, however many
// of the guest's frames it was spread over (and none is lost between two of them)
const NET_HELD=['charge','stomp','bite','jump','dash','sprint','climb','use','weapon'],NET_PRESS=['chargePress','bitePress','jumpPress','lockPress','dashPress','sprintPress'];
function netGotInput(p,m){
  const N=p.net;if(typeof m.n==='number'&&m.n<=(N.inN||0))return;N.inN=m.n;N.inAt=NET.now;
  N.inb=m;if(Number.isFinite(m.vt))N.vt=m.vt;if(m.pr&&(m.pr.bitePress||m.pr.chargePress)||m.h&&(m.h.bite||m.h.stomp))N.atkAt=NET.now;
  for(const k of NET_PRESS)if(m.pr&&m.pr[k])N.pr[k]=true;
  if(m.fl){p.flickReq=m.fl[0]||p.flickReq;p.flickReqY=m.fl[1]||p.flickReqY;}
  if(Number.isFinite(m.yaw))p.cam.yaw=m.yaw;if(Number.isFinite(m.pitch))p.cam.pitch=camPitch(m.pitch,p);
}
// (host, every frame after the local controls have been read: a guest's seat gets its controls from the network)
function netHostInputs(){
  for(const p of NET.guests.values()){const N=p.net,I=p.in,m=N.inb;
    for(const k in I)if(typeof I[k]==='boolean')I[k]=false;I.x=I.z=0;I.lookX=I.lookY=0;
    if(!m||p.paused)continue;
    I.x=Math.max(-1,Math.min(1,+m.x||0));I.z=Math.max(-1,Math.min(1,+m.z||0));I.lookX=+m.lx||0;I.lookY=+m.ly||0;
    for(const k of NET_HELD)I[k]=!!(m.h&&m.h[k]);
    for(const k of NET_PRESS){I[k]=!!N.pr[k];N.pr[k]=false;}
    I.chargeHeld=I.charge;
    if(!ABIL.climb&&!(p.abil&&p.abil.climb))I.climb=false;
  }
}

// ---- joining ----
function netJoinWith(tr,code,kind){
  const back=!!NET.retry;   // (reconnecting: the game carries on showing the host's world, frozen, till it's back)
  NET.mode=2;NET.tr=tr;NET.code=code;NET.kind=kind;if(!back)NET.joined=false;NET.host=null;NET.q.length=0;NET.cur=null;NET.off=null;NET.lastHeard=NET.now;
  tr.on.msg=netGuestMsg;tr.on.leave=peer=>{if(peer===NET.host)netDropped();};
  tr.on.join=peer=>{if(!NET.host)tr.send(netHello(),peer);};
  tr.send(netHello());
  netStatus(kind==='loop'?'Looking for room '+code+" in this browser's other tabs...":'Looking for room '+code+' online...');netBgClock();
}
async function netStartJoin(code,kind){
  code=String(code||'').toUpperCase().replace(/[^A-Z]/g,'');if(code.length<4){netStatus('Type in the room code first.');return;}
  if(netOn()&&!NET.retry)return;if(!NET.retry)netStatus('Connecting...');
  try{netJoinWith(await netOpen(kind,code),code,kind);}catch(e){if(NET.retry){setTimeout(netRetry,3000);return;}NET.mode=0;netStatus("Couldn't connect: "+(e&&e.message||e));return;}
  // (nobody answering after a while: probably a mistyped code)
  // (between tabs the host answers at once, so a few seconds is plenty; and it says what to check)
  if(!NET.retry)setTimeout(()=>{if(netGuest()&&!NET.host&&NET.code===code&&!NET.retry){
    netStatus(kind==='loop'?'No tab of this browser is hosting room '+code+'. Host it in another tab of this same browser with "Two tabs of this browser" ticked there too (or untick it here to join over the internet).'+(netFromFile()?NET_FILE_TIP:'')
      :'No game found with the code '+code+'. Check it and try again'+(netJoinFlag()?'.':' (if it’s hosted in another tab of this browser, tick "Two tabs of this browser").'));netClose();}},kind==='loop'?6000:20000);
}
function netGuestMsg(peer,m){
  if(!m||typeof m!=='object')return;
  if(m.t==='deny'){netStatus(m.why||"The host didn't let you in.");netClose();return;}
  if(m.t==='welcome'){if(NET.host&&NET.host!==peer)return;NET.host=peer;netWelcome(m);return;}
  if(peer!==NET.host)return;
  NET.lastHeard=NET.now;
  if(m.t==='s')netGotSnap(m);
  else if(m.t==='pong'){NET.rtt=NET.now-m.a;}
  else if(m.t==='chat')chatGot(m);
  else if(m.t==='vr')vcRoster(m.l);
  else if(m.t==='bye')netLost('The host ended the game.');
}
// the host's world: if this tab was opened for it, catch up with what's changed since; otherwise keep it in this tab's
// session storage and reload (everything the city works out is worked out afresh for its seed, which a reload makes sure of)
function netWelcome(m){
  let S=null;try{S=JSON.parse(m.save);}catch(e){}
  if(!S||typeof S.seed!=='number'){netStatus('The host sent a world this game can\'t read.');netClose();return;}
  NET.seat=m.seat|0;
  const J=netJoinFlag();
  if(S.seed!==seed||!J||J.code!==NET.code){
    try{sessionStorage.setItem(NET_SS_WORLD,m.save);sessionStorage.setItem(NET_SS_JOIN,JSON.stringify({code:NET.code,kind:NET.kind}));}
    catch(e){netStatus("Couldn't keep the host's world in this tab.");netClose();return;}
    NET.reloading=true;netStatus('Building the host\'s city...');
    try{NET.tr.close();}catch(e){}clearTimeout(saveTimer);saveBlocked=true;netReload();return;}
  netCatchUp(S);netClockSet(m.clock);
  NET.joined=true;NET.retry=null;saveBlocked=true;clearTimeout(saveTimer);
  netGuestBegin(m.host);
  netStatus('Playing online in room '+NET.code);
}
const netReload=()=>NET.onReload?NET.onReload():location.reload();   // (the tests catch it)
function netJoinFlag(){try{return JSON.parse(sessionStorage.getItem(NET_SS_JOIN)||'null');}catch(e){return null;}}
// (read by load(): this tab is a guest, and the host's world is the one to build)
function netWorldText(){try{if(netJoinFlag())return sessionStorage.getItem(NET_SS_WORLD);}catch(e){}return null;}
// the connection to the host dropped (not a goodbye): try again for half a minute before giving up
function netDropped(){
  if(!netGuest())return;if(!NET.joined)return netLost('The host left the game.');
  if(!NET.retry)NET.retry={since:NET.now};
  if(NET.now-NET.retry.since>30000)return netLost('Lost the connection to the host.');
  const T=NET.tr;NET.tr=null;NET.host=null;try{if(T)T.close();}catch(e){}
  netStatus('Connection to the host lost. Trying again...');flashLabel('Connection lost. Trying again...');
  setTimeout(netRetry,2000);
}
function netRetry(){if(!netGuest()||!NET.retry||NET.tr)return;if(NET.now-NET.retry.since>30000)return netLost('Lost the connection to the host.');
  netStartJoin(NET.code,NET.kind);setTimeout(()=>{if(NET.retry&&!NET.host)netDropped();},8000);}   // (nobody answered: try again)
function netLost(why){
  if(!netGuest())return;const was=NET.joined;netClose();
  netStatus(why);
  if(was){netLeaveWorld(why);}
}
// back to this browser's own city (the guest's) after a game online
function netLeaveWorld(why){
  try{sessionStorage.removeItem(NET_SS_JOIN);sessionStorage.removeItem(NET_SS_WORLD);sessionStorage.setItem('gsg-net-why',why||'');}catch(e){}
  netReload();
}
function netClose(){
  NET.retry=null;vcOff(true);chatReset();   // (voice and chat go with the game: the microphone's let go at once)
  if(!NET.tr){NET.mode=0;return;}
  try{if(netGuest()&&NET.host)NET.tr.send({t:'bye'},NET.host);else if(netHost())NET.tr.send({t:'bye'});}catch(e){}
  try{NET.tr.close();}catch(e){}
  if(netHost())for(const peer of [...NET.guests.keys()])netHostLeft(peer);
  NET.tr=null;NET.mode=0;NET.host=null;NET.joined=false;netBgClock();
}
// leaving from the menu: a guest goes home to its own city; a host just stops hosting and plays on alone
function netEnd(){
  if(netGuest()){const was=NET.joined;netClose();if(was)netLeaveWorld('');else netStatus('');}
  else if(netHost()){netClose();netStatus('Stopped hosting.');}
}
addEventListener('pagehide',()=>{if(netOn()&&!NET.reloading)netClose();});

// ---- a tab in the background ----
// A browser gives a tab that isn't showing no animation frames at all, and slows its timers to once a second or less.
// Offline that's a pause, which is fine; online it froze the host's game for everyone (and with two tabs of one browser,
// one of them is always in the background), and a guest stopped answering. So while online and hidden, a timer in a
// little worker, which browsers don't slow, runs the game on without drawing it (frame(now,true)).
const NET_BG={w:null,iv:0,on:false,last:0};
function netBgTick(){if(!NET_BG.on)return;if(!netOn()||!document.hidden){netBgClock();return;}const now=performance.now();if(now-NET_BG.last<10)return;NET_BG.last=now;try{frame(now,true);}catch(e){}}
function netBgClock(){
  const want=netOn()&&typeof document!=='undefined'&&!!document.hidden;if(want===NET_BG.on)return;NET_BG.on=want;
  if(!NET_BG.w&&!NET_BG.iv&&want){
    try{NET_BG.w=new Worker(URL.createObjectURL(new Blob(['let t=0;onmessage=e=>{clearInterval(t);if(e.data)t=setInterval(()=>postMessage(0),e.data);};'],{type:'text/javascript'})));NET_BG.w.onmessage=netBgTick;}
    catch(e){NET_BG.w=null;}}   // (no workers here: a plain timer, slowed as it may be, is better than nothing)
  if(NET_BG.w)NET_BG.w.postMessage(want?33:0);
  else{clearInterval(NET_BG.iv);NET_BG.iv=want?setInterval(netBgTick,33):0;}
}
try{document.addEventListener('visibilitychange',netBgClock);}catch(e){}

// ---- every frame ----
function netTick(now,dt){
  NET.now=now;if(!netOn())return;
  if(netHost()){
    netHostInputs();netGobHist();
    for(const p of [...NET.guests.values()]){const N=p.net;if(!N)continue;if(!N.gone&&now-N.heard>10000)netHostDropped(N.peer);else if(N.gone&&now-N.gone>30000)netHostLeft(N.peer);}   // (gone silent: its seat's kept half a minute, then comes free)
    NET.snapT-=dt*1000;if(NET.snapT<=0&&NET.guests.size){NET.snapT+=1000/NET_SNAP_HZ;if(NET.snapT<0)NET.snapT=0;for(const p of NET.guests.values())if(!p.net.gone)netSendSnap(p);}
    NET.fxOut=null;vcRosterTick(dt);
  } else if(NET.joined&&NET.tr&&NET.host){
    netSendInput(dt);
    NET.pingT-=dt;if(NET.pingT<=0){NET.pingT=2;NET.tr.send({t:'ping',a:now},NET.host);}
    if(now-NET.lastHeard>10000)netDropped();
  }
  chatTick(dt);if(VC.on)vcTick(dt);
}
// (guest: its own controls, read as usual into P1.in by readInputs, sent on to the host)
const NET_IN={pr:{},hh:{},fl:[0,0]};   // (presses, and buttons held at any moment, since the last message: a tap between two never goes missing)
function netSendInput(dt){
  const I=P1.in;for(const k of NET_PRESS)if(I[k])NET_IN.pr[k]=true;for(const k of NET_HELD)if(I[k])NET_IN.hh[k]=true;
  if(P1.flickReq){NET_IN.fl[0]=P1.flickReq;P1.flickReq=0;}if(P1.flickReqY){NET_IN.fl[1]=P1.flickReqY;P1.flickReqY=0;}
  NET.inT-=dt*1000;if(NET.inT>0)return;NET.inT+=1000/NET_IN_HZ;if(NET.inT<0)NET.inT=0;
  const h={};for(const k of NET_HELD)if(I[k]||NET_IN.hh[k])h[k]=1;NET_IN.hh={};
  const pr={};for(const k in NET_IN.pr)pr[k]=1;
  const m={t:'in',n:++NET.seq,vt:NET.off===null?null:Math.round(NET.now-NET.off-NET_DELAY),x:+(I.x||0).toFixed(3),z:+(I.z||0).toFixed(3),lx:+(I.lookX||0).toFixed(2),ly:+(I.lookY||0).toFixed(2),h,pr,yaw:+P1.cam.yaw.toFixed(4),pitch:+P1.cam.pitch.toFixed(4)};
  if(NET_IN.fl[0]||NET_IN.fl[1])m.fl=NET_IN.fl.slice();
  NET_IN.pr={};NET_IN.fl[0]=NET_IN.fl[1]=0;
  netPredSent(m.n);NET.tr.send(m,NET.host);
}
