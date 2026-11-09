// ---------- Online co-op: the list of open games ----------
// GitHub Pages only serves files, so there's no server to keep a list of who's hosting. Instead everyone looking at the
// Play online panel, and every host whose game isn't private, joins one shared room of their own (`NET_LOBBY`, through
// the same transport as a game: Trystero online, the BroadcastChannel between tabs). A host there tells everyone about
// its game (an `ad`: its room code, who's hosting, how many are in), when someone arrives and every few seconds; a
// browser lists the ads it's heard lately, and picking one joins that room code as if it had been typed in.
// Nothing about the game itself goes through the lobby, and a private game never enters it: its code still works.
const NET_LOBBY='gsg-lobby-'+NET_PROTO;   // (room codes are letters only, so a game can never land in it; and a new protocol gets a lobby of its own, so nobody's offered a game they can't join)
const LOBBY_AD_MS=3000,LOBBY_TTL=10000;   // (a host's ad goes out this often; one not heard from for this long has gone)
// (how long to say it's still looking before saying there's nothing: finding the others online takes a few seconds)
const lobbyLooking=()=>LOBBY.opening||lobbyNow()-LOBBY.since<(LOBBY.kind==='loop'?2000:8000);
const LOBBY={tr:null,kind:'',opening:null,ads:new Map(),adv:'',sentAt:-1e9,since:0,iv:0,
  priv:(()=>{try{return localStorage.getItem('gsg-net-private')==='1';}catch(e){return false;}})()};
