import type { NombreRol } from '../types';

export const ROLES = {
  ADMIN: 'ADMIN',
  JEFE_TALLER: 'JEFE_TALLER',
  MECANICO: 'MECANICO',
  CLIENTE: 'CLIENTE',
} as const satisfies Record<NombreRol, NombreRol>;

export const ROLES_STAFF: readonly NombreRol[] = [
  ROLES.ADMIN,
  ROLES.JEFE_TALLER,
  ROLES.MECANICO,
];

export const ROLES_GESTION: readonly NombreRol[] = [ROLES.ADMIN, ROLES.JEFE_TALLER];

export const ROLES_CLIENTE: readonly NombreRol[] = [ROLES.CLIENTE];

export const ROLES_AUTENTICADOS: readonly NombreRol[] = [
  ROLES.ADMIN,
  ROLES.JEFE_TALLER,
  ROLES.MECANICO,
  ROLES.CLIENTE,
];

export function tieneRol(
  user: { rol?: { nombre?: string } } | null | undefined,
  permitidos: readonly NombreRol[]
): boolean {
  const nombre = user?.rol?.nombre;
  return !!nombre && (permitidos as readonly string[]).includes(nombre);
}

export function rolPermitido(nombre: string | undefined, permitidos: readonly NombreRol[]): boolean {
  return !!nombre && (permitidos as readonly string[]).includes(nombre);
}

export function rutaInicioPorRol(nombre: string | undefined): string {
  return nombre === ROLES.CLIENTE ? '/mi-vehiculo' : '/dashboard';
}

export type RolCatalogo = { id: number; nombre: string };

/** Arma el catálogo de roles con ids reales del API; no asume 1/2/3/4. */
export function catalogarRoles(
  usuarios: Array<{ rol?: { id?: number; nombre?: string } | null }>
): RolCatalogo[] {
  const porNombre = new Map<string, number>();
  for (const usuario of usuarios) {
    const id = usuario.rol?.id;
    const nombre = usuario.rol?.nombre;
    if (id != null && nombre) {
      porNombre.set(nombre, id);
    }
  }
  const ordenados: RolCatalogo[] = [];
  for (const nombre of ROLES_AUTENTICADOS) {
    const id = porNombre.get(nombre);
    if (id != null) {
      ordenados.push({ id, nombre });
      porNombre.delete(nombre);
    }
  }
  for (const [nombre, id] of porNombre) {
    ordenados.push({ id, nombre });
  }
  return ordenados;
}

export function idRolPorNombre(catalogo: readonly RolCatalogo[], nombre: string): number | undefined {
  return catalogo.find((rol) => rol.nombre === nombre)?.id;
}
