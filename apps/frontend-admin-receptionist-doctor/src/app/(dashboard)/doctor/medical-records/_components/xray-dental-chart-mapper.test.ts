import { describe, expect, it } from "vitest";

import { applyXrayFindingsToDentalChart } from "./xray-dental-chart-mapper";

describe("applyXrayFindingsToDentalChart", () => {
  it("maps only findings with an exact Dental Chart meaning", () => {
    const result = applyXrayFindingsToDentalChart(
      [{ number: 11, status: "crown" }],
      [
        { fdiToothNumber: 16, findingType: "Caries" },
        { fdiToothNumber: 14, findingType: "Implant" },
        { fdiToothNumber: 17, findingType: "Periapical radiolucency" },
        { fdiToothNumber: 18, findingType: "Residual root" },
        { fdiToothNumber: 48, findingType: "Impacted" },
        { fdiToothNumber: 15, findingType: "Unknown finding" },
      ]
    );

    expect(result).toEqual([
      { number: 11, status: "crown" },
      { number: 16, status: "caries" },
      { number: 14, status: "implant" },
    ]);
  });

  it("safely ignores non-FDI tooth numbers such as 19, 20, 29, 99", () => {
    const result = applyXrayFindingsToDentalChart(
      [],
      [
        { fdiToothNumber: 19, findingType: "Caries" },
        { fdiToothNumber: 20, findingType: "Caries" },
        { fdiToothNumber: 29, findingType: "Caries" },
        { fdiToothNumber: 99, findingType: "Caries" },
        { fdiToothNumber: 21, findingType: "Caries" },
      ]
    );

    expect(result).toEqual([{ number: 21, status: "caries" }]);
  });
});
