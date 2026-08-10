export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  rol: Rol;
  nombreCompleto?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
  rolId?: number;
}

export interface JwtResponse {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  rol: Rol;
}