# 🍵 灵犀茶馆 — 多板块同列对比看盘

> 心有灵犀 谈笑间 众生皆有回响 ｜ 味归平淡 静思处 乾坤尽纳一盏

纯前端股票看盘工具，零预设数据。实时行情来自新浪/腾讯双 API，
多端数据通过 Supabase 自动同步，无需任何手动操作。

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🗂️ **板块卡片** | 多列响应式网格布局，同时查看多个板块 |
| 🔄 **板块排序** | 长按标题栏拖拽，随意调整板块顺序 |
| 🔽 **折叠板块** | 点击标题前 `▼` 折叠/展开板块内容 |
| 📊 **涨跌统计** | 每个板块显示涨跌加数比例 `x:y` + 均涨幅 |
| 📈 **涨跌幅排序** | 板块内股票按当日涨跌幅从高到低排列 |
| 🎯 **实时行情** | 新浪/腾讯双 API 获取实时价格，自动切换 |
| 🔍 **智能搜索** | 全量 A 股清单（约 5200 只）放服务器、按需下发，搜索秒回 |
| ☁️ **云端同步** | Supabase 自动保存 + 15 秒轮询，多端数据一致 |
| 💾 **本地持久化** | localStorage 缓存，离线可用 |
| 🌙 **暗色/亮色主题** | 一键切换，持久化保存 |
| 📱 **响应式设计** | 自适应桌面和移动端 |

---

## 🚀 在线体验

**https://leowanglei-bit.github.io/stock-dashboard/**

---

## 🖥️ 技术栈

| 层 | 选型 |
|:---|:---|
| 框架 | **Next.js 16（App Router，`output: 'export'` 静态导出）** ＋ React 19 ＋ TypeScript；4 个静态路由：`/` 自选、`/broad` 宽基估值、`/settings` 设置、`/about` 关于 |
| 布局 | 全局顶栏（对标 etf.maxmeng.top：汉堡 + 品牌 + 消息 + 个人中心）＋ 左侧导航（桌面可折叠、≤900px 收成抽屉）＋ 仅「自选」页的行情工具条；状态由 `src/App.tsx` 的 `DashboardProvider` 跨路由共享 |
| UI | **Ant Design 6**（cssinjs 主题，`ConfigProvider` 跟随暗/亮主题）＋ **Tailwind CSS 3**（颜色全部映射到 `src/index.css` 的 CSS 变量）＋ CSS Modules |
| 字体 | `next/font/local` 自托管 Inter（不依赖 Google Fonts） |
| 数据 | `@supabase/supabase-js`（浏览器端直连）＋ 新浪/腾讯行情 API ＋ **静态数据集放服务器**：`public/data/stocks.json`（A 股清单）、`public/data/index-valuation.json`（宽基估值，`npm run refresh:valuation` 生成）；两者都**不打包进 JS**，页面运行时按需取 |
| 部署 | GitHub Actions → `next build` → 上传 `out/` → GitHub Pages（项目子路径 `/stock-dashboard/`） |

---

## 🖥️ 本地开发

```bash
git clone https://github.com/leowanglei-bit/stock-dashboard.git
cd stock-dashboard
npm install
npm run dev      # http://localhost:3000
```

构建生产版本（静态导出）：

```bash
npm run build                                     # 产物在 out/
NEXT_PUBLIC_BASE_PATH=/stock-dashboard npm run build   # 构建 GitHub Pages 子路径版
npm run preview                                   # 本地静态预览 out/：http://localhost:4173
```

---

## ☁️ 多端同步

### 架构

```
浏览器操作 → auto-save(2s) → Supabase
                   ↓
其他浏览器 ← poll(15s) ← Supabase
```

**自动完成，无需点击任何按钮。**

| 时机 | 行为 |
|:----|:------|
| 添加/删除/拖拽股票 | 2 秒后自动写入 Supabase |
| 其他设备 | 15 秒内自动检测变更并合并到本地 |
| 页面刷新 | 启动时自动加载云端最新数据 |

### 部署前需要的设置

1. 在 **https://supabase.com** 创建免费项目
2. SQL Editor 中执行 `server/supabase.sql`
3. 去仓库 **Settings → Secrets → Actions** 添加两个 Secret：

| Name | Value |
|:----|:------|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public key |

