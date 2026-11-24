// ---- the instrument in the bottom-right corner, in a vehicle: one slot (.speedo), drawn by its kind's renderer ----
// Which one a vehicle has is its kind's inst (VEHICLE_KINDS, a key here, or null for none: a deck weapon, a gunner's
// seat). The speed most show is measured from the player's own movement (updateSpeedo: p.spV in km/h, p.spVY), so it
// reads right for anything, aboard a ship too; planes, boats and ships read their own. Speed is in km/h on land and in
// knots on water and in the air (a block is a metre). Each renderer: vb, its picture's viewBox; w, how wide it's drawn
// (in pixels, never more than a third of the view); draw(p,D,dt), the picture's markup, redrawn 20 times a second while
// shown (only when it's changed); over (the fighter jet's head-up display, a tank's sight), a picture laid over the whole
// view instead, round the crosshair. The look follows the game's own stickers: ink, paper, yolk, Gus green, tomato.
// Options' Vehicle instruments switch (uiSpeedo) hides the slot.
const BPS_KMH=3.6,BPS_KN=3.6/1.852;
const IN_INK='#2b1b2e',IN_PAPER='#fff6dc',IN_YOLK='#ffd447',IN_GUS='#7fc24a',IN_TOM='#e0564a',IN_ORA='#f0a04a',IN_R=Math.PI/180;
const inCl=(v,a,b)=>Math.max(a,Math.min(b,v)),inF=n=>(+n).toFixed(1);
const inHeat=k=>k<.55?IN_GUS:k<.8?IN_ORA:IN_TOM;
const inPt=(a,r,cx=0,cy=0)=>[(cx+Math.sin(a*IN_R)*r).toFixed(2),(cy-Math.cos(a*IN_R)*r).toFixed(2)];
function inArc(r,a0,a1,cx=0,cy=0){const[x0,y0]=inPt(a0,r,cx,cy),[x1,y1]=inPt(a1,r,cx,cy);return`M${x0},${y0} A${r},${r} 0 ${Math.abs(a1-a0)>180?1:0} ${a1>a0?1:0} ${x1},${y1}`;}
// (text: x, y, size, what it says, its classes, anchor, outline width, colour)
const inT=(x,y,s,txt,cls='px ink-t',anchor='middle',sw=3,fill)=>`<text x="${x}" y="${y}" font-size="${s}" text-anchor="${anchor}" class="${cls}" stroke-width="${sw}"${fill?` style="fill:${fill}"`:''}>${txt}</text>`;
// the game's ink gauge: an arc from -120 to 120 degrees, filled by how far round (coloured by it), a yolk needle and the number
function inDial({v,max,unit,ticks=6,labels=null,r=40,fill=true,zone=null,marker=null,num=null,sub=''}){
  const k=inCl(v/max,0,1),a=-120+240*k;let s=`<path d="${inArc(r,-120,120)}" fill="none" stroke="rgba(43,27,46,.55)" stroke-width="7" stroke-linecap="round"/>`;
  if(zone)s+=`<path d="${inArc(r,-120+240*zone[0],-120+240*zone[1])}" fill="none" stroke="${zone[2]}" stroke-width="7"/>`;
  if(fill&&k>.01)s+=`<path d="${inArc(r,-120,a)}" fill="none" stroke="${inHeat(k)}" stroke-width="7" stroke-linecap="round"/>`;
  for(let i=0;i<=ticks;i++){const b=-120+240*i/ticks,[x1,y1]=inPt(b,r-11),[x2,y2]=inPt(b,r-7);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(238,240,230,.75)" stroke-width="1.5"/>`;
    if(labels){const[lx,ly]=inPt(b,r-18);s+=inT(lx,+ly+3,8,labels[i],'px ink-t','middle',2);}}
  if(marker!==null){const b=-120+240*inCl(marker/max,0,1),[mx,my]=inPt(b,r+6),[m1x,m1y]=inPt(b-5,r+12),[m2x,m2y]=inPt(b+5,r+12);s+=`<polygon points="${mx},${my} ${m1x},${m1y} ${m2x},${m2y}" fill="${IN_TOM}" stroke="${IN_INK}" stroke-width="1.5"/>`;}
  s+=`<line x1="0" y1="4" x2="0" y2="${-(r-9)}" stroke="${IN_YOLK}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${inF(a)})"/><circle r="4.2" fill="${IN_YOLK}" stroke="#0c0f14" stroke-width="1.4"/>`;
  s+=inT(0,27,22,num??Math.round(v),'px ink-t','middle',3.5)+inT(0,36,9,unit,'px ink-t','middle',2.5)+(sub?inT(0,47,11,sub,'px ink-t','middle',3):'');
  return s;}
// a compass bearing from a heading (heading 0 points along +z, which is south; north is -z)
const inBear=h=>((180-h/IN_R)%360+360)%360;
// a compass strip, w wide, centred on bearing hd
function inStrip(hd,w){let s=`<rect x="0" y="0" width="${w}" height="20" rx="4" fill="rgba(18,22,28,.78)"/>`;const m=w/2;
  for(let d=-40;d<=40;d+=10){const h=Math.round(hd/10)*10+d,x=m+(h-hd)*1.9;if(x>4&&x<w-4){const q=((h%360)+360)%360,lab=q%45===0?['N','NE','E','SE','S','SW','W','NW'][q/45]:'';
    s+=`<line x1="${inF(x)}" y1="0" x2="${inF(x)}" y2="${lab?7:4}" stroke="${IN_PAPER}" stroke-width="1.2"/>`+(lab?inT(x,17,10,lab,'mono','middle',0,IN_PAPER):'');}}
  return s+`<path d="M${m},0 l-4,-6 h8 z" fill="${IN_YOLK}"/>`;}
// an artificial horizon, clipped to a circle of radius r at cx,cy (roll and pitch in radians; id for its clip)
function inHorizon(id,cx,cy,r,roll,pitch,sky='#4f9ad8',gnd='#8a6a3c'){
  return`<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><g clip-path="url(#${id})"><g transform="translate(${cx},${inF(cy+pitch/IN_R*2)}) rotate(${inF(-roll/IN_R)})"><rect x="-120" y="-120" width="240" height="120" fill="${sky}"/><rect x="-120" y="0" width="240" height="120" fill="${gnd}"/><line x1="-120" y1="0" x2="120" y2="0" stroke="${IN_PAPER}" stroke-width="2"/>${[-10,10].map(q=>`<line x1="-12" y1="${-q*2}" x2="12" y2="${-q*2}" stroke="${IN_PAPER}" stroke-width="1.5"/>`).join('')}</g></g>`;}

