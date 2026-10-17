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
    <header className="sticky top-0 z-30 flex flex-col justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
        {!hideRefresh && <DataRefreshControl />}
        {children}
      </div>
    </header>
  );
}
