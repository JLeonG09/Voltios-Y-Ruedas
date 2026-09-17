import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Filter, Calendar, Edit, Trash2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Table, Column, Pagination } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { reservaService } from '../services/reservaService';
import { reservaSchema, type ReservaFormData } from '../utils/validation';
import { formatDateTime, getReservaEstadoLabel, getReservaEstadoColor, toDateTimeInputValue, toLocalInputValue } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import { useEffect } from 'react';
import type { Reserva } from '../types/reservas';

type ReservaWithCliente = Reserva & {
  cliente: { id: number; nombreCompleto: string; email: string };
};

export const ReservasPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [reservas, setReservas] = useState<ReservaWithCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<ReservaWithCliente | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');
  const isMecanico = user?.rol?.nombre === 'MECANICO';

  const columns: Column<ReservaWithCliente>[] = [
    { key: 'fechaHora', header: 'Fecha y hora', sortable: true, render: (r) => formatDateTime(r.fechaHora) },
    { key: 'cliente', header: 'Cliente', render: (r) => (
      <div>
        <p className="font-medium text-surface-900 dark:text-white">{r.cliente?.nombreCompleto || 'N/A'}</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">{r.cliente?.email || ''}</p>
      </div>
    )},
    { key: 'categoriaServicio', header: 'Servicio', render: (r) => r.categoriaServicio || 'General' },
    { key: 'estado', header: 'Estado', render: (r) => (
      <Badge variant={getReservaEstadoColor(r.estado) as any} dot>
        {getReservaEstadoLabel(r.estado)}
      </Badge>
    )},
    { key: 'actions', header: 'Acciones', align: 'center', render: (r, idx) => (
      <div className="flex items-center gap-1 justify-center">
        {isAdminOrJefe && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(r); }} aria-label="Editar">
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {isAdminOrJefe && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(r.id); }} aria-label="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        {!isAdminOrJefe && r.estado === 'PENDIENTE' && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowCancelConfirm(r.id); }} aria-label="Cancelar" className="text-danger-600 hover:bg-danger-50 dark:text-danger-400">
            <XCircle className="h-4 w-4" />
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
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
  });

  const fetchReservas = async (termino = debouncedSearch) => {
    setLoading(true);
    try {
      if (isAdminOrJefe || isMecanico) {
        const response = await reservaService.listar(page - 1, 10, termino, estadoFilter);
        setReservas(response.content as ReservaWithCliente[]);
        const totalPaginas = Math.max(1, Math.ceil(response.totalElements / 10));
        setTotalPages(totalPaginas);
        setTotalItems(response.totalElements);
        if (page > totalPaginas) {
          setPage(totalPaginas);
        }
      } else {
        const data = await reservaService.misReservas();
        setReservas(data as ReservaWithCliente[]);
        setTotalPages(1);
        setTotalItems(data.length);
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar las reservas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas(debouncedSearch);
  }, [page, debouncedSearch, estadoFilter]);

  const handleEdit = (reserva: ReservaWithCliente) => {
    setEditingReserva(reserva);
    reset({
      fechaHora: toDateTimeInputValue(reserva.fechaHora),
      categoriaServicio: reserva.categoriaServicio || '',
      descripcion: reserva.descripcion || '',
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingReserva(null);
    reset({
      fechaHora: toLocalInputValue(new Date(Date.now() + 3600000)),
    });
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
      setShowCancelConfirm(null);
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
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Taller
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Reservas
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Gestiona las citas del taller
          </p>
        </div>
        {isAdminOrJefe && (
          <Button onClick={handleNew} className="shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva reserva
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
                placeholder="Cliente, servicio…"
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-full lg:w-56">
              <Select
                label="Estado"
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'PENDIENTE', label: 'Pendiente' },
                  { value: 'CONFIRMADA', label: 'Confirmada' },
                  { value: 'EN_PROCESO', label: 'En proceso' },
                  { value: 'COMPLETADA', label: 'Completada' },
                  { value: 'CANCELADA', label: 'Cancelada' },
                ]}
                leftIcon={<Filter className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table
            columns={columns}
            data={reservas}
            keyExtractor={(r) => r.id.toString()}
            loading={loading}
            hoverable
            striped
            emptyMessage="No hay reservas registradas"
            emptyIcon={<Calendar className="h-12 w-12" />}
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
        title={editingReserva ? 'Editar reserva' : 'Nueva reserva'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('fechaHora')}
            type="datetime-local"
            label="Fecha y hora *"
            error={errors.fechaHora?.message}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              {...register('categoriaServicio')}
              label="Categoría de servicio"
              options={[
                { value: 'Mantenimiento', label: 'Mantenimiento' },
                { value: 'Reparación', label: 'Reparación' },
                { value: 'Diagnóstico', label: 'Diagnóstico' },
                { value: 'Inspección', label: 'Inspección' },
                { value: 'Otro', label: 'Otro' },
              ]}
              placeholder="Selecciona una categoría"
            />
            <Input
              {...register('descripcion')}
              label="Descripción"
              placeholder="Detalles de la cita..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
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
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="¿Eliminar reserva?"
        message="Esta acción eliminará la reserva permanentemente. ¿Deseas continuar?"
        variant="danger"
        confirmText="Eliminar"
      />

      <ConfirmDialog
        isOpen={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={() => handleCancel(showCancelConfirm!)}
        title="¿Cancelar reserva?"
        message="La reserva se marcará como cancelada. ¿Deseas continuar?"
        variant="warning"
        confirmText="Cancelar"
      />
    </div>
  );
};