import type { Lang } from '@/i18n/ui';
import type { PhaseId } from '@/lib/phases';

interface HasData {
  data: { lang: Lang; phase: PhaseId; draft?: boolean; pubDate: Date };
}

export function filterArticles<T extends HasData>(
  items: T[],
  opts: { lang: Lang; phase?: PhaseId; includeDrafts?: boolean },
): T[] {
  return items.filter((i) => {
    if (i.data.lang !== opts.lang) return false;
    if (opts.phase && i.data.phase !== opts.phase) return false;
    if (!opts.includeDrafts && i.data.draft) return false;
    return true;
  });
}

export function sortByDateDesc<T extends HasData>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
