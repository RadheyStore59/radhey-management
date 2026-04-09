import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastEventDetail {
  message: string;
  type?: ToastType;
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<ToastEventDetail>;
      const detail = custom.detail || { message: '' };
      const toast: ToastItem = {
        id: crypto.randomUUID(),
        message: String(detail.message || ''),
        type: detail.type || 'info',
      };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };

    window.addEventListener('app:toast', onToast as EventListener);
    return () => window.removeEventListener('app:toast', onToast as EventListener);
  }, []);

  const typeClasses: Record<ToastType, string> = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800',
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${typeClasses[toast.type]} text-white rounded-xl shadow-xl px-4 py-3 text-sm font-medium whitespace-pre-line`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

