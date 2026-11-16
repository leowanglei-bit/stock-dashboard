# AGENTS.md — stock-dashboard

> 本文件供 AI agent 与协作者阅读。所有命令与基线均为**实测记录**，不是推测。
> 基线采集：2026-10-22，macOS 26.6.2（Vite 时代）；2026-11-16 迁移到 Next.js 后重测。
> **维护约定**：只在①门禁数字变 ②目录/路由结构变 ③约束或禁改区变 时更新本文件；
> 文案、样式、组件内部实现与踩坑过程一律不写这里（写代码注释）。文档改动单独用 `docs:` 提交。

## 1. 这是什么

股票看板。纯前端（浏览器端直连 Supabase ＋ 新浪/腾讯行情 API），静态导出后部署到 GitHub Pages。
仓库里另有 `server/`（历史遗留的 Python 本地服务），前端构建与部署**不依赖**它。

## 2. 技术栈

- 框架：**Next.js 16 App Router ＋ React 19 ＋ TypeScript**，`output: 'export'`（纯静态，**没有** Node 运行时、没有 SSR/ISR/Server Actions）
- UI：**Ant Design 6**（cssinjs 运行时注入，主题由 `ConfigProvider` 控制）＋ **Tailwind CSS 3**（颜色全部映射到 `src/index.css` 的 CSS 变量）＋ 既有 CSS Modules
- 字体：`next/font/local` 自托管 Inter（`app/fonts/*.woff2`），构建与运行都不访问 Google Fonts
- 数据：`@supabase/supabase-js`、`src/data/sinaApi.ts`（新浪/腾讯行情）、`src/data/indexValuation.json`
  （宽基估值，由 `npm run refresh:valuation` 跑 `scripts/fetch_index_valuation.mjs` 从蛋卷接口生成；
  页面不请求外网，改数据要重跑脚本并提交 JSON）
- 工具链：`eslint`（flat config）＋ `typescript-eslint`
- 部署：GitHub Actions → `next build` → 上传 `out/` → GitHub Pages（子路径 `/stock-dashboard/`）
- **已移除（2026-11-16 Vite 清理，见 git 历史）**：`index.html`、`vite.config.ts`、`src/main.tsx`、
  `tsconfig.app.json`、`tsconfig.node.json`，以及 devDependencies 里的 `vite` / `@vitejs/plugin-react`
- `next-env.d.ts` 由 Next 自动生成：`next dev` 会把它改成 `.next/dev/types/...`、`next build` 又改回
  `.next/types/...` ⇒ 跑完 dev 后 `git status` 出现这一行改动是正常的，**不要手工编辑**，也不必提交

## 3. 目录

```
app/            layout.tsx（AppShell 外壳）/ page.tsx（/ 自选）/ settings/ / about/ / not-found.tsx
                globals.css / fonts
src/            App.tsx（DashboardProvider：全部业务状态）
                store/context.ts（Context + useDashboard）
                components/（AppShell 外壳、SiteHeader 全局顶栏、BoardToolbar 自选页工具条、
                             SectionGroup、BoardCard、StockRow、AddStockForm、Modal、ToastContainer）
                hooks/ lib/ types/ data/ index.css / App.module.css
server/         app.py ＋ data.db ＋ requirements.txt ＋ supabase.sql（历史遗留，未参与构建）
scripts/        构建与辅助脚本
data/           boards.json（4 KB，小型兜底数据）
out/            静态导出产物（勿手改，git 忽略）
next.config.ts / tailwind.config.mjs / postcss.config.mjs / tsconfig.json / eslint.config.js
```

## 4. 门禁（改完必跑）

```bash
npm run build                 # = next build（静态导出到 out/）
npm run lint                  # = eslint .
```

取退出码不要接管道：`npm run build > /tmp/b.log 2>&1; echo EXIT=$?`

### 基线（2026-11-16 迁移后实测）

| 命令 | 结果 |
|---|---|
| `npm run build` | **EXIT=0** ✅（`output: 'export'`，产物在 `out/`；默认与 `NEXT_PUBLIC_BASE_PATH=/stock-dashboard` 两种模式均通过） |
| `npm run lint` | **EXIT=1**，**16 errors / 0 warnings**（迁移前基线 21；多路由改造后仍无新增，且因 `no-unused-vars` 改为忽略 `_` 前缀参数而下降） |

