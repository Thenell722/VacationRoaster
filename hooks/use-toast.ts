'use client';

import { useCallback, useState } from 'react';

export interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...props, id }]);
    return id;
  }, []);
  return { toasts, toast, dismiss };
}

export { useToast as default };
