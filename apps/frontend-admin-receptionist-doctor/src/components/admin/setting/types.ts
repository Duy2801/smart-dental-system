export type SettingsTab = "general" | "hours";

export type BusinessHour = {
  id: number;
  label: string;
  isOpen: boolean;
  start: string;
  end: string;
};

export type ClinicConfig = {
  name: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  businessHours: BusinessHour[];
};

export type SettingsMenuItem = {
  id: SettingsTab;
  label: string;
  icon: "settings" | "clock";
};
