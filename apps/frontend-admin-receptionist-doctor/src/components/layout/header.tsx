import type { ReactNode } from "react";

type HeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border bg-white px-4 py-4 sm:px-8 sm:py-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-brand-dark">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0 flex items-center gap-2 flex-wrap">{children}</div> : null}
    </header>
  );
}

