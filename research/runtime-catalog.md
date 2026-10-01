# Source → 完全Canonical → Runtime Catalog

## 原本の保存状況

完全Canonicalの直接入力は `research/holodoridb-all-card-survey.json`（4,040,633 bytes）。ローカルGitで追跡されており、追加commitは `d568abf`。これは上流の全JSONを未加工で保存したアーカイブではなく、JOIN到達行のfields/wrapperと調査メタデータを保持したスナップショットである。`build_canonical_cards.py --check`で、これだけから既存の完全Canonicalを再生成できることを確認する。

- 取得元：`https://github.com/HolodoriDB/holodori-db-jpn-diff`
- 固定commit：`e43f062c32ff4e04567235efcd58448cd6b10f35`
- 調査取得日時：`2026-09-29T10:47:09Z`
- 調査JSON SHA-256：`dcce8ef7057e5053d9ebea7a4a93c000785a28cd6451f31bdceb68222e69bb2a`
- 取得スクリプト `research/holodoridb_all_card_survey.py` もGit追跡済み。今回は上流の再取得、原本の上書き・加工・新規公開、git add/commit/pushを行わない。

`research/canonical-cards.json`（32,055,758 bytes）は完全Canonicalの正本。SHA-256は `306a0d43a4785983ddb200e0ace01d0f9d84a887d3ee6cab5fa44935dd9f8ef1`。全13,180レベル行参照、全P/A/SP、原行・JOIN・出典・未解決事項を保持し、今回変更しない。既存Canonical schemaも変更しない。

## Runtimeの生成

```sh
python3 -B research/build_runtime_catalog.py
python3 -B research/build_runtime_catalog.py --check
python3 -B tests/runtime-catalog.test.py
python3 -B tests/verify.py
```

生成処理の入力は完全Canonicalと、runtime member ID対応に使用する既存 `members.js` のみ。出力は `data/runtime-cards.json`。日時や乱数を使わず、UTF-8のcompact JSONとして再現可能に生成する。`--check`はファイルを書かず、再生成バイトと比較する。手作業でカード値を編集しない。

現Runtimeは185カード、1,579,142 bytes。完全Canonicalより95.0738%小さい。ブラウザーはRuntimeだけを取得し、完全Canonical・原本・成長曲線全量をfetchしない。

## Runtime v1の構造

- `format`: `holodori-runtime-catalog-v1`
- `dataset`: 完全Canonicalのパス・SHA-256・schema version、元データのrepository/commit/取得日時・inputArtifact hash、members.js hash、未解決事項。
- `dataset.version`: このフィールドを追加する前のCatalog全体のcompact JSON SHA-256。Canonicalだけでなく、projection・member mappingの変更も識別する。
- `cards[]`: `id`（外部カードID）、`name`、`member`、`classification`、`skills`、`progression`、`source`。
- `source`: 固定ハッシュの完全Canonical内を指すJSON Pointer。カード、スキルレベル、効果、条件、成長スナップショットごとに追跡可能。巨大なsourceRecords/joinsや各factのtable/sourceId反復を配信しない。
- `member.mapping`: 日本語名が既存マスターに一意に完全一致する場合のみ `candidate` と対応IDを付ける。曖昧・欠落は `unresolved`。ブラウザーでも対応IDと名前の一致を検査する。
- `classification`: raw enumと、Canonicalに既に存在するsemanticCandidateを`mapping`として保持。候補のstatusは保持する。繰り返しの長文`mapping.basis`は配信せず、`source` pointerから完全Canonicalの根拠を追跡できる。
- スキル共通：独立した `levels[]`、`level`、`source`、タグを含む原文 `description`、ゲーム上の原値を型のまま保つ `raw`。ID・group参照等は意味を再解釈せず、Canonical pointerに委ねる。
- Passive：`effect`、`target.selectors`、`condition`、`calculationStatus: deferred`。
- Active：`baseEffect`、`conditionalOverrides[]`（condition/replacementEffect）、`qualitativeProbability`、`calculationStatus: base-only`。周期・時間・確率係数はrawに保持。定性的確率は原文から得た候補で、確率係数を数値確率に変換しない。
- Special：独立した `effects[]`（effect/condition）、レベル行rawの持続時間、`durationScope: unresolved-per-effect`、`calculationStatus: display-only`。
- condition：未観測は `state: unobserved / evaluationStatus: unresolved`。観測ありは `observed / not-evaluated`でraw clauses・原文・resolutionClass・evaluationModeを保持。明示的nullや明示的オブジェクトも別stateで保持し、noneを合成しない。

