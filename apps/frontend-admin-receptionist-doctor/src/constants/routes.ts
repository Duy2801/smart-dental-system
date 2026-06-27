export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  ADMIN: {
    ROOT: "/admin",
    USERS: "/admin/users",
    DOCTORS: "/admin/doctors",
    SERVICES: "/admin/services",
    REPORTS: "/admin/reports",
    SETTINGS: "/admin/settings",
  },
  RECEPTIONIST: {
    ROOT: "/receptionist",
    APPOINTMENTS: "/receptionist/appointments",
    APPOINTMENTS_NEW: "/receptionist/appointments/new",
    PATIENTS: "/receptionist/patients",
    PATIENTS_NEW: "/receptionist/patients/new",
    CHECK_IN: "/receptionist/check-in",
    BILLING: "/receptionist/billing",
  },
  DOCTOR: {
    ROOT: "/doctor",
    SCHEDULE: "/doctor/schedule",
    PATIENTS: "/doctor/patients",
    PRESCRIPTIONS: "/doctor/prescriptions",
    TREATMENT_PLANS: "/doctor/treatment-plans",
  },
} as const;
