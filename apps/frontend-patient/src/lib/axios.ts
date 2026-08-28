import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { logout, updateAccessToken } from "@/providers";
import store from "@/providers/store";

export interface ApiResponse<T = unknown> {
  status: boolean;
  statusCode: number;
  data: T;
  message?: string;
  meta?: unknown;
}

export interface CustomAxiosInstance extends Omit<
  AxiosInstance,
  "get" | "post" | "put" | "patch" | "delete"
> {
  <T = unknown, R = ApiResponse<T>, D = unknown>(
    config: AxiosRequestConfig<D>,
  ): Promise<R>;
  <T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;

  get<T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
  post<T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
  put<T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
  patch<T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
  delete<T = unknown, R = ApiResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
}

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", "/api/v1", "/api/v1/auth"];
  paths.forEach((path) => {
    document.cookie = `${name}=; path=${path}; ${expires}`;
    document.cookie = `${name}=; path=${path}; ${expires}; domain=${window.location.hostname}`;
  });
};

const getAccessToken = () => store.getState().login.accessToken;

const clearAuthState = () => {
  const authKeys = [
    "access_token",
    "refreshToken",
    "refresh_token",
    "role",
    "session",
    "user_info",
    "patient_auth",
  ];
  authKeys.forEach(removeCookie);
  if (typeof window !== "undefined") {
    authKeys.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }
  store.dispatch(logout());
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    if (!error.response) {
      console.warn("Network Error: Khong the ket noi toi server.");
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status !== 401) {
      if (status === 403)
        console.warn("Forbidden: Ban khong co quyen truy cap.");
      else if (status === 404)
        console.warn("Not Found: Khong tim thay tai nguyen.");
      else if (status === 500)
        console.warn("Server Error: Co loi tu phia may chu.");
      else console.warn("API Error:", error.message);

      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      typeof window === "undefined" ||
      originalRequest.url === "/auth/refresh"
    ) {
      clearAuthState();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthState();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/auth/login"
      ) {
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err: unknown) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_ORIGIN}/api/v1/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken } = response.data.data;
      store.dispatch(updateAccessToken(accessToken));

      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthState();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/auth/login"
      ) {
        window.location.href = "/auth/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
