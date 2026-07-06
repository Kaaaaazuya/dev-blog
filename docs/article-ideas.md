# AIプロダクト・アーキテクチャ解説ブログ 記事候補一覧

koto-log（LINE育児記録エージェント / Tool Use）と biblio-rag（日本語書籍RAGパイプライン）から抽出した、AIプロダクト特有のアーキテクチャ・設計テーマ。各項目が1記事以上の想定。

---

## A. koto-log — Tool Use エージェント編

### A-1. 「LLMに決めさせる範囲を最小化する」責務分離設計

- **概要**: 設計の核心。LLMは意図解釈・ツール選択・文章生成のみ、時刻解決（「さっき」→JST絶対時刻）・サブタイプ正規化・SQL・集計計算はすべてアプリコードが確定値で実行する。README の責務分担表がそのまま記事の骨子になる。
- **コード**: `agent/loop.py`（システムプロンプトの「自分で変換しない」指示）、`utils/timeparse.py`、`utils/subtype.py`、`tools/executor.py`
- **図案**: LLM担当/アプリ担当の境界を示すシーケンス図

### A-2. エージェントループの実装（入力→LLM→ツール実行→結果戻し→…）

- **概要**: MAX_ITERS=5 の反復ループ、会話文脈の3往復切り詰め、tool_calls の抽出と実行、最終応答生成まで。エージェントの最小構成を1ファイルで見せられる。
- **コード**: `agent/loop.py`（238行・全文解説可能なサイズ）
- **図案**: ループのフローチャート

### A-3. Force Tool Calling による一括構造化抽出

- **概要**: 「9時に母乳、10時から昼寝、11時におむつ」を1回のLLM呼び出しで複数レコードに構造化。記録でなければ空リストを返し通常ループへフォールバックする2段構え。JSON Schema（enum・required厳格化）が実質のプロンプト。
- **コード**: `agent/extractor.py`、`tools/definitions.py`
- **図案**: extract→fallback の分岐図

### A-4. 小型ローカルLLM対応のフォールバック解析

- **概要**: 小型モデルは構造化 tool_calls を外して本文にJSONを吐くことがある。正規表現でJSONを復元する `_fallback_parse` と、enum/required でツールスキーマを厳格化して外れにくくする防御的設計。
- **コード**: `agent/loop.py` の `_fallback_parse` / `_extract_calls`、`tools/definitions.py`

### A-5. LiteLLM によるプロバイダ抽象化（Ollama ⇄ Claude をmodel文字列だけで切替）

- **概要**: ツール定義・executor はモデル非依存に保ち、プロバイダ差はラッパ1枚（59行）だけで吸収。ローカル無料開発→本番Claude切替の実践例。
- **コード**: `llm/client.py`
- **図案**: 抽象化レイヤーの構成図

### A-6. LLM可観測性 — 全呼び出しの「唯一の通り道」でトークン計測

- **概要**: `LLMClient.complete()` を全LLM呼び出しの単一経路にし、そこで使用量を捕捉。contextvar によるトレースID（1 handle = 1トレース）、Sink差し替え設計（JsonLog→Langfuse移行を1クラス追加で）、育児ログ本文をイベントに含めないPII方針、計測失敗で本処理を止めない best-effort。
- **コード**: `obs/usage.py`、`llm/client.py`、ADR-0002
- **図案**: トレース/ジェネレーションの関係図

### A-7. LLM出力の評価（Evals） — ツール選択正答率

- **概要**: 非決定論的な実LLMを決定論的pytestから分離し、代表シナリオ×複数回実行で「期待ツール+必須引数」の正答率を計測。モデル切替時の回帰検知にも使える。
- **コード**: `evals/tool_selection.py`
- **図案**: テストピラミッドにevalsを重ねた図

---

## B. biblio-rag — RAGパイプライン編

### B-1. RAG取り込みパイプラインの全体設計（Extract→Chunk→Embed→pgvector）

- **概要**: レイヤー分離（ADR 0001）、S3上の `chunks/*.jsonl` を「再実行できる正本」とする思想、ローカル（Ollama+Docker）→AWS（Fargate+Lambda+SQS+Bedrock）の2段構成。シリーズの導入記事に最適。
- **コード**: `workers/` 全体、READMEのMermaid図
- **図案**: パイプライン+ストレージ+チャットの3層図（README流用可）

