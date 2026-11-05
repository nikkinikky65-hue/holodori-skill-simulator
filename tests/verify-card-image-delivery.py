"""Offline mapping/URL checks. Does not access Worker or change source settings."""
from pathlib import Path
import json,re,subprocess,tempfile
ROOT=Path(__file__).resolve().parent.parent
JSC='/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
source=(ROOT/'card-image-resolver.js').read_text()
images=json.loads(re.search(r'const images = (\{.*?\});',source,re.S).group(1))
catalog=json.loads((ROOT/'data/runtime-cards.json').read_text())
cards={c['id']:c for c in catalog['cards']}
assert len(images)==93
paths=[]
for card, entries in images.items():
    assert card in cards and set(entries)=={'thin','thumb','full'}
    slug=cards[card]['member']['mapping']['id'].replace('_','-')
    names=set()
    for kind,path in entries.items():
        directory='portrait' if kind=='thin' else kind
        assert path.startswith(f'assets/cards/{directory}/'),path
        assert re.fullmatch(re.escape(slug)+r'-r5-c[0-9]{3,}\.webp',Path(path).name),path
        names.add(Path(path).name);paths.append(path)
    assert len(names)==1,card
assert len(paths)==len(set(paths))==279
for mode in ['local','worker']:
    script=source.replace("const source = 'worker';",f"const source = '{mode}';")
    script+='\nconst ids='+json.dumps(list(images))+';print(JSON.stringify(ids.map(id=>CardImageResolver.candidates(id))));\n'
    script+="if(CardImageResolver.candidates('missing').length)throw Error('unknown card');\n"
    with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
        f.write(script);f.flush()
        rows=json.loads(subprocess.check_output([JSC,f.name],cwd=ROOT,text=True))
    for card, row in zip(images,rows):
        assert [r['kind'] for r in row]==['thin','thumb','full']
        for item in row:
            original=images[card][item['kind']]
            expected=original if mode=='local' else 'https://holodori-image-proxy.nikkinikky65.workers.dev/'+original.removeprefix('assets/')
            assert item['url']==expected
    a=list(images).index('card-06003-5-uniq-0059-00');b=list(images).index('card-06003-5-uniq-0091-00')
    assert rows[a][0]['url']!=rows[b][0]['url']
    print(f'{mode}: {len(images)} cards, {sum(map(len,rows))} exact URLs, priority and identity PASS')
