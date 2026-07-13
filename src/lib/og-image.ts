import fs from "node:fs";
import { createRequire } from "node:module";

// import.meta.urlからの相対パス解決だとビルド時にファイルがdist配下へ移動して壊れるため、
// Node解決（node_modulesを遡って探す）が効くcreateRequireを使う。
const require = createRequire(import.meta.url);

function loadFont(file: string) {
  return fs.readFileSync(
    require.resolve(`@fontsource/ibm-plex-sans-jp/files/${file}`),
  );
}

const FONT_FAMILY = "IBM Plex Sans JP";

// 日本語タイトルには漢字・かな(japanese) + 英数字(latin) + 全角記号など(latin-ext) の
// 3サブセットが必要。satoriは同名フォントを複数登録すると欠けたグリフを次の候補で補う。
let cachedFonts: ReturnType<typeof loadOgImageFonts> | null = null;

function loadOgImageFonts() {
  return [
    {
      name: FONT_FAMILY,
      weight: 700 as const,
      style: "normal" as const,
      data: loadFont("ibm-plex-sans-jp-japanese-700-normal.woff"),
    },
    {
      name: FONT_FAMILY,
      weight: 700 as const,
      style: "normal" as const,
      data: loadFont("ibm-plex-sans-jp-latin-700-normal.woff"),
    },
    {
      name: FONT_FAMILY,
      weight: 700 as const,
      style: "normal" as const,
      data: loadFont("ibm-plex-sans-jp-latin-ext-700-normal.woff"),
    },
    {
      name: FONT_FAMILY,
      weight: 400 as const,
      style: "normal" as const,
      data: loadFont("ibm-plex-sans-jp-japanese-400-normal.woff"),
    },
    {
      name: FONT_FAMILY,
      weight: 400 as const,
      style: "normal" as const,
      data: loadFont("ibm-plex-sans-jp-latin-400-normal.woff"),
    },
  ];
}

// モジュール読み込み時ではなく初回呼び出し時にフォントファイルを読み込み、以降はキャッシュを返す
export function getOgImageFonts() {
  if (!cachedFonts) {
    cachedFonts = loadOgImageFonts();
  }
  return cachedFonts;
}

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// global.cssのライトテーマトークンと同値（OG画像は閲覧側テーマに関わらず固定表示のため）
const COLORS = {
  bg: "#f4f6f4",
  fg: "#171c1a",
  accent: "#0e7c5a",
};

export function createOgImageTemplate({
  title,
  series,
}: {
  title: string;
  series?: string;
}) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        backgroundColor: COLORS.bg,
        fontFamily: FONT_FAMILY,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.fg,
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: COLORS.accent,
                  },
                },
              },
              { type: "span", props: { children: "~/kinakomochio.dev" } },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            },
            children: [
              ...(series
                ? [
                    {
                      type: "span",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.accent,
                        },
                        children: series,
                      },
                    },
                  ]
                : []),
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 52,
                    fontWeight: 700,
                    lineHeight: 1.5,
                    color: COLORS.fg,
                  },
                  children: title,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
