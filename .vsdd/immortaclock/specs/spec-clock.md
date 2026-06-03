---
id: spec:clock
title: 時刻表示 (Core Clock)
coherence:
  depends_on:
    - design:single-file
---

# spec:clock — 時刻表示

デバイスのローカル時計を読み、人間可読な現在時刻を表示する。これが最小コア。

## 要件 (EARS)

- REQ-CLK-1: THE SYSTEM SHALL 現在のローカル時刻を `YYYY-MM-DD HH:MM:SS` 形式で表示すること。
- REQ-CLK-2: WHEN 1秒が経過する THE SYSTEM SHALL 表示を更新すること。
- REQ-CLK-3: THE SYSTEM SHALL `setInterval` の累積ドリフトを避けるため、各 tick で `new Date()` を再取得すること(自前カウンタで時刻を積算しない)。
- REQ-CLK-4: THE SYSTEM SHALL 整形に `Date` の基本メソッドのみを使うこと。`Temporal`/`Intl` は使用せず polyfill もしない(長命性のため。native に `Temporal` があっても本コアは Date を維持)。理由は依存表の「時刻API」行に明示する。
- REQ-CLK-5: THE SYSTEM SHALL 西暦は4桁ゼロ詰めしないが、月日時分秒は2桁ゼロ詰めすること。

## 検証性質 (PROP)

- PROP-CLK-1: 整形関数 `format(date)` は固定の Date 入力に対し決定的な文字列を返す。
- PROP-CLK-2: 任意の Date に対し `format` の出力は正規表現 `^\d+-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` に一致する。
