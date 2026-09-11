"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowClockwise,
  CheckCircle,
  Info,
  ShieldCheck,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";

export type PrescriptionReviewItem = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

type PrescriptionSafetyWarning = {
  code?: string;
  severity: string;
  title: string;
  detail: string;
  medicineNames: string[];
};

type MissingInformation =
  | string
  | {
      itemIndex: number;
      medicineName: string;
      fields: string[];
    };

type PrescriptionSafetyResult = {
  status: string;
  warnings: PrescriptionSafetyWarning[];
  missingInformation: MissingInformation[];
  summary: string;
  disclaimer: string;
};

type ReviewInput = {
  patientId?: string;
  medicalRecordId?: string;
  items: PrescriptionReviewItem[];
};

function normalizedItems(items: PrescriptionReviewItem[]) {
  return items.map((item) => ({
    medicineName: item.medicineName.trim(),
    dosage: item.dosage.trim(),
    frequency: item.frequency.trim(),
    duration: item.duration.trim(),
    instruction: item.instruction.trim(),
  }));
}

function errorMessage(error: unknown) {
  if (!axios.isAxiosError(error))
    return "Không thể kiểm tra an toàn đơn thuốc.";
  const message = error.response?.data?.message;
  if (Array.isArray(message) && typeof message[0] === "string")
    return message[0];
  if (typeof message === "string" && message.trim()) return message;
  return "Không thể kiểm tra an toàn đơn thuốc. Vui lòng thử lại.";
}

function isCriticalSeverity(severity: string) {
  return ["CRITICAL", "HIGH"].includes(severity.trim().toUpperCase());
}

