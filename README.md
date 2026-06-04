# ImmortaClock

[![oparts](https://img.shields.io/badge/∅-oparts-6a5acd)](https://github.com/elzup/oparts-spec)

依存最小・フレームワーク非依存の「長命」web 時計。単一 HTML ファイルで動き、
アプリ自身が **依存レイヤ一覧とあと何年動くか** を自己診断して表示する。

**Demo: https://elzup.github.io/ImmortaClock/**

## 特徴

- **単一ファイル**: `index.html` だけ。ビルド・CDN・外部リソース 0。`file://` でも動く。
- **依存最小**: 時刻整形は `Date` の基本メソッドのみ（`Temporal`/`Intl` 不使用）。
- **自己診断**: 各依存レイヤ（host/file・ブラウザ API・実行基盤など）の寿命を計算し、
  実効寿命と精度寿命を表示。脱却済み・非該当の項目も理由付きで併記する。
- **i18n**: ja / en 切替。

## 動かす

```sh
open index.html        # ブラウザで直接開くだけ
```

## 開発

仕様・テストは [VCSDD](https://github.com/elzup/oparts-spec) で管理し `.vsdd/immortaclock/` に置く。

```sh
cd .vsdd/immortaclock
node --test tests/*.test.mjs   # ロジック / DOM / 単一ファイル / 静的配線 / CEG ゲート
node ceg.mjs validate          # spec 依存グラフ (CEG) の整合検証
node ceg.mjs rank              # レイヤの頑健性ランク (推移的依存数)
```
