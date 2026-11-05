// ---------- Health & HUD ----------
const readout=document.getElementById('readout'),divider=document.getElementById('divider');
function renderHearts(p){if(p.hp===p.lastHp)return;p.lastHp=p.hp;const h=p.ui.hearts;h.textContent='';for(let i=0;i<10;i++){const s=document.createElement('span'),v=p.hp-i*2;s.className='hrt'+(v>=2?'':v===1?' half':' empty');s.textContent='♥';h.append(s);}}
function updateHealth(p,dt){
  if(!p.active)return;
  if(p.deadT>0){
    p.deadT-=dt;
    if(p.deadT<=0){
      const buddy=players.find(o=>o!==p&&o.active&&o.state!=='dead');
      p.heading=Math.random()*Math.PI*2;
      placePlayer(p,buddy?findStreet(buddy.pos.x,buddy.pos.z,4,8):findStreet(p.pos.x,p.pos.z,30,45));
      flashLabel(p.idx?'Gertie is back':'A new Gus rises',p);
    }
  } else if(playing){p.regenT+=dt;if(p.regenT>6&&p.hp<20){p.hp++;p.regenT=4.5;}}
  p.ui.stamFill.style.width=p.stam.toFixed(0)+'%';p.ui.stam.classList.toggle('tired',p.exhausted);
  const winding=p.state==='windup'&&stompCap()>0||p.state==='pound'&&p.pHover;p.ui.smeter.hidden=!winding;
  if(winding){
    const lv=stompLevelOf(p.stompCharge);
    p.ui.smFill.style.width=(p.stompCharge/2*100).toFixed(0)+'%';
    if(p.ui.smLv!==lv){p.ui.smLv=lv;p.ui.smeter.classList.remove('lv0','lv1','lv2');p.ui.smeter.classList.add('lv'+lv);p.ui.slv.textContent=['STOMP','MEDIUM','FULL'][lv];}
  } else if(p.ui.smLv!==undefined){p.ui.smLv=undefined;}
  p.hurtFx-=dt;p.ui.hurt.style.opacity=p.deadT>0?0.85:Math.max(0,p.hurtFx*2.2);
  renderHearts(p);
}
let split='none';
function layout(){
  const two=P1.active&&P2.active,w=innerWidth,h=innerHeight;
  split=two?(w>=h?'lr':'tb'):'none';
  const set=(el,l,t,ww,hh)=>{el.style.left=l+'px';el.style.top=t+'px';el.style.width=ww+'px';el.style.height=hh+'px';};
  P1.ui.view.hidden=!P1.active;P2.ui.view.hidden=!P2.active;
  if(split==='none'){set(P1.ui.view,0,0,w,h);divider.hidden=true;}
  else if(split==='lr'){set(P1.ui.view,0,0,w/2,h);set(P2.ui.view,w/2,0,w/2,h);set(divider,w/2-1,0,2,h);divider.hidden=false;}
  else{set(P1.ui.view,0,0,w,h/2);set(P2.ui.view,0,h/2,w,h/2);set(divider,0,h/2-1,w,2);divider.hidden=false;}
  for(const p of players){p.ui.who.hidden=split==='none';if(p.ui.mini){const sz=split==='none'?160:118;p.ui.mini.style.width=p.ui.mini.style.height=sz+'px';}}
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);layout();}
addEventListener('resize',resize);

