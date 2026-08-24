import { ChangeEvent, useRef } from "react";
import { ClinicLogo } from "@/src/components/layout/clinic-brand";
import type { ClinicConfig } from "../types";

type GeneralSettingsPanelProps = {
  config: ClinicConfig;
  onChange: (config: ClinicConfig) => void;
};

export function GeneralSettingsPanel({
  config,
  onChange,
}: GeneralSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ClinicConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      window.alert("Ảnh logo tối đa 2MB.");
      event.target.value = "";
      return;
    }

    try {
      const logoUrl = await resizeLogo(file);
      if (logoUrl.length > 80_000) {
        window.alert("Ảnh logo sau khi nén vẫn quá lớn. Hãy chọn ảnh nhỏ hơn.");
        event.target.value = "";
        return;
      }

      updateField("logoUrl", logoUrl);
    } catch {
      window.alert("Không đọc được ảnh logo. Vui lòng chọn ảnh khác.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-bold text-brand-dark">Cài đặt chung</h3>
        <p className="text-sm text-muted-foreground">
          Thông tin này sẽ hiển thị đồng bộ trên toàn bộ trang quản trị, giao diện bác sĩ và lễ tân.
        </p>
      </div>

      <div className="space-y-8 rounded-2xl border border-border bg-white p-6 shadow-xs md:p-8">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ClinicLogo
              name={config.name}
              logoUrl={config.logoUrl}
              className="h-20 w-20 rounded-2xl shadow-xs"
            />
            <div>
              <h4 className="text-sm font-bold text-brand-dark">
                Logo phòng khám
              </h4>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                Nên dùng ảnh vuông dạng PNG/JPG/WEBP. Logo sẽ được hiển thị ở góc thanh công cụ hệ thống.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-dark transition-colors hover:bg-slate-100 shadow-xs"
            >
              Tải ảnh lên
            </button>
            {config.logoUrl ? (
              <button
                type="button"
                onClick={() => updateField("logoUrl", "")}
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Xóa logo
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SettingsInput
            label="Tên phòng khám"
            value={config.name}
            onChange={(value) => updateField("name", value)}
          />
          <SettingsInput
            label="Hotline / Số điện thoại"
            value={config.phone}
            onChange={(value) => updateField("phone", value)}
          />
          <SettingsInput
            label="Email liên hệ"
            type="email"
            value={config.email}
            onChange={(value) => updateField("email", value)}
          />
          <SettingsInput
            label="Địa chỉ phòng khám"
            value={config.address}
            onChange={(value) => updateField("address", value)}
          />
        </div>
      </div>
    </div>
  );
}

function resizeLogo(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Cannot read logo file"));
    reader.onload = () => {
      const image = new window.Image();

      image.onerror = () => reject(new Error("Cannot load logo image"));
      image.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas is not supported"));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        context.clearRect(0, 0, size, size);
        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };

      image.src = String(reader.result ?? "");
    };

    reader.readAsDataURL(file);
  });
}

type SettingsInputProps = {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
};

function SettingsInput({
  label,
  onChange,
  type = "text",
  value,
}: SettingsInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-dark">{label}</label>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
      />
    </div>
  );
}
