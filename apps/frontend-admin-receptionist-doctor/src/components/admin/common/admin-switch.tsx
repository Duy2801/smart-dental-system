import { cn } from "@/src/lib/utils/cn";

type AdminSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Nhãn cho trình đọc màn hình */
  label: string;
  disabled?: boolean;
};

/** Công tắc bật / tắt dùng chung */
export function AdminSwitch({ checked, onChange, label, disabled }: AdminSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
