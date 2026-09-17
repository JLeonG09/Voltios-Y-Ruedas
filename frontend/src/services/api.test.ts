import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { esRutaAuthPublica, resolverMensajeErrorApi } from './api';

const axiosError = (opts: {
  status?: number;
  url?: string;
  mensaje?: string;
  sinResponse?: boolean;
}): AxiosError => {
  const error = new AxiosError('Request failed');
  error.config = {
    url: opts.url ?? '/api/auth/login',
    headers: new AxiosHeaders(),
  };
  if (!opts.sinResponse) {
    error.response = {
      status: opts.status ?? 401,
      statusText: 'Unauthorized',
      headers: {},
      config: error.config,
      data: opts.mensaje ? { mensaje: opts.mensaje } : {},
    };
  }
  return error;
};

describe('esRutaAuthPublica', () => {
  it('reconoce login, register y recuperación', () => {
    expect(esRutaAuthPublica('/api/auth/login')).toBe(true);
    expect(esRutaAuthPublica('/api/auth/register')).toBe(true);
    expect(esRutaAuthPublica('/api/auth/recuperar-password')).toBe(true);
    expect(esRutaAuthPublica('/api/auth/reestablecer-password')).toBe(true);
    expect(esRutaAuthPublica('/api/auth/verificar-email')).toBe(true);
  });

  it('no marca rutas protegidas ni me', () => {
    expect(esRutaAuthPublica('/api/auth/me')).toBe(false);
    expect(esRutaAuthPublica('/api/inventario')).toBe(false);
    expect(esRutaAuthPublica('/api/auth/refresh')).toBe(false);
  });
});

describe('resolverMensajeErrorApi', () => {
  it('prioriza mensaje del backend en 401 de login', () => {
    const error = axiosError({
      status: 401,
      mensaje: 'El email o la contraseña son incorrectos',
    });
    expect(resolverMensajeErrorApi(error)).toBe('El email o la contraseña son incorrectos');
  });

  it('usa mensaje de red sin response', () => {
    const error = axiosError({ sinResponse: true });
    expect(resolverMensajeErrorApi(error)).toMatch(/No se pudo conectar con el servidor/);
  });

  it('explica 404/405 en auth (p. ej. Vercel sin VITE_API_URL)', () => {
    const error = axiosError({ status: 404, url: '/api/auth/login' });
    expect(resolverMensajeErrorApi(error)).toMatch(/VITE_API_URL/);
  });

  it('propaga 429 / bloqueo del backend', () => {
    const error = axiosError({
      status: 429,
      mensaje: 'Demasiados intentos fallidos de inicio de sesión. La cuenta está bloqueada por 15 minutos.',
    });
    expect(resolverMensajeErrorApi(error)).toMatch(/bloqueada/);
  });

  it('propaga 403 de verificación de correo', () => {
    const error = axiosError({
      status: 403,
      mensaje: 'Debes verificar tu correo antes de iniciar sesión',
    });
    expect(resolverMensajeErrorApi(error)).toMatch(/verificar tu correo/);
  });
});
