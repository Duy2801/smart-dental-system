type DeleteConfirmationModalProps = {
  description: string;
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
};

export function DeleteConfirmationModal({
  description,
  itemName,
  onCancel,
  onConfirm,
  pending,
  title,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hộp thoại xác nhận"
        disabled={pending}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]"
      >
        <button
          type="button"
          aria-label="Đóng"
          disabled={pending}
          onClick={onCancel}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeWidth="2" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="px-7 pb-6 pt-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 ring-8 ring-red-50/60">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"
                />
              </svg>
            </div>
          </div>

          <h3
            id="delete-confirmation-title"
            className="mt-6 text-xl font-bold tracking-tight text-slate-900"
          >
            {title}
          </h3>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Bạn có chắc muốn xóa đối tượng này khỏi hệ thống?
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đối tượng sẽ xóa
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800" title={itemName}>
              {itemName}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/70 px-7 py-5">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(220,38,38,0.8)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
              </svg>
            )}
            {pending ? "Đang xóa..." : "Xóa ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
