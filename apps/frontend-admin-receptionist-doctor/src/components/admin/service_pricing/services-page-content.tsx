"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import {
  createService,
  deleteService,
  getServices,
  updateService,
  updateServiceStatus,
} from "./service-pricing-api";
import {
  emptyServiceForm,
  getErrorMessage,
  groupServicesByCategory,
  toServiceFormState,
} from "./service-pricing-utils";
import { ServiceFormModal } from "./components/service-form-modal";
import { ServiceGroupList } from "./components/service-group-list";
import { ServicePricingToolbar } from "./components/service-pricing-toolbar";
import type { DentalService, ServiceFormState } from "./types";

export function ServicesPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<DentalService | null>(
    null,
  );

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.admin.services(search),
    queryFn: () => getServices({ search }),
  });

  const invalidateServices = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "services"] });

  const submitMutation = useMutation({
    mutationFn: (form: ServiceFormState) =>
      editingService
        ? updateService(editingService.id, form)
        : createService(form),
    onSuccess: async () => {
      setShowModal(false);
      setEditingService(null);
      await invalidateServices();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Lưu dịch vụ thất bại"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (service: DentalService) =>
      updateServiceStatus(service.id, !service.isActive),
    onSuccess: invalidateServices,
    onError: (err) => {
      setError(getErrorMessage(err, "Cập nhật trạng thái thất bại"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (service: DentalService) => deleteService(service.id),
    onSuccess: invalidateServices,
    onError: (err) => {
      setError(getErrorMessage(err, "Xóa dịch vụ thất bại"));
    },
  });

  const groupedServices = useMemo(
    () => groupServicesByCategory(services),
    [services],
  );

  const openCreateModal = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const openEditModal = (service: DentalService) => {
    setEditingService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitMutation.isPending) return;
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (form: ServiceFormState) => {
    setError(null);
    try {
      await submitMutation.mutateAsync(form);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const toggleStatus = async (service: DentalService) => {
    setError(null);
    try {
      await statusMutation.mutateAsync(service);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const removeService = async (service: DentalService) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn ngừng dịch vụ này?");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(service);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <ServicePricingToolbar
          search={search}
          onSearchChange={setSearch}
          onCreate={openCreateModal}
        />

        <AdminAlert message={error} />

        <ServiceGroupList
          loading={loading}
          groupedServices={groupedServices}
          onEdit={openEditModal}
          onToggleStatus={(service) => void toggleStatus(service)}
          onRemove={(service) => void removeService(service)}
        />
      </div>

      {showModal ? (
        <ServiceFormModal
          title={editingService ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
          initialValue={
            editingService
              ? toServiceFormState(editingService)
              : emptyServiceForm
          }
          submitting={submitMutation.isPending}
          onClose={closeModal}
          onSubmit={(form) => void handleSubmit(form)}
        />
      ) : null}
    </>
  );
}
