import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import siteConfig from "../data/site-config.ts"
import {
  sortItemsByDateDesc,
  getPostExcerpt,
  postURL,
} from "../utils/data-utils.ts"

export async function GET(context) {
  const posts = (await getCollection("posts")).sort(sortItemsByDateDesc)
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: posts.map((item) => ({
      title: item.data.title,
      description: getPostExcerpt(item),
      link: postURL(item).url,
      pubDate: item.data.date,
    })),
  })
}
