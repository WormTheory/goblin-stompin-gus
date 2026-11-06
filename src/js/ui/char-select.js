// ---------- Character select (title screen) ----------
// Who you play: Gus, Gertie or Gnash the goblin, kept in this browser. Picking Gertie makes player one Gertie (and a
// second player Gus); the two hippos differ only in looks and voice (dressHippo), never in what they can do. Gnash is
// goblin mode (setGob): it's the whole game's, so in co-op both players are goblins, Gnash and his cousin Grizzle.
const CHAR_KEY='goblin-stompin-gus-character',CHARS=['gus','gertie','goblin'];
let CHAR='gus';
try{const s=localStorage.getItem(CHAR_KEY);if(CHARS.includes(s))CHAR=s;}catch(e){}
function charNote(){
  return CHAR==='goblin'?'Co-op: a second player joins as Grizzle, another goblin.':'Co-op: a second player joins as '+(CHAR==='gertie'?'Gus':'Gertie')+'.';
}
function renderChar(){
  for(const b of document.querySelectorAll('#charSel .cs-card'))b.setAttribute('aria-checked',String(b.dataset.c===CHAR));
  const n=document.getElementById('charNote');if(n)n.textContent=charNote();
}
function setChar(c,quiet){
  if(!CHARS.includes(c))return;CHAR=c;try{localStorage.setItem(CHAR_KEY,c);}catch(e){}
  P1.who=c==='gertie'?1:0;P2.who=1-P1.who;
  setGob(c==='goblin');for(const p of players)dressHippo(p);
  renderChar();if(!quiet)tone('triangle',c==='goblin'?520:660,0,0.05,0.03);
}
for(const b of document.querySelectorAll('#charSel .cs-card'))b.addEventListener('click',()=>setChar(b.dataset.c));
setChar(CHAR,true);
