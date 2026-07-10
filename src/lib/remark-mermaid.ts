import type { Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * ```mermaid コードブロックを <pre class="mermaid"> に変換する remark プラグイン。
 * 実際のSVG化はクライアント側（blog/[...id].astro のスクリプト）で行う。
 * CDNは使わずnpmでバージョン固定した mermaid をバンドルする（サプライチェーン対策）。
 */
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node) => {
      if (node.lang !== "mermaid") return;
      const escaped = node.value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      // code ノードを html ノードへ置換（型上は別ノードなので Object.assign で変異させる）
      Object.assign(node, {
        type: "html",
        value: `<pre class="mermaid">${escaped}</pre>`,
      });
    });
  };
}
