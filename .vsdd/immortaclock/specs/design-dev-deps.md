---
id: design:dev-deps
title: 開発時依存 (配布物には非搭載)
coherence:
  depends_on:
    - design:single-file
    - design:i18n
---

# design:dev-deps — 開発時のみの依存

配布物 `index.html` は外部依存ゼロ(design:single-file / INV-SF-1)だが、
**開発・テスト時には依存がある**。これを正直に列挙し、配布物には含まれないことを明示する。
`DEV_DEPS` 配列が真実源。

## 型 (Type)

```ts
type DevDep = {
  tool: string   // ツール名
  use: Loc       // 用途
  // shipped は常に false (配布物 index.html には非搭載) なので型に持たず UI で固定表示
}
```

## 要件 (REQ)

- REQ-DEV-1: THE SYSTEM SHALL 開発時依存を列挙すること。最低限: `node:test`/`node:assert`(Node標準), 自作 `ceg.mjs`(CEG検証), 自作 fake DOM(jsdom非依存), Node.js ランタイム。
- REQ-DEV-2: THE SYSTEM SHALL これらが配布物 `index.html` に**非搭載**(配布物=いいえ)であることを表で明示すること。
- REQ-DEV-3: THE SYSTEM SHALL 外部 npm パッケージ(jsdom 等)に依存しないこと(テスト基盤も依存最小の思想を踏襲)。
- REQ-DEV-4: 文言(use)は `{ja,en}` の二言語を持つこと (design:i18n)。

## 検証性質 (PROP)

- PROP-DEV-1: `DEV_DEPS` に `node:test` と `ceg.mjs` が含まれる。
- PROP-DEV-2: 全 `DevDep` が `use`(ja/en) を持つ。
