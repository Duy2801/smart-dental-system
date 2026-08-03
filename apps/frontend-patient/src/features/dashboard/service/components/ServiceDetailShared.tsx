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
          Khong tim thay dich vu
        </h1>
        <p className={`mt-2 ${T.body}`}>
          Dich vu co the da ngung hien thi hoac chua duoc cap nhat.
        </p>
        <Link
          href={ROUTES.service}
          className="mt-5 inline-flex rounded-xl bg-[#0863c5] px-5 py-3 text-sm font-bold text-white"
        >
          Quay lai danh sach
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
      <p className={`${T.overline} text-[#0863c5]`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className={`mt-3 max-w-3xl ${T.body}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyContent({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      {label} chua duoc cap nhat trong he thong.
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
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className={`${T.fieldLabel} text-blue-200`}>
            Dat lich uu tien
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            Chon san {activeMethod?.name ?? service.title}
          </h2>
          <p className={`mt-2 ${T.bodySm} text-slate-300`}>
            He thong se chuyen sang lich hen va tu chon dich vu nay cho ban.
          </p>
        </div>

        <div className="p-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Gia tu</span>
              <strong className="text-xl text-[#0863c5]">{price}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <DashboardIcon
                  name="clock"
                  className="h-4 w-4 text-[#0863c5]"
                />
                Thoi luong
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
            Dat dich vu ngay
            <DashboardIcon name="calendar" className="h-4 w-4" />
          </Link>
          <Link
            href={ROUTES.service}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#0863c5]"
          >
            Xem dich vu khac
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
            Bao gom trong buoi hen
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
