import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Moon, Sun, Shield, Palette, Database, User, Key, Save, Loader2, Check, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select, Switch } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useUIStore, type Tema } from '../store/uiStore';
import { useEffect } from 'react';
import { authService } from '../services/authService';
import { preferenciasService } from '../services/preferenciasService';
import { perfilSchema, type PerfilFormData } from '../utils/validation';
import type { PreferenciasRequest } from '../types';

const themeOptions: { value: Tema; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Moon },
];

const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const timezoneOptions = [
  { value: 'America/Costa_Rica', label: 'Costa Rica (UTC-6)' },
  { value: 'America/Mexico_City', label: 'México (UTC-6)' },
  { value: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { value: 'America/Lima', label: 'Perú (UTC-5)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC-3)' },
  { value: 'Europe/Madrid', label: 'España (UTC+1)' },
];

type TabId = 'general' | 'apariencia' | 'notificaciones' | 'seguridad' | 'sistema';

interface ConfigForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  tema: Tema;
  idioma: string;
  zonaHoraria: string;
  notificacionesEmail: boolean;
  notificacionesPush: boolean;
  notificacionesReservas: boolean;
  notificacionesOrdenes: boolean;
  notificacionesStock: boolean;
  passwordActual: string;
  passwordNueva: string;
  confirmarPassword: string;
  dosFactores: boolean;
  sesionTimeout: number;
  logsActividad: boolean;
}