> 新变量名为 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`；
> 工作流做了兼容：同名的 `NEXT_PUBLIC_*` 优先，回落到旧的 `VITE_*`，故现有 Secret 无需改名。

4. 推送代码后自动部署，同步生效

---

## 🏗️ 项目结构

```
app/                         # Next.js App Router
├── layout.tsx               # 全局布局：Inter 字体、metadata、AntdRegistry、AppShell
├── page.tsx                 # / 自选（板块网格）
├── settings/page.tsx        # /settings 设置（行情、外观、数据）
├── about/page.tsx           # /about 关于
├── not-found.tsx            # 404
├── globals.css              # Tailwind 指令 + 引入 src/index.css
└── fonts/                   # 自托管 Inter woff2
next.config.ts               # output:'export'、basePath/assetPrefix、trailingSlash
tailwind.config.mjs          # Tailwind 3，颜色映射到既有 CSS 变量
postcss.config.mjs           # postcss-import + tailwindcss + autoprefixer

src/
├── App.tsx                  # DashboardProvider：全部业务状态（板块/行情/同步/主题）
├── store/context.ts         # 上述状态的 Context 与 useDashboard()
├── components/
│   ├── AppShell.tsx         # 外壳：左侧导航 + 内容区 + 全局弹窗/提示
│   ├── SiteHeader.tsx       # 全局顶栏：汉堡 + 品牌 + 消息（Popover）+ 个人中心（Dropdown）
│   ├── BoardToolbar.tsx     # 「自选」页工具条：行情状态 / 间隔 / 暂停 / 主题 / 刷新 / 新增板块
│   ├── SectionGroup.tsx     # 板块网格容器
│   ├── BoardCard.tsx        # 板块卡片
│   ├── StockRow.tsx         # 股票行
│   ├── AddStockForm.tsx     # 搜索添加股票（antd Input/Button/Empty）
│   ├── Modal.tsx            # 确认弹窗（antd Modal 封装）
│   └── ToastContainer.tsx   # 消息通知
├── data/
│   ├── apiClient.ts         # Supabase 同步
│   ├── boardsCompress.ts    # 数据压缩/展开
│   ├── sinaApi.ts           # 实时行情 API
│   ├── stockSearchDb.ts     # 股票搜索（运行时取服务器清单）
│   └── utils.ts             # 工具函数
├── lib/
│   ├── supabase.ts          # Supabase 客户端（NEXT_PUBLIC_* 环境变量）
│   ├── dataSource.ts        # 数据集取数（DATA_BASE + 并发去重）
│   └── assets.ts            # basePath 前缀 + SITE_ICON（public/Icon-60@3x.png）
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useRealtimePrices.ts
│   └── useToast.ts
├── types/index.ts
├── index.css                # 主题 CSS 变量 + CSS Modules 之外的全局样式
└── App.module.css
```

---

## 🎨 设计细节

### 数据流

```
实时行情
  新浪 API → 解析报价 → 更新股价（每 3/5/10/30 秒）
  腾讯 API →（自动备用）

云端同步（自动）
  增删改 → 防抖 2s → compress() → Supabase upsert
  轮询  → 每 15s → Supabase select → expand() → 合并到本地

持久化（离线兜底）
  板块/股票 → localStorage（stock_boards, stock_board_order）
  主题/间隔 → localStorage（stock_theme_mode, stock_interval）

静态数据集（服务器，不进 JS bundle）
  data/stocks.json          → 打开「添加股票」时预取（140 KB / gzip 48 KB），取回常驻内存
  data/index-valuation.json → 「宽基」页运行时取（4 KB）
  换服务器：NEXT_PUBLIC_DATA_BASE_URL 指向对象存储/CDN 的公开目录（需同名文件），前端代码不动
```

### 股票数据库

全量 A 股清单放**服务器**（`public/data/stocks.json`，约 5200 只），构建产物里不含这批数据：
打开「添加股票」时预取，取回常驻内存，搜索秒回；清单未命中再退到新浪 suggest 接口兜底。
更新清单（在项目根目录）：

```bash
python3 scripts/gen_stock_db.py            # 直接写 public/data/stocks.json
```

板块（沪主板/深主板/创业板/科创板）由代码前缀唯一推导，不从接口沿用——历史数据里
688/300 被同时标成 sh/sz 与 star/chinext，同一只股票会搜出两条。当前清单无北交所标的，
北交所代码走接口兜底。

### 压缩存储格式

数据上传前自动压缩，节省约 70% 体积，加载时自动展开：

```json
{ "b": { "brd-1": { "t": "标题", "s": [{"c":"600036","n":"招商银行","m":0}] } }, "o":[] }
```

---

## 📄 License

MIT
