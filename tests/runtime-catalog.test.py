"""Read-only semantic and source-preservation checks, independent of browser code."""
import copy
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'research'))
from build_runtime_catalog import condition, project

PROTECTED = {
    'research/canonical-cards.json': '306a0d43a4785983ddb200e0ace01d0f9d84a887d3ee6cab5fa44935dd9f8ef1',
    'research/canonical-card-schema-proposal.schema.json': 'fc9e3f37e1518895cf7a91fb846892e0b71dac0e0c73f903c57c3f809198c5d4',
    'research/holodoridb-all-card-survey.json': 'dcce8ef7057e5053d9ebea7a4a93c000785a28cd6451f31bdceb68222e69bb2a',
    'research/canonical-card-sakura-bloom.fixture.json': 'b14e8a1572079daf7dc6f0a7b75546c2fea1982496e4ba903e5d73e02cadb73e',
}
for path, digest in PROTECTED.items():
    assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest, path + ' modified'
canonical_bytes = (ROOT / 'research/canonical-cards.json').read_bytes()
canonical = json.loads(canonical_bytes)
runtime_bytes = (ROOT / 'data/runtime-cards.json').read_bytes()
runtime = json.loads(runtime_bytes)
assert runtime['dataset']['canonicalSha256'] == PROTECTED['research/canonical-cards.json']
assert runtime['dataset']['sourceDataset'] == canonical['sourceDataset']
assert runtime['dataset']['sourceArtifact'] == canonical['conversionEvidence']['inputArtifact']
assert len(runtime['cards']) == 185
assert {c['id'] for c in runtime['cards']} == {c['sourceCard']['sourceId'] for c in canonical['cards']}
assert len({c['id'] for c in runtime['cards']}) == 185


def same(a, b):
    assert json.dumps(a, sort_keys=True, ensure_ascii=False) == json.dumps(b, sort_keys=True, ensure_ascii=False), (a, b)


def resolve(pointer):
    node = canonical
    for part in pointer.split('/')[1:]:
        node = node[int(part)] if isinstance(node, list) else node[part]
    return node


def native(node):
    return {f['sourceField']: f['rawValue'] for f in node['facts'] if f['source'] == node['source']}


def check_entity(src, dst):
    same(resolve(dst['source']), src)
    fields = native(src)
    for field, value in dst['raw'].items():
        same(value, fields[field])
    # Every numeric/enum game field must survive; only identities and routing
    # can be replaced by pointers. New scalar or structured values fail closed.
    for field, value in fields.items():
        if field in ('id', 'groupId', 'level') or field.endswith('Id'):
            continue
        assert field in dst['raw'], field
        same(dst['raw'][field], value)
    texts = [f['rawValue'] for f in src['facts'] if f['sourceField'] == 'text' and f['source']['table'].startswith('Lang')]
    assert ('description' in dst) == bool(texts)
    if texts:
        same(dst['description'], texts[0])


def check_condition(src_parent, dst):
    if 'condition' not in src_parent:
        assert dst == {'state': 'unobserved', 'evaluationStatus': 'unresolved'}
        return
    src = src_parent['condition']
    assert dst['state'] == 'observed' and dst['evaluationStatus'] == 'not-evaluated'
    same(resolve(dst['source']), src)
    for f in src['sourceFacts']:
        if f['source']['table'].startswith('Lang'):
            if f['sourceField'] == 'text':
                same(dst['description'], f['rawValue'])
        elif f['sourceField'] not in ('groupId', 'descriptionLangId', 'id'):
            assert any(f['sourceField'] in raw and type(raw[f['sourceField']]) is type(f['rawValue']) and raw[f['sourceField']] == f['rawValue'] for raw in dst['clauses'])
    for field in ('resolutionClass', 'evaluationMode'):
        if field in src:
            same(dst[field], src[field])