// ---- what each one reads ----
// (a car's cosmetic gearbox: five gears up to its top speed, the revs climbing through each and dropping at a change)
function inGear(v,top){const k=inCl(Math.abs(v)/Math.max(1,top),0,1.2),g=Math.min(5,1+Math.floor(k*5)),f=inCl(k*5-(g-1),0,1);return{g,rpm:1+6.4*f};}
function inCar(p,D){const c=D.o,H=handOf(c.veh||'car'),{g,rpm}=inGear(c.speed,H.top),v=Math.max(0,p.spV),ch=c.drift?c.drift.ch||0:0,
    gear=c.speed<-0.3?'R':Math.abs(c.speed)<0.3?'N':g;
  let ring='';[[-120,-40],[-40,40],[40,120]].forEach((sg,i)=>{const to=inCl((ch-i/3)*3,0,1);ring+=`<path d="${inArc(50,sg[0]+2,sg[1]-2)}" fill="none" stroke="rgba(43,27,46,.45)" stroke-width="4"/>`;
    if(to>0)ring+=`<path d="${inArc(50,sg[0]+2,sg[0]+2+(sg[1]-sg[0]-4)*to)}" fill="none" stroke="${[IN_YOLK,'#ffa03a',IN_TOM][i]}" stroke-width="4"/>`;});
  const drift=H.drift!==false;
  return`<g transform="translate(-62,12) scale(.62)">${inDial({v:rpm,max:8,unit:'rpm x1000',ticks:8,num:'',zone:[.78,1,'rgba(224,86,74,.8)']})}${inT(0,6,34,gear,'px ink-t','middle',4)}</g>${drift?ring:''}${inDial({v,max:200,unit:'km/h',ticks:5,labels:[0,40,80,120,160,200]})}${drift?inT(0,-54,9,'DRIFT','px ink-t','middle',2.5):''}`;}
function inBike(p,D){const c=D.o,H=handOf('bike'),v=Math.round(Math.max(0,p.spV)),{g,rpm}=inGear(c.speed,H.top),r=inCl(rpm/8,0,1),lean=Math.round(Math.abs(c.g&&c.g.rotation.z||0)/IN_R);
  let s=`<rect x="0" y="0" width="200" height="86" rx="12" fill="#14171b" stroke="${IN_INK}" stroke-width="4"/>`;
  for(let i=0;i<20;i++){const on=i/20<r;s+=`<rect x="${12+i*8.8}" y="${12+(20-i)*.5}" width="6" height="${10+i*.5}" rx="1" fill="${on?(i>15?IN_TOM:i>11?IN_ORA:IN_GUS):'rgba(238,240,230,.12)'}"/>`;}
  return s+inT(120,72,40,v,'px','end',0,IN_PAPER)+inT(126,72,10,'km/h','mono','start',0,'#9aa3ad')+`<rect x="160" y="44" width="28" height="30" rx="4" fill="${IN_YOLK}"/>`+inT(174,68,24,c.speed<-0.3?'R':g,'px','middle',0,IN_INK)+inT(14,72,11,'LEAN '+lean+'°','mono','start',0,'#9aa3ad');}
function inTruck(p,D,dt){const c=D.o,i=drvIn(p),S=p.inS||(p.inS={air:1});const brake=c.speed>0.5&&drvThr(i)<-0.1||D.o.hand;
  S.air=inCl(S.air+(brake?-0.35:0.12)*dt,0.25,1);   // (the air brakes use up pressure; the compressor slowly builds it back)
  return`${inDial({v:Math.max(0,p.spV),max:100,unit:'km/h',ticks:5,labels:[0,20,40,60,80,100]})}<g transform="translate(30,-30)"><circle r="14" fill="#16191d" stroke="${IN_INK}" stroke-width="2.5"/><line x1="0" y1="2" x2="0" y2="-11" stroke="${IN_TOM}" stroke-width="2" transform="rotate(${inF(-120+240*S.air)})"/>${inT(0,9,6,'AIR','mono','middle',0,'#d9cfc2')}</g>`;}
function inHover(p,D){const c=D.o,i=drvIn(p),fan=Math.round(inCl(Math.abs(drvThr(i))*0.8+Math.abs(c.speed)/handOf('hover').top*0.3,0,1)*100);
  let slip=0;if(c.hvel&&Math.hypot(c.hvel.x,c.hvel.z)>1)slip=angDiff(c.heading,Math.atan2(c.hvel.x,c.hvel.z))/IN_R;
  return`${inDial({v:fan,max:100,unit:'fan %',ticks:5})}<g transform="translate(0,-2) scale(.45)" opacity=".95"><rect x="-10" y="-20" width="20" height="40" rx="5" fill="${IN_PAPER}" stroke="${IN_INK}" stroke-width="3"/><line x1="0" y1="0" x2="0" y2="-34" stroke="${IN_GUS}" stroke-width="4" transform="rotate(${inF(-slip)})"/></g>${inT(0,58,10,'SLIP '+Math.abs(Math.round(slip))+'°','px ink-t','middle',2.5)}`;}
function inFork(p,D){const c=D.o,F=c.fork||{h:0,tilt:0,load:null,risk:0},h=F.h||0,tilt=F.tilt||0,risk=inCl(F.risk||0,0,1),y=130-h/3.5*112;
  let s=`<rect x="0" y="0" width="190" height="150" rx="10" fill="rgba(18,22,28,.72)"/>`;
  s+=`<rect x="22" y="14" width="10" height="120" rx="3" fill="#3a3f46" stroke="${IN_INK}" stroke-width="2"/><rect x="46" y="14" width="10" height="120" rx="3" fill="#3a3f46" stroke="${IN_INK}" stroke-width="2"/>`;
  for(let m=0;m<=3;m++){const yy=130-m/3.5*112;s+=`<line x1="60" y1="${yy}" x2="68" y2="${yy}" stroke="${IN_PAPER}" stroke-width="1.5"/>`+inT(72,yy+4,11,m+' m','mono','start',0,IN_PAPER);}
  s+=`<g transform="translate(16,${inF(y)})"><rect x="0" y="-12" width="46" height="12" rx="2" fill="${IN_YOLK}" stroke="${IN_INK}" stroke-width="2"/><rect x="46" y="-4" width="34" height="5" fill="#d8d8d0" stroke="${IN_INK}" stroke-width="1.5"/>${F.load?`<rect x="50" y="-20" width="24" height="16" fill="#b9874a" stroke="${IN_INK}" stroke-width="1.5"/>`:''}</g>`;
  s+=`<g transform="translate(150,40)"><path d="${inArc(26,-60,60)}" fill="none" stroke="rgba(238,240,230,.3)" stroke-width="5"/><line x1="0" y1="0" x2="0" y2="-26" stroke="${IN_YOLK}" stroke-width="3" stroke-linecap="round" transform="rotate(${inF(tilt*6)})"/><circle r="3" fill="${IN_YOLK}"/>${inT(0,16,11,'TILT '+(tilt>0?'+':'')+inF(tilt)+'°','mono','middle',0,IN_PAPER)}</g>`;
  s+=inT(108,82,24,inF(h)+' m','px ink-t','start',3)+inT(108,98,11,F.load?F.load.name+' · '+F.load.kg+' kg':'NO LOAD','mono','start',0,'#d9cfc2');
  s+=inT(108,120,10,'TIP RISK','mono','start',0,IN_PAPER)+`<rect x="108" y="126" width="72" height="8" rx="3" fill="rgba(238,240,230,.18)"/><rect x="108" y="126" width="${inF(72*risk)}" height="8" rx="3" fill="${inHeat(risk)}"/>`;
  return s;}
