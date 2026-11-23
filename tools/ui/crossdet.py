# The cross-browser determinism check (plan section 13). Serves the repository's root and takes each browser's hashes from
# crossdet.html. Usage: python tools/ui/crossdet.py [port], then open http://localhost:<port>/tools/ui/crossdet.html?b=<name>
# in each browser (crossdet.js does Chromium through Playwright, and Firefox if it's installed, headless). Each result goes
# into tools/ui/crossdet-<name>.json; once two or more are in, it prints whether they match.
import http.server,json,os,sys,urllib.parse,glob
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'));HERE=os.path.dirname(os.path.abspath(__file__))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k):super().__init__(*a,directory=ROOT,**k)
    def log_message(s,*a):pass
    def do_POST(s):
        q=urllib.parse.parse_qs(urllib.parse.urlparse(s.path).query);b=q.get('b',['x'])[0].replace('/','_')
        n=int(s.headers.get('Content-Length',0));d=s.rfile.read(n)
        open(os.path.join(HERE,'crossdet-%s.json'%b),'wb').write(d);s.send_response(200);s.end_headers();s.wfile.write(b'ok')
        R={}
        for f in glob.glob(os.path.join(HERE,'crossdet-*.json')):
            try:R[os.path.basename(f)[9:-5]]=json.load(open(f))
            except Exception:pass
        print('got',b,flush=True)
        if len(R)>1:
            ks=sorted(R);a=R[ks[0]]
            for k in ks[1:]:
                o=R[k];bad=[x for x,y in zip(a.get('out',[]),o.get('out',[])) if x!=y]
                print('%s vs %s: chunks %d, different %d, numbers %s'%(ks[0],k,len(a.get('out',[])),len(bad),'same' if a.get('nums')==o.get('nums') else 'DIFFERENT'),flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8741),H).serve_forever()