counts = {'passive': 0, 'active': 0, 'special': 0, 'overrides': 0, 'specialEffects': 0, 'snapshots': 0, 'excludedLevels': 0}
for src, dst in zip(canonical['cards'], runtime['cards']):
    same(resolve(dst['source']), src)
    assert src['sourceCard']['sourceId'] == dst['id']
    for kind in ('passive', 'active', 'special'):
        same([l['levelFact']['rawValue'] for l in src['skills'][kind]['levels']], [l['level'] for l in dst['skills'][kind]['levels']])
        for original, projected in zip(src['skills'][kind]['levels'], dst['skills'][kind]['levels']):
            counts[kind] += 1
            check_entity(original, projected)
            if kind == 'passive':
                check_entity(original['effect']['effect'], projected['effect'])
                same(resolve(projected['target']['source']), original['effect']['target'])
                for f in original['effect']['target']['sourceFacts']:
                    if not f['source']['table'].startswith('Lang') and f['sourceField'] not in ('id', 'descriptionLangId'):
                        assert any(f['sourceField'] in raw and type(raw[f['sourceField']]) is type(f['rawValue']) and raw[f['sourceField']] == f['rawValue'] for raw in projected['target']['selectors'])
                expected_reference = 'present' if any(f['sourceField']=='liveSkillTriggerGroupId' for f in original['facts']) else 'absent'
                assert projected['condition']['referenceState'] == expected_reference
                check_condition(original['effect'], {k:v for k,v in projected['condition'].items() if k!='referenceState'})
            elif kind == 'active':
                check_entity(original['baseEffect'], projected['baseEffect'])
                assert len(original['conditionalOverrides']) == len(projected['conditionalOverrides'])
                for a, b in zip(original['conditionalOverrides'], projected['conditionalOverrides']):
                    counts['overrides'] += 1
                    check_entity(a['replacementEffect'], b['replacementEffect'])
                    check_condition(a, b['condition'])
                assert projected['calculationStatus'] == 'base-only'
            else:
                assert len(original['effects']) == len(projected['effects'])
                assert projected['durationScope'] == 'unresolved-per-effect'
                for a, b in zip(original['effects'], projected['effects']):
                    counts['specialEffects'] += 1
                    check_entity(a['effect'], b['effect'])
                    check_condition(a, b['condition'])
                    assert 'duration' not in b and 'effectDurationMillisecond' not in b['effect']['raw']
    assert len(src['progression']['bloomSteps']) == len(dst['progression']['bloomSteps']) == 5
    for original, projected in zip(src['progression']['bloomSteps'], dst['progression']['bloomSteps']):
        same(resolve(projected['source']), original)
        same(projected['step'], original['bloomStepFact']['rawValue'])
        same(projected['effectType'], original['effectTypeFact']['rawValue'])
        same(projected['value'], original['valueFact']['rawValue'])
    for original in src['classification']:
        projected = dst['classification'][original['sourceField']]
        same(projected['raw'], original['rawValue'])
        if 'semanticCandidate' in original:
            same(resolve(projected['source']), original)
            same(projected['mapping'], {k:v for k,v in original['semanticCandidate'].items() if k != 'basis'})
            assert original['semanticCandidate']['basis']  # Prose retained in complete Canonical.
    expected_levels = set()
    for stage, projected in zip(src['progression']['trainingStages'], dst['progression']['trainingStages']):
        same(projected['stage'], stage['trainingCountFact']['rawValue'])
        same(projected['levelCap'], stage['levelLimitFact']['rawValue'])
        expected_levels.add(stage['levelLimitFact']['rawValue'])
    assert len(dst['progression']['trainingStages']) == len(src['progression']['trainingStages'])
    snapshots = dst['progression']['statSnapshots']
    assert all(row['level'] != 1 for row in snapshots)
    assert any(native(row)['level'] == 1 for row in src['progression']['levelRows'])
    assert {s['level'] for s in snapshots} == expected_levels and len(snapshots) == len(expected_levels)
    full_levels = {native(row)['level']: row for row in src['progression']['levelRows']}
    assert len(full_levels) > len(expected_levels)
    for snapshot in snapshots:
        check_entity(full_levels[snapshot['level']], snapshot)
        assert snapshot['raw']['parameterBaseValue'] == native(full_levels[snapshot['level']])['parameterBaseValue']
    same(dst['progression']['parameterInputs'], {f['sourceField']: f['rawValue'] for f in src['progression']['parameterInputFacts']})
    counts['snapshots'] += len(snapshots)
    counts['excludedLevels'] += len(full_levels) - len(expected_levels)
assert counts['overrides'] == 142 and counts['specialEffects'] == 544
assert all(counts[k] == 370 for k in ('passive', 'active', 'special'))
# Explicit states must not collapse to the unobserved state, even for future data.
assert condition({}, '/test')['state'] == 'unobserved'
assert condition({'condition': None}, '/test')['state'] == 'explicit-null'
assert condition({'condition': {'kind': 'none'}}, '/test')['state'] == 'explicit'
reproduced = project(canonical, canonical_bytes, (ROOT / 'members.js').read_bytes())
assert runtime_bytes == (json.dumps(reproduced, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
print('Source/full Canonical/schema unchanged; Runtime IDs, raw types, P/A/SP semantics, pointers, selected stats and byte reproduction: PASS')
print(counts)
