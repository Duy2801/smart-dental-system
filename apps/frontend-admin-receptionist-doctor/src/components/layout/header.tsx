import type { ReactNode } from "react";

type HeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-border bg-white px-8 py-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-brand-dark">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
