"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { emptyClinicConfig } from "@/src/components/admin/setting/constants";
import { getClinicConfig } from "@/src/components/admin/setting/settings-api";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";

function useClinicBrand() {
  const { data } = useQuery({
    queryKey: queryKeys.admin.clinicConfig,
    queryFn: getClinicConfig,
  });

  return data ?? emptyClinicConfig;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ClinicHeaderBrand() {
  const clinic = useClinicBrand();

  return (
    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 shadow-sm">
      <ClinicLogo
        name={clinic.name}
        logoUrl={clinic.logoUrl}
        className="h-10 w-10"
      />
      <div className="hidden min-w-0 text-right sm:block">
        <p className="max-w-48 truncate text-sm font-semibold text-brand-dark">
          {clinic.name || "Chua cau hinh phong kham"}
        </p>
        <p className="max-w-48 truncate text-xs text-muted-foreground">
          {clinic.phone || "Chua co hotline"}
        </p>
      </div>
    </div>
  );
}

export function ClinicSidebarName() {
  const clinic = useClinicBrand();
  return <>{clinic.name || "Chua cau hinh"}</>;
}

export function ClinicSidebarBrand({ title }: { title: string }) {
  const clinic = useClinicBrand();

  return (
    <div className="flex items-center gap-3">
      <ClinicLogo
        name={clinic.name}
        logoUrl={clinic.logoUrl}
        className="h-11 w-11 rounded-xl bg-white/10 text-white ring-white/15"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-white/60">
          {clinic.name || "Chua cau hinh phong kham"}
        </p>
        <h2 className="mt-1 truncate text-lg font-semibold text-white">
          {title}
        </h2>
      </div>
    </div>
  );
}

export function ClinicLogo({
  className,
  logoUrl,
  name,
}: {
  className?: string;
  logoUrl?: string;
  name: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-light text-sm font-bold text-brand ring-1 ring-brand/15",
        className,
      )}
    >
      {logoUrl ? (
        <Image
          alt={`${name} logo`}
          src={logoUrl}
          width={80}
          height={80}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name) || "SD"}</span>
      )}
    </div>
  );
}
