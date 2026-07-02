"use client";

/**
 * Sonner-style toast — a tiny global store + `<Toaster />` viewport,
 * no provider wiring required. Call `toast({ title })` from anywhere
 * on the client; render `<Toaster />` once near the root.
 */

import * as React from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

import { cn } from "../lib/cn";

type ToastVariant = "default" | "success" | "warning" | "destructive";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Defaults to 5000. Pass 0 to keep it until dismissed. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "title" | "variant">> {
  id: number;
  description?: string;
}

type Listener = (toasts: readonly ToastItem[]) => void;

let nextId = 0;
let toasts: readonly ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener(toasts);
}

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(options: ToastOptions): number {
  const id = ++nextId;
  const item: ToastItem = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant ?? "default"
  };
  toasts = [...toasts, item].slice(-5);
  emit();
  const duration = options.duration ?? 5000;
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration)
    );
  }
  return id;
}

const VARIANT_ICON: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  destructive: XCircle
};

const VARIANT_ICON_CLASS: Record<ToastVariant, string> = {
  default: "text-navy-400",
  success: "text-emerald-500",
  warning: "text-gold-500",
  destructive: "text-destructive"
};

export function Toaster(): React.JSX.Element {
  const [items, setItems] = React.useState<readonly ToastItem[]>(toasts);

  React.useEffect(() => {
    const listener: Listener = (next) => setItems(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      aria-label="Notifications"
      role="region"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {items.map((item) => {
        const Icon = VARIANT_ICON[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
            )}
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", VARIANT_ICON_CLASS[item.variant])}
              aria-hidden="true"
            />
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-semibold leading-tight">{item.title}</p>
              {item.description ? (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
