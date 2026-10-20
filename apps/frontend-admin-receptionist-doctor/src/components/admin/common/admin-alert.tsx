"use client";

import { useEffect } from "react";
import { showAdminToast, type AdminToastVariant } from "./admin-toast";

type AdminAlertProps = {
  message: string | null;
  variant?: AdminToastVariant;
};

/**
 * Thông báo trong trang admin: hiển thị dưới dạng toast thay vì chèn khối
 * vào bố cục. Mỗi khi `message` đổi sang giá trị mới sẽ bật một toast.
 */
export function AdminAlert({ message, variant = "error" }: AdminAlertProps) {
  useEffect(() => {
    if (message) showAdminToast(message, variant);
  }, [message, variant]);

  return null;
}
