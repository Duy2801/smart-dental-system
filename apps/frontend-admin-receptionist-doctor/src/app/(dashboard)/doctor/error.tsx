"use client";

import { useEffect } from "react";
import { WarningCircle } from "@phosphor-icons/react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DoctorError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[DoctorError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
        <WarningCircle size={40} className="text-red-500" weight="duotone" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        Có lỗi xảy ra
      </h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {error.message || "Đã có lỗi không mong muốn. Vui lòng thử lại."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
      >
        Thử lại
      </button>
    </div>
  );
}
