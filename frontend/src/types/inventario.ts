export interface Inventario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  stockActual: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  ubicacion?: string;
  proveedor?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  stockBajo?: boolean;
}

export interface InventarioRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  stockActual?: number;
  stockMinimo?: number;
  precioCompra: number;
  precioVenta: number;
  ubicacion?: string;
  proveedor?: string;
  activo?: boolean;
}

export interface InventarioResponse {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  stockActual: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  ubicacion?: string;
  proveedor?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  stockBajo?: boolean;
}