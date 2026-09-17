import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/authService';
import { reestablecerPasswordSchema, type ReestablecerPasswordFormData } from '../utils/validation';

export default function ReestablecerPasswordPage() {
  const { addNotification } = useUIStore();
  const params = useParams();
  const navigate = useNavigate();
  const tokenParam = params?.token ?? '';
  const tokenInicial = tokenParam ? decodeURIComponent(tokenParam) : '';
  const [token, setToken] = useState(tokenInicial);
  const [loading, setLoading] = useState(false);
  const [restablecido, setRestablecido] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState<{ nueva: boolean; confirmar: boolean }>({
    nueva: false,
    confirmar: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReestablecerPasswordFormData>({
    resolver: zodResolver(reestablecerPasswordSchema),
    defaultValues: { token, nuevaPassword: '', confirmarPassword: '' },
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

  const onSubmit = async (data: ReestablecerPasswordFormData) => {
    setLoading(true);
    try {
      await authService.reestablecerPassword({ token: data.token, nuevaPassword: data.nuevaPassword });
      setRestablecido(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-surface-500 dark:text-surface-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Enlace inválido</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
            El enlace de recuperación no tiene un token válido. Solicita uno nuevo.
          </p>
        </div>
        <Link
          to="/recuperar-password"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (restablecido) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-brand-600 dark:text-brand-300" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Contraseña restablecida</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
            Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
          <KeyRound className="h-7 w-7 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Restablecer contraseña</h2>
        <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
          Ingresa tu nueva contraseña
        </p>
      </div>

      <input type="hidden" {...register('token')} />

      <div className="space-y-5">
        <Input
          {...register('nuevaPassword')}
          type={visiblePassword.nueva ? 'text' : 'password'}
          label="Nueva contraseña"
          placeholder="Mínimo 8 caracteres"
          leftIcon={<KeyRound className="h-5 w-5" />}
          rightIcon={botonOjo('nueva', visiblePassword.nueva)}
          error={errors.nuevaPassword?.message}
          disabled={loading}
        />

        <Input
          {...register('confirmarPassword')}
          type={visiblePassword.confirmar ? 'text' : 'password'}
          label="Confirmar contraseña"
          placeholder="Repite la nueva contraseña"
          leftIcon={<KeyRound className="h-5 w-5" />}
          rightIcon={botonOjo('confirmar', visiblePassword.confirmar)}
          error={errors.confirmarPassword?.message}
          disabled={loading}
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Restablecer contraseña
        </Button>
      </div>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        ¿Recordaste tu contraseña?{' '}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