const lobbyNow=()=>Date.now();
// this browser's game, as the lobby sees it (null: nothing to tell it about)
function lobbyAd(){
  if(!netHost()||LOBBY.priv||!NET.code||NET.kind!==LOBBY.kind)return null;
  return{t:'ad',code:NET.code,who:charName(P1),n:Math.min(NET_SEATS,1+NET.guests.size),max:NET_SEATS,tenv:!!TENV};
}
// should this browser be in the lobby at all: looking at the panel (and not already in someone's game), or hosting a listed game
function lobbyWanted(){
  if(netHost())return !LOBBY.priv||netUiOpen();
  return netUiOpen()&&!netGuest();
}
function lobbyKind(){return netOn()?NET.kind:(netEl('netLocal').checked?'loop':'p2p');}
async function lobbyOpen(kind){
  const tok={};LOBBY.opening=tok;LOBBY.kind=kind;LOBBY.ads.clear();LOBBY.since=lobbyNow();lobbyRender();
  let tr=null;
  try{tr=await netOpen(kind,NET_LOBBY);}catch(e){if(LOBBY.opening===tok){LOBBY.opening=null;LOBBY.err=String(e&&e.message||e);lobbyRender();}return;}
  if(LOBBY.opening!==tok){try{tr.close();}catch(e){}return;}   // (wanted something else by the time it opened)
  LOBBY.opening=null;LOBBY.err='';LOBBY.tr=tr;
  tr.on.msg=lobbyMsg;
  tr.on.join=peer=>{const a=lobbyAd();if(a)tr.send(a,peer);};
  tr.on.leave=peer=>{if(LOBBY.ads.delete(peer))lobbyRender();};
  tr.send({t:'ask'});
  if(!LOBBY.iv)LOBBY.iv=setInterval(lobbyTick,1000);
  lobbyTick();
}
function lobbyClose(){
  LOBBY.opening=null;clearInterval(LOBBY.iv);LOBBY.iv=0;
  if(LOBBY.tr){try{if(LOBBY.adv)LOBBY.tr.send({t:'gone',code:LOBBY.adv});}catch(e){}try{LOBBY.tr.close();}catch(e){}}
  LOBBY.tr=null;LOBBY.adv='';LOBBY.ads.clear();lobbyRender();
}
function lobbyMsg(peer,m){
  if(!m||typeof m!=='object')return;
  if(m.t==='ask'){const a=lobbyAd();if(a)LOBBY.tr.send(a,peer);return;}
  if(m.t==='gone'){if(LOBBY.ads.delete(peer))lobbyRender();return;}
  if(m.t!=='ad')return;
  // (what other people's browsers say is only shown as text, and only once it looks like what a host sends)
  const code=String(m.code||'').toUpperCase();if(!/^[A-Z]{4,8}$/.test(code))return;
  const max=Math.max(1,Math.min(16,m.max|0||NET_SEATS)),n=Math.max(1,Math.min(max,m.n|0||1));
  const who=String(m.who||'Someone').replace(/[^\w '\-]/g,'').slice(0,24)||'Someone';
  const was=LOBBY.ads.get(peer);
  LOBBY.ads.set(peer,{code,who,n,max,tenv:!!m.tenv,at:lobbyNow()});
  if(!was||was.n!==n||was.code!==code||was.who!==who)lobbyRender();
}
// once a second: say what this host's game is like (when it changed, or every few seconds), and drop hosts gone quiet
function lobbyTick(){
  if(!LOBBY.tr)return;
  const a=lobbyAd(),now=lobbyNow();
  if(a){const key=a.code+a.n+a.who+a.tenv;if(key!==LOBBY.advKey||now-LOBBY.sentAt>=LOBBY_AD_MS){LOBBY.tr.send(a);LOBBY.sentAt=now;LOBBY.advKey=key;}LOBBY.adv=a.code;}
  else if(LOBBY.adv){LOBBY.tr.send({t:'gone',code:LOBBY.adv});LOBBY.adv='';LOBBY.advKey='';}
  for(const [k,v] of LOBBY.ads)if(now-v.at>LOBBY_TTL)LOBBY.ads.delete(k);
  lobbyRender();   // (cheap when nothing's changed; and the "looking" line turns into "none" once a host would have spoken up)
}
// called whenever the panel or the online state changes: in the lobby or out of it, the right way, telling it what's changed
function lobbySync(){
  const want=lobbyWanted(),kind=lobbyKind();
  if(!want){if(LOBBY.tr||LOBBY.opening)lobbyClose();else lobbyRender();return;}
  if(kind==='loop'&&typeof BroadcastChannel==='undefined'&&!NET.makeTr){lobbyRender();return;}
  if((LOBBY.tr||LOBBY.opening)&&LOBBY.kind===kind){lobbyTick();lobbyRender();return;}
  if(LOBBY.tr||LOBBY.opening)lobbyClose();
  lobbyOpen(kind);
}
// the list on the panel
function lobbyRender(){
  const box=netEl('netList');if(!box)return;
  const show=netUiOpen()&&!netGuest();box.hidden=!show;if(!show)return;
  const list=netEl('netGames'),note=netEl('netGamesNote');
  const ads=[...LOBBY.ads.values()].filter(a=>!(netHost()&&a.code===NET.code)).sort((a,b)=>(a.n>=a.max)-(b.n>=b.max)||a.code.localeCompare(b.code));
  const keyOf=a=>a.code+'|'+a.who+'|'+a.n+'|'+a.max+'|'+a.tenv;
  const key=ads.map(keyOf).join(',')+'/'+netOn();
  if(list.dataset.key!==key){
    list.dataset.key=key;list.textContent='';
    for(const a of ads){
      const full=a.n>=a.max,b=document.createElement('button');b.type='button';b.className='on-game';b.disabled=full||netOn();
      b.dataset.code=a.code;
      const nm=document.createElement('span');nm.className='on-gname';nm.textContent=a.who+"'s game";
      const info=document.createElement('span');info.className='on-ginfo';info.textContent=a.n+'/'+a.max+' players'+(a.tenv?' · Testing Environment':'')+' · '+a.code;
      const go=document.createElement('span');go.className='on-ggo';go.textContent=full?'Full':'Join';
      b.append(nm,info,go);
      b.addEventListener('click',()=>{if(netOn())return;netEl('netCode').value=a.code;netStartJoin(a.code,LOBBY.kind);});
      list.appendChild(b);
    }
  }
  let t='';
  if(LOBBY.err&&!LOBBY.tr)t="Couldn't look for open games: "+LOBBY.err;
  else if(!ads.length)t=lobbyLooking()?'Looking for open games...':'No open games right now. Host one, or join a friend\'s private game with its room code.';
  if(note.textContent!==t)note.textContent=t;
}
addEventListener('pagehide',()=>{if(LOBBY.tr)lobbyClose();});
