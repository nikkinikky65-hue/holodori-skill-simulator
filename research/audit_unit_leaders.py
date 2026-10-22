"""Audit existing local Leader evidence only; never writes runtime/calculation files."""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path
from build_leader_catalog import presentation

ROOT = Path(__file__).resolve().parent.parent
INPUTS = ['data/runtime-leader-skills.json', 'data/runtime-cards.json',
          'data/runtime-affiliations.json', 'research/canonical-cards.json',
          'research/holodoridb-leader-source.json', 'research/holodoridb-all-card-survey.json',
          'party-condition-resolver.js', 'passive-target-resolver.js',
          'passive-selection-resolver.js', 'parameter-rules.js', 'unit-parameter-engine.js',
          'tests/parameter-rules.test.js', 'tests/case-c-enhancement.test.js',
          'research/parameter-score-validation.md', 'research/leader-catalog.md',
          'research/build_leader_catalog.py', 'research/audit_unit_leaders.py']
LABELS = {'パフォーマンスUP': 'P', 'テクニックUP': 'T', 'センスUP': 'S',
          '全パラメータUP': 'all_parameter', 'スコアサポート': 'score_support'}

def read(name):
    return json.loads((ROOT / name).read_text())

def hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in INPUTS}

def build():
    leader = read(INPUTS[0]); cards = {c['id']: c for c in read(INPUTS[1])['cards']}
    canonical = read(INPUTS[3]); source = read(INPUTS[4]); survey = read(INPUTS[5])
    tables = {name: {r['id']: r.get('data', r) for r in rows} for name, rows in source['tables'].items()}
    assert source['provenance']['commitSha'] == canonical['sourceDataset']['commitSha'] == survey['provenance']['commitSha']
    assert leader['dataset']['canonicalSha256'] == hashes()[INPUTS[3]]
    assert leader['dataset']['sourceSha256'] == hashes()[INPUTS[4]]
    assert len(leader['cardSkills']) + len(leader['coverage']['cardsWithoutCostumeReference']) == len(cards)
    assert len(leader['commonEffects']) == 54
    assert len({r['cardId'] for r in leader['cardSkills']}) == len(leader['cardSkills'])
    assert len({r['skillId'] for r in leader['cardSkills']}) == len(leader['cardSkills'])
    common_ids = {r['skillId'] for r in leader['commonEffects']}
    assert not common_ids & {r['skillId'] for r in leader['cardSkills']}
    assert all(r['cardIds'] == [] for r in leader['commonEffects'])
    records = collections.defaultdict(list)
    for index, record in enumerate(canonical['sourceRecords']):
        records[(record['table'], record['fields'].get('groupId'))].append(
            {'pointer': f'/sourceRecords/{index}', 'sourceId': record['sourceId'], 'fields': record['fields']})
    rows = []; condition_groups = {}; effect_groups = {}
    for entry in leader['cardSkills']:
        raw = tables['LiveLeaderSkill'][entry['skillId']]
        description = tables['LangGeneratedLiveLeaderSkill_Jpn'][raw['descriptionLangId']]['text']
        assert entry['description'] == description
        parsed = presentation(description)
        assert parsed == entry['presentation'] and parsed['status'] == 'classified'
        assert len(parsed['effects']) == (2 if raw.get('additionalLivePassiveSkillEffectGroupId') else 1)
        effects = []
        for index, display in enumerate(parsed['effects']):
            prefix = 'additionalLive' if index else 'live'
            trigger_id = raw.get(prefix + 'SkillTriggerGroupId')
            effect_id = raw[prefix + 'PassiveSkillEffectGroupId']
            trigger_records = records[('LiveSkillTrigger', trigger_id)] if trigger_id else []
            effect_records = records[('LivePassiveSkillEffect', effect_id)]
            # Search snapshot group fields too; never derive fields from ID spelling.
            snapshot_trigger = [r for r in survey['joinedSourceRows']['LiveSkillTrigger'] if r['fields'].get('groupId') == trigger_id] if trigger_id else []
            snapshot_effect = [r for r in survey['joinedSourceRows']['LivePassiveSkillEffect'] if r['fields'].get('groupId') == effect_id]
            condition = {'referenceId': trigger_id, 'text': display['conditionText'], 'canonicalRecords': trigger_records,
                         'snapshotRecordCount': len(snapshot_trigger), 'type': 'unknown', 'status': 'unresolved', 'requiredCount': None}
            if not trigger_id:
                assert display['conditionText'] is None
                condition.update(type='not_stated', reason='原文に条件記載なし・Leader行にtrigger参照なし。明示alwaysとは確定しない')
            elif len(trigger_records) == 1:
                fields = trigger_records[0]['fields']; count = int(fields['threshold'])
                assert count == 2 and fields['number'] == 1
                if fields['type'].endswith('_DECK_CARD_ATTRIBUTE'):
                    condition.update(type='attribute_count', attribute=fields['cardAttributeType'])
                elif fields['type'].endswith('_DECK_CARD_CHARACTER_GROUPING'):
                    condition.update(type='affiliation_count', affiliationId=fields['characterGroupingId'])
                else:
                    raise AssertionError('New condition needs review')
                condition.update(status='reference_resolved', requiredCount=count, reason=None)
            else:
                condition.update(reason='既存Canonicalと保存済み調査snapshotに条件参照先なし。原文・IDから実行条件を生成しない')
            if trigger_id:
                group = condition_groups.setdefault(trigger_id, {'condition': condition, 'leaderIds': [], 'texts': []})
                if entry['skillId'] not in group['leaderIds']: group['leaderIds'].append(entry['skillId'])
                if display['conditionText'] not in group['texts']: group['texts'].append(display['conditionText'])
            effect_groups.setdefault(effect_id, {'canonicalRecords': effect_records, 'snapshotRecordCount': len(snapshot_effect), 'leaderIds': []})['leaderIds'].append(entry['skillId'])
            parameter = LABELS[display['label']]
            assert display['targetText'] == '全員'
            effects.append({'index': index, 'role': 'additional' if index else 'primary',
                'description': display['description'], 'typeFromOriginalText': parameter,
                'isParameter': parameter != 'score_support', 'amountPercentFromOriginalText': display['amountPercent'],
                'amountEvidence': 'LangGeneratedLiveLeaderSkill_Jpn原文の%（ID命名から推定しない）',
                'target': {'typeFromOriginalText': 'all_members', 'text': '全員', 'selectionRule': 'not_required_by_text', 'selectCount': None, 'countMeaning': '全員。固定N人の指定なし'},
                'condition': condition, 'effectGroupId': effect_id,
                'effectRecords': effect_records, 'snapshotEffectRecordCount': len(snapshot_effect),
                'effectReferenceStatus': 'resolved' if effect_records else 'unresolved',
                'effectReferenceReason': None if effect_records else 'Leader原本5テーブルに効果テーブル未収録。Canonical/snapshotにも該当groupIdなし',
                'effectSchemaCompatibility': 'P/T/S/allの既存表現と同型' if parameter != 'score_support' else 'Parameter Effect対象外・Support仕様未確認',
                'numericCalculation': 'unconfirmed' if parameter != 'score_support' else 'not_applicable_to_parameter',
                'semanticsFullyConfirmed': False})
        has_parameter = any(e['isParameter'] for e in effects)
        reasons = ['効果groupの参照先未収録。原文による意味候補とraw effect定義を区別する']
        if any(e['condition']['status'] == 'unresolved' for e in effects): reasons.append('条件参照欠落または明示always未確認')
        if has_parameter: reasons.append('Leader計算基数・丸め・Passiveとの集約方式の検証根拠なし')
        if any(not e['isParameter'] for e in effects): reasons.append('Supportの数値計算・適用方式は今回未確認')
        row = {'leaderId': entry['skillId'], 'cardId': entry['cardId'], 'cardName': cards[entry['cardId']]['name'],
               'memberName': cards[entry['cardId']]['member']['name'], 'costumeId': entry['costumeId'],
               'description': description, 'sourceReferences': entry['source'], 'rawLeaderRecord': raw,
               'parameterIncluded': has_parameter, 'supportIncluded': any(not e['isParameter'] for e in effects),
               'compound': len(effects) > 1, 'effects': effects,
               'classification': 'C', 'classificationReasons': reasons,
               'resolverCompatibility': {
                   'structure': '全員target追加・Leader source追加で原文構造を表現可能。実行仕様確定とは別',
                   'condition': ['existing-resolver' if e['condition']['status'] == 'reference_resolved' else 'unresolved' for e in effects],
                   'target': 'all_membersの追加が必要（既存targetに全員typeなし）',
                   'selection': '不要（原文上全員）',
                   'effectSchema': 'Parameter P/T/S/allの効果表現は同型。複合は独立effect配列が必要',
                   'numericCommonality': '未確認' if has_parameter else 'Parameter対象外',
                   'existingResolversOnly': False},
               'calculationVerification': {
                   'status': 'unconfirmed' if has_parameter else 'not_applicable',
                   'basis': 'unknown', 'baseBloomPassiveMemoryBoardCostumeInclusion': 'unknown',
                   'rounding': 'unknown', 'sourceRateAggregation': 'unknown', 'passiveLeaderAggregation': 'unknown',
                   'parameterVsTotal': '原文はP/T/Sまたは全パラ。P/T/S別計算は推測可能だが未検証' if has_parameter else 'Parameter対象外',
                   'verifiedLeaderFixture': None}, 'unresolved': reasons}
        rows.append(row)
    effect_counts = collections.Counter(e['typeFromOriginalText'] for r in rows for e in r['effects'])
    conditions = collections.Counter()
    for r in rows:
        for key in {e['condition']['type'] for e in r['effects']}: conditions[key] += 1
    summary = {'leaderCount': len(rows), 'effectRowCount': sum(len(r['effects']) for r in rows),
               'parameterIncluded': sum(r['parameterIncluded'] for r in rows),
               'parameterExcluded': sum(not r['parameterIncluded'] for r in rows),
               'singleParameter': sum(r['parameterIncluded'] and not r['compound'] for r in rows),
               'compound': sum(r['compound'] for r in rows), 'classification': {k:sum(r['classification']==k for r in rows) for k in ['A','B','C']},
               'conditionLeaderCounts': dict(conditions), 'effectRowCounts': dict(effect_counts),
               'targetLeaderCounts': {'all_members_from_text': len(rows)}, 'selectCountLeaderCounts': {'all_no_fixed_N': len(rows)},
               'conditionGroups': len(condition_groups), 'resolvedConditionGroups': sum(v['condition']['status']=='reference_resolved' for v in condition_groups.values()),
               'effectGroups': len(effect_groups), 'resolvedEffectGroups': sum(bool(v['canonicalRecords']) for v in effect_groups.values()),
               'existingConditionResolverCompatibleLeaders': sum(all(e['condition']['status']=='reference_resolved' for e in r['effects']) for r in rows),
               'existingResolversOnly': 0, 'numericConfirmed': 0,
               'parameterNumericUnconfirmed': sum(r['parameterIncluded'] for r in rows),
               'commonEffectsExcluded': len(leader['commonEffects'])}
    assert summary['parameterIncluded'] + summary['parameterExcluded'] == len(rows)
    assert summary['effectRowCount'] == sum(len(row['effects']) for row in rows)
    assert summary['conditionGroups'] == summary['resolvedConditionGroups']
    assert summary['resolvedEffectGroups']==0
    assert sum(summary['conditionLeaderCounts'].values()) == len(rows)
    assert sum(summary['effectRowCounts'].values()) == summary['effectRowCount']
    assert all(r['classification']=='C' and all(not e['effectRecords'] for e in r['effects']) for r in rows)
    assert all(len(r['effects'])==2 and r['effects'][0]['isParameter'] and not r['effects'][1]['isParameter'] for r in rows if r['compound'])
    return {'scope':'research-only; no executable Leader rules', 'inputs': hashes(),
            'classificationPolicy': 'A=構造参照確定、B=参照確定かつ小規模構造拡張、C=参照/意味/計算根拠不足。今回は全件効果参照不足でC。数値検証は別field。',
            'summary': summary, 'conditionGroups': condition_groups, 'effectGroups': effect_groups,
            'commonEffectsBoundary': {'count':54,'skillIdOverlap':[], 'automaticAssignment':False,'cardReferences':[], 'note':'衣装/Leader source表は共有するがskillIdは非重複。★3への対応を推測しない'}, 'leaders':rows}

