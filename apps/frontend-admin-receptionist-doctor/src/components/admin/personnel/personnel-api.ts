import apiClient from "@/src/lib/api/client";
import type {
  Role,
  RoleFilter,
  StaffDocument,
  StaffFormState,
  StaffResponse,
  StaffUser,
  UserStatus,
} from "./types";

export type StaffQuery = {
  roleFilter: RoleFilter;
  search: string;
  page?: number;
  limit?: number;
};

function buildDoctorCode() {
  return `DOC-${Date.now().toString().slice(-6)}`;
}

export async function getStaffUsers({
  roleFilter,
  search,
  page = 1,
  limit = 10,
}: StaffQuery): Promise<StaffResponse> {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };

  if (search.trim()) params.search = search.trim();
  if (roleFilter !== "ALL") params.roleCode = roleFilter;

  const response = await apiClient.get<StaffResponse>("/users/staff", {
    params,
  });

  return response.data;
}

/** Tạo nhân viên, trả về id tài khoản (users.id) để đính kèm tài liệu */
export async function createStaffUser(form: StaffFormState): Promise<string> {
  if (form.role === "DOCTOR") {
    const response = await apiClient.post<{ userId: string }>("/doctors", {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      doctorCode: form.doctorCode || buildDoctorCode(),
      specialization: form.specialization,
      licenseNumber: form.licenseNumber,
      avatarUrl: form.avatarUrl || undefined,
    });
    return response.data.userId;
  }

  const response = await apiClient.post<{ id: string }>(
    `/users/${form.role === "ADMIN" ? "admin" : "receptionist"}`,
    {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
    },
  );
  return response.data.id;
}

export async function updateStaffUser(user: StaffUser, form: StaffFormState) {
  const commonPayload = {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone || undefined,
    password: form.password || undefined,
  };

  if (user.role === "DOCTOR") {
    if (!user.doctorId) throw new Error("Không tìm thấy hồ sơ bác sĩ");

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
    throw new Error("Hãy tạo bác sĩ mới bằng nút Thêm nhân viên");
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

export async function getStaffDocuments(userId: string): Promise<StaffDocument[]> {
  const response = await apiClient.get<StaffDocument[]>(`/users/${userId}/documents`);
  return response.data;
}

export async function uploadStaffDocument(userId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await apiClient.post<StaffDocument>(
    `/users/${userId}/documents`,
    form,
    {
      timeout: 60_000,
      transformRequest: [
        (data, headers) => {
          // Để trình duyệt tự gắn Content-Type kèm boundary cho FormData
          if (data instanceof FormData && headers && typeof headers === "object") {
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return data;
        },
      ],
    },
  );
  return response.data;
}

export async function deleteStaffDocument(userId: string, documentId: string) {
  await apiClient.delete(`/users/${userId}/documents/${documentId}`);
}
