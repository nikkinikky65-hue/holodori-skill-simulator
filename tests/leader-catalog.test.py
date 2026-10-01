"""Source joins, original descriptions, common-effect isolation and deterministic projection."""
import hashlib
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'research'))
from build_leader_catalog import project
source_bytes=(ROOT/'research/holodoridb-leader-source.json').read_bytes()
source=json.loads(source_bytes)
canonical=json.loads((ROOT/'research/canonical-cards.json').read_bytes())
runtime=json.loads((ROOT/'data/runtime-cards.json').read_bytes())
actual_bytes=(ROOT/'data/runtime-leader-skills.json').read_bytes()
actual=json.loads(actual_bytes)
tables={name:{row['id']:row['data'] for row in rows} for name,rows in source['tables'].items()}
for name,rows in source['tables'].items():
    assert hashlib.sha256(json.dumps(rows,ensure_ascii=False).encode()).hexdigest()==source['provenance']['tables'][name]['capturedJsonSha256']
card_rows={r['sourceId']:r['fields'] for r in canonical['sourceRecords'] if r['table']=='Card'}
assert len(actual['cardSkills'])==131 and len(actual['commonEffects'])==54
ids=[]
for row in actual['cardSkills']+actual['commonEffects']:
    costume=tables['Costume'][row['costumeId']]
    skill=tables['LiveLeaderSkill'][row['skillId']]
    assert costume['liveLeaderSkillId']==row['skillId']
    assert row['description']==tables['LangGeneratedLiveLeaderSkill_Jpn'][skill['descriptionLangId']]['text']
    assert row['name'] is None and 'nameLangId' not in skill
    assert row['costumeName']==tables['LangCostume_Jpn'][costume['nameLangId']]['text']
    ids.append(row['skillId'])
for row in actual['cardSkills']:
    assert card_rows[row['cardId']]['rewardCostumeId']==row['costumeId']
    assert tables['Costume'][row['costumeId']]['characterId']==card_rows[row['cardId']]['characterId']
for row in actual['commonEffects']:
    assert row['cardIds']==[] and 'cardId' not in row
    assert row['costumeName']=='デフォルト' and row['description']=='全員の全パラメータが15%UP'
assert len(ids)==len(set(ids))==185 and set(ids)==set(tables['LiveLeaderSkill'])
assert len(actual['coverage']['cardsWithoutCostumeReference'])==54
assert all('rewardCostumeId' not in card_rows[id] for id in actual['coverage']['cardsWithoutCostumeReference'])
assert len(actual['coverage']['costumesWithoutSkillReference'])==8
assert all('liveLeaderSkillId' not in tables['Costume'][id] for id in actual['coverage']['costumesWithoutSkillReference'])
assert actual_bytes==(json.dumps(project(canonical,runtime,source,source_bytes),ensure_ascii=False,separators=(',',':'))+'\n').encode()
print('Leader: 131 exact Card→Costume→Skill joins, 54 isolated common effects, all 185 source skills, original texts and reproduction PASS')
