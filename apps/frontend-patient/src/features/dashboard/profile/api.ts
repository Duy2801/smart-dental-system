import apiClient from "@/lib/axios";
import type {
  PatientProfileUpdateBody,
  PatientProfileUser,
} from "./types";

export const apiGetPatientProfile = () =>
  apiClient.get<PatientProfileUser>("/auth/me");

export const apiUpdatePatientProfile = (body: PatientProfileUpdateBody) =>
  apiClient.patch<PatientProfileUser>("/patients/me", body);