function inTractor(p,D){const c=D.o,T=c.farm||{cr:0,imp:'plough',down:false},{rpm}=inGear(c.speed,handOf('tractor').top),st=T.cr||0;
  let s=inDial({v:0.8+rpm*0.2,max:2.5,unit:'',ticks:5,num:''});
  ['L','M','H'].forEach((ch,i)=>{const on=i+1===st;s+=`<rect x="${-30+i*21}" y="-4" width="18" height="16" rx="3" fill="${on?IN_YOLK:'rgba(43,27,46,.7)'}" stroke="${IN_INK}" stroke-width="2"/>`+inT(-21+i*21,9,14,ch,'px','middle',0,on?IN_INK:IN_PAPER);});
  const nm={plough:'PLOUGH',mower:'MOWER'}[T.imp]||'HITCH';
  return s+inT(0,32,15,Math.round(Math.max(0,p.spV))+' km/h','px ink-t','middle',3)+`<rect x="-30" y="40" width="60" height="16" rx="4" fill="${T.down?'#3a8f3a':'rgba(43,27,46,.7)'}" stroke="${IN_INK}" stroke-width="2"/>`+inT(0,52,12,nm+(T.down?' ▼':' ▲'),'px','middle',0,IN_PAPER);}
function inTank(p,D){const M=D.o,tu=(M.tu||0)/IN_R,cam=angDiff(M.h,p.cam.yaw+Math.PI)/IN_R,sp=Math.round(Math.abs(M.sv||0)*BPS_KMH);
  const gear=M.cruise?'C'+M.cruise:Math.abs(M.sv||0)<0.2?'N':M.sv<0?'R':'F'+Math.min(3,1+Math.floor(Math.abs(M.sv)/handOf('tank').top*3));
  let s=`<circle r="42" fill="rgba(18,22,28,.72)" stroke="${IN_INK}" stroke-width="3"/><path d="M0,0 L${inPt(cam-22,40).join(',')} A40,40 0 0 1 ${inPt(cam+22,40).join(',')} Z" fill="rgba(255,212,71,.14)"/>`;
  s+=`<rect x="-13" y="-20" width="26" height="40" rx="3" fill="#6b7a4a" stroke="${IN_INK}" stroke-width="2"/><rect x="-17" y="-21" width="5" height="42" fill="#3d442c" stroke="${IN_INK}" stroke-width="1.5"/><rect x="12" y="-21" width="5" height="42" fill="#3d442c" stroke="${IN_INK}" stroke-width="1.5"/>`;
  s+=`<g transform="rotate(${inF(-tu)})"><circle r="8" fill="#8a9a5e" stroke="${IN_INK}" stroke-width="2"/><rect x="-2" y="-34" width="4" height="27" fill="#8a9a5e" stroke="${IN_INK}" stroke-width="1.5"/></g>`;
  s+=inT(0,-30,8,M.hullLock?'▲ HULL LOCK':'▲ HULL','mono','middle',0,M.hullLock?IN_YOLK:'#d9cfc2');
  return s+`<g transform="translate(70,6)">${inT(0,0,30,sp,'px ink-t','middle',4)}${inT(0,13,9,'km/h','px ink-t','middle',2.5)}<rect x="-16" y="20" width="32" height="15" rx="3" fill="${IN_YOLK}" stroke="${IN_INK}" stroke-width="2"/>${inT(0,32,13,gear,'px','middle',0,IN_INK)}${inT(0,50,10,(M.shell==='ap'?'AP':'HE')+' ◆','px ink-t','middle',2.5)}</g>`;}
function inHeli(p,D){const M=D.o,agl=Math.max(0,Math.round(M.y-groundAt(M.x,M.z,M.y+1))),kt=Math.round(Math.hypot(M.hv?M.hv.x:0,M.hv?M.hv.z:0)*BPS_KN),rpm=inCl(M.spin||0,0,1);
  let s=`<rect x="0" y="0" width="230" height="100" rx="10" fill="rgba(18,22,28,.74)"/>`+inHorizon('hzc'+p.idx,50,50,38,M.roll||0,M.pitch||0);
  s+=`<circle cx="50" cy="50" r="38" fill="none" stroke="${IN_INK}" stroke-width="4"/><path d="M30,50 h12 l8,6 l8,-6 h12" fill="none" stroke="${IN_YOLK}" stroke-width="3"/>`;
  s+=inT(102,30,11,'HEIGHT','mono','start',0,'#d9cfc2')+inT(102,54,28,agl+' m','px ink-t','start',3.5);
  s+=inT(102,74,11,'AIRSPEED','mono','start',0,'#d9cfc2')+inT(102,92,20,kt+' kt','px ink-t','start',3);
  s+=inT(176,74,11,'ROTOR','mono','start',0,'#d9cfc2')+`<rect x="176" y="80" width="44" height="9" rx="3" fill="rgba(238,240,230,.18)"/><rect x="176" y="80" width="${inF(44*rpm)}" height="9" rx="3" fill="${rpm>0.95?IN_GUS:IN_ORA}"/>`;
  if(M.auto)s+=inT(176,52,11,'ENGINE OUT','mono','start',0,IN_ORA);   // (autorotating: heli-handling.js)
  return s+inT(222,22,10,M.agile?'AGILE':'SIMPLE','mono','end',0,M.agile?IN_YOLK:'#9aa3ad');}
