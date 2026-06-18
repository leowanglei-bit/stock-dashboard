/**
 * 预设股票数据库 — 用于搜索添加功能
 * 包含常见 A 股 + 热门板块股票
 */
export interface StockEntry {
  code: string;
  name: string;
  market: 'sh' | 'sz' | 'star' | 'chinext' | 'bse';
}

export const STOCK_DATABASE: StockEntry[] = [
  // === 光模块 / 通信 ===
  { code: '300308', name: '中际旭创', market: 'chinext' },
  { code: '300394', name: '天孚通信', market: 'chinext' },
  { code: '300502', name: '新易盛', market: 'chinext' },
  { code: '301205', name: '联特科技', market: 'chinext' },
  { code: '000063', name: '中兴通讯', market: 'sz' },
  { code: '600487', name: '亨通光电', market: 'sh' },
  { code: '600703', name: '三安光电', market: 'sh' },
  { code: '603236', name: '移远通信', market: 'sh' },

  // === 半导体 / 芯片 ===
  { code: '688981', name: '中芯国际', market: 'star' },
  { code: '603986', name: '兆易创新', market: 'sh' },
  { code: '002371', name: '北方华创', market: 'sz' },
  { code: '688012', name: '中微公司', market: 'star' },
  { code: '300661', name: '圣邦股份', market: 'chinext' },
  { code: '002049', name: '紫光国微', market: 'sz' },
  { code: '600584', name: '长电科技', market: 'sh' },
  { code: '688008', name: '澜起科技', market: 'star' },
  { code: '300782', name: '卓胜微', market: 'chinext' },
  { code: '603501', name: '韦尔股份', market: 'sh' },
  { code: '688256', name: '寒武纪', market: 'star' },

  // === AI / 人工智能 ===
  { code: '603019', name: '中科曙光', market: 'sh' },
  { code: '300624', name: '万兴科技', market: 'chinext' },
  { code: '688111', name: '金山办公', market: 'star' },
  { code: '002230', name: '科大讯飞', market: 'sz' },
  { code: '688327', name: '云从科技', market: 'star' },
  { code: '300418', name: '昆仑万维', market: 'chinext' },
  { code: '002602', name: '世纪华通', market: 'sz' },

  // === 新能源 / 汽车 ===
  { code: '300274', name: '阳光电源', market: 'chinext' },
  { code: '600438', name: '通威股份', market: 'sh' },
  { code: '601012', name: '隆基绿能', market: 'sh' },
  { code: '300750', name: '宁德时代', market: 'chinext' },
  { code: '002594', name: '比亚迪', market: 'sz' },
  { code: '601689', name: '拓普集团', market: 'sh' },
  { code: '688005', name: '容百科技', market: 'star' },
  { code: '300014', name: '亿纬锂能', market: 'chinext' },
  { code: '600196', name: '复星医药', market: 'sh' },

  // === 金融 ===
  { code: '600036', name: '招商银行', market: 'sh' },
  { code: '601318', name: '中国平安', market: 'sh' },
  { code: '600030', name: '中信证券', market: 'sh' },
  { code: '300059', name: '东方财富', market: 'chinext' },
  { code: '601211', name: '国泰君安', market: 'sh' },
  { code: '600519', name: '贵州茅台', market: 'sh' },
  { code: '000858', name: '五粮液', market: 'sz' },

  // === 互联网 ===
  { code: '300033', name: '同花顺', market: 'chinext' },
  { code: '002555', name: '三七互娱', market: 'sz' },
  { code: '300315', name: '掌趣科技', market: 'chinext' },
  { code: '688343', name: '云天励飞', market: 'star' },

  // === 消费电子 ===
  { code: '002475', name: '立讯精密', market: 'sz' },
  { code: '601138', name: '工业富联', market: 'sh' },
  { code: '002241', name: '歌尔股份', market: 'sz' },

  // === 机器人 / 自动化 ===
  { code: '300124', name: '汇川技术', market: 'chinext' },
  { code: '688160', name: '步科股份', market: 'star' },
  { code: '002747', name: '埃斯顿', market: 'sz' },
  { code: '300607', name: '拓斯达', market: 'chinext' },

  // === 港股热门 (模拟用) ===
  { code: '0700', name: '腾讯控股', market: 'sh' },
  { code: '9988', name: '阿里巴巴', market: 'sh' },
  { code: '03690', name: '美团', market: 'sh' },
];

export function searchStocks(query: string): StockEntry[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return STOCK_DATABASE.filter(
    (s) =>
      s.code.includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.name.includes(q)
  ).slice(0, 15);
}

export function findStock(code: string): StockEntry | undefined {
  return STOCK_DATABASE.find((s) => s.code === code);
}
