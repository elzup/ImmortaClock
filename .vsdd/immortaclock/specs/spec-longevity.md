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

- REQ-LV-1: WHEN `kind=computable` THE SYSTEM SHALL `yearsLeft = max(0, failureYear(now) - now.getUTCFullYear())` を算出すること。Infinity は「∞」を返す。`getUTCFullYear()` 基準にするのは確定年比較を TZ 非依存にするため。
- REQ-LV-2: WHEN `kind=heuristic` THE SYSTEM SHALL `estimatedYears` を残存年数とし `confidence` を併記すること。
- REQ-LV-3: WHEN `status!=='active'`(escaped/na) THE SYSTEM SHALL 残存年数を「反実仮想(依存していた/該当した場合の目安)」として算出・表示し、`statusKey` に依存状態(`escaped`|`na`)を載せること。
- REQ-LV-4(2軸分離): THE SYSTEM SHALL 結果に **推定根拠** `basisKey`(`computable` | `heuristic` の2値のみ。`kind` に一致)と **依存状態** `statusKey`(`active` | `escaped` | `na`。`status` に一致)を**別フィールド**で付与すること。`basisKey` に「不使用」を混入させない (Task2)。
- REQ-LV-5(描画寿命): THE SYSTEM SHALL `impact=fatal` かつ `status==='active'` かつ (`heuristic` なら `confidence!=low`) のレイヤ群の最小残存年数を「描画が続く実効寿命」とし、その律速レイヤ名を併記すること。
- REQ-LV-6(精度寿命): THE SYSTEM SHALL `impact=accuracy` かつ `status==='active'` のレイヤ群の最小残存年数を「正確な地域時刻の寿命」として別途算出すること。
- REQ-LV-7: IF 残存年数が負になりうる計算 THEN THE SYSTEM SHALL 0 にクランプすること。

## 検証性質 (PROP)

- PROP-LV-1: 任意の now に対し computable の yearsLeft は常に >= 0 または ∞。
- PROP-LV-2: `date-limit` の yearsLeft は `leap-second` より常に大きい。
- PROP-LV-3: 描画寿命 <= 律速判定に含まれる全レイヤの yearsLeft。
- PROP-LV-4: 描画寿命の算出に `status!=='active'`・`cosmetic`・`accuracy`・`confidence=low` のレイヤは寄与しない。
- PROP-LV-5: 全レイヤで `basisKey ∈ {computable, heuristic}` かつ `statusKey ∈ {active, escaped, na}`(2軸が独立)。
