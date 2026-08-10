import { api } from './api';
import type { Reserva, ReservaRequest, ReservaResponse } from '../types';

export const reservaService = {
  listar: async (page = 0, size = 10): Promise<{ content: Reserva[]; totalElements: number }> => {
    const response = await api.get<{ content: Reserva[]; totalElements: number }>('/reservas', {
      page,
      size,
      sort: 'fechaHora,desc',
    });
    return response.data;
  },

  misReservas: async (): Promise<Reserva[]> => {
    const response = await api.get<Reserva[]>('/reservas/mis-reservas');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Reserva> => {
    const response = await api.get<Reserva>(`/reservas/${id}`);
    return response.data;
  },

  crear: async (data: ReservaRequest): Promise<Reserva> => {
    const response = await api.post<Reserva>('/reservas', data);
    return response.data;
  },

  actualizar: async (id: number, data: ReservaRequest): Promise<Reserva> => {
    const response = await api.put<Reserva>(`/reservas/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<Reserva> => {
    const response = await api.put<Reserva>(`/reservas/${id}/estado`, null, {
      params: { estado },
    });
    return response.data;
  },

  cancelar: async (id: number): Promise<void> => {
    await api.put(`/reservas/${id}/cancelar`);
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/reservas/${id}`);
  },
};