import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { PatientsPageContent } from "./patients-page-content";

const get = vi.fn((url: string) => {
  if (url === "/patients") {
    return Promise.resolve({
      data: [
        { id: "p1", patientCode: "BN001", fullName: "Nguyễn Văn An", phone: "0901", email: null, gender: "MALE", age: 30, dateOfBirth: null, lastVisit: "2026-11-01T02:00:00Z", totalVisits: 3 },
        { id: "p2", patientCode: "BN002", fullName: "Trần Thị Bình", phone: "0902", email: null, gender: "FEMALE", age: 25, dateOfBirth: null, lastVisit: null, totalVisits: 0 },
      ],
    });
  }
  if (url === "/patients/p1") {
    return Promise.resolve({
      data: {
        id: "p1", patientCode: "BN001", fullName: "Nguyễn Văn An", phone: "0901", email: null,
        gender: "MALE", age: 30, dateOfBirth: null, address: null, medicalHistory: null,
        emergencyContactName: null, emergencyContactPhone: null,
        finance: { billedTotal: 500000, paidTotal: 500000, debtTotal: 0, invoiceCount: 1 },
        activeTreatmentPlan: null, totalVisits: 1, totalAppointments: 2,
        appointments: [
          { id: "a1", appointmentCode: "LH1", scheduledAt: "2026-11-01T02:00:00Z", status: "COMPLETED", serviceName: "Trám răng", doctorName: "Lê Minh", recordId: null, type: "OFFLINE" },
          { id: "a2", appointmentCode: "LH2", scheduledAt: "2026-11-20T02:00:00Z", status: "CANCELLED", serviceName: "Cạo vôi", doctorName: "Lê Minh", recordId: null, type: "OFFLINE" },
        ],
      },
    });
  }
  return Promise.reject(new Error(`unexpected ${url}`));
});

vi.mock("@/src/lib/api/client", () => ({ default: { get: (url: string) => get(url) } }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PatientsPageContent />
    </QueryClientProvider>,
  );
}

describe("PatientsPageContent", () => {
  it("only lists patients who have completed a visit", async () => {
    renderPage();
    expect(await screen.findByText("Nguyễn Văn An")).toBeTruthy();
    expect(screen.queryByText("Trần Thị Bình")).toBeNull();
  });

  it("opens the visit history with completed visits by default", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("Nguyễn Văn An"));
    expect(await screen.findByText("Trám răng")).toBeTruthy();
    expect(screen.queryByText("Cạo vôi")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Tất cả lịch hẹn/ }));
    expect(screen.getByText("Cạo vôi")).toBeTruthy();
  });
});
