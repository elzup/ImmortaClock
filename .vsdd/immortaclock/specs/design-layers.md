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

**2軸を厳密に分離する** (Task2): 依存状態 (`status`) と 推定根拠 (`kind`) は直交概念。
かつて `appliesNow:boolean` と「不使用」basis が混在していたのを解消する。

```ts
type Status = 'active' | 'escaped' | 'na'
//   active  = 依存中 (今この実装が実際に依存)
//   escaped = 脱却   (依存し得たが意図的に回避。反実仮想で年数提示)
//   na      = 該当なし (外部の時刻問題等で本アプリには非該当・情報)
type Kind = 'computable' | 'heuristic'  // 推定根拠の軸 (status と直交)。user 入力は廃止 (INV-SF-5)
type Impact = 'fatal' | 'accuracy' | 'cosmetic' // 壊れた時の影響度
type Loc = { ja: string; en: string }           // i18n: 文言は二言語持つ (design:i18n)

type Layer = {
  id: string
  label: Loc
  killer: Loc        // 何が壊すか
  kind: Kind
  status: Status     // 依存状態の軸 (旧 appliesNow:boolean を3値化)
  impact: Impact     // 失効時に時計に起きること
  note?: Loc         // active 行の補足 (表1 のラベル下)
  aside?: Loc        // escaped/na 行の「回避手段 / 非該当の理由」(表2)
  failureYear?: (now: Date) => number  // computable のみ
  estimatedYears?: number              // heuristic のみ
  confidence?: 'low' | 'medium' | 'high'
}
```

## 要件 (REQ)

- REQ-LY-1: THE SYSTEM SHALL レイヤ配列を `active`(脆い→堅牢) → `escaped` → `na` の順で保持すること。
- REQ-LY-2: THE SYSTEM SHALL 最低限以下を含むこと:
  host/file(heuristic, active, 冗長化で max 化 / design:hosting-redundancy), framework/build/CDN(heuristic, `status=escaped`),
  TLS(heuristic, `status=escaped`: file:// で不要), 永続ストレージ(localStorage/Cookie)(heuristic, `status=escaped`: INV-SF-5 ステートレス),
  browser/JSエンジン(heuristic, active), HTML/CSS規格(heuristic, active),
  時刻API(Date)(heuristic, active。Temporal は不使用・polyfill無し),
  IANA tz DB(heuristic, active, impact=accuracy), IEEE754/Unicode(heuristic, active),
  Date数値上限(computable, active), うるう秒廃止(computable, `status=na`, impact=cosmetic),
  32bit time_t/2038(computable, `status=na`, impact=cosmetic), 電力/デバイス/文明(heuristic, active).
- REQ-LY-3: WHERE `kind=computable` THE SYSTEM SHALL 既知の確定年から残存年数を算出すること。
  - `date-limit`: `new Date(8640000000000000)` の **UTC年**(= 275760。ローカルTZでズレないよう `getUTCFullYear()` を用いる)
  - `leap-second`: 2035 (IERS うるう秒廃止目標)
  - `time-t-2038`: 2038 (符号付き32bit time_t 上限。JS自体には影響しない旨を aside、`impact=cosmetic`)
- REQ-LY-4: IF `status!=='active'` (escaped/na) THEN THE SYSTEM SHALL **もし依存していた場合の残存年数(反実仮想)を算出して表示**し、`aside` に「回避手段(escaped) / 非該当の理由(na)」を明示すること(該当なしで終わらせない)。非 active レイヤは実効寿命の律速判定からは除外する。
- REQ-LY-5: THE SYSTEM SHALL `impact` を必須とし、`fatal`=描画停止 / `accuracy`=動くが不正確化 / `cosmetic`=軽微、で分類すること。
- REQ-LY-6: 文言(label/killer/note/aside)は `{ja,en}` の二言語を持つこと (design:i18n)。
- REQ-LY-7: THE SYSTEM SHALL `status`(依存状態)と `kind`(推定根拠)を独立に保持し、推定根拠に「不使用」を混入させないこと(Task2 の2軸分離)。

## 検証性質 (PROP)

- PROP-LY-1: 全 Layer に一意 `id`。
- PROP-LY-2: 全 `computable` は `failureYear` を持ち有限値/Infinity を返す。
- PROP-LY-3: 全 Layer が `impact` と `status`(`active|escaped|na`) を持ち、label/killer は ja/en 両方を持つ。
