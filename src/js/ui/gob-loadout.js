// ---- A goblin's loadout, on the Character tab (in place of the hippos' ability switches) ----
// Each seat picks what its goblin starts with: which of the weapons in WEAPONS he carries (a switch each, made from the
// table, so a new weapon shows up here by itself) and how many grenades, 0 to GREN_MAX. Kept per seat like the
// abilities (GOB_LOAD for player one, GOB_LOAD2 for player two, first copied from player one's); an online guest's come
// as p.gload. They're the seat's, not the character's, so Gnash and Grizzle stay the same (suite twins). gobArms reads
// them whenever a goblin is armed afresh, and a change in the menu re-arms that seat's goblin at once (gobRearm).
const GLOAD_KEY='goblin-stompin-gus-gob-loadout',GLOAD2_KEY='goblin-stompin-gus-gob-loadout2';
// (as a goblin was before there was a choice: just his club, no grenades)
const gloadDef=()=>{const w={};for(const k of GOB_WPN_ORDER)w[k]=k==='club';return{w,gren:0};};
// (mended: only weapons we know, a whole number of grenades in range, and never nothing in hand: the club, then)
function gloadFix(L){const D=gloadDef();if(!L||typeof L!=='object')return D;
  const w=L.w&&typeof L.w==='object'?L.w:{};for(const k of GOB_WPN_ORDER)D.w[k]=typeof w[k]==='boolean'?w[k]:D.w[k];
  if(!GOB_WPN_ORDER.some(k=>D.w[k]))D.w.club=true;
  D.gren=Math.max(0,Math.min(GREN_MAX,Math.round(+L.gren)||0));return D;}
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
function gobLoadArm(p){const L=gobLoadOf(p);p.wpns=GOB_WPN_ORDER.filter(k=>L.w[k]);if(!p.wpns.length)p.wpns=['club'];
  p.wpn=p.wpns[0];p.gren=L.gren;p.grenCD=0;}
// a change in the menu takes effect at once (anything picked up since is put down: the new choice is what he carries)
function gobRearm(p){if(!p||!p.gob)return;p.wpns=null;gobArms(p);p.wpnT=camClock;}
function gloadSave(seat){try{localStorage.setItem(GLOAD_KEYS[seat],JSON.stringify(GOB_LOADS[seat]));}catch(e){}
  for(const p of players)if(!p.net&&p.idx===seat)gobRearm(p);}
// The switches: built once from WEAPONS, two cards a row, then the grenade count
function gwpnBuild(){
  const list=document.getElementById('gwpnList');if(!list||list.firstChild)return list;
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const card=k=>'<button type="button" class="tog ab-base" role="switch" data-k="'+k+'"><span class="tl"><b class="nm">'+esc(WEAPONS[k].name)+'</b><small>'+esc(WEAPONS[k].about||'')+'</small></span><span class="st" aria-hidden="true"></span></button>';
  let h='<div class="ab-h" aria-hidden="true"><span class="px">Weapons</span></div>';
  for(let i=0;i<GOB_WPN_ORDER.length;i+=2)h+='<div class="ab-row" role="group" aria-label="Weapons">'+GOB_WPN_ORDER.slice(i,i+2).map(card).join('')+'</div>';
  const G=WEAPONS.grenade;
  h+='<div class="ab-h" aria-hidden="true"><span class="px">'+esc(G.name)+'</span></div><div class="ab-row" role="group" aria-label="'+esc(G.name)+'"><div class="tog ab-base gl-cnt"><span class="tl"><b class="nm">'+esc(G.name)+'</b><small>'+esc(G.about||'')+'</small></span>'
    +'<button type="button" class="gl-b" data-d="-1" aria-label="Fewer grenades">&minus;</button><span class="gl-n" aria-live="polite">0</span><button type="button" class="gl-b" data-d="1" aria-label="More grenades">+</button></div></div>';
  list.innerHTML=h;
  for(const b of list.querySelectorAll('.tog[data-k]'))b.addEventListener('click',()=>{
    const seat=abilSeat(),L=GOB_LOADS[seat],k=b.dataset.k;
    // (the last weapon carried stays: there's always something in hand)
    if(L.w[k]&&GOB_WPN_ORDER.filter(q=>L.w[q]).length<2){tone('square',180,0,0.06,0.03);return;}
    L.w[k]=!L.w[k];gloadSave(seat);renderGwpn();tone('triangle',L.w[k]?660:440,0,0.05,0.03);try{renderChar();}catch(e){}});
  for(const b of list.querySelectorAll('.gl-b'))b.addEventListener('click',()=>{
    const seat=abilSeat(),L=GOB_LOADS[seat],n=Math.max(0,Math.min(GREN_MAX,L.gren+(+b.dataset.d)));
    if(n===L.gren){tone('square',180,0,0.06,0.03);return;}
    L.gren=n;gloadSave(seat);renderGwpn();tone('triangle',440+n*30,0,0.05,0.03);try{renderChar();}catch(e){}});
  return list;
}
// The switches shown are those of whoever's menu it is, like the abilities (abilSeat)
function renderGwpn(){
  const seat=abilSeat(),L=GOB_LOADS[seat],list=gwpnBuild();if(!list)return;list.dataset.seat=String(seat);
  const n=GOB_WPN_ORDER.filter(k=>L.w[k]).length;
  for(const b of list.querySelectorAll('.tog[data-k]')){const k=b.dataset.k,on=!!L.w[k];b.setAttribute('aria-checked',String(on));
    const t=b.querySelector('.st');if(t)t.textContent=on&&n===1?'Last one':on?'On':'Off';}
  const c=list.querySelector('.gl-cnt');if(c){c.setAttribute('aria-checked',String(L.gren>0));const nm=c.querySelector('.gl-n');if(nm)nm.textContent=L.gren+' / '+GREN_MAX;
    const B=[...c.querySelectorAll('.gl-b')];if(B.length===2){B[0].setAttribute('aria-disabled',String(L.gren<=0));B[1].setAttribute('aria-disabled',String(L.gren>=GREN_MAX));}}   // (not disabled: the controller's focus stays on it)
  const no=document.getElementById('gwpnNote');
  if(no){let co=false;try{co=inCoop()&&!P2.net;}catch(e){}no.textContent=(co?(seat?"Player two's":"Player one's")+' loadout: it goes with you whichever goblin you pick. ':'')+'What he starts with. Tap a weapon to carry it or leave it behind (he always keeps one), and pick how many grenades. Anything else you take off the enemies you kill.';}
}
// which section the Character tab shows: the loadout for a goblin, the hippos' abilities for a hippo (the character
// the menu's seat has picked)
function charSecs(){const gob=charGob(abilSeat()?pick2():CHAR),a=document.getElementById('abilSec'),w=document.getElementById('gwpnSec');
  if(a)a.hidden=gob;if(w)w.hidden=!gob;}
renderGwpn();
