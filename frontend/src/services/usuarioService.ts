import { api } from './api';
import type { Usuario } from '../types';

export const usuarioService = {
  listar: async (page = 0, size = 10): Promise<{ content: Usuario[]; totalElements: number }> => {
    const response = await api.get<{ content: Usuario[]; totalElements: number }>('/api/usuarios', {
      params: { page, size, sort: 'nombre,asc' },
    });
    return response.data;
  },

  listarTodos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/api/usuarios/todos');
    return response.data;
  },

  obtenerMecanicos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/api/usuarios/mecanicos');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Usuario> => {
    const response = await api.get<Usuario>(`/api/usuarios/${id}`);
    return response.data;
  },

  crear: async (data: Partial<Usuario> & { password: string; rolId: number }): Promise<Usuario> => {
    const response = await api.post<Usuario>('/api/usuarios', data);
    return response.data;
  },

  actualizar: async (id: number, data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/api/usuarios/${id}`, data);
    return response.data;
  },

  cambiarPassword: async (id: number, passwordActual: string, passwordNuevo: string): Promise<void> => {
    await api.put(`/api/usuarios/${id}/password`, {}, {
      params: { passwordActual, passwordNuevo },
    });
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/usuarios/${id}`);
  },
};