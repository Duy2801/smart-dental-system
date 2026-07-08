import type { InputHTMLAttributes, ReactNode } from "react";

type FieldIconName = "user" | "mail" | "phone" | "lock";

function FieldIcon({ name }: { name: FieldIconName }) {
  const paths: Record<FieldIconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.75 19c.65-3.1 2.75-4.75 6.25-4.75S17.6 15.9 18.25 19" />
      </>
    ),
    mail: <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />,
    phone: (
      <path d="M8.1 4.5 5.5 6.1c.2 5.8 6.6 12.2 12.4 12.4l1.6-2.6-4.1-2-1.3 1.6c-2.4-.9-4.7-3.2-5.6-5.6l1.6-1.3-2-4.1Z" />
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: FieldIconName;
  hint?: ReactNode;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
};

export function FormField({
  label,
  icon,
  hint,
  type = "text",
  passwordVisible = false,
  onTogglePassword,
  ...inputProps
}: FormFieldProps) {
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint}
      </span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <FieldIcon name={icon} />
        </span>
        <input
          {...inputProps}
          type={isPassword && passwordVisible ? "text" : type}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0863c5] focus:ring-4 focus:ring-blue-100"
        />
        {isPassword && onTogglePassword && (
          <button
            type="button"
            aria-label={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={passwordVisible}
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-[#0863c5]"
          >
            <svg
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="2.5" />
              {passwordVisible && <path d="m4 4 16 16" />}
            </svg>
          </button>
        )}
      </span>
    </label>
  );
}
