import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Wrench, User, ChevronDown, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Table, Column, Pagination } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ordenService } from '../../services/ordenService';
import { usuarioService } from '../../services/usuarioService';
import { inventarioService } from '../../services/inventarioService';
import { ordenTrabajoSchema, type OrdenTrabajoFormData } from '../../utils/validation';
import { formatDateTime, formatCurrency, getEstadoLabel, getEstadoColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

type OrdenWithRelations = {
  id: number;
  numeroOrden: string;
  cliente: { nombreCompleto: string; email: string };
  mecanico?: { nombreCompleto: string };
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
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [clientes, setClientes] = useState<{ id: number; nombreCompleto: string }[]>([]);
  const [mecanicos, setMecanicos] = useState<{ id: number; nombreCompleto: string }[]>([]);
  const [repuestos, setRepuestos] = useState<{ id: number; nombre: string; stockActual: number; precioVenta: number }[]>([]);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');
  const isMecanico = user?.rol?.nombre === 'MECANICO';

  const columns: Column<OrdenWithRelations>[] = [
    { key: 'numeroOrden', header: 'Nº Orden', sortable: true },
    { key: 'cliente', header: 'Cliente', render: (o) => o.cliente.nombreCompleto },
    { key: 'mecanico', header: 'Mecánico', render: (o) => o.mecanico?.nombreCompleto || 'Sin asignar' },
    { key: 'estado', header: 'Estado', render: (o) => (
      <Badge variant={getEstadoColor(o.estado)}>
        {getEstadoLabel(o.estado)}
      </Badge>
    )},
    { key: 'fechaIngreso', header: 'Fecha ingreso', sortable: true, render: (o) => formatDateTime(o.fechaIngreso) },
    { key: 'costoTotal', header: 'Total', render: (o) => formatCurrency(o.costoTotal) },
    { key: 'actions', header: 'Acciones', render: (o, i) => (
      <div className="flex items-center gap-2">
        {(isAdminOrJefe || isMecanico) && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(o); }}>
            Editar
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(o.id); }}>
            Eliminar
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
    resolver: zodResolver(ordenSchema),
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
        setOrdenes(response.content);
        setTotalPages(Math.ceil(response.totalElements / 10));
      } else {
        const data = await ordenService.misOrdenes();
        setOrdenes(data);
        setTotalPages(1);
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
      setClientes(clientesData.map(c => ({ id: c.id, nombreCompleto: c.nombreCompleto || '' })));
      setMecanicos(mecanicosData.map(m => ({ id: m.id, nombreCompleto: m.nombreCompleto || '' })));
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
      mecanicoId: orden.mecanico?.id || '',
      descripcionProblema: orden.descripcionProblema,
      diagnostico: orden.diagnostico || '',
      solucionAplicada: orden.solucionAplicada || '',
      estado: orden.estado,
      fechaEstimadaEntrega: orden.fechaEstimadaEntrega ? new Date(orden.fechaEstimadaEntrega).toISOString().slice(0, 16) : '',
      costoManoObra: orden.costoTotal - 0, // This is simplified
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

  const onSubmit = async (data: OrdenFormData) => {
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

  const estadosOrden = [
    'RECIEN_INGRESADO',
    'POR_INGRESAR',
    'TRABAJANDO',
    'TERMINADO',
    'ENTREGADO',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
          <p className="text-gray-600">Gestiona las órdenes del taller</p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva orden
          </Button>
        )}
      </div>

      <Card subtitle="Lista de órdenes de trabajo">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nº orden, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Todos los estados</option>
              {estadosOrden.map(e => (
                <option key={e} value={e}>{getEstadoLabel(e)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <Table
          columns={columns}
          data={ordenes}
          keyExtractor={(o) => o.id.toString()}
          loading={loading}
          emptyMessage="No hay órdenes registradas"
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
        onClose={() => { setShowModal(false); setEditingOrden(null); }}
        title={editingOrden ? 'Editar orden' : 'Nueva orden'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Número de orden"
              error={errors.numeroOrden?.message}
              {...register('numeroOrden')}
              required
              disabled={!!editingOrden}
            />
            <Input
              label="Cliente"
              type="select"
              error={errors.clienteId?.message}
              {...register('clienteId')}
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
              ))}
            </Input>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mecánico"
              type="select"
              {...register('mecanicoId')}
            >
              <option value="">Sin asignar</option>
              {mecanicos.map(m => (
                <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
              ))}
            </Input>
            <Input
              label="Estado"
              type="select"
              error={errors.estado?.message}
              {...register('estado')}
              required
            >
              {estadosOrden.map(e => (
                <option key={e} value={e}>{getEstadoLabel(e)}</option>
              ))}
            </Input>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha estimada entrega"
              type="datetime-local"
              {...register('fechaEstimadaEntrega')}
            />
            <Input
              label="Costo mano de obra"
              type="number"
              step="0.01"
              min="0"
              {...register('costoManoObra', { valueAsNumber: true })}
            />
          </div>
          <Input
            label="Descripción del problema"
            placeholder="Detalles del problema..."
            error={errors.descripcionProblema?.message}
            {...register('descripcionProblema')}
            required
          />
          <Input
            label="Diagnóstico"
            placeholder="Diagnóstico del técnico..."
            {...register('diagnostico')}
          />
          <Input
            label="Solución aplicada"
            placeholder="Solución realizada..."
            {...register('solucionAplicada')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
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
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="Eliminar orden"
        message="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
};