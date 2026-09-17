import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

let debeFallar = true;

const Bomba = () => {
  if (debeFallar) {
    throw new Error('fallo de prueba');
  }
  return <div>contenido ok</div>;
};

describe('ErrorBoundary', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => {
    debeFallar = true;
  });

  afterAll(() => {
    spy.mockRestore();
  });

  it('muestra fallback y remonta al reintentar', () => {
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    debeFallar = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByText('contenido ok')).toBeInTheDocument();
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });

  it('expone recargar página como alternativa', () => {
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument();
  });
});
