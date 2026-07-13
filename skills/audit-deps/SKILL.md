---
name: audit-deps
description: package.json の依存ライブラリを監査する。「依存関係をチェック」「不要なライブラリがないか確認」「メンテされていないパッケージを探して」などと依頼されたときに使う。未使用依存の検出と、メンテ停止・低人気パッケージの洗い出しを行い、削除・置換を提案する。
---

# audit-deps — 依存ライブラリ監査

## 目的

2つの観点で依存を監査し、問題があれば削除・置換を提案する。

1. **未使用**: package.json に載っているがコードから参照されていない
2. **メンテ状況**: 使ってはいるが、開発停止・低人気で長期リスクになっている

## 手順

### 1. 依存の棚卸しと使用箇所の確認

- `package.json` の dependencies / devDependencies を列挙する
- import の実態を確認する:

  ```sh
  grep -rEoh "from ['\"][^.'\"/][^'\"]*['\"]|import\(['\"][^.'\"/][^'\"]*['\"]\)" src astro.config.mjs eslint.config.js | sort | uniq -c
  ```

- knip で機械的にも検出する: `pnpm dlx knip --no-progress`

### 2. knip の偽陽性を除外する（このリポジトリ固有）

以下は knip が「未使用」と報告するが**実際には使用中**。削除提案しないこと。

| パッケージ                                  | 実際の使用箇所                                                  |
| ------------------------------------------- | --------------------------------------------------------------- |
| `@fontsource/ibm-plex-sans-jp`              | `src/lib/og-image.ts` が `require.resolve()` で woff を直接読む |
| `textlint-filter-rule-comments`             | `.textlintrc.yml` の `filters.comments`                         |
| `textlint-rule-preset-ja-technical-writing` | `.textlintrc.yml` の `rules`                                    |
| `textlint-rule-prh`                         | `.textlintrc.yml` の `rules`（ルール定義は `prh.yml`）          |

このほか設定ファイル経由で使われるものに注意: `prettier-plugin-astro`（`.prettierrc.json`）、`simple-git-hooks` / `lint-staged`（package.json 内の設定ブロック）、`wrangler`（デプロイ、`wrangler.toml`）、`@astrojs/check` / `typescript`（`pnpm typecheck`）。

新しい偽陽性を見つけたら上の表に追記してこの skill を更新する。

### 3. メンテ状況の確認

各依存について最終リリース日とリポジトリを取得する（リモート環境では `api.npmjs.org` と `npmjs.com` はプロキシで遮断されるが、`registry.npmjs.org` は通る）:

```sh
curl -s "https://registry.npmjs.org/<pkg名（/は%2F）>" | node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  const j=JSON.parse(d);
  const v=j["dist-tags"].latest;
  console.log(v, j.time[v].slice(0,10), (j.repository?.url??"").replace(/^git\+|\.git$/g,""));
});'
```

判断基準:

- **最終リリースが2年以上前** → WebSearch で GitHub の活動状況（直近コミット・スター数・org 移管・後継の有無）を確認。npm のリリースが止まっていてもリポジトリが生きていることがある（例: `@resvg/resvg-js` は npm 安定版が2024年で止まっているが、thx org へ移管され alpha 開発が継続中）
- **リポジトリがアーカイブ済み / deprecated 通知あり** → 削除または置換を提案
- **スター数百未満かつ活動停止** → 置換候補を挙げて提案。ただし textlint-ja 系のようにニッチでも公式 org 配下で保守されているものは問題視しない
- 判断に迷うものは「削除」ではなく「経過観察」として報告する

### 4. 報告

以下の形式で報告する。削除を提案する場合は、削除して build / test / lint が通ることを確認してから提案する。

- **削除提案**: パッケージ名、理由（未使用 or メンテ停止）、削除時の影響
- **置換提案**: 現行 → 候補、移行コスト
- **経過観察**: 気になるが今は問題ないもの（次回監査で再確認）
- **問題なし**: 件数のみ

## 前回監査の記録（次回はここから差分確認）

### 2026-07-13

- 未使用依存: なし（knip 指摘4件はすべて上記の偽陽性）
- 削除・置換提案: なし
- 経過観察:
  - `@resvg/resvg-js` — npm 安定版 2.6.2 が 2024-03 から更新なし。リポジトリは thx org 移管後も活動中（2026-01 に 2.7.0-alpha）。安定版が長期停止したら satori + sharp 構成などへの置換を検討
  - `simple-git-hooks` — 小規模（約1.4kスター）だが保守継続中。止まったら husky へ
  - `eslint-plugin-astro` — v3.0.0 が 2026-07 リリース（使用中は ^2）。メジャー更新の追従を検討
  - `@astrojs/markdown-remark` — astro 内部パッケージを直接依存に持つ構成。astro 本体のバージョンと乖離しないよう更新時に注意
