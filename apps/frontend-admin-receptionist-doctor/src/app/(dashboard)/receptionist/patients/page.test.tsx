import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import ReceptionistPatientsPage from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/src/components/layout/header", () => ({
  Header: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);
const patient = {
  id: "patient-1",
  patientCode: "PAT-001",
  fullName: "Nguyễn An",
  phone: "0900000000",
  totalVisits: 0,
  allergies: [],
};

describe("ReceptionistPatientsPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: [patient] });
  });

  afterEach(() => vi.useRealTimers());

  it("shows an error instead of claiming a failed reminder was sent", async () => {
    mockedApi.post.mockRejectedValue(new Error("mail queue unavailable"));
    render(<ReceptionistPatientsPage />);
    await act(async () => vi.advanceTimersByTime(350));
    await screen.findByText("Nguyễn An");

    fireEvent.click(screen.getByLabelText("Thao tác bệnh nhân Nguyễn An"));
    fireEvent.click(screen.getByRole("button", { name: /Nhắc tái khám 6 tháng \(Gmail\)/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Không gửi được"));
    expect(screen.queryByText(/Đã gửi lời nhắc/i)).not.toBeInTheDocument();
  });

  it("keeps existing rows visible while refreshing", async () => {
    render(<ReceptionistPatientsPage />);
    await act(async () => vi.advanceTimersByTime(350));
    await screen.findByText("Nguyễn An");
    mockedApi.get.mockReturnValue(new Promise(() => {}));

    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));

    expect(screen.getByText("Nguyễn An")).toBeInTheDocument();
  });

  it("does not let an older search response overwrite the latest query", async () => {
    let resolveOld!: (value: { data: Array<typeof patient> }) => void;
    mockedApi.get.mockImplementation((url) => {
      const value = String(url);
      if (value.includes("search=old")) {
        return new Promise((resolve) => { resolveOld = resolve; });
      }
      if (value.includes("search=new")) {
        return Promise.resolve({ data: [{ ...patient, id: "new", fullName: "Kết quả mới" }] });
      }
      return Promise.resolve({ data: [patient] });
    });
    render(<ReceptionistPatientsPage />);
    await act(async () => vi.advanceTimersByTime(350));
    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "old" } });
    await act(async () => vi.advanceTimersByTime(350));
    fireEvent.change(search, { target: { value: "new" } });
    await act(async () => vi.advanceTimersByTime(350));
    await screen.findByText("Kết quả mới");
    await act(async () => resolveOld({ data: [{ ...patient, id: "old", fullName: "Kết quả cũ" }] }));

    expect(screen.queryByText("Kết quả cũ")).not.toBeInTheDocument();
    expect(screen.getByText("Kết quả mới")).toBeInTheDocument();
  });
});
