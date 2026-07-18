# AIプロダクト・アーキテクチャ解説ブログ 記事候補一覧

koto-log（LINE育児記録エージェント / Tool Use）と biblio-rag（日本語書籍RAGパイプライン）から抽出した、AIプロダクト特有のアーキテクチャ・設計テーマ。各項目が1記事以上の想定。

2026年7月改訂で **B-0（RAG入門ハブ）** と **D系（Claude Code開発実践編）** を追加。位置付けは [blog-strategy.md](blog-strategy.md) を参照。あわせて両リポジトリの再調査で A-8〜A-11 / B-8〜B-11 / D-7〜D-8 を追加し、未実装の学習ネタは **E系（未実装バックログ）** として管理する。ブログ自体のAI以外の技術ネタは **F系（ブログ自体編）** の第3シリーズとして管理する。同月、koto-logの実装をReAct/Plan-Execute/Reflection/Multi-Agent不採用/Context Engineeringの5パターンとして再解釈する **G系（エージェント設計パターン編）** を追加。

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

### A-8. 対象児の解決をLLMに任せない — 優先順位ルールによる曖昧性の確定

- **概要**: 複数児対応（P9.2）で「どの子の記録か」を、名前明示 → `users.current_child_id` → 既定児 の優先順で**アプリコードが確定**する設計。A-1（責務分離）の応用編。棄却されたADR-0005（子=LINEアカウント固定の案A/B）から「会話で対象児を解決する」方式へ転換した経緯も設計判断として書ける。
- **コード**: `agent/loop.py`、`db/crud.py`（resolve_child）、ADR-0005（棄却の記録）
- **図案**: 解決優先順位のフローチャート

### A-9. AIプロダクトにこそ「AIを迂回する経路」を作る

- **概要**: 2つの迂回路を1記事で。(1) 「操作一覧」「help」「？」はLLMを呼ばず定型文を即返答（コスト・レイテンシゼロ、`_HELP_COMMANDS`）。(2) 管理画面 `/admin/records` でAIを介さず記録を手動CRUD（誤抽出の確実な修正・取りこぼし入力の安全弁）。「AIの信頼性が不完全である前提のUX設計」として普遍的なテーマ。
- **コード**: `line/webhook.py`（`_HELP_COMMANDS`）、`line/admin.py`
- **図案**: 通常経路と2つの迂回路を並べたフロー図

### A-10. 定時Push通知とfan-out — AIプロダクトの定期ジョブ設計

- **概要**: 毎朝7時のカウントダウン+LLM一言、毎晩21時の日次サマリーを `notify_enabled` の全ユーザーへfan-out。スケジューラーをアプリ内蔵APSchedulerにした判断（ADR-0001: Render Cron / 外部keep-aliveとの比較）、記録なし日はスキップする制御など。
- **コード**: `line/scheduler.py`、`line/push.py`、ADR-0001
- **図案**: スケジューラー→LLM→Push配信のシーケンス図

### A-11. LLMの手前を固める — LINE webhookのセキュリティ実装

- **概要**: AIエージェントの入口・管理画面の防御。X-Line-Signature のHMAC-SHA256署名検証、管理画面のセッション認証・CSRF対策・セキュリティヘッダ。「LLM部分が注目されがちだが、周辺のWeb基本防御が先」という切り口。
- **コード**: `line/webhook.py`（`_verify_signature`）、`line/csrf.py`、`line/security_headers.py`
- **図案**: リクエストが通る防御レイヤーの図

---

## B. biblio-rag — RAGパイプライン編

### B-0. 「RAGとは」— 自作RAGの実物で理解する入門ハブ記事

- **概要**: 検索流入の入口となるハブ記事。RAG（Retrieval-Augmented Generation / 検索拡張生成）の概念を、一般論でなく **biblio-ragの実物パイプライン**（Extract→Chunk→Embed→検索→生成）を例に図解する。「なぜ素のLLMでは足りないのか」→「検索で根拠を渡す」→「実際の作りはこうなっている」の流れで、B-1〜B-7の各論記事へ内部リンクで誘導する。既存B-1（設計解説）とは役割が異なり、B-0は「概念の入口」、B-1は「設計の各論」。
- **コード**: 深追いしない。READMEのMermaid図と各論記事へのリンクが主役
- **図案**: RAGの一般概念図 + biblio-ragでの対応関係を並べた2段図
- **タイトル案**: 「RAGとは何か — 自作の書籍検索AIを例に仕組みを図解する」

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

