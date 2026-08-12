import { api } from './api';
import type { Vehiculo, VehiculoRequest } from '../types';

export const vehiculoService = {
  listar: async (page = 0, size = 20): Promise<{ content: Vehiculo[]; totalElements: number }> => {
    const res = await api.get<{ content: Vehiculo[]; totalElements: number }>(`/api/vehiculos?page=${page}&size=${size}`);
    return res.data;
  },

  misVehiculos: async (): Promise<Vehiculo[]> => {
    const res = await api.get<Vehiculo[]>('/api/vehiculos/mis-vehiculos');
    return res.data;
  },

  obtenerPorId: async (id: number): Promise<Vehiculo> => {
    const res = await api.get<Vehiculo>(`/api/vehiculos/${id}`);
    return res.data;
  },

  crear: async (data: VehiculoRequest): Promise<Vehiculo> => {
    const res = await api.post<Vehiculo>('/api/vehiculos', data);
    return res.data;
  },

  actualizar: async (id: number, data: VehiculoRequest): Promise<Vehiculo> => {
    const res = await api.put<Vehiculo>(`/api/vehiculos/${id}`, data);
    return res.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<Vehiculo> => {
    const res = await api.put<Vehiculo>(`/api/vehiculos/${id}/estado?estado=${encodeURIComponent(estado)}`);
    return res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/vehiculos/${id}`);
  },
};