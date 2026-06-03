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
3. 静的ホスト複数(GitHub Pages / Cloudflare Pages 等、障害が相関しない別運営)
4. リポジトリ・ミラー(無料・無制限のみ: GitLab / Codeberg) — git は分散なので各リモートが完全ミラー
5. アーカイブ(archive.org の Wayback) — 自分が消えても残る

## 当面の具体ターゲット(ビルド不要の単一HTMLを置くだけ)

| 配布先 | 種別 | 運営(独立性) | コスト | 状態 |
|---|---|---|---|---|
| GitHub Pages | Pages配布 + repo | Microsoft | 無料 | 稼働(primary) |
| Cloudflare Pages | Pages配布 | Cloudflare | 無料 | 予定 |
| GitLab | repo ミラー(+Pages可) | GitLab社 | 無料・無制限 | 候補 |
| Codeberg | repo ミラー(+Pages可) | 非営利(独) | 無料・無制限 | 候補 |

## 要件 (REQ)

- REQ-HOST-1: host/file レイヤの note にこの冗長化戦略を要約掲示すること。
- REQ-HOST-2: 入力フォーム・永続状態を作らないこと(INV-SF-5 準拠)。寿命は「運用次第」と定性表示し、数値の根拠は heuristic とする。
- REQ-HOST-3: THE SYSTEM SHALL 配布先(Pages 配布 / repo ミラー)を `配布先 / 種別 / 運営 / コスト / 状態(稼働|予定|候補)` の表として自己診断に掲示すること。運営主体が相関しない独立先を併用する。
- REQ-HOST-4: repo ミラーは**無料・無制限**の条件を満たす先のみ採用すること(GitLab / Codeberg)。当面の Pages 配布は GitHub Pages(稼働)+ Cloudflare Pages(予定)とする。
