import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido').min(1, 'El email es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(255),
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional(),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  rolId: z.number().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const reservaSchema = z.object({
  fechaHora: z.string().min(1, 'La fecha y hora son obligatorias'),
  categoriaServicio: z.string().max(100, 'Máximo 100 caracteres').optional(),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

export type ReservaFormData = z.infer<typeof reservaSchema>;

export const ordenTrabajoSchema = z.object({
  reservaId: z.number().optional(),
  clienteId: z.number().min(1, 'El cliente es obligatorio'),
  mecanicoId: z.number().optional(),
  numeroOrden: z.string().min(1, 'El número de orden es obligatorio').max(50, 'Máximo 50 caracteres'),
  descripcionProblema: z.string().min(1, 'La descripción del problema es obligatoria').max(2000, 'Máximo 2000 caracteres'),
  diagnostico: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  solucionAplicada: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  estado: z.enum(['RECIEN_INGRESADO', 'POR_INGRESAR', 'TRABAJANDO', 'TERMINADO', 'ENTREGADO']).optional(),
  fechaEstimadaEntrega: z.string().optional(),
  costoManoObra: z.number().min(0).optional(),
  costoRepuestos: z.number().min(0).optional(),
});

export type OrdenTrabajoFormData = z.infer<typeof ordenTrabajoSchema>;

export const repuestoOrdenSchema = z.object({
  inventarioId: z.number().min(1, 'El repuesto es obligatorio'),
  cantidad: z.number().min(1, 'La cantidad debe ser al menos 1'),
  precioUnitario: z.number().min(0, 'El precio no puede ser negativo'),
});

export type RepuestoOrdenFormData = z.infer<typeof repuestoOrdenSchema>;

export const inventarioSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').max(50, 'Máximo 50 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria: z.string().max(100, 'Máximo 100 caracteres').optional(),
  marca: z.string().max(100, 'Máximo 100 caracteres').optional(),
  modelo: z.string().max(100, 'Máximo 100 caracteres').optional(),
  stockActual: z.number().min(0, 'El stock no puede ser negativo').optional(),
  stockMinimo: z.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
  precioCompra: z.number().min(0, 'El precio no puede ser negativo'),
  precioVenta: z.number().min(0, 'El precio no puede ser negativo'),
  ubicacion: z.string().max(100, 'Máximo 100 caracteres').optional(),
  proveedor: z.string().max(150, 'Máximo 150 caracteres').optional(),
  activo: z.boolean().optional(),
});

export type InventarioFormData = z.infer<typeof inventarioSchema>;