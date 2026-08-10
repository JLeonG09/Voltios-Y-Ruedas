import { api } from './api';
import type { Inventario, InventarioRequest, InventarioResponse } from '../types';

export const inventarioService = {
  listar: async (page = 0, size = 10): Promise<{ content: Inventario[]; totalElements: number }> => {
    const response = await api.get<{ content: Inventario[]; totalElements: number }>('/inventario', {
      page,
      size,
      sort: 'nombre,asc',
    });
    return response.data;
  },

  listarActivos: async (): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>('/inventario/activos');
    return response.data;
  },

  listarPorCategoria: async (categoria: string): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>(`/inventario/categoria/${categoria}`);
    return response.data;
  },

  listarStockBajo: async (): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>('/inventario/stock-bajo');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Inventario> => {
    const response = await api.get<Inventario>(`/inventario/${id}`);
    return response.data;
  },

  obtenerPorCodigo: async (codigo: string): Promise<Inventario> => {
    const response = await api.get<Inventario>(`/inventario/codigo/${codigo}`);
    return response.data;
  },

  crear: async (data: InventarioRequest): Promise<Inventario> => {
    const response = await api.post<Inventario>('/inventario', data);
    return response.data;
  },

  actualizar: async (id: number, data: InventarioRequest): Promise<Inventario> => {
    const response = await api.put<Inventario>(`/inventario/${id}`, data);
    return response.data;
  },

  ajustarStock: async (id: number, cantidad: number): Promise<Inventario> => {
    const response = await api.put<Inventario>(`/inventario/${id}/stock`, null, {
      params: { cantidad },
    });
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/inventario/${id}`);
  },
};