"use client";

import {
  CheckCircle,
  Info,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type DialogTone = "danger" | "info" | "success";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
};

type AlertOptions = Omit<ConfirmOptions, "cancelLabel"> & {
  closeLabel?: string;
};

type DialogRequest = ConfirmOptions & {
  kind: "alert" | "confirm";
  resolve: (confirmed: boolean) => void;
};

type AppDialogContextValue = {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  showAlert: (options: AlertOptions) => Promise<void>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

const toneStyles = {
  danger: {
    icon: WarningCircle,
    iconClass: "bg-rose-50 text-rose-600",
    buttonClass: "bg-rose-600 hover:bg-rose-700",
  },
  info: {
    icon: Info,
    iconClass: "bg-blue-50 text-blue-600",
    buttonClass: "bg-brand hover:bg-brand-dark",
  },
  success: {
    icon: CheckCircle,
    iconClass: "bg-emerald-50 text-emerald-600",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
} as const;

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const showConfirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setRequest({ kind: "confirm", tone: "info", ...options, resolve });
      }),
    [],
  );

  const showAlert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        setRequest({
          kind: "alert",
          tone: "info",
          ...options,
          confirmLabel: options.closeLabel ?? options.confirmLabel ?? "Đã hiểu",
          resolve: () => resolve(),
        });
      }),
    [],
  );

  const close = useCallback(
    (confirmed: boolean) => {
      request?.resolve(confirmed);
      setRequest(null);
    },
    [request],
  );

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, request]);

  const tone = request?.tone ?? "info";
  const toneStyle = toneStyles[tone];
  const Icon = toneStyle.icon;

  return (
    <AppDialogContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-description"
            className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneStyle.iconClass}`}
              >
                <Icon size={24} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id="app-dialog-title"
                    className="text-lg font-bold text-brand-dark"
                  >
                    {request.title}
                  </h2>
                  <button
                    type="button"
                    title="Đóng"
                    onClick={() => close(false)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p
                  id="app-dialog-description"
                  className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600"
                >
                  {request.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {request.kind === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {request.cancelLabel ?? "Quay lại"}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all active:scale-[0.98] ${toneStyle.buttonClass}`}
              >
                {request.confirmLabel ?? "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error("useAppDialog must be used inside AppDialogProvider");
  }
  return context;
}
