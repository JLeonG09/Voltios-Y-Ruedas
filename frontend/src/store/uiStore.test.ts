import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('setTema guarda la preferencia y aplica la clase dark', () => {
    useUIStore.getState().setTema('dark');
    expect(useUIStore.getState().tema).toBe('dark');
    expect(useUIStore.getState().darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('tema')).toBe('dark');
  });

  it('setTema light quita la clase dark', () => {
    useUIStore.getState().setTema('dark');
    useUIStore.getState().setTema('light');
    expect(useUIStore.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleDarkMode alterna entre claro y oscuro', () => {
    useUIStore.getState().setTema('light');
    useUIStore.getState().toggleDarkMode();
    expect(useUIStore.getState().darkMode).toBe(true);
    useUIStore.getState().toggleDarkMode();
    expect(useUIStore.getState().darkMode).toBe(false);
  });

  it('toggleSidebar persiste preferencia en escritorio', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    useUIStore.setState({ sidebarOpen: true });
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    expect(localStorage.getItem('sidebarOpen')).toBe('false');
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    expect(localStorage.getItem('sidebarOpen')).toBe('true');
  });

  it('addNotification y removeNotification gestionan el arreglo', () => {
    useUIStore.getState().addNotification({ type: 'info', title: 'Aviso' });
    expect(useUIStore.getState().notifications).toHaveLength(1);
    const id = useUIStore.getState().notifications[0].id;
    useUIStore.getState().removeNotification(id);
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });
});
