import { useMemo } from 'react';
import type { AppointmentItem, AppointmentStatus } from '../types';

type UseAppointmentWorkspaceViewProps = {
  upcoming: AppointmentItem[];
  historyItems: AppointmentItem[];
  query: string;
  statusFilter: AppointmentStatus | 'all';
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function useAppointmentWorkspaceView({
  upcoming,
  historyItems,
  query,
  statusFilter,
}: UseAppointmentWorkspaceViewProps) {
  const normalizedQuery = normalize(query);

  const filteredUpcoming = useMemo(() => {
    return upcoming.filter(item => {
      const matchQuery =
        !normalizedQuery ||
        normalize(item.doctor).includes(normalizedQuery) ||
        normalize(item.service).includes(normalizedQuery) ||
        normalize(item.patientName || '').includes(normalizedQuery);

      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [normalizedQuery, statusFilter, upcoming]);

  const history = useMemo(() => {
    return historyItems.filter(item => {
      const matchQuery =
        !normalizedQuery ||
        normalize(item.doctor).includes(normalizedQuery) ||
        normalize(item.service).includes(normalizedQuery) ||
        normalize(item.patientName || '').includes(normalizedQuery);

      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [historyItems, normalizedQuery, statusFilter]);

  return {
    filteredUpcoming,
    history,
  };
}
