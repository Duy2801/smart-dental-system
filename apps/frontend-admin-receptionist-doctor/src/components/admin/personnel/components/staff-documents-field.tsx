"use client";

import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DownloadSimple,
  File as FileBlank,
  FileDoc,
  FileImage,
  FilePdf,
  FileXls,
  Paperclip,
  Trash,
  X,
} from "@phosphor-icons/react";
import { showAdminToast } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { deleteStaffDocument, getStaffDocuments } from "../personnel-api";
import { getErrorMessage } from "../personnel-utils";

export const STAFF_DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_EXTENSIONS = STAFF_DOCUMENT_ACCEPT.split(",");

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocTypeIcon({ name, mimeType = "" }: { name: string; mimeType?: string }) {
  const lower = name.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return <FilePdf size={18} weight="duotone" />;
  if (mimeType.startsWith("image/") || /\.(jpe?g|png|webp)$/.test(lower)) return <FileImage size={18} weight="duotone" />;
  if (/\.docx?$/.test(lower)) return <FileDoc size={18} weight="duotone" />;
  if (/\.xlsx?$/.test(lower)) return <FileXls size={18} weight="duotone" />;
  return <FileBlank size={18} weight="duotone" />;
}

function FileRow({
  name,
  meta,
  mimeType,
  href,
  onRemove,
  removing,
  removeLabel,
}: {
  name: string;
  meta: string;
  mimeType?: string;
  href?: string;
  onRemove: () => void;
  removing?: boolean;
  removeLabel: string;
}) {
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-light text-brand">
        <DocTypeIcon name={name} mimeType={mimeType} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800" title={name}>
          {name}
        </p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Mở / tải xuống"
          aria-label={`Mở ${name}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand"
        >
          <DownloadSimple size={16} weight="bold" />
        </a>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        title={removeLabel}
        aria-label={`${removeLabel} ${name}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {href ? <Trash size={16} /> : <X size={16} weight="bold" />}
      </button>
    </li>
  );
}

type StaffDocumentsFieldProps = {
  /** id tài khoản khi đang sửa; bỏ trống khi tạo mới */
  userId?: string;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
};

/** Tài liệu hồ sơ nhân sự: file đã lưu (xóa ngay) + file mới chọn (tải lên khi bấm Lưu) */
export function StaffDocumentsField({
  userId,
  pendingFiles,
  onPendingFilesChange,
}: StaffDocumentsFieldProps) {
  const queryClient = useQueryClient();
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.personnelDocuments(userId ?? ""),
    queryFn: () => getStaffDocuments(userId!),
    enabled: Boolean(userId),
  });

  const removeMutation = useMutation({
    mutationFn: (documentId: string) => deleteStaffDocument(userId!, documentId),
    onSuccess: () => {
      showAdminToast("Đã xóa tài liệu");
      return queryClient.invalidateQueries({
        queryKey: queryKeys.admin.personnelDocuments(userId ?? ""),
      });
    },
    onError: (err) => showAdminToast(getErrorMessage(err, "Xóa tài liệu thất bại"), "error"),
  });

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of picked) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ALLOWED_EXTENSIONS.includes(ext)) rejected.push(`${file.name} (định dạng không hỗ trợ)`);
      else if (file.size > MAX_FILE_BYTES) rejected.push(`${file.name} (quá 5MB)`);
      else accepted.push(file);
    }

    const room = MAX_FILES - documents.length - pendingFiles.length;
    if (accepted.length > room) {
      rejected.push(`chỉ lưu tối đa ${MAX_FILES} tài liệu`);
      accepted.splice(Math.max(0, room));
    }

    setFileError(rejected.length ? `Không thêm được: ${rejected.join(", ")}.` : null);
    if (accepted.length) onPendingFilesChange([...pendingFiles, ...accepted]);
  };

  const hasAny = documents.length > 0 || pendingFiles.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {isLoading ? (
        <p className="text-xs text-slate-500">Đang tải tài liệu...</p>
      ) : null}

      {hasAny ? (
        <ul className="flex min-w-0 flex-col gap-2">
          {documents.map((doc) => (
            <FileRow
              key={doc.id}
              name={doc.fileName}
              mimeType={doc.mimeType}
              meta={`${formatSize(doc.fileSize)} · ${new Date(doc.createdAt).toLocaleDateString("vi-VN")}`}
              href={doc.fileUrl}
              removing={removeMutation.isPending && removeMutation.variables === doc.id}
              removeLabel="Xóa"
              onRemove={() => {
                if (window.confirm(`Xóa tài liệu "${doc.fileName}"?`)) {
                  removeMutation.mutate(doc.id);
                }
              }}
            />
          ))}
          {pendingFiles.map((file, index) => (
            <FileRow
              key={`${file.name}-${index}`}
              name={file.name}
              mimeType={file.type}
              meta={`${formatSize(file.size)} · Chờ tải lên khi lưu`}
              removeLabel="Bỏ chọn"
              onRemove={() => onPendingFilesChange(pendingFiles.filter((_, i) => i !== index))}
            />
          ))}
        </ul>
      ) : null}

      <label className="relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition-colors hover:border-brand/50 hover:bg-brand-light/40 focus-within:ring-3 focus-within:ring-brand/25">
        <Paperclip size={22} className="text-brand" weight="bold" />
        <span className="text-sm font-bold text-slate-700">Chọn file đính kèm</span>
        <span className="text-xs text-slate-500">PDF, Word, Excel, ảnh · tối đa 5MB mỗi file</span>
        <input
          type="file"
          multiple
          accept={STAFF_DOCUMENT_ACCEPT}
          className="sr-only"
          onChange={handleFiles}
        />
      </label>

      {fileError ? <p className="text-xs font-medium text-rose-600">{fileError}</p> : null}
    </div>
  );
}
