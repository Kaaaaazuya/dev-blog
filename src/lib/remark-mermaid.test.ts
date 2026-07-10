import { describe, it, expect } from "vitest";
import type { Root, Code, Html } from "mdast";
import { remarkMermaid } from "./remark-mermaid";

describe("remarkMermaid", () => {
  it("converts mermaid code block to html pre with mermaid class", () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "mermaid", value: "graph TD" }],
    };
    remarkMermaid()(tree);
    const node = tree.children[0] as Html;
    expect(node.type).toBe("html");
    expect(node.value).toBe('<pre class="mermaid">graph TD</pre>');
  });

  it("escapes HTML entities in mermaid code", () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "mermaid", value: "A-->B & <x>" }],
    };
    remarkMermaid()(tree);
    const node = tree.children[0] as Html;
    expect(node.type).toBe("html");
    expect(node.value).toBe(
      '<pre class="mermaid">A--&gt;B &amp; &lt;x&gt;</pre>',
    );
  });

  it("leaves non-mermaid code blocks unchanged", () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: "js", value: "const x = 1" }],
    };
    remarkMermaid()(tree);
    const node = tree.children[0] as Code;
    expect(node.type).toBe("code");
    expect(node.value).toBe("const x = 1");
  });

  it("leaves code blocks with no language specified unchanged", () => {
    const tree: Root = {
      type: "root",
      children: [{ type: "code", lang: null, value: "some code" }],
    };
    remarkMermaid()(tree);
    const node = tree.children[0] as Code;
    expect(node.type).toBe("code");
  });

  it("converts multiple mermaid code blocks in the same tree", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "code", lang: "mermaid", value: "graph TD" },
        { type: "code", lang: "mermaid", value: "sequenceDiagram" },
      ],
    };
    remarkMermaid()(tree);
    const node1 = tree.children[0] as Html;
    const node2 = tree.children[1] as Html;
    expect(node1.type).toBe("html");
    expect(node1.value).toBe('<pre class="mermaid">graph TD</pre>');
    expect(node2.type).toBe("html");
    expect(node2.value).toBe('<pre class="mermaid">sequenceDiagram</pre>');
  });
});
