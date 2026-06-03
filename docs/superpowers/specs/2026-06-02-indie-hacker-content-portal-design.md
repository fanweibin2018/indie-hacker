# 独立开发者内容门户 · 设计文档（Design Spec）

- **日期**：2026-06-02
- **状态**：已通过 brainstorming，待用户最终审阅
- **代号**：indie-hacker-content-portal

---

## 1. 概述

面向独立开发者（indie hacker）的**双语内容知识门户**，围绕产品生命周期的五个阶段组织内容：需求挖掘、设计、开发、营销、商业分析。内容由**原创文章/指南**与**结构化资源/工具目录**两部分构成，二者交叉关联，形成"从想法到变现"的闭环知识库。

- **产品本质**：内容知识门户（非工具型 SaaS、非个人系统）
- **内容形态**：原创文章 + 资源目录（两者结合，交叉关联）
- **受众/语言**：中英双语（i18n），中文为默认语言
- **部署**：纯静态，GitHub Pages + 自定义域名
- **核心约束**：零后端、零数据库、低维护成本、内容即 Git 提交

### 非目标（Out of Scope，YAGNI）
- 不做用户账户 / 登录 / 个性化
- 不做服务端动态功能（搜索、评论、统计、订阅均用静态友好的第三方方案）
- 不做 CMS / 后台管理界面（内容用 Markdown + Git 维护）
- v1 不追求内容量，只追求**架构与功能完整**，并播种示例内容作为模板

---

## 2. 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | **Astro**（`output: 'static'`） | 内容站最佳：Content Collections 类型化、默认零 JS、设计自由 |
| 语言 | TypeScript | 类型安全 |
| 内容 | Markdown / MDX + Content Collections | frontmatter 由 Zod schema 校验 |
| 样式 | TailwindCSS + CSS 自定义属性（design tokens） | 设计自由度 + token 化，避免模板感 |
| i18n | Astro 内置 i18n 路由 | 中文默认无前缀，英文 `/en/` |
| 搜索 | Pagefind | 构建期生成索引，客户端加载，零后端 |
| 评论 | Giscus（GitHub Discussions） | 免费、无后端、契合开发者受众 |
| 统计 | Cloudflare Web Analytics | 隐私友好、无 cookie、免费 |
| 订阅 | Buttondown（嵌入式表单） | 对开发者友好、API 简洁、有免费额度 |
| RSS | `@astrojs/rss` | 默认内置，中英各一份 feed |
| 部署 | GitHub Actions → GitHub Pages | push 即构建发布 |

---

## 3. 信息架构

### 3.1 五阶段骨架
五个阶段既是顶层导航，也是内容分类轴：

| 阶段 | slug | 含义 | 标识色（语义化） |
|------|------|------|------------------|
| 需求挖掘 | `discover` | 找问题、验证需求、市场调研 | 待定（token） |
| 设计 | `design` | 产品 / UX / 视觉 / 原型 | 待定（token） |
| 开发 | `build` | 技术选型、工程实践、工具链 | 待定（token） |
| 营销 | `market` | 获客、内容、SEO、社区、增长 | 待定（token） |
| 商业分析 | `business` | 定价、商业模式、数据、财务 | 待定（token） |

> 五个标识色在实现阶段于 `tokens.css` 中定义为 CSS 自定义属性，用于色码导航、阶段标签与卡片强调，而非纯装饰。

### 3.2 两类核心内容（Content Collections）

**Collection: `articles`（原创文章 / 指南）**
```
title: string
description: string
phase: 'discover' | 'design' | 'build' | 'market' | 'business'
tags: string[]
lang: 'zh' | 'en'
pubDate: date
updatedDate?: date
draft: boolean (默认 false)
cover?: image
relatedResources?: string[]   // 指向 resources 的 slug
```

**Collection: `resources`（资源 / 工具目录）**
```
name: string
url: string
description: string
phase: 'discover' | 'design' | 'build' | 'market' | 'business'
category: string
tags: string[]
lang: 'zh' | 'en'
pricing: 'free' | 'freemium' | 'paid'
rating?: number
featured?: boolean
relatedArticles?: string[]    // 指向 articles 的 slug
```

