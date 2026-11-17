'use client';

import { Button, Input, Empty } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import styles from './AddStockForm.module.css';
import { searchStocks, preloadStockDb, getStockDbError } from '../data/stockSearchDb';
import type { StockSeed } from '../data/utils';
import { entryToStock } from '../data/utils';
import type { Stock } from '../types';

interface Props {
  boardId: string;
  onAddStock: (boardId: string, stock: Stock) => void;
  onClose: () => void;
}

export default function AddStockForm({ boardId, onAddStock, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSeed[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [dbFailed, setDbFailed] = useState(false);

  // 打开搜索框即预取股票清单（服务端下发，不打进 bundle）
  useEffect(() => {
    preloadStockDb();
  }, []);

  const doAdd = (stock: Stock) => {
    onAddStock(boardId, stock);
    onClose();
  };

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    const res = await searchStocks(q);
    setResults(res);
    setDbFailed(Boolean(getStockDbError()));
    setSearching(false);
  }, [query]);

  return (
    <div className={styles.addForm}>
      <div className={styles.searchRow}>
        <Input
          className={styles.searchInput}
          placeholder="输入股票名称或代码搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button
          className={styles.searchBtn}
          type="primary"
          onClick={handleSearch}
          loading={searching}
        >
          查询
        </Button>
      </div>

      {dbFailed && (
        <div className={styles.dbWarn}>
          股票清单（服务器）加载失败，本次只用在线搜索补充，结果可能不全；重新查询可重试。
        </div>
      )}

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
      {searched && !searching && results.length === 0 && (
        <div className={styles.emptyResult}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配的股票" />
        </div>
      )}
    </div>
  );
}
