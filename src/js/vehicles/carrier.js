// ---- The aircraft carrier (Testing Environment only for now): a Nimitz-style supercarrier at three-quarters of the real
// size, 178 blocks from stern to bow and 40 across the flight deck, kept as a ship with insides (ships.js). Its blocks are
// painted once into a grid of their own (cvBuild), which its pocket's chunks read. Top to bottom:
//   the island on the starboard edge: flight deck control, the flag bridge, the navigation bridge (with the helm) and
//     Pri-Fly, the glassed-in top storey, then the roof and the mast
//   the flight deck (G+16): the angled landing strip with its arresting wires, catapult tracks, hatches down
//   the gallery deck under it (G+12 to G+15): ready rooms, the paraloft, the wardroom, catapult machinery, berths
//   the hangar (G+6 to G+10): one long bay split in three by fire doors, open to the sea where the elevators would be,
//     and the forecastle at the bow
//   the lower deck (G+1 to G+4, just above the waterline): the mess deck, galley, sick bay, the Goblin Intelligence
//     Centre, berthing, the armoury, the reactor room and the stores
//   and under the water a solid hull (nothing aboard is below the waterline, so the sea never shows through a room).
// A swimmer climbs out on to the stern's landing, under the overhang of the flight deck, and goes in by the stern door.
// s runs across the ship to starboard (s = -u: facing the bow, the pocket's +x is to port), w from stern to bow. ----
const CV_Y0=G-8,CV_Y1=G+48,CV_U0=-18,CV_U1=21,CV_W0=-89,CV_W1=88,CV_NU=CV_U1-CV_U0+1,CV_NW=CV_W1-CV_W0+1;
let CV_GRID=null;
// the hull's half width at w (it narrows to the bow), and the furthest out a room reaches across it
const cvHW=w=>w<=50?13:13-(w-50)*11/38,cvIn=w=>Math.floor(cvHW(w))-1;
// the flight deck's outline: wider than the hull, with the angled deck's sponson out to port amidships, the island's out
// to starboard, and a taper to the bow
function cvDeck(s,w){
  if(w<CV_W0||w>CV_W1)return false;let pe=-16,se=16;
  if(w>=-55&&w<=30)pe=w<-45?-16-(w+55)*0.5:w>20?-21+(w-20)*0.5:-21;
  if(w>=-32&&w<=8)se=w<-30?16+(w+32):w>6?18-(w-6):18;
  if(w>70){const k=(w-70)*0.55;pe=Math.max(pe,-16+k);se=Math.min(se,16-k);}
  return s>=pe-1e-6&&s<=se+1e-6;
}
// the angled deck's centre line, about 9 degrees off to port
const cvAng=w=>-3-(w+89)*0.16;
function cvSet(s,y,w,b){const u=-s;if(u<CV_U0||u>CV_U1||w<CV_W0||w>CV_W1||y<CV_Y0||y>CV_Y1)return;CV_GRID[((y-CV_Y0)*CV_NW+(w-CV_W0))*CV_NU+(u-CV_U0)]=b;}
function cvGet(s,y,w){const u=-s;if(u<CV_U0||u>CV_U1||w<CV_W0||w>CV_W1||y<CV_Y0||y>CV_Y1)return 0;return CV_GRID[((y-CV_Y0)*CV_NW+(w-CV_W0))*CV_NU+(u-CV_U0)];}
function cvBox(s0,s1,y0,y1,w0,w1,b){for(let s=s0;s<=s1;s++)for(let y=y0;y<=y1;y++)for(let w=w0;w<=w1;w++)cvSet(s,y,w,b);}
// a block of the carrier (shipChunk), from the grid, painted the first time it's asked for
function carrierBlock(u,y,w){
  if(!CV_GRID)cvBuild();
  if(u<CV_U0||u>CV_U1||w<CV_W0||w>CV_W1||y<CV_Y0||y>CV_Y1)return 0;
  return CV_GRID[((y-CV_Y0)*CV_NW+(w-CV_W0))*CV_NU+(u-CV_U0)];
}
// a flight of steel stairs, two wide or more (Gus is broad), rising toward the bow from a floor at y0 to the one n above:
// the floor above cut away over it for headroom, and a rail round that hole up there (not across its low end when another
// flight carries on up from there: that's the next flight's way on)
function cvStair(s0,s1,w0,n,y0,end){
  for(let s=s0;s<=s1;s++){
    for(let k=0;k<n;k++){const w=w0+k,y=y0+1+k;cvSet(s,y,w,stairId(2,1));for(let yy=y+1;yy<y0+n;yy++)cvSet(s,yy,w,0);if(k<n-1)cvSet(s,y0+n,w,0);}
    for(let y=y0+1;y<y0+n;y++)cvSet(s,y,w0-1,0);   // (room to step on at the bottom)
    for(let y=y0+n+1;y<y0+n+5;y++)cvSet(s,y,w0+n,0);}   // (and off at the top)
  const R=(s,w)=>{if(!cvGet(s,y0+n+1,w)&&cvGet(s,y0+n,w))cvSet(s,y0+n+1,w,FENCE);};
  for(let w=w0;w<=w0+n-2;w++){R(s0-1,w);R(s1+1,w);}
  if(end)for(let s=s0;s<=s1;s++)R(s,w0-1);
}
// how far out from the corridor a room reaches at w (the last open block, looking out from |s|=3), on side sg (1 starboard)
function cvOut(sg,w,y){let a=3;while(a<24&&!cvGet(sg*(a+1),y,w))a++;return a;}
// a room's furniture, made of the game's furniture blocks: sg the side (1 starboard, -1 port), w0..w1 its length, y0 its
// floor, wb the bulkhead at its forward end (screens go on it)
function cvRoom(kind,sg,w0,w1,y0){
  const S=a=>sg*a,y1=y0+1;
  for(let w=w0;w<=w1;w++){const o=cvOut(sg,w,y1),i=w-w0,n=w1-w0;
    if(kind==='bunks'){if(i%4!==3)for(const a of [o,o-1]){cvSet(S(a),y1,w,BED);cvSet(S(a),y1+2,w,BED);}if(i%2===0&&Math.abs(i-n/2)>2)cvSet(S(3),y1,w,SHELF);}
    else if(kind==='galley'){cvSet(S(o),y1,w,i%2?SHELF:FRIDGE);cvSet(S(o),y1+1,w,i%2?SHELF:FRIDGE);if(i>1&&i<n-1)cvSet(S(6),y1,w,PLANKS);}
    else if(kind==='sick'){for(let a=3;a<=o;a++)cvSet(S(a),y0,w,HOSPW);if(i%3===1)cvSet(S(o),y1,w,BED);if(i%3===1&&o>7)cvSet(S(o-4),y1,w,BED);}
    else if(kind==='intel'){for(let a=3;a<=o;a++)cvSet(S(a),y0,w,PAINT_NAVY);cvSet(S(o),y1,w,SCREEN);cvSet(S(o),y1+1,w,SCREEN);cvSet(S(o),y1+2,w,NEON_B);if(i%3===1&&i<n)cvSet(S(6),y1,w,SCREEN);}
    else if(kind==='armory'){cvSet(S(o),y1,w,SHELF);cvSet(S(o),y1+1,w,SHELF);cvSet(S(o),y1+2,w,SHELF);if(i>1&&i<n-1&&i%3!==0)cvSet(S(6),y1,w,CRATE);}
    else if(kind==='lounge'){cvSet(S(o),y1,w,SOFA);if(i>2&&i<n-2&&i%4===0)cvSet(S(6),y1,w,PLANKS);}
    else if(kind==='reactor'){for(let a=3;a<=o;a++)cvSet(S(a),y0,w,PAINT_YELLOW);   // (the core: a glowing column in a glass case, steel at the corners and on top)
      if(i>=3&&i<=n-3)for(let a=6;a<=8;a++)for(let y=y1;y<y0+5;y++){const edge=(a!==7)+(i===3||i===n-3);cvSet(S(a),y,w,y===y0+4||edge===2?METAL:edge?GLASS:NEON_G);}}
    else if(kind==='store'){if(i>0&&i<n)for(let a=5;a<=o;a++)if((a+w)%3!==0){cvSet(S(a),y1,w,CRATE);if((a*7+w)%4===0)cvSet(S(a),y1+1,w,CRATE);}}
    else if(kind==='ready'){if(i%2===1&&i<n)for(let a=4;a<o;a++)cvSet(S(a),y1,w,SEAT_B);}
    else if(kind==='paraloft'){cvSet(S(o),y1,w,SHELF);cvSet(S(o),y1+1,w,SHELF);if(i>1&&i<n-1&&i!==Math.floor(n/2))for(let y=y1;y<y1+2;y++)cvSet(S(6),y,w,SHELF);}
    else if(kind==='wardroom'){cvSet(S(o),y1,w,SOFA);if(i>2&&i<n-2)cvSet(S(7),y1,w,PLANKS);}
    else if(kind==='machine'){if(i>0&&i<n)for(let a=5;a<=Math.min(7,o-1);a++){cvSet(S(a),y1,w,i%5===2?RUST:METAL);if(a===6)cvSet(S(a),y1+1,w,METAL);}}
    else if(kind==='office'){if(i%2===0){cvSet(S(o),y1,w,SCREEN);cvSet(S(o-1),y1,w,SEAT_B);}}}
  // (a ready room's screen, the sick bay's red cross: on the bulkhead at the forward end)
  if(kind==='ready'||kind==='wardroom')for(let a=5;a<=8;a++)for(let y=y1+1;y<=y1+2;y++)if(cvGet(S(a),y,w1+1))cvSet(S(a),y,w1+1,SCREEN);
  if(kind==='sick')for(let a=5;a<=7;a++)if(cvGet(S(a),y1+2,w1+1))cvSet(S(a),y1+2,w1+1,a===6?HOSPX:HOSPW);
}
// rooms along a deck: bulkheads across at each of B (a gap down the middle for the corridor), corridor walls at s=+-2 from
// c0 to c1 with a door into each room, and each room's kind, port then starboard
function cvDeckRooms(y0,B,c0,c1,R){
  const y1=y0+1,y4=y0+4,inner=w=>{let a=0;while(a<24&&!cvGet(a+1,y1,w))a++;let b=0;while(b<24&&!cvGet(-b-1,y1,w))b++;return[-b,a];};
  for(const w of B){const [lo,hi]=inner(w);for(let s=lo;s<=hi;s++)if(Math.abs(s)>1)cvBox(s,s,y1,y4,w,w,PAINT_WHITE);}
  for(let w=c0;w<=c1;w++)if(!B.includes(w))for(const s of [-2,2])cvBox(s,s,y1,y4,w,w,PAINT_WHITE);
  for(let i=0;i+1<B.length;i++){const a=B[i]+1,b=B[i+1]-1;if(a<c0||b>c1)continue;const m=Math.round((a+b)/2);for(const s of [-2,2])cvBox(s,s,y1,y4,m-1,m+1,0);
    const k=R[i];if(k){if(k[0])cvRoom(k[0],-1,a,b,y0);if(k[1])cvRoom(k[1],1,a,b,y0);}}
}
function cvBuild(){
  CV_GRID=new Uint8Array(CV_NU*CV_NW*(CV_Y1-CV_Y0+1));
  // the hull, solid to start with (narrowing a little toward the keel), and the gallery deck and flight deck over it
  for(let w=-86;w<=CV_W1;w++)for(let y=G-6;y<=G+10;y++){const hw=cvHW(w)-(y<G?(G-1-y)*0.5:0);for(let s=-13;s<=13;s++)if(Math.abs(s)<=hw)cvSet(s,y,w,METAL);}
  for(let w=CV_W0;w<=CV_W1;w++)for(let s=-21;s<=18;s++)if(cvDeck(s,w))for(let y=G+11;y<=G+16;y++)cvSet(s,y,w,y===G+16?ASPHALT:METAL);
  // the lower deck and the hangar hollowed out of it (the hangar's forward bulkhead at 49, the forecastle past it)
  for(let w=-85;w<=60;w++){const n=cvIn(w);for(let s=-n;s<=n;s++){cvSet(s,G,w,FLOORT);cvBox(s,s,G+1,G+4,w,w,0);}}
  for(let w=-85;w<=70;w++){if(w===49)continue;const n=cvIn(w);for(let s=-n;s<=n;s++){cvSet(s,G+5,w,w<49&&s===0?PAINT_YELLOW:PAINT_DARK);cvBox(s,s,G+6,G+10,w,w,0);}}
  cvBox(-2,2,G+6,G+9,49,49,0);
  // the gallery deck: everything under the flight deck but its outer skin
  for(let w=CV_W0+1;w<CV_W1;w++)for(let s=-20;s<=17;s++)if(cvDeck(s,w)&&cvDeck(s-1,w)&&cvDeck(s+1,w)&&cvDeck(s,w-1)&&cvDeck(s,w+1)){cvSet(s,G+11,w,FLOORT);cvBox(s,s,G+12,G+15,w,w,0);}
  // ways in and out: the stern door off the landing, the hangar's stern opening and the elevator bays down its sides
  // (railed at the floor: look out to sea, or jump), portholes along the lower deck, windows in the gallery's stern
  cvBox(-2,2,G+1,G+4,-86,-86,0);
  const bay=(s,w0,w1)=>{cvBox(s,s,G+6,G+10,w0,w1,0);cvBox(s,s,G+6,G+6,w0,w1,FENCE);};
  bay(13,15,27);bay(13,31,43);bay(13,-50,-38);bay(-13,-62,-50);
  cvBox(-6,6,G+6,G+10,-86,-86,0);cvBox(-6,6,G+6,G+6,-86,-86,FENCE);
  for(let w=-82;w<=50;w+=8)for(const s of [-13,13])cvBox(s,s,G+2,G+3,w,w,GLASS);
  for(let s=-12;s<=12;s+=4)cvBox(s,s+1,G+13,G+14,CV_W0,CV_W0,GLASS);
  // the swim landing at the stern: a step just under the water, another, then level with the lower deck's floor
  for(let s=-6;s<=6;s++){cvSet(s,G-2,-89,METAL);cvBox(s,s,G-2,G-1,-88,-88,METAL);cvBox(s,s,G-2,G,-87,-87,METAL);}
  // the hangar's fire doors (open), dividing it into three bays
  for(const w of [-30,10])for(const s of [-12,-11,-10,-9,9,10,11,12])cvBox(s,s,G+6,G+10,w,w,METAL);
  // the lower deck's rooms: the stern lobby, the mess deck across the whole ship, then rooms either side of a corridor
  cvDeckRooms(G,[-72,-58,-46,-34,-22,-10,2,14,26,38,50],-57,49,[null,['galley','galley'],['sick','intel'],['bunks','bunks'],['bunks','bunks'],['bunks','lounge'],['bunks','bunks'],['armory','lounge'],['reactor','reactor'],['store','store']]);
  for(let w=-71;w<=-59;w++){const n=cvIn(w);for(let s=-n;s<=n;s++)cvSet(s,G,w,CHECKER);}
  for(const w of [-69,-65,-61])for(const sg of [-1,1])for(let a=3;a<=10;a++){cvSet(sg*a,G+1,w,PLANKS);cvSet(sg*a,G+1,w-1,SEAT_B);cvSet(sg*a,G+1,w+1,SEAT_B);}
  // the gallery deck's: arresting gear machinery right aft, then rooms either side of a corridor, and a store in the bow
  cvDeckRooms(G+11,[-75,-63,-51,-39,-27,-15,-3,9,21,33,45,57,69,79],-75,79,[['ready','ready'],['paraloft','ready'],['wardroom','bunks'],['ready','store'],['machine','office'],['machine','office'],['machine','bunks'],['store','bunks'],['paraloft','wardroom'],['machine','machine'],['machine','machine'],['store',null],['store','store']]);
  for(let w=-87;w<=-77;w++)if(w%3===0)for(const sg of [-1,1])for(let a=4;a<=6;a++){cvSet(sg*a,G+12,w,METAL);cvSet(sg*a,G+13,w,RUST);}
  // the island: four storeys and a roof, on the starboard edge just aft of amidships
  cvBox(12,18,G+17,G+36,-22,-4,METAL);
  for(const f of [G+16,G+21,G+26,G+31]){cvBox(13,17,f+1,f+4,-21,-5,0);if(f>G+16)cvBox(13,17,f,f,-21,-5,FLOORT);
    const top=f===G+31?f+4:f+3;   // (Pri-Fly, the top storey: glass from waist height up)
    for(let y=f+2;y<=top;y++){for(let w=-20;w<=-6;w++)cvSet(12,y,w,GLASS);for(let s=13;s<=17;s++){cvSet(s,y,-4,GLASS);cvSet(s,y,-22,GLASS);}for(let w=-18;w<=-8;w+=5)cvSet(18,y,w,GLASS);}}
  cvBox(13,17,G+16,G+16,-21,-5,FLOORT);cvBox(12,12,G+17,G+20,-13,-11,0);   // (its floor indoors, and its door, facing the deck)
  cvBox(14,15,G+17,G+17,-9,-7,SCREEN);cvSet(13,G+17,-8,SEAT_B);   // (flight deck control: the 'Ouija board' of the deck's planes)
  for(let w=-12;w<=-8;w++)cvSet(17,G+22,w,SOFA);cvBox(13,14,G+22,G+22,-5,-5,SCREEN);   // (the flag bridge)
  cvBox(14,15,G+27,G+27,-5,-5,SCREEN);cvSet(17,G+27,-7,SEAT_R);cvBox(13,13,G+27,G+27,-11,-10,PLANKS);   // (the navigation bridge: the helm, the captain's chair, the chart table)
  for(let w=-12;w<=-6;w+=2)cvSet(13,G+32,w,SEAT_B);   // (Pri-Fly: the Air Boss's seats along the windows over the deck)
  for(let w=-22;w<=-4;w++)for(let s=12;s<=18;s++)if(s===12||s===18||w===-22||w===-4)cvSet(s,G+37,w,FENCE);
  cvBox(15,15,G+37,G+46,-12,-12,METAL);cvBox(13,17,G+43,G+43,-12,-12,METAL);cvBox(14,16,G+47,G+47,-13,-11,PAINT_DARK);
  // the flight deck's markings: the angled landing strip's centre line and edges, its four arresting wires, the
  // catapult tracks (two at the bow, two in the waist), the bow's centre line
  for(let w=CV_W0;w<=CV_W1;w++)for(let s=-21;s<=18;s++){if(cvGet(s,G+16,w)!==ASPHALT)continue;const c=cvAng(w);let b=0;
    if(w<=12&&Math.abs(s-c)<0.5)b=(w&3)<2?PAINT_WHITE:0;
    else if(w<=12&&(Math.abs(s-c-9)<0.5||Math.abs(s-c+9)<0.5))b=PAINT_YELLOW;
    if([-70,-66,-62,-58].includes(w)&&Math.abs(s-c)<=7)b=METAL;
    if((s===-5||s===5)&&w>=36&&w<=86)b=METAL;
    if(w>=-24&&w<=8&&(Math.abs(s-c-3)<0.5||Math.abs(s-c+3)<0.5))b=METAL;
    if(s===0&&w>=16&&(w&3)<2)b=PAINT_WHITE;
    if(b)cvSet(s,G+16,w,b);}
  // the stairs: lower deck to hangar (aft and forward), hangar to gallery deck, gallery deck up through hatches to the
  // flight deck, and up through the island's storeys to its roof
  cvStair(9,10,-84,5,G,true);cvStair(-8,-7,52,5,G,true);
  cvStair(-11,-10,-84,6,G+5,true);cvStair(6,7,58,6,G+5,true);
  cvStair(10,11,-80,5,G+11,true);cvStair(10,11,64,5,G+11,true);
  for(const f of [G+16,G+21,G+26,G+31])cvStair(16,17,-19,5,f,f===G+31);
}
// what the carrier's pieces are, from outside (ships.js shipBoxes): the hull, the flight deck, the island. u0,u1,w0,w1,y0,y1
SHIP_KINDS.carrier={name:'aircraft carrier',u0:CV_U0,u1:CV_U1,w0:CV_W0,w1:CV_W1,y0:CV_Y0,y1:CV_Y1,block:carrierBlock,
  helm:[-14,G+27,-5.5],hy:24,top:8,acc:0.08,turn:0.07,hp:3000,sc:25000,sink:56,
  boxes:[[-13,13,-86,88,G-6,G+11],[CV_U0,CV_U1,CV_W0,CV_W1,G+11,G+17],[-18,-12,-22,-4,G+17,G+37]]};
