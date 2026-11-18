// One-time migration (kept for reference): reads the WEAPONS and STRIKES tables as they were written in
// src/js/enemies/weapons.js and strikes.js and writes them out as asset files, src/assets/weapons/*.json and
// src/assets/clips/*.json, with each entry's comment carried over as its note. Run from the repo root:
//   node tools/assets/extract_weapons.js [weapons.js] [strikes.js]
// (The paths default to the source files; pass old copies to extract from them.) golden.js then proves the game builds
// exactly the same tables from the files.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..','..');
const wf=process.argv[2]||path.join(ROOT,'src/js/enemies/weapons.js'),sf=process.argv[3]||path.join(ROOT,'src/js/enemies/strikes.js');
const A=require('./asset-format.js');
// the literal `const NAME={...};` and, for each of its top-level keys, the comment lines just above it
function table(file,name){
  const s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),i=s.indexOf('const '+name+'={');if(i<0)throw new Error(name+' not in '+file);
  let d=0,j=s.indexOf('{',i);const st=j;
  for(;j<s.length;j++){const c=s[j];if(c==='{'||c==='[')d++;else if(c==='}'||c===']'){d--;if(!d)break;}
    else if(c==="'"||c==='"'){const q=c;j++;while(s[j]!==q){if(s[j]===String.fromCharCode(92))j++;j++;}}
    else if(c==='/'&&s[j+1]==='/'){while(s[j]!=='\n')j++;}}
  const lit=s.slice(st,j+1),obj=Function('return '+lit)();
  // (comments: a run of whole-line // comments straight before a line starting "  key:")
  const notes={},L=lit.split('\n');let run=[];
  for(const l of L){const m=l.match(/^\s*\/\/\s?(.*)$/);if(m){run.push(m[1]);continue;}
    const k=l.match(/^  ([A-Za-z_]\w*):/);if(k&&run.length)notes[k[1]]=run.join(' ').replace(/\s+/g,' ').trim();run=[];}
  return {obj,notes};
}
const W=table(wf,'WEAPONS'),S=table(sf,'STRIKES');
const out=path.join(ROOT,'src/assets');
for(const d of ['weapons','clips'])fs.mkdirSync(path.join(out,d),{recursive:true});
const order=Object.keys(W.obj);
for(const k of order){const e=A.weaponToAsset(W.obj[k]);if(W.notes[k])e.note=W.notes[k];
  fs.writeFileSync(path.join(out,'weapons',k+'.json'),A.fmt({note:e.note,...e}));}
fs.writeFileSync(path.join(out,'weapons','_order.json'),A.fmt({order}));
const corder=Object.keys(S.obj);
for(const k of corder){const c=A.clipToAsset(k,S.obj[k]);if(S.notes[k])c.note=S.notes[k];
  fs.writeFileSync(path.join(out,'clips',k+'.json'),A.fmt({note:c.note,...c}));}
fs.writeFileSync(path.join(out,'clips','_order.json'),A.fmt({order:corder}));
console.log('weapons',order.length,'clips',corder.length);
