'use client';

import { Modal as AntdModal, Button } from 'antd';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel: () => void;
  showCancel?: boolean;
  danger?: boolean;
}

/**
 * 对外接口与迁移前一致（title/children/onConfirm/confirmText/onCancel/showCancel/danger），
 * 内部换成 antd Modal，遮罩、焦点管理、Esc 关闭由 antd 负责。
 */
export default function Modal({
  title,
  children,
  onConfirm,
  confirmText = '确认',
  onCancel,
  showCancel = true,
  danger,
}: ModalProps) {
  const footer = [
    showCancel ? (
      <Button key="cancel" onClick={onCancel}>
        取消
      </Button>
    ) : null,
    onConfirm ? (
      <Button key="confirm" type="primary" danger={danger} onClick={onConfirm}>
        {confirmText}
      </Button>
    ) : null,
  ].filter(Boolean);

  return (
    <AntdModal
      open
      title={title}
      onCancel={onCancel}
      footer={footer}
      centered
      width={380}
      maskClosable
      destroyOnHidden
      // 边框/阴影用 antd 的内联语义样式通道：cssinjs 运行时注入优先级高于外部 CSS
      styles={{
        container: {
          border: '1px solid var(--border-highlight)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      {children}
    </AntdModal>
  );
}
