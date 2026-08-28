import { describe, expect, it } from "vitest";
import type { DentalFinding } from "./dental-xray-analyzer";
import {
  getVisibleFindings,
  validateXrayDimensions,
  validateXrayFile,
  validateXraySignature,
} from "./dental-xray-analysis-utils";

const finding = (findingType: string, fdiToothNumber: number): DentalFinding => ({
  findingType,
  fdiToothNumber,
  confidence: 0.9,
  severity: "MEDIUM",
  boundingBox: { x: 1, y: 1, width: 10, height: 10 },
});

describe("X-ray upload validation", () => {
  it("rejects unsupported MIME types and files larger than 10 MB", () => {
    expect(validateXrayFile(new File(["pdf"], "scan.pdf", { type: "application/pdf" }))).toMatch(/JPEG|PNG|WebP/);
    expect(
      validateXrayFile(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
      ),
    ).toMatch(/10 MB/);
  });

  it("accepts a supported image within the size limit", () => {
    expect(validateXrayFile(new File(["image"], "xray.png", { type: "image/png" }))).toBeNull();
  });

  it("rejects a file whose real signature does not match its declared image type", () => {
    expect(validateXraySignature(new Uint8Array([0x25, 0x50, 0x44, 0x46]), "image/jpeg")).toMatch(/nội dung/i);
    expect(validateXraySignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBeNull();
  });

  it("rejects unsafe pixel dimensions", () => {
    expect(validateXrayDimensions(100, 100)).toMatch(/kích thước/);
    expect(validateXrayDimensions(10_000, 3_000)).toMatch(/25 triệu/);
    expect(validateXrayDimensions(2000, 1000)).toBeNull();
  });
});

describe("finding visibility", () => {
  it("preserves the original result index after filtering", () => {
    const findings = [finding("Caries", 11), finding("Implant", 12)];

    expect(getVisibleFindings(findings, { Caries: false })).toEqual([
      { finding: findings[1], originalIndex: 1 },
    ]);
  });
});
