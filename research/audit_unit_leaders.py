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
    assert len(leader['cardSkills']) == 131 and len(leader['commonEffects']) == 54
    assert len({r['cardId'] for r in leader['cardSkills']}) == 131
    assert len({r['skillId'] for r in leader['cardSkills']}) == 131
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
    assert summary['parameterIncluded']==121 and summary['singleParameter']==105 and summary['compound']==16
    assert summary['parameterExcluded']==10 and summary['effectRowCount']==147
    assert summary['conditionGroups']==18 and summary['resolvedConditionGroups']==17
    assert summary['resolvedEffectGroups']==0
    assert sum(summary['conditionLeaderCounts'].values()) == 131
    assert sum(summary['effectRowCounts'].values()) == 147
    assert all(r['classification']=='C' and all(not e['effectRecords'] for e in r['effects']) for r in rows)
    assert all(len(r['effects'])==2 and r['effects'][0]['isParameter'] and not r['effects'][1]['isParameter'] for r in rows if r['compound'])
    return {'scope':'research-only; no executable Leader rules', 'inputs': hashes(),
            'classificationPolicy': 'A=構造参照確定、B=参照確定かつ小規模構造拡張、C=参照/意味/計算根拠不足。今回は全件効果参照不足でC。数値検証は別field。',
            'summary': summary, 'conditionGroups': condition_groups, 'effectGroups': effect_groups,
            'commonEffectsBoundary': {'count':54,'skillIdOverlap':[], 'automaticAssignment':False,'cardReferences':[], 'note':'衣装/Leader source表は共有するがskillIdは非重複。★3への対応を推測しない'}, 'leaders':rows}

