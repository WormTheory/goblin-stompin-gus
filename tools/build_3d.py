# Builds t3.html: the game page using the local three.js from node_modules (not the CDN), with a few internals on
# window.__G, so tools/ui/real3d.js can take real screenshots. (game/index.html itself is left alone.)
# Usage: python tools/build_3d.py game/index.html tools/ui/t3.html
import sys,build
build.build()
html=open(sys.argv[1],encoding='utf-8',newline='').read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert html.count(tag)==1,'three.js script tag not found'
end='requestAnimationFrame(frame);\n})();'
assert html.count(end)==1,'closing lines not found'
html=html.replace(tag,'<script src="../../node_modules/three/build/three.min.js"></script>')
# (so a shot looking down from above a sliced-off roof still shows the props on the floor it's looking at)
key='const f0=Math.max(0,Math.floor((p.pos.y-G-1-b.gf)/FH)+1);'
assert key in html
html=html.replace(key,'const f0=Math.max(0,Math.floor(((window.__propY||p.pos.y)-G-1-b.gf)/FH)+1);')
html=html.replace(end,'window.__G={DT,regionSpot:()=>{const k=[...REGIONS.values()][0].members[0],e=meshes.get(k);return [e.cx*CS+8,e.cz*CS+8];},regionCount:()=>REGIONS.size,editsNow:()=>edits,regions:(on)=>{regionsOn=on;if(!on)for(const k of [...REGIONS.keys()])regionUnmerge(k);return REGIONS.size;},bldgAt,collapseBuilding,topples,bodies,CELL,FH,G,crush,scene,ST,stFlySet,venues,bigPlainsAt,planeHit,boatVenue,boatHit,BOATS,goblins,get,setKind,setFront,settlementLat,coastType,seaPlot,coastOwner,coastD,wcDoor,wcRooms,mallWC,arenaWC,capGeo,stadiumField,TRAINS,renderer,THREE,refreshProps,activeProps,get propBoxes(){return nPropL+nPropG},stFind,stGroups,coastType,coastD,seaBlk,SEA_T,plotInfo,superOf,ctlAt,jDeg,segOpen,players,siteProps,siteKind,routesNearBox,rtPoint,surfaceAt,biomeOf,plotType,axisSpan,placeAt,hwDeadEnd,hwRampAt,cloverAt,icOf,sideUsed,seaPlot,settlementAt,AX_KIND,ROUTES,cars,solidAt,get seed(){return seed},get edits(){return edits},get score(){return score}};\n'+end)
open(sys.argv[2] if len(sys.argv)>2 else 't3.html','w',encoding='utf-8',newline='').write(html)
