# Leader Support接続（2026-10-09）

## 範囲・件数

既存の `leader-parameter-rules.json`（Leaderライブラリと旧監査からの派生物）を利用。Leader衣装は一つのsourceとして扱い、二重加算しない。

|Leader Support対象|カード数|効果行数|
|---|---:|---:|
|完全対応|26|26|
|限定対応|0|0|
|未対応|0|0|

内訳：条件なしSupport単独10件、属性人数条件付き複合16件。全件の対象は「全員」で、属性人数条件は適用対象の属性制限ではない。条件未成立はinactive、編成不足や未知属性はunresolvedとして加算を保留する。これは実行時入力不足であり、ライブラリの効果仕様自体の未対応とは区別する。
Supportのない105カードは本集計の対象外。Parameter側のPromise条件2件の保留は今回変更しない。共通衣装54件にSupportはなく自動付与もない。

## 表示と計算の分離

- `LeaderParameterEngine.resolveCondition` を共通利用し、`LeaderSupportEngine.resolve` がLeader Supportの条件・対象slot・率・出典・適用状態を返す。既存Parameter式には変更なし。
- `LeaderSupportEngine.atActivation` はActive候補event.start時点で有効なLeader/Passive/SP率を集める。SP判定は既存の `[start,end)`、未解決Passiveは既存resolverにより除外された率のみ利用する。
- 共通 `calculateSupportBoost` は小数値をそのまま返す。表示フィールド `displayAdditional` だけfloorする。基礎100・Leader60・Passive8・SP80なら `100+148`。基礎70・Leader60・Passive8なら内部47.6、表示47。
- 共通Timeline Viewへoptionalな開始時点Support情報を渡し、各枠のバー詳細へ「表示補正 基礎+追加」とsource別率を表示する。安定版A面はこの引数を渡さず表示を維持。
- 時間積分/Simulationは従来のSPとActive効果区間のintersection処理を維持し、Leaderの有効率を小数計算へ追加する。**開始時表示を保持したまま全区間の倍率を固定する変更はしない**。これは暫定時間積分モデルで、ゲーム内部の表示更新や最終得点式の確定を意味しない。
- SP OFFではSP/関連Passive Supportを従来どおり無効化。独立したLeader Supportは残る。Leaderなし＋SP OFFでは旧Timeline/固定seed結果と一致。
- Activeイベント時刻、乱数抽選回数・順序・確率、周期、SP Schedule、Unit Score値、Parameter効果を変更しない。Leader Supportの追加分だけ積算結果へ波及する。赤ボード10%は入力も計算も追加しない。

## 複合と未解決情報

複合16件のParameter効果は従来のEngineが計算し、Supportは別レイヤーで計算する。Parameter trace内のSupport対象外記録はParameter層の境界を表す履歴であり、Timeline側の未対応を意味しない。通常UIのLeader適用状態は両層を合成して表示する。
複数Passiveの重複・候補超過時の選択は推測せず既存の保留を維持。今回の全件対応はLeader Support26件の範囲であり、すべてのSupport供給源を解決した意味ではない。

## 検証

`tests/leader-support.test.js` を `tests/verify.py` へ追加。

- 観測JSONの数値21件をそのまま読み、表示追加補正21/21一致。
- 100+148、47.6の内部保持、SP開始前/開始/終了前/終了、対象外slot、SP OFF時のLeader維持。
- 実ライブラリ26件・26効果を全件検査。属性条件の成立/不成立、未知対象/条件の保留。
- 複合Parameter値不変、Leader変更でTimeline表示・小数積算更新、固定seed再現。
- `tests/verify.py` の既存回帰を含めPASS。
- ChromeのLeader選択/解除と実際のTimelineバー詳細、1100px/360px、既存統合版/安定版回帰を確認。

実測の根拠は [score-support-display-validation.md](score-support-display-validation.md) および同観測JSON。今回のfloorは表示モデルのみで、内部得点へのfloorや赤ボードの作用を確定するものではない。
