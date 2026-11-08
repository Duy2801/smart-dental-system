import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import {
  DentalXrayAnalyzer,
  type AnalyzeXrayResponse,
} from "./dental-xray-analyzer";

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn(), patch: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);
const patchMock = vi.mocked(apiClient.patch);

const reviewAnalysis: AnalyzeXrayResponse = {
  status: "PATHOLOGY_DETECTED",
  isRadiograph: true,
  analysisId: "analysis-review",
  modelVersion: "model-v1",
  analyzedAt: "2026-09-14T00:00:00.000Z",
  summary: "Có gợi ý cần kiểm tra.",
  disclaimer: "Bác sĩ cần đối chiếu phim.",
  totalFindings: 1,
  findings: [
    {
      findingId: "finding-46",
      fdiToothNumber: 46,
      findingType: "Caries",
      confidence: 0.91,
      severity: "UNASSESSED",
      boundingBox: { x: 40, y: 30, width: 12, height: 24 },
    },
  ],
};

describe("DentalXrayAnalyzer safety states", () => {
  beforeEach(() => {
    postMock.mockReset();
    patchMock.mockReset();
  });

  it("shows a simple image toolbar without drawing, image effects, filters or report export", () => {
    render(
      <DentalXrayAnalyzer
        patientImages={[
          { id: "image-1", url: "https://example.com/patient.jpg" },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Phóng to" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thu nhỏ" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Khoanh vùng" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Invert PACS/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Độ sáng/)).not.toBeInTheDocument();
    expect(screen.queryByText("Kính soi DICOM")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Xuất PDF/ }),
    ).not.toBeInTheDocument();
  });

  it("does not add findings to another record when the analyzer unmounts during confirmation", async () => {
    let finishReview = () => {};
    const pendingReview = new Promise<void>((resolve) => {
      finishReview = resolve;
    });
    postMock.mockResolvedValueOnce({ data: reviewAnalysis });
    patchMock.mockImplementationOnce(async () => {
      await pendingReview;
      return {
        status: true,
        statusCode: 200,
        data: { reviewedAt: "2026-09-14T00:00:00.000Z" },
      };
    });
    const onApply = vi.fn();
    const onChart = vi.fn();
    const { unmount } = render(
      <DentalXrayAnalyzer
        patientImages={[{ id: "image-1", url: "https://example.com/film.jpg" }]}
        onApplyToMedicalRecord={onApply}
        onApplyToDentalChart={onChart}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Phân tích ảnh" }));
    fireEvent.click(await screen.findByRole("button", { name: "Chấp nhận" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Xác nhận và thêm vào bệnh án",
      }),
    );
    unmount();
    await act(async () => {
      finishReview();
    });
    expect(onApply).not.toHaveBeenCalled();
    expect(onChart).not.toHaveBeenCalled();
  });

  it("waits for every decision and successful persistence, then adds only accepted findings", async () => {
    const onApply = vi.fn();
    const onChart = vi.fn();
    postMock.mockResolvedValueOnce({
      data: {
        ...reviewAnalysis,
        totalFindings: 2,
        findings: [
          reviewAnalysis.findings[0],
          {
            ...reviewAnalysis.findings[0],
            findingId: "finding-35",
            fdiToothNumber: 35,
            findingType: "Missing tooth",
          },
        ],
      },
    });
    patchMock.mockRejectedValueOnce(new Error("review storage unavailable"));
    patchMock.mockResolvedValueOnce({
      data: { reviewedAt: "2026-09-14T00:00:00.000Z" },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[{ id: "image-1", url: "https://example.com/film.jpg" }]}
        onApplyToMedicalRecord={onApply}
        onApplyToDentalChart={onChart}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Phân tích ảnh" }));
    const caries = (await screen.findByText("Sâu răng")).closest("article")!;
    const missing = screen.getByText("Răng đã mất").closest("article")!;
    fireEvent.click(within(caries).getByRole("button", { name: "Chấp nhận" }));
    expect(
      screen.getByRole("button", {
        name: "Xác nhận và thêm vào bệnh án",
      }),
    ).toBeDisabled();
    fireEvent.click(
      within(missing).getByRole("button", { name: "Không đúng" }),
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Xác nhận và thêm vào bệnh án",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể lưu xác nhận rà soát",
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(onChart).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Xác nhận và thêm vào bệnh án",
      }),
    );
    await screen.findByText("Đã thêm vào bản nháp", { exact: true });
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0]).toContain("Răng 46");
    expect(onApply.mock.calls[0][0]).not.toContain("Răng 35");
    expect(onChart).toHaveBeenCalledWith([
      expect.objectContaining({ fdiToothNumber: 46, doctorStatus: "ACCEPTED" }),
    ]);
  });

  it("shows an empty state and never substitutes a demo X-ray", () => {
    const { container } = render(<DentalXrayAnalyzer patientImages={[]} />);

    expect(
      screen.getByText("Chưa có phim Panorama hỗ trợ AI"),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src*="wikimedia"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    ).toBeDisabled();
    expect(screen.queryByText("--%")).not.toBeInTheDocument();
  });

  it("shows a service error instead of classifying a connection failure as invalid image", async () => {
    postMock.mockRejectedValueOnce(new Error("network down"));
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );

    expect(
      await screen.findByText("Chưa phân tích được ảnh"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
  });

  it("does not allow switching images while an analysis request is running", () => {
    postMock.mockReturnValueOnce(new Promise(() => undefined));
    render(
      <DentalXrayAnalyzer
        onRequestUpload={vi.fn()}
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient-1.jpg",
            title: "Panorama 1",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://example.com/patient-2.jpg",
            title: "Panorama 2",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );

    expect(screen.getByRole("button", { name: "Panorama 2" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Thêm \/ đổi ảnh/i }),
    ).toBeDisabled();
  });

  it("keeps an AI storage failure distinct from an invalid radiograph", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: false,
        status: "ANALYSIS_FAILED",
        errorStatus: "ANALYSIS_FAILED",
        findings: [],
        totalFindings: 0,
        summary: "Không thể tải ảnh X-quang từ kho lưu trữ. Vui lòng thử lại.",
        treatmentRecommendations: [],
        disclaimer: "Chưa có kết quả phân tích.",
        analysisId: "analysis-failed",
        modelVersion: "model-v1",
        analyzedAt: "2026-09-14T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );

    expect(
      await screen.findByText("Chưa phân tích được ảnh"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG"),
    ).not.toBeInTheDocument();
  });

  it("shows a neutral state when no finding exceeds the model threshold", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "HEALTHY",
        findings: [],
        totalFindings: 0,
        summary: "Model chưa phát hiện bất thường vượt ngưỡng.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );

    expect(
      await screen.findByText("Không phát hiện bất thường vượt ngưỡng"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^100%$/, { selector: "span.text-3xl" }),
    ).not.toBeInTheDocument();
  });

  it("identifies the bounding box as a tooth region instead of a lesion boundary", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
            fdiToothNumber: 46,
            findingType: "Caries",
            confidence: 0.91,
            severity: "UNASSESSED",
            boundingBox: { x: 40, y: 30, width: 12, height: 24 },
          },
          {
            findingId: "88888888-8888-4888-8888-888888888888",
            fdiToothNumber: 35,
            findingType: "Missing tooth",
            confidence: 0.9,
            severity: "UNASSESSED",
            regionSource: "ESTIMATED",
            boundingBox: { x: 60, y: 30, width: 5, height: 20 },
          },
        ],
        totalFindings: 2,
        summary: "Có một vị trí cần bác sĩ kiểm tra.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );

    expect(
      await screen.findByText("Vùng răng AI đề nghị kiểm tra"),
    ).toBeInTheDocument();
    expect(screen.getByTitle(/Vùng răng 46/)).toBeInTheDocument();
    const estimatedMarker = screen.getByTitle(/Điểm dự kiến của răng 35/);
    expect(estimatedMarker).toHaveClass("border-dashed", "rounded-full");
    expect(estimatedMarker).toHaveStyle({ width: "14px", height: "14px" });
    expect(screen.getByText("≈R35")).toBeInTheDocument();
    expect(screen.getByText(/Dấu ≈ chỉ vị trí ước lượng/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xem trên phim: R46/ }));
    expect(screen.getByTitle(/Vùng răng 46/)).toBeInTheDocument();
    expect(
      screen.queryByTitle(/Điểm dự kiến của răng 35/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả vùng" }));
    expect(screen.getByTitle(/Điểm dự kiến của răng 35/)).toBeInTheDocument();
  });

  it("requires the doctor to review and persist every finding before applying it", async () => {
    const onApply = vi.fn();
    patchMock.mockResolvedValueOnce({
      data: { reviewedAt: "2026-09-14T00:00:00.000Z" },
    });
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
            fdiToothNumber: 46,
            findingType: "Caries",
            confidence: 0.91,
            severity: "UNASSESSED",
            boundingBox: { x: 40, y: 30, width: 12, height: 24 },
          },
        ],
        totalFindings: 1,
        summary: "Có một vị trí cần bác sĩ kiểm tra.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
        onApplyToMedicalRecord={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );
    const applyButton = await screen.findByRole("button", {
      name: /Xác nhận kết quả|Xác nhận và thêm vào bệnh án/i,
    });

    expect(applyButton).toBeDisabled();
    expect(screen.getByText("Đã kiểm tra 0/1 gợi ý")).toBeInTheDocument();
    expect(screen.queryByText(/Chỉ Số Sức Khỏe Răng/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Chấp nhận$/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Xác nhận kết quả|Xác nhận và thêm vào bệnh án/i,
      }),
    );

    expect(await screen.findByText("Đã thêm vào bản nháp")).toBeInTheDocument();
    expect(patchMock).toHaveBeenCalledWith(
      "/ai/doctor/xray-analyses/analysis-1/review",
      expect.objectContaining({
        findings: [
          expect.objectContaining({
            findingId: "77777777-7777-4777-8777-777777777777",
            fdiToothNumber: 46,
            doctorStatus: "ACCEPTED",
          }),
        ],
      }),
      expect.anything(),
    );

    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.getByText("Đã thêm vào bản nháp")).toBeInTheDocument();
    expect(
      screen.queryByText("Đã chèn vào Bệnh án EMR"),
    ).not.toBeInTheDocument();
  });

  it("locks finding and image mutations while the review is being persisted", async () => {
    patchMock.mockReturnValueOnce(new Promise(() => undefined));
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
            fdiToothNumber: 46,
            findingType: "Caries",
            confidence: 0.91,
            severity: "UNASSESSED",
            boundingBox: { x: 40, y: 30, width: 12, height: 24 },
          },
        ],
        totalFindings: 1,
        summary: "Có một vị trí cần bác sĩ kiểm tra.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient-1.jpg",
            title: "Panorama 1",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://example.com/patient-2.jpg",
            title: "Panorama 2",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /^Chấp nhận$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Xác nhận kết quả|Xác nhận và thêm vào bệnh án/i,
      }),
    );

    expect(
      screen.getByRole("button", { name: /Phân tích ảnh|Phân tích lại/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Panorama 2" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Đã chấp nhận$/i }),
    ).toBeDisabled();
  });

  it("toggles plain-language dental term explanation when clicking the ! info button", async () => {
    postMock.mockResolvedValueOnce({ data: reviewAnalysis });
    render(
      <DentalXrayAnalyzer
        patientImages={[{ id: "image-1", url: "https://example.com/film.jpg" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Phân tích ảnh" }));
    const infoBtn = await screen.findByRole("button", {
      name: "Giải thích: Sâu răng",
    });
    expect(infoBtn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(infoBtn);
    expect(infoBtn).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Men răng hoặc ngà răng bị vi khuẩn ăn mòn/i),
    ).toBeInTheDocument();
  });
});
