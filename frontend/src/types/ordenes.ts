import { UsuarioResponse } from './auth';
import { ReservaResponse } from './reservas';
import { InventarioResponse } from './inventario';

export type EstadoOrden = 
  | 'RECIEN_INGRESADO'
  | 'POR_INGRESAR'
  | 'TRABAJANDO'
  | 'TERMINADO'
  | 'ENTREGADO';

export interface OrdenTrabajo {
  id: number;
  reserva?: ReservaResponse;
  cliente: UsuarioResponse;
  mecanico?: UsuarioResponse;
  numeroOrden: string;
  descripcionProblema: string;
  diagnostico?: string;
  solucionAplicada?: string;
  estado: EstadoOrden;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string;
  fechaEntregaReal?: string;
  costoManoObra: number;
  costoRepuestos: number;
  costoTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  repuestosUtilizados?: OrdenTrabajoInventario[];
}

export interface OrdenTrabajoRequest {
  reservaId?: number;
  clienteId: number;
  mecanicoId?: number;
  numeroOrden: string;
  descripcionProblema: string;
  diagnostico?: string;
  solucionAplicada?: string;
  estado?: EstadoOrden;
  fechaEstimadaEntrega?: string;
  costoManoObra?: number;
  costoRepuestos?: number;
}

export interface OrdenTrabajoInventario {
  id: number;
  inventario: InventarioResponse;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaCreacion: string;
}

export interface RepuestoOrdenRequest {
  inventarioId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface Bitacora {
  id: number;
  ordenTrabajoId: number;
  usuario: UsuarioResponse;
  accion: string;
  descripcion?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  fecha: string;
}