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

export function applyXrayFindingsToDentalChart(
  existingTeeth: ChartTooth[],
  findings: XrayFinding[]
): ChartTooth[] {
  const teeth = new Map(existingTeeth.map((tooth) => [tooth.number, tooth.status]));

  for (const finding of findings) {
    const status = EXACT_STATUS_BY_FINDING[finding.findingType];
    if (status) {
      teeth.set(finding.fdiToothNumber, status);
    }
  }

  return Array.from(teeth, ([number, status]) => ({ number, status }));
}
