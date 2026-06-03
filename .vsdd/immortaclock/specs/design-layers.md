---
id: design:layers
title: 依存レイヤ データモデル
coherence:
  depends_on:
    - design:single-file
    - design:i18n
    - design:hosting-redundancy
---

# design:layers — 依存レイヤの寿命スタック モデル

時計が依存する全レイヤを、短命→長命の順で構造化したデータ。
この配列が「依存リスト + あと何年」表示機能の唯一の真実源(single source of truth)。

## レイヤ型 (Type)

```ts
type Kind = 'computable' | 'heuristic'  // user 入力は廃止 (INV-SF-5 ステートレス)
type Impact = 'fatal' | 'accuracy' | 'cosmetic' // 壊れた時の影響度
type Loc = { ja: string; en: string }           // i18n: 文言は二言語持つ (design:i18n)

type Layer = {
  id: string
  label: Loc
  killer: Loc        // 何が壊すか
  kind: Kind
  appliesNow: boolean // 今この実装が実際に依存しているか (false=回避済み)
  impact: Impact      // 失効時に時計に起きること
  note?: Loc
  failureYear?: (now: Date) => number  // computable のみ
  estimatedYears?: number              // heuristic のみ
  confidence?: 'low' | 'medium' | 'high'
}
```

## 要件 (REQ)

- REQ-LY-1: THE SYSTEM SHALL レイヤを `order`(短命→長命)の昇順で保持すること。
- REQ-LY-2: THE SYSTEM SHALL 最低限以下を含むこと:
  host/file(heuristic, 冗長化で max 化 / design:hosting-redundancy), framework/build/CDN(heuristic, `appliesNow=false`),
  TLS(heuristic), browser/JSエンジン(heuristic), HTML/CSS規格(heuristic),
  時刻API(Date/Temporal)(heuristic, `appliesNow=true` but Temporal は不使用・polyfill無し),
  IANA tz DB(heuristic, impact=accuracy), IEEE754/Unicode(heuristic),
  Date数値上限(computable), うるう秒廃止(computable, impact=cosmetic),
  32bit time_t/2038(computable, impact=cosmetic), 電力/デバイス/文明(heuristic).
- REQ-LY-3: WHERE `kind=computable` THE SYSTEM SHALL 既知の確定年から残存年数を算出すること。
  - `date-limit`: `new Date(8640000000000000)` の **UTC年**(= 275760。ローカルTZでズレないよう `getUTCFullYear()` を用いる)
  - `leap-second`: 2035 (IERS うるう秒廃止目標)
  - `time-t-2038`: 2038 (符号付き32bit time_t 上限。JS自体には影響しない旨を note、`impact=cosmetic`)
- REQ-LY-4: IF `appliesNow=false` THEN THE SYSTEM SHALL 「不使用」と明示しつつ、**もし依存していた場合の残存年数(反実仮想)も算出して表示**すること(該当なしで終わらせない)。反実仮想レイヤは実効寿命の律速判定からは除外する。
- REQ-LY-5: THE SYSTEM SHALL `impact` を必須とし、`fatal`=描画停止 / `accuracy`=動くが不正確化 / `cosmetic`=軽微、で分類すること。
- REQ-LY-6: 文言(label/killer/note)は `{ja,en}` の二言語を持つこと (design:i18n)。

## 検証性質 (PROP)

- PROP-LY-1: 全 Layer に一意 `id`。
- PROP-LY-2: 全 `computable` は `failureYear` を持ち有限値/Infinity を返す。
- PROP-LY-3: 全 Layer が `impact` と `appliesNow` を持ち、label/killer は ja/en 両方を持つ。
