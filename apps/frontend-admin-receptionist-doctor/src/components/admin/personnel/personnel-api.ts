import apiClient from "@/src/lib/api/client";
import type {
  Role,
  RoleFilter,
  StaffFormState,
  StaffResponse,
  StaffUser,
  UserStatus,
} from "./types";

type StaffQuery = {
  roleFilter: RoleFilter;
  search: string;
};

function buildDoctorCode() {
  return `DOC-${Date.now().toString().slice(-6)}`;
}

export async function getStaffUsers({ roleFilter, search }: StaffQuery) {
  const params: Record<string, string> = {
    page: "1",
    limit: "100",
  };

  if (search.trim()) params.search = search.trim();
  if (roleFilter !== "ALL") params.roleCode = roleFilter;

  const response = await apiClient.get<StaffResponse>("/users/staff", {
    params,
  });

  return response.data.data;
}

export async function createStaffUser(form: StaffFormState) {
  if (form.role === "DOCTOR") {
    await apiClient.post("/doctors", {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      doctorCode: form.doctorCode || buildDoctorCode(),
      specialization: form.specialization,
      licenseNumber: form.licenseNumber,
      avatarUrl: form.avatarUrl || undefined,
    });
    return;
  }

  await apiClient.post(
    `/users/${form.role === "ADMIN" ? "admin" : "receptionist"}`,
    {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
    },
  );
}

export async function updateStaffUser(user: StaffUser, form: StaffFormState) {
  const commonPayload = {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone || undefined,
    password: form.password || undefined,
  };

  if (user.role === "DOCTOR") {
    if (!user.doctorId) throw new Error("Khong tim thay ho so bac si");

    await apiClient.patch(`/doctors/${user.doctorId}`, {
      ...commonPayload,
      doctorCode: form.doctorCode,
      specialization: form.specialization,
      licenseNumber: form.licenseNumber,
      avatarUrl: form.avatarUrl,
    });
    return;
  }

  if (form.role === "DOCTOR") {
    throw new Error("Hay tao bac si moi bang nut Them nhan vien");
  }

  await apiClient.patch(`/users/${user.id}`, {
    ...commonPayload,
    roleCode: form.role as Role,
  });
}

export async function updateStaffStatus(user: StaffUser, status: UserStatus) {
  if (user.role === "DOCTOR" && user.doctorId) {
    await apiClient.patch(`/doctors/${user.doctorId}`, { status });
    return;
  }

  await apiClient.patch(`/users/${user.id}`, { status });
}

export async function deleteStaffUser(user: StaffUser) {
  if (user.role === "DOCTOR" && user.doctorId) {
    await apiClient.delete(`/doctors/${user.doctorId}`);
    return;
  }

  await apiClient.delete(`/users/${user.id}`);
}
