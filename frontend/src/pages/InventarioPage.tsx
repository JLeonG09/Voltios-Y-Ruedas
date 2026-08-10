import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Package, AlertTriangle, ChevronDown, DollarSign, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Table, Column, Pagination } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { inventarioService } from '../../services/inventarioService';
import { inventarioSchema, type InventarioFormData } from '../../utils/validation';
import { formatCurrency, getEstadoColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

type InventarioWithStock = {
  id: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  stockActual: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  ubicacion?: string;
  proveedor?: string;
  activo: boolean;
};

export const InventarioPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [items, setItems] = useState<InventarioWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
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
    { key: 'categoria', header: 'Categoría', render: (i) => i.categoria || '-' },
    { key: 'marca', header: 'Marca', render: (i) => i.marca || '-' },
    { key: 'stockActual', header: 'Stock', sortable: true, render: (i) => (
      <span className={i.stockActual <= i.stockMinimo ? 'text-red-600 font-medium' : 'text-gray-900'}>
        {i.stockActual} / {i.stockMinimo}
      </span>
    )},
    { key: 'precioVenta', header: 'Precio venta', sortable: true, render: (i) => formatCurrency(i.precioVenta) },
    { key: 'activo', header: 'Estado', render: (i) => (
      <Badge variant={i.activo ? 'success' : 'gray'}>
        {i.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
    { key: 'actions', header: 'Acciones', render: (i, idx) => (
      <div className="flex items-center gap-2">
        {isAdminOrJefe && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(i); }}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(i.id); }}>
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
    formState: { errors },
  } = useForm<InventarioFormData>({
    resolver: zodResolver(inventarioSchema),
    defaultValues: {
      stockActual: 0,
      stockMinimo: 5,
      precioCompra: 0,
      precioVenta: 0,
      activo: true,
    },
  });

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const response = await inventarioService.listar(page - 1, 10);
      setItems(response.content);
      setTotalPages(Math.ceil(response.totalElements / 10));
      
      const cats = [...new Set(response.content.map(i => i.categoria).filter(Boolean))] as string[];
      setCategorias(cats);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudo cargar el inventario' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario();
  }, [page, search, categoriaFilter, stockFilter]);

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

  const handleAjustarStock = async (id: number, cantidad: number) => {
    try {
      await inventarioService.ajustarStock(id, cantidad);
      addNotification({ type: 'success', title: 'Éxito', message: 'Stock ajustado' });
      fetchInventario();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al ajustar stock';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestiona repuestos y stock del taller</p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo repuesto
          </Button>
        )}
      </div>

      <Card subtitle="Catálogo de repuestos">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Stock normal</option>
              <option value="bajo">Stock bajo (≤ mínimo)</option>
              <option value="agotado">Agotado (0)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <Table
          columns={columns}
          data={items}
          keyExtractor={(i) => i.id.toString()}
          loading={loading}
          emptyMessage="No hay repuestos registrados"
        />
        
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null); }}
        title={editingItem ? 'Editar repuesto' : 'Nuevo repuesto'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código"
              error={errors.codigo?.message}
              {...register('codigo')}
              required
              disabled={!!editingItem}
            />
            <Input
              label="Nombre"
              error={errors.nombre?.message}
              {...register('nombre')}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Categoría"
              placeholder="Filtros, Frenos, Motor, etc."
              {...register('categoria')}
            />
            <Input
              label="Marca"
              placeholder="Bosch, NGK, etc."
              {...register('marca')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Modelo"
              placeholder="Compatibilidad..."
              {...register('modelo')}
            />
            <Input
              label="Ubicación"
              placeholder="Estante A-1, etc."
              {...register('ubicacion')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock actual"
              type="number"
              min="0"
              error={errors.stockActual?.message}
              {...register('stockActual', { valueAsNumber: true })}
              required
            />
            <Input
              label="Stock mínimo"
              type="number"
              min="0"
              error={errors.stockMinimo?.message}
              {...register('stockMinimo', { valueAsNumber: true })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio compra"
              type="number"
              step="0.01"
              min="0"
              error={errors.precioCompra?.message}
              {...register('precioCompra', { valueAsNumber: true })}
              required
            />
            <Input
              label="Precio venta"
              type="number"
              step="0.01"
              min="0"
              error={errors.precioVenta?.message}
              {...register('precioVenta', { valueAsNumber: true })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proveedor"
              {...register('proveedor')}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('activo')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>
          <Input
            label="Descripción"
            placeholder="Detalles adicionales..."
            {...register('descripcion')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="Desactivar repuesto"
        message="¿Estás seguro de que deseas desactivar este repuesto? No se eliminará permanentemente, solo se marcará como inactivo."
        confirmText="Desactivar"
        variant="danger"
      />
    </div>
  );
};