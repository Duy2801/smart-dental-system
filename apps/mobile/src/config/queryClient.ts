import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient for React Native:
 * 1. Default staleTime: 5 minutes (prevents redundant network refetches on screen/tab transitions)
 * 2. Default gcTime: 30 minutes (keeps in-memory cache alive across navigation)
 * 3. Quick retry: 1 attempt (prevents UI blocking on temporary network hiccups)
 * 4. refetchOnWindowFocus: false (prevents unnecessary re-queries when app refocuses)
 * 5. refetchOnReconnect: true (auto re-syncs once network reconnects)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 30 * 60 * 1000,   // 30 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Standard Hierarchical Query Keys Factory per performance-caching-ux
 */
export const queryKeys = {
  clinicConfig: ['clinic-config'] as const,
  home: {
    all: ['patient', 'home'] as const,
    banners: ['patient', 'home', 'banners'] as const,
    services: ['patient', 'home', 'services'] as const,
    doctors: ['patient', 'home', 'doctors'] as const,
    clinicalCases: ['patient', 'home', 'clinical-cases'] as const,
    promotions: ['patient', 'home', 'promotions'] as const,
  },
  services: {
    all: ['patient', 'services'] as const,
    list: (keyword?: string) => ['patient', 'services', { keyword }] as const,
    detail: (id: string) => ['patient', 'services', id] as const,
  },
  doctors: {
    all: ['patient', 'doctors'] as const,
    detail: (id: string) => ['patient', 'doctors', id] as const,
  },
  appointments: {
    all: ['patient', 'appointments'] as const,
    list: () => ['patient-appointments'] as const,
    detail: (id: string) => ['patient', 'appointments', id] as const,
    options: (params?: unknown) => ['patient', 'appointment-options', params] as const,
  },
  consultations: {
    all: ['consultation'] as const,
    packages: ['consultation', 'packages'] as const,
    doctors: ['consultation', 'doctors'] as const,
    slots: (doctorId?: string, date?: string, duration?: number) =>
      ['consultation', 'slots', doctorId, date, duration] as const,
    myList: ['consultation', 'my-consultations'] as const,
  },
  records: {
    all: ['patient', 'records'] as const,
    profiles: ['patient', 'records', 'profiles'] as const,
  },
  notifications: ['patient', 'notifications'] as const,
  profile: ['patient', 'profile'] as const,
};

/**
 * Cache timing presets matching performance-caching-ux skill
 */
export const CACHE_TIMES = {
  // Static / configuration data
  CLINIC_CONFIG: {
    staleTime: 30 * 60 * 1000, // 30 mins
    gcTime: 120 * 60 * 1000,   // 2 hours
  },
  // Catalogs and directories
  CATALOG: {
    staleTime: 10 * 60 * 1000, // 10 mins
    gcTime: 60 * 60 * 1000,    // 1 hour
  },
  // Showcase albums
  ALBUM: {
    staleTime: 15 * 60 * 1000, // 15 mins
    gcTime: 60 * 60 * 1000,    // 1 hour
  },
  // User appointments list
  APPOINTMENTS: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 15 * 60 * 1000,    // 15 mins
  },
  // Realtime doctor slots & availability
  SLOTS: {
    staleTime: 15 * 1000,      // 15 seconds
    gcTime: 10 * 60 * 1000,    // 10 mins
  },
  // User profile & notification count
  USER_DATA: {
    staleTime: 60 * 1000,      // 1 min
    gcTime: 15 * 60 * 1000,    // 15 mins
  },
};
