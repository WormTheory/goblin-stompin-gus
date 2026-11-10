// ---- controller navigation of the pause screen: d-pad / left stick move a highlight, A presses, B backs out ----
const menuCard=document.querySelector('#pause .card');
function menuFocusables(){return [...menuCard.querySelectorAll('button,input[type=range],[tabindex="0"]')].filter(el=>!el.disabled&&el.offsetParent!==null);}
function padFocus(el){
  if(!el)return;
  for(const e of menuCard.querySelectorAll('.padfocus'))e.classList.remove('padfocus');
  el.classList.add('padfocus');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});
}
// spatial navigation: the nearest control in that direction, favouring ones lined up with the current one
function moveFocus(dx,dy){
  const els=menuFocusables(),cur=document.activeElement;
  if(!els.includes(cur)){const pb=document.getElementById(players[1].active?'playCoop':'play');padFocus(els.includes(pb)?pb:els[0]);return true;}
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let best=null,bs=1e9;
  for(const el of els){
    if(el===cur)continue;const q=el.getBoundingClientRect(),ex=q.left+q.width/2-cx,ey=q.top+q.height/2-cy;
    const along=dx?ex*dx:ey*dy;if(along<=4)continue;
    // overlap on the other axis counts as lined up
    const perp=dx?Math.max(0,Math.max(q.top,r.top)-Math.min(q.bottom,r.bottom))+Math.abs(ey)*0.3:Math.max(0,Math.max(q.left,r.left)-Math.min(q.right,r.right))+Math.abs(ex)*0.3;
    const sc=along+perp*3;if(sc<bs){bs=sc;best=el;}
  }
  if(best){padFocus(best);return true;}
  return false;
}
function nudgeRange(el,d){
  const mn=+el.min,mx=+el.max,st=+el.step||1,n=Math.round((mx-mn)/st),k=n>40?Math.ceil(n/40):1;
  const v=Math.max(mn,Math.min(mx,+el.value+d*st*k));
  if(v!==+el.value){el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));tone('triangle',520+((v-mn)/(mx-mn||1))*400,0,0.05,0.03);}
}
// inside a tab, up/down walk the controls in reading order (a row of segmented buttons, or the character cards, counts as one stop)
function paneUnits(pane){const out=[],seen=new Set();for(const el of menuFocusables()){if(!pane.contains(el))continue;const g=el.closest('.seg,.cs-row')||el;if(seen.has(g))continue;seen.add(g);out.push(g);}return out;}
function unitFocus(u){if(u.matches('.seg,.cs-row'))padFocus(u.querySelector('[aria-checked="true"]')||u.querySelector('button'));else padFocus(u);}
function menuNav(dir){
  const cur=document.activeElement,dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
  if(dx&&cur&&cur.matches&&cur.matches('input[type=range]')&&menuCard.contains(cur)){nudgeRange(cur,dx);return;}
  // (the head of a screen: its Back button where there's one, otherwise its tab)
  const pane=document.querySelector('.main .tabpane:not([hidden])'),sb=document.getElementById('subBack'),tabBtn=sb&&sb.offsetParent?sb:document.getElementById('tabBtn'+TABS[tabIndex()][1]);
  const title=false;
  // (Patch notes are mostly text to read, so up and down scroll it, stopping on an older update's bar only once it's in view:
  // jumping straight to the first bar would skip past the newest notes)
  if(dy&&curTab==='notes'&&pane&&cur&&cur.closest&&(pane.contains(cur)||cur.closest('.tabs'))){
    const pr=pane.getBoundingClientRect(),y0=pane.contains(cur)?cur.getBoundingClientRect().top:-1e9;
    const vis=paneUnits(pane).filter(u=>{const r=u.getBoundingClientRect();return r.top>=pr.top&&r.bottom<=pr.bottom&&(dy>0?r.top>y0+2:r.top<y0-2);});
    if(vis.length){unitFocus(dy>0?vis[0]:vis[vis.length-1]);return;}
    if(dy<0&&pane.scrollTop<=0){padFocus(tabBtn);return;}
    pane.scrollTop+=dy*80;return;
  }
  if(dx&&cur&&cur.closest&&cur.closest('#charSel .cs-row')){const C=[...cur.closest('.cs-row').querySelectorAll('.cs-card')],i=C.indexOf(cur)+dx;if(i>=0&&i<C.length){C[i].click();padFocus(C[i]);}return;}
  // (the menu itself, title or pause: wherever's nearest that way)
  if(curTab==='game'&&!(cur&&cur.closest&&cur.closest('.tabs'))){if(!moveFocus(dx,dy)&&dy&&pane)pane.scrollTop+=dy*80;return;}
  if(cur===sb&&dy>0){const U=paneUnits(pane);if(U.length)unitFocus(U[0]);else pane.scrollTop+=80;return;}
  if(dx&&(title||cur&&cur.closest&&cur.closest('.tabs'))){showTab(tabIndex()+dx);padFocus(document.getElementById('tabBtn'+TABS[tabIndex()][1]));return;}
  if(dy&&title&&pane.contains(cur)){const U=paneUnits(pane),i=U.findIndex(u=>u===cur||u.contains(cur))+dy;if(i<0)padFocus(tabBtn);else if(i<U.length)unitFocus(U[i]);return;}
  if(dy&&pane&&cur&&cur.closest){
    const units=paneUnits(pane);
    if(pane.contains(cur)){
      // (by where things are on screen, not their order in the page: in a grid of buttons, down is the one below --
      // the nearest row below, and in it the one most nearly underneath -- not the next one along)
      const me=cur.closest('.seg,.cs-row')||cur,r0=me.getBoundingClientRect(),c0=(r0.left+r0.right)/2,m0=(r0.top+r0.bottom)/2;
      const cand=units.filter(u=>u!==me).map(u=>({u,r:u.getBoundingClientRect()})).filter(o=>o.r.width>0&&(dy>0?o.r.top>=m0:o.r.bottom<=m0)&&(dy>0?(o.r.top+o.r.bottom)/2>m0+2:(o.r.top+o.r.bottom)/2<m0-2));
      if(!cand.length){if(dy<0){padFocus(tabBtn);pane.scrollTop=0;}else pane.scrollTop+=80;return;}
      const edge=o=>dy>0?o.r.top:-o.r.bottom,near=Math.min(...cand.map(edge)),row=cand.filter(o=>edge(o)<=near+8);
      const hd=o=>o.r.right<r0.left?r0.left-o.r.right:o.r.left>r0.right?o.r.left-r0.right:Math.abs((o.r.left+o.r.right)/2-c0)*0.01;
      row.sort((a,b)=>hd(a)-hd(b));unitFocus(row[0].u);
      return;
    }
    if(cur.closest('.tabs')&&dy>0){if(units.length)unitFocus(units[0]);else pane.scrollTop+=80;return;}
  }
  if(!moveFocus(dx,dy)&&dy){const pane=document.querySelector('.main .tabpane:not([hidden])');if(pane)pane.scrollTop+=dy*80;}
}
addEventListener('keydown',e=>{
  if(!menuOpen||BIND_CAP)return;const d={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.code];if(!d)return;
  const t=e.target;if(t&&(t.tagName==='INPUT'&&t.type!=='range'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'))return;
  menuNav(d);
});
let navHeld='',navT=0;
function menuPad(st,dt){
  let dir='';
  for(const s of st){
    const b=s.b,ax=s.p.axes,x=ax[0]||0,y=ax[1]||0;
    if(b[12]||y<-0.55)dir='up';else if(b[13]||y>0.55)dir='down';else if(b[14]||x<-0.55)dir='left';else if(b[15]||x>0.55)dir='right';
    if(dir)break;
  }
  // move once, then repeat while held
  if(dir!==navHeld){navHeld=dir;navT=0.38;if(dir)menuNav(dir);}
  else if(dir){navT-=dt;if(navT<=0){navT=0.09;menuNav(dir);}}
  for(const s of st){
    if(s.pr[4])subStep(-1);
    if(s.pr[5])subStep(1);
    // (Y on the character cards: down to the ability switches)
    if(s.pr[3]&&curTab==='custom'){const t=document.querySelector('#abilList .tog');if(t)padFocus(t);}
    const ry=s.p.axes[3]||0;
    if(curTab==='map'&&s.pr[2])mapRecentre();
    if(curTab==='map'){const rx2=s.p.axes[2]||0;if(Math.abs(rx2)>0.2||Math.abs(ry)>0.2)mapPan(rx2*dt*420,ry*dt*420);if(s.b[7])mapZoom(1+dt*1.6);if(s.b[6])mapZoom(1/(1+dt*1.6));}
    else if(Math.abs(ry)>0.25){const pane=document.querySelector('.main .tabpane:not([hidden])');if(pane)pane.scrollTop+=ry*14;}
    // right stick left/right turns the goblin in the obituary preview
    const rx=s.p.axes[2]||0;if(curTab==='obit'&&Math.abs(rx)>0.2)OBP.spin+=Math.sign(rx)*(Math.abs(rx)-0.2)/0.8*dt*3.2;
    if(s.pr[1]){
      const cf=document.getElementById('confirm');
      if(!cf.hidden)document.getElementById('confirmNo').click(),padFocus(document.getElementById('newWorld'));
      else if(curTab!=='game')backHome();
      else{const op=document.getElementById('onlinePanel');if(op&&!op.hidden&&op.contains(document.activeElement)){document.getElementById('onlineBtn').click();padFocus(document.getElementById('onlineBtn'));}}
    }
    if(s.pr[9]){startPlay(s===st[1]&&!touchMode?'coop':null,true);return;}
    if(s.pr[0]){
      const el=document.activeElement;
      if(!el||!menuCard.contains(el)||el===menuCard){const pb=document.getElementById(players[1].active?'playCoop':'play'),fs=menuFocusables();padFocus(fs.includes(pb)?pb:fs[0]);continue;}
      if(el.id==='play'){startPlay('solo',true);return;}
      if(el.id==='playCoop'){startPlay('coop',true);return;}
      if(el.matches('input[type=range]'))continue;
      // (A on a character card: that's who you are, and back to the menu: "Ready!")
      if(el.closest('#charRow')){el.click();backHome();continue;}
      el.click();
      if(el.id==='newWorld')padFocus(document.getElementById('confirmNo'));
      if(el.id==='confirmNo'||el.id==='confirmYes')padFocus(document.getElementById('newWorld'));
    }
  }
}
// the mouse takes over again: drop the controller highlight
addEventListener('mousemove',e=>{if(menuOpen&&(Math.abs(e.movementX)+Math.abs(e.movementY)>2))for(const el of menuCard.querySelectorAll('.padfocus'))el.classList.remove('padfocus');});
for(const [t,id] of TABS)document.getElementById('tabBtn'+id).addEventListener('click',()=>showTab(t));
// (the title screen's "What's new" line opens the Patch notes tab, leaving the highlight on its tab so B and LB/RB carry on from there)
// (the Patch notes tab's "Play 0.1" links open the website's copy of that version, kept at <site>/v/<version>/ beside the
// live game (or beside /test/'s parent), in a new tab so this game keeps running; played from a file on disk there's no
// such folder, so they're hidden)
try{const d=location.pathname.replace(/[^\/]*$/,'').replace(/(test|v\/[^\/]+)\/$/,'');
  for(const a of document.querySelectorAll('a.pn-play')){if(location.protocol==='file:'){a.hidden=true;continue;}a.href=d+'v/'+a.dataset.ver+'/';a.target='_blank';a.rel='noopener';}
}catch(e){}
document.getElementById('pnLatest').addEventListener('click',()=>openSub('notes','pnLatest'));
// (the version in the title screen's corner, from the newest patch notes' heading)
{const m=/Version\s+(\S+)/.exec(document.getElementById('pnLatest').textContent||''),v=document.getElementById('verTag');if(v&&m)v.textContent='v'+m[1];}

// ---- button prompts: a row along the bottom of each menu showing just the inputs that do something there ----
// glyph ids: A B X Y (face buttons), LB RB LT RT, LS/RS (':v' up-down, ':h' left-right), DPAD (':v'/':h'),
// START SELECT, KEY:<label>, LMB WHEEL MDRAG (mouse), TAP TDRAG (touch)
const GL_FACE={A:['#7fd14a','cross','#7fa8ff'],B:['#ff6b5e','circle','#ff6b6b'],X:['#8ec8f2','square','#f08ad0'],Y:['#ffd447','triangle','#4fd0a0']};   // (the palette's green, tomato, sky and yolk)
const glEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function glyph(id){
  const ps=padStyle==='ps';
  if(GL_FACE[id]){const [c,sh,pc]=GL_FACE[id];
    if(!ps)return `<span class="g gface" style="--c:${c}">${id}</span>`;
    const S={cross:`<path d="M6 6L14 14M14 6L6 14" stroke="${pc}" stroke-width="2.2" stroke-linecap="round"/>`,circle:`<circle cx="10" cy="10" r="4.6" fill="none" stroke="${pc}" stroke-width="2"/>`,
      square:`<rect x="5.6" y="5.6" width="8.8" height="8.8" fill="none" stroke="${pc}" stroke-width="2"/>`,triangle:`<path d="M10 4.6L15.4 14H4.6Z" fill="none" stroke="${pc}" stroke-width="2" stroke-linejoin="round"/>`}[sh];
    return `<span class="g gface ps"><svg width="20" height="20" viewBox="0 0 20 20">${S}</svg></span>`;}
  if(id==='LB'||id==='RB')return `<span class="g gsh">${ps?(id==='LB'?'L1':'R1'):id}</span>`;
  if(id==='LT'||id==='RT')return `<span class="g gtr">${ps?(id==='LT'?'L2':'R2'):id}</span>`;
  if(id==='START')return ps?'<span class="g gpill">OPTIONS</span>':'<span class="g gface" style="--c:#c9d0d6"><svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 1.5H11M1 5H11M1 8.5H11" stroke="#14181d" stroke-width="1.8"/></svg></span>';
  if(id==='SELECT')return ps?'<span class="g gpill">CREATE</span>':'<span class="g gface" style="--c:#c9d0d6"><svg width="12" height="11" viewBox="0 0 12 11"><rect x="1" y="1" width="6.5" height="5.5" fill="none" stroke="#14181d" stroke-width="1.5"/><rect x="4.5" y="4.5" width="6.5" height="5.5" fill="#c9d0d6" stroke="#14181d" stroke-width="1.5"/></svg></span>';
  const arr=(dir,col)=>{const a=[];const t=(x,y,r)=>`<path d="M${x} ${y}l-2.6 2.8h5.2Z" fill="${col}" transform="rotate(${r} ${x} ${y+1.4})"/>`;
    if(dir!=='h')a.push(t(13,1.2,0),t(13,22.6,180));if(dir!=='v')a.push(t(1.6,11.9,-90),t(24.4,11.9,90));return a.join('');};
  if(id.startsWith('LS')||id.startsWith('RS')){const dir=id.split(':')[1]||'';
    return `<span class="g"><svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="8.6" fill="#2c353f" stroke="#7a8794" stroke-width="1.4"/><circle cx="13" cy="13" r="5.4" fill="#3c4752"/><text x="13" y="16.2" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="8.5" fill="#e8edf0">${id[0]}</text>${arr(dir||'all','#e8c14a')}</svg></span>`;}
  if(id.startsWith('DPAD')){const dir=id.split(':')[1]||'',hv=dir!=='h',hh=dir!=='v',on='#e8edf0',off='#56616c';
    return `<span class="g"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z" fill="#2c353f" stroke="#7a8794" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 4.2l2 2.6h-4Z M12 19.8l2-2.6h-4Z" fill="${hv?on:off}"/><path d="M4.2 12l2.6-2v4Z M19.8 12l-2.6-2v4Z" fill="${hh?on:off}"/></svg></span>`;}
  if(id.startsWith('KEY:'))return `<span class="g gkey">${glEsc(id.slice(4))}</span>`;
  if(id==='LMB'||id==='WHEEL'||id==='MDRAG'||id==='RMB'){
    const L=id==='LMB'||id==='MDRAG'?'#e8c14a':'#3c4752',R=id==='RMB'?'#e8c14a':'#3c4752',W=id==='WHEEL'?'#e8c14a':'#7a8794';
    const ex=id==='MDRAG'?'<path d="M1.5 12l2.6-2.4v4.8Z M24.5 12l-2.6-2.4v4.8Z" fill="#e8c14a"/>':id==='WHEEL'?'<path d="M13 .6l2 2.2h-4Z M13 25.4l2-2.2h-4Z" fill="#e8c14a"/>':'';
    return `<span class="g"><svg width="26" height="26" viewBox="0 0 26 26"><rect x="6.5" y="3.5" width="13" height="19" rx="6.5" fill="#2c353f" stroke="#7a8794" stroke-width="1.3"/><path d="M7.2 11V10a5.8 5.8 0 0 1 5.3-5.8V11Z" fill="${L}"/><path d="M18.8 11V10a5.8 5.8 0 0 0-5.3-5.8V11Z" fill="${R}"/><rect x="11.9" y="6" width="2.2" height="4" rx="1.1" fill="${W}"/>${ex}</svg></span>`;}
  if(id==='TAP'||id==='TDRAG'){const ex=id==='TDRAG'?'<path d="M2 9l2.6-2.4v4.8Z M24 9l-2.6-2.4v4.8Z" fill="#e8c14a"/>':'<circle cx="13" cy="7" r="5" fill="none" stroke="#e8c14a" stroke-width="1.2" opacity=".8"/>';
    return `<span class="g"><svg width="26" height="26" viewBox="0 0 26 26">${ex}<path d="M11.2 7.6a1.8 1.8 0 0 1 3.6 0v6.2l4.4 1.1c1.2.3 1.9 1.4 1.7 2.6l-.9 5H11l-4-5.4a1.6 1.6 0 0 1 2.4-2.1l1.8 1.8Z" fill="#e8edf0" stroke="#14181d" stroke-width=".8" stroke-linejoin="round"/></svg></span>`;}
  return `<span class="g gkey">${glEsc(id)}</span>`;
}
// items: [[glyph ids...], label]
function setPrompts(el,items){
  if(!el)return;
  const html=items.map(([g,l])=>`<span class="pi"><span class="pg">${g.map(glyph).join('')}</span><span class="pl">${glEsc(l)}</span></span>`).join('');
  if(el._ph!==html){el._ph=html;el.innerHTML=html;}
}
// what each input does on the pause screen right now: which tab, what's highlighted, which device is in use
function menuPromptItems(){
  const kind=inputKind,pane=document.querySelector('.main .tabpane:not([hidden])'),act=document.activeElement;
  const scrolls=pane&&pane.scrollHeight>pane.clientHeight+4,inPane=pane&&act&&pane.contains(act),cf=!document.getElementById('confirm').hidden;
  const range=act&&act.matches&&act.matches('input[type=range]')&&menuCard.contains(act);
  const out=[];
  const home=curTab==='game',card=act&&act.closest&&act.closest('#charRow');
  if(kind==='pad'){
    if(range)out.push([['DPAD:h'],'Adjust']);else out.push([['A'],card?'Ready!':'Pick']);
    if(cf||!home)out.push([['B'],'Back']);
    if(!home)out.push([['LB','RB'],'Jump between screens']);
    if(curTab==='custom')out.push([['Y'],'Ability toggles']);
    if(curTab==='map'){out.push([['RS'],'Pan']);out.push([['LT','RT'],'Zoom']);out.push([['X'],'Re-centre']);}
    else if(curTab==='obit'){out.push([['RS:h'],'Turn']);if(scrolls)out.push([['RS:v'],'Scroll']);}
    else if(scrolls)out.push([['RS:v'],'Scroll']);
    out.push([['START'],atTitle?'Play':'Resume']);
  } else if(kind==='touch'){
    out.push([['TAP'],'Select']);
    if(curTab==='map'){out.push([['TDRAG'],'Pan']);out.push([['TDRAG','TDRAG'],'Pinch to zoom']);out.push([['TAP','TAP'],'Re-centre']);}
    else if(curTab==='obit')out.push([['TDRAG'],'Turn']);
    else if(scrolls)out.push([['TDRAG'],'Scroll']);
  } else {
    out.push([['LMB'],'Select']);
    if(curTab==='map'){out.push([['MDRAG'],'Pan']);out.push([['WHEEL'],'Zoom']);out.push([['KEY:C'],'Re-centre']);}
    else if(curTab==='obit'){out.push([['MDRAG'],'Turn']);if(scrolls)out.push([['WHEEL'],'Scroll']);}
    else if(scrolls)out.push([['WHEEL'],'Scroll']);
    if(range)out.push([['KEY:←','KEY:→'],'Adjust']);else out.push([['KEY:Enter'],'Pick']);
    if(cf||!home)out.push([['KEY:Esc'],'Back']);
    if(!home)out.push([['KEY:Q','KEY:E'],'Jump between screens']);
  }
  return out;
}
let promptT=0;
function promptTick(dt){
  promptT-=dt;if(promptT>0)return;promptT=0.2;
  if(menuOpen)setPrompts(document.getElementById('menuPrompts'),menuPromptItems());
  // a paused co-op player's own panel: their controller (or, for Gus, the mouse)
  for(const p of players){if(!p.active||!p.paused||!p.ui.pprompts)continue;
    const pad=p.idx===1||inputKind==='pad';
    setPrompts(p.ui.pprompts,pad?[[['A'],'Resume'],[['Y'],'Pause menu']]:[[['LMB'],'Select'],[['KEY:Enter'],'Resume']]);}
}
