export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getEstadoOrdenLabel = (estado: string): string => {
  const labels: Record<string, string> = {
    RECIEN_INGRESADO: 'Recién ingresado',
    POR_INGRESAR: 'Por ingresar',
    TRABAJANDO: 'Trabajando',
    TERMINADO: 'Terminado',
    ENTREGADO: 'Entregado',
  };
  return labels[estado] || estado;
};

export const getEstadoOrdenColor = (estado: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'gray' => {
  const colors: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'gray'> = {
    RECIEN_INGRESADO: 'info',
    POR_INGRESAR: 'warning',
    TRABAJANDO: 'primary',
    TERMINADO: 'success',
    ENTREGADO: 'gray',
  };
  return colors[estado] || 'gray';
};

export const getEstadoReservaLabel = (estado: string): string => {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada',
  };
  return labels[estado] || estado;
};

export const getEstadoReservaColor = (estado: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'gray' => {
  const colors: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'gray'> = {
    PENDIENTE: 'warning',
    CONFIRMADA: 'info',
    EN_PROCESO: 'primary',
    COMPLETADA: 'success',
    CANCELADA: 'danger',
  };
  return colors[estado] || 'gray';
};

// Aliases for backward compatibility
export const getReservaEstadoLabel = getEstadoReservaLabel;
export const getReservaEstadoColor = getEstadoReservaColor;
export const getEstadoLabel = getEstadoOrdenLabel;
export const getEstadoColor = getEstadoOrdenColor;

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};