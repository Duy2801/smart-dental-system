import { describe, expect, it } from "vitest";
import {
  cleanSearchText,
  getPatientListStats,
  paginatePatients,
  patientQuickLinks,
} from "./patient-list";

describe("doctor patient list", () => {
  it("uses treatment plans and upcoming appointments for its statistics", () => {
    const stats = getPatientListStats([
      { hasActiveTreatmentPlan: true, upcomingVisitsInNext7Days: 2 },
      { hasActiveTreatmentPlan: false, upcomingVisitsInNext7Days: 1 },
    ]);

    expect(stats).toEqual({ total: 2, active: 1, upcoming: 3 });
  });

  it("paginates the visible patient list", () => {
    expect(paginatePatients([1, 2, 3, 4, 5], 2, 2)).toEqual({
      items: [3, 4],
      page: 2,
      totalPages: 3,
    });
  });

  it("opens patient-scoped workflows from quick actions", () => {
    expect(patientQuickLinks("patient-1")).toEqual({
      records: "/doctor/patients/patient-1/records",
      prescription: "/doctor/prescriptions/new?patientId=patient-1",
      treatmentPlan: "/doctor/treatment-plans/new?patientId=patient-1",
    });
  });

  it("normalizes Vietnamese text and diacritics for search", () => {
    expect(cleanSearchText("Nguyễn Văn Đức")).toBe("nguyen van duc");
    expect(cleanSearchText("ĐỖ THỊ HỒNG")).toBe("do thi hong");
    expect(cleanSearchText("PAT-2026-001")).toBe("pat-2026-001");
  });
});
