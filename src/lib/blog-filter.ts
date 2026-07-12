/**
 * draft記事を表示するかどうか。
 * - 本番ビルド（タグpush経由）: draft除外
 * - devプレビュー（pnpm dev）: draftも表示
 * - PRプレビュービルド（PREVIEW_MODE=true）: draftも表示
 */
export const includeDrafts =
  import.meta.env.DEV || process.env.PREVIEW_MODE === "true";
