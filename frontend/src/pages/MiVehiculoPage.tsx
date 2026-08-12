import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Plus, Pencil, Trash2, RefreshCcw, AlertTriangle, Wrench, ClipboardList, History } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { vehiculoService } from '../services/vehiculoService';
import { ordenService } from '../services/ordenService';
import type { Vehiculo, EstadoVehiculo } from '../types';
import { formatDate, getEstadoOrdenColor, getEstadoOrdenLabel } from '../utils/helpers';

const vehiculoSchema = z.object({
  placa: z.string().min(4, 'Placa invalida').max(20),
  marca: z.string().min(1, 'La marca es obligatoria').max(80),
  modelo: z.string().min(1, 'El modelo es obligatorio').max(80),
  anio: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
  color: z.string().max(40).optional(),
  kilometraje: z.coerce.number().int().min(0).optional(),
  notas: z.string().max(1000).optional(),
});
type VehiculoForm = z.infer<typeof vehiculoSchema>;

const badgeVariantForEstado = (e: EstadoVehiculo) => {
  switch (e) {
    case 'DISPONIBLE': return 'gray';
    case 'EN_TALLER': return 'warning';
    case 'EN_REPARACION': return 'primary';
    case 'LISTO': return 'success';
    case 'ENTREGADO': return 'info';
  }
};

const MiVehiculoPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useUIStore();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [deleting, setDeleting] = useState<Vehiculo | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VehiculoForm>({
    resolver: zodResolver(vehiculoSchema),
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
      setVehiculos(await vehiculoService.misVehiculos());
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudieron cargar tus vehiculos' });
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditing(null);
    reset({ placa: '', marca: '', modelo: '', anio: '', color: '', kilometraje: 0, notas: '' });
    setShowForm(true);
  };

  const abrirEditar = (v: Vehiculo) => {
    setEditing(v);
    reset({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio ?? '',
      color: v.color ?? '',
      kilometraje: v.kilometraje ?? 0,
      notas: v.notas ?? '',
    });
    setShowForm(true);
  };

  const guardar = async (data: VehiculoForm) => {
    try {
      const payload = {
        placa: data.placa.toUpperCase(),
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio === '' ? undefined : Number(data.anio),
        color: data.color || undefined,
        kilometraje: data.kilometraje ?? 0,
        notas: data.notas || undefined,
      };
      if (editing) {
        await vehiculoService.actualizar(editing.id, payload);
        addNotification({ type: 'success', title: 'Vehiculo actualizado' });
      } else {
        await vehiculoService.crear(payload);
        addNotification({ type: 'success', title: 'Vehiculo registrado' });
      }
      setShowForm(false);
      cargar();
    } catch (e: any) {
      addNotification({ type: 'error', title: 'No se pudo guardar', message: extraerMensaje(e) });
    }
  };

  const confirmarEliminar = async () => {
    if (!deleting) return;
    try {
      await vehiculoService.eliminar(deleting.id);
      addNotification({ type: 'success', title: 'Vehiculo eliminado' });
      setDeleting(null);
      cargar();
    } catch (e: any) {
      addNotification({ type: 'error', title: 'No se pudo eliminar', message: extraerMensaje(e) });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mi vehiculo</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Registra tus vehiculos y consulta su estado actual.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/mis-reservas"><Button variant="outline"><ClipboardList className="h-4 w-4" /> Mis reservas</Button></Link>
          <Link to="/mi-historial"><Button variant="outline"><History className="h-4 w-4" /> Mi historial</Button></Link>
          <Button onClick={abrirCrear}><Plus className="h-4 w-4" /> Agregar vehiculo</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-surface-200 dark:bg-surface-700 animate-pulse" />
          ))}
        </div>
      ) : vehiculos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
            <p className="font-medium">Aun no tienes vehiculos registrados</p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Registra tu primer vehiculo para empezar.</p>
            <div className="mt-4">
              <Button onClick={abrirCrear}><Plus className="h-4 w-4" /> Registrar vehiculo</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {vehiculos.map(v => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-surface-500 dark:text-surface-400 tracking-wider">{v.placa}</p>
                  <h3 className="text-lg font-semibold">{v.marca} {v.modelo}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {[v.anio, v.color, `${(v.kilometraje ?? 0).toLocaleString('es-CR')} km`].filter(Boolean).join(' - ')}
                  </p>
                </div>
                <Badge variant={badgeVariantForEstado(v.estado)} dot>{v.estadoLabel}</Badge>
              </div>
              {v.notas && <p className="mt-3 text-sm text-surface-600 dark:text-surface-300">{v.notas}</p>}
              <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(v)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => cargar()}>
                  <RefreshCcw className="h-4 w-4" /> Actualizar
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(v)} className="ml-auto">
                  <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar vehiculo' : 'Registrar vehiculo'}>
        <form onSubmit={handleSubmit(guardar)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Placa" placeholder="ABC-123" {...register('placa')} error={errors.placa?.message} />
            <Input label="Marca" placeholder="Toyota" {...register('marca')} error={errors.marca?.message} />
            <Input label="Modelo" placeholder="Corolla" {...register('modelo')} error={errors.modelo?.message} />
            <Input label="Anio" type="number" placeholder="2020" {...register('anio')} error={errors.anio?.message} />
            <Input label="Color" placeholder="Rojo" {...register('color')} error={errors.color?.message} />
            <Input label="Kilometraje" type="number" placeholder="50000" {...register('kilometraje')} error={errors.kilometraje?.message} />
          </div>
          <Textarea label="Notas" placeholder="Detalles, observaciones..." rows={3} {...register('notas')} error={errors.notas?.message} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Guardar cambios' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        title="Eliminar vehiculo"
        message={deleting ? `Esta accion no se puede deshacer. Eliminar ${deleting.marca} ${deleting.modelo} (${deleting.placa}).` : ''}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmarEliminar}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
};

const extraerMensaje = (e: any): string => {
  return e?.response?.data?.mensaje || e?.message || 'Error desconocido';
};

export default MiVehiculoPage;