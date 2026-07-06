// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

/**
 * ```mermaid コードブロックを <pre class="mermaid"> に変換する remark プラグイン。
 * 実際のSVG化はクライアント側（blog/[...id].astro のスクリプト）で行う。
 * CDNは使わずnpmでバージョン固定した mermaid をバンドルする（サプライチェーン対策）。
 */
function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang !== 'mermaid') return;
      const escaped = node.value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
      node.type = 'html';
      node.value = `<pre class="mermaid">${escaped}</pre>`;
    });
  };
}

export default defineConfig({
  site: 'https://kinakomochio.dev', // 仮ドメイン。正式取得後に確定
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
});
