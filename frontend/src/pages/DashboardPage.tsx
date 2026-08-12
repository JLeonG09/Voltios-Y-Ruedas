import {
  Calendar,
  ClipboardList,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, Column } from "../components/ui/Table";
import {
  formatCurrency,
  formatDateTime,
  getEstadoColor,
  getEstadoLabel,
} from "../utils/helpers";
import { reservaService } from "../services/reservaService";
import { ordenService } from "../services/ordenService";
import { inventarioService } from "../services/inventarioService";
import { usuarioService } from "../services/usuarioService";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Reserva } from "../types/reservas";
import type { OrdenTrabajo } from "../types/ordenes";
import type { Inventario } from "../types/inventario";
import type { Usuario } from "../types/auth";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
  trendIcon?: React.ReactNode;
  action?: React.ReactNode;
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  trend,
  trendUp,
  trendIcon,
  action,
}: StatCardProps) => (
  <Card className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
        <p className="text-3xl font-bold text-surface-900 dark:text-white mt-1">
          {value}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-sm font-medium ${trendUp ? "text-brand-600 dark:text-brand-400" : "text-danger-600 dark:text-danger-400"}`}
            >
              {trendIcon ||
                (trendUp ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                ))}
              {trend}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
    {action && (
      <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">{action}</div>
    )}
  </Card>
);

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    reservasHoy: 0,
    ordenesPendientes: 0,
    ordenesTrabajando: 0,
    stockBajo: 0,
    ingresosMes: 0,
    clientesNuevos: 0,
  });
  const [recentReservas, setRecentReservas] = useState<Reserva[]>([]);
  const [recentOrdenes, setRecentOrdenes] = useState<OrdenTrabajo[]>([]);
  const [lowStock, setLowStock] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservasChartData, setReservasChartData] = useState<number[]>([]);

  const isAdminOrJefe = ["ADMIN", "JEFE_TALLER"].includes(
    user?.rol?.nombre || "",
  );
  const isMecanico = user?.rol?.nombre === "MECANICO";
  const isCliente = user?.rol?.nombre === "CLIENTE";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservasRes, ordenesRes, inventario, usuariosRes] =
          await Promise.all([
            isCliente
              ? reservaService.misReservas()
              : await reservaService.listar(0, 100),
            isCliente || isMecanico
              ? ordenService.misOrdenes()
              : ordenService.listar(0, 100),
            inventarioService.listarStockBajo(),
            isAdminOrJefe
              ? usuarioService.listar(0, 100)
              : Promise.resolve({ content: [], totalElements: 0 }),
          ]);

        const reservas = Array.isArray(reservasRes)
          ? reservasRes
          : reservasRes?.content || [];
        const ordenes = Array.isArray(ordenesRes)
          ? ordenesRes
          : ordenesRes?.content || [];
        const usuarios = Array.isArray(usuariosRes)
          ? usuariosRes
          : usuariosRes?.content || [];

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const reservasHoy = reservas.filter((r: Reserva) => {
          const fecha = new Date(r.fechaHora);
          return fecha >= hoy && fecha < manana;
        }).length;

        const ordenesPendientes = ordenes.filter((o: OrdenTrabajo) =>
          ["RECIEN_INGRESADO", "POR_INGRESAR"].includes(o.estado),
        ).length;

        const ordenesTrabajando = ordenes.filter(
          (o: OrdenTrabajo) => o.estado === "TRABAJANDO",
        ).length;

        const ingresosMes = ordenes
          .filter(
            (o: OrdenTrabajo) =>
              new Date(o.fechaIngreso) >= inicioMes && o.estado === "ENTREGADO",
          )
          .reduce(
            (sum: number, o: OrdenTrabajo) => sum + (o.costoTotal || 0),
            0,
          );

        const clientesNuevos = usuarios.filter(
          (u: Usuario) => new Date(u.fechaCreacion) >= inicioMes,
        ).length;

        setStats({
          reservasHoy,
          ordenesPendientes,
          ordenesTrabajando,
          stockBajo: inventario.length,
          ingresosMes,
          clientesNuevos,
        });

        setRecentReservas(reservas.slice(0, 5));
        setRecentOrdenes(ordenes.slice(0, 5));
        setLowStock(inventario.slice(0, 5));

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          return reservas.filter((r: Reserva) => {
            const fecha = new Date(r.fechaHora);
            return fecha >= date && fecha < nextDate;
          }).length;
        });
        setReservasChartData(last7Days);
      } catch {
        addNotification({
          type: "error",
          title: "Error",
          message: "No se pudieron cargar los datos del dashboard",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  const statCards = [
    {
      title: "Reservas hoy",
      value: stats.reservasHoy,
      icon: <Calendar className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Órdenes pendientes",
      value: stats.ordenesPendientes,
      icon: <ClipboardList className="h-6 w-6" />,
      color: "bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-300",
    },
    {
      title: "En trabajo",
      value: stats.ordenesTrabajando,
      icon: <Wrench className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Stock bajo",
      value: stats.stockBajo,
      icon: <Package className="h-6 w-6" />,
      color:
        stats.stockBajo > 0
          ? "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-300"
          : "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
      trend: stats.stockBajo > 0 ? "Requiere atención" : "Todo OK",
      trendUp: stats.stockBajo === 0,
    },
    ...(isAdminOrJefe
      ? [
          {
            title: "Ingresos este mes",
            value: formatCurrency(stats.ingresosMes),
            icon: <TrendingUp className="h-6 w-6" />,
            color: "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
          },
          {
            title: "Clientes nuevos",
            value: stats.clientesNuevos,
            icon: <Users className="h-6 w-6" />,
            color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
          },
        ]
      : []),
  ];

  const reservasColumns: Column<Reserva>[] = [
    {
      key: "fechaHora",
      header: "Fecha",
      render: (r) => formatDateTime(r.fechaHora),
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (r) => r.cliente?.nombreCompleto || "N/A",
    },
    {
      key: "categoriaServicio",
      header: "Servicio",
      render: (r) => r.categoriaServicio || "General",
    },
    {
      key: "estado",
      header: "Estado",
      render: (r) => (
        <Badge variant={getEstadoColor(r.estado) as any} dot>
          {getEstadoLabel(r.estado)}
        </Badge>
      ),
    },
  ];

  const ordenesColumns: Column<OrdenTrabajo>[] = [
    { key: "numeroOrden", header: "Nº Orden" },
    {
      key: "cliente",
      header: "Cliente",
      render: (o) => o.cliente?.nombreCompleto || "N/A",
    },
    {
      key: "mecanico",
      header: "Mecánico",
      render: (o) => o.mecanico?.nombreCompleto || "Sin asignar",
    },
    {
      key: "estado",
      header: "Estado",
      render: (o) => (
        <Badge variant={getEstadoColor(o.estado) as any} dot>
          {getEstadoLabel(o.estado)}
        </Badge>
      ),
    },
    {
      key: "fechaIngreso",
      header: "Ingreso",
      render: (o) => formatDateTime(o.fechaIngreso),
    },
    {
      key: "costoTotal",
      header: "Total",
      render: (o) => formatCurrency(o.costoTotal),
    },
  ];

  const stockColumns: Column<Inventario>[] = [
    { key: "codigo", header: "Código" },
    { key: "nombre", header: "Repuesto" },
    {
      key: "stockActual",
      header: "Stock",
      render: (i) => (
        <span
          className={
            i.stockActual <= i.stockMinimo
              ? "text-danger-600 dark:text-danger-400 font-medium"
              : "text-surface-900 dark:text-white"
          }
        >
          {i.stockActual} / {i.stockMinimo}
        </span>
      ),
    },
    {
      key: "precioVenta",
      header: "Precio",
      render: (i) => formatCurrency(i.precioVenta),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {isCliente
              ? "Mis reservas"
              : isMecanico
                ? "Mis órdenes"
                : "Dashboard"}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {isCliente
              ? "Resumen de tus citas programadas"
              : isMecanico
                ? "Órdenes asignadas y pendientes"
                : "Resumen general del taller"}
          </p>
        </div>
        {isAdminOrJefe && (
          <Button variant="primary" size="md" onClick={() => navigate("/ordenes")}>
            <TrendingUp className="h-4 w-4" />
            Ver órdenes
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Reservas recientes"
          subtitle="Próximas citas programadas"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/reservas")}>
              Ver todas
            </Button>
          }
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReservas.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                <p className="text-surface-500 dark:text-surface-400">
                  {isCliente
                    ? "No tienes citas programadas"
                    : "No hay reservas recientes"}
                </p>
              </div>
            ) : (
              <Table
                columns={reservasColumns}
                data={recentReservas}
                keyExtractor={(r) => r.id.toString()}
                hoverable
                striped
              />
            )}
          </CardContent>
        </Card>

        <Card
          title="Órdenes recientes"
          subtitle="Últimas órdenes de trabajo"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/ordenes")}>
              Ver todas
            </Button>
          }
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrdenes.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                <p className="text-surface-500 dark:text-surface-400">
                  {isCliente || isMecanico
                    ? "No tienes órdenes asignadas"
                    : "No hay órdenes recientes"}
                </p>
              </div>
            ) : (
              <Table
                columns={ordenesColumns}
                data={recentOrdenes}
                keyExtractor={(o) => o.id.toString()}
                hoverable
                striped
              />
            )}
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card
          title="Stock bajo"
          subtitle="Repuestos que necesitan reposición"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/inventario")}>
              Ver inventario
            </Button>
          }
        >
          <CardContent className="p-0">
            <Table
              columns={stockColumns}
              data={lowStock}
              keyExtractor={(i) => i.id.toString()}
              hoverable
              striped
              rowClassName={(i) =>
                i.stockActual <= i.stockMinimo ? "bg-danger-50/50 dark:bg-danger-900/20" : ""
              }
            />
          </CardContent>
        </Card>
      )}

      {isAdminOrJefe && (
        <Card
          title="Reservas última semana"
          subtitle="Tendencia de citas programadas"
        >
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-2 px-4 py-4">
              {reservasChartData.map((value, index) => {
                const max = Math.max(...reservasChartData, 1);
                const height = (value / max) * 200;
                const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    <div
                      className="w-full bg-brand-100 rounded-t transition-all hover:bg-brand-200 dark:bg-brand-900/30 dark:hover:bg-brand-700"
                      style={{ height: `${Math.max(height, 20)}px` }}
                    />
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {days[index]}
                    </span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
