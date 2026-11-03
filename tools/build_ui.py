# Builds ui.html: the game page with the three.js CDN script swapped for the stub THREE from tests/dead6.js,
# so the Playwright UI tests can load the page offline. (Menus and DOM work; the 3D view renders nothing.)
# Usage: python3 build_ui.py ../game/index.html [ui.html]
import sys,os
# (Explicit utf-8 and \n, because Windows otherwise reads as cp1252 and writes \r\n.)
html=open(sys.argv[1],encoding='utf-8',newline='').read()
here=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(here,'tests','dead6.js'),encoding='utf-8',newline='').read()
stub=t[t.index('class Q{'):t.index('const listeners=')]
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert html.count(tag)==1,'three.js script tag not found'
open(sys.argv[2] if len(sys.argv)>2 else 'ui.html','w',encoding='utf-8',newline='').write(html.replace(tag,'<script>'+stub+'</script>'))
