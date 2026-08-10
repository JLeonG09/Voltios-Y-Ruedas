import { api } from './api';
import type { OrdenTrabajo, OrdenTrabajoRequest, RepuestoOrdenRequest, Bitacora, EstadoOrden } from '../types';

export const ordenService = {
  listar: async (page = 0, size = 10): Promise<{ content: OrdenTrabajo[]; totalElements: number }> => {
    const response = await api.get<{ content: OrdenTrabajo[]; totalElements: number }>('/ordenes', {
      page,
      size,
      sort: 'fechaIngreso,desc',
    });
    return response.data;
  },

  misOrdenes: async (): Promise<OrdenTrabajo[]> => {
    const response = await api.get<OrdenTrabajo[]>('/ordenes/mis-ordenes');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<OrdenTrabajo> => {
    const response = await api.get<OrdenTrabajo>(`/ordenes/${id}`);
    return response.data;
  },

  obtenerPorNumero: async (numeroOrden: string): Promise<OrdenTrabajo> => {
    const response = await api.get<OrdenTrabajo>(`/ordenes/numero/${numeroOrden}`);
    return response.data;
  },

  crear: async (data: OrdenTrabajoRequest): Promise<OrdenTrabajo> => {
    const response = await api.post<OrdenTrabajo>('/ordenes', data);
    return response.data;
  },

  actualizar: async (id: number, data: OrdenTrabajoRequest): Promise<OrdenTrabajo> => {
    const response = await api.put<OrdenTrabajo>(`/ordenes/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: EstadoOrden): Promise<OrdenTrabajo> => {
    const response = await api.put<OrdenTrabajo>(`/ordenes/${id}/estado`, null, {
      params: { estado },
    });
    return response.data;
  },

  agregarRepuesto: async (id: number, data: RepuestoOrdenRequest): Promise<void> => {
    await api.post(`/ordenes/${id}/repuestos`, data);
  },

  quitarRepuesto: async (ordenId: number, inventarioId: number): Promise<void> => {
    await api.delete(`/ordenes/${ordenId}/repuestos/${inventarioId}`);
  },

  obtenerBitacora: async (id: number): Promise<Bitacora[]> => {
    const response = await api.get<Bitacora[]>(`/ordenes/${id}/bitacora`);
    return response.data;
  },
};