### B-8. イベント駆動のRAG取り込み — SQS×Lambda連鎖でフェーズを疎結合にする

- **概要**: S3イベント通知をトリガーに extract / chunk / embed の3キュー+各DLQでLambdaを連鎖させる設計（ADR 0011）。SQS採用の理由とSNS / EventBridgeを却下した比較（ADR 0003）、可視性タイムアウトによる自動リトライ、LocalStackでのローカル再現。B-1の「ローカル直列」からの発展形として接続できる。
- **コード**: `workers/lambda_fns/`、ADR 0003 / 0011
- **図案**: S3→SQS→Lambda連鎖のイベントフロー図（DLQ含む）

### B-9. 個人開発AIプロダクトの「アイドル課金ゼロ」デプロイ構成

- **概要**: Aurora Serverless v2は0 ACUでも最低課金が発生する、という調査からベクトルDBだけNeon（5分無操作で自動サスペンド）に置き換え、他はBedrock + Lambda（Function URL + レスポンスストリーミング + Lambda Web Adapter）で構成した判断（ADR 0015）。埋め込みモデル変更（bge-m3→Titan V2）に伴う再埋め込み必須の話はB-3と接続。コスト実測値を出せれば非常に強い記事になる。
- **コード**: ADR 0015、`workers/embed/bedrock_embedder.py`
- **図案**: 構成図（課金が発生する箇所/しない箇所を色分け）

### B-10. RAGパイプラインのE2Eテスト2層戦略

- **概要**: パイプラインE2E（pytest、`-m e2e` で既定除外）とWebUI E2E（Playwright）の2層に分けた戦略（ADR 0010）。著作権フリーの公開fixtureで書籍本文をコミットしない工夫、インフラ未起動ならfailでなくskip、`book_id=e2e_*` での実データ隔離。A-7 / B-5（Evals）と合わせて「AIプロダクトのテストピラミッド」を構成する。
- **コード**: `tests/test_pipeline_e2e.py`、`tests/test_webui_e2e.py`、ADR 0010
- **図案**: テストピラミッド（unit / integration / E2E / Evals）

### B-11. 書籍アップロードの非同期UX — presigned URLと処理ステータスの永続化

- **概要**: ブラウザからpresigned URLでS3（MinIO）へ直接PUTし、extract→chunk→embedの進行を `StatusStore` でDBに永続化してUIへ返す。数分かかるAI処理を「待たせるUX」としてどう見せるかという、RAGに限らないAIプロダクト共通の実務テーマ。
- **コード**: `workers/upload.py`、`workers/storage/status_store.py`、`webui/server.py`
- **図案**: アップロード〜ステータス遷移のシーケンス図

---

## D. Claude Code開発実践編 — このブログ・自作プロダクトの開発現場

題材はまず**このブログのリポジトリ自体**（スキル・AIレビューCI・品質ゲートがすべて公開されており、パーマリンク引用できる）。koto-log / biblio-rag の開発実態は素材確認のうえで追加する。

### D-1. Claude Codeでブログを運営する全体像（定点観測記事）

- **概要**: 柱2の入口ハブ記事。「記事ネタIssue → write-draftスキルでドラフト生成 → 品質ゲート（lint/textlint/gitleaks）→ AIレビューCI → 人間レビュー → 自動デプロイ」の全体フローを図解する。タイトルに「2026年◯月現在」と時点を明記し、半年ごとに更新版を出す前提で書く。D-2/D-3/D-6への内部リンクのハブ。
- **コード**: `skills/write-draft/SKILL.md`、`.github/workflows/ci.yml`、`.github/workflows/ai-review.yml`、`.github/workflows/deploy.yml`、`docs/architecture.md` のフロー図
- **図案**: Issue→公開までのフローチャート（人間/Claude/CIの担当をレーン分け）

### D-2. 執筆ワークフローをスキルに固定化する — レビュー指摘を仕組みへ還元するループ

- **概要**: 口頭指示を `skills/write-draft/SKILL.md` に蓄積し、記事レビューで出た指摘（例: 引用コードの取り違え、mermaid図と本文の不一致）をスキル本文へ書き戻すことで「同じ指摘を二度受けない」ループを回している実態。実際のコミット履歴（レビュー結果をスキルに反映したコミット）を証拠として引用できる。
- **コード**: `skills/write-draft/SKILL.md` とその変更履歴
- **図案**: 執筆→レビュー→スキル反映のサイクル図

