// Snow through a gap in a roof doesn't flicker: each flake's shown or hidden by where its path is, not where its sway has
// carried it this frame, so one near the edge of the shelter isn't hidden and shown again and again as it sways.
const {T,E,run,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;run(1);
const C=T.COVERS[0],N=C.N,NN=N*N,cam={x:1000.5,y:30,z:1000.5};
// a cover map pinned round the camera: the floor at 10, a roof at 25 with a long gap 4 wide across it
const pin=()=>{C.cx=Math.floor(cam.x);C.cz=Math.floor(cam.z);C.cy=cam.y;C.t=T.wxClock;};
C.x0=Math.floor(cam.x)-(N>>1);C.z0=Math.floor(cam.z)-(N>>1);C.y0=18;C.y1=66;C.sol.fill(0);C.top.fill(-1);C.v=(C.v||0)+1000;
const solid=(x,y,z)=>{C.sol[(y-C.y0)*NN+z*N+x]=1;C.top[z*N+x]=Math.max(C.top[z*N+x],y+1);};
for(let z=0;z<N;z++)for(let x=0;x<N;x++){solid(x,18,z);if(x<30||x>33)solid(x,25,z);}
T.WXK.rain=0;T.WXK.snow=1;T.WXK.dust=0;T.WXK.wind=0.9;
const pv=T._pv,vis=new Int8Array(T.PRECIP_N).fill(-1),flips=new Int32Array(T.PRECIP_N);let cur=0;
T.snowM.setMatrixAt=(i)=>{const v=pv.y>-400?1:0;if(vis[i]>=0&&vis[i]!==v)flips[i]++;vis[i]=v;};
for(let f=0;f<600;f++){T.wxClock=T.wxClock+1/60;pin();T.placePrecip(cam,0);}
let many=0,tot=0;for(let i=0;i<T.PRECIP_N;i++){tot+=flips[i];if(flips[i]>4)many++;}
console.log('ten seconds of snow under a roof with a gap: flakes shown and hidden more than 4 times',many,'| changes in all',tot);
console.log('errors',errs.length,errs.slice(0,4));
const pass=many<20&&errs.length===0;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
