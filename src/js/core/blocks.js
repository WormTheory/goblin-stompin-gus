// ---------- Blocks ----------
const AIR=0,GRASS=1,DIRT=2,STONE=3,LOG=4,LEAVES=5,SAND=6,PLANKS=7,GLASS=8,WATER=9,COBBLE=10,BRICK=11,
  ASPHALT=12,LINE=13,LINEX=14,SIDEWALK=15,CONCRETE=16,MOSSCON=17,METAL=18,RUST=19,WIN_BLUE=20,WIN_GREEN=21,WIN_WARM=22,ROOF=23,NEON_G=24,NEON_M=25,LAMP=26,MOSSSTONE=27,
  SHELF=28,BED=29,SOFA=30,SCREEN=31,CRATE=32,AWN_R=33,AWN_G=34,FLOWER=35,POLICE=36,NEON_B=37,NEON_R=38,GRAVEL=39,FLOORT=40,FRIDGE=41,LINE_R=42,LINEX_R=43,CROSS=44,CROSSX=45,
  HOSPW=46,HOSPX=47,PUMP=48,SHINGLE=49,SIDING=50,SIDING_Y=51,
  RAMP0=52,SEAT_B=64,SEAT_R=65,FIELD=66,FIELD_L=67,LANE=68,LANEX=69,CLAY=70,DEEPSLATE=71,BEDROCK=72,COAL=73,CRYSTAL=74,CHECKER=75,
  // brand paint for chain stores' walls, and two more neon colours
  PAINT_BLUE=76,PAINT_RED=77,PAINT_GREEN=78,PAINT_ORANGE=79,PAINT_YELLOW=80,PAINT_WHITE=81,PAINT_NAVY=82,STUCCO=83,PAINT_DARK=84,NEON_Y=85,NEON_O=86,ICE=87,
  RAMPL0=88,   // ramps with road markings: 3 kinds (yellow centre line, white edge of the other carriageway, dashed lane line) x 4 x 3, up to 123
  // doors (walk-through panels in a doorway: wooden house doors, glass shop doors, big barn doors) and yard fences
  DOOR_W=124,DOOR_WK=125,DOOR_G=126,DOOR_GB=127,DOOR_BARN=128,FENCE=129,FENCE_W=130,
  // monuments: white marble and green-bronze statuary
  MARBLE=131,BRONZE=132,
  // courts and cemeteries, church glass, a bank's gold
  COURT=133,COURT_L=134,CHAINLINK=135,GRAVE=136,GRAVEX=137,STAINED=138,GOLD=139,
  STAIR0=140,   // stairs: 3 materials (concrete, steel, wood) x 4 directions, up to 151
  RAILPOST=152;   // a slim steel post (the bars between posts are drawn as fixtures)
