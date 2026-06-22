import React, { useState, useRef, useCallback } from 'react';
import styles from './AddStockForm.module.css';
import { searchStocksLocal } from '../data/stockSearchDb';
import type { StockSearchItem } from '../data/stockSearchDb';
import { entryToStock } from '../data/utils';
import type { Stock } from '../types';

interface Props {
  boardId: string;
  onAddStock: (boardId: string, stock: Stock) => void;
  onClose: () => void;
}

export default function AddStockForm({ boardId, onAddStock, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doAdd = (stock: Stock) => {
    onAddStock(boardId, stock);
    onClose();
  };

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setSearched(true);
    const res = searchStocksLocal(q);
    setResults(res);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className={styles.addForm}>
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

      {searched && results.length > 0 && (
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
      {searched && results.length === 0 && (
        <div className={styles.emptyResult}>未找到匹配的股票</div>
      )}
    </div>
  );
}
