import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { DoctorXrayAnalysisModal, type AnalyzeXrayResult } from "./DoctorXrayAnalysisModal";

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);

const result = (overrides: Partial<AnalyzeXrayResult>): AnalyzeXrayResult => ({
  isRadiograph: true,
  status: "HEALTHY",
  findings: [],
  totalFindings: 0,
  summary: "Không phát hiện bất thường.",
  diagnosisSuggestion: null,
  treatmentRecommendations: [],
  annotatedImageUrl: null,
  disclaimer: "AI hỗ trợ, bác sĩ chịu trách nhiệm kết luận.",
  analysisId: "analysis-1",
  modelVersion: "model-v1",
  analyzedAt: "2026-08-28T00:00:00.000Z",
  ...overrides,
});

const renderModal = (onApplyToRecord = vi.fn()) => {
  render(
    <DoctorXrayAnalysisModal
      imageUrl="https://example.com/patient-xray.jpg"
      imageId="11111111-1111-4111-8111-111111111111"
      onClose={vi.fn()}
      onApplyToRecord={onApplyToRecord}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Bắt đầu phân tích AI/i }));
  return onApplyToRecord;
};

describe("DoctorXrayAnalysisModal", () => {
  beforeEach(() => postMock.mockReset());

  it.each([
    result({ isRadiograph: false, status: "INVALID_IMAGE", summary: "Ảnh không hợp lệ" }),
    result({ status: "MODEL_UNAVAILABLE", summary: "Model chưa sẵn sàng" }),
  ])("does not allow a blocked result to be inserted into the EMR", async (blockedResult) => {
    postMock.mockResolvedValueOnce({ data: blockedResult });
    const onApply = renderModal();

    expect((await screen.findAllByText(blockedResult.summary)).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Thêm vào bản nháp bệnh án/i })).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("adds a successful result to the medical-record draft only after the doctor clicks apply", async () => {
    postMock.mockResolvedValueOnce({
      data: result({
        status: "PATHOLOGY_DETECTED",
        diagnosisSuggestion: "Sâu răng 16",
        treatmentRecommendations: ["Trám răng 16"],
      }),
    });
    const onApply = renderModal();

    const applyButton = await screen.findByRole("button", { name: /Thêm vào bản nháp bệnh án/i });
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(applyButton);

    await waitFor(() => expect(onApply).toHaveBeenCalledWith("Sâu răng 16", expect.stringContaining("Trám răng 16")));
    expect(screen.getByRole("button", { name: /Đã thêm vào bản nháp/i })).toBeInTheDocument();
  });
});
