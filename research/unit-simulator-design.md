# 次世代統合シミュレーター 初期実装

`unit-simulator.html` は安定版A面からリンクする別ページ。既存A面・Library・所持カードの保存とは独立し、5枠の選択・特訓・開花・発動頻度UP・曲時間はページ内だけで保持する。再読み込みで初期化する。現段階では編成保存機能やA面保存からの自動移行は行わない。

## データの流れ

Runtime Catalog → 共通adapter → 選択カード・育成状態

- `unit-parameter-engine.js`: `calculateCardParameters()`を再利用し、基礎・開花増分・カード小計をP/T/S/TOTALごとに返す。5人の各内訳を合計する。最終値と未接続補正はnull。既存`parameter-rules.js`は明示的なbaseStatsや補正率、Card v2の効果を前提にしており、RuntimeのPassive等を自動で読み替えない。Memoryや強化ボーナスの既定値をこの新ページへ持ち込まない。
- `unit-score-engine.js`: Parameter状態を受け取り、未確定の記号X・value:nullを返す境界。パラメーター合計からスコアへの換算はしない。
- `active-timeline-engine.js`: A面のadjustedInterval / events / calcMax / maxSegmentsをアルゴリズム変更なしで移設。A面には同名の呼び出しラッパーを残し、新ページは同じエンジンを使用する。既存の1メンバー当たり1000イベントの上限もそのまま維持。
- `activation-probability-rules.js`・`active-random-simulation.js`: 既存の暫定確率と乱数・区間積分・統計をそのまま共用。Timelineへの入力はActive基本効果のみ。Support補正込みのA面表示値と比較する場合は、入力範囲の違いに注意する。
- `unit-simulator-engine.js`: 上記を接続する。DOMやlocalStorageへ依存せず、編成・Parameter・Unit Score・候補・最大補正区間を返す。simulateはX係数の試行値と統計を返す。
- `unit-simulator.js`: 検索・選択・表示のみ。P/A/SPのLvは開花から共通adapterが導出し、選択データや条件付きActive・未解決情報はexpansion内に保持する。

Canonical本体・schema・カードRuntimeの構造変更はない。ブラウザーは既存Runtimeだけを読み込み、研究用Canonicalをfetchしない。

## 初期版の対象外

未対応Passive・Memory・強化ボーナス・Leader・Board・衣装などの編成補正、Special、条件付きActive、Support、ノーツ密度、Xの数値算出、絶対スコアは未接続。効果原文やLvの表示を計算適用と混同しない。未接続項目をゼロと確定しない。

## 検証

`python3 -B tests/verify.py` で既存A面からの移設関数の一致、旧/新Timelineの候補・区間・評価値、全185枚×開花6段階、内訳合算・未接続状態・X境界・seed再現を検証する。

Chromeで `tests/unit-simulator-browser.html` を実行し、5枠・185枚・検索・特訓/開花/頻度・A面との計算一致・乱数・保存非干渉・再読込・1100px/360pxを検証する。既存 `tests/browser.html` と `tests/navigation-browser.html` も実行する。

## 静的Passive接続（追加）

`unit-parameter-engine.js`から既存`parameter-rules.js`の`calculatePassiveEffects()`を呼ぶ。対象は明示SELF、単一の観測済みDECK_CARD_ATTRIBUTE人数条件、既知のP/T/S/全パラUP permil効果に限る。率はpermil/10で既存のpercent入力へ変換する。条件評価はRuntimeとカード双方のraw属性enumを直接比較し、候補表示名から推定しない。

現Runtimeで該当するのは自己全パラ補正58レベル行（29カード）。自己P/T/S単項の経路は合成fixtureで検証し、実測済みカードが存在するとは主張しない。条件未観測をnoneへ変換せず、期生条件・順位選択・他者対象・Support等はunsupportedとする。条件が明確に不成立のinactiveとは区別する。

参照値は開花適用後のカード値（Board等を除く）。既存処理の「率をparameterごとに合算→各項ceil」を再利用する。効果ごとのceilを足す方式は導入しない。今回は自己単一効果のみを橋渡しするため、他者からの重複加算は新たに接続しない。既存テストの重複率集約規則も維持する。

