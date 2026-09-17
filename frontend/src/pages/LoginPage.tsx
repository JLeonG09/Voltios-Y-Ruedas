import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { loginSchema, type LoginFormData } from '../utils/validation';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { authService } from '../services/authService';
import { rutaInicioPorRol } from '../utils/roles';
import type { JwtResponse } from '../types/auth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { addNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const emailInicial =
    (location.state as { email?: string } | null)?.email ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailInicial },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorFormulario(null);
    try {
      const response: JwtResponse = await authService.login(data);
      login(response);
      addNotification({ type: 'success', title: 'Bienvenido', message: 'Has iniciado sesión correctamente' });
      navigate(rutaInicioPorRol(response.rol), { replace: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'No se pudo iniciar sesión. Revisá email y contraseña.';
      setErrorFormulario(message);
      if (/verifica tu correo|verificar tu correo/i.test(message)) {
        navigate(`/verificar-email?email=${encodeURIComponent(data.email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2.5 rounded-2xl bg-brand-50 px-3 py-2 dark:bg-brand-900/30">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold tracking-tight text-white shadow-card dark:bg-brand-500 dark:text-surface-950"
            aria-hidden="true"
          >
            VyR
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold tracking-tight text-brand-800 dark:text-brand-200">
              Voltios y Ruedas
            </p>
            <p className="text-[11px] text-brand-700/80 dark:text-brand-300/80">Taller automotriz</p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Accede a tu cuenta para continuar
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errorFormulario && (
          <div
            className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-800 dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-200"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 leading-snug">{errorFormulario}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            {...register('email')}
            type="email"
            autoComplete="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            disabled={loading}
          />

          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            label="Contraseña"
            placeholder="••••••••"
            leftIcon={<Lock className="h-5 w-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={
                  `rounded-lg p-0.5 text-surface-400 transition-colors ` +
                  `hover:text-surface-700 dark:text-surface-500 dark:hover:text-surface-200 ` +
                  `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
                  `dark:focus-visible:ring-brand-400`
                }
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={loading ? -1 : 0}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            error={errors.password?.message}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/recuperar-password"
            className={
              `text-sm font-medium text-brand-700 hover:text-brand-800 ` +
              `dark:text-brand-300 dark:hover:text-brand-200 ` +
              `focus:outline-none focus-visible:underline`
            }
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="border-t border-surface-100 pt-5 text-center text-sm text-surface-500 dark:border-surface-800 dark:text-surface-400">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
};
