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
      <div className={`overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 ${className}`} {...props}>
        <table className="w-full">
          <thead className="bg-surface-50 dark:bg-surface-800">
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
          <tbody className="bg-white dark:bg-surface-900 divide-y divide-surface-100 dark:divide-surface-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 ${alignClasses[column.align || 'left']}`}>
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse w-3/4" />
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
      <div className={`text-center py-12 ${className}`}>
        {emptyIcon && <div className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600 mb-4">{emptyIcon}</div>}
        <p className="text-surface-500 dark:text-surface-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 ${className}`} {...props}>
      <table className="w-full text-sm">
        <thead className="bg-surface-50 dark:bg-surface-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer select-none ${column.sortable && sortable ? 'hover:bg-surface-100 dark:hover:bg-surface-700' : ''} ${column.className || ''} ${alignClasses[column.align || 'left']}`}
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
        <tbody className="bg-white dark:bg-surface-900 divide-y divide-surface-100 dark:divide-surface-800">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`${hoverable ? 'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800' : ''} ${striped && index % 2 === 1 ? 'bg-surface-50/50 dark:bg-surface-800/40' : ''} ${rowClassName ? rowClassName(item) : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
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