結果のpassiveは適用できた分のみ。未対応分はunresolved/traceおよびvalue:nullの補正項目に残す。subtotalは開花後値＋適用済みPassiveで、finalは引き続きnull。traceにはsourceカード/枠/レベル/原文/pointer、targetカード/枠、正規化した効果・条件、参照値、率、丸め前値、ceil後加算値、状態・未対応理由を保持する。UIのdetailsを取り除いても計算層のtraceは利用可能。

`tests/unit-passive.test.js`は既存CASE Cのノエル自己16%分を分離し、参照値2883/2210/2299から462/354/368を検証する。元CASE C全編成の順位対象Passiveは今回未接続のため、全体4532と一致するとは扱わない。Timeline区間と固定seedのSimulation結果はPassive接続の有無で一致する。

## Memory接続（追加）

新ページの編成共通入力から `{kind:'manual-rate', percent:'6.4'}` のような明示的な最終率を取得する。既存の`calculateUnitParameterBreakdown`と同じ共通率の入力モデルを採用する。Memory名・レベルから率を算出するカタログや新しい換算式は追加しない。入力はページ内で保持し、カード・育成・曲時間の変更でも残る。再読み込みで未設定へ戻り、既存localStorageへは書かない。

`UnitSimulatorEngine.build`の第4引数で入力を渡し、`UnitParameterEngine.resolveMemory`がpercentを小数rateへ変換する。入力形式と原入力をsourceとして保持する。

- 空欄：unset、値null。計算済み小計への加算なし。
- 明示0%：applied、各値0。
- 対応する有限・非負の率：applied。各カードのMemoryを既存`calculateMemory`で計算。
- 未対応形式・不正値：unsupported、理由と原入力を保持。既存関数の不正入力→0という既定処理に流さない。

Memoryの計算基数は開花適用後・Passive適用前のP/T/S。Passive/Memory/Board等を含む小計へ順次乗算しない。`ceil(reference * rate)`を各カード・各parameterで適用し、丸め後の値を編成合計する。表示はBase→Bloom→Passive→Memory→現在計算値とし、Enhancement Bonusはまだ接続しない。

Memory traceは入力source、状態・理由、target枠/カード、各parameterの参照値・小数率・丸め前値・ceil後加算値を返す。未設定/未対応の加算値はnull。UIの折りたたみParameter traceで確認できる。現在計算値は適用済みPassive・Memoryのみ加算し、final:nullとUnit Score=Xを維持する。

`tests/unit-memory.test.js`で既存CASE CのMemory 466/518/475/517/475、合計2451、各項ceil、0/未設定/未対応の区別、Passiveとの基数分離、入力非破壊、合算、Enhancement未接続、Timeline/seed Simulation非干渉を確認する。ブラウザーテストはMemory入力・形式切替・値保持・再読込・保存非干渉・1100px/360pxも検証する。

## Enhancement Bonus接続（追加）

既存`calculateEnhancementBonus(base, rate)`を再利用。既存`calculateUnitParameterBreakdown`の基数は各メンバーの`開花後カードTOTAL + Board + Passive + 衣装`で、Memoryは含まない。メンバーごとの合計基数に率を掛けて1回ceilし、編成ではその整数結果を足す。P/T/Sへ分配する式ではないので、enhancementBonusのP/T/Sはnull、totalだけを計算する。現在計算値のP/T/Sは従来どおり、TOTALだけに強化ボーナスを追加する。

UIは編成共通の最終率を%で入力する。既存の既定率0.0243（2.43%）は入力例に留め、空欄へ自動適用しない。Memoryと同じ検証方式でunset/明示0/unsupportedを区別する。未設定・未対応の値はnullで、計算済み小計へ加算しない。入力はページ内のみで保持し、再読み込みで初期化する。

新ページではBoard・衣装・未対応Passiveを接続しないため、強化ボーナスも「計算済み基数のみ」の部分計算。`components`の未接続項目はnull、`excluded`に明示し、0が確定したかのようには扱わない。現在計算値を最終値と呼ばない。traceにはsource、対象カード/枠、parameter:total、率、基数、構成要素、除外項目、Memory除外、丸め前値、ceil後加算値、状態を保持する。

