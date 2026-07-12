/**
 * draft記事を表示するかどうか。
 * - 本番ビルド（タグpush経由）: draft除外
 * - devプレビュー（pnpm dev）: draftも表示
 * - PRプレビュービルド（PREVIEW_MODE=true）: draftも表示
 */
export const includeDrafts =
  import.meta.env.DEV ||
  (typeof process !== "undefined" && process.env.PREVIEW_MODE === "true");

/**
 * 未来日付の記事を表示するかどうか。
 * - 本番ビルド（タグpush経由）: 未来日付は除外
 * - devプレビュー（pnpm dev）: 未来日付も表示
 * - PRプレビュービルド（PREVIEW_MODE=true）: 未来日付も表示
 */
export const includeScheduledPosts =
  import.meta.env.DEV ||
  (typeof process !== "undefined" && process.env.PREVIEW_MODE === "true");

/**
 * 記事をフィルタリングするための述語関数を作成する。
 * 本番ビルドではdraftと未来日付を除外、dev/PRプレビューではすべて表示。
 */
export function createBlogFilter() {
  return ({ data }: { data: { draft: boolean; pubDate: Date } }) => {
    // dev/プレビューモードではすべて表示
    if (includeDrafts) {
      return true;
    }
    // 本番モード: draftと未来日付を除外
    return !data.draft && data.pubDate <= new Date();
  };
}
