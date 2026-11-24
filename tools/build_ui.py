# Builds ui.html: the game page with the three.js CDN script swapped for the stub THREE from tests/stub-three.js,
# so the Playwright UI tests can load the page offline. (Menus and DOM work; the 3D view renders nothing.)
# Usage: python3 build_ui.py ../game/index.html [ui.html]
import sys,os,build
build.build()
# (Explicit utf-8 and \n, because Windows otherwise reads as cp1252 and writes \r\n.)
html=open(sys.argv[1],encoding='utf-8',newline='').read()
here=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(here,'tests','stub-three.js'),encoding='utf-8',newline='').read()
stub=t[t.index('// ---- stub ----'):t.index('// ---- end stub ----')]
import re
# (the tag carries an integrity hash now, so it's found by its address rather than written out whole)
tags=re.findall(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/three\.js/r128/three\.min\.js"[^>]*></script>',html)
assert len(tags)==1,'three.js script tag not found'
tag=tags[0]
open(sys.argv[2] if len(sys.argv)>2 else 'ui.html','w',encoding='utf-8',newline='').write(html.replace(tag,'<script>'+stub+'</script>'))
