import { api } from './api';
import type { Reserva, ReservaRequest } from '../types';

export const reservaService = {
  listar: async (page = 0, size = 10, search = '', estado = ''): Promise<{ content: Reserva[]; totalElements: number }> => {
    const params: Record<string, string | number> = { page, size, sort: 'fechaHora,desc' };
    if (search) params.search = search;
    if (estado) params.estado = estado;
    
    const response = await api.get<{ content: Reserva[]; totalElements: number }>('/api/reservas', { params });
    return response.data;
  },

  misReservas: async (): Promise<Reserva[]> => {
    const response = await api.get<Reserva[]>('/api/reservas/mis-reservas');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Reserva> => {
    const response = await api.get<Reserva>(`/api/reservas/${id}`);
    return response.data;
  },

  crear: async (data: ReservaRequest): Promise<Reserva> => {
    const response = await api.post<Reserva>('/api/reservas', data);
    return response.data;
  },

  actualizar: async (id: number, data: ReservaRequest): Promise<Reserva> => {
    const response = await api.put<Reserva>(`/api/reservas/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<Reserva> => {
    const response = await api.put<Reserva>(`/api/reservas/${id}/estado`, {}, {
      params: { estado },
    });
    return response.data;
  },

  cancelar: async (id: number): Promise<void> => {
    await api.put(`/api/reservas/${id}/cancelar`, {});
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/reservas/${id}`);
  },
};