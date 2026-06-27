import React from "react";
import Link from "next/link";

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const MOCK_TREATMENTS = [
  { id: "TR-001", patient: "Nguyễn Văn A", title: "Cắm 2 trụ Implant Răng 46, 47", progress: 2, total: 5, status: "Đang tiến hành", nextApt: "05/07/2026" },
  { id: "TR-002", patient: "Lê Hoàng C", title: "Chữa tủy và bọc sứ Răng 38", progress: 1, total: 3, status: "Đang tiến hành", nextApt: "02/07/2026" },
  { id: "TR-003", patient: "Phạm Thị D", title: "Niềng răng mắc cài kim loại", progress: 12, total: 24, status: "Đang tiến hành", nextApt: "27/06/2026" },
  { id: "TR-004", patient: "Hoàng Minh Q", title: "Tẩy trắng răng Laser", progress: 1, total: 1, status: "Hoàn thành", nextApt: "-" },
];

export default function TreatmentsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-dark">Kế hoạch điều trị</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi lộ trình và tiến độ điều trị của bệnh nhân.</p>
          </div>
          <Link href="/doctor/treatment-plans/new" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
            <PlusIcon className="h-4 w-4" />
            Tạo kế hoạch mới
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_TREATMENTS.map((tr) => {
            const percentage = Math.round((tr.progress / tr.total) * 100);
            
            return (
              <div key={tr.id} className="group relative rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">{tr.id}</span>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{tr.patient}</h3>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ring-1 ring-inset ${
                    tr.status === 'Hoàn thành' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                  }`}>
                    {tr.status}
                  </span>
                </div>
                
                <p className="mb-6 text-sm text-foreground line-clamp-2 min-h-[40px]">
                  {tr.title}
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Tiến độ điều trị</span>
                      <span className="font-semibold text-brand-dark">{tr.progress}/{tr.total} buổi ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-brand'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                    <span className="text-muted-foreground">Hẹn tiếp theo:</span>
                    <span className="font-medium text-foreground">{tr.nextApt}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
