import { api } from './api';
import type { Inventario, InventarioRequest } from '../types';

export const inventarioService = {
  listar: async (page = 0, size = 10, search = '', categoria = '', stockFilter = ''): Promise<{ content: Inventario[]; totalElements: number }> => {
    const params: Record<string, string | number> = { page, size, sort: 'nombre,asc' };
    if (search) params.search = search;
    if (categoria) params.categoria = categoria;
    if (stockFilter) params.stockFilter = stockFilter;
    
    const response = await api.get<{ content: Inventario[]; totalElements: number }>('/api/inventario', { params });
    return response.data;
  },

  listarActivos: async (): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>('/api/inventario/activos');
    return response.data;
  },

  listarPorCategoria: async (categoria: string): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>(`/api/inventario/categoria/${categoria}`);
    return response.data;
  },

  listarStockBajo: async (): Promise<Inventario[]> => {
    const response = await api.get<Inventario[]>('/api/inventario/stock-bajo');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Inventario> => {
    const response = await api.get<Inventario>(`/api/inventario/${id}`);
    return response.data;
  },

  obtenerPorCodigo: async (codigo: string): Promise<Inventario> => {
    const response = await api.get<Inventario>(`/api/inventario/codigo/${codigo}`);
    return response.data;
  },

  crear: async (data: InventarioRequest): Promise<Inventario> => {
    const response = await api.post<Inventario>('/api/inventario', data);
    return response.data;
  },

  actualizar: async (id: number, data: InventarioRequest): Promise<Inventario> => {
    const response = await api.put<Inventario>(`/api/inventario/${id}`, data);
    return response.data;
  },

  ajustarStock: async (id: number, cantidad: number): Promise<Inventario> => {
    const response = await api.put<Inventario>(`/api/inventario/${id}/stock`, {}, {
      params: { cantidad },
    });
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/inventario/${id}`);
  },
};