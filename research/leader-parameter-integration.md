# Leaderステータス接続（2026-10-09）

## 今回採用する仕様と以前の監査との差

今回ユーザーが確定した規則を実装根拠とする。Leader＝衣装スキル、編成5枠とは独立。対象の開花後P/T/Sを基数として各人・各対象parameterをceil。Passive/Memory/Boardはこの補正を基数に含めず、EnhancementにはLeader加算を含める。
旧 `unit-leader-audit.md/json` の「数値未確認・全C」は当時の調査履歴。今回の明示仕様が数値接続を許可するため、raw効果レコードの欠落だけを理由に既知の原文の率を保留しない。ただしPromiseの所属参照不足は残す。旧監査の分類・意味情報は維持し、Engine変更に伴う入力SHAのみ再生成更新した。今回の接続状況は本書と新規テストで区別する。
データのPはPerformance（パフォーマンス）という既存名称を維持。今回依頼のP上昇を接続し、新しい「パッション」フィールドは作らない。

## 構成

- 既存 `data/runtime-leader-skills.json` と `research/unit-leader-audit.json` の原文由来effect/条件参照を `research/build_leader_parameter_rules.py` で小さな実行用 `data/leader-parameter-rules.json` に投影する。131件のID・原文一致、入力SHA、Canonical SHAを保持。ライブラリや原文を手作業で二重管理しない。
- 再生成：`python3 -B research/build_leader_parameter_rules.py`。一致確認：同コマンド `--check`。
- `leader-parameter-engine.js` は全員target、P/T/S/all、既存Condition Resolverを利用。Leader条件記載なしは今回の接続方針に基づき条件なしとして評価する。属性/所属条件は5人だけで数え、独立Leader自身を人数へ加えない。
- 基数はParameter Engineへ渡された開花後値。既存 `calculateOutfitEffects()` を利用し、率をライブラリから取得する。UIへ式を書かない。
- 各人 `leader` と編成 `leader` にP/T/S/TOTALを保持。既存subtotalへ独立加算。Enhancement components.leaderへ同じ値を渡し、Memoryは引き続き除外。
- traceはsource、原文、条件結果、target slot/card、parameter、基数、率、生値、ceil後を保持。条件不成立はinactive、参照不足はunresolved、Supportはunsupported。
- UIは独立したLeader衣装selectとLeader内訳・適用状態のみ追加。未選択が初期値。共通54衣装は別optgroupで明示選択でき、自動付与しない。ページ内状態でありlocalStorage/旧保存形式は変更しない。
- 外部衣装TOTALをAPIで併用する場合、それに選択Leaderの同じ補正を重複入力しない。今回新しい衣装TOTAL入力UIや自動変換は追加していない。

## 全件分類

|範囲|完全対応|限定対応|未対応|計|
|---|---:|---:|---:|---:|
|カード固有Leader全体|103|16|12|131|
|そのうちParameterを含むカード|103|16|2|121|
|共通衣装（別枠・明示選択）|54|0|0|54|

カード固有147効果行：Parameter119行接続、Parameter2行保留、Support26行対象外。複合16件のParameter部分は全16件接続、Support部分のみ保留。Supportのみ10件は今回未対応。共通効果は54行すべて接続。
ライブラリの対象は全件「全員」。人数条件の属性/所属を対象者フィルタと誤解しない。実データに対象限定Leaderはないため、それを架空に追加しない。未知targetはunresolved、Pだけの効果はT/Sへ加算しない。現在収録の複合はParameter＋Supportで、同parameterの複数Leader source合算を新規に確定していない。

## 提示実測との照合限界

|効果|報告Leader|報告Enhancement|報告Unit|差引残余|
|---|---:|---:|---:|---:|
|全パラ15%|7492|2486|86165|76187|
|P100%|17554|2797|96538|76187|
|全パラ45%|22468|2949|101604|76187|
|キュート2人以上で全員S130%|19992|2872|99051|76187|

今回のユーザー報告を記録した表で、Engineの再現値ではない。Unit−Leader−Enhancementが4条件とも76187という算術整合性を確認した。ただし、この残余から編成を逆算しない。
researchの実測資料・testsのCASE C等を検索したが、この4組の固定5カード/実Lv/開花/P/T/S・Board・Passive・Memory・強化率・衣装状態の対応記録は発見できなかった。既存CASE CはPassive4532/Memory2451/Enhancement1397/Unit61255であり、今回の固定編成と同一と扱えない。
したがって4組の数値再現は**未検証**。不足する固定編成の各入力と実測時のLeader指定が得られればfixtureへ直接追加可能。合計だけに合わせた架空のカード値・補正値を作っていない。

## テスト結果

- `tests/leader-parameter.test.js`（`tests/verify.py`へ追加）：全131件/147効果、共通54件、条件成立/不成立、ceil、P/T/S以外非加算、複合のParameter独立適用、未知target保留、Passive/Memory/Memory trace不変、Enhancement基数、Timeline・正規化固定seed非干渉：PASS。
- 実データの全条件を網羅するため、全件テストでは条件成立する合成編成も利用する。ゲーム実測fixtureではない。
- `tests/verify.py`：PASS（既存CASE C、全Parameter、SP確率/Support等を含む）。
- Runtime整合性・Leader配信整合性・新派生データ再生成一致：PASS。
- Passive/Leader監査の再生成一致：PASS。旧監査JSONはinputs以外の全項目が更新前と同一であることを検証。
- Chrome `tests/leader-parameter-browser.html`：1100/360px、131+54の選択、S100%、Enhancement再計算、参照不足表示、未選択復帰、保存非干渉：PASS。
- Chrome `tests/unit-simulator-browser.html` / `tests/browser.html`：PASS。

