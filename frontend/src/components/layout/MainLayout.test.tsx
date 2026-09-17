import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { useAuthStore } from '../../store/authStore';

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Pantalla login</div>} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('MainLayout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('sin sesión redirige a /login y no renderiza el Outlet', () => {
    renderLayout();
    expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('autenticado sin user redirige a /login', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      refreshToken: 'r',
      user: null,
    });
    renderLayout();
    expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });
});
