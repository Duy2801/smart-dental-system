import type { AppointmentService } from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";

type ServiceSelectorProps = {
  services: AppointmentService[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ServiceSelector({ services, selectedId, onSelect }: ServiceSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Chọn dịch vụ</legend>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {services.map((service) => {
          const selected = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              aria-pressed={selected}
              className={`flex min-h-28 flex-col items-center justify-center rounded-xl border bg-white p-3 text-center shadow-sm transition ${
                selected
                  ? "border-[#0863c5] bg-blue-50/70 text-[#0863c5] ring-2 ring-blue-100"
                  : "border-slate-200 text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-white" : "bg-slate-50"}`}>
                <DashboardIcon name={service.icon} className="h-5 w-5" />
              </span>
              <strong className="mt-2.5 text-xs font-semibold text-slate-700">{service.name}</strong>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