### D-3. claude-code-actionで記事を観点別AIレビューする

- **概要**: 記事追加PRに対し、炎上リスク / 情報漏洩 / SEO の3観点をプロンプトファイルに分割してレビューさせるCI。観点を分けた理由（1プロンプト詰め込みは指摘が浅くなる）、non-blockingにした判断（最終判断は人間）、allowedToolsの絞り方まで。
- **コード**: `.github/workflows/ai-review.yml`、`.github/ai-review/prompts/*.md`
- **図案**: PR→3並列レビュー→人間判断のフロー図

### D-4. AIが書く前提の品質ゲート設計

- **概要**: 「AIの出力は必ず機械チェックで受け止める」という前提で組んだゲート群。pre-commit（lint-staged + gitleaks）、textlint + prh（表記ゆれ・日本語校正）、pre-push（typecheck）、CI（build + actionlint + 監査）。`--no-verify` 回避を禁じてスキル側にも明記している運用まで含める。
- **コード**: `package.json`（simple-git-hooks / lint-staged）、`.textlintrc.yml`、`prh.yml`、`.github/workflows/ci.yml`

### D-5. 自作プロダクト開発でのClaude Code活用実態（koto-log / biblio-rag）

- **概要**: CLAUDE.md・ADRの整備がエージェント開発にどう効いたか、計画→実装→検証の回し方、コンテキストに入れる/入れないの判断など。biblio-ragに素材が実在することを確認済み（CLAUDE.md、`.claude/hooks/`、allowlistスキル、ADR 0009）。詳細な各論はD-7 / D-8に分割。
- **コード**: biblio-rag `CLAUDE.md`、`.claude/`、koto-logは要素材確認

### D-6. Claude Code運用でうまくいかなかったこと集

- **概要**: 試したが捨てた設定・スキル・フローを理由付きで列挙する失敗談記事。海外で人気の「Things That Didn't Work」形式。実体験の証明としてAI生成記事との最大の差別化になる。**素材が3件以上たまった時点で執筆**。日頃から `docs/` にメモを残す運用とセットで。
- **コード**: 各失敗の実コミット・実設定を引用

### D-7. Claude Codeのフックは最小2つ — チェックはpre-commitと/code-reviewに集約する判断

- **概要**: biblio-ragのADR 0009がそのまま骨子になる。サブエージェントの自動委譲は「必ず走る」保証がない、という観察から、決定的ゲート（pre-commit: gitleaks / Ruff / ATR）と明示的レビュー（`/code-review`）に責務を二分し、フックはruff自動整形とデスクトップ通知の2つだけに絞った。security-auditorサブエージェントを不採用にした理由も含め「流行りの機能を全部入れない」判断の記事。
- **コード**: biblio-rag ADR 0009、`.claude/settings.json`、`.claude/hooks/ruff-format.sh`
- **図案**: 決定的ゲート層と明示的レビュー層の2層図

### D-8. AIエージェント時代のセキュリティゲート — ATRによるスキル改ざん検知と誤検知管理

- **概要**: pre-commitでATRのJSON出力を評価し、high以上の脅威でコミットをブロックする自作ゲート（`atr_gate.py`）。誤検知は `<パス接尾辞>:<rule_id>` 単位で限定抑制し、他ファイルでの検知は生かす設計。「スキル・フック自体が攻撃面になる」というエージェント開発特有の論点で、時事性が高い。
- **コード**: biblio-rag `scripts/atr_gate.py`、`docs/atr.md`
- **図案**: コミット→ATRスキャン→ゲート判定のフロー図

---

## F. ブログ自体編 — このブログの構築・運営（AI以外の技術ネタ）

題材はこのリポジトリ。柱1・2（RAG / Claude Code実践）とは別の第3シリーズとして、軽量記事枠（TIL）も活用しながら単発で出せる。D系（Claude Code視点）と素材が重なるものは相互リンクで接続し、記事の切り口は分ける（F系は「仕組みそのものの作り方」、D系は「AIと開発する視点」）。

### F-1. pnpmで固めるサプライチェーン対策 — ビルドスクリプト既定ブロックとminimumReleaseAge

