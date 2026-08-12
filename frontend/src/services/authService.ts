import { api } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  UsuarioResponse,
  RefreshTokenRequest,
  RecuperarPasswordRequest,
  ReestablecerPasswordRequest,
  CambiarPasswordRequest,
  ActualizarPerfilRequest,
} from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<UsuarioResponse> => {
    const response = await api.post<UsuarioResponse>('/api/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UsuarioResponse> => {
    const response = await api.get<UsuarioResponse>('/api/auth/me');
    return response.data;
  },

  refresh: async (data: RefreshTokenRequest): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/refresh', data);
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await api.post('/api/auth/logout', { refreshToken });
  },

  recuperarPassword: async (data: RecuperarPasswordRequest): Promise<void> => {
    await api.post('/api/auth/recuperar-password', data);
  },

  reestablecerPassword: async (data: ReestablecerPasswordRequest): Promise<void> => {
    await api.post('/api/auth/reestablecer-password', data);
  },

  cambiarPassword: async (data: CambiarPasswordRequest): Promise<void> => {
    await api.put('/api/auth/me/password', data);
  },

  actualizarPerfil: async (data: ActualizarPerfilRequest): Promise<UsuarioResponse> => {
    const response = await api.put<UsuarioResponse>('/api/auth/me', data);
    return response.data;
  },
};
