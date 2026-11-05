# Builds game/index.html, the one playable file, from src/: page.html with style.css and the scripts in src/js dropped in.
# The scripts are one program split into files, not separate modules: they're joined in the order src/js/ORDER.txt gives
# and all share one scope, so any file can call anything in any other. (Order only matters for code that runs as the page loads.)
# Usage: python tools/build.py           -> rebuild (the test tools do this for themselves)
#        python tools/build.py --check   -> just say whether game/index.html is up to date; exit 1 if not
#        python tools/build.py --force   -> rebuild even over hand edits to game/index.html
import sys,os,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src')
OUT=os.path.join(ROOT,'game','index.html')
MARK_CSS='/* build: style.css */\n'
MARK_JS='// build: js\n'
BANNER='<!-- Built by tools/build.py from src/: edit there, not here. sha256:%s -->\n'

def rd(p):
  # (Explicit utf-8 and \n, because Windows otherwise reads as cp1252 and writes \r\n, which breaks the tests' closing-line regex.)
  s=open(p,encoding='utf-8',newline='').read().replace('\r\n','\n')
  return s if s.endswith('\n') else s+'\n'

def order():
  names=[l.strip() for l in rd(os.path.join(SRC,'js','ORDER.txt')).split('\n')]
  names=[n for n in names if n and not n.startswith('#')]
  # (A file left off the list would silently vanish from the game, and a name listed twice would declare everything twice.)
  have={os.path.relpath(os.path.join(d,f),os.path.join(SRC,'js')).replace('\\','/') for d,_,fs in os.walk(os.path.join(SRC,'js')) for f in fs if f.endswith('.js')}
  for why,bad in (('in src/js but not in ORDER.txt',have-set(names)),('in ORDER.txt but not in src/js',set(names)-have)):
    if bad:sys.exit('build: '+why+': '+', '.join(sorted(bad)))
  if len(set(names))!=len(names):sys.exit('build: a file is listed twice in ORDER.txt')
  return names

def page():
  html=rd(os.path.join(SRC,'page.html'))
  if html.count(MARK_CSS)!=1 or html.count(MARK_JS)!=1:sys.exit('build: page.html must have each build marker exactly once')
  html=html.replace(MARK_CSS,rd(os.path.join(SRC,'style.css')))
  return html.replace(MARK_JS,''.join(rd(os.path.join(SRC,'js',n)) for n in order()))

def stamp(body):return BANNER%hashlib.sha256(body.encode('utf-8')).hexdigest()

def hand_edited(old):
  # (The file carries the hash of what was built; a mismatch means someone changed it since, and rebuilding would lose that.)
  head,_,body=old.partition('\n')
  return head+'\n'!=stamp(body)

def build(force=False):
  new=page();new=stamp(new)+new
  old=None
  if os.path.exists(OUT):old=open(OUT,encoding='utf-8',newline='').read()
  if old==new:return False
  if old is not None and not force and hand_edited(old):
    sys.exit('build: game/index.html was edited by hand. The source is in src/ now: move those edits there (see "git diff --text game/index.html"), then "git checkout game/index.html" or build with --force.')
  open(OUT,'w',encoding='utf-8',newline='').write(new)
  return True

if __name__=='__main__':
  if '--check' in sys.argv:
    new=page();ok=os.path.exists(OUT) and open(OUT,encoding='utf-8',newline='').read()==stamp(new)+new
    print('game/index.html is up to date' if ok else 'game/index.html is out of date: run python tools/build.py')
    sys.exit(0 if ok else 1)
  print('built game/index.html' if build('--force' in sys.argv) else 'game/index.html already up to date')