- **概要**: npm供給網攻撃への防御として、依存のinstall/postinstallスクリプトを既定で全ブロックし必要な3つ（esbuild / sharp / workerd）だけ許可、公開24時間未満のバージョンを入れない `minimumReleaseAge: 1440`、simple-git-hooksのpostinstallを止めてprepareで明示登録、という構成。設定ファイル1枚で完結し、時事性が高く汎用性も高い。
- **コード**: `pnpm-workspace.yaml`（コメント付きで判断理由が書いてある）、`package.json`（prepare）
- **図案**: install時に何がブロックされるかのフロー図

### F-2. textlint + prhで作る日本語技術記事の校正パイプライン

- **概要**: `preset-ja-technical-writing` 導入と、実運用で無効化した2ルールの判断（「？」を使う記事様式のため `no-exclamation-question-mark` オフ等）、prhでの表記ゆれ統一（サーバ→サーバー）。「ルールを全部有効にしない」運用判断が核。実行はpre-commit（lint-staged）には入れずCIと手動 `pnpm textlint` のみ、という配置の判断も書ける。
- **コード**: `.textlintrc.yml`（無効化理由がコメントに）、`prh.yml`、`package.json`、`.github/workflows/ci.yml`
- **図案**: 執筆→lint-staged→textlintの流れ図

### F-3. Astro + Cloudflare Workers静的配信とタグ駆動デプロイ

- **概要**: 旧Pagesではなく Workers の静的アセット配信（`wrangler.toml` の `[assets]`）を選んだ構成と、mainへのpushではデプロイせず `v*` タグでのみ発火させる運用（記事mergeと公開タイミングの分離）。sitemap・OGPなどブログ基盤の基本もここに含められる。
- **コード**: `.github/workflows/deploy.yml`、`wrangler.toml`、`astro.config.mjs`
- **図案**: merge→タグ→デプロイのフロー図

### F-4. remarkプラグインを自作してmermaidをクライアントレンダリングする

- **概要**: mermaidコードブロックを `<pre class="mermaid">` に変換する自作remarkプラグイン。ビルド時SVG化との比較（ビルド依存・テーマ切替）、Astroの `markdown.processor` への組み込み、vitestでの変換テストまで。
- **コード**: `src/lib/remark-mermaid.ts`、`src/lib/remark-mermaid.test.ts`、`astro.config.mjs`
- **図案**: Markdown→remark→HTML→クライアント描画の変換パイプライン図

### F-5. Markdownコンテンツをvitestでテストする

- **概要**: 「記事」という一見テストしにくい対象に対する、frontmatterスキーマ検証・remark変換のユニットテスト。レビュー指摘でテストの厳密性を強化した経緯（PR #39）も実体験として書ける。軽量記事枠向き。
- **コード**: `src/lib/blog-schema.test.ts`、`src/lib/remark-mermaid.test.ts`
- **図案**: 不要（コード中心の軽量記事）

### F-6. PRごとにCloudflare Workersプレビューを発行してコメントする

- **概要**: PRのopen/push時にdraft記事込みのプレビューをデプロイしてURLをPRにコメント、`concurrency` で連続pushの古い実行をキャンセル、close時にクリーンアップ。「レビュアーがブラウザで確認できる」執筆フローの要。process未定義環境でのReferenceError対策など実際に踏んだ修正も素材になる。
- **コード**: `.github/workflows/preview.yml`
- **図案**: PRイベント→プレビューデプロイ→コメントのシーケンス図

### F-7. 技術ブログのAdSense対応 — 審査前の下準備と広告スロット設計

- **概要**: `ADS_ENABLED` フラグで全体ON/OFFできる `AdSlot` コンポーネント、プライバシーポリシー・問い合わせ・運営者情報ページ、`ads.txt`。**審査結果が出た時点で「通った/落ちた実体験」を核に記事化する**（それまでは執筆保留）。
- **コード**: `src/components/AdSlot.astro`、`src/pages/privacy.astro`、`public/ads.txt`
- **図案**: 審査までの準備チェックリスト図

---

## E. 未実装バックログ — AIプロダクトに携わる上で理解しておくべき技術

**まだ実装していない**が、AIプロダクト開発者として押さえておくべき機能・技術のストック。本ブログの方針（実体験を核にする）に従い、**原則「実装してから記事化」**。実装した時点で該当プロダクトのA/B/D系へ昇格させる。優先度・実装先は着手時に見直す。

