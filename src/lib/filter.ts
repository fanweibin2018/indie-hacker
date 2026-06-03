export interface ResourceData {
  category: string;
  pricing: 'free' | 'freemium' | 'paid';
  tags: string[];
}
export interface ResourceItem { data: ResourceData & Record<string, unknown>; }

export interface ResourceFilters {
  category?: string;
  pricing?: ResourceData['pricing'];
  tag?: string;
}

export function filterResources<T extends ResourceItem>(items: T[], f: ResourceFilters): T[] {
  return items.filter((i) => {
    if (f.category && i.data.category !== f.category) return false;
    if (f.pricing && i.data.pricing !== f.pricing) return false;
    if (f.tag && !i.data.tags.includes(f.tag)) return false;
    return true;
  });
}

export function collectFacets<T extends ResourceItem>(items: T[]) {
  const categories = new Set<string>();
  const pricing = new Set<string>();
  const tags = new Set<string>();
  for (const i of items) {
    categories.add(i.data.category);
    pricing.add(i.data.pricing);
    i.data.tags.forEach((t) => tags.add(t));
  }
  const sorted = (s: Set<string>) => [...s].sort();
  return { categories: sorted(categories), pricing: sorted(pricing), tags: sorted(tags) };
}
