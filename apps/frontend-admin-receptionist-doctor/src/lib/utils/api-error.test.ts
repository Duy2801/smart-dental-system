import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./api-error";

describe("getApiErrorMessage", () => {
  it("explains why an appointment cannot be completed", () => {
    const error = new AxiosError("Request failed", undefined, undefined, undefined, {
      data: { message: "appointment.medical_record_required_before_complete" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    });

    expect(getApiErrorMessage(error, "Không thể kết thúc ca khám.")).toBe(
      "Vui lòng nhập và lưu chẩn đoán cùng ghi chú điều trị trước khi kết thúc khám.",
    );
  });
});
