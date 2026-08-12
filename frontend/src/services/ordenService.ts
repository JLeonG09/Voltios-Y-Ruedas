import { api } from './api';
import type { OrdenTrabajo, OrdenTrabajoRequest, RepuestoOrdenRequest, Bitacora, EstadoOrden } from '../types';

export const ordenService = {
  listar: async (page = 0, size = 10): Promise<{ content: OrdenTrabajo[]; totalElements: number }> => {
    const response = await api.get<{ content: OrdenTrabajo[]; totalElements: number }>('/api/ordenes', {
      params: { page, size, sort: 'fechaIngreso,desc' },
    });
    return response.data;
  },

  misOrdenes: async (): Promise<OrdenTrabajo[]> => {
    const response = await api.get<OrdenTrabajo[]>('/api/ordenes/mis-ordenes');
    return response.data;
  },

  miHistorial: async (): Promise<OrdenTrabajo[]> => {
    const response = await api.get<OrdenTrabajo[]>('/api/ordenes/mi-historial');
    return response.data;
  },

  historialStaff: async (page = 0, size = 50): Promise<OrdenTrabajo[]> => {
    const response = await api.get<OrdenTrabajo[]>('/api/ordenes/historial', {
      params: { page, size, sort: 'fechaIngreso,desc' },
    });
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<OrdenTrabajo> => {
    const response = await api.get<OrdenTrabajo>(`/api/ordenes/${id}`);
    return response.data;
  },

  obtenerPorNumero: async (numeroOrden: string): Promise<OrdenTrabajo> => {
    const response = await api.get<OrdenTrabajo>(`/api/ordenes/numero/${numeroOrden}`);
    return response.data;
  },

  crear: async (data: OrdenTrabajoRequest): Promise<OrdenTrabajo> => {
    const response = await api.post<OrdenTrabajo>('/api/ordenes', data);
    return response.data;
  },

  actualizar: async (id: number, data: OrdenTrabajoRequest): Promise<OrdenTrabajo> => {
    const response = await api.put<OrdenTrabajo>(`/api/ordenes/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: EstadoOrden): Promise<OrdenTrabajo> => {
    const response = await api.put<OrdenTrabajo>(`/api/ordenes/${id}/estado`, {}, {
      params: { estado },
    });
    return response.data;
  },

  agregarRepuesto: async (id: number, data: RepuestoOrdenRequest): Promise<void> => {
    await api.post(`/api/ordenes/${id}/repuestos`, data);
  },

  quitarRepuesto: async (ordenId: number, inventarioId: number): Promise<void> => {
    await api.delete(`/api/ordenes/${ordenId}/repuestos/${inventarioId}`);
  },

  obtenerBitacora: async (id: number): Promise<Bitacora[]> => {
    const response = await api.get<Bitacora[]>(`/api/ordenes/${id}/bitacora`);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/ordenes/${id}`);
  },
};