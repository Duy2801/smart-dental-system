import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { PatientPageSkeleton } from "../../common/PatientSkeleton";
import { formatServicePrice } from "../api";
import { hasItems, minutesLabel } from "../service-detail-utils";
import type { DentalService, TreatmentMethod } from "../types";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

export function ServiceDetailLoadingState() {
  return <PatientPageSkeleton />;
}

export function ServiceDetailNotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-[960px] place-items-center px-4 py-10 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Không tìm thấy dịch vụ
        </h1>
        <p className={`mt-2 ${T.body}`}>
          Dịch vụ có thể đã ngừng hiển thị hoặc chưa được cập nhật.
        </p>
        <Link
          href={ROUTES.service}
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
    <div className="min-w-0">
      <p className={`${T.overline} text-[#0863c5]`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 break-words text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className={`mt-3 max-w-3xl break-words ${T.body}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyContent({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[90px] w-full items-center justify-center max-w-full break-words rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-500 sm:p-5">
      {label} chưa được cập nhật trong hệ thống.
    </div>
  );
}

export function BookingPanel({
  service,
  activeMethod,
}: {
  service: DentalService;
  activeMethod?: TreatmentMethod | null;
}) {
  const price = activeMethod
    ? formatServicePrice(activeMethod.basePrice)
    : service.price;
  const duration = activeMethod?.durationMinutes || service.durationMinutes;
  const bookingHref = `${ROUTES.appointment}?service=${service.id}${activeMethod ? `&treatmentMethod=${activeMethod.id}` : ""
    }&intent=booking`;

  return (
    <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className={`${T.fieldLabel} text-blue-200`}>
            Đặt lịch ưu tiên
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            Chọn ngay {activeMethod?.name ?? service.title}
          </h2>
          <p className={`mt-2 ${T.bodySm} text-slate-300`}>
            Hệ thống sẽ chuyển sang lịch hẹn và tự chọn dịch vụ này cho bạn.
          </p>
        </div>

        <div className="p-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Giá từ</span>
              <strong className="text-xl text-[#0863c5]">{price}</strong>
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
                {minutesLabel(duration)}
              </strong>
            </div>
          </div>

          <Link
            href={bookingHref}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0756aa]"
          >
            Đặt dịch vụ ngay
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </Link>
          <Link
            href={ROUTES.service}
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