| #    | 技術                                                   | なぜ理解しておくべきか                                                                        | 実装先候補                                       |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| E-1  | プロンプトキャッシング                                 | システムプロンプト・ツール定義の再送コストを大幅削減できる。API課金構造の理解に直結           | koto-log（毎リクエスト同一のツール定義）         |
| E-2  | ガードレール / プロンプトインジェクション対策          | RAGは取り込み文書経由の間接インジェクションの入口になる。エージェントの安全設計の中心論点     | biblio-rag（文書経由）/ koto-log（ユーザー入力） |
| E-3  | LLM-as-a-Judge評価                                     | キーワードプロキシ（B-5）の次段階。判定者バイアス・評価の信頼性という論点ごと学べる           | biblio-rag（検索評価の高度化）                   |
| E-4  | Agentic RAG（検索計画・クエリ分解をLLMが行う）         | 固定パイプライン（B-4）との対比で「どこまでLLMに任せるか」の議論がA-1の思想とつながる         | biblio-rag                                       |
| E-5  | GraphRAG / 知識グラフ連携                              | チャンク検索で答えられない「横断質問」への解。ベクトル検索の限界を知る教材                    | biblio-rag                                       |
| E-6  | MCP（Model Context Protocol）                          | ツール定義の標準化。自作Tool Use（A系）をMCPサーバー化すると差分が体感できる                  | koto-log（ツールのMCP化）                        |
| E-7  | ストリーミングTool Use / 部分応答UX                    | 体感レイテンシ改善の定石。SSE（B-6）の発展形                                                  | koto-log（応答待ち改善）                         |
| E-8  | ファインチューニング / 蒸留                            | 小型モデルのツール選択精度改善（A-4の防御的設計の代替アプローチ）。コストと効果の判断軸を持つ | koto-log（ローカルモデル改善）                   |
| E-9  | ユーザーフィードバックループ（データフライホイール）   | 修正操作（「150に直して」）を評価・改善データに変換する仕組み。プロダクトが賢くなる構造の核心 | koto-log（修正ログ活用）                         |
| E-10 | 音声入力（STT）連携                                    | マルチモーダル入力の第一歩。「片手がふさがった育児中」という強いユースケースがある            | koto-log（LINE音声メッセージ）                   |
| E-11 | レジリエンス設計（リトライ / フォールバック / 多重化） | LLM APIの障害・レート制限は必ず起きる。プロバイダ抽象化（A-5）の実運用編                      | 両方                                             |
| E-12 | セマンティックキャッシュ                               | 同義クエリへの応答再利用によるコスト・レイテンシ削減。埋め込みの応用としても面白い            | biblio-rag                                       |

---

## C. 横断テーマ（2プロジェクト比較記事）

### C-1. 共通する設計思想 — 「AIに任せる範囲を最小化し、差し替え可能にする」

- koto-log の責務分離（A-1）と biblio-rag のAI不使用チャンク判断（B-2）、両者の抽象化レイヤー（A-5/B-3）、評価の分離（A-7/B-5）を貫く思想を総括。シリーズの締め記事に。

---

## G. エージェント設計パターン編 — koto-logの実装をパターンとして学び直す

方針: koto-log の実装を題材に「パターンを実地で学んだ記録」として書く。抽象論より before/after のコード・eval 数値を載せる。A系（実装各論）と内容が重なる場合はA系記事からのリンクで接続する。

### G-1. 「気づいたらReActだった」— Tool Useループを明示的なReActに書き直す

- **概要**: ReAct（Reason → Act → Observe の反復・事前計画なし）の基礎を、koto-log の現行 Tool Use ループの再解釈という入りやすい切り口で説明する。thought を構造化ログとして残す実装に書き直すと、失敗分析が「検索不足 / 推論誤り / ツール誤用」に分類できるようになる副産物も含める。パターン名を知ることで設計判断に言葉を持てる、という締め。
- **コード**: `agent/loop.py`（現行実装と、thoughtログ構造化後の実装）
- **執筆タイミング**: Epic A 完了後

### G-2. Plan-Execute入門 — 週次レポートエージェントをプランナー/エグゼキュータに分けた話

