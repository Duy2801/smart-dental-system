"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert, AdminConfirmModal } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import {
  createService,
  getServices,
  updateService,
  updateServiceStatus,
  updateTreatmentMethod,
} from "./service-pricing-api";
import {
  emptyServiceForm,
  getErrorMessage,
  groupServicesByCategory,
  toServiceFormState,
} from "./service-pricing-utils";
import { ServiceFormModal } from "./components/service-form-modal";
import { TreatmentMethodFormModal } from "./components/treatment-method-form-modal";
import { ServiceGroupList } from "./components/service-group-list";
import { ServicePricingToolbar } from "./components/service-pricing-toolbar";
import type {
  DentalService,
  ServiceFormState,
  TreatmentMethod,
  TreatmentMethodFormItem,
} from "./types";

export function ServicesPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [serviceStatusTarget, setServiceStatusTarget] = useState<DentalService | null>(null);
  const [editingService, setEditingService] = useState<DentalService | null>(
    null
  );

  const [treatmentMethodModalTarget, setTreatmentMethodModalTarget] = useState<{
    service: DentalService;
    method?: TreatmentMethod;
    methodIndex?: number;
  } | null>(null);

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

  // Mutation to create or update a single treatment method
  const treatmentMethodMutation = useMutation({
    mutationFn: async ({
      service,
      methodForm,
      methodIndex,
    }: {
      service: DentalService;
      methodForm: TreatmentMethodFormItem;
      methodIndex?: number;
    }) => {
      if (methodForm.id) {
        return updateTreatmentMethod(service.id, methodForm.id, methodForm);
      }

      const formState = toServiceFormState(service);
      const updatedMethods = [...formState.treatmentMethods];

      if (methodIndex !== undefined && methodIndex >= 0) {
        updatedMethods[methodIndex] = methodForm;
      } else {
        updatedMethods.push(methodForm);
      }

      const updatedFormState: ServiceFormState = {
        ...formState,
        treatmentMethods: updatedMethods,
      };

      return updateService(service.id, updatedFormState);
    },
    onSuccess: async () => {
      setTreatmentMethodModalTarget(null);
      await invalidateServices();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Lưu phương pháp điều trị thất bại"));
    },
  });

  // Mutation to toggle single treatment method active status
  const toggleTreatmentMethodStatusMutation = useMutation({
    mutationFn: async ({
      service,
      methodIndex,
    }: {
      service: DentalService;
      methodIndex: number;
    }) => {
      const formState = toServiceFormState(service);
      const targetMethod = formState.treatmentMethods[methodIndex];

      if (targetMethod?.id) {
        return updateTreatmentMethod(service.id, targetMethod.id, {
          ...targetMethod,
          isActive: !targetMethod.isActive,
        });
      }

      const updatedMethods = formState.treatmentMethods.map((m, idx) =>
        idx === methodIndex ? { ...m, isActive: !m.isActive } : m
      );

      const updatedFormState: ServiceFormState = {
        ...formState,
        treatmentMethods: updatedMethods,
      };

      return updateService(service.id, updatedFormState);
    },
    onSuccess: invalidateServices,
    onError: (err) => {
      setError(
        getErrorMessage(err, "Cập nhật trạng thái phương pháp thất bại")
      );
    },
  });

  const groupedServices = useMemo(
    () => groupServicesByCategory(services),
    [services]
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
      // Error handled by mutation onError
    }
  };

  const handleConfirmToggleServiceStatus = async () => {
    if (!serviceStatusTarget) return;
    setError(null);
    try {
      await statusMutation.mutateAsync(serviceStatusTarget);
    } catch {
      // Error handled by mutation onError
    } finally {
      setServiceStatusTarget(null);
    }
  };

  // Treatment Method Handler Functions
  const handleEditTreatmentMethod = (
    service: DentalService,
    method: TreatmentMethod,
    index: number
  ) => {
    setTreatmentMethodModalTarget({ service, method, methodIndex: index });
  };

  const handleCreateTreatmentMethod = (service: DentalService) => {
    setTreatmentMethodModalTarget({ service });
  };

  const [methodStatusTarget, setMethodStatusTarget] = useState<{
    service: DentalService;
    index: number;
  } | null>(null);

  const handleToggleTreatmentMethodStatus = (
    service: DentalService,
    index: number
  ) => {
    setMethodStatusTarget({ service, index });
  };

  const handleConfirmToggleTreatmentMethodStatus = async () => {
    if (!methodStatusTarget) return;
    setError(null);
    try {
      await toggleTreatmentMethodStatusMutation.mutateAsync({
        service: methodStatusTarget.service,
        methodIndex: methodStatusTarget.index,
      });
    } catch {
      // Error handled by mutation onError
    } finally {
      setMethodStatusTarget(null);
    }
  };

  const methodStatusTargetMethod = methodStatusTarget
    ? methodStatusTarget.service.treatmentMethods?.[methodStatusTarget.index]
    : undefined;
  const methodStatusTargetActive = methodStatusTargetMethod?.isActive !== false;

  const handleTreatmentMethodSubmit = async (
    methodForm: TreatmentMethodFormItem
  ) => {
    if (!treatmentMethodModalTarget) return;
    setError(null);
    try {
      await treatmentMethodMutation.mutateAsync({
        service: treatmentMethodModalTarget.service,
        methodForm,
        methodIndex: treatmentMethodModalTarget.methodIndex,
      });
    } catch {
      // Error handled by mutation onError
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
          onToggleStatus={setServiceStatusTarget}
          onEditTreatmentMethod={handleEditTreatmentMethod}
          onCreateTreatmentMethod={handleCreateTreatmentMethod}
          onToggleTreatmentMethodStatus={handleToggleTreatmentMethodStatus}
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

      {treatmentMethodModalTarget ? (
        <TreatmentMethodFormModal
          service={treatmentMethodModalTarget.service}
          method={treatmentMethodModalTarget.method}
          submitting={treatmentMethodMutation.isPending}
          onClose={() => setTreatmentMethodModalTarget(null)}
          onSubmit={(methodForm) =>
            void handleTreatmentMethodSubmit(methodForm)
          }
        />
      ) : null}

      <AdminConfirmModal
        isOpen={Boolean(serviceStatusTarget)}
        title={serviceStatusTarget?.isActive ? "Tạm ngưng dịch vụ?" : "Cung cấp lại dịch vụ?"}
        description={
          <>
            Dịch vụ{" "}
            <strong className="font-semibold text-slate-900">{serviceStatusTarget?.name}</strong>{" "}
            {serviceStatusTarget?.isActive
              ? "sẽ bị ẩn khỏi trang bệnh nhân. Lịch hẹn, hóa đơn cũ vẫn giữ nguyên."
              : "sẽ hiển thị lại để bệnh nhân có thể xem và đặt lịch."}
          </>
        }
        confirmText={serviceStatusTarget?.isActive ? "Tạm ngưng" : "Bật lại"}
        cancelText="Hủy bỏ"
        variant={serviceStatusTarget?.isActive ? "warning" : "primary"}
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmToggleServiceStatus}
        onClose={() => setServiceStatusTarget(null)}
      />

      <AdminConfirmModal
        isOpen={Boolean(methodStatusTarget)}
        title={methodStatusTargetActive ? "Tạm ngưng phương pháp điều trị?" : "Cung cấp lại phương pháp điều trị?"}
        description={
          <>
            Phương pháp{" "}
            <strong className="font-semibold text-slate-900">{methodStatusTargetMethod?.name}</strong>{" "}
            {methodStatusTargetActive
              ? "sẽ bị ẩn khỏi trang đặt lịch, bệnh nhân không thể chọn cho tới khi bật lại."
              : "sẽ hiển thị lại để bệnh nhân có thể đặt lịch."}
          </>
        }
        confirmText={methodStatusTargetActive ? "Tạm ngưng" : "Bật lại"}
        cancelText="Hủy bỏ"
        variant={methodStatusTargetActive ? "warning" : "primary"}
        isLoading={toggleTreatmentMethodStatusMutation.isPending}
        onConfirm={handleConfirmToggleTreatmentMethodStatus}
        onClose={() => setMethodStatusTarget(null)}
      />

    </>
  );
}
