import type { ReactNode } from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SkeletonProps = {
  className?: string;
};

export function PatientSkeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "animate-pulse rounded-xl bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70",
        className,
      )}
    />
  );
}

export function PatientCardSkeleton({
  image = true,
  lines = 4,
  className,
}: {
  image?: boolean;
  lines?: number;
  className?: string;
}) {
  return (
    <article
      className={joinClasses(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs",
        className,
      )}
    >
      {image ? <PatientSkeleton className="h-48 rounded-none" /> : null}
      <div className="space-y-3 p-5">
        {Array.from({ length: lines }).map((_, index) => (
          <PatientSkeleton
            key={index}
            className={joinClasses(
              "h-4",
              index === 0 && "h-5 w-3/4",
              index === lines - 1 && "w-1/2",
            )}
          />
        ))}
      </div>
    </article>
  );
}

export function PatientPageSkeleton({
  children,
  sidebar = true,
}: {
  children?: ReactNode;
  sidebar?: boolean;
}) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {children ?? (
        <div className="space-y-6">
          <PatientSkeleton className="h-40 rounded-2xl" />
          <div
            className={joinClasses(
              "grid gap-6",
              sidebar && "lg:grid-cols-[minmax(0,1fr)_360px]",
            )}
          >
            <div className="space-y-5">
              <PatientSkeleton className="h-64 rounded-2xl" />
              <PatientSkeleton className="h-72 rounded-2xl" />
            </div>
            {sidebar ? <PatientSkeleton className="h-96 rounded-2xl" /> : null}
          </div>
        </div>
      )}
    </main>
  );
}

export function PatientGridSkeleton({
  count = 6,
  className = "mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <section className={className} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <PatientCardSkeleton key={index} />
      ))}
    </section>
  );
}

export function PatientRecordsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header Skeleton */}
      <div className="space-y-3">
        <PatientSkeleton className="h-6 w-56 rounded-full" />
        <PatientSkeleton className="h-8 w-80 rounded-xl" />
        <PatientSkeleton className="h-4 w-full max-w-xl rounded-lg" />
      </div>

      {/* Main Consolidated 2-Column Dashboard Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left Column Skeleton */}
          <div className="border-b border-slate-200 bg-[#f4f9fd]/70 p-4 sm:p-5 lg:border-b-0 lg:border-r space-y-5">
            {/* Profile Pills Skeleton */}
            <div className="space-y-2">
              <PatientSkeleton className="h-4 w-36 rounded-md" />
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <PatientSkeleton className="h-10 w-32 rounded-xl shrink-0" />
                <PatientSkeleton className="h-10 w-28 rounded-xl shrink-0" />
              </div>
            </div>

            {/* Treatment Filter & List Skeleton */}
            <div className="pt-3 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <PatientSkeleton className="h-4 w-40 rounded-md" />
                <PatientSkeleton className="h-5 w-20 rounded-md" />
              </div>

              {/* Treatment Cards Skeletons */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <PatientSkeleton className="h-4 w-24 rounded-md" />
                    <PatientSkeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <PatientSkeleton className="h-5 w-48 rounded-md" />
                  <PatientSkeleton className="h-4 w-32 rounded-md" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <PatientSkeleton className="h-4 w-24 rounded-md" />
                    <PatientSkeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <PatientSkeleton className="h-5 w-40 rounded-md" />
                  <PatientSkeleton className="h-4 w-28 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Record Card Skeleton */}
          <div className="p-4 sm:p-6 lg:p-7 bg-[#f4f9fd]/40 space-y-6">
            {/* Patient Header Card Skeleton */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-4">
                <PatientSkeleton className="h-16 w-16 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <PatientSkeleton className="h-4 w-32 rounded-full" />
                  <PatientSkeleton className="h-6 w-48 rounded-md" />
                  <PatientSkeleton className="h-4 w-72 rounded-md" />
                </div>
              </div>
            </div>

            {/* Diagnosis Summary Skeleton */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
              <PatientSkeleton className="h-5 w-48 rounded-md" />
              <div className="grid gap-3 md:grid-cols-3">
                <PatientSkeleton className="h-20 rounded-2xl" />
                <PatientSkeleton className="h-20 rounded-2xl" />
                <PatientSkeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
