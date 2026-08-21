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

  const removeService = async (service: DentalService) => {
    const confirmed = window.confirm(
      "Bạn chắc chắn muốn ngừng dịch vụ này?"
    );
    if (!confirmed) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(service);
    } catch {
      // Error handled by mutation onError
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

  const handleRemoveTreatmentMethod = async (
    service: DentalService,
    index: number
  ) => {
    const targetName =
      service.treatmentMethods?.[index]?.name || "phương pháp này";
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa phương pháp "${targetName}"?`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await removeTreatmentMethodMutation.mutateAsync({
        service,
        methodIndex: index,
      });
    } catch {
      // Error handled by mutation onError
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
          onRemove={(service) => void removeService(service)}
          onEditTreatmentMethod={handleEditTreatmentMethod}
          onCreateTreatmentMethod={handleCreateTreatmentMethod}
          onToggleTreatmentMethodStatus={(service, idx) =>
            void handleToggleTreatmentMethodStatus(service, idx)
          }
          onRemoveTreatmentMethod={(service, idx) =>
            void handleRemoveTreatmentMethod(service, idx)
          }
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
    </>
  );
}
