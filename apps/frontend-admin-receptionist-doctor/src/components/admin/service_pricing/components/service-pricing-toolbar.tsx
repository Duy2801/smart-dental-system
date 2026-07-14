import { AdminButton } from "@/src/components/admin/common";
import { PlusIcon, SearchIcon } from "./service-pricing-icons";

type ServicePricingToolbarProps = {
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  search: string;
};

export function ServicePricingToolbar({
  onCreate,
  onSearchChange,
  search,
}: ServicePricingToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full max-w-sm">
        <SearchIcon />
        <input
          type="text"
          placeholder="Tìm tên dịch vụ hoặc danh mục..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <AdminButton onClick={onCreate} className="gap-2">
        <PlusIcon />
        Thêm dịch vụ
      </AdminButton>
    </div>
  );
}
