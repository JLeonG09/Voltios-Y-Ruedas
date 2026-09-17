/** Nombres de rol exactos del backend (`Rol.nombre` / JWT). */
export type NombreRol = 'ADMIN' | 'JEFE_TALLER' | 'MECANICO' | 'CLIENTE';

export interface Rol {
  id: number;
  nombre: NombreRol | string;
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
  emailVerificado?: boolean;
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
}

export interface JwtResponse {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RecuperarPasswordRequest {
  email: string;
}

export interface ReestablecerPasswordRequest {
  token: string;
  nuevaPassword: string;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  nuevaPassword: string;
}

export interface ActualizarPerfilRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  direccion?: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  emailVerificado?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  rol: Rol;
  nombreCompleto?: string;
}

export interface VerificarEmailRequest {
  email: string;
  codigo: string;
}