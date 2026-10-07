"""Project explicit Canonical Card→Character and CharacterGrouping membership only."""
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
b=(ROOT/'research/canonical-cards.json').read_bytes();c=json.loads(b)
tables={}
for row in c['sourceRecords']:tables.setdefault(row['table'],{})[row['sourceId']]=row['fields']
card_characters={card['sourceCard']['sourceId']:tables['Card'][card['sourceCard']['sourceId']]['characterId'] for card in c['cards']}
groups={id:{'name':tables['LangCharacterGrouping_Jpn'][row['nameLangId']]['text'],'characterIds':row['characterIds'],'source':{'table':'CharacterGrouping','sourceId':id}} for id,row in tables['CharacterGrouping'].items()}
assert all(character in tables['Character'] for character in card_characters.values())
assert all(all(isinstance(character,str) for character in group['characterIds']) for group in groups.values())
assert len(card_characters)==185 and all(isinstance(g['characterIds'],list) for g in groups.values())
result={'format':'holodori-affiliations-v1','canonicalSha256':hashlib.sha256(b).hexdigest(),'sourceCommit':c['sourceDataset']['commitSha'],'cardCharacters':card_characters,'groups':groups}
out=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode();path=ROOT/'data/runtime-affiliations.json'
if args.check:assert path.read_bytes()==out
else:path.write_bytes(out)
print(f'Affiliations: {len(card_characters)} cards / {len(groups)} groups; {len(out)} bytes; reproduction PASS' if args.check else f'Generated {len(out)} bytes')
