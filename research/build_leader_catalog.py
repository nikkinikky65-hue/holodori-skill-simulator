"""Generate a display-only leader supplement without altering complete Canonical or Runtime cards."""
import argparse
import hashlib
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

def presentation(description):
    """Literal display projection only; not executable effect/condition semantics."""
    effects = []
    for raw_line in description.splitlines():
        line = re.sub(r'\[[^\]]+\]', '', raw_line)
        match = re.fullmatch(r'(?:(.+)で)?全員の(センスが|テクニックが|パフォーマンスが|全パラメータが|スコアサポート効果)([0-9]+)%(UP)?', line)
        if not match:
            return {'status': 'unclassified', 'category': '未分類', 'effects': [], 'reason': 'Unrecognized description; display original'}
        condition, target, amount, suffix = match.groups()
        if (target == 'スコアサポート効果') != (suffix is None):
            return {'status': 'unclassified', 'category': '未分類', 'effects': [], 'reason': 'Unrecognized suffix; display original'}
        label = 'スコアサポート' if target == 'スコアサポート効果' else target[:-1] + 'UP'
        effects.append({'label': label, 'amountPercent': int(amount), 'conditionText': condition,
                        'targetText': '全員', 'description': raw_line})
    return {'status': 'classified', 'category': '複合効果' if len(effects) > 1 else effects[0]['label'], 'effects': effects}

def project(canonical, runtime, source, source_bytes):
    assert source['provenance']['commitSha'] == canonical['sourceDataset']['commitSha'] == runtime['dataset']['sourceDataset']['commitSha']
    tables = {name: {row['id']: row.get('data', row) for row in rows} for name, rows in source['tables'].items()}
    assert all(len(tables[name]) == len(rows) for name, rows in source['tables'].items()), 'Duplicate source IDs'
    def localized(name, id):
        return tables[name][id]['text'] if id else None
    runtime_cards = {c['id']: c for c in runtime['cards']}
    card_skills, common = [], []
    used_costumes, used_skills = set(), set()
    characters = {}
    def entry(costume):
        skill_id = costume['liveLeaderSkillId']
        skill = tables['LiveLeaderSkill'][skill_id]
        used_skills.add(skill_id)
        return {'skillId': skill_id, 'costumeId': costume['id'],
                'costumeName': localized('LangCostume_Jpn', costume.get('nameLangId')),
                'name': localized('LangLiveLeaderSkill_Jpn', skill.get('nameLangId')),
                'description': localized('LangGeneratedLiveLeaderSkill_Jpn', skill.get('descriptionLangId')),
                'source': {'costume': costume['id'], 'skill': skill_id, 'description': skill.get('descriptionLangId')}}
    missing_costume_cards = []
    for i, card in enumerate(canonical['cards']):
        fields = {f['sourceField']: f['rawValue'] for f in card['sourceFieldFacts'] if f['source'] == card['sourceCard']}
        # Source card facts are preserved directly; no naming-pattern joins.
        character_id = fields['characterId']
        rc = runtime_cards[card['sourceCard']['sourceId']]
        member = {'characterId': character_id, 'memberId': rc['member']['mapping'].get('id'), 'memberName': rc['member']['name']}
        if character_id in characters: assert characters[character_id] == member
        characters[character_id] = member
        if 'rewardCostumeId' not in fields:
            missing_costume_cards.append(rc['id']);continue
        costume = tables['Costume'][fields['rewardCostumeId']]
        assert costume['characterId'] == character_id
        used_costumes.add(costume['id'])
        row = entry(costume)
        row['presentation'] = presentation(row['description'])
        row.update(cardId=rc['id'])
        row['source']['card'] = f'/cards/{i}'
        card_skills.append(row)
    no_skill_costumes = []
    for costume in tables['Costume'].values():
        if costume['id'] in used_costumes: continue
        if 'liveLeaderSkillId' not in costume:
            no_skill_costumes.append(costume['id']);continue
        row = entry(costume)
        assert row['costumeName'] == 'デフォルト', 'Unclassified non-card costume; review instead of guessing'
        row.update(characters[costume['characterId']])
        row.update(kind='default-costume', cardIds=[])
        common.append(row)
    assert used_skills == set(tables['LiveLeaderSkill']), 'Unlisted leader skill; review missing relation'
    assert all(row['description'] for row in card_skills + common)
    return {'format':'holodori-leader-catalog-v1',
            'dataset':{'canonicalSha256':runtime['dataset']['canonicalSha256'], 'sourceCommit':source['provenance']['commitSha'],
                       'sourcePath':'research/holodoridb-leader-source.json','sourceSha256':hashlib.sha256(source_bytes).hexdigest()},
            'cardSkills':card_skills, 'commonEffects':common,
            'coverage':{'cardsWithoutCostumeReference':missing_costume_cards, 'costumesWithoutSkillReference':no_skill_costumes,
                        'sourceLeaderSkillCount':len(tables['LiveLeaderSkill'])}}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    source_bytes=(ROOT/'research/holodoridb-leader-source.json').read_bytes()
    canonical_bytes=(ROOT/'research/canonical-cards.json').read_bytes()
    runtime=json.loads((ROOT/'data/runtime-cards.json').read_bytes())
    assert hashlib.sha256(canonical_bytes).hexdigest()==runtime['dataset']['canonicalSha256']
    result=project(json.loads(canonical_bytes),runtime,json.loads(source_bytes),source_bytes)
    output=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode()
    path=ROOT/'data/runtime-leader-skills.json'
    if args.check: assert path.read_bytes()==output, 'Regenerate leader supplement'
    else: path.write_bytes(output)
    print(f"Leader catalog: {len(result['cardSkills'])} card skills, {len(result['commonEffects'])} separate common effects, {len(output):,} bytes; {'reproduction PASS' if args.check else 'generated'}")
if __name__=='__main__': main()
