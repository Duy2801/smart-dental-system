"use client";

import { useState, type FormEvent } from "react";

export function PatientProfileEditor() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 700);
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-blue-300 hover:text-[#0058bc]"
        aria-label="Chỉnh sửa hồ sơ"
      >
        ✎
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
          className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={submit}
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0058bc]">
                  Thông tin bệnh nhân
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Cập nhật hồ sơ
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                Họ và tên
                <input
                  defaultValue="Nguyễn Minh Khải"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Số điện thoại
                <input
                  defaultValue="0901 234 567"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Ngày sinh
                <input
                  type="date"
                  defaultValue="1978-03-18"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Giới tính
                <select
                  defaultValue="Nam"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                >
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Địa chỉ
                <input
                  defaultValue="Quận 1, TP. Hồ Chí Minh"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Thông tin y khoa cần lưu ý
                <textarea
                  defaultValue="Tiểu đường Type 2 – đang kiểm soát tốt"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
              >
                Hủy
              </button>
              <button className="rounded-xl bg-[#0058bc] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200">
                {saved ? "Đã lưu ✓" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
