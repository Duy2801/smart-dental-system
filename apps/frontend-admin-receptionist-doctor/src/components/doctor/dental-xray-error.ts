import axios from "axios";

export function getXrayAnalysisErrorMessage(error: unknown): string {
  const fallback =
    "Không thể kết nối đến dịch vụ Vision AI. Vui lòng thử lại sau.";
  if (!axios.isAxiosError(error)) return fallback;

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "Phân tích ảnh vượt quá thời gian chờ. Vui lòng thử lại sau.";
  }

  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string => typeof item === "string" && !!item.trim(),
    );
    if (messages.length) return messages.join(", ");
  }

  switch (error.response?.status) {
    case 504:
      return "Máy chủ trung gian hết thời gian chờ kết quả phân tích (HTTP 504). Vui lòng thử lại sau.";
    case 502:
      return "Máy chủ trung gian không nhận được phản hồi hợp lệ từ dịch vụ phân tích (HTTP 502). Vui lòng thử lại sau.";
    case 503:
      return "Dịch vụ phân tích ảnh hiện chưa sẵn sàng (HTTP 503). Vui lòng thử lại sau.";
    default:
      return fallback;
  }
}
