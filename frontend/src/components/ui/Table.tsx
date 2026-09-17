import { HTMLAttributes, forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowClassName?: (item: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPerPage?: boolean;
  perPageOptions?: number[];
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  totalItems?: number;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortable = false,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  rowClassName,
  striped = true,
  hoverable = true,
  className = '',
  ...props
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort && columns.find((c) => c.key === key)?.sortable) {
      onSort(key);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className={`overflow-x-auto rounded-xl glass-panel-soft ${className}`} {...props}>
        <table className="w-full">
          <thead className="bg-white/25 dark:bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider ${column.className || ''} ${alignClasses[column.align || 'left']}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30 dark:divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 ${alignClasses[column.align || 'left']}`}>
                    <div className="h-4 bg-surface-200/70 dark:bg-surface-700/70 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`empty-state ${className}`}>
        {emptyIcon && <div className="empty-state-icon">{emptyIcon}</div>}
        <p className="empty-state-text mb-0">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl glass-panel-soft ${className}`} {...props}>
      {/* Vista móvil: cada fila se renderiza como una tarjeta apilable */}
      <div className="md:hidden divide-y divide-white/30 dark:divide-white/10">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`px-4 py-3 ${hoverable ? 'transition-colors hover:bg-white/35 dark:hover:bg-white/5' : ''} ${striped && index % 2 === 1 ? 'bg-white/20 dark:bg-white/[0.03]' : ''} ${rowClassName ? rowClassName(item) : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
          >
            {columns
              .filter((column) => column.key !== 'actions')
              .map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4 py-1.5">
                  <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider flex-shrink-0 pt-0.5">
                    {column.header}
                  </span>
                  <span className="text-sm text-surface-700 dark:text-surface-200 text-right break-words">
                    {column.render ? column.render(item, index) : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                  </span>
                </div>
              ))}
            {columns
              .filter((column) => column.key === 'actions')
              .map((column) => (
                <div key={column.key} className="flex items-center justify-end gap-2 pt-2 mt-1.5 border-t border-dashed border-surface-100 dark:border-surface-800">
                  {column.render?.(item, index)}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Tabla en pantallas ≥ md */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/25 dark:bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer select-none ${column.sortable && sortable ? 'hover:bg-white/30 dark:hover:bg-white/10' : ''} ${column.className || ''} ${alignClasses[column.align || 'left']}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-1 justify-start">
                    {column.header}
                    {column.sortable && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30 dark:divide-white/10">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={`${hoverable ? 'transition-colors hover:bg-white/35 dark:hover:bg-white/5' : ''} ${striped && index % 2 === 1 ? 'bg-white/20 dark:bg-white/[0.03]' : ''} ${rowClassName ? rowClassName(item) : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3.5 text-surface-700 dark:text-surface-200 ${alignClasses[column.align || 'left']} ${column.className || ''}`}>
                    {column.render ? column.render(item, index) : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPerPage = false,
  perPageOptions = [10, 25, 50, 100],
  perPage,
  onPerPageChange,
  totalItems,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1)
  );

  return (
    <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-surface-600 dark:text-surface-300">
          Mostrando <span className="font-medium text-surface-900 dark:text-white">{(currentPage - 1) * (perPage || 10) + 1}</span> a{' '}
          <span className="font-medium text-surface-900 dark:text-white">{Math.min(currentPage * (perPage || 10), totalItems || totalPages * (perPage || 10))}</span>{' '}
          de <span className="font-medium text-surface-900 dark:text-white">{totalItems || totalPages * (perPage || 10)}</span> resultados
        </p>
        {showPerPage && perPage && onPerPageChange && (
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronDown className="h-5 w-5 rotate-180" />
        </button>

        {visiblePages.map((page, index) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-brand-600 text-white shadow-card'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};