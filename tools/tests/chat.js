// Online chat and voice: a host and a guest, each a whole game in its own sandbox, joined by an in-memory transport as in
// net.js (whose harness this copies). Checks a typed line goes from the guest to the host and back, keys typed into the
// chat never move the hippo, lines are cut to length and only ever put on the page as text, the host's rate limit, the
// Options switches, and that with voice off nothing asks for the microphone, makes an AudioContext or adds audio to a
// connection. Then voice on at both ends (with a pretend microphone and connection): each sends to the other, push to
// talk, a refused or missing microphone (listening only), the Listen only box, and voice off letting everything go.
const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('g.js','utf8');
const d6=fs.readFileSync('dead6.js','utf8');
const stubs=d6.slice(d6.indexOf('const deep='),d6.indexOf('\neval(src);'));
const src=src0.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={frame,players,P1,P2,NET,netHostWith,netJoinWith,netEnd,keys,CHAT,VC,chatSend,chatAvail,chatClean,vcStart,vcOff,BINDS,'+
  'get seed(){return seed},get menuOpen(){return menuOpen}};})();');
if(src===src0)throw new Error('closing line not found');
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get _m(){return m}};};
// pretend media: counts every microphone asked for, AudioContext made and closed, track stopped
const media={gum:0,ac:0,acClosed:0,stopped:0,deny:null};
function fakeStream(tag){const tr={kind:'audio',enabled:true,tag,stop(){media.stopped++;this.ended=true;}};return{id:tag,getTracks:()=>[tr],getAudioTracks:()=>[tr],tr};}
function game(name,rseed,ls,ss){
  const timers=[];let clock=1000;
  const ctx={console,crypto:require('crypto').webcrypto,TextEncoder,structuredClone,
    performance:{now:()=>clock},setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},
    __LS:store(ls),__SS:store(ss)};
  vm.createContext(ctx);
  const head='var global=globalThis;let __s='+rseed+';Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};\n'+stubs+
    '\nO3.prototype.isObject3D=true;global.localStorage=__LS;global.sessionStorage=__SS;global.location={reload(){}};\n'+
    // (the game's own sound effects make an AudioContext when play starts: counted too, so voice's can be told apart)
    'global.AudioContext=class{constructor(){__M.ac++;this.currentTime=0;this.destination={};}resume(){}close(){__M.acClosed++;return Promise.resolve();}'+
    'createMediaStreamSource(){return{connect(){},disconnect(){}};}createAnalyser(){return{fftSize:512,getByteTimeDomainData(b){b.fill(128+(__M.loud?40:0));}};}'+
    'createOscillator(){return{frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(g){return g;},start(){},stop(){}};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(d){return d;}};}};'+
    'global.Audio=class{play(){this.playing=true;return Promise.resolve();}pause(){this.playing=false;}};'+
    'navigator.mediaDevices={getUserMedia:async c=>{__M.gum++;__M.lastC=c;if(__M.deny){const e=new Error("denied");e.name=__M.deny;throw e;}return __M.mk("mic-'+name+'");}};\n';
  ctx.__M=media;media.mk=fakeStream;
  vm.runInContext(head+src,ctx,{filename:name+'.js'});
  const T=ctx.__t,g={name,T,ctx,LS:ctx.__LS,SS:ctx.__SS,reloads:0};
  g.step=n=>{for(let i=0;i<n;i++){clock+=16.7;g.now=clock;for(let k=timers.length-1;k>=0;k--)if(timers[k].at<=clock){const t=timers.splice(k,1)[0];try{t.f();}catch(e){}}T.frame(clock);hub.pump();}};
  g.play=()=>{for(const f of ctx.document.getElementById('play').L.click)f();};
  g.el=id=>ctx.document.getElementById(id);
  g.click=id=>{for(const f of g.el(id).L.click||[])f();};
  // a key pressed: the chat box's own handlers first if it has the keyboard, then the page's (unless one stopped it)
  g.key=(code,toInput)=>{const e={code,key:code,repeat:false,stopped:false,stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;},preventDefault(){}};
    if(toInput)for(const f of g.el('chatIn').L.keydown||[])f(e);
    if(!e.stopped)for(const f of vm.runInContext('listeners',ctx).wkeydown||[])try{f(e);}catch(x){}   // (some of the page's handlers want a real layout: they're not what's tested)
    return e;};
  T.NET.onReload=()=>{g.reloads++;};
  T.NET.makeTr=(kind,code)=>{if(String(code).startsWith('gsg-lobby'))throw new Error('no lobby in this suite');return hub.make();};
  return g;
}
// the network, as in net.js, plus a pretend media path: av.add(stream,to) hands the other end a stream of its own
const hub={ts:[],q:[],sent:0,types:{},adds:0,removes:0,n:0,
  make(noAv){const T={kind:'mem',self:'m'+this.ts.length,on:{},open:true,
      send:(d,to)=>{if(!T.open)return;const s=JSON.stringify(d);hub.sent++;hub.types[d.t]=(hub.types[d.t]||0)+1;hub.q.push({from:T.self,to:to||null,s});},
      close:()=>{if(!T.open)return;T.open=false;for(const o of hub.ts)if(o!==T&&o.open)hub.q.push({leave:T.self,to:o.self});}};
    if(!noAv)T.av={cb:null,out:new Map(),add(st,to){hub.adds++;T.av.out.set(to,st);hub.q.push({stream:'from-'+T.self,from:T.self,to});},
      remove(st,to){hub.removes++;T.av.out.delete(to);},onStream(f){T.av.cb=f;},conns:()=>[]};
    for(const o of this.ts)if(o.open){this.q.push({join:T.self,to:o.self});this.q.push({join:o.self,to:T.self});}
    this.ts.push(T);return T;},
  pump(){this.n++;let n=0;while(this.q.length&&n++<10000){const m=this.q.shift();
    for(const T of this.ts){if(!T.open||T.self===m.from)continue;if(m.to&&m.to!==T.self)continue;
      if(m.stream){if(T.av&&T.av.cb)T.av.cb(fakeStream(m.stream),m.from);}
      else if(m.join){if(T.on.join)T.on.join(m.join);}else if(m.leave){if(T.on.leave)T.on.leave(m.leave);}else if(T.on.msg)T.on.msg(m.from,JSON.parse(m.s));}}}};
