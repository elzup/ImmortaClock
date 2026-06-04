---
id: spec:diagnosis-ui
title: 自己診断 UI (Dependency & Longevity Panel)
coherence:
  depends_on:
    - design:layers
    - design:i18n
    - design:used-apis
    - design:dev-deps
    - design:feature-longevity
    - design:hosting-redundancy
    - spec:longevity
    - spec:clock
---

# spec:diagnosis-ui — 依存リスト + 寿命の自己診断表示

時計の下に「自分が何に依存し、それぞれあと何年持つか」を表で描画する。
アプリ自身が自分の脆弱性を語る = ImmortaClock の中核。**入力フォームは持たない**(ステートレス)。

表構成:
1. **依存スタックと寿命診断**(全レイヤを1表に統合, 依存中(脆い→堅牢)→脱却→該当なし): 列: レイヤ / 状態(依存中/脱却/該当なし) / 何が壊すか / あと何年 / 推定根拠。`status!=='active'` の行は反実仮想年数 + 回避手段/非該当理由をサブ注記で示す。
2. **使用APIレガシー化リスク** (design:used-apis): 列: API / 導入時期 / 普及 / リスク / degrade。
3. **開発時依存** (design:dev-deps): 配布物に非搭載を明示。列: ツール / 用途 / 配布物。
4. **機能別の寿命・必須度** (design:feature-longevity): 列: 機能 / 必須度(核/付加/開発時) / 朽ちても時計は動くか / spec依存数。
5. **配布の冗長化** (design:hosting-redundancy): 列: 配布先 / 種別 / 運営 / コスト / 状態(稼働|予定|候補)。

## 要件 (EARS)

- REQ-UI-1: THE SYSTEM SHALL **全レイヤを1つの表に統合**して描画すること。順序は 依存中(`active`, 脆い→堅牢)→ `escaped` → `na`。列: レイヤ名 / 状態(依存中/脱却/該当なし) / 何が壊すか / あと何年 / 推定根拠(`計算可能`|`推定`+信頼度)。根拠列に「不使用」を出さない (Task2: 状態と推定根拠は別列)。
- REQ-UI-2: THE SYSTEM SHALL `active` 行の残存年数を `<10年`(危険) / `<50年`(注意) / それ以上(安定) で視覚的に区別すること(CSS のみ)。`status!=='active'` 行は反実仮想として弱表示(muted)すること。
- REQ-UI-3: THE SYSTEM SHALL 「描画が続く実効寿命」(律速レイヤ名つき)を時計直下に強調表示し、「正確な地域時刻の寿命」を副次表示すること。
- REQ-UI-4: THE SYSTEM SHALL 言語トグル(ja/en)を1つ提供し、押下で全表・全文言を即時再描画すること(design:i18n)。入力フォーム・永続状態は作らない。
- REQ-UI-5: THE SYSTEM SHALL 描画を `textContent`/`createElement` のみで行うこと(`innerHTML` への文字列混入禁止)。
- REQ-UI-6: THE SYSTEM SHALL フォントを OS 標準(generic family のみ)に依存すること。CSS の新機能(`clamp()` 等)を使う場合は前置の固定値フォールバックを置くこと(degrade)。
- REQ-UI-7: THE SYSTEM SHALL 統合表の `status!=='active'` 行に `脱却`/`該当なし` の状態バッジを付け、「もし依存／該当したら約N年」の反実仮想年数と、回避手段/非該当の理由(サブ注記)を示すこと。
- REQ-UI-8(Task4): THE SYSTEM SHALL 使用APIのレガシー化リスク表(表3)を描画すること。各行は 導入時期 / 普及 / リスク(低中高) / degrade有無 を持つ。
- REQ-UI-9(Task5): THE SYSTEM SHALL 開発時のみの依存(表4)を描画し、いずれも配布物 `index.html` に**非搭載**である旨を明示すること。
- REQ-UI-10: THE SYSTEM SHALL 機能別の寿命・必須度(表5, design:feature-longevity)を描画し、核(時計)/付加/開発時 の区別と「朽ちても時計は動くか」を示すこと。
- REQ-UI-11: THE SYSTEM SHALL 配布の冗長化(表6, design:hosting-redundancy)を描画し、各配布先の 種別 / 運営 / コスト / 状態 を示すこと。

## 検証性質 (PROP)

- PROP-UI-1: 統合表の行数が全レイヤ件数と一致する。他の各表もそれぞれの件数と行数が一致する。
- PROP-UI-2: 危険判定(<10年)の `active` レイヤには危険クラスが付与される。
- PROP-UI-3: 言語トグルで heading/footer の文言が ja↔en で変化する。
- PROP-UI-4: 統合表の `status!=='active'` 行に状態バッジ(`脱却`/`該当なし`)が付与される。
