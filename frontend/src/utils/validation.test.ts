import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, recuperarPasswordSchema } from './validation';

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

  it('rechaza contraseña corta', () => {
    const result = loginSchema.safeParse({ email: 'juan@example.com', password: '123' });
    expect(result.success).toBe(false);
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
});

describe('recuperarPasswordSchema', () => {
  it('acepta un email válido', () => {
    expect(recuperarPasswordSchema.safeParse({ email: 'juan@example.com' }).success).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(recuperarPasswordSchema.safeParse({ email: 'mal' }).success).toBe(false);
  });
});