const ok=b=>b?'ok':'BAD',f2=v=>(+v).toFixed(2);
const SEED=+(process.env.SEED||1);
const yieldNow=()=>new Promise(r=>setImmediate(r));
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
(async()=>{
// ---- a solo game: no chat at all ----
const S=game('solo',SEED,{});S.play();S.step(30);
S.key('Enter');S.step(1);
console.log('solo: Enter opens no chat',ok(!S.T.CHAT.open),'chat not available',ok(!S.T.chatAvail()),'chat corner never shown',ok(S.el('chat').hidden!==false||!S.el('chat').kids.length));

// ---- host and guest, as in net.js ----
const H=game('host',SEED,{});H.play();H.step(60);const HT=H.T;
const acBase=media.ac;   // (the game's own sound AudioContext, made on Play)
HT.netHostWith(hub.make(),'TESTC','mem');
const G1=game('guest1',SEED+977,{});G1.step(20);G1.T.netJoinWith(hub.make(),'TESTC','mem');
for(let i=0;i<20&&!G1.reloads;i++){G1.step(1);H.step(1);}
const G=game('guest',SEED+977,Object.fromEntries(G1.LS._m),Object.fromEntries(G1.SS._m));const GT=G.T;
for(let i=0;i<60&&!GT.NET.joined;i++){G.step(1);H.step(1);await yieldNow();}
for(let i=0;i<30;i++){H.step(1);G.step(1);}
const acPlay=media.ac;
console.log('joined',ok(GT.NET.joined),'chat available: host',ok(HT.chatAvail()),'guest',ok(GT.chatAvail()),'| chat corner shown',ok(H.el('chat').hidden===false&&G.el('chat').hidden===false));

// ---- typing: Enter opens it, keys typed go nowhere else ----
{G.key('Enter');G.step(1);
 console.log('guest Enter: chat open',ok(GT.CHAT.open),'input shown',ok(G.el('chatIn').hidden===false));
 const p0={x:HT.P2.pos.x,y:HT.P2.pos.y,z:HT.P2.pos.z},pads=G.ctx.navigator.getGamepads();
 let leaked=0;for(const c of ['KeyW','KeyW','KeyA','Space','KeyE','KeyP','KeyV','KeyT']){const e=G.key(c,true);if(!e.stopped)leaked++;}
 GT.keys.add('KeyW');pads[0].axes[1]=-1;   // (and even a held key or the controller's stick while it's open)
 for(let i=0;i<60;i++){G.step(1);H.step(1);}
 const moved=d(HT.P2.pos,p0);pads[0].axes[1]=0;GT.keys.delete('KeyW');
 console.log('typing: keys that got past the chat box',leaked,ok(leaked===0),'| guest hippo moved on the host',f2(moved),ok(moved<0.3),'| guest controls sent while typing all zero',ok(!GT.P1.in.jump&&!GT.P1.in.x&&!GT.P1.in.z));
 // a line with markup in it and far too long
 const evil='<b>hi</b> & <img src=x onerror=alert(1)> '+'x'.repeat(200);
 G.el('chatIn').value=evil;G.key('Enter',true);for(let i=0;i<6;i++){G.step(1);H.step(1);}
 const hl=HT.CHAT.lines[HT.CHAT.lines.length-1],gl=GT.CHAT.lines[GT.CHAT.lines.length-1];
 console.log('Enter sent it and closed the chat',ok(!GT.CHAT.open),'| host shows',hl&&JSON.stringify(hl.n),'line length',hl&&hl.x.length,ok(hl&&hl.x.length===120&&hl.x.startsWith('<b>hi</b>')),
  '| guest got its own back',ok(gl&&gl.x===hl.x),'| as text only (no markup set)',ok(hl&&hl.el.innerHTML===''&&hl.el.kids.every(k=>k.innerHTML==='')&&hl.el.kids[1].textContent===hl.x));
 const p1={x:HT.P2.pos.x,z:HT.P2.pos.z,y:HT.P2.pos.y};pads[0].axes[1]=-1;for(let i=0;i<40;i++){G.step(1);H.step(1);}pads[0].axes[1]=0;
 console.log('chat closed: the stick moves the guest again',f2(d(HT.P2.pos,p1)),ok(d(HT.P2.pos,p1)>1));
 G.key('Enter');G.el('chatIn').value='never mind';G.key('Escape',true);for(let i=0;i<4;i++){G.step(1);H.step(1);}
 console.log('Esc cancels: closed',ok(!GT.CHAT.open),'nothing sent',ok(HT.CHAT.lines[HT.CHAT.lines.length-1]===hl));}

// ---- the host typing, a control character and an empty line ----
{const n0=GT.CHAT.lines.length;HT.chatSend('hello‮ from\nthe host  ');HT.chatSend('   ');for(let i=0;i<6;i++){H.step(1);G.step(1);}
 const gl=GT.CHAT.lines[GT.CHAT.lines.length-1];
 console.log('host line reaches the guest',ok(GT.CHAT.lines.length===n0+1),JSON.stringify(gl&&gl.x),ok(gl&&gl.x==='hello from the host'),'from',gl&&gl.n,gl&&gl.c);}

// ---- rate limit: the guest's own, and the host's for a guest that ignores it ----
{for(let i=0;i<30;i++){H.step(1);G.step(1);}   // (past the last lines' window)
 const n0=HT.CHAT.lines.length;let sent=0;for(let i=0;i<10;i++){if(GT.chatSend('spam '+i))sent++;G.step(1);H.step(1);}
 for(let i=0;i<5;i++){H.step(1);G.step(1);}
 console.log('guest tries 10 lines in a row: it lets',sent,'go, host shows',HT.CHAT.lines.length-n0-0,ok(sent<=4));
 for(let i=0;i<400;i++){H.step(1);G.step(1);}
 const n1=HT.CHAT.lines.filter(l=>!l.sys).length;for(let i=0;i<10;i++){GT.NET.tr.send({t:'chat',x:'flood '+i},GT.NET.host);}for(let i=0;i<5;i++){H.step(1);G.step(1);}
 const shown=HT.CHAT.lines.filter(l=>!l.sys).length-n1;
 console.log('a guest sending 10 at once past its own limit: host passes on',shown,ok(shown===1),'and tells it',ok(GT.CHAT.lines.some(l=>l.sys)));}

// ---- Options: mute the others, hide chat ----
{for(let i=0;i<400;i++){H.step(1);G.step(1);}
 H.click('chatInTog');const n0=HT.CHAT.lines.length,g0=GT.CHAT.lines.length;GT.chatSend('can you hear me');for(let i=0;i<6;i++){G.step(1);H.step(1);}
 console.log('host mutes incoming: guest line not shown on the host',ok(HT.CHAT.lines.length===n0),'guest still sees its own',ok(GT.CHAT.lines.length===g0+1),'kept',ok(H.LS.getItem('gsg-chat-v1').includes('"incoming":false')));
 H.click('chatInTog');H.click('chatShowTog');H.key('Enter');H.step(2);
 console.log('host hides chat: Enter opens nothing',ok(!HT.CHAT.open),'log hidden',ok(H.el('chatLog').hidden===true));H.click('chatShowTog');H.step(2);}

// ---- voice off all along: nothing asked of the microphone or the audio ----
console.log('voice off: microphones asked for',media.gum,ok(media.gum===0),'| AudioContexts made beyond the game\'s own',media.ac-acPlay,ok(media.ac===acPlay),
  '| audio added to a connection',hub.adds,ok(hub.adds===0),'| voice lists sent',hub.types.vr||0,ok(!hub.types.vr),'| voice chips drawn',G.el('vcHud').kids.length,ok(!G.el('vcHud').kids.length));

// ---- voice on: the guest first (the host's off, so it sends to nobody), then the host ----
{G.click('vcTog');await yieldNow();await yieldNow();for(let i=0;i<20;i++){G.step(1);H.step(1);}
 const c=media.lastC&&media.lastC.audio;
 console.log('guest voice on: microphone asked',media.gum,ok(media.gum===1),'with echo cancelling, noise suppression and gain control',ok(c&&c.echoCancellation&&c.noiseSuppression&&c.autoGainControl),
  '| its own AudioContext',ok(media.ac===acPlay+1),'| sending to anyone yet',hub.adds,ok(hub.adds===0),'| host knows',ok(HT.P2.net.vo===true));
 H.click('vcTog');await yieldNow();await yieldNow();for(let i=0;i<30;i++){H.step(1);G.step(1);}
 console.log('host voice on: audio added host->guest and guest->host',hub.adds,ok(hub.adds===2),'| each hears the other',ok(HT.VC.remote.size===1&&GT.VC.remote.size===1),
  '| roster on the guest',GT.VC.roster.map(r=>r.n+(r.on?' on':' off')).join(', '),'| HUD chips',JSON.parse(GT.VC.hudKey).map(c=>c.n).join(', '),ok(G.el('vcHud').hidden===false&&JSON.parse(GT.VC.hudKey).length===2));
 // push to talk: the guest's track is silent until T is held
 const gt=GT.VC.mic.tr,before=gt.enabled;GT.keys.add('KeyT');for(let i=0;i<3;i++){G.step(1);H.step(1);}const held=gt.enabled;GT.keys.delete('KeyT');for(let i=0;i<3;i++){G.step(1);H.step(1);}
 console.log('push to talk: track enabled before',before,'holding T',held,'let go',gt.enabled,ok(!before&&held&&!gt.enabled));
 media.loud=true;GT.keys.add('KeyT');for(let i=0;i<10;i++){G.step(1);H.step(1);}
 console.log('talking: the guest\'s own chip lit',ok(GT.VC.hudKey.includes('"talk":true')),'host sees the guest talking',ok(HT.VC.hudKey.includes('"talk":true')));
 GT.keys.delete('KeyT');media.loud=false;
 // a per-player mute, only on the host's side
 const r=[...HT.VC.remote.values()][0];H.el('vcPeers').kids[0].L.click[0]();console.log('host mutes the guest: its audio muted',ok(r.el.muted===true),'guest unaffected',ok(![...GT.VC.remote.values()][0].el.muted));
 // the guest switches off
 const st0=media.stopped,cl0=media.acClosed;G.click('vcTog');for(let i=0;i<20;i++){G.step(1);H.step(1);}
 console.log('guest voice off: mic tracks stopped',media.stopped-st0,ok(media.stopped>st0),'AudioContext closed',ok(media.acClosed===cl0+1),'| guest plays nobody',ok(GT.VC.remote.size===0&&!GT.VC.mic),
  '| host stopped sending to it',ok(hub.removes>=2&&HT.VC.sendTo.size===0),'| host drops its audio',ok(HT.VC.remote.size===0));}

// ---- a refused microphone: voice goes on listening only, and still hears the host (who's still talking) ----
const lst=async n=>{for(let i=0;i<n;i++){G.step(1);H.step(1);if(i<3)await yieldNow();}};
{media.deny='NotAllowedError';const add0=hub.adds;G.click('vcTog');await yieldNow();await yieldNow();await lst(30);
 const hr=HT.VC.roster.find(r=>r.id===GT.NET.tr.self);
 console.log('microphone refused: voice on, listening only',ok(GT.VC.on&&GT.VC.lo&&!GT.VC.mic),'| says',JSON.stringify(G.el('vcNote').textContent.slice(0,45)),ok(/No microphone: listening only/.test(G.el('vcNote').textContent)),
  '| host lists it as listening',ok(hr&&hr.on&&!hr.mic),'| host sends it audio',ok(hub.adds===add0+1&&HT.VC.sendTo.has(GT.NET.tr.self)),'| it hears the host',ok(GT.VC.remote.size===1),
  '| it sends nothing',ok(GT.VC.sendTo.size===0),'| its own chip',JSON.stringify(JSON.parse(GT.VC.hudKey)[0].n),ok(/listening/.test(GT.VC.hudKey)));
 const cl0=media.acClosed;G.click('vcTog');await lst(20);
 console.log('listener switches off: AudioContext closed',ok(media.acClosed===cl0+1),'hears nobody',ok(GT.VC.remote.size===0),'host stopped sending to it',ok(HT.VC.sendTo.size===0));
 media.deny='NotFoundError';G.click('vcTog');await yieldNow();await yieldNow();await lst(20);
 console.log('no microphone at all: listening only',ok(GT.VC.on&&GT.VC.lo&&GT.VC.remote.size===1),'says',JSON.stringify(G.el('vcNote').textContent.slice(0,40)));
 G.click('vcTog');await lst(10);media.deny=null;}

// ---- Listen only ticked: never asks for the microphone, makes the AudioContext only once a voice arrives ----
{const g0=media.gum,a0=media.ac,add0=hub.adds;G.click('vcLoTog');await lst(10);
 console.log('Listen only ticked, voice off: still no audio work',ok(media.gum===g0&&media.ac===a0&&hub.adds===add0&&!GT.VC.on),'kept',ok(G.LS.getItem('gsg-voice-v1').includes('"listen":true')));
 G.click('vcTog');await lst(30);
 console.log('voice on, listening only: microphone asked',media.gum-g0,ok(media.gum===g0),'| AudioContext made for the host\'s voice',media.ac-a0,ok(media.ac===a0+1),'| hears the host',ok(GT.VC.remote.size===1),'| sends nothing',ok(GT.VC.sendTo.size===0&&hub.adds===add0+1));
 media.loud=true;HT.keys.add('KeyT');await lst(10);
 console.log('host talks: its chip lights for the listener',ok(JSON.parse(GT.VC.hudKey).some(c=>c.talk)),'listener\'s own chip never lit',ok(!JSON.parse(GT.VC.hudKey)[0].talk));
 HT.keys.delete('KeyT');media.loud=false;
 const r=[...GT.VC.remote.values()][0];G.el('vcPeers').kids[G.el('vcPeers').kids.length-1].L.click[0]();
 console.log('listener mutes the host',ok(r.el.muted===true),'| host\'s chip shows the listener',ok(/listening/.test(HT.VC.hudKey)));
 const cl0=media.acClosed;G.click('vcTog');await lst(10);G.click('vcLoTog');
 console.log('off again: AudioContext closed',ok(media.acClosed===cl0+1),'nothing left',ok(!GT.VC.on&&!GT.VC.ctx&&GT.VC.remote.size===0));}

// ---- leaving the game lets everything go ----
{const cl0=media.acClosed;HT.netEnd();for(let i=0;i<10;i++){H.step(1);G.step(1);}
 console.log('host stops hosting: its voice off',ok(!HT.VC.on&&!HT.VC.mic),'AudioContext closed',ok(media.acClosed===cl0+1),'chat hidden',ok(H.el('chat').hidden===true),'chat gone',ok(HT.CHAT.lines.length===0));}
console.log('Gus and Gertie: the same chat and voice code for both (nothing reads p.who but names and colours)');
console.log('done');
})().catch(e=>{console.log('ERROR',e&&e.stack||e);process.exit(1);});