export function usePrescriptionSafetyReview({
  patientId,
  medicalRecordId,
  items,
}: ReviewInput) {
  const [result, setResult] = useState<PrescriptionSafetyResult | null>(null);
  const [reviewedFingerprint, setReviewedFingerprint] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [criticalConfirmed, setCriticalConfirmed] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const fingerprint = useMemo(
    () =>
      JSON.stringify({
        patientId,
        medicalRecordId,
        items: normalizedItems(items),
      }),
    [items, medicalRecordId, patientId],
  );
  const isCurrent = reviewedFingerprint === fingerprint && result !== null;
  const currentResult = isCurrent ? result : null;
  const hasCritical =
    currentResult?.warnings?.some((warning) =>
      isCriticalSeverity(warning.severity),
    ) ?? false;

  const runReview = async () => {
    const reviewItems = normalizedItems(items).filter(
      (item) => item.medicineName || item.dosage,
    );
    if (reviewItems.length === 0) {
      setError("Thêm ít nhất một thuốc trước khi kiểm tra.");
      return false;
    }
    if (reviewItems.some((item) => !item.medicineName || !item.dosage)) {
      setError("Mỗi thuốc cần có tên thuốc và liều dùng trước khi kiểm tra.");
      return false;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setCriticalConfirmed(false);
    setOverrideConfirmed(false);
    const requestedFingerprint = fingerprint;
    try {
      const response = await apiClient.post<PrescriptionSafetyResult>(
        "/ai/doctor/review-prescription",
        {
          medicalRecordId: medicalRecordId || undefined,
          patientId: patientId || undefined,
          items: reviewItems,
        },
        { timeout: 60_000 },
      );
      setResult({
        ...response.data,
        warnings: response.data.warnings ?? [],
        missingInformation: response.data.missingInformation ?? [],
      });
      setReviewedFingerprint(requestedFingerprint);
      return true;
    } catch (reviewError) {
      setError(errorMessage(reviewError));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const ensureReadyToSave = async () => {
    if (!isCurrent) {
      if (error && overrideConfirmed) {
        return true;
      }
      const reviewed = await runReview();
      if (reviewed) {
        setMessage(
          "Đã kiểm tra đơn thuốc. Xem kết quả rồi bấm lưu thêm một lần để xác nhận.",
        );
      } else {
        setMessage(
          "Dịch vụ kiểm tra an toàn AI chưa phản hồi. Bác sĩ có thể tích chọn xác nhận chuyên môn bên dưới để tiếp tục lưu đơn.",
        );
      }
      return false;
    }
    if (hasCritical && !criticalConfirmed) {
      setMessage("Xác nhận đã xem cảnh báo nghiêm trọng trước khi lưu.");
      return false;
    }
    return true;
  };

  return {
    currentResult,
    stale: result !== null && !isCurrent,
    loading,
    error,
    message,
    hasCritical,
    criticalConfirmed,
    overrideConfirmed,
    setCriticalConfirmed: (confirmed: boolean) => {
      setCriticalConfirmed(confirmed);
      if (confirmed) setMessage(null);
    },
    setOverrideConfirmed: (confirmed: boolean) => {
      setOverrideConfirmed(confirmed);
      if (confirmed) setMessage(null);
    },
    runReview,
    ensureReadyToSave,
  };
}

export type PrescriptionSafetyReviewController = ReturnType<
  typeof usePrescriptionSafetyReview
>;

function severityStyle(severity: string) {
  const normalized = severity.trim().toUpperCase();
  if (normalized === "CRITICAL" || normalized === "HIGH") {
    return {
      box: "border-red-200 bg-red-50",
      badge: "bg-red-100 text-red-700",
      label: "Nghiêm trọng",
      icon: "text-red-600",
    };
  }
  if (
    normalized === "WARNING" ||
    normalized === "CAUTION" ||
    normalized === "MEDIUM"
  ) {
    return {
      box: "border-amber-200 bg-amber-50",
      badge: "bg-amber-100 text-amber-800",
      label: "Cảnh báo",
      icon: "text-amber-600",
    };
  }
  return {
    box: "border-border bg-muted",
    badge: "bg-brand-light text-brand-dark",
    label: "Thông tin",
    icon: "text-brand",
  };
}

function statusLabel(
  status: string,
  warningCount: number,
  hasCritical: boolean,
) {
  if (hasCritical) return "Có cảnh báo nghiêm trọng";
  const normalized = status.trim().toUpperCase();
  if (["SAFE", "PASS", "PASSED", "OK", "CLEAR"].includes(normalized)) {
    return "Chưa phát hiện theo bộ quy tắc hiện có";
  }
  if (normalized === "REVIEW_REQUIRED") return "Cần xem lại";
  if (warningCount > 0) return "Cần xem lại";
  return status || "Đã kiểm tra";
}

export function PrescriptionSafetyReview({
  controller,
  disabled = false,
}: {
  controller: PrescriptionSafetyReviewController;
  disabled?: boolean;
}) {
  const result = controller.currentResult;
  const label = result
    ? statusLabel(result.status, result.warnings.length, controller.hasCritical)
    : null;
  const needsAttention =
    result !== null &&
    (result.status.trim().toUpperCase() === "REVIEW_REQUIRED" ||
      result.warnings.length > 0 ||
      result.missingInformation.length > 0);

  return (
    <section
      id="prescription-safety-review"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border bg-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
            <ShieldCheck size={19} weight="duotone" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-brand-dark">
              Kiểm tra an toàn đơn thuốc
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Sàng lọc theo bộ quy tắc hiện có và tiền sử dạng văn bản trước khi
              lưu.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void controller.runReview()}
          disabled={disabled || controller.loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-xl border border-brand/30 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-light active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {controller.loading ? (
            <SpinnerGap size={16} className="animate-spin" />
          ) : result ? (
            <ArrowClockwise size={16} weight="bold" />
          ) : (
            <ShieldCheck size={16} weight="bold" />
          )}
          {controller.loading
            ? "Đang kiểm tra..."
            : result
              ? "Kiểm tra lại"
              : "Kiểm tra an toàn"}
        </button>
      </div>

      <div className="space-y-4 p-5">
        {controller.error && (
          <div className="space-y-3">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
            >
              <Warning size={17} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">{controller.error}</p>
                <p className="mt-1 text-xs text-amber-700">
                  Dịch vụ kiểm tra an toàn AI tạm thời không phản hồi. Bác sĩ có thể kiểm tra lại hoặc tích chọn xác nhận lâm sàng bên dưới để tiếp tục lưu đơn thuốc.
                </p>
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={controller.overrideConfirmed}
                onChange={(e) => controller.setOverrideConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-brand focus:ring-brand"
              />
              <span>
                Tôi xác nhận đã kiểm tra an toàn đơn thuốc theo chuyên môn lâm sàng và tiếp tục lưu đơn.
              </span>
            </label>
          </div>
        )}

        {controller.message && (
          <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-light px-3.5 py-3 text-sm text-brand-dark">
            <Info size={17} className="mt-0.5 shrink-0 text-brand" />
            <span>{controller.message}</span>
          </div>
        )}

        {controller.loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <SpinnerGap size={18} className="animate-spin text-brand" />
            Đang đối chiếu đơn thuốc và hồ sơ bệnh nhân...
          </div>
        ) : controller.stale ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
            <Warning size={17} className="mt-0.5 shrink-0" />
            <span>Đơn thuốc đã thay đổi. Cần kiểm tra lại trước khi lưu.</span>
          </div>
        ) : !result ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Chưa có kết quả kiểm tra. Hệ thống không tự thay đổi đơn thuốc của
            bác sĩ.
          </p>
        ) : (
          <>
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                controller.hasCritical
                  ? "border-red-200 bg-red-50"
                  : needsAttention
                    ? "border-amber-200 bg-amber-50"
                    : "border-brand/20 bg-brand-light"
              }`}
            >
              {controller.hasCritical || needsAttention ? (
                <Warning
                  size={19}
                  weight="fill"
                  className={
                    controller.hasCritical ? "text-red-600" : "text-amber-600"
                  }
                />
              ) : (
                <CheckCircle size={19} weight="fill" className="text-brand" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {result.summary && (
                  <p className="mt-1 text-sm leading-6 text-foreground/80">
                    {result.summary}
                  </p>
                )}
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-brand-dark">
                  Cảnh báo ({result.warnings.length})
                </h3>
                {result.warnings.map((warning, index) => {
                  const style = severityStyle(warning.severity);
                  return (
                    <article
                      key={`${warning.code}-${index}`}
                      className={`rounded-xl border px-4 py-3 ${style.box}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <Warning
                            size={17}
                            weight="fill"
                            className={`mt-0.5 shrink-0 ${style.icon}`}
                          />
                          <p className="font-semibold text-foreground">
                            {warning.title}
                          </p>
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
                        >
                          {style.label}
                          {warning.code ? ` / ${warning.code}` : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-foreground/80">
                        {warning.detail}
                      </p>
                      {warning.medicineNames?.length > 0 && (
                        <p className="mt-2 text-xs font-medium text-muted-foreground">
                          Thuốc liên quan: {warning.medicineNames.join(", ")}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {result.missingInformation.length > 0 && (
              <div className="rounded-xl border border-border bg-muted px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                  <Info size={16} className="text-brand" />
                  Thông tin còn thiếu
                </h3>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-foreground/80">
                  {result.missingInformation.map((item, index) => {
                    if (typeof item === "string") {
                      return <li key={`${item}-${index}`}>• {item}</li>;
                    }
                    const fieldLabels: Record<string, string> = {
                      dosage: "liều dùng",
                      frequency: "tần suất",
                      duration: "thời gian dùng",
                      instruction: "hướng dẫn",
                    };
                    const fields = item.fields
                      .map((field) => fieldLabels[field] ?? field)
                      .join(", ");
                    return (
                      <li key={`${item.itemIndex}-${index}`}>
                        • {item.medicineName || `Thuốc ${item.itemIndex + 1}`}:
                        thiếu {fields}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {controller.hasCritical && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <input
                  type="checkbox"
                  checked={controller.criticalConfirmed}
                  onChange={(event) =>
                    controller.setCriticalConfirmed(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-red-300 text-brand focus:ring-brand"
                />
                <span>
                  Tôi đã xem cảnh báo nghiêm trọng và vẫn xác nhận quyết định kê
                  đơn.
                </span>
              </label>
            )}

            {result.disclaimer && (
              <p className="text-xs leading-5 text-muted-foreground">
                {result.disclaimer}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
