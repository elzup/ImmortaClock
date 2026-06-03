---
id: spec:longevity
title: 寿命評価 (Years-Left Engine)
coherence:
  depends_on:
    - design:layers
---

# spec:longevity — 「あと何年」算出エンジン

各依存レイヤの残存年数を種別に応じて算出する。内蔵テーブル + 自動計算のハイブリッド。
ユーザー入力は廃止(ステートレス)。

## 要件 (EARS)

- REQ-LV-1: WHEN `kind=computable` THE SYSTEM SHALL `yearsLeft = max(0, failureYear(now) - now.getFullYear())` を算出すること。Infinity は「∞」を返す。`failureYear` は TZ 非依存のため `getUTCFullYear()` 基準で確定年を比較する。
- REQ-LV-2: WHEN `kind=heuristic` THE SYSTEM SHALL `estimatedYears` を残存年数とし `confidence` を併記すること。
- REQ-LV-3: WHEN `appliesNow=false` THE SYSTEM SHALL 残存年数を「反実仮想(依存していた場合の目安)」として算出・表示し、basis に「不使用」を明示すること。
- REQ-LV-4: THE SYSTEM SHALL 各結果に `basis`(`計算可能` | `推定` | `不使用`)を付与すること。
- REQ-LV-5(描画寿命): THE SYSTEM SHALL `impact=fatal` かつ `appliesNow=true` かつ (`heuristic` なら `confidence!=low`) のレイヤ群の最小残存年数を「描画が続く実効寿命」とし、その律速レイヤ名を併記すること。
- REQ-LV-6(精度寿命): THE SYSTEM SHALL `impact=accuracy` かつ `appliesNow=true` のレイヤ群の最小残存年数を「正確な地域時刻の寿命」として別途算出すること。
- REQ-LV-7: IF 残存年数が負になりうる計算 THEN THE SYSTEM SHALL 0 にクランプすること。

## 検証性質 (PROP)

- PROP-LV-1: 任意の now に対し computable の yearsLeft は常に >= 0 または ∞。
- PROP-LV-2: `date-limit` の yearsLeft は `leap-second` より常に大きい。
- PROP-LV-3: 描画寿命 <= 律速判定に含まれる全レイヤの yearsLeft。
- PROP-LV-4: 描画寿命の算出に `appliesNow=false`・`cosmetic`・`accuracy`・`confidence=low` のレイヤは寄与しない。