CASE Cは既存`tests/parameter-rules.test.js`が生成するfixtureと期待値を`tests/case-c-enhancement.test.js`で直接参照。完全な基数を渡した共通レイヤーは各メンバー248/300/301/297/251、合計1397と一致する。これはBoard等を省いた新ページの部分計算が1397になるという意味ではない。Boardや他の未対応効果のUI接続は追加しない。

`tests/unit-enhancement.test.js`で未設定/0/未対応、合算、Memory/PassiveとMemory traceの不変、基数trace、P/T/Sへ配分しないこと、Timeline/固定seed Simulation不変を検証する。ブラウザーは率入力・内訳・trace・再読込・保存非干渉・1100px/360pxを検証する。

## Board・衣装の外部TOTAL接続（追加）

各枠の`totalAdjustments.board/costume`に`{kind:'external-total',value:'2937'}`形式で入力を保持する。空欄はunset、0はapplied/0、0以上の安全な整数はapplied、それ以外はinvalid。入力形式自体が未知ならunsupported。数値の取得元はユーザーの明示入力であり、自動計算やP/T/Sへの配分は行わない。

Engineは各補正のsource/status/total/reasonを保持し、P/T/Sはnullとする。結果の`totalAdjustments`はBoard・衣装・Enhancement Bonusをまとめて参照できる。表示のTOTALには入力済みBoard・衣装と強化ボーナスを各1回だけ加算し、P/T/S・Passive・Memoryは変更しない。編成のBoard/衣装合計は設定済み分のみで、不足時はpartialとして個別状態も保持する。

Enhancementのcomponents.board/outfitへ正規化したTOTALを渡す。設定済み0も完全基数の構成要素。未設定/不正入力はnullのまま除外し、未対応Passiveが残る場合も部分基数とする。完全基数は「強化ボーナス式の基数が揃った」の意味で、ユニットの未接続Leader等まで完成した意味ではない。Memoryは引き続き除外する。

traceには対象枠/カード、外部入力source、原入力、正規化値、入力状態、強化基数への採用有無、強化計算実行有無を記録する。Enhancement traceのcomponentsとbasisから全構成を確認可能。ページ再読み込みで外部入力も初期化し、既存保存へ書き込まない。

`tests/unit-total-adjustments.test.js`で状態区別、TOTAL分離、Board/衣装の基数・現在計算値への接続、完全/部分判定、Memory/Passive/Timeline/seed Simulation非干渉を検証。CASE C検証は既存fixtureのBoard/衣装を外部入力の正規化経路に通して同じメンバー値と1397へ一致することを確認する。新ページの未対応順位PassiveをCASE C再現のために追加接続することはしない。

## 所属人数条件：自己対象11カードの接続

`build_affiliation_catalog.py`は完全CanonicalのCard.characterId、CharacterGrouping.characterIds、日本語group名を参照し、runtime-affiliations.json（185カード/15所属）を決定的に生成する。完全CanonicalとカードRuntimeは不変。unitページだけが補助データを取得し、Canonical SHA一致を確認する。欠落・取得失敗・SHA不一致は対応条件のunresolvedとして保持し、属性条件の計算は継続できる。

`PartyConditionResolver.resolvePartyCondition`はaffiliation_count、group ID、必要数、5枠のcardId/slotを受け取り、所属名・actualCount・countedMembers・unknownMembers・satisfied/unsatisfied/unresolvedを返す。メンバー表示文字列を比較しない。原文の「所属2人以上」「自身への効果」を分離し、自己除外はしない。既存人数条件と同じ枠単位カウントで、同一カード/人物を重複選択した場合も枠ごとに数える（重複編成のゲーム上の可否を新規実装しない）。不足情報や未選択枠があればfalseへ変換しない。

Parameter EngineのSELF gateのみへ所属人数条件を追加。成立/不成立が判定できるときは既存calculatePassiveEffectsのaffiliation判定・自己対象・ceilに渡し、unknown時は効果を計算へ渡さずunresolvedを保持する。traceは条件ID/名前/必要人数/実人数/計上メンバー/結果と既存の対象・基数・率・丸め・加算を含む。不成立時も加算0と参照値を残す。他者対象gateは変更しない。

