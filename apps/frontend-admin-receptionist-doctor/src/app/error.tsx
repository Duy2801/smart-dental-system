"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-black">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Đã xảy ra lỗi
      </h2>
      <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || "Không thể tải trang. Vui lòng thử lại."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Thử lại
      </button>
    </div>
  );
}
