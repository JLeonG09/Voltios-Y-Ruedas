import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  recuperarPasswordSchema,
  reestablecerPasswordSchema,
} from './validation';

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    const result = loginSchema.safeParse({ email: 'juan@example.com', password: 'secreto1' });
    expect(result.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-email', password: 'secreto1' });
    expect(result.success).toBe(false);
  });

  it('rechaza email débil como 2@m.com', () => {
    const result = loginSchema.safeParse({ email: '2@m.com', password: 'secreto1' });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'juan@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('acepta contraseña no vacía sin exigir longitud mínima (el login no aplica la regla de 8)', () => {
    const result = loginSchema.safeParse({ email: 'juan@example.com', password: '123' });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('acepta un registro válido', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre de 1 carácter', () => {
    const result = registerSchema.safeParse({
      nombre: 'J',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre de más de 50 caracteres', () => {
    const result = registerSchema.safeParse({
      nombre: 'J'.repeat(51),
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('acepta teléfono de Costa Rica con prefijo', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
      telefono: '+506 8888 8888',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza teléfono que no es de Costa Rica', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
      telefono: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const result = registerSchema.safeParse({
      nombre: '',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre con números', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan123',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza apellido con números', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez2',
      email: 'juan@example.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza email débil como 2@m.com', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: '2@m.com',
      password: 'secreto1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseña de menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });
});

describe('recuperarPasswordSchema', () => {
  it('acepta un email válido', () => {
    expect(recuperarPasswordSchema.safeParse({ email: 'juan@example.com' }).success).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(recuperarPasswordSchema.safeParse({ email: 'mal' }).success).toBe(false);
  });
});

describe('reestablecerPasswordSchema', () => {
  const base = {
    token: 'abc123',
    nuevaPassword: 'nuevaPass',
    confirmarPassword: 'nuevaPass',
  };

  it('acepta token y contraseña de al menos 8 caracteres coincidentes', () => {
    expect(reestablecerPasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza contraseña de menos de 8 caracteres', () => {
    const result = reestablecerPasswordSchema.safeParse({
      ...base,
      nuevaPassword: '1234567',
      confirmarPassword: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseñas que no coinciden', () => {
    const result = reestablecerPasswordSchema.safeParse({
      ...base,
      confirmarPassword: 'otraPass1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza token vacío', () => {
    const result = reestablecerPasswordSchema.safeParse({ ...base, token: '' });
    expect(result.success).toBe(false);
  });
});
