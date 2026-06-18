import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel: () => void;
  showCancel?: boolean;
  danger?: boolean;
}

export default function Modal({
  title,
  children,
  onConfirm,
  confirmText = '确认',
  onCancel,
  showCancel = true,
  danger,
}: ModalProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          {showCancel && (
            <button className={styles.btnCancel} onClick={onCancel}>取消</button>
          )}
          {onConfirm && (
            <button
              className={styles.btnConfirm}
              style={danger ? {} : { background: 'var(--primary)' }}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
