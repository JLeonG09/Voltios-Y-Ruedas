import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { JwtResponse } from '../types';

// En producciÃ³n/Docker, VITE_API_URL se deja vacÃ­o a propÃ³sito para que las
// llamadas sean relativas (mismo origen) y nginx haga de proxy reverso.
// Si la variable existe pero estÃ¡ vacÃ­a o solo tiene espacios, tambiÃ©n
// caemos al modo relativo. Si hay un valor explÃ­cito, lo respetamos
// (Ãºtil para entornos donde el frontend no vive detrÃ¡s del mismo proxy).
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = envApiUrl && envApiUrl.length > 0 ? envApiUrl : '';

/** Rutas de auth pÃºblicas: un 401 aquÃ­ NO es "sesiÃ³n expirada". */
const RUTAS_AUTH_PUBLICAS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verificar-email',
  '/api/auth/reenviar-codigo',
  '/api/auth/recuperar-password',
  '/api/auth/reestablecer-password',
] as const;

export const esRutaAuthPublica = (url: string): boolean =>
  RUTAS_AUTH_PUBLICAS.some((ruta) => url.includes(ruta));

const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. RevisÃ¡ tu conexiÃ³n o intentÃ¡ mÃ¡s tarde.';
const MENSAJE_AUTH_NO_DISPONIBLE =
  'El servidor de autenticaciÃ³n no estÃ¡ disponible. Si estÃ¡s en Vercel, falta configurar VITE_API_URL.';

/**
 * Mensaje humano para errores de API (login y resto).
 * No distingue "usuario no existe" vs "contraseÃ±a incorrecta": usa el del backend.
 */
export const resolverMensajeErrorApi = (error: AxiosError): string => {
  const status = error.response?.status;
  const url = error.config?.url ?? '';
  const mensajeBackend = (error.response?.data as { mensaje?: string } | undefined)?.mensaje;

  if (mensajeBackend && mensajeBackend.trim().length > 0) {
    return mensajeBackend;
  }

  if (!error.response) {
    return MENSAJE_SIN_CONEXION;
  }

  if (
    (status === 404 || status === 405) &&
    (esRutaAuthPublica(url) || url.includes('/api/auth/'))
  ) {
    return MENSAJE_AUTH_NO_DISPONIBLE;
  }

  return error.message || 'OcurriÃ³ un error inesperado';
};

// Comparte la renovaciÃ³n en curso para no lanzar varias peticiones de refresh
// a la vez cuando varias llamadas fallan con 401 de forma simultÃ¡nea.
let refreshPromise: Promise<string | null> | null = null;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        // ngrok free muestra un interstitial HTML sin este header; rompe el login desde Vercel.
        ...(API_BASE_URL.includes('ngrok')
          ? { 'ngrok-skip-browser-warning': 'true' }
          : {}),
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
        const authPublica = esRutaAuthPublica(url);

        // Solo renovar sesiÃ³n en 401 de rutas protegidas (no login/register/â€¦).
        if (
          status === 401 &&
          original &&
          !original._retry &&
          !authPublica &&
          !url.includes('/api/auth/refresh')
        ) {
          original._retry = true;
          const newToken = await this.renovarToken();
          if (newToken) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return this.client(original);
          }
        }

        // Un 401 en login/register no debe cerrar sesiÃ³n ni redirigir.
        if (status === 401 && !authPublica) {
          this.cerrarSesion();
        }

        error.message = resolverMensajeErrorApi(error);
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
