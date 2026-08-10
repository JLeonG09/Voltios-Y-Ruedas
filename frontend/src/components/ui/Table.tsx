import { HTMLAttributes, forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
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
  rowClassName?: (item: T) => string;
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
  rowClassName,
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

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className={`w-full ${className}`} {...props}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
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
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`} {...props}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${column.sortable && sortable ? 'hover:bg-gray-100' : ''} ${column.className || ''}`}
                style={{ width: column.width }}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${rowClassName ? rowClassName(item) : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}>
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPerPage?: boolean;
  perPageOptions?: number[];
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPerPage = false,
  perPageOptions = [10, 25, 50, 100],
  perPage,
  onPerPageChange,
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
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700">
          Página {currentPage} de {totalPages}
        </p>
        {showPerPage && perPage && onPerPageChange && (
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronDown className="h-5 w-5 rotate-180" />
        </button>
        
        {visiblePages.map((page, index) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};