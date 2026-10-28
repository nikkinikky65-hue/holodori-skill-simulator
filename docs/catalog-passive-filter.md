# Passiveスキル絞り込み（三軸）

カードライブラリの検索操作に「タレント絞り込み」「スキル絞り込み」を同列で配置。スキルダイアログはPassiveのみを表示する。条件（指定なし/あり/なし）は単一選択、対象（自身のみ/所属/カードタイプ）と効果内容（単項P/T/S・全パラメータ・スコアサポート）は複数選択。分類内OR、分類間ANDで、Lv1/Lv2のいずれかの同一効果が一致した場合にカードを抽出する。全未指定はスキル条件なし。

「適用」で確定し、キャンセル・Escape・外側クリックはドラフトを破棄する。全解除も適用するまで確定しない。再表示で確定条件を復元する。タレント・文字検索・レア度・タイプとはAND結合し、それぞれ独立して解除できる。単独の所属対象チェックボックスは廃止し「対象：所属」に統合した。

## 判定元

ブラウザーは既存Canonical派生Runtime Catalogを読む。監査は完全CanonicalのsourceFactsと収録元行sourceRecordsを独立に読み、196枚・392レベルで一致を確認する。Canonical・Runtimeや計算処理は変更しない。

- 条件あり：CanonicalのLivePassiveSkillLevel原行にliveSkillTriggerGroupIdがあり、構造化conditionの節が確認できるもの。RuntimeではreferenceState=present、state=observed、clausesの存在を使う。
- 条件なし：原行に追加条件の参照項目がなく、Canonicalにもconditionがないもの。RuntimeではreferenceState=absentかつstate=unobserved、条件節・参照IDがないもの。unobservedやevaluationStatus=unresolvedだけでは「なし」としない。「追加条件参照なし」という検索分類であり、計算エンジンで無条件発動を保証する判定ではない。
- 対象：Canonical effect.target.sourceFactsのLiveSkillEffectTarget型とcharacterGroupingId/cardAttributeType。Runtimeはtarget.selectorsを使用。SELFだけなら自身のみ、CHARACTER_GROUPINGと非空IDなら所属、ATTRIBUTEと既知のタイプIDならカードタイプ。SELFと他対象の混在は自身のみとしない。
- 効果：Canonical effect.effect.factsのtype、Runtime effect.raw.type。PERFORMANCE/TECHNIQUE/SENSE_UP_PERMIL_UP、ALL_PARAMETER_UP_PERMIL_UP、LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UPを、それぞれ独立した5カテゴリへ対応付ける。最後の型は既存ScheduledSupportEngineのPassive Support型と同じ。

説明文、編成、効果の計算対応状況、現在の育成段階は参照しない。単項と全パラメータを検索段階で展開・同一視しない。

## 2026-10-28監査

|軸|分類|カード数|
|---|---|---:|
|条件|あり|117|
|条件|なし（追加条件参照なし）|79|
|対象|自身のみ|41|
|対象|所属|41|
|対象|カードタイプ|114|
|効果|パフォーマンスUP|37|
|効果|テクニックUP|37|
|効果|センスUP|37|
|効果|全パラメータUP|43|
|効果|スコアサポート|42|

対象：所属は旧41枚・82レベルと全件一致（★5 27枚、★4 14枚）。所属が発動条件にだけ登場する24レベルは所属対象から除外される。

現データは各レベル1効果・1対象selector。Lv1/Lv2で三軸の分類が異なるカード、同一軸で複数分類になる効果、分類不能、対象参照欠落は0件。複数所属のタレントであることと、Passiveの対象分類は別である。

## 複数効果と将来の課題

passive-skill-filter.jsは効果単位の分類/検索を担当し、skill-filter.jsは選択UIだけを担当する。現行の各レベル1効果をそれぞれ独立した単位にする。matchesUnitsは各単位内で全軸を照合してからORを取るため、異なる効果/レベルを組み合わせない。この性質は合成した複数単位およびLv1/Lv2の異なる分類でテストしている。

将来Canonicalに複数効果/新しい条件・対象・効果型が増えた場合、現行の単一効果Runtime投影をそのまま利用できるとは限らない。監査ではsourceReferencesの効果参照数も検査する。新構造は推測で走査せず、投影の対応と同一効果の結び付きを確認してから追加する。SP/ActiveのUIや判定は未実装。

## 検証

```sh
python3 -B tests/verify-catalog-passive-filter.py
python3 -B tests/verify.py
python3 -B tests/verify-parameter-comparison-browser.py
```

Canonical/raw行の全件比較、5効果分類の分離、OR/AND、複数単位/Lv1・Lv2、旧41枚との一致、既存条件との併用、適用・取消・全解除、育成設定保持、1280/768/390pxを検証する。既存のParameter比較・SP・最適化・保存・カード出力も回帰対象。

初回ブラウザー回帰で、変更していないタレントダイアログの「閉じる後のフォーカス復帰」テストが失敗。固定30ms待ちをcloseイベント待ちへ変更した（共通UI本体は変更していない）。結果は作業完了報告にも記載する。

closeイベント待ちへの修正後、全10ページのブラウザー回帰テストが成功。画像リクエストは0件。
