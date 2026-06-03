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
- INV-SF-4: THE SYSTEM SHALL ES5 構文のみ使用すること(`const`/`let`/arrow/template literal 等 ES2015+ を使わず、`var`/`function` で書く)。最新APIに依存する場合は機能検出して degrade する。
  - 根拠: ES5 を実行できるエンジン集合は ES2015 の**上位集合**であり、`{ES5可}` ⊇ `{ES2015可}`。アーティファクトの寿命=「自分を実行できる最後のエンジンが死ぬまで」なので **ES5版の寿命 ≥ ES2015版**(どの未来でも下回らない)。これは design:hosting-redundancy の「min→max」原理を**実行基盤レイヤに適用**したもの。可読性より寿命を優先する(本リポジトリの主題)。
- INV-SF-5: THE SYSTEM SHALL ステートレスであること。永続ストレージ(localStorage/Cookie/IndexedDB)への依存を持たない。ユーザー入力は揮発でよい。

## 検証性質 (PROP)

- PROP-SF-1: ファイルを grep して `src=`, `href=` (外部URL), `import `, `require(`, `fetch(` が存在しない。
- PROP-SF-2: `file://` で開いた DOM に時刻が描画される。
