import Link from "next/link";
import type { AppointmentService } from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";

type ServiceSelectorProps = {
  services: AppointmentService[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ServiceSelector({
  services,
  selectedId,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Chon dich vu</legend>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {services.map((service) => {
          const selected = selectedId === service.id;
          return (
            <article
              key={service.id}
              className={`flex min-h-36 flex-col rounded-xl border bg-white p-3 text-center shadow-sm transition ${
                selected
                  ? "border-[#0863c5] bg-blue-50/70 text-[#0863c5] ring-2 ring-blue-100"
                  : "border-slate-200 text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(service.id)}
                aria-pressed={selected}
                className="flex flex-1 flex-col items-center justify-center"
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    selected ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <DashboardIcon name={service.icon} className="h-5 w-5" />
                </span>
                <strong className="mt-2.5 text-xs font-semibold text-slate-700">
                  {service.name}
                </strong>
                <span className="mt-1 text-[11px] font-bold text-[#0863c5]">
                  {service.price} d
                </span>
              </button>
              <Link
                href={service.href}
                className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-500 transition hover:bg-blue-50 hover:text-[#0863c5]"
              >
                Xem chi tiet
              </Link>
            </article>
          );
        })}
      </div>
    </fieldset>
  );
}
