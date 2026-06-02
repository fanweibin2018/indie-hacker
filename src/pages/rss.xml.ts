import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  const zh = (articles as any[]).filter((a) => a.data.lang === 'zh' && !a.data.draft);
  return rss({
    title: 'Indie Hacker Portal',
    description: '从需求到变现的独立开发者知识库',
    site: context.site!,
    items: zh.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.pubDate,
      link: `/articles/${a.id.split('/').pop()}/`,
    })),
  });
}
