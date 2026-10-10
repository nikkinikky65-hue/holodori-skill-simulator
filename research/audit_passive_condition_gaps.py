"""Audit stored source→Canonical→Runtime condition loss; no runtime mutations."""
import argparse, collections, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
paths=['research/holodoridb-all-card-survey.json','research/canonical-cards.json','data/runtime-cards.json','data/runtime-affiliations.json']
survey,canonical,runtime,aff=[json.loads((ROOT/p).read_text()) for p in paths]
source={(t,r['sourceId']):r for t,rows in survey['joinedSourceRows'].items() for r in rows}
records={(r['table'],r['sourceId']):r for r in canonical['sourceRecords']}
cards={c['sourceCard']['sourceId']:c for c in canonical['cards']}
rows=[]
for card in runtime['cards']:
    for level,cl in zip(card['skills']['passive']['levels'],cards[card['id']]['skills']['passive']['levels']):
        ref=cl['source']; key=(ref['table'],ref['sourceId']); raw=records[key]['fields']
        assert raw==source[key]['fields']
        facts={f['sourceField']:f['rawValue'] for f in cl['facts'] if f['source']==ref}
        assert facts==raw
        has='liveSkillTriggerGroupId' in raw
        assert has==('condition' in cl['effect'])==(level['condition']['state']=='observed')
        if has: continue
        # The stored source itself has no trigger, not a failed reference join.
        assert not any('trigger' in k.lower() or 'condition' in k.lower() for k in raw)
        assert '以上' not in level['description'] and '場合' not in level['description']
        target=level['target']['selectors'][0]
        assert target['targetCount']==2
        targetref=cl['effect']['target']['sourceRefs'][0]
        assert (targetref['table'],targetref['sourceId']) in source
        group=target.get('characterGroupingId')
        if group: assert group in aff['groups']
        support='LIVE_ACTIVE_SKILL_EFFECT_UP' in level['effect']['raw']['type']
        rows.append(dict(cardId=card['id'],cardName=card['name'],member=card['member']['name'],
            skillId=cards[card['id']]['skills']['passive']['skillSource']['sourceId'],level=level['level'],
            description=level['description'],effect=level['effect']['raw'],target=target,
            source=ref,sourceFields=raw,condition=level['condition'],category='C',
            family='support' if support else 'parameter',
            dependency='condition-semantics-unverified',
            excessSelection='unverified' if support or group else 'existing-attribute-ranking-after-condition-resolution'))
def count(rs):return dict(cards=len({r['cardId'] for r in rs}),rows=len(rs))
summary={family:count([r for r in rows if r['family']==family]) for family in ['parameter','support']}
assert summary=={'parameter':{'cards':55,'rows':110},'support':{'cards':21,'rows':42}}
assert len(rows)==152
out=dict(inputs={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths},
    summary=summary,classification={'existingDataConnectable':0,'recoverableMissingReferenceIdentified':0,
    'conditionSemanticsUnverified':76,'additionalSelectionVerification':35},
    selectionDependencies={f:count([r for r in rows if r['excessSelection']==f]) for f in sorted({r['excessSelection'] for r in rows})},rows=rows)
text=json.dumps(out,ensure_ascii=False,indent=2)+'\n'; dest=ROOT/'research/passive-condition-gaps.json'
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true')
if p.parse_args().check: assert dest.read_text()==text
else: dest.write_text(text)
print(json.dumps({k:v for k,v in out.items() if k not in ('inputs','rows')},ensure_ascii=False))
