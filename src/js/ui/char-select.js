// ---------- Character select (title screen) ----------
// Who you play: Gus, Gertie or Gnash the goblin, kept in this browser. Picking Gertie makes player one Gertie (and a
// second player Gus); the two hippos differ only in looks and voice (dressHippo), never in what they can do. Goblin mode
// is each player's own (setGobP), so a second player can be a hippo or a goblin whatever player one is: the row under
// the cards (kept as CHAR2; left unpicked, player two is the same kind as player one). A hippo with Gnash is Gus; a
// goblin with a hippo is Gnash, and with Gnash his cousin Grizzle.
const CHAR_KEY='goblin-stompin-gus-character',CHAR2_KEY='goblin-stompin-gus-character2',CHARS=['gus','gertie','goblin'];
let CHAR='gus',CHAR2=null;
try{const s=localStorage.getItem(CHAR_KEY);if(CHARS.includes(s))CHAR=s;const t=localStorage.getItem(CHAR2_KEY);if(t==='hippo'||t==='goblin')CHAR2=t;}catch(e){}
const p2Kind=()=>CHAR2||(CHAR==='goblin'?'goblin':'hippo');
function charNote(){return 'Co-op: a second player joins as '+charName(P2)+'.';}
function renderChar(){
  for(const b of document.querySelectorAll('#charSel .cs-card'))b.setAttribute('aria-checked',String(b.dataset.c===CHAR));
  // (the buttons name who player two would be)
  for(const b of document.querySelectorAll('#charSel2 .cs-p2b')){const k=b.dataset.k;b.setAttribute('aria-checked',String(k===p2Kind()));
    b.textContent=k==='goblin'?(CHAR==='goblin'?'Grizzle (goblin)':'Gnash (goblin)'):(CHAR==='gus'?'Gertie (hippo)':'Gus (hippo)');}
  const n=document.getElementById('charNote');if(n)n.textContent=charNote();
}
function setChar(c,quiet){
  if(!CHARS.includes(c))return;CHAR=c;try{localStorage.setItem(CHAR_KEY,c);}catch(e){}
  charApply();if(!quiet)tone('triangle',c==='goblin'?520:660,0,0.05,0.03);
}
// player two's kind: 'hippo' or 'goblin'
function setChar2(k,quiet){
  if(k!=='hippo'&&k!=='goblin')return;CHAR2=k;try{localStorage.setItem(CHAR2_KEY,k);}catch(e){}
  charApply();if(!quiet)tone('triangle',k==='goblin'?520:660,0,0.05,0.03);
}
function charApply(){
  const g1=CHAR==='goblin',g2=p2Kind()==='goblin';
  P1.who=CHAR==='gertie'?1:0;P2.who=g1?0:1-P1.who;
  setGob(g1,g2);renderChar();
}
for(const b of document.querySelectorAll('#charSel .cs-card'))b.addEventListener('click',()=>setChar(b.dataset.c));
for(const b of document.querySelectorAll('#charSel2 .cs-p2b'))b.addEventListener('click',()=>setChar2(b.dataset.k));
setChar(CHAR,true);
