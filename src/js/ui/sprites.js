// ---------- Pixel sprites (the menus' and HUD's little portraits and hearts) ----------
// Drawn the way the style kit draws them: one tiny square with a box-shadow per pixel, so they stay crisp at any size
// and need no image files. Each is a grid of letters, a letter per colour in its palette ('.' is see-through).
// sprCls(name,px) makes the CSS for that sprite at that pixel size the first time it's asked for and gives back the
// class to put on an empty element (width and height come with it); sprHTML is the same as markup.
const SPR={
  gus:{c:['#2b1b2e','#8f86a8','#ffffff','#bdb5d0','#e8798a'],g:[
    '..aa......aa..','.abba....abba.','.abbaaaaaabba.','abbbbbbbbbbbba','abbcabbbbcabba','abbccbbbbccbba',
    'adddddddddddda','adaddddddddada','adddddddddddda','aeceeeeeeeceea','.aeeeeeeeeeea.','..aaaaaaaaaa..']},
  gertie:{c:['#e2336b','#2b1b2e','#e99a8a','#ffffff','#f8c8b8','#c9455e'],g:[
    '..aaa.....bb..','.baaab...bccb.','.bccbbbbbbccb.','bccccccccccccb','bccdbccccdbccb','bccddccccddccb',
    'beeeeeeeeeeeeb','bebeeeeeeeebeb','beeeeeeeeeeeeb','bfdfffffffdffb','.bffffffffffb.','..bbbbbbbbbb..']},
  gnash:{c:['#2b1b2e','#6fbf3a','#ffd447','#ffffff','#3d7fd6'],g:[
    '....aaaaaa....','...abbbbbba...','aa.abbbbbba.aa','ababbbbbbbbaba','.abbcabbcabba.','..abbbbbbbba..',
    '..abadadadba..','...abbbbbba...','...aeeeeeea...','..aeeeeeeeea..','..aaaaaaaaaa..']},
  grizzle:{c:['#2b1b2e','#6fbf3a','#ffd447','#ffffff','#e0443a'],g:[
    '....aaaaaa....','...abbbbbba...','aa.abbbbbba.aa','ababbbbbbbbaba','.abbcabbcabba.','..abbbbbbbba..',
    '..abadadadba..','...abbbbbba...','...aeeeeeea...','..aeeeeeeeea..','..aaaaaaaaaa..']},
  heart:{c:['#2b1b2e','#ff4d5e','#ffd0d6'],g:['.aa...aa.','abba.abba','abcbabbba','abbbbbbba','.abbbbba.','..abbba..','...aba...','....a....']},
  // (half a heart: the right half emptied)
  hearth:{c:['#2b1b2e','#ff4d5e','#ffd0d6','#6b5a6e'],g:['.aa...aa.','abba.adda','abcbaddda','abbbbddda','.abbbdda.','..abdda..','...ada...','....a....']},
  hearte:{c:['#2b1b2e','#6b5a6e'],g:['.aa...aa.','abba.abba','abbbabbba','abbbbbbba','.abbbbba.','..abbba..','...aba...','....a....']},
};
const SPR_DONE=new Set();let SPR_SHEET=null;
function sprCls(name,px){
  const cl='spr-'+name+'-'+px;if(SPR_DONE.has(cl))return cl;SPR_DONE.add(cl);
  const S=SPR[name];if(!S)return cl;
  const sh=[];S.g.forEach((row,y)=>{for(let x=0;x<row.length;x++){const k=row.charCodeAt(x)-97;if(k>=0&&k<S.c.length)sh.push(((x+1)*px)+'px '+((y+1)*px)+'px 0 0 '+S.c[k]);}});
  const css='.'+cl+'{display:inline-block;position:relative;width:'+(S.g[0].length*px)+'px;height:'+(S.g.length*px)+'px;flex:none;vertical-align:middle}'+
    '.'+cl+'::before{content:"";position:absolute;left:'+(-px)+'px;top:'+(-px)+'px;width:'+px+'px;height:'+px+'px;box-shadow:'+sh.join(',')+'}';
  try{if(!SPR_SHEET){SPR_SHEET=document.createElement('style');SPR_SHEET.id='sprCss';(document.head||document.body).appendChild(SPR_SHEET);}SPR_SHEET.textContent+=css;}catch(e){}
  return cl;
}
const sprHTML=(name,px,extra)=>'<i class="spr '+sprCls(name,px)+(extra?' '+extra:'')+'" aria-hidden="true"></i>';
