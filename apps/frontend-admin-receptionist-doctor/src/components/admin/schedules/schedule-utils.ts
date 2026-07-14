import type { Doctor } from "./types";

export function getDoctorName(doctor: Doctor) {
  return doctor.user?.fullName || doctor.doctorCode;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
