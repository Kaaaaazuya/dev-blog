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

## 品質ゲート

**前提**: `brew install gitleaks`（秘密情報スキャン。未インストールだとpre-commitが失敗する）

| タイミング      | 実行内容                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| pre-commit      | lint-staged（Prettier + ESLint --fix、警告0）→ gitleaks（staged差分の秘密情報スキャン）       |
| pre-push        | `pnpm typecheck`（astro check、strict設定）                                                   |
| CI (quality)    | format:check / lint / typecheck / build / actionlint（workflowファイルの構文検証）            |
| CI (security)   | gitleaks（全履歴）/ `pnpm audit --audit-level=high` / Dependabot（週次）                      |
| CI (AIレビュー) | 記事追加PRに claude-code-action で観点別レビュー（炎上リスク / 情報漏洩 / SEO）・non-blocking |

- git hooksは `pnpm install` 時に `prepare` スクリプト（simple-git-hooks）が自動登録する
- 手動実行: `pnpm format` / `pnpm lint` / `pnpm typecheck`
- 型チェックは `astro/tsconfigs/strict` ベース（`tsconfig.json`）
