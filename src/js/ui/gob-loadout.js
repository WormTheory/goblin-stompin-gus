// ---- A goblin's loadout, on the Character tab (in place of the hippos' ability switches) ----
// Each seat picks what its goblin starts with: which of the weapons in WEAPONS he carries (a switch each, made from the
// table, so a new weapon shows up here by itself) and how many of each thing that comes in a pile (GOB_STACKS: grenades,
// 0 to GREN_MAX, and landmines, each kept under its player block's field, L.gren and L.mines). Kept per seat like the
// abilities (GOB_LOAD for player one, GOB_LOAD2 for player two, first copied from player one's); an online guest's come
// as p.gload. They're the seat's, not the character's, so Gnash and Grizzle stay the same (suite twins). gobArms reads
// them whenever a goblin is armed afresh, and a change in the menu re-arms that seat's goblin at once (gobRearm).
const GLOAD_KEY='goblin-stompin-gus-gob-loadout',GLOAD2_KEY='goblin-stompin-gus-gob-loadout2';
// (as a goblin was before there was a choice: just his club, no grenades)
const gloadDef=()=>{const w={},L={w};for(const k of GOB_PICK)w[k]=k==='club';for(const k of GOB_STACKS)L[stkField(k)]=0;return L;};
// (mended: only weapons we know, a whole number of grenades in range, and never nothing in hand: the club, then)
function gloadFix(L){const D=gloadDef();if(!L||typeof L!=='object')return D;
  const w=L.w&&typeof L.w==='object'?L.w:{};for(const k of GOB_PICK)D.w[k]=typeof w[k]==='boolean'?w[k]:D.w[k];
  if(!GOB_PICK.some(k=>D.w[k]))D.w.club=true;
  for(const k of GOB_STACKS){const f=stkField(k);D[f]=Math.max(0,Math.min(stkMax(k),Math.round(+L[f])||0));}return D;}
function gloadRead(key){try{const s=localStorage.getItem(key);return s?gloadFix(JSON.parse(s)):null;}catch(e){return null;}}
const GOB_LOAD=gloadRead(GLOAD_KEY)||gloadDef();
let GOB_LOAD2=gloadRead(GLOAD2_KEY);
if(!GOB_LOAD2){GOB_LOAD2=gloadFix(GOB_LOAD);try{localStorage.setItem(GLOAD2_KEY,JSON.stringify(GOB_LOAD2));}catch(e){}}
const GOB_LOADS=[GOB_LOAD,GOB_LOAD2],GLOAD_KEYS=[GLOAD_KEY,GLOAD2_KEY];
// a player goblin's own choice: an online guest's from their browser, else their seat's here (anything else, such as
// the Dev tab's preview goblin, starts as goblins always did)
const GLOAD_PLAIN=gloadDef();
const gobLoadOf=p=>p.gload||(players.includes(p)?GOB_LOADS[p.idx===1?1:0]:GLOAD_PLAIN);
// arm a player goblin from their choice (gobArms calls it for a goblin with no weapons yet)
// (a pile that's also held in hand, landmines, is carried as a weapon while there are any; every gun's magazine full)
function gobLoadArm(p){const L=gobLoadOf(p);p.wpns=GOB_WPN_ORDER.filter(k=>L.w[k]||WEAPONS[k].stack&&(L[stkField(k)]||0)>0);if(!p.wpns.length)p.wpns=['club'];
  // (a weapon he still carries keeps what's in its magazine, and stays in hand if it was; only a gun he's put down loses
  // its count, and a reload goes on if its gun's still the one in hand)
  const was=p.wpn,old=p.ammo||{};p.wpn=p.wpns.includes(was)?was:p.wpns[0];for(const k of GOB_STACKS)p[stkField(k)]=L[stkField(k)]||0;p.grenCD=0;
  p.ammo={};for(const k of p.wpns)if(old[k]!==undefined)p.ammo[k]=old[k];if(!(p.relT>0&&p.relW===p.wpn))p.relT=0;}
// a change in the menu takes effect at once (anything picked up since is put down: the new choice is what he carries)
function gobRearm(p){if(!p||!p.gob)return;p.wpns=null;gobArms(p);p.wpnT=camClock;}
function gloadSave(seat){try{localStorage.setItem(GLOAD_KEYS[seat],JSON.stringify(GOB_LOADS[seat]));}catch(e){}
  for(const p of players)if(!p.net&&p.idx===seat)gobRearm(p);}
