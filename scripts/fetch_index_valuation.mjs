/**
 * 宽基指数估值（PE-TTM / PB + 1/3/5/10 年历史百分位）取数脚本
 *
 * 用法：npm run refresh:valuation
 * 产物：src/data/indexValuation.json（构建时静态打包，页面不请求外网）
 *
 * 数据源：蛋卷基金指数估值接口（JSON API，非页面抓取）
 *   - pe_history / pb_history 返回全量周频序列（2016-11 起）
 *   - 百分位口径：窗口内「历史值 ≤ 当前值」的比例，与蛋卷自身 pe_percentile 一致
 *     （000300 实测：脚本 64% vs 蛋卷 65.4%，其余指数差 ≤1pp）
 * 注意：接口对 Origin 头敏感，脚本只发 UA + Referer，不要加 Origin。
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const OUT = resolve(process.cwd(), 'src/data/indexValuation.json');
const API = 'https://danjuanfunds.com/djapi/index_eva';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  Referer: 'https://danjuanfunds.com/',
};

/** 宽基清单（与界面顺序一致） */
const INDICES = [
  { code: '000300', name: '沪深300', dj: 'SH000300' },
  { code: '000905', name: '中证500', dj: 'SH000905' },
  { code: '000852', name: '中证1000', dj: 'SH000852' },
  { code: '000016', name: '上证50', dj: 'SH000016' },
  { code: '399006', name: '创业板指', dj: 'SZ399006' },
  { code: '000922', name: '中证红利', dj: 'SH000922' },
  { code: '000688', name: '科创50', dj: 'SH000688' },
];

/** 用户清单里有、但数据源没覆盖的指数：如实标注，不编数 */
const UNCOVERED = [
  { code: '000906', name: '中证800', reason: '数据源无该指数序列' },
  { code: '000985', name: '中证全指', reason: '数据源无该指数序列' },
  { code: '932000', name: '中证2000', reason: '数据源无该指数序列（2023 年发布，历史亦不足）' },
  { code: '930050', name: '中证A50', reason: '数据源无该指数序列（2024 年发布，历史亦不足）' },
];

const WINDOWS = [1, 3, 5, 10];
const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const MIN_SAMPLES = 30;

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ← ${url}`);
  return res.json();
}

function percentile(series, current, years, lastTs) {
  const cutoff = lastTs - years * YEAR_MS;
  // 历史必须覆盖整个窗口，否则标「历史不足」，不用残缺样本硬算
  if (series[0].ts > cutoff + 7 * 24 * 3600 * 1000) return null;
  const win = series.filter((p) => p.ts >= cutoff);
  if (win.length < MIN_SAMPLES) return null;
  const below = win.filter((p) => p.value <= current).length;
  return Math.round((below / win.length) * 1000) / 10;
}

const fmtDate = (ts) => new Date(ts).toISOString().slice(0, 10);

async function one(idx) {
  const [peRaw, pbRaw] = await Promise.all([
    getJson(`${API}/pe_history/${idx.dj}?day=all`),
    getJson(`${API}/pb_history/${idx.dj}?day=all`),
  ]);

  // 数据源缺该指数时返回空数组，直接报错退出，避免写出半张表
  const pe = (peRaw?.data?.index_eva_pe_growths ?? []).map((d) => ({ ts: d.ts, value: d.pe }));
  const pb = (pbRaw?.data?.index_eva_pb_growths ?? []).map((d) => ({ ts: d.ts, value: d.pb }));
  if (pe.length === 0 || pb.length === 0) throw new Error(`${idx.name}(${idx.dj}) 历史序列为空`);

  const lastTs = pe[pe.length - 1].ts;
  const current = { pe: pe[pe.length - 1].value, pb: pb[pb.length - 1].value };
  const pct = (series, cur) =>
    Object.fromEntries(WINDOWS.map((y) => [`y${y}`, percentile(series, cur, y, lastTs)]));

  return {
    code: idx.code,
    name: idx.name,
    pe: Math.round(current.pe * 100) / 100,
    pb: Math.round(current.pb * 100) / 100,
    pePct: pct(pe, current.pe),
    pbPct: pct(pb, current.pb),
    startDate: fmtDate(pe[0].ts),
    points: pe.length,
    lastDate: fmtDate(lastTs),
  };
}

const items = [];
for (const idx of INDICES) {
  const row = await one(idx);
  console.log(
    `${row.name.padEnd(8)} PE ${String(row.pe).padStart(7)} / ${JSON.stringify(row.pePct)}  PB ${String(row.pb).padStart(5)} / ${JSON.stringify(row.pbPct)}  (${row.startDate} 起, ${row.points} 点)`,
  );
  items.push(row);
}

const lastDate = items.map((i) => i.lastDate).sort().at(-1);
const payload = {
  updatedAt: lastDate,
  generatedAt: new Date().toISOString(),
  source: '蛋卷基金 指数估值接口（danjuanfunds.com）',
  frequency: '周频采样（每周 1 个点），PE 为 PE-TTM',
  percentileNote: '百分位 = 窗口内「历史估值 ≤ 当前估值」的比例；窗口历史不完整则记为 null（界面显示「—」）',
  items,
  uncovered: UNCOVERED,
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`\n写入 ${OUT}（数据日 ${lastDate}，${items.length} 个指数）`);
