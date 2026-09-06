/** Đọc doctorId từ cookie user_info (đồng bộ với backend JWT). */
export function getDoctorIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  return getDoctorInfoFromCookie().doctorId;
}

/** Đọc cả doctorId và doctorName từ cookie user_info */
export function getDoctorInfoFromCookie(): {
  doctorId: string | null;
  doctorName: string | null;
} {
  if (typeof document === "undefined") {
    return { doctorId: null, doctorName: null };
  }
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return { doctorId: null, doctorName: null };
  try {
    const info = JSON.parse(decodeURIComponent(raw)) as {
      doctorId?: string | null;
      fullName?: string | null;
      name?: string | null;
    };
    return {
      doctorId: info.doctorId ?? null,
      doctorName: info.fullName ?? info.name ?? null,
    };
  } catch {
    return { doctorId: null, doctorName: null };
  }
}

export function genderLabel(g?: string | null) {
  if (g === "MALE") return "Nam";
  if (g === "FEMALE") return "Nữ";
  if (g === "OTHER" || g === "UNKNOWN") return "Khác";
  return g || "—";
}
