# Builds game/index.html, the one playable file, from src/: page.html with style.css and the scripts in src/js dropped in.
# It also builds game/patch-notes/index.html, the patch notes page on the website, from src/patch-notes.md, the same notes
# the menu's Patch notes tab shows, so the two can't drift apart.
# The scripts are one program split into files, not separate modules: they're joined in the order src/js/ORDER.txt gives
# and all share one scope, so any file can call anything in any other. (Order only matters for code that runs as the page loads.)
# Usage: python tools/build.py           -> rebuild (the test tools do this for themselves)
#        python tools/build.py --check   -> just say whether game/index.html is up to date; exit 1 if not
#        python tools/build.py --force   -> rebuild even over hand edits to the built files
import sys,os,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src')
OUT=os.path.join(ROOT,'game','index.html')
NOTES_OUT=os.path.join(ROOT,'game','patch-notes','index.html')
MARK_CSS='/* build: style.css */\n'
MARK_JS='// build: js\n'
MARK_NOTES='<!-- build: patch-notes -->'
MARK_LATEST='<!-- build: patch-notes-latest -->'
MARK_TOC='<!-- build: patch-notes-toc -->'
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

# ---- patch notes: src/patch-notes.md, in a small, fixed kind of Markdown ----
# "## " starts an update (its id is made from the heading, so links to it keep working), "### " a section in it,
# a line that's all **bold** a little heading, "- " a bullet; anything else is a paragraph. Inline: **bold**, `code`, [text](url).
# (Written out here rather than using a Markdown library, so the build still needs nothing but Python.)
import re,html as H
def inline(t):
  t=H.escape(t,quote=False)
  t=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',t)
  t=re.sub(r'`(.+?)`',r'<code>\1</code>',t)
  return re.sub(r'\[(.+?)\]\((\S+?)\)',lambda m:'<a href="%s">%s</a>'%(H.escape(m.group(2)),m.group(1)),t)
def slug(t):return re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')
def notes():
  # -> (html of all the updates, [(id, heading)] of each update, newest first)
  # Every update is a <details> that folds away to its heading: the newest starts open, the older ones start closed,
  # under an "Earlier updates" line (each <summary> has tabindex so the menu's controller navigation can reach it).
  out,ups,para,items,sec=[],[],[],[],False
  def flush():
    if para:out.append('<p>'+inline(' '.join(para))+'</p>');para.clear()
    if items:out.append('<ul>'+''.join('<li>'+inline(i)+'</li>' for i in items)+'</ul>');items.clear()
  for l in rd(os.path.join(SRC,'patch-notes.md')).split('\n'):
    l=l.rstrip()
    if l.startswith('# ') or not l:flush();continue
    if l.startswith('## '):
      flush()
      if sec:out.append('</details>')
      t=l[3:].strip();ups.append((slug(t),t));sec=True
      if len(ups)==2:out.append('<p class="pn-earlier">Earlier updates</p>')
      out.append('<details class="pn-up pn-fold%s" id="%s"%s><summary tabindex="0"><h2>%s</h2><span class="pn-tog" aria-hidden="true"></span></summary>'%(' pn-new' if len(ups)==1 else '',slug(t),' open' if len(ups)==1 else '',inline(t)))
    elif l.startswith('### '):flush();out.append('<h3>'+inline(l[4:].strip())+'</h3>')
    elif re.fullmatch(r'\*\*[^*]+\*\*',l):flush();out.append('<h4>'+inline(l[2:-2])+'</h4>')
    elif l.startswith('- '):
      if para:flush()
      items.append(l[2:].strip())
    elif items and l.startswith('  '):items[-1]+=' '+l.strip()
    else:
      if items:flush()
      para.append(l.strip())
  flush()
  if sec:out.append('</details>')
  if not ups:sys.exit('build: src/patch-notes.md has no "## " update headings')
  return '\n'.join(out)+'\n',ups

def one(html,mark,what,name):
  if html.count(mark)!=1:sys.exit('build: '+name+' must have the marker '+mark+' exactly once')
  return html.replace(mark,what)

def page():
  html=rd(os.path.join(SRC,'page.html'))
  if html.count(MARK_CSS)!=1 or html.count(MARK_JS)!=1:sys.exit('build: page.html must have each build marker exactly once')
  body,ups=notes()
  html=one(html,MARK_NOTES,body,'page.html')
  html=one(html,MARK_LATEST,inline(ups[0][1]),'page.html')
  html=html.replace(MARK_CSS,rd(os.path.join(SRC,'style.css')))
  return html.replace(MARK_JS,''.join(rd(os.path.join(SRC,'js',n)) for n in order()))

def notes_page():
  # (the website's own page of them, at <site>/patch-notes/)
  html=rd(os.path.join(SRC,'patch-notes.html'))
  body,ups=notes()
  html=one(html,MARK_NOTES,body,'patch-notes.html')
  return one(html,MARK_TOC,''.join('<li><a href="#%s">%s</a></li>'%(i,inline(t)) for i,t in ups),'patch-notes.html')

def stamp(body):return BANNER%hashlib.sha256(body.encode('utf-8')).hexdigest()

def hand_edited(old):
  # (The file carries the hash of what was built; a mismatch means someone changed it since, and rebuilding would lose that.)
  head,_,body=old.partition('\n')
  return head+'\n'!=stamp(body)

def built(): return ((OUT,page()),(NOTES_OUT,notes_page()))
def rel(p):return os.path.relpath(p,ROOT).replace('\\','/')

def build(force=False):
  changed=False
  for out,new in built():
    new=stamp(new)+new
    old=None
    if os.path.exists(out):old=open(out,encoding='utf-8',newline='').read()
    if old==new:continue
    if old is not None and not force and hand_edited(old):
      f=rel(out);sys.exit('build: '+f+' was edited by hand. The source is in src/ now: move those edits there (see "git diff --text '+f+'"), then "git checkout '+f+'" or build with --force.')
    os.makedirs(os.path.dirname(out),exist_ok=True)
    open(out,'w',encoding='utf-8',newline='').write(new)
    changed=True
  return changed

if __name__=='__main__':
  if '--check' in sys.argv:
    stale=[rel(out) for out,new in built() if not(os.path.exists(out) and open(out,encoding='utf-8',newline='').read()==stamp(new)+new)]
    print('game/index.html and game/patch-notes/index.html are up to date' if not stale else ' and '.join(stale)+(' is' if len(stale)<2 else ' are')+' out of date: run python tools/build.py')
    sys.exit(0 if not stale else 1)
  print('built game/index.html and game/patch-notes/index.html' if build('--force' in sys.argv) else 'game/index.html and game/patch-notes/index.html already up to date')
