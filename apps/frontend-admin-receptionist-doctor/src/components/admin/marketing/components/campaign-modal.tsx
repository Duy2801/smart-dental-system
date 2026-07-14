import type { FormEvent } from "react";
import type { CreateCampaignPayload } from "../marketing-api";
import type { Channel } from "../types";

type CampaignModalProps = {
  onAdd: (campaign: CreateCampaignPayload) => void;
  onClose: () => void;
};

export function CampaignModal({ onAdd, onClose }: CampaignModalProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const scheduledAt = String(formData.get("scheduled_at"));

    onAdd({
      title: String(formData.get("title")),
      content: String(formData.get("content")),
      channel: formData.get("channel") as Channel,
      scheduled_at: scheduledAt || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-white p-6 shadow-xl sm:p-8">
        <h3 className="text-xl font-semibold text-brand-dark">
          Tao chien dich moi
        </h3>

        <div className="mt-6 overflow-y-auto pr-2">
          <form
            id="campaign-form"
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Kenh gui" name="channel">
                <option value="EMAIL">Email Marketing</option>
                <option value="IN_APP">Thong bao App (In-App)</option>
              </SelectField>
              <SelectField label="Khach hang muc tieu">
                <option value="ALL">Tat ca benh nhan</option>
                <option value="VIP">Khach hang VIP</option>
                <option value="REEXAM">Sap den han tai kham</option>
              </SelectField>
            </div>

            <InputField
              label="Tieu de thong bao / Email"
              name="title"
              placeholder="Nhap tieu de hap dan..."
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Noi dung chien dich
              </label>
              <textarea
                name="content"
                required
                rows={5}
                placeholder="Chi tiet uu dai hoac thong bao..."
                className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <InputField
              className="w-full sm:w-1/2"
              label="Hen gio gui (bo trong de gui ngay)"
              name="scheduled_at"
              type="datetime-local"
            />
          </form>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-border bg-white pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
          >
            Huy
          </button>
          <button
            type="submit"
            form="campaign-form"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
          >
            Len lich gui
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-sm font-medium text-brand-dark">{label}</label>
      <input
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        {...props}
      />
    </div>
  );
}

function SelectField({
  children,
  label,
  name,
}: {
  children: React.ReactNode;
  label: string;
  name?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-brand-dark">{label}</label>
      <select
        name={name}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        {children}
      </select>
    </div>
  );
}
