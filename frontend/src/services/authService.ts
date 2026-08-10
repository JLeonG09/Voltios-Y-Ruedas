import { api } from './api';
import type { LoginRequest, RegisterRequest, JwtResponse, UsuarioResponse } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<UsuarioResponse> => {
    const response = await api.post<UsuarioResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UsuarioResponse> => {
    const response = await api.get<UsuarioResponse>('/auth/me');
    return response.data;
  },
};