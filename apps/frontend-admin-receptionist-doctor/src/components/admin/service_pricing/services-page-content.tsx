"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import {
  createService,
  deleteService,
  deleteTreatmentMethod,
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
import { DeleteConfirmationModal } from "./components/delete-confirmation-modal";
import type {
  DentalService,
  ServiceFormState,
  TreatmentMethod,
  TreatmentMethodFormItem,
} from "./types";

type DeleteTarget =
  | { kind: "service"; service: DentalService }
  | {
      kind: "method";
      service: DentalService;
      methodIndex: number;
      methodName: string;
    };

export function ServicesPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (service: DentalService) => deleteService(service.id),
    onSuccess: invalidateServices,
    onError: (err) => {
      setError(getErrorMessage(err, "Xóa dịch vụ thất bại"));
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

  // Mutation to delete a single treatment method
  const removeTreatmentMethodMutation = useMutation({
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
        return deleteTreatmentMethod(service.id, targetMethod.id);
      }

      const updatedMethods = formState.treatmentMethods.filter(
        (_, idx) => idx !== methodIndex
      );

      const updatedFormState: ServiceFormState = {
        ...formState,
        treatmentMethods: updatedMethods,
      };

      return updateService(service.id, updatedFormState);
    },
    onSuccess: invalidateServices,
    onError: (err) => {
      setError(getErrorMessage(err, "Xóa phương pháp điều trị thất bại"));
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

  const toggleStatus = async (service: DentalService) => {
    setError(null);
    try {
      await statusMutation.mutateAsync(service);
    } catch {
      // Error handled by mutation onError
    }
  };

  const removeService = (service: DentalService) => {
    setDeleteTarget({ kind: "service", service });
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

  const handleToggleTreatmentMethodStatus = async (
    service: DentalService,
    index: number
  ) => {
    setError(null);
    try {
      await toggleTreatmentMethodStatusMutation.mutateAsync({
        service,
        methodIndex: index,
      });
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleRemoveTreatmentMethod = (
    service: DentalService,
    index: number
  ) => {
    const targetName =
      service.treatmentMethods?.[index]?.name || "phương pháp này";
    setDeleteTarget({
      kind: "method",
      service,
      methodIndex: index,
      methodName: targetName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setError(null);
    try {
      if (deleteTarget.kind === "service") {
        await deleteMutation.mutateAsync(deleteTarget.service);
      } else {
        await removeTreatmentMethodMutation.mutateAsync({
          service: deleteTarget.service,
          methodIndex: deleteTarget.methodIndex,
        });
      }
      setDeleteTarget(null);
    } catch {
      // Error handled by mutation onError; keep the modal open for context.
    }
  };

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
          onToggleStatus={(service) => void toggleStatus(service)}
          onRemove={removeService}
          onEditTreatmentMethod={handleEditTreatmentMethod}
          onCreateTreatmentMethod={handleCreateTreatmentMethod}
          onToggleTreatmentMethodStatus={(service, idx) =>
            void handleToggleTreatmentMethodStatus(service, idx)
          }
          onRemoveTreatmentMethod={handleRemoveTreatmentMethod}
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
          onEditTreatmentMethod={(method, idx) => {
            if (editingService) {
              handleEditTreatmentMethod(editingService, method, idx);
            }
          }}
          onCreateTreatmentMethod={() => {
            if (editingService) {
              handleCreateTreatmentMethod(editingService);
            }
          }}
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

      {deleteTarget ? (
        <DeleteConfirmationModal
          title={
            deleteTarget.kind === "service"
              ? "Xóa dịch vụ?"
              : "Xóa phương pháp điều trị?"
          }
          itemName={
            deleteTarget.kind === "service"
              ? deleteTarget.service.name
              : deleteTarget.methodName
          }
          description={
            deleteTarget.kind === "service"
              ? "Dịch vụ đã phát sinh lịch hẹn hoặc hồ sơ điều trị sẽ được hệ thống bảo vệ và không thể xóa."
              : "Phương pháp đã phát sinh lịch hẹn sẽ được hệ thống bảo vệ và không thể xóa."
          }
          pending={
            deleteMutation.isPending ||
            removeTreatmentMethodMutation.isPending
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}
