"use client";

import type { ReactNode } from "react";
import { DataRefreshControl } from "./data-refresh-control";

type HeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  hideRefresh?: boolean;
};

export function Header({
  title,
  description,
  children,
  hideRefresh = false,
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border bg-white px-4 py-4 sm:px-8 sm:py-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-brand-dark">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
        {!hideRefresh && <DataRefreshControl />}
        {children}
      </div>
    </header>
  );
}
