// How much a heavily smashed city costs: memory per smashed block (chunkEdits) and the
// time a save takes on the main thread (building the save, turning it to text), first and then with one chunk changed.
// node --expose-gc savemeas.js [blocks per chunk]
const {T,E,els,pads,run}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;run(1);
const PER=+(process.argv[2]||4000),mem=()=>{global.gc&&global.gc();return process.memoryUsage().heapUsed/1048576;};
const STONE=E('STONE'),CS=16;let n=0,cx=200;
const fill=target=>{while(n<target){const x0=cx*CS,z0=(cx%40)*CS;for(let i=0;i<PER;i++){const x=x0+(i&15),z=z0+((i>>4)&15),y=50+((i>>8)%120);T.addEdit(x,y,z,STONE);n++;}cx++;}};
const ms=f=>{const t=process.hrtime.bigint();const r=f();return [Number(process.hrtime.bigint()-t)/1e6,r];};
const m0=mem();
for(const target of [100000,500000,1000000,2000000]){
  fill(target);const m=mem();
  const [t1,s1]=ms(()=>JSON.stringify(E('saveObj')({})));
  T.addEdit(200*CS+3,60,5,STONE);n++;
  const [t2,s2]=ms(()=>JSON.stringify(E('saveObj')({})));
  const [t3]=ms(()=>E('saveObj')({}));
  console.log('blocks',n,'| heap +'+(m-m0).toFixed(0)+' MB ('+((m-m0)*1048576/n).toFixed(0)+' bytes a block) | save text',(s2.length/1048576).toFixed(2),'MB | first save',t1.toFixed(0),'ms | next save (one chunk changed)',t2.toFixed(1),'ms, of which building it',t3.toFixed(1),'ms');
}
process.exit(0);
