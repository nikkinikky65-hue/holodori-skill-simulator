"""Offline, deterministic survey -> existing proposal-v1 schema. No runtime defaults.
Run --check to validate the committed artifact without writing files.
Requires jsonschema (Draft 2020-12).
"""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INPUT = ROOT / 'holodoridb-all-card-survey.json'
OUTPUT = ROOT / 'canonical-cards.json'
SCHEMA = ROOT / 'canonical-card-schema-proposal.schema.json'


def ref(row):
    return {k: row[k] for k in ('table', 'sourceId')}


def key(source):
    return source['table'], source['sourceId']


def fact(row, field):
    # Wrapper-only initial training stage is preserved as a wrapper field,
    # never fabricated as a data.limitBreakCount default.
    bag = row['fields'] if field in row['fields'] else row['sourceWrapper']
    return {'source': ref(row), 'sourceField': field, 'rawValue': bag[field]}


class Converter:
    def __init__(self, survey):
        self.survey = survey
        self.rows = [{"table": table, **row} for table, rows in survey['joinedSourceRows'].items() for row in rows]
        self.rows.sort(key=key)
        self.tables = collections.defaultdict(list)
        self.indexes = {}
        self.edges = collections.defaultdict(list)
        self.missing = []
        for row in self.rows:
            self.tables[row['table']].append(row)
        self.languages = {}
        for row in self.rows:
            if row['table'].startswith('Lang'):
                assert row['fields']['id'] not in self.languages
                self.languages[row['fields']['id']] = row
        self.build_edges()

    def lookup(self, table, field, value):
        index_key = table, field
        if index_key not in self.indexes:
            index = collections.defaultdict(list)
            for row in self.tables[table]:
                if field in row['fields']:
                    index[row['fields'][field]].append(row)
            self.indexes[index_key] = index
        return self.indexes[index_key].get(value, [])

    def link(self, row, field, table, target='id', optional=False):
        if field not in row['fields']:
            return
        value = row['fields'][field]
        matches = self.lookup(table, target, value)
        if not matches and not optional:
            self.missing.append({'from': ref(row), 'sourceField': field, 'rawJoinValue': value, 'expectedTable': table, 'status': 'unresolved'})
        for match in matches:
            self.edges[key(row)].append({'from': ref(row), 'to': ref(match), 'sourceField': field, 'targetField': target, 'rawJoinValue': value})

    def build_edges(self):
        card_links = [('characterId', 'Character', 'id'), ('cardLevelGroupId', 'CardLevel', 'groupId'), ('cardLevelLimitGroupId', 'CardLevelLimit', 'groupId'), ('cardPotentialGroupId', 'CardPotential', 'groupId'), ('skillTreeConnectEffectId', 'SkillTreeConnectEffect', 'id')]
        for row in self.rows:
            table = row['table']
            for field, value in row['fields'].items():
                values = value if field.endswith('LangIds') and isinstance(value, list) else [value] if field.endswith('LangId') else []
                for lang_id in values:
                    language = self.languages.get(lang_id)
                    if language:
                        self.edges[key(row)].append({'from': ref(row), 'to': ref(language), 'sourceField': field, 'targetField': 'id', 'rawJoinValue': lang_id})
                    else:
                        self.missing.append({'from': ref(row), 'sourceField': field, 'rawJoinValue': lang_id, 'expectedTable': 'Japanese localization (not in survey)', 'status': 'unresolved'})
            if table == 'Card':
                for field, target_table, target_field in card_links:
                    self.link(row, field, target_table, target_field)
                self.link(row, 'rarity', 'CardPotentialUpgradeItem', 'rarity', optional=True)
                for kind in ('Passive', 'Active', 'Special'):
                    self.link(row, f'live{kind}SkillId', f'Live{kind}Skill')
            if table == 'Character':
                self.link(row, 'characterProductionId', 'CharacterProduction')
            if table == 'SkillTreeConnectEffect':
                self.link(row, 'skillTreeConnectEffectExtentGroupId', 'SkillTreeConnectEffectExtent', 'groupId')
            for kind in ('Passive', 'Active', 'Special'):
                if table == f'Live{kind}Skill':
                    self.link(row, 'id', f'Live{kind}SkillLevel', f'live{kind}SkillId')
                if table == f'Live{kind}SkillLevel':
                    effect_kind = 'Passive' if kind == 'Passive' else 'Active'
                    self.link(row, f'live{effect_kind}SkillEffectGroupId', f'Live{effect_kind}SkillEffect', 'groupId')
                    self.link(row, 'additionalLiveActiveSkillEffectGroupId', 'LiveActiveSkillEffect', 'groupId')
                    for field in ('liveSkillTriggerGroupId', 'additionalLiveSkillTriggerGroupId'):
                        self.link(row, field, 'LiveSkillTrigger', 'groupId')
            if table in ('LivePassiveSkillEffect', 'LiveActiveSkillEffect'):
                self.link(row, 'liveSkillEffectTargetId', 'LiveSkillEffectTarget')
            if table in ('LiveSkillTrigger', 'LiveSkillEffectTarget'):
                self.link(row, 'characterGroupingId', 'CharacterGrouping')

    def related(self, row, field):
        return [self.by_key[key(edge['to'])] for edge in self.edges[key(row)] if edge['sourceField'] == field]

    def one(self, row, field):
        matches = self.related(row, field)
        if len(matches) != 1:
            raise ValueError(f'Expected one {key(row)}.{field}, got {len(matches)}; do not silently collapse source groups')
        return matches[0]

    def facts(self, row, localized=True):
        result = [fact(row, field) for field in row['fields']]
        if localized:
            for edge in self.edges[key(row)]:
                if edge['to']['table'].startswith('Lang'):
                    lang = self.by_key[key(edge['to'])]
                    result.extend(fact(lang, field) for field in lang['fields'])
        return result

    def references(self, row):
        return [{'sourceField': e['sourceField'], 'rawJoinValue': e['rawJoinValue'], 'target': e['to']} for e in self.edges[key(row)]]

    def condition(self, level, field):
        trigger = self.one(level, field)
        raw_type = trigger['fields'].get('type')
        formation = raw_type in ['LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_ATTRIBUTE', 'LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_CHARACTER_GROUPING']
        player = raw_type in ['LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_COMBO_GTE', 'LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_LIFE_GTE']
        return {'sourceFacts': self.facts(trigger), 'sourceReferences': self.references(trigger), 'resolutionClass': 'formation-dependent' if formation else 'player-state-dependent' if player else 'unresolved', 'evaluationMode': 'resolve-from-formation' if formation else 'preserve-without-dynamic-simulation' if player else 'unresolved'}

    def effect(self, level, field):
        row = self.one(level, field)
        return {'source': ref(row), 'groupFact': fact(level, field), 'facts': self.facts(row)}

    def skill(self, card, kind):
        master = self.one(card, f'live{kind.title()}SkillId')
        levels = []
        for row in sorted(self.related(master, 'id'), key=lambda r: r['fields']['level']):
            data = row['fields']
            level = {'source': ref(row), 'levelFact': fact(row, 'level'), 'facts': self.facts(row), 'sourceReferences': self.references(row)}
            if kind == 'passive':
                effect_row = self.one(row, 'livePassiveSkillEffectGroupId')
                target = self.one(effect_row, 'liveSkillEffectTargetId')
                level['effect'] = {'effect': self.effect(row, 'livePassiveSkillEffectGroupId'), 'target': {'sourceRefs': [ref(target)], 'sourceFacts': self.facts(target)}}
                if 'liveSkillTriggerGroupId' in data:
                    level['effect']['condition'] = self.condition(row, 'liveSkillTriggerGroupId')
                else:
                    level['annotations'] = ['Condition not observed; do not synthesize none.']
            elif kind == 'active':
                level.update(baseEffect=self.effect(row, 'liveActiveSkillEffectGroupId'), conditionalOverrides=[], evaluationScope='one-active-effect-select-base-or-matching-override')
                if 'additionalLiveActiveSkillEffectGroupId' in data:
                    level['conditionalOverrides'].append({'condition': self.condition(row, 'additionalLiveSkillTriggerGroupId'), 'replacementEffect': self.effect(row, 'additionalLiveActiveSkillEffectGroupId'), 'sourceReferences': self.references(row)})
            else:
                level.update(effects=[{'effect': self.effect(row, 'liveActiveSkillEffectGroupId')}], effectCombination='independent-effects')
                if 'additionalLiveActiveSkillEffectGroupId' in data:
                    additional = {'effect': self.effect(row, 'additionalLiveActiveSkillEffectGroupId')}
                    if 'additionalLiveSkillTriggerGroupId' in data:
                        additional['condition'] = self.condition(row, 'additionalLiveSkillTriggerGroupId')
                    level['effects'].append(additional)
                level['annotations'] = ['Duration belongs to skill-level source row; no per-effect duration inferred.']
            levels.append(level)
        return {'skillKind': kind, 'skillSource': ref(master), 'levels': levels}

    def build(self):
        self.by_key = {key(row): row for row in self.rows}
        cards = []
        # Attribute candidates require matching localization evidence, not enum order.
        attributes = {}
        for target in self.tables['LiveSkillEffectTarget']:
            enum = target['fields'].get('cardAttributeType')
            for f in self.facts(target):
                if f['sourceField'] == 'text' and enum:
                    match = re.search(r'\[attribute=(cute|pure|happy)\]', f['rawValue'])
                    if match:
                        value = match[1]
                        assert enum not in attributes or attributes[enum]['value'] == value
                        attributes[enum] = {'value': value, 'status': 'candidate', 'basis': f"Matching target raw enum and localized tag at {f['source']['table']}:{f['source']['sourceId']}"}
        for row in self.tables['Card']:
            name = self.one(row, 'nameLangId')
            character = self.one(row, 'characterId')
            classification = [fact(row, f) for f in ('rarity', 'attributeType')]
            for item in classification:
                if item['sourceField'] == 'attributeType' and item['rawValue'] in attributes:
                    item['semanticCandidate'] = attributes[item['rawValue']]
                rarity_map = {f'CardRarity_CARD_RARITY_RARITY_{n}': n for n in (3, 4, 5)}
                if item['sourceField'] == 'rarity' and item['rawValue'] in rarity_map:
                    item['semanticCandidate'] = {'value': rarity_map[item['rawValue']], 'status': 'candidate', 'basis': 'Explicit known rarity enum mapping; raw enum retained.'}
            progression = {'levelRows': [{'source': ref(r), 'facts': self.facts(r)} for r in sorted(self.related(row, 'cardLevelGroupId'), key=lambda r: r['fields']['level'])], 'trainingStages': [], 'bloomSteps': [], 'parameterInputFacts': [fact(row, f) for f in ('performancePermilMultiply', 'techniquePermilMultiply', 'sensePermilMultiply') if f in row['fields']]}
            for r in sorted(self.related(row, 'cardLevelLimitGroupId'), key=lambda r: r['sourceWrapper']['limit_break_count']):
                stage_field = 'limitBreakCount' if 'limitBreakCount' in r['fields'] else 'limit_break_count'
                progression['trainingStages'].append({'source': ref(r), 'trainingCountFact': fact(r, stage_field), 'levelLimitFact': fact(r, 'levelLimit'), 'facts': self.facts(r)})
            for r in sorted(self.related(row, 'cardPotentialGroupId'), key=lambda r: r['fields']['upgradeCount']):
                progression['bloomSteps'].append({'source': ref(r), 'bloomStepFact': fact(r, 'upgradeCount'), 'effectTypeFact': fact(r, 'effectType'), 'valueFact': fact(r, 'value'), 'facts': self.facts(r)})
            cards.append({'sourceCard': ref(row), 'identity': {'sourceIdFact': fact(row, 'id'), 'names': [{'locale': 'ja-JP', 'textFact': fact(name, 'text')}], 'memberFacts': self.facts(character), 'memberSourceRefs': [ref(character)]}, 'classification': classification, 'progression': progression, 'skills': {kind: self.skill(row, kind) for kind in ('passive', 'active', 'special')}, 'sourceFieldFacts': self.facts(row, localized=False), 'otherSourceRefs': [edge['to'] for edge in self.edges[key(row)] if edge['to']['table'] in ('SkillTreeConnectEffect', 'CardPotentialUpgradeItem')], 'annotations': ['No final stats, numeric activation probability, per-effect SP duration or Connect runtime semantics inferred.']})
        provenance = self.survey['provenance']
        return {'proposalStatus': 'proposal-not-implemented', 'schemaVersion': 'proposal-v1', 'sourceDataset': {k: provenance[k] for k in ('repository', 'commitSha', 'commitUrl', 'retrievedAtUtc')}, 'cards': cards, 'sourceRecords': self.rows, 'joins': [edge for row in self.rows for edge in self.edges[key(row)]], 'unresolvedReferences': self.missing, 'notes': ['Uses the existing proposal schema without changing its status marker. All 185 cards from the pinned survey are converted; runtime remains a separate, limited adapter.', 'Connect and board rows are evidence only. Missing fields, raw JSON types and source wrappers are retained.'], 'conversionEvidence': {'inputArtifact': {'path': 'research/' + INPUT.name, 'sha256': hashlib.sha256(INPUT.read_bytes()).hexdigest()}, 'preservedSections': ['cardIndex IDs', 'joinedSourceRows (all fields and wrappers)'], 'unresolvedItems': ['Final stat formula and rounding', 'Numeric probability interpretation', 'Per-effect Special duration', 'Unobserved Passive condition', 'Active simultaneous replacement priority', 'Connect/board runtime behavior']}}


