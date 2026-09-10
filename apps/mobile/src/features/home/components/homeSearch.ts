import type { HomeDoctorCard, HomeServiceCard } from '../api';

export const SEARCH_PLACEHOLDER = 'Tìm kiếm';

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getHomeSearchResults(
  keyword: string,
  services: HomeServiceCard[],
  doctors: HomeDoctorCard[],
) {
  const trimmed = keyword.trim();
  if (!trimmed) return { doctorMatches: [], serviceMatches: [] };

  const normalized = normalizeText(trimmed);
  const doctorMatches = doctors.filter(doctor =>
    normalizeText(`${doctor.name} ${doctor.specialization} ${doctor.position}`).includes(
      normalized,
    ),
  );
  const serviceMatches = services.filter(service =>
    normalizeText(`${service.name} ${service.description}`).includes(normalized),
  );

  return {
    doctorMatches: doctorMatches.slice(0, 4),
    serviceMatches: serviceMatches.slice(0, 4),
  };
}

export function shouldSearchDoctors(
  keyword: string,
  resultCounts: { doctorMatches: unknown[]; serviceMatches: unknown[] },
) {
  const normalized = normalizeText(keyword);
  return (
    normalized.includes('bac si') ||
    normalized.includes('bs') ||
    normalized.includes('thac si') ||
    normalized.includes('tien si') ||
    resultCounts.doctorMatches.length > resultCounts.serviceMatches.length
  );
}
