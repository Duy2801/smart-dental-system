import { isValidElement, type ReactNode } from "react";

type StaffFormFieldProps = {
  children: ReactNode;
  label: string;
};

export function StaffFormField({ children, label }: StaffFormFieldProps) {
  const required =
    isValidElement<{ required?: boolean }>(children) &&
    Boolean(children.props.required);

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-dark">
      <span>
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
