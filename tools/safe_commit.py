# Commits one thread's changes to the current branch without undoing anything another thread committed meanwhile.
# Several threads work in this one folder at once. A thread that copies a file aside, edits it and later commits that copy
# silently takes back every line others committed in between (that's how patch notes kept losing entries). So this commits
# only the thread's own change: for each file, a three-way merge of its copy against the commit it started from (--base)
# and the branch as it is now. A conflict stops it with nothing committed.
#
# Usage: python tools/safe_commit.py --base <sha the thread started from> --from <scratch dir> -m "message" [files...]
#   files: paths relative to the repo (as in the scratch dir). Left out, every file in the scratch dir that differs from
#          --base is taken (not allowed when --from is this folder itself, since others' unfinished edits are in it).
#   -m may be given more than once (one paragraph each); -F file reads the message from a file.
#   The built files (--generated, by default game/index.html, game/patch-notes/index.html, game/version.json) are never
#   merged: when anything in src/ changes, the merged tree is built afresh in a temporary worktree (--rebuild-cmd, by
#   default "python tools/build.py") and those come from there. --no-rebuild skips that.
#   The branch is moved only if it's still where it was read (git update-ref <new> <old>); if another thread got in first,
#   it all starts again from the new tip (up to 5 times).
import argparse,collections,os,shutil,subprocess,sys,tempfile

GENERATED=['game/index.html','game/patch-notes/index.html','game/version.json']
# (A merge that drops a line from these that the thread itself didn't delete is refused outright.)
GUARDED=['src/patch-notes.md','CLAUDE.md']
TRIES=5

def git(*a,inp=None,env=None,cwd=None,ok=(0,)):
  r=subprocess.run(['git']+list(a),input=inp,capture_output=True,env=env,cwd=cwd)
  if r.returncode not in ok:
    sys.exit('safe_commit: git %s failed:\n%s'%(' '.join(a),r.stderr.decode('utf-8','replace')))
  return r

def out(*a,**k):return git(*a,**k).stdout.decode('utf-8').strip()

def blob(rev,path):
  # (The file as stored in the repo at rev, or None if it isn't there.)
  r=git('cat-file','blob','%s:%s'%(rev,path),ok=(0,128))
  return r.stdout if r.returncode==0 else None

def stored(path,file):
  # (A file from disk as the repo would store it: line endings normalized by .gitattributes. Also writes the blob.)
  sha=out('hash-object','-w','--path='+path,file)
  return git('cat-file','blob',sha).stdout

def mode(rev,path):
  s=out('ls-tree',rev,'--',path)
  return s.split()[0] if s else '100644'

def merge3(path,ours,base,theirs,tmp):
  # (ours: the thread's copy, base: what it started from, theirs: the branch now. Lines others added since base stay.)
  if ours==base:return theirs
  if theirs==base or theirs==ours:return ours
  fs=[]
  for n,d in (('ours',ours),('base',base or b''),('theirs',theirs or b'')):
    f=os.path.join(tmp,n);open(f,'wb').write(d);fs.append(f)
  r=git('merge-file','-p','-L','this thread','-L','base','-L','branch now',*fs,ok=range(0,128))
  if r.returncode:
    sys.exit('safe_commit: %s: %d conflict(s) between this thread\'s change and what was committed since --base. '
             'Nothing was committed. Make the change again on top of the branch as it is now.'%(path,r.returncode))
  return r.stdout

def lost_lines(base,ours,theirs,result):
  # (Lines in the branch now that the result drops, other than ones the thread itself deleted.)
  L=lambda b:collections.Counter((b or b'').split(b'\n'))
  return (L(theirs)-L(result))-(L(base)-L(ours))

def scratch_files(src,base):
  tracked=set(out('ls-tree','-r','--name-only',base).split('\n'))
  found=[]
  for d,dirs,fs in os.walk(src):
    dirs[:]=[x for x in dirs if x not in ('.git','node_modules')]
    for f in fs:
      p=os.path.relpath(os.path.join(d,f),src).replace('\\','/')
      if p in tracked:found.append(p)
      elif git('check-ignore','-q',p,ok=(0,1)).returncode==1:found.append(p)
  return sorted(found)

def rebuild(tree,old,cmd,gen,idx_env):
  # (Builds the merged tree in a throwaway worktree and puts the built files into the temporary index.)
  c0=out('commit-tree',tree,'-p',old,'-m','safe_commit: temporary, for building')
  wt=tempfile.mkdtemp(prefix='safe-commit-build-')
  os.rmdir(wt)
  git('worktree','add','--detach','-q',wt,c0)
  try:
    r=subprocess.run(cmd,cwd=wt,shell=isinstance(cmd,str))
    if r.returncode:sys.exit('safe_commit: the build failed (exit %d); nothing was committed.'%r.returncode)
    for p in gen:
      f=os.path.join(wt,p)
      if not os.path.exists(f):continue
      sha=out('hash-object','-w','--path='+p,f,cwd=wt)
      git('update-index','--add','--cacheinfo','%s,%s,%s'%(mode(old,p),sha,p),env=idx_env)
  finally:
    git('worktree','remove','--force',wt,ok=(0,128))
    shutil.rmtree(wt,ignore_errors=True)
    git('worktree','prune')

