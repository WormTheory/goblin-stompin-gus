# The editor's little server: python tools/editor/serve.py [port]  (then open http://localhost:8737/tools/editor/)
# It serves the repo's files (the editor page, src/js/core/assets.js, three.js from node_modules, the built game for the
# live preview) to this computer only, and has a few endpoints for the editor:
#   GET  /api/list                       every asset file, by kind, in _order.json order
#   GET  /api/read?kind=K&name=N         a file's text and when it was last changed (its stamp)
#   POST /api/write {kind,name,text,stamp}  write a file (JSON checked first); refused with 409 if the file changed on
#                                        disk since the editor read it (another thread, a git pull), so nothing's lost.
#                                        A new name is added to the end of its kind's _order.json
#   POST /api/delete {kind,name,stamp}   remove a file and its line in _order.json
#   POST /api/build                      run tools/build.py, as the Build button does
# Nothing outside src/assets/ is ever written, and only by name (letters, digits, - and _).
import http.server,json,os,re,subprocess,sys,urllib.parse
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS=os.path.join(ROOT,'src','assets')
KINDS=('weapons','clips','bodies')
NAME=re.compile(r'^[A-Za-z0-9_-]{1,64}$')

def order_path(kind):return os.path.join(ASSETS,kind,'_order.json')
def read_order(kind):
  with open(order_path(kind),encoding='utf-8') as f:return json.load(f)['order']
def write_order(kind,names):
  # (laid out as assetFmt lays it out, core/assets.js: inline while it fits in 100 characters)
  lst=json.dumps(names,separators=(',',':'),ensure_ascii=False);whole='{"order":'+lst+'}'
  if len(whole)<=100:t=whole
  else:t='{\n  "order": '+(lst if len(lst)<=100 else '[\n'+',\n'.join('    '+json.dumps(n,ensure_ascii=False) for n in names)+'\n  ]')+'\n}'
  with open(order_path(kind),'w',encoding='utf-8',newline='\n') as f:f.write(t+'\n')
def stamp(p):return str(os.stat(p).st_mtime_ns) if os.path.exists(p) else ''
def file_of(kind,name):
  if kind not in KINDS or not NAME.match(name or ''):raise ValueError('bad kind or name')
  return os.path.join(ASSETS,kind,name+'.json')

class H(http.server.SimpleHTTPRequestHandler):
  def __init__(s,*a,**k):super().__init__(*a,directory=ROOT,**k)
  def log_message(s,*a):pass
  def end_headers(s):
    s.send_header('Cache-Control','no-store')   # (always the file as it is now: the built game, a saved asset)
    super().end_headers()
  def reply(s,code,obj):
    b=json.dumps(obj).encode('utf-8');s.send_response(code);s.send_header('Content-Type','application/json');s.send_header('Content-Length',str(len(b)));s.end_headers();s.wfile.write(b)
  def do_GET(s):
    u=urllib.parse.urlparse(s.path);q=dict(urllib.parse.parse_qsl(u.query))
    try:
      if u.path=='/api/list':return s.reply(200,{k:read_order(k) for k in KINDS})
      if u.path=='/api/read':
        p=file_of(q.get('kind'),q.get('name'))
        with open(p,encoding='utf-8') as f:t=f.read().replace('\r\n','\n')
        return s.reply(200,{'text':t,'stamp':stamp(p)})
    except Exception as e:return s.reply(400,{'error':str(e)})
    return super().do_GET()
  def do_POST(s):
    # (only from this computer's own pages: a page elsewhere can't post here behind your back)
    o=s.headers.get('Origin')
    if o and not re.match(r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$',o):return s.reply(403,{'error':'not from this computer'})
    n=int(s.headers.get('Content-Length') or 0);body=json.loads(s.rfile.read(n) or b'{}') if n else {}
    u=urllib.parse.urlparse(s.path).path
    try:
      if u=='/api/write':
        kind,name=body['kind'],body['name'];p=file_of(kind,name);t=body['text']
        json.loads(t)   # (it must at least be JSON; the editor has checked the rest)
        if os.path.exists(p) and body.get('stamp')!=stamp(p):return s.reply(409,{'error':'changed on disk since you opened it','stamp':stamp(p)})
        if not os.path.exists(p) and body.get('stamp'):return s.reply(409,{'error':'deleted on disk since you opened it'})
        with open(p,'w',encoding='utf-8',newline='\n') as f:f.write(t if t.endswith('\n') else t+'\n')
        names=read_order(kind)
        if name not in names:names.append(name);write_order(kind,names)
        return s.reply(200,{'stamp':stamp(p)})
      if u=='/api/delete':
        kind,name=body['kind'],body['name'];p=file_of(kind,name)
        if os.path.exists(p) and body.get('stamp')!=stamp(p):return s.reply(409,{'error':'changed on disk since you opened it'})
        if os.path.exists(p):os.remove(p)
        write_order(kind,[x for x in read_order(kind) if x!=name])
        return s.reply(200,{})
      if u=='/api/build':
        r=subprocess.run([sys.executable,os.path.join(ROOT,'tools','build.py')],cwd=ROOT,capture_output=True,text=True)
        return s.reply(200,{'ok':r.returncode==0,'out':(r.stdout+r.stderr).strip()})
    except Exception as e:return s.reply(400,{'error':str(e)})
    s.reply(404,{'error':'no such endpoint'})

if __name__=='__main__':
  port=int(sys.argv[1]) if len(sys.argv)>1 else 8737
  srv=http.server.ThreadingHTTPServer(('127.0.0.1',port),H)
  print('editor at http://localhost:%d/tools/editor/  (Ctrl+C to stop)'%port)
  try:srv.serve_forever()
  except KeyboardInterrupt:pass
