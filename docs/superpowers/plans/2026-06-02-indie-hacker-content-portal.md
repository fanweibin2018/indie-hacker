# 独立开发者内容门户 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个中英双语、围绕"需求挖掘/设计/开发/营销/商业分析"五阶段组织的独立开发者内容门户（原创文章 + 可筛选资源目录，交叉关联），纯静态部署到 GitHub Pages + 自定义域名。

**Architecture:** Astro 静态站（`output: 'static'`），用 Content Layer（glob loader）+ Zod schema 管理 `articles` 与 `resources` 两个 collection，按 `zh/`、`en/` 子目录分语言。页面逻辑下沉到 `lang` 参数化的组件/布局，根路径为中文、`/en/` 为英文镜像。搜索（Pagefind）、评论（Giscus）、统计（Cloudflare Web Analytics）、订阅（Buttondown）、RSS 全部为静态友好的前端/第三方集成。视觉由 Claude Design 出稿后在 design tokens 层还原。

**Tech Stack:** Astro 5 · TypeScript (strict) · TailwindCSS · MDX · Pagefind · Giscus · `@astrojs/rss` · Vitest · Playwright + axe-core · GitHub Actions → GitHub Pages

**与 Claude Design 的依赖关系:** 本计划的工程骨架、内容模型、i18n、筛选逻辑、配套功能、部署、测试**不依赖**视觉定稿，可立即执行。仅 **Task 16（设计还原）** 依赖 Claude Design 交付的设计系统（token/色值/字体/版式）。在该交付物到位前，使用 `src/styles/tokens.css` 中的占位 token；到位后替换。

---

## File Structure

```
indie-hacker/
├── package.json                      # 依赖与脚本
├── astro.config.mjs                  # Astro 配置（site/i18n/integrations）
├── tsconfig.json                     # TS strict
├── tailwind.config.mjs               # Tailwind 配置
├── vitest.config.ts                  # 单元测试配置
├── playwright.config.ts              # E2E/视觉测试配置
├── public/
│   └── CNAME                         # 自定义域名
├── src/
│   ├── content.config.ts             # Content Collections + Zod schema
│   ├── config/
│   │   └── site.ts                   # 站点常量、五阶段定义、第三方配置
│   ├── i18n/
│   │   └── ui.ts                     # UI 文案字典 + useTranslations / getLangFromUrl
│   ├── lib/
│   │   ├── phases.ts                 # 五阶段元数据与类型
│   │   ├── filter.ts                 # 资源筛选纯函数
│   │   ├── related.ts                # 文章↔资源关联解析
│   │   └── collections.ts            # 内容查询封装（按语言/阶段取内容）
│   ├── styles/
│   │   ├── tokens.css                # 设计 token（占位，Claude Design 后替换）
│   │   └── global.css                # 全局样式
│   ├── components/
│   │   ├── Nav.astro                 # 导航（语言切换/搜索入口/主题切换）
│   │   ├── Footer.astro
│   │   ├── ArticleCard.astro
│   │   ├── ResourceCard.astro
│   │   ├── PhaseChip.astro
│   │   ├── ResourceFilter.astro      # 客户端筛选控件
│   │   ├── Comments.astro            # Giscus
│   │   ├── NewsletterForm.astro      # Buttondown 表单
│   │   └── Analytics.astro           # Cloudflare Web Analytics 脚本
│   ├── layouts/
│   │   └── BaseLayout.astro          # <head>/Nav/Footer/Analytics 骨架
│   ├── pages/
│   │   ├── index.astro               # 中文首页
│   │   ├── [phase].astro             # 中文阶段页
│   │   ├── resources.astro           # 中文资源总览
│   │   ├── about.astro
│   │   ├── search.astro
│   │   ├── rss.xml.ts                # 中文 RSS
│   │   ├── articles/[slug].astro     # 中文文章详情
│   │   └── en/                       # 英文镜像（同结构）
│   │       ├── index.astro
│   │       ├── [phase].astro
│   │       ├── resources.astro
│   │       ├── about.astro
│   │       ├── search.astro
│   │       ├── rss.xml.ts
│   │       └── articles/[slug].astro
│   └── content/
│       ├── articles/{zh,en}/*.mdx
│       └── resources/{zh,en}/*.md
├── tests/
│   └── unit/                         # Vitest 单测
└── e2e/                              # Playwright 测试
    └── *.spec.ts
.github/workflows/deploy.yml          # CI/CD
```

每个文件单一职责：`lib/` 放纯逻辑（可单测、无 Astro 依赖），`components/` 放展示，`pages/` 只做数据装配 + 渲染。中英页面共享组件，差异仅 `lang` 参数。

---

## Phase 0 — 工程骨架

### Task 1: 初始化 package.json 与依赖

**Files:**
- Create: `package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "indie-hacker",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/rss": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "pagefind": "^1.2.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "axe-core": "^4.10.0",
    "@axe-core/playwright": "^4.10.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`
Expected: 依赖安装完成，生成 `node_modules` 与 `package-lock.json`，无 error。

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize package.json and dependencies"
```

---

### Task 2: TypeScript、Astro、Tailwind 配置

**Files:**
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `tailwind.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: 创建 tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "strictNullChecks": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 2: 创建 astro.config.mjs**

> 注意：`site` 暂用占位域名，Task 15 部署时替换为真实自定义域名。

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: 创建 tailwind.config.mjs**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: 创建 src/styles/global.css**

```css
@import 'tailwindcss';
@import './tokens.css';

html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
body { font-family: var(--font-body); color: var(--color-text); background: var(--color-surface); }
```

- [ ] **Step 5: 验证构建配置可加载**

