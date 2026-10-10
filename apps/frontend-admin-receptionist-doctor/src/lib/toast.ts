// Global Toast Dispatcher & Store
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(message: string, type: ToastType = "info", duration = 4000) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newItem: ToastItem = { id, type, message, duration };

    // Limit active toasts to 5 at a time
    if (this.toasts.length >= 5) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts = [...this.toasts, newItem];
    this.notify();

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  public dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public success(message: string, duration = 4000) {
    return this.show(message, "success", duration);
  }

  public error(message: string, duration = 4500) {
    return this.show(message, "error", duration);
  }

  public warning(message: string, duration = 4500) {
    return this.show(message, "warning", duration);
  }

  public info(message: string, duration = 4000) {
    return this.show(message, "info", duration);
  }
}

export const toast = new ToastManager();