## 残ったカード・効果

以下はParameter保留2件とSupport未接続26効果。Supportは今回の対象外であり、Parameter部分の適用を妨げない。

|カード|Leader ID|未接続効果|理由|
|---|---|---|---|
|百鬼あやめ / 隠世でのほほん、気ままな提灯|live_leader_skill-card-00010-5-uniq-0010-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|癒月ちょこ / 悪魔な魅惑に手玉にとられて|live_leader_skill-card-00011-5-uniq-0011-00|[attribute=happy]ハッピータイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|大空スバル / Energeticスプラッシュ！|live_leader_skill-card-00012-5-uniq-0062-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|さくらみこ / ビーチで弾ける、光彩ショット！|live_leader_skill-card-00015-5-uniq-0067-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|戌神ころね / 密林を舞うワイルドサマー！|live_leader_skill-card-00017-5-uniq-0077-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|兎田ぺこら / 愛嬌たっぷりラビットフィールド|live_leader_skill-card-00019-5-uniq-0016-00|[attribute=cute]キュートタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|不知火フレア / ダンスから伝わる気遣い|live_leader_skill-card-00021-4-cmmn-0000-00|[attribute=cute]キュートタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|不知火フレア / sparks sunset|live_leader_skill-card-00021-5-uniq-0064-00|[attribute=happy]ハッピータイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|白銀ノエル / 風薫るおっとり騎士|live_leader_skill-card-00022-5-uniq-0018-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|角巻わため / 真夏のもふもふフロートタイム|live_leader_skill-card-00026-5-uniq-0065-00|[attribute=happy]ハッピータイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|ラプラス・ダークネス / 総帥専用！シークレットプール|live_leader_skill-card-00035-5-uniq-0082-00|[attribute=cute]キュートタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|鷹嶺ルイ / どこでも信頼！切れ者LIVE|live_leader_skill-card-00036-4-cmmn-0000-00|全員のスコアサポート効果50%|Support計算は今回対象外|
|博衣こより / 助手くんの心を鷲掴みライブ！|live_leader_skill-card-00037-5-uniq-0030-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|クレイジー・オリー / 常夏のCrazy Dive|live_leader_skill-card-03004-5-uniq-0073-00|[attribute=happy]ハッピータイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|パヴォリア・レイネ / おすまし孔雀と嗜む一杯|live_leader_skill-card-03006-5-uniq-0038-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|カエラ・コヴァルスキア / こころ強さは鍛冶場で研ぐ|live_leader_skill-card-03008-5-uniq-0040-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|森カリオペ / ビーチに刺さるReaper's Spike|live_leader_skill-card-04001-5-uniq-0071-00|[attribute=cute]キュートタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|一伊那尓栖 / ぽかぽかチャージなひととき|live_leader_skill-card-04003-5-uniq-0044-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|IRyS / nephilim sonority|live_leader_skill-card-04007-5-uniq-0047-00|Promiseが2人以上で全員の全パラメータが50%UP|Promise人数条件の参照レコード・所属データ不足|
|オーロ・クロニー / 刻を忘れるパフォーマンス|live_leader_skill-card-04010-4-cmmn-0000-00|Promiseが2人以上で全員の全パラメータが40%UP|Promise人数条件の参照レコード・所属データ不足|
|オーロ・クロニー / 典獄ささやくClock Tower|live_leader_skill-card-04010-5-uniq-0049-00|全員のスコアサポート効果60%|Support計算は今回対象外|
|シオリ・ノヴェラ / 知を潤すナイトプール|live_leader_skill-card-04013-5-uniq-0083-00|[attribute=cute]キュートタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|古石ビジュー / キラリと見せる無垢な素顔|live_leader_skill-card-04014-4-cmmn-0000-00|[attribute=happy]ハッピータイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|フワワ・アビスガード / ホッと安らぐフワフワライブ|live_leader_skill-card-04016-4-cmmn-0000-00|全員のスコアサポート効果50%|Support計算は今回対象外|
|フワワ・アビスガード / フワワのFlowing Summer|live_leader_skill-card-04016-5-uniq-0079-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|モココ・アビスガード / モココのBreezy Summer|live_leader_skill-card-04017-5-uniq-0080-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|
|一条莉々華 / ずっきゅんばっきゅんLIVE♡|live_leader_skill-card-06003-4-cmmn-0000-00|全員のスコアサポート効果50%|Support計算は今回対象外|
|儒烏風亭らでん / cultural performer|live_leader_skill-card-06004-4-cmmn-0000-00|[attribute=pure]ピュアタイプ[/attribute]2人以上で全員のスコアサポート効果25%|Support計算は今回対象外|

## 後続更新：Leader Support接続

同日の次工程でSupport26件/26行を接続した。上記表・未接続一覧はParameter接続工程時点の記録。現在のSupport対応は [leader-support-integration.md](leader-support-integration.md) を参照。複合16件のParameter値は維持している。