監査対応済みは29/58→40/80、未対応116/232→105/210。所属対象15カード、属性対象35カード、条件未観測55カードは未対応を維持。新規Passive増分は既存Enhancementの基数へ当然反映されるが、式は不変。Memory・Timeline・Simulationは新規Passive有無でも不変。既存29カードはMemory/Enhancementを含めて不変を比較検証する。

## 所属対象の限定条件対応

`PassiveTargetResolver.resolve`はCondition Resolver結果を受け取り、対象所属の候補集合・所属外メンバーと対象数を解決する。人数条件そのものは再実装しない。条件不成立なら対象0、条件成立かつ候補数が指定人数2と一致する場合だけ2人を確定する。超過時はtarget selection unresolvedで全効果を保留し、並べ替え・先頭2人選択はしない。source自身も所属候補に含める。条件IDと対象IDは別に保持する。

`calculatePassiveEffects`へ省略可能なTarget Resolver引数を追加。既存呼出のデフォルトは従来関数のまま。限定所属対象だけは新Resolverの確定slotを渡すため、既存baseTotalソートへ流さない。率合算・各対象parameterのceilは既存の共通計算を維持する。

source traceのcondition.countedMembersとtargetResolution.candidates/targets/excludedMembersを区別する。2人への適用時は各targetの参照値・source率とraw寄与、全source合算率・raw・ceil結果を表示する。ceil後の加算値はparameter全体の合算値であり、source別丸めを足したものではない。候補メンバーには保留source参照をunresolvedとして伝え、Enhancement基数の完全/部分判定へ反映する。Memory・Timeline・Simulationは変更しない。

将来のN人選択は候補集合確定後のTarget Resolver段階へ追加できる。現時点で順位ルールは導入しない。属性側への接続・条件未観測の解釈は未実装。


## 属性対象35カードの選択接続

Condition: PartyConditionResolver.resolveAttributeCondition → Target: PassiveTargetResolver.resolveAttribute → Selection: PassiveSelectionResolver.resolve → calculatePassiveEffectsの率合算/ceil、の順。属性判定は5枠と属性情報が揃わなければunresolved。不成立はinactiveとしてSelectionを呼ばない。

SelectionはcalculatePassiveEffectsが既に生成したbaseTotal/formationIndexを受け取り、既存rankPassiveCandidatesを再利用する。baseTotalの再計算や別定義は持たない。対象2/3人まで既存sliceと同じ選択。所属用ruleは拒否し、所属限定対応の経路は不変。

trace.targetResolution.selectionに候補のcardId/slot/baseTotal/formationIndex/rank、selected/excluded、ties、rule、tieBreakを格納する。rankはtie-break後の選択順。targetResolution.excludedMembersは属性不一致、selection.excludedは順位による除外で、両者を区別する。補正traceのsourceRawは個別sourceの丸め前値、addedは全sourceの率合算後の対象parameter補正量。

既存CASE Cの数値fixtureを読み、新EngineでPassive4532/Memory2451/Enhancement1397を検証する。CASE C先頭sourceは無条件なので、テストでは全5人が一致して成立する観測属性条件へ置き換える。無条件Runtimeの接続を実装したという意味ではない。Board・衣装はTOTAL外部入力、Memoryは従来基数、Enhancementは追加Passiveを従来式で反映する。

属性接続の検証結果: tests/verify.py、runtime-catalog.test.py、leader-catalog.test.py、監査--checkはPASS。Chrome headlessのunit-simulator-browser.html（1100px/360px、属性selection trace表示・所属保留を含む）とbrowser.htmlもPASS。Canonical・カードRuntime・保存形式は変更していない。


## 暫定Unit Scoreと共通Timeline UI

ユーザー指定の暫定定義としてParameter Engine.subtotal.totalをUnit Score値に使用する。ゲームの正式スコア式を確定したという意味ではない。補正は再計算せず、未解決・未設定情報も別状態として保持。Memory/Enhancementの編成共通%入力を再表示し、Parameter Engine経由で反映する。

active-timeline-view.jsは既存A面の描画を抽出した共通UI。統合区間・時間軸・各メンバーバー・クリック詳細を同じ実装で描画し、active-timeline-engine.jsは不変。Unit SimulatorのallSuccessScoreは従来allSuccessX×unitScore.value。Simulationは従来乱数結果をnormalizedに残し、各試行を同じ値で1回だけスケールして統計を集計する。A面の評価値・乱数シミュレーションは変更しない。


