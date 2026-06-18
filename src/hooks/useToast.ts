import { useCallback, useRef } from 'react';
import type { ToastItem } from '../types';

export function useToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>
) {
  const counterRef = useRef(0);

  const toast = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [setToasts]
  );

  return toast;
}
