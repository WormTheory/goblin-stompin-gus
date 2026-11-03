import sys
# (Explicit utf-8 and \n, because Windows otherwise reads as cp1252 and writes \r\n, which breaks the tests' closing-line regex.)
s=open(sys.argv[1],encoding='utf-8',newline='').read();i=s.index('<script>',s.index('three.min.js'))+8;j=s.index('</script>',i);open(sys.argv[2] if len(sys.argv)>2 else 'g.js','w',encoding='utf-8',newline='').write(s[i:j])
