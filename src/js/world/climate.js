// ---- climate: temperature and moisture, the fields the biomes are to be chosen from (docs/biomes-plan.md, section 4).
// Only the World Generator's Climate layer reads them so far: the game's world doesn't change by them yet ----
const CLIM={t:0,m:0};
// at block (x,z): t from cold 0 to hot 1, m from arid 0 to soaked 1. Broad, domain-warped fBm (gradient noise, so the
// same in every browser), its regions some 6 to 15 thousand blocks across. The answer goes in CLIM
function climateAt(x,z){
  const w=nzWarp(x,z,14000,3000,2101),wx=w[0],wz=w[1];
  CLIM.t=nzClamp01(0.5+0.85*nzFbm(wx,wz,18000,3,2203));
  CLIM.m=nzClamp01(0.5+0.85*nzFbm(wx+50000,wz-30000,13000,3,2311));
  return CLIM;
}
// the biome at block (x,z): grassland everywhere for now. (Not realmOf, world/coast.js, which says whether a plot is sea,
// city or plains)
const biomeAt=(x,z)=>'grassland';
