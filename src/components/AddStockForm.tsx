import React, { useState, useRef } from 'react';
import styles from './AddStockForm.module.css';
import { searchStocks, STOCK_DATABASE } from '../data/mockStocks';
import type { StockEntry } from '../data/mockStocks';
import { entryToStock } from '../data/utils';
import type { Stock } from '../types';

interface Props {
  boardId: string;
  onAddStock: (boardId: string, stock: Stock) => void;
  onClose: () => void;
}

const HOT_TAGS = ['中际旭创', '宁德时代', '比亚迪', '贵州茅台', '中兴通讯', '中芯国际', '科大讯飞', '东方财富'];

export default function AddStockForm({ boardId, onAddStock, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const doAdd = (stock: Stock) => {
    onAddStock(boardId, stock);
    onClose();
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    const r = searchStocks(query);
    setResults(r);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className={styles.addForm}>
      {/* 搜索栏 */}
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="输入股票名称或代码搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          查询
        </button>
      </div>

      {/* 搜索结果（非浮层，直接展示） */}
      {results.length > 0 && (
        <div className={styles.resultList}>
          {results.map((r) => (
            <button
              key={r.code}
              className={styles.resultItem}
              onClick={() => doAdd(entryToStock(r))}
            >
              <div className={styles.resultLeft}>
                <span className={styles.resultName}>{r.name}</span>
                <span className={styles.resultCode}>{r.code}</span>
              </div>
              <span className={styles.resultMarket}>
                {r.market === 'chinext' ? '创业板' : r.market === 'star' ? '科创板' : r.market === 'bse' ? '北交所' : '主板'}
              </span>
            </button>
          ))}
        </div>
      )}
      {results.length === 0 && query.trim() && (
        <div className={styles.emptyResult}>未找到匹配的股票，请尝试手动添加</div>
      )}

      {/* 手动添加 */}
      <div className={styles.manualSection}>
        <span className={styles.manualLabel}>手动添加（代码 + 名称）</span>
        <ManualAddForm boardId={boardId} onAddStock={onAddStock} onClose={onClose} />
      </div>

      {/* 热门预设 */}
      <div className={styles.presets}>
        {HOT_TAGS.map((name) => {
          const entry = STOCK_DATABASE.find((s) => s.name === name);
          return entry ? (
            <button key={entry.code} className={styles.presetBadge} onClick={() => doAdd(entryToStock(entry))}>
              {entry.name}
            </button>
          ) : null;
        })}
      </div>
    </div>
  );
}

function ManualAddForm({ boardId, onAddStock, onClose }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!code.trim() || !name.trim()) return;
    const existing = searchStocks(code.trim())[0];
    const entry = existing || { code: code.trim(), name: name.trim(), market: 'sz' as const };
    const stock = entryToStock(entry);
    stock.name = name.trim();
    onAddStock(boardId, stock);
    onClose();
    setCode('');
    setName('');
  };

  return (
    <div className={styles.manualRow}>
      <input
        className={styles.manualInput}
        placeholder="代码 (如 300308)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        className={styles.manualInput}
        placeholder="名称 (如 中际旭创)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button className={styles.addSubmit} onClick={handleSubmit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>
        添加
      </button>
    </div>
  );
}
