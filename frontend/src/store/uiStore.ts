import { create } from 'zustand';

export type Tema = 'light' | 'dark' | 'system';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  tema: Tema;
  setTema: (tema: Tema) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const readTema = (): Tema => {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem('tema');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // localStorage no disponible
  }
  return 'system';
};

const temaToDark = (tema: Tema): boolean =>
  tema === 'dark' || (tema === 'system' && prefersDark());

const applyDarkClass = (dark: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark);
  }
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  tema: readTema(),
  setTema: (tema: Tema) => {
    try {
      localStorage.setItem('tema', tema);
      localStorage.setItem('darkMode', JSON.stringify(temaToDark(tema)));
    } catch {
      // localStorage no disponible (SSR o navegador restringido)
    }
    applyDarkClass(temaToDark(tema));
    set({ tema, darkMode: temaToDark(tema) });
  },

  darkMode: temaToDark(readTema()),
  setDarkMode: (dark: boolean) => {
    const tema: Tema = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('tema', tema);
      localStorage.setItem('darkMode', JSON.stringify(dark));
    } catch {
      // localStorage no disponible (SSR o navegador restringido)
    }
    applyDarkClass(dark);
    set({ tema, darkMode: dark });
  },
  toggleDarkMode: () => {
    const current = useUIStore.getState().darkMode;
    useUIStore.getState().setDarkMode(!current);
  },

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