**所以 build 是绿的、lint 是红的（历史债务）。** 已知错误类型：
`@typescript-eslint/no-explicit-any`（集中在 `src/data/*` 与 `src/lib/supabase.ts`）、
`react-hooks/refs`（`src/hooks/useRealtimePrices.ts` 在 render 期写 ref）、`no-useless-assignment`。

**lint 的判据是「不新增错误」，不是「归零」。** 动手前先记下失败条数（当前 **16**）与失败规则名；
改完只允许这组数字变小或不变。顺手修掉的要同步下调基线，否则下次会漏判。

## 5. 本地起服务

```bash
npm run dev                                       # next dev，默认 http://localhost:3000
npm run build && npm run preview                  # 静态预览 out/：http://localhost:4173
NEXT_PUBLIC_BASE_PATH=/stock-dashboard npm run build   # 构建 Pages 子路径版
```

GitHub Pages 走子路径时资源前缀靠 `NEXT_PUBLIC_BASE_PATH` 注入 `basePath`/`assetPrefix`；
**本地 dev 不要设这个变量**，否则资源会 404。

## 6. 禁改区

| 路径 | 原因 |
|---|---|
| `out/**`、`.next/**` | 构建产物 |
| `data/boards.json` | 兜底数据，改动前先确认来源与影响面（只有 4 KB，可能是手工维护的清单） |
| Supabase 集成（`src/lib/supabase.ts`、`server/supabase.sql`） | **不得擅自移除或替换 Supabase**——用户明示：移除前必须先问 |
| `app/fonts/*.woff2` | 字体二进制，替换需同步 `app/layout.tsx` 的 `localFont` 声明 |

## 7. 已知约束

- 无单元测试（**没有** test 脚本），验收 = build（必过）＋ lint（不新增）＋ 目标页面手点一遍
- **业务状态只有一处**：`src/App.tsx` 的 `DashboardProvider`（板块、行情、Supabase 同步、主题）。
  页面只能通过 `useDashboard()` 读取与操作；**不要**在页面里另起 state 存板块数据，
  否则切路由会重建、行情轮询会重复。
- **新增页面＝两处**：建 `app/<name>/page.tsx`，并在 `src/components/AppShell.tsx` 的 `NAV` 里加一项
  （图标 + `href` + 文案）；侧栏高亮按 `usePathname()` 精确匹配 `href`。
- **UI 归属**：`SiteHeader`＝全局顶栏（汉堡 / 品牌 / 消息 / 个人中心，全路由一致，只放站点级入口）；
  `BoardToolbar`＝「自选」页工具条（行情 / 刷新类按钮），只由 `app/page.tsx` 渲染，别加进 SiteHeader。
- **布局与侧栏**：外壳纵向——顶栏是第一行、横贯整宽，`.body` 才是「侧栏 + 内容」的横向容器；
  折叠侧栏＝不渲染 `<aside>`，别用 CSS 压宽度（品牌在顶栏，侧栏没有 logo 行）。
- **静态资源**：`public/Icon-60@3x.png` 是站点图标与顶栏 logo 的唯一来源，路径走
  `src/lib/assets.ts` 的 `SITE_ICON`/`asset()`（裸 `<img>` 不带 `basePath`，子路径部署会 404）。
- 业务状态读 localStorage（板块、主题、刷新间隔），必须**水合后**再渲染：`AppShell` 用
  `useSyncExternalStore` 判断客户端，首屏只吐一个 loading 占位。别把 provider 挪到预渲染路径上，
  否则静态导出会因 `localStorage` 未定义而失败。
- antd 样式是 cssinjs 运行时注入，**外部 CSS 覆盖 `.ant-*` 常常失效**（优先级/注入顺序），
  要改组件外观优先用组件 props（如 `Modal` 的 `styles.container`）
- 主题色只有一处真源：`src/index.css` 的 CSS 变量；Tailwind 与 antd token 都映射到它，别另起一套色板
- 前端与 `server/` 是两个独立进程，改动跨端时两端都要起一遍，别只验前端

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
