import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getDoctorInfoFromCookie, getDoctorIdFromCookie, genderLabel } from "./session";

describe("doctor session utilities", () => {
  const originalCookie = document.cookie;

  afterEach(() => {
    document.cookie = originalCookie;
  });

  it("extracts doctorId and doctorName from user_info cookie", () => {
    const userInfo = JSON.stringify({
      doctorId: "doc-123",
      fullName: "Bác sĩ Hậu",
    });
    document.cookie = `user_info=${encodeURIComponent(userInfo)}; path=/`;

    const info = getDoctorInfoFromCookie();
    expect(info.doctorId).toBe("doc-123");
    expect(info.doctorName).toBe("Bác sĩ Hậu");
    expect(getDoctorIdFromCookie()).toBe("doc-123");
  });

  it("handles fallback to name property if fullName is missing", () => {
    const userInfo = JSON.stringify({
      doctorId: "doc-456",
      name: "Bác sĩ Minh",
    });
    document.cookie = `user_info=${encodeURIComponent(userInfo)}; path=/`;

    const info = getDoctorInfoFromCookie();
    expect(info.doctorId).toBe("doc-456");
    expect(info.doctorName).toBe("Bác sĩ Minh");
  });

  it("returns nulls when user_info cookie is missing or corrupted", () => {
    document.cookie = "user_info=corrupted_json; path=/";
    expect(getDoctorInfoFromCookie()).toEqual({
      doctorId: null,
      doctorName: null,
    });
  });

  it("translates gender labels correctly", () => {
    expect(genderLabel("MALE")).toBe("Nam");
    expect(genderLabel("FEMALE")).toBe("Nữ");
    expect(genderLabel("OTHER")).toBe("Khác");
    expect(genderLabel("UNKNOWN")).toBe("Khác");
    expect(genderLabel(null)).toBe("—");
  });
});