### 3.3 交叉关联
- 文章可声明 `relatedResources`，在文章页渲染"本文用到的工具"。
- 资源可声明 `relatedArticles`，在资源条目反向列出相关文章。
- 两个 collection 通过 slug 互相指向，构成"一网打尽"闭环。
- 关联解析逻辑抽为独立工具函数（可单测）。

### 3.4 内容存储
- 所有内容为 **repo 内 Markdown/MDX 文件**，Git 提交即发布。
- 双语用**语言子目录**区分：每个 collection 下设 `zh/` 与 `en/` 子目录（如 `src/content/articles/zh/xxx.mdx`、`src/content/articles/en/xxx.mdx`）。同一内容的中英版本用相同的文件名 slug 配对，便于语言切换时定位对应页面。
- 无 CMS、无数据库。

---

## 4. 页面与路由

i18n 策略：中文默认（无前缀），英文 `/en/` 前缀镜像全部页面。

```
/                         首页（Landing：五阶段入口 + 精选文章/资源 + 价值主张）
/discover/ /design/ /build/ /market/ /business/
                          阶段页：上半为该阶段精选文章流，下半为可筛选资源网格
/articles/[slug]/         文章详情：正文 + 相关资源 + 评论 + 上/下篇
/resources/               全部资源总览：跨阶段筛选（阶段 / 分类 / 定价 / 标签）
/about/                   关于 / build-in-public 入口
/search/                  搜索结果页（Pagefind UI）
/rss.xml                  中文 RSS
/en/rss.xml               英文 RSS
/en/...                   以上所有页面的英文镜像
```

- **阶段页为主力页面**：文章区 + 可筛选资源卡片网格（按分类/定价/标签实时过滤，纯客户端）。
- 筛选状态尽量反映在 URL（search params），便于分享。

---

## 5. 配套功能接法（全部静态友好）

| 功能 | 方案 | 接入要点 |
|------|------|----------|
| 全文搜索 | Pagefind | 构建后扫描 HTML 生成索引；中英分别索引；客户端 UI |
| 评论 | Giscus | 基于**本仓库** GitHub Discussions，按文章 slug 映射话题；暗色同步 |
| 访问统计 | Cloudflare Web Analytics | 单段脚本，隐私友好、无 cookie |
| 邮件订阅 | Buttondown 嵌入表单 | 表单 POST 至 Buttondown，本站不存储数据 |
| RSS | `@astrojs/rss` | 中英各一份 feed |

- 所有第三方配置（Giscus repo/category id、CF token、Buttondown endpoint）集中在 `src/config/site.ts`；敏感值走环境变量 / GitHub Actions secrets，不硬编码。

---

## 6. 视觉设计方向

### 6.0 设计产出方式：Claude Design 交接（design-first）
视觉设计由 **Claude Design**（claude.ai/design，Anthropic Labs 的对话+画布设计工具）产出，工程实现由本仓库（Astro）完成，采用**交接式协作**：

```
用户在 Claude Design 出设计（首页/阶段页/文章页 + 设计系统）
  → 导出（优先：代码 / 设计 token；次选：截图 + 色值字体）
  → 交回本仓库
  → 在 Astro 中实现还原（实现阶段用 frontend-design skill 把关质量）
```

- **顺序：设计优先**。仓库当前为空，用户从文字设计简报（见 `docs/design-brief.md`）在 Claude Design 从零起稿，定稿后再写实现计划与搭建工程。
- writing-plans 阶段将"设计交接产物已就绪"作为实现前的依赖节点。
- 下述视觉方向（编辑式）是给 Claude Design 的**设计约束**，最终视觉以 Claude Design 定稿为准，但需符合这些约束。

### 6.1 视觉方向约束

**方向：编辑式 / 杂志感（Editorial）+ 克制的工程气质。** 内容站靠"读"取胜，编辑式排版建立权威感与信息层级，契合独立开发者硬核调性。拒绝模板感。

