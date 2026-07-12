import { describe, it, expect } from "vitest";
import { createOgImageTemplate, ogImageFonts } from "./og-image";

describe("createOgImageTemplate", () => {
  it("includes the title text in the template tree", () => {
    const template = createOgImageTemplate({ title: "テストタイトル" });
    expect(JSON.stringify(template)).toContain("テストタイトル");
  });

  it("includes the series label when provided", () => {
    const template = createOgImageTemplate({
      title: "タイトル",
      series: "ai-architecture",
    });
    expect(JSON.stringify(template)).toContain("ai-architecture");
  });

  it("renders only the title block when series is not provided", () => {
    const template = createOgImageTemplate({ title: "タイトル" });
    const bodyChildren = template.props.children[1].props.children;
    expect(bodyChildren).toHaveLength(1);
  });
});

describe("ogImageFonts", () => {
  it("loads non-empty binary data for every registered subset", () => {
    expect(ogImageFonts.length).toBeGreaterThan(0);
    for (const font of ogImageFonts) {
      expect(font.data.byteLength).toBeGreaterThan(0);
    }
  });
});
