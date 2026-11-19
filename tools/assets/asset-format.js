// The tools' side of the asset files: loads src/js/core/assets.js on its own (as the editor does), so the tools read and
// write the files exactly as the game does. require('./asset-format.js') gives its functions, plus:
//   weaponToAsset(entry), clipToAsset(name,timeline): a table entry as it's written in a file
//   fmt(value): the file's text
//   readAll(): {weapons:{key:file...}, clips:{...}} in their _order.json order, as the build reads them
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..');
const ctx={THREE:{},JSON,Math,Object,Array,parseInt,isFinite,Set};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'src/js/core/assets.js'),'utf8')+
  '\n;this.X={ASSET_LAYOUTS,assetBox,assetBoxOf,assetWeapon,assetWeaponOf,assetClip,assetClipOf,assetWeaponsAll,assetClipsAll,assetFmt,assetCheck,assetPlace,assetList,ASSET_LISTS,assetPoseAt,assetChNames,assetProp,assetPropOf,assetPropsAll,assetFix,assetFixAll,assetMove,assetMoveOf,assetMovesAll,assetHbAll,assetHipAll,assetLayoutOf};',ctx);
const X=ctx.X;
function readAll(){
  const o={};for(const dir of ['weapons','clips','bodies','grips','props','fixtures','moves']){const D=path.join(ROOT,'src/assets',dir);
    const ord=JSON.parse(fs.readFileSync(path.join(D,'_order.json'),'utf8')).order;o[dir]={};
    for(const k of ord)o[dir][k]=JSON.parse(fs.readFileSync(path.join(D,k+'.json'),'utf8'));}
  return o;
}
module.exports={...X,weaponToAsset:X.assetWeaponOf,clipToAsset:X.assetClipOf,fmt:X.assetFmt,readAll,ROOT};
