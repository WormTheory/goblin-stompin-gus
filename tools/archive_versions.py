# Builds the website's copies of earlier versions, so the Patch notes can link to them: for every git tag vX
# (v0.1, v0.2, ...), <site>/v/X/ gets the game/ folder from that tagged commit, exactly as it was released.
# The Pages workflow runs it on every deploy, so tagging a release is all it takes:
#   git tag v0.2 && git push origin v0.2
# Usage: python tools/archive_versions.py <site folder>
#
# All the versions share one website, and so one localStorage. An old version must not load the current game's saves
# (a newer world or save format it doesn't understand) or overwrite them, so its copy gets a small script, before the
# game's own, that keeps its keys apart: every localStorage key it reads or writes is prefixed "gsg-vX:". (The game
# only uses getItem, setItem and removeItem; key, length and clear are covered too, in case an old one ever did.)
# It also shows a little badge saying which version this is, with a link back to the current one.
import sys,os,re,io,json,tarfile,subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SHIM='''<script>/* Added by tools/archive_versions.py: this is version %(v)s, kept for playing old versions. Its saves and
   settings live under their own "%(p)s" keys, so it can't read or overwrite the current game's. */
(function(){var P=%(pj)s,S=Storage.prototype,g=S.getItem,s=S.setItem,r=S.removeItem,k=S.key,c=S.clear,
  len=Object.getOwnPropertyDescriptor(S,'length');
 function L(o){try{return o===window.localStorage}catch(e){return false}}
 function mine(o){var a=[],n=len.get.call(o);for(var i=0;i<n;i++){var x=k.call(o,i);if(x&&x.indexOf(P)===0)a.push(x)}return a}
 S.getItem=function(n){return g.call(this,L(this)?P+n:n)};
 S.setItem=function(n,v){return s.call(this,L(this)?P+n:n,v)};
 S.removeItem=function(n){return r.call(this,L(this)?P+n:n)};
 S.key=function(i){if(!L(this))return k.call(this,i);var a=mine(this);return i>=0&&i<a.length?a[i].slice(P.length):null};
 S.clear=function(){if(!L(this))return c.call(this);var o=this;mine(o).forEach(function(x){r.call(o,x)})};
 Object.defineProperty(S,'length',{configurable:true,enumerable:true,get:function(){return L(this)?mine(this).length:len.get.call(this)}});
 addEventListener('DOMContentLoaded',function(){var d=document.createElement('div');
  d.style.cssText='position:fixed;top:4px;left:50%%;transform:translateX(-50%%);z-index:2147483647;font:600 12px system-ui,sans-serif;'+
   'background:rgba(18,22,28,.9);color:#eef0e6;border:1px solid #b98a5a;padding:3px 10px;white-space:nowrap;pointer-events:auto';
  d.innerHTML='Version '+%(vj)s+', an older version \\u00b7 <a href="../../" style="color:#7fc24a">Play the latest</a>';
  document.body.appendChild(d);});
})();</script>
'''

def git(*a,**k):return subprocess.run(['git','-C',ROOT]+list(a),check=True,capture_output=True,**k).stdout

def archive(site):
  tags=[t for t in git('tag','-l','v*',text=True).split() if re.fullmatch(r'v[0-9A-Za-z.\-]+',t)]
  for t in tags:
    v=t[1:];dest=os.path.join(site,'v',v)
    with tarfile.open(fileobj=io.BytesIO(git('archive','--format=tar',t,'game'))) as tar:
      for m in tar.getmembers():
        if not m.isfile():continue
        out=os.path.join(dest,os.path.relpath(m.name,'game'))
        os.makedirs(os.path.dirname(out),exist_ok=True)
        open(out,'wb').write(tar.extractfile(m).read())
    page=os.path.join(dest,'index.html')
    html=open(page,encoding='utf-8',newline='').read()
    shim=SHIM%{'v':v,'p':'gsg-v'+v+':','pj':json.dumps('gsg-v'+v+':'),'vj':json.dumps(v)}
    # (after the build's banner comment, if it has one, and before anything of the game's)
    head,nl,rest=html.partition('\n')
    html=head+nl+shim+rest if head.startswith('<!--') else shim+html
    open(page,'w',encoding='utf-8',newline='').write(html)
    print('archived',t,'at v/'+v+'/')
  # (every older "Version X" in the notes gets a Play link, which leads nowhere until vX is tagged and pushed)
  notes=open(os.path.join(ROOT,'src','patch-notes.md'),encoding='utf-8').read()
  for v in re.findall(r'^## Version (\S+)\s*$',notes,re.M)[1:]:
    if 'v'+v not in tags:print('::warning::The patch notes link to version %s, but there is no tag v%s, so its Play link will 404. Tag the commit it was released at: git tag v%s <commit> && git push origin v%s'%(v,v,v,v))

if __name__=='__main__':
  if len(sys.argv)!=2:sys.exit('usage: python tools/archive_versions.py <site folder>')
  archive(sys.argv[1])
