import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { ClinicalScribeReview } from "./clinical-scribe-review";

const showConfirmMock = vi.fn();

vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({
    showConfirm: showConfirmMock,
    showAlert: vi.fn(),
  }),
}));

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);

describe("ClinicalScribeReview component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showConfirmMock.mockResolvedValue(true);
  });

  const defaultProps = {
    patientId: "test-patient-id",
    serviceName: "Khám tổng quát",
    current: {
      chiefComplaint: "",
      diagnosis: "",
      treatmentNotes: "",
    },
    onApply: vi.fn(),
  };

  it("renders collapsed by default and expands when clicking 'Mở trợ lý AI'", () => {
    render(<ClinicalScribeReview {...defaultProps} />);

    expect(screen.getByText(/Trợ lý ghi chép lâm sàng/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mở trợ lý AI/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Ghi chú nguồn/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mở trợ lý AI/i }));

    expect(screen.getByLabelText(/Ghi chú nguồn/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thu gọn/i })).toBeInTheDocument();
  });

  it("disables 'Tạo bản nháp' button when notes has less than 5 characters", () => {
    render(<ClinicalScribeReview {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Mở trợ lý AI/i }));

    const textarea = screen.getByLabelText(/Ghi chú nguồn/i);
    const generateBtn = screen.getByRole("button", { name: /Tạo bản nháp/i });

    expect(generateBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "1234" } });
    expect(generateBtn).toBeDisabled();
    expect(screen.getByText(/Vui lòng nhập tối thiểu 5 ký tự/i)).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "12345" } });
    expect(generateBtn).not.toBeDisabled();
    expect(screen.queryByText(/Vui lòng nhập tối thiểu 5 ký tự/i)).not.toBeInTheDocument();
  });

  it("generates draft and allows applying fields with confirmation if existing data exists", async () => {
    const onApplyMock = vi.fn();
    postMock.mockResolvedValueOnce({
      data: {
        chiefComplaint: "Đau răng hàm dưới",
        diagnosisDraft: "Sâu răng 46",
        treatmentNotesDraft: "Trám composite răng 46",
        disclaimer: "Bản nháp AI.",
      },
    } as any);

    render(
      <ClinicalScribeReview
        {...defaultProps}
        current={{
          chiefComplaint: "Đau răng nhẹ",
          diagnosis: "",
          treatmentNotes: "",
        }}
        onApply={onApplyMock}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Mở trợ lý AI/i }));
    const textarea = screen.getByLabelText(/Ghi chú nguồn/i);
    fireEvent.change(textarea, { target: { value: "Bệnh nhân đau răng 46 ba ngày nay" } });

    fireEvent.click(screen.getByRole("button", { name: /Tạo bản nháp/i }));

    expect(await screen.findByText(/Đối chiếu trước khi áp dụng/i)).toBeInTheDocument();
    expect(screen.getByText("Sâu răng 46")).toBeInTheDocument();

    // Field with existing content prompts confirmation
    const applySingleBtn = screen.getAllByRole("button", { name: /^Áp dụng\b/i }).find(
      (btn) => !btn.textContent?.includes("tất cả"),
    );
    expect(applySingleBtn).toBeDefined();
    fireEvent.click(applySingleBtn!);

    expect(showConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Xác nhận ghi đè nội dung",
        tone: "danger",
      }),
    );
    await waitFor(() => {
      expect(onApplyMock).toHaveBeenCalledWith({ chiefComplaint: "Đau răng hàm dưới" });
    });
  });

  it("applies all draft fields when clicking 'Áp dụng tất cả'", async () => {
    const onApplyMock = vi.fn();
    postMock.mockResolvedValueOnce({
      data: {
        chiefComplaint: "Đau răng hàm dưới",
        diagnosisDraft: "Sâu răng 46",
        treatmentNotesDraft: "Trám composite răng 46",
        disclaimer: "Bản nháp AI.",
      },
    } as any);

    render(<ClinicalScribeReview {...defaultProps} onApply={onApplyMock} />);

    fireEvent.click(screen.getByRole("button", { name: /Mở trợ lý AI/i }));
    fireEvent.change(screen.getByLabelText(/Ghi chú nguồn/i), {
      target: { value: "Khám răng 46 sâu ngà mềm" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tạo bản nháp/i }));

    const applyAllBtn = await screen.findByRole("button", { name: /Áp dụng tất cả/i });
    fireEvent.click(applyAllBtn);

    expect(onApplyMock).toHaveBeenCalledWith({
      chiefComplaint: "Đau răng hàm dưới",
      diagnosis: "Sâu răng 46",
      treatmentNotes: "Trám composite răng 46",
    });
  });
});
