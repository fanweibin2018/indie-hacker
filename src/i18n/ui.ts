export type Lang = 'zh' | 'en';
export const DEFAULT_LANG: Lang = 'zh';

export const ui = {
  zh: {
    'nav.home': '首页', 'nav.resources': '资源', 'nav.about': '关于',
    'nav.search': '搜索', 'phase.articles': '精选文章', 'phase.resources': '资源目录',
    'article.relatedResources': '本文用到的工具', 'newsletter.cta': '订阅更新',
    'filter.pricing': '定价', 'filter.category': '分类', 'filter.tag': '标签', 'filter.all': '全部',
  },
  en: {
    'nav.home': 'Home', 'nav.resources': 'Resources', 'nav.about': 'About',
    'nav.search': 'Search', 'phase.articles': 'Featured Articles', 'phase.resources': 'Resources',
    'article.relatedResources': 'Tools used in this article', 'newsletter.cta': 'Subscribe',
    'filter.pricing': 'Pricing', 'filter.category': 'Category', 'filter.tag': 'Tag', 'filter.all': 'All',
  },
} as const;

export type UiKey = keyof (typeof ui)['zh'];

export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split('/');
  return seg === 'en' ? 'en' : 'zh';
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    const dict = ui[lang] as Record<string, string>;
    return dict[key] ?? key;
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  const stripped = path.replace(/^\/en(?=\/|$)/, '') || '/';
  if (lang === 'en') return stripped === '/' ? '/en/' : `/en${stripped}`;
  return stripped;
}
