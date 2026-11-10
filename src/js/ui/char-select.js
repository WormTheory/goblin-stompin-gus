// ---------- Character select (the menu's Character tab) ----------
// Who each player is: any of Gus, Gertie, Gnash or Grizzle, kept in this browser per seat. The two hippos differ only
// in looks and voice (dressHippo), never in what they can do, and so do the two goblins; goblin mode is each player's
// own (setGobP). A player's look is p.who (0 Gus or Gnash, 1 Gertie or Grizzle). Picking the character the other
// player has swaps the two of you over, so you can always tell each other apart. Player two left unpicked (CHAR2 null,
// as before there was a row for them) is player one's twin: Gertie with Gus, Grizzle with Gnash.
const CHAR_KEY='goblin-stompin-gus-character',CHAR2_KEY='goblin-stompin-gus-character2',CHARS=['gus','gertie','gnash','grizzle'];
const CHAR_TWIN={gus:'gertie',gertie:'gus',gnash:'grizzle',grizzle:'gnash'};
const charGob=c=>c==='gnash'||c==='grizzle',charWho=c=>c==='gertie'||c==='grizzle'?1:0;
let CHAR='gus',CHAR2=null;
// (older saves and callers: player one 'goblin' was Gnash; player two was just 'hippo' or 'goblin', not whichever of player one)
const charLegacy2=k=>k==='goblin'?(CHAR==='gnash'?'grizzle':'gnash'):k==='hippo'?(CHAR==='gus'?'gertie':'gus'):k;
try{let s=localStorage.getItem(CHAR_KEY);if(s==='goblin')s='gnash';if(CHARS.includes(s))CHAR=s;
  const t=charLegacy2(localStorage.getItem(CHAR2_KEY));if(CHARS.includes(t)&&t!==CHAR)CHAR2=t;}catch(e){}
