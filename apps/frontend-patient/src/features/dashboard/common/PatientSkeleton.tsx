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
        "animate-pulse rounded-xl bg-slate-100",
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
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {image ? <PatientSkeleton className="h-52 rounded-none" /> : null}
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
          <PatientSkeleton className="h-56 rounded-2xl" />
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
