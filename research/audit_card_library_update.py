"""Reproducible card-ID diff against the preserved 185-card semantic baseline."""
import argparse,hashlib,json,pathlib
from card_update_integrity import runtime_card_digest
root=pathlib.Path(__file__).resolve().parent.parent
read=lambda p:json.loads((root/p).read_text())
b=read('research/card-library-baseline-185.json');c=read('research/canonical-cards.json');r=read('data/runtime-cards.json')
old=set(b['runtimeCardDigests']);now={x['id']:x for x in r['cards']}
updated=[id for id in sorted(old&now.keys()) if runtime_card_digest(now[id])!=b['runtimeCardDigests'][id]]
gameplay=[]
for card in c['cards']:
 id=card['sourceCard']['sourceId']
 if id in old:
  digest=hashlib.sha256(json.dumps({k:card[k] for k in ['classification','progression','skills','sourceFieldFacts']},sort_keys=True,ensure_ascii=False).encode()).hexdigest()
  if digest!=b['canonicalGameplayDigests'][id]:gameplay.append(id)
passives={x['cardId']:x for x in read('research/unit-passive-audit.json')['rows'] if x['level']==1}
leaders={x['cardId']:x for x in read('data/leader-parameter-rules.json')['leaders'] if x.get('cardId')}
added=[]
for id in sorted(now.keys()-old):
 card=now[id];added.append({'cardId':id,'member':card['member']['name'],'name':card['name'],'rarity':card['classification']['rarity']['mapping']['value'],
 'passiveStatus':passives[id]['status'],'passiveLevels':len(card['skills']['passive']['levels']),
 'activeLevels':len(card['skills']['active']['levels']),'activeConditionalRows':sum(bool(l['conditionalOverrides']) for l in card['skills']['active']['levels']),
 'specialLevels':len(card['skills']['special']['levels']),'leaderEffects':leaders[id]['effects']})
chars={x['sourceId']:x['fields'] for x in c['sourceRecords'] if x['table']=='Character'}
changes=[{'characterId':id,'fields':[k for k in sorted(set(before)|set(chars[id])) if before.get(k)!=chars[id].get(k)]} for id,before in b['characters'].items() if chars.get(id)!=before]
result={'source':c['sourceDataset'],'baselineSource':b['sourceDataset'],'beforeCount':len(old),'afterCount':len(now),'added':added,'updatedRuntimeCardIds':updated,'updatedCanonicalGameplayCardIds':gameplay,'removedCardIds':sorted(old-now.keys()),'characterMetadataChanges':changes,'compatibleOldCardCount':len(r['dataset']['compatibleSelections'][0]['cardIds'])}
path=root/'research/card-library-update.json';text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
if a.check:assert path.read_text()==text,'Regenerate card-library-update.json'
else:path.write_text(text)
assert not result['removedCardIds'] and not updated and not gameplay,'Existing card semantics changed; review migration policy'
assert len(changes)==54 and all(x['fields']==['color5'] for x in changes)
print(f"Card diff: {len(old)} -> {len(now)}, added {len(added)}, existing gameplay/runtime updates {len(updated)}/{len(gameplay)}, deleted 0, Character color5 {len(changes)}, old compatible {result['compatibleOldCardCount']}")