// ramps: 4 directions (the way it rises: +x, -x, +z, -z) x 3 shapes (a full 0->1 slope, or the low and high halves
// of a gentle slope that takes two blocks to climb one). rampId(dir,kind)
const stairId=(dir,mat)=>STAIR0+(mat||0)*4+dir,rampId=(dir,kind)=>RAMP0+dir*3+kind,rampLineId=(dir,kind,t)=>RAMPL0+t*12+dir*3+kind;
const BLOCK=[];
BLOCK[AIR]      ={};
BLOCK[GRASS]    ={tiles:[0,2,1],solid:true};
BLOCK[DIRT]     ={tiles:[2,2,2],solid:true};
BLOCK[STONE]    ={tiles:[3,3,3],solid:true};
BLOCK[LOG]      ={tiles:[5,5,4],solid:true};
BLOCK[LEAVES]   ={tiles:[6,6,6],solid:true,transparent:true};
BLOCK[SAND]     ={tiles:[7,7,7],solid:true};
BLOCK[PLANKS]   ={tiles:[8,8,8],solid:true};
BLOCK[GLASS]    ={tiles:[9,9,9],solid:true,transparent:true};
BLOCK[WATER]    ={tiles:[10,10,10],liquid:true,transparent:true};
BLOCK[COBBLE]   ={tiles:[11,11,11],solid:true};
BLOCK[BRICK]    ={tiles:[12,12,12],solid:true};
BLOCK[ASPHALT]  ={tiles:[13,13,13],solid:true};
BLOCK[LINE]     ={tiles:[14,13,13],solid:true};
BLOCK[LINEX]    ={tiles:[28,13,13],solid:true};
BLOCK[SIDEWALK] ={tiles:[15,16,16],solid:true};
BLOCK[CONCRETE] ={tiles:[16,16,16],solid:true};
BLOCK[MOSSCON]  ={tiles:[16,16,17],solid:true};
BLOCK[METAL]    ={tiles:[18,18,18],solid:true};
BLOCK[RUST]     ={tiles:[19,19,19],solid:true};
BLOCK[WIN_BLUE] ={tiles:[18,18,20],solid:true};
BLOCK[WIN_GREEN]={tiles:[16,16,21],solid:true,glow:true};
BLOCK[WIN_WARM] ={tiles:[16,16,22],solid:true,glow:true};
BLOCK[ROOF]     ={tiles:[23,23,23],solid:true};
BLOCK[NEON_G]   ={tiles:[24,24,24],solid:true,glow:true};
BLOCK[NEON_M]   ={tiles:[25,25,25],solid:true,glow:true};
BLOCK[LAMP]     ={tiles:[26,26,26],solid:true,glow:true};
BLOCK[MOSSSTONE]={tiles:[27,27,27],solid:true};
BLOCK[SHELF]    ={tiles:[8,8,29],solid:true};
BLOCK[BED]      ={tiles:[30,8,31],solid:true};
BLOCK[SOFA]     ={tiles:[31,31,31],solid:true};
BLOCK[SCREEN]   ={tiles:[18,18,32],solid:true,glow:true};
BLOCK[CRATE]    ={tiles:[33,33,33],solid:true};
BLOCK[AWN_R]    ={tiles:[34,34,34],solid:true};
BLOCK[AWN_G]    ={tiles:[35,35,35],solid:true};
BLOCK[FLOWER]   ={tiles:[36,2,36],solid:true};
BLOCK[POLICE]   ={tiles:[37,37,37],solid:true};
BLOCK[NEON_B]   ={tiles:[38,38,38],solid:true,glow:true};
BLOCK[NEON_R]   ={tiles:[39,39,39],solid:true,glow:true};
BLOCK[GRAVEL]   ={tiles:[40,40,40],solid:true};
BLOCK[FLOORT]   ={tiles:[41,16,16],solid:true};
BLOCK[FRIDGE]   ={tiles:[42,42,42],solid:true};
// the double yellow centre line: each half hugs the shared edge so the two stripes sit close together
BLOCK[LINE_R]   ={tiles:[43,13,13],solid:true};
BLOCK[LINEX_R]  ={tiles:[44,13,13],solid:true};
BLOCK[CROSS]    ={tiles:[45,13,13],solid:true};
BLOCK[CROSSX]   ={tiles:[46,13,13],solid:true};
// hospitals, gas stations, houses
BLOCK[HOSPW]    ={tiles:[47,47,47],solid:true};
BLOCK[HOSPX]    ={tiles:[47,47,48],solid:true,glow:true};
BLOCK[PUMP]     ={tiles:[18,18,49],solid:true};
BLOCK[SHINGLE]  ={tiles:[50,50,50],solid:true};
BLOCK[SIDING]   ={tiles:[8,8,51],solid:true};
BLOCK[SIDING_Y] ={tiles:[8,8,52],solid:true};
for(let d=0;d<4;d++)for(let k=0;k<3;k++)BLOCK[rampId(d,k)]={tiles:[13,13,16],solid:true,transparent:true,ramp:{dir:d,h0:k===2?0.5:0,h1:k===1?0.5:1}};
// (the line tiles run along the slope: the along-x versions for ramps rising in x)
for(let t=0;t<3;t++)for(let d=0;d<4;d++)for(let k=0;k<3;k++)BLOCK[rampLineId(d,k,t)]={tiles:[(d<2?[28,44,58]:[14,43,57])[t],13,16],solid:true,transparent:true,ramp:{dir:d,h0:k===2?0.5:0,h1:k===1?0.5:1}};
// stairs: underfoot they're a smooth slope, like a ramp, so nothing has to hop up them; they're only drawn as steps
for(let m=0;m<3;m++)for(let d=0;d<4;d++)BLOCK[stairId(d,m)]={tiles:[[15,16,16],[18,18,18],[8,8,8]][m],solid:true,transparent:true,stair:true,ramp:{dir:d,h0:0,h1:1}};
BLOCK[RAILPOST]={tiles:[18,18,18],solid:true,transparent:true,brittle:true,thin:0.07,post:true};
// football stadium
BLOCK[SEAT_B]   ={tiles:[53,16,53],solid:true};
BLOCK[SEAT_R]   ={tiles:[54,16,54],solid:true};
BLOCK[FIELD]    ={tiles:[55,2,1],solid:true};
BLOCK[FIELD_L]  ={tiles:[56,2,1],solid:true};
// white lane dividers on the highways: the stripe hugs the block's edge so it sits right on the lane boundary
BLOCK[LANE]     ={tiles:[57,13,13],solid:true};
BLOCK[LANEX]    ={tiles:[58,13,13],solid:true};
// the ground's layers, top to bottom: dirt, clay, a gravel seam, stone (with coal), deepslate (with glowing crystals), bedrock
BLOCK[CLAY]     ={tiles:[59,59,59],solid:true};
BLOCK[DEEPSLATE]={tiles:[60,60,60],solid:true};
BLOCK[BEDROCK]  ={tiles:[61,61,61],solid:true};
BLOCK[COAL]     ={tiles:[62,62,62],solid:true};
BLOCK[CRYSTAL]  ={tiles:[63,63,63],solid:true,glow:true};
BLOCK[CHECKER]  ={tiles:[64,64,64],solid:true};
[PAINT_BLUE,PAINT_RED,PAINT_GREEN,PAINT_ORANGE,PAINT_YELLOW,PAINT_WHITE,PAINT_NAVY,STUCCO,PAINT_DARK].forEach((b,i)=>{BLOCK[b]={tiles:[65+i,65+i,65+i],solid:true};});
BLOCK[NEON_Y]   ={tiles:[74,74,74],solid:true,glow:true};
BLOCK[NEON_O]   ={tiles:[75,75,75],solid:true,glow:true};
BLOCK[ICE]      ={tiles:[76,76,76],solid:true};   // a frozen top layer of water, in winter
// doorways: invisible markers that nothing bumps into -- the doors themselves are real hinged (or sliding) doors drawn
// over them, that open as anyone comes up to them (see the doors, further on). Smash the doorway and the door goes.
BLOCK[DOOR_W]   ={tiles:[8,8,77],transparent:true,door:true,hide:true};
BLOCK[DOOR_WK]  ={tiles:[8,8,78],transparent:true,door:true,hide:true};
BLOCK[DOOR_G]   ={tiles:[18,18,82],transparent:true,door:true,hide:true};
BLOCK[DOOR_GB]  ={tiles:[18,18,83],transparent:true,door:true,hide:true};
BLOCK[DOOR_BARN]={tiles:[8,8,84],transparent:true,door:true,hide:true};
// fences round the yards: a white picket fence (knee high) and tall board fences between back gardens. Solid, but
// they give way under a hippo (see trampleFences)
BLOCK[FENCE]    ={tiles:[85,85,85],solid:true,transparent:true,brittle:true,thin:0.07};
BLOCK[FENCE_W]  ={tiles:[86,86,86],solid:true,transparent:true,brittle:true,thin:0.09};
BLOCK[MARBLE]   ={tiles:[87,87,87],solid:true};
BLOCK[BRONZE]   ={tiles:[88,88,88],solid:true};
BLOCK[COURT]    ={tiles:[89,2,89],solid:true};
BLOCK[COURT_L]  ={tiles:[90,2,89],solid:true};
BLOCK[CHAINLINK]={tiles:[91,91,91],solid:true,transparent:true,brittle:true,thin:0.05};
BLOCK[GRAVE]    ={tiles:[92,92,92],solid:true,transparent:true,brittle:true,thin:0.11};
BLOCK[GRAVEX]   ={tiles:[93,93,93],solid:true,transparent:true,brittle:true,thin:0.09};
BLOCK[STAINED]  ={tiles:[94,94,94],solid:true,transparent:true,glow:true};
BLOCK[GOLD]     ={tiles:[95,95,95],solid:true,glow:true};
// height of a ramp's surface above its block's base at (fx,fz) within the block (0..1 each)
function rampH(b,fx,fz){const R=BLOCK[b].ramp,t=R.dir===0?fx:R.dir===1?1-fx:R.dir===2?fz:1-fz;return R.h0+(R.h1-R.h0)*Math.max(0,Math.min(1,t));}

