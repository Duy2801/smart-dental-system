import type { ReactNode } from "react";

type AdminModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
};

export function AdminModal({
  children,
  description,
  onClose,
  title,
}: AdminModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-brand-dark">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
