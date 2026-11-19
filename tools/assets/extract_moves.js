// one-off: the hippos' moves (DEV_ABIL in src/js/player/hitboxes.js, as it was) written out as src/assets/moves/*.json,
// then read back through assetMove to prove the game's table is the same
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),A=require('./asset-format.js');
const src=fs.readFileSync(process.argv[2]||path.join(ROOT,'src/js/player/hitboxes.js'),'utf8');
const i=src.indexOf('const DEV_ABIL=['),j=src.indexOf('\n];',i)+3;
const ctx={};vm.createContext(ctx);vm.runInContext(src.slice(i,j).replace('const DEV_ABIL=','this.D='),ctx);
const D=ctx.D,dir=path.join(ROOT,'src/assets/moves');
for(const m of D)fs.writeFileSync(path.join(dir,m.k+'.json'),A.fmt(A.assetMoveOf(m)));
fs.writeFileSync(path.join(dir,'_order.json'),JSON.stringify({order:D.map(m=>m.k)},null,2)+'\n');
const back=A.assetMovesAll(A.readAll());
console.log('moves',D.length,JSON.stringify(back)===JSON.stringify(D)?'same':'DIFFERENT');
