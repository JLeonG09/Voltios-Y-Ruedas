import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Wrench, User, ChevronDown, Package, Edit, Trash2, ArrowUpDown, Clock, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ordenService } from '../services/ordenService';
import { usuarioService } from '../services/usuarioService';
import { inventarioService } from '../services/inventarioService';
import { ordenTrabajoSchema, type OrdenTrabajoFormData } from '../utils/validation';
import { formatDateTime, formatCurrency, getEstadoColor, getEstadoLabel } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useEffect } from 'react';
import type { OrdenTrabajo } from '../types/ordenes';

type EstadoBadge = 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'gray';

type OrdenWithRelations = {
  id: number;
  numeroOrden: string;
  cliente: { id: number; nombreCompleto: string; email: string };
  mecanico?: { id: number; nombreCompleto: string };
  estado: string;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string;
  costoTotal: number;
  descripcionProblema: string;
  diagnostico?: string;
  solucionAplicada?: string;
};

export const OrdenesPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [ordenes, setOrdenes] = useState<OrdenWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [clientes, setClientes] = useState<{ value: string; label: string }[]>([]);
  const [mecanicos, setMecanicos] = useState<{ value: string; label: string }[]>([]);
  const [repuestos, setRepuestos] = useState<{ id: number; nombre: string; stockActual: number; precioVenta: number }[]>([]);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');
  const isMecanico = user?.rol?.nombre === 'MECANICO';

  const estadosOrden = [
    'RECIEN_INGRESADO',
    'POR_INGRESAR',
    'TRABAJANDO',
    'TERMINADO',
    'ENTREGADO',
  ];

  const columns: Column<OrdenWithRelations>[] = [
    { key: 'numeroOrden', header: 'Nº Orden', sortable: true },
    { key: 'cliente', header: 'Cliente', render: (o) => (
      <div>
        <p className="font-medium text-surface-900 dark:text-white">{o.cliente.nombreCompleto}</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">{o.cliente.email}</p>
      </div>
    )},
    { key: 'mecanico', header: 'Mecánico', render: (o) => o.mecanico?.nombreCompleto || 'Sin asignar' },
    { key: 'estado', header: 'Estado', render: (o) => (
      <Badge variant={getEstadoColor(o.estado) as EstadoBadge} dot>
        {getEstadoLabel(o.estado)}
      </Badge>
    )},
    { key: 'fechaIngreso', header: 'Ingreso', sortable: true, render: (o) => formatDateTime(o.fechaIngreso) },
    { key: 'costoTotal', header: 'Total', sortable: true, align: 'right', render: (o) => formatCurrency(o.costoTotal) },
    { key: 'actions', header: 'Acciones', align: 'center', render: (o, idx) => (
      <div className="flex items-center gap-1 justify-center">
        {(isAdminOrJefe || isMecanico) && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(o); }} aria-label="Editar">
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(o.id); }} aria-label="Eliminar">
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrdenTrabajoFormData>({
    resolver: zodResolver(ordenTrabajoSchema),
    defaultValues: {
      estado: 'RECIEN_INGRESADO',
      costoManoObra: 0,
      costoRepuestos: 0,
    },
  });

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      if (isAdminOrJefe || isMecanico) {
        const response = await ordenService.listar(page - 1, 10);
        setOrdenes(response.content as OrdenWithRelations[]);
        setTotalPages(Math.ceil(response.totalElements / 10));
        setTotalItems(response.totalElements);
      } else {
        const data = await ordenService.misOrdenes();
        setOrdenes(data as OrdenWithRelations[]);
        setTotalPages(1);
        setTotalItems(data.length);
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar las órdenes' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const [clientesData, mecanicosData] = await Promise.all([
        usuarioService.listarTodos(),
        usuarioService.obtenerMecanicos(),
      ]);
      setClientes(clientesData.map(c => ({ value: c.id.toString(), label: c.nombreCompleto || '' })));
      setMecanicos(mecanicosData.map(m => ({ value: m.id.toString(), label: m.nombreCompleto || '' })));
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  const fetchRepuestos = async () => {
    try {
      const data = await inventarioService.listarActivos();
      setRepuestos(data.map(r => ({ id: r.id, nombre: r.nombre, stockActual: r.stockActual, precioVenta: r.precioVenta })));
    } catch (error) {
      console.error('Error fetching repuestos:', error);
    }
  };

  useEffect(() => {
    fetchOrdenes();
    if (isAdminOrJefe) {
      fetchUsuarios();
      fetchRepuestos();
    }
  }, [page, search, estadoFilter]);

  const handleEdit = (orden: OrdenWithRelations) => {
    setEditingOrden(orden);
    reset({
      numeroOrden: orden.numeroOrden,
      clienteId: orden.cliente.id,
      mecanicoId: orden.mecanico?.id,
      descripcionProblema: orden.descripcionProblema,
      diagnostico: orden.diagnostico || '',
      solucionAplicada: orden.solucionAplicada || '',
      estado: orden.estado as any,
      fechaEstimadaEntrega: orden.fechaEstimadaEntrega ? new Date(orden.fechaEstimadaEntrega).toISOString().slice(0, 16) : undefined,
      costoManoObra: 0,
      costoRepuestos: 0,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingOrden(null);
    reset({
      numeroOrden: `OT-${Date.now()}`,
      estado: 'RECIEN_INGRESADO',
      costoManoObra: 0,
      costoRepuestos: 0,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: OrdenTrabajoFormData) => {
    try {
      if (editingOrden) {
        await ordenService.actualizar(editingOrden.id, data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Orden actualizada' });
      } else {
        await ordenService.crear(data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Orden creada' });
      }
      setShowModal(false);
      fetchOrdenes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ordenService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Orden eliminada' });
      setShowDeleteConfirm(null);
      fetchOrdenes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const handleChangeEstado = async (id: number, nuevoEstado: string) => {
    try {
      await ordenService.cambiarEstado(id, nuevoEstado as any);
      addNotification({ type: 'success', title: 'Éxito', message: `Estado cambiado a ${getEstadoLabel(nuevoEstado)}` });
      fetchOrdenes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar estado';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Órdenes de trabajo</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Gestiona las órdenes del taller</p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" />
            Nueva orden
          </Button>
        )}
      </div>

      <Card subtitle="Listado de órdenes de trabajo">
        <CardContent className="p-0">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500" />
                <input
                  type="text"
                  placeholder="Buscar por número, cliente, descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500"
                />
              </div>
              <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...estadosOrden.map(e => ({ value: e, label: getEstadoLabel(e) })),
                  ]}
                  placeholder="Filtrar estado"
                  leftIcon={<Filter className="h-5 w-5" />}
                  className="w-full sm:w-48"
                />
            </div>
          </div>

          <Table
            columns={columns}
            data={ordenes}
            keyExtractor={(o) => o.id.toString()}
            loading={loading}
            hoverable
            striped
            emptyMessage="No hay órdenes registradas"
            emptyIcon={<ClipboardList className="w-12 h-12 text-surface-300 dark:text-surface-600" />}
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
        title={editingOrden ? 'Editar orden' : 'Nueva orden'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('numeroOrden')}
              label="Número de orden *"
              placeholder="OT-2024-001"
              error={errors.numeroOrden?.message}
              disabled={!!editingOrden}
            />
            <Select
              {...register('clienteId', { valueAsNumber: true })}
              label="Cliente *"
              options={clientes}
              placeholder="Selecciona un cliente"
              error={errors.clienteId?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              {...register('mecanicoId', { valueAsNumber: true })}
              label="Mecánico asignado"
              options={mecanicos}
              placeholder="Sin asignar"
            />
            <Select
              {...register('estado')}
              label="Estado"
              options={estadosOrden.map(e => ({ value: e, label: getEstadoLabel(e) }))}
              placeholder="Selecciona estado"
              error={errors.estado?.message}
            />
          </div>

          <Input
            {...register('descripcionProblema')}
            label="Descripción del problema *"
            placeholder="Describe el problema del vehículo..."
            error={errors.descripcionProblema?.message}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              {...register('diagnostico')}
              label="Diagnóstico"
              placeholder="Diagnóstico técnico..."
            />
            <Input
              {...register('solucionAplicada')}
              label="Solución aplicada"
              placeholder="Solución realizada..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              {...register('fechaEstimadaEntrega')}
              type="datetime-local"
              label="Fecha estimada entrega"
            />
            <Input
              {...register('costoManoObra', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Costo mano de obra"
              placeholder="0.00"
            />
            <Input
              {...register('costoRepuestos', { valueAsNumber: true })}
              type="number"
              step="0.01"
              label="Costo repuestos"
              placeholder="0.00"
            />
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">Repuestos utilizados</label>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-800">
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">Gestión de repuestos disponible en la vista de detalle</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingOrden ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Eliminar orden?"
        message="Esta acción eliminará la orden permanentemente. ¿Deseas continuar?"
        variant="danger"
        confirmText="Eliminar"
      />
    </div>
  );
};