import { defineCollection, z } from 'astro:content'

const seoSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(15).max(160).optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().optional(),
    })
    .optional(),
  pageType: z.enum(['website', 'article']).default('website'),
})

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    cover: z.string().optional(),
    // rfc3339
    createdDate: z.coerce.date().optional(),
    // publish data, rfc3339
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    updatedDate: z.coerce.date().optional(),
    // isFeatured: z.boolean().default(false),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    seo: seoSchema.optional(),
  }),
})

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    seo: seoSchema.optional(),
  }),
})

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // isFeatured: z.boolean().default(false),
    seo: seoSchema.optional(),
  }),
})

export const collections = { posts, pages, projects }
