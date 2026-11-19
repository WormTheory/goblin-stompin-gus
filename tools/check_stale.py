# Catches a stale copy of the patch notes or CLAUDE.md before it costs anyone their lines.
# Several threads share this folder. A thread holding an old copy of src/patch-notes.md or CLAUDE.md that writes it back
# whole takes out every note committed since (it's happened twice on 2026-11-19). This compares a copy against the branch
# and reports lines the branch has that the copy simply lacks: a line taken out with nothing in its place. (A line that's
# been reworded counts as changed, not lost, so ordinary edits pass.)
#
#   python tools/check_stale.py            the working copies here against HEAD (exit 1 if any lost lines)
#   python tools/check_stale.py --staged   what's staged (honours GIT_INDEX_FILE) against HEAD, plus the built patch notes
#   python tools/check_stale.py --fix      puts back the lost lines in the working copies: a three-way merge of the copy,
#                                          the commit it's an old copy of and HEAD, so anything uncommitted in it stays
# ALLOW_NOTES_REMOVAL=1 lets a deliberate removal through.
import difflib,os,re,subprocess,sys

GUARDED=['src/patch-notes.md','CLAUDE.md']
BUILT_NOTES='game/patch-notes/index.html'

def git(*a,inp=None,ok=(0,)):
  r=subprocess.run(['git']+list(a),input=inp,capture_output=True)
  if r.returncode not in ok:sys.exit('check_stale: git %s failed:\n%s'%(' '.join(a),r.stderr.decode('utf-8','replace')))
  return r

def text(b):return None if b is None else b.decode('utf-8','replace').replace('\r\n','\n')

def blob(spec):
  r=git('cat-file','blob',spec,ok=(0,128))
  return r.stdout if r.returncode==0 else None

def lost(head,mine):
  # (HEAD's lines with nothing in their place in mine: deletions, and the excess of a replacement that's shorter)
  a=head.split('\n');b=mine.split('\n');gone=[]
  for t,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
    if t=='delete':gone+=a[i1:i2]
    elif t=='replace' and i2-i1>j2-j1:
      # (keep the old lines least like any new one as the lost ones)
      new=b[j1:j2];old=sorted(a[i1:i2],key=lambda l:max([difflib.SequenceMatcher(None,l,n).quick_ratio() for n in new] or [0]))
      gone+=old[:(i2-i1)-(j2-j1)]
  return [l for l in gone if l.strip()]

def notes_items(html):
  # (the built patch notes' entries: each heading and list item, as text)
  return re.findall(r'<(?:li|h2|h3)[^>]*>(.*?)</(?:li|h2|h3)>',html or '',re.S)

def report(path,gone):
  print('check_stale: %s is missing %d line(s) that HEAD has, e.g.:'%(path,len(gone)))
  for l in gone[:3]:print('    '+l[:150])

def check_working():
  bad=0
  for p in GUARDED:
    if not os.path.isfile(p):continue
    gone=lost(text(blob('HEAD:'+p)) or '',text(open(p,'rb').read()))
    if gone:report(p,gone);bad+=1
  return bad

def check_staged():
  bad=0
  for p in GUARDED:
    if git('diff','--cached','--quiet','HEAD','--',p,ok=(0,1)).returncode==0:continue
    s=blob(':'+p)
    if s is None:continue
    gone=lost(text(blob('HEAD:'+p)) or '',text(s))
    if gone:report(p+' (staged)',gone);bad+=1
  if git('diff','--cached','--quiet','HEAD','--',BUILT_NOTES,ok=(0,1)).returncode:
    s=set(notes_items(text(blob(':'+BUILT_NOTES))))
    gone=[i for i in notes_items(text(blob('HEAD:'+BUILT_NOTES))) if i not in s]
    if gone:
      print('check_stale: the staged %s is an older build: it lacks %d note(s) HEAD has, e.g.:\n    %s'
            %(BUILT_NOTES,len(gone),re.sub('<[^>]+>','',gone[0])[:150]))
      bad+=1
  return bad

def fix():
  for p in GUARDED:
    mine=open(p,'rb').read();cur=text(mine);head=text(blob('HEAD:'+p))
    if not lost(head,cur):continue
    # (the commit this copy is an old copy of: the recent version of the file it differs from least)
    best=None
    for c in git('log','--format=%H','-80','HEAD','--',p).stdout.decode().split():
      old=text(blob('%s:%s'%(c,p)))
      n=sum(max(i2-i1,j2-j1) for t,i1,i2,j1,j2 in
            difflib.SequenceMatcher(None,old.split('\n'),cur.split('\n'),autojunk=False).get_opcodes() if t!='equal')
      if best is None or n<best[0]:best=(n,c,old)
      if n==0:break
    n,c,base=best
    tmp=[p+'.cs-'+k for k in ('mine','base','head')]
    for f,d in zip(tmp,(cur,base,head)):open(f,'w',encoding='utf-8',newline='\n').write(d)
    r=git('merge-file','-p',*tmp,ok=range(0,128))
    for f in tmp:os.remove(f)
    if r.returncode:
      print('check_stale: %s: the copy here is %s plus changes that clash with what was committed since; left as it is.'
            ' Put its own changes on top of HEAD\'s version by hand.'%(p,c[:7]));continue
    out=r.stdout.decode('utf-8')
    if b'\r\n' in mine:out=out.replace('\n','\r\n')
    if open(p,'rb').read()!=mine:print('check_stale: %s changed while merging; left as it is'%p);continue
    open(p,'w',encoding='utf-8',newline='').write(out)
    print('check_stale: %s was an old copy (of %s, %d line(s) off); merged up to HEAD, its own changes kept'%(p,c[:7],n))

def main():
  os.chdir(git('rev-parse','--show-toplevel').stdout.decode().strip())
  a=sys.argv[1:]
  if '--fix' in a:fix();a=[]
  bad=check_staged() if '--staged' in a else check_working()
  if not bad:return 0
  if os.environ.get('ALLOW_NOTES_REMOVAL')=='1':print('check_stale: ALLOW_NOTES_REMOVAL=1, so letting it through');return 0
  print('Another thread\'s committed lines would be lost. Never write these files whole here: make targeted edits and '
        'commit through tools/safe_commit.py.\nTo merge a stale working copy back up to HEAD (keeping its own changes): '
        'python tools/check_stale.py --fix\nIf the removal is deliberate: ALLOW_NOTES_REMOVAL=1')
  return 1

if __name__=='__main__':sys.exit(main())