## SP Scheduleと時間区間Support（2026-10-08）

special-schedule-engine.jsは各slotの選択済みSP Lvからraw duration/独立effectsを保持する。初期start=(slot-0.5)*曲長/5はユーザー指定の仮配置。placeはslot順を維持し、後続duration合計を曲末に予約して開始位置をclampし、前SP終了より前へ移動させない。連鎖押出し時も持続時間は不変。全durationが曲長を超える場合は全SP配置unresolved（Active/確定Passiveだけの部分評価）とする。ドラッグ実装時も同じplaceへ開始時刻を渡す。

RuntimeのSP主Supportは370行ともcondition=unobserved/durationScope未確定の研究メタデータを持つ。今回のユーザー指定「SP主SupportをそのSP duration中へ適用」を実行ポリシーrequested-primary-SP-support-durationとして明示し、原データを書き換えない。primaryのScore Support型・単一raw効果値が妥当で追加条件clausesがない場合だけ適用する。他のSP効果、条件付き主効果は未接続。発動率UPをshortや抽選確率へ変換しない。

scheduled-support-engine.jsは既存PartyConditionResolverで観測済み属性/所属人数条件を評価し、resolveSupportTargetsで上限以下の全候補だけを確定する。条件未観測21カード/42行は保留。観測済み19カード/38行（属性9・所属10）は人数と対象次第で適用する。複数Passive sourceが同じtargetへ作用するときは既存A面と同じunresolved-stackingとして保留。support-rules.jsからこの判定だけresolveSupportStackingへ抽出した。Parameter Passiveの順位選択を使わない。

SP Supportはその時間帯に有効な各Activeへ、確定Passive Supportとともに既存calculateSupportBoost(baseBoost,spRate,passiveRate)で反映する。Active効果の加算分はbaseBoost*(spRate+passiveRate)/100、丸めを導入しない。イベントをSP/Active境界で分割して既存maxSegmentsへ渡し、同時Activeは従来の最大効果採用を維持。SPだけの区間は倍率1。allSuccessX/scoreはSupport込み、activeOnlyX/segmentsは従来Activeのみの比較用。Simulationは同じScheduleと固定Passive対象を利用し、Activeだけ抽選する。support:falseの比較用オプションは従来の区間積算をそのまま使う。

共通Timeline viewへoptional specialSchedule/segmentsを追加。SP背景は本人slotのtrack下層に置き、Activeバーは上層。表示チェックはCSSだけを切り替え、Schedule・モデル・抽選結果を変えない。開始数値入力はこのページだけの状態。traceはSP原文/レベル/raw condition/配置由来、SPとActiveの重複、各ActiveのSP率・Passive率・除外modifierを保持。通常UIは短い仮配置注記と折りたたみtraceのみ。A面の入力・計算にはSPを追加しない。

検証: 全370 SP Lvの持続/主Support、観測Passive Support38行の条件人数境界、非重複/連鎖/曲末、Support区間積分、未解決除外、10,000試行、固定seed、既存回帰・CASE C・データ整合性がPASS。Chromeのunit/browser/navigationテストも1100px/360pxでPASS。SP表示OFFはSchedule/数値/ActiveバーDOM不変を確認。


### SP使用スイッチ・全高背景帯

「SPを使用」は表示と計算の共通スイッチ。OFFはSchedule設定を保持したまま、Passive Support解決とSP区間評価をスキップし、従来maxSegmentsをTimeline/Simulationに直接使用する。ONへ戻すと同じ設定から復元。trace.enabled/statusで無効状態を明示し、表示切替時は既存Simulation結果を無効化する。

背景帯はTimeline全高の単一レイヤーに描画し、時間軸の横位置は共通Active trackのoffsetを使用。背景は紫alpha .36、Activeボタンは上層、目盛りはさらに上層。pointer-events:noneで操作を妨げない。Schedule配置・非重複ルール・Support式は不変。既存回帰、OFF時の従来固定seed完全一致、OFF/ONの手動配置保持、Chrome1100px/360pxの全6行貫通・帯位置・クリック確認はPASS。
