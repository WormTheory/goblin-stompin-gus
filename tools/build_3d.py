# Builds t3.html: the game page using the local three.js from node_modules (not the CDN), with a few internals on
# window.__G, so tools/ui/real3d.js can take real screenshots. (game/index.html itself is left alone.)
# Usage: python tools/build_3d.py game/index.html tools/ui/t3.html
import sys
html=open(sys.argv[1],encoding='utf-8',newline='').read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert html.count(tag)==1,'three.js script tag not found'
end='requestAnimationFrame(frame);\n})();'
assert html.count(end)==1,'closing lines not found'
html=html.replace(tag,'<script src="../../node_modules/three/build/three.min.js"></script>')
html=html.replace(end,'window.__G={refreshProps,activeProps,get propBoxes(){return nPropL+nPropG},stFind,stGroups,coastType,coastD,seaBlk,SEA_T,plotInfo,superOf,ctlAt,jDeg,segOpen,players,routesNearBox,rtPoint,surfaceAt,biomeOf,plotType,axisSpan,placeAt,hwDeadEnd,hwRampAt,cloverAt,icOf,sideUsed,seaPlot,settlementAt,AX_KIND,ROUTES,cars,get seed(){return seed},get edits(){return edits},get score(){return score}};\n'+end)
open(sys.argv[2] if len(sys.argv)>2 else 't3.html','w',encoding='utf-8',newline='').write(html)
