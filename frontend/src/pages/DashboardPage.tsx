import { 
  Calendar, 
  ClipboardList, 
  Package, 
  Users, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { reservaService } from '../../services/reservaService';
import { ordenService } from '../../services/ordenService';
import { inventarioService } from '../../services/inventarioService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard = ({ title, value, icon, color, trend, trendUp }: StatsCardProps) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </Card>
);

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [stats, setStats] = useState({
    reservasHoy: 0,
    ordenesPendientes: 0,
    ordenesTrabajando: 0,
    stockBajo: 0,
  });
  const [recentReservas, setRecentReservas] = useState([]);
  const [recentOrdenes, setRecentOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservas, ordenes, inventario] = await Promise.all([
          reservaService.misReservas(),
          ordenService.misOrdenes(),
          inventarioService.listarStockBajo(),
        ]);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const reservasHoy = reservas.filter((r) => {
          const fecha = new Date(r.fechaHora);
          return fecha >= hoy && fecha < manana;
        }).length;

        const ordenesPendientes = ordenes.filter((o) => 
          ['RECIEN_INGRESADO', 'POR_INGRESAR'].includes(o.estado)
        ).length;

        const ordenesTrabajando = ordenes.filter((o) => 
          o.estado === 'TRABAJANDO'
        ).length;

        setStats({
          reservasHoy,
          ordenesPendientes,
          ordenesTrabajando,
          stockBajo: inventario.length,
        });

        setRecentReservas(reservas.slice(0, 5));
        setRecentOrdenes(ordenes.slice(0, 5));
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudieron cargar los datos del dashboard',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  const isAdminOrJefe = ['ADMIN', 'JEFE_TALLER'].includes(user?.rol?.nombre || '');
  const isMecanico = user?.rol?.nombre === 'MECANICO';
  const isCliente = user?.rol?.nombre === 'CLIENTE';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCliente ? 'Mis reservas' : isMecanico ? 'Mis órdenes' : 'Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isCliente 
              ? 'Gestiona tus citas y revisa el estado de tus vehículos'
              : isMecanico
              ? 'Revisa tus órdenes de trabajo asignadas'
              : 'Bienvenido al panel de control del taller'}
          </p>
        </div>
        {isAdminOrJefe && (
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver reportes
          </Button>
        )}
      </div>

      {isAdminOrJefe && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Reservas hoy"
            value={stats.reservasHoy}
            icon={<Calendar className="h-6 w-6" />}
            color="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Órdenes pendientes"
            value={stats.ordenesPendientes}
            icon={<ClipboardList className="h-6 w-6" />}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatsCard
            title="En proceso"
            value={stats.ordenesTrabajando}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="Stock bajo"
            value={stats.stockBajo}
            icon={<Package className="h-6 w-6" />}
            color="bg-red-100 text-red-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(!isCliente || isAdminOrJefe) && (
          <Card title="Órdenes recientes" subtitle={isMecanico ? 'Tus órdenes asignadas' : 'Últimas órdenes de trabajo'}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrdenes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay órdenes recientes</p>
            ) : (
              <div className="space-y-4">
                {recentOrdenes.map((orden: { id: number; numeroOrden: string; cliente: { nombreCompleto: string }; estado: string; fechaIngreso: string; costoTotal: number }) => (
                  <div key={orden.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{orden.numeroOrden}</p>
                        <p className="text-sm text-gray-500">{orden.cliente.nombreCompleto}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getEstadoColor(orden.estado)}>
                        {getEstadoLabel(orden.estado)}
                      </Badge>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatCurrency(orden.costoTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card title={isCliente ? 'Mis próximas citas' : 'Reservas recientes'} subtitle="Próximas citas programadas">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            </div>
          ) : recentReservas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {isCliente ? 'No tienes citas programadas' : 'No hay reservas recientes'}
            </p>
          ) : (
            <div className="space-y-4">
              {recentReservas.map((reserva: { id: number; fechaHora: string; cliente: { nombreCompleto: string }; categoriaServicio?: string; estado: string }) => (
                <div key={reserva.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(reserva.fechaHora)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isCliente ? reserva.categoriaServicio || 'Servicio general' : reserva.cliente.nombreCompleto}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getReservaEstadoColor(reserva.estado)}>
                    {getReservaEstadoLabel(reserva.estado)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {isAdminOrJefe && stats.stockBajo > 0 && (
        <Card title="⚠️ Productos con stock bajo" subtitle="Estos productos necesitan reposición">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Hay {stats.stockBajo} producto(s) por debajo del stock mínimo. 
              <a href="/inventario" className="text-primary-600 hover:text-primary-500 font-medium ml-1">
                Ver inventario
              </a>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    RECIEN_INGRESADO: 'Recién ingresado',
    POR_INGRESAR: 'Por ingresar',
    TRABAJANDO: 'Trabajando',
    TERMINADO: 'Terminado',
    ENTREGADO: 'Entregado',
  };
  return labels[estado] || estado;
}

function getEstadoColor(estado: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary' {
  const colors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'> = {
    RECIEN_INGRESADO: 'info',
    POR_INGRESAR: 'warning',
    TRABAJANDO: 'primary',
    TERMINADO: 'success',
    ENTREGADO: 'gray',
  };
  return colors[estado] || 'gray';
}

function getReservaEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada',
  };
  return labels[estado] || estado;
}

function getReservaEstadoColor(estado: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary' {
  const colors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'> = {
    PENDIENTE: 'warning',
    CONFIRMADA: 'info',
    EN_PROCESO: 'primary',
    COMPLETADA: 'success',
    CANCELADA: 'danger',
  };
  return colors[estado] || 'gray';
}