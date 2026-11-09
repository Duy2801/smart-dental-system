import { describe, expect, it } from "vitest";
import {
  collapseSpaces,
  validateClinicPhone,
  validateEmail,
  validateMobilePhone,
  validateNumber,
  validatePassword,
  validatePersonName,
  validateSlug,
  validateText,
} from "./admin-validation";

describe("admin-validation", () => {
  it("collapses extra whitespace", () => {
    expect(collapseSpaces("  Nguyễn   Văn  A ")).toBe("Nguyễn Văn A");
  });

  it("validates Vietnamese person names", () => {
    expect(validatePersonName("Nguyễn Văn Á")).toBeUndefined();
    expect(validatePersonName("   ")).toBeDefined();
    expect(validatePersonName("A")).toBeDefined();
    expect(validatePersonName("Nguyen123")).toBeDefined();
  });

  it("validates emails", () => {
    expect(validateEmail("staff@smartdental.vn")).toBeUndefined();
    expect(validateEmail("staff@smartdental")).toBeDefined();
    expect(validateEmail("", { required: false })).toBeUndefined();
  });

  it("validates Vietnamese mobile numbers", () => {
    expect(validateMobilePhone("0901 234 567")).toBeUndefined();
    expect(validateMobilePhone("+84901234567")).toBeUndefined();
    expect(validateMobilePhone("")).toBeUndefined();
    expect(validateMobilePhone("0123456789")).toBeDefined();
    expect(validateMobilePhone("09012345")).toBeDefined();
  });

  it("accepts clinic hotlines and landlines", () => {
    expect(validateClinicPhone("1900 1234")).toBeUndefined();
    expect(validateClinicPhone("028 3838 3838")).toBeUndefined();
    expect(validateClinicPhone("12345")).toBeDefined();
  });

  it("requires passwords with letters and digits", () => {
    expect(validatePassword("abc12345")).toBeUndefined();
    expect(validatePassword("abcdefgh")).toBeDefined();
    expect(validatePassword("abc 12345")).toBeDefined();
    expect(validatePassword("", { required: false })).toBeUndefined();
  });

  it("validates slugs", () => {
    expect(validateSlug("trong-rang-implant")).toBeUndefined();
    expect(validateSlug("")).toBeUndefined();
    expect(validateSlug("Trồng Răng")).toBeDefined();
  });

  it("validates numbers and text lengths", () => {
    expect(validateNumber(175000, { label: "Giá", min: 0 })).toBeUndefined();
    expect(validateNumber("", { label: "Giá" })).toBeDefined();
    expect(validateNumber(2.5, { label: "Số lượt" })).toBeDefined();
    expect(validateNumber(101, { label: "Mức giảm", max: 100 })).toBeDefined();
    expect(validateText("ab", { label: "Tên", min: 3 })).toBeDefined();
    expect(validateText("", { label: "Mô tả", max: 10 })).toBeUndefined();
  });
});
