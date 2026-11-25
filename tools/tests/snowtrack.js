// Tracks in the snow (render/snow-tracks.js): the traffic's wheels and the hippos' feet press into a map round the player,
// at the height they went over; it follows the player without carrying old tracks to new places; falling snow fills them
// in; the snow going takes them with it; and the picture option turns it off. And what it costs a frame.
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v,x)=>{ok.push(!!v);console.log(n,v?'ok':'BAD',x===undefined?'':x);};
for(const f of els.play.L.click)f();pads.length=0;run(0.5);
const P=T.players[0],{TRK_N,TRK_Q,G}=T;
const snow=v=>E('(v)=>{WX.snowP=WX.snowC=WX.snowCover=WX.snowW=v;WX.snowClock=50;}')(v);
E('wxSet')('clear',true);snow(1);run(1);
const M=()=>T.trkMaps[P.idx];
const at=(x,z)=>{const m=M(),u=((Math.floor(x*TRK_Q)%TRK_N)+TRK_N)%TRK_N,v=((Math.floor(z*TRK_Q)%TRK_N)+TRK_N)%TRK_N,i=(v*TRK_N+u)*2;return [m.d[i],m.d[i+1]];};
const sum=()=>{let n=0;const d=M().d;for(let i=0;i<d.length;i+=2)if(d[i])n++;return n;};
chk('a map for the player, centred on them',M()&&Math.abs(M().cx*8-P.pos.x)<9&&T.TRKC_U.value.z===1,M()&&[M().cx*8,Math.round(P.pos.x)]);
// the traffic going by: its back wheels' line has tracks under it, at the road's height
run(2);
chk('tracks pressed',sum()>200,sum());
const near=E('cars.filter(c=>c.alive&&c.g.visible&&c.grounded&&Math.abs(c.speed)>3&&c.veh!=="bike"&&VEH[c.veh].hx>=0.5&&Math.hypot(c.pos.x-players[0].pos.x,c.pos.z-players[0].pos.z)<50)');
chk('cars moving near the player',near.length>0,near.length);
step(1);
{const c=near.find(c=>c.alive&&c.grounded);
  if(c){const V=T.VEH[c.veh],s=Math.sin(c.heading),k=Math.cos(c.heading),a=V.hx-0.28,b=-(Math.max(0.3,V.hz-0.55))-0.6;   // (just behind a back wheel)
    const [n,h]=at(c.pos.x+a*k+b*s,c.pos.z-a*s+b*k);
    chk('behind a car\'s back wheel, pressed hard at its height',n>150&&Math.abs(h-Math.round(c.pos.y))<=1,[n,h,c.pos.y.toFixed(2),G+1]);
    const [n2]=at(c.pos.x+b*s,c.pos.z+b*k);chk('between its wheels, not',n2<60,n2);}}
// the hippo walking leaves prints
{const m=M();m.d.fill(0);P.pos.x+=0;const x0=P.pos.x,z0=P.pos.z;E('cars.forEach(c=>c.g.visible=false)');
  E('(p)=>{p.grounded=true;p.trkF=null;}')(P);for(let i=0;i<60;i++){P.pos.x=x0+i*0.1;P.grounded=true;E('trkTick')(1/60);}
  let n=sum();chk('the hippo walking six blocks leaves footprints',n>20&&n<600,n);
  // Gertie the same
  const P2=T.players[1],was=P2.active;P2.active=true;P2.pos.set(x0,P.pos.y,z0+3);P2.grounded=true;P2.trkF=null;P2.state='walk';P2.drv=null;
  for(let i=0;i<60;i++){P2.pos.x=x0+i*0.1;P2.grounded=true;E('trkTick')(1/60);}P2.active=was;
  chk('Gertie the same',sum()>n*1.7&&sum()<n*2.3,[n,sum()]);
  E('cars.forEach(c=>c.g.visible=c.alive)');}
// moving off: a part of the map that now stands for somewhere else is emptied first
{const m=M();m.d.fill(0);E('trkLine')(P.pos.x+20,P.pos.z,P.pos.x+20,P.pos.z+4,P.pos.y,0.3,1);
  const x=P.pos.x+20,z=P.pos.z+2;chk('a stroke drawn',at(x,z)[0]>200);
  const was=P.pos.x;P.pos.x-=108;E('trkView')(P);chk('gone 108 blocks the other way, the same texel is clear',at(x,z)[0]===0,at(x,z));P.pos.x=was;E('trkView')(P);}
// falling snow fills them in
{const m=M();E('trkLine')(P.pos.x,P.pos.z,P.pos.x,P.pos.z+4,P.pos.y,0.3,1);const before=sum();
  E('wxSet')('blizzard',true);snow(1);E('cars.forEach(c=>c.g.visible=false)');for(let i=0;i<60*20;i++)E('trkTick')(1/60);const half=at(P.pos.x,P.pos.z+2)[0];
  for(let i=0;i<60*25;i++)E('trkTick')(1/60);
  chk('a blizzard half fills them in 20 seconds and all of them in 45',half>60&&half<200&&sum()===0,[before,half,sum()]);
  E('wxSet')('clear',true);snow(1);E('cars.forEach(c=>c.g.visible=c.alive)');}
// the snow gone: the tracks too, and nothing shown
{E('trkLine')(P.pos.x,P.pos.z,P.pos.x,P.pos.z+4,P.pos.y,0.3,1);snow(0);E('trkTick')(1/60);E('trkView')(P);
  chk('the snow gone, the tracks with it',sum()===0&&T.TRKC_U.value.z===0);snow(1);E('trkView')(P);}
// the picture option
{const t=els.trkTog;chk('Tracks in snow is on to start',t.attrs['aria-checked']==='true');
  for(const f of t.L.click)f();E('trkView')(P);chk('switched off, nothing drawn',T.SNOW_TRACKS===false&&T.TRKC_U.value.z===0&&t.attrs['aria-checked']==='false');
  for(const f of t.L.click)f();E('trkView')(P);chk('and back on',T.TRKC_U.value.z===1);}
// what a frame of it costs, with the traffic about
{snow(1);run(1);const n=E('cars.filter(c=>c.alive&&c.g.visible).length'),f=E('trkTick'),t0=process.hrtime.bigint();for(let i=0;i<300;i++)f(1/60);
  const ms=Number(process.hrtime.bigint()-t0)/300e6;console.log('a frame of tracks with '+n+' cars about: '+ms.toFixed(3)+' ms');chk('under a quarter of a millisecond',ms<0.25);}
console.log('errors',errs.length,errs.slice(0,4));
const pass=ok.every(Boolean)&&!errs.length;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
