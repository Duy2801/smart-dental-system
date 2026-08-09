import Link from "next/link";
import type { AppointmentService, TreatmentMethodItem } from "../../types";
import { DashboardIcon } from "../../../common/DashboardIcon";
import { formatCurrency } from "@/utils/helpers";

function formatPrice(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "Liên hệ";
  return formatCurrency(value);
}

type ServiceSelectorProps = {
  services: AppointmentService[];
  selectedServiceId: string;
  selectedMethodId: string;
  onSelectService: (serviceId: string) => void;
  onSelectMethod: (methodId: string) => void;
};

export function ServiceSelector({
  services,
  selectedServiceId,
  selectedMethodId,
  onSelectService,
  onSelectMethod,
}: ServiceSelectorProps) {
  const currentService =
    services.find((s) => s.id === selectedServiceId) ?? services[0];
  const treatmentMethods = currentService?.treatmentMethods ?? [];

  return (
    <div className="space-y-6">
      {/* 1. Chọn loại dịch vụ (Service Category) */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          1. Chọn loại dịch vụ nha khoa
        </legend>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {services.map((service) => {
            const selected = selectedServiceId === service.id;
            return (
              <article
                key={service.id}
                className={`flex min-h-32 flex-col rounded-xl border bg-white p-3 text-center shadow-sm transition ${
                  selected
                    ? "border-[#0863c5] bg-blue-50/70 text-[#0863c5] ring-2 ring-blue-100"
                    : "border-slate-200 text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectService(service.id);
                    if (service.treatmentMethods.length > 0) {
                      onSelectMethod(service.treatmentMethods[0].id);
                    }
                  }}
                  aria-pressed={selected}
                  className="flex flex-1 flex-col items-center justify-center"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      selected
                        ? "bg-white text-[#0863c5]"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <DashboardIcon name={service.icon} className="h-5 w-5" />
                  </span>
                  <strong className="mt-2 text-xs font-semibold text-slate-800">
                    {service.name}
                  </strong>
                  <span className="mt-1 text-[11px] text-slate-500">
                    {service.treatmentMethods.length} phương pháp
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      </fieldset>

      {/* 2. Chọn phương pháp điều trị chi tiết (Treatment Method) */}
      {currentService && treatmentMethods.length > 0 ? (
        <fieldset className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-[#0863c5]">
            Phương pháp điều trị ({currentService.name})
          </legend>
          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {treatmentMethods.map((method) => {
              const selected = selectedMethodId === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => onSelectMethod(method.id)}
                  className={`cursor-pointer flex flex-col justify-between rounded-xl border p-3.5 transition ${
                    selected
                      ? "border-[#0863c5] bg-white ring-2 ring-blue-500/20 shadow-sm"
                      : "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {method.name}
                      </h4>
                      {method.description ? (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {method.description}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-[#0863c5] bg-[#0863c5] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected ? (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                    <span className="font-semibold text-slate-500">
                      ⏱ {method.durationMinutes} phút
                    </span>
                    <span className="font-extrabold text-[#0863c5]">
                      {formatPrice(method.rawPrice ?? method.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
