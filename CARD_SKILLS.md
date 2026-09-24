# Card v2の手入力スキル

保存エンベロープは従来どおり `version: 2` と `cards`。カードID・Active値・extensions等を維持する。

| 分類 | 保存先 | 内容 |
| --- | --- | --- |
| SP | `skills.special` | `effectTypes`（複数選択）、共通の`boost`（%）、`duration`（秒）、`description` |
| A | `skills.active` | `effectType: "score_up"`を追加。既存のinterval/probability/duration/boost/descriptionを維持 |
| P | `skills.passive.effect` | 単一の`type`、`condition`、`conditionCount`、`target`、`targetCount`、`value`（%）、`description` |

SP/Pともスコアサポートの効果種別は `score_support`。単位は同じ率（%）で、発生源はspecial/passiveで区別する。SPの効果ごとの個別値や発動時刻は保存しない。空欄のSP効果値・時間はnull。

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

条件のkindはnone/type/affiliation/text。所属は条件の参照値のみを保存し、カード自身の所属情報をコピーしない。自由記述はtextとして保存し、自動解釈しない。既存の未知の選択値も編集時に表示して保持する。

## 旧データとの互換性

`getPassiveEffect()`が旧`skills.passive.scoreSupport`を新UI向けに解釈する。boostはvalue、旧conditionType/targetTypeはtype条件へ対応する。旧ステータス説明は推測分類せず、補足欄で保持する。

Libraryで保存すると新effectが追加される。旧scoreSupportや未知フィールドは消去しないが、新effectが存在する場合はそれが正本となる。`getPassiveScoreSupport()`が計算側へ接続し、PをステータスUPや未設定へ変更した場合に旧scoreSupportを再適用しない。旧scoreSupportへの二重書き込みはしない。

カード名は新規空欄なら未分類、既存編集の空欄なら既存名を維持する。このルールは`createCardV2()`に集約している。

## 計算範囲

既存のタイプ条件付きPスコアサポートは従来の倍率計算へ接続する。所属・原文・未知条件は未評価として保留し、タイプ条件や全員対象へ読み替えない。

ステータスUP、SPの時間接続、P複合効果、重複規則、候補超過時の選択、ゲーム側丸め、開花補正は追加実装していない。Activeの周期・候補時刻・MAX評価関数は変更していない。

## 検証

macOSでは `python3 tests/verify.py` でJavaScriptCoreによる単体・回帰テストを実行できる。`tests/browser.html`は専用ブラウザープロファイルとローカルHTTPサーバーで使用する。テストはlocalStorageを一時使用して終了時に復元するため、普段の保存データがあるプロファイルでは実行しない。
