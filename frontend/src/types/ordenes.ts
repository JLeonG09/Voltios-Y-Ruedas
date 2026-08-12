import { UsuarioResponse } from './auth';
import { ReservaResponse } from './reservas';
import { InventarioResponse } from './inventario';
import { z } from 'zod';

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
  estadoLabel?: string;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string;
  fechaEntregaReal?: string;
  costoManoObra: number;
  costoRepuestos: number;
  costoTotal: number;
  montoPagado?: number;
  saldoPendiente?: number;
  estadoFacturacion?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  repuestosUtilizados?: OrdenTrabajoInventario[];
  bitacora?: Bitacora[];
}

export interface OrdenWithRelations extends OrdenTrabajo {
  cliente: UsuarioResponse & { nombreCompleto: string };
  mecanico?: UsuarioResponse & { nombreCompleto: string };
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

export interface OrdenFormData {
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

export const ordenSchema = z.object({
  reservaId: z.number().optional(),
  clienteId: z.number().min(1, 'Cliente es requerido'),
  mecanicoId: z.number().optional(),
  numeroOrden: z.string().min(1, 'Número de orden es requerido'),
  descripcionProblema: z.string().min(1, 'Descripción es requerida'),
  diagnostico: z.string().optional(),
  solucionAplicada: z.string().optional(),
  estado: z.enum(['RECIEN_INGRESADO', 'POR_INGRESAR', 'TRABAJANDO', 'TERMINADO', 'ENTREGADO']).optional(),
  fechaEstimadaEntrega: z.string().optional(),
  costoManoObra: z.number().optional(),
  costoRepuestos: z.number().optional(),
});