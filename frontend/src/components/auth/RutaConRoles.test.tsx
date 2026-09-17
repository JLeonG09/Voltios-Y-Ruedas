import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RutaConRoles } from './RutaConRoles';
import { useAuthStore } from '../../store/authStore';
import { ROLES, ROLES_CLIENTE, ROLES_GESTION, ROLES_STAFF } from '../../utils/roles';
import type { UsuarioResponse } from '../../types';

const usuarioDeRol = (nombre: string): UsuarioResponse => ({
  id: 1,
  nombre: 'Test',
  apellido: 'User',
  email: 'test@taller.com',
  activo: true,
  fechaCreacion: '',
  fechaActualizacion: '',
  rol: { id: 1, nombre },
});

const autenticar = (rol: string) => {
  useAuthStore.setState({
    user: usuarioDeRol(rol),
    token: 'token-test',
    refreshToken: 'refresh-test',
    isAuthenticated: true,
  });
};

const renderRuta = (path: string, roles: readonly ('ADMIN' | 'JEFE_TALLER' | 'MECANICO' | 'CLIENTE')[]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Landing</div>} />
        <Route path="/dashboard" element={<div>Dashboard ok</div>} />
        <Route
          path={path}
          element={
            <RutaConRoles roles={roles}>
              <div>Contenido protegido</div>
            </RutaConRoles>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('RutaConRoles', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('redirige a / si no hay sesión', () => {
    renderRuta('/usuarios', ROLES_GESTION);
    expect(screen.getByText('Landing')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('MECANICO no abre Usuarios por URL', () => {
    autenticar(ROLES.MECANICO);
    renderRuta('/usuarios', ROLES_GESTION);
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('CLIENTE no abre Configuración por URL', () => {
    autenticar(ROLES.CLIENTE);
    renderRuta('/configuracion', ROLES_GESTION);
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('CLIENTE no abre rutas de staff por URL', () => {
    autenticar(ROLES.CLIENTE);
    renderRuta('/inventario', ROLES_STAFF);
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('ADMIN abre Usuarios', () => {
    autenticar(ROLES.ADMIN);
    renderRuta('/usuarios', ROLES_GESTION);
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('JEFE_TALLER abre Configuración', () => {
    autenticar(ROLES.JEFE_TALLER);
    renderRuta('/configuracion', ROLES_GESTION);
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('staff no abre rutas de cliente por URL', () => {
    autenticar(ROLES.MECANICO);
    renderRuta('/mi-vehiculo', ROLES_CLIENTE);
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });
});
