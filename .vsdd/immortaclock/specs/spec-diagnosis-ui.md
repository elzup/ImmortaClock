---
id: spec:diagnosis-ui
title: 自己診断 UI (Dependency & Longevity Panel)
coherence:
  depends_on:
    - design:layers
    - design:i18n
    - spec:longevity
    - spec:clock
---

# spec:diagnosis-ui — 依存リスト + 寿命の自己診断表示

時計の下に「自分が何に依存し、それぞれあと何年持つか」を表として描画する。
アプリ自身が自分の脆弱性を語る = ImmortaClock の中核。**入力フォームは持たない**(ステートレス)。

## 要件 (EARS)

- REQ-UI-1: THE SYSTEM SHALL 全依存レイヤを order 昇順(脆い→堅牢)で表に描画すること。列: レイヤ名 / 何が壊すか / あと何年 / 根拠。
- REQ-UI-2: THE SYSTEM SHALL 残存年数を `<10年`(危険) / `<50年`(注意) / それ以上(安定) で視覚的に区別すること(CSS のみ)。`appliesNow=false` の行は別途「不使用」マークで弱表示すること。
- REQ-UI-3: THE SYSTEM SHALL 「描画が続く実効寿命」(律速レイヤ名つき)を時計直下に強調表示し、「正確な地域時刻の寿命」を副次表示すること。
- REQ-UI-4: THE SYSTEM SHALL 言語トグル(ja/en)を1つ提供し、押下で全文言を即時再描画すること(design:i18n)。入力フォーム・永続状態は作らない。
- REQ-UI-5: THE SYSTEM SHALL 描画を `textContent`/`createElement` のみで行うこと(`innerHTML` への文字列混入禁止)。
- REQ-UI-6: THE SYSTEM SHALL フォントを OS 標準(generic family のみ)に依存すること。CSS の新機能(`clamp()` 等)を使う場合は前置の固定値フォールバックを置くこと(degrade)。

## 検証性質 (PROP)

- PROP-UI-1: レイヤ件数と描画行数が一致する。
- PROP-UI-2: 危険判定(<10年)のレイヤには危険クラスが付与される。
- PROP-UI-3: 言語トグルで heading/footer の文言が ja↔en で変化する。
- PROP-UI-4: `appliesNow=false` の行には「不使用」マーク用クラスが付与される。
