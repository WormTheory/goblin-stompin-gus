// ---------- Pixel sprites (the menus' and HUD's little portraits and hearts) ----------
// Each is a grid of letters, a letter per colour in its palette ('.' is see-through), drawn as a little SVG (as the
// element's background) with a square per pixel, run together along each row. The squares are drawn without smoothing
// (crispEdges) and each one reaches a hair into the next pixel it touches, right and below (drawn after it, so it's
// covered again): so there's never a seam between two pixels, at any zoom or screen density. (They used to be one
// box-shadow per pixel, which leaves hairline gaps when the browser's scaled.)
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
  const W=S.g[0].length,H=S.g.length,at=(x,y)=>{const r=S.g[y];if(!r||x<0||x>=r.length)return -1;const k=r.charCodeAt(x)-97;return k>=0&&k<S.c.length?k:-1;};
  let svg='';const O=0.06;
  S.g.forEach((row,y)=>{for(let x=0;x<W;){const k=at(x,y);if(k<0){x++;continue;}const below=at(x,y+1)>=0;let e=x+1;while(e<W&&at(e,y)===k&&(at(e,y+1)>=0)===below)e++;
    svg+='<rect x="'+x+'" y="'+y+'" width="'+(e-x+(at(e,y)>=0?O:0))+'" height="'+(1+(below?O:0))+'" fill="'+S.c[k]+'"/>';x=e;}});
  const url="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" shape-rendering="crispEdges">'+svg+'</svg>');
  const css='.'+cl+'{display:inline-block;position:relative;width:'+(W*px)+'px;height:'+(H*px)+'px;flex:none;vertical-align:middle;background:url("'+url+'") 0 0/100% 100% no-repeat}';
  try{if(!SPR_SHEET){SPR_SHEET=document.createElement('style');SPR_SHEET.id='sprCss';(document.head||document.body).appendChild(SPR_SHEET);}SPR_SHEET.textContent+=css;}catch(e){}
  return cl;
}
const sprHTML=(name,px,extra)=>'<i class="spr '+sprCls(name,px)+(extra?' '+extra:'')+'" aria-hidden="true"></i>';