const pick2=()=>CHAR2&&CHAR2!==CHAR?CHAR2:CHAR_TWIN[CHAR];
const p2Kind=()=>charGob(pick2())?'goblin':'hippo';
const CHAR_NAMES={gus:'Gus',gertie:'Gertie',gnash:'Gnash',grizzle:'Grizzle'};
function charNote(){return 'Pick the one the other player has and you swap over. Co-op: player two plays as '+CHAR_NAMES[pick2()]+'.';}
// Which player the cards pick for (CS_SEAT, 0 or 1): player one's own menu can pick for either seat, player two's only
// for player two. The cards are one row: the 1P tag sits on player one's pick, the 2P tag on player two's.
let CS_SEAT=0;
const csSeat=()=>{let two=false;try{two=menuP2();}catch(e){}return two?1:CS_SEAT;};
// what each character can do, for the strip under the cards (a hippo's from the ability switches as they are now)
const CS_GOB_MOVES=['Club','Dagger','Rifle','Grenades','Dash','Drive anything'];
function csMoves(c){
  if(charGob(c))return CS_GOB_MOVES;
  const A=ABIL,L=[];
  if(A.bite)L.push(A.biteCombo?'Bite combo':'Bite');
  if(A.stomp)L.push(A.fullStomp?'Full charge stomp':A.chargeStomp?'Charge stomp':'Stomp');
  if(A.groundSpike&&A.stomp)L.push('Ground spike');
  if(A.pound)L.push('Ground pound');
  if(A.sprint)L.push(A.trample?'Trample':'Sprint');
  if(A.dash)L.push(A.roll?'Roll':A.blastDash?'Blast dash':'Dash');
  if(A.jump)L.push(A.triple?'Triple jump':A.double?'Double jump':'Jump');
  if(A.longJump)L.push(A.blastJump?'Blast long jump':'Long jump');
  if(A.airDash)L.push(A.blastAirDash?'Blast air dash':'Air dash');
  if(A.rocket&&A.jump)L.push('Rocket boost');
  if(A.climb)L.push('Spider climb');
  return L;
}
function renderChar(){
  const c2=pick2(),seat=csSeat();
  const row=document.getElementById('charRow');
  if(row){row.dataset.seat=String(seat);
    for(const k of row.querySelectorAll('.cs-card')){const c=k.dataset.c;k.setAttribute('aria-checked',String(c===(seat?c2:CHAR)));
      k.classList.toggle('p1',c===CHAR);k.classList.toggle('p2',c===c2);
      const pic=k.querySelector('.cs-pic');if(pic&&!pic.dataset.done){pic.dataset.done='1';pic.className='cs-pic '+sprCls(pic.dataset.spr,6);}}}
  for(const b of document.querySelectorAll('#csSeat [data-seat]'))b.setAttribute('aria-checked',String(+b.dataset.seat===seat));
  const n=document.getElementById('charNote');if(n)n.textContent=charNote();
  // (the moves strip: whoever's highlighted, or the seat's pick)
  {const f=document.activeElement,fc=f&&f.closest&&f.closest('#charRow .cs-card'),c=fc?fc.dataset.c:seat?c2:CHAR;
   const h=document.getElementById('csCanH'),m=document.getElementById('csMoves');
   if(h)h.textContent=CHAR_NAMES[c].toUpperCase()+' CAN:';
   if(m){const html=csMoves(c).map(t=>'<span class="sticker px">'+t+'</span>').join('');if(m._h!==html){m._h=html;m.innerHTML=html;}}}
  // (the title menu's line naming who you are: both of you in split screen. renderChar runs again as the menu opens)
  let two=false;try{two=begun&&P2.active&&!P2.net;menuWhoShow();}catch(e){}   // (not yet while the page loads: begun is declared later on)
  const l=document.getElementById('charLinkName');if(l)l.textContent=CHAR_NAMES[CHAR]+(two?' and '+CHAR_NAMES[c2]:'');
}
function charSave(){try{localStorage.setItem(CHAR_KEY,CHAR);if(CHAR2)localStorage.setItem(CHAR2_KEY,CHAR2);}catch(e){}}
// player one's pick ('goblin' still means Gnash)
function setChar(c,quiet){
  if(c==='goblin')c='gnash';if(!CHARS.includes(c))return;
  if(c===CHAR2)CHAR2=CHAR;   // (the other player had them: swap)
  CHAR=c;charSave();charApply();if(!quiet)tone('triangle',charGob(c)?520:660,0,0.05,0.03);
}
// player two's pick ('hippo' and 'goblin' still mean whichever of the two player one isn't)
function setChar2(c,quiet){
  c=charLegacy2(c);if(!CHARS.includes(c))return;
  if(c===CHAR)CHAR=pick2();   // (swap)
  CHAR2=c;charSave();charApply();if(!quiet)tone('triangle',charGob(c)?520:660,0,0.05,0.03);
}
function charApply(){
  const c2=pick2(),seats=[[P1,CHAR]];if(!P2.net)seats.push([P2,c2]);   // (online, player two's seat is someone else's own pick)
  for(const [p,c] of seats){p.who=charWho(c);setGobP(p,charGob(c));}
  for(const p of players)dressHippo(p);renderTime();renderChar();
}
for(const b of document.querySelectorAll('#charRow .cs-card')){b.addEventListener('click',()=>csSeat()?setChar2(b.dataset.c):setChar(b.dataset.c));b.addEventListener('focus',()=>renderChar());}
for(const b of document.querySelectorAll('#csSeat [data-seat]'))b.addEventListener('click',()=>{CS_SEAT=+b.dataset.seat;renderChar();tone('triangle',CS_SEAT?620:560,0,0.05,0.03);});
for(const b of document.querySelectorAll('#abilList .tog'))b.addEventListener('click',()=>renderChar());   // (the moves strip follows the switches)
{const l=document.getElementById('charLink');if(l)l.addEventListener('click',()=>{openSub('custom','charLink');const b=document.querySelector('#charRow .cs-card[aria-checked="true"]');if(b){if(inputKind==='pad')padFocus(b);else b.focus();}});}
setChar(CHAR,true);
