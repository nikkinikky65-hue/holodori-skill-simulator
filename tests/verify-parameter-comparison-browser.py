"""Mac Chrome regression suite using isolated profiles and no image assets."""
from pathlib import Path
import functools
import http.server
import re
import subprocess
import tempfile
import threading
import json

ROOT=Path(__file__).resolve().parent.parent
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
pages=['unit-parameter-comparison-browser.html','unit-card-picker-browser.html',
       'unit-optimizer-browser.html','unit-formation-browser.html','unit-formations-browser.html','talent-filter-browser.html','catalog-talent-filter-browser.html','catalog-passive-filter-browser.html','card-display-order-browser.html','card-export-browser.html']
image_requests=[]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path.startswith('/assets/'):
            image_requests.append(self.path)
        super().do_GET()

server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
logs=Path(tempfile.mkdtemp(prefix='holodori-public-parameter-browser-'))
results=[]
try:
    for index,page in enumerate(pages):
        command=[CHROME,'--headless=new','--no-first-run','--no-default-browser-check',
                 '--disable-background-networking','--disable-sync','--disable-extensions',
                 '--disable-component-update','--user-data-dir='+str(logs/f'profile-{index}'),
                 '--dump-dom','--window-size=1920,1200','--virtual-time-budget=60000']
        if index==0:command.append('--screenshot='+str(logs/'comparison.png'))
        if page=='catalog-passive-filter-browser.html':command.append('--screenshot='+str(logs/'passive-filter.png'))
        if page=='talent-filter-browser.html':command.append('--screenshot='+str(logs/'talent-filter.png'))
        command.append(f'http://127.0.0.1:{server.server_port}/tests/'+page)
        result=subprocess.run(command,capture_output=True,text=True,timeout=120)
        (logs/(page+'.dom')).write_text(result.stdout)
        (logs/(page+'.stderr')).write_text(result.stderr)
        match=re.search(r'<pre[^>]*id="result"[^>]*>([\s\S]*?)</pre>',result.stdout)
        status=match.group(1) if match else 'NO RESULT'
        results.append({'page':page,'result':status,'returnCode':result.returncode})
        print(page+': '+status[:800],flush=True)
finally:
    server.shutdown();server.server_close()
report={'results':results,'imageRequests':image_requests,'logs':str(logs)}
(logs/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Image requests:',len(image_requests));print('ARTIFACTS',logs)
raise SystemExit(0 if not image_requests and all(r['returnCode']==0 and r['result'].startswith('PASS:') for r in results) else 1)
