import { describe, it, expect } from 'vitest';
import { filterArticles, sortByDateDesc } from '@/lib/collections';

const make = (o: Partial<any>) => ({ data: { lang: 'zh', phase: 'build', draft: false, pubDate: new Date('2026-01-01'), ...o } });

describe('collections', () => {
  it('filters by lang and phase, excludes drafts', () => {
    const items = [
      make({ lang: 'zh', phase: 'build' }),
      make({ lang: 'en', phase: 'build' }),
      make({ lang: 'zh', phase: 'market' }),
      make({ lang: 'zh', phase: 'build', draft: true }),
    ];
    const out = filterArticles(items as any, { lang: 'zh', phase: 'build' });
    expect(out).toHaveLength(1);
  });
  it('sorts by pubDate descending', () => {
    const items = [make({ pubDate: new Date('2026-01-01') }), make({ pubDate: new Date('2026-05-01') })];
    const out = sortByDateDesc(items as any);
    expect(out[0].data.pubDate.getMonth()).toBe(4);
  });
});
