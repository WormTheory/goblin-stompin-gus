function furnProps(b,px,pz,floorNo){
  const c=b._props||(b._props=new Map());let L=c.get(floorNo);if(L)return L;L=[];c.set(floorNo,L);
  if(b.style==='mall'){mallProps(b,px,pz,floorNo,L);return L;}
  if(b.style==='arena'){if(floorNo===0)arenaProps(b,px,pz,L);return L;}
  if(b.style==='capitol'){capitolProps(b,px,pz,floorNo,L);return L;}
  if(b.style==='church'||b.style==='cathedral'){if(floorNo===0)pewProps(b,px,pz,L);return L;}
  if(b.home){homeRoom(b,px,pz,floorNo,L);return L;}
  {const kd=floorNo===0?b.ground:b.kind;
   if(VENUE_ROOMS.has(kd)){venueRoom(b,px,pz,floorNo,L,kd);return L;}
   if(CIVIC_ROOMS.has(kd)){civicRoom(b,px,pz,floorNo,L,kd);return L;}
   if(b.ground==='firehall'&&floorNo>0){civicRoom(b,px,pz,floorNo,L,'crew');return L;}
   if(WORK_ROOMS.has(kd)){workRoom(b,px,pz,floorNo,L,kd);return L;}
   if(kd==='apartment'&&!b.eat&&b.style==='normal'){aptFloor(b,px,pz,floorNo,L);return L;}}
  if(b.eat&&floorNo===0){restProps(b,px,pz,L);return L;}
  if(floorNo===0&&(SHOP_ROOMS.has(b.ground)||b.ground==='shop')){shopRoom(b,px,pz,L);return L;}
  const gf=b.gf||FH,fl0=floorNo===0?1:gf+FH*(floorNo-1)+1,nl=floorNo===0?gf-1:FH-1,[hx,hz]=b._fp;
  const tierOn=b.tier>0&&(b.x1-b.x0)>=8,up=tierOn&&G+fl0>b.tier,ex0=up?b.x0+2:b.x0,ex1=up?b.x1-2:b.x1,ez0=up?b.z0+2:b.z0,ez1=up?b.z1-2:b.z1;
  const st=STRUCT,raw=(x,z,l)=>l<0||l>=nl?AIR:furnRaw(b,x,z,fl0+l,ex0,ex1,ez0,ez1,hx,hz),turns=(v,x,z,l)=>FURN_IDS.has(v)&&furnTurns(v,b,x,z,fl0+l,ex0,ex1,ez0,ez1,hx,hz);
  const pick=(A,x,z)=>A[Math.floor(hash2(x*7+px*31+1,z*11+pz*17+floorNo)*A.length)%A.length];
  for(let rx=ex0+1;rx<ex1-1;rx++)for(let rz=ez0+1;rz<ez1-1;rz++){
    // (the way its back should face: the first wall or solid thing beside it, or failing that the nearer wall of the room)
    const back=(l,self)=>{
      const runX=raw(rx-1,rz,l)===self||raw(rx+1,rz,l)===self,runZ=raw(rx,rz-1,l)===self||raw(rx,rz+1,l)===self;
      if(runX!==runZ){const O=runX?[[0,-1],[0,1]]:[[-1,0],[1,0]];for(const [dx,dz] of O){const X=rx+dx,Z=rz+dz;if(X<=ex0||X>=ex1-1||Z<=ez0||Z>=ez1-1)return[dx,dz];const w=raw(X,Z,l);if(w!==AIR&&w!==self&&!turns(w,X,Z,l))return[dx,dz];}
        return runX?(rz-ez0<ez1-1-rz?[0,-1]:[0,1]):(rx-ex0<ex1-1-rx?[-1,0]:[1,0]);}
      for(const [dx,dz] of N4){const X=rx+dx,Z=rz+dz;if(X<=ex0||X>=ex1-1||Z<=ez0||Z>=ez1-1)return[dx,dz];const w=raw(X,Z,l);if(w!==AIR&&w!==self&&!turns(w,X,Z,l))return[dx,dz];}
      const a=rx-ex0,e=ex1-1-rx,f=rz-ez0,g=ez1-1-rz,m=Math.min(a,e,f,g);return m===a?[-1,0]:m===e?[1,0]:m===f?[0,-1]:[0,1];};
    for(let l=0;l<nl;l++){
      const y=G+fl0+l;if(b.stair&&stairAt(b,rx,rz,y)!==undefined||b.stair2&&stairAt(stair2Of(b),rx,rz,y)!==undefined)continue;
      const v=raw(rx,rz,l);if(v===AIR||!turns(v,rx,rz,l))continue;
      const put=(type,yaw,tint,off)=>{const[dx,dz]=off||[0,0],X=px*CELL+rx+.5+dx,Z=pz*CELL+rz+.5+dz;L.push({prop:true,type,x:X,z:Z,y0:y,yaw,tint,rad:.5,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y+type});},yawOf=d=>Math.atan2(-d[0],-d[1]);
      if(v===SHELF||v===FRIDGE||v===BED){
        if(raw(rx,rz,l-1)===v)continue;   // (counted from the foot of the stack)
        let n=1;while(l+n<nl&&(raw(rx,rz,l+n)===v||v===SHELF&&raw(rx,rz,l+n)===CRATE))n++;
        const d=back(l,v);
        if(v===SHELF)put('shelf'+Math.min(n,4),yawOf(d),raw(rx,rz-1,l)===SHELF||raw(rx,rz+1,l)===SHELF?pick(P_GOODS,rx,Math.floor(rz/4)):pick(P_GOODS,Math.floor(rx/4),rz));
        else if(v===FRIDGE)put('fridge'+Math.min(n,3),yawOf(d));
        else put(n>=2?'bunk':'homebed',yawOf(d),pick(P_BLANKET,rx,rz),[-d[0]*.3,-d[1]*.3]);
      }else if(v===SOFA)put('sofa',yawOf(back(l,v)),pick(P_SOFA,rx,rz));
      else if(v===LEAVES){if(l===0)put('plant',hash2(rx,rz)*6);}
      else if(v===PLANKS)put(raw(rx,rz,l+1)===SCREEN?'deskm':'table',yawOf(back(l+1,SCREEN)));
      else if(v===SCREEN){if(!(raw(rx,rz,l-1)===PLANKS&&turns(PLANKS,rx,rz,l-1)))put('monitor',yawOf(back(l,v)));}
    }
  }
  STRUCT=st;return L;
}
// the upright props in reach, by the cell each stands in, for goblins to walk round
const propCells=new Map(),propCK=(x,y,z)=>Math.floor(x)*4194304+Math.floor(z)*1024+Math.floor(y);
// what a goblin can step up to: a prop in the way counts as a wall. (With g and dt: one that's been held up by props
// for a while shoves the next one over, so a room packed with desks can't pen it in. Gus gets no points for that.)
function gobGround(x,z,y,g,dt){
  const k=propCK(x,y+.2,z),f=propCells.get(k);if(!f||g&&propCK(g.pos.x,g.pos.y+.2,g.pos.z)===k)return groundAt(x,z,y);   // (already standing in its cell: let it walk out)
  if(g){g.shove=(g.shove||0)+dt;if(g.shove>0.6){g.shove=0;propCells.delete(k);if(knockFix(f,f.x-g.pos.x,f.z-g.pos.z))score-=5;return groundAt(x,z,y);}}
  return y+9;
}
// whatever's on this floor, with its bathrooms fitted: anything standing in their footprint goes, the fixtures go in
function roomProps(b,ax,az,n,ward){
  const L=(ward?hospProps:furnProps)(b,ax,az,n);if(L._wc)return L;L._wc=true;
  if(b.stair2){const S=b.stair2,out=L.filter(f=>{const r=f.x-ax*CELL-S.r0,c=f.z-az*CELL;return !(r>=-3&&r<S.L+3&&c>=S.c0-1.5&&c<S.c1+1.5);});L.length=0;for(const f of out)L.push(f);}   // (whatever's laid out there: the way on and off the stairs stays clear)
  const gf=b.gf||FH,y0=n===0?G+1:G+gf+1+FH*(n-1),tr=b.tier>0&&(b.x1-b.x0)>=8&&y0>b.tier?2:0,X0=ax*CELL+b.x0+tr+1,Z0=az*CELL+b.z0+tr+1;
  const R=wcOf(b,n,ax,az);if(!R.length)return L;
  const nearDoor=(f,q)=>{const dr=wcDoor(q);return Math.hypot(f.x-X0-dr[0]-.5,f.z-Z0-dr[1]-.5)<2;},out=L.filter(f=>!R.some(q=>f.x-X0>=q.u0-.3&&f.x-X0<q.u1+.3&&f.z-Z0>=q.v0-.3&&f.z-Z0<q.v1+.3||nearDoor(f,q)));L.length=0;for(const f of out)L.push(f);
  const add=(type,u,v,yaw,yo,tint)=>{const X=X0+u,Z=Z0+v;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw:yaw||0,tint,rad:.5,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  for(const q of R){const x0=q.u0+1,x1=q.u1-1,PI=Math.PI,farV=q.dv?q.v0+1:q.v1-1,nearV=q.dv?q.v1-1:q.v0+1,back=q.dv?0:PI,face=q.dv?PI:0,dirn=q.dv?1:-1;
    const iw=q.u1-q.u0-2,idp=q.v1-q.v0-2;
    if(q.dside){const sd=q.dside,fu=sd<0?q.u1-1.5:q.u0+1.5,dr=wcDoor(q);add('toilet',fu,q.v0+1.3,sd<0?-PI/2:PI/2);add('basin',fu,q.v1-1.3,sd<0?-PI/2:PI/2);add('wcsign',sd<0?q.u0-.06:q.u1+.06,dr[1]+.5+(dr[1]+2<q.v1?1.2:-1.2),sd<0?-PI/2:PI/2,2.4);continue;}
    if(q.home){add('toilet',x0+.5,farV+dirn*.5,back);if(iw>=2)add('basin',x1-.4,farV+dirn*.4,back);if(idp>=3&&iw>=3)add('bathtub',x0+1.5,farV+dirn*1.6,back);continue;}
    // stalls along the far wall, a basin or two (or, in a cupboard of a room, just a toilet and whatever else fits)
    if(idp<2){add('toilet',x0+.5,farV+dirn*.5,back);if(iw>=2)add('basin',x1-.4,farV+dirn*.4,back);}
    else{const ns=Math.max(1,Math.floor(iw/1.1)),st=idp>=3?ns:Math.max(1,ns-1);for(let i=0;i<st;i++)add('stall',x0+.55+i*1.1,farV+dirn*.72,back);
    if(idp>=3){add('basin',x0+.5,nearV+dirn*.4*0-dirn*.3,face);if(iw>=5)add('basin',x1-.5,nearV-dirn*.3,face);}else add('basin',x1-.5,farV+dirn*.4,back);}
    {const out=q.dv?q.v1+.06:q.v0-.06,su=Math.min(q.u1-.6,((q.u0+q.u1)>>1)+1.4);add('wcsign',su,out,q.dv?0:PI,2.4);}
  }
  return L;
}
// the fittings of a row of stalls and a couple of basins, in a room described by a function from (along the row, into the room)
function wcFit(L,y0,at,n,depth){
  const add=(type,a,c,toA,toC,yo)=>{const [X,Z]=at(a,c),[X1,Z1]=at(a+toA,c+toC),yaw=Math.atan2(-(X1-X),-(Z1-Z));L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),base:y0,yaw,rad:.5,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  for(let i=0;i<n;i++)add('stall',.6+i*1.1,.72,0,-1);
  for(let i=0;i<Math.max(1,n-2);i+=2)add('basin',.8+i*1.1,depth-.3,0,1);
}
function arenaProps(b,px,pz,L){
  const c=(b.x1-b.x0-1)/2,R=c-.3,W=arenaWC(R),X=px*CELL+b.x0+c+.5,Z=pz*CELL+b.z0+c+.5,n=W.v1-W.v0-2;
  for(const sg of [-1,1])wcFit(L,G+2,(a,d)=>[X+sg*(4+a),Z+sg*(W.v0+1+d)],4,n);
}
// what's in each of the capitol's rooms (see capPlan for where they are)
const CAP_WOOD=0x5a3a22,CAP_LEATHER=0x6a2a24,CAP_SIDE=[0x8a2a2a,0x2f6b45],CAP_ART=[0x5d7a8c,0x8c6d4a,0x6a5a8c,0x8a4b3a];
function capitolProps(b,px,pz,n,L){
  if(n>3)return;
  const g=capGeo(),X=px*CELL+PL0+g.c,Zb=pz*CELL+PL0+g.back-1,Z0=pz*CELL+PL0+g.bf,y=G+4+FH*n;
  // (A out from the middle and W back from the front wall; the thing's front looks along fa,fw; up: stood on a step that high)
  const add=(type,s,A,W,fa,fw,tint,yo,low,up)=>{const sg=s?1:-1,x=X+sg*A,z=Z0+W;L.push({prop:true,type,x,z,y0:y+(yo||0)+(up||0),base:y+(up||0),yaw:Math.atan2(sg*fa,fw),tint,rad:.5,low,key:'p'+Math.round(x*4)+','+Math.round(z*4)+','+y+type});};
  const row=(type,s,A0,A1,W,st,fa,fw,tint,skip)=>{for(let A=A0;A<=A1;A+=st)if(!skip||!skip(A))add(type,s,A,W,fa,fw,tint);};
  const col=(type,s,A,W0,W1,st,fa,fw,tint,skip)=>{for(let W=W0;W<=W1;W+=st)if(!skip||!skip(W))add(type,s,A,W,fa,fw,tint);};
  const art=(s,i)=>CAP_ART[(s+i*3)%CAP_ART.length];
  // an important person's office: the desk and its flags with their back to the window, bookcases behind, chairs for visitors, a sofa
  const office=(s,A0,A1,W0,W1,along)=>{const m=(A0+A1)/2;
    if(along){const mw=(W0+W1)/2;add('rug',s,A1-4,mw,1,0,CAP_LEATHER,0,true);add('desk',s,A1-2.2,mw,1,0);add('swivel',s,A1-1.3,mw,-1,0,0,0,true);add('chair',s,A1-3.6,mw-.8,1,0,CAP_LEATHER,0,true);add('chair',s,A1-3.6,mw+.8,1,0,CAP_LEATHER,0,true);add('flag',s,A1-.7,W0+.8,-1,0);col('bookcase',s,A1-.4,mw+1.5,W1-.6,1,-1,0,CAP_WOOD);add('portrait',s,m+3,W0+.1,0,1,art(s,W0));add('plant',s,A0+.7,W0+.7,0,1);add('sofa',s,A0+.8,W1-1,1,0,CAP_LEATHER,0,true);return;}
    add('rug',s,m,W0+4.2,0,1,CAP_LEATHER,0,true);add('desk',s,m,W0+3,0,-1);add('swivel',s,m,W0+2.1,0,1,0,0,true);add('flag',s,m-2.6,W0+1.2,0,1);add('flag',s,m+2.6,W0+1.2,0,1);
    row('bookcase',s,A0+.6,m-1.2,W0+.4,1,0,1,CAP_WOOD);row('bookcase',s,m+1.2,A1-.6,W0+.4,1,0,1,CAP_WOOD);
    add('chair',s,m-.8,W0+4.5,0,-1,CAP_LEATHER,0,true);add('chair',s,m+.8,W0+4.5,0,-1,CAP_LEATHER,0,true);
    col('sofa',s,A0+.8,W0+6.5,W0+8.5,1,1,0,CAP_LEATHER);add('rtable',s,A0+2.2,W0+7.5,0,1,CAP_WOOD);add('portrait',s,A0+.1,W0+4,1,0,art(s,1));add('plant',s,A1-.7,W0+6,0,1);add('drawers',s,A1-.5,W0+7.5,-1,0);};
  // somewhere to file and hand things over: a counter by the door, shelves of papers behind it
  const clerk=(s,A0,A1,W0,W1,tint)=>{const dW=W0+2.5;row('bar',s,A0+1.6,A1-.6,dW,1,0,-1,CAP_WOOD);add('monitor',s,A1-1.5,dW,0,-1,0,.9);add('swivel',s,A1-1.5,dW+.9,0,-1,0,0,true);for(let W=dW+3;W<W1-.2;W+=2)row('shelf3',s,A0+.6,A1-.6,W,1,0,1,tint);add('copier',s,A0+.6,dW+1,1,0);};
  // a room of desks
  const staff=(s,A0,A1,W0,W1)=>{for(let W=W0+.8;W<W1-1;W+=2.4)for(let A=A0+.6;A<A1-.5;A+=1.3)if(W>W0+1||Math.abs(A-32.5)>2)add('cube',s,A,W,0,1);add('board',s,A0+.1,(W0+W1)/2,1,0,0xd8dce0);add('plant',s,A1-.6,W1-.7,0,-1);};
  // a hearing room: the members along a raised dais at the far end, the witness table facing them, the public behind
  const hearing=(s,A0,A1,W0,W1)=>{const m=(A0+A1)/2;
    add('seal',s,m,W1-.1,0,-1);add('flag',s,A0+.7,W1-.7,0,-1);add('flag',s,A1-.7,W1-.7,0,-1);
    for(let A=A0+2;A<A1-1.5;A+=1){add('bar',s,A,W1-2.8,0,-1,CAP_WOOD);add('swivel',s,A,W1-1.8,0,-1,0,0,true);if(Math.round(A)%2)add('micstand',s,A,W1-2.8,0,-1,0,.9,true);}
    add('ltable',s,m,W1-7,0,1);add('chair',s,m-.5,W1-7.9,0,1,0x35506b,0,true);add('chair',s,m+.5,W1-7.9,0,1,0x35506b,0,true);
    add('tvcam',s,A0+1,W1-7,1,.3);add('tvcam',s,A1-1,W1-7,-1,.3);
    for(let W=W0+1.5;W<W1-9.2;W+=1.5)for(let A=A0+1.2;A<A1-1;A+=1.8)if(Math.abs(A-m)>1.9)add('seats',s,A,W,0,1,0x35506b);};
  if(n===0){
    // the way in: guards at a desk either side, walk-through detectors, rope to keep the line straight
    for(let s=0;s<2;s++){
      add('detector',s,3.2,3.2,0,1);add('stanchion',s,5.5,2.2,1,0);row('bar',s,6.5,9,2.8,1,0,1,0x46505a);add('monitor',s,7.5,2.8,0,-1,0,.9);add('swivel',s,7.5,1.8,0,1,0,0,true);add('flag',s,13.5,1.2,0,1);
      // the rotunda: statues in niches round the wall, great paintings between them, benches to look at it all from
      for(const [A,W] of [[10,6.5],[10,25.5],[13.2,12],[13.2,20.5]])add('statue',s,A,W,A>12?-1:-.6,W<16?.6:-.6,0x8a7a5a);
      add('painting',s,14.9,7.5,-1,0,art(s,0));add('painting',s,14.9,24.5,-1,0,art(s,1));add('bench',s,6.6,29.3,0,-1,0,0,true);add('stanchion',s,3.4,29,1,0);
      // along the corridors and the lobby behind the chamber: benches, plants, portraits of those who've gone before
      col('portrait',s,16.08,21,29,4,1,0,art(s,2));col('bench',s,16.9,33,44,5,1,0,0,0);add('plant',s,17,19.8,1,0);
      row('portrait',s,21,37,47.08,4,0,1,art(s,3));row('bench',s,23,37,47.6,7,0,1);add('plant',s,37.5,50,0,-1);add('elevator',s,33.8,4,-1,0);add('plant',s,26,2,1,1);add('statue',s,33,17,-1,0,0x8a7a5a);
      // the governor's reception room (west), where visitors are received; the gift shop and visitors' desk (east)
      if(!s){add('rug',s,20,6,0,1,CAP_LEATHER,0,true);add('rug',s,20,10,0,1,CAP_LEATHER,0,true);col('sofa',s,16.8,4,8,1,1,0,CAP_LEATHER);col('sofa',s,23.2,4,8,1,-1,0,CAP_LEATHER);add('rtable',s,18.5,6,0,1,CAP_WOOD);add('rtable',s,21.5,6,0,1,CAP_WOOD);add('flag',s,18,1.5,0,1);add('flag',s,22,1.5,0,1);add('seal',s,20,1.1,0,1);add('portrait',s,16.1,10.5,1,0,art(s,1));add('portrait',s,23.9,10.5,-1,0,art(s,2));add('vase',s,17,12.5,0,1,0xc9a24a);add('vase',s,23,12.5,0,1,0xc9a24a);}
      else{for(const W of [2,5,8])row('shelf2',s,17.8,22.2,W,1,0,1,P_GOODS[Math.round(W)%P_GOODS.length]);row('bar',s,18,22,11.5,1,0,-1,CAP_WOOD);add('monitor',s,20,11.5,0,1,0,.9);add('board',s,16.1,10,1,0,0x2b5fb8);add('clothes',s,23.1,10.5,-1,0,0x2b5fb8);add('swivel',s,20,10.6,0,1,0,0,true);}
      // the sergeant at arms: a desk, a rack of keys and maces, the lockers, a notice board
      add('desk',s,36.5,3,0,-1);add('swivel',s,36.5,2.1,0,1,0,0,true);add('flag',s,38.3,1.4,0,1);col('locker',s,38.5,5,10,1,-1,0);add('board',s,35.1,8,1,0,0xd8dce0);add('bench',s,35.8,12,1,0);
      // the chamber
      const AC=29.5,WC=46,step=s?1.1:1.4;
      for(let r=8;r<24;r+=s?2:2.4)for(let th=-1.5;th<=1.5;th+=step/r){const A=AC+r*Math.sin(th),W=WC-r*Math.cos(th);
        if(A<20.8||A>38.2||W<24.5||W>40.5||Math.abs(A-AC)<1.7||Math.abs(th)>1.2&&W>38||A<23&&W>38||(Math.abs(A-23.5)<1.1||Math.abs(A-35.5)<1.1)&&(Math.abs(W-29.5)<1.1||Math.abs(W-35.5)<1.1))continue;add(s?'lbench':'ldesk',s,A,W,AC-A,WC-W,CAP_SIDE[s],0,false);}
      add('lectern',s,AC,44,0,1,0,0,false,2);add('swivel',s,AC,45.1,0,1,0,0,true,2);add('seal',s,AC,45.9,0,1,0,0,false,2);add('flag',s,AC-4.5,45.2,0,1,0,0,false,1);add('flag',s,AC+4.5,45.2,0,1,0,0,false,1);
      for(const A of [AC-2,AC+2]){add('ltable',s,A,41.6,0,1);add('swivel',s,A,42.5,0,-1,0,0,true);add('monitor',s,A,41.6,0,1,0,.68,true);}
      // the cloakroom behind it: coats, sofas, telephones
      row('clothes',s,27,38,58.4,1.1,0,-1,CAP_SIDE[s]);col('sofa',s,27,52.6,56,1,1,0,CAP_SIDE[s]);col('sofa',s,38.4,52.6,56,1,-1,0,CAP_SIDE[s]);add('rtable',s,32,55,0,1,CAP_WOOD);add('chair',s,31.2,55,1,0,CAP_LEATHER,0,true);add('chair',s,32.8,55,-1,0,CAP_LEATHER,0,true);add('vending',s,35.5,52,0,1);add('tv',s,29,52.1,0,1,0,.9,true);
    }
    // the statuary hall behind the rotunda, a statue from each part of the land round the walls; and the old supreme courtroom behind that
    for(let s=0;s<2;s++){for(const W of [33.5,36,40.5,42.5])add('statue',s,13.7,W,-1,0,W%2?0xa89a7a:0x6a7a6a);for(const A of [4,7,10,13])add('statue',s,A,32.7,0,1,A%6?0xa89a7a:0x6a7a6a);add('stanchion',s,3,37,1,0);add('board',s,14.9,34,-1,0,0xd8dce0);
      add('judge',s,3.3,56,0,-1);add('swivel',s,3.3,57.6,0,-1,0,0,true);add('judge',s,6.5,55.6,0,-1);add('swivel',s,6.5,57,0,-1,0,0,true);add('flag',s,12,57.5,0,-1);add('ltable',s,5,51.4,0,1);add('chair',s,5,50.5,0,1,CAP_LEATHER,0,true);add('chair',s,4,50.5,0,1,CAP_LEATHER,0,true);row('pew',s,2,13.5,46.2,1,0,1);row('pew',s,2,13.5,47.8,1,0,1);add('stanchion',s,2.5,49,1,0);row('bookcase',s,10,14,58.6,1,0,-1,CAP_WOOD);}
    add('judge',1,0,56.4,0,-1);add('swivel',1,0,58,0,-1,0,0,true);add('seal',1,0,58.9,0,-1);add('wbox',1,10,53,-1,0);
  }else if(n===1){
    for(let s=0;s<2;s++){
      // the governor's own office (west); the speaker's (east); a press room at each end, overlooking the front
      office(s,16,24,1,14);
      col('deskm',s,38.3,2,13,2,-1,0);for(let W=2;W<=13;W+=2)add('swivel',s,37.2,W,1,0,0,0,true);add('tvcam',s,35.8,3,1,0);add('tv',s,35.3,9,1,0,0,.9,true);
      // the public gallery round the chamber: a row of seats behind the front, a camera for the press
      const skip=A=>Math.abs(A-29.5)<1.8;
      row('pew',s,24,35,22.3,1,0,1,0,skip);col('pew',s,22.3,24,39.5,1,1,0);col('pew',s,36.3,24,39.5,1,-1,0);add('tvcam',s,21,21,.7,.7);add('tvcam',s,38,21,-.7,.7);
      // the clerk's office and bill room behind it; an officer's room beside them
      clerk(s,26,39,52,59,0xd8dce0);office(s,16,25,52,59,true);
      row('portrait',s,21,37,47.08,4,0,1,art(s,1));add('bench',s,17,33,1,0,0,0);add('elevator',s,33.8,4,-1,0);
    }
    // the legislative library: the stacks along both sides, a reading room down the middle
    for(let s=0;s<2;s++){for(let W=33;W<=56;W+=2.5)for(let A=8;A<=14.5;A+=1)if(Math.abs(W-36.5)>2.3&&Math.abs(W-54.5)>2.3)add('bookcase',s,A,W,0,W<45?1:-1,P_GOODS[(Math.round(A*2)+Math.round(W))%P_GOODS.length]);
      for(const W of [35,39,43,47,51])for(const A of [3.6])if(!(s===0&&W===35)){add('rtable',s,A,W,0,1,CAP_WOOD);add('chair',s,A-.8,W,1,0,0x35506b,0,true);add('chair',s,A+.8,W,-1,0,0x35506b,0,true);}
      add('ship',s,1.5,32.8,0,1);}
    row('bar',0,1.8,5.4,33.6,1,0,1,CAP_WOOD);add('monitor',0,3.5,33.6,0,-1,0,.9);add('swivel',0,3.5,32.7,0,1,0,0,true);
  }else if(n===2){
    for(let s=0;s<2;s++){
      // the senior officers (the president of the senate, the majority leader), and more staff at the end
      office(s,16,24,1,14);staff(s,35,39,1,14);
      hearing(s,20,39,20,34);
      // the caucus room: one long table, chairs all round, the board and a portrait at the end
      for(let A=23.5;A<=36;A+=1.6){add('ltable',s,A,40.6,0,1,CAP_WOOD);add('chair',s,A,39.4,0,1,CAP_LEATHER,0,true);add('chair',s,A,41.9,0,-1,CAP_LEATHER,0,true);}
      add('swivel',s,37.9,40.6,-1,0,0,0,true);add('board',s,38.9,40.6,-1,0,0xd8dce0);add('flag',s,38,36,-1,1);add('portrait',s,29.5,45.9,0,-1,art(s,2));
      staff(s,26,39,52,59);row('portrait',s,21,37,47.08,4,0,1,art(s,0));add('plant',s,17,49,1,0);add('elevator',s,33.8,4,-1,0);
    }
    // the members' dining room; the kitchen behind it
    for(let s=0;s<2;s++){for(let W=34.5;W<46;W+=3.4)for(const A of [3,7.5,12])if(!(A>11&&Math.abs(W-40)<2.6)){add('rtable',s,A,W,0,1,P_WHITE);add('chair',s,A-.8,W,1,0,CAP_LEATHER,0,true);add('chair',s,A+.8,W,-1,0,CAP_LEATHER,0,true);}
      add('portrait',s,14.9,36,-1,0,art(s,1));row('buffet',s,3.5,10,46.4,1,0,-1);
      row('prep',s,3,12,52.5,1,0,1);row(s?'range':'fryer',s,3,13,58.4,1,0,-1);row('sink',s,12,14,50,1,0,1);add('fridge2',s,14.3,55,-1,0,0xd8dce0);add('fridge2',s,14.3,56.2,-1,0,0xd8dce0);}
  }else{
    for(let s=0;s<2;s++){
      office(s,16,24,1,14);
      // the archive at the end of the wing: boxes of old records
      for(let W=2;W<13;W+=2.2)row('shelf3',s,35.6,38.4,W,1,0,1,0xbf9a6a);
      // the members' suites: a secretary and somewhere to wait in the outer room, the member's desk, flag and books in the inner one
      for(const [w0,w1] of [[19,28],[28,37],[37,46]]){const m=(w0+w1)/2+.5;
        add('desk',s,24,m-3,0,1);add('swivel',s,24,m-2.1,0,-1,0,0,true);add('seats',s,21.6,w1-1,0,-1,0x35506b);add('seats',s,25.5,w1-1,0,-1,0x35506b);add('plant',s,28,w0+1,-1,0);add('board',s,28.9,w0+2,-1,0,0xd8dce0);
        office(s,30,39,w0+1,w1,true);}
      // the break room, the mail room
      add('rtable',s,30,55,0,1,P_WHITE);add('chair',s,29.2,55,1,0,0x35506b,0,true);add('chair',s,30.8,55,-1,0,0x35506b,0,true);add('rtable',s,34,55,0,1,P_WHITE);add('chair',s,33.2,55,1,0,0x35506b,0,true);add('chair',s,34.8,55,-1,0,0x35506b,0,true);
      row('sink',s,27,28,58.4,1,0,-1);add('fridge2',s,29,58.4,0,-1,0xd8dce0);add('range',s,30,58.4,0,-1);add('vending',s,38.3,58,-1,0);add('vending',s,38.3,56.8,-1,0);add('sofa',s,38.3,53,-1,0,0x3f6b8c);add('sofa',s,38.3,54,-1,0,0x3f6b8c);
      clerk(s,16,25,52,59,0xbf9a6a);add('plant',s,17,49.5,1,0);add('elevator',s,33.8,4,-1,0);
    }
    // the archive proper, and the capitol police: their desks and screens, lockers, a rack of rifles, a bench for whoever's been brought in
    for(let s=0;s<2;s++){for(const W of [33,35,41,43])for(let A=3;A<=14;A+=1)add('shelf3',s,A,W,0,1,0xbf9a6a);
      for(const A of [4,8])for(const W of [48,52]){add('desk',s,A,W,0,-1);add('swivel',s,A,W-.9,0,1,0,0,true);}
      row('monitor',s,3,13,58.6,2,0,-1,0,false);row('bar',s,3,13,58.6,1,0,-1,0x46505a);col('locker',s,14.5,46.5,50,1,-1,0);col('gunrack',s,14.5,56,58,1,-1,0);add('bench',s,12,47,0,1);}
  }
  // the bathrooms, fitted last
  if(n%2===0)for(const sg of [-1,1])wcFit(L,y,(a,d)=>[X+sg*(21+a),Zb-d],3,4);
}
// (the stadium hasn't a building to hang them on, so they're worked out from the site)
function stadiumProps(S){
  if(S._wc)return S._wc;const L=S._wc=[],W=(S.w-1)*CELL+PL1-PL0,Ls=(S.h-1)*CELL+PL1-PL0,F=stadiumField(W,Ls),X0=S.ax*CELL+PL0,Z0=S.az*CELL+PL0,fx1=F.fx0+F.fw,fz1=F.fz0+F.fh;
  // (a: along the side from the tunnel, d: out from the pitch, both as stadiumCol has them)
  const sides=[(a,d)=>[F.fx0-d,Ls/2-.5+a],(a,d)=>[fx1-1+d,Ls/2-.5+a]];
  for(const f of sides)wcFit(L,G+1,(i,k)=>{const [u,v]=f(9.4-k+.0,11+i);return[X0+u+.5,Z0+v+.5];},4,5);
  return L;
}
const COAST_PROPS=new Set(['beach','harbor','yard','navy','rig']);
function refreshProps(){
  nPropL=nPropG=0;activeProps.length=0;propCells.clear();const R=34,seen=new Set(),got=new Set();   // (seen: per viewer, as each sees only what's near it; got: drawn already, for another)
  // benches and litter bins, out to the same distance as the lamp posts beside them (they're out in the open, so 34 blocks
  // would have them popping in down the street). Listed with the fixtures too: traffic knocks them over, as it does lamps.
  {const RS=Math.min(viewFar(),96),seenS=new Set();
   for(const p of viewers()){
     for(let px=Math.floor((p.pos.x-RS)/CELL);px<=Math.floor((p.pos.x+RS)/CELL);px++)for(let pz=Math.floor((p.pos.z-RS)/CELL);pz<=Math.floor((p.pos.z+RS)/CELL);pz++){
       const ck=px*100003+pz;if(seenS.has(ck))continue;seenS.add(ck);if(biomeOf(px,pz)==='plains'||!tenvShow(px,pz))continue;
       for(const f of streetFurn(px,pz)){if(!f.prop)continue;const fx=Math.floor(f.x),fz=Math.floor(f.z);if(get(fx,G,fz)!==f.on||get(fx,G+1,fz)!==AIR)continue;
         activeProps.push(f);activeFix.push(f);drawProp(f);if(downFix.has(f.key)||falling.has(f.key))continue;
         // (a bench is wider than one block: goblins go round the whole of it)
         const L=f.type==='parkbench'?.9:0,ux=Math.cos(f.yaw)*L,uz=-Math.sin(f.yaw)*L;for(const e of L?[-1,0,1]:[0])propCells.set(propCK(f.x+ux*e,f.y0,f.z+uz*e),f);}}}}
  for(const p of viewers()){seen.clear();
    for(let px=Math.floor((p.pos.x-R)/CELL);px<=Math.floor((p.pos.x+R)/CELL);px++)for(let pz=Math.floor((p.pos.z-R)/CELL);pz<=Math.floor((p.pos.z+R)/CELL);pz++){
      if(!tenvShow(px,pz))continue;
      const S=superOf(px,pz),ax=S?S.ax:px,az=S?S.az:pz,P=plotInfo(ax,az);
      if(COAST_PROPS.has(P.type)&&!seen.has(P)){seen.add(P);
        for(const f of coastProps(P,ax,az)){if(Math.abs(f.x-p.pos.x)>R||Math.abs(f.z-p.pos.z)>R)continue;const fx=Math.floor(f.x),fz=Math.floor(f.z);if(!chunks.has(ckey(Math.floor(fx/CS),Math.floor(fz/CS))))continue;
          if(f.snap){let y=G+10;while(y>G-4&&get(fx,y,fz)===AIR)y--;if(get(fx,y,fz)===WATER||y<=G-4)continue;f.y0=y+1;f.snap=false;}
          if(get(fx,Math.floor(f.y0)-(f.y0%1?0:1),fz)===AIR||get(fx,Math.ceil(f.y0),fz)!==AIR)continue;if(got.has(f.key))continue;got.add(f.key);activeProps.push(f);drawProp(f);if(!f.low&&!downFix.has(f.key)&&!falling.has(f.key))propCells.set(propCK(f.x,f.y0,f.z),f);}}
      if((P.patio||S&&S.kind==='stadium')&&!seen.has(P)){seen.add(P);
        for(const f of P.patio?patioProps(P,ax,az):stadiumProps(S)){if(Math.abs(f.x-p.pos.x)>R||Math.abs(f.z-p.pos.z)>R)continue;const fx=Math.floor(f.x),fz=Math.floor(f.z);if(!chunks.has(ckey(Math.floor(fx/CS),Math.floor(fz/CS))))continue;
          if(get(fx,f.y0-1,fz)===AIR||get(fx,f.y0,fz)!==AIR)continue;if(got.has(f.key))continue;got.add(f.key);activeProps.push(f);drawProp(f);if(!f.low&&!downFix.has(f.key)&&!falling.has(f.key))propCells.set(propCK(f.x,f.y0,f.z),f);}}
      for(const b of P.b){const ward=b.kind==='ward';if(seen.has(b))continue;if(!ward&&!b._fp){if(b.style!=='church'&&b.style!=='cathedral'&&b.style!=='arena'&&b.style!=='capitol'&&!FURN_SEEN.has(ax+','+az+','+b.x0+','+b.z0))continue;b._fp=[ax,az];}seen.add(b);   // (a site's other blocks: they're all listed on its first plot)
        // the floors in sight: the one you're on and the ones either side (you can't see the others through the slabs)
        const f0=Math.max(0,Math.floor((p.pos.y-G-1-b.gf)/FH)+1);
        for(let n=Math.max(0,f0-1);n<=f0+1;n++){const y0=n===0?G+1:G+b.gf+1+FH*(n-1);if(y0>Math.min(b.detailTop,b.top-1)-2)break;
          const RF=n===f0?R:18;   // (the floors above and below only matter close to, through a hole or from the stairs)
          for(const f of roomProps(b,ax,az,n,ward)){if(Math.abs(f.x-p.pos.x)>RF||Math.abs(f.z-p.pos.z)>RF)continue;
            const fx=Math.floor(f.x),fz=Math.floor(f.z);if(!chunks.has(ckey(Math.floor(fx/CS),Math.floor(fz/CS))))continue;
            {const yb=f.base||y0;if(get(fx,yb-1,fz)===AIR||get(fx,yb,fz)!==AIR)continue;}   // (the floor under it gone, or rubble where it stood)
            if(got.has(f.key))continue;got.add(f.key);activeProps.push(f);drawProp(f);if(!f.low&&!downFix.has(f.key)&&!falling.has(f.key))propCells.set(propCK(f.x,f.y0,f.z),f);}}
      }
    }
  }
  // the handrails: a bar sloping up from post to post beside each flight (gone where a post's been knocked out)
  fallMatrix(0,0,0,0);
  for(const p of viewers()){const seenR=new Set();
    for(let px=Math.floor((p.pos.x-30)/CELL);px<=Math.floor((p.pos.x+30)/CELL);px++)for(let pz=Math.floor((p.pos.z-30)/CELL);pz<=Math.floor((p.pos.z+30)/CELL);pz++){
      if(biomeOf(px,pz)!=='city')continue;const Sx=superOf(px,pz);
      // (a big site's stairs are all listed on its first plot, which may be well out of this range)
      if(Sx&&seenR.has(Sx))continue;if(Sx)seenR.add(Sx);const ax=Sx?Sx.ax:px,az=Sx?Sx.az:pz;
      for(const b of plotInfo(ax,az).b)for(const S of b.stair2?[b.stair,b.stair2]:b.east?[b.stair,b.east.stair]:b.stair?[b.stair]:[]){const al=S.ax==='x',R0=(al?ax:az)*CELL+S.r0,CC=(al?az:ax)*CELL,Y=stairFloors(b);
        if(Math.abs((al?R0:CC+S.c0)-p.pos.x)>40||Math.abs((al?CC+S.c0:R0)-p.pos.z)>40)continue;
        for(let n=0;n+1<Y.length;n++){const L=Y[n+1]-Y[n],base=S.L-L;
          for(const c of [S.c0-1,S.c1])for(let r=base;r+1<S.L;r++){const sy=Y[n]+r-base,X=al?R0+r:CC+c,Z=al?CC+c:R0+r,X2=al?X+1:X,Z2=al?Z:Z+1;
            if(!chunks.has(ckey(Math.floor(X/CS),Math.floor(Z/CS)))||get(X,sy+1,Z)!==RAILPOST||get(X2,sy+2,Z2)!==RAILPOST)continue;
            pushSeg([X+.5,sy+1.95,Z+.5],[X2+.5,sy+2.95,Z2+.5],0.1);}
          // and level bars round the opening in the floor above
          {const yU=Y[n+1],hole=base+Math.max(0,L-4)-1,post=(r,c)=>{const X=al?R0+r:CC+c,Z=al?CC+c:R0+r;return chunks.has(ckey(Math.floor(X/CS),Math.floor(Z/CS)))&&get(X,yU,Z)===RAILPOST?[X+.5,yU+.95,Z+.5]:null;};
           for(const c of [S.c0-1,S.c1])for(let r=hole;r+1<S.L;r++){const A=post(r,c),B=post(r+1,c);if(A&&B)pushSeg(A,B,0.1);}
           for(let c=S.c0-1;c<S.c1;c++){const A=post(hole,c),B=post(hole,c+1);if(A&&B)pushSeg(A,B,0.1);}}}}
    }}
  FIX_BAR.count=nBar;FIX_BAR.instanceMatrix.needsUpdate=true;
  PROP_L.count=nPropL;PROP_G.count=nPropG;PROP_L.instanceMatrix.needsUpdate=true;PROP_G.instanceMatrix.needsUpdate=true;
  if(PROP_L.instanceColor)PROP_L.instanceColor.needsUpdate=true;if(PROP_G.instanceColor)PROP_G.instanceColor.needsUpdate=true;
}
function knockProps(x,y,z,r,dx,dz){for(const f of activeProps){const ex=f.x-x,ez=f.z-z,rr=r+f.rad;if(ex*ex+ez*ez<rr*rr&&Math.abs(f.y0+.5-y)<r+1.5)knockFix(f,dx||ex,dz||ez);}}
function refreshFixtures(){
  nBar=nGlow=nHead=nSign=nCol=nBoard=0;activeFix.length=0;const seen=new Set(),R=Math.min(viewFar(),96),bseen=new Set();
  for(const p of viewers()){
    
    for(let px=Math.floor((p.pos.x-R)/CELL);px<=Math.floor((p.pos.x+R)/CELL);px++)for(let pz=Math.floor((p.pos.z-R)/CELL);pz<=Math.floor((p.pos.z+R)/CELL);pz++){
      const ck=px*100003+pz;if(seen.has(ck))continue;seen.add(ck);
      if(!tenvShow(px,pz))continue;
      const X0=px*CELL,Z0=pz*CELL,near=Math.hypot(X0+4-p.pos.x,Z0+4-p.pos.z)<70;
      if(biomeOf(px,pz)==='plains')continue;
      const PBf=plotBounds(px,pz);
      for(const [lx,lz,rx,rz] of LAMP_SPOTS){if(superPart(X0+lx,Z0+lz)==='in')continue;if(!(lx===ROADW?segOpen(px,pz,0):lx===CELL-1?segOpen(px+1,pz,0):lz===ROADW?segOpen(px,pz,1):segOpen(px,pz+1,1)))continue;if(get(X0+lx,G,Z0+lz)===ASPHALT||get(X0+lx,G+1,Z0+lz)!==AIR)continue;if(lx>=PBf.x0&&lx<PBf.x1&&lz>=PBf.z0&&lz<PBf.z1)continue;const f={type:'lamp',key:'l'+(X0+lx)+','+(Z0+lz),x:X0+lx+0.5,z:Z0+lz+0.5,rx,rz};activeFix.push(f);drawFix(f,near);}
      // benches and litter bins along the pavements of the busier blocks, and along the paths in the parks
      for(const o of streetFurn(px,pz)){if(o.prop||o.on&&(get(Math.floor(o.x),G,Math.floor(o.z))!==o.on||get(Math.floor(o.x),G+1,Math.floor(o.z))!==AIR))continue;activeFix.push(o);drawFix(o,near);}
      const ct=ctlAt(px,pz);
      if(ct.k!=='none')for(let d=0;d<4;d++){
        const A=APPR[d],axis=d%2?'x':'z',v=DIRV[d];
        if(ct.k==='yield'&&ct.ax!==axis)continue;
        if(!segOpen(px,pz,(d+2)%4)||superPart(X0+A.c[0],Z0+A.c[1])==='in')continue;
        const f={type:ct.k==='light'?'signal':'sign',key:sigKey(px,pz,d),x:X0+A.c[0]+0.5,z:Z0+A.c[1]+0.5,s:A.s,ct,axis,yaw:Math.atan2(-v[0],-v[1])};
        activeFix.push(f);drawFix(f,near);
      }
    }
  }
  // billboards along the highways out on the plains (and the powerlines' cables)
  for(const p of TENV?[]:viewers()){const RB=Math.min(viewFar(),150),l=routesNearBox(p.pos.x-RB,p.pos.z-RB,p.pos.x+RB,p.pos.z+RB),rs=new Set();
    for(let q=0;q<l.length;q+=2){const Rt=l[q];if(rs.has(Rt))continue;rs.add(Rt);
      {const PY=pylonsOf(Rt);fallMatrix(0,0,0,0);
       for(let i=0;i+1<PY.length;i++){const A=PY[i],B=PY[i+1];if(!A||!B||Math.hypot(A.x-p.pos.x,A.z-p.pos.z)>RB+40)continue;if(bseen.has(A.key+'c'))continue;bseen.add(A.key+'c');
         if(get(A.x,G+A.h0+17,A.z)!==METAL||get(B.x,G+B.h0+17,B.z)!==METAL)continue;   // (a pylon knocked down drops its cables)
         const at=(P,o)=>o===0?[P.x+0.5,G+P.h0+19.5,P.z+0.5]:P.ax==='x'?[P.x+0.5+o*3,G+P.h0+16.4,P.z+0.5]:[P.x+0.5,G+P.h0+16.4,P.z+0.5+o*3];
         for(const o of [-1,0,1]){const a=at(A,o),b=at(B,o);let prev=a;for(let k=1;k<=8;k++){const t=k/8,q2=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-2.6*4*t*(1-t),a[2]+(b[2]-a[2])*t];pushSeg(prev,q2,0.07);prev=q2;}}}}
      for(const f of boardsOf(Rt)){if(bseen.has(f.key))continue;const d=Math.hypot(f.x-p.pos.x,f.z-p.pos.z);if(d>RB)continue;
        if(get(Math.floor(f.x),f.y0,Math.floor(f.z))!==AIR||get(Math.floor(f.x),f.y0-1,Math.floor(f.z))===AIR)continue;   // (its ground built, and still there)
        bseen.add(f.key);activeFix.push(f);drawFix(f,true);}}}
  FIX_BAR.count=nBar;FIX_GLOW.count=nGlow;FIX_BAR.instanceMatrix.needsUpdate=true;FIX_GLOW.instanceMatrix.needsUpdate=true;
  FIX_COL.count=nCol;FIX_COL.instanceMatrix.needsUpdate=true;if(FIX_COL.instanceColor)FIX_COL.instanceColor.needsUpdate=true;
  for(let i=nBoard;i<boards.length;i++)boards[i].g.visible=false;
  for(let i=nHead;i<heads.length;i++)heads[i].g.visible=false;
  for(let i=nSign;i<signs.length;i++)signs[i].g.visible=false;
  if(GFX_OFF.fixtures)for(const L of [boards,heads,signs])for(const o of L)o.g.visible=false;
  refreshProps();
}
function knockFix(f,dx,dz){
  if(downFix.has(f.key)||falling.has(f.key))return false;
  const ang=(dx||dz)?Math.atan2(dx,dz):Math.random()*Math.PI*2;
  if(f.prop){falling.set(f.key,{t:0,ang,x:f.x,z:f.z,prop:true,y:f.y0});tone('square',320,140,0.1,0.03);puff(f.x,f.y0+.5,f.z,2,0xbfc5ca,0.25);score+=5;trafficRefreshT=0;return true;}
  falling.set(f.key,{t:0,ang,x:f.x,z:f.z});
  clang();tone('square',240,90,0.22,0.05);
  if(f.type==='lamp')puff(f.x+f.rx*1.5,G+6.6,f.z+f.rz*1.5,6,0xfff0c0,0.35);
  else if(f.type==='board'){puff(f.x,G+7,f.z,14,0x9a948a,1.6);thud(0.5);score+=75;}
  else puff(f.x,G+1.4,f.z,4,0x9a948a,0.5);
  score+=25;trafficRefreshT=0;return true;
}
