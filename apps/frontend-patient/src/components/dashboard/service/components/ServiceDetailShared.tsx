import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { hasItems, minutesLabel } from "../service-detail-utils";
import type { DentalService } from "../types";

export function ServiceDetailLoadingState() {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-100" />
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}

export function ServiceDetailNotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-[960px] place-items-center px-4 py-10 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Không tìm thấy dịch vụ
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Dịch vụ có thể đã ngừng hiển thị hoặc chưa được cập nhật.
        </p>
        <Link
          href="/service"
          className="mt-5 inline-flex rounded-xl bg-[#0863c5] px-5 py-3 text-sm font-bold text-white"
        >
          Quay lại danh sách
        </Link>
      </div>
    </main>
  );
}

export function SectionHeading({
  description,
  eyebrow,
  title,
}: {
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0863c5]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyContent({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      {label} chưa được cập nhật trong hệ thống.
    </div>
  );
}

export function BookingPanel({ service }: { service: DentalService }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
            Đặt lịch ưu tiên
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            Chọn sẵn {service.title}
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Hệ thống sẽ chuyển sang lịch hẹn và tự chọn dịch vụ này cho bạn.
          </p>
        </div>

        <div className="p-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Giá từ</span>
              <strong className="text-xl text-[#0863c5]">
                {service.price}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <DashboardIcon
                  name="clock"
                  className="h-4 w-4 text-[#0863c5]"
                />
                Thời lượng
              </span>
              <strong className="text-sm text-slate-900">
                {minutesLabel(service.durationMinutes)}
              </strong>
            </div>
          </div>

          <Link
            href={`/appointment?service=${service.id}&intent=booking`}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0756aa]"
          >
            Đặt dịch vụ ngay
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </Link>
          <Link
            href="/service"
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#0863c5]"
          >
            Xem dịch vụ khác
          </Link>
        </div>
      </section>

      {hasItems(service.includedItems) ? (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <DashboardIcon
              name="shield"
              className="h-4 w-4 text-emerald-600"
            />
            Bao gồm trong buổi hẹn
          </h2>
          <ul className="mt-4 space-y-3">
            {service.includedItems.slice(0, 4).map((item) => (
              <li
                key={item}
                className="flex gap-2 text-xs leading-5 text-slate-600"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
