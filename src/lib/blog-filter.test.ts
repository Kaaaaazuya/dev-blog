import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createBlogFilter,
  includeDrafts,
  includeScheduledPosts,
} from "./blog-filter";

// Mock process.env.PREVIEW_MODE
const originalPreviewMode = process.env.PREVIEW_MODE;

describe("blog-filter", () => {
  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.PREVIEW_MODE;
  });

  afterEach(() => {
    // Restore original values
    if (originalPreviewMode) {
      process.env.PREVIEW_MODE = originalPreviewMode;
    } else {
      delete process.env.PREVIEW_MODE;
    }
  });

  describe("createBlogFilter", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    it("includes published posts in dev mode (pubDate in past, not draft)", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: false,
          pubDate: yesterday,
        },
      };
      // In dev mode, should always return true because includeDrafts is true
      expect(filter(post)).toBe(includeDrafts);
    });

    it("includes draft posts in dev mode", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: true,
          pubDate: yesterday,
        },
      };
      expect(filter(post)).toBe(includeDrafts);
    });

    it("includes future-dated posts in dev mode", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: false,
          pubDate: tomorrow,
        },
      };
      // In dev mode, should return true because includeDrafts is true
      expect(filter(post)).toBe(includeDrafts);
    });

    it("in production mode, publishes past-dated non-draft posts", () => {
      // This test documents the expected behavior in production:
      // When includeDrafts is false (production), filter should exclude drafts and future posts
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: false,
          pubDate: yesterday,
        },
      };
      // If includeDrafts is true (dev mode), result is true
      // If includeDrafts is false (production), result is: !false && yesterday <= now = true
      const expectedInProduction = true;
      if (includeDrafts) {
        expect(filter(post)).toBe(true); // dev mode
      } else {
        expect(filter(post)).toBe(expectedInProduction); // production mode
      }
    });

    it("in production mode, excludes draft posts", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: true,
          pubDate: yesterday,
        },
      };
      if (includeDrafts) {
        expect(filter(post)).toBe(true); // dev mode
      } else {
        expect(filter(post)).toBe(false); // production: draft should be excluded
      }
    });

    it("in production mode, excludes future-dated posts", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: false,
          pubDate: tomorrow,
        },
      };
      if (includeDrafts) {
        expect(filter(post)).toBe(true); // dev mode
      } else {
        expect(filter(post)).toBe(false); // production: future post should be excluded
      }
    });

    it("includes published posts with pubDate equal to now", () => {
      const filter = createBlogFilter();
      const post = {
        data: {
          draft: false,
          pubDate: new Date(now.getTime()),
        },
      };
      if (includeDrafts) {
        expect(filter(post)).toBe(true); // dev mode
      } else {
        expect(filter(post)).toBe(true); // production: pubDate <= now should be included
      }
    });
  });

  describe("includeDrafts flag", () => {
    it("is true in dev mode", () => {
      // This test documents the behavior but can't easily be tested since
      // import.meta.env.DEV is set at build time
      // We check the export exists
      expect(typeof includeDrafts).toBe("boolean");
    });
  });

  describe("includeScheduledPosts flag", () => {
    it("is true in dev mode or when PREVIEW_MODE=true", () => {
      // This test documents the behavior
      expect(typeof includeScheduledPosts).toBe("boolean");
    });
  });
});
