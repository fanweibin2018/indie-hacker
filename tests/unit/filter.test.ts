import { describe, it, expect } from 'vitest';
import { filterResources, collectFacets } from '@/lib/filter';

const r = (o: any) => ({ data: { lang: 'zh', phase: 'discover', category: 'A', tags: ['x'], pricing: 'free', ...o } });

describe('filterResources', () => {
  const items = [
    r({ category: 'A', pricing: 'free', tags: ['x'] }),
    r({ category: 'B', pricing: 'paid', tags: ['y'] }),
    r({ category: 'A', pricing: 'paid', tags: ['x', 'y'] }),
  ];
  it('returns all when no filters set', () => {
    expect(filterResources(items as any, {})).toHaveLength(3);
  });
  it('filters by category, pricing, tag (AND across dimensions)', () => {
    expect(filterResources(items as any, { category: 'A', pricing: 'paid' })).toHaveLength(1);
    expect(filterResources(items as any, { tag: 'y' })).toHaveLength(2);
  });
  it('collectFacets returns unique sorted values', () => {
    const f = collectFacets(items as any);
    expect(f.categories).toEqual(['A', 'B']);
    expect(f.pricing).toEqual(['free', 'paid']);
    expect(f.tags).toEqual(['x', 'y']);
  });
});