def validate(result, survey):
    import jsonschema
    jsonschema.Draft202012Validator(json.loads(SCHEMA.read_text())).validate(result)
    rows = {key(row): row for row in result['sourceRecords']}
    original = {(table, row['sourceId']): row for table, records in survey['joinedSourceRows'].items() for row in records}
    assert len(rows) == len(result['sourceRecords']) == len(original)
    for k, row in rows.items():
        assert row['fields'] == original[k]['fields'] and row['sourceWrapper'] == original[k]['sourceWrapper']
    ids = [card['sourceCard']['sourceId'] for card in result['cards']]
    assert len(ids) == len(set(ids)) == 185
    assert set(ids) == {row['sourceId'] for row in survey['cardIndex']}

    def walk(value):
        if isinstance(value, dict):
            if set(value) == {'table', 'sourceId'}:
                assert key(value) in rows, value
            if 'source' in value and 'sourceField' in value and 'rawValue' in value:
                row = rows[key(value['source'])]
                bag = row['fields'] if value['sourceField'] in row['fields'] else row['sourceWrapper']
                raw = bag[value['sourceField']]
                assert type(raw) is type(value['rawValue']) and raw == value['rawValue']
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    for card in result['cards']:
        walk(card)
        assert {f['sourceField']: f['rawValue'] for f in card['sourceFieldFacts']} == rows[key(card['sourceCard'])]['fields']
        source_card = rows[key(card['sourceCard'])]['fields']
        for collection, field in [('levelRows', 'cardLevelGroupId'), ('trainingStages', 'cardLevelLimitGroupId'), ('bloomSteps', 'cardPotentialGroupId')]:
            for item in card['progression'][collection]:
                assert rows[key(item['source'])]['fields']['groupId'] == source_card[field]
        for kind in ('passive', 'active', 'special'):
            track = card['skills'][kind]
            assert rows[key(track['skillSource'])]['fields']['id'] == source_card[f'live{kind.title()}SkillId']
            assert [level['levelFact']['rawValue'] for level in track['levels']] == [1, 2]
            for level in track['levels']:
                level_fields = rows[key(level['source'])]['fields']
                assert level_fields[f'live{kind.title()}SkillId'] == source_card[f'live{kind.title()}SkillId']
                assert {f['sourceField']: f['rawValue'] for f in level['facts'] if f['source'] == level['source']} == level_fields
                if kind == 'passive':
                    effect = level['effect']['effect']
                    assert rows[key(effect['source'])]['fields']['groupId'] == level_fields['livePassiveSkillEffectGroupId']
                    assert ('condition' in level['effect']) == ('liveSkillTriggerGroupId' in level_fields)
                elif kind == 'active':
                    assert rows[key(level['baseEffect']['source'])]['fields']['groupId'] == level_fields['liveActiveSkillEffectGroupId']
                    assert bool(level['conditionalOverrides']) == ('additionalLiveActiveSkillEffectGroupId' in level_fields)
                    for override in level['conditionalOverrides']:
                        assert rows[key(override['replacementEffect']['source'])]['fields']['groupId'] == level_fields['additionalLiveActiveSkillEffectGroupId']
                        trigger_fact = override['condition']['sourceFacts'][0]
                        assert rows[key(trigger_fact['source'])]['fields']['groupId'] == level_fields['additionalLiveSkillTriggerGroupId']
                else:
                    expected_groups = [level_fields['liveActiveSkillEffectGroupId']]
                    if 'additionalLiveActiveSkillEffectGroupId' in level_fields:
                        expected_groups.append(level_fields['additionalLiveActiveSkillEffectGroupId'])
                    assert [rows[key(e['effect']['source'])]['fields']['groupId'] for e in level['effects']] == expected_groups
                    assert all('duration' not in e and 'duration' not in e['effect'] for e in level['effects'])
                    assert any('condition' in e for e in level['effects']) == ('additionalLiveSkillTriggerGroupId' in level_fields)
    for edge in result['joins']:
        src, dst = rows[key(edge['from'])], rows[key(edge['to'])]
        raw = src['fields'][edge['sourceField']]
        assert (edge['rawJoinValue'] in raw if isinstance(raw, list) else raw == edge['rawJoinValue'])
        assert dst['fields'][edge['targetField']] == edge['rawJoinValue']
    # Fixed survey observations independently guard the meaning of the three skill tracks.
    levels = {kind: [level for c in result['cards'] for level in c['skills'][kind]['levels']] for kind in ('passive', 'active', 'special')}
    assert sum('condition' in l['effect'] for l in levels['passive']) == 218
    assert sum(len(l['conditionalOverrides']) for l in levels['active']) == 142
    assert sum(len(l['effects']) == 2 for l in levels['special']) == 174
    assert sum('condition' in e for l in levels['special'] for e in l['effects']) == 66
    assert sum(len(c['progression']['levelRows']) for c in result['cards']) == 13180
    assert all(len(c['progression']['trainingStages']) == 5 and len(c['progression']['bloomSteps']) == 5 for c in result['cards'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    survey = json.loads(INPUT.read_text())
    result = Converter(survey).build()
    validate(result, survey)
    encoded = json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n'
    if args.check:
        assert OUTPUT.read_text() == encoded, 'Regenerate canonical-cards.json'
    else:
        OUTPUT.write_text(encoded)
    print(f"Canonical: {len(result['cards'])} cards, {len(result['sourceRecords'])} exact source rows, {len(result['joins'])} validated joins, {len(result['unresolvedReferences'])} unresolved references; schema/facts/types/structure/determinism PASS")


if __name__ == '__main__':
    main()
