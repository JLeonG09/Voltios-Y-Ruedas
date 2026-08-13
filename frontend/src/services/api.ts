import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { JwtResponse } from '../types';

// En producción/Docker, VITE_API_URL se deja vacío a propósito para que las
// llamadas sean relativas (mismo origen) y nginx haga de proxy reverso.
// Si la variable existe pero está vacía o solo tiene espacios, también
// caemos al modo relativo. Si hay un valor explícito, lo respetamos
// (útil para entornos donde el frontend no vive detrás del mismo proxy).
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = envApiUrl && envApiUrl.length > 0 ? envApiUrl : '';

// Comparte la renovación en curso para no lanzar varias peticiones de refresh
// a la vez cuando varias llamadas fallan con 401 de forma simultánea.
let refreshPromise: Promise<string | null> | null = null;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = error.response?.status;
        const url = original?.url ?? '';

        if (status === 401 && original && !original._retry && !url.includes('/api/auth/refresh')) {
          original._retry = true;
          const newToken = await this.renovarToken();
          if (newToken) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return this.client(original);
          }
        }

        if (status === 401) {
          this.cerrarSesion();
        }
        // Propaga el mensaje legible del backend (e.g. "Debes verificar tu correo...").
        const mensaje = (error.response?.data as { mensaje?: string } | undefined)?.mensaje;
        if (mensaje) {
          error.message = mensaje;
        }
        return Promise.reject(error);
      }
    );
  }

  private async renovarToken(): Promise<string | null> {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return null;

    if (!refreshPromise) {
      refreshPromise = this.client
        .post<JwtResponse>('/api/auth/refresh', { refreshToken })
        .then((res) => {
          const data = res.data;
          useAuthStore.getState().setTokens(data.token, data.refreshToken ?? refreshToken);
          return data.token;
        })
        .catch(() => {
          this.cerrarSesion();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  private cerrarSesion() {
    // Notifica al backend para invalidar (blacklist) el refresh token.
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      this.client.post('/api/auth/logout', { refreshToken }).catch(() => undefined);
    }
    useAuthStore.getState().logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: object, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: object, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: object, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