// The switches: built once from WEAPONS, two cards a row, then a count for each pile (grenades, landmines)
function gwpnBuild(){
  const list=document.getElementById('gwpnList');if(!list||list.firstChild)return list;
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const card=k=>'<button type="button" class="tog ab-base" role="switch" data-k="'+k+'"><span class="tl"><b class="nm">'+esc(WEAPONS[k].name)+'</b><small>'+esc(WEAPONS[k].about||'')+'</small></span><span class="st" aria-hidden="true"></span></button>';
  let h='<div class="ab-h" aria-hidden="true"><span class="px">Weapons</span></div>';
  for(let i=0;i<GOB_PICK.length;i+=2)h+='<div class="ab-row" role="group" aria-label="Weapons">'+GOB_PICK.slice(i,i+2).map(card).join('')+'</div>';
  for(const k of GOB_STACKS){const G=WEAPONS[k],lo=esc(G.name.toLowerCase());
    h+='<div class="ab-h" aria-hidden="true"><span class="px">'+esc(G.name)+'</span></div><div class="ab-row" role="group" aria-label="'+esc(G.name)+'"><div class="tog ab-base gl-cnt" data-s="'+k+'"><span class="tl"><b class="nm">'+esc(G.name)+'</b><small>'+esc(G.about||'')+'</small></span>'
      +'<button type="button" class="gl-b" data-d="-1" aria-label="Fewer '+lo+'">&minus;</button><span class="gl-n" aria-live="polite">0</span><button type="button" class="gl-b" data-d="1" aria-label="More '+lo+'">+</button></div></div>';}
  list.innerHTML=h;
  for(const b of list.querySelectorAll('.tog[data-k]'))b.addEventListener('click',()=>{
    const seat=abilSeat(),L=GOB_LOADS[seat],k=b.dataset.k;
    // (the last weapon carried stays: there's always something in hand)
    if(L.w[k]&&GOB_PICK.filter(q=>L.w[q]).length<2){tone('square',180,0,0.06,0.03);return;}
    L.w[k]=!L.w[k];gloadSave(seat);renderGwpn();tone('triangle',L.w[k]?660:440,0,0.05,0.03);try{renderChar();}catch(e){}});
  for(const b of list.querySelectorAll('.gl-b'))b.addEventListener('click',()=>{
    const seat=abilSeat(),L=GOB_LOADS[seat],sk=b.closest('.gl-cnt').dataset.s,f=stkField(sk),n=Math.max(0,Math.min(stkMax(sk),(L[f]||0)+(+b.dataset.d)));
    if(n===L[f]){tone('square',180,0,0.06,0.03);return;}
    L[f]=n;gloadSave(seat);renderGwpn();tone('triangle',440+n*30,0,0.05,0.03);try{renderChar();}catch(e){}});
  return list;
}
// The switches shown are those of whoever's menu it is, like the abilities (abilSeat)
function renderGwpn(){
  const seat=abilSeat(),L=GOB_LOADS[seat],list=gwpnBuild();if(!list)return;list.dataset.seat=String(seat);
  const n=GOB_PICK.filter(k=>L.w[k]).length;
  for(const b of list.querySelectorAll('.tog[data-k]')){const k=b.dataset.k,on=!!L.w[k];b.setAttribute('aria-checked',String(on));
    const t=b.querySelector('.st');if(t)t.textContent=on&&n===1?'Last one':on?'On':'Off';}
  for(const c of list.querySelectorAll('.gl-cnt')){const sk=c.dataset.s,v=L[stkField(sk)]||0,mx=stkMax(sk);c.setAttribute('aria-checked',String(v>0));const nm=c.querySelector('.gl-n');if(nm)nm.textContent=v+' / '+mx;
    const B=[...c.querySelectorAll('.gl-b')];if(B.length===2){B[0].setAttribute('aria-disabled',String(v<=0));B[1].setAttribute('aria-disabled',String(v>=mx));}}   // (not disabled: the controller's focus stays on it)
  const no=document.getElementById('gwpnNote');
  if(no){let co=false;try{co=inCoop()&&!P2.net;}catch(e){}no.textContent=(co?(seat?"Player two's":"Player one's")+' loadout. ':'')+'Always keeps at least one.';}
}
// which section the Character tab shows: the loadout for a goblin, the hippos' abilities for a hippo (the character
// the menu's seat has picked)
function charSecs(){const gob=charGob(abilSeat()?pick2():CHAR),a=document.getElementById('abilSec'),w=document.getElementById('gwpnSec');
  if(a)a.hidden=gob;if(w)w.hidden=!gob;}
renderGwpn();
