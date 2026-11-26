// Rain and snow blown at a slant are hidden by what's in their way along the slant (shadeMap, render/weather.js), not
// just by what's straight overhead: under the downwind side of an overhang, in the lee of a wall, and in a room open to
// the wind only through its door. Checked on a made-up cover map, then the time it takes on a real one.
const {T,E,run,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v,x)=>{ok.push(v);console.log(n,v?'ok':'BAD',x??'');};
for(const f of els.play.L.click)f();pads.length=0;run(1);
const C=T.COVERS[0],N=C.N;T.COVER=C;C.x0=0;C.z0=0;C.v=(C.v||0)+100;
// flat ground at 10; a roof slab at 14 over x 10..19 (no walls: an open-sided shelter); a wall 10 high at x=30
C.top.fill(10);for(let z=0;z<N;z++){for(let x=10;x<20;x++)C.top[z*N+x]=14;C.top[z*N+30]=20;}
const shade=(sx,sz)=>T.shadeMap(0,'t'+sx+','+sz,sx,sz),at=(S,x,z)=>S[z*N+x];
const S0=shade(0,0);
chk('no wind: the same as straight up',at(S0,15,20)===14&&at(S0,21,20)===10&&at(S0,31,20)===10);
// wind blowing towards +x at a slant of 1 across for 1 down: under the roof's upwind half a drop reaches in, its
// downwind half is sheltered, and the shadow runs out past the roof's downwind edge (x 20..22 below 14)
const S1=shade(1,0);
chk('the roof still covers straight under it',at(S1,15,20)>=14);
chk('past the roof\'s downwind edge, in its shadow',at(S1,21,20)>=12&&at(S1,22,20)>10&&at(S1,24,20)===10,[at(S1,21,20),at(S1,22,20),at(S1,24,20)]);
chk('upwind of the roof, open',at(S1,9,20)===10);
chk('in the wall\'s lee, the wall\'s height down the slant',at(S1,35,20)>=15&&at(S1,39,20)>=11&&at(S1,41,20)===10,[at(S1,35,20),at(S1,39,20),at(S1,41,20)]);
// the other way: the shadow's on the other side
const S2=shade(-1,0);
chk('wind the other way: the lee\'s the other side',at(S2,25,20)>=15&&at(S2,35,20)===10);
// a room roofed at 14 over x 5..9, z 5..9: nothing gets inside, whatever the slant
C.top.fill(10);for(let z=5;z<10;z++)for(let x=5;x<10;x++)C.top[z*N+x]=14;C.v++;
const S3=shade(1.5,0.3);
let inside=true;for(let z=5;z<10;z++)for(let x=5;x<10;x++)if(at(S3,x,z)<14)inside=false;
chk('a roofed room is covered',inside);
// a steeper slant than 2 is held to 2
C.top.fill(10);for(let z=0;z<N;z++)C.top[z*N+20]=20;C.v++;
const S4=shade(6,0);chk('steep slant capped at 2',at(S4,38,20)>10&&at(S4,41,20)===10,[at(S4,38,20),at(S4,41,20)]);
// cached: the same slant and map gives the same array without working it out again
chk('cached',T.shadeMap(0,'t1,0',1,0)===T.shadeMap(0,'t1,0',1.01,0));
// time on a real cover map in a town, worst case (a blizzard's slant)
C.cx=1e9;T.wxClock=T.wxClock+10;const p=T.players[0];T.coverMap({x:p.pos.x,y:p.pos.y+1.6,z:p.pos.z},0);
let t0=process.hrtime.bigint();for(let i=0;i<50;i++){C.v++;T.shadeMap(0,'snow',1.4+i*0.001,1.4);}
const ms=Number(process.hrtime.bigint()-t0)/1e6/50;console.log('shadeMap on a real map, blizzard slant: '+ms.toFixed(3)+' ms');
t0=process.hrtime.bigint();for(let i=0;i<50;i++){C.v++;T.shadeMap(0,'rain',0.13,0.05+i*0.001);}
console.log('shadeMap on a real map, rain slant: '+(Number(process.hrtime.bigint()-t0)/1e6/50).toFixed(3)+' ms');
// a few seconds of a blizzard and of a storm with the real drawing
T.wxSet('blizzard',true);run(2);T.wxSet('storm',true);run(2);
console.log('errors',errs.length,errs.slice(0,4));
const pass=ok.every(Boolean)&&errs.length===0;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
