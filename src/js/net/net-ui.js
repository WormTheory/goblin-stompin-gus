// ---------- Online co-op: the Play online panel on the main menu ----------
const netEl=id=>document.getElementById(id);
const netUiOpen=()=>{const e=netEl('onlinePanel');return !!e&&!e.hidden;};
function netUiStatus(s){const e=netEl('netStatus');if(e&&e.textContent!==s)e.textContent=s;netUiRefresh();}
function netUiRefresh(){
  const on=netOn(),code=netEl('netCodeShow');
  for(const id of ['netHost','netJoin'])netEl(id).disabled=on;
  netEl('netCode').disabled=on;netEl('netLocal').disabled=on||typeof BroadcastChannel==='undefined';
  netEl('netLeave').hidden=!on;netEl('netLeave').textContent=netHost()?'Stop hosting':'Leave the online game';
  code.hidden=!(netHost()&&NET.code);code.textContent=netHost()?NET.code:'';
  // (no swapping the city out from under someone who's in it)
  for(const id of ['newWorld','testWorld'])netEl(id).disabled=on;
  // (with someone else in the game, Play goes back to it; and how hostile the enemies are is the host's to say)
  const pl=netEl('play'),t=on&&P2.net?(netGuest()?'Back to the game':'Back to the online game'):'Play solo';if(pl.textContent!==t)pl.textContent=t;
  netEl('playCoop').hidden=on&&!!P2.net;netEl('hostMain').disabled=netGuest()&&NET.joined;
  netEl('netPrivate').checked=LOBBY.priv;
  lobbySync();
}
{
  const pan=netEl('onlinePanel'),btn=netEl('onlineBtn');
  const show=v=>{pan.hidden=!v;btn.setAttribute('aria-expanded',String(v));lobbySync();};
  btn.addEventListener('click',()=>show(pan.hidden));
  const kind=()=>netEl('netLocal').checked?'loop':'p2p';
  netEl('netHost').addEventListener('click',()=>netStartHost(kind()));
  const join=()=>netStartJoin(netEl('netCode').value,kind());
  netEl('netJoin').addEventListener('click',join);
  netEl('netCode').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')join();});
  netEl('netLeave').addEventListener('click',()=>netEnd());
  // (ticking it says straight away what it's for and how it goes, so it's plain it's taken)
  netEl('netLocal').addEventListener('change',()=>{if(netOn())return;
    netUiStatus(netEl('netLocal').checked?'Two tabs of this browser: host a game in one tab, then open the game in another tab of this same browser, tick this there too, and pick it from Open games or join with the code.'+(netFromFile()?NET_FILE_TIP:'')
      :'Over the internet: host a game, or pick one from the list, or type in a room code and join.');lobbySync();});
  // (a private game stays out of the list: only someone given its room code can join it)
  netEl('netPrivate').addEventListener('change',()=>{LOBBY.priv=netEl('netPrivate').checked;try{localStorage.setItem('gsg-net-private',LOBBY.priv?'1':'0');}catch(e){}netUiRefresh();});
  netUiRefresh();
  // a tab that reloaded to build the host's city: join again at once (the host lets it straight back in)
  const J=netJoinFlag();
  if(J&&J.code){show(true);netEl('netCode').value=J.code;netEl('netLocal').checked=J.kind==='loop';setTimeout(()=>netStartJoin(J.code,J.kind||'p2p'),0);}
  let why=null;try{why=sessionStorage.getItem('gsg-net-why');sessionStorage.removeItem('gsg-net-why');}catch(e){}
  if(why){show(true);netUiStatus(why);}
}
