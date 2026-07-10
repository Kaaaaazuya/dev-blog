import { z } from "astro/zod";

/** blog コレクションの frontmatter スキーマ（content.config.ts から参照） */
export const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  series: z.string().optional(), // 例: "ai-architecture"
  draft: z.boolean().default(false),
});
