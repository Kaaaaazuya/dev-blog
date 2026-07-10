import { describe, it, expect } from "vitest";
import { blogSchema } from "./blog-schema";

describe("blogSchema", () => {
  // Test 1: Full valid object with all properties
  it("parses a full valid object with all properties", () => {
    const input = {
      title: "Test Post",
      description: "A test description",
      pubDate: new Date("2026-07-10"),
      updatedDate: new Date("2026-07-11"),
      tags: ["a"],
      series: "test-series",
      draft: true,
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Post");
      expect(result.data.description).toBe("A test description");
      expect(result.data.pubDate).toEqual(new Date("2026-07-10"));
      expect(result.data.updatedDate).toEqual(new Date("2026-07-11"));
      expect(result.data.tags).toEqual(["a"]);
      expect(result.data.series).toBe("test-series");
      expect(result.data.draft).toBe(true);
    }
  });

  // Test 2: Minimal object with required fields only
  it("parses a minimal object with required fields only", () => {
    const input = {
      title: "Minimal Post",
      description: "Minimal description",
      pubDate: new Date("2026-07-10"),
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.draft).toBe(false);
    }
  });

  // Test 3: pubDate as string "2026-07-10" should be coerced to Date
  it("coerces pubDate from string to Date instance", () => {
    const input = {
      title: "String Date Post",
      description: "String date test",
      pubDate: "2026-07-10",
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pubDate).toBeInstanceOf(Date);
      expect(result.data.pubDate).toEqual(new Date("2026-07-10"));
    }
  });

  // Test 4: pubDate as "not-a-date" should fail
  it("fails when pubDate is an invalid date string", () => {
    const input = {
      title: "Invalid Date Post",
      description: "Invalid date test",
      pubDate: "not-a-date",
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Test 4.5: updatedDate as "not-a-date" should fail
  it("fails when updatedDate is an invalid date string", () => {
    const input = {
      title: "Invalid Updated Date Post",
      description: "Invalid updated date test",
      pubDate: new Date("2026-07-10"),
      updatedDate: "not-a-date",
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Test 5: Missing title should fail
  it("fails when title is missing", () => {
    const input = {
      description: "Missing title test",
      pubDate: new Date("2026-07-10"),
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Test 6: tags as [1] (non-string) should fail
  it("fails when tags contains non-string values", () => {
    const input = {
      title: "Invalid Tags Post",
      description: "Invalid tags test",
      pubDate: new Date("2026-07-10"),
      tags: [1],
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Test 7: updatedDate omitted but otherwise valid
  it("parses successfully when updatedDate is omitted", () => {
    const input = {
      title: "No Updated Date Post",
      description: "No updated date test",
      pubDate: new Date("2026-07-10"),
      tags: ["test"],
      draft: false,
    };
    const result = blogSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updatedDate).toBeUndefined();
    }
  });
});