export const ConfiguracionPage = () => {
  const { user, setUser } = useAuthStore();
  const { addNotification, setTema } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loadingPreferencias, setLoadingPreferencias] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState<{ actual: boolean; nueva: boolean; confirmar: boolean }>({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const togglePassword = (campo: keyof typeof visiblePassword) =>
    setVisiblePassword((prev) => ({ ...prev, [campo]: !prev[campo] }));

  const botonOjo = (campo: keyof typeof visiblePassword, visible: boolean) => (
    <button
      type="button"
      onClick={() => togglePassword(campo)}
      className="text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: 'general', label: 'General', icon: User },
    { id: 'apariencia', label: 'Apariencia', icon: Palette },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    ...(user?.rol?.nombre === 'ADMIN' ? [{ id: 'sistema' as TabId, label: 'Sistema', icon: Database }] : []),
  ];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ConfigForm>({
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion || '',
      tema: 'system',
      idioma: 'es',
      zonaHoraria: 'America/Costa_Rica',
      notificacionesEmail: true,
      notificacionesPush: true,
      notificacionesReservas: true,
      notificacionesOrdenes: true,
      notificacionesStock: true,
      passwordActual: '',
      passwordNueva: '',
      confirmarPassword: '',
      dosFactores: false,
      sesionTimeout: 60,
      logsActividad: true,
    },
  });

  const passwordNueva = watch('passwordNueva');

  useEffect(() => {
    let activo = true;
    setLoadingPreferencias(true);
    preferenciasService
      .obtener()
      .then((prefs: PreferenciasRequest) => {
        if (!activo) return;
        reset((current) => ({
          ...current,
          tema: prefs.tema === 'light' || prefs.tema === 'dark' || prefs.tema === 'system' ? (prefs.tema as Tema) : current.tema,
          idioma: prefs.idioma || current.idioma,
          zonaHoraria: prefs.zonaHoraria || current.zonaHoraria,
          notificacionesEmail: prefs.notificacionesEmail ?? current.notificacionesEmail,
          notificacionesPush: prefs.notificacionesPush ?? current.notificacionesPush,
          notificacionesReservas: prefs.notificacionesReservas ?? current.notificacionesReservas,
          notificacionesOrdenes: prefs.notificacionesOrdenes ?? current.notificacionesOrdenes,
          notificacionesStock: prefs.notificacionesStock ?? current.notificacionesStock,
          dosFactores: prefs.dosFactores ?? current.dosFactores,
          sesionTimeout: prefs.sesionTimeout ?? current.sesionTimeout,
          logsActividad: prefs.logsActividad ?? current.logsActividad,
        }));
      })
      .catch(() => {
        if (activo) addNotification({ type: 'warning', title: 'Aviso', message: 'No se pudieron cargar tus preferencias' });
      })
      .finally(() => {
        if (activo) setLoadingPreferencias(false);
      });
    return () => {
      activo = false;
    };
  }, [reset, addNotification]);

  const guardarPreferencias = async (data: ConfigForm) => {
    const prefs: PreferenciasRequest = {
      tema: data.tema,
      idioma: data.idioma,
      zonaHoraria: data.zonaHoraria,
      notificacionesEmail: data.notificacionesEmail,
      notificacionesPush: data.notificacionesPush,
      notificacionesReservas: data.notificacionesReservas,
      notificacionesOrdenes: data.notificacionesOrdenes,
      notificacionesStock: data.notificacionesStock,
      dosFactores: data.dosFactores,
      sesionTimeout: Number(data.sesionTimeout),
      logsActividad: data.logsActividad,
    };
    await preferenciasService.guardar(prefs);
    setTema(data.tema);
  };

  const onSubmit = async (data: ConfigForm) => {
    setSaving(true);
    try {
      await guardarPreferencias(data);
      addNotification({ type: 'success', title: 'Guardado', message: 'Configuración actualizada correctamente' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la configuración';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const guardarPerfil = async (data: ConfigForm) => {
    const validacion = perfilSchema.safeParse({
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      direccion: data.direccion,
    });

    if (!validacion.success) {
      clearErrors(['nombre', 'apellido', 'telefono', 'direccion']);
      validacion.error.issues.forEach((issue) => {
        const campo = issue.path[0];
        if (campo) {
          setError(campo as 'nombre' | 'apellido' | 'telefono' | 'direccion', {
            type: 'manual',
            message: issue.message,
          });
        }
      });
      addNotification({
        type: 'error',
        title: 'Revisa tus datos',
        message: validacion.error.issues[0]?.message ?? 'Hay campos inválidos',
      });
      return;
    }

    const datos = validacion.data;
    setSaving(true);
    try {
      const actualizado = await authService.actualizarPerfil({
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono,
        direccion: datos.direccion,
      });
      setUser(actualizado);
      addNotification({ type: 'success', title: 'Perfil actualizado', message: 'Tus datos se guardaron correctamente' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (data: ConfigForm) => {
    if (data.passwordNueva !== data.confirmarPassword) {
      addNotification({ type: 'error', title: 'Error', message: 'Las contraseñas no coinciden' });
      return;
    }
    if (data.passwordNueva.length < 8) {
      addNotification({ type: 'error', title: 'Error', message: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    setSaving(true);
    try {
      await authService.cambiarPassword({ passwordActual: data.passwordActual, nuevaPassword: data.passwordNueva });
      addNotification({ type: 'success', title: 'Éxito', message: 'Contraseña actualizada correctamente' });
      reset({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  };

  const aplicarTema = (tema: Tema) => {
    setValue('tema', tema);
    setTema(tema);
  };

  const tabsConfig = {
    general: (
      <div className="space-y-6">
        <Card title="Información personal" subtitle="Datos de tu perfil">
          <CardContent>
            <form onSubmit={handleSubmit(guardarPerfil)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input {...register('nombre')} label="Nombre" error={errors.nombre?.message} disabled={saving} />
                <Input {...register('apellido')} label="Apellido" error={errors.apellido?.message} disabled={saving} />
              </div>
              <Input {...register('email')} type="email" label="Correo electrónico" error={errors.email?.message} disabled />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input {...register('telefono')} type="tel" label="Teléfono" placeholder="+506 1234 5678" error={errors.telefono?.message} disabled={saving} />
                <Input {...register('direccion')} label="Dirección" placeholder="Calle principal, San José" error={errors.direccion?.message} disabled={saving} />
              </div>
              <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
                <Button type="submit" loading={saving}>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    ),
    apariencia: (
      <div className="space-y-6">
        <Card title="Tema" subtitle="Elige cómo se ve la aplicación">
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => aplicarTema(opt.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${watch('tema') === opt.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'}`}
                >
                  <opt.icon className={`h-6 w-6 mx-auto mb-2 ${watch('tema') === opt.value ? 'text-brand-600' : 'text-surface-400 dark:text-surface-500'}`} />
                  <p className="text-sm font-medium text-center">{opt.label}</p>
                  {watch('tema') === opt.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card title="Idioma y región" subtitle="Configuración de localización">
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                value={watch('idioma')}
                onChange={(e) => setValue('idioma', e.target.value)}
                options={languageOptions}
                label="Idioma"
              />
              <Select
                value={watch('zonaHoraria')}
                onChange={(e) => setValue('zonaHoraria', e.target.value)}
                options={timezoneOptions}
                label="Zona horaria"
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
              <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                <Save className="h-4 w-4" />
                Guardar preferencias
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    notificaciones: (
      <div className="space-y-6">
        <Card title="Preferencias de notificación" subtitle="Elige qué notificaciones recibir">
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {([
                { key: 'notificacionesEmail', label: 'Notificaciones por email', desc: 'Recibir correos electrónicos' },
                { key: 'notificacionesPush', label: 'Notificaciones push', desc: 'Alertas en el navegador' },
                { key: 'notificacionesReservas', label: 'Nuevas reservas', desc: 'Cuando un cliente agenda una cita' },
                { key: 'notificacionesOrdenes', label: 'Actualizaciones de órdenes', desc: 'Cambios de estado en órdenes de trabajo' },
                { key: 'notificacionesStock', label: 'Stock bajo', desc: 'Alertas de inventario por debajo del mínimo' },
              ] as { key: keyof ConfigForm; label: string; desc: string }[]).map((notif) => (
                <label key={notif.key} className="flex items-center justify-between p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-surface-400 dark:text-surface-500" />
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white">{notif.label}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">{notif.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={watch(notif.key as 'notificacionesEmail')}
                    onChange={(checked) => setValue(notif.key as 'notificacionesEmail', checked)}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
              <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                <Save className="h-4 w-4" />
                Guardar preferencias
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    seguridad: (
      <div className="space-y-6">
        <Card title="Cambiar contraseña" subtitle="Actualiza tu contraseña de acceso">
          <CardContent>
            <form onSubmit={handleSubmit(changePassword)} className="space-y-5 max-w-md">
              <Input
                {...register('passwordActual', { required: 'Contraseña actual requerida' })}
                type={visiblePassword.actual ? 'text' : 'password'}
                label="Contraseña actual"
                placeholder="••••••••"
                leftIcon={<Key className="h-5 w-5" />}
                rightIcon={botonOjo('actual', visiblePassword.actual)}
                error={errors.passwordActual?.message}
              />
              <Input
                {...register('passwordNueva', { required: 'Nueva contraseña requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                type={visiblePassword.nueva ? 'text' : 'password'}
                label="Nueva contraseña"
                placeholder="••••••••"
                leftIcon={<Key className="h-5 w-5" />}
                rightIcon={botonOjo('nueva', visiblePassword.nueva)}
                error={errors.passwordNueva?.message}
              />
              <Input
                {...register('confirmarPassword', { required: 'Confirmar contraseña requerida' })}
                type={visiblePassword.confirmar ? 'text' : 'password'}
                label="Confirmar nueva contraseña"
                placeholder="••••••••"
                leftIcon={<Key className="h-5 w-5" />}
                rightIcon={botonOjo('confirmar', visiblePassword.confirmar)}
                error={errors.confirmarPassword?.message}
              />
              {passwordNueva && (
                <div className="text-sm text-surface-500 dark:text-surface-400">
                  Fuerza: <span className={
                    passwordNueva.length < 8 ? 'text-danger-600 dark:text-danger-400' :
                      passwordNueva.length < 10 ? 'text-accent-600' : 'text-brand-600'
                  }>{passwordNueva.length < 8 ? 'Débil' : passwordNueva.length < 10 ? 'Media' : 'Fuerte'}</span>
                </div>
              )}
              <Button type="submit" loading={saving}>
                <Key className="h-4 w-4" />
                Actualizar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card title="Autenticación de dos factores" subtitle="Añade una capa extra de seguridad">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-900 dark:text-white">2FA</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Requiere código de autenticación al iniciar sesión</p>
              </div>
              <Switch
                checked={watch('dosFactores')}
                onChange={(checked) => setValue('dosFactores', checked)}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800 mt-4">
              <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card title="Sesión" subtitle="Configuración de tiempo de espera">
          <CardContent>
            <Select
              value={watch('sesionTimeout')}
              onChange={(e) => setValue('sesionTimeout', Number(e.target.value))}
              options={[
                { value: '15', label: '15 minutos' },
                { value: '30', label: '30 minutos' },
                { value: '60', label: '1 hora' },
                { value: '120', label: '2 horas' },
                { value: '480', label: '8 horas' },
              ]}
              label="Cerrar sesión automáticamente después de"
            />
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800 mt-4">
              <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    sistema: (
      <div className="space-y-6">
        <Card title="Logs de actividad" subtitle="Registro de acciones en el sistema">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Registrar actividad</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Guarda un log de todas las acciones importantes</p>
              </div>
              <Switch
                checked={watch('logsActividad')}
                onChange={(checked) => setValue('logsActividad', checked)}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800 mt-4">
              <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card title="Información del sistema" subtitle="Versión y detalles técnicos">
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-surface-500 dark:text-surface-400">Versión</dt><dd className="font-medium">1.0.0</dd></div>
              <div><dt className="text-surface-500 dark:text-surface-400">Entorno</dt><dd className="font-medium">Producción</dd></div>
              <div><dt className="text-surface-500 dark:text-surface-400">Base de datos</dt><dd className="font-medium">PostgreSQL 16</dd></div>
              <div><dt className="text-surface-500 dark:text-surface-400">Backend</dt><dd className="font-medium">Spring Boot 3.3</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card title="Acciones peligrosas" subtitle="Operaciones irreversibles" className="border-danger-200">
          <CardContent className="space-y-4">
            <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-danger-700">Restablecer base de datos</p>
                  <p className="text-sm text-danger-600 dark:text-danger-400">Elimina todos los datos y restaura valores iniciales. ¡Irreversible!</p>
                </div>
                <Button variant="danger" size="sm" disabled>Restablecer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  };

  if (loadingPreferencias) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Configuración</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Personaliza tu experiencia</p>
        </div>
      </div>

      <div className="tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tabsConfig[activeTab]}
      </div>
    </div>
  );
};
