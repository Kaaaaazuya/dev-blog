# 執筆規約

記事ドラフトの生成は `skills/write-draft/SKILL.md` の手順に従う。ネタの詳細は [article-ideas.md](article-ideas.md)、方向性と優先順位は [blog-strategy.md](blog-strategy.md)。

このリポジトリはpublicのため、`draft: true` の未公開記事もサイトには出ないがGitHub上では誰でも読める（許容する方針）。公開前提の内容のみを書くこと。

## 文体・分量

- ですます調。1記事 4,000〜8,000字（読了10分以内）を目安に、超えるなら分割
- **軽量記事枠**: TIL・小ネタ・失敗メモは 1,500〜3,000字でも可（`tags` に `til` を付ける）。大作主義で更新が止まるより、短くても継続発信を優先する
- 1記事1テーマ。「ついでに」書きたくなったら別記事にする
- タイトルは設計判断が見える形に（例: ×「エージェントの実装」→ ◯「LLMに決めさせる範囲を最小化する」）。入口ハブ記事（B-0/D-1）のみ例外で、検索キーワードを広く取る（例:「RAGとは」）
- 定点観測記事（D-1系）はタイトルまたは冒頭に「2026年◯月現在」と時点を明記する
- AI生成色の強い記事はAdSense・検索評価の両面で不利。実体験・実測値・失敗談を必ず核にする

## コード引用

- 引用元は必ず GitHub パーマリンク（コミットSHA付きURL）。mainブランチ直リンク禁止
- 1ブロック40行以内。「実装のポイントに関係する行」だけ残して刈り込み、全文はリンクに任せる
- コードブロック1行目にファイルパスをコメントで入れる
- 記事冒頭（題材アプリ節）に「コミット◯◯時点のコードに基づく」とSHA付きで明記する
- 必ず実物のコードを読んでから引用する。記憶・推測で書かない

## 図

- mermaid を第一選択（remarkプラグイン+クライアントレンダリング導入済み）
- 1記事に最低1枚「全体像」の図。図→コードの順で説明する
- 使い分けの目安: コンポーネント間のやり取り＝sequenceDiagram、処理の分岐・反復＝flowchart

## frontmatter（Astro用）

- `draft: true` で執筆、レビュー完了時に `false` + `pubDate` を公開日に
- `description` は必須（SEO・OGP用、1〜2文）
- シリーズ紐付けとslug規則:
  - AIアーキテクチャ編: `series: "ai-architecture"`、slug `ai-arch-<連番2桁>-<英語テーマ>.md`
  - Claude Code編: `series: "claude-code"`、slug `cc-<連番2桁>-<英語テーマ>.md`
  - 入口ハブ記事（B-0等）: slug `intro-<英語テーマ>.md`、`series` は誘導先シリーズに合わせる。ただしシリーズ第1回がハブを兼ねる場合（D-1 = cc-01等）はシリーズのslug規則を優先する

## 記事間リンク（シリーズの接続・ハブ&スポーク）

- 「はじめに」に前回記事への相対リンクを入れる: `[前回](/blog/<slug>/)`（絶対URL・ドメイン名は書かない）
- 「まとめ」の末尾に次回予告を1〜2文
- 「参考」に前回記事リンクを再掲
- 入口ハブ記事（B-0/D-1）が公開されたら、各論記事の「はじめに」と「まとめ」からハブへのリンクを必ず置く。ハブ側は各論公開のたびにリンクを追記する

## 公開前チェックリスト

- [ ] タイトルに設計判断・数字・具体性のいずれかがあるか
- [ ] 全体像の図があるか（コードより先に出てくるか）
- [ ] 「採用しなかった案と理由」を書いたか
- [ ] コード引用がパーマリンクか・40行以内か・実物と一致しているか
- [ ] description を書いたか
- [ ] 前回リンク・次回予告があるか
- [ ] 本文4,000〜8,000字か（タグ除去後の概算）
- [ ] `pnpm format` / `lint` / `typecheck` / `build` が通るか（pre-commitでも強制される）
- [ ] `pnpm dev` で表示確認（mermaid・コードブロック・リンク切れ）

## シリーズ計画

