import { type CollectionEntry } from "astro:content"
import { slugify } from "./common-utils"
import utc from "dayjs/plugin/utc"
import dayjs from "dayjs"
import { Marked } from "marked"
import path from "node:path"

dayjs.extend(utc)

type Post = CollectionEntry<"posts">

export function postURL(post: Post) {
  const d = dayjs(post.data.date).utcOffset(8)
  const year = d.format("YYYY")
  const month = d.format("MM")
  const day = d.format("DD")
  return {
    year,
    month,
    day,
    url: `/${year}/${month}/${day}/${post.slug}/`,
  }
}

export function filterPosts(post: Post) {
  return import.meta.env.PROD ? post.data.draft !== true : true
}

export function sortItemsByDateDesc(itemA: Post, itemB: Post) {
  return dayjs(itemB.data.date).valueOf() - dayjs(itemA.data.date).valueOf()
}

export function getAllTags(posts: Post[]) {
  const tags: string[] = [
    ...new Set(posts.flatMap((post) => post.data.tags || []).filter(Boolean)),
  ]
  return tags
    .map((tag) => {
      return {
        name: tag,
        slug: slugify(tag),
      }
    })
    .filter((obj, pos, arr) => {
      return arr.map((mapObj) => mapObj.slug).indexOf(obj.slug) === pos
    })
}

export function getPostsByTag(posts: Post[], tagSlug: string) {
  const filteredPosts: Post[] = posts.filter((post) =>
    (post.data.tags || []).map((tag) => slugify(tag)).includes(tagSlug)
  )
  return filteredPosts
}

const MORE = "<!--more-->"

// return excerpt html
export function getPostExcerpt(post: Post): string {
  function customImagePathRenderer(
    href: string,
    title: string | null,
    text: string
  ) {
    const newHref = href.startsWith("./")
      ? path.join("src/content/posts/" + post.slug, href)
      : href
    return `<img src="${newHref}" alt="${text}" title="${title}" />`
  }
  const marked = new Marked()
  marked.use({
    renderer: {
      image: customImagePathRenderer,
    },
  })
  let idx = post.body.indexOf("<!--more-->")
  if (idx === -1) {
    idx = post.body.indexOf("{/* more */}")
  }
  const excerptMarkdown = post.body.slice(0, idx)
  const r = post.render()
  const html = marked.parse(excerptMarkdown) as string
  //   console.log('html', markdownToHtml(excerptMarkdown))
  return html
}
