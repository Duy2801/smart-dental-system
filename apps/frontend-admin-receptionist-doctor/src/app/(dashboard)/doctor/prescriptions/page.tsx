import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { Plus, Printer, Eye, Pill } from "@phosphor-icons/react/dist/ssr";

type PrescriptionStatus = "DRAFT" | "ISSUED";

const statusMap: Record<PrescriptionStatus, { label: string; color: string }> =
  {
    DRAFT: {
      label: "Nháp",
      color: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    ISSUED: {
      label: "Đã xuất",
      color: "bg-green-50 text-green-700 ring-green-600/20",
    },
  };

const MOCK_PRESCRIPTIONS = [
  {
    id: "RX-2026-001",
    date: "21/07/2026",
    patient: "Phạm Dũng",
    patientCode: "BN-2003",
    diagnosis: "Viêm tủy răng 38",
    itemCount: 3,
    status: "DRAFT" as PrescriptionStatus,
  },
  {
    id: "RX-2026-002",
    date: "20/07/2026",
    patient: "Nguyễn Văn A",
    patientCode: "BN-2001",
    diagnosis: "Viêm nha chu nhẹ",
    itemCount: 2,
    status: "ISSUED" as PrescriptionStatus,
  },
  {
    id: "RX-2026-003",
    date: "18/07/2026",
    patient: "Phạm Thị D",
    patientCode: "BN-2007",
    diagnosis: "Đau nhức sau cắm Implant",
    itemCount: 4,
    status: "ISSUED" as PrescriptionStatus,
  },
  {
    id: "RX-2026-004",
    date: "15/07/2026",
    patient: "Lê Minh Cường",
    patientCode: "BN-2005",
    diagnosis: "Sau tẩy trắng răng — ê buốt nhẹ",
    itemCount: 1,
    status: "ISSUED" as PrescriptionStatus,
  },
];

export default function PrescriptionsPage() {
  return (
    <>
      <Header
        title="Đơn thuốc điện tử"
        description="Kê đơn, phê duyệt và in đơn thuốc cho bệnh nhân"
      >
        <Link
          href="/doctor/prescriptions/new"
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Kê đơn mới
        </Link>
      </Header>

      <div className="p-6 md:p-8">
        {MOCK_PRESCRIPTIONS.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
            <Pill size={48} className="mb-4 text-slate-300" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              Chưa có đơn thuốc nào
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">Mã đơn</th>
                    <th className="px-5 py-3.5">Ngày kê</th>
                    <th className="px-5 py-3.5">Bệnh nhân</th>
                    <th className="px-5 py-3.5">Chẩn đoán</th>
                    <th className="px-5 py-3.5 text-center">Số thuốc</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {MOCK_PRESCRIPTIONS.map((rx) => {
                    const s = statusMap[rx.status];
                    return (
                      <tr
                        key={rx.id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-brand-dark">
                          {rx.id}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {rx.date}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {rx.patient}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rx.patientCode}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {rx.diagnosis}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {rx.itemCount}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                              s.color,
                            )}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-900">
                              <Eye size={13} /> Xem
                            </button>
                            <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-900">
                              <Printer size={13} /> In
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
