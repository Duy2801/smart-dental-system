import { Platform } from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import { KEY_STORAGE } from '~src/constants/keyStorage';
import { getItem } from '~src/utils/storage';

const getApiBaseUrl = () => {
  const configuredUrl = (Config.BACKEND_URL || '').replace(
    /\/$/,
    '',
  );
  const deviceUrl =
    Platform.OS === 'android'
      ? configuredUrl.replace('localhost', '10.0.2.2')
      : configuredUrl;

  return deviceUrl.endsWith('/api/v1') ? deviceUrl : `${deviceUrl}/api/v1`;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
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