## 成長データ

`progression.trainingStages[]`の`stage`と`levelCap`はCanonicalのfactそのもの。レア度から上限を推測しない。

`statSnapshots[]`は各実在の特訓上限Lvのみ。185カード合計925行。実行時のLv1参照が存在しないことを確認し、Lv1の185行をRuntimeから除外した。Lv1を含む除外12,255行参照は完全Canonicalに残す。`parameterInputs`はCanonicalの基礎パラメータ係数を型のまま保持する。

これは最終ステータスの計算値ではなく、原本の`parameterBaseValue`・係数等の入力値。`statStatus: raw-inputs-only-formula-unresolved`として扱い、端数処理や補正の計算を追加しない。

## Bloom導出・カード表示

`progression.bloomSteps[]`へCanonicalの段階・effectType・value・source pointerを抽出する。共通`canonicalBloomLevels()`がLv1を起点として、選択Bloom以下のA/SP/Pレベル変更行のvalueを到達Lvとして適用する。段階位置は固定表やレア度から推測しない。valueを加算量でなく到達Lvとする点とLv1の初期状態は、今回提示されたゲーム仕様に基づく。Canonicalの研究記述は書き換えない。

全185枚でBloom 1→A2、3→SP2、4→P2。Bloom 2および5のparameter/Connect行もRuntimeに残すが、この処理では計算しない。★3/4/5ともBloom 5ではP/A/SPが変化しない。

A/Bの呼び出しUIはBloom選択に統一。通常表示はカード名、メンバー・★・タイプ・Bloom、SP→P→Aの原文説明（装飾タグのみ除去）。研究注意書き・source ID/URL/SHAは表示しない。Active基本効果のみという制限は画面共通の「データについて」に表示する。A面枠下の詳細は復活させない。

`card-catalog.html`は同じRuntimeとadapterを使用する閲覧専用画面。カード名・メンバー検索とレア度・タイプのAND絞り込み、カードごとのBloom切替ができる。閲覧状態はメモリーのみで、localStorageや既存メンバーLibraryへ書き込まない。

Runtimeから除いたのは属性・レア度の反復する検証説明`mapping.basis`のみ。原enum、candidate status、source pointerは保持する。datasetの未解決事項、全スキルLvのraw・条件・置換・複数効果・説明は保持する。adapterが作る検証注意書きも内部に残るが通常表示から外す。元のbasisとraw/source facts・provenance・unresolved・conversion evidence・source referencesは完全Canonicalにすべて残す。

## A面/B面・保存

A面/B面の選択UIはRuntimeを読む。新規選択はカードID＋Bloom段階を基準とする。A面枠下の詳細表示は追加しない。計算へ渡すのはActive基本効果だけで、P/SPや条件付き置換、Connect/boardは実行しない。

A面のメモリー上の`slot.canonicalExpansion`には選択したRuntimeレベルの小さな構造を保持する。localStorageには手入力値とは別に、`canonicalSelection: {version:2,cardId,bloom,training,canonicalSha256}`のみを保存し、展開データをコピーしない。

旧`canonicalExpansion`保存は、IDと選択レベル・元commitだけを抽出して小さな参照へ移行し、カタログから非同期で内部情報を復元する。手編集済みActive値は上書きしない。旧データにP/SPレベルがなければ推測せず未解決とする。データセット不一致や取得失敗でも入力値・参照は保持し、内部状態に復元未解決を記録する。

復元待ち中に枠リセット・Library呼び出し・メンバー変更が起きた場合、古い参照に対する復元結果を捨てる。リセットでCanonical参照が復活しない。B面の新規IDは`canonical:外部ID:bloomN`で、保存されたBloomからRuntimeを再展開する。旧`canonical:外部ID:lvA:pP:sSP`は独立Lvのまま保持し、Bloomへ推測変換しない。旧B面のActive-only IDはActiveだけを復元し、P/SP Lv1を補わない。

A面旧version 1の個別Lvも、到達不能な組合せを含め保持する。旧保存のピッカーは「未指定（旧保存のLvを保持）」から始まり、利用者がBloomを明示選択するまで変換しない。新旧どちらも展開構造を保存しない。既知の旧Runtime version `a762a8bf08ea38ff73aba1387e681b9fe0c0fc3f151f2e792fce2d7ed7f514d4`は完全CanonicalのSHA一致を条件に移行を許可する。復元後はCanonical SHAも保存し、同じ正本からのRuntime再生成で復元が途切れないようにする。未知のdataset不一致は自動移行しない。

Library・保存済み編成には書き込まない。明示的な手入力保存操作は従来どおり。