def main():
  ap=argparse.ArgumentParser(description='Commit a thread\'s own changes without undoing other threads\' commits.')
  ap.add_argument('--base',required=True,help='the commit the thread started from')
  ap.add_argument('--from',dest='src',required=True,help='the folder holding the thread\'s copies')
  ap.add_argument('-m',dest='msg',action='append',default=[])
  ap.add_argument('-F',dest='msgfile')
  ap.add_argument('--branch',help='default: the branch checked out here')
  ap.add_argument('--rebuild-cmd',help='default: python tools/build.py, when anything in src/ changes')
  ap.add_argument('--no-rebuild',action='store_true')
  ap.add_argument('--generated',action='append',help='a built file (repeatable); default: '+', '.join(GENERATED))
  ap.add_argument('files',nargs='*')
  a=ap.parse_args()
  if not a.msg and not a.msgfile:sys.exit('safe_commit: give a message with -m or -F')
  top=out('rev-parse','--show-toplevel')
  os.chdir(top)
  src=os.path.abspath(a.src)
  base=out('rev-parse','--verify',a.base+'^{commit}')
  branch=a.branch or out('symbolic-ref','--short','HEAD')
  ref='refs/heads/'+branch
  gen=a.generated or GENERATED
  same=os.path.normcase(os.path.realpath(src))==os.path.normcase(os.path.realpath(top))
  if a.files:files=[f.replace('\\','/') for f in a.files]
  elif same:sys.exit('safe_commit: --from is the shared folder itself: name the files to commit')
  else:files=scratch_files(src,base)
  for f in files:
    if not os.path.isfile(os.path.join(src,f)):sys.exit('safe_commit: %s is not in %s'%(f,src))
  tmp=tempfile.mkdtemp(prefix='safe-commit-')
  try:
    # (The thread's copies, as the repo stores them, and what it started from: neither changes between tries.)
    ours={f:stored(f,os.path.join(src,f)) for f in files}
    based={f:blob(base,f) for f in files}
    mine=[f for f in files if ours[f]!=based[f]]
    built=[f for f in mine if f in gen]
    mine=[f for f in mine if f not in gen]
    want=not a.no_rebuild and any(f.startswith('src/') for f in mine) and os.path.exists('tools/build.py')
    if a.rebuild_cmd:want=not a.no_rebuild
    if built and not want:
      sys.exit('safe_commit: built files can\'t be merged (%s): let it rebuild them, or leave them out'%', '.join(built))
    if not mine:sys.exit('safe_commit: nothing differs from --base; nothing to commit')
    cmd=a.rebuild_cmd or [sys.executable,'tools/build.py']
    idx=os.path.join(tmp,'index')
    env=dict(os.environ,GIT_INDEX_FILE=idx)
    for n in range(TRIES):
      old=out('rev-parse','--verify',ref)
      res={}
      for f in mine:
        theirs=blob(old,f)
        res[f]=merge3(f,ours[f],based[f],theirs,tmp)
        if f in GUARDED:
          gone=lost_lines(based[f],ours[f],theirs,res[f])
          if gone:
            sys.exit('safe_commit: %s would lose %d line(s) committed by others, e.g.:\n  %s\nNothing was committed.'
                     %(f,sum(gone.values()),list(gone)[0][:160].decode('utf-8','replace')))
      if os.path.exists(idx):os.remove(idx)
      git('read-tree',old,env=env)
      for f in mine:
        sha=out('hash-object','-w','--stdin','--no-filters',inp=res[f])
        git('update-index','--add','--cacheinfo','%s,%s,%s'%(mode(old,f),sha,f),env=env)
      if want:rebuild(out('write-tree',env=env),old,cmd,gen,env)
      tree=out('write-tree',env=env)
      if tree==out('rev-parse',old+'^{tree}'):sys.exit('safe_commit: the branch already has these changes')
      margs=['-F',a.msgfile] if a.msgfile else sum((['-m',m] for m in a.msg),[])
      new=out('commit-tree',tree,'-p',old,*margs)
      subj=(open(a.msgfile,encoding='utf-8').readline() if a.msgfile else a.msg[0]).strip()
      if git('update-ref','-m','commit (safe_commit): '+subj,ref,new,old,ok=(0,1,128)).returncode==0:break
      print('safe_commit: %s moved while committing; merging again (%d)'%(branch,n+1))
    else:sys.exit('safe_commit: %s kept moving; nothing was committed'%branch)
    sync(old,new,branch)
    print('safe_commit: %s %s'%(branch,new[:7]))
  finally:shutil.rmtree(tmp,ignore_errors=True)

def sync(old,new,branch):
  # (Brings this folder's copies and index up to the new commit, but only where nobody has uncommitted changes.)
  if out('symbolic-ref','--short','-q','HEAD')!=branch:return
  for p in out('diff','--name-only',old,new).split('\n'):
    if not p:continue
    was=blob(old,p);now=blob(new,p)
    st=out('ls-files','-s','--',p)
    ix=st.split()[1] if st else None
    oldsha=out('rev-parse','%s:%s'%(old,p)) if was is not None else None
    newsha=out('rev-parse','%s:%s'%(new,p)) if now is not None else None
    if ix==oldsha and now is not None:
      git('update-index','--add','--cacheinfo','%s,%s,%s'%(mode(new,p),newsha,p),ok=(0,128))
    elif ix not in (oldsha,newsha):
      print('safe_commit: warning: %s is staged with other changes; left as it is'%p)
    f=os.path.join(os.getcwd(),p)
    have=stored(p,f) if os.path.isfile(f) else None
    if have==was and now is not None:
      d=git('cat-file','--filters','--path='+p,'%s:%s'%(new,p)).stdout
      os.makedirs(os.path.dirname(f) or '.',exist_ok=True)
      open(f,'wb').write(d)
    elif have!=now:
      print('safe_commit: warning: %s has uncommitted changes here, so it wasn\'t updated to the new commit'%p)

if __name__=='__main__':main()
