"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Buildings, ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminInput,
} from "@/src/components/admin/common";
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
  const [logoError, setLogoError] = useState<string | null>(null);

  const updateField = (field: keyof ClinicConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Ảnh logo tối đa 2MB.");
      event.target.value = "";
      return;
    }

    try {
      const logoUrl = await resizeLogo(file);
      if (logoUrl.length > 80_000) {
        setLogoError("Ảnh logo sau khi nén vẫn quá lớn. Hãy chọn ảnh nhỏ hơn.");
        event.target.value = "";
        return;
      }

      updateField("logoUrl", logoUrl);
    } catch {
      setLogoError("Không đọc được ảnh logo. Vui lòng chọn ảnh khác.");
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Cài đặt chung</h3>
        <p className="text-sm text-slate-500">
          Thông tin này hiển thị đồng bộ trên trang quản trị, giao diện bác sĩ và lễ tân.
        </p>
      </div>

      <AdminCard
        title="Logo phòng khám"
        description="Ảnh vuông PNG/JPG/WEBP, tối đa 2MB. Hiển thị ở góc thanh công cụ hệ thống."
        icon={<ImageSquare size={18} weight="duotone" />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ClinicLogo
            name={config.name}
            logoUrl={config.logoUrl}
            className="h-20 w-20 rounded-2xl shadow-xs"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            <AdminButton variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <UploadSimple size={14} weight="bold" />
              {config.logoUrl ? "Đổi logo" : "Tải ảnh lên"}
            </AdminButton>
            {config.logoUrl ? (
              <AdminButton variant="danger" size="sm" onClick={() => updateField("logoUrl", "")}>
                <Trash size={14} />
                Xóa logo
              </AdminButton>
            ) : null}
          </div>
        </div>
        {logoError ? (
          <div className="mt-4">
            <AdminAlert message={logoError} />
          </div>
        ) : null}
      </AdminCard>

      <AdminCard
        title="Thông tin liên hệ"
        icon={<Buildings size={18} weight="duotone" />}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminInput
            label="Tên phòng khám"
            value={config.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Smart Dental Clinic"
          />
          <AdminInput
            label="Hotline / Số điện thoại"
            type="tel"
            value={config.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="1900 1234"
          />
          <AdminInput
            label="Email liên hệ"
            type="email"
            value={config.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="contact@smartdental.vn"
          />
          <AdminInput
            label="Địa chỉ phòng khám"
            value={config.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Số nhà, đường, phường, quận..."
          />
        </div>
      </AdminCard>
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
