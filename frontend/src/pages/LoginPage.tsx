import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, type LoginFormData } from '../../utils/validation';
import { useUIStore } from '../../store/uiStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      login(response);
      addNotification({
        type: 'success',
        title: '¡Bienvenido!',
        message: `Has iniciado sesión como ${response.nombre}`,
      });
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
        <p className="text-gray-600 mt-1">Accede a tu cuenta para continuar</p>
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
        autoComplete="email"
      />

      <div className="relative">
        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          autoComplete="current-password"
        />
        <button
          type="button"
          className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">Recordarme</span>
        </label>
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {loading ? <Loader2 className="h-5 w-5" /> : 'Iniciar sesión'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <a href="/register" className="text-primary-600 hover:text-primary-500 font-medium">
          Regístrate
        </a>
      </p>
    </form>
  );
};