import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Table, Column, Pagination } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reservaService } from '../../services/reservaService';
import { usuarioService } from '../../services/usuarioService';
import { reservaSchema, type ReservaFormData } from '../../utils/validation';
import { formatDateTime, getReservaEstadoLabel, getReservaEstadoColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

type ReservaWithCliente = {
  id: number;
  cliente: { nombreCompleto: string; email: string };
  fechaHora: string;
  categoriaServicio?: string;
  estado: string;
  fechaCreacion: string;
};

export const ReservasPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [reservas, setReservas] = useState<ReservaWithCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<ReservaWithCliente | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [mecanicos, setMecanicos] = useState<{ id: number; nombreCompleto: string }[]>([]);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');
  const isMecanico = user?.rol?.nombre === 'MECANICO';

  const columns: Column<ReservaWithCliente>[] = [
    { key: 'fechaHora', header: 'Fecha y hora', sortable: true, render: (r) => formatDateTime(r.fechaHora) },
    { key: 'cliente', header: 'Cliente', render: (r) => (
      <div>
        <p className="font-medium">{r.cliente.nombreCompleto}</p>
        <p className="text-sm text-gray-500">{r.cliente.email}</p>
      </div>
    )},
    { key: 'categoriaServicio', header: 'Servicio', render: (r) => r.categoriaServicio || 'General' },
    { key: 'estado', header: 'Estado', render: (r) => (
      <Badge variant={getReservaEstadoColor(r.estado)}>
        {getReservaEstadoLabel(r.estado)}
      </Badge>
    )},
    { key: 'actions', header: 'Acciones', render: (r, i) => (
      <div className="flex items-center gap-2">
        {isAdminOrJefe && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(r); }}>
            Editar
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(r.id); }}>
            Eliminar
          </Button>
        )}
        {!isAdminOrJefe && r.estado === 'PENDIENTE' && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCancel(r.id); }}>
            Cancelar
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
    formState: { errors },
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
  });

  const fetchReservas = async () => {
    setLoading(true);
    try {
      if (isAdminOrJefe || isMecanico) {
        const response = await reservaService.listar(page - 1, 10);
        setReservas(response.content);
        setTotalPages(Math.ceil(response.totalElements / 10));
      } else {
        const data = await reservaService.misReservas();
        setReservas(data);
        setTotalPages(1);
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar las reservas' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMecanicos = async () => {
    try {
      const data = await usuarioService.obtenerMecanicos();
      setMecanicos(data.map(m => ({ id: m.id, nombreCompleto: m.nombreCompleto || '' })));
    } catch (error) {
      console.error('Error fetching mecanicos:', error);
    }
  };

  useEffect(() => {
    fetchReservas();
    if (isAdminOrJefe) fetchMecanicos();
  }, [page, search, estadoFilter]);

  const handleEdit = (reserva: ReservaWithCliente) => {
    setEditingReserva(reserva);
    reset({
      fechaHora: new Date(reserva.fechaHora).toISOString().slice(0, 16),
      categoriaServicio: reserva.categoriaServicio || '',
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingReserva(null);
    reset({ fechaHora: new Date().toISOString().slice(0, 16) });
    setShowModal(true);
  };

  const onSubmit = async (data: ReservaFormData) => {
    try {
      if (editingReserva) {
        await reservaService.actualizar(editingReserva.id, data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Reserva actualizada' });
      } else {
        await reservaService.crear(data);
        addNotification({ type: 'success', title: 'Éxito', message: 'Reserva creada' });
      }
      setShowModal(false);
      fetchReservas();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await reservaService.cancelar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Reserva cancelada' });
      fetchReservas();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cancelar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reservaService.eliminar(id);
      addNotification({ type: 'success', title: 'Éxito', message: 'Reserva eliminada' });
      setShowDeleteConfirm(null);
      fetchReservas();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      addNotification({ type: 'error', title: 'Error', message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Gestiona las citas del taller</p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva reserva
          </Button>
        )}
      </div>

      <Card subtitle="Lista de reservas">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, email..."
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
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <Table
          columns={columns}
          data={reservas}
          keyExtractor={(r) => r.id.toString()}
          loading={loading}
          emptyMessage="No hay reservas registradas"
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
        onClose={() => { setShowModal(false); setEditingReserva(null); }}
        title={editingReserva ? 'Editar reserva' : 'Nueva reserva'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha y hora"
              type="datetime-local"
              error={errors.fechaHora?.message}
              {...register('fechaHora')}
              required
            />
            <Input
              label="Categoría de servicio"
              placeholder="Mantenimiento, Reparación, etc."
              error={errors.categoriaServicio?.message}
              {...register('categoriaServicio')}
            />
          </div>
          <Input
            label="Descripción"
            placeholder="Detalles del servicio..."
            error={errors.descripcion?.message}
            {...register('descripcion')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingReserva ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="Eliminar reserva"
        message="¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
};