- **排版**：标题用有性格的字体（Space Grotesk / Sora 候选），正文用高可读无衬线（Inter）；中文走思源/系统字体栈兜底。双字体配对。
- **色彩**：浅色为主，**不默认暗色**；五阶段语义色用于色码导航与标签。提供深色模式作为可选项，两种皆有意图。
- **Design tokens**：颜色 / 字号（clamp 流式）/ 间距 / 动效缓动全部为 CSS 自定义属性，集中在 `tokens.css`。
- **动效**：仅 `transform` / `opacity`；尊重 `prefers-reduced-motion`。
- **布局**：首页用 bento / 编辑式分栏打破均匀网格；阶段页有明确标度对比与节奏。
- 满足 design-quality 规则：清晰层级、间距节奏、深度层叠、有性格排版、语义化色彩、设计过的 hover/focus/active 态。

---

## 7. 部署 / CI

- **GitHub Actions**：push 到 `main` → `astro check` → `astro build`（含 Pagefind 索引）→ 部署至 GitHub Pages。
- **自定义域名**：`public/CNAME` 写入域名；仓库 Pages 设置启用；强制 HTTPS。
- `astro.config` 的 `site` 按自定义域名配置，`base` 为根路径。
- DNS：在域名服务商添加 GitHub Pages 所需 A/AAAA 或 CNAME 记录（实现阶段提供具体值）。
- 敏感配置走 GitHub Actions secrets / repo variables。

---

## 8. 测试策略

- **类型 / 构建**：`astro check` + 构建必须绿。
- **内容校验**：Zod schema 即测试——脏 frontmatter 构建即失败。
- **单元（Vitest）**：工具函数（资源筛选逻辑、i18n helper、文章↔资源关联解析）。
- **E2E + 视觉（Playwright）**：首页 / 阶段页 / 文章页在 320 / 768 / 1024 / 1440 截图；校验搜索、筛选、语言切换、暗色切换。
- **可访问性**：axe 自动检查 + 键盘导航 + reduced-motion。
- **链接检查**：构建期校验内部链接与资源 URL。
- 覆盖率目标遵循通用规则（80%），视觉回归补充而非替代。

---

## 9. v1 交付范围

day 1 即完整跑通：
1. Astro + TS + Tailwind + i18n 工程骨架
2. 两个 Content Collections（articles / resources）+ Zod schema
3. 全部路由页面（首页、5 个阶段页、文章详情、资源总览、关于、搜索、RSS）+ 英文镜像
4. 四项配套功能（Pagefind 搜索、Giscus 评论、CF 统计、Buttondown 订阅）+ RSS
5. 编辑式视觉系统（tokens、双字体、五阶段色、深浅色）
6. GitHub Actions → GitHub Pages + 自定义域名链路
7. 测试套件（类型、单元、E2E/视觉、a11y）
8. **内容种子**：每阶段 1–2 篇示例文章 + 若干示例资源（双语），作为后续填充模板

后续迭代（v1 之后）：内容持续填充、更多筛选维度、合集/专题、可能的搜索增强等。

---

## 10. 关键决策记录

| 决策 | 选择 | 备注 |
|------|------|------|
| 产品本质 | 内容知识门户 | 非工具/非个人系统 |
| 内容形态 | 文章 + 资源目录，交叉关联 | — |
| 语言 | 中英双语，中文默认 | Astro i18n |
| 框架 | Astro | Content Collections + 静态 |
| 搜索 | Pagefind | 静态友好 |
| 评论 | Giscus（本仓库 Discussions） | — |
| 统计 | Cloudflare Web Analytics | 隐私友好 |
| 订阅 | Buttondown | 开发者友好 |
| 部署 | GitHub Pages + 自定义域名 | Actions CI |
| UI 设计产出 | Claude Design（design-first 交接） | 设计在 claude.ai/design 出稿，Astro 还原；见 `docs/design-brief.md` |