// (a plane's attitude, read off its model: pitch up, roll right positive)
function inAtt(pl){const F=pl.free||{};if(F.q){const A=planeAtt(pl);return A;}return{roll:-(F.rl||0),pitch:F.pt||0,hd:pl.g.rotation.y};}
// a plane's throttle lever, beside its other instruments as the boat's is beside its dial: its slot filling from idle at
// the bottom to full at the top, a tick every quarter, the knob where the lever sits and the setting under it
function inThrot(x,y,thr){const k=inCl(thr||0,0,1),h=72,t=y+16,ky=t+(1-k)*h;
  let s=`<rect x="${x}" y="${y}" width="40" height="${h+38}" rx="6" fill="rgba(18,22,28,.78)" stroke="${IN_INK}" stroke-width="2"/>`+inT(x+20,y+11,8,'THR','mono','middle',0,'#9aa3ad');
  s+=`<rect x="${x+17}" y="${t}" width="6" height="${h}" rx="3" fill="#0c0f14"/><rect x="${x+17}" y="${inF(ky)}" width="6" height="${inF(t+h-ky)}" rx="3" fill="${IN_GUS}"/>`;
  for(let i=0;i<=4;i++){const q=t+h*i/4;s+=`<line x1="${x+5}" y1="${q}" x2="${x+12}" y2="${q}" stroke="#9aa3ad" stroke-width="1.5"/><line x1="${x+28}" y1="${q}" x2="${x+35}" y2="${q}" stroke="#9aa3ad" stroke-width="1.5"/>`;}
  s+=`<rect x="${x+8}" y="${inF(ky-5)}" width="24" height="10" rx="3" fill="${IN_TOM}" stroke="${IN_INK}" stroke-width="1.5"/>`;
  return s+inT(x+20,y+h+31,9,Math.round(k*100)+'%','mono','middle',0,'#fff');}
function inSteam(p,D){const pl=D.o,F=pl.free||{},kt=Math.round((F.v||0)*BPS_KN),A=inAtt(pl),alt=Math.max(0,pl.g.position.y-G);
  const face=(cx,inner,label)=>`<g transform="translate(${cx},50)"><circle r="44" fill="#16191d" stroke="${IN_INK}" stroke-width="5"/><circle r="40" fill="none" stroke="#c9b48a" stroke-width="2"/>${inner}${inT(0,56,10,label,'px ink-t','middle',2.5)}</g>`;
  const ka=v=>-150+inCl((v-20)/140,0,1)*300;
  let asi='';for(let v=20;v<=160;v+=20){const a=ka(v),[x,y]=inPt(a,30);asi+=inT(x,+y+4,9,v,'mono','middle',0,'#e9e3d3');const[a1,b1]=inPt(a,40),[a2,b2]=inPt(a,35);asi+=`<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#e9e3d3" stroke-width="1.5"/>`;}
  const stall=LIGHT_FLY.stall*BPS_KN,vne=LIGHT_FLY.vmax*BPS_KN;
  asi+=`<path d="${inArc(38,ka(stall),ka(vne*0.8))}" fill="none" stroke="${IN_GUS}" stroke-width="3"/><path d="${inArc(38,ka(vne*0.8),ka(vne))}" fill="none" stroke="${IN_YOLK}" stroke-width="3"/>`;
  asi+=`<line x1="0" y1="6" x2="0" y2="-32" stroke="#fff" stroke-width="2.5" transform="rotate(${inF(ka(kt))})"/><circle r="3" fill="#fff"/>`+inT(0,18,9,'KNOTS','mono','middle',0,'#e9e3d3');
  const att=inHorizon('att'+p.idx,0,0,38,A.roll,A.pitch,'#4f9ad8','#7a5530')+`<path d="M-24,0 h14 l5,5 l5,-5 h14" fill="none" stroke="${IN_YOLK}" stroke-width="3"/>`;
  let alti='';for(let i=0;i<10;i++){const[x,y]=inPt(i*36,30);alti+=inT(x,+y+4,10,i,'mono','middle',0,'#e9e3d3');}
  alti+=`<line x1="0" y1="4" x2="0" y2="-20" stroke="#fff" stroke-width="4" transform="rotate(${inF(alt/1000*360)})"/><line x1="0" y1="5" x2="0" y2="-33" stroke="#fff" stroke-width="2" transform="rotate(${inF(alt%100/100*360)})"/><circle r="3" fill="#fff"/>`+inT(0,20,8,'x100 m','mono','middle',0,'#e9e3d3');
  return face(50,asi,'AIRSPEED')+face(150,att,'ATTITUDE')+face(250,alti,'ALTITUDE')+inThrot(304,-8,F.thr)+(planeStalled(F,pl)?inT(150,-4,14,'STALL','px ink-t','middle',3,'#ff9a8a'):'');}
function inPfd(p,D){const pl=D.o,F=pl.free||{},A=inAtt(pl),spd=Math.round((F.v||0)*BPS_KN),alt=Math.round(Math.max(0,pl.g.position.y-G));
  let s=`<rect x="0" y="0" width="220" height="130" rx="8" fill="#0d1014" stroke="${IN_INK}" stroke-width="4"/><defs><clipPath id="pfd${p.idx}"><rect x="50" y="10" width="120" height="110" rx="6"/></clipPath></defs><g clip-path="url(#pfd${p.idx})"><g transform="translate(110,${inF(65+A.pitch/IN_R*3)}) rotate(${inF(-A.roll/IN_R)})"><rect x="-160" y="-160" width="320" height="160" fill="#2f78c4"/><rect x="-160" y="0" width="320" height="160" fill="#7a5126"/><line x1="-160" y1="0" x2="160" y2="0" stroke="#fff" stroke-width="1.5"/>${[-10,-5,5,10].map(q=>`<line x1="${q%10?-8:-16}" y1="${-q*3}" x2="${q%10?8:16}" y2="${-q*3}" stroke="#fff" stroke-width="1.2"/>`).join('')}</g></g><path d="M80,65 h20 v6 M140,65 h-20 v6" fill="none" stroke="${IN_YOLK}" stroke-width="3"/>`;
  s+=`<rect x="8" y="10" width="38" height="110" rx="4" fill="#2a2f36"/><rect x="6" y="56" width="44" height="18" rx="2" fill="#000" stroke="#fff" stroke-width="1"/>${inT(46,70,14,spd,'mono','end',0,'#fff')}`;
  s+=`<rect x="174" y="10" width="40" height="110" rx="4" fill="#2a2f36"/><rect x="172" y="56" width="46" height="18" rx="2" fill="#000" stroke="#fff" stroke-width="1"/>${inT(214,70,13,alt,'mono','end',0,'#5cff8a')}`;
  const ap=pl.ap?'AP  ALT HOLD':'AP OFF';
  return s+inT(27,22,8,'KT','mono','middle',0,'#9aa3ad')+inT(194,22,8,'ALT','mono','middle',0,'#9aa3ad')+inT(110,116,9,(planeStalled(F,pl)?'STALL  ':'')+ap,'mono','middle',0,planeStalled(F,pl)?'#ff6a5a':'#5cff8a')+inThrot(226,10,F.thr);}
