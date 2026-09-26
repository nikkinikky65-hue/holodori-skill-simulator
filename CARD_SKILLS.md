# Card v2の手入力スキル

保存エンベロープは従来どおり `version: 2` と `cards`。カードID・Active値・extensions等を維持する。

| 分類 | 保存先 | 内容 |
| --- | --- | --- |
| SP | `skills.special` | `effects`（効果ごとの`type`、`value`、任意の`duration`）、`description`。旧形式の`effectTypes`、共通`boost`、`duration`は読み込み互換のみ |
| A | `skills.active` | `effectType: "score_up"`を追加。既存のinterval/probability/duration/boost/descriptionを維持 |
| P | `skills.passive.effect` | 単一の`type`、`condition`、`conditionCount`、`target`、`targetCount`、`value`（%）、`description` |

SP/Pともスコアサポートの効果種別は `score_support`。新形式では効果ごとに値を保持する。

現行LibraryのSP type IDは `score_support`、`skill_frequency_up`、`life_recovery`、`judgment_enhancement`、`other`。任意の未知typeも保持する。旧ID `skill_activation_rate_up` と `judgement_enhancement` は読み込み時にそれぞれ `skill_frequency_up` と `judgment_enhancement` へ正規化し、Libraryで保存すると正規IDで保存する。

```json
{
  "effects": [
    {"type": "score_support", "value": 50, "duration": 8},
    {"type": "life_recovery", "value": 300}
  ],
  "description": "ゲーム内の説明"
}
```

`duration`不要の効果には保存しない。旧形式は共通値を各効果へ展開して読み込み、Libraryで保存すると`effects[]`へ移行する。

Pの例：

```json
{
  "type": "score_support",
  "condition": {"kind": "affiliation", "value": "0期生"},
  "conditionCount": 3,
  "target": {"kind": "type", "value": "cute"},
  "targetCount": 2,
  "value": 8,
  "description": "ゲーム内の説明"
}
```

自身を対象にする場合は `{"kind": "self", "value": ""}` とし、`targetCount` は1として保存する。既存の空の`text`対象は自動移行しない。

条件のkindはnone/type/affiliation/text/self。所属は条件の参照値のみを保存し、カード自身の所属情報をコピーしない。自由記述はtextとして保存し、自動解釈しない。既存の未知の選択値も編集時に表示して保持する。

## Bloom

`progression.bloom` は現在段階として保持し、`getBloomEffectType(rarity, bloomLevel)` が強化対象だけを返す。★4・★5は active / all_parameters / special / passive / connect、★3は active / all_parameters / special / passive / all_parameters の順。Bloomによる値の計算、base/effective値の分離、Connect接続、Skill強化値は未実装で、既存statsも変更しない。

## 旧データとの互換性

`getPassiveEffect()`が旧`skills.passive.scoreSupport`を新UI向けに解釈する。boostはvalue、旧conditionType/targetTypeはtype条件へ対応する。`skills.passive.status.description`は現行UI用に維持する。

旧scoreSupportは読み込み互換のみ。Libraryで編集保存すると`skills.passive.effect`へ移行し、旧`scoreSupport`オブジェクトは削除する。新規カードのデフォルト構造にも旧scoreSupportを生成しない。`extensions`および旧フィールド以外の未知フィールドは保持し、新effectが存在する場合はそれが正本となる。`getPassiveScoreSupport()`が計算側へ接続し、PをステータスUPや未設定へ変更した場合に旧scoreSupportを再適用しない。旧scoreSupportへの二重書き込みはしない。

カード名は新規空欄なら未分類、既存編集の空欄なら既存名を維持する。このルールは`createCardV2()`に集約している。

## 計算範囲

既存のタイプ条件付きPスコアサポートは従来の倍率計算へ接続する。所属・原文・未知条件は未評価として保留し、タイプ条件や全員対象へ読み替えない。

ステータスUP、SPの時間接続、P複合効果、重複規則、候補超過時の選択、ゲーム側丸め、開花補正は追加実装していない。Activeの周期・候補時刻・MAX評価関数は変更していない。

## 検証

macOSでは `python3 tests/verify.py` でJavaScriptCoreによる単体・回帰テストを実行できる。`tests/browser.html`は専用ブラウザープロファイルとローカルHTTPサーバーで使用する。テストはlocalStorageを一時使用して終了時に復元するため、普段の保存データがあるプロファイルでは実行しない。
