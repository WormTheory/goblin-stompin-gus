// ---- flying sites: the big airport (16 x 8 blocks) and the country airfield (4 x 2). Their ground, laid out in the site's
// own coordinates (U along x, V along z, from the site's corner), and the buildings on it (airportBuildings,
// airfieldBuildings: city-plan.js adds the ones that fall on each block). Their planes are in vehicles/airfields.js ----
//
// The airport (16 x 8 blocks), as laid out with the city to its south (B.flip: the city's to its north, and it's all
// mirrored north to south): the runway along the far side, the parallel taxiway, then the apron with six gates, each an
// airliner parked nose-in at a jet bridge from the terminal: six terminal halls in a row (check-in, security, the gate
// lounge), joined by glass links. Two more airliners come and go from the remote stands at the west end of the apron.
// The control tower beside the terminal, hangars, the fuel farm and the cargo shed to the east; landside the drop-off
// road along the front of the halls, the car park, and the road in through the gate, which carries straight on as the
// city street it meets (B.i: how many blocks along from the site's west side that street is)
const AP={W:512,H:256,gates:[112,144,176,208,240,272],stands:[24,52],gateV:80,taxi:45.5,rwy:18.5,term:{z0:98,z1:124},tower:[300,104]};
// (where a spot in the site's own layout really is: mirrored when the city's to the north)
const apV=(B,v)=>B.flip?AP.H-v:v,apYaw=(B,h)=>B.flip?Math.PI-h:h;
// ---- where the airports go: one at most to each city, just outside it, where one of its streets comes to an end at the
// edge of town and there's room for all of it on open plains (searched once per city, nearest the middle first) ----
let apBusy=0;const apAtC=new Map();
function airportOf(S){
  if(S.ap!==undefined)return S.ap;
  while(!apStep(S)){}
  return S.ap;
}
// (The search asks hundreds of blocks round the city about the sea, the railways, the roads, the rivers and the farms, and
// the first time that's 100 ms and more at a stroke: most cities have no room for one, and every spot is tried. So it's
// written to be done a millisecond at a time: whoever goes over places ahead of time (planAhead, the far rings' farPlan,
// through apAhead) gives it a slice a turn, and whoever needs the answer now (airportOf) runs what's left of it there
// and then. It comes out the same either way: nothing it asks depends on where any airport is, bar the ones of the
// cities ahead of it in the order, which are always finished first.)
// One slice of city S's search; true once it's done (S.ap: the airport, or null).
// (While a slice runs, S.ap is null and apBusy is up, as they always were all through the search: anything it asks that
// comes back round to this city is told "none yet", and nothing worked out meanwhile is kept, see airportAt. Between
// slices S.ap is undefined again: not searched yet, to anyone who asks.)
function apStep(S){
  if(S.ap!==undefined)return true;
  if(!S.apJ)S.apJ=apJob(S);
  let r=null;S.ap=null;apBusy++;
  try{r=S.apJ.next();}
  finally{apBusy--;if(!r)S.apJ=null;else if(!r.done)S.ap=undefined;}   // (it threw: no airport here, as before)
  if(!r.done)return false;
  S.ap=r.value||null;S.apJ=null;return true;
}
function* apJob(S){
  let t=performance.now(),v=null;
  // (the neighbouring cities ahead of it in the order go first and keep theirs: no two airports overlap)
  const others=[];for(let rx=S.rx-2;rx<=S.rx+2;rx++)for(let rz=S.rz-2;rz<=S.rz+2;rz++){const S2=settlementLat(rx,rz);
    if(S2.type==='city'&&(S2.cx<S.cx||S2.cx===S.cx&&S2.cz<S.cz)&&settlementAt(S2.cx,S2.cz)===S2){
      while(!apStep(S2))yield;
      if(S2.ap)others.push(S2.ap);t=performance.now();}}
  // (is this block taken? Each one's answer is kept for the length of the search: the spots tried overlap, a dozen and
  // more to every block, and the roads' part of the answer isn't remembered anywhere else)
  const busyC=new Map(),busy=(a,b)=>{const k=a*100003+b;let u=busyC.get(k);
    if(u===undefined){u=realmOf(a,b)!=='plains'||!!settlementAt(a,b)||!!seaPlot(a,b)||railPlot(a,b)||farmK(a,b)!==null||!!tsPlot(a,b)||plotNearLines(a,b,1)||rivPlotNear(a,b);busyC.set(k,u);}
    return u;};
  const R=Math.ceil(S.R)+3,cols=[];for(let d=0;d<=R;d++){cols.push(S.cx+d);if(d)cols.push(S.cx-d);}
  for(const flip of [false,true]){if(v)break;
    for(const ix of cols){if(v)break;
      if(performance.now()-t>1){yield;t=performance.now();}
      // the city's edge in this column (the first row, coming in from that side, with blocks of it either side of the
      // street), and a street there leaving it for the open country
      let iz=null;
      if(!flip){for(let z=S.cz-R;z<=S.cz;z++)if(settlementAt(ix,z)===S&&settlementAt(ix-1,z)===S){iz=z;break;}}
      else{for(let z=S.cz+R;z>=S.cz;z--)if(settlementAt(ix,z)===S&&settlementAt(ix-1,z)===S){iz=z+1;break;}}
      if(iz===null||!(flip?segBase(ix,iz-1,0):segBase(ix,iz,0)))continue;
      const az=flip?iz:iz-8;
      for(const i of [8,7,9,6,10,5,11,4,12,3,13,2]){const ax=ix-i;
        let ok=!others.some(A=>ax<A.ax+A.w+1&&ax+16>A.ax-1&&az<A.az+A.h+1&&az+8>A.az-1);
        if(ok)scan:for(let a=ax;a<ax+16;a++){for(let b=az;b<az+8;b++)if(busy(a,b)){ok=false;break scan;}
          if(performance.now()-t>1){yield;t=performance.now();}}
        if(ok&&rlfLotOK(ax,az,16,8)){v={kind:'airport',ax,az,w:16,h:8,i,flip};break;}}}}
  return v;
}
// (the searches that the blocks from (x0,z0) to (x1,z1) will ask about, a slice a turn: every city whose airport
// airportAt would look for from any of them)
function* apAhead(x0,z0,x1,z1){
  if(TEST_OFF.has('airport'))return;
  for(let rx=Math.round(x0/SET_SP)-1;rx<=Math.round(x1/SET_SP)+1;rx++)for(let rz=Math.round(z0/SET_SP)-1;rz<=Math.round(z1/SET_SP)+1;rz++){const S=settlementLat(rx,rz);
    if(S.type!=='city'||S.ap!==undefined||settlementAt(S.cx,S.cz)!==S)continue;
    while(!apStep(S))yield;}
}
function airportAt(px,pz){
  if(TEST_OFF.has('airport'))return null;
  const k=px*100003+pz;let v=apAtC.get(k);if(v!==undefined)return v;v=null;
  const rx0=Math.round(px/SET_SP),rz0=Math.round(pz/SET_SP);
  for(let rx=rx0-1;rx<=rx0+1&&!v;rx++)for(let rz=rz0-1;rz<=rz0+1&&!v;rz++){const S=settlementLat(rx,rz);if(S.type!=='city'||S.ap===null&&apBusy)continue;
    if(settlementAt(S.cx,S.cz)!==S)continue;const A=airportOf(S);if(A&&px>=A.ax&&px<A.ax+A.w&&pz>=A.az&&pz<A.az+A.h)v=A;}
  if(!apBusy){if(apAtC.size>200000)apAtC.clear();apAtC.set(k,v);}return v;
}
// the street's last junction, right at the airport's gate: paved through to it
function airportGateAt(ix,iz){const B=airportAt(ix,iz-1);return!!B&&!B.flip&&iz===B.az+8&&ix===B.ax+B.i;}
function airportColumn(col,B,U,V0,x,z,W,Hh,fence){
  const V=B.flip?Hh-1-V0:V0,r0=B.i*CELL,r1=r0+ROADW-1;
  if(fence&&!(V===Hh-2&&U>=r0&&U<=r1)){for(let y=G+1;y<=G+3;y++)col(y,CHAINLINK);return;}
  // the road in, through the gate, out to the street it carries on as
  if(U>=r0&&U<=r1&&V>=136){col(G,ASPHALT);if((U===r0+3||U===r0+4)&&V%6<3&&V<Hh-2)col(G,LANE);return;}
  // the runway: centre dashes, threshold bars, edge lights
  if(V>=14&&V<=23&&U>=8&&U<=W-9){col(G,ASPHALT);
    if((V===18||V===19)&&U%12<6&&U>16&&U<W-17)col(G,PAINT_WHITE);
    if((U>=10&&U<=14||U>=W-15&&U<=W-11)&&V>=15&&V<=22&&V%2===1)col(G,PAINT_WHITE);
    if((V===14||V===23)&&U%8===0)col(G,NEON_Y);return;}
  // the taxiway alongside it, a wingspan and more away (so a plane on each never touch wings), joined to it at both
  // ends and in the middle
  const mid=W/2-2;
  if(V>=44&&V<=47&&U>=20&&U<=W-21||V>=24&&V<=43&&(U>=20&&U<=23||U>=mid&&U<=mid+3||U>=W-24&&U<=W-21)){col(G,ASPHALT);
    if(V===45&&U>22&&U<W-23||V<44&&(U===21||U===mid+1||U===W-22))col(G,PAINT_YELLOW);return;}
  // the jet bridges: a glass-sided tube on legs from each hall out to the front door of the plane at its gate, its
  // mouth open on the plane's side
  for(const u of AP.gates){if(U<u-6||U>u-4||V<86||V>97)continue;
    col(G,CONCRETE);if(U===u-5&&(V===89||V===94)){col(G+1,METAL);col(G+2,METAL);}
    const side=U!==u-5,mouth=U===u-4&&V<=90,end=V===86;
    col(G+3,METAL);col(G+6,METAL);
    if(side&&!mouth||end){col(G+4,GLASS);col(G+5,METAL);}
    return;}
  // the apron: concrete, a yellow lead-in line up to each gate and stand
  if(V>=48&&V<=97&&U>=8&&U<=W-30){col(G,CONCRETE);
    for(const u of AP.gates.concat(AP.stands))if(U===u&&V>=62&&V<=95)col(G,PAINT_YELLOW);
    if(V===97&&U%2===0&&U>=96&&U<=288)col(G,PAINT_WHITE);   // (the line nothing parks past)
    return;}
  // the glass links between the terminal halls
  for(let c=3;c<8;c++){const a=U-(c*32+30);if(a<0||a>3||V<104||V>118)continue;
    col(G,FLOORT);const edge=V===104||V===118;for(let y=G+1;y<=G+6;y++)col(y,edge?(y===G+6?METAL:GLASS):AIR);col(G+7,METAL);return;}
  // the service yard by the hangars and the fuel farm
  if(V>=98&&V<=127&&U>=330&&U<=W-30){col(G,CONCRETE);return;}
  // landside: the kerb in front of the halls, the drop-off road, the car park
  if(V>=125&&V<=127&&U>=96&&U<=288){col(G,SIDEWALK);return;}
  if(V>=128&&V<=135&&U>=40&&U<=W-60){col(G,ASPHALT);if(V===131&&U%6<3)col(G,LANE);return;}
  if(V>=140&&V<=220&&U>=96&&U<=288){col(G,ASPHALT);if((U-96)%3===0&&(V-140)%12<5)col(G,LANE);return;}
  if(hash2(x*7+1,z*3+5)<0.03)col(G+1,FLOWER);
}
// the airport's buildings, in site coordinates (add builds the ones inside the block it's working on; mirrored, the
// doors and the hangars' open ends turn round with it)
function airportBuildings(add0,B){
  const add=(o,brand)=>{if(B.flip){o=Object.assign({},o,{z0:AP.H-o.z1,z1:AP.H-o.z0,door:o.door===3?2:o.door===2?3:o.door});if(o.style==='hangar')o.openZ1=true;if(o.ground==='terminal')o.apFlip=true;}add0(o,brand);};
  // the terminal: six halls in a row, two storeys, glass all round; one in the middle carries the airport's name
  for(let c=3;c<=8;c++)add({x0:c*32+2,x1:c*32+30,z0:AP.term.z0,z1:AP.term.z1,gf:7,top:G+7+FH,wall:PAINT_WHITE,win:GLASS,band:METAL,kind:'office',ground:'terminal',floor:FLOORT,door:3,doorSpec:{w:1,h:4,k:'glass'},glassAll:true},c===5?'airport':null);
  // the control tower
  {const [tu,tv]=AP.tower;add({x0:tu,x1:tu+5,z0:tv,z1:tv+5,top:G+34,style:'ctrl',wall:CONCRETE,win:GLASS,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});}
  // the hangars, open on to the apron, and the fuel farm and cargo shed behind them
  for(const [c,w] of [[11,METAL],[12,PAINT_WHITE],[13,METAL]])add({x0:c*32+3,x1:c*32+29,z0:66,z1:94,top:G+13,style:'hangar',wall:w,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
  for(const uz of [102,112])for(const ux of [356,366])add({x0:ux,x1:ux+7,z0:uz,z1:uz+7,top:G+7,style:'tank',wall:PAINT_WHITE,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
  add({x0:388,x1:414,z0:100,z1:124,top:G+10,wall:METAL,win:METAL,band:RUST,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
}
// The country airfield: a mown grass strip along the north side, a gravel apron in front of the hangar and the
// clubhouse, a fuel pump and its tank, the windsock, a farm fence all round and a gravel lane in from the gate.
// Its two-seaters: one flies circuits from its spot on the apron, one's tied down, one's in the hangar.
const AF={strip:20,taxi:35,stand:[20,42],tie:[70,44],hangar:[47,55],exits:[12.5,92.5],gate:[60,63]};
function airfieldColumn(col,B,U,V,x,z,W,Hh){
  const [g0,g1]=AF.gate;
  if((U===1||U===W-2||V===1||V===Hh-2)&&U>=1&&U<=W-2&&V>=1&&V<=Hh-2){if(!(V===Hh-2&&U>=g0&&U<=g1))col(G+1,FENCE);return;}
  // the strip: mown grass, its centre line, the bars at each end; white markers down both edges
  if(V>=14&&V<=25&&U>=6&&U<=W-7){col(G,FIELD);
    if((V===19||V===20)&&U%10<5&&U>14&&U<W-15)col(G,FIELD_L);
    if((U>=8&&U<=10||U>=W-11&&U<=W-9)&&V>=15&&V<=24&&V%2===1)col(G,FIELD_L);return;}
  if((V===12||V===27)&&U>=6&&U<=W-7&&U%10===6){col(G+1,PAINT_WHITE);return;}
  // the gravel: the two links off the strip, the apron, the lane in
  if(V>=26&&V<=31&&(U>=10&&U<=15||U>=90&&U<=95)||V>=32&&V<=47&&U>=10&&U<=96||U>=g0&&U<=g1&&V>=48){col(G,GRAVEL);return;}
  // the fuel pump, and its tank up on legs
  if(U===84&&V===49){col(G,CONCRETE);col(G+1,PUMP);col(G+2,PUMP);return;}
  if(U>=87&&U<=91&&V>=50&&V<=52){col(G,CONCRETE);if((U===87||U===91)&&V===51)col(G+1,METAL);col(G+2,PAINT_WHITE);col(G+3,V===51&&U%2?PAINT_RED:PAINT_WHITE);if(V===51)col(G+4,PAINT_WHITE);return;}
  // the windsock on its pole, streaming out
  if(V===34&&U>=104&&U<=107){if(U===104)for(let y=G+1;y<=G+7;y++)col(y,METAL);else col(G+7,U%2?PAINT_ORANGE:PAINT_WHITE);return;}
  if(hash2(x*5+3,z*9+1)<0.04)col(G+1,FLOWER);
}
function airfieldBuildings(add){
  // the clubhouse (one room: the desk, a lounge, the briefing table and the map, a bathroom) and the hangar
  add({x0:4,x1:24,z0:48,z1:60,style:'house',roof:4,top:G+FH,wall:SIDING,win:WIN_WARM,kind:'office',ground:'aeroclub',floor:PLANKS,door:2,doorSpec:{w:0,h:3,k:'wood'}},'airfield');
  add({x0:36,x1:58,z0:48,z1:62,top:G+11,style:'hangar',wall:METAL,win:METAL,kind:'landmark',ground:'landmark',floor:CONCRETE,door:2,doorSpec:null,noIndoor:true});
}
