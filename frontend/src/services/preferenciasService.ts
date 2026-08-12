import { api } from './api';
import type { PreferenciasRequest } from '../types';

export const preferenciasService = {
  obtener: async (): Promise<PreferenciasRequest> => {
    const response = await api.get<PreferenciasRequest>('/api/auth/preferencias');
    return response.data;
  },

  guardar: async (preferencias: PreferenciasRequest): Promise<PreferenciasRequest> => {
    const response = await api.put<PreferenciasRequest>('/api/auth/preferencias', preferencias);
    return response.data;
  },
};
