import type { Lang } from '@/i18n/ui';

interface Article { id: string; data: { lang: Lang; relatedResources: string[] }; }
interface Resource { id: string; data: { lang: Lang } & Record<string, unknown>; }

/** id 形如 "zh/res-1" 或 "res-1"，取末段作为跨语言共享 slug。 */
function slugOf(id: string): string {
  const parts = id.split('/');
  return parts[parts.length - 1];
}

export function resolveRelated<R extends Resource>(article: Article, resources: R[]): R[] {
  const wanted = new Set(article.data.relatedResources);
  return resources.filter(
    (r) => r.data.lang === article.data.lang && wanted.has(slugOf(r.id)),
  );
}
