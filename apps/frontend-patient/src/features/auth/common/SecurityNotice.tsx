export function SecurityNotice() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-[11px] text-sky-900">
      <svg
        className="h-3.5 w-3.5 shrink-0 text-sky-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <p className="leading-tight text-slate-600">
        <strong className="font-semibold text-slate-800">
          Dữ liệu được bảo mật
        </strong>{" "}
        theo tiêu chuẩn y tế HIPAA &amp; ISO.
      </p>
    </div>
  );
}
