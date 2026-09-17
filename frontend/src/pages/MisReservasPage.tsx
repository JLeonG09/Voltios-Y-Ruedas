import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, Pencil, X, RefreshCcw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { reservaService } from '../services/reservaService';
import type { Reserva } from '../types';
import { formatDateTime, getReservaEstadoColor, getReservaEstadoLabel, toDateTimeInputValue } from '../utils/helpers';

const reservaSchema = z.object({
  fechaHora: z.string().min(1, 'La fecha y hora son obligatorias'),
  categoriaServicio: z.string().max(100).optional(),
  descripcion: z.string().max(1000).optional(),
});
type ReservaForm = z.infer<typeof reservaSchema>;

const MisReservasPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reserva | null>(null);
  const [cancelling, setCancelling] = useState<Reserva | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservaForm>({
    resolver: zodResolver(reservaSchema),
  });

  useEffect(() => {
    if (!isAuthenticated || user?.rol?.nombre !== 'CLIENTE') {
      navigate('/');
      return;
    }
    cargar();
  }, [isAuthenticated, user?.rol?.nombre]);

  const cargar = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setReservas(await reservaService.misReservas());
    } catch {
      setReservas([]);
      setLoadError('No se pudieron cargar tus reservas');
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar tus reservas' });
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditing(null);
    reset({ fechaHora: '', categoriaServicio: '', descripcion: '' });
    setShowForm(true);
  };

  const abrirEditar = (r: Reserva) => {
    setEditing(r);
    reset({
      fechaHora: toDateTimeInputValue(r.fechaHora ?? ''),
      categoriaServicio: r.categoriaServicio ?? '',
      descripcion: r.descripcion ?? '',
    });
    setShowForm(true);
  };

  const guardar = async (data: ReservaForm) => {
    try {
      const payload = {
        fechaHora: data.fechaHora,
        categoriaServicio: data.categoriaServicio || undefined,
        descripcion: data.descripcion || undefined,
      };
      if (editing) {
        await reservaService.actualizar(editing.id, payload);
        addNotification({ type: 'success', title: 'Reserva actualizada' });
      } else {
        await reservaService.crear(payload);
        addNotification({ type: 'success', title: 'Reserva creada' });
      }
      setShowForm(false);
      cargar();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { mensaje?: string } }; message?: string };
      addNotification({
        type: 'error',
        title: 'No se pudo guardar',
        message: err?.response?.data?.mensaje || err?.message,
      });
    }
  };

  const confirmarCancelar = async () => {
    if (!cancelling) return;
    setCancellingLoading(true);
    try {
      await reservaService.cancelar(cancelling.id);
      addNotification({ type: 'success', title: 'Reserva cancelada' });
      setCancelling(null);
      cargar();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { mensaje?: string } }; message?: string };
      addNotification({
        type: 'error',
        title: 'No se pudo cancelar',
        message: err?.response?.data?.mensaje || err?.message,
      });
    } finally {
      setCancellingLoading(false);
    }
  };

  const mostrarVacio = !loading && !loadError && reservas.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Cliente
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Mis reservas
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Agenda, modifica o cancela tus citas en el taller.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Button type="button" variant="secondary" onClick={cargar} disabled={loading}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Actualizar
          </Button>
          <Button type="button" onClick={abrirCrear}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva reserva
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden" padding="none">
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
              <Button type="button" variant="secondary" size="sm" onClick={cargar}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : mostrarVacio ? (
            <div className="empty-state px-4">
              <Calendar className="empty-state-icon" aria-hidden="true" />
              <h2 className="empty-state-title">No hay reservas</h2>
              <p className="empty-state-text">Aún no tienes citas registradas en el taller.</p>
              <Button type="button" onClick={abrirCrear}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva reserva
              </Button>
            </div>
          ) : (
            !loadError && (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {reservas.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tracking-tight text-surface-900 dark:text-surface-50">
                        {r.categoriaServicio || 'Reserva general'}
                      </p>
                      <p className="mt-0.5 text-sm tabular-nums text-surface-500 dark:text-surface-400">
                        {formatDateTime(r.fechaHora)}
                      </p>
                      {r.descripcion && (
                        <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">{r.descripcion}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          getReservaEstadoColor(r.estado) as
                            | 'success'
                            | 'warning'
                            | 'danger'
                            | 'info'
                            | 'gray'
                            | 'primary'
                        }
                        dot
                      >
                        {getReservaEstadoLabel(r.estado)}
                      </Badge>
                      <Button size="sm" variant="secondary" onClick={() => abrirEditar(r)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setCancelling(r)}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        Cancelar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showForm}
        onClose={() => {
          if (!isSubmitting) setShowForm(false);
        }}
        title={editing ? 'Editar reserva' : 'Nueva reserva'}
        description="Indica cuándo necesitas el servicio del taller."
        closeOnOverlayClick={!isSubmitting}
        closeOnEscape={!isSubmitting}
      >
        <form onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
          <Input
            label="Fecha y hora *"
            type="datetime-local"
            {...register('fechaHora')}
            error={errors.fechaHora?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Categoría de servicio"
            placeholder="Diagnóstico, frenos, eléctrico…"
            {...register('categoriaServicio')}
            error={errors.categoriaServicio?.message}
            disabled={isSubmitting}
          />
          <Textarea
            label="Descripción"
            rows={3}
            placeholder="Describe brevemente lo que necesitas…"
            {...register('descripcion')}
            error={errors.descripcion?.message}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Guardar' : 'Crear reserva'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelling}
        title="Cancelar reserva"
        message={cancelling ? `Cancelar la reserva del ${formatDateTime(cancelling.fechaHora)}.` : ''}
        confirmText="Cancelar reserva"
        variant="danger"
        loading={cancellingLoading}
        onConfirm={confirmarCancelar}
        onClose={() => {
          if (!cancellingLoading) setCancelling(null);
        }}
      />
    </div>
  );
};

export default MisReservasPage;
