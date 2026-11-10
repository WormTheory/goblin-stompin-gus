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
function charNote(){return 'Co-op: player two plays as '+CHAR_NAMES[pick2()]+'.';}
function renderChar(){
  const c2=pick2();
  for(const b of document.querySelectorAll('#charSel .cs-row')){const c=b.dataset.seat==='1'?c2:CHAR;
    for(const k of b.querySelectorAll('.cs-card'))k.setAttribute('aria-checked',String(k.dataset.c===c));}
  const n=document.getElementById('charNote');if(n)n.textContent=charNote();
  // (the Game tab's line naming who you are: both of you in split screen. renderChar runs again as the menu opens)
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
for(const r of document.querySelectorAll('#charSel .cs-row'))for(const b of r.querySelectorAll('.cs-card'))b.addEventListener('click',()=>r.dataset.seat==='1'?setChar2(b.dataset.c):setChar(b.dataset.c));
{const l=document.getElementById('charLink');if(l)l.addEventListener('click',()=>{showTab('custom');const b=document.querySelector('#charSel .cs-row[data-seat="'+(menuP2()?1:0)+'"] .cs-card[aria-checked="true"]');if(b){if(inputKind==='pad')padFocus(b);else b.focus();}});}
setChar(CHAR,true);
