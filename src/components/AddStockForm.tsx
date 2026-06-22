import React, { useState, useRef, useEffect } from 'react';
import styles from './AddStockForm.module.css';
import { searchStocks, STOCK_DATABASE } from '../data/mockStocks';
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
  const [results, setResults] = useState<ReturnType<typeof searchStocks>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const r = searchStocks(query);
      setResults(r);
      setShowDropdown(r.length > 0);
      setActiveIdx(-1);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const doAdd = (stock: Stock) => {
    onAddStock(boardId, stock);
    onClose();
  };

  const selectEntry = (entry: typeof results[0]) => {
    doAdd(entryToStock(entry));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectEntry(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={styles.addForm}>
      <div className={styles.searchContainer}>
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="输入股票名称或代码搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && (
          <div className={styles.dropdown}>
            {results.map((r, i) => (
              <button
                key={r.code}
                className={`${styles.resultItem} ${i === activeIdx ? styles.resultActive : ''}`}
                onMouseDown={() => selectEntry(r)}
              >
                <div className={styles.resultLeft}>
                  <span className={styles.resultName}>{r.name}</span>
                  <span className={styles.resultCode}>{r.code}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {r.market === 'chinext' ? '创业板' : r.market === 'star' ? '科创板' : r.market === 'bse' ? '北交所' : '主板'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.manualSection}>
        <span className={styles.manualLabel}>或手动添加（代码 + 名称）</span>
        <ManualAddForm boardId={boardId} onAddStock={onAddStock} onClose={onClose} />
      </div>

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
