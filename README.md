# 独立开发者路线图 · Indie Hacker Roadmap

双语内容知识门户，面向独立开发者，围绕产品生命周期五个阶段组织内容。
A bilingual (zh default + `/en/`) content knowledge portal for indie hackers, organized around five phases.

**线上地址 / Live:** [indieroadmap.com](https://indieroadmap.com)

---

## 五个阶段 / Five Phases

| 阶段 | 英文 | 说明 |
|------|------|------|
| 需求挖掘 | discover | 验证想法、市场调研 |
| 设计 | design | 原型、交互、视觉 |
| 开发 | build | 技术选型、开发实践 |
| 营销 | market | 增长、SEO、内容营销 |
| 商业 | business | 定价、支付、运营 |

每个阶段包含原创文章（guides）+ 精选资源目录（resource directory），两者双向交叉关联。
Each phase contains original articles and a filterable resource directory, cross-linked.

---

## 技术栈 / Tech Stack

| 类别 | 技术 |
|------|------|
| 框架 | [Astro 5](https://astro.build/) (static output) |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS 4 |
| 内容 | MDX + Astro Content Collections + Zod schema validation |
| 搜索 | [Pagefind](https://pagefind.app/) (static full-text) |
| 评论 | [Giscus](https://giscus.app/) (GitHub Discussions) |
| 统计 | Cloudflare Web Analytics |
| 邮件 | [Buttondown](https://buttondown.email/) newsletter |
| RSS | `@astrojs/rss` |
| 单元测试 | Vitest |
| E2E / A11y | Playwright + axe-core |
| 部署 | GitHub Pages via GitHub Actions |

---

## 本地开发 / Local Development

```bash
# 安装依赖
npm install

# 启动开发服务器 (localhost:4321)
npm run dev

# 构建 + 生成 Pagefind 搜索索引
npm run build

# 预览构建结果
npm run preview

# TypeScript 类型检查
npm run check

# 单元测试
npm test

# E2E 测试（首次运行先安装 Chromium）
npx playwright install chromium
npm run test:e2e
```

> E2E 项目使用基于 Chromium 的 Pixel 5 模拟器，安装一次 `chromium` 即可覆盖全部测试。

---

## 内容贡献指南 / Content Contribution Guide

### 文件路径规则 / File Paths

- 文章：`src/content/articles/{zh,en}/<phase>-<slug>.mdx`
- 资源：`src/content/resources/{zh,en}/<phase>-<slug>.md`

中英文版本共享同一个 slug（文件名相同，放在不同语言目录下）。
zh and en versions of an item share the same filename slug.

> **重要**：frontmatter 由 Zod 严格校验，字段缺失或类型错误会导致构建失败。

### 文章 frontmatter / Article Frontmatter

```yaml
---
title: 文章标题
description: 一句话摘要（用于 SEO 和卡片展示）
phase: discover        # discover | design | build | market | business
tags: [标签1, 标签2]
lang: zh               # zh | en
pubDate: 2026-01-01
updatedDate: 2026-06-01  # 可选
cover: /images/cover.jpg # 可选
draft: false           # true 时不发布
relatedResources:
  - discover-google-trends  # 关联资源的 slug（不含路径和扩展名）
---
```

### 资源 frontmatter / Resource Frontmatter

```yaml
---
name: 工具/资源名称
url: https://example.com
description: 简短描述（一句话）
phase: discover        # discover | design | build | market | business
category: 市场调研
tags: [标签1, 标签2]
lang: zh               # zh | en
pricing: free          # free | freemium | paid
rating: 4.5            # 可选，0-5
featured: false        # true 表示精选，展示在首位
relatedArticles:
  - discover-validate-demand  # 关联文章的 slug
---
```

---

## 项目结构 / Project Structure

```
src/
├── config/          # 站点配置 (site.ts) 和 UI 常量 (ui.ts)
├── i18n/            # 双语翻译字典
├── lib/             # 业务逻辑 (phases, filter, related, collections)
├── styles/          # CSS tokens、全局样式、组件样式
├── components/      # Astro 组件 (Nav, Footer, Cards, Filter, Comments…)
├── layouts/         # BaseLayout
├── pages/           # 路由页面（zh 默认 + /en/ 镜像）
│   ├── index.astro
│   ├── [phase].astro
│   ├── articles/
│   ├── resources.astro
│   ├── search.astro
│   ├── about.astro
│   ├── rss.xml.ts
│   └── en/          # English mirror routes
└── content/
    ├── articles/{zh,en}/   # MDX 文章内容
    └── resources/{zh,en}/  # MD 资源条目
```

---

## 部署 / Deployment

推送到 `main` 分支自动触发 `.github/workflows/deploy.yml`，执行 `astro check` → `astro build` → `pagefind` → 部署到 GitHub Pages。

### 一次性手动配置 / One-time Setup

**GitHub Pages:**

1. Repo Settings → Pages → Source = **GitHub Actions**
2. 添加自定义域名 `indieroadmap.com`；勾选 **Enforce HTTPS**

**Actions Variables** (Settings → Secrets and variables → Actions → Variables)：

以下变量均为可选；未设置时对应功能静默禁用：

| 变量名 | 用途 |
|--------|------|
| `PUBLIC_GISCUS_REPO` | Giscus 评论（`owner/repo`） |
| `PUBLIC_GISCUS_REPO_ID` | Giscus repo ID |
| `PUBLIC_GISCUS_CATEGORY` | Giscus discussion category |
| `PUBLIC_GISCUS_CATEGORY_ID` | Giscus category ID |
| `PUBLIC_CF_BEACON_TOKEN` | Cloudflare Web Analytics beacon |
| `PUBLIC_BUTTONDOWN_USER` | Buttondown newsletter 用户名 |

**DNS（apex 域名 `indieroadmap.com`）：**

```
# A records
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

# AAAA records
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**本地功能测试：**

```bash
cp .env.example .env
# 填入相关 token 后重启 dev server
```

---

## 设计说明 / Design Note

当前视觉是最小化占位样式，等待 Claude Design 集成后进行完整的视觉打磨。
设计规格和交付清单详见 [`docs/design-brief.md`](docs/design-brief.md)。

> Current visual design is an intentional placeholder pending Claude Design system integration.
> See `docs/design-brief.md` for the full design spec and handoff checklist.

---

## License

MIT
