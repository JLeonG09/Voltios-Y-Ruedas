import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, Pencil, Trash2, X, RefreshCcw } from 'lucide-react';
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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reserva | null>(null);
  const [cancelling, setCancelling] = useState<Reserva | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReservaForm>({
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
    try {
      setReservas(await reservaService.misReservas());
    } catch {
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
    } catch (e: any) {
      addNotification({ type: 'error', title: 'No se pudo guardar', message: e?.response?.data?.mensaje || e?.message });
    }
  };

  const confirmarCancelar = async () => {
    if (!cancelling) return;
    try {
      await reservaService.cancelar(cancelling.id);
      addNotification({ type: 'success', title: 'Reserva cancelada' });
      setCancelling(null);
      cargar();
    } catch (e: any) {
      addNotification({ type: 'error', title: 'No se pudo cancelar', message: e?.response?.data?.mensaje || e?.message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis reservas</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Agenda, modifica o cancela tus citas en el taller.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cargar}><RefreshCcw className="h-4 w-4" /> Actualizar</Button>
          <Button onClick={abrirCrear}><Plus className="h-4 w-4" /> Nueva reserva</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />)}
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400">Aun no tienes reservas registradas.</p>
              <div className="mt-4"><Button onClick={abrirCrear}><Plus className="h-4 w-4" /> Crear primera reserva</Button></div>
            </div>
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {reservas.map(r => (
                <li key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.categoriaServicio || 'Reserva general'}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{formatDateTime(r.fechaHora)}</p>
                    {r.descripcion && <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">{r.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getReservaEstadoColor(r.estado) as any}>{getReservaEstadoLabel(r.estado)}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => abrirEditar(r)}><Pencil className="h-4 w-4" /> Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setCancelling(r)}><X className="h-4 w-4" /> Cancelar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar reserva' : 'Nueva reserva'}>
        <form onSubmit={handleSubmit(guardar)} className="space-y-4">
          <Input label="Fecha y hora" type="datetime-local" {...register('fechaHora')} error={errors.fechaHora?.message} />
          <Input label="Categoria de servicio" placeholder="Diagnostico, frenos, electrico..." {...register('categoriaServicio')} error={errors.categoriaServicio?.message} />
          <Textarea label="Descripcion" rows={3} placeholder="Describe brevemente lo que necesitas..." {...register('descripcion')} error={errors.descripcion?.message} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Guardar' : 'Crear reserva'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelling}
        title="Cancelar reserva"
        message={cancelling ? `Cancelar la reserva del ${formatDateTime(cancelling.fechaHora)}.` : ''}
        confirmText="Cancelar reserva"
        variant="danger"
        onConfirm={confirmarCancelar}
        onClose={() => setCancelling(null)}
      />
    </div>
  );
};

export default MisReservasPage;