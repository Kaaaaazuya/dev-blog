// @ts-check
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // playground/ は Vite+ 検証用の独立プロジェクト（独自の pnpm install / vitest で完結）
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      "playground/**",
    ],
  },
});
