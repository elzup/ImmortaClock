---
id: design:hosting-redundancy
title: ホスティング冗長化 (寿命を min から max へ)
coherence:
  depends_on:
    - design:single-file
---

# design:hosting-redundancy — 配布の長命化戦略

最も脆いレイヤ(host/file)の寿命を伸ばす設計上の指針。**フォームや状態は作らない**(注記とドキュメントのみ)。

## 核心洞察

- 単一ホスト = 単一障害点 → 寿命 = その1つの寿命(min)。
- 独立した N 配布先を持つ → 寿命 = **どれか1つでも生き残る限り(max)**。冗長化は min を max に変える。

## 推奨配布先(独立性の高い順に併用)

1. オフライン複製(USB / 印刷した QR / メール添付) — ネットも業者も不要、最も独立
2. コンテンツアドレス(IPFS / Arweave) — URL がドメイン課金に依存しない
3. 静的ホスト複数(GitHub Pages / Netlify / 自宅サーバ等、障害が相関しない先)
4. アーカイブ(archive.org の Wayback) — 自分が消えても残る

## 要件 (REQ)

- REQ-HOST-1: host/file レイヤの note にこの冗長化戦略を要約掲示すること。
- REQ-HOST-2: 入力フォーム・永続状態を作らないこと(INV-SF-5 準拠)。寿命は「運用次第」と定性表示し、数値の根拠は heuristic とする。
