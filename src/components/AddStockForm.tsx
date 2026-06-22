import React, { useState, useRef, useCallback } from 'react';
import styles from './AddStockForm.module.css';
import { searchStocksApi } from '../data/sinaApi';
import type { StockSearchResult } from '../data/sinaApi';
import { entryToStock } from '../data/utils';
import type { Stock } from '../types';

interface Props {
  boardId: string;
  onAddStock: (boardId: string, stock: Stock) => void;
  onClose: () => void;
}

export default function AddStockForm({ boardId, onAddStock, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doAdd = (stock: Stock) => {
    onAddStock(boardId, stock);
    onClose();
  };

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    setError('');
    try {
      const res = await searchStocksApi(q);
      setResults(res);
    } catch {
      setResults([]);
      setError('搜索服务不可用');
    }
    setSearching(false);
  }, [query]);

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
        <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
          {searching ? (
            <span style={{ opacity: 0.6 }}>搜索中...</span>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              查询
            </>
          )}
        </button>
      </div>

      {/* 搜索结果 */}
      {searched && !searching && results.length > 0 && (
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
      {searched && !searching && results.length === 0 && !error && (
        <div className={styles.emptyResult}>未找到匹配的股票</div>
      )}
      {error && (
        <div className={styles.emptyResult} style={{ color: 'var(--fall-color)' }}>{error}</div>
      )}
    </div>
  );
}
