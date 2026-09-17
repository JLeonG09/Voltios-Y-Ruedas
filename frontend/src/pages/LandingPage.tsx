import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench, Shield, Clock, Car, Battery, Disc, History, Users, ClipboardList,
  Calendar, ArrowRight, CheckCircle2, ChevronRight, Sun, Moon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useDarkMode } from '../hooks/useDarkMode';
import { rutaInicioPorRol } from '../utils/roles';

const servicios = [
  { icon: Wrench, title: 'Diagnostico general', desc: 'Lectura computarizada y revision mecanica completa.' },
  { icon: Disc, title: 'Frenos y suspension', desc: 'Pastillas, discos, amortiguadores y alineacion.' },
  { icon: Battery, title: 'Sistema electrico', desc: 'Bateria, alternador, arranque y cableado.' },
  { icon: ClipboardList, title: 'Mantenimiento preventivo', desc: 'Aceite, filtros, refrigerante y revision periodica.' },
  { icon: Car, title: 'Neumaticos', desc: 'Rotacion, balanceo y cambio de neumaticos.' },
  { icon: History, title: 'Historial del vehiculo', desc: 'Seguimiento y trazabilidad de cada intervencion.' },
];

const pasos = [
  { n: 1, titulo: 'Agenda tu cita', desc: 'Reservas en linea en menos de un minuto.' },
  { n: 2, titulo: 'Diagnosticamos', desc: 'Nuestro equipo evalua y propone el plan.' },
  { n: 3, titulo: 'Entrega y seguimiento', desc: 'Recibe tu vehiculo y consulta su estado cuando quieras.' },
];

const LandingPage = () => {
  const { dark, toggle: toggleDark } = useDarkMode();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const irAlPanel = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(rutaInicioPorRol(user?.rol?.nombre));
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">VyR</span>
            </div>
            <span className="font-semibold text-surface-900 dark:text-white">Voltios y Ruedas</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-surface-600 dark:text-surface-300">
            <a href="#servicios" className="hover:text-brand-700 dark:hover:text-brand-300">Servicios</a>
            <a href="#proceso" className="hover:text-brand-700 dark:hover:text-brand-300">Como funciona</a>
            <a href="#clientes" className="hover:text-brand-700 dark:hover:text-brand-300">Para clientes</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isAuthenticated ? (
              <Button onClick={irAlPanel} size="sm">
                Ir al panel <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Iniciar sesion</Button></Link>
                <Link to="/register"><Button size="sm">Crear cuenta</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-surface-50 dark:from-surface-950 dark:via-surface-950 dark:to-surface-950" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-xs font-medium">
              <Shield className="h-3.5 w-3.5" /> Taller certificado
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight text-surface-900 dark:text-white">
              Tu vehiculo en <span className="text-brand-600 dark:text-brand-400">manos expertas</span>.
            </h1>
            <p className="mt-4 text-surface-600 dark:text-surface-300 text-lg max-w-xl">
              Diagnostico, mantenimiento y reparacion con seguimiento en tiempo real. Reserva tu cita en linea y consulta el estado de tu vehiculo desde tu cuenta.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button size="lg" onClick={irAlPanel}>
                  Ir al panel <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Link to="/register"><Button size="lg">Crear cuenta gratis <ArrowRight className="h-5 w-5" /></Button></Link>
                  <Link to="/login"><Button size="lg" variant="outline">Ya tengo cuenta</Button></Link>
                </>
              )}
            </div>
            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-surface-600 dark:text-surface-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Reservas en linea 24/7</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Historial completo del vehiculo</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Notificaciones de avance</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Repuestos originales</li>
            </ul>
          </div>
          <div className="relative">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold">Reservar en 3 pasos</h3>
              </div>
              <ol className="space-y-3">
                {pasos.map(p => (
                  <li key={p.n} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 flex items-center justify-center font-semibold">{p.n}</div>
                    <div>
                      <p className="font-medium">{p.titulo}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={irAlPanel}>
                  Empezar <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="servicios" className="py-16 sm:py-20 bg-white dark:bg-surface-950 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">Nuestros servicios</h2>
            <p className="mt-2 text-surface-600 dark:text-surface-300">Atencion integral para todas las marcas y modelos.</p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicios.map(s => (
              <Card key={s.title} className="p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-surface-900 dark:text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="py-16 sm:py-20 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Como funciona</h2>
          <p className="mt-2 text-surface-600 dark:text-surface-300">Desde la reserva hasta la entrega, acompanado en todo momento.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {pasos.map(p => (
              <Card key={p.n} className="p-6">
                <div className="text-brand-600 dark:text-brand-400 font-bold text-2xl">0{p.n}</div>
                <h3 className="mt-2 font-semibold text-surface-900 dark:text-white">{p.titulo}</h3>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="clientes" className="py-16 sm:py-20 bg-brand-600 text-white dark:bg-brand-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold">Para clientes</h2>
            <p className="mt-2 text-brand-100">
              Crea una cuenta gratuita y tendras acceso a tu panel personal donde podras:
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3"><Calendar className="h-5 w-5 mt-0.5" /> Agendar, modificar y cancelar citas</li>
              <li className="flex items-start gap-3"><Car className="h-5 w-5 mt-0.5" /> Consultar el estado actual de tu vehiculo</li>
              <li className="flex items-start gap-3"><History className="h-5 w-5 mt-0.5" /> Ver historial completo de reparaciones y costos</li>
              <li className="flex items-start gap-3"><Users className="h-5 w-5 mt-0.5" /> Recibir notificaciones de cada avance</li>
            </ul>
            <div className="mt-6">
              {isAuthenticated ? (
                <Button size="lg" variant="secondary" onClick={irAlPanel}>
                  Ir a mi panel <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <Link to="/register">
                  <Button size="lg" variant="secondary">
                    Crear cuenta gratis <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="font-semibold mb-3">Acceso staff</h3>
            <p className="text-sm text-brand-100">
              Mecanicos, jefe de taller y administradores cuentan con un panel operativo para gestionar ordenes, inventario, facturacion e historial completo.
            </p>
            <div className="mt-4">
              <Link to="/login">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  Acceso staff
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-surface-900 text-surface-300 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold">VyR</span>
              </div>
              <span className="font-semibold text-white">Voltios y Ruedas</span>
            </div>
            <p className="mt-3 text-sm">Taller automotriz con atencion profesional y seguimiento digital.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Contacto</h4>
            <ul className="mt-3 text-sm space-y-1">
              <li>Tel: +506 0000 0000</li>
              <li>Email: info@voltiosyruedas.cr</li>
              <li>Horario: Lun - Sab, 8:00 - 18:00</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-3 text-sm space-y-1">
              <li>Terminos y condiciones</li>
              <li>Politica de privacidad</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-surface-500 dark:text-surface-400">
          (c) 2026 Voltios y Ruedas. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;