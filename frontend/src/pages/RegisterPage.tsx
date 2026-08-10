import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { useUIStore } from '../../store/uiStore';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await authService.register(data);
      addNotification({
        type: 'success',
        title: '¡Cuenta creada!',
        message: 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
      });
      navigate('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear la cuenta';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
        <p className="text-gray-600 mt-1">Regístrate para acceder al sistema</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Juan"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          placeholder="Pérez"
          error={errors.apellido?.message}
          {...register('apellido')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
        autoComplete="email"
      />

      <Input
        label="Teléfono"
        type="tel"
        placeholder="+34 600 000 000"
        error={errors.telefono?.message}
        {...register('telefono')}
        autoComplete="tel"
      />

      <div className="relative">
        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          autoComplete="new-password"
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

      <Input
        label="Dirección"
        placeholder="Calle Principal 123"
        error={errors.direccion?.message}
        {...register('direccion')}
        autoComplete="street-address"
      />

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {loading ? <Loader2 className="h-5 w-5" /> : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Inicia sesión
        </a>
      </p>
    </form>
  );
};