// Options, voice chat: Push to talk above My voice and Others' voice, each of those with its volume slider on the same row
// (under it in a narrow window), and Others' voice going up to 200%: past 100% it plays through a gain node (vcOut), so a
// pretend voice is played at each volume and muted, and the gain read back. Controller round the rows. Screenshots.
// Usage: python3 tools/build_ui.py game/index.html tools/ui/ui.html, then from tools/ui: node vcvol.js [outDir]
const {chromium}=require('playwright');const fs=require('fs');
let html=fs.readFileSync('ui.html','utf8');const end='requestAnimationFrame(frame);\n})();';
if(!html.includes(end))throw new Error('no end marker in ui.html');
html=html.replace(end,'window.__V={VC,vcPlay,vcOut,vcCtx,vcMute,vcOptsDraw};\n'+end);fs.writeFileSync('vcvol.html',html);
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
let bad=0;const check=(name,ok,s)=>{if(!ok)bad++;console.log((ok?'ok   ':'BAD  ')+name+'  '+JSON.stringify(s));};
const errs=[],out=process.argv[2];
const open=async w=>{const ctx=await b.newContext({viewport:{width:w,height:950}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{window.__pad={index:0,id:'Xbox pad',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),vibrationActuator:null};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  await p.goto('file://'+process.cwd()+'/vcvol.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>{document.getElementById('tabBtnMulti').click();document.getElementById('vcSub').hidden=false;});await p.waitForTimeout(300);return [ctx,p];};
const box=(p,id)=>p.evaluate(id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),b:Math.round(r.bottom),w:Math.round(r.width)};},id);
const mid=r=>(r.y+r.b)/2;
for(const w of [1200,560,400]){const [ctx,p]=await open(w);
  const pt=await box(p,'vcPttTog'),mt=await box(p,'vcMicTog'),mv=await box(p,'vcMicVol'),ht=await box(p,'vcHearTog'),hv=await box(p,'vcVol');
  check(w+' wide: Push to talk above My voice, My voice above Others\' voice',pt.b<=mt.y&&mt.b<=ht.y,{pt,mt,ht});
  if(w>900)check(w+' wide: each volume on its switch\'s row, to its right',Math.abs(mid(mv)-mid(mt))<20&&mv.x>mt.x+mt.w-1&&Math.abs(mid(hv)-mid(ht))<20&&hv.x>ht.x+ht.w-1,{mt,mv,ht,hv});
  else check(w+' wide: each volume beside or under its switch, before the next',mv.y>=mt.y-1&&mv.b<=ht.y&&hv.y>=ht.y-1,{mt,mv,ht,hv});
  {const o=await box(p,'chatOpts'),v=await p.evaluate(()=>['vcVolVal','vcMicVolVal'].map(i=>Math.round(document.getElementById(i).getBoundingClientRect().right)));
   check(w+' wide: the percentages stay inside the section',v.every(x=>x<=o.x+o.w+1),{right:o.x+o.w,v});}
  if(out){const sec=await p.evaluateHandle(()=>document.getElementById('chatOpts'));await sec.scrollIntoViewIfNeeded();await p.waitForTimeout(200);await sec.screenshot({path:out+'/vcvol-'+w+'.png'});}
  if(w>900){
    const mx=await p.evaluate(()=>[document.getElementById('vcVol').max,document.getElementById('vcMicVol').max]);check('both volumes go to 200',mx[0]==='200'&&mx[1]==='200',mx);
    // a pretend voice: a tone from another AudioContext, as a stream
    const g=await p.evaluate(async()=>{const V=window.__V;V.VC.on=true;V.VC.hear=true;const A=new AudioContext(),o=A.createOscillator(),d=A.createMediaStreamDestination();o.connect(d);o.start();
      V.vcCtx();await V.VC.ctx.resume();V.vcPlay('pal',d.stream);const r=V.VC.remote.get('pal'),rd=()=>({gain:r.g&&+r.g.gain.value.toFixed(2),el:r.el.muted,vol:r.el.volume,st:V.VC.ctx.state});
      const s=[];const set=v=>{const e=document.getElementById('vcVol');e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));};
      s.push(rd());set(200);s.push(rd());set(50);s.push(rd());V.vcMute('pal',true);s.push(rd());V.vcMute('pal',false);set(150);s.push(rd());s.push(document.getElementById('vcVolVal').textContent);return s;});
    check('played through the gain node at 100%, its element silent',g[0].gain===1&&g[0].el===true&&g[0].st==='running',g[0]);
    check('200%: gain 2',g[1].gain===2,g[1]);check('50%: gain 0.5',g[2].gain===0.5,g[2]);check('muted: gain 0',g[3].gain===0&&g[3].el===true,g[3]);
    check('unmuted at 150%: gain 1.5, shown as 150%',g[4].gain===1.5&&g[5]==='150%',g.slice(4));
    const k=await p.evaluate(()=>localStorage.getItem('gsg-voice-v1'));
    await p.evaluate(()=>{const e=document.getElementById('vcVol');e.value='180';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
    await p.reload();await p.waitForTimeout(1500);const v=await p.evaluate(()=>[window.__V.VC.vol,document.getElementById('vcVolVal').textContent]);
    check('180% kept over a reload',v[0]===1.8&&v[1]==='180%',v);
    // controller round the rows
    await p.evaluate(()=>{document.getElementById('tabBtnMulti').click();document.getElementById('vcSub').hidden=false;});await p.waitForTimeout(300);
    const press=async i=>{await p.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await p.waitForTimeout(120);await p.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await p.waitForTimeout(120);};
    const cur=()=>p.evaluate(()=>document.activeElement&&document.activeElement.id);
    await p.evaluate(()=>{const e=document.getElementById('vcPttTog');e.focus();e.classList.add('padfocus');});
    const path=[await cur()];for(const [l,k] of [['down',13],['down',13],['up',12]])  {await press(k);path.push(l+'→'+await cur());}
    await p.evaluate(()=>{const e=document.getElementById('vcHearTog');e.focus();});await press(15);path.push('right→'+await cur());
    check('pad: down from Push to talk to My voice, then Others\' voice; right from a switch to its volume',path[1]==='down→vcMicTog'&&path[2]==='down→vcHearTog'&&path[3]==='up→vcMicTog'&&path[4]==='right→vcVol',path);}
  await ctx.close();}
console.log(errs.join('\n')||'no errors');console.log(bad?bad+' BAD':'all ok');await b.close();})();
