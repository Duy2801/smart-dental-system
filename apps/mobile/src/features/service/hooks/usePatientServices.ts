import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { getPatientServices } from '../api';
import type { DentalService, FaqMatch, MethodMatch } from '../types';

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const SERVICE_ORDER_BY_SLUG: Record<string, number> = {
  'trong-rang-implant': 1,
  'boc-rang-su': 2,
  'dan-su-veneer': 3,
  'nieng-rang': 4,
  'nieng-rang-mac-cai': 5,
  'nha-khoa-tong-quat': 6,
  'nho-rang-khon': 7,
  'nha-khoa-tre-em': 8,
};

function getServiceOrder(service: DentalService) {
  return (
    (service.slug ? SERVICE_ORDER_BY_SLUG[service.slug] : undefined) ??
    service.displayOrder ??
    999
  );
}

export function usePatientServices(initialKeyword = '') {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const servicesQuery = useQuery({
    queryKey: ['patient-services'],
    queryFn: getPatientServices,
    staleTime: 60000,
  });

  const rawServices = useMemo(() => {
    return Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  }, [servicesQuery.data]);

  const orderedServices = useMemo(() => {
    return [...rawServices].sort((a, b) => {
      const orderDiff = getServiceOrder(a) - getServiceOrder(b);
      if (orderDiff !== 0) return orderDiff;
      return a.title.localeCompare(b.title, 'vi');
    });
  }, [rawServices]);

  const filteredServices = useMemo(() => {
    if (!keyword.trim()) return orderedServices;
    const kw = normalizeText(keyword.trim());
    return orderedServices.filter(service => {
      const matchTitle = normalizeText(service.title).includes(kw);
      const matchSlug = service.slug && normalizeText(service.slug).includes(kw);
      const matchDesc = service.description && normalizeText(service.description).includes(kw);
      const matchMethods = (service.treatmentMethods ?? []).some(
        m =>
          normalizeText(m.name).includes(kw) ||
          (m.description && normalizeText(m.description).includes(kw)),
      );
      return matchTitle || matchSlug || matchDesc || matchMethods;
    });
  }, [orderedServices, keyword]);

  useEffect(() => {
    if (filteredServices.length > 0) {
      if (!filteredServices.some(s => s.id === selectedServiceId)) {
        setSelectedServiceId(filteredServices[0].id);
      }
    }
  }, [filteredServices, selectedServiceId]);

  const selectedService = useMemo(() => {
    return (
      filteredServices.find(s => s.id === selectedServiceId) ||
      filteredServices[0] ||
      null
    );
  }, [filteredServices, selectedServiceId]);

  const selectedMethods = useMemo<MethodMatch[]>(() => {
    if (!selectedService) return [];
    return (selectedService.treatmentMethods ?? []).map(method => ({
      service: selectedService,
      method,
    }));
  }, [selectedService]);

  const popularMethods = useMemo<MethodMatch[]>(() => {
    return filteredServices
      .flatMap(service =>
        (service.treatmentMethods ?? []).map(method => ({
          service,
          method,
        })),
      )
      .sort((a, b) => {
        const countDiff =
          (b.method.bookingCount ?? 0) - (a.method.bookingCount ?? 0);
        if (countDiff !== 0) return countDiff;
        return (a.method.displayOrder ?? 0) - (b.method.displayOrder ?? 0);
      })
      .slice(0, 4);
  }, [filteredServices]);

  const serviceFaqs = useMemo<FaqMatch[]>(() => {
    return filteredServices.flatMap(service =>
      (service.treatmentMethods ?? []).flatMap(method =>
        (method.faqs ?? []).slice(0, 2).map(faq => ({
          ...faq,
          serviceTitle: service.title,
          methodName: method.name,
        })),
      ),
    );
  }, [filteredServices]);

  return {
    servicesQuery,
    services: filteredServices,
    allServices: orderedServices,
    selectedService,
    selectedServiceId,
    setSelectedServiceId,
    selectedMethods,
    popularMethods,
    serviceFaqs,
    keyword,
    setKeyword,
    isLoading: servicesQuery.isLoading,
    isRefetching: servicesQuery.isRefetching,
    refetch: servicesQuery.refetch,
  };
}
