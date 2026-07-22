import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

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

const getCookie = (name: string) => {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const setCookie = (name: string, value: string, maxAgeSeconds = 20 * 60) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/v1/admin`,
  timeout: 10000,
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
    const token = getCookie("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const userInfoStr = getCookie("user_info");
    if (userInfoStr && config.headers) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoStr)) as {
          branchId?: string;
        };
        if (userInfo.branchId) {
          config.headers["x-branch-id"] = userInfo.branchId;
        }
      } catch {
        // Ignore malformed client cookie data.
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    if (!error.response) {
      console.error("Network Error: Khong the ket noi toi server.");
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status !== 401) {
      if (status === 403)
        console.error("Forbidden: Ban khong co quyen truy cap.");
      else if (status === 404)
        console.error("Not Found: Khong tim thay tai nguyen.");
      else if (status === 500)
        console.error("Server Error: Co loi tu phia may chu.");
      else console.error("API Error:", error.message);

      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      typeof window === "undefined" ||
      originalRequest.url === "/auth/refresh" ||
      originalRequest._retry
    ) {
      removeCookie("access_token");
      removeCookie("refresh_token");
      removeCookie("role");
      removeCookie("session");
      removeCookie("user_info");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
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
      const refreshToken = getCookie("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post<
        ApiResponse<{ accessToken: string; refreshToken?: string }>
      >(
        `${API_ORIGIN}/api/v1/admin/auth/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      setCookie("access_token", accessToken);
      if (newRefreshToken) setCookie("refresh_token", newRefreshToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      removeCookie("access_token");
      removeCookie("refresh_token");
      removeCookie("role");
      removeCookie("session");
      removeCookie("user_info");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
