import { api } from './api';
import type { Notificacion } from '../types';

export const notificacionesService = {
  listar: async (): Promise<Notificacion[]> => {
    const response = await api.get<Notificacion[]>('/api/notificaciones');
    return response.data;
  },

  contarNoLeidas: async (): Promise<number> => {
    const response = await api.get<number>('/api/notificaciones/no-leidas');
    return response.data;
  },

  marcarLeida: async (id: number): Promise<Notificacion> => {
    const response = await api.put<Notificacion>(`/api/notificaciones/${id}/leida`);
    return response.data;
  },

  marcarTodasLeidas: async (): Promise<void> => {
    await api.put('/api/notificaciones/leer-todas');
  },
};
