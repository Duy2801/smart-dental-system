import axios from 'axios';
import { NEXT_PUBLIC_API_URL, BACKEND_URL } from '@env';
import { KEY_STORAGE } from '~src/constants/keyStorage';
import { getItem } from '~src/utils/storage';

const RESOLVED_URL =
  (NEXT_PUBLIC_API_URL || BACKEND_URL || '').replace(/\/$/, '')

export const getResolvedBackendUrl = () => RESOLVED_URL;

export const getApiBaseUrl = () =>
  RESOLVED_URL.endsWith('/api/v1') ? RESOLVED_URL : `${RESOLVED_URL}/api/v1`;

export const getSocketUrl = () => RESOLVED_URL.replace(/\/api\/v1$/, '');

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
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
