import type { Metadata } from 'next';
import styles from './page.module.css';
import data from '@/src/data/indexValuation.json';

export const metadata: Metadata = {
  title: '宽基指数估值 · 灵犀茶馆',
  description: '宽基指数 PE-TTM / PB 现值与近 1/3/5/10 年历史百分位',
};

type Window = 'y1' | 'y3' | 'y5' | 'y10';
const WINDOWS: Window[] = ['y1', 'y3', 'y5', 'y10'];
const WINDOW_LABEL: Record<Window, string> = { y1: '1年', y3: '3年', y5: '5年', y10: '10年' };

const pctValue = (row: (typeof data.items)[number]) =>
  row.pePct.y10 ?? row.pePct.y5 ?? row.pePct.y3 ?? row.pePct.y1 ?? 999;

/** 百分位色块：低估绿、高估红。用固定色，不跟「涨绿跌红/涨红跌绿」的行情配色走 */
function Pct({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className={styles.na} title="该窗口历史不完整，不计算百分位">
        —
      </span>
    );
  }
  const tone = value <= 30 ? styles.low : value >= 70 ? styles.high : styles.mid;
  return <span className={`${styles.pct} ${tone}`}>{Math.round(value)}%</span>;
}

export default function BroadValuationPage() {
  const rows = [...data.items].sort((a, b) => pctValue(a) - pctValue(b));

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>宽基指数估值</h1>
          <p className={styles.sub}>
            数据日 {data.updatedAt} · {data.frequency} · 共 {rows.length} 个指数
          </p>
        </div>
        <div className={styles.legend}>
          <span className={`${styles.pct} ${styles.low}`}>≤30% 低估</span>
          <span className={`${styles.pct} ${styles.mid}`}>30–70% 中性</span>
          <span className={`${styles.pct} ${styles.high}`}>≥70% 高估</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.thIndex}>
                指数
              </th>
              <th colSpan={5} className={styles.thGroup}>
                PE-TTM
              </th>
              <th colSpan={5} className={styles.thGroup}>
                PB
              </th>
            </tr>
            <tr>
              <th className={styles.thNum}>现值</th>
              {WINDOWS.map((w) => (
                <th key={`pe-${w}`} className={styles.thNum}>
                  {WINDOW_LABEL[w]}
                </th>
              ))}
              <th className={styles.thNum}>现值</th>
              {WINDOWS.map((w) => (
                <th key={`pb-${w}`} className={styles.thNum}>
                  {WINDOW_LABEL[w]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code}>
                <td className={styles.tdIndex}>
                  <span className={styles.name}>{row.name}</span>
                  <span className={styles.code}>{row.code}</span>
                </td>
                <td className={`${styles.tdNum} ${styles.cur}`}>{row.pe.toFixed(2)}</td>
                {WINDOWS.map((w) => (
                  <td key={`pe-${row.code}-${w}`} className={styles.tdNum}>
                    <Pct value={row.pePct[w]} />
                  </td>
                ))}
                <td className={`${styles.tdNum} ${styles.cur}`}>{row.pb.toFixed(2)}</td>
                {WINDOWS.map((w) => (
                  <td key={`pb-${row.code}-${w}`} className={styles.tdNum}>
                    <Pct value={row.pbPct[w]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        按 PE 10 年百分位从低到高排序（该窗口历史不足者顺延用 5 年 / 3 年）。
      </p>

      <section className={styles.faq}>
        <h2 className={styles.faqTitle}>口径说明</h2>
        <ul className={styles.faqList}>
          <li>
            数据源：{data.source}；{data.frequency}。
          </li>
          <li>{data.percentileNote}</li>
          <li>
            数值口径与中证指数官方「中证估值」不同：沪深300 两者接近（13.07 vs 13.42），
            但中证1000（25.43 vs 37.89）、科创50（57.40 vs 93.50）差异可达三成以上，
            <strong>跨来源的绝对值不可直接比较</strong>；百分位请在同一序列内看趋势。
          </li>
          <li>百分位越低＝该指标处在自身历史的越低位，不代表绝对便宜，也不构成投资建议。</li>
        </ul>
      </section>

      {/* 中证2000：主数据源未覆盖，只有中证官方 PE 序列，单独成块，绝不并进主表 */}
      {data.supplement.map((row) => (
        <section key={row.code} className={styles.faq}>
          <h2 className={styles.faqTitle}>
            补充：{row.name}（{row.code}）<span className={styles.tag}>官方口径 · 仅 PE</span>
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thIndex}>指标</th>
                  <th className={styles.thNum}>现值</th>
                  {WINDOWS.map((w) => (
                    <th key={`sup-${w}`} className={styles.thNum}>
                      {WINDOW_LABEL[w]}
                    </th>
                  ))}
                  <th className={styles.thNum}>数据起</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.tdIndex}>
                    <span className={styles.name}>PE-TTM</span>
                  </td>
                  <td className={`${styles.tdNum} ${styles.cur}`}>{row.pe.toFixed(2)}</td>
                  {WINDOWS.map((w) => (
                    <td key={`sup-${row.code}-${w}`} className={styles.tdNum}>
                      <Pct value={row.pePct[w]} />
                    </td>
                  ))}
                  <td className={styles.tdNum}>{row.startDate}</td>
                </tr>
                <tr>
                  <td className={styles.tdIndex}>
                    <span className={styles.name}>PB</span>
                  </td>
                  <td className={`${styles.tdNum} ${styles.na}`}>—</td>
                  {WINDOWS.map((w) => (
                    <td key={`sup-pb-${w}`} className={`${styles.tdNum} ${styles.na}`}>
                      —
                    </td>
                  ))}
                  <td className={`${styles.tdNum} ${styles.na}`}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className={`${styles.faqList} ${styles.faqAfterTable}`}>
            <li>
              来源：{row.source}。实测同日差异：沪深300 2.6%、中证500 21%、中证1000 33%，
              <strong>不可与上表横向比较</strong>。
            </li>
            <li>该指数无公开 PB 历史序列（中证官方无 PB 接口），PB 行留空，不推算。</li>
            <li>历史自 {row.startDate} 起（{row.points} 个交易日），故 5 年 / 10 年窗口不足，标「—」。</li>
          </ul>
        </section>
      ))}

      <section className={styles.faq}>
        <h2 className={styles.faqTitle}>暂未覆盖的宽基</h2>
        <ul className={styles.faqList}>
          {data.uncovered.map((u) => (
            <li key={u.code}>
              {u.name}（{u.code}）：{u.reason}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
