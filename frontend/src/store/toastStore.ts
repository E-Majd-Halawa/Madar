import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
    window.setTimeout(() => get().dismiss(id), toast.onAction ? 6000 : 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, extra?: Pick<Toast, 'actionLabel' | 'onAction'>) =>
    useToastStore.getState().push({ tone: 'success', message, ...extra }),
  info: (message: string) => useToastStore.getState().push({ tone: 'info', message }),
  error: (message: string) => useToastStore.getState().push({ tone: 'error', message }),
};
