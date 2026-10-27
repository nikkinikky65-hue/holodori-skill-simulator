# Passive：所属対象効果

カードライブラリ限定の表示条件。初期OFF。ONならLv1/Lv2のどちらかの効果対象に所属指定があるカードを表示する。タレントID条件・名前検索・レア度・タイプとはAND結合する。OFFは既存の他条件を保持し、Passive条件だけを外す。

## 判定データ

Canonicalの `skills.passive.levels[].effect.target.sourceFacts` にあるLiveSkillEffectTarget由来のtype/characterGroupingIdを使う。ブラウザーでは既存のCanonical派生Runtime Catalogの `skills.passive.levels[].target.selectors[]` を参照する。完全なCanonicalファイルを追加配信せず、独立監査で全392レベルの対象指定が一致することを検証する。

対象型は `LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_CHARACTER_GROUPING`、characterGroupingIdが空でなく、効果とLv1/Lv2の確認ができる場合に該当する。複数selectorが共存していても1つ該当すれば対象。自身・属性・全員だけの指定、発動条件のcharacterGroupingId、説明文は該当根拠にしない。編成の成立条件、計算エンジンの対応状態、現在の育成段階は参照しない。

現行Canonicalは全レベル1効果構造。複数効果の取りこぼしがないことをsourceReferencesで検査する。未知の型・レベル・対象欠落・所属ID欠落は推測しない。将来データ構造が変わった場合は監査テストが検出するため、解析構造を確認してから対応する。

## 2026-10-27監査

196枚・392レベルを比較。該当41枚（★5 27枚、★4 14枚、★3 0枚）、82レベル。所属が発動条件だけにある24レベルは除外。所属対象IDは全て既存のruntime-affiliations.jsonで参照確認済み。不明な対象型・参照欠落・複数効果投影の欠落・保留ケースは0件。実データではLv1/Lv2の該当集合は同じで、片方だけ該当するケース・共存selector・全員対象はテスト用データで検証する。

## 検証コマンド

```sh
python3 -B tests/verify-catalog-passive-filter.py
python3 -B tests/verify.py
python3 -B tests/verify-parameter-comparison-browser.py
```

説明文検索や既存計算処理の変更はなく、共有タレント選択・所持育成保存・Canonical/Runtimeデータも変更しない。
