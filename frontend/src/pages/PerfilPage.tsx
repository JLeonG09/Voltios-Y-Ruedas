import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Key, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/authService';
import { z } from 'zod';

const regexSoloLetras = /^[\p{L}\p{M}'. -]+$/u;

const perfilSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100)
    .regex(regexSoloLetras, 'El nombre solo puede contener letras'),
  apellido: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .max(100)
    .regex(regexSoloLetras, 'El apellido solo puede contener letras'),
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(255).optional(),
});
type PerfilFormData = z.infer<typeof perfilSchema>;

const passwordSchema = z
  .object({
    passwordActual: z.string().min(1, 'La contraseña actual es obligatoria'),
    nuevaPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(255),
    confirmarPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.nuevaPassword === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PerfilPage() {
  const { user, setUser } = useAuthStore();
  const { addNotification } = useUIStore();
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const perfilForm = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const guardarPerfil = async (data: PerfilFormData) => {
    setSavingPerfil(true);
    try {
      const actualizado = await authService.actualizarPerfil(data);
      setUser(actualizado);
      addNotification({ type: 'success', title: 'Perfil actualizado', message: 'Tus datos se guardaron correctamente' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSavingPerfil(false);
    }
  };

  const cambiarPassword = async (data: PasswordFormData) => {
    setSavingPassword(true);
    try {
      await authService.cambiarPassword({ passwordActual: data.passwordActual, nuevaPassword: data.nuevaPassword });
      addNotification({ type: 'success', title: 'Contraseña cambiada', message: 'Tu contraseña se actualizó correctamente' });
      passwordForm.reset({ passwordActual: '', nuevaPassword: '', confirmarPassword: '' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setSavingPassword(false);
    }
  };

  const iniciales = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase() || 'U';
  const rolNombre = user?.rol?.nombre ?? '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Mi perfil</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Administra tu información personal y contraseña</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center text-center pt-8 pb-8">
              <div className="h-20 w-20 rounded-full bg-brand-500 flex items-center justify-center text-2xl font-bold text-white mb-4">
                {iniciales}
              </div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                {user?.nombre} {user?.apellido}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
              {rolNombre && <Badge className="mt-3">{rolNombre}</Badge>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Información personal" subtitle="Actualiza tus datos de contacto">
            <CardContent>
              <form onSubmit={perfilForm.handleSubmit(guardarPerfil)} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    {...perfilForm.register('nombre')}
                    label="Nombre"
                    placeholder="Juan"
                    leftIcon={<User className="h-5 w-5" />}
                    error={perfilForm.formState.errors.nombre?.message}
                    disabled={savingPerfil}
                  />
                  <Input
                    {...perfilForm.register('apellido')}
                    label="Apellido"
                    placeholder="Pérez"
                    leftIcon={<User className="h-5 w-5" />}
                    error={perfilForm.formState.errors.apellido?.message}
                    disabled={savingPerfil}
                  />
                </div>
                <Input
                  {...perfilForm.register('telefono')}
                  type="tel"
                  label="Teléfono"
                  placeholder="+506 1234 5678"
                  leftIcon={<Phone className="h-5 w-5" />}
                  error={perfilForm.formState.errors.telefono?.message}
                  disabled={savingPerfil}
                />
                <Input
                  {...perfilForm.register('direccion')}
                  label="Dirección"
                  placeholder="Calle principal, San José"
                  leftIcon={<MapPin className="h-5 w-5" />}
                  error={perfilForm.formState.errors.direccion?.message}
                  disabled={savingPerfil}
                />
                <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
                  <Button type="submit" loading={savingPerfil}>
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card title="Cambiar contraseña" subtitle="Actualiza tu contraseña de acceso">
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(cambiarPassword)} className="space-y-5 max-w-md">
                <Input
                  {...passwordForm.register('passwordActual')}
                  type="password"
                  label="Contraseña actual"
                  placeholder="••••••••"
                  leftIcon={<Key className="h-5 w-5" />}
                  error={passwordForm.formState.errors.passwordActual?.message}
                  disabled={savingPassword}
                />
                <Input
                  {...passwordForm.register('nuevaPassword')}
                  type="password"
                  label="Nueva contraseña"
                  placeholder="••••••••"
                  leftIcon={<Key className="h-5 w-5" />}
                  error={passwordForm.formState.errors.nuevaPassword?.message}
                  disabled={savingPassword}
                />
                <Input
                  {...passwordForm.register('confirmarPassword')}
                  type="password"
                  label="Confirmar nueva contraseña"
                  placeholder="••••••••"
                  leftIcon={<Key className="h-5 w-5" />}
                  error={passwordForm.formState.errors.confirmarPassword?.message}
                  disabled={savingPassword}
                />
                <Button type="submit" loading={savingPassword}>
                  <Key className="h-4 w-4" />
                  Actualizar contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
