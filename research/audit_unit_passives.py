"""Read-only classification using the actual engine gate; writes only audit artifacts."""
import argparse, collections, hashlib, json, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
JSC='/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    runtime=json.loads((ROOT/'data/runtime-cards.json').read_bytes())
    canonical=json.loads((ROOT/'research/canonical-cards.json').read_bytes())
    assert digest(ROOT/'research/canonical-cards.json')==runtime['dataset']['canonicalSha256']
    skill_ids={c['sourceCard']['sourceId']:c['skills']['passive']['skillSource']['sourceId'] for c in canonical['cards']}
    assert len(set(skill_ids.values()))==185
    engine=ROOT/'unit-parameter-engine.js'
    js=engine.read_text()+'''\nconst data=JSON.parse(readFile('data/runtime-cards.json'));
print(JSON.stringify(data.cards.flatMap(c=>c.skills.passive.levels.map(p=>UnitParameterEngine.resolveInput(p)))));'''
    with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
        f.write(js);f.flush();gates=iter(json.loads(subprocess.check_output([JSC,f.name],cwd=ROOT,text=True)))
    effects={'PERFORMANCE_UP_PERMIL_UP':'P up','TECHNIQUE_UP_PERMIL_UP':'T up','SENSE_UP_PERMIL_UP':'S up','ALL_PARAMETER_UP_PERMIL_UP':'all parameter up','LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP':'Support / parameter外'}
    rows=[]
    for card in runtime['cards']:
        for p in card['skills']['passive']['levels']:
            gate=next(gates); raw=p['effect']['raw'];effect=effects.get(raw['type'].split('_TYPE_')[-1],'unknown')
            selectors=p['target']['selectors'];assert len(selectors)==1
            selector=selectors[0]
            target={'SELF':'self','ATTRIBUTE':'attribute members','CHARACTER_GROUPING':'generation/group members'}.get(selector['type'].split('_TYPE_')[-1],'unknown')
            clauses=p['condition'].get('clauses',[])
            condition='unknown/unobserved'
            if p['condition']['state']=='observed':
                assert len(clauses)==1
                condition={'DECK_CARD_ATTRIBUTE':'attribute count','DECK_CARD_CHARACTER_GROUPING':'generation/group count'}.get(clauses[0]['type'].split('_TYPE_')[-1],'unknown')
            parameter=effect not in ('Support / parameter外','unknown')
            status='partial' if gate['status']=='partial' else 'supported' if gate['status']=='supported' else 'unsupported' if parameter else 'non-parameter' if effect!='unknown' else 'unknown'
            group='supported' if status=='supported' else 'non-parameter' if not parameter else f'{target} + {condition}'
            dependencies=[]
            if target!='self': dependencies+=['対象集合の解決','対象数Nの選択（既存baseTotal順位規則の接続範囲確認）']
            if condition=='generation/group count' or target=='generation/group members':dependencies+=['group IDとメンバー所属の対応']
            if condition=='unknown/unobserved': dependencies+=['条件未観測の解釈（alwaysとは確定しない）']
            rows.append(dict(passiveId=skill_ids[card['id']],cardId=card['id'],cardName=card['name'],member=card['member']['name'],level=p['level'],description=p['description'],source=p['source'],effect=effect,target=target,targetFacts=selectors,condition=condition,conditionFacts=p['condition'],parameter=parameter,status=status,gate=gate,group=group,dependencies=dependencies))
    def counts(items):return {'cards':len({r['cardId'] for r in items}),'rows':len(items)}
    def groupby(field,items):
        return {key:counts([r for r in items if r[field]==key]) for key in sorted({r[field] for r in items})}
    unsupported=[r for r in rows if r['status']=='unsupported']
    result={'inputs':{str(p.relative_to(ROOT)):digest(p) for p in [engine,ROOT/'party-condition-resolver.js',ROOT/'passive-target-resolver.js',ROOT/'passive-selection-resolver.js',ROOT/'party-condition-resolver.js',ROOT/'parameter-rules.js',ROOT/'data/runtime-affiliations.json',ROOT/'parameter-rules.js',ROOT/'data/runtime-cards.json',ROOT/'research/canonical-cards.json']},'uniquePassiveIds':len(set(skill_ids.values())),'counts':counts(rows),'status':groupby('status',rows),'parameter':counts([r for r in rows if r['parameter']]),'partialGroups':groupby('group',[r for r in rows if r['status']=='partial']),'groups':groupby('group',unsupported),'effect':groupby('effect',rows),'target':groupby('target',rows),'condition':groupby('condition',rows),'unsupportedEffect':groupby('effect',unsupported),'unsupportedTarget':groupby('target',unsupported),'unsupportedCondition':groupby('condition',unsupported),'gateReasons':{reason:counts([r for r in unsupported if r['gate'].get('reason')==reason]) for reason in sorted({r['gate'].get('reason') for r in unsupported})},'rows':rows}
    assert len(rows)==370 and counts(rows)['cards']==185
    assert len({(r['cardId'],r['level']) for r in rows})==370
    assert all(len([r for r in rows if r['cardId']==id])==2 for id in {r['cardId'] for r in rows})
    # Ensure level changes do not silently change the logic family.
    for id in {r['cardId'] for r in rows}:
        assert len({(r['effect'],r['target'],r['condition'],r['status']) for r in rows if r['cardId']==id})==1
    content=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    path=ROOT/'research/unit-passive-audit.json'
    if args.check: assert path.read_text()==content,'Audit differs; regenerate and review report'
    else:path.write_text(content)
    print(json.dumps({k:v for k,v in result.items() if k not in ('inputs','rows')},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
