import { z } from 'zod';

// Solo letras (incluye acentos y ñ), espacios, apóstrofes, guiones y puntos.
const regexSoloLetras = /^[\p{L}\p{M}'. -]+$/u;

// Email estricto: parte local de 2+ caracteres, dominio con al menos 2 caracteres
// antes del punto y un TLD de 2+ letras (rechaza casos tipo "2@m.com").
const regexEmail = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9-]{2,}(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

// Teléfono de Costa Rica: 8 dígitos, acepta prefijo +506 (opcional), espacios o guiones.
const regexTelefono = /^(?:\+506[\s-]?)?\d{4}[\s-]?\d{4}$/;

// Campo de teléfono opcional: vacío/undefined válido, si hay valor debe ser un teléfono CR.
export const telefonoOpcional = z
  .string()
  .max(20, 'El teléfono no puede exceder 20 caracteres')
  .optional()
  .transform((v) => v?.trim() || undefined)
  .refine((v) => v === undefined || regexTelefono.test(v), {
    message: 'Teléfono inválido. Ej: +506 8888 8888',
  });

// Nombre y apellido: entre 2 y 50 caracteres, solo letras (incluye acentos, ñ, apóstrofes, guiones y puntos).
const nombreObligatorio = z
  .string()
  .min(2, 'Debe tener al menos 2 caracteres')
  .max(50, 'Máximo 50 caracteres')
  .regex(regexSoloLetras, 'Solo puede contener letras');

export const loginSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio').regex(regexEmail, 'Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const recuperarPasswordSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio').regex(regexEmail, 'Email inválido'),
});

export type RecuperarPasswordFormData = z.infer<typeof recuperarPasswordSchema>;

export const reestablecerPasswordSchema = z
  .object({
    token: z.string().min(1, 'El token es obligatorio'),
    nuevaPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(255, 'Máximo 255 caracteres'),
    confirmarPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.nuevaPassword === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export type ReestablecerPasswordFormData = z.infer<typeof reestablecerPasswordSchema>;

export const registerSchema = z.object({
  nombre: nombreObligatorio,
  apellido: nombreObligatorio,
  email: z.string().min(1, 'El email es obligatorio').regex(regexEmail, 'Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(255),
  telefono: telefonoOpcional,
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional().transform((v) => v?.trim() || undefined),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Para gestión de usuarios por parte de ADMIN (incluye rol; el registro público no).
// La contraseña es obligatoria solo al CREAR; al editar el campo no se renderiza,
// por lo que se valida manualmente en la página (si no se exige, el formulario de
// edición falla en silencio y nunca envía la actualización).
export const usuarioSchema = registerSchema.extend({
  rolId: z.coerce.number().optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'Máximo 255 caracteres')
    .optional(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

// Perfil de usuario (Configuración): nombre/apellido obligatorios, teléfono opcional.
export const perfilSchema = z.object({
  nombre: nombreObligatorio,
  apellido: nombreObligatorio,
  telefono: telefonoOpcional,
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional().transform((v) => v?.trim() || undefined),
});

export type PerfilFormData = z.infer<typeof perfilSchema>;

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