def report(result):
    s=result['summary']
    lines=['# Leader 131件監査', '', '対象は保存済み固定commitのカード対応Leaderのみ。監査のみで計算・UI・Canonical・Runtimeは変更しない。', '',
           '## 全体集計', '', '```json', json.dumps(s,ensure_ascii=False,indent=2), '```', '',
           '## A / B / Cと確定度', '',
           'A 0、B 0、C 131。全件で元Leader行の効果group参照はあるが、参照先のLivePassiveSkillEffect行が保存済みデータにないため。名前の似たIDからeffect enumやpermilを復元しない。原文の%・対象・parameter種別は記録できるが、raw定義確定とは扱わない。',
           '数値計算式確認済みは0。Parameterを含む121件は未確認、Supportのみ10件はParameter計算対象外。A/B/Cと数値確認fieldは別管理であり、将来Aへ移っても計算可能とは限らない。', '',
           '## 条件18種類', '', '| 参照ID | 意味/状態 | Leader数 |', '|---|---|---:|']
    for key,v in sorted(result['conditionGroups'].items()):
        c=v['condition']; meaning=f"{c['type']} / {c.get('attribute',c.get('affiliationId','参照先欠落'))} / count={c['requiredCount']}"
        lines.append(f"| {key} | {meaning} | {len(v['leaderIds'])} |")
    lines += ['', '17種類はCanonicalのLiveSkillTrigger.groupIdへ明示joinできる。残りはPromise人数条件で2カードに該当。原文はPromiseが2人以上だが、実行用所属ID/人数条件を文字列やID名から生成しない。Canonicalおよび元調査snapshotで参照欠落。',
              '条件記載なし64件はtrigger参照も欠落。明示alwaysを意味するschema根拠は未確認なのでnot_statedとして保持する。原文上所属人数条件は38件（解決36＋Promise未解決2）、属性人数条件29件。', '',
              '## 効果・複合の照合', '',
              '元LiveLeaderSkill → descriptionLangId → LangGeneratedLiveLeaderSkill_Jpnをjoinして原文と配信descriptionを照合し、既存presentation生成関数で表示構造の一致を確認する。presentationだけから計算仕様を確定しない。',
              '効果groupは24種類、保存済みCanonical/調査snapshotとの一致0。Leader追加原本はCostume/Leader/言語の5テーブルで、効果テーブル自体が含まれない。JSONは原本行・primary/additionalの参照と欠落理由を保持する。',
              '単一Parameter105件（P22/T20/S21/all42）、Supportのみ10件。複合16件はall+Support8、P+Support3、S+Support3、T+Support2。計147効果行。',
              '複合はprimary/additionalのeffect参照とtrigger参照が別fieldなので、2効果として記録できる。原文Parameter部分の意味候補は独立して読める。ただし追加効果の発動評価・独立性・計算の根拠は不十分で、全体はCのまま。Parameterだけ接続しない。Support10件の原文・条件・対象も全件JSONに保持。', '',
              '## Resolver適合と共通化候補', '',
              '全員targetは現在のTarget Resolverにない。よって既存Resolverのみで端から端まで処理できるものは0。Selectionは全131件で原文上不要。所属人数条件を所属targetへ取り違えない。',
              f"既存Condition Resolverと同型の参照が揃うLeaderは{s['existingConditionResolverCompatibleLeaders']}件（属性29＋所属36）。残る66件は条件記載なし64＋参照欠落2。", 
              '構造追加の候補はall_members target（131件の対象表現をカバー）、source=leader（131件の出典を分離）、独立effect配列（複合16件）。Parameter型P/T/S/allは既存Effect表現と同型で121件分の候補になる。これらは表現可能件数であり、新しく正しく数値計算できる件数ではない。',
              'PassiveのcalculatePassiveEffectsは対象parameter率合算後ceil。calculateOutfitEffectsは明示baseに率を掛け各項ceil。ただしLeader原文からoutfitRatesへ変換する根拠や、Leaderと衣装補正の同一性を確定したfixtureはない。どちらの式も今回Leaderへ流用しない。', '',
              '## 計算仕様の確定度', '',
              '| 項目 | 判定 |', '|---|---|',
              '| 原文・カード衣装Leaderの明示join、primary/additional参照 | 確認済み |',
              '| 全員対象、Parameter名、% | 原文で確認済み。raw effect参照は未解決 |',
              '| P/T/Sへ作用しTOTAL直接倍率ではないという解釈 | データ上は推測可能だが未検証 |',
              '| Base/Bloom/Passive/Memory/Board/衣装の何を基数へ含むか | 不明 |',
              '| source別ceilか率合算後ceilか、Passiveと合算か独立か | 不明 |',
              '| Leader選出・複数sourceの適用範囲、Support発動境界 | 不明 |',
              '| Leader数値計算とPassive数値計算の共通性 | 未確認 |', '',
              'CASE CのPassive4532/Memory2451/Enhancement1397は既存基盤の回帰根拠であり、Leader式の実測根拠ではない。', '',
              '## 次工程と共通54件との境界', '',
              'まず固定commitに対応する不足効果レコードとPromise条件の原本を確認する。今回は新規取得せず、既存保有データの欠落として報告する。その後、単一Parameter・参照解決済み条件群からLeader有無で比較できる実測fixtureを作り、基数、丸め、Passiveとの合算を分離検証する。現時点で数値計算へ即接続できる群はない。',
              '共通54件は監査leadersへ混ぜず、skillIdの重複なしを検査。デフォルト衣装との明示関係だけを保持し、cardIds空のまま。★3やカードへの自動付与なし。', '',
              '## 再生成と検証', '',
              '`python3 -B research/audit_unit_leaders.py` でJSONと本レポートを生成。`--check`は両方のバイト一致を検査し書き込まない。131一意ID、147効果行、参照/原文/presentation一致、共通54分離、入力SHAとcommitを検査する。',
              '既存検証コマンド: `python3 -B tests/verify.py`、`python3 -B tests/runtime-catalog.test.py`、`python3 -B tests/leader-catalog.test.py`、`python3 -B research/audit_unit_passives.py --check`。2026-10-07実行は全てPASS（CASE C 4532/2451/1397、Memory、Enhancement、Timeline、固定seed Simulationを含む）。Leader監査--checkもPASS。開始時の既存ファイルSHA照合で変更なしを確認。UI変更なしのためChrome再実行は不要。', '']
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
