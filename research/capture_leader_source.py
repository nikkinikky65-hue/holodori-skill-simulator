"""Preserve Leader source JSON values from the same immutable table cache as Cards."""
import argparse,hashlib,json,pathlib
p=argparse.ArgumentParser();p.add_argument('--source-dir',type=pathlib.Path,required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent;path=root/'holodoridb-leader-source.json'
old=json.loads(path.read_text());capture=json.loads((a.source_dir/'capture.json').read_text())
result={'format':old['format'],'provenance':{'repository':old['provenance']['repository'],'commitSha':capture['commitSha'],'representation':old['provenance']['representation'],'tables':{}},'tables':{}}
for table in old['tables']:
    data=(a.source_dir/(table+'.json')).read_bytes();assert hashlib.sha256(data).hexdigest()==capture['sha256'][table]
    rows=json.loads(data);result['tables'][table]=rows
    result['provenance']['tables'][table]={'url':f"https://raw.githubusercontent.com/HolodoriDB/holodori-db-jpn-diff/{capture['commitSha']}/{table}.json",'capturedAtUtc':capture['retrievedAtUtc'],'capturedJsonSha256':hashlib.sha256(json.dumps(rows,ensure_ascii=False).encode()).hexdigest()}
path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
