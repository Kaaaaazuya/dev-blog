# 執筆規約（zenn-blog版から移植・自作ブログ用に調整）

## 文体・分量

- ですます調。1記事 4,000〜8,000字（読了10分以内）を目安に、超えるなら分割
- 1記事1テーマ。「ついでに」書きたくなったら別記事にする
- タイトルは設計判断が見える形に（例: ×「エージェントの実装」→ ◯「LLMに決めさせる範囲を最小化する」）
- AI生成色の強い記事はAdSense・検索評価の両面で不利。実体験・実測値・失敗談を必ず核にする

## コード引用

- 引用元は必ず GitHub パーマリンク（コミットSHA付きURL）。mainブランチ直リンク禁止
- 1ブロック40行以内。長い場合は「# ...(略)」で刈り込み、全文はリンクに任せる
- コードブロック1行目にファイルパスをコメントで入れる
- 記事執筆時点のコードと乖離したら、記事冒頭に「◯◯時点のコードに基づく」と明記

## 図

- mermaid を第一選択（レンダリング方式は architecture.md 未決事項）
- 1記事に最低1枚「全体像」の図。図→コードの順で説明する

## frontmatter（Astro用）

- `draft: true` で執筆、レビュー完了時に `false` + `pubDate` を公開日に
- `description` は必須（SEO・OGP用、1〜2文）
- `series: "ai-architecture"` でシリーズ紐付け
- ファイル名 = URL slug: `ai-arch-<連番2桁>-<英語テーマ>.md`

## 公開前チェックリスト

- [ ] タイトルに設計判断・数字・具体性のいずれかがあるか
- [ ] 全体像の図があるか（コードより先に出てくるか）
- [ ] 「採用しなかった案と理由」を書いたか
- [ ] コード引用がパーマリンクか・40行以内か
- [ ] description を書いたか
- [ ] `pnpm dev` で表示確認（図・コードブロック・リンク切れ）

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

元ネタの詳細（概要・該当コード・図案）は `ai-architecture-blog-topics.md` を参照。