Run: `npx astro check --help`
Expected: 打印 help，无配置加载错误。（完整 build 在内容/页面就绪后进行。）

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json astro.config.mjs tailwind.config.mjs src/styles/global.css
git commit -m "chore: add typescript, astro, tailwind config"
```

---

### Task 3: 占位 design tokens

**Files:**
- Create: `src/styles/tokens.css`

> 这是占位实现。Claude Design 交付后由 Task 16 替换为真实 token。占位也必须满足无障碍对比度，保证开发期可用。

- [ ] **Step 1: 创建 src/styles/tokens.css**

```css
:root {
  /* typography */
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, 'Noto Sans SC', system-ui, sans-serif;
  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-hero: clamp(2.5rem, 1rem + 6vw, 5rem);

  /* surfaces & text */
  --color-surface: oklch(99% 0 0);
  --color-surface-2: oklch(96% 0.005 250);
  --color-text: oklch(20% 0 0);
  --color-text-muted: oklch(45% 0.01 250);
  --color-border: oklch(88% 0.01 250);

  /* five phase semantic colors (placeholder oklch ring: same L/C, vary hue) */
  --color-discover: oklch(62% 0.16 25);    /* 红橙 */
  --color-design:   oklch(62% 0.16 95);    /* 黄绿 */
  --color-build:    oklch(62% 0.16 160);   /* 青绿 */
  --color-market:   oklch(62% 0.16 250);   /* 蓝 */
  --color-business: oklch(62% 0.16 320);   /* 紫红 */

  /* spacing & motion */
  --space-section: clamp(3rem, 2rem + 5vw, 8rem);
  --radius: 0.5rem;
  --duration-normal: 300ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme='dark'] {
  --color-surface: oklch(18% 0.01 250);
  --color-surface-2: oklch(23% 0.01 250);
  --color-text: oklch(95% 0 0);
  --color-text-muted: oklch(70% 0.01 250);
  --color-border: oklch(32% 0.01 250);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add placeholder design tokens"
```

---

## Phase 1 — 五阶段元数据与内容模型

### Task 4: 五阶段定义（lib/phases.ts）

**Files:**
- Create: `src/lib/phases.ts`
- Test: `tests/unit/phases.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/unit/phases.test.ts
import { describe, it, expect } from 'vitest';
import { PHASES, PHASE_IDS, isPhaseId, getPhase } from '@/lib/phases';

describe('phases', () => {
  it('exposes exactly five phases', () => {
    expect(PHASE_IDS).toEqual(['discover', 'design', 'build', 'market', 'business']);
  });
  it('each phase has bilingual labels and a color var', () => {
    for (const p of PHASES) {
      expect(p.label.zh).toBeTruthy();
      expect(p.label.en).toBeTruthy();
      expect(p.colorVar).toMatch(/^--color-/);
    }
  });
  it('isPhaseId validates membership', () => {
    expect(isPhaseId('discover')).toBe(true);
    expect(isPhaseId('nope')).toBe(false);
  });
  it('getPhase returns the matching phase', () => {
    expect(getPhase('market').label.en).toBe('Market');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/phases.test.ts`
Expected: FAIL，提示模块 `@/lib/phases` 不存在。

- [ ] **Step 3: 实现 src/lib/phases.ts**

```ts
export const PHASE_IDS = ['discover', 'design', 'build', 'market', 'business'] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export interface Phase {
  id: PhaseId;
  label: { zh: string; en: string };
  blurb: { zh: string; en: string };
  colorVar: `--color-${PhaseId}`;
}

export const PHASES: Phase[] = [
  { id: 'discover', label: { zh: '需求挖掘', en: 'Discover' }, blurb: { zh: '找问题、验证需求、市场调研', en: 'Find problems, validate demand, research markets' }, colorVar: '--color-discover' },
  { id: 'design',   label: { zh: '设计',     en: 'Design'   }, blurb: { zh: '产品、UX、视觉、原型', en: 'Product, UX, visual, prototyping' }, colorVar: '--color-design' },
  { id: 'build',    label: { zh: '开发',     en: 'Build'    }, blurb: { zh: '技术选型、工程实践、工具链', en: 'Stack, engineering, tooling' }, colorVar: '--color-build' },
  { id: 'market',   label: { zh: '营销',     en: 'Market'   }, blurb: { zh: '获客、内容、SEO、社区、增长', en: 'Acquisition, content, SEO, community, growth' }, colorVar: '--color-market' },
  { id: 'business', label: { zh: '商业分析', en: 'Business' }, blurb: { zh: '定价、商业模式、数据、财务', en: 'Pricing, models, data, finance' }, colorVar: '--color-business' },
];

const PHASE_MAP = new Map(PHASES.map((p) => [p.id, p]));

export function isPhaseId(value: string): value is PhaseId {
  return (PHASE_IDS as readonly string[]).includes(value);
}

export function getPhase(id: PhaseId): Phase {
  const phase = PHASE_MAP.get(id);
  if (!phase) throw new Error(`Unknown phase: ${id}`);
  return phase;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/phases.test.ts`
Expected: PASS（4 个用例）。

- [ ] **Step 5: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
});
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/phases.ts tests/unit/phases.test.ts vitest.config.ts
git commit -m "feat: add five-phase metadata with tests"
```

---

### Task 5: Content Collections schema（content.config.ts）

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: 实现 content.config.ts**

```ts
import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const PHASE = z.enum(['discover', 'design', 'build', 'market', 'business']);
const LANG = z.enum(['zh', 'en']);

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    phase: PHASE,
    tags: z.array(z.string()).default([]),
    lang: LANG,
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    relatedResources: z.array(z.string()).default([]),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/resources' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    phase: PHASE,
    category: z.string(),
    tags: z.array(z.string()).default([]),
    lang: LANG,
    pricing: z.enum(['free', 'freemium', 'paid']),
    rating: z.number().min(0).max(5).optional(),
    featured: z.boolean().default(false),
    relatedArticles: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, resources };
```

- [ ] **Step 2: 验证 schema 可被 Astro 加载（暂无内容也应通过）**

Run: `npx astro sync`
Expected: 生成 `.astro/` 类型，无 schema 语法错误。

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: define articles and resources collections with zod schema"
```

---

### Task 6: 种子内容（每阶段示例文章 + 资源，中英各一）

**Files:**
- Create: `src/content/articles/zh/discover-validate-demand.mdx`
- Create: `src/content/articles/en/discover-validate-demand.mdx`
- Create: `src/content/resources/zh/discover-google-trends.md`
- Create: `src/content/resources/en/discover-google-trends.md`
- （其余四阶段按相同模式各补 1 篇文章 + 1 条资源，中英成对，见 Step 4）

- [ ] **Step 1: 创建中文示例文章**

```mdx
---
title: 如何在写一行代码前验证需求
description: 用最小成本验证一个独立产品想法是否有真实需求。
phase: discover
tags: [需求验证, 调研]
lang: zh
pubDate: 2026-06-01
relatedResources: [discover-google-trends]
---

import ResourceCard from '@/components/ResourceCard.astro';

验证需求的核心是：在投入开发前，用最小成本确认有人愿意为这个问题买单。

## 三个低成本验证手段

1. 搜索量与趋势分析
2. 落地页 + 等待名单
3. 直接对话目标用户

> 关键不是"想法好不好"，而是"有没有人现在就因此痛苦"。
```

- [ ] **Step 2: 创建对应英文文章（相同 slug）**

```mdx
---
title: Validate Demand Before Writing a Line of Code
description: Confirm an indie product idea has real demand at minimal cost.
phase: discover
tags: [validation, research]
lang: en
pubDate: 2026-06-01
relatedResources: [discover-google-trends]
---

The core of validation: before building, confirm at minimal cost that someone will pay to solve this problem.

## Three low-cost tactics

1. Search volume and trend analysis
2. Landing page + waitlist
3. Talking to target users directly

> The question isn't "is the idea good" but "is anyone hurting from this right now".
```

- [ ] **Step 3: 创建资源条目（中/英）**

```md
---
name: Google Trends
url: https://trends.google.com
description: 免费的搜索趋势分析工具，验证需求热度与季节性。
phase: discover
category: 市场调研
tags: [趋势, 免费]
lang: zh
pricing: free
featured: true
relatedArticles: [discover-validate-demand]
---
```

```md
---
name: Google Trends
url: https://trends.google.com
description: Free search-trend analysis to gauge demand and seasonality.
phase: discover
category: Market Research
tags: [trends, free]
lang: en
pricing: free
featured: true
relatedArticles: [discover-validate-demand]
---
```

- [ ] **Step 4: 为 design/build/market/business 各补一对文章 + 一对资源**

按 Step 1–3 的 frontmatter 结构，为其余四个阶段各创建：中英文章各一篇（`phase` 对应、`lang` 对应、slug 中英一致）、中英资源各一条。正文用贴近 indie hacker 真实场景的占位内容（非 lorem）。文件命名遵循 `{phase}-<topic>.mdx` / `{phase}-<tool>.md`。

- [ ] **Step 5: 验证内容通过 schema 校验**

Run: `npx astro sync && npx astro check`
Expected: 无 schema 校验错误；若某 frontmatter 字段类型不符则构建报错（即内容校验生效）。

- [ ] **Step 6: Commit**

```bash
git add src/content/
git commit -m "content: seed bilingual sample articles and resources for five phases"
```

---

## Phase 2 — i18n 与内容查询

### Task 7: i18n 工具（ui.ts）

**Files:**
- Create: `src/i18n/ui.ts`
- Test: `tests/unit/i18n.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/unit/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations, getLocalizedPath } from '@/i18n/ui';

describe('i18n', () => {
  it('detects en from /en/ paths, zh otherwise', () => {
    expect(getLangFromUrl(new URL('https://x.com/en/build/'))).toBe('en');
    expect(getLangFromUrl(new URL('https://x.com/build/'))).toBe('zh');
  });
  it('returns translated strings with fallback to key', () => {
    const t = useTranslations('en');
    expect(t('nav.resources')).toBe('Resources');
    expect(t('missing.key')).toBe('missing.key');
  });
  it('localizes a path for a target lang', () => {
    expect(getLocalizedPath('/build/', 'en')).toBe('/en/build/');
    expect(getLocalizedPath('/en/build/', 'zh')).toBe('/build/');
    expect(getLocalizedPath('/build/', 'zh')).toBe('/build/');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 src/i18n/ui.ts**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ui.ts tests/unit/i18n.test.ts
git commit -m "feat: add i18n utilities with tests"
```

---

### Task 8: 内容查询封装（collections.ts）

**Files:**
- Create: `src/lib/collections.ts`
- Test: `tests/unit/collections.test.ts`

> `collections.ts` 内的纯逻辑（过滤草稿、按语言/阶段筛选、排序）抽成可单测的纯函数；Astro 的 `getCollection` 调用在页面层注入。

- [ ] **Step 1: 写失败测试**

```ts
// tests/unit/collections.test.ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/collections.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 src/lib/collections.ts**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/collections.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/collections.ts tests/unit/collections.test.ts
git commit -m "feat: add content query helpers with tests"
```

---

### Task 9: 资源筛选纯函数（filter.ts）

**Files:**
- Create: `src/lib/filter.ts`
- Test: `tests/unit/filter.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/unit/filter.test.ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/filter.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 src/lib/filter.ts**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/filter.test.ts`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/filter.ts tests/unit/filter.test.ts
git commit -m "feat: add resource filtering pure functions with tests"
```

---

### Task 10: 文章↔资源关联解析（related.ts）

**Files:**
- Create: `src/lib/related.ts`
- Test: `tests/unit/related.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/unit/related.test.ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/related.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 src/lib/related.ts**

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/unit/related.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/related.ts tests/unit/related.test.ts
git commit -m "feat: add article-resource relation resolver with tests"
```

---

## Phase 3 — 站点配置与布局骨架

### Task 11: 站点配置（config/site.ts）

**Files:**
- Create: `src/config/site.ts`

- [ ] **Step 1: 实现 src/config/site.ts**

> 第三方敏感/可变配置集中此处，通过 `import.meta.env` 读取环境变量，不硬编码具体值。

```ts
export const SITE = {
  name: 'Indie Hacker Portal',
  domain: 'example.com', // Task 15 替换为真实域名
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
```

- [ ] **Step 2: 创建 .env.example**

```
PUBLIC_GISCUS_REPO=owner/indie-hacker
PUBLIC_GISCUS_REPO_ID=
PUBLIC_GISCUS_CATEGORY=Comments
PUBLIC_GISCUS_CATEGORY_ID=
PUBLIC_CF_BEACON_TOKEN=
PUBLIC_BUTTONDOWN_USER=
```

- [ ] **Step 3: Commit**

```bash
git add src/config/site.ts .env.example
git commit -m "feat: add site config with env-based third-party settings"
```

---

### Task 12: 配套功能组件（Analytics / Comments / Newsletter）

**Files:**
- Create: `src/components/Analytics.astro`
- Create: `src/components/Comments.astro`
- Create: `src/components/NewsletterForm.astro`

- [ ] **Step 1: 实现 Analytics.astro**

```astro
---
import { ANALYTICS } from '@/config/site';
const token = ANALYTICS.cloudflareToken;
---
{token && (
  <script
    defer
    src="https://static.cloudflareinsights.com/beacon.min.js"
    data-cf-beacon={`{"token": "${token}"}`}
  ></script>
)}
```

- [ ] **Step 2: 实现 Comments.astro**

```astro
---
import { GISCUS } from '@/config/site';
interface Props { lang: 'zh' | 'en'; }
const { lang } = Astro.props;
const ready = GISCUS.repo && GISCUS.repoId && GISCUS.categoryId;
---
{ready ? (
  <script src="https://giscus.app/client.js"
    data-repo={GISCUS.repo}
    data-repo-id={GISCUS.repoId}
    data-category={GISCUS.category}
    data-category-id={GISCUS.categoryId}
    data-mapping="pathname"
    data-strict="1"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="preferred_color_scheme"
    data-lang={lang === 'zh' ? 'zh-CN' : 'en'}
    crossorigin="anonymous"
    async></script>
) : (
  <p class="text-[var(--color-text-muted)]">Comments not configured.</p>
)}
```

- [ ] **Step 3: 实现 NewsletterForm.astro**

```astro
---
import { NEWSLETTER } from '@/config/site';
import { useTranslations, type Lang } from '@/i18n/ui';
interface Props { lang: Lang; }
const { lang } = Astro.props;
const t = useTranslations(lang);
const action = NEWSLETTER.buttondownUser
  ? `https://buttondown.email/api/emails/embed-subscribe/${NEWSLETTER.buttondownUser}`
  : '';
---
{action && (
  <form action={action} method="post" target="_blank" class="newsletter">
    <input type="email" name="email" required placeholder="you@example.com" aria-label="email" />
    <button type="submit">{t('newsletter.cta')}</button>
  </form>
)}
```

- [ ] **Step 4: 验证类型/构建**

Run: `npx astro check`
Expected: 无类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/components/Analytics.astro src/components/Comments.astro src/components/NewsletterForm.astro
git commit -m "feat: add analytics, comments, newsletter components"
```

---

### Task 13: 展示组件 + 布局（Nav/Footer/Cards/Chip/BaseLayout）

**Files:**
- Create: `src/components/PhaseChip.astro`
- Create: `src/components/ArticleCard.astro`
- Create: `src/components/ResourceCard.astro`
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/BaseLayout.astro`

> 这些是结构性组件，样式用占位 token；Task 16 用 Claude Design 定稿替换观感。每个组件接受 `lang` 并用语义化结构（`<nav>`/`<main>`/`<article>`），满足无障碍。

- [ ] **Step 1: 实现 PhaseChip.astro**

```astro
---
import { getPhase, type PhaseId } from '@/lib/phases';
import type { Lang } from '@/i18n/ui';
interface Props { phase: PhaseId; lang: Lang; }
const { phase, lang } = Astro.props;
const p = getPhase(phase);
---
<span class="phase-chip" style={`--chip:var(${p.colorVar})`}>
  <span class="dot" style="background:var(--chip)"></span>{p.label[lang]}
</span>
```

- [ ] **Step 2: 实现 ArticleCard.astro**

```astro
---
import PhaseChip from './PhaseChip.astro';
import { getLocalizedPath, type Lang } from '@/i18n/ui';
import type { PhaseId } from '@/lib/phases';
interface Props { slug: string; title: string; description: string; phase: PhaseId; lang: Lang; }
const { slug, title, description, phase, lang } = Astro.props;
const href = getLocalizedPath(`/articles/${slug}/`, lang);
---
<article class="article-card">
  <PhaseChip phase={phase} lang={lang} />
  <h3><a href={href}>{title}</a></h3>
  <p>{description}</p>
</article>
```

- [ ] **Step 3: 实现 ResourceCard.astro**

```astro
---
import PhaseChip from './PhaseChip.astro';
import type { Lang } from '@/i18n/ui';
import type { PhaseId } from '@/lib/phases';
interface Props { name: string; url: string; description: string; phase: PhaseId; pricing: string; category: string; lang: Lang; }
const { name, url, description, phase, pricing, category, lang } = Astro.props;
const initial = name.trim().charAt(0).toUpperCase();
---
<article class="resource-card" data-category={category} data-pricing={pricing}>
  <span class="logo" aria-hidden="true">{initial}</span>
  <div>
    <h3><a href={url} target="_blank" rel="noopener">{name}</a></h3>
    <p>{description}</p>
    <div class="meta"><PhaseChip phase={phase} lang={lang} /><span class="pricing">{pricing}</span></div>
  </div>
</article>
```

- [ ] **Step 4: 实现 Nav.astro（语言切换 / 搜索 / 主题）**

```astro
---
import { getLangFromUrl, useTranslations, getLocalizedPath } from '@/i18n/ui';
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const path = Astro.url.pathname;
const otherLang = lang === 'zh' ? 'en' : 'zh';
const home = getLocalizedPath('/', lang);
const resources = getLocalizedPath('/resources/', lang);
const about = getLocalizedPath('/about/', lang);
const search = getLocalizedPath('/search/', lang);
const switchHref = getLocalizedPath(path, otherLang);
---
<nav aria-label="Main navigation" class="site-nav">
  <a href={home} class="brand">Indie Hacker</a>
  <ul>
    <li><a href={resources}>{t('nav.resources')}</a></li>
    <li><a href={about}>{t('nav.about')}</a></li>
    <li><a href={search}>{t('nav.search')}</a></li>
  </ul>
  <div class="nav-actions">
    <a href={switchHref} class="lang-toggle">{otherLang === 'en' ? 'EN' : '中'}</a>
    <button type="button" id="theme-toggle" aria-label="toggle theme">◐</button>
  </div>
</nav>
<script>
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
  btn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
</script>
```

- [ ] **Step 5: 实现 Footer.astro**

```astro
---
import { getLangFromUrl, getLocalizedPath } from '@/i18n/ui';
const lang = getLangFromUrl(Astro.url);
const rss = lang === 'en' ? '/en/rss.xml' : '/rss.xml';
---
<footer class="site-footer">
  <a href={rss}>RSS</a>
  <span>© {new Date().getFullYear()} Indie Hacker Portal</span>
</footer>
```

- [ ] **Step 6: 实现 BaseLayout.astro**

```astro
---
import '@/styles/global.css';
import Nav from '@/components/Nav.astro';
import Footer from '@/components/Footer.astro';
import Analytics from '@/components/Analytics.astro';
import { getLangFromUrl } from '@/i18n/ui';
interface Props { title: string; description?: string; }
const { title, description = '' } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const htmlLang = lang === 'zh' ? 'zh-CN' : 'en';
---
<!doctype html>
<html lang={htmlLang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="alternate" type="application/rss+xml" href={lang === 'en' ? '/en/rss.xml' : '/rss.xml'} />
    <Analytics />
  </head>
  <body>
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 7: 验证类型/构建**

Run: `npx astro check`
Expected: 无类型错误。

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/layouts/
git commit -m "feat: add presentational components and base layout"
```

---

## Phase 4 — 页面与路由

### Task 14: 中文页面（首页 / 阶段页 / 资源 / 文章详情 / 关于 / 搜索 / RSS）

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/[phase].astro`
- Create: `src/pages/resources.astro`
- Create: `src/pages/articles/[slug].astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/search.astro`
- Create: `src/pages/rss.xml.ts`
- Create: `src/components/ResourceFilter.astro`

- [ ] **Step 1: 实现 ResourceFilter.astro（客户端筛选）**

```astro
---
import type { Lang } from '@/i18n/ui';
import { useTranslations } from '@/i18n/ui';
interface Props { facets: { categories: string[]; pricing: string[]; tags: string[] }; lang: Lang; }
const { facets, lang } = Astro.props;
const t = useTranslations(lang);
---
<div class="resource-filter" data-filter-root>
  <label>{t('filter.category')}
    <select data-filter="category"><option value="">{t('filter.all')}</option>
      {facets.categories.map((c) => <option value={c}>{c}</option>)}
    </select>
  </label>
  <label>{t('filter.pricing')}
    <select data-filter="pricing"><option value="">{t('filter.all')}</option>
      {facets.pricing.map((p) => <option value={p}>{p}</option>)}
    </select>
  </label>
  <label>{t('filter.tag')}
    <select data-filter="tag"><option value="">{t('filter.all')}</option>
      {facets.tags.map((tg) => <option value={tg}>{tg}</option>)}
    </select>
  </label>
</div>
<script>
  const root = document.querySelector('[data-filter-root]');
  const cards = Array.from(document.querySelectorAll('.resource-card')) as HTMLElement[];
  const url = new URL(location.href);
  function apply() {
    const sel = (k: string) => (document.querySelector(`[data-filter="${k}"]`) as HTMLSelectElement)?.value || '';
    const cat = sel('category'), price = sel('pricing'), tag = sel('tag');
    for (const c of cards) {
      const okCat = !cat || c.dataset.category === cat;
      const okPrice = !price || c.dataset.pricing === price;
      const okTag = !tag || (c.dataset.tags || '').split(',').includes(tag);
      c.hidden = !(okCat && okPrice && okTag);
    }
    url.searchParams.set('category', cat); url.searchParams.set('pricing', price); url.searchParams.set('tag', tag);
    history.replaceState(null, '', url);
  }
  root?.addEventListener('change', apply);
</script>
```

> 注意：`ResourceCard.astro` 需补 `data-tags` 属性以支持 tag 筛选。在 Task 13 Step 3 的 `<article>` 上追加 `data-tags={tags.join(',')}` 并在 Props 增加 `tags: string[]`。执行本步时一并补上。

- [ ] **Step 2: 实现中文首页 index.astro**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import ArticleCard from '@/components/ArticleCard.astro';
import ResourceCard from '@/components/ResourceCard.astro';
import NewsletterForm from '@/components/NewsletterForm.astro';
import { PHASES } from '@/lib/phases';
import { getLocalizedPath } from '@/i18n/ui';
import { getCollection } from 'astro:content';
import { filterArticles, sortByDateDesc } from '@/lib/collections';

const lang = 'zh' as const;
const allArticles = await getCollection('articles');
const featured = sortByDateDesc(filterArticles(allArticles as any, { lang })).slice(0, 4);
const allResources = await getCollection('resources');
const featuredRes = (allResources as any[]).filter((r) => r.data.lang === lang && r.data.featured).slice(0, 4);
const slugOf = (id: string) => id.split('/').pop()!;
---
<BaseLayout title="Indie Hacker Portal" description="从需求到变现的独立开发者知识库">
  <section class="hero">
    <h1>从想法到变现，一网打尽</h1>
    <p>需求挖掘 · 设计 · 开发 · 营销 · 商业分析</p>
  </section>
  <section class="phase-grid">
    {PHASES.map((p) => (
      <a class="phase-entry" href={getLocalizedPath(`/${p.id}/`, lang)} style={`--c:var(${p.colorVar})`}>
        <h2>{p.label[lang]}</h2><p>{p.blurb[lang]}</p>
      </a>
    ))}
  </section>
  <section><h2>精选文章</h2>
    <div class="card-grid">
      {featured.map((a) => <ArticleCard slug={slugOf(a.id)} title={a.data.title} description={a.data.description} phase={a.data.phase} lang={lang} />)}
    </div>
  </section>
  <section><h2>精选资源</h2>
    <div class="card-grid">
      {featuredRes.map((r) => <ResourceCard name={r.data.name} url={r.data.url} description={r.data.description} phase={r.data.phase} pricing={r.data.pricing} category={r.data.category} tags={r.data.tags} lang={lang} />)}
    </div>
  </section>
  <section class="newsletter-section"><h2>订阅更新</h2><NewsletterForm lang={lang} /></section>
</BaseLayout>
```

- [ ] **Step 3: 实现中文阶段页 [phase].astro**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import ArticleCard from '@/components/ArticleCard.astro';
import ResourceCard from '@/components/ResourceCard.astro';
import ResourceFilter from '@/components/ResourceFilter.astro';
import { PHASE_IDS, getPhase, isPhaseId } from '@/lib/phases';
import { getCollection } from 'astro:content';
import { filterArticles, sortByDateDesc } from '@/lib/collections';
import { collectFacets } from '@/lib/filter';

export function getStaticPaths() {
  return PHASE_IDS.map((phase) => ({ params: { phase } }));
}
const { phase } = Astro.params;
if (!isPhaseId(phase!)) throw new Error(`Invalid phase: ${phase}`);
const lang = 'zh' as const;
const meta = getPhase(phase);
const allArticles = await getCollection('articles');
const articles = sortByDateDesc(filterArticles(allArticles as any, { lang, phase }));
const allResources = await getCollection('resources');
const resources = (allResources as any[]).filter((r) => r.data.lang === lang && r.data.phase === phase);
const facets = collectFacets(resources as any);
const slugOf = (id: string) => id.split('/').pop()!;
---
<BaseLayout title={meta.label[lang]} description={meta.blurb[lang]}>
  <header class="phase-header" style={`--c:var(${meta.colorVar})`}>
    <h1>{meta.label[lang]}</h1><p>{meta.blurb[lang]}</p>
  </header>
  <section><h2>精选文章</h2>
    <div class="card-grid">
      {articles.map((a) => <ArticleCard slug={slugOf(a.id)} title={a.data.title} description={a.data.description} phase={a.data.phase} lang={lang} />)}
    </div>
  </section>
  <section><h2>资源目录</h2>
    <ResourceFilter facets={facets} lang={lang} />
    <div class="card-grid">
      {resources.map((r) => <ResourceCard name={r.data.name} url={r.data.url} description={r.data.description} phase={r.data.phase} pricing={r.data.pricing} category={r.data.category} tags={r.data.tags} lang={lang} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: 实现中文资源总览 resources.astro**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import ResourceCard from '@/components/ResourceCard.astro';
import ResourceFilter from '@/components/ResourceFilter.astro';
import { getCollection } from 'astro:content';
import { collectFacets } from '@/lib/filter';
const lang = 'zh' as const;
const all = await getCollection('resources');
const resources = (all as any[]).filter((r) => r.data.lang === lang);
const facets = collectFacets(resources as any);
---
<BaseLayout title="资源目录" description="跨阶段的独立开发者工具与资源">
  <h1>资源目录</h1>
  <ResourceFilter facets={facets} lang={lang} />
  <div class="card-grid">
    {resources.map((r) => <ResourceCard name={r.data.name} url={r.data.url} description={r.data.description} phase={r.data.phase} pricing={r.data.pricing} category={r.data.category} tags={r.data.tags} lang={lang} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 5: 实现中文文章详情 articles/[slug].astro**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import ResourceCard from '@/components/ResourceCard.astro';
import Comments from '@/components/Comments.astro';
import PhaseChip from '@/components/PhaseChip.astro';
import { useTranslations } from '@/i18n/ui';
import { getCollection, render } from 'astro:content';
import { resolveRelated } from '@/lib/related';

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  const zh = (articles as any[]).filter((a) => a.data.lang === 'zh' && !a.data.draft);
  return zh.map((a) => ({ params: { slug: a.id.split('/').pop()! }, props: { entry: a } }));
}
const { entry } = Astro.props;
const lang = 'zh' as const;
const t = useTranslations(lang);
const { Content } = await render(entry);
const allResources = await getCollection('resources');
const related = resolveRelated(entry as any, allResources as any);
---
<BaseLayout title={entry.data.title} description={entry.data.description}>
  <article class="article">
    <PhaseChip phase={entry.data.phase} lang={lang} />
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
  {related.length > 0 && (
    <section class="related"><h2>{t('article.relatedResources')}</h2>
      <div class="card-grid">
        {related.map((r: any) => <ResourceCard name={r.data.name} url={r.data.url} description={r.data.description} phase={r.data.phase} pricing={r.data.pricing} category={r.data.category} tags={r.data.tags} lang={lang} />)}
      </div>
    </section>
  )}
  <section class="comments"><Comments lang={lang} /></section>
</BaseLayout>
```

- [ ] **Step 6: 实现 about.astro 与 search.astro**

```astro
---
// src/pages/about.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="关于" description="关于这个独立开发者知识库">
  <article class="prose"><h1>关于</h1><p>记录从需求到变现的全过程，build in public。</p></article>
</BaseLayout>
```

```astro
---
// src/pages/search.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="搜索" description="站内搜索">
  <h1>搜索</h1>
  <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  <div id="search"></div>
  <script>
    // @ts-ignore - pagefind 在构建后生成
    window.addEventListener('DOMContentLoaded', async () => {
      // @ts-ignore
      const { PagefindUI } = await import('/pagefind/pagefind-ui.js');
      new PagefindUI({ element: '#search', showSubResults: true });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 7: 实现中文 RSS rss.xml.ts**

```ts
// src/pages/rss.xml.ts
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
```

- [ ] **Step 8: 运行完整构建验证**

Run: `npm run build`
Expected: 构建成功，`dist/` 生成首页、5 个阶段页、资源页、文章页、about、search、rss.xml，并完成 Pagefind 索引（`dist/pagefind/` 存在）。

- [ ] **Step 9: Commit**

```bash
git add src/pages/ src/components/ResourceFilter.astro src/components/ResourceCard.astro
git commit -m "feat: add Chinese pages, resource filter, and RSS"
```

---

### Task 15: 英文镜像页面（/en/）

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/[phase].astro`
- Create: `src/pages/en/resources.astro`
- Create: `src/pages/en/articles/[slug].astro`
- Create: `src/pages/en/about.astro`
- Create: `src/pages/en/search.astro`
- Create: `src/pages/en/rss.xml.ts`

> 与 Task 14 各页结构相同，差异仅：`const lang = 'en'`、文案改英文、RSS `site` 同源、文章 `getStaticPaths` 过滤 `lang === 'en'`、链接经 `getLocalizedPath(path, 'en')`。逐页复制 Task 14 对应实现并改这些点。

- [ ] **Step 1: 复制并改写 en/index.astro**

照 Task 14 Step 2，设 `lang='en'`，标题文案改英文（如 "From idea to revenue"），section 标题用 `t('phase.articles')` / `t('phase.resources')`，阶段入口 `href` 用 `getLocalizedPath(`/${p.id}/`, 'en')`。

- [ ] **Step 2: 复制并改写 en/[phase].astro**

照 Task 14 Step 3，设 `lang='en'`，`getStaticPaths` 同样遍历 `PHASE_IDS`，资源/文章过滤 `lang==='en'`。

- [ ] **Step 3: 复制并改写 en/resources.astro、en/about.astro、en/search.astro**

照 Task 14 Step 4/6，`lang='en'`，文案英文。search 页 Pagefind 初始化相同（Pagefind 自动多语言索引）。

- [ ] **Step 4: 复制并改写 en/articles/[slug].astro**

照 Task 14 Step 5，`getStaticPaths` 过滤 `lang==='en'`，`lang='en'`。注意：英文文章 slug 与中文相同（成对），但分别在各自语言树下生成，无冲突（路径前缀不同）。

- [ ] **Step 5: 实现 en/rss.xml.ts**

照 Task 14 Step 7，过滤 `lang==='en'`，`link` 用 `/en/articles/<slug>/`，title/description 英文。

- [ ] **Step 6: 运行完整构建验证双语**

Run: `npm run build`
Expected: `dist/en/` 下生成全部英文镜像页与 `dist/en/rss.xml`；中英文章详情页路径分别为 `/articles/<slug>/` 与 `/en/articles/<slug>/`，无路由冲突。

- [ ] **Step 7: Commit**

```bash
git add src/pages/en/
git commit -m "feat: add English mirror pages and RSS"
```

---

## Phase 5 — 部署

### Task 16: GitHub Actions + GitHub Pages + 自定义域名

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/CNAME`
- Modify: `astro.config.mjs`（替换 `site` 为真实域名）
- Modify: `src/config/site.ts`（替换 `domain`）

> 执行前需用户提供真实自定义域名。若尚未确定，先用占位并在域名确定后改这两处 + CNAME。

- [ ] **Step 1: 创建 public/CNAME**

```
yourdomain.com
```
（替换为真实域名，单行、无协议、无斜杠。）

- [ ] **Step 2: 修改 astro.config.mjs 的 site**

将 `site: 'https://example.com'` 改为 `site: 'https://yourdomain.com'`（真实域名）。

- [ ] **Step 3: 修改 src/config/site.ts 的 domain**

将 `domain: 'example.com'` 改为真实域名。

- [ ] **Step 4: 创建 .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm run build
        env:
          PUBLIC_GISCUS_REPO: ${{ vars.PUBLIC_GISCUS_REPO }}
          PUBLIC_GISCUS_REPO_ID: ${{ vars.PUBLIC_GISCUS_REPO_ID }}
          PUBLIC_GISCUS_CATEGORY: ${{ vars.PUBLIC_GISCUS_CATEGORY }}
          PUBLIC_GISCUS_CATEGORY_ID: ${{ vars.PUBLIC_GISCUS_CATEGORY_ID }}
          PUBLIC_CF_BEACON_TOKEN: ${{ vars.PUBLIC_CF_BEACON_TOKEN }}
          PUBLIC_BUTTONDOWN_USER: ${{ vars.PUBLIC_BUTTONDOWN_USER }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: 仓库设置说明（手动，记录在 PR 描述）**

在 GitHub 仓库 Settings → Pages：Source 选 "GitHub Actions"；添加自定义域名并勾选 "Enforce HTTPS"。在 Settings → Secrets and variables → Actions → Variables 添加上述 6 个 `PUBLIC_*` 变量。DNS 侧：apex 域名加 GitHub Pages 的 4 个 A 记录（185.199.108–111.153）及 AAAA，或子域用 CNAME 指向 `<user>.github.io`。

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml public/CNAME astro.config.mjs src/config/site.ts
git commit -m "ci: add github pages deploy with custom domain"
```

---

## Phase 6 — 端到端与可访问性测试

### Task 17: Playwright E2E + 视觉 + a11y

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Create: `e2e/i18n.spec.ts`
- Create: `e2e/filter.spec.ts`
- Create: `e2e/a11y.spec.ts`

- [ ] **Step 1: 创建 playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

- [ ] **Step 2: 写 smoke 测试**

```ts
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('home renders hero and five phase entries', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.phase-entry')).toHaveCount(5);
});

test('phase page renders articles and resources sections', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.getByRole('heading', { name: '需求挖掘' })).toBeVisible();
  await expect(page.locator('.resource-card').first()).toBeVisible();
});
```

- [ ] **Step 3: 写 i18n 测试**

```ts
// e2e/i18n.spec.ts
import { test, expect } from '@playwright/test';

test('language toggle switches between zh and en mirror', async ({ page }) => {
  await page.goto('/discover/');
  await page.locator('.lang-toggle').click();
  await expect(page).toHaveURL(/\/en\/discover\/$/);
  await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
});
```

- [ ] **Step 4: 写 filter 测试**

```ts
// e2e/filter.spec.ts
import { test, expect } from '@playwright/test';

test('pricing filter hides non-matching resource cards', async ({ page }) => {
  await page.goto('/resources/');
  const total = await page.locator('.resource-card').count();
  await page.locator('[data-filter="pricing"]').selectOption('free');
  const visible = await page.locator('.resource-card:visible').count();
  expect(visible).toBeLessThanOrEqual(total);
  await expect(page).toHaveURL(/pricing=free/);
});
```

- [ ] **Step 5: 写 a11y 测试**

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/discover/', '/resources/']) {
  test(`no critical a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });
}
```

- [ ] **Step 6: 安装浏览器并运行 E2E**

Run: `npx playwright install --with-deps chromium && npx playwright test`
Expected: 全部用例 PASS（smoke/i18n/filter/a11y）。

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "test: add e2e, i18n, filter, and a11y tests"
```

---

## Phase 7 — 设计还原（依赖 Claude Design 交付）

### Task 18: 用 Claude Design 定稿替换占位视觉

> **依赖：** Claude Design 已交付设计系统（token/色值/字体/三页版式），产物已放入仓库 `design/` 目录或以截图+规格形式提供。在交付物到位前**不要执行本任务**。执行时使用 `frontend-design` skill 保证还原质量。

**Files:**
- Modify: `src/styles/tokens.css`（替换为 Claude Design 的真实 token）
- Modify: `src/components/*.astro`、`src/layouts/BaseLayout.astro`、各 `src/pages/*`（按定稿调整结构样式类）
- Create: `src/styles/typography.css`（如定稿需要独立排版层）

- [ ] **Step 1: 用真实 token 替换 tokens.css**

把 Claude Design 导出的颜色（含五阶段最终色值）、字体、字号阶梯、间距、圆角、阴影、动效缓动写入 `src/styles/tokens.css`，保留变量名以免破坏现有引用；新增变量按需补充。验证浅色/深色两套都完整。

- [ ] **Step 2: 按定稿还原首页 bento/编辑式版式**

依据 Claude Design 的首页版式，调整 `src/pages/index.astro` 与 `src/pages/en/index.astro` 的结构与 class，落地 hero、五阶段入口、精选区、订阅区的真实布局与层级。仅改样式/结构，不改数据装配逻辑。

- [ ] **Step 3: 还原阶段页、文章页、组件样式**

按定稿还原 `[phase].astro`、`articles/[slug].astro`、`Nav`、`Footer`、`ArticleCard`、`ResourceCard`、`PhaseChip`、`ResourceFilter`、`NewsletterForm` 的观感（hover/focus/active 态、密度"标题留白/列表紧凑"、字体配对）。

- [ ] **Step 4: 引入字体资源**

按定稿引入字体（自托管或 `@fontsource`）；正文 Inter + 中文思源/系统栈兜底，标题字体定稿值。`font-display: swap`，仅 preload 关键字重。

- [ ] **Step 5: 运行构建与全部测试**

Run: `npm run check && npm run build && npx vitest run && npx playwright test`
Expected: 类型/构建/单测/E2E 全绿；a11y 无 critical 违规；对比度达标。

- [ ] **Step 6: 视觉回归截图**

Run: `npx playwright test --update-snapshots`（首次基线）
Expected: 在 320/768/1024/1440 为首页/阶段页/文章页生成基线截图，存入 `e2e/__screenshots__/`。

- [ ] **Step 7: Commit**

```bash
git add src/styles/ src/components/ src/layouts/ src/pages/ e2e/
git commit -m "feat: integrate Claude Design system and finalize visuals"
```

---

## 收尾

### Task 19: README 与最终验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 重写 README.md**

包含：项目简介、技术栈、本地开发命令（`npm install` / `npm run dev` / `npm run build` / `npm test` / `npm run test:e2e`）、内容贡献方式（如何新增双语文章/资源的 frontmatter 模板）、部署说明（GitHub Pages + 自定义域名 + 环境变量清单）。

- [ ] **Step 2: 全量验证**

Run: `npm run check && npm run build && npx vitest run && npx playwright test`
Expected: 全绿。

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add project readme and contribution guide"
```

---

## 备注：执行顺序与并行

- **Task 1–17、19** 不依赖 Claude Design，可立即按序执行（Phase 0→6 + 收尾验证）。
- **Task 18（设计还原）** 必须等 Claude Design 交付物到位后执行，插在 Task 17 之后、Task 19 之前最自然；也可在交付物就绪时随时插入。
- 占位视觉（Task 3 tokens + Task 13 结构）保证 Task 18 之前网站功能完整、可测、可部署。
