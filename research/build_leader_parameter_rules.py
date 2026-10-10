"""Project existing audited Leader semantics; no new card database or formulas."""
import json, pathlib, hashlib, argparse, re
root=pathlib.Path(__file__).resolve().parent.parent
read=lambda p:json.loads((root/p).read_text())
audit=read('research/unit-leader-audit.json'); runtime=read('data/runtime-leader-skills.json')
assert len(audit['leaders'])==len(runtime['cardSkills'])==131
assert {r['leaderId'] for r in audit['leaders']}=={r['skillId'] for r in runtime['cardSkills']}
by_id={r['skillId']:r for r in runtime['cardSkills']}
affiliations=read('data/runtime-affiliations.json')
assert affiliations['canonicalSha256']==runtime['dataset']['canonicalSha256']
def resolve_condition(c, description):
    result={k:c.get(k) for k in ['type','attribute','affiliationId','requiredCount','referenceId','text']}
    if c['type']!='unknown': return result
    match=re.fullmatch(r'(.+)が([1-5])人以上',c.get('text') or '')
    if not match or not description.startswith(c['text']+'で'): return result
    matches=[(gid,g) for gid,g in affiliations['groups'].items() if g['name']==match[1]]
    if len(matches)!=1: return result
    gid,group=matches[0]; count=int(match[2])
    # Cross-check the existing reference; never fabricate a missing raw trigger row.
    if c['referenceId']!=f'live_skill_trigger-deck_card_character_grouping-{gid}-{count}': return result
    if not group['characterIds'] or group['source']!={'table':'CharacterGrouping','sourceId':gid}: return result
    result.update(type='affiliation_count',affiliationId=gid,requiredCount=count,
        resolutionEvidence={'basis':'original-leader-text-and-canonical-group-name','groupSource':group['source'],
        'text':c['text'],'rawTriggerRecordMissing':True})
    return result
rows=[]
for leader in audit['leaders']:
    assert leader['description']==by_id[leader['leaderId']]['description']
    effects=[]
    for e in leader['effects']:
        c=e['condition']
        effects.append({'parameter':e['typeFromOriginalText'],'percent':e['amountPercentFromOriginalText'], 'target':e['target']['typeFromOriginalText'],
            'condition':resolve_condition(c,e['description']),'description':e['description']})
    rows.append({'id':leader['leaderId'],'cardId':leader['cardId'],'name':leader['memberName']+' / '+leader['cardName'],'description':leader['description'],'kind':'card','effects':effects})
for e in runtime['commonEffects']:
    match=re.fullmatch(r'全員の全パラメータが(\d+)%UP',e['description'])
    assert match
    rows.append({'id':e['skillId'],'name':e['memberName']+' / '+e['costumeName'],'description':e['description'],'kind':'common','effects':[{'parameter':'all_parameter','percent':int(match[1]),'target':'all_members','condition':{'type':'not_stated'},'description':e['description']}]})
output={'format':'leader-parameter-rules-v1','canonicalSha256':runtime['dataset']['canonicalSha256'],'inputs':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['research/unit-leader-audit.json','data/runtime-leader-skills.json','data/runtime-affiliations.json']},'leaders':rows}
text=json.dumps(output,ensure_ascii=False,indent=2)+'\n'; path=root/'data/leader-parameter-rules.json'
parser=argparse.ArgumentParser(); parser.add_argument('--check',action='store_true')
if parser.parse_args().check:
    assert path.read_text()==text
    print('Leader parameter projection PASS')
else:path.write_text(text)
