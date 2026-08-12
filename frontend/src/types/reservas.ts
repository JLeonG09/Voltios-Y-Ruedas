import { UsuarioResponse } from './auth';

export interface Reserva {
  id: number;
  cliente: UsuarioResponse;
  fechaHora: string;
  descripcion?: string;
  categoriaServicio?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReservaWithCliente extends Reserva {
  cliente: UsuarioResponse & { nombreCompleto: string };
}

export interface ReservaRequest {
  fechaHora: string;
  descripcion?: string;
  categoriaServicio?: string;
}

export interface ReservaResponse {
  id: number;
  cliente: UsuarioResponse;
  fechaHora: string;
  descripcion?: string;
  categoriaServicio?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}