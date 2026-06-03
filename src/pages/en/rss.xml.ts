import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  const en = (articles as any[]).filter((a) => a.data.lang === 'en' && !a.data.draft);
  return rss({
    title: 'Indie Hacker Portal',
    description: 'A knowledge base for indie hackers: from idea to revenue.',
    site: context.site!,
    items: en.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.pubDate,
      link: `/en/articles/${a.id.split('/').pop()}/`,
    })),
  });
}