- **概要**: ReAct で定型バッチ（週次レポート）を作ると迷走・コスト非決定性が起きることを示し、対比としてプランを先にJSONで確定→順次/並列実行するPlan-Executeの構造を解説。プランの永続化と失敗時レジューム（Filesystem-as-Contextの実例）、ReAct版とPlan-Execute版のtokenコスト・レイテンシ比較。使い分け指針: 対話的タスク=ReAct / 定型バッチ=Plan-Execute。
- **執筆タイミング**: Epic C 完了後。eval数値が揃ってから。

### G-3. Reflectionは知能ではなくリスク低減 — 体温の誤読をどう防ぐか

- **概要**: 「間違えてはいけない」書き込み（体温計画像の誤読）という課題に対し、出力を別プロンプトで自己批評させるReflectionパターンを適用。抽出→妥当域チェック→再確認→域外はユーザー確認へフォールバック、という実装。誤読率のbefore/after計測と、どこまでLLMに検証させどこからルールベースにするかの考察。Vision×Reflectionの実践記事で、育児という題材の具体性が刺さる想定。
- **執筆タイミング**: Epic B 完了後

### G-4. Multi-Agentにしない、という設計判断（ADR公開）

- **概要**: 2026年に流行するMulti-Agentに対し、「Multi-Agentに見えるタスクの大半は良いReActで解ける」という実務知見を、koto-logの規模でのコスト・複雑性・デバッグ性の評価とともに示す。ADR本文と「凍結解除条件」（evalsでReActの限界が確認されたら）を公開し、個人開発における「採用しない技術」の記録価値を語る、根拠付きの逆張り記事。D-7（フックを最小2つにする判断）と同系統の「流行を全部入れない」思想として接続できる。
- **執筆タイミング**: Epic D-2 完了後。すぐ書ける。

### G-5（番外）. Context Engineering地図 — RAG・MCP・Skills・長文コンテキストは対立しない

- **概要**: 「RAG is dead」論のカテゴリエラーを指摘し、Anthropicのcontext engineeringの定義を紹介。静的/動的・知識/接続の4要素マッピングと、koto-logでの組み合わせ実例、判断チェックリストで締める概念整理系の記事。検索流入を狙えるテーマ。B-0（RAGとはハブ記事）と役割が近いため、B-0公開後に内部リンクで接続する。
- **執筆タイミング**: いつでも。ただし実例を持つG-1〜G-3の後の方が説得力が出る。

### G系 公開順の推奨

G-4（すぐ書ける・軽い）→ G-1 → G-3 → G-2 → G-5

週10時間制約とevals優先の開発順に合わせ、「実装完了 → その週のうちにブログ化」のサイクルを推奨。実装メモ（思考ログ・eval数値）をそのまま素材にできるよう、開発中から `docs/blog-notes/` にメモを残すと執筆コストが下がる。

---

## シリーズ構成の一案（2026年7月改訂）

**柱1: RAG**

1. 入口: B-0（RAGとは・ハブ）→ 各論への導線を張る
2. RAG編: B-1 → B-2 → B-3 → B-4（分割可）→ B-5 → B-6 → B-7
3. 発展編（運用・インフラ寄り）: B-8 → B-9 → B-10 → B-11
4. エージェント編（A系）はRAGチャットの土台・比較対象として随時挟む。A-8〜A-11はAIプロダクトの実務・周辺設計ネタとして単発でも出せる

**柱2: Claude Code開発実践**

1. 入口: D-1（全体像・定点観測）
2. 各論: D-2 → D-3 → D-4 → D-7 → D-8 →（素材確認後）D-5
3. 随時: D-6（失敗談。素材が3件たまったら）

**第3シリーズ: ブログ自体編（F系・柱ではない）**

- 順序に依存せず単発で出せる。更新頻度の維持（軽量記事枠）と、AIネタの合間の変化球として使う
- 時事性の高いF-1（pnpmサプライチェーン）とフロー系のF-6（PRプレビュー）が単体で強い

締め: C-1（2プロジェクトを貫く設計思想）

E系（未実装バックログ）は実装した時点でA/B/D系へ昇格させて記事化する。

計 35 記事超のストック。単体で強いのは **A-1（責務分離）**、**B-4（精度改善の適用順序）**、**A-6（可観測性）**、**D-1（Claude Code運営の全体像）**、**B-9（アイドル課金ゼロ構成）**、**G-4（Multi-Agent不採用のADR公開）**。優先順は [blog-strategy.md](blog-strategy.md) の「優先順位」を参照。