### B-2. チャンク戦略 — 「AIを使わない」という設計判断

- **概要**: ヒューリスティック（文字数+句点+見出し境界）/ semantic chunking / LLM判定の3択から、決定性・再現性・コストを理由にヒューリスティックを採用。ただし `Chunker` ABC で将来差し替え可能に。「LLMは評価役として先に使う」という見直しトリガの整理も良いネタ。
- **コード**: `workers/chunk/`、ADR 0007
- **図案**: 3方式のコスト/品質トレードオフ図

### B-3. 開発/本番の実装差し替えアーキテクチャ（Embedder / ChatClient / VectorStore 抽象）

- **概要**: 「生成専用サーバーのAPIを呼ぶ」構造を開発（Ollama）と本番（Bedrock）で揃え、ABC実装の差し替えだけで移行。`embed_model` カラムでベクトルのモデル系譜を管理し、再埋め込み前提の設計。koto-log A-5 と対比できる。
- **コード**: `workers/embed/base.py` / `pipeline.py`（`make_embedder`）、`workers/chat/base.py`、ADR 0005/0006
- **図案**: dev/prod の差し替えポイント図

### B-4. RAG精度改善の実装 — Rerank / Hybrid RRF / HyDE / Citation / スコア閾値 / 隣接チャンク展開

- **概要**: 6手法を環境変数フラグで個別制御。**適用順序の理由**（スコア閾値はRRF融合前・Rerank前でないと尺度の異なるスコアを比較してしまう）が特に記事映えする。0件時はLLMを呼ばず即答して幻覚を防ぐ設計も。手法ごとに分割すれば3〜6記事に拡張可能。
- **コード**: `webui/server.py` の `_retrieve`、`workers/rerank/`、ADR 0013
- **図案**: 検索フローのパイプライン図（フラグON/OFF分岐つき）

### B-5. RAG検索の評価基盤 — hit@k / MRR とキーワードプロキシ

- **概要**: 人手ラベルなしで即計測できる「期待キーワード包含」プロキシrelevance、CIで回せる著作権フリーfixture、`--compare` による4条件一括比較（env上書き+importlib.reload）。RAGAS等を却下した判断も含めて。
- **コード**: `scripts/eval_search.py`、`tests/fixtures/eval_queries.json`、ADR 0014
- **図案**: 評価ループ（改善→計測→比較）の図

### B-6. SSEストリーミングチャットとRAGプロンプト構築

- **概要**: 検索結果を番号付きcontextに整形→システムプロンプトで引用指示→Ollamaへストリーミング→SSEでブラウザへ。`AsyncIterator` ベースの ChatClient 抽象含む。
- **コード**: `webui/server.py`、`workers/chat/ollama_chat.py`
- **図案**: ブラウザ〜LLM間のストリーミングシーケンス図

### B-7. ベクトルデータの整合性 — 原子的再取り込みと冪等upsert

- **概要**: 既存チャンク削除と新規投入を同一トランザクションで行う `embed_and_store_atomic`（中間状態を防ぐ）、upsertによる再実行安全性。地味だがAIパイプライン運用の実務ネタ。
- **コード**: `workers/embed/pipeline.py`、`pgvector_store.py`

---

## C. 横断テーマ（2プロジェクト比較記事）

### C-1. 共通する設計思想 — 「AIに任せる範囲を最小化し、差し替え可能にする」

- koto-log の責務分離（A-1）と biblio-rag のAI不使用チャンク判断（B-2）、両者の抽象化レイヤー（A-5/B-3）、評価の分離（A-7/B-5）を貫く思想を総括。シリーズの締め記事に。

---

## シリーズ構成の一案

1. 導入: C-1（思想）または B-1（全体像）
2. エージェント編: A-1 → A-2 → A-3 → A-4 → A-5 → A-6 → A-7
3. RAG編: B-1 → B-2 → B-3 → B-4（分割可）→ B-5 → B-6 → B-7
4. 締め: C-1

計 12〜18 記事。特に単体で強いのは **A-1（責務分離）**、**B-4（精度改善の適用順序）**、**A-6（可観測性）**。
