---
id: design:used-apis
title: 使用APIのレガシー化リスク評価
coherence:
  depends_on:
    - design:single-file
    - design:i18n
---

# design:used-apis — 実際に使う細かいAPIの陳腐化リスク

依存レイヤ(design:layers)とは別軸で、**実装が実際に呼ぶ具体的なAPI/機能**が
「いつかレガシー扱いになる仕様」を踏んでいないかを評価するデータ。`APIS` 配列が真実源。

## API型 (Type)

```ts
type Risk = 'low' | 'med' | 'high'
type ApiEval = {
  api: string        // API/機能名 (言語非依存トークン)
  since: string      // 導入時期 (例 'ES1 / 1997', '2020')
  adoption: Loc      // 普及度
  risk: Risk         // レガシー化リスク (低/中/高)
  degrade: Loc       // 不対応時の劣化動作 (フォールバックの有無)
}
```

## 要件 (REQ)

- REQ-API-1: THE SYSTEM SHALL 実装が使う主要 API/機能(JS と CSS の双方)を列挙すること。最低限: `Date`/`setInterval`, `navigator.language`, `createElement`/`textContent`, ES5構文(var/function), classic `<script>`(非module), `system-ui` フォント, `clamp()`, `var()`, `tabular-nums`。
- REQ-API-2: THE SYSTEM SHALL 各 API に `since` / `adoption` / `risk`(low|med|high) / `degrade` を持たせること。
- REQ-API-3: THE SYSTEM SHALL degrade 不能(=コア依存)の API は「代替不要」と明示し、CSS新機能(clamp/var/tabular-nums/system-ui)は不対応でも可読/軽微劣化に留まることを `degrade` に記すこと(design:single-file の degrade 方針)。
- REQ-API-4: THE SYSTEM SHALL ES5 を baseline とした理由(実行可能エンジン集合が上位集合=寿命が ≥。INV-SF-4 / redundancy 原理)と、module でなく classic `<script>` を選ぶ理由(module は `file://` が CORS で不可。INV-SF-2)を `degrade` 欄で説明すること。
- REQ-API-5: 文言(adoption/degrade)は `{ja,en}` の二言語を持つこと (design:i18n)。

## 検証性質 (PROP)

- PROP-API-1: 全 `ApiEval` の `risk` が `low|med|high` のいずれか。
- PROP-API-2: 全 `ApiEval` が `since`(非空) と `adoption`/`degrade`(ja/en) を持つ。
