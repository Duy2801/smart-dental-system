export function formatCurrency(amount: number, locale = "vi-VN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/** Tránh "BS. ThS.BS. ..." khi fullName đã có học hàm/học vị. */
export function formatDoctorName(name?: string | null): string {
  const n = (name ?? "").trim();
  if (!n || n === "—" || n === "--") return n || "—";
  if (/^(?:pgs|ts|ths|bs)\.?\b/i.test(n)) return n;
  return `BS. ${n}`;
}
