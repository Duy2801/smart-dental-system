import type { ServiceCategory, ServiceFilter } from "../types";

type ServiceFiltersProps = {
  filters: ServiceFilter[];
  selected: ServiceCategory;
  onSelect: (category: ServiceCategory) => void;
};

export function ServiceFilters({ filters, selected, onSelect }: ServiceFiltersProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5" role="group" aria-label="Lọc dịch vụ">
      {filters.map((filter) => {
        const active = selected === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelect(filter.id)}
            aria-pressed={active}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              active
                ? "bg-[#0863c5] text-white shadow-md shadow-blue-200"
                : "border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-[#0863c5]"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
