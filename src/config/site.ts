export const SITE = {
  name: 'Indie Hacker Portal',
  domain: 'example.com', // replaced with real domain in deploy task
  defaultLocale: 'zh' as const,
};

export const GISCUS = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO ?? '',
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? '',
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'Comments',
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? '',
};

export const ANALYTICS = {
  cloudflareToken: import.meta.env.PUBLIC_CF_BEACON_TOKEN ?? '',
};

export const NEWSLETTER = {
  buttondownUser: import.meta.env.PUBLIC_BUTTONDOWN_USER ?? '',
};
