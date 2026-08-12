import { useUIStore } from '../store/uiStore';

export function useDarkMode() {
  const dark = useUIStore((state) => state.darkMode);
  const toggle = useUIStore((state) => state.toggleDarkMode);

  return { dark, toggle };
}
