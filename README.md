# 🍵 灵犀茶馆 — 多板块同列对比看盘

> 心有灵犀 谈笑间 众生皆有回响 ｜ 味归平淡 静思处 乾坤尽纳一盏

纯前端股票看盘工具，零预设数据，用户自行配置板块和股票。
实时行情来自新浪/腾讯 API，多端同步通过 GitHub API 手动上传/下载。

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
| 🔍 **智能搜索** | 内置 7214 只 A 股全量数据，本地搜索秒级响应 |
| ☁️ **云端同步** | 手动上传/下载，数据持久化到 GitHub 仓库 `boards.json` |
| 💾 **本地持久化** | localStorage 缓存，离线可用 |
| 🌙 **暗色/亮色主题** | 一键切换，持久化保存 |
| 📱 **响应式设计** | 自适应桌面和移动端 |

---

## 🚀 在线体验

**https://leowanglei-bit.github.io/stock-dashboard/**

---

## 🖥️ 本地开发

```bash
git clone https://github.com/leowanglei-bit/stock-dashboard.git
cd stock-dashboard
npm install
npm run dev      # http://localhost:5173
```

构建生产版本：

```bash
npm run build    # 产物在 dist/
```

---

## ☁️ 多端同步方案

数据存于 GitHub 仓库 `data/boards.json`，通过 **GitHub Repository API** 读写。

```
用户点击「上传」→ PUT /repos/.../contents/boards.json → 压缩格式写入
用户点击「下载」→ GET raw.githubusercontent.com/.../boards.json → 展开后覆盖本地
```

### 需要做的步骤

1. 去仓库 **Settings → Secrets and variables → Actions** 添加 `GH_PAT` 密钥
2. Token 在部署时通过 `VITE_GH_TOKEN` 注入前端，用于 API 认证
3. 部署后点击顶部 **☁⬆ 上传数据** / **☁⬇ 下载数据** 同步

> 注：无自动同步，需用户手动点击上传/下载。

---

## 🏗️ 项目结构

```
src/
├── components/
│   ├── Navbar.tsx           # 顶部导航栏
│   ├── SectionGroup.tsx     # 板块网格容器
│   ├── BoardCard.tsx        # 板块卡片（标题/折叠/涨跌统计）
│   ├── StockRow.tsx         # 股票行（价格/涨跌幅/闪烁动画）
│   ├── AddStockForm.tsx     # 搜索添加股票
│   ├── Modal.tsx            # 确认弹窗
│   └── ToastContainer.tsx   # 消息通知
├── data/
│   ├── apiClient.ts         # GitHub API 同步（压缩/展开）
│   ├── sinaApi.ts           # 新浪/腾讯实时行情 API
│   ├── stockSearchDb.ts     # 股票搜索（内置 + API 兜底）
│   ├── fullStocks.ts        # 7214 只全量 A 股数据
│   └── utils.ts             # 工具函数
├── hooks/
│   ├── useLocalStorage.ts   # localStorage 持久化
│   ├── useRealtimePrices.ts # 定时拉取行情
│   └── useToast.ts          # 通知提示
├── types/index.ts           # 类型定义
├── App.tsx                  # 主应用
├── App.module.css
├── index.css                # 全局样式 + 主题变量
└── main.tsx                 # 入口
```

---

## 🎨 设计细节

### 数据流

```
实时行情
  新浪 API / 腾讯 API → 解析报价 → 更新股价（每 3/5/10/30 秒）

云端同步（仅手动）
  上传 → 压缩（去掉价格、缩短字段）→ PUT GitHub API
  下载 → GET GitHub raw → 展开（补全民数据）→ 覆盖本地

持久化
  板块/股票结构 → localStorage（key: stock_boards, stock_board_order）
  主题/间隔 → localStorage（key: stock_theme_mode, stock_interval）
```

### 股票数据库

内置 **7214 只 A 股**（沪主板、深主板、创业板、科创板、北交所），
搜索仅使用内存数据，不依赖外部网络。可通过脚本更新：

```bash
python3 scripts/gen_stock_db.py > src/data/fullStocks.ts
```

### 压缩存储格式

`boards.json` 使用压缩格式存储，节省约 70% 体积：

```json
// upload 时自动压缩
{ "b": { "brd-1": { "t": "标题", "s": [{"c":"600036","n":"招行","m":0}] } }, "o":[...] }
// download 后自动展开为标准格式
```

---

## 📄 License

MIT
