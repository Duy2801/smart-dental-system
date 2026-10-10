"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 60_000, // 15 phút: Cache dữ liệu giúp tải trang tức thì khi điều hướng
            gcTime: 30 * 60_000,    // 30 phút: Lưu giữ bộ nhớ cache
            refetchInterval: 15 * 60_000, // Tự động làm mới dữ liệu mỗi 15 phút
            refetchIntervalInBackground: false, // Tiết kiệm băng thông khi không ở tab hiện tại
            retry: 1,
            refetchOnWindowFocus: false, // Tránh giật lag giao diện khi đổi cửa sổ
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
