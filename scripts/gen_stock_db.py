"""从新浪 API 拉取全量 A 股清单，生成 public/data/stocks.json。

清单不打进 JS bundle：部署后由服务器以静态文件提供，页面运行时 fetch 取用。
用法（在项目根目录）：python3 scripts/gen_stock_db.py

板块（market）由代码前缀唯一推导，不再沿用接口的节点归属——历史数据里 688/300 既被标成
sh/sz 又重复出现在 star/chinext，同一只股票搜索会出两条。
"""

import subprocess, json, sys, time
from pathlib import Path

MARKET_NODES = ['sh_a', 'sz_a', 'cyb', 'kcb', 'bse']
MARKET_ORDER = ['sh', 'sz', 'chinext', 'star', 'bse']


def market_of(code: str) -> str:
    """代码前缀 → 板块（唯一推导，不设人工维护字段）"""
    if code.startswith(('688', '689')):
        return 'star'
    if code.startswith(('300', '301', '302')):
        return 'chinext'
    if code.startswith(('4', '8')):
        return 'bse'
    if code.startswith('6'):
        return 'sh'
    return 'sz'


def fetch_page(node, page):
    url = f'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page={page}&num=100&sort=symbol&asc=1&node={node}&_s_r_a=init'
    try:
        r = subprocess.run(['curl', '-s', url, '--header', 'Referer: https://finance.sina.com.cn'],
                           capture_output=True, text=True, timeout=15)
        data = json.loads(r.stdout)
        if isinstance(data, list) and len(data) > 0:
            return data
    except Exception:
        pass
    return []


names = {}
for node in MARKET_NODES:
    print(f'Fetching {node}...', file=sys.stderr)
    page = 1
    while True:
        data = fetch_page(node, page)
        if not data:
            break
        for item in data:
            code = str(item.get('code', ''))
            name = str(item.get('name', ''))
            if len(code) == 6 and code.isdigit() and name:
                names.setdefault(code, name)
        print(f'  page {page}: {len(data)} rows (unique {len(names)})', file=sys.stderr)
        if len(data) < 100:
            break
        page += 1
        time.sleep(0.3)

stocks = [[code, names[code], MARKET_ORDER.index(market_of(code))] for code in sorted(names)]
payload = {
    'generatedAt': time.strftime('%Y-%m-%d'),
    'count': len(stocks),
    'marketOrder': MARKET_ORDER,
    'stocks': stocks,
}

out = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'stocks.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'写入 {out}（{len(stocks)} 只）', file=sys.stderr)
