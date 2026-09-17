import { describe, it, expect } from 'vitest';
import {
  ROLES,
  ROLES_AUTENTICADOS,
  ROLES_CLIENTE,
  ROLES_GESTION,
  ROLES_STAFF,
  catalogarRoles,
  idRolPorNombre,
  rutaInicioPorRol,
  tieneRol,
} from './roles';

const usuario = (nombre: string) => ({ rol: { nombre } });

describe('roles', () => {
  it('usa los nombres exactos del backend', () => {
    expect(ROLES.ADMIN).toBe('ADMIN');
    expect(ROLES.JEFE_TALLER).toBe('JEFE_TALLER');
    expect(ROLES.MECANICO).toBe('MECANICO');
    expect(ROLES.CLIENTE).toBe('CLIENTE');
  });

  it('MECANICO es staff pero no gestión', () => {
    expect(tieneRol(usuario(ROLES.MECANICO), ROLES_STAFF)).toBe(true);
    expect(tieneRol(usuario(ROLES.MECANICO), ROLES_GESTION)).toBe(false);
    expect(tieneRol(usuario(ROLES.MECANICO), ROLES_CLIENTE)).toBe(false);
  });

  it('CLIENTE no entra a staff ni a usuarios/configuración', () => {
    expect(tieneRol(usuario(ROLES.CLIENTE), ROLES_STAFF)).toBe(false);
    expect(tieneRol(usuario(ROLES.CLIENTE), ROLES_GESTION)).toBe(false);
    expect(tieneRol(usuario(ROLES.CLIENTE), ROLES_CLIENTE)).toBe(true);
  });

  it('ADMIN y JEFE_TALLER pueden gestión', () => {
    expect(tieneRol(usuario(ROLES.ADMIN), ROLES_GESTION)).toBe(true);
    expect(tieneRol(usuario(ROLES.JEFE_TALLER), ROLES_GESTION)).toBe(true);
    expect(tieneRol(usuario(ROLES.ADMIN), ROLES_AUTENTICADOS)).toBe(true);
  });

  it('falla cerrado si no hay usuario o rol desconocido', () => {
    expect(tieneRol(null, ROLES_STAFF)).toBe(false);
    expect(tieneRol(usuario('SUPERUSER'), ROLES_AUTENTICADOS)).toBe(false);
  });

  it('ruta de inicio según rol', () => {
    expect(rutaInicioPorRol(ROLES.CLIENTE)).toBe('/mi-vehiculo');
    expect(rutaInicioPorRol(ROLES.MECANICO)).toBe('/dashboard');
    expect(rutaInicioPorRol(undefined)).toBe('/dashboard');
  });

  it('cataloga roles con ids del API, no asume 1/2/3/4', () => {
    const catalogo = catalogarRoles([
      { rol: { id: 99, nombre: ROLES.CLIENTE } },
      { rol: { id: 42, nombre: ROLES.MECANICO } },
      { rol: { id: 7, nombre: ROLES.ADMIN } },
      { rol: { id: 42, nombre: ROLES.MECANICO } },
    ]);
    expect(catalogo).toEqual([
      { id: 7, nombre: ROLES.ADMIN },
      { id: 42, nombre: ROLES.MECANICO },
      { id: 99, nombre: ROLES.CLIENTE },
    ]);
    expect(idRolPorNombre(catalogo, ROLES.CLIENTE)).toBe(99);
    expect(idRolPorNombre(catalogo, ROLES.JEFE_TALLER)).toBeUndefined();
  });
});
