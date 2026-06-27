"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4">
      <h2 className="text-lg font-semibold text-brand-dark">Đã xảy ra lỗi</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || "Không thể tải trang. Vui lòng thử lại."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Thử lại
      </button>
    </div>
  );
}
