import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLocalizedPath, type Lang } from '@/i18n/ui';

/**
 * Build-time search index — one entry per article AND per tool, so search
 * returns fine-grained items (not just the pages that happen to contain a
 * tool card). Searched client-side by the ⌘K palette and the /search/ page.
 */
export const GET: APIRoute = async () => {
  const articles = await getCollection('articles');
  const resources = await getCollection('resources');

  type Item = {
    type: 'article' | 'tool';
    lang: Lang;
    title: string;
    desc: string;
    phase: string;
    tags: string[];
    cat?: string;
    pricing?: string;
    url: string;
  };

  const items: Item[] = [];

  for (const a of articles as any[]) {
    if (a.data.draft) continue;
    const slug = a.id.split('/').pop()!;
    items.push({
      type: 'article',
      lang: a.data.lang,
      title: a.data.title,
      desc: a.data.description,
      phase: a.data.phase,
      tags: a.data.tags ?? [],
      url: getLocalizedPath(`/articles/${slug}/`, a.data.lang),
    });
  }

  for (const r of resources as any[]) {
    items.push({
      type: 'tool',
      lang: r.data.lang,
      title: r.data.name,
      desc: r.data.description,
      phase: r.data.phase,
      tags: r.data.tags ?? [],
      cat: r.data.category,
      pricing: r.data.pricing,
      url: r.data.url,
    });
  }

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
