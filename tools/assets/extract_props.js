// One-time migration (kept for reference): reads the PROPS table as it was written in src/js/dressing/props.js and writes
// each prop out as src/assets/props/<name>.json, with the comment above it carried over as its note (a comment above a
// run of props goes to each of them). Run from the repo root:
//   node tools/assets/extract_props.js [props.js]
// It then reads the files back the way the game does (assetPropsAll) and says how far any number moved (the files keep
// six decimal places).
const fs=require('fs'),path=require('path');
const A=require('./asset-format.js');
const file=process.argv[2]||path.join(A.ROOT,'src/js/dressing/props.js');
const s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
// (the colour names and the shelf and fridge makers above the table, then the table itself)
const i0=s.indexOf('const P_STEEL'),i1=s.indexOf('const PROPS={'),i2=s.indexOf('\n};',i1);
const PROPS=Function('const PT=-1,PG=0x1000000;'+s.slice(i0,i2+3)+'return PROPS;')();
// notes: the run of whole-line comments above a line, given to every key on the lines after it till the next comment
const notes={};let run=[],cur='';
for(const l of s.slice(i1,i2).split('\n').slice(1)){
  const m=l.match(/^\s*\/\/\s?(.*)$/);if(m){run.push(m[1]);continue;}
  if(run.length){cur=run.join(' ').replace(/\s+/g,' ').trim();run=[];}
  for(const k of l.matchAll(/(?:^\s*|,)([A-Za-z_]\w*):/g))if(k[1] in PROPS)notes[k[1]]=cur;
}
const order=Object.keys(PROPS),dir=path.join(A.ROOT,'src/assets/props');
fs.mkdirSync(dir,{recursive:true});
for(const k of order){const f=A.assetPropOf(PROPS[k]);fs.writeFileSync(path.join(dir,k+'.json'),A.fmt(notes[k]?{note:notes[k],...f}:f));}
fs.writeFileSync(path.join(dir,'_order.json'),A.fmt({order}));
const back=A.assetPropsAll(A.readAll());let worst=0,bad=[];
for(const k of order){const a=PROPS[k],b=back[k];if(!b||a.length!==b.length){bad.push(k);continue;}
  a.forEach((q,i)=>q.forEach((v,j)=>{const d=Math.abs(v-b[i][j]);if(d>worst)worst=d;if(j===0&&v!==b[i][j])bad.push(k);}));}
console.log('props',order.length,'without a note',order.filter(k=>!notes[k]).length,'| read back: furthest any number moved',worst,bad.length?'| WRONG: '+[...new Set(bad)].join(' '):'| colours all the same');
