import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza el texto del botón', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('ejecuta onClick al hacer clic', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Aceptar</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('se deshabilita mientras está en estado de carga', () => {
    render(<Button loading>Enviar</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('no ejecuta onClick cuando está deshabilitado', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Cancelar</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica la variante danger', () => {
    render(<Button variant="danger">Eliminar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger-600');
  });
});
