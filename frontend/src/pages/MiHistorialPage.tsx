import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, Wrench, Package, RefreshCcw, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { ordenService } from '../services/ordenService';
import { reservaService } from '../services/reservaService';
import { formatCurrency, formatDateTime, getEstadoOrdenColor, getEstadoOrdenLabel } from '../utils/helpers';
import type { OrdenTrabajo, Reserva } from '../types';

const MiHistorialPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useUIStore();
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      const [ords, resvs] = await Promise.all([
        ordenService.miHistorial(),
        reservaService.misReservas(),
      ]);
      setOrdenes(ords);
      setReservas(resvs);
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'No se pudo cargar el historial' });
    } finally {
      setLoading(false);
    }
  };

  const totalGastado = ordenes.reduce((acc, o) => acc + (o.costoTotal ?? 0), 0);
  const enCurso = ordenes.filter(o => ['RECIEN_INGRESADO', 'POR_INGRESAR', 'TRABAJANDO'].includes(o.estado)).length;
  const terminadas = ordenes.filter(o => ['TERMINADO', 'ENTREGADO'].includes(o.estado)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mi historial</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Ordenes, reparaciones y reservas pasadas y activas.</p>
        </div>
        <Button variant="outline" onClick={cargar}><RefreshCcw className="h-4 w-4" /> Actualizar</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">En curso</p>
              <p className="text-2xl font-bold mt-1">{enCurso}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-blue-900/30 text-primary-600 dark:text-blue-300 flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Completadas</p>
              <p className="text-2xl font-bold mt-1">{terminadas}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Total invertido</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalGastado)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-300 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />)}
            </div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400">Aun no tienes ordenes registradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {ordenes.map(o => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                    aria-expanded={expandedId === o.id}
                  >
                    <div>
                      <p className="font-medium">{o.numeroOrden} - {o.descripcionProblema}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {formatDateTime(o.fechaIngreso)} - {formatCurrency(o.costoTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getEstadoOrdenColor(o.estado) as any} dot>{getEstadoOrdenLabel(o.estado)}</Badge>
                      {expandedId === o.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {expandedId === o.id && (
                    <div className="px-6 pb-6 bg-surface-50 dark:bg-surface-800">
                      {o.diagnostico && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Diagnostico</p>
                          <p className="text-sm mt-1">{o.diagnostico}</p>
                        </div>
                      )}
                      {o.solucionAplicada && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Solucion aplicada</p>
                          <p className="text-sm mt-1">{o.solucionAplicada}</p>
                        </div>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3 mt-3">
                        <div className="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                          <p className="text-xs text-surface-500 dark:text-surface-400">Mano de obra</p>
                          <p className="font-semibold mt-1">{formatCurrency(o.costoManoObra ?? 0)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                          <p className="text-xs text-surface-500 dark:text-surface-400">Repuestos</p>
                          <p className="font-semibold mt-1">{formatCurrency(o.costoRepuestos ?? 0)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                          <p className="text-xs text-surface-500 dark:text-surface-400">Total</p>
                          <p className="font-semibold mt-1">{formatCurrency(o.costoTotal ?? 0)}</p>
                        </div>
                      </div>
                      {o.repuestosUtilizados && o.repuestosUtilizados.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2">Repuestos</p>
                          <ul className="text-sm space-y-1">
                            {o.repuestosUtilizados.map(r => (
                              <li key={r.id} className="flex justify-between bg-white dark:bg-surface-900 p-2 rounded border border-surface-200 dark:border-surface-800">
                                <span>Repuesto #{r.inventario?.id ?? r.id} - Cantidad {r.cantidad}</span>
                                <span className="font-medium">{formatCurrency(r.subtotal ?? 0)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {o.bitacora && o.bitacora.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2">Bitacora</p>
                          <ul className="space-y-2">
                            {o.bitacora.map(b => (
                              <li key={b.id} className="text-sm bg-white dark:bg-surface-900 p-2 rounded border border-surface-200 dark:border-surface-800">
                                <p className="font-medium">{b.accion} - {formatDateTime(b.fecha)}</p>
                                {b.descripcion && <p className="text-surface-600 dark:text-surface-300">{b.descripcion}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold">Reservas</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">Tus citas registradas en el taller.</p>
          </div>
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400 text-sm">No tienes reservas registradas.</div>
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {reservas.map(r => (
                <li key={r.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.categoriaServicio ?? 'Reserva general'}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{formatDateTime(r.fechaHora)}</p>
                  </div>
                  <Badge variant="gray">{r.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MiHistorialPage;