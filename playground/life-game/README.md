# ライフゲーム（Vite+ トライアル）

Vite+ を実際に触って検証するためのお試しプロジェクトです。ブログ本体（Astro）とは
完全に独立しており、依存関係もビルド・デプロイ対象にも含まれません。

- ロジック（`src/life.ts`）は Canvas / DOM に依存しない純粋関数なので Vitest で単体テスト可能
- 盤面描画・操作は `src/main.ts` から Canvas 2D で行う

## セットアップ

このディレクトリはルートの pnpm workspace には含めていません（ルートの
`pnpm-workspace.yaml` にあるサプライチェーン対策設定と混ざらないように独立させています）。

```sh
cd playground/life-game
pnpm install --ignore-workspace
pnpm dev      # vp run dev
pnpm test     # vp run test
pnpm lint     # vp run lint (Oxlint)
pnpm format   # vp run format (Oxfmt)
pnpm build    # vp run build
```

## 検証メモ

- Node `^20.19.0 || >=22.12.0` が必要（このリポジトリは Node 22 系で動作確認）
- `.astro` のような非標準拡張子ファイルは扱っていないため、ブログ本体で使っている
  `eslint-plugin-astro` / `prettier-plugin-astro` 相当の対応状況はこのトライアルでは検証できない
