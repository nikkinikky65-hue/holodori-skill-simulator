"""Fetch immutable upstream tables to an external cache, preserving capture hashes."""
import argparse, concurrent.futures, datetime, hashlib, json, pathlib, re, urllib.request
from holodoridb_all_card_survey import TABLES
p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args()
assert re.fullmatch('[0-9a-f]{40}',a.commit)
a.output.mkdir(parents=True,exist_ok=True)
names=TABLES+['Costume','LangCostume_Jpn','LiveLeaderSkill','LangLiveLeaderSkill_Jpn','LangGeneratedLiveLeaderSkill_Jpn']
def fetch(name):
    url=f'https://raw.githubusercontent.com/HolodoriDB/holodori-db-jpn-diff/{a.commit}/{name}.json'
    data=urllib.request.urlopen(url,timeout=60).read();json.loads(data);(a.output/(name+'.json')).write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,names))
(a.output/'capture.json').write_text(json.dumps({'commitSha':a.commit,'retrievedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':{n:hashlib.sha256((a.output/(n+'.json')).read_bytes()).hexdigest() for n in names}},indent=2)+'\n')
print(f'Captured {len(names)} immutable tables to {a.output}')
