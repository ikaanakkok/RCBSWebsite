import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const assetPath = z.string().refine(
  value => /^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value),
  'Use an /uploads/ path or an http(s) URL.',
);

// Keep the existing magazine folders so previously written articles remain available.
const magazine = defineCollection({
  loader: glob({ pattern: '{tr,en}/**/*.md', base: './src/content/magazine' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    excerpt: z.string(),
    cover: assetPath.or(z.literal('')).optional(),
    coverAlt: z.string().default(''),
    translationKey: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const newsletter = defineCollection({
  loader: glob({ pattern: '{tr,en}/**/*.md', base: './src/content/newsletter' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().default(''),
    file: assetPath.or(z.literal('')).default(''),
    cover: assetPath.or(z.literal('')).optional(),
    coverAlt: z.string().default(''),
    draft: z.boolean().default(false),
  }).superRefine((issue, context) => {
    if (!issue.draft && !issue.file) context.addIssue({
      code: 'custom', path: ['file'], message: 'Published newsletter issues need a PDF path or URL.',
    });
  }),
});

export const collections = { magazine, newsletter };
