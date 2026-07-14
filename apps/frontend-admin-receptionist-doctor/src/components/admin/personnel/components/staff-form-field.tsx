import type { ReactNode } from "react";

type StaffFormFieldProps = {
  children: ReactNode;
  label: string;
};

export function StaffFormField({ children, label }: StaffFormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-dark">
      {label}
      {children}
    </label>
  );
}