| #   | slug                            | テーマ                               | 元ネタ |
| --- | ------------------------------- | ------------------------------------ | ------ |
| 01  | ai-arch-01-llm-responsibility   | LLMに決めさせる範囲を最小化する      | A-1    |
| 02  | ai-arch-02-agent-loop           | エージェントループの最小実装         | A-2    |
| 03  | ai-arch-03-force-tool-calling   | Force Tool Callingで一括構造化抽出   | A-3    |
| 04  | ai-arch-04-local-llm-fallback   | 小型LLMのtool_calls外しに備える      | A-4    |
| 05  | ai-arch-05-litellm-provider     | Ollama⇄Claudeをmodel文字列で切替     | A-5    |
| 06  | ai-arch-06-llm-observability    | 全LLM呼び出しを1か所で計測する       | A-6    |
| 07  | ai-arch-07-tool-selection-evals | ツール選択のEvalsをpytestから分離    | A-7    |
| 08  | ai-arch-08-rag-pipeline         | RAG取り込みパイプラインの全体設計    | B-1    |
| 09  | ai-arch-09-chunking-no-ai       | チャンク分割に「AIを使わない」判断   | B-2    |
| 10  | ai-arch-10-swap-dev-prod        | 開発Ollama/本番Bedrockの差し替え設計 | B-3    |
| 11+ | ai-arch-11-rag-precision-*      | RAG精度改善（手法ごとに分割可）      | B-4    |
| 12  | ai-arch-12-search-evals         | hit@k/MRRによる検索評価基盤          | B-5    |
| 13  | ai-arch-13-sse-rag-chat         | SSEストリーミングRAGチャット         | B-6    |
| 14  | ai-arch-14-atomic-reingest      | ベクトルデータの原子的再取り込み     | B-7    |
| 15  | ai-arch-15-design-philosophy    | 2プロジェクトを貫く設計思想（総括）  | C-1    |
| 16  | ai-arch-16-child-resolution     | 対象児の解決をLLMに任せない          | A-8    |
| 17  | ai-arch-17-ai-bypass-paths      | AIを迂回する経路の設計               | A-9    |
| 18  | ai-arch-18-scheduled-push       | 定時Push通知とfan-out                | A-10   |
| 19  | ai-arch-19-webhook-security     | LLMの手前を固めるwebhookセキュリティ | A-11   |
| 20  | ai-arch-20-event-driven-ingest  | SQS×Lambdaのイベント駆動取り込み     | B-8    |
| 21  | ai-arch-21-zero-cost-deploy     | アイドル課金ゼロのデプロイ構成       | B-9    |
| 22  | ai-arch-22-e2e-testing          | RAGパイプラインのE2Eテスト2層戦略    | B-10   |
| 23  | ai-arch-23-async-upload-status  | presignedアップロードと状態追跡      | B-11   |

### 入口ハブ記事（シリーズ横断）

| slug              | テーマ                                    | 元ネタ |
| ----------------- | ----------------------------------------- | ------ |
| intro-what-is-rag | RAGとは — 自作RAGの実物で仕組みを理解する | B-0    |

### Claude Code編（series: "claude-code"）

| #   | slug                    | テーマ                                          | 元ネタ |
| --- | ----------------------- | ----------------------------------------------- | ------ |
| 01  | cc-01-blog-automation   | Claude Codeでブログを運営する全体像（定点観測） | D-1    |
| 02  | cc-02-skill-feedback    | レビュー指摘をスキルへ還元する執筆ワークフロー  | D-2    |
| 03  | cc-03-ai-review-ci      | claude-code-actionで観点別AIレビューCIを組む    | D-3    |
| 04  | cc-04-quality-gates     | AIが書く前提の品質ゲート設計                    | D-4    |
| 05  | cc-05-product-dev       | 自作プロダクト開発でのClaude Code活用実態       | D-5    |
| 06  | cc-06-things-didnt-work | Claude Code運用でうまくいかなかったこと集       | D-6    |
| 07  | cc-07-minimal-hooks     | フック最小導入とチェック集約の判断              | D-7    |
| 08  | cc-08-atr-gate          | ATRによるスキル改ざん検知ゲート                 | D-8    |

### 未実装バックログ（E系）

まだ実装していない技術ネタは [article-ideas.md](article-ideas.md) のE系で管理する。**実装してから記事化**が原則（slugは昇格時に採番）。

元ネタの詳細（概要・該当コード・図案）は [article-ideas.md](article-ideas.md) を参照。
