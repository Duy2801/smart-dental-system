import { financeStats, revenueByService, topServicesFinance } from "@/src/components/admin/mock-data";
import { AdminTable, AdminTd, AdminTh } from "@/src/components/admin/ui/admin-table";
import { ReexamRate } from "@/src/components/admin/reexam-rate";

export function FinancePageContent() {
  const maxRevenue = Math.max(...revenueByService.map((d) => d.revenue));

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {financeStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-dark">
              {stat.value}{stat.suffix && <span className="text-base font-normal text-muted-foreground"> {stat.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-brand-dark">Doanh thu theo dịch vụ</h3>
          <div className="mt-6 flex h-48 items-end justify-between gap-3">
            {revenueByService.map((item) => (
              <div key={item.name} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-brand-dark">{item.revenue}M</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-brand" style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: "8px" }} />
                </div>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        <ReexamRate />
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Dịch vụ</AdminTh>
            <AdminTh>Số lượt</AdminTh>
            <AdminTh>Doanh thu</AdminTh>
            <AdminTh>% Tổng</AdminTh>
          </tr>
        </thead>
        <tbody>
          {topServicesFinance.map((s) => (
            <tr key={s.name}>
              <AdminTd className="font-medium">{s.name}</AdminTd>
              <AdminTd>{s.count}</AdminTd>
              <AdminTd>{s.revenue}đ</AdminTd>
              <AdminTd>{s.percent}%</AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
