---
name: write-draft
description: ブログ記事のドラフトを執筆規約に沿って生成する。ユーザーが「記事を書いて」「第N回を執筆」「ai-arch-XXを書いて」などと依頼したときに使う。題材リポジトリの実コードを収集し、テンプレートに流し込み、品質ゲートを通してdraftコミットまで行う。
---

# write-draft — 記事ドラフト生成

## 前提知識（毎回読むこと）

1. `docs/writing-guide.md` — 執筆規約とシリーズ計画（slug・タイトル・元ネタ対応表）
2. `docs/article-ideas.md` — 各テーマの概要・該当コード・図案
3. `templates/article-template.md` — 記事の骨格
4. `templates/outline-agent.md` / `templates/outline-rag.md` — 編別の見出し例

## 前提ツール

- pre-commit フックが `gitleaks git --staged` を実行する。環境に gitleaks が無い場合は先に導入する（apt版は `git` サブコマンド非対応のことがあるため、`go install github.com/zricethezav/gitleaks/v8@latest` が確実）。`--no-verify` での回避はしない

## 手順

### 1. 素材収集（記事を書く前に必ず）

- 題材リポジトリ（koto-log / biblio-rag）を shallow clone する
- `git rev-parse HEAD` でコミットSHAを控える（パーマリンク用）
- article-ideas.md の「該当コード」に挙がったファイルと関連ADRを**実際に読む**。記憶や推測でコードを書かない
- 引用するファイルは断片でなく**全体**を読む。記事の主張を補強・限定する周辺要素（例: スキーマと併用されるシステムプロンプト）があれば、隠さず記事で言及する
- 引用するコード片と実物が一致していることを確認する

### 2. 執筆

- `templates/article-template.md` をコピーして `src/content/blog/<slug>.md` を作成（slugはシリーズ計画表に従う）
- frontmatter: `draft: true`、`description` 必須（検索スニペットで切れないよう120〜160字に収める）、`pubDate` は執筆日
- 記事の主要キーワード（タイトルの中心語）をh2見出しの少なくとも1つに含める
- 見出し構成は outline-*.md の該当例をベースにする
- 必須要素: 全体像のmermaid図1枚以上（コードより先）/ 「設計判断とトレードオフ」に採用しなかった案と理由 / 前回記事への相対リンク（`/blog/<slug>/`）/ まとめ末尾に次回予告
- mermaid図の分岐・矢印は、本文で説明する制御フローと1対1で一致させる。実装に存在する分岐（例: フォールバック経路）を図だけ省略しない
- コード引用: コミットSHA付きGitHubパーマリンク、1ブロック40行以内、1行目にファイルパスコメント
- ファイルパスコメントとパーマリンクは、**そのコードが実際に定義されているファイル**を指すこと。似た役割の別ファイルと取り違えない
- 40行に収めるための刈り込みは「記事の主張の根拠になる行を残し、主張と無関係な行を略す」が基準。例:「schemaのdescriptionがプロンプトとして働く」と主張する記事でdescription行を略すのは本末転倒
- 分量: 本文4,000〜8,000字（タグ除去後の概算で確認する）
- textlintエラーは原則**文の書き直し**で解消する。`textlint-disable` コメントでの回避は、書き直しでは不自然になる場合の最終手段に限る

### 3. 検証（省略しない）

- `pnpm format` → `pnpm lint` → `pnpm textlint` → `pnpm typecheck` → `pnpm build` がすべて通ること
- 本番ビルドにdraft記事が**含まれない**こと、mermaidブロックが `<pre class="mermaid">` に変換されることを確認（draftを一時的にfalseにした検証用コピーで行う。検証後はコピーを削除）
- ブラウザを開けない環境では、`pnpm dev` での目視確認の代わりに検証用コピーの `dist` HTML出力を検査する（mermaid変換・シンタックスハイライト・内部リンクの存在を grep で確認）
- コード引用の最終照合: 引用内容だけでなく、ファイルパスコメント・パーマリンクのリンク先に該当コードが実在することを1ブロックずつ確認する
- writing-guide.md の公開前チェックリストを全項目確認する

### 4. コミット

- 記事ファイルのみを `post: <slug> <タイトル> (draft)` でコミット
- 公開（draft: false化）は人間のレビュー後。スキルは行わない

## してはいけないこと

- 実在しないコード・ファイルパス・挙動を書く（必ず実物を読む）
- mainブランチ直リンク（コミットSHA必須）
- `draft: false` での勝手な公開
