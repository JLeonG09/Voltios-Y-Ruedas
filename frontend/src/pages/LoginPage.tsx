import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
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
    try {
      const response: JwtResponse = await authService.login(data);
      login(response);
      addNotification({ type: 'success', title: 'Bienvenido', message: 'Has iniciado sesión correctamente' });
      navigate(rutaInicioPorRol(response.rol), { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Credenciales inválidas';
      addNotification({ type: 'error', title: 'Error', message });
      if (/verifica tu correo|verificar tu correo/i.test(message)) {
        navigate(`/verificar-email?email=${encodeURIComponent(data.email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Iniciar sesión</h2>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Accede a tu cuenta</p>
      </div>

      <div className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          label="Correo electrónico"
          placeholder="tu@email.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          disabled={loading}
        />

        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Contraseña"
          placeholder="••••••••"
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
          error={errors.password?.message}
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 dark:border-surface-700 dark:text-brand-400" />
            <span className="text-sm text-surface-600 dark:text-surface-400">Recordarme</span>
          </label>
          <Link to="/recuperar-password" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Iniciar sesión
        </Button>
      </div>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium">
          Regístrate
        </Link>
      </p>
    </form>
  );
};