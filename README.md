# 🍵 灵犀茶馆 — 多板块同列对比看盘

> 心有灵犀 谈笑间 众生皆有回响 ｜ 味归平淡 静思处 乾坤尽纳一盏

自定义板块、实时行情、拖拽排序、涨跌统计的股票看盘工具。

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🗂️ **板块卡片** | 多列响应式网格布局，同时查看多个板块 |
| 🔄 **板块排序** | 长按标题栏拖拽，随意调整板块顺序 |
| 📊 **涨跌统计** | 每个板块显示涨跌加数比例 `x:y` + 均涨幅 |
| 🎯 **实时行情** | 新浪/腾讯双 API 获取实时价格，自动切换 |
| 🌙 **暗色/亮色主题** | 一键切换，持久化保存 |
| 🌐 **中美涨跌色** | 中国红涨绿跌 / 美国绿涨红跌一键切换 |
| 🔍 **智能搜索** | 内置 200+ 主流 A 股 + 后台自动拉取全量缓存 |
| 💾 **本地持久化** | 所有数据存 localStorage，无需登录即开即用 |
| 📱 **响应式设计** | 自适应桌面和移动端 |
| 🔽 **折叠板块** | 点击标题前 `▼` 折叠/展开板块内容 |

---

## 🚀 快速开始

```bash
git clone https://github.com/leowanglei-bit/stock-dashboard.git
cd stock-dashboard
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可。

构建生产版本：

```bash
npm run build    # 产物在 dist/
```

---

## 🌐 部署到 GitHub Pages

1. 创建 GitHub 仓库，推送代码
2. **Settings → Pages → Source** 选择 **GitHub Actions**
3. 推送 `main` 分支自动构建部署

---

## 🏗️ 技术栈

| 技术 | 用途 |
|------|------|
| **Vite + React 18 + TypeScript** | 前端框架 |
| **CSS Modules + Custom Properties** | 样式隔离 + 主题 |
| **Sina / Tencent API** | 实时行情双源 |
| **HTML5 Drag & Drop** | 拖拽排序 |
| **localStorage** | 数据持久化 |

---

## 📁 项目结构

```
src/
├── components/
│   ├── Navbar.tsx           # 顶部导航栏（状态 + 控件）
│   ├── SectionGroup.tsx     # 板块网格容器（含拖拽排序）
│   ├── BoardCard.tsx        # 板块卡片（标题/折叠/涨跌统计/股票列表）
│   ├── StockRow.tsx         # 单只股票行（价格/涨跌幅/闪烁动画）
│   ├── AddStockForm.tsx     # 搜索添加股票
│   ├── Modal.tsx            # 确认弹窗
│   └── ToastContainer.tsx   # 消息通知
├── data/
│   ├── sinaApi.ts           # 新浪/腾讯行情 API + 全量股票拉取
│   ├── stockSearchDb.ts     # A 股搜索数据库（内置 + API 缓存）
│   └── utils.ts             # 工具函数
├── hooks/
│   ├── useLocalStorage.ts   # localStorage 持久化
│   ├── useRealtimePrices.ts # 定时拉取 + 刷新行情
│   └── useToast.ts          # 消息通知
├── types/
│   └── index.ts             # 类型定义
├── App.tsx                  # 主应用
├── index.css                # 全局样式 + 主题变量
└── main.tsx                 # 入口
```

---

## 🎨 设计细节

### 主题系统

CSS 自定义属性实现完整暗/亮主题切换：

```css
:root {
  --background: #060913;
  --primary: #6366f1;
  --rise-color: #ef4444;  /* 红涨 */
  --fall-color: #10b981;  /* 绿跌 */
}
body.theme-light { /* ... */ }
body.color-mode-us {
  --rise-color: #10b981;  /* 绿涨 */
  --fall-color: #ef4444;  /* 红跌 */
}
```

### 数据流

```
新浪 API ──┐
           ├─→ 解析报价 → 合并更新 → 显示
腾讯 API ──┘
                ↕
         localStorage 持久化
```

### 股票数据库

| 层级 | 覆盖 | 更新频率 |
|------|------|---------|
| 内置 | 200+ 主流 A 股 | 随代码发布 |
| API 缓存 | 全量 A 股 ~5000 只 | 每次启动自动拉取 |

---

## 📄 License

MIT
