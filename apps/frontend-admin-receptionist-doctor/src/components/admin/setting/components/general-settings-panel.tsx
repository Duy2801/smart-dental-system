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
      window.alert("Anh logo toi da 2MB.");
      event.target.value = "";
      return;
    }

    try {
      const logoUrl = await resizeLogo(file);
      if (logoUrl.length > 80_000) {
        window.alert("Anh logo sau khi nen van qua lon. Hay chon anh nho hon.");
        event.target.value = "";
        return;
      }

      updateField("logoUrl", logoUrl);
    } catch {
      window.alert("Khong doc duoc anh logo. Vui long chon anh khac.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-semibold text-brand-dark">Cai dat chung</h3>
        <p className="text-sm text-muted-foreground">
          Thong tin nay se hien thi dong bo tren cac trang admin, bac si va le
          tan.
        </p>
      </div>

      <div className="space-y-8 rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ClinicLogo
              name={config.name}
              logoUrl={config.logoUrl}
              className="h-20 w-20 rounded-2xl"
            />
            <div>
              <h4 className="text-sm font-medium text-brand-dark">
                Logo phong kham
              </h4>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                Nen dung anh vuong PNG/JPG. Anh se duoc hien o goc phai Header
                cua cac role.
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
              className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-brand-dark transition-colors hover:bg-muted"
            >
              Tai anh len
            </button>
            {config.logoUrl ? (
              <button
                type="button"
                onClick={() => updateField("logoUrl", "")}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Xoa logo
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SettingsInput
            label="Ten phong kham"
            value={config.name}
            onChange={(value) => updateField("name", value)}
          />
          <SettingsInput
            label="Hotline / So dien thoai"
            value={config.phone}
            onChange={(value) => updateField("phone", value)}
          />
          <SettingsInput
            label="Email lien he"
            type="email"
            value={config.email}
            onChange={(value) => updateField("email", value)}
          />
          <SettingsInput
            label="Dia chi phong kham"
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
      <label className="text-sm font-medium text-brand-dark">{label}</label>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
