import type { CollectionEntry } from "astro:content";

export interface SeriesNav {
  prev?: CollectionEntry<"blog">;
  next?: CollectionEntry<"blog">;
}

export interface RelatedPosts {
  posts: Array<CollectionEntry<"blog"> & { score: number }>;
}

/**
 * Get previous and next posts in the same series based on pubDate
 */
export function getSeriesNavigation(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
): SeriesNav {
  if (!currentPost.data.series) {
    return {};
  }

  // Filter posts in the same series and sort by pubDate
  const seriesPosts = allPosts
    .filter((post) => post.data.series === currentPost.data.series)
    .sort((a, b) => a.data.pubDate.getTime() - b.data.pubDate.getTime());

  const currentIndex = seriesPosts.findIndex(
    (post) => post.id === currentPost.id,
  );
  if (currentIndex === -1) {
    return {};
  }

  const prev = currentIndex > 0 ? seriesPosts[currentIndex - 1] : undefined;
  const next =
    currentIndex < seriesPosts.length - 1
      ? seriesPosts[currentIndex + 1]
      : undefined;

  return { prev, next };
}

/**
 * Get related posts based on tag overlap
 * Scores posts by number of matching tags, returns top N with score > 0
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
  limit: number = 3,
): RelatedPosts {
  if (currentPost.data.tags.length === 0) {
    return { posts: [] };
  }

  const currentTags = new Set(currentPost.data.tags);
  const scoredPosts = allPosts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      // Count matching tags
      const score = post.data.tags.filter((tag) => currentTags.has(tag)).length;
      return { ...post, score };
    })
    .filter((post) => post.score > 0)
    .sort((a, b) => {
      // Sort by score descending, then by pubDate descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.data.pubDate.getTime() - a.data.pubDate.getTime();
    })
    .slice(0, limit);

  return { posts: scoredPosts };
}
