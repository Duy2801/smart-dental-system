import type { ToothStatus } from "./DentalChartEditor";

type ChartTooth = {
  number: number;
  status: ToothStatus;
};

type XrayFinding = {
  fdiToothNumber: number;
  findingType: string;
};

const EXACT_STATUS_BY_FINDING: Readonly<Record<string, ToothStatus>> = {
  Caries: "caries",
  Implant: "implant",
  "Root canal filling": "root_canal",
  "Crown / Bridge": "crown",
  Filling: "filled",
  "Missing tooth": "missing",
};

export const VALID_FDI_TEETH = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
]);

export function applyXrayFindingsToDentalChart(
  existingTeeth: ChartTooth[],
  findings: XrayFinding[]
): ChartTooth[] {
  const teeth = new Map(existingTeeth.map((tooth) => [tooth.number, tooth.status]));

  for (const finding of findings) {
    if (!VALID_FDI_TEETH.has(finding.fdiToothNumber)) {
      continue;
    }
    const status = EXACT_STATUS_BY_FINDING[finding.findingType];
    if (status) {
      teeth.set(finding.fdiToothNumber, status);
    }
  }

  return Array.from(teeth, ([number, status]) => ({ number, status }));
}
