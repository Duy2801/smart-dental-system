export const ROLES = {
  ADMIN: "ADMIN",
  RECEPTIONIST: "RECEPTIONIST",
  DOCTOR: "DOCTOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.RECEPTIONIST]: "Lễ tân",
  [ROLES.DOCTOR]: "Bác sĩ",
};

export const ROLE_HOME: Record<Role, string> = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.RECEPTIONIST]: "/receptionist",
  [ROLES.DOCTOR]: "/doctor",
};
