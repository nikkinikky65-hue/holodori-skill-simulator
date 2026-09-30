"""Research only: compare raw inputs and rounding hypotheses; no game formula asserted.
Run with python3 -B research/check_pts_hypotheses.py. Writes nothing.
"""
import collections
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
raw = (ROOT / 'research/canonical-cards.json').read_bytes()
canonical = json.loads(raw)
survey = json.loads((ROOT / 'research/holodoridb-all-card-survey.json').read_bytes())
keys = ['performancePermilMultiply', 'techniquePermilMultiply', 'sensePermilMultiply']
source_cards = {r['sourceId']: r['fields'] for r in survey['joinedSourceRows']['Card']}
source_levels = {r['sourceId']: r['fields'] for r in survey['joinedSourceRows']['CardLevel']}
counts = collections.Counter()
rounding = {method: collections.Counter() for method in ['floor', 'ceil', 'nearest-half-up']}
rarities = {}
examples = []
for card in canonical['cards']:
    source = source_cards[card['sourceCard']['sourceId']]
    facts = {f['sourceField']: f['rawValue'] for f in card['progression']['parameterInputFacts']}
    assert facts == {key: source[key] for key in keys}
    weights = [facts[key] for key in keys]
    assert all(type(w) is int and w > 0 for w in weights)
    counts['cards'] += 1
    counts['coefficient_sum_1000'] += sum(weights) == 1000
    rarity = source['rarity'].split('_')[-1]
    group = rarities.setdefault(rarity, {'cards': 0, 'rows': 0, 'levelGroups': set(), 'weightTriples': set()})
    group['cards'] += 1
    group['levelGroups'].add(source['cardLevelGroupId'])
    group['weightTriples'].add(tuple(weights))
    for row in card['progression']['levelRows']:
        fields = {f['sourceField']: f['rawValue'] for f in row['facts'] if f['source'] == row['source']}
        assert fields == source_levels[row['source']['sourceId']]
        base = int(fields['parameterBaseValue'])
        products = [base * w for w in weights]
        counts['card_level_rows'] += 1
        group['rows'] += 1
        counts['unrounded_sum_equals_base'] += sum(products) == base * 1000
        counts['all_three_integral'] += all(n % 1000 == 0 for n in products)
        counts['rows_with_half_tie'] += any(n % 1000 == 500 for n in products)
        candidates = {'floor': [n // 1000 for n in products],
                      'ceil': [(n + 999) // 1000 for n in products],
                      'nearest-half-up': [(n + 500) // 1000 for n in products]}
        for method, values in candidates.items():
            rounding[method][sum(values) - base] += 1
        if len([e for e in examples if e['rarity'] == rarity]) < 2 and len({tuple(v) for v in candidates.values()}) == 3 and fields['level'] in [1,20,30,40,60,70,80]:
            examples.append({'cardId':source['id'], 'rarity':rarity, 'level':fields['level'],
                             'base':base, 'weights':weights, 'exactNumeratorsOver1000':products, 'candidates':candidates})
for group in rarities.values():
    group['levelGroups'] = sorted(group['levelGroups'])
    group['weightTriples'] = len(group['weightTriples'])
print(json.dumps({'canonicalSha256':hashlib.sha256(raw).hexdigest(), 'counts':counts,
                  'sumMinusBaseByRounding':rounding, 'rarities':rarities, 'examples':examples}, ensure_ascii=False, indent=2))
