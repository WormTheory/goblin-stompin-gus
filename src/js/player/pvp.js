// ---- PvP (Options, kept in this browser, off at first): players can lock on to one another, and their attacks,
// shots and vehicles hurt one another as they hurt goblins. Off, nothing here does anything. Online it's the host's
// that counts: it goes to guests with the clock (netClock, as NET_PVP), and a guest's switch only shows it ----
const PVP_KEY='goblin-stompin-gus-pvp',PVP_TXT=['Players can\'t lock on to or hurt each other with their attacks (blasts still catch anyone near)','Players can lock on to each other, and every attack, shot, blast and vehicle hurts another player as it would a goblin'];
DT.pvp=false;try{DT.pvp=localStorage.getItem(PVP_KEY)==='1';}catch(e){}
let NET_PVP=false;   // (the host's, while a guest)
const pvpGuest=()=>{try{return netGuest()&&NET.joined;}catch(e){return false;}};   // (NET isn't made yet while the page loads)
const pvpOn=()=>pvpGuest()?NET_PVP:DT.pvp;
// PVP_K: a goblin's hit points are a handful and a player's are 20, so a hippo's blows (a bite's 10, a full stomp's 25)
// come down to about a third against another player; blows of 3 or less (Gnash's club, dagger and guns) land as they
// are. PVP_CD: the same attacker can't hurt the same player again for this long (a trample or a dash hits every frame)
const PVP_K=0.3,PVP_CD=0.45;
const isPlT=t=>!!t&&players.includes(t);
const NO_PVP=[];
// the players p can hurt now: everyone else who's in the game, alive, and not inside a vehicle (the vehicle takes it)
function pvpFoes(p){if(!p||!pvpOn()||!isPlT(p))return NO_PVP;return players.filter(q=>q!==p&&q.active&&q.state!=='dead'&&!q.drv);}
// the obituary's and the messages' name for the one who did it (killerName reads .name)
const pvpWho=p=>({name:charName(p),pvp:p});
// player p's blow of n (in goblin damage, unless o.raw) on player q; o.cd, if given, in place of PVP_CD (a gun's rounds)
function pvpHurt(p,q,n,pt,dir,cause,o){const raw=o&&o.raw,cd=o&&o.cd!==undefined?o.cd:PVP_CD;
  const T=q.pvpT||(q.pvpT=new Map()),t0=T.get(p),now=playTime;if(t0!==undefined&&now-t0<cd&&now>=t0)return false;T.set(p,now);
  const dmg=raw?n:n<=3?n:Math.max(3,Math.round(n*PVP_K)),alive=q.state!=='dead';
  damagePlayer(q,dmg,pt||new V3(q.pos.x,q.pos.y+1.1,q.pos.z),dir,cause,pvpWho(p));
  if(alive&&q.state==='dead')pvpKilled(p,q);
  return true;
}
// a kill: both told who did it, and points for it
function pvpKilled(p,q){flashLabel(charName(q)+' was killed by '+charName(p),q);award(500,charName(q)+' flattened',q.pos.x,q.pos.y+2,q.pos.z,p);}
// the hitGoblins of players: everyone within r of (x,z), and at height y (if given) within reach
function pvpArea(p,x,z,r,n,cause,y){
  for(const q of pvpFoes(p)){const dx=q.pos.x-x,dz=q.pos.z-z,dy=y===undefined?0:q.pos.y-y,d=Math.hypot(dx,dz)||0.01;
    if(Math.hypot(d,dy)<r&&(y===undefined||vReach(dy,r)))pvpHurt(p,q,n,new V3(q.pos.x,q.pos.y+1.1,q.pos.z),new V3(dx/d,0.6,dz/d),cause);}}
// the player nearest along a ray from (x,y,z) heading (ux,uy,uz), out to R, as a gun's round meets them ({q,t} or null)
function pvpRay(p,x,y,z,ux,uy,uz,R){let best=null,bt=R;
  for(const q of pvpFoes(p)){const hr=q.gob?0.45:0.9,ht=q.gob?0.8:1.2,ox=q.pos.x-x,oy=q.pos.y+ht-y,oz=q.pos.z-z,t=ox*ux+oy*uy+oz*uz;if(t<0||t>=bt)continue;
    const cx=ox-ux*t,cy=oy-uy*t,cz=oz-uz*t;if(cx*cx+cz*cz<hr*hr&&Math.abs(cy)<ht+0.3){bt=t;best={q,t};}}
  return best;}
// a shell, grenade, rocket or missile a player sent: who to blame for its blast (only with PvP on, so with it off the
// obituary reads as it always has)
const pvpBy=p=>pvpOn()&&isPlT(p)?pvpWho(p):null;
// a vehicle's driver or gunner, if that's a player
const pvpDriver=o=>o&&isPlT(o.drv)?o.drv:o&&isPlT(o.gnr)?o.gnr:null;
// ---- the Options switch ----
function setPvp(v){v=!!v;if(pvpGuest())return syncPvp();if(v!==DT.pvp){DT.pvp=v;try{localStorage.setItem(PVP_KEY,v?'1':'0');}catch(e){}}   // (switched off, a lock on a player lets go by itself: see lockAlive)
  syncPvp();}
// (a guest's switch shows the host's, can't be changed, and says so)
function syncPvp(){const on=pvpOn(),g=pvpGuest();
  for(const b of document.querySelectorAll('#pvpSeg [data-pvp]')){b.setAttribute('aria-checked',String(+b.dataset.pvp===(on?1:0)));b.disabled=g;}
  const t=document.getElementById('pvpTxt');if(t)t.textContent=PVP_TXT[on?1:0]+(g?' (set by the host)':'');}
for(const b of document.querySelectorAll('#pvpSeg [data-pvp]'))b.addEventListener('click',()=>{if(pvpGuest())return;if((+b.dataset.pvp===1)!==DT.pvp)tone('triangle',+b.dataset.pvp?660:440,0,0.05,0.03);setPvp(+b.dataset.pvp===1);});
syncPvp();
