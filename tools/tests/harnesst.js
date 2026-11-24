// The harness itself (harness.js), checked: it boots, reaches names inside the game, sets one, runs frames with no errors.
const {T,E,run,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v)=>{ok.push(v);console.log(n,v?'ok':'BAD');};
chk('reads a function and a value',typeof T.placeAt==='function'&&typeof T.seed==='number'&&Array.isArray(T.players));
const s0=T.playTime;T.playTime=123;chk('sets a name',E('playTime')===123);T.playTime=s0;
for(const f of els.play.L.click)f();pads.length=0;run(2);
chk('two seconds of frames, chunks made',T.chunks.size>20);
chk('colKey tells columns 65,536 apart from each other',T.colKey(0,-1)!==T.colKey(-1,65535)&&T.colKey(5,7)===T.colKey(5,7));
chk('the edge of the world stops a player',(()=>{const p=T.players[0],x=p.pos.x;p.pos.x=T.WORLD_EDGE+50;T.worldEdgeTick();const r=p.pos.x===T.WORLD_EDGE;p.pos.x=x;return r;})());
chk('a frame that throws still leaves the game running',(()=>{const n=errs.length;const ri=T.readInputs;T.readInputs=()=>{throw new Error('harnesst: on purpose');};let thrown=false;try{run(0.1);}catch(e){thrown=true;}T.readInputs=ri;run(0.1);return !thrown&&errs.length===n+1;})());
console.log('errors',errs.length-1,errs.filter(e=>!/on purpose/.test(e)).slice(0,4));
const pass=ok.every(Boolean)&&errs.length===1;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
