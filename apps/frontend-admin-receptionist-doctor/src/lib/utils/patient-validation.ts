export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function validatePatientBasics(input: {
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
}): string | null {
  const fullName = input.fullName.trim();
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() ?? "";

  if (fullName.length < 2) return "Họ tên phải có ít nhất 2 ký tự.";
  if (phone.length < 8) return "Số điện thoại phải có ít nhất 8 chữ số.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email không hợp lệ.";
  }
  if (input.dateOfBirth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(input.dateOfBirth + "T00:00:00");
    if (dob > today) return "Ngày sinh không thể ở tương lai.";
  }
  return null;
}
