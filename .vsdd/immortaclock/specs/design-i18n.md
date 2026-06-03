---
id: design:i18n
title: 多言語対応 (ISO コア + ラベル翻訳)
coherence:
  depends_on:
    - design:single-file
---

# design:i18n — 多言語対応の方針

長命性を損なわない i18n。外部 i18n ライブラリ・翻訳API・ビルド時抽出に依存しない。

## 方針 (REQ)

- REQ-I18N-1: 時刻本体は `YYYY-MM-DD HH:MM:SS`(言語非依存の数値表現)とし、翻訳対象にしないこと。これが最も長命な選択。
- REQ-I18N-2: UI ラベルと依存レイヤの文言(label/killer/note)のみを翻訳対象とし、`{ja, en}` の辞書をファイル内に内蔵すること。
- REQ-I18N-3: 初期言語は `navigator.language`(ES以前から存在する安定API)で判定し、`ja` で始まれば日本語、それ以外は英語とすること。判定不能なら英語(フォールバック)。
- REQ-I18N-4: 言語トグル(ja/en)を1つ提供し、再描画で即時切替すること。状態は揮発(localStorage 等に依存しない)。
- REQ-I18N-5: 翻訳ヘルパ `t(loc)` は `{ja,en}` を受け現在言語の文字列を返し、欠落時は ja→en の順でフォールバックすること(silent な undefined 表示を禁止)。

## 検証性質 (PROP)

- PROP-I18N-1: 全レイヤの label/killer が ja/en 両方を持つ(欠落で FAIL)。
- PROP-I18N-2: `t({ja:'あ', en:'a'})` は言語に応じて 'あ' / 'a' を返す。