def report(result):
    s=result['summary']
    lines=[f"# Leader {s['leaderCount']}件の元データ参照監査", '',
      'この監査のC分類・numericConfirmed=0は原本effect参照の裏付けを示す旧監査軸。開発者承認・実測による現在の計算接続状況とは別。計算仕様は [Leader Parameter接続](leader-parameter-integration.md) および [差分更新](card-library-update.md) を参照。', '',
      '## 全体集計', '', '```json', json.dumps(s,ensure_ascii=False,indent=2), '```', '',
      '## 条件参照', '', '| 参照ID | 状態 | Leader数 |', '|---|---|---:|']
    for key,v in sorted(result['conditionGroups'].items()):
        lines.append(f"| {key} | {v['condition']['type']} / {v['condition']['status']} | {len(v['leaderIds'])} |")
    lines += ['', '今回、追加カードのJOIN到達範囲にPromise人数条件が入り、18種類すべての条件参照を回収した。原文から未定義の効果を推測補完していない。', '',
      '## 効果と共通化', '', '全件の原文・効果率・対象・条件・元レコード参照は `unit-leader-audit.json` に保持。対象は全員、順位選択は不要。Effect原本group参照先は引き続き保存データ内にないため、原文からの意味解釈とraw定義確認を区別する。', '',
      '基礎衣装54件はカード固有Leaderと分離し、自動付与しない。', '',
      '再生成: `python3 -B research/audit_unit_leaders.py` / `--check`。旧131件・条件17/18件という履歴はGit上の前版および既存調査メモに保持。', '']
    return '\n'.join(lines)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    before=hashes();result=build()
    outputs={'research/unit-leader-audit.json':json.dumps(result,ensure_ascii=False,indent=2)+'\n', 'research/unit-leader-audit.md':report(result)}
    for name,content in outputs.items():
        if args.check: assert (ROOT/name).read_text()==content, f'{name}: regenerate and review'
        else: (ROOT/name).write_text(content)
    assert hashes()==before, 'Audit input mutated'
    print(json.dumps(result['summary'],ensure_ascii=False,indent=2))
    print('Leader audit reproduction PASS' if args.check else 'Leader audit generated')

if __name__=='__main__': main()
