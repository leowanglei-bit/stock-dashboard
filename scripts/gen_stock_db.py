"""从新浪 API 拉取全量 A 股数据，生成 stockSearchDb.ts 的内置数据"""

import subprocess, json, sys, time

MARKET_NODES = {
    'sh_a': 'sh',     # 沪主板 600000-605xxx ~1600
    'sz_a': 'sz',     # 深主板 000001-002xxx ~1500
    'cyb': 'chinext', # 创业板 300xxx-301xxx ~1300
    'kcb': 'star',    # 科创板 688xxx ~560
    'bse': 'bse',     # 北交所 8xxxxx ~260
}

MARKET_VALUES = {'sh': 0, 'sz': 1, 'chinext': 2, 'star': 3, 'bse': 4}

def fetch_page(node, page):
    url = f'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page={page}&num=100&sort=symbol&asc=1&node={node}&_s_r_a=init'
    try:
        r = subprocess.run(['curl', '-s', url, '--header', 'Referer: https://finance.sina.com.cn'], capture_output=True, text=True, timeout=15)
        data = json.loads(r.stdout)
        if isinstance(data, list) and len(data) > 0:
            return data
    except: pass
    return []

all_stocks = []
for node, market in MARKET_NODES.items():
    print(f'Fetching {node} ({market})...', file=sys.stderr)
    page = 1
    while True:
        data = fetch_page(node, page)
        if not data:
            break
        for item in data:
            code = item.get('code', '')
            name = item.get('name', '')
            if code and name:
                all_stocks.append((code, name, MARKET_VALUES[market]))
        print(f'  page {page}: {len(data)} stocks (total {len(all_stocks)})', file=sys.stderr)
        if len(data) < 100:
            break
        page += 1
        time.sleep(0.3)

print(f'\nTotal: {len(all_stocks)} stocks', file=sys.stderr)

# 生成 TS 代码
lines = []
lines.append("// 全量 A 股数据 — 自动生成，请勿手动修改")
lines.append(f"// 生成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
lines.append(f"// 总计: {len(all_stocks)} 只股票")
lines.append("")
lines.append("export interface StockSeed {")
lines.append("  code: string;")
lines.append("  name: string;")
lines.append("  market: 'sh' | 'sz' | 'star' | 'chinext' | 'bse';")
lines.append("}")
lines.append("")
lines.append(f"export const ALL_STOCKS: StockSeed[] = [")

for code, name, mkt in all_stocks:
    market_str = ['sh', 'sz', 'chinext', 'star', 'bse'][mkt]
    # 处理名称中的特殊字符
    escaped_name = name.replace('\\', '\\\\').replace("'", "\\'")
    lines.append(f"  {{ code: '{code}', name: '{escaped_name}', market: '{market_str}' }},")

lines.append("];")
lines.append("")

print('\n'.join(lines))
