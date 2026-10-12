# 統合シミュレーターの編成保存

統合シミュレーター専用の入力スナップショット。計算結果は保存せず、読み込み後に既存エンジンで再計算する。

## 操作

PCでは左側、狭幅では編成欄の上に保存パネルを配置する。名前を入力して新規保存し、一覧で選択して読み込む。上書き・削除には確認がある。未保存の入力変更がある状態で読み込む場合も確認する。複製は選択した保存済みスナップショットをコピーし、現在の入力を変更しない。

ページ再読み込みで保存一覧を復元する。自動読み込みは行わず、明示的な読み込み操作で復元する。Simulationの過去結果は破棄し、復元した入力で再実行する。

## 保存形式

localStorageキー: `holodori-unit-formations-v1`

```text
version: 1
formations[]:
  id / name / createdAt / updatedAt
  snapshot:
    version: 1
    slots[5]: cardId / training / bloom / short / totalAdjustments
    leaderId
    duration
    memoryPercent / enhancementPercent
    trials
    specialEnabled / specialStarts
```

`slots`の配列順が編成順。非表示の発動頻度UP (`short`) およびBoard・衣装の外部TOTAL入力も保持する。入力文字列、未設定、明示0を区別して保存する。SP開始時刻の手動設定とON/OFFも保持する。

現在の開発版にはA/B別編成・独立したP/A/SP選択は存在しない。スキルLvはカードと開花から既存Adapterが解決するため、復元時も同じ経路を使用する。安定版A/Bの保存キーとカードライブラリの所持・育成データにはアクセスしない。

## 責務と異常時

- `unit-formation-store.js`: バージョン検証、CRUD、独立したスナップショットの管理。
- `unit-formation-ui.js`: 一覧、確認、エラーメッセージ。
- `unit-simulator.js`: 入力取得、カード・Leader参照確認、復元・再計算。

破損・未対応バージョンの保存データを自動修復・上書きしない。読み込み対象のカード・Leaderが存在しない場合は入力変更前に停止する。localStorageアクセス・容量エラーは保存パネルに表示し、シミュレーターを停止しない。

## 検証

- `tests/unit-formation-store.test.js`: CRUD、コピー独立性、未設定/0、破損・容量エラー、他キー非干渉。
- `tests/unit-formation-browser.html`: Chrome 1100px / 360pxで操作、確認キャンセル、再読み込み、全入力復元、再計算・Simulation、欠落参照・破損、他保存データの不変性。
- `python3 -B tests/verify.py`: 既存回帰を含めPASS。
- `tests/browser.html`: 安定版A面を含むChrome回帰PASS。
- `tests/unit-simulator-browser.html`: `three candidates deferred` の既存期待値でFAIL。今回変更前のHEADのHTML/JS/CSSを別サーバーで実行しても同じ失敗を再現した。今回の保存機能と無関係な所属Passiveの期待値は変更していない。

JSON入出力・編成比較・探索は今回対象外。
