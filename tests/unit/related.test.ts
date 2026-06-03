import { describe, it, expect } from 'vitest';
import { resolveRelated } from '@/lib/related';

const article = { id: 'a1', data: { lang: 'zh', relatedResources: ['res-1', 'missing'] } };
const resources = [
  { id: 'res-1', data: { lang: 'zh', name: 'R1' } },
  { id: 'res-1', data: { lang: 'en', name: 'R1-en' } },
  { id: 'res-2', data: { lang: 'zh', name: 'R2' } },
];

describe('resolveRelated', () => {
  it('resolves slugs to same-lang resources, ignoring missing', () => {
    const out = resolveRelated(article as any, resources as any);
    expect(out.map((r) => r.data.name)).toEqual(['R1']);
  });
  it('returns empty array when no relations', () => {
    const a = { id: 'a2', data: { lang: 'zh', relatedResources: [] } };
    expect(resolveRelated(a as any, resources as any)).toEqual([]);
  });
});
