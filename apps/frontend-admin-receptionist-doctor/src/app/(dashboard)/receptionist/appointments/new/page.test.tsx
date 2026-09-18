import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import NewAppointmentPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

describe("NewAppointmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockImplementation((url) =>
      Promise.resolve({
        data:
          url === "/patients"
            ? []
            : {
                services: [{ id: "service-1", name: "Khám răng" }],
                selectedServiceId: "service-1",
                selectedTreatmentMethodId: "method-1",
                timeSlots: ["10:00"],
                doctors: [
                  {
                    id: "doctor-1",
                    specialization: "Nha khoa",
                    user: { fullName: "Nguyễn An" },
                    availableTimeSlots: [],
                  },
                ],
              },
      } as never),
    );
  });

  it("limits walk-in appointments to today and disables unavailable doctors", async () => {
    render(<NewAppointmentPage />);

    await screen.findByText(/Nguyễn An/);
    const checkInSelect = screen.getAllByRole("combobox")[2];
    fireEvent.change(checkInSelect, { target: { value: "WAITING" } });

    const dateInput = document.querySelector<HTMLInputElement>('input[type="date"]');
    await waitFor(() => expect(dateInput?.max).toBe(dateInput?.min));
    expect(screen.getByRole("button", { name: /Nguyễn An/ })).toBeDisabled();
  });

  it("ignores an older booking-options response after the service changes", async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    const first = new Promise((resolve) => { resolveFirst = resolve; });
    const second = new Promise((resolve) => { resolveSecond = resolve; });
    const initialOptions = {
      services: [
        { id: "service-1", name: "Dịch vụ 1" },
        { id: "service-2", name: "Dịch vụ 2" },
      ],
      selectedTreatmentMethodId: "method-1",
      timeSlots: [],
      doctors: [],
    };
    mockedApi.get.mockImplementation((url, config) => {
      if (url === "/patients") return Promise.resolve({ data: [] } as never);
      const serviceId = config?.params?.serviceId;
      if (serviceId === "service-1") return first as never;
      if (serviceId === "service-2") return second as never;
      return Promise.resolve({ data: initialOptions } as never);
    });

    render(<NewAppointmentPage />);
    await screen.findByText("Dịch vụ 1");
    const serviceSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(serviceSelect, { target: { value: "service-1" } });
    fireEvent.change(serviceSelect, { target: { value: "service-2" } });

    await act(async () => {
      resolveSecond({
        data: {
          selectedServiceId: "service-2",
          selectedTreatmentMethodId: "method-2",
          timeSlots: ["11:00"],
          doctors: [],
        },
      });
    });
    expect(await screen.findByRole("button", { name: "11:00" })).toBeInTheDocument();

    await act(async () => {
      resolveFirst({
        data: {
          selectedServiceId: "service-1",
          selectedTreatmentMethodId: "method-1",
          timeSlots: ["10:00"],
          doctors: [],
        },
      });
    });
    expect(screen.queryByRole("button", { name: "10:00" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11:00" })).toBeInTheDocument();
  });
});
