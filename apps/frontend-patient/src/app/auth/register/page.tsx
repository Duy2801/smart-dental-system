"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { RegisterForm } from "@/components/auth";

export default function RegisterPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError(null);
    const registrationData = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      password,
    };

    // TODO: Gọi API đăng ký với registrationData.
    void registrationData;
  }

  return (
    <RegisterForm
      passwordVisible={passwordVisible}
      confirmPasswordVisible={confirmPasswordVisible}
      error={error}
      onTogglePassword={() => setPasswordVisible((current) => !current)}
      onToggleConfirmPassword={() => setConfirmPasswordVisible((current) => !current)}
      onSubmit={handleSubmit}
    />
  );
}
