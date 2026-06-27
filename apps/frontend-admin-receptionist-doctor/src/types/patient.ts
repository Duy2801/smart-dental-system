export type Patient = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  createdAt: string;
};
