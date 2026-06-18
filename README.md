# 📊 智股看板 — 多板块同列对比看盘系统

> 高颜值、多板同列的股票自选分析工具。支持自定义板块、股票拖拽排序、实时价格模拟更新。

![智股看板截图](./screenshot.png)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🗂️ **板块同列对比** | 卡片式多列横向布局，同时查看和对比多个股票板块 |
| 📦 **分组管理** | 创建分组管理板块，支持折叠、显示分组均涨幅 |
| 🔄 **拖拽排序** | 板块内自由排序 + **跨板块拖动**，直观调整布局 |
| 🎯 **模拟价格更新** | 定时模拟股票价格波动，红绿渐变闪烁反馈 |
| 🌙 **暗色/亮色主题** | 深色为主，支持一键切换亮色主题，持久化保存 |
| 🌐 **中美涨跌色** | 中国（红涨绿跌）/ 美国（绿涨红跌）配色一键切换 |
| 🔍 **智能搜索添加** | 输入名称或代码搜索股票，下拉选择添加 |
| 💾 **本地持久化** | 所有数据保存到浏览器 localStorage，无需登录即开即用 |
| 📱 **响应式设计** | 自适应桌面和移动端 |

---

## 🚀 快速开始

### 在线体验

项目部署后即可访问在线版本（见下方部署说明）。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可访问。

### 构建生产版本

```bash
npm run build
npm run preview
```

构建产物在 `dist/` 目录。

---

## 🌐 部署到 GitHub Pages

### 方案一：自动部署（推荐）

1. 在 GitHub 上创建仓库并推送代码
2. 进入仓库 **Settings → Pages**，在 **Source** 选择 **GitHub Actions**
3. 推送代码到 `main` 分支，GitHub Actions 自动构建部署

### 方案二：手动部署

```bash
npm run build
```

将 `dist/` 目录内容上传到 GitHub Pages 或任何静态托管服务。

### 自定义域名

如使用自定义域名，修改 `vite.config.ts` 中的 `base` 配置：

```ts
export default defineConfig({
  plugins: [react()],
  base: '/', // 自定义域名用 '/'
  // 或 base: '/repo-name/'  // 子路径部署
})
```

---

## 🏗️ 技术栈

| 技术 | 用途 |
|------|------|
| **Vite** | 构建工具 |
| **React 18** | UI 框架 |
| **TypeScript** | 类型安全 |
| **CSS Modules** | 样式隔离 |
| **CSS Custom Properties** | 主题变量 |
| **HTML5 Drag & Drop API** | 拖拽功能 |
| **localStorage** | 数据持久化 |

---

## 📁 项目结构

```
stock-dashboard/
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 自动部署
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # 顶部导航栏
│   │   ├── SectionGroup.tsx    # 分组管理
│   │   ├── BoardCard.tsx       # 板块卡片
│   │   ├── StockRow.tsx        # 股票行
│   │   ├── AddStockForm.tsx    # 搜索添加股票
│   │   ├── Modal.tsx           # 确认弹窗
│   │   └── ToastContainer.tsx  # 消息通知
│   ├── data/
│   │   ├── mockStocks.ts       # 预设股票数据库
│   │   └── utils.ts            # 工具函数
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # localStorage 持久化
│   │   ├── usePriceSimulation.ts # 价格模拟
│   │   └── useToast.ts         # 消息通知
│   ├── types/
│   │   └── index.ts            # 类型定义
│   ├── App.tsx                 # 主应用
│   ├── App.module.css
│   ├── main.tsx                # 入口
│   └── index.css               # 全局样式 + 主题变量
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎨 设计细节

### 主题系统

使用 CSS 自定义属性实现完整的暗/亮主题切换：

```css
:root {
  --background: #060913;
  --foreground: #f8fafc;
  --primary: #6366f1;
  --secondary: #ec4899;
  /* ... */
}
body.theme-light {
  --background: #f8fafc;
  --foreground: #0f172a;
  /* ... */
}
```

### 涨跌配色

- **A股模式**：🔴 红色 = 上涨，🟢 绿色 = 下跌
- **美股模式**：🟢 绿色 = 上涨，🔴 红色 = 下跌

价格变化时伴有闪烁动画反馈。

### 数据模型

```typescript
Section { id, title, boards: string[], collapsed }
Board   { id, title, stocks: Stock[] }
Stock   { id, code, name, market, price, prevClose, changePercent }
```

---

## 🧠 灵感来源

本项目的设计灵感来源于 [stock.programnotes.cn/dashboard](https://stock.programnotes.cn/dashboard) —— 一个高颜值的多板块股票同列分析看板。

---

## 📄 License

MIT
