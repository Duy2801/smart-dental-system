/** Đọc doctorId từ cookie user_info (đồng bộ với backend JWT). */
export function getDoctorIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("user_info="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return null;
  try {
    const info = JSON.parse(decodeURIComponent(raw)) as {
      doctorId?: string | null;
    };
    return info.doctorId ?? null;
  } catch {
    return null;
  }
}

export function genderLabel(g?: string | null) {
  if (g === "MALE") return "Nam";
  if (g === "FEMALE") return "Nữ";
  if (g === "OTHER" || g === "UNKNOWN") return "Khác";
  return g || "—";
}