## 検証

`runtime-catalog.test.py`は保護対象4ファイルのSHA-256、185 IDの1:1対応、P/A/SP各370レベル、142置換、544個のSP効果、raw値・型・条件の保持、成長スナップショット、除外した中間Lvの原本保持、JSON Pointerの解決、再生成一致を検証する。

`verify.py`は既存回帰と全185カード/54メンバー/370 Activeの完全Canonicalとの倍率・時間一致を検証する。`tests/browser.html`は専用プロファイルで検索・呼び出し・Bloom 0〜5・旧独立Lv・手入力・保存復元・旧raw移行・リセット競合・他枠/Library/編成保全・Runtimeだけのfetch、新カードライブラリの検索・複合絞り込み・共通Bloom表示・保存データ非干渉を確認する。

`canonical-bloom.test.js`は185枚×6段階の期待Lv、★3/4/5、source段階変更に追従する導出、条件等の保持、保存復元、旧データ非推測を検証する。

## 特訓上限Lvの基礎表示

`canonicalTrainingStats(card, training)`はtrainingStagesのstage一致行からlevelCapを取得し、statSnapshotsのlevel一致行を選ぶ。レア度別の上限表は使用しない。該当行がない場合はエラーにし、Lv1への代替をしない。

カード呼び出しUIと閲覧用カードライブラリに特訓選択を追加。上限Lvとその行の`parameterBaseValue`を「基礎パラメータ」として表示する。能力別の丸めや合計への換算は未確定のため、計算値を捏造しない。Bloom・board補正は適用せず、P/A/SP Lvとも独立する。

A面は小さな選択参照にtrainingを保存する。B面は特訓0以外のIDに`:trainingN`を付けて復元する。特訓未保存の新Bloom参照は初期表示の特訓0を使用する。既存の手入力値・メンバーLibraryの仮ステータス処理は変更しない。

## 表示整理とP/T/S研究（2026-10-01）

育成選択は削除せず、カードライブラリとA/B呼び出しで「特訓 [n] 開花 [n]」の同一行に統一する。基本情報はカード名・メンバー・★・タイプのみ。Lvは通常表示から外すが内部の上限Lv参照と保存形式は維持する。選択結果はP/T/S未計算（—）、TOTALにparameterBaseValueの暫定値、SP→P→Aの原文で表示する。共通説明でTOTALの暫定解釈・開花補正なしを明記する。

カードライブラリのレア度は★5→★4→★3のカテゴリボタン、初期★5。特訓・開花はこれまで通りカード別の閲覧状態を保持する。データセット変更はない。

P/T/S配分式は研究のみ。`pts-investigation.md`と書込みなしの`check_pts_hypotheses.py`に確定事実・強い仮説・未解決事項・必要な実測を記録する。ゲーム内整数値の再現は未確認であり、計算接続はしない。

## カード単体P/T/S計算の採用（2026-10-01）

先のP/T/S研究後、ユーザーからゲーム実測との照合に基づく仕様が提示されたため、共通adapterの`calculateCardParameters(card, training, bloom)`に実装した。こちらで新たなゲーム実測を行ったという意味ではない。過去の「未計算・TOTAL暫定表示」はこの追記で更新される。

特訓上限のCardLevel.parameterBaseValueを3つのpermilで分配し、各項をceilする。その整数基礎値へ、選択開花までのALL_PARAMETER_UP_PERMIL_UP行のvalue合計を加算倍率として適用し、再度各項をceilする。3項目の和をTOTALとする。★3開花5は50+100=150 permil、★4/5開花2以降は100 permilとなる。特訓倍率はない。整数の積を1000で割る方式により、1.1等の二進浮動小数点表現による余計なceilを避ける。

結果は`canonicalExpansion.cardParameters`に保持し、カードライブラリとA/B呼出・復元は同じ関数・表示を使用する。localStorageの保存形式は変えず、既存のID・特訓・開花から再計算する。旧保存で開花未指定の場合はスキルLvから推定せず、最終パラメータは未表示とする。

Runtime・完全Canonical・schema・原本は変更していない。既存raw trainingStatsも変更しない。ボード、メモリー、強化、Passive、衣装、リーダー等は加えず、Active計算への接続も変更しない。

`tests/card-parameters.test.js`で185枚×5特訓×6開花の5,550状態、既知数値例、2回のceilをまとめられない例、整数境界、係数不正、旧保存非推測を検証する。browserテストは開花変更時の値更新と、同じカード・特訓・開花におけるLibrary/A/Bの同値を確認する。
