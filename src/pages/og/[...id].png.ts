import { getCollection, type CollectionEntry } from "astro:content";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { includeDrafts } from "../../lib/blog-filter";
import {
  createOgImageTemplate,
  ogImageFonts,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from "../../lib/og-image";

export async function getStaticPaths() {
  const posts = await getCollection(
    "blog",
    ({ data }) => includeDrafts || !data.draft,
  );
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export async function GET({
  props,
}: {
  props: { post: CollectionEntry<"blog"> };
}) {
  const { post } = props;
  const svg = await satori(
    createOgImageTemplate({
      title: post.data.title,
      series: post.data.series,
    }),
    { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, fonts: ogImageFonts },
  );
  const png = new Resvg(svg).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