// the boat's throttle notches, astern to full (step: where the lever sits, -1 astern to 4 full)
const BOAT_NOTCH=['ASTERN','STOP','SLOW','HALF','FULL'];
function inBoat(p,D){const bo=D.o,kn=Math.round(Math.abs(bo.sp||0)*BPS_KN),n=bo.notch??(bo.sp>0.3?2:bo.sp<-0.3?-1:0),hd=inBear(bo.g.rotation.y),top=Math.max(10,Math.ceil(Math.max(6,bo.K.sp*1.6)*1.3*BPS_KN/10)*10);
  let s=`<circle r="49" fill="#1c2a3a"/><circle r="49" fill="none" stroke="#c99a3c" stroke-width="6"/>${inDial({v:kn,max:top,unit:'knots',ticks:5,labels:[0,1,2,3,4,5].map(i=>Math.round(top*i/5)),fill:false})}`;
  s+=`<g transform="translate(72,-44)"><rect x="0" y="0" width="44" height="92" rx="6" fill="rgba(18,22,28,.78)" stroke="${IN_INK}" stroke-width="2"/><rect x="18" y="8" width="6" height="76" rx="3" fill="#0c0f14"/>`;
  [...BOAT_NOTCH].reverse().forEach((nm,i)=>{const y=12+i*18;s+=inT(40,y+4,8,nm,'mono','end',0,i===3-n?'#fff':'#9aa3ad');});
  const ly=12+(3-n)*18;s+=`<rect x="10" y="${ly-5}" width="22" height="10" rx="3" fill="${IN_TOM}" stroke="${IN_INK}" stroke-width="1.5"/></g>`;
  s+=`<g transform="translate(-50,58)">${inStrip(hd,166)}</g>`;
  if(bo.anchor)s+=inT(0,-56,10,'⚓ ANCHOR','px ink-t','middle',2.5,IN_YOLK);
  return s;}
function inRow(p,D){const bo=D.o,R=bo.row||{l:0,r:0,ok:0},kn=Math.abs(bo.sp||0)*BPS_KN,ped=bo.k==='pedalo';
  let s=`<rect x="0" y="0" width="200" height="80" rx="10" fill="rgba(18,22,28,.8)"/>`;
  [[ped?'PEDALS':'LEFT OAR',R.l],[ped?'TILLER':'RIGHT OAR',ped?Math.abs(R.r):R.r]].forEach(([n,v],i)=>{const x=14+i*96;s+=inT(x,20,9,n,'mono','start',0,'#d9cfc2')+`<rect x="${x}" y="28" width="76" height="14" rx="4" fill="rgba(238,240,230,.12)"/><rect x="${x}" y="28" width="${inF(76*inCl(v,0,1))}" height="14" rx="4" fill="${IN_YOLK}"/><rect x="${x+50}" y="26" width="14" height="18" rx="2" fill="none" stroke="${IN_GUS}" stroke-width="2"/>`;});
  const good=(R.ok||0)>0.5;
  return s+inT(100,66,16,kn<0.3&&!R.l&&!R.r?(ped?'PEDAL: HOLD W':'PULL: LEFT, RIGHT'):good?'RHYTHM: GOOD':'RHYTHM: CATCH IT','px ink-t','middle',3,good?'#bff59a':'#ffc28a');}
function inShip(p,D){const S=D.o,ord=(S.ord||0)+2,act=(S.sp||0)/(S.K.top||1),rud=-(S.rud||0)*35,kn=Math.round(Math.abs(S.sp||0)*SHIP_KN);
  const L=['B FULL','B 1/3','STOP','1/3','2/3','FULL','FLANK'];let s=`<g transform="translate(60,60)"><path d="M-54,0 A54,54 0 0 1 54,0 Z" fill="#1c2a3a" stroke="#c99a3c" stroke-width="6"/>`;
  L.forEach((l,i)=>{const a=-90+i*30,[x1,y1]=inPt(a,54),[lx,ly]=inPt(a,40);s+=`<line x1="0" y1="0" x2="${x1}" y2="${y1}" stroke="rgba(201,154,60,.5)" stroke-width="1"/>`+inT(lx,+ly+3,7,l,'mono','middle',0,i===ord?IN_YOLK:'#d9cfc2');});
  const oa=-90+ord*30,aa=-90+inCl((act+0.45)/1.45,0,1)*180;s+=`<line x1="0" y1="0" x2="0" y2="-48" stroke="${IN_YOLK}" stroke-width="4" stroke-linecap="round" transform="rotate(${oa})"/><line x1="0" y1="0" x2="0" y2="-30" stroke="#fff" stroke-width="2" transform="rotate(${inF(aa)})"/><circle r="5" fill="#c99a3c" stroke="${IN_INK}" stroke-width="2"/></g>`;
  s+=`<g transform="translate(160,56)"><path d="${inArc(36,-70,70)}" fill="none" stroke="rgba(43,27,46,.6)" stroke-width="7"/><path d="${inArc(36,-70,0)}" fill="none" stroke="#e05a4a" stroke-width="3" opacity=".7"/><path d="${inArc(36,0,70)}" fill="none" stroke="#4ac06a" stroke-width="3" opacity=".7"/><line x1="0" y1="-30" x2="0" y2="-42" stroke="${IN_PAPER}" stroke-width="2"/><line x1="0" y1="0" x2="0" y2="-36" stroke="${IN_YOLK}" stroke-width="3" transform="rotate(${inF(rud*2)})"/><circle r="3.5" fill="${IN_YOLK}"/>${inT(0,16,12,'RUDDER '+Math.abs(Math.round(rud))+'° '+(rud>1?'STBD':rud<-1?'PORT':''),'px ink-t','middle',2.5)}${inT(0,34,22,kn+' kn'+(S.sp<-0.05?' ⟲':''),'px ink-t','middle',3.5)}</g>`;
  if(S.anchor)s+=inT(160,-4,10,'⚓ ANCHOR','px ink-t','middle',2.5,IN_YOLK);
  return s;}
