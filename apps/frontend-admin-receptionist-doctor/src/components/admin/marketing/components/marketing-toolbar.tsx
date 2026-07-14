import type { ChannelFilter } from "../types";

type MarketingToolbarProps = {
  channelFilter: ChannelFilter;
  search: string;
  onAddClick: () => void;
  onChannelFilterChange: (value: ChannelFilter) => void;
  onSearchChange: (value: string) => void;
};

export function MarketingToolbar({
  channelFilter,
  search,
  onAddClick,
  onChannelFilterChange,
  onSearchChange,
}: MarketingToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Tim ten chien dich..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(event) =>
            onChannelFilterChange(event.target.value as ChannelFilter)
          }
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-[150px]"
        >
          <option value="ALL">Moi kenh</option>
          <option value="EMAIL">Email</option>
          <option value="IN_APP">In-App</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
      >
        + Tao chien dich
      </button>
    </div>
  );
}
