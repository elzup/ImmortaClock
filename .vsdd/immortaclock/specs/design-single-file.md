---
id: design:single-file
title: 単一HTMLファイル制約 (Longevity Substrate)
coherence:
  depends_on: []
---

# design:single-file — 成果物形態の制約

長命性を最大化するため、成果物は **単一の `index.html`** に HTML/CSS/JS を全て内包する。
この制約が、依存スタックの脆い上位レイヤ(ホスティング/ビルド/CDN/FW)をゼロにする。

## 不変条件 (INV)

- INV-SF-1: THE SYSTEM SHALL 単一の `.html` ファイルとして配布可能であること。外部 `<script src>` / `<link href>` / `import` / fetch を持たない。
- INV-SF-2: THE SYSTEM SHALL `file://` で開いても全機能が動作すること(ネットワーク不要)。
- INV-SF-3: THE SYSTEM SHALL ビルドステップ無しで動作すること。トランスパイル/バンドル/パッケージ依存を持たない。
- INV-SF-4: THE SYSTEM SHALL ES2015(ES6)以下の構文のみ使用すること。最新APIに依存する場合は機能検出して degrade する。
- INV-SF-5: THE SYSTEM SHALL ステートレスであること。永続ストレージ(localStorage/Cookie/IndexedDB)への依存を持たない。ユーザー入力は揮発でよい。

## 検証性質 (PROP)

- PROP-SF-1: ファイルを grep して `src=`, `href=` (外部URL), `import `, `require(`, `fetch(` が存在しない。
- PROP-SF-2: `file://` で開いた DOM に時刻が描画される。
