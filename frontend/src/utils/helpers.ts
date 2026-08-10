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
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
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

export const getEstadoOrdenColor = (estado: string): string => {
  const colors: Record<string, string> = {
    RECIEN_INGRESADO: 'badge-info',
    POR_INGRESAR: 'badge-warning',
    TRABAJANDO: 'badge-primary',
    TERMINADO: 'badge-success',
    ENTREGADO: 'badge-gray',
  };
  return colors[estado] || 'badge-gray';
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

export const getEstadoReservaColor = (estado: string): string => {
  const colors: Record<string, string> = {
    PENDIENTE: 'badge-warning',
    CONFIRMADA: 'badge-info',
    EN_PROCESO: 'badge-primary',
    COMPLETADA: 'badge-success',
    CANCELADA: 'badge-danger',
  };
  return colors[estado] || 'badge-gray';
};

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