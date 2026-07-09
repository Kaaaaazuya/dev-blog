// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { visit } from "unist-util-visit";
import { unified } from "@astrojs/markdown-remark";

/**
 * ```mermaid コードブロックを <pre class="mermaid"> に変換する remark プラグイン。
 * 実際のSVG化はクライアント側（blog/[...id].astro のスクリプト）で行う。
 * CDNは使わずnpmでバージョン固定した mermaid をバンドルする（サプライチェーン対策）。
 */
function remarkMermaid() {
  /** @param {import('mdast').Root} tree */
  return (tree) => {
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

export default defineConfig({
  site: "https://kinakomochio.yk3kzy.workers.dev", // 暫定。独自ドメイン取得後に kinakomochio.dev へ変更
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkMermaid] }),
  },
});
