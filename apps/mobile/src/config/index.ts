import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { NEXT_PUBLIC_API_URL, BACKEND_URL } from '@env';
import { KEY_STORAGE } from '~src/constants/keyStorage';
import { getItem, removeItem, setItem } from '~src/utils/storage';
import store from '~src/reducers/store';
import { clearSession, updateAccessToken } from '~src/reducers/loginReducer';

const RESOLVED_URL =
  (NEXT_PUBLIC_API_URL || BACKEND_URL || '').replace(/\/$/, '')

export const getResolvedBackendUrl = () => RESOLVED_URL;

export const getApiBaseUrl = () =>
  RESOLVED_URL.endsWith('/api/v1') ? RESOLVED_URL : `${RESOLVED_URL}/api/v1`;

export const getSocketUrl = () => RESOLVED_URL.replace(/\/api\/v1$/, '');

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await getItem<string>(KEY_STORAGE.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getItem<string>(KEY_STORAGE.refreshToken);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResponse = await axios.post<{
        data?: { accessToken?: string };
      }>(
        `${getApiBaseUrl()}/auth/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
          timeout: 15000,
        },
      );

      const newAccessToken = refreshResponse.data?.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      await setItem(KEY_STORAGE.token, newAccessToken);
      const session = await getItem<any>(KEY_STORAGE.session);
      if (session) {
        await setItem(KEY_STORAGE.session, {
          ...session,
          accessToken: newAccessToken,
        });
      }
      store.dispatch(updateAccessToken(newAccessToken));

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await Promise.all([
        removeItem(KEY_STORAGE.session),
        removeItem(KEY_STORAGE.token),
        removeItem(KEY_STORAGE.refreshToken),
      ]);
      store.dispatch(clearSession());
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
