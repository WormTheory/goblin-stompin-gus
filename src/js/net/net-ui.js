// ---------- Online co-op: the Play online panel on the main menu ----------
const netEl=id=>document.getElementById(id);
function netUiStatus(s){const e=netEl('netStatus');if(e&&e.textContent!==s)e.textContent=s;netUiRefresh();}
function netUiRefresh(){
  const on=netOn(),code=netEl('netCodeShow');
  for(const id of ['netHost','netJoin'])netEl(id).disabled=on;
  netEl('netCode').disabled=on;netEl('netLocal').disabled=on;
  netEl('netLeave').hidden=!on;netEl('netLeave').textContent=netHost()?'Stop hosting':'Leave the online game';
  code.hidden=!(netHost()&&NET.code);code.textContent=netHost()?NET.code:'';
  // (no swapping the city out from under someone who's in it)
  for(const id of ['newWorld','testWorld'])netEl(id).disabled=on;
  // (with someone else in the game, Play goes back to it; and how hostile the enemies are is the host's to say)
  const pl=netEl('play'),t=on&&P2.net?(netGuest()?'Back to the game':'Back to the online game'):'Play solo';if(pl.textContent!==t)pl.textContent=t;
  netEl('playCoop').hidden=on&&!!P2.net;netEl('hostMain').disabled=netGuest()&&NET.joined;
}
{
  const pan=netEl('onlinePanel'),btn=netEl('onlineBtn');
  const show=v=>{pan.hidden=!v;btn.setAttribute('aria-expanded',String(v));};
  btn.addEventListener('click',()=>show(pan.hidden));
  const kind=()=>netEl('netLocal').checked?'loop':'p2p';
  netEl('netHost').addEventListener('click',()=>netStartHost(kind()));
  const join=()=>netStartJoin(netEl('netCode').value,kind());
  netEl('netJoin').addEventListener('click',join);
  netEl('netCode').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')join();});
  netEl('netLeave').addEventListener('click',()=>netEnd());
  netUiRefresh();
  // a tab that reloaded to build the host's city: join again at once (the host lets it straight back in)
  const J=netJoinFlag();
  if(J&&J.code){show(true);netEl('netCode').value=J.code;netEl('netLocal').checked=J.kind==='loop';setTimeout(()=>netStartJoin(J.code,J.kind||'p2p'),0);}
  let why=null;try{why=sessionStorage.getItem('gsg-net-why');sessionStorage.removeItem('gsg-net-why');}catch(e){}
  if(why){show(true);netUiStatus(why);}
}
