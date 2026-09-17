import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Package, Edit, Trash2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select, Switch } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { inventarioService } from '../services/inventarioService';
import { inventarioSchema, type InventarioFormData } from '../utils/validation';
import { formatCurrency } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import type { Inventario } from '../types/inventario';

type InventarioWithStock = Inventario & {
  stockBajo?: boolean;
};

export const InventarioPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [items, setItems] = useState<InventarioWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarioWithStock | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventarioFormData>({
    resolver: zodResolver(inventarioSchema),
  });

  const activoValue = watch('activo');

  const fetchInventario = async (termino = search) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await inventarioService.listar(page - 1, 10, termino, categoriaFilter, stockFilter);
      setItems(response.content);
      setTotalPages(Math.ceil(response.totalElements / 10));
      setTotalItems(response.totalElements);

      const cats = [...new Set(response.content.map((i) => i.categoria).filter(Boolean))] as string[];
      setCategorias(cats);
    } catch {
      setItems([]);
      setLoadError('No se pudo cargar el inventario');
      addNotification({ type: 'error', title: 'Error', message: 'No se pudo cargar el inventario' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario(debouncedSearch);
  }, [page, debouncedSearch, categoriaFilter, stockFilter]);

  const handleEdit = (item: InventarioWithStock) => {
    setEditingItem(item);
    reset({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      categoria: item.categoria || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      precioCompra: item.precioCompra,
      precioVenta: item.precioVenta,
      ubicacion: item.ubicacion || '',
      proveedor: item.proveedor || '',
      activo: item.activo,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    reset({
      codigo: '',
      nombre: '',
      stockActual: 0,
      stockMinimo: 5,
      precioCompra: 0,
      precioVenta: 0,
      activo: true,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: InventarioFormData) => {
    setSaving(true);
    try {
      if (editingItem) {
        await inventarioService.actualizar(editingItem.id, data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Repuesto actualizado' });
      } else {
        await inventarioService.crear(data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Repuesto creado' });
      }
      setShowModal(false);
      fetchInventario();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await inventarioService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Repuesto desactivado' });
      setShowDeleteConfirm(null);
      fetchInventario();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<InventarioWithStock>[] = [
    {
      key: 'codigo',
      header: 'Código',
      sortable: true,
      render: (i) => (
        <span className="font-medium tabular-nums text-surface-800 dark:text-surface-100">{i.codigo}</span>
      ),
    },
    { key: 'nombre', header: 'Nombre', sortable: true },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (i) => (
        <span className="text-surface-600 dark:text-surface-300">{i.categoria || '—'}</span>
      ),
      sortable: true,
    },
    {
      key: 'marca',
      header: 'Marca',
      render: (i) => (
        <span className="text-surface-600 dark:text-surface-300">{i.marca || '—'}</span>
      ),
      sortable: true,
    },
    {
      key: 'stockActual',
      header: 'Stock',
      sortable: true,
      align: 'center',
      render: (i) => (
        <div className="flex items-center justify-center">
          <Badge variant={i.stockActual <= i.stockMinimo ? 'danger' : 'success'} dot>
            {i.stockActual} / {i.stockMinimo}
          </Badge>
        </div>
      ),
    },
    {
      key: 'precioVenta',
      header: 'Precio venta',
      sortable: true,
      align: 'right',
      render: (i) => (
        <span className="tabular-nums text-surface-800 dark:text-surface-100">{formatCurrency(i.precioVenta)}</span>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (i) => (
        <Badge variant={i.activo ? 'success' : 'gray'} dot>
          {i.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (i) =>
        isAdminOrJefe ? (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(i);
              }}
              aria-label="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(i.id);
              }}
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];

  const mostrarVacio = !loading && !loadError && items.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Taller
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Gestiona repuestos y stock del taller
          </p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew} className="shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo repuesto
          </Button>
        )}
      </header>

      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-surface-100 px-4 py-4 dark:border-surface-800 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <Input
                label="Buscar"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Código, nombre, marca…"
                leftIcon={<Search className="h-5 w-5" />}
                disabled={loading && items.length === 0 && !loadError}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <Select
                label="Categoría"
                value={categoriaFilter}
                onChange={(e) => {
                  setCategoriaFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todas' },
                  ...categorias.map((c) => ({ value: c, label: c })),
                ]}
              />
              <Select
                label="Stock"
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'bajo', label: 'Stock bajo' },
                  { value: 'agotado', label: 'Agotado' },
                ]}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {loadError && !loading && (
            <div
              className="m-4 flex flex-col items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-danger-800 dark:bg-danger-950/40"
              role="alert"
            >
              <div className="flex items-start gap-3 text-sm text-danger-800 dark:text-danger-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{loadError}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchInventario(debouncedSearch)}
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          )}

          {mostrarVacio ? (
            <div className="empty-state px-4">
              <Package className="empty-state-icon" aria-hidden="true" />
              <h2 className="empty-state-title">No hay repuestos</h2>
              <p className="empty-state-text">
                {search || categoriaFilter || stockFilter
                  ? 'Prueba con otros filtros o limpia la búsqueda.'
                  : 'Todavía no hay ítems en el catálogo.'}
              </p>
              {isAdminOrJefe && !search && !categoriaFilter && !stockFilter && (
                <Button type="button" onClick={handleNew}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nuevo repuesto
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={items}
                keyExtractor={(i) => i.id.toString()}
                loading={loading}
                hoverable
                striped
                rowClassName={(i) =>
                  i.stockActual === 0
                    ? 'bg-danger-50/40 dark:bg-danger-950/20'
                    : i.stockActual <= i.stockMinimo
                      ? 'bg-accent-50/40 dark:bg-accent-950/20'
                      : ''
                }
                emptyMessage="No hay repuestos registrados"
                emptyIcon={<Package className="h-12 w-12 text-surface-300 dark:text-surface-600" />}
              />

              {!loadError && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(totalPages, 1)}
                  onPageChange={setPage}
                  showPerPage
                  perPage={10}
                  totalItems={totalItems}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!saving) setShowModal(false);
        }}
        title={editingItem ? 'Editar repuesto' : 'Nuevo repuesto'}
        description="Completa los datos del ítem de inventario."
        size="lg"
        closeOnOverlayClick={!saving}
        closeOnEscape={!saving}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('codigo')}
              label="Código *"
              placeholder="REP-001"
              error={errors.codigo?.message}
              disabled={saving}
            />
            <Input
              {...register('nombre')}
              label="Nombre *"
              placeholder="Filtro de aceite"
              error={errors.nombre?.message}
              disabled={saving}
            />
          </div>

          <Input
            {...register('descripcion')}
            label="Descripción"
            placeholder="Descripción del repuesto"
            disabled={saving}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input {...register('categoria')} label="Categoría" placeholder="Filtros" disabled={saving} />
            <Input {...register('marca')} label="Marca" placeholder="Bosch" disabled={saving} />
            <Input {...register('modelo')} label="Modelo" placeholder="OF-123" disabled={saving} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              {...register('stockActual', { valueAsNumber: true })}
              type="number"
              label="Stock actual *"
              placeholder="50"
              error={errors.stockActual?.message}
              disabled={saving}
            />
            <Input
              {...register('stockMinimo', { valueAsNumber: true })}
              type="number"
              label="Stock mínimo *"
              placeholder="5"
              error={errors.stockMinimo?.message}
              disabled={saving}
            />
            <Input
              {...register('precioCompra', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Precio compra *"
              placeholder="15.00"
              error={errors.precioCompra?.message}
              disabled={saving}
            />
            <Input
              {...register('precioVenta', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Precio venta *"
              placeholder="25.00"
              error={errors.precioVenta?.message}
              disabled={saving}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input {...register('ubicacion')} label="Ubicación" placeholder="A-1" disabled={saving} />
            <Input
              {...register('proveedor')}
              label="Proveedor"
              placeholder="Distribuidora AutoPartes"
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-900/60">
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Activo</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Visible en el catálogo operativo</p>
            </div>
            <Switch
              checked={Boolean(activoValue)}
              disabled={saving}
              onChange={(checked) => setValue('activo', checked, { shouldDirty: true })}
              aria-label="Repuesto activo"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => {
          if (!deleting) setShowDeleteConfirm(null);
        }}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Desactivar repuesto?"
        message="Esta acción marcará el repuesto como inactivo. ¿Deseas continuar?"
        variant="warning"
        confirmText="Desactivar"
        loading={deleting}
      />
    </div>
  );
};