function inTrain(p,D){const T=D.o,R=T.rail||{n:0,rev:1,bp:0,lim:null},v=Math.abs((D.k==='subway'?D.V.v:T.v)||0)*BPS_KMH,top=140;
  let s=`<g transform="translate(55,52)">${inDial({v,max:top,unit:'km/h',ticks:7,labels:[0,20,40,60,80,100,120,140],marker:R.lim})}</g>`;
  if(R.lim!=null)s+=inT(55,-2,9,'NEXT BEND '+Math.round(R.lim),'px ink-t','middle',2.5,'#ff9a8a');
  const N=['P5','P4','P3','P2','P1','N','B1','B2','B3','B4','B5'];s+=`<g transform="translate(112,0)"><rect x="0" y="0" width="40" height="112" rx="6" fill="rgba(18,22,28,.8)" stroke="${IN_INK}" stroke-width="2"/>`;
  N.forEach((nm,i)=>{const cur=(5-(R.n||0))===i;s+=`<rect x="5" y="${4+i*9.6}" width="30" height="8.4" rx="2" fill="${cur?(i<5?IN_GUS:i>5?IN_TOM:IN_YOLK):'rgba(238,240,230,.1)'}"/>`+inT(20,11+i*9.6,8,nm,'mono','middle',0,cur?IN_INK:'#c9c2b6');});
  const rv=R.rev>0?0:R.rev<0?2:1;
  s+=`</g><g transform="translate(160,8)"><rect x="0" y="0" width="34" height="44" rx="5" fill="rgba(18,22,28,.8)" stroke="${IN_INK}" stroke-width="2"/>${['F','N','R'].map((c,i)=>inT(17,14+i*13,11,c,'px','middle',0,i===rv?IN_YOLK:'#7d766c')).join('')}</g>`;
  return s+`<g transform="translate(177,84)"><circle r="20" fill="#16191d" stroke="${IN_INK}" stroke-width="3"/><path d="${inArc(15,-120,120)}" fill="none" stroke="rgba(238,240,230,.3)" stroke-width="3"/><line x1="0" y1="3" x2="0" y2="-15" stroke="${IN_TOM}" stroke-width="2.5" transform="rotate(${inF(-120+240*inCl(R.bp||0,0,1))})"/>${inT(0,14,7,'BRAKE','mono','middle',0,'#d9cfc2')}</g>`;}
