"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const credentials = {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    // TODO: Gọi API đăng nhập với credentials.
    void credentials;
  }

  return (
    <LoginForm
      passwordVisible={passwordVisible}
      onTogglePassword={() => setPasswordVisible((current) => !current)}
      onSubmit={handleSubmit}
    />
  );
}
