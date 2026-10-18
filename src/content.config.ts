import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One Markdown file per topic and language: src/content/fichas/<lang>/<zone-id>/<topic-key>.md
// Files starting with "_" are ignored (see _plantilla.md for the template).
const fichas = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/fichas' }),
  schema: z.object({
    lang: z.enum(['es', 'en']),
    zone: z.string(),
    topic: z.string(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    updated: z.coerce.date(),
    references: z
      .array(z.object({ label: z.string(), url: z.string().url().optional() }))
      .default([]),
  }),
});

export const collections = { fichas };