function inBalloon(p,D){const B=D.o,vs=inCl(B.vy||0,-5,5),alt=Math.round(Math.max(0,B.y-groundAt(B.x,B.z,B.y+1))),temp=inCl(B.heat||0,0,1),L=balWinds(B),cur=L.cur;
  let s=`<g transform="translate(52,52)"><circle r="46" fill="#16191d" stroke="${IN_INK}" stroke-width="4"/>`;
  for(let v=-5;v<=5;v++){const a=-90+v*16,[x1,y1]=inPt(a,42),[x2,y2]=inPt(a,v%5===0?32:37);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e9e3d3" stroke-width="${v%5===0?2:1.2}"/>`;}
  s+=inT(-24,4,10,'0','mono','middle',0,'#e9e3d3')+inT(0,-24,9,'+5','mono','middle',0,'#e9e3d3')+inT(0,32,9,'−5','mono','middle',0,'#e9e3d3');
  s+=`<line x1="4" y1="0" x2="-36" y2="0" stroke="${IN_YOLK}" stroke-width="3" stroke-linecap="round" transform="rotate(${inF(vs*16)})"/><circle r="4" fill="${IN_YOLK}"/>${inT(14,16,9,'m/s','mono','middle',0,'#e9e3d3')}${inT(0,64,10,'CLIMB','px ink-t','middle',2.5)}</g>`;
  s+=`<g transform="translate(108,8)"><rect x="0" y="0" width="12" height="88" rx="4" fill="rgba(18,22,28,.8)" stroke="${IN_INK}" stroke-width="2"/><rect x="2" y="${inF(2+84*(1-temp))}" width="8" height="${inF(84*temp)}" rx="3" fill="${inHeat(temp)}"/>${inT(6,104,9,'HEAT','px ink-t','middle',2.5)}</g>`;
  s+=`<g transform="translate(128,0)"><rect x="0" y="0" width="92" height="112" rx="6" fill="rgba(18,22,28,.8)"/>${inT(46,13,9,'WIND','mono','middle',0,'#d9cfc2')}`;
  L.list.forEach((W,i)=>{const y=20+i*22,c=i===cur,rot=angDiff(p.cam.yaw+Math.PI,W.dir)/IN_R;s+=`<rect x="4" y="${y}" width="84" height="19" rx="3" fill="${c?'rgba(255,212,71,.2)':'transparent'}" stroke="${c?IN_YOLK:'rgba(238,240,230,.15)'}" stroke-width="1.5"/>`+inT(8,y+13,8,W.lab,'mono','start',0,c?IN_YOLK:'#d9cfc2')+`<g transform="translate(62,${y+9.5}) rotate(${inF(-rot)})"><path d="M0,-7 L4,3 L0,1 L-4,3 Z" fill="${c?IN_YOLK:IN_PAPER}"/></g>`+inT(84,y+13,8,Math.round(W.sp),'mono','end',0,c?IN_YOLK:'#d9cfc2');});
  return s+`</g>`+inT(176,126,18,alt+' m','px ink-t','middle',3);}
// ---- the fighter jet's head-up display: over the middle of the view, clear of the controls on the left ----
function inJet(p,D){const pl=D.o,F=pl.free||{},A=inAtt(pl),spd=Math.round((F.v||0)*BPS_KN),alt=Math.round(Math.max(0,pl.g.position.y-G)),hdg=inBear(A.hd),Gc='#8dff9a',S='stroke="'+Gc+'" stroke-width="3" fill="none"';
  const roll=A.roll/IN_R,pitch=A.pitch/IN_R;
  let s=`<defs><clipPath id="lad${p.idx}"><rect x="610" y="190" width="380" height="520"/></clipPath></defs><g clip-path="url(#lad${p.idx})"><g transform="translate(800,${inF(450+pitch*14)}) rotate(${inF(-roll)})">`;
  s+=`<line x1="-330" y1="0" x2="-40" y2="0" ${S}/><line x1="40" y1="0" x2="330" y2="0" ${S}/>`;
  const p0=Math.round(pitch/10)*10;
  for(let q=p0-30;q<=p0+30;q+=10){if(!q||Math.abs(q)>90)continue;const y=-(q-0)*14,d=q<0?'stroke-dasharray="14 8"':'';s+=`<path d="M-140,${y+(q>0?10:-10)} V${y} H-50 M50,${y} H140 V${y+(q>0?10:-10)}" ${S} ${d}/>`+inT(-160,y+8,22,Math.abs(q),'mono','end',0,Gc)+inT(160,y+8,22,Math.abs(q),'mono','start',0,Gc);}
  s+=`</g></g><g transform="translate(800,450)" ${S}><circle r="12"/><line x1="-34" y1="0" x2="-12" y2="0"/><line x1="12" y1="0" x2="34" y2="0"/><line x1="0" y1="-12" x2="0" y2="-26"/></g>`;
  s+=`<g transform="translate(560,450)"><rect x="-40" y="-170" width="80" height="340" fill="rgba(0,20,0,.25)" ${S}/>`;for(let i=-4;i<=4;i++){const v=Math.round(spd/20)*20+i*20,y=-(v-spd)*3.6;if(Math.abs(y)<165&&v>=0)s+=`<line x1="22" y1="${inF(y)}" x2="40" y2="${inF(y)}" ${S}/>`+(v%40===0?inT(14,y+7,20,v,'mono','end',0,Gc):'');}
  s+=`<rect x="-52" y="-20" width="84" height="40" fill="#0b1a0d" ${S}/>${inT(28,10,28,spd,'mono','end',0,Gc)}${inT(0,-186,20,'KT','mono','middle',0,Gc)}</g>`;
  s+=`<g transform="translate(1040,450)"><rect x="-40" y="-170" width="80" height="340" fill="rgba(0,20,0,.25)" ${S}/>`;for(let i=-4;i<=4;i++){const v=Math.round(alt/100)*100+i*100,y=-(v-alt)*.9;if(Math.abs(y)<165&&v>=0)s+=`<line x1="-40" y1="${inF(y)}" x2="-22" y2="${inF(y)}" ${S}/>`+(v%200===0?inT(-14,y+7,20,v,'mono','start',0,Gc):'');}
  s+=`<rect x="-32" y="-20" width="96" height="40" fill="#0b1a0d" ${S}/>${inT(-24,10,28,alt,'mono','start',0,Gc)}${inT(0,-186,20,'ALT m','mono','middle',0,Gc)}</g>`;
  s+=`<g transform="translate(800,160)"><line x1="-200" y1="20" x2="200" y2="20" ${S}/>`;for(let d=-30;d<=30;d+=5){const h=Math.round(hdg/5)*5+d,x=(h-hdg)*6.5;if(Math.abs(x)<=200)s+=`<line x1="${inF(x)}" y1="20" x2="${inF(x)}" y2="${h%10===0?4:12}" ${S}/>`+(h%10===0?inT(x,-4,18,String(Math.floor(((h%360)+360)%360/10)).padStart(2,'0'),'mono','middle',0,Gc):'');}
  s+=`<path d="M-10,40 L0,26 L10,40" ${S}/></g>`;
  const thr=inCl(F.thr||0,0,1),ab=!!F.ab,gl=F.gl||1;
  s+=`<g transform="translate(560,660)"><rect x="0" y="0" width="16" height="110" ${S}/><rect x="0" y="${inF(110-110*thr)}" width="16" height="${inF(110*thr)}" fill="${ab?'#ffb04a':Gc}"/>${inT(-12,24,20,'THR '+Math.round(thr*100)+'%','mono','end',0,Gc)}${ab?inT(-12,50,20,'AFTERBURNER','mono','end',0,'#ffb04a'):''}${inT(-12,76,20,inF(gl)+' G','mono','end',0,Gc)}${inT(-12,102,20,pl.hook?'HOOK DOWN':'HOOK UP','mono','end',0,Gc)}</g>`;
  if(planeStalled(F,pl))s+=inT(800,560,30,'STALL','mono','middle',0,'#ff6a5a');
  return s;}

// the Mobile Gear's speed ring: a segmented arc of its own speed (cyan, hotter near the top), the number in the middle, a
// tag for what it's doing (WALK, SKATE, AIR, ASSAULT, or REDLINE while its energy's run out), its vertical speed and height
// over the ground, and a pip for each quick boost its energy would pay for (three at most). In Chakra Petch (.mk)
const MG_RING_MODES={WALK:'#cfeeff',SKATE:'#7cd4ff',AIR:'#b59bff',ASSAULT:'#ffb04a',REDLINE:'#ff4a3a'},MG_RING_TOP=240;
function inMech(p,D){const M=D.o,sp=Math.hypot(M.vx||0,M.vz||0)*BPS_KMH,k=inCl(sp/MG_RING_TOP,0,1);
  const mode=M.red>0?'REDLINE':M.ab?'ASSAULT':!M.grounded?'AIR':M.boostOn?'SKATE':'WALK',col=MG_RING_MODES[mode],red=mode==='REDLINE';
  const vs=M.vy||0,alt=Math.max(0,Math.round(M.y-groundAt(M.x,M.z,M.y+0.5))),qb=Math.max(0,Math.min(3,Math.floor((M.en||0)/MG.qbEN))),id='mgg'+p.idx;
  const ln=(a,r1,r2,st)=>{const[x1,y1]=inPt(a,r1),[x2,y2]=inPt(a,r2);return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${st}/>`;},
    t=(x,y,s,txt,fill,ls)=>`<text x="${x}" y="${y}" text-anchor="middle" class="mk" font-size="${s}" fill="${fill}"${ls?` style="letter-spacing:${ls}px"`:''}>${txt}</text>`;
  const N=40;let s=`<defs><radialGradient id="${id}"><stop offset="0" stop-color="rgba(10,16,24,.82)"/><stop offset="1" stop-color="rgba(10,16,24,.55)"/></radialGradient></defs><circle r="58" fill="url(#${id})"/>`;
  s+=`<circle r="57" fill="none" stroke="rgba(232,246,255,.25)" stroke-width="1" stroke-dasharray="2 4"/>`;
  for(let i=0;i<N;i++){const a0=-135+270*i/N+1.2,a1=-135+270*(i+1)/N-1.2,on=i/N<k,hot=i/N>.82,c=on?(hot&&!red?'#ff6a4a':col):'rgba(232,246,255,.12)';
    s+=`<path d="${inArc(48,a0,a1)}" fill="none" stroke="${c}" stroke-width="7"/>`;}
  for(let i=1;i<6;i++)s+=ln(-135+45*i,40,37,'stroke="rgba(232,246,255,.6)" stroke-width="1"');
  s+=t(0,6,25,sp.toFixed(1).padStart(5,'0'),red?col:'#e8f6ff',1)+t(0,17,7,'KM/H','rgba(232,246,255,.7)',2);
  s+=`<g transform="translate(0,-26)"><path d="M-24,-7 H24 L28,0 L24,7 H-24 L-28,0 Z" fill="rgba(10,16,24,.9)" stroke="${col}" stroke-width="1.5"/>${t(0,3,8,mode,col,1.5)}</g>`;
  s+=t(-23,32,6.5,'VS','rgba(232,246,255,.65)')+t(-23,40,8,(vs>=0?'+':'−')+Math.abs(vs).toFixed(1),'#e8f6ff')+t(23,32,6.5,'ALT','rgba(232,246,255,.65)')+t(23,40,8,String(alt).padStart(3,'0'),'#e8f6ff');
  for(let i=0;i<3;i++)s+=`<path d="M${-10.5+i*9},52 l3,-4 h3 l-3,4 z" fill="${i<qb?'#7cd4ff':'rgba(232,246,255,.15)'}"/>`;
  s+=t(0,62,5.5,'QUICK BOOST','rgba(232,246,255,.55)',1.5);
  for(const [x,y,a,b] of [[-62,-62,1,1],[62,-62,-1,1],[-62,62,1,-1],[62,62,-1,-1]])s+=`<path d="M${x},${y+b*10} V${y} H${x+a*10}" fill="none" stroke="rgba(232,246,255,.45)" stroke-width="1.2"/>`;
  return s;}

// the renderers by key: draw, the box it's drawn in (vb), and how wide (w, pixels); over, laid over the view
const INSTRUMENTS={
  dial:{units:'km/h',dial:true},   // (today's dial, in the slot's own markup: players.js)
  car:{vb:'-112 -58 172 112',w:210,draw:inCar},
  bike:{vb:'0 0 200 86',w:200,draw:inBike},
  truck:{vb:'-55 -52 110 104',w:130,draw:inTruck},
  hover:{vb:'-55 -50 110 112',w:130,draw:inHover},
  fork:{vb:'0 0 190 150',w:190,draw:inFork,flat:true},
  tractor:{vb:'-52 -50 104 110',w:124,draw:inTractor},
  tank:{vb:'-48 -48 148 100',w:200,draw:inTank},
  heli:{vb:'0 0 230 100',w:250,draw:inHeli},
  steam:{vb:'0 -14 348 126',w:348,draw:inSteam},
  pfd:{vb:'0 0 270 130',w:282,draw:inPfd},
  jet:{over:'0 0 1600 900',draw:inJet},
  boat:{vb:'-55 -66 175 151',w:200,draw:inBoat},
  row:{vb:'0 0 200 80',w:200,draw:inRow},
  ship:{vb:'0 -14 210 118',w:240,draw:inShip},
  train:{vb:'0 -12 200 126',w:240,draw:inTrain},
  balloon:{vb:'0 0 222 134',w:250,draw:inBalloon},
  mgring:{vb:'-66 -66 132 134',w:170,draw:inMech,flat:true},
  cycle:{vb:'0 0 150 74',w:150,draw:inCycle,flat:true},gyro:{vb:'0 0 140 84',w:140,draw:inGyro,flat:true},moped:{vb:'-80 -58 160 116',w:150,draw:inMoped},
};
// which one a car has, by its body
const CAR_INST={bike:'bike',truck:'truck',semi:'truck',bus:'truck',fire:'truck',hover:'hover',forklift:'fork',tractor:'tractor',bicycle:'cycle',segway:'gyro',moped:'moped',kick:null};   // (a kick scooter has nothing)
// what's in the slot for this player now: their vehicle's instrument, or nothing (on foot, or with none)
function drvInst(p){const D=p.drv;if(!D||D.jack||D.seat==='gun')return null;   // (a gunner sees their guns' ammo, nothing more)
  const K=VEHICLE_KINDS[D.k];return K?K.inst(D):null;}
function instTick(p,dt){
  const key=drvInst(p),I=key&&INSTRUMENTS[key],el=p.ui.speedo,ov=I&&!!I.over;
  const slot=!!I&&!ov;if(el.hidden===slot)el.hidden=!slot;
  // (the slot's own dial, or the picture drawn into it; a head-up display over the view)
  if(!p.ui.inst){const d=document.createElement('div');d.className='inst-body';el.append(d);const o=document.createElement('div');o.className='inst-over';o.hidden=true;p.ui.view.append(o);p.ui.inst=d;p.ui.instOv=o;p.ui.spSvg=el.querySelector('svg');}
  if(!I){if(!p.ui.instOv.hidden)p.ui.instOv.hidden=true;p.instK=null;return;}
  if(p.instK!==key){p.instK=key;p.spT=0;p.spShown=null;p.inHTML='';p.inS=null;
    if(p.ui.spSvg)p.ui.spSvg.style.display=I.dial?'':'none';p.ui.inst.hidden=!!I.dial||ov;p.ui.instOv.hidden=!ov;
    el.style.width=I.w?'min('+I.w+'px,34%)':'';el.classList.toggle('flat',!!I.flat);}
  p.spT=(p.spT||0)-dt;if(p.spT>0)return;const st=1/20-p.spT;p.spT=1/20;   // redraw at 20 Hz
  if(I.dial){INST_DIAL(p);instVert(p);return;}
  const h=I.draw(p,p.drv,st),html=ov?`<svg viewBox="${I.over}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${h}</svg>`:`<svg viewBox="${I.vb}" aria-hidden="true">${h}</svg>`;
  if(html!==p.inHTML){p.inHTML=html;(ov?p.ui.instOv:p.ui.inst).innerHTML=html;}
}
// the ink dial in the slot's own markup: a needle round to SPEEDO_MAX, a fill coloured by how far round, the speed
function INST_DIAL(p){const v=Math.max(0,p.spV),k=Math.min(1,v/SPEEDO_MAX),shown=Math.round(v);
  if(shown!==p.spShown){p.spShown=shown;p.ui.spNum.textContent=String(shown);}
  p.ui.spNeedle.setAttribute('transform','rotate('+(-120+240*k).toFixed(1)+')');
  p.ui.spFill.setAttribute('stroke-dasharray',(k*100).toFixed(1)+' 200');p.ui.spFill.setAttribute('visibility',k<0.01?'hidden':'visible');
  p.ui.spFill.setAttribute('stroke',k<0.55?'#7fc24a':k<0.8?'#f0a04a':'#e0564a');}
// (under the dial: a crash landing coming, when falling from 5+ blocks above the ground or ground-pounding, by how hard)
function instVert(p){
  let crash=false;const C=p.state==='dead'&&p.corpse?p.corpse:null;
  if(!C&&!p.grounded&&p.vy<0){const gnd=groundAt(p.pos.x,p.pos.z,p.pos.y);crash=p.state==='pound'||abilOf(p).crash&&((p.peakY??p.pos.y)-gnd)>=5;}
  const vy=Math.round(p.spVY),vtxt=crash&&vy<-2?'↓ '+Math.abs(vy):'';
  const heat=-vy<70?'y':-vy<95?'o':'r';   // (yellow, then orange, then red)
  if(vtxt!==p.spVShown){p.spVShown=vtxt;p.ui.spVert.textContent=vtxt;p.ui.spVert.setAttribute('visibility',vtxt?'visible':'hidden');}
  if(heat!==p.spHeat){p.spHeat=heat;p.ui.spVert.setAttribute('class','sp-vert '+heat);}
}
