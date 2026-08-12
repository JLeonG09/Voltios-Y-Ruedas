import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Package, AlertTriangle, ChevronDown, DollarSign, Edit, Trash2, ArrowUpDown, Download, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { inventarioService } from '../services/inventarioService';
import { inventarioSchema, type InventarioFormData } from '../utils/validation';
import { formatCurrency, getEstadoColor } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import { useEffect } from 'react';
import type { Inventario } from '../types/inventario';

type InventarioWithStock = Inventario & {
  stockBajo?: boolean;
};

export const InventarioPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [items, setItems] = useState<InventarioWithStock[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [categorias, setCategorias] = useState<string[]>([]);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');

  const columns: Column<InventarioWithStock>[] = [
    { key: 'codigo', header: 'Código', sortable: true },
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'categoria', header: 'Categoría', render: (i) => i.categoria || '-', sortable: true },
    { key: 'marca', header: 'Marca', render: (i) => i.marca || '-', sortable: true },
    { key: 'stockActual', header: 'Stock', sortable: true, align: 'center', render: (i) => (
      <div className="flex items-center gap-2 justify-center">
        <Badge variant={i.stockActual <= i.stockMinimo ? 'danger' : 'success'} dot>
          {i.stockActual} / {i.stockMinimo}
        </Badge>
      </div>
    )},
    { key: 'precioVenta', header: 'Precio venta', sortable: true, align: 'right', render: (i) => formatCurrency(i.precioVenta) },
    { key: 'activo', header: 'Estado', render: (i) => (
      <Badge variant={i.activo ? 'success' : 'gray'} dot>
        {i.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
    { key: 'actions', header: 'Acciones', align: 'center', render: (i, idx) => (
      <div className="flex items-center gap-2 justify-center">
        {isAdminOrJefe && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(i); }} aria-label="Editar">
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(i.id); }} aria-label="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    )},
  ];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InventarioFormData>({
    resolver: zodResolver(inventarioSchema),
  });

  const fetchInventario = async (termino = search) => {
    setLoading(true);
    try {
      const response = await inventarioService.listar(page - 1, 10, termino, categoriaFilter, stockFilter);
      setItems(response.content);
      setTotalPages(Math.ceil(response.totalElements / 10));
      setTotalItems(response.totalElements);

      const cats = [...new Set(response.content.map(i => i.categoria).filter(Boolean))] as string[];
      setCategorias(cats);
    } catch (error) {
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
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inventarioService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Repuesto desactivado' });
      setShowDeleteConfirm(null);
      fetchInventario();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Inventario</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Gestiona repuestos y stock del taller</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => {}} disabled>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}} disabled>
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          {isAdminOrJefe && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4" />
              Nuevo repuesto
            </Button>
          )}
        </div>
      </div>

      <Card subtitle="Catálogo de repuestos">
        <CardContent className="p-0">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre, marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <Select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  options={categorias.map(c => ({ value: c, label: c }))}
                  placeholder="Todas las categorías"
                  className="w-full sm:w-48"
                />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Stock normal' },
                    { value: 'bajo', label: 'Stock bajo (≤ mínimo)' },
                    { value: 'agotado', label: 'Agotado (0)' },
                  ]}
                  placeholder="Stock normal"
                  className="w-full sm:w-48"
                />
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={items}
            keyExtractor={(i) => i.id.toString()}
            loading={loading}
            hoverable
            striped
            rowClassName={(i) => i.stockActual === 0 ? 'bg-danger-50/50 dark:bg-danger-900/20' : i.stockActual <= i.stockMinimo ? 'bg-accent-50/50 dark:bg-accent-900/20' : ''}
            emptyMessage="No hay repuestos registrados"
            emptyIcon={<Package className="w-12 h-12 text-surface-300 dark:text-surface-600" />}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showPerPage
            perPage={10}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Editar repuesto' : 'Nuevo repuesto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('codigo')}
              label="Código *"
              placeholder="REP-001"
              error={errors.codigo?.message}
            />
            <Input
              {...register('nombre')}
              label="Nombre *"
              placeholder="Filtro de aceite"
              error={errors.nombre?.message}
            />
          </div>

          <Input
            {...register('descripcion')}
            label="Descripción"
            placeholder="Descripción del repuesto"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              {...register('categoria')}
              label="Categoría"
              placeholder="Filtros"
            />
            <Input
              {...register('marca')}
              label="Marca"
              placeholder="Bosch"
            />
            <Input
              {...register('modelo')}
              label="Modelo"
              placeholder="OF-123"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              {...register('stockActual', { valueAsNumber: true })}
              type="number"
              label="Stock actual *"
              placeholder="50"
              error={errors.stockActual?.message}
            />
            <Input
              {...register('stockMinimo', { valueAsNumber: true })}
              type="number"
              label="Stock mínimo *"
              placeholder="5"
              error={errors.stockMinimo?.message}
            />
            <Input
              {...register('precioCompra', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Precio compra *"
              placeholder="15.00"
              error={errors.precioCompra?.message}
            />
            <Input
              {...register('precioVenta', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Precio venta *"
              placeholder="25.00"
              error={errors.precioVenta?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('ubicacion')}
              label="Ubicación"
              placeholder="A-1"
            />
            <Input
              {...register('proveedor')}
              label="Proveedor"
              placeholder="Distribuidora AutoPartes"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                {...register('activo')}
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 dark:border-surface-700"
              />
              <span className="text-sm text-surface-700 dark:text-surface-200">Activo</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={false}>
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Desactivar repuesto?"
        message="Esta acción marcará el repuesto como inactivo. ¿Deseas continuar?"
        variant="warning"
        confirmText="Desactivar"
      />
    </div>
  );
};