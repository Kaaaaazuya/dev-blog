# kinakomochio.dev — 自作技術ブログ（Astro + Cloudflare Pages + AdSense）

「作って学んだこと」を記事化する自作ブログ。広告掲載（AdSense）対応の大枠まで実装済み。

- 構成・未決事項・セットアップ手順: [docs/architecture.md](docs/architecture.md)
- 執筆規約・シリーズ計画: [docs/writing-guide.md](docs/writing-guide.md)
- 記事テンプレ: [templates/](templates/)

## クイックスタート

パッケージマネージャは **pnpm**（サプライチェーン攻撃対策。設定は `pnpm-workspace.yaml`）。

```bash
corepack enable && corepack use pnpm@latest  # 初回のみ。packageManager を固定
pnpm install
pnpm dev   # http://localhost:4321 でサンプル記事の表示確認
```

依存のビルドスクリプトは既定でブロックされる。新たに必要になったら `pnpm approve-builds` で個別許可。

## 記事の書き方

```bash
cp templates/article-template.md src/content/blog/ai-arch-01-llm-responsibility.md
# draft: true のまま執筆 → レビュー後 false にして merge → 自動デプロイ
```
