---
id: design:feature-longevity
title: 機能別の寿命・必須度 (Feature Criticality & Graceful Degradation)
coherence:
  depends_on:
    - design:single-file
    - spec:clock
---

# design:feature-longevity — 機能ごとの寿命評価

依存レイヤ(design:layers)や使用API(design:used-apis)とは別軸で、**このソフト自身の機能**を
「必須度」と「朽ちても時計は動くか(graceful degradation)」で評価する。`FEATURES` 配列が真実源。

## 核心: 最低限「時計」が動けばよい

機能には階層がある。時計表示(spec:clock)が**核(core)**で、これだけは最長命でなければならない。
多言語・自己診断UI・寿命エンジンは**付加(enhanced)**で、朽ちても時計は動き続ける(切り捨て可能)。
テスト/CEG は**開発時(dev)**で配布物には載らない(design:dev-deps)。

## 機能の脆さ = spec の推移的依存数 (CEG と一致)

VCSDD の CEG 上で、ある機能 spec の**推移的依存数が少ないほど基盤が少なく頑健**。
`spec:clock` は依存が `design:single-file` のみ(=最小)で最も生き残り、`spec:diagnosis-ui` は
全機能に依存する最も脆い部分。`ceg.mjs rank` / `ceg.mjs deps <id>` がこの数値を出す。

## 型 (Type)

```ts
type Tier = 'core' | 'enhanced' | 'dev'
type Feature = {
  specId: string  // 対応する CEG ノード id
  tier: Tier
  deps: number    // 推移的 spec 依存数 (ceg.mjs deps と一致させる = coherence)
  label: Loc
  survives: Loc   // この機能が朽ちても時計は動くか
}
```

## 要件 (REQ)

- REQ-FL-1: THE SYSTEM SHALL 時計表示(spec:clock)を `tier=core` とし、これだけは描画が続く限り維持されるべき最小機能と位置づけること。
- REQ-FL-2: THE SYSTEM SHALL 多言語(design:i18n)・寿命エンジン(spec:longevity)・自己診断UI(spec:diagnosis-ui)を `tier=enhanced` とし、各々が朽ちても時計表示は継続する(graceful degradation)ことを `survives` に明示すること。
- REQ-FL-3: THE SYSTEM SHALL テスト/CEG を `tier=dev` とし、配布物 `index.html` に非搭載であることを示すこと(design:dev-deps と整合)。
- REQ-FL-4: THE SYSTEM SHALL 各 `Feature.deps`(推移的 spec 依存数)を `ceg.mjs deps <specId>` の値と一致させること(アプリのデータと CEG の coherence)。
- REQ-FL-5: THE SYSTEM SHALL `core`(時計)の推移的依存数が、いずれの `enhanced` 機能の依存数**以下**であること(核は最も頑健)。
- REQ-FL-6: 文言(label/survives)は `{ja,en}` の二言語を持つこと (design:i18n)。

## 検証性質 (PROP)

- PROP-FL-1: 全 `Feature.tier ∈ {core, enhanced, dev}`。
- PROP-FL-2: `core` の `deps` <= 全 `enhanced` の `deps`。
- PROP-FL-3: 各 `Feature.deps` が `ceg.mjs deps <specId>` の出力と一致する。
