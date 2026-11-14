"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react";
import { AdminEmptyState, AdminSearchInput } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { roleConfig } from "../constants";
import {
  ROLE_ORDER,
  getRolePermissions,
  type RolePermissionSummary,
} from "../role-permissions";
import type { Role } from "../types";

const COLLAPSED_CHIP_COUNT = 6;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

type RoleRow = {
  role: Role;
  permissions: RolePermissionSummary[];
  actionCount: number;
};

type RolePermissionMatrixViewProps = {
  onBack: () => void;
};

export function RolePermissionMatrixView({ onBack }: RolePermissionMatrixViewProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<Role>>(new Set());

  const allRows = useMemo<RoleRow[]>(
    () =>
      ROLE_ORDER.map((role) => {
        const permissions = getRolePermissions(role);
        return {
          role,
          permissions,
          actionCount: permissions.reduce((total, p) => total + p.actions.length, 0),
        };
      }),
    [],
  );

  const keyword = normalize(search.trim());

  const rows = useMemo(() => {
    if (!keyword) return allRows;
    return allRows.flatMap((row) => {
      if (normalize(roleConfig[row.role].label).includes(keyword)) return [row];
      const matched = row.permissions.filter((p) => normalize(p.text).includes(keyword));
      return matched.length ? [{ ...row, permissions: matched }] : [];
    });
  }, [allRows, keyword]);

  const toggleExpanded = (role: Role) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại danh sách nhân viên"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldCheck size={20} weight="duotone" className="text-brand" />
              Ma trận phân quyền
            </h2>
          </div>
        </div>
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo vai trò hoặc quyền..."
          className="w-full sm:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-16 px-5 py-3 text-center">STT</th>
                <th className="w-40 px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Quyền</th>
                <th className="w-32 px-5 py-3 text-center">Số quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <AdminEmptyState
                      icon={<ShieldCheck size={24} weight="duotone" />}
                      title="Không tìm thấy quyền phù hợp"
                      description="Thử tìm bằng tên vai trò hoặc tên chức năng khác."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const isExpanded = expanded.has(row.role) || Boolean(keyword);
                  const visible = isExpanded
                    ? row.permissions
                    : row.permissions.slice(0, COLLAPSED_CHIP_COUNT);
                  const hiddenCount = row.permissions.length - visible.length;
                  const canCollapse = expanded.has(row.role) && !keyword;

                  return (
                    <tr key={row.role} className="align-middle transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-5 text-center font-semibold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold",
                            roleConfig[row.role].color,
                          )}
                        >
                          {roleConfig[row.role].label}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          {visible.map((permission) => (
                            <span
                              key={permission.feature}
                              title={permission.text}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/15 bg-brand-light/70 px-2.5 py-1 text-xs leading-5 text-slate-600"
                            >
                              <span className="font-bold text-brand">{permission.feature}</span>
                              <span className="h-3 w-px bg-brand/20" aria-hidden="true" />
                              <span className="font-medium">
                                {permission.actions.map((a) => a.label).join(", ")}
                              </span>
                            </span>
                          ))}
                          {hiddenCount > 0 || canCollapse ? (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(row.role)}
                              className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                            >
                              {hiddenCount > 0 ? `+${hiddenCount}` : "Thu gọn"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-center">
                        <p className="text-lg font-bold leading-none text-slate-900">{row.actionCount}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {row.permissions.length} chức năng
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            {rows.length}/{allRows.length} vai trò
          </span>
        </div>
      </div>
    </div>
  );
}
