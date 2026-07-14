import { AdminInput } from "@/src/components/admin/common";

type TimeInputProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export function TimeInput({ label, onChange, value }: TimeInputProps) {
  return (
    <AdminInput
      label={label}
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
    />
  );
}
