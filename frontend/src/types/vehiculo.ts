export type EstadoVehiculo =
  | 'DISPONIBLE'
  | 'EN_TALLER'
  | 'EN_REPARACION'
  | 'LISTO'
  | 'ENTREGADO';

export interface Vehiculo {
  id: number;
  clienteId: number;
  clienteNombre?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  kilometraje: number;
  estado: EstadoVehiculo;
  estadoLabel: string;
  notas?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface VehiculoRequest {
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  kilometraje?: number;
  notas?: string;
  estado?: EstadoVehiculo;
  /** Solo lo envia el staff al crear/reasignar vehiculo de un cliente. */
  clienteId?: number;
}