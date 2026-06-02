import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const PHASE = z.enum(['discover', 'design', 'build', 'market', 'business']);
const LANG = z.enum(['zh', 'en']);

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    phase: PHASE,
    tags: z.array(z.string()).default([]),
    lang: LANG,
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    relatedResources: z.array(z.string()).default([]),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/resources' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    phase: PHASE,
    category: z.string(),
    tags: z.array(z.string()).default([]),
    lang: LANG,
    pricing: z.enum(['free', 'freemium', 'paid']),
    rating: z.number().min(0).max(5).optional(),
    featured: z.boolean().default(false),
    relatedArticles: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, resources };
