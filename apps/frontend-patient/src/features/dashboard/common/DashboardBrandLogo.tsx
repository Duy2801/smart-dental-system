"use client";

import Image from "next/image";
import Link from "next/link";
import { useClinicConfigQuery } from "../home/hooks/useHomeQueries";
import { ROUTES } from "./routes";
import { T } from "./typography";

interface DashboardBrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function DashboardBrandLogo({
  className = "hidden md:flex",
  size = 40,
  showText = true,
}: DashboardBrandLogoProps) {
  const { data: clinic } = useClinicConfigQuery();
  const logoSrc = clinic?.logoUrl?.trim() ? clinic.logoUrl : "/clinic-logo.png";
  const clinicName = clinic?.name || "Smart Dental System";

  return (
    <Link
      href={ROUTES.home}
      className={`shrink-0 items-center gap-3 text-[#0863c5] group transition ${className}`}
    >
      <span
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-slate-200 transition duration-300 group-hover:scale-105 group-hover:shadow-md"
      >
        <Image
          src={logoSrc}
          alt={`Logo ${clinicName}`}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
          priority
        />
      </span>
      {showText && (
        <span className={`${T.brandName} transition group-hover:text-[#0863c5]`}>
          {clinicName}
        </span>
      )}
    </Link>
  );
}
